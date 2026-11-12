/* A chapter, to read and to listen to (core scripture.ts, lib/scripture.ts). The words are the page's one thing, in the book face.
   Bradley Ross reads it when he recorded it, and the verse he is reading glows the sun's color and the page follows it; where he
   did not, Gospel Library is one tap away and plays the Church's own recording. A verse tapped is chosen for a note, which goes
   into the vault the way the Obsidian reader writes it; notes already there show under their verses, as the reader shows them.
   The highlights made in Obsidian show in their colors. Everything the thumb touches sits in the dock at the bottom. */
import { scrGospelLibrary, scrLabel, scrVerseAt, scrVerseList, SCR_CREDIT, type ScrMark, type ScrTrack } from '@daybook/core';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Redirect, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View, type ScrollViewInstance } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Link } from '@/components/choices';
import { ScrLost, scrType } from '@/components/scripture';
import { Text } from '@/components/text';
import { Button, Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { openChapter, scrTrackOf, sendWaiting, setLastRead, useScripture, type ScrOpen } from '@/lib/scripture';
import { MAX_WIDTH, useTheme } from '@/lib/theme';

/** how long the page leaves the reading alone after the person scrolls it themselves */
const HANDS_OFF_MS = 6000;

export default function Read() {
  const lib = useScripture();
  const { key, v } = useLocalSearchParams<{ key: string; v?: string }>();
  if (!lib.can || !lib.on || !key) return <Redirect href="/scripture" />;
  /* a new chapter is a new page: its player, its marks and its place start fresh */
  return <Chapter key={key} chKey={key} marked={v ? scrVerseList(v) : []} />;
}

function Chapter({ chKey, marked }: { chKey: string; marked: number[] }) {
  const c = useTheme();
  const inset = useSafeAreaInsets();
  const [ch, setCh] = useState<ScrOpen | null>(null);
  const [lost, setLost] = useState(false);
  const [track, setTrack] = useState<ScrTrack | null>(null);
  const [sel, setSel] = useState<number[]>([]);
  const scroll = useRef<ScrollViewInstance>(null);
  const colY = useRef(0);
  const ys = useRef<Record<number, number>>({});
  const handsOff = useRef(0);
  const placed = useRef(false);

  /* the notes may have changed in the note sheet, or in Obsidian, so the chapter is read again each time the page shows */
  useFocusEffect(
    useCallback(() => {
      let live = true;
      openChapter(chKey)
        .then((o) => {
          if (!live) return;
          setCh(o);
          setLost(!o);
        })
        .catch(() => live && setLost(true));
      void sendWaiting();
      return () => void (live = false);
    }, [chKey]),
  );
  useEffect(() => {
    void setLastRead(chKey);
    let live = true;
    scrTrackOf(chKey).then((t) => live && setTrack(t));
    return () => void (live = false);
  }, [chKey]);

  /* ---- the audio ---- */
  const source = useMemo(() => (track ? { uri: track.url } : null), [track]);
  const player = useAudioPlayer(source, { updateInterval: 250 });
  const st = useAudioPlayerStatus(player);
  const t = track ? Math.max(0, st.currentTime - track.from) : 0;
  const reading = track && (st.playing || t > 0.5) ? scrVerseAt(track, t) : 0;
  useEffect(
    () => () => {
      /* the sound guide's own way again: the silent switch wins, and other audio keeps playing (lib/sound.ts) */
      setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' }).catch(() => undefined);
    },
    [],
  );
  /* a chapter cut from a longer recording stops where the chapter ends */
  useEffect(() => {
    if (track?.to != null && st.playing && st.currentTime >= track.to) {
      player.pause();
      void player.seekTo(track.from);
    }
  }, [track, st.playing, st.currentTime, player]);
  const toggle = async () => {
    if (!track) return;
    buzz('tap');
    if (st.playing) {
      player.pause();
      return;
    }
    await setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'doNotMix' }).catch(() => undefined);
    if (st.currentTime < track.from - 0.5 || st.didJustFinish || (track.to != null && st.currentTime >= track.to - 0.25)) await player.seekTo(track.from);
    handsOff.current = 0;
    player.play();
  };

  /* the page follows the verse being read, unless the person is reading somewhere else */
  useEffect(() => {
    if (!reading || Date.now() < handsOff.current) return;
    const y = ys.current[reading];
    if (y != null) scroll.current?.scrollTo({ y: Math.max(0, colY.current + y - 140), animated: true });
  }, [reading]);

  /* a chapter opened on some verses (It is written) starts on them */
  const placeOn = (n: number, y: number) => {
    ys.current[n] = y;
    if (!placed.current && marked.length && n === marked[0]) {
      placed.current = true;
      setTimeout(() => scroll.current?.scrollTo({ y: Math.max(0, colY.current + y - 120), animated: false }), 0);
    }
  };

  const notesOn = useMemo(() => {
    const m: Record<number, string[]> = {};
    for (const n of ch?.notes ?? []) if (n.body && n.verses.length) (m[n.verses[0]] = m[n.verses[0]] || []).push(n.body);
    return m;
  }, [ch]);
  const pick = (n: number) => {
    buzz('tap');
    setSel((s) => (s.includes(n) ? s.filter((x) => x !== n) : [...s, n].sort((a, b) => a - b)));
  };
  const go = (to: string | null) => {
    if (!to) return;
    buzz('tap');
    router.replace({ pathname: '/scripture/read', params: { key: to } });
  };
  const gl = ch ? scrGospelLibrary(ch.volume, chKey, sel) : null;
  const tint = useTint();

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView
        ref={scroll}
        onScrollBeginDrag={() => (handsOff.current = Date.now() + HANDS_OFF_MS)}
        contentContainerStyle={[s.content, { paddingTop: inset.top + 8, paddingBottom: inset.bottom + 190 }]}>
        <View style={s.col} onLayout={(e) => (colY.current = e.nativeEvent.layout.y)}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/scripture'))}
            style={s.back}>
            <Icon name="back" size={22} color={c.accentText} />
          </Pressable>
          <T v="title" accessibilityRole="header" style={{ marginBottom: 8 }}>
            {chKey}
          </T>
          {lost ? <ScrLost /> : null}
          {(ch?.chapter.verses ?? []).map((vs) => {
            const on = sel.includes(vs.n);
            const now = vs.n === reading;
            const bg = on ? c.accentSoft : now ? c.sunSoft : marked.includes(vs.n) ? c.sunSoft : vs.mark ? tint[vs.mark] : 'transparent';
            return (
              <Pressable
                key={vs.n}
                onLayout={(e) => placeOn(vs.n, e.nativeEvent.layout.y)}
                onPress={() => pick(vs.n)}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                accessibilityLabel={`Verse ${vs.n}. ${vs.text}`}
                style={[s.verse, { backgroundColor: bg }]}>
                <Text style={[scrType.verse, { color: c.ink }]}>
                  <Text style={[scrType.n, { color: now ? c.sunText : c.muted }]}>{vs.n} </Text>
                  {vs.text}
                </Text>
                {(notesOn[vs.n] || []).map((body, i) => (
                  <View key={i} style={s.note}>
                    <Icon name="pencil" size={14} color={c.accentText} />
                    <T v="small" style={{ flex: 1, color: c.accentText }}>
                      {body}
                    </T>
                  </View>
                ))}
              </Pressable>
            );
          })}
          {track && ch ? (
            <T v="small" tone="muted" style={{ marginTop: 16 }}>
              {SCR_CREDIT}
            </T>
          ) : null}
        </View>
      </ScrollView>
      <LinearGradient pointerEvents="none" colors={[c.bg, c.bg, c.bg + '00']} locations={[0, 0.75, 1]} style={[s.bar, { height: inset.top + 12 }]} />

      <View style={[s.dock, { paddingBottom: inset.bottom + 12 }]} pointerEvents="box-none">
        <LinearGradient pointerEvents="none" colors={[c.bg + '00', c.bg]} locations={[0, 0.4]} style={StyleSheet.absoluteFill} />
        <View style={s.col}>
          {sel.length ? (
            <View style={{ gap: 4 }}>
              <Button
                icon="pencil"
                label={
                  ch?.notes.some((n) => n.label === scrLabel(chKey, sel)) ? 'Edit the note on ' + scrLabel(chKey, sel).slice(chKey.length + 1) : 'Write a note'
                }
                onPress={() => router.push({ pathname: '/scripture-note', params: { key: chKey, v: sel.join(',') } })}
              />
              {gl ? (
                <View style={s.c}>
                  <Link label="Open in Gospel Library" tone="muted" onPress={() => Linking.openURL(gl).catch(() => undefined)} />
                </View>
              ) : null}
            </View>
          ) : (
            <View style={s.player}>
              <Side icon="back" label={ch?.prev ? ch.prev : null} onPress={() => go(ch?.prev ?? null)} />
              {track ? (
                <View style={s.mid}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={st.playing ? 'Pause' : 'Listen to ' + chKey}
                    onPress={() => void toggle()}
                    style={({ pressed }) => [s.play, { backgroundColor: c.accent, opacity: pressed ? 0.85 : 1 }]}>
                    <Icon name={st.playing ? 'pause' : 'play'} size={28} color={c.accentInk} />
                  </Pressable>
                  <T v="small" tone="muted">
                    {st.isBuffering && st.playing ? 'Loading…' : 'Bradley Ross'}
                  </T>
                </View>
              ) : gl ? (
                <View style={[s.mid, { flex: 1 }]}>
                  <Link label="Listen in Gospel Library" onPress={() => Linking.openURL(gl).catch(() => undefined)} />
                </View>
              ) : (
                <View style={{ flex: 1 }} />
              )}
              <Side icon="next" label={ch?.next ? ch.next : null} onPress={() => go(ch?.next ?? null)} />
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

/** the chapter before or after, a round button with nothing in it when there is none */
function Side({ icon, label, onPress }: { icon: string; label: string | null; onPress: () => void }) {
  const c = useTheme();
  if (!label) return <View style={s.side} />;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [s.side, { backgroundColor: c.surface, opacity: pressed ? 0.7 : 1 }]}>
      <Icon name={icon} size={22} color={c.ink} />
    </Pressable>
  );
}

/** the Obsidian highlight colors, as soft fills of the app's own */
function useTint(): Record<ScrMark, string> {
  const c = useTheme();
  return { yellow: c.sunSoft, green: c.mintSoft, blue: c.skySoft, pink: c.coralSoft, purple: c.violetSoft };
}

const s = StyleSheet.create({
  content: { paddingHorizontal: 16, alignItems: 'center' },
  col: { width: '100%', maxWidth: MAX_WIDTH },
  back: { minHeight: 44, minWidth: 44, justifyContent: 'center', alignSelf: 'flex-start', marginLeft: -4 },
  verse: { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4, marginHorizontal: -8, gap: 4 },
  note: { flexDirection: 'row', gap: 8, paddingTop: 4, paddingBottom: 4, alignItems: 'flex-start' },
  bar: { position: 'absolute', top: 0, left: 0, right: 0 },
  dock: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingTop: 32, paddingHorizontal: 16, alignItems: 'center' },
  player: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  mid: { alignItems: 'center', gap: 4 },
  play: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  side: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  c: { alignItems: 'center' },
});
