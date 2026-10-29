/* Today, one moment at a time (docs/plan.md; core moment.ts): the date and who I am becoming; one card, picked by the
   moment (a pause, the hard hours, a run question left open or the day of a slip, a talk-through, days away, the Sunday
   review, a one-time moment, or the day's next stop), with "and one more" under it when two overlap, hanging under the flame in its
   sky (hero.tsx: the number, the level and the bar to the next form; CLAUDE.md, "The flame is the heart of the app");
   one quiet line under it (what was logged today, the week's goal); SOS with Already happened and Planning a slip? (care
   is never locked); last night's win, when an urge was ridden out in SOS at night (night-win.tsx); Your day as plain
   rows; then the asks, one at a time, and none on the day the person came back or in the hours after an SOS or a slip
   (lib/quiet-asks.ts). A plan talked through waits quietly under SOS until its moment has passed (core talkPlanNow). On
   a short phone Today goes compact (lib/today-size.ts), so SOS and its two buttons fit above the tab bar. On the day of
   a slip, its card ("After a slip") sits right under SOS instead of in the flame's card: a person who just slipped may
   still be pulled toward it, so SOS stays in sight with the flame, and the slip's one small thing is just below. Pulling the page down past its top opens the journal (app/journal.tsx), and until
   it has been opened once, a line under the title says so. Graduation (graduate.ts) is recorded here the first time it is earned, and its
   celebration opens. */
import {
  accountAsk,
  awayDue,
  awayStart,
  dayFeelDue,
  dayFeelOf,
  dayFeelQuiet,
  markOpen,
  tipAsk,
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
  srDone,
  standRow,
  sunriseDue,
} from '@daybook/core';
import { router, useFocusEffect, useIsFocused } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Pressable, StyleSheet, View, type ScrollViewInstance } from 'react-native';
import { Text } from '@/components/text';

import { AccountCard } from '@/components/account';
import { TIP_URL, TipCard, TipTop } from '@/components/support';
import { HomeScreenCard } from '@/components/home-screen';
import { MomentCard } from '@/components/moment-card';
import { NightWinCard } from '@/components/night-win';
import { NotifyBanner } from '@/components/notify-banner';
import { Hero } from '@/components/hero';
import { openJournalFrom } from '@/components/journal';
import { PullHint } from '@/components/pull-door';
import { Screen } from '@/components/screen';
import { LogLink, WaitingPlan } from '@/components/today-log';
import { Card, T } from '@/components/ui';
import { Welcome } from '@/components/welcome';
import { YourDay } from '@/components/your-day';
import { spendFirstOpen, useFirstOpen } from '@/lib/day-open';
import { sheetOnTop } from '@/lib/nav';
import { useCelebrating } from '@/components/celebrate';
import { DayFeelPop } from '@/components/day-feel-pop';
import { useNudgeLog, useReminderPrefs } from '@/lib/prefs';
import { remindersOffered } from '@/lib/reminders';
import { useSos } from '@/lib/sos';
import { useCameBack, useQuietAsks } from '@/lib/quiet-asks';
import { useStore } from '@/lib/store';
import { MORE_ROOM, NOTE_ROOM, todaySize, useTodayRoom } from '@/lib/today-size';
import { useAccount, useSync } from '@/lib/sync';
import { SyncStrip } from '@/components/sync-strip';
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
     The day after a slip, opening it is also the sunrise check (core sunriseDue): coming back is the comeback.
     With an account, only after this launch's first sync got through: a second device must not write a newer copy of
     today before it has the other device's entries for it. */
  const synced = sync.status.k === 'off' || sync.status.k === 'out' || (sync.status.k === 'on' && !!sync.at && sync.at >= LAUNCH);
  useEffect(() => {
    if (!ready || !st || syncing || !synced) return;
    const on = awayStart(st, tk);
    if (on) apply({ st: on });
    if (!snap.days[tk]?.p?.o) update((s0) => ({ ...s0, days: markOpen(s0.days, tk) }));
    /* coming back after a slip is the sunrise check: it lights the second flame, with nothing to answer (core srDone) */
    const back = sunriseDue(snap.days, st, tk);
    if (back) update((s0) => ({ ...s0, days: srDone(s0.days, back.k, back.ev.id, tk) }));
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

  /* How are you feeling today? (core day-feel.ts, lib/day-open.ts): on the day's first open only, and only over Today:
     once Today is the screen in front, with no sheet on it and nothing else about to open (Welcome back, graduation).
     Never after a slip (one logged today, or a Rekindle open), never in an open that used SOS or a pause, never in the
     hard hours or once the wind-down has started (core dayFeelQuiet), and not on the day the person came back, when
     enough has opened already. It opens once: after that, or when this open cannot ask, it waits for tomorrow. */
  const firstOpen = useFirstOpen();
  const focused = useIsFocused();
  const focusRef = useRef(focused);
  focusRef.current = focused;
  /* "How are you feeling today?": a small card at the bottom of Today on the day's first open (day-feel-pop.tsx) */
  const [askFeel, setAskFeel] = useState(false);
  /* it waits while a celebration is up; one that comes after it was answered simply ends it */
  const celebrating = useCelebrating();
  const feltToday = !!dayFeelOf(snap.days[tk]);
  useEffect(() => {
    if (celebrating && askFeel && feltToday) setAskFeel(false);
  }, [celebrating, askFeel, feltToday]);
  const sosUsed = !!firstOpen && (!!sos.ur || !!sos.timer || (urLastAt(sos.mem) ?? 0) >= firstOpen.at);
  const gradNow = !!st && gradInfo(snap.days, st, tk).ready;
  const backNow = !!due && askAgain;
  const cameBack = useCameBack();
  const feelQuiet = !!st && dayFeelQuiet(snap.days, st, tk, now);
  useEffect(() => {
    if (!firstOpen || !ready) return;
    if (firstOpen.k < tk || sosUsed || feelQuiet || cameBack) {
      spendFirstOpen();
      return;
    }
    /* wait for the log to settle (a slip or an answer from another device comes in with sync) */
    if (firstOpen.k !== tk || syncing || !st) return;
    if (!dayFeelDue(snap.days, st, tk)) {
      spendFirstOpen();
      return;
    }
    if (!focused || backNow || gradNow) return;
    const t = setTimeout(() => {
      if (!focusRef.current || sheetOnTop()) return;
      spendFirstOpen();
      setAskFeel(true);
    }, 700);
    return () => clearTimeout(t);
  }, [firstOpen, ready, tk, sosUsed, syncing, st, snap.days, focused, backNow, gradNow, feelQuiet, cameBack]);

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

  /* Today always opens on the flame and the next step: once it is out of sight (another tab, a lesson, a page, or the app
     put away), it goes back to the top, so coming back never shows it jump. A sheet only covers part of it, so a sheet
     keeps the place. */
  const scroll = useRef<ScrollViewInstance>(null);
  const top = useCallback(() => scroll.current?.scrollTo({ y: 0, animated: false }), []);
  const away = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const left = useRef(false);
  useFocusEffect(
    useCallback(() => {
      clearTimeout(away.current);
      /* a hidden tab cannot scroll on the web, so it also goes up as it comes back, before it is drawn */
      if (left.current) top();
      left.current = false;
      return () => {
        left.current = !sheetOnTop();
        if (left.current) away.current = setTimeout(top, 450);
      };
    }, [top]),
  );
  useEffect(() => {
    const sub = AppState.addEventListener('change', (a) => a === 'background' && top());
    return () => {
      sub.remove();
      clearTimeout(away.current);
    };
  }, [top]);

  const g = useMemo(() => (st ? gameCompute(snap.days, st, snap.reviews, tk) : null), [snap, st, tk]);

  /* the first pattern is a calm-day moment for one day, then it lives in Pattern (kept on this device) */
  const patDay = typeof sos.mem.firstPat === 'string' ? (sos.mem.firstPat as string) : null;
  const pat = !!st && !patDay && !!firstPattern(snap.days, st, tk);
  useEffect(() => {
    if (ready && pat) sos.setMem((m) => ({ ...m, firstPat: tk }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, pat, tk]);
  const prefs = useReminderPrefs();
  const nlog = useNudgeLog();
  const nudge = remindersOffered && st && nlog.ready ? nudgeCard(snap.days, st, prefs, nlog, tk) : null;
  const quiet = useQuietAsks();
  const room = useTodayRoom();

  if (!st || !g) return <Welcome />;
  const early = new Date(now).getHours() < st.rollover;
  const be = String(st.becoming || '').trim();
  const pick = pickMoment(snap.days, st, snap.reviews, tk, now, {
    pause: !!sos.timer,
    back: due && !askAgain ? due.n : null,
    nudge,
    patternDay: patDay || (pat ? tk : null),
    account: !!account,
    comebackSeen: typeof sos.mem.cbSeen === 'string' ? (sos.mem.cbSeen as string) : null,
  });
  /* no asks on the day the person came back, or in the hours after an SOS or a slip (lib/quiet-asks.ts) */
  const ask = quiet ? null : accountAsk(snap.days, st, tk, g.level.n, account);
  const tip = !quiet && tipAsk(snap.days, st, tk, new Date(now).getHours(), ask, TIP_URL, { now, sos: urLastAt(sos.mem) });
  /* one quiet line under the next step: what was logged today, and the week's goal from Sunday */
  const note = standRow(snap.days, st, snap.reviews, tk, now, g.level.name)?.note;
  /* the day of a slip: its card sits under SOS (see the top of this file), so it never pushes SOS out of sight */
  const slipDay = pick.card.k === 'slip-day';
  /* the quiet lines under the next step (what was logged today, and "And one more") take their room, so the sky can make way.
     On the day of a slip the card is not under the flame, so there is room to spare. */
  const size = todaySize(room, slipDay ? 0 : (note ? NOTE_ROOM : 0) + (pick.more ? MORE_ROOM : 0));
  const moment = <MomentCard pick={pick} snap={snap} tk={tk} now={now} />;
  const sub = (
    <>
      {be ? (
        <Pressable accessibilityRole="button" accessibilityLabel={`Who I am becoming: ${be} Opens My plan.`} onPress={() => router.push('/plan')}>
          <Text style={[s.be, { color: c.muted }]}>{be}</Text>
        </Pressable>
      ) : null}
      {sos.mem.jnSeen || size.compact ? null : <PullHint onPress={() => router.push('/journal')} />}
      {early ? (
        <T v="small" tone="muted" style={{ marginTop: 4 }}>
          Still {fmtDate(tk, { weekday: 'long' })}’s log until {fmtClock(p2(st.rollover) + ':00')}
        </T>
      ) : null}
    </>
  );
  return (
    <View style={{ flex: 1 }}>
      <Screen
        scrollRef={scroll}
        eyebrow={size.compact ? undefined : 'My Daybook'}
        title={fmtDate(tk, { weekday: 'long', month: 'short', day: 'numeric' })}
        sub={sub}
        pullDown={(px) => {
          openJournalFrom(px);
          router.push('/journal');
        }}
        action={tipButton(snap.days, tk, TIP_URL, st, now, { now, sos: urLastAt(sos.mem) }) ? <TipTop /> : undefined}>
        <NotifyBanner />
        <SyncStrip />
        <Hero g={g} snap={snap} tk={tk} now={now} sky={size.sky} compact={size.compact}>
          {slipDay ? null : moment}
          {note ? <Text style={[s.note, { color: c.accentText }, slipDay && s.noteFirst]}>{note}</Text> : null}
        </Hero>
        <Card style={size.compact && s.sosCompact}>
          <LogLink compact={size.compact} />
          <WaitingPlan snap={snap} tk={tk} now={now} />
        </Card>
        {slipDay ? moment : null}
        <NightWinCard snap={snap} tk={tk} />
        <YourDay snap={snap} tk={tk} now={now} />
        {ask ? <AccountCard why={ask} locked={lessonsLocked(LESSONS, lessonsDone(snap.days), false)} /> : null}
        {tip ? <TipCard /> : null}
        <HomeScreenCard />
      </Screen>
      {askFeel && !celebrating ? <DayFeelPop onDone={() => setAskFeel(false)} /> : null}
    </View>
  );
}

const s = StyleSheet.create({
  be: { fontFamily: font.bodyMedium, fontSize: 15, lineHeight: 20, marginTop: 2 },
  note: { fontFamily: font.bodySemi, fontSize: 13.5, lineHeight: 18, textAlign: 'center', marginTop: 8 },
  noteFirst: { marginTop: 0 },
  sosCompact: { paddingVertical: 12 },
});
