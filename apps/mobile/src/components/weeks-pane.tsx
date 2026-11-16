/* Pattern > Weeks: seeing, week after week, that you are changing. The weeks are the Sunday review's, Monday to Sunday (core
   sunday.ts), so both always say the same thing. On top, the days with no slip in each finished week as one line, with what
   changed since the first week (or, when that is not up, the no-slip days kept, which never drop); under it every week newest
   first, its days as a strip (warm light no slip, calm violet a slip: the Days colors). Between them, the north star's line (core
   north.ts): how free of this the person sees themselves, each month, 0 to 10. A tap opens the week on its own page
   (app/weekly/[sun].tsx, WeekDetail below): the review's own sentence for it (weekRead), its seven days, the counts, the
   average ratings, what it shows, its Sunday review, and an older review's answers. A hard week is said plainly and held. */
import {
  addDays,
  fmtDate,
  freeList,
  nightsSummary,
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
import { LinearGradient as Glow } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { NightKey, NightMarks } from '@/components/night-marks';
import { Text } from '@/components/text';
import { Button, Card, Chip, Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { useStore } from '@/lib/store';
import { useNights } from '@/lib/health';
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
  /* nights not told (core truth.ts): the line of days with no slip would read silence as free, so the weeks are drawn as nights,
     each one a mark, with how many were free and how many were told at all */
  const untold = weeks.some((w) => (w.untold || 0) > 0);
  const told = untold ? nightsSummary(snap.days, st, addDays(weeks[0].sun, -6), tk) : null;
  return (
    <View style={{ gap: 24 }}>
      {due ? (
        <Button
          label={due.late ? 'Look back on last week' : 'Look back on my week'}
          onPress={() => router.push({ pathname: '/review', params: { s: due.sun } })}
        />
      ) : null}
      {told ? (
        <View style={{ gap: 12 }}>
          <T v="title">Nights, week by week</T>
          <NightKey />
          <T>
            Free {told.free} {told.free === 1 ? 'night' : 'nights'} of {told.n}. Told the truth on {told.told}.
          </T>
        </View>
      ) : (
        <>
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
                  {kept === 1 ? 'day' : 'days'} in {weeks.length} {weeks.length === 1 ? 'week' : 'weeks'}. They stay yours.
                </T>
              </>
            )}
          </View>
          {done.length > 1 ? <WeeksLine weeks={done} /> : null}
        </>
      )}
      <FreeLine />
      <View>
        {[...weeks].reverse().map((w, i) => (
          <Pressable
            key={w.sun}
            accessibilityRole="button"
            accessibilityLabel={`${name(w.sun)}: ${w.noSlip} of ${w.days} ${told ? 'nights free' : 'days with no slip'}. Open the week.`}
            onPress={() => router.push({ pathname: '/weekly/[sun]', params: { sun: w.sun } })}
            style={({ pressed }) => [s.row, i > 0 && { borderTopWidth: 1, borderTopColor: c.line }, { opacity: pressed ? 0.6 : 1 }]}>
            <View style={{ flex: 1, gap: 8 }}>
              <View style={s.between}>
                <T v="label">{name(w.sun)}</T>
                <T v="small" tone="muted">
                  {w.sun === cur ? `${w.noSlip} of ${w.days} so far` : `${w.noSlip} of ${w.days} ${told ? 'free' : 'days'}`}
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

/* ---------- the finished weeks as one line on a scale of 0 to 7 days at the side; a dot touched says its week's days and
   dates ---------- */
function WeeksLine({ weeks }: { weeks: StoryWeek[] }) {
  return (
    <ScaleLine
      id="weeksFill"
      max={7}
      label={'Days with no slip each week: ' + weeks.map((x) => x.noSlip).join(', ')}
      from={fmtDate(addDays(weeks[0].sun, -6), { month: 'short', day: 'numeric' })}
      to="Last week"
      pts={weeks.map((x) => ({
        v: x.noSlip,
        tip: x.noSlip + (x.noSlip === 1 ? ' day' : ' days'),
        when: sunRange(x.sun),
        a11y: `${sunRange(x.sun)}: ${x.noSlip} of 7 days with no slip`,
      }))}
    />
  );
}

/* ---------- the north star (core north.ts): "How much do you see yourself as someone free of this?", each month's answer as
   one line on a scale of 0 to 10, drawn like the weeks. With no answer yet, the chart is drawn empty under its title. ---------- */
function FreeLine() {
  const c = useTheme();
  const { snap } = useStore();
  const list = freeList(snap.settings);
  const first = list[0];
  const last = list[list.length - 1];
  const when = (d: string) => fmtDate(d, { month: 'short', day: 'numeric' });
  return (
    <View style={{ gap: 4 }}>
      <T v="small" tone="muted">
        How free of this you see yourself
      </T>
      {last ? (
        <>
          <Text style={[s.head, { color: c.ink }]} accessibilityLabel={list.length > 1 ? `${first.s} to ${last.s} of 10` : `${last.s} of 10`}>
            {list.length > 1 ? `${first.s} → ${last.s}` : `${last.s} of 10`}
          </Text>
          <T tone="muted">{list.length > 1 ? 'From your first answer to your last.' : 'Your starting point. You answer again once a month.'}</T>
        </>
      ) : null}
      <ScaleLine
        id="freeFill"
        max={10}
        ticks={[0, 5, 10]}
        label={list.length ? 'How free of this you see yourself, each month: ' + list.map((x) => x.s).join(', ') + ' of 10' : 'No answers yet'}
        from={first ? when(first.d) : ''}
        to={last && last !== first ? when(last.d) : ''}
        pts={list.map((x) => ({ v: x.s, tip: x.s + ' of 10', when: when(x.d), a11y: `${when(x.d)}: ${x.s} of 10` }))}
      />
    </View>
  );
}

/* ---------- one line on a scale at the side (0 to max), the Weeks way: a soft fill under it, a dashed top, a dot for each point,
   the newest a little bigger; a dot touched says its number and when. No points: the scale drawn empty. ---------- */
const LINE_H = 176;
const GUTTER = 22;
interface LinePt {
  v: number;
  tip: string;
  when: string;
  a11y: string;
}
function ScaleLine({
  id,
  pts: vals,
  max,
  ticks,
  label,
  from,
  to,
}: {
  id: string;
  pts: LinePt[];
  max: number;
  ticks?: number[];
  label: string;
  from: string;
  to: string;
}) {
  const c = useTheme();
  const [w, setW] = useState(0);
  const [pick, setPick] = useState<number | null>(null);
  const yTop = 10;
  const y0 = LINE_H - 10;
  const x0 = GUTTER + 10;
  const x1 = w - 10;
  const yOf = (n: number) => y0 - (n / max) * (y0 - yTop);
  /* one point sits at the right, where "now" is */
  const xOf = (i: number) => (vals.length > 1 ? x0 + (i / (vals.length - 1)) * (x1 - x0) : x1);
  const pts = vals.map((x, i): [number, number] => [xOf(i), yOf(x.v)]);
  let d = '';
  pts.forEach(([x, y], i) => {
    if (!i) d = `M${x} ${y}`;
    else {
      const [px, py] = pts[i - 1];
      const mx = (px + x) / 2;
      d += ` C${mx} ${py} ${mx} ${y} ${x} ${y}`;
    }
  });
  const area = pts.length > 1 ? d + ` L${pts[pts.length - 1][0]} ${y0} L${pts[0][0]} ${y0} Z` : '';
  const hit = Math.max(28, Math.min(44, pts.length > 1 ? (x1 - x0) / (pts.length - 1) : 44));
  const tip = pick == null || !pts[pick] ? null : { x: pts[pick][0], y: pts[pick][1], p: vals[pick] };
  const TIP_W = 116;
  const axis = ticks ?? Array.from({ length: max + 1 }, (_, n) => n);
  return (
    <View style={{ gap: 4 }} accessibilityLabel={label}>
      <View style={{ height: LINE_H }} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
        {w ? (
          <>
            <Svg width={w} height={LINE_H} style={StyleSheet.absoluteFill}>
              <Defs>
                <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={RUN[0]} stopOpacity={0.28} />
                  <Stop offset="1" stopColor={RUN[0]} stopOpacity={0} />
                </LinearGradient>
              </Defs>
              <Path d={`M${x0} ${yTop} L${x1} ${yTop}`} stroke={c.line} strokeWidth={1} strokeDasharray="4 5" />
              <Path d={`M${x0} ${y0} L${x1} ${y0}`} stroke={c.line} strokeWidth={1} />
              {area ? <Path d={area} fill={`url(#${id})`} /> : null}
              {pts.length > 1 ? <Path d={d} stroke={RUN[0]} strokeWidth={3} fill="none" strokeLinecap="round" /> : null}
              {pts.map(([x, y], i) => (
                <Circle
                  key={i}
                  cx={x}
                  cy={y}
                  r={i === pick ? 7 : i === pts.length - 1 ? 6 : 4}
                  fill={i === pick ? RUN[0] : c.bg}
                  stroke={RUN[0]}
                  strokeWidth={2.5}
                />
              ))}
            </Svg>
            {axis.map((n) => (
              <T key={n} v="small" tone="muted" style={[s.axis, { top: yOf(n) - 9 }]}>
                {n}
              </T>
            ))}
            {pts.map(([x], i) => (
              <Pressable
                key={i}
                accessibilityRole="button"
                accessibilityLabel={vals[i].a11y}
                onPress={() => {
                  buzz('tick');
                  setPick(pick === i ? null : i);
                }}
                style={{ position: 'absolute', left: x - hit / 2, width: hit, top: 0, bottom: 0 }}
              />
            ))}
            {tip ? (
              <View
                pointerEvents="none"
                style={[
                  s.tip,
                  { backgroundColor: c.ink, width: TIP_W, left: Math.max(0, Math.min(w - TIP_W, tip.x - TIP_W / 2)) },
                  tip.y > 66 ? { top: tip.y - 60 } : { top: tip.y + 14 },
                ]}>
                <Text style={[s.tipNum, { color: c.bg }]}>{tip.p.tip}</Text>
                <Text style={[s.tipWhen, { color: c.bg }]}>{tip.p.when}</Text>
              </View>
            ) : null}
          </>
        ) : null}
      </View>
      {from || to ? (
        <View style={[s.between, { paddingLeft: GUTTER }]}>
          <T v="small" tone="muted">
            {from}
          </T>
          <T v="small" tone="muted">
            {to}
          </T>
        </View>
      ) : null}
    </View>
  );
}

/* a week's seven nights, one mark each (components/night-marks.tsx): warm light no slip, calm violet a slip, hollow and dashed a
   night not told, a faint ring for a day still to come */
function Strip({ ds }: { ds: StoryDay[] }) {
  return (
    <NightMarks
      marks={ds.map((d) => (d.state === 'clean' ? 'free' : d.state === 'slip' ? 'slip' : d.state === 'untold' ? 'untold' : 'none'))}
      size={16}
      gap={8}
    />
  );
}

/* the Days colors (calendar-card.tsx, day-log.tsx): warm light for a day with no slip, calm violet for a slip */
const RUN: [string, string] = ['#F27A1C', '#FFC43D'];
const ON_RUN = '#4A1E05';
const kit = (dark: boolean, line: string) => ({
  slip: dark ? '#4C3C96' : '#D9D2F7',
  onSlip: dark ? '#D9D0FF' : '#3B2F7A',
  faint: dark ? 'rgba(255,255,255,0.12)' : line,
});

/* ---------- one week told in full, on its own page ---------- */
export function WeekDetail({ sun }: { sun: string }) {
  const c = useTheme();
  const { snap, tk, apply } = useStore();
  const st = snap.settings!;
  const { nights } = useNights();
  const { weeks, name } = useWeeks();
  const i = weeks.findIndex((w) => w.sun === sun);
  const open = (x: string) => router.push({ pathname: '/review', params: { s: x } });
  const read = weekRead(
    snap.days,
    st,
    sun,
    tk,
    sunWeek(snap.days, st, sun, tk, nights),
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
              onPress={() => {
                buzz('tap');
                open(sun);
              }}
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
  const k = kit(c.scheme === 'dark', c.line);
  /* days in a row of one kind join into one band, the way the month draws them */
  const bands: [number, number, 'clean' | 'slip'][] = [];
  ds.forEach((d, i) => {
    if (d.state !== 'clean' && d.state !== 'slip') return;
    const last = bands[bands.length - 1];
    if (last && last[2] === d.state && last[1] === i - 1) last[1] = i;
    else bands.push([i, i, d.state]);
  });
  return (
    <View>
      <View style={s.week}>
        {ds.map((d) => (
          <Text key={d.k} style={[s.dow, s.dayBox, { color: c.muted }]}>
            {d.l}
          </Text>
        ))}
      </View>
      <View style={[s.week, { height: 48 }]}>
        {bands.map(([x, y, kind]) => (
          <View key={x} pointerEvents="none" style={[s.bandBox, { left: `${(x / 7) * 100}%`, width: `${((y - x + 1) / 7) * 100}%` }]}>
            {kind === 'clean' ? (
              <Glow colors={RUN} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.band} />
            ) : (
              <View style={[s.band, { backgroundColor: k.slip }]} />
            )}
          </View>
        ))}
        {ds.map((d) => {
          const live = d.state === 'clean' || d.state === 'slip';
          const n = <Text style={[s.cellN, { color: d.state === 'clean' ? ON_RUN : d.state === 'slip' ? k.onSlip : c.muted }]}>{Number(d.k.slice(8))}</Text>;
          return live ? (
            <Pressable
              key={d.k}
              accessibilityRole="button"
              accessibilityLabel={`${d.name} ${fmtDate(d.k, { month: 'long', day: 'numeric' })}: ${d.state === 'slip' ? 'a slip' : 'no slip'}`}
              onPress={() => {
                buzz('tap');
                router.push({ pathname: '/day/[date]', params: { date: d.k } });
              }}
              style={({ pressed }) => [s.dayBox, s.dayCell, { opacity: pressed ? 0.7 : 1 }]}>
              {n}
            </Pressable>
          ) : (
            <View key={d.k} style={[s.dayBox, s.dayCell]}>
              {d.state === 'ahead' ? <View style={[s.ring, { borderColor: k.faint }]}>{n}</View> : n}
            </View>
          );
        })}
      </View>
    </View>
  );
}

/* the goal this Sunday set, and how the week after went: counted from the log, or as the person said */
function Goal({ sun }: { sun: string }) {
  const { snap, tk } = useStore();
  const r = snap.reviews[sunKey(sun)]!.sun!;
  const g = r.g!;
  const next = addDays(sun, 7);
  const health = useNights();
  const done = sunGoalCount(snap.days, g, next, tk, health.nights);
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
  tip: { position: 'absolute', borderRadius: 12, paddingVertical: 6, alignItems: 'center' },
  tipNum: { fontFamily: font.display, fontSize: 17, lineHeight: 21 },
  tipWhen: { fontFamily: font.body, fontSize: 13, lineHeight: 17, opacity: 0.8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, minHeight: 44 },
  strip: { flexDirection: 'row', gap: 4 },
  seg: { flex: 1, height: 10, borderRadius: 5 },
  week: { flexDirection: 'row' },
  dayBox: { flex: 1, alignItems: 'center' },
  dow: { fontFamily: font.bodySemi, fontSize: 13, textAlign: 'center', paddingBottom: 6 },
  dayCell: { height: 48, justifyContent: 'center' },
  bandBox: { position: 'absolute', top: 4, bottom: 4, paddingHorizontal: 3 },
  band: { flex: 1, borderRadius: 20 },
  ring: { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
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
