/* The number on the flame's picture at the top of Today: the one number for where the person is. Stepping down: this
   stretch, with the best before it. Quitting: the days that hold (todayMeasure: the last week at first, then the way to
   graduation). The tracking week: which day of it. Just tracking: how many days so far. It holds what was earned, like
   the measures it comes from. Checked by test/hero.test.ts. */
import { GRAD_DAYS, todayMeasure } from './graduate';
import { diffDays, fmtDate, fmtStretch, fmtStretchShort, phaseOf, stepView } from './legacy/core.js';
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
    if (t.k === 'grad') return out('Graduated', String(t.n), 'of the last 100 days', 'Still going');
    if (t.k === 'way') return out('Toward graduation', String(t.n), 'of ' + GRAD_DAYS);
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
