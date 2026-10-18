/* Counting starts with the first real entry: blank days between Day 1 and the first thing logged are not counted. Day 1
   moves to that entry (and the tracking start to the day before it), with a note. A Day 1 picked by hand stays put. */
import { describe, expect, it } from 'vitest';
import { normSettings, streaks } from '../src/legacy/core.js';
import { day1FromLog, firstEntry, realDay, setDate } from '../src/actions';
import { morningDone, phoneAway, setScreensOff } from '../src/day';
import { keepHard } from '../src/risk';
import { addEvent } from '../src/mutate';
import type { Days } from '../src/types';

/* set up on Tuesday the 6th, a tracking week, so Day 1 was Tuesday the 13th; the first entry is Saturday the 17th */
const st = normSettings({ start: '2026-10-06', day1: '2026-10-13' });
const tk = '2026-10-18';
const log = (): Days => addEvent({}, '2026-10-17', 'rode', '21:00', {}, 1).days;

describe('the first real entry', () => {
  it('is something the person logged or did, not what the app filled in', () => {
    expect(realDay(undefined)).toBe(false);
    expect(realDay(log()['2026-10-17'])).toBe(true);
    expect(realDay(phoneAway({}, '2026-10-16', '22:40', 1)['2026-10-16'])).toBe(true);
    /* last night's screens, answered the next morning, sit on the night before */
    expect(realDay(setScreensOff({}, '2026-10-16', 'Y', 1)['2026-10-16'])).toBe(false);
    expect(realDay(keepHard({}, '2026-10-15', 22)['2026-10-15'])).toBe(false);
    expect(firstEntry({ ...keepHard({}, '2026-10-15', 22), ...log() })).toBe('2026-10-17');
  });
});

describe('Day 1 moves to the first entry', () => {
  it('when the blank days came before any entry', () => {
    const days = log();
    expect(streaks(days, st, tk).clean).toBe(6);
    const c = day1FromLog(days, st, tk)!;
    expect(c.st.day1).toBe('2026-10-17');
    expect(c.st.start).toBe('2026-10-16');
    expect(c.toast).toBe('Counting now starts Saturday, Oct 17, your first entry. Days before it had nothing logged, so they do not count.');
    expect(streaks(days, c.st, tk).clean).toBe(2);
    /* once is enough */
    expect(day1FromLog(days, c.st, tk)).toBe(null);
  });
  it('not when the log started before Day 1 (a gap after it still counts)', () => {
    const days = { ...addEvent({}, '2026-10-08', 'rode', '20:00', {}, 1).days, ...log() };
    expect(day1FromLog(days, st, tk)).toBe(null);
  });
  it('not before anything is logged, and not for a Day 1 still to come or today', () => {
    expect(day1FromLog({}, st, tk)).toBe(null);
    expect(day1FromLog(log(), normSettings({ start: '2026-10-16', day1: '2026-10-18' }), tk)).toBe(null);
    expect(day1FromLog(log(), normSettings({ start: '2026-10-10', day1: '2026-10-20' }), tk)).toBe(null);
  });
  it('not for a Day 1 picked by hand', () => {
    const hand = setDate(st, 'day1', '2026-10-12').st;
    expect(hand.d1Hand).toBe('2026-10-12');
    expect(day1FromLog(log(), hand, tk)).toBe(null);
  });
  it('a morning answered on the first day counts that day, not the night before', () => {
    let days = setScreensOff({}, '2026-10-16', 'Y', 1);
    days = morningDone(days, '2026-10-17', 2);
    expect(day1FromLog(days, st, tk)!.st.day1).toBe('2026-10-17');
  });
});
