/* Map your day: a short morning ritual, right after the Last night taps. It catches the slip that is planned before any
   urge (the house will be empty after work, the details are picked out, part of you feels owed it, or has decided it
   will happen anyway). The shape is WOOP, one of the best-tested ways to follow through on a goal (Oettingen's mental
   contrasting with implementation intentions), done every day:
   - Wish: a clean day (already known).
   - Outcome: how tonight feels at the end of a clean day. Picturing it first is what gives the plan its pull.
   - Obstacle: the hour that could be hard (a storm on the day's sky), and what it counts on. Relapse usually starts with
     small choices well before the urge (Marlatt's "apparently irrelevant decisions"), and in a calm morning people
     underestimate how strong the pull will be later (the cold-to-hot empathy gap; Sayette, Loewenstein and others, 2008).
   - Plan: one "if it is 5 PM and no one is around, then I..." (implementation intentions; Gollwitzer and Sheeran, 2006).
   The thoughts that give permission ("I am owed this", "I will slip anyway") most directly lead to the act (Beck's
   permissive beliefs), and replaying the details feeds the desire (desire thinking; Caselli and Spada), so those get a
   plain answer when they are picked.
   After the hour comes "Did it hold?". Every map is a star in your sky, and stars are never taken away.
   The map is kept in the day's play record (p.mp), so it syncs with the rest of the log. This file imports nothing from
   legacy/core.js, because legacy/core.js imports normMap from it. The changes to the log are in day.ts. */
import type { DayKey, Days } from './types';

export type MapLink = 'alone' | 'free' | 'device' | 'picked' | 'owed' | 'anyway';
export type MapMove = 'people' | 'fill' | 'away' | 'block' | 'treat' | 'text';
export type MapOutcome = 'proud' | 'rested' | 'clear' | 'present' | 'free' | 'peace';
/** did it hold: yes, mostly (a close call), or it slipped */
export type MapHeld = 'y' | 'm' | 'n';

export interface DayMap {
  /** how tonight feels at the end of a clean day */
  o: MapOutcome | null;
  /** the hard hour, in minutes after the day's midnight (past 24:00 is after midnight, up to 2 AM); null for clear skies */
  h: number | null;
  l: MapLink[];
  m: MapMove[];
  /** did it hold (asked after the hour) */
  r: MapHeld | null;
}

/** tonight, at the end of a clean day: [id, the word, the line under it] */
export const MAP_OUTCOMES: [MapOutcome, string, string][] = [
  ['proud', 'Proud', 'I kept my word to myself'],
  ['rested', 'Rested', 'A real night of sleep'],
  ['clear', 'Clear-headed', 'Nothing to hide, nothing to fog me'],
  ['present', 'Present', 'Really there with the people I love'],
  ['free', 'Free', 'It did not run my evening'],
  ['peace', 'At peace', 'Calm with who I am becoming'],
];

/** what the hard hour counts on: [id, the words, a short line, how it reads after "If it is 5 PM and"] */
export const MAP_LINKS: [MapLink, string, string, string][] = [
  ['alone', 'Being alone', 'No one home, no one around', 'no one is around'],
  ['free', 'A free hour', 'Nothing set for that time', 'the hour is empty'],
  ['device', 'A phone or a laptop', 'In reach, with no filter in the way', 'my phone is in reach'],
  ['picked', 'Something already picked out', 'The sites, the names, the scenes', 'the plan starts replaying'],
  ['owed', 'Feeling I am owed it', 'A hard day, a long run, a reward', 'I feel owed it'],
  ['anyway', 'Thinking I will slip anyway', 'Later, tomorrow, once this run ends', 'I think I will slip anyway'],
];

/** the thought behind a link, and a plain answer to it */
export const MAP_THOUGHTS: Partial<Record<MapLink, [string, string]>> = {
  owed: ['I am owed this.', 'You are owed rest, and something good. This is not it: it takes more than it gives. Put a real treat in that hour instead.'],
  anyway: [
    'I will slip anyway, so why fight it.',
    'A slip does not erase what you have built here. And a slip planned for later is still a choice later: you can skip it then, too.',
  ],
  picked: [
    'Going over the details again.',
    'Replaying the plan (who, when, how) feeds the pull, and it does not have to be finished. When it starts, name it: “That is the plan again.” Then give your hands or your head something else.',
  ],
};

/** the plan: [id, the words, how, how it reads after "then I", the links it breaks] */
export const MAP_MOVES: [MapMove, string, string, string, MapLink[]][] = [
  ['people', 'Be around people', 'A gym, a café, a friend’s place, a call on the way home', 'go where people are', ['alone']],
  ['fill', 'Fill the hour first', 'A walk, a meal to cook, a game, a show', 'start what I set for that hour', ['free', 'owed']],
  ['away', 'Put the device out of reach', 'In the car, in the kitchen, left at work', 'put the device out of reach', ['device', 'alone']],
  ['block', 'Block it now', 'Add what you have in mind to your filter, while it is quiet', 'remember it is already blocked', ['picked', 'device']],
  ['treat', 'Plan a real treat', 'Food you love, a long shower, a game', 'have the treat I planned', ['owed']],
  ['text', 'Text someone', '“Can I call you around then?”', 'text someone', ['alone', 'anyway', 'free']],
];

/** the earliest and latest hard hour: 5 AM, and 2 AM after the day's midnight */
export const MAP_FIRST = 5 * 60;
export const MAP_LAST = 26 * 60;

const OUT = MAP_OUTCOMES.map((x) => x[0]);
const LINKS = MAP_LINKS.map((x) => x[0]);
const MOVES = MAP_MOVES.map((x) => x[0]);

/** a saved map, cleaned (used by normP in legacy/core.js), or null when there is none */
export function normMap(x: unknown): DayMap | null {
  if (!x || typeof x !== 'object') return null;
  const v = x as Record<string, unknown>;
  const h = typeof v.h === 'number' && Number.isInteger(v.h) && v.h >= 0 && v.h <= MAP_LAST ? v.h : null;
  const pick = <T extends string>(a: unknown, ok: T[]) => (Array.isArray(a) ? [...new Set(a.filter((t): t is T => ok.indexOf(t as T) >= 0))] : []);
  return {
    o: OUT.indexOf(v.o as MapOutcome) >= 0 ? (v.o as MapOutcome) : null,
    h,
    l: h == null ? [] : pick(v.l, LINKS),
    m: h == null ? [] : pick(v.m, MOVES),
    r: h != null && (v.r === 'y' || v.r === 'm' || v.r === 'n') ? v.r : null,
  };
}

/** the map made on a day, if any */
export const mapOf = (days: Days, k: DayKey): DayMap | null => (days[k]?.p?.mp ? normMap(days[k]!.p!.mp) : null);

/** "5:00 PM" for minutes after the day's midnight */
export function mapClock(min: number): string {
  const h = Math.floor(min / 60) % 24;
  return (h % 12 || 12) + ':' + String(min % 60).padStart(2, '0') + ' ' + (h < 12 ? 'AM' : 'PM');
}

/** the time of the hard hour on day k, in ms */
export function mapTime(k: DayKey, min: number): number {
  const [y, mo, d] = k.split('-').map(Number);
  return new Date(y, mo - 1, d, 0, min).getTime();
}

/** the earliest hour that can be picked now: the next half hour, but not before 5 AM (null when the day is over) */
export function mapStart(k: DayKey, now: number): number | null {
  const from = Math.max(MAP_FIRST, Math.ceil((now - mapTime(k, 0)) / 60000 / 30) * 30);
  return from > MAP_LAST ? null : from;
}

/** the moves worth offering: the ones that break a picked link first, then the rest */
export function mapMoves(links: MapLink[]): typeof MAP_MOVES {
  const hits = (m: (typeof MAP_MOVES)[number]) => m[4].filter((l) => links.indexOf(l) >= 0).length;
  return MAP_MOVES.map((m, i) => ({ m, i, n: hits(m) }))
    .sort((a, b) => b.n - a.n || a.i - b.i)
    .map((x) => x.m);
}

/** the thoughts to answer for the links picked */
export function mapThoughts(links: MapLink[]): [string, string][] {
  return LINKS.filter((l) => links.indexOf(l) >= 0 && MAP_THOUGHTS[l]).map((l) => MAP_THOUGHTS[l]!);
}

/** the plan in one line: "If it is 5:00 PM and no one is around, then I go where people are." */
export function mapIfThen(mp: Pick<DayMap, 'h' | 'l' | 'm'>): string {
  if (mp.h == null) return '';
  const link = MAP_LINKS.find((x) => x[0] === mp.l[0]);
  const thens = mp.m.map((id) => MAP_MOVES.find((x) => x[0] === id)?.[3]).filter(Boolean) as string[];
  const then = thens.length > 1 ? thens.slice(0, -1).join(', ') + ' and ' + thens[thens.length - 1] : thens[0] || 'do what I planned';
  return 'If it is ' + mapClock(mp.h) + (link ? ' and ' + link[3] : '') + ', then I ' + then + '.';
}

export const mapOutcomeWord = (o: MapOutcome | null) => MAP_OUTCOMES.find((x) => x[0] === o)?.[1] || '';
export const mapMoveName = (id: string) => MAP_MOVES.find((x) => x[0] === id)?.[1] || '';

/** a storm still waiting for "Did it hold?": today's once its hour is an hour past, or yesterday's. The latest first. */
export function mapAsk(days: Days, tk: DayKey, now: number): { k: DayKey; mp: DayMap } | null {
  const [y, mo, d] = tk.split('-').map(Number);
  const prev = new Date(y, mo - 1, d - 1);
  const yk = prev.getFullYear() + '-' + String(prev.getMonth() + 1).padStart(2, '0') + '-' + String(prev.getDate()).padStart(2, '0');
  for (const k of [tk, yk]) {
    const mp = mapOf(days, k);
    if (mp && mp.h != null && !mp.r && now >= mapTime(k, mp.h) + 3600000) return { k, mp };
  }
  return null;
}

/** where today's storm is: before its hour, in it (the hour and the one after), or past (then "Did it hold?") */
export function mapPhase(k: DayKey, mp: DayMap, now: number): 'clear' | 'before' | 'now' | 'past' | 'done' {
  if (mp.h == null) return 'clear';
  if (mp.r) return 'done';
  const t = mapTime(k, mp.h);
  return now < t ? 'before' : now < t + 3600000 ? 'now' : 'past';
}

/** your sky: a star for every map made, and the storms that held (or held mostly). Never taken away. */
export function mapStars(days: Days): { all: number; held: number; clear: number } {
  let all = 0;
  let held = 0;
  let clear = 0;
  for (const k in days) {
    const mp = mapOf(days, k);
    if (!mp) continue;
    all++;
    if (mp.h == null) clear++;
    else if (mp.r === 'y' || mp.r === 'm') held++;
  }
  return { all, held, clear };
}
