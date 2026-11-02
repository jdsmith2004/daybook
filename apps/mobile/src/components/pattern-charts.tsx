/* Your pattern's pictures (core: pattern.ts, pattern-cards.ts). Each card is a scene of its own at night, never one chart kit with new words, and
   each is drawn from what the app is made of (docs/plan.md has the reasons):
   - Hillside: how many recent days had no slip, as a hill you walked over, with your flame standing at today, a star over each day with no slip, and
     the period before as a dotted line. A slip is a dip that fills back in
   - DayFlow: how the days felt as bands of color across the range, each in the color of its answer on Today, widening as days like it come more often
   - FlameCounts: your flame, big, with a plain row under it of how many you rode out in each stretch of days. Slips are in the numbers under the card
   - FeelField: the whole field of feelings as soft dots, with what was named swelled up where it lives and its word inside
   - DaySky: the day from 6 AM as a sky going from dawn through dusk to midnight, with the entries standing in it
   - Mosaic: a block for each thing, sized by how often it comes up, with its words inside
   - Pairs: days with no slip beside slip days, a pair for each answer
   Nothing stands in an empty track. They come in once, and with Reduce Motion on they are simply there. */
import {
  feelMap,
  mosaic,
  patRideBars,
  type DayFeelStep,
  type PatDiff,
  type PatFeels,
  type PatHour,
  type PatRideCol,
  type PatRidge,
  type PatWhen,
} from '@daybook/core';
import { LinearGradient as Fade } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';
import Svg, { Circle, Defs, G, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { BigFlame } from '@/components/big-flame';
import { useChartColors, useGrow } from '@/components/charts';
import { SVG_HIDE, type ShapeKind } from '@/components/shapes';
import { FEEL_COLORS, feelKind } from '@/components/tools/feel';
import { shapePath, type AnyShape } from '@/lib/m3-shapes';
import { NATIVE, useReducedMotion } from '@/lib/motion';
import { font, nightInk } from '@/lib/theme';

function useWidth(): [number, (e: { nativeEvent: { layout: { width: number } } }) => void] {
  const [w, setW] = useState(0);
  return [w, (e) => setW(Math.round(e.nativeEvent.layout.width))];
}

/** the colors of the charts: the flame's warm color for what was won, and a quiet one for a slip */
function useInk() {
  const k = useChartColors();
  return {
    ...k,
    win: k.c.scheme === 'dark' ? '#FFB347' : '#E77F12',
    core: k.c.scheme === 'dark' ? '#FFE08A' : '#FFC24D',
    hush: k.c.scheme === 'dark' ? 'rgba(189,181,230,0.5)' : 'rgba(98,90,133,0.42)',
  };
}

/** the sky behind each card, top to bottom: night in every theme, like Today's */
export const CARD_SKY: Record<string, [string, string]> = {
  apart: ['#0C0A2A', '#1B1040'],
  felt: ['#0E0C24', '#0E0C24'],
  ride: ['#120A24', '#2B1022'],
  named: ['#0E0C24', '#17132F'],
  when: ['#0C0A2A', '#120E38'],
  what: ['#120E30', '#120E30'],
  days: ['#120E30', '#17123A'],
  helps: ['#0B1530', '#0E1C36'],
};

/** the room left for a chart in a card, as a size to draw at. The chart floats inside it: on a phone a card with no set height takes its size from
    what is in it, so a chart in the flow would make the room bigger, and the chart drawn for that room bigger again, without end */
export function Room({ min = 180, children }: { min?: number; children: (w: number, h: number) => ReactNode }) {
  const [z, setZ] = useState({ w: 0, h: 0 });
  return (
    <View
      style={{ flex: 1, minHeight: min }}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setZ({ w: Math.round(width), h: Math.round(height) });
      }}>
      <View style={StyleSheet.absoluteFill}>{z.w ? children(z.w, z.h) : null}</View>
    </View>
  );
}

/** a thing that pops in when its card is reached */
function Pop({ delay, style, children }: { delay: number; style?: object; children: ReactNode }) {
  const v = useGrow(delay, 420);
  return (
    <Animated.View style={[style, { opacity: v, transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }] }]}>
      {children}
    </Animated.View>
  );
}

/** a column that rises from the floor */
function Rise({ h, w, delay, children }: { h: number; w: number; delay: number; children: ReactNode }) {
  const v = useGrow(delay);
  return (
    <View style={{ width: w, height: h, overflow: 'hidden', borderTopLeftRadius: 4, borderTopRightRadius: 4 }}>
      <Animated.View style={{ flex: 1, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [h, 0] }) }] }}>{children}</Animated.View>
    </View>
  );
}

/** in and out on a slow sine, forever; still with Reduce Motion on */
function useBreath(ms: number) {
  const reduce = useReducedMotion();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduce) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: ms, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
        Animated.timing(v, { toValue: 0, duration: ms, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [reduce, v, ms]);
  return v;
}

/** a shape lit from above, the way a thing is lit by the sky, not a flat sticker */
function LitShape({ kind, size, color }: { kind: ShapeKind; size: number; color: string }) {
  const d = useMemo(() => shapePath(kind as AnyShape, size), [kind, size]);
  const pad = Math.ceil(size * 0.2);
  return (
    <View style={{ width: size, height: size }}>
      <Svg
        width={size + 2 * pad}
        height={size + 2 * pad}
        viewBox={-pad + ' ' + -pad + ' ' + (size + 2 * pad) + ' ' + (size + 2 * pad)}
        style={{ position: 'absolute', left: -pad, top: -pad }}
        {...SVG_HIDE}>
        <Defs>
          <LinearGradient id="lit" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.42} />
            <Stop offset="0.55" stopColor="#FFFFFF" stopOpacity={0} />
            <Stop offset="1" stopColor="#1A0B3A" stopOpacity={0.22} />
          </LinearGradient>
        </Defs>
        <Path d={d} fill={color} />
        <Path d={d} fill="url(#lit)" />
      </Svg>
    </View>
  );
}

/* ---------- how you are doing ---------- */
const place = (i: number) => {
  const x = Math.sin(i * 12.9898 + 4.1) * 43758.5453;
  return x - Math.floor(x);
};
/** a soft line: a few passes of a small blur, so a week that looks back reads as a hill and not as steps */
const softened = (l: number[]) => {
  let out = l;
  for (let p = 0; p < 5; p++) out = out.map((v, i) => (i && i < out.length - 1 ? (out[i - 1] + 2 * v + out[i + 1]) / 4 : v));
  return out;
};
const smooth = (pts: [number, number][]) => {
  let d = 'M' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1);
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[i];
    const c = pts[i + 1];
    const e = pts[Math.min(pts.length - 1, i + 2)];
    d +=
      'C' +
      (b[0] + (c[0] - a[0]) / 6).toFixed(1) +
      ' ' +
      (b[1] + (c[1] - a[1]) / 6).toFixed(1) +
      ' ' +
      (c[0] - (e[0] - b[0]) / 6).toFixed(1) +
      ' ' +
      (c[1] - (e[1] - b[1]) / 6).toFixed(1) +
      ' ' +
      c[0].toFixed(1) +
      ' ' +
      c[1].toFixed(1);
  }
  return d;
};
const STAR = (x: number, y: number, r: number) =>
  `M${x} ${y - r}Q${x + r * 0.18} ${y - r * 0.18} ${x + r} ${y}Q${x + r * 0.18} ${y + r * 0.18} ${x} ${y + r}Q${x - r * 0.18} ${y + r * 0.18} ${x - r} ${y}Q${x - r * 0.18} ${y - r * 0.18} ${x} ${y - r}Z`;
/** the hill of the last days, with your flame standing at today and a star over each day with no slip */
export function Hillside({
  ridge,
  than,
  first,
  level,
  sky,
  note,
  w,
  h,
  label,
}: {
  ridge: PatRidge;
  than: string;
  first: string;
  level: number;
  /** the color the hill fades into at its foot */
  sky: string;
  /** a line at the foot of the hill */
  note?: string;
  w: number;
  h: number;
  label: string;
}) {
  const k = useInk();
  const v = useGrow(80, 1100);
  const lit = useGrow(500, 900);
  const flameIn = useGrow(800, 600);
  const breath = useBreath(2600);
  const now = softened(ridge.now);
  const n = now.length;
  const FL = Math.round(Math.min(148, h * 0.5));
  /* today stands in from the edge, so the flame is whole */
  const end = w - FL * 0.5 - 4;
  const top = Math.max(h * 0.36, FL * 0.95);
  /* the ground never falls away: with no such days at all there is still a hill for the flame to stand on, clear of the words under it */
  const floor = h * 0.74;
  const X = (i: number, of = n) => (of > 1 ? (i / (of - 1)) * end : end);
  /* ground is never ruled with a straight edge: a swell of a few points under everything, far smaller than one day's dip */
  const swell = (x: number) => 3 * Math.sin((x / w) * 8.2 + 0.6) + 2 * Math.sin((x / w) * 17 + 2);
  const Y = (a: number, x = 0) => top + (1 - a) * (floor - top) + swell(x);
  const pts = now.map((a, i): [number, number] => [X(i), Y(a, X(i))]);
  if (n === 1) pts.unshift([0, Y(now[0], 0)]);
  const last = pts[pts.length - 1];
  const onward = (x: number): [number, number] => [x, Y(now[n - 1], x)];
  const line = smooth([...pts, onward((end + w) / 2), onward(w + 6)]);
  const hill = line + `L${w + 6} ${h}L0 ${h}Z`;
  const then = ridge.then ? softened(ridge.then) : null;
  const was = then ? smooth(then.map((a, i): [number, number] => [X(i, then.length), Y(a, X(i, then.length))])) : null;
  const heightAt = (u: number) => {
    const at = u * (n - 1);
    const a = Math.floor(at);
    const b = Math.min(n - 1, a + 1);
    return Y(now[a] + (now[b] - now[a]) * (at - a), u * end);
  };
  const stars = ridge.stars.map((u, i) => {
    const ground = heightAt(u);
    const up = Math.max(10, ground - 16);
    return {
      x: Math.max(4, Math.min(w - 4, u * end + (place(i) - 0.5) * (end / Math.max(ridge.stars.length, 8)))),
      y: 6 + place(i + 40) * (up - 6),
      r: 1 + place(i + 80) * 1.1,
      big: i % 6 === 2,
      /* the nearer to today, the brighter */
      o: 0.4 + 0.6 * u,
    };
  });
  return (
    <View style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={label}>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: lit }]}>
        <Svg width={w} height={h} {...SVG_HIDE}>
          {stars.map((t, i) =>
            t.big ? (
              <Path key={i} d={STAR(t.x, t.y, 4.5)} fill="#FFF3CF" opacity={t.o} />
            ) : (
              <Circle key={i} cx={t.x} cy={t.y} r={t.r} fill="#FFF3CF" opacity={t.o * 0.85} />
            ),
          )}
        </Svg>
      </Animated.View>
      {/* the warm light the flame throws on the night around it */}
      <Animated.View
        style={[StyleSheet.absoluteFill, { opacity: Animated.multiply(flameIn, breath.interpolate({ inputRange: [0, 1], outputRange: [0.78, 1] })) }]}>
        <Svg width={w} height={h} {...SVG_HIDE}>
          <Defs>
            <RadialGradient id="hearth" cx={end} cy={last[1] - FL * 0.25} r={Math.min(w * 0.62, last[1] - FL * 0.25)} gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor="#FFB347" stopOpacity={0.42} />
              <Stop offset="0.5" stopColor="#F2704F" stopOpacity={0.12} />
              <Stop offset="1" stopColor="#F2704F" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect width={w} height={h} fill="url(#hearth)" />
        </Svg>
      </Animated.View>
      <Animated.View
        style={{
          position: 'absolute',
          width: w,
          height: h,
          overflow: 'hidden',
          transform: [{ translateX: v.interpolate({ inputRange: [0, 1], outputRange: [-w, 0] }) }],
        }}>
        <Animated.View style={{ width: w, height: h, transform: [{ translateX: v.interpolate({ inputRange: [0, 1], outputRange: [w, 0] }) }] }}>
          <Svg width={w} height={h} {...SVG_HIDE}>
            <Defs>
              <RadialGradient id="ground" cx={end} cy={last[1]} r={w * 0.95} gradientUnits="userSpaceOnUse">
                <Stop offset="0" stopColor="#F59A4A" stopOpacity={0.95} />
                <Stop offset="0.28" stopColor="#B6505A" stopOpacity={0.75} />
                <Stop offset="0.62" stopColor="#5A2F86" stopOpacity={0.55} />
                <Stop offset="1" stopColor="#3A2A7E" stopOpacity={0.35} />
              </RadialGradient>
              <LinearGradient id="foot" x1="0" y1={top + (h - top) * 0.25} x2="0" y2={h} gradientUnits="userSpaceOnUse">
                <Stop offset="0" stopColor={sky} stopOpacity={0} />
                <Stop offset="1" stopColor={sky} stopOpacity={1} />
              </LinearGradient>
              <LinearGradient id="rim" x1="0" y1="0" x2={w} y2="0" gradientUnits="userSpaceOnUse">
                <Stop offset="0" stopColor="#7566DE" />
                <Stop offset="0.6" stopColor="#D58AA8" />
                <Stop offset="0.9" stopColor="#FFD27A" />
              </LinearGradient>
            </Defs>
            <Path d={hill} fill="#231A5C" />
            <Path d={hill} fill="url(#ground)" />
            <Path d={hill} fill="url(#foot)" />
            <Path d={line} stroke="url(#rim)" strokeWidth={2.5} strokeLinecap="round" fill="none" />
            {was ? <Path d={was} stroke={k.c.ink} strokeOpacity={0.7} strokeWidth={2} strokeDasharray="0.1 6" strokeLinecap="round" fill="none" /> : null}
          </Svg>
        </Animated.View>
      </Animated.View>
      {/* the flame: its feet on the hill */}
      <Animated.View
        style={{
          position: 'absolute',
          left: end - FL / 2,
          top: last[1] - FL * 0.93,
          opacity: flameIn,
          transform: [{ scale: flameIn.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }],
        }}>
        <BigFlame level={level} size={FL} />
      </Animated.View>
      {note ? (
        <Text numberOfLines={2} style={[s.abs, { left: 16, right: 16, bottom: 14, fontFamily: font.body, fontSize: 13, lineHeight: 18, color: k.c.muted }]}>
          {note}
        </Text>
      ) : null}
      <View style={[s.between, s.abs, { left: 16, right: 16, bottom: note ? 62 : 14, alignItems: 'center' }]}>
        <Text style={[s.ax, { color: k.c.muted }]}>{first}</Text>
        {was ? (
          <View style={s.keyItem}>
            <Svg width={18} height={4} {...SVG_HIDE}>
              <Path d="M2 2H16" stroke={k.c.ink} strokeOpacity={0.7} strokeWidth={2} strokeDasharray="0.1 6" strokeLinecap="round" />
            </Svg>
            <Text style={[s.ax, { color: k.c.muted }]}>{than.replace(/^in /, '').replace(/^t/, 'T')}</Text>
          </View>
        ) : null}
        <Text style={[s.ax, { color: k.c.ink }]}>Today</Text>
      </View>
    </View>
  );
}

/* ---------- how each day felt ---------- */
const STEP_WORD: Record<DayFeelStep, string> = { 5: 'Great', 4: 'Good', 3: 'Okay', 2: 'Low', 1: 'Rough' };
const FLOW_FOOT = 28;
/** a thing drawn from left to right when its card is reached */
function Sweep({ w, h, duration = 1100, children }: { w: number; h: number; duration?: number; children: ReactNode }) {
  const v = useGrow(80, duration);
  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: w,
        height: h,
        overflow: 'hidden',
        transform: [{ translateX: v.interpolate({ inputRange: [0, 1], outputRange: [-w, 0] }) }],
      }}>
      <Animated.View style={{ width: w, height: h, transform: [{ translateX: v.interpolate({ inputRange: [0, 1], outputRange: [w, 0] }) }] }}>
        {children}
      </Animated.View>
    </Animated.View>
  );
}
/** how the days felt as bands of color running across the range, the best at the top: a band widens as days like it come more often */
export function DayFlow({
  flow,
  by,
  first,
  sky,
  w,
  h,
  look,
  label,
}: {
  flow: number[][];
  by: number[];
  first: string;
  /** the color showing between the bands */
  sky: string;
  w: number;
  h: number;
  look: (n: DayFeelStep) => { kind: ShapeKind; color: string };
  label: string;
}) {
  const k = useInk();
  const H = h - FLOW_FOOT;
  const n = flow.length;
  /* a little past each edge, so a band never stops short of the card's */
  const X = (i: number) => (n > 1 ? -4 + (i / (n - 1)) * (w + 8) : w / 2);
  /* from the top: Great, then down to Rough */
  const edge: number[][] = [flow.map(() => 0)];
  for (let step = 4; step >= 0; step--) edge.push(flow.map((p, i) => edge[edge.length - 1][i] + p[step]));
  const line = (e: number[]) => e.map((v, i): [number, number] => [X(i), v * H]);
  const bands = ([5, 4, 3, 2, 1] as DayFeelStep[])
    .map((step, b) => {
      const up = line(edge[b]);
      const down = line(edge[b + 1]);
      const most = Math.max(...flow.map((p) => p[step - 1]));
      if (most * H < 1) return null;
      const rim = smooth(up);
      const d = rim + smooth(down.slice().reverse()).replace(/^M/, 'L') + 'Z';
      /* its word sits where the band is widest, if it fits there */
      const wid = flow.findIndex((p) => p[step - 1] === most);
      const at = { x: Math.max(16, Math.min(w - 92, X(wid) - 38)), y: ((edge[b][wid] + edge[b + 1][wid]) / 2) * H };
      return { step, d, rim, top: b === 0, at, fits: most * H >= 26 };
    })
    .filter((x): x is NonNullable<typeof x> => !!x);
  return (
    <View style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={label}>
      <Sweep w={w} h={H}>
        <Svg width={w} height={H} {...SVG_HIDE}>
          <Defs>
            <LinearGradient id="flowlit" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.14} />
              <Stop offset="0.45" stopColor="#FFFFFF" stopOpacity={0} />
              <Stop offset="1" stopColor="#1A0B3A" stopOpacity={0.42} />
            </LinearGradient>
            <LinearGradient id="flowair" x1="0" y1="0" x2="0" y2={H} gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor={sky} stopOpacity={1} />
              <Stop offset="0.05" stopColor={sky} stopOpacity={0.62} />
              <Stop offset="0.11" stopColor={sky} stopOpacity={0.24} />
              <Stop offset="0.18" stopColor={sky} stopOpacity={0.05} />
              <Stop offset="0.26" stopColor={sky} stopOpacity={0} />
              <Stop offset="0.58" stopColor={sky} stopOpacity={0} />
              <Stop offset="0.7" stopColor={sky} stopOpacity={0.14} />
              <Stop offset="0.85" stopColor={sky} stopOpacity={0.6} />
              <Stop offset="1" stopColor={sky} stopOpacity={1} />
            </LinearGradient>
          </Defs>
          {bands.map((x) => (
            <G key={x.step}>
              <Path d={x.d} fill={look(x.step).color} />
              <Path d={x.d} fill="url(#flowlit)" />
            </G>
          ))}
          {/* each band's upper edge catches the light, the way the hill's does */}
          {bands.map((x) => (x.top ? null : <Path key={x.step} d={x.rim} stroke="#FFF6DF" strokeOpacity={0.7} strokeWidth={1.5} fill="none" />))}
          <Rect width={w} height={H} fill="url(#flowair)" />
        </Svg>
        {/* a word low on a band sits in the fade into the night, so it turns light */}
        {bands.map((x) =>
          x.fits ? (
            <Text
              key={x.step}
              numberOfLines={1}
              style={[
                s.abs,
                { left: x.at.x, top: x.at.y - 9, fontFamily: font.bodySemi, fontSize: 13, lineHeight: 18, color: x.at.y > H * 0.62 ? nightInk.ink : '#1C2030' },
              ]}>
              {STEP_WORD[x.step]} {by[x.step - 1]}
            </Text>
          ) : null,
        )}
      </Sweep>
      <View style={[s.between, s.abs, { left: 16, right: 16, bottom: 6 }]}>
        <Text style={[s.ax, { color: k.c.muted }]}>{first}</Text>
        <Text style={[s.ax, { color: k.c.ink }]}>Today</Text>
      </View>
    </View>
  );
}

/* ---------- the moments ridden out ---------- */
const COUNT_FOOT = 30;
const COUNT_ROOM = 96;
const COUNT_LIFT = 140;
/** your flame, big, with a plain row under it of how many you rode out in each stretch of days */
export function FlameCounts({ cols, level, w, h, label }: { cols: PatRideCol[]; level: number; w: number; h: number; label: string }) {
  const k = useInk();
  const flameIn = useGrow(80, 700);
  const words = useGrow(520, 500);
  const breath = useBreath(2400);
  const n = Math.max(cols.length, 1);
  const colW = w / n;
  const mid = (i: number) => colW * (i + 0.5);
  const ground = h - COUNT_FOOT;
  const room = Math.min(COUNT_ROOM, h * 0.28);
  const bars = patRideBars(cols, room);
  const bw = Math.min(colW * 0.5, 30);
  const above = ground - room - 26;
  const FL = Math.round(Math.max(90, Math.min(210, above * 0.98, w * 0.56)));
  const cy = Math.max(FL / 2, above / 2);
  const stars = useMemo(
    () => Array.from({ length: 20 }, (_, i) => ({ x: place(i + 60) * w, y: place(i * 3 + 60) * above, r: 0.5 + place(i * 5) * 0.9 })),
    [w, above],
  );
  const showN = (i: number) => n <= 8 || (n - 1 - i) % 2 === 0;
  const every = n > 7 ? 3 : 1;
  return (
    <View style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={label}>
      {/* the glow runs up behind the words, so the sky has no edge where they end */}
      <Animated.View
        pointerEvents="none"
        style={[
          s.abs,
          {
            left: 0,
            top: -COUNT_LIFT,
            width: w,
            height: h + COUNT_LIFT,
            opacity: Animated.multiply(flameIn, breath.interpolate({ inputRange: [0, 1], outputRange: [0.74, 1] })),
          },
        ]}>
        <Svg width={w} height={h + COUNT_LIFT} {...SVG_HIDE}>
          <Defs>
            <RadialGradient id="countglow" cx={w / 2} cy={cy + COUNT_LIFT} r={Math.max(w * 0.6, FL)} gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor="#FFB347" stopOpacity={0.46} />
              <Stop offset="0.55" stopColor="#F2704F" stopOpacity={0.14} />
              <Stop offset="1" stopColor="#F2704F" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect width={w} height={h + COUNT_LIFT} fill="url(#countglow)" />
        </Svg>
      </Animated.View>
      <Svg width={w} height={h} style={s.abs} {...SVG_HIDE}>
        {stars.map((t, i) => (
          <Circle key={i} cx={t.x} cy={t.y} r={t.r} fill="#FFFFFF" fillOpacity={0.2 + place(i * 7) * 0.45} />
        ))}
        <Path d={'M0 ' + (ground + 0.5) + 'H' + w} stroke="#FFD9A8" strokeOpacity={0.35} strokeWidth={1} />
      </Svg>
      <Animated.View
        style={{
          position: 'absolute',
          left: w / 2 - FL / 2,
          top: cy - FL * 0.52,
          opacity: flameIn,
          transform: [{ scale: flameIn.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }],
        }}>
        <BigFlame level={level} size={FL} />
      </Animated.View>
      {cols.map((_, i) =>
        bars[i] ? (
          <View key={i} style={[s.abs, { left: mid(i) - bw / 2, top: ground - bars[i] }]}>
            <Rise h={bars[i]} w={bw} delay={300 + i * 45}>
              <Svg width={bw} height={bars[i]} {...SVG_HIDE}>
                <Defs>
                  <LinearGradient id={'count' + i} x1="0" y1={bars[i] - room} x2="0" y2={bars[i]} gradientUnits="userSpaceOnUse">
                    <Stop offset="0" stopColor="#FFE3A0" />
                    <Stop offset="1" stopColor="#F2704F" />
                  </LinearGradient>
                </Defs>
                <Rect width={bw} height={bars[i]} fill={'url(#count' + i + ')'} />
              </Svg>
            </Rise>
          </View>
        ) : null,
      )}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: words }]} pointerEvents="none">
        {cols.map((c, i) =>
          bars[i] && showN(i) ? (
            <Text key={i} style={[s.countN, { color: k.c.ink, left: mid(i) - 24, top: ground - bars[i] - 21, fontSize: n > 8 ? 12 : 14 }]}>
              {c.rode}
            </Text>
          ) : null,
        )}
      </Animated.View>
      {cols.map((c, i) =>
        (n - 1 - i) % every === 0 ? (
          <Text
            key={i}
            numberOfLines={1}
            style={[s.ax, s.countDate, { color: i === n - 1 ? k.c.ink : k.c.muted, left: Math.max(2, Math.min(w - 62, mid(i) - 30)), top: ground + 8 }]}>
            {c.label}
          </Text>
        ) : null,
      )}
    </View>
  );
}

/* ---------- what was named ---------- */
/** the most words the field shows; the rest are in the numbers under the card */
const FIELD_MAX = 14;
const FIELD_N = 12;
const INK = '#1C2030';
function Floating({ i, x, y, size, children }: { i: number; x: number; y: number; size: number; children: ReactNode }) {
  const breath = useBreath(2600 + (i % 5) * 420);
  return (
    <Pop delay={140 + i * 70} style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size }}>
      <Animated.View style={{ transform: [{ translateY: breath.interpolate({ inputRange: [0, 1], outputRange: [-2, 2] }) }] }}>{children}</Animated.View>
    </Pop>
  );
}
/** the whole field of feelings as soft dots, the one a person picks from, with what they named swelled up where it lives, its word inside */
export function FeelField({ words, w, h, label }: { words: PatFeels['words']; w: number; h: number; label: string }) {
  const shown = words.slice(0, FIELD_MAX);
  const side = 10;
  const W = w - side * 2;
  const H = h - side * 2;
  const at = useMemo(
    () =>
      feelMap(
        shown.map((x) => ({ r: x.r, c: x.c, n: x.n, min: x.w.length * 7 + 16 })),
        FIELD_N,
        W,
        H,
      ),
    [shown, W, H],
  );
  return (
    <View style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={label}>
      <Svg width={w} height={h} style={s.abs} {...SVG_HIDE}>
        {at.dots.map((p) => (
          <Circle key={p.row + '-' + p.col} cx={side + p.x} cy={side + p.y} r={p.r} fill={FEEL_COLORS[p.row][p.col]} opacity={0.42} />
        ))}
        {shown.map((x, i) => (
          <Circle key={x.w} cx={side + at.named[i].x} cy={side + at.named[i].y} r={at.named[i].r + 5} fill={FEEL_COLORS[x.r][x.c]} opacity={0.2} />
        ))}
      </Svg>
      {shown.map((x, i) => {
        const d = at.named[i].r * 2;
        const big = d >= 96 && x.w.length * 8.6 <= d - 12;
        const fs = big ? 17 : x.w.length * 7 <= d - 8 ? 13 : 12;
        return (
          <Floating key={x.w} i={i} x={side + at.named[i].x} y={side + at.named[i].y} size={d}>
            <LitShape kind="circle" size={d} color={FEEL_COLORS[x.r][x.c]} />
            <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
              {x.w.length * (fs === 12 ? 6.2 : 7) <= d - 4 ? (
                <Text numberOfLines={1} style={{ fontFamily: font.bodySemi, fontSize: fs, color: INK }}>
                  {x.w}
                </Text>
              ) : null}
            </View>
          </Floating>
        );
      })}
    </View>
  );
}

/* ---------- the day as a sky ---------- */
const DAY_START = 6;
const SKY_COLS = 12;
const SKY_WORDS = 30;
const ampmOf = (h: number) => (h % 12 || 12) + (h < 12 ? ' AM' : ' PM');
/* the sky through a day from 6 AM: dawn, the bright middle of the day, dusk, the deep of the night and the first light again */
const SKY_STOPS: [number, string][] = [
  [0, '#8A5C9E'],
  [0.12, '#5E7BC8'],
  [0.3, '#5B93D8'],
  [0.46, '#C26A7E'],
  [0.56, '#5A3580'],
  [0.72, '#1A1450'],
  [0.9, '#241B62'],
  [1, '#6A4A92'],
];
/** the entries of the day standing in its sky: the sky says what time it is at a glance, so the words under it can stay few */
export function DaySky({ hours, hard, w, h, sky }: { hours: PatHour[]; hard: PatWhen['hard']; w: number; h: number; sky: string }) {
  const k = useInk();
  const H = h - SKY_WORDS;
  const slot = w / SKY_COLS;
  const bw = Math.round(slot * 0.68);
  const cols = Array.from({ length: SKY_COLS }, (_, i) => {
    const a = hours[(DAY_START + i * 2) % 24];
    const b = hours[(DAY_START + i * 2 + 1) % 24];
    return { h: a.h, rode: a.rode + b.rode, slipped: a.slipped + b.slipped };
  });
  const top = Math.max(4, ...cols.map((x) => x.rode + x.slipped));
  const room = H - 40;
  const busiest = cols.slice().sort((a, b) => b.rode + b.slipped - (a.rode + a.slipped))[0];
  const hardAt = hard.weekdays || hard.weekends;
  const hardX = hardAt ? (((hardAt.start - DAY_START + 24) % 24) / 24) * w : 0;
  return (
    <View
      style={{ width: w, height: h }}
      accessible
      accessibilityRole="image"
      accessibilityLabel={busiest.rode + busiest.slipped ? 'Entries through the day, most around ' + ampmOf(busiest.h) : 'Entries through the day'}>
      <Svg width={w} height={H + 1} style={s.abs} {...SVG_HIDE}>
        <Defs>
          <LinearGradient id="dayline" x1="0" y1="0" x2={w} y2="0" gradientUnits="userSpaceOnUse">
            {SKY_STOPS.map(([o, c]) => (
              <Stop key={o} offset={String(o)} stopColor={c} />
            ))}
          </LinearGradient>
          <LinearGradient id="dayfade" x1="0" y1="0" x2="0" y2={H} gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor={sky} stopOpacity={1} />
            <Stop offset="0.7" stopColor={sky} stopOpacity={0.38} />
            <Stop offset="1" stopColor={sky} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Rect width={w} height={H} fill="url(#dayline)" />
        <Rect width={w} height={H} fill="url(#dayfade)" />
      </Svg>
      {hardAt ? (
        <View style={[s.abs, { left: Math.max(8, Math.min(w - 8 - (slot + 68), hardX - 34)), width: slot + 68, top: 0, alignItems: 'center' }]}>
          <Text style={[s.ax, { color: k.c.ink }]}>Hard hours</Text>
          <View style={{ width: slot, height: 3, borderRadius: 2, marginTop: 4, backgroundColor: k.core }} />
        </View>
      ) : null}
      {cols.map((x, i) => {
        const t = x.rode + x.slipped;
        if (!t) return null;
        const bar = Math.max(bw, (t / top) * room);
        const quiet = Math.round((x.slipped / t) * bar);
        return (
          <View key={i} style={[s.abs, { left: i * slot + (slot - bw) / 2, top: H - bar }]}>
            <Rise h={bar} w={bw} delay={60 + i * 45}>
              <Svg width={bw} height={bar} {...SVG_HIDE}>
                <Defs>
                  <LinearGradient id={'bar' + i} x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor="#FFF0C4" />
                    <Stop offset="0.45" stopColor="#FFB347" />
                    <Stop offset="1" stopColor="#F26A2E" />
                  </LinearGradient>
                </Defs>
                {quiet ? <Rect width={bw} height={quiet + bw} rx={bw / 2} fill="rgba(219,213,245,0.55)" /> : null}
                {bar - quiet > 0 ? (
                  <Rect y={quiet ? quiet + 2 : 0} width={bw} height={bar - quiet + bw} rx={quiet ? 2 : bw / 2} fill={`url(#bar${i})`} />
                ) : null}
              </Svg>
            </Rise>
          </View>
        );
      })}
      <View style={[s.abs, { left: 0, right: 0, top: H, height: 1, backgroundColor: 'rgba(255,255,255,0.22)' }]} />
      {(
        [
          [0, '6 AM'],
          [0.25, 'Noon'],
          [0.5, '6 PM'],
          [0.75, 'Midnight'],
        ] as [number, string][]
      ).map(([u, l]) => (
        <View
          key={l}
          style={[s.keyItem, s.abs, { left: u ? u * w - 32 : 12, width: u ? 64 : undefined, justifyContent: u ? 'center' : 'flex-start', top: H + 8 }]}>
          {l === 'Noon' ? (
            <Svg width={12} height={12} {...SVG_HIDE}>
              <Circle cx={6} cy={6} r={4} fill={k.core} />
            </Svg>
          ) : l === 'Midnight' ? (
            <Svg width={12} height={12} viewBox="0 0 24 24" {...SVG_HIDE}>
              <Path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" fill={k.c.muted} />
            </Svg>
          ) : null}
          <Text style={[s.ax, { color: k.c.muted }]}>{l}</Text>
        </View>
      ))}
    </View>
  );
}

/* ---------- the hours of the day, in the week's review ---------- */
/** the row starts here, so a night stays in one piece: most hard hours are at night */
const DAY_FROM = 6;
/** two hours to a column, the size of the hard hours: a single hour says more than a few entries know */
const HOUR_COLS = 12;
/** how tall the words under Hours stand, to take from the room for the columns */
export const HOUR_WORDS = 26;
const ampm = (h: number) => (h % 12 || 12) + (h < 12 ? ' AM' : ' PM');
/** entries through the day, with the hard hours marked behind them */
export function Hours({ hours, hard, H }: { hours: PatHour[]; hard: PatWhen['hard']; H: number }) {
  const k = useInk();
  const [w, onLayout] = useWidth();
  const slotW = w / HOUR_COLS;
  const bw = Math.round(slotW * 0.56);
  const cols = Array.from({ length: HOUR_COLS }, (_, i) => {
    const a = hours[(DAY_FROM + i * 2) % 24];
    const b = hours[(DAY_FROM + i * 2 + 1) % 24];
    return { h: a.h, rode: a.rode + b.rode, slipped: a.slipped + b.slipped };
  });
  /* one entry is not a full column */
  const top = Math.max(4, ...cols.map((x) => x.rode + x.slipped));
  const busiest = cols.slice().sort((a, b) => b.rode + b.slipped - (a.rode + a.slipped))[0];
  const band = (start: number, color: string) => {
    const left = (((start - DAY_FROM + 24) % 24) / 24) * w;
    return (
      <View
        key={color}
        style={[
          s.abs,
          {
            left,
            top: 0,
            width: Math.min(w / 12, w - left),
            height: H,
            backgroundColor: color,
            opacity: 0.18,
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8,
          },
        ]}
      />
    );
  };
  return (
    <View
      onLayout={onLayout}
      style={{ height: H + HOUR_WORDS }}
      accessible
      accessibilityRole="image"
      accessibilityLabel={busiest.rode + busiest.slipped ? 'Entries through the day, most around ' + ampm(busiest.h) : 'Entries through the day'}>
      {w ? (
        <>
          {hard.weekdays ? band(hard.weekdays.start, k.acc) : null}
          {hard.weekends ? band(hard.weekends.start, k.c.violet) : null}
          <View style={[s.abs, { left: 0, right: 0, top: H, height: 1, backgroundColor: k.grid }]} />
          {hard.weekdays || hard.weekends ? (
            <Text style={[s.ax, s.abs, { top: 0, right: w - ((((hard.weekdays || hard.weekends)!.start - DAY_FROM + 24) % 24) / 24) * w + 6, color: k.ax }]}>
              Hard hours
            </Text>
          ) : null}
          {cols.map((x, i) => {
            const t = x.rode + x.slipped;
            if (!t) return null;
            const h = Math.max(6, (t / top) * H);
            return (
              <View key={i} style={[s.abs, { left: i * slotW + (slotW - bw) / 2, top: H - h }]}>
                <Rise h={h} w={bw} delay={60 + i * 45}>
                  <View style={{ flex: 1, gap: 2 }}>
                    {x.slipped ? <View style={{ flex: x.slipped, backgroundColor: k.hush }} /> : null}
                    {x.rode ? <View style={{ flex: x.rode, backgroundColor: k.win }} /> : null}
                  </View>
                </Rise>
              </View>
            );
          })}
          {(
            [
              [6, '6 AM'],
              [12, 'Noon'],
              [18, '6 PM'],
              [0, 'Midnight'],
            ] as [number, string][]
          ).map(([h, l], i) => (
            <Text key={h} style={[s.ax, s.abs, { left: (i * w) / 4, top: H + 8, color: k.ax }]}>
              {l}
            </Text>
          ))}
        </>
      ) : null}
    </View>
  );
}
/** what the two colors of a column are */
export function HoursKey() {
  const k = useInk();
  return (
    <View style={s.key}>
      <View style={s.keyItem}>
        <View style={[s.keyDot, { backgroundColor: k.win }]} />
        <Text style={[s.ax, { color: k.ax }]}>Ridden out</Text>
      </View>
      <View style={s.keyItem}>
        <View style={[s.keyDot, { backgroundColor: k.hush }]} />
        <Text style={[s.ax, { color: k.ax }]}>Slipped</Text>
      </View>
    </View>
  );
}
/** the days of the week, only when one stands out: a short row under the hours */
export function WeekRow({ week, on, H }: { week: { d: number; name: string; rode: number; slipped: number }[]; on?: number; H: number }) {
  const k = useInk();
  const top = Math.max(1, ...week.map((x) => x.rode + x.slipped));
  return (
    <View
      style={{ flexDirection: 'row' }}
      accessible
      accessibilityRole="image"
      accessibilityLabel={'Entries by day of the week. ' + week.map((x) => x.name + ' ' + (x.rode + x.slipped)).join(', ')}>
      {week.map((x, i) => {
        const t = x.rode + x.slipped;
        const h = t ? Math.max(4, (t / top) * H) : 0;
        return (
          <View key={x.d} style={{ flex: 1, alignItems: 'center' }}>
            <View style={{ height: H, justifyContent: 'flex-end' }}>
              {h ? (
                <Rise h={h} w={16} delay={200 + i * 45}>
                  <View style={{ flex: 1, backgroundColor: x.d === on ? k.win : k.hush }} />
                </Rise>
              ) : null}
            </View>
            <Text style={[s.ax, { marginTop: 4, color: x.d === on ? k.c.ink : k.ax }]}>{x.name.slice(0, 1)}</Text>
          </View>
        );
      })}
    </View>
  );
}

/* ---------- things in a mosaic ---------- */
export interface Rank {
  label: string;
  /** the words under its name */
  note: string;
  /** the same in a narrow block */
  short: string;
  /** how often */
  n: number;
}
type Tile = [string, string];
/** a sunset for what sets it off, biggest first, and the cool of a clear morning for what helps */
export const TILES: Record<'warm' | 'cool', Tile[]> = {
  warm: [
    ['#FFC94D', '#2B1A00'],
    ['#FF9F45', '#2B1400'],
    ['#F4744E', '#2B0B00'],
    ['#D2557A', '#FFF4F7'],
    ['#9550B4', '#FBF3FF'],
    ['#5F48AE', '#F4F0FF'],
  ],
  cool: [
    ['#5EE0B5', '#06352A'],
    ['#45C7C9', '#04302F'],
    ['#4CA6E0', '#04233A'],
    ['#5C86E6', '#F2F5FF'],
    ['#6E6BDD', '#F4F3FF'],
    ['#7B57C8', '#F7F2FF'],
  ],
};
const MOSAIC_SIDE = 12;
const MOSAIC_GAP = 4;
/** a block for each thing, the biggest first. What takes up the most room in the picture is what comes up the most */
export function Mosaic({ items, tone, w, h }: { items: Rank[]; tone: 'warm' | 'cool'; w: number; h: number }) {
  const W = w - MOSAIC_SIDE * 2;
  const H = h - MOSAIC_SIDE;
  const blocks = useMemo(
    () =>
      mosaic(
        items.map((r) => r.n),
        W,
        H,
      ),
    [items, W, H],
  );
  return (
    <View style={{ width: w, height: h }}>
      {blocks.map((b, rank) => {
        const r = items[b.i];
        const [fill, ink] = TILES[tone][Math.min(rank, 5)];
        const bw = b.w - MOSAIC_GAP;
        const bh = b.h - MOSAIC_GAP;
        const big = bw >= 150 && bh >= 96;
        return (
          <Pop
            key={r.label}
            delay={80 + rank * 70}
            style={{ position: 'absolute', left: MOSAIC_SIDE + b.x + MOSAIC_GAP / 2, top: b.y + MOSAIC_GAP / 2, width: bw, height: bh }}>
            <View
              accessible
              accessibilityLabel={r.label + ': ' + r.note}
              style={{ flex: 1, borderRadius: 12, overflow: 'hidden', backgroundColor: fill, padding: bw < 84 ? 8 : 12, justifyContent: 'space-between' }}>
              <Fade colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0)', 'rgba(26,11,58,0.12)']} style={StyleSheet.absoluteFill} />
              <Text
                numberOfLines={bw < 100 ? 4 : 3}
                style={{
                  fontFamily: big ? font.display : font.bodySemi,
                  fontSize: big ? 22 : bw < 84 ? 13 : 15,
                  lineHeight: big ? 26 : bw < 84 ? 16 : 19,
                  color: ink,
                }}>
                {r.label}
              </Text>
              {bh >= 72 ? (
                <Text numberOfLines={1} style={{ fontFamily: font.bodyMedium, fontSize: 12, lineHeight: 15, color: ink, opacity: 0.82 }}>
                  {bw < 120 ? r.short : r.note}
                </Text>
              ) : null}
            </View>
          </Pop>
        );
      })}
    </View>
  );
}

/* ---------- slip days against days with no slip ---------- */
const fmtDiff = (d: PatDiff, v: number) => (d.unit === 'pct' ? Math.round(v * 100) + '%' : String(Math.round(v * 10) / 10) + (d.unit === 'h' ? ' h' : ''));
function PairBar({ d, which, delay, H, w }: { d: PatDiff; which: 'clean' | 'slip'; delay: number; H: number; w: number }) {
  const k = useInk();
  const top = Math.max(d.clean, d.slip) || 1;
  const v = which === 'clean' ? d.clean : d.slip;
  const bar = Math.max(w, (v / top) * (H - 40));
  return (
    <View style={{ width: w, height: H, justifyContent: 'flex-end', alignItems: 'center' }}>
      <Text numberOfLines={1} style={{ fontFamily: font.display, fontSize: w < 56 ? 17 : 22, lineHeight: 30, color: k.c.ink }}>
        {fmtDiff(d, v)}
      </Text>
      <Rise h={bar} w={w} delay={delay}>
        <Svg width={w} height={bar} {...SVG_HIDE}>
          <Defs>
            <LinearGradient id="clean" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#FFF0C4" />
              <Stop offset="0.45" stopColor="#FFB347" />
              <Stop offset="1" stopColor="#F26A2E" />
            </LinearGradient>
            <LinearGradient id="slip" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#CFC8F2" />
              <Stop offset="1" stopColor="#6E62B8" />
            </LinearGradient>
          </Defs>
          <Rect width={w} height={bar + w} rx={w / 2} fill={`url(#${which})`} />
        </Svg>
      </Rise>
    </View>
  );
}
/** each answer as a pair standing side by side, days with no slip beside slip days, each pair to its own scale: it is the difference inside a pair that counts */
export function Pairs({ list, w, h }: { list: PatDiff[]; w: number; h: number }) {
  const k = useInk();
  const KEY = 30;
  const NAME = 44;
  const H = h - KEY - NAME;
  const slot = (w - 32) / Math.max(list.length, 1);
  const bw = Math.floor(Math.min((slot - 20) / 2, 72));
  return (
    <View style={{ width: w, height: h, paddingHorizontal: 16 }}>
      <View style={{ flexDirection: 'row' }}>
        {list.map((d, i) => (
          <View key={d.k} style={{ width: slot, alignItems: 'center' }} accessible accessibilityLabel={d.line}>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <PairBar d={d} which="clean" delay={80 + i * 120} H={H} w={bw} />
              <PairBar d={d} which="slip" delay={150 + i * 120} H={H} w={bw} />
            </View>
            <Text numberOfLines={2} style={[s.ax, { height: NAME, paddingTop: 8, paddingHorizontal: 4, textAlign: 'center', color: k.c.ink }]}>
              {d.label}
            </Text>
          </View>
        ))}
      </View>
      <View style={[s.key, { justifyContent: 'center', columnGap: 16 }]}>
        <View style={s.keyItem}>
          <View style={[s.keyDot, { backgroundColor: k.win }]} />
          <Text style={[s.ax, { color: k.c.muted }]}>Days with no slip</Text>
        </View>
        <View style={s.keyItem}>
          <View style={[s.keyDot, { backgroundColor: '#A99FE0' }]} />
          <Text style={[s.ax, { color: k.c.muted }]}>Slip days</Text>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  abs: { position: 'absolute' },
  between: { flexDirection: 'row', justifyContent: 'space-between' },
  key: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 10, rowGap: 4 },
  keyItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  keyDot: { width: 8, height: 8, borderRadius: 4 },
  ax: { fontFamily: font.body, fontSize: 12 },
  countN: { position: 'absolute', width: 48, textAlign: 'center', fontFamily: font.bodySemi },
  countDate: { position: 'absolute', width: 60, textAlign: 'center' },
  date: { fontSize: 11, lineHeight: 14, marginTop: 2 },
});
