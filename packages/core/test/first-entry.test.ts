/* The log starts with the first real entry: blank days before it were never tracked, so they do not count as clean days,
   a first stretch or a pattern. The tracking start moves to the first entry, and so do a Day 1 and a step-down start that
   came before it, with a note. Dates picked by hand stay put. */
import { describe, expect, it } from 'vitest';
import { normSettings, streaks } from '../src/legacy/core.js';
import { firstEntry, realDay, setDate, startFromLog } from '../src/actions';
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

describe('the log starts with the first entry', () => {
  it('counting that began before any entry starts on the first entry', () => {
    const days = log();
    expect(streaks(days, st, tk).clean).toBe(6);
    const c = startFromLog(days, st, tk)!;
    expect([c.st.start, c.st.day1]).toEqual(['2026-10-17', '2026-10-17']);
    expect(c.toast).toBe('Counting now starts Saturday, Oct 17, your first entry. Days before it had nothing logged, so they do not count.');
    expect(streaks(days, c.st, tk).clean).toBe(2);
    /* once is enough */
    expect(startFromLog(days, c.st, tk)).toBe(null);
  });
  it('stepping down: blank days before the first entry are not a first stretch', () => {
    const sd = normSettings({ start: '2026-10-08', day1: '2026-10-15', cleanMode: 'step', stepAt: '2026-10-08' });
    let days = addEvent({}, '2026-10-11', 'rode', '20:00', {}, 1).days;
    days = addEvent(days, '2026-10-12', 'slipped', '22:00', {}, 1).days;
    const c = startFromLog(days, sd, tk)!;
    expect([c.st.start, c.st.day1, c.st.stepAt]).toEqual(['2026-10-11', '2026-10-15', '2026-10-11']);
    expect(c.toast).toMatch(/^Your log now starts Sunday, Oct 11, your first entry\./);
  });
  it('a start a few blank days before the first entry moves too, before Day 1 comes', () => {
    const days = { ...addEvent({}, '2026-10-08', 'rode', '20:00', {}, 1).days, ...log() };
    const c = startFromLog(days, st, tk)!;
    expect([c.st.start, c.st.day1]).toEqual(['2026-10-08', '2026-10-13']);
  });
  it('nothing to move: nothing logged, or the log already starts with an entry', () => {
    expect(startFromLog({}, st, tk)).toBe(null);
    expect(startFromLog(log(), normSettings({ start: '2026-10-17', day1: '2026-10-18' }), tk)).toBe(null);
  });
  it('dates picked by hand stay put', () => {
    const d1 = setDate(st, 'day1', '2026-10-12').st;
    expect(d1.d1Hand).toBe('2026-10-12');
    expect(startFromLog(log(), d1, tk)).toBe(null);
    const s0 = setDate(normSettings({ start: '2026-10-16', day1: null }), 'start', '2026-10-10').st;
    expect(s0.startHand).toBe('2026-10-10');
    expect(startFromLog(log(), s0, tk)).toBe(null);
  });
  it('Day 1 can be the day tracking starts', () => {
    expect(setDate(normSettings({ start: '2026-10-17', day1: null }), 'day1', '2026-10-17').st.day1).toBe('2026-10-17');
    expect(normSettings({ start: '2026-10-17', day1: '2026-10-17' }).day1).toBe('2026-10-17');
  });
  it('a morning answered on the first day counts that day, not the night before', () => {
    let days = setScreensOff({}, '2026-10-16', 'Y', 1);
    days = morningDone(days, '2026-10-17', 2);
    expect(startFromLog(days, st, tk)!.st.start).toBe('2026-10-17');
  });
});
