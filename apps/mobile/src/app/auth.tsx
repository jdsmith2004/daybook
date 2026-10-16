/* Where the sign-in page sends people back. On the web this page opens in the small sign-in window: lib/auth.ts hands the
   answer to the app and closes it. On a phone the app usually catches the answer before this page shows; if it does show,
   it simply goes back. */
import * as WebBrowser from 'expo-web-browser';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';

import { T } from '@/components/ui';
import { useTheme } from '@/lib/theme';

WebBrowser.maybeCompleteAuthSession();

export default function AuthReturn() {
  const c = useTheme();
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.opener) return;
    const id = setTimeout(() => (router.canGoBack() ? router.back() : router.replace('/')), 300);
    return () => clearTimeout(id);
  }, []);
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: c.bg }}>
      <ActivityIndicator color={c.accent} />
      <T tone="muted">Signing in…</T>
    </View>
  );
}
