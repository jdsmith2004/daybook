/* Every lesson told as a story, a tap each, in Short or Long (dev only: it exists in a build made with EXPO_PUBLIC_SHOTS=1, the demo
   build, whose log is a made-up person kept in memory; in every other build this address goes to Today). The owner, November 14,
   2026: "i couldn't get the other lessons to load for me ... make some lessons and i'll preview before we do them all". A lesson
   opened from here plays with nothing in the way: no path, no account, no morning first (lesson/[id].tsx, at=preview). */
import { lessonById } from '@daybook/core';
import { STORIES } from '@daybook/core/lesson-content';
import { Redirect, router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/text';
import { useStore } from '@/lib/store';
import { font, useTheme } from '@/lib/theme';

const ON = process.env.EXPO_PUBLIC_SHOTS === '1';

export default function LessonPreview() {
  const { snap } = useStore();
  const c = useTheme();
  const inset = useSafeAreaInsets();
  if (!ON || !snap.settings) return <Redirect href="/" />;
  const open = (id: string, len: 'q' | 'f') => router.push(('/lesson/' + id + '?at=preview&len=' + len + '&motion=1') as never);
  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={[s.page, { paddingTop: inset.top + 24 }]}>
      <Text style={[s.h, { color: c.ink }]} accessibilityRole="header">
        The new lessons
      </Text>
      <Text style={[s.p, { color: c.muted }]}>Short is the everyday lesson. Long goes deeper. Come back here with your browser’s back button.</Text>
      {Object.values(STORIES)
        .sort((a, b) => Number(a.id.slice(1)) - Number(b.id.slice(1)))
        .map((S) => {
          const L = lessonById(S.id);
          return (
            <View key={S.id} style={[s.row, { backgroundColor: c.surface }]}>
              <Text style={[s.name, { color: c.ink }]}>{L ? L.title : S.title}</Text>
              <View style={s.btns}>
                {(['q', 'f'] as const).map((len) => (
                  <Pressable
                    key={len}
                    onPress={() => open(S.id, len)}
                    accessibilityRole="button"
                    style={({ pressed }) => [s.btn, { backgroundColor: len === 'f' ? c.sun : c.bg, opacity: pressed ? 0.7 : 1 }]}>
                    <Text style={[s.btnT, { color: len === 'f' ? '#2A1A0A' : c.ink }]}>{len === 'q' ? 'Short' : 'Long'}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          );
        })}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { padding: 20, gap: 12 },
  h: { fontFamily: font.display, fontSize: 28 },
  p: { fontFamily: font.body, fontSize: 15, marginBottom: 8 },
  row: { borderRadius: 16, padding: 18, gap: 12 },
  name: { fontFamily: font.display, fontSize: 20 },
  btns: { flexDirection: 'row', gap: 10 },
  btn: { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  btnT: { fontFamily: font.bodyBold, fontSize: 15 },
});
