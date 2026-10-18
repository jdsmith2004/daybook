/* Put it to work: every lesson has a practice step, its ready-made lines fit where they go, one tap adds a line and Undo
   takes it back off, and the urge plan holds lines a person adds. */
import { describe, expect, it } from 'vitest';
import * as core from '../src/index';
import type { PItem } from '../src/practice';

const CONTRACTION = /\b\w+n[’']t\b|\b(I|you|we|they|it|that|what|there|here|let)[’'](m|re|ve|ll|d|s)\b/i;
const st0 = () => core.normSettings(core.defaultSettings('2026-10-01'));

describe.each(core.LESSONS.map((L) => [L.id, L] as const))('%s', (_id, L) => {
  const P = core.lessonPractice(L)!;
  it('has a practice step with something to do', () => {
    expect(P).toBeTruthy();
    expect(P.h && P.p && P.ok).toBeTruthy();
    expect((P.items || []).length + (P.write || []).length + (P.go || []).length).toBeGreaterThan(0);
  });
  it('every line fits where it goes, and has no contractions', () => {
    [P.h, P.p, P.ok, ...(P.write || []), ...(P.go || []).map((g) => g.t)].forEach((w) => expect(w).not.toMatch(CONTRACTION));
    (P.items || []).forEach((it) => {
      expect(it.text).not.toMatch(CONTRACTION);
      expect(it.text.length).toBeLessThanOrEqual(core.itemLen(it));
      if (it.k === 'plan') {
        expect(it.when!.length).toBeLessThanOrEqual(core.ITEM_WHEN_LEN);
        expect(it.when).not.toMatch(/^if\b/i);
      }
      if (it.k === 'copy') expect(it.label).toBeTruthy();
    });
    (P.write || []).forEach((w) => expect(w.length).toBeLessThanOrEqual(core.LNOTE_LEN));
  });
  it('uses only icons that exist', () => {
    (P.go || []).forEach((g) => expect(Object.keys(core.ICO)).toContain(g.ic));
  });
});

describe('one tap adds a line, and Undo takes it back off', () => {
  const kinds: PItem[] = [
    { k: 'plan', when: 'I am struggling', text: 'Say a short prayer, then do one thing on my plan.' },
    { k: 'reason', text: 'I want my nights back.' },
    { k: 'menu', text: 'Twenty push-ups against the counter' },
    { k: 'wind', text: 'Lights low an hour before bed' },
    { k: 'words', text: 'This is wanting, not need.' },
    { k: 'slip', text: 'Say "I did," not "I am."' },
    { k: 'be', text: 'I am someone who keeps my word.' },
    { k: 'note', text: 'Future me says keep going.' },
  ];
  it.each(kinds.map((x) => [x.k, x] as const))('%s', (_k, it) => {
    const st = core.changeSettings(st0(), (s) => {
      s.becoming = 'I am becoming free.';
      s.note = 'It passes.';
    });
    expect(core.itemHas(st, it)).toBe(false);
    const r = core.itemAdd(st, it);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(core.itemHas(r.st, it)).toBe(true);
    const again = core.itemAdd(r.st, it);
    expect(again.ok).toBe(false);
    const back = core.itemUndo(r.st, it, r.was);
    expect(core.itemHas(back, it)).toBe(false);
    if (it.k === 'be') expect(back.becoming).toBe('I am becoming free.');
    if (it.k === 'note') expect(back.note).toBe('It passes.');
    const strip = (s: core.Settings) => JSON.stringify({ ...s, u: 0, rmeta: [] });
    expect(strip(back)).toBe(strip(st));
  });
  it('the changed words are what get added', () => {
    const r = core.itemAdd(st0(), { k: 'plan', when: 'If it is late', text: 'then I will go to bed' });
    expect(r.ok && r.st.plan[r.st.plan.length - 1]).toEqual({ when: 'it is late', then: 'go to bed' });
  });
  it('a copy line is not added anywhere', () => {
    expect(core.itemAdd(st0(), { k: 'copy', label: 'x', text: 'Hi' }).ok).toBe(false);
  });
  it('the button says where the line goes', () => {
    expect(core.itemButton({ k: 'plan', when: 'a', text: 'b' })).toBe('Add to my urge plan');
    expect(core.itemButton({ k: 'be', text: 'b' })).toBe('Make it my sentence');
    expect(core.itemDone({ k: 'menu', text: 'b' })).toBe('On your calm moves');
  });
});

describe('the urge plan holds lines a person adds', () => {
  it('a new line goes after the starting ones, and stays after loading', () => {
    const r = core.planAdd(st0(), 'I am struggling', 'Pray, then move.');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.st.plan).toHaveLength(6);
    expect(core.normSettings(JSON.parse(JSON.stringify(r.st))).plan).toHaveLength(6);
    expect(core.planRows(r.st).map((x) => x.when)).toContain('I am struggling');
  });
  it('the same line is found, not added twice, and the plan has room for 12', () => {
    let st = st0();
    for (let i = 0; i < 7; i++) {
      const r = core.planAdd(st, 'time ' + i, 'move ' + i);
      expect(r.ok).toBe(true);
      if (r.ok) st = r.st;
    }
    expect(st.plan).toHaveLength(core.PLAN_MAX);
    expect(core.planAdd(st, 'time 1', 'move 1')).toMatchObject({ ok: false, at: 6 });
    expect(core.planAdd(st, 'one more', 'move')).toMatchObject({ ok: false });
    expect(core.normSettings(JSON.parse(JSON.stringify({ ...st, plan: st.plan.concat({ when: 'x', then: 'y' }) }))).plan).toHaveLength(5);
  });
  it('a starting line taken off keeps its place, blank, so setup still finds the others', () => {
    const r = core.planRemove(st0(), 1);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.st.plan).toHaveLength(5);
    expect(core.planBlank(r.st.plan[1])).toBe(true);
    expect(r.st.plan[2].when).toBe('I am bored or idle');
    expect(core.planRows(r.st)).toHaveLength(3);
  });
  it('a line changed keeps the old words for an empty half', () => {
    const st = core.planEdit(st0(), 0, 'it is late', '');
    expect(st.plan[0].when).toBe('it is late');
    expect(st.plan[0].then).toBe(st0().plan[0].then);
  });
});
