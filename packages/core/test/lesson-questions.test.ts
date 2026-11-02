/* The lessons' questions, rewritten to make a person think (lesson-questions.ts; the owner, November 2, 2026). Every question on
   a lesson outside the faith lessons has a rewrite; each fits the screen, speaks the app's words, never says "Good guess" or
   "Not quite", and where a best answer is kept, it is not simply the longest one. */
import { describe, expect, it } from 'vitest';
import * as core from '../src/index';

const MAX = { question: 125, answer: 62, comment: 92 };
const CONTRACTION = /\b\w+(?:n['’]t|['’](?:re|ve|ll|d|m))\b|\b(?:it|that|there|here|what|who|he|she|let)['’]s\b/i;
const SCOLD = /\b(good guess|not quite|correct|wrong answer)\b|^(right|wrong)[.!]/i;
const all = Object.entries(core.QUESTIONS).flatMap(([id, qs]) => Object.entries(qs).map(([ci, q]) => ({ L: core.lessonById(id)!, ci: Number(ci), q })));
/* a turned lesson writes its questions this way from the start (lesson-turns.ts), and they are held to the same rules */
const turned = core.LESSONS.filter((L) => L.v === 3).flatMap((L) =>
  L.cards.flatMap((c, ci) => (c.k === 'choose' ? [{ L, ci, q: core.questionOf(L, ci, c, core.cardBeat(L, ci)) }] : [])),
);

describe('the rewritten questions', () => {
  it('every question outside the faith lessons has one', () => {
    core.LESSONS.filter((L) => !L.f && L.v !== 3).forEach((L) =>
      L.cards.forEach((c, i) => {
        if (c.k === 'choose') expect(core.QUESTIONS[L.id]?.[i], `${L.id} card ${i}`).toBeTruthy();
      }),
    );
  });
  it('each sits on a question card of a real lesson', () => {
    all.forEach(({ L, ci }) => {
      expect(L).toBeTruthy();
      expect(L.cards[ci]?.k).toBe('choose');
    });
  });
  it('fits the screen: two to four answers, a comment for each, and the limits', () => {
    [...all, ...turned].forEach(({ L, ci, q }) => {
      const at = `${L.id} card ${ci}: `;
      expect(q.o.length, at).toBeGreaterThanOrEqual(2);
      expect(q.o.length, at).toBeLessThanOrEqual(4);
      expect(q.c.length, at).toBe(q.o.length);
      expect(q.h.length, at + q.h).toBeLessThanOrEqual(MAX.question);
      q.o.forEach((o) => expect(o.length, at + o).toBeLessThanOrEqual(MAX.answer));
      q.c.forEach((c) => expect(c.length, at + c).toBeLessThanOrEqual(MAX.comment));
      if (q.a != null) {
        expect(Number.isInteger(q.a) && q.a >= 0 && q.a < q.o.length, at + 'a best answer that is there').toBe(true);
      }
    });
  });
  it('speaks plainly and never scolds', () => {
    [...all, ...turned].forEach(({ L, ci, q }) =>
      [q.h, ...q.o, ...q.c].forEach((w) => {
        expect(w, `${L.id} card ${ci}`).not.toMatch(CONTRACTION);
        expect(w, `${L.id} card ${ci}`).not.toMatch(SCOLD);
      }),
    );
  });
  it('a kept best answer is not simply the longest one', () => {
    const graded = all.filter(({ q }) => q.a != null);
    const longest = graded.filter(({ q }) => q.o[q.a!].length === Math.max(...q.o.map((o) => o.length)));
    expect(longest.length).toBeLessThanOrEqual(Math.ceil(graded.length / 3));
  });
  it('the lesson shows the rewrite, and a card without one keeps its own words', () => {
    const { L, ci, q } = all[0];
    expect(core.questionOf(L, ci, L.cards[ci], core.cardBeat(L, ci))).toMatchObject({ h: q.h, rewritten: true });
    const F = core.LESSONS.find((x) => x.f && x.cards.some((c) => c.k === 'choose'))!;
    const fi = F.cards.findIndex((c) => c.k === 'choose');
    expect(core.questionOf(F, fi, F.cards[fi], core.cardBeat(F, fi)).rewritten).toBe(false);
  });
});
