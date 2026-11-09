/* The anonymous counts and feedback, outside their sheets (app/counts.tsx, app/feedback.tsx, app/stats.tsx). There is no
   ask (the owner, October 28 and November 4, 2026): the counts are sent without one.
   - PulseRows, on More: the counts (on or off) and Ideas and feedback; Stats too, once this device has opened it as the owner */
import { router } from 'expo-router';

import { SetRow } from '@/components/settings-ui';
import { pulseOffered, usePulse, useStatsSeen } from '@/lib/pulse';

export function PulseRows() {
  const s = usePulse();
  const stats = useStatsSeen();
  if (!pulseOffered) return null;
  return (
    <>
      <SetRow icon="chat" tone="accent" label="Ideas and feedback" onPress={() => router.push('/feedback')} />
      <SetRow icon="chart" tone="accent" label="Anonymous data" value={s?.on === false ? 'Off' : 'On'} onPress={() => router.push('/counts')} />
      {stats ? <SetRow icon="chart" tone="accent" label="Stats" value="Owner" onPress={() => router.push('/stats')} /> : null}
    </>
  );
}
