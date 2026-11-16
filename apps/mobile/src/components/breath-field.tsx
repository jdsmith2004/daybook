/* The breathing figure: the sun, with a field of small crisp dots round it, the words for each step under it in a quiet
   italic, and a tiny nose or lips with the air moving through. Nothing else. (The owner, November 15, 2026, of the first
   mockup, which had no sun: "I don't think it's a replacement for the sun ... I want them to dissolve into the middle circle
   and shoot out as I breathe out ... the nose should show air going in and out".)

   It opens with a few seconds to settle: the sun is a small gold dot that slowly grows, and its dots drift out round it.
   A breath in draws the dots into the sun, the near ones first, each turning gold and dissolving as it arrives, and the
   sun grows with every one; the second, short breath in takes the last ring. A breath out shoots them back out, fast at
   first and slowing to rest, and the sun settles small. The dots' color tells the step, like a sky: rose, coral and gold
   on the way in, cooling through green to teal on the way out. The sun is always gold.

   This is the web's drawing: one canvas, redrawn whole each frame from the real time, so nothing can leave a trail (the
   first mockup's moving views did, on the web). A phone still draws the first mockup (breath-field.native.tsx) until the
   owner has chosen the look. With Reduce Motion the figure holds still, and only the color and the words change. The
   timing is core breath-field.ts. */
import { FIELD_PATTERNS, FIELD_SETTLE, fieldAt, type FieldId } from '@daybook/core';
import { createElement, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { breathAt, type Steps } from '@/lib/breath';
import { useOnScreen, useReducedMotion } from '@/lib/motion';
import { font } from '@/lib/theme';

const TAU = Math.PI * 2;
/** rings of dots round the sun */
const RINGS = 5;
/** where the inmost and outmost ring rest (parts of the figure's radius) */
const NEAR = 0.6;
const FAR = 1;
/** the sun, empty and full (parts of the figure's radius) */
const SUN_MIN = 0.17;
const SUN_MAX = 0.46;
/** how much of the breath a dot takes to fall in, and to fly out */
const FALL = 0.38;
const FLY = 0.5;
/** how fast the field turns, radians a second */
const TURN = 0.045;
/** the room the words and the nose take under the figure */
const WORDS = 104;
const GOLD = [255, 205, 84];

/** a steady random number (0 to 1) for a dot, the same every time */
const rnd = (n: number) => {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

type Dot = { rr: number; a0: number; arrive: number; launch: number; out: number; pale: number };
const DOTS: Dot[] = (() => {
  const out: Dot[] = [];
  for (let r = 0; r < RINGS; r++) {
    const rr = NEAR + ((FAR - NEAR) * r) / (RINGS - 1);
    const n = Math.round(22 + r * 6.5);
    for (let j = 0; j < n; j++) {
      const k = r * 97 + j;
      out.push({
        rr: rr + (rnd(k + 1) - 0.5) * 0.045,
        a0: ((j + (r % 2) * 0.5 + (rnd(k + 2) - 0.5) * 0.35) / n) * TAU,
        /* a breath in: the near rings arrive first, the far ring on the second breath in */
        arrive: Math.min(1, FALL + 0.02 + (r / (RINGS - 1)) * 0.52 + rnd(k + 3) * 0.1),
        /* a breath out: the far rings leave first */
        launch: ((RINGS - 1 - r) / (RINGS - 1)) * 0.3 + rnd(k + 4) * 0.12,
        /* the settle: when it drifts out */
        out: rnd(k + 6),
        pale: rnd(k + 5) * 0.16,
      });
    }
  }
  return out;
})();

/* the dots' colors through a breath, as [part of the round (0 to 1), red, green, blue] */
type Keys = number[][];
const hex = (h: string) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const SKY: Record<FieldId, Keys> = {
  sigh: (
    [
      [0, '#E78BD2'],
      [0.11, '#F57B98'],
      [0.24, '#FF8D63'],
      [0.36, '#FFC64A'],
      [0.46, '#FFDD6B'],
      [0.6, '#C6E678'],
      [0.74, '#7CE0A8'],
      [0.88, '#5FCDD8'],
      [0.95, '#86A4F4'],
      [1, '#E78BD2'],
    ] as [number, string][]
  ).map(([t, h]) => [t, ...hex(h)]),
};
function skyAt(keys: Keys, x: number): number[] {
  let i = 1;
  while (i < keys.length - 1 && keys[i][0] < x) i++;
  const a = keys[i - 1];
  const b = keys[i];
  const f = Math.min(1, Math.max(0, (x - a[0]) / Math.max(0.0001, b[0] - a[0])));
  return [a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f, a[3] + (b[3] - a[3]) * f];
}
const mix = (a: number[], b: number[], f: number) => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
const rgba = (c: number[], al = 1) => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${al.toFixed(3)})`;
const clamp = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (x: number) => x * x * (3 - 2 * x);

/* the tiny pictures under the words, on a 24 by 24 grid: a nose for a breath in, lips for a breath out */
const NOSE = 'M9.8 5C9.8 9 5.2 10.9 5.2 14a2.7 2.7 0 0 0 4.8 1.7c1 .8 3 .8 4 0a2.7 2.7 0 0 0 4.8-1.7C18.8 10.9 14.2 9 14.2 5';
const LIPS = [
  'M2.8 9c3-3 5.3-4.1 7.1-4.1.9 0 1.5.5 2.1.5s1.2-.5 2.1-.5c1.8 0 4.1 1.1 7.1 4.1-3 3.3-5.7 4.5-9.2 4.5S5.8 12.3 2.8 9z',
  'M2.8 9c3 .8 6.1 1.1 9.2 1.1s6.2-.3 9.2-1.1',
];

type Box = { w: number; h: number };

/** everything on the canvas at `t` seconds */
function draw(ctx: CanvasRenderingContext2D, box: Box, id: FieldId, t: number, settle: number, still: boolean) {
  const steps = FIELD_PATTERNS[id].steps as Steps;
  const total = steps.reduce((a, x) => a + x[1], 0);
  const keys = SKY[id];
  const { w, h } = box;
  ctx.clearRect(0, 0, w, h);
  const R = Math.max(0, Math.min(w * 0.44, 176, (h - WORDS) / 2 - 6));
  if (R < 60) return;
  const cx = w / 2;
  const cy = (h - WORDS) / 2;
  const b = t - settle;
  const now = fieldAt(id, t, settle);
  /* how full the breath is, and whether it is going out */
  let v = 0;
  let out = 1;
  if (b >= 0) {
    const at = breathAt(steps, b);
    v = at[0];
    out = at[2];
  }
  if (still) v = 0.5;
  /* the sun: a dot at first, grown to its small size by the end of the settle */
  const born = b < 0 && !still ? 0.22 + 0.78 * smooth(clamp(t / Math.max(0.01, settle - 0.6))) : 1;
  const sunR = R * (SUN_MIN + (SUN_MAX - SUN_MIN) * smooth(v)) * born;
  const edge = sunR * 0.86;
  const part = b < 0 ? 0 : (((b % total) + total) % total) / total;
  const sky = skyAt(keys, part);
  const turn = still ? 0 : TURN * t;
  const d = Math.max(2.1, Math.min(2.8, R / 62));

  /* the dots, under the sun, so one that arrives slips behind its edge */
  for (let i = 0; i < DOTS.length; i++) {
    const l = DOTS[i];
    const rest = R * l.rr;
    let rad = rest;
    let ang = l.a0 + turn;
    let seen = 1;
    let gold = 0;
    let size = 1;
    if (still) {
      /* nothing moves */
    } else if (b < 0) {
      /* the settle: the dots drift out of the small sun in its last seconds */
      const f = clamp((t - (settle - 2.4) - l.out * 1.1) / 1.3);
      const fe = 1 - (1 - f) * (1 - f) * (1 - f);
      rad = edge + (rest - edge) * fe;
      seen = clamp(f * 5);
      gold = 1 - fe;
      size = 0.6 + 0.4 * fe;
    } else if (!out) {
      /* a breath in: it falls into the sun, curling a little, turning gold, and dissolves at the edge */
      const e = smooth(clamp((v - (l.arrive - FALL)) / FALL));
      rad = rest + (edge - rest) * e * e;
      ang += 0.55 * e;
      seen = 1 - clamp((e - 0.72) / 0.28);
      gold = clamp((e - 0.35) / 0.65);
      size = 1 - 0.35 * e;
    } else {
      /* a breath out: it shoots from the sun, fast at first, and slows to rest */
      const f = clamp((1 - v - l.launch) / FLY);
      const fe = 1 - (1 - f) * (1 - f) * (1 - f);
      rad = edge + (rest - edge) * fe;
      seen = clamp(f * 7);
      gold = 1 - clamp(f / 0.6);
      size = 0.65 + 0.35 * fe;
    }
    if (seen <= 0.01) continue;
    const c = mix(mix(sky, [255, 255, 255], l.pale), GOLD, gold);
    ctx.fillStyle = rgba(c, seen);
    ctx.beginPath();
    ctx.arc(cx + rad * Math.cos(ang), cy + rad * Math.sin(ang), d * size, 0, TAU);
    ctx.fill();
  }

  /* the sun: a soft glow, then the round sun itself, lit from the upper left */
  const glowR = sunR * 2.3;
  const glow = ctx.createRadialGradient(cx, cy, sunR * 0.8, cx, cy, glowR);
  glow.addColorStop(0, `rgba(255,196,60,${(0.2 + 0.2 * v).toFixed(3)})`);
  glow.addColorStop(1, 'rgba(255,196,60,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, glowR, 0, TAU);
  ctx.fill();
  const core = ctx.createRadialGradient(cx - sunR * 0.12, cy - sunR * 0.32, 0, cx, cy, sunR * 1.15);
  core.addColorStop(0, '#FFF6CF');
  core.addColorStop(0.42, '#FFDA6B');
  core.addColorStop(1, '#FFB23E');
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(cx, cy, sunR, 0, TAU);
  ctx.fill();

  /* the words, in the step's color (gold while settling); they fade out and in at each turn */
  let fade = 1;
  if (!still) fade = b < 0 ? Math.min(1, t / 0.8, -b / 0.45) : Math.min(1, now.at / 0.5, (now.dur - now.at) / 0.4);
  fade = clamp(fade);
  const ink = b < 0 ? GOLD : mix(sky, [255, 255, 255], 0.08);
  const top = h - WORDS;
  ctx.fillStyle = rgba(ink, fade);
  ctx.font = `28px "${font.serifItalic}", Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(now.words, cx, top + 22);

  /* the nose or the lips, with the air moving: up into the nose on a breath in, out from the lips on a breath out */
  if (!now.by) return;
  const u = 34 / 24;
  ctx.save();
  ctx.translate(cx - 12 * u, top + 46);
  ctx.scale(u, u);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 1.25;
  ctx.strokeStyle = rgba(ink, fade);
  if (now.by === 'nose') {
    ctx.stroke(new Path2D(NOSE));
    for (let side = -1; side <= 1; side += 2)
      for (let k = 0; k < 3; k++) {
        /* three small dots a nostril, like the figure's own, rising and drawing together as they go in */
        const p = still ? (k + 0.5) / 3 : (((t * 0.7 + k / 3) % 1) + 1) % 1;
        ctx.fillStyle = rgba(ink, fade * Math.sin(Math.PI * p));
        ctx.beginPath();
        ctx.arc(12 + side * (5.6 - 2 * p), 28 - 10.5 * p, 0.95 - 0.3 * p, 0, TAU);
        ctx.fill();
      }
  } else {
    for (const p of LIPS) ctx.stroke(new Path2D(p));
    for (let lane = -1; lane <= 1; lane++)
      for (let k = 0; k < 2; k++) {
        /* a slow stream of dots leaving the lips, spreading as it goes */
        const p = still ? (k + 0.5) / 2 : (((t * 0.42 + k / 2 + (lane + 1) * 0.17) % 1) + 1) % 1;
        ctx.fillStyle = rgba(ink, fade * Math.sin(Math.PI * p));
        ctx.beginPath();
        ctx.arc(12 + lane * (1.8 + 4.4 * p), 16.5 + 11 * p, 0.65 + 0.3 * p, 0, TAU);
        ctx.fill();
      }
  }
  ctx.restore();
}

export function BreathField({
  id = 'sigh',
  on = true,
  settle = FIELD_SETTLE,
  onBreaths,
  freeze,
}: {
  id?: FieldId;
  /** it runs only while on */
  on?: boolean;
  /** seconds to settle first (0 for none) */
  settle?: number;
  /** told how many whole breaths are done, each time one ends */
  onBreaths?: (n: number) => void;
  /** hold the figure at this many seconds in, for a picture of one moment (the preview page) */
  freeze?: number;
}) {
  const still = useReducedMotion();
  const onScreen = useOnScreen();
  const canvas = useRef<HTMLCanvasElement>(null);
  const [box, setBox] = useState<Box | null>(null);
  const [t0] = useState(() => Date.now());
  /* the words, for a screen reader: the canvas is a picture to it */
  const [say, setSay] = useState('');
  const told = useRef({ onBreaths, done: 0 });
  told.current.onBreaths = onBreaths;
  const run = on && onScreen;
  useEffect(() => {
    const el = canvas.current;
    if (!el || !box) return;
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    el.width = Math.round(box.w * dpr);
    el.height = Math.round(box.h * dpr);
    const ctx = el.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    let raf = 0;
    let live = true;
    const frame = () => {
      const t = freeze ?? (Date.now() - t0) / 1000;
      draw(ctx, box, id, t, settle, still);
      const now = fieldAt(id, t, settle);
      setSay(now.words);
      if (now.done !== told.current.done) {
        told.current.done = now.done;
        if (now.done) told.current.onBreaths?.(now.done);
      }
      if (live && run && freeze == null) raf = requestAnimationFrame(frame);
    };
    frame();
    /* the words' own font may land a moment after the first frame */
    document.fonts?.ready.then(() => live && frame()).catch(() => undefined);
    return () => {
      live = false;
      cancelAnimationFrame(raf);
    };
  }, [box, id, settle, still, run, freeze, t0]);
  const el = useMemo(() => createElement('canvas', { ref: canvas, style: { position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' } }), []);
  return (
    <View style={s.room} onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none" aria-hidden>
        {el}
      </View>
      <Text style={s.say} aria-live="polite">
        {say}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  room: { flexGrow: 1, alignSelf: 'stretch', minHeight: WORDS },
  /* read out, not seen */
  say: { position: 'absolute', width: 1, height: 1, overflow: 'hidden', opacity: 0 },
});
