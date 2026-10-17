/* Answers that feel good to touch: a raised card with a colored icon, the words, and a short line. It sinks a little
   under the finger, springs back, and when picked it fills with its color and shows a check that pops in. Answer is
   one row (one choice, or one of several with multi); AnswerChip is the small rounded kind for quick lists. */
import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { useReducedMotion } from '@/lib/motion';
import { font, toneOf, useTheme } from '@/lib/theme';

/** the press and pick motion every answer shares (on the JS driver, because colors move with it) */
function useAnswerMotion(on: boolean) {
  const reduce = useReducedMotion();
  const fill = useRef(new Animated.Value(on ? 1 : 0)).current;
  const press = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduce) fill.setValue(on ? 1 : 0);
    else Animated.spring(fill, { toValue: on ? 1 : 0, friction: 7, tension: 140, useNativeDriver: false }).start();
  }, [on, reduce, fill]);
  const pressTo = (v: number) => {
    if (reduce) return;
    Animated.timing(press, { toValue: v, duration: v ? 70 : 160, easing: Easing.out(Easing.quad), useNativeDriver: false }).start();
  };
  return { fill, press, pressTo };
}

export function Answer({
  icon,
  tone = 'accent',
  title,
  sub,
  on = false,
  multi,
  onPress,
}: {
  icon?: string;
  tone?: string;
  title: string;
  sub?: string;
  on?: boolean;
  /** one of several that can be picked: a square check instead of a round one */
  multi?: boolean;
  onPress: () => void;
}) {
  const c = useTheme();
  const t = toneOf(c, tone);
  const { fill, press, pressTo } = useAnswerMotion(on);
  return (
    <Pressable
      accessibilityRole={multi ? 'checkbox' : 'radio'}
      accessibilityState={{ checked: on }}
      accessibilityLabel={sub ? title + '. ' + sub : title}
      onPress={() => {
        buzz('tap');
        onPress();
      }}
      onPressIn={() => pressTo(1)}
      onPressOut={() => pressTo(0)}>
      <Animated.View
        style={[
          s.card,
          {
            backgroundColor: fill.interpolate({ inputRange: [0, 1], outputRange: [c.surface, t.soft] }),
            borderColor: fill.interpolate({ inputRange: [0, 1], outputRange: [c.surface, t.ic] }),
            shadowColor: c.lip,
            shadowOffset: { width: 0, height: 4 },
            transform: [
              { translateY: press.interpolate({ inputRange: [0, 1], outputRange: [0, 3] }) },
              { scale: press.interpolate({ inputRange: [0, 1], outputRange: [1, 0.985] }) },
            ],
          },
        ]}>
        {icon ? (
          <View style={[s.ic, { backgroundColor: on ? t.ic : t.soft }]}>
            <Icon name={icon} size={22} color={on ? t.ink : t.text} />
          </View>
        ) : null}
        <View style={{ flex: 1, minWidth: 0, gap: 1 }}>
          <Text style={[s.title, { color: c.ink }]}>{title}</Text>
          {sub ? <Text style={[s.sub, { color: c.muted }]}>{sub}</Text> : null}
        </View>
        <View style={[s.mark, multi ? s.square : null, { borderColor: on ? t.ic : c.line }]}>
          <Animated.View
            style={[
              s.dot,
              multi ? s.squareDot : null,
              {
                backgroundColor: t.ic,
                opacity: fill,
                transform: [{ scale: fill.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }],
              },
            ]}>
            <Icon name="check" size={14} color={t.ink} />
          </Animated.View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

/** a small answer for quick lists (where in the body, what it feels like): it fills with its color when picked */
export function AnswerChip({ label, on, tone = 'accent', onPress }: { label: string; on: boolean; tone?: string; onPress: () => void }) {
  const c = useTheme();
  const t = toneOf(c, tone);
  const { fill, press, pressTo } = useAnswerMotion(on);
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: on }}
      onPress={() => {
        buzz('tap');
        onPress();
      }}
      onPressIn={() => pressTo(1)}
      onPressOut={() => pressTo(0)}>
      <Animated.View
        style={[
          s.chip,
          {
            backgroundColor: fill.interpolate({ inputRange: [0, 1], outputRange: [c.surface, t.ic] }),
            shadowColor: c.lip,
            shadowOffset: { width: 0, height: 3 },
            transform: [{ translateY: press.interpolate({ inputRange: [0, 1], outputRange: [0, 2] }) }],
          },
        ]}>
        <Animated.Text style={[s.chipT, { color: fill.interpolate({ inputRange: [0, 1], outputRange: [c.ink, t.ink] }) }]}>{label}</Animated.Text>
      </Animated.View>
    </Pressable>
  );
}

/** a wrapping row of AnswerChips */
export function ChipWrap({ children }: { children: React.ReactNode }) {
  return <View style={s.wrap}>{children}</View>;
}

const s = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 60,
    paddingVertical: 10,
    paddingLeft: 12,
    paddingRight: 14,
    borderRadius: 20,
    borderWidth: 2,
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  ic: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: font.bodyBold, fontSize: 16.5, lineHeight: 21 },
  sub: { fontFamily: font.body, fontSize: 13.5, lineHeight: 18 },
  mark: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  square: { borderRadius: 8 },
  dot: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  squareDot: { borderRadius: 8 },
  chip: { minHeight: 44, paddingHorizontal: 16, borderRadius: 999, justifyContent: 'center', shadowOpacity: 1, shadowRadius: 0, elevation: 2 },
  chipT: { fontFamily: font.bodySemi, fontSize: 15.5 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
});
