/* The one number on the flame's picture at the top of Today, for each way of counting. */
import { describe, expect, it } from 'vitest';
import { addDays, logicalKey, normDay, normSettings } from '../src/legacy/core.js';
import { heroNumber, heroSlipLine, hoursSinceSlip } from '../src/hero';
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
  it('quitting, on the way: the count toward graduation, once 30 days hold', () => {
    const st = normSettings({ start: '2026-07-01', day1: '2026-07-08' });
    const h = heroNumber({}, st, tk, now)!;
    expect([h.eb, h.unit]).toEqual(['Toward graduation', 'of 90']);
    const h30 = heroNumber({}, normSettings({ start: '2026-09-11', day1: '2026-09-18' }), tk, now)!;
    expect([h30.eb, h30.n, h30.unit]).toEqual(['Toward graduation', '30', 'of 90']);
  });
  it('quitting, before 30 days hold: the week, even after the first week in a row', () => {
    const h = heroNumber({}, normSettings({ start: '2026-10-03', day1: '2026-10-10' }), tk, now)!;
    expect([h.eb, h.n, h.unit]).toEqual(['No slip', '7', 'of the last 7 days']);
    const h29 = heroNumber({}, normSettings({ start: '2026-09-12', day1: '2026-09-19' }), tk, now)!;
    expect([h29.eb, h29.n]).toEqual(['No slip', '7']);
  });
  it('graduated: the count that keeps going', () => {
    const st = normSettings({ start: '2026-10-03', day1: '2026-10-10', gradAt: '2026-10-15' });
    const h = heroNumber({}, st, tk, now)!;
    expect([h.eb, h.chip]).toEqual(['Graduated', 'Still going']);
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
    expect([h.eb, h.n, h.unit, h.chip, h.star]).toEqual(['Since your last slip', '13', 'hours', '6 of the last 7 days', false]);
    expect(h.say).toBe('13 hours since your last slip. 6 of the last 7 days with no slip.');
  });
  it('right after the slip: under an hour', () => {
    const h = hero(slip(K, { keep: false }), st, at + 5 * 60e3);
    /* the slip's day is still today, open: the 7 finished days before it all hold */
    expect([h.n, h.unit, h.chip]).toEqual(['<1', 'hour', '7 of the last 7 days']);
    expect(h.say).toBe('Under an hour since your last slip. 7 of the last 7 days with no slip.');
  });
  it('for 72 hours, then the days that hold again', () => {
    expect(hero(slip(K, { keep: false }), st, at + 71 * H).n).toBe('71');
    const h = hero(slip(K, { keep: false }), st, at + 73 * H);
    expect([h.eb, h.n, h.unit]).toEqual(['No slip', '6', 'of the last 7 days']);
    expect(hoursSinceSlip(slip(K, { keep: false }), st, logicalKey(at + 73 * H, 4), at + 73 * H)).toBeNull();
  });
  it('a kept run: no hours, the run goes on', () => {
    for (const d of [slip(K, { keep: true }), slip(K), slip(K, { keep: true, done: true })]) expect(hero(d).eb).toBe('No slip');
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
    expect(hero(slip(K), g).eb).toBe('No slip');
    const h = hero(slip(K, { two: true, keep: false }), g);
    expect([h.eb, h.n]).toEqual(['Since your last slip', '12']);
  });
});

describe('back after days away, the gap not answered yet', () => {
  /* started September 20, Day 1 September 27, here every day through October 12, then away two weeks (as the walk) */
  const ci = (d: Days, k: string): Days => ({ ...d, [k]: { ...normDay({ checkin: { m: 6, done: true } }, k), u: 1 } });
  let present: Days = {};
  for (let k = '2026-09-20'; k <= '2026-10-12'; k = addDays(k, 1)) present = ci(present, k);
  const st = normSettings({ start: '2026-09-20', day1: '2026-09-27', awayFrom: '2026-09-20' });
  const T = '2026-10-27';
  const ms = new Date(2026, 9, 27, 9, 0).getTime();

  it('keeps the measure as it stood before the days that are not known, never "Day 1 is today"', () => {
    const h = heroNumber(present, st, T, ms)!;
    expect([h.eb, h.n, h.unit]).toEqual(['Before you were away', '7', 'of 7 days with no slip']);
    expect(h.say).toBe('Before you were away: 7 of 7 days with no slip.');
  });
  it('once the gap is answered, the count goes on with every day known', () => {
    const answered = normSettings({ ...st, away: [{ from: '2026-10-13', to: '2026-10-26', n: 0 }] });
    const h = heroNumber(present, answered, T, ms)!;
    expect([h.eb, h.n, h.unit]).toEqual(['Toward graduation', '30', 'of 90']);
  });
  it('a few days back, still unanswered: the higher of the two', () => {
    let d = present;
    for (const k of ['2026-10-24', '2026-10-25', '2026-10-26']) d = ci(d, k);
    const h = heroNumber(d, st, T, ms)!;
    expect([h.eb, h.n]).toEqual(['Before you were away', '7']);
  });
  it('a gap that ended more than a week ago is left to the usual count (of the days Daybook knows)', () => {
    let d = present;
    for (let k = '2026-10-27'; k <= '2026-11-09'; k = addDays(k, 1)) d = ci(d, k);
    const h = heroNumber(d, st, '2026-11-10', new Date(2026, 10, 10, 9, 0).getTime())!;
    expect([h.eb, h.n]).toEqual(['Toward graduation', '32']);
  });
});

describe('the line under the number on the day of a slip', () => {
  const st = normSettings({ start: '2026-10-01', day1: '2026-10-08' });
  const K = '2026-10-20';
  const slipAt = (time: string) => addEvent({}, K, 'slipped', time, {}, 1).days;
  const ms = (h: number) => new Date(2026, 9, 20, h, 50).getTime();
  it('a kept run of a week or more: the number holds, and the line says the slip is logged and the days stay', () => {
    const h = heroNumber(slipAt('22:40'), st, K, ms(23))!;
    expect([h.eb, h.n]).toEqual(['No slip', '7']);
    expect(heroSlipLine(slipAt('22:40'), st, K, ms(23))).toBe('Tonight is logged. Your 7 days stay yours.');
    expect(heroSlipLine(slipAt('09:10'), st, K, ms(9))).toBe('This morning is logged. Your 7 days stay yours.');
    expect(heroSlipLine(slipAt('14:00'), st, K, ms(14))).toBe('Today is logged. Your 7 days stay yours.');
    /* after midnight, the same log day: still tonight */
    expect(heroSlipLine(slipAt('01:20'), st, K, new Date(2026, 9, 21, 1, 30).getTime())).toBe('Tonight is logged. Your 7 days stay yours.');
  });
  it('no line on a day with no slip, when the number is the hours since it, or stepping down', () => {
    expect(heroSlipLine({}, st, K, ms(23))).toBeNull();
    /* a run started fresh: the hours since the slip are the number */
    const fresh: Days = { [K]: { ...normDay({ events: [{ id: 's1', time: '22:40', outcome: 'slipped', keep: false }] }, K), u: 1 } };
    expect(heroNumber(fresh, st, K, ms(23))!.eb).toBe('Since your last slip');
    expect(heroSlipLine(fresh, st, K, ms(23))).toBeNull();
    expect(
      heroSlipLine(slipAt('22:40'), normSettings({ start: '2026-10-01', day1: '2026-10-08', cleanMode: 'step', stepAt: '2026-10-08' }), K, ms(23)),
    ).toBeNull();
  });
  it('has no contractions', () => {
    expect(heroSlipLine(slipAt('22:40'), st, K, ms(23))).not.toMatch(/n[’']t\b|[’'](re|ll|ve|m|d|s)\b/i);
  });
});
