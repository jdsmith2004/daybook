/* "Do you like Daybook so far?": one question, asked once, at the end of a new person's setup, right under the celebration
   (the owner, October 23, 2026). A Yes opens the phone's own rating sheet (on iPhone and Android; the web has none). A
   "Not yet" thanks them and offers to say what would make it better. The answer is kept in settings, so it is never asked
   again, and it is never asked on a walk-through, so someone who finished setup before this question existed never sees
   it. Never after a slip or an SOS: a hard moment is not the time to ask for anything. No count is sent. Checked by
   test/like.test.ts. */
import { changeSettings, type Change } from './actions';
import { eventsOf } from './legacy/core.js';
import type { DayKey, Days, Settings } from './types';

export type LikeAnswer = 'yes' | 'no';

/** hours after an SOS before the question can come */
export const LIKE_QUIET = 3;

/** the moment just now: the time, and when an SOS was last open on this device (core urLastAt) */
export interface LikeNear {
  now: number;
  sos: number | null;
}

/** whether it was answered already */
export const likeAnsweredAlready = (st: Settings | null): boolean => !!(st && st.likeAsk && (st.likeAsk.a === 'yes' || st.likeAsk.a === 'no'));

/** whether the end of the setup asks "Do you like Daybook so far?". redo: a walk-through, which never asks. */
export function likeAskDue(days: Days, st: Settings | null, redo: boolean, near: LikeNear): boolean {
  if (redo || !st || likeAnsweredAlready(st)) return false;
  if (near.sos != null && near.sos > near.now - LIKE_QUIET * 3600_000) return false;
  /* a slip, or an urge logged through SOS, anywhere in the log */
  return !eventsOf(days).some((e) => e.outcome === 'slipped' || e.st != null || e.m != null || (e.tr && e.tr.length > 0));
}

/** the answer, kept: the question never comes again */
export const likeAnswer = (st: Settings, a: LikeAnswer, tk: DayKey, now = Date.now()): Change => ({
  st: changeSettings(st, (s) => void (s.likeAsk = { a, d: tk }), now),
});

/** the words, in one place */
export const LIKE_WORDS = {
  h: 'You finished setup!',
  sub: 'Your plan is ready, and your flame is lit.',
  q: 'Do you like Daybook so far?',
  yes: 'Yes, I like it',
  no: 'Not yet',
  /** after a Yes, said on Today */
  thanks: 'Thank you. That means a lot, and it helps more people find Daybook.',
  /** after "Not yet" */
  noH: 'Thank you for being honest.',
  noLine: 'What would make Daybook better for you? A few words go straight to the person who builds it.',
  tell: 'Tell us what would help',
  go: 'Go to Today',
};
