/* The ride (SOS as one guided stream of moves): the sun first, then the moves take turns, the ones that work for you
   sooner; Why it works; and the words and record after it. */
import { describe, expect, it } from 'vitest';
import * as core from '../src/index';
import type { Days, Settings } from '../src/types';

const st: Settings = core.normSettings({});
const tk = '2026-10-21';
const now = new Date('2026-10-21T15:00:00').getTime();
const can: core.RideCan = { words: true, replay: true, fresh: true };

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

describe('It is written', () => {
  const faith = { words: true, faith: true };
  it('is never in the ride without faith', () => {
    expect(ride(30)).not.toContain('written');
  });
  it('comes right after the sun for faith people, and comes round again', () => {
    const r = ride(30, {}, st, faith);
    expect(r[1]).toBe('written');
    expect(r.filter((x) => x === 'written').length).toBeGreaterThan(1);
  });
  it('waits its turn once Next has passed it twice', () => {
    const sc = core.newUrge(now, 0);
    expect(core.rideNext(sc, {}, st, tk, now, { pass: { written: 2 } }, faith, ['breathe'])).not.toBe('written');
  });
  it('the heart counts for it', () => {
    expect(core.urLikeOf(core.rateUrTool(st, 'written', 1), 'written')).toBe(1);
  });
  it('speaks in each voice: Scripture and the app link for the two Christian voices, none in the plain one', () => {
    const lds = core.writtenWords('lds');
    const chr = core.writtenWords('christian');
    const plain = core.writtenWords('plain');
    expect(lds.link?.url).toBe(core.WRITTEN_GL);
    expect(chr.link?.url).toBe(core.WRITTEN_BIBLE);
    expect(plain.link).toBeNull();
    expect(lds.pulls.map((p) => p.ref)).toEqual(['Matthew 4:4', 'Matthew 4:7', 'Matthew 4:10']);
    expect([lds.heart.ref, lds.cast.ref, lds.light.ref]).toEqual(['Matthew 5:8', 'Matthew 5:29', 'Matthew 5:14, 16']);
    expect(lds.link5?.url).toBe(core.WRITTEN_GL5);
    expect(chr.link5?.url).toBe(core.WRITTEN_BIBLE5);
    expect(plain.link5).toBeNull();
    expect(plain.pulls.every((p) => p.ref === null) && plain.stand.ref === null && plain.end.ref === null).toBe(true);
    expect([plain.heart, plain.cast, plain.light].every((x) => x.ref === null)).toBe(true);
    [lds, chr, plain].forEach((w) => expect(JSON.stringify(w)).not.toMatch(/n't|'re|'ll|'ve|can't/i));
  });
});

describe('the order of SOS', () => {
  /** a ride n long with this memory */
  const rideMem = (n: number, mem: core.UrMem, days: Days = {}) => {
    const sc = core.newUrge(now, 0);
    const out: string[] = [];
    for (let i = 0; i < n; i++) out.push(core.rideNext(sc, days, st, tk, now, mem, can, out));
    return out;
  };
  /** three SOS rides, each passing `id` over quickly once */
  const skipped = (id: string, times = 3) => {
    let m: core.UrMem = {};
    for (let i = 0; i < times; i++) m = core.ridePassed(core.rideFade(m), id, 1000);
    return m;
  };

  it('opens with the breath, then the body, before the moves that need a clear head', () => {
    const r = rideMem(12, {});
    /* the breath, then 5-4-3-2-1 (one of the two strong first picks, the owner, October 24, 2026), then the body and the eyes */
    expect(r.slice(0, 4)).toEqual(['breathe', 'ground', 'move', 'stack']);
    expect(r.indexOf('move')).toBeLessThan(r.indexOf('forward'));
    expect(r.indexOf('stack')).toBeLessThan(r.indexOf('reasons'));
    expect(core.RIDE_ORDER.slice().sort()).toEqual(core.RIDE_MOVES.slice().sort());
  });

  it('a quick pass counts more than a late one, finishing halves it, and each SOS fades it', () => {
    expect(core.rideSkipOf(core.ridePassed({}, 'move', 1000), 'move')).toBe(1);
    expect(core.rideSkipOf(core.ridePassed({}, 'move', 20000), 'move')).toBe(0.5);
    expect(core.rideSkipOf(core.rideFinished({ rsk: { move: 2 } }, 'move'), 'move')).toBe(1);
    expect(core.rideSkipOf(core.rideFade({ rsk: { move: 2 } }), 'move')).toBeCloseTo(1.8);
    /* only the ride's moves are counted here; the other pages keep their own count */
    expect(core.ridePassed({}, 'object', 1000)).toEqual({});
  });

  it('three quick passes in three rides is often; two is not', () => {
    expect(core.rideOften(skipped('move', 2), 'move')).toBe(false);
    expect(core.rideOften(skipped('move', 3), 'move')).toBe(true);
  });

  it('a move passed over often comes later in a ride, but still comes', () => {
    const fresh = rideMem(14, {});
    const after = rideMem(14, skipped('move'));
    expect(fresh[2]).toBe('move');
    expect(after.indexOf('move')).toBeGreaterThan(fresh.indexOf('move') + 2);
    expect(after).toContain('move');
    /* and the others are not all pushed aside: every move still comes round (Self Talk, last in the order, within a longer ride) */
    const long = rideMem(18, skipped('move'));
    core.RIDE_MOVES.forEach((id) => expect(long).toContain(id));
  });

  it('it comes back by itself: a run of SOS rides without passing it fades the count', () => {
    let m = skipped('move');
    for (let i = 0; i < 10; i++) m = core.rideFade(m);
    expect(core.rideOften(m, 'move')).toBe(false);
    expect(rideMem(4, m).indexOf('move')).toBeGreaterThan(0);
  });

  it('a move you said helped comes up', () => {
    const liked = core.rateUrTool(core.rateUrTool(st, 'reasons', 1), 'reasons', 1);
    const sc = core.newUrge(now, 0);
    const out: string[] = [];
    for (let i = 0; i < 4; i++) out.push(core.rideNext(sc, {}, liked, tk, now, {}, can, out));
    expect(out.indexOf('reasons')).toBeGreaterThan(0);
    expect(out.indexOf('reasons')).toBeLessThanOrEqual(2);
  });

  it('the old count of Next taps no longer holds a ride move down for good', () => {
    expect(rideMem(4, { pass: { move: 6 } })[2]).toBe('move');
  });

  it('It is written stays only for people with faith on, even when moves are passed over', () => {
    const r = rideMem(14, skipped('stack'));
    expect(r).not.toContain('written');
  });
});
