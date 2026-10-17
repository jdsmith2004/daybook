/* "Your 9-day run can keep going." with a little flame */
import { StyleSheet, View } from 'react-native';

import { Icon, T } from '@/components/ui';
import { useTheme } from '@/lib/theme';

export function LineNote({ b, rest, night }: { b: string; rest: string; night?: boolean }) {
  const c = useTheme();
  return (
    <View style={[s.line, { backgroundColor: night ? 'rgba(255,255,255,0.12)' : c.slipSoft }]}>
      <Icon name="flame" color={night ? '#FFC832' : c.slip} />
      <T style={{ flex: 1 }}>
        <T v="label">{b}</T> {rest}
      </T>
    </View>
  );
}

const s = StyleSheet.create({
  line: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 16, alignSelf: 'stretch' },
});
