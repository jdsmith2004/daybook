/* The live parts of a lesson, after Duolingo (the owner, November 12, 2026: "heavily use this for inspiration"): one thick bar that fills
   with a shine as each card is answered, a count of cards answered in a row that pops in once there are three, and a bar that slides up
   from the bottom after every answer, with a word of praise, the flame's reply, and the button to go on. Nothing here is graded: every
   answer is the person's own, so every answer is met the same warm way (docs/plan.md, WP11). */
import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { Icon } from '@/components/ui';
import { NATIVE, useReducedMotion } from '@/lib/motion';
import { PAPER, PAPER_INK, PAPER_LIP, RIGHT, RIGHT_LIP } from '@/lib/lesson-look';
import { font } from '@/lib/theme';

/** the bar starts a little filled: a road already begun is easier to finish (Nunes and Drèze, 2006) */
const HEAD = 0.06;

/** the lesson's bar: one thick line that fills, with a shine along its top, and the run of answers above its right end */
export function Bar({ done, total, run, fill, track }: { done: number; total: number; run: number; fill: string; track: string }) {
  const still = useReducedMotion();
  const to = HEAD + (1 - HEAD) * (total ? Math.min(1, done / total) : 0);
  const w = useRef(new Animated.Value(to)).current;
  useEffect(() => {
    if (still) w.setValue(to);
    else Animated.timing(w, { toValue: to, duration: 420, easing: Easing.out(Easing.back(1.2)), useNativeDriver: false }).start();
  }, [to, still, w]);
  const width = w.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  return (
    <View
      style={s.barRoom}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={done >= total ? 'Lesson complete' : 'Card ' + (done + 1) + ' of ' + total}
      accessibilityValue={{ min: 0, max: total, now: done }}>
      <Run n={run} color={fill} />
      <View style={[s.bar, { backgroundColor: track }]}>
        <Animated.View style={[s.barIn, { width, backgroundColor: fill }]}>
          <View style={s.shine} />
        </Animated.View>
      </View>
    </View>
  );
}

/** the run: "3 in a row" once three cards in a row are answered, popping each time it grows */
function Run({ n, color }: { n: number; color: string }) {
  const still = useReducedMotion();
  const pop = useRef(new Animated.Value(n >= 3 ? 1 : 0)).current;
  useEffect(() => {
    if (n < 3) return pop.setValue(0);
    if (still) return pop.setValue(1);
    pop.setValue(0.4);
    Animated.spring(pop, { toValue: 1, friction: 4, tension: 160, useNativeDriver: NATIVE }).start();
  }, [n, still, pop]);
  return (
    <Animated.View
      pointerEvents="none"
      style={[s.run, { opacity: pop.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 1, 1] }), transform: [{ scale: pop }] }]}>
      <Icon name="flame" size={13} color={color} />
      <Text style={[s.runT, { color }]}>{n} in a row</Text>
    </Animated.View>
  );
}

/** the words of praise on the bar, picked by the card so the same card always says the same thing */
const PRAISE = ['Nice.', 'Good.', 'Well said.', 'Yes.', 'Nicely done.', 'Good one.'];
export const praiseFor = (k: number, run: number) => (run === 5 ? 'Five in a row.' : run === 10 ? 'Ten in a row.' : PRAISE[k % PRAISE.length]);

/** the bar that slides up from the bottom once a card is answered: a word of praise with a tick, the flame's reply, and the button.
    It covers the low part of the screen, as Duolingo's does, so the next step is the only thing to do. */
export function Praise({
  show,
  word,
  say,
  label,
  onNext,
  onMore,
  inset,
}: {
  show: boolean;
  word: string;
  say?: string;
  label: string;
  onNext: () => void;
  onMore?: () => void;
  inset: number;
}) {
  const still = useReducedMotion();
  const v = useRef(new Animated.Value(show ? 1 : 0)).current;
  useEffect(() => {
    if (still) v.setValue(show ? 1 : 0);
    else Animated.timing(v, { toValue: show ? 1 : 0, duration: show ? 260 : 160, easing: Easing.out(Easing.cubic), useNativeDriver: NATIVE }).start();
  }, [show, still, v]);
  if (!show) return null;
  return (
    <Animated.View
      accessibilityLiveRegion="polite"
      style={[s.praise, { paddingBottom: inset + 12, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [220, 0] }) }] }]}>
      <View style={s.praiseHead}>
        <View style={s.tick}>
          <Icon name="check" size={16} color="#FFFFFF" />
        </View>
        <Text style={s.praiseW} accessibilityRole="header">
          {word}
        </Text>
        {onMore ? (
          <Pressable accessibilityRole="button" onPress={onMore} hitSlop={10} style={s.more}>
            <Text style={s.moreT}>More</Text>
          </Pressable>
        ) : null}
      </View>
      {say ? <Text style={s.praiseSay}>{say}</Text> : null}
      <Go label={label} onPress={onNext} />
    </Animated.View>
  );
}

/** the green button with its lip, on the praise bar */
export function Go({ label, onPress, icon }: { label: string; onPress: () => void; icon?: ReactNode }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [s.go, { shadowOffset: { width: 0, height: pressed ? 1 : 4 }, transform: [{ translateY: pressed ? 3 : 0 }] }]}>
      <Text style={s.goT} numberOfLines={2}>
        {label}
      </Text>
      {icon}
    </Pressable>
  );
}

/** two answers side by side, low on the card: how a card lands with the person. Neither is the right one. */
export function React2({ list, pk, onPick }: { list: [string, string]; pk: number | null; onPick: (j: number) => void }) {
  return (
    <View style={s.two}>
      {list.map((o, j) => {
        const on = pk === j;
        const off = pk != null && !on;
        return (
          <Pressable
            key={j}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            onPress={() => onPick(j)}
            style={({ pressed }) => [s.chip, on ? s.chipOn : off ? s.chipOff : s.chipIdle, { transform: [{ translateY: pressed && !on ? 2 : 0 }] }]}>
            <Text style={[s.chipT, { color: on ? '#FFFFFF' : PAPER_INK, opacity: off ? 0.6 : 1 }]}>{o}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** the lines of what to do, as a pick: the one the person will try lights green, the rest step back */
export function PickLine({
  list,
  pk,
  onPick,
  render,
}: {
  list: string[];
  pk: number | null;
  onPick: (j: number) => void;
  render: (x: string, on: boolean) => ReactNode;
}) {
  return (
    <View style={{ gap: 8 }}>
      {list.map((x, j) => {
        const on = pk === j;
        const off = pk != null && !on;
        return (
          <Pressable
            key={j}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            onPress={() => onPick(j)}
            style={({ pressed }) => [s.line, on ? s.chipOn : off ? s.chipOff : s.chipIdle, { transform: [{ translateY: pressed && !on ? 2 : 0 }] }]}>
            {render(x, on)}
            {on ? (
              <View style={s.lineTick}>
                <Icon name="check" size={18} color="#FFFFFF" />
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  barRoom: { flex: 1, justifyContent: 'center', minHeight: 44 },
  bar: { height: 16, borderRadius: 8, overflow: 'hidden' },
  barIn: { height: 16, borderRadius: 8, overflow: 'hidden' },
  shine: { position: 'absolute', left: 8, right: 8, top: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.45)' },
  run: { position: 'absolute', right: 0, top: -6, flexDirection: 'row', alignItems: 'center', gap: 2 },
  runT: { fontFamily: font.bodyBold, fontSize: 12, lineHeight: 14 },
  praise: {
    gap: 8,
    paddingTop: 16,
    paddingHorizontal: 16,
    backgroundColor: '#E9F8EF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  praiseHead: { flexDirection: 'row', alignItems: 'center', gap: 8, width: '100%', maxWidth: 520, alignSelf: 'center' },
  tick: { width: 28, height: 28, borderRadius: 14, backgroundColor: RIGHT, alignItems: 'center', justifyContent: 'center' },
  praiseW: { flex: 1, fontFamily: font.display, fontSize: 22, lineHeight: 28, color: RIGHT_LIP },
  praiseSay: { fontFamily: font.bodySemi, fontSize: 17, lineHeight: 24, color: '#0B4A36', width: '100%', maxWidth: 520, alignSelf: 'center' },
  more: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 4 },
  moreT: { fontFamily: font.bodySemi, fontSize: 15, lineHeight: 20, color: RIGHT_LIP, textDecorationLine: 'underline' },
  go: {
    marginTop: 4,
    minHeight: 56,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 28,
    backgroundColor: RIGHT,
    shadowColor: RIGHT_LIP,
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  goT: { fontFamily: font.display, fontSize: 17, lineHeight: 22, color: '#FFFFFF', textAlign: 'center' },
  two: { flexDirection: 'row', gap: 8 },
  chip: {
    flex: 1,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 0,
  },
  chipIdle: { backgroundColor: PAPER, shadowColor: PAPER_LIP, shadowOpacity: 1 },
  chipOn: { backgroundColor: RIGHT, shadowColor: RIGHT_LIP, shadowOpacity: 1 },
  chipOff: { backgroundColor: 'rgba(255,255,255,0.55)', shadowOpacity: 0 },
  chipT: { fontFamily: font.bodySemi, fontSize: 15, lineHeight: 20, textAlign: 'center' },
  line: {
    minHeight: 54,
    justifyContent: 'center',
    paddingVertical: 10,
    paddingLeft: 16,
    paddingRight: 40,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 0,
  },
  lineTick: { position: 'absolute', right: 12, top: 0, bottom: 0, justifyContent: 'center' },
});
