/* Welcome back (core away.ts awayBack): after real days with the app unopened, a light sheet rises over Today, once for that time away
   (the owner, November 18, 2026: "welcome back is cool, but it needs to go away like quickly ... Maybe it's something like Duolingo does
   where they're like, hey, welcome back. And then just go right into a lesson ... But no like permanent pop-ups"). The person's own
   flame, one warm line, and one button straight into today's lesson; No thanks, a tap on Today behind it, or a swipe down closes it,
   and it never comes back for that gap. It asks nothing about the days away: they stay not known, and Fill in on the calendar asks
   about them (back.tsx). Today stays drawn behind it, and the tab bar with SOS stays in reach below it. */
import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing, PanResponder, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { FlameMedallion } from '@/components/flame-medallion';
import { LEAD_ROOM, useSosLeadOn } from '@/components/sos-lead';
import { Text } from '@/components/text';
import { Button } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { NATIVE, useReducedMotion } from '@/lib/motion';
import { TAB_TOP } from '@/lib/tab-room';
import { font, MAX_WIDTH, useTheme } from '@/lib/theme';

export const WELCOME_BACK = 'Glad you are back. Your flame kept your place.';

export function WelcomeBack({ level, lesson, onStart, onDone }: { level: number; lesson: boolean; onStart: () => void; onDone: () => void }) {
  const c = useTheme();
  const lead = useSosLeadOn();
  const win = useWindowDimensions();
  const reduce = useReducedMotion();
  const v = useRef(new Animated.Value(0)).current;
  const drag = useRef(new Animated.Value(0)).current;
  const gone = useRef(false);

  useEffect(() => {
    if (reduce) v.setValue(1);
    else Animated.spring(v, { toValue: 1, friction: 9, tension: 70, useNativeDriver: NATIVE }).start();
    AccessibilityInfo.announceForAccessibility(WELCOME_BACK);
  }, [reduce, v]);

  const close = (then?: () => void) => {
    if (gone.current) return;
    gone.current = true;
    const end = () => {
      onDone();
      then?.();
    };
    if (reduce) return end();
    Animated.timing(v, { toValue: 0, duration: 200, easing: Easing.in(Easing.cubic), useNativeDriver: NATIVE }).start(end);
  };

  /* a swipe down closes it, the way a sheet does */
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_, g) => drag.setValue(Math.max(0, g.dy)),
      onPanResponderRelease: (_, g) => {
        if (g.dy > 80 || g.vy > 0.8) close();
        else Animated.spring(drag, { toValue: 0, friction: 8, useNativeDriver: NATIVE }).start();
      },
    }),
  ).current;

  const flame = Math.min(170, win.height * 0.22);
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(10,8,30,0.45)', opacity: v }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close" style={StyleSheet.absoluteFill} onPress={() => close()} />
      </Animated.View>
      <Animated.View
        accessibilityViewIsModal
        style={[
          s.sheet,
          {
            backgroundColor: c.surface,
            /* just above the tab bar and its SOS, which stay in reach (care is never behind anything) */
            bottom: TAB_TOP + 8 + (lead ? LEAD_ROOM : 0),
            transform: [{ translateY: Animated.add(v.interpolate({ inputRange: [0, 1], outputRange: [420, 0] }), drag) }],
          },
        ]}>
        {/* the top of the card is its handle: a swipe down on it closes the card (the buttons keep their taps) */}
        <View {...pan.panHandlers} style={s.handle}>
          <View style={[s.grip, { backgroundColor: c.line }]} />
          <FlameMedallion level={level} size={flame} />
          <Text style={[s.h, { color: c.ink }]} accessibilityRole="header">
            {WELCOME_BACK}
          </Text>
        </View>
        <View style={s.dock}>
          {lesson ? (
            <Button
              label="Start today's lesson"
              onPress={() => {
                buzz('tap');
                close(onStart);
              }}
            />
          ) : (
            <Button label="Go to Today" onPress={() => close()} />
          )}
          {lesson ? (
            <Pressable accessibilityRole="button" onPress={() => close()} hitSlop={8} style={s.quiet}>
              <Text style={[s.quietT, { color: c.muted }]}>No thanks</Text>
            </Pressable>
          ) : null}
        </View>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 12,
    right: 12,
    alignSelf: 'center',
    maxWidth: MAX_WIDTH,
    marginHorizontal: 'auto',
    borderRadius: 28,
    paddingTop: 10,
    paddingBottom: 8,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 16,
  },
  handle: { alignSelf: 'stretch', alignItems: 'center', gap: 16 },
  grip: { width: 40, height: 5, borderRadius: 3, marginBottom: 6 },
  h: { fontFamily: font.display, fontSize: 22, lineHeight: 28, textAlign: 'center', paddingHorizontal: 8 },
  dock: { alignSelf: 'stretch', gap: 4, marginTop: 4 },
  quiet: { alignSelf: 'center', minHeight: 44, justifyContent: 'center', paddingHorizontal: 16 },
  quietT: { fontFamily: font.bodySemi, fontSize: 15 },
});
