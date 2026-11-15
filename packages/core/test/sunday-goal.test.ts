/* The Sunday review: what the week says, and goals that grow the person (not a count of slips), each with why, its plan and what counts it. */
import { describe, expect, it } from 'vitest';
import { normSettings } from '../src/legacy/core.js';
import { addEvent } from '../src/mutate';
import { sunWeek } from '../src/sunday';
import { SUN_HOW, sunMore, sunOptions, sunOwnGoal, sunPlanFor, sunRemindLine, sunSays } from '../src/sunday-goal';
import type { Days } from '../src/types';

const SUN = '2026-10-18';
const st = normSettings({ start: '2026-09-01', day1: '2026-09-08', screensOff: '22:30' });
const P = (o: Record<string, unknown>) => ({ w: [], wd: false, r: false, c: 0, m: false, tl: [], po: null, ls: [], lv: [], ov: {}, ...o });

describe('the goal options', () => {
  it('lead with a lesson every day, then answer the week’s hardest pattern, three at most and each different', () => {
    let d: Days = {};
    d = addEvent(d, '2026-10-13', 'slipped', '22:40', { trigger: 'lonely' }, 1).days;
    d = addEvent(d, '2026-10-14', 'rode', '20:40', { trigger: 'lonely' }, 1).days;
    d = addEvent(d, '2026-10-15', 'slipped', '23:10', { trigger: 'stress' }, 1).days;
    const o = sunOptions(sunWeek(d, st, SUN, SUN), st);
    expect(o.map((x) => x.id)).toEqual(['lesson', 'reach', 'phone']);
    expect(o[0].g).toMatchObject({ t: 'A lesson every day', k: 'lesson', n: 7 });
    expect(o[2].why).toBe('2 slips came after 9 PM. A phone in another room is a choice made while you are strong.');
    expect(o[2].plan).toEqual({ w: 'it gets to 10:30 PM', t: 'put my phone in another room' });
    expect(o[1].why).toContain('Feeling lonely came up 2 times');
  });

  it('offers last week’s goal again first when it was not kept', () => {
    const o = sunOptions(sunWeek({}, st, SUN, SUN), st, { g: { t: 'x', k: 'phone', n: 5 }, done: 3, met: false });
    expect(o[0]).toMatchObject({ id: 'phone', g: { k: 'phone', n: 5 }, why: 'Last week: 3 of 5 nights. Another week makes it part of who you are.' });
  });

  it('never asks for less than the week already did', () => {
    const d: Days = {};
    for (const k of ['2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16', '2026-10-17']) d[k] = { events: [], p: P({ po: '22:00' }) } as never;
    const all = sunOptions(sunWeek(d, st, SUN, SUN), st).concat(sunMore(sunWeek(d, st, SUN, SUN), st, []));
    expect(all.find((x) => x.id === 'phone')!.g.n).toBe(7);
  });

  it('faith and who you are becoming come only for the person they fit, and are kept in words', () => {
    const plain = sunMore(sunWeek({}, st, SUN, SUN), st, []);
    expect(plain.some((x) => x.id === 'faith' || x.id === 'become')).toBe(false);
    const st2 = { ...st, becoming: 'Someone who keeps his word', onb: { ...st.onb, a: { faith: 'big' } } } as typeof st;
    const more = sunOptions(sunWeek({}, st2, SUN, SUN), st2).concat(sunMore(sunWeek({}, st2, SUN, SUN), st2, []));
    expect(more.find((x) => x.id === 'faith')!.g).toEqual({ t: 'Pray or read scripture each morning' });
    expect(more.find((x) => x.id === 'become')!.g).toEqual({ t: 'Read who I am becoming each morning' });
  });

  it('the more list holds every other goal, none twice', () => {
    const w = sunWeek({}, st, SUN, SUN);
    const o = sunOptions(w, st);
    const more = sunMore(w, st, o);
    expect(new Set(o.concat(more).map((x) => x.id)).size).toBe(o.length + more.length);
    expect(more.length).toBeGreaterThanOrEqual(3);
  });
});

describe('what the week says', () => {
  it('names the free days, the urges ridden out and the hard hours, three lines at most', () => {
    let d: Days = {};
    d = addEvent(d, '2026-10-13', 'rode', '22:40', {}, 1).days;
    d = addEvent(d, '2026-10-15', 'slipped', '23:10', {}, 1).days;
    const says = sunSays(sunWeek(d, st, SUN, SUN), '9 to 11 PM');
    expect(says.length).toBe(3);
    expect(says[0].t).toMatch(/free, 1 slip, told honestly/);
    expect(says[1].t).toMatch(/^1 urge ridden out/);
    expect(says[2].t).toBe('Your hard hours were 9 to 11 PM. That is where one plan does the most.');
  });
});

describe('what a goal does', () => {
  it('names what counts it and the reminder it turns on', () => {
    expect(SUN_HOW.phone.remind).toBe('wind');
    expect(sunRemindLine('phone', st)).toBe('A reminder at 9:30 PM, an hour before 10:30 PM');
    expect(sunRemindLine('checkin', st, '19:00')).toBe('A reminder at 7:00 PM each day');
    expect(sunRemindLine('reach', st)).toBeNull();
    expect(sunPlanFor('move', st)).toEqual({ w: 'I feel restless or stressed', t: 'go for a walk or a run first' });
  });
  it('keeps a goal in the person’s own words, cleaned', () => {
    expect(sunOwnGoal('  a walk   after dinner ')).toEqual({ t: 'a walk after dinner' });
  });
});
