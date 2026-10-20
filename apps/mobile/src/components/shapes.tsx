/* The playful shapes the tools are drawn with, and the squiggly lines where a plain bar or ring would go. The shapes are
   Android's own Material 3 Expressive set (lib/m3-shapes: cookies, sunny, clovers, gem, arch, pill, heart, burst and the
   rest), so they have the same soft, carefully rounded corners. The squiggles follow Material's wavy progress
   indicators: a thin stroke, small waves, a gap before the quiet track, and a slow crawl. Pure SVG, so they look the same
   on iOS, Android and the web. */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { morphPoints, shapePath, shapePoints, smoothPath, type M3Shape } from '@/lib/m3-shapes';
import { SPRING, useReducedMotion } from '@/lib/motion';

export type { M3Shape } from '@/lib/m3-shapes';
/** a Material shape, or one of the older names (cookie is the 9-sided cookie, scallop the 12-sided one, clover the 4-leaf
    clover, tri the triangle, pent the pentagon), or blob: a loose, uneven round shape (with wobble and seed) */
export type ShapeKind = M3Shape | 'cookie' | 'scallop' | 'clover' | 'tri' | 'pent' | 'blob';
const ALIAS: Record<string, M3Shape> = { cookie: 'cookie9', scallop: 'cookie12', clover: 'clover4', tri: 'triangle', pent: 'pentagon' };
const m3 = (k: ShapeKind): M3Shape => (ALIAS[k] || k) as M3Shape;

const TAU = Math.PI * 2;
const r1 = (n: number) => Math.round(n * 10) / 10;

/** a closed, smooth, slightly uneven round path around (cx, cy), like a pebble: radius r, `lobes` gentle bumps of `depth`
    turned by `turn` (radians), bent by `wobble` (0 to 1) using `seed`. `poly` makes soft corners instead of bumps. */
export function blobPath(cx: number, cy: number, r: number, lobes: number, depth: number, turn = 0, wobble = 0, seed = 1, poly = false): string {
  const n = Math.max(48, lobes * 10);
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    const w = wobble ? wobble * 0.08 * (Math.sin(a * 2 + seed * 1.7) + 0.6 * Math.sin(a * 3 + seed * 3.1)) : 0;
    const bump = !lobes ? 0 : poly ? Math.cos(lobes * (a - turn)) : 2 * Math.pow(Math.abs(Math.cos((lobes * (a - turn)) / 2)), 0.7) - 1;
    const rr = r * (1 + depth * bump + w);
    pts.push([(cx + rr * Math.cos(a) - cx) / (2 * r) + 0.5, (cy + rr * Math.sin(a) - cy) / (2 * r) + 0.5]);
  }
  return smoothPath(pts, 2 * r, cx, cy);
}

/** one shape, filled (or outlined, with `outline`), `size` wide. `turn` is in degrees. */
export function Shape({
  kind = 'cookie9',
  size,
  color,
  turn = 0,
  wobble = 0.6,
  seed = 1,
  outline,
  style,
  children,
}: {
  kind?: ShapeKind;
  size: number;
  color: string;
  turn?: number;
  /** blob only: how uneven it is */
  wobble?: number;
  seed?: number;
  /** draw only the edge, this thick */
  outline?: number;
  style?: StyleProp<ViewStyle>;
  /** what sits on the shape, centered (an icon, a number) */
  children?: React.ReactNode;
}) {
  const d = useMemo(() => {
    if (kind === 'blob') return blobPath(size / 2, size / 2, size / 2 / (1 + wobble * 0.13), 0, 0, 0, wobble, seed);
    if (!outline) return shapePath(m3(kind), size, turn);
    /* an outline sits inside the box: the shape drawn a little smaller, so the stroke is not cut off */
    return smoothPath(shapePoints(m3(kind), 120), size - outline, size / 2, size / 2, turn);
  }, [kind, size, turn, wobble, seed, outline]);
  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
      <Svg width={size} height={size} style={{ position: 'absolute' }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {outline ? <Path d={d} fill="none" stroke={color} strokeWidth={outline} strokeLinejoin="round" /> : <Path d={d} fill={color} />}
      </Svg>
      {/* in a View of its own, so on the web it paints over the shape and not under it */}
      {children != null ? <View style={{ alignItems: 'center', justifyContent: 'center' }}>{children}</View> : null}
    </View>
  );
}

/** a shape that changes into another when `kind` changes, the way Android's shapes morph: the outline flows from one
    to the next on a spring. Or, with `to` and `t` (0 to 1), it sits that far between `kind` and `to` (to follow a breath). */
export function MorphShape({
  kind,
  to,
  t,
  size,
  color,
  turn = 0,
  style,
  children,
}: {
  kind: ShapeKind;
  to?: ShapeKind;
  t?: number;
  size: number;
  color: string;
  turn?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  const [pair, setPair] = useState<[ShapeKind, ShapeKind]>([kind, kind]);
  const [k, setK] = useState(1);
  const v = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (to != null) return;
    if (pair[1] === kind) return;
    setPair([pair[1], kind]);
    if (reduce) {
      setK(1);
      return;
    }
    v.setValue(0);
    setK(0);
    const id = v.addListener(({ value }) => setK(value));
    Animated.spring(v, { toValue: 1, ...SPRING.default, useNativeDriver: false }).start(() => v.removeListener(id));
    return () => v.removeListener(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, to, reduce]);
  const [a, b, tt] = to != null ? [kind, to, t ?? 0] : [pair[0], pair[1], k];
  const pa = useMemo(() => shapePoints(m3(a), 120), [a]);
  const pb = useMemo(() => shapePoints(m3(b), 120), [b]);
  const d = smoothPath(morphPoints(pa, pb, tt), size, size / 2, size / 2, turn);
  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
      <Svg width={size} height={size} style={{ position: 'absolute' }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Path d={d} fill={color} />
      </Svg>
      {children != null ? <View style={{ alignItems: 'center', justifyContent: 'center' }}>{children}</View> : null}
    </View>
  );
}

/** seconds since this mounted, about 30 times a second while `on` (for crawling waves) */
export function useClock(on = true) {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (!on) return;
    const t0 = Date.now();
    let raf = 0;
    let last = 0;
    const tick = () => {
      const now = Date.now();
      if (now - last > 32) {
        last = now;
        setT((now - t0) / 1000);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [on]);
  return t;
}

/* Material's wave height through a run: flat at the very start and the very end, full in between, eased */
const envelope = (p: number) => {
  const up = Math.min(1, Math.max(0, (p - 0.01) / 0.07));
  const down = Math.min(1, Math.max(0, (0.97 - p) / 0.03));
  const e = Math.min(up, down);
  return e * e * (3 - 2 * e);
};

/** a squiggly arc around a circle, from the top, clockwise, for `p` (0 to 1) of the way round: radius r, `waves` wiggles
    in a full circle, `amp` deep. `phase` (radians) slides the wiggles along, to make them crawl. */
export function wavyArcPath(cx: number, cy: number, r: number, p: number, waves: number, amp: number, phase = 0): string {
  const end = Math.max(0, Math.min(1, p)) * TAU;
  if (end <= 0) return '';
  const steps = Math.max(8, Math.ceil((end / TAU) * waves * 12));
  let d = '';
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * end;
    const rr = r + amp * Math.sin(a * waves - phase);
    d += (i ? ' L' : 'M') + r1(cx + rr * Math.sin(a)) + ' ' + r1(cy - rr * Math.cos(a));
  }
  return d;
}

const arcPath = (cx: number, cy: number, r: number, a0: number, a1: number) => {
  if (a1 - a0 <= 0.001) return '';
  const x0 = cx + r * Math.sin(a0);
  const y0 = cy - r * Math.cos(a0);
  const x1 = cx + r * Math.sin(a1);
  const y1 = cy - r * Math.cos(a1);
  return `M${r1(x0)} ${r1(y0)} A${r1(r)} ${r1(r)} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${r1(x1)} ${r1(y1)}`;
};

/** a progress ring like Android's wavy progress indicator: the filled part a fine squiggle that slowly crawls, a small gap,
    and the rest a thin, quiet track. `p` is how much is filled (0 to 1). */
export function WavyRing({
  size,
  p,
  color,
  track,
  stroke = 5,
  wavelength = 20,
  amp,
  speed = 0.35,
  children,
}: {
  size: number;
  p: number;
  color: string;
  track: string;
  stroke?: number;
  /** the length of one wiggle along the ring, in points */
  wavelength?: number;
  amp?: number;
  /** how fast the wiggles crawl, in wavelengths a second (0 for still) */
  speed?: number;
  children?: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  const sec = useClock(!reduce && speed > 0);
  const a = (amp ?? stroke * 0.45) * envelope(p);
  const r = size / 2 - stroke / 2 - (amp ?? stroke * 0.45) - 1;
  const waves = Math.max(6, Math.round((TAU * r) / wavelength));
  const d = wavyArcPath(size / 2, size / 2, r, p, waves, a, sec * speed * TAU);
  /* the track starts a gap after the squiggle's end and stops a gap before its start (room for the round caps) */
  const gap = (stroke + 4) / r;
  const pe = Math.max(0, Math.min(1, p)) * TAU;
  const trackD = p >= 1 ? '' : p <= 0 ? arcPath(size / 2, size / 2, r, 0, TAU - 0.0001) : arcPath(size / 2, size / 2, r, pe + gap, TAU - gap);
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {trackD ? <Path d={trackD} stroke={track} strokeWidth={stroke} strokeLinecap="round" fill="none" /> : null}
        {d ? <Path d={d} stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" fill="none" /> : null}
      </Svg>
      {children != null ? <View style={{ alignItems: 'center', justifyContent: 'center' }}>{children}</View> : null}
    </View>
  );
}

/** a squiggly line along a width, like Android's wavy linear progress: `p` (0 to 1) of it a fine squiggle in color, a small
    gap, then a straight, quiet track */
export function WavyLine({
  width,
  p,
  color,
  track,
  stroke = 4,
  wave = 28,
  amp = 3,
  phase = 0,
}: {
  width: number;
  p: number;
  color: string;
  track: string;
  stroke?: number;
  /** the length of one wiggle */
  wave?: number;
  amp?: number;
  phase?: number;
}) {
  const h = stroke + amp * 2 + 2;
  const y = h / 2;
  const x0 = stroke / 2;
  const x1 = width - stroke / 2;
  const xe = x0 + (x1 - x0) * Math.max(0, Math.min(1, p));
  let d = '';
  const steps = Math.max(2, Math.ceil((xe - x0) / 2));
  for (let i = 0; i <= steps; i++) {
    const x = x0 + ((xe - x0) * i) / steps;
    d += (i ? ' L' : 'M') + r1(x) + ' ' + r1(y + amp * Math.sin(((x - x0) / wave) * TAU - phase));
  }
  const ts = xe > x0 ? xe + stroke + 4 : x0;
  return (
    <Svg width={width} height={h} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {ts < x1 ? <Path d={`M${r1(ts)} ${y} L${r1(x1)} ${y}`} stroke={track} strokeWidth={stroke} strokeLinecap="round" /> : null}
      {xe > x0 ? <Path d={d} stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" fill="none" /> : null}
    </Svg>
  );
}
