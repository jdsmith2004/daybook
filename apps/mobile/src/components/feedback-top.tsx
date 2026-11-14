/* The small Ideas button at the top left of Today (the owner, November 2, 2026): any idea or change, straight to the person
   who builds Daybook (app/feedback.tsx). It mirrors Support at the top right, in the same glass on the sky, and it is shown
   always, after a slip too, because it asks nothing of the person. Hidden in a build with no place to send to. */
import { router } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { Text } from '@/components/text';
import { Icon } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { pulseOffered } from '@/lib/pulse';
import { font, useTheme } from '@/lib/theme';

export function FeedbackTop({ on }: { on?: { glass: string; ink: string } }) {
  const c = useTheme();
  if (!pulseOffered) return null;
  const bg = on ? on.glass : c.surface;
  const ink = on ? on.ink : c.ink;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Ideas. Send an idea or a change to the person who builds Daybook."
      onPress={() => {
        buzz('tap');
        router.push('/feedback');
      }}
      hitSlop={6}
      style={({ pressed }) => [s.top, { backgroundColor: bg, opacity: pressed ? 0.85 : 1 }]}>
      <Icon name="chat" size={15} color={ink} />
      <Text style={[s.topT, { color: ink }]}>Ideas</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 36, paddingHorizontal: 12, borderRadius: 999, marginTop: 2 },
  topT: { fontFamily: font.bodySemi, fontSize: 13 },
});
