/* The tabs on iOS and Android: the system's own tab bar. The web version is app-tabs.web.tsx. */
import { NativeTabs } from 'expo-router/native-tabs';

import { useTheme } from '@/lib/theme';

export default function AppTabs() {
  const c = useTheme();
  return (
    <NativeTabs backgroundColor={c.surface} tintColor={c.accent} labelStyle={{ selected: { color: c.accentText } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Today</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'sun.max', selected: 'sun.max.fill' }} md="wb_sunny" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'gearshape', selected: 'gearshape.fill' }} md="settings" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
