/* Read my plan: My plan as a short lesson, built from the lesson's own parts (components/lesson-parts.tsx). One thought on each
   card, on the lesson sky that turns from night to dawn as it goes, with the person's own flame gliding from card to card and
   saying a line in its bubble. Tonight's lines are sun cards, like a lesson's answer. What each card holds, and what the flame
   says, is core planRead. */
import { gameCompute, planRead, type PlanCard } from '@daybook/core';
import { router } from 'expo-router';
import { useLayoutEffect, useRef, useState } from 'react';
import { StyleSheet, View, type ScrollViewInstance } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FitArt, SHORT, useFitRoom } from '@/components/fit';
import { LessonArt } from '@/components/lesson-art';
import { Bubble, FlameSlot } from '@/components/lesson-flame';
import { Prog, Quiet, Shell } from '@/components/lesson-parts';
import { Next } from '@/components/lx';
import { T } from '@/components/ui';
import { SosVoice } from '@/components/voice-note';
import { buzz } from '@/lib/feel';
import { lessonLook, type Look } from '@/lib/lesson-look';
import { close, closeAll } from '@/lib/nav';
import { useStore } from '@/lib/store';
import { font, useTheme, type Tone } from '@/lib/theme';

export default function ReadPlan() {
  const { snap, tk } = useStore();
  const base = useTheme();
  const inset = useSafeAreaInsets();
  const scroll = useRef<ScrollViewInstance>(null);
  const fit = useFitRoom();
  const st = snap.settings;
  /* the cards are fixed when the page opens, so a reason does not change under the person's eyes */
  const [cards] = useState(() => (st ? planRead(snap.days, st, snap.reviews, tk) : []));
  const [i, setI] = useState(0);
  const [pulse, setPulse] = useState(0);
  useLayoutEffect(() => scroll.current?.scrollTo({ y: 0, animated: false }), [i]);
  if (!st || !cards.length) return null;
  const level = Math.max(1, gameCompute(snap.days, st, snap.reviews, tk).level.n);
  const card = cards[i];
  const last = i === cards.length - 1;
  const look = lessonLook(card.k === 'line' ? 'sun' : 'sky', last ? 1 : (i + 1) / cards.length, base.scheme);
  /* the flame grows a little as the plan is read, as it does through a lesson */
  const want = (SHORT ? 210 : 260) + (SHORT ? 40 : 70) * (i / Math.max(1, cards.length - 1));
  const next = () => {
    if (last) {
      buzz('save');
      closeAll();
      return;
    }
    if (i + 1 === cards.length - 1) setPulse((n) => n + 1);
    setI(i + 1);
  };
  return (
    <Shell
      look={look}
      level={level}
      flameOn
      pulse={pulse}
      onClose={close}
      onBack={i > 0 ? () => setI(i - 1) : undefined}
      prog={<Prog total={cards.length} i={i} look={look} label={'Card ' + (i + 1) + ' of ' + cards.length} />}
      inset={inset}
      scroll={scroll}
      fit={fit}
      bodyKey={String(i)}
      foot={
        card.k === 'person' ? (
          <View style={s.footCol}>
            <Next label="Next" onPress={next} />
            <Quiet label={'Text ' + card.name} onPress={() => router.push({ pathname: '/tool/[id]', params: { id: 'message' } })} />
          </View>
        ) : (
          <Next label={last ? 'Done' : 'Next'} onPress={next} noIcon={last} />
        )
      }>
      <Body card={card} look={look} st={st} want={want} />
    </Shell>
  );
}

/** the words of one card, the picture if it has one, the flame's line, and the room for the flame */
function Body({ card, look, st, want }: { card: PlanCard; look: Look; st: NonNullable<ReturnType<typeof useStore>['snap']['settings']>; want: number }) {
  const tone = look.art as Tone;
  const art = (a: Parameters<typeof LessonArt>[0]['art'], ic: string) => (
    <FitArt style={s.art} drop={0.5}>
      <LessonArt art={a} ic={ic} t={tone} st={st} />
    </FitArt>
  );
  const say = <Bubble text={card.say} style={{ marginTop: 16 }} />;
  if (card.k === 'becoming')
    return (
      <>
        <T style={s.big} accessibilityRole="header">
          {card.h}
        </T>
        {card.proof ? <T style={s.p}>{card.proof}</T> : null}
        {say}
        <FlameSlot size={want} />
      </>
    );
  if (card.k === 'line')
    return (
      <>
        <T style={s.h} accessibilityRole="header">
          If {card.when},
        </T>
        <T style={[s.p, { fontFamily: font.bodySemi }]}>{card.then}</T>
        {say}
        <FlameSlot size={Math.min(want, SHORT ? 180 : 220)} min={84} />
      </>
    );
  if (card.k === 'reason')
    return (
      <>
        <T style={s.h} accessibilityRole="header">
          {card.h}
        </T>
        {art(['icon', { ic: 'heart' }], 'heart')}
        {say}
        <FlameSlot size={Math.min(want, SHORT ? 160 : 200)} min={84} />
      </>
    );
  if (card.k === 'note')
    return (
      <>
        <T style={s.h} accessibilityRole="header">
          “{card.h}”
        </T>
        <SosVoice />
        {say}
        <FlameSlot size={Math.min(want, SHORT ? 180 : 230)} min={84} />
      </>
    );
  if (card.k === 'slip')
    return (
      <>
        <T style={s.h} accessibilityRole="header">
          If I slip
        </T>
        <View style={{ gap: 8, marginTop: 4 }}>
          {card.steps.map((x, j) => (
            <View key={j} style={[s.line, { backgroundColor: look.row }]}>
              <T style={[s.lineT, { color: look.rowInk }]}>
                {j + 1}. {x}
              </T>
            </View>
          ))}
        </View>
        {say}
        <FlameSlot size={Math.min(want, SHORT ? 150 : 190)} min={84} />
      </>
    );
  if (card.k === 'person')
    return (
      <>
        <T style={s.h} accessibilityRole="header">
          {card.name} has your back.
        </T>
        {art(['icon', { ic: 'chat' }], 'chat')}
        {say}
        <FlameSlot size={Math.min(want, SHORT ? 160 : 200)} min={84} />
      </>
    );
  return (
    <>
      <T style={s.big} accessibilityRole="header">
        {card.h}
      </T>
      {say}
      <FlameSlot size={want} />
    </>
  );
}

const s = StyleSheet.create({
  big: { fontFamily: font.displayBold, fontSize: 34, lineHeight: 40 },
  h: { fontFamily: font.display, fontSize: 28, lineHeight: 34 },
  p: { fontSize: 17, lineHeight: 24 },
  art: { alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  line: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 20 },
  lineT: { fontFamily: font.bodySemi, fontSize: 15, lineHeight: 20 },
  footCol: { flex: 1, gap: 4 },
});
