/* Pattern > Weeks: seeing, week after week, that you are changing. The weeks are the Sunday review's, Monday to Sunday (core
   sunday.ts), so both always say the same thing. On top, the days with no slip in each finished week as one line, with what
   changed since the first week (or, when that is not up, the no-slip days kept, which never drop); under it every week newest
   first, its days as a strip (mint no slip, amber a slip: the Days calendar's colors). A tap opens the week on its own page
   (app/weekly/[sun].tsx, WeekDetail below): the review's own sentence for it (weekRead), its seven days, the counts, the
   average ratings, what it shows, its Sunday review, and an older review's answers. A hard week is said plainly and held. */
import {
  addDays,
  fmtDate,
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
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { Spark } from '@/components/charts';
import { Text } from '@/components/text';
import { Button, Card, Chip, Icon, T } from '@/components/ui';
import { useStore } from '@/lib/store';
import { font, useTheme } from '@/lib/theme';

/** the weeks so far, oldest first, and what to call one: "This week", "Last week" or its dates */
export function useWeeks() {
  const { snap, tk } = useStore();
  const st = snap.settings!;
  const cur = sunOf(tk);
  const weeks = storyWeeks(snap.days, st, cur, tk, 52);
  const name = (sun: string) => (sun === cur ? 'This week' : sun === addDays(cur, -7) ? 'Last week' : sunRange(sun));
  return { weeks, cur, name };
}

export function WeeksPane() {
  const c = useTheme();
  const { snap, tk } = useStore();
  const st = snap.settings!;
  const { weeks, cur, name } = useWeeks();
  const due = sunDue(snap.reviews, st, tk);
  if (!weeks.length)
    return (
      <T tone="muted" style={{ paddingTop: 8 }}>
        Your weeks show here from your first day.
      </T>
    );
  /* the line holds finished weeks only: a week one day old would look like a fall */
  const done = weeks.filter((w) => w.sun < cur);
  const first = done.find((w) => w.days === 7) ?? done[0];
  const last = done[done.length - 1];
  const kept = weeks.reduce((a, w) => a + w.noSlip, 0);
  const up = first && last && first !== last && last.noSlip > first.noSlip;
  return (
    <View style={{ gap: 24 }}>
      {due ? (
        <Button
          label={due.late ? 'Look back on last week' : 'Look back on my week'}
          onPress={() => router.push({ pathname: '/review', params: { s: due.sun } })}
        />
      ) : null}
      <View style={{ gap: 4 }}>
        <T v="small" tone="muted">
          Days with no slip, each week
        </T>
        {up ? (
          <>
            <Text style={[s.head, { color: c.ink }]} accessibilityLabel={`${first.noSlip} to ${last.noSlip}`}>
              {first.noSlip} → {last.noSlip}
            </Text>
            <T tone="muted">From your first week to last week.</T>
          </>
        ) : (
          <>
            <Text style={[s.head, { color: c.ink }]}>{kept}</Text>
            <T tone="muted">
              {kept === 1 ? 'day' : 'days'} with no slip, in {weeks.length} {weeks.length === 1 ? 'week' : 'weeks'}. They stay yours.
            </T>
          </>
        )}
      </View>
      {done.length > 1 ? <WeeksLine weeks={done} /> : null}
      <View>
        {[...weeks].reverse().map((w, i) => (
          <Pressable
            key={w.sun}
            accessibilityRole="button"
            accessibilityLabel={`${name(w.sun)}: ${w.noSlip} of ${w.days} days with no slip. Open the week.`}
            onPress={() => router.push({ pathname: '/weekly/[sun]', params: { sun: w.sun } })}
            style={({ pressed }) => [s.row, i > 0 && { borderTopWidth: 1, borderTopColor: c.line }, { opacity: pressed ? 0.6 : 1 }]}>
            <View style={{ flex: 1, gap: 8 }}>
              <View style={s.between}>
                <T v="label">{name(w.sun)}</T>
                <T v="small" tone="muted">
                  {w.sun === cur ? `${w.noSlip} of ${w.days} so far` : `${w.noSlip} of ${w.days} days`}
                </T>
              </View>
              <Strip ds={storyDays(snap.days, st, w.sun, tk)} />
            </View>
            <Icon name="next" size={16} color={c.muted} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

/* ---------- the finished weeks as one line, read without a key: each dot is a week with its number over it, the scale
   from 0 to 7 days at the side, the dates under its two ends ---------- */
const LINE_H = 168;
const GUTTER = 22;
function WeeksLine({ weeks }: { weeks: StoryWeek[] }) {
  const c = useTheme();
  const [w, setW] = useState(0);
  const top = 26; /* room for the numbers over the dots */
  const bot = 8;
  const y7 = top;
  const y0 = LINE_H - bot;
  const x0 = GUTTER + 8;
  const x1 = w - 8;
  const pts = weeks.map((x, i): [number, number] => [x0 + (i / (weeks.length - 1)) * (x1 - x0), y0 - (x.noSlip / 7) * (y0 - y7)]);
  let d = '';
  pts.forEach(([x, y], i) => {
    if (!i) d = `M${x} ${y}`;
    else {
      const [px, py] = pts[i - 1];
      const mx = (px + x) / 2;
      d += ` C${mx} ${py} ${mx} ${y} ${x} ${y}`;
    }
  });
  const area = d + ` L${pts[pts.length - 1][0]} ${y0} L${pts[0][0]} ${y0} Z`;
  /* every week's number when they fit; past twelve weeks, the first, the last and the best */
  const best = weeks.reduce((b, x, i) => (x.noSlip > weeks[b].noSlip ? i : b), 0);
  const shown = (i: number) => weeks.length <= 12 || i === 0 || i === weeks.length - 1 || i === best;
  return (
    <View style={{ gap: 4 }} accessible accessibilityRole="image" accessibilityLabel={'Days with no slip each week: ' + weeks.map((x) => x.noSlip).join(', ')}>
      <View style={{ height: LINE_H }} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
        {w ? (
          <>
            <Svg width={w} height={LINE_H} style={StyleSheet.absoluteFill}>
              <Defs>
                <LinearGradient id="weeksFill" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={c.mint} stopOpacity={0.28} />
                  <Stop offset="1" stopColor={c.mint} stopOpacity={0} />
                </LinearGradient>
              </Defs>
              <Path d={`M${x0} ${y7} L${x1} ${y7}`} stroke={c.line} strokeWidth={1} strokeDasharray="4 5" />
              <Path d={`M${x0} ${y0} L${x1} ${y0}`} stroke={c.line} strokeWidth={1} />
              <Path d={area} fill="url(#weeksFill)" />
              <Path d={d} stroke={c.mint} strokeWidth={3} fill="none" strokeLinecap="round" />
              {pts.map(([x, y], i) => (
                <Circle key={i} cx={x} cy={y} r={i === pts.length - 1 ? 6 : 4} fill={c.bg} stroke={c.mint} strokeWidth={2.5} />
              ))}
            </Svg>
            <T v="small" tone="muted" style={[s.axis, { top: y7 - 9 }]}>
              7
            </T>
            <T v="small" tone="muted" style={[s.axis, { top: y0 - 9 }]}>
              0
            </T>
            {pts.map(([x, y], i) =>
              shown(i) ? (
                <Text
                  key={i}
                  style={[
                    s.dotNum,
                    {
                      left: x - 16,
                      top: y - 26,
                      color: i === pts.length - 1 ? c.mint : c.ink,
                      fontFamily: i === pts.length - 1 ? font.displayBold : font.display,
                    },
                  ]}>
                  {weeks[i].noSlip}
                </Text>
              ) : null,
            )}
          </>
        ) : null}
      </View>
      <View style={[s.between, { paddingLeft: GUTTER }]}>
        <T v="small" tone="muted">
          {fmtDate(addDays(weeks[0].sun, -6), { month: 'short', day: 'numeric' })}
        </T>
        <T v="small" tone="muted">
          Last week
        </T>
      </View>
    </View>
  );
}

/* a week's seven days as a thin strip: mint no slip, amber a slip, an outline for a day still to come */
function Strip({ ds }: { ds: StoryDay[] }) {
  const c = useTheme();
  return (
    <View style={s.strip}>
      {ds.map((d) => (
        <View
          key={d.k}
          style={[
            s.seg,
            d.state === 'clean' ? { backgroundColor: c.mint } : d.state === 'slip' ? { backgroundColor: c.slip } : null,
            d.state === 'ahead' ? { borderWidth: 1.5, borderColor: c.line } : null,
          ]}
        />
      ))}
    </View>
  );
}

/* ---------- one week told in full, on its own page ---------- */
export function WeekDetail({ sun }: { sun: string }) {
  const c = useTheme();
  const { snap, tk, apply } = useStore();
  const st = snap.settings!;
  const { weeks, name } = useWeeks();
  const i = weeks.findIndex((w) => w.sun === sun);
  const open = (x: string) => router.push({ pathname: '/review', params: { s: x } });
  const read = weekRead(
    snap.days,
    st,
    sun,
    tk,
    sunWeek(snap.days, st, sun, tk),
    i < 0 ? [] : weeks.slice(Math.max(0, i - 7), i + 1),
    storyWhen(snap.days, st, sun, tk),
  );
  const v = sunView(snap.days, st, tk, sun);
  const ds = storyDays(snap.days, st, sun, tk);
  const rv = snap.reviews[sunKey(sun)]?.sun;
  /* an answer to the older weekly review, kept by the start-date week that holds this Sunday */
  const old = snap.reviews['w' + weekOf(sun, st)]?.a;
  const rated = v.avgs.some((x) => x.vals.some((y) => y != null));
  const shows = v.shows.filter(([, dd]) => dd !== '–' && !dd.startsWith('Needs'));
  const first = sun === sunOf(st.start) && !(st.day1 && st.day1 <= tk);
  const cur = sunOf(tk);
  const due = sunDue(snap.reviews, st, tk);
  return (
    <View style={{ gap: 24 }}>
      <View style={{ gap: 4 }}>
        {/* the page's title is the week's name; its dates go under a name like "Last week" */}
        {name(sun) !== sunRange(sun) ? (
          <T v="small" tone="muted">
            {sunRange(sun)}
          </T>
        ) : null}
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
              accessibilityLabel={'Change the review for ' + sunRange(sun)}
              onPress={() => open(sun)}
              style={({ pressed }) => [s.change, { opacity: pressed ? 0.6 : 1 }]}>
              <Text style={[s.link, { color: c.accentText }]}>Change</Text>
            </Pressable>
          </View>
          {rv.w.length ? <Line label="What worked" text={rv.w.join(' · ')} /> : null}
          {rv.c.length ? <Line label="What to change" text={rv.c.join(' · ')} /> : null}
          {rv.g ? <Goal sun={sun} /> : null}
          {rv.it ? <Line label="If-then plan" text={storyIfLine(rv.it)} /> : null}
          {rv.nt ? <Line label="A note to myself" text={'“' + rv.nt + '”'} /> : null}
        </View>
      ) : sun === cur && !due ? (
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
  head: { fontFamily: font.display, fontSize: 34, lineHeight: 41 },
  axis: { position: 'absolute', left: 0, width: GUTTER - 4, textAlign: 'right', lineHeight: 18 },
  dotNum: { position: 'absolute', width: 32, textAlign: 'center', fontSize: 15, lineHeight: 20 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, minHeight: 44 },
  strip: { flexDirection: 'row', gap: 4 },
  seg: { flex: 1, height: 10, borderRadius: 5 },
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
