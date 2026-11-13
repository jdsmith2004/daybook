/* Lighting the flame (core ignite.ts; the owner, November 12 and 13, 2026: "compared to that our streak ignition is literal trash",
   "it's still way worse than duolingo", and then "for the streak refresh we need to make it look the animation and everything as close
   as we can exactly like duolingo just keep it in our theme"). Timed beat for beat against Duolingo's streak ignition, from the owner's
   second recording (the side-session notes, duolingo/streak-2/streak-2-beats.md, frames at 30 fps), in Daybook's own art, colors and
   words. The flame is both the streak and the mascot, so the person lights *their* flame, and where Duolingo's mascot pops in, the
   flame wakes.

   It plays at the start (the end of setup) and when the person comes back (core igniteWhy: the first free night after a slip or a gap,
   or a small goal kept). An ordinary free morning gets `StepUp` in place on the morning page instead.

   Each beat, in ms from the swipe (Duolingo's in brackets where it differs):
      wait  The unlit flame asleep, an ember pulsing in its belly, sparks drifting up from it, one line under it. Nothing else.
         0  The swipe: the flame and the line are gone at once, only the ember is left (Light knock).
     0-240  The ember dips, then stretches up into a tall streak of light.
       240  It opens into a gold glow with stars, growing (Medium knock and the chime).
       430  White slashes fly out of the glow, and it swells over the screen.
       540  The whole screen washes gold (Heavy knock). It fades by 700.
       570  The old count shows grey under it.
       670  Petals of fire fly out across the screen, and the flame catches in the middle and grows.
   900-1030 The flame stretches tall, then squashes flat, and on the squash the number turns over downward: the old count drops out,
            the new one drops in from above (Success).
      1470  Warm puffs swell over the flame and an empty bubble comes up (Light knock). Under the puffs the flame wakes; as they break
            apart it is awake and glowing.
      1670  Its words type out (26 ms a letter, a soft tick every five), and the line under the number comes in.
            While the last words type, the column rises and the row of days fades in, all together.
  row+600   The day just kept turns into a coin: it jumps, flips over to its check, and lands with a squash and sparks (a roll, then a land).
            The small goal, when there is one, comes in after it.
 land+2500  Only then the button (Duolingo waits as long: two quiet seconds with the mascot alive, so nobody taps past the moment).
   A tap anywhere after the swipe brings everything in at once, for someone in a hurry. Reduce Motion: it lights with a fade, everything
   comes in together, one knock. */
import { type NightMark } from '@daybook/core';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Reanimated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, Ellipse, Path, RadialGradient, Stop } from 'react-native-svg';

import { BigFlame, bigLayers } from '@/components/big-flame';
import { SHORT } from '@/components/fit';
import { Bubble } from '@/components/lesson-flame';
import { Text } from '@/components/text';
import { Button, Icon } from '@/components/ui';
import { buzz, knock } from '@/lib/feel';
import { useReducedMotion } from '@/lib/motion';
import { play } from '@/lib/sound';
import { font, nightInk } from '@/lib/theme';

const ORANGE = '#FF9A2E';
const GOLD = '#FFD25A';
const CREAM = '#FFF3D6';
const PUFF = '#FFF9EE';
const GREY = 'rgba(255,255,255,0.42)';
const SLIP = '#9C86F5';
/** the ember sits this far (a share of the flame's size) under the figure's middle, in its belly */
const BELLY = 0.07;
/** how far up a swipe has to go to light it */
const PULL = 140;

/* when each beat lands, in ms from the swipe (Duolingo's, read from its frames: duolingo/streak-2/streak-2-beats.md) */
const AT = {
  flash: 240,
  slash: 430,
  wash: 540,
  old: 570,
  flame: 670,
  stretch: 900,
  squash: 970,
  puff: 1470,
  wake: 1640,
  words: 1670,
};
/** how long the flame takes to catch, once it does (BigFlame relight) */
const CATCH_MS = 260;
/** a letter of the words, and the longest the typing may take */
const LETTER = 26;
const TYPE_MAX = 1800;
/** the coin: its jump and flip, then the sparks */
const COIN_FLY = 600;
const COIN_ALL = 1050;
/** from the coin landing to the button */
const QUIET = 2500;

export interface IgniteDay {
  k: string;
  /** the day's two letters */
  d: string;
  m: NightMark;
}

/** The lighting, as a whole screen. Shared: the comeback morning (app/ignite.tsx) and the end of setup (the first lighting, count 0
    to Day 1, with the coming week as the row: core igniteStartRow). */
export function Ignition({
  level,
  from,
  to,
  unit,
  line,
  row,
  pop = row.length - 1,
  hint = 'Swipe up to light your flame',
  button = 'Keep going',
  goal,
  onDone,
  onClose,
}: {
  level: number;
  /** the count before, shown grey as the fire catches ("" for none) */
  from: string;
  /** the count after; when it differs from `from` it turns over */
  to: string;
  /** under the number ("days in a row", "night", "is today") */
  unit: string;
  /** what the flame says once lit, typed out */
  line: string;
  /** the row of days under it; empty for none */
  row: IgniteDay[];
  /** which mark flips over to a check (default the last) */
  pop?: number;
  hint?: string;
  button?: string;
  /** the small goal (core goalStep): 3 nights, then 7, then each week; its newest segment lights after the day's mark */
  goal?: { of: number; kept: boolean; segs: number; lit: number };
  onDone: () => void;
  /** the X; left out, it does the same as the button */
  onClose?: () => void;
}) {
  const win = useWindowDimensions();
  const inset = useSafeAreaInsets();
  const still = useReducedMotion();
  const m = { from, to, unit, line, row };
  /* 0 waiting, 1 lit and playing, 2 everything in */
  const [beat, setBeat] = useState(0);
  const [lit, setLit] = useState(false);
  const [awake, setAwake] = useState(false);
  const [typed, setTyped] = useState(0);
  const [wakeN, setWakeN] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const at = (ms: number, f: () => void) => timers.current.push(setTimeout(f, ms));

  const big = Math.min(win.width - 72, win.height * (SHORT ? 0.3 : 0.34), 300);
  /* where the flame's heart is in its box, for the ember and the burst */
  const heart = useMemo(() => {
    const b = bigLayers(level, true);
    return b ? { x: (b.layers.at.x + b.dx) * big, y: (b.layers.at.y + b.dy + BELLY) * big } : { x: big / 2, y: big * 0.62 };
  }, [level, big]);

  /* the ember's heat: the finger fans it (0 to 1), and it pulses on its own while it waits */
  const fan = useSharedValue(0);
  const wait = useSharedValue(0);
  const drift = useSharedValue(0);
  /* the flame itself: seen (0 between the swipe and the catch), how grown it is, and its stretch (+1 tall) and squash (-1 flat) */
  const shown = useSharedValue(1);
  const grow = useSharedValue(1);
  const squish = useSharedValue(0);
  const comet = useSharedValue(0);
  const flash = useSharedValue(0);
  const slash = useSharedValue(0);
  const wash = useSharedValue(0);
  const burst = useSharedValue(0);
  const oldV = useSharedValue(0);
  const turn = useSharedValue(0);
  const puffs = useSharedValue(0);
  const words = useSharedValue(0);
  const unitV = useSharedValue(0);
  const rowV = useSharedValue(0);
  const coin = useSharedValue(0);
  const goalV = useSharedValue(0);
  const segV = useSharedValue(0);
  const btn = useSharedValue(0);
  useEffect(() => {
    if (still) return;
    wait.value = withRepeat(withSequence(withTiming(1, { duration: 850, easing: Easing.inOut(Easing.sin) }), withTiming(0, { duration: 850 })), -1);
    drift.value = withRepeat(withTiming(1, { duration: 3200, easing: Easing.linear }), -1);
  }, [still, wait, drift]);

  /* every beat at once: for Reduce Motion, and for a tap in a hurry */
  const all = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setLit(true);
    setAwake(true);
    setBeat(2);
    setTyped(m.line.length);
    for (const v of [turn, words, unitV, rowV, coin, goalV, segV, btn, oldV, shown, grow]) v.value = withTiming(1, { duration: still ? 0 : 200 });
    for (const v of [comet, flash, slash, wash, burst, puffs, squish]) v.value = 0;
  };

  const light = () => {
    if (beat !== 0) return;
    setBeat(1);
    AccessibilityInfo.announceForAccessibility(m.to ? m.to + ' ' + m.unit + '. ' + m.line : m.line);
    if (still) {
      buzz('lit');
      all();
      return;
    }
    /* the swipe: the flame and the line are gone at once, the ember dips and stretches up into a streak of light */
    knock(Haptics.ImpactFeedbackStyle.Light);
    fan.value = 1;
    shown.value = 0;
    comet.value = withTiming(1, { duration: AT.flash, easing: Easing.linear });
    /* the flash: a gold glow with stars, growing until it fills the screen */
    at(AT.flash, () => {
      knock(Haptics.ImpactFeedbackStyle.Medium);
      play('chime');
      flash.value = withSequence(
        withTiming(0.55, { duration: AT.slash - AT.flash, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: AT.wash - AT.slash, easing: Easing.in(Easing.quad) }),
        withTiming(0, { duration: 160 }),
      );
    });
    at(AT.slash, () => {
      slash.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) });
      wash.value = withSequence(
        withTiming(1, { duration: AT.wash - AT.slash, easing: Easing.in(Easing.quad) }),
        withTiming(0, { duration: 160, easing: Easing.out(Easing.quad) }),
      );
    });
    at(AT.wash, () => knock(Haptics.ImpactFeedbackStyle.Heavy));
    at(AT.old, () => {
      oldV.value = withTiming(1, { duration: 120 });
    });
    /* the fire: petals fly out across the screen, and the flame catches in the middle and grows */
    at(AT.flame, () => {
      setLit(true);
      burst.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.quad) });
      shown.value = 1;
      grow.value = 0;
      grow.value = withTiming(1, { duration: AT.stretch - AT.flame, easing: Easing.out(Easing.cubic) });
    });
    /* it stretches tall, squashes flat, and the number turns over on the squash */
    at(AT.stretch, () => {
      squish.value = withSequence(
        withTiming(1, { duration: AT.squash - AT.stretch, easing: Easing.out(Easing.quad) }),
        withTiming(-1, { duration: 50, easing: Easing.in(Easing.quad) }),
        withSpring(0, { damping: 13, stiffness: 520 }),
      );
    });
    at(AT.squash, () => {
      turn.value = withTiming(1, { duration: 110, easing: Easing.out(Easing.quad) });
    });
    at(AT.squash + 30, () => buzz('lit'));
    /* the flame wakes: warm puffs swell over it, and as they break apart it is awake; its bubble comes up empty */
    at(AT.puff, () => {
      knock(Haptics.ImpactFeedbackStyle.Light);
      puffs.value = withTiming(1, { duration: 520, easing: Easing.linear });
      words.value = withSpring(1, { damping: 13, stiffness: 260 });
    });
    at(AT.wake, () => {
      setAwake(true);
      setWakeN((x) => x + 1);
    });
    /* its words type out, and the line under the number comes in */
    const n = m.line.length;
    const step = Math.min(LETTER, TYPE_MAX / Math.max(1, n));
    at(AT.words, () => {
      unitV.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) });
      for (let i = 1; i <= n; i++)
        at(i * step, () => {
          setTyped(i);
          if (i % 5 === 0) buzz('tick');
        });
    });
    /* while the last words type, the column rises and the days fade in together; then the day just kept flips over to its check */
    const rowAt = Math.max(AT.words + 600, AT.words + n * step - 400);
    const land = rowAt + 600 + COIN_FLY;
    at(rowAt, () => {
      rowV.value = withTiming(1, { duration: 500, easing: Easing.inOut(Easing.cubic) });
    });
    if (m.row.length) {
      at(rowAt + 600, () => {
        buzz('roll');
        coin.value = withTiming(1, { duration: COIN_ALL, easing: Easing.linear });
      });
      at(land, () => buzz('land'));
    }
    /* the small goal */
    const goalAt = land + 400;
    if (goal) {
      at(goalAt, () => {
        goalV.value = withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) });
      });
      at(goalAt + 400, () => {
        knock(goal.kept ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Light);
        segV.value = withSpring(1, { damping: 8, stiffness: 200 });
      });
    }
    /* the button, last, after the quiet */
    at(Math.max(land + QUIET, goal ? goalAt + 1200 : 0), () => {
      setBeat(2);
      btn.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.quad) });
    });
  };

  /* a swipe up anywhere fans it: a tick each quarter of the way, and it lights past the line or on a flick. The gesture is made once:
     made again on each render, a render in the middle of the first swipe (the morning's answer saving) reset it, and the swipe was lost */
  const lightRef = useRef(light);
  lightRef.current = light;
  const armed = useSharedValue(1);
  const lastQ = useSharedValue(0);
  useEffect(() => {
    armed.value = beat === 0 ? 1 : 0;
  }, [beat, armed]);
  const pan = useMemo(() => {
    const fire = () => lightRef.current();
    const tick = () => buzz('tick');
    return Gesture.Pan()
      .activeOffsetY(-8)
      .onUpdate((e) => {
        if (!armed.value) return;
        fan.value = Math.min(0.99, Math.max(0, -e.translationY / PULL));
        const q = Math.floor(fan.value * 4);
        if (q > lastQ.value) {
          lastQ.value = q;
          runOnJS(tick)();
        }
      })
      .onEnd((e) => {
        if (!armed.value) return;
        if (-e.translationY > PULL || (e.velocityY < -700 && -e.translationY > 30)) runOnJS(fire)();
        else {
          fan.value = withTiming(0, { duration: 260 });
          lastQ.value = 0;
        }
      });
  }, [armed, fan, lastQ]);

  const close = onClose ?? onDone;

  /* before the swipe it heats under the finger; after it, gone until it catches, then it grows, stretches and squashes from its base */
  const body = useAnimatedStyle(() => {
    const q = squish.value;
    return {
      opacity: shown.value * (lit ? 1 : interpolate(fan.value, [0, 1], [0.8 + 0.1 * wait.value, 1])),
      transformOrigin: ['50%', '86%', 0],
      transform: [{ scale: 0.3 + 0.7 * grow.value }, { scaleY: q >= 0 ? 1 + 0.28 * q : 1 + 0.36 * q }, { scaleX: q >= 0 ? 1 - 0.2 * q : 1 - 0.36 * q }],
    };
  });
  const washIn = useAnimatedStyle(() => ({ opacity: 0.88 * wash.value }));
  /* the number turns over downward: the old one drops out of the box, the new one drops in from above */
  const H = SHORT ? 84 : 104;
  const oldIn = useAnimatedStyle(() => ({ opacity: oldV.value, transform: [{ translateY: H * turn.value }] }));
  const neu = useAnimatedStyle(() => ({ opacity: turn.value > 0 ? 1 : 0, transform: [{ translateY: -H * (1 - turn.value) }] }));
  const unitIn = useAnimatedStyle(() => ({ opacity: unitV.value }));
  const say = useAnimatedStyle(() => ({
    opacity: Math.min(1, words.value * 2),
    transform: [{ scale: 0.6 + 0.4 * words.value }],
  }));
  const hintIn = useAnimatedStyle(() => ({ opacity: fan.value >= 0.99 ? 0 : 1 - fan.value * 0.5 }));
  const btnIn = useAnimatedStyle(() => ({ opacity: btn.value }));
  /* the whole middle sits lower while it waits, so the lone flame is in the middle of the screen, and rises as the row comes */
  const LIFT = SHORT ? 36 : 56;
  const lift = useAnimatedStyle(() => ({ transform: [{ translateY: LIFT * (1 - rowV.value) }] }));

  const changes = m.from !== m.to;
  const showOld = changes && m.from !== '';
  return (
    <GestureDetector gesture={pan}>
      <View style={s.page}>
        <StatusBar style="light" />
        <LinearGradient colors={['#100C24', '#191233', '#231734']} style={StyleSheet.absoluteFill} />
        {/* the gold wash at the height of the flash: lightest where the flame is */}
        <Reanimated.View style={[StyleSheet.absoluteFill, washIn]} pointerEvents="none">
          <Svg width="100%" height="100%">
            <Defs>
              <RadialGradient id="igWash" cx="50%" cy="42%" r="75%">
                <Stop offset="0" stopColor="#F7D27A" stopOpacity="1" />
                <Stop offset="0.45" stopColor="#C9973F" stopOpacity="1" />
                <Stop offset="1" stopColor="#6E4A1E" stopOpacity="1" />
              </RadialGradient>
            </Defs>
            <Ellipse cx="50%" cy="42%" rx="100%" ry="100%" fill="url(#igWash)" />
          </Svg>
        </Reanimated.View>
        {/* a tap anywhere once it is lit brings the rest in at once */}
        <Pressable
          style={StyleSheet.absoluteFill}
          accessible={false}
          onPress={() => {
            if (beat === 1) all();
          }}
        />
        <View style={[s.top, { paddingTop: inset.top + 8 }]} pointerEvents="box-none">
          <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={close} style={s.x} hitSlop={8}>
            <Icon name="x" color={nightInk.ink} />
          </Pressable>
        </View>

        <Reanimated.View style={[s.col, lift]} pointerEvents="box-none">
          <View style={s.bubble} pointerEvents="none">
            <Reanimated.View style={[say, { transformOrigin: ['50%', '100%', 0] }]}>
              {beat > 0 ? <Bubble text={typed ? m.line.slice(0, typed) : ' '} /> : null}
            </Reanimated.View>
          </View>

          <View style={{ width: big, height: big }} pointerEvents="none">
            {!still ? <Comet v={comet} x={heart.x} y={heart.y} size={big} /> : null}
            {!still ? <Flash v={flash} x={heart.x} y={heart.y} size={big} reach={Math.max(win.width, win.height)} /> : null}
            {!still ? <Slashes v={slash} x={heart.x} y={heart.y} reach={Math.max(win.width, win.height * 0.7)} /> : null}
            <Reanimated.View style={[StyleSheet.absoluteFill, body]}>
              <BigFlame
                level={level}
                size={big}
                low={lit ? 0 : 1}
                calm
                asleep={!awake}
                noLand
                pulse={wakeN}
                relight={[0, CATCH_MS]}
                smoke="#191233"
                label={lit ? 'Your flame, lit' : 'Your flame, waiting to be lit'}
                heart={lit ? null : <Ember size={big * 0.3} wait={wait} fan={fan} drop={big * BELLY} />}
              />
            </Reanimated.View>
            {!still && beat === 0 ? <Motes v={drift} x={heart.x} y={heart.y} size={big} fade={fan} /> : null}
            {!still ? <Burst v={burst} x={heart.x} y={heart.y} reach={Math.max(win.width, win.height * 0.7)} /> : null}
            {!still ? <Puffs v={puffs} size={big} x={heart.x} y={heart.y} /> : null}
          </View>

          <View style={s.count} pointerEvents="box-none" accessible={beat > 0} accessibilityLabel={(beat ? m.to : m.from) + ' ' + m.unit}>
            {beat === 0 ? (
              <Reanimated.View style={[s.hintWrap, hintIn]} pointerEvents="box-none">
                <Pressable accessibilityRole="button" accessibilityLabel="Light your flame" onPress={light} style={s.hint}>
                  <Text style={s.hintText}>{hint}</Text>
                </Pressable>
              </Reanimated.View>
            ) : (
              <>
                <View style={[s.numBox, { height: H }]}>
                  {showOld ? (
                    <Reanimated.Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.4} style={[s.num, s.over, { color: GREY }, oldIn]}>
                      {m.from}
                    </Reanimated.Text>
                  ) : null}
                  <Reanimated.Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.4} style={[s.num, s.over, { color: ORANGE }, neu]}>
                    {m.to}
                  </Reanimated.Text>
                </View>
                <Reanimated.Text style={[s.unit, unitIn]}>{m.unit}</Reanimated.Text>
              </>
            )}
          </View>
          {/* the row of days, right under the number as in Duolingo's; its place is kept from the start, so nothing moves when it comes */}
          {m.row.length ? (
            <View style={[s.row, s.rowIn]} accessible accessibilityLabel={rowSay(m.row.map((r) => r.m))}>
              {m.row.map((r, i) => (
                <Day key={r.k} r={r} on={i === pop} v={rowV} coin={coin} />
              ))}
            </View>
          ) : null}
        </Reanimated.View>

        <View style={[s.dock, { paddingBottom: inset.bottom + (SHORT ? 12 : 20) }]} pointerEvents="box-none">
          {goal ? <Goal goal={goal} v={goalV} seg={segV} /> : null}
          <View style={s.foot}>
            {beat === 2 ? (
              <Reanimated.View style={btnIn}>
                <Button label={button} kind="warm" onPress={onDone} />
              </Reanimated.View>
            ) : null}
          </View>
        </View>
      </View>
    </GestureDetector>
  );
}

/** one day of the row: they all fade in together as the column rises; the day just kept is a coin that flips over to its check */
function Day({ r, on, v, coin }: { r: IgniteDay; on: boolean; v: SharedValue<number>; coin: SharedValue<number> }) {
  const inSt = useAnimatedStyle(() => ({ opacity: interpolate(v.value, [0.3, 1], [0, 1], 'clamp') }));
  return (
    <Reanimated.View style={[s.day, inSt]}>
      <Text style={[s.dayName, on && { color: ORANGE }]}>{r.d}</Text>
      {on ? <Coin v={coin} /> : <Mark m={r.m} />}
    </Reanimated.View>
  );
}

/** the ember, after the swipe: it dips, then stretches up into a tall streak of light that shrinks a little before it opens */
function Comet({ v, x, y, size }: { v: SharedValue<number>; x: number; y: number; size: number }) {
  const w = size * 0.2;
  const h = size * 0.6;
  const st = useAnimatedStyle(() => {
    const t = v.value;
    return {
      opacity: t <= 0 || t >= 1 ? 0 : 1,
      transform: [
        { translateX: x - w / 2 },
        { translateY: y - h / 2 - size * interpolate(t, [0, 0.3, 1], [0, 0.07, 0.1], 'clamp') },
        { scaleY: interpolate(t, [0, 0.15, 0.3, 0.45, 1], [0.34, 0.24, 1, 1, 0.75], 'clamp') },
        { scaleX: interpolate(t, [0, 0.15, 0.3, 1], [1, 0.75, 0.7, 0.55], 'clamp') },
      ],
    };
  });
  return (
    <Reanimated.View style={[{ position: 'absolute', left: 0, top: 0, width: w, height: h }, st]}>
      <Svg width={w} height={h} viewBox="0 0 20 80">
        <Defs>
          <RadialGradient id="igComet" cx="10" cy="44" rx="10" ry="40" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity="1" />
            <Stop offset="0.45" stopColor={GOLD} stopOpacity="1" />
            <Stop offset="1" stopColor={ORANGE} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Ellipse cx="10" cy="40" rx="9" ry="39" fill="url(#igComet)" />
      </Svg>
    </Reanimated.View>
  );
}

/* the stars that twinkle in the glow: [angle, distance as a share of the size, size, twinkle phase] */
const STARS: [number, number, number, number][] = [
  [-150, 0.2, 16, 0],
  [-60, 0.26, 20, 0.4],
  [10, 0.18, 13, 0.8],
  [100, 0.24, 17, 0.2],
  [190, 0.3, 12, 0.6],
  [-100, 0.1, 11, 1],
  [40, 0.34, 14, 0.3],
  [140, 0.12, 10, 0.7],
];
const STAR = 'M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0Z';
/** the gold glow the streak opens into: it grows (0 to 1) until it fills the screen, with stars twinkling in it, then goes (1 to 2) */
function Flash({ v, x, y, size, reach }: { v: SharedValue<number>; x: number; y: number; size: number; reach: number }) {
  const g = size * 1.4;
  const glow = useAnimatedStyle(() => {
    const t = v.value;
    return {
      opacity: t <= 0 ? 0 : t <= 1 ? Math.min(1, t * 4) : 2 - t,
      transform: [{ translateX: x - g / 2 }, { translateY: y - g / 2 }, { scale: interpolate(t, [0, 0.55, 1], [0.25, 0.9, (reach * 1.5) / g], 'clamp') }],
    };
  });
  return (
    <>
      <Reanimated.View style={[{ position: 'absolute', left: 0, top: 0, width: g, height: g }, glow]}>
        <Svg width={g} height={g} viewBox="0 0 100 100">
          <Defs>
            <RadialGradient id="igGlow" cx="50" cy="50" r="50" gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor="#FFF6D0" stopOpacity="1" />
              <Stop offset="0.25" stopColor={GOLD} stopOpacity="0.85" />
              <Stop offset="0.6" stopColor={ORANGE} stopOpacity="0.3" />
              <Stop offset="1" stopColor={ORANGE} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx="50" cy="50" r="50" fill="url(#igGlow)" />
        </Svg>
      </Reanimated.View>
      {STARS.map(([a, d, z, ph], i) => (
        <FlashStar key={i} v={v} x={x} y={y} a={a} d={d * size} z={z} ph={ph} />
      ))}
    </>
  );
}
function FlashStar({ v, x, y, a, d, z, ph }: { v: SharedValue<number>; x: number; y: number; a: number; d: number; z: number; ph: number }) {
  const rad = (a * Math.PI) / 180;
  const st = useAnimatedStyle(() => {
    const t = v.value;
    const tw = 0.6 + 0.4 * Math.abs(Math.sin((t * 3 + ph) * Math.PI));
    const r = d * (0.5 + 0.9 * Math.min(1, t));
    return {
      opacity: t <= 0 ? 0 : t <= 1 ? Math.min(1, t * 3) : 2 - t,
      transform: [
        { translateX: x + Math.cos(rad) * r - z / 2 },
        { translateY: y + Math.sin(rad) * r - z / 2 },
        { scale: Math.min(1, t * 3) * tw },
        { rotate: 45 * t + 'deg' },
      ],
    };
  });
  return (
    <Reanimated.View style={[{ position: 'absolute', left: 0, top: 0, width: z, height: z }, st]}>
      <Svg width={z} height={z} viewBox="0 0 24 24">
        <Path d={STAR} fill="#FFFFFF" />
      </Svg>
    </Reanimated.View>
  );
}

/* the white slashes that shoot out of the glow as it swells: [angle, how far as a share of the reach] */
const SLASHES: [number, number][] = [
  [-100, 0.42],
  [-30, 0.36],
  [35, 0.4],
  [120, 0.44],
  [165, 0.3],
  [-160, 0.34],
];
function Slashes({ v, x, y, reach }: { v: SharedValue<number>; x: number; y: number; reach: number }) {
  return (
    <>
      {SLASHES.map(([a, d], i) => (
        <SlashOne key={i} v={v} x={x} y={y} a={a} d={d * reach} />
      ))}
    </>
  );
}
function SlashOne({ v, x, y, a, d }: { v: SharedValue<number>; x: number; y: number; a: number; d: number }) {
  const rad = (a * Math.PI) / 180;
  const w = 8;
  const h = 46;
  const st = useAnimatedStyle(() => {
    const t = v.value;
    const r = d * (0.15 + 0.85 * t);
    return {
      opacity: t <= 0 || t >= 1 ? 0 : t < 0.15 ? t / 0.15 : 1 - Math.max(0, (t - 0.55) / 0.45),
      transform: [{ translateX: x + Math.cos(rad) * r - w / 2 }, { translateY: y + Math.sin(rad) * r - h / 2 }, { rotate: a + 90 + 'deg' }],
    };
  });
  return <Reanimated.View style={[{ position: 'absolute', left: 0, top: 0, width: w, height: h, borderRadius: w, backgroundColor: '#FFFFFF' }, st]} />;
}

/* the burst as the flame catches: big petals of fire, bits and stars thrown across the whole screen. A fixed spread, so it falls the
   same way every time. [angle, distance as a share of the reach, width, length, spin in degrees, kind: 0 petal, 1 bit, 2 star] */
const BURST: [number, number, number, number, number, 0 | 1 | 2][] = [
  [-90, 1.1, 36, 104, 40, 0],
  [-55, 1.2, 30, 90, -70, 0],
  [-125, 1.2, 34, 98, 60, 0],
  [-20, 1.0, 28, 82, -90, 0],
  [-160, 1.0, 28, 78, 80, 0],
  [20, 0.95, 25, 70, 110, 0],
  [160, 0.95, 25, 72, -110, 0],
  [70, 1.0, 22, 66, 70, 0],
  [115, 1.0, 22, 64, -60, 0],
  [-72, 0.3, 9, 9, 180, 1],
  [-108, 0.28, 8, 8, -160, 1],
  [-38, 0.26, 8, 8, 200, 1],
  [-142, 0.24, 9, 9, -200, 1],
  [5, 0.22, 7, 7, 150, 1],
  [175, 0.22, 7, 7, -150, 1],
  [45, 0.2, 8, 8, 120, 1],
  [135, 0.2, 8, 8, -120, 1],
  [-82, 0.36, 18, 18, 90, 2],
  [-30, 0.3, 14, 14, -90, 2],
  [-150, 0.32, 15, 15, 90, 2],
  [60, 0.3, 13, 13, -90, 2],
];
const PETAL = 'M10 0 C19 18 18 44 10 60 C3 44 0 20 10 0Z';
function Burst({ v, x, y, reach }: { v: SharedValue<number>; x: number; y: number; reach: number }) {
  return (
    <>
      {BURST.map((b, i) => (
        <Piece key={i} v={v} x={x} y={y} reach={reach} b={b} i={i} />
      ))}
    </>
  );
}
function Piece({ v, x, y, reach, b, i }: { v: SharedValue<number>; x: number; y: number; reach: number; b: (typeof BURST)[number]; i: number }) {
  const [a, d, w, h, spin, kind] = b;
  const rad = (a * Math.PI) / 180;
  const st = useAnimatedStyle(() => {
    const t = v.value;
    const r = reach * d * (kind === 0 ? 1 - (1 - t) * (1 - t) * (1 - t) * (1 - t) : t);
    /* a little fall at the end, as if the petals had weight; the bits linger around the flame and drift */
    const fall = reach * (kind === 1 ? 0.04 : 0.12) * t * t;
    return {
      opacity: t <= 0 || t >= 1 ? 0 : t < 0.06 ? t / 0.06 : 1 - Math.max(0, (t - (kind === 1 ? 0.6 : 0.35)) / (kind === 1 ? 0.4 : 0.65)),
      transform: [
        { translateX: x + Math.cos(rad) * r - w / 2 },
        { translateY: y + Math.sin(rad) * r + fall - h / 2 },
        { rotate: a + 90 + spin * t + 'deg' },
        { scale: kind === 2 ? Math.sin(Math.min(1, t * 1.6) * Math.PI) : 1 - 0.3 * t },
      ],
    };
  });
  const color = kind === 2 ? '#FFFFFF' : i % 3 === 0 ? GOLD : ORANGE;
  return (
    <Reanimated.View style={[{ position: 'absolute', left: 0, top: 0, width: w, height: h }, st]}>
      {kind === 0 ? (
        <Svg width={w} height={h} viewBox="0 0 20 60" preserveAspectRatio="none">
          <Path d={PETAL} fill={color} />
        </Svg>
      ) : kind === 1 ? (
        <View style={{ width: w, height: h, borderRadius: 2, backgroundColor: color }} />
      ) : (
        <Svg width={w} height={h} viewBox="0 0 24 24">
          <Path d={STAR} fill={color} />
        </Svg>
      )}
    </Reanimated.View>
  );
}

/* the puffs the flame wakes in, a cluster over its face: [x, y as shares of the size from the face, radius as a share] */
const PUFFS: [number, number, number][] = [
  [0, 0, 0.16],
  [0.17, -0.07, 0.13],
  [-0.16, -0.05, 0.12],
  [0.12, 0.15, 0.13],
  [-0.12, 0.14, 0.12],
  [0.27, 0.09, 0.09],
  [-0.27, 0.07, 0.09],
  [0.04, -0.21, 0.1],
  [-0.06, 0.26, 0.09],
  [0.28, -0.16, 0.07],
  [-0.24, -0.19, 0.07],
];
/** it swells over the face in about 150 ms, holds while the flame wakes under it, and breaks apart outward */
function Puffs({ v, size, x, y }: { v: SharedValue<number>; size: number; x: number; y: number }) {
  return (
    <>
      {PUFFS.map((p, i) => (
        <PuffOne key={i} v={v} size={size} x={x} y={y - size * 0.1} p={p} i={i} />
      ))}
    </>
  );
}
function PuffOne({ v, size, x, y, p, i }: { v: SharedValue<number>; size: number; x: number; y: number; p: [number, number, number]; i: number }) {
  const [dx, dy, rz] = p;
  const w = size * rz * 2;
  const s0 = i * 0.012;
  const st = useAnimatedStyle(() => {
    const t = v.value;
    const swell = interpolate(t, [s0, s0 + 0.2, s0 + 0.29], [0, 1.12, 1], 'clamp');
    const u = interpolate(t, [0.45, 1], [0, 1], 'clamp');
    const out = 1 + 1.3 * u;
    return {
      opacity: t <= 0 || t >= 1 ? 0 : 1,
      transform: [{ translateX: x + dx * size * out - w / 2 }, { translateY: y + dy * size * out - w / 2 }, { scale: swell * (1 - u) }],
    };
  });
  return (
    <Reanimated.View
      style={[
        { position: 'absolute', left: 0, top: 0, width: w, height: w, borderRadius: w, backgroundColor: PUFF, borderWidth: 2, borderColor: '#FFDCA8' },
        st,
      ]}
    />
  );
}

/** the day just kept: an orange coin that jumps out of its slot, flips over to its check, and lands with a squash and sparks */
function Coin({ v }: { v: SharedValue<number> }) {
  const D = 30;
  const T = 6;
  /* ms along the coin's own clock */
  const lift = useAnimatedStyle(() => {
    const ms = v.value * COIN_ALL;
    const up =
      ms < 250 ? 1 - (1 - ms / 250) * (1 - ms / 250) : ms < 330 ? 1 : ms < COIN_FLY ? 1 - ((ms - 330) / (COIN_FLY - 330)) * ((ms - 330) / (COIN_FLY - 330)) : 0;
    const sc = interpolate(ms, [0, 250, 400, COIN_FLY], [0.9, 1.25, 1.2, 1], 'clamp');
    return {
      opacity: v.value > 0 ? 1 : 0,
      transformOrigin: ['50%', '100%', 0],
      transform: [
        { translateY: -D * 1.3 * up },
        { scaleX: sc * interpolate(ms, [COIN_FLY, COIN_FLY + 40, COIN_FLY + 100], [1, 1.22, 1], 'clamp') },
        { scaleY: sc * interpolate(ms, [COIN_FLY, COIN_FLY + 40, COIN_FLY + 100], [1, 0.62, 1], 'clamp') },
      ],
    };
  });
  /* the turn on its flat axis: -90 (edge on) to 0 (the plain face) to 90 to 180 (the check) */
  const deg = (x: number) => {
    'worklet';
    return interpolate(x * COIN_ALL, [0, 80, 230, 400], [-90, 0, 90, 180], 'clamp');
  };
  const face = useAnimatedStyle(() => ({ transform: [{ scaleY: Math.max(0.08, Math.abs(Math.cos((deg(v.value) * Math.PI) / 180))) }] }));
  const plain = useAnimatedStyle(() => ({ opacity: deg(v.value) < 90 ? 1 : 0 }));
  const checked = useAnimatedStyle(() => ({ opacity: deg(v.value) < 90 ? 0 : 1 }));
  /* its edge shows below the face while it is turned */
  const edge = useAnimatedStyle(() => {
    const k = Math.abs(Math.sin((deg(v.value) * Math.PI) / 180)) * T;
    const f = Math.max(0.08, Math.abs(Math.cos((deg(v.value) * Math.PI) / 180)));
    return { transform: [{ translateY: k }, { scaleY: f }] };
  });
  const band = useAnimatedStyle(() => ({ height: Math.abs(Math.sin((deg(v.value) * Math.PI) / 180)) * T }));
  return (
    <View style={s.dotBox}>
      <View style={[s.dot, s.untold]} />
      <Reanimated.View style={[StyleSheet.absoluteFill, s.center, lift]}>
        <Reanimated.View style={[StyleSheet.absoluteFill, edge, s.dot, { backgroundColor: '#C25A0C' }]} />
        <Reanimated.View style={[{ position: 'absolute', left: 0, right: 0, top: D / 2, backgroundColor: '#C25A0C' }, band]} />
        <Reanimated.View style={[StyleSheet.absoluteFill, face]}>
          <Reanimated.View style={[StyleSheet.absoluteFill, s.dot, { backgroundColor: ORANGE, overflow: 'hidden' }, plain]}>
            <View style={s.shine} />
          </Reanimated.View>
          <Reanimated.View style={[StyleSheet.absoluteFill, s.dot, { backgroundColor: ORANGE }, checked]}>
            <Icon name="check" size={16} color="#3A1A00" />
          </Reanimated.View>
        </Reanimated.View>
      </Reanimated.View>
      {COIN_SPARKS.map((c, i) => (
        <CoinSpark key={i} v={v} c={c} />
      ))}
    </View>
  );
}

/* the sparks the coin throws as it lands: [angle, how far past its edge, spin, kind: 0 a gold square, 1 an orange sliver] */
const COIN_SPARKS: [number, number, number, 0 | 1][] = [
  [-150, 30, 160, 0],
  [-110, 24, -120, 1],
  [-60, 28, 140, 1],
  [-20, 22, -160, 0],
  [25, 26, 120, 1],
  [70, 20, -140, 0],
  [120, 26, 150, 1],
  [165, 32, -110, 0],
];
function CoinSpark({ v, c }: { v: SharedValue<number>; c: (typeof COIN_SPARKS)[number] }) {
  const [a, d, spin, kind] = c;
  const rad = (a * Math.PI) / 180;
  const w = kind === 0 ? 7 : 3;
  const h = kind === 0 ? 7 : 11;
  const st = useAnimatedStyle(() => {
    const t = interpolate(v.value * COIN_ALL, [COIN_FLY, COIN_ALL], [0, 1], 'clamp');
    const e = 1 - (1 - t) * (1 - t);
    const r = 14 + d * e;
    return {
      opacity: t <= 0 || t >= 1 ? 0 : 1 - t * t,
      transform: [{ translateX: Math.cos(rad) * r - w / 2 }, { translateY: Math.sin(rad) * r + 10 * t * t - h / 2 }, { rotate: a + 90 + spin * t + 'deg' }],
    };
  });
  return (
    <Reanimated.View
      style={[
        { position: 'absolute', left: 15, top: 15, width: w, height: h, borderRadius: kind === 0 ? 1.5 : 2, backgroundColor: kind === 0 ? GOLD : ORANGE },
        st,
      ]}
    />
  );
}

/** the small goal: "Goal: 3 free nights", how far along, and a bar of segments whose newest one pops in (gold when the goal is kept) */
function Goal({ goal, v, seg }: { goal: { of: number; kept: boolean; segs: number; lit: number }; v: SharedValue<number>; seg: SharedValue<number> }) {
  const boxIn = useAnimatedStyle(() => ({ opacity: v.value, transform: [{ translateY: 10 * (1 - v.value) }] }));
  const newIn = useAnimatedStyle(() => ({
    opacity: Math.min(1, seg.value * 2),
    transform: [{ scaleY: 0.4 + 0.6 * seg.value }, { scaleX: 0.7 + 0.3 * seg.value }],
  }));
  /* up to a week it counts nights; after that, weeks (the bar is the week being built) */
  const what = goal.of < 7 ? goal.of + ' free nights' : goal.of === 7 ? 'a whole week free' : goal.of / 7 + ' weeks free';
  const say = (goal.kept ? 'Goal kept: ' : 'Goal: ') + what;
  const left = goal.of - (goal.lit + goal.of - goal.segs);
  return (
    <Reanimated.View style={[s.goal, boxIn]} accessible accessibilityLabel={say + (goal.kept ? '' : ', ' + left + ' to go')}>
      <View style={s.goalHead}>
        <Text style={[s.goalText, goal.kept && { color: GOLD }]}>{say}</Text>
        {!goal.kept ? <Text style={s.goalLeft}>{left === 1 ? '1 to go' : left + ' to go'}</Text> : null}
      </View>
      <View style={s.segs}>
        {Array.from({ length: goal.segs }, (_, i) => (
          <View key={i} style={s.seg}>
            {i < goal.lit - 1 ? <View style={[s.segOn, { backgroundColor: goal.kept ? GOLD : ORANGE }]} /> : null}
            {i === goal.lit - 1 ? <Reanimated.View style={[s.segOn, { backgroundColor: goal.kept ? GOLD : ORANGE }, newIn]} /> : null}
          </View>
        ))}
      </View>
    </Reanimated.View>
  );
}

/** the ember in the heart of the unlit flame: it pulses while it waits, grows hot as the finger fans it */
function Ember({ size, wait, fan, drop }: { size: number; wait: SharedValue<number>; fan: SharedValue<number>; drop: number }) {
  const st = useAnimatedStyle(() => ({
    opacity: fan.value >= 1 ? 0 : 0.8 + 0.2 * Math.max(wait.value, fan.value),
    transform: [{ translateY: drop }, { scale: 0.82 + 0.16 * wait.value + 0.55 * fan.value }],
  }));
  return (
    <Reanimated.View style={[{ width: size, height: size }, st]}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <RadialGradient id="igEmber" cx="50" cy="50" r="50" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#FFFBEA" stopOpacity="1" />
            <Stop offset="0.2" stopColor={GOLD} stopOpacity="1" />
            <Stop offset="0.45" stopColor={ORANGE} stopOpacity="0.5" />
            <Stop offset="1" stopColor={ORANGE} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx="50" cy="50" r="50" fill="url(#igEmber)" />
      </Svg>
    </Reanimated.View>
  );
}

/* sparks drifting up from the waiting ember: [x offset as a share of the size, how far up, phase, dot size, gold or white] */
const MOTES: [number, number, number, number, boolean][] = [
  [-0.18, 0.55, 0, 4, true],
  [0.14, 0.6, 0.22, 3, false],
  [-0.05, 0.7, 0.45, 3, true],
  [0.24, 0.5, 0.63, 4, true],
  [-0.26, 0.45, 0.8, 3, false],
];
function Motes({ v, x, y, size, fade }: { v: SharedValue<number>; x: number; y: number; size: number; fade: SharedValue<number> }) {
  return (
    <>
      {MOTES.map((mo, i) => (
        <Mote key={i} v={v} x={x} y={y} size={size} fade={fade} mo={mo} />
      ))}
    </>
  );
}
function Mote({
  v,
  x,
  y,
  size,
  fade,
  mo,
}: {
  v: SharedValue<number>;
  x: number;
  y: number;
  size: number;
  fade: SharedValue<number>;
  mo: [number, number, number, number, boolean];
}) {
  const [dx, up, ph, d, gold] = mo;
  const st = useAnimatedStyle(() => {
    const t = (v.value + ph) % 1;
    return {
      opacity: Math.sin(t * Math.PI) * (1 - fade.value),
      transform: [{ translateX: x + dx * size * (0.6 + 0.4 * t) - d / 2 }, { translateY: y - up * size * t - d / 2 }],
    };
  });
  return (
    <Reanimated.View style={[{ position: 'absolute', left: 0, top: 0, width: d, height: d, borderRadius: d, backgroundColor: gold ? GOLD : CREAM }, st]} />
  );
}

const rowSay = (ms: NightMark[]) => {
  const free = ms.filter((x) => x === 'free').length;
  return `Last 7 nights: ${free} free`;
};

/** a day before the one just kept, as it stands */
function Mark({ m }: { m: NightMark }) {
  if (m === 'free')
    return (
      <View style={[s.dot, { backgroundColor: ORANGE }]}>
        <Icon name="check" size={16} color="#3A1A00" />
      </View>
    );
  if (m === 'slip') return <View style={[s.dot, { backgroundColor: SLIP }]} />;
  if (m === 'untold') return <View style={[s.dot, s.untold]} />;
  if (m === 'ahead') return <View style={[s.dot, { backgroundColor: 'rgba(255,255,255,0.14)' }]} />;
  return <View style={[s.dot, { backgroundColor: 'rgba(255,255,255,0.08)' }]} />;
}

/** The quick step for an ordinary free morning (core igniteWhy null), in place on the morning page and never a page over it: the
    count turns over under the flame, with a knock. Its partner is the flame's own bloom (FlameMedallion's pulse). Reduce Motion: the
    new count, still. */
export function StepUp({ from, to, unit, color }: { from: string; to: string; unit: string; color: string }) {
  const still = useReducedMotion();
  const t = useSharedValue(still || from === to ? 1 : 0);
  useEffect(() => {
    if (still || from === to) return;
    t.value = withDelay(160, withSpring(1, { damping: 9, stiffness: 170 }));
    const id = setTimeout(() => knock(Haptics.ImpactFeedbackStyle.Medium), 220);
    return () => clearTimeout(id);
  }, [still, from, to, t]);
  /* the same turn as the lighting: the old count drops out, the new one drops in from above */
  const oldSt = useAnimatedStyle(() => ({ opacity: Math.max(0, 1 - t.value * 3), transform: [{ translateY: 40 * Math.min(1, t.value) }] }));
  const newSt = useAnimatedStyle(() => ({
    opacity: Math.max(0, Math.min(1, (t.value - 0.25) * 2)),
    transform: [{ translateY: -40 * (1 - t.value) }, { scale: 0.8 + 0.2 * t.value }],
  }));
  return (
    <View style={s.step} accessible accessibilityLabel={to + ' ' + unit}>
      <View style={s.stepNum}>
        {from !== to ? <Reanimated.Text style={[s.stepN, s.over, { color }, oldSt]}>{from}</Reanimated.Text> : null}
        <Reanimated.Text style={[s.stepN, s.over, { color }, newSt]}>{to}</Reanimated.Text>
      </View>
      <Text style={[s.stepU, { color }]}>{unit}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#100C24' },
  center: { alignItems: 'center', justifyContent: 'center' },
  top: { position: 'absolute', left: 0, right: 0, top: 0, paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'flex-end', zIndex: 2 },
  x: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: nightInk.btn },
  col: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingTop: 56 },
  bubble: { minHeight: 92, maxWidth: 340, alignSelf: 'stretch', justifyContent: 'flex-end', marginBottom: 6 },
  /* the number shrinks to fit on one line, so a word in it ("Day 1") never breaks (WP10, November 13, 2026) */
  count: { alignItems: 'center', marginTop: -4, alignSelf: 'stretch', minHeight: SHORT ? 104 : 128 },
  numBox: { justifyContent: 'center', alignItems: 'center', minWidth: 120, alignSelf: 'stretch', overflow: 'hidden' },
  num: { fontFamily: font.display, fontSize: SHORT ? 80 : 100, lineHeight: SHORT ? 88 : 108, textAlign: 'center' },
  over: { position: 'absolute', left: 0, right: 0 },
  unit: { fontFamily: font.bodyBold, fontSize: 20, color: ORANGE, marginTop: -2 },
  dock: { paddingHorizontal: 16, gap: 20 },
  rowIn: { marginTop: SHORT ? 14 : 22 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignSelf: 'center', width: '100%', maxWidth: 340 },
  day: { alignItems: 'center', gap: 6, width: 40 },
  dayName: { fontFamily: font.bodySemi, fontSize: 13, color: nightInk.muted },
  dotBox: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  untold: { borderWidth: 2, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.3)' },
  shine: { position: 'absolute', left: 4, top: -6, width: 7, height: 44, backgroundColor: 'rgba(255,240,200,0.55)', transform: [{ rotate: '35deg' }] },
  foot: { minHeight: 56, justifyContent: 'center' },
  goal: { alignSelf: 'center', width: '100%', maxWidth: 340, gap: 8 },
  goalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  goalText: { fontFamily: font.bodyBold, fontSize: 15, color: nightInk.ink },
  goalLeft: { fontFamily: font.bodySemi, fontSize: 15, color: nightInk.muted },
  segs: { flexDirection: 'row', gap: 6 },
  seg: { flex: 1, height: 14, borderRadius: 7, backgroundColor: 'rgba(255,255,255,0.14)', overflow: 'hidden' },
  segOn: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, borderRadius: 7 },
  hintWrap: { alignItems: 'center', paddingTop: 12 },
  hint: { alignItems: 'center', gap: 6, minHeight: 56, justifyContent: 'center', paddingHorizontal: 24 },
  hintText: { fontFamily: font.bodyBold, fontSize: 17, color: nightInk.ink },
  step: { alignItems: 'center' },
  stepNum: { height: 52, minWidth: 80, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  stepN: { fontFamily: font.display, fontSize: 46, lineHeight: 52, textAlign: 'center' },
  stepU: { fontFamily: font.bodyBold, fontSize: 15, marginTop: -2 },
});
