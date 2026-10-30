/* The timer the tools share (Move's 2 minutes, the 10-minute pause): the squiggle ring that fills as time passes
   (components/shapes WavyRing), and inside it a soft shape that keeps a beat (a hold and a letting go, a slow breath, a
   lively pulse), with what is happening and the time left big in the middle. With Reduce Motion the shape stays still,
   and the words (Hold, Let go; Breathe in, Breathe out) still keep the beat. See docs/design-standards.md. */
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Reanimated, { useAnimatedStyle } from 'react-native-reanimated';

import { Shape, WavyRing, type ShapeKind } from '@/components/shapes';
import { Text } from '@/components/text';
import { fmtMS } from '@/components/orb';
import { T } from '@/components/ui';
import { breathAt, useBreathClock, webDeps, type Steps } from '@/lib/breath';
import { useReducedMotion } from '@/lib/motion';
import { font, useTheme } from '@/lib/theme';

/** a beat: two parts that take turns (seconds each), how far the shape shrinks, the words for each part, and its shape */
export type BeatOf = { dur: [number, number]; low: number; words?: [string, string]; kind: ShapeKind };
/** a slow, calm breath: 4 seconds in, 6 out */
export const BEAT_BREATH: BeatOf = { dur: [4, 6], low: 0.8, kind: 'cookie9' };

/** a soft shape that grows through the first part of the beat and eases back in the second, on the one breath curve
    (lib/breath) read from a clock every frame, so the turns are soft and it stays in step with the words */
function Beat({ beat, sec, color, ink, children }: { beat: BeatOf; sec: number; color: string; ink: string; children: React.ReactNode }) {
  const reduce = useReducedMotion();
  const [a, b] = beat.dur;
  const first = sec % (a + b) < a;
  const steps = useMemo<Steps>(
    () => [
      ['in', a],
      ['out', b],
    ],
    [a, b],
  );
  const clock = useBreathClock(sec, !reduce);
  const low = beat.low;
  const grow = useAnimatedStyle(
    () => {
      const v = reduce ? 1 : breathAt(steps, clock.value)[0];
      return { transform: [{ scale: low + (1 - low) * v }] };
    },
    webDeps(reduce, steps, low),
  );
  return (
    <View style={s.beat}>
      <Reanimated.View style={[StyleSheet.absoluteFill, s.beatIn, grow]}>
        <Shape kind={beat.kind} size={BEAT} color={color} />
      </Reanimated.View>
      {children}
      {beat.words ? <Text style={[s.word, { color: ink }]}>{beat.words[first ? 0 : 1]}</Text> : null}
    </View>
  );
}

/** the ring and the beat: `p` of the time gone (0 to 1), `left` in ms, `sec` seconds since the start (for the beat) */
export function ToolTimer({
  p,
  left,
  sec,
  beat,
  label,
  color,
  ink,
}: {
  p: number;
  left: number;
  sec: number;
  beat: BeatOf;
  /** a few words over the time: the move, or what the wait is */
  label: string;
  /** the ring's color, and the color of the beat's words */
  color: string;
  ink: string;
}) {
  const c = useTheme();
  return (
    <View accessible accessibilityRole="timer" accessibilityLabel={label + '. ' + fmtMS(left) + ' left'}>
      <WavyRing size={RING} p={p} color={color} track={c.line} stroke={6}>
        <Beat beat={beat} sec={sec} color={c.surface} ink={ink}>
          <T v="label" style={[s.c, { maxWidth: 170 }]}>
            {label}
          </T>
          <Text style={[s.time, { color: c.ink }]}>{fmtMS(left)}</Text>
        </Beat>
      </WavyRing>
    </View>
  );
}

const RING = 270;
const BEAT = 206;
const s = StyleSheet.create({
  c: { textAlign: 'center' },
  beat: { width: BEAT, height: BEAT, alignItems: 'center', justifyContent: 'center', gap: 2 },
  beatIn: { alignItems: 'center', justifyContent: 'center' },
  time: { fontFamily: font.displayBold, fontSize: 48, lineHeight: 56, fontVariant: ['tabular-nums'] },
  word: { fontFamily: font.bodySemi, fontSize: 15, lineHeight: 18 },
});
