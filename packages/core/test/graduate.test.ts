/* Graduation: 90 no-slip days within the last 100, quiet before the first week, and an award that is kept for good. */
import { expect, it } from 'vitest';
import * as core from '../src/index';
import type { Days, Settings } from '../src/types';

const tk = '2026-10-15';
const st0 = (day1: string, o: Partial<Settings> = {}): Settings =>
  core.normSettings({ ...core.defaultSettings(core.addDays(day1, -7)), day1, ...o });
const slip = (days: Days, key: string) => core.addEvent(days, key, 'slipped', '22:00').days;

it('counts finished days with no slip, from Day 1, within the last 100', () => {
  expect(core.gradInfo({}, st0(core.addDays(tk, -30)), tk).count).toBe(30);
  expect(core.gradInfo({}, st0(core.addDays(tk, -300)), tk).count).toBe(core.GRAD_WINDOW);
  expect(core.gradInfo({}, st0(tk), tk).count).toBe(0);
  expect(core.gradInfo({}, st0(core.addDays(tk, -30), { day1: null }), tk).count).toBe(0);
});

it('a slip at day 89 makes it 88, and the next day it is 89 again: nothing is wiped out', () => {
  const st = st0(core.addDays(tk, -89));
  expect(core.gradInfo({}, st, tk).count).toBe(89);
  const days = slip({}, core.addDays(tk, -1));
  expect(core.gradInfo(days, st, tk).count).toBe(88);
  expect(core.gradInfo(days, st, core.addDays(tk, 1)).count).toBe(89);
  expect(core.gradInfo(days, st, core.addDays(tk, 2)).count).toBe(90);
  expect(core.gradInfo(days, st, core.addDays(tk, 2)).ready).toBe(true);
});

it('stays quiet until the first 7 days in a row with no slip', () => {
  let days: Days = {};
  for (let i = 1; i <= 20; i += 3) days = slip(days, core.addDays(tk, -i));
  const st = st0(core.addDays(tk, -21));
  const g = core.gradInfo(days, st, tk);
  expect(g.show).toBe(false);
  expect(core.gradLine(g)).toBeNull();
  expect(core.gradInfo({}, st0(core.addDays(tk, -8)), tk).show).toBe(true);
});

it('says "almost there" from 80, and is ready at 90', () => {
  expect(core.gradInfo({}, st0(core.addDays(tk, -80)), tk)).toMatchObject({ near: true, ready: false });
  expect(core.gradInfo({}, st0(core.addDays(tk, -90)), tk)).toMatchObject({ near: false, ready: true });
});

it('the award is set once and kept through slips and later changes', () => {
  const st = core.graduate(st0(core.addDays(tk, -95)), tk, 1).st;
  expect(core.gradOf(st)).toBe(tk);
  expect(core.graduate(st, core.addDays(tk, 30), 2).st).toBe(st);
  let days: Days = {};
  for (let i = 1; i <= 40; i++) days = slip(days, core.addDays(tk, -i));
  const g = core.gradInfo(days, st, tk);
  expect([g.at, g.show, g.ready]).toEqual([tk, true, false]);
  expect(core.gradOf(core.normSettings(JSON.parse(JSON.stringify(st))))).toBe(tk);
});

it('the words are warm and never talk about losing anything', () => {
  const lines = [
    core.gradLine(core.gradInfo({}, st0(core.addDays(tk, -20)), tk)),
    core.gradLine(core.gradInfo({}, st0(core.addDays(tk, -85)), tk)),
    core.gradLine(core.gradInfo({}, core.graduate(st0(core.addDays(tk, -95)), tk).st, tk)),
    core.GRAD_ABOUT,
  ].join(' ');
  expect(lines).not.toMatch(/lost|lose|fail|reset|start over|streak/i);
  expect(lines).not.toMatch(/\b\w+n[’']t\b/);
});
