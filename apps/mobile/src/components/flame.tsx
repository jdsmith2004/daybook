/* The flame spirit: one drawing for each of the 60 levels (packages/core, the emblem). With `alive`, it moves gently in a way
   that fits its form: a fire flickers, the lighthouse and the suns breathe slowly, the stars twinkle. It is still under
   Reduce Motion, when locked, and in long lists (which leave `alive` off). */
import { emblemXml, formOfLevel } from '@daybook/core';
import { memo, useEffect, useMemo, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { NATIVE, useReducedMotion } from '@/lib/motion';

/* [how far it grows, how long one breath takes, how much it dims] for each kind of form */
const MOTION: [number, number, number][] = [
  [0.035, 900, 0], // fire: spark to beacon
  [0.02, 2600, 0], // lighthouse
  [0.03, 3200, 0], // the suns
  [0.025, 2000, 0.15], // the stars
];
const kindOf = (form: number) => (form <= 4 ? 0 : form === 5 ? 1 : form <= 9 ? 2 : 3);

export const Flame = memo(function Flame({
  level,
  size = 96,
  locked = false,
  label,
  alive = false,
}: {
  level: number;
  size?: number;
  locked?: boolean;
  label?: string;
  alive?: boolean;
}) {
  const xml = useMemo(() => emblemXml(level, locked), [level, locked]);
  const still = useReducedMotion();
  const v = useRef(new Animated.Value(0)).current;
  const [grow, ms, dim] = MOTION[kindOf(formOfLevel(level))];
  const on = alive && !locked && !still;
  useEffect(() => {
    if (!on) {
      v.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: ms, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
        Animated.timing(v, { toValue: 0, duration: ms, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [on, ms, v]);
  const svg = <SvgXml xml={xml} width={size} height={size} accessibilityLabel={label ?? `Your flame, level ${level}`} opacity={locked ? 0.55 : 1} />;
  if (!on) return svg;
  return (
    <Animated.View
      style={{
        width: size,
        height: size,
        opacity: dim ? v.interpolate({ inputRange: [0, 1], outputRange: [1, 1 - dim] }) : 1,
        transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 1 + grow] }) }],
      }}>
      {svg}
    </Animated.View>
  );
});
