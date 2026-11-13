/* The tab bar on Android and the web (the iPhone uses Apple's own, app-tabs.ios.tsx): Today, Pattern, a raised SOS button in the middle (it opens SOS, it is not a
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
import { useSpot, type SpotKey } from '@/lib/tour';
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
            <TabButton icon="book" spot="learn">
              Learn
            </TabButton>
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

function TabButton({ children, isFocused, icon, spot, ...props }: TabTriggerSlotProps & { icon: string; spot?: SpotKey }) {
  const c = useTheme();
  /* the first tour points at Learn (lib/tour.ts) */
  const ref = useSpot(spot ?? 'learn', !!spot);
  return (
    <Pressable
      {...(props as PressableProps)}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      style={({ pressed }) => [s.tab, pressed && { opacity: 0.7 }]}>
      <View ref={spot ? ref : undefined} collapsable={false} style={s.tabIn}>
        <Icon name={icon} size={24} color={isFocused ? c.accentText : c.muted} />
        <Text maxFontSizeMultiplier={TAB_MAX} style={[s.label, { color: isFocused ? c.accentText : c.muted }]}>
          {children}
        </Text>
      </View>
    </Pressable>
  );
}

function SosTab() {
  const ref = useSpot('sos');
  return (
    <View style={s.tab}>
      <View style={s.sos} ref={ref} collapsable={false}>
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
  tabIn: { alignItems: 'center', gap: 3 },
  label: { fontFamily: font.bodySemi, fontSize: 12 },
  /* raised, half out of the bar, so its lip stays inside the bar on a phone with a Home button too */
  sos: { position: 'absolute', top: -30 },
  /* what scrolls fades out just above the bar, so nothing is cut in half at its edge */
  fade: { position: 'absolute', left: 0, right: 0, top: -29, height: 28 },
});
