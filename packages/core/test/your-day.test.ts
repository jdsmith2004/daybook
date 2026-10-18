/* Your day as tiles, and the morning moment: the morning asks what the app does not know (did the phone stay away, when it
   was put away; otherwise, did screens go off), says last night back in a few words, and each stop has its color, its line,
   and where it opens. */
import { describe, expect, it } from 'vitest';
import { normSettings } from '../src/legacy/core.js';
import { checkinFormOf, morningAsk, morningDone, morningSaid, phoneAway, saveCheckin, setScreensOff, setSleep, stopTiles } from '../src/day';
import { lessonStop, recordLesson } from '../src/lessons';
import type { Days } from '../src/types';

const st = normSettings({ start: '2026-10-01', day1: '2026-10-08', screensOff: '22:30' });
const tk = '2026-10-18';
const at = (h: number, m = 0) => new Date(2026, 9, 18, h, m).getTime();

describe('the morning question', () => {
  it('asks whether the phone stayed away, when it was put away', () => {
    const d = phoneAway({}, '2026-10-17', '22:37', 1);
    const a = morningAsk(d, st, tk);
    expect(a.kind).toBe('away');
    expect(a.eyebrow).toBe('Last night · Saturday');
    expect(a.q).toBe('Did your phone stay away?');
    expect(a.sub).toBe('You put it away at 10:37 PM.');
    expect([a.yes.t, a.no.t]).toEqual(['Yes, it stayed away', 'I picked it back up']);
  });
  it('asks about screens, when it was not', () => {
    const a = morningAsk({}, st, tk);
    expect(a.kind).toBe('screens');
    expect(a.q).toBe('Did screens go off around 10:30 PM?');
    expect([a.yes.t, a.no.t]).toEqual(['Yes', 'Not this time']);
  });
  it('says last night back as it was answered', () => {
    let d: Days = phoneAway({}, '2026-10-17', '22:37', 1);
    d = setScreensOff(d, '2026-10-17', 'Y', 2);
    d = setSleep(d, tk, 9, 3);
    expect(morningSaid(d, st, tk)).toEqual(['Phone stayed away', 'Slept 9 h']);
    expect(morningSaid(setScreensOff(d, '2026-10-17', 'N', 4), st, tk)[0]).toBe('Picked the phone back up');
    expect(morningSaid(setSleep(setScreensOff({}, '2026-10-17', 'N', 1), tk, 6.5, 2), st, tk)).toEqual(['Screens on late', 'Slept 6.5 h']);
  });
});

describe('the stops as tiles', () => {
  it('in the morning, the morning is open, and leads into the lesson', () => {
    const r = stopTiles({}, st, tk, at(8, 26));
    expect(r.cur).toBe('morning');
    expect(r.tiles.map((t) => [t.k, t.sky, t.go])).toEqual([
      ['morning', 'sun', 'morning'],
      ['lesson', 'sky', 'lesson'],
      ['evening', 'violet', 'checkin'],
      ['night', 'night', 'wind'],
    ]);
    const m = r.tiles[0];
    expect(m.cur).toBe(true);
    expect(m.eyebrow).toBe('Morning · open now');
    expect(m.head).toBe('Good morning');
    expect(m.body).toBe('Two quick questions about last night, then today’s lesson.');
    expect(m.chips).toEqual(['2 quick taps', '+5 points']);
    expect(r.tiles[1].right).toBe('From 9:00 AM');
    expect(r.tiles[2].line).toBe('Four numbers about today');
    expect(r.tiles[3].line).toBe('Screens off at 10:30 PM');
  });
  it('in the evening, done stops say what was done, and the check-in is open', () => {
    let d: Days = phoneAway({}, '2026-10-17', '22:37', 1);
    d = setScreensOff(d, '2026-10-17', 'Y', 2);
    d = setSleep(d, tk, 9, 3);
    d = morningDone(d, tk, 4);
    const L = lessonStop(d, st, tk).L;
    d = recordLesson(d, tk, L, 5).days;
    const r = stopTiles(d, st, tk, at(19, 10));
    expect(r.cur).toBe('evening');
    expect(r.done).toBe(2);
    expect(r.tiles[0].line).toBe('Phone stayed away · Slept 9 h');
    expect(r.tiles[1].line).toBe('Read: ' + L.title);
    expect(r.tiles[1].id).toBe(L.id);
    expect(r.tiles[2].eyebrow).toBe('Evening · open now');
    expect(r.tiles[2].btn).toBe('Check in');
    expect(r.tiles[3].eyebrow).toBe('Up next · from 9:30 PM');
    /* the morning no longer promises the lesson once it is read */
    expect(r.tiles[0].body).toBe('Two quick questions about last night.');
  });
  it('a saved check-in and a phone put away say so', () => {
    let d = saveCheckin({}, tk, { ...checkinFormOf({}, tk), m: 7, s: 3 }, 1);
    d = phoneAway(d, tk, '22:41', 2);
    const r = stopTiles(d, st, tk, at(22, 45));
    expect(r.tiles.find((t) => t.k === 'evening')!.line).toBe('Motivation 7 · Stress 3');
    expect(r.tiles.find((t) => t.k === 'night')!.line).toBe('Phone away at 10:41 PM');
  });
  it('a lesson still to come keeps the capitals of its time', () => {
    const d = morningDone(setSleep({}, tk, 8, 1), tk, 2);
    const r = stopTiles(d, st, tk, at(8, 40));
    expect(r.cur).toBe('lesson');
    expect(r.tiles[1].eyebrow).toMatch(/^Lesson \d+ of \d+ · from 9:00 AM$/);
  });
});
