/* "How are you feeling today?": one question on the first open of the day, asked on Today and answered with one tap.
   Five plain steps, from Rough to Great. The answer is kept on the day itself (p.df: the step and when, in ms), next to
   the feelings named in Name the feeling (p.fe), so it goes wherever the day goes: on the device, and with an account,
   through sync like the rest of the day. It earns nothing and does not start the log (log-start.ts): how a day felt says
   nothing about whether it had a slip, and a feeling is never something to score.

   When it may ask: after the setup, once a day on the day's first open (dayOpenNext, which the app keeps on the device),
   and never after a slip: not on a day with a slip logged, and not while a Rekindle is open (the quest, the sunrise check
   and the days its run waits to be saved). The app also keeps it off SOS and every full-screen moment: it opens only over
   Today. Checked by test/day-feel.test.ts. */
import { sumDay } from './legacy/core.js';
import { changeDay } from './mutate';
import { rkActive, sunriseDue } from './rekindle';
import type { Day, DayKey, Days, Settings } from './types';

export type DayFeelStep = 1 | 2 | 3 | 4 | 5;

export interface DayFeelAnswer {
  n: DayFeelStep;
  /** the word on the answer */
  w: string;
  /** what Today says after the tap: warm, and short */
  say: string;
  /** a rough or low day: urges follow a low mood within hours, so the card offers SOS, one tap away */
  help?: boolean;
}

/** the five answers, lowest first. A hard day is honest data, never a fault, so the low words are as kind as the high ones. */
export const DAY_FEEL: DayFeelAnswer[] = [
  { n: 1, w: 'Rough', say: 'Thank you for telling. A rough day is still a day you showed up.', help: true },
  { n: 2, w: 'Low', say: 'Thank you for telling. Go gently today, and use SOS if an urge comes.', help: true },
  { n: 3, w: 'Okay', say: 'Thank you. Okay is a good place to build from.' },
  { n: 4, w: 'Good', say: 'Good. It is in today’s log.' },
  { n: 5, w: 'Great', say: 'Great. Enjoy it, and notice what helped.' },
];

export const DAY_FEEL_Q = 'How are you feeling today?';

const isStep = (n: unknown): n is DayFeelStep => n === 1 || n === 2 || n === 3 || n === 4 || n === 5;
export const dayFeelWord = (n: number): string => DAY_FEEL.find((a) => a.n === n)?.w || '';

/** the day's answer, or null when it was not answered */
export function dayFeelOf(d: Day | null | undefined): { n: DayFeelStep; w: string; at: number } | null {
  const x = d && d.p && d.p.df;
  if (!x || !isStep(x[0])) return null;
  return { n: x[0], w: dayFeelWord(x[0]), at: x[1] };
}

/** the day with its answer written (a new tap replaces the last one), or the day unchanged for a step that is not one of the five */
export function dayFeelSet(prev: Day | undefined | null, tk: DayKey, n: number, at: number): Day | null {
  if (!isStep(n)) return prev || null;
  return changeDay(prev, tk, (d) => void (d.p = { ...(d.p || blankPlay()), df: [n, at] }), at);
}

/** whether the question may be asked today, by the log: the setup is done, it is not answered yet, and no slip is near
    (logged today, or a Rekindle still open). The app adds the first open and keeps it to Today. */
export function dayFeelDue(days: Days, st: Settings | null, tk: DayKey): boolean {
  if (!st) return false;
  if (dayFeelOf(days[tk])) return false;
  if (sumDay(days[tk]).slipped) return false;
  if (rkActive(days, st, tk) || sunriseDue(days, st, tk)) return false;
  return true;
}

/** the first open of a day, kept on the device: `last` is the day the app was last opened. Gives the day to keep, and the
    day this open is the first of (null when the app was already opened today, or when the setup is not done yet: the day
    of the setup is not asked, so a new person is not met with one more question right after it). */
export function dayOpenNext(last: DayKey | null, tk: DayKey, setupDone: boolean): { last: DayKey; first: DayKey | null } {
  return { last: tk, first: last !== tk && setupDone ? tk : null };
}

/* a blank Play, matching legacy blankP (as in feelings.ts) */
const blankPlay = () => ({ w: [], wd: false, r: false, c: 0, m: false, tl: [], po: null, ls: [], lv: [], ov: {} });
