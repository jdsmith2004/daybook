/* A sheet: a page that opens over everything for one thing (how points work, where I am, a day, an entry, a badge). It has a
   title, an optional line under it, and a Close button. Like the legacy sheets. */
import { router, useRoute } from 'expo-router';
import type { ReactNode } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Appear } from '@/components/appear';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, T } from '@/components/ui';
import { SHEETS } from '@/lib/nav';
import { MAX_WIDTH, useTheme } from '@/lib/theme';

export const closeSheet = () => (router.canGoBack() ? router.back() : router.replace('/'));

export function SheetFrame({
  title,
  sub,
  children,
  onClose = closeSheet,
  footer,
}: {
  title: string;
  sub?: string;
  children: ReactNode;
  onClose?: () => void;
  footer?: ReactNode;
}) {
  const c = useTheme();
  const inset = useSafeAreaInsets();
  /* on iOS a sheet already opens below the status bar, so it needs no room for it */
  const route = useRoute();
  const card = Platform.OS === 'ios' && SHEETS.includes(route.name);
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView
        automaticallyAdjustKeyboardInsets
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[s.scroll, { paddingTop: (card ? 0 : inset.top) + 12, paddingBottom: inset.bottom + 28 }]}>
        <Appear webOnly by={24} style={s.col}>
          <View style={s.head}>
            <View style={{ flex: 1, gap: 2 }}>
              <T v="title" accessibilityRole="header">
                {title}
              </T>
              {sub ? <T tone="muted">{sub}</T> : null}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={onClose}
              style={[s.x, { backgroundColor: c.surface, borderColor: c.cardEdge }]}>
              <Icon name="x" color={c.ink} />
            </Pressable>
          </View>
          {children}
          {footer}
        </Appear>
      </ScrollView>
    </View>
  );
}

/** a small heading inside a sheet, with an optional count on the right */
export function SheetH({ title, aside }: { title: string; aside?: string }) {
  return (
    <View style={s.h}>
      <T v="h2" accessibilityRole="header">
        {title}
      </T>
      {aside ? (
        <T v="small" tone="muted">
          {aside}
        </T>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  scroll: { flexGrow: 1, paddingHorizontal: 16, alignItems: 'center' },
  /* it fills the screen, so a Done in a Dock sits at the bottom */
  col: { width: '100%', maxWidth: MAX_WIDTH, flexGrow: 1, gap: 14 },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  x: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  h: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, marginTop: 4 },
});
