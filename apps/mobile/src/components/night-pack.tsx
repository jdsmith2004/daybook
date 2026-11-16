/* The night pack's page (Settings, The night pack; core night-pack.ts). Four automations the person makes once in Shortcuts, each
   a light: the person's own flame, lit when it is set or Daybook has seen it run, grey until then. On a phone that goes grey at
   night the flame is the one colour left, so the lights are flames. How to make each one is walked one step a page
   (app/nightpack.tsx); Daybook cannot make an automation itself (Apple keeps them the person's own). */
import { fmtClock, gameCompute, PACK_KINDS, packLit, packLitCount, packWords, tonightOf, type PackKind } from '@daybook/core';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Flame } from '@/components/flame';
import { SetGroup, SetRow, SetSwitch } from '@/components/settings-ui';
import { Icon, T } from '@/components/ui';
import { packSay, usePack } from '@/lib/night-pack';
import { useStore } from '@/lib/store';
import { useTheme } from '@/lib/theme';

const SHORT: Record<PackKind, string> = { grey: 'Grey', wait: 'Wait', bed: 'Good night', wake: 'Morning' };

const ranAt = (ms: number) => {
  const d = new Date(ms);
  return (
    'Ran ' +
    d.toLocaleDateString(undefined, { weekday: 'long' }) +
    ', ' +
    fmtClock(String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'))
  );
};

export function NightPackBody() {
  const { snap, tk } = useStore();
  const pack = usePack();
  const c = useTheme();
  const st = snap.settings;
  if (!st) return null;
  const level = Math.max(1, gameCompute(snap.days, st, snap.reviews, tk).level.n);
  const at = fmtClock(tonightOf(snap.days, st, tk).at);
  const lit = packLitCount(pack);
  const left = PACK_KINDS.length - lit;
  return (
    <>
      <View style={s.lights} accessibilityRole="summary">
        {PACK_KINDS.map((k) => {
          const lit = packLit(pack, k);
          return (
            <View key={k} style={s.light} accessible accessibilityLabel={SHORT[k] + (lit ? ', on' : ', not set yet')}>
              {lit ? (
                <Flame level={level} size={60} alive label="" />
              ) : (
                <View style={s.unlit}>
                  <Icon name="flame" size={40} color={c.muted} />
                </View>
              )}
              <T v="small" tone={lit ? undefined : 'muted'}>
                {SHORT[k]}
              </T>
            </View>
          );
        })}
      </View>
      {/* the steps are walked one a page (app/nightpack.tsx), never listed here: this page is the lights and a way in */}
      <SetGroup foot="Made once in Shortcuts, about two minutes each. Nothing on the lock screen says what they are for.">
        {left ? (
          <SetRow
            label={lit ? 'Set up the rest (' + left + ' left)' : 'Set them up, one step at a time'}
            act="accent"
            onPress={() => router.push('/nightpack')}
          />
        ) : null}
        {PACK_KINDS.map((k) => {
          const seen = pack.seen[k];
          const on = packLit(pack, k);
          return seen ? (
            <SetRow key={k} label={packWords(k, at).title} value={ranAt(seen)} />
          ) : on ? (
            <SetSwitch key={k} label={packWords(k, at).title} on onChange={(v) => packSay(k, v)} />
          ) : (
            <SetRow key={k} label={packWords(k, at).title} value="Not set" onPress={() => router.push({ pathname: '/nightpack', params: { k } })} />
          );
        })}
      </SetGroup>
    </>
  );
}

const s = StyleSheet.create({
  lights: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 },
  light: { alignItems: 'center', gap: 6, flex: 1 },
  unlit: { width: 60, height: 60, alignItems: 'center', justifyContent: 'center' },
});
