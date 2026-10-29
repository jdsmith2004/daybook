import { describe, expect, it } from 'vitest';

import { keepNewer, mergeDay, normDay, type Day } from '../src';

const slip = (extra: object = {}) => ({ id: 's1', time: '23:00', outcome: 'slipped', trigger: 'lonely', ...extra });
const day = (events: object[], p: object | null = null, checkin: object | null = null, u = 100): Day => normDay({ events, p, checkin, u }, '2026-10-20') as Day;

describe('keepNewer: what an older app version cannot see is never lost to its copy', () => {
  it('a slip keeps how it felt after, and the feeling before on older slips', () => {
    const had = day([slip({ fa: 'flat', fb: 'Lonely' })]);
    const theirs = day([slip()], null, null, 200);
    const kept = keepNewer(theirs, had);
    expect(kept.events[0]).toMatchObject({ fa: 'flat', fb: 'Lonely' });
    expect(kept.u).toBe(200);
  });
  it('gives back the same day when nothing is missing', () => {
    const had = day([slip({ fa: 'flat' })]);
    const theirs = day([slip({ fa: 'okay' })], null, null, 200);
    expect(keepNewer(theirs, had)).toBe(theirs);
    expect(keepNewer(theirs, undefined)).toBe(theirs);
  });
  it('a slip changed to an urge ridden out does not get a slip’s fields back', () => {
    const had = day([slip({ fa: 'flat' })]);
    const theirs = day([{ ...slip(), outcome: 'rode' }], null, null, 200);
    expect(keepNewer(theirs, had)).toBe(theirs);
  });
  it('a plan keeps its situation and its after-slip mark, by id; the check-in keeps mood and urges; the day keeps its feeling', () => {
    const talk = { id: 't1', t: 150, at: null, p: 'change', pr: 1, n: 'close', m: ['text'], mo: 'late', ft: 'lonely' };
    const { pr: _pr, ft: _ft, ...bare } = talk;
    const had = day([], { c: 1, tt: [talk], df: [4, 50] }, { m: 6, md: 7, u: 3, done: true, at: 1 });
    const theirs = day([], { c: 1, tt: [bare, { ...bare, id: 't2' }] }, { m: 5, done: true, at: 2 }, 200);
    const kept = keepNewer(theirs, had);
    expect(kept.p?.tt?.[0]).toMatchObject({ pr: 1, ft: 'lonely' });
    expect(kept.p?.tt?.[1]).not.toHaveProperty('ft');
    expect(kept.p?.df).toEqual([4, 50]);
    expect(kept.checkin).toMatchObject({ m: 5, md: 7, u: 3 });
  });
  it('mergeDay keeps them whichever copy is newer', () => {
    const mine = day([slip({ fa: 'flat' })], null, null, 100);
    const olderApp = day([slip(), { id: 'r1', time: '20:00', outcome: 'rode' }], null, null, 200);
    const j = mergeDay(mine, olderApp)!;
    expect(j.events.find((e) => e.id === 's1')?.fa).toBe('flat');
    expect(j.events.length).toBe(2);
  });
});
