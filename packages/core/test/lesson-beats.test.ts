/* The short beats (lesson-beats.ts): every card has one, and each is short enough to be one thought and follows the words rules. */
import { describe, expect, it } from 'vitest';
import { LESSONS } from '../src/legacy/core.js';
import { cardArt, cardBeat, cardLook, cardNumber, lessonBeats } from '../src/lesson-beats';
import type { Lesson } from '../src/lessons';

const MAX = { head: 64, question: 125, say: 72, p: 110, line: 46, comment: 92, answer: 62, key: 110, rvH: 72 };
const CONTRACTION = /\b\w+(?:n['’]t|['’](?:re|ve|ll|d|m))\b|\b(?:it|that|there|here|what|who|he|she|let)['’]s\b/i;
/* the usual tells of machine writing: a reveal, a stock phrase, a dash */
const TELLS =
  /[—–;]|\b(?:here is the thing|the truth is|the real|truly|deeply|simply|actually|journey|powerful|profound|remember:|let that sink in|you have got this|you got this|and that is okay|that is the point|that is the whole|game[- ]changer|unlock|embrace|gentle reminder|at the end of the day)\b/i;

function wordsOf(L: Lesson): string[] {
  const b = lessonBeats(L);
  if (!b) return [];
  const out: string[] = [b.key];
  b.cards.forEach((x) => {
    [x.h, x.say, x.p, x.rv?.h, x.rv?.p].forEach((w) => w && out.push(w));
    (x.l || []).concat(x.c || [], x.o || []).forEach((w) => out.push(w));
  });
  if (b.rc) out.push(...(b.rc.q ? [b.rc.q] : []), ...(b.rc.o || []), ...b.rc.c);
  return out;
}

describe('lesson beats', () => {
  (LESSONS as Lesson[]).forEach((L) =>
    it(L.id, () => {
      const b = lessonBeats(L);
      expect(b, 'no beats yet').toBeTruthy();
      expect(b!.cards.length, 'one beat per card').toBe(L.cards.length);
      expect(b!.key.length, 'key: ' + b!.key).toBeLessThanOrEqual(MAX.key);
      L.cards.forEach((card, ci) => {
        const x = cardBeat(L, ci);
        const look = cardLook(card, x);
        const at = 'card ' + ci + ' (' + look + '): ';
        expect(x.h, at + 'needs h').toBeTruthy();
        const long = (w: string | undefined, n: number) => w && expect(w.length, at + w).toBeLessThanOrEqual(n);
        if (look === 'question') {
          long(x.h, MAX.question);
          expect(x.c?.length, at + 'a comment for each answer').toBe(card.c!.length);
          x.c!.forEach((w) => long(w, MAX.comment));
          if (x.o) expect(x.o.length, at + 'one short answer for each').toBe(card.c!.length);
          card.c!.forEach((o, j) => long((x.o && x.o[j]) || o[0], MAX.answer));
          expect(x.say || x.p || x.l, at + 'a question has only h, c, o').toBeFalsy();
        } else if (look === 'guess') {
          long(x.h, MAX.question);
          expect(x.rv, at + 'needs rv').toBeTruthy();
          long(x.rv!.h, MAX.rvH);
          long(x.rv!.p, MAX.p);
        } else {
          long(x.h, look === 'number' ? MAX.rvH : MAX.head);
          long(x.say, MAX.say);
          long(x.p, MAX.p);
          (x.l || []).forEach((w) => long(w, MAX.line));
          expect((x.l || []).length, at + 'three lines at most').toBeLessThanOrEqual(3);
          expect(x.say && x.p, at + 'say or p, not both').toBeFalsy();
          expect(x.say && x.l, at + 'say or l, not both').toBeFalsy();
          if (look === 'number') {
            expect(cardNumber(card, x), at + 'needs a number').toBeTruthy();
            expect(x.say || x.l, at + 'a number card has h and p').toBeFalsy();
            /* the number comes from the card, never from nowhere */
            if (x.n) expect(JSON.stringify(card).includes(x.n), at + 'the number is in the card: ' + x.n).toBe(true);
          }
          if (cardArt(card)) expect(x.say, at + 'a card with a picture has no bubble: no room').toBeFalsy();
        }
      });
      if (L.rc) {
        expect(b!.rc?.c.length, 'a comment for each recall answer').toBe(L.rc.c.length);
        b!.rc!.c.forEach((w) => expect(w.length, w).toBeLessThanOrEqual(MAX.comment));
        if (b!.rc!.q) expect(b!.rc!.q.length).toBeLessThanOrEqual(MAX.question);
        L.rc.c.forEach((o, j) => expect(((b!.rc!.o && b!.rc!.o[j]) || o).length, o).toBeLessThanOrEqual(MAX.answer));
      }
      for (const w of wordsOf(L)) {
        expect(CONTRACTION.test(w), 'a contraction: ' + w).toBe(false);
        expect(TELLS.test(w), 'a machine tell: ' + w).toBe(false);
      }
    }),
  );
});
