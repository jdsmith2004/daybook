/* A scrolling screen with the page color, a title, and room for the tab bar. A page opened on top of the tabs (from More, or
   from a lesson) gets a Back button. */
import { router } from 'expo-router';
import type { ReactNode, Ref } from 'react';
import { Pressable, ScrollView, StyleSheet, View, type ScrollViewInstance } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, T } from '@/components/ui';
import { MAX_WIDTH, useTheme } from '@/lib/theme';

export function Screen({
  eyebrow,
  title,
  sub,
  children,
  scrollRef,
  back,
}: {
  eyebrow?: string;
  title: string;
  /** something under the title, like the phase chip on Today */
  sub?: ReactNode;
  children: ReactNode;
  scrollRef?: Ref<ScrollViewInstance>;
  /** a page on top of the tabs: show Back (or a label for it) */
  back?: boolean | string;
}) {
  const c = useTheme();
  const inset = useSafeAreaInsets();
  return (
    <ScrollView
      ref={scrollRef}
      style={{ flex: 1, backgroundColor: c.bg }}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[s.content, { paddingTop: inset.top + (back ? 8 : 16), paddingBottom: back ? inset.bottom + 32 : 32 }]}>
      <View style={s.col}>
        {back ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={typeof back === 'string' ? back : 'Back'}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
            style={[s.back, { backgroundColor: c.surface, borderColor: c.cardEdge }]}>
            <Icon name="back" size={20} color={c.ink} />
            {typeof back === 'string' ? (
              <T v="label" style={{ paddingRight: 6 }}>
                {back}
              </T>
            ) : null}
          </Pressable>
        ) : null}
        <View style={{ gap: 2, marginBottom: 4 }}>
          {eyebrow ? (
            <T v="eyebrow" tone="muted">
              {eyebrow}
            </T>
          ) : null}
          <T v="title" accessibilityRole="header">
            {title}
          </T>
          {sub}
        </View>
        {children}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  content: { paddingHorizontal: 16, alignItems: 'center' },
  col: { width: '100%', maxWidth: MAX_WIDTH, gap: 14 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', minHeight: 44, minWidth: 44, paddingHorizontal: 10, borderRadius: 22, borderWidth: 1.5 },
});
