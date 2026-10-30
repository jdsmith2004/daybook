/* Sync, the device side. The log lives on the device first; sync copies changes to the person's own account and back.
   The rule is the same everywhere: per record, the change made last wins (each record carries u, when it was changed).

   One exception keeps every entry (the premium pass, October 26, 2026): when this device changed a day or the settings
   that the account also changed, the two copies are joined instead (mergeDay, keepEarned), and the joined copy is sent.

   A device remembers which records it changed and has not sent yet ("dirty": record id -> the change time it had). A record
   deleted here (a day whose last entry was removed) is gone from the log but stays dirty, with the time it was deleted, so
   the deletion reaches the account and an older copy coming back from the account does not bring it back.

   One round: pull what the account saved since the last pull, merge it, then push what is still dirty. Pulling first means
   the push sends the merged log, and records the account already has newer copies of are dropped before they are sent.
   The network parts take a transport, so the same code runs against the real API and, in tests, against the API's own
   handler with an in-memory table. Checked by services/api/test/client.test.ts. */
import { keepEarned, normRecord, parseId, toRecords, type RecordId, type SyncRecord } from './data';
import type { JEntry } from './journal-entries';
import { goneMark } from './mutate';
import { keepPat, keepSup } from './supporter';
import type { Day, Settings, Snapshot } from './types';

/** the records this device changed and has not sent yet: id -> the change time it had */
export type Dirty = Record<string, number>;

export interface PullPage {
  records: unknown[];
  cursor: string | null;
  /** the server's clock when it answered */
  now: number;
}
export interface PushAnswer {
  saved: string[];
  stale: string[];
  bad: { id: unknown; why: string }[];
  now: number;
}
export interface SyncTransport {
  pull(since: number, cursor: string | null): Promise<PullPage>;
  push(records: SyncRecord[]): Promise<PushAnswer>;
}

/** the most records, and bytes, sent in one request (the API allows 200 and 1,000,000) */
export const PUSH_N = 200;
export const PUSH_BYTES = 800_000;
/** the API refuses records larger than these; a record this large is reported, not sent forever */
export const MAX_SETTINGS_BYTES = 256_000;
export const MAX_RECORD_BYTES = 64_000;

/** the record a snapshot holds for an id, or null when there is none */
export function recordOf(s: Snapshot, id: RecordId) {
  const p = parseId(id);
  if (!p) return null;
  if (p.kind === 'settings') return s.settings;
  if (p.kind === 'days') return s.days[p.key] ?? null;
  if (p.kind === 'journal') return s.journal?.[p.key] ?? null;
  return s.reviews[p.key] ?? null;
}

/** everything the account saved since `since`, every page. `now` is the server's time when the pull started: the next
    pull starts there (the API itself overlaps pulls by a minute, so nothing saved during this one is missed). */
export async function pullAll(t: SyncTransport, since: number, maxPages = 1000): Promise<{ records: SyncRecord[]; now: number }> {
  const out: SyncRecord[] = [];
  let cursor: string | null = null;
  let first: number | null = null;
  for (let n = 0; n < maxPages; n++) {
    const page = await t.pull(since, cursor);
    if (first == null) first = page.now;
    for (const raw of page.records) {
      const r = normRecord(raw);
      if (r) out.push(r);
    }
    cursor = page.cursor;
    if (!cursor) return { records: out, now: first };
  }
  throw new Error('The account sent too many pages. Try again.');
}

/** a record's change time here: the record's own, or for a record deleted here and not sent yet, when it was deleted */
function localU(s: Snapshot, dirty: Dirty, id: RecordId): number | null {
  const r = recordOf(s, id);
  if (r) return r.u || 0;
  return dirty[id] != null ? dirty[id] : null;
}

/* What an older app version does not know. It reads a day through its own normDay, which drops fields it has never
   heard of, so when it changes that day (a new entry, a check-in) the copy it sends comes back without them: how a slip
   felt after (fa) and the feeling before (fb, older slips), the situation and the after-slip mark on a plan (ft, pr, fw),
   the mood and urges of the check-in (md, u), the answer to "How are you feeling today?" (df). None of these is ever
   taken off by the app once set, so a copy without one that this device has is a copy from an app that cannot see it. */
const EV_KEEP = ['fb', 'fa'] as const;
const TALK_KEEP = ['pr', 'fw', 'ft'] as const;
const CI_KEEP = ['md', 'u'] as const;
const P_KEEP = ['df'] as const;

/** fills in, from `had`, the fields that only a newer app knows and `day` is missing (see EV_KEEP above), so an older app
    version that changed the day never takes them away. A slip's fields come back only while it is still a slip, and a
    plan's only to the same plan (by id). Gives back `day` itself when nothing was missing. */
export function keepNewer(day: Day, had: Day | undefined): Day {
  if (!had) return day;
  let filled = false;
  const fill = <T extends object>(to: T, from: object | null | undefined, keys: readonly string[]): T => {
    if (!from) return to;
    let out = to;
    for (const k of keys) {
      const v = (from as Record<string, unknown>)[k];
      if (v === undefined || k in to) continue;
      if (out === to) out = { ...to };
      (out as Record<string, unknown>)[k] = v;
      filled = true;
    }
    return out;
  };
  const before = new Map(had.events.map((e) => [e.id, e]));
  const events = day.events.map((e) => (e.outcome === 'slipped' && before.get(e.id)?.outcome === 'slipped' ? fill(e, before.get(e.id), EV_KEEP) : e));
  const checkin = day.checkin ? fill(day.checkin, had.checkin, CI_KEEP) : day.checkin;
  let p = day.p ? fill(day.p, had.p, P_KEEP) : day.p;
  if (p && p.tt && had.p?.tt) {
    const talks = new Map(had.p.tt.map((t) => [t.id, t]));
    const tt = p.tt.map((t) => fill(t, talks.get(t.id), TALK_KEEP));
    if (tt.some((t, i) => t !== p!.tt![i])) p = { ...p, tt };
  }
  return filled ? { ...day, events, checkin, p } : day;
}

/** Two copies of one day, both changed (two devices logged on the same day before syncing): joined entry by entry, so no
    entry is lost. An entry in both is taken from the newer copy; an entry in one only is kept, unless the other copy
    deleted it (Day.gone): a delete wins over an older copy. The check-in and the day's plan come from the newer copy, or
    from the older one when the newer has none. What only a newer app version knows is kept from either copy (keepNewer).
    The joined day gets a change time past both, so it wins everywhere. Gives back null when nothing is left in it. */
export function mergeDay(a: Day, b: Day): Day | null {
  const [newer, older] = (b.u || 0) > (a.u || 0) ? [b, a] : [a, b];
  const gone = [...new Set([...(older.gone || []), ...(newer.gone || [])])].slice(-100);
  const out = new Set(gone);
  const events: Day['events'] = [];
  const seen = new Set<string>();
  for (const e of [...newer.events, ...older.events]) {
    if (seen.has(e.id) || out.has(goneMark(e.id))) continue;
    seen.add(e.id);
    events.push(e);
  }
  const checkin = newer.checkin ?? older.checkin;
  const p = newer.p ?? older.p;
  if (!events.length && !checkin && !p) return null;
  const day: Day = { d: newer.d, events, checkin, p, u: Math.max(a.u || 0, b.u || 0) + 1 };
  if (gone.length) day.gone = gone;
  return keepNewer(day, older);
}

const same = (x: unknown, y: unknown) => JSON.stringify(x) === JSON.stringify(y);
const bodyOf = (d: Day) => ({ e: d.events, c: d.checkin, p: d.p, g: d.gone || [] });

/** merges records from the account into the log. A record replaces what is here when it was changed later and this
    device has nothing of its own waiting to send for it. When both changed it, a day is joined entry by entry (mergeDay)
    and settings keep what each side earned (keepEarned); the joined record is marked to send, so the account gets it too.
    A deletion from the account (another device deleted that day, or everything) removes the record here when it is the
    newer change: a delete wins. The ids that changed come back, with the dirty list after the merge. */
export function mergeRemote(s: Snapshot, dirty: Dirty, recs: SyncRecord[]): { snap: Snapshot; changed: RecordId[]; dirty: Dirty } {
  const snap: Snapshot = { settings: s.settings, days: { ...s.days }, reviews: { ...s.reviews }, journal: { ...(s.journal || {}) } };
  const jn = snap.journal!;
  const d: Dirty = { ...dirty };
  const changed = new Set<RecordId>();
  /* the newest copy of each id, if the account sent one twice */
  const best = new Map<string, SyncRecord>();
  for (const r of recs) {
    const cur = best.get(r.id);
    if (!cur || r.u > cur.u) best.set(r.id, r);
  }
  for (const r of best.values()) {
    const p = parseId(r.id)!;
    const mine = d[r.id] != null;
    const here = localU(snap, d, r.id);
    /* both sides changed it: join them, and send the joined copy */
    if (mine && r.data && p.kind === 'days' && snap.days[p.key]) {
      const local = snap.days[p.key];
      const j = mergeDay(local, r.data as Day);
      if (j && same(bodyOf(j), bodyOf(local)) && (local.u || 0) >= r.u) continue;
      if (j) snap.days[p.key] = j;
      else delete snap.days[p.key];
      d[r.id] = j ? j.u : Math.max(local.u || 0, r.u) + 1;
      changed.add(r.id);
      continue;
    }
    if (mine && r.data && p.kind === 'settings' && snap.settings) {
      const theirs = r.data as Settings;
      const win = (r.u > (here ?? 0) ? keepEarned(theirs, snap.settings) : keepEarned(snap.settings, theirs)) as Settings;
      if (same({ ...win, u: 0 }, { ...snap.settings, u: 0 }) && (here ?? 0) >= r.u) continue;
      const u = Math.max(here ?? 0, r.u) + 1;
      snap.settings = { ...win, u };
      d[r.id] = u;
      changed.add(r.id);
      continue;
    }
    if (here != null && here >= r.u) continue;
    if (here == null && !r.data) continue; /* a deletion of something this device never had */
    /* settings from the account keep the supporter record this device has, if it is the better one (a tip is never lost
       to an older copy of the settings) */
    if (p.kind === 'settings') snap.settings = r.data ? keepPat(keepSup(r.data as Settings, snap.settings?.sup), snap.settings?.pat) : null;
    else if (p.kind === 'days') {
      if (r.data) {
        /* a copy from an older app version may have dropped what it cannot see: kept from this device's copy, and the
           mended day is sent back, so the account (and every other device) has it again */
        const theirs = r.data as Day;
        const kept = keepNewer(theirs, snap.days[p.key]);
        if (kept !== theirs) {
          const u = r.u + 1;
          snap.days[p.key] = { ...kept, u };
          d[r.id] = u;
          changed.add(r.id);
          continue;
        }
        snap.days[p.key] = theirs;
      } else delete snap.days[p.key];
    } else if (p.kind === 'journal') {
      if (r.data) jn[p.key] = r.data as JEntry;
      else delete jn[p.key];
    } else if (r.data) snap.reviews[p.key] = r.data as Snapshot['reviews'][string];
    else delete snap.reviews[p.key];
    delete d[r.id];
    changed.add(r.id);
  }
  return { snap, changed: [...changed], dirty: d };
}

/** what to send: each dirty record as it is now, or a deletion when it is gone */
export function pendingRecords(s: Snapshot, dirty: Dirty): SyncRecord[] {
  const out: SyncRecord[] = [];
  for (const id of Object.keys(dirty)) {
    if (!parseId(id)) continue;
    const r = recordOf(s, id as RecordId);
    out.push(r ? { id: id as RecordId, u: r.u || dirty[id], data: r } : { id: id as RecordId, u: dirty[id], data: null });
  }
  return out;
}

const sizeOf = (r: SyncRecord) => (r.data == null ? 0 : JSON.stringify(r.data).length) + r.id.length + 24;
const tooBig = (r: SyncRecord) => r.data != null && JSON.stringify(r.data).length > (r.id === 'settings' ? MAX_SETTINGS_BYTES : MAX_RECORD_BYTES);

/** splits the records into requests the API takes */
export function batches(recs: SyncRecord[], maxN = PUSH_N, maxBytes = PUSH_BYTES): SyncRecord[][] {
  const out: SyncRecord[][] = [];
  let cur: SyncRecord[] = [];
  let bytes = 0;
  for (const r of recs) {
    const b = sizeOf(r);
    if (cur.length && (cur.length >= maxN || bytes + b > maxBytes)) {
      out.push(cur);
      cur = [];
      bytes = 0;
    }
    cur.push(r);
    bytes += b;
  }
  if (cur.length) out.push(cur);
  return out;
}

export interface PushResult {
  /** the records the account now has (saved, or it already had the same or a newer copy): id -> the change time sent.
      The device clears each one from its dirty list only if it has not changed again since. */
  acked: Record<string, number>;
  /** records the account will never take (too large, or a broken change time); they are let go and reported */
  refused: { id: string; why: string }[];
  /** records that could not be saved this time and stay dirty */
  retry: string[];
  /** records the account turned down because their change time is ahead of its clock (this device's clock is, or was,
      ahead). They stay dirty: once the clock is right, restampRecords gives them the account's time and they go again. */
  clock: string[];
  saved: number;
  /** the account's clock at its last answer (0 when nothing was sent) */
  now: number;
}

/** the words the sync API refuses a record with when its change time is ahead of the server's clock */
export const WHY_FUTURE = 'its time is in the future';
/** and when it is too large */
export const WHY_LARGE = 'too large';

/** a device clock this close to the account's counts as right */
export const CLOCK_OK = 5 * 60_000;

/** the log with these records given a new change time (records the account turned down for a clock that was ahead, once
    the clock is right again), and the dirty list with that time, so they are sent again and win as the change made now */
export function restampRecords(s: Snapshot, dirty: Dirty, ids: string[], u: number): { snap: Snapshot; dirty: Dirty } {
  const snap: Snapshot = { settings: s.settings, days: { ...s.days }, reviews: { ...s.reviews }, journal: { ...(s.journal || {}) } };
  const jn = snap.journal!;
  const d: Dirty = { ...dirty };
  for (const id of ids) {
    const p = parseId(id);
    if (!p) continue;
    if (p.kind === 'settings') {
      if (snap.settings) snap.settings = { ...snap.settings, u };
    } else if (p.kind === 'days') {
      if (snap.days[p.key]) snap.days[p.key] = { ...snap.days[p.key], u };
    } else if (p.kind === 'journal') {
      if (jn[p.key]) jn[p.key] = { ...jn[p.key], u };
    } else if (snap.reviews[p.key]) snap.reviews[p.key] = { ...snap.reviews[p.key], u };
    d[id] = u;
  }
  return { snap, dirty: d };
}

/** sends the records, a batch at a time */
export async function pushAll(t: SyncTransport, recs: SyncRecord[]): Promise<PushResult> {
  const res: PushResult = { acked: {}, refused: [], retry: [], clock: [], saved: 0, now: 0 };
  const u = new Map(recs.map((r) => [r.id as string, r.u]));
  const send: SyncRecord[] = [];
  for (const r of recs) {
    if (tooBig(r)) {
      res.refused.push({ id: r.id, why: 'too large' });
      res.acked[r.id] = r.u;
    } else send.push(r);
  }
  for (const part of batches(send)) {
    const a = await t.push(part);
    res.now = a.now;
    for (const id of a.saved) {
      if (u.has(id)) res.acked[id] = u.get(id)!;
      res.saved++;
    }
    for (const id of a.stale) if (u.has(id)) res.acked[id] = u.get(id)!;
    for (const b of a.bad) {
      const id = String(b.id);
      if (b.why === 'could not save, try again') res.retry.push(id);
      else if (b.why === WHY_FUTURE) res.clock.push(id);
      else if (u.has(id)) {
        res.refused.push({ id, why: b.why });
        res.acked[id] = u.get(id)!;
      }
    }
  }
  return res;
}

/** what a device does when the sync API turns a request down: retry once soon (the gateway's own request ceiling, hit
    when many people sync at the same minute), pause until the app opens again (the person's daily allowance, or a body
    too large: retrying cannot help), wait for a tip (402: the account is not a supporter yet, supporter.ts; the changes stay
    marked to send), or show the error and try on the next round. ours: the answer carried the sync function's own words.
    retried: this is already the retry. */
export function syncFailure(status: number, ours: boolean, retried: boolean): 'retry' | 'pause' | 'need' | 'error' {
  if (status === 402 && ours) return 'need';
  if (status === 429 && !ours) return retried ? 'error' : 'retry';
  if (status === 429 || status === 413) return 'pause';
  return 'error';
}

/** the dirty list after a push: each acked record is cleared, unless it changed again while the push was out */
export function clearAcked(dirty: Dirty, acked: Record<string, number>): Dirty {
  const d: Dirty = { ...dirty };
  for (const id of Object.keys(acked)) if (d[id] === acked[id]) delete d[id];
  return d;
}

/** The dirty list to write to storage, when another copy of Daybook (a second browser tab) may share it. `mine` is this
    copy's own list, which it sends from; `seen` is the latest change time this copy has had for each id. A mark in
    storage that this copy never had, or that is newer than any it had, came from the other copy and is kept, so that
    copy's change is still sent (by it, or on the next launch). This copy never takes those marks into its own list: it
    could hold an older copy of that record, or none at all, and would send that instead. */
export function mergeDirty(stored: Dirty, mine: Dirty, seen: Dirty): Dirty {
  const out: Dirty = { ...mine };
  for (const id of Object.keys(stored)) {
    const v = stored[id];
    if (typeof v !== 'number') continue;
    if (id in out) out[id] = Math.max(out[id], v);
    else if (v > (seen[id] ?? -1)) out[id] = v;
  }
  return out;
}

/** every record in the log, as dirty (when a device first joins an account and keeps what it has) */
export function allDirty(s: Snapshot, dirty: Dirty = {}): Dirty {
  const d: Dirty = { ...dirty };
  for (const r of toRecords(s)) d[r.id] = Math.max(d[r.id] || 0, r.u || 0) || Date.now();
  return d;
}

/** what a device has, for the first-sign-in question: does it hold a real log (days, reviews or journal entries), and does
    the account */
export function hasLog(s: Snapshot) {
  return Object.keys(s.days).length > 0 || Object.keys(s.reviews).length > 0 || Object.keys(s.journal || {}).length > 0;
}
export function accountHasLog(recs: SyncRecord[]) {
  return recs.some((r) => r.data != null && r.id !== 'settings');
}
/** the log the account holds, on its own (to replace this device's log with it) */
export function snapshotOf(recs: SyncRecord[]): Snapshot {
  return mergeRemote({ settings: null, days: {}, reviews: {} }, {}, recs).snap;
}

/** A device joining an account, when both may hold settings. The settings record holds what was earned and built (the
    start, Day 1, graduation, the plan, lesson marks), so it goes with the log that has more days, never simply with the
    newer clock: a fresh setup on a second device must not replace a real log's settings, and a new phone that logged one
    urge must not replace the account's. On a tie, the earlier start wins, then the newer change. What the other side had
    earned is kept on the winner.
    Gives back the account's records to merge, and `mine`: settings to save on this device first (marked to send), when
    this device's win. When the account's win, its settings record comes back with a change time past this device's, so
    the merge takes it. */
export function joinRecords(here: Snapshot, recs: SyncRecord[]): { recs: SyncRecord[]; mine: Settings | null } {
  const theirs = snapshotOf(recs).settings;
  const own = here.settings;
  if (!own || !theirs) return { recs, mine: null };
  const nHere = Object.keys(here.days).length;
  const nThere = recs.filter((r) => r.data != null && r.id.startsWith('days/')).length;
  const mineWins = nHere !== nThere ? nHere > nThere : own.start !== theirs.start ? own.start < theirs.start : (own.u || 0) >= (theirs.u || 0);
  const u = Math.max(own.u || 0, theirs.u || 0) + 1;
  if (mineWins) return { recs: recs.filter((r) => r.id !== 'settings'), mine: { ...keepEarned(own, theirs), u } };
  const won = { ...keepEarned(theirs, own), u };
  return { recs: recs.map((r) => (r.id === 'settings' ? { id: 'settings', u, data: won } : r)), mine: null };
}
