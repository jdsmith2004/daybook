/* The account asks: the card on Today at a good moment (accounts.ts decides when), and the box where a lesson waits for an
   account. Both open the same sign-in page, where "Create an account" sits next to "Sign in". */
import { accountLater, accountWords, type AcctWhy } from '@daybook/core';
import { router } from 'expo-router';
import { View } from 'react-native';

import { LinkText } from '@/components/today';
import { Button, Card, Icon, T } from '@/components/ui';
import { useStore } from '@/lib/store';
import { useSync } from '@/lib/sync';
import { useTheme } from '@/lib/theme';

export function AccountCard({ why, locked }: { why: AcctWhy; locked: number }) {
  const c = useTheme();
  const sync = useSync();
  const { snap, tk, apply } = useStore();
  const w = accountWords(why, locked);
  return (
    <Card style={{ backgroundColor: c.skySoft, borderColor: c.skySoft }}>
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
        <Icon name="shield" size={22} color={c.skyText} />
        <T v="label" style={{ flex: 1 }}>
          {w.h}
        </T>
      </View>
      <T v="small">{w.p}</T>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <Button label="Create an account or sign in" onPress={sync.signInNow} />
        <Button kind="ghost" label="Not now" onPress={() => apply(accountLater(snap.settings!, tk))} />
      </View>
      <T v="small" tone="muted">
        Free, private to you, and you can delete it any time. <LinkText label="What is kept" onPress={() => router.push('/privacy')} />
      </T>
    </Card>
  );
}

/** where a lesson waits for an account */
export function Unlock({ locked, children }: { locked: number; children?: React.ReactNode }) {
  const c = useTheme();
  const sync = useSync();
  return (
    <View style={{ gap: 10, padding: 16, borderRadius: 20, backgroundColor: c.skySoft }}>
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
        <Icon name="lock" size={20} color={c.skyText} />
        <T v="label" style={{ flex: 1 }}>
          This lesson opens with a free account
        </T>
      </View>
      <T v="small">
        The first lessons are open to everyone. A free account opens all {locked} more, keeps a copy of your progress safe, and syncs it to the web.
      </T>
      <Button label="Create an account or sign in" onPress={sync.signInNow} />
      {children}
      <T v="small" tone="muted">
        SOS, your plan and logging always work, with or without an account. <LinkText label="What is kept" onPress={() => router.push('/privacy')} />
      </T>
    </View>
  );
}
