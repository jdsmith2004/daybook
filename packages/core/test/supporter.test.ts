import { describe, expect, it } from 'vitest';
import { extraLocked, isSupporter, LOOKS_READY, patPartOpen, supActive, supBest, supPerks, tipEnough, type Supporter } from '../src/supporter';

const tip: Supporter = { since: 1, kind: 'tip', until: null, src: 'apple', cents: 500 };
const month: Supporter = { since: 1, kind: 'monthly', until: 1000, src: 'stripe' };

describe('supporter', () => {
  it('a tip never ends, a month ends at its until', () => {
    expect(supActive(tip, 1e15)).toBe(true);
    expect(supActive(month, 999)).toBe(true);
    expect(supActive(month, 1000)).toBe(false);
    expect(supActive(null)).toBe(false);
  });
  it('reads the record on the settings', () => {
    expect(isSupporter({ sup: tip } as never)).toBe(true);
    expect(isSupporter({} as never)).toBe(false);
    expect(isSupporter(null)).toBe(false);
  });
  it('five dollars or more makes a supporter', () => {
    expect(tipEnough(500)).toBe(true);
    expect(tipEnough(499)).toBe(false);
    expect(tipEnough(NaN)).toBe(false);
  });
  it('keeps the better record', () => {
    expect(supBest(month, tip)).toBe(tip);
    expect(supBest(tip, month)).toBe(tip);
    expect(supBest(month, { ...month, until: 2000 })?.until).toBe(2000);
    expect(supBest(null, month)).toBe(month);
    expect(supBest(undefined, null)).toBe(null);
  });
});

describe('locks', () => {
  const st = { start: '2026-10-01' } as never;
  const sup = { start: '2026-10-01', sup: tip } as never;
  it('a supporter has every extra open; anyone else sees the locks, where a tip can be paid', () => {
    expect(extraLocked(st, 'stats', { canTip: true })).toBe(true);
    expect(extraLocked(st, 'sync', { canTip: true })).toBe(true);
    expect(extraLocked(sup, 'stats', { canTip: true })).toBe(false);
    expect(extraLocked(sup, 'sync', { canTip: true })).toBe(false);
    /* a grandfathered account is a supporter record too */
    expect(extraLocked({ start: '2026-10-01', sup: { ...tip, src: 'grandfather' } } as never, 'sync', { canTip: true })).toBe(false);
  });
  it('where no tip can be paid (Android for now), nothing is locked', () => {
    expect(extraLocked(st, 'stats', { canTip: false })).toBe(false);
    expect(extraLocked(st, 'sync', { canTip: false })).toBe(false);
  });
  it('sync shows its lock only while signed out: the server decides for an account', () => {
    expect(extraLocked(st, 'sync', { canTip: true, signedIn: true })).toBe(false);
    expect(extraLocked(st, 'sync', { canTip: true, signedIn: false })).toBe(true);
  });
  it('flame looks are neither offered nor locked until they exist', () => {
    expect(LOOKS_READY).toBe(false);
    expect(extraLocked(st, 'looks', { canTip: true })).toBe(false);
    expect(supPerks().map((p) => p.id)).toEqual(['sync', 'stats']);
  });
  it('the pattern in one look, the gaps between slips and My numbers stay free; the deeper parts lock', () => {
    for (const p of ['look', 'apart', 'numbers'] as const) expect(patPartOpen(p, true)).toBe(true);
    for (const p of ['when', 'what', 'days', 'helps'] as const) {
      expect(patPartOpen(p, true)).toBe(false);
      expect(patPartOpen(p, false)).toBe(true);
    }
  });
  it('a monthly plan that ended locks again at its end', () => {
    const ended = { start: '2026-10-01', sup: { since: 1, kind: 'monthly', until: 1000, src: 'stripe' } } as never;
    expect(extraLocked(ended, 'stats', { canTip: true, now: 999 })).toBe(false);
    expect(extraLocked(ended, 'stats', { canTip: true, now: 1000 })).toBe(true);
  });
});
