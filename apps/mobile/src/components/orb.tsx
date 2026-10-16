/* The breathing sun: it grows while you breathe in and shrinks while you breathe out, with the words for each step and the time
   left. Orb is used by Breathe and the 10-minute pause (as a guide); HorizonSun is the first SOS minute. */
import { breathPhase, PH_TXT } from '@daybook/core';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

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
  return (
    <View style={{ alignItems: 'center', gap: 10 }}>
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        {ring != null ? (
          <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
            <Circle cx={size / 2} cy={size / 2} r={R} stroke={c.line} strokeWidth={6} fill="none" />
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
        <Animated.View
          style={[
            s.orb,
            { width: size * 0.78, height: size * 0.78, borderRadius: size * 0.39, transform: [{ scale }], backgroundColor: '#FFD25A', shadowColor: '#FFB43A' },
          ]}
        />
      </View>
      <View style={{ alignItems: 'center' }} accessibilityLiveRegion="polite">
        <Text style={[s.phase, { color: ink || c.ink }]}>{words}</Text>
        <Text style={[s.time, { color: ink || c.ink }]} accessibilityElementsHidden importantForAccessibility="no">
          {time}
        </Text>
      </View>
    </View>
  );
}

/* the scale for each step of a breath (legacy orbTo) */
const scaleOf = (k: string) => (k === 'in' || k === 'in2' ? 1 : k === 'in1' ? 0.84 : 0.58);

/** the first SOS minute: a sun on the horizon that rises while you breathe in and sets while you breathe out, with the words for
    each step and the time left. After the minute it keeps going. It ticks only while on (when the screen is in front). */
export function HorizonSun({ size, on }: { size: number; on: boolean }) {
  const c = useTheme();
  const [r0] = useState(() => Date.now());
  const sec = useSeconds(r0, on);
  const left = Math.max(0, 60 - sec);
  const ph = breathPhase('calm', sec);
  const scale = useRef(new Animated.Value(0.58)).current;
  const reduced = useRef(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then((r) => (reduced.current = r))
      .catch(() => undefined);
  }, []);
  useEffect(() => {
    if (reduced.current || ph.k === 'hold') return;
    Animated.timing(scale, { toValue: scaleOf(ph.k), duration: ph.dur * 1000, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ph.idx]);
  const pad = 44;
  const w = size + pad * 2;
  const h = size / 2 + pad;
  return (
    <View style={{ alignItems: 'center', gap: 10 }}>
      <View style={s.ph} accessibilityLiveRegion="polite">
        <Text style={[s.phase, { color: c.ink }]}>{PH_TXT[ph.k]}</Text>
        <Text style={[s.pill, { color: c.ink, backgroundColor: c.scBtn }]} accessibilityElementsHidden importantForAccessibility="no">
          {left > 0 ? fmtMS(left * 1000) : 'Keep going'}
        </Text>
      </View>
      <View style={{ width: w, height: h, overflow: 'hidden' }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Svg width={w} height={h} style={StyleSheet.absoluteFill}>
          <Defs>
            <RadialGradient id="hz" cx="50%" cy="100%" rx="50%" ry="70%">
              <Stop offset="0" stopColor="#FFC43C" stopOpacity={0.32} />
              <Stop offset="0.72" stopColor="#FFC43C" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect x={0} y={0} width={w} height={h} fill="url(#hz)" />
        </Svg>
        <Animated.View
          style={[
            s.orb,
            {
              position: 'absolute',
              left: pad,
              bottom: -size / 2,
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: '#FFD25A',
              shadowColor: '#FFB43A',
              transform: [{ scale }],
            },
          ]}
        />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  ph: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 32 },
  pill: { minWidth: 52, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, overflow: 'hidden', fontFamily: font.bodyBold, fontSize: 14, textAlign: 'center', fontVariant: ['tabular-nums'] },
  orb: { shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.7, shadowRadius: 30, elevation: 6 },
  phase: { fontFamily: font.display, fontSize: 24 },
  time: { fontFamily: font.bodySemi, fontSize: 16, opacity: 0.8, fontVariant: ['tabular-nums'] },
});
