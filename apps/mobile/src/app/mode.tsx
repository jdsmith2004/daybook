/* Where I am: tracking week, quitting, stepping down, or just tracking. What each one means, and a way to change it.
   Ported from the legacy sheetMode. */
import { addDays, changeSettings, fmtDate, MODE_LEGEND, modeActs, modeInfo, setDate, setDay1, type Change } from '@daybook/core';
import { Redirect } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { DateStep } from '@/components/date-step';
import { closeSheet, SheetFrame, SheetH } from '@/components/sheet';
import { Button, Card, Chip, T } from '@/components/ui';
import { Dock } from '@/components/scene';
import { useStore } from '@/lib/store';
import { useTheme } from '@/lib/theme';

export default function Mode() {
  const c = useTheme();
  const { snap, tk, apply, say } = useStore();
  const st = snap.settings;
  if (!st) return <Redirect href="/" />;
  const mi = modeInfo(st, tk);
  const acts = modeActs(st, tk, mi.k);
  const showDate = mi.k !== 'before';
  /* a change to the mode or to Day 1 says what happened and offers Undo, which puts the old Day 1 back (and only that, so
     anything else changed meanwhile stays) */
  const change = (ch: Change) => {
    const before = { day1: st.day1, d1Hand: st.d1Hand };
    apply({ st: ch.st });
    const d1 = ch.st.day1;
    const text = ch.toast || (d1 ? 'Day 1 is ' + fmtDate(d1, { weekday: 'long', month: 'short', day: 'numeric' }) + '.' : 'Day 1 is not set.');
    say(text, () =>
      apply((cur) => ({
        st: changeSettings(cur, (x) => {
          x.day1 = before.day1;
          x.d1Hand = before.d1Hand;
        }),
      })),
    );
  };
  return (
    <SheetFrame title="Where I am">
      <View style={{ gap: 2 }}>
        <T v="h2">{mi.title}</T>
        <T tone="muted">{mi.line}</T>
      </View>
      <Card style={{ gap: 0, paddingVertical: 4 }}>
        {MODE_LEGEND(st).map(([k, name, text], i) => (
          <View key={k} style={[s.li, i > 0 && { borderTopColor: c.line, borderTopWidth: 1 }]}>
            <T v="label" tone={k === mi.k ? 'accentText' : 'ink'}>
              {name}
              {k === mi.k ? '  ·  you are here' : ''}
            </T>
            <T v="small" tone="muted">
              {text}
            </T>
          </View>
        ))}
      </Card>
      <T v="small" tone="muted">
        Your log is never touched. You can change this whenever you like.
      </T>
      <Dock>
        {acts.length || showDate ? <SheetH title="Change it" /> : null}
        {acts.length ? (
          <View style={s.acts}>
            {acts.map(([label, v]) => (
              <Chip key={v} label={label} on={false} onPress={() => change(setDay1(st, v, tk))} />
            ))}
          </View>
        ) : null}
        {showDate ? (
          <DateStep
            label={mi.k === 'quit' || mi.k === 'step' ? 'Change the date of Day 1' : 'Or pick a date for Day 1'}
            value={st.day1}
            min={addDays(st.start, 1)}
            from={addDays(tk > st.start ? tk : st.start, 1)}
            onPick={(k) => change(setDate(st, 'day1', k))}
          />
        ) : null}
        <Button label="Done" onPress={closeSheet} />
      </Dock>
    </SheetFrame>
  );
}

const s = StyleSheet.create({
  li: { gap: 4, paddingVertical: 12 },
  acts: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
