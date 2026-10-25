/* Name the feeling: the Mood Meter grid, Daybook style. A color picks the corner of feeling, then a pannable 10 by 10
   field of feeling bubbles, each colored by where it sits (energy down the rows, pleasantness across the columns).
   The middle of the screen is the eye of the field: whatever bubble slides under it swells into one of the Material
   shapes and presses the whole field outward, so dragging feels like rolling a heavy ball through a pool of packed
   ones, with a soft bump under the thumb for each bubble it rolls onto. A throw glides and then settles with a knock and a
   bubble in the eye, its word shows in the bar at the bottom, and naming it leads on to the tool that fits (core
   feelings.ts). The pan, the focus
   and the push all run on the UI thread (Reanimated and the gesture handler), so the field stays smooth while it moves. */
import { FEEL_QUADS, FEELINGS, feelAt, feelLead, feelLog, TOOLS, urNight, withDay } from '@daybook/core';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Reanimated, {
  Easing,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
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
import { webDeps } from '@/lib/breath';
import { buzz } from '@/lib/feel';
import { useReducedMotion } from '@/lib/motion';
import { useStore } from '@/lib/store';
import { font, nightInk, skies, useTheme } from '@/lib/theme';

const N = 10;

/* ---------- the colors of the field ---------- */
/* Each corner of the grid has its own small color field (the four corners of that quadrant, blended), so red runs warm
   toward the yellow seam, blue runs toward cyan, and everything grows lighter and softer toward the mild middle of the
   grid, the way the Mood Meter reads. The two unlike seams (red over blue, yellow over green) stay visible on purpose. */
type HSL = [number, number, number];
const FIELD: Record<string, { tl: HSL; tr: HSL; bl: HSL; br: HSL }> = {
  red: { tl: [348, 76, 55], tr: [18, 88, 62], bl: [340, 80, 58], br: [12, 85, 69] },
  yellow: { tl: [41, 95, 56], tr: [50, 96, 55], bl: [47, 88, 70], br: [57, 88, 64] },
  blue: { tl: [243, 74, 70], tr: [207, 86, 72], bl: [213, 88, 61], br: [193, 94, 57] },
  green: { tl: [100, 66, 74], tr: [147, 60, 65], bl: [163, 74, 51], br: [160, 84, 44] },
};
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const mixHue = (a: number, b: number, t: number) => {
  let d = b - a;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return (a + d * t + 360) % 360;
};
const cornerOf = (r: number, c: number) => (r < 5 ? (c < 5 ? 'red' : 'yellow') : c < 5 ? 'blue' : 'green');
function cellColor(r: number, c: number) {
  const f = FIELD[cornerOf(r, c)];
  const u = (c % 5) / 4;
  const v = (r % 5) / 4;
  const h = mixHue(mixHue(f.tl[0], f.tr[0], u), mixHue(f.bl[0], f.br[0], u), v);
  const s = mix(mix(f.tl[1], f.tr[1], u), mix(f.bl[1], f.br[1], u), v);
  const l = mix(mix(f.tl[2], f.tr[2], u), mix(f.bl[2], f.br[2], u), v);
  return `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`;
}
export const FEEL_COLORS = Array.from({ length: N }, (_, r) => Array.from({ length: N }, (_, c) => cellColor(r, c)));
/** the one dark ink every bubble's word is written in */
const INK = '#1C2030';

/* the shape a chosen bubble grows into: jagged-soft for the charged corner, sunny for the bright one, soft and round for
   the heavy and the calm ones. Fixed per cell, so a feeling always has the same shape. */
const SEL_POOL: Record<string, ShapeKind[]> = {
  red: ['softBoom', 'burst', 'cookie4', 'clamShell', 'diamond'],
  yellow: ['sunny', 'verySunny', 'softBurst', 'flower', 'cookie7'],
  blue: ['puffy', 'ghostish', 'oval', 'bun', 'clamShell'],
  green: ['clover4', 'cookie6', 'flower', 'puffy', 'bun'],
};
export const feelKind = (r: number, c: number): ShapeKind => {
  const pool = SEL_POOL[cornerOf(r, c)];
  return pool[(r * 7 + c * 3) % pool.length];
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
      const scale = 1 + amt.value * 0.7 * Math.exp(-d2 / (2 * gs * gs));
      return { transform: [{ translateX: d > 1 ? (push * dx) / d : 0 }, { translateY: d > 1 ? (push * dy) / d : 0 }, { scale }] };
    },
    webDeps(r, c, step, sx, sy, amt),
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
function FeelGrid({
  start,
  onBack,
  onClose,
  onNext,
}: {
  /** the cell the field opens with in the eye */
  start: { r: number; c: number };
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
  const [skyA, skyB] = skies[c.scheme].night;
  const f = feelAt(sel.r, sel.c)!;
  return (
    <View style={{ flex: 1, backgroundColor: skyB, overflow: 'hidden' }}>
      <StatusBar style="light" />
      <LinearGradient colors={[skyA, skyB]} style={StyleSheet.absoluteFill} />
      <GestureDetector gesture={pan}>
        <View style={{ flex: 1 }} collapsable={false}>
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
                />
              )),
            )}
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
            Name the feeling
          </T>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} style={[s.round, { backgroundColor: nightInk.btn }]}>
          <Icon name="x" color={nightInk.ink} />
        </Pressable>
      </View>
      <LinearGradient colors={[skyB + '00', skyB]} style={[s.rise, { height: barH + 48 }]} pointerEvents="none" />
      <View style={[s.foot, { paddingBottom: inset.bottom + 12 }]} onLayout={(e) => setBarH(e.nativeEvent.layout.height)}>
        <View style={s.bar}>
          <Text style={s.barW}>{f.w}</Text>
          <Text style={s.barHow} numberOfLines={2}>
            {f.how}
          </Text>
        </View>
        <Button label="Name it" onPress={() => onNext(sel.r, sel.c)} />
      </View>
    </View>
  );
}

/* ---------- the four corners ---------- */
const QUAD_COLOR: Record<string, string> = {
  red: 'hsl(351, 78%, 58%)',
  yellow: 'hsl(46, 93%, 57%)',
  blue: 'hsl(210, 85%, 66%)',
  green: 'hsl(150, 62%, 55%)',
};

/* ---------- the tool ---------- */
export function Feel({ finish, exit, now }: ToolProps & { now: number }) {
  const { width: W } = useWindowDimensions();
  const { tk, update } = useStore();
  const [step, setStep] = useState<'quad' | 'grid' | 'named'>('quad');
  const [from, setFrom] = useState(FEEL_QUADS[0]);
  const [sel, setSel] = useState<{ r: number; c: number } | null>(null);
  const night = urNight(new Date(now).getHours());
  const save = (w: string) => update((st) => ({ ...st, days: withDay(st.days, tk, feelLog(st.days[tk], tk, w, Date.now())) }));
  if (step === 'grid')
    return (
      <FeelGrid
        start={sel || { r: from.r, c: from.c }}
        onBack={() => {
          setSel(null);
          setStep('quad');
        }}
        onClose={exit}
        onNext={(r, c) => {
          setSel({ r, c });
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
            Right now
          </T>
          <T v="title" style={s.c} accessibilityRole="header">
            {f.w}
          </T>
          <T style={s.c}>{f.how}.</T>
          <Middle>
            <Shape kind={feelKind(sel.r, sel.c)} size={170} color={FEEL_COLORS[sel.r][sel.c]} turn={6} />
          </Middle>
          <Dock>
            <T v="small" tone="muted" style={s.c}>
              {lead ? lead.why : 'A good one to notice. Nothing needs fixing; let it soak in.'}
            </T>
            {lead && tool ? (
              <>
                <Button
                  label={'Try ' + tool.name}
                  onPress={() => {
                    save(f.w);
                    router.replace({ pathname: '/tool/[id]', params: { id: tool.id } });
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
          <View style={[s.quads, { width: d * 2 + 10, alignSelf: 'center' }]}>
            {FEEL_QUADS.map((q) => (
              <Pressable
                key={q.id}
                accessibilityRole="button"
                accessibilityLabel={q.name}
                onPress={() => {
                  buzz('tap');
                  setFrom(q);
                  setSel(null);
                  setStep('grid');
                }}
                style={({ pressed }) => [
                  s.quad,
                  { width: d, height: d, borderRadius: d / 2, backgroundColor: QUAD_COLOR[q.id], transform: [{ scale: pressed ? 0.96 : 1 }] },
                ]}>
                <Text style={s.quadT}>{q.name.split(', ')[0]}</Text>
                <Text style={s.quadT}>{q.name.split(', ')[1][0].toUpperCase() + q.name.split(', ')[1].slice(1)}</Text>
              </Pressable>
            ))}
          </View>
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
  foot: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 16, gap: 10, maxWidth: 560, alignSelf: 'center', width: '100%' },
  bar: {
    backgroundColor: 'rgba(13, 10, 43, 0.92)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 2,
    minHeight: 74,
    justifyContent: 'center',
  },
  barW: { fontFamily: font.display, fontSize: 20, lineHeight: 26, color: nightInk.ink },
  /* two lines of room always, so the bar never changes height (a moving bar would move the eye of the grid) */
  barHow: { fontFamily: font.body, fontSize: 13, lineHeight: 18, height: 36, color: nightInk.muted },
  quads: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, rowGap: 10 },
  quad: { alignItems: 'center', justifyContent: 'center' },
  quadT: { fontFamily: font.bodySemi, fontSize: 15, lineHeight: 20, color: INK, textAlign: 'center' },
  quiet: { alignItems: 'center' },
});
