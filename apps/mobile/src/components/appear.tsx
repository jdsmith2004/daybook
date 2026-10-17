/* Things that ease in when they appear: a page, a pane, a card that opens, the next lesson card. Give it a new `key` to play it
   again. On phones the screens already slide in, so `webOnly` keeps a page from moving twice there. With Reduce Motion on, it is
   simply there. */
import type { ReactNode } from 'react';
import { Animated, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';

import { NATIVE, rise, useAppear } from '@/lib/motion';

export function Appear({
  children,
  by = 8,
  x = 0,
  delay = 0,
  duration = 260,
  webOnly,
  style,
  onLayout,
}: {
  children: ReactNode;
  by?: number;
  /** slide in sideways from this far (a step in a sequence: positive from the right, negative from the left) */
  x?: number;
  /** wait this long first (to let several things rise one after another) */
  delay?: number;
  duration?: number;
  webOnly?: boolean;
  style?: StyleProp<ViewStyle>;
  onLayout?: (e: LayoutChangeEvent) => void;
}) {
  if (webOnly && NATIVE)
    return (
      <Animated.View style={style} onLayout={onLayout}>
        {children}
      </Animated.View>
    );
  return (
    <Moving by={by} x={x} delay={delay} duration={duration} style={style} onLayout={onLayout}>
      {children}
    </Moving>
  );
}

function Moving({
  children,
  by,
  x,
  delay,
  duration,
  style,
  onLayout,
}: {
  children: ReactNode;
  by: number;
  x: number;
  delay: number;
  duration: number;
  style?: StyleProp<ViewStyle>;
  onLayout?: (e: LayoutChangeEvent) => void;
}) {
  const v = useAppear(delay, duration);
  const r = rise(v, by);
  const slide = x ? { ...r, transform: [...r.transform, { translateX: v.interpolate({ inputRange: [0, 1], outputRange: [x, 0] }) }] } : r;
  return (
    <Animated.View style={[style, slide]} onLayout={onLayout}>
      {children}
    </Animated.View>
  );
}
