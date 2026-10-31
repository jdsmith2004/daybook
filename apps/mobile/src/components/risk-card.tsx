/* Hard hours on Today (core: risk.ts): one quiet line under the next step, from two hours before the hours the log says are hardest
   until they end. In them, the next step is still the lesson or SOS (the owner, October 30, 2026), so this only says so, and offers the
   short plan (Talk it through, /talk?prep=1) until one is made. It assumes nothing: the person may well be doing fine. */
import { riskDay, riskStartLabel, talkClock, type Snapshot } from '@daybook/core';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { buzz } from '@/lib/feel';
import { font, useTheme } from '@/lib/theme';

export function HardLine({ snap, tk, now }: { snap: Snapshot; tk: string; now: number }) {
  const c = useTheme();
  const st = snap.settings;
  const r = st ? riskDay(snap.days, st, tk, now) : null;
  if (!r || (r.phase !== 'soon' && r.phase !== 'during')) return null;
  const say =
    r.phase === 'soon' ? 'Your hard hours start at ' + riskStartLabel(r.win.start) + '.' : 'You are in your hard hours, until ' + talkClock(r.b) + '.';
  return (
    <View style={s.row}>
      <Text style={[s.t, { color: c.muted }]}>{say}</Text>
      {r.talked ? (
        <Text style={[s.t, { color: c.muted }]}>You have your plan.</Text>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Make a short plan for your hard hours"
          hitSlop={14}
          onPress={() => {
            buzz('tap');
            router.push({ pathname: '/talk', params: { prep: '1' } });
          }}
          style={({ pressed }) => pressed && { opacity: 0.6 }}>
          <Text style={[s.go, { color: c.accentText }]}>Make a plan</Text>
        </Pressable>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 6, paddingHorizontal: 4 },
  t: { fontFamily: font.bodyMedium, fontSize: 13, lineHeight: 18 },
  go: { fontFamily: font.bodySemi, fontSize: 13, lineHeight: 18 },
});
