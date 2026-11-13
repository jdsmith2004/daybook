/* A turn, as a card you swipe away (the owner, November 13, 2026: the flip cards "still suck"; picked "Swipe it away"). The old thought
   sits on warm paper, a little crooked. Drag it right for "That is me", left for "Not me", or tap the two buttons under it. It tilts as it
   goes, a stamp shows which way, and it flies off; the new way to see it springs up in its place, sun yellow, and the flame answers.
   Nothing is right or wrong: the swipe is the person's own answer. With Reduce Motion on, the new card simply shows. */
import { FLIP_FEEL } from '@daybook/core';
import { useMemo, useRef, useState } from 'react';
import { Animated, Easing, PanResponder, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { SHORT } from '@/components/fit';
import { Bubble, FlameSlot } from '@/components/lesson-flame';
import { Dock } from '@/components/scene';
import { Text } from '@/components/text';
import { buzz } from '@/lib/feel';
import { PAPER, PAPER_INK, PAPER_LIP, RIGHT, SUN_CARD, SUN_INK } from '@/lib/lesson-look';
import { NATIVE, useReducedMotion } from '@/lib/motion';
import { font } from '@/lib/theme';

/** the two answers a swipe gives, as places in FLIP_FEEL: right is "Very true", left is "Not really" */
const RIGHT_J = 0;
const LEFT_J = 2;
/** how far a drag must go, or how fast, to let the card fly */
const FAR = 110;

export function SwipeCard({ think, see, felt, want, onFeel }: { think: string; see: string; felt: number | null; want: number; onFeel: (j: number) => void }) {
  const still = useReducedMotion();
  const W = useWindowDimensions().width;
  const x = useRef(new Animated.Value(0)).current;
  /* the new card: 0 unseen, 1 landed */
  const up = useRef(new Animated.Value(felt != null ? 1 : 0)).current;
  const [out, setOut] = useState(felt != null);
  const outRef = useRef(out);
  const fling = (dir: 1 | -1) => {
    if (outRef.current) return;
    outRef.current = true;
    buzz('tap');
    const land = () => {
      setOut(true);
      onFeel(dir > 0 ? RIGHT_J : LEFT_J);
      if (still) up.setValue(1);
      else Animated.spring(up, { toValue: 1, friction: 5, tension: 110, useNativeDriver: NATIVE }).start();
    };
    if (still) return land();
    Animated.timing(x, { toValue: dir * W * 1.3, duration: 260, easing: Easing.in(Easing.cubic), useNativeDriver: NATIVE }).start(land);
  };
  const flingRef = useRef(fling);
  flingRef.current = fling;
  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => !outRef.current && Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),
        onPanResponderTerminationRequest: () => false,
        onPanResponderMove: (_, g) => x.setValue(g.dx),
        onPanResponderRelease: (_, g) => {
          if (Math.abs(g.dx) > FAR || Math.abs(g.vx) > 0.8) flingRef.current(g.dx > 0 ? 1 : -1);
          else Animated.spring(x, { toValue: 0, friction: 6, useNativeDriver: NATIVE }).start();
        },
        onPanResponderTerminate: () => Animated.spring(x, { toValue: 0, friction: 6, useNativeDriver: NATIVE }).start(),
      }),
    [x],
  );
  const tilt = x.interpolate({ inputRange: [-W, 0, W], outputRange: ['-14deg', '-2.5deg', '14deg'] });
  const yes = x.interpolate({ inputRange: [0, FAR], outputRange: [0, 1], extrapolate: 'clamp' });
  const no = x.interpolate({ inputRange: [-FAR, 0], outputRange: [1, 0], extrapolate: 'clamp' });
  const long = see.length > 90;
  return (
    <>
      <View style={s.room}>
        {out ? (
          <Animated.View
            accessibilityLabel={'Another way to see it: ' + see}
            style={[
              s.card,
              s.back,
              {
                opacity: up.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1] }),
                transform: [{ scale: up.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }],
              },
            ]}>
            <Text style={[s.t, s.seeT, long && s.long]}>{see}</Text>
          </Animated.View>
        ) : (
          <Animated.View
            {...pan.panHandlers}
            accessibilityLabel={'You may think: ' + think + '. Swipe right if that is you, left if it is not.'}
            style={[s.card, s.front, { transform: [{ translateX: x }, { rotate: tilt }] }]}>
            <Text style={s.mark}>“</Text>
            <Text style={s.t}>{think}</Text>
            <Animated.View pointerEvents="none" style={[s.stamp, s.stampYes, { opacity: yes }]}>
              <Text style={[s.stampT, { color: RIGHT }]}>That is me</Text>
            </Animated.View>
            <Animated.View pointerEvents="none" style={[s.stamp, s.stampNo, { opacity: no }]}>
              <Text style={[s.stampT, { color: '#8A7FB0' }]}>Not me</Text>
            </Animated.View>
          </Animated.View>
        )}
      </View>
      <Bubble text={felt != null && out ? FLIP_FEEL[felt].say : 'Is this you? Swipe it.'} style={{ marginTop: 8 }} />
      <FlameSlot size={want * 0.8} min={84} />
      {out ? null : (
        <Dock>
          <View style={s.two}>
            <Pressable accessibilityRole="button" onPress={() => fling(-1)} style={({ pressed }) => [s.btn, { transform: [{ translateY: pressed ? 2 : 0 }] }]}>
              <Text style={s.btnT}>← Not me</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => fling(1)} style={({ pressed }) => [s.btn, { transform: [{ translateY: pressed ? 2 : 0 }] }]}>
              <Text style={s.btnT}>That is me →</Text>
            </Pressable>
          </View>
        </Dock>
      )}
    </>
  );
}

const s = StyleSheet.create({
  room: { paddingTop: SHORT ? 8 : 24, paddingHorizontal: 8, minHeight: SHORT ? 216 : 260 },
  card: { borderRadius: 20, paddingHorizontal: 24, paddingVertical: 24, minHeight: SHORT ? 200 : 236, justifyContent: 'center' },
  front: { backgroundColor: PAPER, shadowColor: PAPER_LIP, shadowOpacity: 1, shadowRadius: 0, shadowOffset: { width: 0, height: 6 } },
  back: { backgroundColor: SUN_CARD },
  mark: { fontFamily: font.display, fontSize: 64, lineHeight: 72, marginTop: -8, marginBottom: -24, color: '#E8665A' },
  t: { fontFamily: font.display, fontSize: 28, lineHeight: 34, color: PAPER_INK },
  seeT: { color: SUN_INK },
  long: { fontSize: 22, lineHeight: 28 },
  stamp: { position: 'absolute', top: 16, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, borderWidth: 3 },
  stampYes: { left: 16, borderColor: RIGHT, transform: [{ rotate: '-8deg' }] },
  stampNo: { right: 16, borderColor: '#8A7FB0', transform: [{ rotate: '8deg' }] },
  stampT: { fontFamily: font.display, fontSize: 20, lineHeight: 26 },
  two: { flexDirection: 'row', gap: 8 },
  btn: {
    flex: 1,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: PAPER,
    shadowColor: PAPER_LIP,
    shadowOpacity: 1,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 4 },
  },
  btnT: { fontFamily: font.bodySemi, fontSize: 15, lineHeight: 20, color: PAPER_INK },
});
