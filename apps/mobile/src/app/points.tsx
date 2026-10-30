/* How your flame grows: what points are for, what is left to the next level, points each day, and what earns points.
   Ported from the legacy sheetPoints and pointsListHtml. */
import { addDays, gameCompute, nextLine } from '@daybook/core';
import { Redirect, router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';

import { DayColumns, EmptyChart } from '@/components/charts';
import { Link } from '@/components/choices';
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
  const keys = Array.from({ length: 30 }, (_, i) => addDays(tk, i - 29)).filter((k) => k >= st.start);
  const month = keys.reduce((a, k) => a + (g.perDay[k] || 0), 0);
  return (
    <SheetFrame title="How your flame grows" sub={`Level ${lvl.n} · ${lvl.name}`}>
      <View style={s.hero}>
        <Flame level={lvl.n} size={196} alive />
        {/* the number is its own line of text: inside a body line, iOS gives it the body's short line and cuts off its top */}
        <View style={s.pts} accessible accessibilityLabel={`${g.pts.toLocaleString('en-US')} points`}>
          <Text style={[s.big, { color: c.ink }]}>{g.pts.toLocaleString('en-US')}</Text>
          <T>points</T>
        </View>
        <View style={{ alignSelf: 'stretch', gap: 8 }}>
          <Bar frac={lvl.frac} from={c.sun} />
          <T v="small" tone="muted" style={{ textAlign: 'center' }}>
            {nextLine(lvl)}
          </T>
        </View>
      </View>
      {month ? (
        <>
          <SheetH title="Points each day" />
          <DayColumns keys={keys} rows={keys.map((k) => ({ a: g.perDay[k] || 0 }))} tk={tk} label="Points earned each day, the last 30 days" />
          <T v="small" tone="muted">
            {month.toLocaleString('en-US')} points in the last 30 days.
          </T>
        </>
      ) : (
        <>
          <SheetH title="Points each day" />
          <EmptyChart text="No points yet. Each honest, small step adds a column here." />
        </>
      )}
      <SheetH title="What earns points" />
      <PointsList />
      <Dock>
        <Button label="Done" onPress={closeSheet} />
        <View style={{ alignItems: 'center' }}>
          <Link label="See all twelve forms" onPress={() => router.push('/growth')} />
        </View>
      </Dock>
    </SheetFrame>
  );
}

const s = StyleSheet.create({
  hero: { alignItems: 'center', gap: 8 },
  pts: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  big: { fontFamily: font.display, fontSize: 34, lineHeight: 41 },
});
