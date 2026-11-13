/* Unlocked: the small celebration a new part of Daybook gets the first time it is the person's, the way Duolingo opens a new
   unit (the owner, November 13, 2026: "there's no unlock for the sos and lessons"). It rises from the bottom over the page, with
   confetti and a haptic: the word Unlocked with a sparkle, the part's name big, the one thing it does, what it looks like where
   it lives (art), and the way on. Used by setup (SOS, the lessons) and by the first week's parts (app/unlock.tsx). */
import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Confetti } from '@/components/celebrate';
import { Ghost, Next } from '@/components/lx';
import { Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { NATIVE, useReducedMotion } from '@/lib/motion';
import { font, useTheme } from '@/lib/theme';

export interface UnlockSheetProps {
  /** the small words over the name: "Unlocked", or "Great job! Unlocked" */
  eb?: string;
  /** the part, big: "SOS", "Lessons" */
  name: string;
  /** what it does for the person, one or two short sentences */
  line: string;
  /** what it looks like where it lives (the SOS button, a lesson card) */
  art?: ReactNode;
  go: { label: string; onPress: () => void };
  other?: { label: string; onPress: () => void };
}

export function UnlockSheet({ eb = 'Unlocked', name, line, art, go, other }: UnlockSheetProps) {
  const c = useTheme();
  const inset = useSafeAreaInsets();
  const still = useReducedMotion();
  const up = useRef(new Animated.Value(still ? 1 : 0)).current;
  const pop = useRef(new Animated.Value(still ? 1 : 0.6)).current;
  useEffect(() => {
    buzz('lit');
    if (still) return;
    Animated.sequence([
      Animated.spring(up, { toValue: 1, friction: 7, tension: 70, useNativeDriver: NATIVE }),
      Animated.spring(pop, { toValue: 1, friction: 4, tension: 120, useNativeDriver: NATIVE }),
    ]).start();
  }, [still, up, pop]);
  return (
    <View style={StyleSheet.absoluteFill} accessibilityViewIsModal>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(8,6,24,0.5)', opacity: up }]} />
      {still ? null : <Confetti big={false} />}
      <Animated.View
        style={[
          s.sheet,
          { backgroundColor: c.mintSoft, paddingBottom: Math.max(16, inset.bottom + 8) },
          { transform: [{ translateY: up.interpolate({ inputRange: [0, 1], outputRange: [420, 0] }) }] },
        ]}>
        <View style={s.eb} accessible accessibilityRole="header" accessibilityLabel={eb + ': ' + name}>
          <Icon name="sparkle" size={18} color={c.mintText} />
          <Text style={[s.ebT, { color: c.mintText }]}>{eb}</Text>
        </View>
        <View style={s.top}>
          {art ? <View style={s.art}>{art}</View> : null}
          <Animated.Text style={[s.name, { color: c.mintText, transform: [{ scale: pop }] }]}>{name}</Animated.Text>
        </View>
        <T style={{ color: c.mintText }}>{line}</T>
        <View style={{ gap: 2, marginTop: 8 }}>
          <Next label={go.label} noIcon onPress={go.onPress} />
          {other ? <Ghost label={other.label} onPress={other.onPress} /> : null}
        </View>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 22,
    paddingHorizontal: 20,
    gap: 8,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  eb: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ebT: { fontFamily: font.bodyBold, fontSize: 17, lineHeight: 22 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 4 },
  name: { flex: 1, fontFamily: font.displayBold, fontSize: 40, lineHeight: 46, transformOrigin: 'left' },
  art: { alignItems: 'center', justifyContent: 'center' },
});
