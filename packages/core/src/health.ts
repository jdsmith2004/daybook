/* Nights from Apple Health (the owner, November 8, 2026; docs/plan.md, "Your nights from Apple Health"). Sleep only: the
   research supports "short sleep makes craving a little stronger the next day" and nothing stronger, so Daybook reads how long
   a person slept and nothing else from Health.

   Nights from Health are kept on the phone only, in their own store outside the log (the app keeps them under a key that is
   not "daybook:"), so they are never synced, never in the safe copy, never counted and never sent. They are never copied into
   a check-in: what the person types for a night wins, and a night from Health only fills a night they did not type.

   A night belongs to the log day it leads into: the sleep that starts between 6 PM the evening before and 2 PM that day, so
   an afternoon nap the day before is not counted as the night. Phone and watch often record the same sleep, so the asleep
   spans are joined before they are added up. */
import { addDays } from './legacy/core.js';
import type { DayKey, Days } from './types';

/** hours slept the night before each log day, from Health */
export type Nights = Record<DayKey, number>;

/** one sleep sample from Health: a span and its kind (HealthKit's sleep analysis values) */
export interface SleepSample {
  start: number;
  end: number;
  value: number;
}

/** the kinds that are sleep: asleep (unspecified), core, deep and REM. In bed (0) and awake (2) are not. */
export const ASLEEP = [1, 3, 4, 5];
/** how many nights back Daybook reads and keeps */
export const NIGHTS_BACK = 90;
/** a night shorter than this is a fragment (a watch put on late, a phone left on the bed), not a night's sleep */
const NIGHT_MIN_H = 1;
const NIGHT_MAX_H = 20;
const KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

const pad = (n: number) => String(n).padStart(2, '0');
const localKey = (d: Date): DayKey => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const at = (k: DayKey, h: number) => new Date(k + 'T' + pad(h) + ':00:00').getTime();

/** the log day a sleep that starts at `ms` leads into: from 6 PM on, the next day */
export function nightOf(ms: number): DayKey {
  const d = new Date(ms);
  const k = localKey(d);
  return d.getHours() >= 18 ? addDays(k, 1) : k;
}

/** hours asleep each night, from Health's samples. Only sleep that starts from 6 PM the evening before to 2 PM counts. */
export function nightsOf(samples: SleepSample[]): Nights {
  const by: Record<DayKey, [number, number][]> = {};
  for (const s of samples) {
    if (!s || !ASLEEP.includes(s.value) || !Number.isFinite(s.start) || !Number.isFinite(s.end) || s.end <= s.start) continue;
    const k = nightOf(s.start);
    if (s.start >= at(k, 14)) continue;
    (by[k] ||= []).push([s.start, s.end]);
  }
  const out: Nights = {};
  for (const k of Object.keys(by).sort()) {
    const spans = by[k].sort((a, b) => a[0] - b[0]);
    let ms = 0;
    let [a, b] = spans[0];
    for (const [x, y] of spans.slice(1)) {
      if (x <= b) b = Math.max(b, y);
      else {
        ms += b - a;
        [a, b] = [x, y];
      }
    }
    ms += b - a;
    const h = Math.round((ms / 3_600_000) * 10) / 10;
    if (h >= NIGHT_MIN_H && h <= NIGHT_MAX_H) out[k] = h;
  }
  return out;
}

/** nights that came from somewhere else (storage), cleaned: real day keys, sensible hours, only the latest NIGHTS_BACK */
export function normNights(x: unknown): Nights {
  if (!x || typeof x !== 'object' || Array.isArray(x)) return {};
  const ok = Object.entries(x as Record<string, unknown>)
    .filter(([k, v]) => KEY_RE.test(k) && typeof v === 'number' && v >= NIGHT_MIN_H && v <= NIGHT_MAX_H)
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .slice(-NIGHTS_BACK);
  return Object.fromEntries(ok) as Nights;
}

/** what is kept after a fresh read: the read wins for the nights it covers, older kept nights stay */
export function mergeNights(kept: Nights, read: Nights): Nights {
  return normNights({ ...kept, ...read });
}

/** the first night a read asks for: NIGHTS_BACK nights before today, from 6 PM */
export function nightsSince(tk: DayKey): number {
  return at(addDays(tk, -NIGHTS_BACK - 1), 18);
}

/** whether Health has the night before log day k (the check-in then leaves out its sleep step) */
export const healthHasNight = (nights: Nights | null | undefined, k: DayKey): boolean => typeof nights?.[k] === 'number';

/** hours slept the night before day k: what the person typed in the check-in, or else Health's, or null */
export function sleepOn(days: Days, nights: Nights | null | undefined, k: DayKey): number | null {
  const typed = days[k]?.checkin?.h;
  if (typeof typed === 'number') return typed;
  return healthHasNight(nights, k) ? nights![k] : null;
}
