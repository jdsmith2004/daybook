/* Accounts. Daybook works fully without one: SOS, logging, Rekindle, the plan, the tools and Today never check for an
   account. An account adds sync and a copy kept safe, and opens every lesson: without one, the first LEARN_FREE lessons in the
   daily order are open, and any lesson already finished stays open. This sits on top of the path's own order (lessons.ts
   lessonGate: one lesson opens at a time), which holds with an account or without.

   Daybook asks at good moments only (after the first level-up, or after the first week) and never in a hard one (not on a day
   with a slip, or the day after). "Not now" waits ACCT_WAIT days. Checked by test/accounts.test.ts. */
import { changeSettings, type Change } from './actions';
import { addDays, diffDays, eventsOf, isKey } from './legacy/core.js';
import { lessonPath, type Lesson } from './lessons';
import { SUPPORT_MIN } from './supporter';
import type { DayKey, Days, Settings } from './types';

/** lessons open without an account, at the start of the daily order */
export const LEARN_FREE = 3;
/** after "Not now", days before Daybook asks again */
export const ACCT_WAIT = 7;
/** the first level-up that asks: the first step of Kindling, a new form of the flame. Not level 2: the setup alone gives
    20 points and level 2 starts at 18, so level 2 is day 0, right after the setup's own account page. */
export const ACCT_LEVEL = 6;

/** the lessons open without an account */
export const freeLessons = (): Lesson[] => lessonPath().slice(0, LEARN_FREE);

/** whether a lesson can be read. `account` is true when signed in, or when this copy of Daybook has no accounts at all. */
export function lessonOpen(L: Lesson, done: Set<string>, account: boolean): boolean {
  return account || done.has(L.id) || freeLessons().indexOf(L) >= 0;
}

/** how many lessons are waiting behind an account */
export const lessonsLocked = (all: Lesson[], done: Set<string>, account: boolean) => all.filter((L) => !lessonOpen(L, done, account)).length;

export type AcctWhy = 'level' | 'week';

/** whether Today asks to make an account now, and why. level: the person's level now. */
export function accountAsk(days: Days, st: Settings, tk: DayKey, level: number, account: boolean): AcctWhy | null {
  if (account) return null;
  const no = isKey(st.acctNo) ? (st.acctNo as DayKey) : null;
  if (no && diffDays(tk, no) < ACCT_WAIT) return null;
  const hard = eventsOf(days).some((e) => e.outcome === 'slipped' && (e.key === tk || e.key === addDays(tk, -1)));
  if (hard) return null;
  if (diffDays(tk, st.start) >= 7) return 'week';
  if (level >= ACCT_LEVEL) return 'level';
  return null;
}

/** "Not now" on the account card */
export const accountLater = (st: Settings, tk: DayKey, now = Date.now()): Change => ({
  st: changeSettings(st, (s) => void (s.acctNo = tk), now),
});

/** the words on the account card. days: days since the start, so someone two months in is not told "a week in". canTip:
    a tip can be paid here (not on Android), so the card says what a tip adds */
export function accountWords(why: AcctWhy, locked: number, days = 7, canTip = true): { h: string; p: string } {
  const open = locked > 0 ? `A free account opens the other ${locked} lessons.` : 'A free account keeps your lessons going on any device.';
  const plus = canTip ? ' With a tip of $' + SUPPORT_MIN + ' or more, it also keeps a safe copy of your progress and the same on your phone and the web.' : '';
  return why === 'level'
    ? { h: 'You are on your way. Keep learning.', p: open + plus }
    : { h: days < 14 ? 'A week in. Keep learning.' : 'Keep building on what you have.', p: open + plus };
}
