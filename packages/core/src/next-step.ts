/* Today's one next step (the owner, November 15, 2026: "the next task should always be ... highlighted and active ... we have two
   competing tasks i don't know which to pick and neither is freaking highlighted so fix that").

   The line of the day on Today (Your day) holds every step, and exactly one of them is the next step: the big bright card. The rest
   are quiet rows. Which one is next is picked here, from one ordered list, first match wins:

    1. the morning, while it is open now (the morning hours) and not told yet
    2. the Sunday review, on Sunday (and on Monday while last week's is still open)
    3. the day's open stop from the rhythm (day.ts dayRhythm): the lesson, then the check-in, then Good night

   The Sunday review is a step on the line, not a card of its own above it. A card above the line with its own button and a line
   below with its own current stop are two equal choices, and that is what the owner could not pick between. On the line it sits
   where the day's order says (after the morning, before the lesson), takes the highlight while it waits, and once done the next
   stop takes it. When a bigger moment leads Today instead (the day of a slip, a talk-through, a pause; moment.ts), that card is the
   highlight and every stop on the line is a quiet row. The care row (Log a slip, Walk it through) is never part of this. */
import { stopTiles, type StopTile } from './day';
import { sunDue } from './sunday';
import type { Journal } from './journal-entries';
import { UNLOCK_WORDS } from './unlock';
import type { DayKey, Days, Reviews, Settings } from './types';

/** the order the next step is picked in */
export const NEXT_ORDER = ['morning', 'sunday', 'day'] as const;

/** the Sunday review as a stop on the line, while it is due (core sunday.ts sunDue). null when it is not due. */
export function sundayTile(st: Settings, reviews: Reviews, tk: DayKey): StopTile | null {
  const sd = sunDue(reviews || {}, st, tk);
  if (!sd) return null;
  /* the first one ever opens its own page first, which says what it is (unlock.ts) */
  const first = !sd.late && !Object.keys(reviews || {}).length;
  return {
    k: 'sunday',
    state: sd.late ? 'due' : 'now',
    done: false,
    cur: false,
    sky: 'violet',
    ic: 'calendar',
    title: sd.late ? 'Last week’s review' : 'Sunday review',
    line: 'Your week, and one small goal for the next',
    right: sd.late ? 'Still open' : 'Today',
    eyebrow: sd.late ? 'Last week · still open' : first ? 'Sunday · a few minutes' : 'Sunday',
    head: sd.late ? 'Look back on last week' : first ? UNLOCK_WORDS.sunday.h : 'Your Sunday review',
    body: 'What your week says, then one goal to grow on next week.',
    chips: [],
    btn: 'Start',
    go: 'review',
    id: sd.sun,
    ...(first ? { intro: true } : {}),
  };
}

export interface TodayLine {
  /** every stop on the line, in the day's order, the Sunday review among them when it is due */
  tiles: StopTile[];
  /** the one next step, or null when every step is done */
  next: StopTile | null;
  /** which rule picked it */
  why: (typeof NEXT_ORDER)[number] | null;
}

/** the line on Today and its one next step. account: signed in, or no accounts in this copy (day.ts stopTiles). */
export function todayLine(days: Days, st: Settings, reviews: Reviews, tk: DayKey, nowMs: number, journal?: Journal, account = true): TodayLine {
  const r = stopTiles(days, st, tk, nowMs, journal, account);
  const tiles = [...r.tiles];
  const sun = sundayTile(st, reviews, tk);
  /* the review goes after the morning, before the rest of the day */
  if (sun) tiles.splice(tiles[0]?.k === 'morning' ? 1 : 0, 0, sun);
  const morning = tiles.find((t) => t.k === 'morning' && !t.done && t.state === 'now');
  const day = tiles.find((t) => t.k === r.cur && !t.done) || null;
  const pick: [TodayLine['why'], StopTile | null | undefined][] = [
    ['morning', morning],
    ['sunday', sun],
    ['day', day],
  ];
  const hit = pick.find(([, t]) => !!t);
  const next = hit ? hit[1]! : null;
  return { tiles: tiles.map((t) => ({ ...t, cur: t === next })), next: next ? { ...next, cur: true } : null, why: hit ? hit[0] : null };
}
