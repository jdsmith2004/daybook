/* One video from Real love, full screen in the dark, the way a video is watched: the player big at the top, its name under it,
   and the other videos under that as Up next, in reach of the thumb. Close at the top right goes back to the list. A typed
   address with no video in the list goes back too. */
import { LOVE_VIDEOS } from '@daybook/core';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, InkContext, T } from '@/components/ui';
import { VideoPlayer } from '@/components/video-player';
import { FRAME, VideoThumb } from '@/components/video-thumb';
import { buzz } from '@/lib/feel';
import { MAX_WIDTH, nightInk } from '@/lib/theme';

const BG = '#0E0B18';
const INK = { ink: nightInk.ink, muted: nightInk.muted };

export default function LovePlay() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const inset = useSafeAreaInsets();
  const now = LOVE_VIDEOS.find((v) => v.id === id);
  const close = () => (router.canGoBack() ? router.back() : router.replace('/love'));
  useEffect(() => {
    if (!now) close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now]);
  if (!now) return null;
  const next = LOVE_VIDEOS.filter((v) => v.id !== now.id);
  return (
    <InkContext.Provider value={INK}>
      <View style={[s.page, { paddingTop: inset.top + 8 }]}>
        <StatusBar style="light" />
        <View style={s.col}>
          <View style={s.top}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={() => {
                buzz('tap');
                close();
              }}
              style={({ pressed }) => [s.round, { opacity: pressed ? 0.7 : 1 }]}>
              <Icon name="x" color={nightInk.ink} />
            </Pressable>
          </View>
          <View style={s.player}>
            <VideoPlayer id={now.id} />
          </View>
          <View style={s.words}>
            <T v="h2">{now.title}</T>
            {now.note ? <T tone="muted">{now.note}</T> : null}
          </View>
        </View>
        {next.length ? (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={[s.col, s.next, { paddingBottom: inset.bottom + 24 }]}>
            <T v="label" tone="muted" accessibilityRole="header">
              Up next
            </T>
            {next.map((v) => (
              <Pressable
                key={v.id}
                accessibilityRole="button"
                accessibilityLabel={'Play ' + v.title + (v.note ? ', ' + v.note : '')}
                onPress={() => {
                  buzz('tap');
                  router.setParams({ id: v.id });
                }}
                style={({ pressed }) => [s.row, { opacity: pressed ? 0.7 : 1 }]}>
                <View style={s.small}>
                  <VideoThumb id={v.id} radius={12} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <T v="label">{v.title}</T>
                  {v.note ? (
                    <T v="small" tone="muted">
                      {v.note}
                    </T>
                  ) : null}
                </View>
              </Pressable>
            ))}
          </ScrollView>
        ) : null}
      </View>
    </InkContext.Provider>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: BG },
  col: { width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center', paddingHorizontal: 16 },
  top: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 16 },
  round: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: nightInk.btn },
  player: { width: '100%', aspectRatio: 16 / 9, borderRadius: 20, overflow: 'hidden', backgroundColor: FRAME },
  words: { paddingHorizontal: 4, paddingTop: 12, gap: 2 },
  next: { gap: 16, paddingTop: 32 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  small: { width: 144 },
});
