/* The first week, looked back on (core week.ts): once, a week after the start. What the person did with their first seven
   days, big in the middle; who they said they are becoming; the next small step; Keep going at the bottom. Opening it
   marks it seen, so Today stops offering it. */
import { firstWeek, firstWeekDue, firstWeekSeen } from '@daybook/core';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';

import { EmptyChart } from '@/components/charts';
import { Flame } from '@/components/flame';
import { Dock, SceneFrame } from '@/components/scene';
import { MomentAsk, useTipMoment } from '@/components/support';
import { Button, T } from '@/components/ui';
import { close } from '@/lib/nav';
import { useStore } from '@/lib/store';
import { font, useTheme } from '@/lib/theme';

export default function Week() {
  const c = useTheme();
  const { snap, tk, apply } = useStore();
  const st = snap.settings;
  /* finishing the first week is a moment of earned value: it can carry a short tip ask (core tipMoment) */
  const ask = useTipMoment('week');
  useEffect(() => {
    if (st && firstWeekDue(st, tk)) apply({ st: firstWeekSeen(st, tk) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (!st) return null;
  const w = firstWeek(snap.days, st, tk);
  return (
    <SceneFrame title="Your first week" sky="mint" onClose={close}>
      <T v="title" style={s.c} accessibilityRole="header">
        {w.h}
      </T>
      <T style={s.c}>{w.line}</T>
      <View style={s.mid}>
        <Flame level={2} size={96} />
        {w.facts.map((f) => (
          <View key={f.one} style={s.fact} accessible accessibilityLabel={f.n + ' ' + (f.n === 1 ? f.one : f.many)}>
            <Text style={[s.n, { color: c.ink }]}>{f.n}</Text>
            <T tone="muted">{f.n === 1 ? f.one : f.many}</T>
          </View>
        ))}
        {w.facts.length ? null : <EmptyChart text="No entries yet. Each urge or check-in you log adds a line here." />}
      </View>
      {w.be ? <T style={[s.c, { fontFamily: font.bodySemi }]}>{w.be}</T> : null}
      <Dock>
        <T style={s.c}>{w.next}</T>
        {ask ? <MomentAsk why="week" onGo={close} center /> : null}
        <Button label="Keep going" onPress={close} />
      </Dock>
    </SceneFrame>
  );
}

const s = StyleSheet.create({
  c: { textAlign: 'center' },
  mid: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 8 },
  fact: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  n: { fontFamily: font.display, fontSize: 34, lineHeight: 40 },
});
