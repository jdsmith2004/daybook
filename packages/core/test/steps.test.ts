/* The twelve steps and their deeds (steps.ts; the owner, November 2, 2026): each step ends in one thing done in real life,
   "I did it" or "Not yet". Nothing waits on the answer. The next step asks once more, never after a slip and never a third
   time. "I did it" is kept for good, survives sync, and gives its points, so points only ever add. */
import { describe, expect, it } from 'vitest';
import * as core from '../src/index';
import type { Days, Settings } from '../src/types';

const tk = '2026-11-10';
const st0 = (faith?: string): Settings =>
  core.normSettings({ ...core.defaultSettings('2026-11-01'), day1: '2026-11-02', onb: { n: 1, at: 1, a: faith ? { faith } : {}, hist: [] } });
const L = (id: string) => core.lessonById(id)!;
/** each lesson id finished on its own day, in turn */
function rec(ids: string[], from = '2026-11-02'): Days {
  const days: Days = {};
  ids.forEach((id, i) => {
    const k = core.addDays(from, i);
    days[k] = core.normDay({ p: { ls: [id] } }, k);
  });
  return days;
}
const step1 = core.PATH_STEPS[0].ids;

describe('the steps', () => {
  it('every lesson named on a step exists, and every step has a deed and the words to ask about it', () => {
    core.PATH_STEPS.forEach((s) => {
      expect(s.ids.length).toBeGreaterThan(0);
      s.ids.forEach((id) => expect(core.lessonById(id)).toBeTruthy());
      expect(s.deed.length).toBeGreaterThan(20);
      expect(s.back).not.toMatch(/[.?]$/);
      expect(core.SECTION_ART[core.PATH_STEPS.indexOf(s)]).toBe(s.art);
      expect(core.sectionArtXml(core.PATH_STEPS.indexOf(s))).toMatch(/^<svg/);
    });
    expect(core.PATH_STEPS.length).toBe(12);
  });
  it('the deed comes after the last lesson of its step on this person’s path', () => {
    expect(core.deedAfter(L('l22'), st0())).toBe(0);
    expect(core.deedAfter(L('l1'), st0())).toBe(-1);
    /* step 3 ends in the filter lesson now (l56, WP11); l4 is no longer its last */
    expect(core.deedAfter(L('l4'), st0())).toBe(-1);
    expect(core.deedAfter(L('l56'), st0())).toBe(2);
    /* someone who said No to faith: the step's last lesson that is on their path */
    expect(core.deedAfter(L('l12'), st0('no'))).toBe(6);
    expect(core.deedAfter(L('l26'), st0())).toBe(-1);
  });
  it('a deed that names God says something else to someone who said No to faith', () => {
    expect(core.deedWords(1, st0())).toMatch(/God/);
    expect(core.deedWords(1, st0('no'))).not.toMatch(/God/);
    expect(core.deedWords(0, st0('no'))).toBe(core.PATH_STEPS[0].deed);
  });
});

describe('a deed', () => {
  it('"I did it" is kept with its day and gives its points, once', () => {
    const days = rec(step1);
    const st = st0();
    const before = core.gameCompute(days, st, {}, tk);
    const st1 = core.deedSet(st, 0, 'did', tk, 5);
    expect(core.deedDone(st1, 0)).toBe(true);
    expect(st1.learn.did).toEqual({ s1: tk });
    const after = core.gameCompute(days, st1, {}, tk);
    expect(after.rawPts - before.rawPts).toBe(core.DEED_PTS);
    /* doing it again changes nothing, and "Not yet" never undoes it */
    expect(core.deedSet(st1, 0, 'did', core.addDays(tk, 1), 6)).toBe(st1);
    expect(core.deedSet(st1, 0, 'later', tk, 6)).toBe(st1);
  });
  it('"Not yet" gives nothing and takes nothing', () => {
    const days = rec(step1);
    const st = st0();
    const st1 = core.deedSet(st, 0, 'later', tk, 5);
    expect(core.deedDone(st1, 0)).toBe(false);
    expect(st1.learn.later).toEqual({ s1: tk });
    expect(core.gameCompute(days, st1, {}, tk).rawPts).toBe(core.gameCompute(days, st, {}, tk).rawPts);
  });
  it('survives saving and loading; an empty record is left out, so older saves stay the same', () => {
    let st = core.deedSet(st0(), 0, 'did', tk, 5);
    st = core.deedSet(st, 2, 'later', tk, 6);
    st = core.deedAnswer(st, 2, false, tk, 7);
    const again = core.normSettings(JSON.parse(JSON.stringify(st)));
    expect(again.learn.did).toEqual({ s1: tk });
    expect(again.learn.later).toEqual({ s3: tk });
    expect(again.learn.asked).toEqual({ s3: 1 });
    const plain = core.normSettings(JSON.parse(JSON.stringify(st0())));
    expect('did' in plain.learn || 'later' in plain.learn || 'asked' in plain.learn).toBe(false);
    /* junk is dropped: an unknown step, a day that is not a day */
    const junk = core.normSettings({
      ...st0(),
      learn: { ...st0().learn, did: { s1: 'yesterday', s99: tk, s2: tk }, asked: { nope: 1 } },
    } as unknown as Settings);
    expect(junk.learn.did).toEqual({ s2: tk });
    expect('asked' in junk.learn).toBe(false);
  });
  it('sync keeps a deed done on either side, on its earlier day, and a step asked on either side is not asked again', () => {
    const a = core.deedSet(st0(), 0, 'did', '2026-11-08', 5);
    let b = core.deedSet(st0(), 0, 'did', '2026-11-09', 5);
    b = core.deedSet(b, 3, 'did', '2026-11-09', 6);
    b = core.deedAnswer(b, 5, false, '2026-11-09', 7);
    const m = core.keepEarned(b, a);
    expect(m.learn.did).toEqual({ s1: '2026-11-08', s4: '2026-11-09' });
    expect(m.learn.asked).toEqual({ s6: 1 });
    expect(core.keepEarned(a, b).learn.did).toEqual({ s1: '2026-11-08', s4: '2026-11-09' });
  });
});

describe('asking once more', () => {
  const s2first = L(core.PATH_STEPS[1].ids[0]);
  it('the first lesson of the next step asks about the step before, when its deed was not done', () => {
    const days = rec(step1);
    expect(core.deedAskBack(s2first, days, st0(), tk)).toBe(0);
    expect(core.deedAskBack(s2first, days, core.deedSet(st0(), 0, 'later', tk), tk)).toBe(0);
    /* not on any other lesson, and not before the step was walked to its end */
    expect(core.deedAskBack(L(core.PATH_STEPS[1].ids[1]), days, st0(), tk)).toBe(-1);
    expect(core.deedAskBack(s2first, rec(step1.slice(0, 3)), st0(), tk)).toBe(-1);
  });
  it('never when it was done, never twice, and never once the lesson was read', () => {
    const days = rec(step1);
    expect(core.deedAskBack(s2first, days, core.deedSet(st0(), 0, 'did', tk), tk)).toBe(-1);
    const no = core.deedAnswer(st0(), 0, false, tk);
    expect(core.deedAskBack(s2first, days, no, tk)).toBe(-1);
    expect(core.deedDone(no, 0)).toBe(false);
    expect(core.deedAskBack(s2first, rec([...step1, s2first.id]), st0(), tk)).toBe(-1);
  });
  it('"I did it" when asked again records it, with its points', () => {
    const days = rec(step1);
    const st = core.deedAnswer(st0(), 0, true, tk);
    expect(core.deedDone(st, 0)).toBe(true);
    expect(st.learn.asked).toEqual({ s1: 1 });
    expect(core.gameCompute(days, st, {}, tk).rawPts - core.gameCompute(days, st0(), {}, tk).rawPts).toBe(core.DEED_PTS);
  });
  it('never on the day of a slip or the day after', () => {
    const days = rec(step1);
    const slip = (k: string): Days => ({
      ...days,
      [k]: core.normDay({ events: [{ id: 'x', time: '23:00', outcome: 'slipped', trigger: null }] }, k),
    });
    expect(core.deedAskBack(s2first, slip(tk), st0(), tk)).toBe(-1);
    expect(core.deedAskBack(s2first, slip(core.addDays(tk, -1)), st0(), tk)).toBe(-1);
    expect(core.deedAskBack(s2first, slip(core.addDays(tk, -2)), st0(), tk)).toBe(0);
  });
});
