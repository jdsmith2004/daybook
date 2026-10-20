import { expect, it } from 'vitest';
import * as core from '../src/index';

const st = { ...core.normSettings({ start: '2026-10-01', day1: '2026-10-08', u: 1 }), becoming: 'I am becoming someone who is free of this.' };

it('the first week is offered from day 8, for a week, until it is opened', () => {
  expect(core.firstWeekDue(st, '2026-10-07')).toBe(false);
  expect(core.firstWeekDue(st, '2026-10-08')).toBe(true);
  expect(core.firstWeekDue(st, '2026-10-15')).toBe(false);
  expect(core.firstWeekDue(core.firstWeekSeen(st, '2026-10-08', 5), '2026-10-09')).toBe(false);
});

it('says what was done, never what was missed, and no big goals', () => {
  let days = core.addEvent({}, '2026-10-02', 'rode', '22:00').days;
  days = core.addEvent(days, '2026-10-03', 'slipped', '23:00').days;
  const w = core.firstWeek(days, st, '2026-10-08');
  expect(w.facts.map((f) => f.n + ' ' + (f.n === 1 ? f.one : f.many))).toEqual(['2 days logged', '1 urge ridden out', '1 slip logged honestly']);
  expect(w.be).toBe(st.becoming);
  const all = [w.h, w.line, w.next].join(' ');
  expect(all).not.toMatch(/90|graduat|n't|'re|failed|lost|reset/i);
  expect(core.firstWeek({}, st, '2026-10-08').facts).toEqual([]);
});
