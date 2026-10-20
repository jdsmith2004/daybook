/* Accounts: care never checks for one; the first lessons are open; Today asks at good moments only. */
import { expect, it } from 'vitest';
import * as core from '../src/index';

const tk = '2026-10-15';
const st0 = (start: string) => core.normSettings({ ...core.defaultSettings(start), day1: core.addDays(start, 7) });

it('without an account, the first lessons on the path are open, and finished ones stay open', () => {
  const free = core.freeLessons();
  expect(free.map((L) => L.id)).toEqual(['l1', 'l2', 'l3']);
  const l4 = core.lessonById('l4')!;
  expect(core.lessonOpen(free[0], new Set(), false)).toBe(true);
  expect(core.lessonOpen(l4, new Set(), false)).toBe(false);
  expect(core.lessonOpen(l4, new Set(['l4']), false)).toBe(true);
  expect(core.lessonOpen(l4, new Set(), true)).toBe(true);
  expect(core.lessonsLocked(core.LESSONS, new Set(), false)).toBe(core.LESSONS.length - core.LEARN_FREE);
  expect(core.lessonsLocked(core.LESSONS, new Set(), true)).toBe(0);
});

it('asks after the first level-up or the first week, and never with an account', () => {
  expect(core.accountAsk({}, st0(tk), tk, 1, false)).toBeNull();
  expect(core.accountAsk({}, st0(tk), tk, 2, false)).toBeNull();
  expect(core.accountAsk({}, st0(tk), tk, core.ACCT_LEVEL, false)).toBe('level');
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
});

it('the words are warm, with no contractions', () => {
  const w = [core.accountWords('level', 37), core.accountWords('week', 0)].map((x) => x.h + ' ' + x.p).join(' ');
  expect(w).toContain('other 37 lessons');
  expect(w).not.toMatch(/\b\w+n[’']t\b|must|required/i);
});

it('without an account, Next up never offers a lesson that waits behind one', () => {
  const st = st0('2026-09-01');
  const days = { '2026-10-01': { p: { ls: ['l1', 'l2', 'l3'] } } } as unknown as core.Days;
  const done = core.lessonsDone(days);
  let seen = 0;
  for (let h = 0; h < 24; h++) {
    const o = core.nextUp(days, st, tk, new Date(2026, 9, 15, h, 30).getTime(), false);
    if (o.act !== 'lesson') continue;
    seen++;
    expect(core.lessonOpen(core.lessonById(o.v!)!, done, false)).toBe(true);
    expect(o.t).toMatch(/^Read again: /);
  }
  expect(seen).toBeGreaterThan(0);
});

it('a new person who keeps it on the phone at the end of setup is not asked again for a week', () => {
  const st = core.accountLater(st0(tk), tk, 1).st;
  expect(core.accountAsk({}, st, tk, core.ACCT_LEVEL, false)).toBeNull();
  expect(core.accountAsk({}, st, core.addDays(tk, core.ACCT_WAIT), core.ACCT_LEVEL, false)).toBe('week');
});
