/* What Today shows of a talk-through (talk-log.ts): a plan made after a slip, for next time, is asked about only after its
   moment has come round again, and a changed plan (or a decide-later) waits quietly on Today until its moment has passed. */
import { describe, expect, it } from 'vitest';
import { normSettings } from '../src/legacy/core.js';
import { addEvent } from '../src/mutate';
import { newTalk, type Talk, type TalkMove } from '../src/talk';
import { saveTalk, talkDueNow, talkForNext, talkMomentAt, talkPlanNow } from '../src/talk-log';
import type { Days } from '../src/types';

const at = (s: string) => new Date(s).getTime();
const st = normSettings({ start: '2026-10-01', day1: '2026-10-08' });

describe('a plan for next time, made after a slip late at night', () => {
  /* the slip at 11:10 PM on October 27, the plan a few minutes later (Rekindle, log.tsx) */
  const K = '2026-10-27';
  const T = at('2026-10-27T23:20:00');
  const plan: Talk = { ...newTalk(T), id: 'nx', p: 'change', pr: 1, n: 'close', m: ['text'] as TalkMove[], mo: 'late', at: null, fw: 'Ashamed' };
  const days: Days = saveTalk(addEvent({}, K, 'slipped', '23:10', {}, 1).days, K, plan, T);

  it('is a plan for next time, whose moment is the same hour the next day', () => {
    expect(talkForNext(plan)).toBe(true);
    expect(talkMomentAt(plan)).toBe(T + 24 * 3600000);
    expect(talkForNext({ ...plan, fw: undefined })).toBe(false);
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
  it('waits quietly on Today, the next day, until its moment has passed', () => {
    const w = talkPlanNow(days, st, '2026-10-28', at('2026-10-28T09:00:00'))!;
    expect(w.head).toBe('Your plan for next time');
    expect(w.line).toBe('When I feel ashamed late at night, I will text someone.');
    expect(talkPlanNow(days, st, '2026-10-28', at('2026-10-29T01:00:00'))).not.toBeNull();
    expect(talkPlanNow(days, st, '2026-10-28', at('2026-10-29T01:30:00'))).toBeNull();
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
