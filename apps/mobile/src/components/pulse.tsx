/* The anonymous counts and feedback, outside their sheets (app/counts.tsx, app/feedback.tsx, app/stats.tsx). There is no
   ask (the owner, October 28 and November 4, 2026): the counts are sent without one.
   - PulseRows, on More: the counts (on or off) and Ideas and feedback; Stats too, once this device has opened it as the owner */
import { router } from 'expo-router';

import { LinkCard } from '@/components/link-card';
import { pulseOffered, usePulse, useStatsSeen } from '@/lib/pulse';

export function PulseRows() {
  const s = usePulse();
  const stats = useStatsSeen();
  if (!pulseOffered) return null;
  const sub = s?.on === false ? 'Off. Nothing is sent.' : 'On. Never your words or your log.';
  return (
    <>
      <LinkCard icon="chart" title="Anonymous counts" sub={sub} onPress={() => router.push('/counts')} />
      <LinkCard
        icon="chat"
        title="Ideas and feedback"
        sub="Any idea or change, straight to the person who builds Daybook"
        onPress={() => router.push('/feedback')}
      />
      {stats ? <LinkCard icon="chart" title="Stats" sub="The owner's view" onPress={() => router.push('/stats')} /> : null}
    </>
  );
}
