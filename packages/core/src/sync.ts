/* Sync, the device side. The log lives on the device first; sync copies changes to the person's own account and back.
   The rule is the same everywhere: per record, the change made last wins (each record carries u, when it was changed).

   A device remembers which records it changed and has not sent yet ("dirty": record id -> the change time it had). A record
   deleted here (a day whose last entry was removed) is gone from the log but stays dirty, with the time it was deleted, so
   the deletion reaches the account and an older copy coming back from the account does not bring it back.

   One round: pull what the account saved since the last pull, merge it, then push what is still dirty. Pulling first means
   the push sends the merged log, and records the account already has newer copies of are dropped before they are sent.
   The network parts take a transport, so the same code runs against the real API and, in tests, against the API's own
   handler with an in-memory table. Checked by services/api/test/client.test.ts. */
import { normRecord, parseId, toRecords, type RecordId, type SyncRecord } from './data';
import { isKey } from './legacy/core.js';
import type { JEntry } from './journal-entries';
import { keepSup } from './supporter';
import type { Settings, Snapshot } from './types';

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

/** merges records from the account into the log. A record replaces what is here only when it was changed later, and a
    deletion from the account (another device deleted everything) removes the record here. The ids that changed come back,
    with the dirty list minus the records the account's newer copy replaced. */
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
    const here = localU(snap, d, r.id);
    if (here != null && here >= r.u) continue;
    const p = parseId(r.id)!;
    if (here == null && !r.data) continue; /* a deletion of something this device never had */
    /* settings from the account keep the supporter record this device has, if it is the better one (a tip is never lost
       to an older copy of the settings) */
    if (p.kind === 'settings') snap.settings = r.data ? keepSup(r.data as Settings, snap.settings?.sup) : null;
    else if (p.kind === 'days') {
      if (r.data) snap.days[p.key] = r.data as Snapshot['days'][string];
      else delete snap.days[p.key];
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

/** what the losing settings had earned, kept on the winning ones: graduation (the earlier date), the badges and level
    already seen, lessons practiced, lesson notes and checkpoint writing the winner does not have, and the better supporter
    record, and the welcome backs passed on the lesson path */
function keepEarned(win: Settings, lose: Settings): Settings {
  const out = JSON.parse(JSON.stringify(win)) as Settings;
  const g = [win.gradAt, lose.gradAt].filter((x): x is string => isKey(x)).sort()[0];
  if (g) out.gradAt = g;
  if (lose.seen) {
    const s = out.seen || { badges: [], quests: [], level: 1, full: null, lad: lose.seen.lad };
    s.badges = [...new Set([...s.badges, ...lose.seen.badges])];
    s.level = Math.max(s.level, lose.seen.level);
    out.seen = s;
  }
  out.learn.prac = { ...lose.learn.prac, ...out.learn.prac };
  out.learn.notes = { ...lose.learn.notes, ...out.learn.notes };
  out.learn.wr = { ...lose.learn.wr, ...out.learn.wr };
  const back = { ...(lose.learn.back || {}), ...(out.learn.back || {}) };
  if (Object.keys(back).length) out.learn.back = back;
  return keepSup(out, lose.sup);
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
