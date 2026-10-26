/* The top of Today: your flame in its own sky (core: emblemScene), with stars at night and its own hills carried on across the card; your
   one number sits on the picture (core: heroNumber), your level beside it, and the bar to the next form along its edge.
   Under the picture, in the same card, the one next step (core pickMoment, moment-card.tsx), so what you do and what it
   grows are one picture (CLAUDE.md, "The flame is the heart of the app"). The flame moves in a way that fits its form and
   the stars twinkle (both still under Reduce Motion). Tap the flame and a slow bloom of light goes through it and it says
   hi; tap the sky for Milestones; the level for how points work; the number for your days. When points come in while the
   app is open (a lesson, a check-in, an urge ridden out), the flame grows in front of you: back on Today, the bar fills
   to where it now is, the flame blooms once, and a quiet word says so (after any celebration that came with it).
   In the sky's corner, a small ring of seven: this week's lesson days (core lessonWeek). It only fills, and a slip never
   touches it. A lesson finished lights its day at the same moment the flame blooms, so each one is seen feeding the flame. */
import { CHEERS, emblemScene, heroNumber, lessonWeek, type GameState, type LessonWeek, type Snapshot } from '@daybook/core';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';

/** the words on the flame's picture stay close to their size: the picture does not grow with the phone's text size */
const ON_ART = 1.15;
import Svg, { Path, SvgXml } from 'react-native-svg';

import { useCelebrating } from '@/components/celebrate';
import { GradFlame } from '@/components/grad';
import { Card, Icon } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { NATIVE, useReducedMotion } from '@/lib/motion';
import { useStore } from '@/lib/store';
import { font, useTheme } from '@/lib/theme';

const SCENE_H = 262;
const FLAME = 206;
const FLAME_TOP = 2;

export function Hero({ g, snap, tk, now, children }: { g: GameState; snap: Snapshot; tk: string; now: number; children?: React.ReactNode }) {
  return (
    <Card style={s.card}>
      <Sky g={g} snap={snap} tk={tk} now={now} />
      {children ? <View style={s.under}>{children}</View> : null}
    </Card>
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

function Sky({ g, snap, tk, now }: { g: GameState; snap: Snapshot; tk: string; now: number }) {
  const c = useTheme();
  const { say } = useStore();
  const reduce = useReducedMotion();
  const lvl = g.level;
  const sc = useMemo(() => emblemScene(lvl.n), [lvl.n]);
  const h = heroNumber(snap.days, snap.settings!, tk, now);
  const week = useMemo(() => lessonWeek(snap.days, tk), [snap.days, tk]);
  const light = sc.ink === 'light';
  const ink = light ? '#FFFFFF' : '#14112E';
  /* on green hills the small words take the full ink, so they still read */
  const soft = light ? '#DCD3FF' : sc.land ? ink : '#3D3670';
  const glass = light ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.62)';
  /* the sky is alive: three slow twinkles shared by the stars */
  const tw = useRef([new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)]).current;
  const [pulse, setPulse] = useState(0);
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
  /* a tap on the flame: one slow bloom of light through the figure (the sky stays still), and it says hi */
  const hello = () => {
    buzz('tap');
    say(CHEERS[Math.floor(Math.random() * CHEERS.length)]);
    setPulse((p) => p + 1);
  };
  /* the flame grows in front of you: what was last seen here, and the bar from there to now, once any celebration that
     came with it is closed */
  const seen = useRef({ n: lvl.n, frac: lvl.frac, pts: g.pts, ring: week.n });
  const bar = useRef(new Animated.Value(lvl.frac)).current;
  /* the ring's day, lit with the bloom: the ring shows what was seen until then */
  const [ringSeen, setRingSeen] = useState(week.n);
  const ringPop = useRef(new Animated.Value(1)).current;
  const busy = useCelebrating();
  const [due, setDue] = useState(false);
  const dueRef = useRef(false);
  const [grew, setGrew] = useState(false);
  useFocusEffect(
    useCallback(() => {
      const was = seen.current;
      seen.current = { n: lvl.n, frac: lvl.frac, pts: g.pts, ring: week.n };
      if (week.n < was.ring || (week.n > was.ring && g.pts <= was.pts)) setRingSeen(week.n);
      if (g.pts > was.pts && !dueRef.current) {
        bar.setValue(lvl.n > was.n ? 0 : was.frac);
        dueRef.current = true;
        setDue(true);
      } else if (!dueRef.current) bar.setValue(lvl.frac);
    }, [g.pts, lvl.n, lvl.frac, bar, week.n]),
  );
  useEffect(() => {
    if (!due || busy) return;
    dueRef.current = false;
    setDue(false);
    if (reduce) bar.setValue(lvl.frac);
    else Animated.timing(bar, { toValue: lvl.frac, duration: 1100, delay: 350, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
    setPulse((p) => p + 1);
    setGrew(true);
    setRingSeen(week.n);
    if (!reduce && week.n > ringSeen)
      Animated.sequence([
        Animated.delay(350),
        Animated.timing(ringPop, { toValue: 1.18, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: NATIVE }),
        Animated.timing(ringPop, { toValue: 1, duration: 420, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
      ]).start();
    AccessibilityInfo.announceForAccessibility('Your flame grew.');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [due, busy, reduce, bar, lvl.frac]);
  /* the ring shows the days seen here so far: a new lesson day lights with the bloom */
  const shown = ringSeen >= week.n ? week : { ...week, n: ringSeen };
  useEffect(() => {
    if (!grew) return;
    const t = setTimeout(() => setGrew(false), 2800);
    return () => clearTimeout(t);
  }, [grew]);
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
        {/* the drawing's own hills, carried on across the card at the drawing's scale, so its hills fade into the same ones */}
        {sc.land ? (
          <SvgXml
            xml={`<svg viewBox="${60 - 400} ${(-FLAME_TOP * 120) / FLAME} 800 ${(SCENE_H * 120) / FLAME}" preserveAspectRatio="xMidYMin slice">${sc.land}</svg>`}
            style={StyleSheet.absoluteFill}
            width="100%"
            height={SCENE_H}
            pointerEvents="none"
          />
        ) : null}
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Lessons this week: ${week.n} of 7 days. Opens Learn.`}
        onPress={() => {
          buzz('tap');
          router.navigate('/learn');
        }}
        style={({ pressed }) => [s.ring, pressed && { opacity: 0.8 }]}>
        <Animated.View style={{ transform: [{ scale: ringPop }] }}>
          <WeekRing
            week={shown}
            lit={c.sun}
            dim={light ? 'rgba(255,255,255,0.2)' : 'rgba(31,26,74,0.14)'}
            now={light ? 'rgba(255,255,255,0.42)' : 'rgba(31,26,74,0.3)'}
            ink={ink}
          />
        </Animated.View>
        <Text maxFontSizeMultiplier={ON_ART} style={[s.ringT, { color: soft }]}>
          LESSON DAYS
        </Text>
      </Pressable>
      <View style={s.flame} pointerEvents="box-none">
        <Pressable accessibilityRole="button" accessibilityLabel={`Your flame, level ${lvl.n}. Tap to say hi.`} onPress={hello}>
          <GradFlame level={lvl.n} size={FLAME} soft pulse={pulse} />
        </Pressable>
      </View>
      {h ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={h.say + ' Opens your days.'}
          onPress={() => router.navigate({ pathname: '/journal', params: { pane: 'days' } })}
          style={({ pressed }) => [s.num, pressed && { opacity: 0.8 }]}>
          <Text maxFontSizeMultiplier={ON_ART} style={[s.eb, { color: soft }]}>
            {h.eb.toUpperCase()}
          </Text>
          {/* the words beside the number wrap to a second line on a narrow phone, so they never run under the level */}
          <View style={s.nRow}>
            <Text maxFontSizeMultiplier={ON_ART} numberOfLines={1} style={[s.n, { color: ink }]}>
              {h.n}
            </Text>
            {h.unit ? (
              <Text maxFontSizeMultiplier={ON_ART} style={[s.unit, { color: soft }]}>
                {h.unit}
              </Text>
            ) : null}
          </View>
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
            <Text maxFontSizeMultiplier={ON_ART} style={[s.chipT, { color: ink }]}>
              {h.chip}
            </Text>
          </View>
        ) : null}
        <Text maxFontSizeMultiplier={ON_ART} style={[s.lvT, { color: ink }]}>
          Level {lvl.n} · {lvl.name} ›
        </Text>
      </Pressable>
      {grew ? (
        <View style={[s.grew, { backgroundColor: glass }]} pointerEvents="none">
          <Icon name="star" size={13} color={ink} />
          <Text maxFontSizeMultiplier={ON_ART} style={[s.chipT, { color: ink }]}>
            Your flame grew
          </Text>
        </View>
      ) : null}
      <View style={[s.bar, { backgroundColor: light ? 'rgba(255,255,255,0.14)' : 'rgba(31,26,74,0.14)' }]} pointerEvents="none">
        <Animated.View
          style={{ width: bar.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'], extrapolate: 'clamp' }), height: '100%', backgroundColor: c.sun }}
        />
      </View>
    </View>
  );
}

/* ---------- the week's lesson days: seven arcs, Monday at the top, going round ---------- */
const RING = 44;
const RING_W = 5;
function arc(cx: number, cy: number, r: number, a0: number, a1: number) {
  const p = (a: number) => [cx + r * Math.cos(((a - 90) * Math.PI) / 180), cy + r * Math.sin(((a - 90) * Math.PI) / 180)];
  const [x0, y0] = p(a0);
  const [x1, y1] = p(a1);
  return `M${x0.toFixed(2)} ${y0.toFixed(2)}A${r} ${r} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
}
/** the week's days, n of them lit (the first n lit days; a newer one waits for the bloom) */
function WeekRing({ week, lit, dim, now, ink }: { week: LessonWeek; lit: string; dim: string; now: string; ink: string }) {
  const r = (RING - RING_W) / 2;
  const step = 360 / 7;
  let left = week.n;
  return (
    <View style={{ width: RING, height: RING, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={RING} height={RING} style={StyleSheet.absoluteFill}>
        {week.days.map((d, i) => {
          const on = d.on && left-- > 0;
          return (
            <Path
              key={d.k}
              d={arc(RING / 2, RING / 2, r, i * step + 5, (i + 1) * step - 5)}
              stroke={on ? lit : d.today ? now : dim}
              strokeWidth={RING_W}
              strokeLinecap="round"
              fill="none"
            />
          );
        })}
      </Svg>
      <Text maxFontSizeMultiplier={ON_ART} style={[s.ringN, { color: ink }]}>
        {week.n}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  card: { padding: 0, gap: 0 },
  sky: { height: SCENE_H, borderTopLeftRadius: 22, borderTopRightRadius: 22, overflow: 'hidden' },
  star: { position: 'absolute', backgroundColor: '#FFF6D8' },
  flame: { position: 'absolute', top: FLAME_TOP, left: 0, right: 0, alignItems: 'center' },
  num: { position: 'absolute', left: 14, bottom: 16, maxWidth: '52%' },
  eb: { fontFamily: font.bodyBold, fontSize: 12, letterSpacing: 1.2 },
  n: { fontFamily: font.display, fontSize: 34, lineHeight: 38 },
  nRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  unit: { flexShrink: 1, fontFamily: font.display, fontSize: 17, lineHeight: 20, paddingBottom: 4 },
  lv: { position: 'absolute', right: 14, bottom: 18, alignItems: 'flex-end', gap: 6, maxWidth: '45%' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  chipT: { fontFamily: font.bodySemi, fontSize: 13.5 },
  lvT: { fontFamily: font.bodySemi, fontSize: 14, textAlign: 'right' },
  bar: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 6 },
  grew: {
    position: 'absolute',
    top: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  under: { padding: 14 },
  ring: { position: 'absolute', top: 12, left: 12, alignItems: 'center', gap: 3 },
  ringN: { fontFamily: font.display, fontSize: 16, lineHeight: 19 },
  ringT: { fontFamily: font.bodyBold, fontSize: 9.5, letterSpacing: 1 },
});
