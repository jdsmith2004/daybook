/* The frame for a full-screen moment (logging, Rekindle, the sunrise check): a soft sky, a top bar with Back and Close,
   progress dots, the card, and a quiet link at the bottom. Like the legacy "scene". */
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, InkContext, T } from '@/components/ui';
import { MAX_WIDTH, nightInk, skies, useTheme, type Sky } from '@/lib/theme';

export function SceneFrame({
  title,
  sky = 'sky',
  onBack,
  onClose,
  dots,
  footer,
  children,
}: {
  title: string;
  sky?: Sky;
  onBack?: (() => void) | null;
  onClose: () => void;
  dots?: { n: number; i: number; label: string } | null;
  footer?: ReactNode;
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
        contentContainerStyle={[s.scroll, { paddingTop: inset.top + 10, paddingBottom: inset.bottom + 24 }]}
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
      </ScrollView>
    </View>
  );
  return dark ? <InkContext.Provider value={{ ink: nightInk.ink, muted: nightInk.muted }}>{body}</InkContext.Provider> : body;
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
});
