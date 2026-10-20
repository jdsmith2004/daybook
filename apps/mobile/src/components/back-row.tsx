/* After Welcome back was closed twice with the gap unanswered: one quiet row on Today that opens it again, never a card that
   asks every day (core away.ts) */
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Icon, T } from '@/components/ui';
import { useTheme } from '@/lib/theme';

export function BackRow({ n }: { n: number }) {
  const c = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${n} days while you were away are not known. Fill them in.`}
      onPress={() => router.push('/back')}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 16, backgroundColor: c.surface2 }}>
      <Icon name="calendar" size={18} color={c.muted} />
      <View style={{ flex: 1 }}>
        <T v="small" tone="muted">
          {n} {n === 1 ? 'day' : 'days'} away not known yet
        </T>
      </View>
      <T v="small" style={{ color: c.accentText, textDecorationLine: 'underline' }}>
        Fill in
      </T>
    </Pressable>
  );
}
