/* A row of big answers to tap, like Yes or Not this time. Nothing is picked until the person taps; the one picked eases
   into the accent color, and every answer presses down a little under the finger. Each answer is a real button with room
   for a thumb. */
import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import { AnimatedText } from '@/components/text';

import { buzz } from '@/lib/feel';
import { useReducedMotion } from '@/lib/motion';
import { font, useTheme } from '@/lib/theme';

export type PickOpt<K> = { k: K; label: string; a11y?: string };

export function PickRow<K extends string | number>({
  label,
  list,
  cur,
  onPick,
  big,
}: {
  /** what the row answers, for screen readers */
  label: string;
  list: PickOpt<K>[];
  cur: K | null | undefined;
  onPick: (k: K) => void;
  /** taller buttons */
  big?: boolean;
}) {
  return (
    <View style={s.row} accessibilityRole="radiogroup" accessibilityLabel={label}>
      {list.map((o) => (
        <PickBtn
          key={String(o.k)}
          label={o.label}
          a11y={o.a11y || o.label}
          on={cur === o.k}
          big={big}
          onPress={() => {
            buzz('tap');
            onPick(o.k);
          }}
        />
      ))}
    </View>
  );
}

function PickBtn({ label, a11y, on, big, onPress }: { label: string; a11y: string; on: boolean; big?: boolean; onPress: () => void }) {
  const c = useTheme();
  const reduce = useReducedMotion();
  const fill = useRef(new Animated.Value(on ? 1 : 0)).current;
  const press = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduce) fill.setValue(on ? 1 : 0);
    else Animated.timing(fill, { toValue: on ? 1 : 0, duration: 200, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [on, reduce, fill]);
  const pressTo = (v: number) => {
    if (reduce) return;
    Animated.spring(press, { toValue: v, friction: 6, tension: 260, useNativeDriver: false }).start();
  };
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={a11y}
      accessibilityState={{ checked: on }}
      onPress={onPress}
      onPressIn={() => pressTo(1)}
      onPressOut={() => pressTo(0)}
      style={s.cell}>
      <Animated.View
        style={[
          s.btn,
          big && s.big,
          {
            backgroundColor: fill.interpolate({ inputRange: [0, 1], outputRange: [c.surface, c.accent] }),
            borderColor: fill.interpolate({ inputRange: [0, 1], outputRange: [c.line, c.accent] }),
            shadowColor: c.lip,
            shadowOffset: { width: 0, height: 3 },
            transform: [
              { translateY: press.interpolate({ inputRange: [0, 1], outputRange: [0, 2] }) },
              { scale: press.interpolate({ inputRange: [0, 1], outputRange: [1, 0.97] }) },
            ],
          },
        ]}>
        <AnimatedText style={[s.t, big && s.tBig, { color: fill.interpolate({ inputRange: [0, 1], outputRange: [c.ink, c.accentInk] }) }]} numberOfLines={1}>
          {label}
        </AnimatedText>
      </Animated.View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10 },
  cell: { flex: 1 },
  btn: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  big: { minHeight: 58, borderRadius: 18 },
  t: { fontFamily: font.bodySemi, fontSize: 16 },
  tBig: { fontFamily: font.display, fontSize: 22 },
});
