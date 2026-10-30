/* More: the flame's door to Milestones, then where everything else lives, as plain grouped lists, and every setting.
   Ported from the legacy viewMore and viewSettings. */
import { badgeDone, gameCompute, phaseLabel, shownBadges, SITE_PAGES } from '@daybook/core';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef } from 'react';
import { Linking, Pressable, StyleSheet, useWindowDimensions, View, type ScrollViewInstance } from 'react-native';

import { FlameSky } from '@/components/flame-sky';
import { HelpFoot } from '@/components/help-foot';
import { skyInk } from '@/components/hero';
import { LinkCard, Rows } from '@/components/link-card';
import { PulseRows } from '@/components/pulse';
import { Screen } from '@/components/screen';
import { SettingsSections } from '@/components/settings-sections';
import { TipRow } from '@/components/support';
import { Icon, T } from '@/components/ui';
import { SetupFirst } from '@/components/welcome';
import { buzz } from '@/lib/feel';
import { useStore } from '@/lib/store';

export default function More() {
  const { snap, tk } = useStore();
  const params = useLocalSearchParams<{ open?: string }>();
  const scroll = useRef<ScrollViewInstance>(null);
  const { width } = useWindowDimensions();
  const st = snap.settings;
  if (!st) return <SetupFirst title="More" line="Your plan, your badges and settings live here once setup has built your plan." />;
  const g = gameCompute(snap.days, st, snap.reviews, tk);
  const shown = shownBadges(g.badges, st);
  const got = shown.filter((b) => badgeDone(b, st)).length;
  const ink = skyInk(g.level.n);
  const DOOR = 148;
  const FLAME = Math.min(236, Math.round(width * 0.6));
  return (
    <Screen title="More" scrollRef={scroll}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Milestones. Level ${g.level.n}, ${g.level.name}. ${got} of ${shown.length} badges.`}
        onPress={() => {
          buzz('tap');
          router.push('/miles');
        }}
        style={({ pressed }) => [s.door, { opacity: pressed ? 0.9 : 1 }]}>
        <FlameSky level={g.level.n} height={DOOR} flame={FLAME} foot={(DOOR - FLAME) / 2} right={-16} tappable={false}>
          <View style={s.doorWords} pointerEvents="none">
            <View style={s.doorHead}>
              <T v="h2" style={{ color: ink.ink }}>
                Milestones
              </T>
              <Icon name="next" size={16} color={ink.ink} />
            </View>
            <T v="label" style={{ color: ink.ink }}>
              Level {g.level.n} · {g.level.name}
            </T>
            <T v="small" style={{ color: ink.soft }}>
              {got} of {shown.length} badges
            </T>
          </View>
        </FlameSky>
      </Pressable>
      <Rows>
        <LinkCard icon="pencil" title="Journal" sub="How you feel. Pull Today down to open it too." onPress={() => router.push('/journal')} />
        <LinkCard icon="shield" title="My plan" sub="My reasons, plans, lists and what I learned" onPress={() => router.push('/plan')} />
        <LinkCard icon="flag" title={phaseLabel(tk, st)} sub="Where I am, and how to change it" onPress={() => router.push('/mode')} />
      </Rows>
      <Rows>
        <LinkCard icon="life" title="Get help" sub="People, therapy, groups, phone setup" onPress={() => router.push('/help')} />
        <LinkCard icon="sparkle" title="How Daybook works" sub="What it is for, a self-check, your goals" onPress={() => router.push('/setup')} />
        <LinkCard
          icon="ask"
          title="Help and support"
          sub="Common questions, and a person to write to"
          onPress={() => Linking.openURL(SITE_PAGES.support).catch(() => undefined)}
        />
      </Rows>
      <Rows>
        <TipRow />
        <PulseRows />
      </Rows>
      <HelpFoot />
      <T v="h2" accessibilityRole="header" style={{ marginTop: 8, marginBottom: -8 }}>
        Settings
      </T>
      <SettingsSections open={params.open} onOpenLayout={(y) => setTimeout(() => scroll.current?.scrollTo({ y: Math.max(0, y - 8), animated: true }), 200)} />
    </Screen>
  );
}

const s = StyleSheet.create({
  door: { borderRadius: 20, overflow: 'hidden' },
  doorWords: { position: 'absolute', left: 16, top: 16, bottom: 16, width: '56%', gap: 2 },
  doorHead: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
