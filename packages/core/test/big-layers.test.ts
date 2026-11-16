/* The flame drawn big (big-layers.ts), shared by the app's BigFlame and the splash picture. */
import { describe, expect, it } from 'vitest';

import { BIG_MID_Y, bigFigureAt, bigLayers, LAUNCH_LEVEL, LAUNCH_W, launchFlameSvg } from '../src/big-layers';
import { emblemLayers } from '../src/emblem';

describe('bigLayers', () => {
  it('brings the first forms in close and leaves the later ones as drawn', () => {
    const spark = bigLayers(1)!;
    expect(spark.zoom).toBeGreaterThan(1);
    const rising = bigLayers(LAUNCH_LEVEL)!;
    expect(rising.zoom).toBe(1);
    expect(rising.dx).toBe(0);
    expect(rising.dy).toBe(0);
  });
  it('on a sky that is not its own, stands the figure in the middle without the drawing’s hills', () => {
    for (const level of [1, 7, 13, LAUNCH_LEVEL, 45]) {
      const b = bigLayers(level, true)!;
      const at = b.layers.at;
      expect(b.dx).toBeCloseTo(0.5 - at.x);
      expect(b.dy).toBeCloseTo(0.5 - at.y);
      expect(b.layers.back).not.toMatch(/V122H-2Z/);
      expect(bigFigureAt(level, true)).toEqual({ x: 0.5, y: 0.5 });
    }
  });
  it('says where the figure sits on Today: the drawing’s own point, or the middle when brought in close', () => {
    expect(bigFigureAt(LAUNCH_LEVEL)).toEqual(emblemLayers(LAUNCH_LEVEL)!.at);
    expect(bigFigureAt(1)).toEqual({ x: 0.5, y: BIG_MID_Y });
  });
});

describe('launchFlameSvg', () => {
  const svg = launchFlameSvg();
  it('is one SVG of the flame asleep, laid out as the big flame lays its layers out', () => {
    expect(svg.startsWith('<svg viewBox="0 0 120 120"')).toBe(true);
    expect(svg.match(/<svg\b/g)!.length).toBe(1);
    expect(svg.endsWith('</svg>')).toBe(true);
    /* the eyes closed: figAsleep's two arcs */
    expect(svg).toContain('Q-17 94');
    expect(svg).toContain('Q17 94');
    const b = bigLayers(LAUNCH_LEVEL, true)!;
    expect(svg).toContain(`translate(${(b.dx * 120).toFixed(3)} ${(b.dy * 120).toFixed(3)})`);
  });
  it('has no sky and no hills of its own: it sits on the launch color', () => {
    expect(svg).not.toMatch(/fill="url\(#em\w+sk\)"/);
    expect(svg).not.toMatch(/V122H-2Z/);
  });
  it('is big enough to be the splash: about two fifths of a phone across', () => {
    /* the figure is about a third of its 120 box; on a 393-point phone that is a flame about 150 points wide */
    expect((LAUNCH_W * 0.35) / 393).toBeGreaterThan(0.36);
    expect((LAUNCH_W * 0.35) / 393).toBeLessThan(0.42);
  });
});
