/* Live Activities: the hard hours and the night (live-activity.ts). Every day here is made up. */
import { describe, expect, it } from 'vitest';
import * as core from '../src/index';
import type { Days } from '../src/types';

const tk = '2026-10-20';
const at = (h: number, m = 0, d = 20) => new Date(2026, 9, d, h, m).getTime();
const st = core.normSettings({ start: '2026-09-01', day1: '2026-09-01', cleanMode: 'gentle', screensOff: '23:00', rollover: 4 });
/* urges ridden out between 8 and 10 PM on many weekdays: hard hours 8 to 10 PM */
let hard: Days = {};
for (const k of ['2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16'])
  hard = core.addEvent(hard, k, 'rode', '20:30', {}, 1).days;

describe('the hard hours', () => {
  it('show from the heads-up to their end, and a tap opens SOS', () => {
    expect(core.riskWindow(hard, st, tk)?.start).toBe(20);
    expect(core.livePlan(hard, st, tk, at(17))).toBeNull();
    const p = core.livePlan(hard, st, tk, at(18, 40))!;
    expect(p).toMatchObject({ kind: 'hard', url: '/sos', sub: 'Till 10 PM', to: at(22) });
    /* the bar is the hard hours themselves */
    expect(p.bar).toEqual({ a: at(20), b: at(22), left: '8 PM', right: '10 PM' });
    expect(core.livePlan(hard, st, tk, at(21, 30))?.kind).toBe('hard');
  });
});

describe('the night', () => {
  it('winds down from 30 minutes before screens off, and sleeps after Goodnight till morning', () => {
    expect(core.livePlan({}, st, tk, at(22, 20))).toBeNull();
    expect(core.livePlan({}, st, tk, at(22, 40))).toMatchObject({ kind: 'night', asleep: false, sub: 'Screens off at 11:00 PM', url: '/wind' });
    expect(core.livePlan({}, st, tk, at(0, 30, 21))).toBeNull();
    const bed = { [tk]: core.normDay({ p: { po: '22:50' } }, tk) };
    expect(core.livePlan(bed, st, tk, at(22, 55))).toMatchObject({ kind: 'night', asleep: true, to: at(4, 0, 21) });
    expect(core.livePlan(bed, st, tk, at(22, 55))!.bar).toMatchObject({ left: '10:50 PM', right: '4 AM' });
    expect(core.livePlan({}, st, tk, at(22, 40))!.bar).toMatchObject({ left: '10:30 PM', right: '11 PM' });
  });

  it('gives way to the hard hours when both fall at once', () => {
    const late = { ...st, screensOff: '21:00' };
    expect(core.livePlan(hard, late, tk, at(20, 30))?.kind).toBe('hard');
  });
});

describe('the words', () => {
  it('never say what Daybook is for, or ask for help', () => {
    const all = [core.LIVE_WORDS.hard, core.LIVE_WORDS.wind, core.LIVE_WORDS.asleep, core.LIVE_WORDS.hardSub(22)];
    for (const w of all) expect(w).not.toMatch(/porn|habit|slip|clean|sober|addict|urge|help|sos|craving|n't/i);
  });
});
