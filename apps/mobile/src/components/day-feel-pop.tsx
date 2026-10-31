/* "How are you feeling today?" (core day-feel.ts): a small card that floats up at the bottom of Today on the day's first
   open (the owner, October 25, 2026: not a full screen). Today shows first and stays usable behind it: Apple's guidelines
   say never to block an app as it opens, and the best check-ins (How We Feel, Daylio) are one quiet tap. One row of five
   answers; a tap saves it to today's log and the card turns into one line. Urges follow a low mood within hours (Perski
   and others 2023; Henry and others 2025), so a rough or low answer carries one step: Open SOS. The others close by
   themselves. Close leaves it for the rest of the day. */
import { DAY_FEEL, DAY_FEEL_Q, dayFeelSet, withDay, type DayFeelStep } from '@daybook/core';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, StyleSheet, View } from 'react-native';

import { Shape, type ShapeKind } from '@/components/shapes';
import { LEAD_ROOM, useSosLeadOn } from '@/components/sos-lead';
import { Text } from '@/components/text';
import { Icon } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { NATIVE, useReducedMotion } from '@/lib/motion';
import { useStore } from '@/lib/store';
import { TAB_TOP } from '@/lib/tab-room';
import { font, useTheme, type Palette } from '@/lib/theme';

/** each answer's look: a shape from cool to warm, calm for the low ones and bright for the high ones (a hard day is never painted red, as a warning) */
const LOOK: Record<DayFeelStep, { kind: ShapeKind; tone: (c: Palette) => [string, string] }> = {
  1: { kind: 'puffy', tone: (c) => [c.violet, c.violetText] },
  2: { kind: 'oval', tone: (c) => [c.sky, c.skyText] },
  3: { kind: 'circle', tone: (c) => [c.mint, c.mintText] },
  4: { kind: 'cookie6', tone: (c) => [c.sun, c.sunText] },
  5: { kind: 'sunny', tone: (c) => [c.sun2, c.sunText] },
};

export function DayFeelPop({ onDone }: { onDone: () => void }) {
  const c = useTheme();
  const { tk, update } = useStore();
  const reduce = useReducedMotion();
  const lead = useSosLeadOn();
  const [picked, setPicked] = useState<DayFeelStep | null>(null);
  const v = useRef(new Animated.Value(0)).current;
  const gone = useRef(false);

  useEffect(() => {
    if (reduce) v.setValue(1);
    else Animated.spring(v, { toValue: 1, friction: 9, tension: 70, useNativeDriver: NATIVE }).start();
    AccessibilityInfo.announceForAccessibility(DAY_FEEL_Q);
  }, [reduce, v]);

  const close = () => {
    if (gone.current) return;
    gone.current = true;
    if (reduce) return onDone();
    Animated.timing(v, { toValue: 0, duration: 220, easing: Easing.in(Easing.cubic), useNativeDriver: NATIVE }).start(() => onDone());
  };

  /* a good answer says so and closes by itself; a low one waits, with SOS one tap away */
  useEffect(() => {
    if (!picked || DAY_FEEL[picked - 1].help) return;
    const t = setTimeout(close, 2400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [picked]);

  const pick = (n: DayFeelStep) => {
    buzz('save');
    update((s0) => ({ ...s0, days: withDay(s0.days, tk, dayFeelSet(s0.days[tk], tk, n, Date.now())) }));
    setPicked(n);
    AccessibilityInfo.announceForAccessibility(DAY_FEEL[n - 1].say);
  };

  const a = picked ? DAY_FEEL[picked - 1] : null;
  return (
    <Animated.View
      accessibilityLabel={DAY_FEEL_Q}
      style={[
        s.card,
        {
          /* just above the tab bar and its SOS, and above the words over SOS when they show */
          bottom: TAB_TOP + 8 + (lead ? LEAD_ROOM : 0),
          backgroundColor: c.surface,
          opacity: v,
          transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }],
        },
      ]}>
      {a && picked ? (
        <>
          <View style={s.head}>
            <Shape kind={LOOK[picked].kind} size={30} color={LOOK[picked].tone(c)[0]} />
            <Text style={[s.say, { color: c.ink }]}>{a.say}</Text>
            {a.help ? <CloseX onPress={close} /> : null}
          </View>
          {a.help ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open SOS"
              onPress={() => {
                buzz('tap');
                close();
                router.push('/sos');
              }}
              style={({ pressed }) => [s.sos, { backgroundColor: c.sos, opacity: pressed ? 0.85 : 1 }]}>
              <Icon name="life" size={18} color={c.sosInk} />
              <Text style={[s.sosT, { color: c.sosInk }]}>Open SOS</Text>
            </Pressable>
          ) : null}
        </>
      ) : (
        <>
          <View style={s.head}>
            <Text style={[s.q, { color: c.ink }]} accessibilityRole="header">
              {DAY_FEEL_Q}
            </Text>
            <CloseX onPress={close} />
          </View>
          <View style={s.row}>
            {DAY_FEEL.map((x) => {
              const [bg, ink] = LOOK[x.n].tone(c);
              return (
                <Pressable
                  key={x.n}
                  accessibilityRole="button"
                  accessibilityLabel={x.w}
                  accessibilityHint="Saves it in today’s log"
                  onPress={() => pick(x.n)}
                  hitSlop={4}
                  style={({ pressed }) => [s.opt, { transform: [{ scale: pressed ? 0.92 : 1 }] }]}>
                  <Shape kind={LOOK[x.n].kind} size={40} color={bg} />
                  <Text style={[s.word, { color: ink }]} numberOfLines={1} adjustsFontSizeToFit>
                    {x.w}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </>
      )}
    </Animated.View>
  );
}

function CloseX({ onPress }: { onPress: () => void }) {
  const c = useTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Not today" onPress={onPress} hitSlop={10} style={[s.x, { backgroundColor: c.surface2 }]}>
      <Icon name="x" size={16} color={c.muted} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: {
    position: 'absolute',
    left: 12,
    right: 12,
    maxWidth: 520,
    alignSelf: 'center',
    borderRadius: 28,
    paddingTop: 14,
    paddingBottom: 14,
    paddingHorizontal: 16,
    gap: 12,
    shadowColor: '#1C1640',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  q: { flex: 1, fontFamily: font.bodyBold, fontSize: 17, lineHeight: 22 },
  say: { flex: 1, fontFamily: font.bodySemi, fontSize: 15, lineHeight: 20 },
  x: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  opt: { flex: 1, alignItems: 'center', gap: 5, paddingVertical: 2 },
  word: { fontFamily: font.bodySemi, fontSize: 13, lineHeight: 17 },
  sos: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 50, borderRadius: 999 },
  sosT: { fontFamily: font.bodySemi, fontSize: 15 },
});
