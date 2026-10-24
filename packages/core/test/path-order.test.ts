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
  it('the account rule stays on top: without one, lesson 4 is Up next but waits behind it', () => {
    const days = rec(ids(3));
    const w = core.lessonWalk(days, st0());
    expect(w.next).toBe(path[3]);
    expect(core.lessonGate(path[3], w)).toBe('open');
    expect(core.lessonOpen(path[3], w.done, false)).toBe(false);
    expect(core.lessonOpen(path[3], w.done, true)).toBe(true);
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
    /* the welcome back asks lesson 9's own question; lesson 10 then skips it when it was answered there today */
    expect(core.lessonBackRecall(L9)).toBe(L9);
    expect(core.nextAfter(L9, w)).toBe(path[9]);
    const st2 = core.lessonReach(st0(), L9.id);
    const w2 = core.lessonWalk(d, st2);
    expect(w2.next).toBe(path[9]);
    expect(core.lessonRecallOf(path[9], w2.done)).toBe(L9);
    expect(core.lessonRecallOf(path[9], w2.done, new Set([L9.id]))).toBeNull();
  });
  it('every lesson has its own recall question, for its welcome back', () => {
    path.forEach((L) => expect(core.lessonBackRecall(L)).toBe(L));
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
    /* lessons 1 to 3, then lesson 20 early: lesson 4 waits behind an account */
    const d = rec(ids(3), [path[19].id]);
    for (let h = 0; h < 24; h++) {
      const o = core.nextUp(d, st0(), tk, new Date(2026, 9, 20, h, 30).getTime(), false);
      if (o.act === 'lesson') expect(ids(3)).toContain(o.v);
    }
    const r = core.riskLesson(d, st0(), tk, false)!;
    expect(ids(3)).toContain(r.L.id);
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

describe('checkpoints follow the path', () => {
  it('each keeps its two lessons, one section, side by side on the path', () => {
    const order = core.lcheckOrder();
    expect([...order].sort((a, b) => a - b)).toEqual(Array.from({ length: core.LCHECK_N }, (_, i) => i + 1));
    order.forEach((n, i) => {
      const p = core.lcheckPair(n)!;
      expect([p.a.id, p.b.id].sort()).toEqual([core.LESSONS[2 * n - 2].id, core.LESSONS[2 * n - 1].id].sort());
      expect(p.a.u).toBe(p.b.u);
      expect(core.lessonNo(p.b)).toBe(core.lessonNo(p.a) + 1);
      expect(core.lcheckNo(n)).toBe(i + 1);
      expect(core.lessonPairOf(p.b)).toEqual(p);
      if (i) expect(core.lessonNo(p.b)).toBeGreaterThan(core.lessonNo(core.lcheckPair(order[i - 1])!.b));
    });
    /* the faith section comes before Skills for the moment on the path, so its checkpoints do too */
    expect(core.lcheckNo(15)).toBeLessThan(core.lcheckNo(7));
  });
  it('the one due is the first on the path whose two lessons are reached and not written', () => {
    const st = st0();
    const upTo = (L: core.Lesson) => rec(path.slice(0, path.indexOf(L) + 1).map((x) => x.id));
    expect(core.lcheckDue(rec(ids(1)), st)).toBe(0);
    expect(core.lcheckDue(rec(ids(2)), st)).toBe(1);
    /* through the faith section: checkpoints 1 to 6 written, so 15 is next, before 7 */
    let w = st;
    for (let n = 1; n <= 6; n++) w = core.lwriteSave(w, n, 0, 'line ' + n, 1);
    expect(core.lcheckDue(upTo(core.lessonById('l32')!), w)).toBe(15);
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
