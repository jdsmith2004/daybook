import { describe, expect, it } from 'vitest';

import {
  FUTURE_MAX,
  FUTURE_QS,
  futureAge,
  futureAsk,
  futureAsked,
  futureClean,
  futureDrop,
  futureKeep,
  futurePick,
  futureQ,
  futureSeen,
  rideNext,
  RIDE_FAITH,
  RIDE_FIRST,
  RIDE_FUTURE,
  RIDE_WHY,
  type FutureMem,
  type FutureNote,
} from '../src';
import * as core from '../src';

const DAY = 86_400_000;
const T0 = new Date(2026, 10, 11, 20, 0).getTime();
const note = (id: string, at: number, k: 'voice' | 'text' = 'voice'): FutureNote => (k === 'text' ? { id, at, k, t: 'You can do this.' } : { id, at, k });
const empty: FutureMem = { notes: [] };

describe('future you: keeping notes', () => {
  it('keeps the newest first and at most five, naming the ones pushed out', () => {
    let m = empty;
    const dropped: string[] = [];
    for (let i = 0; i < 7; i++) {
      const r = futureKeep(m, note('n' + i, T0 + i * DAY));
      m = r.mem;
      dropped.push(...r.drop);
    }
    expect(m.notes.map((n) => n.id)).toEqual(['n6', 'n5', 'n4', 'n3', 'n2']);
    expect(m.notes.length).toBe(FUTURE_MAX);
    expect(dropped).toEqual(['n0', 'n1']);
    expect(m.kept).toBe(7);
  });

  it('turns the question with each note kept', () => {
    let m = empty;
    const qs: number[] = [];
    for (let i = 0; i < 4; i++) {
      qs.push(futureQ(m));
      m = futureKeep(m, note('n' + i, T0 + i)).mem;
    }
    expect(qs).toEqual([0, 1, 2, 0]);
    expect(FUTURE_QS).toHaveLength(3);
  });

  it('removes one note, and forgets when it was offered', () => {
    let m = futureKeep(futureKeep(empty, note('a', T0)).mem, note('b', T0 + 1)).mem;
    m = futureSeen(m, 'a', T0 + 2);
    m = futureDrop(m, 'a');
    expect(m.notes.map((n) => n.id)).toEqual(['b']);
    expect(m.shown).toEqual({});
  });

  it('reads back safely: bad entries go, the rest stay', () => {
    const m = futureClean({
      notes: [note('a', T0), { id: 'BAD ID', at: T0, k: 'voice' }, { id: 'c', at: T0 + 5, k: 'text', t: '  ' }, note('d', T0 + 9, 'text'), note('a', T0 + 1)],
      shown: { a: T0, zz: T0 },
      asked: 'no',
    });
    expect(m.notes.map((n) => n.id)).toEqual(['d', 'a']);
    expect(m.shown).toEqual({ a: T0 });
    expect(m.asked).toBeUndefined();
    expect(futureClean(null)).toEqual({ notes: [], shown: {}, kept: 0 });
  });
});

describe('future you: which note SOS offers', () => {
  it('offers the newest first, then the one offered longest ago', () => {
    let m = empty;
    for (const [i, id] of ['a', 'b', 'c'].entries()) m = futureKeep(m, note(id, T0 + i * DAY)).mem;
    expect(futurePick(m)?.id).toBe('c');
    m = futureSeen(m, 'c', T0 + 10);
    expect(futurePick(m)?.id).toBe('b');
    m = futureSeen(m, 'b', T0 + 11);
    expect(futurePick(m)?.id).toBe('a');
    m = futureSeen(m, 'a', T0 + 12);
    expect(futurePick(m)?.id).toBe('c');
    /* a new note goes first, the very next time */
    m = futureKeep(m, note('d', T0 + 13)).mem;
    expect(futurePick(m)?.id).toBe('d');
  });

  it('offers nothing with no note', () => {
    expect(futurePick(empty)).toBeNull();
  });
});

describe('future you: when it is invited', () => {
  const st = core.normSettings({});

  it('asks every couple of days while there is no note', () => {
    expect(futureAsk({}, st, empty, T0)).toBe(true);
    const m = futureAsked(empty, T0);
    expect(futureAsk({}, st, m, T0 + DAY)).toBe(false);
    expect(futureAsk({}, st, m, T0 + 2 * DAY)).toBe(true);
  });

  it('with a note, waits a week after it and a few days after the last ask', () => {
    let m = futureKeep(empty, note('a', T0)).mem;
    expect(futureAsk({}, st, m, T0 + 3 * DAY)).toBe(false);
    expect(futureAsk({}, st, m, T0 + 7 * DAY)).toBe(true);
    m = futureAsked(m, T0 + 7 * DAY);
    expect(futureAsk({}, st, m, T0 + 8 * DAY)).toBe(false);
    expect(futureAsk({}, st, m, T0 + 10 * DAY)).toBe(true);
  });

  it('never asks before setup', () => {
    expect(futureAsk({}, null, empty, T0)).toBe(false);
  });

  it('never asks in the hours after a slip', () => {
    const k = core.logicalKey(T0, st.rollover);
    const days = { [k]: { events: [{ id: 'x', time: '18:30', outcome: 'slipped' }] } } as never;
    expect(futureAsk(days, st, empty, T0)).toBe(false);
  });
});

describe('future you: in the ride', () => {
  const ur = core.newUrge(T0, 0);
  it('comes right after the breath when there is a note, and only then', () => {
    expect(rideNext(ur, {}, null, '2026-11-11', T0, {}, { words: false, future: true }, [])).toBe(RIDE_FIRST);
    expect(rideNext(ur, {}, null, '2026-11-11', T0, {}, { words: false, future: true }, [RIDE_FIRST])).toBe(RIDE_FUTURE);
    expect(rideNext(ur, {}, null, '2026-11-11', T0, {}, { words: false }, [RIDE_FIRST])).not.toBe(RIDE_FUTURE);
    const later = rideNext(ur, {}, null, '2026-11-11', T0, {}, { words: false, future: true }, [RIDE_FIRST, RIDE_FUTURE, 'move', 'stack']);
    expect(later).not.toBe(RIDE_FUTURE);
  });

  it('has its why, and the faith page moves one later', () => {
    expect(RIDE_WHY[RIDE_FUTURE]).toBeTruthy();
    const st = core.normSettings({});
    const third = rideNext(ur, {}, st, '2026-11-11', T0, {}, { words: false, faith: true, future: true }, [RIDE_FIRST, RIDE_FUTURE]);
    expect(third).toBe(RIDE_FAITH);
  });
});

describe('future you: how long ago', () => {
  it('says it plainly', () => {
    expect(futureAge(T0, T0 + 1000)).toBe('today');
    expect(futureAge(T0 - DAY, T0)).toBe('yesterday');
    expect(futureAge(T0 - 4 * DAY, T0)).toBe('4 days ago');
    expect(futureAge(T0 - 15 * DAY, T0)).toBe('2 weeks ago');
    expect(futureAge(T0 - 95 * DAY, T0)).toBe('3 months ago');
  });
});

describe('future you: the words', () => {
  it('use no contractions', () => {
    for (const x of FUTURE_QS) {
      expect(x.q).not.toMatch(/\w'\w|\w’\w/);
      expect(x.ex).not.toMatch(/\w'\w|\w’\w/);
    }
  });
});
