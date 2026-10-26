/* Name the feeling: the Mood Meter grid, Daybook style. A color picks the corner of feeling, then a pannable 12 by 12
   field of feeling bubbles (6 by 6 for each color), each colored by where it sits (energy down the rows, pleasantness
   across the columns). The middle of the screen is the eye of the field: whatever bubble slides under it swells into its
   own shape, from its color's family (lib/m3-shapes: stars, suns, drops and flowers), and presses the whole field outward, so dragging feels like rolling a heavy ball through a pool of packed
   ones, with a soft bump under the thumb for each bubble it rolls onto. A throw glides and then settles with a knock and a
   bubble in the eye, its word shows in the bar at the bottom, and naming it leads on to the tool that fits (core
   feelings.ts). The pan, the focus
   and the push all run on the UI thread (Reanimated and the gesture handler), so the field stays smooth while it moves. */
import { FEEL_MID, FEEL_QUADS, FEEL_ROWS, FEELINGS, feelAt, feelLead, feelLog, TOOLS, urNight, withDay } from '@daybook/core';
import { LinearGradient } from 'expo-linear-gradient';
import { useNextTool } from '@/lib/tools';
import { StatusBar } from 'expo-status-bar';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View, type HostInstance } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Reanimated, {
  Easing,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
  type DerivedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Link } from '@/components/choices';
import { Dock, Middle, SceneFrame, Stage } from '@/components/scene';
import { MorphShape, Shape, type ShapeKind } from '@/components/shapes';
import { Text } from '@/components/text';
import { Button, Icon, T } from '@/components/ui';
import type { ToolProps } from '@/components/tools/types';
import { breathAt, useBreathSeconds, webDeps, type Steps } from '@/lib/breath';
import { buzz } from '@/lib/feel';
import { useReducedMotion } from '@/lib/motion';
import { useStore } from '@/lib/store';
import { font, nightInk, skies, useTheme } from '@/lib/theme';

const N = FEEL_ROWS;
/** cells per side of one color's corner */
const Q = FEEL_MID;

/* ---------- the colors of the field ---------- */
/* Each corner of the grid keeps its own color family, so the four are never mixed up: reds and roses, ambers and
   lemons, blues and skies, greens and mints. Inside a corner the color shades smoothly between that corner's own four
   tones (the four corners of the quadrant, blended), deepest at the grid's outer corner, where the feelings are
   strongest, and lightest toward the mild middle of the grid, the way the Mood Meter reads. */
type HSL = [number, number, number];
const FIELD: Record<string, { tl: HSL; tr: HSL; bl: HSL; br: HSL }> = {
  red: { tl: [350, 82, 50], tr: [10, 88, 58], bl: [336, 80, 57], br: [4, 86, 68] },
  yellow: { tl: [36, 96, 55], tr: [52, 98, 55], bl: [44, 94, 70], br: [57, 92, 60] },
  blue: { tl: [240, 74, 70], tr: [206, 90, 75], bl: [230, 78, 58], br: [212, 86, 63] },
  green: { tl: [122, 58, 72], tr: [96, 60, 60], bl: [158, 66, 48], br: [148, 74, 42] },
};
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const mixHue = (a: number, b: number, t: number) => {
  let d = b - a;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return (a + d * t + 360) % 360;
};
const cornerOf = (r: number, c: number) => (r < Q ? (c < Q ? 'red' : 'yellow') : c < Q ? 'blue' : 'green');
function cellColor(r: number, c: number) {
  const f = FIELD[cornerOf(r, c)];
  const u = (c % Q) / (Q - 1);
  const v = (r % Q) / (Q - 1);
  const h = mixHue(mixHue(f.tl[0], f.tr[0], u), mixHue(f.bl[0], f.br[0], u), v);
  const s = mix(mix(f.tl[1], f.tr[1], u), mix(f.bl[1], f.br[1], u), v);
  const l = mix(mix(f.tl[2], f.tr[2], u), mix(f.bl[2], f.br[2], u), v);
  return `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`;
}
export const FEEL_COLORS = Array.from({ length: N }, (_, r) => Array.from({ length: N }, (_, c) => cellColor(r, c)));
/** the one dark ink every bubble's word is written in */
const INK = '#1C2030';

/* the shape a chosen bubble grows into, from its color's family (lib/m3-shapes), and every one of them different: bursts,
   buzzsaws and crosses for the charged corner; suns, sparkles, hearts and crowns for the bright one; drips, bitten
   moons and rain clouds for the heavy one; clouds, clovers, pebbles and mushrooms for the calm one. Each feeling's is
   fixed, so a feeling always has the same shape. Counted from the grid's edge (the strongest feeling) toward the
   middle. */
const FAMILY = { red: 'jag', yellow: 'ray', blue: 'drip', green: 'bloom' } as const;
export const feelKind = (r: number, c: number): ShapeKind => {
  const k = cornerOf(r, c);
  const down = r < Q ? r : N - 1 - r;
  const across = c < Q ? c : N - 1 - c;
  return `feel:${FAMILY[k]}:${across}:${down}`;
};

/** the chosen bubble's shape: it starts as the circle it was and, after a short beat in the eye, morphs out (MorphShape
    springs when `kind` changes). The beat keeps a bubble that only rolls through from flickering into its shape. */
function SelShape({ kind, size, color }: { kind: ShapeKind; size: number; color: string }) {
  const [k, setK] = useState<ShapeKind>('circle');
  useEffect(() => {
    const t = setTimeout(() => setK(kind), 250);
    return () => clearTimeout(t);
  }, [kind]);
  return <MorphShape kind={k} size={size} color={color} />;
}

/* ---------- one bubble ---------- */
const Bub = memo(function Bub({
  r,
  c,
  step,
  dia,
  isSel,
  shaped,
  onPick,
  sx,
  sy,
  amt,
  grow,
}: {
  r: number;
  c: number;
  step: number;
  dia: number;
  isSel: boolean;
  /** grown into its shape (the chosen one, once the field has woken) */
  shaped: boolean;
  onPick: (r: number, c: number) => void;
  sx: DerivedValue<number>;
  sy: DerivedValue<number>;
  amt: SharedValue<number>;
  /** 0 to 1 as the field grows out of the tapped bubble: each bubble starts big and faint, overlapping its neighbors,
      and shrinks into its place */
  grow: SharedValue<number>;
}) {
  const f = FEELINGS[r][c];
  const color = FEEL_COLORS[r][c];
  /* the field around the focused bubble: it grows to 1.7 times, and the growing takes room, so every other bubble is
     pressed outward. The press rises from nothing at the focus (the ball itself does not slide), is strongest on the
     near rings, and eases down only slowly with distance: the bubbles are packed tight like hard balls, so the whole pool
     gives way together. A press that fell off fast would push the near ring into the ring behind it; this one falls no
     faster than the resting gap can take, so bubbles never touch (checked over every focus point, a twentieth of a step
     apart). */
  const st = useAnimatedStyle(
    () => {
      const dx = (c - sx.value) * step;
      const dy = (r - sy.value) * step;
      const d2 = dx * dx + dy * dy;
      const d = Math.sqrt(d2);
      const gs = 0.55 * step;
      const k = 0.5 * step;
      const push = ((amt.value * d2) / (d2 + k * k)) * step * (0.45 + 0.35 * Math.exp(-d / (3.5 * step)));
      const g = grow.value;
      const scale = (1 + amt.value * 0.7 * Math.exp(-d2 / (2 * gs * gs))) * (1 + 0.9 * (1 - g));
      return {
        opacity: g < 1 ? 0.35 + 0.65 * g : 1,
        transform: [{ translateX: d > 1 ? (push * dx) / d : 0 }, { translateY: d > 1 ? (push * dy) / d : 0 }, { scale }],
      };
    },
    webDeps(r, c, step, sx, sy, amt, grow),
  );
  const long = f.w.indexOf(' ') < 0 && f.w.length > 10;
  const fs = f.w.length <= 6 ? 15 : f.w.length <= 9 ? 13 : long ? 10.5 : 11.5;
  return (
    <Reanimated.View
      style={[
        { position: 'absolute', left: c * step + (step - dia) / 2, top: r * step + (step - dia) / 2, width: dia, height: dia, zIndex: isSel ? 2 : 0 },
        st,
      ]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={f.w + '. ' + f.how}
        accessibilityState={{ selected: isSel }}
        onPress={() => onPick(r, c)}
        style={s.bub}>
        {shaped ? (
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <SelShape kind={feelKind(r, c)} size={dia} color={color} />
          </View>
        ) : (
          <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: dia / 2, backgroundColor: color }]} />
        )}
        <Text numberOfLines={long ? 1 : 2} style={[s.bubT, { fontSize: fs, lineHeight: fs + 3 }]}>
          {f.w}
        </Text>
      </Pressable>
    </Reanimated.View>
  );
});

const clamp = (v: number, lo: number, hi: number) => {
  'worklet';
  return Math.min(hi, Math.max(lo, v));
};

/* ---------- the grid screen ---------- */
export function FeelGrid({
  start,
  from,
  title = 'Name the feeling',
  onBack,
  onClose,
  onNext,
}: {
  /** the cell the field opens with in the eye */
  start: { r: number; c: number };
  /** the tapped bubble the field grows out of; with none, the field is simply there */
  from?: FeelFrom;
  /** the words in the top bar */
  title?: string;
  onBack: () => void;
  onClose: () => void;
  onNext: (r: number, c: number) => void;
}) {
  const { width: W, height: H } = useWindowDimensions();
  const inset = useSafeAreaInsets();
  const c = useTheme();
  const reduce = useReducedMotion();
  const step = Math.min(W, 430) / 4.25;
  const dia = step * 0.93;
  const content = N * step;
  const [sel, setSel] = useState(start);
  const [barH, setBarH] = useState(160);
  const head = inset.top + 60;
  const footTop = H - barH - 8;
  /* the eye of the field: the point in the middle of the open sky. Whatever bubble sits under it is the one being tried
     on, so the field may slide until any cell, corners included, rests in the eye. */
  const cx = W / 2;
  const cy = (head + footTop) / 2;
  const [bx0, bx1] = [cx - (N - 0.5) * step, cx - 0.5 * step];
  const [by0, by1] = [cy - (N - 0.5) * step, cy - 0.5 * step];
  const tx = useSharedValue(cx - (start.c + 0.5) * step);
  const ty = useSharedValue(cy - (start.r + 0.5) * step);
  /* the focus the push field bends around, in cells: read straight off the pan, so the swell rolls through the bubbles
     with the finger, never a frame behind */
  const sx = useDerivedValue(() => clamp((cx - tx.value) / step - 0.5, 0, N - 1), webDeps(tx, cx, step));
  const sy = useDerivedValue(() => clamp((cy - ty.value) / step - 0.5, 0, N - 1), webDeps(ty, cy, step));
  /* the field opens still: plain round bubbles in their rows. The first scroll (or tap) wakes it, and only then does the
     bubble in the eye swell and press the others aside */
  const amt = useSharedValue(0);
  /* the field grows out of the bubble that was tapped: it starts small and bunched over that bubble, every bubble big
     and faint, and spreads into its rows as each one shrinks into place */
  const grow = useSharedValue(from && !reduce ? 0 : 1);
  useEffect(() => {
    if (grow.value < 1) grow.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) });
  }, [grow]);
  const woke = useSharedValue(false);
  const [live, setLive] = useState(false);
  const wake = () => {
    if (woke.value) return;
    woke.value = true;
    amt.value = reduce ? 1 : withTiming(1, { duration: 450, easing: Easing.out(Easing.cubic) });
    setLive(true);
  };
  /* the bar's first real layout can move the eye a little: slide the field the same way, so the centered bubble stays
     centered and the snap targets stay true */
  const cyAt = useRef(cy);
  useEffect(() => {
    const d = cy - cyAt.current;
    if (!d) return;
    cyAt.current = cy;
    ty.value = clamp(ty.value + d, by0, by1);
  }, [cy, by0, by1, ty]);
  /* the cell in the eye, kept on the JS side for the bar and the shape; the thumb feels a soft bump as each new bubble
     rolls in, and a firmer knock when the field comes to rest */
  const onCell = (i: number) => {
    setSel({ r: Math.floor(i / N), c: i % N });
    buzz('roll');
  };
  const land = () => buzz('land');
  /* where the field is settling to; the knock comes as it arrives within a hair of it, not at the end of the spring's
     long invisible tail, and a new touch on the field takes it back */
  const goX = useSharedValue(0);
  const goY = useSharedValue(0);
  const armed = useSharedValue(false);
  const aim = (x: number, y: number) => {
    'worklet';
    goX.value = x;
    goY.value = y;
    armed.value = true;
  };
  useAnimatedReaction(
    () => armed.value && Math.abs(tx.value - goX.value) + Math.abs(ty.value - goY.value) < 1.5,
    (near) => {
      if (!near) return;
      armed.value = false;
      runOnJS(land)();
    },
    webDeps(tx, ty, goX, goY, armed),
  );
  useAnimatedReaction(
    () => Math.round(sy.value) * N + Math.round(sx.value),
    (cur, prev) => {
      if (prev !== null && cur !== prev) runOnJS(onCell)(cur);
    },
    webDeps(sx, sy),
  );
  /* a click right after a drag (the web: mouse up fires one) is the drag letting go, not a pick */
  const dragAt = useRef(0);
  const markDrag = () => {
    dragAt.current = Date.now();
  };
  /* a tap does not grow the bubble where it is: it rolls the field over until that bubble rests in the eye */
  const pick = (r: number, cc: number) => {
    if (Date.now() - dragAt.current < 250) return;
    buzz('tap');
    wake();
    const nx = cx - (cc + 0.5) * step;
    const ny = cy - (r + 0.5) * step;
    const glide = { duration: 320, easing: Easing.out(Easing.cubic) };
    if (Math.abs(tx.value - nx) + Math.abs(ty.value - ny) > 1.5) aim(nx, ny);
    tx.value = reduce ? nx : withTiming(nx, glide);
    ty.value = reduce ? ny : withTiming(ny, glide);
  };
  const pan = useMemo(
    () =>
      Gesture.Pan()
        .onBegin(() => {
          'worklet';
          armed.value = false;
        })
        .onStart(() => {
          'worklet';
          if (!woke.value) runOnJS(wake)();
        })
        .onChange((e) => {
          'worklet';
          tx.value = clamp(tx.value + e.changeX, bx0, bx1);
          ty.value = clamp(ty.value + e.changeY, by0, by1);
        })
        .onEnd((e) => {
          'worklet';
          /* let the throw run out, then settle with whichever bubble the eye would land nearest snapped into it: the
             field always comes to rest trying a feeling on */
          const px = clamp(tx.value + e.velocityX * 0.4, bx0, bx1);
          const py = clamp(ty.value + e.velocityY * 0.4, by0, by1);
          const gx = cx - (Math.round((cx - px) / step - 0.5) + 0.5) * step;
          const gy = cy - (Math.round((cy - py) / step - 0.5) + 0.5) * step;
          aim(gx, gy);
          if (reduce) {
            tx.value = gx;
            ty.value = gy;
            return;
          }
          tx.value = withSpring(gx, { velocity: e.velocityX, damping: 30, stiffness: 120, mass: 1 });
          ty.value = withSpring(gy, { velocity: e.velocityY, damping: 30, stiffness: 120, mass: 1 });
        })
        .onFinalize((e) => {
          'worklet';
          if (Math.abs(e.translationX) + Math.abs(e.translationY) > 10) runOnJS(markDrag)();
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bx0, bx1, by0, by1, cx, cy, step, reduce],
  );
  const canvas = useAnimatedStyle(() => ({ transform: [{ translateX: tx.value }, { translateY: ty.value }] }), webDeps(tx, ty));
  /* the growing, about the eye: at the start the eye sits on the tapped bubble and the field is a third of its size */
  const ox = from ? from.x : cx;
  const oy = from ? from.y : cy;
  const spread = useAnimatedStyle(
    () => {
      const g = grow.value;
      if (g >= 1) return { opacity: 1, transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }] };
      const k = 0.35 + 0.65 * g;
      return {
        opacity: Math.min(1, g * 3),
        transform: [{ translateX: (ox - cx) * (1 - g) + (1 - k) * (cx - W / 2) }, { translateY: (oy - cy) * (1 - g) + (1 - k) * (cy - H / 2) }, { scale: k }],
      };
    },
    webDeps(grow, ox, oy, cx, cy, W, H),
  );
  const rise = useAnimatedStyle(() => ({ opacity: grow.value, transform: [{ translateY: 40 * (1 - grow.value) }] }), webDeps(grow));
  const [skyA, skyB] = skies[c.scheme].night;
  const f = feelAt(sel.r, sel.c)!;
  return (
    <View style={{ flex: 1, backgroundColor: skyB, overflow: 'hidden' }}>
      <StatusBar style="light" />
      <LinearGradient colors={[skyA, skyB]} style={StyleSheet.absoluteFill} />
      <GestureDetector gesture={pan}>
        <View style={{ flex: 1 }} collapsable={false}>
          <Reanimated.View style={[StyleSheet.absoluteFill, spread]}>
            <Reanimated.View style={[{ position: 'absolute', left: 0, top: 0, width: content, height: content }, canvas]}>
              {FEELINGS.map((row, r) =>
                row.map((_, cc) => (
                  <Bub
                    key={r + '-' + cc}
                    r={r}
                    c={cc}
                    step={step}
                    dia={dia}
                    isSel={!!sel && sel.r === r && sel.c === cc}
                    shaped={live && sel.r === r && sel.c === cc}
                    onPick={pick}
                    sx={sx}
                    sy={sy}
                    amt={amt}
                    grow={grow}
                  />
                )),
              )}
            </Reanimated.View>
          </Reanimated.View>
        </View>
      </GestureDetector>
      <LinearGradient colors={[skyA, skyA + '00']} style={[s.fade, { height: head + 24 }]} pointerEvents="none" />
      <View style={[s.top, { paddingTop: inset.top + 10 }]}>
        <View style={s.topL}>
          <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={onBack} style={[s.round, { backgroundColor: nightInk.btn }]}>
            <Icon name="back" color={nightInk.ink} />
          </Pressable>
          <T v="eyebrow" style={{ color: nightInk.muted }} accessibilityRole="header">
            {title}
          </T>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} style={[s.round, { backgroundColor: nightInk.btn }]}>
          <Icon name="x" color={nightInk.ink} />
        </Pressable>
      </View>
      <LinearGradient colors={[skyB + '00', skyB]} style={[s.rise, { height: barH + 48 }]} pointerEvents="none" />
      {/* the bar at the bottom: until the field wakes it asks for a feeling; then it shows the one in the eye, its word in
          its own color, and the whole bar (arrow and all) names it */}
      <Reanimated.View style={[s.foot, { paddingBottom: inset.bottom + 12 }, rise]} onLayout={(e) => setBarH(e.nativeEvent.layout.height)}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={live ? 'Name it: ' + f.w + '. ' + f.how : 'Tap the feeling that fits best'}
          accessibilityState={{ disabled: !live }}
          disabled={!live}
          onPress={() => onNext(sel.r, sel.c)}
          style={({ pressed }) => [s.bar, { opacity: pressed ? 0.85 : 1 }]}>
          <View style={s.barText}>
            {live ? (
              <>
                <Text style={[s.barW, { color: FEEL_COLORS[sel.r][sel.c] }]}>{f.w}</Text>
                <Text style={s.barHow} numberOfLines={2}>
                  {f.how}
                </Text>
              </>
            ) : (
              <Text style={s.barAsk} numberOfLines={3}>
                Tap the feeling that fits best, or drag to look around
              </Text>
            )}
          </View>
          <View style={[s.go, { backgroundColor: live ? FEEL_COLORS[sel.r][sel.c] : nightInk.btn }]}>
            <Icon name="next" size={22} color={live ? INK : nightInk.muted} />
          </View>
        </Pressable>
      </Reanimated.View>
    </View>
  );
}

/* ---------- naming it: the feeling's shape breathes, so the word is said on a slow breath out ---------- */
const NAME_BREATH: Steps = [
  ['in', 4],
  ['out', 6],
];
export function BreathingShape({ kind, color, ink = nightInk.muted }: { kind: ShapeKind; color: string; ink?: string }) {
  const reduce = useReducedMotion();
  const [t, , out] = breathAt(NAME_BREATH, useBreathSeconds(!reduce));
  return (
    <View style={s.breathe} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={{ transform: [{ scale: reduce ? 1 : 0.8 + 0.28 * t }] }}>
        <Shape kind={kind} size={160} color={color} turn={6} />
      </View>
      <T v="label" style={{ color: ink }}>
        {reduce ? 'Breathe out slowly' : out ? 'Breathe out' : 'Breathe in'}
      </T>
    </View>
  );
}

/* ---------- the four corners ---------- */
/* each corner's bubble: light where the light falls at the top, deeper below, and a twin a shade darker that shows
   through as its rim */
export const QUAD: Record<string, { top: string; bottom: string; twin: string }> = {
  red: { top: 'hsl(12, 90%, 63%)', bottom: 'hsl(346, 80%, 54%)', twin: 'hsla(352, 72%, 45%, 0.85)' },
  yellow: { top: 'hsl(52, 96%, 70%)', bottom: 'hsl(40, 94%, 56%)', twin: 'hsla(44, 68%, 48%, 0.85)' },
  blue: { top: 'hsl(205, 92%, 77%)', bottom: 'hsl(236, 86%, 68%)', twin: 'hsla(228, 58%, 55%, 0.85)' },
  green: { top: 'hsl(136, 80%, 72%)', bottom: 'hsl(152, 68%, 52%)', twin: 'hsla(148, 56%, 43%, 0.85)' },
};
/** where a bubble sat on the screen when it was tapped (its middle), so the field can grow out of it */
export type FeelFrom = { x: number; y: number };

function QuadBubble({
  q,
  qi,
  d,
  clock,
  onPick,
}: {
  q: (typeof FEEL_QUADS)[number];
  qi: number;
  d: number;
  clock: SharedValue<number>;
  onPick: (at?: FeelFrom) => void;
}) {
  /* the twin wanders slowly round just behind the bubble on a looping path of its own, so the rim it shows keeps
     shifting like a jelly that never quite settles; the bubble breathes a little on its own beat. Every rate is a whole
     number of turns a minute, so the one clock loops without a jump. */
  const twin = useAnimatedStyle(
    () => {
      const t = 2 * Math.PI * clock.value;
      const o = d * (0.04 + 0.015 * Math.sin(t * 5 + qi * 2.3));
      return {
        transform: [
          { translateX: o * Math.cos(t * 9 + qi * 1.6) },
          { translateY: o * Math.sin(t * 7 + qi * 2.1) },
          { scale: 1.02 + 0.015 * Math.sin(t * 6 + qi) },
        ],
      };
    },
    webDeps(clock, qi, d),
  );
  const st = useAnimatedStyle(() => ({ transform: [{ scale: 1 + 0.012 * Math.sin(2 * Math.PI * clock.value * 10 + qi * 1.7) }] }), webDeps(clock, qi));
  const ref = useRef<HostInstance | null>(null);
  const [a, b] = q.name.split(', ');
  return (
    <View ref={ref} style={{ width: d, height: d }}>
      <Reanimated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: d / 2, backgroundColor: QUAD[q.id].twin }, twin]} />
      <Reanimated.View style={st}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={q.name}
          onPress={() => {
            buzz('tap');
            const el = ref.current;
            if (!el) return onPick();
            el.measureInWindow((x, y, w, h) => onPick(w ? { x: x + w / 2, y: y + h / 2 } : undefined));
          }}
          style={({ pressed }) => [s.quad, { width: d, height: d, borderRadius: d / 2, transform: [{ scale: pressed ? 0.95 : 1 }] }]}>
          <LinearGradient
            colors={[QUAD[q.id].top, QUAD[q.id].bottom]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={[StyleSheet.absoluteFill, { borderRadius: d / 2 }]}
          />
          <Text style={s.quadT}>{a}</Text>
          <Text style={s.quadT}>{b.charAt(0).toUpperCase() + b.slice(1)}</Text>
        </Pressable>
      </Reanimated.View>
    </View>
  );
}

/** the four colors that open the field: big bubbles low where the thumb is, each with a see-through twin wandering
    just behind it. Used by Name the feeling, the SOS ride and the slip. */
export function QuadBubbles({ d, gap = 10, onPick }: { d: number; gap?: number; onPick: (q: (typeof FEEL_QUADS)[number], at?: FeelFrom) => void }) {
  const reduce = useReducedMotion();
  const clock = useSharedValue(0.1);
  useEffect(() => {
    if (reduce) return;
    clock.value = withRepeat(withTiming(1.1, { duration: 60000, easing: Easing.linear }), -1, false);
  }, [reduce, clock]);
  return (
    <View style={[s.quads, { width: d * 2 + gap, gap, rowGap: gap }]}>
      {FEEL_QUADS.map((q, qi) => (
        <QuadBubble key={q.id} q={q} qi={qi} d={d} clock={clock} onPick={(at) => onPick(q, at)} />
      ))}
    </View>
  );
}

/* ---------- the tool ---------- */
export function Feel({ finish, exit, now }: ToolProps & { now: number }) {
  const nextTool = useNextTool();
  const { width: W } = useWindowDimensions();
  const { tk, update } = useStore();
  const [step, setStep] = useState<'quad' | 'grid' | 'named'>('quad');
  const [from, setFrom] = useState(FEEL_QUADS[0]);
  const [sel, setSel] = useState<{ r: number; c: number } | null>(null);
  /* the tapped bubble, so the field grows out of it; coming back to the grid from the named page, it is simply there */
  const [at, setAt] = useState<FeelFrom | undefined>(undefined);
  const night = urNight(new Date(now).getHours());
  const save = (w: string) => update((st) => ({ ...st, days: withDay(st.days, tk, feelLog(st.days[tk], tk, w, Date.now())) }));
  if (step === 'grid')
    return (
      <FeelGrid
        start={sel || { r: from.r, c: from.c }}
        from={at}
        onBack={() => {
          setSel(null);
          setStep('quad');
        }}
        onClose={exit}
        onNext={(r, c) => {
          setSel({ r, c });
          setAt(undefined);
          setStep('named');
        }}
      />
    );
  if (step === 'named' && sel) {
    const f = feelAt(sel.r, sel.c)!;
    const lead = feelLead(sel.r, sel.c, night);
    const tool = lead && TOOLS.find((t) => t.id === lead.tool);
    const done = () => {
      save(f.w);
      finish('feel', { msg: 'Named. That alone takes some of its charge away.' });
    };
    return (
      <SceneFrame title="Name the feeling" sky="night" onBack={() => setStep('grid')} onClose={exit}>
        <Stage key={'named' + f.w} dir={1}>
          <T v="eyebrow" tone="muted" style={s.c}>
            Name it to tame it
          </T>
          <T v="title" style={s.c} accessibilityRole="header">
            {f.w}
          </T>
          <T style={s.c}>{f.how}.</T>
          <Middle>
            <BreathingShape kind={feelKind(sel.r, sel.c)} color={FEEL_COLORS[sel.r][sel.c]} />
            <T style={[s.c, s.say]}>{'On a slow breath out, say it to yourself: “I feel ' + f.w.toLowerCase() + '.”'}</T>
          </Middle>
          <Dock>
            <T v="small" tone="muted" style={s.c}>
              {lead ? lead.why : 'A good one to notice. Nothing needs fixing; let it soak in.'}
            </T>
            {lead && tool ? (
              <>
                <Button
                  label={'Next: ' + tool.name}
                  onPress={() => {
                    save(f.w);
                    nextTool(tool.id);
                  }}
                />
                <View style={s.quiet}>
                  <Link label="Done for now" onPress={done} />
                </View>
              </>
            ) : (
              <Button label="Done" onPress={done} />
            )}
            <T v="small" tone="muted" style={s.c}>
              Named feelings go on today's log.
            </T>
          </Dock>
        </Stage>
      </SceneFrame>
    );
  }
  const d = Math.min(W - 96, 330) / 2;
  return (
    <SceneFrame title="Name the feeling" sky="night" onClose={exit}>
      <Stage key="quad" dir={sel === null && step === 'quad' ? 0 : -1}>
        <T v="title" style={s.c} accessibilityRole="header">
          Where is the feeling sitting?
        </T>
        <T style={s.c}>Tap the color that is closest. The exact word comes next.</T>
        <Dock>
          <QuadBubbles
            d={d}
            onPick={(q, p) => {
              setFrom(q);
              setAt(p);
              setSel(null);
              setStep('grid');
            }}
          />
        </Dock>
      </Stage>
    </SceneFrame>
  );
}

const s = StyleSheet.create({
  c: { textAlign: 'center' },
  bub: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bubT: { fontFamily: font.bodySemi, color: INK, textAlign: 'center', paddingHorizontal: 4 },
  fade: { position: 'absolute', top: 0, left: 0, right: 0 },
  rise: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  top: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topL: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  round: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  foot: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 16, maxWidth: 560, alignSelf: 'center', width: '100%' },
  /* one height always, asking or showing a word, so the bar never moves the eye of the grid */
  bar: {
    backgroundColor: 'rgba(13, 10, 43, 0.94)',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingLeft: 20,
    paddingRight: 10,
    height: 92,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  barText: { flex: 1, gap: 2, justifyContent: 'center' },
  barW: { fontFamily: font.display, fontSize: 20, lineHeight: 26 },
  barAsk: { fontFamily: font.body, fontSize: 15, lineHeight: 21, color: nightInk.ink },
  go: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  /* two lines of room always, so the bar never changes height (a moving bar would move the eye of the grid) */
  barHow: { fontFamily: font.body, fontSize: 13, lineHeight: 18, height: 36, color: nightInk.muted },
  quads: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignSelf: 'center' },
  quad: { alignItems: 'center', justifyContent: 'center' },
  quadT: { fontFamily: font.bodySemi, fontSize: 15, lineHeight: 20, color: INK, textAlign: 'center' },
  quiet: { alignItems: 'center' },
  breathe: { alignItems: 'center', gap: 14 },
  say: { maxWidth: 320, marginTop: 6 },
});
