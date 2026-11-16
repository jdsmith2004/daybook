/* The breathing figure's clock: a settle first, then the pattern's steps, round after round. */
import { expect, it } from 'vitest';
import * as core from '../src/index';

it('the sigh is two breaths in and a long one out, nine seconds a round', () => {
  expect(core.fieldRound('sigh')).toBe(9);
  expect(core.FIELD_PATTERNS.sigh.steps.map((s) => s[0])).toEqual(['in1', 'in2', 'out']);
});

it('it settles first, then walks the steps with their words and the way the air goes', () => {
  const at = (s: number) => core.fieldAt('sigh', s);
  expect(at(0)).toMatchObject({ settle: true, words: 'Get settled', by: null, done: 0 });
  expect(at(4.99).settle).toBe(true);
  expect(at(5)).toMatchObject({ settle: false, round: 0, step: 0, kind: 'in1', words: 'Breathe in', by: 'nose' });
  expect(at(7.5)).toMatchObject({ step: 1, kind: 'in2', words: 'A little more', by: 'nose' });
  expect(at(8)).toMatchObject({ step: 2, kind: 'out', words: 'Let it out slowly', by: 'mouth', at: 0, dur: 6 });
  expect(at(13.99)).toMatchObject({ round: 0, kind: 'out', done: 0 });
  expect(at(14)).toMatchObject({ round: 1, step: 0, kind: 'in1', done: 1 });
  expect(at(5 + 27).done).toBe(3);
});

it('with no settle it starts on the first breath, and a time before the start is the start', () => {
  expect(core.fieldAt('sigh', 0, 0)).toMatchObject({ settle: false, kind: 'in1' });
  expect(core.fieldAt('sigh', -3)).toMatchObject({ settle: true, at: 0 });
});

it('every step of every pattern has its words', () => {
  for (const p of Object.values(core.FIELD_PATTERNS)) for (const [k] of p.steps) expect(p.words[k]).toBeTruthy();
});
