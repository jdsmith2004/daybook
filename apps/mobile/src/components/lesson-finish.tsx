/* The end of a lesson (the owner, November 12, 2026: "i want the celebrations to be better and to show them getting points just like
   duolingo"). One page, after the last card (app/lesson/[id].tsx hands over here). Built from Duolingo's lesson end, beat by beat,
   with the flame as the one living thing:
   1. the flame blooms and "Lesson 4 done" rises (a chime when sound is on);
   2. the points it earned pop in low and count up (the owner, November 12, 2026: tiles were too cluttered, and "in a row" means
      nothing when every card is done; the time is one quiet line under the title);
   3. the points fly into the level bar just above the button, a tick as each lands, and the bar fills with them; a new level
      pops and the flame blooms (Success);
   4. the flame says the one line to keep, in its cream bubble;
   5. only then the button: Next, with Back to Today quietly under it, or Done.
   About three seconds; a tap anywhere brings it all in at once. Reduce Motion: everything in, settled, one knock.
   In the hours after a slip (core ptsQuiet) the points are not shown or flown, as everywhere else: the lesson itself is the win.
   A lesson read again earns no points, so nothing flies. */
import { gameCompute, levelOf, ptsQuiet } from '@daybook/core';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, useWindowDimensions, View, type ViewInstance } from 'react-native';
import Reanimated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BigFlame } from '@/components/big-flame';
import { SHORT } from '@/components/fit';
import { Bubble } from '@/components/lesson-flame';
import { Text } from '@/components/text';
import { Button } from '@/components/ui';
import { buzz, knock } from '@/lib/feel';
import { useReducedMotion } from '@/lib/motion';
import { play } from '@/lib/sound';
import { useStore } from '@/lib/store';
import { font, nightInk } from '@/lib/theme';

const GOLD = '#FFD25A';

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
  next: { id: string; title: string } | null;
  onNext: () => void;
  onDone: () => void;
}

const fmtTime = (s: number) => Math.floor(s / 60) + ':' + String(Math.round(s) % 60).padStart(2, '0');

export function LessonFinish({ title, n, gain, again, stats, keep, next, onNext, onDone }: LessonFinishProps) {
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

  const [beat, setBeat] = useState(0);
  const [pulse, setPulse] = useState(0);
  const [lvl, setLvl] = useState(m.before.n);
  const [count, setCount] = useState(still ? m.shown : 0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const at = (ms: number, f: () => void) => timers.current.push(setTimeout(f, ms));

  const head = useSharedValue(still ? 1 : 0);
  const ptsV = useSharedValue(still ? 1 : 0);
  const fly = useSharedValue(0);
  const bar = useSharedValue(still ? m.after.frac : m.before.frac);
  const say = useSharedValue(still ? 1 : 0);
  const lvPop = useSharedValue(1);
  const btn = useSharedValue(still ? 1 : 0);

  /* the points and the level bar, measured in the window, so the points fly from one into the other: to where the bar will
     end, or to its end when it fills to a new level */
  const root = useRef<ViewInstance>(null);
  const ptsRef = useRef<ViewInstance>(null);
  const trackRef = useRef<ViewInstance>(null);
  const [path, setPath] = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(null);
  const measure = () => {
    root.current?.measureInWindow((rx, ry) =>
      ptsRef.current?.measureInWindow((px, py, pw, ph) =>
        trackRef.current?.measureInWindow((tx, ty, tw, th) =>
          setPath({ x0: px - rx + pw / 2, y0: py - ry + ph / 2, x1: tx - rx + tw * (up ? 1 : m.after.frac), y1: ty - ry + th / 2 }),
        ),
      ),
    );
  };

  const all = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    for (const v of [head, ptsV, say, btn]) v.value = withTiming(1, { duration: still ? 0 : 180 });
    fly.value = 0;
    bar.value = withTiming(m.after.frac, { duration: still ? 0 : 200 });
    setLvl(m.after.n);
    setCount(m.shown);
    setBeat(2);
  };

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(`Lesson ${n} done. ${m.shown ? m.shown + ' points. ' : ''}${keep}`);
    if (still) {
      buzz('lit');
      setBeat(2);
      return;
    }
    setBeat(1);
    play('chime');
    knock(Haptics.ImpactFeedbackStyle.Medium);
    setPulse((p) => p + 1);
    head.value = withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) });
    const flying = m.shown > 0;
    let next = 600;
    if (flying) {
      /* the points pop in and count up */
      at(500, () => {
        knock(Haptics.ImpactFeedbackStyle.Light);
        ptsV.value = withSpring(1, { damping: 10, stiffness: 200 });
      });
      for (let k = 1; k <= 12; k++) at(560 + k * 30, () => setCount(Math.round((m.shown * k) / 12)));
      /* then fly down into the bar, a tick as each lands, and the bar fills with them */
      const flyAt = 1250;
      at(flyAt, () => {
        fly.value = withTiming(1, { duration: 600 + dots * 70, easing: Easing.linear });
      });
      for (let i = 0; i < dots; i++) at(flyAt + 380 + i * 70, () => buzz('tick'));
      const landed = flyAt + 420 + dots * 70;
      if (up) {
        bar.value = withDelay(flyAt + 380, withTiming(1, { duration: dots * 70 }));
        at(landed, () => {
          setLvl(m.after.n);
          buzz('lit');
          lvPop.value = 1.5;
          lvPop.value = withSpring(1, { damping: 7, stiffness: 180 });
          setPulse((p) => p + 1);
          bar.value = 0;
          bar.value = withTiming(m.after.frac, { duration: 450, easing: Easing.out(Easing.cubic) });
        });
      } else bar.value = withDelay(flyAt + 380, withTiming(m.after.frac, { duration: dots * 70 + 120, easing: Easing.out(Easing.cubic) }));
      next = landed + 350;
    }
    at(next, () => {
      say.value = withTiming(1, { duration: 300 });
    });
    at(next + 500, () => {
      setBeat(2);
      btn.value = withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) });
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const big = Math.min(win.width - 100, win.height * (SHORT ? 0.24 : 0.3), 270);
  const lvIn = useAnimatedStyle(() => ({ transform: [{ scale: lvPop.value }] }));
  const headIn = useAnimatedStyle(() => ({ opacity: head.value, transform: [{ translateY: 10 * (1 - head.value) }] }));
  const ptsIn = useAnimatedStyle(() => ({ opacity: Math.min(1, ptsV.value * 2), transform: [{ scale: interpolate(ptsV.value, [0, 1], [0.6, 1]) }] }));
  const sayIn = useAnimatedStyle(() => ({ opacity: say.value, transform: [{ translateY: 8 * (1 - say.value) }] }));
  const btnIn = useAnimatedStyle(() => ({ opacity: btn.value, transform: [{ translateY: 16 * (1 - btn.value) }] }));
  const barIn = useAnimatedStyle(() => ({ width: `${Math.max(0.04, Math.min(1, bar.value)) * 100}%` }));
  const ptsLeft = m.after.next == null ? null : m.after.toNext;

  return (
    <View ref={root} style={s.page} onLayout={measure}>
      <StatusBar style="light" />
      <LinearGradient colors={['#2A1E5C', '#5A3A78', '#C9787A']} locations={[0, 0.55, 1]} style={StyleSheet.absoluteFill} />
      <Pressable style={StyleSheet.absoluteFill} accessible={false} onPress={() => beat === 1 && all()} />
      <View style={[s.col, { paddingTop: inset.top + (SHORT ? 12 : 28) }]} pointerEvents="box-none">
        <Reanimated.View style={[s.bubble, sayIn]} pointerEvents="none">
          <Bubble text={keep} />
        </Reanimated.View>
        <View style={{ width: big, height: big, marginBottom: 12 }} pointerEvents="none">
          <BigFlame level={lvl} size={big} pulse={pulse} noLand />
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
        {m.shown > 0 ? (
          <Reanimated.View ref={ptsRef} onLayout={measure} style={[s.pts, ptsIn]} accessible accessibilityLabel={m.shown + ' points'}>
            <Text style={s.ptsNum}>+{count}</Text>
            <Text style={s.ptsWord}>points</Text>
          </Reanimated.View>
        ) : null}
        {!m.quiet ? (
          <View style={s.levelRow} accessible accessibilityLabel={`Level ${lvl}${ptsLeft != null ? ', ' + ptsLeft + ' points to the next' : ''}`}>
            <Reanimated.Text style={[s.levelText, lvIn]}>Level {lvl}</Reanimated.Text>
            <View ref={trackRef} onLayout={measure} style={s.track}>
              <Reanimated.View style={[s.fill, barIn]} />
            </View>
          </View>
        ) : null}
        <Reanimated.View style={[s.foot, btnIn]} pointerEvents={beat === 2 ? 'auto' : 'none'}>
          <Button label={next ? 'Next: ' + next.title : 'Done'} kind="warm" onPress={next ? onNext : onDone} />
          {next ? (
            <Pressable accessibilityRole="button" onPress={onDone} style={s.quiet} hitSlop={8}>
              <Text style={s.quietText}>Back to Today</Text>
            </Pressable>
          ) : null}
        </Reanimated.View>
      </View>

      {path && m.shown > 0 && !still ? <Fly v={fly} path={path} dots={dots} /> : null}
    </View>
  );
}

/** the points: gold sparks that leave the tile one after another and arc up into the flame */
function Fly({ v, path, dots }: { v: SharedValue<number>; path: { x0: number; y0: number; x1: number; y1: number }; dots: number }) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {Array.from({ length: dots }, (_, i) => (
        <Spark key={i} v={v} path={path} i={i} n={dots} />
      ))}
    </View>
  );
}
function Spark({ v, path, i, n }: { v: SharedValue<number>; path: { x0: number; y0: number; x1: number; y1: number }; i: number; n: number }) {
  const st = useAnimatedStyle(() => {
    /* each spark has its own slice of the run: it starts a little after the one before */
    const span = 0.55;
    const start = (i / Math.max(1, n - 1)) * (1 - span);
    const t = Math.max(0, Math.min(1, (v.value - start) / span));
    const e = t * t * (3 - 2 * t);
    /* a curve that bows out to one side, alternating, like Duolingo's gems */
    const side = i % 2 ? 1 : -1;
    const cx = (path.x0 + path.x1) / 2 + side * 70;
    const cy = Math.min(path.y0, path.y1) + (path.y0 - path.y1) * 0.35;
    const x = (1 - e) * (1 - e) * path.x0 + 2 * (1 - e) * e * cx + e * e * path.x1;
    const y = (1 - e) * (1 - e) * path.y0 + 2 * (1 - e) * e * cy + e * e * path.y1;
    return {
      opacity: t <= 0 || t >= 1 ? 0 : 1,
      transform: [{ translateX: x - 7 }, { translateY: y - 7 }, { scale: 1 - 0.45 * e }],
    };
  });
  return <Reanimated.View style={[s.spark, st]} />;
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#2A1E5C' },
  col: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 10 },
  bubble: { alignSelf: 'stretch', maxWidth: 340, marginHorizontal: 'auto' },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: 12, alignSelf: 'center', width: '100%', maxWidth: 340, marginBottom: 8 },
  levelText: { fontFamily: font.bodyBold, fontSize: 15, color: nightInk.ink },
  track: { flex: 1, height: 12, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.18)', overflow: 'hidden' },
  fill: { height: 12, borderRadius: 6, backgroundColor: GOLD },
  title: { fontFamily: font.display, fontSize: 34, color: nightInk.ink, textAlign: 'center' },
  sub: { fontFamily: font.bodySemi, fontSize: 15, color: nightInk.muted, textAlign: 'center', marginTop: 2 },
  dock: { paddingHorizontal: 16, gap: 16 },
  pts: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 8 },
  ptsNum: { fontFamily: font.display, fontSize: 48, color: GOLD },
  ptsWord: { fontFamily: font.bodyBold, fontSize: 20, color: GOLD },
  foot: { gap: 4 },
  quiet: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  quietText: { fontFamily: font.bodySemi, fontSize: 15, color: nightInk.ink },
  spark: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: GOLD,
    shadowColor: GOLD,
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },
});
