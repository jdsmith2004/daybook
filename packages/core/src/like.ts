/* "Do you like Daybook so far?" The app asks until the person says they enjoy it, and this is never dropped (the owner, November
   15, 2026: "make a note that's extremely important it keeps asking them until they say they're enjoying the app that cannot be
   dropped"). It was asked once, at the end of setup, until the setup rebuild of November 12, 2026 lost it by accident.

   When: at a good moment, riding on it (the full-screen moment of a new level, a new form of the flame or a badge, which is how a
   lesson finished, an urge ridden out and a run of nights land; and the first week looked back on). From LIKE_FIRST days after
   the start, so the person has seen Daybook help, then again LIKE_EVERY days after each time it was asked, until the answer is
   Yes. Never in the hours after an SOS or a slip, never on the day of a slip or the day after, never on a day the flame was lit in
   full (that morning is the ignite's), and never on a day another ask already came (the tip card or a tip on a moment, or the
   account card answered), so one open never carries two asks.

   What: Yes opens the phone's own rating sheet (askStoreReview in the app; the web has none). "Not yet" opens the feedback page, so
   both answers lead somewhere useful and the question reads as how the person feels, not as a gate in front of a review (App Store
   Guideline 5.6.1). Only a Yes ends it. No count is sent. Checked by test/like.test.ts, and test/like-caller.test.ts fails when
   nothing in the app calls it. */
import { changeSettings, type Change } from './actions';
import { litToday } from './ignite';
import { diffDays, isKey } from './legacy/core.js';
import { slipNear } from './lessons';
import { tipQuiet } from './support';
import type { DayKey, Days, Settings } from './types';

export type LikeAnswer = 'yes' | 'no';

/** days from the start before the first ask: the first day is setup's, with its own account ask */
export const LIKE_FIRST = 2;
/** days after an ask (answered "Not yet", or left) before it comes again */
export const LIKE_EVERY = 4;
/** hours after an SOS or a slip before the question can come (support.ts tipQuiet, the same quiet hours as every ask) */
export const LIKE_QUIET = 3;

/** the moment just now: the time, and when an SOS or another care tool was last open on this device (core careLastAt) */
export interface LikeNear {
  now: number;
  sos: number | null;
}

/** whether the person said Yes: the only answer that ends the question */
export const likeSaidYes = (st: Settings | null): boolean => !!(st && st.likeAsk && st.likeAsk.a === 'yes');
/** kept for older callers: answered Yes */
export const likeAnsweredAlready = likeSaidYes;

/** the last day the question came: when it was shown, or, for a record from before that was kept, when it was answered */
export function likeLast(st: Settings): DayKey | null {
  const at = isKey(st.likeAt) ? (st.likeAt as DayKey) : null;
  const d = st.likeAsk && isKey(st.likeAsk.d) ? st.likeAsk.d : null;
  return at && d ? (at > d ? at : d) : at || d;
}

/** another ask came today: the tip card or a tip on a moment, or the account card was answered */
const askedToday = (st: Settings, tk: DayKey): boolean => st.tipAsk === tk || st.tipMo === tk || st.acctNo === tk || st.acctNudge === tk;

/** whether this good moment asks "Do you like Daybook so far?" */
export function likeAskDue(days: Days, st: Settings | null, tk: DayKey, near: LikeNear): boolean {
  if (!st || likeSaidYes(st)) return false;
  if (diffDays(tk, st.start) < LIKE_FIRST) return false;
  const last = likeLast(st);
  if (last && diffDays(tk, last) < LIKE_EVERY) return false;
  if (slipNear(days, tk) || tipQuiet(days, st, near)) return false;
  if (askedToday(st, tk) || litToday(days, st, tk)) return false;
  return true;
}

/** the question came today: it waits LIKE_EVERY days before it comes again, and no other ask rides on today */
export const likeShown = (st: Settings, tk: DayKey, now = Date.now()): Change => ({
  st: changeSettings(st, (s) => void (s.likeAt = tk), now),
});

/** the answer, kept. Yes ends the question for good; "Not yet" waits LIKE_EVERY days, and it comes again at a later good moment. */
export const likeAnswer = (st: Settings, a: LikeAnswer, tk: DayKey, now = Date.now()): Change => ({
  st: changeSettings(
    st,
    (s) => {
      s.likeAsk = { a, d: tk };
      s.likeAt = tk;
    },
    now,
  ),
});

/** the words, in one place */
export const LIKE_WORDS = {
  q: 'Do you like Daybook so far?',
  yes: 'Yes, I like it',
  no: 'Not yet',
  /** after a Yes, said as the moment closes */
  thanks: 'Thank you. That means a lot, and it helps more people find Daybook.',
  /** after "Not yet", said as the feedback page opens */
  noThanks: 'Thank you for being honest. What would make Daybook better for you?',
  a11y: 'Do you like Daybook so far? Yes opens a short rating. Not yet opens a page to say what would help.',
};
