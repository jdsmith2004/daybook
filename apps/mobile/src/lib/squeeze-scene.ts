/* What the Squeeze figure looks like at one moment: its dots and the color of its words. The web draws it on a canvas and a
   phone with Skia (components/squeeze-field), both from this one list, the way the breathing figure is made
   (lib/breath-scene.ts). Everything here runs on the UI thread (each function is a worklet) and depends only on the time,
   so nothing can leave a trail or jump.

   One disc of small flat dots, laid out like the seeds of a sunflower. It is the person's grip:
   - get ready: one dot, and the disc drifts out of it.
   - squeeze: the dots pull in hard to a tight knot, twisting a little like a wrung cloth, and keep tightening as the hold
     goes on. The color heats from coral to a hot rose, and the knot trembles more as the seconds go, the way a held
     muscle shakes.
   - let go: the knot opens from the middle out, a wave that goes a little past where it rests and settles back, and the
     warmth (gold) spreads out with it. Then it cools to a calm mint while the dots drift, so the next squeeze reads as heat
     coming back.
   With Reduce Motion nothing moves, and only the color and the words change. */
import { squeezeAt } from '@daybook/core';

/** the room the words take under the figure */
export const SQZ_WORDS = 92;

const TAU = Math.PI * 2;
const GOLDEN = 2.39996323;
const N = 210;
/** [how far out (0 to 1), its angle, a steady random number] */
const DISC: number[][] = [];
for (let i = 0; i < N; i++) {
  const x = Math.sin((i + 1) * 12.9898) * 43758.5453;
  DISC.push([Math.sqrt((i + 0.5) / N), i * GOLDEN, x - Math.floor(x)]);
}

const hex = (h: string) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const GOLD = hex('#FFC64A');
const AMBER = hex('#D67E0C');
const CORAL = hex('#FF8D63');
const HOT = hex('#F5476A');
const MINT = hex('#7CE0A8');
/* on a light sky (SOS by day) every tone is deeper, so the dots still read */
const DEEP = 0.7;

function clamp(x: number) {
  'worklet';
  return Math.min(1, Math.max(0, x));
}
function smooth(x: number) {
  'worklet';
  const c = clamp(x);
  return c * c * (3 - 2 * c);
}
/** fast at first, then easing in: the pull of a squeeze */
function outCubic(x: number) {
  'worklet';
  const c = 1 - clamp(x);
  return 1 - c * c * c;
}
/** goes a little past 1 and settles back: the knot springing open */
function outBack(x: number) {
  'worklet';
  const c = clamp(x) - 1;
  const k = 1.6;
  return 1 + (k + 1) * c * c * c + k * c * c;
}
function mix(a: number[], b: number[], f: number) {
  'worklet';
  const g = clamp(f);
  return [a[0] + (b[0] - a[0]) * g, a[1] + (b[1] - a[1]) * g, a[2] + (b[2] - a[2]) * g];
}

/** how tight the grip is at the end of a hold (0 open, 1 the tightest knot) */
const KNOT = 0.56;
const TIGHTER = 0.08;

/** how closed the disc is at the very end of a hold, as a scale of its open size */
const HELD = 1 - KNOT - TIGHTER;

/** the color of the whole figure and of its middle, at `t` seconds: for the words */
function toneAt(t: number): number[] {
  'worklet';
  const n = squeezeAt(t);
  if (n.kind === 'ready') return GOLD;
  if (n.kind === 'hold') {
    const from = n.i === 0 ? GOLD : MINT;
    return mix(mix(from, CORAL, smooth(n.s / 0.6)), HOT, smooth((n.s - 0.6) / (n.dur - 0.6)));
  }
  if (n.kind === 'rest') return mix(mix(HOT, GOLD, smooth(n.s / 1.6)), MINT, smooth((n.s - 2.6) / 4));
  return MINT;
}

/** the words' color and how much they show at `t` seconds, as [red, green, blue, 0 to 1] */
export function sqzInkAt(t: number, still: boolean, light = false): number[] {
  'worklet';
  const n = squeezeAt(t);
  const c = toneAt(t);
  const fade = still ? 1 : clamp(n.ws / 0.3);
  if (light) return [c[0] * 0.56, c[1] * 0.56, c[2] * 0.56, fade];
  const w = 0.12;
  return [c[0] + (255 - c[0]) * w, c[1] + (255 - c[1]) * w, c[2] + (255 - c[2]) * w, fade];
}

export type SqueezeScene = {
  /** every dot, seven numbers each: x, y, radius, red, green, blue, how much it shows */
  dots: number[];
  ink: number[];
};

/** the figure at `t` seconds, in a box `w` by `h` (the words take the bottom SQZ_WORDS of it) */
export function squeezeScene(t: number, w: number, h: number, still: boolean, light = false): SqueezeScene {
  'worklet';
  const dots: number[] = [];
  const ink = sqzInkAt(t, still, light);
  const R = Math.max(0, Math.min(w * 0.42, 160, (h - SQZ_WORDS) / 2 - 8));
  if (R < 50) return { dots, ink };
  const cx = w / 2;
  const cy = (h - SQZ_WORDS) / 2;
  const n = squeezeAt(t);
  const tone = toneAt(t);
  const d = Math.max(2, Math.min(2.8, R / 58));
  for (let i = 0; i < N; i++) {
    const q = DISC[i][0];
    const a0 = DISC[i][1];
    const rn = DISC[i][2];
    /* how open this dot's place is (1 open, HELD in the tightest knot), how far it twists, how much it shakes */
    let open = 1;
    let twist = 0;
    let shake = 0;
    let col = tone;
    let show = 0.92;
    let size = d;
    if (n.kind === 'ready') {
      /* one dot, and the disc drifts out of it from a third of the way in, the middle first */
      const f = smooth((n.s - n.dur * 0.3 - q * n.dur * 0.25) / (n.dur * 0.45));
      open = still ? 1 : f;
      show = still ? 0.92 : i === 0 ? 0.92 : 0.92 * smooth(f * 3);
    } else if (n.kind === 'hold') {
      const pull = outCubic(n.s / 0.55);
      const k = KNOT * pull + TIGHTER * smooth(n.s / n.dur);
      open = 1 - k;
      twist = 0.5 * k * (1 - q * 0.6);
      shake = (0.5 + 2.2 * smooth(n.s / n.dur)) * pull;
      /* packed tight, the dots grow a little, so the knot reads as solid */
      size = d * (1 + 0.12 * pull);
      /* the middle is the hottest */
      col = mix(tone, HOT, (1 - q) * 0.35 * pull);
    } else if (n.kind === 'rest') {
      /* the knot opens from the middle out */
      const f = (n.s - q * 0.5) / 1.5;
      const back = outBack(f);
      open = HELD + (1 - HELD) * back;
      twist = 0.5 * (KNOT + TIGHTER) * (1 - q * 0.6) * (1 - smooth(f));
      size = d * (1 + 0.12 * (1 - smooth(f)));
      /* the warmth spreads out with the wave, then cools */
      const warm = smooth(f * 1.4) * (1 - smooth((n.s - 2.6) / 4));
      col = mix(mix(HOT, CORAL, smooth(f)), GOLD, warm);
      if (n.s > 2.6) col = mix(col, MINT, smooth((n.s - 2.6) / 4));
    }
    if (still) {
      open = 1;
      twist = 0;
      shake = 0;
    }
    /* alive at rest: each dot drifts a little on its own */
    const drift = still ? 0 : R * 0.012;
    const a = a0 + twist;
    const r = q * R * open;
    let x = cx + Math.cos(a) * r + Math.sin(t * 0.7 + rn * TAU) * drift;
    let y = cy + Math.sin(a) * r + Math.cos(t * 0.6 + rn * 9) * drift;
    if (shake > 0) {
      x += Math.sin(t * 37 + rn * 50) * shake;
      y += Math.cos(t * 41 + rn * 70) * shake;
    }
    let c = col;
    if (n.kind === 'ready') c = light ? AMBER : GOLD;
    if (light) c = [c[0] * DEEP, c[1] * DEEP, c[2] * DEEP];
    /* the rim is a little fainter and finer than the middle, so the disc has a soft edge without a line */
    dots.push(x, y, size * (0.82 + 0.18 * (1 - q)), c[0], c[1], c[2], show * (0.7 + 0.3 * (1 - q * q)));
  }
  return { dots, ink };
}
