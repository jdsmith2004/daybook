/* Pattern (the tab was called Journal until the journal itself came, October 2026): what happened. Days (the month and every day), Your pattern (one big card at a time, swiped sideways, each
   with a plain answer over its chart: how you are doing, how the days felt, riding it out, what was felt, when it happens, what sets it off, what is different on hard days, what helps),
   Weeks (each week as a bar of its days, and the one picked told in full: components/weeks-pane.tsx). Days is ported from the legacy viewJournal and daysBody. Without the
   pattern open, the cards that show a person changing stay open (core supporter.ts, PAT_FREE), and each of the others shows its chart faded, with
   a way into the tip sheet, or once Daybook Pattern is on sale the sheet for that. Every card is always in the deck, in the same order: one with
   nothing behind it yet in the whole log is a ghost, its own picture drawn empty with only its title (the owner, November 3, 2026), so the shape
   says what will fill it. Nothing here asks to be looked at. */
import { bpsRow, bpsScores, PATTERN_FROM, type PatGo, type PatRange, habitOf, patRangeLabel } from '@daybook/core';
import { router, useLocalSearchParams } from 'expo-router';
import { LinkCard } from '@/components/link-card';
import { buzz } from '@/lib/feel';
import { useCountFocus } from '@/lib/pulse';
import { useQuietAsks } from '@/lib/quiet-asks';
import { useSos } from '@/lib/sos';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View, type ScrollViewInstance } from 'react-native';
import { Text } from '@/components/text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Appear } from '@/components/appear';
import { usePatternCards } from '@/components/pattern-cards';
import { Deck, type DeckHandle } from '@/components/pattern-deck';
import { Segments } from '@/components/form';
import { Screen } from '@/components/screen';
import { CalendarCard } from '@/components/calendar-card';
import { DaysCard } from '@/components/today';
import { DayLog } from '@/components/day-log';
import { SundayCard } from '@/components/sunday-card';
import { MonthCard, useLocked, useOpenMonths } from '@/components/support';
import { Card, Icon, T } from '@/components/ui';
import { WeeksPane } from '@/components/weeks-pane';
import { SettingsButton } from '@/components/settings-button';
import { useStore } from '@/lib/store';
import { font, useTheme } from '@/lib/theme';

type Pane = 'days' | 'patterns' | 'weeks';

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
    <Screen title="Pattern" scrollRef={scroll} action={<SettingsButton />}>
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
function PatternsPane({ onGo }: { onGo: (y: number) => void }) {
  const c = useTheme();
  const { tk } = useStore();
  const [range, setRange] = useState<PatRange>('30');
  const [index, setIndex] = useState(0);
  const [deckY, setDeckY] = useState(0);
  const deck = useRef<DeckHandle>(null);
  const isLocked = useLocked('stats');
  /* never an ask in the hours after an SOS or a slip */
  const quiet = useQuietAsks();
  const openMonths = useOpenMonths();
  const { cards, keys, ins, logged, nums } = usePatternCards(range);
  const shut = (id: string) => isLocked && !FREE_CARDS.includes(id);
  /* a sentence opens the card behind it */
  const cardOf = (go: PatGo) => cards.findIndex((x) => x.id === go && !x.ghost);
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
                onPress={() => {
                  if (range !== id) buzz('tap');
                  setRange(id);
                }}
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
                    buzz('tap');
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
            {logged
              ? 'A few more urges or slips with a time and a reason, and this page starts to answer: when, what sets it off, and whether slips are getting further apart.'
              : 'Log urges and slips with a time and a reason, and this page starts to answer: when, what sets it off, and whether slips are getting further apart.'}
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
