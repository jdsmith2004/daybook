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
import { lessonById, lessonFor } from './lessons';
import { urEvidence, urLikeOf, urRank, urTool, type UrMem, type UrState } from './sos';
import type { DayEvent, DayKey, Days, Settings } from './types';

/** every move the ride can show, in the order they are tried when nothing else says which */
export const RIDE_MOVES = ['breathe', 'move', 'stack', 'ground', 'feel', 'forward', 'thought', 'reasons', 'replay', 'selftalk'];
/** Replay (replay.ts): one card from a lesson the person has finished, its picture and its line that sticks. Only when there are two
    lessons or more to replay (RideCan.replay). */
export const RIDE_REPLAY = 'replay';
/** Self Talk (self-talk.ts): the flame helps the person speak to themself by name, as a friend would */
export const RIDE_SELF = 'selftalk';
/** the moves that are not tools in the tool list (sos.ts TOOLS): they live only in the ride */
const RIDE_ONLY = [RIDE_REPLAY, RIDE_SELF];
/** From your lessons and Self Talk come in SOS for everyone once the owner has seen them and said yes (November 15, 2026: "I'd like
    to preview it"). Until then they show only in the preview (app/sos-preview.tsx) and a practice ride that asks for one. */
export const RIDE_FRESH = false;
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
  replay: 'mind',
  selftalk: 'mind',
  written: 'mind',
  future: 'mind',
  object: 'mind',
};
/** It is written (written.ts): a ride move only for people who said faith plays a part, so it is not in RIDE_MOVES */
export const RIDE_FAITH = 'written';
/** Future you (future.ts): the person's own note from a good day, the page right after the first breath when there is one.
    It is shown once a ride, so it is not in RIDE_MOVES either */
export const RIDE_FUTURE = 'future';
/** If it were a thing: one quick, optional question, "If the urge were an object, what would it be?", with things to tap
    (never typing). Seeing the urge as a thing out there helps a person step back from it: watching an urge from a little way
    off, instead of being it, lowers craving (Westbrook and others 2013), and naming a thing gives the mind something to hold apart from itself. Shown once a ride, after
    the three moves that follow the breath (the body and the eyes first), and never in a practice ride. Next passes it like any move; passed over three
    times (sos.ts urNote) it stops coming, since it is optional. Not in RIDE_MOVES. */
export const RIDE_OBJECT = 'object';
/** passes before If it were a thing stops coming */
export const OBJECT_PASS_MAX = 3;
/** the things to tap, each with how it is said in a sentence */
export const URGE_OBJECTS: [string, string][] = [
  ['knot', 'A tight knot'],
  ['stone', 'A hot stone'],
  ['wave', 'A big wave'],
  ['wire', 'A buzzing wire'],
  ['weight', 'A heavy weight'],
  ['cloud', 'A storm cloud'],
];
/** the first move of every SOS */
export const RIDE_FIRST = 'breathe';

/** the order a ride tries its moves in when nothing about the person says otherwise, best first (docs/plan.md, "The order
    of SOS"): the body first, then the eyes, then the mind. A slow breath and hard muscle work calm a body in a rush; a
    shapes game takes the room in the head the pictures of an urge need (Skorka-Brown and others 2015, sexual cravings too);
    finding things in the room pulls attention out. Naming the feeling and saying the thought fast come once the peak eases,
    then the hour after (it needs a clear head: Kober and others 2010) and your own words last, since in a strong urge they
    can feel like pressure. No study compares orders, so this is a starting place: what helps you, what you pass over and
    what fits the hour move it (rideWeights). The ride passes over moves silently: nothing on screen says one moved (the
    owner, November 15, 2026). Replay (a card from a finished lesson) comes with the mind moves, once the peak eases; Self Talk is last,
   since its evidence is for stress, not craving (self-talk.ts), and the skip rule moves it later still if people pass it over. */
export const RIDE_ORDER = ['breathe', 'move', 'stack', 'ground', 'feel', 'thought', 'forward', 'reasons', 'replay', 'selftalk'];
/** how much each place in RIDE_ORDER is worth against what the person's own record says (sos.ts urRank) */
const RIDE_LIFT = 1;

/* Passing a move over. Next on a move before it is done counts against it, a quick pass (under RIDE_QUICK_MS, a flick on
   sight) a whole one and a later pass half; finishing it halves what it had. Each new SOS fades every count to RIDE_FADE of
   itself, so a pass weighs half as much seven rides later. "Often" is RIDE_OFTEN or more at the start of an SOS:
   three quick passes in three rides in a row. The count lowers the move's place and, once it is often, makes it come round
   half as often, so it comes later in a ride but still comes: nothing is hidden for good. Kept on this phone only (UrMem). */
export const RIDE_QUICK_MS = 5000;
export const RIDE_FADE = 0.9;
export const RIDE_OFTEN = 2.2;
const RIDE_SKIP_COST = 2;
const RIDE_SKIP_MAX = 8;
const skipMap = (mem: UrMem): Record<string, number> => (mem.rsk && typeof mem.rsk === 'object' ? (mem.rsk as Record<string, number>) : {});
/** how much a move has been passed over lately (0 when never) */
export const rideSkipOf = (mem: UrMem, id: string): number => {
  const v = skipMap(mem)[id];
  return typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : 0;
};
/** passed over often lately: it comes later in a ride */
export const rideOften = (mem: UrMem, id: string): boolean => rideSkipOf(mem, id) >= RIDE_OFTEN;
const withSkip = (mem: UrMem, id: string, v: number): UrMem => {
  const rsk = { ...skipMap(mem) };
  if (v >= 0.05) rsk[id] = Math.round(Math.min(10, v) * 100) / 100;
  else delete rsk[id];
  return { ...mem, rsk };
};
/** Next on a ride move before it was done, `ms` after it came into view */
export function ridePassed(mem: UrMem, id: string, ms: number): UrMem {
  if (RIDE_MOVES.indexOf(id) < 0 && id !== RIDE_FAITH) return mem;
  return withSkip(mem, id, rideSkipOf(mem, id) + (ms < RIDE_QUICK_MS ? 1 : 0.5));
}
/** a ride move done to its end */
export function rideFinished(mem: UrMem, id: string): UrMem {
  const v = rideSkipOf(mem, id);
  return v ? withSkip(mem, id, v / 2) : mem;
}
/** a new SOS: every pass count fades a little */
export function rideFade(mem: UrMem): UrMem {
  const m = skipMap(mem);
  const ids = Object.keys(m);
  if (!ids.length) return mem;
  return ids.reduce((acc, id) => withSkip(acc, id, rideSkipOf(mem, id) * RIDE_FADE), { ...mem, rsk: {} } as UrMem);
}

/** what the ride can use: Your words only when there are words of your own to show */
export interface RideCan {
  words: boolean;
  /** It is written: Yes or Somewhat to faith (lessons godOn) */
  faith?: boolean;
  /** Future you: a note from a good day is kept on this phone */
  future?: boolean;
  /** If it were a thing (RIDE_OBJECT): a real SOS, not a practice ride */
  object?: boolean;
  /** Replay: two finished lessons or more with a card to replay (replay.ts replayCan) */
  replay?: boolean;
  /** Replay and Self Talk are in the ride at all (RIDE_FRESH) */
  fresh?: boolean;
}

/** the moves this person can be shown, best for them first, each with how often it should come round (the best about
    three times as often as the last). A move you asked not to see is left out, unless it is your go-to. */
export function rideWeights(sc: UrState, days: Days, st: Settings | null, tk: DayKey, now: number, mem: UrMem, can: RideCan): { id: string; w: number }[] {
  /* the old count of Next taps (sos.ts urNote) never fades, so the ride leaves it for its own (rideSkipOf), which does */
  const pass = mem.pass && typeof mem.pass === 'object' ? { ...mem.pass } : {};
  RIDE_MOVES.forEach((id) => delete pass[id]);
  const rank = urRank({ ...sc, used: [] }, days, st, tk, now, { ...mem, pass });
  /* the evidence order lifts each move by its place; what you said helps (the heart, What helped most) lifts it more in the
     ride than in the tool list, so two of those outweigh the order; passing it over often lowers it */
  const score = (id: string, s: number) =>
    s +
    RIDE_LIFT * (RIDE_ORDER.length - 1 - RIDE_ORDER.indexOf(id)) +
    Math.max(0, urLikeOf(st, id)) * 1.5 -
    Math.min(RIDE_SKIP_MAX, rideSkipOf(mem, id) * RIDE_SKIP_COST);
  /* a move that is not a tool (Replay, Self Talk) starts from the lowest score the tools have here, so its place in RIDE_ORDER, what
     the person says helps and what they pass over decide where it lands */
  const floor = Math.min(0, ...rank.filter((x) => RIDE_MOVES.indexOf(x.id) >= 0).map((x) => x.score));
  const own = (id: string) => ({ id, score: floor, r: null, rt: null, ra: null, tk: '', pin: false, off: false });
  const list = RIDE_MOVES.filter(
    (id) => (urTool(id) || (RIDE_ONLY.indexOf(id) >= 0 && can.fresh)) && (id !== 'reasons' || can.words) && (id !== RIDE_REPLAY || can.replay),
  )
    .map((id) => ({ id, r: rank.find((x) => x.id === id) || (RIDE_ONLY.indexOf(id) >= 0 ? own(id) : undefined) }))
    .filter((x) => x.r && (!x.r.off || x.r.pin))
    .map((x) => ({ ...x, s: score(x.id, x.r!.score) }))
    .sort((a, b) => b.s - a.s || RIDE_ORDER.indexOf(a.id) - RIDE_ORDER.indexOf(b.id));
  const n = list.length;
  /* a move you often pass over comes round half as often: after the others have had a second turn, never gone */
  const out = list.map((x, i) => ({
    id: x.id,
    w: (x.r!.pin ? 4 : n > 1 ? 3 - (2 * i) / (n - 1) : 3) * (!x.r!.pin && rideOften(mem, x.id) ? 0.5 : 1),
  }));
  if (can.faith) out.push({ id: RIDE_FAITH, w: writtenWeight(st, mem) });
  return out;
}
/** how often It is written comes round: in the middle to start, sooner with the heart, later each time Next passes it */
function writtenWeight(st: Settings | null, mem: UrMem): number {
  return Math.max(0.5, Math.min(4, 2 + urLikeOf(st, RIDE_FAITH) * 0.5 - rideSkipOf(mem, RIDE_FAITH) * 0.4));
}
/** It is written is second, right after the breath, for everyone with faith on (the owner, November 15, 2026: "I don't mind
    it being above or second for people who are highly faith-based. I like it there ... it's actually an extremely good
    tool"), unless they have said Not really to it or pass it over often lately (rideOften, which fades with each SOS) */
const writtenEarly = (st: Settings | null, mem: UrMem) => urLikeOf(st, RIDE_FAITH) >= 0 && !rideOften(mem, RIDE_FAITH);

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
  /* It is written second for faith people; then a note from a good day, before the urge peaks: early is when calm words
     still land */
  const faithFirst = !!can.faith && writtenEarly(st, mem);
  if (faithFirst && shown.length === 1) return RIDE_FAITH;
  if (can.future && shown.length === (faithFirst ? 2 : 1)) return RIDE_FUTURE;
  const last = shown[shown.length - 1];
  /* If it were a thing: once, after the first three moves past the breath (the body and the eyes first: stepping back from
     the urge is a move for the mind, which works better once the peak eases) */
  if (
    can.object &&
    shown.indexOf(RIDE_OBJECT) < 0 &&
    shown.filter((x) => RIDE_MOVES.indexOf(x) >= 0 && x !== RIDE_FIRST).length >= 3 &&
    RIDE_MOVES.indexOf(last) >= 0 &&
    objectPass(mem) < OBJECT_PASS_MAX
  )
    return RIDE_OBJECT;
  const ws = rideWeights(sc, days, st, tk, now, mem, can);
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

const objectPass = (mem: UrMem) => (mem.pass && typeof mem.pass === 'object' ? mem.pass[RIDE_OBJECT] | 0 : 0);

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
  replay: {
    t: 'A lesson you already know comes back in seconds, when a new idea could not. Seen again in the moment it is for, it becomes yours.',
    l: 'l9',
  },
  selftalk: {
    t: 'Speaking to yourself by name, the way a friend would, puts a step between you and the feeling, and a calmer mind chooses better. Said out loud, who you are becoming gets more true.',
    l: 'l38',
  },
  object: { t: 'A thing you can picture is a thing you can watch from a step back. The urge is there, and you are the one looking at it.', l: 'l2' },
  future: { t: 'You left this on a good day, when you could see clearly. In an urge it is hard to see that far, so you said it for yourself.', l: 'l45' },
  written: {
    t: 'A temptation is one of a few old moves, not a verdict on you. Named, it loses its surprise, and an answer said out loud is ready the next time it comes.',
    l: 'g8',
  },
  halt: { t: 'An urge often sits on a plain need: food, rest, a person, a break. Meet the need and the urge has less to push.', l: 'l4' },
  curious: { t: 'Watching an urge instead of obeying it is the whole skill. It rises, peaks and passes on its own.', l: 'l2' },
  pause: { t: 'Most urges fade if you wait. Ten minutes in another room gives one the time to pass.', l: 'l10' },
  message: { t: 'Telling someone takes the secret out of it, and the urge gets lighter.', l: 'l7' },
  bed: { t: 'Late at night, sleep is the strongest move there is.', l: 'l4' },
};

/** Why it works, for the button on every move and tool: the one line, and the lesson behind it in brief (its answer
    and its studies), with the lesson itself to open for the whole story. Null for a tool with nothing to say. */
export function rideScience(
  id: string,
  st?: Settings | null,
): {
  t: string;
  lesson: { id: string; title: string; mins: number; ask: string; key: string } | null;
  proofs: { h: string; s: string }[];
} | null {
  const w = RIDE_WHY[id];
  if (!w) return null;
  /* a lesson not written for this person's habit is not offered (habit.ts) */
  const L = w.l ? lessonFor(w.l, st) : null;
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
