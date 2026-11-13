/* The phone put to bed (WP5's Good night hands over here; WP8, the owner, November 12, 2026: "i honestly want constant
   celebrations"). The one quiet celebration: it is bedtime, so no band, no confetti and no chime. The flame falls asleep in front
   of the person (NightMiddle: the eyes close, the moon comes up), the nights come in under it, tonight's mark pops into a small gold
   moon with one soft knock, the line fades in, and the button comes last. A tap brings everything in at once; Reduce Motion
   shows it all, settled, asleep. Shared: any page that puts the phone to bed can show it. */
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, View } from 'react-native';
import Reanimated, { Easing, interpolate, useAnimatedStyle, useSharedValue, withSpring, withTiming, type SharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { SHORT } from '@/components/fit';
import { NightMiddle } from '@/components/night-flame';
import { Text } from '@/components/text';
import { Button, Icon } from '@/components/ui';
import { knock } from '@/lib/feel';
import { useReducedMotion } from '@/lib/motion';
import { font, nightInk } from '@/lib/theme';

const SKY = '#120E38';
const GOLD = '#FFD25A';
const ORANGE = '#FF9A3C';
/* a crescent moon, in a 24 box */
const MOON = 'M15.5 3.2A9 9 0 1 0 20.8 15 7.2 7.2 0 0 1 15.5 3.2Z';
const AT = { sleep: 400, row: 1900, mark: 2600, line: 3000, button: 3500 };

export interface BedNight {
  k: string;
  /** the day's two letters */
  d: string;
  /** put to bed that night, before the log began, or still to come (tonight is the first 'ahead', or the last) */
  m: 'free' | 'none' | 'ahead';
}

export function BedMoment({
  level,
  nights,
  row,
  line,
  title = 'Good night',
  button = 'Good night',
  onDone,
}: {
  level: number;
  /** nights the phone has been put to bed, tonight included */
  nights: number;
  row: BedNight[];
  /** what the flame says, quietly */
  line: string;
  title?: string;
  button?: string;
  onDone: () => void;
}) {
  const inset = useSafeAreaInsets();
  const still = useReducedMotion();
  const [asleep, setAsleep] = useState(still);
  const [done, setDone] = useState(still);
  const pop = Math.max(0, row.findIndex((r) => r.m === 'ahead') >= 0 ? row.findIndex((r) => r.m === 'ahead') : row.length - 1);
  const rowV = useSharedValue(still ? 1 : 0);
  const mark = useSharedValue(still ? 1 : 0);
  const say = useSharedValue(still ? 1 : 0);
  const btn = useSharedValue(still ? 1 : 0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const at = (ms: number, f: () => void) => timers.current.push(setTimeout(f, ms));
  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(title + '. ' + line);
    if (still) return;
    at(AT.sleep, () => setAsleep(true));
    at(AT.row, () => {
      rowV.value = withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) });
    });
    at(AT.mark, () => {
      knock(Haptics.ImpactFeedbackStyle.Soft);
      mark.value = withSpring(1, { damping: 9, stiffness: 160 });
    });
    at(AT.line, () => {
      say.value = withTiming(1, { duration: 500 });
    });
    at(AT.button, () => {
      setDone(true);
      btn.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) });
    });
    const t = timers.current;
    return () => t.forEach(clearTimeout);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const all = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setAsleep(true);
    setDone(true);
    for (const v of [rowV, mark, say, btn]) v.value = withTiming(1, { duration: 200 });
  };

  const rowIn = useAnimatedStyle(() => ({ opacity: rowV.value, transform: [{ translateY: 10 * (1 - rowV.value) }] }));
  const sayIn = useAnimatedStyle(() => ({ opacity: say.value }));
  const btnIn = useAnimatedStyle(() => ({ opacity: btn.value, transform: [{ translateY: 14 * (1 - btn.value) }] }));
  const count = nights === 1 ? 'Your first night put to bed' : nights + ' nights put to bed';

  return (
    <View style={s.page}>
      <StatusBar style="light" />
      <Pressable style={StyleSheet.absoluteFill} accessible={false} onPress={() => !done && all()} />
      <View style={[s.head, { paddingTop: inset.top + (SHORT ? 16 : 32) }]} pointerEvents="none">
        <Text style={s.title} accessibilityRole="header">
          {title}
        </Text>
        <Reanimated.View style={sayIn}>
          <Text style={s.line}>{line}</Text>
        </Reanimated.View>
      </View>
      <View style={s.mid} pointerEvents="none">
        <NightMiddle level={level} asleep={asleep} />
      </View>
      <View style={[s.dock, { paddingBottom: inset.bottom + (SHORT ? 12 : 20) }]} pointerEvents="box-none">
        <Reanimated.View style={[s.rowBox, rowIn]} accessible accessibilityLabel={count}>
          <Text style={s.count}>{count}</Text>
          <View style={s.row}>
            {row.map((r, i) => (
              <View key={r.k} style={s.day}>
                <Text style={[s.dayName, i === pop && { color: GOLD }]}>{r.d}</Text>
                {i === pop ? <Tonight v={mark} /> : <Mark m={r.m} />}
              </View>
            ))}
          </View>
        </Reanimated.View>
        <Reanimated.View style={btnIn} pointerEvents={done ? 'auto' : 'none'}>
          <Button label={button} kind="warm" onPress={onDone} />
        </Reanimated.View>
      </View>
    </View>
  );
}

function Mark({ m }: { m: BedNight['m'] }) {
  if (m === 'free')
    return (
      <View style={[s.dot, { backgroundColor: ORANGE }]}>
        <Icon name="check" size={16} color="#3A1A00" />
      </View>
    );
  return <View style={[s.dot, { backgroundColor: m === 'ahead' ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.08)' }]} />;
}

/** tonight: an empty dot that pops into a small gold moon */
function Tonight({ v }: { v: SharedValue<number> }) {
  const fill = useAnimatedStyle(() => ({
    opacity: Math.min(1, v.value * 2),
    transform: [{ scale: interpolate(v.value, [0, 1], [0.3, 1]) }, { rotate: `${(1 - v.value) * -60}deg` }],
  }));
  return (
    <View style={s.dotBox}>
      <View style={[s.dot, { backgroundColor: 'rgba(255,255,255,0.14)' }]} />
      <Reanimated.View style={[StyleSheet.absoluteFill, s.center, fill]}>
        <View style={[s.dot, { backgroundColor: '#2E2870' }]}>
          <Svg width={20} height={20} viewBox="0 0 24 24">
            <Path d={MOON} fill={GOLD} />
          </Svg>
        </View>
      </Reanimated.View>
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: SKY },
  center: { alignItems: 'center', justifyContent: 'center' },
  head: { paddingHorizontal: 24, alignItems: 'center', gap: 8 },
  title: { fontFamily: font.display, fontSize: 34, color: nightInk.ink, textAlign: 'center' },
  line: { fontFamily: font.bodySemi, fontSize: 17, lineHeight: 24, color: nightInk.muted, textAlign: 'center', maxWidth: 340 },
  mid: { flex: 1, paddingHorizontal: 16 },
  dock: { paddingHorizontal: 16, gap: 20 },
  rowBox: { alignSelf: 'center', width: '100%', maxWidth: 340, gap: 10 },
  count: { fontFamily: font.bodyBold, fontSize: 15, color: nightInk.ink, textAlign: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  day: { alignItems: 'center', gap: 6, width: 40 },
  dayName: { fontFamily: font.bodySemi, fontSize: 13, color: nightInk.muted },
  dotBox: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
});
