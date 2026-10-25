/* Support. Daybook is free, and it asks for money (the owner, October 23, 2026): a tip of SUPPORT_MIN dollars or more makes a
   person a supporter, which opens the extras (supporter.ts). Care is never locked.

   The asks: the small Support button at the top of Today (hidden in the days after a slip), and the card on Today, first a
   week in, then again every TIP_EVERY days after it was answered, only at a good moment: in the daytime, with no slip in
   the last four days (which covers the Rekindle quest's three days), never in the three hours after an SOS or a slip,
   never next to the account card, and a few days after that card's "Not now". A moment of earned value (a new level, a
   new badge, the first week looked back on) can carry a short ask too, under the same rules, and there is never more than
   one ask of any kind in TIP_SPACE days. Once the person is a supporter, every ask
   stops for good, and the row on More turns into a thank-you. With no way to tip on this device (Android, until Google
   Play's rules are checked), nothing about tips shows and nothing is locked. Checked by test/support.test.ts.

   On iPhone, Apple's in-app purchase is first, as Guideline 3.1.1 requires for anything that unlocks features; the link
   to the web tip page is allowed on the United States storefront (3.1.1(a), 3.1.3), and Daybook is offered there only. */
import { changeSettings, type Change } from './actions';
import type { AcctWhy } from './accounts';
import { addDays, diffDays, eventsOf, isKey, isTime, logicalKey } from './legacy/core.js';
import { riskAt } from './risk';
import { isSupporter, SITE_URL, SUPPORT_MIN, SUPPORT_URL } from './supporter';
import type { DayKey, Days, Settings } from './types';

export const SITE_PAGES = { support: SITE_URL + '/support.html', privacy: SITE_URL + '/privacy.html', terms: SITE_URL + '/terms.html' };
/** where people write for help (the owner's choice, October 19, 2026) */
export const SUPPORT_EMAIL = 'jeffreydsmith.cs@gmail.com';
/** days since the start before Today first asks */
export const TIP_FIRST = 7;
/** days after the card was answered before Today asks again */
export const TIP_EVERY = 14;
/** days with no slip before Today asks (the day of a slip and the quest's three days) */
export const TIP_CALM = 4;
/** days after the account card's "Not now" before Today asks */
export const TIP_GAP = 3;
/** Today asks only from this hour, and until before the second */
export const TIP_HOURS: [number, number] = [9, 20];
/** hours after an SOS or a slip before Today asks (the owner's choice, October 21, 2026) */
export const TIP_QUIET = 3;

/** days between any two asks, the card or a moment (TIP_EVERY still spaces the card itself) */
export const TIP_SPACE = 7;

/** the moment just now: when an SOS was last open on this device (core urLastAt), and the time */
export interface TipNear {
  now: number;
  sos: number | null;
}

/** whether an SOS or a slip was under TIP_QUIET hours ago */
export function tipQuiet(days: Days, st: Settings, near: TipNear): boolean {
  const from = near.now - TIP_QUIET * 3600_000;
  if (near.sos != null && near.sos > from && near.sos <= near.now + 60_000) return true;
  const k0 = addDays(logicalKey(near.now, st.rollover), -1);
  return eventsOf(days, k0).some(
    (e) => e.outcome === 'slipped' && isTime(e.time) && riskAt(e.key, +e.time.slice(0, 2), st.rollover, +e.time.slice(3, 5)) > from,
  );
}

/** what every ask needs: a link, someone who is not a supporter yet, the daytime, no SOS or slip in the last TIP_QUIET
    hours, no slip in the last TIP_CALM days, and no other ask in the last TIP_SPACE days */
function askable(days: Days, st: Settings, tk: DayKey, hour: number, url: string, near: TipNear | null): boolean {
  if (!url || isSupporter(st, near?.now)) return false;
  if (hour < TIP_HOURS[0] || hour >= TIP_HOURS[1]) return false;
  if (near && tipQuiet(days, st, near)) return false;
  for (const k of [st.tipAsk, st.tipMo]) if (isKey(k) && diffDays(tk, k as DayKey) < TIP_SPACE) return false;
  return calm(days, tk);
}

/** whether Today shows the tip card now: a week in, then TIP_EVERY days after it was answered. acct: the account card's
    answer for today (accountAsk). near: the time and the last SOS, so the ask waits TIP_QUIET hours after an SOS or a slip. */
export function tipAsk(days: Days, st: Settings, tk: DayKey, hour: number, acct: AcctWhy | null, url = SUPPORT_URL, near: TipNear | null = null): boolean {
  if (acct || !askable(days, st, tk, hour, url, near)) return false;
  if (isKey(st.tipAsk) && diffDays(tk, st.tipAsk as DayKey) < TIP_EVERY) return false;
  if (diffDays(tk, st.start) < TIP_FIRST) return false;
  if (isKey(st.acctNo) && diffDays(tk, st.acctNo as DayKey) < TIP_GAP) return false;
  return true;
}

/** a moment of earned value: a new level, a new badge, the first week looked back on */
export type TipMoment = 'level' | 'badge' | 'week';
/** whether this moment carries a tip ask (a line and a button under it): the same good-moment rules as the card, and at
    most one ask of any kind in TIP_SPACE days. A celebration that comes in quietly (right after a slip) never asks. */
export function tipMoment(days: Days, st: Settings, tk: DayKey, hour: number, url = SUPPORT_URL, near: TipNear | null = null, quiet = false): boolean {
  return !quiet && askable(days, st, tk, hour, url, near);
}
/** a moment asked: no other ask for TIP_SPACE days */
export const tipMomentShown = (st: Settings, tk: DayKey, now = Date.now()): Change => ({
  st: changeSettings(st, (s) => void (s.tipMo = tk), now),
});

/** no slip today or in the days before it (TIP_CALM in all) */
function calm(days: Days, tk: DayKey): boolean {
  const from = addDays(tk, 1 - TIP_CALM);
  return !eventsOf(days).some((e) => e.outcome === 'slipped' && e.key >= from && e.key <= tk);
}

/** whether Today shows its small Support button at the top: until the person is a supporter, except in the days after a slip */
export const tipButton = (days: Days, tk: DayKey, url = SUPPORT_URL, st: Settings | null = null, now = Date.now()): boolean =>
  !!url && !isSupporter(st, now) && calm(days, tk);

/** the card is answered ("See the tips" or "Not right now"): Today asks again TIP_EVERY days later, unless a tip comes first */
export const tipAnswered = (st: Settings, tk: DayKey, now = Date.now()): Change => ({
  st: changeSettings(st, (s) => void (s.tipAsk = tk), now),
});

const M = '$' + SUPPORT_MIN;
const GETS = 'sync between your devices, a safe copy of your log, and your whole pattern: when it happens, what sets it off and what helps you most';

/** the words, in one place. They sell what a tip opens; they never shame, and never say anything is owed. */
export const TIP_WORDS = {
  /** the card on Today */
  h: 'Unlock the extras with a ' + M + ' tip.',
  p:
    'One person builds Daybook. A tip of ' + M + ' or more makes you a supporter and unlocks ' + GETS + '. It is yours for good, and it keeps Daybook growing.',
  go: 'See the tips',
  no: 'Not right now',
  /** the row on More */
  row: { title: 'Support Daybook', sub: 'A tip of ' + M + ' or more unlocks sync, a safe copy and your whole pattern.' },
  rowThanks: { title: 'You are a supporter', sub: 'Thank you. See what is open for you.' },
  grad: 'Daybook runs on tips from people like you. If it helped you get here, a tip helps the next person get here too.',
  /** the small button at the top of Today */
  top: 'Support',
  /** the line and button under a moment of earned value (tipMoment) */
  moment: {
    level: 'Your flame is growing. Grow with it: a tip of ' + M + ' or more unlocks sync, a safe copy and your whole pattern.',
    badge: 'You earned that. A tip of ' + M + ' or more unlocks sync, a safe copy and your whole pattern.',
    week: 'A whole week of showing up. A tip of ' + M + ' or more unlocks sync, a safe copy and your whole pattern.',
    go: 'See the tips',
  },
  /** the tip sheet */
  sheet: {
    title: 'Support Daybook',
    line: 'One person builds Daybook. A tip of ' + M + ' or more makes you a supporter and unlocks all of this, for good:',
    /** the badge on the middle tip */
    badge: 'Our pick',
    web: 'Prefer to tip on the web? Apple Pay works there too.',
    /** the choice the web link opens (iPhone, United States storefront only) */
    webTitle: 'Tip on the web',
    webLine: 'A secure Stripe page opens. Apple Pay works there too.',
    cancel: 'Cancel',
    /** why an Apple tip did not go through, said on the sheet itself */
    appleOff: 'Tips through Apple are not open yet, and nothing was charged.',
    appleOffWeb: 'Tips through Apple are not open yet, and nothing was charged. You can tip on the web below.',
    appleBlocked: 'Purchases are turned off on this iPhone (Screen Time, Content and Privacy), so nothing was charged.',
    appleFailed: 'Apple could not take the tip, and nothing was charged. Try again in a moment.',
    restore: 'Restore a tip',
    restoreNone: 'No earlier tip was found. If you tipped on the web, sign in with that account first.',
    note: 'Paid once, yours for good.',
    thanksTitle: 'Thank you',
    thanksLine: 'You are a supporter. This is open for you:',
    again: 'Tip again',
    doneTitle: 'You are a supporter',
    doneLine: 'Thank you. This just opened for you:',
    done: 'Done',
  },
  /** the card on a locked page */
  lock: {
    btn: 'Unlock with a ' + M + ' tip',
    stats: {
      h: 'The rest of your pattern',
      p: 'When it happens, what sets it off, what is different on hard days and what helps you most. A tip of ' + M + ' or more opens it, for good.',
    },
    sync: {
      h: 'Sync and a safe copy',
      p: 'Your log the same on your phone and on the web, with a safe copy in your account if a phone is lost. A tip of ' + M + ' or more opens it, for good.',
    },
  },
};
