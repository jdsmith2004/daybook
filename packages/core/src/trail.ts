/* The trail: when a craving keeps coming, for hours or days, it walks a person down the same five places every time, and
   every place has an exit. Drift (running low), Spark (a cue fires), Preview (the mind plays the payoff), Case (the
   permission voice) and Steps (the ritual). At each place there is one line to say once and one thing to do with the body,
   the same way every time, in three lengths for the time a person has: 10 seconds, 2 minutes, or 10 or more. Every exit
   leads home. The trail is one picture, learned once, so under stress there is nothing new to learn: only where am I.

   Why this shape (docs/plan.md, "When it keeps coming"): a fixed routine holds under pressure, and its order matters more
   than its content (Rupprecht and others 2021, pre-performance routines, g = .70 under pressure); an if-then plan resists
   derailing (Gollwitzer and Sheeran 2006, d = .77); picturing the steps beats picturing the outcome (Pham and Taylor 1999);
   a thought expected and answered lands softer (inoculation; McGuire); and perceived availability drives craving, so a door
   closed for today takes its fuel (Dar and others). Nothing on the trail asks a person to reach out to anyone (the owner,
   November 3, 2026): the moves are their own.

   The stretch (one battle, however long) and the length a person picked are kept on this device only, in the SOS memory
   (UrMem), never synced and never part of the log. Reaching home saves an urge ridden out, like SOS does. */
import type { Settings } from './types';
import type { UrMem } from './sos';

export type TrailPlace = 'drift' | 'spark' | 'preview' | 'case' | 'steps';
/** how much time there is: 10 seconds, 2 minutes, or 10 or more */
export type TrailLen = 's' | 'm' | 'l';

export const TRAIL_PLACES: TrailPlace[] = ['drift', 'spark', 'preview', 'case', 'steps'];
export const TRAIL_LENS: { id: TrailLen; label: string; short: string }[] = [
  { id: 's', label: '10 seconds', short: '10 sec' },
  { id: 'm', label: '2 minutes', short: '2 min' },
  { id: 'l', label: '10 or more', short: '10 min' },
];

/** one drill: what to do, the button that says it is done, and a timer when the drill takes time */
export interface TrailDrill {
  do: string;
  done: string;
  secs?: number;
}

export interface TrailStop {
  id: TrailPlace;
  name: string;
  /** the one line to say, once, out loud */
  say: string;
  /** what the picture shows, for a screen reader */
  see: string;
  /** the logged action this drill counts as (core DIDS), so the log and the patterns see it */
  did: string;
  drills: Record<TrailLen, TrailDrill>;
}

export const TRAIL: Record<TrailPlace, TrailStop> = {
  drift: {
    id: 'drift',
    name: 'Drift',
    say: 'I am running low.',
    see: 'A post with four lights: hungry, angry, lonely and tired. One is low.',
    did: 'halt',
    drills: {
      s: { do: 'Find the low light.', done: 'Found it' },
      m: { do: 'Find the low light, and fill it the fast way.', done: 'Filled it' },
      l: { do: 'Find the low light, and fill it properly.', done: 'Filled it', secs: 600 },
    },
  },
  spark: {
    id: 'spark',
    name: 'Spark',
    say: 'That is a cue, not a need.',
    see: 'A spark in a dark room, and a bright doorway out of it. The phone stays behind.',
    did: 'left',
    drills: {
      s: { do: 'Stand up.', done: 'I am up' },
      m: { do: 'Stand up. Walk out of this room. The phone stays.', done: 'I am out' },
      l: { do: 'Change the place: go outside, with somewhere to go.', done: 'I am out', secs: 600 },
    },
  },
  preview: {
    id: 'preview',
    name: 'Preview',
    say: 'That is the preview. It always promises more.',
    see: 'A frame that glows too bright, and your own picture sliding over it.',
    did: 'forward',
    drills: {
      s: { do: 'One long breath out, slow, all the way.', done: 'Done' },
      m: { do: 'Slide your picture over it. Stay in your picture while the wave goes past its top.', done: 'Done', secs: 90 },
      l: { do: 'Play your picture forward: the next hour, then tomorrow morning. Stay in it.', done: 'Done', secs: 300 },
    },
  },
  case: {
    id: 'case',
    name: 'Case',
    say: 'Not today.',
    see: 'A door with a knock at it. Holding the button closes it, and the key turns.',
    did: 'thought',
    drills: {
      s: { do: 'Close the door for today.', done: 'Closed' },
      m: { do: 'Read what it will say, and your answer. Then close the door and turn the key.', done: 'Closed' },
      l: { do: 'Close the door, turn the key, and stay on this side of it. Its case is loudest now, and it fades.', done: 'Closed', secs: 600 },
    },
  },
  steps: {
    id: 'steps',
    name: 'Steps',
    say: 'This is a step. I can step off.',
    see: 'Stairs going down to the edge, and a green side path off them.',
    did: 'else',
    drills: {
      s: { do: 'Put the phone face down, out of reach.', done: 'It is away' },
      m: { do: 'Take the side path: one planned thing, now.', done: 'I am off the stairs' },
      l: { do: 'Take the side path for ten minutes.', done: 'I am off the stairs', secs: 600 },
    },
  },
};

/** Drift's four lights, and how to fill each one at each length. Lonely is filled by going where people are, never by
    asking anyone for anything. */
export const TRAIL_LIGHTS: { id: 'hungry' | 'angry' | 'lonely' | 'tired'; label: string; fill: Record<TrailLen, string> }[] = [
  {
    id: 'hungry',
    label: 'Hungry',
    fill: {
      s: 'Hungry is low. Say it, and eat as soon as you can.',
      m: 'Eat something small and drink a glass of water.',
      l: 'Make a real meal, and sit down to eat it.',
    },
  },
  {
    id: 'angry',
    label: 'Angry',
    fill: {
      s: 'Angry is low. Say it, and let your shoulders drop.',
      m: 'Move hard for two minutes: push-ups, stairs, a fast walk.',
      l: 'Work it out of your body: a run or a hard workout. Then write down what made you angry.',
    },
  },
  {
    id: 'lonely',
    label: 'Lonely',
    fill: {
      s: 'Lonely is low. Say it. It is a need, and it is not this.',
      m: 'Go where people are: the kitchen, a cafe, the gym.',
      l: 'Spend ten minutes somewhere with people around: a store, a park, a library.',
    },
  },
  {
    id: 'tired',
    label: 'Tired',
    fill: {
      s: 'Tired is low. Say it. Tired makes every pull louder.',
      m: 'Lie down for two minutes, eyes closed. The phone goes in another room.',
      l: 'Go to bed, or rest for twenty minutes with the phone in another room.',
    },
  },
];

/** what the permission voice usually says next, with an answer written on a calm day. A person's own lines come later
    (their kit); until then these are the common ones, shown as "It may say". */
export const TRAIL_LINES: { line: string; answer: string; late?: boolean }[] = [
  { line: 'You fought all day. You earned it.', answer: 'Earning it is the oldest trick it has. What I earned is this week.' },
  { line: 'Just a look. You will stop after.', answer: 'I have never stopped after. A look is the first step down the stairs.' },
  { line: 'You already slipped this week, so it does not matter.', answer: 'Every day counts on its own. Today can still be clean.' },
  { line: 'Nobody will know.', answer: 'I will know, and I am the one I am doing this for.' },
  { line: 'You will not sleep until you do.', answer: 'I have fallen asleep with it before. It fades when I stop feeding it.', late: true },
  { line: 'This is the last time.', answer: 'The last time is the one I do not take.' },
  { line: 'You are too tired to fight it.', answer: 'Then I do not fight. I close the door and rest.', late: true },
];

/** the line for this visit: a different one each time (n counts the visits to the door), and late at night the lines that
    come at night first */
export function trailLine(n: number, late: boolean): { line: string; answer: string } {
  const list = late ? TRAIL_LINES.filter((x) => x.late).concat(TRAIL_LINES.filter((x) => !x.late)) : TRAIL_LINES;
  const i = ((Math.floor(n) % list.length) + list.length) % list.length;
  return { line: list[i].line, answer: list[i].answer };
}

const clean = (x: unknown) => String(x ?? '').trim();

/** the picture that slides over the preview: the good thing to picture tomorrow from Play it forward, when the person wrote
    one; else a plain one. `own` says whether it is theirs (shown as "Your picture"). */
export function trailPicture(mem: UrMem): { t: string; own: boolean } {
  const c = clean(mem.fwd?.c);
  return c ? { t: c, own: true } : { t: 'Tomorrow morning: waking up clear, with nothing to hide.', own: false };
}

/** the key that locks the door: the person's own reason, in their words (their note, a reason, or who they are becoming) */
export function trailKey(st: Settings | null): { t: string; own: boolean } {
  const note = clean(st?.note);
  if (note) return { t: note, own: true };
  const r = (st?.reasons || []).map(clean).find(Boolean);
  if (r) return { t: r, own: true };
  const b = clean(st?.becoming);
  if (b) return { t: b, own: true };
  return { t: 'I want to wake up tomorrow with nothing to hide.', own: false };
}

/** the side path off the stairs: the "then" of the person's urge plan, when it has one; else a walk */
export function trailSide(st: Settings | null): { t: string; own: boolean } {
  const then = (st?.plan || []).map((p) => clean(p?.then)).find((t) => t && !/_{3,}/.test(t));
  return then ? { t: then, own: true } : { t: 'Walk to the corner and back. Music on, the phone in your pocket.', own: false };
}

/* ---------- the stretch: one battle, however long it lasts ---------- */
export interface TrailStretch {
  /** when it began */
  t0: number;
  /** the last time the trail was opened or a place touched */
  last: number;
  /** the place touched last, or null before any */
  at: TrailPlace | null;
  /** times the trail was opened in this stretch */
  visits: number;
  /** times it reached home in this stretch */
  home: number;
}

/** a stretch ends after this long with no visit: half a day of quiet is the battle over */
export const TRAIL_GAP = 12 * 3600_000;

/** the stretch kept in the SOS memory, checked (anything odd is no stretch) */
export function trailStretchOf(mem: UrMem): TrailStretch | null {
  const s = mem.trail as Partial<TrailStretch> | undefined;
  if (!s || typeof s !== 'object' || typeof s.t0 !== 'number' || typeof s.last !== 'number' || s.last < s.t0) return null;
  return {
    t0: s.t0,
    last: s.last,
    at: TRAIL_PLACES.indexOf(s.at as TrailPlace) >= 0 ? (s.at as TrailPlace) : null,
    visits: Number.isInteger(s.visits) && (s.visits as number) > 0 ? (s.visits as number) : 1,
    home: Number.isInteger(s.home) && (s.home as number) > 0 ? (s.home as number) : 0,
  };
}

/** whether a stretch is still going: a visit in the last half day */
export function trailOpen(s: TrailStretch | null, now: number): s is TrailStretch {
  return !!s && now >= s.t0 && now - s.last < TRAIL_GAP;
}

/** opening the trail: the stretch goes on when one is open, or a new one begins */
export function trailBegin(mem: UrMem, now: number): UrMem {
  const s = trailStretchOf(mem);
  const next: TrailStretch = trailOpen(s, now) ? { ...s, last: now, visits: s.visits + 1 } : { t0: now, last: now, at: null, visits: 1, home: 0 };
  return { ...mem, trail: next };
}

/** a place touched */
export function trailTouch(mem: UrMem, at: TrailPlace, now: number): UrMem {
  const s = trailStretchOf(mem);
  const base: TrailStretch = trailOpen(s, now) ? s : { t0: now, last: now, at: null, visits: 1, home: 0 };
  return { ...mem, trail: { ...base, at, last: now } };
}

/** home: an exit taken */
export function trailReach(mem: UrMem, now: number): UrMem {
  const s = trailStretchOf(mem);
  const base: TrailStretch = trailOpen(s, now) ? s : { t0: now, last: now, at: null, visits: 1, home: 0 };
  return { ...mem, trail: { ...base, last: now, home: base.home + 1 } };
}

/** the length a person picked last (2 minutes until they pick) */
export function trailLenOf(mem: UrMem): TrailLen {
  const l = mem.trailLen;
  return l === 's' || l === 'm' || l === 'l' ? l : 'm';
}

/** a length of time in plain words: "40 minutes", "2 hours and 40 minutes", "1 day and 3 hours" */
export function trailHeld(ms: number): string {
  const m = Math.max(0, Math.floor(ms / 60000));
  const unit = (n: number, w: string) => n + ' ' + w + (n === 1 ? '' : 's');
  if (m < 1) return 'less than a minute';
  if (m < 60) return unit(m, 'minute');
  const h = Math.floor(m / 60);
  if (h < 24) return m % 60 ? unit(h, 'hour') + ' and ' + unit(m % 60, 'minute') : unit(h, 'hour');
  const d = Math.floor(h / 24);
  return h % 24 ? unit(d, 'day') + ' and ' + unit(h % 24, 'hour') : unit(d, 'day');
}

/** the words at home: where the person stepped off, and how long this battle has been held, once it is long enough to say */
export function trailHomeLine(at: TrailPlace | null, s: TrailStretch | null, now: number): string {
  const where = at ? 'You stepped off at ' + TRAIL[at].name + '.' : 'You stepped off.';
  const held = s ? now - s.t0 : 0;
  return held >= 10 * 60000 ? where + ' ' + cap(trailHeld(held)) + ' held.' : where;
}

const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
