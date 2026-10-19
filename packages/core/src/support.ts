/* Support. Daybook is free for everyone, with no ads and no tracking, and money never opens anything: no lesson, no tool,
   no setting. One link lets a person leave a tip.

   The setup says so plainly near its end, with a tip button under it (like ScreenZen), and Today keeps a small Support
   button at its top, except in the four days after a slip. Today also asks once, at a good moment: a month in, in the daytime, and never in a hard one (no slip in the last four days,
   which covers the Rekindle quest's three days). It never sits next to the account card, and waits a few days after that
   card's "Not now", so two asks never come together. After the one ask, the link stays as a quiet row on More and a line
   under graduation. With no link set, nothing about tips shows anywhere. Checked by test/support.test.ts.

   On iPhone, a link out to pay is allowed on the US App Store only (Review Guidelines 3.1.1(a)), so the app is offered in
   the US alone while this link is in it. */
import { changeSettings, type Change } from './actions';
import type { AcctWhy } from './accounts';
import { addDays, diffDays, eventsOf, isKey } from './legacy/core.js';
import type { DayKey, Days, Settings } from './types';

/** where a tip goes. Empty: nothing about tips shows. */
export const SUPPORT_URL: string = 'https://buy.stripe.com/fZudRb2Rn3QafC3gWCeUU00';
/** the public pages next to the web app (apps/mobile/public): help, the privacy policy and the terms, which the App
    Store links to as well */
export const SITE_URL = 'https://d3c9g6kent5bsr.cloudfront.net';
export const SITE_PAGES = { support: SITE_URL + '/support.html', privacy: SITE_URL + '/privacy.html', terms: SITE_URL + '/terms.html' };
/** where people write for help (the owner's choice, October 19, 2026) */
export const SUPPORT_EMAIL = 'jeffreydsmith.cs@gmail.com';
/** days since the start before Today asks */
export const TIP_AFTER = 30;
/** days with no slip before Today asks (the day of a slip and the quest's three days) */
export const TIP_CALM = 4;
/** days after the account card's "Not now" before Today asks */
export const TIP_GAP = 3;
/** Today asks only from this hour, and until before the second */
export const TIP_HOURS: [number, number] = [9, 20];

/** whether Today asks for a tip now. acct: the account card's answer for today (accountAsk). */
export function tipAsk(days: Days, st: Settings, tk: DayKey, hour: number, acct: AcctWhy | null, url = SUPPORT_URL): boolean {
  if (!url || isKey(st.tipAsk) || acct) return false;
  if (hour < TIP_HOURS[0] || hour >= TIP_HOURS[1]) return false;
  if (diffDays(tk, st.start) < TIP_AFTER) return false;
  if (isKey(st.acctNo) && diffDays(tk, st.acctNo as DayKey) < TIP_GAP) return false;
  return calm(days, tk);
}

/** no slip today or in the days before it (TIP_CALM in all) */
function calm(days: Days, tk: DayKey): boolean {
  const from = addDays(tk, 1 - TIP_CALM);
  return !eventsOf(days).some((e) => e.outcome === 'slipped' && e.key >= from && e.key <= tk);
}

/** whether Today shows its small Support button at the top: always, except in the days after a slip */
export const tipButton = (days: Days, tk: DayKey, url = SUPPORT_URL): boolean => !!url && calm(days, tk);

/** the one ask is answered ("Support Daybook" or "Not right now"): Today never asks again */
export const tipAnswered = (st: Settings, tk: DayKey, now = Date.now()): Change => ({
  st: changeSettings(st, (s) => void (s.tipAsk = tk), now),
});

/** the words, in one place */
export const TIP_WORDS = {
  h: 'Daybook runs on tips.',
  p: 'No ads, no subscription, and nothing locked. One person builds it, and tips from the people it helps are what keep it going and let it reach more people who need it. If it has helped you, a tip of any size makes a real difference.',
  go: 'Support Daybook',
  no: 'Not right now',
  foot: 'This card will not come back. Support stays at the top of Today and on More.',
  row: { title: 'Support Daybook', sub: 'Daybook runs on tips. They pay for the servers, and for the time to make it better.' },
  grad: 'Daybook runs on tips from people like you. If it helped you get here, a tip helps the next person get here too.',
  /** the setup's page, near its end */
  intro: {
    h: 'Everything in Daybook is free.',
    p: 'Daybook is built by one person, and it runs on tips from the people it helps. Tips pay for the servers and the developer account, and for the time to make it better and reach more people who need it.',
    p2: 'If Daybook helps you, a tip of any size makes a real difference. If you cannot right now, that is okay. Daybook is yours either way.',
    pills: ['No ads', 'No tracking', 'Nothing locked'],
  },
  /** the small button at the top of Today */
  top: 'Support',
};
