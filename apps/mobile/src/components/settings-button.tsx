/* Settings, at the top right of every tab (the owner, November 13, 2026: "move settings as like an icon on the top right"). It
   opens the page that was the More tab (app/settings/index.tsx): Milestones, My plan, the tip jar, help and every setting. Out of
   the thumb's way on purpose: it is opened now and then, and the tabs are for every day. On a picture (Today's sky, the
   journal's night) it takes that picture's glass and ink. */
import { router } from 'expo-router';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { Icon } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { useTheme } from '@/lib/theme';

/** on: the picture's glass and ink; style: the round of the buttons beside it, when the page has its own (the journal) */
export function SettingsButton({ on, style }: { on?: { glass: string; ink: string }; style?: StyleProp<ViewStyle> }) {
  const c = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Settings"
      onPress={() => {
        buzz('tap');
        router.push('/settings');
      }}
      hitSlop={8}
      style={({ pressed }) => [s.round, { backgroundColor: on ? on.glass : c.surface }, style, { opacity: pressed ? 0.8 : 1 }]}>
      <Icon name="gear" size={20} color={on ? on.ink : c.ink} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  round: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
