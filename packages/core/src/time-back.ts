/* The time given back, on Today (the owner, November 13, 2026: "how much time they've gotten back in their life ... but we should
   obviously make it look good"). The number is hoursBack (miles.ts): the no-slip days since Day 1, at the pace the person told the
   setup. This file decides when Today shows it and how it is said. */
import { addDays, eventsOf } from './legacy/core.js';
import { hoursBack } from './miles';
import type { DayKey, Days, Settings } from './types';

/** below this it is too small to be a picture of a life coming back, so Today waits for it */
export const TIME_BACK_MIN = 3;

export interface TimeBack {
  /** the hours, as hoursBack rounds them */
  h: number;
  /** the big part ("10", "2½") and its unit ("hours", "days") */
  n: string;
  unit: string;
  /** said in full, for a screen reader */
  say: string;
}

/** how the time is said: hours until two whole days, then days (to the half day under ten, whole days after) */
export function timeBackWords(h: number): { n: string; unit: string } {
  if (h < 48) return { n: h.toLocaleString('en-US'), unit: h === 1 ? 'hour' : 'hours' };
  const d = h / 24;
  if (d < 10) {
    const half = Math.round(d * 2) / 2;
    const whole = Math.floor(half);
    return { n: whole + (half > whole ? '½' : ''), unit: 'days' };
  }
  return { n: Math.round(d).toLocaleString('en-US'), unit: 'days' };
}

/** the time given back for Today, or null when it waits: no Day 1 or no setup answers, under TIME_BACK_MIN hours, or a slip today
    or yesterday (the hours after a slip are for coming back; the time is still all there, and it shows again the day after). It
    only goes up: a slip day adds nothing, and takes nothing away. */
export function timeBack(days: Days, st: Settings, tk: DayKey): TimeBack | null {
  const h = hoursBack(days, st, tk);
  if (h == null || h < TIME_BACK_MIN) return null;
  const yest = addDays(tk, -1);
  if (eventsOf(days).some((e) => e.outcome === 'slipped' && (e.key === tk || e.key === yest))) return null;
  const w = timeBackWords(h);
  return { h, ...w, say: 'About ' + w.n.replace('½', ' and a half') + ' ' + w.unit + ' given back to your life so far, at the pace you told the setup.' };
}
