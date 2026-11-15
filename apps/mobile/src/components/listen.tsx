/* Listen: a story card read aloud, with each word lit as it is said (the owner, November 14, 2026: "can you add an option to listen
   ... and then trace the text as it reads?"). The voice is a real recording made ahead of time with Kokoro (core voice.ts; the owner,
   November 14, 2026: "the AI voice is terrible ... Kokoro or something like that?"), fetched from the website the first time a card is
   heard and kept on the phone after (lib/voice-clip.ts). A card with no recording yet, or no network for one not heard before, is read
   by the phone's own voice instead (expo-speech), the best English voice installed. Once on, it stays on for the lesson: each card is
   read as it comes in, until the person turns it off or leaves. */
import { lfmt, voiceAt, voiceKey, voiceSaid, VOICES, type Settings } from '@daybook/core';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as Speech from 'expo-speech';
import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, View, type StyleProp, type TextStyle } from 'react-native';

import { Text } from '@/components/text';
import { Icon, InkContext, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { getListen, RATES, setListen, useListen } from '@/lib/listen-prefs';
import { getClip } from '@/lib/voice-clip';
import { font, useTheme } from '@/lib/theme';

/* a color with less of it: the words the voice has not reached yet */
function fade(color: string, a: number): string {
  const m = /^#([0-9a-f]{6})$/i.exec(color);
  if (m) {
    const n = parseInt(m[1], 16);
    return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
  }
  const r = /^rgba?\(([^)]+)\)$/.exec(color);
  if (r) {
    const [x, y, z, o = '1'] = r[1].split(',').map((t) => t.trim());
    return `rgba(${x},${y},${z},${Number(o) * a})`;
  }
  return color;
}
/* on the web, each word eases up to full ink instead of snapping */
const GLIDE = (Platform.OS === 'web' ? { transitionProperty: 'color', transitionDuration: '220ms' } : null) as TextStyle | null;

/** Listen is offered everywhere now: the recordings play on iOS, Android and the web, and the phone's own voice covers the rest */
export const LISTEN_OK = true;

/* the best English voice on the device: a premium or enhanced one first, then the person's own region */
let voiceId: string | null | undefined;
async function bestVoice(): Promise<string | null> {
  if (voiceId !== undefined) return voiceId;
  try {
    const all = (await Speech.getAvailableVoicesAsync()).filter((v) => /^en/i.test(v.language));
    const rank = (v: Speech.Voice) => (String(v.quality) === 'Premium' ? 4 : String(v.quality) === 'Enhanced' ? 2 : 0) + (/^en-US/i.test(v.language) ? 1 : 0);
    all.sort((a, b) => rank(b) - rank(a));
    voiceId = all[0]?.identifier || null;
  } catch {
    voiceId = null;
  }
  return voiceId;
}

/* one player for every card: on the web a browser lets a sound play without a fresh tap only on an element it has already seen a tap
   play, so the next card reuses it */
let player: AudioPlayer | null = null;
function thePlayer(uri: string): AudioPlayer {
  if (!player) player = createAudioPlayer({ uri }, { updateInterval: 100 });
  else player.replace({ uri });
  return player;
}
function hush() {
  try {
    player?.pause();
  } catch {
    /* nothing playing */
  }
  void Speech.stop();
}
/* while Listen plays, it plays with the silent switch on, like the scripture reader; after, the sound guide's own way again */
const loud = () => setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'doNotMix' }).catch(() => undefined);
const quiet = () => setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' }).catch(() => undefined);

/** a word of the card, where it starts in what is said, and whether it is bold */
interface Word {
  t: string;
  at: number;
  b: boolean;
}
/* splits text into words and the spaces after them, keeping each word's place in the whole string */
function words(text: string, from: number, b: boolean, out: Word[]) {
  /* a run of spaces on its own is kept too: the words after a bold phrase start with one */
  const re = /\S+\s*|\s+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) out.push({ t: m[0], at: from + m.index, b });
}

const rateName = (r: number) => String(r).replace(/^0\./, '.') + '×';

/** Listen, at the bottom left of a story card: one quiet pill to start; once on, play and pause, the speed, and the voice, each one
    tap, and the speed and the voice are remembered (lib/listen-prefs.ts) */
export function ListenButton({ on, onPress, ink }: { on: boolean; onPress: () => void; ink: string }) {
  const lp = useListen();
  const pill = (pressed: boolean, lit?: boolean) => [s.btn, { borderColor: ink, opacity: pressed ? 0.7 : 1 }, lit && s.btnOn];
  if (!on)
    return (
      <Pressable
        onPress={() => {
          buzz('tap');
          setListen({ paused: false });
          onPress();
        }}
        accessibilityRole="button"
        accessibilityLabel="Listen to this lesson"
        hitSlop={8}
        style={({ pressed }) => pill(pressed)}>
        <Icon name="play" size={16} color={ink} />
        <Text style={[s.btnT, { color: ink }]}>Listen</Text>
      </Pressable>
    );
  const vi = Math.max(
    0,
    VOICES.findIndex((v) => v.id === lp.voice),
  );
  const ri = Math.max(0, (RATES as readonly number[]).indexOf(lp.rate));
  return (
    <View style={s.row}>
      <Pressable
        onPress={() => {
          buzz('tap');
          if (lp.done) setListen({ done: false, paused: false, again: lp.again + 1 });
          else setListen({ paused: !lp.paused });
        }}
        accessibilityRole="button"
        accessibilityLabel={lp.done ? 'Play again' : lp.paused ? 'Play' : 'Pause'}
        hitSlop={6}
        style={({ pressed }) => [pill(pressed, !lp.paused && !lp.done), s.round]}>
        <Icon name={lp.paused || lp.done ? 'play' : 'pause'} size={18} color={ink} />
      </Pressable>
      <Pressable
        onPress={() => {
          buzz('tap');
          setListen({ rate: RATES[(ri + 1) % RATES.length] });
        }}
        accessibilityRole="button"
        accessibilityLabel={'Speed ' + lp.rate + ' times. Tap to change.'}
        hitSlop={6}
        style={({ pressed }) => [pill(pressed), s.chip]}>
        <Text style={[s.btnT, { color: ink }]}>{rateName(lp.rate)}</Text>
      </Pressable>
      <Pressable
        onPress={() => {
          buzz('tap');
          setListen({ voice: VOICES[(vi + 1) % VOICES.length].id });
        }}
        accessibilityRole="button"
        accessibilityLabel={'Voice: ' + VOICES[vi].name + '. Tap to switch.'}
        hitSlop={6}
        style={({ pressed }) => [pill(pressed), s.chip]}>
        <Icon name="mic" size={15} color={ink} />
        <Text style={[s.btnT, { color: ink }]}>{VOICES[vi].name}</Text>
      </Pressable>
    </View>
  );
}

/** a story card's heading and words. When on, the phone reads them aloud and the word being said is lit. */
export function SpokenCard({
  h,
  body,
  st,
  on,
  hStyle,
  pStyle,
}: {
  h: string;
  body?: string;
  st: Settings;
  on: boolean;
  hStyle: StyleProp<TextStyle>;
  pStyle: StyleProp<TextStyle>;
}) {
  /* what is said: the heading, then the words as they read on the card (bold marks out, the person's own words in) */
  const { said, hw, bw } = useMemo(() => {
    const hw: Word[] = [];
    words(h, 0, false, hw);
    const bw: Word[] = [];
    let at = h.length + 1;
    (body ? lfmt(body, st) : []).forEach((x) => {
      words(x.t, at, x.b, bw);
      at += x.t.length;
    });
    return { said: voiceSaid(h, body, st), hw, bw };
  }, [h, body, st]);
  const [now, setNow] = useState(-1);
  const nowRef = useRef(-1);
  nowRef.current = now;
  const { voice, rate, paused, again } = useListen();
  /* what is playing this card: a recording, or the phone's own voice */
  const live = useRef<{ p: AudioPlayer | null; speak: (() => void) | null }>({ p: null, speak: null });
  const settings = useRef({ rate, paused });
  settings.current = { rate, paused };
  useEffect(() => {
    if (!on) {
      setNow(-1);
      return;
    }
    let alive = true;
    let tick: ReturnType<typeof setInterval> | null = null;
    const me: { p: AudioPlayer | null; speak: (() => void) | null } = { p: null, speak: null };
    live.current = me;
    const still = () => alive && live.current === me;
    /* switched voice partway through: the new voice picks up at the word the old one was on */
    const from = nowRef.current > 0 && nowRef.current < said.length ? nowRef.current : -1;
    /* the phone's own voice, when there is no recording to be had. It is handed to the play and pause effect only once the recording
       is known to be missing: handed over while the recording was still loading, a tap or a new card started both voices at once,
       and the phone's voice talked first (the owner heard the old voice on the November 14 build) */
    const speakNow = () => {
      void Speech.stop();
      if (settings.current.paused) return;
      void bestVoice().then((v) => {
        if (!still()) return;
        Speech.speak(said, {
          voice: v || undefined,
          language: v ? undefined : 'en-US',
          rate: settings.current.rate,
          useApplicationAudioSession: false,
          onBoundary: (ev: unknown) => {
            const i = (ev as { charIndex?: number }).charIndex;
            if (still() && typeof i === 'number') setNow(i);
          },
          onDone: () => {
            if (!still()) return;
            setNow(said.length);
            setListen({ done: true });
          },
        });
      });
    };
    setListen({ done: false });
    void (async () => {
      hush();
      const clip = await getClip(voiceKey(said, voice));
      if (!still()) return;
      if (!clip) {
        me.speak = speakNow;
        return speakNow();
      }
      await loud();
      if (!still()) return;
      const p = thePlayer(clip.uri);
      me.p = p;
      p.setPlaybackRate(settings.current.rate, 'high');
      if (from > 0) {
        let ms = 0;
        for (let i = 0; i + 1 < clip.timing.w.length && clip.timing.w[i] <= from; i += 2) ms = clip.timing.w[i + 1];
        await p.seekTo(Math.max(0, ms / 1000 - 0.15)).catch(() => undefined);
        if (!still()) return;
      }
      if (!settings.current.paused) p.play();
      const began = Date.now();
      tick = setInterval(() => {
        if (!still()) return;
        const ms = p.currentTime * 1000;
        if (ms >= clip.timing.ms - 40) {
          setNow(said.length);
          if (!getListen().done) setListen({ done: true });
          return;
        }
        /* asked to play and nothing came (the file would not load): the phone's own voice reads it instead */
        if (ms === 0 && !p.playing && !settings.current.paused && Date.now() - began > 5000) {
          if (tick) clearInterval(tick);
          me.p = null;
          me.speak = null;
          void Speech.stop();
          void bestVoice().then(() => {
            if (!still()) return;
            Speech.speak(said, { rate: settings.current.rate, language: 'en-US', useApplicationAudioSession: false });
          });
          return;
        }
        if (ms > 0) setNow(voiceAt(clip.timing, ms));
      }, 60);
    })();
    return () => {
      alive = false;
      if (tick) clearInterval(tick);
      hush();
    };
  }, [on, said, voice]);
  /* pause and play, the speed, and Play again, without loading the card again */
  const wasAgain = useRef(again);
  useEffect(() => {
    if (!on) return;
    const restart = wasAgain.current !== again;
    wasAgain.current = again;
    const { p, speak } = live.current;
    if (p) {
      p.setPlaybackRate(rate, 'high');
      if (paused) p.pause();
      else if (restart) void p.seekTo(0).then(() => p.play());
      /* a card read to the end stays done: a new speed does not start it over */ else if (!getListen().done) p.play();
    } else if (speak) {
      if (paused) void Speech.stop();
      else if (restart || !getListen().done) speak();
    }
  }, [on, paused, rate, again]);
  /* leaving the lesson, or turning Listen off: the sound guide's own way again */
  useEffect(() => (on ? () => void quiet() : undefined), [on]);
  /* the scripture reader's way, like Apple Music (the owner, November 15, 2026: "it like has a beautiful karaoke view. I'd like to copy
     the play view from that"): once the voice starts, the words still to come are faint, and each word comes up to full ink as it is
     said, so the eye rides just behind the voice. Only the color changes, so no line ever moves. */
  const inkCx = useContext(InkContext);
  const c = useTheme();
  const ink = (inkCx && inkCx.ink) || c.ink;
  const faint = useMemo(() => fade(ink, 0.42), [ink]);
  /* a word is reached once the place being said is inside it */
  const reached = (w: Word) => now >= w.at;
  const draw = (ws: Word[]) =>
    ws.map((w, i) => (
      <Text key={i} style={[w.b ? s.b : undefined, now >= 0 && { color: reached(w) ? ink : faint }, GLIDE]}>
        {w.t}
      </Text>
    ));
  if (!on)
    return (
      <>
        <T style={hStyle} accessibilityRole="header">
          {h}
        </T>
        {body ? <T style={pStyle}>{draw(bw)}</T> : null}
      </>
    );
  return (
    <>
      <T style={hStyle} accessibilityRole="header">
        {draw(hw)}
      </T>
      {body ? <T style={pStyle}>{draw(bw)}</T> : null}
    </>
  );
}

const s = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  btnT: { fontFamily: font.bodySemi, fontSize: 15 },
  btnOn: { backgroundColor: 'rgba(255,210,90,0.22)' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  round: { width: 44, minHeight: 44, paddingHorizontal: 0, justifyContent: 'center' },
  chip: { minHeight: 44, paddingHorizontal: 12 },
  b: { fontFamily: font.bodyBold },
});
