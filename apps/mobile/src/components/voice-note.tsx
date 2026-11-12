/* Voice notes (Future you, lib/future.ts): record one (useNoteRecorder), and play it (VoicePlay in My plan, BigPlay in SOS). iOS and Android only; the web
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
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';

import { Button, Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { openPhoneSettings } from '@/lib/reminders';
import { dropVoice, keepVoice, useVoice, VOICE_MAX } from '@/lib/voice';
import { font, useTheme } from '@/lib/theme';

const secs = (ms: number) => Math.floor(ms / 1000);
const clock = (s: number) => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');

/* the phone's silent switch is ignored only while the person plays or records their own note on purpose */
const loud = (rec: boolean) => setAudioModeAsync({ playsInSilentMode: true, allowsRecording: rec }).catch(() => undefined);
const quiet = () => setAudioModeAsync({ playsInSilentMode: false, allowsRecording: false }).catch(() => undefined);
/* while a recording is starting or running, a player going away (Record again unmounts the hear-back) must not turn the
   microphone off under it */
let recording = false;
const quietIfFree = () => (recording ? undefined : quiet());

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
  useEffect(() => () => void quietIfFree(), []);
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

/** Future you's recorder (app/future.tsx): start, stop at the end of the time, and the recording waiting in the cache until
    it is kept. Nothing is kept until the person says so. */
export function useNoteRecorder(max: number) {
  const rec = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const rs = useAudioRecorderState(rec, 250);
  const [denied, setDenied] = useState(false);
  const [fail, setFail] = useState('');
  const [tmp, setTmp] = useState<string | null>(null);
  /* the time limit and a tap on Stop can both ask to stop: only the first does */
  const stopping = useRef(false);
  const stop = async () => {
    if (stopping.current) return;
    stopping.current = true;
    try {
      await rec.stop();
      recording = false;
      await quiet();
      if (rec.uri) setTmp(rec.uri);
      buzz('save');
    } catch {
      recording = false;
      await quiet();
      setFail('That did not record. Try again.');
    }
  };
  /* leaving the page mid-recording gives the phone's sound back */
  useEffect(
    () => () => {
      recording = false;
      quiet();
    },
    [],
  );
  useEffect(() => {
    if (rs.isRecording && secs(rs.durationMillis) >= max) stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rs.isRecording, rs.durationMillis]);
  const start = async () => {
    const p = await requestRecordingPermissionsAsync();
    if (!p.granted) {
      setDenied(true);
      return;
    }
    setDenied(false);
    setFail('');
    setTmp(null);
    recording = true;
    stopping.current = false;
    try {
      await loud(true);
      await rec.prepareToRecordAsync();
      rec.record();
      buzz('tap');
    } catch {
      recording = false;
      await quiet();
      setFail('The microphone did not start. Nothing was recorded. Try again.');
    }
  };
  return { on: rs.isRecording, sec: secs(rs.durationMillis), start, stop, tmp, denied, fail, clear: () => setTmp(null) };
}

/** a big round play button, the one thing on its page (SOS's Future you, and the recording just made): it plays the note
    when tapped, never by itself. `onEnd` runs when it has played to the end. */
export function BigPlay({ uri, label, onPlay, onEnd, size = 112 }: { uri: string; label: string; onPlay?: () => void; onEnd?: () => void; size?: number }) {
  const c = useTheme();
  const p = useAudioPlayer(uri);
  const st = useAudioPlayerStatus(p);
  useEffect(() => {
    if (st.didJustFinish) {
      p.seekTo(0).catch(() => undefined);
      quiet();
      onEnd?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [st.didJustFinish, p]);
  useEffect(() => () => void quietIfFree(), []);
  const on = st.playing;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={on ? 'Pause' : label}
      onPress={async () => {
        if (on) {
          p.pause();
          return;
        }
        await loud(false);
        p.play();
        onPlay?.();
        buzz('tap');
      }}
      style={({ pressed }) => [
        s.big,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: c.accent,
          shadowColor: c.accentDeep,
          transform: [{ translateY: pressed ? 3 : 0 }],
        },
      ]}>
      <Icon name={on ? 'pause' : 'play'} size={Math.round(size * 0.38)} color={c.accentInk} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  confirm: { gap: 8, padding: 12, borderRadius: 14 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  play: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 10, minHeight: 44, paddingLeft: 6, paddingRight: 16, borderRadius: 999 },
  pi: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  pt: { fontFamily: font.bodySemi, fontSize: 15 },
  /* the lip: this is the main thing to press on its page */
  big: { alignItems: 'center', justifyContent: 'center', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4 },
});
