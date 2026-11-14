import { Fredoka_600SemiBold } from '@expo-google-fonts/fredoka/600SemiBold';
import { Fredoka_700Bold } from '@expo-google-fonts/fredoka/700Bold';
import { InstrumentSans_400Regular } from '@expo-google-fonts/instrument-sans/400Regular';
import { InstrumentSans_500Medium } from '@expo-google-fonts/instrument-sans/500Medium';
import { InstrumentSans_600SemiBold } from '@expo-google-fonts/instrument-sans/600SemiBold';
import { InstrumentSans_700Bold } from '@expo-google-fonts/instrument-sans/700Bold';
import { Newsreader_400Regular } from '@expo-google-fonts/newsreader/400Regular';
import {
  nudgeAt,
  nudgeCounts,
  nudgeDue,
  nudgeKeep,
  nudgeKey,
  nudgeLearn,
  nudgePlan,
  nudgeTapKind,
  trailLater,
  trailLeave,
  trailNoteKeep,
  trailNotes,
  WIDGET_PTS,
  widgetTold,
  tellNight,
  addDays,
  nudgeExt,
  nudgeQuietLeft,
} from '@daybook/core';
import { useFonts } from 'expo-font';
import {
  DarkTheme,
  DefaultTheme,
  router,
  Stack,
  ThemeProvider,
  useNavigationContainerRef,
  usePathname,
  useSegments,
  type ErrorBoundaryProps,
} from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { CelebrateHost } from '@/components/celebrate';
import { LockGate } from '@/components/lock';
import { Oops } from '@/components/oops';
import { Toast } from '@/components/toast';
import { useWatchOpens } from '@/lib/day-open';
import { forgetDrafts } from '@/lib/drafts';
import { useFlameWidget } from '@/lib/flame-widget';
import { keepRootState, SHEETS, type NavState } from '@/lib/nav';
import { NoteCopy } from '@/lib/notes';
import { setNudgeLog, useNudgeLog, useReminderPrefs } from '@/lib/prefs';
import { listenForTaps, onPermission, remindersAllowed, remindersOffered, scheduleNudges, scheduleTrail } from '@/lib/reminders';
import { SosProvider, useSos } from '@/lib/sos';
import '@/lib/setup-keep';
import { HealthKeeper } from '@/lib/health';
import { notesCame, track, trackNudge, useKeepEvents, useTrackScreens } from '@/lib/events';
import { DayEvents, FlameEvents } from '@/lib/events-day';
import { NightPackKeeper } from '@/lib/night-pack';
import { PullKeeper } from '@/lib/pull';
import { count, countOnce, useKeepPulse } from '@/lib/pulse';
import { SyncProvider, useAccount } from '@/lib/sync';
import { StoreProvider, useStore } from '@/lib/store';
import { useTheme } from '@/lib/theme';
import { useWhatsNew } from '@/lib/whats-new';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

/* the phone's notifications (core nudges.ts): each time the app opens, what was delivered is judged (helped or missed) and the
   plan for today and tomorrow, with the come-back notes, is made again; the phone's schedule changes only when the plan does.
   A tap on one opens its screen. All of it stays on this phone, except the anonymous counts (core pulse.ts): each kind
   delivered, opened from, and what it was for done that day, and whether reminders are allowed. */
function Reminders() {
  const prefs = useReminderPrefs();
  const log = useNudgeLog();
  const { ready, snap, tk } = useStore();
  /* without an account, the lessons after the first LEARN_FREE wait behind one, so they are not reminded of */
  const account = useAccount();
  const live = useRef(snap);
  live.current = snap;
  const nlog = useRef(log);
  nlog.current = log;
  const [openAt, setOpenAt] = useState(() => Date.now());
  /* whether the phone lets Daybook notify: the come-back notes are for anyone it does */
  const [allowed, setAllowed] = useState(false);
  useEffect(() => {
    if (!ready || !log.ready || !remindersOffered) return;
    const opened = async () => {
      const t = Date.now();
      const ok = await remindersAllowed().catch(() => false);
      const s = live.current;
      if (ok) countOnce('rem_on');
      const l0 = nlog.current;
      nudgeCounts({ ...l0, opens: [...l0.opens, t] }, s.days, s.settings, s.reviews, t, ok).forEach((k) => {
        count(k);
        trackNudge(k);
      });
      /* each note delivered since the last open, with the hour it came (the counts above say only how many) */
      notesCame(nudgeDue(l0, s.settings, t, ok));
      setNudgeLog((l) => nudgeLearn({ ...l, opens: [...l.opens, t] }, s.days, s.settings, s.reviews, t, ok));
      setAllowed(ok);
      setOpenAt(t);
    };
    opened();
    const sub = AppState.addEventListener('change', (a) => a === 'active' && opened());
    return () => sub.remove();
  }, [ready, log.ready]);
  const plan = useMemo(
    () => (ready && log.ready ? nudgePlan(snap.days, snap.settings, snap.reviews, prefs, log, tk, openAt, allowed, account) : null),
    [ready, snap.days, snap.settings, snap.reviews, prefs, log, tk, openAt, allowed, account],
  );
  const key = plan ? nudgeKey(plan) : null;
  useEffect(() => {
    if (!plan || !remindersOffered) return;
    scheduleNudges(plan).catch(() => undefined);
    setNudgeLog((l) => nudgeKeep(l, plan, Date.now()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const sos = useSos();
  useEffect(
    () =>
      listenForTaps(
        (id) => {
          const k = nudgeTapKind(id);
          if (k) {
            count('nt_' + k + '_tap');
            trackNudge('nt_' + k + '_tap', nudgeAt(nlog.current, id));
          }
          setNudgeLog((l) => ({ ...l, taps: [...l.taps, id] }));
        },
        /* a trail note's quiet buttons: the next note an hour on, or none until morning */
        (a) => {
          if (a === 'later') sos.setMem((m) => trailLater(m, Date.now()));
          if (a === 'off') sos.setMem((m) => trailLeave(m, Date.now()));
        },
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  /* turned on from the ask on Today or Settings: the come-back notes join the plan at once */
  useEffect(() => onPermission(() => remindersAllowed().then(setAllowed, () => undefined)), []);
  return null;
}

/* the flame on the Home Screen and the Lock Screen (lib/flame-widget.ios.ts): kept as it burns, and the first time it is on a screen,
   its points (core WIDGET_PTS), once and for good */
function FlameWidgetKeeper() {
  const { ready, snap, tk, now, update, say } = useStore();
  /* while SOS is open, the Live Activity is the ride (core livePlan) */
  const sos = useSos();
  return useFlameWidget(
    snap,
    tk,
    ready,
    now,
    () => {
      if (snap.settings?.widget) return;
      update((s) => (s.settings && !s.settings.widget ? { ...s, settings: { ...s.settings, widget: tk } } : s));
      say('Your flame is on your screen. +' + WIDGET_PTS + ' points');
    },
    /* a morning answered on the Home Screen (Free of it, core widgetTold): the widget keeps the morning's day, so its night is the
       day before; written through tellNight as on the morning page and Days, once, and only while that morning is still unanswered */
    (told) =>
      update((s) => {
        const st = s.settings;
        if (!st) return s;
        let days = s.days;
        for (const t of told)
          if (widgetTold(days, st, [{ told: 'free', toldK: t.k, toldAt: t.at }], tk).length) days = tellNight(days, st, addDays(t.k, -1), 'free', tk, t.at);
        return days === s.days ? s : { ...s, days };
      }),
    sos.ur?.t0 ?? null,
  );
}

/* The trail's notes while a battle goes on (core trailNotes): two at a time, an hour apart, never at night, resting after a
   slip. They are made again when the stretch changes (the trail opened or left), the log changes, a note is answered, or
   the app opens, so two left unanswered are the last until the person comes back. */
function TrailNotes() {
  const { ready, snap } = useStore();
  const sos = useSos();
  const [openAt, setOpenAt] = useState(() => Date.now());
  useEffect(() => {
    const sub = AppState.addEventListener('change', (a) => a === 'active' && setOpenAt(Date.now()));
    return () => sub.remove();
  }, []);
  /* the trail's notes learn whether they are opened (core nudgeQuietLeft): paused, none; on the one more try, only the first */
  const log = useNudgeLog();
  const left = log.ready ? nudgeQuietLeft(log, 'trail', openAt) : 0;
  /* planned from a time that moves once a minute, never Date.now() itself: the notes' times come from it, and saving them changes
     sos.mem, so a time that moved on every render planned new notes, saved them and rendered again without end (the owner hit it
     on November 13, 2026: "Something broke on this screen" after Walk it through, with dozens of notes scheduled) */
  const minute = Math.floor(Date.now() / 60000) * 60000;
  const notes = useMemo(
    () => (ready ? trailNotes(sos.mem, snap.days, Math.max(openAt, minute - 60000)).slice(0, left) : []),
    [ready, sos.mem, snap.days, openAt, minute, left],
  );
  const key = notes.map((n) => n.at).join(',');
  useEffect(() => {
    if (!ready || !remindersOffered) return;
    scheduleTrail(notes).catch(() => undefined);
    sos.setMem((m) => trailNoteKeep(m, notes, Date.now()));
    setNudgeLog((l) =>
      nudgeExt(
        l,
        'trail',
        notes.map((n) => ({ id: 'trail@' + n.at, at: n.at })),
        Date.now(),
      ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, ready]);
  return null;
}

/* lets close() see which screens are open, so closing a full-screen moment returns to the page it was opened from */
function NavKeeper() {
  const ref = useNavigationContainerRef();
  useEffect(() => keepRootState(() => (ref.isReady() ? (ref.getRootState() as unknown as NavState) : undefined)), [ref]);
  return null;
}

/* Before setup, nothing else in the app works as normal (the owner, November 2, 2026): the tabs wait behind the welcome page
   ((tabs)/_layout.tsx), and any other page, reached by a link, a notification or a typed address, goes back to it. SOS stays open, with
   what it opens (its tools, Talk it through, I slipped into Rekindle, the bedtime tool's good night), because care is never locked
   (CLAUDE.md); so do the setup itself, signing in, saying what would help, and the privacy page. When SOS closes, the setup comes back. */
const OPEN_BEFORE_SETUP = new Set([
  '(tabs)',
  'setup',
  'sos',
  'tool',
  'talk',
  'trail',
  'log',
  'night',
  'account',
  'feedback',
  'privacy',
  'shots',
  'import',
  '+not-found',
]);
function SetupGate() {
  const { ready, snap } = useStore();
  const top = useSegments()[0] as string | undefined;
  const shut = ready && !snap.settings && !!top && !OPEN_BEFORE_SETUP.has(top);
  useEffect(() => {
    if (shut) router.replace('/');
  }, [shut, top]);
  return null;
}

/* What's new after an update: once, on an open where nothing else comes first (lib/whats-new.ts) */
function WhatsNewGate() {
  useWhatsNew();
  return null;
}

/* on the web, the page behind the app and the browser's bars take the app's background, so Safari does not frame a dark app in white */
function WebChrome({ bg }: { bg: string }) {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    document.documentElement.style.backgroundColor = bg;
    document.body.style.backgroundColor = bg;
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'theme-color');
      document.head.appendChild(meta);
    }
    /* +html.tsx draws one per scheme; once the app has chosen, every one takes the app's color */
    document.querySelectorAll('meta[name="theme-color"]').forEach((m) => {
      m.setAttribute('content', bg);
      m.removeAttribute('media');
    });
  }, [bg]);
  return null;
}

/* a screen that broke shows this instead of a blank page, wherever it happened (SOS included): the log is safe on the
   phone, and Try again draws the screen again */
export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  useEffect(() => track('error', { err: 'render' }), []);
  return (
    <Oops
      title="Something broke on this screen"
      lines={[
        'It was Daybook, not you. Your log is safe on this phone.',
        'Try again, and if it happens again, closing and reopening Daybook usually clears it.',
      ]}
      onRetry={() => retry().catch(() => undefined)}
      subject="Daybook: a screen broke"
    />
  );
}

function Shell() {
  const c = useTheme();
  const { ready, snap, loadFailed, retryLoad } = useStore();
  useKeepPulse(ready, snap.days);
  useKeepEvents(ready);
  useTrackScreens(usePathname());
  /* the day's first open, for "How are you feeling today?" on Today (lib/day-open.ts) */
  useWatchOpens(ready, snap.settings?.rollover ?? 4, !!snap.settings);
  const [fonts, fontError] = useFonts({
    Fredoka_600SemiBold,
    Fredoka_700Bold,
    InstrumentSans_400Regular,
    InstrumentSans_500Medium,
    InstrumentSans_600SemiBold,
    InstrumentSans_700Bold,
    Newsreader_400Regular,
  });
  const go = ready && (fonts || !!fontError);
  useEffect(() => {
    if (go) SplashScreen.hideAsync().catch(() => undefined);
  }, [go]);
  const base = c.scheme === 'dark' ? DarkTheme : DefaultTheme;
  const nav = { ...base, colors: { ...base.colors, background: c.bg, card: c.surface, text: c.ink, primary: c.accent, border: c.line } };
  if (!go) return null;
  if (loadFailed)
    return (
      <Oops
        title="Your log could not be opened"
        lines={[
          'The phone did not let Daybook read its storage just now. Nothing was changed, and nothing will be saved until it opens.',
          'Try again. If it still does not open, close Daybook fully and reopen it.',
        ]}
        onRetry={retryLoad}
        subject="Daybook: my log does not open"
      />
    );
  return (
    <ThemeProvider value={nav}>
      <StatusBar style={c.scheme === 'dark' ? 'light' : 'dark'} />
      <WebChrome bg={c.bg} />
      <Reminders />
      <DayEvents />
      <FlameEvents />
      <FlameWidgetKeeper />
      <TrailNotes />
      <NoteCopy />
      <NavKeeper />
      <HealthKeeper rollover={snap.settings?.rollover ?? 4} />
      <PullKeeper />
      <NightPackKeeper />
      <SetupGate />
      <LockGate>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }}>
          <Stack.Screen name="(tabs)" />
          {/* the full-screen moments: SOS and its tools, logging, Rekindle, the sunrise check, the evening check-in, going deeper, the wind-down, good night, a lesson, an idea, what is new */}
          {[
            'sos',
            'tool/[id]',
            'log',
            'checkin',
            'talk',
            'trail',
            'review',
            'wind',
            'night',
            'lesson/[id]',
            'lwrite/[n]',
            'setup',
            'graduated',
            'week',
            'back',
            'whats-new',
            'feedback',
            'future',
            'pause',
            'morning',
            'unlock',
            'day-list',
            'ignite',
            'becoming',
            'import/mithras',
          ].map((name) => (
            <Stack.Screen key={name} name={name} options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom', gestureEnabled: false }} />
          ))}
          {/* writing in the journal fades in over its tab, and moves itself (components/journal-page.tsx) */}
          <Stack.Screen name="write" options={{ presentation: 'transparentModal', animation: 'none', contentStyle: { backgroundColor: 'transparent' } }} />
          {/* the sheets: one thing, over everything */}
          {SHEETS.map((name) => (
            <Stack.Screen key={name} name={name} options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          ))}
        </Stack>
        <CelebrateHost />
        <WhatsNewGate />
        <Toast />
      </LockGate>
    </ThemeProvider>
  );
}

/* sync sits inside SOS, so removing the log from a device (when signing out) also forgets that device's SOS memory and drafts */
function WithSync({ children }: { children: ReactNode }) {
  const sos = useSos();
  return (
    <SyncProvider
      onErased={async () => {
        await sos.forget();
        await forgetDrafts();
      }}>
      {children}
    </SyncProvider>
  );
}

export default function RootLayout() {
  return (
    /* the gesture handler needs its root view around the app for the tools that pan (Name the feeling) */
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StoreProvider>
        <SosProvider>
          <WithSync>
            <Shell />
          </WithSync>
        </SosProvider>
      </StoreProvider>
    </GestureHandlerRootView>
  );
}
