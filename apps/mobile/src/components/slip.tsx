/* The pieces of the comeback after a slip (log.tsx; the rules and the research are in core slip.ts): the one column of
   choices (docs/design-standards.md: a small shape in the choice's color, the name, a line on it, and a chevron; a tap
   starts it), and SOS, big, on the page that makes it the plan. */
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import Reanimated, { useAnimatedStyle } from 'react-native-reanimated';

import { Shape, type ShapeKind } from '@/components/shapes';
import { Text } from '@/components/text';
import { Icon } from '@/components/ui';
import { breathAt, useBreathClock, webDeps, type Steps } from '@/lib/breath';
import { buzz } from '@/lib/feel';
import { useReducedMotion } from '@/lib/motion';
import { font, toneOf, useTheme } from '@/lib/theme';

const BIG = 148;
const BREATH: Steps = [
  ['in', 4],
  ['out', 6],
];
/** the plan after a slip is this button: the same round SOS as the one on the tab bar, big, on a slow breath, and it works */
export function SosBig() {
  const c = useTheme();
  const reduce = useReducedMotion();
  const clock = useBreathClock(0, !reduce);
  const ring = useAnimatedStyle(() => {
    const f = reduce ? 0.5 : breathAt(BREATH, clock.value)[0];
    return { transform: [{ scale: 1.08 + 0.14 * f }] };
  }, webDeps(reduce));
  return (
    <View style={s.bigWrap}>
      <Reanimated.View style={[s.bigRing, { backgroundColor: c.sos }, ring]} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open SOS now"
        onPress={() => {
          buzz('tap');
          router.push('/sos');
        }}>
        {({ pressed }) => (
          <View
            style={[
              s.big,
              {
                backgroundColor: c.sosLow,
                shadowColor: c.sosDeep,
                shadowOffset: { width: 0, height: pressed ? 3 : 7 },
                transform: [{ translateY: pressed ? 4 : 0 }],
              },
            ]}>
            <LinearGradient colors={[c.sos, c.sosLow]} style={[StyleSheet.absoluteFill, s.round]} />
            <Text maxFontSizeMultiplier={1.15} style={[s.bigWord, { color: c.sosInk }]}>
              SOS
            </Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

export interface ChoiceRow {
  id: string;
  name: string;
  sub?: string;
  icon: string;
  tone: string;
  shape?: ShapeKind;
  /** a line under the name in the tone's color: what has worked before */
  tag?: string;
}
/** one column of choices; a tap picks it and moves on */
export function ChoiceRows({ list, onPick }: { list: ChoiceRow[]; onPick: (id: string) => void }) {
  const c = useTheme();
  return (
    <View style={s.list}>
      {list.map((x, j) => {
        const tn = toneOf(c, x.tone);
        /* on a dark sky the shape takes the tone's bright color, so it reads */
        const dark = c.scheme === 'dark';
        return (
          <Pressable
            key={x.id}
            accessibilityRole="button"
            accessibilityLabel={x.name + (x.sub ? '. ' + x.sub : '') + (x.tag ? '. ' + x.tag : '')}
            onPress={() => {
              buzz('tap');
              onPick(x.id);
            }}
            style={({ pressed }) => [s.row, { backgroundColor: c.surface, shadowColor: c.lip, transform: [{ translateY: pressed ? 3 : 0 }] }]}>
            <Shape kind={x.shape || 'cookie9'} size={40} color={dark ? tn.ic : tn.soft} turn={j * 17}>
              <View>
                <Icon name={x.icon} size={20} color={dark ? '#1C2030' : tn.text} />
              </View>
            </Shape>
            <View style={{ flex: 1, gap: 1 }}>
              <Text style={[s.name, { color: c.ink }]}>{x.name}</Text>
              {x.sub ? <Text style={[s.sub, { color: c.muted }]}>{x.sub}</Text> : null}
              {x.tag ? <Text style={[s.sub, { color: dark ? tn.ic : tn.text, fontFamily: font.bodySemi }]}>{x.tag}</Text> : null}
            </View>
            <Icon name="next" size={18} color={c.muted} />
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  bigWrap: { width: BIG * 1.3, height: BIG * 1.3, alignItems: 'center', justifyContent: 'center' },
  bigRing: { position: 'absolute', width: BIG, height: BIG, borderRadius: BIG / 2, opacity: 0.16 },
  big: { width: BIG, height: BIG, borderRadius: BIG / 2, alignItems: 'center', justifyContent: 'center', shadowOpacity: 1, shadowRadius: 0, elevation: 6 },
  round: { borderRadius: BIG / 2 },
  bigWord: { fontFamily: font.display, fontSize: 48, lineHeight: 56 },
  list: { alignSelf: 'stretch', gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 58,
    borderRadius: 20,
    paddingVertical: 9,
    paddingHorizontal: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  name: { fontFamily: font.bodySemi, fontSize: 17, lineHeight: 22 },
  sub: { fontFamily: font.body, fontSize: 13, lineHeight: 18 },
});
