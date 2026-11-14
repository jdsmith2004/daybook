/* Under Your day on Today: the person's own words and record, which lived only in Journal and My plan before. First who you are
   becoming (the sentence from the end of setup, big in the flame's gold, with the newest proof from the log under it: core rodeProof,
   or the first line of who you are in numbers; moved up to sit right under the flame and the next step, "Becoming free", the owner,
   November 11, 2026), then Today so far (each entry logged today, with a shape like a badge: mint for an urge ridden out), and
   Tonight (the hard hours and the two lines of the urge plan that fit them, components/tonight-card.tsx). Nothing here is an ask,
   so it shows on every day. */
import { eventRow, identityLines, planBlank, planTonight, rodeProof, sortedEvents, timeBack, type DayKey, type Snapshot } from '@daybook/core';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Shape } from '@/components/shapes';
import { Text } from '@/components/text';
import { TimeBackRow } from '@/components/time-back';
import { TonightCard } from '@/components/tonight-card';
import { Button, Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { usePullDowns } from '@/lib/pull';
import { font, useTheme } from '@/lib/theme';

export function TodayBelow({ snap, tk, now }: { snap: Snapshot; tk: DayKey; now: number }) {
  const c = useTheme();
  const downs = usePullDowns();
  const st = snap.settings!;
  const evs = sortedEvents(snap.days[tk], st.rollover);
  const lines = planTonight(snap.days, st, tk);
  const all = (st.plan || []).filter((p) => !planBlank(p) && String(p.then || '').trim()).length;
  const be = String(st.becoming || '').trim();
  /* the time given back, under the sentence: what becoming free has already bought (core time-back.ts) */
  const back = timeBack(snap.days, st, tk);
  const proof = rodeProof(snap.days, st, tk) || newest(snap, tk, downs);
  const openBe = () => {
    buzz('tap');
    router.push('/becoming');
  };
  return (
    <View style={s.all}>
      {/* who you are becoming: plainly a thing to tap (the owner, November 13, 2026: "is it a button? it's hard to tell what it
          wants"). Unwritten, it asks the question and has one button; written, the sentence with Change beside its name. Both open
          app/becoming.tsx, the page the setup had. */}
      {be ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={'Who you are becoming: ' + be.replace(/[.!]+$/, '') + '. Change it.'}
          onPress={openBe}
          style={({ pressed }) => [s.be, { opacity: pressed ? 0.85 : 1 }]}>
          <View style={s.beTop}>
            <T v="small" tone="muted">
              Who you are becoming
            </T>
            <View style={s.change}>
              <Icon name="pencil" size={16} color={c.accentText} />
              <Text style={[s.changeT, { color: c.accentText }]}>Change</Text>
            </View>
          </View>
          <Text style={[s.beT, { color: c.sunText }]}>{be}</Text>
          {proof ? (
            <Text style={[s.proof, { color: c.muted }]}>
              {proof.t} <Text style={{ color: c.mintText, fontFamily: font.bodySemi }}>{proof.n.replace(/ /g, '\u00a0')}</Text>
            </Text>
          ) : null}
        </Pressable>
      ) : (
        <View style={s.be}>
          <T v="h2">Who are you becoming?</T>
          <T tone="muted">One sentence about who you are growing into. The flame holds on to it for the hard days.</T>
          <View style={s.beBtn}>
            <Button label="Write my sentence" icon="pencil" onPress={openBe} />
          </View>
        </View>
      )}

      {back ? <TimeBackRow t={back} tk={tk} /> : null}

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
    </View>
  );
}

/** with no urge ridden out in two weeks, the first thing the record says about who the person is. Never the slips line: no slip
    count sits on Today */
function newest(snap: Snapshot, tk: DayKey, downs: number): { t: string; n: string } | null {
  const l = identityLines(snap.days, snap.settings!, snap.reviews, tk, downs).filter((x) => x.ic !== 'leaf')[0];
  return l ? { t: l.who, n: l.n + '.' } : null;
}

const s = StyleSheet.create({
  all: { gap: 32 },
  sec: { gap: 12 },
  moment: { flexDirection: 'row', alignItems: 'center', gap: 16, minHeight: 56 },
  be: { gap: 8, paddingBottom: 16 },
  beT: { fontFamily: font.display, fontSize: 34, lineHeight: 41 },
  beTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  change: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 32 },
  changeT: { fontFamily: font.bodySemi, fontSize: 15 },
  beBtn: { marginTop: 4 },
  proof: { fontFamily: font.body, fontSize: 15, lineHeight: 21, marginTop: 4 },
});
