/* Graduation: a celebration and an award that is kept for good. It is earned with 90 no-slip days within the last 100, not 90
   in a row, so a slip never wipes out what was built: a slip at day 89 makes the count 88, and it climbs again the next day.

   It stays quiet early on. Before the first 7 days in a row with no slip, Daybook only mentions that it exists; after that it
   shows the count, warmly, and never as a countdown. Once earned, settings.gradAt holds the date and is never cleared, so the
   award survives later slips, rule changes and sync. Today does not change. Checked by test/graduate.test.ts. */
import { changeSettings, type Change } from './actions';
import { addDays, computeMetrics, eventsOf, isKey } from './legacy/core.js';
import type { DayKey, Days, Settings } from './types';

/** no-slip days needed, within the last GRAD_WINDOW days */
export const GRAD_DAYS = 90;
export const GRAD_WINDOW = 100;
/** the first stretch with no slip, in a row, before Daybook starts showing the way to graduation */
export const GRAD_GATE = 7;
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
  const slips = new Set(eventsOf(days).filter((e) => e.outcome === 'slipped').map((e) => e.key));
  const first = isKey(st.day1) ? (st.day1 as DayKey) : null;
  let count = 0;
  if (first)
    for (let i = 1; i <= GRAD_WINDOW; i++) {
      const k = addDays(tk, -i);
      if (k >= first && !slips.has(k)) count++;
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
