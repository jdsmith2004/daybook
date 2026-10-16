import { Fredoka_600SemiBold } from '@expo-google-fonts/fredoka/600SemiBold';
import { Fredoka_700Bold } from '@expo-google-fonts/fredoka/700Bold';
import { InstrumentSans_400Regular } from '@expo-google-fonts/instrument-sans/400Regular';
import { InstrumentSans_500Medium } from '@expo-google-fonts/instrument-sans/500Medium';
import { InstrumentSans_600SemiBold } from '@expo-google-fonts/instrument-sans/600SemiBold';
import { InstrumentSans_700Bold } from '@expo-google-fonts/instrument-sans/700Bold';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { Toast } from '@/components/toast';
import { SosProvider } from '@/lib/sos';
import { StoreProvider, useStore } from '@/lib/store';
import { useTheme } from '@/lib/theme';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

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
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }}>
        <Stack.Screen name="(tabs)" />
        {/* the full-screen moments: SOS and its tools, logging, Rekindle, the sunrise check, going deeper, good night, a lesson */}
        {['sos', 'tool/[id]', 'log', 'sunrise', 'deeper', 'night', 'lesson/[id]', 'lwrite/[n]', 'setup'].map((name) => (
          <Stack.Screen key={name} name={name} options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom', gestureEnabled: false }} />
        ))}
        {/* the sheets: one thing, over everything */}
        {['points', 'mode', 'growth', 'day/[date]', 'entry', 'badge/[id]'].map((name) => (
          <Stack.Screen key={name} name={name} options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        ))}
      </Stack>
      <Toast />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <StoreProvider>
      <SosProvider>
        <Shell />
      </SosProvider>
    </StoreProvider>
  );
}
