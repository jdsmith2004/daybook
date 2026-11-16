/* A turn of breathing: the figure (components/breath-field), the breath by touch, and one quiet switch low on the screen
   to change the pattern. The choice is kept on the device, and the sigh is first (core breath-field.ts). In SOS it runs
   three breaths and moves on; the preview page lets it run.

   The touch (the owner, November 15, 2026: "we need good intentional haptics") is core breath-touch.ts: a breath in is a
   run of taps that come closer and firmer as the lungs fill, the second breath in of a sigh is its own short run on top,
   a hold is still, and a breath out opens with one firm tap, so the turn is plain with eyes closed, and falls away. The
   last breath ends on the one success buzz. Changing the pattern is a selection click. */
import { FIELD_BREATHS, FIELD_PATTERNS, fieldNext, fieldRound, type FieldId } from '@daybook/core';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { BreathField } from '@/components/breath-field';
import { useStartWhen } from '@/components/orb';
import { Text } from '@/components/text';
import { Icon } from '@/components/ui';
import { useBreathTouch, type Steps } from '@/lib/breath';
import { buzz } from '@/lib/feel';
import { setFieldPref, useFieldPref } from '@/lib/prefs';
import { font, useTheme } from '@/lib/theme';

/** seconds to settle when the pattern has just been changed */
const SETTLE_AGAIN = 3;

export function BreathRide({
  on = true,
  onDone,
  settle = 7,
  endless,
  pattern,
  freeze,
}: {
  on?: boolean;
  /** told once, a moment after the last breath (SOS moves on) */
  onDone?: () => void;
  /** seconds to settle before the first breath */
  settle?: number;
  /** keep breathing, with no last breath (the preview page) */
  endless?: boolean;
  /** show this pattern whatever is saved, and hold it at `freeze` seconds (pictures of one moment) */
  pattern?: FieldId;
  freeze?: number;
}) {
  const c = useTheme();
  const saved = useFieldPref();
  const id = pattern ?? saved;
  const first = useStartWhen(on);
  /* a change of pattern starts over, with a shorter settle */
  const [again, setAgain] = useState<number | null>(null);
  const start = again ?? first;
  const wait = again == null ? settle : SETTLE_AGAIN;
  const [n, setN] = useState(0);
  const steps = FIELD_PATTERNS[id].steps as Steps;
  const over = !endless && n >= FIELD_BREATHS;
  useBreathTouch(steps, start == null ? null : start + wait * 1000, on && freeze == null, endless ? undefined : FIELD_BREATHS * fieldRound(id));
  useEffect(() => {
    if (!over) return;
    buzz('lit');
    const t = setTimeout(() => onDone?.(), 1400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [over]);
  const change = () => {
    buzz('tick');
    setFieldPref(fieldNext(id));
    setN(0);
    setAgain(Date.now());
  };
  const p = FIELD_PATTERNS[id];
  return (
    <View style={s.ride}>
      <BreathField key={id + ':' + start} id={id} on={on} start={start} settle={wait} onBreaths={setN} freeze={freeze} light={c.scheme === 'light'} />
      {pattern ? null : (
        <Pressable
          onPress={change}
          accessibilityRole="button"
          accessibilityLabel={'Breathing pattern: ' + p.name + '. ' + p.desc + '. Change'}
          hitSlop={6}
          style={({ pressed }) => [s.pick, { opacity: pressed ? 0.6 : 1 }]}>
          <Icon name="swap" size={16} color={c.muted} />
          <Text style={[s.pickT, { color: c.muted }]}>{p.name}</Text>
        </Pressable>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  /* room at the top for the line SOS shows there for a moment (how many urges ridden out) */
  ride: { flexGrow: 1, alignSelf: 'stretch', paddingTop: 40 },
  pick: { alignSelf: 'center', minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16 },
  pickT: { fontFamily: font.bodySemi, fontSize: 15 },
});
