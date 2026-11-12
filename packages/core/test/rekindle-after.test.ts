/* Rekindle after the owner's rethink (November 12, 2026): lighting the fire is the ending; what is kept is said as who the person
   is; one quiet lesson is the only "more"; no point number in the hours after a slip, while the points are still earned. */
import { describe, expect, it } from 'vitest';
import * as core from '../src/index';
import type { Days } from '../src/types';

const day = (n: number) => core.addDays('2026-10-31', n); // day(1) is November 1
const at = (n: number, h: number, m = 0) => {
  const [y, mo, d] = day(n).split('-').map(Number);
  return new Date(y, mo - 1, d, h, m).getTime();
};
const st = core.normSettings({ start: day(1), day1: day(1), countFrom: day(1) });
const slip = (d: Days, n: number, time: string | null = '23:10'): Days => core.addEvent(d, day(n), 'slipped', time, {}, at(n + 1, 7)).days;
const rode = (d: Days, n: number): Days => core.addEvent(d, day(n), 'rode', '21:40', {}, at(n, 22)).days;
const read = (d: Days, n: number, ids: string[]): Days => {
  const x = d[day(n)] || { d: day(n), events: [], checkin: null, p: null, u: 1 };
  const p = { w: [], wd: false, r: false, c: 0, m: false, tl: [], po: null, ls: ids, lv: [], ov: {} };
  return { ...d, [day(n)]: core.normDay({ ...x, p }, day(n)) };
};

describe('after the fire is lit, what is kept, as who the person is', () => {
  it('the urges ridden out and the days free of it, never a level or points', () => {
    const d = slip(rode(rode(rode(rode({}, 2), 4), 6), 8), 14);
    expect(core.rkLitLine(d, st, {}, day(14), day(14))).toBe('4 urges ridden out, 13 days free of it. All still yours.');
  });
});

describe('the one quiet "more": a lesson for after a slip', () => {
  it('what therapy is like first, then the next one not read yet, then the first again', () => {
    expect(core.rkLesson({}, st, false)).toBe('l24');
    expect(core.rkLesson(read({}, 2, ['l24']), st, false)).toBe('l6');
    expect(core.rkLesson(read({}, 2, ['l24', 'l6']), st, false)).toBe('l3');
    expect(core.rkLesson(read({}, 2, ['l24', 'l6', 'l3', 'l31', 'l27']), st, false)).toBe('l24');
  });
  it('after a second slip in a week, what therapy is like, even when it was read before', () => {
    expect(core.rkLesson(read({}, 2, ['l24']), st, true)).toBe('l24');
  });
  it('a faith lesson only on a path with faith', () => {
    const noFaith = core.normSettings({ ...st, onb: { n: 1, at: 1, a: { faith: 'no' } } });
    expect(core.rkLesson(read({}, 2, ['l24', 'l6', 'l3']), noFaith, false)).toBe('l27');
    expect(core.rkLesson(read({}, 2, ['l24', 'l6', 'l3']), st, false)).toBe('l31');
  });
});

describe('no point number in the hours after a slip', () => {
  const d = slip({}, 10, '23:10');
  it('for twelve hours after the latest slip', () => {
    expect(core.ptsQuiet(d, st, at(10, 23, 20))).toBe(true);
    expect(core.ptsQuiet(d, st, at(11, 11, 0))).toBe(true);
    expect(core.ptsQuiet(d, st, at(11, 11, 15))).toBe(false);
    expect(core.ptsQuiet({}, st, at(11, 9))).toBe(false);
  });
  it('a slip told the next morning counts from when it was logged', () => {
    const told = slip({}, 10, null);
    expect(core.ptsQuiet(told, st, at(11, 7, 5))).toBe(true);
    expect(core.ptsQuiet(told, st, at(11, 19, 30))).toBe(false);
  });
  it('the slip day’s page shows no points, and they are still earned', () => {
    expect(core.daySummary(d, st, day(10), day(12)).pts).toBe(0);
    expect(core.dayPoints(d, day(10), st).total).toBeGreaterThan(0);
  });
});

describe('the morning’s quiet way in', () => {
  it('opens a slip that is there, and nothing else', () => {
    const told = slip({}, 10, null);
    const id = told[day(10)].events[0].id;
    expect(core.rkOpenFor(told, day(10), id)).toBe(true);
    expect(core.rkOpenFor(told, day(10), 'nope')).toBe(false);
  });
});
