/* Name the feeling: the Mood Meter grid, Daybook style. A color picks the corner of feeling, then a pannable 10 by 10
   field of feeling bubbles, each colored by where it sits (energy down the rows, pleasantness across the columns).
   Tapping a bubble grows it into one of the Material shapes and eases its neighbors aside, the word and its line show in
   the bar at the bottom, and naming it leads on to the tool that fits (core feelings.ts). The pan, the throw and the
   push around the chosen bubble all run on the UI thread (Reanimated and the gesture handler), so the field stays smooth
   while it moves. */
import { FEEL_QUADS, FEELINGS, feelAt, feelLead, feelLog, TOOLS, urNight, withDay } from '@daybook/core';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Reanimated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withDecay, withTiming, type SharedValue } from 'react-native-reanimated';
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

/** the chosen bubble's shape: it starts as the circle it was and morphs out (MorphShape springs when `kind` changes) */
function SelShape({ kind, size, color }: { kind: ShapeKind; size: number; color: string }) {
  const [k, setK] = useState<ShapeKind>('circle');
  useEffect(() => {
    const t = setTimeout(() => setK(kind), 30);
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
  onPick: (r: number, c: number) => void;
  sx: SharedValue<number>;
  sy: SharedValue<number>;
  amt: SharedValue<number>;
}) {
  const f = FEELINGS[r][c];
  const color = FEEL_COLORS[r][c];
  /* the field around the chosen bubble: it grows half again, and its neighbors ease away with a soft falloff, so the
     choice rolls through the field instead of snapping */
  const st = useAnimatedStyle(
    () => {
      const dx = (c - sx.value) * step;
      const dy = (r - sy.value) * step;
      const d2 = dx * dx + dy * dy;
      const d = Math.sqrt(d2);
      const sig = 0.95 * step;
      const gs = 0.45 * step;
      const push = amt.value * 0.5 * step * Math.exp(-d2 / (2 * sig * sig));
      const scale = 1 + amt.value * 0.5 * Math.exp(-d2 / (2 * gs * gs));
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
        {isSel ? (
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
  picked,
  onBack,
  onClose,
  onNext,
}: {
  /** the cell the field opens centered on */
  start: { r: number; c: number };
  /** a pick kept from last time (coming back from the named page) */
  picked: { r: number; c: number } | null;
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
  const [sel, setSel] = useState(picked);
  const [barH, setBarH] = useState(168);
  const head = inset.top + 60;
  const footTop = H - barH - 8;
  /* where the field may sit: its edges stop a little inside the screen (centered instead, on a window taller or wider
     than the whole field) */
  const [bx0, bx1] = content + 24 <= W ? [(W - content) / 2, (W - content) / 2] : [W - content - 12, 12];
  const [by0, by1] = content <= footTop - head ? [head + (footTop - head - content) / 2, head + (footTop - head - content) / 2] : [footTop - content, head];
  const tx = useSharedValue(clamp(W / 2 - (start.c + 0.5) * step, bx0, bx1));
  const ty = useSharedValue(clamp((head + footTop) / 2 - (start.r + 0.5) * step, by0, by1));
  /* the chosen cell the push field bends around (sx, sy in cells; amt eases the field in) */
  const sx = useSharedValue(picked ? picked.c : 0);
  const sy = useSharedValue(picked ? picked.r : 0);
  const amt = useSharedValue(picked ? 1 : 0);
  /* a click right after a drag (the web: mouse up fires one) is the drag letting go, not a pick */
  const dragAt = useRef(0);
  const markDrag = () => {
    dragAt.current = Date.now();
  };
  const glide = { duration: 260, easing: Easing.out(Easing.cubic) };
  const pick = (r: number, cc: number) => {
    if (Date.now() - dragAt.current < 250) return;
    buzz('tap');
    setSel({ r, c: cc });
    if (amt.value < 0.02) {
      sx.value = cc;
      sy.value = r;
    } else {
      sx.value = reduce ? cc : withTiming(cc, glide);
      sy.value = reduce ? r : withTiming(r, glide);
    }
    amt.value = reduce ? 1 : withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) });
    /* ease the field over so the chosen bubble sits clear of the edges and the bar */
    const cx = (cc + 0.5) * step;
    const cy = (r + 0.5) * step;
    let nx = tx.value;
    let ny = ty.value;
    const mx = step * 0.95;
    if (cx + nx < mx) nx += mx - (cx + nx);
    else if (cx + nx > W - mx) nx -= cx + nx - (W - mx);
    const mTop = head + step * 0.6;
    const mBot = footTop - step * 0.6;
    if (cy + ny < mTop) ny += mTop - (cy + ny);
    else if (cy + ny > mBot) ny -= cy + ny - mBot;
    nx = clamp(nx, bx0, bx1);
    ny = clamp(ny, by0, by1);
    if (nx !== tx.value) tx.value = reduce ? nx : withTiming(nx, glide);
    if (ny !== ty.value) ty.value = reduce ? ny : withTiming(ny, glide);
  };
  const pan = useMemo(
    () =>
      Gesture.Pan()
        .onChange((e) => {
          'worklet';
          tx.value = clamp(tx.value + e.changeX, bx0, bx1);
          ty.value = clamp(ty.value + e.changeY, by0, by1);
        })
        .onEnd((e) => {
          'worklet';
          if (reduce) return;
          tx.value = withDecay({ velocity: e.velocityX, clamp: [bx0, bx1] });
          ty.value = withDecay({ velocity: e.velocityY, clamp: [by0, by1] });
        })
        .onFinalize((e) => {
          'worklet';
          if (Math.abs(e.translationX) + Math.abs(e.translationY) > 10) runOnJS(markDrag)();
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bx0, bx1, by0, by1, reduce],
  );
  const canvas = useAnimatedStyle(() => ({ transform: [{ translateX: tx.value }, { translateY: ty.value }] }), webDeps(tx, ty));
  const [skyA, skyB] = skies[c.scheme].night;
  const f = sel ? feelAt(sel.r, sel.c) : null;
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
          {f ? (
            <>
              <Text style={s.barW}>{f.w}</Text>
              <Text style={s.barHow} numberOfLines={2}>
                {f.how}
              </Text>
            </>
          ) : (
            <>
              <Text style={s.barW}>Find the word that fits</Text>
              <Text style={s.barHow} numberOfLines={2}>
                Drag to look around, and tap a feeling to try it on.
              </Text>
            </>
          )}
        </View>
        <Button label="Name it" disabled={!sel} onPress={() => sel && onNext(sel.r, sel.c)} />
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
        picked={sel}
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
  barHow: { fontFamily: font.body, fontSize: 13, lineHeight: 18, color: nightInk.muted },
  quads: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, rowGap: 10 },
  quad: { alignItems: 'center', justifyContent: 'center' },
  quadT: { fontFamily: font.bodySemi, fontSize: 15, lineHeight: 20, color: INK, textAlign: 'center' },
  quiet: { alignItems: 'center' },
});
