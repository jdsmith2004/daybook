/* Good night: after "Phone away". The last thing seen before the hardest hour, so it carries the plan for a loud night (the one
   picked in SOS "Go to bed", or slow breathing) and, when today's check-in is still open, one tap to do it first.
   Ported from the legacy SCENES.night. */
import { bedPlans, fmtClock, rhythm } from '@daybook/core';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { SceneFrame } from '@/components/scene';
import { Button, Icon, T } from '@/components/ui';
import { NATIVE, useReducedMotion } from '@/lib/motion';
import { close } from '@/lib/nav';
import { useStore } from '@/lib/store';

export default function Night() {
  const { at, gain, plan } = useLocalSearchParams<{ at?: string; gain?: string; plan?: string }>();
  const { snap, tk, now } = useStore();
  const st = snap.settings;
  const g = Number(gain) || 0;
  const plans = bedPlans(st);
  const ci = st ? rhythm(snap.days, st, tk, now).stops.find((x) => x.k === 'evening' && !x.done) : null;
  return (
    <SceneFrame
      title="Good night"
      sky="night"
      onClose={close}
      footer={
        <View style={{ alignSelf: 'stretch' }}>
          <Button label="Good night" icon="moon" onPress={close} />
        </View>
      }>
      <NightSky />
      <T v="title" style={s.c} accessibilityRole="header">
        Phone down. Good night.
      </T>
      <T style={s.c}>{at ? `Phone away at ${fmtClock(at)}. ` : ''}Tomorrow morning I will ask one thing: did it stay away? Honest is better than perfect.</T>
      {g ? (
        <T v="label" style={[s.c, { color: '#8CF0CE' }]}>
          +{g} points
        </T>
      ) : null}
      {ci ? (
        <View style={s.box}>
          <T v="label">One minute first?</T>
          <T v="small" style={{ color: '#CFC8F2' }}>
            Today&apos;s check-in is still open. Four numbers, and the day is logged.
          </T>
          <Button kind="ghost" label="Check in first" icon="pencil" onPress={() => router.push('/checkin')} />
        </View>
      ) : null}
      <View style={s.box}>
        <T v="eyebrow" style={{ color: '#CFC8F2' }}>
          If the thoughts get loud
        </T>
        {plan ? <T v="label">{plan}</T> : null}
        {plans
          .filter((p) => !plan || !plan.startsWith(p[1]))
          .map((p) => (
            <View key={p[0]} style={{ gap: 1 }}>
              <T v="label">{p[1]}</T>
              <T v="small" style={{ color: '#CFC8F2' }}>
                {p[2]}
              </T>
            </View>
          ))}
      </View>
    </SceneFrame>
  );
}

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
function NightSky() {
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
        style={[s.halo, { opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.6] }), transform: [{ scale: glow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) }] }]}
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
  c: { textAlign: 'center' },
  box: { alignSelf: 'stretch', gap: 10, padding: 16, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.10)' },
  moon: { width: 112, height: 112, borderRadius: 56, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.10)' },
});
