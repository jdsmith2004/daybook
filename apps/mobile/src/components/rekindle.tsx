/* Rekindle's pieces: the comeback's three flames with what lit each (Lights), the flames (one per mission, each catching
   with a pop when it is lit), the embers and the one big button you press and hold to rekindle them after a slip (sparks
   fly when they catch), and the missions list. The "What just happened" pictures are in rk-art.tsx. */
import { type Mission, type RkLight } from '@daybook/core';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';
import Svg, { Path } from 'react-native-svg';

import { Flame } from '@/components/flame';
import { Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
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

/* ---------- sparks: a burst that rises and fades when the embers catch ---------- */
const SPARKS = [
  [-70, -150, 0],
  [-38, -190, 80],
  [-12, -170, 30],
  [14, -200, 120],
  [40, -160, 50],
  [66, -185, 140],
  [-56, -120, 180],
  [58, -125, 200],
  [-24, -140, 240],
  [28, -132, 260],
];
function Sparks() {
  const reduce = useReducedMotion();
  const vals = useRef(SPARKS.map(() => new Animated.Value(0))).current;
  useEffect(() => {
    if (reduce) return;
    const a = Animated.parallel(
      vals.map((v, i) =>
        Animated.timing(v, { toValue: 1, duration: 1300 + (i % 3) * 250, delay: SPARKS[i][2], easing: Easing.out(Easing.quad), useNativeDriver: NATIVE }),
      ),
    );
    a.start();
    return () => a.stop();
  }, [reduce, vals]);
  if (reduce) return null;
  return (
    <View pointerEvents="none" style={s.sparks}>
      {vals.map((v, i) => (
        <Animated.View
          key={i}
          style={[
            s.spark,
            i % 2 ? s.sparkSmall : null,
            {
              opacity: v.interpolate({ inputRange: [0, 0.15, 0.7, 1], outputRange: [0, 1, 0.8, 0] }),
              transform: [
                { translateX: v.interpolate({ inputRange: [0, 1], outputRange: [0, SPARKS[i][0]] }) },
                { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, SPARKS[i][1]] }) },
                { scale: v.interpolate({ inputRange: [0, 1], outputRange: [1.2, 0.4] }) },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

/* ---------- the embers: press and hold to rekindle the flame ----------
   useEmberHold keeps the one hold, shared by the art (it glows brighter as the hold goes on) and the button (it fills from
   the left, so how far along it is shows plainly). Let go early and it sinks back; a quick tap says to keep holding. A
   screen reader (or switch control) completes it with the button's own action, and on the web a held Enter or Space key
   works like a held finger. With Reduce Motion on, the fill still shows the hold, but the flame does not grow and no
   sparks fly. */
const HOLD_MS = 1400;
const NATIVE = Platform.OS !== 'web';
export interface EmberHold {
  h: Animated.Value;
  lit: boolean;
  label: string;
  light: () => void;
  start: () => void;
  stop: () => void;
  tap: () => void;
}
export function useEmberHold(lit: boolean, onLit: () => void): EmberHold {
  const reduce = useReducedMotion();
  const h = useRef(new Animated.Value(lit ? 1 : 0)).current;
  const [label, setLabel] = useState('Press and hold to rekindle');
  const done = useRef(lit);
  /* the press began here (a finger, or a held key); a press with no start is a screen reader's click on the web */
  const held = useRef(false);
  useEffect(() => {
    if (!lit) return;
    done.current = true;
    if (reduce) h.setValue(1);
    else Animated.timing(h, { toValue: 1, duration: 300, useNativeDriver: NATIVE }).start();
  }, [lit, h, reduce]);
  const light = () => {
    if (done.current) return;
    done.current = true;
    h.stopAnimation();
    h.setValue(1);
    buzz('lit');
    onLit();
  };
  const start = () => {
    if (done.current) return;
    held.current = true;
    buzz('tap');
    setLabel('Keep holding');
    Animated.timing(h, { toValue: 1, duration: HOLD_MS, easing: Easing.linear, useNativeDriver: NATIVE }).start(({ finished }) => {
      if (finished) light();
    });
  };
  const stop = () => {
    if (done.current) return;
    h.stopAnimation();
    Animated.timing(h, { toValue: 0, duration: reduce ? 0 : 300, useNativeDriver: NATIVE }).start();
  };
  /* a quick tap (let go before the end) says what to do; it does not light it */
  const tap = () => {
    if (done.current) return;
    if (!held.current) return light();
    held.current = false;
    setLabel('Hold it down until it fills');
  };
  return { h, lit, label, light, start, stop, tap };
}

/** the flame, low after a slip, glowing up as it is held; sparks fly when it catches */
export function EmberArt({ level, hold }: { level: number; hold: EmberHold }) {
  const reduce = useReducedMotion();
  const { h, lit } = hold;
  const glow = h.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.9] });
  const scale = h.interpolate({ inputRange: [0, 1], outputRange: [reduce ? 1 : 0.9, 1] });
  const dim = h.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] });
  return (
    <View
      style={s.ember}
      accessible
      accessibilityRole="image"
      accessibilityLabel={lit ? 'Your flame, burning again' : 'Your flame, waiting to be breathed back up'}>
      <Animated.View style={[s.glow, { opacity: glow }]} />
      {lit ? <Sparks /> : null}
      <Animated.View style={{ transform: [{ scale }] }}>
        <Flame level={level} size={150} />
        <Animated.View style={[StyleSheet.absoluteFill, s.dim, { opacity: dim }]} />
      </Animated.View>
    </View>
  );
}

/** the one big button: press and hold until it fills */
export function HoldButton({ hold }: { hold: EmberHold }) {
  const c = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Rekindle"
      accessibilityHint="Press and hold until it fills. With a screen reader, double tap."
      accessibilityActions={[{ name: 'activate' }, { name: 'longpress' }]}
      onAccessibilityAction={hold.light}
      onPressIn={hold.start}
      onPressOut={hold.stop}
      onPress={hold.tap}
      delayLongPress={HOLD_MS + 1000}
      style={[s.hold, { backgroundColor: c.sun }]}>
      <Animated.View style={[s.holdFill, { transform: [{ scaleX: hold.h }] }]} />
      <View style={s.holdIn}>
        <Icon name="flame" size={24} color={c.onSun} />
        <Text style={[s.holdT, { color: c.onSun }]}>{hold.label}</Text>
      </View>
    </Pressable>
  );
}

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
