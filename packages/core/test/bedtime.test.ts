/* Bedtime from the ground up (bedtime.ts): one stop, one screen, Goodnight as the wind-down, and sleep worked out the next
   morning instead of asked at night. */
import { describe, expect, it } from 'vitest';
import { dayPoints, normDay, normSettings } from '../src/legacy/core.js';
import { awayMs, goodnight, guessSleep, lastNight, moodStart, setSleep, sleepGuess } from '../src/bedtime';
import { checkinFormOf, saveCheckin, stopTiles } from '../src/day';
import { dayFeelSet } from '../src/day-feel';
import { withDay } from '../src/mutate';
import { thenLine } from '../src/moment';
import type { Days } from '../src/types';

const st = normSettings({ start: '2026-10-01', day1: '2026-10-08', screensOff: '22:30' });
const tk = '2026-10-18';
const prev = '2026-10-17';
const at = (d: number, h: number, m = 0) => new Date(2026, 9, d, h, m).getTime();
const form = (o: object = {}) => ({ ...checkinFormOf({}, tk), ...o });

describe('Goodnight', () => {
  it('on time logs the day, puts the phone away, and is the wind-down: every win of the evening in one tap', () => {
    const d = goodnight({}, st, tk, form({ md: 7, u: 2, s: 3 }), '22:10', 5);
    const day = d[tk];
    expect(day.checkin?.done).toBe(true);
    expect(day.checkin?.md).toBe(7);
    expect(day.checkin?.so).toBe('Y');
    expect(day.p?.po).toBe('22:10');
    expect(day.p?.wd).toBe(true);
    expect(dayPoints(d, tk, st).parts.map((x) => x.k)).toEqual(['checkin', 'lights', 'wind', 'phone']);
  });
  it('late still puts the phone away and counts, without the wind-down or screens off on time', () => {
    const d = goodnight({}, st, tk, null, '23:40', 5);
    expect(d[tk].p?.po).toBe('23:40');
    expect(d[tk].p?.wd).toBe(false);
    expect(d[tk].checkin).toBeNull();
    expect(dayPoints(d, tk, st).parts.map((x) => x.k)).toEqual(['phone']);
  });
  it('with nothing answered saves no check-in', () => {
    expect(goodnight({}, st, tk, form(), '22:00', 5)[tk].checkin?.done).toBe(false);
  });
});

describe('the Bedtime stop', () => {
  const tiles = (d: Days, h: number, m = 0) => stopTiles(d, st, tk, at(18, h, m)).tiles;
  it('is one stop for the evening, where the check-in and the wind-down were two', () => {
    const t = tiles({}, 19);
    expect(t.map((x) => x.k)).toEqual(['lesson', 'night']);
    const b = t[1];
    expect(b.title).toBe('Bedtime');
    expect(b.go).toBe('bed');
    expect(b.sky).toBe('night');
  });
  it('waits in the evening, from an hour before screens-off, and is open then', () => {
    const d = {};
    const early = tiles(d, 19).find((x) => x.k === 'night')!;
    expect(early.state).toBe('next');
    expect(early.right).toBe('From 9:30 PM');
    const now = tiles(d, 21, 45).find((x) => x.k === 'night')!;
    expect(now.state === 'now' || now.state === 'due').toBe(true);
    expect(now.head).toBe('Time for bed');
  });
  it('a day logged early still waits for Goodnight', () => {
    const d = saveCheckin({}, tk, form({ md: 6, s: 2 }), 1);
    const b = tiles(d, 20).find((x) => x.k === 'night')!;
    expect(b.done).toBe(false);
    expect(b.line).toBe('Day logged · Goodnight when the phone goes down');
  });
  it('is done once the phone went away, and says when, with the day’s numbers', () => {
    const d = goodnight({}, st, tk, form({ md: 7, s: 3 }), '22:10', 5);
    const b = tiles(d, 22, 12).find((x) => x.k === 'night')!;
    expect(b.done).toBe(true);
    expect(b.line).toBe('Phone away at 10:10 PM · Mood 7 · Stress 3');
  });
  it('is done by SOS Go to bed too (the phone away with nothing logged)', () => {
    const d = goodnight({}, st, tk, null, '23:00', 5);
    expect(tiles(d, 23, 5).find((x) => x.k === 'night')!.line).toBe('Phone away at 11:00 PM');
  });
  it('with the wind-down switched off, is the check-in alone, done when the day is logged', () => {
    const off = normSettings({ ...st, routine: { ...st.routine, wind: false } });
    const d = saveCheckin({}, tk, form({ md: 6 }), 1);
    const b = stopTiles(d, off, tk, at(18, 20)).tiles.find((x) => x.k === 'night')!;
    expect(b.done).toBe(true);
  });
  it('is named once in the rest of the day', () => {
    expect(thenLine({}, st, tk, at(18, 9), false)).toBe('Then: a lesson and bedtime.');
  });
});

describe('sleep, worked out', () => {
  const night = (po: string) => goodnight({}, st, prev, null, po, 1);
  it('reads the phone-down time on the log day’s clock', () => {
    expect(awayMs(prev, '23:10')).toBe(at(17, 23, 10));
    expect(awayMs(prev, '00:40')).toBe(at(18, 0, 40));
  });
  it('is from last night’s Goodnight to the first open of today, in half hours', () => {
    expect(sleepGuess(night('23:10'), st, tk, at(18, 6, 50))).toBe(7.5);
    expect(sleepGuess(night('00:40'), st, tk, at(18, 8, 0))).toBe(7.5);
  });
  it('is nothing without a Goodnight, or when the hours make no sense for a night', () => {
    expect(sleepGuess({}, st, tk, at(18, 7))).toBeNull();
    expect(sleepGuess(night('23:10'), st, tk, at(18, 1, 30))).toBeNull();
    expect(sleepGuess(night('23:10'), st, tk, at(18, 15, 0))).toBeNull();
  });
  it('is kept as today’s hours, marked as a guess, and never over hours already there', () => {
    const d = guessSleep(night('23:10'), st, tk, at(18, 6, 50));
    expect(d[tk].checkin?.h).toBe(7.5);
    expect(d[tk].checkin?.hg).toBe(true);
    expect(d[tk].checkin?.done).toBe(false);
    const fixed = setSleep(d, tk, 6, 2);
    expect(fixed[tk].checkin?.h).toBe(6);
    expect(fixed[tk].checkin?.hg).toBeUndefined();
    expect(guessSleep(fixed, st, tk, at(18, 9))[tk].checkin?.h).toBe(6);
  });
  it('the guess survives the check-in that night and a sync round trip, and goes once the person changes it', () => {
    const d = guessSleep(night('23:10'), st, tk, at(18, 6, 50));
    const saved = saveCheckin(d, tk, { ...checkinFormOf(d, tk), md: 6 }, 3);
    expect(saved[tk].checkin?.hg).toBe(true);
    expect(normDay(JSON.parse(JSON.stringify(saved[tk])), tk).checkin?.hg).toBe(true);
    const changed = saveCheckin(d, tk, { ...checkinFormOf(d, tk), h: 8 }, 3);
    expect(changed[tk].checkin?.hg).toBeUndefined();
  });
});

describe('the morning line', () => {
  it('says when the phone went down and the sleep worked out, in the morning only', () => {
    const d = guessSleep(goodnight({}, st, prev, null, '23:10', 1), st, tk, at(18, 6, 50));
    const l = lastNight(d, st, tk, at(18, 7, 30))!;
    expect(l.line).toBe('Phone down at 11:10 PM.');
    expect(l.sleep).toBe('About 7.5 hours of sleep.');
    expect(l.run).toBe('');
    expect(lastNight(d, st, tk, at(18, 12, 30))).toBeNull();
  });
  it('counts the nights the phone went down this week, without a number that drops to zero', () => {
    let d: Days = {};
    for (const k of ['2026-10-12', '2026-10-14', '2026-10-15', '2026-10-17']) d = goodnight(d, st, k, null, '22:20', 1);
    expect(lastNight(d, st, tk, at(18, 8))!.run).toBe('Phone down 4 of the last 7 nights.');
    expect(lastNight(d, st, tk, at(18, 8))!.sleep).toBe('');
  });
  it('says the person’s own hours plainly', () => {
    const d = setSleep(goodnight({}, st, prev, null, '23:10', 1), tk, 8, 2);
    expect(lastNight(d, st, tk, at(18, 9))!.sleep).toBe('8 hours of sleep.');
  });
  it('is nothing after a night without Goodnight', () => {
    expect(lastNight({}, st, tk, at(18, 8))).toBeNull();
  });
});

describe('the mood row starts from today’s feeling', () => {
  it('maps the five steps onto 0 to 10, and is empty when it was not answered', () => {
    expect(moodStart({}, tk)).toBeNull();
    const d = withDay({}, tk, dayFeelSet(undefined, tk, 4, 1));
    expect(moodStart(d, tk)).toBe(7);
  });
});
