/* The proof beside the north star (core north.ts freeProof): the person's own record, said as who they are, read before they
   answer "How much do you see yourself as someone free of this?". The rows are Milestones' "Who you are becoming" (app/miles.tsx). */
import type { IdLine } from '@daybook/core';
import { StyleSheet, View } from 'react-native';

import { Icon, T } from '@/components/ui';

export function FreeProof({ lines, color, ink }: { lines: IdLine[]; color: string; ink?: string }) {
  if (!lines.length) return null;
  return (
    <View style={s.list} accessible accessibilityLabel={'What you have done: ' + lines.map((x) => x.who + ' ' + x.n).join('. ')}>
      {lines.map((x) => (
        <View key={x.who} style={s.row}>
          <Icon name={x.ic} size={20} color={color} />
          <View style={{ flex: 1 }}>
            <T v="label" style={ink ? { color: ink } : undefined}>
              {x.who}
            </T>
            <T v="small" tone="muted">
              {x.n}
            </T>
          </View>
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  list: { gap: 12, alignSelf: 'stretch' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
