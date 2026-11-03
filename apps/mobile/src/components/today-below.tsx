/* Under Your day on Today: the person's own words and record, which lived only in Journal and My plan before. Today so far (each
   entry logged today, with a shape like a badge: mint for an urge ridden out), Tonight (the hard hours and the two lines of the urge
   plan that fit them, components/tonight-card.tsx), and who you are becoming (the sentence from the end of setup, big in the flame's
   gold, with one true line from the log under it: core rodeProof). Nothing here is an ask, so it shows on every day. */
import { eventRow, planBlank, planTonight, rodeProof, sortedEvents, type DayKey, type Snapshot } from '@daybook/core';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Shape } from '@/components/shapes';
import { Text } from '@/components/text';
import { TonightCard } from '@/components/tonight-card';
import { Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { font, useTheme } from '@/lib/theme';

export function TodayBelow({ snap, tk, now }: { snap: Snapshot; tk: DayKey; now: number }) {
  const c = useTheme();
  const st = snap.settings!;
  const evs = sortedEvents(snap.days[tk], st.rollover);
  const lines = planTonight(snap.days, st, tk);
  const all = (st.plan || []).filter((p) => !planBlank(p) && String(p.then || '').trim()).length;
  const be = String(st.becoming || '').trim();
  const proof = rodeProof(snap.days, st, tk);
  return (
    <View style={s.all}>
      {evs.length ? (
        <View style={s.sec}>
          <T v="h2">Today so far</T>
          {evs.map((e) => {
            const r = eventRow(e, st);
            const rode = e.outcome === 'rode';
            const meta = [r.time, e.m ? e.m + (e.m === 1 ? ' minute' : ' minutes') : '', r.meta].filter(Boolean).join(' · ');
            const what = rode ? 'Rode out an urge' : r.what;
            return (
              <Pressable
                key={e.id}
                accessibilityRole="button"
                accessibilityLabel={what + '. ' + meta + '. Opens it.'}
                onPress={() => {
                  buzz('tap');
                  router.push({ pathname: '/entry', params: { date: tk, id: e.id } });
                }}
                style={({ pressed }) => [s.moment, { opacity: pressed ? 0.8 : 1 }]}>
                <Shape kind={rode ? 'cookie12' : 'clover4'} size={52} color={rode ? c.mint : c.slip}>
                  <Icon name={rode ? 'wave' : 'leaf'} size={24} color={c.bg} />
                </Shape>
                <View style={{ flex: 1, gap: 2 }}>
                  <T v="label">{what}</T>
                  <T v="small" tone="muted">
                    {meta}
                  </T>
                </View>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <TonightCard snap={snap} tk={tk} now={now} lines={lines} more={all > lines.length} />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={be ? 'Who you are becoming: ' + be + '. Opens My plan.' : 'Who are you becoming? Write it in one sentence.'}
        onPress={() => {
          buzz('tap');
          router.push('/plan');
        }}
        style={({ pressed }) => [s.be, { opacity: pressed ? 0.85 : 1 }]}>
        <T v="small" tone="muted">
          Who you are becoming
        </T>
        <Text style={[be ? s.beT : s.beAsk, { color: be ? c.sunText : c.accentText }]}>{be || 'Write it in one sentence'}</Text>
        {proof ? (
          <Text style={[s.proof, { color: c.muted }]}>
            {proof.t} <Text style={{ color: c.mintText, fontFamily: font.bodySemi }}>{proof.n.replace(/ /g, ' ')}</Text>
          </Text>
        ) : null}
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  all: { gap: 32 },
  sec: { gap: 12 },
  moment: { flexDirection: 'row', alignItems: 'center', gap: 16, minHeight: 56 },
  be: { gap: 8, paddingBottom: 16 },
  beT: { fontFamily: font.display, fontSize: 34, lineHeight: 41 },
  beAsk: { fontFamily: font.display, fontSize: 28, lineHeight: 34 },
  proof: { fontFamily: font.body, fontSize: 15, lineHeight: 21, marginTop: 4 },
});
