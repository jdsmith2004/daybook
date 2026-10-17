/* Accounts: care never checks for one; the first lessons are open; Today asks at good moments only. */
import { expect, it } from 'vitest';
import * as core from '../src/index';

const tk = '2026-10-15';
const st0 = (start: string) => core.normSettings({ ...core.defaultSettings(start), day1: core.addDays(start, 7) });

it('without an account, the first lessons in the daily order are open, and finished ones stay open', () => {
  const free = core.freeLessons('after');
  expect(free.map((L) => L.id)).toEqual(['l1', 'l2', 'l33']);
  const l3 = core.lessonById('l3')!;
  expect(core.lessonOpen(free[0], new Set(), 'after', false)).toBe(true);
  expect(core.lessonOpen(l3, new Set(), 'after', false)).toBe(false);
  expect(core.lessonOpen(l3, new Set(['l3']), 'after', false)).toBe(true);
  expect(core.lessonOpen(l3, new Set(), 'after', true)).toBe(true);
  expect(core.lessonsLocked(core.LESSONS, new Set(), 'after', false)).toBe(core.LESSONS.length - core.LEARN_FREE);
  expect(core.lessonsLocked(core.LESSONS, new Set(), 'after', true)).toBe(0);
});

it('asks after the first level-up or the first week, and never with an account', () => {
  expect(core.accountAsk({}, st0(tk), tk, 1, false)).toBeNull();
  expect(core.accountAsk({}, st0(tk), tk, 2, false)).toBe('level');
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

it('the words are warm, with no contractions', () => {
  const w = [core.accountWords('level', 37), core.accountWords('week', 0)].map((x) => x.h + ' ' + x.p).join(' ');
  expect(w).toContain('other 37 lessons');
  expect(w).not.toMatch(/\b\w+n[’']t\b|must|required/i);
});
