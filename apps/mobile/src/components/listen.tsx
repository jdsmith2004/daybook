/* Listen: a story card read aloud, with each word lit as it is said (the owner, November 14, 2026: "can you add an option to listen
   ... and then trace the text as it reads?"). The voice is a real recording made ahead of time with Kokoro (core voice.ts; the owner,
   November 14, 2026: "the AI voice is terrible ... Kokoro or something like that?"), fetched from the website the first time a card is
   heard and kept on the phone after (lib/voice-clip.ts). A card with no recording yet, or no network for one not heard before, is read
   by the phone's own voice instead (expo-speech), the best English voice installed. Once on, it stays on for the lesson: each card is
   read as it comes in, until the person turns it off or leaves. */
import { lfmt, voiceAt, voiceKey, voiceSaid, VOICES, type Lesson, type Settings } from '@daybook/core';
import { lessonSaid } from '@daybook/core/lesson-content';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as Speech from 'expo-speech';
import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, View, type StyleProp, type TextStyle } from 'react-native';

import { Text } from '@/components/text';
import { Icon, InkContext, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { getListen, RATES, setListen, useListen } from '@/lib/listen-prefs';
import { forgetClip, getClip } from '@/lib/voice-clip';
import { font, useTheme } from '@/lib/theme';

/* whether a color is light: the filled speed takes dark words on it */
function light(color: string): boolean {
  const m = /^#([0-9a-f]{6})$/i.exec(color);
  const r = /^rgba?\(([^)]+)\)$/.exec(color);
  const [x, y, z] = m
    ? [parseInt(m[1], 16) >> 16, (parseInt(m[1], 16) >> 8) & 255, parseInt(m[1], 16) & 255]
    : r
      ? r[1].split(',').map(Number)
      : [255, 255, 255];
  return 0.299 * x + 0.587 * y + 0.114 * z > 150;
}
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
   play, so the next card reuses it.
   On the phone it keeps the sound session open while Listen is on (the owner, November 16, 2026: "it'll like not keep playing when I
   go to the next tab"). Without that, each pause, and the old card's stop as the next card comes in, closed the session a tenth of a
   second later unless a sound was already playing; the next card's recording was still loading then, so it lost its session and
   stayed silent, and after five seconds the phone's own voice took over (the "super AI voice"). */
let player: AudioPlayer | null = null;
function thePlayer(uri: string): AudioPlayer {
  if (!player) player = createAudioPlayer({ uri }, { updateInterval: 100, keepAudioSessionActive: true });
  else player.replace({ uri });
  return player;
}
/* leaving the lesson, or turning Listen off: a moment after the last card lets go and no new card takes the voice, the sound guide's
   own way comes back and, on the phone, the player is let go, which closes the sound session so other apps may play again */
let leaving: ReturnType<typeof setTimeout> | null = null;
function stay() {
  if (leaving) clearTimeout(leaving);
  leaving = null;
}
function leaveSoon() {
  stay();
  leaving = setTimeout(() => {
    leaving = null;
    void quiet();
    if (Platform.OS === 'web' || !player) return;
    try {
      player.remove();
    } catch {
      /* already let go */
    }
    player = null;
  }, 900);
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
  const [speeds, setSpeeds] = useState(false);
  const grow = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!speeds) return;
    grow.setValue(0);
    Animated.spring(grow, { toValue: 1, useNativeDriver: Platform.OS !== 'web', speed: 22, bounciness: 6 }).start();
  }, [speeds, grow]);
  useEffect(() => {
    if (!on) setSpeeds(false);
  }, [on]);
  /* the filled speed's words: dark on a light ink, white on a dark one */
  const onInk = light(ink) ? '#15123A' : '#FFFFFF';
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
  /* the speeds open in place of the controls, one tap each (the owner, November 15, 2026: "let me put the speed higher like up to
     2.0 maybe i tap it and it gives options ... but make it look really nice still"): a single tray, the one in use filled */
  if (speeds)
    return (
      <Animated.View
        style={[s.tray, { borderColor: ink, opacity: grow, transform: [{ scale: grow.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }] }]}>
        {RATES.map((r) => {
          const now = r === lp.rate;
          return (
            <Pressable
              key={r}
              onPress={() => {
                buzz('tap');
                setListen({ rate: r });
                setTimeout(() => setSpeeds(false), 180);
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: now }}
              accessibilityLabel={'Speed ' + r + ' times'}
              hitSlop={4}
              style={({ pressed }) => [s.speed, now && { backgroundColor: ink }, { opacity: pressed ? 0.7 : 1 }]}>
              <Text style={[s.speedT, { color: now ? onInk : ink }]}>{rateName(r)}</Text>
            </Pressable>
          );
        })}
      </Animated.View>
    );
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
          setSpeeds(true);
        }}
        accessibilityRole="button"
        accessibilityLabel={'Speed ' + lp.rate + ' times. Tap to choose.'}
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

/** while Listen is on, the lesson's other recordings are fetched one after another, so the next card plays the moment it comes in */
export function useListenAhead(L: Lesson | null | undefined, st: Settings | null, deep: boolean, on: boolean) {
  const { voice } = useListen();
  const keys = useMemo(() => (on && L ? lessonSaid(L, st, deep).map((x) => voiceKey(x, voice)) : []), [on, L, st, deep, voice]);
  const sig = keys.join(' ');
  useEffect(() => {
    if (!sig) return;
    let alive = true;
    void (async () => {
      for (const k of sig.split(' ')) {
        if (!alive) return;
        await getClip(k);
      }
    })();
    return () => {
      alive = false;
    };
  }, [sig]);
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
    stay();
    const key = voiceKey(said, voice);
    void (async () => {
      hush();
      let clip = await getClip(key);
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
      /* asked to play and nothing came: the recording is loaded again, then fetched afresh, and only after both does the phone's own
         voice read the card. The next card tries its recording again from the start. */
      let since = Date.now();
      let tries = 0;
      let mending = false;
      const mend = async () => {
        mending = true;
        tries++;
        if (tries === 2) {
          forgetClip(key);
          const again = await getClip(key);
          if (!still()) return;
          if (again) clip = again;
        }
        if (!still() || !clip) return;
        p.replace({ uri: clip.uri });
        p.setPlaybackRate(settings.current.rate, 'high');
        if (!settings.current.paused) p.play();
        since = Date.now();
        mending = false;
      };
      tick = setInterval(() => {
        if (!still() || mending || !clip) return;
        const ms = p.currentTime * 1000;
        if (ms >= clip.timing.ms - 40) {
          setNow(said.length);
          if (!getListen().done) setListen({ done: true });
          return;
        }
        /* judged by the sound moving, not by the player's word: on the web it says playing as soon as it is asked to */
        if (settings.current.paused || ms > 0) since = Date.now();
        else if (Date.now() - since > 3000) {
          if (tries < 2) return void mend();
          if (tick) clearInterval(tick);
          p.pause();
          me.p = null;
          me.speak = speakNow;
          return speakNow();
        }
        if (ms > 0) setNow(voiceAt(clip.timing, ms));
      }, 60);
    })();
    return () => {
      alive = false;
      if (tick) clearInterval(tick);
      hush();
      leaveSoon();
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
  tray: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 2, padding: 3, borderRadius: 999, borderWidth: 1.5 },
  speed: { minWidth: 44, height: 38, paddingHorizontal: 6, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  speedT: { fontFamily: font.bodySemi, fontSize: 15 },
});
