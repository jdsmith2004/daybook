/* The night pack's page (Settings, The night pack; core night-pack.ts). Four automations the person makes once in Shortcuts, each
   a light: the person's own flame, lit when it is set or Daybook has seen it run, grey until then. On a phone that goes grey at
   night the flame is the one colour left, so the lights are flames. Each part says what it does and, until it is lit, how to
   make it; Daybook cannot make an automation itself (Apple keeps them the person's own). */
import { fmtClock, gameCompute, PACK_KINDS, packLit, packWords, tonightOf, type PackKind } from '@daybook/core';
import { Linking, StyleSheet, View } from 'react-native';

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
      <T v="small" tone="muted" style={s.lead}>
        Made once, in Shortcuts. They are yours: nothing on the lock screen says what they are for.
      </T>
      {PACK_KINDS.map((k) => {
        const w = packWords(k, at);
        const lit = packLit(pack, k);
        const seen = pack.seen[k];
        return (
          <SetGroup
            key={k}
            head={w.title}
            foot={
              lit ? (
                w.line
              ) : (
                <>
                  {w.line}
                  {w.steps.map((x, i) => '\n\n' + (i + 1) + '. ' + x).join('')}
                </>
              )
            }>
            {seen ? <SetRow label="Working" value={ranAt(seen)} /> : <SetSwitch label="It is set" on={!!pack.said[k]} onChange={(on) => packSay(k, on)} />}
            {lit ? null : <SetRow label="Open Shortcuts" act="accent" onPress={() => Linking.openURL('shortcuts://').catch(() => undefined)} />}
          </SetGroup>
        );
      })}
    </>
  );
}

const s = StyleSheet.create({
  lights: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 },
  light: { alignItems: 'center', gap: 6, flex: 1 },
  unlit: { width: 60, height: 60, alignItems: 'center', justifyContent: 'center' },
  lead: { textAlign: 'center', marginTop: -12, paddingHorizontal: 16 },
});
