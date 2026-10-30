/* The breath on screen, with the words for each step and the time left. Orb is Breathe's particle breath; BreathSun is the
   sun on the first SOS screen. */
import { breathPhase, PATTERNS, PH_TXT } from '@daybook/core';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, View } from 'react-native';
import Reanimated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming, type SharedValue } from 'react-native-reanimated';
import { BIG_MAX, Text } from '@/components/text';

/** the words over the sun sit in a row of a set height above it, so they stay close to their size */
const ON_ART = 1.1;
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import { WavyRing } from '@/components/shapes';

import { breathAt, useBreathClock, webDeps, type Steps } from '@/lib/breath';
import { buzz } from '@/lib/feel';
import { useReducedMotion } from '@/lib/motion';
import { font, useTheme } from '@/lib/theme';

export const fmtMS = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
};

/** seconds since start, ticking ten times a second while on */
export function useSeconds(start: number | null, on = true) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!on || start == null) return;
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, [start, on]);
  return start == null ? 0 : Math.max(0, (now - start) / 1000);
}

/* the particle breath: about thirty dots of several sizes. At rest they sit in a soft cluster at the center. On a breath
   in each one travels a curved path out through its own spot and settles into an evenly spaced ring at the top of the
   breath; on a breath out they drift back in, curling a little, to a fresh cluster. Every dot reads the one breath curve
   (lib/breath) from a clock on the UI thread, each a moment after the one before, so the turn at the top and the bottom
   rolls through the dots like a wave and nothing ever stops dead. The ring turns slowly all the time, and the dots
   twinkle, so it is never frozen. */
const DOTS = 32;
/** the last dot follows the breath this many seconds after the first */
const LAG = 0.45;
/** how fast the ring turns, in turns a minute */
const SPIN = 0.35;
const TAU = Math.PI * 2;

/** one dot's own look: its size (a part of the orb's size), its color, how it twinkles, and how late it follows */
const LOOK = Array.from({ length: DOTS }, (_, i) => ({
  d: [0.052, 0.068, 0.034, 0.078, 0.044, 0.026, 0.058][i % 7],
  col: (i * 5) % 4,
  tw: 1 + (i % 3),
  seed: (i * 0.618) % 1,
}));

/** no breath to follow: the cluster rests */
const STILL: Steps = [['hold', 1]];

/** a steady random number (0 to 1) for a round and a dot, the same on every frame */
function rnd(n: number) {
  'worklet';
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

export function Orb({
  pattern,
  sec,
  label,
  time,
  size = 240,
  ink,
}: {
  /** the breathing pattern (calm, box, slow, sigh), or null to stay still */
  pattern: string | null;
  sec: number;
  /** the word shown when not breathing */
  label?: string;
  time: string;
  size?: number;
  ink?: string;
}) {
  const c = useTheme();
  const still = useReducedMotion();
  const ph = pattern ? breathPhase(pattern, sec) : null;
  const steps: Steps = (pattern && (PATTERNS as Record<string, { ph: Steps }>)[pattern]?.ph) || STILL;
  const clock = useBreathClock(sec);
  const words = ph ? PH_TXT[ph.k] : label || '';
  /* the radius of the ring the dots make at the top of a breath */
  const rr = size * 0.37;
  /* one warm family, golds to amber: deeper on a light sky, where the palest gold would fade, and lighter at night */
  const cols = c.scheme === 'dark' ? ['#FFD25A', '#FFE9A8', '#FFB547', '#FFC97A'] : ['#F6A91F', '#FFC832', '#EE8A25', '#FFB43A'];
  /* the glow: a deeper gold on a light sky; at night a paler, thinner one, since gold at strength over a dark blue mixes to a
     muddy brown instead of reading as light */
  const [glowColor, glowAlpha] = c.scheme === 'dark' ? ['#FFE4A0', 0.22] : ['#FFC43C', 0.3];
  const glow = useAnimatedStyle(
    () => {
      /* the glow follows a little behind the dots, so it is still settling as they turn */
      const v = breathAt(steps, clock.value - LAG * 0.6)[0];
      const e = still ? 0.5 + 0.5 * v : v;
      return { opacity: 0.4 + 0.5 * e, transform: [{ scale: 0.75 + 0.4 * e }] };
    },
    webDeps(still, steps),
  );
  return (
    <View style={{ alignItems: 'center', gap: 14 }}>
      <View
        style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants">
        {/* a warm glow that breathes with the dots, reaching past them */}
        <Reanimated.View style={[StyleSheet.absoluteFill, glow]}>
          <Svg width={size} height={size}>
            <Defs>
              <RadialGradient id="orbGlow" cx="50%" cy="50%" r="50%">
                <Stop offset="0.3" stopColor={glowColor} stopOpacity={glowAlpha} />
                <Stop offset="1" stopColor={glowColor} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Circle cx={size / 2} cy={size / 2} r={size / 2} fill="url(#orbGlow)" />
          </Svg>
        </Reanimated.View>
        {/* how full a breath in goes: a faint ring where the dots gather */}
        {pattern ? <View style={[s.guide, { width: rr * 2, height: rr * 2, borderRadius: rr, borderColor: ink || c.ink }]} /> : null}
        {LOOK.map((l, i) => (
          <Dot key={i} i={i} size={size} rr={rr} color={cols[l.col]} steps={steps} clock={clock} still={still} />
        ))}
      </View>
      <View style={{ alignItems: 'center', gap: 6 }} accessibilityLiveRegion="polite">
        <Text maxFontSizeMultiplier={BIG_MAX} style={[s.phase, { color: ink || c.ink }]}>
          {words}
        </Text>
        <Text style={[s.pill, { color: ink || c.ink, backgroundColor: c.scBtn }]} accessibilityElementsHidden importantForAccessibility="no">
          {time}
        </Text>
      </View>
    </View>
  );
}

/** one dot of the particle breath */
function Dot({
  i,
  size,
  rr,
  color,
  steps,
  clock,
  still,
}: {
  i: number;
  size: number;
  rr: number;
  color: string;
  steps: Steps;
  clock: SharedValue<number>;
  still: boolean;
}) {
  const l = LOOK[i];
  const d = Math.max(4, size * l.d);
  const st = useAnimatedStyle(
    () => {
      const now = clock.value;
      const [v, k, out] = breathAt(steps, now - l.seed * LAG);
      /* its place on the ring, which turns slowly all the time */
      const a = (i / DOTS) * TAU - Math.PI / 2 + (now / 60) * SPIN * TAU;
      const twinkle = Math.sin(((now / 7) * l.tw + l.seed) * TAU);
      if (still) {
        /* Reduce Motion: a still ring that softly brightens on a breath in and dims on a breath out */
        const a0 = (i / DOTS) * TAU - Math.PI / 2;
        return { opacity: 0.35 + 0.65 * v, transform: [{ translateX: rr * Math.cos(a0) }, { translateY: rr * Math.sin(a0) }, { scale: 0.75 + 0.25 * v }] };
      }
      /* a breath out of round k ends in cluster k + 1, where the breath in of the next round starts */
      const h = k + out;
      const ha = rnd(h * 131 + i * 7 + 1) * TAU;
      const hr = Math.sqrt(rnd(h * 131 + i * 7 + 2)) * 0.3 * rr;
      const hx = hr * Math.cos(ha);
      const hy = hr * Math.sin(ha);
      let x: number;
      let y: number;
      if (out) {
        /* breathing out: back to the cluster, curling a little on the way */
        const b = a + (1 - v) * 0.7;
        x = hx + (rr * Math.cos(b) - hx) * v;
        y = hy + (rr * Math.sin(b) - hy) * v;
      } else {
        /* breathing in: out from the cluster to its place on the ring, in polar terms so the opening grows evenly, swinging
         out through its own spot on the way (the swing is 0 at both ends, so it leaves and lands at rest) */
        const swing = Math.sin(v * Math.PI);
        let da = a - ha;
        da -= Math.round(da / TAU) * TAU;
        const fa0 = (i / DOTS) * TAU - Math.PI / 2 + (rnd(k * 131 + i * 7 + 3) - 0.5) * 1.8;
        const rf = (0.5 + rnd(k * 131 + i * 7 + 4) * 0.62) * rr;
        let fa = fa0 - (ha + da / 2);
        fa -= Math.round(fa / TAU) * TAU;
        const rad = hr + (rr - hr) * v + (rf - (hr + rr) / 2) * swing * 0.5;
        const ang = ha + da * v + fa * swing * 0.6;
        x = rad * Math.cos(ang);
        y = rad * Math.sin(ang);
      }
      /* at rest the cluster breathes very slightly, so it never looks frozen */
      const drift = 1 + 0.04 * (1 - v) * Math.sin((now / 7 + l.seed) * TAU);
      return {
        opacity: (0.72 + 0.28 * v) * (0.85 + 0.15 * twinkle),
        transform: [{ translateX: x * drift }, { translateY: y * drift }, { scale: (0.62 + 0.38 * v) * (1 + 0.08 * twinkle * v) }],
      };
    },
    webDeps(still, rr, steps),
  );
  return (
    <Reanimated.View
      style={[
        s.dot,
        {
          width: d,
          height: d,
          borderRadius: d / 2,
          marginLeft: -d / 2,
          marginTop: -d / 2,
          /* a soft halo, lighter than the dot, so it glows without going muddy */
          boxShadow: `0 0 ${Math.round(d * 0.6)}px ${color}70`,
        },
        st,
      ]}>
      {/* each dot is a small lit sphere: a pale spot of light up and to the left, deepening to its color at the edge */}
      <Svg width={d} height={d}>
        <Defs>
          <RadialGradient id={'dot' + i} cx="38%" cy="34%" r="70%">
            <Stop offset="0" stopColor="#FFFBEA" />
            <Stop offset="0.45" stopColor={color} />
            <Stop offset="1" stopColor={color} stopOpacity={0.92} />
          </RadialGradient>
        </Defs>
        <Circle cx={d / 2} cy={d / 2} r={d / 2} fill={`url(#dot${i})`} />
      </Svg>
    </Reanimated.View>
  );
}

/* the SOS sun breathes calm: 4 in (it grows), 6 out (it shrinks) */
const CALM: Steps = [
  ['in', 4],
  ['out', 6],
];
const CALM_SEC = 10;
/* how small the sun is on an empty breath, how far the ring sits outside the full sun, and the room for the words above */
const SMALL = 0.84;
const RING = 1.22;
const WORDS = 96;

/** the first SOS screen: a round sun in the middle that grows while you breathe in and shrinks while you breathe out, the
    words for each step above it, and around it Android's wavy progress line (the one squiggle, components/shapes), which
    goes a third of the way round with each of three breaths and closes with one small swell when they are done. It
    measures the room it has and fills it. It ticks only while on. It counts `breaths` breaths, with a soft buzz as each
    one starts, and tells onBreaths how many are done; after that it keeps breathing. */
export function BreathSun({ on, breaths, onBreaths }: { on: boolean; breaths: number; onBreaths?: (n: number) => void }) {
  const c = useTheme();
  const [r0] = useState(() => Date.now());
  const sec = useSeconds(r0, on);
  const ph = breathPhase('calm', sec);
  /* calm is two steps a breath: in, then out */
  const done = Math.floor(ph.idx / 2);
  const over = done >= breaths;
  useEffect(() => {
    onBreaths?.(done);
    if (done < breaths) buzz('tap');
    else if (done === breaths) buzz('lit');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);
  const still = useReducedMotion();
  const clock = useBreathClock(sec, on);
  /* a screen reader hears each turn of the breath: the words are a live region (Android and the web), and iOS, which has
     no live regions, is told each one */
  const say = over ? 'Well done. Three slow breaths' : PH_TXT[ph.k] + '. Breath ' + (done + 1) + ' of ' + breaths;
  useEffect(() => {
    if (Platform.OS !== 'ios' || !on) return;
    AccessibilityInfo.isScreenReaderEnabled()
      .then((yes) => yes && AccessibilityInfo.announceForAccessibility(say))
      .catch(() => undefined);
  }, [say, on]);
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  /* the ring, as big as fits under the words, and the sun inside it */
  const ring = box ? Math.max(0, Math.min(box.w * 0.86, 330, box.h - WORDS - 8)) : 0;
  const d = ring / RING;
  const glow = d * 1.7;
  /* the ring fills smoothly over the breaths, and swells once when it closes */
  const p = Math.min(1, sec / (breaths * CALM_SEC));
  const swell = useSharedValue(1);
  useEffect(() => {
    if (!over || still) return;
    swell.value = withSequence(withTiming(1.07, { duration: 260 }), withSpring(1, { damping: 7, stiffness: 160 }));
  }, [over, still, swell]);
  const grow = useAnimatedStyle(() => {
    const v = still ? 0.5 : breathAt(CALM, clock.value)[0];
    return { transform: [{ scale: SMALL + (1 - SMALL) * v }] };
  }, webDeps(still));
  const ringGrow = useAnimatedStyle(() => {
    const v = still ? 0.5 : breathAt(CALM, clock.value)[0];
    return { transform: [{ scale: swell.value * (0.97 + 0.03 * v) }] };
  }, webDeps(still));
  return (
    <View style={s.bs} onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      {/* the words for this breath, above the sun */}
      <View
        style={s.bsWords}
        accessible={Platform.OS !== 'web'}
        accessibilityLabel={Platform.OS !== 'web' ? say : undefined}
        accessibilityLiveRegion="polite"
        aria-live="polite">
        <Text maxFontSizeMultiplier={ON_ART} style={[s.bsPhase, { color: c.ink }]} accessibilityRole="header">
          {over ? 'Well done' : PH_TXT[ph.k]}
        </Text>
        <Text maxFontSizeMultiplier={ON_ART} style={[s.bsCount, { color: c.muted }]}>
          {over ? 'Three slow breaths' : done + 1 + ' of ' + breaths}
        </Text>
      </View>
      {box && d >= 72 ? (
        <View style={s.bsMid} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Reanimated.View style={[s.bsAt, { width: glow, height: glow }, grow]}>
            <Svg width={glow} height={glow} style={StyleSheet.absoluteFill}>
              <Defs>
                <RadialGradient id="bsGlow" cx="50%" cy="50%" r="50%">
                  <Stop offset="0.5" stopColor="#FFC43C" stopOpacity={0.4} />
                  <Stop offset="1" stopColor="#FFC43C" stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <Circle cx={glow / 2} cy={glow / 2} r={glow / 2} fill="url(#bsGlow)" />
            </Svg>
            <View style={[s.orb, { width: d, height: d, borderRadius: d / 2, shadowColor: '#FFB43A', backgroundColor: '#FFB23E' }]}>
              <Svg width={d} height={d}>
                <Defs>
                  <RadialGradient id="bsCore" cx="44%" cy="34%" r="66%">
                    <Stop offset="0" stopColor="#FFF6CF" />
                    <Stop offset="0.42" stopColor="#FFDA6B" />
                    <Stop offset="1" stopColor="#FFB23E" />
                  </RadialGradient>
                </Defs>
                <Circle cx={d / 2} cy={d / 2} r={d / 2} fill="url(#bsCore)" />
              </Svg>
            </View>
          </Reanimated.View>
          <Reanimated.View style={[s.bsAt, { width: ring, height: ring }, ringGrow]}>
            <WavyRing size={ring} p={p} color={c.accent} track={c.accent + '33'} stroke={6} />
          </Reanimated.View>
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  /* the sun's room: the words at the top, the sun and its ring centered in what is left */
  bs: { flexGrow: 1, alignSelf: 'stretch', minHeight: WORDS },
  bsWords: { height: WORDS, alignItems: 'center', justifyContent: 'center', gap: 2 },
  bsPhase: { fontFamily: font.displayBold, fontSize: 42, lineHeight: 50 },
  bsCount: { fontFamily: font.bodySemi, fontSize: 15, fontVariant: ['tabular-nums'] },
  bsMid: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bsAt: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  pill: {
    minWidth: 52,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
    fontFamily: font.bodyBold,
    fontSize: 15,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  dot: { position: 'absolute', left: '50%', top: '50%' },
  orb: { shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.7, shadowRadius: 30, elevation: 6 },
  phase: { fontFamily: font.display, fontSize: 28, lineHeight: 34 },
  guide: { position: 'absolute', borderWidth: 1, opacity: 0.1 },
});
