/* The God lessons (lesson-turns-god-a.ts, lesson-turns-god-b.ts): one per step, each read in three voices. Every voice keeps the
   lesson limits and words rules, ends in a short prayer, cites only its own sources, and says only what fits that faith. */
import { describe, expect, it } from 'vitest';
import * as core from '../src/index';
import type { FaithVoice, Turn } from '../src/index';

const MAX = { head: 64, say: 72, question: 125, answer: 62, comment: 92, think: 64, see: 110, p: 110, line: 46, key: 110, close: 110, num: 72 };
const CONTRACTION = /\b\w+(?:n['’]t|['’](?:re|ve|ll|d|m))\b|\b(?:it|that|there|here|what|who|he|she|let)['’]s\b/i;
const TELLS =
  /[—–;]|\b(?:here is the thing|the truth is|the real|truly|deeply|simply|actually|journey|powerful|profound|remember:|let that sink in|you have got this|you got this|and that is okay|that is the point|that is the whole|game[- ]changer|unlock|embrace|gentle reminder|at the end of the day|pray harder|addicts?|addiction|(?<!book of |waters of )mormon|lds)\b/i;
/* only the Latter-day Saint voice speaks of these */
const SAINT = /\b(?:bishop|sacrament|covenant|book of mormon|doctrine and covenants|latter-day|the church|nephi|mosiah|alma|ether|moroni)\b/i;
/* the plain voice names no scripture and no church */
const SCRIPTURE =
  /\b(?:jesus|christ|savior|scripture|bible|genesis|corinthians|psalm|james 5|ezekiel|hebrews|matthew|luke|john 6|daniel|zechariah|lamentations|paul|adam|david)\b/i;

const VOICES: FaithVoice[] = ['lds', 'christian', 'plain'];
const ids = Object.keys(core.GOD);

/* every word a person reads in one voice, with the limit it must keep */
function words(T: Turn): [string, number][] {
  const w: [string, number][] = [
    [T.title, MAX.head],
    [T.ask, MAX.question],
    [T.key, MAX.key],
    [T.np, MAX.question],
    [T.hook.h, MAX.head],
    [T.hook.say, MAX.say],
    [T.flip.think, MAX.think],
    [T.flip.see, MAX.see],
    [T.move.h, MAX.head],
    [T.check.h, MAX.question],
    [T.close || '', MAX.close],
  ];
  if (T.ask1)
    w.push(
      [T.ask1.h, MAX.question],
      ...T.ask1.o.flatMap(([a, c]): [string, number][] => [
        [a, MAX.answer],
        [c, MAX.comment],
      ]),
    );
  T.check.o.forEach(([a, c]) => w.push([a, MAX.answer], [c, MAX.comment]));
  T.move.l.forEach((l) => w.push([l, MAX.line]));
  T.deep.forEach((d) => w.push([d.h, d.n ? MAX.num : MAX.head], [d.p || '', MAX.p]));
  if (T.mine) w.push([T.mine.h, MAX.head]);
  const long = [T.hook.more, T.flip.more, T.move.more, T.scope, ...T.deep.map((d) => d.more)];
  long.forEach((s) => s && w.push([s, Infinity]));
  return w;
}

describe('God lessons', () => {
  it('are twelve, one for each step', () => {
    expect(ids).toEqual(core.PATH_STEPS.map((s) => s.god));
    ids.forEach((id) => expect(core.lessonById(id)?.v, id).toBe(3));
  });
  VOICES.forEach((v) =>
    describe('in the ' + v + ' voice', () => {
      it('keep every limit and the words rules', () => {
        ids.forEach((id) =>
          words(core.turnIn(core.GOD[id], v)).forEach(([s, max]) => {
            expect(s.length, id + ': ' + s).toBeLessThanOrEqual(max);
            expect(s, id).not.toMatch(CONTRACTION);
            expect(s, id).not.toMatch(TELLS);
          }),
        );
      });
      it('end in a short prayer to the God that voice knows', () => {
        ids.forEach((id) => expect(core.turnIn(core.GOD[id], v).close, id).toMatch(v === 'plain' ? /^God, / : /^Father, /));
      });
      it('cite only their own sources, and every fact points at one', () => {
        ids.forEach((id) => {
          const T = core.turnIn(core.GOD[id], v);
          T.deep.forEach((d) => (d.fact?.i || []).forEach((i) => expect(T.src[i], id + ' source ' + i).toBeTruthy()));
          T.deep.forEach((d) => d.back && expect(core.lessonById(d.back), id + ' back').toBeTruthy());
        });
      });
      it('have one best answer to the check, not simply the longest', () => {
        ids.forEach((id) => {
          const o = core.turnIn(core.GOD[id], v).check.o;
          const a = core.turnIn(core.GOD[id], v).check.a!;
          expect(o[a], id).toBeTruthy();
          expect(
            o.every((x, i) => i === a || x[0].length < o[a][0].length),
            id,
          ).toBe(false);
        });
      });
      if (v !== 'lds')
        it('say only what fits that faith', () =>
          ids.forEach((id) =>
            words(core.turnIn(core.GOD[id], v)).forEach(([s]) => {
              expect(s, id).not.toMatch(SAINT);
              if (v === 'plain') expect(s, id).not.toMatch(SCRIPTURE);
            }),
          ));
    }),
  );
  it('share a title, a question and a key that fit all three voices', () => {
    ids.forEach((id) => {
      const T = core.GOD[id];
      [T.title, T.ask, T.key, T.np].forEach((s) => {
        expect(s, id).not.toMatch(SAINT);
        expect(s, id).not.toMatch(SCRIPTURE);
        expect(s, id).not.toMatch(/heavenly father/i);
      });
    });
  });
});
