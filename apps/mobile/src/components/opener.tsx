/* The big opener of a win, shared (an urge ridden out; the lesson finish has its own copy of the same moves inside its page).
   Calm, from Duolingo's perfect-lesson end (the owner, November 14, 2026: "theres no bouncing and it's very clean", "too much
   confetti", and of the ride's ending: "it's definitely better than before but it's fs missing something"): a tilted band glides
   in across the night with the flame big inside it, the shout rises under it and a few gold glints drift off the words (a heavy
   knock, one buzz, a chime when sound is on). Then one continuous move: the band and the night fade as the flame travels down
   and shrinks into its place on the page under it (`to`, measured by the page), so the page's flame is this same flame landing,
   never a second one. Without `to` it simply fades. A tap skips ahead. `onLeave` fires as it starts to go, so the page mounts
   under it and can report `to`; `onEnd` once it is gone. Under Reduce Motion, or with celebrations off, do not show it.
   The flame is drawn at its biggest and only ever scaled down, so it stays sharp (iOS scales the drawn picture). */
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View, type ViewInstance } from 'react-native';
import Reanimated, { Easing, interpolate, runOnJS, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { BigFlame } from '@/components/big-flame';
import { Glints } from '@/components/reward-kit';
import { Text } from '@/components/text';
import { buzz, knock } from '@/lib/feel';
import { play } from '@/lib/sound';
import { font } from '@/lib/theme';

export const OPEN_NIGHT = '#16113A';
export const OPEN_GOLD = '#FFD25A';
const BAND = '#3A2C8F';
const OUT = Easing.out(Easing.cubic);
const BOTH = Easing.inOut(Easing.cubic);
/** the band glides in; it holds; then the flame travels to its place */
const IN = 380;
const HOLD = 1150;
const TRAVEL = 560;

/** where the flame lands on the page: its middle, in the window, and its size */
export type FlameSpot = { x: number; y: number; size: number };

export function Opener({ level, shout, to, onLeave, onEnd }: { level: number; shout: string; to?: FlameSpot | null; onLeave?: () => void; onEnd: () => void }) {
  const win = useWindowDimensions();
  const enter = useSharedValue(0);
  /* 1 = the flame big in the band, 0 = landed in its place */
  const open = useSharedValue(1);
  const drift = useSharedValue(0);
  const say = useSharedValue(0);
  const glint = useSharedValue(0);
  const left = useRef(false);
  const [leaving, setLeaving] = useState(false);
  const [live, setLive] = useState(true);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const root = useRef<ViewInstance>(null);
  const [origin, setOrigin] = useState({ x: 0, y: 0 });

  const finish = () => {
    setLive(false);
    onEnd();
  };
  const leave = () => {
    if (left.current) return;
    left.current = true;
    timers.current.forEach(clearTimeout);
    enter.value = withTiming(1, { duration: 200, easing: OUT });
    onLeave?.();
    setLeaving(true);
  };
  /* once the page has said where its flame stands (or a short wait says it will not), the one move to it */
  useEffect(() => {
    if (!leaving) return;
    const go = (ms: number) => {
      open.value = withTiming(0, { duration: ms, easing: BOTH }, (fin) => {
        if (fin) runOnJS(finish)();
      });
    };
    if (to) go(TRAVEL);
    else {
      const t = setTimeout(() => go(420), 250);
      return () => clearTimeout(t);
    }
  }, [leaving, to]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    knock(Haptics.ImpactFeedbackStyle.Heavy);
    play('chime');
    enter.value = withTiming(1, { duration: IN, easing: OUT });
    drift.value = withTiming(1, { duration: HOLD + TRAVEL, easing: Easing.linear });
    say.value = withDelay(140, withTiming(1, { duration: 420, easing: OUT }));
    glint.value = withDelay(180, withTiming(1, { duration: 1700, easing: Easing.linear }));
    const t = timers.current;
    t.push(setTimeout(() => buzz('lit'), 200));
    t.push(setTimeout(leave, HOLD));
    return () => t.forEach(clearTimeout);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const B = Math.round(Math.min(win.width * 0.78, win.height * 0.42, 340));
  const midY = win.height * 0.4;
  const bandH = B * 0.82 + 96;
  const shoutY = midY + B * 0.42;
  /* the landing, in this view's own frame */
  const tx = to ? to.x - origin.x - win.width / 2 : 0;
  const ty = to ? to.y - origin.y - midY : 0;
  const k = to ? to.size / B : 0.6;
  const bgIn = useAnimatedStyle(() => ({ opacity: interpolate(open.value, [0, 0.85], [0, 1], 'clamp') }));
  const bandIn = useAnimatedStyle(() => ({
    opacity: enter.value * interpolate(open.value, [0.35, 1], [0, 1], 'clamp'),
    transform: [
      { translateX: -win.width * 0.6 * (1 - enter.value) + 16 * drift.value },
      { rotate: '-8deg' },
      { scaleY: interpolate(open.value, [0, 1], [0.7, 1]) },
    ],
  }));
  const flameIn = useAnimatedStyle(() => ({
    opacity: Math.min(1, enter.value * 1.4) * (to ? 1 : interpolate(open.value, [0, 0.6], [0, 1], 'clamp')),
    transform: [
      { translateX: tx * (1 - open.value) },
      { translateY: ty * (1 - open.value) },
      { scale: (k + (1 - k) * open.value) * (0.92 + 0.08 * enter.value) * (1 + 0.025 * drift.value * open.value) },
    ],
  }));
  const sayIn = useAnimatedStyle(() => ({
    opacity: say.value * interpolate(open.value, [0.55, 1], [0, 1], 'clamp'),
    transform: [{ translateY: 10 * (1 - say.value) }],
  }));

  if (!live) return null;
  return (
    <View
      ref={root}
      onLayout={() => root.current?.measureInWindow((x, y) => setOrigin({ x, y }))}
      style={StyleSheet.absoluteFill}
      pointerEvents={leaving ? 'none' : 'auto'}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <Reanimated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: OPEN_NIGHT }, bgIn]} />
      <Reanimated.View
        pointerEvents="none"
        style={[s.band, { width: win.width * 1.6, height: bandH, left: -win.width * 0.3, top: midY - bandH / 2 }, bandIn]}
      />
      <Reanimated.View pointerEvents="none" style={[{ position: 'absolute', width: B, height: B, left: (win.width - B) / 2, top: midY - B / 2 }, flameIn]}>
        <BigFlame level={level} size={B} noLand />
      </Reanimated.View>
      <Reanimated.View pointerEvents="none" style={[s.shout, { top: shoutY }, sayIn]}>
        <Text style={s.shoutText} numberOfLines={2}>
          {shout}
        </Text>
      </Reanimated.View>
      <Glints v={glint} open={open} x={win.width / 2} y={shoutY + 26} />
      {leaving ? null : <Pressable style={StyleSheet.absoluteFill} accessible={false} onPress={leave} />}
    </View>
  );
}

const s = StyleSheet.create({
  band: { position: 'absolute', backgroundColor: BAND, borderRadius: 28 },
  shout: { position: 'absolute', left: 0, right: 0, alignItems: 'center', paddingHorizontal: 24 },
  shoutText: { fontFamily: font.display, fontSize: 40, lineHeight: 46, color: OPEN_GOLD, textAlign: 'center' },
});
