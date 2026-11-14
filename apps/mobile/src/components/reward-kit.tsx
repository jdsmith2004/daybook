/* The pieces every earned moment is built from (the owner, November 13, 2026: "the level ups and stuff should be inspired by
   duolingos celebrations"). Duolingo's beats, in Daybook's own look: lines that fill as gold stars fly into them (the owner,
   November 13, 2026, after seeing tiles: "i liked the previous celebration lines ... you see points go to it"); a short shout that pops in sun yellow; gold stars that twinkle around the flame; and a burst of confetti
   from one point. Each piece waits for its own moment (`at`, in ms) and does nothing loud when `quiet` (the hours after a slip:
   no knocks, no confetti). Under Reduce Motion (`still`) everything is simply there. Used by components/earned.tsx, the lesson
   finish and the end of an urge ridden out. */
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Reanimated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { Text } from '@/components/text';
import { buzz, knock } from '@/lib/feel';
import { SETTLE } from '@/lib/motion';
import { font, nightInk } from '@/lib/theme';

export const GOLD = '#FFD25A';
export const NIGHT = '#16113A';
export const LIP = '#D99A12';
/** a four-point star, in a 24 box */
export const STAR = 'M12 0C13 8 16 11 24 12C16 13 13 16 12 24C11 16 8 13 0 12C8 11 11 8 12 0Z';
const CONFETTI = [GOLD, '#FF8A5B', '#FFFFFF', '#A898FF', '#7FE0B5', GOLD];

export interface MeterSpec {
  /** the word on the left of the line ("Level 7", "Lessons") */
  label: string;
  /** the quiet words on the right ("35 to the next", "12 of 60") */
  right?: string;
  /** where the line starts and where it fills to, 0 to 1 */
  from: number;
  to: number;
  /** the line fills up, turns over and starts again: a new level */
  next?: { label: string; right?: string; to: number };
  /** how many gold stars fly into it */
  stars?: number;
  /** what a screen reader says for it */
  a11y?: string;
}

/** how long a line takes from `at` until it has settled, so the next beat can wait for it */
export const meterTime = (m: MeterSpec) => 380 + Math.max(1, m.stars ?? 4) * STAR_GAP + 420 + (m.next ? 700 : 0);
const STAR_GAP = 80;
const STAR_FLY = 520;

/** the points line, the one the owner liked on the lesson finish (November 13, 2026: "the expeirence is a horizontal line and you
    see points go to it"): a label and a quiet count over a fat gold line. At `at` it shows; gold stars fly up from below and
    land in the end of the fill one after another, a faint tick as each lands, and the line fills with them. With `next`, it
    fills to the end, the label turns over with a buzz, and it fills again from nothing. */
export function Meter({
  m,
  at,
  still,
  quiet,
  ink = nightInk.ink,
  muted = nightInk.muted,
  track = 'rgba(255,255,255,0.14)',
}: {
  m: MeterSpec;
  at: number;
  still: boolean;
  quiet?: boolean;
  ink?: string;
  muted?: string;
  track?: string;
}) {
  const end = m.next ? m.next.to : m.to;
  const show = useSharedValue(still ? 1 : 0);
  const fill = useSharedValue(still ? end : m.from);
  const gulp = useSharedValue(1);
  const pop = useSharedValue(1);
  const fly = useSharedValue(0);
  const [turned, setTurned] = useState(still);
  const [w, setW] = useState(0);
  const n = Math.max(1, m.stars ?? 4);
  useEffect(() => {
    if (still) return;
    const tm: ReturnType<typeof setTimeout>[] = [];
    show.value = withDelay(at, withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) }));
    const go = at + 380;
    tm.push(setTimeout(() => (fly.value = withTiming(1, { duration: STAR_FLY + n * STAR_GAP, easing: Easing.linear })), go));
    const land = go + STAR_FLY * 0.8;
    for (let i = 0; i < n; i++) tm.push(setTimeout(() => !quiet && buzz('tick'), land + i * STAR_GAP));
    const top = m.next ? 1 : m.to;
    fill.value = withDelay(land, withTiming(top, { duration: n * STAR_GAP + 160, easing: Easing.out(Easing.cubic) }));
    tm.push(setTimeout(() => (gulp.value = withSequence(withTiming(1.18, { duration: 110 }), withTiming(1, { duration: 220 }))), land));
    if (m.next) {
      const at2 = land + n * STAR_GAP + 260;
      tm.push(
        setTimeout(() => {
          setTurned(true);
          if (!quiet) buzz('lit');
          pop.value = withSequence(withTiming(1.3, { duration: 120 }), withTiming(1, { duration: 260, easing: Easing.out(Easing.cubic) }));
          fill.value = 0;
          fill.value = withTiming(m.next!.to, { duration: 420, easing: Easing.out(Easing.cubic) });
        }, at2),
      );
    }
    return () => tm.forEach(clearTimeout);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const boxIn = useAnimatedStyle(() => ({ opacity: show.value, transform: [{ translateY: 8 * (1 - show.value) }] }));
  const fillIn = useAnimatedStyle(() => ({ width: `${Math.max(0.04, Math.min(1, fill.value)) * 100}%` }));
  const trackIn = useAnimatedStyle(() => ({ transform: [{ scaleY: gulp.value }] }));
  const popIn = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));
  const label = turned && m.next ? m.next.label : m.label;
  const right = turned && m.next ? m.next.right : m.right;
  return (
    <Reanimated.View
      style={[s.meter, boxIn]}
      accessible
      accessibilityLabel={m.a11y || (m.next ? m.next.label + (m.next.right ? ', ' + m.next.right : '') : m.label + (m.right ? ', ' + m.right : ''))}
      onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      <View style={s.meterHead}>
        <Reanimated.Text style={[s.meterLabel, { color: ink }, popIn]}>{label}</Reanimated.Text>
        {right ? <Text style={[s.meterRight, { color: muted }]}>{right}</Text> : null}
      </View>
      <Reanimated.View style={[s.track, { backgroundColor: track }, trackIn]}>
        <Reanimated.View style={[s.fill, fillIn]}>
          <View style={s.shine} />
        </Reanimated.View>
      </Reanimated.View>
      {!still && w > 0
        ? Array.from({ length: n }, (_, i) => <Star key={i} v={fly} i={i} n={n} x1={w * Math.max(0.04, Math.min(1, m.next ? 1 : m.to))} w={w} />)
        : null}
    </Reanimated.View>
  );
}

/** one star on its way into the line: up from below the middle, a curve to one side, into the end of the fill */
function Star({ v, i, n, x1, w }: { v: SharedValue<number>; i: number; n: number; x1: number; w: number }) {
  const st = useAnimatedStyle(() => {
    const total = STAR_FLY + n * STAR_GAP;
    const start = (i * STAR_GAP) / total;
    const span = STAR_FLY / total;
    const t = Math.max(0, Math.min(1, (v.value - start) / span));
    const e = t * t;
    const x0 = w / 2 + (i % 2 ? 40 : -40);
    const y0 = 90;
    const y1 = 38;
    const cx = (x0 + x1) / 2 + (i % 2 ? 70 : -70);
    const cy = -10;
    const x = (1 - e) * (1 - e) * x0 + 2 * (1 - e) * e * cx + e * e * x1;
    const y = (1 - e) * (1 - e) * y0 + 2 * (1 - e) * e * cy + e * e * y1;
    return {
      opacity: t <= 0 || t >= 1 ? 0 : 1,
      transform: [{ translateX: x - 9 }, { translateY: y - 9 }, { scale: 1 - 0.35 * e }, { rotate: `${e * 180}deg` }],
    };
  });
  return (
    <Reanimated.View pointerEvents="none" style={[s.star, st]}>
      <Svg width={18} height={18} viewBox="0 0 24 24">
        <Path d={STAR} fill={GOLD} />
      </Svg>
    </Reanimated.View>
  );
}

/** a short word that comes in in sun yellow and settles, at `at` (no overshoot, no wobble) */
export function Shout({ text, at, still, size = 40 }: { text: string; at: number; still: boolean; size?: number }) {
  const v = useSharedValue(still ? 1 : 0);
  useEffect(() => {
    if (still) return;
    v.value = withDelay(at, withSpring(1, SETTLE));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const st = useAnimatedStyle(() => ({
    opacity: Math.min(1, v.value * 1.6),
    transform: [{ scale: interpolate(v.value, [0, 1], [0.8, 1]) }],
  }));
  return (
    <Reanimated.View style={st}>
      <Text style={[s.shout, { fontSize: size, lineHeight: size * 1.12 }]} accessibilityRole="header">
        {text}
      </Text>
    </Reanimated.View>
  );
}

/** gold four-point stars that twinkle around something of `size`, one after another, from `at` */
const SPOTS = [
  { x: -0.06, y: 0.16, r: 22, d: 0 },
  { x: 1.02, y: 0.08, r: 16, d: 500 },
  { x: 0.96, y: 0.64, r: 24, d: 1000 },
  { x: 0.0, y: 0.74, r: 14, d: 1400 },
  { x: 0.52, y: -0.08, r: 12, d: 800 },
];
export function Sparkles({ size, at = 0, still }: { size: number; at?: number; still: boolean }) {
  const on = useSharedValue(still ? 1 : 0);
  useEffect(() => {
    if (!still) on.value = withDelay(at, withTiming(1, { duration: 400 }));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {SPOTS.map((p, i) => (
        <Twinkle key={i} v={on} left={p.x * size - p.r / 2} top={p.y * size - p.r / 2} r={p.r} delay={p.d} still={still} />
      ))}
    </View>
  );
}
function Twinkle({ v, left, top, r, delay, still }: { v: SharedValue<number>; left: number; top: number; r: number; delay: number; still: boolean }) {
  const t = useSharedValue(still ? 0.8 : 0);
  useEffect(() => {
    if (still) return;
    t.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) }),
          withTiming(0, { duration: 520, easing: Easing.in(Easing.cubic) }),
          withTiming(0, { duration: 900 }),
        ),
        -1,
      ),
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const st = useAnimatedStyle(() => ({ opacity: v.value * t.value, transform: [{ scale: 0.3 + 0.7 * t.value }, { rotate: `${t.value * 45}deg` }] }));
  return (
    <Reanimated.View style={[{ position: 'absolute', left, top, width: r, height: r }, st]}>
      <Svg width={r} height={r} viewBox="0 0 24 24">
        <Path d={STAR} fill={GOLD} />
      </Svg>
    </Reanimated.View>
  );
}

type Piece = { vx: number; vy: number; spin: number; c: string; s: number; star: boolean };
/** confetti and a few stars thrown up from (x, y), tumbling as they fall; `fire` is a number: each new value throws again */
export function Burst({ fire, x, y, w, n = 34 }: { fire: number; x: number; y: number; w: number; n?: number }) {
  const v = useSharedValue(0);
  const [bits] = useState<Piece[]>(() =>
    Array.from({ length: n }, (_, i) => {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.35;
      const sp = 0.45 + Math.random() * 0.6;
      return {
        vx: Math.cos(a) * sp * w * 0.75,
        vy: Math.sin(a) * sp * w * 1.1,
        spin: (Math.random() - 0.5) * 900,
        c: CONFETTI[i % CONFETTI.length],
        s: 7 + Math.random() * 6,
        star: i % 5 === 0,
      };
    }),
  );
  useEffect(() => {
    if (!fire) return;
    v.value = 0;
    v.value = withTiming(1, { duration: 1700, easing: Easing.linear });
  }, [fire]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {bits.map((b, i) => (
        <Bit key={i} v={v} x={x} y={y} b={b} />
      ))}
    </View>
  );
}
function Bit({ v, x, y, b }: { v: SharedValue<number>; x: number; y: number; b: Piece }) {
  const st = useAnimatedStyle(() => {
    const t = v.value;
    return {
      opacity: t <= 0 || t >= 1 ? 0 : t > 0.75 ? (1 - t) * 4 : 1,
      transform: [
        { translateX: x + b.vx * t - b.s / 2 },
        { translateY: y + b.vy * t + 900 * t * t - b.s / 2 },
        { rotate: `${b.spin * t}deg` },
        { scaleY: b.star ? 1 : 0.5 + 0.5 * Math.abs(Math.cos(t * 12 + b.spin)) },
      ],
    };
  });
  if (b.star)
    return (
      <Reanimated.View style={[{ position: 'absolute', left: 0, top: 0, width: b.s + 6, height: b.s + 6 }, st]}>
        <Svg width={b.s + 6} height={b.s + 6} viewBox="0 0 24 24">
          <Path d={STAR} fill={GOLD} />
        </Svg>
      </Reanimated.View>
    );
  return <Reanimated.View style={[{ position: 'absolute', left: 0, top: 0, width: b.s, height: b.s, borderRadius: 2, backgroundColor: b.c }, st]} />;
}

/** the gold button with its lip, the one way on from an earned moment */
export const btnStyle = StyleSheet.create({
  btn: { minHeight: 56, borderRadius: 16, backgroundColor: GOLD, borderBottomWidth: 5, borderBottomColor: LIP, alignItems: 'center', justifyContent: 'center' },
  down: { borderBottomWidth: 0, marginTop: 5 },
  text: { fontFamily: font.display, fontSize: 20, color: '#3A2A00' },
});

const s = StyleSheet.create({
  meter: { alignSelf: 'stretch', gap: 8 },
  meterHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  meterLabel: { fontFamily: font.display, fontSize: 17 },
  meterRight: { fontFamily: font.bodySemi, fontSize: 15 },
  track: { height: 20, borderRadius: 10, overflow: 'hidden' },
  fill: { height: 20, borderRadius: 10, backgroundColor: GOLD, paddingTop: 4, paddingHorizontal: 8 },
  shine: { height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.45)' },
  star: { position: 'absolute', left: 0, top: 0, width: 18, height: 18 },
  shout: { fontFamily: font.display, color: GOLD, textAlign: 'center' },
  ink: { color: nightInk.ink },
});
