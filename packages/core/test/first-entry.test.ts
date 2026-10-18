/* The log starts with the first real entry: blank days before it were never tracked, so they do not count as clean days,
   a first stretch or a pattern. The tracking start moves to the first entry, and so do a Day 1 and a step-down start that
   came before it, with a note. Dates picked by hand stay put. */
import { describe, expect, it } from 'vitest';
import { normSettings, streaks } from '../src/legacy/core.js';
import { firstLog, loggedDay, logStart, setDate, startFromLog } from '../src/actions';
import { morningDone, phoneAway, setScreensOff } from '../src/day';
import { keepHard } from '../src/risk';
import { addEvent } from '../src/mutate';
import { recordLesson } from '../src/lessons';
import { LESSONS } from '../src/legacy/core.js';
import { patGaps } from '../src/pattern';
import { calMonth } from '../src/calendar';
import type { Days } from '../src/types';

/* set up on Tuesday the 6th, a tracking week, so Day 1 was Tuesday the 13th; the first entry is Saturday the 17th */
const st = normSettings({ start: '2026-10-06', day1: '2026-10-13' });
const tk = '2026-10-18';
const log = (): Days => addEvent({}, '2026-10-17', 'rode', '21:00', {}, 1).days;

describe('the first log', () => {
  it('is an urge or slip logged, or a check-in answered, not a lesson or what the app keeps by itself', () => {
    expect(loggedDay(undefined)).toBe(false);
    expect(loggedDay(log()['2026-10-17'])).toBe(true);
    expect(loggedDay(morningDone({}, '2026-10-16', 1)['2026-10-16'])).toBe(true);
    expect(loggedDay(phoneAway({}, '2026-10-16', '22:40', 1)['2026-10-16'])).toBe(false);
    expect(loggedDay(recordLesson({}, '2026-10-16', LESSONS[0], 1).days['2026-10-16'])).toBe(false);
    /* last night's screens, answered the next morning, sit on the night before */
    expect(loggedDay(setScreensOff({}, '2026-10-16', 'Y', 1)['2026-10-16'])).toBe(false);
    expect(loggedDay(keepHard({}, '2026-10-15', 22)['2026-10-15'])).toBe(false);
    expect(firstLog({ ...keepHard({}, '2026-10-15', 22), ...log() })).toBe('2026-10-17');
  });
});

/* set up on Thursday the 8th with a lesson read, nothing logged until the 11th, slips on the 12th, 15th and 16th */
describe('a lesson on setup day, and the first log three days later', () => {
  const sd = normSettings({ start: '2026-10-08', day1: '2026-10-15', cleanMode: 'step', stepAt: '2026-10-08' });
  let days = recordLesson({}, '2026-10-08', LESSONS[0], 1).days;
  days = addEvent(days, '2026-10-11', 'rode', '20:00', {}, 1).days;
  for (const k of ['2026-10-12', '2026-10-15', '2026-10-16']) days = addEvent(days, k, 'slipped', '22:00', {}, 1).days;
  it('the start moves to the first log', () => {
    expect(startFromLog(days, sd, tk)!.st.start).toBe('2026-10-11');
  });
  it('the days before it are not a first stretch, even with something kept on them', () => {
    const moved = startFromLog(days, sd, tk)!.st;
    const g = patGaps(days, moved, tk);
    expect(g.runs).toEqual([1, 2, 0]);
    expect(g.now).toBe(1);
    expect(logStart(days, moved)).toBe('2026-10-11');
    expect(calMonth(days, moved, tk, '2026-10').days.find((d) => d.k === '2026-10-09')!.kind).toBe('before');
  });
  it('an entry from before a later start still opens the log', () => {
    expect(logStart(days, normSettings({ start: '2026-10-14', day1: null }))).toBe('2026-10-11');
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
