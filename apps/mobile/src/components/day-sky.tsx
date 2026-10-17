/* The day's sky, for Map your day: the sun's path across the day from 5 AM to 2 AM, colored from dawn through the
   afternoon and sunset into night, with where "now" is on it (a sun, or a moon after dark). A hard hour is a storm cloud
   on the path. It glides as the hour is picked, floats gently, wears a golden ring once it has a plan, and breaks into a
   star when the plan held. Clear skies make the sun glow. Motion stops when the person asks for less. */
import { MAP_FIRST, MAP_LAST } from '@daybook/core';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Polygon, RadialGradient, Rect, Stop } from 'react-native-svg';

import { NATIVE, useReducedMotion } from '@/lib/motion';
import { font, useTheme } from '@/lib/theme';

const SPAN = MAP_LAST - MAP_FIRST;
/* the sky from left (5 AM) to right (2 AM) */
const LIGHT = [
  [0, '#FFD7B5'],
  [0.12, '#CDEBFF'],
  [0.45, '#A9D8FF'],
  [0.66, '#FFC3A1'],
  [0.74, '#F49AA8'],
  [0.82, '#8D73DA'],
  [1, '#2D2A70'],
] as const;
const DARK = [
  [0, '#5B4060'],
  [0.12, '#2E4D7C'],
  [0.45, '#2B4B80'],
  [0.66, '#7A4561'],
  [0.74, '#6A3B6E'],
  [0.82, '#3A2D7C'],
  [1, '#13123A'],
] as const;
/* a few stars in the night end of the sky: [x as a share of the width, y as a share of the height, size] */
const STARS: [number, number, number][] = [
  [0.86, 0.16, 1.6],
  [0.92, 0.3, 1.1],
  [0.97, 0.12, 1.4],
  [0.89, 0.44, 1],
  [0.95, 0.52, 1.3],
  [0.83, 0.34, 0.9],
];
const LABELS: [number, string][] = [
  [6 * 60, '6 AM'],
  [12 * 60, 'Noon'],
  [18 * 60, '6 PM'],
  [24 * 60, 'Midnight'],
];

/** where a minute of the day sits on the path, as a share (0 at 5 AM, 1 at 2 AM) */
const shareOf = (min: number) => Math.max(0, Math.min(1, (min - MAP_FIRST) / SPAN));

export function DaySky({
  height = 210,
  now,
  storm,
  planned,
  held,
  clear,
  labels = true,
}: {
  height?: number;
  /** minutes after the day's midnight, for the sun (or the moon) */
  now: number | null;
  /** the hard hour, in minutes after the day's midnight; null for none */
  storm: number | null;
  /** the storm has a plan: a golden ring */
  planned?: boolean;
  /** the plan held: the storm breaks into a star */
  held?: boolean;
  /** clear skies: the sun glows */
  clear?: boolean;
  labels?: boolean;
}) {
  const c = useTheme();
  const reduce = useReducedMotion();
  const [w, setW] = useState(0);
  const pad = 26;
  const base = height - (labels ? 34 : 18);
  const top = Math.max(34, height * 0.22);
  const at = (u: number) => ({ x: pad + u * (w - pad * 2), y: base - (base - top) * Math.sin(Math.PI * u) });

  /* the cloud's place on the path (springs to each new hour), its float, its ring, and its turn into a star */
  const u = useRef(new Animated.Value(storm == null ? 0.6 : shareOf(storm))).current;
  const bob = useRef(new Animated.Value(0)).current;
  const ring = useRef(new Animated.Value(planned ? 1 : 0)).current;
  const burst = useRef(new Animated.Value(held ? 1 : 0)).current;
  const glow = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (storm == null) return;
    if (reduce) u.setValue(shareOf(storm));
    else Animated.spring(u, { toValue: shareOf(storm), friction: 8, tension: 70, useNativeDriver: NATIVE }).start();
  }, [storm, reduce, u]);
  useEffect(() => {
    if (reduce) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
        Animated.timing(bob, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
      ]),
    );
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
        Animated.timing(glow, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
      ]),
    );
    loop.start();
    pulse.start();
    return () => {
      loop.stop();
      pulse.stop();
    };
  }, [reduce, bob, glow]);
  useEffect(() => {
    if (reduce) ring.setValue(planned ? 1 : 0);
    else Animated.spring(ring, { toValue: planned ? 1 : 0, friction: 5, tension: 120, useNativeDriver: NATIVE }).start();
  }, [planned, reduce, ring]);
  useEffect(() => {
    if (reduce) burst.setValue(held ? 1 : 0);
    else Animated.timing(burst, { toValue: held ? 1 : 0, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: NATIVE }).start();
  }, [held, reduce, burst]);

  const stops = c.scheme === 'dark' ? DARK : LIGHT;
  const arc = w ? Array.from({ length: 41 }, (_, i) => at(i / 40)) : [];
  const d = arc.map((p, i) => (i ? 'L' : 'M') + p.x.toFixed(1) + ' ' + p.y.toFixed(1)).join(' ');
  const sun = now == null ? null : at(shareOf(now));
  const night = now != null && (now >= 20 * 60 || now < 6 * 60);
  /* the cloud moves along the path: x straight across, y along the curve (many points, so the native driver can do it) */
  const N = 16;
  const pts = Array.from({ length: N + 1 }, (_, i) => i / N);
  const CW = 74;
  const CH = 50;
  const tx = u.interpolate({ inputRange: [0, 1], outputRange: [pad - CW / 2, w - pad - CW / 2] });
  const ty = u.interpolate({ inputRange: pts, outputRange: pts.map((p) => at(p).y - CH / 2 - 2) });
  const lift = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -4] });
  return (
    <View
      style={[s.wrap, { height }]}
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      {w ? (
        <Svg width={w} height={height} style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id="dsSky" x1="0" y1="0" x2="1" y2="0">
              {stops.map(([o, col]) => (
                <Stop key={o} offset={o} stopColor={col} />
              ))}
            </LinearGradient>
            <LinearGradient id="dsFade" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0} />
              <Stop offset="1" stopColor={c.scheme === 'dark' ? '#000000' : '#FFFFFF'} stopOpacity={c.scheme === 'dark' ? 0.25 : 0.35} />
            </LinearGradient>
            <RadialGradient id="dsSun" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor="#FFF4C4" />
              <Stop offset="0.6" stopColor="#FFD45E" />
              <Stop offset="1" stopColor="#FFB23E" />
            </RadialGradient>
          </Defs>
          <Rect x={0} y={0} width={w} height={height} rx={24} fill="url(#dsSky)" />
          <Rect x={0} y={0} width={w} height={height} rx={24} fill="url(#dsFade)" />
          {STARS.map(([x, y, r], i) => (
            <Circle key={i} cx={x * w} cy={y * base} r={r} fill="#FFFFFF" opacity={0.85} />
          ))}
          {/* the sun's path, and the ground under it */}
          <Path d={d} stroke="#FFFFFF" strokeOpacity={0.7} strokeWidth={2} strokeDasharray="2 7" strokeLinecap="round" fill="none" />
          <Path
            d={`M0 ${base} Q ${w * 0.25} ${base - 10} ${w * 0.5} ${base} T ${w} ${base} L ${w} ${height} L 0 ${height} Z`}
            fill={c.scheme === 'dark' ? '#0E0B2E' : '#FFFFFF'}
            fillOpacity={c.scheme === 'dark' ? 0.45 : 0.55}
          />
          {labels
            ? LABELS.map(([m]) => {
                const p = at(shareOf(m));
                return <Circle key={m} cx={p.x} cy={base} r={2.5} fill={c.scheme === 'dark' ? '#FFFFFF' : '#2D2A70'} opacity={0.5} />;
              })
            : null}
          {sun && !clear ? (
            night ? (
              <>
                <Circle cx={sun.x} cy={sun.y} r={15} fill="#F3F0FF" opacity={0.25} />
                <Circle cx={sun.x} cy={sun.y} r={9} fill="#F3F0FF" />
              </>
            ) : (
              <>
                <Circle cx={sun.x} cy={sun.y} r={17} fill="#FFD45E" opacity={0.3} />
                <Circle cx={sun.x} cy={sun.y} r={11} fill="url(#dsSun)" />
              </>
            )
          ) : null}
        </Svg>
      ) : null}
      {/* clear skies: the sun, bigger and glowing */}
      {w && sun && clear ? (
        <Animated.View
          style={[
            s.clearSun,
            {
              left: sun.x - 46,
              top: sun.y - 46,
              transform: [{ scale: glow.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1.08] }) }],
            },
          ]}>
          <Svg width={92} height={92}>
            <Defs>
              <RadialGradient id="dsGlow" cx="50%" cy="50%" r="50%">
                <Stop offset="0.35" stopColor="#FFD45E" stopOpacity={0.55} />
                <Stop offset="1" stopColor="#FFD45E" stopOpacity={0} />
              </RadialGradient>
              <RadialGradient id="dsSun2" cx="42%" cy="38%" r="60%">
                <Stop offset="0" stopColor="#FFF6CF" />
                <Stop offset="0.5" stopColor="#FFDA6B" />
                <Stop offset="1" stopColor="#FFB23E" />
              </RadialGradient>
            </Defs>
            <Circle cx={46} cy={46} r={46} fill="url(#dsGlow)" />
            <Circle cx={46} cy={46} r={20} fill="url(#dsSun2)" />
          </Svg>
        </Animated.View>
      ) : null}
      {/* the storm */}
      {w && storm != null ? (
        <Animated.View style={[s.cloud, { width: CW, height: CH, transform: [{ translateX: tx }, { translateY: ty }] }]}>
          <Animated.View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
              opacity: burst.interpolate({ inputRange: [0, 0.6, 1], outputRange: [1, 0.2, 0] }),
              transform: [{ translateY: lift }, { scale: burst.interpolate({ inputRange: [0, 1], outputRange: [1, 0.6] }) }],
            }}>
            <Animated.View
              style={[
                s.ring,
                {
                  borderColor: c.sun,
                  opacity: ring,
                  transform: [{ scale: ring.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }],
                },
              ]}
            />
            <Svg width={CW} height={CH}>
              <Path d="M20 34 Q8 34 8 25 Q8 16 18 16 Q21 6 33 7 Q43 2 50 12 Q63 11 64 23 Q70 34 56 34 Z" fill={c.scheme === 'dark' ? '#8A86C2' : '#77739F'} />
              <Path d="M18 18 Q21 9 33 10 Q43 5 49 14" stroke="#FFFFFF" strokeOpacity={0.45} strokeWidth={2.5} strokeLinecap="round" fill="none" />
              <Path d="M24 39 l-3 7 M36 39 l-3 7 M48 39 l-3 7" stroke={c.scheme === 'dark' ? '#B9B5F0' : '#5D72C9'} strokeWidth={2.5} strokeLinecap="round" />
            </Svg>
          </Animated.View>
          {/* held: a star where the storm was */}
          <Animated.View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: burst.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 1, 1] }),
              transform: [
                { scale: burst.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.2, 1.25, 1] }) },
                { rotate: burst.interpolate({ inputRange: [0, 1], outputRange: ['-40deg', '0deg'] }) },
              ],
            }}>
            <Svg width={46} height={46}>
              <Circle cx={23} cy={23} r={22} fill="#FFD45E" opacity={0.25} />
              <Polygon
                points="23,5 28,17 41,17 31,25 35,38 23,30 11,38 15,25 5,17 18,17"
                fill="#FFCB3D"
                stroke="#FFF2B8"
                strokeWidth={1.5}
                strokeLinejoin="round"
              />
            </Svg>
          </Animated.View>
        </Animated.View>
      ) : null}
      {labels && w ? (
        <View style={[s.labels, { top: base + 6 }]} pointerEvents="none">
          {LABELS.map(([m, t]) => (
            <Text key={m} style={[s.label, { left: at(shareOf(m)).x - 30, color: c.scheme === 'dark' ? '#E8E4FF' : '#2D2A70' }]}>
              {t}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { alignSelf: 'stretch', borderRadius: 24, overflow: 'hidden' },
  cloud: { position: 'absolute', left: 0, top: 0 },
  ring: { position: 'absolute', left: 2, top: -6, width: 70, height: 58, borderRadius: 32, borderWidth: 3, backgroundColor: 'rgba(255,212,94,0.28)' },
  clearSun: { position: 'absolute', width: 92, height: 92 },
  labels: { position: 'absolute', left: 0, right: 0, height: 20 },
  label: { position: 'absolute', width: 60, textAlign: 'center', fontFamily: font.bodySemi, fontSize: 11.5, opacity: 0.8 },
});
