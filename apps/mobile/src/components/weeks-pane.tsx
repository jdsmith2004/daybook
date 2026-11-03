/* Pattern > Weeks: seeing, week after week, that you are changing. The weeks are the Sunday review's, Monday to Sunday (core
   sunday.ts), so both always say the same thing. On top, every week as a bar of its days: mint for a day with no slip, amber
   for a day with a slip (the Days calendar's colors), the no-slip count over it. A tap picks a week, and under the bars that
   week is told in full: the review's own sentence for it (weekRead), its seven days, the counts, the average ratings, what it
   shows, its Sunday review, and an older review's answers. A hard week is said plainly and held: nothing here drops to zero. */
import {
  addDays,
  fmtDate,
  gameCompute,
  REVIEW_QS,
  setDay1,
  storyDays,
  storyIfLine,
  storyWeeks,
  storyWhen,
  SUN_LAST,
  sunDue,
  sunGoalCount,
  sunGoalLine,
  sunKey,
  sunOf,
  sunRange,
  sunView,
  sunWeek,
  weekOf,
  weekRead,
  type StoryDay,
  type StoryWeek,
} from '@daybook/core';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, type ScrollViewInstance } from 'react-native';

import { BigFlame } from '@/components/big-flame';
import { Spark } from '@/components/charts';
import { Text } from '@/components/text';
import { Button, Card, Chip, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { useStore } from '@/lib/store';
import { font, useTheme } from '@/lib/theme';

/** a bar's height for a whole week of seven days */
const BAR_H = 112;
const BAR_W = 22;

export function WeeksPane() {
  const c = useTheme();
  const { snap, tk, apply } = useStore();
  const st = snap.settings!;
  const cur = sunOf(tk);
  const weeks = storyWeeks(snap.days, st, cur, tk, 52);
  const [pick, setPick] = useState<string | null>(null);
  /* it opens on this week, or on last week while this one is only a day or two old */
  const last = weeks[weeks.length - 1];
  const sel = weeks.find((w) => w.sun === pick) ?? (last && last.sun === cur && last.days < 3 && weeks.length > 1 ? weeks[weeks.length - 2] : last);
  const level = Math.max(1, gameCompute(snap.days, st, snap.reviews, tk).level.n);
  const due = sunDue(snap.reviews, st, tk);
  const open = (sun: string) => router.push({ pathname: '/review', params: { s: sun } });
  if (!sel)
    return (
      <T tone="muted" style={{ paddingTop: 8 }}>
        Your weeks show here from your first day.
      </T>
    );
  const name = (sun: string) => (sun === cur ? 'This week' : sun === addDays(cur, -7) ? 'Last week' : '');
  const i = weeks.indexOf(sel);
  const read = weekRead(
    snap.days,
    st,
    sel.sun,
    tk,
    sunWeek(snap.days, st, sel.sun, tk),
    weeks.slice(Math.max(0, i - 7), i + 1),
    storyWhen(snap.days, st, sel.sun, tk),
  );
  const v = sunView(snap.days, st, tk, sel.sun);
  const ds = storyDays(snap.days, st, sel.sun, tk);
  const rv = snap.reviews[sunKey(sel.sun)]?.sun;
  /* an answer to the older weekly review, kept by the start-date week that holds this Sunday */
  const old = snap.reviews['w' + weekOf(sel.sun, st)]?.a;
  const rated = v.avgs.some((x) => x.vals.some((y) => y != null));
  const shows = v.shows.filter(([, dd]) => dd !== '–' && !dd.startsWith('Needs'));
  const first = sel.sun === sunOf(st.start) && !(st.day1 && st.day1 <= tk);
  return (
    <View style={{ gap: 24 }}>
      {due ? <Button label={due.late ? 'Look back on last week' : 'Look back on my week'} onPress={() => open(due.sun)} /> : null}
      <View style={{ alignItems: 'center' }}>
        <BigFlame level={level} size={132} />
      </View>
      <View style={{ gap: 12 }}>
        <View style={{ gap: 2 }}>
          <T v="h2" accessibilityRole="header">
            Days with no slip, each week
          </T>
          <T v="small" tone="muted">
            Tap a week to see it.
          </T>
        </View>
        <Bars weeks={weeks} sel={sel.sun} cur={cur} onPick={setPick} />
        <View style={s.legend}>
          <Key color={c.mint} label="No slip" />
          <Key color={c.slip} label="Slip" />
        </View>
      </View>

      <View style={{ gap: 4 }}>
        <T v="small" tone="muted">
          {[name(sel.sun), sunRange(sel.sun)].filter(Boolean).join(' · ')}
        </T>
        <T v="title" accessibilityRole="header">
          {read.says}
        </T>
        <T tone="muted">{read.held}</T>
      </View>

      <WeekDays ds={ds} />

      <View style={s.nums}>
        <Num l="Check-ins" b={v.w.checkins + ' of 7'} />
        <Num l="Entries" b={v.w.events} />
        <Num l="Rode it out" b={v.w.rode} />
        <Num l="Slipped" b={v.w.slipped} sub={v.w.slipDays ? v.w.slipDays + ' day' + (v.w.slipDays === 1 ? '' : 's') : ''} />
      </View>

      {rated ? (
        <View>
          <View style={s.between}>
            <T v="h2">Average ratings</T>
            <T v="small" tone="muted">
              0 to 10
            </T>
          </View>
          {v.avgs.map((x, j) => (
            <View key={x.f} style={[s.avg, j > 0 && { borderTopWidth: 1, borderTopColor: c.line }]}>
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
      ) : null}

      {shows.length ? (
        <View style={{ gap: 12 }}>
          <T v="h2">What the week shows</T>
          {shows.map(([dt, dd]) => (
            <Line key={dt} label={dt} text={dd} strong />
          ))}
        </View>
      ) : null}

      {rv ? (
        <View style={{ gap: 12 }}>
          <View style={s.between}>
            <T v="h2">Your Sunday review</T>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={'Change the review for ' + sunRange(sel.sun)}
              onPress={() => open(sel.sun)}
              style={({ pressed }) => [s.change, { opacity: pressed ? 0.6 : 1 }]}>
              <Text style={[s.link, { color: c.accentText }]}>Change</Text>
            </Pressable>
          </View>
          {rv.w.length ? <Line label="What worked" text={rv.w.join(' · ')} /> : null}
          {rv.c.length ? <Line label="What to change" text={rv.c.join(' · ')} /> : null}
          {rv.g ? <Goal sun={sel.sun} /> : null}
          {rv.it ? <Line label="If-then plan" text={storyIfLine(rv.it)} /> : null}
          {rv.nt ? <Line label="A note to myself" text={'“' + rv.nt + '”'} /> : null}
        </View>
      ) : sel.sun === cur && !due ? (
        <Button kind="ghost" label="Look back on this week so far" onPress={() => open(cur)} />
      ) : null}

      {old && REVIEW_QS.some(([id]) => old[id].trim()) ? (
        <View style={{ gap: 12 }}>
          <T v="h2">My review</T>
          {REVIEW_QS.filter(([id]) => old[id].trim()).map(([id, label]) => (
            <Line key={id} label={label} text={old[id]} />
          ))}
        </View>
      ) : null}

      {/* the choice at the end of the first week; once Day 1 has come, moving it from here would undo a count already running */}
      {first ? (
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
    </View>
  );
}

/* ---------- every week as a bar: mint days with no slip at the bottom, amber slip days on them, the rest of the seven empty ---------- */
function Bars({ weeks, sel, cur, onPick }: { weeks: StoryWeek[]; sel: string; cur: string; onPick: (sun: string) => void }) {
  const c = useTheme();
  const ref = useRef<ScrollViewInstance>(null);
  const [w, setW] = useState(0);
  /* the newest weeks are where the eye starts: a long log opens scrolled to its end */
  useEffect(() => {
    ref.current?.scrollToEnd({ animated: false });
  }, [w, weeks.length]);
  const day = BAR_H / 7;
  return (
    <ScrollView
      ref={ref}
      horizontal
      showsHorizontalScrollIndicator={false}
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
      contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between', gap: 2, minWidth: w }}>
      {weeks.map((x, i) => {
        const on = x.sun === sel;
        const slipDays = x.days - x.noSlip;
        const mon = addDays(x.sun, -6);
        const prev = i > 0 ? addDays(weeks[i - 1].sun, -6) : '';
        const month = !prev || prev.slice(5, 7) !== mon.slice(5, 7);
        return (
          <Pressable
            key={x.sun}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            accessibilityLabel={`${sunRange(x.sun)}: ${x.noSlip} of ${x.days} days with no slip${x.sun === cur ? ', so far' : ''}`}
            onPress={() => {
              buzz('tap');
              onPick(x.sun);
            }}
            style={({ pressed }) => [s.col, on && { backgroundColor: c.accentSoft }, { opacity: pressed ? 0.7 : 1 }]}>
            <Text style={[s.count, { color: on ? c.ink : c.muted }]}>{x.noSlip}</Text>
            <View style={[s.bar, { height: BAR_H, backgroundColor: c.accentSoft }]}>
              {slipDays ? <View style={{ height: slipDays * day, backgroundColor: c.slip }} /> : null}
              {x.noSlip ? <View style={{ height: x.noSlip * day, backgroundColor: c.mint }} /> : null}
            </View>
            <Text style={[s.mon, { color: c.muted }]}>{month ? fmtDate(mon, { month: 'short' }) : ' '}</Text>
            <Text style={[s.dnum, { color: on ? c.ink : c.muted }]}>{Number(mon.slice(8))}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function Key({ color, label }: { color: string; label: string }) {
  return (
    <View style={s.key}>
      <View style={[s.keyDot, { backgroundColor: color }]} />
      <T v="small" tone="muted">
        {label}
      </T>
    </View>
  );
}

/* ---------- the picked week's seven days, as the Days calendar draws them; a tap opens the day ---------- */
function WeekDays({ ds }: { ds: StoryDay[] }) {
  const c = useTheme();
  const on = c.scheme === 'dark' ? '#10163A' : '#FFFFFF';
  return (
    <View style={s.week}>
      {ds.map((d) => {
        const bg = d.state === 'clean' ? c.mint : d.state === 'slip' ? c.slip : 'transparent';
        const bd = d.state === 'ahead' ? c.line : bg;
        const live = d.state === 'clean' || d.state === 'slip';
        const cell = (
          <View style={[s.cell, { backgroundColor: bg, borderColor: bd, borderStyle: d.state === 'ahead' ? 'dashed' : 'solid' }]}>
            <Text style={[s.cellN, { color: live ? on : c.muted }]}>{Number(d.k.slice(8))}</Text>
          </View>
        );
        return (
          <View key={d.k} style={s.dayBox}>
            <Text style={[s.dow, { color: c.muted }]}>{d.l}</Text>
            {live ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${d.name} ${fmtDate(d.k, { month: 'long', day: 'numeric' })}: ${d.state === 'slip' ? 'a slip' : 'no slip'}`}
                onPress={() => router.push({ pathname: '/day/[date]', params: { date: d.k } })}
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
                {cell}
              </Pressable>
            ) : (
              cell
            )}
          </View>
        );
      })}
    </View>
  );
}

/* the goal this Sunday set, and how the week after went: counted from the log, or as the person said */
function Goal({ sun }: { sun: string }) {
  const { snap, tk } = useStore();
  const r = snap.reviews[sunKey(sun)]!.sun!;
  const g = r.g!;
  const next = addDays(sun, 7);
  const done = sunGoalCount(snap.days, g, next, tk);
  const said = snap.reviews[sunKey(next)]?.sun?.last;
  const result = done != null ? (tk > sun ? sunGoalLine(g, done, tk > next) : '') : said ? SUN_LAST.find((x) => x[0] === said)![1] + '.' : '';
  return (
    <View style={{ gap: 2 }}>
      <T v="small" tone="muted">
        The goal for the week after
      </T>
      <T v="label">{g.t}</T>
      {result ? (
        <T v="small" tone={done != null && g.n != null && done >= g.n ? 'mintText' : 'muted'}>
          {result}
        </T>
      ) : null}
    </View>
  );
}

function Num({ l, b, sub }: { l: string; b: string | number; sub?: string }) {
  const c = useTheme();
  return (
    <View style={{ flex: 1 }}>
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
}

function Line({ label, text, strong }: { label: string; text: string; strong?: boolean }) {
  return (
    <View style={{ gap: 2 }}>
      <T v="small" tone="muted">
        {label}
      </T>
      <T v={strong ? 'label' : 'body'}>{text}</T>
    </View>
  );
}

const s = StyleSheet.create({
  col: { width: BAR_W + 12, alignItems: 'center', paddingVertical: 8, borderRadius: 12, gap: 4 },
  count: { fontFamily: font.bodyBold, fontSize: 15, lineHeight: 20 },
  bar: { width: BAR_W, borderRadius: 8, overflow: 'hidden', justifyContent: 'flex-end' },
  mon: { fontFamily: font.body, fontSize: 11, lineHeight: 13 },
  dnum: { fontFamily: font.bodySemi, fontSize: 13, lineHeight: 16, marginTop: -4 },
  legend: { flexDirection: 'row', gap: 16 },
  key: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  keyDot: { width: 12, height: 12, borderRadius: 4 },
  week: { flexDirection: 'row' },
  dayBox: { flex: 1, alignItems: 'center', gap: 6 },
  dow: { fontFamily: font.bodySemi, fontSize: 13 },
  cell: { width: 40, height: 40, borderRadius: 12, borderWidth: 2.5, alignItems: 'center', justifyContent: 'center' },
  cellN: { fontFamily: font.bodyBold, fontSize: 15 },
  nums: { flexDirection: 'row', gap: 8 },
  numB: { fontFamily: font.display, fontSize: 22, lineHeight: 28 },
  avg: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, minHeight: 56 },
  avgV: { minWidth: 44, textAlign: 'right' },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  change: { minHeight: 44, minWidth: 44, marginVertical: -12, alignItems: 'flex-end', justifyContent: 'center' },
  link: { fontFamily: font.bodySemi, fontSize: 15, textDecorationLine: 'underline' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
