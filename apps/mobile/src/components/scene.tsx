/* The frame for a full-screen moment (logging, Rekindle, SOS): a soft sky, a top bar with Back and Close,
   progress dots, the card, and a quiet link at the bottom, or a sheet along the bottom edge (SOS). Like the legacy "scene".
   A dark sky (night, ember) gives everything inside it the night colors, in either theme. */
import { emblemLayers } from '@daybook/core';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, useWindowDimensions, View, type ScrollViewInstance } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Appear } from '@/components/appear';
import { FitArt, FitProvider, SHORT, useFitRoom } from '@/components/fit';
import { Flame } from '@/components/flame';
import { Shape, type ShapeKind } from '@/components/shapes';
import { KeyboardRoom } from '@/components/keyboard';
import { Icon, InkContext, T } from '@/components/ui';
import { NATIVE, SPRING, useReducedMotion } from '@/lib/motion';
import { MAX_WIDTH, NightContext, nightInk, skies, useTheme, type Sky } from '@/lib/theme';

export function SceneFrame({
  title,
  sky = 'sky',
  onBack,
  onClose,
  dots,
  bar,
  bare,
  topRight,
  footer,
  sheet,
  pinSheet,
  children,
}: {
  title: string;
  sky?: Sky;
  onBack?: (() => void) | null;
  onClose: () => void;
  dots?: { n: number; i: number; label: string } | null;
  /** one smooth progress bar for a long flow (the setup): `frac` of the way, 0 to 1, and its words for a screen reader
      ("page 4 of 35"). The title above it is then the name of the part. With a bar, the page sits on a white card,
      unless it is `bare`. */
  bar?: { frac: number; label: string; color?: string } | null;
  /** with a bar: this page has no card, the art sits big on the sky itself */
  bare?: boolean;
  /** something small next to Close in the top bar (the setup's SOS pill) */
  topRight?: ReactNode;
  footer?: ReactNode;
  /** a sheet along the bottom edge, below the card (the SOS screens) */
  sheet?: ReactNode;
  /** the sheet stays put at the bottom while the card above it scrolls (a long list over the main button) */
  pinSheet?: boolean;
  children: ReactNode;
}) {
  const c = useTheme();
  const inset = useSafeAreaInsets();
  const dark = sky === 'night' || sky === 'ember';
  const ink = dark ? nightInk.ink : c.ink;
  const btn = dark ? nightInk.btn : c.scBtn;
  const [a, b] = skies[c.scheme][sky];
  /* each new step starts at the top, even when the last one was scrolled down to its answers */
  const scroll = useRef<ScrollViewInstance>(null);
  /* a picture inside (FitArt) shrinks so the page fits a short phone */
  const fit = useFitRoom();
  const at = dots ? dots.i + '/' + dots.n : bar ? bar.label : '';
  useEffect(() => {
    scroll.current?.scrollTo({ y: 0, animated: false });
  }, [at, title]);
  const body = (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={[a, b]} style={StyleSheet.absoluteFill} />
      <ScrollView
        ref={scroll}
        onLayout={fit.onLayout}
        onContentSizeChange={fit.onContentSizeChange}
        contentContainerStyle={[s.scroll, { paddingTop: inset.top + 10, paddingBottom: sheet ? (pinSheet ? 12 : 0) : inset.bottom + (SHORT ? 10 : 24) }]}
        automaticallyAdjustKeyboardInsets
        keyboardShouldPersistTaps="handled">
        <FitProvider value={fit.ctx}>
          <KeyboardRoom scroll={scroll}>
            <View style={[s.col, SHORT && s.colShort]}>
              <View style={s.top}>
                <View style={s.topL}>
                  {onBack ? (
                    <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={onBack} style={[s.round, { backgroundColor: btn }]}>
                      <Icon name="back" color={ink} />
                    </Pressable>
                  ) : null}
                  <T v="eyebrow" style={{ color: dark ? nightInk.muted : c.muted }} accessibilityRole="header">
                    {title}
                  </T>
                </View>
                <View style={s.topR}>
                  {topRight}
                  <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} style={[s.round, { backgroundColor: btn }]}>
                    <Icon name="x" color={ink} />
                  </Pressable>
                </View>
              </View>
              {bar ? <ProgressBar frac={bar.frac} label={bar.label} track={btn} color={bar.color ?? c.accent} /> : null}
              {dots ? (
                <View style={s.dots} accessible accessibilityRole="progressbar" accessibilityLabel={dots.label}>
                  {Array.from({ length: dots.n }, (_, j) => (
                    <Dot key={j} state={j < dots.i ? 2 : j === dots.i ? 1 : 0} colors={[btn, dark ? '#FFC832' : c.sun, dark ? nightInk.ink : c.accent]} />
                  ))}
                </View>
              ) : null}
              <View style={[s.card, SHORT && s.cardShort, bar && !bare && (SHORT ? s.paperShort : s.paper)]}>
                {bar ? <Paper on={!bare} /> : null}
                {children}
              </View>
              {footer ? <View style={s.foot}>{footer}</View> : null}
            </View>
          </KeyboardRoom>
        </FitProvider>
        {sheet && !pinSheet ? <Sheet bottom={inset.bottom}>{sheet}</Sheet> : null}
      </ScrollView>
      {sheet && pinSheet ? (
        <View style={s.pinned}>
          <Sheet bottom={inset.bottom}>{sheet}</Sheet>
        </View>
      ) : null}
    </View>
  );
  return dark ? (
    <NightContext.Provider value={true}>
      <StatusBar style="light" />
      <InkContext.Provider value={{ ink: nightInk.ink, muted: nightInk.muted }}>{body}</InkContext.Provider>
    </NightContext.Provider>
  ) : (
    body
  );
}

/** the one bar of a long flow: it eases to where the flow now is */
function ProgressBar({ frac, label, track, color }: { frac: number; label: string; track: string; color: string }) {
  const reduce = useReducedMotion();
  const v = useRef(new Animated.Value(frac)).current;
  useEffect(() => {
    if (reduce) v.setValue(frac);
    else Animated.timing(v, { toValue: frac, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [frac, reduce, v]);
  return (
    <View style={[s.track, { backgroundColor: track }]} accessible accessibilityRole="progressbar" accessibilityLabel={label}>
      <Animated.View
        style={[s.fill, { backgroundColor: color, width: v.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'], extrapolate: 'clamp' }) }]}
      />
    </View>
  );
}

/** the white card behind a question page; it fades in and out as the flow moves between cards and bare scenes */
function Paper({ on }: { on: boolean }) {
  const c = useTheme();
  const reduce = useReducedMotion();
  const v = useRef(new Animated.Value(on ? 1 : 0)).current;
  useEffect(() => {
    if (reduce) v.setValue(on ? 1 : 0);
    else Animated.timing(v, { toValue: on ? 1 : 0, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [on, reduce, v]);
  return <Animated.View pointerEvents="none" style={[s.paperBg, { backgroundColor: c.surface, shadowColor: c.lip, opacity: v }]} />;
}

/** one segment of the progress bar: to come (0), now (1, longer and bright) or done (2). It grows and changes color
    smoothly as the steps move on. */
function Dot({ state, colors }: { state: 0 | 1 | 2; colors: [string, string, string] }) {
  const reduce = useReducedMotion();
  const v = useRef(new Animated.Value(state)).current;
  useEffect(() => {
    if (reduce) v.setValue(state);
    else Animated.timing(v, { toValue: state, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [state, reduce, v]);
  const grow = v.interpolate({ inputRange: [0, 1, 2], outputRange: [1, 2, 1] });
  return <Animated.View style={[s.dot, { flexGrow: grow, backgroundColor: v.interpolate({ inputRange: [0, 1, 2], outputRange: colors }) }]} />;
}

/** the main button of a full-screen moment, at the bottom of the screen where the thumb is (see CLAUDE.md). Put it as a
    direct child of the frame's content; everything above stays where it is. */
export function Dock({ children }: { children: ReactNode }) {
  return <View style={s.dock}>{children}</View>;
}

/** one step of a full-screen moment. Give it a new `key` for each step: it slides in from the right (dir 1), from the left
    when going back (dir -1), or just fades (dir 0). It fills the screen, so a Dock inside it still sits at the bottom. */
export function Stage({ dir = 1, children }: { dir?: -1 | 0 | 1; children: ReactNode }) {
  return (
    <Appear x={36 * dir} by={dir ? 0 : 8} duration={280} style={s.stage}>
      {children}
    </Appear>
  );
}

/** the open middle of a full-screen moment: whatever is being looked at or decided, centered between the words above and
    the Dock below */
export function Middle({ children }: { children: ReactNode }) {
  return <View style={s.middle}>{children}</View>;
}

/** the finish of a tool or a moment: the flame pops in on a soft ring that widens once, in the middle of the screen, with
    the words under it. The Dock with Done goes after it. */
/* the shapes that fly out from behind the flame and settle around it: where each lands (x, y from the center), its kind,
   size, turn and color slot. Fixed, so every Finish is the same loose, hand-placed ring. */
const BURST: { x: number; y: number; kind: ShapeKind; size: number; turn: number; tint: number }[] = [
  { x: -98, y: -40, kind: 'cookie4', size: 30, turn: 12, tint: 0 },
  { x: -62, y: -88, kind: 'pill', size: 20, turn: -35, tint: 1 },
  { x: 4, y: -106, kind: 'sunny', size: 24, turn: 0, tint: 2 },
  { x: 66, y: -82, kind: 'clover4', size: 30, turn: 20, tint: 3 },
  { x: 108, y: -22, kind: 'gem', size: 20, turn: 10, tint: 1 },
  { x: 98, y: 46, kind: 'cookie6', size: 27, turn: -14, tint: 0 },
  { x: 58, y: 92, kind: 'triangle', size: 16, turn: 24, tint: 2 },
  { x: -102, y: 42, kind: 'softBurst', size: 24, turn: 4, tint: 2 },
  { x: -66, y: 90, kind: 'heart', size: 17, turn: -10, tint: 3 },
];

/** the end of a tool: the flame pops in and a few shapes burst out from behind it and settle around it, once. `tone` is the
    tool's color (sky, mint, accent, sun, violet, coral); without it the shapes are warm. */
export function Finish({
  level,
  title,
  text,
  tone,
  alive,
  size = 150,
  always,
  zoom,
}: {
  level: number;
  title?: string;
  text?: string;
  tone?: string;
  /** the flame moves gently (the end of the setup) */
  alive?: boolean;
  size?: number;
  /** the flame and its burst shrink to fit a short phone, never step aside (the end of the setup) */
  always?: boolean;
  /** the flame drawn this many times bigger, centered on the figure and cut to a round window of `size`, so the figure
      itself fills most of it (the end of the setup: the flame big, never a small spark in a big sky) */
  zoom?: number;
}) {
  const c = useTheme();
  const reduce = useReducedMotion();
  const pop = useRef(new Animated.Value(0)).current;
  /* each shape on its own spring (Material's default spatial spring: a touch of overshoot), leaving one after another */
  const fly = useRef(BURST.map(() => new Animated.Value(0))).current;
  useEffect(() => {
    if (reduce) {
      pop.setValue(1);
      fly.forEach((v) => v.setValue(1));
      return;
    }
    Animated.parallel([
      Animated.spring(pop, { toValue: 1, ...SPRING.fast, useNativeDriver: NATIVE }),
      Animated.stagger(
        45,
        fly.map((v) => Animated.spring(v, { toValue: 1, ...SPRING.default, delay: 80, useNativeDriver: NATIVE })),
      ),
    ]).start();
  }, [reduce, pop, fly]);
  const own = tone ? ({ sky: c.sky, mint: c.mint, accent: c.accent, sun: c.sun, violet: c.violet, coral: c.coral } as Record<string, string>)[tone] : undefined;
  const tints = own ? [own, c.sun, c.sun2, own] : [c.sun, c.sun2, c.coral, c.violet];
  const at = useMemo(() => (zoom ? (emblemLayers(level, false)?.at ?? { x: 0.5, y: 0.5 }) : null), [zoom, level]);
  const big = zoom ? size * zoom : size;
  return (
    <View style={s.middle}>
      <FitArt drop={always ? undefined : 0.4} min={always ? 0.5 : undefined}>
        <View style={s.finArt}>
          {BURST.map((b, i) => {
            const f = fly[i];
            const out = f.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: 'clamp' });
            return (
              <Animated.View
                key={i}
                style={[
                  s.finShape,
                  {
                    opacity: out.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0, 0.9, 0.9] }),
                    transform: [
                      { translateX: f.interpolate({ inputRange: [0, 1], outputRange: [0, b.x] }) },
                      { translateY: f.interpolate({ inputRange: [0, 1], outputRange: [10, b.y] }) },
                      { scale: out.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) },
                      { rotate: out.interpolate({ inputRange: [0, 1], outputRange: [b.turn - 90 + 'deg', b.turn + 'deg'] }) },
                    ],
                  },
                ]}>
                <Shape kind={b.kind} size={b.size} color={tints[b.tint]} />
              </Animated.View>
            );
          })}
          <Animated.View
            style={{
              opacity: pop.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 1, 1] }),
              transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }],
            }}>
            {at ? (
              <View style={[s.window, { width: size, height: size, borderRadius: size / 2, borderColor: tints[0] }]}>
                <View style={{ position: 'absolute', left: size / 2 - at.x * big, top: size / 2 - at.y * big }}>
                  <Flame level={level} size={big} alive={alive} />
                </View>
              </View>
            ) : (
              <Flame level={level} size={size} alive={alive} />
            )}
          </Animated.View>
        </View>
      </FitArt>
      {title ? (
        <Appear delay={220}>
          <T v="title" style={s.center} accessibilityRole="header">
            {title}
          </T>
        </Appear>
      ) : null}
      {text ? (
        <Appear delay={320}>
          <T style={s.center}>{text}</T>
        </Appear>
      ) : null}
    </View>
  );
}

/* the sheet below the horizon: edge to edge on a phone, a floating card on a wide screen */
function Sheet({ bottom, children }: { bottom: number; children: ReactNode }) {
  const c = useTheme();
  const wide = useWindowDimensions().width >= 600;
  return (
    <InkContext.Provider value={null}>
      <View
        style={[
          s.sheet,
          { backgroundColor: c.surface, shadowColor: c.lip },
          wide
            ? { alignSelf: 'center', width: '100%', marginTop: 8, marginBottom: bottom + 20, borderRadius: 30, maxWidth: MAX_WIDTH }
            : { marginHorizontal: -16, paddingBottom: Math.max(20, bottom + 12) },
        ]}>
        {children}
      </View>
    </InkContext.Provider>
  );
}

const s = StyleSheet.create({
  scroll: { flexGrow: 1, paddingHorizontal: 16, alignItems: 'center' },
  pinned: { paddingHorizontal: 16, alignItems: 'center' },
  col: { width: '100%', maxWidth: MAX_WIDTH, flexGrow: 1, gap: 14 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 },
  topR: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  track: { height: 8, borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
  paper: { padding: 18, borderRadius: 28 },
  paperShort: { padding: 14, borderRadius: 24 },
  paperBg: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: 28,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  topL: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  round: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  dots: { flexDirection: 'row', gap: 6, paddingHorizontal: 2 },
  dot: { flex: 1, height: 6, borderRadius: 3 },
  card: { flexGrow: 1, alignItems: 'center', gap: 14, paddingTop: 8 },
  /* a short phone (the SE) packs a little tighter, so a moment fits without scrolling */
  colShort: { gap: 10 },
  cardShort: { gap: 12, paddingTop: 2 },
  foot: { alignItems: 'center', paddingTop: 4 },
  dock: { marginTop: 'auto', alignSelf: 'stretch', gap: 10, paddingTop: 10 },
  stage: { flexGrow: 1, alignSelf: 'stretch', alignItems: 'center', gap: 14 },
  middle: { flexGrow: 1, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 8 },
  center: { textAlign: 'center' },
  finArt: { width: 250, height: 220, alignItems: 'center', justifyContent: 'center' },
  window: { overflow: 'hidden', borderWidth: 4 },
  /* every burst shape starts at the middle, behind the flame */
  finShape: { position: 'absolute', left: 125 - 17, top: 110 - 17, width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  sheet: {
    alignSelf: 'stretch',
    gap: 14,
    marginTop: 18,
    padding: 20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    shadowOffset: { width: 0, height: -14 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 12,
  },
});
