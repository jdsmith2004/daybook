/* "You are free of it": graduation, the moment Daybook says who the person became, for good. The celebration the first time it is
   earned (opened from Today), and the award page after that (opened from Milestones). Fireworks and confetti, the flame in its
   cap at its biggest (the person's own form, as wide as the phone allows), then who they became, from their own record
   (miles.ts gradRecord: the urges ridden out, the comebacks, the days free of it), never "90 days complete". The page scrolls on a
   short phone, with Keep going pinned, so the flame never steps aside. Nothing about Today changes. Under it, quietly, the tip
   link (support.ts), when one is set. */
import { fmtDate, gameCompute, gradInfo, gradRecord, isSupporter, TIP_WORDS } from '@daybook/core';
import { Redirect } from 'expo-router';
import { useEffect } from 'react';
import { Animated, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Text } from '@/components/text';

import { Confetti } from '@/components/celebrate';
import { Fireworks, GradFlame } from '@/components/grad';
import { SceneFrame } from '@/components/scene';
import { openTip, TIP_URL } from '@/components/support';
import { Button, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { close } from '@/lib/nav';
import { pop, rise, useAppear } from '@/lib/motion';
import { play } from '@/lib/sound';
import { useStore } from '@/lib/store';
import { font, nightInk } from '@/lib/theme';

export default function Graduated() {
  const { snap, tk } = useStore();
  const st = snap.settings;
  const flame = useAppear(250, 700);
  const words = useAppear(900, 600);
  const facts = useAppear(1500, 600);
  const { width } = useWindowDimensions();
  /* the flame at its biggest: most of the width, never past what a tall phone holds above the words */
  const size = Math.round(Math.min(320, Math.max(220, (width - 32) * 0.78)));
  useEffect(() => {
    buzz('lit');
    play('chime', true);
  }, []);
  if (!st) return <Redirect href="/" />;
  const gi = gradInfo(snap.days, st, tk);
  if (!gi.at) return <Redirect href="/miles" />;
  const g = gameCompute(snap.days, st, snap.reviews, tk);
  const record = gradRecord(snap.days, st, snap.reviews, tk);
  const be = String(st.becoming || '').trim();
  const ink = nightInk.ink;
  return (
    <SceneFrame title="Graduation" sky="night" onClose={close} pin={<Button label="Keep going" onPress={close} />}>
      <Fireworks bursts={3} />
      <Confetti big={false} />
      <View style={s.body}>
        <Animated.View style={pop(flame, 0.5)}>
          <GradFlame level={g.level.n} size={size} />
        </Animated.View>
        <Animated.View style={[{ alignItems: 'center', gap: 6 }, rise(words, 14)]}>
          <Text style={[s.eye, { color: ink }]}>Graduated · {fmtDate(gi.at, { month: 'long', day: 'numeric', year: 'numeric' })}</Text>
          <Text style={[s.h, { color: ink }]} accessibilityRole="header">
            You are free of it.
          </Text>
          <Text style={[s.sub, { color: ink }]}>For good.</Text>
        </Animated.View>
        <Animated.View style={[{ alignSelf: 'stretch', alignItems: 'center', gap: 18 }, rise(facts, 14)]}>
          <View style={s.record}>
            {record.map((l) => (
              <Text key={l} style={[s.line, { color: ink }]}>
                {l}
              </Text>
            ))}
          </View>
          {be ? (
            <View style={[s.be, { backgroundColor: nightInk.btn }]}>
              <Text style={[s.beCap, { color: ink }]}>Who you set out to become</Text>
              <Text style={[s.beT, { color: ink }]}>{be}</Text>
            </View>
          ) : null}
          <T v="small" style={[s.p, { color: ink, opacity: 0.85 }]}>
            Your flame wears its cap from now on. Today stays just as it is, and a hard day later never takes this away.
          </T>
          {TIP_URL && !isSupporter(st) ? (
            <T v="small" style={[s.p, { color: ink, opacity: 0.85 }]}>
              {TIP_WORDS.grad}{' '}
              <Text accessibilityRole="link" onPress={openTip} style={{ fontFamily: font.bodySemi, color: ink, textDecorationLine: 'underline' }}>
                {TIP_WORDS.go}
              </Text>
            </T>
          ) : null}
        </Animated.View>
      </View>
    </SceneFrame>
  );
}

const s = StyleSheet.create({
  body: { alignItems: 'center', gap: 18, paddingTop: 8 },
  eye: { fontFamily: font.bodySemi, fontSize: 13, opacity: 0.85 },
  h: { fontFamily: font.display, fontSize: 40, lineHeight: 46, textAlign: 'center' },
  sub: { fontFamily: font.display, fontSize: 22, lineHeight: 28, textAlign: 'center', opacity: 0.9 },
  p: { textAlign: 'center', maxWidth: 360 },
  record: { gap: 8, alignItems: 'center', maxWidth: 360 },
  line: { fontFamily: font.bodyMedium, fontSize: 17, lineHeight: 24, textAlign: 'center' },
  be: { alignSelf: 'stretch', gap: 4, padding: 16, borderRadius: 20 },
  beCap: { fontFamily: font.bodySemi, fontSize: 13, opacity: 0.85, textAlign: 'center' },
  beT: { fontFamily: font.display, fontSize: 17, lineHeight: 24, textAlign: 'center' },
});
