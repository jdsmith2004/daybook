/* Good night after SOS "Go to bed" (components/tools/scene.tsx), which has already put the phone away: the flame falls asleep,
   with the plan for a loud night (the one picked there, or slow breathing) and SOS, and, when today's check-in is still
   open, one tap to do it first (three quick numbers, then Goodnight). The moment itself is in components/goodnight.tsx, the
   same one the check-in and the wind-down end with. */
import { rhythm } from '@daybook/core';
import { router, useLocalSearchParams } from 'expo-router';

import { GoingToBed, NightRow } from '@/components/goodnight';
import { useStore } from '@/lib/store';

export default function Night() {
  const { at, gain, plan } = useLocalSearchParams<{ at?: string; gain?: string; plan?: string }>();
  const { snap, tk, now } = useStore();
  const st = snap.settings;
  const ci = st ? rhythm(snap.days, st, tk, now).stops.find((x) => x.k === 'evening' && !x.done) : null;
  return (
    <GoingToBed
      bed={{ at: at || '', gain: Number(gain) || 0, msg: '' }}
      plan={plan || undefined}
      extra={ci ? <NightRow icon="pencil" title="One minute first?" sub="Today's check-in is still open." onPress={() => router.replace('/checkin')} /> : null}
    />
  );
}
