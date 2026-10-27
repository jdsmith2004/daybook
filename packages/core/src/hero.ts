/* The number on the flame's picture at the top of Today: the one number for where the person is. Stepping down: this
   stretch, with the best before it. Quitting: the days that hold (todayMeasure: the last week until 30 days hold, then the
   way to graduation). The tracking week: which day of it. Just tracking: how many days so far. It holds what was earned, like
   the measures it comes from. Right after a slip that ended the run (the owner, October 21: hours are more motivating
   after a loss), the hours since it, for 72 hours, with the days that hold beside them.
   Back after days away, while the gap is not answered (away.ts), the last week is not known, so the week's count alone
   would say "Day 1 is today" to someone on day 31. Until the gap is answered, the number is the measure as it stood
   before the days that are not known ("Before you were away"), beside the row that asks about them: nothing earned ever
   reads as a reset. On the day of a slip, while the number still shows the days that hold, one quiet line under it says
   the slip is logged and the days stay (heroSlipLine). Checked by test/hero.test.ts. */
import { awayGaps, QUIET_GRACE } from './away';
import { GRAD_DAYS, todayMeasure, WEEK, type TodayMeasure } from './graduate';
import { addDays, dayKind, diffDays, evMs, fmtDate, fmtStretch, fmtStretchShort, phaseOf, runLedger, stepView, sumDay } from './legacy/core.js';
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
/** how long the hours since a slip are the number: 72 hours, then the days that hold again */
export const SLIP_HOURS = 72;
/** the hours since the latest slip, while counting days: for SLIP_HOURS after it, when that slip ended the run (it was not kept:
    not saved, and not waiting for the Rekindle quest). A slip that still counts as a good day (gentle, one slip) is not one.
    null otherwise. */
export function hoursSinceSlip(days: Days, st: Settings, tk: DayKey, nowMs: number): number | null {
  if (!st.day1 || tk < st.day1 || (st.cleanMode !== 'strict' && st.cleanMode !== 'gentle')) return null;
  /* the latest slip day: 72 hours reach back at most four days */
  let k: DayKey | null = null;
  for (let i = 0; i <= 4 && !k; i++) if (sumDay(days[addDays(tk, -i)]).slipped) k = addDays(tk, -i);
  if (!k || k < st.day1 || dayKind(k, days[k], st, tk, undefined, days) !== 'slip') return null;
  if (runLedger(days, st, tk).kind[k]) return null;
  const at = Math.max(...days[k].events.filter((e) => e.outcome === 'slipped').map((e) => evMs(k, e.time, st.rollover)));
  const h = Math.max(0, (nowMs - Math.min(at, nowMs)) / 36e5);
  return h < SLIP_HOURS ? h : null;
}
/** while the latest gap away is not answered and its not-known days reach into the last week: the week's measure as it
    stood on the first day that is not known (the last one Daybook could count), or null */
export function awayHeldMeasure(days: Days, st: Settings, tk: DayKey): TodayMeasure | null {
  const g = awayGaps(days, st, tk)
    .filter((x) => x.n == null && x.len > QUIET_GRACE)
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
  const h = t ? hoursSinceSlip(days, st, tk, nowMs) : null;
  if (t && h != null) {
    const m = /^(\d+) (.+)$/.exec(fmtStretch(h));
    const n = m ? m[1] : '<1';
    const unit = m ? m[2] : 'hour';
    /* what was earned stays in view: the days that hold, as the chip */
    const chip = t.n > 0 ? t.n + ' ' + t.of.replace(/ with no slip$/, '') : t.of;
    const said = t.n > 0 ? t.n + ' ' + t.of : t.of;
    return { eb: 'Since your last slip', n, unit, chip, star: false, say: (m ? m[0] : 'Under an hour') + ' since your last slip. ' + said + '.' };
  }
  if (t) {
    if (t.k === 'grad') return out('Graduated', String(t.n), 'of the last 100 days', 'Still going');
    if (t.k === 'way') return out('Toward graduation', String(t.n), 'of ' + GRAD_DAYS);
    /* back after days away, the gap not answered yet: the count as it stood before it, when that is more than the week shows */
    const held = t.k === 'week' ? awayHeldMeasure(days, st, tk) : null;
    if (held && held.n > t.n) return out('Before you were away', String(held.n), held.of.replace(/^of the last /, 'of '));
    if (t.of === 'Day 1 is today') return out('Quitting', 'Day 1', 'is today');
    if (t.of === 'Today counts') return out('Still going', 'Today', 'counts');
    return out('No slip', String(t.n), t.of.replace(/ with no slip$/, ''));
  }
  const p = phaseOf(tk, st);
  if (p.p !== 'tracking') return null;
  const week = !!st.day1 && diffDays(st.day1, st.start) === 7;
  /* the chip says when counting starts, so it never reads as a second Day 1 beside the day of the tracking week */
  const d1 = st.day1 ? 'Counting starts ' + fmtDate(st.day1, { month: 'short', day: 'numeric' }) : null;
  return out(week ? 'Tracking week' : st.day1 ? 'Tracking' : 'Just tracking', 'Day ' + p.n, week ? 'of 7' : '', d1);
}

/** the day of a slip, while the number still shows the days that hold (today counts once it ends, and a run that is kept
    keeps its measure): one quiet line under it, so the number never reads as if the slip was missed. Null otherwise. */
export function heroSlipLine(days: Days, st: Settings, tk: DayKey, nowMs: number): string | null {
  if (st.cleanMode === 'step') return null;
  const slips = (days[tk]?.events || []).filter((e) => e.outcome === 'slipped');
  if (!slips.length) return null;
  const h = heroNumber(days, st, tk, nowMs);
  const n = h ? Number(h.n) : NaN;
  if (!h || h.eb === 'Since your last slip' || !(n > 0)) return null;
  /* the latest slip's hour, in the log day's order (an hour after midnight comes after the evening) */
  const hours = slips
    .map((e) => e.time)
    .filter((x): x is string => !!x && /^\d\d:\d\d$/.test(x))
    .map((x) => +x.slice(0, 2));
  const rolled = (x: number) => (x < st.rollover ? x + 24 : x);
  const hour = hours.length ? hours.sort((a, b) => rolled(a) - rolled(b)).slice(-1)[0] : new Date(nowMs).getHours();
  const when = hour < st.rollover || hour >= 17 ? 'Tonight' : hour < 12 ? 'This morning' : 'Today';
  return when + ' is logged. Your ' + n + (n === 1 ? ' day stays' : ' days stay') + ' yours.';
}
