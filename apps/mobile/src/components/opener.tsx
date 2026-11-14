/* The big opener of a win, the one the lesson finish starts with (the owner, November 13, 2026: "i love the celebration"),
   shared so every win gets it (the owner, November 12, 2026: "i honestly want constant celebrations"). Modeled on Duolingo's:
   a tilted band sweeps in across a flat night with the flame huge inside it, a short shout settles in in sun yellow, with no
   confetti and no bounce (the owner, November 14, 2026: too much confetti) (a heavy knock, then a buzz, and a chime when sound is on). After a beat the band slides off, the flame and the night
   fade, and the page under it shows. A tap skips ahead. It lays itself over the page: `onLeave` fires as it starts to go, so the
   page can mount under it, and `onEnd` once it is gone. Under Reduce Motion, or with celebrations off, do not show it.
   The flame is drawn at its biggest and only ever scaled down, so it stays sharp (iOS scales the drawn picture). */
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Reanimated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { BigFlame } from '@/components/big-flame';
import { Text } from '@/components/text';
import { buzz, knock } from '@/lib/feel';
import { SETTLE, SETTLE_SLOW } from '@/lib/motion';
import { play } from '@/lib/sound';
import { font } from '@/lib/theme';

export const OPEN_NIGHT = '#16113A';
export const OPEN_GOLD = '#FFD25A';
const BAND = '#3A2C8F';
const CONFETTI = [OPEN_GOLD, '#FF8A5B', '#FFFFFF', '#A898FF', OPEN_GOLD];
/** how long the opener holds before it leaves, and how long leaving takes */
const HOLD = 1600;
const LEAVE = 450;

export function Opener({ level, shout, onLeave, onEnd }: { level: number; shout: string; onLeave?: () => void; onEnd: () => void }) {
  const win = useWindowDimensions();
  const band = useSharedValue(0);
  const grow = useSharedValue(0);
  const say = useSharedValue(0);
  const gone = useSharedValue(0);
  const left = useRef(false);
  const [live, setLive] = useState(true);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const leave = () => {
    if (left.current) return;
    left.current = true;
    timers.current.forEach(clearTimeout);
    onLeave?.();
    band.value = withTiming(2, { duration: LEAVE, easing: Easing.in(Easing.cubic) });
    say.value = withTiming(0, { duration: 200 });
    gone.value = withTiming(1, { duration: LEAVE, easing: Easing.in(Easing.quad) }, (fin) => {
      if (fin) runOnJS(finish)();
    });
  };
  const finish = () => {
    setLive(false);
    onEnd();
  };

  useEffect(() => {
    knock(Haptics.ImpactFeedbackStyle.Heavy);
    band.value = withSpring(1, SETTLE_SLOW);
    grow.value = withDelay(80, withSpring(1, SETTLE_SLOW));
    const t = timers.current;
    t.push(
      setTimeout(() => {
        play('chime');
        say.value = withSpring(1, SETTLE);
      }, 260),
    );
    t.push(
      setTimeout(() => {
        buzz('lit');
      }, 300),
    );
    t.push(setTimeout(leave, HOLD));
    return () => t.forEach(clearTimeout);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const F = Math.round(Math.min(win.width * 0.78, win.height * 0.42, 340));
  const midY = win.height * 0.4;
  const bandH = win.height * 0.56;
  const bgIn = useAnimatedStyle(() => ({ opacity: 1 - gone.value }));
  const bandIn = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(band.value, [0, 1, 2], [-win.width * 1.8, 0, win.width * 1.8]) }, { rotate: '-10deg' }],
  }));
  const flameIn = useAnimatedStyle(() => ({
    opacity: 1 - gone.value,
    transform: [{ scale: interpolate(grow.value, [0, 1], [0.3, 1]) * (1 - 0.35 * gone.value) }],
  }));
  const sayIn = useAnimatedStyle(() => ({ opacity: Math.min(1, say.value * 1.5), transform: [{ scale: interpolate(say.value, [0, 1], [0.4, 1]) }] }));

  if (!live) return null;
  return (
    <View style={StyleSheet.absoluteFill} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Reanimated.View style={[StyleSheet.absoluteFill, { backgroundColor: OPEN_NIGHT }, bgIn]} />
      <Reanimated.View
        pointerEvents="none"
        style={[s.band, { width: win.width * 1.8, height: bandH, left: -win.width * 0.4, top: midY - bandH / 2 + 40 }, bandIn]}
      />
      <Reanimated.View pointerEvents="none" style={[{ position: 'absolute', width: F, height: F, left: (win.width - F) / 2, top: midY - F / 2 }, flameIn]}>
        <BigFlame level={level} size={F} noLand />
      </Reanimated.View>
      <Reanimated.View pointerEvents="none" style={[s.shout, { top: midY + F / 2 - 6 }, sayIn]}>
        <Text style={s.shoutText} numberOfLines={2}>
          {shout}
        </Text>
      </Reanimated.View>
      <Pressable style={StyleSheet.absoluteFill} accessible={false} onPress={leave} />
    </View>
  );
}

type Piece = { vx: number; vy: number; spin: number; c: string; s: number };
/** confetti: small squares thrown up from the flame, tumbling as they fall */
export function Confetti({ v, x, y, w }: { v: SharedValue<number>; x: number; y: number; w: number }) {
  const [bits] = useState<Piece[]>(() =>
    Array.from({ length: 28 }, (_, i) => {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.3;
      const sp = 0.45 + Math.random() * 0.6;
      return {
        vx: Math.cos(a) * sp * w * 0.75,
        vy: Math.sin(a) * sp * w * 1.1,
        spin: (Math.random() - 0.5) * 900,
        c: CONFETTI[i % CONFETTI.length],
        s: 7 + Math.random() * 6,
      };
    }),
  );
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {bits.map((b, i) => (
        <Bit key={i} v={v} x={x} y={y} b={b} />
      ))}
    </View>
  );
}
function Bit({ v, x, y, b }: { v: SharedValue<number>; x: number; y: number; b: Piece }) {
  const st = useAnimatedStyle(() => {
    const t = v.value;
    return {
      opacity: t <= 0 || t >= 1 ? 0 : t > 0.75 ? (1 - t) * 4 : 1,
      transform: [
        { translateX: x + b.vx * t - b.s / 2 },
        { translateY: y + b.vy * t + 900 * t * t - b.s / 2 },
        { rotate: `${b.spin * t}deg` },
        { scaleY: 0.5 + 0.5 * Math.abs(Math.cos(t * 12 + b.spin)) },
      ],
    };
  });
  return <Reanimated.View style={[{ position: 'absolute', left: 0, top: 0, width: b.s, height: b.s, borderRadius: 2, backgroundColor: b.c }, st]} />;
}

const s = StyleSheet.create({
  band: { position: 'absolute', backgroundColor: BAND, borderRadius: 28 },
  shout: { position: 'absolute', left: 0, right: 0, alignItems: 'center', paddingHorizontal: 24 },
  shoutText: { fontFamily: font.display, fontSize: 46, lineHeight: 50, color: OPEN_GOLD, textAlign: 'center' },
});
