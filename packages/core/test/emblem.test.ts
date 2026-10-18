/* The flame in its own sky, for the top of Today (emblem.ts emblemScene). */
import { describe, expect, it } from 'vitest';
import { emblemScene } from '../src/emblem';

describe('the flame in its own sky', () => {
  it('every level has a sky, and the round frame is softened away', () => {
    for (let l = 1; l <= 60; l++) {
      const sc = emblemScene(l);
      expect(sc.sky.every((x) => /^#[0-9A-Fa-f]{6}$/.test(x))).toBe(true);
      expect(sc.at[0]).toBeLessThan(sc.at[1]);
      expect(sc.at[1]).toBeLessThan(sc.at[2]);
      expect(sc.xml).not.toMatch(/clip-path="url\(#em\d+cp\)"/);
      expect(sc.xml).not.toMatch(/r="57\.2" fill="none"/);
    }
  });
  it('a night sky has stars and light words; a day sky has dark words', () => {
    const night = emblemScene(17);
    expect(night.stars).toBe(true);
    expect(night.ink).toBe('light');
    expect(night.xml).toMatch(/mask="url\(#em\d+fm\)"/);
    const day = emblemScene(40);
    expect(day.stars).toBe(false);
    expect(day.ink).toBe('dark');
    expect(day.ground).toBe('#3DAA84');
    /* the full suns shine in a clear day sky */
    expect(emblemScene(46).sky).toEqual(['#3FA2FF', '#86CCFF', '#CFEBFF']);
  });
});
