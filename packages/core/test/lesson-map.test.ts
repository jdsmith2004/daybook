/* The lesson map: one land per section in the order of the path, every lesson a stone, the next lesson marked, and the
   picture and trees never in the way of the stones or of the next lesson's name. Every section has its own picture. */
import { describe, expect, it } from 'vitest';
import * as core from '../src/index';

const path = core.lessonPath();
const doneUpTo = (n: number) => new Set(path.slice(0, n).map((L) => L.id));
/** where the next lesson's name goes: beside its stone, toward the middle of the page */
const label = (land: core.MapLand, s: core.MapStone) =>
  land.right ? { x0: s.x + 46, x1: core.MAP_W - 8, y0: s.y - 38, y1: s.y + 38 } : { x0: 8, x1: s.x - 46, y0: s.y - 38, y1: s.y + 38 };
const hitsBox = (cx: number, cy: number, r: number, b: { x0: number; x1: number; y0: number; y1: number }) =>
  cx + r > b.x0 && cx - r < b.x1 && cy + r > b.y0 && cy - r < b.y1;

describe('the lesson map', () => {
  it('has a land for each section, in the order of the path, and a stone for every lesson', () => {
    const m = core.lessonMap(new Set());
    expect(m.lands.map((l) => l.u)).toEqual(core.lessonSections().map((s) => s.u));
    expect(m.lands.flatMap((l) => l.stones.map((s) => s.L.id))).toEqual(path.map((L) => L.id));
    expect(m.road).toHaveLength(path.length + 1);
  });
  it('lands follow one another, and stones stay on the page', () => {
    const m = core.lessonMap(new Set());
    m.lands.forEach((l, i) => {
      if (i) expect(l.top).toBe(m.lands[i - 1].bottom);
      l.stones.forEach((s) => {
        expect(s.x).toBeGreaterThanOrEqual(60);
        expect(s.x).toBeLessThanOrEqual(core.MAP_W - 60);
        expect(s.y).toBeGreaterThan(l.top + 100);
        expect(s.y).toBeLessThan(l.bottom);
      });
    });
    expect(m.end.y).toBeGreaterThan(m.lands[m.lands.length - 1].bottom);
    expect(m.height).toBeGreaterThan(m.end.y);
  });
  it('marks the first lesson not done as next, also when lessons were done out of order', () => {
    const done = new Set([path[0].id, path[1].id, path[5].id]);
    const m = core.lessonMap(done);
    expect(m.next?.L.id).toBe(path[2].id);
    const all = m.lands.flatMap((l) => l.stones);
    expect(all.filter((s) => s.state === 'next')).toHaveLength(1);
    expect(all.filter((s) => s.state === 'done').map((s) => s.L.id)).toEqual([path[0].id, path[1].id, path[5].id]);
    expect(m.walked).toBe(2);
  });
  it('the road walked lights up between finished lessons, also ones done out of order', () => {
    const N = path.length;
    expect(core.lessonMap(doneUpTo(5)).gold).toEqual([[0, 5]]);
    expect(core.lessonMap(doneUpTo(5)).plain).toEqual([[5, N]]);
    /* lessons 1 and 2 in order, then 6 and 7 from a check-in or a help page, and 30 on its own */
    const m = core.lessonMap(new Set([path[0].id, path[1].id, path[5].id, path[6].id, path[29].id]));
    expect(m.next?.L.id).toBe(path[2].id);
    expect(m.gold).toEqual([
      [0, 2],
      [5, 6],
    ]);
    expect(m.plain).toEqual([
      [2, 5],
      [6, N],
    ]);
    expect(core.lessonMap(new Set()).gold).toEqual([]);
  });
  it('after any lesson, Next is the same Up next as the map and Today', () => {
    const done = new Set([path[0].id, path[1].id]);
    expect(core.nextAfter(path[2], done)?.id).toBe(path[3].id);
    /* a lesson done out of order points back to the first one not done */
    expect(core.nextAfter(path[25], done)?.id).toBe(path[2].id);
    expect(core.nextAfter(path[25], done)?.id).toBe(core.lessonMap(new Set([...done, path[25].id])).next?.L.id);
    /* reading a finished lesson again */
    expect(core.nextAfter(path[0], done)?.id).toBe(path[2].id);
    expect(core.nextAfter(path[path.length - 1], doneUpTo(path.length - 1))).toBeNull();
  });
  it('with every lesson done, nothing is next and the whole road is walked', () => {
    const m = core.lessonMap(doneUpTo(path.length));
    expect(m.next).toBeNull();
    expect(m.walked).toBe(m.road.length - 1);
    expect(m.gold).toEqual([[0, m.road.length - 1]]);
    expect(m.plain).toEqual([]);
  });
  it.each(path.map((L, i) => [i + 1, L.title, i] as const))('lesson %s next (%s): the picture and trees stay out of the way', (_n, _t, i) => {
    const m = core.lessonMap(doneUpTo(i));
    const land = m.lands.find((l) => l.stones.some((s) => s.state === 'next'))!;
    const nx = m.next!;
    m.lands.forEach((l) => {
      l.stones.forEach((s) => {
        expect(Math.hypot(l.pic.x - s.x, l.pic.y - s.y)).toBeGreaterThan(66 + 40);
        expect(Math.hypot(l.tree.x - s.x, l.tree.y - 34 - s.y)).toBeGreaterThan(36 + 40);
      });
    });
    const b = label(land, nx);
    expect(hitsBox(land.pic.x, land.pic.y, 66, b)).toBe(false);
    expect(hitsBox(land.tree.x, land.tree.y - 34, 34, b)).toBe(false);
    expect(b.x1 - b.x0).toBeGreaterThanOrEqual(130);
  });
  it('draws the road as one smooth line, and a part of it on the same line', () => {
    const m = core.lessonMap(new Set());
    const all = core.roadPath(m.road);
    expect(all.startsWith('M')).toBe(true);
    expect(all.match(/C/g)).toHaveLength(m.road.length - 1);
    const part = core.roadPath(m.road, 2, 5);
    expect(all).toContain(part.slice(part.indexOf('C')));
  });
});

describe('the section pictures', () => {
  it('every section has its own picture, and the ids carry the prefix', () => {
    const us = core.lessonSections().map((s) => s.u);
    const names = new Set(us.map((u) => core.SECTION_ART[u]));
    expect(names.size).toBe(us.length);
    us.forEach((u) => {
      const x = core.sectionArtXml(u, 'zz' + u);
      expect(x.startsWith('<svg viewBox="0 0 120 120">')).toBe(true);
      (x.match(/id="([^"]+)"/g) || []).forEach((m) => expect(m).toContain('zz' + u));
      (x.match(/url\(#([^)]+)\)/g) || []).forEach((m) => expect(m).toContain('zz' + u));
      expect((x.match(/<svg/g) || []).length).toBe(1);
    });
  });
});
