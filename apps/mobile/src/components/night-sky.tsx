/* The night sky of Good night and the wind-down: a moon with a soft breathing glow, and stars that twinkle slowly. */
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui';
import { NATIVE, useReducedMotion } from '@/lib/motion';

/* a few stars, placed by hand so the sky looks the same every night: [left %, top px, size, how long one twinkle takes] */
const STARS: [number, number, number, number][] = [
  [6, 18, 3, 3400],
  [16, 92, 2, 4200],
  [24, 34, 4, 3800],
  [33, 128, 2, 3000],
  [12, 150, 3, 4600],
  [70, 22, 3, 3600],
  [79, 104, 2, 4400],
  [88, 46, 4, 3200],
  [94, 138, 2, 4000],
  [62, 150, 3, 3900],
  [44, 8, 2, 4800],
  [56, 0, 3, 3300],
];

/* the moon with a soft breathing glow, and stars that twinkle slowly. With Reduce Motion on, the sky is still. */
export function NightSky() {
  const reduce = useReducedMotion();
  const glow = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduce) return;
    const a = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 3200, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
        Animated.timing(glow, { toValue: 0, duration: 3200, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
      ]),
    );
    a.start();
    return () => a.stop();
  }, [reduce, glow]);
  return (
    <View style={s.sky} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {STARS.map(([x, y, r, ms], i) => (
        <Star key={i} x={x} y={y} r={r} ms={ms} delay={i * 370} still={reduce} />
      ))}
      <Animated.View
        style={[
          s.halo,
          {
            opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.6] }),
            transform: [{ scale: glow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) }],
          },
        ]}
      />
      <View style={s.moon}>
        <Icon name="moon" size={60} color="#FFE27A" />
      </View>
    </View>
  );
}
function Star({ x, y, r, ms, delay, still }: { x: number; y: number; r: number; ms: number; delay: number; still: boolean }) {
  const v = useRef(new Animated.Value(still ? 0.8 : 0.3)).current;
  useEffect(() => {
    if (still) return v.setValue(0.8);
    const a = Animated.loop(
      Animated.sequence([
        Animated.delay(delay % 1600),
        Animated.timing(v, { toValue: 1, duration: ms / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
        Animated.timing(v, { toValue: 0.3, duration: ms / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
      ]),
    );
    a.start();
    return () => a.stop();
  }, [still, v, ms, delay]);
  return <Animated.View style={[s.star, { left: `${x}%`, top: y, width: r, height: r, borderRadius: r / 2, opacity: v }]} />;
}

const s = StyleSheet.create({
  sky: { alignSelf: 'stretch', height: 170, alignItems: 'center', justifyContent: 'center' },
  star: { position: 'absolute', backgroundColor: '#FFF6D8' },
  halo: { position: 'absolute', width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255,226,122,0.16)' },
  moon: { width: 112, height: 112, borderRadius: 56, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.10)' },
});
