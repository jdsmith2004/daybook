/* The breathing figure's clock: a settle first, then the pattern's steps, round after round. */
import { expect, it } from 'vitest';
import * as core from '../src/index';

it('the sigh is two breaths in and a long one out, twelve seconds a round', () => {
  expect(core.fieldRound('sigh')).toBe(12);
  expect(core.FIELD_PATTERNS.sigh.steps.map((s) => s[0])).toEqual(['in1', 'in2', 'out']);
});

it('it settles first, then walks the steps with their words and the way the air goes', () => {
  const at = (s: number) => core.fieldAt('sigh', s);
  expect(at(0)).toMatchObject({ settle: true, words: 'Get settled', by: null, done: 0 });
  expect(at(4.99).settle).toBe(true);
  expect(at(5)).toMatchObject({ settle: false, round: 0, step: 0, kind: 'in1', words: 'Breathe in', by: 'nose' });
  expect(at(8.5)).toMatchObject({ step: 1, kind: 'in2', words: 'A little more', by: 'nose' });
  expect(at(9.5)).toMatchObject({ step: 2, kind: 'out', words: 'Let it out slowly', by: 'mouth', at: 0, dur: 7.5 });
  expect(at(16.99)).toMatchObject({ round: 0, kind: 'out', done: 0 });
  expect(at(17)).toMatchObject({ round: 1, step: 0, kind: 'in1', done: 1 });
  expect(at(5 + 36).done).toBe(3);
});

it('with no settle it starts on the first breath, and a time before the start is the start', () => {
  expect(core.fieldAt('sigh', 0, 0)).toMatchObject({ settle: false, kind: 'in1' });
  expect(core.fieldAt('sigh', -3)).toMatchObject({ settle: true, at: 0 });
});

it('the sigh is first, the switch goes round all four, and an unknown saved choice is the sigh', () => {
  expect(core.FIELD_ORDER[0]).toBe('sigh');
  expect([...core.FIELD_ORDER].sort()).toEqual(Object.keys(core.FIELD_PATTERNS).sort());
  let id = core.FIELD_FIRST;
  const seen = [];
  for (let i = 0; i < 4; i++) (seen.push(id), (id = core.fieldNext(id)));
  expect(seen).toEqual(['sigh', 'long', 'box', 'four']);
  expect(id).toBe('sigh');
  expect(core.fieldId('box')).toBe('box');
  expect(core.fieldId('calm')).toBe('sigh');
  expect(core.fieldId(undefined)).toBe('sigh');
});

it('the other patterns keep their counts, and a hold has words and no nose or lips', () => {
  expect(core.fieldRound('long')).toBe(10);
  expect(core.fieldRound('box')).toBe(16);
  expect(core.fieldRound('four')).toBe(19);
  expect(core.fieldAt('box', 5, 0)).toMatchObject({ kind: 'hold', words: 'Hold', by: null, step: 1 });
  expect(core.fieldAt('box', 13, 0)).toMatchObject({ kind: 'hold', step: 3, done: 0 });
  expect(core.fieldAt('four', 11.5, 0)).toMatchObject({ kind: 'out', by: 'mouth', at: 0.5, dur: 8 });
  expect(core.fieldAt('long', 30, 0).done).toBe(3);
});

it('the breath by touch has taps for every pattern, and none on a hold', () => {
  for (const p of Object.values(core.FIELD_PATTERNS)) {
    const taps = core.breathTouch(p.steps);
    p.steps.forEach(([k], i) => (k === 'hold' ? expect(taps[i]).toEqual([]) : expect(taps[i].length).toBeGreaterThan(1)));
  }
});

it('every step of every pattern has its words', () => {
  for (const p of Object.values(core.FIELD_PATTERNS) as core.FieldPattern[]) for (const [k] of p.steps) expect(p.words[k]).toBeTruthy();
});
