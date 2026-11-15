/* Lighting the night (the owner, November 12, 2026: "compared to that our streak ignition is literal trash"). When the morning says
   last night was free, the person lights their own flame: it waits dark with an ember in it, they swipe it up, it bursts, and the
   number turns over. These are the rules for what that moment says and the row of nights under it. The screen is
   apps/mobile/src/app/ignite.tsx. Modeled on Duolingo's streak ignition, translated: the flame is both the streak and the mascot,
   and the words are about who the person is becoming, never only the number. */
import { addDays, sumDay } from './legacy/core.js';
import { nightState } from './away';
import { heroNumber } from './hero';
import { morningOf, nightTold } from './morning-set';
import { tipQuiet, type TipNear } from './support';
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
/* The key moments (the owner, November 14, 2026: "if they've been struggling for a while and they finally have a good night, it's like,
   hey, this is day 2 of your streak. Like, let's do this, ignite it"). Coming back is not all the same, so the lighting knows which:
   - 'hard': the first free night after a hard stretch (HARD_SLIPS slip nights or more in the HARD_NIGHTS nights up to the slip);
   - 'climb': the second and third free nights in a row after that hard stretch, the climb out of it. Only after a hard stretch: after
     one slip, nights two and three are ordinary mornings (night three may still be the small goal), so it never plays every day;
   - 'long': the first free night after a slip that ended a run of LONG_RUN nights or more. That run stays earned (the longest run never
     drops), and the lighting says so;
   - 'slip': the first free night after any other slip.
   The first clean week is the small goal ('goal', at 7). Never in the quiet hours after an SOS or a slip (support.ts tipQuiet, when the
   app passes `near`). */
export type IgniteWhy = 'slip' | 'away' | 'goal' | 'hard' | 'climb' | 'long';

/** slip nights, in the nights up to and including the slip that broke the run, that make it a hard stretch */
export const HARD_SLIPS = 3;
export const HARD_NIGHTS = 14;
/** a run this long, ended by a slip, is a long run, and the first free night after it is its own moment */
export const LONG_RUN = 7;

/** the slip just before this run of free nights: how hard the stretch up to it was, and how long the run it ended */
function slipBefore(days: Days, st: Settings, tk: DayKey, run: number, first: DayKey | null): { hard: boolean; ended: number } | null {
  const gap = addDays(tk, -1 - run);
  if (nightMark(days, st, gap, first) !== 'slip') return null;
  let slips = 0;
  for (let i = 0; i < HARD_NIGHTS; i++) if (nightMark(days, st, addDays(gap, -i), first) === 'slip') slips++;
  return { hard: slips >= HARD_SLIPS, ended: freeRun(days, st, gap) };
}

/** why this free morning lights the flame in full, or null for the quick step in place. Read after last night is told free. near: the
    time and the last SOS or care tool, so it never plays in the quiet hours after one (or after a slip). */
export function igniteWhy(days: Days, st: Settings, tk: DayKey, near?: TipNear): IgniteWhy | null {
  const last = addDays(tk, -1);
  const first = firstTold(days, tk);
  if (nightMark(days, st, last, first) !== 'free') return null;
  if ((days[tk]?.events || []).some((e) => e.outcome === 'slipped')) return null;
  if (near && tipQuiet(days, st, near)) return null;
  const run = freeRun(days, st, tk);
  const back = slipBefore(days, st, tk, run, first);
  if (run === 1 && back) return back.hard ? 'hard' : back.ended >= LONG_RUN ? 'long' : 'slip';
  if (run === 1 && nightMark(days, st, addDays(tk, -2), first) === 'untold') return 'away';
  if ((run === 2 || run === 3) && back?.hard) return 'climb';
  if (goalStep(run, (st as { fwGoal?: number }).fwGoal).kept) return 'goal';
  return null;
}

/** the flame was lit in full today (a key moment on this morning): Today asks for nothing else until tomorrow, so one moment is one
    celebration (the account card, its nudge and the tip wait a day; the lighting goes first). Only a morning that told last night
    lights it, so a day with no morning told is never one. */
export const litToday = (days: Days, st: Settings, tk: DayKey): boolean => !!morningOf(days[tk])?.n && igniteWhy(days, st, tk) !== null;

/** the count the lighting turns over: yesterday's, then today's, the same count Today shows (CLAUDE.md: one count, shown the same
    everywhere). Telling the morning does not move the count itself (it moved when the day began), so the turnover shows the day
    the kept night brought: 11 to 12, or 0 to 1 the morning after a slip. `before`, the log before the night was told, gives the count
    as it stood on the morning page. Step down counts hours, and a count that is a word
    ("Day 1") has nothing to turn over from, so those light without turning over. */
export function igniteCount(days: Days, st: Settings, tk: DayKey, nowMs: number, before?: Days): { from: string; to: string; unit: string } {
  const now = heroNumber(days, st, tk, nowMs);
  if (!now) return { from: '', to: '', unit: '' };
  const num = (x: string | undefined): x is string => !!x && /^\d+$/.test(x);
  if (st.cleanMode === 'step' || !num(now.n)) return { from: now.n, to: now.n, unit: now.unit };
  /* the count before the night was told (from truthFrom on, an untold night does not count until it is told, so telling it moves the
     count); without it, or when telling did not move it (the old rule), yesterday's, when it is lower */
  const was = [before ? heroNumber(before, st, tk, nowMs)?.n : undefined, heroNumber(days, st, addDays(tk, -1), nowMs - 864e5)?.n]
    .filter(num)
    .map(Number)
    .filter((x) => x < +now.n);
  return { from: was.length ? String(was[0]) : now.n, to: now.n, unit: now.unit };
}

/** a slip in the three nights before last night: this one is a comeback */
const comeback = (days: Days, st: Settings, tk: DayKey) => [2, 3, 4].some((i) => nightMark(days, st, addDays(tk, -i), null) === 'slip');

const KEPT = [
  'You kept your night. That is who you are now.',
  'Another night free. You are becoming someone who is free.',
  'Free again. Your fire knows the difference.',
  'One more night kept. It is starting to be you.',
];

/** what the flame says at the key moments (igniteWhy 'hard', 'climb', 'long'). No numbers: the count above it counts days, not
    nights, so a number here could disagree with it. */
export const MOMENT_LINE = {
  hard: 'A hard stretch, and last night you won. Let us do this.',
  climb2: 'Back to back. Let us keep this going.',
  climb3: 'You are climbing out of it. Keep choosing it tonight.',
  long: 'Everything you built still stands. Last night began the next run.',
} as const;

/** what the flame says once it is lit: who the person is becoming, not only the number */
export function igniteLine(days: Days, st: Settings, tk: DayKey): string {
  const run = freeRun(days, st, tk);
  const why = igniteWhy(days, st, tk);
  if (why === 'hard') return MOMENT_LINE.hard;
  if (why === 'long') return MOMENT_LINE.long;
  if (why === 'climb') return run === 2 ? MOMENT_LINE.climb2 : MOMENT_LINE.climb3;
  if (run <= 1 && comeback(days, st, tk)) return 'Back to free. A slip did not change who you are.';
  if (run <= 1 && why === 'away') return 'You came back, and the night was free. That is who you are.';
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

/** the small goal as the lighting shows it (first: the goal picked in setup, two nights up to seven): the goal this run is working toward (or just kept, on the night it is reached), how
    many segments the bar has (the goal itself up to a week, then the week being built) and how many are lit */
export function goalStep(run: number, first?: number): { of: number; kept: boolean; segs: number; lit: number } {
  /* the goal picked in setup (WP10, settings fwGoal: two nights up to a week, from how often it happens) comes first; after it,
     the ladder goes on to a week, then each week. With no pick, it is three nights, then seven. */
  const f = first && first >= 2 && first <= 7 ? first : 3;
  const kept = run === f || (run >= 7 && run % 7 === 0);
  const of = kept ? run : run < f ? f : igniteGoal(Math.max(run, 3));
  const segs = Math.min(of, 7);
  return { of, kept, segs, lit: Math.max(0, Math.min(segs, run - (of - segs))) };
}
