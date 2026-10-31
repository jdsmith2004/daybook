/* The tab bar on iPhone: Apple's own, the four pages as native tabs, with the round SOS floating over its middle. SOS is not a page,
   so it is not a tab; it stays in plain reach on every tab and never minimizes. Android and the web keep app-tabs.tsx. */
import { usePathname } from 'expo-router';
import { NativeTabs } from 'expo-router/native-tabs';
import { useEffect } from 'react';
import { Appearance, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SosButton } from '@/components/sos-button';
import { keepTab } from '@/lib/nav';
import { useThemePref } from '@/lib/prefs';
import { useTheme } from '@/lib/theme';

export default function AppTabs() {
  const c = useTheme();
  const inset = useSafeAreaInsets();
  const path = usePathname();
  useEffect(() => keepTab(path), [path]);
  /* the system draws this bar, so the system has to know the look chosen in Settings */
  const pref = useThemePref();
  useEffect(() => Appearance.setColorScheme(pref === 'auto' ? 'unspecified' : pref), [pref]);
  return (
    <View style={{ flex: 1 }}>
      <NativeTabs tintColor={c.accentText} minimizeBehavior="never">
        <NativeTabs.Trigger disableAutomaticContentInsets name="index">
          <NativeTabs.Trigger.Icon sf={{ default: 'sun.max', selected: 'sun.max.fill' }} />
          <NativeTabs.Trigger.Label>Today</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger disableAutomaticContentInsets name="pattern">
          <NativeTabs.Trigger.Icon sf={{ default: 'calendar', selected: 'calendar' }} />
          <NativeTabs.Trigger.Label>Pattern</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger disableAutomaticContentInsets name="learn">
          <NativeTabs.Trigger.Icon sf={{ default: 'book', selected: 'book.fill' }} />
          <NativeTabs.Trigger.Label>Learn</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger disableAutomaticContentInsets name="more">
          <NativeTabs.Trigger.Icon sf={{ default: 'ellipsis', selected: 'ellipsis' }} />
          <NativeTabs.Trigger.Label>More</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      </NativeTabs>
      <View pointerEvents="box-none" style={[s.sos, { bottom: inset.bottom + 18 }]}>
        <SosButton />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  sos: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
});
