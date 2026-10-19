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
export const SUPPORT_URL: string = '';
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

/** the one ask is answered ("Leave a tip" or "No thanks"): Today never asks again */
export const tipAnswered = (st: Settings, tk: DayKey, now = Date.now()): Change => ({
  st: changeSettings(st, (s) => void (s.tipAsk = tk), now),
});

/** the words, in one place */
export const TIP_WORDS = {
  h: 'Daybook is free, and it stays free.',
  p: 'No ads, no tracking, and nothing to unlock. One person builds it. If it has helped you, a tip helps keep it free for the next person.',
  go: 'Leave a tip',
  no: 'No thanks',
  foot: 'This card will not come back. The link stays on More, if you ever want it.',
  row: { title: 'Support Daybook', sub: 'Free for everyone, with no ads and no tracking. A tip helps keep it that way.' },
  grad: 'Daybook is free for everyone. If it helped you get here, a tip helps keep it free for the next person.',
  /** the setup's page, near its end */
  intro: {
    h: 'Everything in Daybook is free.',
    p: 'Daybook is made by one person, and kept going by people who chip in.',
    p2: 'If you can, a small tip keeps it free for the next person. If you cannot, that is completely fine. Daybook is just as much yours.',
    pills: ['No ads', 'No tracking', 'Nothing locked'],
  },
  /** the small button at the top of Today */
  top: 'Support',
};
