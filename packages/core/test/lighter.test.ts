/* The lighter Today: offered only after a long stretch with no slip and a quiet couple of weeks, always the person's choice,
   undone with one tap, and a slip afterwards is just a slip. */
import { expect, it } from 'vitest';
import * as core from '../src/index';
import type { Days, Settings } from '../src/types';

const tk = '2026-10-15';
const st0 = (o: Partial<Settings> = {}): Settings => core.normSettings({ ...core.defaultSettings('2026-06-01'), day1: '2026-06-08', ...o });
const ev = (days: Days, key: string, outcome: 'rode' | 'slipped', n = 1) => {
  let d = days;
  for (let i = 0; i < n; i++) d = core.addEvent(d, key, outcome, '21:00').days;
  return d;
};

it('is not offered before the stretch is long enough', () => {
  const days = ev({}, core.addDays(tk, -(core.LEAN_DAYS - 1)), 'slipped');
  const li = core.leanInfo(days, st0(), tk);
  expect(li.clean).toBe(core.LEAN_DAYS - 2);
  expect([li.ready, li.offer]).toEqual([false, false]);
});

it('is offered after the stretch, when the last two weeks were quiet', () => {
  let days = ev({}, core.addDays(tk, -(core.LEAN_DAYS + 1)), 'slipped');
  days = ev(days, core.addDays(tk, -3), 'rode', core.LEAN_QUIET_URGES);
  const li = core.leanInfo(days, st0(), tk);
  expect(li.clean).toBe(core.LEAN_DAYS);
  expect([li.ready, li.offer, li.on]).toEqual([true, true, null]);
});

it('counts from Day 1 when there has never been a slip', () => {
  expect(core.leanInfo({}, st0(), tk).clean).toBe(core.diffDays(tk, '2026-06-08'));
  expect(core.leanInfo({}, st0({ day1: null }), tk).clean).toBe(0);
});

it('waits while the last two weeks are busy with urges', () => {
  const days = ev({}, core.addDays(tk, -2), 'rode', core.LEAN_QUIET_URGES + 1);
  expect(core.leanInfo(days, st0(), tk)).toMatchObject({ ready: false, offer: false });
});

it('"Not now" quiets the offer for a while, then it comes back', () => {
  const st = core.leanLater(st0(), tk, 1).st;
  expect(core.leanInfo({}, st, tk).offer).toBe(false);
  expect(core.leanInfo({}, st, core.addDays(tk, core.LEAN_ASK_AGAIN)).offer).toBe(true);
});

it('can be turned on and off, and nothing else in settings changes', () => {
  const st = st0();
  const on = core.leanStart(st, tk, 5).st;
  expect(core.leanOf(on)).toBe(tk);
  expect(core.leanInfo({}, on, tk)).toMatchObject({ on: tk, offer: false });
  const off = core.leanStop(on, tk, 6).st;
  expect(core.leanInfo({}, off, tk).offer).toBe(false);
  expect(core.leanOf(off)).toBeNull();
  const strip = (s: Settings) => {
    const x = JSON.parse(JSON.stringify(s));
    delete x.u;
    delete x.lean;
    delete x.leanNo;
    return x;
  };
  expect(strip(off)).toEqual(strip(st));
});

it('an older record with no lean fields, or a bad one, reads as off', () => {
  expect(core.leanOf(st0())).toBeNull();
  expect(core.leanOf(st0({ lean: 'soon' as unknown as string }))).toBeNull();
  expect(core.leanOf(core.normSettings({ ...st0(), lean: '2026-10-01' }))).toBe('2026-10-01');
});

it('a slip while it is on stays on, and only adds a gentle line for a few days', () => {
  const st = core.leanStart(st0(), '2026-10-01', 1).st;
  const days = ev({}, '2026-10-12', 'slipped');
  const li = core.leanInfo(days, st, tk);
  expect(li.on).toBe('2026-10-01');
  expect(li.slipSince).toBe('2026-10-12');
  expect(core.leanInfo(days, st, core.addDays('2026-10-12', core.LEAN_SLIP_DAYS + 1)).slipSince).toBeNull();
});

it('the words never call it a test or a failure', () => {
  const words = [core.leanStart(st0(), tk).toast, core.leanStop(st0(), tk).toast, core.leanLater(st0(), tk).toast].join(' ');
  expect(words).not.toMatch(/fail|graduat|test|lost|reset/i);
});
