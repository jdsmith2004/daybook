/* Where the log starts: the day of the first log, an urge or slip logged or a check-in answered (the morning questions
   count). Days before it were never tracked, so they are not clean days, a first stretch or a pattern. A lesson read, a
   tool tried, the phone put away, or what the app keeps by itself (a hard hour held, last night's screens answered the
   next morning, which is kept on the night before) does not start the log: it says nothing about whether the day had a
   slip. Used by startFromLog (actions.ts) and by every page that walks the log from its first day. */
import { allKeys } from './legacy/core.js';
import type { Day, DayKey, Days, Settings } from './types';

/** an urge or slip logged that day, or a check-in or the morning questions answered */
export function loggedDay(d: Day | null | undefined): boolean {
  if (!d) return false;
  if ((d.events && d.events.length) || (d.p && d.p.m)) return true;
  const c = d.checkin;
  return !!(
    c &&
    (c.done || c.md != null || c.u != null || c.m != null || c.c != null || c.e != null || c.s != null || c.h != null || c.ro != null || (c.n || '').trim())
  );
}
/** the first day with something logged */
export function firstLog(days: Days): DayKey | null {
  return allKeys(days).find((k) => loggedDay(days[k])) || null;
}
/** the first day of the log: the tracking start, or an earlier day with something logged (from before a start moved later) */
export function logStart(days: Days, st: Settings): DayKey {
  const k = firstLog(days);
  return k && k < st.start ? k : st.start;
}
