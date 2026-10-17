/* The frame for a full-screen moment (logging, Rekindle, the sunrise check, SOS): a soft sky, a top bar with Back and Close,
   progress dots, the card, and a quiet link at the bottom, or a sheet along the bottom edge (SOS). Like the legacy "scene".
   A dark sky (night, ember) gives everything inside it the night colors, in either theme. */
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, InkContext, T } from '@/components/ui';
import { MAX_WIDTH, NightContext, nightInk, skies, useTheme, type Sky } from '@/lib/theme';

export function SceneFrame({
  title,
  sky = 'sky',
  onBack,
  onClose,
  dots,
  footer,
  sheet,
  children,
}: {
  title: string;
  sky?: Sky;
  onBack?: (() => void) | null;
  onClose: () => void;
  dots?: { n: number; i: number; label: string } | null;
  footer?: ReactNode;
  /** a sheet along the bottom edge, below the card (the first SOS screen) */
  sheet?: ReactNode;
  children: ReactNode;
}) {
  const c = useTheme();
  const inset = useSafeAreaInsets();
  const dark = sky === 'night' || sky === 'ember';
  const ink = dark ? nightInk.ink : c.ink;
  const btn = dark ? nightInk.btn : c.scBtn;
  const [a, b] = skies[c.scheme][sky];
  const body = (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={[a, b]} style={StyleSheet.absoluteFill} />
      <ScrollView
        contentContainerStyle={[s.scroll, { paddingTop: inset.top + 10, paddingBottom: sheet ? 0 : inset.bottom + 24 }]}
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
                <View
                  key={j}
                  style={[
                    s.dot,
                    { backgroundColor: j < dots.i ? (dark ? nightInk.ink : c.accent) : j === dots.i ? (dark ? '#FFC832' : c.sun) : btn },
                    j === dots.i && { flex: 2 },
                  ]}
                />
              ))}
            </View>
          ) : null}
          <View style={s.card}>{children}</View>
          {footer ? <View style={s.foot}>{footer}</View> : null}
        </View>
        {sheet ? <Sheet bottom={inset.bottom}>{sheet}</Sheet> : null}
      </ScrollView>
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

/** the main button of a full-screen moment, at the bottom of the screen where the thumb is (see CLAUDE.md). Put it as a
    direct child of the frame's content; everything above stays where it is. */
export function Dock({ children }: { children: ReactNode }) {
  return <View style={s.dock}>{children}</View>;
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
          wide ? { alignSelf: 'center', width: '100%', marginTop: 8, marginBottom: bottom + 20, borderRadius: 30, maxWidth: MAX_WIDTH } : { marginHorizontal: -16, paddingBottom: Math.max(20, bottom + 12) },
        ]}>
        {children}
      </View>
    </InkContext.Provider>
  );
}

const s = StyleSheet.create({
  scroll: { flexGrow: 1, paddingHorizontal: 16, alignItems: 'center' },
  col: { width: '100%', maxWidth: MAX_WIDTH, flexGrow: 1, gap: 14 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 },
  topL: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  round: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  dots: { flexDirection: 'row', gap: 6, paddingHorizontal: 2 },
  dot: { flex: 1, height: 6, borderRadius: 3 },
  card: { flexGrow: 1, alignItems: 'center', gap: 14, paddingTop: 8 },
  foot: { alignItems: 'center', paddingTop: 4 },
  dock: { marginTop: 'auto', alignSelf: 'stretch', gap: 10, paddingTop: 10 },
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
