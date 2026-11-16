/* Self Talk by itself, as a ride page shows it, on SOS's own sky (the owner saw it here first, November 15, 2026: "the self talk is
   really good"). Under it, Again starts it over and In a real ride opens a practice ride with Self Talk right after the breath.
   ?name=Sam speaks to Sam (name= with nothing says "you"); ?night=1 or 0 picks the sky. */
import { urNight } from '@daybook/core';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { SelfTalkMove } from '@/components/ride/self-talk';
import { SceneFrame } from '@/components/scene';
import { Text } from '@/components/text';
import { close } from '@/lib/nav';
import { useStore } from '@/lib/store';
import { font, NightContext, useSkyTheme } from '@/lib/theme';

export default function SosPreview() {
  const q = useLocalSearchParams<{ name?: string; night?: string }>();
  const { now } = useStore();
  const night = q.night === '1' || (q.night !== '0' && urNight(new Date(now).getHours()));
  const sky = night ? 'night' : 'violet';
  const c = useSkyTheme(sky);
  const [run, setRun] = useState(0);
  const name = q.name === undefined ? 'Sam' : q.name || null;
  const quiet = (label: string, onPress: () => void) => (
    <Pressable key={label} accessibilityRole="button" onPress={onPress} hitSlop={6} style={({ pressed }) => [s.q, { opacity: pressed ? 0.6 : 1 }]}>
      <Text style={[s.qT, { color: c.ink }]}>{label}</Text>
    </Pressable>
  );
  return (
    <NightContext.Provider value={night}>
      <SceneFrame title="Preview" sky={sky} onClose={close} fixed>
        <View style={s.page}>
          <SelfTalkMove key={'t' + run} on onDone={() => undefined} level={6} name={name} demo />
        </View>
        <View style={s.row}>
          {quiet('Again', () => setRun((x) => x + 1))}
          {quiet('In a real ride', () => router.push({ pathname: '/sos', params: { practice: '1', try: 'selftalk' } }))}
        </View>
      </SceneFrame>
    </NightContext.Provider>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, alignSelf: 'stretch' },
  row: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingTop: 6 },
  q: { minHeight: 40, paddingHorizontal: 14, borderRadius: 999, justifyContent: 'center' },
  qT: { fontFamily: font.bodySemi, fontSize: 15 },
});
