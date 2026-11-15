/* The Sunday review's one goal: options from the person's own week, each with why, the plan, and what counts it. */
import { describe, expect, it } from 'vitest';
import { normSettings } from '../src/legacy/core.js';
import { addEvent } from '../src/mutate';
import { sunWeek } from '../src/sunday';
import { SUN_HOW, sunOptions, sunOwnGoal, sunPlanFor, sunRemindLine } from '../src/sunday-goal';
import type { Days } from '../src/types';

const SUN = '2026-10-18';
const st = normSettings({ start: '2026-09-01', day1: '2026-09-08', screensOff: '22:30' });

describe('the goal options', () => {
  it('start from what the week showed, with why in plain numbers, three at most and each a different goal', () => {
    let d: Days = {};
    d = addEvent(d, '2026-10-13', 'slipped', '22:40', { trigger: 'lonely' }, 1).days;
    d = addEvent(d, '2026-10-15', 'slipped', '23:10', { trigger: 'stress' }, 1).days;
    d = addEvent(d, '2026-10-16', 'slipped', '15:10', { trigger: 'stress' }, 1).days;
    const w = sunWeek(d, st, SUN, SUN);
    const o = sunOptions(w, st);
    expect(o.length).toBe(3);
    expect(o[0]).toMatchObject({ id: 'late', g: { k: 'phone', n: 5, t: 'Phone away by 10:30 PM, 5 nights' }, why: '2 of your 3 slips came after 9 PM.' });
    expect(o[0].plan).toEqual({ w: 'it gets to 10:30 PM', t: 'put my phone in another room' });
    expect(o[1]).toMatchObject({ id: 'lonely', g: { k: 'reach' } });
    expect(new Set(o.map((x) => x.g.k)).size).toBe(3);
  });

  it('says a single slip as one, not "all 1"', () => {
    const d = addEvent({}, '2026-10-13', 'slipped', '22:40', {}, 1).days;
    expect(sunOptions(sunWeek(d, st, SUN, SUN), st)[0].why).toBe('Your slip came after 9 PM.');
  });

  it('offers last week’s goal again first when it was not kept, and one more night when it was', () => {
    const w = sunWeek({}, st, SUN, SUN);
    const again = sunOptions(w, st, { g: { t: 'x', k: 'lesson', n: 3 }, done: 2, met: false });
    expect(again[0]).toMatchObject({ id: 'again', g: { k: 'lesson', n: 3 }, why: 'Last week: 2 of 3 days. One more week makes it yours.' });
    const kept = sunOptions(w, st, { g: { t: 'x', k: 'lesson', n: 3 }, done: 3, met: true });
    expect(kept.find((x) => x.g.k === 'lesson')!.g.n).toBe(4);
  });

  it('a quiet week still has goals to pick', () => {
    expect(sunOptions(sunWeek({}, st, SUN, SUN), st).length).toBeGreaterThanOrEqual(2);
  });
});

describe('what a goal does', () => {
  it('names what counts it and the reminder it turns on', () => {
    expect(SUN_HOW.phone.remind).toBe('wind');
    expect(sunRemindLine('phone', st)).toBe('A reminder at 9:30 PM, an hour before 10:30 PM');
    expect(sunRemindLine('checkin', st, '19:00')).toBe('A reminder at 7:00 PM each day');
    expect(sunRemindLine('reach', st)).toBeNull();
    expect(sunPlanFor('wind', st)).toEqual({ w: 'it gets to 9:30 PM', t: 'start winding down, screens dimmed' });
  });
  it('keeps a goal in the person’s own words, cleaned', () => {
    expect(sunOwnGoal('  a walk   after dinner ')).toEqual({ t: 'a walk after dinner' });
  });
});
