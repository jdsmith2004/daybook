/* Things that ease in when they appear: a page, a pane, a card that opens, the next lesson card. Give it a new `key` to play it
   again. On phones the screens already slide in, so `webOnly` keeps a page from moving twice there. With Reduce Motion on, it is
   simply there. */
import type { ReactNode } from 'react';
import { Animated, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';

import { NATIVE, rise, useAppear } from '@/lib/motion';

export function Appear({
  children,
  by = 8,
  duration = 260,
  webOnly,
  style,
  onLayout,
}: {
  children: ReactNode;
  by?: number;
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
    <Moving by={by} duration={duration} style={style} onLayout={onLayout}>
      {children}
    </Moving>
  );
}

function Moving({ children, by, duration, style, onLayout }: { children: ReactNode; by: number; duration: number; style?: StyleProp<ViewStyle>; onLayout?: (e: LayoutChangeEvent) => void }) {
  const v = useAppear(0, duration);
  return (
    <Animated.View style={[style, rise(v, by)]} onLayout={onLayout}>
      {children}
    </Animated.View>
  );
}
