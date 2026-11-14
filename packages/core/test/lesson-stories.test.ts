/* Lessons told as a story (lesson-stories.ts) keep the standard in docs/lessons.md: a story first, a line that sticks, one thing to do
   today, and a question only the person can answer. These catch what went wrong in November 2026, when the lessons became obvious
   flashcards (the owner, November 14, 2026). */
import { describe, expect, it } from 'vitest';
import * as core from '../src/index';
import { STORIES, type Story } from '../src/lesson-stories';

/* a clock time or a bed puts one hour on everyone, and many people struggle in the day (the owner, November 14, 2026) */
const CLOCK = /\b\d{1,2}(:\d\d)?\s?(a\.m\.|p\.m\.|am|pm)\b|\bmidnight\b|\bin bed\b/i;
const SWEAR = /\b(hell|damn|crap|sucks?|screw(ed)?|pissed|freaking)\b/i;
/* the words of a story a person reads, with the lesson's scope left as it is */
const wordsOf = (S: Story): string[] => [
  S.title,
  S.key,
  ...S.tell.flatMap((t) => (t.k === 'guess' ? [t.h, ...t.o.flat()] : t.k === 'flip' ? [t.think, t.see] : [t.h, t.p || ''])),
  S.today.h,
  ...(S.today.l || []),
  S.you.h,
  ...S.you.o.flat(),
];
const words = (s: string) => new Set(s.toLowerCase().match(/[a-z]+/g) || []);

describe.each(Object.values(STORIES).map((S) => [S.id, S] as const))('%s', (id, S) => {
  const L = core.lessonById(id)!;

  it('replaces its old self in place', () => {
    expect(L.form).toBe(S.form);
    expect(L.cards.length).toBeGreaterThan(5);
  });

  it('tells the story in Short, and more of it in Long', () => {
    const short = core.lessonCards(L, 'q').filter((c) => c.e === 'hook' || c.e === 'proof');
    const long = core.lessonCards(L, 'f').filter((c) => c.e === 'hook' || c.e === 'proof');
    expect(short.length, 'Short tells the story in at least four cards').toBeGreaterThanOrEqual(4);
    expect(long.length, 'Long goes deeper than Short').toBeGreaterThan(short.length);
  });

  it('ends on a question only the person can answer: no right answer, no verdict', () => {
    const last = L.cards[L.cards.length - 1];
    expect(last.k).toBe('choose');
    expect(last.a, 'the last question is not graded').toBeUndefined();
    S.you.o.forEach(([, say]) => expect(/^(yes|right|correct|good)\b/i.test(say), 'a verdict: ' + say).toBe(false));
  });

  it('asks a guess only about the story, with a surprise for an answer', () => {
    S.tell.forEach((t) => {
      if (t.k !== 'guess') return;
      expect(t.a, t.h).toBeGreaterThanOrEqual(0);
      expect(t.o.length, t.h).toBeGreaterThanOrEqual(2);
    });
  });

  it('turns a thought over only when the back says something new', () => {
    S.tell.forEach((t) => {
      if (t.k !== 'flip') return;
      const a = words(t.think);
      const shared = [...words(t.see)].filter((w) => a.has(w) && w.length > 3).length;
      expect(shared / Math.max(1, a.size), 'the back restates the front: ' + t.see).toBeLessThan(0.5);
    });
  });

  it('puts no clock time or bed on everyone, and never swears', () => {
    wordsOf(S).forEach((w) => {
      expect(CLOCK.test(w), 'a clock time or a bed: ' + w).toBe(false);
      expect(SWEAR.test(w), 'a swear word: ' + w).toBe(false);
    });
  });

  it('keeps the line that sticks short enough to repeat', () => {
    expect(S.key.split(/\s+/).length, S.key).toBeLessThanOrEqual(20);
  });
});
