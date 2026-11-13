/* Lighting the night (core ignite.ts; the owner, November 12, 2026: "compared to that our streak ignition is literal trash").
   The morning says last night was free, and the person lights their own flame. Built from Duolingo's streak ignition, beat by
   beat, with the flame as both the streak and the mascot:
   1. dark: the flame waits unlit, an ember glowing in its heart, and the count as it stood, in grey. "Swipe up to light it." The
      ember brightens under the finger as it goes up (a tick at each quarter), so the person fans it alight themselves. A tap on
      the words lights it too, and a screen reader lights it with the page's own action;
   2. the catch: a gold flare from the ember with a soft knock, then the fire bursts up (Heavy), shards of flame fly out;
   3. the number turns over: the grey one lifts away and the new one springs up in the fire's orange (Success);
   4. the flame speaks: its words type out in the cream bubble, about who the person is becoming;
   5. the night row: the six nights before come in, then last night's mark pops with a check and sparks (a knock each);
   6. only then the button.
   About three and a half seconds from the swipe to the button; a tap anywhere after the swipe brings everything in at once, for someone in a
   hurry. Reduce Motion: it lights with a fade and everything comes in together, one knock. Opened by the morning (app/morning.tsx)
   on Free of it, over the morning, and its button goes back to it. */
import { gameCompute, heroNumber, igniteLine, igniteRow, type NightMark } from '@daybook/core';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Reanimated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import { BigFlame, RELIGHT_CATCH } from '@/components/big-flame';
import { SHORT } from '@/components/fit';
import { Bubble } from '@/components/lesson-flame';
import { Text } from '@/components/text';
import { Button, Icon } from '@/components/ui';
import { buzz, knock } from '@/lib/feel';
import { useReducedMotion } from '@/lib/motion';
import { play } from '@/lib/sound';
import { useStore } from '@/lib/store';
import { font, nightInk } from '@/lib/theme';

const ORANGE = '#FF9A2E';
const GOLD = '#FFD25A';
const GREY = 'rgba(255,255,255,0.22)';
const SLIP = '#9C86F5';
/** how far up a swipe has to go to light it */
const PULL = 140;

/* when each beat lands, from the catch */
/* the burst lands as the fire catches: BigFlame waits RELIGHT_CATCH before it climbs */
const AT = { flare: 420, burst: 420 + RELIGHT_CATCH, turn: 1150, words: 1550, row: 2100, mark: 2700, button: 3300 };

export default function Ignite() {
  const p = useLocalSearchParams<{ from?: string }>();
  const { snap, tk, now } = useStore();
  const st = snap.settings;
  const win = useWindowDimensions();
  const inset = useSafeAreaInsets();
  const still = useReducedMotion();
  const level = useMemo(() => (st ? Math.max(1, gameCompute(snap.days, st, snap.reviews, tk).level.n) : 1), [snap, st, tk]);
  /* what it says is fixed when it opens */
  const [m] = useState(() => {
    const hn = st ? heroNumber(snap.days, st, tk, now) : null;
    const to = hn?.n ?? '';
    const from = p.from ?? to;
    return {
      from,
      to,
      unit: hn?.unit ?? '',
      line: st ? igniteLine(snap.days, st, tk) : '',
      row: st ? igniteRow(snap.days, st, tk) : [],
    };
  });
  /* 0 waiting, 1 lit and playing, 2 everything in */
  const [beat, setBeat] = useState(0);
  const [lit, setLit] = useState(false);
  const [typed, setTyped] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const at = (ms: number, f: () => void) => timers.current.push(setTimeout(f, ms));

  /* the ember's heat: the finger fans it (0 to 1), and it pulses on its own while it waits */
  const fan = useSharedValue(0);
  const wait = useSharedValue(0);
  const flare = useSharedValue(0);
  const turn = useSharedValue(0);
  const shards = useSharedValue(0);
  const words = useSharedValue(0);
  const row = useSharedValue(0);
  const mark = useSharedValue(0);
  const btn = useSharedValue(0);
  const pop = useSharedValue(1);
  useEffect(() => {
    if (still) return;
    wait.value = withRepeat(withSequence(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.sin) }), withTiming(0, { duration: 900 })), -1);
  }, [still, wait]);

  /* every beat at once: for Reduce Motion, and for a tap in a hurry */
  const all = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setLit(true);
    setBeat(2);
    setTyped(m.line.length);
    for (const v of [flare, turn, words, row, mark, btn]) v.value = withTiming(1, { duration: still ? 0 : 200 });
    shards.value = 0;
  };

  const light = () => {
    if (beat !== 0) return;
    setBeat(1);
    AccessibilityInfo.announceForAccessibility(m.to ? m.to + ' ' + m.unit + '. ' + m.line : m.line);
    if (still) {
      buzz('lit');
      all();
      return;
    }
    fan.value = withTiming(1, { duration: 120 });
    /* the catch: a gold flare from the ember */
    knock(Haptics.ImpactFeedbackStyle.Light);
    play('chime');
    flare.value = withSequence(withTiming(1, { duration: AT.flare, easing: Easing.in(Easing.quad) }), withTiming(0.55, { duration: 900 }));
    /* the fire starts to climb from the ember, and bursts as it catches: shards fly */
    at(AT.flare, () => setLit(true));
    at(AT.burst, () => {
      knock(Haptics.ImpactFeedbackStyle.Heavy);
      pop.value = withSequence(withTiming(0.9, { duration: 70 }), withSpring(1, { damping: 6, stiffness: 220 }));
      shards.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) });
    });
    /* the number turns over */
    at(AT.turn, () => {
      buzz('lit');
      turn.value = withSpring(1, { damping: 9, stiffness: 140 });
    });
    /* the flame speaks */
    at(AT.words, () => {
      words.value = withTiming(1, { duration: 260 });
      const n = m.line.length;
      const step = Math.max(14, Math.min(30, 900 / n));
      for (let i = 1; i <= n; i++) at(i * step, () => setTyped(i));
    });
    /* the nights before, then last night's mark */
    at(AT.row, () => {
      row.value = withTiming(1, { duration: 360, easing: Easing.out(Easing.cubic) });
      m.row.slice(0, -1).forEach((_, i) => at(60 * i, () => buzz('tick')));
    });
    at(AT.mark, () => {
      knock(Haptics.ImpactFeedbackStyle.Medium);
      mark.value = withSpring(1, { damping: 7, stiffness: 180 });
    });
    at(AT.button, () => {
      setBeat(2);
      btn.value = withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) });
    });
  };

  /* a swipe up anywhere fans it: a tick each quarter of the way, and it lights past the line or on a flick */
  const lastQ = useSharedValue(0);
  const pan = Gesture.Pan()
    .enabled(beat === 0)
    .activeOffsetY(-8)
    .onUpdate((e) => {
      fan.value = Math.min(1, Math.max(0, -e.translationY / PULL));
      const q = Math.floor(fan.value * 4);
      if (q > lastQ.value) {
        lastQ.value = q;
        runOnJS(buzz)('tick');
      }
    })
    .onEnd((e) => {
      if (-e.translationY > PULL || (e.velocityY < -700 && -e.translationY > 30)) runOnJS(light)();
      else {
        fan.value = withTiming(0, { duration: 260 });
        lastQ.value = 0;
      }
    });

  const close = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const big = Math.min(win.width - 64, win.height * (SHORT ? 0.32 : 0.36), 320);
  const heat = useAnimatedStyle(() => ({ opacity: interpolate(Math.max(fan.value, flare.value), [0, 1], [0.35 + 0.25 * wait.value, 1]) }));
  const glow = useAnimatedStyle(() => ({
    opacity: interpolate(flare.value + fan.value * 0.5, [0, 1], [0, 1], 'clamp'),
    transform: [{ scale: interpolate(flare.value, [0, 1], [0.5 + fan.value * 0.3, 1.25]) }],
  }));
  const popIn = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));
  const old = useAnimatedStyle(() => ({ opacity: 1 - turn.value, transform: [{ translateY: -36 * turn.value }] }));
  const neu = useAnimatedStyle(() => ({
    opacity: Math.min(1, turn.value * 1.6),
    transform: [{ translateY: 40 * (1 - turn.value) }, { scale: 0.7 + 0.3 * turn.value }],
  }));
  const unit = useAnimatedStyle(() => ({ opacity: turn.value }));
  const say = useAnimatedStyle(() => ({ opacity: words.value, transform: [{ translateY: 8 * (1 - words.value) }, { scale: 0.94 + 0.06 * words.value }] }));
  const hint = useAnimatedStyle(() => ({ opacity: 1 - Math.min(1, fan.value * 2) }));
  const nudge = useAnimatedStyle(() => ({ transform: [{ translateY: -6 * wait.value }] }));
  const rowIn = useAnimatedStyle(() => ({ opacity: row.value, transform: [{ translateY: 12 * (1 - row.value) }] }));
  const btnIn = useAnimatedStyle(() => ({ opacity: btn.value, transform: [{ translateY: 16 * (1 - btn.value) }] }));

  const changes = m.from !== m.to;
  return (
    <GestureDetector gesture={pan}>
      <View style={s.page}>
        <StatusBar style="light" />
        <LinearGradient colors={['#0E0B22', '#1B1438', '#2A1A3A']} style={StyleSheet.absoluteFill} />
        {/* a tap anywhere once it is lit brings the rest in at once */}
        <Pressable
          style={StyleSheet.absoluteFill}
          accessible={false}
          onPress={() => {
            if (beat === 1) all();
          }}
        />
        <View style={[s.top, { paddingTop: inset.top + 8 }]} pointerEvents="box-none">
          <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={close} style={s.x} hitSlop={8}>
            <Icon name="x" color={nightInk.ink} />
          </Pressable>
        </View>

        <View style={s.col} pointerEvents="box-none">
          <View style={s.bubble} pointerEvents="none">
            <Reanimated.View style={say}>{beat > 0 ? <Bubble text={m.line.slice(0, Math.max(1, typed))} /> : null}</Reanimated.View>
          </View>

          <View style={{ width: big, height: big }} pointerEvents="none">
            <Reanimated.View style={[{ position: 'absolute', left: -big * 0.5, top: -big * 0.4, width: big * 2, height: big * 2 }, glow]}>
              <Svg width={big * 2} height={big * 2} viewBox="0 0 100 100">
                <Defs>
                  <RadialGradient id="igGlow" cx="50" cy="50" r="50" gradientUnits="userSpaceOnUse">
                    <Stop offset="0" stopColor={GOLD} stopOpacity="0.9" />
                    <Stop offset="0.35" stopColor={ORANGE} stopOpacity="0.45" />
                    <Stop offset="1" stopColor={ORANGE} stopOpacity="0" />
                  </RadialGradient>
                </Defs>
                <Circle cx="50" cy="50" r="50" fill="url(#igGlow)" />
              </Svg>
            </Reanimated.View>
            <Reanimated.View style={[StyleSheet.absoluteFill, lit ? popIn : heat]}>
              <BigFlame
                level={level}
                size={big}
                low={lit ? 0 : 1}
                calm
                smoke="#1B1438"
                label={lit ? 'Your flame, lit' : 'Your flame, waiting to be lit'}
                heart={lit ? null : <Ember size={big * 0.34} wait={wait} fan={fan} />}
              />
            </Reanimated.View>
            {!still ? <Shards v={shards} size={big} /> : null}
          </View>

          <View style={s.count} pointerEvents="none" accessible accessibilityLabel={(beat ? m.to : m.from) + ' ' + m.unit}>
            <View style={s.numBox}>
              <Reanimated.Text style={[s.num, { color: changes ? GREY : beat ? ORANGE : GREY }, changes ? old : null]}>{m.from}</Reanimated.Text>
              {changes ? <Reanimated.Text style={[s.num, s.over, { color: ORANGE }, neu]}>{m.to}</Reanimated.Text> : null}
            </View>
            <Reanimated.Text style={[s.unit, unit]}>{m.unit}</Reanimated.Text>
          </View>
        </View>

        <View style={[s.dock, { paddingBottom: inset.bottom + (SHORT ? 12 : 20) }]} pointerEvents="box-none">
          <Reanimated.View style={[s.row, rowIn]} accessible accessibilityLabel={rowSay(m.row.map((r) => r.m))}>
            {m.row.map((r, i) => (
              <View key={r.k} style={s.day}>
                <Text style={[s.dayName, i === m.row.length - 1 && { color: ORANGE }]}>{r.d}</Text>
                {i === m.row.length - 1 ? <LastMark v={mark} /> : <Mark m={r.m} />}
              </View>
            ))}
          </Reanimated.View>
          <View style={s.foot}>
            {beat < 2 ? (
              <Reanimated.View style={[s.hintWrap, hint]}>
                <Pressable accessibilityRole="button" accessibilityLabel="Light your flame" onPress={light} style={s.hint} disabled={beat !== 0}>
                  <Reanimated.View style={nudge}>
                    <Icon name="up" size={22} color={GOLD} />
                  </Reanimated.View>
                  <Text style={s.hintText}>Swipe up to light it</Text>
                </Pressable>
              </Reanimated.View>
            ) : (
              <Reanimated.View style={btnIn}>
                <Button label="Keep going" kind="warm" onPress={close} />
              </Reanimated.View>
            )}
          </View>
        </View>
      </View>
    </GestureDetector>
  );
}

/** the ember in the heart of the unlit flame: it pulses while it waits, and grows hot as the finger fans it */
function Ember({ size, wait, fan }: { size: number; wait: SharedValue<number>; fan: SharedValue<number> }) {
  const st = useAnimatedStyle(() => ({
    opacity: 0.75 + 0.25 * Math.max(wait.value, fan.value),
    transform: [{ scale: 0.8 + 0.12 * wait.value + 0.7 * fan.value }],
  }));
  return (
    <Reanimated.View style={[{ width: size, height: size }, st]}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <RadialGradient id="igEmber" cx="50" cy="50" r="50" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#FFF6D0" stopOpacity="1" />
            <Stop offset="0.18" stopColor={GOLD} stopOpacity="1" />
            <Stop offset="0.42" stopColor={ORANGE} stopOpacity="0.55" />
            <Stop offset="1" stopColor={ORANGE} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx="50" cy="50" r="50" fill="url(#igEmber)" />
      </Svg>
    </Reanimated.View>
  );
}

const rowSay = (ms: NightMark[]) => {
  const free = ms.filter((x) => x === 'free').length;
  return `Last 7 nights: ${free} free`;
};

/** a night before last night, as it stands */
function Mark({ m }: { m: NightMark }) {
  if (m === 'free')
    return (
      <View style={[s.dot, { backgroundColor: ORANGE }]}>
        <Icon name="check" size={16} color="#3A1A00" />
      </View>
    );
  if (m === 'slip') return <View style={[s.dot, { backgroundColor: SLIP }]} />;
  if (m === 'untold') return <View style={[s.dot, s.untold]} />;
  return <View style={[s.dot, { backgroundColor: 'rgba(255,255,255,0.08)' }]} />;
}

/** last night's mark: hollow, then it pops orange with a check and a ring of sparks */
function LastMark({ v }: { v: SharedValue<number> }) {
  const fill = useAnimatedStyle(() => ({ opacity: Math.min(1, v.value * 2), transform: [{ scale: interpolate(v.value, [0, 1], [0.3, 1]) }] }));
  const sparks = useAnimatedStyle(() => ({ opacity: v.value > 0.05 ? Math.max(0, 1 - v.value) * 1.4 : 0 }));
  return (
    <View style={s.dotBox}>
      <View style={[s.dot, s.untold]} />
      <Reanimated.View style={[StyleSheet.absoluteFill, s.center, fill]}>
        <View style={[s.dot, { backgroundColor: ORANGE }]}>
          <Icon name="check" size={16} color="#3A1A00" />
        </View>
      </Reanimated.View>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Spark key={i} v={v} a={(i / 6) * Math.PI * 2 - Math.PI / 2} style={sparks} />
      ))}
    </View>
  );
}

function Spark({ v, a, style }: { v: SharedValue<number>; a: number; style: object }) {
  const st = useAnimatedStyle(() => {
    const r = 10 + 14 * Math.min(1, v.value);
    return { transform: [{ translateX: Math.cos(a) * r }, { translateY: Math.sin(a) * r }] };
  });
  return <Reanimated.View style={[s.spark, style, st]} />;
}

/* the shards of flame that fly out of the burst: a fixed spread, so it falls the same way every time */
const SHARDS = [
  { a: -90, d: 0.78, w: 14, h: 52 },
  { a: -62, d: 0.8, w: 12, h: 40 },
  { a: -118, d: 0.8, w: 12, h: 40 },
  { a: -35, d: 0.7, w: 10, h: 30 },
  { a: -145, d: 0.7, w: 10, h: 30 },
  { a: -5, d: 0.62, w: 9, h: 24 },
  { a: -175, d: 0.62, w: 9, h: 24 },
  { a: -76, d: 1.05, w: 8, h: 18 },
  { a: -104, d: 1.05, w: 8, h: 18 },
  { a: 25, d: 0.55, w: 8, h: 16 },
  { a: 155, d: 0.55, w: 8, h: 16 },
  { a: -50, d: 1.0, w: 7, h: 12 },
  { a: -130, d: 1.0, w: 7, h: 12 },
];
function Shards({ v, size }: { v: SharedValue<number>; size: number }) {
  return (
    <View style={[StyleSheet.absoluteFill, s.center]} pointerEvents="none">
      {SHARDS.map((sh, i) => (
        <Shard key={i} v={v} size={size} {...sh} />
      ))}
    </View>
  );
}
function Shard({ v, size, a, d, w, h }: { v: SharedValue<number>; size: number; a: number; d: number; w: number; h: number }) {
  const rad = (a * Math.PI) / 180;
  const st = useAnimatedStyle(() => {
    const t = v.value;
    const r = size * d * t;
    return {
      opacity: t <= 0 || t >= 1 ? 0 : t < 0.15 ? t / 0.15 : 1 - (t - 0.15) / 0.85,
      transform: [{ translateX: Math.cos(rad) * r }, { translateY: Math.sin(rad) * r + size * 0.08 }, { rotate: a + 90 + 'deg' }, { scale: 1 - 0.4 * t }],
    };
  });
  return <Reanimated.View style={[{ position: 'absolute', width: w, height: h, borderRadius: w, backgroundColor: i2c(a) }, st]} />;
}
const i2c = (a: number) => (Math.abs(a + 90) < 35 ? GOLD : ORANGE);

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#0E0B22' },
  center: { alignItems: 'center', justifyContent: 'center' },
  top: { position: 'absolute', left: 0, right: 0, top: 0, paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'flex-end', zIndex: 2 },
  x: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: nightInk.btn },
  col: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingTop: 56 },
  bubble: { minHeight: 92, maxWidth: 340, alignSelf: 'stretch', justifyContent: 'flex-end', marginBottom: 4 },
  count: { alignItems: 'center', marginTop: -8 },
  numBox: { height: SHORT ? 76 : 96, justifyContent: 'center', alignItems: 'center', minWidth: 120 },
  num: { fontFamily: font.display, fontSize: SHORT ? 72 : 92, lineHeight: SHORT ? 80 : 100, textAlign: 'center' },
  over: { position: 'absolute', left: 0, right: 0 },
  unit: { fontFamily: font.bodyBold, fontSize: 20, color: ORANGE, marginTop: -2 },
  dock: { paddingHorizontal: 16, gap: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignSelf: 'center', width: '100%', maxWidth: 340 },
  day: { alignItems: 'center', gap: 6, width: 40 },
  dayName: { fontFamily: font.bodySemi, fontSize: 13, color: nightInk.muted },
  dotBox: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  untold: { borderWidth: 2, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.3)' },
  spark: { position: 'absolute', width: 5, height: 5, borderRadius: 3, backgroundColor: GOLD },
  foot: { minHeight: 56, justifyContent: 'center' },
  hintWrap: { alignItems: 'center' },
  hint: { alignItems: 'center', gap: 6, minHeight: 56, justifyContent: 'center', paddingHorizontal: 24 },
  hintText: { fontFamily: font.bodyBold, fontSize: 17, color: nightInk.ink },
});
