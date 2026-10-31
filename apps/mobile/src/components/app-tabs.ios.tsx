/* The tab bar on iPhone: Apple's own, the four pages as native tabs, and SOS in the separate glass circle iOS gives the search tab. SOS is
   not a page: that tab can never be selected (disabled), and its press opens SOS. It stays in plain reach on every tab and the bar never
   minimizes. Android and the web keep app-tabs.tsx. */
import { router, usePathname } from 'expo-router';
import { NativeTabs } from 'expo-router/native-tabs';
import { useEffect } from 'react';
import { Appearance } from 'react-native';

import { buzz } from '@/lib/feel';
import { keepTab } from '@/lib/nav';
import { useThemePref } from '@/lib/prefs';
import { useTheme } from '@/lib/theme';

export default function AppTabs() {
  const c = useTheme();
  const path = usePathname();
  useEffect(() => keepTab(path), [path]);
  /* the system draws this bar, so the system has to know the look chosen in Settings */
  const pref = useThemePref();
  useEffect(() => Appearance.setColorScheme(pref === 'auto' ? 'unspecified' : pref), [pref]);
  return (
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
      <NativeTabs.Trigger
        disableAutomaticContentInsets
        disabled
        name="sos-door"
        role="search"
        listeners={{
          tabPress: () => {
            buzz('tap');
            router.push('/sos');
          },
        }}>
        {/* the word in the app's own letters and SOS's warm color, drawn as it is (assets/images/sos-mark.png) */}
        <NativeTabs.Trigger.Icon src={require('../../assets/images/sos-mark.png')} renderingMode="original" />
        <NativeTabs.Trigger.Label>SOS</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
