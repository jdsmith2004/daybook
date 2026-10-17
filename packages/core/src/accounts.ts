/* Accounts. Daybook works fully without one: SOS, logging, Rekindle, the plan, the tools and Today never check for an
   account. An account adds sync and a copy kept safe, and opens every lesson: without one, the first LEARN_FREE lessons in the
   daily order are open, and any lesson already finished stays open.

   Daybook asks at good moments only (after the first level-up, or after the first week) and never in a hard one (not on a day
   with a slip, or the day after). "Not now" waits ACCT_WAIT days. Checked by test/accounts.test.ts. */
import { changeSettings, type Change } from './actions';
import { addDays, diffDays, eventsOf, isKey } from './legacy/core.js';
import { lessonPath, type FaithMode, type Lesson } from './lessons';
import type { DayKey, Days, Settings } from './types';

/** lessons open without an account, at the start of the daily order */
export const LEARN_FREE = 3;
/** after "Not now", days before Daybook asks again */
export const ACCT_WAIT = 7;

/** the lessons open without an account */
export const freeLessons = (mode: FaithMode): Lesson[] => lessonPath(mode).slice(0, LEARN_FREE);

/** whether a lesson can be read. `account` is true when signed in, or when this copy of Daybook has no accounts at all. */
export function lessonOpen(L: Lesson, done: Set<string>, mode: FaithMode, account: boolean): boolean {
  return account || done.has(L.id) || freeLessons(mode).indexOf(L) >= 0;
}

/** how many lessons are waiting behind an account */
export const lessonsLocked = (all: Lesson[], done: Set<string>, mode: FaithMode, account: boolean) =>
  all.filter((L) => !lessonOpen(L, done, mode, account)).length;

export type AcctWhy = 'level' | 'week';

/** whether Today asks to make an account now, and why. level: the person's level now. */
export function accountAsk(days: Days, st: Settings, tk: DayKey, level: number, account: boolean): AcctWhy | null {
  if (account) return null;
  const no = isKey(st.acctNo) ? (st.acctNo as DayKey) : null;
  if (no && diffDays(tk, no) < ACCT_WAIT) return null;
  const hard = eventsOf(days).some((e) => e.outcome === 'slipped' && (e.key === tk || e.key === addDays(tk, -1)));
  if (hard) return null;
  if (diffDays(tk, st.start) >= 7) return 'week';
  if (level >= 2) return 'level';
  return null;
}

/** "Not now" on the account card */
export const accountLater = (st: Settings, tk: DayKey, now = Date.now()): Change => ({
  st: changeSettings(st, (s) => void (s.acctNo = tk), now),
});

/** the words on the account card. days: days since the start, so someone two months in is not told "a week in" */
export function accountWords(why: AcctWhy, locked: number, days = 7): { h: string; p: string } {
  const more = locked > 0 ? ` It also opens the other ${locked} lessons.` : '';
  return why === 'level'
    ? {
        h: 'You are on your way. Keep it safe.',
        p: 'A free account keeps a copy of your progress, so a lost phone never costs you a day, and it syncs to the web.' + more,
      }
    : {
        h: days < 14 ? 'A week in. Keep your progress safe.' : 'Keep what you have built safe.',
        p: 'A free account keeps a copy of your log and your points, and keeps your phone and the web in step.' + more,
      };
}
