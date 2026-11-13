/* A person quitting drinking or gambling is never shown a porn study or "using pornography" (the review of November 12, 2026). */
import { describe, expect, it } from 'vitest';

import { habitSay } from '../src/habit';
import { OB_BPS } from '../src/legacy/core.js';
import { walkCoach } from '../src/walk';

describe('another habit does not see porn words', () => {
  for (const habit of ['alcohol', 'gambling', 'other'] as const) {
    it(habit + ': the trail’s first "Why this works" and the five questions', () => {
      expect(walkCoach('open', habit).why).not.toMatch(/porn/i);
      expect(walkCoach('open', habit).src.length).toBeGreaterThan(0);
      for (const q of OB_BPS as string[]) expect(habitSay(q, habit)).not.toMatch(/porn/i);
    });
  }
  it('porn keeps its own study', () => {
    expect(walkCoach('open', 'porn').why).toMatch(/porn/);
  });
});
