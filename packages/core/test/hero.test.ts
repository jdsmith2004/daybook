/* The one number on the flame's picture at the top of Today, for each way of counting. */
import { describe, expect, it } from 'vitest';
import { addDays, logicalKey, normDay, normSettings } from '../src/legacy/core.js';
import { heroNumber, hoursSinceSlip } from '../src/hero';
import { addEvent } from '../src/mutate';
import type { DayEvent, Days } from '../src/types';

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
    expect([h.eb, h.n, h.unit, h.chip]).toEqual(['Tracking week', 'Day 3', 'of 7', 'Counting starts Oct 23']);
    const j = heroNumber({}, normSettings({ start: '2026-10-16', day1: null }), tk, now)!;
    expect([j.eb, j.n, j.unit, j.chip]).toEqual(['Just tracking', 'Day 3', '', null]);
  });
});

describe('the hours after a slip', () => {
  const st = normSettings({ start: '2026-10-25', day1: '2026-11-01' });
  const K = '2026-11-08'; // Day 8: the slip at 10 PM ends a run of 7 days
  const at = new Date(2026, 10, 8, 22, 0).getTime();
  const H = 36e5;
  const slip = (k: string, o: { keep?: boolean; done?: boolean; two?: boolean } = {}): Days => {
    const ev: Partial<DayEvent> = { id: 's1', time: '22:00', outcome: 'slipped', recovered: !!o.done, ...(o.keep == null ? {} : { keep: o.keep }) };
    if (o.done) ev.rk = { at: addDays(k, 1), pl: '' };
    const evs = o.two ? [ev, { id: 's2', time: '22:30', outcome: 'slipped' as const }] : [ev];
    return { [k]: { ...normDay({ events: evs, checkin: o.done ? { so: 'Y' } : null }, k), u: 1 } };
  };
  const hero = (days: Days, s = st, ms = at + 13 * H) => heroNumber(days, s, logicalKey(ms, s.rollover), ms)!;

  it('start fresh: the hours since the slip, with the days that hold beside them', () => {
    const h = hero(slip(K, { keep: false }));
    expect([h.eb, h.n, h.unit, h.chip, h.star]).toEqual(['Since your last slip', '13', 'hours', '7 of 90 toward graduation', false]);
    expect(h.say).toBe('13 hours since your last slip. 7 of 90 toward graduation.');
  });
  it('right after the slip: under an hour', () => {
    const h = hero(slip(K, { keep: false }), st, at + 5 * 60e3);
    expect([h.n, h.unit, h.chip]).toEqual(['<1', 'hour', '7 of 90 toward graduation']);
    expect(h.say).toBe('Under an hour since your last slip. 7 of 90 toward graduation.');
  });
  it('for 72 hours, then the days that hold again', () => {
    expect(hero(slip(K, { keep: false }), st, at + 71 * H).n).toBe('71');
    const h = hero(slip(K, { keep: false }), st, at + 73 * H);
    expect([h.eb, h.n, h.unit]).toEqual(['Toward graduation', '9', 'of 90']);
    expect(hoursSinceSlip(slip(K, { keep: false }), st, logicalKey(at + 73 * H, 4), at + 73 * H)).toBeNull();
  });
  it('a kept run: no hours, the run goes on', () => {
    for (const d of [slip(K, { keep: true }), slip(K), slip(K, { keep: true, done: true })]) expect(hero(d).eb).toBe('Toward graduation');
  });
  it('a run under 7 days ends at the slip: the hours', () => {
    const h = hero(slip('2026-11-07'), st, new Date(2026, 10, 7, 22, 0).getTime() + 14 * H);
    expect([h.n, h.unit, h.chip]).toEqual(['14', 'hours', '6 of the last 7 days']);
    expect(h.say).toBe('14 hours since your last slip. 6 of the last 7 days with no slip.');
  });
  it('step down is unchanged: this stretch, in hours', () => {
    const h = hero(slip(K), normSettings({ start: '2026-10-25', day1: '2026-11-01', cleanMode: 'step', stepAt: '2026-11-01' }));
    expect([h.eb, h.n, h.unit]).toEqual(['This stretch', '13', 'hours']);
  });
  it('gentle: a slip that still counts as a good day keeps the days; a second slip that day is the hours', () => {
    const g = normSettings({ start: '2026-10-25', day1: '2026-11-01', cleanMode: 'gentle' });
    expect(hero(slip(K), g).eb).toBe('Toward graduation');
    const h = hero(slip(K, { two: true, keep: false }), g);
    expect([h.eb, h.n]).toEqual(['Since your last slip', '12']);
  });
});
