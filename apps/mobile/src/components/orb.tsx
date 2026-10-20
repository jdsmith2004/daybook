/* The breathing sun: it grows while you breathe in and shrinks while you breathe out, with the words for each step and the time
   left. Orb is used by Breathe and the 10-minute pause (as a guide); HorizonSun is the first SOS screen. */
import { breathPhase, PATTERNS, PH_TXT } from '@daybook/core';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Reanimated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { BIG_MAX, Text } from '@/components/text';

/** the words over the sun sit in a row of a set height above it, so they stay close to their size */
const ON_ART = 1.1;
import Svg, { Circle, Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

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
                <Stop offset="0.3" stopColor="#FFC43C" stopOpacity={0.3} />
                <Stop offset="1" stopColor="#FFC43C" stopOpacity={0} />
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

/* the SOS sun breathes calm: 4 in (it rises), 6 out (it sinks) */
const CALM: Steps = [
  ['in', 4],
  ['out', 6],
];
/* how much of the sun shows when it is fully risen and when it is low, and how far it reaches down behind the sheet */
const HI = 0.64;
const LO = 0.3;
const UNDER = 56;
const ROW = 40;
const GAP = 18;
/* the gap between this screen's content and the sheet (the sheet's top margin): the horizon is the sheet's edge */
const EDGE = 18;
/* the screen's side margin: the light reaches past it to the edges of the screen */
const SIDE = 16;

/** the first SOS minute: a sun on the horizon (the top edge of the sheet below) that rises while you breathe in and sinks
    while you breathe out, with the words for each step and the time left just above it. It measures the room it has and
    fills it, so the words above and the sheet below never crowd it. After the minute it keeps going. It ticks only while
    on (when the screen is in front). With `breaths`, it counts breaths instead of time ("Breath 2 of 3"), with a soft
    buzz as each one starts, and tells onBreaths how many are done. */
export function HorizonSun({ on, breaths, onBreaths }: { on: boolean; breaths?: number; onBreaths?: (n: number) => void }) {
  const c = useTheme();
  const [r0] = useState(() => Date.now());
  const sec = useSeconds(r0, on);
  const left = Math.max(0, 60 - sec);
  const ph = breathPhase('calm', sec);
  /* calm is two steps a breath: in, then out */
  const done = Math.floor(ph.idx / 2);
  useEffect(() => {
    if (!breaths) return;
    onBreaths?.(done);
    if (done < breaths) buzz('tap');
    else if (done === breaths) buzz('lit');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);
  const still = useReducedMotion();
  const clock = useBreathClock(sec, on);
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  /* the biggest sun that fits under the words, leaving room for the line above it */
  const d = box ? Math.max(0, Math.min(box.w * 0.8, 330, (box.h + EDGE - ROW - GAP) / HI)) : 0;
  const sun = d >= 72;
  const H = box ? box.h + UNDER : 0;
  const W = box ? box.w + SIDE * 2 : 0;
  /* the glow around the sun, as wide as it can be without being cut off at the top of its room */
  const glow = box ? Math.min(d * 1.9, 2 * (box.h + EDGE - HI * d + d / 2) + 24) : 0;
  /* 1 is fully risen, 0 is low on the horizon; with Reduce Motion it stays half risen */
  const lift = useAnimatedStyle(
    () => {
      const v = still ? 0.5 : breathAt(CALM, clock.value)[0];
      return { transform: [{ translateY: (HI - LO) * d * (1 - v) }] };
    },
    webDeps(still, d),
  );
  const shine = useAnimatedStyle(() => {
    const v = still ? 0.5 : breathAt(CALM, clock.value - 0.25)[0];
    return { opacity: 0.55 + 0.45 * v };
  }, webDeps(still));
  return (
    <View style={s.hz} onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      {box && sun ? (
        <View
          style={[s.hzSky, { height: H, bottom: -UNDER, left: -SIDE, right: -SIDE }]}
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants">
          {/* the warm light low along the horizon */}
          <Svg width={W} height={H} style={StyleSheet.absoluteFill}>
            <Defs>
              <RadialGradient id="hz" cx="50%" cy="100%" rx="62%" ry="60%">
                <Stop offset="0" stopColor="#FFC43C" stopOpacity={0.34} />
                <Stop offset="1" stopColor="#FFC43C" stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Rect x={0} y={0} width={W} height={H} fill="url(#hz)" />
          </Svg>
          {/* the sun with its glow, moving up and down together */}
          <Reanimated.View
            style={[
              {
                position: 'absolute',
                left: (W - glow) / 2,
                top: box.h + EDGE - HI * d - (glow - d) / 2,
                width: glow,
                height: glow,
                alignItems: 'center',
                justifyContent: 'center',
              },
              lift,
            ]}>
            <Reanimated.View style={[StyleSheet.absoluteFill, shine]}>
              <Svg width={glow} height={glow}>
                <Defs>
                  <RadialGradient id="hzGlow" cx="50%" cy="50%" r="50%">
                    <Stop offset="0.5" stopColor="#FFC43C" stopOpacity={0.42} />
                    <Stop offset="1" stopColor="#FFC43C" stopOpacity={0} />
                  </RadialGradient>
                </Defs>
                <Circle cx={glow / 2} cy={glow / 2} r={glow / 2} fill="url(#hzGlow)" />
              </Svg>
            </Reanimated.View>
            <View style={[s.orb, { width: d, height: d, borderRadius: d / 2, shadowColor: '#FFB43A' }]}>
              <Svg width={d} height={d}>
                <Defs>
                  <RadialGradient id="hzCore" cx="44%" cy="34%" r="66%">
                    <Stop offset="0" stopColor="#FFF6CF" />
                    <Stop offset="0.42" stopColor="#FFDA6B" />
                    <Stop offset="1" stopColor="#FFB23E" />
                  </RadialGradient>
                </Defs>
                <Circle cx={d / 2} cy={d / 2} r={d / 2} fill="url(#hzCore)" />
              </Svg>
            </View>
          </Reanimated.View>
        </View>
      ) : null}
      {/* the words for this breath, just above the sun at its highest */}
      <View
        style={[s.ph, box && sun ? { position: 'absolute', left: 0, right: 0, top: Math.max(0, box.h + EDGE - HI * d - GAP - ROW) } : null]}
        accessibilityLiveRegion="polite">
        <Text maxFontSizeMultiplier={ON_ART} style={[s.phase, { color: c.ink }]}>
          {PH_TXT[ph.k]}
        </Text>
        <Text
          maxFontSizeMultiplier={ON_ART}
          style={[s.pill, { color: c.ink, backgroundColor: c.scBtn }]}
          accessibilityElementsHidden
          importantForAccessibility="no">
          {breaths ? (done < breaths ? 'Breath ' + (done + 1) + ' of ' + breaths : 'Well done') : left > 0 ? fmtMS(left * 1000) : 'Keep going'}
        </Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  ph: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: ROW },
  /* the sun's room: whatever is left between the words and the sheet. What is inside is placed by hand, so it never
     pushes the screen taller. */
  hz: { flexGrow: 1, alignSelf: 'stretch', minHeight: ROW, justifyContent: 'flex-end' },
  hzSky: { position: 'absolute', overflow: 'hidden' },
  pill: {
    minWidth: 52,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
    fontFamily: font.bodyBold,
    fontSize: 14,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  dot: { position: 'absolute', left: '50%', top: '50%' },
  orb: { shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.7, shadowRadius: 30, elevation: 6 },
  phase: { fontFamily: font.display, fontSize: 30, lineHeight: 38 },
  guide: { position: 'absolute', borderWidth: 1, opacity: 0.1 },
  time: { fontFamily: font.bodySemi, fontSize: 16, opacity: 0.8, fontVariant: ['tabular-nums'] },
});
