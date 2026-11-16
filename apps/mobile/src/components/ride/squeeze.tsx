/* Squeeze, the SOS move (core ride.ts id 'move'; the rules and words are core squeeze.ts): four parts of the body, each
   squeezed hard for seven seconds and let go for eight, in a seat or on your feet. The words say what to squeeze at the top,
   the figure in the middle (components/squeeze-field) pulls into a hot knot with you and opens from the middle when you let
   go, and one quiet switch low on the screen picks seat or feet. It is its own file so the moves can be redesigned apart
   (moves.tsx keeps the list of moves). */
import { SQZ_HOLD, SQZ_LAST_REST, SQZ_READY, SQZ_REST, squeezeAt, sqzParts } from '@daybook/core';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Platform, Pressable, StyleSheet, View } from 'react-native';

import { Appear } from '@/components/appear';
import { useSeconds, useStartWhen } from '@/components/orb';
import { SqueezeField } from '@/components/squeeze-field';
import { Text } from '@/components/text';
import { Icon, T } from '@/components/ui';
import { buzz, knock } from '@/lib/feel';
import { useSos } from '@/lib/sos';
import { font, useTheme } from '@/lib/theme';
import type { MoveProps } from './moves';

/** the touch of a squeeze, timed from `start`: a firm knock as it starts, a knock each second of the hold that gets firmer
    as it goes, and on letting go two soft ones that fall away. A tap already late is dropped, not played out of step. */
function useSqueezeTouch(start: number | null, on: boolean) {
  useEffect(() => {
    if (!on || start == null || Platform.OS === 'web') return;
    const taps: [number, Haptics.ImpactFeedbackStyle][] = [];
    let at = SQZ_READY;
    for (let i = 0; i < 4; i++) {
      taps.push([at, Haptics.ImpactFeedbackStyle.Heavy]);
      for (let k = 1; k < SQZ_HOLD; k++) taps.push([at + k, k < 4 ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Rigid]);
      at += SQZ_HOLD;
      taps.push([at, Haptics.ImpactFeedbackStyle.Soft], [at + 0.4, Haptics.ImpactFeedbackStyle.Soft]);
      at += i === 3 ? SQZ_LAST_REST : SQZ_REST;
    }
    const now = Date.now();
    const ids = taps
      .filter(([sec]) => start + sec * 1000 >= now - 40)
      .map(([sec, kind]) => setTimeout(() => knock(kind), Math.max(0, start + sec * 1000 - now)));
    return () => ids.forEach(clearTimeout);
  }, [start, on]);
}

export function SqueezeMove({ on, onDone }: MoveProps) {
  const c = useTheme();
  const sos = useSos();
  /* in a seat (at work, in a car) or free to get up; kept on this phone and shared with the Move tool. A seat is the start,
     because it works anywhere. */
  const sit = sos.mem.moveSit !== false;
  const parts = sqzParts(sit);
  const t0 = useStartWhen(on);
  const sec = useSeconds(t0, on);
  const n = squeezeAt(sec);
  const all = n.kind === 'done';
  useSqueezeTouch(t0, on);
  /* the success buzz, a breath to feel it, and on to the next move */
  const done = useRef(onDone);
  done.current = onDone;
  useEffect(() => {
    if (!all) return;
    buzz('lit');
    const t = setTimeout(() => done.current(), 1400);
    return () => clearTimeout(t);
  }, [all]);
  /* halfway through letting go, the next part shows, so there is time to get into place (a wall, a squat) */
  const ahead = n.kind === 'rest' && n.s >= 3 && n.i < parts.length - 1 ? 1 : 0;
  const part = parts[Math.min(parts.length - 1, n.i + ahead)];
  const head = all ? 'Shake it out' : part.head;
  const sub = all ? 'Notice how your body feels now.' : part.sub;
  /* iOS has no live regions, so a screen reader is told each new part */
  useEffect(() => {
    if (Platform.OS !== 'ios' || !on) return;
    AccessibilityInfo.isScreenReaderEnabled()
      .then((yes) => yes && AccessibilityInfo.announceForAccessibility(head))
      .catch(() => undefined);
  }, [head, on]);
  return (
    <View style={s.move}>
      <View style={s.words} accessibilityLiveRegion="polite" aria-live="polite">
        <Appear key={head} by={6} duration={220}>
          <Text style={[s.head, { color: c.ink }]} accessibilityRole="header">
            {head}
          </Text>
        </Appear>
        <T tone="muted" style={s.c}>
          {sub}
        </T>
      </View>
      <SqueezeField on={on} start={t0} light={c.scheme === 'light'} />
      {/* the four parts: done, now, to come */}
      <View style={s.steps} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {parts.map((_, j) => {
          const now = n.kind === 'ready' ? -1 : n.i;
          return <View key={j} style={[s.step, { backgroundColor: j <= now ? c.coral : c.coral + '33', flexGrow: j === now ? 2 : 1 }]} />;
        })}
      </View>
      {/* the one quiet switch, low: the moves for where you are */}
      <Pressable
        onPress={() => {
          buzz('tick');
          sos.setMem((x) => ({ ...x, moveSit: !sit }));
        }}
        accessibilityRole="button"
        accessibilityLabel={(sit ? 'In my seat' : 'On my feet') + '. Change'}
        hitSlop={6}
        style={({ pressed }) => [s.pick, { opacity: pressed ? 0.6 : 1 }]}>
        <Icon name="swap" size={16} color={c.muted} />
        <Text style={[s.pickT, { color: c.muted }]}>{sit ? 'In my seat' : 'On my feet'}</Text>
      </Pressable>
    </View>
  );
}

/* the same look as the other moves (moves.tsx): the words, the steps and the quiet switch */
const s = StyleSheet.create({
  move: { flexGrow: 1, alignSelf: 'stretch', gap: 12 },
  words: { minHeight: 92, alignItems: 'center', justifyContent: 'center', gap: 4, paddingHorizontal: 8 },
  head: { fontFamily: font.displayBold, fontSize: 28, lineHeight: 36, textAlign: 'center' },
  c: { textAlign: 'center' },
  steps: { flexDirection: 'row', gap: 6, alignSelf: 'center', width: 160 },
  step: { flex: 1, height: 6, borderRadius: 3 },
  pick: { alignSelf: 'center', minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16 },
  pickT: { fontFamily: font.bodySemi, fontSize: 15 },
});
