/* The Undo right after a mistaken log: what that log alone made new (the Honest log badge, a level it reached) is taken
   back off the seen list, and a badge earned from a real log never is. */
import { describe, expect, it } from 'vitest';
import * as core from '../src/index';
import type { Days } from '../src/types';

const st0 = core.normSettings({ v: 1, start: '2026-10-01', day1: '2026-10-08', rollover: 4, screensOff: '23:00', u: 1 });
const seen0 = { badges: [] as string[], quests: [] as string[], level: 1, full: null, lad: core.LADDER_V };
const tk = '2026-10-12';

describe('taking back a mistaken slip', () => {
  it('the Honest log badge it gave is taken back, and nothing else', () => {
    const before = { ...st0, seen: { ...seen0 } };
    const days = core.addEvent({}, tk, 'slipped', '22:40').days;
    const r = core.checkNew(days, before, {}, tk, true);
    expect(r.items.some((it) => it.type === 'badge' && it.b.id === 'honest')).toBe(true);
    const after = r.st!;
    const fresh = core.freshSeen(before, after);
    expect(fresh.badges).toContain('honest');
    /* Undo: the slip is gone */
    const back = core.unseeTakenBack({}, after, {}, tk, fresh)!;
    expect(back.badges).toContain('honest');
    expect(back.st.seen!.badges).not.toContain('honest');
    /* and nothing shows it as earned */
    const b = core.gameCompute({}, back.st, {}, tk).badges.find((x) => x.id === 'honest')!;
    expect(core.badgeDone(b, back.st)).toBe(false);
  });
  it('a badge earned from a real slip earlier stays, even when a later mistaken one is undone', () => {
    const real = core.addEvent({}, '2026-10-05', 'slipped', '22:00').days;
    const before = { ...st0, seen: { ...seen0, badges: ['honest'] } };
    const days = core.addEvent(real, tk, 'slipped', '22:40').days;
    const r = core.checkNew(days, before, {}, tk, true);
    const after = r.st || before;
    const fresh = core.freshSeen(before, after);
    expect(fresh.badges).not.toContain('honest');
    const back = core.unseeTakenBack(real, after, {}, tk, fresh);
    expect(back ? back.st.seen!.badges : after.seen!.badges).toContain('honest');
  });
  it('a badge still earned without the log is never taken, even when the log marked it', () => {
    const real: Days = core.addEvent({}, '2026-10-05', 'slipped', '22:00').days;
    const st = { ...st0, seen: { ...seen0, badges: ['honest'] } };
    expect(core.unseeTakenBack(real, st, {}, tk, { badges: ['honest'], level: null })).toBeNull();
  });
  it('a level the undone log reached goes back to where it was; one still earned stays', () => {
    let days: Days = {};
    for (let i = 0; i < 12; i++) days = core.addEvent(days, core.addDays('2026-10-01', i), 'rode', '21:00').days;
    const lvl = core.gameCompute(days, st0, {}, tk).level.n;
    expect(lvl).toBeGreaterThan(1);
    const st = { ...st0, seen: { ...seen0, level: lvl } };
    /* the log being undone raised it from 1, but the level still stands without it: kept */
    expect(core.unseeTakenBack(days, st, {}, tk, { badges: [], level: 1 })).toBeNull();
    /* without the rides the level is not earned: back to the level it moved from */
    const r = core.unseeTakenBack({}, st, {}, tk, { badges: [], level: 1 })!;
    expect(r.level).toBe(true);
    expect(r.st.seen!.level).toBe(1);
  });
  it('the fresh list is what one change added', () => {
    const a = { ...st0, seen: { ...seen0, badges: ['first'], level: 2 } };
    const b = { ...st0, seen: { ...seen0, badges: ['first', 'honest'], level: 3 } };
    expect(core.freshSeen(a, b)).toEqual({ badges: ['honest'], level: 2 });
    expect(core.freshSeen(a, a)).toEqual({ badges: [], level: null });
  });
});
