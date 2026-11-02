/* Every switch in "Change" shows on Your day (the owner, November 2, 2026: "when i switch it nothing happens"): reaching out and the
   journal are stops with no time of day. The journal is never a daily win, so switching it takes nothing earned. Calm move is not a
   switch at all ("that's part of SOS"): it still counts as a win when done, and is never a stop. */
import { describe, expect, it } from 'vitest';
import { normSettings, ROUTINE_KEYS, winsOf, winTally, dayPoints, gameCompute } from '../src/legacy/core.js';
import { reachMark, routineChanged, routineDay, ROUTINE_SHOWN, stopTiles } from '../src/day';
import { jnStart } from '../src/journal-entries';
import { addEvent } from '../src/mutate';
import type { Days, Settings } from '../src/types';

const st = normSettings({ start: '2026-10-01', day1: '2026-10-08', screensOff: '22:30' }) as Settings;
const tk = '2026-10-18';
const at = (h: number, m = 0) => new Date(2026, 9, 18, h, m).getTime();
const keys = (d: Days, s: Settings = st, h = 12, jn?: Parameters<typeof stopTiles>[4]) => stopTiles(d, s, tk, at(h), jn).tiles.map((t) => t.k);

describe('the any-time stops', () => {
  it('the usual routine: reaching out and the journal off, so the day is the lesson, the check-in and the wind-down', () => {
    expect(st.routine.journal).toBe(false);
    expect(ROUTINE_KEYS).toContain('journal');
    expect(keys({})).toEqual(['lesson', 'evening', 'night']);
  });
  it('each switch shows or hides its stop at once, after the lesson', () => {
    let d = routineDay({}, st, tk, 'journal', true, 1);
    d = routineDay(d, st, tk, 'reach', true, 1);
    expect(keys(d)).toEqual(['lesson', 'reach', 'journal', 'evening', 'night']);
    const t = stopTiles(d, st, tk, at(12)).tiles.find((x) => x.k === 'journal')!;
    expect(t).toMatchObject({ right: 'Any time', line: 'A few words about the day', go: 'journal', cur: false, done: false });
  });
  it('done with an entry today, and a done one stays on the line when switched off', () => {
    const jn = jnStart({}, tk, 'Calm', 1).jn;
    const on = { ...st, routine: { ...st.routine, journal: true } };
    expect(stopTiles({}, on, tk, at(12), jn).tiles.find((x) => x.k === 'journal')).toMatchObject({ done: true, line: 'Written today' });
    expect(keys({}, st, 12, jn)).toContain('journal');
  });
  it('the night of a slip leaves only what was done, with the wind-down', () => {
    const on = { ...st, routine: { ...st.routine, journal: true } };
    const d = addEvent({}, tk, 'slipped', '20:00', {}, 1).days;
    expect(keys(d, on, 22)).toEqual(['night']);
    expect(keys(d, on, 15)).toContain('journal');
  });
  it('the big card is never an any-time stop', () => {
    const on = { ...st, routine: { ...st.routine, journal: true, reach: true } };
    expect(['lesson', 'evening', 'night']).toContain(stopTiles({}, on, tk, at(12)).cur);
  });
});

describe('calm move', () => {
  it('is not a switch or a stop, and a day that switched it off before says nothing about it', () => {
    expect(ROUTINE_SHOWN.map((x) => x.k)).not.toContain('calm');
    const off = routineDay({}, st, tk, 'calm', false, 1);
    expect(routineChanged(st, off[tk].p)).toBe(0);
    const d = addEvent({}, tk, 'rode', '10:00', { paused: true }, 1).days;
    expect(keys(d)).not.toContain('calm');
  });
  it('still counts as a daily win when done, as it always has', () => {
    const d = addEvent({}, tk, 'rode', '10:00', { paused: true }, 1).days;
    expect(winsOf(d, tk, st).calm).toBe(true);
  });
});

describe('reached out', () => {
  it('a tap marks today, the same reach the daily wins count, and a second tap takes nothing away', () => {
    const before = stopTiles({}, { ...st, routine: { ...st.routine, reach: true } }, tk, at(12)).tiles.find((x) => x.k === 'reach')!;
    expect(before).toMatchObject({ title: 'Reach out', done: false });
    const d = reachMark({}, tk, 1);
    expect(winsOf(d, tk, st).reach).toBe(true);
    expect(stopTiles(d, st, tk, at(12)).tiles.find((x) => x.k === 'reach')).toMatchObject({ title: 'Reached out', done: true, line: 'Reached someone today' });
    expect(reachMark(d, tk, 2)).toBe(d);
  });
});

describe('the journal takes nothing earned', () => {
  it('switching it on or off changes no win, ring or points', () => {
    let d: Days = addEvent({}, tk, 'rode', '10:00', { paused: true }, 1).days;
    d = reachMark(d, tk, 2);
    const on = routineDay(d, st, tk, 'journal', true, 3);
    for (const x of [d, on]) {
      expect(winTally(winsOf(x, tk, st))).toEqual(winTally(winsOf(d, tk, st)));
      expect(dayPoints(x, tk, st)).toEqual(dayPoints(d, tk, st));
    }
    const everOn = { ...st, routine: { ...st.routine, journal: true } };
    expect(gameCompute(d, everOn, {}, tk).pts).toBe(gameCompute(d, st, {}, tk).pts);
  });
});
