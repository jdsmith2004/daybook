/* The first pattern on Today (core firstPattern): one quiet line, from the third timed entry until the hard hours are
   known. It is not a task, so it has no button; a tap opens the pattern in Journal. */
import { firstPattern, type Snapshot } from '@daybook/core';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Icon, T } from '@/components/ui';
import { useTheme } from '@/lib/theme';

export function FirstPatternLine({ snap, tk }: { snap: Snapshot; tk: string }) {
  const c = useTheme();
  const line = firstPattern(snap.days, snap.settings!, tk);
  if (!line) return null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint="Opens your pattern"
      onPress={() => router.navigate({ pathname: '/journal', params: { pane: 'patterns' } })}
      style={{ flexDirection: 'row', gap: 10, alignItems: 'center', padding: 14, borderRadius: 18, backgroundColor: c.violetSoft }}>
      <Icon name="timer" size={20} color={c.violetText} />
      <View style={{ flex: 1 }}>
        <T v="small" style={{ color: c.violetText }}>
          {line}
        </T>
      </View>
    </Pressable>
  );
}
