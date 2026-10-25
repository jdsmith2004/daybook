/* The ride: SOS as one guided stream of short moves that keeps going until the urge passes. The first move is always the
   breath with the sun, so pressing SOS starts the same calm way every time. After that the moves take turns: each one
   comes round again, and the ones that work best for you come round sooner (core sos.ts urRank: what has helped you, what
   you said helps, what fits the hour and the feeling, your go-to). Two of a kind do not come one after the other, and a
   feeling you name steers the next move toward what fits it. When it passes, the ride shows what you did: how long it
   took, how many you have ridden out, and one line on why the move that helped works, with its lesson for a calm moment.

   Why this shape (docs: the research note on the redesign): practicing a craving strategy over and over (Lopez, Ochsner
   and Kober 2022) cut smoking for weeks; short, hard muscle work lowers craving a lot (Haasova and others 2013); a visual
   game crowds out the pictures a craving runs on (May and others 2010; Skorka-Brown and others 2015); thinking of what
   comes later lowers craving (Kober and others 2010); naming a feeling takes some of its charge (Lieberman and others
   2007); and each urge outlasted is the proof that builds the confidence for the next (Marlatt; Bandura). */
import { eventsOf } from './legacy/core.js';
import { lessonById } from './lessons';
import { urEvidence, urRank, urTool, type UrMem, type UrState } from './sos';
import type { DayEvent, DayKey, Days, Settings } from './types';

/** every move the ride can show, in the order they are tried when nothing else says which */
export const RIDE_MOVES = ['breathe', 'move', 'stack', 'ground', 'feel', 'forward', 'thought', 'reasons'];
/** the kind of each move: two of a kind are not shown one after the other */
export const RIDE_KIND: Record<string, 'calm' | 'body' | 'eyes' | 'mind'> = {
  breathe: 'calm',
  move: 'body',
  stack: 'eyes',
  ground: 'eyes',
  feel: 'mind',
  forward: 'mind',
  thought: 'mind',
  reasons: 'mind',
};
/** the first move of every SOS */
export const RIDE_FIRST = 'breathe';

/** what the ride can use: Your words only when there are words of your own to show */
export interface RideCan {
  words: boolean;
}

/** the moves this person can be shown, best for them first, each with how often it should come round (the best about
    three times as often as the last). A move you asked not to see is left out, unless it is your go-to. */
export function rideWeights(sc: UrState, days: Days, st: Settings | null, tk: DayKey, now: number, mem: UrMem, can: RideCan): { id: string; w: number }[] {
  const rank = urRank({ ...sc, used: [] }, days, st, tk, now, mem);
  const list = RIDE_MOVES.filter((id) => urTool(id) && (id !== 'reasons' || can.words))
    .map((id) => ({ id, r: rank.find((x) => x.id === id) }))
    .filter((x) => x.r && (!x.r.off || x.r.pin))
    .sort((a, b) => b.r!.score - a.r!.score || RIDE_MOVES.indexOf(a.id) - RIDE_MOVES.indexOf(b.id));
  const n = list.length;
  return list.map((x, i) => ({ id: x.id, w: x.r!.pin ? 4 : n > 1 ? 3 - (2 * i) / (n - 1) : 3 }));
}

/** the next move, after the ones already shown in this SOS (oldest first). The breath opens; then each move is due by
    how long ago it was shown, times how well it works for you, so every move comes round and the best come round
    sooner. A move is never shown twice in a row, the same kind is held back a turn, and `lead` (the move a feeling you
    just named points to) comes next when it can. */
export function rideNext(
  sc: UrState,
  days: Days,
  st: Settings | null,
  tk: DayKey,
  now: number,
  mem: UrMem,
  can: RideCan,
  shown: string[],
  lead?: string | null,
): string {
  if (!shown.length) return RIDE_FIRST;
  const ws = rideWeights(sc, days, st, tk, now, mem, can);
  const last = shown[shown.length - 1];
  const due = (id: string, w: number) => {
    const at = shown.lastIndexOf(id);
    /* a move not shown yet is due before most second turns; the breath opened the ride, so it comes back less */
    const gap = at < 0 ? shown.length + 4 : shown.length - at;
    let d = w * gap * (id === RIDE_FIRST ? 0.5 : 1);
    if (RIDE_KIND[id] === RIDE_KIND[last]) d *= 0.6;
    if (id === lead) d *= 3;
    return d;
  };
  const open = ws.filter((x) => x.id !== last);
  if (!open.length) return ws.length ? ws[0].id : RIDE_FIRST;
  return open.slice().sort((a, b) => due(b.id, b.w) - due(a.id, a.w) || b.w - a.w)[0].id;
}

/** why a move works, in one line, and the lesson that says more (read later, when it is calm) */
export const RIDE_WHY: Record<string, { t: string; l?: string }> = {
  breathe: { t: 'A long breath out slows the heart. A calmer body makes the pull easier to wait out.', l: 'l14' },
  move: { t: 'Hard muscle work, even for a minute, lowers cravings in study after study. Your body burned off what the urge was building.', l: 'l15' },
  stack: { t: 'Fitting shapes takes the same room in your head as the pictures an urge runs on, so the pictures fade.', l: 'l42' },
  ground: { t: 'Finding things around you pulls your attention out of the urge and back into the room.', l: 'l43' },
  feel: { t: 'Putting a word on a feeling turns its volume down, and the word points at what you really need.', l: 'l13' },
  forward: { t: 'Picturing the hour after makes later weigh more than right now. That is the skill: you looked past the urge.', l: 'l44' },
  thought: { t: 'A thought said fast, over and over, turns into sounds. It is still there, but it stops giving orders.', l: 'l16' },
  reasons: { t: 'Your own words, from a calm day, speak for the part of you that wants this.', l: 'l45' },
  halt: { t: 'An urge often sits on a plain need: food, rest, a person, a break. Meet the need and the urge has less to push.', l: 'l4' },
  curious: { t: 'Watching an urge instead of obeying it is the whole skill. It rises, peaks and passes on its own.', l: 'l2' },
  pause: { t: 'Most urges fade if you wait. Ten minutes in another room gives one the time to pass.', l: 'l10' },
  message: { t: 'Telling someone takes the secret out of it, and the urge gets lighter.', l: 'l7' },
  bed: { t: 'Late at night, sleep is the strongest move there is.', l: 'l4' },
};

/** Why it works, for the button on every move and tool: the one line, and the lesson behind it in brief (its answer
    and its studies), with the lesson itself to open for the whole story. Null for a tool with nothing to say. */
export function rideScience(id: string): {
  t: string;
  lesson: { id: string; title: string; mins: number; ask: string; key: string } | null;
  proofs: { h: string; s: string }[];
} | null {
  const w = RIDE_WHY[id];
  if (!w) return null;
  const L = w.l ? lessonById(w.l) : null;
  return {
    t: w.t,
    lesson: L ? { id: L.id, title: L.title, mins: L.mins || 3, ask: L.ask || '', key: L.key } : null,
    proofs: L ? L.cards.filter((c) => c.e === 'proof' && c.fact).map((c) => ({ h: c.h, s: c.fact!.s })) : [],
  };
}

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
