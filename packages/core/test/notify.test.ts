/* The ask on Today when notifications are off: daily until on or "Stop asking", never on the web, before setup, or near a slip. */
import { describe, expect, it } from 'vitest';
import * as core from '../src/index';
import type { NotifyEnv } from '../src/index';

const tk = '2026-10-14';
const st = core.normSettings({ ...core.defaultSettings('2026-09-01'), day1: '2026-09-02' });
const phone: NotifyEnv = { offered: true, granted: false, canAskAgain: true };
const mem0 = core.notifyMemNew();
const slip = (k: string) => core.addEvent({}, k, 'slipped', '21:30', {}, 1).days;

describe('the ask on Today', () => {
  it('shows the day after "Not now", in the allow form', () => {
    expect(core.notifyAsk(phone, mem0, {}, st, tk)).toEqual({
      k: 'allow',
      text: 'Turn on reminders. One short note a day, at your time, and never a word about what Daybook is for.',
      yes: 'Turn on',
    });
  });

  it('not on the web, not before setup, and not once notifications are on', () => {
    expect(core.notifyAsk({ ...phone, offered: false }, mem0, {}, st, tk)).toBeNull();
    expect(core.notifyAsk(phone, mem0, {}, null, tk)).toBeNull();
    expect(core.notifyAsk({ ...phone, granted: true }, mem0, {}, st, tk)).toBeNull();
  });

  it('not the day of a slip or the day after', () => {
    expect(core.notifyAsk(phone, mem0, slip(tk), st, tk)).toBeNull();
    expect(core.notifyAsk(phone, mem0, slip(core.addDays(tk, -1)), st, tk)).toBeNull();
    expect(core.notifyAsk(phone, mem0, slip(core.addDays(tk, -2)), st, tk)).not.toBeNull();
  });

  it('after the X, not until tomorrow, and it keeps coming back', () => {
    let m = core.notifyQuiet(mem0, tk);
    expect(core.notifyAsk(phone, m, {}, st, tk)).toBeNull();
    expect(core.notifyAsk(phone, m, {}, st, core.addDays(tk, 1))).not.toBeNull();
    for (let i = 1; i <= 30; i++) m = core.notifyQuiet(m, core.addDays(tk, i));
    expect(m.n).toBe(31);
    expect(core.NOTIFY_MAX_X).toBe(Infinity);
    expect(core.notifyAsk(phone, m, {}, st, core.addDays(tk, 31))).not.toBeNull();
  });

  it('the off form when the phone cannot ask again, opening its settings', () => {
    expect(core.notifyAsk({ ...phone, canAskAgain: false }, mem0, {}, st, tk)).toMatchObject({
      k: 'off',
      text: 'Notifications are off for Daybook on this phone.',
      yes: 'Open settings',
    });
  });

  it('never after "Stop asking on this phone"', () => {
    const m = core.notifyNever(mem0);
    expect(core.notifyAsk(phone, m, {}, st, tk)).toBeNull();
    expect(core.notifyAsk(phone, m, {}, st, core.addDays(tk, 40))).toBeNull();
    expect(core.notifyCanAsk(phone, m)).toBe(false);
    expect(core.notifyCanAsk(phone, mem0)).toBe(true);
  });

  it('a stored memory is read safely', () => {
    expect(core.normNotifyMem(null)).toEqual(mem0);
    expect(core.normNotifyMem({ quiet: 3, never: 'yes', n: -2 })).toEqual(mem0);
    expect(core.normNotifyMem({ quiet: tk, never: true, n: 4 })).toEqual({ quiet: tk, never: true, n: 4 });
  });

  it('the words never say what Daybook is for, and use no contractions', () => {
    const all = JSON.stringify(core.NOTIFY_WORDS);
    expect(all).not.toMatch(/porn|slip|clean|urge|addict|relapse|sober|habit|sex|streak/i);
    expect(all).not.toMatch(/n['’]t|['’](re|ll|ve|d|m)\b|\b(it|that|there|what)['’]s\b/i);
  });
});
