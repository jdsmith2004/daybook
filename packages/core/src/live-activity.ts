/* Live Activities on iPhone (the owner, November 9, 2026: "the app knows your hard hours are 8-10, that is how I get a notification, have it
   do a live activity instead"). Two of them, each the flame on the Lock Screen and in the Dynamic Island:
   - Hard hours: from the heads-up before them to their end. The flame and when they end, and a tap opens SOS. No words about help or
     the habit: the owner wants nobody who looks at the phone to know what it is for.
   - The night: from 90 minutes before screens off. "Wind down", and a tap opens the wind-down. After Goodnight, the flame sleeps till
     morning.
   iPhone starts one only while the app is open (no server: free, and nothing leaves the phone). So it starts when the heads-up or the
   wind-down note is tapped, or whenever the app is opened in those hours. The app ends it when its time is up, or iPhone does after
   8 hours. The hard hours come first when both fall at once. Checked by test/live-activity.test.ts. */
import { addDays, fmtClock, isTime } from './legacy/core.js';
import { riskAt, riskDay, riskStartLabel } from './risk';
import type { DayKey, Days, Settings } from './types';

const MIN = 60000;
const HOUR = 60 * MIN;
/** how long before screens off the night one starts */
export const LIVE_NIGHT_BEFORE = 90 * MIN;
/** how long after screens off it stays, while Goodnight is not done */
export const LIVE_NIGHT_AFTER = 60 * MIN;
/** iPhone ends a Live Activity after 8 hours */
const LIVE_MAX = 8 * HOUR;

export type LiveKind = 'hard' | 'night';
export interface LivePlan {
  kind: LiveKind;
  /** one per kind a log day: the same key is updated, a new key ends the old one and starts again */
  key: string;
  /** when it should end (ms) */
  to: number;
  /** the flame asleep (after Goodnight) */
  asleep: boolean;
  line: string;
  /** the time under it */
  sub: string;
  /** the same, short, for the Dynamic Island ("10 PM") */
  short: string;
  /** the screen a tap opens */
  url: string;
}

/** the words, kept short and plain: nothing says what Daybook is for */
export const LIVE_WORDS = {
  hard: 'Your flame is with you',
  hardSub: (endHour: number) => 'Till ' + riskStartLabel(endHour),
  wind: 'Wind down',
  windSub: (off: string) => 'Screens off at ' + fmtClock(off),
  asleep: 'Resting till morning',
};

const minOf = (t: string) => +t.slice(0, 2) * 60 + +t.slice(3, 5);

/** the Live Activity that should be showing now, or null */
export function livePlan(days: Days, st: Settings | null, tk: DayKey, now: number): LivePlan | null {
  if (!st) return null;
  const r = riskDay(days, st, tk, now);
  if (r && (r.phase === 'soon' || r.phase === 'during')) {
    return {
      kind: 'hard',
      key: 'hard-' + tk,
      to: r.b,
      asleep: false,
      line: LIVE_WORDS.hard,
      sub: LIVE_WORDS.hardSub((r.win.start + 2) % 24),
      short: riskStartLabel((r.win.start + 2) % 24),
      url: '/sos',
    };
  }
  if (!isTime(st.screensOff)) return null;
  const m = minOf(st.screensOff);
  const off = riskAt(tk, Math.floor(m / 60), st.rollover, m % 60);
  const morning = riskAt(addDays(tk, 1), st.rollover, st.rollover);
  if (days[tk]?.p?.po) {
    /* Goodnight is done: the flame sleeps till the day turns over, or 8 hours */
    if (now >= morning) return null;
    return {
      kind: 'night',
      key: 'night-' + tk,
      to: Math.min(morning, now + LIVE_MAX),
      asleep: true,
      line: LIVE_WORDS.asleep,
      sub: '',
      short: '',
      url: '/wind',
    };
  }
  if (now < off - LIVE_NIGHT_BEFORE || now >= off + LIVE_NIGHT_AFTER) return null;
  return {
    kind: 'night',
    key: 'night-' + tk,
    to: off + LIVE_NIGHT_AFTER,
    asleep: false,
    line: LIVE_WORDS.wind,
    sub: LIVE_WORDS.windSub(st.screensOff),
    short: fmtClock(st.screensOff),
    url: '/wind',
  };
}
