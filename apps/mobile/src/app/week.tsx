/* The first week, looked back on (core week.ts): once, a week after the start. What the person did with their first seven
   days, big in the middle; who they said they are becoming; the next small step; Keep going at the bottom. Opening it
   marks it seen, so Today stops offering it. */
import { firstWeek, firstWeekDue, firstWeekSeen, gameCompute } from '@daybook/core';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';

import { FitArt } from '@/components/fit';
import { FlameMedallion } from '@/components/flame-medallion';
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
  const level = gameCompute(snap.days, st, snap.reviews, tk).level.n;
  return (
    <SceneFrame title="Your first week" sky="mint" onClose={close} pin={<Button label="Keep going" onPress={close} />}>
      <T v="title" style={s.c} accessibilityRole="header">
        {w.h}
      </T>
      <T style={s.c}>{w.line}</T>
      {/* the flame, big: this week is what fed it */}
      <View style={s.mid}>
        <FitArt min={0.55}>
          <FlameMedallion level={level} size={196} />
        </FitArt>
        {w.facts.length ? (
          <View style={s.facts}>
            {w.facts.map((f) => (
              <View
                key={f.one}
                style={[s.fact, { width: w.facts.length === 4 ? '22%' : '29%' }]}
                accessible
                accessibilityLabel={f.n + ' ' + (f.n === 1 ? f.one : f.many)}>
                <Text style={[s.n, { color: c.ink }]}>{f.n}</Text>
                <T v="small" tone="muted" style={s.c}>
                  {f.n === 1 ? f.one : f.many}
                </T>
              </View>
            ))}
          </View>
        ) : (
          <T tone="muted" style={s.c}>
            Each urge or check-in you log adds a line here.
          </T>
        )}
      </View>
      {w.be ? <T style={[s.c, { fontFamily: font.bodySemi }]}>{w.be}</T> : null}
      <Dock>
        <T style={s.c}>{w.next}</T>
        {ask ? <MomentAsk why="week" onGo={close} center /> : null}
      </Dock>
    </SceneFrame>
  );
}

const s = StyleSheet.create({
  c: { textAlign: 'center' },
  mid: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingVertical: 8 },
  facts: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', columnGap: 8, rowGap: 8, alignSelf: 'stretch' },
  fact: { alignItems: 'center' },
  n: { fontFamily: font.display, fontSize: 28, lineHeight: 34 },
});
