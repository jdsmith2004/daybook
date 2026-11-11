/* The log on Days, under the month and the count (core journal.ts, daysList): a week at a time, newest first, each week's
   name and its check-ins and entries over its days. Each day has a bar at its left colored the way the month colors it
   (warm for no slip, violet for a slip), its date big, how it went (a slip in violet) and what was logged at what time. Today is lit, and holds today's entries themselves (it was the Today so far card).
   A tap on a day opens it (app/day/[date].tsx). */
import { countText, daysList, sumDay, type Snapshot } from '@daybook/core';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { EntryRows } from '@/components/entry-rows';
import { Text } from '@/components/text';
import { Button, Icon, T } from '@/components/ui';
import { font, useTheme } from '@/lib/theme';

type Row = ReturnType<typeof daysList>['weeks'][number]['rows'][number];
const RUN: [string, string] = ['#F27A1C', '#FFC43D'];

export function DayLog({ snap, tk }: { snap: Snapshot; tk: string }) {
  const c = useTheme();
  const [all, setAll] = useState(false);
  const list = daysList(snap.days, snap.settings!, tk, all);
  const dark = c.scheme === 'dark';
  const violet = dark ? '#B9AEF0' : '#5B48C2';
  return (
    <View style={s.log}>
      {list.weeks.map((w) => (
        <View key={w.wk + w.title}>
          <View style={s.weekHead}>
            <T v="h2" accessibilityRole="header">
              {w.title}
            </T>
            <T v="small" tone="muted">
              {w.count}
            </T>
          </View>
          {w.rows.map((r, i) => (
            <DayRow key={r.key} r={r} snap={snap} today={r.key === tk} violet={violet} dark={dark} first={i === 0} />
          ))}
        </View>
      ))}
      {list.more > 0 ? <Button kind="ghost" label={`Show ${list.more} earlier days`} onPress={() => setAll(true)} /> : null}
    </View>
  );
}

/* the day's bar, at the left of its date */
function Bar({ r, dark }: { r: Row; dark: boolean }) {
  const c = useTheme();
  if (r.status === 'clean') return <LinearGradient colors={RUN} start={{ x: 0, y: 1 }} end={{ x: 0, y: 0 }} style={s.bar} />;
  const fill =
    r.status === 'slip' ? (dark ? '#7A68D8' : '#4C3C96') : r.status === 'tracked' || r.status === 'events' ? c.sky : dark ? 'rgba(255,255,255,0.12)' : c.line;
  return <View style={[s.bar, { backgroundColor: fill }]} />;
}

function DayRow({ r, snap, today, violet, dark, first }: { r: Row; snap: Snapshot; today: boolean; violet: string; dark: boolean; first: boolean }) {
  const c = useTheme();
  const sum = today ? sumDay(snap.days[r.key]) : null;
  const ct = sum && sum.n ? countText(sum) : null;
  const tone = r.status === 'slip' ? violet : r.status === 'clean' ? (today ? c.sunText : c.ink) : r.status === 'tracked' ? c.skyText : c.muted;
  const logged = r.n ? (r.n === 1 ? 'Logged at ' : `${r.n} logged: `) + r.times : r.times;
  return (
    <View
      style={[
        !first && !today && { borderTopWidth: StyleSheet.hairlineWidth, borderColor: c.line },
        today && [s.lit, { backgroundColor: c.scheme === 'dark' ? 'rgba(255,196,61,0.10)' : c.sunSoft }],
      ]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${r.weekday} ${r.date}. ${r.phase}. ${r.pill}. ${r.n ? (r.n === 1 ? 'Logged at ' : `${r.n} logged: `) : ''}${r.times}${r.rate ? '. ' + r.rate : ''}${r.pts ? '. ' + r.pts + ' points' : ''}`}
        onPress={() => router.push({ pathname: '/day/[date]', params: { date: r.key } })}
        style={({ pressed }) => [s.row, { opacity: pressed ? 0.7 : 1 }]}>
        <Bar r={r} dark={dark} />
        <View style={s.date}>
          <Text style={[s.dateBig, { color: c.ink }]}>{Number(r.key.slice(8))}</Text>
          <T v="small" tone="muted">
            {r.weekday}
          </T>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          {/* "No entry" over "Nothing logged" would say it twice */}
          {r.pill && r.pill !== 'No entry' ? <Text style={[s.pill, { color: tone }]}>{r.pill}</Text> : null}
          <T v="small" tone="muted">
            {ct ? ct.n + (ct.detail ? ' · ' + ct.detail : '') : logged}
          </T>
        </View>
        <Icon name="next" size={16} color={c.muted} />
      </Pressable>
      {/* today's entries themselves, each opening the entry */}
      {ct ? (
        <View style={s.entries}>
          <EntryRows date={r.key} />
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  log: { gap: 24 },
  weekHead: { gap: 2, marginBottom: 4 },
  lit: { marginHorizontal: -8, paddingHorizontal: 8, borderRadius: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 60, paddingVertical: 8 },
  date: { width: 36, alignItems: 'center' },
  dateBig: { fontFamily: font.display, fontSize: 22, lineHeight: 26 },
  bar: { width: 4, alignSelf: 'stretch', marginVertical: 2, borderRadius: 2 },
  pill: { fontFamily: font.bodySemi, fontSize: 15, lineHeight: 20 },
  entries: { paddingLeft: 64, paddingBottom: 8 },
});
