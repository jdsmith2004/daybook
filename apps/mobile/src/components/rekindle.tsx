/* Rekindle's pieces: the comeback's three flames (each catching with a pop when it is lit). The hold after a slip is in hearth.tsx, and the "What just
   happened" pictures are in rk-art.tsx. */
import { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useReducedMotion } from '@/lib/motion';
import { useTheme } from '@/lib/theme';

const NATIVE = Platform.OS !== 'web';

/* ---------- one flame for each thing done: lit or still waiting ---------- */
export function Flames({ on, big }: { on: boolean[]; big?: boolean }) {
  const n = on.filter(Boolean).length;
  return (
    <View style={s.flames} accessible accessibilityRole="image" accessibilityLabel={`${n} of ${on.length} flames lit`}>
      {on.map((x, i) => (
        <OneFlame key={i} lit={x} w={big ? 46 : 34} />
      ))}
    </View>
  );
}
/** one flame: when it is lit while on screen, it catches with a pop and a glow */
function OneFlame({ lit, w }: { lit: boolean; w: number }) {
  const c = useTheme();
  const reduce = useReducedMotion();
  const v = useRef(new Animated.Value(lit ? 1 : 0)).current;
  const was = useRef(lit);
  useEffect(() => {
    if (lit === was.current) return;
    was.current = lit;
    if (reduce || !lit) v.setValue(lit ? 1 : 0);
    else Animated.spring(v, { toValue: 1, friction: 4, tension: 120, useNativeDriver: NATIVE }).start();
  }, [lit, reduce, v]);
  return (
    <View style={{ width: w, height: w * 1.25, alignItems: 'center', justifyContent: 'center' }}>
      {lit ? (
        <Animated.View
          style={[
            s.flameGlow,
            { width: w * 1.3, height: w * 1.3, borderRadius: w, opacity: v.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0.55, 0.22] }) },
          ]}
        />
      ) : null}
      <Animated.View style={lit ? { transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }] } : null}>
        <Svg width={w} height={w * 1.25} viewBox="0 0 32 40">
          <Path
            d="M16 2C17 8 26 12 26 24A10 10 0 0 1 6 24C6 19 8.5 16 11 14C11.5 17.5 13 19.5 15 20.5C13.5 14 13.5 8 16 2Z"
            fill={lit ? '#FF9A3C' : 'none'}
            stroke={lit ? '#E8692A' : c.muted}
            strokeWidth={2}
            strokeDasharray={lit ? undefined : '3 4'}
            opacity={lit ? 1 : 0.45}
          />
          {lit ? <Path d="M16 34A5 5 0 0 1 11 29C11 25.5 13.5 24 16 20C18.5 24 21 25.5 21 29A5 5 0 0 1 16 34Z" fill="#FFE27A" /> : null}
        </Svg>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  flames: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', gap: 14 },
  flameGlow: { position: 'absolute', backgroundColor: '#FFB43A' },
});
