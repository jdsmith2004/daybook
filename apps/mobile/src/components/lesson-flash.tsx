/* A turn, as a real flashcard (the owner, November 13, 2026: "it should be tap more like flash cards"). The old thought sits on warm
   paper, a little crooked, with "Tap to flip" on it. A tap lifts it, turns it over and lands it straight, sun yellow, with the other way to
   see it; another tap turns it back, and again, as many times as the person likes. The first turn is the answer: the praise bar comes up
   once it has landed. Nothing is graded. With Reduce Motion on, the other side simply shows. */
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';

import { SHORT } from '@/components/fit';
import { Bubble, FlameSlot } from '@/components/lesson-flame';
import { Text } from '@/components/text';
import { buzz } from '@/lib/feel';
import { PAPER, PAPER_INK, PAPER_LIP, SUN_CARD, SUN_INK } from '@/lib/lesson-look';
import { NATIVE, useReducedMotion } from '@/lib/motion';
import { font } from '@/lib/theme';

export function FlashCard({ think, see, felt, want, onFeel }: { think: string; see: string; felt: number | null; want: number; onFeel: (j: number) => void }) {
  const still = useReducedMotion();
  /* 0 the old thought up, 1 the new way to see it */
  const a = useRef(new Animated.Value(felt != null ? 1 : 0)).current;
  const [up, setUp] = useState<0 | 1>(felt != null ? 1 : 0);
  const turned = useRef(felt != null);
  useEffect(() => {
    if (felt != null) turned.current = true;
  }, [felt]);
  const turn = () => {
    const to: 0 | 1 = up ? 0 : 1;
    setUp(to);
    buzz(to ? 'save' : 'tap');
    if (to && !turned.current) {
      turned.current = true;
      onFeel(0);
    }
    if (still) return a.setValue(to);
    Animated.timing(a, { toValue: to, duration: 560, easing: Easing.inOut(Easing.cubic), useNativeDriver: NATIVE }).start();
  };
  const front = a.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const back = a.interpolate({ inputRange: [0, 1], outputRange: ['-180deg', '0deg'] });
  /* the faces trade places at the edge, for Android, which does not hide a card's back side */
  const frontOn = a.interpolate({ inputRange: [0, 0.5, 0.501, 1], outputRange: [1, 1, 0, 0] });
  const backOn = a.interpolate({ inputRange: [0, 0.5, 0.501, 1], outputRange: [0, 0, 1, 1] });
  /* it lifts toward the person as it turns (never above its drawn size: it is drawn at 1 and dips first), and lands straight */
  const lift = a.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0.94, 1] });
  const tilt = a.interpolate({ inputRange: [0, 1], outputRange: ['-2.5deg', '0deg'] });
  const long = see.length > 90;
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={up ? 'Another way to see it: ' + see : 'You may think: ' + think}
        accessibilityHint={up ? 'Flips it back to the old thought' : 'Flips the card over'}
        onPress={turn}
        style={s.room}>
        <Animated.View style={{ transform: [{ scale: lift }, { rotate: tilt }] }}>
          <Animated.View style={[s.card, s.front, { opacity: frontOn, transform: [{ perspective: 1000 }, { rotateY: front }] }]}>
            <Text style={s.mark}>“</Text>
            <Text style={s.t}>{think}</Text>
            <Text style={s.hint}>Tap to flip</Text>
          </Animated.View>
          <Animated.View style={[s.card, s.back, { opacity: backOn, transform: [{ perspective: 1000 }, { rotateY: back }] }]}>
            <Text style={[s.t, s.seeT, long && s.long]}>{see}</Text>
            <Text style={[s.hint, { color: SUN_INK }]}>Tap to flip back</Text>
          </Animated.View>
        </Animated.View>
      </Pressable>
      {felt == null ? <Bubble text="Tap the card to turn it over." style={{ marginTop: 8 }} /> : null}
      <FlameSlot size={want * 0.85} min={84} />
    </>
  );
}

const s = StyleSheet.create({
  room: { paddingTop: SHORT ? 8 : 24, paddingHorizontal: 8 },
  card: {
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    minHeight: SHORT ? 220 : 260,
    justifyContent: 'center',
    gap: 12,
    backfaceVisibility: 'hidden',
  },
  front: { backgroundColor: PAPER, shadowColor: PAPER_LIP, shadowOpacity: 1, shadowRadius: 0, shadowOffset: { width: 0, height: 6 } },
  back: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: SUN_CARD },
  mark: { fontFamily: font.display, fontSize: 64, lineHeight: 72, marginTop: -8, marginBottom: -36, color: '#E8665A' },
  t: { fontFamily: font.display, fontSize: 28, lineHeight: 34, color: PAPER_INK },
  seeT: { color: SUN_INK },
  long: { fontSize: 22, lineHeight: 28 },
  hint: { fontFamily: font.bodySemi, fontSize: 13, lineHeight: 18, color: '#8A7FB0', textAlign: 'center', marginTop: 4 },
});
