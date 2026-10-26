/* The tab bar, the same on iOS, Android and the web: Today, Journal, a raised SOS button in the middle (it opens SOS, it is not a
   page), Learn, and More. Like the legacy tab bar. It also notes which tab is showing, so a page's Back can name it. */
import { router, usePathname } from 'expo-router';
import { Tabs, TabList, TabSlot, TabTrigger, type TabTriggerSlotProps } from 'expo-router/ui';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View, type PressableProps } from 'react-native';
import { Text } from '@/components/text';

/** tab labels barely grow with the phone's text size, like the iOS tab bar (a long press is not needed: each tab has an icon) */
const TAB_MAX = 1.15;
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/ui';
import { buzz } from '@/lib/feel';
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
    <View {...rest} style={[s.bar, { backgroundColor: c.surface, borderTopColor: c.cardEdge, shadowColor: c.accent, paddingBottom: 6 + inset.bottom }]}>
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
      style={({ pressed }) => [s.tab, isFocused && { backgroundColor: c.accentSoft }, pressed && { opacity: 0.7 }]}>
      <Icon name={icon} size={26} color={isFocused ? c.accentText : c.muted} />
      <Text maxFontSizeMultiplier={TAB_MAX} style={[s.label, { color: isFocused ? c.accentText : c.muted }]}>
        {children}
      </Text>
    </Pressable>
  );
}

function SosTab() {
  const c = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Help with an urge. Start here."
      onPress={() => {
        buzz('tap');
        router.push('/sos');
      }}
      style={s.tab}>
      {({ pressed }) => (
        <>
          <View
            style={[
              s.sos,
              {
                backgroundColor: c.sos,
                borderColor: c.surface,
                shadowColor: c.sosDeep,
                shadowOffset: { width: 0, height: pressed ? 2 : 5 },
                transform: [{ translateY: pressed ? 3 : 0 }],
              },
            ]}>
            <Icon name="life" size={29} color={c.sosInk} />
          </View>
          <Text maxFontSizeMultiplier={TAB_MAX} style={[s.label, { color: c.coralText, fontFamily: font.bodyBold, marginTop: 34 }]}>
            SOS
          </Text>
        </>
      )}
    </Pressable>
  );
}

const s = StyleSheet.create({
  bar: {
    borderTopWidth: 2,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 6,
    paddingHorizontal: 8,
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 10,
  },
  inner: { flexDirection: 'row', gap: 4, alignSelf: 'center', width: '100%', maxWidth: MAX_WIDTH },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, minHeight: 56, paddingVertical: 6, borderRadius: 16 },
  label: { fontFamily: font.bodySemi, fontSize: 11.5 },
  sos: {
    /* raised enough that its shadow ends above the SOS label, also on a phone with a Home button (no room under the bar) */
    position: 'absolute',
    top: -30,
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  },
});
