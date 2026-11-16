/* The Squeeze figure on the web: its dots and the words under them, in a quiet italic. What it looks like at each moment is
   lib/squeeze-scene.ts, which a phone draws too (squeeze-field.native.tsx); the timing is core squeeze.ts.

   It is one canvas, redrawn whole each frame from the real time, so nothing can leave a trail (the old ring of a wavy line
   was redrawn as a new path many times a second and flickered on the web: the owner, November 15, 2026, "the line is super
   glitchy"). */
import { squeezeAt } from '@daybook/core';
import { createElement, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { squeezeScene, SQZ_WORDS } from '@/lib/squeeze-scene';
import { useOnScreen, useReducedMotion } from '@/lib/motion';
import { font } from '@/lib/theme';

const TAU = Math.PI * 2;
type Box = { w: number; h: number };
export type SqueezeFieldProps = {
  /** it runs only while on */
  on?: boolean;
  /** the moment it started (milliseconds); the figure, the words and the taps all count from it */
  start: number | null;
  /** hold the figure at this many seconds in, for a picture of one moment */
  freeze?: number;
  /** on a light sky (SOS by day): deeper dots and words */
  light?: boolean;
};

function draw(ctx: CanvasRenderingContext2D, box: Box, t: number, still: boolean, light: boolean) {
  const sc = squeezeScene(t, box.w, box.h, still, light);
  ctx.clearRect(0, 0, box.w, box.h);
  const d = sc.dots;
  for (let i = 0; i < d.length; i += 7) {
    if (d[i + 6] <= 0.01) continue;
    ctx.fillStyle = `rgba(${Math.round(d[i + 3])},${Math.round(d[i + 4])},${Math.round(d[i + 5])},${d[i + 6].toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(d[i], d[i + 1], d[i + 2], 0, TAU);
    ctx.fill();
  }
  const k = sc.ink;
  ctx.fillStyle = `rgba(${Math.round(k[0])},${Math.round(k[1])},${Math.round(k[2])},${k[3].toFixed(3)})`;
  const n = squeezeAt(t);
  /* the last three seconds of a hold are counted big */
  const count = n.kind === 'hold' && n.left <= 3;
  ctx.font = count ? `44px "${font.serifItalic}", Georgia, serif` : `28px "${font.serifItalic}", Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(n.words, box.w / 2, box.h - SQZ_WORDS + 30);
}

export function SqueezeField({ on = true, start, freeze, light = false }: SqueezeFieldProps) {
  const still = useReducedMotion();
  const onScreen = useOnScreen();
  const canvas = useRef<HTMLCanvasElement>(null);
  const [box, setBox] = useState<Box | null>(null);
  /* the words, for a screen reader: the canvas is a picture to it */
  const [say, setSay] = useState('');
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
      draw(ctx, box, t, still, light);
      setSay(squeezeAt(t).words);
      if (live && run && freeze == null) raf = requestAnimationFrame(frame);
    };
    frame();
    /* the words' own font may land a moment after the first frame */
    document.fonts?.ready.then(() => live && frame()).catch(() => undefined);
    return () => {
      live = false;
      cancelAnimationFrame(raf);
    };
  }, [box, still, run, freeze, start, light]);
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
  room: { flexGrow: 1, alignSelf: 'stretch', minHeight: SQZ_WORDS + 140 },
  /* read out, not seen */
  say: { position: 'absolute', width: 1, height: 1, overflow: 'hidden', opacity: 0 },
});
