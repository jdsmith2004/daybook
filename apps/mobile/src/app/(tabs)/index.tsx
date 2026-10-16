/* Today, in the legacy order: a pause in progress, Rekindle after a slip, the flame with Next up and SOS, any note about how days
   are counted, the days card, today's entries, care after a slip, Your day, and a nudge when last week's review is waiting. */
import {
  autoStep,
  fmtClock,
  fmtDate,
  gameCompute,
  p2,
  phaseLabel,
  shouldAutoStep,
  weekNudge,
} from '@daybook/core';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type ScrollViewInstance } from 'react-native';

import { Hero } from '@/components/hero';
import { Screen } from '@/components/screen';
import { CountNotes, DaysCard } from '@/components/today';
import { CareCard, PauseBanner, RekindleCard, TodaySoFar } from '@/components/today-log';
import { Button, Card, Icon, T } from '@/components/ui';
import { Welcome } from '@/components/welcome';
import { YourDay } from '@/components/your-day';
import { useStore } from '@/lib/store';
import { font, useTheme } from '@/lib/theme';

export default function Today() {
  const c = useTheme();
  const { ready, snap, tk, now, apply } = useStore();
  const st = snap.settings;
  const scroll = useRef<ScrollViewInstance>(null);
  const [dayY, setDayY] = useState(0);
  const [stop, setStop] = useState<{ k: string; n: number } | null>(null);

  /* a rough stretch switches counting to step down by itself, once, with a note (legacy cleanAutoCheck) */
  useEffect(() => {
    if (ready && st && shouldAutoStep(snap.days, st, tk)) apply(autoStep(st, tk));
  }, [ready, st, snap.days, tk, apply]);

  const g = useMemo(() => (st ? gameCompute(snap.days, st, snap.reviews, tk) : null), [snap, st, tk]);

  if (!st || !g) return <Welcome />;
  const early = new Date(now).getHours() < st.rollover;
  const ph = phaseLabel(tk, st);
  const nudge = weekNudge(st, snap.reviews, tk);
  const sub = (
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
  );
  return (
    <Screen eyebrow="My Daybook" title={fmtDate(tk, { weekday: 'long', month: 'short', day: 'numeric' })} sub={sub} scrollRef={scroll}>
      <PauseBanner />
      <RekindleCard snap={snap} tk={tk} />
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
      <DaysCard snap={snap} tk={tk} now={now} size="sm" />
      <TodaySoFar snap={snap} tk={tk} />
      <CareCard snap={snap} tk={tk} />
      <View onLayout={(e) => setDayY(e.nativeEvent.layout.y)}>
        <YourDay snap={snap} tk={tk} now={now} openStop={stop} />
      </View>
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
});
