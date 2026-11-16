/* Make a free account, at the top of Today beside Ideas, for everyone with no account (the owner, November 14, 2026: "if they don't
   sign up for an account the push to sign up should be more prominent like put it on the top to the right of ideas and push it every
   once in a while"). It opens the account sheet and is gone for good once there is an account. Every few days, right after a good
   moment, it glows and the flame says one line under it (core accounts.ts accountNudge decides when). Its X waits a few days. */
import { accountNudged, nudgeWords, type NudgeWhy } from '@daybook/core';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { Icon } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { NATIVE, useReducedMotion } from '@/lib/motion';
import { useStore } from '@/lib/store';
import { useSync } from '@/lib/sync';
import { font, useTheme } from '@/lib/theme';

export function AccountTop({ nudge }: { nudge: NudgeWhy | null }) {
  const c = useTheme();
  const sync = useSync();
  const { snap, tk, apply } = useStore();
  const still = useReducedMotion();
  const glow = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!nudge || still) {
      glow.setValue(nudge ? 0.6 : 0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
        Animated.timing(glow, { toValue: 0.25, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [nudge, still, glow]);
  const seen = () => snap.settings && apply(accountNudged(snap.settings, tk));
  /* the glow is shown from here; its line is AccountNudge, under the care row, so it never covers the flame */
  return (
    <View pointerEvents="box-none">
      <View>
        {nudge ? <Animated.View pointerEvents="none" style={[s.glow, { borderColor: c.accent, opacity: glow }]} /> : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Make a free account or sign in. It opens every lesson."
          onPress={() => {
            buzz('tap');
            if (nudge) seen();
            sync.signInNow();
          }}
          hitSlop={6}
          style={({ pressed }) => [s.top, { backgroundColor: c.accent, opacity: pressed ? 0.85 : 1 }]}>
          <Icon name="shield" size={15} color={c.accentInk} />
          <Text style={[s.topT, { color: c.accentInk }]}>Make a free account</Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 36, paddingHorizontal: 12, borderRadius: 999, marginTop: 2 },
  topT: { fontFamily: font.bodySemi, fontSize: 13 },
  glow: { position: 'absolute', top: -2, left: -4, right: -4, bottom: -4, borderRadius: 999, borderWidth: 2 },
  say: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 20 },
  sayIn: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  sayT: { flex: 1, fontFamily: font.bodyMedium, fontSize: 15, lineHeight: 20 },
});

/** the flame's line on a nudge day, under the care row: what was just done and what a free account opens. A tap opens the
    account sheet; the X waits a few days (core accountNudged). */
export function AccountNudge({ nudge, locked }: { nudge: NudgeWhy; locked: number }) {
  const c = useTheme();
  const sync = useSync();
  const { snap, tk, apply } = useStore();
  const seen = () => snap.settings && apply(accountNudged(snap.settings, tk));
  return (
    <View style={[s.say, { backgroundColor: c.surface }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityHint="Opens the free account page"
        onPress={() => {
          buzz('tap');
          seen();
          sync.signInNow();
        }}
        style={({ pressed }) => [s.sayIn, { opacity: pressed ? 0.8 : 1 }]}>
        <Icon name="flame" size={18} color={c.accent} />
        <Text style={[s.sayT, { color: c.ink }]}>{nudgeWords(nudge, locked)}</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close"
        hitSlop={12}
        onPress={() => {
          buzz('tap');
          seen();
        }}>
        <Icon name="x" size={16} color={c.muted} />
      </Pressable>
    </View>
  );
}
