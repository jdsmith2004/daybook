/* Welcome back (core away.ts, back.ts): after days away, one question: how many slips while away. The question at the
   top; the number big in the open middle; the slider and Save low, by the thumb. Nothing is set until the slider is
   touched, and nothing is lost whatever the answer: each slip takes one day, never more. Today opens this; the X leaves
   the gap unanswered, Today asks once more the next day, then keeps a quiet row. After the answer, the person's own flame,
   drawn big (flame-medallion.tsx). */
import { answerAwaySlips, awayDue, awaySpan, gameCompute } from '@daybook/core';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, useWindowDimensions, View } from 'react-native';

import { Appear } from '@/components/appear';
import { FlameMedallion } from '@/components/flame-medallion';
import { Dock, SceneFrame } from '@/components/scene';
import { Slider, SliderValue } from '@/components/slider';
import { Button, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { NATIVE, SETTLE_SLOW, useReducedMotion } from '@/lib/motion';
import { close } from '@/lib/nav';
import { useStore } from '@/lib/store';

export default function Back() {
  const { snap, tk, apply } = useStore();
  const win = useWindowDimensions();
  const st = snap.settings;
  /* the gap is fixed when the page opens, so answering does not change what is shown */
  const [gap] = useState(() => (st ? awayDue(snap.days, st, tk) : null));
  const [n, setN] = useState<number | null>(null);
  const [saved, setSaved] = useState<number | null>(null);
  /* the person's own flame, as big as on Today: everything built is still here */
  const level = useMemo(() => (st ? Math.max(1, gameCompute(snap.days, st, snap.reviews, tk).level.n) : 1), [snap, st, tk]);

  if (!st || !gap || saved != null) {
    const words =
      saved == null || !gap
        ? { h: 'Welcome back.', p: 'Everything you built is still here.' }
        : saved === 0
          ? gap.away === false
            ? {
                h: 'Then those nights count.',
                p: `${gap.n} more ${gap.n === 1 ? 'night' : 'nights'} free of it, on your record. That is real, and it is yours.`,
              }
            : { h: 'Then those days count.', p: `${gap.n} more ${gap.n === 1 ? 'day' : 'days'} with no slip. That is real, and it is yours.` }
          : {
              h: 'Thank you for being honest.',
              p:
                st?.cleanMode === 'gentle'
                  ? 'Each slip takes one day, never more. A slip is data, and your longest run stays yours.'
                  : 'A slip is data. Every day you earned stays on your record, and your longest run stays yours.',
            };
    return (
      <SceneFrame title={gap?.away === false ? 'Your nights' : 'Welcome back'} sky="mint" onClose={close}>
        <View style={s.mid}>
          <Rekindle size={Math.min(win.width - 96, win.height * 0.36, 280)}>
            <FlameMedallion level={level} size={Math.min(win.width - 96, win.height * 0.36, 280)} />
          </Rekindle>
        </View>
        <Appear delay={420} by={12}>
          <T v="title" style={s.c} accessibilityRole="header">
            {words.h}
          </T>
        </Appear>
        <Appear delay={560} by={10}>
          <T style={s.c}>{words.p}</T>
        </Appear>
        <Dock>
          <Appear delay={720} by={10}>
            <Button label="Go to Today" onPress={close} />
          </Appear>
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
    <SceneFrame title={gap.away === false ? 'Your nights' : 'Welcome back'} sky="sun" onClose={close}>
      {/* nights not told while the person was here (core truth.ts) are asked about as nights, not as time away */}
      <T v="title" style={s.c} accessibilityRole="header">
        {gap.away === false ? `${gap.n} nights not told.` : 'Welcome back. Everything you built is still here.'}
      </T>
      <T style={s.c}>
        {gap.away === false
          ? `Over those nights (${span}), how many slips did you have? Then they count.`
          : `While you were away (${span}), how many slips did you have?`}
      </T>
      <View style={s.mid}>
        <SliderValue big value={n} caption={n === 1 ? 'slip' : 'slips'} hint="Slide below to answer" />
      </View>
      <Dock>
        <Slider
          label={gap.away === false ? 'Slips over those nights' : 'Slips while you were away'}
          value={n}
          min={0}
          max={gap.max}
          unit="slips"
          readout={false}
          onChange={setN}
        />
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

/* The comeback, once: the flame rises from low and small, springs past its size and settles, and two warm rings of light
   roll out from behind it, like a fire catching again. It never loops, never throws confetti (this is a return, not a party
   about the slip), and with Reduce Motion on the flame is simply there. */
function Rekindle({ size, children }: { size: number; children: React.ReactNode }) {
  const reduce = useReducedMotion();
  const up = useRef(new Animated.Value(0)).current;
  const ring = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduce) {
      up.setValue(1);
      return;
    }
    Animated.parallel([
      Animated.spring(up, { toValue: 1, ...SETTLE_SLOW, useNativeDriver: NATIVE }),
      Animated.timing(ring, { toValue: 1, duration: 1100, delay: 160, easing: Easing.out(Easing.cubic), useNativeDriver: NATIVE }),
    ]).start();
  }, [reduce, up, ring]);
  const rings = [0, 0.28].map((lag) => {
    const t = ring.interpolate({ inputRange: [lag, 1], outputRange: [0, 1], extrapolate: 'clamp' });
    return {
      key: lag,
      style: {
        opacity: t.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 0.55, 0] }),
        transform: [{ scale: t.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.55] }) }],
      },
    };
  });
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {reduce
        ? null
        : rings.map((r) => (
            <Animated.View key={r.key} pointerEvents="none" style={[s.ring, { width: size * 0.82, height: size * 0.82, borderRadius: size }, r.style]} />
          ))}
      <Animated.View
        style={{
          opacity: up.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1] }),
          transform: [
            { translateY: up.interpolate({ inputRange: [0, 1], outputRange: [size * 0.18, 0] }) },
            { scale: up.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }) },
          ],
        }}>
        {children}
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  ring: { position: 'absolute', borderWidth: 3, borderColor: '#FFB547' },
  c: { textAlign: 'center' },
  mid: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  btnSpace: { height: 52 },
});
