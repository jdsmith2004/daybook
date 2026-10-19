/* More: where I am, my plan, milestones, help, how Daybook works, and every setting, on one page. Ported from the legacy
   viewMore and viewSettings. */
import { badgeDone, gameCompute, phaseLabel, shownBadges, SITE_PAGES } from '@daybook/core';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef } from 'react';
import { Linking, View, type ScrollViewInstance } from 'react-native';

import { HelpFoot } from '@/components/help-foot';
import { LinkCard } from '@/components/link-card';
import { Screen } from '@/components/screen';
import { SettingsSections } from '@/components/settings-sections';
import { TipRow } from '@/components/support';
import { T } from '@/components/ui';
import { SetupFirst } from '@/components/welcome';
import { useStore } from '@/lib/store';

export default function More() {
  const { snap, tk } = useStore();
  const params = useLocalSearchParams<{ open?: string }>();
  const scroll = useRef<ScrollViewInstance>(null);
  const st = snap.settings;
  if (!st) return <SetupFirst title="More" line="Your plan, your badges and settings live here once setup has built your plan." />;
  const g = gameCompute(snap.days, st, snap.reviews, tk);
  const shown = shownBadges(g.badges, st);
  const got = shown.filter((b) => badgeDone(b, st)).length;
  return (
    <Screen eyebrow="My Daybook" title="More" sub={<T tone="muted">Your plan, your progress, help, and settings.</T>} scrollRef={scroll}>
      <View style={{ gap: 8 }}>
        <LinkCard icon="shield" title="My plan" sub="Why I am doing this, my plans, my lists, and what I have learned" onPress={() => router.push('/plan')} />
        <LinkCard
          icon="trophy"
          title="Milestones"
          sub={`Level ${g.level.n} · ${g.level.name} · ${got} of ${shown.length} badges`}
          onPress={() => router.push('/miles')}
        />
        <LinkCard icon="life" title="Get help" sub="People, therapy, groups, and phone setup" onPress={() => router.push('/help')} />
        <LinkCard icon="flag" title={phaseLabel(tk, st)} sub="Where I am: what this means, and how to change it" onPress={() => router.push('/mode')} />
        <LinkCard
          icon="sparkle"
          title="How Daybook works"
          sub="What it is for, a quick self-check, and your goals. Walk through it any time."
          onPress={() => router.push('/setup')}
        />
        <LinkCard
          icon="ask"
          title="Help and support"
          sub="Common questions, and how to write to the person who builds Daybook"
          onPress={() => Linking.openURL(SITE_PAGES.support).catch(() => undefined)}
        />
        <TipRow />
      </View>
      <HelpFoot />
      <View style={{ gap: 2, marginTop: 6 }}>
        <T v="eyebrow" tone="muted">
          Settings
        </T>
        <T v="small" tone="muted">
          Make Daybook yours. Changes save as you go.
        </T>
      </View>
      <SettingsSections open={params.open} onOpenLayout={(y) => setTimeout(() => scroll.current?.scrollTo({ y: Math.max(0, y - 8), animated: true }), 200)} />
    </Screen>
  );
}
