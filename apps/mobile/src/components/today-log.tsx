/* Today, after logging: the Rekindle card (the quest the day of a slip, the sunrise check the morning after), today's entries,
   the care card after a slip, and the link to log something. Words from @daybook/core. */
import {
  blankP,
  changeDay,
  clockOf,
  countText,
  eventRow,
  gameCompute,
  rkActive,
  rkCard,
  slipCare,
  sortedEvents,
  sumDay,
  withDay,
  type Snapshot,
} from '@daybook/core';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Flames, Missions } from '@/components/rekindle';
import { SunArt } from '@/components/sun-art';
import { Button, Card, Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { useStore } from '@/lib/store';
import { font, useTheme } from '@/lib/theme';

/* the actions a mission or a card can ask for */
export function useLogActions() {
  const { snap, tk, now, update, say } = useStore();
  const didSmall = (k: string) => {
    update((s) => {
      const day = changeDay(s.days[k], k, (d) => d.events.forEach((x) => x.outcome === 'slipped' && (x.recovered = true)));
      return { ...s, days: withDay(s.days, k, day) };
    });
    buzz('save');
    say('Good. That is the move.');
  };
  const phoneAway = () => {
    const st = snap.settings;
    if (!st) return;
    const at = clockOf(Date.now());
    const b0 = gameCompute(snap.days, st, snap.reviews, tk).pts;
    const next = update((s) => {
      const day = changeDay(s.days[tk], tk, (d) => {
        const p = d.p || blankP();
        p.po = at;
        d.p = p;
      });
      return { ...s, days: withDay(s.days, tk, day) };
    });
    const gain = Math.max(0, gameCompute(next.days, next.settings!, next.reviews, tk).pts - b0);
    buzz('save');
    router.push({ pathname: '/night', params: { at, gain: String(gain) } });
  };
  const act = (a: string, k: string) => {
    if (a === 'small') didSmall(k);
    else if (a === 'phone') phoneAway();
    else if (a === 'trace' || a === 'tell') router.push({ pathname: '/deeper', params: { k, kind: a } });
  };
  return { act, didSmall, phoneAway, now };
}

export function RekindleCard({ snap, tk }: { snap: Snapshot; tk: string }) {
  const c = useTheme();
  const { act, now } = useLogActions();
  const st = snap.settings!;
  const r = rkActive(snap.days, st, tk);
  if (!r) return null;
  const k = rkCard(snap.days, st, tk, r, new Date(now).getHours());
  const colors: [string, string] =
    k.kind === 'sun' ? ['#FFD9B4', '#FFF3DE'] : k.line ? [c.slipSoft, c.surface] : [c.sunSoft, c.surface];
  const sun = k.kind === 'sun';
  const ink = sun ? '#2A2350' : undefined;
  return (
    <View style={[s.card, { borderColor: k.line ? c.slip : sun ? '#F6D2A6' : c.cardEdge }]} accessibilityRole="summary">
      <LinearGradient colors={colors} locations={[0, 0.72]} style={StyleSheet.absoluteFill} />
      {sun ? <SunArt height={120} /> : null}
      <View style={s.top}>
        {sun ? null : (
          <View style={[s.ico, { backgroundColor: k.line ? c.slip : c.sun }]}>
            <Icon name={k.icon} size={22} color={k.line ? '#FFFFFF' : c.onSun} />
          </View>
        )}
        <View style={{ flex: 1, gap: 4 }}>
          <T v="h2" style={ink ? { color: ink } : undefined} accessibilityRole="header">
            {k.h}
          </T>
          <T v="small" tone="muted" style={sun ? { color: '#625A85' } : undefined}>
            {k.p}
          </T>
          <View style={{ alignItems: 'flex-start' }}>
            <Flames on={k.flames} />
          </View>
        </View>
      </View>
      {k.why ? <T>{k.why}</T> : null}
      {k.sunrise ? <Button label="Start my sunrise check" icon="sunrise" onPress={() => router.push('/sunrise')} /> : null}
      {k.missions.length ? <Missions list={k.missions} onAction={(_m, a) => act(a, r.k)} /> : null}
      {k.quote ? (
        <View style={[s.quote, { backgroundColor: c.surface, borderColor: c.line }]}>
          <T>
            <T v="label" tone="sunText">
              If
            </T>{' '}
            {k.quote.when},{' '}
            <T v="label" tone="sunText">
              then
            </T>{' '}
            {k.quote.then}
          </T>
        </View>
      ) : null}
      {k.care.length ? (
        <View style={{ gap: 4 }}>
          <T v="label" tone="sunText">
            My slip plan
          </T>
          {k.care.map((t, i) => (
            <T key={i} v="small">{`${i + 1}. ${t}`}</T>
          ))}
        </View>
      ) : null}
    </View>
  );
}

/* the link under the flame: for when it already happened */
export function LogLink() {
  const c = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push('/log')}
      style={({ pressed }) => [s.log, { backgroundColor: c.surface, borderColor: c.cardEdge, opacity: pressed ? 0.85 : 1 }]}>
      <Text style={[s.logT, { color: c.accentText }]}>Already happened? Log what happened</Text>
      <Icon name="next" size={18} color={c.accentText} />
    </Pressable>
  );
}

/* today's entries */
export function TodaySoFar({ snap, tk }: { snap: Snapshot; tk: string }) {
  const c = useTheme();
  const st = snap.settings!;
  const day = snap.days[tk];
  const sum = sumDay(day);
  if (!sum.n) return null;
  const ct = countText(sum);
  return (
    <Card>
      <View style={s.between}>
        <T v="h2">Today so far</T>
        <T v="small" tone="muted">
          {ct.n}
        </T>
      </View>
      <T v="small" tone="muted">
        {ct.detail}
      </T>
      <View style={{ gap: 2 }}>
        {sortedEvents(day, st.rollover).map((e) => {
          const r = eventRow(e, st);
          return (
            <View key={e.id} style={[s.row, { borderTopColor: c.line }]}>
              <T v="label" style={{ width: 76 }}>
                {r.time}
              </T>
              <View style={[s.mark, { backgroundColor: e.outcome === 'rode' ? c.mint : c.slip }, e.outcome !== 'rode' && { borderRadius: 3 }]} />
              <View style={{ flex: 1 }}>
                <T v="label">{r.what}</T>
                {r.meta ? (
                  <T v="small" tone="muted">
                    {r.meta}
                  </T>
                ) : null}
              </View>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

/* after a slip that has no quest (not the first in 7 days): the slip plan, and one small thing */
export function CareCard({ snap, tk }: { snap: Snapshot; tk: string }) {
  const { didSmall } = useLogActions();
  const st = snap.settings!;
  const day = snap.days[tk];
  if (!sumDay(day).slipped || rkActive(snap.days, st, tk)) return null;
  const open = (day?.events || []).some((e) => e.outcome === 'slipped' && !e.recovered);
  const care = slipCare(st);
  return (
    <Card tone="note">
      <T v="h2">After a slip</T>
      <T>Logged. That took honesty. Nothing resets: your points, badges, check-ins and longest streak all stay.</T>
      {care.map((t, i) => (
        <T key={i} v="small">{`${i + 1}. ${t}`}</T>
      ))}
      {open ? <Button label="I did one small thing" kind="ghost" onPress={() => didSmall(tk)} /> : <T v="label" tone="mintText">✓ One small thing done.</T>}
    </Card>
  );
}

const s = StyleSheet.create({
  card: { borderRadius: 24, borderWidth: 2, padding: 16, gap: 12, overflow: 'hidden' },
  top: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  ico: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  quote: { padding: 12, borderRadius: 14, borderWidth: 1.5 },
  log: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 52, paddingHorizontal: 16, borderRadius: 18, borderWidth: 2 },
  logT: { fontFamily: font.bodySemi, fontSize: 15 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderTopWidth: 1 },
  mark: { width: 12, height: 12, borderRadius: 6 },
});
