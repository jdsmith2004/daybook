/* Every celebration in one place, a tap each (dev only: it exists in a build made with EXPO_PUBLIC_SHOTS=1, like the screenshot
   studio; in every other build this address goes to Today). The owner, November 14, 2026: "let me see all the animations on
   the web". The moments in the celebration sheet play right here, over this page; the others open their own page. */
import { gameCompute, type CelItem } from '@daybook/core';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Earned } from '@/components/earned';
import { LessonFinish } from '@/components/lesson-finish';
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
  const [lesson, setLesson] = useState(0);
  const [week, setWeek] = useState(0);
  const st = snap.settings;
  if (!ON || !st) return <Redirect href="/" />;
  const g = gameCompute(snap.days, st, snap.reviews, tk);
  const L = g.level;
  const badge = g.badges.find((x) => x.done) ?? g.badges[0];
  const play = (it: CelItem[]) => {
    setN((x) => x + 1);
    setCur(it);
  };
  /* the other moments open their own page in place, keeping this page's full motion (a fresh load would start the demo over,
     and its What is new page would come first); graduation needs the graduated demo person, so it loads fresh */
  const open = (path: string) => router.push(path as never);
  const fresh = (path: string) => {
    if (typeof window !== 'undefined') window.location.href = path + '&motion=1';
  };
  const rows: { name: string; what: string; go: () => void }[] = [
    { name: 'Lesson finished', what: 'The band, the flame gliding home, the points into the level line.', go: () => setLesson((x) => x + 1) },
    {
      name: 'Sunday review saved',
      what: 'Dawn: the flame rises from below into a warm sky, the goal’s nights come in one by one.',
      go: () => setWeek((x) => x + 1),
    },
    { name: 'Level up', what: 'Rays and a few stars. No confetti.', go: () => play([{ type: 'level', level: L, from: 0, evolve: false }]) },
    {
      name: 'New flame form',
      what: 'The biggest moment: a light burst of confetti round the flame.',
      go: () => play([{ type: 'level', level: L, from: Math.max(1, L.n - 1), evolve: true }]),
    },
    { name: 'New badge', what: 'Rays, the medal lands and settles. No confetti.', go: () => badge && play([{ type: 'badge', b: badge }]) },
    { name: 'Streak lighting', what: 'Swipe up on the ember to light it. A tap during it skips to the end.', go: () => open('/ignite') },
    /* the key moments (core igniteWhy), played for real: the demo log has the hard stretch, and Free of it on the morning lights it */
    { name: 'Lighting after a hard stretch', what: 'Three slips this week. Tap Free of it, then swipe up.', go: () => fresh('/morning?demo=comeback') },
    { name: 'Lighting, night two of the climb', what: 'The second free night after a hard stretch. Tap Free of it.', go: () => fresh('/morning?demo=climb2') },
    { name: 'Lighting, night three of the climb', what: 'The third free night after a hard stretch. Tap Free of it.', go: () => fresh('/morning?demo=climb3') },
    { name: 'Lighting after a long run', what: 'One slip after weeks free. Tap Free of it.', go: () => fresh('/morning?demo=longrun') },
    { name: 'Morning done', what: 'Tap Free of it.', go: () => open('/morning') },
    { name: 'Urge ridden out', what: 'SOS, It passed.', go: () => open('/sos?won=1') },
    { name: 'Check-in finished', what: 'Day logged, with the points.', go: () => open('/checkin?end=1') },
    { name: 'Graduation', what: 'One soft fall of confetti and three small fireworks.', go: () => fresh('/graduated?demo=grad') },
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
      {lesson ? (
        <View style={StyleSheet.absoluteFill}>
          <LessonFinish
            key={lesson}
            lessonId="l4"
            title="When values and habits clash"
            n={4}
            gain={10}
            again={false}
            stats={{ cards: 6, combo: 6, secs: 120 }}
            keep="You are not your urges. You are the one who decides."
            next={null}
            onNext={() => setLesson(0)}
            onDone={() => setLesson(0)}
          />
        </View>
      ) : null}
      {week ? (
        <View style={StyleSheet.absoluteFill}>
          <LessonFinish
            key={'w' + week}
            lessonId=""
            title="A lesson every day"
            n={1}
            gain={20}
            again={false}
            stats={{ cards: 0, combo: 0, secs: 0 }}
            keep="When I first open Daybook each day, I will read the day’s lesson."
            next={null}
            onNext={() => setWeek(0)}
            onDone={() => setWeek(0)}
            head="Your week is set"
            line={{ label: '1 Sunday', right: 'a month of them', from: 0, to: 0.25 }}
            button="Done"
            feedback={false}
            look="dawn"
            marks={7}
          />
        </View>
      ) : null}
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
