/* Pattern > Weeks counts the same Monday-to-Sunday weeks as the Sunday review, with the same parts the old week view had. */
import { describe, expect, it } from 'vitest';
import { sunView } from '../src/journal';
import { normSettings } from '../src/legacy/core.js';
import { addEvent } from '../src/mutate';
import type { Days } from '../src/types';

const st = normSettings({ start: '2026-10-01' });
const SUN = '2026-10-18';
const log = (es: [string, 'rode' | 'slipped', string][], d: Days = {}) => es.reduce((x, [k, o, t]) => addEvent(x, k, o, t, {}, 1).days, d);

describe('sunView', () => {
  it('counts Monday to Sunday, and nothing after today', () => {
    const d = log([
      ['2026-10-11', 'slipped', '22:00'],
      ['2026-10-12', 'rode', '21:00'],
      ['2026-10-14', 'slipped', '23:00'],
      ['2026-10-14', 'rode', '20:00'],
      ['2026-10-17', 'rode', '20:00'],
    ]);
    const v = sunView(d, st, '2026-10-16', SUN);
    expect(v.keys[0]).toBe('2026-10-12');
    expect(v.keys[6]).toBe(SUN);
    expect(v.w).toMatchObject({ events: 3, rode: 2, slipped: 1, slipDays: 1 });
    expect(v.range).toBe('Oct 12 to 18');
    expect(v.shows[0][0]).toBe('Most common trigger');
  });
});
