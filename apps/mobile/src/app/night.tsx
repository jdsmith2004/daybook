/* Good night: after "Phone away". The last thing seen before the hardest hour, so it carries the plan for a loud night (the one
   picked in SOS "Go to bed", or slow breathing) and, when today's check-in is still open, one tap to do it first.
   Ported from the legacy SCENES.night. */
import { bedPlans, fmtClock, rhythm } from '@daybook/core';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

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
      <View style={s.moon}>
        <Icon name="moon" size={56} color="#FFE27A" />
      </View>
      <T v="title" style={s.c} accessibilityRole="header">
        Phone down. Good night.
      </T>
      <T style={s.c}>
        {at ? `Phone away at ${fmtClock(at)}. ` : ''}Tomorrow morning I will ask one thing: did it stay away? Honest is better than perfect.
      </T>
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
        <T v="eyebrow" style={{ color: '#CFC8F2' }}>
          If the thoughts get loud
        </T>
        {plan ? <T v="label">{plan}</T> : null}
        {plans
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
  box: { alignSelf: 'stretch', gap: 10, padding: 16, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.10)' },
  moon: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.12)' },
});
