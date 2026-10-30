/* One week by the person's own weeks, looked back on: the counts, the average ratings against last week, what the week
   shows, and the four answers of an older weekly review, when there is one (the Sunday review took its place, see
   sunday.ts). Used in Pattern > Weeks and on its own page. Ported from the legacy weekBody. */
import { fmtDate, REVIEW_QS, setDay1, weekView } from '@daybook/core';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';

import { EmptyChart, Spark } from '@/components/charts';
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
  const num = (l: string, b: string | number, sub?: string) => (
    <View key={l} style={s.num}>
      <Text style={[s.numB, { color: c.ink }]}>{b}</Text>
      <T v="small" tone="muted">
        {l}
      </T>
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
      style={({ pressed }) => [s.nav, { opacity: off ? 0.3 : pressed ? 0.6 : 1 }]}>
      <Icon name={d < 0 ? 'back' : 'next'} size={18} color={c.ink} />
    </Pressable>
  );
  const logged = w.checkins + w.events > 0;
  const rated = v.avgs.some((x) => x.vals.some((y) => y != null));
  /* only what the week really shows: a row with nothing to say yet stays out, and with no real row there is no card */
  const shows = v.shows.filter(([, dd]) => dd !== '–');
  const showsAny = shows.some(([, dd]) => !dd.startsWith('Needs'));
  return (
    <>
      <Card>
        <View style={s.head}>
          <View style={{ flex: 1, gap: 2 }}>
            <T v="h2" accessibilityRole="header">
              Week {v.wk + 1}
            </T>
            <T v="small" tone="muted">
              {v.range}
            </T>
          </View>
          {nav(-1, 'Earlier week', v.wk === 0)}
          {nav(1, 'Later week', v.wk >= v.cw)}
        </View>
        <View style={s.nums}>
          {num('Check-ins', w.checkins + ' of 7')}
          {num('Entries', w.events)}
          {num('Rode it out', w.rode)}
          {num('Slipped', w.slipped, w.slipDays ? w.slipDays + ' day' + (w.slipDays === 1 ? '' : 's') : '')}
        </View>
        {logged ? null : <EmptyChart text="No entries this week yet. The check-ins and urges you log show up here." />}
      </Card>
      {rated ? (
        <Card>
          <View style={s.between}>
            <T v="h2">Average ratings</T>
            <T v="small" tone="muted">
              0 to 10
            </T>
          </View>
          <View>
            {v.avgs.map((x, i) => (
              <View key={x.f} style={[s.avg, i > 0 && { borderTopWidth: 1, borderTopColor: c.line }]}>
                <View style={{ flex: 1 }}>
                  <T v="label">{x.l}</T>
                  {x.move ? (
                    <T v="small" tone="muted">
                      {x.move}
                    </T>
                  ) : null}
                </View>
                {x.vals.some((y) => y != null) ? <Spark vals={x.vals} label={x.l + ' each day this week'} /> : null}
                <Text style={[s.numB, s.avgV, { color: c.ink }]}>{x.v}</Text>
              </View>
            ))}
          </View>
        </Card>
      ) : null}
      {logged && showsAny ? (
        <Card>
          <T v="h2">What the week shows</T>
          {shows.map(([dt, dd]) => (
            <View key={dt} style={{ gap: 2 }}>
              <T v="small" tone="muted">
                {dt}
              </T>
              <T v="label">{dd}</T>
            </View>
          ))}
        </Card>
      ) : null}
      {/* the choice at the end of the first week; once Day 1 has come, moving it from here would undo a count already running */}
      {v.wk === 0 && !(st.day1 && st.day1 <= tk) ? (
        <Card tone="note">
          <T v="h2">What comes next</T>
          <T>
            This first week is for noticing. Nothing is counted yet, so there is nothing to fail. When it ends, you choose: start counting days, or keep
            tracking without counting. Both are fine.
          </T>
          <T v="label">
            {st.day1
              ? 'Day 1 of quitting is set for ' + fmtDate(st.day1, { weekday: 'long', month: 'short', day: 'numeric' }) + '.'
              : 'No Day 1 is set. You are just tracking.'}
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
  head: { flexDirection: 'row', alignItems: 'flex-start', marginRight: -8 },
  nav: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  nums: { flexDirection: 'row', gap: 8 },
  num: { flex: 1 },
  numB: { fontFamily: font.display, fontSize: 22, lineHeight: 28 },
  avg: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, minHeight: 56 },
  avgV: { minWidth: 44, textAlign: 'right' },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
