/* Welcome back (core away.ts, back.ts): after days away, one question: how many slips while away. The question at the
   top; the number big in the open middle; the slider and Save low, by the thumb. Nothing is set until the slider is
   touched, and nothing is lost whatever the answer: each slip takes one day, never more. Today opens this; the X leaves
   the gap unanswered, Today asks once more the next day, then keeps a quiet row. */
import { answerAwaySlips, awayDue, awaySpan } from '@daybook/core';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Appear } from '@/components/appear';
import { Flame } from '@/components/flame';
import { Dock, SceneFrame } from '@/components/scene';
import { Slider, SliderValue } from '@/components/slider';
import { Button, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { close } from '@/lib/nav';
import { useStore } from '@/lib/store';

export default function Back() {
  const { snap, tk, apply } = useStore();
  const st = snap.settings;
  /* the gap is fixed when the page opens, so answering does not change what is shown */
  const [gap] = useState(() => (st ? awayDue(snap.days, st, tk) : null));
  const [n, setN] = useState<number | null>(null);
  const [saved, setSaved] = useState<number | null>(null);

  if (!st || !gap || saved != null) {
    const words =
      saved == null || !gap
        ? { h: 'Welcome back.', p: 'Everything you built is still here.' }
        : saved === 0
          ? { h: 'Then those days count.', p: `${gap.n} more ${gap.n === 1 ? 'day' : 'days'} with no slip. That is real, and it is yours.` }
          : { h: 'Thank you for being honest.', p: 'Each slip takes one day, never more. A slip is data, not a reset, and your longest run stays yours.' };
    return (
      <SceneFrame title="Welcome back" sky="mint" onClose={close}>
        <View style={s.mid}>
          <Flame level={2} size={110} />
        </View>
        <T v="title" style={s.c} accessibilityRole="header">
          {words.h}
        </T>
        <T style={s.c}>{words.p}</T>
        <Dock>
          <Button label="Go to Today" onPress={close} />
        </Dock>
      </SceneFrame>
    );
  }

  const span = awaySpan(gap.from, gap.to);
  const save = () => {
    if (n == null) return;
    apply({ st: answerAwaySlips(st, gap, n) });
    buzz(n === 0 ? 'lit' : 'save');
    setSaved(n);
  };
  return (
    <SceneFrame title="Welcome back" sky="sun" onClose={close}>
      <T v="title" style={s.c} accessibilityRole="header">
        Welcome back. Everything you built is still here.
      </T>
      <T style={s.c}>While you were away ({span}), how many slips did you have?</T>
      <View style={s.mid}>
        <SliderValue big value={n} caption={n === 1 ? 'slip' : 'slips'} hint="Slide below to answer" />
      </View>
      <Dock>
        <Slider label="Slips while you were away" value={n} min={0} max={gap.max} unit="slips" readout={false} onChange={setN} />
        {n != null ? (
          <Appear by={10} duration={240}>
            <Button label="Save" onPress={save} />
          </Appear>
        ) : (
          <View style={s.btnSpace} />
        )}
      </Dock>
    </SceneFrame>
  );
}

const s = StyleSheet.create({
  c: { textAlign: 'center' },
  mid: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  btnSpace: { height: 52 },
});
