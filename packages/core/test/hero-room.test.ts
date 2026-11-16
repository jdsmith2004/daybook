/* The words on Today's sky are always on the hills (hero-room.ts). The owner, November 14, 2026, after the 35 on the Torch was cut
   in half by the hills' edge on the day sky: "that can't keep happeneing". This holds it for every form and every phone. */
import { describe, expect, it } from 'vitest';
import {
  figHead,
  heroFit,
  groundLine,
  HERO_WORDS_GAP,
  HERO_WORDS_MAX,
  HERO_WORDS_PAD,
  landTop,
  SKY_MAX,
  SKY_MIN,
  todaySize,
  contrast,
  wordsBack,
  wordsInk,
  WORDS_CONTRAST,
} from '../src/hero-room';
import { PHASE_SKY, type SkyPhase } from '../src/two-moments';
import { emblemScene } from '../src/emblem';

const LEVELS = Array.from({ length: 60 }, (_, i) => i + 1);
/* phones from the smallest to the largest, as each platform lays them out: [width, height, clock's room, home indicator's room, tab bar]
   (the iPhone's tab bar is inside its bottom safe area; Android and the web add theirs) */
const PHONES: [number, number, number, number, number][] = [
  [320, 568, 20, 0, 0],
  [375, 667, 20, 0, 0],
  [375, 812, 47, 34, 0],
  [390, 844, 47, 34, 0],
  [393, 852, 59, 34, 0],
  [402, 874, 62, 34, 0],
  [428, 926, 47, 34, 0],
  [430, 932, 59, 34, 0],
  [440, 956, 62, 34, 0],
  [360, 640, 24, 0, 62],
  [360, 800, 48, 0, 62],
  [412, 915, 24, 0, 62],
  [320, 568, 0, 0, 62],
  [375, 812, 0, 0, 62],
  [430, 932, 0, 0, 62],
];
/* the quiet lines under the next step: none, one, the SOS lead, both */
const EXTRAS = [0, 26, 30, 56];

describe('the words on the sky stay on the hills', () => {
  it('the highest point of the hills is found for every form that has them', () => {
    for (const l of LEVELS) {
      const t = landTop(l);
      if (!emblemScene(l).land) {
        expect(t).toBeNull();
        continue;
      }
      expect(t!).toBeGreaterThan(80);
      expect(t!).toBeLessThan(120);
    }
    /* the Torch's hills (levels 16 to 20) peak at 101 */
    expect(landTop(19)).toBe(101);
  });

  it('the edge found is never under the true edge: every hill curve stays inside its control points', () => {
    for (const l of LEVELS) {
      const land = emblemScene(l).land;
      if (!land) continue;
      const t = landTop(l)!;
      for (const m of land.matchAll(/d="M-1000 ([\d.]+)H-2C([\d. ]+)S([\d. ]+) 122 ([\d.]+)H/g)) {
        const ys = [m[1], m[4], ...m[2].split(' ').filter((_, i) => i % 2), ...m[3].split(' ').filter((_, i) => i % 2)].map(Number);
        expect(Math.min(...ys)).toBeGreaterThanOrEqual(t);
      }
    }
  });

  it('on every phone, sky and form, the hills rise above the tallest words, the tip of the fire stays under the clock, and the flame keeps its size', () => {
    let checked = 0;
    for (const [w, ht, top, bottom, tabs] of PHONES)
      for (const extra of EXTRAS) {
        const { sky, flame } = todaySize(ht, w, top, bottom, extra, tabs);
        expect(sky).toBeGreaterThanOrEqual(SKY_MIN);
        expect(sky).toBeLessThanOrEqual(SKY_MAX);
        for (const l of LEVELS) {
          const fit = heroFit({ sky, flame, level: l, words: HERO_WORDS_MAX, top });
          const ft = fit.top;
          expect(ft + flame * figHead(l), `level ${l} on ${w}x${ht}`).toBeGreaterThanOrEqual(top + 6);
          /* the sky only ever grows a little, and only for a tall form on a short sky */
          expect(fit.sky - sky, `level ${l} on ${w}x${ht}`).toBeLessThanOrEqual(40);
          checked++;
          /* a form with no hills has its words on the sky; their ink is held by the next test */
          if (landTop(l) == null) continue;
          const ground = groundLine(ft, flame, l);
          const wordsTop = fit.sky - HERO_WORDS_PAD - HERO_WORDS_MAX;
          expect(ground, `level ${l} on ${w}x${ht}, sky ${sky}`).toBeLessThanOrEqual(wordsTop - HERO_WORDS_GAP);
        }
      }
    expect(checked).toBe(PHONES.length * EXTRAS.length * LEVELS.length);
  });

  it('the words read on everything behind them, on every form and every hour of the sky', () => {
    const phases: (SkyPhase | null)[] = [null, ...(Object.keys(PHASE_SKY) as SkyPhase[])];
    for (const l of LEVELS)
      for (const p of phases) {
        const { ink, soft } = wordsInk(l, p);
        for (const b of wordsBack(l, p)) {
          expect(contrast(ink, b), `level ${l} at ${p}: ink ${ink} on ${b}`).toBeGreaterThanOrEqual(WORDS_CONTRAST);
          expect(contrast(soft, b), `level ${l} at ${p}: soft ${soft} on ${b}`).toBeGreaterThanOrEqual(WORDS_CONTRAST);
        }
      }
    /* the dawn sky's bottom is peach: the words on a form with no hills go dark there */
    expect(wordsInk(50, 'dawn').light).toBe(false);
    expect(wordsInk(50, 'night').light).toBe(true);
  });

  it('the flame only moves up when the words need it, and keeps its size', () => {
    const { sky, flame } = todaySize(812, 375, 47, 34);
    /* with no words at all, the flame stands where it always did */
    const low = heroFit({ sky, flame, level: 8, words: 0, top: 47 });
    expect(low.sky).toBe(sky);
    expect(low.top).toBe(sky - flame - 86 + 18 + Math.round(flame * -0.02));
    /* the Torch stands lower, so with the number, the marks and a line under it the flame rises to keep its hills over them */
    const torch = heroFit({ sky, flame, level: 19, words: 90, top: 47 });
    expect(torch.top).toBeLessThan(torch.sky - flame - 86 + 18 + Math.round(flame * 0.11));
    expect(groundLine(torch.top, flame, 19)).toBeLessThanOrEqual(torch.sky - HERO_WORDS_PAD - 90 - HERO_WORDS_GAP);
    /* on a big phone the sky does not need to grow at all */
    const big = todaySize(932, 430, 59, 34);
    expect(heroFit({ ...big, level: 19, words: 90, top: 59 }).sky).toBe(big.sky);
  });
});
