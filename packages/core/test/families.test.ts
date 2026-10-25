/* Lessons 33 to 45 and the lesson families: every lesson is whole, every claim names a source, the path goes a section at a
   time, and recall follows the path. */
import { describe, expect, it } from 'vitest';
import * as core from '../src/index';
import type { Lesson } from '../src/lessons';

const NEW = core.LESSONS.filter((L) => Number(L.id.slice(1)) > 32);
/* contractions, but not possessives ("tonight’s") or the titles of sources */
const CONTRACTION = /\b\w+n[’']t\b|\b(I|you|we|they|it|that|what|there|here|let)[’'](m|re|ve|ll|d|s)\b/i;
const words = (L: Lesson): string[] => {
  const out: string[] = [L.title, L.tag, L.ask || '', L.key, L.np, L.scope || ''];
  L.cards.forEach((c) => {
    out.push(c.h, c.ask || '', c.so || '', c.el || '');
    (c.b || []).forEach((b) => (b[0] === 'p' || b[0] === 'q' ? out.push(b[1] as string) : b[0] === 'l' ? out.push(...(b[1] as string[])) : null));
    (c.c || []).forEach(([a, r]) => out.push(a, r));
  });
  if (L.rc) out.push(L.rc.q, L.rc.r, ...L.rc.c, ...(L.rc.cr || []));
  return out;
};

it('there are 45 lessons, and the ids match the lesson list', () => {
  expect(core.LESSONS.map((L) => L.id)).toEqual(core.LESSON_IDS);
  expect(core.LESSON_IDS).toHaveLength(45);
  expect(NEW.map((L) => L.id)).toEqual(['l33', 'l34', 'l35', 'l36', 'l37', 'l38', 'l39', 'l40', 'l41', 'l42', 'l43', 'l44', 'l45']);
});

it('a finished new lesson is kept in the day record and counts', () => {
  const d = core.normDay({ p: { ls: ['l33', 'l40', 'l99'] } }, '2026-10-15');
  expect(d.p?.ls).toEqual(['l33', 'l40']);
});

it('the "Thirty-two lessons" badge still asks for 32, so nobody loses it when lessons are added', () => {
  const b = (core as unknown as { BADGES: { id: string; name: string; goal: number }[] }).BADGES.find((x) => x.id === 'learn-32')!;
  expect([b.name, b.goal]).toEqual(['Thirty-two lessons', 32]);
});

describe.each(NEW.map((L) => [L.id, L] as const))('%s', (_id, L) => {
  it('follows the lesson standard: hook, guess, answer, the science, a move, and a check', () => {
    expect(L.v).toBe(2);
    expect(core.LUNITS[L.u]).toBeTruthy();
    expect(L.cards.map((c) => c.e)).toEqual(expect.arrayContaining(['hook', 'predict', 'answer', 'proof', 'move', 'check']));
    expect(L.cards[0].e).toBe('hook');
    expect(L.cards[L.cards.length - 1].e).toBe('check');
    L.cards
      .filter((c) => c.k === 'choose')
      .forEach((c) => {
        expect(c.c).toHaveLength(4);
        expect(c.a).toBeGreaterThanOrEqual(0);
        expect(c.a).toBeLessThan(4);
      });
    expect(L.rc && L.rc.c.length === 4 && L.rc.cr && L.rc.cr.length === 4).toBe(true);
    expect(L.rc!.a).toBeLessThan(4);
    expect(core.lessonPractice(L)).toBeTruthy();
    expect(L.scope).toBeTruthy();
  });

  it('every source is filled in, and every science card points at one', () => {
    expect(L.src.length).toBeGreaterThan(0);
    L.src.forEach(([name, url]) => {
      expect(name).toBeTruthy();
      expect(url).toMatch(/^https:\/\//);
    });
    L.cards
      .filter((c) => c.e === 'proof')
      .forEach((c) => {
        expect(c.fact && c.fact.i && c.fact.i.length).toBeTruthy();
        c.fact!.i!.forEach((i) => expect(L.src[i]).toBeTruthy());
      });
  });

  it('uses only icons that exist', () => {
    const ok = (n: string) => expect(Object.keys(core.ICO)).toContain(n);
    ok(L.ic);
    L.cards.forEach((c) => {
      if (c.art && c.art[0] === 'icon' && c.art[1].ic) ok(c.art[1].ic);
      if (c.art && c.art[0] === 'chain') (c.art[1].i || []).forEach(ok);
    });
  });

  it('has no contractions', () => {
    words(L).forEach((w) => expect(w).not.toMatch(CONTRACTION));
  });
});

describe('families', () => {
  it('every lesson in a family exists, and no lesson is in two', () => {
    const all = core.LESSON_FAMILIES.flatMap((f) => f.ids);
    all.forEach((id) => expect(core.lessonById(id)).toBeTruthy());
    expect(new Set(all).size).toBe(all.length);
  });

  it('a lesson knows its family and its place in it', () => {
    expect(core.lessonFamily(core.lessonById('l34')!)).toMatchObject({ n: 2, of: 4, f: { name: 'Why it is hard to stop' } });
    expect(core.lessonFamily(core.lessonById('l1')!)).toBeNull();
  });

  it('the path goes one section at a time, each section once, with faith after Making a plan', () => {
    const ids = core.lessonPath().map((L) => L.id);
    expect(ids.slice().sort()).toEqual(core.LESSON_IDS.slice().sort());
    const units = core.lessonSections().map((x) => x.u);
    expect(new Set(units).size).toBe(units.length);
    expect(units).toEqual(core.UNIT_ORDER);
    expect(ids.slice(0, 8)).toEqual(['l1', 'l2', 'l3', 'l4', 'l33', 'l34', 'l35', 'l36']);
    expect(units.indexOf(7)).toBe(units.indexOf(2) + 1);
    expect(ids.slice(16, 20)).toEqual(['l29', 'l30', 'l31', 'l32']);
    expect(core.lessonNo(core.lessonById('l29')!)).toBe(17);
  });

  it('sections next to each other on the path have different colors', () => {
    /* the accent and violet tints look alike, so they count as one color here */
    const tones = core.lessonSections().map((x) => core.LUNITS[x.u].tone.replace('accent', 'violet'));
    tones.slice(1).forEach((t, i) => expect(t).not.toBe(tones[i]));
  });

  it('the timeline shows lessons in the order they were finished, then Up next, then the rest by section', () => {
    const days = {
      '2026-10-02': core.normDay({ p: { ls: ['l33', 'l1'] } }, '2026-10-02'),
      '2026-10-01': core.normDay({ p: { ls: ['l2'] } }, '2026-10-01'),
      '2026-10-03': core.normDay({ p: { ls: ['l1'], lv: ['l2'] } }, '2026-10-03'),
    };
    const tl = core.lessonTimeline(days);
    expect(tl.past.map((x) => [x.L.id, x.k])).toEqual([
      ['l2', '2026-10-01'],
      ['l33', '2026-10-02'],
      ['l1', '2026-10-02'],
    ]);
    /* l2 and l33 were finished before the path reached them: Up next is l2, as a welcome back, and l33 waits */
    expect(tl.next?.id).toBe('l2');
    expect(tl.coming[0]).toMatchObject({ u: 0, n: 4, done: 1 });
    expect(tl.coming[0].left.map((L) => L.id)).toEqual(['l3', 'l4']);
    expect(tl.coming[1]).toMatchObject({ u: 8, done: 0 });
    expect(tl.coming.flatMap((x) => x.left).length + 1 + 1).toBe(core.LESSONS.length);
  });

  it('recall asks about the lesson before this one on the path', () => {
    const l2 = core.lessonById('l2')!;
    const l4 = core.lessonById('l4')!;
    const l33 = core.lessonById('l33')!;
    expect(core.lessonRecallOf(core.lessonById('l3')!, new Set(['l1', 'l2']))).toBe(l2);
    expect(core.lessonRecallOf(l33, new Set(['l1', 'l2', 'l3', 'l4']))).toBe(l4);
  });

  it('checkpoints stop at the last written one, so the new lessons never offer one that is not there', () => {
    expect(core.lessonPairOf(core.lessonById('l32')!)?.n).toBe(16);
    NEW.forEach((L) => expect(core.lessonPairOf(L)).toBeNull());
  });
});
