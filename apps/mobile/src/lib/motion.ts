/* Small entrance motions: things settle in once when they appear, and never loop. With Reduce Motion on, they start where they
   end. Built on React Native's Animated, like the breathing sun, so they run the same on iOS, Android and the web. */
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform } from 'react-native';

export const NATIVE = Platform.OS !== 'web';

/** true when the person asked their device for less motion (false until known) */
export function useReducedMotion() {
  const [r, setR] = useState(false);
  useEffect(() => {
    let live = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((x) => live && setR(x))
      .catch(() => undefined);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (x) => setR(x));
    return () => {
      live = false;
      sub.remove();
    };
  }, []);
  return r;
}

/** a value that goes from 0 to 1 once, after delay ms (or is 1 at once with Reduce Motion on) */
export function useAppear(delay = 0, duration = 420, easing = Easing.out(Easing.cubic)) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    let live = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((r) => {
        if (!live) return;
        if (r) v.setValue(1);
        else Animated.timing(v, { toValue: 1, duration, delay, easing, useNativeDriver: NATIVE }).start();
      });
    return () => {
      live = false;
      v.stopAnimation();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return v;
}

/** fade in while rising a few points */
export const rise = (v: Animated.Value, by = 10) => ({ opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [by, 0] }) }] });
/** fade in while growing a little */
export const pop = (v: Animated.Value, from = 0.86) => ({ opacity: v, transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [from, 1] }) }] });
