/* The nights, one mark each, drawn the same way on the hero, Days and Sunday (core away.ts nightMarks; the true record,
   truth.ts): a free night is filled with the warm light of a run, a slip is the calm violet a slip has on Days (never amber
   beside the orange of a free night), and a night nobody told Daybook about is hollow and dashed: there, and counted as nothing.
   A night still to come, or before the record started, is a faint ring. */
import type { NightMark } from '@daybook/core';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { T } from '@/components/ui';
import { useTheme } from '@/lib/theme';

/* the Days colors (calendar-card.tsx, weeks-pane.tsx) */
const RUN: [string, string] = ['#F27A1C', '#FFC43D'];
const SLIP_DARK = '#4C3C96';
const SLIP_LIGHT = '#7A68D6';

const WORD: Record<NightMark, string> = { free: 'free of it', slip: 'it happened', untold: 'not told', none: '', ahead: 'still to come' };

/** a screen reader's line for the marks: "Free of it, not told, it happened" */
export const nightMarksSay = (m: NightMark[]) =>
  m
    .filter((x) => x !== 'none' && x !== 'ahead')
    .map((x) => WORD[x])
    .join(', ');

export function NightMarks({
  marks,
  size = 14,
  gap = 6,
  /** on the hero's sky the ink is the sky's own, not the theme's */
  ink,
  dark,
}: {
  marks: NightMark[];
  size?: number;
  gap?: number;
  ink?: string;
  dark?: boolean;
}) {
  const c = useTheme();
  const night = dark ?? c.scheme === 'dark';
  const ring = ink ?? c.muted;
  const dot = { width: size, height: size, borderRadius: size / 2 };
  return (
    <View style={[s.row, { gap }]} accessibilityLabel={nightMarksSay(marks)}>
      {marks.map((m, i) =>
        m === 'free' ? (
          <LinearGradient key={i} colors={RUN} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={dot} />
        ) : m === 'slip' ? (
          <View key={i} style={[dot, { backgroundColor: night ? SLIP_DARK : SLIP_LIGHT }]} />
        ) : m === 'untold' ? (
          <View key={i} style={[dot, s.untold, { borderColor: ring }]} />
        ) : (
          <View key={i} style={[dot, s.none, { borderColor: ring }]} />
        ),
      )}
    </View>
  );
}

/** the key under a set of marks: Free of it, It happened, Not told */
export function NightKey({ ink, dark }: { ink?: string; dark?: boolean }) {
  const c = useTheme();
  return (
    <View style={s.key}>
      {(['free', 'slip', 'untold'] as NightMark[]).map((m) => (
        <View key={m} style={s.keyItem}>
          <NightMarks marks={[m]} size={12} ink={ink} dark={dark} />
          <KeyWord m={m} color={ink ?? c.muted} />
        </View>
      ))}
    </View>
  );
}

function KeyWord({ m, color }: { m: NightMark; color: string }) {
  const w = WORD[m];
  return (
    <T v="small" style={{ color }}>
      {w.charAt(0).toUpperCase() + w.slice(1)}
    </T>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  untold: { borderWidth: 1.5, borderStyle: 'dashed', backgroundColor: 'transparent' },
  none: { borderWidth: 1, opacity: 0.3, backgroundColor: 'transparent' },
  key: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 16, rowGap: 6 },
  keyItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
