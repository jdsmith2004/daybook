/* The journal's Insights (core journal-insights.ts): reached only from the chart mark in the journal's header, free for everyone. The
   journal's own night page, so it reads as the same quiet room. Top to bottom: three numbers with a word under each (entries this year,
   days written, words written), a small flame by the words that grows a little as they do; the month, a warm dot on each day written,
   swiped for the months before; and the feelings named most often, five bars on one baseline with the word at the start and the count at
   the end, each in its feeling's own color. Empty, it is the same page in gray: zeros, an empty month, five gray bars with no words. */
import { gameCompute, jnInsights, jnMonth, jnMonths, JN_TOP, type DayKey } from '@daybook/core';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View, type ScrollViewInstance } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BigFlame } from '@/components/big-flame';
import { feelColor, JN } from '@/components/journal';
import { closeSheet } from '@/components/sheet';
import { Text } from '@/components/text';
import { Icon } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { useStore } from '@/lib/store';
import { font, MAX_WIDTH } from '@/lib/theme';

const GRAY = 'rgba(235, 235, 245, 0.14)';
const DOT = '#FFB347';
const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function Insights() {
  const { snap, tk } = useStore();
  const inset = useSafeAreaInsets();
  const { width: W } = useWindowDimensions();
  const st = snap.settings;
  const ins = useMemo(() => jnInsights(snap.journal, snap.days, tk), [snap.journal, snap.days, tk]);
  const months = useMemo(() => jnMonths(snap.journal, tk), [snap.journal, tk]);
  const level = useMemo(() => (st ? Math.max(1, gameCompute(snap.days, st, snap.reviews, tk).level.n) : 1), [snap, st, tk]);
  const empty = !ins.days && !ins.top.length;
  const colW = Math.min(W, MAX_WIDTH) - 32;
  /* the flame by the words grows a little with them: 34 points at none, about 56 at ten thousand */
  const flameSize = Math.round(34 + Math.min(22, Math.log10(1 + ins.words) * 5.5));

  return (
    <View style={[s.page, { paddingTop: inset.top + 10 }]}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={[s.scroll, { paddingBottom: inset.bottom + 32 }]}>
        <View style={s.col}>
          <View style={s.head}>
            <Text style={s.title} accessibilityRole="header" maxFontSizeMultiplier={1.25}>
              Insights
            </Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={closeSheet} style={s.round} hitSlop={6}>
              <Icon name="x" color={JN.ink} />
            </Pressable>
          </View>

          <View style={s.nums}>
            <Num n={ins.year} word="entries this year" />
            <Num n={ins.days} word="days written" />
            <Num
              n={ins.words}
              word="words written"
              flame={
                <View style={[s.flame, { width: flameSize, height: flameSize, marginTop: 40 - flameSize }, !ins.words && { opacity: 0.35 }]}>
                  <BigFlame level={level} size={flameSize} noLand calm={!ins.words} label="Your flame" />
                </View>
              }
            />
          </View>

          <Months months={months} tk={tk} width={colW} snap={snap.journal} />

          <View style={s.feels}>
            <Text style={s.h}>Felt most often</Text>
            <Bars top={ins.top} empty={empty} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function Num({ n, word, flame }: { n: number; word: string; flame?: React.ReactNode }) {
  return (
    <View style={s.num} accessible accessibilityLabel={n.toLocaleString('en-US') + ' ' + word}>
      <View style={s.numRow}>
        <Text style={[s.big, !n && { color: GRAY }]} maxFontSizeMultiplier={1.2}>
          {n.toLocaleString('en-US')}
        </Text>
        {flame}
      </View>
      <Text style={s.word}>{word}</Text>
    </View>
  );
}

/** the months, swiped, the newest first in view */
function Months({ months, tk, width, snap }: { months: string[]; tk: DayKey; width: number; snap: Parameters<typeof jnMonth>[0] }) {
  const ref = useRef<ScrollViewInstance>(null);
  const [at, setAt] = useState(months.length - 1);
  const placed = useRef(false);
  const ym = months[Math.max(0, Math.min(months.length - 1, at))];
  const name = new Date(Number(ym.slice(0, 4)), Number(ym.slice(5, 7)) - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const go = (i: number) => {
    const to = Math.max(0, Math.min(months.length - 1, i));
    ref.current?.scrollTo({ x: to * width, animated: true });
    setAt(to);
  };
  return (
    <View style={s.month}>
      <View style={s.monthHead}>
        <Text style={s.h}>{name}</Text>
        <View style={s.arrows}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="The month before"
            disabled={at <= 0}
            onPress={() => {
              buzz('tick');
              go(at - 1);
            }}
            hitSlop={10}
            style={s.arrow}>
            <Icon name="back" size={18} color={at <= 0 ? GRAY : JN.quiet} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="The month after"
            disabled={at >= months.length - 1}
            onPress={() => {
              buzz('tick');
              go(at + 1);
            }}
            hitSlop={10}
            style={s.arrow}>
            <Icon name="next" size={18} color={at >= months.length - 1 ? GRAY : JN.quiet} />
          </Pressable>
        </View>
      </View>
      <View style={s.dowRow}>
        {DOW.map((d, i) => (
          <Text key={i} style={s.dow}>
            {d}
          </Text>
        ))}
      </View>
      <ScrollView
        ref={ref}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onLayout={() => {
          if (placed.current) return;
          placed.current = true;
          ref.current?.scrollTo({ x: (months.length - 1) * width, animated: false });
        }}
        onMomentumScrollEnd={(e) => setAt(Math.round(e.nativeEvent.contentOffset.x / width))}
        scrollEventThrottle={32}>
        {months.map((m) => (
          <Month key={m} ym={m} tk={tk} width={width} jn={snap} />
        ))}
      </ScrollView>
    </View>
  );
}

function Month({ ym, tk, width, jn }: { ym: string; tk: DayKey; width: number; jn: Parameters<typeof jnMonth>[0] }) {
  const { weeks, written } = useMemo(() => jnMonth(jn, ym), [jn, ym]);
  const cell = width / 7;
  return (
    <View style={{ width }} accessible accessibilityLabel={written.size + (written.size === 1 ? ' day written' : ' days written') + ' this month'}>
      {weeks.map((w, i) => (
        <View key={i} style={s.week}>
          {w.map((k, j) => (
            <View key={j} style={[s.day, { width: cell }]}>
              {k ? (
                <>
                  <Text style={[s.dayN, k === tk && s.today, k > tk && { color: GRAY }]}>{Number(k.slice(8))}</Text>
                  <View style={[s.dot, { backgroundColor: written.has(k) ? DOT : 'transparent' }]} />
                </>
              ) : null}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

/** the five feelings, one baseline, the word at the start and the count at the end of each bar */
function Bars({ top, empty }: { top: { w: string; n: number }[]; empty: boolean }) {
  const max = Math.max(1, ...top.map((x) => x.n));
  const rows = empty ? Array.from({ length: JN_TOP }, (_, i) => ({ w: '', n: 0, frac: 0.9 - i * 0.16 })) : top.map((x) => ({ ...x, frac: x.n / max }));
  return (
    <View style={s.bars}>
      {rows.map((r, i) => (
        <View key={i} style={s.barRow} accessible={!!r.w} accessibilityLabel={r.w ? `${r.w}, ${r.n} ${r.n === 1 ? 'time' : 'times'}` : undefined}>
          <Text style={s.barW} numberOfLines={1}>
            {r.w}
          </Text>
          <View style={s.track}>
            <View style={[s.bar, { width: `${Math.max(4, r.frac * 82)}%` as `${number}%`, backgroundColor: r.w ? feelColor(r.w) : GRAY }]} />
            {r.w ? <Text style={s.barN}>{r.n}</Text> : null}
          </View>
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: JN.paper },
  scroll: { paddingHorizontal: 16 },
  col: { width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center', gap: 32 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: font.display, fontSize: 34, lineHeight: 38, color: JN.ink },
  round: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  nums: { flexDirection: 'row', gap: 12 },
  num: { flexGrow: 1, flexShrink: 1, gap: 2 },
  numRow: { flexDirection: 'row', alignItems: 'flex-end' },
  flame: { marginLeft: -4, marginBottom: -2 },
  big: { fontFamily: font.display, fontSize: 34, lineHeight: 40, color: JN.ink },
  word: { fontFamily: font.bodyMedium, fontSize: 13, lineHeight: 17, color: JN.quiet },
  h: { fontFamily: font.bodySemi, fontSize: 17, lineHeight: 22, color: JN.ink },
  month: { gap: 12 },
  monthHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  arrows: { flexDirection: 'row', gap: 4 },
  arrow: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  dowRow: { flexDirection: 'row' },
  dow: { flex: 1, textAlign: 'center', fontFamily: font.bodyMedium, fontSize: 13, color: JN.quiet },
  week: { flexDirection: 'row' },
  day: { height: 46, alignItems: 'center', justifyContent: 'center', gap: 4 },
  dayN: { fontFamily: font.bodyMedium, fontSize: 15, lineHeight: 19, color: 'rgba(235, 235, 245, 0.7)' },
  today: { color: JN.ink, fontFamily: font.bodySemi },
  dot: { width: 7, height: 7, borderRadius: 4 },
  feels: { gap: 14 },
  bars: { gap: 10 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  barW: { width: 116, fontFamily: font.bodyMedium, fontSize: 15, lineHeight: 19, color: JN.ink },
  track: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  bar: { height: 26, borderRadius: 8 },
  barN: { fontFamily: font.bodySemi, fontSize: 15, lineHeight: 19, color: JN.ink },
});
