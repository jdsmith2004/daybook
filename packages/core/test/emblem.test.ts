/* The flame in its own sky, for the top of Today (emblem.ts emblemScene). */
import { describe, expect, it } from 'vitest';
import { emblemLayers, emblemScene, emblemXml } from '../src/emblem';

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

describe('the flame in layers, so only the figure moves', () => {
  it('every level splits into the sky, the glow, the figure and what is in front, which add up to the whole drawing', () => {
    for (let l = 1; l <= 120; l++) {
      const soft = l <= 60;
      const L = emblemLayers(soft ? l : l - 60, soft)!;
      expect(L).toBeTruthy();
      const whole = soft ? emblemScene(l).xml : emblemXml(l - 60);
      const inner = (x: string) => x.replace(/\bem\d+[a-d]?/g, 'emX').replace(/^.*?<\/defs>/s, '');
      const parts = [L.back, L.glow, L.fig, L.front].map(inner);
      /* every shape of the drawing is in exactly one layer */
      const shapes = (x: string) => (x.match(/<(path|circle|ellipse|rect|polygon)\b[^>]*>/g) || []).length;
      expect(parts.reduce((n, p) => n + shapes(p), 0)).toBe(shapes(inner(whole)));
      [L.back, L.glow, L.fig, L.front].forEach((x) => {
        if (!x) return;
        expect(x.startsWith('<svg')).toBe(true);
        expect(x.endsWith('</svg>')).toBe(true);
        expect((x.match(/<g\b[^>]*[^/]>|<g>/g) || []).length).toBe((x.match(/<\/g>/g) || []).length);
        expect(x).not.toMatch(/class=/);
      });
      expect(L.fig).toMatch(/<g>/);
      expect(L.at.x).toBeGreaterThan(0.2);
      expect(L.at.y).toBeGreaterThan(0.2);
    }
  });
});
