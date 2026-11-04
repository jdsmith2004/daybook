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
import { eventsOf } from './legacy/core.js';
import { urNight, type UrMem } from './sos';
import type { Days, Settings } from './types';

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
  /** what this place is, in a few plain words, so a person can tell where they are */
  means: string;
  /** what the mind says here, so a person knows the place by the thought they hear */
  hear: string;
  /** what that thought really is: the one thing this place teaches, in one or two short sentences */
  turn: string;
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
    means: 'Worn down: tired, alone, upset or hungry',
    hear: 'I am fine. I am just tired.',
    turn: 'Tired, lonely, angry or hungry can feel like wanting this. Fill the real need, and most of the pull goes with it.',
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
    means: 'Something caught your eye',
    hear: 'I want it.',
    turn: 'That was a cue: a picture, a mood, an empty room. It fades fast once you leave the place where it found you.',
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
    means: 'Picturing it',
    hear: 'This would be so good.',
    turn: 'The preview shows the best ten seconds. It never shows the hour after.',
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
    means: 'Talking yourself into it',
    hear: 'Just once. I deserve it.',
    turn: 'That is a permission thought. It sounds like a decision, but it is only a thought, and you do not have to argue with it.',
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
    means: 'Already on the way: alone, phone in hand',
    hear: 'I know where this is going, and I am going anyway.',
    turn: 'Knowing where it goes is not the same as having to go. Until the very end, every step still has a way off.',
    say: 'I can still step off.',
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

/* ---------- the notes: a quiet companion while a stretch is open ---------- */
/* While a battle goes on, the phone checks in, gently: two notes at a time, an hour apart, and only two ahead, so two left
   unanswered are the last until the person opens Daybook again. None at night, none after a slip (the app rests; the
   person starts it again, never the app), no more than five in a day, and each one has "Leave me be today". The words
   say nothing about what Daybook is for, since a note can show on a locked screen. Each note's buttons do the move:
   Not today (the door), Show me where I am (the map), Not for an hour, and Leave me be today. */

export interface TrailNote {
  id: string;
  at: number;
  title: string;
  body: string;
}

/** at least this long between two notes */
export const TRAIL_NOTE_GAP = 60 * 60000;
/** notes scheduled ahead at once: two unanswered, and they stop */
export const TRAIL_NOTE_AHEAD = 2;
/** notes in one day, at most */
export const TRAIL_NOTE_DAY = 5;

/** a slip logged since the stretch began: the notes rest */
export function trailSlipSince(days: Days, t0: number): boolean {
  return eventsOf(days).some((e) => {
    if (e.outcome !== 'slipped') return false;
    const t = new Date(e.key + 'T' + (e.time || '23:59') + ':00').getTime();
    return t >= t0 - 60000;
  });
}

const nums = (x: unknown): number[] => (Array.isArray(x) ? x.filter((n): n is number => typeof n === 'number' && isFinite(n)) : []);
const dayOf = (t: number) => {
  const d = new Date(t);
  return d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate();
};

/** the notes to schedule now for the open stretch, or none */
export function trailNotes(mem: UrMem, days: Days, now: number): TrailNote[] {
  const s = trailStretchOf(mem);
  if (!trailOpen(s, now) || trailSlipSince(days, s.t0)) return [];
  const off = typeof mem.trailOff === 'number' ? mem.trailOff : 0;
  if (off > now) return [];
  const later = typeof mem.trailLater === 'number' ? mem.trailLater : 0;
  /* the notes already delivered, for the day's limit: the ones kept, and the last plan's that have come */
  const sent = nums(mem.trailSent).concat(nums(mem.trailPlan).filter((t) => t <= now));
  const out: TrailNote[] = [];
  let at = Math.max(now, s.last, later - TRAIL_NOTE_GAP, sent.length ? Math.max(...sent) : 0) + TRAIL_NOTE_GAP;
  while (out.length < TRAIL_NOTE_AHEAD) {
    const h = new Date(at).getHours();
    if (urNight(h) || at - s.last >= TRAIL_GAP || at < off) break;
    if (sent.filter((t) => dayOf(t) === dayOf(at)).length + out.filter((n) => dayOf(n.at) === dayOf(at)).length >= TRAIL_NOTE_DAY) break;
    out.push({ id: 'trail-' + out.length, at, title: 'Daybook', body: trailNoteWords(sent.length + out.length, at - s.t0) });
    at += TRAIL_NOTE_GAP;
  }
  return out;
}

/** a note's words: how long it has been held, then a line that leaves the door open; never what Daybook is for */
export function trailNoteWords(n: number, held: number): string {
  const h = Math.floor(held / 3600_000);
  const lines = ['If it knocks again, the door is right here.', 'Where is it now? You know the way home.', 'Still with you, at your pace.'];
  const line = lines[((n % lines.length) + lines.length) % lines.length];
  return h >= 1 ? cap(trailHeld(held).replace(/ and .*/, '')) + ' held. ' + line : line;
}

/** after scheduling: the plan is kept, and the notes of the last plan that have come move to the ones sent (a day of them) */
export function trailNoteKeep(mem: UrMem, notes: TrailNote[], now: number): UrMem {
  const sent = nums(mem.trailSent)
    .concat(nums(mem.trailPlan).filter((t) => t <= now))
    .filter((t, i, l) => t > now - 24 * 3600_000 && l.indexOf(t) === i);
  return { ...mem, trailSent: sent, trailPlan: notes.map((n) => n.at) };
}

/** Leave me be today: no notes until 4 in the morning */
export function trailLeave(mem: UrMem, now: number): UrMem {
  const d = new Date(now);
  d.setHours(4, 0, 0, 0);
  if (d.getTime() <= now) d.setDate(d.getDate() + 1);
  return { ...trailNoteKeep(mem, [], now), trailOff: d.getTime() };
}

/** Not for an hour: the next note no sooner than an hour from now */
export function trailLater(mem: UrMem, now: number): UrMem {
  return { ...trailNoteKeep(mem, [], now), trailLater: now + TRAIL_NOTE_GAP };
}

/* ---------- the guided 2 minutes (the owner, November 3, 2026: "2 minutes should be longer"; "it got my attention, and
   then it did nothing with it") ----------
   A craving is mostly a picture in the mind, and a picture held in the mind's eye crowds it out: a few minutes of a visual
   task lowers craving (Kavanagh's elaborated intrusion theory; Skorka-Brown 2015, Tetris for three minutes). So the 2-minute
   move is eight short cues, about fifteen seconds each, every one a thing to picture or to do now, while the place's picture
   acts it out and the wave rises and falls under it. It is rated before and after, so the person sees what it did. */
export const TRAIL_GUIDE_SECS = 120;

/** the words a cue can carry from the person's own plan */
export interface TrailGuideOwn {
  /** Drift: how to fill the low light */
  fill?: string;
  /** Steps: the side path */
  side?: string;
  /** Case: the line it says, the answer, and the key */
  line?: string;
  answer?: string;
  key?: string;
}

/** the eight cues for a place, with the person's own words where the place has them */
export function trailGuide(at: TrailPlace, own: TrailGuideOwn = {}): string[] {
  const end = (x: string) => x.trim().replace(/[.!]?$/, '.');
  switch (at) {
    case 'drift':
      return [
        'Say it to yourself: I am running low, and that is all this is.',
        'Notice where the pull sits in your body: your chest, your stomach, your hands.',
        'Breathe out slowly, longer than you breathe in. Twice more.',
        own.fill ? 'Now get up and fill it: ' + end(own.fill) : 'Now get up and meet the need, the simplest way you can.',
        'As you do it, watch the light on the post fill back up.',
        'The pull was riding on that need. Feel it get a little quieter.',
        'Picture yourself an hour from now: rested, fed, still free.',
        'Stay with that picture. The wave is already on its way down.',
      ];
    case 'spark':
      return [
        'Stand up now. Leave the phone where it is.',
        'Walk out of this room. The spark stays behind in it.',
        'Go somewhere with more light: another room, the porch, outside.',
        'Name five things you can see from where you are now.',
        'Name three things you can hear.',
        'Press your feet into the floor. Feel how solid it is.',
        'Picture that room behind you, and the spark in it going grey.',
        'A cue fades with distance and time. Stay here a little longer.',
      ];
    case 'preview':
      return [
        'Let the picture come. Do not fight it. Just name it: a preview.',
        'Now put your own picture over it, and look at yours instead.',
        'The preview stops at ten seconds. Keep the movie playing.',
        'Picture one minute after: the screen, the quiet room, you.',
        'Picture one hour after. What you feel. What you tell yourself.',
        'Picture waking up tomorrow after that.',
        'Now picture waking up tomorrow after stepping off tonight.',
        'That is the whole movie. The preview never shows you that part.',
      ];
    case 'case':
      return [
        own.line ? 'It is knocking: “' + own.line + '”' : 'It is knocking, with its best reason.',
        own.answer ? 'You do not need to argue. Your answer: ' + end(own.answer) : 'You do not need to argue. A thought is not a decision.',
        'Close the door. Picture your hand pushing it shut.',
        own.key ? 'Turn the key: ' + end(own.key) : 'Turn the key: the reason you started this.',
        'It knocks again. Let it. Knocking is not opening.',
        'Breathe out slowly. Feel your back against the door.',
        'Listen: each knock is a little softer than the one before.',
        'You are on this side of the door. You can stay here.',
      ];
    case 'steps':
      return [
        'Stop where you are. Notice the step you are on.',
        'Picture the way off this step. Your flame takes it.',
        own.side ? 'Now do it for real: ' + end(own.side) : 'Now do it for real: get up and go to another room.',
        'Put distance between you and the phone. Another room is enough.',
        'With every step you take, the stairs are further behind you.',
        'Picture the stairs back there, getting dimmer.',
        'You knew where it was going, and you chose another way.',
        'Stay on this side path. The wave is going down.',
      ];
  }
}

/** the cue where each place's picture acts: Drift's light fills, Spark's flame walks out, the person's picture slides over
    the glow, Case's door shuts and then locks, Steps' flame takes the side path */
export const TRAIL_ACT: Record<TrailPlace, number[]> = {
  drift: [4],
  spark: [1],
  preview: [1],
  case: [2, 3],
  steps: [1],
};

/** how strong it is, before and after the 2 minutes (the log's urge strength) */
export type TrailStrength = 'low' | 'mid' | 'high';
export const TRAIL_STRENGTH: { id: TrailStrength; label: string }[] = [
  { id: 'low', label: 'A little' },
  { id: 'mid', label: 'Strong' },
  { id: 'high', label: 'Very strong' },
];

/** what the 2 minutes did, said plainly. It never calls a still-strong craving a failure: loud is not a decision. */
export function trailAfter(before: TrailStrength, after: TrailStrength | 'gone'): { down: boolean; line: string } {
  const rank = { gone: 0, low: 1, mid: 2, high: 3 } as const;
  const name = (x: TrailStrength | 'gone') => (x === 'gone' ? 'gone' : TRAIL_STRENGTH.find((y) => y.id === x)!.label.toLowerCase());
  if (rank[after] < rank[before]) return { down: true, line: 'From ' + name(before) + ' to ' + name(after) + '. That was you.' };
  return { down: false, line: 'It is still loud. That is all right: loud is not a decision, and it cannot stay at the top.' };
}
