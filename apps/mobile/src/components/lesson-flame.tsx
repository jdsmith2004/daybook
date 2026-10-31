/* The one flame of a lesson. It is drawn once, behind the words, and glides from card to card to wherever the card has left room for it
   (FlameSlot), growing a little as the lesson goes on. It never leaves and comes back: on the violet number card it only fades. With
   Reduce Motion on, it is simply there. Bubble is what it says, in warm paper with a tail that points at it. */
import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode, type RefObject } from 'react';
import { Animated, Pressable, StyleSheet, View, type ViewInstance, type ViewStyle } from 'react-native';

import { BigFlame } from '@/components/big-flame';
import { SHORT } from '@/components/fit';
import { Text } from '@/components/text';
import { BUBBLE, PAPER_INK } from '@/lib/lesson-look';
import { NATIVE, useReducedMotion } from '@/lib/motion';
import { font } from '@/lib/theme';

/** the flame is drawn at this size and scaled down, so it stays crisp at every size it stops at */
const DRAWN = 360;

const ROOMY = 1.9;

interface Spot {
  x: number;
  y: number;
  w: number;
  h: number;
  size: number;
  side?: boolean;
}
interface Stage {
  root: RefObject<ViewInstance | null>;
  place: (s: Spot) => void;
}
const StageCtx = createContext<Stage | null>(null);

/** wraps a card's content: the flame stands in here, behind the words, and scrolls with them */
export function FlameStage({ level, on, pulse, children }: { level: number; on: boolean; pulse: number; children: ReactNode }) {
  const root = useRef<ViewInstance>(null);
  const still = useReducedMotion();
  const x = useRef(new Animated.Value(0)).current;
  const y = useRef(new Animated.Value(0)).current;
  const k = useRef(new Animated.Value(0.5)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const placed = useRef(false);
  const shown = useRef(on);
  shown.current = on;
  const ctx = useMemo<Stage>(
    () => ({
      root,
      place: (s) => {
        /* the drawing leaves wide margins around the figure and its glow, so it may stand taller than its room */
        const size = Math.min(s.size, s.h * ROOMY);
        const tx = (s.side ? s.x + s.w - s.h / 2 : s.x + s.w / 2) - DRAWN / 2;
        const ty = s.y + s.h / 2 - DRAWN / 2;
        const sc = size / DRAWN;
        if (!placed.current || still) {
          placed.current = true;
          x.setValue(tx);
          y.setValue(ty);
          k.setValue(sc);
          if (shown.current) Animated.timing(fade, { toValue: 1, duration: 240, useNativeDriver: NATIVE }).start();
          return;
        }
        const glide = { damping: 22, stiffness: 120, mass: 1, useNativeDriver: NATIVE };
        Animated.parallel([
          Animated.spring(x, { toValue: tx, ...glide }),
          Animated.spring(y, { toValue: ty, ...glide }),
          Animated.spring(k, { toValue: sc, ...glide }),
        ]).start();
      },
    }),
    [still, x, y, k, fade],
  );
  useEffect(() => {
    if (!placed.current) return;
    Animated.timing(fade, { toValue: on ? 1 : 0, duration: 220, useNativeDriver: NATIVE }).start();
  }, [on, fade]);
  return (
    <StageCtx.Provider value={ctx}>
      <View ref={root} style={s.stage}>
        <Animated.View pointerEvents="none" style={[s.flame, { opacity: fade, transform: [{ translateX: x }, { translateY: y }, { scale: k }] }]}>
          <BigFlame level={level} size={DRAWN} pulse={pulse} noLand />
        </Animated.View>
        {children}
      </View>
    </StageCtx.Provider>
  );
}

/** the room a card leaves for the flame. size: how big it wants to stand; it takes less on a short phone. side: it stands to the right, with
    words beside it. */
export function FlameSlot({ size, min = 96, side, style, children }: { size: number; min?: number; side?: boolean; style?: ViewStyle; children?: ReactNode }) {
  const stage = useContext(StageCtx);
  const ref = useRef<ViewInstance>(null);
  const measure = () => {
    const root = stage?.root.current;
    if (!root || !ref.current) return;
    ref.current.measureLayout(root, (x, y, w, h) => stage!.place({ x, y, w, h, size, side }));
  };
  /* a pick moves the flame aside with no change in the room's size, so no layout comes: ask again */
  useEffect(measure, [size, side]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <View ref={ref} onLayout={measure} style={[s.slot, { minHeight: min }, style]}>
      {children}
    </View>
  );
}

/** what the flame says. tail: where it points, down from the middle or down from the right. A tap reads the longer words, when there are some. */
export function Bubble({
  text,
  tail = 'mid',
  more,
  onMore,
  style,
}: {
  text: string;
  tail?: 'mid' | 'right';
  more?: boolean;
  onMore?: () => void;
  style?: ViewStyle;
}) {
  const body = (
    <View style={[s.bubble, { backgroundColor: BUBBLE }]}>
      <Text style={s.say} accessibilityLiveRegion="polite">
        {text}
        {more ? <Text style={s.more}>{'  More'}</Text> : null}
      </Text>
      <View style={[s.tail, { backgroundColor: BUBBLE }, tail === 'right' ? s.tailRight : s.tailMid]} />
    </View>
  );
  if (!more || !onMore) return <View style={style}>{body}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint="Reads the longer words"
      onPress={onMore}
      style={({ pressed }) => [style, pressed && { opacity: 0.85 }]}>
      {body}
    </Pressable>
  );
}

const s = StyleSheet.create({
  stage: { flexGrow: 1, alignSelf: 'stretch' },
  flame: { position: 'absolute', left: 0, top: 0, width: DRAWN, height: DRAWN },
  slot: { flexGrow: 1, alignSelf: 'stretch' },
  bubble: { borderRadius: 20, paddingVertical: 12, paddingHorizontal: 16 },
  say: { fontFamily: font.bodySemi, fontSize: SHORT ? 15 : 17, lineHeight: SHORT ? 20 : 23, color: PAPER_INK },
  more: { fontFamily: font.bodyBold, fontSize: 15, color: PAPER_INK, textDecorationLine: 'underline' },
  tail: { position: 'absolute', bottom: -7, width: 18, height: 18, borderRadius: 4, transform: [{ rotate: '45deg' }] },
  tailMid: { alignSelf: 'center' },
  tailRight: { right: 28 },
});
