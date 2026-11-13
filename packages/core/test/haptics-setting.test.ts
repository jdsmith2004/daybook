import { describe, expect, it } from 'vitest';
import * as core from '../src/index';
import { normSettingsLoaded } from '../src/settings-norm';

const base = () => core.normSettings({ start: '2026-09-20', day1: '2026-09-27', u: 5 });

describe('the haptics switch', () => {
  it('is on when left out, and off only as false', () => {
    expect(base().haptics).toBeUndefined();
    const off = core.setHaptics(base(), false);
    expect(off.haptics).toBe(false);
    expect('haptics' in core.setHaptics(off, true)).toBe(false);
  });
  it('survives loading, and anything but false loads as on', () => {
    expect(normSettingsLoaded({ ...base(), haptics: false }).haptics).toBe(false);
    expect('haptics' in normSettingsLoaded({ ...base(), haptics: 'no' })).toBe(false);
  });
});
