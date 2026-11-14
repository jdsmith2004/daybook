/* Every celebration in one place, a tap each (dev only: it exists in a build made with EXPO_PUBLIC_SHOTS=1, like the screenshot
   studio; in every other build this address goes to Today). The owner, November 14, 2026: "let me see all the animations on
   the web". The moments in the celebration sheet play right here, over this page; the others open their own page. */
import { gameCompute, type CelItem } from '@daybook/core';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Earned } from '@/components/earned';
import { Text } from '@/components/text';
import { useStore } from '@/lib/store';
import { font, useTheme } from '@/lib/theme';

const ON = process.env.EXPO_PUBLIC_SHOTS === '1';

export default function Celebrations() {
  const { snap, tk } = useStore();
  const c = useTheme();
  const inset = useSafeAreaInsets();
  const [cur, setCur] = useState<CelItem[] | null>(null);
  const [n, setN] = useState(0);
  const st = snap.settings;
  if (!ON || !st) return <Redirect href="/" />;
  const g = gameCompute(snap.days, st, snap.reviews, tk);
  const L = g.level;
  const badge = g.badges.find((x) => x.done) ?? g.badges[0];
  const play = (it: CelItem[]) => {
    setN((x) => x + 1);
    setCur(it);
  };
  /* a page opened with a fresh load, so its own moment plays with full motion */
  const open = (path: string) => {
    if (typeof window !== 'undefined') window.location.href = path + (path.includes('?') ? '&' : '?') + 'motion=1';
    else router.push(path as never);
  };
  const rows: { name: string; what: string; go: () => void }[] = [
    { name: 'Level up', what: 'Rays and a few stars. No confetti.', go: () => play([{ type: 'level', level: L, from: 0, evolve: false }]) },
    {
      name: 'New flame form',
      what: 'The biggest moment: a light burst of confetti round the flame.',
      go: () => play([{ type: 'level', level: L, from: Math.max(1, L.n - 1), evolve: true }]),
    },
    { name: 'New badge', what: 'Rays, the medal lands and settles. No confetti.', go: () => badge && play([{ type: 'badge', b: badge }]) },
    { name: 'Streak lighting', what: 'Swipe up on the ember to light it.', go: () => open('/ignite') },
    { name: 'Morning done', what: 'Tap Free of it.', go: () => open('/morning') },
    { name: 'Urge ridden out', what: 'SOS, It passed.', go: () => open('/sos?won=1') },
    { name: 'Check-in finished', what: 'Answer or skip each question, then Save this day.', go: () => open('/checkin') },
    { name: 'Graduation', what: 'One soft fall of confetti and three small fireworks.', go: () => open('/graduated?demo=grad') },
  ];
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={[s.page, { paddingTop: inset.top + 24 }]}>
        <Text style={[s.h, { color: c.ink }]} accessibilityRole="header">
          Every celebration
        </Text>
        <Text style={[s.p, { color: c.muted }]}>Tap one to play it. Come back here with your browser's back button.</Text>
        {rows.map((r) => (
          <Pressable
            key={r.name}
            onPress={r.go}
            accessibilityRole="button"
            style={({ pressed }) => [s.row, { backgroundColor: c.surface, opacity: pressed ? 0.7 : 1 }]}>
            <Text style={[s.name, { color: c.ink }]}>{r.name}</Text>
            <Text style={[s.what, { color: c.muted }]}>{r.what}</Text>
          </Pressable>
        ))}
      </ScrollView>
      {cur ? <Earned key={n} group={cur} more={false} onClose={() => setCur(null)} /> : null}
    </View>
  );
}

const s = StyleSheet.create({
  page: { padding: 20, gap: 12 },
  h: { fontFamily: font.display, fontSize: 28 },
  p: { fontFamily: font.body, fontSize: 15, marginBottom: 8 },
  row: { borderRadius: 16, padding: 18, gap: 4 },
  name: { fontFamily: font.display, fontSize: 20 },
  what: { fontFamily: font.body, fontSize: 15 },
});
