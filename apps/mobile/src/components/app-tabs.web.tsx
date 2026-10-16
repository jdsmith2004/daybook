/* The tabs in a browser: a bar along the bottom, like the phone apps. */
import { Tabs, TabList, TabSlot, TabTrigger, type TabTriggerSlotProps } from 'expo-router/ui';
import { Pressable, StyleSheet, View, type PressableProps } from 'react-native';

import { Icon, T } from '@/components/ui';
import { MAX_WIDTH, useTheme } from '@/lib/theme';

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <Bar>
          <TabTrigger name="index" href="/" asChild>
            <TabButton icon="sun">Today</TabButton>
          </TabTrigger>
          <TabTrigger name="tools" href="/tools" asChild>
            <TabButton icon="life">Tools</TabButton>
          </TabTrigger>
          <TabTrigger name="settings" href="/settings" asChild>
            <TabButton icon="sliders">Settings</TabButton>
          </TabTrigger>
        </Bar>
      </TabList>
    </Tabs>
  );
}

function Bar({ children, ...rest }: { children?: React.ReactNode }) {
  const c = useTheme();
  return (
    <View {...rest} style={[s.bar, { backgroundColor: c.surface, borderTopColor: c.line }]}>
      <View style={s.inner}>{children}</View>
    </View>
  );
}

function TabButton({ children, isFocused, icon, ...props }: TabTriggerSlotProps & { icon: string }) {
  const c = useTheme();
  return (
    <Pressable {...(props as PressableProps)} accessibilityRole="tab" accessibilityState={{ selected: isFocused }} style={({ pressed }) => [s.tab, pressed && { opacity: 0.7 }]}>
      <View style={[s.pill, isFocused && { backgroundColor: c.accentSoft }]}>
        <Icon name={icon} size={22} color={isFocused ? c.accentText : c.muted} />
      </View>
      <T v="small" tone={isFocused ? 'accentText' : 'muted'} style={{ fontWeight: '600' }}>
        {children}
      </T>
    </Pressable>
  );
}

const s = StyleSheet.create({
  bar: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopWidth: 1, paddingBottom: 6 },
  inner: { flexDirection: 'row', justifyContent: 'space-around', alignSelf: 'center', width: '100%', maxWidth: MAX_WIDTH },
  tab: { alignItems: 'center', gap: 2, paddingTop: 8, minWidth: 88 },
  pill: { paddingHorizontal: 16, paddingVertical: 4, borderRadius: 999 },
});
