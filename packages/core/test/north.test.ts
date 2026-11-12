/* The north star: one question once a month, never in the hours after a slip or an SOS, kept with the person's records. */
import { describe, expect, it } from 'vitest';
import * as core from '../src/index';

const tk = '2026-11-11';
const now = new Date(2026, 10, 11, 12, 0).getTime();
const st0 = (free?: core.FreeAns[], extra: Partial<core.Settings> = {}) =>
  core.normSettings({ ...core.defaultSettings(core.addDays(tk, -40)), ...(free ? { free } : {}), ...extra });
const quiet = { now, sos: null };

describe('when it is asked', () => {
  it('at setup when there is no answer yet, and not after one', () => {
    expect(core.freeAtSetup({}, null, tk, quiet)).toBe(true);
    expect(core.freeAtSetup({}, st0([{ d: tk, s: 4 }]), tk, quiet)).toBe(false);
  });
  it('a month after the last answer, and not before', () => {
    expect(core.freeDue({}, st0([{ d: core.addDays(tk, -core.FREE_EVERY), s: 4 }]), tk, quiet)).toBe(true);
    expect(core.freeDue({}, st0([{ d: core.addDays(tk, 1 - core.FREE_EVERY), s: 4 }]), tk, quiet)).toBe(false);
  });
  it('with no answer yet, as soon as it is calm', () => {
    expect(core.freeDue({}, st0(), tk, quiet)).toBe(true);
  });
  it('never within the days after a slip (72 hours and more)', () => {
    const near = core.addEvent({}, core.addDays(tk, -3), 'slipped', '23:00').days;
    expect(core.freeDue(near, st0(), tk, quiet)).toBe(false);
    expect(core.freeAtSetup(near, null, tk, quiet)).toBe(false);
    const far = core.addEvent({}, core.addDays(tk, -core.TIP_CALM), 'slipped', '12:00').days;
    expect(core.freeDue(far, st0(), tk, quiet)).toBe(true);
  });
  it('never within 72 hours of an SOS', () => {
    expect(core.freeDue({}, st0(), tk, { now, sos: now - 71 * 3600_000 })).toBe(false);
    expect(core.freeAtSetup({}, null, tk, { now, sos: now - 71 * 3600_000 })).toBe(false);
    expect(core.freeDue({}, st0(), tk, { now, sos: now - 73 * 3600_000 })).toBe(true);
  });
  it('closed or skipped unanswered, it waits a week', () => {
    const later = core.freeLater(st0(), core.addDays(tk, 1 - core.FREE_WAIT), now);
    expect(core.freeDue({}, later, tk, quiet)).toBe(false);
    expect(core.freeDue({}, core.freeLater(st0(), core.addDays(tk, -core.FREE_WAIT), now), tk, quiet)).toBe(true);
  });
  it('is for every habit, not only the one the five questions are for', () => {
    const st = core.normSettings({ ...st0(), onb: { n: 1, at: 1, a: { habit: 'alcohol' }, hist: [] } });
    expect(core.habitOf(st)).toBe('alcohol');
    expect(core.freeDue({}, st, tk, quiet)).toBe(true);
  });
});

describe('the answers', () => {
  it('are kept one a day, held to 0 to 10, and clear the wait', () => {
    let st = core.freeLater(st0(), tk, now);
    st = core.freeKeep(st, tk, 4, now);
    st = core.freeKeep(st, tk, 12, now);
    expect(core.freeList(st)).toEqual([{ d: tk, s: 10 }]);
    expect(st.freeNo).toBeUndefined();
  });
  it('stay in the settings through normSettings, so they sync with the rest', () => {
    const st = core.freeKeep(st0(), tk, 6, now);
    expect(core.normSettings(JSON.parse(JSON.stringify(st))).free).toEqual([{ d: tk, s: 6 }]);
  });
  it('read oldest first, and drop anything odd', () => {
    const st = st0([{ d: tk, s: 7 }, { d: core.addDays(tk, -30), s: 3 }, { d: 'x', s: 2 } as never, { d: tk, s: 11 } as never]);
    expect(core.freeList(st).map((a) => a.s)).toEqual([3, 7]);
  });
  it('a higher number is the win, and a lower one is never a fault', () => {
    expect(core.freeResult(4, null).h).toBe('4 of 10');
    expect(core.freeResult(4, null).p).toMatch(/starting point/);
    expect(core.freeResult(6, 4).h).toBe('Up from 4 to 6');
    expect(core.freeResult(6, 6).h).toBe('Still 6 of 10');
    expect(core.freeResult(3, 6).p).toMatch(/still there/);
    expect(core.freeResult(3, 6).h).not.toMatch(/down|fall|lost/i);
  });
});

describe('the proof beside it', () => {
  it('is nothing for someone with no record yet', () => {
    expect(core.freeProof({}, core.normSettings(core.defaultSettings(tk)), {}, tk)).toEqual([]);
  });
  it('puts urges ridden out first', () => {
    let days = core.addEvent({}, core.addDays(tk, -2), 'rode', '21:00').days;
    days = core.addEvent(days, core.addDays(tk, -1), 'rode', '21:30').days;
    const p = core.freeProof(days, st0(), {}, tk);
    expect(p[0].ic).toBe('wave');
    expect(p[0].n).toBe('2 times');
    expect(p.length).toBeLessThanOrEqual(2);
  });
});

describe('the counts Daybook steers by', () => {
  it('urges ridden out and slips in the 30 days up to today', () => {
    let days = core.addEvent({}, core.addDays(tk, -29), 'rode', '21:00').days;
    days = core.addEvent(days, core.addDays(tk, -30), 'rode', '21:00').days;
    days = core.addEvent(days, tk, 'slipped', '08:00').days;
    days = core.addEvent(days, core.addDays(tk, -5), 'rode', '20:00').days;
    expect(core.freeCounts(days, tk)).toEqual({ rode30: 2, slips30: 1 });
  });
  it('go on the list as numbers only, checked on both ends', () => {
    const e = core.evAdd(core.evNew(tk, 'a'.repeat(32)), 'free', tk, 12, { free: 7, rode30: 3, slips30: 1, words: 'never' });
    expect(e.q[0].p).toEqual({ free: 7, rode30: 3, slips30: 1 });
    const b = core.eventsClean({ i: 'a'.repeat(32), p: 'ios', v: '1', e: [{ k: 0, n: 'free', d: 0, h: 9, p: { free: 'ten', rode30: 5000 } }] });
    expect(b!.e[0].p).toEqual({ rode30: 1000 });
  });
});

describe('its card on Today', () => {
  const day = (dev: object) => core.moments({}, st0(), {}, tk, now, dev).filter((m) => m.k === 'recheck');
  it('rides with the five questions when they are due, and is "One question" alone when they are not', () => {
    expect(day({ recheck: true, free: true })).toMatchObject([{ h: 'Five questions, one minute' }]);
    expect(day({ free: true })).toMatchObject([{ h: 'One question', go: 'recheck', v: 'free' }]);
    expect(day({})).toEqual([]);
  });
  it('waits behind the day’s next stop, like the five', () => {
    const p = core.pickMoment({}, st0(), {}, tk, now, { free: true });
    expect(p.card.k).not.toBe('recheck');
  });
});
