/* The Sunday review: the week from Monday to Sunday, what worked and what to change (with what the log saw), small goals
   the log can count, when Today asks for it, and how it is kept and synced. */
import { describe, expect, it } from 'vitest';
import { normDay, normSettings } from '../src/legacy/core.js';
import { gameCompute } from '../src/legacy/core.js';
import { isReviewKey, normRecord, normReview } from '../src/data';
import { addEvent } from '../src/mutate';
import {
  isSunday,
  normSun,
  saveSun,
  sunChange,
  sunDue,
  sunGoalCount,
  sunGoalLine,
  sunGoalNow,
  sunGoalOf,
  sunGoals,
  sunLastGoal,
  sunList,
  sunOf,
  sunRange,
  sunWeek,
  sunWorked,
} from '../src/sunday';
import type { Day, DayKey, Days, Reviews } from '../src/types';

/* 2026-10-12 is a Monday, 2026-10-18 a Sunday */
const SUN = '2026-10-18';
const st = normSettings({ start: '2026-09-01', day1: '2026-09-08', screensOff: '23:00' });
const day = (k: DayKey, o: Partial<Day> = {}): Day => ({ ...normDay({}, k), ...o });
const ci = (o: Record<string, unknown>) => ({ m: null, c: null, e: null, s: null, h: null, so: null, ro: null, n: '', done: true, at: 1, ...o });
const p = (o: Record<string, unknown>) => ({ w: [], wd: false, r: false, c: 0, m: false, tl: [], po: null, ls: [], lv: [], ov: {}, ...o });

describe('the week', () => {
  it('runs Monday to Sunday, and ends on the Sunday', () => {
    expect(isSunday(SUN)).toBe(true);
    expect(isSunday('2026-10-17')).toBe(false);
    expect(sunOf('2026-10-12')).toBe(SUN);
    expect(sunOf(SUN)).toBe(SUN);
    expect(sunOf('2026-10-19')).toBe('2026-10-25');
    expect(sunRange(SUN)).toBe('Oct 12 to 18');
    expect(sunRange('2026-10-04')).toBe('Sep 28 to Oct 4');
  });

  it('counts what happened, up to today', () => {
    let d: Days = {};
    d = addEvent(d, '2026-10-13', 'rode', '21:30', { trigger: 'bored', did: ['move'] }, 1).days;
    d = addEvent(d, '2026-10-14', 'rode', '15:00', { trigger: 'bored', did: ['move'] }, 1).days;
    d = addEvent(d, '2026-10-15', 'slipped', '22:40', { trigger: 'stress' }, 1).days;
    d = addEvent(d, '2026-10-17', 'slipped', '23:10', { trigger: 'stress' }, 1).days;
    d['2026-10-12'] = day('2026-10-12', { checkin: ci({ h: 5, so: 'N' }), p: p({ po: '22:50' }) });
    d['2026-10-16'] = day('2026-10-16', { checkin: ci({ h: 6, so: 'N' }), p: p({ r: true }) });
    d['2026-10-13'] = { ...d['2026-10-13'], checkin: ci({ h: 5.5 }) };
    const w = sunWeek(d, st, SUN, SUN);
    expect(w).toMatchObject({ days: 7, noSlip: 5, rode: 2, slipped: 2, checkins: 3, lateSlips: 2, weekendSlips: 1, screensLate: 2, phone: 1, reach: 1 });
    expect(w.trig).toEqual({ bored: { rode: 2, slipped: 0 }, stress: { rode: 0, slipped: 2 } });
    expect(w.did).toEqual({ move: 2 });
    /* on Thursday, only Monday to Thursday */
    expect(sunWeek(d, st, SUN, '2026-10-15').days).toBe(4);

    expect(sunWorked(w, st).map((x) => [x.id, x.ev])).toEqual([
      ['ride', '2 urges ridden out'],
      ['did:move', '2 times'],
      ['reach', '1 day'],
      ['honest', ''],
    ]);
    expect(sunChange(w, st).map((x) => [x.t, x.ev])).toEqual([
      ['Late nights', '2 of 2 slips after 9 PM'],
      ['Stressed or anxious', '2 slips'],
      ['Screens on late', '2 nights'],
      ['Sleep', 'about 5.5 hours a night'],
      ['Checking in more', '3 of 7 days'],
    ]);
  });

  it('offers something kind even for a quiet week', () => {
    const w = sunWeek({}, st, SUN, SUN);
    expect(sunWorked(w, st)).toEqual([{ id: 'here', t: 'Showing up here', ev: '' }]);
    expect(sunChange(w, st).map((x) => x.t)).toEqual(['Checking in more', 'Evenings', 'My phone at night']);
  });
});

describe('the goal', () => {
  it('fits what is changing, and stays small', () => {
    expect(sunGoals(['late'], st).map((g) => g.t)).toEqual(['Phone away by 11:00 PM, 5 nights', 'Wind down before bed, 4 nights', 'Check in, 5 days']);
    expect(sunGoals(['trig:stress'], st)[0]).toEqual({ t: 'A short walk after work' });
    expect(sunGoals([], st).map((g) => g.k)).toEqual(['phone', 'checkin', 'lesson']);
    for (const g of sunGoals(['late', 'sleep', 'checkin', 'trig:lonely'], st)) if (g.n) expect(g.n).toBeLessThanOrEqual(5);
  });

  it('is counted through the week that follows, and shown on Today', () => {
    let reviews: Reviews = {};
    reviews = saveSun(reviews, '2026-10-11', { w: ['Riding out urges'], c: ['Late nights'], g: sunGoalOf('phone', st) }, 1000);
    const d: Days = {
      '2026-10-12': day('2026-10-12', { p: p({ po: '22:40' }) }),
      '2026-10-13': day('2026-10-13', { checkin: ci({ so: 'Y' }) }),
      '2026-10-14': day('2026-10-14', { checkin: ci({ so: 'N' }) }),
    };
    const now = sunGoalNow(d, reviews, '2026-10-14')!;
    expect(now).toMatchObject({ sun: SUN, done: 2, g: { k: 'phone', n: 5 } });
    expect(sunGoalLine(now.g, now.done, false)).toBe('2 of 5 nights so far.');
    expect(sunGoalLine(now.g, 5, true)).toBe('5 of 5 nights. Goal kept.');
    expect(sunGoalLine(now.g, 3, true)).toBe('3 of 5 nights. Every one of them counts.');
    expect(sunGoalLine(now.g, 0, true)).toBe('Not this week. A new week, a new try.');
    expect(sunGoalLine(now.g, 0, false)).toBe('Tonight can be the first of 5.');
    expect(sunLastGoal(d, reviews, SUN, SUN)).toMatchObject({ done: 2, met: false });
    expect(sunGoalCount(d, { t: 'A short walk' }, SUN, SUN)).toBeNull();
    /* the week after, it is gone */
    expect(sunGoalNow(d, reviews, '2026-10-20')).toBeNull();
  });
});

describe('when Today asks', () => {
  it('on Sunday, and on Monday while last week is still open', () => {
    expect(sunDue({}, st, SUN)).toEqual({ sun: SUN, late: false });
    expect(sunDue({}, st, '2026-10-19')).toEqual({ sun: SUN, late: true });
    expect(sunDue({}, st, '2026-10-20')).toBeNull();
    expect(sunDue({}, st, '2026-10-17')).toBeNull();
    const done = saveSun({}, SUN, { w: ['Checking in'], c: [], g: null }, 1);
    expect(sunDue(done, st, SUN)).toBeNull();
    expect(sunDue(done, st, '2026-10-19')).toBeNull();
  });
  it('not in the first two days', () => {
    expect(sunDue({}, normSettings({ start: '2026-10-17' }), SUN)).toBeNull();
    expect(sunDue({}, normSettings({ start: '2026-10-16' }), SUN)).toEqual({ sun: SUN, late: false });
  });
});

describe('the record', () => {
  it('keeps the answers as picked, and as text for older copies of the app', () => {
    const r = saveSun({}, SUN, { w: ['Riding out urges', ' riding out urges '], c: ['Late nights'], g: { t: 'A short walk after work' } }, 5)['s' + SUN];
    expect(r.sun).toEqual({ w: ['Riding out urges'], c: ['Late nights'], g: { t: 'A short walk after work' } });
    expect(r.a).toEqual({ hard: '', helped: 'Riding out urges', change: 'Late nights. My goal: A short walk after work', proud: '' });
    expect(sunList({ ['s' + SUN]: r }).map((x) => x.sun)).toEqual([SUN]);
  });
  it('cleans what comes from elsewhere', () => {
    expect(normSun({ w: ['x'.repeat(90), 3], c: 'no', g: { t: '  Phone away  ', k: 'phone', n: 9 }, last: 'maybe' })).toEqual({
      w: ['x'.repeat(60)],
      c: [],
      g: { t: 'Phone away' },
    });
    expect(normSun({ w: [], c: [], g: { t: 'Check in, 5 days', k: 'checkin', n: 5 }, last: 'some' })).toEqual({
      w: [],
      c: [],
      g: { t: 'Check in, 5 days', k: 'checkin', n: 5 },
      last: 'some',
    });
    expect(normSun(null)).toBeNull();
  });
  it('syncs under its Sunday, and an older weekly review stays as it was', () => {
    expect(isReviewKey('s2026-10-18')).toBe(true);
    expect(isReviewKey('s2026-13-45')).toBe(false);
    expect(isReviewKey('w3')).toBe(true);
    const rec = normRecord({ id: 'reviews/s2026-10-18', u: 5, data: { a: { helped: 'Walks' }, sun: { w: ['Walks'], c: [], g: null } } })!;
    expect((rec.data as { sun?: unknown }).sun).toEqual({ w: ['Walks'], c: [], g: null });
    expect('sun' in normReview({ a: { hard: 'x' }, sun: { w: ['y'] } }, 'w3')).toBe(false);
  });
  it('earns the review points once', () => {
    const base = gameCompute({}, st, {}, SUN).pts;
    const rv = saveSun({}, SUN, { w: [], c: [], g: { t: 'A short walk' } }, 1);
    expect(gameCompute({}, st, rv, SUN).pts - base).toBe(20);
    expect(gameCompute({}, st, saveSun(rv, SUN, { w: ['Walks'], c: [], g: null }, 2), SUN).pts - base).toBe(20);
  });
});
