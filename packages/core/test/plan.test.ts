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

describe('the lists as rows', () => {
  it('adds a line at the end, tidied, and finds one already there instead of adding it twice', () => {
    const r = core.listAdd(base, 'words', '  Pray in my   own words ');
    expect(r.ok && r.st.words).toEqual(['Pray in my own words']);
    expect(r.ok && r.at).toBe(0);
    expect(r.toast).toBe('Added to your words that steady me.');
    const again = core.listAdd(r.ok ? r.st : base, 'words', 'pray in my own WORDS');
    expect(again).toEqual({ ok: false, toast: 'Already on your words that steady me.', at: 0 });
    expect(core.listAdd(base, 'menu', '   ').ok).toBe(false);
  });
  it('holds only as many as the list allows', () => {
    let st = base;
    for (let i = 0; i < core.LISTS.wind.max + 2; i++) {
      const r = core.listAdd(st, 'wind', 'Step ' + i);
      if (r.ok) st = r.st;
    }
    expect(st.wind.length).toBe(core.LISTS.wind.max);
    expect(core.listAdd(st, 'wind', 'One more').toast).toMatch(/is full/);
  });
  it('rewords, moves and removes, and calm moves never end up empty', () => {
    const st = core.listEdit(base, 'menu', 0, 'A brisk walk');
    expect(st.menu[0]).toBe('A brisk walk');
    expect(core.listEdit(st, 'menu', 0, '  ')).toBe(st);
    const moved = core.listMove(st, 'menu', 0, 1);
    expect(moved.menu[1]).toBe('A brisk walk');
    expect(core.listMove(st, 'menu', 0, -1)).toBe(st);
    let one = st;
    while (one.menu.length > 1) {
      const r = core.listRemove(one, 'menu', 0);
      if (r.ok) one = r.st;
    }
    expect(core.listRemove(one, 'menu', 0).ok).toBe(false);
    const w = core.listAdd(base, 'words', 'Be still');
    const gone = core.listRemove(w.ok ? w.st : base, 'words', 0);
    expect(gone.ok && gone.st.words).toEqual([]);
  });
});

describe('Undo for removals', () => {
  it('puts a list line back at the place it had, once', () => {
    const st = core.listEdit(core.listEdit(base, 'menu', 0, 'First'), 'menu', 1, 'Second');
    const first = st.menu[0];
    const gone = core.listRemove(st, 'menu', 0);
    if (!gone.ok) throw new Error();
    const back = core.listInsert(gone.st, 'menu', 0, first);
    expect(back.menu).toEqual(st.menu);
    expect(core.listInsert(back, 'menu', 0, first)).toBe(back);
    expect(core.listInsert(gone.st, 'menu', 99, first).menu.at(-1)).toBe(first);
  });
  it('puts an urge plan line back: a starting line in its own place, a new one at its index', () => {
    const added = core.planAdd(base, 'I am bored', 'Call a friend');
    if (!added.ok) throw new Error();
    const at = added.at;
    const gone = core.planRemove(added.st, at);
    if (!gone.ok) throw new Error();
    expect(gone.st.plan.length).toBe(at);
    expect(core.planRestore(gone.st, at, { when: 'I am bored', then: 'Call a friend' }).plan[at]).toEqual({ when: 'I am bored', then: 'Call a friend' });
    const row = base.plan[0];
    const blank = core.planRemove(base, 0);
    if (!blank.ok) throw new Error();
    expect(core.planBlank(blank.st.plan[0])).toBe(true);
    expect(core.planRestore(blank.st, 0, row).plan[0]).toEqual(row);
  });
  it('shows an answer of my own again after Remove', () => {
    const made = core.addOption(base, 'trig', 'Late night scrolling');
    const id = made.id!;
    const o = made.st.opts.trig.find((x) => x.id === id)!;
    const gone = core.removeOption(made.st, {}, 'trig', id);
    expect(gone.opts.trig.some((x) => x.id === id)).toBe(false);
    expect(core.optionRestore(gone, 'trig', o, 0).opts.trig[0].t).toBe('Late night scrolling');
    const hidden = core.changeSettings(made.st, (s) => void (s.opts.trig.find((x) => x.id === id)!.off = true));
    expect(core.optionRestore(hidden, 'trig', o, 0).opts.trig.find((x) => x.id === id)!.off).toBeUndefined();
  });
});
