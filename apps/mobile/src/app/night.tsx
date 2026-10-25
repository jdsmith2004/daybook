/* Good night after SOS "Go to bed" (components/tools/scene.tsx), which has already put the phone away: the going-to-bed
   moment, tonight's plan for a loud night with SOS, and, when today is not logged yet, one tap to log it (Bedtime, with
   the phone already away). The moment itself is in components/goodnight.tsx, the same one Bedtime ends with. */
import { routineOn } from '@daybook/core';
import { router, useLocalSearchParams } from 'expo-router';

import { GoingToBed, NightRow } from '@/components/goodnight';
import { useStore } from '@/lib/store';

export default function Night() {
  const { at, gain } = useLocalSearchParams<{ at?: string; gain?: string }>();
  const { snap, tk } = useStore();
  const st = snap.settings;
  const day = snap.days[tk];
  const open = !!st && routineOn(st, day?.p, 'checkin') && !day?.checkin?.done;
  return (
    <GoingToBed
      bed={{ at: at || '', gain: Number(gain) || 0, msg: '' }}
      extra={open ? <NightRow icon="pencil" title="Log today first?" sub="Three taps, then rest." onPress={() => router.replace('/bedtime')} /> : null}
    />
  );
}
