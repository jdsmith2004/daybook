/* The log, kept on this device first. Every record (the settings, each day, each weekly review) is its own entry in storage,
   so a long history never hits a size limit, and each change is remembered as "not synced yet" for when sync is turned on. */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  isKey,
  isReviewKey,
  logicalKey,
  normDay,
  normReview,
  normSettings,
  type Change,
  type DayKey,
  type RecordId,
  type Settings,
  type Snapshot,
} from '@daybook/core';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { useNow } from './now';

const P = 'daybook:';
const DIRTY = P + 'dirty';
const empty = (): Snapshot => ({ settings: null, days: {}, reviews: {} });

async function load(): Promise<{ snap: Snapshot; dirty: Record<string, number> }> {
  const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith(P));
  const pairs = keys.length ? await AsyncStorage.multiGet(keys) : [];
  const snap = empty();
  let dirty: Record<string, number> = {};
  for (const [k, raw] of pairs) {
    if (raw == null) continue;
    let v: unknown;
    try {
      v = JSON.parse(raw);
    } catch {
      continue;
    }
    const id = k.slice(P.length);
    if (k === DIRTY) dirty = v && typeof v === 'object' ? (v as Record<string, number>) : {};
    else if (id === 'settings') snap.settings = normSettings(v);
    else if (id.startsWith('days/') && isKey(id.slice(5))) snap.days[id.slice(5)] = normDay(v, id.slice(5));
    else if (id.startsWith('reviews/') && isReviewKey(id.slice(8))) snap.reviews[id.slice(8)] = normReview(v, id.slice(8));
  }
  return { snap, dirty };
}

function recordOf(snap: Snapshot, id: RecordId) {
  if (id === 'settings') return snap.settings;
  if (id.startsWith('days/')) return snap.days[id.slice(5)] ?? null;
  return snap.reviews[id.slice(8)] ?? null;
}

interface StoreValue {
  ready: boolean;
  snap: Snapshot;
  settings: Settings | null;
  /** today, as the log counts it (it rolls over at the new-day hour) */
  tk: DayKey;
  now: number;
  /** records changed here and not synced yet */
  dirty: Record<string, number>;
  /** apply a settings change from @daybook/core (stepOn, setCountMode ...) and show its message */
  apply: (c: Change | ((st: Settings) => Change)) => void;
  /** change anything: the function gets the whole log and gives back a new one (from the @daybook/core change functions).
      Only the records that changed are saved. Returns the new log. */
  update: (fn: (s: Snapshot) => Snapshot) => Snapshot;
  /** replace everything (a restored backup, or a first start) */
  replace: (snap: Snapshot, changed: RecordId[]) => Promise<void>;
  /** erase everything on this device */
  erase: () => Promise<void>;
  toast: string | null;
  say: (msg: string) => void;
}

const Ctx = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [snap, setSnap] = useState<Snapshot>(empty);
  const [dirty, setDirty] = useState<Record<string, number>>({});
  const [toast, setToast] = useState<string | null>(null);
  const snapRef = useRef(snap);
  const dirtyRef = useRef(dirty);
  useEffect(() => {
    snapRef.current = snap;
    dirtyRef.current = dirty;
  }, [snap, dirty]);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const now = useNow();
  const tk = logicalKey(now, snap.settings?.rollover ?? 4);

  useEffect(() => {
    load()
      .then(({ snap: s, dirty: d }) => {
        setSnap(s);
        setDirty(d);
      })
      .catch(() => undefined)
      .finally(() => setReady(true));
  }, []);

  const say = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  }, []);

  /* writes the changed records, and marks them not synced yet */
  const persist = useCallback(async (next: Snapshot, ids: RecordId[]) => {
    const d = { ...dirtyRef.current };
    const sets: [string, string][] = [];
    const dels: string[] = [];
    for (const id of ids) {
      const r = recordOf(next, id);
      d[id] = (r && 'u' in r && r.u) || Date.now();
      if (r) sets.push([P + id, JSON.stringify(r)]);
      else dels.push(P + id);
    }
    sets.push([DIRTY, JSON.stringify(d)]);
    dirtyRef.current = d;
    setDirty(d);
    await AsyncStorage.multiSet(sets);
    if (dels.length) await AsyncStorage.multiRemove(dels);
  }, []);

  const apply = useCallback(
    (c: Change | ((st: Settings) => Change)) => {
      const cur = snapRef.current;
      if (!cur.settings) return;
      const ch = typeof c === 'function' ? c(cur.settings) : c;
      const next = { ...cur, settings: ch.st };
      snapRef.current = next;
      setSnap(next);
      persist(next, ['settings']).catch(() => say('Could not save that change on this device.'));
      if (ch.toast) say(ch.toast);
    },
    [persist, say],
  );

  const update = useCallback(
    (fn: (s: Snapshot) => Snapshot) => {
      const cur = snapRef.current;
      const next = fn(cur);
      if (next === cur) return cur;
      const ids: RecordId[] = [];
      if (next.settings !== cur.settings) ids.push('settings');
      for (const k of new Set([...Object.keys(cur.days), ...Object.keys(next.days)]))
        if (cur.days[k] !== next.days[k]) ids.push(`days/${k}`);
      for (const k of new Set([...Object.keys(cur.reviews), ...Object.keys(next.reviews)]))
        if (cur.reviews[k] !== next.reviews[k]) ids.push(`reviews/${k}`);
      snapRef.current = next;
      setSnap(next);
      if (ids.length) persist(next, ids).catch(() => say('Could not save that change on this device.'));
      return next;
    },
    [persist, say],
  );

  const replace = useCallback(
    async (next: Snapshot, changed: RecordId[]) => {
      snapRef.current = next;
      setSnap(next);
      await persist(next, changed);
    },
    [persist],
  );

  const erase = useCallback(async () => {
    const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith(P));
    await AsyncStorage.multiRemove(keys);
    snapRef.current = empty();
    setSnap(empty());
    setDirty({});
  }, []);

  const value = useMemo<StoreValue>(
    () => ({ ready, snap, settings: snap.settings, tk, now, dirty, apply, update, replace, erase, toast, say }),
    [ready, snap, tk, now, dirty, apply, update, replace, erase, toast, say],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): StoreValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore needs a StoreProvider');
  return v;
}
