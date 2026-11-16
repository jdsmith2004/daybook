/* What the breathing figure looks like at one moment: its dots and the color of its words. The web draws it on a canvas
   and a phone with Skia (components/breath-field), both from this one list, so they cannot drift apart. Everything here
   runs on the UI thread (each function is a worklet) and depends only on the time.

   It is made of small, flat, crisp dots and nothing else: no glow, no halo, no sun (the owner, November 15, 2026, of the
   glowing sun and the pictures round it: "scrap it ... make it look more like How We Feel"). Each pattern is one figure:
   - the sigh: rings of dots round one small circle. They go all the way into it on the breath in, every ring but the
     last, and it rests; "a little more" takes the last ring. They leave it, unhurried, on the breath out.
   - long breath out: a globe of dots. It fills from the top down and a light crosses it as you breathe in, and both go
     back as you breathe out.
   - box: a square grid of dots and one dot that walks round its edge, a side for each count of four. The grid leans
     toward the walking dot, swells on the breath in and flattens on the breath out.
   - 4-7-8: a ball of scattered dots that turns. It fills dot by dot on the breath in, is whole and quiet through the
     hold of seven, and lets go dot by dot on the long breath out.
   Every figure starts as one small dot while the words say to get settled, and its dots drift out of that dot from the
   first moment, so
   the figure is there before the first breath (the owner: "it should start shooting out while it's like get settled").
   The whole figure is one color at a time, and the color tells the step: rose, coral and gold on the way in, cooling to
   teal on the way out. With Reduce Motion nothing moves, and only the color and the words change. */
import { FIELD_ORDER, FIELD_PATTERNS, type FieldId } from '@daybook/core';

import { breathAt, type Steps } from '@/lib/breath';

/** the room the words and the nose take under the figure */
export const SCENE_WORDS = 104;
/* the tiny pictures under the words, on a 24 by 24 grid: a nose for a breath in, lips for a breath out */
export const SCENE_NOSE = 'M9.8 5C9.8 9 5.2 10.9 5.2 14a2.7 2.7 0 0 0 4.8 1.7c1 .8 3 .8 4 0a2.7 2.7 0 0 0 4.8-1.7C18.8 10.9 14.2 9 14.2 5';
export const SCENE_LIPS = [
  'M2.8 9c3-3 5.3-4.1 7.1-4.1.9 0 1.5.5 2.1.5s1.2-.5 2.1-.5c1.8 0 4.1 1.1 7.1 4.1-3 3.3-5.7 4.5-9.2 4.5S5.8 12.3 2.8 9z',
  'M2.8 9c3 .8 6.1 1.1 9.2 1.1s6.2-.3 9.2-1.1',
];

const TAU = Math.PI * 2;
const GOLD_NIGHT = [255, 205, 84];
/* on a light sky (SOS by day) the dots and the words are deeper, so they still read: a deep amber for gold, and every tone darkened */
const AMBER = [214, 126, 12];
const DEEP = 0.7;

/** a steady random number (0 to 1), the same every time */
function rnd(n: number) {
  'worklet';
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}
const hex = (h: string) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

/* the sky's colors, and for each pattern where in its round (0 to 1) each one falls: the breath in ends on gold */
const TONES = ['#E78BD2', '#F57B98', '#FF8D63', '#FFC64A', '#FFDD6B', '#C6E678', '#7CE0A8', '#5FCDD8', '#86A4F4', '#E78BD2'].map(hex);
const WHEN: Record<FieldId, number[]> = {
  sigh: [0, 0.11, 0.24, 0.36, 0.46, 0.6, 0.74, 0.88, 0.95, 1],
  long: [0, 0.1, 0.25, 0.4, 0.5, 0.64, 0.78, 0.9, 0.96, 1],
  box: [0, 0.08, 0.17, 0.25, 0.5, 0.6, 0.68, 0.75, 0.93, 1],
  four: [0, 0.07, 0.14, 0.21, 0.58, 0.7, 0.82, 0.93, 0.98, 1],
};
/** what a step is, as a number a worklet can switch on: 0 in, 1 hold, 2 out; and its air: 0 none, 1 nose, 2 mouth */
type Pat = { steps: Steps; kind: number[]; by: number[]; total: number; keys: number[][] };
const PAT = Object.fromEntries(
  FIELD_ORDER.map((id) => {
    const p = FIELD_PATTERNS[id];
    const by = p.by as Record<string, string | undefined>;
    return [
      id,
      {
        steps: p.steps.map(([k, s]) => [k, s]) as Steps,
        kind: p.steps.map(([k]) => (k === 'hold' ? 1 : k === 'out' ? 2 : 0)),
        by: p.steps.map(([k]) => (by[k] === 'nose' ? 1 : by[k] === 'mouth' ? 2 : 0)),
        total: p.steps.reduce((a, x) => a + x[1], 0),
        keys: WHEN[id].map((t, i) => [t, ...TONES[i]]),
      },
    ];
  }),
) as Record<FieldId, Pat>;

/* ---- the sigh: rings of dots round a small circle ---- */
const RINGS = 6;
const NEAR = 0.34;
const FALL = 0.38;
const FLY = 0.7;
/** [how far out it rests, its angle, when it arrives on a breath in, when it leaves on a breath out, when it drifts out in the settle, how fast its ring turns,
    its ring (0 is the inmost), a steady random number] */
const RING_DOTS: number[][] = [];
for (let r = 0; r < RINGS; r++) {
  const rr = NEAR + ((1 - NEAR) * r) / (RINGS - 1);
  const n = 10 + r * 7;
  for (let j = 0; j < n; j++) {
    const k = r * 97 + j;
    RING_DOTS.push([
      rr,
      ((j + (r % 2) * 0.5) / n) * TAU,
      Math.min(1, FALL + 0.02 + (r / (RINGS - 1)) * 0.52 + rnd(k + 3) * 0.08),
      ((RINGS - 1 - r) / (RINGS - 1)) * 0.2 + rnd(k + 4) * 0.08,
      (r / (RINGS - 1)) * 0.6 + rnd(k + 6) * 0.4,
      (r % 2 ? 1 : -0.7) * (0.05 - r * 0.004),
      r,
      rnd(k + 8),
    ]);
  }
}

/* ---- long breath out: a globe, dots along its lines ---- */
/** [x, y, z] on a ball of radius 1 */
const GLOBE: number[][] = [];
for (let j = 1; j < 12; j++) {
  const lat = -Math.PI / 2 + (Math.PI * j) / 12;
  const n = Math.max(1, Math.round(24 * Math.cos(lat)));
  for (let k = 0; k < n; k++) {
    const lon = ((k + (j % 2) * 0.5) / n) * TAU;
    GLOBE.push([Math.cos(lat) * Math.cos(lon), Math.sin(lat), Math.cos(lat) * Math.sin(lon)]);
  }
}

/* ---- box: a square grid ---- */
const GRID = 15;

/* ---- 4-7-8: a ball of scattered dots ---- */
const GOLDEN = 2.39996323;
/** [x, y, z, when it drifts out in the settle] */
const BALL: number[][] = [];
for (let i = 0; i < 230; i++) {
  const y = Math.max(-1, Math.min(1, 1 - (2 * (i + 0.5)) / 230 + (rnd(i + 5) - 0.5) * 0.05));
  const r = Math.sqrt(1 - y * y);
  const a = i * GOLDEN + (rnd(i + 9) - 0.5) * 0.7;
  BALL.push([r * Math.cos(a), y, r * Math.sin(a), rnd(i + 2)]);
}

function clamp(x: number) {
  'worklet';
  return Math.min(1, Math.max(0, x));
}
function smooth(x: number) {
  'worklet';
  return x * x * (3 - 2 * x);
}
function fract(x: number) {
  'worklet';
  return x - Math.floor(x);
}
/** the sky's color at `x` (0 to 1) of a round, as [red, green, blue] */
function skyAt(keys: number[][], x: number): number[] {
  'worklet';
  let i = 1;
  while (i < keys.length - 1 && keys[i][0] < x) i++;
  const a = keys[i - 1];
  const b = keys[i];
  const f = clamp((x - a[0]) / Math.max(0.0001, b[0] - a[0]));
  return [a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f, a[3] + (b[3] - a[3]) * f];
}
/** which step a breath is in at `b` seconds: [the step, seconds into it, how long it is] */
function stepAt(p: Pat, b: number): number[] {
  'worklet';
  let x = b - Math.floor(b / p.total) * p.total;
  for (let i = 0; i < p.steps.length; i++) {
    const dur = p.steps[i][1];
    if (x < dur) return [i, x, dur];
    x -= dur;
  }
  return [0, 0, p.steps[0][1]];
}

/** the words' color and how much they show at `t` seconds, as [red, green, blue, 0 to 1]: gold while settling, then the
    step's own color, fading out and in at each turn */
export function inkAt(id: FieldId, t: number, settle: number, still: boolean, light = false): number[] {
  'worklet';
  const p = PAT[id];
  const b = t - settle;
  const gold = light ? AMBER : GOLD_NIGHT;
  if (b < 0) return [gold[0], gold[1], gold[2], still ? 1 : clamp(Math.min(t / 0.8, -b / 0.45))];
  const c = skyAt(p.keys, fract(b / p.total));
  const st = stepAt(p, b);
  const fade = still ? 1 : clamp(Math.min(st[1] / 0.5, (st[2] - st[1]) / 0.4));
  /* by day the words are darker than the dots, to read as text */
  if (light) return [c[0] * 0.56, c[1] * 0.56, c[2] * 0.56, fade];
  const w = 0.08;
  return [c[0] + (255 - c[0]) * w, c[1] + (255 - c[1]) * w, c[2] + (255 - c[2]) * w, fade];
}

export type Scene = {
  /** every dot, seven numbers each: x, y, radius, red, green, blue, how much it shows */
  dots: number[];
  /** the nose (1) or the lips (2) under the words, or neither (0); where its 24 by 24 grid starts and how big a unit is */
  by: number;
  ix: number;
  iy: number;
  u: number;
  /** the words' color and how much they show */
  ink: number[];
};

/** the whole figure at `t` seconds, in a room `w` by `h` */
export function sceneAt(id: FieldId, t: number, w: number, h: number, settle: number, still: boolean, light = false): Scene {
  'worklet';
  const p = PAT[id];
  const dots: number[] = [];
  const ink = inkAt(id, t, settle, still, light);
  const R = Math.max(0, Math.min(w * 0.44, 176, (h - SCENE_WORDS) / 2 - 6));
  const cx = w / 2;
  const cy = (h - SCENE_WORDS) / 2;
  const u = 34 / 24;
  const ix = cx - 12 * u;
  const iy = h - SCENE_WORDS + 46;
  if (R < 60) return { dots, by: 0, ix, iy, u, ink };
  const b = t - settle;
  let v = 0;
  let out = 1;
  let step = 0;
  let at = 0;
  let dur = 1;
  if (b >= 0) {
    const br = breathAt(p.steps, b);
    v = br[0];
    out = br[2];
    const st = stepAt(p, b);
    step = st[0];
    at = st[1];
    dur = st[2];
  }
  if (still) v = 0.5;
  const part = b < 0 ? 0 : fract(b / p.total);
  const sky = skyAt(p.keys, part);
  if (light) {
    sky[0] *= DEEP;
    sky[1] *= DEEP;
    sky[2] *= DEEP;
  }
  if (b < 0 && !still) {
    /* while it settles it is gold, and it turns to the first breath's color as the breath comes */
    const gold = light ? AMBER : GOLD_NIGHT;
    const g = 1 - smooth(clamp((t - settle * 0.55) / Math.max(0.01, settle * 0.45)));
    for (let i = 0; i < 3; i++) sky[i] += (gold[i] - sky[i]) * g;
  }
  const full = smooth(v);
  /* the settle: one dot that grows, and from a third of the way in the figure's dots drift out of it, slowly */
  const settling = b < 0 && !still;
  /* the sigh lets its dots go from the first moment; the others grow their one dot first, then burst and gather */
  const from = id === 'sigh' ? 0 : settle * 0.42;
  const span = Math.max(0.01, settle - from);
  const born = settling ? smooth(clamp(t / 0.5)) : 1;
  /** how far a dot has come out of the middle (0 to 1); `late` (0 to 1) is its place in the line */
  const come = (late: number) => {
    'worklet';
    if (!settling) return 1;
    const f = clamp((t - from - late * span * 0.4) / (span * 0.6));
    return f * f * (3 - 2 * f);
  };
  const d = Math.max(1.8, Math.min(2.5, R / 70));
  /* the one dot: it grows the whole time it is alone, breathing a little, like a breath being drawn */
  const seed = R * (0.03 + 0.05 * smooth(clamp(t / Math.max(0.01, from)))) * (still ? 1 : 1 + 0.06 * Math.sin(t * 2.4));
  /** how far a dot is thrown off its path as the figure bursts out of the one dot and gathers: [x, y] */
  const toss = (i: number, e: number) => {
    'worklet';
    if (!settling) return [0, 0];
    const m = Math.sin(Math.PI * e) * R * (0.12 + 0.3 * rnd(i + 0.3));
    const a = rnd(i + 0.7) * TAU;
    return [m * Math.cos(a), m * Math.sin(a)];
  };

  if (id === 'sigh') {
    /* one small circle in the middle. Every dot goes all the way into it and is gone, and it grows a little for each one
       it holds. The first breath in takes every ring but the last and comes to rest; "a little more" takes the last ring. */
    const small = Math.max(d * 1.5, R * 0.024);
    const big = R * 0.085;
    const a1 = step === 0 ? clamp(at / (dur * 0.8)) : 1;
    const a2 = step === 1 ? clamp((at - 0.15) / Math.max(0.1, dur - 0.45)) : step === 0 ? 0 : 1;
    const o = step === 2 ? at / dur : 0;
    let inside = 0;
    for (let i = 0; i < RING_DOTS.length; i++) {
      const l = RING_DOTS[i];
      const rest = R * l[0];
      /* how far in it is (0 on its ring, 1 in the circle) */
      let pos = 0;
      if (still) {
        /* nothing moves */
      } else if (b < 0) {
        /* out of the circle from the first moment, quick at first and slowing to its ring */
        const f = clamp((t - l[4] * settle * 0.4) / (settle * 0.6));
        pos = (1 - f) * (1 - f);
      } else if (step < 2) {
        const e = l[6] === RINGS - 1 ? smooth(clamp((a2 - l[7] * 0.25) / 0.75)) : smooth(clamp((a1 - (l[6] / (RINGS - 2)) * 0.45 - l[7] * 0.08) / 0.47));
        pos = e * e;
      } else {
        pos = 1 - smooth(clamp((o - l[3]) / FLY));
      }
      inside += pos > 0.9 ? 1 : 0;
      const seen = 1 - clamp((pos - 0.9) / 0.1);
      if (seen <= 0.01) continue;
      const rad = rest + (small * 0.4 - rest) * pos;
      const ang = l[1] + (still ? 0 : l[5] * t) + 0.55 * pos;
      dots.push(cx + rad * Math.cos(ang), cy + rad * Math.sin(ang), d * (1 - 0.35 * pos), sky[0], sky[1], sky[2], seen);
    }
    const mid = still ? small : (small + (big - small) * Math.sqrt(inside / RING_DOTS.length)) * born;
    dots.push(cx, cy, mid, sky[0], sky[1], sky[2], 1);
  } else {
    if (id === 'long') {
      /* a globe: it turns slowly, and a light crosses it from one side to the other with the breath. It fills from the top
         down, dot by dot, so it swells like a chest and is never one ball pushed in and out */
      const turn = still ? 0.4 : 0.1 * t;
      const ct = Math.cos(turn);
      const sn = Math.sin(turn);
      const tilt = 0.32;
      const cq = Math.cos(tilt);
      const sq = Math.sin(tilt);
      const a = Math.PI * (0.12 + 0.76 * full);
      const lx = -Math.cos(a);
      const ly = -0.3;
      const lz = 0.25 + 0.75 * Math.sin(a);
      const ll = Math.sqrt(lx * lx + ly * ly + lz * lz);
      for (let i = 0; i < GLOBE.length; i++) {
        const g = GLOBE[i];
        const x = g[0] * ct + g[2] * sn;
        const z0 = -g[0] * sn + g[2] * ct;
        const y = g[1] * cq - z0 * sq;
        const z = g[1] * sq + z0 * cq;
        const e = come((g[1] + 1) / 2);
        const fill = smooth(clamp(v * 1.45 - ((g[1] + 1) / 2) * 0.45));
        const rad = R * (0.52 + 0.44 * fill);
        const lit = clamp(((x * lx + y * ly + z * lz) / ll) * 0.7 + 0.42);
        const near = z < 0 ? 0.42 : 1;
        const k = (1 + 0.16 * z) * e;
        dots.push(
          cx + x * rad * k + toss(i, e)[0],
          cy + y * rad * k + toss(i, e)[1],
          d * (0.5 + 1.15 * lit * lit) * (0.85 + 0.15 * z),
          sky[0],
          sky[1],
          sky[2],
          e * near * (0.18 + 0.82 * lit * Math.sqrt(lit)),
        );
      }
    } else if (id === 'box') {
      /* a square grid and one dot that walks round it: along the top on the breath in, down the side on the hold, back along
         the bottom on the breath out, up on the hold. The grid leans toward the walking dot (the near corner opens and
         brightens, the far one closes and fades), so the whole figure goes round with it. */
      const q = still || b < 0 ? 0 : (step + smooth(at / dur)) / 4;
      const side = Math.floor(q * 4) % 4;
      const f = q * 4 - Math.floor(q * 4);
      const wx = side === 0 ? -1 + 2 * f : side === 1 ? 1 : side === 2 ? 1 - 2 * f : -1;
      const wy = side === 0 ? -1 : side === 1 ? -1 + 2 * f : side === 2 ? 1 : 1 - 2 * f;
      const wl = Math.sqrt(wx * wx + wy * wy);
      const cl = wx / wl;
      const sl = wy / wl;
      const lean = still ? 0 : 0.16;
      const bulge = still ? 0.07 : 0.16 * full;
      const half = R * (0.6 + 0.08 * full);
      /** where a point of the grid is on the screen, and how near it is (about -1 to 1) */
      const put = (gx: number, gy: number) => {
        'worklet';
        const z = (gx * cl + gy * sl) / 1.42;
        const k = 1 / (1 - lean * z);
        return [cx + (gx * (1 + bulge * (1 - gy * gy)) * k - cl * lean * 0.5) * half, cy + (gy * (1 + bulge * (1 - gx * gx)) * k - sl * lean * 0.5) * half, z];
      };
      for (let iy2 = 0; iy2 < GRID; iy2++)
        for (let ix2 = 0; ix2 < GRID; ix2++) {
          const gx = (ix2 / (GRID - 1)) * 2 - 1;
          const gy = (iy2 / (GRID - 1)) * 2 - 1;
          const e = come(Math.max(Math.abs(gx), Math.abs(gy)));
          const at2 = put(gx * e, gy * e);
          /* it comes out evenly lit, and the light finds its corner as it opens */
          const lit = 0.45 + (clamp(0.5 + at2[2] * 0.62) - 0.45) * e;
          dots.push(
            at2[0] + toss(iy2 * GRID + ix2, e)[0],
            at2[1] + toss(iy2 * GRID + ix2, e)[1],
            d * (0.26 + 1.35 * lit * lit),
            sky[0],
            sky[1],
            sky[2],
            e * (0.05 + 0.95 * lit * Math.sqrt(lit)),
          );
        }
      /* the walker keeps just outside the grid's edge, along its curve */
      const e = come(1);
      const wk = put(wx * 1.13 * e, wy * 1.13 * e);
      dots.push(wk[0], wk[1], d * 1.9, sky[0], sky[1], sky[2], clamp(e * 3));
    } else {
      /* a ball of scattered dots that turns. It fills dot by dot on the breath in, is whole and quiet through the hold, and
         lets go dot by dot on the long breath out */
      const turn = still ? 0.4 : 0.16 * t;
      const ct = Math.cos(turn);
      const sn = Math.sin(turn);
      const tilt = 0.4;
      const cq = Math.cos(tilt);
      const sq = Math.sin(tilt);
      for (let i = 0; i < BALL.length; i++) {
        const g = BALL[i];
        const x = g[0] * ct + g[2] * sn;
        const z0 = -g[0] * sn + g[2] * ct;
        const y = g[1] * cq - z0 * sq;
        const z = g[1] * sq + z0 * cq;
        const e = come(g[3]);
        const fill = smooth(clamp(v * 1.5 - g[3] * 0.5));
        const rad = R * (0.3 + 0.64 * fill);
        const near = (z + 1) / 2;
        const k = (1 + 0.18 * z) * e;
        dots.push(
          cx + x * rad * k + toss(i, e)[0],
          cy + y * rad * k + toss(i, e)[1],
          d * (0.5 + 0.75 * near),
          sky[0],
          sky[1],
          sky[2],
          e * Math.min(1, 0.2 + 0.8 * near * Math.sqrt(near)) * (0.7 + 0.3 * fill),
        );
      }
    }
    /* the dot the figure came out of: it is gone by the first breath */
    if (settling) dots.push(cx, cy, seed * born * (1 - come(0.5)), sky[0], sky[1], sky[2], 1);
  }

  /* the air: dots rising into the nose on a breath in, and leaving the lips on a breath out */
  const by = b < 0 ? 0 : p.by[step];
  const fade = ink[3];
  if (by === 1)
    for (let side = -1; side <= 1; side += 2)
      for (let k = 0; k < 3; k++) {
        const q = still ? (k + 0.5) / 3 : fract(t * 0.7 + k / 3);
        dots.push(ix + (12 + side * (5.6 - 2 * q)) * u, iy + (28 - 10.5 * q) * u, (0.95 - 0.3 * q) * u, ink[0], ink[1], ink[2], fade * Math.sin(Math.PI * q));
      }
  else if (by === 2)
    for (let lane = -1; lane <= 1; lane++)
      for (let k = 0; k < 2; k++) {
        const q = still ? (k + 0.5) / 2 : fract(t * 0.42 + k / 2 + (lane + 1) * 0.17);
        dots.push(ix + (12 + lane * (1.8 + 4.4 * q)) * u, iy + (16.5 + 11 * q) * u, (0.65 + 0.3 * q) * u, ink[0], ink[1], ink[2], fade * Math.sin(Math.PI * q));
      }
  return { dots, by, ix, iy, u, ink };
}
