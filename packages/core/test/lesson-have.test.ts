/* "I already do this" (the owner, November 21, 2026: "where the phone sleeps. I already do that ... it keeps giving me that lesson,
   and it just feels stupid"). A yes moves the lesson aside: never Up next, waiting at the end of the path open in full, earning nothing. */
import { describe, expect, it } from 'vitest';
import * as core from '../src/index';
import type { Days, Settings } from '../src/types';

const mk = (a: Record<string, unknown> = {}): Settings =>
  core.normSettings({ ...core.defaultSettings('2026-09-01'), day1: '2026-09-08', onb: { a } } as unknown as Settings);
const one = (ids: string[], from = '2026-09-10'): Days => {
  const days: Days = {};
  ids.forEach((id, i) => {
    const k = core.addDays(from, i);
    days[k] = core.normDay({ p: { ls: [id] } }, k);
  });
  return days;
};

describe('I already do this', () => {
  const night = mk({ freq: 'f3', when: ['late'] });
  const plan = core.lessonPathFor(night).map((L) => L.id);
  const at = plan.indexOf('l55');
  const before = plan.slice(0, at);
  const days = one(before);

  it('the phone lesson is on the night track, and Up next once the lessons before it are read', () => {
    expect(at).toBeGreaterThan(0);
    expect(at).toBeLessThan(core.FRONT_N);
    expect(core.lessonWalk(days, night).next!.id).toBe('l55');
    expect(core.haveOf('l55')).toBe('phone');
  });

  it('a yes moves it aside: the next lesson is Up next, and it waits at the end, open in full', () => {
    const st = core.lessonHave(night, 'phone');
    expect(core.hasHave(st, 'phone')).toBe(true);
    const w = core.lessonWalk(days, st);
    expect(w.next!.id).toBe(plan[at + 1]);
    expect(w.path[w.path.length - 1].id).toBe('l55');
    expect(w.skip.has('l55')).toBe(true);
    expect(core.lessonGate(core.lessonById('l55')!, w)).toBe('open');
    /* after the lesson before it, Next goes past it */
    expect(core.nextAfter(core.lessonById(plan[at - 1])!, core.lessonWalk(one(before.slice(0, -1)), st))!.id).toBe(plan[at + 1]);
    /* nothing is earned for it */
    expect(w.done.has('l55')).toBe(false);
  });

  it('a lesson already finished stays where it is', () => {
    const st = core.lessonHave(night, 'phone');
    const d = one([...before, 'l55']);
    const w = core.lessonWalk(d, st);
    expect(w.skip.size).toBe(0);
    expect(w.path.map((L) => L.id).indexOf('l55')).toBe(at);
  });

  it('is kept by normSettings and by a merge from either side, and unknown keys are dropped', () => {
    const st = core.lessonHave(night, 'phone');
    expect(core.normSettings(st).learn.have).toEqual({ phone: 1 });
    const odd = core.normSettings({ ...night, learn: { ...night.learn, have: { nope: 1 } } } as unknown as Settings);
    expect(odd.learn.have).toBeUndefined();
    expect(core.normSettings(night).learn.have).toBeUndefined();
  });

  it('every have key names lessons that exist', () => {
    core.HAVE_KEYS.forEach((k) => core.HAVE[k].ids.forEach((id) => expect(core.lessonById(id), id).toBeTruthy()));
  });
});
