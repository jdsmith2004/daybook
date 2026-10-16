/* More: where I am, my plan, how Daybook works, milestones, help, and settings. Ported from the legacy viewMore. */
import { badgeDone, gameCompute, phaseLabel } from '@daybook/core';
import { router } from 'expo-router';
import { View } from 'react-native';

import { HelpFoot } from '@/components/help-foot';
import { LinkCard } from '@/components/link-card';
import { Screen } from '@/components/screen';
import { T } from '@/components/ui';
import { useStore } from '@/lib/store';

export default function More() {
  const { snap, tk } = useStore();
  const st = snap.settings;
  if (!st) return <Screen title="More">{null}</Screen>;
  const g = gameCompute(snap.days, st, snap.reviews, tk);
  const got = g.badges.filter((b) => badgeDone(b, st)).length;
  return (
    <Screen eyebrow="My Daybook" title="More" sub={<T tone="muted">Your plan, your progress, help, and settings.</T>}>
      <View style={{ gap: 6 }}>
        <T v="eyebrow" tone="muted">
          Where I am
        </T>
        <LinkCard icon="flag" title={phaseLabel(tk, st)} sub="What this means, and how to change it" onPress={() => router.push('/mode')} />
      </View>
      <View style={{ gap: 8 }}>
        <LinkCard icon="shield" title="My plan" sub="Why I am doing this, my plans, and my lists" onPress={() => router.push('/plan')} />
        <LinkCard icon="sparkle" title="How Daybook works" sub="What it is for, a quick self-check, and your goals. Walk through it any time." onPress={() => router.push('/setup')} />
        <LinkCard icon="trophy" title="Milestones" sub={`Level ${g.level.n} · ${g.level.name} · ${got} of ${g.badges.length} badges`} onPress={() => router.push('/miles')} />
        <LinkCard icon="life" title="Get help" sub="People, therapy, groups, and phone setup" onPress={() => router.push('/help')} />
        <LinkCard icon="sliders" title="Settings" sub="My routine, schedule, counting days, look, and backup" onPress={() => router.push('/settings')} />
      </View>
      <HelpFoot />
    </Screen>
  );
}
