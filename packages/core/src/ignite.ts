/* Lighting the night (the owner, November 12, 2026: "compared to that our streak ignition is literal trash"). When the morning says
   last night was free, the person lights their own flame: it waits dark with an ember in it, they swipe it up, it bursts, and the
   number turns over. These are the rules for what that moment says and the row of nights under it. The screen is
   apps/mobile/src/app/ignite.tsx. Modeled on Duolingo's streak ignition, translated: the flame is both the streak and the mascot,
   and the words are about who the person is becoming, never only the number. */
import { addDays, sumDay } from './legacy/core.js';
import { nightState } from './away';
import { heroNumber } from './hero';
import { morningOf, nightTold } from './morning-set';
import { truthOn } from './truth';
import type { DayKey, Days, Settings } from './types';

/** a mark on the row: told free, a slip, not told, before the log began, or still to come (the first lighting's week) */
export type NightMark = 'free' | 'slip' | 'untold' | 'none' | 'ahead';

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
  /* the true record (truth.ts, WP1): from truthFrom on a night is what was told about it, the same as Today and Days draw it */
  if (truthOn(st, k)) return nightState(days, st, k, addDays(k, 1));
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

/** the first lighting (the end of setup): today and the six days to come, today's mark the one that pops (index 0) */
export function igniteStartRow(tk: DayKey): { k: DayKey; d: string; m: NightMark }[] {
  return [0, 1, 2, 3, 4, 5, 6].map((i) => ({ k: addDays(tk, i), d: day2(addDays(tk, i)), m: 'ahead' as const }));
}

/** free nights told in a row, ending last night */
export function freeRun(days: Days, st: Settings, tk: DayKey): number {
  let n = 0;
  const first = firstTold(days, tk);
  for (let k = addDays(tk, -1); nightMark(days, st, k, first) === 'free'; k = addDays(k, -1)) n++;
  return n;
}

/* When the full lighting plays (the owner, November 13, 2026: "it should be when they start and come back not every day"). The start is
   the end of setup (app/setup.tsx), which lights night one by itself. After that, a morning that tells last night free lights it only
   when the person comes back to it:
   - 'slip': the night before last was a slip, so last night is the first free night after it;
   - 'away': the night before last was never told (a missed morning, or days away), so this is the first night told after the gap;
   - 'goal': a small goal was kept (3 nights, then 7, then each whole week; core goalStep). This one is rare and earned, and it is the
     only stretch Daybook makes a moment of, so it gets the moment too.
   Any other free morning is null: the morning page grows the flame a step in place, quickly, with no page over it. Never after a slip
   logged today, the hours after it are for coming back, not for a party (CLAUDE.md "Stakes, not softness"). */
export type IgniteWhy = 'slip' | 'away' | 'goal';

/** why this free morning lights the flame in full, or null for the quick step in place. Read after last night is told free. */
export function igniteWhy(days: Days, st: Settings, tk: DayKey): IgniteWhy | null {
  const last = addDays(tk, -1);
  const first = firstTold(days, tk);
  if (nightMark(days, st, last, first) !== 'free') return null;
  if ((days[tk]?.events || []).some((e) => e.outcome === 'slipped')) return null;
  const before = nightMark(days, st, addDays(tk, -2), first);
  if (before === 'slip') return 'slip';
  if (before === 'untold') return 'away';
  if (goalStep(freeRun(days, st, tk), (st as { fwGoal?: number }).fwGoal).kept) return 'goal';
  return null;
}

/** the count the lighting turns over: yesterday's, then today's, the same count Today shows (CLAUDE.md: one count, shown the same
    everywhere). Telling the morning does not move the count itself (it moved when the day began), so the turnover shows the day
    the kept night brought: 11 to 12, or 0 to 1 the morning after a slip. Step down counts hours, and a count that is a word
    ("Day 1") has nothing to turn over from, so those light without turning over. */
export function igniteCount(days: Days, st: Settings, tk: DayKey, nowMs: number): { from: string; to: string; unit: string } {
  const now = heroNumber(days, st, tk, nowMs);
  if (!now) return { from: '', to: '', unit: '' };
  const was = st.cleanMode === 'step' ? null : heroNumber(days, st, addDays(tk, -1), nowMs - 864e5);
  const num = (x: string | undefined) => !!x && /^\d+$/.test(x);
  const from = was && num(was.n) && num(now.n) && +was.n <= +now.n ? was.n : now.n;
  return { from, to: now.n, unit: now.unit };
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
  if (run <= 1 && igniteWhy(days, st, tk) === 'away') return 'You came back, and the night was free. That is who you are.';
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

/** the small goal as the lighting shows it (first: the goal picked in setup, 3 or 7): the goal this run is working toward (or just kept, on the night it is reached), how
    many segments the bar has (the goal itself up to a week, then the week being built) and how many are lit */
export function goalStep(run: number, first?: number): { of: number; kept: boolean; segs: number; lit: number } {
  /* a person who picked 7 in setup (WP10, settings fwGoal) works toward 7 from the start, not 3 */
  const week = first === 7 && run < 7;
  const kept = (run === 3 && first !== 7) || (run >= 7 && run % 7 === 0);
  const of = kept ? run : week ? 7 : igniteGoal(run);
  const segs = Math.min(of, 7);
  return { of, kept, segs, lit: Math.max(0, Math.min(segs, run - (of - segs))) };
}
