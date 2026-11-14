/* The top of Today: your flame in its own sky (core: emblemScene), from edge to edge and under the clock, with stars at night
   and its own hills carried on across the page. Nothing is written over the flame (the owner, November 1, 2026): your one number
   sits low on the left (core: heroNumber), your level on the right with one proof line under it
   (core heroProof: "4 urges ridden out", picked fresh each day; the owner, November 11, 2026: proof, not points, in the hero;
   the points and the bar are on the level page, one tap on the level). The flame is the biggest thing on the screen (lib/today-size.ts; CLAUDE.md, "The flame is the heart of the app"). The one next step hangs right
   under it (core pickMoment, moment-card.tsx), so what you do and what it grows are one picture. The flame moves in a way that
   fits its form and the stars twinkle (both still under Reduce Motion). Tap the flame and a slow bloom of light goes through it
   and it says hi; tap the sky for Milestones; the level for your level and points; the number for your days. When points come in while
   the app is open (a lesson, a check-in, an urge ridden out), the flame grows in front of you:
   back on Today, the flame blooms once, and a quiet word says so (after any celebration that came with it).
   Under the number, the hours since a slip, for 72 hours after one (the owner, October 30, 2026), or a best or the way to graduation.
   When the person stops doing their part the fire burns lower (core flame-low.ts, the owner, November 8, 2026): the first time Today is seen that
   day it burns fully and then goes down, as if water were poured on it, with a few fading ticks, and one firm line at the top of the sky says so.
   When they do something again and come back to Today, it is lit again in front of them: the heart catches, the fire climbs back with three
   rising knocks, sparks fly, and a quiet word says so. Only the glow changes; the level and the number stay as they are. */
import {
  CHEERS,
  emblemScene,
  fireLow,
  heroNumber,
  effortCounts,
  heroProof,
  LOW_OF,
  lowWarn,
  FED,
  lastNights,
  truthOn,
  lowWords,
  pullDrift,
  RELIT,
  type GameState,
  type Snapshot,
  finishLine,
  PHASE_SKY,
  skyPhase,
  figHead,
  heroFit,
  HERO_WORDS_MAX,
  wordsInk,
  type SkyPhase,
} from '@daybook/core';
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
import { NightMarks } from '@/components/night-marks';
import { Icon } from '@/components/ui';
import { buzz, knock } from '@/lib/feel';
import { pullIgnoredAt, pullNights } from '@/lib/pull';
import { NATIVE, useReducedMotion } from '@/lib/motion';
import { useStore } from '@/lib/store';
import { font, useTheme } from '@/lib/theme';
import { SKY_TRIM_MAX } from '@/lib/today-size';

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
  trim = 0,
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
  /** how much of the empty sky over the flame a long day's list asks for (lib/today-size.ts skyTrim); capped here */
  trim?: number;
  /** the date, said by a screen reader */
  title: string;
  /** a small button at the top right */
  action?: React.ReactNode;
  /** a small button at the top left */
  lead?: React.ReactNode;
}) {
  return <Sky g={g} snap={snap} tk={tk} now={now} height={sky} flame={flame} trim={trim} title={title} action={action} lead={lead} />;
}

/** the colors of the words on the sky at this level. With the hour's sky (`phase`, WP5: the sky follows the clock), the words on a form
    with no hills of its own take the sky's ink; on hills they keep the hills' ink. */
export function skyInk(level: number, phase?: SkyPhase) {
  const sc = emblemScene(level);
  const light = phase && !sc.land ? PHASE_SKY[phase].light : sc.ink === 'light';
  return {
    light,
    ink: light ? '#FFFFFF' : '#14112E',
    /* on green hills the small words take the full ink, so they still read */
    soft: light ? '#DCD3FF' : sc.land ? '#14112E' : '#3D3670',
    glass: light ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.62)',
  };
}

/** the words under the sky while the fire burns low, or the day before it does */
function LowLines({ w, ink, warm, tell }: { w: { h: string; p: string; fix: string }; ink: string; warm: string; tell?: boolean }) {
  const body = (
    <>
      <Text style={[s.lowH, { color: ink }]}>{w.h}</Text>
      <Text style={[s.lowP, { color: ink }]}>
        {w.p} <Text style={{ color: warm }}>{w.fix}</Text>
      </Text>
    </>
  );
  /* last night not told (core truth.ts): the way to light it again is one tap away, the morning's own question */
  if (tell)
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${w.h}. ${w.p} ${w.fix}`}
        onPress={() => {
          buzz('tap');
          router.push('/morning');
        }}
        style={({ pressed }) => [s.low, pressed && { opacity: 0.75 }]}>
        {body}
      </Pressable>
    );
  return (
    <View style={s.low} accessible accessibilityLabel={`${w.h}. ${w.p} ${w.fix}`}>
      {body}
    </View>
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

function Sky({
  g,
  snap,
  tk,
  now,
  height,
  flame,
  trim,
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
  trim: number;
  title: string;
  action?: React.ReactNode;
  lead?: React.ReactNode;
}) {
  const c = useTheme();
  const { say } = useStore();
  const reduce = useReducedMotion();
  const lvl = g.level;
  /* one proof line under the level, picked fresh each day (core heroProof) */
  const proof = useMemo(
    () => (snap.settings ? heroProof(snap.days, snap.settings, snap.reviews, tk, effortCounts(snap.days, tk, pullNights())) : null),
    [snap, tk],
  );
  /* the sky follows the clock (D3, core two-moments.ts skyPhase): dawn, day, dusk, night. The flame's form carries the level. */
  const phase = snap.settings ? skyPhase(snap.days, snap.settings, tk, now) : null;
  const sc = useMemo(() => {
    const own = emblemScene(lvl.n);
    return phase ? { ...own, sky: PHASE_SKY[phase].sky, stars: PHASE_SKY[phase].stars } : own;
  }, [lvl.n, phase]);
  /* the finish line, once a clean week is behind the person (WP5, from docs/big-ideas.md idea 11) */
  const finish = snap.settings ? finishLine(snap.days, snap.settings, tk) : null;
  const inset = useSafeAreaInsets();
  const FLAME = flame;
  /* the drawing stands on the hills along the bottom, and the sky above it carries on up to the clock. The tall, narrow forms stand
     lower, between the number and the level, so their faces sit low too (the owner, November 1, 2026). The words along the bottom
     decide how low: the flame and its hills rise until the hills are clear above the taller block of words, so the words are never
     half on the sky (core hero-room.ts, where a test holds it for every form and phone; the owner, November 14, 2026) */
  const h = heroNumber(snap.days, snap.settings!, tk, now);
  const marksOn = !!snap.settings && truthOn(snap.settings, tk);
  /* the words' height before they are measured: the label or the marks, the number, and the line under it */
  const [numH, setNumH] = useState(0);
  const [lvH, setLvH] = useState(50);
  const wordsH = Math.min(HERO_WORDS_MAX * 1.5, Math.max(numH || (h ? (marksOn ? 24 : 18) + 48 + (h.chip ? 18 : 0) : 0), lvH));
  const fit = heroFit({ sky: height, flame: FLAME, level: lvl.n, words: wordsH, top: inset.top });
  /* the sky grows a little only where a tall form on a short sky needs it (core heroFit) */
  const SCENE_H = fit.sky;
  const FLAME_TOP = fit.top;
  /* a long list takes a little of the sky, from the top only: the whole scene is drawn at its full height and slides up under the
     clock, so the flame keeps its size and its place on the hills. Never more than SKY_TRIM_MAX of the sky, and never so much that
     the tip of the fire goes under the clock (core figHead: the empty room over this form's fire) */
  const cut = Math.round(Math.max(0, Math.min(trim, SCENE_H * SKY_TRIM_MAX, FLAME_TOP + FLAME * figHead(lvl.n) - inset.top - 6)));
  const cutA = useRef(new Animated.Value(cut)).current;
  useEffect(() => {
    if (reduce) return cutA.setValue(cut);
    const a = Animated.timing(cutA, { toValue: cut, duration: 520, easing: Easing.inOut(Easing.cubic), useNativeDriver: false });
    a.start();
    return () => a.stop();
  }, [cut, cutA, reduce]);
  const { light, glass } = skyInk(lvl.n, phase ?? undefined);
  /* the words along the bottom take the ink that reads on what is behind them, hills or the bottom of the hour's sky (core wordsInk,
     where a test holds the contrast for every form and hour) */
  const { ink, soft, light: wordsLight } = wordsInk(lvl.n, phase);
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
  /* the flame grows in front of you: points came in since it was last seen here, so once any celebration that came with it
     is closed, the flame blooms and a quiet word says so (the points and the bar live on the level page) */
  const seen = useRef({ pts: g.pts });
  const busy = useCelebrating();
  const [due, setDue] = useState(false);
  const dueRef = useRef(false);
  const [grew, setGrew] = useState(false);
  useFocusEffect(
    useCallback(() => {
      const was = seen.current;
      seen.current = { pts: g.pts };
      if (g.pts > was.pts && !dueRef.current) {
        dueRef.current = true;
        setDue(true);
      }
    }, [g.pts]),
  );
  useEffect(() => {
    if (!due || busy) return;
    dueRef.current = false;
    setDue(false);
    setPulse((p) => p + 1);
    setGrew(true);
    AccessibilityInfo.announceForAccessibility('Your flame grew.');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [due, busy]);
  useEffect(() => {
    if (!grew) return;
    const t = setTimeout(() => setGrew(false), 2800);
    return () => clearTimeout(t);
  }, [grew]);
  /* the fire burning low, and lit again */
  /* the hard hours' notes ignored (Screen Time, on this phone only) burn it one step lower too (core pullDrift) */
  const fl = useMemo(
    () => pullDrift(fireLow(snap.days, snap.settings, tk, now), pullIgnoredAt(), snap.days, snap.settings, tk, now),
    [snap.days, snap.settings, tk, now],
  );
  const words = lowWords(fl);
  const focused = useIsFocused();
  /* what the fire shows: it goes lower at once, but it is lit again only where the person sees it */
  /* lit again, or grown from lower (core flame-low.ts: under the true record one feed lifts a low fire part of the way) */
  const [shown, setShown] = useState(() => (fl.step < fl.was && relitOn !== tk ? LOW_OF[fl.was] : fl.low));
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
      AccessibilityInfo.announceForAccessibility((fl.step === 0 ? RELIT : FED) + '.');
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
  }, [fl.low, fl.step, shown, focused, busy, reduce, tk]);
  useEffect(() => {
    if (!relit) return;
    const t = setTimeout(() => setRelit(false), 3400);
    return () => clearTimeout(t);
  }, [relit]);
  return (
    <>
      <Animated.View style={[s.sky, { height: Animated.subtract(SCENE_H, cutA) }]}>
        <Animated.View style={[s.scene, { height: SCENE_H, transform: [{ translateY: Animated.multiply(cutA, -1) }] }]} pointerEvents="box-none">
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
        </Animated.View>
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
            onPress={() => {
              buzz('tap');
              router.navigate({ pathname: '/pattern', params: { pane: 'days' } });
            }}
            onLayout={(e) => setNumH(Math.ceil(e.nativeEvent.layout.height))}
            style={({ pressed }) => [s.num, pressed && { opacity: 0.8 }]}>
            {/* with the week's marks shown, the label sits beside them under the number, so the block stays low on the hills and the
                label is never cut by the hills' edge (the owner, November 13, 2026: "quitting gets cutoff here") */}
            {marksOn ? null : (
              <Text maxFontSizeMultiplier={ON_ART} style={[s.eb, { color: soft }]}>
                {h.eb}
              </Text>
            )}
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
            {/* the last seven nights, one mark each (core truth.ts): the count above is made of these */}
            {marksOn ? (
              <View style={s.marks}>
                <NightMarks marks={lastNights(snap.days, snap.settings!, tk)} size={9} gap={4} ink={soft} dark edge={wordsLight ? undefined : ink} />
                <Text maxFontSizeMultiplier={ON_ART} numberOfLines={1} style={[s.eb, s.ebMarks, { color: soft }]}>
                  {h.eb}
                </Text>
              </View>
            ) : null}
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
          accessibilityLabel={`Level ${lvl.n}, ${lvl.name}.${proof ? ' ' + proof + '.' : ''} Opens your level and points.`}
          onPress={() => {
            buzz('tap');
            router.push('/points');
          }}
          onLayout={(e) => setLvH(Math.ceil(e.nativeEvent.layout.height))}
          style={({ pressed }) => [s.lv, pressed && { opacity: 0.8 }]}>
          <Text maxFontSizeMultiplier={ON_ART} style={[s.lvT, { color: ink }]}>
            Level {lvl.n} · {lvl.name} ›
          </Text>
          {/* who the person is, from the record (core heroProof), not a score: points and the bar live on the level page */}
          {proof ? (
            <Text maxFontSizeMultiplier={ON_ART} style={[s.small, { color: soft, textAlign: 'right' }]}>
              {proof}
            </Text>
          ) : null}
          {/* the way to graduation is said once: under the number when it is the number's own line (core heroNumber's chip) */}
          {finish && finish !== h?.chip ? (
            <Text maxFontSizeMultiplier={ON_ART} style={[s.small, { color: soft, textAlign: 'right' }]}>
              {finish}
            </Text>
          ) : null}
        </Pressable>
        {relit ? (
          <View style={[s.grew, { backgroundColor: glass, bottom: 18 + lvH + 8 }]} pointerEvents="none">
            <Icon name="flame" size={13} color={ink} />
            <Text maxFontSizeMultiplier={ON_ART} style={[s.small, { color: ink }]}>
              {fl.step === 0 ? RELIT : FED}
            </Text>
          </View>
        ) : grew ? (
          <View style={[s.grew, { backgroundColor: glass, bottom: 18 + lvH + 8 }]} pointerEvents="none">
            <Icon name="star" size={13} color={ink} />
            <Text maxFontSizeMultiplier={ON_ART} style={[s.small, { color: ink }]}>
              Your flame grew
            </Text>
          </View>
        ) : null}
      </Animated.View>
      {/* burning low: one firm line under the sky, clear of the flame, read before the next step */}
      {words || (fl.warn && !relit) ? (
        /* big and few: what is happening, then what it cost, and in the one warm color the way to light it again */
        <LowLines w={words ?? lowWarn(fl)} ink={c.ink} warm={c.sunText} tell={!!fl.tell} />
      ) : null}
    </>
  );
}

const s = StyleSheet.create({
  sky: { overflow: 'hidden' },
  /* the scene at its full height, slid up under the clock by a long list's trim */
  scene: { position: 'absolute', left: 0, right: 0, top: 0 },
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
  marks: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', marginTop: 4, marginBottom: 2 },
  ebMarks: { flexShrink: 1 },
  small: { flexShrink: 1, fontFamily: font.bodyMedium, fontSize: 13, lineHeight: 18 },
  lvT: { fontFamily: font.bodySemi, fontSize: 15, lineHeight: 20, textAlign: 'right' },
  /* under the sky, off the flame */
  low: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 4, gap: 4 },
  lowH: { fontFamily: font.display, fontSize: 28, lineHeight: 33 },
  lowP: { fontFamily: font.bodySemi, fontSize: 17, lineHeight: 23 },
  /* just over the level it belongs to, clear of the flame's face: its bottom is set from the level block's height, which grows with the
     finish line and with larger text */
  grew: {
    position: 'absolute',
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
});
