/* The breathing sun: it grows while you breathe in and shrinks while you breathe out, with the words for each step and the time
   left. Orb is used by Breathe and the 10-minute pause (as a guide); HorizonSun is the first SOS screen. */
import { breathPhase, PH_TXT } from '@daybook/core';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing as RNEasing, Platform, StyleSheet, View } from 'react-native';
import Reanimated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming, type SharedValue } from 'react-native-reanimated';
import { BIG_MAX, Text } from '@/components/text';

/** the words over the sun sit in a row of a set height above it, so they stay close to their size */
const ON_ART = 1.1;
import Svg, { Circle, Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { buzz } from '@/lib/feel';
import { useReducedMotion } from '@/lib/motion';
import { font, useTheme } from '@/lib/theme';

const NATIVE = Platform.OS !== 'web';
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

/* the particle breath: about thirty dots of a few sizes. At rest they sit in a soft cluster at the center. On a breath in
   they burst out along random paths to a loose scatter, then glide into an evenly spaced ring; on a hold they shimmer and
   the ring turns slowly; on a breath out they drift back in, curling a little. Each breath gets a fresh scatter. The
   motion runs on Reanimated shared values (the UI thread on iOS and Android, plain JavaScript on the web). */
const DOTS = 30;
/** where the burst ends and the glide into the ring begins, as a part of the breath in */
const BURST = 0.38;
/** how far a breath in goes on the first of the sigh's two breaths in */
const IN1 = 0.8;
const TAU = Math.PI * 2;

/** one dot's own look: its size (a part of the orb's size), its color and how it twinkles */
const LOOK = Array.from({ length: DOTS }, (_, i) => ({
  d: [0.05, 0.062, 0.038, 0.072, 0.045][i % 5],
  col: i % 3,
  /* whole numbers, so the twinkle loops without a jump */
  tw: 1 + (i % 3),
  seed: (i * 0.618) % 1,
}));

/** a fresh soft cluster near the center: x and y for each dot, as parts of the orb's radius */
function cluster(): number[] {
  const out: number[] = [];
  for (let i = 0; i < DOTS; i++) {
    const a = Math.random() * TAU;
    const r = Math.sqrt(Math.random()) * 0.3;
    out.push(r * Math.cos(a), r * Math.sin(a));
  }
  return out;
}
/** a fresh loose scatter: each dot flies out to a random spot, some past the ring and some short of it */
function scatter(): number[] {
  const out: number[] = [];
  for (let i = 0; i < DOTS; i++) {
    /* near its own place on the ring, so the glide into the ring stays short and calm */
    const a = (i / DOTS) * TAU + (Math.random() - 0.5) * 1.6;
    const r = 0.45 + Math.random() * 0.75;
    out.push(r * Math.cos(a), r * Math.sin(a));
  }
  return out;
}

export function Orb({
  pattern,
  sec,
  label,
  time,
  ring,
  size = 240,
  ink,
}: {
  /** the breathing pattern (calm, box, slow, sigh), or null to stay still */
  pattern: string | null;
  sec: number;
  /** the word shown when not breathing (like "Waiting it out") */
  label?: string;
  time: string;
  /** 0 to 1: how much of the ring is left */
  ring?: number | null;
  size?: number;
  ink?: string;
}) {
  const c = useTheme();
  const still = useReducedMotion();
  const ph = pattern ? breathPhase(pattern, sec) : null;
  const idx = ph ? ph.idx : -1;
  /* p: how full the breath is (0 at rest, 1 on the ring). out: 1 while breathing out (the straight way back in) */
  const p = useSharedValue(0);
  const out = useSharedValue(0);
  const rot = useSharedValue(0);
  const clock = useSharedValue(0);
  const home = useSharedValue(cluster());
  const far = useSharedValue(scatter());
  useEffect(() => {
    if (still) {
      cancelAnimation(clock);
      clock.value = 0;
      return;
    }
    clock.value = 0;
    clock.value = withRepeat(withTiming(1, { duration: 7000, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(clock);
  }, [still, clock]);
  useEffect(() => {
    if (!ph) {
      out.value = 1;
      p.value = withTiming(0, { duration: 1200, easing: Easing.inOut(Easing.sin) });
      return;
    }
    const ms = ph.dur * 1000;
    if (ph.k === 'in' || ph.k === 'in1') {
      far.value = scatter();
      out.value = 0;
      p.value = 0;
      p.value = withTiming(ph.k === 'in1' ? IN1 : 1, { duration: ms, easing: Easing.linear });
    } else if (ph.k === 'in2') {
      out.value = 0;
      p.value = withTiming(1, { duration: ms, easing: Easing.out(Easing.quad) });
    } else if (ph.k === 'out') {
      home.value = cluster();
      out.value = 1;
      p.value = withTiming(0, { duration: ms, easing: Easing.inOut(Easing.sin) });
    } else if (p.value > 0.5) {
      /* a hold at the top: the ring turns a little */
      rot.value = withTiming(rot.value + 0.05 * ph.dur, { duration: ms, easing: Easing.inOut(Easing.sin) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, !!ph]);
  const R = size / 2 - 8;
  const C = 2 * Math.PI * R;
  const words = ph ? PH_TXT[ph.k] : label || '';
  /* the radius of the ring the dots make at the top of a breath */
  const rr = size * 0.37;
  /* on a light sky the palest gold fades, so it is a deeper gold there */
  const cols = [c.sun, c.sun2, c.scheme === 'dark' ? '#FFE79A' : '#F5B02E'];
  const glow = useAnimatedStyle(() => {
    const v = still ? (pattern ? 0.5 + 0.5 * p.value : 0.6) : p.value;
    return { opacity: 0.4 + 0.5 * v, transform: [{ scale: 0.75 + 0.4 * v }] };
  }, [still, pattern]);
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
        <View style={[s.guide, { width: rr * 2, height: rr * 2, borderRadius: rr, borderColor: ink || c.ink }]} />
        {ring != null ? (
          <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
            <Circle cx={size / 2} cy={size / 2} r={R} stroke={ink || c.ink} strokeOpacity={0.14} strokeWidth={6} fill="none" />
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={R}
              stroke={c.sun}
              strokeWidth={6}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${C}`}
              strokeDashoffset={C * (1 - Math.max(0, Math.min(1, ring)))}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          </Svg>
        ) : null}
        {LOOK.map((l, i) => (
          <Dot
            key={i}
            i={i}
            size={size}
            rr={rr}
            color={cols[l.col]}
            p={p}
            out={out}
            rot={rot}
            clock={clock}
            home={home}
            far={far}
            still={still}
            breathing={!!pattern}
          />
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

const ease = (x: number) => {
  'worklet';
  return x * x * (3 - 2 * x);
};

/** one dot of the particle breath */
function Dot({
  i,
  size,
  rr,
  color,
  p,
  out,
  rot,
  clock,
  home,
  far,
  still,
  breathing,
}: {
  i: number;
  size: number;
  rr: number;
  color: string;
  p: SharedValue<number>;
  out: SharedValue<number>;
  rot: SharedValue<number>;
  clock: SharedValue<number>;
  home: SharedValue<number[]>;
  far: SharedValue<number[]>;
  still: boolean;
  breathing: boolean;
}) {
  const l = LOOK[i];
  const d = Math.max(4, size * l.d);
  const st = useAnimatedStyle(() => {
    const twinkle = Math.sin((clock.value * l.tw + l.seed) * TAU);
    const a = (i / DOTS) * TAU - Math.PI / 2 + rot.value;
    if (still) {
      /* Reduce Motion: a still ring that softly brightens on a breath in and dims on a breath out */
      const v = breathing ? p.value : 0.4;
      return { opacity: 0.35 + 0.65 * v, transform: [{ translateX: rr * Math.cos(a) }, { translateY: rr * Math.sin(a) }, { scale: 0.75 + 0.25 * v }] };
    }
    const v = p.value;
    const hx = home.value[i * 2] * rr;
    const hy = home.value[i * 2 + 1] * rr;
    let x: number;
    let y: number;
    if (out.value > 0.5) {
      /* breathing out: straight back to the cluster, curling a little on the way */
      const b = a + (1 - v) * 0.7;
      const tx = rr * Math.cos(b);
      const ty = rr * Math.sin(b);
      x = hx + (tx - hx) * v;
      y = hy + (ty - hy) * v;
    } else {
      /* breathing in: a burst out to the scatter, then a glide into the ring */
      const q1 = Math.min(1, v / BURST);
      const e1 = 1 - Math.pow(1 - q1, 3);
      const e2 = ease(Math.max(0, (v - BURST) / (1 - BURST)));
      const sx = hx + (far.value[i * 2] * rr - hx) * e1;
      const sy = hy + (far.value[i * 2 + 1] * rr - hy) * e1;
      x = sx + (rr * Math.cos(a) - sx) * e2;
      y = sy + (rr * Math.sin(a) - sy) * e2;
    }
    /* at rest the cluster breathes very slightly, so it never looks frozen */
    const drift = 1 + 0.04 * (1 - v) * Math.sin((clock.value + l.seed) * TAU);
    return {
      opacity: (0.72 + 0.28 * v) * (0.85 + 0.15 * twinkle),
      transform: [{ translateX: x * drift }, { translateY: y * drift }, { scale: (0.62 + 0.38 * v) * (1 + 0.08 * twinkle * v) }],
    };
  }, [still, breathing, rr]);
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
          backgroundColor: color,
          boxShadow: `0 0 ${Math.round(d * 0.7)}px ${color}`,
        },
        st,
      ]}
    />
  );
}

/* how far up the SOS sun is for each step of a breath: 1 is fully risen, 0 is low on the horizon */
const riseOf = (k: string) => (k === 'in' || k === 'in2' ? 1 : k === 'in1' ? 0.7 : 0);
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
  const rise = useRef(new Animated.Value(0)).current;
  const reduced = useRef(false);
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then((r) => {
        reduced.current = r;
        if (r) rise.setValue(0.5);
      })
      .catch(() => undefined);
  }, [rise]);
  useEffect(() => {
    if (reduced.current || ph.k === 'hold') return;
    Animated.timing(rise, { toValue: riseOf(ph.k), duration: ph.dur * 1000, easing: RNEasing.inOut(RNEasing.sin), useNativeDriver: NATIVE }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ph.idx]);
  /* the biggest sun that fits under the words, leaving room for the line above it */
  const d = box ? Math.max(0, Math.min(box.w * 0.8, 330, (box.h + EDGE - ROW - GAP) / HI)) : 0;
  const sun = d >= 72;
  const H = box ? box.h + UNDER : 0;
  const W = box ? box.w + SIDE * 2 : 0;
  /* the glow around the sun, as wide as it can be without being cut off at the top of its room */
  const glow = box ? Math.min(d * 1.9, 2 * (box.h + EDGE - HI * d + d / 2) + 24) : 0;
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
          <Animated.View
            style={{
              position: 'absolute',
              left: (W - glow) / 2,
              top: box.h + EDGE - HI * d - (glow - d) / 2,
              width: glow,
              height: glow,
              alignItems: 'center',
              justifyContent: 'center',
              transform: [{ translateY: rise.interpolate({ inputRange: [0, 1], outputRange: [(HI - LO) * d, 0] }) }],
            }}>
            <Animated.View style={[StyleSheet.absoluteFill, { opacity: rise.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }) }]}>
              <Svg width={glow} height={glow}>
                <Defs>
                  <RadialGradient id="hzGlow" cx="50%" cy="50%" r="50%">
                    <Stop offset="0.5" stopColor="#FFC43C" stopOpacity={0.42} />
                    <Stop offset="1" stopColor="#FFC43C" stopOpacity={0} />
                  </RadialGradient>
                </Defs>
                <Circle cx={glow / 2} cy={glow / 2} r={glow / 2} fill="url(#hzGlow)" />
              </Svg>
            </Animated.View>
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
          </Animated.View>
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
  guide: { position: 'absolute', borderWidth: 1.5, borderStyle: 'dashed', opacity: 0.18 },
  time: { fontFamily: font.bodySemi, fontSize: 16, opacity: 0.8, fontVariant: ['tabular-nums'] },
});
