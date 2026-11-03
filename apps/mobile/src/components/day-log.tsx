/* The log on Days, under the month and the count (core journal.ts, daysList): a week at a time, newest first, each week's
   name and its check-ins and entries over its days, then the week as one strip of seven, each day colored the way the month
   colors it (warm for no slip, violet for a slip, oldest on the left). Each day under it is its date big, how it went (a slip
   in violet) and what was logged at what time. Today is lit, and holds today's entries themselves (it was the Today so far card).
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
          <Strip rows={w.rows} current={w.rows[0]?.key === tk} dark={dark} />
          {w.rows.map((r, i) => (
            <DayRow key={r.key} r={r} snap={snap} today={r.key === tk} violet={violet} first={i === 0} />
          ))}
        </View>
      ))}
      {list.more > 0 ? <Button kind="ghost" label={`Show ${list.more} earlier days`} onPress={() => setAll(true)} /> : null}
    </View>
  );
}

/* the week in seven pieces, oldest first; days not in the log yet (still to come, or before it) stay faint */
function Strip({ rows, current, dark }: { rows: Row[]; current: boolean; dark: boolean }) {
  const c = useTheme();
  const faint = dark ? 'rgba(255,255,255,0.08)' : c.line;
  const days: (Row | null)[] = rows.slice().reverse();
  while (days.length < 7) current ? days.push(null) : days.unshift(null);
  const fill = (r: Row | null) =>
    !r ? faint : r.status === 'slip' ? (dark ? '#4C3C96' : '#D9D2F7') : r.status === 'tracked' || r.status === 'events' ? c.sky : faint;
  return (
    <View style={s.strip} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {days.map((r, i) =>
        r?.status === 'clean' ? (
          <LinearGradient key={i} colors={RUN} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.piece} />
        ) : (
          <View key={i} style={[s.piece, { backgroundColor: fill(r) }]} />
        ),
      )}
    </View>
  );
}

function DayRow({ r, snap, today, violet, first }: { r: Row; snap: Snapshot; today: boolean; violet: string; first: boolean }) {
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
  lit: { marginHorizontal: -16, paddingHorizontal: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 60, paddingVertical: 8 },
  date: { width: 36, alignItems: 'center' },
  dateBig: { fontFamily: font.display, fontSize: 22, lineHeight: 26 },
  strip: { flexDirection: 'row', gap: 4, marginTop: 8, marginBottom: 6 },
  piece: { flex: 1, height: 10, borderRadius: 5 },
  pill: { fontFamily: font.bodySemi, fontSize: 15, lineHeight: 20 },
  entries: { paddingLeft: 48, paddingBottom: 8 },
});
