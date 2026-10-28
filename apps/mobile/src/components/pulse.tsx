/* The anonymous counts and feedback, outside their sheets (app/counts.tsx, app/feedback.tsx, app/stats.tsx). There is no
   ask on Today (the owner, October 28, 2026): the basic counts are sent without one.
   - PulseRows, on More: the counts (basic, all or off) and Send feedback; Stats too, once this device has opened it as the owner */
import { router } from 'expo-router';

import { LinkCard } from '@/components/link-card';
import { pulseOffered, usePulse, useStatsSeen } from '@/lib/pulse';

export function PulseRows() {
  const s = usePulse();
  const stats = useStatsSeen();
  if (!pulseOffered) return null;
  const sub =
    s?.on === true
      ? 'All on. A few counts once a day, never your words or your log.'
      : s?.on === false
        ? 'Off. Nothing is sent.'
        : 'Basic. Only the days Daybook was opened and how far setup got.';
  return (
    <>
      <LinkCard icon="chart" tone="sky" title="Anonymous counts" sub={sub} onPress={() => router.push('/counts')} />
      <LinkCard
        icon="chat"
        tone="sky"
        title="Send feedback"
        sub="What helps, what does not, what is missing. Anonymous."
        onPress={() => router.push('/feedback')}
      />
      {stats ? (
        <LinkCard icon="chart" tone="violet" title="Stats" sub="The owner's view: the counts and the feedback" onPress={() => router.push('/stats')} />
      ) : null}
    </>
  );
}
