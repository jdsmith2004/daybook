/* The new breathing figure by itself, for the owner to judge before it goes into SOS (November 15, 2026: "I'd like to see
   your mock-up of what you're going to replace the sun with, just for the first one"). It is SOS's night sky with the
   figure on it and nothing else. Again starts it over from the settle. */
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BreathField } from '@/components/breath-field';
import { Text } from '@/components/text';
import { Icon } from '@/components/ui';
import { font, MAX_WIDTH, nightInk, skies } from '@/lib/theme';

export default function BreathePreview() {
  const inset = useSafeAreaInsets();
  const [run, setRun] = useState(0);
  /* ?at=7.5 holds it at that second, for a picture of one moment */
  const { at } = useLocalSearchParams<{ at?: string }>();
  const freeze = at != null && isFinite(Number(at)) ? Number(at) : undefined;
  const [a, b] = skies.dark.night;
  return (
    <View style={s.page}>
      <LinearGradient colors={[a, b]} style={StyleSheet.absoluteFill} />
      <View style={[s.col, { paddingTop: inset.top + 8, paddingBottom: inset.bottom + 16 }]}>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={8}
          style={({ pressed }) => [s.back, { opacity: pressed ? 0.6 : 1 }]}>
          <Icon name="back" size={22} color={nightInk.muted} />
        </Pressable>
        <BreathField key={run} id="sigh" freeze={freeze} />
        <Pressable
          onPress={() => setRun((n) => n + 1)}
          accessibilityRole="button"
          hitSlop={8}
          style={({ pressed }) => [s.again, { opacity: pressed ? 0.6 : 1 }]}>
          <Text style={[s.againT, { color: nightInk.muted }]}>Again</Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#120E38' },
  col: { flex: 1, alignSelf: 'center', width: '100%', maxWidth: MAX_WIDTH, paddingHorizontal: 16 },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginLeft: -8 },
  again: { alignSelf: 'center', minHeight: 44, justifyContent: 'center', paddingHorizontal: 16, marginTop: 24 },
  againT: { fontFamily: font.bodySemi, fontSize: 15 },
});
