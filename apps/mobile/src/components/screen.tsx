/* A scrolling screen with the page color, a title, and room for the tab bar. */
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { T } from '@/components/ui';
import { isWeb, MAX_WIDTH, useTheme } from '@/lib/theme';

export function Screen({ eyebrow, title, children }: { eyebrow?: string; title: string; children: ReactNode }) {
  const c = useTheme();
  const inset = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.bg }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={[s.content, { paddingTop: inset.top + 16, paddingBottom: inset.bottom + (isWeb ? 110 : 40) }]}>
      <View style={s.col}>
        <View style={{ gap: 2, marginBottom: 4 }}>
          {eyebrow ? (
            <T v="eyebrow" tone="muted">
              {eyebrow}
            </T>
          ) : null}
          <T v="title" accessibilityRole="header">
            {title}
          </T>
        </View>
        {children}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  content: { paddingHorizontal: 16, alignItems: 'center' },
  col: { width: '100%', maxWidth: MAX_WIDTH, gap: 14 },
});
