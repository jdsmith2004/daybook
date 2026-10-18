/* The Sunday review as a walk through the week: the days, the longest stretch, how long urges took, when and why they came,
   what helped, the slips, the long view kindly framed, the science for each screen, the one longer card, and the extras
   for the week ahead. */
import { describe, expect, it } from 'vitest';
import { normSettings } from '../src/legacy/core.js';
import { normRecord } from '../src/data';
import { addEvent } from '../src/mutate';
import {
  story,
  storyBest,
  storyDays,
  storyDeep,
  storyHardDays,
  storyHelp,
  storyIfLine,
  storyIfThen,
  storyIfWhen,
  storyRideMins,
  storySlips,
  storyStretch,
  storyTeach,
  storyTrend,
  storyTrig,
  storyWeeks,
} from '../src/sunday-story';
import { normSun, saveSun, sunPlanNow, sunWeek } from '../src/sunday';
import type { Days, Reviews } from '../src/types';

/* 2026-10-12 is a Monday, 2026-10-18 a Sunday */
const SUN = '2026-10-18';
const st = normSettings({ start: '2026-08-01', day1: '2026-08-08', safePerson: 'Sam Lee' });
const at = (k: string, t: string) => new Date(+k.slice(0, 4), +k.slice(5, 7) - 1, +k.slice(8, 10), +t.slice(0, 2), +t.slice(3, 5)).getTime();
const END = at('2026-10-19', '03:00');

function week(): Days {
  let d: Days = {};
  const add = (k: string, o: 'rode' | 'slipped', t: string, x = {}) => (d = addEvent(d, k, o, t, x, 1).days);
  add('2026-10-12', 'rode', '22:10', { trigger: 'stress', did: ['move'], m: 6, tr: [['breathe', 'p']] });
  add('2026-10-13', 'rode', '21:40', { trigger: 'stress', m: 10, tr: [['breathe', 'p']] });
  add('2026-10-14', 'slipped', '23:30', { trigger: 'late', wt: 5 });
  add('2026-10-15', 'slipped', '22:50', { trigger: 'late' });
  add('2026-10-17', 'rode', '14:00', { trigger: 'bored', did: ['move'], m: 4, tr: [['breathe', 's']] });
  return d;
}

describe('the week, screen by screen', () => {
  const d = week();
  it('lights the seven days, and keeps the days to come apart', () => {
    expect(storyDays(d, st, SUN, SUN).map((x) => x.l + x.state[0])).toEqual(['Mc', 'Tc', 'Ws', 'Ts', 'Fc', 'Sc', 'Sc']);
    expect(storyDays(d, st, SUN, '2026-10-16').map((x) => x.state)).toEqual(['clean', 'clean', 'slip', 'slip', 'clean', 'ahead', 'ahead']);
  });
  it('finds the longest stretch with no slip', () => {
    /* from the slip on Thursday at 22:50 to the end of Sunday's day (Monday 4 AM) */
    expect(Math.round(storyBest(d, st, SUN, END))).toBe(Math.round((at('2026-10-19', '03:00') - at('2026-10-15', '22:50')) / 3600000));
    expect(storyStretch(76.5)).toBe('3 days, 4 hours');
    expect(storyStretch(18.2)).toBe('18 hours');
    expect(storyStretch(48)).toBe('2 days');
    expect(storyStretch(0.4)).toBe('under an hour');
  });
  it('says how long the urges took, what set them off, and what helped', () => {
    expect(storyRideMins(d, SUN, SUN)).toBe(6);
    const w = sunWeek(d, st, SUN, SUN);
    expect(storyTrig(w, st).map((x) => [x.id, x.rode, x.slipped])).toEqual([
      ['late', 0, 2],
      ['stress', 2, 0],
      ['bored', 1, 0],
    ]);
    expect(storyHelp(w, st).map((x) => [x.t, x.ev])).toEqual([
      ['Breathe', 'worked 2 of 3 times'],
      ['Walked or moved', '2 times'],
    ]);
  });
  it('lists a move once, even when it was a tool and something done', () => {
    const r = addEvent({}, '2026-10-16', 'rode', '20:00', { did: ['reach'], tr: [['message', 'p']] }, 1).days;
    expect(storyHelp(sunWeek(r, st, SUN, SUN), st).map((x) => [x.t, x.ev])).toEqual([['Reach a person', 'worked the time you used it']]);
  });
  it('tells the slips honestly: one waited first, and two came close together', () => {
    const s = storySlips(d, st, SUN, SUN);
    expect(s).toMatchObject({ n: 2, waited: 1, topN: 2, close: true });
    expect(s.top).toBe('Late night / in bed');
  });
  it('picks its screens, leaving out what has nothing to show', () => {
    const x = story(d, st, {}, SUN, SUN, END, { '2026-10-12': 20, '2026-10-17': 15, '2026-10-01': 99 });
    expect(x.screens).toEqual(['intro', 'days', 'ride', 'clock', 'trig', 'help', 'slips', 'long', 'deep']);
    expect(x.pts).toBe(35);
    expect(x.deep.id).toBe('snowball');
    const quiet = story({}, st, {}, SUN, SUN, END, {});
    expect(quiet.screens).toEqual(['intro', 'days', 'long', 'deep']);
    expect(quiet.deep.id).toBe('clean');
  });
});

describe('the long view, kindly', () => {
  const W = (noSlip: number, rode = 0) => ({ sun: '', days: 7, noSlip, slipped: 7 - noSlip, rode });
  it('names a better week, and on a harder week says what held', () => {
    expect(storyTrend([W(3)]).kind).toBe('first');
    expect(storyTrend([W(2), W(3), W(5)])).toEqual({ kind: 'best', line: 'Your best week in 3 weeks: 5 days with no slip.' });
    expect(storyTrend([W(5), W(3), W(4)]).line).toBe('Up from 3 days with no slip last week to 4.');
    expect(storyTrend([W(4), W(4)]).line).toBe('As steady as last week: 4 days with no slip.');
    expect(storyTrend([W(5), W(2, 6)]).line).toBe('A harder week, and you still rode out 6 urges. Hard weeks are part of every climb.');
    expect(storyTrend([W(5), W(0)]).line).toBe('A harder week, and you still showed up and logged it honestly. Hard weeks are part of every climb.');
  });
  it('counts back up to eight weeks, from where the log starts', () => {
    const late = normSettings({ start: '2026-10-01' });
    expect(storyWeeks({}, late, SUN, SUN).map((x) => x.sun)).toEqual(['2026-10-04', '2026-10-11', SUN]);
    expect(storyWeeks({}, st, SUN, SUN)).toHaveLength(8);
  });
});

describe('the science', () => {
  it('gives every look-back screen one line, a source and a lesson', () => {
    for (const k of ['days', 'ride', 'clock', 'trig', 'help', 'slips', 'base', 'last'] as const) {
      const t = storyTeach(k)!;
      expect(t.t.length).toBeGreaterThan(40);
      expect(t.src.length).toBeGreaterThan(0);
      expect(t.l).toMatch(/^l\d+$/);
      expect(t.t).not.toMatch(/n’t|n't|’re|’ll|’ve/);
    }
    expect(storyTeach('days', { slipDays: 2 })!.l).toBe('l21');
  });
  it('picks the longer card for the hardest pattern', () => {
    const lonely = addEvent({}, '2026-10-16', 'slipped', '20:00', { trigger: 'lonely' }, 1).days;
    const w = sunWeek(lonely, st, SUN, SUN);
    expect(storyDeep(w, st, { close: false }).id).toBe('lonely');
    expect(storyDeep(sunWeek({}, st, SUN, SUN), st, { close: false }).id).toBe('clean');
  });
});

describe('getting ready for the week ahead', () => {
  it('finds the hard days, and offers if-then plans that fit', () => {
    let d: Days = {};
    for (const k of ['2026-09-26', '2026-10-03', '2026-10-10', '2026-10-14']) d = addEvent(d, k, 'slipped', '23:00', { trigger: 'late' }, 1).days;
    expect(storyHardDays(d, SUN)).toEqual([{ d: 6, name: 'Saturday', slips: 3, of: 4 }]);
    expect(storyIfWhen(d, st, SUN)).toEqual(['it gets to 11 PM', 'I am in bed late with my phone', 'it is Saturday night', 'an urge hits']);
    expect(storyIfThen(sunWeek(week(), st, SUN, SUN), st)).toEqual([
      'open SOS and start Breathe',
      'put my phone in another room',
      'text Sam',
      'go for a short walk',
    ]);
    expect(storyIfLine({ w: 'it gets to 10 PM', t: 'put my phone in another room' })).toBe('When it gets to 10 PM, I will put my phone in another room.');
  });
  it('keeps the extras with the review, and shows them during the week', () => {
    let rv: Reviews = saveSun(
      {},
      '2026-10-11',
      { w: [], c: [], g: null, it: { w: 'it gets to 10 PM', t: 'go for a short walk' }, hd: [6, 6, 9], nt: '  You have done this before.  ' },
      1,
    );
    expect(rv['s2026-10-11'].sun).toMatchObject({ it: { w: 'it gets to 10 PM', t: 'go for a short walk' }, hd: [6], nt: 'You have done this before.' });
    expect(sunPlanNow(rv, '2026-10-13')).toEqual({ sun: SUN, it: { w: 'it gets to 10 PM', t: 'go for a short walk' }, hard: false, nt: null });
    expect(sunPlanNow(rv, '2026-10-17')).toMatchObject({ hard: true, nt: 'You have done this before.' });
    expect(sunPlanNow(rv, '2026-10-20')).toBeNull();
    rv = saveSun({}, '2026-10-11', { w: [], c: [], g: null }, 2);
    expect(sunPlanNow(rv, '2026-10-17')).toBeNull();
    expect(normSun({ w: [], c: [], g: null, it: { w: 'x' }, hd: 'sat', nt: 4 })).toEqual({ w: [], c: [], g: null });
    const rec = normRecord({ id: 'reviews/s2026-10-11', u: 5, data: { a: {}, sun: { w: [], c: [], g: null, nt: 'Keep going' } } })!;
    expect((rec.data as { sun?: { nt?: string } }).sun?.nt).toBe('Keep going');
  });
});
