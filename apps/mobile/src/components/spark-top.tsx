/* Friends (beta): a spark a friend sent, waiting on Today's sky for the next lesson (the owner, November 15, 2026: the spark
   "visits and comes back"). It glows beside the other small buttons on the sky, with the friend's name; a tap opens today's
   lesson, which it goes into (or Friends, when today's lesson is done). Nothing shows when no spark waits. */
import { lessonToday } from '@daybook/core';
import { router } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { Spark } from '@/components/friends-art';
import { Text } from '@/components/text';
import { buzz } from '@/lib/feel';
import { useSparkWaiting } from '@/lib/friends';
import { useStore } from '@/lib/store';
import { font } from '@/lib/theme';

export function SparkTop({ on }: { on: { glass: string; ink: string } }) {
  const f = useSparkWaiting();
  const { snap, tk } = useStore();
  if (!f) return null;
  const done = (snap.days[tk]?.p?.ls || []).length > 0;
  const L = done ? null : lessonToday(snap.days, snap.settings, tk, true);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${f.name} sent you a spark. It goes into your next lesson.`}
      onPress={() => {
        buzz('tap');
        if (L) router.push({ pathname: '/lesson/[id]', params: { id: L.L.id } });
        else router.push('/friends');
      }}
      hitSlop={6}
      style={({ pressed }) => [s.top, { backgroundColor: on.glass, opacity: pressed ? 0.85 : 1 }]}>
      <Spark size={26} />
      <Text style={[s.topT, { color: on.ink }]} numberOfLines={1}>
        {f.name}&apos;s spark
      </Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 36, paddingLeft: 6, paddingRight: 12, borderRadius: 999, marginTop: 2, maxWidth: 170 },
  topT: { fontFamily: font.bodySemi, fontSize: 13, flexShrink: 1 },
});
