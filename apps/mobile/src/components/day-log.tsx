/* The log on Days, under the month and the count (core journal.ts, daysList): a week at a time, newest first, each week's
   name and its check-ins and entries over its days. The days hang on a warm thread down the left, each with a mark drawn
   the way the month draws it (a run's light, a slip's ember, ringed in gold once the person came back), its date big, how it
   went, and what was logged at what time. Today is lit, and holds today's entries themselves (it was the Today so far card).
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
const RUN: [string, string] = ['#FFC43D', '#F27A1C'];
const EMBER: [string, string] = ['#F9C27F', '#B4582A'];
const GOLD = '#F2BF3A';

export function DayLog({ snap, tk }: { snap: Snapshot; tk: string }) {
  const c = useTheme();
  const [all, setAll] = useState(false);
  const list = daysList(snap.days, snap.settings!, tk, all);
  const thread = c.scheme === 'dark' ? 'rgba(255,196,61,0.28)' : '#F3D9A8';
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
            <DayRow key={r.key} r={r} snap={snap} today={r.key === tk} thread={thread} first={i === 0} last={i === w.rows.length - 1} />
          ))}
        </View>
      ))}
      {list.more > 0 ? <Button kind="ghost" label={`Show ${list.more} earlier days`} onPress={() => setAll(true)} /> : null}
    </View>
  );
}

function DayRow({ r, snap, today, thread, first, last }: { r: Row; snap: Snapshot; today: boolean; thread: string; first: boolean; last: boolean }) {
  const c = useTheme();
  const sum = today ? sumDay(snap.days[r.key]) : null;
  const ct = sum && sum.n ? countText(sum) : null;
  const tone = r.status === 'slip' ? c.slipText : r.status === 'clean' ? (today ? c.sunText : c.ink) : r.status === 'tracked' ? c.skyText : c.muted;
  const logged = r.n ? (r.n === 1 ? 'Logged at ' : `${r.n} logged: `) + r.times : r.times;
  return (
    <View style={today && [s.lit, { backgroundColor: c.sunSoft }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${r.weekday} ${r.date}. ${r.phase}. ${r.pill}. ${r.n ? (r.n === 1 ? 'Logged at ' : `${r.n} logged: `) : ''}${r.times}${r.rate ? '. ' + r.rate : ''}${r.pts ? '. ' + r.pts + ' points' : ''}`}
        onPress={() => router.push({ pathname: '/day/[date]', params: { date: r.key } })}
        style={({ pressed }) => [s.row, { opacity: pressed ? 0.7 : 1 }]}>
        <View style={s.date}>
          <Text style={[s.dateBig, { color: c.ink }]}>{Number(r.key.slice(8))}</Text>
          <T v="small" tone="muted">
            {r.weekday}
          </T>
        </View>
        <View style={s.rail}>
          <View style={[s.thread, { backgroundColor: thread, top: first ? 18 : 0, bottom: last && !ct ? '50%' : 0 }]} />
          <Mark r={r} bg={today ? c.sunSoft : c.bg} line={c.line} />
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

/* the day's mark on the thread, drawn the way the month draws the day */
function Mark({ r, bg, line }: { r: Row; bg: string; line: string }) {
  const c = useTheme();
  if (r.status === 'clean') return <LinearGradient colors={RUN} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={[s.mark, s.glow]} />;
  if (r.status === 'slip')
    return (
      <View style={[s.ring, { backgroundColor: bg, borderColor: r.pill.includes('came back') ? GOLD : 'transparent' }]}>
        <LinearGradient colors={EMBER} start={{ x: 0.3, y: 0.2 }} end={{ x: 0.8, y: 1 }} style={s.ember} />
      </View>
    );
  if (r.status === 'tracked' || r.status === 'events') return <View style={[s.mark, { backgroundColor: c.sky }]} />;
  if (r.status === 'unknown') return <View style={[s.mark, s.open, { backgroundColor: bg, borderColor: c.muted }]} />;
  return <View style={[s.mark, s.open, { backgroundColor: bg, borderColor: line }]} />;
}

const s = StyleSheet.create({
  log: { gap: 24 },
  weekHead: { gap: 2, marginBottom: 4 },
  lit: { marginHorizontal: -16, paddingHorizontal: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 60, paddingVertical: 8 },
  date: { width: 36, alignItems: 'center' },
  dateBig: { fontFamily: font.display, fontSize: 22, lineHeight: 26 },
  rail: { width: 18, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', marginVertical: -8 },
  thread: { position: 'absolute', width: 2, borderRadius: 1 },
  mark: { width: 14, height: 14, borderRadius: 7 },
  glow: { shadowColor: '#F27A1C', shadowOpacity: 0.5, shadowRadius: 5, shadowOffset: { width: 0, height: 0 } },
  ring: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, padding: 2 },
  ember: { flex: 1, borderRadius: 6 },
  open: { borderWidth: 2 },
  pill: { fontFamily: font.bodySemi, fontSize: 15, lineHeight: 20 },
  entries: { paddingLeft: 66, paddingBottom: 8 },
});
