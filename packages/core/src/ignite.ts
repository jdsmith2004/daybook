/* Lighting the night (the owner, November 12, 2026: "compared to that our streak ignition is literal trash"). When the morning says
   last night was free, the person lights their own flame: it waits dark with an ember in it, they swipe it up, it bursts, and the
   number turns over. These are the rules for what that moment says and the row of nights under it. The screen is
   apps/mobile/src/app/ignite.tsx. Modeled on Duolingo's streak ignition, translated: the flame is both the streak and the mascot,
   and the words are about who the person is becoming, never only the number. */
import { addDays, sumDay } from './legacy/core.js';
import { morningOf, nightTold } from './morning-set';
import type { DayKey, Days, Settings } from './types';

/** a night on the row: told free, a slip, not told, or before the log began */
export type NightMark = 'free' | 'slip' | 'untold' | 'none';

const DAY2 = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
/** the two letters of a log day's weekday */
export const day2 = (k: DayKey): string => DAY2[new Date(k + 'T12:00:00').getDay()];

/** the first morning that told a night, up to tk */
export function firstTold(days: Days, tk: DayKey): DayKey | null {
  let first: DayKey | null = null;
  for (const k of Object.keys(days)) if (k <= tk && morningOf(days[k])?.n && (!first || k < first)) first = k;
  return first;
}

/** what one night was: a slip logged on it, told free the next morning, or not told */
export function nightMark(days: Days, st: Settings, k: DayKey, first: DayKey | null = firstTold(days, addDays(k, 1))): NightMark {
  if (k < st.start) return 'none';
  if (sumDay(days[k]).slipped > 0) return 'slip';
  if (nightTold(days, k) === 'free') return 'free';
  /* before the person ever told a morning, a night with no slip counted as free, as it always had (WP1 moves this to truthFrom) */
  return !first || addDays(k, 1) < first ? 'free' : 'untold';
}

/** the seven nights that end with last night, oldest first; the last one is the night just lit */
export function igniteRow(days: Days, st: Settings, tk: DayKey): { k: DayKey; d: string; m: NightMark }[] {
  const out: { k: DayKey; d: string; m: NightMark }[] = [];
  const first = firstTold(days, tk);
  for (let i = 7; i >= 1; i--) {
    const k = addDays(tk, -i);
    out.push({ k, d: day2(k), m: nightMark(days, st, k, first) });
  }
  return out;
}

/** free nights told in a row, ending last night */
export function freeRun(days: Days, st: Settings, tk: DayKey): number {
  let n = 0;
  const first = firstTold(days, tk);
  for (let k = addDays(tk, -1); nightMark(days, st, k, first) === 'free'; k = addDays(k, -1)) n++;
  return n;
}

/** a slip in the three nights before last night: this one is a comeback */
const comeback = (days: Days, st: Settings, tk: DayKey) => [2, 3, 4].some((i) => nightMark(days, st, addDays(tk, -i), null) === 'slip');

const KEPT = [
  'You kept your night. That is who you are now.',
  'Another night free. You are becoming someone who is free.',
  'Free again. Your fire knows the difference.',
  'One more night kept. It is starting to be you.',
];

/** what the flame says once it is lit: who the person is becoming, not only the number */
export function igniteLine(days: Days, st: Settings, tk: DayKey): string {
  const run = freeRun(days, st, tk);
  if (run <= 1 && comeback(days, st, tk)) return 'Back to free. A slip did not change who you are.';
  if (run <= 1) return 'A free night. This is where it starts.';
  if (run === 3) return 'Three nights in a row. You set a goal and kept it.';
  if (run === 7) return 'A whole week of free nights. This is who you are now.';
  return KEPT[run % KEPT.length];
}

/** the small goal that is next: 3 nights, then 7 (CLAUDE.md: no big goals before a clean week), then each week after */
export function igniteGoal(run: number): number {
  if (run < 3) return 3;
  if (run < 7) return 7;
  return (Math.floor(run / 7) + 1) * 7;
}
