/* Points are never taken away (CLAUDE.md): a change that lowers them keeps the points shown until then as a floor. */
import { describe, expect, it } from 'vitest';
import { addEvent, gameCompute, keepPoints, normSettings, removeEvent } from '../src';

const st = normSettings({ start: '2026-10-01', day1: '2026-10-08', rollover: 4, screensOff: '23:00', u: 1 });
const tk = '2026-10-12';

describe('keepPoints', () => {
  it('keeps the points shown before an entry was deleted', () => {
    let days = addEvent({}, '2026-10-10', 'rode', '22:00', {}, 10).days;
    days = addEvent(days, '2026-10-11', 'rode', '21:00', {}, 20).days;
    const before = gameCompute(days, st, {}, tk).pts;
    const id = days['2026-10-11'].events[0].id;
    const after = removeEvent(days, '2026-10-11', id, 30);
    expect(gameCompute(after, st, {}, tk).pts).toBeLessThan(before);
    const kept = keepPoints(days, after, st, {}, tk)!;
    expect(kept.seen?.pts).toBe(before);
    expect(gameCompute(after, kept, {}, tk).pts).toBe(before);
    expect(normSettings(JSON.parse(JSON.stringify(kept))).seen?.pts).toBe(before);
  });

  it('does nothing when the points did not go down', () => {
    const days = addEvent({}, '2026-10-10', 'rode', '22:00', {}, 10).days;
    const more = addEvent(days, '2026-10-10', 'rode', '23:00', {}, 20).days;
    expect(keepPoints(days, more, st, {}, tk)).toBeNull();
  });
});
