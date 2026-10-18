/* A scrolling screen with the page color, a title, and room for the tab bar. A page opened on top of the tabs (from More, or
   from a lesson) gets a Back button that names the page underneath it. On the web the page eases in. A screen can follow its
   own scrolling (onScroll), and float something over its top that stays put while the page scrolls (overlay). */
import { router } from 'expo-router';
import { useRef, type ReactNode, type Ref } from 'react';
import { Pressable, ScrollView, StyleSheet, View, type ScrollViewInstance } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Appear } from '@/components/appear';
import { Icon, T } from '@/components/ui';
import { useBackLabel } from '@/lib/nav';
import { MAX_WIDTH, useTheme } from '@/lib/theme';

export function Screen({
  eyebrow,
  title,
  sub,
  children,
  scrollRef,
  back,
  onScroll,
  overlay,
}: {
  eyebrow?: string;
  title: string;
  /** something under the title, like the phase chip on Today */
  sub?: ReactNode;
  children: ReactNode;
  scrollRef?: Ref<ScrollViewInstance>;
  /** a page on top of the tabs: show Back (or a label for it) */
  back?: boolean | string;
  /** how far the page has scrolled, and how tall the screen is (also once at the start) */
  onScroll?: (y: number, height: number) => void;
  /** something that floats over the top of the page and stays put */
  overlay?: ReactNode;
}) {
  const c = useTheme();
  const inset = useSafeAreaInsets();
  const label = useBackLabel(typeof back === 'string' ? back : 'Back');
  const y = useRef(0);
  const page = (
    <ScrollView
      ref={scrollRef}
      style={{ flex: 1, backgroundColor: c.bg }}
      onLayout={onScroll ? (e) => onScroll(y.current, e.nativeEvent.layout.height) : undefined}
      onScroll={
        onScroll
          ? (e) => {
              y.current = e.nativeEvent.contentOffset.y;
              onScroll(y.current, e.nativeEvent.layoutMeasurement.height);
            }
          : undefined
      }
      scrollEventThrottle={onScroll ? 32 : undefined}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[s.content, { paddingTop: inset.top + (back ? 8 : 16), paddingBottom: back ? inset.bottom + 32 : 32 }]}>
      <Appear webOnly style={s.col}>
        {back ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={label}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
            style={[s.back, { backgroundColor: c.surface, borderColor: c.cardEdge }]}>
            <Icon name="back" size={20} color={c.ink} />
            {typeof back === 'string' ? (
              <T v="label" style={{ paddingRight: 6 }}>
                {label}
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
      </Appear>
    </ScrollView>
  );
  if (!overlay) return page;
  return (
    <View style={{ flex: 1 }}>
      {page}
      <View pointerEvents="box-none" style={[s.over, { top: inset.top + 8 }]}>
        <View pointerEvents="box-none" style={s.col}>
          {overlay}
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  content: { paddingHorizontal: 16, alignItems: 'center' },
  col: { width: '100%', maxWidth: MAX_WIDTH, gap: 14 },
  over: { position: 'absolute', left: 16, right: 16, alignItems: 'center' },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: 10,
    borderRadius: 22,
    borderWidth: 1.5,
  },
});
