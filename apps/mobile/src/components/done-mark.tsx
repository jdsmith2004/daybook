/* The check mark that closes a full-screen moment (the check-in, the morning): it pops in on a soft ring that widens and
   fades once. Still with Reduce Motion on. */
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui';
import { NATIVE, useReducedMotion } from '@/lib/motion';
import { useTheme } from '@/lib/theme';

export function DoneMark() {
  const c = useTheme();
  const reduce = useReducedMotion();
  const v = useRef(new Animated.Value(reduce ? 1 : 0)).current;
  const ring = useRef(new Animated.Value(reduce ? 1 : 0)).current;
  useEffect(() => {
    if (reduce) return;
    Animated.parallel([
      Animated.spring(v, { toValue: 1, friction: 5, tension: 120, useNativeDriver: NATIVE }),
      Animated.timing(ring, { toValue: 1, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: NATIVE }),
    ]).start();
  }, [reduce, v, ring]);
  return (
    <View style={s.doneBox}>
      <Animated.View
        style={[
          s.ring,
          {
            borderColor: c.mint,
            opacity: ring.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 0.6, 0] }),
            transform: [{ scale: ring.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.6] }) }],
          },
        ]}
      />
      <Animated.View
        style={[
          s.badge,
          {
            backgroundColor: c.mintSoft,
            opacity: v.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1] }),
            transform: [
              { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) },
              { rotate: v.interpolate({ inputRange: [0, 1], outputRange: ['-20deg', '0deg'] }) },
            ],
          },
        ]}>
        <Icon name="check" size={40} color={c.mintText} />
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  doneBox: { width: 120, height: 120, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', width: 96, height: 96, borderRadius: 48, borderWidth: 3 },
  badge: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center' },
});
