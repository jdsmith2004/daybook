/* The Journal: what happened. Days (the month and every day), Patterns (my numbers and the charts), Weeks (the weekly look back).
   Ported from the legacy viewJournal, daysBody, patternsBody and weekBody. */
import {
  addDays,
  BUCKET_T,
  bucketOf,
  busiestWindow,
  daysList,
  eventsOf,
  gameCompute,
  hourBins,
  myNumbers,
  noticing,
  one,
  patterns,
  pct,
  perDayCounts,
  rangeKeys,
  rangeStart,
  SERIES,
  timesPerDay,
  triggerCounts,
  urWorks,
  weekOf,
  fmtDate,
  fmtHour,
} from '@daybook/core';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Appear } from '@/components/appear';
import { DayColumns, EmptyChart, FeelTiles, HBars, HourChart, Legend, NumbersTable } from '@/components/charts';
import { Segments } from '@/components/form';
import { Screen } from '@/components/screen';
import { DaysCard } from '@/components/today';
import { Button, Card, Chip, T } from '@/components/ui';
import { WeekView } from '@/components/week-view';
import { useStore } from '@/lib/store';
import { font, useTheme } from '@/lib/theme';

type Pane = 'days' | 'patterns' | 'weeks';
const fmtD = (k: string) => fmtDate(k, { weekday: 'short', month: 'short', day: 'numeric' });

export default function Journal() {
  const params = useLocalSearchParams<{ pane?: string }>();
  const [pane, setPane] = useState<Pane>(params.pane === 'patterns' || params.pane === 'weeks' ? params.pane : 'days');
  const { snap, tk } = useStore();
  const st = snap.settings;
  const [week, setWeek] = useState<number | null>(null);
  if (!st) return <Screen title="Journal">{null}</Screen>;
  const sub = pane === 'days' ? 'Everything you log shows up here by itself. Tap a day to add or fix something.' : pane === 'patterns' ? 'What your log shows, in numbers and charts.' : 'One short look back each week.';
  const cw = Math.max(0, weekOf(tk, st));
  return (
    <Screen eyebrow="My Daybook" title="Journal" sub={<T tone="muted">{sub}</T>}>
      <Segments
        label="Journal sections"
        list={[
          ['days', 'Days'],
          ['patterns', 'Patterns'],
          ['weeks', 'Weeks'],
        ]}
        cur={pane}
        onPick={setPane}
      />
      <Appear key={pane} style={{ gap: 14 }}>
        {pane === 'days' ? <DaysPane /> : pane === 'patterns' ? <PatternsPane /> : <WeekView k={week == null ? cw : week} onNav={setWeek} />}
      </Appear>
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
    status === 'slip' ? { bg: c.slipSoft, fg: c.slipText } : status === 'clean' ? { bg: c.mintSoft, fg: c.mintText } : status === 'tracked' ? { bg: c.skySoft, fg: c.skyText } : { bg: c.surface2, fg: c.muted };
  return (
    <>
      <DaysCard snap={snap} tk={tk} now={now} size="lg" />
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
                  accessibilityLabel={`${r.weekday} ${r.date}. ${r.pill}. ${r.times}${r.rate ? '. ' + r.rate : ''}${r.pts ? '. ' + r.pts + ' points' : ''}`}
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
                    <T v="small">{r.times}</T>
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

/* ---------- patterns ---------- */
function PatternsPane() {
  const c = useTheme();
  const { snap, tk, now } = useStore();
  const st = snap.settings!;
  const [range, setRange] = useState<'7' | '30' | 'all'>('all');
  const g = gameCompute(snap.days, st, snap.reviews, tk);
  const keys = rangeKeys(range, st, tk, snap.days);
  const from = keys[0];
  const evs = eventsOf(snap.days, from);
  const longAll = rangeStart('all', st, tk, snap.days) < addDays(tk, -89);
  const nums = myNumbers(snap.days, st, tk, now);
  const totalRange = keys.reduce((a, k) => a + (g.perDay[k] || 0), 0);
  const series = SERIES.map(([id, name]) => ({
    id,
    name,
    vals: keys.map((k) => {
      const ci = snap.days[k]?.checkin;
      return ci && typeof ci[id] === 'number' ? (ci[id] as number) : null;
    }),
  }));
  const anyRating = series.some((x) => x.vals.some((v) => v != null));
  const rows = perDayCounts(snap.days, keys);
  const evTotal = rows.reduce((a, r) => a + r.rode + r.slipped, 0);
  const tpd = timesPerDay(snap.days, keys);
  const timed = evs.filter((e) => e.time);
  const bw = busiestWindow(evs, st.rollover);
  const bc: Record<string, number> = {};
  timed.forEach((e) => {
    const b = bucketOf(e.time!);
    bc[b] = (bc[b] || 0) + 1;
  });
  const topB = Object.keys(bc).sort((a, b) => bc[b] - bc[a])[0];
  const bins = hourBins(evs, st.rollover);
  const tr = triggerCounts(evs, st.opts);
  const trItems = tr
    .filter((r) => r.k !== 'none')
    .concat(tr.filter((r) => r.k === 'none'))
    .map((r) => ({ label: r.t, dim: r.k === 'none', segs: [[r.rode, 'rode'], [r.slipped, 'slip']] as [number, 'rode' | 'slip'][] }));
  const works = urWorks(snap.days, tk);
  const p = patterns(snap.days);
  const notice = noticing(snap.days, st, tk, from);
  const hr = (h: number) => fmtHour(h);
  return (
    <>
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
      <View style={s.chips} accessibilityLabel="Time range">
        {(
          [
            ['7', '7 days'],
            ['30', '30 days'],
            ['all', longAll ? '90 days' : 'All'],
          ] as ['7' | '30' | 'all', string][]
        ).map(([k, l]) => (
          <Chip key={k} label={l} on={range === k} onPress={() => setRange(k)} />
        ))}
      </View>
      <Block title="Points each day" count={totalRange.toLocaleString('en-US') + ' in this range'}>
        {totalRange ? (
          <>
            <DayColumns keys={keys} rows={keys.map((k) => ({ a: g.perDay[k] || 0 }))} tk={tk} label="Points earned each day" />
            <NumbersTable cap="Points each day" head={['Day', 'Points']} rows={keys.map((k) => [fmtD(k), String(g.perDay[k] || 0)]).reverse()} />
          </>
        ) : (
          <EmptyChart text="Points show up here after your first log or check-in." />
        )}
      </Block>
      <Block title="Feelings over time" count="0 to 10" sub={anyRating ? 'Daily ratings. For stress, lower is easier.' : ''}>
        {anyRating ? (
          <>
            <FeelTiles keys={keys} series={series} />
            <NumbersTable
              cap="Daily ratings from 0 to 10"
              head={['Day'].concat(series.map((x) => x.name))}
              rows={keys
                .map((k, i) => [k, i] as [string, number])
                .filter((x) => series.some((sr) => sr.vals[x[1]] != null))
                .reverse()
                .map((x) => [fmtD(x[0])].concat(series.map((sr) => (sr.vals[x[1]] == null ? '–' : String(sr.vals[x[1]])))))}
            />
          </>
        ) : (
          <EmptyChart text="Ratings show up here after your first check-in." />
        )}
      </Block>
      <Block title="Entries per day" count={evTotal ? evTotal + ' in this range' : ''}>
        {rows.some((r) => r.rode + r.slipped > 0) ? (
          <>
            <Legend items={[['rode', 'Rode it out'], ['slip', 'Slipped']]} />
            <DayColumns keys={keys} rows={rows.map((r) => ({ a: r.rode, b: r.slipped }))} tk={tk} label="Entries per day, rode it out and slipped" />
            <NumbersTable cap="Entries per day" head={['Day', 'Rode it out', 'Slipped']} rows={rows.map((r) => [fmtD(r.key), String(r.rode), String(r.slipped)]).reverse()} />
          </>
        ) : (
          <EmptyChart text="Entries show up here after you log one." />
        )}
      </Block>
      <Block title="How many times in a day" count={tpd.logged ? tpd.logged + ' day' + (tpd.logged === 1 ? '' : 's') : ''} sub={tpd.logged ? 'Counted over days with an entry or a check-in.' : ''}>
        {tpd.logged ? (
          <>
            <HBars
              items={['No entries', '1 entry', '2 entries', '3 or more'].map((label, i) => ({ label, segs: [[tpd.counts[i], 'acc']] as [number, 'acc'][] }))}
              unit={(n) => (n === 1 ? 'day' : 'days')}
            />
            <NumbersTable cap="Days by number of entries" head={['Entries in a day', 'Days']} rows={['No entries', '1 entry', '2 entries', '3 or more'].map((l, i) => [l, String(tpd.counts[i])])} />
          </>
        ) : (
          <T tone="muted">Needs a day with an entry or a check-in.</T>
        )}
      </Block>
      <Block title="When it happens" count={timed.length + ' with a time'}>
        {timed.length ? (
          <>
            <Legend items={([['rode', 'Rode it out'], ['slip', 'Slipped']] as ['rode' | 'slip' | 'win', string][]).concat(bw ? [['win', 'Busiest two hours']] : [])} />
            <HourChart bins={bins} bw={bw} />
            {bw ? (
              <T>
                Busiest stretch: <Text style={{ fontFamily: font.bodyBold }}>{bw.label}</Text> ({bw.n} of {bw.total} entries).
              </T>
            ) : null}
            {topB ? (
              <T>
                Most entries are in the <Text style={{ fontFamily: font.bodyBold }}>{BUCKET_T[topB].toLowerCase()}</Text> ({bc[topB]} of {timed.length}).
              </T>
            ) : null}
            <NumbersTable cap="Entries by hour" head={['Hour', 'Rode it out', 'Slipped']} rows={bins.map((b) => [hr(b.h) + ' to ' + hr((b.h + 1) % 24), String(b.rode), String(b.slipped)])} />
          </>
        ) : (
          <EmptyChart text="Times show up here after you log an entry." />
        )}
      </Block>
      <Block title="What sets it off">
        {tr.length ? (
          <>
            <Legend items={[['rode', 'Rode it out'], ['slip', 'Slipped']]} />
            <HBars items={trItems} />
            <NumbersTable cap="Entries by what set them off" head={['Reason', 'Rode it out', 'Slipped']} rows={trItems.map((it) => [it.label, String(it.segs[0][0]), String(it.segs[1][0])])} />
          </>
        ) : (
          <EmptyChart text="Pick a reason when you log an entry to see this." />
        )}
      </Block>
      <Block title="What works for me" count="From SOS">
        {works.length ? (
          <>
            <Legend items={[['rode', 'It passed after'], ['slip', 'Still strong or slipped after']]} />
            <HBars
              items={works.map((x) => ({ label: x.name, segs: [[x.passed, 'rode'], [x.not, 'slip']] as [number, 'rode' | 'slip'][] }))}
              unit={(n) => (n === 1 ? 'try' : 'tries')}
            />
            <NumbersTable cap="SOS tools, and how the urge was after each one" head={['Tool', 'It passed', 'Did not pass']} rows={works.map((x) => [x.name, String(x.passed), String(x.not)])} />
            <T v="small" tone="muted">
              From SOS, over the last four months: after each tool, did the urge pass? SOS uses this to choose what to suggest.
            </T>
          </>
        ) : (
          <EmptyChart text="After a few SOS uses, this shows which tools help you most." />
        )}
      </Block>
      <Block title="No-slip days vs slip days">
        {p.cleanN && p.slipN ? (
          <>
            <View style={[s.tbl, { borderColor: c.line }]}>
              <View style={[s.tr, { borderBottomColor: c.line }]}>
                {['', 'No-slip days', 'Slip days', 'Gap'].map((h, i) => (
                  <Text key={i} style={[s.th, { color: c.muted, textAlign: i ? 'right' : 'left', flex: i ? 1 : 1.4 }]}>
                    {h}
                  </Text>
                ))}
              </View>
              {p.rows.map((r) => {
                const f = (v: number | null) => (v == null ? '–' : r.kind === 'pct' ? pct(v) : one(v));
                const gp = r.gap == null ? '–' : (r.gap > 0 ? '+' : r.gap < 0 ? '−' : '') + (r.kind === 'pct' ? Math.round(Math.abs(r.gap) * 100) + '%' : one(Math.abs(r.gap)));
                return (
                  <View key={r.label} style={[s.tr, { borderBottomColor: c.line }]}>
                    <Text style={[s.td, { color: c.ink, flex: 1.4, fontFamily: font.bodySemi }]}>{r.label}</Text>
                    <Text style={[s.td, { color: c.ink, textAlign: 'right' }]}>{f(r.clean)}</Text>
                    <Text style={[s.td, { color: c.ink, textAlign: 'right' }]}>{f(r.slip)}</Text>
                    <Text style={[s.td, { color: c.ink, textAlign: 'right' }]}>{gp}</Text>
                  </View>
                );
              })}
            </View>
            <T v="small" tone="muted">
              Based on {p.cleanN} day{p.cleanN === 1 ? '' : 's'} without a slip and {p.slipN} with one.
              {Math.min(p.cleanN, p.slipN) < 5 ? ' That is a small sample, so treat it as a hint.' : ''} The gap is slip days minus no-slip days.
            </T>
          </>
        ) : (
          <T tone="muted">Needs at least one day without a slip and one with a slip, each with a check-in. Small samples are noisy. This is for asking questions, not for judging myself.</T>
        )}
      </Block>
      <Block title="What I am noticing">
        {notice.map(([dt, dd]) => (
          <View key={dt} style={{ gap: 2 }}>
            <T v="small" tone="muted">
              {dt}
            </T>
            <T v="label">{dd}</T>
          </View>
        ))}
      </Block>
    </>
  );
}

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
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stat: { flexGrow: 1, flexBasis: '45%', gap: 2, padding: 12, borderRadius: 16 },
  statB: { fontFamily: font.display, fontSize: 26 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tbl: { borderTopWidth: 1 },
  tr: { flexDirection: 'row', borderBottomWidth: 1, paddingVertical: 6 },
  th: { flex: 1, fontFamily: font.bodySemi, fontSize: 12.5 },
  td: { flex: 1, fontFamily: font.body, fontSize: 13.5, fontVariant: ['tabular-nums'] },
});
