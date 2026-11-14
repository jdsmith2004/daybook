import { describe, expect, it } from 'vitest';

import { PATH_STEPS, stepProgress, walkOf } from '../src';

describe('stepProgress', () => {
  const ids = PATH_STEPS[0].ids;
  it('counts the lessons done in the step of the lesson just finished', () => {
    const w = walkOf(new Set([ids[0], ids[1]]));
    const p = stepProgress(w, ids[1]);
    expect(p?.name).toBe(PATH_STEPS[0].name);
    expect(p?.done).toBe(2);
    expect(p!.of).toBeGreaterThanOrEqual(ids.length - 1);
  });
  it('has nothing for a lesson off the path', () => {
    expect(stepProgress(walkOf(new Set()), 'nope')).toBeNull();
  });
});
