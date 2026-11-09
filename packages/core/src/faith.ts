/* God in the lessons, for those who choose it (the owner, November 2, 2026: deep, by choice, from the owner's own faith as a
   Latter-day Saint, with a Bible-only version for other Christians and a plain one for another faith). The setup asks "Does
   faith play a part in this for you?"; a Yes or a Somewhat then asks which faith, and Settings can change both later. No
   leaves the God lessons out (lessons.ts faithOut). Every care tool is there for everyone; Yes or Somewhat adds one more
   move to the SOS ride, It is written (written.ts; the owner, November 8, 2026).

   The voice a God lesson speaks in: 'lds' (Heavenly Father, Jesus Christ, the Book of Mormon and the Bible, the bishop, the
   sacrament, the Church's recovery meetings), 'christian' (the same, with the Bible only), 'plain' (God, no Scripture).
   Someone who answered before this question existed, or skipped it, hears the plain voice until they choose.

   Nothing is imported here, so legacy/core.js can read it too. */

export type Creed = 'lds' | 'christian' | 'other';
export type FaithVoice = 'lds' | 'christian' | 'plain';

/** the setup's second faith question: [value, words, icon] */
export const OB_CREED: [Creed, string, string][] = [
  ['lds', 'Latter-day Saint', 'star'],
  ['christian', 'Another Christian faith', 'sparkle'],
  ['other', 'Another faith', 'wind'],
];

type WithOnb = { onb?: { a?: { faith?: string; creed?: string } } | null } | null | undefined;
/** the voice the God lessons speak in for this person, or null when they said No to faith */
export function faithVoice(st: WithOnb): FaithVoice | null {
  const a = (st && st.onb && st.onb.a) || {};
  if (a.faith === 'no') return null;
  if (a.faith === 'big' || a.faith === 'some') return a.creed === 'lds' ? 'lds' : a.creed === 'christian' ? 'christian' : 'plain';
  return 'plain';
}
/** a kept creed answer, when it is one of the three */
export const normCreed = (v: unknown): Creed | null => (OB_CREED.some((x) => x[0] === v) ? (v as Creed) : null);
