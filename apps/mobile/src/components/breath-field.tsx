/* The breathing figure on the web: the sun, its dots, the words for each step in a quiet italic, and a tiny nose or lips
   with the air moving through. Nothing else. What it looks like at each moment is lib/breath-scene.ts, which a phone draws
   too (breath-field.native.tsx); the timing is core breath-field.ts.

   It is one canvas, redrawn whole each frame from the real time, so nothing can leave a trail (the first mockup's moving
   views did, on the web: the owner, November 15, 2026, "it looks like the screen is glitching"). */
import { FIELD_SETTLE, fieldAt, type FieldId } from '@daybook/core';
import { createElement, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { SCENE_LIPS, SCENE_NOSE, SCENE_WORDS, sceneAt } from '@/lib/breath-scene';
import { useOnScreen, useReducedMotion } from '@/lib/motion';
import { font } from '@/lib/theme';

const TAU = Math.PI * 2;
type Box = { w: number; h: number };
export type BreathFieldProps = {
  id?: FieldId;
  /** it runs only while on */
  on?: boolean;
  /** the moment it started (milliseconds); the figure, the words and the taps all count from it */
  start: number | null;
  /** seconds to settle first (0 for none) */
  settle?: number;
  /** told how many whole breaths are done, each time one ends */
  onBreaths?: (n: number) => void;
  /** hold the figure at this many seconds in, for a picture of one moment (the preview page) */
  freeze?: number;
  /** on a light sky (SOS by day): deeper dots and words */
  light?: boolean;
};

/** the sun: a wide faint halo, a bloom, and a disc that is white hot in the middle and feathers away at its edge */
export function drawSun(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, v: number, far: number) {
  if (r <= 0.5) return;
  const halo = ctx.createRadialGradient(x, y, Math.min(r * 0.8, far * 0.9), x, y, far);
  const a = 0.1 + 0.07 * v;
  halo.addColorStop(0, `rgba(255,170,84,${a.toFixed(3)})`);
  halo.addColorStop(0.45, `rgba(255,170,84,${(a * 0.36).toFixed(3)})`);
  halo.addColorStop(0.8, `rgba(255,170,84,${(a * 0.06).toFixed(3)})`);
  halo.addColorStop(1, 'rgba(255,170,84,0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(x, y, far, 0, TAU);
  ctx.fill();
  const bloom = ctx.createRadialGradient(x, y, r * 0.7, x, y, r * 2);
  bloom.addColorStop(0, `rgba(255,204,96,${(0.4 + 0.2 * v).toFixed(3)})`);
  bloom.addColorStop(1, 'rgba(255,204,96,0)');
  ctx.fillStyle = bloom;
  ctx.beginPath();
  ctx.arc(x, y, r * 2, 0, TAU);
  ctx.fill();
  const disc = ctx.createRadialGradient(x, y, 0, x, y, r * 1.14);
  for (const [o, c] of SUN_STOPS) disc.addColorStop(o, c);
  ctx.fillStyle = disc;
  ctx.beginPath();
  ctx.arc(x, y, r * 1.14, 0, TAU);
  ctx.fill();
}
const SUN_STOPS: [number, string][] = [
  [0, 'rgba(255,253,240,1)'],
  [0.3, 'rgba(255,241,182,1)'],
  [0.6, 'rgba(255,217,108,1)'],
  [0.8, 'rgba(255,192,74,1)'],
  [0.88, 'rgba(255,178,62,0.86)'],
  [1, 'rgba(255,160,52,0)'],
];

function draw(ctx: CanvasRenderingContext2D, box: Box, id: FieldId, t: number, settle: number, still: boolean, light: boolean) {
  const sc = sceneAt(id, t, box.w, box.h, settle, still, light);
  ctx.clearRect(0, 0, box.w, box.h);
  const dot = (i: number) => {
    const a = sc.dots[i + 6];
    if (a <= 0.01) return;
    ctx.fillStyle = `rgba(${Math.round(sc.dots[i + 3])},${Math.round(sc.dots[i + 4])},${Math.round(sc.dots[i + 5])},${a.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(sc.dots[i], sc.dots[i + 1], sc.dots[i + 2], 0, TAU);
    ctx.fill();
  };
  for (let i = 0; i < sc.over; i += 7) dot(i);
  drawSun(ctx, sc.sun[0], sc.sun[1], sc.sun[2], sc.sun[3], sc.sun[4]);
  for (let i = sc.over; i < sc.dots.length; i += 7) dot(i);
  /* the words */
  const ink = `rgba(${Math.round(sc.ink[0])},${Math.round(sc.ink[1])},${Math.round(sc.ink[2])},${sc.ink[3].toFixed(3)})`;
  ctx.fillStyle = ink;
  ctx.font = `28px "${font.serifItalic}", Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(fieldAt(id, t, settle).words, box.w / 2, box.h - SCENE_WORDS + 22);
  /* the nose or the lips */
  if (!sc.by) return;
  ctx.save();
  ctx.translate(sc.ix, sc.iy);
  ctx.scale(sc.u, sc.u);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 1.25;
  ctx.strokeStyle = ink;
  if (sc.by === 1) ctx.stroke(new Path2D(SCENE_NOSE));
  else for (const p of SCENE_LIPS) ctx.stroke(new Path2D(p));
  ctx.restore();
}

export function BreathField({ id = 'sigh', on = true, start, settle = FIELD_SETTLE, onBreaths, freeze, light = false }: BreathFieldProps) {
  const still = useReducedMotion();
  const onScreen = useOnScreen();
  const canvas = useRef<HTMLCanvasElement>(null);
  const [box, setBox] = useState<Box | null>(null);
  /* the words, for a screen reader: the canvas is a picture to it */
  const [say, setSay] = useState('');
  const told = useRef({ onBreaths, done: 0 });
  told.current.onBreaths = onBreaths;
  const run = on && onScreen && start != null;
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
      const t = freeze ?? (start == null ? 0 : (Date.now() - start) / 1000);
      draw(ctx, box, id, t, settle, still, light);
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
  }, [box, id, settle, still, run, freeze, start, light]);
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
  room: { flexGrow: 1, alignSelf: 'stretch', minHeight: SCENE_WORDS },
  /* read out, not seen */
  say: { position: 'absolute', width: 1, height: 1, overflow: 'hidden', opacity: 0 },
});
