/* Pattern (the tab was called Journal until the journal itself came, October 2026): what happened. Days (the month and every day), Your pattern (one big card at a time, swiped sideways, each
   with a plain answer over its chart: how you are doing, how the days felt, riding it out, what was felt, when it happens, what sets it off, what is different on hard days, what helps),
   Weeks (each week as a bar of its days, and the one picked told in full: components/weeks-pane.tsx). Days is ported from the legacy viewJournal and daysBody. Without the
   pattern open, the cards that show a person changing stay open (core supporter.ts, PAT_FREE), and each of the others shows its chart faded, with
   a way into the tip sheet, or once Daybook Pattern is on sale the sheet for that. A card with nothing behind it yet is left out: named feelings
   above all, which many people log only now and then. Nothing here asks to be looked at. */
import {
  computeMetrics,
  FEELS_MIN,
  bpsRow,
  bpsScores,
  fmtDate,
  fmtHour,
  myNumbers,
  DOING_MIN,
  patDoing,
  patFeels,
  patFelt,
  patGaps,
  patInsights,
  patLeads,
  patNeeds,
  patNowLine,
  patPeriod,
  patRangeLabel,
  patRideCols,
  patRidge,
  gameCompute,
  patRideSay,
  patRideOut,
  patSlipTrig,
  patTriggerLines,
  patTriggers,
  patWeeks,
  patWhen,
  plural,
  PATTERN_FROM,
  talkEvidence,
  talkNeedWord,
  urWorks,
  type DayFeelStep,
  type PatGo,
  type PatRange,
  habitOf,
} from '@daybook/core';
import { router, useLocalSearchParams } from 'expo-router';
import { LinkCard } from '@/components/link-card';
import { useCountFocus } from '@/lib/pulse';
import { useQuietAsks } from '@/lib/quiet-asks';
import { useSos } from '@/lib/sos';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View, type ScrollViewInstance } from 'react-native';
import { Text } from '@/components/text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Appear } from '@/components/appear';
import { NumbersTable } from '@/components/charts';
import { DAY_FEEL_LOOK } from '@/components/day-feel-pop';
import { CARD_SKY, DayFlow, DaySky, FeelField, FlameCounts, Hillside, HoursKey, Mosaic, Pairs, Room, WeekRow, type Rank } from '@/components/pattern-charts';
import { Deck, Say, type DeckCard, type DeckHandle } from '@/components/pattern-deck';
import { Segments } from '@/components/form';
import { Screen } from '@/components/screen';
import { CalendarCard } from '@/components/calendar-card';
import { DaysCard } from '@/components/today';
import { DayLog } from '@/components/day-log';
import { SundayCard } from '@/components/sunday-card';
import { MonthCard, useLocked, useOpenMonths } from '@/components/support';
import { Card, Icon, T } from '@/components/ui';
import { WeeksPane } from '@/components/weeks-pane';
import { useStore } from '@/lib/store';
import { font, useTheme, palettes } from '@/lib/theme';

type Pane = 'days' | 'patterns' | 'weeks';
const fmtD = (k: string) => fmtDate(k, { weekday: 'short', month: 'short', day: 'numeric' });

export default function Pattern() {
  useCountFocus('tab_pattern');
  const sos = useSos();
  const params = useLocalSearchParams<{ pane?: string }>();
  const [pane, setPane] = useState<Pane>(params.pane === 'patterns' || params.pane === 'weeks' ? params.pane : 'days');
  /* a link to a section (Today's "Month ›" opens Days) moves to it, even when Pattern is already open on another one */
  useEffect(() => {
    if (params.pane === 'days' || params.pane === 'patterns' || params.pane === 'weeks') setPane(params.pane);
  }, [params.pane]);
  const { snap, tk } = useStore();
  const st = snap.settings;
  const scroll = useRef<ScrollViewInstance>(null);
  const inset = useSafeAreaInsets();
  const [paneY, setPaneY] = useState(0);
  /* before setup the tabs wait behind the welcome page ((tabs)/_layout.tsx) */
  if (!st) return null;
  return (
    <Screen title="Pattern" scrollRef={scroll}>
      <Segments
        label="Pattern sections"
        list={[
          ['days', 'Days'],
          ['patterns', 'Pattern'],
          ['weeks', 'Weeks'],
        ]}
        cur={pane}
        onPick={setPane}
      />
      <View onLayout={(e) => setPaneY(e.nativeEvent.layout.y)}>
        <Appear key={pane} style={{ gap: 16 }}>
          {pane === 'days' ? (
            <DaysPane />
          ) : pane === 'patterns' ? (
            <>
              <PatternsPane onGo={(y) => scroll.current?.scrollTo({ y: Math.max(0, inset.top + 16 + paneY + y - 12), animated: true })} />
              {/* the five questions are the Brief Pornography Screen: for porn, or for anyone with answers kept from before */}
              {habitOf(snap.settings) === 'porn' || bpsScores(snap.settings, sos.mem).length ? (
                <LinkCard icon="chart" title="The five questions" sub={bpsRow(bpsScores(snap.settings, sos.mem))} onPress={() => router.push('/recheck')} />
              ) : null}
            </>
          ) : (
            <WeeksPane />
          )}
        </Appear>
      </View>
    </Screen>
  );
}

/* ---------- days ----------
   The month on its night card, then the count and what stays earned, the week's goal from Sunday, and the log, today first
   (components/calendar-card, today, sunday-card, day-log). Today keeps one line for today's entries and the goal, under the next step. */
function DaysPane() {
  const { snap, tk, now } = useStore();
  return (
    <View style={{ gap: 32 }}>
      <CalendarCard snap={snap} tk={tk} />
      <DaysCard snap={snap} tk={tk} now={now} size="lg" />
      <SundayCard snap={snap} tk={tk} />
      <DayLog snap={snap} tk={tk} />
    </View>
  );
}

/* ---------- your pattern ---------- */
const GO_IC: Record<PatGo, string> = { apart: 'sunrise', ride: 'wave', when: 'timer', what: 'bolt', days: 'heart' };
const RANGES: [PatRange, string][] = [
  ['7', 'Week'],
  ['30', 'Month'],
  ['all', 'All'],
];
/* the cards the free side keeps (core PAT_FREE: felt, apart): they show a person changing. The rest explain why, and are what a tip or Daybook Pattern opens */
const FREE_CARDS = ['felt', 'ride', 'apart', 'named'];
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];
/* how tall the days of the week stand under the hours */
const WEEK_ROW = 64;
function PatternsPane({ onGo }: { onGo: (y: number) => void }) {
  const c = useTheme();
  const { snap, tk, now } = useStore();
  const st = snap.settings!;
  const [range, setRange] = useState<PatRange>('30');
  const [index, setIndex] = useState(0);
  const [deckY, setDeckY] = useState(0);
  const deck = useRef<DeckHandle>(null);
  const isLocked = useLocked('stats');
  /* never an ask in the hours after an SOS or a slip */
  const quiet = useQuietAsks();
  const openMonths = useOpenMonths();
  const per = useMemo(() => patPeriod(range, snap.days, st, tk), [range, snap.days, st, tk]);
  const allPer = useMemo(() => patPeriod('all', snap.days, st, tk), [snap.days, st, tk]);
  const keys = per.keys;
  const felt = useMemo(() => patFelt(snap.days, per, tk), [snap.days, per, tk]);
  const feels = useMemo(() => patFeels(snap.journal, snap.days, per, tk), [snap.journal, snap.days, per, tk]);
  /* whether a card is there at all goes by the whole log, so a quiet week does not make the cards jump */
  const feltAll = useMemo(() => patFelt(snap.days, allPer, tk).n, [snap.days, allPer, tk]);
  const namedAll = useMemo(() => patFeels(snap.journal, snap.days, allPer, tk).n, [snap.journal, snap.days, allPer, tk]);
  const g = patGaps(snap.days, st, tk);
  const lastSlip = Object.keys(snap.days)
    .filter((k) => k <= tk && (snap.days[k]?.events || []).some((e) => e.outcome === 'slipped'))
    .sort()
    .pop();
  const weeks = patWeeks(snap.days, keys, range === 'all' ? 26 : 13);
  const ride = patRideOut(weeks);
  const rideCols = patRideCols(snap.days, keys, tk);
  const when = patWhen(snap.days, st, keys, tk);
  const trig = patTriggers(snap.days, st, keys, tk);
  /* what came before the last slips, once it is a real pattern (the last six slips, whatever the range) */
  const slipTrig = patSlipTrig(snap.days, st, tk);
  const needs = patNeeds(snap.days, keys);
  /* slip days are few, so this one reads the whole log whatever the range */
  const leads = patLeads(snap.days, allPer.keys);
  const ins = patInsights(g, ride, when, trig.list);
  const works = urWorks(snap.days, tk);
  const ev = talkEvidence(snap.days);
  const nums = myNumbers(snap.days, st, tk, now);
  const whenAll = patWhen(snap.days, st, allPer.keys, tk);
  const anyEntry = whenAll.week.some((d) => d.rode + d.slipped);
  const trigAll = patTriggers(snap.days, st, allPer.keys, tk).list.length > 0;
  const needsAll = patNeeds(snap.days, allPer.keys).length > 0;
  const hard = when.hard.weekdays || when.hard.weekends;
  const doing = patDoing(snap.days, per, st);
  /* the same longest run as My numbers, lower on this page */
  const longest = computeMetrics(snap.days, st, tk).longest;
  const rideSay = patRideSay(ride, rideCols);
  /* the cards are night in either theme, so the shapes take their night colors */
  const look = (n: DayFeelStep) => ({ kind: DAY_FEEL_LOOK[n].kind, color: DAY_FEEL_LOOK[n].tone(palettes.dark)[0] });
  const needLine =
    needs[0] && needs[0].count >= 3
      ? 'When you talked it through, the pull was mostly after ' + talkNeedWord(needs[0].n) + ': ' + plural(needs[0].count, 'time') + '.'
      : '';
  const topTrig = trig.list.slice(0, 6);
  const trigLine = slipTrig ? slipTrig.line : patTriggerLines(trig.list, null)[0] || '';
  const trigItems: Rank[] = trig.list.length
    ? topTrig.map((r) => ({
        label: r.t,
        n: r.rode + r.slipped,
        note: r.rode + ' of ' + (r.rode + r.slipped) + ' ridden out',
        short: r.rode + ' of ' + (r.rode + r.slipped),
      }))
    : needs.map((x) => ({ label: x.name, n: x.count, note: plural(x.count, 'time'), short: plural(x.count, 'time') }));
  /* the answer that differs most leads the card on hard days */
  const widest = leads.list
    .slice()
    .sort((a, b) => Math.abs(b.clean - b.slip) / (Math.max(b.clean, b.slip) || 1) - Math.abs(a.clean - a.slip) / (Math.max(a.clean, a.slip) || 1))[0];
  const ridge = patRidge(snap.days, per, st);
  const level = Math.max(1, gameCompute(snap.days, st, snap.reviews, tk).level.n);

  const cards: DeckCard[] = [];
  /* the first card, for the question this page is here to answer. It stays after a slip: one slip is a flat step, which is worth seeing then */
  if (allPer.keys.length >= DOING_MIN)
    cards.push({
      id: 'apart',
      title: 'How you are doing',
      head: doing.head,
      say: <Say>{doing.line}</Say>,
      chart: (
        <Room>
          {(w, h) => (
            <Hillside
              note={g.slips ? patNowLine(g, tk, lastSlip || null) + (longest >= 2 ? ' Longest stretch: ' + longest + ' days.' : '') : undefined}
              ridge={ridge}
              than={doing.than}
              first={doing.first}
              level={level}
              sky={CARD_SKY.apart[1]}
              w={w}
              h={h}
              label={doing.head + '. ' + doing.line}
            />
          )}
        </Room>
      ),
      numbers: g.slips ? (
        <NumbersTable
          cap="No-slip days before each slip"
          head={['Slip', 'No-slip days before']}
          rows={g.runs.map((r, i) => [String(i + 1), String(r)]).reverse()}
        />
      ) : null,
    });
  if (feltAll)
    cards.push({
      id: 'felt',
      title: 'How your days felt',
      head: felt.head,
      say: felt.line ? <Say>{felt.line}</Say> : null,
      chart: (
        <Room>
          {(w, h) => (
            <DayFlow
              flow={felt.flow}
              by={felt.by}
              first={felt.flowFrom || doing.first}
              sky={CARD_SKY.felt[1]}
              w={w}
              h={h}
              look={look}
              label={felt.head + '. ' + felt.line}
            />
          )}
        </Room>
      ),
      numbers: (
        <NumbersTable
          cap="How the days felt"
          head={['From', 'Good or great', 'Okay', 'Low or rough']}
          rows={felt.cols.map((x) => [fmtD(x.from), String(x.steps[3] + x.steps[4]), String(x.steps[2]), String(x.steps[0] + x.steps[1])]).reverse()}
        />
      ),
    });
  if (anyEntry)
    cards.push({
      id: 'ride',
      title: 'Riding it out',
      head: rideSay.head,
      say: rideSay.line ? <Say>{rideSay.line}</Say> : null,
      chart: <Room>{(w, h) => <FlameCounts cols={rideCols} level={level} w={w} h={h} label={rideSay.head + '. ' + rideSay.line} />}</Room>,
      numbers: (
        <NumbersTable
          cap="Entries"
          head={['From', 'Rode it out', 'Slipped']}
          rows={rideCols.map((w) => [fmtD(w.from), String(w.rode), String(w.slipped)]).reverse()}
        />
      ),
    });
  if (namedAll >= FEELS_MIN)
    cards.push({
      id: 'named',
      title: 'What you have felt',
      head: feels.n ? feels.head : 'Nothing named',
      say:
        feels.line || feels.fresh ? (
          <Say>
            {feels.line}
            {feels.line && feels.fresh ? ' ' : ''}
            {feels.fresh}
          </Say>
        ) : null,
      chart: <Room>{(w, h) => <FeelField words={feels.words} w={w} h={h} label={feels.head + '. ' + feels.line} />}</Room>,
      foot:
        feels.kinds >= 3 ? (
          <T v="small" tone="muted">
            {feels.kinds} different words named so far.
          </T>
        ) : null,
      numbers: feels.n ? <NumbersTable cap="What you named" head={['Feeling', 'Times']} rows={feels.words.map((x) => [x.w, String(x.n)])} /> : null,
    });
  if (whenAll.timed)
    cards.push({
      id: 'when',
      title: 'When does it happen?',
      head: hard
        ? (when.hard.same || !when.hard.weekends ? '' : when.hard.weekdays ? 'Weekdays ' : 'Weekends ') + hard.label
        : when.timed
          ? 'No hard hours yet'
          : 'No times logged',
      say: (
        <>
          {hard ? <Say>{hard.line}</Say> : null}
          {when.hard.weekdays && when.hard.weekends ? (
            <Say>
              Weekends: {when.hard.weekends.label}. {when.hard.weekends.line}
            </Say>
          ) : null}
          {when.day ? (
            <Say>
              {when.day.name}s are the hardest: {when.day.n} of {when.day.slips ? plural(when.day.of, 'slip') : when.day.of + ' entries'}.
            </Say>
          ) : null}
        </>
      ),
      chart: when.timed ? (
        <Room min={when.day ? 240 : 180}>
          {(w, h) => (
            <View style={{ gap: 12 }}>
              <DaySky hours={when.hours} hard={when.hard} w={w} h={h - (when.day ? WEEK_ROW + 12 : 0)} sky={CARD_SKY.when[0]} />
              {when.day ? (
                <View style={{ paddingHorizontal: 16 }}>
                  <WeekRow week={WEEK_ORDER.map((d) => when.week[d])} on={when.day.d} H={WEEK_ROW - 20} />
                </View>
              ) : null}
            </View>
          )}
        </Room>
      ) : (
        <View />
      ),
      foot: when.timed ? <HoursKey /> : null,
      numbers: (
        <NumbersTable
          cap="Entries by hour"
          head={['Hour', 'Rode it out', 'Slipped']}
          rows={when.hours.filter((b) => b.rode + b.slipped).map((b) => [fmtHour(b.h) + ' to ' + fmtHour((b.h + 1) % 24), String(b.rode), String(b.slipped)])}
        />
      ),
    });
  if (trigAll || needsAll)
    cards.push({
      id: 'what',
      title: 'What sets it off?',
      head: topTrig[0]?.t || needs[0]?.name || (trig.none ? 'No reason picked' : 'A quiet stretch'),
      say:
        trigLine || needLine || !trig.none ? (
          <>
            {(trigLine || needLine ? [trigLine, needLine] : ['No hard moments logged in these days.']).filter(Boolean).map((l) => (
              <Say key={l}>{l}</Say>
            ))}
          </>
        ) : null,
      chart: trigItems.length ? <Room>{(w, h) => <Mosaic items={trigItems} tone="warm" w={w} h={h} />}</Room> : <View />,
      foot: trig.none ? (
        <T v="small" tone="muted">
          {trig.none === 1 ? '1 entry' : trig.none + ' entries'} had no reason picked.
        </T>
      ) : null,
      numbers: (
        <NumbersTable
          cap="Entries by what set them off"
          head={['Reason', 'Rode it out', 'Slipped']}
          rows={trig.list.map((r) => [r.t, String(r.rode), String(r.slipped)])}
        />
      ),
    });
  if (leads.list.length)
    cards.push({
      id: 'days',
      title: 'What is different on hard days?',
      head: widest?.label,
      say: widest ? <Say>{widest.line}</Say> : null,
      chart: <Room>{(w, h) => <Pairs list={leads.list} w={w} h={h} />}</Room>,
      foot: (
        <T v="small" tone="muted">
          Your whole log: {plural(leads.cleanN, 'check-in day')} with no slip and {leads.slipN} with one.
        </T>
      ),
    });
  if (works.length || ev.chose + ev.went)
    cards.push({
      id: 'helps',
      title: 'What helps you',
      head: works[0]?.name,
      say: ev.chose ? (
        <Say>
          You talked it through and chose something else {plural(ev.chose, 'time')} out of {ev.chose + ev.went}.
        </Say>
      ) : null,
      chart: works.length ? (
        <Room>
          {(w, h) => (
            <Mosaic
              items={works.slice(0, 6).map((x) => ({
                label: x.name,
                n: x.passed + x.not,
                note: x.passed + ' of ' + (x.passed + x.not) + ' it passed',
                short: x.passed + ' of ' + (x.passed + x.not),
              }))}
              tone="cool"
              w={w}
              h={h}
            />
          )}
        </Room>
      ) : (
        <View />
      ),
      foot: works.length ? (
        <T v="small" tone="muted">
          SOS tools over the last four months. SOS uses this to choose what to suggest.
        </T>
      ) : null,
    });
  const shut = (id: string) => isLocked && !FREE_CARDS.includes(id);
  /* a sentence opens the card behind it */
  const cardOf = (go: PatGo) => cards.findIndex((x) => x.id === go);
  const cur = Math.min(index, Math.max(0, cards.length - 1));
  const showing = cards[cur];
  const numbers = (
    <Card>
      <T v="h2">My numbers</T>
      <View>
        {nums.map((x, i) => (
          <View key={x.l} accessible accessibilityLabel={`${x.l}: ${x.b}. ${x.s}`} style={[s.stat, i > 0 && { borderTopWidth: 1, borderTopColor: c.line }]}>
            <Text style={[s.statB, { color: c.ink }]}>{x.b}</Text>
            <View style={{ flex: 1 }}>
              <T v="label">{x.l}</T>
              <T v="small" tone="muted">
                {x.s}
              </T>
            </View>
          </View>
        ))}
      </View>
    </Card>
  );
  return (
    <>
      {cards.length ? (
        <View onLayout={(e) => setDeckY(e.nativeEvent.layout.y)}>
          {/* the range sits under the cards, where the thumb is */}
          <Deck deckRef={deck} cards={cards} index={cur} onIndex={setIndex} locked={shut} quiet={quiet} from={range} />
          <View style={s.range}>
            <View style={s.rangeTabs} accessibilityRole="tablist" accessibilityLabel="Time range">
              {RANGES.map(([id, l]) => (
                <Pressable
                  key={id}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: range === id }}
                  onPress={() => setRange(id)}
                  style={({ pressed }) => [s.rangeTab, { opacity: pressed ? 0.6 : 1 }]}>
                  <T style={{ fontFamily: range === id ? font.bodyBold : font.bodySemi, color: range === id ? c.ink : c.muted }}>{l}</T>
                </Pressable>
              ))}
            </View>
            <T v="small" tone="muted">
              {patRangeLabel(keys, tk)}
            </T>
          </View>
        </View>
      ) : null}
      {showing?.numbers && !shut(showing.id) ? <View key={showing.id}>{showing.numbers}</View> : null}

      {/* what the log says, in plain sentences; each opens the card with its chart */}
      <Card>
        <T v="h2" accessibilityRole="header">
          In one look
        </T>
        {ins.length ? (
          <View>
            {ins.map((x, i) => (
              <Appear key={x.t} delay={120 + i * 110} by={6}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityHint="Shows the graph behind it"
                  disabled={cardOf(x.go) < 0}
                  onPress={() => {
                    deck.current?.show(cardOf(x.go));
                    onGo(deckY);
                  }}
                  style={({ pressed }) => [s.ins, i > 0 && { borderTopWidth: 1, borderTopColor: c.line }, { opacity: pressed ? 0.7 : 1 }]}>
                  <Icon name={GO_IC[x.go]} size={22} color={c.accentText} />
                  <T style={s.insT}>{x.t}</T>
                  {cardOf(x.go) < 0 ? null : <Icon name="up" size={16} color={c.muted} />}
                </Pressable>
              </Appear>
            ))}
          </View>
        ) : (
          <T>
            Log urges and slips with a time and a reason, and this page starts to answer: when, what sets it off, and whether slips are getting further apart.
          </T>
        )}
      </Card>

      {numbers}
      {/* a plan that has ended keeps the months that finished while it was active, so they stay outside the lock */}
      {PATTERN_FROM != null && (!isLocked || openMonths.length) ? <MonthCard /> : null}
    </>
  );
}

const s = StyleSheet.create({
  ins: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, minHeight: 44 },
  insT: { flex: 1, fontFamily: font.bodySemi, fontSize: 17, lineHeight: 22 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  statB: { fontFamily: font.display, fontSize: 28, lineHeight: 34, minWidth: 56 },
  range: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  rangeTabs: { flexDirection: 'row', gap: 16 },
  rangeTab: { minHeight: 44, justifyContent: 'center' },
});
