/* The ride (SOS as one guided stream of moves): the sun first, then the moves take turns, the ones that work for you
   sooner; Why it works; and the words and record after it. */
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

/** the moves of a ride n long, each one picked after the ones before */
function ride(n: number, days: Days = {}, s: Settings = st, c = can): string[] {
  const sc = core.newUrge(now, 0);
  const out: string[] = [];
  for (let i = 0; i < n; i++) out.push(core.rideNext(sc, days, s, tk, now, {}, c, out));
  return out;
}

describe('rideNext', () => {
  it('always opens with the sun', () => {
    expect(ride(1)).toEqual(['breathe']);
  });

  it('never shows a move twice in a row, and every move comes round', () => {
    const r = ride(24);
    r.slice(1).forEach((x, i) => expect(x).not.toBe(r[i]));
    core.RIDE_MOVES.forEach((id) => expect(r).toContain(id));
  });

  it('brings the moves that work for you round more often', () => {
    const days = rodeLog(
      ['2026-10-14', '2026-10-15', '2026-10-16', '2026-10-17', '2026-10-18', '2026-10-19', '2026-10-20'].map((key) => ({
        key,
        tr: [['stack', 'p']] as [string, 'p'][],
      })),
    );
    const liked = core.rateUrTool(core.rateUrTool(st, 'stack', 1), 'stack', 1);
    const n = (r: string[], id: string) => r.filter((x) => x === id).length;
    const mine = ride(24, days, liked);
    expect(n(mine, 'stack')).toBeGreaterThan(n(ride(24), 'stack'));
    expect(mine.slice(0, 3)).toContain('stack');
  });

  it('puts your go-to among the first moves after the sun', () => {
    const pin = core.normSettings({ urPin: 'thought' });
    expect(ride(2, {}, pin)[1]).toBe('thought');
  });

  it('leaves Your words out when there are no words of your own', () => {
    expect(ride(24, {}, st, { words: false })).not.toContain('reasons');
  });

  it('a feeling just named sends the ride to the move that fits it', () => {
    const sc = core.newUrge(now, 0);
    expect(core.rideNext(sc, {}, st, tk, now, {}, can, ['breathe', 'feel'], 'move')).toBe('move');
  });

  it('holds back a second move of the same kind', () => {
    const r = ride(24);
    const kinds = r.map((x) => core.RIDE_KIND[x]);
    const same = kinds.slice(1).filter((k, i) => k === kinds[i]).length;
    expect(same).toBeLessThan(6);
  });
});

describe('Why it works', () => {
  it('every ride move has its line and a lesson, with its studies', () => {
    core.RIDE_MOVES.forEach((id) => {
      const s = core.rideScience(id);
      expect(s && s.t).toBeTruthy();
      expect(s!.lesson).toBeTruthy();
      expect(s!.proofs.length).toBeGreaterThan(0);
    });
    expect(core.rideScience('nothing')).toBeNull();
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
    core.RIDE_MOVES.forEach((id) => expect(core.RIDE_WHY[id]).toBeTruthy());
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
