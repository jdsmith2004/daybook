/* The one number on the flame's picture at the top of Today, for each way of counting. */
import { describe, expect, it } from 'vitest';
import { normSettings } from '../src/legacy/core.js';
import { heroNumber } from '../src/hero';
import { addEvent } from '../src/mutate';
import type { Days } from '../src/types';

const tk = '2026-10-18';
const now = new Date(2026, 9, 18, 9, 0).getTime();

describe('the number on the flame', () => {
  it('stepping down: this stretch, with the best before it', () => {
    const st = normSettings({ start: '2026-10-01', day1: '2026-10-08', cleanMode: 'step', stepAt: '2026-10-08' });
    let d: Days = addEvent({}, '2026-10-10', 'slipped', '10:00', {}, 1).days;
    d = addEvent(d, '2026-10-17', 'slipped', '10:00', {}, 1).days;
    const h = heroNumber(d, st, tk, now)!;
    expect([h.eb, h.n, h.unit]).toEqual(['This stretch', '23', 'hours']);
    expect(h.chip).toMatch(/^best \d+ d$/);
    expect(h.star).toBe(true);
    expect(h.say).toMatch(/^This stretch: 23 hours\. best/);
  });
  it('quitting, in the first week: the days with no slip', () => {
    const st = normSettings({ start: '2026-10-10', day1: '2026-10-15' });
    const d = addEvent({}, '2026-10-16', 'slipped', '22:00', {}, 1).days;
    const h = heroNumber(d, st, tk, now)!;
    expect([h.eb, h.n, h.unit]).toEqual(['No slip', '2', 'of the last 3 days']);
    expect(heroNumber({}, normSettings({ start: '2026-10-17', day1: tk }), tk, now)!.n).toBe('Day 1');
  });
  it('quitting, on the way: the count toward graduation', () => {
    const st = normSettings({ start: '2026-07-01', day1: '2026-07-08' });
    const h = heroNumber({}, st, tk, now)!;
    expect([h.eb, h.unit]).toEqual(['Toward graduation', 'of 90']);
  });
  it('tracking: which day it is, and when Day 1 comes', () => {
    const h = heroNumber({}, normSettings({ start: '2026-10-16', day1: '2026-10-23' }), tk, now)!;
    expect([h.eb, h.n, h.unit, h.chip]).toEqual(['Tracking week', 'Day 3', 'of 7', 'Day 1 Fri']);
    const j = heroNumber({}, normSettings({ start: '2026-10-16', day1: null }), tk, now)!;
    expect([j.eb, j.n, j.unit, j.chip]).toEqual(['Just tracking', 'Day 3', '', null]);
  });
});
