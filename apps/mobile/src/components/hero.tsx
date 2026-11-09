/* The top of Today: your flame in its own sky (core: emblemScene), from edge to edge and under the clock, with stars at night
   and its own hills carried on across the page. Nothing is written over the flame (the owner, November 1, 2026): your one number
   sits low on the left (core: heroNumber), your level on the right, and the bar to the next form along the bottom edge. The flame is the
   biggest thing on the screen (lib/today-size.ts; CLAUDE.md, "The flame is the heart of the app"). The one next step hangs right
   under it (core pickMoment, moment-card.tsx), so what you do and what it grows are one picture. The flame moves in a way that
   fits its form and the stars twinkle (both still under Reduce Motion). Tap the flame and a slow bloom of light goes through it
   and it says hi; tap the sky for Milestones; the level for how points work; the number for your days. When points come in while
   the app is open (a lesson, a check-in, an urge ridden out), the flame grows in front of you: back on Today, the bar fills to
   where it now is, the flame blooms once, and a quiet word says so (after any celebration that came with it).
   Under the number, the hours since a slip, for 72 hours after one (the owner, October 30, 2026), or a best or the way to graduation.
   When the person stops doing their part the fire burns lower (core flame-low.ts, the owner, November 8, 2026): the first time Today is seen that
   day it burns fully and then goes down, as if water were poured on it, with a few fading ticks, and one firm line at the top of the sky says so.
   When they do something again and come back to Today, it is lit again in front of them: the heart catches, the fire climbs back with three
   rising knocks, sparks fly, and a quiet word says so. Only the glow changes; the level, the bar and the number stay as they are. */
import { CHEERS, emblemScene, fireLow, formOfLevel, heroNumber, LOW_OF, LOW_WARN, lowWords, RELIT, type GameState, type Snapshot } from '@daybook/core';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect, useIsFocused } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/text';

/** the words on the flame's picture stay close to their size: the picture does not grow with the phone's text size */
const ON_ART = 1.15;
import { SvgXml } from 'react-native-svg';

import { BigFlame, DOUSE_MS, DOUSE_WAIT, RELIGHT_CATCH, RELIGHT_MS } from '@/components/big-flame';
import { useCelebrating } from '@/components/celebrate';
import { Icon } from '@/components/ui';
import { buzz, knock } from '@/lib/feel';
import { NATIVE, useReducedMotion } from '@/lib/motion';
import { useStore } from '@/lib/store';
import { font, useTheme } from '@/lib/theme';
import { FOOT } from '@/lib/today-size';

/** how far a form stands below the hills' line, as a share of its drawing: the torch and the beacon are tall and narrow enough to pass between the words; the kindling's and the campfire's logs are wide, so they stay clear above them */
const SINK: Record<number, number> = { 1: -0.02, 2: 0, 3: 0.11, 4: 0.08 };
/** the star field was drawn for a sky this tall, and spreads with the real one */
const STAR_SKY = 262;
/** the day the fire was last seen going down, and lit again, in this run of the app: each is seen once a day */
let dousedOn: string | null = null;
let relitOn: string | null = null;

export function Hero({
  g,
  snap,
  tk,
  now,
  sky,
  flame,
  title,
  action,
  lead,
}: {
  g: GameState;
  snap: Snapshot;
  tk: string;
  now: number;
  /** the sky's height and the flame's drawing (lib/today-size.ts) */
  sky: number;
  flame: number;
  /** the date, said by a screen reader */
  title: string;
  /** a small button at the top right */
  action?: React.ReactNode;
  /** a small button at the top left */
  lead?: React.ReactNode;
}) {
  return <Sky g={g} snap={snap} tk={tk} now={now} height={sky} flame={flame} title={title} action={action} lead={lead} />;
}

/** the colors of the words on the sky at this level */
export function skyInk(level: number) {
  const sc = emblemScene(level);
  const light = sc.ink === 'light';
  return {
    light,
    ink: light ? '#FFFFFF' : '#14112E',
    /* on green hills the small words take the full ink, so they still read */
    soft: light ? '#DCD3FF' : sc.land ? '#14112E' : '#3D3670',
    glass: light ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.62)',
  };
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

function Sky({
  g,
  snap,
  tk,
  now,
  height,
  flame,
  title,
  action,
  lead,
}: {
  g: GameState;
  snap: Snapshot;
  tk: string;
  now: number;
  height: number;
  flame: number;
  title: string;
  action?: React.ReactNode;
  lead?: React.ReactNode;
}) {
  const c = useTheme();
  const { say } = useStore();
  const reduce = useReducedMotion();
  const lvl = g.level;
  const sc = useMemo(() => emblemScene(lvl.n), [lvl.n]);
  const inset = useSafeAreaInsets();
  const SCENE_H = height;
  const FLAME = flame;
  /* the drawing stands on the hills along the bottom, and the sky above it carries on up to the clock. The tall, narrow forms stand
     lower, between the number and the level, so their faces sit low too (the owner, November 1, 2026) */
  const FLAME_TOP = SCENE_H - FLAME - FOOT + 18 + Math.round(FLAME * (SINK[formOfLevel(lvl.n)] ?? 0.03));
  const h = heroNumber(snap.days, snap.settings!, tk, now);
  const { light, ink, soft, glass } = skyInk(lvl.n);
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
  const seen = useRef({ n: lvl.n, frac: lvl.frac, pts: g.pts });
  const bar = useRef(new Animated.Value(lvl.frac)).current;
  const busy = useCelebrating();
  const [due, setDue] = useState(false);
  const dueRef = useRef(false);
  const [grew, setGrew] = useState(false);
  useFocusEffect(
    useCallback(() => {
      const was = seen.current;
      seen.current = { n: lvl.n, frac: lvl.frac, pts: g.pts };
      if (g.pts > was.pts && !dueRef.current) {
        bar.setValue(lvl.n > was.n ? 0 : was.frac);
        dueRef.current = true;
        setDue(true);
      } else if (!dueRef.current) bar.setValue(lvl.frac);
    }, [g.pts, lvl.n, lvl.frac, bar]),
  );
  useEffect(() => {
    if (!due || busy) return;
    dueRef.current = false;
    setDue(false);
    if (reduce) bar.setValue(lvl.frac);
    else Animated.timing(bar, { toValue: lvl.frac, duration: 1100, delay: 350, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
    setPulse((p) => p + 1);
    setGrew(true);
    AccessibilityInfo.announceForAccessibility('Your flame grew.');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [due, busy, reduce, bar, lvl.frac]);
  useEffect(() => {
    if (!grew) return;
    const t = setTimeout(() => setGrew(false), 2800);
    return () => clearTimeout(t);
  }, [grew]);
  /* the fire burning low, and lit again */
  const fl = useMemo(() => fireLow(snap.days, snap.settings, tk, now), [snap.days, snap.settings, tk, now]);
  const words = lowWords(fl);
  const focused = useIsFocused();
  /* what the fire shows: it goes lower at once, but it is lit again only where the person sees it */
  const [shown, setShown] = useState(() => (fl.step === 0 && fl.was > 0 && relitOn !== tk ? LOW_OF[fl.was] : fl.low));
  const [douse] = useState(() => {
    const d = fl.step > 0 && dousedOn !== tk;
    if (d) dousedOn = tk;
    return d;
  });
  const [relit, setRelit] = useState(false);
  useEffect(() => {
    if (!douse || reduce) return;
    /* the water going on: a few ticks that fade as it goes down */
    const ts = [0, 260, 600, 1100, DOUSE_MS - 200].map((ms, i) =>
      setTimeout(() => (i < 4 ? buzz('tick') : knock(Haptics.ImpactFeedbackStyle.Soft)), DOUSE_WAIT + ms),
    );
    return () => ts.forEach(clearTimeout);
  }, [douse, reduce]);
  useEffect(() => {
    if (fl.low > shown) {
      setShown(fl.low);
      return;
    }
    if (fl.low >= shown || !focused || busy) return;
    const t = setTimeout(() => {
      relitOn = tk;
      setShown(fl.low);
      setRelit(true);
      AccessibilityInfo.announceForAccessibility(RELIT + '.');
      if (reduce) return buzz('lit');
      knock(Haptics.ImpactFeedbackStyle.Soft);
      setTimeout(() => knock(Haptics.ImpactFeedbackStyle.Light), RELIGHT_CATCH);
      setTimeout(
        () => {
          knock(Haptics.ImpactFeedbackStyle.Medium);
          setPulse((p) => p + 1);
        },
        RELIGHT_CATCH + RELIGHT_MS * 0.45,
      );
      setTimeout(() => buzz('lit'), RELIGHT_CATCH + RELIGHT_MS);
    }, 450);
    return () => clearTimeout(t);
  }, [fl.low, shown, focused, busy, reduce, tk]);
  useEffect(() => {
    if (!relit) return;
    const t = setTimeout(() => setRelit(false), 3400);
    return () => clearTimeout(t);
  }, [relit]);
  return (
    <>
      <View style={[s.sky, { height: SCENE_H }]}>
        {/* the card's sky lines up with the drawing's own, so the drawing melts into it */}
        <LinearGradient
          colors={sc.sky}
          locations={sc.at.map((o) => Math.max(0, FLAME_TOP + o * FLAME) / SCENE_H) as [number, number, number]}
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
                      top: (y * SCENE_H) / STAR_SKY,
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
        <View style={[s.flame, { top: FLAME_TOP }]} pointerEvents="box-none">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${title}. Your flame, level ${lvl.n}.${words ? ' ' + words.h + '.' : ''} Tap to say hi.`}
            onPress={hello}>
            <BigFlame level={lvl.n} size={FLAME} pulse={pulse} low={shown} douse={douse} smoke={light ? '#C9C2DA' : '#6B6577'} />
          </Pressable>
        </View>
        {lead ? (
          <View style={[s.lead, { top: inset.top + 10 }]} pointerEvents="box-none">
            {lead}
          </View>
        ) : null}
        {action ? (
          <View style={[s.action, { top: inset.top + 10 }]} pointerEvents="box-none">
            {action}
          </View>
        ) : null}
        {h ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={h.say + ' Opens your days.'}
            onPress={() => router.navigate({ pathname: '/pattern', params: { pane: 'days' } })}
            style={({ pressed }) => [s.num, pressed && { opacity: 0.8 }]}>
            <Text maxFontSizeMultiplier={ON_ART} style={[s.eb, { color: soft }]}>
              {h.eb}
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
            {h.chip ? (
              <View style={s.chip}>
                {h.star ? <Icon name="star" size={13} color={soft} /> : null}
                <Text maxFontSizeMultiplier={ON_ART} style={[s.small, { color: soft }]}>
                  {h.chip}
                </Text>
              </View>
            ) : null}
          </Pressable>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Level ${lvl.n}, ${lvl.name}. ${g.pts} points.${lvl.next ? ` The bar along the bottom is your level: ${lvl.toNext} points to level ${lvl.n + 1}.` : ''} Tap to see how points work.`}
          onPress={() => router.push('/points')}
          style={({ pressed }) => [s.lv, pressed && { opacity: 0.8 }]}>
          <Text maxFontSizeMultiplier={ON_ART} style={[s.lvT, { color: ink }]}>
            Level {lvl.n} · {lvl.name} ›
          </Text>
          {/* what the bar along the bottom is: the level, not the number on the left (the owner, October 23, 2026) */}
          {lvl.next ? (
            <Text maxFontSizeMultiplier={ON_ART} style={[s.small, { color: soft, textAlign: 'right' }]}>
              {lvl.toNext} {lvl.toNext === 1 ? 'point' : 'points'} to Level {lvl.n + 1}
            </Text>
          ) : null}
        </Pressable>
        {relit ? (
          <View style={[s.grew, { backgroundColor: glass }]} pointerEvents="none">
            <Icon name="flame" size={13} color={ink} />
            <Text maxFontSizeMultiplier={ON_ART} style={[s.small, { color: ink }]}>
              {RELIT}
            </Text>
          </View>
        ) : grew ? (
          <View style={[s.grew, { backgroundColor: glass }]} pointerEvents="none">
            <Icon name="star" size={13} color={ink} />
            <Text maxFontSizeMultiplier={ON_ART} style={[s.small, { color: ink }]}>
              Your flame grew
            </Text>
          </View>
        ) : null}
        <View style={[s.bar, { backgroundColor: light ? 'rgba(255,255,255,0.14)' : 'rgba(31,26,74,0.14)' }]} pointerEvents="none">
          <Animated.View
            style={{
              width: bar.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'], extrapolate: 'clamp' }),
              height: '100%',
              backgroundColor: c.sun,
            }}
          />
        </View>
      </View>
      {/* burning low: one firm line under the sky, clear of the flame, read before the next step */}
      {words ? (
        <View style={s.low} accessible accessibilityLabel={words.h + '. ' + words.p}>
          <Text style={[s.lowH, { color: c.ink }]}>{words.h}</Text>
          <Text style={[s.lowP, { color: c.muted }]}>{words.p}</Text>
        </View>
      ) : fl.warn && !relit ? (
        /* the day before it burns lower: one quieter line, while the flame still burns fully */
        <View style={s.low} accessible accessibilityLabel={LOW_WARN}>
          <Text style={[s.lowW, { color: c.ink }]}>{LOW_WARN}</Text>
        </View>
      ) : null}
    </>
  );
}

const s = StyleSheet.create({
  sky: { overflow: 'hidden' },
  star: { position: 'absolute', backgroundColor: '#FFF6D8' },
  action: { position: 'absolute', right: 16 },
  lead: { position: 'absolute', left: 16 },
  flame: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  num: { position: 'absolute', left: 16, bottom: 18, maxWidth: '58%' },
  eb: { fontFamily: font.bodySemi, fontSize: 13, lineHeight: 18 },
  n: { fontFamily: font.display, fontSize: 44, lineHeight: 48 },
  nRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  unit: { flexShrink: 1, fontFamily: font.display, fontSize: 17, lineHeight: 22, paddingBottom: 6 },
  lv: { position: 'absolute', right: 16, bottom: 18, alignItems: 'flex-end', gap: 1, maxWidth: '40%' },
  chip: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 4 },
  small: { flexShrink: 1, fontFamily: font.bodyMedium, fontSize: 13, lineHeight: 18 },
  lvT: { fontFamily: font.bodySemi, fontSize: 15, lineHeight: 20, textAlign: 'right' },
  bar: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 6 },
  /* under the sky, off the flame */
  low: { paddingHorizontal: 20, paddingTop: 14, gap: 2 },
  lowH: { fontFamily: font.display, fontSize: 20, lineHeight: 25 },
  lowW: { fontFamily: font.bodySemi, fontSize: 15, lineHeight: 20 },
  lowP: { fontFamily: font.bodyMedium, fontSize: 13, lineHeight: 18 },
  /* just over the level it belongs to, clear of the flame's face */
  grew: {
    position: 'absolute',
    right: 16,
    bottom: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
});
