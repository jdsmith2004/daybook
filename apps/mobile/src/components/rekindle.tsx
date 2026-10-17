/* Rekindle's pieces: the flames (one per mission, each catching with a pop when it is lit), the embers you hold to
   breathe on (sparks fly when they catch), the missions list, and "Did you wait first?". The "What just happened"
   pictures are in rk-art.tsx. */
import { RK_WAIT, type Mission } from '@daybook/core';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Flame } from '@/components/flame';
import { Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { useReducedMotion } from '@/lib/motion';
import { font, useTheme } from '@/lib/theme';

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

/* ---------- the embers: hold to breathe the flame back up ---------- */
const HOLD_MS = 1400;
const NATIVE = Platform.OS !== 'web';
export function Embers({ level, lit, onLit }: { level: number; lit: boolean; onLit: () => void }) {
  const c = useTheme();
  const h = useRef(new Animated.Value(lit ? 1 : 0)).current;
  const [label, setLabel] = useState('Hold to breathe on the embers');
  const tap2 = useRef(0);
  const done = useRef(lit);
  const reduced = useRef(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then((r) => (reduced.current = r))
      .catch(() => undefined);
  }, []);
  useEffect(() => {
    if (lit) {
      done.current = true;
      Animated.timing(h, { toValue: 1, duration: 300, useNativeDriver: NATIVE }).start();
    }
  }, [lit, h]);
  const light = () => {
    if (done.current) return;
    done.current = true;
    buzz('lit');
    onLit();
  };
  const start = () => {
    if (done.current) return;
    buzz('tap');
    Animated.timing(h, { toValue: 1, duration: HOLD_MS, easing: Easing.linear, useNativeDriver: NATIVE }).start(({ finished }) => {
      if (finished) light();
    });
  };
  const stop = () => {
    if (done.current) return;
    h.stopAnimation();
    Animated.timing(h, { toValue: 0, duration: reduced.current ? 0 : 300, useNativeDriver: NATIVE }).start();
  };
  /* a quick tap explains; a second tap within a few seconds lights it too */
  const tap = () => {
    if (done.current) return;
    if (Date.now() < tap2.current) {
      tap2.current = 0;
      light();
      return;
    }
    tap2.current = Date.now() + 4000;
    setLabel('Keep holding, or tap again');
  };
  const glow = h.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.9] });
  const scale = h.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] });
  const dim = h.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] });
  return (
    <View style={{ width: '100%', alignItems: 'center', gap: 18 }}>
      <View style={s.ember} accessible accessibilityRole="image" accessibilityLabel={lit ? 'Your flame, burning again' : 'Your flame, down to embers'}>
        <Animated.View style={[s.glow, { opacity: glow }]} />
        {lit ? <Sparks /> : null}
        <Animated.View style={{ transform: [{ scale }] }}>
          <Flame level={level} size={150} />
          <Animated.View style={[StyleSheet.absoluteFill, s.dim, { opacity: dim }]} />
        </Animated.View>
      </View>
      {lit ? null : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Hold to breathe on the embers"
          accessibilityHint="Or double tap to light it"
          accessibilityActions={[{ name: 'activate' }]}
          onAccessibilityAction={light}
          onPressIn={start}
          onPressOut={stop}
          onPress={tap}
          delayLongPress={HOLD_MS + 1000}
          style={[s.hold, { backgroundColor: c.sun }]}>
          <Animated.View style={[s.holdFill, { transform: [{ scaleX: h }] }]} />
          <View style={s.holdIn}>
            <Icon name="wind" size={22} color={c.onSun} />
            <Text style={[s.holdT, { color: c.onSun }]}>{label}</Text>
          </View>
        </Pressable>
      )}
    </View>
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

/* ---------- did you wait first? ---------- */
export function WaitPicker({ cur, onPick }: { cur: number | null | undefined; onPick: (w: 0 | 5 | 10 | 20) => void }) {
  const c = useTheme();
  return (
    <View style={{ width: '100%', gap: 8 }}>
      <T v="label">Did you wait first?</T>
      <View style={s.waits} accessibilityRole="radiogroup" accessibilityLabel="Did you wait first?">
        {RK_WAIT.map(([w, label]) => {
          const on = cur === w;
          return (
            <Pressable
              key={w}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              onPress={() => onPick(w)}
              style={[s.wait, { backgroundColor: on ? c.accentSoft : c.surface, borderColor: on ? c.accent : 'transparent', shadowColor: c.lip }]}>
              <Text style={[s.waitT, { color: on ? c.accentText : c.ink }]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
      <T v="small" tone="muted">
        Waiting counts, even when the urge wins. It is the muscle that grows.
      </T>
    </View>
  );
}

const s = StyleSheet.create({
  flames: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', gap: 14 },
  ember: { width: 200, height: 200, alignItems: 'center', justifyContent: 'center' },
  flameGlow: { position: 'absolute', backgroundColor: '#FFB43A' },
  sparks: { position: 'absolute', left: 96, top: 110, width: 8, height: 8 },
  spark: { position: 'absolute', width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFD36A' },
  sparkSmall: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#FF9A3C' },
  glow: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: '#FFB43A' },
  dim: { backgroundColor: '#120E38', borderRadius: 75 },
  hold: { width: '100%', minHeight: 62, borderRadius: 20, overflow: 'hidden', justifyContent: 'center' },
  holdFill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#FFF2BF', transformOrigin: 'left' },
  holdIn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 16 },
  holdT: { fontFamily: font.display, fontSize: 19 },
  mission: { borderRadius: 18, padding: 10, gap: 8, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 2 },
  mRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  mIc: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  mActs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingLeft: 52 },
  mBtn: { minHeight: 40, paddingHorizontal: 14, borderRadius: 999, justifyContent: 'center' },
  mBtnT: { fontFamily: font.bodyBold, fontSize: 14 },
  waits: { flexDirection: 'row', gap: 8 },
  wait: {
    flex: 1,
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  waitT: { fontFamily: font.bodySemi, fontSize: 15 },
});
