/* "I already do this" (the owner, November 21, 2026: "where the phone sleeps. I already do that. Like, I have my phone outside the
   room, so it keeps giving me that lesson, and it just feels stupid").

   A lesson whose whole subject is one thing a person may already do carries a have key. Its first page (the length choice) offers a
   quiet link that says so; a yes is kept in settings.learn.have, and every lesson with that key steps aside: it is not Up next, it
   waits at the end of the path open in full (like a God lesson walked past, lessons.ts passed), and it earns nothing, because it was
   not read. A lesson already finished is never touched. Nothing here changes a lesson's words; the line on the link is the player's.

   Only lessons whose subject is the thing itself carry a key. A lesson that mentions it on one card (l10, l20, l34) stays: its idea
   is something else, and its words are locked (docs/lessons.md). */
import { changeSettings } from './actions';
import type { Settings } from './types';

export type HaveKey = 'phone';
/** each thing a person can say they already do: the link on the lesson's first page, the confirm, and the lessons it moves aside */
export const HAVE: Record<HaveKey, { link: string; ids: string[] }> = {
  phone: { link: 'My phone already sleeps outside my room', ids: ['l55'] },
};
export const HAVE_KEYS = Object.keys(HAVE) as HaveKey[];
/** the have key of a lesson, or null */
export const haveOf = (id: string): HaveKey | null => HAVE_KEYS.find((k) => HAVE[k].ids.indexOf(id) >= 0) || null;
/** the person said they already do this */
export const hasHave = (st: Settings | null | undefined, k: HaveKey): boolean => !!(st && st.learn && st.learn.have && st.learn.have[k]);
/** this lesson steps aside for this person (not whether it is finished: a finished one stays where it is) */
export const haveSkips = (st: Settings | null | undefined, id: string): boolean => {
  const k = haveOf(id);
  return !!k && hasHave(st, k);
};
/** the keys said, as one string (a cache key for the walked path) */
export const haveSig = (st: Settings | null | undefined): string => HAVE_KEYS.filter((k) => hasHave(st, k)).join(',');
/** "I already do this": kept for good, a marker only (no points) */
export const lessonHave = (st: Settings, k: HaveKey, now = Date.now()): Settings =>
  hasHave(st, k)
    ? st
    : changeSettings(
        st,
        (s) => {
          (s.learn.have || (s.learn.have = {}))[k] = 1;
        },
        now,
      );
/** settings.learn.have, cleaned: known keys only, left out when empty (legacy/core.js normLearn) */
export function normHave(o: Record<string, unknown> | null | undefined): { have?: Partial<Record<HaveKey, 1>> } {
  const h = o && typeof o === 'object' ? (o.have as Record<string, unknown> | undefined) : undefined;
  const out: Partial<Record<HaveKey, 1>> = {};
  HAVE_KEYS.forEach((k) => {
    if (h && typeof h === 'object' && h[k]) out[k] = 1;
  });
  return Object.keys(out).length ? { have: out } : {};
}
