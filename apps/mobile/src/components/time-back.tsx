/* The time given back, on Today, under who you are becoming (the owner, November 13, 2026: "how much time they've gotten back in
   their life ... but we should obviously make it look good"). A sun coming up over the line, and the hours beside it, big: the
   picture of a life coming back. The sun rises once a day, the first time Today shows it; at rest it is a plain shape. When it shows
   and how it is said is core time-back.ts (it waits for a few hours, and through the day of a slip and the day after). */
import type { TimeBack } from '@daybook/core';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';

import { Text } from '@/components/text';
import { NATIVE, useReducedMotion } from '@/lib/motion';
import { font, useTheme } from '@/lib/theme';

const W = 96;
const H = 60;
/* the line the sun comes up over, and the sun's middle sitting a little under it */
const LINE = 48;
const R = 22;
const RAYS = [-70, -35, 0, 35, 70];
/* the day the sun last rose on Today in this run of the app: once a day, not every time Today opens */
let roseOn = '';

export function TimeBackRow({ t, tk }: { t: TimeBack; tk: string }) {
  const c = useTheme();
  const reduce = useReducedMotion();
  const first = useRef(roseOn !== tk && !reduce).current;
  const up = useRef(new Animated.Value(first ? 0 : 1)).current;
  const rays = useRef(new Animated.Value(first ? 0 : 1)).current;
  useEffect(() => {
    if (!first) return;
    roseOn = tk;
    const a = Animated.sequence([
      Animated.delay(250),
      Animated.timing(up, { toValue: 1, duration: 1100, easing: Easing.out(Easing.cubic), useNativeDriver: NATIVE }),
      Animated.timing(rays, { toValue: 1, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: NATIVE }),
    ]);
    a.start();
    return () => a.stop();
  }, [first, tk, up, rays]);
  const rise = up.interpolate({ inputRange: [0, 1], outputRange: [R + 6, 0] });
  const rayScale = rays.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });
  return (
    <View style={s.row} accessible accessibilityLabel={t.say}>
      <View style={s.art}>
        {/* the sun, cut off at the line: it slides up from under it */}
        <View style={s.clip}>
          <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateY: rise }] }]}>
            <Animated.View style={[StyleSheet.absoluteFill, { opacity: rays, transform: [{ scale: rayScale }] }]}>
              <Svg width={W} height={H}>
                {RAYS.map((d) => {
                  const a = ((d - 90) * Math.PI) / 180;
                  const x = W / 2 + Math.cos(a) * (R + 7);
                  const y = LINE + Math.sin(a) * (R + 7);
                  const x2 = W / 2 + Math.cos(a) * (R + 14);
                  const y2 = LINE + Math.sin(a) * (R + 14);
                  return <Line key={d} x1={x} y1={y} x2={x2} y2={y2} stroke={c.sun} strokeWidth={4} strokeLinecap="round" />;
                })}
              </Svg>
            </Animated.View>
            <Svg width={W} height={H} style={StyleSheet.absoluteFill}>
              <Defs>
                <LinearGradient id="tbSun" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={c.sun} />
                  <Stop offset="1" stopColor={c.sun2} />
                </LinearGradient>
              </Defs>
              <Circle cx={W / 2} cy={LINE} r={R} fill="url(#tbSun)" />
            </Svg>
          </Animated.View>
        </View>
        {/* the line it comes up over: the hills, drawn as one soft rise */}
        <Svg width={W} height={H} style={StyleSheet.absoluteFill} pointerEvents="none">
          <Path d={`M2 ${LINE} Q${W / 2} ${LINE - 6} ${W - 2} ${LINE}`} stroke={c.sun2} strokeWidth={4} strokeLinecap="round" fill="none" />
        </Svg>
      </View>
      <View style={s.words}>
        <Text style={[s.big, { color: c.sunText }]}>
          {t.n}
          <Text style={[s.unit, { color: c.sunText }]}> {t.unit}</Text>
        </Text>
        <Text style={[s.what, { color: c.ink }]}>given back to your life so far</Text>
        <Text style={[s.pace, { color: c.muted }]}>At the pace you told the setup.</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  art: { width: W, height: H },
  /* the sun shows only above the line (the line itself is drawn over the cut) */
  clip: { position: 'absolute', left: 0, top: 0, width: W, height: LINE, overflow: 'hidden' },
  words: { flex: 1, gap: 2 },
  big: { fontFamily: font.display, fontSize: 38, lineHeight: 44 },
  unit: { fontFamily: font.display, fontSize: 22 },
  what: { fontFamily: font.bodySemi, fontSize: 17, lineHeight: 22 },
  pace: { fontFamily: font.body, fontSize: 13, lineHeight: 18, marginTop: 2 },
});
