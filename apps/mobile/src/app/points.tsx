/* How your flame grows: what points are for, what is left to the next level, today's wins, and what earns points.
   Ported from the legacy sheetPoints and pointsListHtml. */
import { gameCompute, nextLine, WINS } from '@daybook/core';
import { Redirect, router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Flame } from '@/components/flame';
import { PointsList } from '@/components/points-list';
import { closeSheet, SheetFrame, SheetH } from '@/components/sheet';
import { Bar, Button, Icon, T } from '@/components/ui';
import { useStore } from '@/lib/store';
import { font, useTheme } from '@/lib/theme';

export default function Points() {
  const c = useTheme();
  const { snap, tk } = useStore();
  const st = snap.settings;
  if (!st) return <Redirect href="/" />;
  const g = gameCompute(snap.days, st, snap.reviews, tk);
  const lvl = g.level;
  const w = g.wins;
  const rows = WINS.filter((x) => !(w.na && w.na[x.k]) || w[x.k]);
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
      {rows.length ? (
        <>
          <SheetH title="Today’s wins" aside={`${g.tally.n} of ${g.tally.t} done`} />
          {rows.map((x) => {
            const on = !!w[x.k];
            return (
              <View key={x.k} style={[s.win, { backgroundColor: on ? c.mintSoft : c.surface }]}>
                <View style={[s.wc, { backgroundColor: on ? c.mint : c.surface2 }]}>
                  <Icon name={on ? 'check' : x.ic} size={18} color={on ? '#FFFFFF' : c.muted} />
                </View>
                <View style={{ flex: 1 }}>
                  <T v="label">{x.name}</T>
                  <T v="small" tone="muted">
                    {x.tip}
                  </T>
                </View>
                <T v="small" tone={on ? 'mintText' : 'muted'} style={{ fontFamily: font.bodySemi }}>
                  {on ? 'Done' : 'Not yet'}
                </T>
              </View>
            );
          })}
        </>
      ) : null}
      <SheetH title="What earns points" />
      <PointsList />
      <View style={s.actions}>
        <Button kind="ghost" label="See all twelve forms" onPress={() => router.push('/growth')} />
        <Button label="Done" onPress={closeSheet} />
      </View>
    </SheetFrame>
  );
}

const s = StyleSheet.create({
  hero: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  big: { fontFamily: font.display, fontSize: 30 },
  win: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 16 },
  wc: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  actions: { gap: 8 },
});
