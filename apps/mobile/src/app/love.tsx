/* Real love: videos, kept low in Settings, that show what real love looks like next to porn: people falling in love, words that
   lift (the owner, November 14, 2026; the list is core resources.ts). Each video is its own big picture to tap, like any video
   app, and plays full screen in the dark (love-play.tsx). With more than one kind in the list, each kind gets its heading. */
import { loveGroups, type LoveVideo } from '@daybook/core';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/screen';
import { T } from '@/components/ui';
import { VideoThumb } from '@/components/video-thumb';
import { buzz } from '@/lib/feel';

export default function Love() {
  const groups = loveGroups();
  const heads = groups.length > 1;
  return (
    <Screen title="Real love" back="Settings">
      {groups.map((g) => (
        <View key={g.kind} style={s.group}>
          {heads ? (
            <T v="h2" accessibilityRole="header">
              {g.head}
            </T>
          ) : null}
          {g.videos.map((v) => (
            <VideoCard key={v.id} v={v} />
          ))}
        </View>
      ))}
    </Screen>
  );
}

function VideoCard({ v }: { v: LoveVideo }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={'Play ' + v.title + (v.note ? ', ' + v.note : '')}
      onPress={() => {
        buzz('tap');
        router.push({ pathname: '/love-play', params: { id: v.id } });
      }}
      style={({ pressed }) => [s.card, { opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
      <VideoThumb id={v.id} play />
      <View style={s.words}>
        <T v="label">{v.title}</T>
        {v.note ? (
          <T v="small" tone="muted">
            {v.note}
          </T>
        ) : null}
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  group: { gap: 24 },
  card: { gap: 8 },
  words: { paddingHorizontal: 4, gap: 2 },
});
