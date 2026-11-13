/* Live Activities on iPhone: the flame on the Lock Screen and in the Dynamic Island, at the moments that matter.
   Redesigned on November 13, 2026 (the owner: "they don't tell us its for sos it doesn't convey importance or meaning they just
   look good and i press them and they open sos for no reason like i don't know whats going on"), on Duolingo's model: each one
   says what it is in plain words, shows one live number that matters and what it means ("1:25:04 left to hold on"), the flame
   in the mood of the moment, and one button that says exactly where a tap goes. The whole card goes to the same place as that
   button, so a tap is never a surprise.

   The words name the tool (SOS, hard hours, screens off, Good night), never the habit: someone who glances at the phone learns
   nothing (test/lock-screen.test.ts). No typed words, ever: not the plan's lines, not a note.

   iPhone starts one only while the app is open (no server: free, and nothing leaves the phone), so each one is built to stay
   true with the app closed. Its live number is a timer iPhone runs itself, and when the moment changes while the app is shut
   (the hard hours begin, screens off passes, morning comes) Apple's stale date turns it to its second face (`later`), with no
   app needed. So a countdown never sits at 0:00 under words that are no longer true.

   - The ride (SOS is open): "SOS: riding it out", the time held on counting up, and Back to SOS. It ends when the urge is
     ridden out, a slip is logged, SOS closes, or after LIVE_RIDE_MAX. It comes before the others. (The in-app timer bar on SOS
     stays gone: the owner ruled it out.)
   - The hard hours, from two hours before them to their end: "Hard hours: 8 to 10 PM", a countdown till they start, then
     what is left of them; Open your plan (or Make your plan when there is none), and SOS beside it.
   - The night, from 30 minutes before screens off: "Wind down" and the minutes left, then "Screens off" and the time past it,
     with Start Good night. After Goodnight: "Good night", how long the flame has rested, and SOS if it gets hard; in the
     morning, Start your morning.
   The hard hours come before the night when both fall at once. Checked by test/live-activity.test.ts. */
import { addDays, fmtClock, isTime } from './legacy/core.js';
import { riskAt, riskDay, riskLabel } from './risk';
import type { DayKey, Days, Settings } from './types';

const MIN = 60000;
const HOUR = 60 * MIN;
/** how long before screens off the night one starts */
export const LIVE_NIGHT_BEFORE = 30 * MIN;
/** how long after screens off it stays, while Goodnight is not done */
export const LIVE_NIGHT_AFTER = 60 * MIN;
/** the longest the ride shows: an SOS left open longer than this is let go from the Lock Screen */
export const LIVE_RIDE_MAX = 60 * MIN;
/** iPhone ends a Live Activity after 8 hours */
const LIVE_MAX = 8 * HOUR;

export type LiveKind = 'hard' | 'night' | 'ride';
/** the live number: iPhone counts it down to b, or up from a, on its own */
export interface LiveClock {
  a: number;
  b: number;
  down: boolean;
}
/** one face of a Live Activity: what it is, the number that matters, what it means, and where a tap goes */
export interface LiveFace {
  /** names it: "SOS: riding it out", "Hard hours: 8 to 10 PM" */
  head: string;
  /** the one live number, or null when big says it instead */
  clock: LiveClock | null;
  /** said big when there is no clock ("Over") */
  big: string;
  /** what the number means, under it ("left to hold on") */
  note: string;
  /** the button, saying where it goes ("Open your plan") */
  act: string;
  /** that place, an app path ("/plan/urge") */
  go: string;
  /** an SOS button beside it */
  sos: boolean;
}
export interface LivePlan {
  kind: LiveKind;
  /** one per kind a log day: the same key is updated, a new key ends the old one and starts again */
  key: string;
  /** when the app ends it (ms) */
  to: number;
  /** when its face turns to `later` by itself (Apple's stale date) */
  stale: number;
  /** the flame: burning bright, as it burns now, or asleep */
  mood: 'bright' | 'now' | 'asleep';
  /** where a tap on the card goes: always the same place as the button */
  url: string;
  face: LiveFace;
  later: LiveFace;
}

/** a time as it is said: "8 PM", "11:30 PM" */
export function liveClock(ms: number): string {
  const d = new Date(ms);
  const h = d.getHours();
  const m = d.getMinutes();
  return (h % 12 || 12) + (m ? ':' + String(m).padStart(2, '0') : '') + (h < 12 ? ' AM' : ' PM');
}

/** every word a Live Activity can show: short and plain, the tool named, never the habit */
export const LIVE_WORDS = {
  ride: 'SOS: riding it out',
  rideNote: (t0: number) => 'held on since ' + liveClock(t0),
  rideBack: 'Back to SOS',
  rideLong: 'Still on?',
  rideLongNote: 'SOS has been open over an hour',
  hard: (start: number) => 'Hard hours: ' + riskLabel(start),
  hardSoon: 'until they start',
  hardLeft: 'left to hold on',
  hardOver: 'Over',
  hardOverNote: 'for today',
  plan: 'Open your plan',
  planNew: 'Make your plan',
  today: 'Open Today',
  wind: 'Wind down',
  windNote: (off: string) => 'until screens off at ' + fmtClock(off),
  windGo: 'Start Good night',
  off: (off: string) => 'Screens off: ' + fmtClock(off),
  offNote: 'past screens off. Put the phone down.',
  offGo: 'Say good night',
  asleep: 'Good night',
  asleepNote: (down: number) => 'resting since ' + liveClock(down),
  asleepGo: 'SOS if it gets hard',
  morning: 'The night is done',
  morningBig: 'Good morning',
  morningNote: 'Start it with your check-in',
  morningGo: 'Start your morning',
};
const W = LIVE_WORDS;

const minOf = (t: string) => +t.slice(0, 2) * 60 + +t.slice(3, 5);
const face = (f: Partial<LiveFace> & Pick<LiveFace, 'head' | 'act' | 'go'>): LiveFace => ({ clock: null, big: '', note: '', sos: false, ...f });

/** the Live Activity that should be showing now, or null. sosAt: when the open SOS began (null when none is open) */
export function livePlan(days: Days, st: Settings | null, tk: DayKey, now: number, sosAt: number | null = null): LivePlan | null {
  if (sosAt != null && now >= sosAt && now < sosAt + LIVE_RIDE_MAX) {
    const end = sosAt + LIVE_RIDE_MAX;
    const back = { act: W.rideBack, go: '/sos' };
    return {
      kind: 'ride',
      key: 'ride-' + sosAt,
      to: end,
      stale: end,
      mood: 'bright',
      url: '/sos',
      face: face({ head: W.ride, clock: { a: sosAt, b: sosAt + LIVE_MAX, down: false }, note: W.rideNote(sosAt), ...back }),
      later: face({ head: W.ride, big: W.rideLong, note: W.rideLongNote, ...back }),
    };
  }
  if (!st) return null;
  const r = riskDay(days, st, tk, now);
  if (r && (r.phase === 'soon' || r.phase === 'during')) {
    /* straight to the plan's if-then lines (as the Tonight card's bubbles go), or to making one */
    const plan = (st.plan || []).length ? { act: W.plan, go: '/plan/urge' } : { act: W.planNew, go: '/trail' };
    const head = W.hard(r.win.start);
    const left = face({ head, clock: { a: r.a, b: r.b, down: true }, note: W.hardLeft, sos: true, ...plan });
    const over = face({ head, big: W.hardOver, note: W.hardOverNote, act: W.today, go: '/' });
    const soon = r.phase === 'soon';
    return {
      kind: 'hard',
      key: 'hard-' + tk,
      to: r.b,
      stale: soon ? r.a : r.b,
      mood: 'now',
      url: plan.go,
      face: soon ? face({ head, clock: { a: r.a - 2 * HOUR, b: r.a, down: true }, note: W.hardSoon, sos: true, ...plan }) : left,
      later: soon ? left : over,
    };
  }
  if (!isTime(st.screensOff)) return null;
  const m = minOf(st.screensOff);
  const off = riskAt(tk, Math.floor(m / 60), st.rollover, m % 60);
  const morning = riskAt(addDays(tk, 1), st.rollover, st.rollover);
  const po = days[tk]?.p?.po;
  if (po) {
    /* Goodnight is done: the flame rests till the day turns over, with SOS one tap away (the owner, November 9, 2026: "when I go
       to sleep I want an SOS button"), and greets the morning */
    if (now >= morning) return null;
    const down = Math.min(now, isTime(po) ? riskAt(tk, Math.floor(minOf(po) / 60), st.rollover, minOf(po) % 60) : now);
    return {
      kind: 'night',
      key: 'night-' + tk,
      to: Math.min(morning, now + LIVE_MAX),
      stale: morning,
      mood: 'asleep',
      url: '/sos',
      face: face({ head: W.asleep, clock: { a: down, b: down + LIVE_MAX, down: false }, note: W.asleepNote(down), act: W.asleepGo, go: '/sos' }),
      later: face({ head: W.morning, big: W.morningBig, note: W.morningNote, act: W.morningGo, go: '/morning' }),
    };
  }
  if (now < off - LIVE_NIGHT_BEFORE || now >= off + LIVE_NIGHT_AFTER) return null;
  const night = { act: W.windGo, go: '/night' };
  const past = face({ head: W.off(st.screensOff), clock: { a: off, b: off + LIVE_MAX, down: false }, note: W.offNote, ...night, act: W.offGo });
  const before = now < off;
  return {
    kind: 'night',
    key: 'night-' + tk,
    to: off + LIVE_NIGHT_AFTER,
    stale: before ? off : off + LIVE_NIGHT_AFTER,
    mood: 'now',
    url: '/night',
    face: before ? face({ head: W.wind, clock: { a: off - LIVE_NIGHT_BEFORE, b: off, down: true }, note: W.windNote(st.screensOff), ...night }) : past,
    later: past,
  };
}

/** what the Live Activity is handed (widgets/live.tsx): flat, the face's fields and the later face's with a 2 on the end */
export type LiveProps = Record<string, string | number>;
const flat = (f: LiveFace, s: string): LiveProps => ({
  ['h' + s]: f.head,
  ['big' + s]: f.big,
  ['n' + s]: f.note,
  ['act' + s]: f.act,
  ['go' + s]: 'daybook://' + f.go.replace(/^\//, ''),
  ['sos' + s]: f.sos ? 1 : 0,
  ['ca' + s]: f.clock?.a ?? 0,
  ['cb' + s]: f.clock?.b ?? 0,
  ['cd' + s]: f.clock ? (f.clock.down ? 'down' : 'up') : '',
});
export function liveProps(p: LivePlan): LiveProps {
  return { kind: p.kind, asleep: p.mood === 'asleep' ? 1 : 0, ...flat(p.face, ''), ...flat(p.later, '2') };
}
/** every word a plan puts on the Lock Screen, for the tests */
export const liveWordsOf = (p: LivePlan): string[] => [p.face, p.later].flatMap((f) => [f.head, f.big, f.note, f.act]);
