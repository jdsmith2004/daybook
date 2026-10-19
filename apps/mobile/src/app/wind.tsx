/* The wind-down: a short full-screen moment under the night sky. The checklist for the hour before screens go off, as big
   cards under the thumb, then "Putting my phone away", which leads to Good night (app/night.tsx). Opened from Wind-down in
   "Your day" and from Next up. Ported from the wind-down stop that was inside Your day. */
import { clockOf, fmtClock, gameCompute, phoneAway, rhythm, windLine, windToggle } from '@daybook/core';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';

import { FitArt } from '@/components/fit';
import { NightSky } from '@/components/night-sky';
import { Dock, SceneFrame } from '@/components/scene';
import { Button, Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { close } from '@/lib/nav';
import { useStore } from '@/lib/store';
import { font, useTheme } from '@/lib/theme';

export default function Wind() {
  const { snap, tk, now, update } = useStore();
  const st = snap.settings;
  if (!st) return null;
  const p = snap.days[tk]?.p;
  const r = rhythm(snap.days, st, tk, now);
  const away = () => {
    const at = clockOf(Date.now());
    let gain = 0;
    update((s0) => {
      const b0 = gameCompute(s0.days, s0.settings!, s0.reviews, tk).pts;
      const days = phoneAway(s0.days, tk, at);
      gain = Math.max(0, gameCompute(days, s0.settings!, s0.reviews, tk).pts - b0);
      return { ...s0, days };
    });
    buzz('save');
    router.push({ pathname: '/night', params: { at, gain: String(gain) } });
  };
  return (
    <SceneFrame title="Wind-down" sky="night" onClose={close}>
      {/* the sky gives way when the list is long, so the list, the button and Not yet all fit */}
      <FitArt drop={0.6}>
        <NightSky />
      </FitArt>
      <T v="title" style={s.c} accessibilityRole="header">
        Time to wind down
      </T>
      <T style={s.c} tone="muted">
        {windLine(st, r.leftToOff, p)}
      </T>
      <Dock>
        {st.wind.map((t, i) => (
          <WindItem
            key={i}
            label={t}
            on={!!p && p.w.indexOf(i) >= 0}
            onPress={() => {
              update((s0) => ({ ...s0, days: windToggle(s0.days, s0.settings!, tk, i) }));
              buzz('tap');
            }}
          />
        ))}
        {p && p.po ? (
          <>
            <T style={s.c}>Phone away at {fmtClock(p.po)}. See you in the morning.</T>
            <Button label="Done" onPress={close} />
          </>
        ) : (
          <>
            <Button label="Putting my phone away" icon="moon" onPress={away} />
            <T v="small" tone="muted" style={s.c}>
              Tap this just before you do. Tomorrow morning the app asks whether it stayed away.
            </T>
          </>
        )}
      </Dock>
    </SceneFrame>
  );
}

/* one thing on the list, as a big card with a round check */
function WindItem({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  const c = useTheme();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: on }}
      onPress={onPress}
      style={({ pressed }) => [
        s.item,
        { backgroundColor: c.surface, borderColor: on ? c.mint : 'transparent', shadowColor: c.lip, transform: [{ translateY: pressed ? 2 : 0 }] },
      ]}>
      <View style={[s.box, { backgroundColor: on ? c.mint : 'transparent', borderColor: on ? c.mint : c.line }]}>
        {on ? <Icon name="check" size={16} color="#06352A" /> : null}
      </View>
      <Text style={[s.itemT, { color: c.ink }]}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  c: { textAlign: 'center' },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 56,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 2,
    shadowOpacity: 1,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 3 },
  },
  box: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  itemT: { flex: 1, fontFamily: font.bodySemi, fontSize: 15.5, lineHeight: 20 },
});
