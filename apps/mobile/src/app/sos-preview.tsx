/* The two newest SOS moves by themselves, for the owner to judge before they go into SOS for everyone (November 15, 2026: "build
   both, and I'd like to preview it"). SOS's own sky with one move on it, as a ride page shows it, and under it a quiet row to switch
   moves, start it again, step through the lessons, or try it inside a real (practice) ride.
   ?move=replay or ?move=selftalk; ?lesson=l33 shows that lesson's card; ?name=Sam speaks to Sam (name= with nothing says "you"). */
import { REPLAY, urNight } from '@daybook/core';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { REPLAY_DEMO, ReplayMove } from '@/components/ride/replay';
import { SelfTalkMove } from '@/components/ride/self-talk';
import { SceneFrame } from '@/components/scene';
import { Text } from '@/components/text';
import { close } from '@/lib/nav';
import { useStore } from '@/lib/store';
import { font, NightContext, useSkyTheme } from '@/lib/theme';

export default function SosPreview() {
  const q = useLocalSearchParams<{ move?: string; lesson?: string; name?: string; night?: string }>();
  const { now } = useStore();
  const night = q.night === '1' || (q.night !== '0' && urNight(new Date(now).getHours()));
  const sky = night ? 'night' : 'violet';
  const c = useSkyTheme(sky);
  const [move, setMove] = useState(q.move === 'selftalk' ? 'selftalk' : 'replay');
  const [li, setLi] = useState(() =>
    Math.max(
      0,
      REPLAY.findIndex((R) => R.id === q.lesson),
    ),
  );
  const [run, setRun] = useState(0);
  const name = q.name === undefined ? 'Sam' : q.name || null;
  const lesson = REPLAY[li].id;
  const go = (m: string) => {
    setMove(m);
    setRun((x) => x + 1);
    router.setParams({ move: m });
  };
  const quiet = (label: string, onPress: () => void, on?: boolean) => (
    <Pressable
      key={label}
      accessibilityRole="button"
      accessibilityState={on != null ? { selected: on } : undefined}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [s.q, on ? { backgroundColor: c.scBtn } : null, { opacity: pressed ? 0.6 : 1 }]}>
      <Text style={[s.qT, { color: on === false ? c.muted : c.ink }]}>{label}</Text>
    </Pressable>
  );
  return (
    <NightContext.Provider value={night}>
      <SceneFrame title="Preview" sky={sky} onClose={close} fixed>
        <View style={s.page}>
          {move === 'replay' ? (
            <ReplayMove key={'r' + run + lesson} on onDone={() => undefined} level={6} days={REPLAY_DEMO} lesson={lesson} demo />
          ) : (
            <SelfTalkMove key={'t' + run} on onDone={() => undefined} level={6} name={name} demo />
          )}
        </View>
        <View style={s.row}>
          {quiet('From your lessons', () => go('replay'), move === 'replay')}
          {quiet('Self Talk', () => go('selftalk'), move === 'selftalk')}
        </View>
        <View style={s.row}>
          {move === 'replay'
            ? quiet('Next lesson', () => {
                setLi((li + 1) % REPLAY.length);
                setRun((x) => x + 1);
              })
            : quiet('Again', () => setRun((x) => x + 1))}
          {quiet('In a real ride', () => router.push({ pathname: '/sos', params: { practice: '1', try: move } }))}
        </View>
      </SceneFrame>
    </NightContext.Provider>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, alignSelf: 'stretch' },
  row: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingTop: 6 },
  q: { minHeight: 40, paddingHorizontal: 14, borderRadius: 999, justifyContent: 'center' },
  qT: { fontFamily: font.bodySemi, fontSize: 15 },
});
