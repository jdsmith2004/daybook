/* What the breathing figure looks like at one moment: the sun, the dots round it, and the color of its words. The web
   draws it on a canvas and a phone with Skia (components/breath-field), both from this one list, so they cannot drift
   apart. Everything here runs on the UI thread (each function is a worklet) and depends only on the time.

   Every pattern has the sun in the middle, always gold, growing on a breath in and settling on a breath out, with a soft
   edge that gives off small sparks of light (the owner, November 15, 2026, of a flat disc: "the sun looks pretty
   artificial"). Each pattern is its own picture round it (the owner: "feel free to be creative so it's not a carbon copy"):
   - the sigh: a field of dots that dissolves into the sun on the breath in and shoots back out on the breath out.
   - long breath out: a sunrise over water. The sun climbs as you breathe in and the stars fade; it sinks slowly as you
     breathe out, and its light on the water narrows.
   - box: a square of dots, one side for each count of four. Light runs up, across, down and back, so a hold has somewhere
     to be.
   - 4-7-8: a sunflower of dots that opens on the breath in, ripples once a second through the hold of seven, and closes
     slowly on the long breath out.
   The dots' color tells the step, like a sky: rose, coral and gold on the way in, cooling to teal on the way out. With
   Reduce Motion nothing moves, and only the color and the words change. */
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

/* ---- the sigh: rings of dots round the sun ---- */
const RINGS = 5;
const NEAR = 0.6;
const FALL = 0.38;
const FLY = 0.5;
/** [how far out it rests, its angle, when it arrives on a breath in, when it leaves on a breath out, when it drifts out in the settle, how pale] */
const RING_DOTS: number[][] = [];
for (let r = 0; r < RINGS; r++) {
  const rr = NEAR + ((1 - NEAR) * r) / (RINGS - 1);
  const n = Math.round(22 + r * 6.5);
  for (let j = 0; j < n; j++) {
    const k = r * 97 + j;
    RING_DOTS.push([
      rr + (rnd(k + 1) - 0.5) * 0.045,
      ((j + (r % 2) * 0.5 + (rnd(k + 2) - 0.5) * 0.35) / n) * TAU,
      Math.min(1, FALL + 0.02 + (r / (RINGS - 1)) * 0.52 + rnd(k + 3) * 0.1),
      ((RINGS - 1 - r) / (RINGS - 1)) * 0.3 + rnd(k + 4) * 0.12,
      rnd(k + 6),
      rnd(k + 5) * 0.16,
    ]);
  }
}

/* ---- long breath out: stars over water ---- */
/** [x, y (parts of the radius from the middle; the horizon is at 0.5), twinkle speed, seed, size] */
const STARS: number[][] = [];
for (let i = 0; STARS.length < 64 && i < 400; i++) {
  const x = rnd(i * 3 + 1) * 2 - 1;
  const y = rnd(i * 3 + 2) * 1.42 - 1;
  if (x * x + y * y > 1 || y > 0.38) continue;
  STARS.push([x, y, 0.5 + rnd(i * 3 + 3) * 1.4, rnd(i + 0.7), 0.55 + rnd(i + 0.3) * 0.6]);
}
const SEA_ROWS = 5;
const HORIZON = 0.5;

/* ---- box: a square of dots ---- */
const BOX_SIDE = 10;
const BOX_HALF = 0.8;

/* ---- 4-7-8: a sunflower ---- */
const SEEDS = 120;
const GOLDEN = 2.39996323;

/* ---- the sun's sparks: [angle, seed, speed, size] ---- */
const SPARKS: number[][] = [];
for (let i = 0; i < 44; i++) SPARKS.push([rnd(i + 11) * TAU, rnd(i + 23), 0.75 + rnd(i + 37) * 0.6, 0.7 + rnd(i + 41) * 0.7]);

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
  /** the dots from this index on are drawn over the sun; the ones before it, under */
  over: number;
  /** the sun: x, y, radius, how full the breath is (0 to 1), and how far its faint halo reaches (it stays inside the room) */
  sun: number[];
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
  if (R < 60) return { dots, over: 0, sun: [cx, cy, 0, 0, 0], by: 0, ix, iy, u, ink };
  const b = t - settle;
  let v = 0;
  let out = 1;
  let step = 0;
  let at = 0;
  if (b >= 0) {
    const br = breathAt(p.steps, b);
    v = br[0];
    out = br[2];
    const st = stepAt(p, b);
    step = st[0];
    at = st[1];
  }
  if (still) v = 0.5;
  const part = b < 0 ? 0 : fract(b / p.total);
  const sky = skyAt(p.keys, part);
  if (light) {
    sky[0] *= DEEP;
    sky[1] *= DEEP;
    sky[2] *= DEEP;
  }
  const GOLD = light ? AMBER : GOLD_NIGHT;
  /* a dot is a touch paler than its tone at night, and never by day */
  const PALE = light ? 0 : 1;
  const full = smooth(v);
  /* the settle: the sun is a dot that grows, and the figure comes in round it over its second half */
  const born = b < 0 && !still ? 0.22 + 0.78 * smooth(clamp(t / Math.max(0.01, settle * 0.85))) : 1;
  const from = settle * 0.5;
  const span = Math.max(0.01, settle * 0.45);
  const intro = b < 0 && !still ? smooth(clamp((t - from) / span)) : 1;
  const d = Math.max(2.1, Math.min(2.8, R / 62));
  let sx = cx;
  let sy = cy;
  let sunR = R * (0.17 + 0.29 * full) * born;

  if (id === 'sigh') {
    const edge = sunR * 0.86;
    const turn = still ? 0 : 0.045 * t;
    for (let i = 0; i < RING_DOTS.length; i++) {
      const l = RING_DOTS[i];
      const rest = R * l[0];
      let rad = rest;
      let ang = l[1] + turn;
      let seen = 1;
      let gold = 0;
      let size = 1;
      if (still) {
        /* nothing moves */
      } else if (b < 0) {
        /* the settle: the dots drift out of the small sun */
        const f = clamp((t - from - l[4] * span * 0.45) / (span * 0.55));
        const fe = 1 - (1 - f) * (1 - f) * (1 - f);
        rad = edge + (rest - edge) * fe;
        seen = clamp(f * 5);
        gold = 1 - fe;
        size = 0.6 + 0.4 * fe;
      } else if (!out) {
        /* a breath in: it falls into the sun, curling a little, turning gold, and dissolves at the edge */
        const e = smooth(clamp((v - (l[2] - FALL)) / FALL));
        rad = rest + (edge - rest) * e * e;
        ang += 0.55 * e;
        seen = 1 - clamp((e - 0.72) / 0.28);
        gold = clamp((e - 0.35) / 0.65);
        size = 1 - 0.35 * e;
      } else {
        /* a breath out: it shoots from the sun, fast at first, and slows to rest */
        const f = clamp((1 - v - l[3]) / FLY);
        const fe = 1 - (1 - f) * (1 - f) * (1 - f);
        rad = edge + (rest - edge) * fe;
        seen = clamp(f * 7);
        gold = 1 - clamp(f / 0.6);
        size = 0.65 + 0.35 * fe;
      }
      if (seen <= 0.01) continue;
      const pale = l[5] * PALE;
      dots.push(
        cx + rad * Math.cos(ang),
        cy + rad * Math.sin(ang),
        d * size,
        sky[0] + (255 - sky[0]) * pale + (GOLD[0] - sky[0] - (255 - sky[0]) * pale) * gold,
        sky[1] + (255 - sky[1]) * pale + (GOLD[1] - sky[1] - (255 - sky[1]) * pale) * gold,
        sky[2] + (255 - sky[2]) * pale + (GOLD[2] - sky[2] - (255 - sky[2]) * pale) * gold,
        seen,
      );
    }
  } else if (id === 'long') {
    /* the sun climbs from just over the water */
    const y0 = cy + HORIZON * R;
    sunR = R * (0.15 + 0.2 * full) * born;
    sy = y0 - R * 0.22 - R * 0.62 * full;
    /* the stars go out as the sun comes up, and those near it first */
    for (let i = 0; i < STARS.length; i++) {
      const s = STARS[i];
      const x = cx + s[0] * R;
      const y = cy + s[1] * R;
      const far = Math.sqrt((x - sx) * (x - sx) + (y - sy) * (y - sy));
      const tw = still ? 0.85 : 0.72 + 0.28 * Math.sin(t * s[2] + s[3] * TAU);
      const seen = intro * (1 - 0.86 * full) * tw * clamp((far - sunR * 1.5) / (sunR * 1.2 + 1));
      if (seen <= 0.02) continue;
      dots.push(x, y, d * s[4], sky[0] + (255 - sky[0]) * 0.3 * PALE, sky[1] + (255 - sky[1]) * 0.3 * PALE, sky[2] + (255 - sky[2]) * 0.3 * PALE, seen);
    }
    /* the water: rows of dots that rock a little, lit gold in a path under the sun that widens as it climbs */
    for (let k = 0; k <= SEA_ROWS; k++) {
      const y = y0 + (k ? 0.03 + 0.092 * k : 0) * R;
      const gap = R * (0.105 + 0.016 * k);
      const n = Math.floor((R * 0.98) / gap);
      const wide = R * (0.1 + 0.075 * k) * (0.45 + 0.9 * full);
      for (let j = -n; j <= n; j++) {
        const rock = still || !k ? 0 : R * 0.012 * Math.sin(t * 0.9 + k * 1.3 + j * 0.6);
        const x = cx + j * gap + (k % 2 ? gap / 2 : 0) + rock;
        if (Math.abs(x - cx) > R) continue;
        const lit = clamp(1 - Math.abs(x - cx) / wide) * (0.35 + 0.65 * full);
        const glint = still ? 0.85 : 0.7 + 0.3 * Math.sin(t * 2.1 + j * 1.7 + k * 0.9);
        const g = lit * glint;
        /* the far edge of the water fades away */
        const rim = clamp((1 - Math.abs(x - cx) / R) * 3);
        dots.push(
          x,
          y,
          d * (k ? 0.72 + 0.06 * k : 0.8) * (1 + 0.45 * g),
          sky[0] + (GOLD[0] - sky[0]) * g,
          sky[1] + (GOLD[1] - sky[1]) * g,
          sky[2] + (GOLD[2] - sky[2]) * g,
          intro * rim * ((k ? 0.2 : 0.42) + 0.8 * g),
        );
      }
    }
  } else if (id === 'box') {
    /* a square, a side for each step: the light runs up on the breath in, across on the hold, down on the breath out and back */
    const a = R * BOX_HALF;
    const n = BOX_SIDE * 4;
    sunR = R * (0.19 + 0.25 * full) * born;
    for (let i = 0; i < n; i++) {
      const side = Math.floor(i / BOX_SIDE);
      const f = ((i % BOX_SIDE) / BOX_SIDE) * 2 - 1;
      const x = side === 0 ? -a : side === 1 ? f * a : side === 2 ? a : -f * a;
      const y = side === 0 ? -f * a : side === 1 ? -a : side === 2 ? f * a : a;
      /* how long ago the light passed this dot, in rounds; it stays lit for a side and fades */
      const ago = fract(part - i / n);
      const lit = still ? 0.5 : b < 0 ? 0 : ago < 0.25 ? 1 - 0.85 * smooth(ago / 0.25) : 0.15;
      const head = !still && b >= 0 ? clamp(1 - ago / 0.03) : 0;
      dots.push(
        cx + x,
        cy + y,
        d * (0.9 + 0.45 * lit + 0.5 * head),
        sky[0] + (GOLD[0] - sky[0]) * lit,
        sky[1] + (GOLD[1] - sky[1]) * lit,
        sky[2] + (GOLD[2] - sky[2]) * lit,
        intro * (0.32 + 0.68 * lit),
      );
    }
  } else {
    /* a sunflower: it opens on the breath in, ripples once a second through the hold, and closes on the breath out */
    sunR = R * (0.16 + 0.2 * full) * born;
    const open = 0.46 + 0.54 * full;
    const turn = still ? 0 : 0.03 * t + (1 - open) * 1.3;
    const holding = !still && b >= 0 && p.kind[step] === 1;
    const beat = fract(at);
    for (let i = 0; i < SEEDS; i++) {
      const fr = Math.sqrt((i + 8) / (SEEDS + 8));
      const rad = R * fr * open;
      if (rad < sunR * 0.8) continue;
      const ang = i * GOLDEN + turn;
      /* the ripple: a ring of light that leaves the sun on each second of a hold */
      const far = (rad - sunR) / Math.max(1, R * open - sunR);
      const wave = holding ? Math.exp(-Math.pow((far - beat * 1.15) / 0.16, 2)) * (1 - beat * 0.6) : 0;
      const pale = 0.14 * rnd(i + 0.5) * PALE;
      dots.push(
        cx + rad * Math.cos(ang),
        cy + rad * Math.sin(ang),
        d * (0.66 + 0.5 * fr) * (1 + 0.55 * wave),
        sky[0] + (255 - sky[0]) * pale + (GOLD[0] - sky[0]) * wave * 0.8,
        sky[1] + (255 - sky[1]) * pale + (GOLD[1] - sky[1]) * wave * 0.8,
        sky[2] + (255 - sky[2]) * pale + (GOLD[2] - sky[2]) * wave * 0.8,
        intro * clamp((rad - sunR * 0.8) / (sunR * 0.3 + 1)) * (0.78 + 0.22 * wave),
      );
    }
  }

  const over = dots.length;
  /* the sun's sparks: small lights that lift off its edge and fade, so the edge is alive and never a hard line */
  for (let i = 0; i < SPARKS.length; i++) {
    const s = SPARKS[i];
    const q = still ? s[1] : fract(t * 0.2 * s[2] + s[1]);
    const rad = sunR * (0.97 + 0.3 * q);
    const ang = s[0] + (still ? 0 : 0.3 * Math.sin(t * 0.35 + s[1] * TAU));
    dots.push(
      sx + rad * Math.cos(ang),
      sy + rad * Math.sin(ang),
      Math.max(0.5, sunR * 0.028 * s[3] * (1 - 0.5 * q)),
      light ? 240 : 255,
      light ? 160 : 226,
      light ? 40 : 150,
      Math.sin(Math.PI * q) * 0.7 * born,
    );
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
  /* the sun breathes very slightly by itself, so it is never a still disc */
  if (!still) sunR *= 1 + 0.012 * Math.sin(t * 1.1);
  const far = Math.max(sunR * 1.2, Math.min(sunR * 3.6, sx, w - sx, sy, h - SCENE_WORDS - sy + 40));
  return { dots, over, sun: [sx, sy, sunR, v, far], by, ix, iy, u, ink };
}
