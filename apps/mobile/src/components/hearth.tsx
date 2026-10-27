/* Rekindle's hearth: the moment after a slip when the person presses and holds, and the fire catches again. Rebuilt on
   October 27, 2026 (the owner: "the celebration is really bad"). Relief and quiet strength, not a prize: no confetti, no
   success chime. It is built like a real fire, one beat at a time:
   - the hold (HOLD_MS): the coals glow hotter and a small flame licks up from them, the button fills from the left, and
     soft ticks under the finger come faster as it goes (a light knock at 40%, a firmer one at 75%);
   - the catch: a flash of white heat, the flame squashes for a frame and springs up past its size and settles, two
     knocks like a heartbeat (heavy, then soft), and warm light spreads out over the whole dark screen;
   - after: a swarm of embers rises and drifts, then a few keep rising for as long as the page is open, and the flame
     keeps flickering.
   With Reduce Motion on, the fire and the light simply fade up, with no flicker, flash or embers. A screen reader (or
   switch control) lights it with the button's own action. Gesture timing and haptics follow docs/plan.md ("Rekindle,
   rebuilt"). */
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Reanimated, {
  cancelAnimation,
  Easing,
  interpolateColor,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useFrameCallback,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { Text } from '@/components/text';
import { Icon } from '@/components/ui';
import { useReducedMotion } from '@/lib/motion';
import { font, useTheme } from '@/lib/theme';

export const HOLD_MS = 1400;
const WEB = Platform.OS === 'web';
const knock = (s: Haptics.ImpactFeedbackStyle) => void (WEB ? null : Haptics.impactAsync(s).catch(() => undefined));
const tick = () => void (WEB ? null : Haptics.selectionAsync().catch(() => undefined));

/* ---------- the hold ---------- */
export interface HearthHold {
  /** how far the hold has gone, 0 to 1 */
  h: SharedValue<number>;
  /** the catch, 0 to 1 (springs past 1 and settles) */
  k: SharedValue<number>;
  /** the white heat of the catch, up and gone in half a second */
  flash: SharedValue<number>;
  /** the squash of the catch */
  pop: SharedValue<number>;
  lit: boolean;
  label: string;
  light: () => void;
  start: () => void;
  stop: () => void;
  tap: () => void;
}
export function useHearthHold(lit: boolean, onLit: () => void): HearthHold {
  const reduce = useReducedMotion();
  const h = useSharedValue(lit ? 1 : 0);
  const k = useSharedValue(lit ? 1 : 0);
  const flash = useSharedValue(0);
  const pop = useSharedValue(0);
  const [label, setLabel] = useState('Press and hold to rekindle');
  const done = useRef(lit);
  /* the press began here (a finger, or a held key); a press with no start is a screen reader's click on the web */
  const held = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  useEffect(() => clear, []);
  const light = () => {
    if (done.current) return;
    done.current = true;
    clear();
    cancelAnimation(h);
    h.value = 1;
    if (reduce) k.value = withTiming(1, { duration: 400 });
    else {
      flash.value = withSequence(withTiming(1, { duration: 70 }), withTiming(0, { duration: 480, easing: Easing.out(Easing.quad) }));
      pop.value = withSequence(withTiming(1, { duration: 70 }), withSpring(0, { damping: 7, stiffness: 260 }));
      k.value = withSpring(1, { damping: 7, stiffness: 110, mass: 0.9 });
    }
    /* a heartbeat: heavy, then soft */
    knock(Haptics.ImpactFeedbackStyle.Heavy);
    timers.current.push(setTimeout(() => knock(Haptics.ImpactFeedbackStyle.Soft), 150));
    onLit();
  };
  const start = () => {
    if (done.current) return;
    held.current = true;
    setLabel('Keep holding');
    clear();
    /* ticks that come faster as the hold goes on, and two firmer knocks on the way */
    for (let t = 0; t < HOLD_MS - 60; t += 170 - 110 * (t / HOLD_MS)) timers.current.push(setTimeout(tick, t));
    timers.current.push(setTimeout(() => knock(Haptics.ImpactFeedbackStyle.Light), HOLD_MS * 0.4));
    timers.current.push(setTimeout(() => knock(Haptics.ImpactFeedbackStyle.Medium), HOLD_MS * 0.75));
    const from = h.value;
    h.value = withTiming(1, { duration: HOLD_MS * (1 - from), easing: Easing.linear }, (fin) => {
      if (fin) runOnJS(light)();
    });
  };
  const stop = () => {
    if (done.current) return;
    clear();
    cancelAnimation(h);
    h.value = withTiming(0, { duration: reduce ? 0 : 320, easing: Easing.out(Easing.quad) });
  };
  /* a quick tap (let go before the end) says what to do; it does not light it */
  const tap = () => {
    if (done.current) return;
    if (!held.current) return light();
    held.current = false;
    setLabel('Hold it down until it fills');
  };
  return { h, k, flash, pop, lit, label, light, start, stop, tap };
}

/* ---------- the hearth ---------- */
const H = 300;
/* the fire's base, from the top of the stage */
const BASE = H - 46;
const FW = 132;
const FH = 184;
/** the glow's middle, from the top of the stage */
const GLOW_Y = BASE - 70;

/* a small, fixed random, so the embers fall the same way every time */
function seeded(n: number) {
  let x = n * 9301 + 49297;
  return () => {
    x = (x * 9301 + 49297) % 233280;
    return x / 233280;
  };
}
type Ember = { x0: number; drift: number; f: number; ph: number; rise: number; life: number; delay: number; size: number; loop: boolean; gap: number };
const EMBERS: Ember[] = (() => {
  const r = seeded(7);
  return Array.from({ length: 26 }, (_, i) => ({
    x0: (r() - 0.5) * 56,
    drift: 8 + r() * 22,
    f: 0.5 + r() * 0.9,
    ph: r() * 6.28,
    rise: 170 + r() * 190,
    life: 1.3 + r() * 1.2,
    /* most rise together in the first half second; the rest trail after */
    delay: i < 16 ? 0.05 + r() * 0.45 : 0.5 + r() * 1.4,
    size: 3 + r() * 4.5,
    /* a third keep rising for as long as the page is open */
    loop: i % 3 === 0,
    gap: 0.4 + r() * 1.4,
  }));
})();

/** the fire, down to coals, that catches when the hold fills; it lights the dark screen around it */
export function Hearth({ hold }: { hold: HearthHold }) {
  const reduce = useReducedMotion();
  const { h, k, flash, pop } = hold;
  /* seconds since the page opened, and when the fire caught (-1 until then) */
  const t = useSharedValue(0);
  const born = useSharedValue(hold.lit ? -10 : -1);
  useFrameCallback((f) => {
    t.value = (f.timeSinceFirstFrame || 0) / 1000;
  }, !reduce);
  useAnimatedReaction(
    () => k.value > 0.02,
    (on, was) => {
      if (on && !was && born.value === -1) born.value = t.value;
    },
  );

  /* the whole room warms once it catches; before that, only a little, as the hold goes */
  const room = useAnimatedStyle(() => ({
    opacity: Math.min(1, 0.1 * h.value + 0.9 * Math.min(1, k.value)),
    transform: [{ scale: 0.75 + 0.25 * Math.min(1, k.value) }],
  }));
  const hot = useAnimatedStyle(() => {
    const fl = reduce ? 0 : 0.06 * Math.sin(t.value * 6.1) + 0.04 * Math.sin(t.value * 13.7);
    const kk = Math.min(1, k.value);
    /* it sits low on the coals while they are all there is, and rises with the flame */
    return {
      opacity: Math.max(0, Math.min(1, 0.5 * h.value + 0.45 * kk + fl * kk)),
      transform: [{ translateY: 56 * (1 - kk) }, { scale: 0.55 + 0.25 * h.value + 0.35 * kk }],
    };
  });
  const white = useAnimatedStyle(() => ({ opacity: 0.95 * flash.value, transform: [{ scale: 0.6 + 0.9 * flash.value }] }));
  /* the embers under the logs: glowing low and breathing slowly even before the hold (embers hold the heat) */
  const bed = useAnimatedStyle(() => ({
    opacity: Math.min(1, 0.5 + 0.5 * Math.max(h.value, Math.min(1, k.value)) + (reduce ? 0 : 0.14 * Math.sin(t.value * 1.7))),
  }));
  /* the logs: dark, then hotter as the hold goes, and breathing a little once it burns */
  const coals = useAnimatedStyle(() => ({
    opacity: Math.max(h.value, Math.min(1, k.value)) * (reduce ? 1 : 0.92 + 0.08 * Math.sin(t.value * 3.3)),
  }));
  /* the flame: a small lick over the coals while held, then full size with a spring past it */
  const fire = useAnimatedStyle(() => {
    const s0 = 0.06 + 0.36 * h.value;
    const s = s0 + (1 - s0) * k.value;
    return {
      /* nothing but coals until the hold starts */
      opacity: Math.min(1, 4 * h.value + k.value),
      transform: [{ scaleX: Math.max(0.05, s * (1 + 0.14 * pop.value)) }, { scaleY: Math.max(0.05, s * (1 - 0.18 * pop.value)) }],
    };
  });

  return (
    <View
      style={s.stage}
      pointerEvents="none"
      accessible
      accessibilityRole="image"
      accessibilityLabel={hold.lit ? 'Your fire, burning again' : 'Your fire, down to coals'}>
      {/* the warm light over the whole screen */}
      <Reanimated.View style={[s.room, room]}>
        <Glow
          id="hRoom"
          size={ROOM}
          stops={[
            ['#FF9A3C', 0.5],
            ['#FF7A2A', 0.2, 0.32],
            ['#C2410C', 0.07, 0.62],
            ['#C2410C', 0, 1],
          ]}
        />
      </Reanimated.View>
      <Reanimated.View style={[s.hot, hot]}>
        <Glow
          id="hHot"
          size={HOT}
          stops={[
            ['#FFD27A', 0.85],
            ['#FFA23C', 0.4, 0.4],
            ['#FF7A2A', 0, 1],
          ]}
        />
      </Reanimated.View>
      {reduce ? null : EMBERS.map((e, i) => <Spark key={i} e={e} i={i} t={t} born={born} />)}
      <Reanimated.View style={[s.fire, fire]}>
        <Tongue t={t} reduce={reduce} a={0.05} b={0.035} sk={2.5} ph={0} d={FLAME_OUT} id="fOut" c={['#FF4D2A', '#FF8A33']} />
        <Tongue t={t} reduce={reduce} a={0.07} b={0.05} sk={3.5} ph={1.7} d={FLAME_MID} id="fMid" c={['#FF9A2E', '#FFC94A']} />
        <Tongue t={t} reduce={reduce} a={0.09} b={0.06} sk={4.5} ph={3.1} d={FLAME_CORE} id="fCore" c={['#FFE27A', '#FFF8E0']} />
      </Reanimated.View>
      <View style={s.coals}>
        <Reanimated.View style={[StyleSheet.absoluteFill, bed]}>
          <Svg width={COAL_W} height={COAL_H}>
            <Defs>
              <RadialGradient id="cBed" cx="50%" cy="50%" r="50%">
                <Stop offset="0" stopColor="#FFC25A" stopOpacity={0.95} />
                <Stop offset="0.5" stopColor="#FF6A2A" stopOpacity={0.7} />
                <Stop offset="1" stopColor="#FF5A2A" stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Ellipse cx={96} cy={53} rx={88} ry={15} fill="url(#cBed)" />
            {[70, 96, 122, 83, 109].map((x, j) => (
              <Ellipse key={x} cx={x} cy={j < 3 ? 52 : 57} rx={7} ry={3} fill="#FF7A2A" />
            ))}
          </Svg>
        </Reanimated.View>
        <Coals look="dark" />
        <Reanimated.View style={[StyleSheet.absoluteFill, bed]}>
          <Coals look="cracks" />
        </Reanimated.View>
        <Reanimated.View style={[StyleSheet.absoluteFill, coals]}>
          <Coals look="hot" />
        </Reanimated.View>
      </View>
      <Reanimated.View style={[s.flash, white]}>
        <Glow
          id="hFlash"
          size={FLASH}
          stops={[
            ['#FFFFFF', 1],
            ['#FFF2C4', 0.6, 0.35],
            ['#FFD27A', 0, 1],
          ]}
        />
      </Reanimated.View>
    </View>
  );
}

const ROOM = 1100;
const HOT = 330;
const FLASH = 260;

/** a round glow: a radial gradient from its middle out to nothing */
function Glow({ id, size, stops }: { id: string; size: number; stops: [string, number, number?][] }) {
  return (
    <Svg width={size} height={size}>
      <Defs>
        <RadialGradient id={id} cx="50%" cy="50%" r="50%">
          {stops.map(([c, o, at], j) => (
            <Stop key={j} offset={at ?? 0} stopColor={c} stopOpacity={o} />
          ))}
        </RadialGradient>
      </Defs>
      <Ellipse cx={size / 2} cy={size / 2} rx={size / 2} ry={size / 2} fill={`url(#${id})`} />
    </Svg>
  );
}

/* the flame's three tongues (a 100 by 140 box, the base at the bottom middle) */
const FLAME_OUT =
  'M50 0C57 22 71 31 79 52C89 77 88 106 74 123C66 133 58 139 50 139C42 139 34 133 26 123C11 105 12 77 22 58C26 70 32 76 38 78C32 57 38 30 50 0Z';
const FLAME_MID =
  'M50 30C56 49 66 58 71 77C76 99 70 118 60 128C56 132 53 135 50 135C47 135 44 132 40 128C30 118 26 100 32 84C35 92 40 96 44 96C40 78 44 55 50 30Z';
const FLAME_CORE = 'M50 70C54 84 62 93 62 109C62 123 56 133 50 133C44 133 38 123 38 111C38 98 46 88 50 70Z';

/** one tongue of the flame, flickering on its own rhythm */
function Tongue({
  t,
  reduce,
  a,
  b,
  sk,
  ph,
  d,
  id,
  c,
}: {
  t: SharedValue<number>;
  reduce: boolean;
  a: number;
  b: number;
  sk: number;
  ph: number;
  d: string;
  id: string;
  c: [string, string];
}) {
  const st = useAnimatedStyle(() => {
    if (reduce) return {};
    const x = t.value;
    return {
      transform: [
        { scaleY: 1 + a * (0.6 * Math.sin(x * 7.3 + ph) + 0.4 * Math.sin(x * 12.1 + ph * 2)) },
        { scaleX: 1 + b * Math.sin(x * 9.7 + ph * 1.3) },
        { skewX: sk * Math.sin(x * 4.9 + ph) + 'deg' },
      ],
    };
  });
  return (
    <Reanimated.View style={[StyleSheet.absoluteFill, s.tongue, st]}>
      <Svg width={FW} height={FH} viewBox="0 0 100 140">
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={c[0]} />
            <Stop offset="1" stopColor={c[1]} />
          </LinearGradient>
        </Defs>
        <Path d={d} fill={`url(#${id})`} />
      </Svg>
    </Reanimated.View>
  );
}

/* the cracks along each log, where the heat shows through (in the log's own box) */
const CRACKS = ['M44 36l4 2 3-1 4 3', 'M70 44l3-1 2 1', 'M90 41l5-2 2 2 5-1', 'M117 34l2 3 5 1', 'M139 43l4-2 3 1 3-2'];
/** the wood under the fire: two crossed logs, charred dark, their glowing cracks, or the whole log hot */
function Coals({ look }: { look: 'dark' | 'cracks' | 'hot' }) {
  const id = 'c' + look;
  return (
    <Svg width={COAL_W} height={COAL_H} viewBox={`0 0 ${COAL_W} ${COAL_H}`}>
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={look === 'hot' ? '#FF9A4A' : '#3A2438'} />
          <Stop offset="1" stopColor={look === 'hot' ? '#9A2A16' : '#170C1E'} />
        </LinearGradient>
      </Defs>
      {[-11, 11].map((r) => (
        <G key={r} rotation={r} origin="96, 38">
          {look === 'cracks' ? (
            <>
              {/* the cracks */}
              {CRACKS.map((d) => (
                <G key={d}>
                  <Path d={d} stroke="#FF5A2A" strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.4} />
                  <Path d={d} stroke="#FFA04A" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </G>
              ))}
              <Ellipse cx={r < 0 ? 29 : 163} cy={38.5} rx={3} ry={6} fill="#FF8A3C" />
            </>
          ) : (
            <>
              <Rect x={24} y={29} width={144} height={19} rx={9.5} fill={`url(#${id})`} />
              {/* the cut ends: charred rings, or glowing */}
              <Ellipse cx={r < 0 ? 29 : 163} cy={38.5} rx={5} ry={9} fill={look === 'hot' ? '#FFD27A' : '#2A1A2E'} />
            </>
          )}
        </G>
      ))}
    </Svg>
  );
}
const COAL_W = 192;
const COAL_H = 66;

/** one ember: it rises from the fire, drifting side to side, from white-hot to red, and fades */
function Spark({ e, i, t, born }: { e: Ember; i: number; t: SharedValue<number>; born: SharedValue<number> }) {
  const st = useAnimatedStyle(() => {
    if (born.value < 0) return { opacity: 0 };
    const age = t.value - born.value - e.delay;
    if (age < 0) return { opacity: 0 };
    const cycle = e.life + e.gap;
    if (!e.loop && age > e.life) return { opacity: 0 };
    const p = (age % cycle) / e.life;
    if (p > 1) return { opacity: 0 };
    const up = 1 - Math.pow(1 - p, 1.6);
    const fade = (p < 0.08 ? p / 0.08 : 1) * Math.pow(1 - p, 1.2) * (0.7 + 0.3 * Math.sin(t.value * 23 + i));
    return {
      opacity: fade,
      backgroundColor: interpolateColor(p, [0, 0.35, 1], ['#FFF4C2', '#FFB13C', '#FF5A2A']),
      transform: [{ translateX: e.x0 * (1 + p * 0.6) + e.drift * p * Math.sin(p * e.f * 6.28 + e.ph) }, { translateY: -e.rise * up }, { scale: 1 - 0.5 * p }],
    };
  });
  return <Reanimated.View style={[s.spark, { width: e.size, height: e.size, borderRadius: e.size / 2, marginLeft: -e.size / 2 }, st]} />;
}

/** the one big button: press and hold until it fills */
export function HoldButton({ hold }: { hold: HearthHold }) {
  const c = useTheme();
  const { h } = hold;
  const fill = useAnimatedStyle(() => ({ transform: [{ scaleX: h.value }] }));
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
      <Reanimated.View style={[s.holdFill, fill]} />
      <View style={s.holdIn}>
        <Icon name="flame" size={24} color={c.onSun} />
        <Text style={[s.holdT, { color: c.onSun }]}>{hold.label}</Text>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  stage: { alignSelf: 'stretch', height: H, alignItems: 'center' },
  room: { position: 'absolute', top: GLOW_Y - ROOM / 2, left: '50%', marginLeft: -ROOM / 2, width: ROOM, height: ROOM },
  hot: { position: 'absolute', top: GLOW_Y - HOT / 2, left: '50%', marginLeft: -HOT / 2, width: HOT, height: HOT },
  flash: { position: 'absolute', top: GLOW_Y + 20 - FLASH / 2, left: '50%', marginLeft: -FLASH / 2, width: FLASH, height: FLASH },
  fire: { position: 'absolute', top: BASE - FH + 8, left: '50%', marginLeft: -FW / 2, width: FW, height: FH, transformOrigin: 'bottom' },
  tongue: { transformOrigin: 'bottom' },
  coals: { position: 'absolute', top: BASE - 20, left: '50%', marginLeft: -COAL_W / 2, width: COAL_W, height: COAL_H },
  spark: { position: 'absolute', top: BASE - 30, left: '50%' },
  hold: { width: '100%', minHeight: 76, borderRadius: 22, overflow: 'hidden', justifyContent: 'center' },
  holdFill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#FF9A3C', transformOrigin: 'left' },
  holdIn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 16 },
  holdT: { fontFamily: font.display, fontSize: 19 },
});
