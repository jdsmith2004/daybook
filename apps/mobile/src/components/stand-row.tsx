/* The standing row on Today (core standRow): a small flame, the one number that holds what was earned, and one line with
   the flame's form. It opens Milestones, where the level, points, badges and every form live. */
import { standRow, type GameState, type Snapshot } from '@daybook/core';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { GradFlame } from '@/components/grad';
import { Text } from '@/components/text';
import { Icon } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { font, useTheme } from '@/lib/theme';

export function StandRow({ g, snap, tk, now }: { g: GameState; snap: Snapshot; tk: string; now: number }) {
  const c = useTheme();
  const r = standRow(snap.days, snap.settings!, tk, now, g.level.name);
  if (!r) return null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={r.say + ' Opens Milestones.'}
      onPress={() => {
        buzz('tap');
        router.push('/miles');
      }}
      style={({ pressed }) => [s.row, { backgroundColor: c.surface, borderColor: c.cardEdge, shadowColor: c.shadow, opacity: pressed ? 0.85 : 1 }]}>
      <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        <GradFlame level={g.level.n} size={60} alive={false} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[s.big, { color: c.ink }]}>{r.big}</Text>
        <Text style={[s.line, { color: c.muted }]}>{r.line}</Text>
      </View>
      <Icon name="next" size={20} color={c.muted} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 24,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 2,
  },
  big: { fontFamily: font.display, fontSize: 22, lineHeight: 27 },
  line: { fontFamily: font.bodyMedium, fontSize: 14, lineHeight: 19 },
});
