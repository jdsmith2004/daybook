/* The month, first in Pattern > Days (core: calendar.ts), on a night card like the ones in Pattern, in either theme. Days in a
   row with no slip join into one band of warm light across their week, and slips join the same way into a cool violet band,
   so a month reads as light and night, whatever its share of each. A slip the person came back from carries a short gold line
   under its number; never a cross or a hole. Today is only its colors, its number drawn bolder. A day only logged is a cool round,
   a day with nothing logged is just its number, a gap away is an open ring, and days still to come are dashed rings (a real
   day is solid, a day ahead is drawn in outline, the way Flo draws its predictions). The month's numbers sit in one line
   under its name, ‹ › go back through the months to where the log starts, and a tap on a day opens it (app/day/[date].tsx). */
import { calLabel, calMonth, type CalKind, type Snapshot } from '@daybook/core';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { font, nightInk, palettes, PaletteOverride } from '@/lib/theme';

const WORD: Record<CalKind, string> = {
  ok: 'no slip',
  saved: 'a slip you came back from',
  slip: 'a slip',
  logged: 'logged',
  none: 'nothing logged',
  away: 'you were away',
  untold: 'not told',
  before: 'before the log started',
  ahead: 'still to come',
};
/* the card's words stay light in either theme: its sky is night (as on the cards in Pattern) */
const NIGHT = { ...palettes.dark, ink: nightInk.ink, muted: nightInk.muted, scheme: 'dark' as const };
const SKY: [string, string, string] = ['#0E0C24', '#17132F', '#24142E'];
/* the light of a run, from ember to flame */
const RUN: [string, string, string] = ['#E8661C', '#FFB53A', '#FFC94D'];
/* the night of a run of slips: calm, not alarming */
const SLIP: [string, string] = ['#3B2F7A', '#4C3C96'];
const ON_SLIP = '#D9D0FF';
const GOLD = '#F2BF3A';
/* the number on the light is dark, like the words on Pattern's warm spheres */
const ON_RUN = '#4A1E05';
const COOL = 'rgba(127,178,255,0.26)';
const ROW = 48;
/* a few small stars behind the month, placed by hand: [left %, top %, size] */
const STARS: [number, number, number][] = [
  [8, 6, 2],
  [27, 3, 1.5],
  [46, 9, 2],
  [62, 2, 1.5],
  [93, 12, 2],
  [16, 40, 1.5],
  [88, 46, 1.5],
  [5, 78, 2],
  [52, 94, 1.5],
  [96, 88, 2],
];

type CalDay = ReturnType<typeof calMonth>['days'][number];
/** the month in rows of seven: blanks before the 1st and after the last day */
function weeks(lead: number, days: CalDay[]) {
  const all: (CalDay | null)[] = [...Array<null>(lead).fill(null), ...days];
  while (all.length % 7) all.push(null);
  return Array.from({ length: all.length / 7 }, (_, i) => all.slice(i * 7, i * 7 + 7));
}
const isSlip = (k?: CalKind) => k === 'slip' || k === 'saved';
/** the runs of one kind of day in a row of seven (no slip, or slip), as [first column, last column] */
function runs(row: (CalDay | null)[], slips: boolean) {
  const out: [number, number][] = [];
  let from = -1;
  row.forEach((d, i) => {
    const on = slips ? isSlip(d?.kind) : d?.kind === 'ok';
    if (on && from < 0) from = i;
    if (!on && from >= 0) {
      out.push([from, i - 1]);
      from = -1;
    }
  });
  if (from >= 0) out.push([from, 6]);
  return out;
}

export function CalendarCard({ snap, tk }: { snap: Snapshot; tk: string }) {
  const st = snap.settings!;
  const [ym, setYm] = useState<string | null>(null);
  const m = calMonth(snap.days, st, tk, ym);
  const kinds = new Set(m.days.map((d) => d.kind));
  const key = (
    [
      ['ok', 'No slip'],
      ['slip', 'Slip'],
      ['saved', 'You came back'],
      ['logged', 'Logged'],
      ['away', 'Away'],
      ['untold', 'Not told'],
      ['ahead', 'To come'],
    ] as [CalKind, string][]
  ).filter(([k]) => kinds.has(k) || (k === 'slip' && kinds.has('saved')));
  const sum = [
    m.sum.noSlip ? m.sum.noSlip + (m.sum.noSlip === 1 ? ' no-slip day' : ' no-slip days') : '',
    m.sum.rode ? m.sum.rode + (m.sum.rode === 1 ? ' urge ridden out' : ' urges ridden out') : '',
    m.sum.slips ? m.sum.slips + (m.sum.slips === 1 ? ' slip, logged' : ' slips, logged') : '',
  ]
    .filter(Boolean)
    .join(' · ');
  const nav = (to: string | null, label: string, icon: string) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !to }}
      disabled={!to}
      onPress={() => {
        buzz('tap');
        setYm(to);
      }}
      style={({ pressed }) => [s.nav, { opacity: !to ? 0.3 : pressed ? 0.6 : 1 }]}>
      <Icon name={icon} size={20} color={NIGHT.ink} />
    </Pressable>
  );
  return (
    <PaletteOverride.Provider value={NIGHT}>
      <View style={s.card}>
        <LinearGradient colors={SKY} locations={[0, 0.7, 1]} style={StyleSheet.absoluteFill} />
        {STARS.map(([x, y, r], i) => (
          <View key={i} pointerEvents="none" style={[s.star, { left: `${x}%`, top: `${y}%`, width: r, height: r, borderRadius: r / 2 }]} />
        ))}
        <View style={s.head}>
          <T v="title" accessibilityRole="header" style={{ flex: 1 }}>
            {m.title}
          </T>
          {nav(m.prev, 'Earlier month', 'back')}
          {nav(m.next, 'Later month', 'next')}
        </View>
        {sum ? (
          <T v="small" tone="muted" style={{ marginTop: -6 }}>
            {sum}
          </T>
        ) : null}
        <View>
          <View style={s.week}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <View key={'h' + i} style={s.dowBox}>
                <Text style={[s.dow, { color: NIGHT.muted }]}>{d}</Text>
              </View>
            ))}
          </View>
          {weeks(m.lead, m.days).map((row, w) => (
            <View key={'w' + w} style={[s.week, { height: ROW }]}>
              {/* the runs sit behind the days: each one a band from its first day to its last in the week, warm for no slip, cool for slips */}
              {runs(row, false).map(([a, b]) => (
                <View key={'r' + a} pointerEvents="none" style={[s.runBox, { left: `${(a / 7) * 100}%`, width: `${((b - a + 1) / 7) * 100}%` }]}>
                  <LinearGradient colors={RUN} locations={[0, 0.55, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.run} />
                </View>
              ))}
              {runs(row, true).map(([a, b]) => (
                <View key={'s' + a} pointerEvents="none" style={[s.runBox, { left: `${(a / 7) * 100}%`, width: `${((b - a + 1) / 7) * 100}%` }]}>
                  <LinearGradient colors={SLIP} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[s.run, s.slipRun]} />
                </View>
              ))}
              {row.map((d, i) => (d ? <Day key={d.k} d={d} end={runs(row, true).some(([, b]) => b === i)} /> : <View key={'b' + w + '-' + i} style={s.box} />))}
            </View>
          ))}
        </View>
        {key.length ? (
          <View style={s.key}>
            {key.map(([k, t]) => (
              <View key={k} style={s.keyItem}>
                <Swatch k={k} />
                <T v="small" tone="muted">
                  {t}
                </T>
              </View>
            ))}
          </View>
        ) : null}
        {/* each gap away as one line: its days and its slips, or a way to fill it in (core away.ts) */}
        {m.gaps.map((g) => (
          <View key={g.from} style={s.gap}>
            <Swatch k="away" />
            <T v="small" tone="muted" style={{ flex: 1 }}>
              {g.line}
            </T>
            {g.n == null ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  buzz('tap');
                  router.push('/back');
                }}
                style={s.fill}>
                <T v="small" style={{ color: NIGHT.ink, textDecorationLine: 'underline' }}>
                  Fill in
                </T>
              </Pressable>
            ) : null}
          </View>
        ))}
      </View>
    </PaletteOverride.Provider>
  );
}

/* one day, drawn by how it went; today's number is bolder */
function Day({ d, end }: { d: CalDay; end?: boolean }) {
  const open = d.kind !== 'ahead' && d.kind !== 'before';
  const label = calLabel(d.k) + ': ' + WORD[d.kind] + (d.slips > 1 ? ', ' + d.slips + ' slips' : '') + (d.today ? ', today so far' : '');
  /* more than one slip: the count sits in the day's lower right corner, inside the pill; on the pill's round end it moves in,
     and the number steps left to make room, so the count never crosses the edge */
  const tuck = end && d.slips > 1;
  const many = d.slips > 1 ? <Text style={[s.many, tuck && s.manyEnd, { color: NIGHT.ink }]}>×{d.slips}</Text> : null;
  const num = (color: string) => <Text style={[s.num, d.today && s.today, tuck && s.numEnd, { color }]}>{d.d}</Text>;
  let inner;
  if (d.kind === 'ok') inner = num(ON_RUN);
  else if (isSlip(d.kind)) inner = num(ON_SLIP);
  else if (d.kind === 'logged') inner = <View style={[s.round, { backgroundColor: COOL }]}>{num(NIGHT.ink)}</View>;
  else if (d.kind === 'away') inner = <View style={[s.round, s.open, { borderColor: NIGHT.muted }]}>{num(NIGHT.muted)}</View>;
  /* a night nobody told Daybook about (core truth.ts): hollow and dashed, plainer than a day still to come, and nothing counted */ else if (
    d.kind === 'untold'
  )
    inner = <View style={[s.round, s.open, s.dash, { borderColor: NIGHT.muted }]}>{num(NIGHT.muted)}</View>;
  else if (d.kind === 'ahead') inner = <View style={[s.round, s.open, s.dash]}>{num('rgba(207,200,242,0.5)')}</View>;
  else inner = num(d.kind === 'before' ? 'rgba(207,200,242,0.35)' : NIGHT.muted);
  if (!open)
    return (
      <View style={s.box} accessibilityLabel={label}>
        {inner}
      </View>
    );
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label + '. Open the day.'}
      onPress={() => {
        buzz('tap');
        router.push({ pathname: '/day/[date]', params: { date: d.k } });
      }}
      style={({ pressed }) => [s.box, pressed && { opacity: 0.7, transform: [{ scale: 0.94 }] }]}>
      {inner}
      {many}
      {d.kind === 'saved' ? <View style={s.back} /> : null}
    </Pressable>
  );
}

/* the key's small picture of each kind of day */
function Swatch({ k }: { k: CalKind }) {
  if (k === 'ok') return <LinearGradient colors={RUN} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.swRun} />;
  if (k === 'slip') return <LinearGradient colors={SLIP} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.swRun} />;
  if (k === 'saved') return <View style={[s.back, s.swBack]} />;
  if (k === 'logged') return <View style={[s.swDot, { width: 12, height: 12, backgroundColor: COOL }]} />;
  if (k === 'away') return <View style={[s.swDot, s.open, { width: 12, height: 12, borderColor: NIGHT.muted }]} />;
  if (k === 'untold') return <View style={[s.swDot, s.open, s.dash, { width: 14, height: 14, borderRadius: 7, borderColor: NIGHT.muted }]} />;
  return <View style={[s.swDot, s.open, s.dash, { width: 14, height: 14, borderRadius: 7 }]} />;
}

const s = StyleSheet.create({
  card: { borderRadius: 20, overflow: 'hidden', padding: 16, paddingTop: 12, gap: 12, backgroundColor: SKY[1] },
  star: { position: 'absolute', backgroundColor: '#FFF6D8', opacity: 0.55 },
  head: { flexDirection: 'row', alignItems: 'center', marginRight: -10 },
  nav: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  fill: { minHeight: 44, minWidth: 44, marginVertical: -13, alignItems: 'flex-end', justifyContent: 'center' },
  week: { flexDirection: 'row', alignItems: 'center' },
  dowBox: { flex: 1, alignItems: 'center', paddingBottom: 6 },
  dow: { fontFamily: font.bodySemi, fontSize: 12 },
  box: { flex: 1, height: ROW, alignItems: 'center', justifyContent: 'center' },
  runBox: { position: 'absolute', top: 4, bottom: 4, paddingHorizontal: 3 },
  run: {
    flex: 1,
    borderRadius: 20,
    shadowColor: '#FF8A28',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  slipRun: { shadowOpacity: 0, borderWidth: 1, borderColor: 'rgba(170,150,255,0.25)' },
  num: { fontFamily: font.bodySemi, fontSize: 15 },
  today: { fontFamily: font.display, fontSize: 17 },
  back: { position: 'absolute', bottom: 8, width: 14, height: 2, borderRadius: 1, backgroundColor: GOLD },
  swBack: { position: 'relative', bottom: 0 },
  many: { position: 'absolute', bottom: 9, right: 2, fontFamily: font.bodySemi, fontSize: 11, lineHeight: 13 },
  manyEnd: { bottom: 10, right: 9 },
  numEnd: { marginRight: 9 },
  round: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  open: { borderWidth: 1.5, backgroundColor: 'transparent' },
  dash: { borderStyle: 'dashed', borderColor: 'rgba(207,200,242,0.35)' },
  key: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 16, rowGap: 6 },
  keyItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  gap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  swRun: { width: 24, height: 12, borderRadius: 6 },
  swDot: { width: 8, height: 8, borderRadius: 4 },
});
