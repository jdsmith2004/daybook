/* The slip path's "Did you wait first?" (minutes from a slider, kept on the slip as wm, with wt in step) and the words of
   its hold-to-rekindle screen. */
import { describe, expect, it } from 'vitest';
import * as core from '../src/index';

const K = '2026-10-20';
const slip = (extra: Partial<core.DayEvent> = {}) => core.addEvent({}, K, 'slipped', '22:10', { id: 's1', ...extra }, 100).days;
const noContractions = /\b\w+(n’t|n't|’re|'re|’ll|'ll|’ve|'ve|’m|'m|’s|'s)\b/i;

describe('did you wait first?', () => {
  it('keeps whole minutes from 0 to 30, with wt in step for the older rules', () => {
    expect(core.rkWaitFields(0)).toEqual({ wm: 0, wt: 0 });
    expect(core.rkWaitFields(4)).toEqual({ wm: 4, wt: 0 });
    expect(core.rkWaitFields(5)).toEqual({ wm: 5, wt: 5 });
    expect(core.rkWaitFields(12)).toEqual({ wm: 12, wt: 10 });
    expect(core.rkWaitFields(30)).toEqual({ wm: 30, wt: 20 });
    expect(core.rkWaitFields(45)).toEqual({ wm: 30, wt: 20 });
    expect(core.rkWaitFields(-3)).toEqual({ wm: 0, wt: 0 });
    expect(core.rkWaitFields(7.6)).toEqual({ wm: 8, wt: 5 });
    expect(core.rkWaitFields(NaN)).toEqual({ wm: 0, wt: 0 });
  });

  it('stays on the slip through every change to the day, and in a backup', () => {
    let days = slip();
    days = core.patchEvent(days, K, 's1', core.rkWaitFields(12), 200);
    expect(days[K].events[0].wm).toBe(12);
    expect(days[K].events[0].wt).toBe(10);
    /* a later change (a note, a new time) keeps it */
    days = core.patchEvent(days, K, 's1', { note: 'hard day' }, 300);
    days = core.moveEvent(days, K, '2026-10-19', 's1', { time: '23:00' }, 400);
    expect(days['2026-10-19'].events[0].wm).toBe(12);
    const b = core.readBackup(JSON.stringify(core.makeBackup({ settings: null, days, reviews: {} })));
    expect(b.days['2026-10-19'].events[0].wm).toBe(12);
  });

  it('drops a wait that is not whole minutes in range, and any on an urge ridden out', () => {
    for (const bad of [-1, 2.5, 241, '10', null]) expect(core.normEvent({ id: 'x', outcome: 'slipped', wm: bad }).wm).toBeUndefined();
    expect(core.normEvent({ id: 'x', outcome: 'slipped', wm: 0 }).wm).toBe(0);
    expect(core.normEvent({ id: 'x', outcome: 'rode', wm: 10 }).wm).toBeUndefined();
    /* an entry changed from a slip to an urge ridden out loses it */
    const days = core.patchEvent(core.patchEvent(slip(), K, 's1', core.rkWaitFields(9), 200), K, 's1', { outcome: 'rode' }, 300);
    expect(days[K].events[0].wm).toBeUndefined();
  });

  it('waiting five minutes or more still earns the "Waited first" points', () => {
    const st = core.normSettings({ start: '2026-10-01', day1: '2026-10-01', cleanMode: 'strict' });
    const pts = (m: number) => core.gameCompute(core.patchEvent(slip(), K, 's1', core.rkWaitFields(m), 200), st, {}, K).pts;
    expect(pts(5)).toBe(pts(0) + 5);
    expect(pts(30)).toBe(pts(5));
  });

  it('says a kind word for every answer, in plain words', () => {
    const words = [true, false].flatMap((lit) => [true, false].flatMap((sp) => Object.values(core.rkHoldWords(lit, sp))));
    for (const w of words) {
      expect(w).not.toMatch(noContractions);
      expect(w).not.toMatch(/fail|relapse|reset|ruin|blew/i);
    }
  });

  it('the hold screen says the slip can be recovered from, once it is held', () => {
    expect(core.rkHoldWords(false, false).h).toBe('Your fire did not go out.');
    expect(core.rkHoldWords(false, true).h).toBe('You stopped partway. Your fire is still lit.');
    expect(core.rkHoldWords(true, false).h).toBe('This is a slip, and you can recover from it.');
  });
});
