/* The lesson map on Learn: the lessons as stepping stones on one path, a land for each section, top to bottom in the order
   of the path. Each land has its picture (section-art) on a little hill beside the stones and a small stand of trees; the
   next lesson's name sits beside its stone, so the picture and the trees move out of its way. The map is laid out on a
   phone-wide page, MAP_W across; the app scales it to the screen. */
import { firstUndone, lessonSections, type Lesson } from './lessons';

export const MAP_W = 390;
/** room above a land's first stone (its hills and signpost), between stones, below its last stone, above the first land,
    and below the last land (the trophy at the end of the path) */
const HEAD = 146;
const STEP = 118;
const TAIL = 80;
const TOP = 40;
const END_ROOM = 180;
/** how far each stone steps to the side, in turn, so the path winds */
const SWAY = [0, -56, 6, 52, 2];

export type StoneState = 'done' | 'next' | 'todo';
export interface MapStone {
  L: Lesson;
  /** its place in its land */
  j: number;
  x: number;
  y: number;
  state: StoneState;
}
export interface MapLand {
  /** the section (LUNITS index) and its place on the path */
  u: number;
  k: number;
  top: number;
  bottom: number;
  /** the picture is on the right, and the stones wind down the left half (or the other way round) */
  right: boolean;
  stones: MapStone[];
  done: number;
  /** the center of the picture, and the foot of the trees */
  pic: { x: number; y: number };
  tree: { x: number; y: number };
}
export interface LessonMap {
  lands: MapLand[];
  height: number;
  /** the trophy at the end of the path */
  end: { x: number; y: number };
  next: MapStone | null;
  /** every stone's center in order, then the trophy */
  road: [number, number][];
  /** how far along the road has been walked: the index of the next stone (the trophy once every lesson is done) */
  walked: number;
  /** the stretches of road walked, as [from, to] places on the road: between two finished lessons, and from a finished
      lesson to the next one. Lessons done out of order make their own stretches further along. */
  gold: [number, number][];
  /** the stretches still ahead */
  plain: [number, number][];
}

export function lessonMap(done: Set<string>): LessonMap {
  const nx = firstUndone(done);
  let y = TOP;
  let next: MapStone | null = null;
  const lands = lessonSections().map(({ u, lessons }, k): MapLand => {
    const top = y;
    const right = k % 2 === 0;
    const base = right ? 138 : 252;
    const stones = lessons.map((L, j): MapStone => {
      const s: MapStone = {
        L,
        j,
        x: base + (right ? 1 : -1) * SWAY[j % SWAY.length],
        y: top + HEAD + j * STEP,
        state: done.has(L.id) ? 'done' : L === nx ? 'next' : 'todo',
      };
      if (s.state === 'next') next = s;
      return s;
    });
    y = stones[stones.length - 1].y + TAIL;
    /* the picture sits beside the first two stones, unless the next lesson is one of them: then beside the third and fourth */
    const n = stones.find((s) => s.state === 'next');
    const low = !!n && n.j < 2;
    const at = (a: number) => (stones[a].y + stones[Math.min(a + 1, stones.length - 1)].y) / 2 + 14;
    const side = right ? 296 : 94;
    const pic = { x: side, y: low ? at(2) : at(0) };
    /* the trees stand on the same side, beside a stone the picture does not cover and away from the next lesson's name */
    const t = (low ? [0, 1] : [3, 4, 2]).find((a) => a < stones.length && (!n || a !== n.j))!;
    const tree = { x: right ? 334 : 60, y: stones[t].y + 34 };
    return { u, k, top, bottom: y, right, stones, done: stones.filter((s) => s.state === 'done').length, pic, tree };
  });
  const height = y + END_ROOM;
  const end = { x: MAP_W / 2, y: height - 90 };
  const road: [number, number][] = lands.flatMap((l) => l.stones.map((s): [number, number] => [s.x, s.y])).concat([[end.x, end.y]]);
  const all = lands.flatMap((l) => l.stones);
  const found = next as MapStone | null;
  const fin = (i: number) => (i < all.length ? all[i].state === 'done' : all.every((s) => s.state === 'done'));
  const gold: [number, number][] = [];
  const plain: [number, number][] = [];
  for (let i = 0; i < road.length - 1; i++) {
    const on = fin(i) && (fin(i + 1) || (i + 1 < all.length && all[i + 1].state === 'next'));
    const runs = on ? gold : plain;
    const last = runs[runs.length - 1];
    if (last && last[1] === i) last[1] = i + 1;
    else runs.push([i, i + 1]);
  }
  return { lands, height, end, next: found, road, walked: found ? all.indexOf(found) : road.length - 1, gold, plain };
}

/** a smooth line through the points (Catmull-Rom, drawn as cubic Beziers), from point a to point b. A part drawn on its own
    lies exactly on the whole line, so the walked part and the rest meet. */
export function roadPath(pts: [number, number][], a = 0, b = pts.length - 1): string {
  const f = (v: number) => String(Math.round(v * 10) / 10);
  let d = `M${f(pts[a][0])} ${f(pts[a][1])}`;
  for (let i = a; i < b; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d;
}
