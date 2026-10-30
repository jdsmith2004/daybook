/* Graduation: a celebration and an award that is kept for good. It is earned with 90 no-slip days within the last 100, not 90
   in a row, so a slip never wipes out what was built: a slip at day 89 makes the count 88, and it climbs again the next day.

   It stays quiet early on. Before the first 7 days in a row with no slip, Daybook only mentions that it exists; after that
   Milestones shows the count, warmly, and never as a countdown. Today waits longer: the count shows there only once 30 days
   hold (GRAD_TODAY), so a big goal is never pushed in the first weeks. Display only: the count and the award do not change.
   Once earned, settings.gradAt holds the date and is never cleared, so the award survives later slips, rule changes and
   sync; earning it does not change Today. Days Daybook does not know about (a long gap away, away.ts) count neither way. Checked by test/graduate.test.ts. */
import { changeSettings, type Change } from './actions';
import { addDays, computeMetrics, eventsOf, isKey } from './legacy/core.js';
import { awaySlipDay, dayKnown } from './away';
import type { DayKey, Days, Settings } from './types';

/** no-slip days needed, within the last GRAD_WINDOW days */
export const GRAD_DAYS = 90;
export const GRAD_WINDOW = 100;
/** the first stretch with no slip, in a row, before Daybook starts showing the way to graduation */
export const GRAD_GATE = 7;
/** no-slip days within the window before Today shows the way to graduation (Milestones shows it from GRAD_GATE) */
export const GRAD_TODAY = 30;
/** from here on, an "almost there" word */
export const GRAD_NEAR = 80;

export const gradOf = (st: Settings | null): DayKey | null => (st && isKey(st.gradAt) ? (st.gradAt as DayKey) : null);

export interface GradInfo {
  /** finished days within the last GRAD_WINDOW (from Day 1 on) with no slip */
  count: number;
  /** show the way to graduation (or the award) */
  show: boolean;
  /** close to it */
  near: boolean;
  /** earned now, and not recorded yet */
  ready: boolean;
  /** the day it was earned, kept for good */
  at: DayKey | null;
}

export function gradInfo(days: Days, st: Settings, tk: DayKey): GradInfo {
  const slips = new Set(
    eventsOf(days)
      .filter((e) => e.outcome === 'slipped')
      .map((e) => e.key),
  );
  const first = isKey(st.day1) ? (st.day1 as DayKey) : null;
  let count = 0;
  if (first)
    for (let i = 1; i <= GRAD_WINDOW; i++) {
      const k = addDays(tk, -i);
      /* only days Daybook knows about: a long gap away never graduates anyone by itself (away.ts) */
      if (k >= first && !slips.has(k) && dayKnown(days, st, k, tk) && !awaySlipDay(days, st, k, tk)) count++;
    }
  const at = gradOf(st);
  const longest = first ? computeMetrics(days, st, tk).longest : 0;
  return {
    count,
    show: !!at || longest >= GRAD_GATE,
    near: !at && count >= GRAD_NEAR && count < GRAD_DAYS,
    ready: !at && count >= GRAD_DAYS,
    at,
  };
}

/** Today shows the count toward graduation (or the award): once graduated, or once GRAD_TODAY days hold */
export const gradOnToday = (g: GradInfo): boolean => !!g.at || (g.show && g.count >= GRAD_TODAY);

/** record graduation: the date is set once and never changed */
export const graduate = (st: Settings, tk: DayKey, now = Date.now()): Change => ({
  st: gradOf(st) ? st : changeSettings(st, (s) => void (s.gradAt = tk), now),
});

/** the line about graduation, in warm words (null while it stays quiet) */
export function gradLine(g: GradInfo): string | null {
  if (g.at) return `Still going: ${g.count} of the last ${GRAD_WINDOW} days with no slip.`;
  if (!g.show) return null;
  if (g.near) return `${g.count} of ${GRAD_DAYS} toward graduation. Almost there, and every day already counts.`;
  return `${g.count} of ${GRAD_DAYS} toward graduation. Every day with no slip in your last ${GRAD_WINDOW} counts.`;
}

/** what Milestones says before the first week, quietly */
export const GRAD_ABOUT = `Graduation is a big one for later: ${GRAD_DAYS} days with no slip within ${GRAD_WINDOW}. A hard day does not erase the others. For now, one day at a time is plenty.`;

/** the days that hold: gentle's number on Today (hero.ts), and the way to graduation in every mode. Until GRAD_TODAY days
    hold, only the last 7 days, small and close; after that, the way to graduation; once graduated, the count that keeps
    going. It never drops to zero after a slip: a slip takes one day off, and the rest stay. Null before Day 1 (the tracking
    week has its own card). */
export interface TodayMeasure {
  k: 'week' | 'way' | 'grad';
  /** the big number */
  n: number;
  /** "of 7 days with no slip", "of 90 toward graduation" */
  of: string;
  /** a short warm line under it */
  sub: string;
  /** the week: the last 7 finished days, oldest first, then today (open) */
  cells?: ('ok' | 'slip' | 'none' | 'today')[];
  /** the way to graduation, 0 to 1 */
  frac?: number;
}
export const WEEK = 7;
export function todayMeasure(days: Days, st: Settings, tk: DayKey): TodayMeasure | null {
  const first = isKey(st.day1) ? (st.day1 as DayKey) : null;
  if (!first || first > tk) return null;
  const g = gradInfo(days, st, tk);
  if (g.at) return { k: 'grad', n: g.count, of: `of the last ${GRAD_WINDOW} days with no slip`, sub: 'Graduated, for good. Still going.' };
  if (gradOnToday(g))
    return {
      k: 'way',
      n: g.count,
      of: `of ${GRAD_DAYS} toward graduation`,
      sub: g.near ? 'Almost there, and every day already counts.' : `Every day with no slip in your last ${GRAD_WINDOW} counts.`,
      frac: Math.min(1, g.count / GRAD_DAYS),
    };
  const slips = new Set(
    eventsOf(days)
      .filter((e) => e.outcome === 'slipped')
      .map((e) => e.key),
  );
  const cells: ('ok' | 'slip' | 'none' | 'today')[] = [];
  let n = 0;
  let m = 0;
  for (let i = WEEK; i >= 1; i--) {
    const k = addDays(tk, -i);
    if (k < first || !dayKnown(days, st, k, tk)) cells.push('none');
    else {
      m++;
      if (slips.has(k) || awaySlipDay(days, st, k, tk)) cells.push('slip');
      else {
        n++;
        cells.push('ok');
      }
    }
  }
  cells.push('today');
  if (!m) return { k: 'week', n: 0, of: 'Day 1 is today', sub: 'One day at a time is plenty.', cells };
  /* never a big zero the morning after a slip: today is the day that counts */
  if (!n) return { k: 'week', n: 0, of: 'Today counts', sub: 'A slip is data, not a reset. Today is a fresh day.', cells };
  return { k: 'week', n, of: `of the last ${m} ${m === 1 ? 'day' : 'days'} with no slip`, sub: 'Small and close: one day at a time.', cells };
}
