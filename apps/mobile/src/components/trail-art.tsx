/* The trail's pictures (core trail.ts): one night landscape a craving walks a person down, the same everywhere it shows, so
   it is learned once. Five places, each an object a person can see with their eyes closed: Drift's post of four lights,
   Spark's spark and the bright doorway out, Preview's frame that glows too bright, Case's door with a knock at it, and
   Steps' stairs with a green side path off them. Every exit leads home: a small house with a lit window. The person's own
   flame is the "you are here", and it walks where they touch.

   The colors are the world's own and do not change with the theme: the trail is always at night. Everything that moves
   has a still version under Reduce Motion, and nothing still looks alive. */
import { TRAIL, TRAIL_LIGHTS, TRAIL_PLACES, type TrailLen, type TrailPlace } from '@daybook/core';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Easing, PanResponder, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Reanimated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import Svg, { Circle, Defs, Ellipse, G, Line, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { BigFlame } from '@/components/big-flame';
import { Text } from '@/components/text';
import { buzz } from '@/lib/feel';
import { NATIVE, SPRING, useReducedMotion } from '@/lib/motion';
import { font, MAX_WIDTH } from '@/lib/theme';

/** the world's colors: always night */
export const TW = {
  path: '#3B3393',
  dash: '#5A50B8',
  post: '#6A60C0',
  frame: '#8C80E0',
  panel: '#4B3FA8',
  box: '#2C2768',
  room: '#1E1860',
  dim: '#4A4590',
  sun: '#FFD25A',
  amber: '#FFB347',
  mint: '#5EE0B5',
  coral: '#FF9A8D',
  warm: '#FFC874',
  cream: '#FFF6E6',
  ground: '#17124A',
  ink: '#F7F3FF',
  muted: '#CFC8F2',
  bubble: '#221E58',
  paperInk: '#2A2350',
};

/** the width a picture has: the screen less its margins, never wider than the page */
export function useArtWidth() {
  const { width } = useWindowDimensions();
  return Math.min(width, MAX_WIDTH) - 32;
}

/** a value that loops 0 to 1 and back while `on`, for the few things that are alive (a spark, a knock, a window); still
    under Reduce Motion */
function useLoop(on: boolean, ms: number) {
  const reduce = useReducedMotion();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!on || reduce) {
      v.setValue(0);
      return;
    }
    const a = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: ms / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
        Animated.timing(v, { toValue: 0, duration: ms / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
      ]),
    );
    a.start();
    return () => a.stop();
  }, [on, reduce, ms, v]);
  return v;
}

/* ---------- the small drawings of each place ---------- */
/** one place's object, small, centered on (0, 0) with its foot at y = 0, for the map and the small trail */
function PlaceGlyph({ id }: { id: TrailPlace }) {
  if (id === 'drift')
    return (
      <G>
        <Rect x={-24} y={-30} width={48} height={4} rx={2} fill={TW.post} />
        {[-18, -6, 6, 18].map((x, i) => (
          <Rect key={x} x={x - 5.5} y={-24} width={11} height={16} rx={4} fill={i === 2 ? TW.dim : TW.sun} />
        ))}
      </G>
    );
  if (id === 'spark') return <Path d="M0 -34 L5 -18 L20 -14 L5 -10 L0 6 L-5 -10 L-20 -14 L-5 -18Z" fill={TW.sun} />;
  if (id === 'preview')
    return (
      <G>
        <Rect x={-26} y={-34} width={52} height={38} rx={6} fill={TW.box} stroke={TW.frame} strokeWidth={3} />
        <Rect x={-21} y={-29} width={42} height={28} rx={3} fill="url(#trAd)" />
      </G>
    );
  if (id === 'case')
    return (
      <G>
        <Path d="M-18 6 L-18 -24 Q-18 -38 0 -38 Q18 -38 18 -24 L18 6Z" fill={TW.panel} stroke={TW.frame} strokeWidth={3} />
        <Circle cx={9} cy={-12} r={2.6} fill={TW.sun} />
      </G>
    );
  return (
    <G>
      {[0, 1, 2, 3].map((i) => (
        <Rect key={i} x={-22 + i * 11} y={-30 + i * 9} width={16} height={6} rx={2} fill={TW.frame} />
      ))}
    </G>
  );
}

/** the glow of the preview, used by the small drawing and the frame */
function AdDefs() {
  return (
    <Defs>
      <RadialGradient id="trAd" cx="50%" cy="50%" r="60%">
        <Stop offset="0" stopColor="#FFE9B0" />
        <Stop offset="0.45" stopColor={TW.coral} />
        <Stop offset="1" stopColor="#B05AC8" />
      </RadialGradient>
      <RadialGradient id="trGlow" cx="50%" cy="50%" r="50%">
        <Stop offset="0" stopColor={TW.sun} stopOpacity={0.55} />
        <Stop offset="1" stopColor={TW.sun} stopOpacity={0} />
      </RadialGradient>
      <RadialGradient id="trAdGlow" cx="50%" cy="50%" r="50%">
        <Stop offset="0" stopColor={TW.coral} stopOpacity={0.45} />
        <Stop offset="1" stopColor={TW.coral} stopOpacity={0} />
      </RadialGradient>
      <RadialGradient id="trMint" cx="50%" cy="50%" r="50%">
        <Stop offset="0" stopColor={TW.mint} stopOpacity={0.45} />
        <Stop offset="1" stopColor={TW.mint} stopOpacity={0} />
      </RadialGradient>
      <RadialGradient id="trHome" cx="50%" cy="50%" r="50%">
        <Stop offset="0" stopColor={TW.warm} stopOpacity={0.5} />
        <Stop offset="1" stopColor={TW.warm} stopOpacity={0} />
      </RadialGradient>
    </Defs>
  );
}

/* ---------- Where is it now: the trail, top to bottom, and the flame walks to the place touched ---------- */
const MAP_W = 358;
const MAP_H = 440;
const MAP_PTS: [number, number][] = [
  [96, 50],
  [262, 134],
  [96, 218],
  [262, 302],
  [96, 386],
];
const MAP_PATH = 'M96 50 C96 102 262 82 262 134 C262 186 96 166 96 218 C96 270 262 250 262 302 C262 354 96 334 96 386 C96 404 112 414 128 420';
/** the flame stands beside a place, on the trail's side away from its name */
const FLAME_AT = (i: number): [number, number] => (i % 2 ? [MAP_PTS[i][0] + 62, MAP_PTS[i][1] + 6] : [MAP_PTS[i][0] - 62, MAP_PTS[i][1] + 6]);

export function TrailMap({ at, level, onPick }: { at: TrailPlace | null; level: number; onPick: (p: TrailPlace) => void }) {
  const w = Math.min(useArtWidth(), 400);
  const k = w / MAP_W;
  const reduce = useReducedMotion();
  const i = at ? TRAIL_PLACES.indexOf(at) : -1;
  /* before a place is touched, the flame waits at the top of the trail */
  const home: [number, number] = i >= 0 ? FLAME_AT(i) : [MAP_PTS[0][0] - 62, MAP_PTS[0][1] - 30];
  const x = useRef(new Animated.Value(home[0])).current;
  const y = useRef(new Animated.Value(home[1])).current;
  useEffect(() => {
    if (reduce) {
      x.setValue(home[0]);
      y.setValue(home[1]);
      return;
    }
    Animated.parallel([
      Animated.spring(x, { toValue: home[0], ...SPRING.slow, useNativeDriver: NATIVE }),
      Animated.spring(y, { toValue: home[1], ...SPRING.slow, useNativeDriver: NATIVE }),
    ]).start();
  }, [home[0], home[1], reduce, x, y]); // eslint-disable-line react-hooks/exhaustive-deps
  const FL = 72;
  return (
    <View style={{ width: w, height: MAP_H * k, alignSelf: 'center' }}>
      <Svg width={w} height={MAP_H * k} viewBox={`0 0 ${MAP_W} ${MAP_H}`}>
        <AdDefs />
        <Path d={MAP_PATH} stroke={TW.path} strokeWidth={14} fill="none" strokeLinecap="round" />
        <Path d={MAP_PATH} stroke={TW.dash} strokeWidth={2} strokeDasharray="2 10" fill="none" strokeLinecap="round" />
        {/* every place has an exit: a short green path off the trail */}
        {MAP_PTS.map(([px, py], j) => {
          const out = j % 2 ? 1 : -1;
          return (
            <Path
              key={'e' + j}
              d={`M${px + out * 30} ${py + 26} q${out * 14} 10 ${out * 40} 12`}
              stroke={TW.mint}
              strokeWidth={4}
              fill="none"
              strokeLinecap="round"
              opacity={0.75}
            />
          );
        })}
        {MAP_PTS.map(([px, py], j) => (
          <G key={j}>
            <Circle cx={px} cy={py} r={38} fill={j === i ? '#3B3185' : TW.box} />
            {j === i ? <Circle cx={px} cy={py} r={48} fill="none" stroke={TW.sun} strokeWidth={3} strokeDasharray="4 7" /> : null}
            <G transform={`translate(${px},${py + 14})`}>
              <PlaceGlyph id={TRAIL_PLACES[j]} />
            </G>
          </G>
        ))}
      </Svg>
      {MAP_PTS.map(([px, py], j) => {
        const id = TRAIL_PLACES[j];
        const right = j % 2 === 0;
        return (
          <Pressable
            key={id}
            accessibilityRole="button"
            accessibilityState={{ selected: j === i }}
            accessibilityLabel={TRAIL[id].name + '. ' + TRAIL[id].means + '. It sounds like: ' + TRAIL[id].hear}
            onPress={() => {
              buzz('tick');
              onPick(id);
            }}
            hitSlop={4}
            style={[
              s.mapHit,
              {
                left: (right ? px - 44 : 4) * k,
                top: (py - 40) * k,
                width: (right ? MAP_W - 4 - (px - 44) : px + 44 - 4) * k,
                height: 80 * k,
                flexDirection: right ? 'row' : 'row-reverse',
              },
            ]}>
            <View style={{ width: 88 * k }} />
            <View style={s.mapWords}>
              <Text style={[s.mapName, { color: j === i ? TW.sun : TW.ink, textAlign: right ? 'left' : 'right' }]}>{TRAIL[id].name}</Text>
              <Text style={[s.mapMeans, { textAlign: right ? 'left' : 'right' }]}>{TRAIL[id].means}</Text>
            </View>
          </Pressable>
        );
      })}
      <Animated.View
        pointerEvents="none"
        style={[
          s.abs,
          { width: FL, height: FL, marginLeft: -FL / 2, marginTop: -FL + 6 },
          { transform: [{ translateX: Animated.multiply(x, k) }, { translateY: Animated.multiply(y, k) }] },
        ]}>
        <BigFlame level={level} size={FL} />
      </Animated.View>
    </View>
  );
}

/* ---------- the small trail at the top of a place: where you are, and a way back to the map ---------- */
const MINI_PTS: [number, number][] = [
  [14, 12],
  [52, 17],
  [90, 22],
  [128, 27],
  [166, 32],
];
export function MiniTrail({ at, onPress }: { at: TrailPlace; onPress: () => void }) {
  const i = TRAIL_PLACES.indexOf(at);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={'At ' + TRAIL[at].name + ', place ' + (i + 1) + ' of 5. Show the trail.'}
      onPress={() => {
        buzz('tap');
        onPress();
      }}
      hitSlop={8}>
      <Svg width={180} height={44} viewBox="0 0 180 44">
        <Path d="M4 11 C40 14 70 19 100 23 S150 30 176 34" stroke={TW.path} strokeWidth={6} fill="none" strokeLinecap="round" />
        {MINI_PTS.map(([x, y], j) =>
          j === i ? (
            <G key={j} transform={`translate(${x},${y + 5})`}>
              <Circle cy={-7} r={12} fill={TW.sun} opacity={0.22} />
              <Path d="M0 -17 C4.5 -11 8.5 -7.5 7.5 -2 C6.8 2.5 3.5 5 0 5 C-3.5 5 -6.8 2.5 -7.5 -2 C-8.3 -7 -3.5 -10 0 -17Z" fill="#FF8A3C" />
              <Path d="M0 -9.5 C2.2 -6 4.2 -3.5 3.8 -0.5 C3.2 2.2 1.8 3.2 0 3.2 C-1.8 3.2 -3.2 2.2 -3.8 -0.5 C-4 -3.5 -1.8 -5.5 0 -9.5Z" fill={TW.sun} />
            </G>
          ) : (
            <Circle key={j} cx={x} cy={y} r={4.5} fill={j < i ? TW.frame : TW.dim} />
          ),
        )}
      </Svg>
    </Pressable>
  );
}

/* ---------- Drift: four lights on a post, one low ---------- */
type Light = (typeof TRAIL_LIGHTS)[number]['id'];
export function DriftArt({ low, filled, onPick }: { low: Light | null; filled: boolean; onPick: (l: Light) => void }) {
  const w = Math.min(useArtWidth(), 400);
  const k = w / 358;
  return (
    <View style={{ width: w, height: 250 * k, alignSelf: 'center' }}>
      <Svg width={w} height={250 * k} viewBox="0 0 358 250">
        <AdDefs />
        <Rect x={174} y={20} width={10} height={196} rx={5} fill={TW.post} />
        <Rect x={24} y={20} width={310} height={10} rx={5} fill={TW.post} />
        <Ellipse cx={179} cy={220} rx={60} ry={8} fill="#0B0926" opacity={0.4} />
        {TRAIL_LIGHTS.map((l, j) => {
          const x = 59 + j * 80;
          return <Line key={l.id} x1={x} y1={30} x2={x} y2={52} stroke={TW.post} strokeWidth={3} />;
        })}
      </Svg>
      {TRAIL_LIGHTS.map((l, j) => (
        <Lamp key={l.id} x={(59 + j * 80) * k} k={k} label={l.label} state={low === l.id ? (filled ? 'filled' : 'low') : 'lit'} onPress={() => onPick(l.id)} />
      ))}
    </View>
  );
}

/** one light: lit, low (the one picked, an outline waiting to be filled), or filled again (it lights up with a pop) */
function Lamp({ x, k, label, state, onPress }: { x: number; k: number; label: string; state: 'lit' | 'low' | 'filled'; onPress: () => void }) {
  const reduce = useReducedMotion();
  const v = useRef(new Animated.Value(state === 'low' ? 0 : 1)).current;
  useEffect(() => {
    const to = state === 'low' ? 0 : 1;
    if (reduce) v.setValue(to);
    else Animated.spring(v, { toValue: to, ...SPRING.default, useNativeDriver: NATIVE }).start();
  }, [state, reduce, v]);
  const W = 48 * k;
  const H = 66 * k;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: state !== 'lit' }}
      accessibilityLabel={label + (state === 'low' ? ', low' : state === 'filled' ? ', filled' : '')}
      onPress={() => {
        buzz('tick');
        onPress();
      }}
      hitSlop={10}
      style={[s.lamp, { left: x - 40 * k, top: 40 * k, width: 80 * k }]}>
      <View style={{ width: W, height: H }}>
        {/* the low one: an outline, waiting */}
        <View style={[StyleSheet.absoluteFill, s.lampLow, { borderRadius: 16 * k }]} />
        {/* lit: the light and its glow, which fade out when it is the low one and pop back when it is filled */}
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: v, transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }] }]}>
          <View pointerEvents="none" style={[s.abs, { left: W / 2 - W * 1.3, top: H / 2 - W * 1.3 }]}>
            <Svg width={W * 2.6} height={W * 2.6} viewBox="-50 -50 100 100">
              <AdDefs />
              <Circle r={50} fill="url(#trGlow)" />
            </Svg>
          </View>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: TW.sun, borderRadius: 16 * k }]} />
        </Animated.View>
      </View>
      <Text style={[s.lampT, { color: state === 'low' ? TW.sun : TW.muted }]}>{label}</Text>
    </Pressable>
  );
}

/* ---------- Spark: a spark in a dark room, a bright doorway out, and the phone stays ---------- */
export function SparkArt({ out, level }: { out: boolean; level: number }) {
  const w = Math.min(useArtWidth(), 400);
  const k = w / 358;
  const reduce = useReducedMotion();
  const twinkle = useLoop(!out, 1600);
  const go = useRef(new Animated.Value(out ? 1 : 0)).current;
  useEffect(() => {
    if (reduce) go.setValue(out ? 1 : 0);
    else Animated.timing(go, { toValue: out ? 1 : 0, duration: 900, easing: Easing.inOut(Easing.cubic), useNativeDriver: NATIVE }).start();
  }, [out, reduce, go]);
  const FL = 64;
  return (
    <View style={{ width: w, height: 290 * k, alignSelf: 'center' }} accessible accessibilityLabel={TRAIL.spark.see}>
      <Svg width={w} height={290 * k} viewBox="0 0 358 290">
        <Defs>
          <LinearGradient id="trDoor" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={TW.cream} />
            <Stop offset="1" stopColor={TW.warm} />
          </LinearGradient>
        </Defs>
        <Rect x={20} y={10} width={318} height={250} rx={20} fill={TW.room} />
        <Rect x={206} y={40} width={106} height={220} rx={10} fill="url(#trDoor)" />
        <Path d="M120 238 C160 240 190 244 226 246" stroke={TW.mint} strokeWidth={4} strokeLinecap="round" fill="none" strokeDasharray="2 9" />
        <G transform="rotate(-8 66 236)">
          <Rect x={52} y={216} width={28} height={42} rx={6} fill={TW.dim} />
          <Rect x={56} y={221} width={20} height={30} rx={3} fill="#1A1450" />
        </G>
      </Svg>
      <Animated.View
        pointerEvents="none"
        style={[
          s.abs,
          { left: 100 * k - 60, top: 150 * k - 60, width: 120, height: 120, alignItems: 'center', justifyContent: 'center' },
          { opacity: go.interpolate({ inputRange: [0, 1], outputRange: [1, 0.35] }) },
          { transform: [{ scale: twinkle.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }) }] },
        ]}>
        <Svg width={120} height={120} viewBox="-60 -60 120 120">
          <AdDefs />
          <Circle r={56} fill="url(#trGlow)" />
          <Path d="M0 -30 L7 -7 L30 0 L7 7 L0 30 L-7 7 L-30 0 L-7 -7Z" fill={TW.sun} />
        </Svg>
      </Animated.View>
      <Text style={[s.small, s.abs, { left: 34 * k, top: 266 * k, color: TW.muted }]}>the phone stays</Text>
      <Animated.View
        pointerEvents="none"
        style={[
          s.abs,
          { left: -FL / 2, top: 250 * k - FL, width: FL, height: FL },
          { transform: [{ translateX: go.interpolate({ inputRange: [0, 1], outputRange: [150 * k, 259 * k] }) }] },
        ]}>
        <BigFlame level={level} size={FL} />
      </Animated.View>
    </View>
  );
}

/* ---------- Preview: a frame that glows too bright, and the person's own picture slides over it ---------- */
export function PreviewArt({ p, caption }: { p: Animated.Value; caption: string }) {
  const w = Math.min(useArtWidth(), 400);
  const k = w / 358;
  const FW = 330 * k;
  const FH = 210 * k;
  const IW = FW - 20 * k;
  const IH = FH - 20 * k;
  return (
    <View style={{ width: w, alignSelf: 'center', alignItems: 'center', gap: 14 }} accessible accessibilityLabel={TRAIL.preview.see + ' ' + caption}>
      <View style={{ width: FW, height: FH }}>
        <View style={[StyleSheet.absoluteFill, s.frame, { borderRadius: 20 * k }]} />
        <View style={[s.abs, { left: 10 * k, top: 10 * k, width: IW, height: IH, borderRadius: 12 * k, overflow: 'hidden' }]}>
          <Svg width={IW} height={IH} viewBox="0 0 310 190" preserveAspectRatio="none">
            <Defs>
              <LinearGradient id="trDawn" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#7DBDFF" />
                <Stop offset="0.7" stopColor="#FFE3B0" />
              </LinearGradient>
            </Defs>
            <Rect width={310} height={190} fill="url(#trDawn)" />
            <Circle cx={230} cy={120} r={34} fill={TW.sun} />
            <Path d="M0 140 C70 110 130 130 190 120 S280 110 310 120 L310 190 L0 190Z" fill="#14956F" />
            <Path d="M0 160 C80 145 160 165 310 150 L310 190 L0 190Z" fill="#0F8060" />
            <G transform="translate(210,156) scale(.9)">
              <Circle cx={0} cy={-26} r={7} fill={TW.paperInk} />
              <Path d="M0 -18 L0 4 M0 -12 L-10 -2 M0 -12 L10 -24 M0 4 L-7 18 M0 4 L7 18" stroke={TW.paperInk} strokeWidth={4} strokeLinecap="round" />
            </G>
          </Svg>
          {/* the preview's glow, cut back from the right as the picture slides over it */}
          <Animated.View
            style={[s.abs, { left: 0, top: 0, height: IH, overflow: 'hidden', width: p.interpolate({ inputRange: [0, 1], outputRange: [IW, 0] }) }]}>
            <Svg width={IW} height={IH} viewBox="0 0 310 190" preserveAspectRatio="none">
              <Defs>
                <RadialGradient id="trBright" cx="45%" cy="50%" r="70%">
                  <Stop offset="0" stopColor="#FFF2D0" />
                  <Stop offset="0.35" stopColor="#FFC2A8" />
                  <Stop offset="0.7" stopColor={TW.coral} />
                  <Stop offset="1" stopColor="#B05AC8" />
                </RadialGradient>
              </Defs>
              <Rect width={310} height={190} fill="url(#trBright)" />
            </Svg>
          </Animated.View>
          <Animated.View
            style={[
              s.abs,
              s.edge,
              {
                height: IH,
                left: p.interpolate({ inputRange: [0, 1], outputRange: [IW - 2, -6] }),
                opacity: p.interpolate({ inputRange: [0, 0.98, 1], outputRange: [0, 1, 0] }),
              },
            ]}
          />
        </View>
      </View>
      <Text style={[s.cap, { color: TW.muted }]}>{caption}</Text>
    </View>
  );
}

/** the slider that brings the picture over: drag the knob across, or let a screen reader do it in one step */
export function PictureSlider({ p, onDone }: { p: Animated.Value; onDone: () => void }) {
  const KNOB = 48;
  const [w, setW] = useState(useArtWidth());
  /* the track's real width, read by the drag as it happens */
  const room = useRef(w - KNOB - 8);
  room.current = w - KNOB - 8;
  const x = useRef(0);
  const done = useRef(false);
  const reduce = useReducedMotion();
  const finish = () => {
    if (done.current) return;
    done.current = true;
    buzz('save');
    if (reduce) p.setValue(1);
    else Animated.timing(p, { toValue: 1, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
    onDone();
  };
  const end = () => {
    if (x.current / room.current > 0.8) finish();
    else Animated.spring(p, { toValue: 0, ...SPRING.default, useNativeDriver: false }).start();
  };
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !done.current,
      onMoveShouldSetPanResponder: () => !done.current,
      onPanResponderGrant: () => buzz('tick'),
      onPanResponderMove: (_, g) => {
        x.current = Math.max(0, Math.min(room.current, g.dx));
        p.setValue(x.current / room.current);
      },
      /* the page under it scrolls: the drag keeps the finger until it lets go */
      onPanResponderTerminationRequest: () => false,
      onPanResponderRelease: () => end(),
      onPanResponderTerminate: () => end(),
    }),
  ).current;
  return (
    <View
      style={s.slide}
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel="Slide your picture over it"
      accessibilityActions={[{ name: 'increment' }, { name: 'activate' }]}
      onAccessibilityAction={finish}>
      <Animated.View style={[s.slideFill, { width: p.interpolate({ inputRange: [0, 1], outputRange: [KNOB + 4, w] }) }]} />
      <Text style={[s.slideT, { color: TW.muted }]}>Slide your picture over it</Text>
      <Animated.View
        {...pan.panHandlers}
        style={[s.knob, { transform: [{ translateX: p.interpolate({ inputRange: [0, 1], outputRange: [0, room.current] }) }] }]}>
        <Svg width={22} height={22} viewBox="0 0 22 22">
          <Path d="M8 5 L15 11 L8 17" stroke="#06352A" strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </Animated.View>
    </View>
  );
}

/** the wave behind the preview: it rises to its top and the dot rides it past (p of the time gone, 0 to 1) */
export function WaveLine({ p }: { p: number }) {
  const w = useArtWidth();
  const k = w / 358;
  const pts = Array.from({ length: 41 }, (_, j) => {
    const t = j / 40;
    return [t * 358, 34 - 28 * Math.exp(-Math.pow((t - 0.32) / 0.2, 2))] as [number, number];
  });
  const d = (a: [number, number][]) => a.map(([x, y], j) => (j ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1)).join(' ');
  const n = Math.max(1, Math.round(Math.min(1, p) * 40));
  const [dx, dy] = pts[n];
  return (
    <View accessible accessibilityLabel={p >= 0.45 ? 'The wave is past its top.' : 'The wave is rising.'}>
      <Svg width={w} height={44 * k} viewBox="0 0 358 44">
        <Path d={d(pts)} stroke={TW.dim} strokeWidth={4} fill="none" strokeLinecap="round" />
        <Path d={d(pts.slice(0, n + 1))} stroke={TW.mint} strokeWidth={5} fill="none" strokeLinecap="round" />
        <Circle cx={dx} cy={dy} r={7} fill={TW.ink} />
      </Svg>
    </View>
  );
}

/* ---------- Case: the door, held closed, and the key ---------- */
export function DoorArt({ h, locked, small }: { h: SharedValue<number>; locked: boolean; small?: boolean }) {
  const w = Math.min(useArtWidth(), 400);
  const k = Math.min(1, w / 358) * (small ? 0.72 : 1);
  const DW = 156 * k;
  const DH = 230 * k;
  const knock = useLoop(!locked, 1400);
  /* the door swings shut as the hold fills: it narrows the light down to nothing */
  const panel = useAnimatedStyle(() => ({ transform: [{ scaleX: 0.82 + 0.18 * h.value }] }));
  const sound = useAnimatedStyle(() => ({ opacity: 1 - h.value }));
  const lockV = useRef(new Animated.Value(locked ? 1 : 0)).current;
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce) lockV.setValue(locked ? 1 : 0);
    else Animated.spring(lockV, { toValue: locked ? 1 : 0, ...SPRING.fast, useNativeDriver: NATIVE }).start();
  }, [locked, reduce, lockV]);
  const arch = (x0: number, x1: number, top: number, bottom: number) => {
    const mx = (x0 + x1) / 2;
    const r = (x1 - x0) / 2;
    return `M${x0} ${bottom} L${x0} ${top + r * 0.75} Q${x0} ${top} ${mx} ${top} Q${x1} ${top} ${x1} ${top + r * 0.75} L${x1} ${bottom}Z`;
  };
  return (
    <View
      style={{ width: w, height: DH + 20, alignItems: 'center' }}
      accessible
      accessibilityLabel={locked ? 'The door is closed and locked.' : TRAIL.case.see}>
      <View style={{ width: DW, height: DH }}>
        <Svg width={DW} height={DH} viewBox="0 0 156 230" style={StyleSheet.absoluteFill}>
          <Ellipse cx={78} cy={226} rx={110} ry={10} fill="#0B0926" opacity={0.5} />
          <Path d={arch(0, 156, 0, 230)} fill={TW.box} stroke={TW.frame} strokeWidth={6} />
          <Path d={arch(12, 144, 12, 230)} fill={TW.sun} opacity={0.92} />
        </Svg>
        <Reanimated.View style={[s.abs, { left: 12 * k, top: 12 * k, width: 132 * k, height: 218 * k, transformOrigin: 'right' }, panel]}>
          <Svg width={132 * k} height={218 * k} viewBox="0 0 132 218" preserveAspectRatio="none">
            <Path d={arch(0, 132, 0, 218)} fill={TW.panel} />
            <Path d={arch(14, 118, 16, 200)} fill="none" stroke={TW.frame} strokeWidth={2} opacity={0.35} />
            <Circle cx={108} cy={124} r={7} fill={TW.sun} />
          </Svg>
        </Reanimated.View>
        <Animated.View style={[s.abs, { left: 120 * k - 14, top: 164 * k - 14, width: 28, height: 28, opacity: lockV, transform: [{ scale: lockV }] }]}>
          <Svg width={28} height={28} viewBox="-14 -14 28 28">
            <Circle r={11} fill={TW.box} stroke={TW.sun} strokeWidth={3} />
            <Rect x={-2} y={-6} width={4} height={12} rx={2} fill={TW.sun} />
          </Svg>
        </Animated.View>
        <Reanimated.View style={[s.abs, { left: DW + 8, top: 40 * k }, sound]}>
          <Animated.View style={{ opacity: knock.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }) }}>
            <Svg width={40} height={60} viewBox="0 0 40 60">
              <Path d="M6 8 q14 14 0 28 M22 0 q20 22 0 46" stroke={TW.coral} strokeWidth={4} fill="none" strokeLinecap="round" />
            </Svg>
          </Animated.View>
        </Reanimated.View>
      </View>
    </View>
  );
}

/** what the permission voice may say next, and the answer under it */
export function NextLine({ line, answer, own }: { line: string; answer: string; own: boolean }) {
  return (
    <View style={s.next}>
      <Text style={[s.small, { color: TW.muted }]}>{own ? 'Next it will say' : 'Next it may say'}</Text>
      <View style={s.thought}>
        <Text style={[s.thoughtT, { color: TW.ink }]}>{'“' + line + '”'}</Text>
      </View>
      <View style={s.answer}>
        <Text style={[s.small, { color: '#6A5FB0' }]}>{own ? 'You, on a calm day' : 'An answer'}</Text>
        <Text style={[s.answerT, { color: TW.paperInk }]}>{answer}</Text>
      </View>
    </View>
  );
}

/* ---------- Steps: the stairs down to the edge, and a way off every stair ---------- */
const STAIR = (j: number): [number, number] => [118 + j * 40, 38 + j * 34];
/** the flame stands on the second stair: already on the way, and still with a way off */
const ON = 1;
export function StepsArt({ level, off, lit }: { level: number; off: boolean; lit?: boolean }) {
  const w = Math.min(useArtWidth(), 400);
  const k = w / 358;
  const reduce = useReducedMotion();
  const go = useRef(new Animated.Value(off ? 1 : 0)).current;
  const glow = useRef(new Animated.Value(lit ? 1 : 0)).current;
  useEffect(() => {
    if (reduce) go.setValue(off ? 1 : 0);
    else Animated.timing(go, { toValue: off ? 1 : 0, duration: 1400, easing: Easing.inOut(Easing.cubic), useNativeDriver: NATIVE }).start();
  }, [off, reduce, go]);
  useEffect(() => {
    if (reduce) glow.setValue(lit ? 1 : 0);
    else Animated.timing(glow, { toValue: lit ? 1 : 0, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: NATIVE }).start();
  }, [lit, reduce, glow]);
  const exit = (j: number) => {
    const [x, y] = STAIR(j);
    return `M${x + 8} ${y + 12} C${x - 6} ${y + 40} ${x - 40} ${y + 50} ${x - 70} ${y + 56}`;
  };
  const [fx, fy] = STAIR(ON);
  const FL = 56;
  const H = 250;
  return (
    <View style={{ width: w, height: H * k, alignSelf: 'center' }} accessible accessibilityLabel={TRAIL.steps.see}>
      <Svg width={w} height={H * k} viewBox={`0 0 358 ${H}`} style={StyleSheet.absoluteFill}>
        <AdDefs />
        {/* the edge, at the bottom of the stairs */}
        <Circle cx={322} cy={226} r={34} fill={TW.coral} opacity={0.18} />
        <Path d="M20 38 L120 38" stroke={TW.path} strokeWidth={12} strokeLinecap="round" />
        {[0, 1, 2, 3, 4].map((j) => {
          const [x, y] = STAIR(j);
          return <Rect key={j} x={x} y={y} width={46} height={12} rx={4} fill={TW.post} opacity={1 - j * 0.14} />;
        })}
        {/* the way off the flame's stair, always there */}
        <Circle cx={STAIR(ON)[0] - 70} cy={STAIR(ON)[1] + 56} r={40} fill="url(#trMint)" />
        <Path d={exit(ON)} stroke={TW.mint} strokeWidth={5} fill="none" strokeLinecap="round" />
      </Svg>
      {/* every other stair's way off, lit when the place says what it really is */}
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: glow }]}>
        <Svg width={w} height={H * k} viewBox={`0 0 358 ${H}`}>
          {[0, 2, 3, 4].map((j) => (
            <Path key={j} d={exit(j)} stroke={TW.mint} strokeWidth={4} fill="none" strokeLinecap="round" opacity={0.7} />
          ))}
        </Svg>
      </Animated.View>
      <Text style={[s.stepsTag, { left: 268 * k, top: 236 * k - 8, color: TW.coral }]}>the edge</Text>
      <Animated.Text style={[s.stepsTag, { left: 8 * k, top: 178 * k, color: TW.mint, opacity: glow }]}>a way off{'\n'}every step</Animated.Text>
      <Animated.View
        pointerEvents="none"
        style={[
          s.abs,
          { left: -FL / 2, top: -FL, width: FL, height: FL },
          {
            transform: [
              { translateX: go.interpolate({ inputRange: [0, 1], outputRange: [(fx + 23) * k, (fx - 70) * k] }) },
              { translateY: go.interpolate({ inputRange: [0, 1], outputRange: [(fy + 4) * k, (fy + 60) * k] }) },
            ],
          },
        ]}>
        <BigFlame level={level} size={FL} />
      </Animated.View>
    </View>
  );
}

/* ---------- Home: where every exit leads ---------- */
const FLIES: [number, number, number][] = [
  [40, 70, 0],
  [80, 30, 0.3],
  [300, 54, 0.6],
  [270, 20, 0.15],
  [24, 140, 0.8],
  [332, 120, 0.45],
];
export function HomeArt({ level }: { level: number }) {
  const w = Math.min(useArtWidth(), 400);
  const k = w / 358;
  const glow = useLoop(true, 4200);
  return (
    <View
      style={{ width: w, height: 300 * k, alignSelf: 'center' }}
      accessible
      accessibilityLabel="Home: a small house with a lit window, and your flame beside it.">
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.75, 1] }) }]}>
        <Svg width={w} height={300 * k} viewBox="0 0 358 300">
          <AdDefs />
          <Circle cx={160} cy={190} r={150} fill="url(#trHome)" />
        </Svg>
      </Animated.View>
      <Svg width={w} height={300 * k} viewBox="0 0 358 300" style={StyleSheet.absoluteFill}>
        <Defs>
          {/* the ground fades out at both sides, so it has no edge */}
          <LinearGradient id="trGround" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={TW.ground} stopOpacity={0} />
            <Stop offset="0.2" stopColor={TW.ground} stopOpacity={1} />
            <Stop offset="0.8" stopColor={TW.ground} stopOpacity={1} />
            <Stop offset="1" stopColor={TW.ground} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Path d="M0 250 C110 232 240 240 358 222 L358 300 L0 300Z" fill="url(#trGround)" />
        <Path d="M352 30 C336 110 322 180 318 236" stroke={TW.mint} strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.8} />
        <G transform="translate(150,250) scale(1.9)">
          <Path d="M-40 0 L-40 -44 L0 -74 L40 -44 L40 0Z" fill={TW.box} stroke={TW.frame} strokeWidth={3} strokeLinejoin="round" />
          <Rect x={-14} y={-42} width={28} height={24} rx={4} fill={TW.warm} />
          <Line x1={0} y1={-42} x2={0} y2={-18} stroke={TW.box} strokeWidth={3} />
        </G>
      </Svg>
      {FLIES.map(([x, y, d], j) => (
        <Firefly key={j} x={x * k} y={y * k} delay={d} />
      ))}
      <View pointerEvents="none" style={[s.abs, { left: 262 * k - 50, top: 252 * k - 100, width: 100, height: 100 }]}>
        <BigFlame level={level} size={100} />
      </View>
    </View>
  );
}

function Firefly({ x, y, delay }: { x: number; y: number; delay: number }) {
  const v = useLoop(true, 2600 + delay * 1800);
  return <Animated.View style={[s.abs, s.fly, { left: x, top: y, opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.25, 1] }) }]} />;
}

/* ---------- how much time: three choices, picked once and remembered ---------- */
/** a row of two to four choices, one picked: how much time there is, how strong it is */
export function Seg<T extends string>({
  label,
  val,
  opts,
  onPick,
}: {
  label: string;
  val: T | null;
  opts: { id: T; label: string }[];
  onPick: (x: T) => void;
}) {
  return (
    <View style={s.seg} accessibilityRole="radiogroup" accessibilityLabel={label}>
      {opts.map((x) => {
        const on = x.id === val;
        return (
          <Pressable
            key={x.id}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            onPress={() => {
              buzz('tick');
              onPick(x.id);
            }}
            style={({ pressed }) => [s.segB, on ? s.segOn : { backgroundColor: TW.bubble }, { opacity: pressed ? 0.85 : 1 }]}>
            <Text style={[s.segT, { color: on ? '#06352A' : TW.muted }]}>{x.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function TimeChoice({ len, lens, onPick }: { len: TrailLen; lens: { id: TrailLen; label: string }[]; onPick: (l: TrailLen) => void }) {
  return <Seg label="How much time do you have?" val={len} opts={lens} onPick={onPick} />;
}

/** a card of words in the dock: what to do now, with a small line over it */
export function DoCard({ over, tone = 'sun', children }: { over?: string; tone?: 'sun' | 'mint'; children: ReactNode }) {
  return (
    <View style={s.card}>
      {over ? <Text style={[s.small, { color: tone === 'mint' ? TW.mint : TW.sun }]}>{over}</Text> : null}
      <Text style={[s.cardT, { color: TW.ink }]}>{children}</Text>
    </View>
  );
}

/** a timer for a drill that takes time: the time left, big, in a ring that fills */
export function DrillClock({ secs, onEnd }: { secs: number; onEnd: () => void }) {
  const [t0] = useState(() => Date.now());
  const [now, setNow] = useState(t0);
  const ended = useRef(false);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);
  const left = Math.max(0, secs * 1000 - (now - t0));
  useEffect(() => {
    if (left === 0 && !ended.current) {
      ended.current = true;
      buzz('save');
      onEnd();
    }
  }, [left, onEnd]);
  const p = 1 - left / (secs * 1000);
  const R = 46;
  const C = 2 * Math.PI * R;
  const mm = Math.floor(Math.ceil(left / 1000) / 60);
  const ss = Math.ceil(left / 1000) % 60;
  return (
    <View style={s.clock} accessible accessibilityRole="timer" accessibilityLabel={mm + ' minutes ' + ss + ' seconds left'}>
      <Svg width={112} height={112} viewBox="0 0 112 112" style={StyleSheet.absoluteFill}>
        <Circle cx={56} cy={56} r={R} stroke={TW.box} strokeWidth={8} fill="none" />
        <Circle
          cx={56}
          cy={56}
          r={R}
          stroke={TW.mint}
          strokeWidth={8}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${C} ${C}`}
          strokeDashoffset={C * (1 - p)}
          transform="rotate(-90 56 56)"
        />
      </Svg>
      <Text style={[s.clockT, { color: TW.ink }]}>{mm + ':' + String(ss).padStart(2, '0')}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  abs: { position: 'absolute' },
  small: { fontFamily: font.bodySemi, fontSize: 13, lineHeight: 18 },
  mapHit: { position: 'absolute', alignItems: 'center', gap: 6 },
  whisper: { fontFamily: font.display, fontStyle: 'italic', fontSize: 34, lineHeight: 42, color: TW.muted },
  stepsTag: { position: 'absolute', fontFamily: font.bodySemi, fontSize: 13, lineHeight: 17 },
  mapWords: { flex: 1 },
  mapName: { fontFamily: font.display, fontSize: 22, lineHeight: 28 },
  mapMeans: { fontFamily: font.body, fontSize: 15, lineHeight: 19, color: TW.muted },
  lamp: { position: 'absolute', alignItems: 'center', gap: 10 },
  lampLow: { borderWidth: 3, borderStyle: 'dashed', borderColor: TW.sun, backgroundColor: TW.dim },
  lampT: { fontFamily: font.bodySemi, fontSize: 15, lineHeight: 20 },
  frame: { backgroundColor: TW.box, borderWidth: 6, borderColor: TW.frame },
  edge: { top: 0, width: 5, backgroundColor: TW.ink },
  cap: { fontFamily: font.body, fontSize: 15, lineHeight: 20, textAlign: 'center', paddingHorizontal: 16 },
  slide: { height: 56, borderRadius: 28, backgroundColor: TW.bubble, justifyContent: 'center', overflow: 'hidden' },
  slideFill: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 28, backgroundColor: 'rgba(94,224,181,0.18)' },
  slideT: { fontFamily: font.bodySemi, fontSize: 15, textAlign: 'center', paddingLeft: 40 },
  knob: {
    position: 'absolute',
    left: 4,
    top: 4,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: TW.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  next: { gap: 6 },
  thought: { backgroundColor: TW.bubble, borderRadius: 20, borderBottomLeftRadius: 6, paddingVertical: 12, paddingHorizontal: 16, maxWidth: '88%' },
  thoughtT: { fontFamily: font.bodySemi, fontSize: 17, lineHeight: 22 },
  answer: {
    alignSelf: 'flex-end',
    backgroundColor: TW.cream,
    borderRadius: 20,
    borderBottomRightRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    maxWidth: '88%',
    marginTop: 4,
  },
  answerT: { fontFamily: font.body, fontSize: 15, lineHeight: 20 },
  fly: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#FFE9B0' },
  seg: { flexDirection: 'row', gap: 8 },
  segB: { flex: 1, minHeight: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  segOn: { backgroundColor: TW.mint, shadowColor: '#000', shadowOpacity: 0.32, shadowRadius: 0, shadowOffset: { width: 0, height: 3 } },
  segT: { fontFamily: font.bodySemi, fontSize: 15 },
  card: { backgroundColor: TW.bubble, borderRadius: 20, padding: 16, gap: 4 },
  cardT: { fontFamily: font.body, fontSize: 17, lineHeight: 23 },
  clock: { width: 112, height: 112, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  clockT: { fontFamily: font.displayBold, fontSize: 28, fontVariant: ['tabular-nums'] },
});

/* ---------- the words at the top of a place: what it says, what it really is, the move ---------- */
/** what the craving says, as a whisper: the words come one at a time, soft and slanted, the way a thought arrives */
export function Whisper({ text }: { text: string }) {
  const reduce = useReducedMotion();
  const words = text.split(' ');
  const vs = useRef(words.map(() => new Animated.Value(reduce ? 1 : 0))).current;
  useEffect(() => {
    if (reduce) return vs.forEach((v) => v.setValue(1));
    Animated.stagger(
      170,
      vs.map((v) => Animated.timing(v, { toValue: 1, duration: 520, easing: Easing.out(Easing.cubic), useNativeDriver: NATIVE })),
    ).start();
  }, [reduce, vs]);
  return (
    <Text style={s.whisper} accessibilityLabel={text}>
      {'“'}
      {words.map((w, j) => (
        <Animated.Text key={j} style={{ opacity: vs[j] }}>
          {w + (j < words.length - 1 ? ' ' : '')}
        </Animated.Text>
      ))}
      {'”'}
    </Text>
  );
}

/** a block of words that rises into place when it changes */
export function Rise({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const reduce = useReducedMotion();
  const v = useRef(new Animated.Value(reduce ? 1 : 0)).current;
  useEffect(() => {
    if (reduce) return v.setValue(1);
    Animated.timing(v, { toValue: 1, duration: 480, delay, easing: Easing.out(Easing.cubic), useNativeDriver: NATIVE }).start();
  }, [reduce, v, delay]);
  const y = v.interpolate({ inputRange: [0, 1], outputRange: [14, 0] });
  return <Animated.View style={{ opacity: v, transform: [{ translateY: y }] }}>{children}</Animated.View>;
}
