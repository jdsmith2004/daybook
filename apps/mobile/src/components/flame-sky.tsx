/* The flame in its own sky, away from Today (Milestones, the door to it on More): the same picture as the top of Today
   (components/hero.tsx), the form's sky from edge to edge, its stars at night and its own hills carried on across, with the
   flame drawn big on them. A tap on the flame sends one bloom through it. What is written on the sky goes in `children`,
   laid over the picture (read its colors from skyInk). */
import { emblemScene } from '@daybook/core';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { BigFlame } from '@/components/big-flame';
import { buzz } from '@/lib/feel';

/* a few stars, placed by hand: [left %, top %, size] */
const STARS: [number, number, number][] = [
  [6, 12, 2],
  [14, 34, 3],
  [9, 58, 2],
  [24, 20, 2],
  [31, 8, 3],
  [20, 48, 2],
  [68, 14, 2],
  [76, 36, 3],
  [84, 9, 3],
  [91, 26, 2],
  [94, 50, 3],
  [62, 6, 2],
];

export function FlameSky({
  level,
  height,
  flame,
  foot,
  right,
  tappable = true,
  children,
}: {
  level: number;
  height: number;
  /** the drawing's size */
  flame: number;
  /** how far above the bottom edge the drawing's foot stands */
  foot: number;
  /** stand the flame to the right of the sky, as far in from the edge as this, with room for words on its left */
  right?: number;
  /** a tap on the flame blooms it. Off where the whole picture is one button. */
  tappable?: boolean;
  children?: ReactNode;
}) {
  const sc = useMemo(() => emblemScene(level), [level]);
  const [pulse, setPulse] = useState(0);
  const top = height - flame - foot;
  const drawn = <BigFlame level={level} size={flame} pulse={pulse} />;
  /* the gradient's box takes in the whole drawing, which can stand past the edges of a short sky: iOS paints a gradient black when a location is past 1 */
  const from = Math.min(0, top);
  const box = Math.max(height, top + flame) - from;
  return (
    <View style={[s.sky, { height }]}>
      {/* the sky lines up with the drawing's own, so the drawing melts into it */}
      <LinearGradient
        colors={sc.sky}
        locations={sc.at.map((o) => (top + o * flame - from) / box) as [number, number, number]}
        style={{ position: 'absolute', left: 0, right: 0, top: from, height: box }}
      />
      {sc.stars
        ? STARS.map(([x, y, r], i) => (
            <View key={i} pointerEvents="none" style={[s.star, { left: `${x}%`, top: `${y}%`, width: r, height: r, borderRadius: r / 2 }]} />
          ))
        : null}
      {sc.land ? (
        <SvgXml
          xml={`<svg viewBox="${60 - 400} ${(-top * 120) / flame} 800 ${(height * 120) / flame}" preserveAspectRatio="${right != null ? 'xMaxYMin' : 'xMidYMin'} slice">${sc.land}</svg>`}
          style={StyleSheet.absoluteFill}
          width="100%"
          height={height}
          pointerEvents="none"
        />
      ) : null}
      <View style={[s.flame, { top }, right != null ? { alignItems: 'flex-end', paddingRight: right } : null]} pointerEvents="box-none">
        {tappable ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Your flame, level ${level}. Tap to say hi.`}
            onPress={() => {
              buzz('tap');
              setPulse((n) => n + 1);
            }}>
            {drawn}
          </Pressable>
        ) : (
          drawn
        )}
      </View>
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  sky: { overflow: 'hidden' },
  star: { position: 'absolute', backgroundColor: '#FFF6D8', opacity: 0.8 },
  flame: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
});
