/* The opt-in counts and feedback, outside their sheets (app/counts.tsx, app/feedback.tsx, app/stats.tsx):
   - PulseCard, Today's one ask (core pulseAsk): Yes / No thanks, and a way to see exactly what is sent
   - PulseRows, on More: the counts (on or off) and Send feedback; Stats too, once this device has opened it as the owner */
import { PULSE_WORDS } from '@daybook/core';
import { router } from 'expo-router';
import { View } from 'react-native';

import { Link } from '@/components/choices';
import { LinkCard } from '@/components/link-card';
import { Button, Card, Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { answerPulse, pulseOffered, usePulse, useStatsSeen } from '@/lib/pulse';
import { useStore } from '@/lib/store';
import { useTheme } from '@/lib/theme';
import { WORDS } from '@/lib/words';

export function PulseCard() {
  const c = useTheme();
  const { say } = useStore();
  const answer = (on: boolean) => {
    buzz('tap');
    answerPulse(on);
    say(on ? WORDS.countsOn : WORDS.countsOff);
  };
  return (
    <Card style={{ backgroundColor: c.skySoft, borderColor: c.skySoft }}>
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
        <Icon name="chart" size={22} color={c.skyText} />
        <T v="label" style={{ flex: 1 }}>
          {PULSE_WORDS.h}
        </T>
      </View>
      <T v="small">{PULSE_WORDS.p}</T>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <Button label={PULSE_WORDS.yes} onPress={() => answer(true)} />
        <Button kind="ghost" label={PULSE_WORDS.no} onPress={() => answer(false)} />
      </View>
      <View style={{ alignItems: 'flex-start', marginLeft: -6 }}>
        <Link label={PULSE_WORDS.see} onPress={() => router.push('/counts')} />
      </View>
    </Card>
  );
}

export function PulseRows() {
  const s = usePulse();
  const stats = useStatsSeen();
  if (!pulseOffered) return null;
  const on = s?.on === true;
  return (
    <>
      <LinkCard
        icon="chart"
        tone="sky"
        title="Anonymous counts"
        sub={on ? 'On. A few counts once a day, never your words or your log.' : 'Off. Help show what works, with no words, log or name.'}
        onPress={() => router.push('/counts')}
      />
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
