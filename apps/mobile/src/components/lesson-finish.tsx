/* The end of a lesson (the owner, November 12, 2026: "i want the celebrations to be better and to show them getting points just like
   duolingo", then "it just doesn't look as good", "it should just be one button underneath back to wherever they started the
   lesson from" and "the +40 points it should go into the bar and move it up"). One page, after the last card (app/lesson/[id].tsx
   hands over here). Built from Duolingo's lesson end, beat by beat, with the flame as the one living thing:
   1. the opener: a tilted band sweeps in across a flat night, the flame huge inside it, "Lesson 4 done!" pops in sun yellow and
      confetti bursts (a chime when sound is on, a heavy knock);
   2. the band slides away and the flame settles into its place, gold stars twinkling around it, and the title rises;
   3. the points pop in low (a star first, then the count), then the points themselves fly into the level bar and are gone into
      it, gold stars trailing, a tick as each lands, and the bar fills with them; a new level pops and the flame blooms;
   4. the flame says the one line to keep, in its cream bubble;
   5. only then the one button, Continue, back to wherever the lesson was opened.
   About five seconds; a tap anywhere brings it all in at once. Reduce Motion: no opener, everything in, settled, one buzz.
   In the hours after a slip (core ptsQuiet) the points are not shown or flown, as everywhere else: the lesson itself is the win.
   A lesson read again earns no points, so nothing flies. */
import { gameCompute, levelOf, ptsQuiet } from '@daybook/core';
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
import Svg, { Path } from 'react-native-svg';

import { BigFlame } from '@/components/big-flame';
import { SHORT } from '@/components/fit';
import { Bubble } from '@/components/lesson-flame';
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
const CONFETTI = [GOLD, '#FF8A5B', '#FFFFFF', '#A898FF', GOLD];
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
  stats: { cards: number; combo: number; secs: number };
  /** the one line to keep */
  keep: string;
  /** kept for the lesson player; the page has one button now, back to where the lesson was opened (onDone) */
  next: { id: string; title: string } | null;
  onNext: () => void;
  onDone: () => void;
}

const fmtTime = (s: number) => Math.floor(s / 60) + ':' + String(Math.round(s) % 60).padStart(2, '0');

/* when each beat of the opener starts, in ms; the rest starts at T0 */
const OPEN = { title: 260, confetti: 300, out: 1700 };
const T0 = OPEN.out + 300;
/* how long the points take to fly into the bar */
const FLY = 650;

type Line = { x0: number; y0: number; x1: number; y1: number };

export function LessonFinish({ title, n, gain, again, stats, keep, onDone }: LessonFinishProps) {
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
          bar.value = 0;
          bar.value = withTiming(m.after.frac, { duration: 450, easing: Easing.out(Easing.cubic) });
        });
      } else bar.value = withDelay(into, withTiming(m.after.frac, { duration: dots * 60 + 160, easing: Easing.out(Easing.cubic) }));
      next = landed + 350;
    }
    /* 4. the line to keep, 5. the button */
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
      <Pressable style={StyleSheet.absoluteFill} accessible={false} onPress={() => beat === 1 && all()} />
      <View style={[s.col, { paddingTop: inset.top + (SHORT ? 12 : 28) }]} pointerEvents="box-none">
        <Reanimated.View style={[s.bubble, sayIn]} pointerEvents="none">
          <Bubble text={keep} />
        </Reanimated.View>
        <View ref={flameRef} onLayout={measure} style={{ width: big, height: big, marginVertical: 14 }} pointerEvents="none">
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
            {title + ' · ' + fmtTime(stats.secs)}
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
            <Reanimated.View ref={trackRef} onLayout={measure} style={[s.track, trackIn]}>
              <Reanimated.View style={[s.fill, barIn]}>
                <View style={s.shine} />
              </Reanimated.View>
            </Reanimated.View>
          </View>
        ) : null}
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

type Piece = { vx: number; vy: number; spin: number; c: string; s: number };
/** confetti: small squares thrown up from the flame, tumbling as they fall */
function Confetti({ v, x, y, w }: { v: SharedValue<number>; x: number; y: number; w: number }) {
  const [bits] = useState<Piece[]>(() =>
    Array.from({ length: 28 }, (_, i) => {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.3;
      const sp = 0.45 + Math.random() * 0.6;
      return {
        vx: Math.cos(a) * sp * w * 0.75,
        vy: Math.sin(a) * sp * w * 1.1,
        spin: (Math.random() - 0.5) * 900,
        c: CONFETTI[i % CONFETTI.length],
        s: 7 + Math.random() * 6,
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
        { scaleY: 0.5 + 0.5 * Math.abs(Math.cos(t * 12 + b.spin)) },
      ],
    };
  });
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
  shoutText: { fontFamily: font.display, fontSize: 46, lineHeight: 50, color: GOLD, textAlign: 'center' },
  title: { fontFamily: font.display, fontSize: 34, color: nightInk.ink, textAlign: 'center' },
  sub: { fontFamily: font.bodySemi, fontSize: 15, color: nightInk.muted, textAlign: 'center', marginTop: 2 },
  dock: { paddingHorizontal: 16, gap: 18 },
  pts: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, alignSelf: 'center' },
  ptsRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  ptsNum: { fontFamily: font.display, fontSize: 52, color: GOLD },
  ptsWord: { fontFamily: font.bodyBold, fontSize: 20, color: GOLD },
  levelBox: { alignSelf: 'center', width: '100%', maxWidth: 360, gap: 8 },
  levelHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  levelText: { fontFamily: font.display, fontSize: 18, color: nightInk.ink },
  levelLeft: { fontFamily: font.bodySemi, fontSize: 14, color: nightInk.muted },
  track: { height: 20, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.14)', overflow: 'hidden' },
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
  btnText: { fontFamily: font.display, fontSize: 19, color: '#3A2A00' },
  spark: { position: 'absolute', left: 0, top: 0, width: 18, height: 18 },
});
