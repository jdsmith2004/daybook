import { describe, expect, it } from 'vitest';

import * as core from '../src';

describe('the time given back, on Today', () => {
  /* f3 x m1: about 2.6 hours a week, about 0.37 hours a day */
  const st = { ...core.normSettings({ start: '2026-10-01', day1: '2026-10-01', u: 1 }), onb: { n: 1, at: 1, a: { freq: 'f3', mins: 'm1' }, hist: [] } };
  let days = {};
  for (let i = 0; i < 40; i++) days = core.addEvent(days, core.addDays('2026-10-01', i), 'rode', '21:00').days;

  it('waits until there are a few hours to show, and needs the setup answers', () => {
    expect(core.timeBack(days, st, '2026-10-05')).toBeNull();
    expect(core.timeBack(days, { ...st, onb: null }, '2026-11-09')).toBeNull();
    const t = core.timeBack(days, st, '2026-11-09')!;
    expect(t.h).toBe(core.hoursBack(days, st, '2026-11-09'));
    expect(t.h).toBeGreaterThanOrEqual(core.TIME_BACK_MIN);
    expect(t.unit).toBe('hours');
    expect(t.say).toMatch(/^About \d+ hours given back to your life so far, at the pace you told the setup\.$/);
  });

  it('is quiet the day of a slip and the day after, then shows again with nothing taken away', () => {
    const before = core.timeBack(days, st, '2026-11-07')!;
    const slipped = core.addEvent(days, '2026-11-07', 'slipped', '23:00').days;
    expect(core.timeBack(slipped, st, '2026-11-07')).toBeNull();
    expect(core.timeBack(slipped, st, '2026-11-08')).toBeNull();
    const after = core.timeBack(slipped, st, '2026-11-09')!;
    expect(after.h).toBeGreaterThanOrEqual(before.h);
  });

  it('says hours, then days', () => {
    expect(core.timeBackWords(1)).toEqual({ n: '1', unit: 'hour' });
    expect(core.timeBackWords(47)).toEqual({ n: '47', unit: 'hours' });
    expect(core.timeBackWords(48)).toEqual({ n: '2', unit: 'days' });
    expect(core.timeBackWords(60)).toEqual({ n: '2½', unit: 'days' });
    expect(core.timeBackWords(250)).toEqual({ n: '10', unit: 'days' });
    expect(core.timeBackWords(24 * 1500)).toEqual({ n: '1,500', unit: 'days' });
  });
});
