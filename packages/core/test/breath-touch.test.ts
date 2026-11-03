/* The breath by touch: rising taps in, still on a hold, falling taps out, never a buzz, always inside the step. */
import { expect, it } from 'vitest';
import * as core from '../src/index';

const gaps = (t: core.BreathTap[]) => t.slice(1).map((x, i) => x[0] - t[i][0]);

it('every pattern taps only inside its steps, never too close, and is still on a hold', () => {
  for (const k of Object.keys(core.PATTERNS) as (keyof typeof core.PATTERNS)[]) {
    const ph = core.PATTERNS[k].ph as [string, number][];
    const taps = core.breathTouch(ph);
    expect(taps.length).toBe(ph.length);
    ph.forEach(([kind, dur], i) => {
      if (kind === 'hold') expect(taps[i]).toEqual([]);
      else expect(taps[i].length).toBeGreaterThan(1);
      for (const [ms] of taps[i]) (expect(ms).toBeGreaterThanOrEqual(0), expect(ms).toBeLessThanOrEqual(dur * 1000 - 350));
      for (const g of gaps(taps[i])) expect(g).toBeGreaterThanOrEqual(core.TAP_GAP_MIN);
    });
  }
});

it('a breath in rises: taps come closer and firmer; a breath out falls: a firm first tap, then wider and softer', () => {
  const [inn, out] = core.breathTouch([
    ['in', 4],
    ['out', 6],
  ]);
  expect(inn.map((t) => t[1])).toEqual([0, 0, 1, 1, 2, 2]);
  const gi = gaps(inn);
  gi.slice(1).forEach((g, i) => expect(g).toBeLessThan(gi[i]));
  expect(out[0][1]).toBe(2);
  expect(out[out.length - 1][1]).toBe(0);
  const go = gaps(out);
  go.slice(1).forEach((g, i) => expect(g).toBeGreaterThan(go[i]));
});

it('the sigh keeps rising through its second breath in', () => {
  const [a, b] = core.breathTouch(core.PATTERNS.sigh.ph as [string, number][]);
  expect(Math.max(...a.map((t) => t[1]))).toBeLessThan(2);
  expect(b[b.length - 1][1]).toBe(2);
});
