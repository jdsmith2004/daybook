/* What Today shows of a talk-through (talk-log.ts): a plan made after a slip, for next time, is asked about only after its
   moment has come round again, and a changed plan (or a decide-later) waits quietly on Today until its moment has passed. */
import { describe, expect, it } from 'vitest';
import { normSettings } from '../src/legacy/core.js';
import { addEvent } from '../src/mutate';
import { newTalk, type Talk, type TalkMove } from '../src/talk';
import { saveTalk, talkDueNow, talkForNext, talkMomentAt, talkNextMoment, talkPlanAhead, talkPlanNow } from '../src/talk-log';
import type { Days } from '../src/types';

const at = (s: string) => new Date(s).getTime();
const st = normSettings({ start: '2026-10-01', day1: '2026-10-08' });

describe('a plan for next time, made after a slip late at night', () => {
  /* the slip at 11:10 PM on October 27, the plan a few minutes later (Rekindle, log.tsx) */
  const K = '2026-10-27';
  const T = at('2026-10-27T23:20:00');
  const plan: Talk = { ...newTalk(T), id: 'nx', p: 'change', pr: 1, n: 'close', m: ['text'] as TalkMove[], mo: 'late', at: null, fw: 'Ashamed' };
  const days: Days = saveTalk(addEvent({}, K, 'slipped', '23:10', {}, 1).days, K, plan, T);

  it('is a plan for next time, whose moment is the next late night (from 9 PM)', () => {
    expect(talkForNext(plan)).toBe(true);
    expect(talkMomentAt(plan)).toBe(at('2026-10-28T21:00:00'));
    expect(talkForNext({ ...plan, fw: undefined })).toBe(false);
    /* the plans made since October 27, 2026 carry the situation (ft), not the feeling */
    expect(talkForNext({ ...plan, fw: undefined, ft: 'late' })).toBe(true);
  });
  it('is not asked about the next morning, before the next night has come', () => {
    expect(talkDueNow(days, st, '2026-10-28', at('2026-10-28T08:30:00'))!.due).toBe('plan');
    expect(talkDueNow(days, st, '2026-10-28', at('2026-10-28T22:00:00'))!.due).toBe('plan');
  });
  it('is asked about the morning after the next night, with the plan as it was saved', () => {
    const d = talkDueNow(days, st, '2026-10-29', at('2026-10-29T08:00:00'))!;
    expect(d.due).toBe('look');
    expect(d.talk.at).toBeNull();
    expect(d.talk.fw).toBe('Ashamed');
  });
  it('a slip logged the next night settles it: the slip was looked at when it was logged', () => {
    const again = addEvent(days, '2026-10-28', 'slipped', '23:30', {}, 2).days;
    expect(talkDueNow(again, st, '2026-10-29', at('2026-10-29T08:00:00'))).toBeNull();
  });
  it('shows on Today from an hour before its moment until the moment ends, and not in between', () => {
    expect(talkPlanNow(days, st, '2026-10-28', at('2026-10-28T09:00:00'))).toBeNull();
    expect(talkPlanNow(days, st, '2026-10-28', at('2026-10-28T19:59:00'))).toBeNull();
    const w = talkPlanNow(days, st, '2026-10-28', at('2026-10-28T20:00:00'))!;
    expect(w.head).toBe('Your plan for tonight');
    expect(w.line).toBe('When I feel ashamed late at night, I will text someone.');
    expect(talkPlanNow(days, st, '2026-10-28', at('2026-10-29T01:30:00'))).not.toBeNull();
    expect(talkPlanNow(days, st, '2026-10-28', at('2026-10-29T04:59:00'))).not.toBeNull();
    expect(talkPlanNow(days, st, '2026-10-28', at('2026-10-29T05:00:00'))).toBeNull();
  });
});

describe('a plan for next time from what was going on (since October 27, 2026)', () => {
  const K = '2026-10-27';
  const late: Talk = {
    ...newTalk(at('2026-10-27T23:58:00')),
    id: 'lt',
    p: 'change',
    pr: 1,
    n: 'rest',
    m: ['away'] as TalkMove[],
    mo: 'late',
    at: null,
    ft: 'late',
  };
  it('a slip at 11:50 PM does not settle the plan made for it a few minutes after midnight', () => {
    const T = at('2026-10-28T00:05:00');
    const days = saveTalk(addEvent({}, K, 'slipped', '23:50', {}, 1).days, K, { ...late, t: T }, T);
    expect(talkPlanAhead(days, T + 60000)!.start).toBe(at('2026-10-28T21:00:00'));
    const w = talkPlanNow(days, st, '2026-10-28', at('2026-10-28T20:30:00'))!;
    expect(w.head).toBe('Your plan for tonight');
    expect(w.line).toBe('When it is late and I am in bed with my phone, I will put the device out of reach.');
    /* a slip later that night (after 12:05 AM, on the same log day) does settle it */
    const again = addEvent(days, K, 'slipped', '01:30', {}, 2).days;
    expect(talkPlanAhead(again, T + 60000)).toBeNull();
  });
  it('the evening: from 5 PM to 9 PM, the next evening when it was made in one', () => {
    const T = at('2026-10-27T18:40:00');
    const eve: Talk = { ...late, t: T, id: 'ev', mo: 'evening', ft: 'bored', m: ['hands'] as TalkMove[] };
    const days = saveTalk(addEvent({}, K, 'slipped', '18:30', {}, 1).days, K, eve, T);
    expect(talkNextMoment(eve)).toEqual({ start: at('2026-10-28T17:00:00'), end: at('2026-10-28T21:00:00'), mo: 'evening' });
    expect(talkPlanNow(days, st, K, at('2026-10-27T19:00:00'))).toBeNull();
    expect(talkPlanNow(days, st, '2026-10-28', at('2026-10-28T16:00:00'))!.head).toBe('Your plan for this evening');
    expect(talkPlanNow(days, st, '2026-10-28', at('2026-10-28T21:00:00'))).toBeNull();
    /* then "Did your plan hold?" the next morning */
    expect(talkDueNow(days, st, '2026-10-29', at('2026-10-29T07:00:00'))!.due).toBe('look');
  });
  it('a slip in the daytime: the same hour the next day, for two hours', () => {
    const T = at('2026-10-27T14:10:00');
    const day: Talk = { ...late, t: T, id: 'dy', mo: null, ft: 'stress', m: ['walk'] as TalkMove[] };
    expect(talkNextMoment(day)).toEqual({ start: T + 24 * 3600000, end: T + 26 * 3600000, mo: null });
    const days = saveTalk(addEvent({}, K, 'slipped', '14:00', {}, 1).days, K, day, T);
    expect(talkPlanNow(days, st, '2026-10-28', at('2026-10-28T13:10:00'))!.head).toBe('Your plan for next time');
    expect(talkPlanNow(days, st, '2026-10-28', at('2026-10-28T16:10:00'))).toBeNull();
  });
  it('only the latest talk-through, and not once it is looked back on', () => {
    const T = at('2026-10-27T23:20:00');
    const days = saveTalk(addEvent({}, K, 'slipped', '23:10', {}, 1).days, K, { ...late, t: T }, T);
    expect(talkPlanAhead(days, T)).not.toBeNull();
    expect(talkPlanAhead(days, at('2026-10-28T21:00:00'))).toBeNull();
    const looked = saveTalk(days, K, { ...late, t: T, a: { went: false, t: T + 1000, f: [], g: null, c: [] } }, T);
    expect(talkPlanAhead(looked, T)).toBeNull();
    const later = saveTalk(days, '2026-10-28', { ...newTalk(T + 3600000), id: 'x', p: 'change', m: ['walk'] as TalkMove[], mo: 'now', at: null }, T + 3600000);
    expect(talkPlanAhead(later, T + 3600000)).toBeNull();
  });
});

describe('a changed plan, from Planning a slip', () => {
  const K = '2026-10-27';
  const T = at('2026-10-27T20:00:00');
  const tonight = at('2026-10-27T23:00:00');
  const plan: Talk = { ...newTalk(T), id: 'ch', s: ['plan'], n: 'relief', w: 6, p: 'change', m: ['walk'] as TalkMove[], mo: 'late', at: tonight };
  const days: Days = saveTalk({}, K, plan, T);
  it('waits on Today under SOS until two hours after its moment', () => {
    const w = talkPlanNow(days, st, K, at('2026-10-27T20:05:00'))!;
    expect(w.due).toBe('plan');
    expect(w.head).toBe('Your plan');
    expect(w.line).toMatch(/^Late tonight, when I want /);
    expect(talkPlanNow(days, st, K, at('2026-10-28T00:59:00'))).not.toBeNull();
    expect(talkPlanNow(days, st, K, at('2026-10-28T01:00:00'))).toBeNull();
  });
  it('then the look back opens the next morning, as before', () => {
    expect(talkDueNow(days, st, '2026-10-28', at('2026-10-28T06:00:00'))!.due).toBe('look');
  });
  it('a decide-later waits on Today too, with its time', () => {
    const wait: Talk = { ...newTalk(T), id: 'wt', s: ['plan'], n: 'relief', w: 6, p: 'wait', m: ['treat'] as TalkMove[], mo: '60', at: T + 3600000 };
    const w = talkPlanNow(saveTalk({}, K, wait, T), st, K, T + 60000)!;
    expect(w.due).toBe('waiting');
    expect(w.head).toBe('You decide at 9:00 PM.');
    expect(w.line).toMatch(/^Until then: /);
    expect(talkPlanNow(saveTalk({}, K, wait, T), st, K, T + 2 * 3600000)).toBeNull();
  });
});
