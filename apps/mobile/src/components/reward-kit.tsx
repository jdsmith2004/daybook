/* The pieces every earned moment is built from (the owner, November 13, 2026: "the level ups and stuff should be inspired by
   duolingos celebrations"). Duolingo's beats, in Daybook's own look: tiles that land one at a time, each with a knock and its
   number counting up; a short shout that pops in sun yellow; gold stars that twinkle around the flame; and a burst of confetti
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
import { Icon } from '@/components/ui';
import { buzz, knock } from '@/lib/feel';
import { font, nightInk } from '@/lib/theme';

export const GOLD = '#FFD25A';
export const NIGHT = '#16113A';
export const LIP = '#D99A12';
/** a four-point star, in a 24 box */
export const STAR = 'M12 0C13 8 16 11 24 12C16 13 13 16 12 24C11 16 8 13 0 12C8 11 11 8 12 0Z';
const CONFETTI = [GOLD, '#FF8A5B', '#FFFFFF', '#A898FF', '#7FE0B5', GOLD];

/** the tile colors: the sun, the mint of an urge ridden out, the sky, the violet of the night */
export const TILE = { sun: GOLD, mint: '#5FD6A4', sky: '#6CC4FF', violet: '#B4A2FF', coral: '#FF9B7A' } as const;

export interface Tile {
  /** the word on the tile's band */
  label: string;
  /** a number counts up to itself; words simply land */
  value: number | string;
  prefix?: string;
  suffix?: string;
  icon?: string;
  color: string;
  /** what a screen reader says for it, when the label and value are not enough */
  a11y?: string;
}

/** the gap between two tiles landing */
export const TILE_GAP = 380;

/** a row of tiles that land one after another from `at`, each with a knock, its number counting up with faint ticks */
export function Tiles({
  tiles,
  at,
  still,
  quiet,
  body,
  ink,
}: {
  tiles: Tile[];
  at: number;
  still: boolean;
  quiet?: boolean;
  /** the inside of each tile, and the color of its value, on a light page (the night by default, the value in the tile's color) */
  body?: string;
  ink?: string;
}) {
  return (
    <View style={s.tiles}>
      {tiles.map((t, i) => (
        <TileView key={t.label} t={t} at={at + i * TILE_GAP} still={still} quiet={quiet} body={body} ink={ink} />
      ))}
    </View>
  );
}

function TileView({ t, at, still, quiet, body, ink }: { t: Tile; at: number; still: boolean; quiet?: boolean; body?: string; ink?: string }) {
  const num = typeof t.value === 'number';
  const [n, setN] = useState(still || !num ? t.value : 0);
  const v = useSharedValue(still ? 1 : 0);
  const glint = useSharedValue(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => {
    if (still) return;
    const tm = timers.current;
    tm.push(
      setTimeout(() => {
        if (!quiet) knock(Haptics.ImpactFeedbackStyle.Light);
        v.value = withSpring(1, { damping: 9, stiffness: 190 });
        glint.value = withDelay(120, withSequence(withTiming(1, { duration: 260 }), withTiming(0, { duration: 420 })));
      }, at),
    );
    if (num) {
      const to = t.value as number;
      const steps = Math.min(14, Math.max(1, Math.abs(to)));
      for (let k = 1; k <= steps; k++)
        tm.push(
          setTimeout(
            () => {
              setN(Math.round((to * k) / steps));
              if (!quiet && k % 3 === 0) buzz('tick');
            },
            at + 140 + k * 42,
          ),
        );
    }
    return () => tm.forEach(clearTimeout);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const inStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, v.value * 2),
    transform: [{ translateY: 26 * (1 - v.value) }, { scale: interpolate(v.value, [0, 1], [0.5, 1]) }],
  }));
  const glintStyle = useAnimatedStyle(() => ({ opacity: glint.value, transform: [{ scale: 0.4 + glint.value * 0.8 }, { rotate: `${glint.value * 90}deg` }] }));
  const shown = (t.prefix || '') + String(n) + (t.suffix || '');
  return (
    <Reanimated.View
      style={[s.tile, { backgroundColor: t.color }, inStyle]}
      accessible
      accessibilityLabel={t.a11y || t.label + ': ' + (t.prefix || '') + String(t.value) + (t.suffix || '')}>
      <Text style={s.tileLabel} numberOfLines={1}>
        {t.label}
      </Text>
      <View style={[s.tileBody, body ? { backgroundColor: body } : null]}>
        {t.icon ? <Icon name={t.icon} size={18} color={ink || t.color} /> : null}
        <Text style={[s.tileVal, { color: ink || t.color }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
          {shown}
        </Text>
      </View>
      <Reanimated.View pointerEvents="none" style={[s.glint, glintStyle]}>
        <Svg width={18} height={18} viewBox="0 0 24 24">
          <Path d={STAR} fill="#FFFFFF" />
        </Svg>
      </Reanimated.View>
    </Reanimated.View>
  );
}

/** a short word that pops in sun yellow, overshooting a little, at `at` */
export function Shout({ text, at, still, size = 40 }: { text: string; at: number; still: boolean; size?: number }) {
  const v = useSharedValue(still ? 1 : 0);
  useEffect(() => {
    if (still) return;
    v.value = withDelay(at, withSpring(1, { damping: 7, stiffness: 210 }));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const st = useAnimatedStyle(() => ({
    opacity: Math.min(1, v.value * 1.6),
    transform: [{ scale: interpolate(v.value, [0, 1], [0.3, 1]) }, { rotate: `${(1 - Math.min(1, v.value)) * -8}deg` }],
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
  tiles: { flexDirection: 'row', justifyContent: 'center', gap: 10, alignSelf: 'stretch' },
  tile: { flex: 1, maxWidth: 116, borderRadius: 16, padding: 3, paddingTop: 0 },
  tileLabel: { fontFamily: font.bodyBold, fontSize: 13, lineHeight: 24, color: '#1E1646', textAlign: 'center' },
  tileBody: {
    minHeight: 50,
    borderRadius: 13,
    backgroundColor: NIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 6,
  },
  tileVal: { fontFamily: font.display, fontSize: 22 },
  glint: { position: 'absolute', right: -6, top: -8 },
  shout: { fontFamily: font.display, color: GOLD, textAlign: 'center' },
  ink: { color: nightInk.ink },
});
