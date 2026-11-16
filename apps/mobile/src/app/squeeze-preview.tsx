/* The Squeeze move by itself, on SOS's night sky, for judging the figure: the real move (words, figure, parts, the seat
   switch), with Again to start it over. ?at=8.5 holds it at that second, for a picture; ?day=1 shows it on the light sky. */
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SqueezeField } from '@/components/squeeze-field';
import { SqueezeMove } from '@/components/ride/moves';
import { Text } from '@/components/text';
import { Icon } from '@/components/ui';
import { font, MAX_WIDTH, NightContext, nightInk, skies } from '@/lib/theme';

export default function SqueezePreview() {
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
        <NightContext.Provider value>
          {freeze != null ? <SqueezeField start={0} freeze={freeze} /> : <SqueezeMove key={run} on onDone={() => undefined} />}
        </NightContext.Provider>
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
  again: { alignSelf: 'center', minHeight: 44, justifyContent: 'center', paddingHorizontal: 16, marginTop: 4 },
  againT: { fontFamily: font.bodySemi, fontSize: 15 },
});
