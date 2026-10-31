/* The morning questions were retired on October 23, 2026 (docs/plan.md, "Lessons first"): Good night is the phone going
   away (and screens off on time when it comes before the screens-off time), and sleep is one optional question in the
   evening check-in. What was earned from mornings stays earned; a saved routine or reminder that still has the morning is
   read and ignored. */
import { describe, expect, it } from 'vitest';
import * as core from '../src/index';
import type { Days } from '../src/types';

const st = core.normSettings({ start: '2026-10-01', day1: '2026-10-08', screensOff: '23:00' });
const sleep = (days: Days, k: string, h: number) => core.saveCheckin(days, k, { ...core.checkinFormOf(days, k), h }, 1);

describe('mornings answered before they were retired', () => {
  /* the night of the 20th: screens off on time, answered the next morning, with the sleep */
  const days = sleep(core.setScreensOff({}, '2026-10-20', 'Y', 1), '2026-10-21', 7);
  it('keep their win and their points', () => {
    const w = core.winsOf(days, '2026-10-21', st);
    expect(w.morning).toBe(true);
    expect(w.na.morning).toBe(false);
    expect(core.dayPoints(days, '2026-10-21', st).parts.find((x) => x.k === 'morning')?.pts).toBe(5);
  });
  it('a missed one is still part of that day, as it was', () => {
    expect(core.winsOf({}, '2026-10-21', st).na.morning).toBe(false);
  });
});

describe('from October 24', () => {
  const k = core.MORNING_END;
  const prev = core.addDays(k, -1);
  it('Good night and sleep in the check-in are not the morning questions: no morning win, and it is not part of the day', () => {
    const days = sleep(core.phoneAway({}, prev, '22:15', 1, st), k, 7.5);
    const w = core.winsOf(days, k, st);
    expect(w.morning).toBe(false);
    expect(w.na.morning).toBe(true);
    expect(core.winTally(w).t).toBe(4);
  });
  it('a morning answered on an older copy of the app (p.m) still counts', () => {
    const days = { [k]: core.normDay({ p: { m: true } }, k) };
    expect(core.winsOf(days, k, st).morning).toBe(true);
    expect(core.dayPoints(days, k, st).parts.map((x) => x.k)).toContain('morning');
  });
  it('Good night before the screens-off time earns the phone away and screens off on time', () => {
    const days = core.phoneAway({}, k, '22:15', 1, st);
    const parts = core.dayPoints(days, k, st).parts.map((x) => [x.k, x.pts]);
    expect(parts).toEqual([
      ['lights', 5],
      ['wind', 10],
      ['phone', 5],
    ]);
    /* late: the phone away and the wind-down still count, and nothing says late */
    expect(core.dayPoints(core.phoneAway({}, k, '23:30', 1, st), k, st).parts.map((x) => x.k)).toEqual(['wind', 'phone']);
  });
});

describe('what reads screens off and sleep', () => {
  it('the screens-off nights count Good night on time (the Lights out badges, the old quest)', () => {
    const days = core.phoneAway(core.phoneAway({}, '2026-10-13', '22:00', 1, st), '2026-10-14', '22:50', 2, st);
    expect(core.gameCompute(days, st, {}, '2026-10-15').S.lightsYes).toBe(2);
    expect(core.weekGame(days, st, core.weekOf('2026-10-14', st)).lights).toBe(2);
  });
  it('the Sunday phone and sleep goals count Good night and the check-in’s sleep', () => {
    let days = core.phoneAway({}, '2026-10-13', '23:40', 1, st);
    days = sleep(days, '2026-10-14', 7.5);
    days = sleep(days, '2026-10-15', 6);
    expect(core.SUN_GOALS.phone.did(days['2026-10-13'])).toBe(true);
    expect(core.SUN_GOALS.sleep.did(days['2026-10-14'])).toBe(true);
    expect(core.SUN_GOALS.sleep.did(days['2026-10-15'])).toBe(false);
    expect(core.sunWeek(days, st, '2026-10-18', '2026-10-18').sleep).toEqual([7.5, 6]);
  });
  it('a sleep answer alone is a check-in answered (the log can start there), as the morning one was', () => {
    expect(core.loggedDay(sleep({}, '2026-10-14', 8)['2026-10-14'])).toBe(true);
  });
});

describe('saved choices that still have the morning', () => {
  it('the routine keeps it, never shows it, and cannot change it', () => {
    const old = core.normSettings({ start: '2026-10-01', routine: { morning: false } });
    expect(old.routine.morning).toBe(false);
    expect(core.ROUTINE.map((r) => r.k)).not.toContain('morning');
    expect(core.setRoutine(old, 'morning', true).routine.morning).toBe(false);
    expect(core.routineChanged(old, core.normP({ ov: { morning: true } }))).toBe(0);
    /* a day's own choice for it is still read, so an old day's ring is unchanged */
    expect(core.normP({ ov: { morning: true }, m: true })?.ov).toEqual({ morning: true });
  });
  it('the morning badge is shown only to someone who earned it', () => {
    const g = core.gameCompute({}, st, {}, '2026-10-24');
    expect(core.shownBadges(g.badges, st).map((b) => b.id)).not.toContain('morning-5');
    const seen = { ...st, seen: { ...(st.seen || { level: 1, badges: [], quests: [] }), badges: ['morning-5'] } };
    expect(core.shownBadges(g.badges, seen as typeof st).map((b) => b.id)).toContain('morning-5');
  });
  it('the morning count is no longer sent', () => {
    expect(core.pulseKeys().has('morning')).toBe(false);
  });
});
