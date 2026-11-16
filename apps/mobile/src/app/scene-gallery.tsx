/* Every scene a lesson told as a story can show, one under another, with its name (dev only: the demo build, EXPO_PUBLIC_SHOTS=1;
   in every other build this address goes to Today). For checking the pictures by eye in light and dark. */
import { Redirect } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SCENE_KEYS, StoryScene } from '@/components/story-art';
import { Text } from '@/components/text';
import { font, toneOf, useTheme } from '@/lib/theme';

const ON = process.env.EXPO_PUBLIC_SHOTS === '1';

export default function SceneGallery() {
  const c = useTheme();
  const inset = useSafeAreaInsets();
  if (!ON) return <Redirect href="/" />;
  const tone = toneOf(c, 'sun');
  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={[s.page, { paddingTop: inset.top + 24 }]}>
      {SCENE_KEYS.map((k) => (
        <View key={k} style={s.row}>
          <Text style={[s.name, { color: c.muted }]}>{k}</Text>
          <StoryScene k={k} t={tone} />
        </View>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { padding: 20, gap: 20, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  row: { alignItems: 'center', gap: 4 },
  name: { fontFamily: font.body, fontSize: 13 },
});
