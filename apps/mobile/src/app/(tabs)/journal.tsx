/* The Journal: what happened. Days (the month and every day), Your pattern (a few plain answers, each with the graph behind
   it: are slips getting further apart, when it happens, what sets it off, what is different on hard days, what helps),
   Weeks (the weekly look back). Days and Weeks are ported from the legacy viewJournal, daysBody and weekBody. Without a
   tip, Pattern shows its first part (the one look, the gaps between slips, My numbers) and the rest faded behind a card
   that opens the tip sheet (core supporter.ts, patPartOpen). */
import {
  daysList,
  fmtDate,
  fmtHour,
  inTen,
  myNumbers,
  patDiffs,
  patGaps,
  patInsights,
  patKeys,
  patNeeds,
  patNowLine,
  patRideOut,
  patTriggerLines,
  patTriggers,
  patWeeks,
  patWhen,
  plural,
  logRateKeys,
  ratingOf,
  talkEvidence,
  urWorks,
  weekOf,
  type PatGo,
  type PatRange,
} from '@daybook/core';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Platform, Pressable, StyleSheet, View, type ScrollViewInstance, type ViewStyle } from 'react-native';
import { Text } from '@/components/text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Appear } from '@/components/appear';
import { EmptyChart, FeelTiles, HBars, Legend, NumbersTable } from '@/components/charts';
import { Clock, DiffDots, Gaps, RideWeeks, WeekRow } from '@/components/pattern-charts';
import { Segments } from '@/components/form';
import { Screen } from '@/components/screen';
import { CalendarCard } from '@/components/calendar-card';
import { DaysCard } from '@/components/today';
import { TodaySoFar } from '@/components/today-log';
import { SundayCard } from '@/components/sunday-card';
import { UnlockCard, useLocked } from '@/components/support';
import { Button, Card, Chip, Icon, T } from '@/components/ui';
import { SundayList } from '@/components/sunday-list';
import { WeekView } from '@/components/week-view';
import { SetupFirst } from '@/components/welcome';
import { useStore } from '@/lib/store';
import { font, useTheme } from '@/lib/theme';

type Pane = 'days' | 'patterns' | 'weeks';
const fmtD = (k: string) => fmtDate(k, { weekday: 'short', month: 'short', day: 'numeric' });

export default function Journal() {
  const params = useLocalSearchParams<{ pane?: string }>();
  const [pane, setPane] = useState<Pane>(params.pane === 'patterns' || params.pane === 'weeks' ? params.pane : 'days');
  /* a link to a section (Today's "Month ›" opens Days) moves to it, even when Journal is already open on another one */
  useEffect(() => {
    if (params.pane === 'days' || params.pane === 'patterns' || params.pane === 'weeks') setPane(params.pane);
  }, [params.pane]);
  const { snap, tk } = useStore();
  const st = snap.settings;
  const [week, setWeek] = useState<number | null>(null);
  const scroll = useRef<ScrollViewInstance>(null);
  const inset = useSafeAreaInsets();
  const [paneY, setPaneY] = useState(0);
  if (!st) return <SetupFirst title="Journal" line="Everything you log shows up here by itself: urges ridden out, slips, and how each day went." />;
  const sub =
    pane === 'days'
      ? 'Everything you log shows up here by itself. Tap a day to add or fix something.'
      : pane === 'patterns'
        ? 'When it gets hard, what sets it off, and how you are climbing.'
        : 'Your Sunday reviews, and each week in numbers.';
  const cw = Math.max(0, weekOf(tk, st));
  return (
    <Screen eyebrow="My Daybook" title="Journal" sub={<T tone="muted">{sub}</T>} scrollRef={scroll}>
      <Segments
        label="Journal sections"
        list={[
          ['days', 'Days'],
          ['patterns', 'Pattern'],
          ['weeks', 'Weeks'],
        ]}
        cur={pane}
        onPick={setPane}
      />
      <View onLayout={(e) => setPaneY(e.nativeEvent.layout.y)}>
        <Appear key={pane} style={{ gap: 14 }}>
          {pane === 'days' ? (
            <DaysPane />
          ) : pane === 'patterns' ? (
            <PatternsPane onGo={(y) => scroll.current?.scrollTo({ y: Math.max(0, inset.top + 16 + paneY + y - 12), animated: true })} />
          ) : (
            <>
              <SundayList snap={snap} tk={tk} />
              <T v="h2" style={{ marginTop: 6 }}>
                Week by week
              </T>
              <WeekView k={week == null ? cw : week} onNav={setWeek} />
            </>
          )}
        </Appear>
      </View>
    </Screen>
  );
}

/* ---------- days ---------- */
function DaysPane() {
  const c = useTheme();
  const { snap, tk, now } = useStore();
  const st = snap.settings!;
  const [all, setAll] = useState(false);
  const list = daysList(snap.days, st, tk, all);
  const tone = (status: string) =>
    status === 'slip'
      ? { bg: c.slipSoft, fg: c.slipText }
      : status === 'clean'
        ? { bg: c.mintSoft, fg: c.mintText }
        : status === 'tracked'
          ? { bg: c.skySoft, fg: c.skyText }
          : { bg: c.surface2, fg: c.muted };
  return (
    <>
      {/* today's entries and the week's goal from Sunday live here; Today keeps one line for both, under the next step */}
      <TodaySoFar snap={snap} tk={tk} />
      <CalendarCard snap={snap} tk={tk} />
      <DaysCard snap={snap} tk={tk} now={now} size="lg" />
      <SundayCard snap={snap} tk={tk} />
      {list.weeks.map((w) => (
        <Card key={w.wk + w.title}>
          <View style={s.between}>
            <T v="h2" style={{ flex: 1 }}>
              {w.title}
            </T>
            <T v="small" tone="muted">
              {w.count}
            </T>
          </View>
          <View style={{ gap: 2 }}>
            {w.rows.map((r) => {
              const t = tone(r.status);
              return (
                <Pressable
                  key={r.key}
                  accessibilityRole="button"
                  accessibilityLabel={`${r.weekday} ${r.date}. ${r.pill}. ${r.n ? (r.n === 1 ? 'Logged at ' : `${r.n} logged: `) : ''}${r.times}${r.rate ? '. ' + r.rate : ''}${r.pts ? '. ' + r.pts + ' points' : ''}`}
                  onPress={() => router.push({ pathname: '/day/[date]', params: { date: r.key } })}
                  style={({ pressed }) => [s.day, { borderTopColor: c.line, opacity: pressed ? 0.75 : 1 }]}>
                  <View style={{ width: 56 }}>
                    <Text style={{ fontFamily: font.bodyBold, fontSize: 15, color: c.ink }}>{r.weekday}</Text>
                    <T v="small" tone="muted">
                      {r.date}
                    </T>
                  </View>
                  <View style={{ flex: 1, gap: 1 }}>
                    <T v="small" tone="muted">
                      {r.phase}
                    </T>
                    <T v="small">{r.n ? (r.n === 1 ? 'Logged at ' : `${r.n} logged: `) + r.times : r.times}</T>
                    {r.rate ? (
                      <T v="small" tone="muted" style={{ fontVariant: ['tabular-nums'] }}>
                        {r.rate}
                      </T>
                    ) : null}
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    {r.pill ? (
                      <View style={[s.pill, { backgroundColor: t.bg }]}>
                        <Text style={{ fontFamily: font.bodySemi, fontSize: 12, color: t.fg }}>{r.pill}</Text>
                      </View>
                    ) : null}
                    {r.pts ? (
                      <T v="small" tone="mintText" style={{ fontFamily: font.bodySemi }}>
                        +{r.pts}
                      </T>
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Card>
      ))}
      {list.more > 0 ? <Button kind="ghost" label={`Show ${list.more} earlier days`} onPress={() => setAll(true)} /> : null}
    </>
  );
}

/* ---------- your pattern ---------- */
const GO_IC: Record<PatGo, string> = { apart: 'sunrise', when: 'timer', what: 'bolt', days: 'heart' };
function PatternsPane({ onGo }: { onGo: (y: number) => void }) {
  const c = useTheme();
  const { snap, tk, now } = useStore();
  const st = snap.settings!;
  const [range, setRange] = useState<PatRange>('90');
  const [ys, setYs] = useState<Partial<Record<PatGo, number>>>({});
  const locked = useLocked('stats');
  const keys = patKeys(range, snap.days, st, tk);
  const g = patGaps(snap.days, st, tk);
  const lastSlip = Object.keys(snap.days)
    .filter((k) => k <= tk && (snap.days[k]?.events || []).some((e) => e.outcome === 'slipped'))
    .sort()
    .pop();
  const weeks = patWeeks(snap.days, keys, range === 'all' ? 26 : 13);
  const ride = patRideOut(weeks);
  const when = patWhen(snap.days, st, keys, tk);
  const trig = patTriggers(snap.days, st, keys, tk);
  const needs = patNeeds(snap.days, keys);
  const diffs = patDiffs(snap.days, keys);
  const ins = patInsights(g, ride, when, trig.list);
  const works = urWorks(snap.days, tk);
  const ev = talkEvidence(snap.days);
  const nums = myNumbers(snap.days, st, tk, now);
  /* the ratings this log holds: mood, urges and stress, and the older ones on a log that has them (core logRateKeys) */
  const series = logRateKeys(snap.days).map((id) => ({
    id,
    name: ratingOf(id).name,
    vals: keys.map((k) => {
      const ci = snap.days[k]?.checkin;
      return ci && typeof ci[id] === 'number' ? (ci[id] as number) : null;
    }),
  }));
  const anyRating = series.some((x) => x.vals.some((v) => v != null));
  const at = (k: PatGo) => (e: { nativeEvent: { layout: { y: number } } }) => {
    if (locked) return;
    const y = e.nativeEvent.layout.y;
    setYs((o) => (o[k] === y ? o : { ...o, [k]: y }));
  };
  const hard = when.hard.weekdays || when.hard.weekends;
  const trendLine =
    g.trend === 'apart'
      ? 'Getting further apart: about ' + g.late + ' clean days between slips lately, up from ' + g.early + '.'
      : g.trend === 'closer'
        ? 'Lately they have come closer together: about ' +
          g.late +
          ' days between slips, down from ' +
          g.early +
          '. That is a signal, not a verdict. The hours and triggers below show where to aim.'
        : g.trend === 'steady'
          ? 'About the same so far: around ' + g.late + ' clean days between slips.'
          : 'A trend shows once there are four slips to compare.';
  const rideLine = ride
    ? ride.now > ride.then + 0.05
      ? 'You ride out ' + inTen(ride.now) + ' hard moments now, up from ' + inTen(ride.then) + '.'
      : 'You ride out about ' + inTen(ride.now) + ' hard moments lately.'
    : '';
  const numbers = (
    <Card>
      <T v="h2">My numbers</T>
      <View style={s.stats}>
        {nums.map((x) => (
          <View key={x.l} style={[s.stat, { backgroundColor: c.surface2 }]}>
            <T v="small" tone="muted">
              {x.l}
            </T>
            <Text style={[s.statB, { color: c.ink }]}>{x.b}</Text>
            <T v="small" tone="muted">
              {x.s}
            </T>
          </View>
        ))}
      </View>
    </Card>
  );
  return (
    <>
      <View style={s.chips} accessibilityLabel="Time range">
        {(
          [
            ['30', '30 days'],
            ['90', '90 days'],
            ['all', 'All'],
          ] as [PatRange, string][]
        ).map(([k, l]) => (
          <Chip key={k} label={l} on={range === k} onPress={() => setRange(k)} />
        ))}
      </View>
      <Card style={{ backgroundColor: c.accentSoft, borderColor: c.accent }}>
        <T v="eyebrow" tone="accentText">
          Your pattern in one look
        </T>
        {ins.length ? (
          ins.map((x, i) => (
            <Appear key={x.t} delay={120 + i * 110} by={6}>
              <Pressable
                accessibilityRole="button"
                accessibilityHint="Shows the graph behind it"
                onPress={() => ys[x.go] != null && onGo(ys[x.go]!)}
                style={({ pressed }) => [s.ins, { backgroundColor: c.surface, shadowColor: c.lip, opacity: pressed ? 0.8 : 1 }]}>
                <View style={[s.insIc, { backgroundColor: c.accentSoft }]}>
                  <Icon name={GO_IC[x.go]} size={18} color={c.accentText} />
                </View>
                <T style={{ flex: 1, fontFamily: font.bodySemi }}>{x.t}</T>
                <Icon name="down" size={18} color={c.muted} />
              </Pressable>
            </Appear>
          ))
        ) : (
          <T>
            Your pattern fills in as you log. Log urges and slips with a time and a reason, and this page starts to answer: when, what sets it off, and whether
            slips are getting further apart.
          </T>
        )}
      </Card>

      <View onLayout={at('apart')}>
        <Block title="Are slips getting further apart?">
          {g.slips ? (
            <>
              <Gaps g={g} />
              <T v="small" tone="muted">
                Each bar is the clean days before a slip, oldest on the left. The open bar is the stretch going now.
              </T>
              <T style={{ fontFamily: font.bodySemi }}>{trendLine}</T>
              <T>{patNowLine(g, tk, lastSlip || null)}</T>
              <NumbersTable
                cap="Clean days before each slip"
                head={['Slip', 'Clean days before']}
                rows={g.runs.map((r, i) => [String(i + 1), String(r)]).reverse()}
              />
            </>
          ) : (
            <EmptyChart text={patNowLine(g, tk, null)} />
          )}
          {weeks.some((w) => w.rode + w.slipped) ? (
            <>
              <T v="label" style={{ marginTop: 8 }}>
                Ridden out, week by week
              </T>
              <Legend
                items={[
                  ['rode', 'Rode it out'],
                  ['slip', 'Slipped'],
                ]}
              />
              <RideWeeks weeks={weeks} />
              {rideLine ? <T style={{ fontFamily: font.bodySemi }}>{rideLine}</T> : null}
              <NumbersTable
                cap="Entries each week"
                head={['Week from', 'Rode it out', 'Slipped']}
                rows={weeks.map((w) => [fmtD(w.from), String(w.rode), String(w.slipped)]).reverse()}
              />
            </>
          ) : null}
        </Block>
      </View>

      {locked ? numbers : null}
      <Deep locked={locked} onY={(y) => setYs((o) => (o.when === y ? o : { ...o, when: y, what: y, days: y }))}>
        <View onLayout={at('when')}>
          <Block title="When does it happen?" count={when.timed ? when.timed + ' with a time' : ''}>
            {when.timed ? (
              <>
                <Legend
                  items={(
                    [
                      ['rode', 'Rode it out'],
                      ['slip', 'Slipped'],
                    ] as ['rode' | 'slip' | 'win', string][]
                  ).concat(hard ? [['win', 'Your hard hours']] : [])}
                />
                <Clock hours={when.hours} hard={when.hard} />
                {hard ? (
                  <>
                    {when.hard.weekdays ? (
                      <T>
                        <Text style={{ fontFamily: font.bodyBold }}>
                          {when.hard.same ? 'Hard hours: ' : 'Weekdays: '}
                          {when.hard.weekdays.label}.
                        </Text>{' '}
                        {when.hard.weekdays.line}
                      </T>
                    ) : null}
                    {when.hard.weekends ? (
                      <T>
                        <Text style={{ fontFamily: font.bodyBold }}>Weekends: {when.hard.weekends.label}.</Text> {when.hard.weekends.line}
                      </T>
                    ) : null}
                    <T v="small" tone="muted">
                      The same hard hours Today watches for, from the last 60 days.
                    </T>
                  </>
                ) : (
                  <T v="small" tone="muted">
                    Hard hours show up once one two-hour stretch holds two slips or six urges.
                  </T>
                )}
                <T v="label" style={{ marginTop: 8 }}>
                  Days of the week
                </T>
                <WeekRow week={when.week} hard={when.day ? when.day.d : null} />
                {when.day ? (
                  <T style={{ fontFamily: font.bodySemi }}>
                    {when.day.name}s are the hardest: {when.day.n} of {when.day.slips ? plural(when.day.of, 'slip') : when.day.of + ' entries'}.
                  </T>
                ) : null}
                <NumbersTable
                  cap="Entries by hour"
                  head={['Hour', 'Rode it out', 'Slipped']}
                  rows={when.hours
                    .filter((b) => b.rode + b.slipped)
                    .map((b) => [fmtHour(b.h) + ' to ' + fmtHour((b.h + 1) % 24), String(b.rode), String(b.slipped)])}
                />
              </>
            ) : (
              <EmptyChart text="Your clock fills in after you log an entry with a time." />
            )}
          </Block>
        </View>

        <View onLayout={at('what')}>
          <Block title="What sets it off?">
            {trig.list.length ? (
              <>
                <Legend
                  items={[
                    ['rode', 'Rode it out'],
                    ['slip', 'Slipped'],
                  ]}
                />
                <HBars
                  items={trig.list.map((r) => ({
                    label: r.t,
                    segs: [
                      [r.rode, 'rode'],
                      [r.slipped, 'slip'],
                    ] as [number, 'rode' | 'slip'][],
                  }))}
                />
                {patTriggerLines(trig.list).map((l) => (
                  <T key={l} style={{ fontFamily: font.bodySemi }}>
                    {l}
                  </T>
                ))}
                {trig.none ? (
                  <T v="small" tone="muted">
                    {trig.none === 1 ? '1 entry' : trig.none + ' entries'} had no reason picked.
                  </T>
                ) : null}
                <NumbersTable
                  cap="Entries by what set them off"
                  head={['Reason', 'Rode it out', 'Slipped']}
                  rows={trig.list.map((r) => [r.t, String(r.rode), String(r.slipped)])}
                />
              </>
            ) : (
              <EmptyChart text="Pick a reason when you log an entry, and this shows what sets it off." />
            )}
            {needs.length ? (
              <>
                <T v="label" style={{ marginTop: 8 }}>
                  What the pull was after
                </T>
                <HBars
                  items={needs.map((x) => ({ label: x.name, segs: [[x.count, 'acc']] as [number, 'acc'][] }))}
                  unit={(n) => (n === 1 ? 'time' : 'times')}
                />
                <T v="small" tone="muted">
                  From Talk it through.
                </T>
              </>
            ) : null}
          </Block>
        </View>

        <View onLayout={at('days')}>
          <Block title="What is different on hard days?">
            {diffs.list.length ? (
              <>
                <Legend
                  items={[
                    ['rode', 'Days with no slip'],
                    ['slip', 'Slip days'],
                  ]}
                />
                <DiffDots list={diffs.list} />
                {diffs.list.map((d) => (
                  <T key={d.k}>{d.line}</T>
                ))}
                <T v="small" tone="muted">
                  From {plural(diffs.cleanN, 'check-in day')} with no slip and {diffs.slipN} with one. Only differences big enough to mean something show here.
                </T>
              </>
            ) : (
              <T tone="muted">
                {diffs.cleanN >= 3 && diffs.slipN >= 3
                  ? 'No big differences so far between your check-ins on slip days and on days with no slip.'
                  : 'This needs check-ins on at least three slip days and three days with no slip. It waits until it means something.'}
              </T>
            )}
            {anyRating ? (
              <>
                <T v="label" style={{ marginTop: 8 }}>
                  Your check-ins over time
                </T>
                <FeelTiles keys={keys} series={series} />
              </>
            ) : null}
          </Block>
        </View>

        <Block title="What helps you">
          {works.length || ev.chose + ev.went ? (
            <>
              {works.length ? (
                <>
                  <Legend
                    items={[
                      ['rode', 'It passed after'],
                      ['slip', 'Still strong or slipped after'],
                    ]}
                  />
                  <HBars
                    items={works.map((x) => ({
                      label: x.name,
                      segs: [
                        [x.passed, 'rode'],
                        [x.not, 'slip'],
                      ] as [number, 'rode' | 'slip'][],
                    }))}
                    unit={(n) => (n === 1 ? 'try' : 'tries')}
                  />
                  <T v="small" tone="muted">
                    SOS tools over the last four months: after each one, did the urge pass? SOS uses this to choose what to suggest.
                  </T>
                </>
              ) : null}
              {ev.chose + ev.went ? (
                <T style={{ fontFamily: font.bodySemi }}>
                  You talked it through and chose something else {plural(ev.chose, 'time')} out of {ev.chose + ev.went}.
                </T>
              ) : null}
            </>
          ) : (
            <EmptyChart text="After a few SOS uses or talk-throughs, this shows what helps you most." />
          )}
        </Block>
      </Deep>

      {locked ? null : numbers}
    </>
  );
}

/** the deeper part of the pattern: as it is for a supporter; otherwise its first part, faded behind a card that opens it */
function Deep({ locked, onY, children }: { locked: boolean; onY: (y: number) => void; children: React.ReactNode }) {
  const c = useTheme();
  if (!locked) return <>{children}</>;
  return (
    <View onLayout={(e) => onY(e.nativeEvent.layout.y)} style={{ gap: 14 }}>
      <View style={s.peek} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <View style={[{ gap: 14, opacity: 0.55 }, PEEK_BLUR]}>{children}</View>
        <LinearGradient colors={[c.bg + '00', c.bg]} style={s.peekFade} />
      </View>
      <UnlockCard extra="stats" />
    </View>
  );
}
/* a soft blur on the web; a phone shows the fade alone */
const PEEK_BLUR = (Platform.OS === 'web' ? { filter: 'blur(3px)' } : null) as ViewStyle | null;

function Block({ title, count, sub, children }: { title: string; count?: string; sub?: string; children: React.ReactNode }) {
  return (
    <Card>
      <View style={s.between}>
        <T v="h2" style={{ flex: 1 }}>
          {title}
        </T>
        {count ? (
          <T v="small" tone="muted">
            {count}
          </T>
        ) : null}
      </View>
      {sub ? (
        <T v="small" tone="muted">
          {sub}
        </T>
      ) : null}
      {children}
    </Card>
  );
}

const s = StyleSheet.create({
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 },
  day: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderTopWidth: 1, minHeight: 56 },
  pill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  ins: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  insIc: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stat: { flexGrow: 1, flexBasis: '45%', gap: 2, padding: 12, borderRadius: 16 },
  statB: { fontFamily: font.display, fontSize: 26 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  peek: { maxHeight: 250, overflow: 'hidden' },
  peekFade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 150 },
});
