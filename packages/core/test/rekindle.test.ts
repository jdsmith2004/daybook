/* Rekindle, checked against the legacy app: which Rekindle a slip gets, and the sunrise check (now coming back, marked on the
   slip). The quest's card and words went with the rescue (the owner, October 30, 2026). */
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as core from '../src/index';
import type { Days, Reviews, Settings } from '../src/types';

const dir = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');
const J = <T>(x: T): T => JSON.parse(JSON.stringify(x));
const norm = (s: string) => s.replace(/\s+/g, ' ');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const logs: any[] = readdirSync(dir)
  .filter((f) => f.endsWith('.json') && !['emblem.json', 'setup.json', 'setup-flow.json', 'rekindle-words.json', 'tools-words.json'].includes(f))
  .map((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')));

afterEach(() => vi.useRealTimers());

describe('the Rekindle words match the legacy app', () => {
  const w = JSON.parse(readFileSync(join(dir, 'rekindle-words.json'), 'utf8'));
  it('plans in lower case', () => {
    for (const [x, want] of w.lower) expect(core.lowerFirst(x)).toBe(want);
  });
});

describe.each(logs)('$name', (fx) => {
  const st: Settings = core.normSettings(fx.input.settings);
  const days: Days = {};
  Object.keys(fx.input.days).forEach((k) => {
    if (core.isKey(k)) days[k] = core.normDay(fx.input.days[k], k);
  });
  const reviews: Reviews = {};
  Object.keys(fx.input.reviews).forEach((k) => (reviews[k] = core.normReview(fx.input.reviews[k], k)));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type Case = { now: number; expected: any; at: string };
  const cases: Case[] = fx.cases.map((c: Case) => ({ ...c, at: new Date(c.now).toString().slice(0, 21) }));

  describe.each(cases)('at $at', ({ now, expected: e }: Case) => {
    const at = () => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(now);
      return core.logicalKey(now, st.rollover);
    };
    const R = e.rekindle;

    it('gives each slip the same Rekindle, and the same card on Today', () => {
      const tk = at();
      for (const k of Object.keys(R.steps)) expect(core.rkStepFor(days, k)).toBe(R.steps[k]);
      const act = core.rkActive(days, st, tk);
      expect(J(act)).toEqual(R.active);
    });
  });
});

describe('the sunrise check: coming back, marked on the slip', () => {
  const T = '2026-10-15';
  const st = core.normSettings({ start: '2026-09-20', day1: '2026-09-27' });
  const days: Days = {
    '2026-10-14': core.normDay({ events: [{ id: 'a', time: '23:10', outcome: 'slipped', trigger: 'late', recovered: true }] }, '2026-10-14'),
  };

  it('lights the second flame, with nothing asked and no plan', () => {
    const d = core.srDone(days, '2026-10-14', 'a', T, 5000);
    expect(d['2026-10-14'].events[0].rk).toEqual({ at: T, pl: '' });
    expect(core.rkOf(d, '2026-10-14', st)?.m3).toBe(true);
    expect(core.sunriseDue(d, st, T)).toBeNull();
  });

  it('is marked once: the first day stays, and a plan from an older check stays on the slip', () => {
    const d = core.srDone(days, '2026-10-14', 'a', T, 5000);
    expect(core.srDone(d, '2026-10-14', 'a', '2026-10-16', 6000)).toBe(d);
    const old = { ...days, '2026-10-14': core.normDay({ events: [{ ...days['2026-10-14'].events[0], rk: { dp: 'trace' } }] }, '2026-10-14') };
    expect(core.srDone(old, '2026-10-14', 'a', T)['2026-10-14'].events[0].rk).toEqual({ dp: 'trace', at: T, pl: '' });
    expect(core.srDone(days, '2026-10-14', 'nope', T)).toBe(days);
  });
});

it('the record of clean days counts from Day 1, like the run', () => {
  const st2 = core.normSettings({ v: 1, start: '2026-09-24', day1: '2026-10-01', rollover: 4, u: 1 });
  let days: Days = {};
  for (let i = 0; i < 9; i++) days = core.addEvent(days, core.addDays('2026-10-01', i), 'rode', '21:00').days;
  days = core.addEvent(days, '2026-10-10', 'slipped', '22:40').days;
  expect(core.rkComebacks(days, st2, '2026-10-10').runs).toEqual([9]);
});

it('Day 1: tell the safe person you started, once, in plain words', () => {
  const st = { ...core.normSettings({ start: '2026-10-01', day1: '2026-10-08', u: 1 }), safePerson: 'Sam' };
  expect(core.tellStartDue(st, '2026-10-08')).toBe(true);
  expect(core.tellStartDue(st, '2026-10-09')).toBe(false);
  expect(core.tellStartDue({ ...st, safePerson: '' }, '2026-10-08')).toBe(false);
  expect(core.tellStartDue(core.tellStartDone(st, '2026-10-08', 5), '2026-10-08')).toBe(false);
  const t = core.startTellText(st);
  expect(t.startsWith('Hey Sam, ')).toBe(true);
  expect(t).not.toMatch(/n't|'re|'m|porn/i);
});
