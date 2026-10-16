/* My plan: reasons and the slip plan, following the legacy actions word for word. */
import { describe, expect, it } from 'vitest';
import * as core from '../src/index';

const base = core.normSettings({ v: 1, start: '2026-10-01', rollover: 4, screensOff: '23:00', reasons: ['Sleep well'], u: 1 });

describe('reasons', () => {
  it('adds one, with a guessed group, and says so', () => {
    const r = core.saveReason(base, null, '  Being   present with my kids ', null);
    expect(r.ok && r.st.reasons).toEqual(['Sleep well', 'Being present with my kids']);
    expect(r.ok && r.toast).toBe('Added.');
    expect(r.ok && r.st.rmeta.find((m) => m.t === 'Being present with my kids')?.c).toBe(core.reasonGuess('Being present with my kids').id);
  });
  it('will not keep the same reason twice, or a blank one', () => {
    expect(core.saveReason(base, null, 'sleep WELL', null)).toEqual({ ok: false, toast: 'You already have that one.' });
    expect(core.saveReason(base, 'Sleep well', '   ', null)).toEqual({ ok: false, toast: 'A reason needs some words. To remove it, use the trash button.' });
    expect(core.saveReason(base, null, ' ', null, 'lesson')).toEqual({ ok: false, toast: 'Write a few words first.' });
  });
  it('the list holds ten', () => {
    let st = base;
    for (let i = 0; i < 9; i++) {
      const r = core.saveReason(st, null, 'Reason ' + i, null);
      if (r.ok) st = r.st;
    }
    expect(st.reasons.length).toBe(10);
    expect(core.saveReason(st, null, 'One more', null).toast).toBe('The list is full. Remove one first.');
    expect(core.saveReason(st, null, 'One more', null, 'lesson').toast).toBe('The list is full (10). Edit one instead.');
  });
  it('moves and removes', () => {
    const r = core.saveReason(base, null, 'Second', null);
    if (!r.ok) throw new Error();
    const m = core.moveReason(r.st, 1, -1)!;
    expect(m.st.reasons).toEqual(['Second', 'Sleep well']);
    expect(m.toast).toBe('Now number 1 of 2.');
    expect(core.moveReason(r.st, 0, -1)).toBeNull();
    expect(core.removeReason(m.st, 0)!.st.reasons).toEqual(['Sleep well']);
  });
});

describe('the slip plan', () => {
  it('saves without blank steps, and can go back to the starter plan', () => {
    const st = core.saveSlip(base, ['Breathe', '', 'Text Sam']);
    expect(st.slipPlan).toEqual(['Breathe', 'Text Sam']);
    expect(core.slipIsStarter(st.slipPlan)).toBe(false);
    expect(core.slipIsStarter(core.resetSlip(st).st.slipPlan)).toBe(true);
  });
});
