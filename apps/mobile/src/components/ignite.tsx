/* Lighting the flame (core ignite.ts; the owner, November 12 and 13, 2026: "compared to that our streak ignition is literal trash",
   "it's still way worse than duolingo"). Rebuilt beat by beat against Duolingo's streak ignition (the frames are in the side-session
   notes, duolingo/streak), with the flame as both the streak and the mascot, so the person lights *their* flame. Its own art: only the
   beats and the feel are taken.

   It plays at the start (the end of setup) and when the person comes back (core igniteWhy: the first free night after a slip or a gap,
   or a small goal kept). An ordinary free morning gets `StepUp` in place on the morning page instead.

   0. Dark and quiet: only the unlit flame, an ember pulsing in its heart with sparks drifting up from it, and one line. Nothing else
      on the screen, so the eye has one place to go.
   1. The person swipes up (anywhere): the ember heats under the finger, a tick each quarter. Past the line, the ember shoots up as a
      streak of light (Light knock).
   2. The flash: it opens into a gold glow with stars (Medium knock and the chime).
   3. The burst: the screen washes warm, petals of fire fly out across the whole screen, the flame catches and springs up, and the old
      count sits grey under it (Heavy knock).
   4. The number turns over: the grey one drops away and the new one lands big in the fire's orange (Success).
   5. The flame reacts: it hops and lands, with warm puffs around it (a knock up, a knock down).
   6. Its words type out in the bubble, a soft tick every few letters, and the line under the number comes in.
   7. The row: the days come in one by one (a tick each), then the day just kept pops big and lands with a check and sparks (Medium).
   8. The small goal, when there is one: its newest segment pops (gold and Success when the goal is kept).
   9. Only then the button: it comes in dim and brightens, so nobody taps past the moment.
   About four and a half seconds from the swipe to the button, something new every half second. A tap anywhere after the swipe brings
   everything in at once, for someone in a hurry. Reduce Motion: it lights with a fade, everything comes in together, one knock. */
import { type NightMark } from '@daybook/core';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
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
import Svg, { Circle, Defs, Ellipse, Path, RadialGradient, Stop } from 'react-native-svg';

import { BigFlame, bigLayers, RELIGHT_CATCH } from '@/components/big-flame';
import { SHORT } from '@/components/fit';
import { Bubble } from '@/components/lesson-flame';
import { Text } from '@/components/text';
import { Button, Icon } from '@/components/ui';
import { buzz, knock } from '@/lib/feel';
import { useReducedMotion } from '@/lib/motion';
import { play } from '@/lib/sound';
import { font, nightInk } from '@/lib/theme';

const ORANGE = '#FF9A2E';
const GOLD = '#FFD25A';
const CREAM = '#FFF3D6';
const GREY = 'rgba(255,255,255,0.24)';
const SLIP = '#9C86F5';
/** how far up a swipe has to go to light it */
const PULL = 140;

/* when each beat lands, from the swipe. The fire climbs RELIGHT_CATCH after `lit` (BigFlame), so it catches on the burst. */
const AT = {
  lit: 480 - RELIGHT_CATCH,
  flash: 260,
  burst: 480,
  turn: 1050,
  hop: 1500,
  words: 1700,
  unit: 1900,
  row: 2550,
  mark: 3150,
  goal: 3650,
  button: 3900,
};
/* with a goal, the button waits for it */
const GOAL_BUTTON = 4450;

export interface IgniteDay {
  k: string;
  /** the day's two letters */
  d: string;
  m: NightMark;
}

/** The lighting, as a whole screen. Shared: the comeback morning (app/ignite.tsx) and the end of setup (the first lighting, count 0
    to Day 1, with the coming week as the row: core igniteStartRow). */
export function Ignition({
  level,
  from,
  to,
  unit,
  line,
  row,
  pop = row.length - 1,
  hint = 'Swipe up to light your flame',
  button = 'Keep going',
  goal,
  onDone,
  onClose,
}: {
  level: number;
  /** the count before, shown grey as the fire catches ("" for none) */
  from: string;
  /** the count after; when it differs from `from` it turns over */
  to: string;
  /** under the number ("days in a row", "night", "is today") */
  unit: string;
  /** what the flame says once lit, typed out */
  line: string;
  /** the row of days under it; empty for none */
  row: IgniteDay[];
  /** which mark pops with a check (default the last) */
  pop?: number;
  hint?: string;
  button?: string;
  /** the small goal (core goalStep): 3 nights, then 7, then each week; its newest segment lights after the day's mark */
  goal?: { of: number; kept: boolean; segs: number; lit: number };
  onDone: () => void;
  /** the X; left out, it does the same as the button */
  onClose?: () => void;
}) {
  const win = useWindowDimensions();
  const inset = useSafeAreaInsets();
  const still = useReducedMotion();
  const m = { from, to, unit, line, row };
  /* 0 waiting, 1 lit and playing, 2 everything in */
  const [beat, setBeat] = useState(0);
  const [lit, setLit] = useState(false);
  const [typed, setTyped] = useState(0);
  const [hopN, setHopN] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const at = (ms: number, f: () => void) => timers.current.push(setTimeout(f, ms));

  const big = Math.min(win.width - 72, win.height * (SHORT ? 0.3 : 0.34), 300);
  /* where the flame's heart is in its box, for the ember and the burst */
  const heart = useMemo(() => {
    const b = bigLayers(level);
    return b ? { x: (b.layers.at.x + b.dx) * big, y: (b.layers.at.y + b.dy) * big } : { x: big / 2, y: big * 0.55 };
  }, [level, big]);

  /* the ember's heat: the finger fans it (0 to 1), and it pulses on its own while it waits */
  const fan = useSharedValue(0);
  const wait = useSharedValue(0);
  const drift = useSharedValue(0);
  const comet = useSharedValue(0);
  const flash = useSharedValue(0);
  const wash = useSharedValue(0);
  const burst = useSharedValue(0);
  const popV = useSharedValue(1);
  const oldV = useSharedValue(0);
  const turn = useSharedValue(0);
  const hop = useSharedValue(0);
  const squash = useSharedValue(0);
  const puffs = useSharedValue(0);
  const words = useSharedValue(0);
  const unitV = useSharedValue(0);
  const rowV = useSharedValue(0);
  const mark = useSharedValue(0);
  const goalV = useSharedValue(0);
  const segV = useSharedValue(0);
  const btn = useSharedValue(0);
  useEffect(() => {
    if (still) return;
    wait.value = withRepeat(withSequence(withTiming(1, { duration: 850, easing: Easing.inOut(Easing.sin) }), withTiming(0, { duration: 850 })), -1);
    drift.value = withRepeat(withTiming(1, { duration: 3200, easing: Easing.linear }), -1);
  }, [still, wait, drift]);

  /* every beat at once: for Reduce Motion, and for a tap in a hurry */
  const all = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setLit(true);
    setBeat(2);
    setTyped(m.line.length);
    for (const v of [turn, words, unitV, rowV, mark, goalV, segV, btn, oldV]) v.value = withTiming(1, { duration: still ? 0 : 200 });
    for (const v of [comet, flash, wash, burst, puffs, hop, squash]) v.value = 0;
    popV.value = 1;
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
    /* 1. the ember shoots up as a streak of light */
    fan.value = withTiming(1, { duration: 100 });
    knock(Haptics.ImpactFeedbackStyle.Light);
    comet.value = withTiming(1, { duration: AT.flash, easing: Easing.out(Easing.quad) });
    at(AT.lit, () => setLit(true));
    /* 2. it opens into a gold glow with stars */
    at(AT.flash, () => {
      knock(Haptics.ImpactFeedbackStyle.Medium);
      play('chime');
      flash.value = withSequence(withTiming(1, { duration: 200, easing: Easing.out(Easing.quad) }), withTiming(0, { duration: 700 }));
    });
    /* 3. the burst: a warm wash, petals across the screen, the flame springs up, the old count grey under it */
    at(AT.burst, () => {
      knock(Haptics.ImpactFeedbackStyle.Heavy);
      wash.value = withSequence(withTiming(1, { duration: 90 }), withTiming(0, { duration: 750, easing: Easing.out(Easing.quad) }));
      burst.value = withTiming(1, { duration: 1300, easing: Easing.out(Easing.cubic) });
      popV.value = withSequence(withTiming(0.62, { duration: 0 }), withSpring(1, { damping: 7, stiffness: 190 }));
      oldV.value = withSpring(1, { damping: 12, stiffness: 200 });
    });
    /* 4. the number turns over */
    at(AT.turn, () => {
      buzz('lit');
      turn.value = withSpring(1, { damping: 8, stiffness: 150 });
    });
    /* 5. the flame reacts: it hops, and lands with warm puffs */
    at(AT.hop, () => {
      knock(Haptics.ImpactFeedbackStyle.Light);
      setHopN((x) => x + 1);
      hop.value = withSequence(withTiming(1, { duration: 200, easing: Easing.out(Easing.quad) }), withTiming(0, { duration: 210, easing: Easing.in(Easing.quad) }));
      squash.value = withDelay(410, withSequence(withTiming(1, { duration: 70 }), withSpring(0, { damping: 6, stiffness: 260 })));
      puffs.value = withDelay(380, withTiming(1, { duration: 750, easing: Easing.out(Easing.cubic) }));
    });
    at(AT.hop + 410, () => knock(Haptics.ImpactFeedbackStyle.Medium));
    /* 6. the flame speaks */
    at(AT.words, () => {
      words.value = withSpring(1, { damping: 12, stiffness: 220 });
      const n = m.line.length;
      const step = Math.max(16, Math.min(32, 1000 / n));
      for (let i = 1; i <= n; i++)
        at(i * step, () => {
          setTyped(i);
          if (i % 5 === 0) buzz('tick');
        });
    });
    at(AT.unit, () => {
      unitV.value = withTiming(1, { duration: 380, easing: Easing.out(Easing.cubic) });
    });
    /* 7. the days come in one by one, then the day just kept pops */
    at(AT.row, () => {
      rowV.value = withTiming(1, { duration: 70 * m.row.length + 300, easing: Easing.linear });
      m.row.forEach((_, i) => at(70 * i, () => buzz('tick')));
    });
    at(AT.mark, () => {
      knock(Haptics.ImpactFeedbackStyle.Medium);
      mark.value = withTiming(1, { duration: 900, easing: Easing.linear });
    });
    at(AT.mark + 260, () => buzz('lit'));
    /* 8. the small goal */
    if (goal) {
      at(AT.goal, () => {
        goalV.value = withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) });
      });
      at(AT.goal + 400, () => {
        knock(goal.kept ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Light);
        if (goal.kept) buzz('lit');
        segV.value = withSpring(1, { damping: 8, stiffness: 200 });
      });
    }
    /* 9. the button, last: it comes in dim, then brightens */
    at(goal ? GOAL_BUTTON : AT.button, () => {
      setBeat(2);
      buzz('tick');
      btn.value = withSequence(withTiming(0.45, { duration: 220 }), withDelay(260, withTiming(1, { duration: 260 })));
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

  const close = onClose ?? onDone;

  const heat = useAnimatedStyle(() => ({ opacity: interpolate(fan.value, [0, 1], [0.55 + 0.2 * wait.value, 1]) }));
  const popIn = useAnimatedStyle(() => ({ transform: [{ scale: popV.value }] }));
  const hopIn = useAnimatedStyle(() => ({
    transformOrigin: ['50%', '100%', 0],
    transform: [{ translateY: -big * 0.09 * hop.value }, { scaleY: 1 - 0.1 * squash.value }, { scaleX: 1 + 0.08 * squash.value }],
  }));
  const washIn = useAnimatedStyle(() => ({ opacity: 0.5 * wash.value }));
  const oldIn = useAnimatedStyle(() => ({
    opacity: oldV.value * Math.max(0, 1 - turn.value * 2.2),
    transform: [{ translateY: 46 * Math.min(1, turn.value) }, { scale: (0.8 + 0.2 * oldV.value) * (1 - 0.35 * Math.min(1, turn.value)) }],
  }));
  const neu = useAnimatedStyle(() => ({
    opacity: Math.min(1, turn.value * 2),
    transform: [{ translateY: -24 * (1 - turn.value) }, { scale: 1.7 - 0.7 * turn.value }],
  }));
  const unitIn = useAnimatedStyle(() => ({ opacity: unitV.value, transform: [{ translateY: 10 * (1 - unitV.value) }] }));
  const say = useAnimatedStyle(() => ({
    opacity: Math.min(1, words.value * 1.5),
    transform: [{ translateY: 10 * (1 - words.value) }, { scale: 0.85 + 0.15 * words.value }],
  }));
  const hintIn = useAnimatedStyle(() => ({ opacity: 1 - Math.min(1, fan.value * 1.6) }));
  const nudge = useAnimatedStyle(() => ({ transform: [{ translateY: -7 * wait.value }] }));
  const btnIn = useAnimatedStyle(() => ({ opacity: btn.value, transform: [{ translateY: 14 * (1 - Math.min(1, btn.value * 2)) }] }));
  /* the whole middle sits a little lower while it waits, so the lone flame is in the middle of the screen, and rises as the row comes */
  const LIFT = SHORT ? 36 : 56;
  const lift = useAnimatedStyle(() => ({ transform: [{ translateY: LIFT * (1 - Math.min(1, rowV.value * 3)) }] }));

  const changes = m.from !== m.to;
  const showOld = changes && m.from !== '';
  return (
    <GestureDetector gesture={pan}>
      <View style={s.page}>
        <StatusBar style="light" />
        <LinearGradient colors={['#100C24', '#191233', '#231734']} style={StyleSheet.absoluteFill} />
        <Reanimated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#8A5A18' }, washIn]} pointerEvents="none" />
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

        <Reanimated.View style={[s.col, lift]} pointerEvents="box-none">
          <View style={s.bubble} pointerEvents="none">
            <Reanimated.View style={[say, { transformOrigin: ['50%', '100%', 0] }]}>
              {beat > 0 ? <Bubble text={m.line.slice(0, Math.max(1, typed))} /> : null}
            </Reanimated.View>
          </View>

          <View style={{ width: big, height: big }} pointerEvents="none">
            {!still ? <Puffs v={puffs} size={big} /> : null}
            <Reanimated.View style={[StyleSheet.absoluteFill, hopIn]}>
              <Reanimated.View style={[StyleSheet.absoluteFill, lit ? popIn : heat]}>
                <BigFlame
                  level={level}
                  size={big}
                  low={lit ? 0 : 1}
                  calm
                  pulse={hopN}
                  smoke="#191233"
                  label={lit ? 'Your flame, lit' : 'Your flame, waiting to be lit'}
                  heart={lit ? null : <Ember size={big * 0.3} wait={wait} fan={fan} />}
                />
              </Reanimated.View>
            </Reanimated.View>
            {!still && !lit ? <Motes v={drift} x={heart.x} y={heart.y} size={big} fade={fan} /> : null}
            {!still ? <Comet v={comet} x={heart.x} y={heart.y} size={big} /> : null}
            {!still ? <Flash v={flash} x={heart.x} y={heart.y - big * 0.28} size={big} /> : null}
            {!still ? <Burst v={burst} x={heart.x} y={heart.y} reach={Math.max(win.width, win.height * 0.7)} /> : null}
          </View>

          <View style={s.count} pointerEvents="none" accessible accessibilityLabel={(beat ? m.to : m.from) + ' ' + m.unit}>
            {beat === 0 ? (
              <Reanimated.View style={[s.hintWrap, hintIn]} pointerEvents="box-none">
                <Pressable accessibilityRole="button" accessibilityLabel="Light your flame" onPress={light} style={s.hint}>
                  <Reanimated.View style={nudge}>
                    <Icon name="up" size={22} color={GOLD} />
                  </Reanimated.View>
                  <Text style={s.hintText}>{hint}</Text>
                </Pressable>
              </Reanimated.View>
            ) : (
              <>
                <View style={s.numBox}>
                  {showOld ? (
                    <Reanimated.Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.4} style={[s.num, { color: GREY }, oldIn]}>
                      {m.from}
                    </Reanimated.Text>
                  ) : null}
                  <Reanimated.Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.4} style={[s.num, s.over, { color: ORANGE }, neu]}>
                    {m.to}
                  </Reanimated.Text>
                </View>
                <Reanimated.Text style={[s.unit, unitIn]}>{m.unit}</Reanimated.Text>
              </>
            )}
          </View>
        </Reanimated.View>

        <View style={[s.dock, { paddingBottom: inset.bottom + (SHORT ? 12 : 20) }]} pointerEvents="box-none">
          {m.row.length ? (
            <View style={s.row} accessible accessibilityLabel={rowSay(m.row.map((r) => r.m))}>
              {m.row.map((r, i) => (
                <Day key={r.k} r={r} i={i} n={m.row.length} on={i === pop} v={rowV} mark={mark} />
              ))}
            </View>
          ) : null}
          {goal ? <Goal goal={goal} v={goalV} seg={segV} /> : null}
          <View style={s.foot}>
            {beat === 2 ? (
              <Reanimated.View style={btnIn}>
                <Button label={button} kind="warm" onPress={onDone} />
              </Reanimated.View>
            ) : null}
          </View>
        </View>
      </View>
    </GestureDetector>
  );
}

/** one day of the row: it comes in on its turn; the day just kept pops big, lands, and throws sparks */
function Day({ r, i, n, on, v, mark }: { r: IgniteDay; i: number; n: number; on: boolean; v: SharedValue<number>; mark: SharedValue<number> }) {
  const span = 70 * n + 300;
  const a = (70 * i) / span;
  const b = (70 * i + 260) / span;
  const inSt = useAnimatedStyle(() => {
    const t = interpolate(v.value, [a, b], [0, 1], 'clamp');
    return { opacity: t, transform: [{ translateY: 10 * (1 - t) }, { scale: 0.7 + 0.3 * t }] };
  });
  return (
    <Reanimated.View style={[s.day, inSt]}>
      <Text style={[s.dayName, on && { color: ORANGE }]}>{r.d}</Text>
      {on ? <LastMark v={mark} /> : <Mark m={r.m} />}
    </Reanimated.View>
  );
}

/** the small goal: "Goal: 3 free nights", how far along, and a bar of segments whose newest one pops in (gold when the goal is kept) */
function Goal({ goal, v, seg }: { goal: { of: number; kept: boolean; segs: number; lit: number }; v: SharedValue<number>; seg: SharedValue<number> }) {
  const boxIn = useAnimatedStyle(() => ({ opacity: v.value, transform: [{ translateY: 10 * (1 - v.value) }] }));
  const newIn = useAnimatedStyle(() => ({
    opacity: Math.min(1, seg.value * 2),
    transform: [{ scaleY: 0.4 + 0.6 * seg.value }, { scaleX: 0.7 + 0.3 * seg.value }],
  }));
  /* up to a week it counts nights; after that, weeks (the bar is the week being built) */
  const what = goal.of < 7 ? goal.of + ' free nights' : goal.of === 7 ? 'a whole week free' : goal.of / 7 + ' weeks free';
  const say = (goal.kept ? 'Goal kept: ' : 'Goal: ') + what;
  const left = goal.of - (goal.lit + goal.of - goal.segs);
  return (
    <Reanimated.View style={[s.goal, boxIn]} accessible accessibilityLabel={say + (goal.kept ? '' : ', ' + left + ' to go')}>
      <View style={s.goalHead}>
        <Text style={[s.goalText, goal.kept && { color: GOLD }]}>{say}</Text>
        {!goal.kept ? <Text style={s.goalLeft}>{left === 1 ? '1 to go' : left + ' to go'}</Text> : null}
      </View>
      <View style={s.segs}>
        {Array.from({ length: goal.segs }, (_, i) => (
          <View key={i} style={s.seg}>
            {i < goal.lit - 1 ? <View style={[s.segOn, { backgroundColor: goal.kept ? GOLD : ORANGE }]} /> : null}
            {i === goal.lit - 1 ? <Reanimated.View style={[s.segOn, { backgroundColor: goal.kept ? GOLD : ORANGE }, newIn]} /> : null}
          </View>
        ))}
      </View>
    </Reanimated.View>
  );
}

/** the ember in the heart of the unlit flame: it pulses while it waits, grows hot as the finger fans it */
function Ember({ size, wait, fan }: { size: number; wait: SharedValue<number>; fan: SharedValue<number> }) {
  const st = useAnimatedStyle(() => ({
    opacity: fan.value >= 1 ? 0 : 0.8 + 0.2 * Math.max(wait.value, fan.value),
    transform: [{ scale: 0.82 + 0.16 * wait.value + 0.55 * fan.value }],
  }));
  return (
    <Reanimated.View style={[{ width: size, height: size }, st]}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <RadialGradient id="igEmber" cx="50" cy="50" r="50" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#FFFBEA" stopOpacity="1" />
            <Stop offset="0.2" stopColor={GOLD} stopOpacity="1" />
            <Stop offset="0.45" stopColor={ORANGE} stopOpacity="0.5" />
            <Stop offset="1" stopColor={ORANGE} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx="50" cy="50" r="50" fill="url(#igEmber)" />
      </Svg>
    </Reanimated.View>
  );
}

/* sparks drifting up from the waiting ember: [x offset as a share of the size, how far up, phase, dot size, gold or white] */
const MOTES: [number, number, number, number, boolean][] = [
  [-0.18, 0.55, 0, 4, true],
  [0.14, 0.6, 0.22, 3, false],
  [-0.05, 0.7, 0.45, 3, true],
  [0.24, 0.5, 0.63, 4, true],
  [-0.26, 0.45, 0.8, 3, false],
];
function Motes({ v, x, y, size, fade }: { v: SharedValue<number>; x: number; y: number; size: number; fade: SharedValue<number> }) {
  return (
    <>
      {MOTES.map((mo, i) => (
        <Mote key={i} v={v} x={x} y={y} size={size} fade={fade} mo={mo} />
      ))}
    </>
  );
}
function Mote({
  v,
  x,
  y,
  size,
  fade,
  mo,
}: {
  v: SharedValue<number>;
  x: number;
  y: number;
  size: number;
  fade: SharedValue<number>;
  mo: [number, number, number, number, boolean];
}) {
  const [dx, up, ph, d, gold] = mo;
  const st = useAnimatedStyle(() => {
    const t = (v.value + ph) % 1;
    return {
      opacity: Math.sin(t * Math.PI) * (1 - fade.value),
      transform: [{ translateX: x + dx * size * (0.6 + 0.4 * t) - d / 2 }, { translateY: y - up * size * t - d / 2 }],
    };
  });
  return <Reanimated.View style={[{ position: 'absolute', left: 0, top: 0, width: d, height: d, borderRadius: d, backgroundColor: gold ? GOLD : CREAM }, st]} />;
}

/** the ember shooting up out of the flame as a streak of light */
function Comet({ v, x, y, size }: { v: SharedValue<number>; x: number; y: number; size: number }) {
  const w = size * 0.13;
  const h = size * 0.5;
  const st = useAnimatedStyle(() => ({
    opacity: v.value <= 0 || v.value >= 1 ? 0 : 1,
    transform: [{ translateX: x - w / 2 }, { translateY: y - h / 2 - size * 0.28 * v.value }, { scaleY: 0.25 + 0.9 * v.value }, { scaleX: 1 - 0.3 * v.value }],
  }));
  return (
    <Reanimated.View style={[{ position: 'absolute', left: 0, top: 0, width: w, height: h }, st]}>
      <Svg width={w} height={h} viewBox="0 0 20 80">
        <Defs>
          <RadialGradient id="igComet" cx="10" cy="44" rx="10" ry="40" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity="1" />
            <Stop offset="0.45" stopColor={GOLD} stopOpacity="1" />
            <Stop offset="1" stopColor={ORANGE} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Ellipse cx="10" cy="40" rx="9" ry="39" fill="url(#igComet)" />
      </Svg>
    </Reanimated.View>
  );
}

/* the stars of the flash: [angle, distance as a share of the size, size] */
const STARS: [number, number, number][] = [
  [-150, 0.16, 16],
  [-60, 0.2, 20],
  [10, 0.14, 13],
  [100, 0.18, 17],
  [190, 0.22, 12],
  [-100, 0.08, 11],
];
const STAR = 'M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0Z';
/** the gold glow the ember opens into, with stars */
function Flash({ v, x, y, size }: { v: SharedValue<number>; x: number; y: number; size: number }) {
  const g = size * 1.3;
  const glow = useAnimatedStyle(() => ({
    opacity: v.value,
    transform: [{ translateX: x - g / 2 }, { translateY: y - g / 2 }, { scale: 0.4 + 0.6 * v.value }],
  }));
  return (
    <>
      <Reanimated.View style={[{ position: 'absolute', left: 0, top: 0, width: g, height: g }, glow]}>
        <Svg width={g} height={g} viewBox="0 0 100 100">
          <Defs>
            <RadialGradient id="igGlow" cx="50" cy="50" r="50" gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor="#FFF6D0" stopOpacity="1" />
              <Stop offset="0.25" stopColor={GOLD} stopOpacity="0.8" />
              <Stop offset="0.6" stopColor={ORANGE} stopOpacity="0.25" />
              <Stop offset="1" stopColor={ORANGE} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx="50" cy="50" r="50" fill="url(#igGlow)" />
        </Svg>
      </Reanimated.View>
      {STARS.map(([a, d, z], i) => (
        <FlashStar key={i} v={v} x={x} y={y} a={a} d={d * size} z={z} />
      ))}
    </>
  );
}
function FlashStar({ v, x, y, a, d, z }: { v: SharedValue<number>; x: number; y: number; a: number; d: number; z: number }) {
  const rad = (a * Math.PI) / 180;
  const st = useAnimatedStyle(() => ({
    opacity: v.value,
    transform: [
      { translateX: x + Math.cos(rad) * d * (0.6 + 0.4 * v.value) - z / 2 },
      { translateY: y + Math.sin(rad) * d * (0.6 + 0.4 * v.value) - z / 2 },
      { scale: v.value },
      { rotate: 45 * v.value + 'deg' },
    ],
  }));
  return (
    <Reanimated.View style={[{ position: 'absolute', left: 0, top: 0, width: z, height: z }, st]}>
      <Svg width={z} height={z} viewBox="0 0 24 24">
        <Path d={STAR} fill="#FFFFFF" />
      </Svg>
    </Reanimated.View>
  );
}

/* the burst: petals of fire, bits and stars thrown across the whole screen. A fixed spread, so it falls the same way every time.
   [angle, distance as a share of the reach, width, length, spin in degrees, kind: 0 petal, 1 bit, 2 star] */
const BURST: [number, number, number, number, number, 0 | 1 | 2][] = [
  [-90, 0.5, 26, 74, 40, 0],
  [-55, 0.58, 22, 64, -70, 0],
  [-125, 0.6, 24, 70, 60, 0],
  [-20, 0.5, 20, 58, -90, 0],
  [-160, 0.52, 20, 56, 80, 0],
  [20, 0.42, 18, 50, 110, 0],
  [160, 0.44, 18, 52, -110, 0],
  [70, 0.4, 16, 48, 70, 0],
  [115, 0.42, 16, 46, -60, 0],
  [-72, 0.75, 9, 9, 180, 1],
  [-108, 0.72, 8, 8, -160, 1],
  [-38, 0.66, 8, 8, 200, 1],
  [-142, 0.64, 9, 9, -200, 1],
  [5, 0.6, 7, 7, 150, 1],
  [175, 0.6, 7, 7, -150, 1],
  [45, 0.52, 8, 8, 120, 1],
  [135, 0.5, 8, 8, -120, 1],
  [-82, 0.36, 18, 18, 90, 2],
  [-30, 0.3, 14, 14, -90, 2],
  [-150, 0.32, 15, 15, 90, 2],
  [60, 0.3, 13, 13, -90, 2],
];
const PETAL = 'M10 0 C19 18 18 44 10 60 C3 44 0 20 10 0Z';
function Burst({ v, x, y, reach }: { v: SharedValue<number>; x: number; y: number; reach: number }) {
  return (
    <>
      {BURST.map((b, i) => (
        <Piece key={i} v={v} x={x} y={y} reach={reach} b={b} i={i} />
      ))}
    </>
  );
}
function Piece({ v, x, y, reach, b, i }: { v: SharedValue<number>; x: number; y: number; reach: number; b: (typeof BURST)[number]; i: number }) {
  const [a, d, w, h, spin, kind] = b;
  const rad = (a * Math.PI) / 180;
  const st = useAnimatedStyle(() => {
    const t = v.value;
    const r = reach * d * t;
    /* a little fall at the end, as if the petals had weight */
    const fall = reach * 0.12 * t * t;
    return {
      opacity: t <= 0 || t >= 1 ? 0 : t < 0.08 ? t / 0.08 : 1 - Math.max(0, (t - 0.45) / 0.55),
      transform: [
        { translateX: x + Math.cos(rad) * r - w / 2 },
        { translateY: y + Math.sin(rad) * r + fall - h / 2 },
        { rotate: a + 90 + spin * t + 'deg' },
        { scale: kind === 2 ? Math.sin(Math.min(1, t * 1.6) * Math.PI) : 1 - 0.3 * t },
      ],
    };
  });
  const color = kind === 2 ? '#FFFFFF' : i % 3 === 0 ? GOLD : ORANGE;
  return (
    <Reanimated.View style={[{ position: 'absolute', left: 0, top: 0, width: w, height: h }, st]}>
      {kind === 0 ? (
        <Svg width={w} height={h} viewBox="0 0 20 60" preserveAspectRatio="none">
          <Path d={PETAL} fill={color} />
        </Svg>
      ) : kind === 1 ? (
        <View style={{ width: w, height: h, borderRadius: 2, backgroundColor: color }} />
      ) : (
        <Svg width={w} height={h} viewBox="0 0 24 24">
          <Path d={STAR} fill={color} />
        </Svg>
      )}
    </Reanimated.View>
  );
}

/* the warm puffs the flame lands in: [angle, distance as a share of the size, size as a share] */
const PUFFS: [number, number, number][] = [
  [180, 0.36, 0.2],
  [0, 0.36, 0.2],
  [150, 0.3, 0.15],
  [30, 0.3, 0.15],
  [205, 0.4, 0.12],
  [-25, 0.4, 0.12],
  [120, 0.24, 0.13],
  [60, 0.24, 0.13],
];
function Puffs({ v, size }: { v: SharedValue<number>; size: number }) {
  return (
    <>
      {PUFFS.map((p, i) => (
        <Puff key={i} v={v} size={size} p={p} />
      ))}
    </>
  );
}
function Puff({ v, size, p }: { v: SharedValue<number>; size: number; p: [number, number, number] }) {
  const [a, d, z] = p;
  const rad = (a * Math.PI) / 180;
  const w = size * z;
  const st = useAnimatedStyle(() => {
    const t = v.value;
    return {
      opacity: t <= 0 || t >= 1 ? 0 : 0.95 * (1 - t),
      transform: [
        { translateX: size / 2 + Math.cos(rad) * size * d * (0.55 + 0.45 * t) - w / 2 },
        { translateY: size * 0.86 + Math.sin(rad) * size * d * 0.5 * (0.55 + 0.45 * t) - w / 2 - size * 0.06 * t },
        { scale: 0.4 + 0.9 * t },
      ],
    };
  });
  return <Reanimated.View style={[{ position: 'absolute', left: 0, top: 0, width: w, height: w, borderRadius: w, backgroundColor: CREAM }, st]} />;
}

const rowSay = (ms: NightMark[]) => {
  const free = ms.filter((x) => x === 'free').length;
  return `Last 7 nights: ${free} free`;
};

/** a day before the one just kept, as it stands */
function Mark({ m }: { m: NightMark }) {
  if (m === 'free')
    return (
      <View style={[s.dot, { backgroundColor: ORANGE }]}>
        <Icon name="check" size={16} color="#3A1A00" />
      </View>
    );
  if (m === 'slip') return <View style={[s.dot, { backgroundColor: SLIP }]} />;
  if (m === 'untold') return <View style={[s.dot, s.untold]} />;
  if (m === 'ahead') return <View style={[s.dot, { backgroundColor: 'rgba(255,255,255,0.14)' }]} />;
  return <View style={[s.dot, { backgroundColor: 'rgba(255,255,255,0.08)' }]} />;
}

/** the day just kept: hollow, then it pops big in orange, lands with a check, and throws sparks */
function LastMark({ v }: { v: SharedValue<number> }) {
  /* 0 to 0.22 it swells past its size, to 0.45 it lands; the check comes in as it lands; the sparks fly from 0.3 */
  const fill = useAnimatedStyle(() => ({
    opacity: interpolate(v.value, [0, 0.08], [0, 1], 'clamp'),
    transform: [{ scale: interpolate(v.value, [0, 0.22, 0.34, 0.45], [0.2, 1.65, 0.92, 1], 'clamp') }],
  }));
  const check = useAnimatedStyle(() => ({
    opacity: interpolate(v.value, [0.25, 0.4], [0, 1], 'clamp'),
    transform: [{ scale: interpolate(v.value, [0.25, 0.4, 0.5], [0.4, 1.2, 1], 'clamp') }],
  }));
  return (
    <View style={s.dotBox}>
      <View style={[s.dot, s.untold]} />
      <Reanimated.View style={[StyleSheet.absoluteFill, s.center, fill]}>
        <View style={[s.dot, { backgroundColor: ORANGE }]} />
      </Reanimated.View>
      <Reanimated.View style={[StyleSheet.absoluteFill, s.center, check]}>
        <Icon name="check" size={16} color="#3A1A00" />
      </Reanimated.View>
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <Spark key={i} v={v} a={(i / 8) * Math.PI * 2 - Math.PI / 2 + (i % 2) * 0.2} long={i % 2 === 0} />
      ))}
    </View>
  );
}

function Spark({ v, a, long }: { v: SharedValue<number>; a: number; long: boolean }) {
  const st = useAnimatedStyle(() => {
    const t = interpolate(v.value, [0.3, 0.85], [0, 1], 'clamp');
    const r = 16 + (long ? 22 : 14) * t;
    return {
      opacity: t <= 0 || t >= 1 ? 0 : 1 - t * t,
      transform: [{ translateX: Math.cos(a) * r }, { translateY: Math.sin(a) * r }, { rotate: (a * 180) / Math.PI + 90 + 'deg' }, { scaleY: 1 - 0.5 * t }],
    };
  });
  return <Reanimated.View style={[s.spark, { height: long ? 10 : 7, backgroundColor: long ? GOLD : ORANGE }, st]} />;
}

/** The quick step for an ordinary free morning (core igniteWhy null), in place on the morning page and never a page over it: the
    count turns over under the flame, with a knock. Its partner is the flame's own bloom (FlameMedallion's pulse). Reduce Motion: the
    new count, still. */
export function StepUp({ from, to, unit, color }: { from: string; to: string; unit: string; color: string }) {
  const still = useReducedMotion();
  const t = useSharedValue(still || from === to ? 1 : 0);
  useEffect(() => {
    if (still || from === to) return;
    t.value = withDelay(160, withSpring(1, { damping: 9, stiffness: 170 }));
    const id = setTimeout(() => knock(Haptics.ImpactFeedbackStyle.Medium), 220);
    return () => clearTimeout(id);
  }, [still, from, to, t]);
  const oldSt = useAnimatedStyle(() => ({ opacity: Math.max(0, 1 - t.value * 2.5), transform: [{ translateY: 22 * Math.min(1, t.value) }] }));
  const newSt = useAnimatedStyle(() => ({ opacity: Math.min(1, t.value * 2), transform: [{ translateY: -14 * (1 - t.value) }, { scale: 1.5 - 0.5 * t.value }] }));
  return (
    <View style={s.step} accessible accessibilityLabel={to + ' ' + unit}>
      <View style={s.stepNum}>
        {from !== to ? <Reanimated.Text style={[s.stepN, { color, opacity: 0.5 }, oldSt]}>{from}</Reanimated.Text> : null}
        <Reanimated.Text style={[s.stepN, s.over, { color }, newSt]}>{to}</Reanimated.Text>
      </View>
      <Text style={[s.stepU, { color }]}>{unit}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#100C24' },
  center: { alignItems: 'center', justifyContent: 'center' },
  top: { position: 'absolute', left: 0, right: 0, top: 0, paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'flex-end', zIndex: 2 },
  x: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: nightInk.btn },
  col: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingTop: 56 },
  bubble: { minHeight: 92, maxWidth: 340, alignSelf: 'stretch', justifyContent: 'flex-end', marginBottom: 6 },
  /* the number shrinks to fit on one line, so a word in it ("Day 1") never breaks (WP10, November 13, 2026) */
  count: { alignItems: 'center', marginTop: -4, alignSelf: 'stretch', minHeight: SHORT ? 104 : 128 },
  numBox: { height: SHORT ? 84 : 104, justifyContent: 'center', alignItems: 'center', minWidth: 120, alignSelf: 'stretch' },
  num: { fontFamily: font.display, fontSize: SHORT ? 80 : 100, lineHeight: SHORT ? 88 : 108, textAlign: 'center' },
  over: { position: 'absolute', left: 0, right: 0 },
  unit: { fontFamily: font.bodyBold, fontSize: 20, color: ORANGE, marginTop: -2 },
  dock: { paddingHorizontal: 16, gap: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignSelf: 'center', width: '100%', maxWidth: 340 },
  day: { alignItems: 'center', gap: 6, width: 40 },
  dayName: { fontFamily: font.bodySemi, fontSize: 13, color: nightInk.muted },
  dotBox: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  untold: { borderWidth: 2, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.3)' },
  spark: { position: 'absolute', width: 3, borderRadius: 2 },
  foot: { minHeight: 56, justifyContent: 'center' },
  goal: { alignSelf: 'center', width: '100%', maxWidth: 340, gap: 8 },
  goalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  goalText: { fontFamily: font.bodyBold, fontSize: 15, color: nightInk.ink },
  goalLeft: { fontFamily: font.bodySemi, fontSize: 15, color: nightInk.muted },
  segs: { flexDirection: 'row', gap: 6 },
  seg: { flex: 1, height: 14, borderRadius: 7, backgroundColor: 'rgba(255,255,255,0.14)', overflow: 'hidden' },
  segOn: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, borderRadius: 7 },
  hintWrap: { alignItems: 'center', paddingTop: 12 },
  hint: { alignItems: 'center', gap: 6, minHeight: 56, justifyContent: 'center', paddingHorizontal: 24 },
  hintText: { fontFamily: font.bodyBold, fontSize: 17, color: nightInk.ink },
  step: { alignItems: 'center' },
  stepNum: { height: 52, minWidth: 80, justifyContent: 'center', alignItems: 'center' },
  stepN: { fontFamily: font.display, fontSize: 46, lineHeight: 52, textAlign: 'center' },
  stepU: { fontFamily: font.bodyBold, fontSize: 15, marginTop: -2 },
});
