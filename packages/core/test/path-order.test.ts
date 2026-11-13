/* Lessons open one at a time, in the order of the path (the owner, October 24, 2026): Up next and every lesson behind it
   open in full; a lesson further on opens as its key idea; a lesson read before this rule stays finished with its points
   and comes back as a short welcome back when the path reaches it; checkpoints follow the path and keep their writing. */
import { describe, expect, it } from 'vitest';
import * as core from '../src/index';
import type { Days, Settings } from '../src/types';

const path = core.lessonPath();
const tk = '2026-10-20';
const st0 = (): Settings => core.normSettings({ ...core.defaultSettings('2026-09-01'), day1: '2026-09-08' });
/** a record where each list of lesson ids was finished on its own day, in turn */
function rec(...lists: string[][]): Days {
  const days: Days = {};
  lists.forEach((ls, i) => {
    const k = core.addDays('2026-09-10', i);
    days[k] = core.normDay({ p: { ls } }, k);
  });
  return days;
}
const ids = (n: number, from = 0) => path.slice(from, from + n).map((L) => L.id);
const finish = (days: Days, L: core.Lesson, k = tk) => core.recordLesson(days, k, L, 1).days;

describe('the unlock rule', () => {
  it('a new person: lesson 1 opens, the rest open as their key idea', () => {
    const w = core.lessonWalk({}, st0());
    expect(w.next).toBe(path[0]);
    expect(core.lessonGate(path[0], w)).toBe('open');
    path.slice(1).forEach((L) => expect(core.lessonGate(L, w)).toBe('key'));
  });
  it('finishing a lesson opens the next one, and every lesson behind it stays open to read again', () => {
    let days: Days = {};
    for (let i = 0; i < 6; i++) {
      const w = core.lessonWalk(days, st0());
      expect(w.next).toBe(path[i]);
      expect(w.back).toBe(false);
      path.slice(0, i).forEach((L) => expect(core.lessonGate(L, w)).toBe('open'));
      expect(core.lessonGate(path[i + 1], w)).toBe('key');
      days = finish(days, path[i]);
    }
    /* two in a row on one day is fine */
    expect(core.lessonsDone(days).size).toBe(6);
    expect(core.lessonsEarly(days).size).toBe(0);
  });
  it('the account rule stays on top: without one, the lesson after the free ones is Up next but waits behind it', () => {
    const days = rec(ids(core.LEARN_FREE));
    const w = core.lessonWalk(days, st0());
    const first = path[core.LEARN_FREE];
    expect(w.next).toBe(first);
    expect(core.lessonGate(first, w)).toBe('open');
    expect(core.lessonOpen(first, w.done, false)).toBe(false);
    expect(core.lessonOpen(first, w.done, true)).toBe(true);
  });
  it('with every lesson done in order, everything opens and nothing is next', () => {
    const w = core.lessonWalk(rec(ids(path.length)), st0());
    expect(w.next).toBeNull();
    path.forEach((L) => expect(core.lessonGate(L, w)).toBe('open'));
  });
});

describe('the key idea', () => {
  it('every lesson has one, and an answer that starts with yes or no comes with its question', () => {
    path.forEach((L) => {
      const k = core.lessonKeyIdea(L);
      expect(k.key.length).toBeGreaterThan(20);
      if (/^(Yes|No|Not mostly)\b/.test(k.key)) expect(k.ask.length).toBeGreaterThan(5);
    });
  });
  it('falls back to the tag when a key is missing', () => {
    const L = { ...path[0], key: '  ' };
    expect(core.lessonKeyIdea(L).key).toBe(L.tag);
  });
  it('seeing it changes nothing: the lesson is not done and no points move', () => {
    /* the key idea card writes nothing; the lesson after it is still the one to read */
    const days = rec(ids(2));
    const w = core.lessonWalk(days, st0());
    expect(core.lessonGate(path[10], w)).toBe('key');
    expect(w.done.has(path[10].id)).toBe(false);
  });
});

describe('lessons read early (before this rule)', () => {
  /* lessons 1 and 2, then lesson 9 from a help page, then 3 and 4 */
  const L9 = path[8];
  const days = rec(ids(2), [L9.id], ids(2, 2));
  it('are found from the order they were finished', () => {
    expect([...core.lessonsEarly(days)]).toEqual([L9.id]);
  });
  it('stay done with their points, and wait on the map like any later stone', () => {
    const w = core.lessonWalk(days, st0());
    expect(w.done.has(L9.id)).toBe(true);
    expect(w.next).toBe(path[4]);
    expect(core.lessonGate(L9, w)).toBe('key');
    const m = core.lessonMap(w);
    const all = m.lands.flatMap((l) => l.stones);
    expect(all.find((s) => s.L === L9)!.state).toBe('todo');
    const at = all.findIndex((s) => s.state === 'next');
    all.forEach((s, i) => expect(s.state === 'done').toBe(i < at));
  });
  it('when the path reaches one, it is Up next as a welcome back, and Today names it as usual', () => {
    let d = days;
    for (let i = 4; i < 8; i++) d = finish(d, path[i], core.addDays(tk, i));
    const k = core.addDays(tk, 9);
    const w = core.lessonWalk(d, st0());
    expect(w.next).toBe(L9);
    expect(w.back).toBe(true);
    expect(core.lessonGate(L9, w)).toBe('back');
    expect(core.lessonStop(d, st0(), k)).toMatchObject({ kind: 'next', L: L9, n: 9 });
    expect(core.lessonDue(d, st0(), k, true)).toBe(L9.id);
    expect(core.riskLesson(d, st0(), k, true)).toMatchObject({ L: L9, again: false });
    expect(core.nextAfter(L9, w)).toBe(path[9]);
    const st2 = core.lessonReach(st0(), L9.id);
    const w2 = core.lessonWalk(d, st2);
    expect(w2.next).toBe(path[9]);
  });
  it('"Keep going" moves the path on, with no new points, no lesson day and the same level', () => {
    let d = days;
    for (let i = 4; i < 8; i++) d = finish(d, path[i], core.addDays(tk, i));
    const k = core.addDays(tk, 9);
    const st = st0();
    const before = core.gameCompute(d, st, {}, k);
    const st2 = core.lessonReach(st, L9.id, 5);
    expect(core.lessonReach(st2, L9.id, 6)).toBe(st2);
    const after = core.gameCompute(d, st2, {}, k);
    expect(after.rawPts).toBe(before.rawPts);
    expect(after.pts).toBe(before.pts);
    expect(after.level.n).toBe(before.level.n);
    expect(core.lessonDoneOn(d[k]?.p)).toBe(false);
    const w = core.lessonWalk(d, st2);
    expect(w.next).toBe(path[9]);
    expect(w.walked.has(L9.id)).toBe(true);
    expect(core.lessonGate(L9, w)).toBe('open');
    /* the mark survives saving and loading, and an empty one is left out (so older records stay the same) */
    expect(core.normSettings(JSON.parse(JSON.stringify(st2))).learn.back).toEqual({ [L9.id]: 1 });
    expect('back' in core.normSettings(JSON.parse(JSON.stringify(st))).learn).toBe(false);
  });
  it('a re-read offered without an account is never one the path has not reached', () => {
    /* the free lessons, then lesson 20 early: the next one waits behind an account */
    const d = rec(ids(core.LEARN_FREE), [path[19].id]);
    for (let h = 0; h < 24; h++) {
      const o = core.nextUp(d, st0(), tk, new Date(2026, 9, 20, h, 30).getTime(), false);
      /* the next one says it waits for a free account (WP11); anything else offered is a free one */
      if (o.act === 'lesson' && o.s === 'Opens with a free account') expect(o.v).toBe(path[core.LEARN_FREE].id);
      else if (o.act === 'lesson') expect(ids(core.LEARN_FREE)).toContain(o.v);
    }
    const r = core.riskLesson(d, st0(), tk, false)!;
    expect(ids(core.LEARN_FREE)).toContain(r.L.id);
  });
  it('two read early in a row each get their welcome back, in path order', () => {
    const d = rec(ids(1), [path[2].id, path[1].id]);
    expect([...core.lessonsEarly(d)]).toEqual([path[2].id]);
    let st = st0();
    let w = core.lessonWalk(d, st);
    expect(w.next).toBe(path[2]);
    expect(w.back).toBe(true);
    st = core.lessonReach(st, path[2].id);
    w = core.lessonWalk(d, st);
    expect(w.next).toBe(path[3]);
    expect(w.back).toBe(false);
  });
});

describe('when the order of the path changed (October 30, 2026)', () => {
  /* the order before: How it works, Why it is hard, Shame and kindness, Making a plan, Faith, Skills, ... */
  const before = ['l1', 'l2', 'l3', 'l4', 'l33', 'l34', 'l35', 'l36', 'l5', 'l6', 'l7', 'l8', 'l9', 'l10', 'l11', 'l12', 'l29', 'l30', 'l31', 'l32'];
  const days = rec(before);
  it('nothing read in the old order counts as read early, so no welcome backs pile up', () => {
    expect(core.lessonsEarly(rec(...before.map((id) => [id]))).size).toBe(0);
    expect(core.lessonsEarly(days).size).toBe(0);
  });
  it('every finished lesson stays done, open and on the map, and Up next is the first one not read', () => {
    const w = core.lessonWalk(days, st0());
    expect(w.next?.id).toBe(path.find((L) => before.indexOf(L.id) < 0)!.id);
    expect(w.back).toBe(false);
    before.forEach((id) => {
      expect(w.done.has(id)).toBe(true);
      expect(core.lessonGate(core.lessonById(id)!, w)).toBe('open');
    });
    const all = core.lessonMap(w).lands.flatMap((l) => l.stones);
    expect(
      all
        .filter((s) => s.state === 'done')
        .map((s) => s.L.id)
        .sort(),
    ).toEqual([...before].sort());
    expect(core.lessonCount(w).done).toBe(before.length);
  });
  it('a lesson opened out of turn in every order is still read early', () => {
    expect([...core.lessonsEarly(rec(['l1', 'l2'], ['l29']))]).toEqual(['l29']);
  });
});

describe('when the path became the twelve steps (November 2, 2026)', () => {
  const [oldest, oct30] = core.lessonPathsBefore();
  it('the past orders are what they were', () => {
    expect(oldest.length).toBe(45);
    expect(oct30.length).toBe(49);
    expect(oct30.slice(0, 9).map((L) => L.id)).toEqual(['l1', 'l2', 'l3', 'l4', 'l46', 'l33', 'l34', 'l35', 'l36']);
    expect(oldest.slice(0, 8).map((L) => L.id)).toEqual(['l1', 'l2', 'l3', 'l4', 'l33', 'l34', 'l35', 'l36']);
  });
  /* a person who walked k lessons of a past order, one a day, then opens the new path: nothing finished drops, nothing earned
     moves, no welcome backs pile up, and Up next is the first lesson of the new path not read */
  [
    { name: 'October 30', order: oct30 },
    { name: 'before October 30', order: oldest },
  ].forEach(({ name, order }) =>
    it(`someone partway through the order of ${name} keeps everything, at every point along it`, () => {
      for (let k = 0; k <= order.length; k++) {
        const read = order.slice(0, k).map((L) => L.id);
        const d = rec(...read.map((id) => [id]));
        const st = st0();
        const w = core.lessonWalk(d, st);
        expect(w.early.size).toBe(0);
        expect(w.done.size).toBe(k);
        expect(core.lessonCount(w).done).toBe(k);
        expect(w.next).toBe(path.find((L) => read.indexOf(L.id) < 0) || null);
        read.forEach((id) => expect(core.lessonGate(core.lessonById(id)!, w)).toBe('open'));
        /* points come from the record, so they hold; one more lesson in the new order is not read early either */
        if (w.next) expect(core.lessonsEarly(finish(d, w.next, core.addDays('2026-09-10', k + 1))).size).toBe(0);
      }
    }),
  );
  it('points, level and badges are the same in any order', () => {
    const st = st0();
    const a = rec(...oct30.slice(0, 20).map((L) => [L.id]));
    const ids20 = oct30.slice(0, 20).map((L) => L.id);
    const b = rec(...path.filter((L) => ids20.indexOf(L.id) >= 0).map((L) => [L.id]));
    const k = '2026-10-15';
    const ga = core.gameCompute(a, st, {}, k);
    const gb = core.gameCompute(b, st, {}, k);
    expect(gb.rawPts).toBe(ga.rawPts);
    expect(gb.level.n).toBe(ga.level.n);
  });
  it('the two lessons off the path stay finished and counted, and open from Learn', () => {
    const d = rec(ids(3), ['l26']);
    const w = core.lessonWalk(d, st0());
    expect(w.path.some((L) => core.OFF_PATH.indexOf(L.id) >= 0)).toBe(false);
    expect(core.lessonCount(w)).toEqual({ done: 4, of: path.length + 1 });
    expect(core.lessonGate(core.lessonById('l27')!, w)).toBe('open');
    expect(core.lessonsEarly(d).size).toBe(0);
  });
});

describe('checkpoints follow the path', () => {
  it('each keeps its two lessons, the later one on the path, numbered in the order the path reaches them', () => {
    const order = core.lcheckOrder();
    expect([...order].sort((a, b) => a - b)).toEqual(Array.from({ length: core.LCHECK_N }, (_, i) => i + 1));
    order.forEach((n, i) => {
      const p = core.lcheckPair(n)!;
      expect([p.a.id, p.b.id].sort()).toEqual([core.LESSONS[2 * n - 2].id, core.LESSONS[2 * n - 1].id].sort());
      /* since the twelve steps, the two can sit apart, and one can be off the path: then it is a */
      expect(core.lessonNo(p.b)).toBeGreaterThan(core.lessonNo(p.a));
      expect(core.lcheckNo(n)).toBe(i + 1);
      expect(core.lessonPairOf(p.b)).toEqual(p);
      if (i) expect(core.lessonNo(p.b)).toBeGreaterThan(core.lessonNo(core.lcheckPair(order[i - 1])!.b));
    });
    expect(core.lcheckAbout(core.lcheckPair(1)!)).toBe('lessons 1 and 2');
    expect(core.lcheckAbout(core.lcheckPair(13)!)).toBe(
      'lesson ' + core.lessonNo(core.lessonById('l25')!) + ' and “SMART Recovery: four points and a toolbox”',
    );
  });
  it('the one due is the first on the path whose two lessons are reached and not written', () => {
    const st = st0();
    const upTo = (L: core.Lesson) => rec(path.slice(0, path.indexOf(L) + 1).map((x) => x.id));
    expect(core.lcheckDue(rec(ids(1)), st)).toBe(0);
    expect(core.lcheckDue(rec(ids(2)), st)).toBe(1);
    /* lessons 3 and 4 now sit in steps 1 and 3: their checkpoint waits until the path reaches lesson 4 */
    let w = core.lwriteSave(st, 1, 0, 'line', 1);
    expect(core.lcheckDue(upTo(core.lessonById('l3')!), w)).toBe(0);
    /* lessons 9 and 10 (Change the setting, If this then that) come just before it, so theirs is first */
    expect(core.lcheckDue(upTo(core.lessonById('l4')!), w)).toBe(5);
    w = core.lwriteSave(w, 5, 0, 'line', 1);
    expect(core.lcheckDue(upTo(core.lessonById('l4')!), w)).toBe(2);
    w = core.lwriteSave(w, 2, 0, 'line', 1);
    /* one off the path counts once it is finished */
    const to25 = upTo(core.lessonById('l25')!);
    expect(core.lcheckOrder().indexOf(13)).toBeGreaterThan(-1);
    expect(
      core.lcheckDue(to25, {
        ...w,
        learn: {
          ...w.learn,
          wr: Object.fromEntries(Array.from({ length: 16 }, (_, i) => ['c' + (i + 1), { a: ['x', '', ''], u: 1 }]).filter(([k]) => k !== 'c13')),
        },
      }),
    ).toBe(0);
    const with26 = { ...to25, '2026-12-30': core.normDay({ p: { ls: ['l26'] } }, '2026-12-30') };
    expect(
      core.lcheckDue(with26, {
        ...w,
        learn: {
          ...w.learn,
          wr: Object.fromEntries(Array.from({ length: 16 }, (_, i) => ['c' + (i + 1), { a: ['x', '', ''], u: 1 }]).filter(([k]) => k !== 'c13')),
        },
      }),
    ).toBe(13);
    /* both lessons read early do not bring a checkpoint before the path reaches them */
    expect(core.lcheckDue(rec(ids(1), ['l29', 'l30']), st)).toBe(0);
  });
  it('writing stays with the lessons it was written about, under its own record', () => {
    let st = st0();
    st = core.lwriteSave(st, 12, 0, 'The hour after dinner', 1);
    st = core.lwriteSave(st, 12, 2, 'Ask how they work', 2);
    const again = core.normSettings(JSON.parse(JSON.stringify(st)));
    expect(core.lwriteOf(again, 12)).toEqual(['The hour after dinner', '', 'Ask how they work']);
    expect(core.lcheckWritten(again, 12)).toBe(true);
    expect(core.LCHECKS[11].t).toBe('The empty hour and therapy');
    expect(core.lcheckPair(12)!.a.id).toBe('l23');
    expect(core.lcheckPair(12)!.b.id).toBe('l24');
  });
});

describe('the faith lessons follow the setup answer', () => {
  const path = core.lessonPath();
  const ans = (faith?: string) => core.normSettings({ ...core.defaultSettings('2026-10-01'), onb: { n: 1, at: 1, a: faith ? { faith } : {}, hist: [] } });
  const faithL = path.filter((L) => L.f);
  it('a skipped answer changes nothing', () => {
    for (const st of [ans(), core.normSettings(core.defaultSettings('2026-10-01'))]) {
      expect(core.faithOut(st)).toBe(false);
      expect(core.godOn(st)).toBe(false);
      expect(core.lessonPathFor(st)).toBe(path);
    }
  });
  it('Yes and Somewhat end each step in its God lesson, and keep the rest in order', () => {
    for (const st of [ans('big'), ans('some')]) {
      const mine = core.lessonPathFor(st);
      expect(mine.filter((L) => !core.isGod(L))).toEqual(path);
      expect(core.lessonSections(st).map((x) => x.lessons[x.lessons.length - 1].id)).toEqual(core.PATH_STEPS.map((s) => s.god));
      expect(core.lessonNo(core.lessonById('g1')!, st)).toBe(5);
    }
  });
  it('No leaves them out, keeps the order, and numbers the path without them', () => {
    const st = ans('no');
    const mine = core.lessonPathFor(st);
    expect(mine).toEqual(path.filter((L) => !L.f));
    expect(mine.length).toBe(path.length - faithL.length);
    const after = path[path.length - 1];
    expect(core.lessonNo(after, st)).toBe(core.lessonNo(after) - faithL.length);
    expect(core.lessonNo(faithL[0], st)).toBe(0);
    expect(core.lessonWalk({}, st).path).toBe(mine);
    expect(core.lessonMap(core.lessonWalk({}, st)).lands.flatMap((l) => l.stones).length).toBe(mine.length);
    expect(
      core
        .lessonTimeline({}, st)
        .coming.flatMap((x) => x.left)
        .some((L) => L.f),
    ).toBe(false);
  });
  it('a faith lesson still opens from Learn, and when finished stays finished and counted', () => {
    const st = ans('no');
    const L = faithL[0];
    const w0 = core.lessonWalk({}, st);
    expect(core.lessonGate(L, w0)).toBe('open');
    expect(core.nextAfter(L, w0)).toBe(w0.next);
    const days = { '2026-10-02': { p: { ls: [L.id] } } } as unknown as core.Days;
    const w = core.lessonWalk(days, st);
    expect(w.done.has(L.id)).toBe(true);
    expect(w.next).toBe(path[0]);
    expect(core.lessonCount(w)).toEqual({ done: 1, of: path.length - faithL.length + 1 });
    /* finishing it does not make the path stop anywhere */
    expect(core.lessonsEarly(days, st).size).toBe(0);
  });
  it('a re-read is never a God lesson for someone who did not choose them', () => {
    for (let i = 0; i < 61; i++) expect(core.isGod(core.reviewPick(core.addDays('2026-10-01', i), ans()))).toBe(false);
  });
  it('a re-read for a person who said No is never a faith lesson', () => {
    const st = ans('no');
    for (let i = 0; i < 60; i++) expect(core.reviewPick(core.addDays('2026-10-01', i), st).f).toBeFalsy();
  });
  it('checkpoint numbers do not skip over the faith lessons', () => {
    const st = ans('no');
    const nums = core
      .lcheckOrder()
      .filter((n) => !core.lcheckPair(n)!.b.f)
      .map((n) => core.lcheckNo(n, st));
    expect(nums).toEqual(nums.map((_, i) => i + 1));
  });
});

describe('the God lessons on the path (November 2, 2026)', () => {
  const st = core.normSettings({ ...core.defaultSettings('2026-10-01'), onb: { n: 1, at: 1, a: { faith: 'big', creed: 'lds' }, hist: [] } });
  const fin = (...ids: string[]) => ({ '2026-10-02': { p: { ls: ids } } }) as unknown as core.Days;
  it('a new person meets each one in its place', () => {
    const w = core.lessonWalk(fin('l1', 'l2', 'l3', 'l22'), st);
    expect(w.next!.id).toBe('g1');
    expect(core.lessonGate(core.lessonById('g1')!, w)).toBe('open');
    expect(core.lessonGate(core.lessonById('g2')!, w)).toBe('key');
  });
  it('someone already further on is not sent back: the ones behind them open in full and wait to be read', () => {
    const w = core.lessonWalk(fin('l1', 'l2', 'l3', 'l22', 'l33', 'l34', 'l20', 'l46', 'l10'), st);
    expect(w.next!.id).toBe('l9');
    expect([...w.passed]).toEqual(['g2', 'g1']);
    expect(core.lessonGate(core.lessonById('g1')!, w)).toBe('open');
    expect(core.lessonGate(core.lessonById('g3')!, w)).toBe('key');
    /* 64: five lessons that meet the night joined the path (WP11, November 12, 2026) */
    expect(core.lessonCount(w)).toEqual({ done: 9, of: 66 - 2 });
    const w2 = core.lessonWalk(fin('l1', 'l2', 'l3', 'l22', 'l33', 'l34', 'l20', 'l46', 'l10', 'g1'), st);
    expect(w2.passed.has('g1')).toBe(false);
    expect(core.lessonCount(w2)).toEqual({ done: 10, of: 64 });
    expect(core.walkOf(w.done, st).next!.id).toBe('l9');
  });
  it('the step deed comes after the God lesson for those who read it, and after the step for everyone else', () => {
    expect(core.deedAfter(core.lessonById('g1')!, st)).toBe(0);
    expect(core.deedAfter(core.lessonById('l22')!, st)).toBe(-1);
    expect(core.deedAfter(core.lessonById('l22')!, null)).toBe(0);
  });
  it('speak in the voice of the person’s faith', () => {
    const g7 = core.lessonById('g7')!;
    const close = (L: core.Lesson) => L.cards.find((c) => c.e === 'close')!.h;
    expect(core.lessonVoiced(g7, 'lds')).toBe(g7);
    expect(close(core.lessonVoiced(g7, 'plain'))).toMatch(/^God, /);
    expect(core.lessonVoiced(g7, 'christian').cards.find((c) => c.k === 'flip')!.see).toMatch(/new every morning/);
    expect(core.lessonVoiced(g7, 'plain')).toBe(core.lessonVoiced(g7, 'plain'));
    const V = core.lessonVoiced(g7, 'plain');
    expect(core.lessonBeats(V)!.cards.length).toBe(V.cards.length);
    expect(core.lessonVoiced(core.lessonById('l1')!, 'plain')).toBe(core.lessonById('l1'));
  });
  it('a finished one is kept in the record, and is never taken off by an older app', () => {
    const had = core.normDay(fin('l1', 'g1')['2026-10-02'], '2026-10-02');
    expect(core.lessonsDone({ '2026-10-02': had }).has('g1')).toBe(true);
    const older = { ...had, p: { ...had.p!, ls: ['l1'] } } as core.Day;
    expect(core.keepNewer(older, had).p!.ls).toEqual(['l1', 'g1']);
    expect(core.keepNewer({ ...had, p: null } as unknown as core.Day, had).p!.ls).toEqual(['l1', 'g1']);
  });
});

it('a God lesson in another voice sits on the path where its own does', () => {
  const st = core.normSettings({ ...core.defaultSettings('2026-10-01'), onb: { n: 1, at: 1, a: { faith: 'some', creed: 'other' }, hist: [] } });
  const g1 = core.lessonById('g1')!;
  const V = core.lessonVoiced(g1, core.faithVoice(st));
  expect(V).not.toBe(g1);
  const w = core.lessonWalk({ '2026-10-02': { p: { ls: ['l1', 'l2', 'l3', 'l22'] } } } as unknown as core.Days, st);
  expect(core.lessonNo(V, st)).toBe(5);
  expect(core.lessonGate(V, w)).toBe('open');
  expect(core.nextAfter(V, w)!.id).toBe('l33');
  expect(core.deedAfter(V, st)).toBe(0);
  /* g1 is lesson 5 of this path, among the first seven open without an account */
  expect(core.lessonOpen(V, new Set(), false, st)).toBe(true);
});
