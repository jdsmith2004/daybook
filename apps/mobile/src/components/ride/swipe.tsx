/* The ride as a stack of pages you swipe through, like short videos: up for the next move, down to go back to the one before
   (the owner, November 9, 2026: "more like swiping, and obvious it is swiping"). The page follows the finger, and a firm
   flick or a drag past a fifth of the page carries it off and brings the next one up from below. Drags that start on a
   move's own drag (the shapes board) stay with the move: the swipe waits for 14 points of mostly upright movement.

   It is keyed by the parent per page, so each page mounts already placed where it comes from (below for the next, above
   for the one before) and slides in from there. Until the person has swiped a few times (core UrMem.swiped), the page
   lifts twice by itself after a moment, the way short-video apps teach it, while the bar under it says "Swipe up" (sos.tsx). */
import { useEffect, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Reanimated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { buzz } from '@/lib/feel';
import { useReducedMotion } from '@/lib/motion';

/** the last page height seen, so the next page starts just out of view */
let lastH = 640;

export function RideSwipe({
  from,
  canBack,
  hint,
  on,
  onNext,
  onBack,
  children,
}: {
  /** where this page comes in from: 1 below (the next), -1 above (the one before), 0 in place (the first) */
  from: -1 | 0 | 1;
  canBack: boolean;
  /** show how to swipe on this page */
  hint: boolean;
  /** the ride is in front (no sheet over it) */
  on: boolean;
  onNext: () => void;
  onBack: () => void;
  children: ReactNode;
}) {
  const still = useReducedMotion();
  const h = useSharedValue(lastH);
  const y = useSharedValue(still ? 0 : from * lastH);
  const fade = useSharedValue(still && from ? 0 : 1);

  useEffect(() => {
    if (still) fade.value = withTiming(1, { duration: 200 });
    else if (from) y.value = withTiming(0, { duration: 340, easing: Easing.out(Easing.cubic) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* the lesson: two lifts, a beat apart, once the page has settled */
  useEffect(() => {
    if (!hint || !on) return;
    if (still) return;
    const lift = () => withSequence(withTiming(-56, { duration: 380, easing: Easing.out(Easing.quad) }), withSpring(0, { damping: 11, stiffness: 140 }));
    y.value = withDelay(2200, withSequence(lift(), withDelay(500, lift())));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hint, on]);

  const go = (dir: 1 | -1) => {
    buzz('tap');
    if (dir === 1) onNext();
    else onBack();
  };
  const pan = Gesture.Pan()
    .enabled(on)
    .activeOffsetY([-14, 14])
    .failOffsetX([-22, 22])
    .onUpdate((e) => {
      const t = e.translationY;
      /* down with nothing before it: it gives a little, then holds */
      y.value = t > 0 && !canBack ? t * 0.25 : t;
    })
    .onEnd((e) => {
      const far = h.value * 0.2;
      const up = e.translationY < -far || e.velocityY < -700;
      const down = canBack && (e.translationY > far || e.velocityY > 700);
      if (up || down) {
        const dir = up ? 1 : -1;
        y.value = withTiming(-dir * h.value, { duration: 200, easing: Easing.in(Easing.quad) }, (fin) => {
          if (fin) runOnJS(go)(dir);
        });
      } else y.value = withSpring(0, { damping: 16, stiffness: 180 });
    });

  const page = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }], opacity: fade.value }));

  return (
    <GestureDetector gesture={pan}>
      <View
        style={s.clip}
        collapsable={false}
        onLayout={(e) => {
          h.value = e.nativeEvent.layout.height;
          lastH = e.nativeEvent.layout.height;
        }}>
        <Reanimated.View style={[s.page, page]}>{children}</Reanimated.View>
      </View>
    </GestureDetector>
  );
}

const s = StyleSheet.create({
  clip: { flex: 1, alignSelf: 'stretch', overflow: 'hidden' },
  page: { flex: 1, alignItems: 'center', gap: 14 },
});
