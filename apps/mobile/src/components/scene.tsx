/* The frame for a full-screen moment (logging, Rekindle, the sunrise check, SOS): a soft sky, a top bar with Back and Close,
   progress dots, the card, and a quiet link at the bottom, or a sheet along the bottom edge (SOS). Like the legacy "scene".
   A dark sky (night, ember) gives everything inside it the night colors, in either theme. */
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, useWindowDimensions, View, type ScrollViewInstance } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Appear } from '@/components/appear';
import { Flame } from '@/components/flame';
import { Icon, InkContext, T } from '@/components/ui';
import { NATIVE, useReducedMotion } from '@/lib/motion';
import { MAX_WIDTH, NightContext, nightInk, skies, useTheme, type Sky } from '@/lib/theme';

export function SceneFrame({
  title,
  sky = 'sky',
  onBack,
  onClose,
  dots,
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
  const at = dots ? dots.i + '/' + dots.n : '';
  useEffect(() => {
    scroll.current?.scrollTo({ y: 0, animated: false });
  }, [at, title]);
  const body = (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={[a, b]} style={StyleSheet.absoluteFill} />
      <ScrollView
        ref={scroll}
        contentContainerStyle={[s.scroll, { paddingTop: inset.top + 10, paddingBottom: sheet ? (pinSheet ? 12 : 0) : inset.bottom + 24 }]}
        keyboardShouldPersistTaps="handled">
        <View style={s.col}>
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
            <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} style={[s.round, { backgroundColor: btn }]}>
              <Icon name="x" color={ink} />
            </Pressable>
          </View>
          {dots ? (
            <View style={s.dots} accessible accessibilityRole="progressbar" accessibilityLabel={dots.label}>
              {Array.from({ length: dots.n }, (_, j) => (
                <Dot key={j} state={j < dots.i ? 2 : j === dots.i ? 1 : 0} colors={[btn, dark ? '#FFC832' : c.sun, dark ? nightInk.ink : c.accent]} />
              ))}
            </View>
          ) : null}
          <View style={s.card}>{children}</View>
          {footer ? <View style={s.foot}>{footer}</View> : null}
        </View>
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
export function Finish({ level, title, text }: { level: number; title: string; text?: string }) {
  const c = useTheme();
  const reduce = useReducedMotion();
  const pop = useRef(new Animated.Value(0)).current;
  const ring = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduce) {
      pop.setValue(1);
      ring.setValue(1);
      return;
    }
    Animated.parallel([
      Animated.spring(pop, { toValue: 1, friction: 6, tension: 90, useNativeDriver: NATIVE }),
      Animated.timing(ring, { toValue: 1, duration: 1100, easing: Easing.out(Easing.cubic), useNativeDriver: NATIVE }),
    ]).start();
  }, [reduce, pop, ring]);
  return (
    <View style={s.middle}>
      <View style={s.finArt}>
        <Animated.View
          style={[
            s.finRing,
            {
              borderColor: c.sun,
              opacity: ring.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 0.55, 0] }),
              transform: [{ scale: ring.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.5] }) }],
            },
          ]}
        />
        <Animated.View
          style={{
            opacity: pop.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 1, 1] }),
            transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }],
          }}>
          <Flame level={level} size={150} />
        </Animated.View>
      </View>
      <Appear delay={220}>
        <T v="title" style={s.center} accessibilityRole="header">
          {title}
        </T>
      </Appear>
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
  topL: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  round: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  dots: { flexDirection: 'row', gap: 6, paddingHorizontal: 2 },
  dot: { flex: 1, height: 6, borderRadius: 3 },
  card: { flexGrow: 1, alignItems: 'center', gap: 14, paddingTop: 8 },
  foot: { alignItems: 'center', paddingTop: 4 },
  dock: { marginTop: 'auto', alignSelf: 'stretch', gap: 10, paddingTop: 10 },
  stage: { flexGrow: 1, alignSelf: 'stretch', alignItems: 'center', gap: 14 },
  middle: { flexGrow: 1, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 8 },
  center: { textAlign: 'center' },
  finArt: { width: 190, height: 190, alignItems: 'center', justifyContent: 'center' },
  finRing: { position: 'absolute', width: 170, height: 170, borderRadius: 85, borderWidth: 3 },
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
