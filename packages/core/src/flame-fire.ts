/* The fire in the flame: what moves, and how (the owner, October 31, 2026: "instead of moving the whole emoji I want the top to move like actual
   fire would, same principle for the rest of the levels"). The face and the body hold still and the tips lick. One rule for every form: each part
   has a line where it holds (nothing at or inside it moves), and past that line its points are carried by a wave that travels out toward the tip,
   across the tongue (the sway) and along it (the lick). A flame licks up from above its face, a sun's rays lick out from its disc, a star's points
   reach out from its middle. Several waves of unrelated speeds are added together, so it never repeats, and each point takes its phase from where
   it is, so neighbouring tips move on their own. Small flames flicker faster than big ones, as real ones do; a sun moves slowly.
   The outlines are moved control point by control point, so a curling tip stays a smooth curve and the body cannot show a seam. fireMove runs on
   every frame on the UI thread (a worklet), so it only does arithmetic. */
import { firePartsOf, SHAPES, tongue } from './flame-art';

export type FireStop = [offset: number, color: string, alpha: number];
export type FirePaint =
  | { t: 'lin'; x1: number; y1: number; x2: number; y2: number; stops: FireStop[] }
  /** rx and ry: a gradient whose box is not square is an ellipse */
  | { t: 'rad'; cx: number; cy: number; rx: number; ry: number; stops: FireStop[] };
export interface FireOp {
  /** the outline's control points, x and y in turn, in the drawing's units (120 by 120): each subpath is a start point and then threes for its curves */
  pts: number[];
  /** how many points each subpath has */
  subs: number[];
  /** for each point: its share of the motion, its phase, and the way its tongue points (x and y). Null when the shape holds still. */
  move: number[] | null;
  /** how far it sways across its tongue and licks along it, in the drawing's units, and how fast */
  across: number;
  along: number;
  speed: number;
  paint: FirePaint;
  /** the earlier shape that clips this one, or -1 */
  clip: number;
  line?: { width: number; color: string };
  /** a small flame beside the figure, not the figure */
  side: boolean;
}
export interface FireEmber {
  x: number;
  y: number;
  r: number;
  delay: number;
  dur: number;
}
export interface Fire {
  ops: FireOp[];
  embers: FireEmber[];
  /** the area the fire can reach, in the drawing's units, however high it leaps */
  box: { x: number; y: number; w: number; h: number };
}

/** how far a tap makes the fire leap, as a multiple of its idle motion */
export const FIRE_LEAP = 1.9;
/** how far an ember climbs before it is gone, in the drawing's units */
const EMBER_RISE = 26;

const OUTER: FireStop[] = [
  [0, '#FF8F2E', 1],
  [0.5, '#FF6B1E', 1],
  [1, '#E5421A', 1],
];
const MIDDLE: FireStop[] = [
  [0, '#FFB234', 1],
  [1, '#FF8C1E', 1],
];
const HEART: FireStop[] = [
  [0, '#FFEA55', 1],
  [0.45, '#FFD033', 1],
  [0.85, '#FFB224', 1],
  [1, '#FFA21E', 1],
];

/** the numbers of a path made of M, C and Z, as points */
function pointsOf(d: string): number[] {
  return (d.match(/-?\d*\.?\d+/g) || []).map(Number);
}
/** the tight box around an outline (a gradient's box is the shape's, not its control points') */
function boxOf(pts: number[]) {
  let x0 = Infinity,
    y0 = Infinity,
    x1 = -Infinity,
    y1 = -Infinity;
  const take = (x: number, y: number) => {
    x0 = Math.min(x0, x);
    x1 = Math.max(x1, x);
    y0 = Math.min(y0, y);
    y1 = Math.max(y1, y);
  };
  take(pts[0], pts[1]);
  for (let i = 2; i + 5 < pts.length; i += 6) {
    const [ax, ay, bx, by, cx, cy, dx, dy] = pts.slice(i - 2, i + 6);
    for (let n = 1; n <= 16; n++) {
      const u = n / 16,
        v = 1 - u;
      take(
        v * v * v * ax + 3 * v * v * u * bx + 3 * v * u * u * cx + u * u * u * dx,
        v * v * v * ay + 3 * v * v * u * by + 3 * v * u * u * cy + u * u * u * dy,
      );
    }
  }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}
/** an ellipse as four curves */
function ovalPts(cx: number, cy: number, rx: number, ry: number): number[] {
  const m = 0.5523;
  return [
    cx,
    cy - ry,
    cx + rx * m,
    cy - ry,
    cx + rx,
    cy - ry * m,
    cx + rx,
    cy,
    cx + rx,
    cy + ry * m,
    cx + rx * m,
    cy + ry,
    cx,
    cy + ry,
    cx - rx * m,
    cy + ry,
    cx - rx,
    cy + ry * m,
    cx - rx,
    cy,
    cx - rx,
    cy - ry * m,
    cx - rx * m,
    cy - ry,
    cx,
    cy - ry,
  ];
}
/** a rectangle as four curves */
function rectPts(x: number, y: number, w: number, h: number): number[] {
  const out = [x, y];
  for (const [a, b] of [
    [x + w, y],
    [x + w, y + h],
    [x, y + h],
    [x, y],
  ])
    out.push(out[out.length - 2], out[out.length - 1], a, b, a, b);
  return out;
}
const shape = (pts: number[], paint: FirePaint, clip = -1, side = false): FireOp => ({
  pts,
  subs: [pts.length / 2],
  move: null,
  across: 0,
  along: 0,
  speed: 1,
  paint,
  clip,
  side,
});

/* a flame's box is 100 wide and 120 tall, with its base at 120. From here up it moves: above the brows, so the face is never touched. */
const HOLD = { full: 64, small: 68, tiny: 68 } as const;
/* how far above the line the motion is whole */
const REACH = { full: 26, small: 30, tiny: 32 } as const;
/* each layer inside the last moves less and a little later, so the colors slide over each other */
const LAYER = [
  { share: 1, phase: 0 },
  { share: 0.78, phase: 0.7 },
  { share: 0.58, phase: 1.4 },
];
/** how the phase changes with height: the wave travels up */
const RISE_PHASE = 0.035;
/** how far apart two tips' phases are, in radians (the golden angle, so no two line up): tips side by side move on their own */
const TIP_PHASE = 2.399;
/* how a flame moves for each of the forms that are flames: [across, along, speed]. Small ones flicker faster. */
const FLAME_MOTION: Record<'full' | 'small' | 'tiny', [number, number, number]> = {
  tiny: [4, 8.5, 1.15],
  small: [4.5, 9, 1.08],
  full: [4, 9.5, 1],
};

/** which tongue of an outline each of its points belongs to. A tongue's tip is a corner higher than the corners on each side of it, and the tongue runs along the
    outline from the low corner before its tip to the low corner after it, so both its edges move as one (by nearness, an edge split in two and kinked at the shoulder). */
export function tipsOf(local: number[]): number[] {
  const corners: number[] = [];
  for (let i = 0; i < local.length - 2; i += 6) corners.push(local[i + 1]);
  const n = corners.length;
  const tips = corners.flatMap((y, i) => (y < corners[(i + 1) % n] && y < corners[(i + n - 1) % n] ? [i] : []));
  /* the low corner after each tip, on the way to the next one */
  const valleys = tips.map((t, k) => {
    const end = k + 1 < tips.length ? tips[k + 1] : tips[0] + n;
    let low = t + 1;
    for (let c = t + 1; c < end; c++) if (corners[c % n] > corners[low % n]) low = c;
    return low % n;
  });
  const of: number[] = [];
  for (let p = 0; p < local.length / 2; p++) {
    /* each corner is three points along the outline; the closing point is the first one again */
    const at = (p % (n * 3)) / 3;
    let tongue = tips.length - 1;
    for (let k = tips.length - 1; k >= 0; k--) {
      const from = valleys[(k + tips.length - 1) % tips.length];
      const to = valleys[k];
      if (from < to ? at > from && at <= to : at > from || at <= to) tongue = k;
    }
    of.push(tongue);
  }
  return of;
}

function flameOps(p: Extract<ReturnType<typeof firePartsOf>[number], { t: 'flame' }>, seed: number): FireOp[] {
  const a = (p.lean * Math.PI) / 180,
    cos = Math.cos(a),
    sin = Math.sin(a);
  /* the drawing's own turn around the foot of the box, its size, and its place */
  const place = (x: number, y: number): [number, number] => {
    const dy = y - 120;
    return [(x * cos - dy * sin) * p.k + p.cx, (x * sin + dy * cos) * p.k + p.by];
  };
  const placed = (pts: number[]) => {
    const out: number[] = [];
    for (let i = 0; i < pts.length; i += 2) out.push(...place(pts[i], pts[i + 1]));
    return out;
  };
  const axis: [number, number] = [sin, -cos];
  const [ac, al, sp] = FLAME_MOTION[p.kind];
  const speed = p.side ? sp * 1.25 : sp;
  const ops: FireOp[] = [];
  const outline = (d: string, layer: number, paint: FirePaint): number => {
    const local = pointsOf(d);
    const tip = tipsOf(local);
    const move: number[] = [];
    for (let i = 0; i < local.length; i += 2) {
      const s = HOLD[p.kind] - local[i + 1];
      /* it grows from the line, and goes on growing with height: a tip moves more than the root of its tongue */
      const w = s <= 0 ? 0 : Math.pow(Math.min(1, s / REACH[p.kind]), 1.2) * (0.5 + (0.5 * s) / HOLD[p.kind]) * LAYER[layer].share;
      move.push(w, seed + LAYER[layer].phase + tip[i / 2] * TIP_PHASE - s * RISE_PHASE, axis[0], axis[1]);
    }
    ops.push({ pts: placed(local), subs: [local.length / 2], move, across: ac * p.k, along: al * p.k, speed, paint, clip: -1, side: p.side });
    return ops.length - 1;
  };
  const lin = (d: string, x1: number, y1: number, x2: number, y2: number, stops: FireStop[]): FirePaint => {
    const b = boxOf(pointsOf(d));
    const [ax, ay] = place(b.x + x1 * b.w, b.y + y1 * b.h);
    const [bx, by] = place(b.x + x2 * b.w, b.y + y2 * b.h);
    return { t: 'lin', x1: ax, y1: ay, x2: bx, y2: by, stops };
  };
  const [out, mid, heart] = SHAPES[p.kind];
  const outer = outline(out, 0, lin(out, 0.1, 0, 0.9, 1, OUTER));
  if (!p.side) {
    const [cx, cy] = place(46, 98);
    ops.push(
      shape(
        placed(ovalPts(46, 98, 26, 36)),
        {
          t: 'rad',
          cx,
          cy,
          rx: 26 * p.k,
          ry: 36 * p.k,
          stops: [
            [0, '#D63A16', 0.55],
            [1, '#D63A16', 0],
          ],
        },
        outer,
      ),
    );
  }
  if (mid) outline(mid, 1, lin(mid, 0.2, 0, 0.8, 1, MIDDLE));
  const b = boxOf(pointsOf(heart));
  const [hx, hy] = place(b.x + 0.44 * b.w, b.y + 0.28 * b.h);
  const inner = outline(heart, 2, { t: 'rad', cx: hx, cy: hy, rx: 0.8 * b.w * p.k, ry: 0.8 * b.h * p.k, stops: HEART });
  if (!p.side) {
    const [sx, sy] = place(0, 30);
    const [ex, ey] = place(0, 116);
    ops.push(
      shape(
        placed(rectPts(-40, 30, 80, 86)),
        {
          t: 'lin',
          x1: sx,
          y1: sy,
          x2: ex,
          y2: ey,
          stops: [
            [0.6, '#FF8A1A', 0],
            [1, '#FF8A1A', 0.7],
          ],
        },
        inner,
      ),
    );
    const hly = p.kind === 'full' ? 60 : 72;
    const [lx, ly] = place(-4, hly);
    ops.push(
      shape(
        placed(ovalPts(-4, hly, 22, 16)),
        {
          t: 'rad',
          cx: lx,
          cy: ly,
          rx: 22 * p.k,
          ry: 16 * p.k,
          stops: [
            [0, '#FFF6B0', 0.6],
            [1, '#FFF6B0', 0],
          ],
        },
        inner,
      ),
    );
  }
  return ops;
}

/** a sun's rays: tips of flame around its edge, the same principle turned outward. The disc and the face are drawn over their feet and hold still. */
function sunOps(p: Extract<ReturnType<typeof firePartsOf>[number], { t: 'sun' }>): FireOp[] {
  const R = p.r + p.len;
  const ring = (
    len: number,
    bw: number,
    shift: number,
    seed: number,
    reach: number,
  ): Omit<FireOp, 'paint' | 'across' | 'along' | 'speed' | 'clip' | 'side'> => {
    const local = pointsOf(tongue(p.r, len, bw));
    const pts: number[] = [];
    const move: number[] = [];
    const subs: number[] = [];
    for (let i = 0; i < p.n; i++) {
      const a = (((i / p.n) * 360 + p.turn + shift) * Math.PI) / 180,
        cos = Math.cos(a),
        sin = Math.sin(a);
      subs.push(local.length / 2);
      for (let j = 0; j < local.length; j += 2) {
        const x = local[j],
          y = local[j + 1];
        pts.push(p.cx + x * cos - y * sin, p.cy + x * sin + y * cos);
        /* outward from the disc's edge; a ray's foot is under the disc */
        const s = -y - p.r;
        const w = s <= 0 ? 0 : Math.pow(Math.min(1, s / reach), 1.1);
        move.push(w, seed + i * 2.399 + (x / bw) * 0.5 - (s / reach) * 1.4, sin, -cos);
      }
    }
    return { pts, subs, move };
  };
  const radial = (stops: FireStop[]): FirePaint => ({ t: 'rad', cx: p.cx, cy: p.cy, rx: R, ry: R, stops });
  const foot = (0.86 * p.r) / R;
  return [
    {
      ...ring(p.len, p.r * 0.3, 0, 0, p.len),
      across: p.len * 0.2,
      along: p.len * 0.42,
      speed: 0.75,
      paint: radial([
        [foot, '#E5421A', 1],
        [(foot + 1) / 2, '#FF6B1E', 1],
        [1, '#FF8F2E', 1],
      ]),
      clip: -1,
      side: false,
    },
    {
      ...ring(p.len * 0.55, p.r * 0.26, 180 / p.n, 1.7, p.len * 0.55),
      across: p.len * 0.14,
      along: p.len * 0.34,
      speed: 0.85,
      paint: radial([
        [foot, '#FF8C1E', 1],
        [1, '#FFB234', 1],
      ]),
      clip: -1,
      side: false,
    },
  ];
}

/** the north star: its four points reach out and draw back, each on its own, and its middle holds still */
function starOps(p: Extract<ReturnType<typeof firePartsOf>[number], { t: 'star' }>): FireOp[] {
  const r = p.r,
    q = r * 0.16;
  const tips: [number, number][] = [
    [0, -r],
    [r, 0],
    [0, r],
    [-r, 0],
  ];
  const ctl: [number, number][] = [
    [q, -q],
    [q, q],
    [-q, q],
    [-q, -q],
  ];
  /* each quarter curve as a cubic, the same curve */
  const local: number[] = [...tips[0]];
  tips.forEach((a, i) => {
    const b = tips[(i + 1) % 4],
      c = ctl[i];
    local.push(a[0] + (2 / 3) * (c[0] - a[0]), a[1] + (2 / 3) * (c[1] - a[1]), b[0] + (2 / 3) * (c[0] - b[0]), b[1] + (2 / 3) * (c[1] - b[1]), b[0], b[1]);
  });
  const pts: number[] = [];
  const move: number[] = [];
  for (let i = 0; i < local.length; i += 2) {
    const x = local[i],
      y = local[i + 1],
      d = Math.hypot(x, y);
    const s = d - 0.4 * r;
    const w = s <= 0 ? 0 : Math.pow(Math.min(1, s / (0.6 * r)), 1.2);
    const quarter = Math.round((Math.atan2(y, x) / Math.PI) * 2);
    pts.push(p.cx + x, p.cy + y);
    move.push(w, quarter * 2.399 - (s / r) * 1.2, d ? x / d : 0, d ? y / d : -1);
  }
  return [
    {
      pts,
      subs: [pts.length / 2],
      move,
      across: r * 0.035,
      along: r * 0.15,
      speed: 0.7,
      paint: { t: 'rad', cx: p.cx - r + 0.44 * 2 * r, cy: p.cy - r + 0.28 * 2 * r, rx: 1.6 * r, ry: 1.6 * r, stops: HEART },
      clip: -1,
      line: { width: 0.8, color: '#FFB224' },
      side: false,
    },
  ];
}

/* the sways and licks added together, in radians a second. None is a multiple of another, so the fire never comes back to where it was. It burns calmly
   (the owner, October 31, 2026: too fast at first): a sway takes about two seconds and a lick a second and a half, and the quick ones are only a shiver on top. */
const W1 = 3.1;
const W2 = 5.3;
const W3 = 11.9;
const W4 = 4.3;
const W5 = 9.7;

/** an outline's control points at a moment (t in seconds). amp: how hard the fire is burning, 1 at rest and FIRE_LEAP at the top of a tap. */
export function fireMove(op: FireOp, t: number, amp: number): number[] {
  'worklet';
  const pts = op.pts;
  const move = op.move;
  if (!move) return pts;
  const out: number[] = new Array(pts.length);
  const T = t * op.speed;
  for (let i = 0, j = 0; i < pts.length; i += 2, j += 4) {
    const w = move[j];
    if (w === 0) {
      out[i] = pts[i];
      out[i + 1] = pts[i + 1];
      continue;
    }
    const ph = move[j + 1];
    const sway = Math.sin(T * W1 + ph) + 0.55 * Math.sin(T * W2 + ph * 1.7 + 1.3) + 0.12 * Math.sin(T * W3 + ph * 2.3 + 0.7);
    /* the lick reaches further than it draws back: real tips shoot up and fall away */
    const lick = 0.5 + 0.5 * Math.sin(T * W4 + ph * 0.9 + 2) + 0.18 * Math.sin(T * W5 + ph * 1.4);
    const c = op.across * sway * w * amp;
    const l = op.along * lick * w * w * amp;
    const ax = move[j + 2];
    const ay = move[j + 3];
    out[i] = pts[i] - ay * c + ax * l;
    out[i + 1] = pts[i + 1] + ax * c + ay * l;
  }
  return out;
}
/** an ember at a moment: where it is and how bright, [x, y, r, alpha]. It rises from its place in the drawing, drifts, shrinks and goes out. */
export function emberAt(e: FireEmber, t: number): [number, number, number, number] {
  'worklet';
  const raw = (t + e.delay) / e.dur;
  const p = raw - Math.floor(raw);
  return [e.x + Math.sin(p * 6.3 + e.delay * 3) * 1.8, e.y - EMBER_RISE * p, e.r * (1 - 0.45 * p), Math.sin(Math.PI * Math.min(1, p * 1.05))];
}

/** the fire in a level's drawing. sides: with the small flames beside the figure (the big flame leaves out the spark's). */
export function fireOf(level: number, sides = true): Fire {
  const ops: FireOp[] = [];
  const embers: FireEmber[] = [];
  let seed = 0;
  for (const p of firePartsOf(level)) {
    if (p.t === 'ember') embers.push({ x: p.x, y: p.y, r: p.r, delay: p.delay, dur: p.dur });
    else {
      if (p.t === 'flame' && p.side && !sides) continue;
      const mine = p.t === 'flame' ? flameOps(p, (seed += 2.1)) : p.t === 'sun' ? sunOps(p) : starOps(p);
      /* a clip names a shape in this part's list: move it to the whole list */
      ops.push(...mine.map((o) => (o.clip >= 0 ? { ...o, clip: o.clip + ops.length } : o)));
    }
  }
  /* the farthest the fire can go */
  let x0 = Infinity,
    y0 = Infinity,
    x1 = -Infinity,
    y1 = -Infinity;
  const reach = (x: number, y: number, d: number) => {
    x0 = Math.min(x0, x - d);
    x1 = Math.max(x1, x + d);
    y0 = Math.min(y0, y - d);
    y1 = Math.max(y1, y + d);
  };
  for (const o of ops) {
    /* a shape that is clipped by another stays inside it */
    if (o.clip >= 0) continue;
    const most = (o.across * 1.67 + o.along * 1.18) * FIRE_LEAP;
    for (let i = 0; i < o.pts.length; i += 2) reach(o.pts[i], o.pts[i + 1], (o.move ? o.move[i * 2] : 0) * most);
  }
  for (const e of embers) {
    reach(e.x, e.y, e.r + 2);
    reach(e.x, e.y - EMBER_RISE, e.r + 2);
  }
  x0 = Math.floor(x0 - 1);
  y0 = Math.floor(y0 - 1);
  return { ops, embers, box: { x: x0, y: y0, w: Math.ceil(x1 + 1) - x0, h: Math.ceil(y1 + 1) - y0 } };
}
