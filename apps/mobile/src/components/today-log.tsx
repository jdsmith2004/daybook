/* Today and Journal, after logging: today's entries (TodaySoFar, in
   Journal), SOS with Already happened and Planning a slip? (LogLink), the plan talked through that waits under them
   (WaitingPlan), the pause banner, and the actions a card can ask for. Words from @daybook/core. */
import { changeDay, clockOf, fmtClock, countText, sumDay, talkPlanNow, withDay, type Snapshot } from '@daybook/core';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';

import { EntryRows } from '@/components/entry-rows';
import { Card, Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { useNow } from '@/lib/now';
import { useSos } from '@/lib/sos';
import { count } from '@/lib/pulse';
import { useStore } from '@/lib/store';
import { font, useTheme } from '@/lib/theme';

/* the one small thing after a slip (the slip-day card on Today): it marks the day's slips as recovered */
export function useLogActions() {
  const { update, say } = useStore();
  const didSmall = (k: string) => {
    update((s) => {
      const day = changeDay(s.days[k], k, (d) => d.events.forEach((x) => x.outcome === 'slipped' && (x.recovered = true)));
      return { ...s, days: withDay(s.days, k, day) };
    });
    buzz('save');
    count('rk_small');
    say('Good. That is the move.');
  };
  return { didSmall };
}

/* the two quiet buttons under the next step: it already happened (log it), or a slip is being planned (Talk it through). SOS
   itself is the round button in the tab bar, in reach of the thumb on every page. */
export function LogLink() {
  const c = useTheme();
  return (
    <View style={s.pair}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Already happened? Log what happened."
        onPress={() => router.push('/log')}
        style={({ pressed }) => [s.log, { backgroundColor: c.surface, opacity: pressed ? 0.7 : 1 }]}>
        <Text style={[s.logT, { color: c.accentText }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
          Already happened
        </Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Planning a slip? Talk it through first."
        onPress={() => router.push('/talk')}
        style={({ pressed }) => [s.log, { backgroundColor: c.surface, opacity: pressed ? 0.7 : 1 }]}>
        <Text style={[s.logT, { color: c.accentText }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
          Planning a slip?
        </Text>
      </Pressable>
    </View>
  );
}

/* a plan talked through waits here, quietly, under SOS, until its moment has passed (core talkPlanNow): a changed plan, or
   a decide-later until its time (which opens the choice when tapped). Talk it through says "It waits on Today", and this
   is where. A plan for next time made after a slip shows here at its hour: from an hour before its moment until the
   moment ends ("Your plan for tonight"). */
export function WaitingPlan({ snap, tk, now }: { snap: Snapshot; tk: string; now: number }) {
  const c = useTheme();
  const w = talkPlanNow(snap.days, snap.settings, tk, now);
  if (!w) return null;
  const body = (
    <>
      <Icon name={w.due === 'waiting' ? 'timer' : 'compass'} size={18} color={c.violetText} />
      <View style={{ flex: 1, gap: 1 }}>
        <Text style={[s.planH, { color: c.violetText }]}>{w.head}</Text>
        <Text style={[s.planT, { color: c.ink }]}>{w.line}</Text>
      </View>
      {w.due === 'waiting' ? <Icon name="next" size={18} color={c.violetText} /> : null}
    </>
  );
  if (w.due !== 'waiting')
    return (
      <View style={[s.plan, { backgroundColor: c.surface }]} accessibilityLabel={w.head + '. ' + w.line}>
        {body}
      </View>
    );
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={w.head + ' ' + w.line + ' Decide now.'}
      onPress={() => {
        buzz('tap');
        router.push(('/talk?decide=' + w.id) as '/talk');
      }}
      style={({ pressed }) => [s.plan, { backgroundColor: c.surface, opacity: pressed ? 0.8 : 1 }]}>
      {body}
    </Pressable>
  );
}

/* a pause in progress (or one that just ended) keeps a banner on Today, so it is one tap back (legacy timerBanner) */
export function PauseBanner() {
  const c = useTheme();
  const sos = useSos();
  const now = useNow(1000);
  const t = sos.timer;
  if (!t) return null;
  const left = t.start + t.dur - now;
  const done = left <= 0;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/tool/[id]', params: { id: 'pause' } })}
      style={[s.banner, { backgroundColor: done ? c.mintSoft : c.violetSoft }]}>
      <T v="label" style={{ flex: 1, color: done ? c.mintText : c.violetText }}>
        {done
          ? (t.early ? 'Your pause ended' : 'Your 10-minute pause finished') + ' at ' + fmtClock(clockOf(t.start + t.dur)) + '.'
          : 'Pause in progress · about ' + Math.max(1, Math.ceil(left / 60000)) + ' min left'}
      </T>
      <View style={[s.bannerBtn, { backgroundColor: c.surface }]}>
        <Text style={{ fontFamily: font.bodySemi, color: done ? c.mintText : c.violetText, fontSize: 15 }}>
          {done ? 'See how it went' : 'Resume'}
        </Text>
      </View>
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
      <EntryRows date={tk} />
    </Card>
  );
}

const s = StyleSheet.create({
  card: { borderRadius: 24, borderWidth: 2, padding: 16, gap: 12, overflow: 'hidden' },
  top: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  ico: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 11, paddingVertical: 6, borderRadius: 999 },
  chipT: { fontFamily: font.bodyBold, fontSize: 13 },
  pair: { flexDirection: 'row', gap: 8 },
  log: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 48, paddingHorizontal: 8, borderRadius: 999 },
  logT: { fontFamily: font.bodySemi, fontSize: 15, flexShrink: 1, textAlign: 'center' },
  plan: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 20 },
  planH: { fontFamily: font.bodySemi, fontSize: 13, lineHeight: 18 },
  planT: { fontFamily: font.body, fontSize: 15, lineHeight: 20 },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingLeft: 14, paddingRight: 10, borderRadius: 16 },
  bannerBtn: { minHeight: 40, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderTopWidth: 1 },
  mark: { width: 12, height: 12, borderRadius: 6 },
});
