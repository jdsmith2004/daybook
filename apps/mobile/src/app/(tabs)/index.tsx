/* Today, one moment at a time (docs/plan.md; core moment.ts): the date and who I am becoming; one card, picked by the
   moment (a pause, the hard hours, the morning after or the day of a slip, a talk-through, days away, the Sunday review, a
   one-time moment, or the day's next stop), with "and one more" under it when two overlap; SOS with Already happened and
   Planning a slip? (care is never locked); one standing row (a small flame, one number, one line, opening Milestones);
   Your day as plain rows; then the asks, one at a time. Graduation (graduate.ts) is recorded here the first time it is
   earned, and its celebration opens. */
import {
  accountAsk,
  awayDue,
  awayStart,
  markOpen,
  tipAsk,
  tipQuiet,
  pulseAsk,
  urLastAt,
  tipButton,
  autoCount,
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
  firstPattern,
  nudgeCard,
  pickMoment,
  shouldAutoCount,
  shouldAutoStep,
} from '@daybook/core';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Text } from '@/components/text';

import { AccountCard } from '@/components/account';
import { TIP_URL, TipCard, TipTop } from '@/components/support';
import { HomeScreenCard } from '@/components/home-screen';
import { PulseCard } from '@/components/pulse';
import { usePulse } from '@/lib/pulse';
import { MomentCard } from '@/components/moment-card';
import { StandRow } from '@/components/stand-row';
import { SundayCard } from '@/components/sunday-card';
import { Screen } from '@/components/screen';
import { LogLink, TodaySoFar } from '@/components/today-log';
import { Card, T } from '@/components/ui';
import { Welcome } from '@/components/welcome';
import { YourDay } from '@/components/your-day';
import { useNudgeLog, useReminderPrefs } from '@/lib/prefs';
import { remindersOffered } from '@/lib/reminders';
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

  /* counting switches by itself, both ways, with a note each time (Settings, "Switch for me"): a rough stretch moves counting
     days to step down (legacy cleanAutoCheck), and once the stretches get long, step down moves to counting days. Each
     switch holds for two weeks, so it never flips back and forth. */
  useEffect(() => {
    if (!ready || !st) return;
    if (shouldAutoStep(snap.days, st, tk)) apply(autoStep(st, tk));
    else if (shouldAutoCount(snap.days, st, tk, now)) apply(autoCount(st, tk));
  }, [ready, st, snap.days, tk, now, apply]);

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
  const pulse = usePulse();
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

  /* the first pattern is a calm-day moment for one day, then it lives in Journal, Pattern (kept on this device) */
  const patDay = typeof sos.mem.firstPat === 'string' ? (sos.mem.firstPat as string) : null;
  const pat = !!st && !patDay && !!firstPattern(snap.days, st, tk);
  useEffect(() => {
    if (ready && pat) sos.setMem((m) => ({ ...m, firstPat: tk }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, pat, tk]);
  const prefs = useReminderPrefs();
  const nlog = useNudgeLog();
  const nudge = remindersOffered && st && nlog.ready ? nudgeCard(snap.days, st, prefs, nlog, tk) : null;

  if (!st || !g) return <Welcome />;
  const early = new Date(now).getHours() < st.rollover;
  const be = String(st.becoming || '').trim();
  const pick = pickMoment(snap.days, st, snap.reviews, tk, now, {
    pause: !!sos.timer,
    back: due && !askAgain ? due.n : null,
    nudge,
    patternDay: patDay || (pat ? tk : null),
    account: !!account,
  });
  const ask = accountAsk(snap.days, st, tk, g.level.n, account);
  const tip = tipAsk(snap.days, st, tk, new Date(now).getHours(), ask, TIP_URL, { now, sos: urLastAt(sos.mem) });
  /* the counts ask, once, on a calm day, never beside another ask (core pulseAsk) */
  const counts = pulseAsk(pulse, snap.days, tk, new Date(now).getHours(), !!(ask || tip), tipQuiet(snap.days, st, { now, sos: urLastAt(sos.mem) }));
  const sub = (
    <>
      {be ? (
        <Pressable accessibilityRole="button" accessibilityLabel={`Who I am becoming: ${be} Opens My plan.`} onPress={() => router.push('/plan')}>
          <Text style={[s.be, { color: c.muted }]}>{be}</Text>
        </Pressable>
      ) : null}
      {early ? (
        <T v="small" tone="muted" style={{ marginTop: 4 }}>
          Still {fmtDate(tk, { weekday: 'long' })}’s log until {fmtClock(p2(st.rollover) + ':00')}
        </T>
      ) : null}
    </>
  );
  return (
    <Screen
      eyebrow="My Daybook"
      title={fmtDate(tk, { weekday: 'long', month: 'short', day: 'numeric' })}
      sub={sub}
      action={tipButton(snap.days, tk, TIP_URL) ? <TipTop /> : undefined}>
      <MomentCard pick={pick} snap={snap} tk={tk} now={now} />
      <Card>
        <LogLink />
      </Card>
      <StandRow g={g} snap={snap} tk={tk} now={now} />
      <YourDay snap={snap} tk={tk} now={now} />
      <SundayCard snap={snap} tk={tk} due={false} />
      <TodaySoFar snap={snap} tk={tk} />
      {ask ? <AccountCard why={ask} locked={lessonsLocked(LESSONS, lessonsDone(snap.days), false)} /> : null}
      {tip ? <TipCard /> : null}
      {counts ? <PulseCard /> : null}
      <HomeScreenCard />
    </Screen>
  );
}

const s = StyleSheet.create({
  be: { fontFamily: font.bodyMedium, fontSize: 15, lineHeight: 20, marginTop: 2 },
});
