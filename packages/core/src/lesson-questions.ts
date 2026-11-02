/* The lessons' questions, rewritten to ask what makes a person think about their own life (the owner, November 2, 2026: "not
   phishing for answers, its asking questions that provoke thought"). Six rules (docs/plan.md): ask only what they cannot
   already answer or only they can; every answer is a real 11 PM pick; the comment names what a choice costs and gives; a guess
   only with a real reveal; their own life, with "I do not know yet" always fair; on values, no right answer.

   Keyed by lesson id, then by the card's index in the lesson. `a` is the best answer when there is one; without it every answer
   is taken seriously and none is marked right. A question here replaces the card's own words and its beat (lesson-beats.ts).
   test/lesson-questions.test.ts holds them to the limits and the words rules. */
import type { Card, Lesson } from './lessons';
import type { Beat } from './lesson-beats';

export interface LessonQ {
  h: string;
  o: string[];
  c: string[];
  a?: number;
}

/* every lesson is turned now (lesson-turns.ts, November 2, 2026) and writes its questions this way from the start, so none needs a
   rewrite here; the rewrites that came before are in git history. A lesson added the old way gets its rewrite here, by card index. */
export const QUESTIONS: Record<string, Record<number, LessonQ>> = {};

/** the question a choose card asks: the rewrite when there is one, else the beat's words over the card's own */
export function questionOf(L: Lesson, ci: number, card: Card, b: Beat): LessonQ & { rewritten: boolean } {
  const q = L.v !== 3 && QUESTIONS[L.id] && QUESTIONS[L.id][ci];
  if (q) return { ...q, rewritten: true };
  /* a turned lesson's questions are written that way already (lesson-turns.ts) */
  if (L.v === 3)
    return {
      h: card.h,
      o: (card.c || []).map((x) => x[0]),
      c: (card.c || []).map((x) => x[1]),
      a: Number.isInteger(card.a) ? card.a : undefined,
      rewritten: true,
    };
  return {
    h: b.h || card.h,
    o: b.o || (card.c || []).map((x) => x[0]),
    c: b.c || (card.c || []).map((x) => x[1]),
    a: Number.isInteger(card.a) ? card.a : undefined,
    rewritten: false,
  };
}
