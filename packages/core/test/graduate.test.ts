/* Graduation: 90 no-slip days within the last 100, quiet before the first week, and an award that is kept for good. */
import { describe, expect, it } from 'vitest';
import * as core from '../src/index';
import type { Days, Settings } from '../src/types';

const tk = '2026-10-15';
const st0 = (day1: string, o: Partial<Settings> = {}): Settings => core.normSettings({ ...core.defaultSettings(core.addDays(day1, -7)), day1, ...o });
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

it('after a slip that ends a long run, Rekindle honors the run and the way to graduation', () => {
  const st = st0(core.addDays(tk, -60));
  const long = core.addEvent({}, tk, 'slipped', '22:00').days;
  const h = core.rkHonor(long, st, tk, tk);
  expect(h).toMatch(/^60 days\. That is huge, and it still counts\./);
  expect(h).toContain('of 90 toward graduation');
  expect(h).not.toMatch(/lost|lose|reset|start over|\b\w+n[’']t\b/i);
  const short = core.addEvent({}, tk, 'slipped', '22:00').days;
  expect(core.rkHonor(short, st0(core.addDays(tk, -3)), tk, tk)).toBeNull();
});

it('a run under 30 days is honored without naming the 90', () => {
  const h = core.rkHonor(core.addEvent({}, tk, 'slipped', '22:00').days, st0(core.addDays(tk, -20)), tk, tk);
  expect(h).toBe('20 days. That is huge, and it still counts.');
});

describe('the one day number on Today', () => {
  const st0 = core.normSettings({ v: 1, start: '2026-09-24', day1: '2026-10-01', rollover: 4, screensOff: '23:00', u: 1 });
  const slip = (d: string) => ({
    d,
    events: [{ id: 'x' + d, time: '22:00', outcome: 'slipped', trigger: null, paused: null, did: null, recovered: false, note: '' }],
    checkin: null,
    p: null,
    u: 1,
  });
  it('before the first week with no slip, it is the last 7 days, and a slip takes one day off', () => {
    const days = { '2026-10-05': slip('2026-10-05') } as unknown as Days;
    const m = core.todayMeasure(days, st0, '2026-10-10')!;
    expect(m.k).toBe('week');
    expect(m.n).toBe(6);
    expect(m.of).toBe('of the last 7 days with no slip');
    expect(m.cells).toEqual(['ok', 'ok', 'slip', 'ok', 'ok', 'ok', 'ok', 'today']);
  });
  it('counts only the days since Day 1, and Day 1 itself says so', () => {
    expect(core.todayMeasure({}, st0, '2026-10-01')!.of).toBe('Day 1 is today');
    const m = core.todayMeasure({}, st0, '2026-10-03')!;
    expect([m.n, m.of]).toEqual([2, 'of the last 2 days with no slip']);
    expect(m.cells!.slice(0, 5)).toEqual(['none', 'none', 'none', 'none', 'none']);
  });
  it('never shows a big zero the day after a slip', () => {
    const days = { '2026-10-01': slip('2026-10-01') } as unknown as Days;
    const m = core.todayMeasure(days, st0, '2026-10-02')!;
    expect([m.n, m.of]).toEqual([0, 'Today counts']);
  });
  it('the way to graduation waits on Today until 30 days hold, while Milestones has the line from the first week', () => {
    /* day 8, after a first run of 7 days: the week on Today, the count in Milestones */
    const tk8 = '2026-10-09';
    const g = core.gradInfo({}, st0, tk8);
    expect([g.show, g.count]).toEqual([true, 8]);
    expect(core.gradLine(g)).toBe('8 of 90 toward graduation. Every day with no slip in your last 100 counts.');
    const m = core.todayMeasure({}, st0, tk8)!;
    expect([m.k, m.n, m.of]).toEqual(['week', 7, 'of the last 7 days with no slip']);
    expect(core.gradOnToday(g)).toBe(false);
    /* 29 days: still the week */
    expect(core.todayMeasure({}, st0, '2026-10-30')!.k).toBe('week');
  });
  it('once 30 days hold, it is the way to graduation, and nothing before Day 1', () => {
    const m = core.todayMeasure({}, st0, '2026-10-31')!;
    expect(m.k).toBe('way');
    expect(m.n).toBe(core.GRAD_TODAY);
    expect(m.of).toBe('of 90 toward graduation');
    expect(core.todayMeasure({}, { ...st0, day1: '2026-11-01' }, '2026-10-20')).toBeNull();
  });
  it('30 days that hold without a first week in a row stay quiet on Today too', () => {
    let days: Days = {};
    for (let i = 5; i <= 60; i += 5) days = { ...days, [core.addDays('2026-10-01', i)]: slip(core.addDays('2026-10-01', i)) } as unknown as Days;
    const tk = '2026-12-05';
    const g = core.gradInfo(days, st0, tk);
    expect(g.show).toBe(false);
    expect(g.count).toBeGreaterThanOrEqual(core.GRAD_TODAY);
    expect(core.todayMeasure(days, st0, tk)!.k).toBe('week');
  });
  it('once graduated, it is the count that keeps going, at any count', () => {
    const st = core.graduate(st0, '2026-10-20').st;
    let days: Days = {};
    for (let i = 1; i <= 25; i++) days = { ...days, [core.addDays('2026-11-20', -i)]: slip(core.addDays('2026-11-20', -i)) } as unknown as Days;
    const m = core.todayMeasure(days, st, '2026-11-20')!;
    expect(m.k).toBe('grad');
    expect(m.of).toBe('of the last 100 days with no slip');
  });
});
