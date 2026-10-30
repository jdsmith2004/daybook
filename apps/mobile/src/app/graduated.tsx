/* "You graduated": the celebration the first time graduation is earned (opened from Today), and the award page after that
   (opened from Milestones). Fireworks and confetti, the flame in its cap, big, the numbers that got the person here, and who they
   are becoming. The page scrolls on a short phone, with Keep going pinned, so the flame never steps aside. Nothing about Today changes. Under it, quietly, the tip link (support.ts), when one is set. */
import { fmtDate, gameCompute, GRAD_DAYS, GRAD_WINDOW, gradInfo, isSupporter, lessonsDone, TIP_WORDS, urEvidence } from '@daybook/core';
import { Redirect } from 'expo-router';
import { useEffect } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
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
  useEffect(() => {
    buzz('lit');
    play('chime', true);
  }, []);
  if (!st) return <Redirect href="/" />;
  const gi = gradInfo(snap.days, st, tk);
  if (!gi.at) return <Redirect href="/miles" />;
  const g = gameCompute(snap.days, st, snap.reviews, tk);
  const rode = urEvidence(snap.days).n;
  const lessons = lessonsDone(snap.days).size;
  const be = String(st.becoming || '').trim();
  const ink = nightInk.ink;
  const fact = (n: number | string, l: string) => (
    <View style={s.fact}>
      <Text style={[s.factN, { color: ink }]}>{n}</Text>
      <Text style={[s.factL, { color: ink }]}>{l}</Text>
    </View>
  );
  return (
    <SceneFrame title="Graduation" sky="night" onClose={close} pin={<Button label="Keep going" onPress={close} />}>
      <Fireworks bursts={6} />
      <Confetti big />
      <View style={s.body}>
        <Animated.View style={pop(flame, 0.5)}>
          <GradFlame level={g.level.n} size={220} />
        </Animated.View>
        <Animated.View style={[{ alignItems: 'center', gap: 8 }, rise(words, 14)]}>
          <Text style={[s.eye, { color: ink }]}>{fmtDate(gi.at, { month: 'long', day: 'numeric', year: 'numeric' })}</Text>
          <Text style={[s.h, { color: ink }]} accessibilityRole="header">
            You graduated!
          </Text>
          <T style={[s.p, { color: ink }]}>
            {GRAD_DAYS} days with no slip, within {GRAD_WINDOW}. You did the work, one day at a time, and it is yours for good.
          </T>
        </Animated.View>
        <Animated.View style={[{ alignSelf: 'stretch', gap: 12 }, rise(facts, 14)]}>
          <View style={s.facts}>
            {fact(gi.count, 'days with no slip, of the last ' + GRAD_WINDOW)}
            {rode ? fact(rode, rode === 1 ? 'urge ridden out' : 'urges ridden out') : null}
            {lessons ? fact(lessons, lessons === 1 ? 'lesson learned' : 'lessons learned') : null}
          </View>
          {be ? (
            <View style={[s.be, { backgroundColor: nightInk.btn }]}>
              <Text style={[s.beCap, { color: ink }]}>Who you are becoming</Text>
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
  h: { fontFamily: font.display, fontSize: 38, lineHeight: 42, textAlign: 'center' },
  p: { textAlign: 'center', maxWidth: 360 },
  facts: { flexDirection: 'row', gap: 8 },
  fact: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: 10, paddingHorizontal: 6, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)' },
  factN: { fontFamily: font.display, fontSize: 28 },
  factL: { fontFamily: font.bodyMedium, fontSize: 13, textAlign: 'center', opacity: 0.9 },
  be: { gap: 4, padding: 16, borderRadius: 20 },
  beCap: { fontFamily: font.bodySemi, fontSize: 13, opacity: 0.85 },
  beT: { fontFamily: font.display, fontSize: 17, lineHeight: 24 },
});
