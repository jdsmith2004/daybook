/* Hard hours: learning the window from slips, urges and talk-throughs, the day's phase, keeping a held hour, and the
   phone heads-ups. */
import { describe, expect, it } from 'vitest';
import { addEvent } from '../src/mutate';
import { normDay } from '../src/legacy/core.js';
import { lessonPath } from '../src/lessons';
import { hardHeld, keepHard, riskAlerts, riskAt, riskDay, riskLabel, riskLesson, riskPlanLabel, riskStartLabel, riskToKeep, riskWindow } from '../src/risk';
import * as core from '../src/index';
import { newTalk } from '../src/talk';
import { saveTalk } from '../src/talk-log';
import type { Days, Settings } from '../src/types';

const st = { rollover: 4 } as Settings;
const at = (s: string) => new Date(s).getTime();
/* 2026-10-12 is a Monday */
const slip = (days: Days, k: string, time: string) => addEvent(days, k, 'slipped', time, {}, 1).days;
const urge = (days: Days, k: string, time: string) => addEvent(days, k, 'rode', time, {}, 1).days;

describe('the window', () => {
  it('needs enough to go on', () => {
    expect(riskWindow(slip({}, '2026-10-12', '21:10'), st, '2026-10-13')).toBeNull();
  });
  it('learns from slips on weekdays', () => {
    let d = slip({}, '2026-10-05', '21:10');
    d = slip(d, '2026-10-07', '22:40');
    d = slip(d, '2026-10-09', '15:00');
    const w = riskWindow(d, st, '2026-10-13')!;
    expect(w).toMatchObject({ start: 21, label: '9 to 11 PM', scope: 'weekdays', slips: 2, total: 3 });
    expect(w.line).toBe('2 of your last 3 slips started between 9 and 11 PM on a weekday.');
  });
  it('learns from urges and talk-throughs too, and falls back to all days', () => {
    let d: Days = {};
    for (const k of ['2026-10-05', '2026-10-06', '2026-10-10', '2026-10-11']) d = urge(d, k, '23:30');
    d = saveTalk(d, '2026-10-07', { ...newTalk(at('2026-10-07T23:10:00')) }, 1);
    d = saveTalk(d, '2026-10-08', { ...newTalk(at('2026-10-08T00:20:00')) }, 1);
    const w = riskWindow(d, st, '2026-10-13')!;
    expect(w.scope).toBe('all');
    expect(w.label).toBe('11 PM to 1 AM');
    expect(w.line).toBe('Your urges come most often between 11 PM and 1 AM.');
  });
  it('labels and times windows across midnight', () => {
    expect(riskLabel(14)).toBe('2 to 4 PM');
    expect(riskLabel(10)).toBe('10 AM to 12 PM');
    expect(riskLabel(22)).toBe('10 PM to 12 AM');
    expect(riskAt('2026-10-13', 1, 4)).toBe(at('2026-10-14T01:00:00'));
    expect(riskAt('2026-10-13', 21, 4, 30)).toBe(at('2026-10-13T21:30:00'));
  });
});

describe('the day', () => {
  let d = slip({}, '2026-10-05', '21:10');
  d = slip(d, '2026-10-07', '21:40');
  const k = '2026-10-13';
  it('moves from far to soon to during to after', () => {
    expect(riskDay(d, st, k, at('2026-10-13T12:00:00'))!.phase).toBe('far');
    expect(riskDay(d, st, k, at('2026-10-13T19:30:00'))!.phase).toBe('soon');
    expect(riskDay(d, st, k, at('2026-10-13T21:30:00'))!.phase).toBe('during');
    const after = riskDay(d, st, k, at('2026-10-13T23:30:00'))!;
    expect(after).toMatchObject({ phase: 'after', held: true, talked: null, kept: false });
  });
  it('a slip inside the window is not held; a talk-through before it counts as ready', () => {
    expect(riskDay(slip(d, k, '21:50'), st, k, at('2026-10-13T23:30:00'))!.held).toBe(false);
    const t = saveTalk(d, k, newTalk(at('2026-10-13T19:00:00')), 1);
    expect(riskDay(t, st, k, at('2026-10-13T20:00:00'))!.talked).toBe(at('2026-10-13T19:00:00'));
  });
  it('keeps a held hour once, as a calm move, and counts it for good', () => {
    const now = at('2026-10-14T08:00:00');
    const x = riskToKeep(d, st, '2026-10-14', now)!;
    expect(x.k).toBe('2026-10-13');
    const kept = keepHard(d, x.k, x.r.win.start, now);
    expect(kept[x.k]!.p!.hw).toBe(21);
    expect(kept[x.k]!.p!.c).toBe(1);
    expect(keepHard(kept, x.k, 21, now)).toBe(kept);
    expect(hardHeld(kept)).toBe(1);
    expect(riskToKeep(kept, st, '2026-10-14', now)?.k).not.toBe('2026-10-13');
  });
  it('gives a heads-up 90 minutes before each coming window (weekends use all days until they have their own)', () => {
    const t = riskAlerts(d, st, '2026-10-13', at('2026-10-13T20:00:00'), 7);
    expect(t[0]).toBe(at('2026-10-14T19:30:00'));
    expect(t).toHaveLength(6);
  });
});

it('the first pattern: three timed entries, most in two hours, words only, quiet after a slip', () => {
  const st = core.normSettings({ start: '2026-10-01', rollover: 4, u: 1 });
  const tk = '2026-10-10';
  let days = core.addEvent({}, '2026-10-05', 'rode', '22:10').days;
  days = core.addEvent(days, '2026-10-06', 'rode', '23:40').days;
  expect(core.firstPattern(days, st, tk)).toBeNull();
  days = core.addEvent(days, '2026-10-07', 'rode', '14:00').days;
  expect(core.firstPattern(days, st, tk)).toMatch(/^2 of your 3 urges came between 10 PM and /);
  /* the morning after a slip it stays quiet */
  const slipped = core.addEvent(days, '2026-10-09', 'slipped', '13:00').days;
  expect(core.firstPattern(slipped, st, tk)).toBeNull();
  expect(core.firstPattern(days, st, tk)).not.toMatch(/n't|'re|'s /);
});

describe('the hard hours card, for someone doing well', () => {
  const tk = '2026-10-13';
  const read = (days: Days, k: string, ids: string[]): Days => {
    const d = normDay({}, k);
    return { ...days, [k]: { ...d, p: { ...d.p!, ls: ids } } };
  };
  it('offers today’s lesson until one is done today', () => {
    const path = lessonPath();
    expect(riskLesson({}, st, tk)).toMatchObject({ L: path[0], n: 1, again: false });
    const yesterday = read({}, '2026-10-12', [path[0].id]);
    expect(riskLesson(yesterday, st, tk)).toMatchObject({ L: path[1], n: 2, again: false });
    expect(riskLesson(read(yesterday, tk, [path[1].id]), st, tk)).toBeNull();
  });
  it('offers a re-read, not a locked lesson, without an account', () => {
    const path = lessonPath();
    const free = read(
      {},
      '2026-10-10',
      path.slice(0, 3).map((L) => L.id),
    );
    const x = riskLesson(free, st, tk, false)!;
    expect(x.again).toBe(true);
    expect(path.slice(0, 3)).toContain(x.L);
    expect(riskLesson(free, st, tk, true)).toMatchObject({ L: path[3], again: false });
  });
  it('says when they start, and what the plan is for', () => {
    expect(riskStartLabel(23)).toBe('11 PM');
    expect(riskStartLabel(0)).toBe('12 AM');
    expect(riskPlanLabel(23)).toBe('Make a plan for tonight');
    expect(riskPlanLabel(1)).toBe('Make a plan for tonight');
    expect(riskPlanLabel(14)).toBe('Make a plan for today');
  });
  it('does not learn the hard hours from a plan made ahead of them', () => {
    let d: Days = {};
    for (const k of ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10']) d = urge(d, k, '23:30');
    const before = riskWindow(d, st, tk)!;
    expect(before.start).toBe(23);
    let p = d;
    for (const k of ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11'])
      p = saveTalk(p, k, { ...newTalk(at(k + 'T19:10:00')), p: 'change', pr: 1 }, 1);
    expect(riskWindow(p, st, tk)).toEqual(before);
    /* and the plan still turns the card calm */
    const today = saveTalk(d, tk, { ...newTalk(at('2026-10-13T21:30:00')), p: 'change', pr: 1 }, 1);
    expect(riskDay(today, st, tk, at('2026-10-13T21:40:00'))!.talked).toBe(at('2026-10-13T21:30:00'));
  });
});
