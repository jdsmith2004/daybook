/* Lessons 33 to 41 and the lesson families: every lesson is whole, every claim names a source, each family is spread along
   the path with growing gaps, and recall follows the daily order. */
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
  if (L.act) out.push(L.act.h || '', L.act.p || '', L.act.ok || '', ...(L.act.go || []).map((g) => g.t));
  if (L.rc) out.push(L.rc.q, L.rc.r, ...L.rc.c, ...(L.rc.cr || []));
  return out;
};

it('there are 41 lessons, and the ids match the lesson list', () => {
  expect(core.LESSONS.map((L) => L.id)).toEqual(core.LESSON_IDS);
  expect(core.LESSON_IDS).toHaveLength(41);
  expect(NEW.map((L) => L.id)).toEqual(['l33', 'l34', 'l35', 'l36', 'l37', 'l38', 'l39', 'l40', 'l41']);
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
    expect((L.act?.go || []).length).toBeGreaterThan(0);
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
    (L.act?.go || []).forEach((g) => g.ic && ok(g.ic));
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

  it('the newer families come back after a longer gap each time', () => {
    const path = core.lessonPath('after').map((L) => L.id);
    ['hard', 'become'].forEach((id) => {
      const at = core.LESSON_FAMILIES.find((f) => f.id === id)!.ids.map((x) => path.indexOf(x));
      const gaps = at.slice(1).map((p, i) => p - at[i]);
      gaps.forEach((g) => expect(g).toBeGreaterThan(4));
      gaps.slice(1).forEach((g, i) => expect(g).toBeGreaterThanOrEqual(gaps[i]));
    });
  });

  it('the daily order has every lesson once, with the faith lessons where the person put them', () => {
    (['after', 'first', 'mix'] as const).forEach((m) => {
      const ids = core.lessonPath(m).map((L) => L.id);
      expect(ids.slice().sort()).toEqual(core.LESSON_IDS.slice().sort());
    });
    const after = core.lessonPath('after').map((L) => L.id);
    expect(after.slice(-4)).toEqual(['l29', 'l30', 'l31', 'l32']);
    expect(after.slice(0, 3)).toEqual(['l1', 'l2', 'l33']);
  });

  it('recall asks about the lesson before this one in the daily order', () => {
    const l2 = core.lessonById('l2')!;
    const l33 = core.lessonById('l33')!;
    expect(core.lessonRecallOf(l33, new Set(['l1', 'l2']))).toBe(l2);
    expect(core.lessonRecallOf(core.lessonById('l3')!, new Set(['l1', 'l2', 'l33']))).toBe(l33);
  });

  it('checkpoints stop at the last written one, so the new lessons never offer one that is not there', () => {
    expect(core.lessonPairOf(core.lessonById('l32')!)?.n).toBe(16);
    NEW.forEach((L) => expect(core.lessonPairOf(L)).toBeNull());
  });
});
