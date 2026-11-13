/* The true record (truth.ts, docs/review-plan.md C1, C2 and WP1; the owner's D1 and D2, November 12, 2026). Every day here is made up. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as core from '../src/index';
import type { Days, Settings } from '../src/types';

const day = (n: number) => core.addDays('2026-10-31', n); // day(1) is November 1
const at = (n: number, h: number, m = 0) => {
  const [y, mo, d] = day(n).split('-').map(Number);
  return new Date(y, mo - 1, d, h, m).getTime();
};
const base = { start: day(1), day1: day(1), countFrom: day(1) };
/** settings with the true record from day t */
const truth = (t: number, more: Partial<Settings> = {}): Settings => core.normSettings({ ...base, truthFrom: day(t), ...more });
const old: Settings = core.normSettings({ ...base });

/** a morning on day n that says how night n - 1 went */
const tell = (d: Days, st: Settings, n: number, how: 'free' | 'slip'): Days => core.answerNight(d, st, day(n), how, at(n, 8));
/** every night from a to b told free */
const tellFree = (d: Days, st: Settings, a: number, b: number): Days => {
  let x = d;
  for (let n = a; n <= b; n++) x = tell(x, st, n + 1, 'free');
  return x;
};
const lesson = (d: Days, n: number): Days => ({
  ...d,
  [day(n)]: core.normDay({ ...(d[day(n)] || {}), p: { ...(d[day(n)]?.p || {}), ls: ['l' + n] } }, day(n)),
});

describe('a night nobody told Daybook about', () => {
  it('counts exactly as before until truthFrom, so nothing earned before it moves', () => {
    const st = truth(11);
    for (const n of [5, 8, 11]) {
      expect(core.runLedger({}, st, day(n)).cur).toBe(core.runLedger({}, old, day(n)).cur);
      expect(core.computeMetrics({}, st, day(n)).longest).toBe(core.computeMetrics({}, old, day(n)).longest);
    }
    expect(core.noSlipDays({}, st, day(11))).toBe(10);
  });

  it('is untold from truthFrom on: never free, never a slip', () => {
    const st = truth(1);
    expect(core.nightState({}, st, day(3), day(6))).toBe('untold');
    expect(core.dayKnown({}, st, day(3), day(6))).toBe(false);
    const d = tell({}, st, 4, 'free');
    expect(core.nightState(d, st, day(3), day(6))).toBe('free');
    const s = tell({}, st, 4, 'slip');
    expect(core.nightState(s, st, day(3), day(6))).toBe('slip');
    /* today is still going */
    expect(core.nightState({}, st, day(6), day(6))).toBe('free');
  });

  it('in strict, the run waits on it: it neither grows nor breaks', () => {
    const st = truth(1);
    let d = tellFree({}, st, 1, 3);
    expect(core.runLedger(d, st, day(4)).cur).toBe(4);
    /* nights 4 and 5 not told */
    expect(core.runLedger(d, st, day(6)).cur).toBe(4);
    /* telling them later fills them in */
    d = core.answerNightBefore(tell(d, st, 6, 'free'), st, day(6), 'free', at(6, 8));
    expect(core.runLedger(d, st, day(6)).cur).toBe(6);
  });

  it('in gentle, it is one of the last nights and drawn hollow', () => {
    const st = truth(1, { cleanMode: 'gentle' });
    const d = tellFree({}, st, 3, 5);
    const t = core.todayMeasure(d, st, day(9))!;
    expect(t.n).toBe(3);
    expect(t.of).toBe('of the last 7 days with no slip');
    expect(t.cells).toEqual(['untold', 'ok', 'ok', 'ok', 'untold', 'untold', 'untold', 'today']);
  });

  it('closing the morning with the X leaves the night untold', () => {
    const st = truth(1);
    const d = core.skipMorning(tellFree({}, st, 1, 2), day(4), at(4, 8));
    expect(core.nightState(d, st, day(3), day(5))).toBe('untold');
  });

  it('an evening check-in tells its day, so a person who checks in every evening loses nothing', () => {
    const st = truth(1);
    const d: Days = {};
    for (let n = 1; n <= 9; n++) d[day(n)] = core.normDay({ checkin: { md: 6, u: 2, s: 3, done: true, at: at(n, 21) } }, day(n));
    expect(core.runLedger(d, st, day(10)).cur).toBe(10);
  });

  it('the catch-up row asks about the night before last, only when it is not told', () => {
    const st = truth(1);
    const d = tellFree({}, st, 1, 2);
    expect(core.nightBeforeDue(d, st, day(5))).toBe(day(3));
    expect(core.nightBeforeAsk(day(3))).toMatch(/^And \w+day night\?$/);
    const told = core.answerNightBefore(d, st, day(5), 'slip', at(5, 8));
    expect(core.nightState(told, st, day(3), day(5))).toBe('slip');
    /* changing it back takes away only the slip it added */
    const back = core.answerNightBefore(told, st, day(5), 'free', at(5, 8, 1));
    expect(core.nightState(back, st, day(3), day(5))).toBe('free');
    expect(core.nightBeforeDue(tell(tellFree({}, st, 1, 2), st, 4, 'free'), st, day(5))).toBeNull();
  });

  it('more than two nights not told is a stretch Welcome back asks about, as nights not told, and its answer fills them', () => {
    const st = truth(1);
    /* here every day (the app opened), but nothing told after night 2 */
    let d = tellFree({}, st, 1, 2);
    for (let n = 3; n <= 9; n++) d = core.markOpen(d, day(n), at(n, 9));
    const due = core.awayDue(d, st, day(10))!;
    expect(due).toMatchObject({ from: day(3), to: day(8), n: 6, away: false });
    const st2 = core.answerAwaySlips(st, due, 2, at(10, 9));
    expect(core.awayDue(d, st2, day(10))).toBeNull();
    expect(core.nightState(d, st2, day(8), day(10))).toBe('slip');
    expect(core.nightState(d, st2, day(5), day(10))).toBe('free');
    /* night 9 is the morning's to ask */
    expect(core.nightState(d, st2, day(9), day(10))).toBe('untold');
  });

  it('days away say "away"; nights not told while here do not', () => {
    expect(core.awayLine({ from: day(3), to: day(8), n: null, away: false })).toBe('Nov 3 to 8 · not told yet');
    expect(core.awayLine({ from: day(3), to: day(8), n: 2, away: false })).toBe('Nov 3 to 8 · told, 2 slips');
    expect(core.awayLine({ from: day(3), to: day(8), n: 2 })).toBe('Nov 3 to 8 · away · 2 slips');
  });
});

describe('proofs and badges read told nights only', () => {
  afterEach(() => vi.useRealTimers());
  it('no clear days, no 48 hours and no lower week across nights not told', () => {
    vi.useFakeTimers();
    vi.setSystemTime(at(10, 9));
    const st = truth(1);
    let d = core.addEvent({}, day(2), 'slipped', '23:00', {}, at(2, 23)).days;
    d = core.addEvent(d, day(9), 'slipped', '23:00', {}, at(9, 23)).days;
    const S = core.gameCompute(d, st, {}, day(10)).S;
    expect(S.longest).toBe(1);
    expect(S.stretch48).toBe(0);
    /* the same nights told free earn them */
    const told = tellFree(d, st, 3, 8);
    const T = core.gameCompute(told, st, {}, day(10)).S;
    expect(T.longest).toBe(6);
    expect(T.stretch48).toBe(1);
  });

  it('the Sunday week counts a night not told as neither, and never says "This is what free looks like" over silence', () => {
    const st = truth(1);
    const sun = day(8);
    const w = core.sunWeek({}, st, sun, day(9));
    expect(w).toMatchObject({ noSlip: 0, untold: 7 });
    const r = core.weekRead({}, st, sun, day(9), w, [{ sun, days: 7, noSlip: 0, untold: 7 }], core.patWhen({}, st, [], day(9)));
    expect(r.says).toBe('Not one night told this week.');
    const d = tellFree({}, st, 2, 4);
    const w2 = core.sunWeek(d, st, sun, day(9));
    const r2 = core.weekRead(d, st, sun, day(9), w2, [{ sun, days: 7, noSlip: w2.noSlip, untold: w2.untold }], core.patWhen(d, st, [], day(9)));
    expect(r2.kind).toBe('clean');
    expect(r2.says).toBe('Free on every night you told me about: 3 nights.');
    expect(r2.held).toBe('4 nights not told. Tell me each morning, and every free night counts.');
  });

  it('"every one logged" is said only while every night was told', () => {
    const st = truth(1);
    const d = core.addEvent({}, day(2), 'slipped', '23:00', {}, at(2, 23)).days;
    const line = core.identityLines(d, st, {}, day(6)).find((x) => x.ic === 'leaf')!;
    expect(line.n).toBe('1 slip told');
    const all = tellFree(tell(d, st, 2, 'free'), st, 3, 5);
    expect(core.identityLines(all, st, {}, day(6)).find((x) => x.ic === 'leaf')!.n).toBe('1 slip, every one logged');
  });
});

describe('a slip told the next morning', () => {
  it('is counted from when it was told, and the chip says "last night", never made-up hours', () => {
    const st = truth(1, { cleanMode: 'gentle' });
    const d = tell(tellFree({}, st, 1, 3), st, 5, 'slip');
    const now = at(5, 9);
    expect(core.hoursSinceSlip(d, st, day(5), now)).toBeCloseTo(1, 1);
    expect(core.heroNumber(d, st, day(5), now)!.chip).toBe('Your last slip: last night');
  });
});

describe('the fire is fed by the truth (the owner’s rule, D2)', () => {
  const st = truth(1, { cleanMode: 'gentle' });
  const tk = day(12);
  const now = at(12, 9);

  it('a day with nothing fed dims it, a low fire grows visibly from one feed, and telling lights it fully', () => {
    let d = tellFree({}, st, 1, 7);
    /* nothing from day 9 on */
    expect(core.fireLow(d, st, tk, now).step).toBe(3);
    const fed = lesson(d, 12);
    const f = core.fireLow(fed, st, tk, now);
    expect(f.was).toBe(3);
    expect(f.step).toBeLessThan(3);
    d = tell(d, st, 12, 'free');
    expect(core.fireLow(d, st, tk, now)).toMatchObject({ step: 0, was: 3 });
  });

  it('a night not told dims it more than a slip that was told', () => {
    const honest = tell(tellFree({}, st, 1, 8), st, 10, 'slip');
    let quiet = tellFree({}, st, 1, 8);
    for (let n = 9; n <= 11; n++) quiet = lesson(quiet, n);
    const later = at(15, 9);
    const a = core.fireLow(honest, st, day(11), at(11, 9));
    expect(a.step).toBe(0);
    let q = quiet;
    for (let n = 12; n <= 15; n++) q = lesson(q, n);
    expect(core.fireLow(q, st, day(15), later - 1).was).toBeGreaterThan(0);
  });

  it('never dims in the hours after a slip', () => {
    const d = tell({}, st, 10, 'slip');
    expect(core.fireLow(d, st, day(10), at(10, 9)).step).toBe(0);
    expect(core.fireLow(d, st, day(11), at(11, 9)).step).toBe(0);
  });

  it('says what was not told, and that telling lights it', () => {
    const w = core.lowWords({ step: 1, low: 0.6, idle: 0, was: 1, warn: false, untold: 2, tell: true })!;
    expect(w.p).toBe('Two nights not told.');
    expect(w.fix).toBe('Tell me how last night went, and it burns again.');
  });
});

describe('hard hours are praised only once the night is told free', () => {
  it('waits for the answer', () => {
    const st = truth(1);
    let d: Days = {};
    for (let n = 1; n <= 6; n++) d = core.addEvent(d, day(n), 'slipped', '22:30', {}, at(n, 22, 30)).days;
    d = tellFree(d, st, 7, 9);
    expect(core.riskToKeep(d, st, day(11), at(11, 9))).toBeNull();
    const told = tell(d, st, 11, 'free');
    const x = core.riskToKeep(told, st, day(11), at(11, 9));
    expect(x?.k ?? day(10)).toBe(day(10));
  });
});

describe('truthFrom is set once and kept', () => {
  it('keepCounts writes it on the first open, and never moves it', () => {
    const st = core.normSettings({ ...base });
    const once = core.keepCounts({}, st, day(9))!;
    expect(once.truthFrom).toBe(day(9));
    const again = core.keepCounts({}, once, day(12));
    expect(again?.truthFrom ?? once.truthFrom).toBe(day(9));
  });
  it('two copies keep the earlier day', () => {
    const a = truth(9);
    const b = truth(4);
    expect(core.keepEarned(a, b).truthFrom).toBe(day(4));
  });
  it('a record that lost its counting mode loads as gentle', () => {
    expect(core.normSettingsLoaded({ ...base }).cleanMode).toBe('gentle');
    expect(core.normSettingsLoaded({ ...base, cleanMode: 'strict' }).cleanMode).toBe('strict');
  });
});
