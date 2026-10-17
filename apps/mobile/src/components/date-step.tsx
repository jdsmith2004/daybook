/* Picking a date by days: − Thursday, Oct 22 +. Simple, works the same everywhere, and reads well with a screen reader.
   An empty date can be allowed (for "no Day 1"). */
import { addDays, fmtDate, type DayKey } from '@daybook/core';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { T } from '@/components/ui';
import { font, useTheme } from '@/lib/theme';

export function DateStep({
  label,
  value,
  min,
  from,
  onPick,
}: {
  label: string;
  value: DayKey | null;
  min?: DayKey;
  from: DayKey;
  onPick: (k: DayKey) => void;
}) {
  const c = useTheme();
  const cur = value || from;
  const step = (n: number) => {
    const next = addDays(cur, n);
    if (min && next < min) return;
    onPick(next);
  };
  const btn = (txt: string, n: number, a11y: string) => (
    <Pressable accessibilityRole="button" accessibilityLabel={a11y} onPress={() => step(n)} style={[s.sq, { borderColor: c.line, backgroundColor: c.surface }]}>
      <Text style={[s.sqT, { color: c.ink }]}>{txt}</Text>
    </Pressable>
  );
  return (
    <View style={{ gap: 6 }}>
      <T v="label">{label}</T>
      <View style={s.row}>
        {btn('−7', -7, 'A week earlier')}
        {btn('−', -1, 'A day earlier')}
        <Text style={[s.v, { color: value ? c.ink : c.muted }]} accessibilityLiveRegion="polite">
          {value ? fmtDate(value, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'Not set'}
        </Text>
        {btn('+', 1, 'A day later')}
        {btn('+7', 7, 'A week later')}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sq: { minWidth: 40, height: 40, paddingHorizontal: 6, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  sqT: { fontFamily: font.bodyBold, fontSize: 15 },
  v: { flex: 1, textAlign: 'center', fontFamily: font.bodySemi, fontSize: 15 },
});
