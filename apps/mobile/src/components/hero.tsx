/* The top of Today, in two cards. The first is your flame in its own sky (core: emblemScene), with stars at night and its
   hills along the bottom; your one number sits on the picture (core: heroNumber), your level beside it, and the level's
   bar along its edge. Under the picture, your one next step (core: nextUp), in the color of its moment, with a Start
   button. The second card is help: SOS on its own row, then Already happened and Planning a slip? (LogLink). The flame
   moves in a way that fits its form and the stars twinkle (both still under Reduce Motion). Tap
   the flame and it wiggles and says hi; tap the sky for Milestones; the level for how points work; the number for your
   days. */
import { CHEERS, emblemScene, heroNumber, nextUp, type GameState, type NextUp, type Snapshot } from '@daybook/core';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { GradFlame } from '@/components/grad';
import { LogLink } from '@/components/today-log';
import { Card, Icon } from '@/components/ui';
import { lookOf, openStopKey } from '@/components/your-day';
import { buzz } from '@/lib/feel';
import { NATIVE, useReducedMotion } from '@/lib/motion';
import { useStore } from '@/lib/store';
import { font, nightInk, skies, useTheme } from '@/lib/theme';

const SCENE_H = 262;
const FLAME = 206;
const FLAME_TOP = 2;

export function Hero({ g, snap, tk, now }: { g: GameState; snap: Snapshot; tk: string; now: number }) {
  const o = nextUp(snap.days, snap.settings!, tk, now);
  return (
    <>
      <Card style={s.card}>
        <Sky g={g} snap={snap} tk={tk} now={now} />
        {o.n ? (
          <View style={s.under}>
            <NextBand o={o} />
          </View>
        ) : null}
      </Card>
      <Card>
        <LogLink />
      </Card>
    </>
  );
}

/* ---------- the flame in its own sky ---------- */
/* a few stars, placed by hand so the sky looks the same every time: [left %, top px, size] */
const STARS: [number, number, number][] = [
  [5, 22, 2],
  [12, 70, 3],
  [9, 128, 2],
  [20, 40, 2],
  [24, 104, 3],
  [31, 16, 3],
  [17, 160, 2],
  [69, 30, 2],
  [76, 84, 3],
  [83, 18, 3],
  [90, 58, 2],
  [94, 120, 3],
  [86, 150, 2],
  [72, 134, 2],
  [62, 10, 2],
  [38, 150, 2],
];
/** a color between two, part of the way from a to b */
function mix(a: string, b: string, t: number) {
  const p = (h: string, i: number) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16);
  return (
    '#' +
    [0, 1, 2]
      .map((i) =>
        Math.round(p(a, i) + (p(b, i) - p(a, i)) * t)
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')
  );
}

function Sky({ g, snap, tk, now }: { g: GameState; snap: Snapshot; tk: string; now: number }) {
  const c = useTheme();
  const { say } = useStore();
  const reduce = useReducedMotion();
  const lvl = g.level;
  const sc = useMemo(() => emblemScene(lvl.n), [lvl.n]);
  const h = heroNumber(snap.days, snap.settings!, tk, now);
  const light = sc.ink === 'light';
  const ink = light ? '#FFFFFF' : '#1F1A4A';
  const soft = light ? '#DCD3FF' : '#3D3670';
  const glass = light ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.62)';
  /* the sky is alive: three slow twinkles shared by the stars */
  const tw = useRef([new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)]).current;
  const wig = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduce) return;
    const loops = [2600, 3400, 4300].map((ms, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 500),
          Animated.timing(tw[i], { toValue: 1, duration: ms / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
          Animated.timing(tw[i], { toValue: 0, duration: ms / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
        ]),
      ),
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [reduce, tw]);
  /* a tap on the flame: it wiggles, and says hi */
  const wiggle = () => {
    buzz('tap');
    say(CHEERS[Math.floor(Math.random() * CHEERS.length)]);
    if (reduce) return;
    wig.setValue(0);
    Animated.sequence(
      [1, -1, 0.7, -0.7, 0.35, 0].map((to) => Animated.timing(wig, { toValue: to, duration: 85, easing: Easing.inOut(Easing.quad), useNativeDriver: NATIVE })),
    ).start();
  };
  return (
    <View style={s.sky}>
      {/* the card's sky lines up with the drawing's own, so the drawing melts into it */}
      <LinearGradient
        colors={sc.sky}
        locations={sc.at.map((o) => (FLAME_TOP + o * FLAME) / SCENE_H) as [number, number, number]}
        style={StyleSheet.absoluteFill}
      />
      {/* the sky itself (stars and hills) opens Milestones: every form the flame grows into */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Milestones: every form your flame grows into"
        onPress={() => {
          buzz('tap');
          router.push('/miles');
        }}
        style={StyleSheet.absoluteFill}>
        {sc.stars
          ? STARS.map(([x, y, r], i) => (
              <Animated.View
                key={i}
                style={[
                  s.star,
                  {
                    left: `${x}%`,
                    top: y,
                    width: r,
                    height: r,
                    borderRadius: r / 2,
                    opacity: reduce ? 0.8 : tw[i % 3].interpolate({ inputRange: [0, 1], outputRange: i % 2 ? [0.95, 0.3] : [0.3, 0.95] }),
                  },
                ]}
              />
            ))
          : null}
        {sc.ground ? (
          <Svg style={s.hills} width="100%" height={70} viewBox="0 0 390 70" preserveAspectRatio="none" pointerEvents="none">
            <Path d="M0 38 Q90 8 190 35 T390 27 V70 H0z" fill={mix(sc.ground, sc.sky[2], 0.45)} />
            <Path d="M0 56 Q120 35 240 53 T390 49 V70 H0z" fill={sc.ground} />
          </Svg>
        ) : null}
      </Pressable>
      <View style={s.flame} pointerEvents="box-none">
        <Pressable accessibilityRole="button" accessibilityLabel={`Your flame, level ${lvl.n}. Tap to say hi.`} onPress={wiggle}>
          <Animated.View
            style={{
              transform: [
                { rotate: wig.interpolate({ inputRange: [-1, 1], outputRange: ['-9deg', '9deg'] }) },
                { scale: wig.interpolate({ inputRange: [-1, 0, 1], outputRange: [1.05, 1, 1.05] }) },
              ],
            }}>
            <GradFlame level={lvl.n} size={FLAME} soft />
          </Animated.View>
        </Pressable>
      </View>
      {h ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={h.say + ' Opens your days.'}
          onPress={() => router.navigate({ pathname: '/journal', params: { pane: 'days' } })}
          style={({ pressed }) => [s.num, pressed && { opacity: 0.8 }]}>
          <Text style={[s.eb, { color: soft }]}>{h.eb.toUpperCase()}</Text>
          <Text style={[s.n, { color: ink }]}>
            {h.n}
            {h.unit ? <Text style={[s.unit, { color: soft }]}>{' ' + h.unit}</Text> : null}
          </Text>
        </Pressable>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Level ${lvl.n}, ${lvl.name}. ${g.pts} points. Tap to see how points work.`}
        onPress={() => router.push('/points')}
        style={({ pressed }) => [s.lv, pressed && { opacity: 0.8 }]}>
        {h && h.chip ? (
          <View style={[s.chip, { backgroundColor: glass }]}>
            {h.star ? <Icon name="star" size={13} color={ink} /> : null}
            <Text style={[s.chipT, { color: ink }]}>{h.chip}</Text>
          </View>
        ) : null}
        <Text style={[s.lvT, { color: ink }]}>
          Level {lvl.n} · {lvl.name} ›
        </Text>
      </Pressable>
      <View style={[s.bar, { backgroundColor: light ? 'rgba(255,255,255,0.14)' : 'rgba(31,26,74,0.14)' }]} pointerEvents="none">
        <View style={{ width: `${Math.max(0, Math.min(1, lvl.frac)) * 100}%`, height: '100%', backgroundColor: c.sun }} />
      </View>
    </View>
  );
}

/* ---------- your one next step ---------- */
const SKY_OF: Record<string, 'sun' | 'sky' | 'violet' | 'night'> = { morning: 'sun', lesson: 'sky', evening: 'violet', night: 'night' };
function NextBand({ o }: { o: NextUp }) {
  const c = useTheme();
  if (!o.k)
    return (
      <View style={[s.band, { backgroundColor: c.mintSoft }]} accessibilityRole="text">
        <View style={[s.bic, { backgroundColor: c.surface }]}>
          <Icon name="check" size={24} color={c.mintText} />
        </View>
        <View style={{ flex: 1, gap: 1 }}>
          <Text style={[s.k, { color: c.mintText }]}>ALL DONE FOR TODAY</Text>
          <Text style={[s.t, { color: c.mintText }]}>Great work. Rest well.</Text>
        </View>
      </View>
    );
  const sky = SKY_OF[o.k] || 'violet';
  const L = lookOf(sky, c);
  const deep = c.scheme === 'dark' || sky === 'night';
  const ink = deep ? nightInk.ink : c.ink;
  const soft = deep ? '#E6DEFF' : c.muted;
  const eb = sky === 'night' ? '#FFE27A' : L.ink;
  const [a, b] = skies[c.scheme][sky];
  const sub = [o.when || o.s, o.pts ? '+' + o.pts + ' points' : ''].filter(Boolean).join(' · ');
  /* "Lesson 3: Wanting is not liking" reads better as LESSON 3 (in place of NEXT) over the title, which then fits */
  const m = /^(Lesson \d+|Read again): (.+)$/.exec(o.t || '');
  const title = m ? m[2] : o.t;
  const tag = m ? m[1].toUpperCase() : 'NEXT';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Next up: ${o.t}. ${sub}. ${o.done} of ${o.n} done today. Start.`}
      onPress={() => (o.act === 'lesson' ? router.push({ pathname: '/lesson/[id]', params: { id: o.v! } }) : openStopKey(o.v!))}
      style={({ pressed }) => [
        s.band,
        {
          shadowColor: sky === 'night' ? '#0B0828' : 'rgba(20,14,60,0.45)',
          shadowOffset: { width: 0, height: pressed ? 1 : 5 },
          transform: [{ translateY: pressed ? 4 : 0 }],
        },
      ]}>
      <LinearGradient colors={[a, b]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[StyleSheet.absoluteFill, { borderRadius: 20 }]} />
      <View style={[s.bic, { backgroundColor: deep ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.7)' }]}>
        <Icon name={o.ic!} size={23} color={sky === 'night' ? '#FFE27A' : L.ink} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <View style={s.kRow}>
          <Text style={[s.k, { color: eb, flexShrink: 1 }]} numberOfLines={1}>
            {tag}
          </Text>
          {o.pips ? (
            <View style={s.pips}>
              {o.pips.map((p, i) => (
                <View
                  key={i}
                  style={[s.pip, { backgroundColor: p === 'on' ? c.mint : p === 'now' ? ink : deep ? 'rgba(255,255,255,0.25)' : 'rgba(31,26,74,0.18)' }]}
                />
              ))}
            </View>
          ) : null}
        </View>
        <Text style={[s.t, { color: ink }]} numberOfLines={2}>
          {title}
        </Text>
        <Text style={[s.sub, { color: soft }]}>{sub}</Text>
      </View>
      <View style={[s.go, { backgroundColor: L.btn }]}>
        <Text style={[s.goT, { color: L.onBtn }]}>Start ›</Text>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: { padding: 0, gap: 0 },
  sky: { height: SCENE_H, borderTopLeftRadius: 22, borderTopRightRadius: 22, overflow: 'hidden' },
  star: { position: 'absolute', backgroundColor: '#FFF6D8' },
  hills: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  flame: { position: 'absolute', top: FLAME_TOP, left: 0, right: 0, alignItems: 'center' },
  num: { position: 'absolute', left: 14, bottom: 16, maxWidth: '52%' },
  eb: { fontFamily: font.bodyBold, fontSize: 12, letterSpacing: 1.2 },
  n: { fontFamily: font.display, fontSize: 34, lineHeight: 38 },
  unit: { fontFamily: font.display, fontSize: 17 },
  lv: { position: 'absolute', right: 14, bottom: 18, alignItems: 'flex-end', gap: 6, maxWidth: '46%' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  chipT: { fontFamily: font.bodySemi, fontSize: 13.5 },
  lvT: { fontFamily: font.bodySemi, fontSize: 14, textAlign: 'right' },
  bar: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 6 },
  under: { padding: 14 },
  band: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 76,
    padding: 14,
    borderRadius: 20,
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  bic: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  kRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  k: { fontFamily: font.bodyBold, fontSize: 11.5, letterSpacing: 1.1 },
  pips: { flexDirection: 'row', gap: 3 },
  pip: { width: 10, height: 5, borderRadius: 3 },
  t: { fontFamily: font.display, fontSize: 19, lineHeight: 23 },
  sub: { fontFamily: font.bodyMedium, fontSize: 13.5 },
  go: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999 },
  goT: { fontFamily: font.bodyBold, fontSize: 15 },
});
