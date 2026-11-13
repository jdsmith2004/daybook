/* Accounts. Daybook works fully without one: SOS, logging, Rekindle, the plan, the tools and Today never check for an
   account. An account adds sync and a copy kept safe, and opens every lesson: without one, the first LEARN_FREE lessons of the
   person's own path are open, and any lesson already finished stays open (lessons.ts lessonOpen, freeLessons). This sits on top of
   the path's own order (lessons.ts lessonGate: one lesson opens at a time), which holds with an account or without.

   Daybook asks after the first week only, and never in a hard moment (not on a day with a slip, or the day after). "Not now" waits ACCT_WAIT days. Checked by test/accounts.test.ts. */
import { changeSettings, type Change } from './actions';
import { diffDays, isKey } from './legacy/core.js';
import { LEARN_FREE, slipNear } from './lessons';
import { SUPPORT_MIN } from './supporter';
import type { DayKey, Days, Settings } from './types';

/** after "Not now", days before Daybook asks again */
export const ACCT_WAIT = 7;
/** the days from the start before the account card first shows: the first week (WP11; it used to show from level 6 too, which is
    day 2 for someone doing everything) */
export const ACCT_DAYS = 7;

export type AcctWhy = 'level' | 'week';

/** whether Today asks to make an account now, and why: after the first week, never on a day with a slip or the day after, and
    ACCT_WAIT days after "Not now". `level` is kept for the callers and no longer read. */
export function accountAsk(days: Days, st: Settings, tk: DayKey, _level: number, account: boolean): AcctWhy | null {
  if (account) return null;
  const no = isKey(st.acctNo) ? (st.acctNo as DayKey) : null;
  if (no && diffDays(tk, no) < ACCT_WAIT) return null;
  if (slipNear(days, tk)) return null;
  return diffDays(tk, st.start) >= ACCT_DAYS ? 'week' : null;
}

/** "Not now" on the account card */
export const accountLater = (st: Settings, tk: DayKey, now = Date.now()): Change => ({
  st: changeSettings(st, (s) => void (s.acctNo = tk), now),
});

/** the words on the account card. days: days since the start, so someone two months in is not told "a week in". canTip:
    a tip can be paid here (not on Android), so the card says what a tip adds */
export function accountWords(why: AcctWhy, locked: number, days = 7, canTip = true): { h: string; p: string } {
  const open =
    locked > 0
      ? `The first ${LEARN_FREE} lessons are free. A free account opens the other ${locked}.`
      : 'A free account keeps your lessons going on any device.';
  const plus = canTip ? ' With a tip of $' + SUPPORT_MIN + ' or more, it also keeps a safe copy of your progress and the same on your phone and the web.' : '';
  return why === 'level'
    ? { h: 'You are on your way. Keep learning.', p: open + plus }
    : { h: days < 14 ? 'A week in. Keep learning.' : 'Keep building on what you have.', p: open + plus };
}
