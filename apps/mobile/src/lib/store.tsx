/* The log, kept on this device first. Every record (the settings, each day, each weekly review) is its own entry in storage,
   so a long history never hits a size limit, and each change is remembered as "not synced yet" for when sync is turned on. */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  allDirty,
  checkNew,
  clearAcked,
  mergeRemote,
  type SyncRecord,
  isKey,
  isReviewKey,
  savedRuns,
  winGain,
  winWhy,
  type CelItem,
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
  /** for sync: the log and the dirty list right now */
  current: () => { snap: Snapshot; dirty: Record<string, number> };
  /** for sync: records from the account, merged into the log as it is now (last change wins). Gives back how many changed. */
  mergeFromAccount: (recs: SyncRecord[]) => Promise<number>;
  /** for sync: the account now has these records; each leaves the dirty list unless it changed again meanwhile */
  ackPushed: (acked: Record<string, number>) => Promise<void>;
  /** for sync: every record here is to be sent (a device joining an account and keeping its log) */
  markAllDirty: () => Promise<void>;
  /** for sync: this device takes the account's log as it is */
  replaceFromAccount: (snap: Snapshot) => Promise<void>;
  /** what is showing at the bottom: a line of words, or the points an action earned */
  toast: Toast | null;
  say: (msg: string) => void;
  /** the celebration host tells the store whether a full-screen moment is open, and takes what was earned */
  hooks: { current: Hooks };
}
export type Toast = { text: string } | { pts: number; why: string; quiet: boolean };
export interface Hooks {
  inScene: () => boolean;
  /** newly earned things to celebrate; gives back true when they were shown (or said) */
  onCelebrate: (items: CelItem[]) => void;
}
type Win = { t: number; pts: number; by: Record<string, number>; ev: boolean; quiet: boolean };

const Ctx = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [snap, setSnap] = useState<Snapshot>(empty);
  const [dirty, setDirty] = useState<Record<string, number>>({});
  const [toast, setToast] = useState<Toast | null>(null);
  const hooks = useRef<Hooks>({ inScene: () => false, onCelebrate: () => undefined });
  const winAcc = useRef<Win[]>([]);
  const noteRef = useRef<string | null>(null);
  const flushT = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedSeen = useRef<string[] | null>(null);
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

  const show = useCallback((t: Toast) => {
    setToast(t);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 'pts' in t ? 3800 : 3200);
  }, []);

  /* After each action (legacy afterAction): a run that was just saved, anything newly earned (a level, a badge, a quest, a full
     ring), and then what the action earned: "+15 points · Rode it out", or the action's own words. A celebration is the reward when
     there is one; inside a full-screen moment only the words are said. */
  const flushRef = useRef<() => void>(() => undefined);
  const schedule = useCallback(() => {
    if (flushT.current) return;
    flushT.current = setTimeout(() => {
      flushT.current = null;
      flushRef.current();
    }, 0);
  }, []);
  const say = useCallback(
    (msg: string) => {
      noteRef.current = msg;
      schedule();
    },
    [schedule],
  );

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

  /* a change the store makes by itself (marking what was seen): saved, but nothing is said */
  const commitSettings = useCallback(
    (st: Settings) => {
      const next = { ...snapRef.current, settings: st };
      snapRef.current = next;
      setSnap(next);
      persist(next, ['settings']).catch(() => undefined);
    },
    [persist],
  );
  flushRef.current = () => {
    const note = noteRef.current;
    noteRef.current = null;
    const now = Date.now();
    const acc = winAcc.current.filter((x) => now - x.t <= 3000);
    winAcc.current = [];
    const cur = snapRef.current;
    const st = cur.settings;
    let fired = false;
    let quiet = false;
    let pts = 0;
    let ev = false;
    const by: Record<string, number> = {};
    acc.forEach((x) => {
      pts += x.pts;
      ev = ev || x.ev;
      quiet = quiet || x.quiet;
      Object.keys(x.by).forEach((k) => (by[k] = (by[k] || 0) + x.by[k]));
    });
    if (st) {
      const tkNow = logicalKey(now, st.rollover);
      const sv = savedRuns(cur.days, st, tkNow);
      const was = savedSeen.current;
      savedSeen.current = sv.saved;
      const items: CelItem[] = [];
      if (was && sv.saved.some((k) => was.indexOf(k) < 0)) items.push({ type: 'saved', run: sv.cur });
      const r = checkNew(cur.days, st, cur.reviews, tkNow, quiet);
      if (r.st) commitSettings(r.st);
      if (r.items.length) fired = true;
      items.push(...r.items);
      if (items.length) hooks.current.onCelebrate(items);
    }
    if (fired) return;
    if (hooks.current.inScene() || (!pts && !ev)) {
      if (note) show({ text: note });
      return;
    }
    if (!pts) {
      show({ text: note || (quiet ? 'Logged. That took honesty.' : 'Logged. That counts.') });
      return;
    }
    if (st && st.celebrate === false) show({ text: '+' + pts + ' point' + (pts === 1 ? '' : 's') + '. ' + (note || winWhy(by, quiet)) });
    else show({ pts, why: note || winWhy(by, quiet), quiet });
  };
  /* the first look after the app opens only takes note of what is already saved and seen */
  useEffect(() => {
    if (!ready) return;
    const st = snapRef.current.settings;
    if (!st) return;
    const tkNow = logicalKey(Date.now(), st.rollover);
    if (savedSeen.current == null) savedSeen.current = savedRuns(snapRef.current.days, st, tkNow).saved;
    if (!st.seen || (st.seen.lad || 0) < 3) {
      const r = checkNew(snapRef.current.days, st, snapRef.current.reviews, tkNow, false);
      if (r.st) commitSettings(r.st);
    }
  }, [ready, snap.settings, commitSettings]);

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
      else schedule();
    },
    [persist, say, schedule],
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
      /* what this change earned (legacy winNote): the points gained on the changed days; a slip logged is said quietly */
      const keys = ids.filter((x) => x.startsWith('days/')).map((x) => x.slice(5));
      if (keys.length && next.settings) {
        const w = winGain(cur.days, next.days, next.settings, keys);
        const slips = (d: Snapshot['days']) => keys.reduce((a, k) => a + (d[k]?.events.filter((e) => e.outcome === 'slipped').length || 0), 0);
        const quiet = slips(next.days) > slips(cur.days);
        if (w.pts || w.ev) winAcc.current.push({ t: Date.now(), pts: w.pts, by: w.by, ev: w.ev, quiet });
      }
      if (ids.length) schedule();
      return next;
    },
    [persist, say, schedule],
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

  const saveDirty = useCallback(async (d: Record<string, number>) => {
    dirtyRef.current = d;
    setDirty(d);
    await AsyncStorage.setItem(DIRTY, JSON.stringify(d));
  }, []);
  const current = useCallback(() => ({ snap: snapRef.current, dirty: dirtyRef.current }), []);
  /* writes records that came from the account: saved here, but not marked as changed here */
  const writeQuiet = useCallback(async (next: Snapshot, ids: RecordId[]) => {
    const sets: [string, string][] = [];
    const dels: string[] = [];
    for (const id of ids) {
      const r = recordOf(next, id);
      if (r) sets.push([P + id, JSON.stringify(r)]);
      else dels.push(P + id);
    }
    if (sets.length) await AsyncStorage.multiSet(sets);
    if (dels.length) await AsyncStorage.multiRemove(dels);
  }, []);
  const mergeFromAccount = useCallback(
    async (recs: SyncRecord[]) => {
      const m = mergeRemote(snapRef.current, dirtyRef.current, recs);
      if (!m.changed.length) return 0;
      snapRef.current = m.snap;
      setSnap(m.snap);
      await writeQuiet(m.snap, m.changed);
      await saveDirty(m.dirty);
      return m.changed.length;
    },
    [writeQuiet, saveDirty],
  );
  const ackPushed = useCallback(async (acked: Record<string, number>) => saveDirty(clearAcked(dirtyRef.current, acked)), [saveDirty]);
  const markAllDirty = useCallback(async () => saveDirty(allDirty(snapRef.current, dirtyRef.current)), [saveDirty]);
  const replaceFromAccount = useCallback(
    async (next: Snapshot) => {
      const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith(P) && k !== DIRTY);
      if (keys.length) await AsyncStorage.multiRemove(keys);
      const ids: RecordId[] = [];
      if (next.settings) ids.push('settings');
      Object.keys(next.days).forEach((k) => ids.push(`days/${k}`));
      Object.keys(next.reviews).forEach((k) => ids.push(`reviews/${k}`));
      snapRef.current = next;
      setSnap(next);
      savedSeen.current = null;
      await writeQuiet(next, ids);
      await saveDirty({});
    },
    [writeQuiet, saveDirty],
  );

  const value = useMemo<StoreValue>(
    () => ({
      ready,
      snap,
      settings: snap.settings,
      tk,
      now,
      dirty,
      apply,
      update,
      replace,
      erase,
      current,
      mergeFromAccount,
      ackPushed,
      markAllDirty,
      replaceFromAccount,
      toast,
      say,
      hooks,
    }),
    [ready, snap, tk, now, dirty, apply, update, replace, erase, current, mergeFromAccount, ackPushed, markAllDirty, replaceFromAccount, toast, say],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): StoreValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore needs a StoreProvider');
  return v;
}
