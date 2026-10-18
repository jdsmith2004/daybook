/* Graduation in pictures: a graduation cap, the flame wearing it from the day it was earned (the graduate mark), and
   fireworks for the celebration. */
import { gradOf } from '@daybook/core';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Path, Polygon, Rect } from 'react-native-svg';

import { Flame } from '@/components/flame';
import { NATIVE } from '@/lib/motion';
import { useStore } from '@/lib/store';
import { useTheme } from '@/lib/theme';

/** a graduation cap with a gold tassel */
export function GradCap({ size = 40 }: { size?: number }) {
  const c = useTheme();
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" accessibilityLabel="A graduation cap">
      <Rect x={18} y={28} width={28} height={14} rx={4} fill="#2A2350" />
      <Polygon points="32,10 62,24 32,38 2,24" fill="#3B3270" stroke="#2A2350" strokeWidth={2} strokeLinejoin="round" />
      <Path d="M32 24 L50 30 L50 44" stroke={c.sun} strokeWidth={3} fill="none" strokeLinecap="round" />
      <Rect x={47} y={43} width={6} height={9} rx={2} fill={c.sun} />
    </Svg>
  );
}

/** the flame, with the graduate mark once graduation was earned (kept for good, at every level) */
export function GradFlame({ level, size, label, alive = true, soft }: { level: number; size: number; label?: string; alive?: boolean; soft?: boolean }) {
  const { snap } = useStore();
  const on = !!gradOf(snap.settings);
  return (
    <View style={{ width: size, height: size }}>
      <Flame level={level} size={size} alive={alive} soft={soft} label={on ? (label ?? `Your flame, level ${level}`) + ', wearing a graduation cap' : label} />
      {on ? (
        <View pointerEvents="none" style={{ position: 'absolute', right: -size * 0.04, top: -size * 0.06, transform: [{ rotate: '14deg' }] }}>
          <GradCap size={size * 0.42} />
        </View>
      ) : null}
    </View>
  );
}

/** fireworks: a few bursts, one after another, that bloom and fade. Skipped with Reduce Motion on. */
export function Fireworks({ bursts = 5 }: { bursts?: number }) {
  const { width: W, height: H } = useWindowDimensions();
  const [on, setOn] = useState(true);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then((r) => r && setOn(false))
      .catch(() => undefined);
  }, []);
  const spots = useMemo(
    () =>
      Array.from({ length: bursts }, (_, i) => ({
        x: W * (0.2 + 0.6 * ((i * 0.37 + 0.13) % 1)),
        y: H * (0.12 + 0.3 * ((i * 0.61 + 0.2) % 1)),
        delay: i * 520,
      })),
    [bursts, W, H],
  );
  if (!on) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {spots.map((p, i) => (
        <Burst key={i} x={p.x} y={p.y} delay={p.delay} k={i} />
      ))}
    </View>
  );
}

function Burst({ x, y, delay, k }: { x: number; y: number; delay: number; k: number }) {
  const c = useTheme();
  const t = useRef(new Animated.Value(0)).current;
  const cols = [c.sun, c.coral, c.mint, c.violet, c.accent, c.sun2];
  const col = cols[k % cols.length];
  const N = 14;
  useEffect(() => {
    Animated.timing(t, { toValue: 1, duration: 1300, delay, easing: Easing.out(Easing.quad), useNativeDriver: NATIVE }).start();
  }, [t, delay]);
  return (
    <>
      {Array.from({ length: N }, (_, i) => {
        const a = (i / N) * Math.PI * 2;
        const r = 70 + (i % 3) * 14;
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              left: x - 3,
              top: y - 3,
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: i % 2 ? col : c.sun,
              opacity: t.interpolate({ inputRange: [0, 0.1, 0.7, 1], outputRange: [0, 1, 0.9, 0] }),
              transform: [
                { translateX: t.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(a) * r] }) },
                { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(a) * r + 24] }) },
              ],
            }}
          />
        );
      })}
    </>
  );
}
