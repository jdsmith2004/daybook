/* What earns points, in one place (the points sheet and Milestones both show it): five plain lines, and every rule one tap
   away. From the legacy pointsListHtml. */
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';

import { T } from '@/components/ui';
import { font, useTheme } from '@/lib/theme';

export const POINTS_LIST: [string, string][] = [
  ['+5', 'every honest log (up to 5 a day)'],
  ['+10', 'each urge you ride out (up to 6 a day)'],
  ['+10', 'pausing 10 minutes first (up to 3 a day)'],
  ['+10', 'a small step within the hour of a slip (up to 3 a day)'],
  ['+10', 'saving the evening check-in'],
  ['+10', 'reaching out to someone'],
  ['+10', 'finishing the wind-down'],
  ['+5', 'screens off on time (Good night before your screens-off time)'],
  ['+5', 'each calm move from the tools, or a pause you end early (up to 3 a day)'],
  ['+10', 'each lesson you finish (once per lesson)'],
  ['+5', 'putting your phone away at night'],
  ['+5', 'reading a lesson again (up to 2 a day)'],
  ['+15', 'looking back right after a slip: what came before, and a plan'],
  ['+20', 'finishing all three Rekindle missions'],
  ['+5', 'waiting at least 5 minutes before a slip (up to 2 a day)'],
  ['+20', 'each weekly review you write'],
  ['+20', 'finishing setup (once)'],
];

/** the short version */
export const POINTS_SHORT: [string, string][] = [
  ['+5', 'each honest log, slips included'],
  ['+10', 'each urge you ride out, and more for pausing first'],
  ['+10–15', 'each part of your day: a lesson, the check-in, the wind-down'],
  ['+10–20', 'the comeback after a slip: a small step, looking back, Rekindle'],
  ['+20', 'each weekly review you write'],
];

export function PointsList() {
  const c = useTheme();
  const [all, setAll] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      {(all ? POINTS_LIST : POINTS_SHORT).map(([p, t], i) => (
        <View key={(all ? 'a' : 's') + i} style={s.li}>
          <Text style={[s.pt, { color: c.mintText }]}>{p}</Text>
          <T style={{ flex: 1 }}>{t}</T>
        </View>
      ))}
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: all }}
        onPress={() => setAll(!all)}
        hitSlop={8}
        style={{ minHeight: 32, justifyContent: 'center' }}>
        <T v="small" style={{ fontFamily: font.bodySemi, color: c.accentText }}>
          {all ? 'Show the short version' : 'See every rule'}
        </T>
      </Pressable>
      <T v="small" tone="muted">
        Nothing ever takes points away. A slip never lowers your points, your level, or a badge. Honesty earns points either way.
      </T>
    </View>
  );
}

const s = StyleSheet.create({
  li: { flexDirection: 'row', gap: 10, alignItems: 'baseline' },
  pt: { fontFamily: font.bodyBold, fontSize: 15, minWidth: 52 },
});
