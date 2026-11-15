/* Listen: a story card read aloud by the phone's own voice, on the device, with each word lit as it is said (the owner, November 14,
   2026: "can you add an option to listen with the local on device model and then trace the text as it reads? only for ios 27").
   The voice is the system's speech synthesizer (expo-speech, AVSpeechSynthesizer on iOS): nothing leaves the phone, and the best
   English voice installed is used (an enhanced or premium one when the person has downloaded it). Listen is offered on iOS 27 and
   later, and in the demo build on the web so the owner can try it there. Once on, it stays on for the lesson: each card is read as it
   comes in, until the person turns it off or leaves. */
import { lfmt, type Settings } from '@daybook/core';
import * as Speech from 'expo-speech';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, type StyleProp, type TextStyle } from 'react-native';

import { Text } from '@/components/text';
import { Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { font } from '@/lib/theme';

const IOS_MAJOR = Platform.OS === 'ios' ? Number(String(Platform.Version).split('.')[0]) || 0 : 0;
/** Listen is offered on iOS 27 and later, and on the web in the demo build (EXPO_PUBLIC_SHOTS=1) for trying it */
export const LISTEN_OK = IOS_MAJOR >= 27 || (Platform.OS === 'web' && process.env.EXPO_PUBLIC_SHOTS === '1');

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

/** the Listen button: a quiet pill at the bottom left of a story card */
export function ListenButton({ on, onPress, ink }: { on: boolean; onPress: () => void; ink: string }) {
  return (
    <Pressable
      onPress={() => {
        buzz('tap');
        onPress();
      }}
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      accessibilityLabel={on ? 'Stop listening' : 'Listen to this lesson'}
      hitSlop={8}
      style={({ pressed }) => [s.btn, { borderColor: ink, opacity: pressed ? 0.7 : 1 }, on && { backgroundColor: 'rgba(255,210,90,0.22)' }]}>
      <Icon name={on ? 'pause' : 'play'} size={16} color={ink} />
      <Text style={[s.btnT, { color: ink }]}>{on ? 'Listening' : 'Listen'}</Text>
    </Pressable>
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
    const said =
      h +
      ' ' +
      (body
        ? lfmt(body, st)
            .map((x) => x.t)
            .join('')
        : '');
    return { said, hw, bw };
  }, [h, body, st]);
  const [now, setNow] = useState(-1);
  const live = useRef(0);
  useEffect(() => {
    if (!on) {
      setNow(-1);
      return;
    }
    const me = ++live.current;
    let alive = true;
    void (async () => {
      await Speech.stop();
      const voice = await bestVoice();
      if (!alive || me !== live.current) return;
      Speech.speak(said, {
        voice: voice || undefined,
        language: voice ? undefined : 'en-US',
        rate: 1,
        useApplicationAudioSession: false,
        onBoundary: (ev: unknown) => {
          const i = (ev as { charIndex?: number }).charIndex;
          if (alive && typeof i === 'number') setNow(i);
        },
        onDone: () => {
          if (alive) setNow(said.length);
        },
        onStopped: () => {
          if (alive) setNow(-1);
        },
      });
    })();
    return () => {
      alive = false;
      void Speech.stop();
    };
  }, [on, said]);
  /* the word whose span holds the place being said */
  const lit = (w: Word, next?: Word) => now >= w.at && now < (next ? next.at : w.at + w.t.length);
  /* the light sits on the word alone, not on the space after it */
  const draw = (ws: Word[]) =>
    ws.map((w, i) => {
      const word = w.t.trimEnd();
      return (
        <Text key={i} style={w.b ? s.b : undefined}>
          <Text style={lit(w, ws[i + 1]) ? s.lit : undefined}>{word}</Text>
          {w.t.slice(word.length)}
        </Text>
      );
    });
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
  b: { fontFamily: font.bodyBold },
  /* the word being said: a warm light behind it, like a finger under the line */
  lit: { backgroundColor: 'rgba(255,210,90,0.45)', borderRadius: 4 },
});
