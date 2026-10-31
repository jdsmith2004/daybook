/* The flame's fire on a phone (core flame-fire.ts says what moves and how). Skia draws it on the UI thread with the GPU: the JS thread is not involved, and
   no picture is scaled, so it stays crisp and smooth however long it runs. The web has its own drawing (fire-layer.tsx). It rests when its screen is
   covered or in the background, and each change of `leap` (a tap) makes it leap and settle. */
import { emberAt, FIRE_LEAP, fireMove, type Fire, type FireOp, type FirePaint } from '@daybook/core';
import { Canvas, createPicture, PaintStyle, Picture, Skia, TileMode, type SkPaint, type SkPath } from '@shopify/react-native-skia';
import { useEffect, useMemo } from 'react';
import { Easing, useDerivedValue, useFrameCallback, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';

import { useOnScreen } from '@/lib/motion';

function shaderOf(p: FirePaint) {
  const colors = p.stops.map(([, c, a]) => {
    const v = Skia.Color(c);
    return Float32Array.of(v[0], v[1], v[2], a);
  });
  const at = p.stops.map(([o]) => o);
  if (p.t === 'lin') return Skia.Shader.MakeLinearGradient({ x: p.x1, y: p.y1 }, { x: p.x2, y: p.y2 }, colors, at, TileMode.Clamp);
  /* a circle of radius 1 at the origin, stretched into place: a gradient whose box is not square is an ellipse */
  const m = Skia.Matrix();
  m.translate(p.cx, p.cy);
  m.scale(p.rx, p.ry);
  return Skia.Shader.MakeRadialGradient({ x: 0, y: 0 }, 1, colors, at, TileMode.Clamp, m);
}
function paintOf(op: FireOp): SkPaint {
  const paint = Skia.Paint();
  paint.setAntiAlias(true);
  paint.setShader(shaderOf(op.paint));
  return paint;
}
function lineOf(op: FireOp): SkPaint | null {
  if (!op.line) return null;
  const paint = Skia.Paint();
  paint.setAntiAlias(true);
  paint.setStyle(PaintStyle.Stroke);
  paint.setStrokeWidth(op.line.width);
  paint.setColor(Skia.Color(op.line.color));
  return paint;
}
function pathOf(pts: number[], subs: number[]): SkPath {
  'worklet';
  const b = Skia.PathBuilder.Make();
  let i = 0;
  for (let s = 0; s < subs.length; s++) {
    const end = i + subs[s] * 2;
    b.moveTo(pts[i], pts[i + 1]);
    for (i += 2; i < end; i += 6) b.cubicTo(pts[i], pts[i + 1], pts[i + 2], pts[i + 3], pts[i + 4], pts[i + 5]);
    b.close();
  }
  return b.build();
}

/** the fire, placed in a drawing shown at `unit` points to each of its units (it fills `fire.box`) */
export function FireLayer({ fire, unit, leap = 0 }: { fire: Fire; unit: number; leap?: number }) {
  const t = useSharedValue(0);
  const amp = useSharedValue(1);
  const onScreen = useOnScreen();
  const { ops, embers, box } = fire;
  const paints = useMemo(() => ops.map(paintOf), [ops]);
  const lines = useMemo(() => ops.map(lineOf), [ops]);
  const ember = useMemo(() => {
    const p = Skia.Paint();
    p.setAntiAlias(true);
    p.setColor(Skia.Color('#FFE27A'));
    return p;
  }, []);
  /* a shape that holds still is made once */
  const held = useMemo(() => ops.map((o) => (o.move ? null : pathOf(o.pts, o.subs))), [ops]);
  /* each flame starts somewhere of its own, so two on one screen do not move alike */
  const from = useMemo(() => Math.random() * 60, []);
  const frame = useFrameCallback((f) => {
    t.value = from + (f.timeSinceFirstFrame || 0) / 1000;
  }, false);
  useEffect(() => {
    frame.setActive(onScreen);
    return () => frame.setActive(false);
  }, [frame, onScreen]);
  useEffect(() => {
    if (!leap) return;
    amp.value = withSequence(
      withTiming(FIRE_LEAP, { duration: 340, easing: Easing.out(Easing.cubic) }),
      withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
    );
  }, [leap, amp]);
  const picture = useDerivedValue(() => {
    const now = t.value;
    const a = amp.value;
    return createPicture((c) => {
      c.scale(unit, unit);
      c.translate(-box.x, -box.y);
      const paths: SkPath[] = [];
      for (let i = 0; i < ops.length; i++) {
        const op = ops[i];
        const path = held[i] ?? pathOf(fireMove(op, now, a), op.subs);
        paths.push(path);
        if (op.clip >= 0) {
          c.save();
          c.clipPath(paths[op.clip], 1, true);
          c.drawPath(path, paints[i]);
          c.restore();
        } else c.drawPath(path, paints[i]);
        const line = lines[i];
        if (line) c.drawPath(path, line);
      }
      for (let i = 0; i < embers.length; i++) {
        const [x, y, r, alpha] = emberAt(embers[i], now);
        ember.setAlphaf(alpha);
        c.drawCircle(x, y, r, ember);
      }
    });
  });
  return (
    <Canvas pointerEvents="none" style={{ position: 'absolute', left: box.x * unit, top: box.y * unit, width: box.w * unit, height: box.h * unit }}>
      <Picture picture={picture} />
    </Canvas>
  );
}
