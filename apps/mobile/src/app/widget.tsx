/* Add the widget (core WIDGET_ASK, widgetAskDue; the owner, November 12, 2026: like Duolingo's). Offered once, on a good day: the
   flame was fed, a few days in, never after a slip. It shows the widget itself, as it would sit on the Home Screen, so the person sees
   what they are getting: the flame big, its line, the week, and SOS. Then how to add it, one step at a time, low by the thumb. The phone
   says when it is on a screen (lib/flame-widget), and that earns the points, so Done only closes the page. */
import { gameCompute, widgetAsked, widgetAt, widgetSky, WIDGET_ASK } from '@daybook/core';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BigFlame } from '@/components/big-flame';
import { Dock, SceneFrame } from '@/components/scene';
import { Button, Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { close } from '@/lib/nav';
import { useStore } from '@/lib/store';
import { font, nightInk } from '@/lib/theme';

const WARM = '#FFB547';

export default function AddWidget() {
  const { snap, tk, now, apply } = useStore();
  const st = snap.settings;
  const level = st ? Math.max(1, gameCompute(snap.days, st, snap.reviews, tk).level.n) : 1;
  const w = widgetAt(snap.days, st, now);
  const [how, setHow] = useState(false);

  useEffect(() => {
    if (st && !st.widgetAsk) apply({ st: widgetAsked(st, tk) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SceneFrame title="" sky="night" onClose={() => close()}>
      <T v="title" style={[s.c, { color: nightInk.ink }]} accessibilityRole="header">
        {WIDGET_ASK.title}
      </T>
      <T style={[s.c, { marginTop: 8, color: nightInk.muted }]}>{WIDGET_ASK.say}</T>
      <View style={s.mid}>
        {/* the medium widget, as it sits on the Home Screen now */}
        <LinearGradient colors={widgetSky(w) as [string, string, ...string[]]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={s.card}>
          <View style={s.words}>
            <Text style={s.line} numberOfLines={2}>
              {w.line}
            </Text>
            <Text style={s.next} numberOfLines={2}>
              {w.next}
            </Text>
            <View style={s.week}>
              {w.week.split('').map((c, i) => (
                <View key={i} style={s.day}>
                  <Text style={[s.wd, i === 6 && { color: '#FFFFFF' }]}>{w.wd[i]}</Text>
                  <View
                    style={[
                      s.dot,
                      c === 'x' || c === 'f' ? { backgroundColor: WARM } : c === 't' ? s.ring : { backgroundColor: c === 'o' ? '#FFFFFF33' : '#FFFFFF14' },
                    ]}>
                    {c === 'x' || c === 'f' ? <Icon name="check" size={10} color="#FFFFFF" /> : null}
                  </View>
                </View>
              ))}
            </View>
          </View>
          <View style={s.flame}>
            <BigFlame level={level} size={150} noLand low={w.low} />
            <View style={s.sos}>
              <Text style={s.sosT}>SOS</Text>
            </View>
          </View>
        </LinearGradient>
        <T style={[s.c, s.small, { color: nightInk.muted }]}>{WIDGET_ASK.line}</T>
      </View>
      <Dock>
        {how ? (
          <View style={s.steps}>
            {WIDGET_ASK.steps.map((x, i) => (
              <View key={i} style={s.step}>
                <View style={s.n}>
                  <Text style={s.nT}>{i + 1}</Text>
                </View>
                <Text style={s.stepT}>{x}</Text>
              </View>
            ))}
          </View>
        ) : (
          <T style={[s.c, { color: WARM }]}>{WIDGET_ASK.pts}</T>
        )}
        <Button
          label={how ? WIDGET_ASK.done : WIDGET_ASK.btn}
          kind="warm"
          onPress={() => {
            buzz('lit');
            if (how) close();
            else setHow(true);
          }}
        />
      </Dock>
    </SceneFrame>
  );
}

const s = StyleSheet.create({
  c: { textAlign: 'center' },
  small: { marginTop: 12, fontSize: 13, lineHeight: 18 },
  mid: { flex: 1, justifyContent: 'center' },
  card: { flexDirection: 'row', borderRadius: 26, padding: 16, minHeight: 158, alignSelf: 'stretch' },
  words: { flex: 1, gap: 4 },
  line: { fontFamily: font.bodyBold, fontSize: 20, lineHeight: 24, color: '#FFFFFF' },
  next: { fontFamily: font.body, fontSize: 13, lineHeight: 17, color: WARM },
  week: { flexDirection: 'row', gap: 5, marginTop: 'auto' },
  day: { alignItems: 'center', gap: 3 },
  wd: { fontFamily: font.bodyBold, fontSize: 11, color: '#FFFFFFAA' },
  dot: { width: 17, height: 17, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  ring: { borderWidth: 2, borderColor: WARM, borderStyle: 'dashed' },
  flame: { width: 130, alignItems: 'center', justifyContent: 'flex-end', marginVertical: -12 },
  sos: { position: 'absolute', top: -4, right: -4, backgroundColor: '#FF6B4A', borderRadius: 99, paddingHorizontal: 9, paddingVertical: 4 },
  sosT: { fontFamily: font.bodyBold, fontSize: 12, color: '#FFFFFF' },
  steps: { gap: 10, marginBottom: 4 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  n: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#FFFFFF22', alignItems: 'center', justifyContent: 'center' },
  nT: { fontFamily: font.bodyBold, fontSize: 13, color: '#FFFFFF' },
  stepT: { flex: 1, fontFamily: font.body, fontSize: 15, lineHeight: 20, color: '#FFFFFF' },
});
