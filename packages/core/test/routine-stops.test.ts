/* Every switch in "Change" shows on Your day (the owner, November 2, 2026: "when i switch it nothing happens"): calm move, reached
   out and the journal are stops with no time of day. The journal is never a daily win, so switching it takes nothing earned. */
import { describe, expect, it } from 'vitest';
import { normSettings, ROUTINE_KEYS, winsOf, winTally, dayPoints, gameCompute } from '../src/legacy/core.js';
import { reachMark, routineDay, stopTiles } from '../src/day';
import { jnStart } from '../src/journal-entries';
import { addEvent } from '../src/mutate';
import type { Days, Settings } from '../src/types';

const st = normSettings({ start: '2026-10-01', day1: '2026-10-08', screensOff: '22:30' }) as Settings;
const tk = '2026-10-18';
const at = (h: number, m = 0) => new Date(2026, 9, 18, h, m).getTime();
const keys = (d: Days, s: Settings = st, h = 12, jn?: Parameters<typeof stopTiles>[4]) => stopTiles(d, s, tk, at(h), jn).tiles.map((t) => t.k);

describe('the any-time stops', () => {
  it('the usual routine: calm move on, reached out and the journal off, after the lesson', () => {
    expect(st.routine.journal).toBe(false);
    expect(ROUTINE_KEYS).toContain('journal');
    expect(keys({})).toEqual(['lesson', 'calm', 'evening', 'night']);
    const t = stopTiles({}, st, tk, at(12)).tiles.find((x) => x.k === 'calm')!;
    expect(t).toMatchObject({ right: 'Any time', line: 'A tool or a 10-minute pause', go: 'calm', cur: false, done: false });
  });
  it('each switch shows or hides its stop at once', () => {
    let d = routineDay({}, st, tk, 'journal', true, 1);
    d = routineDay(d, st, tk, 'reach', true, 1);
    d = routineDay(d, st, tk, 'calm', false, 1);
    expect(keys(d)).toEqual(['lesson', 'reach', 'journal', 'evening', 'night']);
  });
  it('done when the day holds one, and a done one stays on the line when switched off', () => {
    const d0 = routineDay({}, st, tk, 'calm', false, 1);
    const d = addEvent(d0, tk, 'rode', '10:00', { paused: true }, 1).days;
    const calm = stopTiles(d, st, tk, at(12)).tiles.find((x) => x.k === 'calm')!;
    expect(calm).toMatchObject({ done: true, line: 'Done today', right: '' });
    const jn = jnStart({}, tk, 'Calm', 1).jn;
    const on = { ...st, routine: { ...st.routine, journal: true } };
    expect(stopTiles({}, on, tk, at(12), jn).tiles.find((x) => x.k === 'journal')).toMatchObject({ done: true, line: 'Written today' });
    expect(keys({}, st, 12, jn)).toContain('journal');
  });
  it('the night of a slip leaves only what was done, with the wind-down', () => {
    const d = addEvent({}, tk, 'slipped', '20:00', {}, 1).days;
    expect(keys(d, st, 22)).toEqual(['night']);
    expect(keys(d, st, 15)).toContain('calm');
  });
  it('the big card is never an any-time stop', () => {
    const on = { ...st, routine: { ...st.routine, journal: true, reach: true } };
    expect(['lesson', 'evening', 'night']).toContain(stopTiles({}, on, tk, at(12)).cur);
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
