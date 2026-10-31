/* The tab bar, the same on iOS, Android and the web: Today, Journal, a raised SOS button in the middle (it opens SOS, it is not a
   page), Learn, and More. Like the legacy tab bar. It also notes which tab is showing, so a page's Back can name it. */
import { LinearGradient } from 'expo-linear-gradient';
import { usePathname } from 'expo-router';
import { Tabs, TabList, TabSlot, TabTrigger, type TabTriggerSlotProps } from 'expo-router/ui';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View, type PressableProps } from 'react-native';
import { Text } from '@/components/text';

/** tab labels barely grow with the phone's text size, like the iOS tab bar (a long press is not needed: each tab has an icon) */
const TAB_MAX = 1.15;
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SosButton } from '@/components/sos-button';
import { Icon } from '@/components/ui';
import { keepTab } from '@/lib/nav';
import { font, MAX_WIDTH, useTheme } from '@/lib/theme';

export default function AppTabs() {
  const path = usePathname();
  useEffect(() => keepTab(path), [path]);
  return (
    <Tabs>
      <TabSlot style={{ flex: 1 }} />
      <TabList asChild>
        <Bar>
          <TabTrigger name="index" href="/" asChild>
            <TabButton icon="sun">Today</TabButton>
          </TabTrigger>
          <TabTrigger name="pattern" href="/pattern" asChild>
            <TabButton icon="calendar">Pattern</TabButton>
          </TabTrigger>
          <SosTab />
          <TabTrigger name="learn" href="/learn" asChild>
            <TabButton icon="book">Learn</TabButton>
          </TabTrigger>
          <TabTrigger name="more" href="/more" asChild>
            <TabButton icon="more">More</TabButton>
          </TabTrigger>
        </Bar>
      </TabList>
    </Tabs>
  );
}

function Bar({ children, ...rest }: { children?: React.ReactNode }) {
  const c = useTheme();
  const inset = useSafeAreaInsets();
  return (
    <View {...rest} style={[s.bar, { backgroundColor: c.surface, borderTopColor: c.line, paddingBottom: 4 + inset.bottom }]}>
      <LinearGradient colors={[c.bg + '00', c.bg]} style={s.fade} pointerEvents="none" />
      <View style={s.inner}>{children}</View>
    </View>
  );
}

function TabButton({ children, isFocused, icon, ...props }: TabTriggerSlotProps & { icon: string }) {
  const c = useTheme();
  return (
    <Pressable
      {...(props as PressableProps)}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      style={({ pressed }) => [s.tab, pressed && { opacity: 0.7 }]}>
      <Icon name={icon} size={24} color={isFocused ? c.accentText : c.muted} />
      <Text maxFontSizeMultiplier={TAB_MAX} style={[s.label, { color: isFocused ? c.accentText : c.muted }]}>
        {children}
      </Text>
    </Pressable>
  );
}

function SosTab() {
  return (
    <View style={s.tab}>
      <View style={s.sos}>
        <SosButton />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  bar: {
    borderTopWidth: 1,
    paddingTop: 4,
    paddingHorizontal: 8,
  },
  inner: { flexDirection: 'row', gap: 4, alignSelf: 'center', width: '100%', maxWidth: MAX_WIDTH },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, minHeight: 52, paddingVertical: 4 },
  label: { fontFamily: font.bodySemi, fontSize: 12 },
  /* raised, half out of the bar, so its lip stays inside the bar on a phone with a Home button too */
  sos: { position: 'absolute', top: -32 },
  /* what scrolls fades out just above the bar, so nothing is cut in half at its edge */
  fade: { position: 'absolute', left: 0, right: 0, top: -29, height: 28 },
});
