/* The path as this person walked it (the owner, November 15, 2026: "it should be like on a path ... it plans on us doing it in the
   order that we're doing it"): every lesson finished, in the order it was first finished, then the rest in the planned order. Nobody
   stands in the middle of finished lessons, the numbers and steps behind them hold, and nothing earned moves. */
import { describe, expect, it } from 'vitest';
import * as core from '../src/index';
import type { Days, Settings } from '../src/types';

const mk = (a: Record<string, unknown> = {}): Settings =>
  core.normSettings({ ...core.defaultSettings('2026-09-01'), day1: '2026-09-08', onb: { a } } as unknown as Settings);
/** each list finished on its own day, in turn */
function rec(lists: string[][], from = '2026-09-10'): Days {
  const days: Days = {};
  lists.forEach((ls, i) => {
    const k = core.addDays(from, i);
    days[k] = core.normDay({ p: { ls } }, k);
  });
  return days;
}
const one = (ids: string[], from?: string) =>
  rec(
    ids.map((id) => [id]),
    from,
  );
const add = (days: Days, id: string, k: string) => core.recordLesson(days, k, core.lessonById(id)!, 1).days;

/** what must hold for any record: the walked lessons are all behind Up next, Up next is the front edge, and the steps go forward */
function holds(days: Days, st: Settings) {
  const w = core.lessonWalk(days, st);
  const m = core.lessonMap(w);
  const all = m.lands.flatMap((l) => l.stones);
  const at = all.findIndex((s) => s.state === 'next');
  all.forEach((s, i) => expect(s.state === 'done', s.L.id).toBe(at < 0 || i < at));
  /* one walked stretch of road, from the start to Up next */
  expect(m.gold.length).toBeLessThanOrEqual(1);
  if (m.gold.length) expect(m.gold[0]).toEqual([0, at < 0 ? all.length : at]);
  /* the steps never go backwards along the path */
  const us = m.lands.map((l) => l.u);
  us.slice(1).forEach((u, i) => expect(u).toBeGreaterThanOrEqual(us[i]));
  /* each stone's number is its place on the path */
  all.forEach((s, i) => expect(core.lessonNo(s.L, st, days)).toBe(i + 1));
  /* every finished lesson on the path is counted */
  const onPath = [...w.done].filter((id) => w.path.some((L) => L.id === id));
  expect(core.lessonCount(w).done).toBe(w.done.size);
  expect(w.walked.size).toBe(onPath.length);
  return { w, m, all };
}

describe('a new person', () => {
  it('gets the planned path as it is, from lesson 1', () => {
    const st = mk();
    expect(core.lessonPathMine({}, st)).toBe(core.lessonPathFor(st));
    const { w } = holds({}, st);
    expect(w.next!.id).toBe(core.FIRST_LESSON);
    expect(core.lessonNo(w.next!, st, {})).toBe(1);
  });
  it('on the night track too', () => {
    const st = mk({ freq: 'f3', when: ['late'] });
    expect(core.lessonPathMine({}, st)).toBe(core.lessonPathFor(st));
    holds({}, st);
  });
});

describe('someone who went in order', () => {
  it('walks the plan itself: the same path, lands and numbers as before this rule', () => {
    const st = mk();
    const plan = core.lessonPathFor(st);
    const days = one(plan.slice(0, 12).map((L) => L.id));
    expect(core.lessonPathMine(days, st)).toBe(plan);
    const { w } = holds(days, st);
    expect(w.next).toBe(plan[12]);
    expect(core.lessonNo(plan[12], st, days)).toBe(13);
  });
});

describe('a lesson read from Today or a help page, out of order', () => {
  it('slips in behind the person, and Up next stays the planned next one', () => {
    const st = mk();
    const plan = core.lessonPathFor(st);
    /* three in order, then the lesson a ridden-out urge brings (HOOK_RODE_LESSON), far down the plan */
    let days = one(plan.slice(0, 3).map((L) => L.id));
    days = add(days, core.HOOK_RODE_LESSON, '2026-09-20');
    const { w } = holds(days, st);
    expect(w.path.slice(0, 4).map((L) => L.id)).toEqual([...plan.slice(0, 3).map((L) => L.id), core.HOOK_RODE_LESSON]);
    expect(w.next).toBe(plan[3]);
    expect(core.lessonNo(plan[3], st, days)).toBe(5);
  });
});

describe('a history like the owner’s: many betas, the path reordered, a night track, God lessons turned on later', () => {
  const night = mk({ freq: 'f3', when: ['late'] });
  const faith = mk({ freq: 'f3', when: ['late'], faith: 'big' });
  const oldest = core.lessonPathsBefore()[0];
  const middle = core.lessonPathsBefore()[1];
  /* fifteen lessons in the oldest order, ten in the next one, a few the moments brought, then the night track's own front */
  const ids = [...new Set([...oldest.slice(0, 15), ...middle.slice(0, 10)].map((L) => L.id))];
  ids.push(core.HOOK_FREE_LESSON, core.HOOK_RODE_LESSON);
  const days = one([...new Set(ids)]);
  it('every finished lesson is behind the person, in the order finished, and Up next is the first one left on the plan', () => {
    for (const st of [night, faith]) {
      const { w } = holds(days, st);
      const plan = core.lessonPathFor(st);
      const fin = core
        .lessonsInOrder(days)
        .map((x) => x.L)
        .filter((L) => plan.indexOf(L) >= 0);
      expect(w.path.slice(0, fin.length)).toEqual(fin);
      expect(w.next).toBe(plan.find((L) => !w.done.has(L.id) && !w.passed.has(L.id)));
      expect(w.back).toBe(false);
    }
  });
  it('as more lessons are finished, the numbers and steps behind never move, and each step only fills up', () => {
    for (const st of [night, faith]) {
      let d = days;
      let before = core.lessonWalk(d, st);
      const place = (w: core.LessonWalk) => new Map(w.path.filter((L) => w.walked.has(L.id)).map((L, i) => [L.id, [i, core.landOfIn(w.path, L)]]));
      for (let i = 0; i < 20 && before.next; i++) {
        /* every fourth one is a lesson further on, read from a help page */
        const later = before.path.filter((L) => !before.done.has(L.id)).slice(-1 - (i % 3))[0];
        const L = i % 4 === 3 ? later : before.next;
        d = add(d, L.id, core.addDays('2026-11-01', i));
        const after = holds(d, st).w;
        const p0 = place(before);
        const p1 = place(after);
        p0.forEach((v, id) => expect(p1.get(id), id).toEqual(v));
        const s0 = core.stepProgress(before, L.id);
        const s1 = core.stepProgress(after, L.id);
        if (s0 && s1 && s0.name === s1.name) expect(s1.done).toBeGreaterThanOrEqual(s0.done);
        expect(core.lessonCount(after).done).toBe(core.lessonCount(before).done + 1);
        before = after;
      }
    }
  });
  it('a God lesson walked past waits at the end of the path, open in full, and never holds the path back', () => {
    const { w } = holds(days, faith);
    expect(w.passed.size).toBeGreaterThan(0);
    const tail = w.path.slice(-w.passed.size);
    expect(tail.every((L) => w.passed.has(L.id))).toBe(true);
    tail.forEach((L) => expect(core.lessonGate(L, w)).toBe('open'));
    expect(w.passed.has(w.next!.id)).toBe(false);
    /* the map says so: those stones are open, not waiting */
    const stones = core.lessonMap(w).lands.flatMap((l) => l.stones);
    expect(stones.filter((x) => x.free).map((x) => x.L.id)).toEqual(tail.map((L) => L.id));
  });
  it('the steps are cut by place, with the plan’s own sizes, so step 1 holds the first lessons walked', () => {
    for (const st of [night, faith]) {
      const w = core.lessonWalk(days, st);
      const mine = core.sectionsOf(w.path).map((x) => [x.u, x.lessons.length]);
      const plan = core.sectionsOf(core.lessonPathFor(st)).map((x) => [x.u, x.lessons.length]);
      expect(mine).toEqual(plan);
      expect(core.landOfIn(w.path, w.path[0])).toBe(core.sectionsOf(core.lessonPathFor(st))[0].u);
    }
  });
  it('checkpoints are numbered in the order walked, and one written keeps its number as the path goes on', () => {
    const st = night;
    let s = st;
    const due = core.lcheckDue(days, s);
    expect(due).toBeGreaterThan(0);
    expect(core.lcheckNo(due, s, days)).toBe(1);
    s = core.lwriteSave(s, due, 0, 'a line', 1);
    const w = core.lessonWalk(days, s);
    const d2 = add(days, w.next!.id, '2026-12-01');
    expect(core.lcheckNo(due, s, d2)).toBe(1);
  });
  it('nothing earned moves: points, level and badges come from the record, the same before and after', () => {
    const tk = '2026-11-15';
    const a = core.gameCompute(days, night, {}, tk);
    const b = core.gameCompute(days, faith, {}, tk);
    expect(a.rawPts).toBeGreaterThan(0);
    expect(b.rawPts).toBeGreaterThanOrEqual(a.rawPts);
    /* done marks: every lesson in the record stays done */
    expect(core.lessonsDone(days).size).toBe(new Set(ids).size);
  });
});
