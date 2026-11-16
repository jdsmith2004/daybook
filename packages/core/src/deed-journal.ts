/* A deed that asks for words (steps.ts write) gets a box on its page, and what is written there goes straight into the journal
   (the owner, November 16, 2026: "it should just like have me write it in the journal or save it right to the journal ...
   Instead of just saying, 'Hey, go write this down.' Like where?"). The entry is an ordinary journal entry: no feeling named
   (JN_NO_FEEL, which the person can change like any entry), the deed's words as its question, so reading it back says which
   step it answers, and what was written. It is made on the first word, follows every change, and is taken out again when the
   box is emptied, so a box tried and left empty leaves nothing behind. Saying it, sending it or doing it stays the person's own act. */
import { jnEdit, jnRemove, jnStart, type Journal } from './journal-entries';
import { JN_NO_FEEL } from './journal-notes';
import { PATH_STEPS } from './steps';
import type { DayKey } from './types';

/** the starting words for a deed's box, or null when the deed asks for no words */
export const deedWrite = (k: number): string | null => (k >= 0 && k < PATH_STEPS.length && PATH_STEPS[k].write) || null;

/** writes a deed's words into the journal: id is the entry this box made already (null before the first word) */
export function deedJot(jn: Journal, id: string | null, d: DayKey, words: string, t: string, now = Date.now()): { jn: Journal; id: string | null } {
  if (!t.trim()) return { jn: id ? jnRemove(jn, id) : jn, id: null };
  if (id && jn[id]) return { jn: jnEdit(jn, id, { t }, now), id };
  const r = jnStart(jn, d, JN_NO_FEEL, now);
  return { jn: jnEdit(r.jn, r.id, { t, q: words }, now), id: r.id };
}
