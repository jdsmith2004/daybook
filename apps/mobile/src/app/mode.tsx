/* Where I am: tracking week, quitting, stepping down, or just tracking. What each one means, and a way to change it.
   Ported from the legacy sheetMode. */
import { addDays, MODE_LEGEND, modeActs, modeInfo, setDate, setDay1 } from '@daybook/core';
import { Redirect } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { DateStep } from '@/components/date-step';
import { closeSheet, SheetFrame, SheetH } from '@/components/sheet';
import { Button, Card, Chip, T } from '@/components/ui';
import { useStore } from '@/lib/store';
import { useTheme } from '@/lib/theme';

export default function Mode() {
  const c = useTheme();
  const { snap, tk, apply } = useStore();
  const st = snap.settings;
  if (!st) return <Redirect href="/" />;
  const mi = modeInfo(st, tk);
  const acts = modeActs(st, tk, mi.k);
  const showDate = mi.k !== 'before';
  return (
    <SheetFrame title="Where I am" sub="Tracking week, quitting, or just tracking">
      <Card>
        <T v="h2">{mi.title}</T>
        <T tone="muted">{mi.line}</T>
      </Card>
      <View style={{ gap: 8 }}>
        {MODE_LEGEND(st).map(([k, name, text]) => (
          <View key={k} style={[s.li, { backgroundColor: k === mi.k ? c.accentSoft : c.surface, borderColor: k === mi.k ? c.accent : c.cardEdge }]}>
            <T v="label">
              {name}
              {k === mi.k ? <T v="small" tone="accentText">{'  you are here'}</T> : null}
            </T>
            <T v="small" tone="muted">
              {text}
            </T>
          </View>
        ))}
      </View>
      {acts.length || showDate ? <SheetH title="Change it" /> : null}
      {acts.length ? (
        <View style={s.acts}>
          {acts.map(([label, v]) => (
            <Chip key={v} label={label} on={false} onPress={() => apply(setDay1(st, v, tk))} />
          ))}
        </View>
      ) : null}
      {showDate ? (
        <DateStep
          label={mi.k === 'quit' || mi.k === 'step' ? 'Change the date of Day 1' : 'Or pick a date for Day 1'}
          value={st.day1}
          min={addDays(st.start, 1)}
          from={addDays(tk > st.start ? tk : st.start, 1)}
          onPick={(k) => apply(setDate(st, 'day1', k))}
        />
      ) : null}
      <T v="small" tone="muted">
        Your log is never touched. You can change this whenever you like.
      </T>
      <Button label="Done" onPress={closeSheet} />
    </SheetFrame>
  );
}

const s = StyleSheet.create({
  li: { gap: 4, padding: 12, borderRadius: 16, borderWidth: 1.5 },
  acts: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
