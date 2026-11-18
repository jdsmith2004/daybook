/* Today's one next step (next-step.ts): exactly one stop on the line is next, across the times and states of a day. */
import { describe, expect, it } from 'vitest';
import { blankP, LESSONS, normSettings } from '../src/legacy/core.js';
import { pickMoment } from '../src/moment';
import { addEvent, changeDay, withDay } from '../src/mutate';
import { nightPage } from '../src/two-moments';
import { todayLine } from '../src/next-step';
import type { Days, Reviews } from '../src/types';

/* started October 7, Day 1 October 14; October 18 is a Sunday, October 20 a Tuesday */
const st = normSettings({ start: '2026-10-07', day1: '2026-10-14', wk1: '2026-10-15' });
const at = (d: number, h: number, m = 0) => new Date(2026, 9, d, h, m).getTime();
const day = (k: string, p: object, days: Days = {}): Days =>
  withDay(
    days,
    k,
    changeDay(days[k], k, (x) => void (x.p = { ...blankP(), ...p }), 1),
  );
const told = (k: string, days: Days = {}) => day(k, { ms: { at: at(1, 6), set: at(1, 6) } }, days);
const read = (k: string, days: Days = {}) => day(k, { ms: { at: at(1, 6), set: at(1, 6) }, ls: [LESSONS[0].id] }, days);
const one = (days: Days, tk: string, now: number, reviews: Reviews = {}) => {
  const l = todayLine(days, st, reviews, tk, now);
  /* never two: at most one stop is the next step, and it is the one named */
  expect(l.tiles.filter((t) => t.cur).length).toBe(l.next ? 1 : 0);
  if (l.next) expect(l.tiles.find((t) => t.cur)?.k).toBe(l.next.k);
  return l;
};
const done = { '2026-10-11': { sun: {} } } as unknown as Reviews;

describe('one next step', () => {
  it('the morning, while it is open and not told', () => {
    expect(one({}, '2026-10-20', at(20, 7)).next?.k).toBe('morning');
  });
  it('morning told: the lesson', () => {
    expect(one(told('2026-10-20'), '2026-10-20', at(20, 9))).toMatchObject({ next: { k: 'lesson' }, why: 'day' });
  });
  it('after the morning hours, a morning still open is a quiet row and the lesson leads', () => {
    const l = one({}, '2026-10-20', at(20, 14));
    expect(l.next?.k).toBe('lesson');
    expect(l.tiles.find((t) => t.k === 'morning')).toMatchObject({ done: false, cur: false });
  });
  it('lesson done: the check-in', () => {
    expect(one(read('2026-10-20'), '2026-10-20', at(20, 15)).next?.k).toBe('evening');
  });
  it('on Sunday, the review is on the line, after the morning, and it is next', () => {
    const l = one(told('2026-10-18'), '2026-10-18', at(18, 10), done);
    expect(l.tiles.map((t) => t.k).slice(0, 3)).toEqual(['morning', 'sunday', 'lesson']);
    expect(l).toMatchObject({ next: { k: 'sunday', go: 'review', id: '2026-10-18' }, why: 'sunday' });
  });
  it('on Sunday morning, the morning first, then the review', () => {
    expect(one({}, '2026-10-18', at(18, 7), done).next?.k).toBe('morning');
  });
  it('the screenshot: Sunday, lesson done, check-in later: the review is the one step, the check-in a row', () => {
    const l = one(read('2026-10-18'), '2026-10-18', at(18, 15), done);
    expect(l.next?.k).toBe('sunday');
    expect(l.tiles.find((t) => t.k === 'evening')?.cur).toBe(false);
    /* and Today has no second card above the line */
    expect(pickMoment(read('2026-10-18'), st, done, '2026-10-18', at(18, 15)).card).toMatchObject({ k: 'calm', go: 'review' });
  });
  it('the review done: the day goes on', () => {
    const r = { ...done, 's2026-10-18': { sun: { g: null } } } as unknown as Reviews;
    const l = one(read('2026-10-18'), '2026-10-18', at(18, 15), r);
    expect(l.tiles.some((t) => t.k === 'sunday')).toBe(false);
    expect(l.next?.k).toBe('evening');
  });
  it('the first review ever opens its own page first; on Monday it is still open, without that page', () => {
    expect(one(told('2026-10-18'), '2026-10-18', at(18, 10)).next).toMatchObject({ k: 'sunday', intro: true });
    const mon = one(told('2026-10-19'), '2026-10-19', at(19, 10)).next;
    expect(mon).toMatchObject({ k: 'sunday', head: 'Look back on last week' });
    expect(mon?.intro).toBeUndefined();
    expect(one(told('2026-10-20'), '2026-10-20', at(20, 10)).tiles.some((t) => t.k === 'sunday')).toBe(false);
  });
  it("a slip day: the card is the day's next stop, as on any day (the owner, November 18, 2026)", () => {
    const d = addEvent(told('2026-10-20'), '2026-10-20', 'slipped', '09:00', {}, 1).days;
    const pick = (x: typeof d) => {
      const c = pickMoment(x, st, {}, '2026-10-20', at(20, 11)).card;
      return [c.k, c.h, c.go, c.v, c.btn];
    };
    expect(pick(d)).toEqual(pick(told('2026-10-20')));
  });
  it('the night page: after the night hour, Good night is the one step', () => {
    const d = day('2026-10-20', { ms: { at: at(1, 6), set: at(1, 6) }, ls: [LESSONS[0].id] });
    const late = at(20, 23);
    expect(nightPage(d, st, '2026-10-20', late)).toBe(true);
  });
  it('the setup night: lesson 1 is the one step', () => {
    const s0 = normSettings({ start: '2026-10-20', day1: '2026-10-20', wk1: '2026-10-21' });
    expect(nightPage({}, s0, '2026-10-20', at(20, 23))).toBe(false);
    const l = todayLine({}, s0, {}, '2026-10-20', at(20, 23));
    expect(l.next?.k).toBe('lesson');
    expect(l.tiles.filter((t) => t.cur).length).toBe(1);
  });
  it('everything done: no next step, and nothing highlighted', () => {
    const off = normSettings({ ...st, routine: { morning: false, lesson: false, calm: false, reach: false, checkin: false, wind: false } });
    const l = todayLine({}, off, done, '2026-10-20', at(20, 21));
    expect(l.next).toBeNull();
    expect(l.tiles.some((t) => t.cur)).toBe(false);
  });
});
