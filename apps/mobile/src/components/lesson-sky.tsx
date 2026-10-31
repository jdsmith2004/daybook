/* What is behind a lesson: the sky with its stars and hills, the sun card or the violet card. A new look fades in over the last one, so
   the sky turns slowly as the lesson goes on. With Reduce Motion on it still fades: nothing moves. */
import { LinearGradient } from 'expo-linear-gradient';
import { memo, useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import type { Look } from '@/lib/lesson-look';
import { NATIVE } from '@/lib/motion';

/* placed by hand: [left %, top %, size] */
const STARS: [number, number, number][] = [
  [6, 7, 2],
  [18, 16, 3],
  [31, 5, 2],
  [44, 12, 2],
  [62, 4, 3],
  [74, 15, 2],
  [91, 8, 3],
  [84, 26, 2],
  [10, 30, 2],
  [52, 24, 2],
  [93, 40, 2],
  [24, 44, 3],
  [70, 38, 2],
  [5, 55, 2],
  [40, 52, 2],
  [88, 60, 2],
  [60, 62, 2],
];

const Layer = memo(function Layer({ look }: { look: Look }) {
  /* the sun leans across the card; a sky goes straight down */
  const lean = look.kind === 'sun' ? { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } } : null;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient colors={look.colors as [string, string]} locations={look.at as [number, number]} {...lean} style={StyleSheet.absoluteFill} />
      {look.stars > 0.02
        ? STARS.map(([x, y, r], i) => (
            <View key={i} style={[s.star, { left: `${x}%`, top: `${y}%`, width: r, height: r, borderRadius: r / 2, opacity: look.stars * 0.85 }]} />
          ))
        : null}
      {look.hills ? (
        <Svg width="100%" height={look.hillH} viewBox="0 0 390 130" preserveAspectRatio="none" style={s.hills}>
          <Path d="M0 62 C70 34 150 26 230 52 S350 74 390 44 L390 130 L0 130 Z" fill={look.hills[0]} />
          <Path d="M0 92 C80 76 170 64 250 72 S350 62 390 88 L390 130 L0 130 Z" fill={look.hills[1]} />
        </Svg>
      ) : null}
    </View>
  );
});

export function LessonBackdrop({ look }: { look: Look }) {
  const [show, setShow] = useState<{ now: Look; was: Look | null }>({ now: look, was: null });
  const fade = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (look.key === show.now.key) return;
    setShow({ now: look, was: show.now });
    fade.setValue(0);
    const a = Animated.timing(fade, { toValue: 1, duration: 380, easing: Easing.inOut(Easing.quad), useNativeDriver: NATIVE });
    a.start(({ finished }) => finished && setShow((x) => ({ now: x.now, was: null })));
    return () => a.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [look.key]);
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {show.was ? <Layer look={show.was} /> : null}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: fade }]}>
        <Layer look={show.now} />
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  star: { position: 'absolute', backgroundColor: '#FFF6D8' },
  hills: { position: 'absolute', left: 0, right: 0, bottom: 0 },
});
