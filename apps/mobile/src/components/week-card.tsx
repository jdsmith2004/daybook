/* A week after the start, once: the way into the first week's look back (app/week.tsx, core week.ts) */
import { firstWeekDue, type Snapshot } from '@daybook/core';
import { router } from 'expo-router';
import { View } from 'react-native';

import { Button, Card, Icon, T } from '@/components/ui';
import { useTheme } from '@/lib/theme';

export function WeekCard({ snap, tk }: { snap: Snapshot; tk: string }) {
  const c = useTheme();
  if (!firstWeekDue(snap.settings!, tk)) return null;
  return (
    <Card style={{ backgroundColor: c.mintSoft, borderColor: c.mintSoft }}>
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
        <Icon name="calendar" size={22} color={c.mintText} />
        <T v="label" style={{ flex: 1 }}>
          Your first week is done
        </T>
      </View>
      <T v="small">A one-minute look back at what you did with it.</T>
      <Button label="See my first week" onPress={() => router.push('/week')} />
    </Card>
  );
}
