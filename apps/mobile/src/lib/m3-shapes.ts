/* The Material 3 Expressive shapes, drawn the way Android draws them. A port of androidx.graphics.shapes (RoundedPolygon,
   CornerRounding, star, rectangle) and the 35 shapes in Compose Material 3's MaterialShapes.kt, with their exact
   vertices and roundings. Copyright The Android Open Source Project, Apache License 2.0; ported to TypeScript for Daybook.
   Pure geometry with no React: shapePath gives an SVG path that fills a square box, and shapePoints gives evenly spaced
   points around the outline, for morphing one shape into another. */

type Pt = [number, number];
/** a corner's rounding: radius (in the shape's own units), and smoothing (0 is a circular arc, 1 eases in fully) */
type Round = { r: number; s: number };
const SHARP: Round = { r: 0, s: 0 };
const rd = (r: number, s = 0): Round => ({ r, s });
type Cubic = [Pt, Pt, Pt, Pt];

const add = (a: Pt, b: Pt): Pt => [a[0] + b[0], a[1] + b[1]];
const sub = (a: Pt, b: Pt): Pt => [a[0] - b[0], a[1] - b[1]];
const mul = (a: Pt, k: number): Pt => [a[0] * k, a[1] * k];
const len = (a: Pt) => Math.hypot(a[0], a[1]);
const norm = (a: Pt): Pt => {
  const l = len(a);
  return l > 1e-9 ? [a[0] / l, a[1] / l] : [0, 0];
};
const dot = (a: Pt, b: Pt) => a[0] * b[0] + a[1] * b[1];
const lerp = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const rot90 = (a: Pt): Pt => [-a[1], a[0]];
const line = (a: Pt, b: Pt): Cubic => [a, lerp(a, b, 1 / 3), lerp(a, b, 2 / 3), b];

/* where the line through p0 along d0 meets the line through p1 along d1 */
function meet(p0: Pt, d0: Pt, p1: Pt, d1: Pt): Pt | null {
  const det = d0[0] * d1[1] - d0[1] * d1[0];
  if (Math.abs(det) < 1e-6) return null;
  const k = ((p1[0] - p0[0]) * d1[1] - (p1[1] - p0[1]) * d1[0]) / det;
  return add(p0, mul(d0, k));
}

/* a circular arc around c from a to b (the short way), as cubics of at most 90 degrees each */
function arc(c: Pt, a: Pt, b: Pt, r: number): Cubic[] {
  const a0 = Math.atan2(a[1] - c[1], a[0] - c[0]);
  let sweep = Math.atan2(b[1] - c[1], b[0] - c[0]) - a0;
  while (sweep > Math.PI) sweep -= 2 * Math.PI;
  while (sweep < -Math.PI) sweep += 2 * Math.PI;
  if (Math.abs(sweep) < 1e-6) return [];
  const n = Math.ceil(Math.abs(sweep) / (Math.PI / 2));
  const step = sweep / n;
  const k = (4 / 3) * Math.tan(step / 4);
  const out: Cubic[] = [];
  for (let i = 0; i < n; i++) {
    const t0 = a0 + step * i;
    const t1 = t0 + step;
    const p0: Pt = [c[0] + r * Math.cos(t0), c[1] + r * Math.sin(t0)];
    const p3: Pt = [c[0] + r * Math.cos(t1), c[1] + r * Math.sin(t1)];
    out.push([p0, [p0[0] - k * r * Math.sin(t0), p0[1] + k * r * Math.cos(t0)], [p3[0] + k * r * Math.sin(t1), p3[1] - k * r * Math.cos(t1)], p3]);
  }
  out[0][0] = a;
  out[out.length - 1][3] = b;
  return out;
}

/* one corner, as androidx.graphics.shapes RoundedCorner does it: a circular arc in the middle, with a smoothing curve on
   each side that eases from the straight edge into the arc */
class Corner {
  d1: Pt;
  d2: Pt;
  roundCut = 0;
  cut = 0;
  constructor(
    public p0: Pt,
    public p1: Pt,
    public p2: Pt,
    public round: Round,
  ) {
    this.d1 = norm(sub(p0, p1));
    this.d2 = norm(sub(p2, p1));
    const cos = dot(this.d1, this.d2);
    const sin = Math.sqrt(Math.max(0, 1 - cos * cos));
    this.roundCut = sin > 1e-3 ? (round.r * (cos + 1)) / sin : 0;
    this.cut = (1 + round.s) * this.roundCut;
  }
  private smooth(allowed: number) {
    if (allowed > this.cut) return this.round.s;
    if (allowed > this.roundCut) return (this.round.s * (allowed - this.roundCut)) / (this.cut - this.roundCut);
    return 0;
  }
  cubics(allowed0: number, allowed1: number): Cubic[] {
    const allowed = Math.min(allowed0, allowed1);
    if (this.roundCut < 1e-4 || allowed < 1e-4 || this.round.r < 1e-4) return [[this.p1, this.p1, this.p1, this.p1]];
    const rc = Math.min(allowed, this.roundCut);
    const s0 = this.smooth(allowed0);
    const s1 = this.smooth(allowed1);
    const r = (this.round.r * rc) / this.roundCut;
    const cd = Math.sqrt(r * r + rc * rc);
    const c = add(this.p1, mul(norm(mul(add(this.d1, this.d2), 0.5)), cd));
    const i0 = add(this.p1, mul(this.d1, rc));
    const i2 = add(this.p1, mul(this.d2, rc));
    const f0 = this.flank(rc, s0, this.p0, i0, i2, c, r);
    const f2 = this.flank(rc, s1, this.p2, i2, i0, c, r);
    const back: Cubic = [f2[3], f2[2], f2[1], f2[0]];
    return [f0, ...arc(c, f0[3], back[0], r), back];
  }
  private flank(rc: number, s: number, side: Pt, i: Pt, other: Pt, c: Pt, r: number): Cubic {
    const dir = norm(sub(side, this.p1));
    const start = add(this.p1, mul(dir, rc * (1 + s)));
    const p = lerp(i, mul(add(i, other), 0.5), s);
    const end = add(c, mul(norm(sub(p, c)), r));
    const tangent = rot90(sub(end, c));
    const anchorEnd = meet(side, dir, end, tangent) || i;
    const anchorStart = mul(add(start, mul(anchorEnd, 2)), 1 / 3);
    return [start, anchorStart, anchorEnd, end];
  }
}

/** a polygon with rounded corners, as cubics (androidx RoundedPolygon) */
function polygon(vs: Pt[], rounds: Round[]): Cubic[] {
  const n = vs.length;
  const cs = vs.map((v, i) => new Corner(vs[(i - 1 + n) % n], v, vs[(i + 1) % n], rounds[i] || SHARP));
  /* each side shares its length between the two corners at its ends: rounding first, then smoothing */
  const adj = vs.map((v, i) => {
    const j = (i + 1) % n;
    const side = len(sub(vs[j], v));
    const er = cs[i].roundCut + cs[j].roundCut;
    const ec = cs[i].cut + cs[j].cut;
    if (er > side) return [side / er, 0];
    if (ec > side) return [1, (side - er) / (ec - er)];
    return [1, 1];
  });
  const corners = cs.map((cn, i) => {
    const allowed = (a: number[]) => cn.roundCut * a[0] + (cn.cut - cn.roundCut) * a[1];
    return cn.cubics(allowed(adj[(i - 1 + n) % n]), allowed(adj[i]));
  });
  const out: Cubic[] = [];
  corners.forEach((cc, i) => {
    out.push(...cc.filter((q) => q[0] !== q[3] || q[0] !== q[1]));
    const next = corners[(i + 1) % n][0][0];
    const end = cc[cc.length - 1][3];
    if (len(sub(next, end)) > 1e-6) out.push(line(end, next));
  });
  return out;
}

const regular = (n: number, r: number, rounds: Round[]): Cubic[] =>
  polygon(
    Array.from({ length: n }, (_, i) => [r * Math.cos((2 * Math.PI * i) / n), r * Math.sin((2 * Math.PI * i) / n)] as Pt),
    Array.from({ length: n }, (_, i) => rounds[i % rounds.length]),
  );
const star = (n: number, inner: number, round: Round): Cubic[] => {
  const vs: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = (2 * Math.PI * i) / n;
    vs.push([Math.cos(a), Math.sin(a)], [inner * Math.cos(a + Math.PI / n), inner * Math.sin(a + Math.PI / n)]);
  }
  return polygon(
    vs,
    vs.map(() => round),
  );
};
const rect = (w: number, h: number, rounds: Round[]): Cubic[] =>
  polygon(
    [
      [w / 2, h / 2],
      [-w / 2, h / 2],
      [-w / 2, -h / 2],
      [w / 2, -h / 2],
    ],
    [0, 1, 2, 3].map((i) => rounds[i % rounds.length]),
  );
/** RoundedPolygon.circle: a polygon whose rounding makes it a true circle */
const circle = (n = 8): Cubic[] => regular(n, 1 / Math.cos(Math.PI / n), [rd(1)]);

const xf = (cs: Cubic[], f: (p: Pt) => Pt): Cubic[] => cs.map((q) => q.map(f) as Cubic);
const turn =
  (deg: number) =>
  (p: Pt): Pt => {
    const a = (deg * Math.PI) / 180;
    return [p[0] * Math.cos(a) - p[1] * Math.sin(a), p[0] * Math.sin(a) + p[1] * Math.cos(a)];
  };
const scale =
  (sx: number, sy: number) =>
  (p: Pt): Pt => [p[0] * sx, p[1] * sy];

/* MaterialShapes' customPolygon: a few points with their roundings, repeated around (0.5, 0.5), optionally mirrored */
type PR = [number, number, Round?];
function custom(pts: PR[], reps: number, mirroring = false): Cubic[] {
  const c: Pt = [0.5, 0.5];
  const out: { p: Pt; r: Round }[] = [];
  if (mirroring) {
    const ang = pts.map((q) => (Math.atan2(q[1] - c[1], q[0] - c[0]) * 180) / Math.PI);
    const dist = pts.map((q) => Math.hypot(q[0] - c[0], q[1] - c[1]));
    const actual = reps * 2;
    const section = 360 / actual;
    for (let it = 0; it < actual; it++) {
      for (let index = 0; index < pts.length; index++) {
        const i = it % 2 === 0 ? index : pts.length - 1 - index;
        if (i > 0 || it % 2 === 0) {
          const a = ((section * it + (it % 2 === 0 ? ang[i] : section - ang[i] + 2 * ang[0])) * Math.PI) / 180;
          out.push({ p: [Math.cos(a) * dist[i] + c[0], Math.sin(a) * dist[i] + c[1]], r: pts[i][2] || SHARP });
        }
      }
    }
  } else {
    for (let it = 0; it < pts.length * reps; it++) {
      const q = pts[it % pts.length];
      const p = add(turn(((it / pts.length) | 0) * (360 / reps))(sub([q[0], q[1]], c)), c);
      out.push({ p, r: q[2] || SHARP });
    }
  }
  return polygon(
    out.map((o) => o.p),
    out.map((o) => o.r),
  );
}

const R15 = rd(0.15);
const R20 = rd(0.2);
const R30 = rd(0.3);
const R50 = rd(0.5);
const R100 = rd(1);

/** every Material 3 Expressive shape, by its Compose name */
const BUILD = {
  circle: () => circle(10),
  square: () => rect(1, 1, [R30]),
  slanted: () =>
    custom(
      [
        [0.926, 0.97, rd(0.189, 0.811)],
        [-0.021, 0.967, rd(0.187, 0.057)],
      ],
      2,
    ),
  arch: () => xf(regular(4, 1, [R100, R100, R20, R20]), turn(-135)),
  fan: () =>
    custom(
      [
        [1.004, 1, rd(0.148, 0.417)],
        [0, 1, rd(0.151)],
        [0, -0.003, rd(0.148)],
        [0.978, 0.02, rd(0.803)],
      ],
      1,
    ),
  arrow: () =>
    custom(
      [
        [0.5, 0.892, rd(0.313)],
        [-0.216, 1.05, rd(0.207)],
        [0.499, -0.16, rd(0.215, 1)],
        [1.225, 1.06, rd(0.211)],
      ],
      1,
    ),
  semiCircle: () => rect(1.6, 1, [R20, R20, R100, R100]),
  oval: () => xf(xf(circle(), scale(1, 0.64)), turn(-45)),
  pill: () =>
    custom(
      [
        [0.961, 0.039, rd(0.426)],
        [1.001, 0.428],
        [1, 0.609, rd(1)],
      ],
      2,
      true,
    ),
  triangle: () => xf(regular(3, 1, [R20]), turn(-90)),
  diamond: () =>
    custom(
      [
        [0.5, 1.096, rd(0.151, 0.524)],
        [0.04, 0.5, rd(0.159)],
      ],
      2,
    ),
  clamShell: () =>
    custom(
      [
        [0.171, 0.841, rd(0.159)],
        [-0.02, 0.5, rd(0.14)],
        [0.17, 0.159, rd(0.159)],
      ],
      2,
    ),
  pentagon: () =>
    custom(
      [
        [0.5, -0.009, rd(0.172)],
        [1.03, 0.365, rd(0.164)],
        [0.828, 0.97, rd(0.169)],
      ],
      1,
      true,
    ),
  gem: () =>
    custom(
      [
        [0.499, 1.023, rd(0.241, 0.778)],
        [-0.005, 0.792, rd(0.208)],
        [0.073, 0.258, rd(0.228)],
        [0.433, 0, rd(0.491)],
      ],
      1,
      true,
    ),
  sunny: () => star(8, 0.8, R15),
  verySunny: () =>
    custom(
      [
        [0.5, 1.08, rd(0.085)],
        [0.358, 0.843, rd(0.085)],
      ],
      8,
    ),
  cookie4: () =>
    custom(
      [
        [1.237, 1.236, rd(0.258)],
        [0.5, 0.918, rd(0.233)],
      ],
      4,
    ),
  cookie6: () =>
    custom(
      [
        [0.723, 0.884, rd(0.394)],
        [0.5, 1.099, rd(0.398)],
      ],
      6,
    ),
  cookie7: () => xf(star(7, 0.75, R50), turn(-90)),
  cookie9: () => xf(star(9, 0.8, R50), turn(-90)),
  cookie12: () => xf(star(12, 0.8, R50), turn(-90)),
  ghostish: () =>
    custom(
      [
        [0.5, 0, rd(1)],
        [1, 0, rd(1)],
        [1, 1.14, rd(0.254, 0.106)],
        [0.575, 0.906, rd(0.253)],
      ],
      1,
      true,
    ),
  clover4: () =>
    custom(
      [
        [0.5, 0.074],
        [0.725, -0.099, rd(0.476)],
      ],
      4,
      true,
    ),
  clover8: () =>
    custom(
      [
        [0.5, 0.036],
        [0.758, -0.101, rd(0.209)],
      ],
      8,
    ),
  burst: () =>
    custom(
      [
        [0.5, -0.006, rd(0.006)],
        [0.592, 0.158, rd(0.006)],
      ],
      12,
    ),
  softBurst: () =>
    custom(
      [
        [0.193, 0.277, rd(0.053)],
        [0.176, 0.055, rd(0.053)],
      ],
      10,
    ),
  boom: () =>
    custom(
      [
        [0.457, 0.296, rd(0.007)],
        [0.5, -0.051, rd(0.007)],
      ],
      15,
    ),
  softBoom: () =>
    custom(
      [
        [0.733, 0.454],
        [0.839, 0.437, rd(0.532)],
        [0.949, 0.449, rd(0.439, 1)],
        [0.998, 0.478, rd(0.174)],
      ],
      16,
      true,
    ),
  flower: () =>
    custom(
      [
        [0.37, 0.187],
        [0.416, 0.049, rd(0.381)],
        [0.479, 0.001, rd(0.095)],
      ],
      8,
      true,
    ),
  puffy: () =>
    xf(
      custom(
        [
          [0.5, 0.053],
          [0.545, -0.04, rd(0.405)],
          [0.67, -0.035, rd(0.426)],
          [0.717, 0.066, rd(0.574)],
          [0.722, 0.128],
          [0.777, 0.002, rd(0.36)],
          [0.914, 0.149, rd(0.66)],
          [0.926, 0.289, rd(0.66)],
          [0.881, 0.346],
          [0.94, 0.344, rd(0.126)],
          [1.003, 0.437, rd(0.255)],
        ],
        2,
        true,
      ),
      scale(1, 0.742),
    ),
  puffyDiamond: () =>
    custom(
      [
        [0.87, 0.13, rd(0.146)],
        [0.818, 0.357],
        [1, 0.332, rd(0.853)],
      ],
      4,
      true,
    ),
  pixelCircle: () =>
    custom(
      [
        [0.5, 0],
        [0.704, 0],
        [0.704, 0.065],
        [0.843, 0.065],
        [0.843, 0.148],
        [0.926, 0.148],
        [0.926, 0.296],
        [1, 0.296],
      ],
      2,
      true,
    ),
  pixelTriangle: () =>
    custom(
      [
        [0.11, 0.5],
        [0.113, 0],
        [0.287, 0],
        [0.287, 0.087],
        [0.421, 0.087],
        [0.421, 0.17],
        [0.56, 0.17],
        [0.56, 0.265],
        [0.674, 0.265],
        [0.675, 0.344],
        [0.789, 0.344],
        [0.789, 0.439],
        [0.888, 0.439],
      ],
      1,
      true,
    ),
  bun: () =>
    custom(
      [
        [0.796, 0.5],
        [0.853, 0.518, rd(1)],
        [0.992, 0.631, rd(1)],
        [0.968, 1, rd(1)],
      ],
      2,
      true,
    ),
  heart: () =>
    custom(
      [
        [0.5, 0.268, rd(0.016)],
        [0.792, -0.066, rd(0.958)],
        [1.064, 0.276, rd(1)],
        [0.501, 0.946, rd(0.129)],
      ],
      1,
      true,
    ),
} satisfies Record<string, () => Cubic[]>;

export type M3Shape = keyof typeof BUILD;
export const M3_SHAPES = Object.keys(BUILD) as M3Shape[];

/* ---------- the feeling shapes: a wild shape for every feeling ---------- */
/* Every one of the 144 feelings has a shape of its own, and no two are alike. Each corner of the grid has its own
   family, and each family has six kinds (`a`, counted across from the grid's edge), each drawn six ways (`b`, counted
   down from the grid's edge), with a fixed bit of chance (seeded by the feeling's place, so it never changes) that
   makes every spike, drip and lobe its own.
   jag: the charged corner. Comic bursts, pointed stars, buzzsaws, crosses, crumpled rocks and double bursts.
   ray: the bright corner. Suns, flowers, pinwheels, sparkles, hearts and crowns, and happy round blobs.
   drip: the heavy corner. Melting drops, raindrops, blocks with bites, puddles, bitten moons and rain clouds.
   bloom: the calm corner. Clouds, leaves and clovers, pebbles, soft cushions, flowers, and beans, mushrooms and
   caterpillars.
   Most are drawn as a reach (how far the shape goes from its middle in every direction), which can then lean, sag and
   swirl. Every shape keeps a body at least half as wide as its reach, so the word written on it still fits. */
export type FeelFamily = 'jag' | 'ray' | 'drip' | 'bloom';
export type FeelShape = `feel:${FeelFamily}:${number}:${number}`;
export type AnyShape = M3Shape | FeelShape;

const TAU = 2 * Math.PI;
/** how far the shape reaches from its middle at angle t (0 points right, and t turns clockwise on the screen) */
type Reach = (t: number) => number;

/** a fixed bit of chance: the same seed always gives the same numbers, from 0 to 1 */
function chance(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let z = s;
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
  };
}

/** where a ray from the middle at angle t leaves a circle (centered cx, cy, radius r), or 0 if it misses */
function outOf(t: number, cx: number, cy: number, r: number) {
  const b = Math.cos(t) * cx + Math.sin(t) * cy;
  const disc = b * b - (cx * cx + cy * cy - r * r);
  return disc < 0 ? 0 : Math.max(0, b + Math.sqrt(disc));
}
/** where that ray first goes into a circle that does not hold the middle (a bite), or Infinity if it misses */
function into(t: number, cx: number, cy: number, r: number) {
  const b = Math.cos(t) * cx + Math.sin(t) * cy;
  const disc = b * b - (cx * cx + cy * cy - r * r);
  if (disc < 0) return Infinity;
  const near = b - Math.sqrt(disc);
  return near > 0 ? near : Infinity;
}
/** circles run together into one shape */
const blobs =
  (cs: [number, number, number][]): Reach =>
  (t) =>
    Math.max(...cs.map((c) => outOf(t, c[0], c[1], c[2])));
/** a closed outline around the middle, as a reach */
function outline(vs: Pt[]): Reach {
  return (t) => {
    const [dx, dy] = [Math.cos(t), Math.sin(t)];
    let best = 0;
    vs.forEach((p, i) => {
      const q = vs[(i + 1) % vs.length];
      const [ex, ey] = [q[0] - p[0], q[1] - p[1]];
      const den = dx * ey - dy * ex;
      if (Math.abs(den) < 1e-9) return;
      const u = (p[0] * ey - p[1] * ex) / den;
      const v = (p[0] * dy - p[1] * dx) / den;
      if (v >= 0 && v <= 1 && u > best) best = u;
    });
    return best;
  };
}
/** Gielis's superformula: one rule that draws stars, flowers, polygons and blobs */
const superformula =
  (m: number, n1: number, n2: number, n3: number): Reach =>
  (t) =>
    (Math.abs(Math.cos((m * t) / 4)) ** n2 + Math.abs(Math.sin((m * t) / 4)) ** n3) ** (-1 / n1);
/** how near angle t is to the nearest of k points round the shape (the first one at the top): 0 on a point, 0.5
    halfway between, with the point's number */
function near(t: number, k: number): [number, number] {
  const x = (k * (t + Math.PI / 2)) / TAU;
  const i = Math.round(x);
  return [Math.abs(x - i), ((i % k) + k) % k];
}
/** the gap between two angles, -pi to pi */
const gap = (a: number, b: number) => Math.atan2(Math.sin(a - b), Math.cos(a - b));

type Lean = {
  /** the least the shape may reach, as a share of its most (a smaller body is lifted to this) */
  body?: number;
  /** turns the tips round against the body, like a pinwheel (radians at the tips) */
  swirl?: number;
  /** wider below and narrower above */
  sag?: number;
  /** squashed flat (below 1) */
  squash?: number;
  /** turned round, in radians */
  turn?: number;
  /** a flatter base: anything below this share of the reach is pressed up */
  base?: number;
};
/** a reach drawn as a closed outline, leaning the ways asked */
function drawn(reach: Reach, o: Lean = {}): Cubic[] {
  const n = 240;
  const at = (i: number) => (i / n) * TAU - Math.PI / 2;
  let rs = Array.from({ length: n }, (_, i) => reach(at(i) + (o.turn || 0)));
  const hi = Math.max(...rs);
  const lo = Math.min(...rs);
  const body = o.body ?? 0.5;
  if (lo < body * hi) rs = rs.map((r) => hi * (body + ((1 - body) * (r - lo)) / (hi - lo)));
  const pts = rs.map((r, i): Pt => {
    const t = at(i) + ((o.swirl || 0) * (r / hi - body)) / (1 - body);
    let x = r * Math.cos(t);
    let y = r * Math.sin(t);
    if (o.sag) x *= 1 + (o.sag * y) / hi;
    if (o.squash) y *= o.squash;
    if (o.base !== undefined && y > o.base * hi) y = o.base * hi + (y - o.base * hi) * 0.2;
    return [x, y];
  });
  return pts.map((p, i) => line(p, pts[(i + 1) % n]));
}

/** a w by h block with a rounded bite out of each side named in `bites` (top, right, bottom, left); `dome` rounds the
    top corners right over. The side bites sit off the middle, the right one high and the left one low like a puzzle
    piece, so a long word written across the middle is never cut into. */
function block(w: number, h: number, bites: boolean[], dome: boolean): Cubic[] {
  const [x, y] = [w / 2, h / 2];
  const [dy, dx] = [h * 0.22, w * 0.12];
  const nw = Math.min(w, h) * 0.2;
  const [ns, at] = [h * 0.13, h * 0.25];
  const vs: Pt[] = [];
  const rs: Round[] = [];
  const corner = (p: Pt, top: boolean) => {
    vs.push(p);
    rs.push(rd(top && dome ? Math.min(w, h) * 0.48 : 0.16));
  };
  const bite = (a: Pt, mid: Pt, b: Pt, r: number) => {
    vs.push(a, mid, b);
    rs.push(rd(0.05), rd(r), rd(0.05));
  };
  corner([-x, -y], true);
  if (bites[0]) bite([-nw, -y], [0, -y + dy], [nw, -y], nw * 0.9);
  corner([x, -y], true);
  if (bites[1]) bite([x, -at - ns], [x - dx, -at], [x, -at + ns], ns * 0.9);
  corner([x, y], false);
  if (bites[2]) bite([nw, y], [0, y - dy], [-nw, y], nw * 0.9);
  corner([-x, y], false);
  if (bites[3]) bite([-x, at + ns], [-x + dx, at], [-x, at - ns], ns * 0.9);
  return polygon(vs, rs);
}

/* the charged corner: sharp, loud, uneven */
function jag(a: number, b: number, rnd: () => number): Cubic[] {
  if (a === 0) {
    /* a comic burst: spikes of every length, bunched and spread unevenly */
    const k = 9 + b;
    const len = Array.from({ length: k }, () => 0.45 + 0.55 * rnd());
    const ph = rnd() * TAU;
    return drawn((t) => {
      const [f, i] = near(t + 0.18 * Math.sin(3 * t + ph), k);
      return 0.5 + 0.5 * len[i] * Math.max(0, 1 - 2 * f) ** 1.2;
    });
  }
  if (a === 1) {
    /* a pointed star whose sides curve in, from three points to nine */
    const m = [3, 4, 5, 6, 7, 9][b];
    const n = 0.28 + 0.05 * b;
    return drawn(superformula(m, n, n + 0.15, n + 0.15), { body: 0.56, turn: Math.PI / 2 + rnd() * 0.2 });
  }
  if (a === 2) {
    /* a buzzsaw, its teeth all leaning one way */
    const k = [6, 7, 8, 9, 10, 12][b];
    const dir = b % 2 ? 1 : -1;
    return drawn(
      (t) => {
        const x = (dir * k * t) / TAU;
        return 1 - 0.34 * (x - Math.floor(x));
      },
      { swirl: 0.12 * dir },
    );
  }
  if (a === 3) {
    /* crosses and asterisks with square-cut arms, some cut on a slant */
    const m = [4, 4, 3, 5, 6, 8][b];
    const w = [0.42, 0.42, 0.44, 0.38, 0.32, 0.26][b];
    const rot = (b === 1 ? Math.PI / 4 : 0) + rnd() * 0.25 - Math.PI / 2;
    const vs: Pt[] = [];
    for (let i = 0; i < m; i++) {
      const f = rot + (i * TAU) / m;
      const [dx, dy, nx, ny] = [Math.cos(f), Math.sin(f), -Math.sin(f), Math.cos(f)];
      const slant = b % 2 ? 0.22 : 0;
      vs.push([dx * (1 - slant) - nx * w, dy * (1 - slant) - ny * w], [dx + nx * w, dy + ny * w]);
      const g = f + Math.PI / m;
      const d = w / Math.sin(Math.PI / m);
      vs.push([d * Math.cos(g), d * Math.sin(g)]);
    }
    return drawn(outline(vs), { body: 0.42 });
  }
  if (a === 4) {
    /* a crumpled rock: creases of three sizes, each rock folded its own way */
    const ks = [2 + Math.floor(rnd() * 3), 5 + Math.floor(rnd() * 4), 11 + Math.floor(rnd() * 6)];
    const ph = ks.map(() => rnd() * TAU);
    return drawn(
      (t) => 1 - 0.3 * Math.abs(Math.sin(ks[0] * t + ph[0])) - 0.16 * Math.abs(Math.sin(ks[1] * t + ph[1])) - 0.08 * Math.abs(Math.sin(ks[2] * t + ph[2])),
      { squash: 0.8 + 0.2 * rnd(), turn: rnd() * TAU },
    );
  }
  /* a double burst: a big star with a smaller one of another count showing between its points */
  const k1 = [5, 6, 7, 8, 4, 6][b];
  const k2 = k1 + 1 + (b % 3);
  const off = rnd() * TAU;
  return drawn(
    (t) => {
      const [f1] = near(t, k1);
      const [f2] = near(t + off, k2);
      return Math.max(0.45 + 0.55 * Math.max(0, 1 - 2 * f1) ** 1.4, 0.45 + 0.3 * Math.max(0, 1 - 2 * f2) ** 1.4);
    },
    { swirl: b % 2 ? -0.3 : 0 },
  );
}

/* the bright corner: rays, petals, sparkles and happy things */
function ray(a: number, b: number, rnd: () => number): Cubic[] {
  if (a === 0) {
    /* a sun: slim rays, long and short by turns */
    const k = [10, 12, 14, 16, 18, 22][b];
    return drawn((t) => {
      const [f, i] = near(t, k);
      return 0.62 + 0.38 * (i % 2 ? 0.62 : 1) * Math.cos(Math.PI * f) ** 6;
    });
  }
  if (a === 1) {
    /* a flower with fat round petals */
    const k = [4, 5, 6, 7, 8, 9][b];
    return drawn((t) => 0.55 + 0.45 * Math.abs(Math.cos((k * (t + Math.PI / 2)) / 2)) ** 0.5, { swirl: b % 2 ? 0.25 : 0 });
  }
  if (a === 2) {
    /* a pinwheel with curved blades */
    const k = [3, 4, 5, 6, 4, 5][b];
    const dir = b < 3 ? 1 : -1;
    return drawn(
      (t) => {
        const x = (dir * k * t) / TAU;
        return 0.5 + 0.5 * (1 - (x - Math.floor(x))) ** 1.6;
      },
      { swirl: 0.55 * dir, body: 0.6 },
    );
  }
  if (a === 3) {
    /* a sparkle: a star with sides drawn in, some with a smaller one turned behind it */
    const m = [4, 4, 5, 6, 8, 4][b];
    const n = 0.55 + 0.05 * (b % 3);
    const big = superformula(m, n, n, n);
    const two = b % 2 === 1;
    return drawn((t) => Math.max(big(t + Math.PI / 2), two ? 0.62 * big(t + Math.PI / 2 + Math.PI / m) : 0), { body: 0.52 });
  }
  if (a === 4) {
    if (b === 0) {
      /* a heart */
      const vs: Pt[] = Array.from({ length: 120 }, (_, i) => {
        const s = (i / 120) * TAU;
        return [(16 * Math.sin(s) ** 3) / 17, (-(13 * Math.cos(s) - 5 * Math.cos(2 * s) - 2 * Math.cos(3 * s) - Math.cos(4 * s)) - 2) / 17];
      });
      return drawn(outline(vs), { body: 0.4 });
    }
    if (b === 1) {
      /* a crown */
      return drawn(
        outline([
          [-1, 0.6],
          [-1, -0.75],
          [-0.5, -0.1],
          [0, -0.9],
          [0.5, -0.1],
          [1, -0.75],
          [1, 0.6],
        ]),
        { body: 0.4 },
      );
    }
    if (b === 2) return drawn((t) => 1 - 0.08 * Math.abs(Math.sin(11 * t)));
    if (b === 3) return drawn((t) => 0.72 / Math.hypot(0.72 * Math.cos(t), Math.sin(t)) + 0.3 * Math.abs(Math.cos(t)) ** 14, { turn: 0.6 });
    /* a flame, flickering at the top; and a fat rounded star */
    if (b === 4) return drawn((t) => 0.72 + 0.45 * Math.max(0, -Math.sin(t)) ** 5 + 0.06 * Math.sin(5 * t), { swirl: 0.15 });
    return drawn(superformula(5, 2, 7, 7), { turn: Math.PI / 2 });
  }
  /* a happy blob: the superformula with chance in it, so each one is a round, odd thing of its own */
  const m = [3, 4, 5, 6, 7, 8][b];
  const n2 = 1 + rnd() * 6;
  return drawn(superformula(m, 1 + rnd() * 3, n2, n2 * (0.6 + rnd() * 0.8)), { body: 0.55, turn: rnd() * TAU });
}

/* the heavy corner: things that droop, sag, melt and are bitten */
function drip(a: number, b: number, rnd: () => number): Cubic[] {
  /* drops hanging from the lower half: [angle, width, length] */
  const drops = (n: number) =>
    Array.from({ length: n }, (_, i) => [Math.PI / 2 + (i - (n - 1) / 2) * 0.6 + (rnd() - 0.5) * 0.3, 0.1 + 0.08 * rnd(), 0.3 + 0.45 * rnd()]);
  const hang = (t: number, ds: number[][]) => ds.reduce((sum, d) => sum + d[2] * Math.exp(-((gap(t, d[0]) / d[1]) ** 2)), 0);
  if (a === 0) {
    /* melting: a round blob with drops running off its lower edge */
    const ds = drops(1 + (b % 4));
    return drawn((t) => 1 + hang(t, ds), { squash: 0.9 + 0.1 * rnd() });
  }
  if (a === 1) {
    /* raindrops, pointing every which way; the last points both ways */
    const dir = [-Math.PI / 2, Math.PI / 2, -Math.PI / 4, (-3 * Math.PI) / 4, Math.PI, 0][b];
    const p = 5 + 2 * (b % 3);
    return drawn((t) => 0.8 + 0.65 * Math.max(0, Math.cos(t - dir)) ** p + (b === 5 ? 0.65 * Math.max(0, -Math.cos(t - dir)) ** p : 0));
  }
  if (a === 2) {
    /* a block with bites out of it */
    const bites = [
      [true, false, false, false],
      [true, false, true, false],
      [false, true, false, true],
      [true, true, true, true],
      [false, false, true, false],
      [true, true, false, true],
    ][b];
    return block(2, [2, 1.7, 1.5][b % 3], bites, b % 2 === 1);
  }
  if (a === 3) {
    /* a puddle: wide, low and wobbly, heavier below */
    const hs = [2, 3, 4, 5].map((k) => [k, 0.06 + 0.07 * rnd(), rnd() * TAU]);
    return drawn((t) => 1 + hs.reduce((sum, h) => sum + h[1] * Math.sin(h[0] * t + h[2]), 0), { squash: 0.62, sag: 0.3 });
  }
  if (a === 4) {
    /* a bitten moon: a round with one or two bites out of it */
    const bites = Array.from({ length: 1 + (b % 2) }, () => {
      const g = rnd() * TAU;
      const d = 1.05 + 0.2 * rnd();
      return [d * Math.cos(g), d * Math.sin(g), 0.45 + 0.25 * rnd()];
    });
    return drawn((t) => Math.min(1, ...bites.map((c) => into(t, c[0], c[1], c[2]))), { body: 0.45 });
  }
  if (b < 3) {
    /* a rain cloud, dripping */
    const cloud = blobs([
      [-0.55, 0, 0.5],
      [0, -0.25, 0.6],
      [0.55, 0, 0.5],
    ]);
    const ds = drops(2 + b);
    return drawn((t) => cloud(t) + hang(t, ds), { body: 0.4 });
  }
  /* a wilted flower: its petals hang and droop */
  const k = [5, 6, 7][b - 3];
  return drawn((t) => 0.55 + 0.45 * Math.abs(Math.cos((k * (t + Math.PI / 2)) / 2)) ** 0.6, { sag: 0.45, swirl: 0.35 });
}

/* the calm corner: soft, round, growing things */
function bloom(a: number, b: number, rnd: () => number): Cubic[] {
  if (a === 0) {
    /* a cloud: round lobes of every size along the top, resting on a flat base */
    const n = 3 + (b % 4);
    const cs = Array.from({ length: n }, (_, i): [number, number, number] => {
      const x = -0.75 + (1.5 * i) / (n - 1);
      return [x, -0.1 - 0.3 * (1 - Math.abs(x)) * (0.6 + 0.4 * rnd()), 0.32 + 0.22 * rnd()];
    });
    return drawn(blobs([...cs, [0, 0.12, 0.62]]), { base: 0.35, body: 0.4 });
  }
  if (a === 1) {
    if (b === 0)
      /* a leaf, tilted */
      return drawn((t) => Math.min(outOf(t, -0.62, 0, 1), outOf(t, 0.62, 0, 1)), { turn: 0.7, body: 0.35 });
    /* a three leaf clover and a four leaf one */
    if (b === 1) return drawn((t) => Math.abs(Math.cos(1.5 * (t + Math.PI / 2))) ** 0.35, { body: 0.4 });
    if (b === 2) return drawn((t) => Math.abs(Math.cos(2 * (t + Math.PI / 4))) ** 0.35, { body: 0.4 });
    /* a ginkgo fan with a notch at the top */
    if (b === 3) return drawn((t) => 0.55 + 0.45 * Math.max(0, -Math.sin(t)) ** 0.5 - 0.3 * Math.exp(-(((t + Math.PI / 2) / 0.1) ** 2)), { body: 0.45 });
    /* a round leaf with slits cut into it */
    if (b === 4) {
      const cuts = [0.3, 1.6, 2.6, 4.2, 5.3].map((g) => g + rnd() * 0.3);
      return drawn((t) => 1 - cuts.reduce((sum, g) => sum + 0.5 * Math.exp(-((gap(t, g) / 0.06) ** 2)), 0));
    }
    /* a sprout: two leaves on a short stem */
    return drawn(
      blobs([
        [-0.45, -0.25, 0.52],
        [0.45, -0.25, 0.52],
        [0, 0.45, 0.25],
      ]),
      { body: 0.4 },
    );
  }
  if (a === 2) {
    /* a pebble: worn smooth, each its own */
    const hs = [2, 3, 4].map((k) => [k, 0.05 + 0.1 * rnd(), rnd() * TAU]);
    return drawn((t) => 1 + hs.reduce((sum, h) => sum + h[1] * Math.sin(h[0] * t + h[2]), 0), { squash: 0.7 + 0.25 * rnd(), turn: rnd() * TAU });
  }
  if (a === 3) {
    /* a cushion: a soft square, its edge gently waved */
    const n = [4, 5, 3, 6, 4, 8][b];
    const k = [8, 10, 12, 6, 16, 14][b];
    return drawn((t) => (Math.abs(Math.cos(t)) ** n + Math.abs(Math.sin(t)) ** n) ** (-1 / n) * (1 + 0.05 * Math.sin(k * t)), {
      squash: 0.75 + 0.05 * b,
      turn: b % 2 ? Math.PI / 4 : 0,
    });
  }
  if (a === 4) {
    /* a flower: round petals, a little swirled */
    const k = [5, 6, 7, 8, 10, 12][b];
    return drawn((t) => 0.7 + 0.3 * Math.abs(Math.cos((k * (t + Math.PI / 2)) / 2)) ** 0.4, { swirl: 0.25 * ((b % 3) - 1) });
  }
  if (b === 0)
    /* a bean */
    return drawn((t) => Math.min(1, into(t, 0, -1.3, 0.6)), { squash: 0.8, body: 0.4 });
  /* a peanut */
  if (b === 1)
    return drawn(
      blobs([
        [-0.5, 0, 0.55],
        [0.5, 0, 0.55],
        [0, 0, 0.42],
      ]),
      { turn: 0.4, body: 0.4 },
    );
  if (b === 2)
    /* a mushroom: a round cap on a short stem */
    return drawn(
      (t) =>
        Math.max(
          Math.min(outOf(t, 0, -0.1, 0.85), Math.sin(t) > 0 ? 0.2 / Math.sin(t) : Infinity),
          outline([
            [-0.28, 0],
            [0.28, 0],
            [0.24, 0.85],
            [-0.24, 0.85],
          ])(t),
        ),
      { body: 0.25 },
    );
  if (b === 3)
    /* a caterpillar, humped in the middle */
    return drawn(
      blobs([
        [-0.62, 0.1, 0.4],
        [0, -0.08, 0.5],
        [0.62, 0.1, 0.4],
      ]),
      { body: 0.3 },
    );
  if (b === 4) return drawn((t) => 0.78 / Math.hypot(0.78 * Math.cos(t), Math.sin(t)), { sag: 0.25 });
  /* a round tree on its trunk */
  return drawn(
    (t) =>
      Math.max(
        blobs([
          [-0.42, -0.2, 0.45],
          [0.42, -0.2, 0.45],
          [0, -0.55, 0.5],
          [0, 0.05, 0.45],
        ])(t),
        outline([
          [-0.13, 0],
          [0.13, 0],
          [0.13, 0.9],
          [-0.13, 0.9],
        ])(t),
      ),
    { body: 0.25 },
  );
}

const FAMILIES = { jag, ray, drip, bloom };
function buildFeel(fam: FeelFamily, a: number, b: number): Cubic[] {
  const rnd = chance(Object.keys(FAMILIES).indexOf(fam) * 1009 + a * 97 + b * 13 + 7);
  return FAMILIES[fam](a, b, rnd);
}

function raw(kind: AnyShape): Cubic[] {
  if (kind.startsWith('feel:')) {
    const [, fam, a, b] = kind.split(':');
    const cl = (v: string) => Math.max(0, Math.min(5, Number(v) | 0));
    return buildFeel(fam as FeelFamily, cl(a), cl(b));
  }
  return BUILD[kind as M3Shape]();
}

const at = (q: Cubic, t: number): Pt => {
  const u = 1 - t;
  return [
    u * u * u * q[0][0] + 3 * u * u * t * q[1][0] + 3 * u * t * t * q[2][0] + t * t * t * q[3][0],
    u * u * u * q[0][1] + 3 * u * u * t * q[1][1] + 3 * u * t * t * q[2][1] + t * t * t * q[3][1],
  ];
};

/* each shape once, fitted into the unit square like Compose's normalized(): its longer side is 1, and it is centered */
const cache = new Map<AnyShape, Cubic[]>();
function unit(kind: AnyShape): Cubic[] {
  const hit = cache.get(kind);
  if (hit) return hit;
  const cs = raw(kind);
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  cs.forEach((q) => {
    for (let k = 0; k <= 8; k++) {
      const p = at(q, k / 8);
      x0 = Math.min(x0, p[0]);
      y0 = Math.min(y0, p[1]);
      x1 = Math.max(x1, p[0]);
      y1 = Math.max(y1, p[1]);
    }
  });
  const s = 1 / Math.max(x1 - x0, y1 - y0);
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const out = xf(cs, (p) => [(p[0] - cx) * s + 0.5, (p[1] - cy) * s + 0.5]);
  cache.set(kind, out);
  return out;
}

const r2 = (n: number) => Math.round(n * 100) / 100;
/** the shape as an SVG path filling a box `size` wide, turned `deg` degrees around its middle */
export function shapePath(kind: AnyShape, size: number, deg = 0): string {
  const t = turn(deg);
  const map = (p: Pt) => {
    const q = t([p[0] - 0.5, p[1] - 0.5]);
    return r2((q[0] + 0.5) * size) + ' ' + r2((q[1] + 0.5) * size);
  };
  const cs = unit(kind);
  let d = 'M' + map(cs[0][0]);
  cs.forEach((q) => (d += ' C' + map(q[1]) + ' ' + map(q[2]) + ' ' + map(q[3])));
  return d + 'Z';
}

/** n points evenly spaced around the shape's outline, in the unit square, starting at the top and going clockwise, so
    two shapes line up point for point and can be blended into each other */
export function shapePoints(kind: AnyShape, n = 96): Pt[] {
  const fine: Pt[] = [];
  unit(kind).forEach((q) => {
    for (let k = 0; k < 16; k++) fine.push(at(q, k / 16));
  });
  /* clockwise on screen (y down) */
  let area = 0;
  fine.forEach((p, i) => {
    const q = fine[(i + 1) % fine.length];
    area += p[0] * q[1] - q[0] * p[1];
  });
  if (area < 0) fine.reverse();
  /* start where the outline crosses straight up from the middle */
  let best = 0;
  let bestA = Infinity;
  fine.forEach((p, i) => {
    const a = Math.abs(Math.atan2(p[0] - 0.5, 0.5 - p[1]));
    if (p[1] < 0.5 && a < bestA) {
      bestA = a;
      best = i;
    }
  });
  const ring = fine.slice(best).concat(fine.slice(0, best));
  const seg = ring.map((p, i) => len(sub(ring[(i + 1) % ring.length], p)));
  const total = seg.reduce((a, b) => a + b, 0);
  const out: Pt[] = [];
  let i = 0;
  let acc = 0;
  for (let k = 0; k < n; k++) {
    const want = (k / n) * total;
    while (acc + seg[i] < want) acc += seg[i++];
    out.push(lerp(ring[i], ring[(i + 1) % ring.length], seg[i] ? (want - acc) / seg[i] : 0));
  }
  return out;
}

/** a smooth closed SVG path through points in the unit square, scaled to `size` (Catmull-Rom as cubics) */
export function smoothPath(pts: Pt[], size: number, cx = size / 2, cy = size / 2, deg = 0): string {
  const t = turn(deg);
  const p = pts.map((q) => {
    const v = t([(q[0] - 0.5) * size, (q[1] - 0.5) * size]);
    return [v[0] + cx, v[1] + cy] as Pt;
  });
  const n = p.length;
  let d = 'M' + r2(p[0][0]) + ' ' + r2(p[0][1]);
  for (let i = 0; i < n; i++) {
    const a = p[(i - 1 + n) % n];
    const b = p[i];
    const c = p[(i + 1) % n];
    const e = p[(i + 2) % n];
    d += ' C' + [b[0] + (c[0] - a[0]) / 6, b[1] + (c[1] - a[1]) / 6, c[0] - (e[0] - b[0]) / 6, c[1] - (e[1] - b[1]) / 6, c[0], c[1]].map(r2).join(' ');
  }
  return d + 'Z';
}

/** a blend of two shapes' points: t 0 is a, 1 is b */
export function morphPoints(a: Pt[], b: Pt[], t: number): Pt[] {
  return a.map((p, i) => lerp(p, b[i], t));
}
