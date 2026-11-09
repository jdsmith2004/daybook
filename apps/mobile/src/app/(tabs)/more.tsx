/* More: the flame's door to Milestones, then where everything else lives, as plain grouped lists, and every setting.
   Ported from the legacy viewMore and viewSettings. */
import { badgeDone, gameCompute, phaseLabel, shownBadges, SITE_PAGES } from '@daybook/core';
import { router } from 'expo-router';
import { Linking, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { FlameSky } from '@/components/flame-sky';
import { HelpFoot } from '@/components/help-foot';
import { skyInk } from '@/components/hero';
import { SetGroup, SetRow } from '@/components/settings-ui';
import { PulseRows } from '@/components/pulse';
import { Screen } from '@/components/screen';
import { SettingsSections } from '@/components/settings-sections';
import { TipRow } from '@/components/support';
import { Icon, T } from '@/components/ui';
import { useCountFocus } from '@/lib/pulse';
import { buzz } from '@/lib/feel';
import { useStore } from '@/lib/store';

export default function More() {
  useCountFocus('tab_more');
  const { snap, tk } = useStore();
  const { width } = useWindowDimensions();
  const st = snap.settings;
  /* before setup the tabs wait behind the welcome page ((tabs)/_layout.tsx) */
  if (!st) return null;
  const g = gameCompute(snap.days, st, snap.reviews, tk);
  const shown = shownBadges(g.badges, st);
  const got = shown.filter((b) => badgeDone(b, st)).length;
  const ink = skyInk(g.level.n);
  /* the whole flame stands in the door, logs and all: never cut by its edge (the owner, November 9, 2026) */
  const DOOR = 164;
  const FLAME = Math.min(164, Math.round(width * 0.42));
  return (
    <Screen title="More">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Milestones. Level ${g.level.n}, ${g.level.name}. ${got} of ${shown.length} badges.`}
        onPress={() => {
          buzz('tap');
          router.push('/miles');
        }}
        style={({ pressed }) => [s.door, { opacity: pressed ? 0.9 : 1 }]}>
        <FlameSky level={g.level.n} height={DOOR} flame={FLAME} foot={4} right={-8} tappable={false}>
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
      <SettingsSections
        lead={
          <>
            <SetGroup>
              <SetRow icon="pencil" label="Journal" onPress={() => router.push('/journal')} />
              <SetRow icon="shield" label="My plan" onPress={() => router.push('/plan')} />
              <SetRow icon="flag" label="Where I am" value={phaseLabel(tk, st)} onPress={() => router.push('/mode')} />
            </SetGroup>
            <SetGroup>
              <TipRow />
            </SetGroup>
            <SetGroup head="Help">
              <SetRow icon="life" label="Get help" onPress={() => router.push('/help')} />
              <SetRow icon="sparkle" label="How Daybook works" onPress={() => router.push('/setup')} />
              <SetRow icon="ask" label="Questions and support" onPress={() => Linking.openURL(SITE_PAGES.support).catch(() => undefined)} />
              <PulseRows />
            </SetGroup>
          </>
        }
        foot={<HelpFoot />}
      />
    </Screen>
  );
}

const s = StyleSheet.create({
  door: { borderRadius: 20, overflow: 'hidden' },
  doorWords: { position: 'absolute', left: 16, top: 16, bottom: 16, width: '56%', gap: 2 },
  doorHead: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
