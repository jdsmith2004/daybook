/* Who are you becoming? The one sentence that says who the person is growing into, opened from its card on Today
   (components/today-below.tsx). It is the page the setup had until November 12, 2026, back as its own page (the owner,
   November 13, 2026): the question at the top with the flame, a box to write your own near the top (its Save beside it, since
   the keyboard covers the bottom), and the starter sentences from core OB_BE low, where the thumb is. Saving sets
   settings.becoming the way My plan does (core setField), and the flame says the sentence back. No account: it is care. */
import { BE_LEN, gameCompute, OB_BE, setField } from '@daybook/core';
import { Redirect } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View, type ScrollViewInstance } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Appear } from '@/components/appear';
import { SHORT, useFitRoom } from '@/components/fit';
import { Bubble, FlameSlot } from '@/components/lesson-flame';
import { Answer, AnswerText, BESIDE, Shell } from '@/components/lesson-parts';
import { Next } from '@/components/lx';
import { Middle } from '@/components/scene';
import { Text, TextInput } from '@/components/text';
import { T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { lessonLook, PAPER, PAPER_INK } from '@/lib/lesson-look';
import { close } from '@/lib/nav';
import { useStore } from '@/lib/store';
import { font, useTheme } from '@/lib/theme';

/** one line, trimmed, at most BE_LEN */
const tidy = (v: string) => v.replace(/\s+/g, ' ').trim().slice(0, BE_LEN);

export default function Becoming() {
  const base = useTheme();
  const inset = useSafeAreaInsets();
  const scroll = useRef<ScrollViewInstance>(null);
  const fit = useFitRoom();
  const { snap, tk, apply } = useStore();
  const st = snap.settings;
  const had = tidy(String(st?.becoming || ''));
  /* what is picked: a starter, or the person's own words (a starter typed out by hand counts as the starter) */
  const [pick, setPick] = useState<string>(OB_BE.indexOf(had) >= 0 ? had : '');
  const [own, setOwn] = useState<string>(OB_BE.indexOf(had) >= 0 ? '' : had);
  const [said, setSaid] = useState<string | null>(null);
  const [pulse, setPulse] = useState(0);
  const level = useMemo(() => (st ? Math.max(1, gameCompute(snap.days, st, snap.reviews, tk).level.n) : 1), [st, snap.days, snap.reviews, tk]);
  const look = lessonLook('sun', 0.5, base.scheme);
  if (!st) return <Redirect href="/" />;

  const cur = tidy(own) || pick;
  const save = () => {
    if (!cur) return;
    apply((x) => ({ st: setField(x, 'becoming', cur) }));
    buzz('lit');
    setPulse((n) => n + 1);
    setSaid(cur);
  };

  if (said) {
    /* the warm moment: the flame big in the middle, saying the sentence back */
    return (
      <Shell
        look={look}
        level={level}
        flameOn
        pulse={pulse}
        inset={inset}
        scroll={scroll}
        fit={fit}
        bodyKey="said"
        onClose={close}
        foot={<Next label="Done" noIcon onPress={close} />}>
        <View style={s.head}>
          <T v="title" style={SHORT ? s.titleShort : s.title} accessibilityRole="header">
            That is who you are becoming.
          </T>
        </View>
        <Middle>
          <View style={s.said}>
            <Appear by={10} delay={260} duration={320}>
              <Bubble text={said} />
            </Appear>
            <FlameSlot size={SHORT ? 380 : 500} min={SHORT ? 190 : 260} style={s.saidFlame} />
          </View>
        </Middle>
        <T style={[s.c, { color: look.low }]}>Every day you live it, it gets truer. I will show it to you on hard days.</T>
      </Shell>
    );
  }

  return (
    <Shell
      look={look}
      level={level}
      flameOn
      pulse={pulse}
      inset={inset}
      scroll={scroll}
      fit={fit}
      bodyKey="ask"
      onClose={close}
      /* with words in the box, its Save beside it is the one Save; the low button is for a starter */
      foot={tidy(own) ? null : <Next label={had ? 'Save it' : 'Save my sentence'} off={!cur || cur === had} onPress={save} />}>
      <View style={s.head}>
        <T v="title" style={SHORT ? s.titleShort : s.title} accessibilityRole="header">
          Who are you becoming?
        </T>
      </View>
      {/* the box and its Save stay together near the top, since the keyboard covers the bottom while typing; it is the only Save while there are words in it */}
      <View style={{ gap: 6 }}>
        <T v="label">Write my own</T>
        <View style={s.ownRow}>
          <TextInput
            accessibilityLabel="Write my own"
            value={own}
            maxLength={BE_LEN}
            multiline
            blurOnSubmit
            returnKeyType="done"
            placeholder="I am someone who…"
            placeholderTextColor="rgba(27,31,75,0.5)"
            onChangeText={(v) => {
              setOwn(v.replace(/\n/g, ' '));
              if (v.trim()) setPick('');
            }}
            style={[s.input, { backgroundColor: PAPER, color: PAPER_INK }]}
          />
          {tidy(own) && tidy(own) !== had ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Save my sentence"
              onPress={save}
              style={({ pressed }) => [s.ownSave, { backgroundColor: look.c.accent, opacity: pressed ? 0.8 : 1 }]}>
              <Text style={[s.ownSaveT, { color: look.c.accentInk }]}>Save</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
      <Middle>{null}</Middle>
      <Say text="Say who you are, not what you avoid. I will show it to you on hard days." />
      <View style={{ gap: 8 }}>
        {OB_BE.map((x) => {
          const on = !tidy(own) && pick === x;
          return (
            <Answer
              key={x}
              sel={on}
              right={on}
              onPress={() => {
                setPick(x);
                setOwn('');
                setPulse((n) => n + 1);
                buzz('tap');
              }}
              style={s.opt}>
              <AnswerText right={on}>{x}</AnswerText>
            </Answer>
          );
        })}
      </View>
    </Shell>
  );
}

/** the flame beside what it says, low on the page above the answers (as on the setup's pages) */
function Say({ text }: { text: string }) {
  return (
    <View style={s.say}>
      <View style={{ marginRight: BESIDE - 8 }}>
        <Bubble text={text} tail="right" />
      </View>
      <FlameSlot size={BESIDE * 1.9} min={0} side style={StyleSheet.absoluteFill} />
    </View>
  );
}

const s = StyleSheet.create({
  head: { gap: 8, marginBottom: 8 },
  said: { alignSelf: 'stretch', gap: 4 },
  saidFlame: { flexGrow: 0 },
  title: { fontSize: 28, lineHeight: 34 },
  titleShort: { fontSize: 22, lineHeight: 28 },
  c: { textAlign: 'center', fontSize: 17, lineHeight: 24 },
  ownRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  input: {
    flex: 1,
    minHeight: 52,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 14,
    fontFamily: font.body,
    fontSize: 17,
    lineHeight: 23,
  },
  ownSave: { minHeight: 52, borderRadius: 16, paddingHorizontal: 18, justifyContent: 'center' },
  ownSaveT: { fontFamily: font.bodyBold, fontSize: 17 },
  say: { minHeight: BESIDE, justifyContent: 'center' },
  opt: { minHeight: 56 },
});
