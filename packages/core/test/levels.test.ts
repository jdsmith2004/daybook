/* The 60-level ladder: 12 forms of 5 steps, nothing shown ever goes down when moving from the 30-level ladder, and the
   pacing fits a steady day (about 45 points). */
import { expect, it } from 'vitest';
import * as core from '../src/index';

const oldLevel = (p: number) => core.OLD_LEVEL_PTS.filter((x) => p >= x).length;
const oldForm = (p: number) => Math.floor((oldLevel(p) - 1) / 3);

it('has 60 levels in 12 forms of 5 steps, rising, each with its own words', () => {
  expect(core.LEVELS).toHaveLength(60);
  expect(core.STAGES).toHaveLength(12);
  core.STAGES.forEach((s) => expect(s.steps).toHaveLength(core.STEPS));
  core.LEVELS.forEach((l, i) => i && expect(l[0]).toBeGreaterThan(core.LEVELS[i - 1][0]));
  core.LEVELS.forEach((l) => expect(l[0] % 5).toBe(0));
  expect(core.STAGES.slice(-2).map((s) => s.name)).toEqual(['Constellation', 'North Star']);
});

it('for any points, the level number and the form are never lower than on the old ladder', () => {
  for (let p = 0; p <= 6000; p += 5) {
    const l = core.levelOf(p);
    expect(l.n).toBeGreaterThanOrEqual(oldLevel(p));
    expect(l.stage).toBeGreaterThanOrEqual(oldForm(p));
  }
});

it('the first ten forms start at the same points as before', () => {
  for (let f = 0; f < 10; f++) expect(core.LEVELS[f * core.STEPS][0]).toBe(core.OLD_LEVEL_PTS[f * 3]);
});

it('pacing: setup alone is a level-up, and the top is about a year of steady days away', () => {
  expect(core.levelOf(20).n).toBe(2);
  expect(core.levelOf(45 * 7).n).toBeGreaterThanOrEqual(6);
  const top = core.LEVELS[59][0];
  expect(top / 45).toBeGreaterThan(300);
  expect(top / 45).toBeLessThan(420);
});

it('a level saved on the old ladder moves to one that keeps at least its points', () => {
  for (let lv = 1; lv <= 30; lv++) {
    const n = core.moveSeenLevel(lv, 3);
    expect(core.LEVELS[n - 1][0]).toBeGreaterThanOrEqual(core.OLD_LEVEL_PTS[lv - 1]);
    expect(n).toBeGreaterThanOrEqual(lv);
    expect(core.formOfLevel(n)).toBeGreaterThanOrEqual(Math.floor((lv - 1) / 3));
  }
  expect(core.moveSeenLevel(42, core.LADDER_V)).toBe(42);
  const st = core.normSettings({ ...core.defaultSettings('2026-09-01'), seen: { badges: [], quests: [], level: 10, full: null, lad: 3 } });
  expect(st.seen).toMatchObject({ level: core.moveSeenLevel(10, 3), lad: core.LADDER_V });
  expect(core.normSettings(JSON.parse(JSON.stringify(st))).seen!.level).toBe(st.seen!.level);
});

it('says what comes next in plain words', () => {
  expect(core.nextLine(core.levelOf(0))).toBe('20 more points to reach level 2.');
  expect(core.nextLine(core.levelOf(80))).toBe('10 more points and your flame turns into Kindling.');
  expect(core.nextLine(core.levelOf(9500))).toMatch(/turns into the North Star\.$/);
  expect(core.nextLine(core.levelOf(99999))).toBe('Your flame is as bright as it gets.');
});

it('every level has its own drawing, and each step looks different from the one before', () => {
  let prev = '';
  for (let n = 1; n <= 60; n++) {
    const x = core.sameIds(core.emblemXml(n));
    expect(x.startsWith('<svg viewBox="0 0 120 120">')).toBe(true);
    expect(x).not.toMatch(/NaN|undefined/);
    expect(x).not.toBe(prev);
    prev = x;
  }
});
