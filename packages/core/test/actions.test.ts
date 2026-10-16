import { describe, expect, it } from 'vitest';
import * as core from '../src/index';

const tk = '2026-10-15';
const base = () => core.normSettings({ start: '2026-09-20', day1: '2026-09-27', u: 5 });

describe('settings changes', () => {
  it('always moves the change time forward', () => {
    expect(core.nextU({ u: 10 }, 3)).toBe(11);
    expect(core.nextU({ u: 10 }, 50)).toBe(50);
    expect(core.nextU(null, 7)).toBe(7);
  });

  it('switching to step down starts the plan today and clears any hold', () => {
    const c = core.setCountMode({ ...base(), cleanHold: '2026-10-01' }, 'step', tk);
    expect(c.st.cleanMode).toBe('step');
    expect(c.st.stepAt).toBe(tk);
    expect(c.st.cleanHold).toBe(null);
    expect(c.toast).toBe(core.COUNT_TOAST.step);
  });

  it('switching away from step down holds for two weeks, and keeps the day it started', () => {
    const on = core.setCountMode(base(), 'step', '2026-10-01').st;
    const off = core.setCountMode(on, 'gentle', tk).st;
    expect(off.cleanMode).toBe('gentle');
    expect(off.stepAt).toBe('2026-10-01');
    expect(off.cleanHold).toBe(tk);
    expect(core.setCountMode(on, 'nonsense', tk).st.cleanMode).toBe('strict');
  });

  it('finishing step down counts days strictly from today', () => {
    const g = core.stepGrad(core.stepOn(base(), '2026-10-01').st, tk).st;
    expect([g.cleanMode, g.stepGrad, g.cleanHold, g.cleanNote]).toEqual(['strict', tk, tk, null]);
  });

  it('the automatic switch leaves a note, and "Keep counting days" undoes it', () => {
    const a = core.autoStep(base(), tk).st;
    expect([a.cleanMode, a.stepAt, a.cleanNote]).toEqual(['step', tk, { on: tk, m: 'step' }]);
    const k = core.cleanKeep(a, tk).st;
    expect([k.cleanMode, k.cleanNote, k.cleanHold]).toEqual(['strict', null, tk]);
    expect(core.cleanOk(a).st.cleanNote).toBe(null);
  });

  it('turning down the offer waits two weeks', () => {
    const n = core.stepNo(base(), tk).st;
    expect(n.stepNo).toBe(tk);
    const days = {} as core.Days;
    ['2026-10-10', '2026-10-12', '2026-10-14'].forEach((k) => {
      days[k] = core.normDay({ events: [{ id: k, time: '23:00', outcome: 'slipped' }] }, k);
    });
    expect(core.stepOffer(days, base(), tk)).toBe(true);
    expect(core.stepOffer(days, n, tk)).toBe(false);
    expect(core.stepOffer(days, { ...n, stepNo: '2026-10-01' }, tk)).toBe(true); // two weeks later, it can show again
  });
});
