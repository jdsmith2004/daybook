/* Settings: the page that was the More tab, opened from the gear at the top right of every tab (components/settings-button.tsx;
   the owner, November 13, 2026, when the Journal took the tab). The flame's door to Milestones, then where everything else lives, as
   plain grouped lists, and every setting. A link that names a part ("s-count") opens that part's page instead, in place of this one. */
import { badgeDone, gameCompute, phaseLabel, shownBadges, SITE_PAGES } from '@daybook/core';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { Linking, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { FlameSky } from '@/components/flame-sky';
import { HelpFoot } from '@/components/help-foot';
import { skyInk } from '@/components/hero';
import { SetGroup, SetRow } from '@/components/settings-ui';
import { PulseRows } from '@/components/pulse';
import { PreviewRows } from '@/components/preview-rows';
import { Screen } from '@/components/screen';
import { partOf, SettingsSections } from '@/components/settings-sections';
import { TipRow } from '@/components/support';
import { Icon, T } from '@/components/ui';
import { useCountFocus } from '@/lib/pulse';
import { useScripture } from '@/lib/scripture';
import { buzz } from '@/lib/feel';
import { useStore } from '@/lib/store';

export default function Settings() {
  /* the count keeps its old name, so the days before and after the move read as one line */
  useCountFocus('tab_more');
  const params = useLocalSearchParams<{ open?: string }>();
  const part = partOf(params.open);
  const { snap, tk } = useStore();
  const lib = useScripture();
  const { width } = useWindowDimensions();
  const st = snap.settings;
  /* before setup the tabs wait behind the welcome page ((tabs)/_layout.tsx) */
  if (!st) return null;
  if (part) return <Redirect href={{ pathname: '/settings/[part]', params: { part } }} />;
  const g = gameCompute(snap.days, st, snap.reviews, tk);
  const shown = shownBadges(g.badges, st);
  const got = shown.filter((b) => badgeDone(b, st)).length;
  const ink = skyInk(g.level.n);
  /* the whole flame stands in the door, logs and all: never cut by its edge (the owner, November 9, 2026) */
  const DOOR = 164;
  const FLAME = Math.min(164, Math.round(width * 0.42));
  return (
    <Screen title="Settings" back>
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
            <PreviewRows />
            <SetGroup>
              <SetRow icon="shield" label="My plan" onPress={() => router.push('/plan')} />
              <SetRow icon="flag" label="Where I am" value={phaseLabel(tk, st)} onPress={() => router.push('/mode')} />
              {lib.on ? <SetRow icon="book" label="Scriptures" onPress={() => router.push('/scripture')} /> : null}
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
        foot={
          <>
            {/* a test feature, kept quiet and low on purpose (the owner, November 14, 2026; app/love.tsx) */}
            <SetGroup>
              <SetRow icon="heart" tone="coral" label="Real love" onPress={() => router.push('/love')} />
            </SetGroup>
            <HelpFoot />
          </>
        }
      />
    </Screen>
  );
}

const s = StyleSheet.create({
  door: { borderRadius: 20, overflow: 'hidden' },
  doorWords: { position: 'absolute', left: 16, top: 16, bottom: 16, width: '56%', gap: 2 },
  doorHead: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
