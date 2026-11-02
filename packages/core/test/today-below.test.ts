/* Under Your day on Today: tonight's two lines of the urge plan, how close the hard hours are, and the one true line under who you
   are becoming. */
import { describe, expect, it } from 'vitest';
import { normSettings } from '../src/legacy/core.js';
import { rodeProof } from '../src/miles';
import { addEvent } from '../src/mutate';
import { planTonight } from '../src/plan';
import { riskDay, riskWhen } from '../src/risk';
import type { Days, Settings } from '../src/types';

const st = normSettings({ v: 1, start: '2026-09-01', rollover: 4, screensOff: '23:00', u: 1 }) as Settings;
const at = (s: string) => new Date(s).getTime();
const ev = (days: Days, k: string, outcome: 'rode' | 'slipped', time: string, trigger: string | null = null, n = 1) =>
  addEvent(days, k, outcome, time, { trigger, id: k + time + n }, 1).days;
/* urges at 9:30 PM on weekdays, so the hard hours are 9 to 11 PM */
const nights = (trigger: string | null) => {
  let d: Days = {};
  for (const k of ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-12', '2026-10-13']) d = ev(d, k, 'rode', '21:30', trigger);
  return d;
};

describe('tonight’s lines', () => {
  it('late hard hours: the line for bed or late at night first, then the feeling that comes most', () => {
    let d = nights('bored');
    d = ev(d, '2026-10-10', 'slipped', '23:00', 'lonely');
    d = ev(d, '2026-10-11', 'slipped', '23:00', 'lonely', 2);
    d = ev(d, '2026-10-11', 'slipped', '23:30', 'lonely', 3);
    const lines = planTonight(d, st, '2026-10-14');
    expect(lines).toHaveLength(2);
    expect(lines[0].when).toMatch(/bed late at night/);
    expect(lines[0].then).toBe('Get up and leave the room for 10 minutes.');
    expect(lines[1].when).toMatch(/lonely/);
  });
  it('with no hard hours yet, the feeling that comes most, then the plan in order', () => {
    let d: Days = {};
    for (const k of ['2026-10-05', '2026-10-06']) d = ev(d, k, 'rode', '14:00', 'stress');
    const lines = planTonight(d, st, '2026-10-14');
    expect(lines[0].when).toMatch(/stressed/);
    expect(lines[1].when).toMatch(/bed late at night/);
  });
  it('a trigger of their own is matched by its words', () => {
    const s = { ...st, opts: { trig: [{ id: 'u_work1', t: 'Work deadlines' }], did: [] } } as unknown as Settings;
    const own = { ...s, plan: [...st.plan.slice(0, 4), { when: 'Work deadlines pile up', then: 'Close the laptop at six.' }] };
    let d: Days = {};
    for (const k of ['2026-10-05', '2026-10-06']) d = ev(d, k, 'rode', '14:00', 'u_work1');
    expect(planTonight(d, own, '2026-10-14')[0]).toEqual({ when: 'Work deadlines pile up', then: 'Close the laptop at six.' });
  });
  it('leaves out the blank line and lines with nothing to do', () => {
    const s = {
      ...st,
      plan: [
        { when: 'Something else: ______', then: 'x' },
        { when: 'I am bored', then: '  ' },
        { when: 'I am tired', then: 'Sleep. Really.' },
      ],
    };
    expect(planTonight({}, s, '2026-10-14')).toEqual([{ when: 'I am tired', then: 'Sleep.' }]);
    expect(planTonight({}, { ...st, plan: [] }, '2026-10-14')).toEqual([]);
  });
});

describe('how close the hard hours are', () => {
  const d = nights(null);
  const r = (s: string) => riskDay(d, st, '2026-10-14', at(s))!;
  it('far off, then hours, then minutes, then now, then nothing', () => {
    expect(riskWhen(r('2026-10-14T12:00:00'), at('2026-10-14T12:00:00'))).toBeNull();
    expect(riskWhen(r('2026-10-14T19:10:00'), at('2026-10-14T19:10:00'))).toBe('in 2 hours');
    expect(riskWhen(r('2026-10-14T20:00:00'), at('2026-10-14T20:00:00'))).toBe('in an hour');
    expect(riskWhen(r('2026-10-14T20:20:00'), at('2026-10-14T20:20:00'))).toBe('in 40 minutes');
    expect(riskWhen(r('2026-10-14T21:30:00'), at('2026-10-14T21:30:00'))).toBe('now');
    expect(riskWhen(r('2026-10-14T23:30:00'), at('2026-10-14T23:30:00'))).toBeNull();
  });
});

describe('the line under who you are becoming', () => {
  it('the last urge ridden out, as a moment, and the count', () => {
    const d = nights(null);
    expect(rodeProof(d, st, '2026-10-14')).toEqual({ t: 'You rode out an urge yesterday at 9:30 PM.', n: '7 times now.' });
    expect(rodeProof(d, st, '2026-10-15')!.t).toBe('You rode out an urge Tuesday at 9:30 PM.');
  });
  it('one today is in Today so far already, so it says who that makes them', () => {
    const d = ev({}, '2026-10-14', 'rode', '13:10');
    expect(rodeProof(d, st, '2026-10-14')).toEqual({ t: 'You are someone who rides out urges:', n: 'Your first.' });
  });
  it('quiet with none in two weeks, and slips never count', () => {
    expect(rodeProof(ev({}, '2026-09-20', 'rode', '13:10'), st, '2026-10-14')).toBeNull();
    expect(rodeProof(ev({}, '2026-10-13', 'slipped', '23:00'), st, '2026-10-14')).toBeNull();
  });
});
