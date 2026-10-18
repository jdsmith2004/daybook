/* The step-down card on Today, as pictures: the stretch on a ruler against your usual and your best, the plan's week day by
   day, and the hard hours in a few words. */
import { describe, expect, it } from 'vitest';
import { normSettings, stepView, type StepView } from '../src/legacy/core.js';
import { addEvent } from '../src/mutate';
import { stepCard, stepRuler, stepWeek } from '../src/view';
import type { Days } from '../src/types';

const V = (o: Partial<StepView>): StepView => ({
  tk: '2026-10-18',
  curH: 23,
  best: 65,
  bestPast: 65,
  bestSince: 65,
  usual: 35,
  goal: 65,
  slips: 6,
  cw: 2,
  thisW: 2,
  lastW: 3,
  target: 2,
  wSl: 2,
  wWait: 1,
  hh: null,
  ready: false,
  help: false,
  ...o,
});

describe('the stretch ruler', () => {
  it('marks your usual and your best, with room past the best', () => {
    const r = stepRuler(V({}));
    expect(r.marks).toEqual([
      { k: 'usual', h: 35, label: 'usual 35 h' },
      { k: 'best', h: 65, label: 'best 65 h' },
    ]);
    expect(r.newBest).toBe(false);
    expect(r.max).toBeCloseTo(65 * 1.08);
  });
  it('past the best, shows the next goal, and keeps the best in view', () => {
    const r = stepRuler(V({ curH: 70, goal: 72 }));
    expect(r.newBest).toBe(true);
    expect(r.marks.map((m) => m.label)).toEqual(['usual 35 h', 'best 65 h', 'next 3 d']);
  });
  it('before any slip has a best, the goal is the next step', () => {
    expect(stepRuler(V({ bestPast: 0, usual: null, curH: 10, goal: 24 })).marks).toEqual([{ k: 'next', h: 24, label: 'next 24 h' }]);
  });
  it('leaves out the usual when it sits on top of the best', () => {
    expect(stepRuler(V({ usual: 62 })).marks.map((m) => m.k)).toEqual(['best']);
  });
});

describe('the week, and the hard hours in a few words', () => {
  it('shows the plan’s week day by day', () => {
    const st = normSettings({ start: '2026-10-01', day1: '2026-10-08', cleanMode: 'step', stepAt: '2026-10-08' });
    let d: Days = {};
    d = addEvent(d, '2026-10-15', 'slipped', '22:00', {}, 1).days;
    d = addEvent(d, '2026-10-16', 'slipped', '10:30', {}, 1).days;
    d = addEvent(d, '2026-10-16', 'slipped', '23:00', {}, 1).days;
    const now = new Date(2026, 9, 17, 12, 0).getTime();
    const w = stepWeek(d, st, stepView(d, st, now));
    expect(w.map((x) => x.k)).toEqual(['2026-10-15', '2026-10-16', '2026-10-17', '2026-10-18', '2026-10-19', '2026-10-20', '2026-10-21']);
    expect(w.map((x) => x.slips)).toEqual([1, 2, 0, 0, 0, 0, 0]);
    expect(w.map((x) => x.l).join('')).toBe('TFSSMTW');
    expect(w.filter((x) => x.ahead).length).toBe(4);
    expect(w.find((x) => x.today)!.k).toBe('2026-10-17');
    const card = stepCard(d, st, now);
    expect(card.hh?.short).toMatch(/^(Hard hours|In your hard hours)/);
    expect(card.hh?.sub).toMatch(/\d (AM|PM)–\d/);
  });
});
