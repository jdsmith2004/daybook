/* Small entrance motions: things settle in once when they appear, and never loop. With Reduce Motion on, they start where they
   end. Built on React Native's Animated, like the breathing sun, so they run the same on iOS, Android and the web. */
import { useIsFocused } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform } from 'react-native';

export const NATIVE = Platform.OS !== 'web';

/* Reduce Motion, asked once when the app starts and kept up to date, so a page or a card can start moving in its first frame
   instead of waiting a beat for the answer (that wait showed as a blank card on phones). */
let reduceNow: boolean | null = null;
try {
  AccessibilityInfo.isReduceMotionEnabled()
    .then((r) => (reduceNow = r))
    .catch(() => (reduceNow = false));
  AccessibilityInfo.addEventListener('reduceMotionChanged', (r) => (reduceNow = r));
} catch {
  reduceNow = false;
}
/** Reduce Motion now, as far as it is known yet */
const askReduce = (): Promise<boolean> => (reduceNow !== null ? Promise.resolve(reduceNow) : AccessibilityInfo.isReduceMotionEnabled().catch(() => false));

/** true when the person asked their device for less motion (false until known) */
/** whether the screen this sits on is the one in front. True outside any screen: what is drawn over the whole app (a celebration) has no screen to hide it,
    and there the hook below throws. */
export function useOnScreen() {
  try {
    return useIsFocused();
  } catch {
    return true;
  }
}

export function useReducedMotion() {
  const [r, setR] = useState(() => !!reduceNow);
  useEffect(() => {
    let live = true;
    askReduce().then((x) => live && setR(x));
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
  const v = useRef(new Animated.Value(reduceNow ? 1 : 0)).current;
  useEffect(() => {
    let live = true;
    const go = (r: boolean) => {
      if (!live) return;
      if (r) v.setValue(1);
      else Animated.timing(v, { toValue: 1, duration, delay, easing, useNativeDriver: NATIVE }).start();
    };
    if (reduceNow !== null) go(reduceNow);
    else askReduce().then(go);
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

/* Material 3 Expressive's springs (motion physics): spatial springs move things and may overshoot a little; effects
   springs (color, opacity) settle with no bounce. Android gives them as stiffness and a damping ratio; React Native's
   spring takes the damping itself, which is 2 × ratio × √stiffness for a mass of 1. */
const spr = (stiffness: number, ratio: number) => ({ stiffness, damping: 2 * ratio * Math.sqrt(stiffness), mass: 1 });
export const SPRING = {
  /** small things: a tap, a check, a chip */
  fast: spr(800, 0.6),
  /** most moves: a card, a shape changing into another */
  default: spr(380, 0.8),
  /** big, slow moves: a whole scene settling */
  slow: spr(200, 0.8),
  /** color and opacity: no bounce */
  effects: spr(1600, 1),
};
