import { Fredoka_600SemiBold } from '@expo-google-fonts/fredoka/600SemiBold';
import { Fredoka_700Bold } from '@expo-google-fonts/fredoka/700Bold';
import { InstrumentSans_400Regular } from '@expo-google-fonts/instrument-sans/400Regular';
import { InstrumentSans_500Medium } from '@expo-google-fonts/instrument-sans/500Medium';
import { InstrumentSans_600SemiBold } from '@expo-google-fonts/instrument-sans/600SemiBold';
import { InstrumentSans_700Bold } from '@expo-google-fonts/instrument-sans/700Bold';
import { nudgeKeep, nudgeKey, nudgeLearn, nudgePlan } from '@daybook/core';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, useNavigationContainerRef } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { CelebrateHost } from '@/components/celebrate';
import { LockGate } from '@/components/lock';
import { Toast } from '@/components/toast';
import { forgetDrafts } from '@/lib/drafts';
import { keepRootState, SHEETS, type NavState } from '@/lib/nav';
import { setNudgeLog, useNudgeLog, useReminderPrefs } from '@/lib/prefs';
import { listenForTaps, onPermission, remindersAllowed, remindersOffered, scheduleNudges } from '@/lib/reminders';
import { SosProvider, useSos } from '@/lib/sos';
import '@/lib/setup-keep';
import { useKeepPulse } from '@/lib/pulse';
import { SyncProvider, useAccount } from '@/lib/sync';
import { StoreProvider, useStore } from '@/lib/store';
import { useTheme } from '@/lib/theme';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

/* the phone's notifications (core nudges.ts): each time the app opens, what was delivered is judged (helped or missed) and the
   plan for today and tomorrow, with the come-back notes, is made again; the phone's schedule changes only when the plan does.
   A tap on one opens its screen. All of it stays on this phone. */
function Reminders() {
  const prefs = useReminderPrefs();
  const log = useNudgeLog();
  const { ready, snap, tk } = useStore();
  /* without an account, the lessons after the first three wait behind one, so they are not reminded of */
  const account = useAccount();
  const live = useRef(snap);
  live.current = snap;
  const [openAt, setOpenAt] = useState(() => Date.now());
  /* whether the phone lets Daybook notify: the come-back notes are for anyone it does */
  const [allowed, setAllowed] = useState(false);
  useEffect(() => {
    if (!ready || !log.ready || !remindersOffered) return;
    const opened = async () => {
      const t = Date.now();
      const ok = await remindersAllowed().catch(() => false);
      const s = live.current;
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
  useEffect(() => listenForTaps((id) => setNudgeLog((l) => ({ ...l, taps: [...l.taps, id] }))), []);
  /* turned on from the ask on Today or Settings: the come-back notes join the plan at once */
  useEffect(() => onPermission(() => remindersAllowed().then(setAllowed, () => undefined)), []);
  return null;
}

/* lets close() see which screens are open, so closing a full-screen moment returns to the page it was opened from */
function NavKeeper() {
  const ref = useNavigationContainerRef();
  useEffect(() => keepRootState(() => (ref.isReady() ? (ref.getRootState() as unknown as NavState) : undefined)), [ref]);
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
    meta.setAttribute('content', bg);
  }, [bg]);
  return null;
}

function Shell() {
  const c = useTheme();
  const { ready, snap } = useStore();
  useKeepPulse(ready, snap.days);
  const [fonts, fontError] = useFonts({
    Fredoka_600SemiBold,
    Fredoka_700Bold,
    InstrumentSans_400Regular,
    InstrumentSans_500Medium,
    InstrumentSans_600SemiBold,
    InstrumentSans_700Bold,
  });
  const go = ready && (fonts || !!fontError);
  useEffect(() => {
    if (go) SplashScreen.hideAsync().catch(() => undefined);
  }, [go]);
  const base = c.scheme === 'dark' ? DarkTheme : DefaultTheme;
  const nav = { ...base, colors: { ...base.colors, background: c.bg, card: c.surface, text: c.ink, primary: c.accent, border: c.line } };
  if (!go) return null;
  return (
    <ThemeProvider value={nav}>
      <StatusBar style={c.scheme === 'dark' ? 'light' : 'dark'} />
      <WebChrome bg={c.bg} />
      <Reminders />
      <NavKeeper />
      <LockGate>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }}>
          <Stack.Screen name="(tabs)" />
          {/* the full-screen moments: SOS and its tools, logging, Rekindle, the evening check-in, going deeper, the wind-down, good night, a lesson */}
          {[
            'sos',
            'tool/[id]',
            'log',
            'checkin',
            'talk',
            'review',
            'deeper',
            'wind',
            'night',
            'lesson/[id]',
            'lwrite/[n]',
            'setup',
            'graduated',
            'week',
            'back',
          ].map((name) => (
            <Stack.Screen key={name} name={name} options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom', gestureEnabled: false }} />
          ))}
          {/* the sheets: one thing, over everything */}
          {SHEETS.map((name) => (
            <Stack.Screen key={name} name={name} options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          ))}
        </Stack>
        <CelebrateHost />
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
