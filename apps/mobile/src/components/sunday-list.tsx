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

import { Button, Card, T } from '@/components/ui';
import { font, useTheme } from '@/lib/theme';

export function SundayList({ snap, tk }: { snap: Snapshot; tk: string }) {
  const [all, setAll] = useState(false);
  const st = snap.settings!;
  const list = sunList(snap.reviews);
  const due = sunDue(snap.reviews, st, tk);
  const thisWeek = sunOf(tk);
  const open = (sun: string) => router.push({ pathname: '/review', params: { s: sun } });
  const act = due ? (
    <Button label={due.late ? 'Look back on last week' : 'Look back on my week'} onPress={() => open(due.sun)} />
  ) : !snap.reviews[sunKey(thisWeek)]?.sun ? (
    <Button kind="ghost" label="Look back on this week so far" onPress={() => open(thisWeek)} />
  ) : null;
  return (
    <>
      {act || !list.length ? (
        <Card tone="note">
          <View style={{ gap: 2 }}>
            <T v="h2" accessibilityRole="header">
              Sunday reviews
            </T>
            {list.length ? null : (
              <T v="small">A few minutes each Sunday to walk through the week, and one small goal for the next. Each one you finish is kept here.</T>
            )}
          </View>
          {act}
        </Card>
      ) : (
        <T v="h2" accessibilityRole="header">
          Sunday reviews
        </T>
      )}
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
        <Pressable accessibilityRole="button" accessibilityLabel={'Change the review for ' + sunRange(sun)} onPress={onChange} style={s.change}>
          <Text style={[s.link, { color: c.accentText }]}>Change</Text>
        </Pressable>
      </View>
      {r.w.length ? <Line label="What worked" text={r.w.join(' · ')} /> : null}
      {r.c.length ? <Line label="What to change" text={r.c.join(' · ')} /> : null}
      {r.g ? (
        <View style={{ gap: 2 }}>
          <T v="small" tone="muted">
            The goal for the week after
          </T>
          <T v="label">{r.g.t}</T>
          {result ? (
            <T v="small" tone={done != null && r.g.n != null && done >= r.g.n ? 'mintText' : 'muted'}>
              {result}
            </T>
          ) : null}
        </View>
      ) : null}
      {r.it ? <Line label="If-then plan" text={storyIfLine(r.it)} /> : null}
      {r.nt ? <Line label="A note to myself" text={'“' + r.nt + '”'} /> : null}
    </Card>
  );
}

function Line({ label, text }: { label: string; text: string }) {
  return (
    <View style={{ gap: 2 }}>
      <T v="small" tone="muted">
        {label}
      </T>
      <T>{text}</T>
    </View>
  );
}

const s = StyleSheet.create({
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  change: { minHeight: 44, minWidth: 44, marginVertical: -12, alignItems: 'flex-end', justifyContent: 'center' },
  link: { fontFamily: font.bodySemi, fontSize: 15, textDecorationLine: 'underline' },
});
