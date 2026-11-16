import { describe, expect, it } from 'vitest';

import { SQZ_HOLD, SQZ_LAST_REST, SQZ_READY, SQZ_REST, SQZ_SIT, SQZ_STAND, SQZ_TOTAL, squeezeAt, sqzParts } from '../src/squeeze';

describe('squeeze', () => {
  it('gets ready, then holds and lets go four times, about a minute in all', () => {
    expect(squeezeAt(0).kind).toBe('ready');
    expect(squeezeAt(SQZ_READY + 0.1)).toMatchObject({ kind: 'hold', i: 0, left: SQZ_HOLD, words: 'Squeeze' });
    expect(squeezeAt(SQZ_READY + SQZ_HOLD + 0.1)).toMatchObject({ kind: 'rest', i: 0, words: 'Let go' });
    const last = SQZ_READY + 4 * SQZ_HOLD + 3 * SQZ_REST;
    expect(squeezeAt(last - 0.1)).toMatchObject({ kind: 'hold', i: 3 });
    expect(squeezeAt(last + SQZ_LAST_REST - 0.1)).toMatchObject({ kind: 'rest', i: 3 });
    expect(squeezeAt(SQZ_TOTAL + 0.1).kind).toBe('done');
    expect(SQZ_TOTAL).toBeGreaterThanOrEqual(55);
    expect(SQZ_TOTAL).toBeLessThanOrEqual(70);
  });
  it('counts the last three seconds of a hold out loud', () => {
    const words = [0.5, 2, 4.5, 5.5, 6.5].map((s) => squeezeAt(SQZ_READY + s).words);
    expect(words).toEqual(['Squeeze', 'Hold it', '3', '2', '1']);
  });
  it('the words fade in from each change, never from the past', () => {
    for (let t = 0; t < SQZ_TOTAL + 2; t += 0.05) expect(squeezeAt(t).ws).toBeGreaterThanOrEqual(-1e-9);
  });
  it('has four parts for a seat and four for standing, ending on the whole body', () => {
    expect(sqzParts(true)).toBe(SQZ_SIT);
    expect(sqzParts(false)).toBe(SQZ_STAND);
    for (const p of [SQZ_SIT, SQZ_STAND]) {
      expect(p).toHaveLength(4);
      expect(p[3].head).toBe('Everything at once');
      /* plain words: no contractions */
      for (const x of p) expect(x.head + x.sub).not.toMatch(/'/);
    }
  });
});
