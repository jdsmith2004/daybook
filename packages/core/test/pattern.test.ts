/* Your pattern: the stretches between slips and their trend, riding out week by week, when it happens (with the same hard
   hours as Today), what sets it off, what is different on hard days, and the sentences at the top. */
import { describe, expect, it } from 'vitest';
import { normSettings } from '../src/legacy/core.js';
import { addEvent } from '../src/mutate';
import { inTen, patDiffs, patGaps, patInsights, patKeys, patNowLine, patRideOut, patTriggerLines, patTriggers, patWeeks, patWhen } from '../src/pattern';
import { riskWindow } from '../src/risk';
import type { DayKey, Days } from '../src/types';
import { addDays } from '../src/legacy/core.js';

const st = normSettings({ start: '2026-08-01', day1: '2026-08-01' });
const ev = (d: Days, k: DayKey, o: 'slipped' | 'rode', time: string, trigger: string | null = null) => addEvent(d, k, o, time, { trigger }, 1).days;
const ci = (d: Days, k: DayKey, c: Record<string, unknown>): Days => ({
  ...d,
  [k]: { ...(d[k] || { d: k, events: [] }), checkin: { m: null, c: null, e: null, s: null, h: null, so: null, ro: null, n: '', done: true, at: 1, ...c } },
});

describe('the range', () => {
  it('runs from the start of the log, or the last 30 or 90 days', () => {
    expect(patKeys('30', {}, st, '2026-10-17')).toHaveLength(30);
    expect(patKeys('90', {}, st, '2026-10-17')[0]).toBe('2026-08-01');
    expect(patKeys('all', {}, st, '2026-10-17')[0]).toBe('2026-08-01');
  });
});

describe('further apart', () => {
  it('counts the clean days before each slip, and sees the gaps grow', () => {
    let d: Days = {};
    for (const k of ['2026-08-05', '2026-08-07', '2026-08-10', '2026-08-16', '2026-08-26', '2026-09-12']) d = ev(d, k, 'slipped', '22:00');
    const g = patGaps(d, st, '2026-09-20');
    expect(g.runs).toEqual([4, 1, 2, 5, 9, 16]);
    expect(g.now).toBe(7);
    expect(g.slips).toBe(6);
    expect(g.trend).toBe('apart');
    expect(patNowLine(g, '2026-09-20', '2026-09-12')).toBe('Now: 7 clean days since your last slip, and counting.');
    expect(patNowLine({ ...g, now: 0 }, '2026-09-13', '2026-09-12')).toBe('Your last slip was yesterday. Today is day 1 of the next stretch.');
    expect(patNowLine({ ...g, now: 0 }, '2026-09-12', '2026-09-12')).toBe('Your last slip was today. The next stretch starts now.');
  });
  it('says so gently when they come closer, and nothing without enough', () => {
    let d: Days = {};
    for (const k of ['2026-08-10', '2026-08-25', '2026-09-08', '2026-09-12', '2026-09-14', '2026-09-15']) d = ev(d, k, 'slipped', '22:00');
    expect(patGaps(d, st, '2026-09-15').trend).toBe('closer');
    expect(patGaps(ev({}, '2026-08-10', 'slipped', '22:00'), st, '2026-08-20').trend).toBeNull();
    expect(patNowLine(patGaps({}, st, '2026-08-20'), '2026-08-20', null)).toBe('No slip logged yet. Every day here counts.');
  });
  it('rides out more, week by week', () => {
    let d: Days = {};
    const keys = patKeys('90', d, st, '2026-10-17');
    keys.forEach((k, i) => {
      if (i % 3) return;
      d = ev(d, k, i < 45 ? (i % 2 ? 'rode' : 'slipped') : i % 9 ? 'rode' : 'slipped', '21:00');
    });
    const w = patWeeks(d, keys);
    expect(w).toHaveLength(12);
    expect(w[w.length - 1].from).toBe('2026-10-11');
    const r = patRideOut(w)!;
    expect(r.now).toBeGreaterThan(r.then);
    expect(inTen(0.84)).toBe('8 in 10');
  });
});

describe('when and what', () => {
  /* 2026-10-12 is a Monday */
  let d: Days = {};
  for (const k of ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-12', '2026-10-13']) d = ev(d, k, 'slipped', '21:30', 'stress');
  for (const k of ['2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11', '2026-10-14', '2026-10-15']) d = ev(d, k, 'rode', '15:10', 'bored');
  const keys = patKeys('30', d, st, '2026-10-16');

  it('uses the same hard hours as Today', () => {
    const w = patWhen(d, st, keys, '2026-10-16');
    expect(w.hard.weekdays).toEqual(riskWindow(d, st, '2026-10-16'));
    expect(w.hard.weekdays!.label).toBe('9 to 11 PM');
    expect(w.hours[21].slipped).toBe(5);
    expect(w.hours[15].rode).toBe(6);
    expect(w.timed).toBe(11);
    expect(w.week[1]).toMatchObject({ name: 'Monday', slipped: 2 });
  });
  it('names the trigger that comes most, and the one to plan for', () => {
    const t = patTriggers(d, st, keys, '2026-10-16');
    expect(t.list.map((x) => x.k)).toEqual(['bored', 'stress']);
    expect(patTriggerLines(t.list)).toEqual([
      '“Bored or idle” comes up most: 6 times, and you rode it out every time.',
      'When it is stressed or anxious, it ends in a slip 5 times out of 5. That is the one to plan for.',
    ]);
  });
  it('puts it together in at most three sentences', () => {
    const g = patGaps(d, st, '2026-10-16');
    const ins = patInsights(g, null, patWhen(d, st, keys, '2026-10-16'), patTriggers(d, st, keys, '2026-10-16').list);
    expect(ins.map((x) => x.go)).toEqual(['when', 'what']);
    expect(ins[0].t).toBe('Your last 5 slips all started between 9 and 11 PM on a weekday.');
  });
});

describe('hard days', () => {
  it('shows only differences that mean something, with three days on each side', () => {
    let d: Days = {};
    const start = '2026-10-01';
    for (let i = 0; i < 8; i++) {
      const k = addDays(start, i);
      const slip = i % 2 === 0;
      if (slip) d = ev(d, k, 'slipped', '22:00');
      d = ci(d, k, { h: slip ? 5.5 : 7.5, m: 7, s: slip ? 6 : 5.5, so: slip ? 'N' : 'Y' });
    }
    const r = patDiffs(d, patKeys('30', d, st, '2026-10-08'));
    expect(r.cleanN).toBe(4);
    expect(r.slipN).toBe(4);
    expect(r.list.map((x) => x.k)).toEqual(['h', 'so']);
    expect(r.list[0].line).toBe('You slept less before slip days: 5.5 hours, against 7.5.');
    expect(r.list[1].line).toBe('Screens off on time: 100% of days with no slip, 0% of slip days.');
  });
});
