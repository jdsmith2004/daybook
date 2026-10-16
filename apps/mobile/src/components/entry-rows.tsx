/* A day's entries, one row each: the time, a mark (teal round for rode it out, amber square for a slip), what happened and the
   details. Tap one to open it. Like the legacy eventRow. */
import { eventRow, sortedEvents, type DayKey } from '@daybook/core';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, T } from '@/components/ui';
import { useStore } from '@/lib/store';
import { useTheme } from '@/lib/theme';

export function EntryRows({ date }: { date: DayKey }) {
  const c = useTheme();
  const { snap } = useStore();
  const st = snap.settings!;
  return (
    <View style={{ gap: 2 }}>
      {sortedEvents(snap.days[date], st.rollover).map((e) => {
        const r = eventRow(e, st);
        return (
          <Pressable
            key={e.id}
            accessibilityRole="button"
            accessibilityLabel={`${r.time}. ${r.what}${r.meta ? '. ' + r.meta : ''}. Tap to open it.`}
            onPress={() => router.push({ pathname: '/entry', params: { date, id: e.id } })}
            style={({ pressed }) => [s.row, { borderTopColor: c.line, opacity: pressed ? 0.75 : 1 }]}>
            <T v="label" style={{ width: 76 }}>
              {r.time}
            </T>
            <View style={[s.mark, { backgroundColor: e.outcome === 'rode' ? c.mint : c.slip }, e.outcome !== 'rode' && { borderRadius: 3 }]} />
            <View style={{ flex: 1 }}>
              <T v="label">{r.what}</T>
              {r.meta ? (
                <T v="small" tone="muted">
                  {r.meta}
                </T>
              ) : null}
            </View>
            <Icon name="next" size={16} color={c.muted} />
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderTopWidth: 1, minHeight: 52 },
  mark: { width: 12, height: 12, borderRadius: 6 },
});
