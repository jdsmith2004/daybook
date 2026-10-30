/* Counting that switches by itself, both ways (docs/plan.md, A4): setup picks step down or counting days from how often the
   person said it happens, and after that the log moves them, with a two-week hold after any switch. */
import { describe, expect, it } from 'vitest';
import * as core from '../src/index';
import type { Days, Settings } from '../src/types';

const tk = '2026-10-15';
const now = new Date(tk + 'T12:00:00').getTime();
const slip = (k: string) => core.normDay({ events: [{ id: 's' + k, time: '23:00', outcome: 'slipped' }] }, k);
const log = (keys: string[]): Days => Object.fromEntries(keys.map((k) => [k, slip(k)]));
/** in step down since October 1, with two slips at the start and none for nearly two weeks: ready to count days */
const stepping = (o: Partial<Settings> = {}): Settings =>
  ({ ...core.normSettings({ start: '2026-09-20', day1: '2026-09-27', u: 5, cleanMode: 'step', stepAt: '2026-10-01' }), ...o }) as Settings;
const longStretch = log(['2026-10-01', '2026-10-02']);

describe('setup picks how days count from how often', () => {
  it('about once a day or more starts in step down, from Day 1', () => {
    for (const freq of ['f3', 'f4']) {
      expect(core.obMode({ freq })).toBe('step');
      for (const goal of ['week', 'now', 'nights']) {
        const st = core.obSave({ freq, goal }, null, null, tk, 0).st;
        expect([st.cleanMode, st.stepAt, st.cleanHold, st.cleanNote]).toEqual(['step', st.day1, null, null]);
      }
    }
  });

  it('anything less, or no answer, starts gentle; setup never sets strict', () => {
    for (const freq of ['f0', 'f1', 'f2', undefined]) {
      expect(core.obMode({ freq })).toBe('gentle');
      for (const aim of ['quit', 'less', 'nights', 'learn', undefined]) {
        const st = core.obSave({ freq, aim }, null, null, tk, 0).st;
        expect([st.cleanMode, st.stepAt]).toEqual(['gentle', null]);
      }
    }
  });

  it('no longer offers "Step down first" or "Cut way back first", and never suggests them', () => {
    const before = core.normSettings({ start: '2026-10-12', day1: '2026-10-19', u: 1 });
    const counting = core.normSettings({ start: '2026-09-01', day1: '2026-09-08', u: 1 });
    for (const st of [null, before, counting]) expect(core.obGoals(st, tk).some((g) => g.id === 'step' || g.id === 'less')).toBe(false);
    for (const aim of ['quit', 'less', 'nights', 'learn', undefined])
      for (const freq of ['f0', 'f2', 'f3', 'f4'])
        for (const years of ['y0', 'y3'])
          for (const tried of ['t0', 't2']) expect(['week', 'now', 'nights']).toContain(core.obSuggest({ aim, freq, years, tried }));
    /* an old answer of "step" or "less" falls back to the suggestion */
    expect(core.obGoal({ goal: 'step', aim: 'quit' }, null, tk).id).toBe('now');
    expect(core.obGoal({ goal: 'less' }, null, tk).id).toBe('week');
  });

  it('the goal page says how days count, and why step down when it starts there', () => {
    const gi = core.obGoalInfo({ freq: 'f4', goal: 'nights' }, null, tk);
    expect(gi.soft).toContain('Longer stretches between slips, fewer slips each week.');
    expect(gi.more.paras.join(' ')).toContain('Why nights first?');
    expect(gi.more.paras.join(' ')).toContain('Daybook moves you to counting days by itself.');
    expect(gi.more.keys).toEqual(['gujar', 'lindson']);
    /* "Quit, starting tomorrow" explains a clear line, so in step down the step-down why takes its place */
    expect(core.obGoalInfo({ freq: 'f3', aim: 'quit' }, null, tk).more.keys).toEqual(['lindson']);
    expect(core.obGoalInfo({ freq: 'f2', aim: 'quit' }, null, tk).soft).toContain('A slip takes one day off, never all of them.');
  });

  it('a walk-through never changes the counting the person has, whatever they say now', () => {
    const picked = (cleanMode: string) =>
      core.normSettings({
        start: '2026-09-01',
        day1: '2026-09-08',
        u: 1,
        cleanMode,
        cleanHold: '2026-10-01',
        onb: { n: 1, at: 1, a: { freq: 'f1' }, hist: [] },
      });
    for (const mode of ['strict', 'gentle', 'step'])
      for (const freq of ['f0', 'f4']) {
        const st = picked(mode);
        const all = core.obChanges({ freq, aim: 'quit' }, st, tk).map((c) => c.k);
        const out = core.obSave({ freq, aim: 'quit' }, st, all, tk, 0).st;
        expect([out.cleanMode, out.cleanHold, out.stepAt]).toEqual([st.cleanMode, st.cleanHold, st.stepAt]);
        expect(core.obGoalInfo({ freq, aim: 'quit' }, st, tk).soft).toContain(core.obCount(st.cleanMode));
      }
    /* before counting starts too: someone set up with step down who picked Strict in Settings keeps Strict */
    const set = core.obSave({ freq: 'f4', aim: 'quit' }, null, null, tk, 0).st;
    const strict = core.setCountMode(set, 'strict', tk).st;
    const again = core.obSave(
      { freq: 'f4', aim: 'quit' },
      strict,
      core.obChanges({ freq: 'f4', aim: 'quit' }, strict, tk).map((c) => c.k),
      tk,
      0,
    ).st;
    expect(again.cleanMode).toBe('strict');
  });
});

describe('step down moves to counting days by itself', () => {
  it('when the stretches get long, it switches the way "Start counting days" does, with a note', () => {
    const st = stepping();
    expect(core.stepView(longStretch, st, now).ready).toBe(true);
    expect(core.shouldAutoCount(longStretch, st, tk, now)).toBe(true);
    const a = core.autoCount(st, tk).st;
    expect([a.cleanMode, a.stepGrad, a.cleanHold, a.cleanNote]).toEqual(['gentle', tk, tk, { on: tk, m: 'count' }]);
    expect(a.stepAt).toBe('2026-10-01');
    /* the Stepped up badge reads stepGrad, so it is earned the same as by the button */
    expect(core.gameCompute(longStretch, a, {}, tk).S.grad).toBe(1);
    expect(core.gameCompute(longStretch, core.stepGrad(st, tk).st, {}, tk).S.grad).toBe(1);
    /* Okay clears the note, and nothing else */
    const ok = core.cleanOk(a).st;
    expect([ok.cleanNote, ok.cleanMode, ok.stepGrad]).toEqual([null, 'gentle', tk]);
  });

  it('not before it is ready, not inside the two-week hold, not before Day 1, and not when switching is left to the person', () => {
    const daily = log(Array.from({ length: 14 }, (_, i) => core.addDays('2026-10-01', i)));
    expect(core.stepView(daily, stepping(), now).ready).toBe(false);
    expect(core.shouldAutoCount(daily, stepping(), tk, now)).toBe(false);
    expect(core.shouldAutoCount(longStretch, stepping({ cleanHold: '2026-10-02' }), tk, now)).toBe(false);
    expect(core.shouldAutoCount(longStretch, stepping({ cleanHold: '2026-10-01' }), tk, now)).toBe(true);
    expect(core.shouldAutoCount(longStretch, stepping({ cleanAuto: false }), tk, now)).toBe(false);
    expect(core.shouldAutoCount(longStretch, stepping({ day1: '2026-10-20' }), tk, now)).toBe(false);
    expect(core.shouldAutoCount(longStretch, stepping({ day1: null }), tk, now)).toBe(false);
    for (const cleanMode of ['strict', 'gentle'] as const) expect(core.shouldAutoCount(longStretch, stepping({ cleanMode }), tk, now)).toBe(false);
  });

  it('never flips back and forth: each switch by itself holds for two weeks', () => {
    /* a rough week moves counting days to step down, and the hold keeps it there even once a stretch is long */
    const rough = log(['2026-10-09', '2026-10-10', '2026-10-11', '2026-10-12', '2026-10-13', '2026-10-14']);
    const counting = core.normSettings({ start: '2026-09-20', day1: '2026-09-27', u: 5 });
    expect(core.shouldAutoStep(rough, counting, tk)).toBe(true);
    const down = core.autoStep(counting, tk).st;
    expect(down.cleanHold).toBe(tk);
    const later = core.addDays(tk, 13);
    const laterMs = new Date(later + 'T12:00:00').getTime();
    expect(core.stepView(rough, down, laterMs).ready).toBe(true);
    expect(core.shouldAutoCount(rough, down, later, laterMs)).toBe(false);
    const after = core.addDays(tk, 14);
    expect(core.shouldAutoCount(rough, down, after, new Date(after + 'T12:00:00').getTime())).toBe(true);
    /* and back in counting days, a rough week does not move it straight back */
    const up = core.autoCount(stepping(), tk).st;
    expect(core.shouldAutoStep(rough, up, tk)).toBe(false);
    expect(core.shouldAutoStep(rough, up, core.addDays(tk, 13))).toBe(false);
  });

  it('the note survives saving, loading and a backup', () => {
    const a = core.autoCount(stepping(), tk).st;
    expect(core.normSettings(JSON.parse(JSON.stringify(a))).cleanNote).toEqual({ on: tk, m: 'count' });
    expect(core.normSettings({ ...a, cleanNote: { on: tk, m: 'step' } }).cleanNote).toEqual({ on: tk, m: 'step' });
    expect(core.normSettings({ ...a, cleanNote: { on: tk, m: 'other' } }).cleanNote).toEqual({ on: tk, m: 'gentle' });
  });
});
