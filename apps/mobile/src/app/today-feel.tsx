/* "How are you feeling today?" (core day-feel.ts): a sheet Today opens on the first open of the day. The question sits at
   the top, the flame in the middle, and the five answers low, at the thumb: one tap saves it to today's log and closes the
   sheet, with a warm word. Close, or "Not today", leaves it for the rest of the day. */
import { DAY_FEEL, DAY_FEEL_Q, dayFeelSet, gameCompute, withDay, type DayFeelStep } from '@daybook/core';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Link } from '@/components/choices';
import { Flame } from '@/components/flame';
import { Dock, Middle } from '@/components/scene';
import { Shape, type ShapeKind } from '@/components/shapes';
import { SosPill } from '@/components/sos-pill';
import { closeSheet, SheetFrame } from '@/components/sheet';
import { Text } from '@/components/text';
import { buzz } from '@/lib/feel';
import { useStore } from '@/lib/store';
import { font, useTheme, type Palette } from '@/lib/theme';

/** each answer's look: a shape from cool to warm, calm for the low ones and bright for the high ones (a hard day is never painted red, as a warning) */
const LOOK: Record<DayFeelStep, { kind: ShapeKind; tone: (c: Palette) => [string, string] }> = {
  1: { kind: 'puffy', tone: (c) => [c.violet, c.violetText] },
  2: { kind: 'oval', tone: (c) => [c.sky, c.skyText] },
  3: { kind: 'circle', tone: (c) => [c.mint, c.mintText] },
  4: { kind: 'cookie6', tone: (c) => [c.sun, c.sunText] },
  5: { kind: 'sunny', tone: (c) => [c.sun2, c.sunText] },
};

export default function TodayFeel() {
  const c = useTheme();
  const { snap, tk, update, say } = useStore();
  const st = snap.settings;
  const level = useMemo(() => (st ? gameCompute(snap.days, st, snap.reviews, tk).level.n : 1), [snap, st, tk]);

  const pick = (n: DayFeelStep) => {
    buzz('save');
    if (st) update((s0) => ({ ...s0, days: withDay(s0.days, tk, dayFeelSet(s0.days[tk], tk, n, Date.now())) }));
    closeSheet();
    say(DAY_FEEL[n - 1].say);
  };

  return (
    <SheetFrame title={DAY_FEEL_Q} sub="One tap. It goes in today’s log.">
      <View style={s.sos}>
        <SosPill label="SOS. Help with an urge right now. This question waits." />
      </View>
      <Middle>
        <Flame level={level} size={132} alive label="Your flame" />
      </Middle>
      <Dock>
        <View style={s.row}>
          {DAY_FEEL.map((a) => {
            const look = LOOK[a.n];
            const [bg, ink] = look.tone(c);
            return (
              <Pressable
                key={a.n}
                accessibilityRole="button"
                accessibilityLabel={a.w}
                accessibilityHint="Saves it in today’s log"
                onPress={() => pick(a.n)}
                style={({ pressed }) => [
                  s.opt,
                  { backgroundColor: c.surface, shadowColor: c.lip, borderColor: c.cardEdge, transform: [{ translateY: pressed ? 3 : 0 }] },
                ]}>
                <Shape kind={look.kind} size={44} color={bg} />
                <Text style={[s.word, { color: ink }]} numberOfLines={1} adjustsFontSizeToFit>
                  {a.w}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <View style={{ alignItems: 'center' }}>
          <Link label="Not today" onPress={closeSheet} />
        </View>
      </Dock>
    </SheetFrame>
  );
}

const s = StyleSheet.create({
  sos: { alignItems: 'flex-end' },
  row: { flexDirection: 'row', gap: 8, alignSelf: 'stretch' },
  opt: {
    flex: 1,
    minHeight: 96,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 2,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  word: { fontFamily: font.bodySemi, fontSize: 15, lineHeight: 19 },
});
