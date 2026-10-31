/* Bedtime's one living thing: the person's own flame, big, on a dark hill under the night sky. Awake it breathes slowly and blinks now and then. On
   Goodnight (`asleep`) its eyes close, the light in the small house goes out, the moon comes up behind it, the stars come in and a few slow z's drift
   up. It never gets smaller: a flame asleep is the same flame, resting (docs/plan.md, "The wind-down"). It breathes on the one breath curve, in for 4
   and out for 6, the slow breath the app teaches for a loud night. With Reduce Motion on, it is still: the eyes are simply open or closed, the moon is
   up once it sleeps, and the words say the rest. */
import { figAsleep, formOfLevel } from '@daybook/core';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated as RNAnimated, Easing, StyleSheet, useWindowDimensions, View } from 'react-native';
import Reanimated, { cancelAnimation, useAnimatedStyle, useSharedValue, withDelay, withSequence, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Path, RadialGradient, Rect, Stop, SvgXml } from 'react-native-svg';

import { bigLayers } from '@/components/big-flame';
import { Text } from '@/components/text';
import { breathAt, useBreathClock, webDeps, type Steps } from '@/lib/breath';
import { NATIVE, useReducedMotion } from '@/lib/motion';
import { font, MAX_WIDTH } from '@/lib/theme';

const BREATH: Steps = [
  ['in', 4],
  ['out', 6],
];
const SUNRISE = 6;
/* the figure drawn closer than Today's, so a form that is drawn small in its picture still fills the sky */
const CLOSE = 1.3;
/* how long the going-to-bed beats take: the light goes out at about 0.8 s, the eyes close by 1.9 s, the moon is up by 2.6 s */
const RUN = 2600;
/** a blink: the eyes close and open again, about once in this long while awake */
const BLINK_EVERY = 6200;
/* a few stars, placed by hand so the sky is the same every night: [left %, top as a share of the picture, size, how long one twinkle takes] */
const STARS: [number, number, number, number][] = [
  [6, 0.02, 3, 3400],
  [15, 0.2, 2, 4200],
  [27, 0.05, 2, 3800],
  [9, 0.46, 2, 3000],
  [38, 0.01, 2, 4600],
  [64, 0.03, 2, 3600],
  [74, 0.14, 3, 4400],
  [90, 0.03, 3, 3200],
  [95, 0.3, 2, 4000],
  [86, 0.5, 2, 3900],
  [52, 0.07, 2, 4800],
  [3, 0.26, 2, 4100],
];

/** the open middle of the page, with the flame as big as the room it leaves: words above and the low part of the page keep their size, and the flame takes
    the rest, up to the width of the phone. It stays big on a small phone: a page never shrinks it further than it has to. */
export function NightMiddle(props: { level: number; asleep: boolean; grew?: boolean; awakeNow?: boolean }) {
  const { width } = useWindowDimensions();
  const [room, setRoom] = useState(0);
  const size = Math.round(Math.min(Math.min(width, MAX_WIDTH) - 32, room));
  return (
    <View style={s.middle} onLayout={(e) => setRoom(e.nativeEvent.layout.height)}>
      {size > 0 ? <NightFlame {...props} size={size} /> : null}
    </View>
  );
}

function NightFlame({
  level,
  size,
  asleep,
  grew,
  awakeNow,
}: {
  level: number;
  size: number;
  asleep: boolean;
  /** points just earned: one soft bloom as it takes them in */
  grew?: boolean;
  /** a new day came while it slept: it wakes */
  awakeNow?: boolean;
}) {
  const reduce = useReducedMotion();
  const b = useMemo(() => bigLayers(level), [level]);
  const closed = useMemo(() => (b ? figAsleep(b.layers.fig) : ''), [b]);
  const t = useBreathClock(0, !reduce);
  /* 1 with the eyes closed */
  const lid = useSharedValue(asleep && reduce ? 1 : 0);
  const rest = useSharedValue(asleep && reduce ? 1 : 0);
  const bloom = useSharedValue(0);
  /* the sky's clock for the going-to-bed moment */
  const v = useRef(new RNAnimated.Value(asleep && reduce ? 1 : 0)).current;
  const glow = useRef(new RNAnimated.Value(0)).current;
  const zz = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    if (reduce) {
      lid.value = asleep ? 1 : 0;
      rest.value = asleep ? 1 : 0;
      v.setValue(asleep ? 1 : 0);
      return;
    }
    if (asleep) {
      /* a slow blink, a longer one, and then they stay closed */
      lid.value = withSequence(
        withDelay(250, withTiming(1, { duration: 240 })),
        withTiming(0, { duration: 260 }),
        withDelay(240, withTiming(1, { duration: 420 })),
        withTiming(0.55, { duration: 300 }),
        withTiming(1, { duration: 360 }),
      );
      rest.value = withTiming(1, { duration: RUN });
      if (grew) bloom.value = withSequence(withTiming(1, { duration: 520 }), withTiming(0, { duration: 1500 }));
      const run = RNAnimated.timing(v, { toValue: 1, duration: RUN, easing: Easing.inOut(Easing.cubic), useNativeDriver: NATIVE });
      run.start();
      return () => run.stop();
    }
    /* awake: it blinks now and then, at no exact beat */
    let on = true;
    let timer: ReturnType<typeof setTimeout>;
    const blink = () => {
      if (!on) return;
      lid.value = withSequence(withTiming(1, { duration: 170 }), withTiming(0, { duration: 230 }));
      timer = setTimeout(blink, BLINK_EVERY * (0.7 + ((Date.now() % 7) / 7) * 0.7));
    };
    timer = setTimeout(blink, 1600);
    return () => {
      on = false;
      clearTimeout(timer);
      cancelAnimation(lid);
    };
  }, [asleep, reduce, grew, lid, rest, bloom, v]);

  /* a morning that wakes it: the eyes open */
  useEffect(() => {
    if (!awakeNow) return;
    lid.value = reduce ? 0 : withTiming(0, { duration: 500 });
    rest.value = reduce ? 0 : withTiming(0, { duration: 1200 });
    if (reduce) return v.setValue(0);
    bloom.value = withSequence(withTiming(1, { duration: 520 }), withTiming(0, { duration: 1500 }));
    RNAnimated.timing(v, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.cubic), useNativeDriver: NATIVE }).start();
  }, [awakeNow, reduce, lid, rest, bloom, v]);

  useEffect(() => {
    if (reduce) return;
    const moon = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(glow, { toValue: 1, duration: 3200, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
        RNAnimated.timing(glow, { toValue: 0, duration: 3200, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
      ]),
    );
    const drift = RNAnimated.loop(RNAnimated.timing(zz, { toValue: 1, duration: 4800, easing: Easing.linear, useNativeDriver: NATIVE }));
    moon.start();
    drift.start();
    return () => {
      moon.stop();
      drift.stop();
    };
  }, [reduce, glow, zz]);

  const figStyle = useAnimatedStyle(
    () => {
      const full = reduce ? 0 : breathAt(BREATH, t.value)[0];
      const asleepBy = rest.value;
      return {
        transform: [{ translateY: -full * size * (0.004 + 0.006 * asleepBy) }, { scale: 1 + full * (0.02 + 0.02 * asleepBy) + bloom.value * 0.08 }],
      };
    },
    webDeps(size, reduce),
  );
  const glowStyle = useAnimatedStyle(() => {
    const full = reduce ? 0.5 : breathAt(BREATH, t.value)[0];
    return {
      opacity: Math.min(1, 0.72 + 0.28 * full + bloom.value * 0.3 - rest.value * 0.16),
      transform: [{ scale: 1 + full * 0.05 + bloom.value * 0.3 }],
    };
  }, webDeps(reduce));
  const lidStyle = useAnimatedStyle(() => ({ opacity: lid.value }), webDeps());
  const openStyle = useAnimatedStyle(() => ({ opacity: lid.value > 0.5 ? 0 : 1 }), webDeps());

  const light = v.interpolate({ inputRange: [0, 0.26, 0.4, 1], outputRange: [1, 1, 0.05, 0.05] });
  const moonIn = v.interpolate({ inputRange: [0, 0.3, 0.88, 1], outputRange: [0, 0, 1, 1] });
  const starsIn = v.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] });
  const zIn = v.interpolate({ inputRange: [0, 0.5, 0.7, 1], outputRange: [0, 0, 1, 1] });

  if (!b) return <View style={{ width: size, height: size }} />;
  const S = size * b.zoom * CLOSE;
  const at = b.layers.at;
  const place = { position: 'absolute' as const, left: size / 2 - at.x * S, top: size * 0.5 - at.y * S, width: S, height: S };
  const hillY = size * 0.76;
  /* the Sunrise form's bottom fades into its own hill: it sits behind this one, tucked in */
  const tucked = formOfLevel(level) === SUNRISE;
  if (tucked) place.top += size * 0.12;
  return (
    <View
      style={{ width: size, height: size }}
      accessibilityRole="image"
      accessibilityLabel={asleep ? 'Your flame, asleep, with its eyes closed' : `Your flame, level ${level}`}
      accessible>
      {/* everything here is drawn past the picture's edges, so the sky and the hill run from edge to edge of the screen */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {STARS.map(([x, y, r, ms], i) => (
          <Star key={i} left={`${x}%`} top={y * size} r={r} ms={ms} delay={i * 370} still={reduce} come={starsIn} />
        ))}
        <RNAnimated.View
          style={[
            s.moonAt,
            {
              left: -size * 0.02,
              top: -size * 0.04,
              opacity: moonIn,
              transform: [{ translateY: moonIn.interpolate({ inputRange: [0, 1], outputRange: [size * 0.2, 0] }) }],
            },
          ]}>
          <RNAnimated.View
            style={[
              s.halo,
              {
                opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }),
                transform: [{ scale: glow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) }],
              },
            ]}>
            <Svg width={160} height={160}>
              <Defs>
                <RadialGradient id="nfMoon" cx="50%" cy="50%" r="50%">
                  <Stop offset="0.25" stopColor="#FFE27A" stopOpacity={0.3} />
                  <Stop offset="1" stopColor="#FFE27A" stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <Circle cx={80} cy={80} r={80} fill="url(#nfMoon)" />
            </Svg>
          </RNAnimated.View>
          <Svg width={56} height={56} viewBox="0 0 56 56">
            <Path d="M38 6A23 23 0 1 0 50 37 19 19 0 0 1 38 6Z" fill="#FFE27A" />
          </Svg>
        </RNAnimated.View>
        <Hills width={size} y={hillY} light={light} />
        {tucked ? null : <NearHill width={size} y={hillY} />}
      </View>
      <Reanimated.View style={[place, glowStyle, { transformOrigin: `${at.x * 100}% ${at.y * 100}%` }]} pointerEvents="none">
        {b.layers.glow ? <SvgXml xml={b.layers.glow} width={S} height={S} /> : null}
      </Reanimated.View>
      <Reanimated.View style={[place, figStyle, { transformOrigin: `${at.x * 100}% ${at.y * 100}%` }]} pointerEvents="none">
        <Reanimated.View style={[StyleSheet.absoluteFill, openStyle]}>
          <SvgXml xml={b.layers.fig} width={S} height={S} />
        </Reanimated.View>
        <Reanimated.View style={[StyleSheet.absoluteFill, lidStyle]}>
          <SvgXml xml={closed} width={S} height={S} />
        </Reanimated.View>
      </Reanimated.View>
      {tucked ? (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <NearHill width={size} y={hillY} />
        </View>
      ) : null}
      <Zs t={zz} come={zIn} still={reduce} left={size * 0.68} top={size * 0.06} />
    </View>
  );
}

/* two soft hills from edge to edge, the far one with the small house on it; the near one, which the flame stands on, runs on under the rest of the page */
function Hills({ width: w, y, light }: { width: number; y: number; light: RNAnimated.AnimatedInterpolation<number> }) {
  const over = 1200;
  const X = (k: number) => over + k * w;
  const far = `M0 128L${X(-1.2)} 128C${X(-0.1)} 128 ${X(0.5)} 54 ${X(0.82)} 52S${X(1.3)} 74 ${X(2.2)} 96L${w + over * 2} 96V1400H0Z`;
  const hx = X(0.82) - over;
  const hy = y - 26;
  return (
    <>
      <Svg width={w + over * 2} height={1400} style={{ position: 'absolute', left: -over, top: y - 78 }}>
        <Defs>
          <LinearGradient id="nfFar" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#332A84" />
            <Stop offset="0.12" stopColor="#1E1860" />
          </LinearGradient>
        </Defs>
        <Path d={far} fill="url(#nfFar)" />
      </Svg>
      {/* the house: a roof, the walls, a door, and the window, whose light goes out */}
      <Svg width={34} height={34} viewBox="0 0 30 30" style={{ position: 'absolute', left: hx - 17, top: hy - 28 }}>
        <Path d="M3 13L15 3L27 13Z" fill="#4A40A8" />
        <Rect x={6} y={12} width={18} height={16} fill="#382F8E" />
        <Rect x={9} y={16} width={6} height={5} rx={1} fill="#1A1550" />
        <Rect x={18} y={18} width={4} height={10} rx={1} fill="#1A1550" />
      </Svg>
      <RNAnimated.View style={[s.win, { left: hx - 17 + 10.2, top: hy - 28 + 18.1, opacity: light }]}>
        <Svg width={28} height={28} style={{ position: 'absolute', left: -11, top: -11.5 }}>
          <Circle cx={14} cy={14} r={14} fill="#FFD66B" opacity={0.1} />
        </Svg>
        <View style={s.winLit} />
      </RNAnimated.View>
    </>
  );
}

/* the near hill, which the flame stands on (or a sunrise form sits behind), and which runs on under the rest of the page */
function NearHill({ width: w, y }: { width: number; y: number }) {
  const over = 1200;
  const X = (k: number) => over + k * w;
  const near = `M0 130L${X(-1.2)} 130C${X(-0.3)} 130 ${X(0.2)} 78 ${X(0.5)} 78S${X(1.2)} 104 ${X(2.2)} 130L${w + over * 2} 130V1400H0Z`;
  return (
    <Svg width={w + over * 2} height={1400} style={{ position: 'absolute', left: -over, top: y - 78 }}>
      <Defs>
        <LinearGradient id="nfNear" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#120E42" />
          <Stop offset="0.16" stopColor="#120E38" />
        </LinearGradient>
      </Defs>
      <Path d={near} fill="url(#nfNear)" />
    </Svg>
  );
}

/* three small z's, one after another, drifting up beside the flame and fading. With Reduce Motion on they rest in place. */
function Zs({ t, come, still, left, top }: { t: RNAnimated.Value; come: RNAnimated.AnimatedInterpolation<number>; still: boolean; left: number; top: number }) {
  return (
    <RNAnimated.View style={[s.zs, { left, top, opacity: come }]} pointerEvents="none">
      {[0, 1, 2].map((i) => {
        const size = 15 + i * 4;
        if (still)
          return (
            <Text key={i} style={[s.z, { fontSize: size, left: 8 + i * 12, top: 40 - i * 18, opacity: 0.8 - i * 0.15 }]}>
              z
            </Text>
          );
        const p = RNAnimated.modulo(RNAnimated.add(t, i / 3), 1);
        return (
          <RNAnimated.Text
            key={i}
            style={[
              s.z,
              {
                fontSize: size,
                left: i * 5,
                opacity: p.interpolate({ inputRange: [0, 0.15, 0.7, 1], outputRange: [0, 0.9, 0.55, 0] }),
                transform: [
                  { translateY: p.interpolate({ inputRange: [0, 1], outputRange: [56, -12] }) },
                  { translateX: p.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 12, 20] }) },
                ],
              },
            ]}>
            z
          </RNAnimated.Text>
        );
      })}
    </RNAnimated.View>
  );
}

function Star({
  left,
  top,
  r,
  ms,
  delay,
  still,
  come,
}: {
  left: `${number}%`;
  top: number;
  r: number;
  ms: number;
  delay: number;
  still: boolean;
  come: RNAnimated.AnimatedInterpolation<number>;
}) {
  const v = useRef(new RNAnimated.Value(0.8)).current;
  useEffect(() => {
    if (still) return v.setValue(0.8);
    const a = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.delay(delay % 1600),
        RNAnimated.timing(v, { toValue: 1, duration: ms / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
        RNAnimated.timing(v, { toValue: 0.35, duration: ms / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
      ]),
    );
    a.start();
    return () => a.stop();
  }, [still, v, ms, delay]);
  return <RNAnimated.View style={[s.star, { left, top, width: r, height: r, borderRadius: r / 2, opacity: RNAnimated.multiply(v, come) }]} />;
}

const s = StyleSheet.create({
  middle: { flexGrow: 1, flexBasis: 0, minHeight: 170, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' },
  star: { position: 'absolute', backgroundColor: '#FFF6D8' },
  moonAt: { position: 'absolute', width: 160, height: 160, alignItems: 'center', justifyContent: 'center' },
  halo: { position: 'absolute', width: 160, height: 160 },
  win: { position: 'absolute', width: 6.8, height: 5.6 },
  winLit: { width: 6.8, height: 5.6, borderRadius: 1, backgroundColor: '#FFD66B' },
  zs: { position: 'absolute', width: 80, height: 80 },
  z: { position: 'absolute', left: 0, top: 0, fontFamily: font.display, color: '#CFC8F2' },
});
