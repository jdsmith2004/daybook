/* A plan for later: the moves offered for what the plan counts on, the thoughts answered, and the time of the hard hour. */
import { describe, expect, it } from 'vitest';
import { AHEAD_KEEP, AHEAD_MOVES, aheadAnswers, aheadFirst, aheadLive, aheadMoves, aheadTime, aheadWhen } from '../src/ahead';

const at = (s: string) => new Date(s).getTime();

describe('aheadMoves', () => {
  it('offers every move, in order, when nothing is picked', () => {
    expect(aheadMoves([]).map((m) => m[0])).toEqual(AHEAD_MOVES.map((m) => m[0]));
  });
  it('puts the moves that break a picked link first', () => {
    const ids = aheadMoves(['alone']).map((m) => m[0]);
    expect(ids.slice(0, 3)).toEqual(['people', 'away', 'text']);
    expect(ids).toHaveLength(AHEAD_MOVES.length);
    expect(aheadMoves(['owed'])[0][0]).toBe('fill');
    expect(aheadMoves(['picked', 'device'])[0][0]).toBe('block');
  });
});

describe('aheadAnswers', () => {
  it('answers only the links that carry a thought, in the usual order', () => {
    expect(aheadAnswers(['alone', 'free'])).toEqual([]);
    expect(aheadAnswers(['anyway', 'owed']).map((a) => a[0])).toEqual(['I am owed this.', 'I will slip anyway, so why fight it.']);
  });
});

describe('time of the hard hour', () => {
  const now = at('2026-10-17T14:10:00');
  it('is today or tomorrow at the minutes picked', () => {
    expect(aheadTime(now, 0, 17 * 60 + 30)).toBe(at('2026-10-17T17:30:00'));
    expect(aheadTime(now, 1, 60)).toBe(at('2026-10-18T01:00:00'));
  });
  it('starts today at the next half hour, and not at all late at night', () => {
    expect(aheadFirst(now)).toBe(14 * 60 + 30);
    expect(aheadFirst(at('2026-10-17T14:30:00'))).toBe(15 * 60);
    expect(aheadFirst(at('2026-10-17T23:20:00'))).toBe(23 * 60 + 30);
    expect(aheadFirst(at('2026-10-17T23:40:00'))).toBeNull();
  });
  it('says the day and the clock', () => {
    expect(aheadWhen(at('2026-10-17T17:30:00'), now)).toBe('Today, 5:30 PM');
    expect(aheadWhen(at('2026-10-18T00:00:00'), now)).toBe('Tomorrow, 12:00 AM');
  });
});

describe('aheadLive', () => {
  const p = { t: at('2026-10-17T17:30:00'), moves: ['fill'] };
  it('keeps the plan until two hours after its hour', () => {
    expect(aheadLive(p, at('2026-10-17T09:00:00'))).toEqual(p);
    expect(aheadLive(p, p.t + AHEAD_KEEP - 1)).toEqual(p);
    expect(aheadLive(p, p.t + AHEAD_KEEP)).toBeNull();
  });
  it('ignores anything that is not a plan', () => {
    expect(aheadLive(null, 0)).toBeNull();
    expect(aheadLive({ t: 'x', moves: [] }, 0)).toBeNull();
    expect(aheadLive({ t: 1 }, 0)).toBeNull();
  });
});
