/* The ride (SOS as one guided routine): which move fills each slot, Swap, and the words and record after it. */
import { describe, expect, it } from 'vitest';
import * as core from '../src/index';
import type { Days, Settings } from '../src/types';

const st: Settings = core.normSettings({});
const tk = '2026-10-21';
const now = new Date('2026-10-21T15:00:00').getTime();
const can = { words: true };

/** a log with urges ridden out, each with its tools and minutes */
function rodeLog(list: { key: string; tr?: [string, 'p' | 's' | 'x'][]; m?: number }[]): Days {
  let days: Days = {};
  list.forEach((x, i) => {
    const r = core.addEvent(days, x.key, 'rode', '14:' + String(10 + i).padStart(2, '0'), { tr: x.tr, m: x.m });
    days = r.days;
  });
  return days;
}

describe('ridePlan', () => {
  it('is always breathe, then one body move, then one mind move', () => {
    const plan = core.ridePlan(core.newUrge(now, 0), {}, st, tk, now, {}, can);
    expect(plan).toHaveLength(3);
    expect(plan[0]).toBe('breathe');
    expect(core.RIDE_SLOTS.body).toContain(plan[1]);
    expect(core.RIDE_SLOTS.mind).toContain(plan[2]);
  });

  it('leaves My reasons out when there are no words of your own', () => {
    const sc = core.newUrge(now, 0);
    for (let i = 0; i < 3; i++) {
      const plan = core.ridePlan({ ...sc, used: ['forward', 'thought'] }, {}, st, tk, now, {}, { words: false });
      expect(plan[2]).not.toBe('reasons');
    }
  });

  it('picks the body move that has worked for you', () => {
    const days = rodeLog([
      { key: '2026-10-18', tr: [['ground', 'p']] },
      { key: '2026-10-19', tr: [['ground', 'p']] },
      { key: '2026-10-20', tr: [['ground', 'p']] },
    ]);
    expect(core.ridePlan(core.newUrge(now, 0), days, st, tk, now, {}, can)[1]).toBe('ground');
  });

  it('uses other moves on a second ride in the same SOS', () => {
    const sc = core.newUrge(now, 0);
    const first = core.ridePlan(sc, {}, st, tk, now, {}, can);
    const second = core.ridePlan({ ...sc, used: first, again: 1 }, {}, st, tk, now, {}, can);
    expect(second[0]).toBe('breathe');
    expect(second[1]).not.toBe(first[1]);
    expect(second[2]).not.toBe(first[2]);
  });

  it('puts your go-to first in its slot', () => {
    const pin = core.normSettings({ urPin: 'stack' });
    expect(core.ridePlan(core.newUrge(now, 0), {}, pin, tk, now, {}, can)[1]).toBe('stack');
  });
});

describe('rideSwap', () => {
  it('moves to the next move in the same slot, and round', () => {
    const plan = ['breathe', 'move', 'forward'];
    expect(core.rideSwap(plan, 1, can)).toEqual(['breathe', 'stack', 'forward']);
    expect(core.rideSwap(['breathe', 'ground', 'forward'], 1, can)).toEqual(['breathe', 'move', 'forward']);
    expect(core.rideSwap(plan, 2, can)).toEqual(['breathe', 'move', 'thought']);
  });
  it('keeps a slot with one move as it is', () => {
    expect(core.rideSwap(['breathe', 'move', 'forward'], 0, can)).toEqual(['breathe', 'move', 'forward']);
  });
  it('skips My reasons without words', () => {
    expect(core.rideSwap(['breathe', 'move', 'thought'], 2, { words: false })).toEqual(['breathe', 'move', 'forward']);
  });
});

describe('after the ride', () => {
  it('says why the move that helped works, else the last one done', () => {
    expect(core.rideWhy('move', ['breathe', 'move', 'forward'])?.id).toBe('move');
    expect(core.rideWhy(null, ['breathe', 'move', 'thought'])?.l).toBe('l16');
    expect(core.rideWhy(null, [])).toBeNull();
  });
  it('every move in a slot has its line, and every lesson it names exists', () => {
    const ids = new Set((core.LESSONS as { id: string }[]).map((l) => l.id));
    Object.values(core.RIDE_SLOTS)
      .flat()
      .forEach((id) => expect(core.RIDE_WHY[id]).toBeTruthy());
    Object.values(core.RIDE_WHY).forEach((w) => (w.l ? expect(ids.has(w.l)).toBe(true) : null));
  });
  it('reads the record: how many, how long yours take, and whether this one was faster', () => {
    const days = rodeLog([
      { key: '2026-10-17', m: 8 },
      { key: '2026-10-18', m: 6 },
      { key: '2026-10-19', m: 10 },
    ]);
    expect(core.rideRecord(days, 4)).toEqual({ n: 3, med: 8, faster: true, mins: 4 });
    expect(core.rideMark(days)).toBe(8);
    expect(core.rideMark({})).toBeNull();
    expect(core.rideWeek(days, '2026-10-21')).toBe(3);
    expect(core.rideWeek(days, '2026-10-30')).toBe(0);
  });
  it('offers practice once, after the first few', () => {
    const days = rodeLog([{ key: '2026-10-17' }, { key: '2026-10-18' }]);
    expect(core.ridePracticeAsk(days, {})).toBe(true);
    expect(core.ridePracticeAsk(days, { pracAsk: 1 })).toBe(false);
    expect(core.ridePracticeAsk({}, {})).toBe(false);
  });
});
