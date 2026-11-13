/* The number on the flame's picture at the top of Today: one count per mode (the owner, October 30, 2026), shown the same
   everywhere. Strict: the days in a row with no slip, which a slip puts to 0, climbing again from the next day. Gentle: the
   days that hold (todayMeasure: the last week until 30 days hold, then the way to graduation); a slip takes one day off,
   never all of them. Stepping down: this stretch, with the best before it. The tracking week: which day of it. Just
   tracking: how many days so far. The chip under the number: the hours since the last slip, for 72 hours after one; after
   that, in strict, the way to graduation or the best run. Graduation and its count are the same in every mode.
   Back after days away, while the gap is not answered (away.ts), the last week is not known, so gentle's count alone would
   say "Day 1 is today" to someone on day 31. Until the gap is answered, its number is the measure as it stood before the
   days that are not known ("Before you were away"), beside the row that asks about them; strict's run simply waits across
   them. On the day of a slip, one quiet line under the number says the slip is logged and what stays (heroSlipLine). Checked
   by test/hero.test.ts. */
import { awayGaps, QUIET_GRACE } from './away';
import { GRAD_DAYS, GRAD_WINDOW, gradInfo, gradOnToday, todayMeasure, WEEK, type TodayMeasure } from './graduate';
import { addDays, computeMetrics, diffDays, evMs, fmtDate, fmtStretch, fmtStretchShort, phaseOf, runLedger, stepView, sumDay } from './legacy/core.js';
import type { DayKey, Days, Settings } from './types';

export interface HeroNumber {
  /** the small words above the number ("This stretch"), shown in capitals */
  eb: string;
  n: string;
  unit: string;
  /** a small chip beside it: "best 65 h", "New best", "Counting starts Oct 20" */
  chip: string | null;
  /** the chip is a best, shown with a star */
  star: boolean;
  /** all of it, for a screen reader */
  say: string;
}
/** how long the hours since a slip are the chip: 72 hours */
export const SLIP_HOURS = 72;
/** when a slip happened, as far as Daybook knows, in ms: its time, or for a slip with no time (the morning's "It happened",
    or one logged without a time), the moment it was told, never a made-up noon the day before (C1). The id of an entry
    starts with the moment it was made (mutate.ts makeId); an id that does not, or reads as far off, falls back to the day's last
    change, then to noon of its day. */
export function slipAt(days: Days, st: Settings, k: DayKey, e: { time: string | null; id?: string }): number {
  if (e.time) return evMs(k, e.time, st.rollover);
  const noon = evMs(k, null, st.rollover);
  const made = e.id && /^[0-9a-z]{8,9}[0-9a-z]{4}$/.test(e.id) ? parseInt(e.id.slice(0, -4), 36) : NaN;
  if (isFinite(made) && made >= noon - 864e5 && made <= noon + 4 * 864e5) return Math.max(noon, made);
  return Math.max(noon, days[k]?.u || 0);
}
/** the latest slip in the last four log days (72 hours reach back at most that far): its day, when it happened (slipAt), and
    whether it had a time */
export function latestSlip(days: Days, st: Settings, tk: DayKey): { k: DayKey; at: number; timed: boolean } | null {
  for (let i = 0; i <= 4; i++) {
    const k = addDays(tk, -i);
    if (!sumDay(days[k]).slipped) continue;
    const sl = days[k].events.filter((e) => e.outcome === 'slipped');
    const at = Math.max(...sl.map((e) => slipAt(days, st, k, e)));
    return { k, at, timed: sl.every((e) => !!e.time) };
  }
  return null;
}
/** the hours since the latest slip, while counting days (strict or gentle), for SLIP_HOURS after it. null otherwise. */
export function hoursSinceSlip(days: Days, st: Settings, tk: DayKey, nowMs: number): number | null {
  if (!st.day1 || tk < st.day1 || (st.cleanMode !== 'strict' && st.cleanMode !== 'gentle')) return null;
  const l = latestSlip(days, st, tk);
  if (!l || l.k < st.day1) return null;
  const h = Math.max(0, (nowMs - Math.min(l.at, nowMs)) / 36e5);
  return h < SLIP_HOURS ? h : null;
}
/** the chip for those hours: "13 hours since your last slip" */
export function slipHoursChip(h: number): string {
  const w = fmtStretch(h);
  return w.charAt(0).toUpperCase() + w.slice(1) + ' since your last slip';
}
/** the chip for a slip with no time, which has no true number of hours: "Your last slip: last night" (C1). Null when the latest
    slip had a time, or is past SLIP_HOURS. */
export function slipWhenChip(days: Days, st: Settings, tk: DayKey, nowMs: number): string | null {
  if (hoursSinceSlip(days, st, tk, nowMs) == null) return null;
  const l = latestSlip(days, st, tk);
  if (!l || l.timed) return null;
  const w = l.k === tk ? 'today' : l.k === addDays(tk, -1) ? 'last night' : fmtDate(l.k, { weekday: 'long' }) + ' night';
  return 'Your last slip: ' + w;
}
/** the chip under the number for the hours after a slip: the hours, or for a slip with no time, when */
function slipChip(days: Days, st: Settings, tk: DayKey, nowMs: number): string | null {
  const h = hoursSinceSlip(days, st, tk, nowMs);
  if (h == null) return null;
  return slipWhenChip(days, st, tk, nowMs) || slipHoursChip(h);
}
/** while the latest gap away is not answered and its not-known days reach into the last week: the week's measure as it
    stood on the first day that is not known (the last one Daybook could count), or null */
export function awayHeldMeasure(days: Days, st: Settings, tk: DayKey): TodayMeasure | null {
  const g = awayGaps(days, st, tk)
    .filter((x) => x.n == null && x.len > QUIET_GRACE && x.away !== false)
    .pop();
  if (!g) return null;
  const edge = addDays(g.from, QUIET_GRACE);
  if (edge >= tk || g.to < addDays(tk, -WEEK)) return null;
  const t = todayMeasure(days, st, edge);
  return t && t.k === 'week' && t.n > 0 ? t : null;
}
export function heroNumber(days: Days, st: Settings, tk: DayKey, nowMs: number): HeroNumber | null {
  const out = (eb: string, n: string, unit: string, chip: string | null = null, star = false): HeroNumber => ({
    eb,
    n,
    unit,
    chip,
    star,
    say: [eb + ': ' + n + (unit ? ' ' + unit : ''), chip].filter(Boolean).join('. ') + '.',
  });
  if (st.cleanMode === 'step') {
    const v = stepView(days, st, nowMs);
    const f = fmtStretch(v.curH);
    const m = /^(\d+) (.+)$/.exec(f);
    const chip = v.bestPast > 0 ? (v.curH > v.bestPast ? 'New best' : 'best ' + fmtStretchShort(v.bestPast)) : null;
    return out('This stretch', m ? m[1] : '<1', m ? m[2] : 'hour', chip, !!chip);
  }
  const t = todayMeasure(days, st, tk);
  if (t) {
    const hours = slipChip(days, st, tk, nowMs);
    /* on the day of a slip, "No slip" over the count would not be true */
    const label = (days[tk]?.events || []).some((e) => e.outcome === 'slipped') ? 'Still going' : 'No slip';
    if (st.cleanMode !== 'gentle') {
      const cur = runLedger(days, st, tk).cur;
      const g = gradInfo(days, st, tk);
      const longest = computeMetrics(days, st, tk).longest;
      const way = g.at ? 'Graduated · ' + g.count + ' of the last ' + GRAD_WINDOW : gradOnToday(g) ? g.count + ' of ' + GRAD_DAYS + ' toward graduation' : null;
      const best = longest > cur ? 'best ' + longest + (longest === 1 ? ' day' : ' days') : null;
      const chip = hours || way || best;
      if (st.day1 === tk && cur === 1) return out('Quitting', 'Day 1', 'is today', chip);
      return out(label, String(cur), cur === 1 ? 'day' : cur === 0 ? 'days' : 'days in a row', chip, !hours && !way && !!best);
    }
    if (t.k === 'grad') return out('Graduated', String(t.n), 'of the last ' + GRAD_WINDOW + ' days', hours || 'Still going');
    if (t.k === 'way') return out('Toward graduation', String(t.n), 'of ' + GRAD_DAYS, hours);
    /* back after days away, the gap not answered yet: the count as it stood before it, when that is more than the week shows */
    const held = awayHeldMeasure(days, st, tk);
    if (held && held.n > t.n) return out('Before you were away', String(held.n), held.of.replace(/^of the last /, 'of '), hours);
    if (t.of === 'Day 1 is today') return out('Quitting', 'Day 1', 'is today', hours);
    if (t.of === 'Today counts') return out('Still going', 'Today', 'counts', hours);
    return out(label, String(t.n), t.of.replace(/ with no slip$/, ''), hours);
  }
  const p = phaseOf(tk, st);
  if (p.p !== 'tracking') return null;
  const week = !!st.day1 && diffDays(st.day1, st.start) === 7;
  /* the chip says when counting starts, so it never reads as a second Day 1 beside the day of the tracking week */
  const d1 = st.day1 ? 'Counting starts ' + fmtDate(st.day1, { month: 'short', day: 'numeric' }) : null;
  return out(week ? 'Tracking week' : st.day1 ? 'Tracking, before your count' : 'Just tracking', 'Day ' + p.n, week ? 'of 7' : '', d1);
}

/** the day of a slip: one quiet line under the number, so the slip is never read as missed, and what stays is said.
    Strict: the days before it are on the record. Gentle: the days that hold stay. Null otherwise. */
export function heroSlipLine(days: Days, st: Settings, tk: DayKey, nowMs: number): string | null {
  if (st.cleanMode === 'step' || !st.day1 || tk < st.day1) return null;
  const slips = (days[tk]?.events || []).filter((e) => e.outcome === 'slipped');
  if (!slips.length) return null;
  const strict = st.cleanMode !== 'gentle';
  const n = strict ? (tk > st.day1 ? runLedger(days, st, addDays(tk, -1)).cur : 0) : Number(heroNumber(days, st, tk, nowMs)?.n);
  if (!(n > 0)) return null;
  /* the latest slip's hour, in the log day's order (an hour after midnight comes after the evening) */
  const hours = slips
    .map((e) => e.time)
    .filter((x): x is string => !!x && /^\d\d:\d\d$/.test(x))
    .map((x) => +x.slice(0, 2));
  const rolled = (x: number) => (x < st.rollover ? x + 24 : x);
  const hour = hours.length ? hours.sort((a, b) => rolled(a) - rolled(b)).slice(-1)[0] : new Date(nowMs).getHours();
  const when = hour < st.rollover || hour >= 17 ? 'Tonight' : hour < 12 ? 'This morning' : 'Today';
  if (strict) return when + ' is logged. Your ' + n + (n === 1 ? ' day is' : ' days are') + ' on your record.';
  return when + ' is logged. Your ' + n + (n === 1 ? ' day stays' : ' days stay') + ' yours.';
}
