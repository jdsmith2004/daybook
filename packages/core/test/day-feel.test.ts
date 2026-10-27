/* "How are you feeling today?" (day-feel.ts): the five answers, the answer kept on the day (and cleaned like the rest of
   the day, for sync and backups), when it may ask, and the first open of the day. */
import { describe, expect, it } from 'vitest';
import { daySummary } from '../src/calendar';
import { DAY_FEEL, DAY_FEEL_Q, dayFeelDue, dayFeelOf, dayFeelQuiet, dayFeelSet, dayOpenNext } from '../src/day-feel';
import { normRecord } from '../src/data';
import { dayPoints, gameCompute, normDay, normSettings } from '../src/legacy/core.js';
import { loggedDay } from '../src/log-start';
import { addEvent, withDay } from '../src/mutate';
import type { Day, Days } from '../src/types';

/* started October 7, Day 1 October 14 */
const st = normSettings({ start: '2026-10-07', day1: '2026-10-14', wk1: '2026-10-15' });
const at = (d: number, h: number, m = 0) => new Date(2026, 9, d, h, m).getTime();
const feel = (days: Days, k: string, n: number, t = at(20, 8)) => withDay(days, k, dayFeelSet(days[k], k, n, t));

describe('the five answers', () => {
  it('go from Rough to Great, one word each, in plain and kind words', () => {
    expect(DAY_FEEL.map((a) => a.n)).toEqual([1, 2, 3, 4, 5]);
    expect(DAY_FEEL.map((a) => a.w)).toEqual(['Rough', 'Low', 'Okay', 'Good', 'Great']);
    expect(DAY_FEEL_Q).toBe('How are you feeling today?');
    for (const a of DAY_FEEL) {
      /* no contractions, and never a word of blame */
      expect(a.say).not.toMatch(/n[’']t\b|[’'](re|ll|ve|m|d)\b|\bit[’']s\b/i);
      expect(a.say).not.toMatch(/\b(fail|failed|bad|wrong|should|reset|lost)\b/i);
    }
    /* the low answers point at SOS, gently */
    expect(DAY_FEEL[0].say).toMatch(/SOS is one tap/);
    expect(DAY_FEEL[1].say).toMatch(/SOS is one tap/);
  });
});

describe('the answer, kept on the day', () => {
  it('one tap writes the step and when; a second tap replaces it', () => {
    let d = feel({}, '2026-10-20', 2, at(20, 8));
    expect(dayFeelOf(d['2026-10-20'])).toEqual({ n: 2, w: 'Low', at: at(20, 8) });
    d = feel(d, '2026-10-20', 4, at(20, 9));
    expect(dayFeelOf(d['2026-10-20'])).toEqual({ n: 4, w: 'Good', at: at(20, 9) });
    expect(d['2026-10-20'].p?.df).toEqual([4, at(20, 9)]);
  });
  it('keeps the rest of the day as it was', () => {
    const d0 = addEvent({}, '2026-10-20', 'rode', '09:00', {}, 1).days;
    const d = feel(d0, '2026-10-20', 5);
    expect(d['2026-10-20'].events.length).toBe(1);
    expect(dayFeelOf(d['2026-10-20'])?.w).toBe('Great');
  });
  it('a step that is not one of the five changes nothing', () => {
    expect(dayFeelSet(undefined, '2026-10-20', 0, 1)).toBeNull();
    expect(dayFeelSet(undefined, '2026-10-20', 6, 1)).toBeNull();
    expect(dayFeelSet(undefined, '2026-10-20', 2.5, 1)).toBeNull();
    expect(dayFeelOf(undefined)).toBeNull();
  });
  it('a day with only the answer is kept (it is not an empty day)', () => {
    const d = dayFeelSet(undefined, '2026-10-20', 3, at(20, 8));
    expect(d).not.toBeNull();
    expect(normDay(d, '2026-10-20').p?.df).toEqual([3, at(20, 8)]);
  });
  it('goes through sync and backups cleaned like the rest of the day, and a broken one is dropped', () => {
    const d = dayFeelSet(undefined, '2026-10-20', 1, at(20, 8)) as Day;
    const r = normRecord({ id: 'days/2026-10-20', u: d.u, data: d });
    expect(dayFeelOf(r?.data as Day)).toEqual({ n: 1, w: 'Rough', at: at(20, 8) });
    const bad = (df: unknown) => normDay({ d: '2026-10-20', events: [], checkin: null, p: { df, o: true }, u: 1 } as unknown as Day, '2026-10-20').p?.df;
    expect(bad([9, 1])).toBeUndefined();
    expect(bad(['4', 1])).toBeUndefined();
    expect(bad([4, 'x'])).toBeUndefined();
    expect(bad([4, -1])).toBeUndefined();
    expect(bad('Good')).toBeUndefined();
    expect(bad([4, 5, 6])).toEqual([4, 5]);
  });
  it('earns nothing and does not start the log', () => {
    const d = feel({}, '2026-10-10', 5, at(10, 8));
    expect(loggedDay(d['2026-10-10'])).toBe(false);
    expect(dayPoints(d, '2026-10-10', st).total).toBe(0);
    const g0 = gameCompute({}, st, {}, '2026-10-20');
    const g1 = gameCompute(feel({}, '2026-10-20', 5), st, {}, '2026-10-20');
    expect(g1.pts).toBe(g0.pts);
    expect(g1.perDay['2026-10-20'] || 0).toBe(0);
    expect(g1.level.n).toBe(g0.level.n);
    expect(JSON.stringify(g1.badges)).toBe(JSON.stringify(g0.badges));
  });
  it('shows on the day’s page, under Also that day', () => {
    const d = feel({}, '2026-10-20', 4);
    expect(daySummary(d, st, '2026-10-20', '2026-10-20').more).toContainEqual({ ic: 'sun', t: 'Felt good that day' });
  });
});

describe('when it may ask', () => {
  it('after the setup, on a day not answered yet', () => {
    expect(dayFeelDue({}, st, '2026-10-20')).toBe(true);
    expect(dayFeelDue({}, null, '2026-10-20')).toBe(false);
    expect(dayFeelDue(feel({}, '2026-10-20', 3), st, '2026-10-20')).toBe(false);
    /* yesterday's answer does not answer today */
    expect(dayFeelDue(feel({}, '2026-10-19', 3), st, '2026-10-20')).toBe(true);
  });
  it('an urge ridden out today does not stop it', () => {
    expect(dayFeelDue(addEvent({}, '2026-10-20', 'rode', '07:00', {}, 1).days, st, '2026-10-20')).toBe(true);
  });
  it('never on the day of a slip', () => {
    const d = addEvent({}, '2026-10-20', 'slipped', '07:00', {}, 1).days;
    expect(dayFeelDue(d, st, '2026-10-20')).toBe(false);
  });
  it('never while a Rekindle is open: the morning after a slip, and while its run waits to be saved', () => {
    const d = addEvent({}, '2026-10-19', 'slipped', '23:00', {}, 1).days;
    expect(dayFeelDue(d, st, '2026-10-20')).toBe(false);
    /* a slip long past, with its Rekindle closed, no longer holds it back */
    const old = addEvent({}, '2026-10-08', 'slipped', '23:00', {}, 1).days;
    expect(dayFeelDue(old, st, '2026-10-20')).toBe(true);
  });
});

describe('the hours it stays closed', () => {
  /* screens off at 11 PM (the starting setting), so the wind-down starts at 10 PM; the new day at 4 AM */
  const s2 = normSettings({ start: '2026-10-07', day1: '2026-10-14', screensOff: '23:00', rollover: 4 });
  it('asks in the day, and not once the wind-down has started, until the new day', () => {
    expect(dayFeelQuiet({}, s2, '2026-10-20', at(20, 8))).toBe(false);
    expect(dayFeelQuiet({}, s2, '2026-10-20', at(20, 21, 59))).toBe(false);
    expect(dayFeelQuiet({}, s2, '2026-10-20', at(20, 22))).toBe(true);
    expect(dayFeelQuiet({}, s2, '2026-10-20', at(20, 23, 30))).toBe(true);
    /* after midnight, still the same log day */
    expect(dayFeelQuiet({}, s2, '2026-10-20', at(21, 2))).toBe(true);
    /* the new day */
    expect(dayFeelQuiet({}, s2, '2026-10-21', at(21, 7))).toBe(false);
  });
  it('a screens-off early in the log day (a night shift) does not quiet the whole day', () => {
    const shift = normSettings({ start: '2026-10-07', day1: '2026-10-14', screensOff: '08:00', rollover: 4 });
    expect(dayFeelQuiet({}, shift, '2026-10-20', at(20, 15))).toBe(false);
  });
  it('not in the hard hours, nor in the two hours before them', () => {
    /* slips at 3 PM on the weekdays before: hard hours 3 to 5 PM (October 20, 2026 is a Tuesday) */
    let d: Days = {};
    for (const k of ['2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15']) d = addEvent(d, k, 'slipped', '15:10', {}, 1).days;
    expect(dayFeelQuiet(d, s2, '2026-10-20', at(20, 11))).toBe(false);
    expect(dayFeelQuiet(d, s2, '2026-10-20', at(20, 13, 30))).toBe(true);
    expect(dayFeelQuiet(d, s2, '2026-10-20', at(20, 16))).toBe(true);
    expect(dayFeelQuiet(d, s2, '2026-10-20', at(20, 17, 30))).toBe(false);
  });
});

describe('the first open of the day', () => {
  it('is the first open of a new day, once', () => {
    expect(dayOpenNext(null, '2026-10-20', true)).toEqual({ last: '2026-10-20', first: '2026-10-20' });
    expect(dayOpenNext('2026-10-19', '2026-10-20', true)).toEqual({ last: '2026-10-20', first: '2026-10-20' });
    expect(dayOpenNext('2026-10-20', '2026-10-20', true)).toEqual({ last: '2026-10-20', first: null });
  });
  it('the day of the setup is not asked: the open is kept, so a later open that day is not the first', () => {
    const o = dayOpenNext(null, '2026-10-20', false);
    expect(o).toEqual({ last: '2026-10-20', first: null });
    expect(dayOpenNext(o.last, '2026-10-20', true).first).toBeNull();
    expect(dayOpenNext(o.last, '2026-10-21', true).first).toBe('2026-10-21');
  });
});
