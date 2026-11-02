/* The time picker: a moment as the person picks it, filed under the right log day, with its words and quick picks. */
import { describe, expect, it } from 'vitest';
import {
  whenClock,
  whenCountsFor,
  whenDays,
  whenDayWord,
  whenEntry,
  whenFiledUnder,
  whenFromEntry,
  whenFuture,
  whenLabel,
  whenMs,
  whenOf,
  whenPast,
  whenQuick,
  whenStart,
} from '../src/when';

/* Sunday, Oct 18 2026, 9:47 PM, and the day rolls over at 4 AM */
const NOW = new Date(2026, 9, 18, 21, 47).getTime();
const ROLL = 4;

describe('a picked moment', () => {
  it('is filed under its log day, so after midnight belongs to the day before', () => {
    expect(whenEntry({ day: '2026-10-18', h: 21, m: 47 }, ROLL)).toEqual({ key: '2026-10-18', time: '21:47' });
    expect(whenEntry({ day: '2026-10-18', h: 1, m: 30 }, ROLL)).toEqual({ key: '2026-10-17', time: '01:30' });
    expect(whenFiledUnder({ day: '2026-10-18', h: 1, m: 30 }, ROLL)).toBe('2026-10-17');
    expect(whenFiledUnder({ day: '2026-10-18', h: 9, m: 0 }, ROLL)).toBeNull();
  });
  it('comes back from an entry the same way', () => {
    expect(whenFromEntry('2026-10-17', '01:30', ROLL)).toEqual({ day: '2026-10-18', h: 1, m: 30 });
    expect(whenFromEntry('2026-10-17', '23:10', ROLL)).toEqual({ day: '2026-10-17', h: 23, m: 10 });
    expect(whenOf(whenMs({ day: '2026-10-12', h: 7, m: 5 }))).toEqual({ day: '2026-10-12', h: 7, m: 5 });
  });
  it('starts at now, or on an earlier day at the time it is now', () => {
    expect(whenStart('2026-10-18', NOW, ROLL)).toEqual({ day: '2026-10-18', h: 21, m: 47 });
    expect(whenStart('2026-10-15', NOW, ROLL)).toEqual({ day: '2026-10-15', h: 21, m: 47 });
    /* at 1 AM, today's log day is still yesterday: the start is now, not tomorrow night */
    const late = new Date(2026, 9, 19, 1, 0).getTime();
    expect(whenStart('2026-10-18', late, ROLL)).toEqual({ day: '2026-10-19', h: 1, m: 0 });
  });
  it('cannot be later than now', () => {
    expect(whenFuture({ day: '2026-10-18', h: 22, m: 30 }, NOW)).toBe(true);
    expect(whenFuture({ day: '2026-10-18', h: 21, m: 47 }, NOW)).toBe(false);
  });
});

describe('the words', () => {
  it('say the day and the time plainly', () => {
    expect(whenClock({ day: '2026-10-18', h: 0, m: 5 })).toBe('12:05 AM');
    expect(whenClock({ day: '2026-10-18', h: 12, m: 0 })).toBe('12:00 PM');
    expect(whenLabel({ day: '2026-10-18', h: 21, m: 47 }, NOW)).toBe('Today · 9:47 PM');
    expect(whenDayWord('2026-10-17', NOW)).toBe('Yesterday');
    expect(whenDayWord('2026-10-15', NOW)).toBe('Thu, Oct 15');
  });
  it('offer the days back from today, and quick picks that fit the hour', () => {
    expect(whenDays(NOW, 3)).toEqual(['2026-10-18', '2026-10-17', '2026-10-16']);
    expect(whenQuick(NOW, ROLL).map((q) => q.label)).toEqual(['Just now', '1 hour ago', '2 hours ago']);
    const morning = new Date(2026, 9, 19, 10, 15).getTime();
    const q = whenQuick(morning, ROLL);
    expect(q.map((x) => x.label)).toEqual(['Just now', '1 hour ago', 'Last night']);
    expect(whenEntry(q[2].w, ROLL)).toEqual({ key: '2026-10-18', time: '23:00' });
  });
  it('say which day a moment after midnight counts for, by name', () => {
    expect(whenCountsFor({ day: '2026-10-18', h: 1, m: 30 }, ROLL)).toBe('After midnight, so it counts for Saturday.');
    expect(whenCountsFor({ day: '2026-10-18', h: 4, m: 0 }, ROLL)).toBeNull();
    expect(whenCountsFor({ day: '2026-10-18', h: 21, m: 47 }, ROLL)).toBeNull();
  });
});

describe('a moment on the wheels', () => {
  /* 1:10 AM on Monday, before the rollover: the person is still on Sunday's log day */
  const SMALL = new Date(2026, 9, 19, 1, 10).getTime();
  it('stays as it is when it has already happened', () => {
    const w = { day: '2026-10-17', h: 23, m: 40 };
    expect(whenPast(w, NOW, ROLL)).toEqual(w);
    expect(whenPast({ day: '2026-10-18', h: 21, m: 47 }, NOW, ROLL)).toEqual({ day: '2026-10-18', h: 21, m: 47 });
  });
  it('goes back to now when it is just ahead of it', () => {
    expect(whenPast({ day: '2026-10-18', h: 22, m: 10 }, NOW, ROLL)).toEqual({ day: '2026-10-18', h: 21, m: 47 });
    expect(whenPast({ day: '2026-10-19', h: 1, m: 40 }, SMALL, ROLL)).toEqual({ day: '2026-10-19', h: 1, m: 10 });
  });
  it('means the last time the clock said it when it is further ahead today', () => {
    /* at 1:10 AM, 11:40 PM is an hour and a half ago, on Sunday: where the person's log day already is */
    const last = whenPast({ day: '2026-10-19', h: 23, m: 40 }, SMALL, ROLL);
    expect(last).toEqual({ day: '2026-10-18', h: 23, m: 40 });
    expect(whenEntry(last, ROLL)).toEqual({ key: '2026-10-18', time: '23:40' });
  });
  it('does not go back before the first day of the log', () => {
    /* started on Sunday: last night is still fine; started today, last night is not there, so it is now */
    expect(whenPast({ day: '2026-10-19', h: 23, m: 40 }, SMALL, ROLL, '2026-10-18')).toEqual({ day: '2026-10-18', h: 23, m: 40 });
    expect(whenPast({ day: '2026-10-18', h: 23, m: 40 }, NOW, ROLL, '2026-10-18')).toEqual({ day: '2026-10-18', h: 21, m: 47 });
    /* 1:30 AM on the first calendar day counts for the day before it, so it moves up to the first moment of the log */
    expect(whenPast({ day: '2026-10-18', h: 1, m: 30 }, NOW, ROLL, '2026-10-18')).toEqual({ day: '2026-10-18', h: 4, m: 0 });
  });
});
