/* Rekindle's pieces: the flames (one per mission), the embers you hold to breathe on, the three "what just happened" pictures,
   the missions list, and "Did you wait first?". */
import { RK_WAIT, type Mission } from '@daybook/core';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Path, Text as SvgText } from 'react-native-svg';

import { Flame } from '@/components/flame';
import { Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { font, useTheme } from '@/lib/theme';

/* ---------- one flame per mission: lit or still waiting ---------- */
export function Flames({ on, big }: { on: boolean[]; big?: boolean }) {
  const c = useTheme();
  const n = on.filter(Boolean).length;
  const w = big ? 46 : 34;
  return (
    <View style={s.flames} accessible accessibilityRole="image" accessibilityLabel={`${n} of ${on.length} flames lit`}>
      {on.map((x, i) => (
        <Svg key={i} width={w} height={w * 1.25} viewBox="0 0 32 40">
          <Path
            d="M16 2C17 8 26 12 26 24A10 10 0 0 1 6 24C6 19 8.5 16 11 14C11.5 17.5 13 19.5 15 20.5C13.5 14 13.5 8 16 2Z"
            fill={x ? '#FF9A3C' : 'none'}
            stroke={x ? '#E8692A' : c.muted}
            strokeWidth={2}
            strokeDasharray={x ? undefined : '3 4'}
            opacity={x ? 1 : 0.45}
          />
          {x ? <Path d="M16 34A5 5 0 0 1 11 29C11 25.5 13.5 24 16 20C18.5 24 21 25.5 21 29A5 5 0 0 1 16 34Z" fill="#FFE27A" /> : null}
        </Svg>
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

/* ---------- what just happened: one picture per card ---------- */
export function BrainArt({ art, label }: { art: 'rush' | 'crash' | 'trap'; label: string }) {
  const c = useTheme();
  const base = { fill: 'none', stroke: c.ink, strokeWidth: 2, strokeDasharray: '3 7', strokeLinecap: 'round' as const, opacity: 0.35 };
  const ln = { fill: 'none', stroke: c.slip, strokeWidth: 6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const lb = { fontSize: 11, fontFamily: font.bodyBold, letterSpacing: 1, textAnchor: 'middle' as const, fill: c.ink, opacity: 0.8 };
  return (
    <Svg width="100%" height={150} viewBox="0 0 320 150" accessibilityLabel={label} accessibilityRole="image">
      {art === 'rush' ? (
        <G>
          <Path d="M10 118H310" {...base} />
          <Path d="M12 118H92C110 118 116 24 134 24S152 118 172 118H308" {...ln} />
          <Circle cx={134} cy={24} r={7} fill={c.slip} />
          <SvgText x={134} y={10} {...lb}>
            THE RUSH
          </SvgText>
          <SvgText x={240} y={104} {...lb}>
            OVER FAST
          </SvgText>
        </G>
      ) : art === 'crash' ? (
        <G>
          <Path d="M10 56H310" {...base} />
          <Path d="M12 56H58C92 56 98 126 136 126S214 70 266 52" {...ln} />
          <SvgText x={136} y={146} {...lb}>
            THE LOW
          </SvgText>
          <Circle cx={288} cy={46} r={11} fill="#FFC832" />
          <Path d="M288 26v-6M304 32l4-4M272 32l-4-4M310 46h6M266 46h-6" stroke="#FFB43A" strokeWidth={3} strokeLinecap="round" />
          <SvgText x={232} y={30} {...lb}>
            IT LIFTS
          </SvgText>
        </G>
      ) : (
        <G>
          <Path d="M70 64C118 40 170 30 232 30" {...ln} stroke={c.coral} strokeDasharray="12 10" />
          <Path d="M70 86C118 110 170 120 236 120" {...ln} stroke={c.mint} />
          <Circle cx={42} cy={75} r={28} fill={c.surface} stroke={c.ink} strokeWidth={2} />
          <SvgText x={42} y={72} {...lb}>
            ONE
          </SvgText>
          <SvgText x={42} y={86} {...lb}>
            SLIP
          </SvgText>
          <Circle cx={258} cy={30} r={23} fill={c.coralSoft} stroke={c.coral} strokeWidth={2} />
          <SvgText x={258} y={34} {...lb} fill={c.coralText} opacity={1}>
            MORE
          </SvgText>
          <Circle cx={258} cy={120} r={21} fill={c.mint} />
          <Path d="M249 120l6 6 12-13" fill="none" stroke="#fff" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
          <SvgText x={150} y={20} {...lb} fill={c.coralText} opacity={1}>
            “I BLEW IT”
          </SvgText>
          <SvgText x={150} y={146} {...lb} fill={c.mintText} opacity={1}>
            “JUST ONE SLIP”
          </SvgText>
        </G>
      )}
    </Svg>
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
            <View style={[s.mIc, { backgroundColor: m.done ? c.mint : c.surface2 }]}>
              <Icon name={m.icon} size={20} color={m.done ? '#FFFFFF' : c.ink} />
            </View>
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
