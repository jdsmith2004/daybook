/* Journal > Weeks, on top: the Sunday reviews (core: sunday.ts), newest first. Each one shows what worked, what to change,
   and the goal, with how the goal went in the week after (counted from the log, or as the person said). A tap on Change
   opens that week's review again. */
import {
  addDays,
  storyIfLine,
  SUN_LAST,
  sunDue,
  sunGoalCount,
  sunGoalLine,
  sunKey,
  sunList,
  sunOf,
  sunRange,
  type Snapshot,
  type SunReview,
} from '@daybook/core';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';

import { Button, Card, Icon, T } from '@/components/ui';
import { font, toneOf, useTheme } from '@/lib/theme';

export function SundayList({ snap, tk }: { snap: Snapshot; tk: string }) {
  const c = useTheme();
  const [all, setAll] = useState(false);
  const st = snap.settings!;
  const list = sunList(snap.reviews);
  const due = sunDue(snap.reviews, st, tk);
  const thisWeek = sunOf(tk);
  const open = (sun: string) => router.push({ pathname: '/review', params: { s: sun } });
  return (
    <>
      <Card style={{ backgroundColor: c.sunSoft, borderColor: c.sun }}>
        <View style={s.head}>
          <View style={[s.ic, { backgroundColor: c.sun }]}>
            <Icon name="calendar" size={20} color={c.onSun} />
          </View>
          <View style={{ flex: 1 }}>
            <T v="h2">Sunday reviews</T>
            <T v="small" tone="muted">
              Each Sunday, a few minutes to walk through the week, and one small goal for the next.
            </T>
          </View>
        </View>
        {due ? (
          <Button label={due.late ? 'Look back on last week' : 'Look back on my week'} onPress={() => open(due.sun)} />
        ) : !snap.reviews[sunKey(thisWeek)]?.sun ? (
          <Button kind="ghost" label="Look back on this week so far" onPress={() => open(thisWeek)} />
        ) : null}
      </Card>
      {(all ? list : list.slice(0, 4)).map(({ sun, r }) => (
        <SundayRow key={sun} sun={sun} r={r} snap={snap} tk={tk} onChange={() => open(sun)} />
      ))}
      {!all && list.length > 4 ? <Button kind="ghost" label={`Show ${list.length - 4} earlier`} onPress={() => setAll(true)} /> : null}
    </>
  );
}

function SundayRow({ sun, r, snap, tk, onChange }: { sun: string; r: SunReview; snap: Snapshot; tk: string; onChange: () => void }) {
  const c = useTheme();
  /* the goal set on this Sunday is for the week after it */
  const next = addDays(sun, 7);
  const done = r.g ? sunGoalCount(snap.days, r.g, next, tk) : null;
  const said = snap.reviews[sunKey(next)]?.sun?.last;
  const result = r.g ? (done != null ? (tk > sun ? sunGoalLine(r.g, done, tk > next) : '') : said ? SUN_LAST.find((x) => x[0] === said)![1] + '.' : '') : '';
  return (
    <Card>
      <View style={s.between}>
        <T v="label">{sunRange(sun)}</T>
        <Pressable accessibilityRole="button" accessibilityLabel={'Change the review for ' + sunRange(sun)} onPress={onChange} hitSlop={8}>
          <Text style={[s.link, { color: c.accentText }]}>Change</Text>
        </Pressable>
      </View>
      {r.w.length ? <Line icon="check" tone="mint" label="What worked" items={r.w} /> : null}
      {r.c.length ? <Line icon="compass" tone="coral" label="What to change" items={r.c} /> : null}
      {r.g ? (
        <View style={{ gap: 2 }}>
          <View style={s.lineHead}>
            <Icon name="flag" size={15} color={c.sunText} />
            <T v="small" tone="muted">
              The goal for the week after
            </T>
          </View>
          <T v="label">{r.g.t}</T>
          {result ? (
            <T v="small" tone={done != null && r.g.n != null && done >= r.g.n ? 'mintText' : 'muted'}>
              {result}
            </T>
          ) : null}
        </View>
      ) : null}
      {r.it ? <Note icon="compass" label="If-then plan" text={storyIfLine(r.it)} /> : null}
      {r.nt ? <Note icon="pencil" label="A note to myself" text={'“' + r.nt + '”'} /> : null}
    </Card>
  );
}

function Note({ icon, label, text }: { icon: string; label: string; text: string }) {
  const c = useTheme();
  return (
    <View style={{ gap: 2 }}>
      <View style={s.lineHead}>
        <Icon name={icon} size={15} color={c.violetText} />
        <T v="small" tone="muted">
          {label}
        </T>
      </View>
      <T>{text}</T>
    </View>
  );
}

function Line({ icon, tone, label, items }: { icon: string; tone: string; label: string; items: string[] }) {
  const c = useTheme();
  const t = toneOf(c, tone);
  return (
    <View style={{ gap: 6 }}>
      <View style={s.lineHead}>
        <Icon name={icon} size={15} color={t.text} />
        <T v="small" tone="muted">
          {label}
        </T>
      </View>
      <View style={s.chips}>
        {items.map((x) => (
          <View key={x} style={[s.chip, { backgroundColor: t.soft }]}>
            <Text style={[s.chipT, { color: t.text }]}>{x}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ic: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  link: { fontFamily: font.bodySemi, fontSize: 14.5, textDecorationLine: 'underline' },
  lineHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  chipT: { fontFamily: font.bodySemi, fontSize: 13.5 },
});
