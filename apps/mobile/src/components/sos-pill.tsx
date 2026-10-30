/* The SOS pill for the top bar of a full-screen moment (the setup has the same one): help with an urge is one tap away
   from a page that is not SOS. Opened over an SOS that is still open (Talk it through from SOS's More), it goes back to
   that SOS, where the ride is; otherwise SOS opens over the page, which waits underneath. `over` always opens it over the
   page, for a page that must not be left (Rekindle, where a plan is still being made). */
import { router } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { Text } from '@/components/text';
import { Icon } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { useSos } from '@/lib/sos';
import { font, useTheme } from '@/lib/theme';

export function SosPill({ label = 'SOS. Help with an urge right now.', over = false }: { label?: string; over?: boolean }) {
  const c = useTheme();
  const sos = useSos();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => {
        buzz('tap');
        if (!over && sos.ur && router.canGoBack()) router.back();
        else router.push('/sos');
      }}
      hitSlop={4}
      style={({ pressed }) => [s.pill, { backgroundColor: c.sos, opacity: pressed ? 0.85 : 1 }]}>
      <Icon name="life" size={17} color={c.sosInk} />
      <Text style={[s.t, { color: c.sosInk }]}>SOS</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  pill: { height: 40, paddingHorizontal: 14, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 6 },
  t: { fontFamily: font.bodyBold, fontSize: 15 },
});
