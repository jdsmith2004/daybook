/* After signing out, the sign-in page sends people back here. On a phone the app usually catches that first; if this page
   does show, it simply goes back. */
import { router } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

import { T } from '@/components/ui';
import { useTheme } from '@/lib/theme';

export default function SignedOut() {
  const c = useTheme();
  useEffect(() => {
    const id = setTimeout(() => (router.canGoBack() ? router.back() : router.replace('/')), 300);
    return () => clearTimeout(id);
  }, []);
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.bg }}>
      <T tone="muted">Signed out.</T>
    </View>
  );
}
