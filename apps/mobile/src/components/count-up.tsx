/* A number that counts up to its value once, after a short wait (points just earned, on a closing screen). With Reduce
   Motion on, it is simply the number. */
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, type StyleProp, type TextStyle } from 'react-native';

import { useReducedMotion } from '@/lib/motion';

export function CountUp({
  to,
  delay = 300,
  duration = 700,
  prefix = '',
  suffix = '',
  style,
}: {
  to: number;
  delay?: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  style?: StyleProp<TextStyle>;
}) {
  const reduce = useReducedMotion();
  const [n, setN] = useState(0);
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduce) return setN(to);
    const id = v.addListener(({ value }) => setN(Math.round(value)));
    Animated.timing(v, { toValue: to, delay, duration, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
    return () => {
      v.removeListener(id);
      v.stopAnimation();
    };
  }, [to, delay, duration, reduce, v]);
  return (
    <Animated.Text style={style} accessibilityLabel={prefix + to + suffix}>
      {prefix + (reduce ? to : n) + suffix}
    </Animated.Text>
  );
}
