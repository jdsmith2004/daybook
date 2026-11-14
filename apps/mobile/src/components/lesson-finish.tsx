/* The end of a lesson (the owner, November 12, 2026: "i want the celebrations to be better and to show them getting points just like
   duolingo", then "it just doesn't look as good", "it should just be one button underneath back to wherever they started the
   lesson from" and "the +40 points it should go into the bar and move it up"). One page, after the last card (app/lesson/[id].tsx
   hands over here). Built from Duolingo's lesson end, beat by beat, with the flame as the one living thing:
   1. the opener: a tilted band sweeps in across a flat night, the flame huge inside it, "Lesson 4 done!" pops in sun yellow and
      confetti bursts (a chime when sound is on, a heavy knock);
   2. the band slides away and the flame settles into its place, gold stars twinkling around it, and the title rises;
   3. the points pop in low (a star first, then the count), then the points themselves fly into the level bar and are gone into
      it, gold stars trailing, a tick as each lands, and the bar fills with them; a new level pops and the flame blooms;
   4. then the lessons line: how many lessons are done, and one more star flies in for this one (the owner, November 13, 2026:
      "then you see total lessons done as a line and experience goes to it");
   5. the flame says the one line to keep, in its cream bubble;
   6. only then the one button, Continue, back to wherever the lesson was opened.
   About five seconds; a tap anywhere brings it all in at once. Reduce Motion: no opener, everything in, settled, one buzz.
   In the hours after a slip (core ptsQuiet) the points are not shown or flown, as everywhere else: the lesson itself is the win.
   A lesson read again earns no points, so nothing flies.
   The look (the owner, November 13, 2026: "i want them to look better"; every beat keeps its time): in the opener a sunburst of rays
   turns behind the flame and a white flash blooms as it bursts up (`Rays`, `Flash`), the shout glows warm; at rest the flame stands in
   a breathing gold halo (`Halo`); the points glow, and as they land the level bar lights up and a sheen runs along its fill (`Sheen`);
   a new level sends a ring out from the bar and throws the confetti again; the confetti has gold stars in it. */
import { gameCompute, lessonCount, lessonWalk, levelOf, ptsQuiet } from '@daybook/core';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, useWindowDimensions, View, type ViewInstance } from 'react-native';
import Reanimated, {
  Easing,
  interpolate,
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
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from 'react-native-svg';

import { BigFlame } from '@/components/big-flame';
import { SHORT } from '@/components/fit';
import { Bubble } from '@/components/lesson-flame';
import { Meter, meterTime, type MeterSpec } from '@/components/reward-kit';
import { Text } from '@/components/text';
import { buzz, knock } from '@/lib/feel';
import { useReducedMotion } from '@/lib/motion';
import { play } from '@/lib/sound';
import { useStore } from '@/lib/store';
import { font, nightInk } from '@/lib/theme';

const GOLD = '#FFD25A';
const NIGHT = '#16113A';
const BAND = '#3A2C8F';
const LIP = '#D99A12';
const ORANGE = '#FF9A2E';
const CONFETTI = [GOLD, '#FF8A5B', '#FFFFFF', '#A898FF', '#7FE0B5', GOLD];
/** the warm glow behind the words that shout */
const WARM = { textShadowColor: 'rgba(255,154,46,0.6)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 18 } as const;
/** a four-point star, in a 24 box */
const STAR = 'M12 0C13 8 16 11 24 12C16 13 13 16 12 24C11 16 8 13 0 12C8 11 11 8 12 0Z';

export interface LessonFinishProps {
  lessonId: string;
  title: string;
  /** the lesson's number on the path */
  n: number;
  /** points this lesson earned (0 on a read again) */
  gain: number;
  /** a lesson read again */
  again: boolean;
  /* kept for the lesson player; the page no longer shows them (the owner, November 13, 2026: cards and time do not matter) */
  stats: { cards: number; combo: number; secs: number };
  /** the one line to keep */
  keep: string;
  /** kept for the lesson player; the page has one button now, back to where the lesson was opened (onDone) */
  next: { id: string; title: string } | null;
  onNext: () => void;
  onDone: () => void;
}

/* when each beat of the opener starts, in ms; the rest starts at T0 */
const OPEN = { title: 260, confetti: 300, out: 1700 };
const T0 = OPEN.out + 300;
/* how long the points take to fly into the bar */
const FLY = 650;

type Line = { x0: number; y0: number; x1: number; y1: number };

export function LessonFinish({ title, n, gain, again, keep, onDone }: LessonFinishProps) {
  const { snap, tk, now } = useStore();
  const st = snap.settings;
  const win = useWindowDimensions();
  const inset = useSafeAreaInsets();
  const still = useReducedMotion();
  /* the points and level as they stand now (the lesson is recorded), and before it */
  const [m] = useState(() => {
    const g = st ? gameCompute(snap.days, st, snap.reviews, tk) : null;
    const pts = g?.pts ?? 0;
    const quiet = ptsQuiet(snap.days, st, now);
    const shown = quiet || again ? 0 : gain;
    return { pts, before: levelOf(Math.max(0, pts - shown)), after: g?.level ?? levelOf(pts), shown, quiet };
  });
  const dots = Math.min(8, Math.max(3, Math.round(m.shown / 5)));
  const up = m.after.n > m.before.n;
  /* with the level bar hidden (the hours after a slip) nothing is shown; with it, the points end up inside it */
  const flying = m.shown > 0 && !m.quiet;
  /* the lessons line: done of the path, this one included (it is recorded before this page); a read again adds nothing */
  const [lessons] = useState<MeterSpec | null>(() => {
    if (!st) return null;
    const c = lessonCount(lessonWalk(snap.days, st));
    if (!c.of) return null;
    const before = again ? c.done : Math.max(0, c.done - 1);
    return {
      label: 'Lessons',
      right: c.done + ' of ' + c.of,
      from: before / c.of,
      to: c.done / c.of,
      stars: again ? 1 : 3,
      a11y: c.done + ' of ' + c.of + ' lessons done',
    };
  });
  const [lessonsAt, setLessonsAt] = useState<number | null>(still ? 0 : null);

  const [beat, setBeat] = useState(0);
  const [pulse, setPulse] = useState(0);
  const [lvl, setLvl] = useState(m.before.n);
  const [count, setCount] = useState(still ? m.shown : 0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const at = (ms: number, f: () => void) => timers.current.push(setTimeout(f, ms));

  /* the opener: open 1 = the flame huge in the band, 0 = settled in its place; band 0 off left, 1 across, 2 off right */
  const open = useSharedValue(still ? 0 : 1);
  const band = useSharedValue(still ? 2 : 0);
  const grow = useSharedValue(still ? 1 : 0);
  const shout = useSharedValue(0);
  const conf = useSharedValue(0);
  const twinkle = useSharedValue(still ? 1 : 0);
  /* the look: the white flash as the flame bursts up, the bar lighting up as the points land, the sheen along its fill, the ring a
     new level sends out */
  const flash = useSharedValue(0);
  const lit = useSharedValue(0);
  const sheen = useSharedValue(0);
  const ring = useSharedValue(0);
  const [trackW, setTrackW] = useState(0);

  const head = useSharedValue(still ? 1 : 0);
  const star = useSharedValue(0);
  const ptsV = useSharedValue(0);
  /* 0 = the points where they popped, 1 = gone into the bar */
  const go = useSharedValue(still ? 1 : 0);
  const fly = useSharedValue(0);
  const bar = useSharedValue(still ? m.after.frac : m.before.frac);
  const gulp = useSharedValue(1);
  const say = useSharedValue(still ? 1 : 0);
  const lvPop = useSharedValue(1);
  const btn = useSharedValue(still ? 1 : 0);

  /* the flame, the points and the level bar, measured in the window: the flame starts in the middle of the screen, and the points
     fly from where they popped into the bar (to where it will end, or to its end when it fills to a new level) */
  const root = useRef<ViewInstance>(null);
  const flameRef = useRef<ViewInstance>(null);
  const ptsRef = useRef<ViewInstance>(null);
  const trackRef = useRef<ViewInstance>(null);
  const [path, setPath] = useState<Line | null>(null);
  const [rest, setRest] = useState<{ x: number; y: number } | null>(null);
  const measure = () => {
    root.current?.measureInWindow((rx, ry) => {
      flameRef.current?.measureInWindow((fx, fy, fw, fh) => setRest({ x: fx - rx + fw / 2, y: fy - ry + fh / 2 }));
      ptsRef.current?.measureInWindow((px, py, pw, ph) =>
        trackRef.current?.measureInWindow((tx, ty, tw, th) =>
          setPath({ x0: px - rx + pw / 2, y0: py - ry + ph / 2, x1: tx - rx + tw * Math.max(0.04, up ? 1 : m.after.frac), y1: ty - ry + th / 2 }),
        ),
      );
    });
  };

  const big = Math.min(win.width - 120, win.height * (SHORT ? 0.22 : 0.27), 240);
  /* how big the flame is in the opener, and where: the middle of the band */
  const K = Math.min(1.7, (win.width * 0.78) / big);
  const midY = win.height * 0.4;
  const dy = rest ? midY - rest.y : 0;

  const all = () => {
    setLessonsAt(-1);
    timers.current.forEach(clearTimeout);
    timers.current = [];
    const q = { duration: still ? 0 : 200 };
    open.value = withTiming(0, q);
    band.value = withTiming(2, q);
    grow.value = withTiming(1, q);
    shout.value = withTiming(0, q);
    conf.value = 1;
    twinkle.value = withTiming(1, q);
    for (const v of [head, say, btn, go]) v.value = withTiming(1, q);
    for (const v of [flash, lit, sheen, ring]) v.value = 0;
    fly.value = 0;
    bar.value = withTiming(m.after.frac, q);
    setLvl(m.after.n);
    setCount(m.shown);
    setBeat(2);
  };

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(`Lesson ${n} done. ${flying ? m.shown + ' points. ' : ''}${keep}`);
    if (still) {
      buzz('lit');
      setBeat(2);
      return;
    }
    setBeat(1);
    /* 1. the band sweeps in and the flame bursts up inside it */
    band.value = withSpring(1, { damping: 16, stiffness: 140 });
    grow.value = withDelay(80, withSpring(1, { damping: 9, stiffness: 160 }));
    flash.value = withDelay(80, withTiming(1, { duration: 460, easing: Easing.out(Easing.cubic) }));
    knock(Haptics.ImpactFeedbackStyle.Heavy);
    at(OPEN.title, () => {
      play('chime');
      shout.value = withSpring(1, { damping: 8, stiffness: 220 });
    });
    at(OPEN.confetti, () => {
      buzz('lit');
      setPulse((p) => p + 1);
      conf.value = withTiming(1, { duration: 1600, easing: Easing.linear });
    });
    /* 2. the band slides off and the flame settles into its place */
    at(OPEN.out, () => {
      band.value = withTiming(2, { duration: 420, easing: Easing.in(Easing.cubic) });
      shout.value = withTiming(0, { duration: 220 });
      open.value = withSpring(0, { damping: 14, stiffness: 120 });
      knock(Haptics.ImpactFeedbackStyle.Light);
    });
    at(OPEN.out + 250, () => {
      head.value = withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) });
      twinkle.value = withTiming(1, { duration: 400 });
    });
    let next = T0 + 500;
    if (flying) {
      /* 3. a star pops, then the points, which count up */
      at(T0 + 300, () => {
        knock(Haptics.ImpactFeedbackStyle.Light);
        star.value = withSpring(1, { damping: 7, stiffness: 220 });
      });
      at(T0 + 450, () => {
        ptsV.value = withSpring(1, { damping: 10, stiffness: 200 });
      });
      for (let k = 1; k <= 12; k++) at(T0 + 500 + k * 30, () => setCount(Math.round((m.shown * k) / 12)));
      /* then the points themselves fly into the bar, stars trailing them, a tick as each lands, and the bar fills */
      const flyAt = T0 + 1250;
      at(flyAt, () => {
        go.value = withTiming(1, { duration: FLY, easing: Easing.in(Easing.cubic) });
        fly.value = withTiming(1, { duration: FLY + dots * 60, easing: Easing.linear });
      });
      const into = flyAt + FLY - 40;
      for (let i = 0; i < dots; i++) at(into + i * 60, () => buzz('tick'));
      at(into, () => {
        gulp.value = withSequence(withTiming(1.25, { duration: 110 }), withSpring(1, { damping: 6, stiffness: 260 }));
        /* the bar lights up while the stars land, then the light fades and a sheen runs along the fill */
        lit.value = withSequence(withTiming(1, { duration: 160 }), withDelay(dots * 60, withTiming(0, { duration: 700 })));
        sheen.value = withDelay(dots * 60 + 80, withTiming(1, { duration: 520, easing: Easing.inOut(Easing.cubic) }));
      });
      const landed = into + dots * 60 + 60;
      if (up) {
        bar.value = withDelay(into, withTiming(1, { duration: dots * 60 }));
        at(landed, () => {
          setLvl(m.after.n);
          buzz('lit');
          lvPop.value = 1.5;
          lvPop.value = withSpring(1, { damping: 7, stiffness: 180 });
          setPulse((p) => p + 1);
          /* a ring goes out from the bar, and the confetti is thrown once more */
          ring.value = 0;
          ring.value = withTiming(1, { duration: 650, easing: Easing.out(Easing.cubic) });
          conf.value = 0;
          conf.value = withTiming(1, { duration: 1600, easing: Easing.linear });
          bar.value = 0;
          bar.value = withTiming(m.after.frac, { duration: 450, easing: Easing.out(Easing.cubic) });
        });
      } else bar.value = withDelay(into, withTiming(m.after.frac, { duration: dots * 60 + 160, easing: Easing.out(Easing.cubic) }));
      next = landed + 350;
    }
    /* 4. the lessons line fills, 5. the line to keep, 6. the button */
    if (lessons) {
      setLessonsAt(next);
      next += meterTime(lessons) - 200;
    }
    at(next, () => {
      say.value = withTiming(1, { duration: 300 });
    });
    at(next + 450, () => {
      setBeat(2);
      btn.value = withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) });
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const flameIn = useAnimatedStyle(() => ({
    opacity: rest ? 1 : 0,
    /* the flame is drawn at its opener size and scaled down to rest, never up past 1: iOS scales the drawn picture, so scaling
       up made it soft (the owner, November 13, 2026: "super low resolution") */
    transform: [{ translateY: dy * open.value }, { scale: ((1 + (K - 1) * open.value) / K) * interpolate(grow.value, [0, 1], [0.3, 1]) }],
  }));
  const B = Math.round(big * K);
  const bandIn = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(band.value, [0, 1, 2], [-win.width * 1.8, 0, win.width * 1.8]) }, { rotate: '-10deg' }],
  }));
  const shoutIn = useAnimatedStyle(() => ({
    opacity: Math.min(1, shout.value * 1.5),
    transform: [{ scale: interpolate(shout.value, [0, 1], [0.4, 1]) }],
  }));
  /* the points on their way into the bar: a curve down to it, shrinking, gone as they arrive */
  const ptsGo = useAnimatedStyle(() => {
    const e = go.value;
    const p = path;
    const dx = p ? p.x1 - p.x0 : 0;
    const dyp = p ? p.y1 - p.y0 : 0;
    return {
      opacity: e >= 1 ? 0 : 1 - Math.max(0, (e - 0.75) * 4),
      transform: [{ translateX: dx * e }, { translateY: dyp * e - 40 * Math.sin(Math.PI * e) }, { scale: 1 - 0.75 * e }],
    };
  });
  const lvIn = useAnimatedStyle(() => ({ transform: [{ scale: lvPop.value }] }));
  const headIn = useAnimatedStyle(() => ({ opacity: head.value, transform: [{ translateY: 12 * (1 - head.value) }] }));
  const starIn = useAnimatedStyle(() => ({
    opacity: Math.min(1, star.value * 2),
    transform: [{ scale: star.value }, { rotate: `${(1 - star.value) * -90}deg` }],
  }));
  const ptsIn = useAnimatedStyle(() => ({ opacity: Math.min(1, ptsV.value * 2), transform: [{ scale: interpolate(ptsV.value, [0, 1], [0.6, 1]) }] }));
  const sayIn = useAnimatedStyle(() => ({ opacity: say.value, transform: [{ translateY: 8 * (1 - say.value) }] }));
  const btnIn = useAnimatedStyle(() => ({ opacity: btn.value, transform: [{ translateY: 16 * (1 - btn.value) }] }));
  const barIn = useAnimatedStyle(() => ({ width: `${Math.max(0.04, Math.min(1, bar.value)) * 100}%` }));
  const trackIn = useAnimatedStyle(() => ({ transform: [{ scaleY: gulp.value }] }));
  /* the flash lives in the opener, with the rays: in with the flame, gone with the band */
  const flashIn = useAnimatedStyle(() => ({
    opacity: 0.95 * (1 - flash.value) * grow.value,
    transform: [{ scale: 0.35 + 1.25 * flash.value }],
  }));
  const litIn = useAnimatedStyle(() => ({ opacity: 0.45 * lit.value }));
  const sheenIn = useAnimatedStyle(() => ({
    opacity: sheen.value <= 0 || sheen.value >= 1 ? 0 : 0.7,
    transform: [{ translateX: -60 + (trackW + 120) * sheen.value }, { skewX: '-20deg' }],
  }));
  const ringIn = useAnimatedStyle(() => ({
    opacity: ring.value <= 0 ? 0 : 0.9 * (1 - ring.value),
    transform: [{ scaleX: 1 + 0.1 * ring.value }, { scaleY: 1 + 0.9 * ring.value }],
  }));
  const ptsLeft = m.after.next == null ? null : m.after.toNext;
  const bandH = win.height * 0.56;

  return (
    <View ref={root} style={s.page} onLayout={measure}>
      <StatusBar style="light" />
      {!still ? (
        <Reanimated.View
          pointerEvents="none"
          style={[s.band, { width: win.width * 1.8, height: bandH, left: -win.width * 0.4, top: midY - bandH / 2 + 40 }, bandIn]}
        />
      ) : null}
      {!still ? <Rays x={win.width / 2} y={midY} r={win.width * 0.8} grow={grow} band={band} /> : null}
      {!still ? (
        <Reanimated.View pointerEvents="none" style={[{ position: 'absolute', width: B, height: B, left: win.width / 2 - B / 2, top: midY - B / 2 }, flashIn]}>
          <Svg width={B} height={B} viewBox="0 0 100 100">
            <Defs>
              <RadialGradient id="flash" cx="50" cy="50" r="50" gradientUnits="userSpaceOnUse">
                <Stop offset="0" stopColor="#FFF9EE" stopOpacity={1} />
                <Stop offset="0.4" stopColor="#FFF9EE" stopOpacity={0.55} />
                <Stop offset="1" stopColor="#FFF9EE" stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Circle cx={50} cy={50} r={50} fill="url(#flash)" />
          </Svg>
        </Reanimated.View>
      ) : null}
      <Pressable style={StyleSheet.absoluteFill} accessible={false} onPress={() => beat === 1 && all()} />
      <View style={[s.col, { paddingTop: inset.top + (SHORT ? 12 : 28) }]} pointerEvents="box-none">
        <Reanimated.View style={[s.bubble, sayIn]} pointerEvents="none">
          <Bubble text={keep} />
        </Reanimated.View>
        <View ref={flameRef} onLayout={measure} style={{ width: big, height: big, marginVertical: 14 }} pointerEvents="none">
          <Halo v={twinkle} size={big} still={still} />
          <Sparkles v={twinkle} size={big} />
          <Reanimated.View style={[{ position: 'absolute', width: B, height: B, left: (big - B) / 2, top: (big - B) / 2 }, flameIn]}>
            <BigFlame level={lvl} size={B} pulse={pulse} noLand />
          </Reanimated.View>
        </View>
        <Reanimated.View style={headIn}>
          <Text style={s.title} accessibilityRole="header">
            Lesson {n} done
          </Text>
          <Text style={s.sub} numberOfLines={1}>
            {title}
          </Text>
        </Reanimated.View>
      </View>

      <View style={[s.dock, { paddingBottom: inset.bottom + (SHORT ? 12 : 20) }]} pointerEvents="box-none">
        {flying ? (
          <Reanimated.View ref={ptsRef} onLayout={measure} style={[s.pts, ptsGo]} accessible accessibilityLabel={m.shown + ' points'}>
            <Reanimated.View style={starIn}>
              <Svg width={36} height={36} viewBox="0 0 24 24">
                <Path d={STAR} fill={GOLD} />
              </Svg>
            </Reanimated.View>
            <Reanimated.View style={[s.ptsRow, ptsIn]}>
              <Text style={s.ptsNum}>+{count}</Text>
              <Text style={s.ptsWord}>points</Text>
            </Reanimated.View>
          </Reanimated.View>
        ) : null}
        {!m.quiet ? (
          <View style={s.levelBox} accessible accessibilityLabel={`Level ${lvl}${ptsLeft != null ? ', ' + ptsLeft + ' points to the next' : ''}`}>
            <View style={s.levelHead}>
              <Reanimated.Text style={[s.levelText, lvIn]}>Level {lvl}</Reanimated.Text>
              {ptsLeft != null ? <Text style={s.levelLeft}>{ptsLeft} to the next</Text> : null}
            </View>
            <View>
              {!still ? <Reanimated.View pointerEvents="none" style={[s.lit, litIn]} /> : null}
              {!still ? <Reanimated.View pointerEvents="none" style={[s.ring, ringIn]} /> : null}
              <Reanimated.View
                ref={trackRef}
                onLayout={(e) => {
                  setTrackW(e.nativeEvent.layout.width);
                  measure();
                }}
                style={[s.track, trackIn]}>
                <Reanimated.View style={[s.fill, barIn]}>
                  <View style={s.shine} />
                </Reanimated.View>
                {!still ? <Reanimated.View pointerEvents="none" style={[s.sheen, sheenIn]} /> : null}
              </Reanimated.View>
            </View>
          </View>
        ) : null}
        {lessons && lessonsAt != null ? (
          <View style={s.levelBox}>
            <Meter key={lessonsAt < 0 ? 'still' : 'live'} m={lessons} at={Math.max(0, lessonsAt)} still={still || lessonsAt < 0} />
          </View>
        ) : (
          <View style={s.meterSpot} />
        )}
        <Reanimated.View style={btnIn} pointerEvents={beat === 2 ? 'auto' : 'none'}>
          <Pressable accessibilityRole="button" onPress={onDone}>
            {({ pressed }) => (
              <View style={[s.btn, pressed && s.btnDown]}>
                <Text style={s.btnText}>Continue</Text>
              </View>
            )}
          </Pressable>
        </Reanimated.View>
      </View>

      {!still ? (
        <Reanimated.View pointerEvents="none" style={[s.shout, { top: midY + (big * K) / 2 - 6 }, shoutIn]}>
          <Text style={s.shoutText} numberOfLines={2}>
            {'Lesson ' + n + '\ndone!'}
          </Text>
        </Reanimated.View>
      ) : null}
      {!still ? <Confetti v={conf} x={win.width / 2} y={midY} w={win.width} /> : null}
      {path && flying && !still ? <Fly v={fly} path={path} dots={dots} /> : null}
    </View>
  );
}

/** the sunburst behind the flame in the opener: twelve sun-yellow rays turning slowly, like Duolingo's */
const RAYS = Array.from({ length: 12 }, (_, i) => {
  const a = (i * 30 * Math.PI) / 180;
  const h = (7 * Math.PI) / 180;
  const p = (t: number) => `${50 + 60 * Math.cos(t)} ${50 + 60 * Math.sin(t)}`;
  return `M50 50 L${p(a - h)} L${p(a + h)} Z`;
}).join(' ');
function Rays({ x, y, r, grow, band }: { x: number; y: number; r: number; grow: SharedValue<number>; band: SharedValue<number> }) {
  const turn = useSharedValue(0);
  /* in with the flame, gone with the band */
  const style = useAnimatedStyle(() => ({ opacity: 0.6 * grow.value * interpolate(band.value, [1, 1.25], [1, 0], 'clamp') }));
  useEffect(() => {
    turn.value = withRepeat(withTiming(1, { duration: 16000, easing: Easing.linear }), -1);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const spin = useAnimatedStyle(() => ({ transform: [{ rotate: `${turn.value * 360}deg` }] }));
  return (
    <Reanimated.View pointerEvents="none" style={[{ position: 'absolute', width: r * 2, height: r * 2, left: x - r, top: y - r }, style]}>
      <Reanimated.View style={[StyleSheet.absoluteFill, spin]}>
        <Svg width={r * 2} height={r * 2} viewBox="0 0 100 100">
          <Defs>
            <RadialGradient id="rays" cx="50" cy="50" r="50" gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor={GOLD} stopOpacity={0.5} />
              <Stop offset="0.45" stopColor={GOLD} stopOpacity={0.14} />
              <Stop offset="0.85" stopColor={GOLD} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Path d={RAYS} fill="url(#rays)" />
        </Svg>
      </Reanimated.View>
    </Reanimated.View>
  );
}

/** the warm halo the resting flame stands in: a soft gold light that breathes, in with the twinkling stars */
function Halo({ v, size, still }: { v: SharedValue<number>; size: number; still: boolean }) {
  const breath = useSharedValue(0);
  useEffect(() => {
    if (still) return;
    breath.value = withRepeat(
      withSequence(withTiming(1, { duration: 1900, easing: Easing.inOut(Easing.sin) }), withTiming(0, { duration: 1900, easing: Easing.inOut(Easing.sin) })),
      -1,
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const st = useAnimatedStyle(() => ({ opacity: v.value * (0.8 + 0.2 * breath.value), transform: [{ scale: 1 + 0.06 * breath.value }] }));
  const R = Math.round(size * 1.5);
  return (
    <Reanimated.View pointerEvents="none" style={[{ position: 'absolute', width: R, height: R, left: (size - R) / 2, top: (size - R) / 2 + size * 0.06 }, st]}>
      <Svg width={R} height={R} viewBox="0 0 100 100">
        <Defs>
          <RadialGradient id="halo" cx="50" cy="50" r="50" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor={ORANGE} stopOpacity={0.5} />
            <Stop offset="0.4" stopColor={ORANGE} stopOpacity={0.16} />
            <Stop offset="1" stopColor={ORANGE} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={50} cy={50} r={50} fill="url(#halo)" />
      </Svg>
    </Reanimated.View>
  );
}

/** gold four-point stars that twinkle around the resting flame, one after another */
const SPOTS = [
  { x: -0.08, y: 0.18, r: 22, d: 0 },
  { x: 1.02, y: 0.1, r: 16, d: 500 },
  { x: 0.95, y: 0.62, r: 24, d: 1000 },
  { x: -0.02, y: 0.7, r: 14, d: 1400 },
  { x: 0.5, y: -0.1, r: 12, d: 800 },
];
function Sparkles({ v, size }: { v: SharedValue<number>; size: number }) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {SPOTS.map((p, i) => (
        <Twinkle key={i} v={v} left={p.x * size - p.r / 2} top={p.y * size - p.r / 2} r={p.r} delay={p.d} />
      ))}
    </View>
  );
}
function Twinkle({ v, left, top, r, delay }: { v: SharedValue<number>; left: number; top: number; r: number; delay: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) }),
          withTiming(0, { duration: 520, easing: Easing.in(Easing.cubic) }),
          withTiming(0, { duration: 900 }),
        ),
        -1,
      ),
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const st = useAnimatedStyle(() => ({ opacity: v.value * t.value, transform: [{ scale: 0.3 + 0.7 * t.value }, { rotate: `${t.value * 45}deg` }] }));
  return (
    <Reanimated.View style={[{ position: 'absolute', left, top, width: r, height: r }, st]}>
      <Svg width={r} height={r} viewBox="0 0 24 24">
        <Path d={STAR} fill={GOLD} />
      </Svg>
    </Reanimated.View>
  );
}

type Piece = { vx: number; vy: number; spin: number; c: string; s: number; star: boolean };
/** confetti: small squares and a few gold stars thrown up from the flame, tumbling as they fall */
function Confetti({ v, x, y, w }: { v: SharedValue<number>; x: number; y: number; w: number }) {
  const [bits] = useState<Piece[]>(() =>
    Array.from({ length: 34 }, (_, i) => {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.3;
      const sp = 0.45 + Math.random() * 0.6;
      return {
        vx: Math.cos(a) * sp * w * 0.75,
        vy: Math.sin(a) * sp * w * 1.1,
        spin: (Math.random() - 0.5) * 900,
        c: CONFETTI[i % CONFETTI.length],
        s: 7 + Math.random() * 6,
        star: i % 5 === 0,
      };
    }),
  );
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {bits.map((b, i) => (
        <Bit key={i} v={v} x={x} y={y} b={b} />
      ))}
    </View>
  );
}
function Bit({ v, x, y, b }: { v: SharedValue<number>; x: number; y: number; b: Piece }) {
  const st = useAnimatedStyle(() => {
    const t = v.value;
    return {
      opacity: t <= 0 || t >= 1 ? 0 : t > 0.75 ? (1 - t) * 4 : 1,
      transform: [
        { translateX: x + b.vx * t - b.s / 2 },
        { translateY: y + b.vy * t + 900 * t * t - b.s / 2 },
        { rotate: `${b.spin * t}deg` },
        { scaleY: b.star ? 1 : 0.5 + 0.5 * Math.abs(Math.cos(t * 12 + b.spin)) },
      ],
    };
  });
  if (b.star)
    return (
      <Reanimated.View style={[{ position: 'absolute', left: 0, top: 0, width: b.s + 8, height: b.s + 8 }, st]}>
        <Svg width={b.s + 8} height={b.s + 8} viewBox="0 0 24 24">
          <Path d={STAR} fill={GOLD} />
        </Svg>
      </Reanimated.View>
    );
  return <Reanimated.View style={[{ position: 'absolute', left: 0, top: 0, width: b.s, height: b.s, borderRadius: 2, backgroundColor: b.c }, st]} />;
}

/** gold stars trailing the points into the bar, one after another */
function Fly({ v, path, dots }: { v: SharedValue<number>; path: Line; dots: number }) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {Array.from({ length: dots }, (_, i) => (
        <Spark key={i} v={v} path={path} i={i} n={dots} />
      ))}
    </View>
  );
}
function Spark({ v, path, i, n }: { v: SharedValue<number>; path: Line; i: number; n: number }) {
  const st = useAnimatedStyle(() => {
    /* each star has its own slice of the run: it starts a little after the one before */
    const span = 0.6;
    const start = (i / Math.max(1, n - 1)) * (1 - span);
    const t = Math.max(0, Math.min(1, (v.value - start) / span));
    const e = t * t * t;
    /* a curve that bows out to one side, alternating, like Duolingo's gems */
    const side = i % 2 ? 1 : -1;
    const cx = (path.x0 + path.x1) / 2 + side * 60;
    const cy = Math.min(path.y0, path.y1) - 30;
    const x = (1 - e) * (1 - e) * path.x0 + 2 * (1 - e) * e * cx + e * e * path.x1;
    const y = (1 - e) * (1 - e) * path.y0 + 2 * (1 - e) * e * cy + e * e * path.y1;
    return {
      opacity: t <= 0 || t >= 1 ? 0 : 1,
      transform: [{ translateX: x - 9 }, { translateY: y - 9 }, { scale: 1 - 0.4 * e }, { rotate: `${e * 180}deg` }],
    };
  });
  return (
    <Reanimated.View style={[s.spark, st]}>
      <Svg width={18} height={18} viewBox="0 0 24 24">
        <Path d={STAR} fill={GOLD} />
      </Svg>
    </Reanimated.View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: NIGHT, overflow: 'hidden' },
  band: { position: 'absolute', backgroundColor: BAND, borderRadius: 28 },
  col: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 10 },
  bubble: { alignSelf: 'stretch', maxWidth: 340, marginHorizontal: 'auto' },
  shout: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  shoutText: { fontFamily: font.display, fontSize: 46, lineHeight: 50, color: GOLD, textAlign: 'center', ...WARM },
  title: { fontFamily: font.display, fontSize: 34, color: nightInk.ink, textAlign: 'center' },
  sub: { fontFamily: font.bodySemi, fontSize: 15, color: nightInk.muted, textAlign: 'center', marginTop: 2 },
  dock: { paddingHorizontal: 16, gap: 18 },
  pts: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, alignSelf: 'center' },
  ptsRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  ptsNum: { fontFamily: font.display, fontSize: 52, color: GOLD, ...WARM },
  ptsWord: { fontFamily: font.bodyBold, fontSize: 20, color: GOLD },
  levelBox: { alignSelf: 'center', width: '100%', maxWidth: 360, gap: 8 },
  /* the lessons line's place, held so nothing moves when it comes in */
  meterSpot: { height: 48 },
  levelHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  levelText: { fontFamily: font.display, fontSize: 17, color: nightInk.ink },
  levelLeft: { fontFamily: font.bodySemi, fontSize: 15, color: nightInk.muted },
  track: { height: 20, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.14)', overflow: 'hidden' },
  /* the light the bar gives off as the points land: a gold glow behind the track */
  lit: {
    position: 'absolute',
    left: -4,
    right: -4,
    top: -4,
    bottom: -4,
    borderRadius: 14,
    backgroundColor: GOLD,
    shadowColor: GOLD,
    shadowOpacity: 1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
  },
  /* the ring a new level sends out from the bar */
  ring: { position: 'absolute', left: -6, right: -6, top: -6, bottom: -6, borderRadius: 16, borderWidth: 2, borderColor: GOLD },
  /* the sheen that runs along the fill once the points are in */
  sheen: { position: 'absolute', top: 0, bottom: 0, left: 0, width: 36, backgroundColor: '#FFFFFF' },
  fill: { height: 20, borderRadius: 10, backgroundColor: GOLD, paddingTop: 4, paddingHorizontal: 8 },
  shine: { height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.45)' },
  btn: {
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: GOLD,
    borderBottomWidth: 5,
    borderBottomColor: LIP,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDown: { borderBottomWidth: 0, marginTop: 5 },
  btnText: { fontFamily: font.display, fontSize: 20, color: '#3A2A00' },
  spark: { position: 'absolute', left: 0, top: 0, width: 18, height: 18 },
});
