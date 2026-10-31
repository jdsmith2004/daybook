/* A few words on tinted glass above the SOS circle on Today, so a person knows what it is and is led to it when it counts (core sosLead):
   until SOS has been opened once, and around the hard hours. It moves a little to catch the eye, and a tap opens SOS. */
import { notifyAsk, sosLead, urLastAt } from '@daybook/core';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet } from 'react-native';

import { Text } from '@/components/text';
import { Icon } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { NATIVE, useReducedMotion } from '@/lib/motion';
import { useNotifyEnv } from '@/lib/notify-env';
import { useNotifyMem } from '@/lib/prefs';
import { useSos } from '@/lib/sos';
import { useStore } from '@/lib/store';
import { TAB_TOP } from '@/lib/tab-room';
import { font, useTheme } from '@/lib/theme';

/** how far the words reach above the tab bar, at the top of their bob */
export const LEAD_ROOM = 48;

/** whether the words show now. One ask at a time: the reminders strip goes first, and it fills the room these words would sit in. iPhone only. */
export function useSosLeadOn() {
  const { snap, tk, now } = useStore();
  const sos = useSos();
  const env = useNotifyEnv();
  const mem = useNotifyMem();
  const st = snap.settings;
  if (Platform.OS !== 'ios' || !st || !sosLead(snap.days, st, tk, now, urLastAt(sos.mem))) return false;
  return !(env && notifyAsk(env, mem, snap.days, st, tk));
}

export function SosLead() {
  const c = useTheme();
  const reduce = useReducedMotion();
  const bob = useRef(new Animated.Value(0)).current;
  const on = useSosLeadOn();
  useEffect(() => {
    if (!on || reduce) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: -4, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
        Animated.timing(bob, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [on, reduce, bob]);
  if (!on) return null;
  return (
    <Animated.View style={[s.wrap, { bottom: TAB_TOP, transform: [{ translateY: bob }] }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="SOS. Help with an urge."
        onPress={() => {
          buzz('tap');
          router.push('/sos');
        }}
        style={({ pressed }) => pressed && { opacity: 0.8 }}>
        <GlassView tintColor={c.sosLow} isInteractive style={[s.glass, !isLiquidGlassAvailable() && { backgroundColor: c.sosLow }]}>
          <Text maxFontSizeMultiplier={1.15} style={[s.t, { color: c.sosInk }]}>
            Feeling an urge? Tap SOS
          </Text>
          <Icon name="down" size={16} color={c.sosInk} />
        </GlassView>
      </Pressable>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  wrap: { position: 'absolute', right: 16 },
  glass: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, paddingHorizontal: 16, borderRadius: 22, overflow: 'hidden' },
  t: { fontFamily: font.bodyBold, fontSize: 15, lineHeight: 20 },
});
