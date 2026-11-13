/* Today, one simple page (docs/plan.md; core moment.ts). The flame in its sky fills the top of the screen, with nothing written over
   it (hero.tsx: the number, the level and the bar to the next form; CLAUDE.md, "The flame is the heart of the app"). Under it, Already happened and Walk it through (the trail, which took the place of Planning a slip; care is never locked; SOS is in the tab bar, always in reach of the thumb). Then Your day, one line down the page with the next stop as the one big bright card (your-day.tsx), so what to
   do is plain at a glance. When a bigger moment has the next step (a pause, the day of a slip, a talk-through, days
   away, the Sunday review, a one-time moment), its card sits above the line. Then last night's win, when an urge was ridden out in
   SOS at night (night-win.tsx), and the asks, one at a time, and none on the day the person came back or in the hours after an SOS
   or a slip (lib/quiet-asks.ts). A plan talked through waits quietly under the line until its moment has passed (core talkPlanNow).
   The sky takes the room the rest does not need (lib/today-size.ts). Pulling the page down past its top opens the journal
   (app/journal.tsx). Graduation (graduate.ts) is recorded here the
   first time it is earned, and its celebration opens. */
import {
  accountAsk,
  awayDue,
  awayStart,
  dayFeelDue,
  dayFeelQuiet,
  markOpen,
  tipAsk,
  urLastAt,
  careLastAt,
  autoCount,
  bpsDue,
  freeDue,
  autoStep,
  startFromLog,
  lessonPathFor,
  lessonsDone,
  lessonsLocked,
  fmtDate,
  gameCompute,
  gradInfo,
  keepHard,
  riskToKeep,
  graduate,
  firstPattern,
  heroSlipLine,
  nudgeCard,
  pickMoment,
  shouldAutoCount,
  shouldAutoStep,
  srDone,
  standRow,
  sunriseDue,
  morningDue,
  afterNightHour,
  skyPhase,
  fmtClock,
  stopTiles,
  lessonStop,
} from '@daybook/core';
import { router, useFocusEffect, useIsFocused } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Platform, StyleSheet, View, type ScrollViewInstance } from 'react-native';
import { Text } from '@/components/text';

import { AccountCard } from '@/components/account';
import { FeedbackTop } from '@/components/feedback-top';
import { TIP_URL, TipCard } from '@/components/support';
import { HomeScreenCard } from '@/components/home-screen';
import { MomentCard } from '@/components/moment-card';
import { NightWinCard } from '@/components/night-win';
import { NotifyBanner } from '@/components/notify-banner';
import { PullTroubleStrip } from '@/components/pull-trouble';
import { Hero, skyInk } from '@/components/hero';
import { openJournalFrom } from '@/components/journal';
import { Screen } from '@/components/screen';
import { useSosLeadOn } from '@/components/sos-lead';
import { TodayBelow } from '@/components/today-below';
import { LogLink, WaitingPlan } from '@/components/today-log';
import { Welcome } from '@/components/welcome';
import { StopCard, YourDay } from '@/components/your-day';
import { FirstTour, tourSteps } from '@/components/tour';
import { markTourDone, tourDue, useSpot } from '@/lib/tour';
import { spendFirstOpen, useFirstOpen } from '@/lib/day-open';
import { sheetOnTop, useHoldsBar } from '@/lib/nav';
import { celebrationSheetAt, useCelebrating } from '@/components/celebrate';
import { DayFeelPop } from '@/components/day-feel-pop';
import { useNudgeLog, useReminderPrefs } from '@/lib/prefs';
import { remindersOffered } from '@/lib/reminders';
import { useSos } from '@/lib/sos';
import { useCameBack, useQuietAsks } from '@/lib/quiet-asks';
import { useStore } from '@/lib/store';
import { useUnlock } from '@/lib/unlock';
import { useNights } from '@/lib/health';
import { LEAD_ROOM, NOTE_ROOM, useTodaySize } from '@/lib/today-size';
import { useAccount, useSync } from '@/lib/sync';
import { SyncStrip } from '@/components/sync-strip';
import { font, useTheme } from '@/lib/theme';

/** when this copy of the app started (the first sync after it is what lets Today mark the day opened) */
const LAUNCH = Date.now();

/** the day the morning set was last opened from Today in this run of the app */
let morningOpened = '';

export default function Today() {
  const c = useTheme();
  const { ready, snap, tk, now, apply, update, say } = useStore();
  const { nights } = useNights();
  const st = snap.settings;
  const account = useAccount();
  const sync = useSync();

  /* counting switches by itself, both ways, with a note each time (Settings, "Switch for me"): a rough stretch moves counting
     days to step down (legacy cleanAutoCheck), and once the stretches get long, step down moves to counting days. Each
     switch holds for two weeks, so it never flips back and forth. */
  useEffect(() => {
    if (!ready || !st) return;
    if (shouldAutoStep(snap.days, st, tk)) apply((s) => autoStep(s, tk));
    else if (shouldAutoCount(snap.days, st, tk, now)) apply((s) => autoCount(s, tk));
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
    if (awayStart(st, tk)) apply((s) => ({ st: awayStart(s, tk) ?? s }));
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
  const holdsBar = useHoldsBar();
  const focusRef = useRef(focused);
  focusRef.current = focused;
  /* "How are you feeling today?": a small card at the bottom of Today on the day's first open (day-feel-pop.tsx) */
  const [askFeel, setAskFeel] = useState(false);
  /* a celebration sheet ends it: there is never both on one open (the owner, October 30, 2026) */
  const celebrating = useCelebrating();
  /* the first look at Today (components/tour.tsx), once, after setup: it waits for a calm, settled Today */
  const tourWaits = tourDue(sos.mem);
  useEffect(() => {
    if (celebrating && askFeel) setAskFeel(false);
  }, [celebrating, askFeel]);
  const sosUsed = !!firstOpen && (!!sos.ur || !!sos.timer || (urLastAt(sos.mem) ?? 0) >= firstOpen.at);
  const gradNow = !!st && gradInfo(snap.days, st, tk).ready;
  const backNow = !!due && askAgain;
  const cameBack = useCameBack();
  const feelQuiet = !!st && dayFeelQuiet(snap.days, st, tk, now);
  /* the morning set (core morning-set.ts, app/morning.tsx): in the morning, until set or closed today, over Today only, once the
     log has settled and nothing else is opening (Welcome back, graduation). Not on the day the person came back, when enough has
     opened already, and not while SOS is open. It comes before "How are you feeling today?", which it answers. */
  const morningNow = !!st && !syncing && !cameBack && !sos.ur && !sos.timer && morningDue(snap.days, st, tk, now);
  useEffect(() => {
    if (!ready || !morningNow || !focused || backNow || gradNow || celebrating) return;
    const t = setTimeout(() => {
      if (!focusRef.current || sheetOnTop() || morningOpened === tk) return;
      /* once per day in this run of the app: a page left by a back press does not come straight back (the X skips it for good) */
      morningOpened = tk;
      router.push('/morning');
    }, 400);
    return () => clearTimeout(t);
  }, [ready, morningNow, focused, backNow, gradNow, celebrating, tk]);
  useEffect(() => {
    if (!firstOpen || !ready) return;
    if (firstOpen.k < tk || sosUsed || feelQuiet || cameBack || celebrating || tourWaits || celebrationSheetAt() >= firstOpen.at) {
      spendFirstOpen();
      return;
    }
    /* wait for the log to settle (a slip or an answer from another device comes in with sync) */
    if (firstOpen.k !== tk || syncing || !st) return;
    if (!dayFeelDue(snap.days, st, tk)) {
      spendFirstOpen();
      return;
    }
    if (!focused || backNow || gradNow || morningNow) return;
    const t = setTimeout(() => {
      if (!focusRef.current || sheetOnTop()) return;
      spendFirstOpen();
      setAskFeel(true);
    }, 700);
    return () => clearTimeout(t);
  }, [firstOpen, ready, tk, sosUsed, syncing, st, snap.days, focused, backNow, gradNow, feelQuiet, cameBack, celebrating, morningNow, tourWaits]);

  /* graduation: recorded once, the first time it is earned, and then its celebration opens */
  useEffect(() => {
    if (!ready || !st || !gradInfo(snap.days, st, tk).ready) return;
    /* from the settings as they are now: another change may have gone in during this same pass */
    apply((s) => graduate(s, tk));
    router.push('/graduated');
  }, [ready, st, snap.days, tk, apply]);

  /* hard hours that passed with no slip are kept (a calm move), once, with a word. A note says one thing at a time, so
     when the start is moving, its note goes first and this waits for the clock's next tick, half a minute on. */
  useEffect(() => {
    if (!ready || !st || Date.now() - moved.current < 10000 || (!syncing && startFromLog(snap.days, st, tk))) return;
    const x = riskToKeep(snap.days, st, tk, now);
    if (!x) return;
    update((s0) => ({ ...s0, days: keepHard(s0.days, x.k, x.r.win.start) }));
    const st0 = x.r.win.start;
    say(
      (x.k === tk ? 'You got through ' : st0 >= 17 || st0 < 5 ? 'Last night you got through ' : 'Yesterday you got through ') +
        x.r.win.label +
        ', your hardest hours.',
    );
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
  /* the tour: on Today in front, with nothing else opening, never in the hours after an SOS or a slip (it waits for them to pass),
     and never during an SOS or a pause. A short wait first, so a lesson opened by setup's Keep going is in front by then. */
  const [touring, setTouring] = useState(false);
  const tourNow = ready && !!st && tourWaits && !syncing && focused && !quiet && !backNow && !gradNow && !morningNow && !celebrating && !sos.ur && !sos.timer;
  useEffect(() => {
    if (!tourNow || touring) return;
    const t = setTimeout(() => {
      if (!focusRef.current || sheetOnTop()) return;
      scroll.current?.scrollTo({ y: 0, animated: false });
      scrolled.current = 0;
      setTouring(true);
    }, 900);
    return () => clearTimeout(t);
  }, [tourNow, touring]);
  const skySpot = useSpot('sky');
  /* the sky runs under the clock: the clock takes the sky's ink until the page has scrolled past it */
  const [past, setPast] = useState(false);
  /* the line under Your day sits behind the iPhone's glass tab bar until the page moves, so it waits until then */
  const [atRest, setAtRest] = useState(true);
  const scrolled = useRef(0);
  const sizeFor = useTodaySize();
  const lead = useSosLeadOn();
  /* a part unlocked (core unlock.ts; its card keeps it as seen, moment-card.tsx) */
  const unlock = useUnlock();

  if (!st || !g) return <Welcome />;
  const pick = pickMoment(snap.days, st, snap.reviews, tk, now, {
    pause: !!sos.timer,
    back: due && !askAgain ? due.n : null,
    nudge,
    patternDay: patDay || (pat ? tk : null),
    account: !!account,
    comebackSeen: typeof sos.mem.cbSeen === 'string' ? (sos.mem.cbSeen as string) : null,
    recheck: bpsDue(snap.days, st, tk, sos.mem, { now, sos: careLastAt(sos.mem) }),
    free: freeDue(snap.days, st, tk, { now, sos: careLastAt(sos.mem) }),
    unlock,
  });
  /* no asks on the day the person came back, or in the hours after an SOS or a slip (lib/quiet-asks.ts) */
  const ask = quiet ? null : accountAsk(snap.days, st, tk, g.level.n, account);
  const tip = !quiet && tipAsk(snap.days, st, tk, new Date(now).getHours(), ask, TIP_URL, { now, sos: careLastAt(sos.mem) });
  /* one quiet line under the next step: the week's goal from Sunday (today's entries are in Today so far, under it) */
  const note = standRow(snap.days, st, snap.reviews, tk, now, g.level.name, nights)?.note;
  /* the quiet lines under the next step take their room from the sky */
  const slipLine = heroSlipLine(snap.days, st, tk, now);
  /* the day's next stop is the big card on the line (your-day.tsx); any other moment keeps its own card above the line */
  const calm = pick.card.k === 'calm';
  /* the day is done: no box, a few words over the line, so all of it shows */
  const done = pick.card.k === 'done';
  const size = sizeFor((slipLine ? NOTE_ROOM : 0) + (lead ? LEAD_ROOM : 0));
  const title = fmtDate(tk, { weekday: 'long', month: 'short', day: 'numeric' });
  const ink = skyInk(g.level.n, skyPhase(snap.days, st, tk, now));
  /* after the night hour (tonight's time, core two-moments.ts), until the new day */
  const night = afterNightHour(snap.days, st, tk, now);
  /* the Good night stop, even on a day its row is switched off: Phone to bed is always the night's one card */
  const nightTile = night ? stopTiles(snap.days, { ...st, routine: { ...st.routine, wind: true } }, tk, now).tiles.find((x) => x.k === 'night') || null : null;
  const bedAt = snap.days[tk]?.p?.po || null;
  /* the day: the care row, then the day's line and what waits under it */
  const dayPage = (
    <>
      <LogLink />
      <NotifyBanner />
      <PullTroubleStrip />
      <WaitingPlan snap={snap} tk={tk} now={now} />
      {slipLine ? <Text style={[s.line, { color: c.muted }]}>{slipLine}</Text> : null}
      {calm || done ? null : <MomentCard pick={{ ...pick, more: null }} snap={snap} tk={tk} now={now} />}
      {done ? (
        <View style={s.done}>
          <Text style={[s.doneH, { color: c.ink }]}>{pick.card.h}</Text>
          <Text style={[s.line, { color: c.muted, paddingHorizontal: 0 }]}>{pick.card.p}</Text>
        </View>
      ) : null}
      <YourDay
        footOff={Platform.OS === 'ios' && atRest}
        snap={snap}
        tk={tk}
        now={now}
        hero={calm ? pick.card : null}
        foot={[note ? note + '.' : '', pick.more ? 'After this: ' + pick.more.one + '.' : ''].filter(Boolean).join(' ')}
      />
      <TodayBelow snap={snap} tk={tk} now={now} />
      <SyncStrip />
      <NightWinCard snap={snap} tk={tk} />
      {ask ? <AccountCard why={ask} locked={lessonsLocked(lessonPathFor(st), lessonsDone(snap.days), false, st)} /> : null}
      {tip ? <TipCard /> : null}
      <HomeScreenCard />
    </>
  );
  return (
    <View style={{ flex: 1 }}>
      {holdsBar ? <StatusBar style={past ? (c.scheme === 'dark' ? 'light' : 'dark') : ink.light ? 'light' : 'dark'} /> : null}
      <Screen
        scrollRef={scroll}
        title={title}
        bare={!past}
        onScroll={(y) => {
          if (y > size.sky - 60 !== scrolled.current > size.sky - 60) setPast(y > size.sky - 60);
          if (y > 12 === atRest) setAtRest(y <= 12);
          scrolled.current = y;
        }}
        pullDown={(px) => {
          openJournalFrom(px);
          router.push('/journal');
        }}
        top={
          <View ref={skySpot} collapsable={false}>
            <Hero
              g={g}
              snap={snap}
              tk={tk}
              now={now}
              sky={size.sky}
              flame={size.flame}
              title={title}
              lead={<FeedbackTop on={{ glass: ink.glass, ink: ink.ink }} />}
            />
          </View>
        }>
        {night ? (
          /* after the night hour, Today is the night page: one card, Phone to bed, and the care row; nothing else (WP5, mockup m3). On the
             night of a slip, its own card is the one card instead (its Go to bed is the same act): bringing the person back is the job then. */
          <>
            {pick.card.k === 'slip-day' ? (
              <MomentCard pick={{ ...pick, more: null }} snap={snap} tk={tk} now={now} />
            ) : nightTile ? (
              <StopCard
                m={
                  bedAt
                    ? { eb: 'Good night', h: 'Phone in bed at ' + fmtClock(bedAt), btn: 'Open', go: 'wind' }
                    : { eb: 'Night · open now', h: 'Phone to bed', btn: 'Start', go: 'wind' }
                }
                t={nightTile}
              />
            ) : null}
            <LogLink />
            {/* Screen Time not working: said here too, since the night is when it matters (WP2) */}
            <PullTroubleStrip />
            <WaitingPlan snap={snap} tk={tk} now={now} />
          </>
        ) : (
          dayPage
        )}
      </Screen>
      {askFeel && !celebrating ? <DayFeelPop onDone={() => setAskFeel(false)} /> : null}
      {touring && g ? (
        <FirstTour
          steps={tourSteps({ lessonDone: lessonsDone(snap.days).size > 0, lessonId: lessonsDone(snap.days).size ? null : (lessonStop(snap.days, st, tk).L?.id ?? null) })}
          level={Math.max(1, g.level.n)}
          onEnd={() => {
            sos.setMem(markTourDone);
            setTouring(false);
          }}
          scrollBy={(dy) => {
            const y = Math.max(0, scrolled.current + dy);
            if (Math.abs(y - scrolled.current) < 2) return false;
            scroll.current?.scrollTo({ y, animated: true });
            return true;
          }}
        />
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  line: { fontFamily: font.bodyMedium, fontSize: 13, lineHeight: 18, paddingHorizontal: 16 },
  done: { gap: 2, paddingHorizontal: 4 },
  doneH: { fontFamily: font.display, fontSize: 22, lineHeight: 27 },
});
