/* One week by the person's own weeks, looked back on: the counts, the average ratings against last week, what the week
   shows, and the four answers of an older weekly review, when there is one (the Sunday review took its place, see
   sunday.ts). Used in Journal > Weeks and on its own page. Ported from the legacy weekBody. */
import { fmtDate, REVIEW_QS, setDay1, weekView } from '@daybook/core';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';

import { Spark } from '@/components/charts';
import { Card, Chip, Icon, T } from '@/components/ui';
import { useStore } from '@/lib/store';
import { font, useTheme } from '@/lib/theme';

export function WeekView({ k, onNav }: { k: number; onNav: (k: number) => void }) {
  const c = useTheme();
  const { snap, tk, apply } = useStore();
  const st = snap.settings!;
  const v = weekView(snap.days, st, tk, k);
  const w = v.w;
  const rv = snap.reviews['w' + v.wk];
  const a = rv ? rv.a : { hard: '', helped: '', change: '', proud: '' };
  const tile = (l: string, b: string | number, sub?: string) => (
    <View key={l} style={[s.stat, { backgroundColor: c.surface, borderColor: c.cardEdge }]}>
      <T v="small" tone="muted">
        {l}
      </T>
      <Text style={[s.statB, { color: c.ink }]}>{b}</Text>
      {sub ? (
        <T v="small" tone="muted">
          {sub}
        </T>
      ) : null}
    </View>
  );
  const nav = (d: number, label: string, off: boolean) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: off }}
      disabled={off}
      onPress={() => onNav(v.wk + d)}
      style={[s.nav, { borderColor: c.line, backgroundColor: c.surface, opacity: off ? 0.4 : 1 }]}>
      <Icon name={d < 0 ? 'back' : 'next'} size={18} color={c.ink} />
    </Pressable>
  );
  return (
    <>
      <View style={s.head}>
        <View style={{ flex: 1 }}>
          <T v="h2" accessibilityRole="header">
            Week {v.wk + 1}
          </T>
          <T tone="muted">{v.range}</T>
        </View>
        {nav(-1, 'Earlier week', v.wk === 0)}
        {nav(1, 'Later week', v.wk >= v.cw)}
      </View>
      <View style={s.stats}>
        {tile('Check-ins', w.checkins + ' of 7')}
        {tile('Entries', w.events)}
        {tile('Rode it out', w.rode)}
        {tile('Slipped', w.slipped, w.slipDays ? w.slipDays + ' day' + (w.slipDays === 1 ? '' : 's') : '')}
      </View>
      <Card>
        <View style={s.between}>
          <T v="h2">Average ratings</T>
          <T v="small" tone="muted">
            0 to 10
          </T>
        </View>
        <View style={s.stats}>
          {v.avgs.map((x) => (
            <View key={x.f} style={[s.stat, { backgroundColor: c.surface2, borderColor: c.surface2 }]}>
              <T v="small" tone="muted">
                {x.l}
              </T>
              <Text style={[s.statB, { color: c.ink }]}>{x.v}</Text>
              <T v="small" tone="muted">
                {x.move || ' '}
              </T>
              {x.vals.some((y) => y != null) ? <Spark vals={x.vals} label={x.l + ' each day this week'} /> : null}
            </View>
          ))}
        </View>
      </Card>
      <Card>
        <T v="h2">What the week shows</T>
        {v.shows.map(([dt, dd]) => (
          <View key={dt} style={{ gap: 2 }}>
            <T v="small" tone="muted">
              {dt}
            </T>
            <T v="label">{dd}</T>
          </View>
        ))}
      </Card>
      {v.wk === 0 ? (
        <Card tone="note">
          <T v="h2">What comes next</T>
          <T>
            This first week is for noticing. Nothing is counted yet, so there is nothing to fail. When it ends, you choose: start counting days (Day 1), or keep
            tracking without counting. Both are fine.
          </T>
          <T v="label">
            {st.day1
              ? 'Day 1 of quitting is set for ' + fmtDate(st.day1, { weekday: 'long', month: 'short', day: 'numeric' }) + '.'
              : 'No Day 1 is set. You are just tracking for now.'}
          </T>
          <View style={s.chips}>
            {st.day1 ? (
              <>
                <Chip label="Move it a week later" on={false} onPress={() => apply(setDay1(st, 'later', tk))} />
                <Chip label="Not yet, keep tracking" on={false} onPress={() => apply(setDay1(st, 'none', tk))} />
              </>
            ) : (
              <>
                <Chip label="Start Day 1 tomorrow" on={false} onPress={() => apply(setDay1(st, 'tomorrow', tk))} />
                <Chip label="Start in a week" on={false} onPress={() => apply(setDay1(st, 'week', tk))} />
              </>
            )}
          </View>
          <Text
            accessibilityRole="link"
            onPress={() => router.push('/mode')}
            style={{ fontFamily: font.bodySemi, color: c.accentText, textDecorationLine: 'underline' }}>
            What is the difference?
          </Text>
        </Card>
      ) : null}
      {REVIEW_QS.some(([id]) => a[id].trim()) ? (
        <Card>
          <T v="h2">My review</T>
          {REVIEW_QS.filter(([id]) => a[id].trim()).map(([id, label]) => (
            <View key={id} style={{ gap: 2 }}>
              <T v="small" tone="muted">
                {label}
              </T>
              <T>{a[id]}</T>
            </View>
          ))}
        </Card>
      ) : null}
    </>
  );
}

const s = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nav: { width: 44, height: 44, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stat: { flexGrow: 1, flexBasis: '45%', gap: 2, padding: 12, borderRadius: 16, borderWidth: 1.5 },
  statB: { fontFamily: font.display, fontSize: 26 },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
