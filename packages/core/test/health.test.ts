import { describe, expect, it } from 'vitest';
import { addDays, normSettings } from '../src/legacy/core.js';
import { addEvent } from '../src/mutate';
import { healthHasNight, mergeNights, nightOf, nightsOf, nightsSince, normNights, sleepOn, type Nights, type SleepSample } from '../src/health';
import { patLeads, patPeriod } from '../src/pattern-cards';
import { saveCheckin, checkinFormOf } from '../src/day';
import { sunGoalCount, sunWeek } from '../src/sunday';
import type { DayKey, Days } from '../src/types';

const t = (s: string) => new Date(s).getTime();
const span = (a: string, b: string, value = 1): SleepSample => ({ start: t(a), end: t(b), value });

describe('nights from Health', () => {
  it('puts a night on the day it leads into', () => {
    expect(nightOf(t('2026-11-01T23:00:00'))).toBe('2026-11-02');
    expect(nightOf(t('2026-11-02T01:30:00'))).toBe('2026-11-02');
    expect(nightOf(t('2026-11-02T18:00:00'))).toBe('2026-11-03');
  });
  it('adds up asleep time, leaving out in bed and awake', () => {
    const n = nightsOf([
      span('2026-11-01T22:30:00', '2026-11-01T23:00:00', 0),
      span('2026-11-01T23:00:00', '2026-11-02T03:00:00', 3),
      span('2026-11-02T03:00:00', '2026-11-02T03:30:00', 2),
      span('2026-11-02T03:30:00', '2026-11-02T06:30:00', 5),
    ]);
    expect(n).toEqual({ '2026-11-02': 7 });
  });
  it('counts sleep the phone and the watch both recorded once', () => {
    const n = nightsOf([span('2026-11-01T23:00:00', '2026-11-02T07:00:00', 1), span('2026-11-02T00:00:00', '2026-11-02T06:00:00', 4)]);
    expect(n['2026-11-02']).toBe(8);
  });
  it('does not count an afternoon nap as the night', () => {
    const n = nightsOf([span('2026-11-02T15:00:00', '2026-11-02T16:30:00', 1)]);
    expect(n).toEqual({});
  });
  it('drops fragments and nonsense', () => {
    const n = nightsOf([
      span('2026-11-01T23:00:00', '2026-11-01T23:30:00', 1),
      { start: NaN, end: 5, value: 1 },
      span('2026-11-03T07:00:00', '2026-11-03T06:00:00', 1),
    ]);
    expect(n).toEqual({});
  });
});

describe('keeping nights', () => {
  it('cleans what comes back from storage', () => {
    expect(normNights(null)).toEqual({});
    expect(normNights([1, 2])).toEqual({});
    expect(normNights({ '2026-11-02': 7, nope: 6, '2026-11-03': 'x', '2026-11-04': 0.2, '2026-11-05': 40 })).toEqual({ '2026-11-02': 7 });
  });
  it('keeps only the latest nights, and a fresh read wins', () => {
    const many: Nights = {};
    for (let i = 0; i < 120; i++) many[addDays('2026-11-01', -i)] = 7;
    const kept = normNights(many);
    expect(Object.keys(kept).length).toBe(90);
    expect(kept['2026-11-01']).toBe(7);
    expect(mergeNights({ '2026-11-01': 7, '2026-10-31': 6 }, { '2026-11-01': 5.5 })).toEqual({ '2026-10-31': 6, '2026-11-01': 5.5 });
  });
  it('reads back from the evening ninety-one days before today', () => {
    expect(new Date(nightsSince('2026-11-01')).getHours()).toBe(18);
  });
});

describe('typed sleep and Health', () => {
  it('what the person typed wins; Health fills a night they did not type', () => {
    const k: DayKey = '2026-11-02';
    let d: Days = {};
    expect(sleepOn(d, { [k]: 6.5 }, k)).toBe(6.5);
    expect(sleepOn(d, null, k)).toBe(null);
    d = saveCheckin(d, k, { ...checkinFormOf(d, k), h: 8 });
    expect(sleepOn(d, { [k]: 6.5 }, k)).toBe(8);
    expect(healthHasNight({ [k]: 6.5 }, k)).toBe(true);
    expect(healthHasNight({}, k)).toBe(false);
  });
  it('never puts a night from Health into the log', () => {
    const k: DayKey = '2026-11-02';
    const d = saveCheckin({}, k, { ...checkinFormOf({}, k), md: 5 });
    sleepOn(d, { [k]: 6.5 }, k);
    expect(d[k].checkin!.h).toBe(null);
  });
});

describe('sleep before slips, with Health connected', () => {
  const TK = '2026-11-01';
  const st = normSettings({ start: '2026-01-01', day1: '2026-01-01' });
  const base = (): Days => ({ '2026-01-01': { events: [], u: 1 } as unknown as Days[string] });
  /** slips every other day, short nights before them from Health, and no check-ins at all */
  const build = (n: number, short = 5, long = 7.5) => {
    let d = base();
    const nights: Nights = {};
    for (let i = 1; i <= n; i++) {
      const s = addDays(TK, -i * 2);
      d = addEvent(d, s, 'slipped', '22:00', { trigger: null }, 1).days;
      nights[s] = short;
      nights[addDays(s, 1)] = long;
    }
    return { d, nights };
  };
  const keys = (d: Days) => patPeriod('all', d, st, TK).keys;
  it('says nothing until there are enough nights on each side', () => {
    const { d, nights } = build(4);
    expect(patLeads(d, keys(d), { nights, st, tk: TK }).list).toEqual([]);
  });
  it('reads Health nights on days with no check-in', () => {
    const { d, nights } = build(6);
    const r = patLeads(d, keys(d), { nights, st, tk: TK });
    expect(r.list.map((x) => x.k)).toEqual(['h']);
    expect(r.list[0].line).toBe('You slept less before slip days: 5 hours, against 7.5.');
    expect(r.sleep!.slipN).toBe(6);
  });
  it('says nothing when the nights are about the same', () => {
    const { d, nights } = build(6, 7, 7.25);
    expect(patLeads(d, keys(d), { nights, st, tk: TK }).list).toEqual([]);
  });
  it('without Health, reads as it always did', () => {
    const { d } = build(6);
    expect(patLeads(d, keys(d)).list).toEqual([]);
    expect(patLeads(d, keys(d), { nights: {}, st, tk: TK }).sleep).toBeUndefined();
  });
});

describe('the Sunday sleep goal, with Health connected', () => {
  it('counts a Health night when none was typed, and a typed night wins', () => {
    const sun: DayKey = '2026-11-01';
    const g = { t: 'Seven hours of sleep, 4 nights', k: 'sleep' as const, n: 4 };
    let d: Days = {};
    const mon = addDays(sun, -6);
    d = saveCheckin(d, mon, { ...checkinFormOf(d, mon), h: 5 });
    const nights: Nights = { [mon]: 8, [addDays(sun, -5)]: 7.5, [addDays(sun, -4)]: 6 };
    expect(sunGoalCount(d, g, sun, sun)).toBe(0);
    expect(sunGoalCount(d, g, sun, sun, nights)).toBe(1);
    expect(sunWeek(d, normSettings({ start: '2026-10-01' }), sun, sun, nights).sleep).toEqual([5, 7.5, 6]);
  });
});
