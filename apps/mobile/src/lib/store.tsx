/* The log, kept on this device first. Every record (the settings, each day, each weekly review, each journal entry) is its own entry in storage,
   so a long history never hits a size limit, and each change is remembered as "not synced yet" for when sync is turned on. */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  allDirty,
  checkNew,
  defaultSettings,
  LADDER_V,
  clearAcked,
  mergeRemote,
  mergeDay,
  type SyncRecord,
  isKey,
  isReviewKey,
  isJnId,
  normJEntry,
  savedRuns,
  winGain,
  winWhy,
  keepPoints,
  freshSeen,
  unseeTakenBack,
  type FreshSeen,
  type CelItem,
  logicalKey,
  mergeDirty,
  normDay,
  normReview,
  normSettings,
  restampRecords,
  type Change,
  type DayKey,
  type RecordId,
  type Settings,
  type Snapshot,
  STUCK_LINE,
} from '@daybook/core';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { useNow } from './now';

const P = 'daybook:';
/** said when a change could not be written to the phone's storage */
export const SAVE_FAILED = 'That change shows here but could not be saved on this phone. Try again in a moment. ' + STUCK_LINE;
const DIRTY = P + 'dirty';
/* this phone's own log, kept for PREV_DAYS after it was replaced by the account's (the first sign-in's "Use my account's
   log here"), so that choice can be undone. Outside the P keys, so nothing that reads or clears the log touches it. */
const PREV = 'daybook~prev:';
const PREV_AT = 'daybook~prev';
export const PREV_DAYS = 7;
const empty = (): Snapshot => ({ settings: null, days: {}, reviews: {}, journal: {} });

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
    else if (id.startsWith('journal/') && isJnId(id.slice(8))) {
      const e = normJEntry(v, id.slice(8));
      if (e) snap.journal![e.id] = e;
    }
  }
  return { snap, dirty };
}

function recordOf(snap: Snapshot, id: RecordId) {
  if (id === 'settings') return snap.settings;
  if (id.startsWith('days/')) return snap.days[id.slice(5)] ?? null;
  if (id.startsWith('journal/')) return snap.journal?.[id.slice(8)] ?? null;
  return snap.reviews[id.slice(8)] ?? null;
}

interface StoreValue {
  ready: boolean;
  /** the log could not be read at launch: nothing is shown or saved until a retry works, so a fresh start never writes
      over the real log */
  loadFailed: boolean;
  retryLoad: () => void;
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
  update: (fn: (s: Snapshot) => Snapshot, opts?: { takeBack?: boolean }) => Snapshot;
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
  /** for sync: these records get the account's time and are sent again (they were stamped while the clock was ahead) */
  restamp: (ids: string[], u: number) => Promise<void>;
  /** for sync: this device takes the account's log as it is (a copy of this phone's own is kept for PREV_DAYS) */
  replaceFromAccount: (snap: Snapshot) => Promise<void>;
  /** the copy of this phone's own log kept after it was replaced: how many days, and when; null when there is none */
  prev: { n: number; at: number } | null;
  /** brings the kept copy back into the log (joined day by day, nothing here is removed) and marks it to sync; how many
      days came back */
  restorePrev: () => Promise<number>;
  /** what is showing at the bottom: a line of words, or the points an action earned */
  toast: Toast | null;
  /** a short message; with undo, it stays a little longer and carries an Undo the person can tap (built once, the
      premium pass of October 26, 2026) */
  say: (msg: string, undo?: () => void) => void;
  /** hides the message now (after its Undo was tapped) */
  hush: () => void;
  /** the celebration host tells the store whether a full-screen moment is open, and takes what was earned */
  hooks: { current: Hooks };
}
export type Toast = { text: string; undo?: () => void } | { pts: number; why: string; quiet: boolean };

/** how long a message stays: long enough to read (a long line gets longer), longer still when it offers Undo */
export function toastMs(t: Toast): number {
  if ('pts' in t) return 3800;
  if (t.undo) return 8000;
  return Math.min(7000, Math.max(3200, 1800 + t.text.length * 45));
}
export interface Hooks {
  inScene: () => boolean;
  /** newly earned things to celebrate; gives back true when they were shown (or said) */
  onCelebrate: (items: CelItem[]) => void;
  /** a mistaken log was taken back (Undo): its badges (and the level it reached) are no longer earned, so any celebration
      of them still waiting is dropped */
  onTakeBack?: (badges: string[], level: boolean) => void;
}
type Win = { t: number; pts: number; by: Record<string, number>; ev: boolean; quiet: boolean };

const Ctx = createContext<StoreValue | null>(null);
/** how long what a change marked seen can still be taken back by an Undo (the Undo is offered for a few seconds) */
const FRESH_MS = 10 * 60_000;

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [loadTry, setLoadTry] = useState(0);
  /* nothing is written until the log has been read, so a failed read can never be followed by a save over it */
  const loaded = useRef(false);
  const [snap, setSnap] = useState<Snapshot>(empty);
  const [dirty, setDirty] = useState<Record<string, number>>({});
  const [toast, setToast] = useState<Toast | null>(null);
  const hooks = useRef<Hooks>({ inScene: () => false, onCelebrate: () => undefined });
  const winAcc = useRef<Win[]>([]);
  const noteRef = useRef<string | null>(null);
  const flushT = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedSeen = useRef<string[] | null>(null);
  /* what each change marked seen in the last minutes (badges, a level), so an Undo right after a mistaken log can take
     back what that log alone made new (core unseeTakenBack) */
  const freshRef = useRef<{ t: number; f: FreshSeen }[]>([]);
  const snapRef = useRef(snap);
  const dirtyRef = useRef(dirty);
  /* the latest change time this copy has had for each record id, so writing the dirty list keeps marks only another copy
     (a second browser tab) made (core mergeDirty) */
  const seenRef = useRef<Record<string, number>>({});
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
        /* the refs first: the first screen's effects run before this provider's own, and a change they make (graduation,
           the start moving) reads the loaded snapshot, not the empty one */
        snapRef.current = s;
        dirtyRef.current = d;
        seenRef.current = { ...d };
        setSnap(s);
        setDirty(d);
        loaded.current = true;
        setLoadFailed(false);
      })
      .catch(() => setLoadFailed(true))
      .finally(() => setReady(true));
  }, [loadTry]);
  const retryLoad = useCallback(() => setLoadTry((n) => n + 1), []);

  const show = useCallback((t: Toast) => {
    setToast(t);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), toastMs(t));
  }, []);

  /* After each action (legacy afterAction): a run that was just saved, anything newly earned (a level, a badge), and then
     what the action earned: "+15 points · Rode it out", or the action's own words. A celebration is the reward when
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
    (msg: string, undo?: () => void) => {
      /* an offer to undo is shown on its own, after what the change itself would say */
      if (undo) setTimeout(() => show({ text: msg, undo }), 0);
      else {
        noteRef.current = msg;
        schedule();
      }
    },
    [schedule, show],
  );
  const hush = useCallback(() => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(null);
  }, []);

  /* the dirty list as it goes to storage: this copy's own, with any marks another copy of Daybook (a second browser tab)
     left there (core mergeDirty). Read just before the write, so the two copies do not wipe out each other's marks. */
  const dirtyEntry = useCallback(async (): Promise<[string, string]> => {
    const mine = dirtyRef.current;
    for (const id of Object.keys(mine)) seenRef.current[id] = Math.max(seenRef.current[id] ?? -1, mine[id]);
    let stored: Record<string, number> = {};
    try {
      const raw = await AsyncStorage.getItem(DIRTY);
      const v = raw ? JSON.parse(raw) : {};
      stored = v && typeof v === 'object' ? v : {};
    } catch {
      stored = {};
    }
    return [DIRTY, JSON.stringify(mergeDirty(stored, dirtyRef.current, seenRef.current))];
  }, []);
  const writeDirty = useCallback(async () => {
    const [k, v] = await dirtyEntry();
    await AsyncStorage.setItem(k, v);
  }, [dirtyEntry]);

  /* writes the changed records, and marks them not synced yet (in the same write, so a record is never saved unmarked) */
  const persist = useCallback(
    async (next: Snapshot, ids: RecordId[]) => {
      if (!loaded.current) throw new Error('The log is not open yet.');
      const d = { ...dirtyRef.current };
      const sets: [string, string][] = [];
      const dels: string[] = [];
      for (const id of ids) {
        const r = recordOf(next, id);
        d[id] = (r && 'u' in r && r.u) || Date.now();
        if (r) sets.push([P + id, JSON.stringify(r)]);
        else dels.push(P + id);
      }
      dirtyRef.current = d;
      setDirty(d);
      sets.push(await dirtyEntry());
      await AsyncStorage.multiSet(sets);
      if (dels.length) await AsyncStorage.multiRemove(dels);
    },
    [dirtyEntry],
  );

  /* a change the store makes by itself (marking what was seen): saved, but nothing is said */
  const commitSettings = useCallback(
    (st: Settings) => {
      const next = { ...snapRef.current, settings: st };
      snapRef.current = next;
      setSnap(next);
      persist(next, ['settings']).catch(() => say(SAVE_FAILED));
    },
    [persist, say],
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
      if (r.st) {
        freshRef.current = freshRef.current.filter((x) => now - x.t < FRESH_MS).concat({ t: now, f: freshSeen(st, r.st) });
        commitSettings(r.st);
      }
      /* weekly quests are retired: one finished in the last week before that is marked seen (its points stay), never celebrated */
      const earned = r.items.filter((it) => it.type !== 'quest');
      if (earned.length) fired = true;
      items.push(...earned);
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
    if (!st.seen || (st.seen.lad || 0) < LADDER_V) {
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
      persist(next, ['settings']).catch(() => say(SAVE_FAILED));
      if (ch.toast) say(ch.toast);
      else schedule();
    },
    [persist, say, schedule],
  );

  const update = useCallback(
    (fn: (s: Snapshot) => Snapshot, opts?: { takeBack?: boolean }) => {
      const cur = snapRef.current;
      let next = fn(cur);
      if (next === cur) return cur;
      /* points are never taken away: a change that removes or changes an entry keeps the points shown until now as a
         floor (core keepPoints). takeBack: the Undo right after a mistaken log, whose points were never really earned. */
      if (!opts?.takeBack && next.settings && next.settings === cur.settings) {
        const lowered = Object.keys(cur.days).some((k) => {
          const a = cur.days[k]?.events || [];
          const b = next.days[k]?.events || [];
          return a.length > 0 && b.length <= a.length && next.days[k] !== cur.days[k] && JSON.stringify(a) !== JSON.stringify(b);
        });
        const kept = lowered ? keepPoints(cur.days, next.days, next.settings, next.reviews, logicalKey(Date.now(), next.settings.rollover)) : null;
        if (kept) next = { ...next, settings: kept };
      }
      /* the Undo of a mistaken log: what it alone made new (the Honest log badge, a level) is no longer earned, so it is
         taken back off the seen list and its waiting celebration is dropped. Never a badge earned from a real log. */
      if (opts?.takeBack && next.settings) {
        const t = Date.now();
        const recent = freshRef.current.filter((x) => t - x.t < FRESH_MS);
        const f: FreshSeen = {
          badges: [...new Set(recent.flatMap((x) => x.f.badges))],
          level: recent.reduce<number | null>((a, x) => (x.f.level == null ? a : a == null ? x.f.level : Math.min(a, x.f.level)), null),
        };
        const back =
          f.badges.length || f.level != null ? unseeTakenBack(next.days, next.settings, next.reviews, logicalKey(t, next.settings.rollover), f) : null;
        if (back) {
          next = { ...next, settings: back.st };
          freshRef.current = recent.map((x) => ({
            t: x.t,
            f: { badges: x.f.badges.filter((id) => back.badges.indexOf(id) < 0), level: back.level ? null : x.f.level },
          }));
          hooks.current.onTakeBack?.(back.badges, back.level);
        }
      }
      const ids: RecordId[] = [];
      if (next.settings !== cur.settings) ids.push('settings');
      for (const k of new Set([...Object.keys(cur.days), ...Object.keys(next.days)])) if (cur.days[k] !== next.days[k]) ids.push(`days/${k}`);
      for (const k of new Set([...Object.keys(cur.reviews), ...Object.keys(next.reviews)])) if (cur.reviews[k] !== next.reviews[k]) ids.push(`reviews/${k}`);
      const [ja, jb] = [cur.journal || {}, next.journal || {}];
      if (ja !== jb) for (const k of new Set([...Object.keys(ja), ...Object.keys(jb)])) if (ja[k] !== jb[k]) ids.push(`journal/${k}`);
      snapRef.current = next;
      setSnap(next);
      if (ids.length) persist(next, ids).catch(() => say(SAVE_FAILED));
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

  const saveDirty = useCallback(
    async (d: Record<string, number>) => {
      dirtyRef.current = d;
      setDirty(d);
      await writeDirty();
    },
    [writeDirty],
  );
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
      /* the marks change before any wait, so a change made during the write keeps its "not synced yet" mark */
      const marks = saveDirty(m.dirty);
      await writeQuiet(m.snap, m.changed);
      await marks;
      if (dirtyRef.current !== m.dirty) await writeDirty();
      return m.changed.length;
    },
    [writeQuiet, saveDirty, writeDirty],
  );
  const ackPushed = useCallback(async (acked: Record<string, number>) => saveDirty(clearAcked(dirtyRef.current, acked)), [saveDirty]);
  const markAllDirty = useCallback(async () => saveDirty(allDirty(snapRef.current, dirtyRef.current)), [saveDirty]);
  const restamp = useCallback(
    async (ids: string[], u: number) => {
      const m = restampRecords(snapRef.current, dirtyRef.current, ids, u);
      snapRef.current = m.snap;
      setSnap(m.snap);
      const marks = saveDirty(m.dirty);
      await writeQuiet(m.snap, ids.filter((id) => recordOf(m.snap, id as RecordId)) as RecordId[]);
      await marks;
    },
    [writeQuiet, saveDirty],
  );
  const [prev, setPrev] = useState<{ n: number; at: number } | null>(null);
  /* the kept copy: read once the log is open, and let go after PREV_DAYS */
  useEffect(() => {
    if (!ready || loadFailed) return;
    (async () => {
      const raw = await AsyncStorage.getItem(PREV_AT);
      const v = raw ? (JSON.parse(raw) as { n: number; at: number }) : null;
      if (v && Date.now() - v.at < PREV_DAYS * 86400_000) setPrev(v);
      else if (v) {
        const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith(PREV));
        await AsyncStorage.multiRemove([...keys, PREV_AT]);
      }
    })().catch(() => undefined);
  }, [ready, loadFailed]);
  const replaceFromAccount = useCallback(
    async (next: Snapshot) => {
      const old = snapRef.current;
      /* first a copy of this phone's own log, so the choice can be undone for a week. If the phone has no room for it,
         the choice still goes ahead (the person made it, after seeing the counts). */
      try {
        const was = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith(PREV));
        if (was.length) await AsyncStorage.multiRemove(was);
        const copy: [string, string][] = [];
        if (old.settings) copy.push([PREV + 'settings', JSON.stringify(old.settings)]);
        Object.keys(old.days).forEach((k) => copy.push([PREV + 'days/' + k, JSON.stringify(old.days[k])]));
        Object.keys(old.reviews).forEach((k) => copy.push([PREV + 'reviews/' + k, JSON.stringify(old.reviews[k])]));
        Object.keys(old.journal || {}).forEach((k) => copy.push([PREV + 'journal/' + k, JSON.stringify(old.journal![k])]));
        if (Object.keys(old.days).length || Object.keys(old.reviews).length || Object.keys(old.journal || {}).length) {
          const meta = { n: Object.keys(old.days).length, at: Date.now() };
          copy.push([PREV_AT, JSON.stringify(meta)]);
          await AsyncStorage.multiSet(copy);
          setPrev(meta);
        }
      } catch {
        /* no room for the copy */
      }
      const ids: RecordId[] = [];
      if (next.settings) ids.push('settings');
      Object.keys(next.days).forEach((k) => ids.push(`days/${k}`));
      Object.keys(next.reviews).forEach((k) => ids.push(`reviews/${k}`));
      Object.keys(next.journal || {}).forEach((k) => ids.push(`journal/${k}`));
      snapRef.current = next;
      setSnap(next);
      savedSeen.current = null;
      /* the account's records are written before anything here is removed, so a phone that stops halfway still has a log */
      await writeQuiet(next, ids);
      const keep = new Set(ids.map((id) => P + id));
      const stale = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith(P) && k !== DIRTY && !keep.has(k));
      if (stale.length) await AsyncStorage.multiRemove(stale);
      /* this device now holds the account's log as it is: nothing here, in any tab, is waiting to be sent */
      dirtyRef.current = {};
      setDirty({});
      await AsyncStorage.setItem(DIRTY, '{}');
    },
    [writeQuiet],
  );
  const restorePrev = useCallback(async () => {
    const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith(PREV));
    const pairs = keys.length ? await AsyncStorage.multiGet(keys) : [];
    const cur = snapRef.current;
    const next: Snapshot = { settings: cur.settings, days: { ...cur.days }, reviews: { ...cur.reviews }, journal: { ...(cur.journal || {}) } };
    const ids: RecordId[] = [];
    const now = Date.now();
    let n = 0;
    for (const [k, raw] of pairs) {
      if (!raw) continue;
      const id = k.slice(PREV.length);
      let v: unknown;
      try {
        v = JSON.parse(raw);
      } catch {
        continue;
      }
      if (id.startsWith('days/') && isKey(id.slice(5))) {
        const key = id.slice(5);
        const day = normDay(v, key);
        const j = next.days[key] ? mergeDay(next.days[key], day) : { ...day, u: now };
        if (!j) continue;
        next.days[key] = { ...j, u: Math.max(j.u, now) };
        ids.push(`days/${key}`);
        n++;
      } else if (id.startsWith('reviews/') && isReviewKey(id.slice(8)) && !next.reviews[id.slice(8)]) {
        next.reviews[id.slice(8)] = { ...normReview(v, id.slice(8)), u: now };
        ids.push(`reviews/${id.slice(8)}`);
      } else if (id.startsWith('journal/') && isJnId(id.slice(8)) && !next.journal![id.slice(8)]) {
        const e = normJEntry(v, id.slice(8));
        if (e) {
          next.journal![e.id] = { ...e, u: now };
          ids.push(`journal/${e.id}`);
        }
      }
    }
    snapRef.current = next;
    setSnap(next);
    if (ids.length) await persist(next, ids);
    await AsyncStorage.multiRemove([...keys, PREV_AT]);
    setPrev(null);
    return n;
  }, [persist]);

  const value = useMemo<StoreValue>(
    () => ({
      ready,
      loadFailed,
      retryLoad,
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
      restamp,
      replaceFromAccount,
      prev,
      restorePrev,
      toast,
      say,
      hush,
      hooks,
    }),
    [
      ready,
      snap,
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
      restamp,
      replaceFromAccount,
      toast,
      say,
      hush,
    ],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): StoreValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore needs a StoreProvider');
  return v;
}

/** the settings that care uses (SOS, the tools, Talk it through, logging): the saved ones, or the starting ones while setup
    is not done yet, so help never waits for the setup. Before setup, setting changes are not kept (apply skips them); what is
    logged is kept, and counts once setup is done. */
export function useCareSettings(): Settings {
  const { snap, tk } = useStore();
  return useMemo(() => snap.settings ?? defaultSettings(tk), [snap.settings, tk]);
}
