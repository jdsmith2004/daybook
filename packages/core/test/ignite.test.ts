/* Lighting the night (ignite.ts): the row of nights, the run of free nights told, the words the flame says, the small goals. */
import { describe, expect, it } from 'vitest';
import * as core from '../src/index';
import type { Days } from '../src/types';

const st = core.normSettings({ start: '2026-10-01', day1: '2026-10-01', reasons: ['My kids'] });
const at = (d: number, h: number) => new Date(2026, 9, d, h).getTime();
/** each morning from d0 to d1 tells last night as free */
function told(from: number, to: number, days: Days = {}): Days {
  let out = days;
  for (let d = from; d <= to; d++) out = core.answerNight(out, st, '2026-10-' + String(d).padStart(2, '0'), 'free', at(d, 7));
  return out;
}

describe('the row of nights', () => {
  it('shows the seven nights before today, oldest first, with their names', () => {
    const row = core.igniteRow(told(10, 21), st, '2026-10-21');
    expect(row.map((r) => r.k)).toEqual(['2026-10-14', '2026-10-15', '2026-10-16', '2026-10-17', '2026-10-18', '2026-10-19', '2026-10-20']);
    expect(row[6].d).toBe('Tu');
    expect(row.every((r) => r.m === 'free')).toBe(true);
  });
  it('marks a slip, a night not told, and nights before the log', () => {
    let days = told(16, 21);
    days = core.addEvent(days, '2026-10-18', 'slipped', null, {}, at(18, 23)).days;
    /* the 15th was never told, after the first morning on the 16th? no: the 16th tells the 15th, so the 14th is before any morning */
    days = core.skipMorning(days, '2026-10-22', at(22, 7));
    const row = core.igniteRow(days, st, '2026-10-23');
    const m = Object.fromEntries(row.map((r) => [r.k, r.m]));
    expect(m['2026-10-16']).toBe('free');
    expect(m['2026-10-18']).toBe('slip');
    expect(m['2026-10-21']).toBe('untold');
    expect(m['2026-10-22']).toBe('untold');
    const early = core.igniteRow({}, core.normSettings({ ...st, start: '2026-10-20' }), '2026-10-22');
    expect(early[0].m).toBe('none');
  });
  it('counts nights with no slip from before the first morning as free, as they always were', () => {
    const days = told(20, 21);
    expect(core.freeRun(days, st, '2026-10-21')).toBe(20);
  });
});

describe('what the flame says', () => {
  it('starts, keeps a goal, and names a whole week', () => {
    const fresh = core.normSettings({ ...st, start: '2026-10-20', day1: '2026-10-20' });
    expect(core.igniteLine(core.answerNight({}, fresh, '2026-10-21', 'free', at(21, 7)), fresh, '2026-10-21')).toMatch(/where it starts/);
    const three = core.normSettings({ ...st, start: '2026-10-18' });
    expect(core.igniteLine(told(19, 21, {}), three, '2026-10-21')).toMatch(/goal/);
    const week = core.normSettings({ ...st, start: '2026-10-14' });
    expect(core.igniteLine(told(15, 21, {}), week, '2026-10-21')).toMatch(/whole week/);
  });
  it('after a slip, speaks to the comeback and who the person is, never the number', () => {
    let days = told(16, 21);
    days = core.addEvent(days, '2026-10-19', 'slipped', null, {}, at(19, 23)).days;
    const line = core.igniteLine(days, st, '2026-10-21');
    expect(line).toMatch(/Back to free/);
    expect(line).not.toMatch(/\d/);
  });
  it('uses no contractions and never shames', () => {
    for (let n = 1; n <= 30; n++) {
      const s = core.normSettings({ ...st, start: core.addDays('2026-10-21', -n) });
      const line = core.igniteLine(told(22 - n, 21, {}), s, '2026-10-21');
      expect(line).not.toMatch(/'|\b(failed|lost|ruined|addict|clean)\b/i);
    }
  });
});

describe('small goals', () => {
  it('3, then 7, then each week: no big goal before a clean week', () => {
    expect(core.igniteGoal(0)).toBe(3);
    expect(core.igniteGoal(2)).toBe(3);
    expect(core.igniteGoal(3)).toBe(7);
    expect(core.igniteGoal(6)).toBe(7);
    expect(core.igniteGoal(7)).toBe(14);
    expect(core.igniteGoal(15)).toBe(21);
  });
});
