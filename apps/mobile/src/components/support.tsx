/* The tip jar in the app (support.ts decides when, and holds the words): the small Support button at the top of Today, the
   one ask on Today, and the quiet row on More. The link opens in the browser; nothing in Daybook changes after a tip,
   because money never opens anything. On Android there is no tip link: Google Play asks that tips to the developer go
   through its own billing, so TIP_URL is empty there and every tip spot stays hidden. */
import { SUPPORT_URL, tipAnswered, TIP_WORDS } from '@daybook/core';
import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { LinkCard } from '@/components/link-card';
import { Button, Card, Icon, T } from '@/components/ui';
import { useStore } from '@/lib/store';
import { font, useTheme } from '@/lib/theme';

/** the tip link on this platform, or '' where none is offered */
export const TIP_URL = Platform.OS === 'android' ? '' : SUPPORT_URL;
export const openTip = () => (TIP_URL ? Linking.openURL(TIP_URL).catch(() => undefined) : undefined);

export function TipCard() {
  const c = useTheme();
  const { snap, tk, apply } = useStore();
  const done = () => apply(tipAnswered(snap.settings!, tk));
  return (
    <Card style={{ backgroundColor: c.sunSoft, borderColor: c.sunSoft }}>
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
        <Icon name="heart" size={22} color={c.sunText} />
        <T v="label" style={{ flex: 1 }}>
          {TIP_WORDS.h}
        </T>
      </View>
      <T v="small">{TIP_WORDS.p}</T>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <Button
          label={TIP_WORDS.go}
          onPress={() => {
            done();
            openTip();
          }}
        />
        <Button kind="ghost" label={TIP_WORDS.no} onPress={done} />
      </View>
      <T v="small" tone="muted">
        {TIP_WORDS.foot}
      </T>
    </Card>
  );
}

/** the quiet row on More; nothing when no link is set */
export function TipRow() {
  if (!TIP_URL) return null;
  return <LinkCard icon="heart" tone="sun" title={TIP_WORDS.row.title} sub={TIP_WORDS.row.sub} onPress={openTip} />;
}

/** the small Support button beside Today's title */
export function TipTop() {
  const c = useTheme();
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel="Support Daybook. Daybook is free; this opens a page to leave a tip."
      onPress={openTip}
      hitSlop={6}
      style={({ pressed }) => [s.top, { backgroundColor: c.sun, opacity: pressed ? 0.85 : 1 }]}>
      <Icon name="heart" size={16} color={c.onSun} />
      <Text style={[s.topT, { color: c.onSun }]}>{TIP_WORDS.top}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 36, paddingHorizontal: 12, borderRadius: 999, marginTop: 2 },
  topT: { fontFamily: font.bodyBold, fontSize: 14 },
});
