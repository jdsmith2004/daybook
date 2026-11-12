/* What it gave, and what it cost (core look-back.ts; Becoming free, step 2): the day after a slip, a small card floats up at the
   bottom of Today, as "How are you feeling today?" does on other days. Today shows first and stays usable behind it. Two
   taps, one question at a time, said from a little distance: "Looking back at last night, what did it give you?", then "And
   what did it cost?". The answers are a plain list, low where the thumb is. Once both are in, one line says them side by side,
   and the card closes by itself. Close leaves it: it is asked once. */
import { lookBackSay, lookBackSet, SLIP_GAVE, type LookBack, type SlipCost, type SlipGave } from '@daybook/core';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, StyleSheet, View } from 'react-native';

import { LEAD_ROOM, useSosLeadOn } from '@/components/sos-lead';
import { Text } from '@/components/text';
import { Icon } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { NATIVE, useReducedMotion } from '@/lib/motion';
import { useStore } from '@/lib/store';
import { TAB_TOP } from '@/lib/tab-room';
import { font, useTheme } from '@/lib/theme';

export function LookBackPop({ lb, onDone }: { lb: LookBack; onDone: () => void }) {
  const c = useTheme();
  const { snap, update } = useStore();
  const reduce = useReducedMotion();
  const lead = useSosLeadOn();
  const [gave, setGave] = useState<SlipGave | null>(null);
  const [cost, setCost] = useState<SlipCost | null>(null);
  const v = useRef(new Animated.Value(0)).current;
  const gone = useRef(false);
  const step: 'gave' | 'cost' | 'said' = cost ? 'said' : gave ? 'cost' : 'gave';

  useEffect(() => {
    if (reduce) v.setValue(1);
    else Animated.spring(v, { toValue: 1, friction: 9, tension: 70, useNativeDriver: NATIVE }).start();
    AccessibilityInfo.announceForAccessibility(lb.q.gave);
  }, [reduce, v, lb.q.gave]);

  const close = () => {
    if (gone.current) return;
    gone.current = true;
    if (reduce) return onDone();
    Animated.timing(v, { toValue: 0, duration: 220, easing: Easing.in(Easing.cubic), useNativeDriver: NATIVE }).start(() => onDone());
  };
  useEffect(() => {
    if (step !== 'said') return;
    const t = setTimeout(close, 3400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const save = (a: { gv: SlipGave } | { cs: SlipCost }) => {
    buzz('save');
    update((s0) => ({ ...s0, days: lookBackSet(s0.days, lb.k, lb.ev.id, a, Date.now()) }));
  };
  const said = lookBackSay(gave, cost, lb.ev, snap.settings?.rollover ?? 4);
  const list: [string, string][] = step === 'gave' ? SLIP_GAVE.map((x) => [x[0], x[1]]) : lb.costs.map((x) => [x[0], x[1]]);

  return (
    <Animated.View
      accessibilityLabel={step === 'cost' ? lb.q.cost : lb.q.gave}
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
      {step === 'said' ? (
        <Text style={[s.say, { color: c.ink }]} accessibilityLiveRegion="polite">
          {said}
        </Text>
      ) : (
        <>
          <View style={s.head}>
            <Text style={[s.q, { color: c.ink }]} accessibilityRole="header">
              {step === 'cost' ? lb.q.cost : lb.q.gave}
            </Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={close} hitSlop={10} style={[s.x, { backgroundColor: c.surface2 }]}>
              <Icon name="x" size={16} color={c.muted} />
            </Pressable>
          </View>
          <View>
            {list.map(([id, label], i) => (
              <Pressable
                key={step + id}
                accessibilityRole="button"
                accessibilityLabel={label}
                accessibilityHint="Saves it with the slip, for your pattern"
                onPress={() => {
                  if (step === 'gave') {
                    setGave(id as SlipGave);
                    save({ gv: id as SlipGave });
                    AccessibilityInfo.announceForAccessibility(lb.q.cost);
                  } else {
                    setCost(id as SlipCost);
                    save({ cs: id as SlipCost });
                    AccessibilityInfo.announceForAccessibility(lookBackSay(gave, id as SlipCost, lb.ev, snap.settings?.rollover ?? 4));
                  }
                }}
                style={({ pressed }) => [
                  s.row,
                  i ? { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.line } : null,
                  pressed ? { opacity: 0.6 } : null,
                ]}>
                <Text style={[s.opt, { color: c.ink }]}>{label}</Text>
              </Pressable>
            ))}
          </View>
        </>
      )}
    </Animated.View>
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
    paddingBottom: 6,
    paddingHorizontal: 16,
    gap: 4,
    shadowColor: '#1C1640',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingBottom: 4 },
  q: { flex: 1, fontFamily: font.bodyBold, fontSize: 17, lineHeight: 22 },
  say: { fontFamily: font.bodySemi, fontSize: 15, lineHeight: 20, paddingBottom: 8 },
  x: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  row: { minHeight: 46, justifyContent: 'center' },
  opt: { fontFamily: font.bodySemi, fontSize: 15, lineHeight: 20 },
});
