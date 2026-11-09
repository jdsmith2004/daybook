/* What a person is quitting (habit.ts; the owner, November 8, 2026): porn, gambling or another habit, porn by default. The words
   change and the lessons written for porn leave the path; nothing finished, earned or logged ever changes. */
import { describe, expect, it } from 'vitest';
import * as core from '../src/index';
import { GOD, TURNS } from '../src/lesson-turns';

const TK = '2026-11-08';
const withA = (a: Record<string, unknown>) => core.normSettings({ ...core.defaultSettings('2026-11-01'), onb: { n: 1, at: 1, a, hist: [] } });
/** days with these lessons finished, one a day */
const daysWith = (ids: string[]) => {
  const days: core.Days = {};
  ids.forEach((id, i) => {
    const k = core.addDays('2026-10-01', i);
    days[k] = core.normDay({ p: { ...core.blankP(), ls: [id] } }, k);
  });
  return days;
};

describe('the habit', () => {
  it('is porn for an old save, a skipped answer and junk', () => {
    expect(core.habitOf(null)).toBe('porn');
    expect(core.habitOf(core.defaultSettings(TK))).toBe('porn');
    expect(core.habitOf(withA({}))).toBe('porn');
    expect(core.habitOf(withA({ habit: 'cards' }))).toBe('porn');
    expect('habit' in withA({ habit: 'cards' }).onb!.a).toBe(false);
    expect(core.habitOf(withA({ habit: 'gambling' }))).toBe('gambling');
    expect(core.habitOf(withA({ habit: 'other' }))).toBe('other');
  });
  it('setup asks it right after how it works, and keeps the answer', () => {
    const ids = core.obPages({}).map((p) => p.id);
    expect(ids.indexOf('habit')).toBe(ids.indexOf('how') + 1);
    const r = core.obSave({ habit: 'gambling', faith: 'big', creed: 'lds' }, null, null, TK, 0);
    expect(core.habitOf(r.st)).toBe('gambling');
    /* the faith chosen in setup is kept too (it was dropped before November 8, 2026) */
    expect(r.st.onb!.a.creed).toBe('lds');
    const again = core.obSave({ habit: 'gambling' }, r.st, [], TK, 0);
    expect(core.habitOf(again.st)).toBe('gambling');
  });
  it('the questions after it use its words, and the five porn statements are left out', () => {
    const page = (habit: string, id: string) => core.obPages({ habit }).find((p) => p.id === id)!;
    expect(page('porn', 'years').h).toBe('How long have you been struggling with porn?');
    expect(page('gambling', 'years').h).toBe('How long have you been struggling with gambling?');
    expect(page('gambling', 'freq').h).toBe('In a typical week, how often do you gamble?');
    expect(page('other', 'freq').h).toBe('In a typical week, how often does it happen?');
    expect(page('gambling', 'costs').h).toBe('What has gambling cost you so far?');
    /* another habit: the first question says to see a doctor before stopping alcohol or a daily drug */
    expect(page('other', 'years').sub).toBe(core.HABIT_MEDICAL);
    expect(core.obSay('years', false, 'other')).toBe(core.HABIT_MEDICAL);
    expect(core.obSay('years', false, 'gambling')).toBe(core.obSay('years'));
    for (const h of ['gambling', 'other']) {
      const ids = core.obPages({ habit: h }).map((p) => p.id);
      ['b0', 'b1', 'b2', 'b3', 'b4', 'heard'].forEach((id) => expect(ids).not.toContain(id));
      core.obPages({ habit: h }).forEach((p) => expect(String(p.h || '') + (p.sub || '')).not.toMatch(/porn/i));
    }
    expect(core.obPages({}).map((p) => p.id)).toContain('b0');
  });
  it('the goal says the habit', () => {
    const goals = (habit: string) => core.obGoals(null, TK, core.habitIn({ habit })).map((g) => g.goal);
    expect(goals('porn').join(' ')).toMatch(/Quit porn/);
    expect(goals('gambling').join(' ')).toMatch(/Quit gambling/);
    goals('gambling').forEach((g) => expect(g).not.toMatch(/porn/i));
    goals('other').forEach((g) => expect(g).not.toMatch(/porn/i));
    const r = core.obSave({ habit: 'gambling', goal: 'now' }, null, null, TK, 0);
    expect(r.st.goal).toBe('Quit gambling, starting tomorrow. Log honestly, slips included.');
  });
  it('alcohol has its own words and a doctor line before stopping', () => {
    expect(core.habitOf(withA({ habit: 'alcohol' }))).toBe('alcohol');
    const page = (id: string) => core.obPages({ habit: 'alcohol' }).find((p) => p.id === id)!;
    expect(page('years').h).toBe('How long have you been struggling with drinking?');
    expect(page('freq').h).toBe('In a typical week, how often do you drink?');
    expect(page('years').sub).toBe(core.ALCOHOL_MEDICAL);
    expect(core.obSay('years', false, 'alcohol')).toBe(core.ALCOHOL_MEDICAL);
    expect(core.habitMedical('porn')).toBeNull();
    expect(core.habitMedical('gambling')).toBeNull();
    const ids = core.obPages({ habit: 'alcohol' }).map((p) => p.id);
    ['b0', 'heard'].forEach((id) => expect(ids).not.toContain(id));
    core.obPages({ habit: 'alcohol' }).forEach((p) => expect(String(p.h || '') + (p.sub || '')).not.toMatch(/porn/i));
    expect(core.obSave({ habit: 'alcohol', goal: 'now' }, null, null, TK, 0).st.goal).toBe('Quit drinking, starting tomorrow. Log honestly, slips included.');
    expect(core.lessonPathFor(withA({ habit: 'alcohol' })).map((L) => L.id)).toEqual(core.lessonPathFor(withA({ habit: 'gambling' })).map((L) => L.id));
    expect(core.safetyFor(1, ['x', 'y'], 'alcohol')[0]).toBe('No alcohol in the house');
    expect(core.OB_REPLY.habit.alcohol).toBeTruthy();
  });
  it('what set it off: each habit sees its own answers first, and none of another habit', () => {
    const ids = (habit?: string, sel?: string) => core.optList('trig', null, { all: true, habit, sel }).list.map((x) => x[0]);
    expect(ids()).toEqual(['late', 'lonely', 'bored', 'stress', 'tired', 'scroll', 'other']);
    expect(ids('porn')).toEqual(ids());
    expect(ids('alcohol')).toEqual(['social', 'unwind', 'late', 'lonely', 'bored', 'stress', 'tired', 'other']);
    expect(ids('gambling')).toEqual(['money', 'game', 'late', 'lonely', 'bored', 'stress', 'tired', 'scroll', 'other']);
    expect(ids('other')).toEqual(ids());
    /* an answer picked before a habit change stays */
    expect(ids('porn', 'money')).toContain('money');
    expect(core.trigText('social', null)).toBe('Around people drinking');
  });
  it('Settings changes it, and only once setup has run', () => {
    const st = withA({ habit: 'porn' });
    expect(core.habitOf(core.setHabit(st, 'gambling'))).toBe('gambling');
    expect(core.setHabit(core.defaultSettings(TK), 'gambling')).toEqual(core.defaultSettings(TK));
  });
  it('the five questions a month on are for porn only', () => {
    const st = withA({ habit: 'gambling' });
    expect(core.bpsDue({}, { ...st, start: '2026-01-01' }, TK, {})).toBe(false);
  });
});

describe('the lessons for another habit', () => {
  const porn = withA({ habit: 'porn' });
  const gamb = withA({ habit: 'gambling' });
  it('leave the lessons written for porn off the path, and keep the rest in their order', () => {
    const p = core.lessonPathFor(porn).map((L) => L.id);
    const g = core.lessonPathFor(gamb).map((L) => L.id);
    expect(p).toEqual(core.lessonPathFor(null).map((L) => L.id));
    expect(g).toEqual(p.filter((id) => !core.PORN_ONLY.has(id)));
    expect(g[0]).toBe('l1');
    expect(g.length).toBeGreaterThanOrEqual(30);
    expect(core.lessonFor('l4', gamb)).toBeNull();
    expect(core.lessonFor('l4', porn)!.id).toBe('l4');
    expect(core.lessonFor('l2', gamb)!.id).toBe('l2');
    expect(core.PORN_ONLY.has(core.reviewPick(TK, gamb).id)).toBe(false);
  });
  it('with faith, the God lessons written for porn leave too', () => {
    const g = core.lessonPathFor(withA({ habit: 'gambling', faith: 'big' })).map((L) => L.id);
    expect(g).toContain('g1');
    expect(g).not.toContain('g9');
  });
  it('a lesson kept for every habit says nothing of porn or sex', () => {
    const RE = /\b(porn\w*|sex\w*|arous\w*|masturb\w*|erotic|lust)\b/i;
    for (const [id, T] of Object.entries({ ...TURNS, ...GOD })) {
      if (core.PORN_ONLY.has(id)) continue;
      const { scope, src, ...live } = T as unknown as Record<string, unknown>;
      void scope;
      void src;
      expect([id, JSON.stringify(live).match(RE)?.[0] || '']).toEqual([id, '']);
    }
  });
  it('nothing earned changes: a porn lesson finished before stays finished, counted and worth its points', () => {
    const days = daysWith(['l1', 'l2', 'l3', 'l4']);
    const wp = core.lessonWalk(days, porn);
    const wg = core.lessonWalk(days, gamb);
    expect(core.lessonCount(wg).done).toBe(core.lessonCount(wp).done);
    const gp = core.gameCompute(days, porn, {}, TK);
    const gg = core.gameCompute(days, gamb, {}, TK);
    expect(gg.pts).toBe(gp.pts);
    expect(gg.level).toEqual(gp.level);
    expect(gg.badges.filter((b) => b.done).map((b) => b.id)).toEqual(gp.badges.filter((b) => b.done).map((b) => b.id));
  });
  it('a checkpoint about a porn lesson never comes for another habit', () => {
    const all = core.LESSONS.map((L) => L.id);
    const days = daysWith(all);
    let n = core.lcheckDue(days, gamb);
    const seen: number[] = [];
    let st = gamb;
    while (n && seen.length < 40) {
      const p = core.lcheckPair(n)!;
      expect(core.PORN_ONLY.has(p.a.id) || core.PORN_ONLY.has(p.b.id)).toBe(false);
      seen.push(n);
      st = { ...st, learn: { ...st.learn, wr: { ...(st.learn.wr || {}), ['c' + n]: { a: ['x', 'x', 'x'], d: TK } } } } as core.Settings;
      n = core.lcheckDue(days, st);
    }
    expect(seen.length).toBeGreaterThan(0);
  });
  it('the lines to copy say the habit', () => {
    const p = core.lessonPractice(core.lessonById('l31'), gamb)!;
    expect(JSON.stringify(p.items)).not.toMatch(/porn/i);
    expect(JSON.stringify(core.lessonPractice(core.lessonById('l31'), porn)!.items)).toMatch(/porn/);
  });
});
