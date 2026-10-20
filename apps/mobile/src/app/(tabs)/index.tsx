/* Today, in the legacy order (with who I am becoming, quietly, under the date): a pause in progress, Rekindle after a slip, a talk-through that still matters (Talk it through), the hard hours (risk.ts: from two hours before, a push to talk it through), the flame with Next up and SOS, any note about how days
   are counted, the days card (only in the tracking week and step down: otherwise the flame card holds the one day number), today's entries, care after a slip, Your day, a word about the reminders (nudge-card.tsx), and a nudge when last week's review is waiting.
   Graduation (graduate.ts) is recorded here the first time it is earned, and its celebration opens. */
import {
  accountAsk,
  awayDue,
  awayStart,
  markOpen,
  tipAsk,
  tipButton,
  autoStep,
  startFromLog,
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
} from '@daybook/core';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';

import { AccountCard } from '@/components/account';
import { BackRow } from '@/components/back-row';
import { TIP_URL, TipCard, TipTop } from '@/components/support';
import { FirstPatternLine } from '@/components/first-pattern';
import { Hero } from '@/components/hero';
import { HomeScreenCard } from '@/components/home-screen';
import { NudgeCard } from '@/components/nudge-card';
import { RiskCard } from '@/components/risk-card';
import { SundayCard } from '@/components/sunday-card';
import { TalkCard } from '@/components/talk-card';
import { TellStartCard } from '@/components/tell-start';
import { Screen } from '@/components/screen';
import { CountNotes, DaysCard } from '@/components/today';
import { CareCard, PauseBanner, RekindleCard, TodaySoFar } from '@/components/today-log';
import { Icon, T } from '@/components/ui';
import { WeekCard } from '@/components/week-card';
import { Welcome } from '@/components/welcome';
import { YourDay } from '@/components/your-day';
import { useSos } from '@/lib/sos';
import { useStore } from '@/lib/store';
import { useAccount, useSync } from '@/lib/sync';
import { font, useTheme } from '@/lib/theme';

/** when this copy of the app started (the first sync after it is what lets Today mark the day opened) */
const LAUNCH = Date.now();

export default function Today() {
  const c = useTheme();
  const { ready, snap, tk, now, apply, update, say } = useStore();
  const st = snap.settings;
  const account = useAccount();
  const sync = useSync();

  /* a rough stretch switches counting to step down by itself, once, with a note (legacy cleanAutoCheck) */
  useEffect(() => {
    if (ready && st && shouldAutoStep(snap.days, st, tk)) apply(autoStep(st, tk));
  }, [ready, st, snap.days, tk, apply]);

  /* the log starts with the first log: blank days before it are not counted, so the start (and a Day 1 before it) moves
     there, once, with a note. Not while an account is still bringing the log in, when the first log may not be here yet. */
  const syncing = sync.status.k === 'busy' || sync.status.k === 'ask' || !sync.loaded;
  const moved = useRef(0);
  useEffect(() => {
    if (!ready || !st || syncing) return;
    const c = startFromLog(snap.days, st, tk);
    if (!c) return;
    apply(c);
    moved.current = Date.now();
  }, [ready, st, snap.days, tk, apply, syncing]);

  /* this day is marked as one the app was opened, and the first time, the quiet-day rule starts (core away.ts, back.ts).
     With an account, only after this launch's first sync got through: a second device must not write a newer copy of
     today before it has the other device's entries for it. */
  const synced = sync.status.k === 'off' || sync.status.k === 'out' || (sync.status.k === 'on' && !!sync.at && sync.at >= LAUNCH);
  useEffect(() => {
    if (!ready || !st || syncing || !synced) return;
    const on = awayStart(st, tk);
    if (on) apply({ st: on });
    if (!snap.days[tk]?.p?.o) update((s0) => ({ ...s0, days: markOpen(s0.days, tk) }));
  }, [ready, st, snap.days, tk, apply, update, syncing, synced]);

  /* back after days away (core awayDue): Welcome back opens once, and once more the next day if it was closed unanswered;
     after that the gap waits as a quiet row (BackRow). Kept in this device's memory, never synced. */
  const sos = useSos();
  const due = st && !syncing ? awayDue(snap.days, st, tk) : null;
  const asked = (sos.mem.backAsk && typeof sos.mem.backAsk === 'object' ? sos.mem.backAsk : null) as { from: string; n: number; d: string } | null;
  const askAgain = !!due && (!asked || asked.from !== due.from || (asked.n < 2 && asked.d !== tk));
  useEffect(() => {
    if (!ready || !due || !askAgain) return;
    sos.setMem((m) => ({ ...m, backAsk: { from: due.from, n: asked && asked.from === due.from ? asked.n + 1 : 1, d: tk } }));
    router.push('/back');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, due?.from, askAgain, tk]);

  /* graduation: recorded once, the first time it is earned, and then its celebration opens */
  useEffect(() => {
    if (!ready || !st || !gradInfo(snap.days, st, tk).ready) return;
    apply(graduate(st, tk));
    router.push('/graduated');
  }, [ready, st, snap.days, tk, apply]);

  /* hard hours that passed with no slip are kept (a calm move), once, with a word. A note says one thing at a time, so
     when the start is moving, its note goes first and this waits for the clock's next tick, half a minute on. */
  useEffect(() => {
    if (!ready || !st || Date.now() - moved.current < 10000 || (!syncing && startFromLog(snap.days, st, tk))) return;
    const x = riskToKeep(snap.days, st, tk, now);
    if (!x) return;
    update((s0) => ({ ...s0, days: keepHard(s0.days, x.k, x.r.win.start) }));
    say((x.k === tk ? 'You got through ' : 'Last night you got through ') + x.r.win.label + ', your hardest hours.');
  }, [ready, st, snap.days, tk, now, update, say, syncing]);

  const g = useMemo(() => (st ? gameCompute(snap.days, st, snap.reviews, tk) : null), [snap, st, tk]);

  if (!st || !g) return <Welcome />;
  const early = new Date(now).getHours() < st.rollover;
  const ph = phaseLabel(tk, st);
  const be = String(st.becoming || '').trim();
  /* the days card stays for the tracking week and step down; once counting, the flame card holds the one day number */
  const showDays = st.cleanMode === 'step' || !todayMeasure(snap.days, st, tk);
  const ask = accountAsk(snap.days, st, tk, g.level.n, account);
  const tip = tipAsk(snap.days, st, tk, new Date(now).getHours(), ask, TIP_URL);
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
    <Screen
      eyebrow="My Daybook"
      title={fmtDate(tk, { weekday: 'long', month: 'short', day: 'numeric' })}
      sub={sub}
      action={tipButton(snap.days, tk, TIP_URL) ? <TipTop /> : undefined}>
      <PauseBanner />
      <RekindleCard snap={snap} tk={tk} />
      <TalkCard snap={snap} now={now} />
      <RiskCard snap={snap} tk={tk} now={now} />
      <Hero g={g} snap={snap} tk={tk} now={now} />
      {due && !askAgain ? <BackRow n={due.n} /> : null}
      <TellStartCard snap={snap} tk={tk} />
      <WeekCard snap={snap} tk={tk} />
      <SundayCard snap={snap} tk={tk} />
      <CountNotes snap={snap} tk={tk} />
      {showDays ? <DaysCard snap={snap} tk={tk} now={now} size="sm" /> : null}
      <TodaySoFar snap={snap} tk={tk} />
      <FirstPatternLine snap={snap} tk={tk} />
      <CareCard snap={snap} tk={tk} />
      <YourDay snap={snap} tk={tk} now={now} />
      {ask || tip ? null : <NudgeCard snap={snap} tk={tk} />}
      {ask ? <AccountCard why={ask} locked={lessonsLocked(LESSONS, lessonsDone(snap.days), false)} /> : null}
      {tip ? <TipCard /> : null}
      <HomeScreenCard />
    </Screen>
  );
}

const s = StyleSheet.create({
  sub: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 4 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 2, minHeight: 32, paddingLeft: 12, paddingRight: 8, borderRadius: 999 },
  chipT: { fontFamily: font.bodySemi, fontSize: 14 },
  be: { fontFamily: font.bodyMedium, fontSize: 15, lineHeight: 20, marginTop: 2 },
});
