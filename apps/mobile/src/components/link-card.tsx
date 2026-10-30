/* A row that goes somewhere: an icon, a title, a line under it, and a chevron (the legacy link-card). On its own it is a small
   card; inside Rows it is one line of a plain grouped list, with a thin line between rows. The icon stands at its own size, in
   the tone's color, with no tile behind it. */
import { createContext, useContext, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, T } from '@/components/ui';
import { useTheme } from '@/lib/theme';

const InRows = createContext(false);

/** a plain grouped list. Each row draws the line under it; the group's edge hides the last one, so a row that turns out to
    show nothing never leaves a line behind. */
export function Rows({ children }: { children: ReactNode }) {
  const c = useTheme();
  return (
    <View style={[s.rows, { backgroundColor: c.surface }]}>
      <View style={{ marginBottom: -1 }}>
        <InRows.Provider value>{children}</InRows.Provider>
      </View>
    </View>
  );
}

export function LinkCard({
  icon,
  title,
  sub,
  onPress,
  tone,
}: {
  icon: string;
  title: string;
  sub?: string;
  onPress: () => void;
  tone?: 'accent' | 'coral' | 'mint' | 'sun' | 'sky' | 'violet';
}) {
  const c = useTheme();
  const inRows = useContext(InRows);
  const ink = { accent: c.accentText, coral: c.coralText, mint: c.mintText, sun: c.sunText, sky: c.skyText, violet: c.violetText }[tone || 'accent'];
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [inRows ? s.row : [s.card, { backgroundColor: c.surface }], { opacity: pressed ? 0.7 : 1 }]}>
      <Icon name={icon} size={22} color={ink} />
      <View style={[s.words, inRows && { borderBottomColor: c.line, borderBottomWidth: 1 }]}>
        <View style={{ flex: 1, gap: 1 }}>
          <T v="label">{title}</T>
          {sub ? (
            <T v="small" tone="muted">
              {sub}
            </T>
          ) : null}
        </View>
        <Icon name="next" size={16} color={c.muted} />
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  rows: { borderRadius: 20, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingLeft: 16 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingLeft: 16, borderRadius: 20 },
  words: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 60, paddingVertical: 10, paddingRight: 14 },
});
