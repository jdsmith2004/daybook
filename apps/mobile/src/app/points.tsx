/* How your flame grows: what points are for, what is left to the next level, and what earns points.
   Ported from the legacy sheetPoints and pointsListHtml. */
import { gameCompute, nextLine } from '@daybook/core';
import { Redirect, router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Flame } from '@/components/flame';
import { PointsList } from '@/components/points-list';
import { closeSheet, SheetFrame, SheetH } from '@/components/sheet';
import { Bar, Button, T } from '@/components/ui';
import { Dock } from '@/components/scene';
import { useStore } from '@/lib/store';
import { font, useTheme } from '@/lib/theme';

export default function Points() {
  const c = useTheme();
  const { snap, tk } = useStore();
  const st = snap.settings;
  if (!st) return <Redirect href="/" />;
  const g = gameCompute(snap.days, st, snap.reviews, tk);
  const lvl = g.level;
  return (
    <SheetFrame title="How your flame grows" sub={`Level ${lvl.n} · ${lvl.name}`}>
      <View style={s.hero}>
        <Flame level={lvl.n} size={112} alive />
        <View style={{ flex: 1, gap: 6 }}>
          <T>
            <Text style={[s.big, { color: c.ink }]}>{g.pts.toLocaleString('en-US')}</Text> points
          </T>
          <Bar frac={lvl.frac} from={c.sun} />
          <T v="small" tone="muted">
            {nextLine(lvl)}
          </T>
        </View>
      </View>
      <T>Points are how your flame grows. You earn them for honest, small steps. They only go up, and a slip never takes any away.</T>
      <SheetH title="What earns points" />
      <PointsList />
      <Dock>
        <Button kind="ghost" label="See all twelve forms" onPress={() => router.push('/growth')} />
        <Button label="Done" onPress={closeSheet} />
      </Dock>
    </SheetFrame>
  );
}

const s = StyleSheet.create({
  hero: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  big: { fontFamily: font.display, fontSize: 30 },
});
