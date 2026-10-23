/* Good night: after "Phone away". The last thing seen before the hardest hour, so it carries the plan for a loud night (the one
   picked in SOS "Go to bed", or slow breathing) and, when today's check-in is still open, one tap to do it first.
   On a short phone (the SE) the plan folds into one tap, so Good night fits without scrolling. Ported from the legacy SCENES.night. */
import { bedPlans, fmtClock, rhythm } from '@daybook/core';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { FitArt } from '@/components/fit';
import { NightSky } from '@/components/night-sky';
import { SceneFrame } from '@/components/scene';
import { Button, Icon, T } from '@/components/ui';
import { close } from '@/lib/nav';
import { useStore } from '@/lib/store';

export default function Night() {
  const { at, gain, plan } = useLocalSearchParams<{ at?: string; gain?: string; plan?: string }>();
  const { snap, tk, now } = useStore();
  const st = snap.settings;
  const g = Number(gain) || 0;
  const plans = bedPlans(st);
  const short = useWindowDimensions().height < 700;
  const [open, setOpen] = useState(false);
  const shown = !short || open;
  const ci = st ? rhythm(snap.days, st, tk, now).stops.find((x) => x.k === 'evening' && !x.done) : null;
  return (
    <SceneFrame
      title="Good night"
      sky="night"
      onClose={close}
      footer={
        <View style={{ alignSelf: 'stretch' }}>
          <Button label="Good night" icon="moon" onPress={close} />
        </View>
      }>
      {/* the sky steps aside on a phone too short for it, so Good night stays in reach */}
      <FitArt drop={0.5}>
        <NightSky />
      </FitArt>
      <T v="title" style={s.c} accessibilityRole="header">
        Phone down. Good night.
      </T>
      <T style={s.c}>{at ? `Phone away at ${fmtClock(at)}. ` : ''}That counts. Rest well, and tomorrow is a fresh day.</T>
      {g ? (
        <T v="label" style={[s.c, { color: '#8CF0CE' }]}>
          +{g} points
        </T>
      ) : null}
      {ci ? (
        <View style={s.box}>
          <T v="label">One minute first?</T>
          <T v="small" style={{ color: '#CFC8F2' }}>
            Today&apos;s check-in is still open. Four numbers, and the day is logged.
          </T>
          <Button kind="ghost" label="Check in first" icon="pencil" onPress={() => router.push('/checkin')} />
        </View>
      ) : null}
      <View style={s.box}>
        {short ? (
          <Pressable onPress={() => setOpen(!open)} accessibilityRole="button" accessibilityState={{ expanded: open }} hitSlop={8} style={s.fold}>
            <T v="eyebrow" style={{ color: '#CFC8F2' }}>
              If the thoughts get loud
            </T>
            <View style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}>
              <Icon name="down" size={18} color="#CFC8F2" />
            </View>
          </Pressable>
        ) : (
          <T v="eyebrow" style={{ color: '#CFC8F2' }}>
            If the thoughts get loud
          </T>
        )}
        {shown && plan ? <T v="label">{plan}</T> : null}
        {!shown
          ? null
          : plans
              .filter((p) => !plan || !plan.startsWith(p[1]))
              .map((p) => (
                <View key={p[0]} style={{ gap: 1 }}>
                  <T v="label">{p[1]}</T>
                  <T v="small" style={{ color: '#CFC8F2' }}>
                    {p[2]}
                  </T>
                </View>
              ))}
      </View>
    </SceneFrame>
  );
}

const s = StyleSheet.create({
  c: { textAlign: 'center' },
  fold: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 28 },
  box: { alignSelf: 'stretch', gap: 10, padding: 16, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.10)' },
});
