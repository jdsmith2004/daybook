/* Replay: one card from a lesson the person has already finished, shown in SOS (the owner, November 15, 2026: "little mini lessons
   that are repeatable as part of SOS"). The lesson's own picture, its own words and its one line that sticks, said by the flame. Nothing
   here writes or changes a lesson's words (docs/lessons.md): a replay only points at a card that is already there.

   Why it helps in an urge: practicing a craving skill in the moment it is for is what makes it stick (Lopez, Ochsner and Kober 2022),
   and a lesson the person already understood is recalled in seconds, where a new idea cannot be learned under a craving.

   Which lessons: picked by hand, and only ones with a card that helps in a rush, the minute the pull is loud. A lesson about the
   morning after a slip, a plan for next week or a talk with a partner is a good lesson and the wrong card for this minute, so it is
   left off. Each one names the card by its picture, so a lesson told in another habit's or faith's words still finds the same card. */
import { lessonById, lessonCards, lessonFor, lessonsDone, godOn, isGod, type Card, type Lesson } from './lessons';
import { lessonTo } from './lesson-beats';
import { urLikeOf, type Rand, type UrMem } from './sos';
import type { Days, Settings } from './types';

export interface ReplayPick {
  /** the lesson */
  id: string;
  /** the card's picture: a story scene's key, or the kind of picture */
  art: string;
  /** which card with that picture, when the lesson has two (0 is the first) */
  nth?: number;
  /** the ride move this lesson is the "why" of (ride.ts RIDE_WHY): liking that move lifts this lesson */
  move?: string;
  /** why this card, for the next person who edits the list */
  why: string;
}

/** the lessons a replay can show, and the one card from each */
export const REPLAY: ReplayPick[] = [
  {
    id: 'l2',
    art: 'wave',
    move: 'object',
    why: 'The third way between pushing and giving in: let it be there and watch it rise, peak and fall. The exact skill for this minute.',
  },
  {
    id: 'l16',
    art: 'l12-name-choose',
    move: 'thought',
    why: 'Name the thought, then do the next thing from your plan. No argument to win while the pull is loud.',
  },
  { id: 'l18', art: 'l12-not-decision', why: 'The permission voice talks loudest mid-urge. "That is a reason, not a decision" answers it without a debate.' },
  { id: 'l33', art: 'l33-ad', why: 'How hard it pulls is not how good it will be. An ad, not a review: the review is how it felt afterward.' },
  { id: 'l38', art: 'l38-door', why: '"I do not" is a sentence about who the person is becoming, and every urge outlasted makes it more true.' },
  { id: 'l44', art: 'l44-both', move: 'forward', why: 'When the urge says it does not matter, play it forward both ways and pick one.' },
  {
    id: 'l37',
    art: 'l37-stroke',
    why: 'Each choice is a stroke in who you are becoming, and an urge ridden out is one of them. Identity, in the moment it is made.',
  },
  { id: 'l17', art: 'l12-turn-back', why: 'Turning back early costs almost nothing. Said while the urge is still young, it is the cheapest turn of the day.' },
  { id: 'l35', art: 'l35-wake', why: 'Noticing is the moment the choice comes back. Opening SOS is that moment, and this card says so.' },
  { id: 'l39', art: 'l39-year', why: 'Someone wakes up a year from now with today. A person to be responsible for, in one picture.' },
  { id: 'l41', art: 'donkey-load', why: 'The stakes, plainly: what costs nothing can still take you. Firm, about the choice, never about who the person is.' },
  {
    id: 'l45',
    art: 'l45-tighter',
    move: 'reasons',
    why: 'Odysseus planned for being weak: if I beg, tie me tighter. The person is in the hour the plan was for.',
  },
  {
    id: 'l14',
    art: 'l12-volume',
    move: 'breathe',
    why: 'A long breath out turns the body’s volume down while you decide. Something to do with the body, now.',
  },
  { id: 'g8', art: 'g8-wave', nth: 1, move: 'written', why: 'Faith: a pull, not a fall. Name it, ask for help in the moment, let it pass over.' },
  { id: 'g3', art: 'g3-early', move: 'written', why: 'Faith: the way out is real and usually early, a door taken before the pull is loud.' },
];

/** fewer than this many lessons to replay, and Replay is not offered: it would show the same card every time */
export const REPLAY_MIN = 2;

const artKey = (c: Card): string => (!c.art ? '' : c.art[0] === 'scene' ? (c.art[1] as { k: string }).k : c.art[0]);

/** the card a replay shows from this lesson, as this person reads it, or null when the lesson (in their habit's or faith's words) has
    no such card in Short. Short is the cards a person surely saw. */
export function replayCard(R: ReplayPick, st: Settings | null): { L: Lesson; ci: number } | null {
  const L0 = lessonById(R.id);
  if (!L0) return null;
  const L = lessonTo(L0, st);
  const short = lessonCards(L, 'q');
  const hits = short.filter((c) => artKey(c) === R.art);
  const c = hits[R.nth || 0];
  return c ? { L, ci: L.cards.indexOf(c) } : null;
}

/** the lessons this person can be shown a card from: finished, written for their habit, a faith lesson only with faith on, and with
    the card there in their version */
export function replayList(days: Days, st: Settings | null): ReplayPick[] {
  const done = lessonsDone(days);
  const faith = godOn(st);
  return REPLAY.filter((R) => {
    if (!done.has(R.id) || !lessonFor(R.id, st)) return false;
    const L = lessonById(R.id)!;
    if ((isGod(L) || L.f) && !faith) return false;
    return !!replayCard(R, st);
  });
}

/** Replay can be in this person's ride: two lessons or more to choose from */
export const replayCan = (days: Days, st: Settings | null) => replayList(days, st).length >= REPLAY_MIN;

/* what this phone remembers about replays (UrMem, never synced): the lesson shown last, and each lesson's "Keep this" taps (up to 3)
   less its quick passes (down to -2) */
const rmap = (mem: UrMem): Record<string, number> => (mem.rpl && typeof mem.rpl === 'object' ? (mem.rpl as Record<string, number>) : {});
export const replayScore = (mem: UrMem, id: string): number => {
  const v = rmap(mem)[id];
  return typeof v === 'number' && Number.isFinite(v) ? v : 0;
};
const withScore = (mem: UrMem, id: string, v: number): UrMem => {
  const rpl = { ...rmap(mem) };
  const x = Math.max(-2, Math.min(3, Math.round(v * 100) / 100));
  if (x) rpl[id] = x;
  else delete rpl[id];
  return { ...mem, rpl };
};
/** "Keep this" on a replay: this card helped. Tapped again, it is taken back. */
export const replayKeep = (mem: UrMem, id: string, on: boolean): UrMem => withScore(mem, id, replayScore(mem, id) + (on ? 1 : -1));
/** passed over on sight (under five seconds): this lesson comes a little less often */
export const replayPassed = (mem: UrMem, id: string): UrMem => withScore(mem, id, replayScore(mem, id) - 0.5);
/** a replay shown: it is not shown again next time */
export const replaySeen = (mem: UrMem, id: string): UrMem => ({ ...mem, rlast: id });

/** how often a lesson comes up: 1 to start, more for each Keep this and for a move the person said helps, less for quick passes, never
    gone */
export function replayWeight(R: ReplayPick, st: Settings | null, mem: UrMem): number {
  const k = replayScore(mem, R.id);
  const like = R.move && urLikeOf(st, R.move) > 0 ? 0.5 : 0;
  return Math.max(0.25, 1 + (k > 0 ? k * 0.75 : k * 0.3) + like);
}

/** the lesson for this replay: never the one shown last (in this ride or the one before), never one already shown in this ride while
    another is left, weighted by what helped. Null when there is nothing to replay. */
export function replayPick(days: Days, st: Settings | null, mem: UrMem, rand: Rand, shown: string[] = []): { id: string; L: Lesson; ci: number } | null {
  const all = replayList(days, st);
  if (!all.length) return null;
  const last = shown.length ? shown[shown.length - 1] : typeof mem.rlast === 'string' ? mem.rlast : null;
  let pool = all.filter((R) => R.id !== last && shown.indexOf(R.id) < 0);
  if (!pool.length) pool = all.filter((R) => R.id !== last);
  if (!pool.length) pool = all;
  const ws = pool.map((R) => replayWeight(R, st, mem));
  let x = rand() * ws.reduce((a, b) => a + b, 0);
  let i = 0;
  while (i < pool.length - 1 && x >= ws[i]) x -= ws[i++];
  const R = pool[i];
  const at = replayCard(R, st)!;
  return { id: R.id, ...at };
}
