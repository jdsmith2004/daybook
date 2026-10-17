/* Rekindle's "What just happened" cards (fit to how it feels, ending with kindness) and the comebacks record. */
import { describe, expect, it } from 'vitest';
import { normDay, normSettings } from '../src/legacy/core.js';
import { RK_FEELS, RK_LEARN, RK_SRC, rkComebackLine, rkComebacks, rkLearn } from '../src/rekindle-learn';
import type { Days } from '../src/types';

const keys = (l: { k: string }[]) => l.map((x) => x.k);

describe('the cards', () => {
  it('every card cites a source that exists, with a link', () => {
    for (const c of RK_LEARN) for (const k of c.src) expect(RK_SRC[k]?.[1]).toMatch(/^https:\/\//);
  });
  it('uses plain words, with no contractions', () => {
    const words = RK_LEARN.flatMap((c) => [c.title, c.body, c.short]).concat(RK_FEELS.flatMap((f) => [f[1], f[2]]));
    for (const w of words) expect(w).not.toMatch(/\b\w+(n’t|n't|’re|'re|’ll|'ll|’ve|'ve|’m|'m)\b/i);
  });
  it('fits the cards to how it feels, and always ends with kindness', () => {
    expect(keys(rkLearn([]))).toEqual(['rush', 'trap', 'kind']);
    expect(keys(rkLearn(['shame']))).toEqual(['name', 'shame', 'kind']);
    expect(keys(rkLearn(['giveup']))).toEqual(['trap', 'cycle', 'kind']);
    expect(keys(rkLearn(['pull', 'flat']))).toEqual(['rush', 'crash', 'name', 'kind']);
    /* the feelings take turns, so the first ones picked on the list each get a card */
    expect(keys(rkLearn(['pull', 'flat', 'angry']))).toEqual(['rush', 'crash', 'name', 'kind']);
    expect(keys(rkLearn(['shame', 'giveup', 'angry', 'flat', 'pull', 'okay']))).toEqual(['name', 'shame', 'trap', 'kind']);
    for (const f of RK_FEELS) expect(keys(rkLearn([f[0]])).pop()).toBe('kind');
  });
});

describe('the comebacks', () => {
  const st = normSettings({ start: '2026-09-01', day1: '2026-09-01' });
  const slip = (k: string) => normDay({ events: [{ id: k, time: '22:00', outcome: 'slipped' }] }, k);
  const log = (ks: string[]): Days => Object.fromEntries(ks.map((k) => [k, slip(k)]));

  it('a first slip is a first comeback', () => {
    const cb = rkComebacks(log(['2026-09-11']), st, '2026-09-11');
    expect(cb).toEqual({ runs: [10], before: 0, longest: 10, apart: false });
    expect(rkComebackLine(cb)).toMatch(/^This is your first comeback/);
  });
  it('counts the clean days before each slip, and sees them getting further apart', () => {
    const days = log(['2026-09-02', '2026-09-04', '2026-09-08', '2026-09-15', '2026-09-27']);
    const cb = rkComebacks(days, st, '2026-09-27');
    expect(cb.runs).toEqual([1, 1, 3, 6, 11]);
    expect(cb.before).toBe(4);
    expect(cb.longest).toBe(11);
    expect(cb.apart).toBe(true);
    expect(rkComebackLine(cb)).toBe('You have come back 4 times before, and your slips are getting further apart. That is the climb.');
  });
  it('looks only up to the slip it is about', () => {
    const days = log(['2026-09-05', '2026-09-10', '2026-09-20']);
    expect(rkComebacks(days, st, '2026-09-10').runs).toEqual([4, 4]);
    expect(rkComebackLine(rkComebacks(days, st, '2026-09-10'))).toBe('You have come back once before, and more clean days followed. This is the same move.');
  });
  it('keeps the last eight', () => {
    const ks = Array.from({ length: 12 }, (_, i) => '2026-09-' + String(2 + i * 2).padStart(2, '0'));
    expect(rkComebacks(log(ks), st, ks[11]).runs).toHaveLength(8);
  });
});
