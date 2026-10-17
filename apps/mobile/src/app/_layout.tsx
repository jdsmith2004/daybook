import { Fredoka_600SemiBold } from '@expo-google-fonts/fredoka/600SemiBold';
import { Fredoka_700Bold } from '@expo-google-fonts/fredoka/700Bold';
import { InstrumentSans_400Regular } from '@expo-google-fonts/instrument-sans/400Regular';
import { InstrumentSans_500Medium } from '@expo-google-fonts/instrument-sans/500Medium';
import { InstrumentSans_600SemiBold } from '@expo-google-fonts/instrument-sans/600SemiBold';
import { InstrumentSans_700Bold } from '@expo-google-fonts/instrument-sans/700Bold';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, useNavigationContainerRef } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, type ReactNode } from 'react';
import { Platform } from 'react-native';

import { CelebrateHost } from '@/components/celebrate';
import { LockGate } from '@/components/lock';
import { Toast } from '@/components/toast';
import { forgetDrafts } from '@/lib/drafts';
import { keepRootState, type NavState } from '@/lib/nav';
import { useReminderPrefs } from '@/lib/prefs';
import { listenForTaps, scheduleReminders } from '@/lib/reminders';
import { SosProvider, useSos } from '@/lib/sos';
import { SyncProvider } from '@/lib/sync';
import { StoreProvider, useStore } from '@/lib/store';
import { useTheme } from '@/lib/theme';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

/* the phone's reminders follow the choices in Settings and the screens-off time; a tap on one opens Today */
function Reminders() {
  const prefs = useReminderPrefs();
  const so = useStore().settings?.screensOff ?? null;
  useEffect(() => {
    scheduleReminders(prefs, so).catch(() => undefined);
  }, [prefs, so]);
  useEffect(() => listenForTaps(), []);
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
  const { ready } = useStore();
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
          {/* the full-screen moments: SOS and its tools, logging, Rekindle, the sunrise check, going deeper, good night, a lesson */}
          {['sos', 'tool/[id]', 'log', 'sunrise', 'deeper', 'night', 'lesson/[id]', 'lwrite/[n]', 'setup', 'graduated'].map((name) => (
            <Stack.Screen key={name} name={name} options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom', gestureEnabled: false }} />
          ))}
          {/* the sheets: one thing, over everything */}
          {['points', 'mode', 'growth', 'day/[date]', 'entry', 'badge/[id]', 'privacy'].map((name) => (
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
    <StoreProvider>
      <SosProvider>
        <WithSync>
          <Shell />
        </WithSync>
      </SosProvider>
    </StoreProvider>
  );
}
