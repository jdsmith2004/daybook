/* Map your day: cleaning a saved map, the time of the hard hour, the plan in one line, "Did it hold?", and the stars. */
import { describe, expect, it } from 'vitest';
import { holdMap, saveMap } from '../src/day';
import {
  MAP_MOVES,
  mapAsk,
  mapClock,
  mapIfThen,
  mapMoves,
  mapOf,
  mapPhase,
  mapStars,
  mapStart,
  mapThoughts,
  mapTime,
  normMap,
  type DayMap,
} from '../src/daymap';
import { normDay } from '../src/legacy/core.js';
import type { Days } from '../src/types';

const at = (s: string) => new Date(s).getTime();
const storm: DayMap = { o: 'proud', h: 17 * 60, l: ['alone', 'owed'], m: ['people'], r: null };

describe('normMap', () => {
  it('keeps what is known and drops the rest', () => {
    expect(normMap({ o: 'x', h: 17 * 60, l: ['alone', 'nope', 'alone'], m: ['fill', 9], r: 'y' })).toEqual({
      o: null,
      h: 1020,
      l: ['alone'],
      m: ['fill'],
      r: 'y',
    });
    expect(normMap({ o: 'free', h: null, l: ['alone'], m: ['fill'], r: 'y' })).toEqual({ o: 'free', h: null, l: [], m: [], r: null });
    expect(normMap({ h: 27 * 60 })!.h).toBeNull();
    expect(normMap(null)).toBeNull();
  });
  it('survives in a saved day, and an old day has none', () => {
    const d = normDay({ d: '2026-10-17', events: [], p: { c: 1, mp: storm } }, '2026-10-17');
    expect(d.p!.mp).toEqual(storm);
    const old = normDay({ d: '2026-10-17', events: [], p: { c: 1 } }, '2026-10-17');
    expect('mp' in old.p!).toBe(false);
  });
});

describe('the hard hour', () => {
  it('reads as a clock, also after midnight', () => {
    expect(mapClock(17 * 60 + 30)).toBe('5:30 PM');
    expect(mapClock(24 * 60 + 30)).toBe('12:30 AM');
    expect(mapTime('2026-10-17', 25 * 60)).toBe(at('2026-10-18T01:00:00'));
  });
  it('starts at the next half hour, not before 5 AM, and ends at 2 AM', () => {
    expect(mapStart('2026-10-17', at('2026-10-17T07:10:00'))).toBe(7 * 60 + 30);
    expect(mapStart('2026-10-17', at('2026-10-17T03:00:00'))).toBe(5 * 60);
    expect(mapStart('2026-10-17', at('2026-10-18T01:40:00'))).toBe(26 * 60);
    expect(mapStart('2026-10-17', at('2026-10-18T02:10:00'))).toBeNull();
  });
});

describe('the plan', () => {
  it('offers the moves that break a picked link first', () => {
    expect(mapMoves([]).map((m) => m[0])).toEqual(MAP_MOVES.map((m) => m[0]));
    expect(mapMoves(['alone'])[0][0]).toBe('people');
    expect(mapMoves(['owed'])[0][0]).toBe('fill');
  });
  it('answers only the thoughts picked', () => {
    expect(mapThoughts(['alone'])).toEqual([]);
    expect(mapThoughts(['anyway', 'owed']).map((t) => t[0])).toEqual(['I am owed this.', 'I will slip anyway, so why fight it.']);
  });
  it('reads as one if-then line', () => {
    expect(mapIfThen(storm)).toBe('If it is 5:00 PM and no one is around, then I go where people are.');
    expect(mapIfThen({ h: 21 * 60, l: [], m: ['away', 'text'] })).toBe('If it is 9:00 PM, then I put the device out of reach and text someone.');
    expect(mapIfThen({ h: null, l: [], m: [] })).toBe('');
  });
});

describe('saving and holding', () => {
  const k = '2026-10-17';
  it('counts the first map and a storm that held as calm moves, once each', () => {
    let days: Days = {};
    days = saveMap(days, k, storm, 1);
    expect(mapOf(days, k)).toEqual(storm);
    expect(days[k]!.p!.c).toBe(1);
    days = saveMap(days, k, { ...storm, m: ['fill'] }, 2);
    expect(days[k]!.p!.c).toBe(1);
    days = holdMap(days, k, 'y', 3);
    expect(mapOf(days, k)!.r).toBe('y');
    expect(days[k]!.p!.c).toBe(2);
    days = holdMap(days, k, 'm', 4);
    expect(days[k]!.p!.c).toBe(2);
  });
  it('a slip is an honest answer, with no calm move', () => {
    const days = holdMap(saveMap({}, k, storm, 1), k, 'n', 2);
    expect(mapOf(days, k)!.r).toBe('n');
    expect(days[k]!.p!.c).toBe(1);
  });
  it('asks "Did it hold?" an hour after the hour, for today or yesterday', () => {
    const days = saveMap({}, '2026-10-16', storm, 1);
    expect(mapAsk(days, '2026-10-16', at('2026-10-16T17:30:00'))).toBeNull();
    expect(mapAsk(days, '2026-10-16', at('2026-10-16T18:00:00'))!.k).toBe('2026-10-16');
    expect(mapAsk(days, '2026-10-17', at('2026-10-17T08:00:00'))!.k).toBe('2026-10-16');
    expect(mapAsk(holdMap(days, '2026-10-16', 'y', 2), '2026-10-17', at('2026-10-17T08:00:00'))).toBeNull();
  });
  it('knows where the day is', () => {
    expect(mapPhase(k, storm, at('2026-10-17T09:00:00'))).toBe('before');
    expect(mapPhase(k, storm, at('2026-10-17T17:20:00'))).toBe('now');
    expect(mapPhase(k, storm, at('2026-10-17T18:20:00'))).toBe('past');
    expect(mapPhase(k, { ...storm, h: null }, 0)).toBe('clear');
    expect(mapPhase(k, { ...storm, r: 'n' }, 0)).toBe('done');
  });
  it('keeps every map as a star', () => {
    let days = saveMap({}, '2026-10-15', { ...storm, h: null }, 1);
    days = saveMap(days, '2026-10-16', storm, 1);
    days = holdMap(days, '2026-10-16', 'n', 2);
    days = saveMap(days, '2026-10-17', storm, 1);
    days = holdMap(days, '2026-10-17', 'm', 2);
    expect(mapStars(days)).toEqual({ all: 3, held: 1, clear: 1 });
  });
});
