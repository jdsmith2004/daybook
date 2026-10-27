/* The comeback, noticed (roadmap move 3): the sunrise check (coming back) for every slip in every mode, three flames that light
   themselves from what the person does, a run saved by coming back (not by errands), and a comeback count that only
   goes up. Nothing earned before is taken away: the missions still save a run, and older slips keep their rule. */
import { describe, expect, it } from 'vitest';
import * as core from '../src/index';
import { addDays, normDay, normSettings } from '../src/legacy/core.js';
import { moments, pickMoment } from '../src/moment';
import type { DayEvent, Days } from '../src/types';

const st = normSettings({ start: '2026-10-25', day1: '2026-11-01' });
const K = '2026-11-08'; // Day 8: the slip at 10 PM ends a run of 7 days
const at = (k: string, h: number) => {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d, h).getTime();
};
/* a log with a check-in on every day from the start, so every day is known */
const base = (to: string): Days => {
  const d: Days = {};
  for (let k = st.start; k <= to; k = addDays(k, 1)) d[k] = normDay({ events: [], checkin: { m: 6, c: 6, e: 6, s: 4, h: 7, so: null, done: true } }, k);
  return d;
};
const withEv = (days: Days, k: string, ev: Partial<DayEvent>): Days => ({
  ...days,
  [k]: normDay({ ...days[k], events: [...(days[k]?.events || []), { id: 'e' + k + (ev.time || ''), time: '22:00', outcome: 'slipped', ...ev }] }, k),
});
/* the slip, and the sunrise check the next morning (no small thing, no phone away: no errands) */
const slipAndSunrise = (to: string, k = K): Days => withEv(base(to), k, { id: 's1', rk: { at: addDays(k, 1), pl: '' } });

describe('a run is saved by coming back', () => {
  it('the sunrise check and a day with no slip save it, with no errands', () => {
    const d = slipAndSunrise(addDays(K, 2));
    expect(core.runLedger(d, st, addDays(K, 1)).kind[K]).toBe('open');
    const L = core.runLedger(d, st, addDays(K, 2));
    expect(L.kind[K]).toBe('saved');
    expect(L.cur).toBe(7 + 1 + 2); // the run goes on through the slip day and the days after
  });
  it('or the next urge ridden out', () => {
    const d = withEv(slipAndSunrise(addDays(K, 1)), addDays(K, 1), { time: '15:00', outcome: 'rode' });
    expect(core.runLedger(d, st, addDays(K, 1)).kind[K]).toBe('saved');
    expect(core.rkThirdOf(d, K, st, addDays(K, 1))).toEqual({ k: addDays(K, 1), rode: true });
  });
  it('the sunrise check alone does not: the run waits, and ends when the window closes with no third flame', () => {
    let d = slipAndSunrise(addDays(K, 4));
    for (let i = 1; i <= core.RK_DAYS; i++) d = withEv(d, addDays(K, i), { time: '23:30' });
    expect(core.runLedger(d, st, addDays(K, 1)).kind[K]).toBe('open');
    expect(core.runLedger(d, st, addDays(K, 4)).kind[K]).toBeUndefined();
  });
  it('start fresh is still the person’s choice: no save', () => {
    const d = withEv(base(addDays(K, 2)), K, { id: 's1', keep: false, rk: { at: addDays(K, 1), pl: '' } });
    expect(core.runLedger(d, st, addDays(K, 2)).kind[K]).toBeUndefined();
  });
  it('the missions still save it, as before', () => {
    let d = withEv(base(addDays(K, 2)), K, { id: 's1', recovered: true, rk: { at: addDays(K, 1), pl: '' } });
    d = { ...d, [K]: normDay({ ...d[K], p: { ...core.blankP(), po: '23:00' } }, K) };
    d = withEv(d, addDays(K, 1), { time: '23:30' });
    expect(core.runLedger(d, st, addDays(K, 1)).kind[K]).toBe('saved');
  });
  it('a slip before RK_BACK_FROM keeps the rule it was made under', () => {
    const s0 = normSettings({ start: '2026-09-25', day1: '2026-10-01' });
    const k = '2026-10-15';
    const d: Days = {};
    for (let x = s0.start; x <= '2026-10-19'; x = addDays(x, 1))
      d[x] = normDay({ events: [], checkin: { m: 6, c: 6, e: 6, s: 4, h: 7, so: null, done: true } }, x);
    d[k] = normDay({ ...d[k], events: [{ id: 's1', time: '22:00', outcome: 'slipped', rk: { at: '2026-10-16', pl: '' } }] }, k);
    expect(k < core.RK_BACK_FROM).toBe(true);
    expect(core.runLedger(d, s0, '2026-10-19').kind[k]).toBeUndefined();
  });
});

describe('the sunrise check is coming back, for every slip in every mode', () => {
  const step = normSettings({ start: '2026-10-25', day1: '2026-11-01', cleanMode: 'step', stepAt: '2026-11-01' });
  it('stepping down, a second slip in a week: the day after, coming back marks it, and no card asks anything', () => {
    let d = withEv(base(K), addDays(K, -2), {});
    d = withEv(d, K, {});
    const due = core.sunriseDue(d, step, addDays(K, 1))!;
    expect(due).toMatchObject({ k: K });
    expect(moments(d, step, {}, addDays(K, 1), at(addDays(K, 1), 8)).map((m) => m.k)).not.toContain('run-ask');
    const back = core.srDone(d, K, due.ev.id, addDays(K, 1));
    expect(core.rkLights(back, step, addDays(K, 1), K).flames[1]).toEqual({ on: true, t: 'You came back to Daybook' });
  });
  it('once marked, it is not marked again, and the sunrise points are there for every slip', () => {
    let d = withEv(base(K), addDays(K, -2), {});
    d = withEv(d, K, { rk: { at: addDays(K, 1), pl: '' } });
    expect(core.sunriseDue(d, step, addDays(K, 1))).toBeNull();
    expect(core.dayPoints(d, K, step).parts.some((p: { k: string; pts: number }) => p.k === 'sunrise' && p.pts === 15)).toBe(true);
  });
  it('points already earned by an older sunrise check are the same: the rule for points did not change', () => {
    const d = withEv(base(K), K, { rk: { at: addDays(K, 1), pl: 'Put my phone in another room.' } });
    const before = core.gameCompute(d, st, {}, addDays(K, 1)).pts;
    expect(core.srDone(d, K, 'e' + K, addDays(K, 2))).toBe(d);
    expect(core.gameCompute(d, st, {}, addDays(K, 1)).pts).toBe(before);
  });
  it('a slip that ended no run (two days ago) is not asked about after its morning', () => {
    const d = withEv(base(K), K, { time: '10:00' });
    const s1 = normSettings({ start: '2026-10-25', day1: '2026-11-05' });
    expect(core.sunriseDue(d, s1, addDays(K, 2))).toBeNull();
  });
});

describe('the three flames, and the comeback count', () => {
  it('light themselves, each naming what was done', () => {
    const d = slipAndSunrise(addDays(K, 2));
    const l = core.rkLights(d, st, addDays(K, 2), K);
    expect(l.flames.map((f) => f.on)).toEqual([true, true, true]);
    expect(l.flames.map((f) => f.t)).toEqual(['You logged it honestly', 'You came back to Daybook', 'A day with no slip, Monday']);
    const l0 = core.rkLights(withEv(base(K), K, {}), st, K, K);
    expect(l0.flames.map((f) => f.on)).toEqual([true, false, false]);
  });
  it('the comeback is noticed once, on the day the last flame lights', () => {
    const d = slipAndSunrise(addDays(K, 3));
    expect(pickMoment(d, st, {}, addDays(K, 1), at(addDays(K, 1), 20)).card.k).not.toBe('comeback');
    const p = pickMoment(d, st, {}, addDays(K, 2), at(addDays(K, 2), 9));
    expect([p.card.k, p.more?.k]).toContain('comeback');
    const c = core.comebackNow(d, st, addDays(K, 2))!;
    expect(c).toMatchObject({ k: K, saved: true, n: 1 });
    expect(core.comebackNow(d, st, addDays(K, 3))).toBeNull();
  });
  it('the count only goes up', () => {
    let d = slipAndSunrise('2026-11-20');
    const one = core.rkComebackCount(d, st, '2026-11-20');
    d = withEv(d, '2026-11-15', { id: 's2', rk: { at: '2026-11-16', pl: '' } });
    expect(core.rkComebackCount(d, st, '2026-11-20')).toBe(one + 1);
    expect(core.rkComebackSay(1)).toBe('You are someone who comes back: 1 comeback.');
  });
  it('the sunrise check ends with the flames, and says the count goes on once the third lights', () => {
    const d = slipAndSunrise(addDays(K, 1));
    const r = core.rkOf(d, K, st)!;
    const e = core.srEnd(d, st, addDays(K, 1), K, r, 7);
    expect(e.h).toBe('You came back. That is the skill.');
    expect(e.sub).toMatch(/^One more flame lights itself: the next urge you ride out, or a day with no slip, by \w+ night\. Then the count goes on from 7\.$/);
    expect(e.lights!.map((f) => f.on)).toEqual([true, true, false]);
    const done = core.srEnd(slipAndSunrise(addDays(K, 2)), st, addDays(K, 2), K, r, 7);
    expect(done.h).toBe('Run saved.');
  });
});
