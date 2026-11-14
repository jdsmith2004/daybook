/* The first week, looked back on (core week.ts): once, a week after the start. What the person did with their first seven
   days, big in the middle; who they said they are becoming; the next small step; Keep going at the bottom. Opening it
   marks it seen, so Today stops offering it. */
import { firstWeek, firstWeekDue, firstWeekSeen, gameCompute } from '@daybook/core';
import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';

import { FitArt } from '@/components/fit';
import { FlameMedallion } from '@/components/flame-medallion';
import { Dock, SceneFrame } from '@/components/scene';
import { MomentAsk, useTipMoment } from '@/components/support';
import { Button, T } from '@/components/ui';
import { NATIVE, SPRING, useReducedMotion } from '@/lib/motion';
import { buzz } from '@/lib/feel';
import { close } from '@/lib/nav';
import { useStore } from '@/lib/store';
import { font, useTheme } from '@/lib/theme';

export default function Week() {
  const c = useTheme();
  const { snap, tk, apply } = useStore();
  const st = snap.settings;
  /* finishing the first week is a moment of earned value: it can carry a short tip ask (core tipMoment) */
  const ask = useTipMoment('week');
  useEffect(() => {
    if (st && firstWeekDue(st, tk)) apply({ st: firstWeekSeen(st, tk) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (!st) return null;
  const w = firstWeek(snap.days, st, tk);
  const level = gameCompute(snap.days, st, snap.reviews, tk).level.n;
  return (
    <SceneFrame title="Your first week" sky="mint" onClose={close} pin={<Button label="Keep going" onPress={close} />}>
      <T v="title" style={s.c} accessibilityRole="header">
        {w.h}
      </T>
      <T style={s.c}>{w.line}</T>
      {/* the flame, big: this week is what fed it */}
      <View style={s.mid}>
        <FitArt min={0.55}>
          <Spring delay={120} from={0.6} beat="lit">
            <FlameMedallion level={level} size={196} />
          </Spring>
        </FitArt>
        {w.facts.length ? (
          <View style={s.facts}>
            {w.facts.map((f, i) => (
              <Spring
                key={f.one}
                delay={520 + i * 260}
                beat="land"
                style={[s.fact, { width: w.facts.length === 4 ? '22%' : '29%' }]}
                accessible
                accessibilityLabel={f.n + ' ' + (f.n === 1 ? f.one : f.many)}>
                <Count n={f.n} delay={520 + i * 260} style={[s.n, { color: c.ink }]} />
                <T v="small" tone="muted" style={s.c}>
                  {f.n === 1 ? f.one : f.many}
                </T>
              </Spring>
            ))}
          </View>
        ) : (
          <T tone="muted" style={s.c}>
            Each urge or check-in you log adds a line here.
          </T>
        )}
      </View>
      {w.be ? <T style={[s.c, { fontFamily: font.bodySemi }]}>{w.be}</T> : null}
      <Dock>
        <T style={s.c}>{w.next}</T>
        {ask ? <MomentAsk why="week" onGo={close} center /> : null}
      </Dock>
    </SceneFrame>
  );
}

/* Duolingo's stat reveal, in Daybook's night: the flame springs in first, then each thing the week held lands one after
   another with a small overshoot while its number counts up to what was done. Reduce Motion shows it all at once. */
/* The beats are felt as they land: the flame with a success, each fact with a soft knock. Reduce Motion: one success, at once. */
function Spring({
  delay,
  from = 0.4,
  beat,
  children,
  ...rest
}: { delay: number; from?: number; beat?: 'lit' | 'land'; children: React.ReactNode } & React.ComponentProps<typeof View>) {
  const reduce = useReducedMotion();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduce) {
      if (beat === 'lit') buzz('lit');
      return v.setValue(1);
    }
    const t = setTimeout(() => {
      if (beat) buzz(beat);
      Animated.spring(v, { toValue: 1, ...SPRING.fast, useNativeDriver: NATIVE }).start();
    }, delay);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce, delay, v]);
  const scale = v.interpolate({ inputRange: [0, 1], outputRange: [from, 1] });
  const opacity = v.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 1, 1], extrapolate: 'clamp' });
  return (
    <Animated.View {...rest} style={[rest.style, { opacity, transform: [{ scale }] }]}>
      {children}
    </Animated.View>
  );
}

function Count({ n, delay, style }: { n: number; delay: number; style: React.ComponentProps<typeof Text>['style'] }) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(reduce ? n : 0);
  useEffect(() => {
    if (reduce || n <= 1) return setShown(n);
    const steps = Math.min(n, 14);
    let k = 0;
    let tick: ReturnType<typeof setInterval> | undefined;
    const start = setTimeout(() => {
      tick = setInterval(() => {
        k += 1;
        setShown(Math.round((n * k) / steps));
        if (k >= steps && tick) clearInterval(tick);
      }, 520 / steps);
    }, delay);
    return () => {
      clearTimeout(start);
      if (tick) clearInterval(tick);
    };
  }, [n, delay, reduce]);
  return <Text style={style}>{shown}</Text>;
}

const s = StyleSheet.create({
  c: { textAlign: 'center' },
  mid: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingVertical: 8 },
  facts: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', columnGap: 8, rowGap: 8, alignSelf: 'stretch' },
  fact: { alignItems: 'center' },
  n: { fontFamily: font.display, fontSize: 28, lineHeight: 34 },
});
