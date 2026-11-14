/* The frame for a full-screen moment (logging, Rekindle, the sunrise check, SOS): a soft sky, a top bar with Back and Close,
   progress dots, the card, and a quiet link at the bottom, or a sheet along the bottom edge (SOS). Like the legacy "scene".
   A dark sky (night, ember) gives everything inside it the night colors, in either theme. */
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Animated, Easing, Platform, Pressable, ScrollView, StyleSheet, useWindowDimensions, View, type ScrollViewInstance } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Appear } from '@/components/appear';
import { FitArt, FitProvider, SHORT, useFitRoom } from '@/components/fit';
import { FlameMedallion } from '@/components/flame-medallion';
import { Burst, Sparkles } from '@/components/reward-kit';
import { KeyboardRoom } from '@/components/keyboard';
import { Icon, InkContext, T } from '@/components/ui';
import { NATIVE, SPRING, useReducedMotion } from '@/lib/motion';
import { MAX_WIDTH, NightContext, nightInk, skies, useTheme, type Sky } from '@/lib/theme';

/* a step's main button, handed up to the frame (Pin) */
const PinCtx = createContext<((node: ReactNode) => void) | null>(null);

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
  pin,
  sheet,
  pinSheet,
  fixed,
  backdrop,
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
  /** the main button, and any quiet link under it, held at the bottom of the screen while the card above scrolls: a card
      that can grow (a row that opens) never pushes the button out of reach */
  pin?: ReactNode;
  /** a sheet along the bottom edge, below the card (the SOS screens) */
  sheet?: ReactNode;
  /** the sheet stays put at the bottom while the card above it scrolls (a long list over the main button) */
  pinSheet?: boolean;
  /** the page does not scroll, so an up or down swipe belongs to what is on it (the SOS ride, which swipes like short
      videos: components/ride/swipe.tsx) */
  fixed?: boolean;
  /** something drawn on the sky, behind the page (the walk's stars) */
  backdrop?: ReactNode;
  children: ReactNode;
}) {
  const c = useTheme();
  const inset = useSafeAreaInsets();
  const dark = sky === 'night' || sky === 'ember' || sky === 'paper';
  const ink = dark ? nightInk.ink : c.ink;
  const btn = dark ? nightInk.btn : c.scBtn;
  const [a, b] = skies[c.scheme][sky];
  /* each new step starts at the top, even when the last one was scrolled down to its answers */
  const scroll = useRef<ScrollViewInstance>(null);
  /* a picture inside (FitArt) shrinks so the page fits a short phone */
  const fit = useFitRoom();
  const [stepPin, setStepPin] = useState<ReactNode>(null);
  const held = pin ?? stepPin;
  const at = dots ? dots.i + '/' + dots.n : bar ? bar.label : '';
  useEffect(() => {
    scroll.current?.scrollTo({ y: 0, animated: false });
  }, [at, title]);
  const body = (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={[a, b]} style={StyleSheet.absoluteFill} />
      {backdrop}
      <ScrollView
        ref={scroll}
        /* it starts under the clock, so a long page scrolls away beneath it and never through it. The fire's short pages let their
           glow reach past it, so the warmth has no hard edge under the clock. */
        style={[{ marginTop: inset.top }, sky === 'ember' && Platform.OS !== 'web' && { overflow: 'visible' }]}
        onLayout={fit.onLayout}
        onContentSizeChange={fit.onContentSizeChange}
        contentContainerStyle={[s.scroll, { paddingTop: 10, paddingBottom: sheet ? (pinSheet ? 12 : 0) : held ? 12 : inset.bottom + (SHORT ? 10 : 24) }]}
        automaticallyAdjustKeyboardInsets
        scrollEnabled={!fixed}
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
                <PinCtx.Provider value={setStepPin}>{children}</PinCtx.Provider>
              </View>
              {footer ? <View style={s.foot}>{footer}</View> : null}
            </View>
          </KeyboardRoom>
        </FitProvider>
        {sheet && !pinSheet ? <Sheet bottom={inset.bottom}>{sheet}</Sheet> : null}
      </ScrollView>
      {held ? (
        <View style={[s.pinned, { paddingBottom: inset.bottom + (SHORT ? 10 : 24) }]}>
          {/* a page that scrolls under the button fades out into the sky above it, never a hard cut through a row */}
          <LinearGradient pointerEvents="none" colors={[mix(a, b, 0.88) + '00', mix(a, b, 0.88)]} style={s.fade} />
          <View style={s.pinCol}>{held}</View>
        </View>
      ) : null}
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

/** a color between two #rrggbb colors, t of the way from a to b (the sky near the pinned button) */
function mix(a: string, b: string, t: number) {
  const ch = (h: string, i: number) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16);
  if (!/^#[0-9a-f]{6}$/i.test(a) || !/^#[0-9a-f]{6}$/i.test(b)) return b.slice(0, 7);
  return (
    '#' +
    [0, 1, 2]
      .map((i) =>
        Math.round(ch(a, i) + (ch(b, i) - ch(a, i)) * t)
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')
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

/** a step's main button, held at the bottom of the screen while a long list above it scrolls, so a small phone never has to
    scroll to find it. Goes where the button would go, inside the Dock. */
export function Pin({ children }: { children: ReactNode }) {
  const set = useContext(PinCtx);
  useLayoutEffect(() => {
    set?.(children);
  });
  useLayoutEffect(() => () => set?.(null), [set]);
  return set ? null : <>{children}</>;
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

/** the finish of a tool or a moment (the owner, November 13, 2026: "the random shapes look weird the avatar is too smal"): the
    flame in its round sky, drawn big (FlameMedallion, the same as Welcome back and the first week), pops in, and its own light
    answers: two soft rings of warm light widen out from it and fade, and the fire leaps and blooms once. No shapes are thrown
    around it: what moves belongs to the flame. The words come in under it, and the Dock with Done goes after. Still under
    Reduce Motion. */
export function Finish({
  level,
  title,
  text,
  size: want,
  always,
  least,
  cheer,
}: {
  level: number;
  title?: string;
  text?: string;
  /** how wide the round sky is; by default as big as the screen allows, up to 240 */
  size?: number;
  /** the flame shrinks to fit a short phone, never steps aside (the end of the setup) */
  always?: boolean;
  /** with always: the smallest the flame gets, as a share of its size (a celebration keeps it big and lets the rest scroll) */
  least?: number;
  /** a finished day: confetti thrown up from the flame as it lands, and gold stars twinkling round it (the check-in) */
  cheer?: boolean;
}) {
  const reduce = useReducedMotion();
  const win = useWindowDimensions();
  const size = want ?? Math.round(Math.min(win.width - 120, 240));
  const pop = useRef(new Animated.Value(reduce ? 1 : 0)).current;
  const rings = useRef([new Animated.Value(0), new Animated.Value(0)]).current;
  const [pulse, setPulse] = useState(0);
  useEffect(() => {
    if (reduce) return;
    const a = Animated.parallel([
      Animated.spring(pop, { toValue: 1, ...SPRING.fast, useNativeDriver: NATIVE }),
      Animated.stagger(
        260,
        rings.map((v) => Animated.timing(v, { toValue: 1, duration: 1300, delay: 160, easing: Easing.out(Easing.cubic), useNativeDriver: NATIVE })),
      ),
    ]);
    a.start();
    /* the fire leaps as it lands */
    const t = setTimeout(() => setPulse(1), 220);
    return () => {
      a.stop();
      clearTimeout(t);
    };
  }, [reduce, pop, rings]);
  const room = Math.round(size * 1.12);
  return (
    <View style={s.middle}>
      <FitArt drop={always ? undefined : 0.4} min={always ? (least ?? 0.5) : undefined}>
        <View style={[s.finArt, { width: room, height: room }]}>
          {reduce
            ? null
            : rings.map((v, i) => (
                <Animated.View
                  key={i}
                  pointerEvents="none"
                  style={[
                    s.finRing,
                    {
                      width: size,
                      height: size,
                      borderRadius: size / 2,
                      opacity: v.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 0.75, 0] }),
                      transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.42 - i * 0.1] }) }],
                    },
                  ]}
                />
              ))}
          <Animated.View
            style={{
              opacity: pop.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 1, 1] }),
              transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }],
            }}>
            <FlameMedallion level={level} size={size} pulse={pulse} />
          </Animated.View>
          {cheer && !reduce ? (
            <>
              <View pointerEvents="none" style={{ position: 'absolute', left: (room - size) / 2, top: (room - size) / 2, width: size, height: size }}>
                <Sparkles size={size} at={420} still={false} />
              </View>
              <Burst fire={pulse} x={room / 2} y={room * 0.42} w={win.width * 1.3} n={30} />
            </>
          ) : null}
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
  scroll: { flexGrow: 1, paddingHorizontal: 16, alignItems: 'center', overflow: 'hidden' },
  pinned: { paddingHorizontal: 16, alignItems: 'center' },
  fade: { position: 'absolute', left: 0, right: 0, top: -28, height: 28 },
  pinCol: { width: '100%', maxWidth: MAX_WIDTH, gap: 10, paddingTop: 6 },
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
  finArt: { alignItems: 'center', justifyContent: 'center' },
  /* the light that widens out from the flame as it lands: warm, the color of its glow */
  finRing: { position: 'absolute', borderWidth: 4, borderColor: '#FFC857' },
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
