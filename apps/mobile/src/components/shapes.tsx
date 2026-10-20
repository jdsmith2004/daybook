/* The playful shapes the tools are drawn with: soft cookies, clovers, flowers and blobs instead of plain circles, and
   squiggly lines where a plain bar or ring would go (a timer that wiggles as it fills). Pure SVG, so they look the same on
   iOS, Android and the web. Each one is still: whatever moves them (a breath, a timer) passes new numbers in. */
import { useMemo } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

/** the named shapes: how many soft bumps go around the edge, and how deep they are */
export const SHAPES = {
  /** nine gentle bumps, like a cookie */
  cookie: { lobes: 9, depth: 0.06, poly: false },
  /** twelve small waves, like a scalloped edge */
  scallop: { lobes: 12, depth: 0.04, poly: false },
  /** four round leaves */
  clover: { lobes: 4, depth: 0.16, poly: false },
  /** eight petals */
  flower: { lobes: 8, depth: 0.1, poly: false },
  /** three soft corners, a rounded triangle */
  tri: { lobes: 3, depth: 0.12, poly: true },
  /** five soft corners */
  pent: { lobes: 5, depth: 0.08, poly: true },
  /** a plain circle */
  circle: { lobes: 0, depth: 0, poly: false },
} as const;
export type ShapeKind = keyof typeof SHAPES;

const TAU = Math.PI * 2;
const r1 = (n: number) => Math.round(n * 10) / 10;

/** a closed, smooth path around (cx, cy): radius r, with `lobes` bumps of `depth` (0 to about 0.25) turned by `turn`
    (radians). `poly` makes soft corners (a rounded triangle) instead of round bumps. `wobble` (0 to 1) bends it toward a
    loose, uneven blob, using `seed` so the same seed gives the same blob. */
export function blobPath(cx: number, cy: number, r: number, lobes: number, depth: number, turn = 0, wobble = 0, seed = 1, poly = false): string {
  const n = Math.max(24, lobes * 8);
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    const w = wobble ? wobble * 0.08 * (Math.sin(a * 2 + seed * 1.7) + 0.6 * Math.sin(a * 3 + seed * 3.1)) : 0;
    /* round tops and tucked-in dips, like a cookie or a clover leaf, not a star */
    const bump = !lobes ? 0 : poly ? Math.cos(lobes * (a - turn)) : 2 * Math.pow(Math.abs(Math.cos((lobes * (a - turn)) / 2)), 0.7) - 1;
    const rr = r * (1 + depth * bump + w);
    pts.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)]);
  }
  return smoothClosed(pts);
}

/* Catmull-Rom through the points, as cubic curves: a smooth closed outline with no corners */
function smoothClosed(p: [number, number][]): string {
  const n = p.length;
  let d = 'M' + r1(p[0][0]) + ' ' + r1(p[0][1]);
  for (let i = 0; i < n; i++) {
    const p0 = p[(i - 1 + n) % n];
    const p1 = p[i];
    const p2 = p[(i + 1) % n];
    const p3 = p[(i + 2) % n];
    d +=
      ' C' +
      [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]].map(r1).join(' ');
  }
  return d + 'Z';
}

/** one shape, filled, `size` wide. `turn` is in degrees. */
export function Shape({
  kind = 'cookie',
  size,
  color,
  turn = 0,
  wobble = 0,
  seed = 1,
  style,
  children,
}: {
  kind?: ShapeKind;
  size: number;
  color: string;
  turn?: number;
  wobble?: number;
  seed?: number;
  style?: StyleProp<ViewStyle>;
  /** what sits on the shape, centered (an icon, a number) */
  children?: React.ReactNode;
}) {
  const k = SHAPES[kind];
  const d = useMemo(
    () => blobPath(size / 2, size / 2, (size / 2) * (1 / (1 + k.depth + wobble * 0.13)), k.lobes, k.depth, (turn * Math.PI) / 180, wobble, seed, k.poly),
    [size, k.lobes, k.depth, k.poly, turn, wobble, seed],
  );
  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
      <Svg width={size} height={size} style={{ position: 'absolute' }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Path d={d} fill={color} />
      </Svg>
      {/* in a View of its own, so on the web it paints over the shape and not under it */}
      {children != null ? <View style={{ alignItems: 'center', justifyContent: 'center' }}>{children}</View> : null}
    </View>
  );
}

/** a squiggly arc around a circle, from the top, clockwise, for `p` (0 to 1) of the way round: radius r, `waves` wiggles
    in a full circle, `amp` deep. `phase` (radians) slides the wiggles along, to make them crawl. */
export function wavyArcPath(cx: number, cy: number, r: number, p: number, waves: number, amp: number, phase = 0): string {
  const end = Math.max(0, Math.min(1, p)) * TAU;
  if (end <= 0) return '';
  const steps = Math.max(8, Math.ceil((end / TAU) * waves * 10));
  let d = '';
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * end;
    const rr = r + amp * Math.sin(a * waves + phase);
    const x = cx + rr * Math.sin(a);
    const y = cy - rr * Math.cos(a);
    d += (i ? ' L' : 'M') + r1(x) + ' ' + r1(y);
  }
  return d;
}

/** a progress ring whose filled part is a squiggle and whose rest is a thin, quiet circle, like Android's wavy progress.
    `p` is how much is filled (0 to 1). */
export function WavyRing({
  size,
  p,
  color,
  track,
  stroke = 8,
  waves = 14,
  amp,
  phase = 0,
  children,
}: {
  size: number;
  p: number;
  color: string;
  track: string;
  stroke?: number;
  waves?: number;
  amp?: number;
  phase?: number;
  /** what sits in the middle (the time left) */
  children?: React.ReactNode;
}) {
  const a = amp ?? stroke * 0.55;
  const r = size / 2 - stroke / 2 - a;
  const d = wavyArcPath(size / 2, size / 2, r, p, waves, a, phase);
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke * 0.45} fill="none" />
        {d ? <Path d={d} stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" fill="none" /> : null}
      </Svg>
      {/* in a View of its own, so on the web it paints over the shape and not under it */}
      {children != null ? <View style={{ alignItems: 'center', justifyContent: 'center' }}>{children}</View> : null}
    </View>
  );
}

/** a squiggly line along a width, `p` (0 to 1) of it drawn in color and the rest a straight, quiet track */
export function WavyLine({
  width,
  p,
  color,
  track,
  stroke = 6,
  wave = 22,
  amp = 4,
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
    d += (i ? ' L' : 'M') + r1(x) + ' ' + r1(y + amp * Math.sin(((x - x0) / wave) * TAU + phase));
  }
  return (
    <Svg width={width} height={h} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {xe < x1 ? <Path d={`M${r1(xe + stroke)} ${y} L${r1(x1)} ${y}`} stroke={track} strokeWidth={stroke * 0.6} strokeLinecap="round" /> : null}
      {xe > x0 ? <Path d={d} stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" fill="none" /> : null}
    </Svg>
  );
}
