/* One form of the flame in detail, with its five steps. The arrows move between forms. Ported from the legacy sheetGrowth. */
import { gameCompute, LEVELS, nextLine, STAGES, stageLevel, stagePts, stageState, STEPS } from '@daybook/core';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';

import { Flame } from '@/components/flame';
import { closeSheet, SheetFrame } from '@/components/sheet';
import { Bar, Button, Card, Icon, T } from '@/components/ui';
import { Dock } from '@/components/scene';
import { useStore } from '@/lib/store';
import { font, useTheme } from '@/lib/theme';

export default function Growth() {
  const c = useTheme();
  const { stage } = useLocalSearchParams<{ stage?: string }>();
  const { snap, tk } = useStore();
  const st = snap.settings;
  const g = st ? gameCompute(snap.days, st, snap.reviews, tk) : null;
  const last = STAGES.length - 1;
  const [si, setSi] = useState(() => Math.max(0, Math.min(last, stage != null && stage !== '' ? Number(stage) || 0 : g ? g.level.stage : 0)));
  if (!st || !g) return <Redirect href="/" />;
  const lvl = g.level;
  const sg = STAGES[si];
  const state = stageState(si, lvl);
  const lp = Math.round(lvl.frac * 100);
  const nav = (d: number, label: string, text: string, off: boolean) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: off }}
      disabled={off}
      onPress={() => setSi(Math.max(0, Math.min(last, si + d)))}
      style={({ pressed }) => [s.nav, { opacity: off ? 0.4 : pressed ? 0.7 : 1 }]}>
      {d < 0 ? <Icon name="back" size={16} color={c.accentText} /> : null}
      <Text style={{ fontFamily: font.bodySemi, color: c.accentText }}>{text}</Text>
      {d > 0 ? <Icon name="next" size={16} color={c.accentText} /> : null}
    </Pressable>
  );
  return (
    <SheetFrame title={sg.name} sub={`Form ${si + 1} of ${STAGES.length}`}>
      <View style={{ alignItems: 'center', gap: 8 }}>
        <Flame level={stageLevel(si, lvl)} size={220} locked={state === 'later'} alive />
        <T style={{ textAlign: 'center', fontSize: 17, lineHeight: 22 }}>{sg.meaning}</T>
      </View>
      <Card style={{ gap: 0, paddingVertical: 4 }}>
        {sg.steps.map((_, t) => {
          const n = si * STEPS + t + 1;
          const ss = n < lvl.n ? 'done' : n === lvl.n ? 'now' : 'later';
          return (
            <View key={t} style={[s.step, t > 0 && { borderTopColor: c.line, borderTopWidth: 1 }]}>
              <Flame level={n} size={64} locked={ss === 'later'} label="" />
              <View style={{ flex: 1 }}>
                <T v="label">Level {n}</T>
                <T v="small" tone="muted">
                  {sg.steps[t]}
                </T>
              </View>
              <T v="small" tone={ss === 'done' ? 'mintText' : ss === 'now' ? 'sunText' : 'muted'} style={{ fontFamily: font.bodySemi }}>
                {ss === 'done' ? '✓ Reached' : ss === 'now' ? 'You are here' : LEVELS[n - 1][0] + ' pts'}
              </T>
            </View>
          );
        })}
      </Card>
      {state === 'now' ? (
        <View style={{ gap: 6 }}>
          <Bar frac={lp / 100} from={c.sun} />
          <T v="small" tone="muted">
            <Text style={{ fontFamily: font.bodyBold }}>{g.pts}</Text> points. {nextLine(lvl)}
          </T>
        </View>
      ) : state === 'done' ? (
        <T v="small" tone="muted" style={{ textAlign: 'center' }}>
          You have grown through this form. It stays yours.
        </T>
      ) : (
        <T v="small" tone="muted" style={{ textAlign: 'center' }}>
          This form starts at {stagePts(si)} points. You are {Math.max(0, stagePts(si) - g.pts)} away.
        </T>
      )}
      <View style={s.navRow}>
        {nav(-1, si ? 'Previous form: ' + STAGES[si - 1].name : 'No earlier form', si ? STAGES[si - 1].name : 'Start', si === 0)}
        {nav(1, si < last ? 'Next form: ' + STAGES[si + 1].name : 'No later form', si < last ? STAGES[si + 1].name : 'Top', si === last)}
      </View>
      <Dock>
        <Button label="Done" onPress={closeSheet} />
      </Dock>
    </SheetFrame>
  );
}

const s = StyleSheet.create({
  step: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  nav: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44 },
});
