/* Today, in the legacy order (with who I am becoming, quietly, under the date): a pause in progress, Rekindle after a slip, a talk-through that still matters (Talk it through), the hard hours (risk.ts: from two hours before, a push to talk it through), the flame with Next up and SOS, any note about how days
   are counted, the days card (only in the tracking week and step down: otherwise the flame card holds the one day number), today's entries, care after a slip, Your day, and a nudge when last week's review is waiting.
   Graduation (graduate.ts) is recorded here the first time it is earned, and its celebration opens. */
import {
  accountAsk,
  autoStep,
  faithOf,
  LESSONS,
  lessonsDone,
  lessonsLocked,
  fmtClock,
  fmtDate,
  gameCompute,
  gradInfo,
  keepHard,
  riskToKeep,
  graduate,
  p2,
  phaseLabel,
  shouldAutoStep,
  todayMeasure,
  weekNudge,
} from '@daybook/core';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type ScrollViewInstance } from 'react-native';

import { AccountCard } from '@/components/account';
import { Hero } from '@/components/hero';
import { RiskCard } from '@/components/risk-card';
import { TalkCard } from '@/components/talk-card';
import { Screen } from '@/components/screen';
import { CountNotes, DaysCard } from '@/components/today';
import { CareCard, PauseBanner, RekindleCard, TodaySoFar } from '@/components/today-log';
import { Button, Card, Icon, T } from '@/components/ui';
import { Welcome } from '@/components/welcome';
import { YourDay } from '@/components/your-day';
import { useStore } from '@/lib/store';
import { useAccount } from '@/lib/sync';
import { font, useTheme } from '@/lib/theme';

export default function Today() {
  const c = useTheme();
  const { ready, snap, tk, now, apply, update, say } = useStore();
  const st = snap.settings;
  const account = useAccount();
  const scroll = useRef<ScrollViewInstance>(null);
  const [dayY, setDayY] = useState(0);
  const [stop, setStop] = useState<{ k: string; n: number } | null>(null);

  /* a rough stretch switches counting to step down by itself, once, with a note (legacy cleanAutoCheck) */
  useEffect(() => {
    if (ready && st && shouldAutoStep(snap.days, st, tk)) apply(autoStep(st, tk));
  }, [ready, st, snap.days, tk, apply]);

  /* graduation: recorded once, the first time it is earned, and then its celebration opens */
  useEffect(() => {
    if (!ready || !st || !gradInfo(snap.days, st, tk).ready) return;
    apply(graduate(st, tk));
    router.push('/graduated');
  }, [ready, st, snap.days, tk, apply]);

  /* hard hours that passed with no slip are kept (a calm move), once, with a word */
  useEffect(() => {
    if (!ready || !st) return;
    const x = riskToKeep(snap.days, st, tk, now);
    if (!x) return;
    update((s0) => ({ ...s0, days: keepHard(s0.days, x.k, x.r.win.start) }));
    say((x.k === tk ? 'You got through ' : 'Last night you got through ') + x.r.win.label + ', your hardest hours.');
  }, [ready, st, snap.days, tk, now, update, say]);

  const g = useMemo(() => (st ? gameCompute(snap.days, st, snap.reviews, tk) : null), [snap, st, tk]);

  if (!st || !g) return <Welcome />;
  const early = new Date(now).getHours() < st.rollover;
  const ph = phaseLabel(tk, st);
  const nudge = weekNudge(st, snap.reviews, tk);
  const be = String(st.becoming || '').trim();
  /* the days card stays for the tracking week and step down; once counting, the flame card holds the one day number */
  const showDays = st.cleanMode === 'step' || !todayMeasure(snap.days, st, tk);
  const ask = accountAsk(snap.days, st, tk, g.level.n, account);
  const sub = (
    <>
      {be ? (
        <Pressable accessibilityRole="button" accessibilityLabel={`Who I am becoming: ${be} Opens My plan.`} onPress={() => router.push('/plan')}>
          <Text style={[s.be, { color: c.muted }]}>{be}</Text>
        </Pressable>
      ) : null}
      <View style={s.sub}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${ph}. What this means, and how to change it.`}
          onPress={() => router.push('/mode')}
          style={[s.chip, { backgroundColor: c.accentSoft }]}>
          <Text style={[s.chipT, { color: c.accentText }]}>{ph}</Text>
          <Icon name="next" size={14} color={c.accentText} />
        </Pressable>
        {early ? (
          <T v="small" tone="muted">
            · still {fmtDate(tk, { weekday: 'long' })}'s log until {fmtClock(p2(st.rollover) + ':00')}
          </T>
        ) : null}
      </View>
    </>
  );
  return (
    <Screen eyebrow="My Daybook" title={fmtDate(tk, { weekday: 'long', month: 'short', day: 'numeric' })} sub={sub} scrollRef={scroll}>
      <PauseBanner />
      <RekindleCard snap={snap} tk={tk} />
      <TalkCard snap={snap} now={now} />
      <RiskCard snap={snap} tk={tk} now={now} />
      <Hero
        g={g}
        snap={snap}
        tk={tk}
        now={now}
        onStop={(k) => {
          setStop({ k, n: Date.now() });
          scroll.current?.scrollTo({ y: Math.max(0, dayY - 12), animated: true });
        }}
      />
      <CountNotes snap={snap} tk={tk} />
      {showDays ? <DaysCard snap={snap} tk={tk} now={now} size="sm" /> : null}
      <TodaySoFar snap={snap} tk={tk} />
      <CareCard snap={snap} tk={tk} />
      <View onLayout={(e) => setDayY(e.nativeEvent.layout.y)}>
        <YourDay snap={snap} tk={tk} now={now} openStop={stop} />
      </View>
      {ask ? <AccountCard why={ask} locked={lessonsLocked(LESSONS, lessonsDone(snap.days), faithOf(st), false)} /> : null}
      {nudge != null ? (
        <Card tone="note">
          <T v="label">Week {nudge + 1} is done.</T>
          <T v="small">Ten minutes to look at the patterns and pick one change. Worth 20 points.</T>
          <Button kind="ghost" label="Open review" onPress={() => router.push({ pathname: '/week/[k]', params: { k: String(nudge) } })} />
        </Card>
      ) : null}
    </Screen>
  );
}

const s = StyleSheet.create({
  sub: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 4 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 2, minHeight: 32, paddingLeft: 12, paddingRight: 8, borderRadius: 999 },
  chipT: { fontFamily: font.bodySemi, fontSize: 14 },
  be: { fontFamily: font.bodyMedium, fontSize: 15, lineHeight: 20, marginTop: 2 },
});
