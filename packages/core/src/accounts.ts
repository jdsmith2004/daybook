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

/* The nudge (the owner, November 14, 2026: "if they don't sign up for an account the push to sign up should be more prominent like
   put it on the top to the right of ideas and push it every once in a while"). The button beside Ideas is there every day without an
   account; every few days, right after a good moment, it glows and the flame says one line under it. Never in the first days, never
   on a day with a slip or the day after, never in the quiet hours after an SOS or a slip (the app passes those as `quiet`, from
   support.ts tipQuiet), and never on a day the account card is already asking. Its X, or a tap on the button, waits ACCT_NUDGE_GAP days. */

/** days between two nudges */
export const ACCT_NUDGE_GAP = 3;
/** days from the start before the first nudge */
export const ACCT_NUDGE_FROM = 2;

export type NudgeWhy = 'lesson' | 'rode' | 'week';

/** whether the account button glows with a line today, and the good moment it follows: a lesson finished today, an urge ridden
    out today, or a week mark (day 7, 14, ...) */
export function accountNudge(days: Days, st: Settings, tk: DayKey, account: boolean, quiet: boolean): NudgeWhy | null {
  if (account || quiet) return null;
  const since = diffDays(tk, st.start);
  if (since < ACCT_NUDGE_FROM) return null;
  const last = isKey(st.acctNudge) ? (st.acctNudge as DayKey) : null;
  if (last && diffDays(tk, last) < ACCT_NUDGE_GAP) return null;
  if (slipNear(days, tk)) return null;
  const d = days[tk];
  if (d?.p?.ls?.length) return 'lesson';
  if (d?.events?.some((e) => e.outcome === 'rode')) return 'rode';
  if (since >= 7 && since % 7 === 0) return 'week';
  return null;
}

/** the nudge was seen and closed, or its button tapped */
export const accountNudged = (st: Settings, tk: DayKey, now = Date.now()): Change => ({
  st: changeSettings(st, (s) => void (s.acctNudge = tk), now),
});

/** the flame's line under the button: what a free account opens, after what was just done. Sync and the safe copy need a tip
    (supporter.ts), so the line sells the lessons, which a free account does open. */
export function nudgeWords(why: NudgeWhy, locked: number): string {
  const lead = why === 'lesson' ? 'Good lesson.' : why === 'rode' ? 'You rode that out.' : 'Another week of work.';
  const more = locked > 0 ? ` A free account opens the other ${locked} lessons.` : ' A free account keeps your lessons going on any device.';
  return lead + more;
}
