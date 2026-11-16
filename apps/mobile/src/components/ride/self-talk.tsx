/* Self Talk (core self-talk.ts): the flame helps the person speak to themself by name, as a good friend would. Three lines, one at a
   time, in the flame's cream bubble. Hold the button and say the line, out loud or in your head; when it is said, the flame takes it
   and grows, and the next line comes. Three lines said, the flame stands tall and the ride goes on. About half a minute.
   The name is the person's own first name when Daybook has it (from their Friends card, kept on this phone); otherwise "you", which
   works too. */
import { selfTalk, urEvidence, type Days } from '@daybook/core';
import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Reanimated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { Appear } from '@/components/appear';
import { BigFlame } from '@/components/big-flame';
import { Bubble } from '@/components/lesson-flame';
import { useClock } from '@/components/shapes';
import { Text } from '@/components/text';
import { T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { useMyName } from '@/lib/friends';
import { useReducedMotion } from '@/lib/motion';
import { useCareSettings, useStore } from '@/lib/store';
import { font, useTheme } from '@/lib/theme';
import type { MoveProps } from './moves';

/** how long to hold for a line: about as long as it takes to say it, slowly */
const holdMs = (line: string) => Math.max(2400, Math.min(5200, line.split(/\s+/).length * 330));
/** the flame's size before any line, and what each line said adds */
const FLAME0 = 204;
const FLAME_STEP = 20;

export function SelfTalkMove({ on, onDone, level, name: nameIn, days: daysIn }: MoveProps & { name?: string | null; days?: Days }) {
  const c = useTheme();
  const st = useCareSettings();
  const store = useStore();
  const mine = useMyName();
  const reduce = useReducedMotion();
  const days = daysIn || store.snap.days;
  const name = nameIn !== undefined ? nameIn : mine;
  /* the three lines for this page, picked once */
  const [lines] = useState(() => selfTalk(st, name, urEvidence(days).n, Math.random));
  const [i, setI] = useState(0);
  const [pulse, setPulse] = useState(0);
  const all = i >= lines.length;
  const line = all ? lines[lines.length - 1] : lines[i];

  /* the hold: the fill runs while the button is down, and drains if it is let go early */
  const [t0, setT0] = useState<number | null>(null);
  useClock(on && t0 !== null);
  const need = holdMs(line);
  const p = t0 !== null ? Math.min(1, (Date.now() - t0) / need) : 0;
  const said = () => {
    setT0(null);
    setPulse((x) => x + 1);
    buzz(i + 1 >= lines.length ? 'lit' : 'save');
    setI((x) => x + 1);
  };
  useEffect(() => {
    if (p >= 1) said();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p >= 1]);
  /* haptics, as It is written's hold has them: a tap when the hold starts, a tick at each sixth of the fill so the hand feels it
     filling, a firmer one when a line is said, and the win when all three are said */
  const step = Math.floor(p * 6);
  useEffect(() => {
    if (step > 0 && step < 6) buzz('tick');
  }, [step]);
  /* left before it was held: nothing runs */
  useEffect(() => {
    if (!on) setT0(null);
  }, [on]);

  /* all said: the flame stands tall a moment, then the ride goes on */
  const end = useRef(onDone);
  end.current = onDone;
  useEffect(() => {
    if (!all || !on) return;
    const t = setTimeout(() => end.current(), 3200);
    return () => clearTimeout(t);
  }, [all, on]);

  /* the flame grows with each line said */
  const grow = useSharedValue(FLAME0);
  useEffect(() => {
    const to = FLAME0 + FLAME_STEP * Math.min(i, lines.length) + (all ? 18 : 0);
    grow.value = reduce ? to : withSpring(to, { damping: 12, stiffness: 120 });
  }, [i, all, reduce, grow, lines.length]);
  const flameSize = FLAME0 + FLAME_STEP * lines.length + 18;
  /* the box is as tall as the flame is now, so the bubble stays just over it; the flame grows up from its base */
  const boxStyle = useAnimatedStyle(() => ({ height: grow.value }));
  const flameStyle = useAnimatedStyle(() => ({ transform: [{ translateY: (flameSize - grow.value) / 2 }, { scale: grow.value / flameSize }] }));

  /* a press with no start is a screen reader's click (or a keyboard): the line counts as said at once */
  const pressed = useRef(false);
  const fillW = `${Math.round(p * 100)}%` as const;
  return (
    <View style={s.move}>
      {/* the lines, as marks: said, and still to say. The count is its marks, not a sentence */}
      <View style={s.marks} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {lines.map((_, j) => (
          <View key={j} style={[s.mark, { backgroundColor: j < i ? c.sun2 : c.line }]} />
        ))}
      </View>
      <View style={s.words} accessibilityLiveRegion="polite" aria-live="polite">
        <Appear key={all ? 'all' : 'ask'} by={6} duration={220}>
          <Text style={[s.head, { color: c.ink }]} accessibilityRole="header">
            {all ? 'That is the voice to keep' : 'Say it like a friend would'}
          </Text>
        </Appear>
        <T tone="muted" style={s.c}>
          {all ? 'Say it again whenever you need it.' : 'Out loud if you can. In your head works too.'}
        </T>
      </View>
      <View style={s.mid}>
        <Appear key={'l' + i} by={10} duration={320}>
          <Bubble text={line} style={s.bubble} big />
        </Appear>
        <Reanimated.View
          style={[{ width: flameSize, justifyContent: 'flex-end' }, boxStyle]}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants">
          <Reanimated.View style={[s.flame, { width: flameSize, height: flameSize }, flameStyle]}>
            <BigFlame level={level || 1} size={flameSize} pulse={pulse} noLand />
          </Reanimated.View>
        </Reanimated.View>
      </View>
      {all ? (
        <View style={s.holdSpace} />
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={'Say it: ' + line.replace(/\.$/, '') + '. Press and hold while you say it.'}
          onPressIn={() => {
            pressed.current = true;
            setT0(Date.now());
            buzz('tap');
          }}
          onPressOut={() => setT0(null)}
          onPress={() => {
            if (!pressed.current) said();
            pressed.current = false;
          }}
          style={[
            s.hold,
            { backgroundColor: c.sun, shadowColor: c.lip },
            Platform.OS === 'web' ? ({ userSelect: 'none', touchAction: 'none' } as object) : null,
          ]}>
          <View style={[s.fill, { width: fillW, backgroundColor: c.sun2 }]} />
          <Text style={[s.holdT, { color: c.onSun }]}>{t0 !== null ? 'Say it' : 'Hold, and say it'}</Text>
        </Pressable>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  move: { flexGrow: 1, alignSelf: 'stretch', gap: 12 },
  words: { minHeight: 92, alignItems: 'center', justifyContent: 'center', gap: 4, paddingHorizontal: 8 },
  head: { fontFamily: font.displayBold, fontSize: 28, lineHeight: 36, textAlign: 'center' },
  c: { textAlign: 'center' },
  mid: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', gap: 0 },
  bubble: { maxWidth: 340, alignSelf: 'center', marginBottom: 4 },
  flame: { position: 'absolute', left: 0, bottom: 0 },
  marks: { flexDirection: 'row', gap: 6, alignSelf: 'center' },
  mark: { width: 22, height: 6, borderRadius: 3 },
  hold: {
    minHeight: 64,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0,
  },
  fill: { position: 'absolute', left: 0, top: 0, bottom: 0 },
  holdT: { fontFamily: font.displayBold, fontSize: 20 },
  holdSpace: { minHeight: 64 },
});
