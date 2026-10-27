/* Rekindle's pieces: the comeback's three flames with what lit each (Lights), the flames (one per mission, each catching
   with a pop when it is lit), and the missions list. The hold after a slip is in hearth.tsx, and the "What just
   happened" pictures are in rk-art.tsx. */
import { type Mission, type RkLight } from '@daybook/core';
import { useEffect, useRef } from 'react';
import { Animated, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';
import Svg, { Path } from 'react-native-svg';

import { Icon, T } from '@/components/ui';
import { useReducedMotion } from '@/lib/motion';
import { font, useTheme } from '@/lib/theme';

/* ---------- the comeback: three flames that light themselves, each naming what was done ---------- */
export function Lights({ list }: { list: RkLight[] }) {
  const c = useTheme();
  return (
    <View style={{ alignSelf: 'stretch', gap: 8 }}>
      {list.map((f, i) => (
        <View key={i} style={s.light} accessible accessibilityLabel={(f.on ? 'Lit: ' : 'Not lit yet: ') + f.t}>
          <OneFlame lit={f.on} w={26} />
          <T style={{ flex: 1, color: f.on ? c.ink : c.muted }} v={f.on ? 'label' : 'body'}>
            {f.t}
          </T>
        </View>
      ))}
    </View>
  );
}

/* ---------- one flame per mission: lit or still waiting ---------- */
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

const NATIVE = Platform.OS !== 'web';

/* ---------- the missions ---------- */
export function Missions({ list, onAction }: { list: Mission[]; onAction: (m: Mission, act: string) => void }) {
  const c = useTheme();
  return (
    <View style={{ width: '100%', gap: 8 }}>
      {list.map((m) => (
        <View key={m.key} style={[s.mission, { backgroundColor: c.surface, shadowColor: c.lip }]}>
          <View style={s.mRow}>
            <DoneMark done={m.done} icon={m.icon} />
            <View style={{ flex: 1, gap: 2 }}>
              <T v="label">{m.title}</T>
              <T v="small" tone="muted">
                {m.sub}
              </T>
            </View>
            {m.pts != null && (m.done || !m.actions.length) ? (
              <T v="label" tone={m.done ? 'mintText' : 'muted'}>
                +{m.pts}
              </T>
            ) : null}
          </View>
          {!m.done && m.actions.length ? (
            <View style={s.mActs}>
              {m.actions.map((a, i) => (
                <Pressable
                  key={a.label}
                  accessibilityRole="button"
                  onPress={() => onAction(m, a.act as string)}
                  style={({ pressed }) => [s.mBtn, { backgroundColor: i ? c.surface2 : c.accent, opacity: pressed ? 0.85 : 1 }]}>
                  <Text style={[s.mBtnT, { color: i ? c.ink : c.accentInk }]}>{a.label}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
      ))}
    </View>
  );
}

/** a mission's mark: its icon, or a green check that pops in when it is done */
function DoneMark({ done, icon }: { done: boolean; icon: string }) {
  const c = useTheme();
  const reduce = useReducedMotion();
  const v = useRef(new Animated.Value(done ? 1 : 0)).current;
  const was = useRef(done);
  useEffect(() => {
    if (done === was.current) return;
    was.current = done;
    if (reduce || !done) v.setValue(done ? 1 : 0);
    else Animated.spring(v, { toValue: 1, friction: 4, tension: 140, useNativeDriver: NATIVE }).start();
  }, [done, reduce, v]);
  return (
    <Animated.View
      style={[
        s.mIc,
        { backgroundColor: done ? c.mint : c.surface2 },
        done ? { transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }] } : null,
      ]}>
      <Icon name={icon} size={20} color={done ? '#FFFFFF' : c.ink} />
    </Animated.View>
  );
}

const s = StyleSheet.create({
  light: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flames: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', gap: 14 },
  ember: { width: 200, height: 200, alignItems: 'center', justifyContent: 'center' },
  flameGlow: { position: 'absolute', backgroundColor: '#FFB43A' },
  sparks: { position: 'absolute', left: 96, top: 110, width: 8, height: 8 },
  spark: { position: 'absolute', width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFD36A' },
  sparkSmall: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#FF9A3C' },
  glow: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: '#FFB43A' },
  dim: { backgroundColor: '#120E38', borderRadius: 75 },
  hold: { width: '100%', minHeight: 76, borderRadius: 22, overflow: 'hidden', justifyContent: 'center' },
  holdFill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#FFF2BF', transformOrigin: 'left' },
  holdIn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 16 },
  holdT: { fontFamily: font.display, fontSize: 19 },
  mission: { borderRadius: 18, padding: 10, gap: 8, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 2 },
  mRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  mIc: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  mActs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingLeft: 52 },
  mBtn: { minHeight: 40, paddingHorizontal: 14, borderRadius: 999, justifyContent: 'center' },
  mBtnT: { fontFamily: font.bodyBold, fontSize: 14 },
});
