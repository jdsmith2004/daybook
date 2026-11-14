/* The morning answers last night's plans (talk-log.ts settleByMorning; the owner, November 14, 2026): Free of it settles a plan
   whose moment was last night as held, so Today never asks "Did your plan hold?" about a night already told. */
import { describe, expect, it } from 'vitest';
import { normSettings } from '../src/legacy/core.js';
import { answerNight, skipMorning } from '../src/morning-set';
import { addEvent } from '../src/mutate';
import { newTalk, talkById, talkEvidence, talkHeld, type Talk, type TalkMove } from '../src/talk';
import { heldByMorning, saveTalk, talkDueNow } from '../src/talk-log';
import { morningReply } from '../src/two-moments';
import type { Days } from '../src/types';

const at = (s: string) => new Date(s).getTime();
const st = normSettings({ start: '2026-10-01', day1: '2026-10-08' });
const K = '2026-11-10';
const TK = '2026-11-11';
const MORNING = at('2026-11-11T07:30:00');

const change = (id: string, t: number, extra: Partial<Talk> = {}): Talk => ({
  ...newTalk(t),
  id,
  p: 'change',
  n: 'close',
  m: ['walk'] as TalkMove[],
  mo: 'now',
  at: null,
  ...extra,
});
const one = (talk: Talk, k = K): Days => saveTalk({}, k, talk, talk.t);
/* the morning closed without an answer */
const skipped = (days: Days) => skipMorning(days, TK, at('2026-11-11T07:00:00'));

describe('a plan made last night, and the next morning', () => {
  const plan = change('c1', at('2026-11-10T22:10:00'));
  const days = one(plan);

  it('while the morning is still to answer, Today does not ask: the morning asks, once', () => {
    expect(talkDueNow(days, st, TK, MORNING)).toBeNull();
    expect(talkDueNow(days, st, TK, at('2026-11-11T15:00:00'))).toBeNull();
  });
  it('asks "Did your plan hold?" when the morning was closed without an answer', () => {
    expect(talkDueNow(skipped(days), st, TK, MORNING)!.due).toBe('look');
  });
  it('asks as before when there is no morning (no settings yet)', () => {
    expect(talkDueNow(days, null, TK, MORNING)!.due).toBe('look');
  });
  it('Free of it settles it as held, and Today does not ask', () => {
    const after = answerNight(days, st, TK, 'free', MORNING);
    const a = talkById(after, 'c1')!.talk.a!;
    expect(a).toMatchObject({ went: false, mn: 1, t: MORNING });
    expect(talkDueNow(after, st, TK, MORNING + 60000)).toBeNull();
    expect(talkDueNow(after, st, TK, at('2026-11-11T15:00:00'))).toBeNull();
  });
  it('the held plan counts where the look back counts: the moves that held, and the times something else was chosen', () => {
    const after = answerNight(days, st, TK, 'free', MORNING);
    expect(talkHeld(after).walk).toEqual({ held: 1, n: 1 });
    expect(talkEvidence(after).chose).toBe(1);
  });
  it('adds no calm move, so changing the answer takes nothing away', () => {
    const after = answerNight(days, st, TK, 'free', MORNING);
    expect(after[K]!.p!.c).toBe(days[K]!.p!.c);
  });
  it('the morning says so in a quiet line, not a question', () => {
    const after = answerNight(days, st, TK, 'free', MORNING);
    expect(heldByMorning(after, TK, MORNING + 60000)).toBe(1);
    expect(morningReply('free', false, true)).toBe('A free night, and your plan held. That one is yours for good.');
    expect(morningReply('free', false)).toBe('A free night. That one is yours for good.');
  });
  it('It happened: the slip it logs settles the plan, and nothing asks', () => {
    const after = answerNight(days, st, TK, 'slip', MORNING);
    expect(talkById(after, 'c1')!.talk.a).toBeNull();
    expect(talkDueNow(after, st, TK, MORNING + 60000)).toBeNull();
    expect(heldByMorning(after, TK, MORNING + 60000)).toBe(0);
  });
  it('Free of it changed to It happened opens the plan again, and the slip settles it', () => {
    const free = answerNight(days, st, TK, 'free', MORNING);
    const slip = answerNight(free, st, TK, 'slip', MORNING + 30000);
    expect(talkById(slip, 'c1')!.talk.a).toBeNull();
    expect(talkDueNow(slip, st, TK, MORNING + 60000)).toBeNull();
    /* and back to Free of it: held again */
    const back = answerNight(slip, st, TK, 'free', MORNING + 50000);
    expect(talkById(back, 'c1')!.talk.a!.mn).toBe(1);
  });
  it('a plan already looked back on is left as it is', () => {
    const looked = saveTalk(days, K, { ...plan, a: { went: true, t: plan.t + 3600000, f: [], g: 4, c: [] } }, plan.t + 3600000);
    const after = answerNight(looked, st, TK, 'free', MORNING);
    expect(talkById(after, 'c1')!.talk.a).toMatchObject({ went: true, g: 4 });
    expect(talkById(after, 'c1')!.talk.a!.mn).toBeUndefined();
  });
  it('a slip logged last night, after the plan, is not called held', () => {
    const slipped = addEvent(days, K, 'slipped', '23:40', {}, at('2026-11-10T23:45:00')).days;
    const after = answerNight(slipped, st, TK, 'free', MORNING);
    expect(talkById(after, 'c1')!.talk.a).toBeNull();
  });
  it('the mark survives a round trip through the record', () => {
    const after = answerNight(days, st, TK, 'free', MORNING);
    const again = saveTalk(after, K, talkById(after, 'c1')!.talk, MORNING + 1);
    expect(talkById(again, 'c1')!.talk.a!.mn).toBe(1);
  });
});

describe('plans whose moment is not last night', () => {
  it('a plan made in the morning for this evening is answered by the next morning', () => {
    const days = one(change('ev', at('2026-11-10T09:00:00'), { mo: 'evening', at: at('2026-11-10T20:00:00') }));
    const after = answerNight(days, st, TK, 'free', MORNING);
    expect(talkById(after, 'ev')!.talk.a!.mn).toBe(1);
    expect(talkDueNow(after, st, TK, MORNING + 60000)).toBeNull();
  });
  it('a plan for the afternoon is not covered by "last night", so its look back still opens', () => {
    const days = one(change('pm', at('2026-11-10T13:00:00'), { mo: 'soon', at: at('2026-11-10T14:00:00') }));
    const after = answerNight(days, st, TK, 'free', MORNING);
    expect(talkById(after, 'pm')!.talk.a).toBeNull();
    expect(talkDueNow(after, st, TK, MORNING + 60000)!.due).toBe('look');
  });
  it('After work (5:30 PM) is last night', () => {
    const days = one(change('aw', at('2026-11-10T08:00:00'), { mo: 'after', at: at('2026-11-10T17:30:00') }));
    expect(talkById(answerNight(days, st, TK, 'free', MORNING), 'aw')!.talk.a!.mn).toBe(1);
  });
  it('a talk-through this early morning (after 4 AM) is this morning, not last night', () => {
    const days = one(change('em', at('2026-11-11T05:10:00')), TK);
    expect(talkById(answerNight(days, st, TK, 'free', MORNING), 'em')!.talk.a).toBeNull();
  });
  it('a plan for tonight, made this morning before the answer, is not settled', () => {
    const days = one(change('tn', at('2026-11-11T07:00:00'), { mo: 'late', at: at('2026-11-11T23:00:00') }), TK);
    const after = answerNight(days, st, TK, 'free', MORNING);
    expect(talkById(after, 'tn')!.talk.a).toBeNull();
    expect(talkDueNow(after, st, TK, MORNING + 60000)!.due).toBe('plan');
  });
  it('a plan for the afternoon is asked about even while the morning is still to answer', () => {
    const days = one(change('pm2', at('2026-11-10T13:00:00'), { mo: 'soon', at: at('2026-11-10T14:00:00') }));
    expect(talkDueNow(days, st, TK, MORNING)!.due).toBe('look');
  });
  it('a plan for next time, made after a slip, is answered the morning after its moment comes round', () => {
    const k = '2026-11-09';
    const T = at('2026-11-09T23:20:00');
    const nx: Talk = { ...change('nx', T), pr: 1, mo: 'late', ft: 'late' };
    const days = saveTalk(addEvent({}, k, 'slipped', '23:10', {}, 1).days, k, nx, T);
    /* the morning after the slip: its moment (tonight, 9 PM) has not come, so Free of it does not touch it */
    const first = answerNight(days, st, '2026-11-10', 'free', at('2026-11-10T07:30:00'));
    expect(talkById(first, 'nx')!.talk.a).toBeNull();
    /* the morning after that night */
    const second = answerNight(first, st, TK, 'free', MORNING);
    expect(talkById(second, 'nx')!.talk.a!.mn).toBe(1);
    expect(talkDueNow(second, st, TK, MORNING + 60000)).toBeNull();
  });
});

describe('the other kinds of talk-through', () => {
  it('a decide-later from last night: Free of it says the wait did its work, and Today does not ask', () => {
    const w: Talk = { ...newTalk(at('2026-11-10T21:00:00')), id: 'w1', p: 'wait', m: ['treat'] as TalkMove[], mo: 'h1', at: at('2026-11-10T22:00:00') };
    const days = one(w);
    expect(talkDueNow(days, st, TK, MORNING)).toBeNull();
    expect(talkDueNow(skipped(days), st, TK, MORNING)!.due).toBe('passed');
    const after = answerNight(days, st, TK, 'free', MORNING);
    expect(talkById(after, 'w1')!.talk.a).toMatchObject({ went: false, mn: 1 });
    expect(talkDueNow(after, st, TK, MORNING + 60000)).toBeNull();
    /* a decide-later is not a plan: the morning's line does not say a plan held */
    expect(heldByMorning(after, TK, MORNING + 60000)).toBe(0);
  });
  it('a decide-later still waiting (until a time after the morning) is not touched', () => {
    const w: Talk = { ...newTalk(at('2026-11-10T23:00:00')), id: 'w2', p: 'wait', m: [], mo: 'morning', at: at('2026-11-11T09:00:00') };
    const after = answerNight(one(w), st, TK, 'free', MORNING);
    expect(talkById(after, 'w2')!.talk.a).toBeNull();
    expect(talkDueNow(after, st, TK, MORNING + 60000)!.due).toBe('waiting');
  });
  it('a go-ahead with eyes open last night: Free of it means something else was chosen', () => {
    const o: Talk = { ...newTalk(at('2026-11-10T22:30:00')), id: 'o1', p: 'open', e: 7 };
    const days = one(o);
    expect(talkDueNow(days, st, TK, MORNING)).toBeNull();
    expect(talkDueNow(skipped(days), st, TK, MORNING)!.due).toBe('look');
    const after = answerNight(days, st, TK, 'free', MORNING);
    expect(talkById(after, 'o1')!.talk.a).toMatchObject({ went: false, mn: 1 });
    expect(talkDueNow(after, st, TK, MORNING + 60000)).toBeNull();
  });
  it('a go-ahead with eyes open and It happened: still looked back on (what it gave), as before', () => {
    const o: Talk = { ...newTalk(at('2026-11-10T22:30:00')), id: 'o2', p: 'open', e: 7 };
    const after = answerNight(one(o), st, TK, 'slip', MORNING);
    expect(talkDueNow(after, st, TK, MORNING + 60000)!.due).toBe('look');
  });
});
