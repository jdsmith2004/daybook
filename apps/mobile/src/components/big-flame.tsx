/* The flame drawn big, the same size for every form (the owner, October 27, 2026: the growth shows in the form, not the
   size). The early forms are drawn small inside their picture (a new person's Spark is a dot in a ring), so here the
   whole drawing is brought in close around the figure until it is as big as a campfire, and the figure sits in the same
   place every time. The picture's own sky and stars are left out: it sits in a sky that is painted around it (the top of
   Today, the round sky at the end of a lesson), whose stars stay small however close the figure is drawn. It moves like
   the flame everywhere else (components/flame.tsx: the face and the body hold still and the fire licks), each tap makes
   the fire leap and sends one bloom through it, and it is still under Reduce Motion. */
import { emblemLayers, fireOf, formOfLevel, gradOf, type EmblemLayers, type Fire } from '@daybook/core';
import { memo, useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { FireLayer } from '@/components/fire-layer';
import { GLOW, glowKind, stillBox, stillIn } from '@/components/flame';
import { GradCap } from '@/components/grad';
import { NATIVE, useReducedMotion } from '@/lib/motion';
import { useStore } from '@/lib/store';

const RING =
  '<svg viewBox="0 0 100 100"><defs><radialGradient id="bigRing" cx="50" cy="50" r="50" gradientUnits="userSpaceOnUse">' +
  '<stop offset=".5" stop-color="#FFE9A8" stop-opacity="0"/><stop offset=".78" stop-color="#FFE9A8" stop-opacity=".6"/>' +
  '<stop offset="1" stop-color="#FFE9A8" stop-opacity="0"/></radialGradient></defs><circle cx="50" cy="50" r="50" fill="url(#bigRing)"/></svg>';

/** the campfire's flame, as a share of the drawing: the size every early form is brought up to */
const FULL_K = 0.48;
/** where the figure's middle sits in the box when it is brought in close (as a share of its height) */
const MID_Y = 0.55;

/** the layers without the picture's own sky and stars, and how close to draw it: [zoom, shift x, shift y] as shares of the box */
export function bigLayers(level: number, noLand?: boolean): { layers: EmblemLayers; fire: Fire; zoom: number; dx: number; dy: number } | null {
  const l = emblemLayers(level, true);
  if (!l) return null;
  /* the spark, the kindling and the campfire are drawn smaller than the rest: closer, up to the campfire's size */
  const k = Number(/scale\(([\d.]+)\)/.exec(l.fig)?.[1] || 0);
  const zoom = formOfLevel(level) <= 2 && k > 0 ? Math.min(3.2, Math.max(1, FULL_K / k)) : 1;
  /* the lines of light around the figure (its rays, a ring) keep a fine line however close it is drawn; the twigs and
     logs it stands on grow with it */
  const fine = (x: string) =>
    zoom > 1
      ? x.replace(/(stroke="#FF(?:F3B0|E27A)"[^>]*?stroke-width=")([\d.]+)"/g, (_, a: string, w: string) => a + ((Number(w) / zoom) * 1.5).toFixed(2) + '"')
      : x;
  const clean = (x: string) =>
    fine(
      (noLand ? x.replace(/<path d="M-2 [^"]*V122H-2Z" fill="#[0-9A-Fa-f]{6}"\/>|<rect x="-2"[^>]*\/>|<ellipse cx="60" cy="108"[^>]*\/>/g, '') : x)
        .replace(/<rect x="0" y="0" width="120" height="120" fill="url\(#em\w+sk\)"\/>/, '')
        .replace(/<circle cx="[\d.]+" cy="[\d.]+" r="[\d.]+" fill="#fff" opacity="[\d.]+"\/>/g, ''),
    );
  /* the spark's thin rays, its ring and the little flame beside it are drawn for a small picture: this close they read as stray bars and a glitch,
     so the big flame goes without them (the owner, October 30, 2026) */
  const spark = formOfLevel(level) === 0;
  const layers = {
    ...l,
    back: clean(spark ? l.back.replace(/<path d="[^"]*" stroke="#FFF3B0"[^>]*\/>/g, '') : l.back),
    side: spark ? '' : clean(l.side),
    front: spark ? '' : clean(l.front),
  };
  const whole = fireOf(level, !spark);
  /* embers keep their small size however close the figure is drawn */
  const fire = zoom > 1 ? { ...whole, embers: whole.embers.map((e) => ({ ...e, r: (e.r / zoom) * 1.5 })) } : whole;
  /* on another sky: the glow has no frame to fade into, so it stays whole and clear of the drawing's edges, and the figure stands in the middle.
     Brought in close, the first forms' glow would grow past the top of the card and be cut off in a straight line, so it keeps the size of the later forms' */
  if (noLand) {
    const cut = l.glow.indexOf('</defs>');
    layers.glow =
      l.glow.slice(0, cut) +
      l.glow
        .slice(cut)
        .replace(/<g mask="url\(#\w+\)">/, '<g>')
        .replace(/(<circle cx="[\d.]+" cy="([\d.]+)" r=")([\d.]+)"/, (_, a: string, y: string, r: string) => a + Math.min(+r, +y, 120 - +y, 48 / zoom) + '"');
    return { layers, fire, zoom, dx: 0.5 - l.at.x, dy: 0.5 - l.at.y };
  }
  return zoom > 1 ? { layers, fire, zoom, dx: 0.5 - l.at.x, dy: MID_Y - l.at.y } : { layers, fire, zoom, dx: 0, dy: 0 };
}

export const BigFlame = memo(function BigFlame({
  level,
  size,
  pulse = 0,
  label,
  noLand,
}: {
  level: number;
  size: number;
  pulse?: number;
  label?: string;
  /** on a sky that is not its own (a lesson): without the drawing's own hills, which would not match */
  noLand?: boolean;
}) {
  const still = useReducedMotion();
  const { snap } = useStore();
  const grad = !!gradOf(snap.settings);
  const b = useMemo(() => bigLayers(level, noLand), [level, noLand]);
  const breath = useRef(new Animated.Value(0)).current;
  const bloom = useRef(new Animated.Value(0)).current;
  const ring = useRef(new Animated.Value(0)).current;
  const [ms, dim] = GLOW[glowKind(formOfLevel(level))];
  useEffect(() => {
    if (still) {
      breath.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, { toValue: 1, duration: ms, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
        Animated.timing(breath, { toValue: 0, duration: ms, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [breath, ms, still]);
  useEffect(() => {
    if (!pulse || still) return;
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
  }, [pulse, bloom, ring, still]);
  const name = (label ?? `Your flame, level ${level}`) + (grad ? ', wearing a graduation cap' : '');
  if (!b) return <View style={{ width: size, height: size }} accessibilityLabel={name} />;
  const { layers, fire, zoom, dx, dy } = b;
  const origin = `${(layers.at.x * 100).toFixed(1)}% ${(layers.at.y * 100).toFixed(1)}%`;
  /* the whole drawing, brought in close around the figure and moved so the figure sits in the same place for every form. It is drawn at
     that bigger size, never stretched: a picture scaled up after it is drawn comes out in blocks (the owner, October 30, 2026). */
  const S = size * zoom;
  const place = {
    position: 'absolute' as const,
    left: layers.at.x * size * (1 - zoom) + dx * size,
    top: layers.at.y * size * (1 - zoom) + dy * size,
    width: S,
    height: S,
  };
  /* the figure itself only moves to a tap */
  const fig = {
    transformOrigin: origin,
    transform: [{ scale: bloom.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] }) }],
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
    <View style={{ width: size, height: size }} accessible accessibilityRole="image" accessibilityLabel={name}>
      <View style={place} pointerEvents="none">
        <SvgXml xml={layers.back} width={S} height={S} style={StyleSheet.absoluteFill} />
        {layers.glow ? (
          <Animated.View style={[StyleSheet.absoluteFill, glow]}>
            <SvgXml xml={layers.glow} width={S} height={S} />
          </Animated.View>
        ) : null}
        <Animated.View
          style={{
            position: 'absolute',
            left: layers.at.x * S - r,
            top: layers.at.y * S - r,
            opacity: ring.interpolate({ inputRange: [0, 0.1, 1], outputRange: [0, 1, 0] }),
            transform: [{ scale: ring.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1.8] }) }],
          }}>
          <SvgXml xml={RING} width={r * 2} height={r * 2} />
        </Animated.View>
        {still ? (
          <>
            {layers.side ? <SvgXml xml={layers.side} width={S} height={S} style={StyleSheet.absoluteFill} /> : null}
            <SvgXml xml={layers.fig} width={S} height={S} style={StyleSheet.absoluteFill} />
          </>
        ) : (
          <Animated.View style={[StyleSheet.absoluteFill, fig]}>
            <FireLayer fire={fire} unit={S / 120} leap={pulse} />
            <SvgXml xml={stillIn(layers.still, fire)} {...stillBox(fire, S / 120)} />
          </Animated.View>
        )}
        {layers.front ? <SvgXml xml={layers.front} width={S} height={S} style={StyleSheet.absoluteFill} /> : null}
      </View>
      {grad ? (
        /* on the head, whichever form: the figure always sits at the same place (see place above) */
        <View pointerEvents="none" style={{ position: 'absolute', left: size * 0.46, top: size * (MID_Y - 0.33), transform: [{ rotate: '14deg' }] }}>
          <GradCap size={size * 0.26} />
        </View>
      ) : null}
    </View>
  );
});
