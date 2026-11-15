/* The Pattern cards fed by what a person does every day: nights the morning told, lesson days and hard hours held. Each counts
   up over the range, says the period before only when it had some, and a card with nothing in the whole log has a line to fill it. */
import { describe, expect, it } from 'vitest';
import { addDays, normSettings } from '../src/legacy/core.js';
import { patPeriod } from '../src/pattern-cards';
import { anyHeld, anyLesson, anyNightTold, PAT_FILL, patHeld, patLearn, patNights } from '../src/pattern-work';
import type { DayKey, Days } from '../src/types';

const TK = '2026-11-01';
const st = normSettings({ start: '2026-01-01', day1: '2026-01-01' });
const blank = { w: [], wd: false, r: false, c: 0, m: false, tl: [], po: null, ls: [], lv: [], ov: {} };
const base = (): Days => ({ '2026-01-01': { events: [], u: 1 } as unknown as Days[string] });
const withP = (d: Days, k: DayKey, p: object): Days => ({
  ...d,
  [k]: { ...(d[k] || { events: [] }), p: { ...blank, ...(d[k]?.p || {}), ...p } } as unknown as Days[string],
});
/** the morning of day k + 1 telling the night of day k */
const told = (d: Days, k: DayKey, n: 'free' | 'slip') => withP(d, addDays(k, 1), { ms: { at: 1, n, set: 1 } });

describe('patNights', () => {
  it('reads each night from the morning after, and leaves tonight out', () => {
    let d = base();
    d = told(d, '2026-10-29', 'free');
    d = told(d, '2026-10-30', 'free');
    d = told(d, '2026-10-31', 'slip');
    const r = patNights(d, patPeriod('7', d, st, TK), TK);
    expect(r.nights.length).toBe(6);
    expect(r.nights.map((x) => x.n).slice(-3)).toEqual(['free', 'free', 'slip']);
    expect(r.head).toBe('2 nights free');
    expect(r.line).toBe('Free 2 of the 3 nights you told.');
  });
  it('says up from the week before only when that week had free nights', () => {
    let d = base();
    d = told(d, '2026-10-20', 'free');
    for (const k of ['2026-10-27', '2026-10-28', '2026-10-29']) d = told(d, k, 'free');
    expect(patNights(d, patPeriod('7', d, st, TK), TK).line).toBe('Up from 1 the week before.');
  });
  it('with nothing told, says how to fill it', () => {
    const r = patNights(base(), patPeriod('7', base(), st, TK), TK);
    expect(r.told).toBe(0);
    expect(r.head).toBe('No nights told');
    expect(anyNightTold(base())).toBe(false);
  });
});

describe('patLearn', () => {
  it('counts a day with a lesson done or read again, once', () => {
    let d = base();
    d = withP(d, '2026-10-30', { ls: ['a', 'b'] });
    d = withP(d, '2026-10-31', { lv: ['a'] });
    const r = patLearn(d, patPeriod('7', d, st, TK), TK);
    expect(r.n).toBe(2);
    expect(r.head).toBe('Lessons on 2 days');
    expect(r.cols.length).toBe(7);
    expect(r.cols.reduce((a, c) => a + c.n, 0)).toBe(2);
    expect(r.cols[r.cols.length - 1].label).toBe('Today');
    expect(r.cols.map((c) => c.on[0])).toEqual([false, false, false, false, true, true, false]);
    expect(anyLesson(d)).toBe(true);
  });
  it('a lesson every day of the range is said as that', () => {
    let d = base();
    for (let i = 0; i < 7; i++) d = withP(d, addDays(TK, -i), { ls: ['x'] });
    expect(patLearn(d, patPeriod('7', d, st, TK), TK).line).toBe('A lesson every day. That is how a new self is built.');
  });
});

describe('patHeld', () => {
  it('counts hard hours held and names the hour that came up most', () => {
    let d = base();
    d = withP(d, '2026-10-28', { hw: 22 });
    d = withP(d, '2026-10-30', { hw: 22 });
    d = withP(d, '2026-10-31', { hw: 14 });
    const r = patHeld(d, patPeriod('7', d, st, TK));
    expect(r.n).toBe(3);
    expect(r.head).toBe('3 hard hours held');
    expect(r.line).toContain('around 10');
    expect(r.hours.map((x) => x.h)).toEqual([22, 22, 14]);
    expect(anyHeld(d)).toBe(true);
    expect(anyHeld(base())).toBe(false);
  });
});

describe('PAT_FILL', () => {
  it('has a plain line for every card, with no contractions', () => {
    for (const id of ['apart', 'ride', 'nights', 'learn', 'held', 'when', 'what', 'helps', 'days', 'felt', 'named']) {
      expect(PAT_FILL[id]).toBeTruthy();
      expect(PAT_FILL[id]).not.toMatch(/n't|'s |'re |'ll /);
    }
  });
});
