/* The flame spirit: one drawing for each of the 60 levels (packages/core, the emblem). With `alive`, the figure moves gently in
   a way that fits its form (a fire flickers, the rising flame flickers and floats, the suns breathe slowly, the stars twinkle), and only the
   figure: the drawing is split into layers (core emblemLayers), so its sky, its round frame and its hills stay still. Each
   change of `pulse` (a tap on the flame) sends one slow bloom through it: the figure swells and settles, its glow brightens,
   and a soft ring of light spreads out and fades. It is still under Reduce Motion, when locked, and in long lists (which
   leave `alive` off). */
import { emblemLayers, emblemScene, emblemXml, formOfLevel, type EmblemLayers } from '@daybook/core';
import { memo, useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { NATIVE, useReducedMotion } from '@/lib/motion';

/* [how far the figure grows, how long one breath takes, how much its glow dims, how far it sways (degrees), how far it
   floats (a share of its size)] for each kind of form: a fire flickers and sways, the rising flame flickers and floats, the suns breathe and
   drift, the stars twinkle and drift */
const MOTION: [number, number, number, number, number][] = [
  [0.035, 1100, 0.25, 1.6, 0.006],
  [0.03, 1500, 0.25, 1.2, 0.02],
  [0.03, 3200, 0.25, 0, 0.012],
  [0.03, 2400, 0.35, 0, 0.012],
];
const kindOf = (form: number) => (form <= 4 ? 0 : form === 5 ? 1 : form <= 9 ? 2 : 3);
/* the ring a tap sends out: a soft band of warm light, clear in the middle and at the edge */
const RING =
  '<svg viewBox="0 0 100 100"><defs><radialGradient id="flameRing" cx="50" cy="50" r="50" gradientUnits="userSpaceOnUse">' +
  '<stop offset=".5" stop-color="#FFE9A8" stop-opacity="0"/><stop offset=".78" stop-color="#FFE9A8" stop-opacity=".6"/>' +
  '<stop offset="1" stop-color="#FFE9A8" stop-opacity="0"/></radialGradient></defs><circle cx="50" cy="50" r="50" fill="url(#flameRing)"/></svg>';

export const Flame = memo(function Flame({
  level,
  size = 96,
  locked = false,
  label,
  alive = false,
  soft = false,
  pulse = 0,
}: {
  level: number;
  size?: number;
  locked?: boolean;
  label?: string;
  alive?: boolean;
  /** the round frame softened away, to sit in a card painted in its own sky (the top of Today) */
  soft?: boolean;
  /** a number that changes on each tap: one bloom each time */
  pulse?: number;
}) {
  const still = useReducedMotion();
  const live = alive && !locked && !still;
  const layers = useMemo(() => (live ? emblemLayers(level, soft) : null), [live, level, soft]);
  const xml = useMemo(() => (layers ? '' : soft && !locked ? emblemScene(level).xml : emblemXml(level, locked)), [layers, level, locked, soft]);
  const name = label ?? `Your flame, level ${level}`;
  if (layers) return <Living layers={layers} level={level} size={size} label={name} pulse={pulse} />;
  return <SvgXml xml={xml} width={size} height={size} accessibilityLabel={name} opacity={locked ? 0.55 : 1} />;
});

function Living({ layers, level, size, label, pulse }: { layers: EmblemLayers; level: number; size: number; label: string; pulse: number }) {
  const breath = useRef(new Animated.Value(0)).current;
  const bloom = useRef(new Animated.Value(0)).current;
  const ring = useRef(new Animated.Value(0)).current;
  const [grow, ms, dim, sway, float] = MOTION[kindOf(formOfLevel(level))];
  /* the idle breath: in and out on a sine, forever, slow enough to feel calm */
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, { toValue: 1, duration: ms, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
        Animated.timing(breath, { toValue: 0, duration: ms, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [breath, ms]);
  /* a tap: a quick, soft swell (ease out), a long settle (ease in and out), and a ring of light that spreads and fades */
  useEffect(() => {
    if (!pulse) return;
    bloom.setValue(0);
    ring.setValue(0);
    const a = Animated.parallel([
      Animated.sequence([
        Animated.timing(bloom, { toValue: 1, duration: 480, easing: Easing.out(Easing.cubic), useNativeDriver: NATIVE }),
        Animated.timing(bloom, { toValue: 0, duration: 1300, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
      ]),
      Animated.timing(ring, { toValue: 1, duration: 1700, easing: Easing.out(Easing.quad), useNativeDriver: NATIVE }),
    ]);
    a.start();
    return () => a.stop();
  }, [pulse, bloom, ring]);
  const origin = `${(layers.at.x * 100).toFixed(1)}% ${(layers.at.y * 100).toFixed(1)}%`;
  const fig = {
    transformOrigin: origin,
    transform: [
      { translateY: breath.interpolate({ inputRange: [0, 1], outputRange: [0, -float * size] }) },
      { rotate: breath.interpolate({ inputRange: [0, 0.5, 1], outputRange: ['0deg', sway + 'deg', -sway * 0.6 + 'deg'] }) },
      {
        scale: Animated.add(
          breath.interpolate({ inputRange: [0, 1], outputRange: [1, 1 + grow] }),
          bloom.interpolate({ inputRange: [0, 1], outputRange: [0, 0.1] }),
        ),
      },
    ],
  };
  const glow = {
    transformOrigin: origin,
    opacity: Animated.add(
      breath.interpolate({ inputRange: [0, 1], outputRange: [1 - dim, 1] }),
      bloom.interpolate({ inputRange: [0, 1], outputRange: [0, 0.4] }),
    ),
    transform: [
      {
        scale: Animated.add(
          breath.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] }),
          bloom.interpolate({ inputRange: [0, 1], outputRange: [0, 0.32] }),
        ),
      },
    ],
  };
  const r = size * 0.4;
  return (
    <View style={{ width: size, height: size }} accessible accessibilityRole="image" accessibilityLabel={label}>
      <SvgXml xml={layers.back} width={size} height={size} style={StyleSheet.absoluteFill} />
      {layers.glow ? (
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, glow]}>
          <SvgXml xml={layers.glow} width={size} height={size} />
        </Animated.View>
      ) : null}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: layers.at.x * size - r,
          top: layers.at.y * size - r,
          opacity: ring.interpolate({ inputRange: [0, 0.1, 1], outputRange: [0, 1, 0] }),
          transform: [{ scale: ring.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1.8] }) }],
        }}>
        <SvgXml xml={RING} width={r * 2} height={r * 2} />
      </Animated.View>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, fig]}>
        <SvgXml xml={layers.fig} width={size} height={size} />
      </Animated.View>
      <SvgXml xml={layers.front} width={size} height={size} style={StyleSheet.absoluteFill} pointerEvents="none" />
    </View>
  );
}
