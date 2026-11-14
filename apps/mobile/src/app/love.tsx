/* Real love: a few videos, kept low in Settings, that show what real love looks like next to porn: people falling in love, a
   message that lifts (the owner, November 14, 2026, a test feature; the list is core resources.ts). The player sits big at the
   top and stays dark and still until a video is tapped, because only then does anything load from YouTube. The list is under it,
   in reach of the thumb. */
import { LOVE_VIDEOS } from '@daybook/core';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, View, type ScrollViewInstance } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { LinkCard, Rows } from '@/components/link-card';
import { Screen } from '@/components/screen';
import { T } from '@/components/ui';
import { VideoPlayer } from '@/components/video-player';
import { buzz } from '@/lib/feel';

export default function Love() {
  const [playing, setPlaying] = useState<string | null>(null);
  const top = useRef<ScrollViewInstance>(null);
  const first = LOVE_VIDEOS[0];
  const now = LOVE_VIDEOS.find((v) => v.id === playing) || first;
  const play = (id: string) => {
    buzz('tap');
    setPlaying(id);
    top.current?.scrollTo({ y: 0, animated: true });
  };
  return (
    <Screen title="Real love" back="Settings" scrollRef={top}>
      <View style={{ gap: 8 }}>
        <View style={s.frame}>
          {playing ? (
            <VideoPlayer id={playing} />
          ) : (
            <Pressable accessibilityRole="button" accessibilityLabel={'Play ' + now.title} onPress={() => play(now.id)} style={s.still}>
              {({ pressed }) => (
                <View style={[s.play, { opacity: pressed ? 0.7 : 1 }]}>
                  <Svg width={30} height={30} viewBox="0 0 24 24">
                    <Path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" fill="#FFFFFF" />
                  </Svg>
                </View>
              )}
            </Pressable>
          )}
        </View>
        <View style={s.words}>
          <T v="label">{now.title}</T>
          {now.note ? (
            <T v="small" tone="muted">
              {now.note}
            </T>
          ) : null}
        </View>
      </View>
      {LOVE_VIDEOS.length > 1 ? (
        <Rows>
          {LOVE_VIDEOS.map((v) => (
            <LinkCard key={v.id} icon={v.id === playing ? 'heart' : 'play'} tone="coral" title={v.title} sub={v.note} onPress={() => play(v.id)} />
          ))}
        </Rows>
      ) : null}
    </Screen>
  );
}

const s = StyleSheet.create({
  frame: { width: '100%', aspectRatio: 16 / 9, borderRadius: 20, overflow: 'hidden', backgroundColor: '#14101F' },
  still: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  play: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', paddingLeft: 4, backgroundColor: 'rgba(255,255,255,0.16)' },
  words: { paddingHorizontal: 4, gap: 2 },
});
