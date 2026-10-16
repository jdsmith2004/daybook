/* The voice note: record it in My plan (VoiceRecorder), and play it in SOS (VoicePlay). iOS and Android only; the web
   version of this file shows nothing. The recording stays on this phone (see lib/voice.ts). */
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button, Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { dropVoice, keepVoice, useVoice, VOICE_MAX } from '@/lib/voice';
import { font, useTheme } from '@/lib/theme';

const secs = (ms: number) => Math.floor(ms / 1000);
const clock = (s: number) => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');

/* the phone's silent switch is ignored only while the person plays or records their own note on purpose */
const loud = (rec: boolean) => setAudioModeAsync({ playsInSilentMode: true, allowsRecording: rec }).catch(() => undefined);
const quiet = () => setAudioModeAsync({ playsInSilentMode: false, allowsRecording: false }).catch(() => undefined);

export function VoiceRecorder() {
  const c = useTheme();
  const { uri, v } = useVoice();
  const rec = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const rs = useAudioRecorderState(rec, 250);
  const [denied, setDenied] = useState(false);
  const [sure, setSure] = useState(false);

  const stop = async () => {
    await rec.stop();
    await quiet();
    if (rec.uri) await keepVoice(rec.uri);
    buzz('save');
  };
  useEffect(() => {
    if (rs.isRecording && secs(rs.durationMillis) >= VOICE_MAX) stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rs.isRecording, rs.durationMillis]);

  const start = async () => {
    const p = await requestRecordingPermissionsAsync();
    if (!p.granted) {
      setDenied(true);
      return;
    }
    setDenied(false);
    setSure(false);
    await loud(true);
    await rec.prepareToRecordAsync();
    rec.record();
    buzz('tap');
  };

  if (rs.isRecording)
    return (
      <View style={s.row}>
        <View style={[s.dot, { backgroundColor: c.danger }]} />
        <T style={{ flex: 1 }} accessibilityLiveRegion="polite">
          Recording · {clock(secs(rs.durationMillis))} of {clock(VOICE_MAX)}
        </T>
        <Button icon="stop" label="Stop" onPress={stop} />
      </View>
    );
  return (
    <View style={{ gap: 8 }}>
      {uri ? (
        <>
          <VoicePlay key={v} uri={uri} label="Play my voice note" />
          <View style={s.row}>
            <Button kind="ghost" icon="mic" label="Record again" onPress={start} />
            {sure ? (
              <Button
                kind="danger"
                label="Yes, remove it"
                onPress={() => {
                  dropVoice();
                  setSure(false);
                }}
              />
            ) : (
              <Button kind="ghost" icon="trash" label="Remove" onPress={() => setSure(true)} />
            )}
          </View>
        </>
      ) : (
        <Button kind="ghost" icon="mic" label="Record a voice note" onPress={start} />
      )}
      {denied ? (
        <T v="small" tone="danger">
          Daybook needs the microphone to record. You can turn it on in your phone settings.
        </T>
      ) : null}
      <T v="small" tone="muted">
        Up to a minute, in your own voice. It stays on this phone: backups and sync do not include it. SOS has a button to play it.
      </T>
    </View>
  );
}

/** a small round play button with a line of words: plays the note, or pauses it */
export function VoicePlay({ uri, label }: { uri: string; label: string }) {
  const c = useTheme();
  const p = useAudioPlayer(uri);
  const st = useAudioPlayerStatus(p);
  useEffect(() => {
    if (st.didJustFinish) {
      p.seekTo(0).catch(() => undefined);
      quiet();
    }
  }, [st.didJustFinish, p]);
  useEffect(() => () => void quiet(), []);
  const on = st.playing;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={on ? 'Pause my voice note' : label}
      onPress={async () => {
        if (on) {
          p.pause();
          return;
        }
        await loud(false);
        p.play();
        buzz('tap');
      }}
      style={({ pressed }) => [s.play, { backgroundColor: c.accentSoft, opacity: pressed ? 0.8 : 1 }]}>
      <View style={[s.pi, { backgroundColor: c.accent }]}>
        <Icon name={on ? 'pause' : 'play'} size={18} color={c.accentInk} />
      </View>
      <Text style={[s.pt, { color: c.accentText }]}>{on ? 'Playing…' : label}</Text>
    </Pressable>
  );
}

/** SOS: the play button, only when there is a note */
export function SosVoice() {
  const { uri, v } = useVoice();
  return uri ? (
    <View style={{ marginTop: 6 }}>
      <VoicePlay key={v} uri={uri} label="Hear my voice note" />
    </View>
  ) : null;
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  play: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 10, minHeight: 44, paddingLeft: 6, paddingRight: 16, borderRadius: 999 },
  pi: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  pt: { fontFamily: font.bodySemi, fontSize: 15 },
});
