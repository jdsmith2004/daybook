/* The lessons as a map (core lesson-map): stepping stones on one path through a land for each section, top to bottom. Each
   land has its own sky and hills, its picture on a little hill (core section-art), trees, and flowers by day; in dark mode
   it is a warm evening, with stars and fireflies. Lessons open one at a time, in the order of the path (core lessonWalk):
   the lessons behind Up next are stones in their land's color with a check, on a road that glows gold, and one finished
   today wears a small Today tag. Up next (the same as on Today) is the one bright, raised stone, with a ring around it that
   fills as its section does, a pin over it and its name beside it. Every stone after it is quiet: the same shape, flat,
   in a soft gray-tinted version of its section's color, with its number and nothing else (no lock), and a land still
   wholly ahead has its picture drawn quiet too, so the bright part of the map is the road walked and Up next. Tap any
   stone for its card: Start, Read it again, the account Up next needs, or for a quiet one, the lesson it opens after.
   When Up next moves on, a few sparks fly from the new stone, once (they only fade under Reduce Motion). A signpost starts
   each land, and a trophy ends the path. Only the lands near the screen are drawn, to keep it light. The pin's bob and
   the ring's breathing are still under Reduce Motion. */
import {
  LUNITS,
  lmin,
  lessonNo,
  MAP_W,
  roadPath,
  sectionArtInner,
  sectionArtXml,
  type Lesson,
  type LessonMap,
  type MapLand,
  type MapStone,
} from '@daybook/core';
import { LinearGradient } from 'expo-linear-gradient';
import { useIsFocused } from 'expo-router';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';
import { SvgXml } from 'react-native-svg';

import { Icon } from '@/components/ui';
import { NATIVE, useReducedMotion } from '@/lib/motion';
import { useStore } from '@/lib/store';
import { font, toneOf, useTheme, type Tone } from '@/lib/theme';

/* ---------- colors ---------- */
const hx = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a: string, b: string, t: number) =>
  '#' +
  hx(a)
    .map((v, i) =>
      Math.round(v + (hx(b)[i] - v) * t)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('');
const rgba = (h: string, a: number) => `rgba(${hx(h).join(',')},${a})`;

/** each land's sky (top, bottom) and hills: soft by day; by night a warm evening, glowing low */
const LANDS: Record<'light' | 'dark', Record<string, { sky: [string, string]; hill: string }>> = {
  light: {
    sky: { sky: ['#CFEBFF', '#EAF5FF'], hill: '#B9DCFA' },
    coral: { sky: ['#FFE3DE', '#FFF1E6'], hill: '#F9C9BF' },
    mint: { sky: ['#D3F3EA', '#EAFBF3'], hill: '#B5E8D3' },
    violet: { sky: ['#EBE5FF', '#F7F2FF'], hill: '#D5CBFB' },
    sun: { sky: ['#FFF0BF', '#FFF8E2'], hill: '#FFE08F' },
  },
  dark: {
    sky: { sky: ['#1B2B72', '#3460B0'], hill: '#3D74CC' },
    coral: { sky: ['#3E1E62', '#A2456E'], hill: '#C65A7E' },
    mint: { sky: ['#103866', '#178274'], hill: '#22A88C' },
    violet: { sky: ['#271D76', '#5640B6'], hill: '#7058D6' },
    sun: { sky: ['#3C2564', '#C0683E'], hill: '#E0953F' },
  },
};
const toneName = (u: number) => (LANDS.light[LUNITS[u].tone] ? LUNITS[u].tone : 'violet');
export const landOf = (u: number, dark: boolean) => LANDS[dark ? 'dark' : 'light'][toneName(u)];
export const useLandTone = (u: number) => toneOf(useTheme(), toneName(u));

/* ---------- a land, drawn as one picture ---------- */
const CLOUD = 'M14 44C4 44 2 30 12 28C10 16 26 10 34 18C38 6 58 4 64 16C72 8 88 12 86 26C98 26 98 44 86 44Z';
const sparkle = (x: number, y: number, r: number) =>
  `<path d="M${x} ${y - r}Q${x + r * 0.15} ${y - r * 0.15} ${x + r} ${y}Q${x + r * 0.15} ${y + r * 0.15} ${x} ${y + r}Q${x - r * 0.15} ${y + r * 0.15} ${x - r} ${y}Q${x - r * 0.15} ${y - r * 0.15} ${x} ${y - r}Z" fill="#FFF3C4"/>`;
const tree = (x: number, y: number, crown: string, trunk: string) =>
  `<g transform="translate(${x - 37} ${y - 64}) scale(1.15)"><ellipse cx="32" cy="56" rx="24" ry="3.5" fill="#000" opacity=".08"/>
<rect x="18" y="34" width="5" height="22" rx="2.5" fill="${trunk}"/><circle cx="20.5" cy="28" r="13" fill="${crown}"/><circle cx="16" cy="23" r="4" fill="#fff" opacity=".25"/>
<rect x="42" y="38" width="4.5" height="18" rx="2.2" fill="${trunk}"/><circle cx="44" cy="33" r="10" fill="${crown}"/><circle cx="41" cy="29" r="3" fill="#fff" opacity=".25"/></g>`;
const flowers = (x: number, y: number, c: string) =>
  `<g transform="translate(${x} ${y})"><path d="M7 18V10M21 18V8" stroke="${c}" stroke-width="2" stroke-linecap="round"/>
<g fill="#fff"><circle cx="7" cy="5" r="2.6"/><circle cx="4" cy="8" r="2.6"/><circle cx="10" cy="8" r="2.6"/><circle cx="7" cy="11" r="2.4"/></g><circle cx="7" cy="8" r="2" fill="#FFC832"/>
<g fill="${c}"><circle cx="21" cy="3.5" r="2.4"/><circle cx="18.2" cy="6.4" r="2.4"/><circle cx="23.8" cy="6.4" r="2.4"/><circle cx="21" cy="9" r="2.2"/></g><circle cx="21" cy="6.4" r="1.8" fill="#FFC832"/></g>`;
const fireflies = (x: number, y: number, id: string) =>
  [
    [0, 0, 3],
    [18, -14, 2],
    [34, 4, 1.8],
  ]
    .map(
      ([dx, dy, r]) =>
        `<circle cx="${x + dx}" cy="${y + dy}" r="${r * 3.4}" fill="url(#${id}f)"/><circle cx="${x + dx}" cy="${y + dy}" r="${r}" fill="#FFE58A"/>`,
    )
    .join('');
/** stars for the evening sky, the same every time, kept off the stones, the picture and the next lesson's name */
function stars(l: MapLand, m: LessonMap, x0: number, x1: number) {
  let r = l.k * 97 + 13;
  const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280;
  let out = '';
  for (let i = 0; i < 16; i++) {
    const x = Math.round(x0 + 10 + rnd() * (x1 - x0 - 20));
    const y = Math.round(l.top + 20 + rnd() * (l.bottom - l.top - 40));
    const big = rnd() < 0.25;
    const op = (0.5 + rnd() * 0.5).toFixed(2);
    if (l.stones.some((s) => Math.hypot(s.x - x, s.y - y) < 56) || Math.hypot(l.pic.x - x, l.pic.y - y) < 76) continue;
    const n = m.next;
    if (n && Math.abs(n.y - y) < 46 && (l.right ? x > n.x : x < n.x)) continue;
    out += big ? sparkle(x, y, 6) : `<circle cx="${x}" cy="${y}" r="1.6" fill="#fff" opacity="${op}"/>`;
  }
  return out;
}

export function landXml(l: MapLand, m: LessonMap, o: { dark: boolean; bg: string; ic: string; x0: number; x1: number; id: string }) {
  const land = landOf(l.u, o.dark);
  const last = l.k === m.lands.length - 1;
  const y0 = l.top - 70;
  const y1 = last ? m.height : l.bottom + 60;
  const w = o.x1 - o.x0;
  const id = o.id;
  const right = l.right;
  const n = m.next && l.stones.includes(m.next) ? m.next : null;
  const crown = o.dark ? mix(land.hill, '#ffffff', 0.12) : mix(land.hill, o.ic, 0.28);
  const stem = mix(land.hill, o.ic, 0.45);
  let x = `<svg viewBox="${o.x0} ${y0} ${w} ${y1 - y0}"><defs>
<linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${land.sky[0]}"/><stop offset="1" stop-color="${land.sky[1]}"/></linearGradient>
<radialGradient id="${id}g" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="${o.dark ? o.ic : '#ffffff'}" stop-opacity="${o.dark ? 0.4 : 0.75}"/><stop offset=".68" stop-color="${o.dark ? o.ic : '#ffffff'}" stop-opacity="0"/></radialGradient>
<radialGradient id="${id}n" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="${o.ic}" stop-opacity="${o.dark ? 0.45 : 0.25}"/><stop offset=".65" stop-color="${o.ic}" stop-opacity="0"/></radialGradient>
<radialGradient id="${id}f" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFD65A" stop-opacity=".55"/><stop offset="1" stop-color="#FFD65A" stop-opacity="0"/></radialGradient>
<clipPath id="${id}c"><rect x="${o.x0}" y="${y0}" width="${w}" height="${(last ? m.height : l.bottom - 70) - y0}"/></clipPath></defs>
<rect x="${o.x0}" y="${l.top}" width="${w}" height="${l.bottom - l.top + 60}" fill="url(#${id}s)"/>
<g transform="translate(${o.x0} ${y0}) scale(${w / MAP_W} 1)"><path d="M0 46C60 10 120 8 190 30S320 50 390 18L390 90L0 90Z" fill="${land.hill}"/><path d="M0 62C80 34 150 40 220 56S340 66 390 46L390 90L0 90Z" fill="${land.sky[0]}"/></g>
<rect x="${o.x0}" y="${l.top + 19}" width="${w}" height="4" fill="${land.sky[0]}"/>`;
  if (o.dark)
    x += stars(l, m, o.x0, o.x1) + `<path transform="translate(${right ? 20 : 300} ${l.top + 96}) scale(.7)" d="${CLOUD}" fill="#fff" opacity=".12"/>`;
  else
    x +=
      `<path transform="translate(${right ? 20 : 300} ${l.top + 92}) scale(.7)" d="${CLOUD}" fill="#fff" opacity=".85"/>` +
      `<path transform="translate(${right ? 24 : 318} ${l.top + 318}) scale(.46)" d="${CLOUD}" fill="#fff" opacity=".7"/>`;
  x += `<ellipse cx="${l.pic.x}" cy="${l.pic.y + 56}" rx="74" ry="20" fill="${land.hill}"/>`;
  /* a land still wholly ahead keeps its picture, drawn quiet */
  x += l.ahead ? `<g opacity="${o.dark ? 0.32 : 0.4}">` : `<circle cx="${l.pic.x}" cy="${l.pic.y}" r="84" fill="url(#${id}g)"/><g>`;
  x += `<g transform="translate(${l.pic.x - 66} ${l.pic.y - 66}) scale(1.1)">${sectionArtInner(l.u, id + 'a')}</g></g>`;
  x += tree(l.tree.x, l.tree.y, crown, o.dark ? mix(land.hill, '#000000', 0.3) : '#C49A70');
  const fx = right ? l.pic.x - 64 : l.pic.x + 34;
  const ex = right ? 26 : 336;
  const ey = l.stones[2].y + 26;
  x += o.dark ? fireflies(fx, l.pic.y + 56, id) + fireflies(ex - 4, ey, id) : flowers(fx, l.pic.y + 48, stem) + flowers(ex, ey, stem);
  if (last)
    x += `<path transform="translate(${o.x0} ${l.bottom - 30}) scale(${w / MAP_W} 1)" d="M0 40C80 10 160 14 230 30S350 36 390 22L390 400L0 400Z" fill="${o.bg}"/>`;
  /* the road ahead in white dots, the road walked in gold: between finished lessons, also ones done out of order. Each
     stretch starts its dots at a stone, so the two kinds never sit on top of each other. */
  x += `<g clip-path="url(#${id}c)">`;
  m.plain.forEach(([a, b]) => {
    x += `<path d="${roadPath(m.road, a, b)}" fill="none" stroke="#ffffff" stroke-opacity="${o.dark ? 0.4 : 0.95}" stroke-width="9" stroke-linecap="round" stroke-dasharray="0.1 17"/>`;
  });
  m.gold.forEach(([a, b]) => {
    const d = roadPath(m.road, a, b);
    if (o.dark) x += `<path d="${d}" fill="none" stroke="#FFC832" stroke-opacity=".28" stroke-width="18" stroke-linecap="round" stroke-dasharray="0.1 17"/>`;
    x += `<path d="${d}" fill="none" stroke="#FFC832" stroke-width="9" stroke-linecap="round" stroke-dasharray="0.1 17"/>`;
  });
  x += `</g>`;
  if (n) x += `<circle cx="${n.x}" cy="${n.y}" r="72" fill="url(#${id}n)"/>`;
  return x + '</svg>';
}

/* ---------- a stone ---------- */
const CHECK = (c: string) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>`;

export const Stone = memo(function Stone({
  s,
  x,
  y,
  k,
  t,
  dark,
  open,
  label,
  onPress,
}: {
  s: MapStone;
  x: number;
  y: number;
  k: number;
  t: Tone;
  dark: boolean;
  open: boolean;
  label: string;
  onPress: () => void;
}) {
  const c = useTheme();
  const next = s.state === 'next';
  const quiet = s.state === 'todo';
  const w = (next ? 80 : 64) * k;
  const h = (next ? 74 : 58) * k;
  const r = (next ? 28 : 22) * k;
  const rot = s.j % 2 ? 6 : -6;
  const q = quietOf(t, dark);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ expanded: open }}
      onPress={onPress}
      hitSlop={6}
      style={{ position: 'absolute', left: x - w / 2, top: y - h / 2, width: w, height: h, transform: [{ rotate: rot + 'deg' }], zIndex: 3 }}>
      {({ pressed }) => (
        <View
          style={[
            s_.stone,
            {
              borderRadius: r,
              backgroundColor: quiet ? q.face : t.ic,
              transform: [{ translateY: pressed ? 2 : 0 }],
            },
            /* a quiet stone lies flat: no shadow, no shine, no lip */
            quiet ? s_.flat : null,
            open ? { borderWidth: 3, borderColor: c.ink } : null,
          ]}>
          {quiet ? null : (
            <View style={[StyleSheet.absoluteFill, { borderRadius: r, overflow: 'hidden' }]} pointerEvents="none">
              <LinearGradient colors={[mix(t.ic, '#ffffff', 0.22), t.ic]} start={{ x: 0.3, y: 0 }} end={{ x: 0.7, y: 1 }} style={StyleSheet.absoluteFill} />
              <View style={[s_.band, { bottom: 0, height: 6 * k, backgroundColor: 'rgba(0,0,0,0.14)' }]} />
              <View style={[s_.band, { top: 0, height: 3 * k, backgroundColor: 'rgba(255,255,255,0.3)' }]} />
            </View>
          )}
          <View style={{ transform: [{ rotate: -rot + 'deg' }], alignItems: 'center', justifyContent: 'center' }} pointerEvents="none">
            {s.state === 'done' ? (
              <SvgXml xml={CHECK(t.ink)} width={28 * k} height={28 * k} />
            ) : (
              <Text style={{ fontFamily: font.display, fontSize: (next ? 30 : 22) * k, color: next ? t.ink : q.ink }}>{s.n}</Text>
            )}
          </View>
        </View>
      )}
    </Pressable>
  );
});
/** a quiet stone (not reached yet): its section's color, grayed and soft, and its number a little deeper than the face */
export function quietOf(t: Tone, dark: boolean) {
  const face = dark ? mix(mix(t.ic, '#6E6A86', 0.62), '#1A1640', 0.38) : mix(mix(t.ic, '#C9C6D6', 0.66), '#FFFFFF', 0.28);
  return { face, ink: dark ? mix(face, '#FFFFFF', 0.42) : mix(face, '#3A3556', 0.45) };
}

/* ---------- the pin over the next stone, and its ring ---------- */
export function Pin({ x, y, k, color, edge }: { x: number; y: number; k: number; color: string; edge: string }) {
  const still = useReducedMotion();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (still) return v.setValue(0);
    const a = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 1300, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
        Animated.timing(v, { toValue: 0, duration: 1300, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
      ]),
    );
    a.start();
    return () => a.stop();
  }, [still, v]);
  const xml = `<svg viewBox="0 0 44 58"><ellipse cx="22" cy="55" rx="8" ry="2.5" fill="#000" opacity=".15"/><path d="M22 52C22 52 4 32 4 20A18 18 0 0 1 40 20C40 32 22 52 22 52Z" fill="${color}" stroke="${edge}" stroke-width="3"/><circle cx="22" cy="20" r="7" fill="${edge}"/></svg>`;
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: x - 22 * k,
        top: y - 98 * k,
        zIndex: 5,
        transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -6 * k] }) }],
      }}>
      <SvgXml xml={xml} width={44 * k} height={58 * k} />
    </Animated.View>
  );
}
/** the ring around Up next: a soft track, filled as far as its section is done (frac, 0 to 1), breathing gently */
export function Ring({ x, y, k, color, frac }: { x: number; y: number; k: number; color: string; frac: number }) {
  const c = useTheme();
  const still = useReducedMotion();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (still) return v.setValue(0);
    const a = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
        Animated.timing(v, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
      ]),
    );
    a.start();
    return () => a.stop();
  }, [still, v]);
  const d = 108 * k;
  const rr = 50;
  const circ = 2 * Math.PI * rr;
  const f = Math.max(0, Math.min(1, frac));
  const track = c.scheme === 'dark' ? 'rgba(255,255,255,0.22)' : rgba(color, 0.22);
  const xml =
    `<svg viewBox="0 0 112 112"><circle cx="56" cy="56" r="${rr}" fill="none" stroke="${track}" stroke-width="7"/>` +
    (f > 0
      ? `<circle cx="56" cy="56" r="${rr}" fill="none" stroke="${color}" stroke-width="7" stroke-linecap="round" stroke-dasharray="${(circ * f).toFixed(1)} ${circ.toFixed(1)}" transform="rotate(-90 56 56)"/>`
      : '') +
    '</svg>';
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: x - d / 2,
        top: y - d / 2,
        width: d,
        height: d,
        zIndex: 2,
        opacity: v.interpolate({ inputRange: [0, 1], outputRange: [1, 0.7] }),
        transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] }) }],
      }}>
      <SvgXml xml={xml} width={d} height={d} />
    </Animated.View>
  );
}

/* ---------- the sparks when Up next moves on ---------- */
const SPARKS = [
  [0, -1, 9],
  [0.78, -0.62, 7],
  [1, 0.1, 8],
  [0.62, 0.8, 6],
  [-0.1, 1, 8],
  [-0.8, 0.6, 7],
  [-1, -0.15, 9],
  [-0.6, -0.82, 6],
];
/** a few sparks fly out from the stone just opened and fade, once. Under Reduce Motion they appear in place and fade. */
export function Spark({ x, y, k, color }: { x: number; y: number; k: number; color: string }) {
  const still = useReducedMotion();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    v.setValue(0);
    const a = Animated.timing(v, { toValue: 1, duration: still ? 1400 : 1100, easing: Easing.out(Easing.cubic), useNativeDriver: NATIVE });
    a.start();
    return () => a.stop();
  }, [still, v]);
  const reach = 64 * k;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: x, top: y, zIndex: 6 }} accessible={false} importantForAccessibility="no-hide-descendants">
      {SPARKS.map(([dx, dy, r], i) => {
        const size = r * 2.4 * k;
        const xml = `<svg viewBox="-10 -10 20 20"><path d="M0 -10Q1.5 -1.5 10 0Q1.5 1.5 0 10Q-1.5 1.5 -10 0Q-1.5 -1.5 0 -10Z" fill="${i % 2 ? '#FFC832' : color}"/></svg>`;
        const at = (m: number) => (still ? m * 0.8 : m);
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              left: -size / 2,
              top: -size / 2,
              width: size,
              height: size,
              opacity: v.interpolate({ inputRange: [0, 0.15, 0.6, 1], outputRange: [still ? 1 : 0, 1, 0.9, 0] }),
              transform: still
                ? [{ translateX: at(dx * reach) }, { translateY: at(dy * reach) }]
                : [
                    { translateX: v.interpolate({ inputRange: [0, 1], outputRange: [dx * reach * 0.35, dx * reach] }) },
                    { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [dy * reach * 0.35, dy * reach] }) },
                    { scale: v.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.4, 1.15, 0.7] }) },
                  ],
            }}>
            <SvgXml xml={xml} width={size} height={size} />
          </Animated.View>
        );
      })}
    </View>
  );
}

/* ---------- a signpost where a land begins ---------- */
export function Signpost({ l, at, y, k, gone }: { l: MapLand; at: { left: number } | { right: number }; y: number; k: number; gone?: boolean }) {
  const c = useTheme();
  const still = useReducedMotion();
  const v = useRef(new Animated.Value(gone ? 0 : 1)).current;
  useEffect(() => {
    if (still) v.setValue(gone ? 0 : 1);
    else Animated.timing(v, { toValue: gone ? 0 : 1, duration: 180, useNativeDriver: NATIVE }).start();
  }, [gone, still, v]);
  const t = useLandTone(l.u);
  const all = l.done === l.stones.length;
  const u = LUNITS[l.u];
  return (
    <Animated.View
      accessible
      accessibilityRole="header"
      accessibilityLabel={`Section ${l.k + 1}: ${u.name}. ${all ? 'All done.' : `${l.done} of ${l.stones.length} done.`}`}
      pointerEvents="none"
      style={{ position: 'absolute', ...at, top: y, zIndex: 4, maxWidth: 176 * k, opacity: v }}>
      <View
        style={{
          position: 'absolute',
          ...('left' in at ? { left: 20 * k } : { right: 24 * k }),
          top: 10 * k,
          width: 7 * k,
          height: 70 * k,
          borderRadius: 3,
          backgroundColor: c.scheme === 'dark' ? '#B98F6A' : '#A9774E',
        }}
      />
      <View style={[s_.board, { backgroundColor: c.surface, borderColor: t.ic, marginTop: 8 * k, paddingLeft: 12 * k, paddingRight: 18 * k, gap: 8 * k }]}>
        {all ? (
          <View style={s_.gold}>
            <SvgXml xml={CHECK('#5A3A00')} width={14} height={14} />
          </View>
        ) : null}
        <View style={{ flexShrink: 1 }}>
          <Text style={[s_.boardEye, { color: t.text, fontSize: 11 * k }]}>SECTION {l.k + 1}</Text>
          <Text style={[s_.boardT, { color: c.ink, fontSize: 17 * k, lineHeight: 20 * k }]}>{u.name}</Text>
        </View>
        <View style={[s_.tip, { backgroundColor: c.surface, borderColor: t.ic, width: 18 * k, height: 18 * k, right: -9 * k, marginTop: -9 * k }]} />
      </View>
    </Animated.View>
  );
}

/* ---------- the card a tapped stone opens ---------- */
export function StoneCard({
  L,
  x,
  top,
  t,
  when,
  locked,
  ahead,
  waiting,
  onStart,
  onNext,
  onSignIn,
  onClose,
  onHeight,
}: {
  L: Lesson;
  /** the stone's center, to point at it */
  x: number;
  top: number;
  t: Tone;
  /** done on this day (or not done) */
  when: string | null;
  /** Up next waits behind a free account */
  locked: boolean;
  /** a quiet stone, not reached yet: Up next, to go to first */
  ahead: Lesson | null;
  waiting: number;
  onStart: () => void;
  onNext: () => void;
  onSignIn: () => void;
  onClose: () => void;
  /** how tall the card came out, so the page can scroll it fully into view */
  onHeight?: (h: number) => void;
}) {
  const c = useTheme();
  const dark = c.scheme === 'dark';
  const stg = useStore().snap.settings;
  const no = lessonNo(L, stg);
  const q = quietOf(t, dark);
  /* a quiet stone's card is quiet too: its soft face, with dark words */
  const bg = ahead ? (dark ? mix(q.face, '#000000', 0.18) : mix(q.face, '#FFFFFF', 0.35)) : t.ic;
  const ink = ahead ? (dark ? '#FFFFFF' : c.ink) : t.ink;
  const deep = mix(ahead ? q.face : t.ic, '#000000', dark ? 0.35 : 0.25);
  const btn = ahead ? (dark ? '#FFFFFF' : c.ink) : dark ? t.ic : t.text;
  return (
    <View
      style={[s_.card, { top, backgroundColor: bg, shadowColor: '#2A2350' }]}
      accessibilityViewIsModal={false}
      onLayout={onHeight ? (e) => onHeight(e.nativeEvent.layout.height) : undefined}>
      <View style={[s_.point, { left: x - 16 - 11, backgroundColor: bg }]} />
      <View style={s_.cardTop}>
        <Text style={[s_.cardEye, { color: ink }]}>
          LESSON {no} · {lmin(L).toUpperCase()}
          {when ? ' · DONE ' + when.toUpperCase() : ''}
        </Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} hitSlop={10} style={s_.x}>
          <Icon name="x" size={20} color={ink} />
        </Pressable>
      </View>
      <Text style={[s_.cardT, { color: ink }]} accessibilityRole="header">
        {L.title}
      </Text>
      <Text style={[s_.cardP, { color: ink }]}>{L.tag}</Text>
      {ahead ? <Text style={[s_.cardP, { color: ink, marginTop: 6, fontFamily: font.bodyBold }]}>Opens after lesson {no - 1}.</Text> : null}
      {locked && !ahead ? (
        <Text style={[s_.cardP, { color: ink, marginTop: 6 }]}>A free account opens the other {waiting} lessons, and keeps your progress safe.</Text>
      ) : null}
      <Pressable
        accessibilityRole="button"
        onPress={ahead ? onNext : locked ? onSignIn : onStart}
        style={({ pressed }) => [s_.go, { backgroundColor: c.surface, shadowColor: deep, transform: [{ translateY: pressed ? 2 : 0 }] }]}>
        <Icon name={ahead ? 'next' : locked ? 'shield' : when ? 'book' : 'play'} size={18} color={btn} />
        <Text style={[s_.goT, { color: btn }]}>
          {ahead ? `Up next: lesson ${lessonNo(ahead, stg)}` : locked ? 'Create an account or sign in' : when ? 'Read it again' : `Start lesson ${no}`}
        </Text>
      </Pressable>
    </View>
  );
}

/* ---------- the trophy at the end of the path ---------- */
export function Trophy({ x, y, k, all, total }: { x: number; y: number; k: number; all: boolean; total: number }) {
  const c = useTheme();
  const d = 84 * k;
  return (
    <View
      accessible
      accessibilityLabel={all ? `All ${total} lessons done.` : 'The end of the path: every lesson done.'}
      style={{ position: 'absolute', left: x - 110, top: y - d / 2, width: 220, alignItems: 'center', gap: 10 }}>
      <View style={[s_.trophy, { width: d, height: d, borderRadius: 28 * k }]}>
        <LinearGradient colors={['#FFE27A', '#FFC832']} style={[StyleSheet.absoluteFill, { borderRadius: 28 * k }]} />
        <View style={{ zIndex: 1 }}>
          <Icon name="trophy" size={40 * k} color="#5A3A00" />
        </View>
      </View>
      <Text style={[s_.end, { color: c.muted }]}>{all ? `All ${total} lessons, done` : 'Every lesson, done'}</Text>
    </View>
  );
}

/* ---------- the floating card at the top: where you are ---------- */
export function MapChip({ l, of, here, onPress }: { l: MapLand; of: number; here: boolean; onPress: () => void }) {
  const c = useTheme();
  const t = useLandTone(l.u);
  const u = LUNITS[l.u];
  const n = l.stones.length;
  const rr = 17;
  const circ = 2 * Math.PI * rr;
  const ring = `<svg viewBox="0 0 46 46"><circle cx="23" cy="23" r="${rr}" fill="none" stroke="${c.scheme === 'dark' ? 'rgba(255,255,255,0.15)' : t.soft}" stroke-width="5"/><circle cx="23" cy="23" r="${rr}" fill="none" stroke="${t.ic}" stroke-width="5" stroke-linecap="round" stroke-dasharray="${((circ * l.done) / n).toFixed(1)} ${circ.toFixed(1)}" transform="rotate(-90 23 23)"/></svg>`;
  const art = useMemo(() => sectionArtXml(l.u, 'chip' + l.u), [l.u]);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${here ? 'You are in section' : 'Section'} ${l.k + 1}: ${u.name}, ${l.done} of ${n} done. Go to the next lesson.`}
      onPress={onPress}
      style={({ pressed }) => [s_.chip, { backgroundColor: c.surface, opacity: pressed ? 0.92 : 1 }]}>
      <View style={[s_.chipArt, { backgroundColor: t.soft }]}>
        <SvgXml xml={art} width={46} height={46} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[s_.chipEye, { color: t.text }]} numberOfLines={1}>
          {here ? 'YOU ARE IN · ' : ''}SECTION {l.k + 1} OF {of}
        </Text>
        <Text style={[s_.chipT, { color: c.ink }]} numberOfLines={1}>
          {u.name}
        </Text>
      </View>
      <View style={{ width: 46, height: 46, alignItems: 'center', justifyContent: 'center' }}>
        <View style={StyleSheet.absoluteFill}>
          <SvgXml xml={ring} width={46} height={46} />
        </View>
        <Text style={[s_.ringT, { color: c.ink }]}>
          {l.done}/{n}
        </Text>
      </View>
    </Pressable>
  );
}

const s_ = StyleSheet.create({
  stone: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2A2350',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.18,
    shadowRadius: 7,
    elevation: 4,
  },
  band: { position: 'absolute', left: 0, right: 0 },
  flat: { shadowOpacity: 0, elevation: 0 },
  board: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 6,
    paddingBottom: 7,
    borderRadius: 10,
    borderWidth: 2.5,
    shadowColor: '#2A2350',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.14,
    shadowRadius: 0,
    elevation: 2,
  },
  boardEye: { fontFamily: font.bodyBold, letterSpacing: 1.1 },
  boardT: { fontFamily: font.display },
  tip: { position: 'absolute', top: '50%', borderTopWidth: 2.5, borderRightWidth: 2.5, transform: [{ rotate: '45deg' }], borderTopRightRadius: 4 },
  gold: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#FFC832', alignItems: 'center', justifyContent: 'center' },
  card: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 8,
    borderRadius: 22,
    padding: 16,
    gap: 4,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 8,
  },
  point: { position: 'absolute', top: -9, width: 22, height: 22, borderRadius: 4, transform: [{ rotate: '45deg' }] },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  cardEye: { flex: 1, fontFamily: font.bodyBold, fontSize: 12, letterSpacing: 1.1, opacity: 0.88 },
  x: { width: 36, height: 36, marginRight: -8, marginTop: -6, alignItems: 'center', justifyContent: 'center' },
  cardT: { fontFamily: font.display, fontSize: 22, lineHeight: 28 },
  cardP: { fontFamily: font.body, fontSize: 15, lineHeight: 21, opacity: 0.94 },
  go: {
    marginTop: 12,
    minHeight: 54,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 14,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  goT: { fontFamily: font.bodyBold, fontSize: 17 },
  trophy: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#C98A00',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 0,
    elevation: 4,
  },
  end: { fontFamily: font.bodyBold, fontSize: 15 },
  chip: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 66,
    paddingLeft: 8,
    paddingRight: 10,
    borderRadius: 33,
    shadowColor: '#2A2350',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 6,
  },
  chipArt: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  chipEye: { fontFamily: font.bodyBold, fontSize: 11, letterSpacing: 1.1 },
  chipT: { fontFamily: font.display, fontSize: 20, lineHeight: 23 },
  ringT: { fontFamily: font.display, fontSize: 13 },
  nextEye: { fontFamily: font.bodyBold, fontSize: 12, letterSpacing: 1.1 },
  today: { position: 'absolute', zIndex: 4, width: 60, alignItems: 'center' },
  todayT: {
    fontFamily: font.bodyBold,
    fontSize: 12,
    color: '#5A3A00',
    backgroundColor: '#FFC832',
    borderRadius: 9,
    paddingHorizontal: 8,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  nextT: { fontFamily: font.bodyBold, fontSize: 17, lineHeight: 21, marginTop: 2 },
});

/* ---------- the whole map ---------- */
const LandSvg = memo(function LandSvg({ xml, top, w, h }: { xml: string; top: number; w: number; h: number }) {
  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', left: 0, top, width: w, height: h }}
      accessible={false}
      importantForAccessibility="no-hide-descendants">
      <SvgXml xml={xml} width={w} height={h} />
    </View>
  );
});

export function LessonMapView({
  m,
  open,
  dates,
  today,
  waiting,
  win,
  hide,
  sel,
  onSel,
  onGeom,
  onStart,
  onSignIn,
  onCard,
}: {
  m: LessonMap;
  /** whether a lesson can be opened now, by the account rule (Up next can wait behind a free account) */
  open: (L: Lesson) => boolean;
  /** the day each finished lesson was finished, by lesson id */
  dates: Record<string, string>;
  /** the lessons finished today, wherever they were opened (Today, a check-in, a help page, a review) */
  today: Set<string>;
  waiting: number;
  /** the lands near the screen, to draw in full */
  win: [number, number];
  /** the land whose signpost is under the floating card at the top, to leave out */
  hide?: number;
  sel: string | null;
  onSel: (id: string | null) => void;
  /** where the map sits in the pane, and how much it is scaled */
  onGeom: (g: { y: number; k: number }) => void;
  onStart: (id: string) => void;
  onSignIn: () => void;
  /** an opened card's bottom edge, in the map's own pixels (from the map's top), so the page can bring it above the tab bar */
  onCard?: (bottom: number) => void;
}) {
  const c = useTheme();
  const dark = c.scheme === 'dark';
  const [w, setW] = useState(0);
  const k = w ? Math.min(w / MAP_W, 1.15) : 1;
  const offX = w ? (w - MAP_W * k) / 2 : 0;
  const X = (x: number) => offX + x * k;
  const Y = (v: number) => v * k;
  const x0 = -offX / k;
  const x1 = MAP_W + offX / k;
  const xmls = useMemo(
    () => (w ? m.lands.map((l) => landXml(l, m, { dark, bg: c.bg, ic: toneOf(c, toneName(l.u)).ic, x0, x1, id: `lm${l.k}${dark ? 'd' : 'l'}` })) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [m, dark, w],
  );
  const all = m.lands.flatMap((l) => l.stones);
  const pick = all.find((s) => s.L.id === sel) || null;
  const nx = m.next;
  const nxLand = nx ? m.lands.find((l) => l.stones.includes(nx))! : null;
  const cardTop = pick ? Y(pick.y) + (pick.state === 'next' ? 37 : 29) * k + 14 : 0;
  /* when Up next moves on (a lesson finished here or anywhere else), a few sparks fly from the new stone, once, the next
     time the map is on screen */
  const focused = useIsFocused();
  const seen = useRef<number | null>(null);
  const [spark, setSpark] = useState<string | null>(null);
  const at = nx ? all.indexOf(nx) : all.length;
  useEffect(() => {
    if (!focused || !w) return;
    const was = seen.current;
    seen.current = at;
    if (was == null || at <= was || !nx) return;
    const id = nx.L.id;
    const a = setTimeout(() => setSpark(id), 420);
    const b = setTimeout(() => setSpark(null), 2000);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focused, at, w > 0]);
  const label = (s: MapStone) => {
    const no = s.n;
    const st =
      s.state === 'done'
        ? today.has(s.L.id)
          ? 'Done today'
          : 'Done' + (dates[s.L.id] ? ', ' + dates[s.L.id] : '')
        : s.state === 'next'
          ? open(s.L)
            ? 'Up next'
            : 'Up next, opens with a free account'
          : 'Opens after lesson ' + (no - 1);
    return `Lesson ${no}: ${s.L.title}. ${st}.`;
  };
  return (
    <View
      style={{ marginHorizontal: -16, height: Y(m.height) }}
      onLayout={(e) => {
        const ww = Math.round(e.nativeEvent.layout.width);
        if (ww !== w) setW(ww);
        onGeom({ y: e.nativeEvent.layout.y, k: Math.min(ww / MAP_W, 1.15) });
      }}>
      {w
        ? m.lands.map((l, i) => {
            const last = i === m.lands.length - 1;
            const top = Y(l.top - 70);
            const h = Y((last ? m.height : l.bottom + 60) - (l.top - 70));
            return i >= win[0] && i <= win[1] ? (
              <LandSvg key={l.k} xml={xmls[i]} top={top} w={w} h={h} />
            ) : (
              <View
                key={l.k}
                pointerEvents="none"
                style={{ position: 'absolute', left: 0, right: 0, top: Y(l.top), height: Y(l.bottom - l.top), backgroundColor: landOf(l.u, dark).sky[1] }}
              />
            );
          })
        : null}
      {w && sel ? <Pressable accessible={false} onPress={() => onSel(null)} style={[StyleSheet.absoluteFill, { zIndex: 1 }]} /> : null}
      {w
        ? m.lands.map((l) => (
            <Signpost key={'s' + l.k} l={l} gone={l.k === hide} at={l.right ? { right: w - X(MAP_W - 16) } : { left: X(16) }} y={Y(l.top + 22)} k={k} />
          ))
        : null}
      {w && nx && nxLand ? <Ring x={X(nx.x)} y={Y(nx.y)} k={k} color={toneOf(c, toneName(nxLand.u)).ic} frac={nxLand.done / nxLand.stones.length} /> : null}
      {w
        ? m.lands.map((l) => {
            const t = toneOf(c, toneName(l.u));
            return l.stones.map((s) => (
              <Stone
                key={s.L.id}
                s={s}
                x={X(s.x)}
                y={Y(s.y)}
                k={k}
                t={t}
                dark={dark}
                open={sel === s.L.id}
                label={label(s)}
                onPress={() => onSel(sel === s.L.id ? null : s.L.id)}
              />
            ));
          })
        : null}
      {w
        ? all
            .filter((s) => s.state === 'done' && today.has(s.L.id) && s.L.id !== sel)
            .map((s) => (
              <View key={'t' + s.L.id} pointerEvents="none" style={[s_.today, { left: X(s.x) - 30, top: Y(s.y) + 34 * k }]}>
                <Text style={s_.todayT}>Today</Text>
              </View>
            ))
        : null}
      {w && nx && sel !== nx.L.id ? (
        <NextLabel s={nx} land={m.lands.find((l) => l.stones.includes(nx))!} x={X(nx.x)} y={Y(nx.y)} k={k} w={w} onPress={() => onSel(nx.L.id)} />
      ) : null}
      {w ? (
        <Pin x={nx ? X(nx.x) : X(m.end.x)} y={nx ? Y(nx.y) - 4 * k : Y(m.end.y) + 6 * k} k={k} color={c.accent} edge={dark ? '#1A1250' : '#FFFFFF'} />
      ) : null}
      {w ? <Trophy x={X(m.end.x)} y={Y(m.end.y)} k={k} all={!nx} total={all.length} /> : null}
      {w && nx && nxLand && spark === nx.L.id ? <Spark key={spark} x={X(nx.x)} y={Y(nx.y)} k={k} color={toneOf(c, toneName(nxLand.u)).ic} /> : null}
      {w && pick ? (
        <StoneCard
          L={pick.L}
          x={X(pick.x)}
          top={cardTop}
          onHeight={(h) => onCard?.(cardTop + h)}
          t={toneOf(c, toneName(pick.L.u))}
          when={pick.state === 'done' ? (today.has(pick.L.id) ? 'today' : dates[pick.L.id] || '') : null}
          locked={!open(pick.L)}
          ahead={pick.state === 'todo' ? nx && nx.L : null}
          waiting={waiting}
          onStart={() => onStart(pick.L.id)}
          onNext={() => nx && onStart(nx.L.id)}
          onSignIn={onSignIn}
          onClose={() => onSel(null)}
        />
      ) : null}
    </View>
  );
}

/** the next lesson's name beside its stone, toward the middle of the page */
function NextLabel({ s, land, x, y, k, w, onPress }: { s: MapStone; land: MapLand; x: number; y: number; k: number; w: number; onPress: () => void }) {
  const c = useTheme();
  const t = toneOf(c, toneName(land.u));
  const right = land.right;
  const left = right ? x + 50 * k : 12;
  const width = right ? w - left - 12 : x - 50 * k - 12;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Up next: lesson ${s.n}, ${s.L.title}, ${lmin(s.L)}. Open its card.`}
      onPress={onPress}
      style={{ position: 'absolute', left, width, top: y - 30 * k, zIndex: 4, alignItems: right ? 'flex-start' : 'flex-end' }}>
      <Text style={[s_.nextEye, { color: t.text, textAlign: right ? 'left' : 'right' }]}>UP NEXT · {lmin(s.L).toUpperCase()}</Text>
      <Text style={[s_.nextT, { color: c.ink, textAlign: right ? 'left' : 'right' }]}>
        {s.n}. {s.L.title}
      </Text>
    </Pressable>
  );
}
