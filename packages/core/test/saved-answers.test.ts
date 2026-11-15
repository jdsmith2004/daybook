/* Saved answers (saved-answers.ts): a written option is kept for good, offered beside the built-in ones, survives clean-up, and is
   never lost when two copies of the settings meet. */
import { describe, expect, it } from 'vitest';
import * as core from '../src/index';
import { keepEarned } from '../src/data';

const st = core.normSettings({ start: '2026-10-07', day1: '2026-10-14' });

describe('keeping a written answer', () => {
  it('keeps it once, cleaned, and offers it after the built-in ones', () => {
    let s = core.keepOwn(st, 'reason', '  My   daughter ', [], 1);
    s = core.keepOwn(s, 'reason', 'my daughter', [], 2);
    expect(core.ownOf(s, 'reason')).toEqual(['My daughter']);
    expect(core.ownChoices(s, 'reason', ['Clear mornings'])).toEqual(['Clear mornings', 'My daughter']);
    expect(core.isOwn(s, 'reason', 'MY DAUGHTER')).toBe(true);
  });
  it('does not keep words a built-in answer already has, or nothing at all', () => {
    expect(core.keepOwn(st, 'goal', 'Walk after dinner', ['walk after dinner'])).toBe(st);
    expect(core.keepOwn(st, 'goal', '   ')).toBe(st);
    expect(core.keepOwn(st, 'nope' as core.OwnKind, 'x')).toBe(st);
  });
  it('kinds are their own: a goal is not offered as a reason', () => {
    const s = core.keepOwn(st, 'goal', 'Bed by 11');
    expect(core.ownOf(s, 'reason')).toEqual([]);
    expect(core.ownOf(s, 'goal')).toEqual(['Bed by 11']);
  });
  it('an answer picked before saved answers still shows on its page', () => {
    expect(core.ownChoices(st, 'worked', ['A'], ['Old words'])).toEqual(['A', 'Old words']);
  });
  it('nothing removes one; only past OWN_KEEP does the oldest make room', () => {
    let s = st;
    for (let i = 0; i < core.OWN_KEEP + 2; i++) s = core.keepOwn(s, 'move', 'Move ' + i);
    const l = core.ownOf(s, 'move');
    expect(l.length).toBe(core.OWN_KEEP);
    expect(l[0]).toBe('Move 2');
  });
  it('is cut to OWN_MAX', () => {
    expect(core.ownOf(core.keepOwn(st, 'need', 'x'.repeat(300)), 'need')[0].length).toBe(core.OWN_MAX);
  });
});

describe('clean-up and sync', () => {
  it('normSettings keeps known kinds only, without repeats, and leaves it out when empty', () => {
    const s = core.normSettingsLoaded({ ...st, own: { reason: ['A', 'a', ' B ', 3], bogus: ['x'], goal: [] } } as never);
    expect(s.own).toEqual({ reason: ['A', 'B'] });
    expect('own' in core.normSettingsLoaded({ ...st, own: {} } as never)).toBe(false);
    expect('own' in st).toBe(false);
  });
  it('two copies are joined: an answer written on either phone is kept', () => {
    const a = core.keepOwn(st, 'reason', 'Written on the phone', [], 5);
    const b = core.keepOwn(core.keepOwn(st, 'reason', 'Written on the iPad', [], 6), 'goal', 'Bed by 11', [], 6);
    const m = keepEarned(b, a);
    expect(m.own?.reason).toEqual(['Written on the iPad', 'Written on the phone']);
    expect(m.own?.goal).toEqual(['Bed by 11']);
  });
  it('a backup restored brings its answers beside the ones here', () => {
    const here = core.keepOwn(st, 'then', 'Cold water on my face');
    const back = core.keepOwn(st, 'then', 'Call Sam');
    const r = core.restoreBackup({ settings: here, days: {}, reviews: {}, journal: {} }, { settings: back, days: {}, reviews: {}, journal: {} } as never);
    expect(core.ownOf(r.snap.settings, 'then').sort()).toEqual(['Call Sam', 'Cold water on my face']);
  });
});
