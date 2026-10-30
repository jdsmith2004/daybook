/* The five questions again, every 30 days, at a good moment, with the score next to the last one. */
import { describe, expect, it } from 'vitest';
import * as core from '../src/index';

const tk = '2026-10-30';
const start = core.addDays(tk, -core.BPS_EVERY);
const st0 = (hist: core.BpsScore[] = []) => core.normSettings({ ...core.defaultSettings(start), onb: { n: 1, at: 1, a: {}, hist } });

describe('when it is due', () => {
  it('30 days after the setup score, and not before', () => {
    expect(core.bpsDue({}, st0([{ d: start, s: 6 }]), tk, {})).toBe(true);
    expect(core.bpsDue({}, st0([{ d: core.addDays(start, 1), s: 6 }]), tk, {})).toBe(false);
  });
  it('with no setup score, 30 days after the start', () => {
    expect(core.bpsDue({}, st0(), tk, {})).toBe(true);
    expect(core.bpsDue({}, core.normSettings(core.defaultSettings(core.addDays(start, 1))), tk, {})).toBe(false);
  });
  it('30 days after the last one kept on this device', () => {
    expect(core.bpsDue({}, st0([{ d: start, s: 6 }]), tk, core.bpsKeep({}, core.addDays(tk, -29), 4))).toBe(false);
    expect(core.bpsDue({}, st0([{ d: start, s: 6 }]), tk, core.bpsKeep({}, core.addDays(tk, -30), 4))).toBe(true);
  });
  it('never within four days of a slip', () => {
    const near = core.addEvent({}, core.addDays(tk, 1 - core.TIP_CALM), 'slipped', '12:00').days;
    expect(core.bpsDue(near, st0(), tk, {})).toBe(false);
    const far = core.addEvent({}, core.addDays(tk, -core.TIP_CALM), 'slipped', '12:00').days;
    expect(core.bpsDue(far, st0(), tk, {})).toBe(true);
  });
  it('never within three hours of an SOS', () => {
    const now = new Date(2026, 9, 30, 12, 0).getTime();
    expect(core.bpsDue({}, st0(), tk, {}, { now, sos: now - 3600_000 })).toBe(false);
    expect(core.bpsDue({}, st0(), tk, {}, { now, sos: now - 4 * 3600_000 })).toBe(true);
  });
  it('closed unanswered, it waits a week', () => {
    expect(core.bpsDue({}, st0(), tk, { bpsNo: core.addDays(tk, 1 - core.BPS_WAIT) })).toBe(false);
    expect(core.bpsDue({}, st0(), tk, { bpsNo: core.addDays(tk, -core.BPS_WAIT) })).toBe(true);
  });
});

describe('the score', () => {
  it('adds the five answers, and keeps one a day', () => {
    expect(core.bpsScore([0, 1, 2, 1, 0])).toBe(4);
    const m = core.bpsKeep(core.bpsKeep({}, tk, 4), tk, 3);
    expect(m.bps).toEqual([{ d: tk, s: 3 }]);
  });
  it('reads the setup first, then this device', () => {
    expect(core.bpsScores(st0([{ d: start, s: 6 }]), core.bpsKeep({}, tk, 4)).map((x) => x.s)).toEqual([6, 4]);
  });
  it('a lower score is a win, and a higher one is never a fault', () => {
    expect(core.bpsResult(4, 6).h).toBe('Down from 6 to 4');
    expect(core.bpsResult(4, 6).p).toMatch(/win/);
    expect(core.bpsResult(6, 4).p).toMatch(/Nothing you built is gone/);
    expect(core.bpsResult(4, 4).h).toBe('Still 4 of 10');
    expect(core.bpsResult(4, null).h).toBe('4 of 10');
  });
  it('the row says where it went', () => {
    expect(core.bpsRow([])).toMatch(/five questions/);
    expect(core.bpsRow([{ d: start, s: 6 }])).toBe('Your score: 6 of 10');
    expect(
      core.bpsRow([
        { d: start, s: 6 },
        { d: tk, s: 4 },
      ]),
    ).toBe('From 6 to 4 of 10');
  });
});

it('it comes after the day’s next stop, so the lesson stays the card', () => {
  const st = core.normSettings({ ...core.defaultSettings('2026-09-01'), day1: '2026-09-08' });
  const at = new Date(2026, 9, 28, 10, 0).getTime();
  const pick = core.pickMoment({}, st, {}, '2026-10-28', at, { recheck: true });
  expect(pick.card.k).toBe('calm');
  expect(pick.more?.k).toBe('recheck');
  expect(core.pickMoment({}, st, {}, '2026-10-28', at, {}).more).toBeNull();
});

it('the Sunday review says this week’s plan, or last week’s, or the urge plan', () => {
  const st = core.normSettings(core.defaultSettings('2026-09-01'));
  const it0 = { w: 'I get home tired', t: 'make tea' };
  expect(core.sunPlanSay({}, st, tk, it0)).toBe('When I get home tired, I will make tea.');
  expect(core.sunPlanSay({}, { ...st, plan: [{ when: 'When it is late', then: 'I will put the phone away' }] }, tk)).toBe(
    'When it is late, I will put the phone away.',
  );
  expect(core.sunPlanSay({}, { ...st, plan: [] }, tk)).toBeNull();
});
