/* The ride: SOS as one short guided routine, the same shape every time, so it becomes a habit of its own. Breathe first
   (the body slows down), then something for the body or the eyes (it crowds the urge out), then something for the mind
   in your own words (the hour after, the thought for what it is, your reasons). Each slot is filled with the move that
   has worked best for you (core sos.ts urRank), and any move can be swapped for another in its slot. Then "How is it
   now?". When it passes, the ride shows what you did: how long it took, how many you have ridden out, and one line on
   why the move that helped works, with its lesson for a calm moment.

   Why this shape (docs: the research note on the redesign): practicing one craving strategy over and over (Lopez,
   Ochsner and Kober 2022) cut smoking for weeks; short, hard muscle work lowers craving a lot (Haasova and others 2013);
   a visual game crowds out the pictures a craving runs on (May and others 2010; Skorka-Brown and others 2015); thinking
   of what comes later lowers craving (Kober and others 2010); and each urge outlasted is the proof that builds the
   confidence for the next (Marlatt; Bandura). */
import { eventsOf } from './legacy/core.js';
import { urEvidence, urRank, urTool, type UrMem, type UrState } from './sos';
import type { DayEvent, DayKey, Days, Settings } from './types';

export type RideSlot = 'calm' | 'body' | 'mind';
/** the moves each slot can hold, in the order they are tried when nothing else says which */
export const RIDE_SLOTS: Record<RideSlot, string[]> = {
  calm: ['breathe'],
  body: ['move', 'stack', 'ground'],
  mind: ['forward', 'thought', 'reasons'],
};
export const RIDE_ORDER: RideSlot[] = ['calm', 'body', 'mind'];
export const rideSlotOf = (id: string): RideSlot | null => (RIDE_ORDER.find((k) => RIDE_SLOTS[k].indexOf(id) >= 0) as RideSlot | undefined) ?? null;

/** the slot's name, as the ride shows it under the dots */
export const RIDE_SLOT_NAME: Record<RideSlot, string> = { calm: 'Breathe', body: 'Body', mind: 'Mind' };

/** what the ride can use: My reasons only when there are words of your own to show */
export interface RideCan {
  words: boolean;
}

/** the moves for this ride, one a slot. A second ride in the same SOS ("Still here") skips the moves already used, so it
    is a different ride; Breathe stays first either way. */
export function ridePlan(sc: UrState, days: Days, st: Settings | null, tk: DayKey, now: number, mem: UrMem, can: RideCan): string[] {
  return RIDE_ORDER.map((k) => rideBest(k, sc, days, st, tk, now, mem, can, []));
}

function rideBest(k: RideSlot, sc: UrState, days: Days, st: Settings | null, tk: DayKey, now: number, mem: UrMem, can: RideCan, avoid: string[]): string {
  const list = RIDE_SLOTS[k].filter((id) => urTool(id) && (id !== 'reasons' || can.words));
  if (list.length === 1) return list[0];
  const rank = urRank({ ...sc, used: [] }, days, st, tk, now, mem);
  const used = sc.used || [];
  const score = (id: string) => {
    const r = rank.find((x) => x.id === id);
    if (!r) return -99;
    /* a move you asked not to see is last; your go-to is first; one used already in this SOS comes after the rest */
    return r.score + (r.off && !r.pin ? -50 : 0) + (used.indexOf(id) >= 0 ? -30 : 0);
  };
  const open = list.filter((id) => avoid.indexOf(id) < 0);
  const from = open.length ? open : list;
  return from.slice().sort((a, b) => score(b) - score(a) || list.indexOf(a) - list.indexOf(b))[0];
}

/** Swap: the next move in the same slot, after the one showing (round and round, skipping the others already in this
    ride). A slot with one move keeps it. */
export function rideSwap(plan: string[], i: number, can: RideCan): string[] {
  const id = plan[i];
  const k = rideSlotOf(id);
  if (!k) return plan;
  const list = RIDE_SLOTS[k].filter((x) => urTool(x) && (x !== 'reasons' || can.words));
  if (list.length < 2) return plan;
  const at = list.indexOf(id);
  for (let j = 1; j <= list.length; j++) {
    const next = list[(at + j) % list.length];
    if (next === id) break;
    if (plan.indexOf(next) < 0 || plan.indexOf(next) === i) return plan.map((x, n) => (n === i ? next : x));
  }
  return plan;
}

/** why a move works, in one line, and the lesson that says more (read later, when it is calm) */
export const RIDE_WHY: Record<string, { t: string; l?: string }> = {
  breathe: { t: 'A long breath out slows the heart. A calmer body makes the pull easier to wait out.', l: 'l14' },
  move: { t: 'Hard muscle work, even for a minute, lowers cravings in study after study. Your body burned off what the urge was building.', l: 'l15' },
  stack: { t: 'Fitting shapes takes the same room in your head as the pictures an urge runs on, so the pictures fade.', l: 'l2' },
  ground: { t: 'Finding things around you pulls your attention out of the urge and back into the room.', l: 'l2' },
  forward: { t: 'Picturing the hour after makes later weigh more than right now. That is the skill: you looked past the urge.' },
  thought: { t: 'A thought said fast, over and over, turns into sounds. It is still there, but it stops giving orders.', l: 'l16' },
  reasons: { t: 'Your own words, from a calm day, speak for the part of you that wants this.', l: 'l1' },
  curious: { t: 'Watching an urge instead of obeying it is the whole skill. It rises, peaks and passes on its own.', l: 'l2' },
  pause: { t: 'Most urges fade if you wait. Ten minutes in another room gives one the time to pass.', l: 'l10' },
  message: { t: 'Telling someone takes the secret out of it, and the urge gets lighter.', l: 'l7' },
  bed: { t: 'Late at night, sleep is the strongest move there is.', l: 'l4' },
};

/** the line after a ride: about the move that helped when you said which, else the last one done */
export function rideWhy(helped: string | null, done: string[]): { id: string; t: string; l?: string } | null {
  const id =
    helped && RIDE_WHY[helped]
      ? helped
      : done
          .slice()
          .reverse()
          .find((x) => RIDE_WHY[x]) || null;
  return id ? { id, ...RIDE_WHY[id] } : null;
}

/** your record, for the end of a ride: how many urges you have ridden out (this one too), how long yours usually take,
    and whether this one passed faster than that */
export function rideRecord(days: Days, mins: number) {
  const ev = urEvidence(days);
  const n = ev.n;
  const med = ev.med;
  return { n, med, faster: med != null && mins < med, mins };
}

/** the rides done this week (the last 7 log days, today too), for the small line under the time */
export function rideWeek(days: Days, tk: DayKey): number {
  const evs = eventsOf(days) as (DayEvent & { key: string })[];
  const d = new Date(tk + 'T12:00:00');
  d.setDate(d.getDate() - 6);
  const from = d.toISOString().slice(0, 10);
  return evs.filter((e) => e.outcome === 'rode' && e.key >= from && e.key <= tk).length;
}

/** where the time line marks "most of yours pass by here": your usual minutes when the log has them, kept to 3 to 20,
    or null */
export function rideMark(days: Days): number | null {
  const m = urEvidence(days).med;
  return m == null ? null : Math.max(3, Math.min(20, m));
}

/** practice: after the first few urges ridden out in SOS, the ride offers a practice run once, for a calm moment */
export function ridePracticeAsk(days: Days, mem: UrMem): boolean {
  if (mem.pracAsk) return false;
  const n = urEvidence(days).n;
  return n >= 2 && n <= 6;
}
