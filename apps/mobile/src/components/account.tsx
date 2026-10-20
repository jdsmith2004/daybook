/* The account card on Today, at a good moment (accounts.ts decides when). It opens the account sheet (app/account.tsx). */
import { accountLater, accountWords, diffDays, type AcctWhy } from '@daybook/core';
import { router } from 'expo-router';
import { View } from 'react-native';

import { STORAGE_LINE } from '@/components/home-screen';
import { LinkText } from '@/components/today';
import { Button, Card, Icon, T } from '@/components/ui';
import { useStore } from '@/lib/store';
import { useSync } from '@/lib/sync';
import { useTheme } from '@/lib/theme';

export function AccountCard({ why, locked }: { why: AcctWhy; locked: number }) {
  const c = useTheme();
  const sync = useSync();
  const { snap, tk, apply } = useStore();
  const w = accountWords(why, locked, diffDays(tk, snap.settings!.start));
  return (
    <Card style={{ backgroundColor: c.skySoft, borderColor: c.skySoft }}>
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
        <Icon name="shield" size={22} color={c.skyText} />
        <T v="label" style={{ flex: 1 }}>
          {w.h}
        </T>
      </View>
      <T v="small">{w.p}</T>
      {STORAGE_LINE ? <T v="small">{STORAGE_LINE}</T> : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <Button label="Create an account or sign in" onPress={() => sync.signInNow()} />
        <Button kind="ghost" label="Not now" onPress={() => apply(accountLater(snap.settings!, tk))} />
      </View>
      <T v="small" tone="muted">
        Free, private to you, and you can delete it any time. <LinkText label="What is kept" onPress={() => router.push('/privacy')} />
      </T>
    </Card>
  );
}
