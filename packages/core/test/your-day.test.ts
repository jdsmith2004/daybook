/* Your day as tiles (each stop has its color, its line, and where it opens), Good night as the phone going away, and sleep
   in the evening check-in. The morning stop that asked about last night was retired on October 23, 2026. */
import { describe, expect, it } from 'vitest';
import { blankP, LESSONS, normSettings } from '../src/legacy/core.js';
import { checkinFormOf, offOnTime, openTile, phoneAway, saveCheckin, stopTiles } from '../src/day';
import { lessonStop, recordLesson } from '../src/lessons';
import { moments } from '../src/moment';
import { changeDay, withDay } from '../src/mutate';
import type { Days } from '../src/types';

const st = normSettings({ start: '2026-10-01', day1: '2026-10-08', screensOff: '22:30' });
const tk = '2026-10-18';
const at = (h: number, m = 0) => new Date(2026, 9, 18, h, m).getTime();

describe('Good night', () => {
  it('is the phone going away, and screens off on time when it comes before the screens-off time', () => {
    const d = phoneAway({}, '2026-10-17', '22:20', 1, st);
    expect(d['2026-10-17'].p?.po).toBe('22:20');
    expect(d['2026-10-17'].checkin?.so).toBe('Y');
    expect(d['2026-10-17'].checkin?.done).toBe(false);
    /* right at the screens-off time still counts */
    expect(phoneAway({}, '2026-10-17', '22:30', 1, st)['2026-10-17'].checkin?.so).toBe('Y');
  });
  it('after the screens-off time is still the phone away, and never says late', () => {
    const d = phoneAway({}, '2026-10-17', '23:10', 1, st);
    expect(d['2026-10-17'].p?.po).toBe('23:10');
    expect(d['2026-10-17'].checkin).toBeNull();
    /* a later Good night on a night already on time does not take it back */
    const d2 = phoneAway(phoneAway({}, '2026-10-17', '22:00', 1, st), '2026-10-17', '23:40', 2, st);
    expect(d2['2026-10-17'].checkin?.so).toBe('Y');
    expect(d2['2026-10-17'].p?.po).toBe('23:40');
  });
  it('reads the night on the log day’s clock: after midnight is late for 10:30 PM, and on time for 12:30 AM', () => {
    expect(offOnTime(st, '01:15')).toBe(false);
    expect(offOnTime({ ...st, screensOff: '00:30' }, '23:50')).toBe(true);
    expect(offOnTime({ ...st, screensOff: '00:30' }, '00:45')).toBe(false);
  });
  it('an afternoon nap is not a night: only the hours before the screens-off time count', () => {
    expect(offOnTime(st, '16:30')).toBe(true);
    expect(offOnTime(st, '16:29')).toBe(false);
    expect(offOnTime(st, '13:00')).toBe(false);
  });
  it('without the settings, it is only the phone away', () => {
    expect(phoneAway({}, '2026-10-17', '22:20', 1)['2026-10-17'].checkin).toBeNull();
  });
});

describe('sleep, in the evening check-in', () => {
  it('is saved where the morning kept it, in half hours', () => {
    const d = saveCheckin({}, tk, { ...checkinFormOf({}, tk), m: 6, h: 7.26 }, 1);
    expect(d[tk].checkin?.h).toBe(7.5);
    expect(checkinFormOf(d, tk).h).toBe(7.5);
  });
  it('a form with no sleep in it keeps the hours already saved', () => {
    let d = saveCheckin({}, tk, { ...checkinFormOf({}, tk), h: 8 }, 1);
    d = saveCheckin(d, tk, { m: 5, c: null, e: null, s: null, ro: null, n: '' }, 2);
    expect(d[tk].checkin?.h).toBe(8);
    expect(d[tk].checkin?.m).toBe(5);
  });
  it('keeps screens off on time from Good night', () => {
    let d = phoneAway({}, tk, '22:10', 1, st);
    d = saveCheckin(d, tk, { ...checkinFormOf(d, tk), m: 7, h: 6.5 }, 2);
    expect(d[tk].checkin).toMatchObject({ so: 'Y', h: 6.5, m: 7, done: true });
  });
});

describe('the stops as tiles', () => {
  it('in the morning, there is no morning stop: the lesson comes first', () => {
    const r = stopTiles({}, st, tk, at(8, 26));
    expect(r.cur).toBe('lesson');
    expect(r.tiles.map((t) => [t.k, t.sky, t.go])).toEqual([
      ['lesson', 'sky', 'lesson'],
      ['evening', 'violet', 'checkin'],
      ['night', 'night', 'wind'],
    ]);
    expect(r.tiles[0].cur).toBe(true);
    expect(r.tiles[0].right).toBe('From 9:00 AM');
    expect(r.tiles[1].line).toBe('Three quick numbers, then good night');
    expect(r.tiles[2].line).toBe('Screens off at 10:30 PM');
  });
  it('in the evening, done stops say what was done, and the check-in is open', () => {
    let d: Days = {};
    const L = lessonStop(d, st, tk).L;
    d = recordLesson(d, tk, L, 5).days;
    const r = stopTiles(d, st, tk, at(19, 10));
    expect(r.cur).toBe('evening');
    expect(r.done).toBe(1);
    expect(r.tiles[0].line).toBe('Read: ' + L.title);
    expect(r.tiles[0].id).toBe(L.id);
    expect(r.tiles[1].eyebrow).toBe('Evening · open now');
    expect(r.tiles[1].btn).toBe('Check in');
    expect(r.tiles[2].eyebrow).toBe('Up next · from 9:30 PM');
  });
  it('a saved check-in and a phone put away say so', () => {
    let d = saveCheckin({}, tk, { ...checkinFormOf({}, tk), m: 7, s: 3 }, 1);
    d = phoneAway(d, tk, '22:41', 2);
    const r = stopTiles(d, st, tk, at(22, 45));
    expect(r.tiles.find((t) => t.k === 'evening')!.line).toBe('Motivation 7 · Stress 3');
    expect(r.tiles.find((t) => t.k === 'night')!.line).toBe('Phone away at 10:41 PM');
  });
  it('a lesson still to come keeps the capitals of its time', () => {
    const r = stopTiles({}, st, tk, at(8, 40));
    expect(r.cur).toBe('lesson');
    expect(r.tiles[0].eyebrow).toMatch(/^Lesson \d+ of \d+ · from 9:00 AM$/);
  });
  it('a routine saved with the morning stop still on reads fine, and has no morning stop', () => {
    const old = normSettings({ start: '2026-10-01', routine: { morning: true, lesson: true, calm: true, reach: false, checkin: true, wind: true } });
    expect(old.routine.morning).toBe(true);
    expect(stopTiles({}, old, tk, at(8, 0)).tiles.map((t) => t.k)).toEqual(['lesson', 'evening', 'night']);
  });
});

describe('the stop that is next, grown in place in Your day', () => {
  /* the calm-day card at the top of Today (moment.ts), which the grown stop must match */
  const calm = (days: Days, account = true) => moments(days, st, {}, tk, at(9), { account }).find((m) => m.k === 'calm');
  it('is the open stop, and opens the same thing as the card at the top of Today', () => {
    const t = openTile({}, st, tk, at(9))!;
    expect(t).toMatchObject({ k: 'lesson', cur: true, done: false, btn: 'Start', go: 'lesson', id: LESSONS[0].id });
    expect(calm({})).toMatchObject({ h: t.head, btn: t.btn, go: t.go, v: t.id, eb: t.eyebrow });
  });
  it('without an account, a lesson that waits behind one becomes a re-read, in both places', () => {
    const first3 = LESSONS.slice(0, 3).map((L) => L.id);
    const done = withDay(
      {},
      '2026-10-17',
      changeDay(undefined, '2026-10-17', (x) => void (x.p = { ...blankP(), ls: first3 }), 1),
    );
    const t = openTile(done, st, tk, at(9), false)!;
    expect(t).toMatchObject({ btn: 'Read it again', body: 'A quick re-read keeps one fresh.' });
    expect(first3).toContain(t.id);
    expect(calm(done, false)).toMatchObject({ v: t.id, btn: 'Read it again' });
    expect(openTile(done, st, tk, at(9), true)).toMatchObject({ id: LESSONS[3].id, btn: 'Start' });
  });
  it('the check-in once the lesson is done, and nothing when no part of the day is on', () => {
    const d = recordLesson({}, tk, LESSONS[0], at(9)).days;
    expect(openTile(d, st, tk, at(19))).toMatchObject({ k: 'evening', btn: 'Check in', sky: 'violet' });
    const off = normSettings({ ...st, routine: { morning: false, lesson: false, calm: false, reach: false, checkin: false, wind: false } });
    expect(openTile({}, off, tk, at(19))).toBeNull();
  });
});
