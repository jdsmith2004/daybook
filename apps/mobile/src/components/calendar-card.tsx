/* The month calendar, first in Pattern > Days (core: calendar.ts): each day colored by how it went, today ringed, the
   month's numbers in a few chips, and ‹ › to go back through the months to where the log starts. A tap on a day opens
   it (app/day/[date].tsx). */
import { calLabel, calMonth, type CalKind, type Snapshot } from '@daybook/core';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';

import { Card, Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { font, useTheme, type Palette } from '@/lib/theme';

const WORD: Record<CalKind, string> = {
  ok: 'no slip',
  one: 'one slip, still counts',
  saved: 'a slip, run saved',
  open: 'a slip, run can keep going',
  slip: 'a slip',
  logged: 'logged',
  none: 'nothing logged',
  away: 'you were away',
  before: 'before the log started',
  ahead: 'still to come',
};
/** the look of a day: its fill, its border, and the color of its number */
type CalDay = ReturnType<typeof calMonth>['days'][number];
/** the month in rows of seven: blanks before the 1st and after the last day */
function weeks(lead: number, days: CalDay[]) {
  const all: (CalDay | null)[] = [...Array<null>(lead).fill(null), ...days];
  while (all.length % 7) all.push(null);
  return Array.from({ length: all.length / 7 }, (_, i) => all.slice(i * 7, i * 7 + 7));
}

function look(kind: CalKind, c: Palette) {
  switch (kind) {
    case 'ok':
      return { bg: c.mint, bd: c.mint, ink: '#FFFFFF' };
    case 'one':
      return { bg: c.mint, bd: c.slip, ink: '#FFFFFF' };
    case 'saved':
      return { bg: c.mint, bd: c.saved, ink: '#FFFFFF' };
    case 'open':
      return { bg: c.slip, bd: c.slipSoft, ink: '#FFFFFF' };
    case 'slip':
      return { bg: c.slip, bd: c.slip, ink: '#FFFFFF' };
    case 'logged':
      return { bg: c.skySoft, bd: c.skySoft, ink: c.skyText };
    case 'none':
      return { bg: c.surface2, bd: c.surface2, ink: c.muted };
    /* not known (away.ts): no color, a dotted outline, never a mark that looks like a failure */
    case 'away':
      return { bg: c.surface2, bd: c.muted, ink: c.muted };
    default:
      return { bg: 'transparent', bd: kind === 'ahead' ? c.line : 'transparent', ink: c.muted };
  }
}

export function CalendarCard({ snap, tk }: { snap: Snapshot; tk: string }) {
  const c = useTheme();
  const st = snap.settings!;
  const [ym, setYm] = useState<string | null>(null);
  const m = calMonth(snap.days, st, tk, ym);
  const kinds = new Set(m.days.map((d) => d.kind));
  const legend = (
    [
      ['ok', 'No slip'],
      ['one', 'One slip, counts'],
      ['saved', 'Run saved'],
      ['open', 'Run can keep going'],
      ['slip', 'Slip'],
      ['logged', 'Logged'],
      ['away', 'Away'],
    ] as [CalKind, string][]
  ).filter(([k]) => kinds.has(k));
  const chips = [
    m.sum.noSlip ? [m.sum.noSlip + (m.sum.noSlip === 1 ? ' no-slip day' : ' no-slip days'), c.mintSoft, c.mintText] : null,
    m.sum.rode ? [m.sum.rode + (m.sum.rode === 1 ? ' urge ridden out' : ' urges ridden out'), c.skySoft, c.skyText] : null,
    m.sum.slips ? [m.sum.slips + (m.sum.slips === 1 ? ' slip, logged' : ' slips, logged'), c.surface2, c.ink] : null,
  ].filter(Boolean) as [string, string, string][];
  const nav = (to: string | null, label: string, icon: string) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !to }}
      disabled={!to}
      hitSlop={6}
      onPress={() => {
        buzz('tap');
        setYm(to);
      }}
      style={[s.nav, { backgroundColor: c.surface2, opacity: to ? 1 : 0.35 }]}>
      <Icon name={icon} size={18} color={c.ink} />
    </Pressable>
  );
  return (
    <Card>
      <View style={s.head}>
        <T v="h2" accessibilityRole="header" style={{ flex: 1 }}>
          {m.title}
        </T>
        {nav(m.prev, 'Earlier month', 'back')}
        {nav(m.next, 'Later month', 'next')}
      </View>
      {chips.length ? (
        <View style={s.chips}>
          {chips.map(([t, bg, ink]) => (
            <View key={t} style={[s.chip, { backgroundColor: bg }]}>
              <Text style={[s.chipT, { color: ink }]}>{t}</Text>
            </View>
          ))}
        </View>
      ) : null}
      {/* week rows of seven equal cells: a width of 100/7 percent each rounds up on iOS and pushes Saturday onto the next line */}
      <View style={s.grid}>
        <View style={s.week}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <View key={'h' + i} style={s.dowBox}>
              <Text style={[s.dow, { color: c.muted }]}>{d}</Text>
            </View>
          ))}
        </View>
        {weeks(m.lead, m.days).map((row, w) => (
          <View key={'w' + w} style={s.week}>
            {row.map((d, i) => {
              if (!d) return <View key={'b' + w + '-' + i} style={s.box} />;
              const l = look(d.kind, c);
              const open = d.kind !== 'ahead' && d.kind !== 'before';
              const inner = (
                <>
                  <Text style={[s.num, { color: l.ink }]}>{d.d}</Text>
                  {d.slips > 1 && d.kind !== 'ok' ? <Text style={[s.many, { color: l.ink }]}>×{d.slips}</Text> : null}
                </>
              );
              const style = [
                s.cell,
                {
                  backgroundColor: l.bg,
                  borderColor: l.bd,
                  borderStyle: d.kind === 'ahead' ? ('dashed' as const) : d.kind === 'away' ? ('dotted' as const) : ('solid' as const),
                },
                d.today && { outlineColor: c.accent, outlineWidth: 2.5, outlineOffset: 2, outlineStyle: 'solid' as const },
              ];
              return (
                <View key={d.k} style={s.box}>
                  {open ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={calLabel(d.k) + ': ' + WORD[d.kind] + (d.today ? ', today so far' : '') + '. Open the day.'}
                      onPress={() => router.push({ pathname: '/day/[date]', params: { date: d.k } })}
                      style={({ pressed }) => [...style, pressed && { opacity: 0.75 }]}>
                      {inner}
                    </Pressable>
                  ) : (
                    <View style={style} accessibilityLabel={calLabel(d.k) + ': ' + WORD[d.kind]}>
                      {inner}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        ))}
      </View>
      {legend.length ? (
        <View style={s.legend}>
          {legend.map(([k, t]) => {
            const l = look(k, c);
            return (
              <View key={k} style={s.key}>
                <View style={[s.keyDot, { backgroundColor: l.bg, borderColor: l.bd, borderStyle: k === 'away' ? 'dotted' : 'solid' }]} />
                <T v="small" tone="muted">
                  {t}
                </T>
              </View>
            );
          })}
        </View>
      ) : null}
      {/* each gap away as one line: its days and its slips, or a way to fill it in (core away.ts) */}
      {m.gaps.map((g) => (
        <View key={g.from} style={s.gap}>
          <View style={[s.keyDot, { backgroundColor: c.surface2, borderColor: c.muted, borderStyle: 'dotted' }]} />
          <T v="small" tone="muted" style={{ flex: 1 }}>
            {g.line}
          </T>
          {g.n == null ? (
            <Pressable accessibilityRole="button" hitSlop={8} onPress={() => router.push('/back')}>
              <T v="small" style={{ color: c.accentText, textDecorationLine: 'underline' }}>
                Fill in
              </T>
            </Pressable>
          ) : null}
        </View>
      ))}
      <T v="small" tone="muted">
        Tap a day to see it, or to add or fix something.
      </T>
    </Card>
  );
}

const s = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nav: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  chipT: { fontFamily: font.bodySemi, fontSize: 13 },
  grid: { gap: 0 },
  week: { flexDirection: 'row' },
  dowBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 6 },
  box: { flex: 1, aspectRatio: 1, padding: 3 },
  dow: { textAlign: 'center', fontFamily: font.bodySemi, fontSize: 12.5, marginTop: 'auto', marginBottom: 2 },
  cell: { flex: 1, borderRadius: 11, borderWidth: 2.5, alignItems: 'center', justifyContent: 'center' },
  num: { fontFamily: font.bodyBold, fontSize: 15 },
  many: { position: 'absolute', bottom: 1, right: 4, fontFamily: font.bodyBold, fontSize: 9.5 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 14, rowGap: 6 },
  key: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  gap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  keyDot: { width: 14, height: 14, borderRadius: 4, borderWidth: 2.5 },
});
