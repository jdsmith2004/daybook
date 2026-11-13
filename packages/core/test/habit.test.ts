/* What a person is quitting (habit.ts; the owner, November 8, 2026): porn, gambling or another habit, porn by default. The words
   change and the lessons written for porn leave the path; nothing finished, earned or logged ever changes. */
import { describe, expect, it } from 'vitest';
import * as core from '../src/index';
import { GOD, TURNS } from '../src/lesson-turns';
import { HABIT_ONLY, HABIT_OPEN, HABIT_TURNS } from '../src/lesson-habit';

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
  it('the questions after it use its words, and nothing in setup says porn for another habit', () => {
    /* another habit: the first question after it says to see a doctor before stopping alcohol or a daily drug */
    expect(core.obSay('freq', false, 'other')).toBe(core.HABIT_MEDICAL);
    expect(core.obSay('freq', false, 'gambling')).toBe(core.obSay('freq'));
    for (const h of ['gambling', 'other', 'alcohol']) {
      core.obPages({ habit: h }).forEach((p) => expect(String(p.h || '') + (p.sub || '')).not.toMatch(/porn/i));
      expect(core.obBegin({ habit: h }, TK, 0).goal).not.toMatch(/porn/i);
    }
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
    expect(core.obSay('freq', false, 'alcohol')).toBe(core.ALCOHOL_MEDICAL);
    expect(core.habitMedical('porn')).toBeNull();
    expect(core.habitMedical('gambling')).toBeNull();
    const ids = core.obPages({ habit: 'alcohol' }).map((p) => p.id);
    ['b0', 'heard'].forEach((id) => expect(ids).not.toContain(id));
    core.obPages({ habit: 'alcohol' }).forEach((p) => expect(String(p.h || '') + (p.sub || '')).not.toMatch(/porn/i));
    expect(core.obSave({ habit: 'alcohol', goal: 'now' }, null, null, TK, 0).st.goal).toBe('Quit drinking, starting tomorrow. Log honestly, slips included.');
    const alc = core.lessonPathFor(withA({ habit: 'alcohol' })).map((L) => L.id);
    expect(alc).toEqual(expect.arrayContaining(['l50', 'l51']));
    expect(alc).not.toContain('l52');
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
    const fresh = core.defaultSettings(TK);
    expect(core.setHabit(fresh, 'gambling')).toEqual(fresh);
  });
  it('the five questions a month on are for porn only', () => {
    const st = withA({ habit: 'gambling' });
    expect(core.bpsDue({}, { ...st, start: '2026-01-01' }, TK, {})).toBe(false);
  });
});

describe('the lessons for another habit', () => {
  const porn = withA({ habit: 'porn' });
  const gamb = withA({ habit: 'gambling' });
  it('leave the lessons written for porn off the path unless they open to the habit, and keep the rest in their order', () => {
    const p = core.lessonPathFor(porn).map((L) => L.id);
    const g = core.lessonPathFor(gamb).map((L) => L.id);
    expect(p).toEqual(core.lessonPathFor(null).map((L) => L.id));
    expect(g.filter((id) => !HABIT_ONLY[id])).toEqual(p.filter((id) => !core.PORN_ONLY.has(id) || HABIT_OPEN[id]?.gambling));
    expect(g[0]).toBe('l1');
    expect(g.length).toBeGreaterThanOrEqual(40);
    expect(core.lessonFor('l4', gamb)).toBeNull();
    expect(core.lessonFor('l4', porn)!.id).toBe('l4');
    expect(core.lessonFor('l2', gamb)!.id).toBe('l2');
    expect(core.lessonFor('l34', gamb)!.id).toBe('l34');
    expect(core.lessonFor('l46', withA({ habit: 'other' }))).toBeNull();
    for (let i = 0; i < 70; i++) {
      const id = core.reviewPick(core.addDays(TK, i), gamb).id;
      expect(core.PORN_ONLY.has(id) && !HABIT_OPEN[id]?.gambling, id).toBe(false);
      expect(HABIT_ONLY[id] && HABIT_ONLY[id].h !== 'gambling', id).toBeFalsy();
    }
  });
  it('the lessons of one habit are on its path only, in their step, never on porn’s', () => {
    const p = core.lessonPathFor(withA({ habit: 'porn', faith: 'big' })).map((L) => L.id);
    const a = core.lessonPathFor(withA({ habit: 'alcohol', faith: 'big' })).map((L) => L.id);
    const g = core.lessonPathFor(withA({ habit: 'gambling', faith: 'big' })).map((L) => L.id);
    Object.keys(HABIT_ONLY).forEach((id) => {
      expect(p).not.toContain(id);
      expect(core.lessonFor(id, porn)).toBeNull();
    });
    /* each sits in its step, before the step's God lesson */
    expect(a.indexOf('l50')).toBeGreaterThan(a.indexOf('l29'));
    expect(a.indexOf('l50')).toBeLessThan(a.indexOf('g3'));
    expect(a.slice(a.indexOf('l51') + 1, a.indexOf('l51') + 2)).toEqual(['g10']);
    expect(g.indexOf('l52')).toBeGreaterThan(g.indexOf('l41'));
    expect(g).not.toContain('l50');
    expect(a).not.toContain('l53');
    /* the steps that were empty for another habit have lessons again */
    expect(core.lessonSections(gamb).map((x) => x.u)).toEqual(core.PATH_STEPS.map((_, k) => k));
    expect(core.lessonSections(withA({ habit: 'alcohol' })).map((x) => x.u)).toEqual(core.PATH_STEPS.map((_, k) => k));
  });
  it('with faith, the God lessons written for porn leave too, unless they open to the habit', () => {
    const g = core.lessonPathFor(withA({ habit: 'gambling', faith: 'big' })).map((L) => L.id);
    expect(g).toContain('g1');
    expect(g).toContain('g9');
    expect(g).not.toContain('g7');
  });
  it('a lesson that opens to another habit reads in its words, and says nothing of porn or sex', () => {
    const RE = /\b(porn\w*|sex\w*|arous\w*|masturb\w*|erotic|lust)\b/i;
    const voices = [null, 'christian', 'plain'] as const;
    (['alcohol', 'gambling', 'other'] as const).forEach((h) =>
      Object.entries(HABIT_OPEN).forEach(([id, o]) => {
        if (!o[h]) return;
        voices.forEach((v) => {
          const L = core.lessonAs(core.lessonById(id)!, v, h);
          const { scope, src, ...live } = L as unknown as Record<string, unknown>;
          void scope;
          void src;
          const said = JSON.stringify([live, core.lessonBeats(L), core.lessonPractice(core.lessonById(id), withA({ habit: h }))]);
          expect([id, h, v, said.match(RE)?.[0] || '']).toEqual([id, h, v, '']);
        });
      }),
    );
    expect(core.lessonAs(core.lessonById('l38')!, null, 'gambling').cards.find((c) => c.e === 'move')!.h).toBeTruthy();
    expect(JSON.stringify(core.lessonBeats(core.lessonAs(core.lessonById('l38')!, null, 'gambling')))).toContain('I do not gamble');
    /* porn reads it as written, and a lesson not open to the habit is left as it is */
    expect(core.lessonAs(core.lessonById('l38')!, null, 'porn')).toBe(core.lessonById('l38'));
    expect(core.lessonAs(core.lessonById('l48')!, null, 'alcohol')).toBe(core.lessonById('l48'));
    /* alcohol: the flat weeks lesson says a doctor helps with the first days */
    expect(JSON.stringify(core.lessonAs(core.lessonById('l46')!, null, 'alcohol').cards)).toMatch(/doctor should help with the first days/);
  });
  it('a lesson of one habit says nothing of porn or sex, and is for that habit only', () => {
    const RE = /\b(porn\w*|sex\w*|arous\w*|masturb\w*|erotic|lust)\b/i;
    Object.values(HABIT_TURNS).forEach((T) => expect([T.id, JSON.stringify(T).match(RE)?.[0] || '']).toEqual([T.id, '']));
    expect(Object.keys(HABIT_TURNS).sort()).toEqual(Object.keys(HABIT_ONLY).sort());
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
