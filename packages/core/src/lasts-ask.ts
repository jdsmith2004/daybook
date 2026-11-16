/* "How long does it usually last?", asked once of people who set up before setup asked it again (the owner, November 15, 2026: "it
   just has to track well and be an extremely smooth experience for people updating"). Setup stopped asking it on November 12, 2026
   and asked it again from 1.3.5, so a person who set up in between has how often but not how long, and the "Time given back" line on
   Today (time-back.ts) and the hours on Miles stay hidden for them. This asks it once, with setup's own words and answers for their
   habit (obMinsPage), and then those fill in.

   When: on Today, at a good moment, the way "Do you like Daybook so far?" comes (like.ts): never in the hours after an SOS or a slip,
   never on the day of a slip or the day after, never on the morning the flame was lit, and never on a day another ask came (a tip,
   the account card, the rating question), so one open never carries two. What's new and every other page or celebration come first
   (the app waits for a quiet Today). Shown once: it is marked as it opens, so answered, skipped or closed, it never comes again.
   A person who skipped it in setup is never asked: that was their answer. Checked by test/lasts-ask.test.ts. */
import { changeSettings, type Change } from './actions';
import { litToday } from './ignite';
import { diffDays, isKey } from './legacy/core.js';
import { slipNear } from './lessons';
import { LIKE_FIRST, type LikeNear } from './like';
import { obHabit, obMinsPage } from './setup';
import { tipQuiet } from './support';
import type { DayKey, Days, Settings } from './types';

/** when setup started asking how long again (1.3.5, commit 186eb67b): a setup finished after this asked it, so a missing answer there
    was a skip, and is left alone */
export const LASTS_SETUP_FROM = Date.UTC(2026, 10, 15, 23, 25);

/** the answers setup kept, or null */
const answers = (st: Settings): Record<string, unknown> | null => (st.onb && st.onb.a && typeof st.onb.a === 'object' ? st.onb.a : null);

/** a person this question is for: setup was finished before it asked how long, with how often answered and how long not */
export function lastsAskFor(st: Settings | null): boolean {
  if (!st || isKey(st.lastsAt)) return false;
  const a = answers(st);
  if (!a || typeof a.freq !== 'string' || !a.freq || (typeof a.mins === 'string' && a.mins)) return false;
  const at = st.onb && typeof st.onb.at === 'number' ? st.onb.at : 0;
  return at < LASTS_SETUP_FROM;
}

/** another ask came today: the tip card or a tip on a moment, the account card, or the rating question */
const askedToday = (st: Settings, tk: DayKey): boolean => st.tipAsk === tk || st.tipMo === tk || st.acctNo === tk || st.acctNudge === tk || st.likeAt === tk;

/** whether this open of Today asks it */
export function lastsAskDue(days: Days, st: Settings | null, tk: DayKey, near: LikeNear): boolean {
  if (!st || !lastsAskFor(st)) return false;
  if (diffDays(tk, st.start) < LIKE_FIRST) return false;
  if (slipNear(days, tk) || tipQuiet(days, st, near)) return false;
  if (askedToday(st, tk) || litToday(days, st, tk)) return false;
  return true;
}

/** the question opened: kept, so it never comes again, and no other ask rides on today */
export const lastsShown = (st: Settings, tk: DayKey, now = Date.now()): Change => ({
  st: changeSettings(st, (s) => void (s.lastsAt = tk), now),
});

/** the answer, kept with setup's answers (where obHours reads it), so Time given back and Miles fill in */
export const lastsAnswer = (st: Settings, id: string, tk: DayKey, now = Date.now()): Change => ({
  st: changeSettings(
    st,
    (s) => {
      s.lastsAt = tk;
      if (s.onb) s.onb = { ...s.onb, a: { ...s.onb.a, mins: id } };
    },
    now,
  ),
});

/** the question and its answers, in this person's habit's words (setup's own page) */
export const lastsPage = (st: Settings) => obMinsPage(obHabit(answers(st) || {}, st));
