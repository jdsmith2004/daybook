/* Quiet days: pause, then ask (docs/plan.md, "Quiet days", the owner's call of October 19, 2026).

   From Day 1 on, a day with no slip logged counts as a no-slip day, because a slip not logged is not a slip. That holds
   while the person is around. When they are away, Daybook does not know, so it does not make the days up:
   - A day is present when anything is in it: an entry, a check-in, the morning questions, anything done, or the app
     simply opened (p.o, written by Today).
   - The first QUIET_GRACE days in a row with nothing are quiet and count as before (a weekend away still counts).
   - From the next one on, each quiet day is not known: not a no-slip day, and not a slip. A run pauses there and goes on
     afterwards; graduation and Today's measure count only known days. Nothing earned is ever taken away.
   - Coming back, one question fills the gap in, and the answer is kept in settings.away (synced): 'clean' (no slips), 'some'
     (the slips were logged on their days; the other days had none), or 'skip' (rather not say, or not sure: the days stay not
     known, and the question is not asked again).
   Today is never quiet: it is still going. Days before the tracking start are never counted at all.

   It counts only from settings.awayFrom: the first day this version of Daybook ran and began marking the days it was
   opened. Before that, opening the app left no mark, so a day with nothing logged may well have been a day the person was
   here; those days count exactly as they always did, and nothing anyone has earned changes. With no awayFrom, the rule is off.

   This file imports nothing from legacy/core.js, because legacy/core.js imports it (dayKind and statusOf ask here).
   Checked by test/away.test.ts. */
import type { DayKey, Days, Settings } from './types';

/** quiet days in a row that still count, before the rest of the gap is not known */
export const QUIET_GRACE = 2;

export type AwayAnswer = 'clean' | 'some' | 'skip';
export interface AwayEntry {
  from: DayKey;
  to: DayKey;
  a: AwayAnswer;
}

const isKey = (k: unknown): k is DayKey => typeof k === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(k);
const dateOf = (k: DayKey) => {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const keyOf = (d: Date) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const addDays = (k: DayKey, n: number) => {
  const d = dateOf(k);
  d.setDate(d.getDate() + n);
  return keyOf(d);
};

/** the answers kept, cleaned (an older or broken record has none) */
export function awayOf(st: Settings | null): AwayEntry[] {
  const v = st && (st as { away?: unknown }).away;
  if (!Array.isArray(v)) return [];
  return v
    .filter((x): x is AwayEntry => !!x && isKey(x.from) && isKey(x.to) && x.from <= x.to && (x.a === 'clean' || x.a === 'some' || x.a === 'skip'))
    .map((x) => ({ from: x.from, to: x.to, a: x.a }))
    .slice(-200);
}

/** anything in the day: an entry, a check-in, anything done, or the app opened */
export function presentDay(d: Days[string] | null | undefined): boolean {
  return !!d && ((d.events && d.events.length > 0) || !!d.checkin || !!d.p);
}

interface Cache {
  days: Days;
  st: Settings;
  tk: DayKey;
  unknown: Set<DayKey>;
  gaps: { from: DayKey; to: DayKey }[];
}
let cache: Cache | null = null;

/** the not-known days, worked out once per log, settings and day (every count asks about one day at a time) */
function work(days: Days, st: Settings, tk: DayKey): Cache {
  if (cache && cache.days === days && cache.st === st && cache.tk === tk) return cache;
  const unknown = new Set<DayKey>();
  const gaps: { from: DayKey; to: DayKey }[] = [];
  const on = (st as { awayFrom?: unknown }).awayFrom;
  if (!isKey(on)) {
    cache = { days, st, tk, unknown, gaps };
    return cache;
  }
  const from = isKey(st.start) && st.start > on ? st.start : on;
  const answers = awayOf(st);
  const answered = (k: DayKey) => answers.find((x) => x.from <= k && k <= x.to) || null;
  /* walk the days before today, counting quiet days in a row; a long run of them becomes a gap */
  let run = 0;
  let gap: { from: DayKey; to: DayKey } | null = null;
  const end = () => {
    if (gap) gaps.push(gap);
    gap = null;
  };
  /* a long log can start years back; a day count keeps the walk bounded */
  let k = from;
  for (let n = 0; k < tk && n < 20000; n++, k = addDays(k, 1)) {
    if (presentDay(days[k])) {
      run = 0;
      end();
      continue;
    }
    run++;
    if (run <= QUIET_GRACE) continue;
    const ans = answered(k);
    if (ans && ans.a === 'clean') continue;
    /* 'some': the slips were logged on their days, so the quiet days left in that stretch had none */
    if (ans && ans.a === 'some') continue;
    unknown.add(k);
    if (ans) continue; /* 'skip': not known, and not asked about again */
    if (gap) gap.to = k;
    else gap = { from: k, to: k };
  }
  end();
  cache = { days, st, tk, unknown, gaps };
  return cache;
}

/** whether Daybook knows how day k went (a day from Day 1 on that counts as a no-slip day when no slip is logged) */
export function dayKnown(days: Days, st: Settings, k: DayKey, tk: DayKey): boolean {
  if (k >= tk) return true;
  return !work(days, st, tk).unknown.has(k);
}

/** the not-known days, oldest first */
export function unknownDays(days: Days, st: Settings, tk: DayKey): DayKey[] {
  return [...work(days, st, tk).unknown].sort();
}

/** the gap to ask about on coming back: the latest stretch of not-known days with no answer yet, from Day 1 on, once the
    person is back (today, or a later day, is present). null when there is nothing to ask. */
export function awayDue(days: Days, st: Settings, tk: DayKey): { from: DayKey; to: DayKey; n: number } | null {
  if (!isKey(st.day1)) return null;
  const gaps = work(days, st, tk).gaps.filter((g) => g.to >= (st.day1 as DayKey));
  const g = gaps[gaps.length - 1];
  if (!g) return null;
  const from = g.from < (st.day1 as DayKey) ? (st.day1 as DayKey) : g.from;
  let n = 0;
  for (let k = from; k <= g.to; k = addDays(k, 1)) n++;
  return { from, to: g.to, n };
}

/** the answer kept in settings (the caller saves it with changeSettings). For 'some', the slips are logged on their days
    by the caller, as ordinary entries; the stretch's other days are then no-slip days. */
export function withAway(st: Settings, gap: { from: DayKey; to: DayKey }, a: AwayAnswer): AwayEntry[] {
  const rest = awayOf(st).filter((x) => x.to < gap.from || x.from > gap.to);
  return [...rest, { from: gap.from, to: gap.to, a }].sort((x, y) => (x.from < y.from ? -1 : 1));
}

/** the day this version began marking opens, set once (the app does it the first time Today shows, and the setup for a
    new person): the quiet-day rule counts from here */
export const awayFromOf = (st: Settings | null): DayKey | null => {
  const v = st && (st as { awayFrom?: unknown }).awayFrom;
  return isKey(v) ? v : null;
};
