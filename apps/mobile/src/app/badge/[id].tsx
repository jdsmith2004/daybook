/* One badge: what it is for, and how close it is. Ported from the legacy sheetBadge. */
import { badgeDone, gameCompute } from '@daybook/core';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { Medal } from '@/components/medal';
import { closeSheet, SheetFrame } from '@/components/sheet';
import { Button, T } from '@/components/ui';
import { Dock } from '@/components/scene';
import { useStore } from '@/lib/store';

export default function BadgeSheet() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { snap, tk } = useStore();
  const st = snap.settings;
  if (!st) return <Redirect href="/" />;
  const b = gameCompute(snap.days, st, snap.reviews, tk).badges.find((x) => x.id === id);
  if (!b)
    return (
      <SheetFrame title="Badge">
        <Dock>
          <Button label="Done" onPress={closeSheet} />
        </Dock>
      </SheetFrame>
    );
  const done = badgeDone(b, st);
  return (
    <SheetFrame title={b.name}>
      <View style={{ alignItems: 'center', gap: 12 }}>
        <Medal id={b.id} icon={b.icon} tone={b.tone} size={160} earned={done} />
        <T style={{ textAlign: 'center', fontSize: 17, lineHeight: 22 }}>{b.desc}</T>
        <T tone={done ? 'mintText' : 'muted'}>{done ? '✓ Earned. Badges are never taken away.' : `Progress: ${b.now} of ${b.goal}`}</T>
      </View>
      <Dock>
        <Button label="Done" onPress={closeSheet} />
      </Dock>
    </SheetFrame>
  );
}
