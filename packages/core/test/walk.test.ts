/* Walk it through: the way into the trail, and what took the place of Planning a slip. Faith only for people of faith, the
   scaling question, the line and its answer, the need by the time of day (never bed in the day), the place as a result, the
   chain said back, and the walk saved as a change plan that keeps its own part through sync. */
import { describe, expect, it } from 'vitest';
import * as core from '../src/index';

const now = new Date('2026-11-04T10:27:00').getTime();

describe('the opening', () => {
  it('says faith lines only when faith plays a part, in the person’s voice', () => {
    expect(core.walkFaith(null)).toBe(null);
    expect(core.walkFaith({ onb: { a: { faith: 'no' } } })).toBe(null);
    expect(core.walkFaith({ onb: { a: {} } })).toBe(null);
    expect(core.walkFaith({ onb: { a: { faith: 'big', creed: 'lds' } } })).toBe('lds');
    expect(core.walkFaith({ onb: { a: { faith: 'some', creed: 'other' } } })).toBe('plain');
    expect(core.walkOpen(null).faith).toBe(null);
    expect(core.walkOpen('lds').faith).toContain('Heavenly Father');
    expect(core.walkOpen('christian').faith).toContain('God is with you');
    expect(core.walkOpen(null).body).toContain('Notice it, and handle it.');
  });
  it('offers God as what holds it down only to people of faith', () => {
    expect(core.walkHolds(null).some((h) => h[0] === 'god')).toBe(false);
    expect(core.walkHolds('plain').some((h) => h[0] === 'god')).toBe(true);
  });
});

describe('how strong', () => {
  it('asks why it is not higher, and nothing at 10', () => {
    expect(core.walkWhyNot(6)).toBe(9);
    expect(core.walkWhyNot(1)).toBe(4);
    expect(core.walkWhyNot(9)).toBe(10);
    expect(core.walkWhyNot(10)).toBe(null);
    expect(core.WALK_SOS).toBe(8);
  });
  it('says back what is already holding it down', () => {
    expect(core.walkHoldBack(6, ['here'])).toBe('So where you are is already holding it at 6. That is yours, and it is working.');
    expect(core.walkHoldBack(6, ['know', 'reasons'], 'my kids')).toBe(
      'So knowing how it ends, your reasons and “my kids” are already holding it at 6. That is yours, and it is working.',
    );
    expect(core.walkHoldBack(3, [])).toContain('Something is already holding it at 3');
  });
  it('says what the walk did, and walks it again only while it is still loud', () => {
    expect(core.walkAfter(6, 3)).toEqual({ down: true, again: false, line: 'From 6 to 3. That was you.' });
    expect(core.walkAfter(6, 7).again).toBe(true);
    expect(core.walkAfter(4, 4)).toMatchObject({ down: false, again: false });
  });
});

describe('noticing and the line', () => {
  it('names the feeling as an alarm that unlearns', () => {
    expect(core.walkAlarm('Chest', 'Tight')).toMatch(/^That tight feeling in your chest is an alarm\./);
    expect(core.walkAlarm('', '')).toMatch(/^That feeling is an alarm\./);
    expect(core.walkAlarm('Stomach', '')).toMatch(/^That feeling in your stomach is an alarm\./);
  });
  it('has a true answer and a fact for every line, and a sign Planning a slip knew', () => {
    for (const l of core.WALK_LINES) {
      expect(l.answer.length).toBeGreaterThan(10);
      expect(l.fact.length).toBeGreaterThan(40);
      expect(core.TALK_SIGNS.some((s) => s[0] === l.sign)).toBe(true);
    }
    expect(core.WALK_LINES.map((l) => l.id).sort()).toEqual([...core.WALK_LINE_IDS].sort());
  });
  it('says the line the way that loosens it', () => {
    expect(core.walkDefuse('I deserve it. Today was hard.')).toBe('I am having the thought that “I deserve it. Today was hard.”');
    expect(core.walkDefuse('Nobody will know.')).toBe('I am having the thought that “nobody will know.”');
    expect(core.walkDefuse('')).toBe('I am having the thought that “I want it.”');
  });
});

describe('what is underneath', () => {
  it('never sends anyone to bed or to sleep in the day', () => {
    for (const n of core.WALK_NEEDS) {
      expect(core.walkNeedMove(n, false)).not.toMatch(/\b(bed|sleep|sleepy|nap)\b/i);
      expect(core.walkNeedMoves(n, false)).not.toContain('bed');
      expect(core.walkNeedMoves(n, false)).not.toContain('nap');
    }
    expect(core.walkNeedMove(core.walkNeed('tired')!, true)).toContain('bed');
  });
  it('never asks a person to reach out to anyone', () => {
    for (const n of core.WALK_NEEDS) {
      for (const night of [true, false]) {
        expect(core.walkNeedMove(n, night)).not.toMatch(/\b(text|call|message|tell)\b/i);
        for (const m of core.walkNeedMoves(n, night)) expect(['text', 'call', 'laugh', 'tell']).not.toContain(m);
      }
    }
  });
  it('covers every need id', () => {
    expect(core.WALK_NEEDS.map((n) => n.id).sort()).toEqual([...core.WALK_NEED_IDS].sort());
  });
});

describe('the place is a result', () => {
  it('finds the place from where they are with it', () => {
    expect(core.walkPlace('noticed', 'tired')).toBe('drift');
    expect(core.walkPlace('noticed', 'bored')).toBe('spark');
    expect(core.walkPlace('noticed', null)).toBe('spark');
    expect(core.walkPlace('picturing', 'tired')).toBe('preview');
    expect(core.walkPlace('arguing', 'stress')).toBe('case');
    expect(core.walkPlace('reaching', 'habit')).toBe('steps');
  });
  it('says how far from the edge, with a way off', () => {
    expect(core.walkWhere('case').title).toBe('You are at Case.');
    expect(core.walkWhere('case').body).toContain('two places from the edge');
    expect(core.walkWhere('steps').body).toContain('still has a way off');
  });
  it('builds the chain from the taps', () => {
    expect(core.walkChain({ n0: 6, where: 'Chest', feel: 'Tight', line: 'I deserve it.', need: 'stress', at: 'case' })).toEqual([
      'Stressed, underneath',
      'An urge at 6 out of 10',
      'Tight in your chest',
      'It said: “I deserve it.”',
      'You found it at Case, and you rode it out',
    ]);
  });
});

describe('the walk is saved', () => {
  const w = {
    n0: 6,
    n1: 3,
    holds: ['here', 'know'],
    holdOwn: '',
    where: 'chest',
    feel: 'tight',
    line: 'owed' as const,
    lineOwn: '',
    answer: 'I do deserve something good: a run after work.',
    explain: 'Work stress, then it said I earned it, and I was arguing with it.',
    need: 'stress' as const,
    at: 'case' as const,
    moves: ['breathe', 'walk'] as core.TalkMove[],
    moveOwn: '',
    mo: 'evening',
    moAt: core.talkMomentTime('evening', now),
  };
  it('as a change plan Today and "Did your plan hold?" already know', () => {
    const t = core.walkTalk(core.newTalk(now), w);
    expect(t.p).toBe('change');
    expect(t.s).toEqual(['owed']);
    expect(t.n).toBe('relief');
    expect(t.why).toEqual(['I am somewhere I cannot', 'I know how it ends']);
    expect(core.talkPlanLine(t)).toBe('This evening, when I want relief, I will breathe slowly for three minutes and walk it off.');
    expect(t.wk).toEqual({ u0: 6, u1: 3, ln: 'owed', nd: 'stress', pl: 'case', ax: w.answer, ex: w.explain });
  });
  it('keeps the walk’s own part through cleaning and saving, and drops what is not one', () => {
    const t = core.walkTalk(core.newTalk(now), { ...w, line: null, lineOwn: 'You have been good all week' });
    expect(core.normTalk(t)?.wk).toEqual({ u0: 6, u1: 3, ln: null, lx: 'You have been good all week', nd: 'stress', pl: 'case', ax: w.answer, ex: w.explain });
    const days = core.saveTalk({}, '2026-11-04', t, now);
    expect(core.talkById(days, t.id)?.talk.wk?.lx).toBe('You have been good all week');
    expect(core.talkDue(days, now + 60000)?.due).toBe('plan');
    const odd = core.normTalk({ ...t, wk: { u0: 11, ln: 'nope', nd: 'x', pl: 'edge', ex: 5 } });
    expect(odd?.wk).toEqual({ u0: null, u1: null, ln: null, nd: null, pl: null });
    expect(core.normTalk({ ...t, wk: undefined })?.wk).toBeUndefined();
  });
  it('with nothing underneath, the plan still reads', () => {
    const t = core.walkTalk(core.newTalk(now), { ...w, need: 'habit', moves: ['out'] });
    expect(t.n).toBe(null);
    expect(core.talkPlanLine(t)).toBe('This evening, when I want it, I will get out of the house.');
  });
});
