/* A row that goes somewhere: an icon, a title, a line under it, and a chevron (the legacy link-card). */
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, T } from '@/components/ui';
import { useTheme } from '@/lib/theme';

export function LinkCard({ icon, title, sub, onPress, tone }: { icon: string; title: string; sub?: string; onPress: () => void; tone?: 'accent' | 'coral' | 'mint' | 'sun' | 'sky' | 'violet' }) {
  const c = useTheme();
  const soft = { accent: c.accentSoft, coral: c.coralSoft, mint: c.mintSoft, sun: c.sunSoft, sky: c.skySoft, violet: c.violetSoft }[tone || 'accent'];
  const ink = { accent: c.accentText, coral: c.coralText, mint: c.mintText, sun: c.sunText, sky: c.skyText, violet: c.violetText }[tone || 'accent'];
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [s.card, { backgroundColor: c.surface, borderColor: c.cardEdge, opacity: pressed ? 0.85 : 1 }]}>
      <View style={[s.ic, { backgroundColor: soft }]}>
        <Icon name={icon} size={20} color={ink} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <T v="label">{title}</T>
        {sub ? (
          <T v="small" tone="muted">
            {sub}
          </T>
        ) : null}
      </View>
      <Icon name="next" size={18} color={c.muted} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, minHeight: 64, borderRadius: 18, borderWidth: 1.5 },
  ic: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
