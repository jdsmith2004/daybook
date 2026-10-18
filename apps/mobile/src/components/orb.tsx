/* The breathing sun: it grows while you breathe in and shrinks while you breathe out, with the words for each step and the time
   left. Orb is used by Breathe and the 10-minute pause (as a guide); HorizonSun is the first SOS screen. */
import { breathPhase, PH_TXT } from '@daybook/core';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { buzz } from '@/lib/feel';
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
  const scale = useRef(new Animated.Value(0.58)).current;
  const ph = pattern ? breathPhase(pattern, sec) : null;
  const idx = ph ? ph.idx : -1;
  const reduced = useRef(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then((r) => (reduced.current = r))
      .catch(() => undefined);
  }, []);
  useEffect(() => {
    if (!ph || reduced.current || ph.k === 'hold') return;
    const to = ph.k === 'in' || ph.k === 'in2' ? 1 : ph.k === 'in1' ? 0.84 : 0.58;
    Animated.timing(scale, { toValue: to, duration: ph.dur * 1000, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);
  const R = size / 2 - 8;
  const C = 2 * Math.PI * R;
  const words = ph ? PH_TXT[ph.k] : label || '';
  const core = size * 0.78;
  return (
    <View style={{ alignItems: 'center', gap: 14 }}>
      <View
        style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants">
        {/* a warm glow that breathes with the sun, reaching past it */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              opacity: scale.interpolate({ inputRange: [0.58, 1], outputRange: [0.45, 0.9] }),
              transform: [{ scale: scale.interpolate({ inputRange: [0.58, 1], outputRange: [0.8, 1.18] }) }],
            },
          ]}>
          <Svg width={size} height={size}>
            <Defs>
              <RadialGradient id="orbGlow" cx="50%" cy="50%" r="50%">
                <Stop offset="0.45" stopColor="#FFC43C" stopOpacity={0.38} />
                <Stop offset="1" stopColor="#FFC43C" stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Circle cx={size / 2} cy={size / 2} r={size / 2} fill="url(#orbGlow)" />
          </Svg>
        </Animated.View>
        {/* how full a breath in goes: a faint ring at the sun's largest size */}
        <View style={[s.guide, { width: core, height: core, borderRadius: core / 2, borderColor: ink || c.ink }]} />
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
        {/* the sun itself: light at its heart, deeper gold at its edge */}
        <Animated.View style={[s.orb, { width: core, height: core, borderRadius: core / 2, transform: [{ scale }], shadowColor: '#FFB43A' }]}>
          <Svg width={core} height={core}>
            <Defs>
              <RadialGradient id="orbCore" cx="42%" cy="38%" r="65%">
                <Stop offset="0" stopColor="#FFF6CF" />
                <Stop offset="0.45" stopColor="#FFDA6B" />
                <Stop offset="1" stopColor="#FFB23E" />
              </RadialGradient>
            </Defs>
            <Circle cx={core / 2} cy={core / 2} r={core / 2} fill="url(#orbCore)" />
          </Svg>
        </Animated.View>
      </View>
      <View style={{ alignItems: 'center', gap: 6 }} accessibilityLiveRegion="polite">
        <Text style={[s.phase, { color: ink || c.ink }]}>{words}</Text>
        <Text style={[s.pill, { color: ink || c.ink, backgroundColor: c.scBtn }]} accessibilityElementsHidden importantForAccessibility="no">
          {time}
        </Text>
      </View>
    </View>
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
    Animated.timing(rise, { toValue: riseOf(ph.k), duration: ph.dur * 1000, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }).start();
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
        <Text style={[s.phase, { color: c.ink }]}>{PH_TXT[ph.k]}</Text>
        <Text style={[s.pill, { color: c.ink, backgroundColor: c.scBtn }]} accessibilityElementsHidden importantForAccessibility="no">
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
  orb: { shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.7, shadowRadius: 30, elevation: 6 },
  phase: { fontFamily: font.display, fontSize: 30 },
  guide: { position: 'absolute', borderWidth: 1.5, borderStyle: 'dashed', opacity: 0.18 },
  time: { fontFamily: font.bodySemi, fontSize: 16, opacity: 0.8, fontVariant: ['tabular-nums'] },
});
