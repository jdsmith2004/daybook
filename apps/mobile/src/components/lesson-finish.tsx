/* The end of a lesson (the owner, November 12, 2026: "i want the celebrations to be better and to show them getting points just like
   duolingo"). One page, after the last card (app/lesson/[id].tsx hands over here). Built from Duolingo's lesson end, beat by beat,
   with the flame as the one living thing:
   1. the flame blooms and "Lesson 4 done" rises (a chime when sound is on);
   2. the tiles land one at a time, each with a knock, their numbers counting up: the points it earned, how long it took, and the
      answers in a row (only from 3; it never goes down) or the cards read;
   3. the points fly from their tile up into the flame, a tick as each lands, and the level bar under the flame fills with them;
      a new level lights the bar and the flame blooms (Success);
   4. the flame says the one line to keep, in its cream bubble;
   5. only then the button: Next, with Back to Today quietly under it, or Done.
   About three seconds; a tap anywhere brings it all in at once. Reduce Motion: everything in, settled, one knock.
   In the hours after a slip (core ptsQuiet) the points are not shown or flown, as everywhere else: the lesson itself is the win.
   A lesson read again earns no points, so nothing flies; its tile says Read again. */
import { gameCompute, levelOf, ptsQuiet } from '@daybook/core';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
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
const INK = '#2B1F57';
/* the tiles' fills: the sun for points, the sky for time, the mint for answers */
const TILE = { pts: '#FFD25A', time: '#9FD3FF', run: '#8FE3B0' };

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
  const level = Math.max(1, m.after.n);
  const tiles = useMemo(() => {
    const t: { key: keyof typeof TILE; label: string; value: number; show: (v: number) => string }[] = [];
    if (!m.quiet) t.push({ key: 'pts', label: again ? 'Read again' : 'Points', value: m.shown, show: (v) => (again ? '✓' : '+' + Math.round(v)) });
    t.push({ key: 'time', label: 'Time', value: stats.secs, show: (v) => fmtTime(v) });
    if (stats.combo >= 3) t.push({ key: 'run', label: 'In a row', value: stats.combo, show: (v) => String(Math.round(v)) });
    else t.push({ key: 'run', label: 'Cards', value: stats.cards, show: (v) => String(Math.round(v)) });
    return t;
  }, [m, again, stats]);

  const [beat, setBeat] = useState(0);
  const [pulse, setPulse] = useState(0);
  const [lvl, setLvl] = useState(m.before.n);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const at = (ms: number, f: () => void) => timers.current.push(setTimeout(f, ms));

  const head = useSharedValue(still ? 1 : 0);
  const tileV = [useSharedValue(still ? 1 : 0), useSharedValue(still ? 1 : 0), useSharedValue(still ? 1 : 0)];
  const fly = useSharedValue(0);
  const bar = useSharedValue(still ? (m.after.n > m.before.n ? m.after.frac : m.after.frac) : m.before.frac);
  const say = useSharedValue(still ? 1 : 0);
  const lvPop = useSharedValue(1);
  const btn = useSharedValue(still ? 1 : 0);
  const [counts, setCounts] = useState<number[]>(() => tiles.map((t) => (still ? t.value : 0)));

  /* the flame and the points tile, measured in the window, so the points fly from one to the other */
  const root = useRef<ViewInstance>(null);
  const flameRef = useRef<ViewInstance>(null);
  const tileRef = useRef<ViewInstance>(null);
  const [path, setPath] = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(null);
  const measure = () => {
    root.current?.measureInWindow((rx, ry) =>
      flameRef.current?.measureInWindow((fx, fy, fw, fh) =>
        tileRef.current?.measureInWindow((tx, ty, tw, th) =>
          setPath({ x0: tx - rx + tw / 2, y0: ty - ry + th / 2, x1: fx - rx + fw / 2, y1: fy - ry + fh * 0.45 }),
        ),
      ),
    );
  };

  const all = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    for (const v of [head, ...tileV, say, btn]) v.value = withTiming(1, { duration: still ? 0 : 180 });
    fly.value = 0;
    bar.value = withTiming(m.after.frac, { duration: still ? 0 : 200 });
    setLvl(m.after.n);
    setCounts(tiles.map((t) => t.value));
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
    /* the tiles, one at a time, counting up */
    tiles.forEach((t, i) => {
      const t0 = 450 + i * 300;
      at(t0, () => {
        knock(Haptics.ImpactFeedbackStyle.Light);
        tileV[i].value = withSpring(1, { damping: 10, stiffness: 200 });
      });
      const steps = 10;
      for (let k = 1; k <= steps; k++) at(t0 + 60 + k * 32, () => setCounts((c) => c.map((v, j) => (j === i ? (t.value * k) / steps : v))));
    });
    /* the points fly into the flame */
    const flyAt = 450 + tiles.length * 300 + 250;
    const flying = m.shown > 0;
    if (flying) {
      const dots = Math.min(8, Math.max(3, Math.round(m.shown / 5)));
      at(flyAt, () => {
        fly.value = withTiming(1, { duration: 700 + dots * 70, easing: Easing.linear });
      });
      for (let i = 0; i < dots; i++) at(flyAt + 520 + i * 70, () => buzz('tick'));
      const up = m.after.n > m.before.n;
      const landed = flyAt + 520 + dots * 70;
      if (up) {
        bar.value = withDelay(flyAt + 500, withTiming(1, { duration: 400 }));
        at(landed, () => {
          setLvl(m.after.n);
          buzz('lit');
          lvPop.value = 1.5;
          lvPop.value = withSpring(1, { damping: 7, stiffness: 180 });
          setPulse((p) => p + 1);
          bar.value = 0;
          bar.value = withTiming(m.after.frac, { duration: 450, easing: Easing.out(Easing.cubic) });
        });
      } else {
        bar.value = withDelay(flyAt + 500, withTiming(m.after.frac, { duration: dots * 70 + 200, easing: Easing.out(Easing.cubic) }));
        at(landed, () => setPulse((p) => p + 1));
      }
    }
    const sayAt = flying ? flyAt + 1300 : flyAt;
    at(sayAt, () => {
      say.value = withTiming(1, { duration: 300 });
    });
    at(sayAt + 500, () => {
      setBeat(2);
      btn.value = withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) });
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const big = Math.min(win.width - 120, win.height * (SHORT ? 0.24 : 0.28), 260);
  const lvIn = useAnimatedStyle(() => ({ transform: [{ scale: lvPop.value }] }));
  const headIn = useAnimatedStyle(() => ({ opacity: head.value, transform: [{ translateY: 10 * (1 - head.value) }] }));
  const sayIn = useAnimatedStyle(() => ({ opacity: say.value, transform: [{ translateY: 8 * (1 - say.value) }] }));
  const btnIn = useAnimatedStyle(() => ({ opacity: btn.value, transform: [{ translateY: 16 * (1 - btn.value) }] }));
  const barIn = useAnimatedStyle(() => ({ width: `${Math.max(0, Math.min(1, bar.value)) * 100}%` }));
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
        <View ref={flameRef} style={{ width: big, height: big }} onLayout={measure} pointerEvents="none">
          <BigFlame level={lvl} size={big} pulse={pulse} noLand />
        </View>
        {!m.quiet ? (
          <View style={s.levelRow} accessible accessibilityLabel={`Level ${lvl}${ptsLeft != null ? ', ' + ptsLeft + ' points to the next' : ''}`}>
            <Reanimated.Text style={[s.levelText, lvIn]}>Level {lvl}</Reanimated.Text>
            <View style={s.track}>
              <Reanimated.View style={[s.fill, barIn]} />
            </View>
          </View>
        ) : null}
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
        <View style={s.tiles}>
          {tiles.map((t, i) => (
            <Tile
              key={t.key}
              v={tileV[i]}
              color={TILE[t.key]}
              label={t.label}
              value={t.show(counts[i] ?? 0)}
              onRef={t.key === 'pts' ? tileRef : undefined}
              onLayout={measure}
            />
          ))}
        </View>
        <Reanimated.View style={[s.foot, btnIn]} pointerEvents={beat === 2 ? 'auto' : 'none'}>
          <Button label={next ? 'Next: ' + next.title : 'Done'} kind="warm" onPress={next ? onNext : onDone} />
          {next ? (
            <Pressable accessibilityRole="button" onPress={onDone} style={s.quiet} hitSlop={8}>
              <Text style={s.quietText}>Back to Today</Text>
            </Pressable>
          ) : null}
        </Reanimated.View>
      </View>

      {path && m.shown > 0 && !still ? <Fly v={fly} path={path} dots={Math.min(8, Math.max(3, Math.round(m.shown / 5)))} /> : null}
    </View>
  );
}

function Tile({
  v,
  color,
  label,
  value,
  onRef,
  onLayout,
}: {
  v: SharedValue<number>;
  color: string;
  label: string;
  value: string;
  onRef?: React.RefObject<ViewInstance | null>;
  onLayout: () => void;
}) {
  const st = useAnimatedStyle(() => ({ opacity: Math.min(1, v.value * 2), transform: [{ scale: interpolate(v.value, [0, 1], [0.6, 1]) }] }));
  return (
    <Reanimated.View style={[s.tile, { backgroundColor: color }, st]} ref={onRef} onLayout={onLayout} accessible accessibilityLabel={label + ': ' + value}>
      <Text style={s.tileLabel}>{label}</Text>
      <Text style={s.tileValue}>{value}</Text>
    </Reanimated.View>
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
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%', maxWidth: 300, marginTop: 8 },
  levelText: { fontFamily: font.bodyBold, fontSize: 15, color: nightInk.ink },
  track: { flex: 1, height: 12, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.18)', overflow: 'hidden' },
  fill: { height: 12, borderRadius: 6, backgroundColor: GOLD },
  title: { fontFamily: font.display, fontSize: 34, color: nightInk.ink, textAlign: 'center' },
  sub: { fontFamily: font.bodySemi, fontSize: 15, color: nightInk.muted, textAlign: 'center', marginTop: 2 },
  dock: { paddingHorizontal: 16, gap: 20 },
  tiles: { flexDirection: 'row', gap: 12, justifyContent: 'center' },
  tile: { flex: 1, maxWidth: 120, borderRadius: 20, paddingVertical: 12, paddingHorizontal: 8, alignItems: 'center', gap: 2 },
  tileLabel: { fontFamily: font.bodySemi, fontSize: 13, color: INK },
  tileValue: { fontFamily: font.display, fontSize: 28, color: INK },
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
