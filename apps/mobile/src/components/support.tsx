/* The one tip ask on Today, and the quiet link after it (support.ts decides when, and holds the words). The link opens in
   the browser; nothing in Daybook changes after a tip, because money never opens anything. */
import { SUPPORT_URL, tipAnswered, TIP_WORDS } from '@daybook/core';
import { Linking, View } from 'react-native';

import { LinkCard } from '@/components/link-card';
import { Button, Card, Icon, T } from '@/components/ui';
import { useStore } from '@/lib/store';
import { useTheme } from '@/lib/theme';

export const openTip = () => Linking.openURL(SUPPORT_URL).catch(() => undefined);

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
  if (!SUPPORT_URL) return null;
  return <LinkCard icon="heart" tone="sun" title={TIP_WORDS.row.title} sub={TIP_WORDS.row.sub} onPress={openTip} />;
}
