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
import { cleanGone, keepEarned, normRecord, parseId, toRecords, type RecordId, type SyncRecord } from './data';
import { isKey } from './legacy/core.js';
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

/** the most records, and bytes, sent in one request (the API allows 200 and 1,000,000). The bytes are kept small on purpose
    (sync on cellular data, November 11, 2026): a phone on a weak signal sends a few kilobytes a second, and a request that
    cannot finish before the app gives up on it would be sent again, whole, on every round. Small requests each get through,
    and each is marked as sent the moment the account has it (pushAll's onBatch), so the next round carries on from there. */
export const PUSH_N = 200;
export const PUSH_BYTES = 96_000;
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
   the mood and urges of the check-in (md, u), the answer to "How are you feeling today?" (df), the morning set (ms) and a slip told the next morning (mn). None of these is ever
   taken off by the app once set, so a copy without one that this device has is a copy from an app that cannot see it. */
const EV_KEEP = ['fb', 'fa', 'mn'] as const;
const TALK_KEEP = ['pr', 'fw', 'ft'] as const;
const CI_KEEP = ['md', 'u'] as const;
const P_KEEP = ['df', 'ms'] as const;

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
  /* a God lesson finished (g1 to g12, November 2026): an older app does not know its id and drops it from the day's lessons,
     and with nothing else done that day, the whole play record. A finished lesson is never taken off, so it comes back. */
  const god = (had.p?.ls || []).filter((id) => /^g\d+$/.test(id) && !(p?.ls || []).includes(id));
  if (god.length) {
    p = p ? { ...p, ls: [...(p.ls || []), ...god] } : had.p;
    filled = true;
  }
  if (p && p.tt && had.p?.tt) {
    const talks = new Map(had.p.tt.map((t) => [t.id, t]));
    const tt = p.tt.map((t) => fill(t, talks.get(t.id), TALK_KEEP));
    if (tt.some((t, i) => t !== p!.tt![i])) p = { ...p, tt };
  }
  return filled ? { ...day, events, checkin, p } : day;
}

const union = <T>(a: T[] | undefined, b: T[] | undefined): T[] => [...new Set([...(a || []), ...(b || [])])];
const later = <T>(a: T | undefined, b: T | undefined, at: (x: T) => number): T | undefined =>
  a === undefined ? b : b === undefined ? a : at(b) > at(a) ? b : a;

/* Two phones used on one day before they synced (WP4, November 12, 2026): before this, the day's play record came whole from
   the newer copy, so a lesson finished on the other phone that day was lost, with its points. Now the two are joined field by
   field, leaning toward keeping what was done: a lesson finished, a tool used, a tick, a feeling named or a talk on either
   phone stays. The one cost is that a wind-down tick taken off on one phone while the other phone still had it comes back;
   that is a tick, never a loss of something earned. Choices that are a single answer (the phone-away time, a routine switch,
   the hard hour) come from the newer copy where it has one. */

/** the day's play record from two copies, field by field (see above); the newer copy's answer wins where only one can stand */
export function mergePlay(newer: Day['p'], older: Day['p']): Day['p'] {
  if (!newer || !older) return newer ?? older;
  const p: NonNullable<Day['p']> = {
    w: union(newer.w, older.w).sort((x, y) => x - y),
    wd: newer.wd || older.wd,
    r: newer.r || older.r,
    c: Math.max(newer.c || 0, older.c || 0),
    m: newer.m || older.m,
    tl: union(newer.tl, older.tl),
    po: newer.po ?? older.po,
    ls: union(newer.ls, older.ls),
    lv: union(newer.lv, older.lv).slice(0, 8),
    ov: { ...(older.ov || {}), ...(newer.ov || {}) },
  };
  if (newer.tt || older.tt) {
    const byId = new Map<string, NonNullable<typeof newer.tt>[number]>();
    for (const t of [...(older.tt || []), ...(newer.tt || [])]) byId.set(t.id, t);
    p.tt = [...byId.values()].sort((x, y) => x.t - y.t);
  }
  if (newer.fe || older.fe) {
    const seen = new Set<string>();
    p.fe = [...(older.fe || []), ...(newer.fe || [])]
      .filter((f) => {
        const k = f[0] + '|' + f[1];
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      })
      .sort((x, y) => x[1] - y[1])
      .slice(-50);
  }
  const hw = newer.hw ?? older.hw;
  if (hw !== undefined) p.hw = hw;
  const lt = Math.max(newer.lt || 0, older.lt || 0);
  if (lt) p.lt = lt;
  if (newer.o || older.o) p.o = true;
  const df = later(newer.df, older.df, (x) => x[1]);
  if (df) p.df = df;
  const ms = later(newer.ms, older.ms, (x) => x.at);
  if (ms) p.ms = ms;
  return p;
}

/** the check-in from two copies: the one saved last, with any number or note it left empty taken from the other, so what was
    answered on one phone is not lost to an unanswered field on the other */
export function mergeCheckin(newer: Day['checkin'], older: Day['checkin']): Day['checkin'] {
  if (!newer || !older) return newer ?? older;
  const [base, other] = (older.at || 0) > (newer.at || 0) ? [older, newer] : [newer, older];
  const out = { ...base } as Record<string, unknown>;
  for (const [k, v] of Object.entries(other)) {
    const has = out[k];
    if ((has === undefined || has === null || has === '') && v !== undefined && v !== null && v !== '') out[k] = v;
  }
  out.done = base.done || other.done;
  return out as unknown as NonNullable<Day['checkin']>;
}

/** Two copies of one day, both changed (two devices logged on the same day before syncing): joined entry by entry, so no
    entry is lost. An entry in both is taken from the newer copy; an entry in one only is kept, unless the other copy
    deleted it (Day.gone): a delete wins over an older copy. The check-in and the day's play record are joined field by field
    (mergeCheckin, mergePlay). What only a newer app version knows is kept from either copy (keepNewer).
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
  const checkin = mergeCheckin(newer.checkin, older.checkin);
  const p = mergePlay(newer.p, older.p);
  if (!events.length && !checkin && !p) return null;
  const day: Day = { d: newer.d, events, checkin, p, u: Math.max(a.u || 0, b.u || 0) + 1 };
  if (gone.length) day.gone = gone;
  return keepNewer(day, older);
}

const same = (x: unknown, y: unknown) => JSON.stringify(x) === JSON.stringify(y);
const bodyOf = (d: Day) => ({ e: d.events, c: d.checkin, p: d.p, g: d.gone || [] });

/** a deleted day as mergeDay can read it: nothing in it, and the marks of the entries it held */
export const tombDay = (key: string, marks: string[], u: number): Day => ({ d: key, events: [], checkin: null, p: null, gone: marks, u });
const allMarks = (...xs: (string[] | undefined)[]) => [...new Set(xs.flatMap((x) => x || []))].slice(-100);

/* A day emptied here (its last entry deleted) leaves the log, as it always has. Until its deletion reaches the account, the
   marks of the entries it held are kept beside the log (Snapshot.tomb) and go with the deletion, so a copy of that day
   another device changed meanwhile keeps the entries it added, and loses only the ones deleted here (the sync fuzz test,
   November 11, 2026). Without them, the deletion took the other device's new entries with it. */

/** the tombs after a change from `cur` to `next`: a day that left the log gets the marks of what it held; a day back in the
    log has none. Gives back the same object when nothing changed. */
export function tombsAfter(cur: Snapshot, next: Snapshot): Snapshot['tomb'] {
  let t = next.tomb ?? cur.tomb;
  let copied = false;
  const edit = () => {
    if (!copied) {
      t = { ...(t || {}) };
      copied = true;
    }
    return t!;
  };
  for (const k of Object.keys(cur.days))
    if (!next.days[k]) {
      const day = cur.days[k];
      edit()[k] = allMarks(
        t?.[k],
        day.gone,
        day.events.map((e) => goneMark(e.id)),
      );
    }
  for (const k of Object.keys(t || {})) if (next.days[k]) delete edit()[k];
  return t;
}

/** the log after a change, with its tombs kept (tombsAfter), and a day that comes back into the log after it was emptied
    here keeps the marks of what was deleted from it, so an older copy elsewhere does not bring those entries back. An entry
    put back (Undo) is not marked. Gives back `next` itself when nothing changed. */
export function withTombs(cur: Snapshot, next: Snapshot): Snapshot {
  const was = next.tomb ?? cur.tomb;
  const tomb = tombsAfter(cur, next);
  let days = next.days;
  for (const k of Object.keys(was || {})) {
    const day = next.days[k];
    if (!day || cur.days[k]) continue;
    const here = new Set(day.events.map((e) => goneMark(e.id)));
    const marks = allMarks(
      day.gone,
      was![k].filter((m) => !here.has(m)),
    );
    if (marks.length) {
      if (days === next.days) days = { ...next.days };
      days[k] = { ...day, gone: marks };
    }
  }
  return tomb === next.tomb && days === next.days ? next : { ...next, days, tomb };
}

/** tombs read back from storage, cleaned: day keys only, each with its marks */
export function cleanTombs(v: unknown): Snapshot['tomb'] {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return undefined;
  const out: Record<string, string[]> = {};
  for (const [k, g] of Object.entries(v as Record<string, unknown>)) {
    const marks = isKey(k) ? cleanGone(g) : undefined;
    if (marks) out[k] = marks;
  }
  return Object.keys(out).length ? out : undefined;
}

/* What each waiting change was made from (the change time of the account's copy it started from), so the account can tell a
   change made on top of what it holds (it stands as sent: an Undo that takes back what a mistaken log earned, a cleared
   check-in) from one made while another device saved something (then the two are joined). */

/** the bases after a change to `ids`: a record that had nothing waiting gets the change time of its copy before the change
    (the account's copy, since nothing here was waiting); a record already waiting keeps the base it had */
export function baseAfter(before: Snapshot, ids: string[], dirty: Dirty, base: Dirty): Dirty {
  let out = base;
  for (const id of ids) {
    if (dirty[id] != null || !(id === 'settings' || id.startsWith('days/'))) continue;
    const r = recordOf(before, id as RecordId);
    if (out === base) out = { ...base };
    /* 0: new on this device, made from no copy of the account's. Sent as b: 0, it tells the account this is a new app that
       wants a join; an older app sends no b at all, and the account keeps its old rule (the newer change wins) */
    out[id] = r && r.u ? r.u : 0;
  }
  return out;
}

/** the bases after a push was taken: a record changed again while it was being sent (still waiting, at a newer change time)
    was made on top of the copy just sent, so that copy is its base now. Without this, the copy just sent comes back on the
    next pull as "another device's" and is joined into the newer change, bringing back what an Undo took away. A base that is
    wrong only ever causes a join, never a loss. Then only the bases still needed are kept (keepBase). */
export function ackBase(base: Dirty, acked: Record<string, number>, dirty: Dirty): Dirty {
  let out = base;
  for (const id of Object.keys(acked)) {
    if (!(id === 'settings' || id.startsWith('days/'))) continue;
    if (dirty[id] == null || dirty[id] === acked[id]) continue;
    if (out === base) out = { ...base };
    out[id] = acked[id];
  }
  return keepBase(out, dirty);
}

/** the bases still needed: only those of records still waiting to be sent */
export function keepBase(base: Dirty, dirty: Dirty): Dirty {
  const keys = Object.keys(base);
  if (keys.every((id) => dirty[id] != null)) return base;
  const out: Dirty = {};
  for (const id of keys) if (dirty[id] != null) out[id] = base[id];
  return out;
}

/** the tombs still needed: only those of days whose deletion is still waiting to be sent */
export function keepTombs(tomb: Snapshot['tomb'], dirty: Dirty): Snapshot['tomb'] {
  if (!tomb) return tomb;
  const keys = Object.keys(tomb);
  if (keys.every((k) => dirty['days/' + k] != null)) return tomb;
  const out: Record<string, string[]> = {};
  for (const k of keys) if (dirty['days/' + k] != null) out[k] = tomb[k];
  return out;
}

/** merges records from the account into the log. A record replaces what is here when it was changed later and this
    device has nothing of its own waiting to send for it. When both changed it, a day is joined entry by entry (mergeDay)
    and settings keep what each side earned (keepEarned); the joined record is marked to send, so the account gets it too.
    A deletion from the account (another device deleted that day, or everything) removes the record here when it is the
    newer change: a delete wins. The ids that changed come back, with the dirty list after the merge. */
export function mergeRemote(
  s: Snapshot,
  dirty: Dirty,
  recs: SyncRecord[],
  base: Dirty = {},
): { snap: Snapshot; changed: RecordId[]; dirty: Dirty; base: Dirty } {
  const snap: Snapshot = { settings: s.settings, days: { ...s.days }, reviews: { ...s.reviews }, journal: { ...(s.journal || {}) } };
  if (s.tomb) snap.tomb = { ...s.tomb };
  const jn = snap.journal!;
  const d: Dirty = { ...dirty };
  const bs: Dirty = { ...base };
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
    /* the very copy the change waiting here was made from (baseAfter): it holds nothing new, and joining it would undo
       what the change took away on purpose (an Undo of a mistaken log) */
    if (mine && bs[r.id] != null && r.u === bs[r.id]) continue;
    /* both sides changed a day: join them, and send the joined copy. Either side may be a day emptied there, known by the
       marks of what it held; a deletion with no marks (everything erased, or an older app) is not joined, and the newer
       change wins below, as it always has. */
    if (mine && p.kind === 'days') {
      const local = snap.days[p.key];
      const marks = snap.tomb?.[p.key];
      const theirs = r.data ? (r.data as Day) : r.gone ? tombDay(p.key, r.gone, r.u) : null;
      const ours = local ?? (marks ? tombDay(p.key, marks, here ?? 0) : null);
      if (theirs && ours) {
        /* what is here now holds the account's copy */
        bs[r.id] = r.u;
        const j = mergeDay(ours, theirs);
        if (local && j && same(bodyOf(j), bodyOf(local)) && (local.u || 0) >= r.u) continue;
        if (!local && !j && (here ?? 0) >= r.u) continue;
        if (j) {
          snap.days[p.key] = j;
          d[r.id] = j.u;
          if (snap.tomb?.[p.key]) delete snap.tomb[p.key];
        } else {
          /* nothing is left on either side: the day stays deleted, with every mark, and the deletion is sent */
          delete snap.days[p.key];
          d[r.id] = Math.max(here ?? 0, r.u) + 1;
          snap.tomb = { ...(snap.tomb || {}), [p.key]: allMarks(ours.gone, theirs.gone) };
        }
        changed.add(r.id);
        continue;
      }
    }
    if (mine && r.data && p.kind === 'settings' && snap.settings) {
      bs[r.id] = r.u;
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
      if (r.data) {
        /* tags are the one thing an older app version drops from an entry, the way it drops the newer parts of a day
           (keepNewer): a copy with no list at all keeps this device's, and the mended entry is sent back */
        const theirs = r.data as JEntry;
        const had = jn[p.key]?.tags;
        if (had && !theirs.tags) {
          const u = r.u + 1;
          jn[p.key] = { ...theirs, tags: had, u };
          d[r.id] = u;
          changed.add(r.id);
          continue;
        }
        jn[p.key] = theirs;
      } else delete jn[p.key];
    } else if (r.data) snap.reviews[p.key] = r.data as Snapshot['reviews'][string];
    else delete snap.reviews[p.key];
    delete d[r.id];
    delete bs[r.id];
    changed.add(r.id);
  }
  return { snap, changed: [...changed], dirty: d, base: bs };
}

/** what to send: each dirty record as it is now, or a deletion when it is gone */
export function pendingRecords(s: Snapshot, dirty: Dirty, base: Dirty = {}): SyncRecord[] {
  const out: SyncRecord[] = [];
  for (const id of Object.keys(dirty)) {
    if (!parseId(id)) continue;
    const r = recordOf(s, id as RecordId);
    const gone = !r && id.startsWith('days/') ? s.tomb?.[id.slice(5)] : undefined;
    const rec: SyncRecord = r ? { id: id as RecordId, u: r.u || dirty[id], data: r } : { id: id as RecordId, u: dirty[id], data: null };
    if (!r && gone?.length) rec.gone = gone;
    if (base[id] != null) rec.b = base[id];
    out.push(rec);
  }
  return out;
}

const sizeOf = (r: SyncRecord) => (r.data == null ? (r.gone?.length || 0) * 12 : JSON.stringify(r.data).length) + r.id.length + 24;
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
  if (s.tomb) snap.tomb = s.tomb;
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

/** sends the records, a batch at a time. onBatch hears what each batch got into the account as soon as it is in, so a
    round that stops halfway (the connection dropped) has still marked those records as sent, and the next round does not
    send them again. Records the account will never take are let go in the first call. */
export async function pushAll(t: SyncTransport, recs: SyncRecord[], onBatch?: (acked: Record<string, number>) => Promise<void> | void): Promise<PushResult> {
  const res: PushResult = { acked: {}, refused: [], retry: [], clock: [], saved: 0, now: 0 };
  const u = new Map(recs.map((r) => [r.id as string, r.u]));
  const send: SyncRecord[] = [];
  const first: Record<string, number> = {};
  for (const r of recs) {
    if (tooBig(r)) {
      res.refused.push({ id: r.id, why: 'too large' });
      res.acked[r.id] = r.u;
      first[r.id] = r.u;
    } else send.push(r);
  }
  if (onBatch && Object.keys(first).length) await onBatch(first);
  for (const part of batches(send)) {
    const a = await t.push(part);
    const got: Record<string, number> = {};
    res.now = a.now;
    for (const id of a.saved) {
      if (u.has(id)) got[id] = u.get(id)!;
      res.saved++;
    }
    for (const id of a.stale) if (u.has(id)) got[id] = u.get(id)!;
    for (const b of a.bad) {
      const id = String(b.id);
      if (b.why === 'could not save, try again') res.retry.push(id);
      else if (b.why === WHY_FUTURE) res.clock.push(id);
      else if (u.has(id)) {
        res.refused.push({ id, why: b.why });
        got[id] = u.get(id)!;
      }
    }
    Object.assign(res.acked, got);
    if (onBatch && Object.keys(got).length) await onBatch(got);
  }
  return res;
}

/** how long a request carrying this many bytes may take before the app gives up on it: a base for the round trip, and
    time for the body at a weak cellular signal (about 4 kB a second), so a slow link is never mistaken for no link */
export function requestTimeout(bytes: number, base = 20_000): number {
  return base + Math.ceil(Math.max(0, bytes) / 4_000) * 1_000;
}

/** whether an answer to a pull is the sync API's own (a page of records), not some other page in its place (an error
    page from the network in between, a captive portal, a web page served for an unknown address) */
export function isPullPage(x: unknown): x is PullPage {
  const p = x as PullPage;
  return !!p && typeof p === 'object' && Array.isArray(p.records) && (p.cursor === null || typeof p.cursor === 'string') && Number.isFinite(p.now);
}

/** the same for an answer to a push */
export function isPushAnswer(x: unknown): x is PushAnswer {
  const a = x as PushAnswer;
  return !!a && typeof a === 'object' && Array.isArray(a.saved) && Array.isArray(a.stale) && Array.isArray(a.bad) && Number.isFinite(a.now);
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

/* "Use my account's log here" (WP4, November 12, 2026): the person chose the account's log over this phone's, and the phone's
   days are kept aside for a week (the app's store). The settings came whole from the account, so what this phone had earned
   (graduation, badges, level, points, lessons practiced, the supporter record) went with them, and the kept copy never brings
   settings back. Now the account's settings stay the plan, and the earned things and the set-once marks this phone holds
   that the account's copy has not are put on them. */

/** the marks set once and never cleared: the account's copy keeps its own, and takes this phone's where it has none. The
    one-count rule's day is the earlier of the two, so slips before either keep the rule they were made under. */
const ONCE = ['widget', 'widgetAsk', 'awayFrom', 'wk1', 'toldStart', 'likeAsk', 'acctNo', 'tipAsk', 'tipMo', 'freeNo', 'nightAt', 'jnTags', 'free'] as const;

/** the account's settings to use on this phone, with what this phone earned kept on them (keepEarned) and the marks it set
    once that the account's copy lacks; null when there is nothing to keep (no settings here, or nothing changes). The
    change time is past both, so the joined copy is sent to the account and wins there. */
export function accountHere(theirs: Settings | null, mine: Settings | null): Settings | null {
  if (!theirs || !mine) return null;
  const out = keepEarned(theirs, mine) as Settings & Record<string, unknown>;
  for (const k of ONCE) if (out[k] == null && mine[k] != null) out[k] = JSON.parse(JSON.stringify(mine[k]));
  const cf = [theirs.countFrom, mine.countFrom].filter((x): x is string => isKey(x)).sort()[0];
  if (cf) out.countFrom = cf;
  /* the true record's first day is the earlier of the two too, so a night already counted the new way is never counted the old */
  const tf = [theirs.truthFrom, mine.truthFrom].filter((x): x is string => isKey(x)).sort()[0];
  if (tf) out.truthFrom = tf;
  if (same({ ...out, u: 0 }, { ...theirs, u: 0 })) return null;
  return { ...out, u: Math.max(theirs.u || 0, mine.u || 0) + 1 };
}
