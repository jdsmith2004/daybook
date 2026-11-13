/* The paths people walk (WP11, "Lessons that meet the night", the review of November 12, 2026): the front track from two setup
   answers, the gate after seven lessons on every path, the three moments that change the day's lesson, and the Next button that
   never lands on a sign-up page in the hours after a slip. Kept from the review's path script (review-nov-12/lessons/dump*.test.ts). */
import { describe, expect, it } from 'vitest';
import * as core from '../src/index';
import type { Days, Settings } from '../src/types';

const tk = '2026-10-20';
const person = (a: Record<string, unknown>): Settings => core.normSettings({ ...core.defaultSettings('2026-10-01'), onb: { n: 1, at: 1, a, hist: [] } });
/** Sam: porn, faith on, about once a day, late at night in bed after scrolling */
const sam = person({ faith: 'big', creed: 'christian', freq: 'f3', when: ['late', 'scroll'] });
const fin = (k: string, ...ids: string[]): Days => ({ [k]: { p: { ...core.blankP(), ls: ids } } }) as unknown as Days;
const ids = (L: core.Lesson[]) => L.map((x) => x.id);
const NIGHT = ['l54', 'l55', 'l34', 'l20', 'l10', 'l9', 'l4'];

describe('the front track', () => {
  it('Sam gets four lessons about his night first, seven in all, with no repeats after', () => {
    const path = core.lessonPathFor(sam);
    expect(ids(path.slice(0, 7))).toEqual(['l54', 'l34', 'l55', 'l9', 'l4', 'l1', 'l3']);
    path.slice(0, 4).forEach((L) => expect(NIGHT).toContain(L.id));
    expect(new Set(ids(path)).size).toBe(path.length);
    expect(ids(path).sort()).toEqual(ids(core.lessonPathBase(sam)).sort());
    expect(ids(core.frontTrack(sam))).toEqual(ids(path.slice(0, 7)));
    /* faith stays: every God lesson is still on it */
    expect(path.filter(core.isGod).length).toBe(12);
  });
  it('someone who said most days but not late at night keeps the path, with "When values and habits clash" after the first week', () => {
    const st = person({ faith: 'no', freq: 'f4', when: ['stress'] });
    const path = ids(core.lessonPathFor(st));
    expect(path.slice(0, 7)).toEqual(['l1', 'l2', 'l3', 'l33', 'l34', 'l20', 'l46']);
    expect(path.indexOf('l22')).toBe(7);
    /* on Sam's path it comes after the second step's lessons too, never in his first week */
    expect(ids(core.lessonPathFor(sam)).indexOf('l22')).toBeGreaterThan(7);
  });
  it('anyone else gets the path as it was', () => {
    const st = person({ faith: 'no', freq: 'f1', when: ['late'] });
    expect(core.lessonPathFor(st)).toBe(core.lessonPathBase(st));
    expect(ids(core.lessonPathFor(st)).slice(0, 4)).toEqual(['l1', 'l2', 'l3', 'l22']);
  });
  it('another habit gets the night lessons written for it, never one that is not', () => {
    const st = person({ habit: 'alcohol', faith: 'no', freq: 'f3', when: ['late'] });
    const front = core.frontTrack(st);
    expect(front.length).toBe(7);
    front.forEach((L) => expect(core.habitOff(L, st)).toBe(false));
    expect(ids(front)).not.toContain('l4');
  });
  it('the map still draws, with the front track in the first land and Up next its first lesson', () => {
    const w = core.lessonWalk({}, sam);
    const m = core.lessonMap(w);
    expect(ids(m.lands[0].stones.slice(0, 7).map((s) => s.L))).toEqual(ids(core.frontTrack(sam)));
    expect(m.next!.L.id).toBe('l54');
    expect(m.lands.map((l) => l.u)).toEqual(core.PATH_STEPS.map((_, k) => k));
  });
});

describe('the gate after seven, on every path', () => {
  const habits = ['porn', 'alcohol', 'gambling', 'other'];
  const faiths = [undefined, 'big', 'some', 'no'];
  const freqs = [
    ['f1', []],
    ['f3', ['late']],
    ['f4', ['stress']],
  ] as const;
  habits.forEach((habit) =>
    faiths.forEach((faith) =>
      freqs.forEach(([freq, when]) =>
        it(`${habit}, faith ${faith ?? 'skipped'}, ${freq} ${when.join(',')}: exactly seven open`, () => {
          const st = person({ habit, faith, freq, when: [...when] });
          const path = core.lessonPathFor(st);
          const open = path.filter((L) => core.lessonOpen(L, new Set(), false, st));
          expect(open.length).toBe(core.LEARN_FREE);
          expect(ids(open)).toEqual(ids(path.slice(0, 7)));
          expect(core.lessonsLocked(path, new Set(), false, st)).toBe(path.length - 7);
          /* a finished one stays open */
          expect(core.lessonOpen(path[9], new Set([path[9].id]), false, st)).toBe(true);
        }),
      ),
    ),
  );
  it('the words say seven', () => {
    expect(core.LEARN_FREE).toBe(7);
    expect(core.accountWords('week', 30).p).toMatch(/^The first 7 lessons are free/);
  });
});

describe('three moments change the day’s lesson', () => {
  const st = person({ faith: 'no', freq: 'f1' });
  const base = fin('2026-10-10', 'l1', 'l2');
  it('the morning after a slip: the first unread lesson for after a hard night, open without an account', () => {
    const d = core.addEvent(base, '2026-10-19', 'slipped', '23:00').days;
    const t = core.lessonToday(d, st, tk, false)!;
    expect(t).toMatchObject({ hook: 'slip', open: true });
    expect(t.L.id).toBe('l24');
    const read = { ...d, '2026-10-12': { p: { ...core.blankP(), ls: ['l24'] } } } as unknown as Days;
    expect(core.lessonToday(read, st, tk)!.L.id).toBe('l6');
    expect(core.lessonStop(d, st, tk, false)).toMatchObject({ kind: 'next', hook: 'slip', locked: false });
    expect(core.lessonGate(t.L, core.lessonWalk(d, st, tk, false))).toBe('open');
    /* "It happened" in the morning set is a slip on the night before */
    const told = core.answerNight(base, st, tk, 'slip', 1);
    expect(core.lessonToday(told, st, tk)!.hook).toBe('slip');
  });
  it('a free night told: "Say I do not", once', () => {
    const d = core.answerNight(base, st, tk, 'free', 1);
    expect(core.lessonToday(d, st, tk)).toMatchObject({ hook: 'free', L: { id: 'l38' } });
    const had = { ...d, '2026-10-11': { p: { ...core.blankP(), ls: ['l38'] } } } as unknown as Days;
    expect(core.lessonToday(had, st, tk)!.hook).toBeNull();
    /* without an account it waits like any lesson past the seventh: the path instead */
    expect(core.lessonToday(d, st, tk, false)!.hook).toBeNull();
  });
  it('an urge ridden out today or yesterday: "Your log is your evidence"', () => {
    for (const k of [tk, '2026-10-19']) {
      const d = core.addEvent(base, k, 'rode', '22:00').days;
      expect(core.lessonToday(d, st, tk)).toMatchObject({ hook: 'rode', L: { id: 'l40' } });
    }
    expect(core.lessonToday(core.addEvent(base, '2026-10-17', 'rode', '22:00').days, st, tk)!.hook).toBeNull();
  });
  it('otherwise the path; not before the first lesson; not once a lesson was read today', () => {
    expect(core.lessonToday(base, st, tk)).toMatchObject({ hook: null, L: { id: 'l3' } });
    expect(core.lessonToday(core.addEvent({}, '2026-10-19', 'slipped', '23:00').days, st, tk)!.hook).toBeNull();
    const d = { ...core.addEvent(base, tk, 'rode', '09:00').days };
    d[tk] = { ...d[tk], p: { ...core.blankP(), ...(d[tk].p || {}), ls: ['l3'] } } as never;
    expect(core.lessonStop(d, st, tk).kind).toBe('read');
  });
  it('a moment’s lesson counts as done, and the path walks past it with no welcome back', () => {
    const d = { ...core.addEvent(base, '2026-10-14', 'rode', '22:00').days, '2026-10-15': { p: { ...core.blankP(), ls: ['l40'] } } } as unknown as Days;
    expect(core.lessonsEarly(d, st).has('l40')).toBe(false);
    const read = core
      .lessonPathFor(st)
      .filter((L) => L.id !== 'l40')
      .slice(0, core.lessonNo(core.lessonById('l40')!, st));
    const all = { ...d, '2026-10-16': { p: { ...core.blankP(), ls: ids(read) } } } as unknown as Days;
    expect(core.lessonWalk(all, st).next!.id).not.toBe('l40');
    expect(core.lessonWalk(all, st).walked.has('l40')).toBe(true);
    /* one read early from anywhere else still gets its welcome back */
    expect(core.lessonsEarly(fin('2026-10-15', 'l1', 'l2', 'l12'), st).has('l12')).toBe(true);
  });
});

describe('the Next button and the gate', () => {
  const st = person({ faith: 'no' });
  const path = core.lessonPathFor(st);
  const six = fin('2026-10-10', ...ids(path.slice(0, 6)));
  it('on an ordinary day, Next after the seventh is the eighth, locked: the app shows the sign-up', () => {
    const w = core.lessonWalk(six, st, tk, false);
    expect(core.nextLessonOk(path[6], w, six, st, tk, false)).toEqual({ L: path[7], locked: true });
    expect(core.nextLessonOk(path[5], core.lessonWalk(fin('2026-10-10', ...ids(path.slice(0, 5))), st), six, st, tk, false)).toEqual({
      L: path[6],
      locked: false,
    });
    expect(core.nextLessonOk(path[6], w, six, st, tk, true)).toEqual({ L: path[7], locked: false });
  });
  it('on the day of a slip, or the day after, a locked Next is no Next (the player shows Done)', () => {
    for (const k of [tk, '2026-10-19']) {
      const d = core.addEvent(six, k, 'slipped', '21:00').days;
      const w = core.lessonWalk(d, st, tk, false);
      expect(core.nextLessonOk(path[6], w, d, st, tk, false)).toBeNull();
      expect(core.nextLessonOk(path[6], w, d, st, tk, true)).toEqual({ L: path[7], locked: false });
    }
  });
  it('the account card first shows after the first week, whatever the level', () => {
    expect(core.accountAsk({}, person({}), '2026-10-03', 20, false)).toBeNull();
    expect(core.accountAsk({}, person({}), '2026-10-08', 1, false)).toBe('week');
  });
});
