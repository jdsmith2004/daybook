/* Good night: after "Phone away". Ported from the legacy SCENES.night. */
import { fmtClock } from '@daybook/core';
import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { SceneFrame } from '@/components/scene';
import { Button, Icon, T } from '@/components/ui';
import { close } from '@/lib/nav';

export default function Night() {
  const { at, gain, plan } = useLocalSearchParams<{ at?: string; gain?: string; plan?: string }>();
  const g = Number(gain) || 0;
  return (
    <SceneFrame title="Good night" sky="night" onClose={close}>
      <View style={s.moon}>
        <Icon name="moon" size={44} color="#FFE27A" />
      </View>
      <T v="title" style={s.c} accessibilityRole="header">
        Phone down. Good night.
      </T>
      <T style={s.c}>
        {at ? `Phone away at ${fmtClock(at)}. ` : ''}Tomorrow morning I will ask one thing: did it stay away? Honest is better than perfect.
      </T>
      {plan ? (
        <View style={s.remind}>
          <T v="eyebrow" style={{ color: '#CFC8F2' }}>
            If the thoughts get loud
          </T>
          <T>{plan}</T>
        </View>
      ) : null}
      {g ? (
        <T v="label" style={[s.c, { color: '#8CF0CE' }]}>
          +{g} points
        </T>
      ) : null}
      <Button label="Close" onPress={close} />
    </SceneFrame>
  );
}

const s = StyleSheet.create({
  c: { textAlign: 'center' },
  remind: { alignSelf: 'stretch', gap: 4, padding: 14, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.12)' },
  moon: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.12)' },
});
