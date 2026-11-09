/* The flame's fire on a phone (core flame-fire.ts says what moves and how). Skia draws it on the UI thread with the GPU: the JS thread is not involved, and
   no picture is scaled, so it stays crisp and smooth however long it runs. The web has its own drawing (fire-layer.tsx). It rests when its screen is
   covered or in the background, and each change of `leap` (a tap) makes it leap and settle.
   Burning low (core flame-low.ts, `low` from 0 to 1): every color sinks toward a deep ember, the tips draw back toward the body, it sputters, smoke
   rises from its top and one ember glows in its heart. `burst` from 0 to 1 throws sparks out of the heart (the fire lit again). */
import { emberAt, FIRE_LEAP, fireMove, lowMatrix, SMOKE_N, smokeAt, sputterAt, type Fire, type FireOp, type FirePaint } from '@daybook/core';
import { BlurStyle, Canvas, createPicture, PaintStyle, Picture, Skia, TileMode, type SkPaint, type SkPath } from '@shopify/react-native-skia';
import { useEffect, useMemo } from 'react';
import { Easing, useDerivedValue, useFrameCallback, useSharedValue, withSequence, withTiming, type SharedValue } from 'react-native-reanimated';

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

/** sparks thrown out of the heart when it is lit again: [angle from straight up, speed, size] */
const SPARKS: [number, number, number][] = [
  [-0.2, 1, 1],
  [0.35, 0.85, 0.8],
  [-0.7, 0.75, 0.9],
  [0.8, 0.7, 0.7],
  [0.05, 1.15, 0.7],
  [-1.1, 0.55, 0.8],
  [1.2, 0.6, 0.9],
  [-0.45, 0.95, 0.6],
  [0.55, 1.05, 0.6],
  [-0.05, 0.7, 1.1],
];
/** how far the smoke can rise and drift, in the drawing's units at `fine` 1 */
const SMOKE_UP = 46;
const SMOKE_SIDE = 16;

/** the fire, placed in a drawing shown at `unit` points to each of its units (it fills `fire.box`). low and burst: shared values the picture around
    it moves with too (components/big-flame.tsx); fine: how big smoke and sparks are drawn, for a drawing brought in close; smoke: its color */
export function FireLayer({
  fire,
  unit,
  leap = 0,
  low,
  burst,
  fine = 1,
  smoke = '#8C8698',
}: {
  fire: Fire;
  unit: number;
  leap?: number;
  low?: SharedValue<number>;
  burst?: SharedValue<number>;
  fine?: number;
  smoke?: string;
}) {
  const t = useSharedValue(0);
  const amp = useSharedValue(1);
  const none = useSharedValue(0);
  const lv = low ?? none;
  const bv = burst ?? none;
  /* room above and beside the fire for the smoke, only where it can burn low */
  const pad = low ? { up: SMOKE_UP * fine, side: SMOKE_SIDE * fine } : { up: 0, side: 0 };
  const smokeColor = useMemo(() => Skia.Color(smoke), [smoke]);
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
    const l = lv.value;
    const b = bv.value;
    const a = amp.value * sputterAt(now, l);
    return createPicture((c) => {
      c.scale(unit, unit);
      c.translate(-box.x + pad.side, -box.y + pad.up);
      /* burning low: everything drawn inside one layer whose colors sink toward an ember */
      if (l > 0.002) {
        const lp = Skia.Paint();
        lp.setColorFilter(Skia.ColorFilter.MakeMatrix(lowMatrix(l)));
        c.saveLayer(lp);
      }
      const paths: SkPath[] = [];
      for (let i = 0; i < ops.length; i++) {
        const op = ops[i];
        const path = held[i] ?? pathOf(fireMove(op, now, a, l), op.subs);
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
        ember.setAlphaf(alpha * (1 - 0.6 * l));
        c.drawCircle(x, y, r, ember);
      }
      if (l > 0.002) c.restore();
      /* the one ember that always glows in its heart, breathing slowly */
      if (l > 0.05) {
        const on = Math.min(1, l * 1.2) * (0.75 + 0.25 * Math.sin(now * 1.7));
        const hp = Skia.Paint();
        hp.setAntiAlias(true);
        hp.setColor(Skia.Color('#FF6A1F'));
        hp.setAlphaf(0.8 * on);
        hp.setMaskFilter(Skia.MaskFilter.MakeBlur(BlurStyle.Normal, 6 * fine, true));
        c.drawCircle(fire.heart.x, fire.heart.y, 8 * fine, hp);
        /* its hot core */
        const core = Skia.Paint();
        core.setAntiAlias(true);
        core.setColor(Skia.Color('#FFB347'));
        core.setAlphaf(0.9 * on);
        core.setMaskFilter(Skia.MaskFilter.MakeBlur(BlurStyle.Normal, 1.6 * fine, true));
        c.drawCircle(fire.heart.x, fire.heart.y, 2.8 * fine, core);
      }
      /* smoke from the top of the fire, as low as it is burning */
      if (l > 0.02) {
        const x0 = fire.tip.x + (fire.heart.x - fire.tip.x) * l * 0.5;
        const y0 = fire.tip.y + (fire.heart.y - fire.tip.y) * l * 0.5;
        for (let i = 0; i < SMOKE_N; i++) {
          const [x, y, r, alpha] = smokeAt(i, now, l, x0, y0, fine);
          if (alpha <= 0.004) continue;
          const sp = Skia.Paint();
          sp.setAntiAlias(true);
          sp.setColor(smokeColor);
          sp.setAlphaf(alpha);
          sp.setMaskFilter(Skia.MaskFilter.MakeBlur(BlurStyle.Normal, r * 0.7, true));
          c.drawCircle(x, y, r, sp);
        }
      }
      /* lit again: sparks thrown up out of the heart, falling back a little as they fade */
      if (b > 0 && b < 1) {
        const sk = Skia.Paint();
        sk.setAntiAlias(true);
        for (let i = 0; i < SPARKS.length; i++) {
          const [ang, v, sz] = SPARKS[i];
          const p = Math.min(1, b * (1.1 + (i % 3) * 0.12));
          const d = 30 * fine * v * (1 - Math.pow(1 - p, 2.4));
          const x = fire.heart.x + Math.sin(ang) * d;
          const y = fire.heart.y - Math.cos(ang) * d + 9 * fine * p * p;
          sk.setColor(Skia.Color(i % 3 ? '#FFD45A' : '#FFF3B0'));
          sk.setAlphaf(Math.max(0, 1 - p) * Math.min(1, p * 8));
          c.drawCircle(x, y, 1.1 * fine * sz * (1 - 0.5 * p), sk);
        }
      }
    });
  });
  return (
    <Canvas
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: (box.x - pad.side) * unit,
        top: (box.y - pad.up) * unit,
        width: (box.w + pad.side * 2) * unit,
        height: (box.h + pad.up) * unit,
      }}>
      <Picture picture={picture} />
    </Canvas>
  );
}
