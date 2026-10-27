/* The flame in a round sky of its own, drawn big (big-flame.tsx: every form the same size, the growth shown in the form):
   for the moments away from Today that show the flame, like the end of a lesson and Welcome back. The sky is the form's
   own, with a few small stars at night, and the flame moves and blooms like the one on Today (still under Reduce Motion). */
import { emblemScene } from '@daybook/core';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { BigFlame } from '@/components/big-flame';

/* a few small stars, placed by hand: [left %, top %, size] */
const STARS: [number, number, number][] = [
  [18, 20, 2],
  [30, 10, 2.5],
  [72, 14, 2],
  [84, 30, 2.5],
  [12, 44, 2],
  [88, 52, 2],
  [24, 66, 1.5],
  [64, 8, 1.5],
];

export function FlameMedallion({ level, size, pulse, label }: { level: number; size: number; pulse?: number; label?: string }) {
  const sc = useMemo(() => emblemScene(level), [level]);
  return (
    <View style={[s.round, { width: size, height: size, borderRadius: size / 2 }]}>
      <LinearGradient colors={sc.sky} locations={sc.at} style={StyleSheet.absoluteFill} />
      {sc.stars
        ? STARS.map(([x, y, r], i) => (
            <View key={i} style={[s.star, { left: `${x}%`, top: `${y}%`, width: r, height: r, borderRadius: r / 2 }]} pointerEvents="none" />
          ))
        : null}
      <BigFlame level={level} size={size} pulse={pulse} label={label} />
    </View>
  );
}

const s = StyleSheet.create({
  round: { overflow: 'hidden' },
  star: { position: 'absolute', backgroundColor: '#FFF6D8', opacity: 0.85 },
});
