/* Accounts: care never checks for one; the first lessons are open; Today asks at good moments only. */
import { expect, it } from 'vitest';
import * as core from '../src/index';

const tk = '2026-10-15';
const st0 = (start: string) => core.normSettings({ ...core.defaultSettings(start), day1: core.addDays(start, 7) });

it('without an account, the first lessons on the path are open, and finished ones stay open', () => {
  const free = core.freeLessons();
  expect(core.LEARN_FREE).toBe(7);
  expect(free).toEqual(core.lessonPath().slice(0, core.LEARN_FREE));
  const after = core.lessonPath()[core.LEARN_FREE];
  expect(core.lessonOpen(free[0], new Set(), false)).toBe(true);
  expect(core.lessonOpen(free[core.LEARN_FREE - 1], new Set(), false)).toBe(true);
  expect(core.lessonOpen(after, new Set(), false)).toBe(false);
  expect(core.lessonOpen(after, new Set([after.id]), false)).toBe(true);
  expect(core.lessonOpen(after, new Set(), true)).toBe(true);
  /* God lessons no longer come free on top (D8, November 12, 2026): on a path with faith, the first seven count them */
  const god = core.normSettings({ ...core.defaultSettings(tk), onb: { n: 1, at: 1, a: { faith: 'big' }, hist: [] } });
  expect(core.freeLessons(god).map((L) => L.id)).toEqual(['l1', 'l2', 'l3', 'l22', 'g1', 'l33', 'l34']);
  expect(core.lessonOpen(core.lessonById('g1')!, new Set(), false, god)).toBe(true);
  expect(core.lessonOpen(core.lessonById('g2')!, new Set(), false, god)).toBe(false);
  expect(core.lessonsLocked(core.LESSONS, new Set(), false)).toBe(core.LESSONS.length - core.LEARN_FREE);
  expect(core.lessonsLocked(core.LESSONS, new Set(), true)).toBe(0);
});

it('asks after the first week only, whatever the level, and never with an account', () => {
  expect(core.accountAsk({}, st0(tk), tk, 1, false)).toBeNull();
  expect(core.accountAsk({}, st0(tk), tk, 2, false)).toBeNull();
  /* level 6 used to ask, which is day 2 for someone doing everything (WP11) */
  expect(core.accountAsk({}, st0(tk), tk, 6, false)).toBeNull();
  expect(core.accountAsk({}, st0(core.addDays(tk, -6)), tk, 20, false)).toBeNull();
  expect(core.accountAsk({}, st0(core.addDays(tk, -7)), tk, 1, false)).toBe('week');
  expect(core.accountAsk({}, st0(core.addDays(tk, -7)), tk, 5, true)).toBeNull();
});

it('never asks on a day with a slip or the day after', () => {
  const st = st0(core.addDays(tk, -10));
  expect(core.accountAsk(core.addEvent({}, tk, 'slipped', '21:00').days, st, tk, 3, false)).toBeNull();
  expect(core.accountAsk(core.addEvent({}, core.addDays(tk, -1), 'slipped', '21:00').days, st, tk, 3, false)).toBeNull();
  expect(core.accountAsk(core.addEvent({}, core.addDays(tk, -2), 'slipped', '21:00').days, st, tk, 3, false)).toBe('week');
});

it('"Not now" waits a week', () => {
  const st = core.accountLater(st0(core.addDays(tk, -10)), tk, 1).st;
  expect(core.accountAsk({}, st, core.addDays(tk, core.ACCT_WAIT - 1), 3, false)).toBeNull();
  expect(core.accountAsk({}, st, core.addDays(tk, core.ACCT_WAIT), 3, false)).toBe('week');
});

it('someone well past a week is not told "a week in"', () => {
  expect(core.accountWords('week', 0, 8).h).toMatch(/^A week in/);
  expect(core.accountWords('week', 0, 61).h).not.toMatch(/week/i);
  /* where no tip can be paid (Android), the card says nothing about tips */
  expect(core.accountWords('week', 3, 8, false).p).not.toMatch(/tip/i);
  expect(core.accountWords('week', 3, 8).p).toMatch(/tip/);
});

it('the words are warm, with no contractions', () => {
  const w = [core.accountWords('level', 37), core.accountWords('week', 0)].map((x) => x.h + ' ' + x.p).join(' ');
  expect(w).toContain('The first 7 lessons are free. A free account opens the other 37.');
  expect(w).not.toMatch(/\b\w+n[’']t\b|must|required/i);
});

it('without an account, Next up says the next lesson waits for one, and gives a re-read on a slip day and the day after', () => {
  const st = st0('2026-09-01');
  const days = { '2026-10-01': { p: { ls: core.freeLessons().map((L) => L.id) } } } as unknown as core.Days;
  const done = core.lessonsDone(days);
  const eighth = core.lessonPath()[core.LEARN_FREE];
  let seen = 0;
  for (let h = 0; h < 24; h++) {
    const o = core.nextUp(days, st, tk, new Date(2026, 9, 15, h, 30).getTime(), false);
    if (o.act !== 'lesson') continue;
    seen++;
    expect(o.v).toBe(eighth.id);
    expect(o.t).toBe('Lesson 8: ' + eighth.title);
    expect(o.s).toBe('Opens with a free account');
  }
  expect(seen).toBeGreaterThan(0);
  const stop = core.lessonStop(days, st, tk, false);
  expect(stop).toMatchObject({ kind: 'next', L: eighth, locked: true, n: 8 });
  /* the morning after a slip, the day's lesson is one for after a hard night, which is care and never waits */
  const after = core.lessonStop(core.addEvent(days, core.addDays(tk, -1), 'slipped', '21:00').days, st, tk, false);
  expect(after).toMatchObject({ kind: 'next', hook: 'slip', locked: false, L: { id: 'l24' } });
  /* once those are read, and on the day of a slip, a re-read */
  const rk = { ...days, '2026-10-02': { p: { ls: core.RK_LESSONS } } } as unknown as core.Days;
  for (const k of [tk, core.addDays(tk, -1)]) {
    const hard = core.addEvent(rk, k, 'slipped', '21:00').days;
    const r = core.lessonStop(hard, st, tk, false);
    expect(r.kind).toBe('review');
    expect(core.lessonOpen(r.L, done, false)).toBe(true);
    for (let h = 0; h < 24; h++) {
      const o = core.nextUp(hard, st, tk, new Date(2026, 9, 15, h, 30).getTime(), false);
      if (o.act === 'lesson') expect(o.t).toMatch(/^Read again: /);
    }
  }
  /* with an account it is simply lesson 8 */
  expect(core.lessonStop(days, st, tk, true)).toMatchObject({ kind: 'next', L: eighth, locked: false });
});

it('a new person who keeps it on the phone at the end of setup is not asked again for a week', () => {
  const st = core.accountLater(st0(tk), tk, 1).st;
  expect(core.accountAsk({}, st, tk, 6, false)).toBeNull();
  expect(core.accountAsk({}, st, core.addDays(tk, core.ACCT_WAIT), 6, false)).toBe('week');
});
