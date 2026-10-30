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

/* the link under the flame: for when it already happened */
/* the one button that matters most: SOS, when an urge is happening right now (legacy hx-urge). Under it,
   two quieter ones for the other times: it already happened (log it), or a slip is being planned (Talk it through). */
export function LogLink({ compact }: { compact?: boolean }) {
  const c = useTheme();
  return (
    <View style={{ gap: compact ? 8 : 10 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="SOS. I am having an urge. Tap for help right now."
        onPress={() => router.push('/sos')}
        style={({ pressed }) => [
          s.sos,
          compact && s.sosCompact,
          { backgroundColor: c.sos, shadowColor: c.sosDeep, shadowOffset: { width: 0, height: pressed ? 1 : 5 }, transform: [{ translateY: pressed ? 4 : 0 }] },
        ]}>
        <View style={[s.sosIc, { backgroundColor: c.sosSoft }]}>
          <Icon name="life" size={28} color={c.sosInk} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[s.sosB, { color: c.sosInk }]}>SOS</Text>
          <Text style={[s.sosS, { color: c.sosInk }]}>I am having an urge</Text>
        </View>
        <Icon name="next" size={22} color={c.sosInk} />
      </Pressable>
      {/* the other two times: it already happened, or it is being planned (Talk it through) */}
      <View style={s.pair}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Already happened? Log what happened."
          onPress={() => router.push('/log')}
          style={({ pressed }) => [s.log, compact && s.logCompact, { backgroundColor: c.surface, borderColor: c.cardEdge, opacity: pressed ? 0.85 : 1 }]}>
          <Text style={[s.logT, { color: c.accentText }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
            Already happened
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Planning a slip? Talk it through first."
          onPress={() => router.push('/talk')}
          style={({ pressed }) => [s.log, compact && s.logCompact, { backgroundColor: c.violetSoft, borderColor: c.violetSoft, opacity: pressed ? 0.85 : 1 }]}>
          <Text style={[s.logT, { color: c.violetText }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
            Planning a slip?
          </Text>
        </Pressable>
      </View>
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
      <View style={[s.plan, { borderColor: c.line }]} accessibilityLabel={w.head + '. ' + w.line}>
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
      style={({ pressed }) => [s.plan, { borderColor: c.line, opacity: pressed ? 0.8 : 1 }]}>
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
        <Text style={{ fontFamily: font.bodySemi, color: done ? c.mintText : c.violetText, fontSize: 15 }}>{done ? 'See how it went' : 'Resume'}</Text>
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
  log: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 52,
    paddingHorizontal: 8,
    borderRadius: 18,
    borderWidth: 2,
  },
  logT: { fontFamily: font.bodySemi, fontSize: 14, flexShrink: 1, textAlign: 'center' },
  logCompact: { minHeight: 46 },
  sosCompact: { minHeight: 64, paddingVertical: 8 },
  plan: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12, paddingTop: 12, borderTopWidth: 1 },
  planH: { fontFamily: font.bodyBold, fontSize: 12.5, letterSpacing: 0.4 },
  planT: { fontFamily: font.body, fontSize: 14.5, lineHeight: 20 },
  sos: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    minHeight: 72,
    paddingVertical: 11,
    paddingLeft: 12,
    paddingRight: 14,
    borderRadius: 22,
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  sosIc: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  sosB: { fontFamily: font.display, fontSize: 28, letterSpacing: 1.5, lineHeight: 30 },
  sosS: { fontFamily: font.bodyMedium, fontSize: 13.5, marginTop: 2, opacity: 0.95 },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingLeft: 14, paddingRight: 10, borderRadius: 16 },
  bannerBtn: { minHeight: 40, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderTopWidth: 1 },
  mark: { width: 12, height: 12, borderRadius: 6 },
});
