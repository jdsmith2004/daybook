/* The end of a lesson: the earned moment after the last card (app/lesson/[id].tsx hands over here).
   Redone calm (the owner, November 14, 2026: "take a look at the perfect lesson from the duolingo and how smooth the transition is
   theres no bouncing and it's very clean", and "the app has too much confetti it needs more subtelty"). Built from the timing of
   Duolingo's perfect-lesson end, studied frame by frame: the band glides in once, holds while it drifts a little, the mascot
   settles into its place in one continuous move, and each thing after it arrives once, by fading and rising a few points, and
   stays. Nothing springs, overshoots, pops or shakes; every move is a timing curve that ends at rest.
   1. the opener: a tilted band glides in across the night with the flame big inside it, "Lesson 4 done" rises under it, and a
      few gold glints drift away from the words (a chime when sound is on, one success buzz);
   2. the band fades as the flame travels and shrinks into its place, in one move, and the title, its warm halo and a few faint
      stars come in around it;
   3. the points rise in low and count up, then glide into the level line and are gone into it as it fills; a new level turns
      the label over and the flame blooms once;
   4. the lessons line fills by this one;
   Each line runs to its next milestone, a round mark at its end (the next level; the end of this step of the path), and never
   says what it is out of (the owner, November 14, 2026: "show it in perspective to the next milestone ... don't say what it's
   out of");
   5. the flame says the one line to keep, and the one button, Continue, back to wherever the lesson was opened.
   About four seconds; a tap anywhere brings it all in at once. Reduce Motion: no opener, everything in and settled, one buzz.
   In the hours after a slip (core ptsQuiet) the points and the level line are not shown, as everywhere else: the lesson itself
   is the win. A lesson read again earns no points, so nothing glides. */
import { gameCompute, lessonCount, lessonWalk, levelOf, LOOKS, ptsQuiet, stepProgress, type Look } from '@daybook/core';
import { router } from 'expo-router';
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
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from 'react-native-svg';

import { BigFlame } from '@/components/big-flame';
import { SHORT } from '@/components/fit';
import { Bubble } from '@/components/lesson-flame';
import { Icon } from '@/components/ui';
import { Text } from '@/components/text';
import { buzz } from '@/lib/feel';
import { pulseOffered } from '@/lib/pulse';
import { useReducedMotion } from '@/lib/motion';
import { play } from '@/lib/sound';
import { useStore } from '@/lib/store';
import { font, nightInk } from '@/lib/theme';

const GOLD = '#FFD25A';
/** each face's place in core LOOKS */
const LOOK = Object.fromEntries(LOOKS.map((k, i) => [k, i])) as Record<(typeof LOOKS)[number], number>;
const NIGHT = '#16113A';
const BAND = '#2E2477';
const LIP = '#D99A12';
const ORANGE = '#FF9A2E';
/** the lessons line, apart from the gold of the points and the level */
const MINT = '#5EE0B5';
/** a four-point star, in a 24 box */
const STAR = 'M12 0C13 8 16 11 24 12C16 13 13 16 12 24C11 16 8 13 0 12C8 11 11 8 12 0Z';
/* the curves: things arrive decelerating, travel easing both ways, and nothing passes its mark */
const OUT = Easing.out(Easing.cubic);
const BOTH = Easing.inOut(Easing.cubic);

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
  /** kept for the lesson player; the page has one button, back to where the lesson was opened (onDone) */
  next: { id: string; title: string } | null;
  onNext: () => void;
  onDone: () => void;
  /** the same moment for another win (the Sunday review): its words in place of "Lesson 4 done" */
  head?: string;
  /** its second line in place of the lessons line: a label, a word on the right, and where it fills from and to (0 to 1) */
  line?: { label: string; right?: string; from: number; to: number } | null;
  /** the button's word (Continue) */
  button?: string;
  /** the quiet "Feedback on this lesson" link, on for a lesson */
  feedback?: boolean;
  /** the opener: the band (a lesson), or dawn (the Sunday review): no band, the flame rises from below like a sun into a warm
      horizon, and a row of marks (the goal's nights or days) lights one by one under the title */
  look?: 'band' | 'dawn';
  marks?: number;
  /** a checkpoint this lesson completed, offered and never required (the owner, November 15, 2026): a quiet row above Continue */
  offer?: { title: string; sub: string; onPress: () => void } | null;
}

/* when each beat starts, in ms */
const T = {
  /** the band and the flame glide in */
  inMs: 420,
  /** the band opens from a line across the middle, and the flame slides in once it is open */
  slitMs: 260,
  slideAt: 160,
  /** the opener holds, then the flame travels to its place */
  settle: 1350,
  settleMs: 560,
  /** the title, the halo and the two lines come in as the flame arrives */
  rest: 1650,
  /** the points rise in and count up */
  pts: 2000,
  /** the points glide into the level line */
  glide: 2700,
  glideMs: 600,
  /** the level line fills */
  fillMs: 700,
};

type Line = { x0: number; y0: number; x1: number; y1: number };
/* name: the step the lesson is in, the milestone the line runs to; null when the line is the whole path */
type Lessons = { name: string | null; from: number; to: number };

export function LessonFinish({
  lessonId,
  title,
  n,
  gain,
  again,
  keep,
  onDone,
  head,
  line,
  button = 'Continue',
  feedback = true,
  look: kind = 'band',
  marks = 0,
  offer = null,
}: LessonFinishProps) {
  const dawn = kind === 'dawn';
  const done = head ?? 'Lesson ' + n + ' done';
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
  const up = m.after.n > m.before.n;
  /* with the level line hidden (the hours after a slip) nothing is shown; with it, the points end up inside it */
  const flying = m.shown > 0 && !m.quiet;
  /* the lessons line runs to the next milestone, the end of this step (the owner, November 14, 2026: "show it in perspective to
     the next milestone ... don't say what it's out of"), this one included (it is recorded before this page); a read again adds
     nothing. A lesson off the path runs along the whole path. */
  const [lessons] = useState<Lessons | null>(() => {
    if (line !== undefined) return line ? { name: line.right ?? null, from: line.from, to: line.to } : null;
    if (!st) return null;
    const w = lessonWalk(snap.days, st);
    const p = stepProgress(w, lessonId);
    const c = p ?? lessonCount(w);
    if (!c.of) return null;
    const before = again ? c.done : Math.max(0, c.done - 1);
    return { name: p ? p.name : null, from: before / c.of, to: c.done / c.of };
  });

  const [beat, setBeat] = useState(still ? 2 : 0);
  const [pulse, setPulse] = useState(0);
  const [lvl, setLvl] = useState(still ? m.after.n : m.before.n);
  const [count, setCount] = useState(still ? m.shown : 0);
  /* the points to the next level, as they stand before the points land and after */
  const [landed, setLanded] = useState(still || !flying);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const at = (ms: number, f: () => void) => timers.current.push(setTimeout(f, ms));

  /* the opener: enter 0 = not yet, 1 = in; open 1 = the flame big in the band, 0 = settled in its place */
  const enter = useSharedValue(still ? 1 : 0);
  const open = useSharedValue(still ? 0 : 1);
  const drift = useSharedValue(0);
  /* the band opening, from a line to its full height */
  const slit = useSharedValue(still ? 1 : 0);
  const shout = useSharedValue(0);
  const glint = useSharedValue(0);
  /* the page at rest */
  const rest = useSharedValue(still ? 1 : 0);
  const ptsV = useSharedValue(still ? 1 : 0);
  /* 0 = the points where they rose, 1 = gone into the level line */
  const go = useSharedValue(still ? 1 : 0);
  const bar = useSharedValue(still ? m.after.frac : m.before.frac);
  const lvFade = useSharedValue(1);
  const lessonsV = useSharedValue(still ? 1 : 0);
  const lessonsFill = useSharedValue(still || !lessons ? (lessons?.to ?? 0) : lessons.from);
  const say = useSharedValue(still ? 1 : 0);
  const btn = useSharedValue(still ? 1 : 0);
  /* dawn: the marks lit so far, one by one */
  const lit = useSharedValue(still ? marks : 0);
  /* the flame acting, as Duolingo's owl does on its finish (the owner, November 14, 2026: "the owl has like clever movements"):
     its eyes (0 open, 1 shut), a slow sway on its feet once it is home, and a nod toward the level line as the points land */
  const look = useSharedValue(0);
  const sway = useSharedValue(0);
  const nod = useSharedValue(0);
  /* the flame settling its weight as it lands home: a soft squash that eases out, never past its shape */
  const land = useSharedValue(0);
  /* the head going a little way with a glance, in degrees */
  const lean = useSharedValue(0);
  /* the line to keep writes itself out, letter by letter, once the flame says it */
  const [typed, setTyped] = useState(still ? keep.length : 0);

  /* the flame, the points and the level line, measured in the window: the flame starts in the middle of the screen, and the
     points glide from where they rose into the line (to where it will end, or to its end when it fills to a new level) */
  const root = useRef<ViewInstance>(null);
  const flameRef = useRef<ViewInstance>(null);
  const ptsRef = useRef<ViewInstance>(null);
  const trackRef = useRef<ViewInstance>(null);
  const [path, setPath] = useState<Line | null>(null);
  const [spot, setSpot] = useState<{ x: number; y: number } | null>(null);
  const measure = () => {
    root.current?.measureInWindow((rx, ry) => {
      flameRef.current?.measureInWindow((fx, fy, fw, fh) => setSpot({ x: fx - rx + fw / 2, y: fy - ry + fh / 2 }));
      ptsRef.current?.measureInWindow((px, py, pw, ph) =>
        trackRef.current?.measureInWindow((tx, ty, tw, th) =>
          setPath({ x0: px - rx + pw / 2, y0: py - ry + ph / 2, x1: tx - rx + tw * Math.max(0.04, up ? 1 : m.after.frac), y1: ty - ry + th / 2 }),
        ),
      );
    });
  };

  const big = Math.min(win.width - 120, win.height * (SHORT ? 0.22 : 0.27), 240);
  /* how big the flame is in the opener, and where: a little above the middle, the words under it */
  const K = Math.min(1.6, (win.width * 0.9) / big);
  const B = Math.round(big * K);
  const midY = win.height * 0.4;
  const dy = spot ? midY - spot.y : 0;
  const shoutY = midY + B * 0.42;
  const bandTop = midY - B * 0.4;
  const bandH = B * 0.82 + 96;

  /* a tap during the opener brings everything in at once, settled */
  const all = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    const q = { duration: 220, easing: OUT };
    enter.value = withTiming(1, q);
    open.value = withTiming(0, q);
    shout.value = withTiming(0, q);
    glint.value = 1;
    for (const v of [rest, ptsV, go, lessonsV, say, btn]) v.value = withTiming(1, q);
    lvFade.value = 1;
    bar.value = withTiming(m.after.frac, q);
    if (lessons) lessonsFill.value = withTiming(lessons.to, q);
    setLvl(m.after.n);
    setCount(m.shown);
    setTyped(keep.length);
    slit.value = 1;
    lit.value = marks;
    look.value = 0;
    lean.value = 0;
    nod.value = withTiming(0, q);
    setLanded(true);
    setBeat(2);
  };

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(`${done}. ${flying ? m.shown + ' points. ' : ''}${keep}`);
    if (still) {
      buzz('lit');
      return;
    }
    setBeat(1);
    /* 1. the band and the flame glide in, the words rise under them, a few glints drift off */
    play('chime');
    buzz('lit');
    slit.value = withTiming(1, { duration: T.slitMs, easing: OUT });
    enter.value = withDelay(T.slideAt, withTiming(1, { duration: dawn ? 1000 : T.inMs, easing: OUT }));
    drift.value = withTiming(1, { duration: T.settle + T.settleMs, easing: Easing.linear });
    shout.value = withDelay(T.slideAt + 260, withTiming(1, { duration: 420, easing: OUT }));
    glint.value = withDelay(T.slideAt + 300, withTiming(1, { duration: 1700, easing: Easing.linear }));
    /* the flame comes home pleased with itself: a happy squint, then it sways a little on its feet and acts, at no exact beat, for
       as long as the page is open: a glance one way and the other, a sly look, a quick squint (the faces are core LOOKS) */
    const home = T.settle + T.settleMs;
    /* a move plays a few poses in a row, holds, and plays them back, so the eyes turn and the lids slide (core LOOKS); a glance takes the
       head a little way with it */
    const MOVES: Record<string, { go: Look[]; back: Look[]; ms: number; lean?: number }> = {
      blink: { go: ['b1', 'b2'], back: ['b1', 'ahead'], ms: 34 },
      glance: { go: ['l1', 'l2', 'l3'], back: ['l2', 'l1', 'ahead'], ms: 32, lean: -2.6 },
      sly: { go: ['s1', 's2', 's3'], back: ['s2', 's1', 'ahead'], ms: 46 },
      slyLeft: { go: ['l1', 'l2', 'l3', 'sl1', 'sl2', 'sl3'], back: ['sl2', 'sl1', 'l2', 'l1', 'ahead'], ms: 38, lean: -2 },
      down: { go: ['d1', 'd2'], back: ['d1', 'ahead'], ms: 40 },
      happy: { go: ['b1', 'happy'], back: ['b1', 'ahead'], ms: 40 },
    };
    const move = (name: keyof typeof MOVES, hold: number) => {
      const m = MOVES[name];
      m.go.forEach((k, i) => at(i * m.ms, () => (look.value = LOOK[k])));
      const back = m.go.length * m.ms + hold;
      m.back.forEach((k, i) => at(back + i * m.ms, () => (look.value = LOOK[k])));
      if (m.lean) {
        lean.value = withTiming(m.lean, { duration: 280, easing: BOTH });
        at(back, () => (lean.value = withTiming(0, { duration: 340, easing: BOTH })));
      }
    };
    const face = move;
    at(home - 80, () => {
      face('happy', 680);
      buzz('land');
      land.value = withSequence(withTiming(1, { duration: 110, easing: OUT }), withTiming(0, { duration: 420, easing: OUT }));
    });
    sway.value = withDelay(home + 300, withRepeat(withTiming(1, { duration: 1700, easing: Easing.inOut(Easing.sin) }), -1, true));
    /* [the move, how long it holds, the pause before it]: blinks between the looks, at no exact beat, the way a face rests */
    const acts: [keyof typeof MOVES, number, number][] = [
      ['blink', 60, 1300],
      ['glance', 760, 1500],
      ['blink', 60, 500],
      ['sly', 1200, 2100],
      ['blink', 60, 2400],
      ['slyLeft', 1000, 1700],
      ['blink', 60, 2900],
      ['happy', 520, 1900],
    ];
    /* after the points have gone in and any new level has turned over */
    let t = home + 2000;
    for (let round = 0; round < 4; round++)
      for (const [k, hold, gap] of acts) {
        t += gap;
        const at0 = t;
        at(at0, () => face(k, hold));
        t += hold + 400;
      }
    /* 2. one continuous move: the band fades as the flame travels to its place */
    open.value = withDelay(T.settle, withTiming(0, { duration: T.settleMs, easing: BOTH }));
    rest.value = withDelay(T.rest, withTiming(1, { duration: 480, easing: OUT }));
    if (dawn && marks) {
      lit.value = withDelay(T.rest + 200, withTiming(marks, { duration: marks * 160, easing: Easing.linear }));
      for (let k = 1; k <= marks; k++) at(T.rest + 200 + k * 160, () => buzz('tick'));
    }
    lessonsV.value = withDelay(T.rest + 120, withTiming(1, { duration: 480, easing: OUT }));
    let next = T.rest + 450;
    if (flying) {
      /* 3. the points rise in and count up, then glide into the level line, which fills */
      ptsV.value = withDelay(T.pts, withTiming(1, { duration: 360, easing: OUT }));
      const steps = 16;
      for (let k = 1; k <= steps; k++) {
        const e = 1 - Math.pow(1 - k / steps, 2);
        at(T.pts + e * 520, () => {
          setCount(Math.round((m.shown * k) / steps));
          /* a faint click as the number climbs, as Duolingo's does, every few steps so it never buzzes */
          if (k % 4 === 0) buzz('tick');
        });
      }
      go.value = withDelay(T.glide, withTiming(1, { duration: T.glideMs, easing: BOTH }));
      const into = T.glide + T.glideMs - 120;
      /* the flame looks down at the line as the points go in, and back up */
      at(T.glide, () => face('down', T.glideMs + 260));
      nod.value = withDelay(
        T.glide,
        withSequence(withTiming(1, { duration: T.glideMs, easing: BOTH }), withDelay(260, withTiming(0, { duration: 520, easing: BOTH }))),
      );
      at(into, () => {
        buzz('land');
        if (!up) setLanded(true);
      });
      if (up) {
        /* to the end, the label turns over (a soft dip, never a pop), and it fills again from nothing */
        bar.value = withDelay(into, withTiming(1, { duration: 480, easing: Easing.in(Easing.quad) }));
        const turn = into + 480;
        lvFade.value = withDelay(turn - 160, withSequence(withTiming(0, { duration: 160 }), withTiming(1, { duration: 300, easing: OUT })));
        at(turn, () => {
          setLvl(m.after.n);
          setLanded(true);
          buzz('lit');
          setPulse((p) => p + 1);
          face('happy', 600);
          bar.value = 0;
          bar.value = withTiming(m.after.frac, { duration: 520, easing: OUT });
        });
        next = turn + 560;
      } else {
        bar.value = withDelay(into, withTiming(m.after.frac, { duration: T.fillMs, easing: OUT }));
        next = into + T.fillMs - 100;
      }
    }
    /* 4. the lessons line fills by this one, 5. as it does, the line to keep and the button come in */
    if (lessons) {
      lessonsFill.value = withDelay(next, withTiming(lessons.to, { duration: 600, easing: OUT }));
      at(next + 560, () => buzz(lessons.to >= 1 ? 'land' : 'tick'));
      next += 200;
    }
    say.value = withDelay(next, withTiming(1, { duration: 300, easing: OUT }));
    for (let k = 1; k <= keep.length; k++) at(next + 160 + k * 26, () => setTyped(k));
    btn.value = withDelay(next + 200, withTiming(1, { duration: 420, easing: OUT }));
    at(next + 200, () => setBeat(2));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* the flame is drawn at its opener size and scaled down to rest, never up past 1: iOS scales the drawn picture, so scaling
     up made it soft (the owner, November 13, 2026: "super low resolution") */
  const flameIn = useAnimatedStyle(() =>
    dawn
      ? {
          /* dawn: up from below the horizon, slowly, then home */
          opacity: still || spot ? Math.min(1, enter.value * 1.6) : 0,
          transform: [
            { translateY: win.height * 0.42 * (1 - enter.value) + dy * open.value },
            { scale: ((1 + (K - 1) * open.value) / K) * (1 + 0.06 * drift.value * open.value) },
          ],
        }
      : {
          opacity: still || spot ? Math.min(1, enter.value * 1.4) : 0,
          transform: [
            { translateX: -win.width * 0.75 * (1 - enter.value) },
            { translateY: dy * open.value },
            /* the camera pushes in slowly while the opener holds, as Duolingo's does */
            { scale: ((1 + (K - 1) * open.value) / K) * (0.92 + 0.08 * enter.value) * (1 + 0.1 * drift.value * open.value) },
          ],
        },
  );
  /* the band opens from a line across the middle (the owner, November 14, 2026: "the lightning starts in the middle and opens
     vertically"), drifts a little while it holds, and as the flame leaves it, it rises away and fades */
  const bandIn = useAnimatedStyle(() => ({
    opacity: Math.min(1, slit.value * 3) * interpolate(open.value, [0.2, 0.9], [0, 1], 'clamp'),
    transform: [
      { translateY: -win.height * 0.22 * (1 - open.value) },
      { translateX: 16 * drift.value },
      { rotate: '-8deg' },
      { scaleY: Math.max(0.02, slit.value) },
      { scale: 1 + 0.08 * drift.value },
    ],
  }));
  const shoutIn = useAnimatedStyle(() => ({
    opacity: shout.value * interpolate(open.value, [0.55, 1], [0, 1], 'clamp'),
    transform: [{ translateY: 10 * (1 - shout.value) }, { scale: 0.9 + 0.1 * shout.value }],
  }));
  const actIn = useAnimatedStyle(() => ({
    transform: [
      { translateY: 4 * nod.value },
      { rotate: `${(sway.value * 2 - 1) * 2.2 * rest.value + 4 * nod.value + lean.value}deg` },
      { scaleX: 1 + 0.05 * land.value },
      { scaleY: 1 - 0.07 * land.value },
    ],
  }));
  const restIn = useAnimatedStyle(() => ({ opacity: rest.value, transform: [{ translateY: 8 * (1 - rest.value) }] }));
  const ptsIn = useAnimatedStyle(() => {
    const e = go.value;
    const p = path;
    return {
      opacity: ptsV.value * (1 - interpolate(e, [0.55, 0.95], [0, 1], 'clamp')),
      transform: [{ translateX: p ? (p.x1 - p.x0) * e : 0 }, { translateY: (p ? (p.y1 - p.y0) * e : 0) + 8 * (1 - ptsV.value) }, { scale: 1 - 0.55 * e }],
    };
  });
  const lvIn = useAnimatedStyle(() => ({ opacity: lvFade.value }));
  const barIn = useAnimatedStyle(() => ({ width: `${Math.max(0.04, Math.min(1, bar.value)) * 100}%` }));
  const lessonsIn = useAnimatedStyle(() => ({ opacity: lessonsV.value, transform: [{ translateY: 8 * (1 - lessonsV.value) }] }));
  const lessonsBar = useAnimatedStyle(() => ({ width: `${Math.max(0.04, Math.min(1, lessonsFill.value)) * 100}%` }));
  const sayIn = useAnimatedStyle(() => ({ opacity: say.value, transform: [{ translateY: 8 * (1 - say.value) }] }));
  const btnIn = useAnimatedStyle(() => ({ opacity: btn.value, transform: [{ translateY: 12 * (1 - btn.value) }] }));
  const lv = landed ? m.after : m.before;
  const ptsLeft = lv.next == null ? null : lv.toNext;
  const stepDone = !!lessons && lessons.to >= 1;

  return (
    <View ref={root} style={s.page} onLayout={measure}>
      <StatusBar style="light" />
      {dawn ? <Dawn v={enter} open={open} w={win.width} h={win.height} /> : null}
      {!still && !dawn ? (
        <Reanimated.View pointerEvents="none" style={[s.band, { width: win.width * 1.6, height: bandH, left: -win.width * 0.3, top: bandTop }, bandIn]} />
      ) : null}
      <Pressable style={StyleSheet.absoluteFill} accessible={false} onPress={() => beat === 1 && all()} />
      <View style={[s.col, { paddingTop: inset.top + (SHORT ? 12 : 28) }]} pointerEvents="box-none">
        <Reanimated.View style={[s.bubble, sayIn]} pointerEvents="none">
          <Bubble text={keep} shown={typed} />
        </Reanimated.View>
        <View ref={flameRef} onLayout={measure} style={{ width: big, height: big, marginVertical: 14 }} pointerEvents="none">
          <Halo v={rest} size={big} still={still} />
          <Sparkles v={rest} size={big} still={still} />
          <Reanimated.View style={[{ position: 'absolute', width: B, height: B, left: (big - B) / 2, top: (big - B) / 2 }, flameIn]}>
            <Reanimated.View style={[{ transformOrigin: '50% 88%' }, actIn]}>
              <BigFlame level={lvl} size={B} pulse={pulse} noLand look={still ? undefined : look} />
            </Reanimated.View>
          </Reanimated.View>
        </View>
        <Reanimated.View style={restIn}>
          <Text style={s.title} accessibilityRole="header">
            {done}
          </Text>
          <Text style={s.sub} numberOfLines={1}>
            {title}
          </Text>
          {dawn && marks ? <Marks v={lit} n={marks} /> : null}
        </Reanimated.View>
      </View>

      <View style={[s.dock, { paddingBottom: inset.bottom + (SHORT ? 12 : 20) }]} pointerEvents="box-none">
        {flying ? (
          <Reanimated.View ref={ptsRef} onLayout={measure} style={[s.pts, ptsIn]} accessible accessibilityLabel={m.shown + ' points'}>
            <Svg width={30} height={30} viewBox="0 0 24 24">
              <Path d={STAR} fill={GOLD} />
            </Svg>
            <Text style={s.ptsNum}>+{count}</Text>
            <Text style={s.ptsWord}>points</Text>
          </Reanimated.View>
        ) : null}
        {!m.quiet ? (
          <Reanimated.View
            style={[s.lineBox, restIn]}
            accessible
            accessibilityLabel={`Level ${lvl}${ptsLeft != null ? ', ' + ptsLeft + ' points to the next' : ''}`}>
            <Reanimated.Text style={[s.lineLabel, lvIn]}>Level {lvl}</Reanimated.Text>
            <View style={s.lineRow}>
              <View ref={trackRef} onLayout={measure} style={s.track}>
                <Reanimated.View style={[s.fill, barIn]}>
                  <View style={s.shine} />
                </Reanimated.View>
              </View>
              {/* the milestone at the end of the line: the next level, lit when the line reaches it */}
              {ptsLeft != null ? (
                <Reanimated.View style={[s.goal, lvIn]}>
                  <Text style={s.goalNum}>{lvl + 1}</Text>
                </Reanimated.View>
              ) : null}
            </View>
          </Reanimated.View>
        ) : null}
        {lessons ? (
          <Reanimated.View
            style={[s.lineBox, lessonsIn]}
            accessible
            accessibilityLabel={`${line ? line.label : 'Lesson ' + n}${lessons.name ? (line ? ', ' : ', on the way to the end of ') + lessons.name : ''}`}>
            <View style={s.lineHead}>
              <Text style={s.lineLabel}>{line ? line.label : 'Lesson ' + n}</Text>
              {lessons.name ? (
                <Text style={s.lineRight} numberOfLines={1}>
                  {lessons.name}
                </Text>
              ) : null}
            </View>
            <View style={s.lineRow}>
              <View style={s.track}>
                <Reanimated.View style={[s.fill, s.fillLessons, lessonsBar]}>
                  <View style={s.shine} />
                </Reanimated.View>
              </View>
              {/* the milestone: the end of the step, a star that is full once the step is done */}
              <View style={[s.goal, s.goalLessons, stepDone && s.goalLessonsOn]}>
                <Svg width={14} height={14} viewBox="0 0 24 24">
                  <Path d={STAR} fill={stepDone ? NIGHT : MINT} />
                </Svg>
              </View>
            </View>
          </Reanimated.View>
        ) : null}
        <Reanimated.View style={btnIn} pointerEvents={beat === 2 ? 'auto' : 'none'}>
          {/* the checkpoint, when this lesson completed its pair and the hours after a slip are past: an invitation, never a step.
              Continue stays the gold button, so passing on it is the easy way. */}
          {offer && !m.quiet ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={offer.title + '. ' + offer.sub}
              onPress={() => {
                buzz('tap');
                offer.onPress();
              }}
              style={({ pressed }) => [s.offer, pressed && { opacity: 0.75 }]}>
              <Icon name="pencil" size={20} color={MINT} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={s.offerT}>{offer.title}</Text>
                <Text style={s.offerSub}>{offer.sub}</Text>
              </View>
              <Icon name="next" size={18} color={nightInk.muted} />
            </Pressable>
          ) : null}
          <Pressable accessibilityRole="button" onPress={onDone}>
            {({ pressed }) => (
              <View style={[s.btn, pressed && s.btnDown]}>
                <Text style={s.btnText}>{button}</Text>
              </View>
            )}
          </Pressable>
          {/* a quiet way to tell the owner what this lesson did (the owner, November 14, 2026): the feedback sheet, about this lesson; hidden, like Ideas, in a build with no place to send to */}
          {pulseOffered && feedback ? (
            <Pressable
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => router.push({ pathname: '/feedback', params: { n: String(n), title } })}
              style={s.quiet}>
              {({ pressed }) => <Text style={[s.quietText, pressed && { opacity: 0.6 }]}>Feedback on this lesson</Text>}
            </Pressable>
          ) : null}
        </Reanimated.View>
      </View>

      {!still && !dawn ? (
        <Reanimated.View pointerEvents="none" style={[s.shout, { top: shoutY }, shoutIn]}>
          <Text style={s.shoutText} numberOfLines={1}>
            {done}
          </Text>
        </Reanimated.View>
      ) : null}
      {!still && !dawn ? <Glints v={glint} open={open} x={win.width / 2} y={shoutY + 26} /> : null}
    </View>
  );
}

/** a few gold bits round the words in the opener, the only confetti the moment has: like the gold squares on Duolingo's banner, each
    drifts slowly down, turning over as it goes, and fades before the opener ends */
const GLINTS = [
  { x: -150, y: -30, dx: -10, dy: 34, s: 8, r: 160 },
  { x: -128, y: 22, dx: -6, dy: 40, s: 6, r: -120 },
  { x: -92, y: -62, dx: -4, dy: 30, s: 6, r: 200 },
  { x: -40, y: 54, dx: 2, dy: 36, s: 5, r: -90 },
  { x: 52, y: -70, dx: 4, dy: 32, s: 6, r: 140 },
  { x: 100, y: -36, dx: 8, dy: 38, s: 7, r: -180 },
  { x: 138, y: -4, dx: 10, dy: 30, s: 8, r: 120 },
  { x: 120, y: 44, dx: 6, dy: 40, s: 5, r: -150 },
];
function Glints({ v, open, x, y }: { v: SharedValue<number>; open: SharedValue<number>; x: number; y: number }) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {GLINTS.map((g, i) => (
        <Glint key={i} v={v} open={open} x={x + g.x} y={y + g.y} g={g} i={i} />
      ))}
    </View>
  );
}
function Glint({ v, open, x, y, g, i }: { v: SharedValue<number>; open: SharedValue<number>; x: number; y: number; g: (typeof GLINTS)[number]; i: number }) {
  const st = useAnimatedStyle(() => {
    /* each comes in a little after the one before, drifts outward and fades before the opener ends */
    const t = Math.max(0, Math.min(1, (v.value - i * 0.04) / 0.8));
    const a = interpolate(t, [0, 0.15, 0.7, 1], [0, 1, 1, 0], 'clamp') * interpolate(open.value, [0.5, 1], [0, 1], 'clamp');
    const e = 1 - (1 - t) * (1 - t);
    return {
      opacity: a,
      transform: [
        { translateX: x - g.s / 2 + g.dx * e },
        { translateY: y - g.s / 2 + g.dy * t },
        { rotate: `${45 + g.r * t}deg` },
        /* turning over: it narrows and widens as it falls, like a flat square catching the light */
        { scaleX: 0.35 + 0.65 * Math.abs(Math.cos(t * Math.PI * 1.5 + i)) },
      ],
    };
  });
  return <Reanimated.View style={[{ position: 'absolute', left: 0, top: 0, width: g.s, height: g.s, borderRadius: 1, backgroundColor: GOLD }, st]} />;
}

/** the warm halo the resting flame stands in: a soft light that breathes slowly */
/** dawn: a warm sky rising from the horizon as the flame comes up, settling to a low glow once it is home */
function Dawn({ v, open, w, h }: { v: SharedValue<number>; open: SharedValue<number>; w: number; h: number }) {
  const st = useAnimatedStyle(() => ({ opacity: v.value * (0.45 + 0.55 * open.value) }));
  return (
    <Reanimated.View pointerEvents="none" style={[StyleSheet.absoluteFill, st]}>
      <Svg width={w} height={h}>
        <Defs>
          <RadialGradient id="dawn" cx={w / 2} cy={h} r={h * 0.75} gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor={ORANGE} stopOpacity="0.85" />
            <Stop offset="0.45" stopColor="#C2417A" stopOpacity="0.45" />
            <Stop offset="1" stopColor={NIGHT} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx={w / 2} cy={h} r={h * 0.75} fill="url(#dawn)" />
      </Svg>
    </Reanimated.View>
  );
}

/** dawn: the goal's nights or days, a row of open marks that come in one by one: the week ahead, to be filled */
function Marks({ v, n }: { v: SharedValue<number>; n: number }) {
  return (
    <View style={s.marks} accessible accessibilityLabel={n + ' to come'}>
      {Array.from({ length: n }, (_, i) => (
        <Mark key={i} v={v} i={i} />
      ))}
    </View>
  );
}
function Mark({ v, i }: { v: SharedValue<number>; i: number }) {
  const st = useAnimatedStyle(() => {
    const e = interpolate(v.value, [i, i + 1], [0, 1], 'clamp');
    return { opacity: e, transform: [{ scale: 0.6 + 0.4 * e }] };
  });
  return <Reanimated.View style={[s.mark, st]} />;
}

function Halo({ v, size, still }: { v: SharedValue<number>; size: number; still: boolean }) {
  const breath = useSharedValue(0);
  useEffect(() => {
    if (still) return;
    breath.value = withRepeat(withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const st = useAnimatedStyle(() => ({ opacity: v.value * (0.75 + 0.25 * breath.value) }));
  const R = Math.round(size * 1.5);
  return (
    <Reanimated.View pointerEvents="none" style={[{ position: 'absolute', width: R, height: R, left: (size - R) / 2, top: (size - R) / 2 + size * 0.06 }, st]}>
      <Svg width={R} height={R} viewBox="0 0 100 100">
        <Defs>
          <RadialGradient id="halo" cx="50" cy="50" r="50" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor={ORANGE} stopOpacity={0.42} />
            <Stop offset="0.4" stopColor={ORANGE} stopOpacity={0.13} />
            <Stop offset="1" stopColor={ORANGE} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={50} cy={50} r={50} fill="url(#halo)" />
      </Svg>
    </Reanimated.View>
  );
}

/** four faint gold stars around the resting flame, each glowing slowly brighter and dimmer on its own beat; they never pop */
const SPOTS = [
  { x: -0.06, y: 0.2, r: 16, d: 0 },
  { x: 1.02, y: 0.12, r: 12, d: 900 },
  { x: 0.96, y: 0.66, r: 18, d: 1700 },
  { x: 0.0, y: 0.72, r: 11, d: 500 },
];
function Sparkles({ v, size, still }: { v: SharedValue<number>; size: number; still: boolean }) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {SPOTS.map((p, i) => (
        <Twinkle key={i} v={v} left={p.x * size - p.r / 2} top={p.y * size - p.r / 2} r={p.r} delay={p.d} still={still} />
      ))}
    </View>
  );
}
function Twinkle({ v, left, top, r, delay, still }: { v: SharedValue<number>; left: number; top: number; r: number; delay: number; still: boolean }) {
  const t = useSharedValue(still ? 1 : 0);
  useEffect(() => {
    if (still) return;
    t.value = withDelay(delay, withRepeat(withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.sin) }), -1, true));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const st = useAnimatedStyle(() => ({ opacity: v.value * (0.3 + 0.6 * t.value), transform: [{ scale: 0.8 + 0.2 * t.value }] }));
  return (
    <Reanimated.View style={[{ position: 'absolute', left, top, width: r, height: r }, st]}>
      <Svg width={r} height={r} viewBox="0 0 24 24">
        <Path d={STAR} fill={GOLD} />
      </Svg>
    </Reanimated.View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: NIGHT, overflow: 'hidden' },
  band: { position: 'absolute', backgroundColor: BAND, borderRadius: 24 },
  col: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 10 },
  bubble: { alignSelf: 'stretch', maxWidth: 340, marginHorizontal: 'auto' },
  shout: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  shoutText: { fontFamily: font.display, fontSize: 40, color: GOLD, textAlign: 'center' },
  title: { fontFamily: font.display, fontSize: 34, color: nightInk.ink, textAlign: 'center' },
  sub: { fontFamily: font.bodySemi, fontSize: 15, color: nightInk.muted, textAlign: 'center', marginTop: 2 },
  marks: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginTop: 14 },
  mark: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: GOLD, backgroundColor: 'rgba(255,210,90,0.18)' },
  dock: { paddingHorizontal: 16, gap: 18 },
  pts: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, alignSelf: 'center' },
  ptsNum: { fontFamily: font.display, fontSize: 40, color: GOLD },
  ptsWord: { fontFamily: font.bodyBold, fontSize: 20, color: GOLD },
  lineBox: { alignSelf: 'center', width: '100%', maxWidth: 360, gap: 8 },
  lineHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 },
  lineRow: { flexDirection: 'row', alignItems: 'center' },
  lineLabel: { fontFamily: font.display, fontSize: 17, color: nightInk.ink },
  lineRight: { fontFamily: font.bodySemi, fontSize: 15, color: nightInk.muted, flexShrink: 1 },
  track: { flex: 1, height: 18, borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.12)', overflow: 'hidden', marginRight: -14 },
  fill: { height: 18, borderRadius: 9, backgroundColor: GOLD, paddingTop: 4, paddingHorizontal: 8 },
  fillLessons: { backgroundColor: MINT },
  /* the round milestone the line runs into, sitting over its end */
  goal: { width: 34, height: 34, borderRadius: 17, borderWidth: 3, borderColor: GOLD, backgroundColor: NIGHT, alignItems: 'center', justifyContent: 'center' },
  goalNum: { fontFamily: font.display, fontSize: 13, color: GOLD },
  goalLessons: { borderColor: MINT },
  goalLessonsOn: { backgroundColor: MINT },
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
  quiet: { alignSelf: 'center', paddingTop: 14, paddingHorizontal: 12 },
  offer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 64,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  offerT: { fontFamily: font.display, fontSize: 17, color: nightInk.ink },
  offerSub: { fontFamily: font.body, fontSize: 15, color: nightInk.muted },
  quietText: { fontFamily: font.bodySemi, fontSize: 15, color: nightInk.muted },
  btnDown: { borderBottomWidth: 0, marginTop: 5 },
  btnText: { fontFamily: font.display, fontSize: 20, color: '#3A2A00' },
});
