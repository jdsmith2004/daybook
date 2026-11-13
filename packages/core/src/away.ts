/* Quiet days: pause, then ask (docs/plan.md, "Quiet days" and "Quiet days, simplified", the owner's calls of October 19, 2026).

   From Day 1 on, a day with no slip logged counts as a no-slip day, because a slip not logged is not a slip. That holds
   while the person is around. When they are away, Daybook does not know, so it does not make the days up:
   - A day is present when anything is in it: an entry, a check-in, the morning questions, anything done, or the app
     simply opened (p.o, written by Today).
   - A gap is a stretch of more than QUIET_GRACE days in a row with nothing. Until it is answered, its first QUIET_GRACE
     days count as before (a weekend away still counts) and the rest are not known: not a no-slip day and not a slip. A run
     pauses there and goes on afterwards; graduation and Today's measure count only known days.
   - Coming back, one question: "How many slips did you have while you were away?", kept in settings.away (synced) as
     { from, to, n } for the whole gap. Then every day of the gap is known. Each slip takes one day: for counting, the slips
     sit on the last n days of the gap (so a run ends at the gap and starts again the day after it), and the other days
     are no-slip days. No entries are made, because Daybook does not know the days or the times: the pattern, the hard
     hours and Rekindle never see these slips.
   Nothing earned is ever taken away: points come only from things done. Today is never quiet: it is still going.

   It counts only from settings.awayFrom: the first day this version of Daybook ran and began marking the days it was
   opened. Before that, opening the app left no mark, so a day with nothing logged may well have been a day the person was
   here; those days count exactly as they always did. With no awayFrom, the rule is off.

   This file imports nothing from legacy/core.js, because legacy/core.js imports it (dayKind and statusOf ask here).
   Checked by test/away.test.ts. */
import { toldOn, truthFromOf, type NightState } from './truth';
import type { DayKey, Days, Settings } from './types';

/** quiet days in a row that still count, before the rest of an unanswered gap is not known */
export const QUIET_GRACE = 2;
/** the most slips the question offers (the slider's top), and never more than the days away */
export const AWAY_MAX = 30;

/** an answer: the gap, and the slips the person had during it */
export interface AwayEntry {
  from: DayKey;
  to: DayKey;
  n: number;
  /** the log day it was answered: telling is the day's part, and lights the fire (flame-low.ts) */
  on?: DayKey;
}
/** a gap away: its days, and its answer (null until answered) */
export interface AwayGap {
  from: DayKey;
  to: DayKey;
  /** days in the gap */
  len: number;
  /** slips while away, or null when not answered yet */
  n: number | null;
  /** false when the person was here on some of its days and only did not tell Daybook about the nights (truth.ts); absent when
      they were away. Words say "while you were away" only when they were. */
  away?: false;
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
const daysIn = (a: DayKey, b: DayKey) => Math.round((dateOf(b).getTime() - dateOf(a).getTime()) / 864e5) + 1;

/** the answers kept, cleaned. The first version kept { a }: 'clean' and 'some' read as no slips left to count (the slips
    of 'some' were logged as entries), and 'skip' as not answered. */
export function awayOf(st: Settings | null): AwayEntry[] {
  const v = st && (st as { away?: unknown }).away;
  if (!Array.isArray(v)) return [];
  const out: AwayEntry[] = [];
  for (const x of v as Record<string, unknown>[]) {
    if (!x || !isKey(x.from) || !isKey(x.to) || x.from > x.to) continue;
    const n = Number.isInteger(x.n) && (x.n as number) >= 0 ? Math.min(x.n as number, AWAY_MAX) : x.a === 'clean' || x.a === 'some' ? 0 : null;
    if (n != null) out.push({ from: x.from, to: x.to, n, ...(isKey(x.on) ? { on: x.on } : {}) });
  }
  return out.slice(-200);
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
  /** from truthFrom on: nights nobody told Daybook about (truth.ts), not covered by an answer */
  untold: Set<DayKey>;
  slips: Set<DayKey>;
  gaps: AwayGap[];
  at: Map<DayKey, AwayGap>;
}
let cache: Cache | null = null;

/** the gaps, the not-known days, the nights not told and the days that carry a slip from an answer, worked out once per log,
    settings and day (every count asks about one day at a time).
    Before truthFrom, a day is "here" when anything is in it (presentDay), as it always was. From truthFrom on, a day is here only
    when its night was told (truth.ts toldOn): a night not told is untold, never a free night, and a run of more than QUIET_GRACE of
    them is a gap that Welcome back asks about, the same as days away. Last night is the morning's to ask ("How was last night?"),
    so it is untold until then but never part of a gap. */
function work(days: Days, st: Settings, tk: DayKey): Cache {
  if (cache && cache.days === days && cache.st === st && cache.tk === tk) return cache;
  const c: Cache = { days, st, tk, unknown: new Set(), untold: new Set(), slips: new Set(), gaps: [], at: new Map() };
  cache = c;
  const onRaw = (st as { awayFrom?: unknown }).awayFrom;
  const on = isKey(onRaw) ? onRaw : null;
  const tf = truthFromOf(st);
  if (!on && !tf) return c;
  const begin = [on, tf].filter((x): x is DayKey => !!x).sort()[0];
  const from = isKey(st.start) && st.start > begin ? st.start : begin;
  const answers = awayOf(st);
  const last = addDays(tk, -1);
  /* the quiet runs before today; one longer than the grace is a gap */
  const runs: { from: DayKey; to: DayKey; away: boolean }[] = [];
  let run: { from: DayKey; to: DayKey; away: boolean } | null = null;
  let k = from;
  for (let i = 0; k < tk && i < 20000; i++, k = addDays(k, 1)) {
    const truth = !!tf && k >= tf;
    /* a day under neither rule (before awayFrom, before truthFrom) counts as it always did */
    const here = truth ? toldOn(days, k) != null : !on || k < on || presentDay(days[k]);
    if (here || (truth && k === last)) {
      if (run) runs.push(run);
      run = null;
      if (!here) c.untold.add(k);
    } else if (run) {
      run.to = k;
      run.away = run.away && !presentDay(days[k]);
    } else run = { from: k, to: k, away: !presentDay(days[k]) };
  }
  if (run) runs.push(run);
  for (const r of runs) {
    const len = daysIn(r.from, r.to);
    if (len <= QUIET_GRACE) {
      for (let d = r.from; d <= r.to; d = addDays(d, 1)) if (tf && d >= tf) c.untold.add(d);
      continue;
    }
    /* an answer covers the gap it was given for: the one it overlaps */
    const a = answers.find((x) => x.from <= r.to && x.to >= r.from) || null;
    const g: AwayGap = { from: r.from, to: r.to, len, n: a ? Math.min(a.n, len) : null, ...(r.away ? {} : { away: false }) };
    c.gaps.push(g);
    for (let d = r.from, i = 0; d <= r.to; d = addDays(d, 1), i++) {
      c.at.set(d, g);
      if (g.n == null) {
        /* not answered: a night not told is untold from the first; days away before truthFrom keep their grace */
        if (tf && d >= tf) c.untold.add(d);
        else if (i >= QUIET_GRACE) c.unknown.add(d);
      } else if (i >= len - g.n) c.slips.add(d);
    }
  }
  return c;
}

/** whether Daybook knows how day k went (a day from Day 1 on that counts as a no-slip day when no slip is logged). From truthFrom
    on, a night not told is not known: it counts neither way. Today is known (it is still going). */
export function dayKnown(days: Days, st: Settings, k: DayKey, tk: DayKey): boolean {
  if (k >= tk) return true;
  const c = work(days, st, tk);
  return !c.unknown.has(k) && !c.untold.has(k);
}

/** whether the night of day k was not told (truth.ts): drawn hollow, counted as nothing */
export function dayUntold(days: Days, st: Settings, k: DayKey, tk: DayKey): boolean {
  if (k >= tk) return false;
  return work(days, st, tk).untold.has(k);
}

/** the nights not told, oldest first */
export function untoldDays(days: Days, st: Settings, tk: DayKey): DayKey[] {
  return [...work(days, st, tk).untold].sort();
}

/** the state of the night of day k, as every surface draws it (truth.ts): a slip, told free, or not told. Before truthFrom, and
    for a day Daybook counts the old way, a day with no slip is free. Today, still going, is free until something says otherwise. */
export function nightState(days: Days, st: Settings, k: DayKey, tk: DayKey): NightState {
  if ((days[k]?.events || []).some((e) => e.outcome === 'slipped') || awaySlipDay(days, st, k, tk)) return 'slip';
  return dayUntold(days, st, k, tk) ? 'untold' : 'free';
}

/** whether day k carries one of the slips from an answer about a gap (the last n days of the gap) */
export function awaySlipDay(days: Days, st: Settings, k: DayKey, tk: DayKey): boolean {
  if (k >= tk) return false;
  return work(days, st, tk).slips.has(k);
}

/** the gap day k is in, answered or not (every day of it, the grace days too), or null */
export function awayGapAt(days: Days, st: Settings, k: DayKey, tk: DayKey): AwayGap | null {
  if (k >= tk) return null;
  return work(days, st, tk).at.get(k) || null;
}

/** every gap, oldest first */
export function awayGaps(days: Days, st: Settings, tk: DayKey): AwayGap[] {
  return work(days, st, tk).gaps.slice();
}

/** the not-known days, oldest first */
export function unknownDays(days: Days, st: Settings, tk: DayKey): DayKey[] {
  return [...work(days, st, tk).unknown].sort();
}

/** the day after the latest gap that was not answered, or had slips: the first day a step-down stretch can vouch for */
export function awayStretchFrom(days: Days, st: Settings, tk: DayKey): DayKey | null {
  const g = work(days, st, tk)
    .gaps.filter((x) => x.n == null || x.n > 0)
    .pop();
  return g ? addDays(g.to, 1) : null;
}

/** whether a Welcome back answer was given on log day k */
export const awayAnsweredOn = (st: Settings, k: DayKey): boolean => awayOf(st).some((x) => x.on === k);

/** the gap to ask about on coming back: the latest one not answered yet that reaches Day 1, as the whole time away (from
    Day 1 at the earliest). n: its days, and the most slips the question offers. null when there is nothing to ask. */
export function awayDue(days: Days, st: Settings, tk: DayKey): { from: DayKey; to: DayKey; n: number; max: number; away?: false } | null {
  if (!isKey(st.day1)) return null;
  const d1 = st.day1 as DayKey;
  const g = work(days, st, tk)
    .gaps.filter((x) => x.n == null && x.to >= d1)
    .pop();
  if (!g) return null;
  const from = g.from < d1 ? d1 : g.from;
  const n = daysIn(from, g.to);
  return { from, to: g.to, n, max: Math.min(n, AWAY_MAX), ...(g.away === false ? { away: false as const } : {}) };
}

/** the answers with this one added (the caller saves it with changeSettings): n slips while away, from 0 */
export function withAway(st: Settings, gap: { from: DayKey; to: DayKey }, n: number, on?: DayKey): AwayEntry[] {
  const rest = awayOf(st).filter((x) => x.to < gap.from || x.from > gap.to);
  const v = Math.max(0, Math.min(AWAY_MAX, Math.round(n) || 0));
  return [...rest, { from: gap.from, to: gap.to, n: v, ...(on && isKey(on) ? { on } : {}) }].sort((x, y) => (x.from < y.from ? -1 : 1));
}

/** the day this version began marking opens, set once (the app does it the first time Today shows): the quiet-day rule
    counts from here */
export const awayFromOf = (st: Settings | null): DayKey | null => {
  const v = st && (st as { awayFrom?: unknown }).awayFrom;
  return isKey(v) ? v : null;
};
