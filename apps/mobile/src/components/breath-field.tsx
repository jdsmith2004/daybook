/* The breathing figure on the web: its dots, the words for each step in a quiet italic, and a tiny nose or lips
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
  for (let i = 0; i < sc.dots.length; i += 7) dot(i);
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
