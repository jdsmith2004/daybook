/* Pulling Today down opens the journal (app/journal.tsx), the way pulling a list down refreshes it in other apps. As the page
   comes down, the four colors of the Mood Meter grow in the gap above it, one after another, with a line under them; past
   the line they swell, the phone gives a small tick, and the words say to let go. Let go there and the journal comes down
   from the top, carrying on from the thumb. Short of the line, the page simply springs back.

   On iOS the page's own bounce is the pull (the scroll offset above the top). On Android and the web a page does not bounce,
   so the touch itself is followed while the page is at the top, and the page is moved down with the same give an iOS page
   has (screen.tsx). Both give one number, how far it is pulled, in points. */
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { QUAD } from '@/components/tools/feel';
import { Icon } from '@/components/ui';
import { NATIVE, SPRING, useReducedMotion } from '@/lib/motion';
import { font, useTheme } from '@/lib/theme';

/** how far the page comes down before letting go opens the journal */
export const PULL_ARM = 72;
/** how tall the door is: the colors and the line under them */
export const DOOR_H = 62;

/** the give of a page pulled past its top, the way iOS does it: the farther it goes, the harder it gets (d is the screen) */
export const rubber = (x: number, d: number) => (1 - 1 / ((x * 0.55) / d + 1)) * d;

const ORDER = ['red', 'yellow', 'blue', 'green'];

/** the door: what shows in the gap above Today while it is pulled down */
export function PullDoor({ pull, armed, top }: { pull: Animated.AnimatedInterpolation<number>; armed: boolean; top: number }) {
  const c = useTheme();
  const reduce = useReducedMotion();
  /* past the line, the colors swell once, with a little bounce */
  const pop = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduce) pop.setValue(armed ? 1 : 0);
    else Animated.spring(pop, { toValue: armed ? 1 : 0, ...SPRING.fast, useNativeDriver: NATIVE }).start();
  }, [armed, reduce, pop]);
  const d = 15;
  return (
    <Animated.View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        s.door,
        {
          top,
          opacity: pull.interpolate({ inputRange: [14, 46], outputRange: [0, 1], extrapolate: 'clamp' }),
          /* it rides just above the top of the page as the page comes down */
          transform: [{ translateY: pull.interpolate({ inputRange: [0, 600], outputRange: [-DOOR_H, 600 - DOOR_H], extrapolate: 'clamp' }) }],
        },
      ]}>
      <Animated.View style={[s.meter, { transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [1, 1.22] }) }] }]}>
        {ORDER.map((id, i) => {
          /* each color grows in a little after the one before it */
          const a = 18 + i * 9;
          const grow = pull.interpolate({ inputRange: [a, a + 26], outputRange: [0.2, 1], extrapolate: 'clamp' });
          return (
            <Animated.View key={id} style={[s.orb, { width: d, height: d, borderRadius: d / 2, transform: [{ scale: grow }] }]}>
              <LinearGradient colors={[QUAD[id].top, QUAD[id].bottom]} start={{ x: 0.3, y: 0 }} end={{ x: 0.7, y: 1 }} style={StyleSheet.absoluteFill} />
            </Animated.View>
          );
        })}
      </Animated.View>
      <Text style={[s.say, { color: armed ? c.accentText : c.muted }]}>{armed ? 'Let go for your journal' : 'Keep pulling'}</Text>
    </Animated.View>
  );
}

/** under Today's title until the journal has been opened once: where it is, and a tap opens it too */
export function PullHint({ onPress }: { onPress: () => void }) {
  const c = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open your journal. You can also pull Today down."
      onPress={onPress}
      style={({ pressed }) => [s.hint, { opacity: pressed ? 0.7 : 1 }]}>
      <View style={s.hintDots}>
        {ORDER.map((id) => (
          <View key={id} style={[s.dot, { backgroundColor: QUAD[id].bottom }]} />
        ))}
      </View>
      <Text style={[s.hintT, { color: c.muted }]}>Pull down for your journal</Text>
      <Icon name="down" size={14} color={c.muted} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  door: { position: 'absolute', left: 0, right: 0, height: DOOR_H, alignItems: 'center', justifyContent: 'center', gap: 7 },
  meter: { width: 15 * 2 + 4, flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  orb: { overflow: 'hidden' },
  say: { fontFamily: font.bodySemi, fontSize: 13, lineHeight: 17 },
  hint: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 7, paddingVertical: 4, marginTop: 2 },
  hintDots: { width: 7 * 2 + 2, flexDirection: 'row', flexWrap: 'wrap', gap: 2 },
  dot: { width: 7, height: 7, borderRadius: 3.5 },
  hintT: { fontFamily: font.bodySemi, fontSize: 13, lineHeight: 17 },
});
