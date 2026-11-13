/* Lessons 54 to 58, the lessons that meet the night (lessons-night.ts): each is a whole lesson, read in each habit's words, with
   its sources in SRC and a practice step. The words rules and limits are held by the shared lesson tests (lesson-beats, lesson-turns,
   practice, habit), which walk every lesson. */
import { describe, expect, it } from 'vitest';
import * as core from '../src/index';
import { SRC } from '../src/legacy/core.js';
import { HABIT_OPEN, habitOpen } from '../src/lesson-habit';
import { NIGHT, SRC_NIGHT } from '../src/lessons-night';

const IDS = ['l54', 'l55', 'l56', 'l57', 'l58'];
const RE = /\b(porn\w*|sex\w*|arous\w*|masturb\w*|erotic|lust)\b/i;

describe('the lessons that meet the night', () => {
  it('are lessons, in order, after every lesson already in the list', () => {
    expect(Object.keys(NIGHT)).toEqual(IDS);
    expect(core.LESSONS.slice(-5).map((L) => L.id)).toEqual(IDS);
    IDS.forEach((id) => {
      const L = core.lessonById(id)!;
      expect(L.v, id).toBe(3);
      expect(core.lessonBeats(L)!.cards.length, id).toBe(L.cards.length);
      expect(core.lessonSeq(L, 'f').length, id).toBeGreaterThan(0);
      expect(core.lessonPractice(L), id).toBeTruthy();
      expect(
        L.cards.some((c) => c.k === 'choose' && c.e === 'predict' && c.a === undefined),
        id + ' asks an open question',
      ).toBe(true);
    });
  });
  it('a finished one is kept in the day record', () => {
    expect(core.normDay({ p: { ls: ['l54', 'l58'] } }, '2026-11-12').p?.ls).toEqual(['l54', 'l58']);
  });
  it('the heavier-thing lesson shows the 988 line, and the others do not need to', () => {
    expect(core.lessonById('l58')!.care).toBe(true);
    expect(core.lessonById('l54')!.care).toBeFalsy();
  });
  it('name their sources in SRC', () => {
    Object.entries(SRC_NIGHT).forEach(([k, v]) => expect((SRC as Record<string, unknown>)[k], k).toEqual(v));
    IDS.forEach((id) => expect(core.lessonById(id)!.src.length, id).toBeGreaterThan(0));
  });
  it('the three for every habit say nothing of porn', () => {
    ['l54', 'l55', 'l57'].forEach((id) => {
      expect(core.PORN_ONLY.has(id), id).toBe(false);
      const { scope, src, ...live } = core.lessonById(id)! as unknown as Record<string, unknown>;
      void scope;
      void src;
      expect([id, JSON.stringify(live).match(RE)?.[0] || '']).toEqual([id, '']);
    });
  });
  it('the filter lesson is for porn, gambling and another habit, not alcohol', () => {
    expect(HABIT_OPEN.l56.alcohol).toBeUndefined();
    expect(habitOpen('l56', 'gambling')).toBe(true);
    expect(habitOpen('l56', 'alcohol')).toBe(false);
  });
  it('for alcohol, the heavier-thing lesson names the medicines and the doctor for the first days', () => {
    const L = core.lessonById('l58')!;
    const al = core.lessonAs(L, null, 'alcohol');
    const said = JSON.stringify([al.cards, core.lessonBeats(al)]);
    expect(said).toMatch(/naltrexone/);
    expect(said).toMatch(/doctor should help with the first days/);
    expect(al.src.map((s) => s[1])).toContain(SRC_NIGHT.niaaa[1]);
    /* porn and gambling read it without the medicines line */
    expect(JSON.stringify(L.cards)).not.toMatch(/naltrexone/);
    expect(JSON.stringify(core.lessonAs(L, null, 'gambling').cards)).not.toMatch(/naltrexone/);
  });
});
