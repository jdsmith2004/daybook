/* The calm page for the two worst moments: the log could not be opened at launch, or a screen broke (the premium pass,
   October 26, 2026). It says what happened, that the log is safe, and gives one thing to do (Try again, low where the
   thumb is) and a person to write to. It needs nothing from the log, so it shows even when the log is what failed. */
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Flame } from '@/components/flame';
import { HelpLine } from '@/components/help-line';
import { Button, T } from '@/components/ui';
import { useTheme } from '@/lib/theme';

export function Oops({ title, lines, onRetry, subject }: { title: string; lines: string[]; onRetry: () => void; subject: string }) {
  const c = useTheme();
  const inset = useSafeAreaInsets();
  return (
    <View style={[s.page, { backgroundColor: c.bg, paddingTop: inset.top + 24, paddingBottom: inset.bottom + 16 }]}>
      <ScrollView contentContainerStyle={s.top}>
        <View style={s.mark}>
          <Flame level={11} size={160} />
        </View>
        <T v="title" accessibilityRole="header">
          {title}
        </T>
        {lines.map((l) => (
          <T key={l}>{l}</T>
        ))}
      </ScrollView>
      <View style={s.dock}>
        <Button label="Try again" onPress={onRetry} />
        <HelpLine subject={subject} center />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, paddingHorizontal: 16 },
  top: { gap: 12 },
  mark: { alignItems: 'center', marginBottom: 8 },
  dock: { gap: 12, paddingTop: 12 },
});
