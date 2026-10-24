/* Goodnight: the end of the evening, under the night sky. One big button low on the screen ("Tap this when you put your
   phone down") saves tonight's check-in and puts the phone away in one tap (core sayGoodnight), and then the going-to-bed
   moment plays: the light in a small house goes out, the moon comes up, the stars come in, and a few slow z's drift up.
   Above the button, folded rows keep the rest in reach without crowding it: the wind-down list, and the plan for a loud
   night (the one picked in SOS "Go to bed", or slow breathing) with a way into SOS. Used by the end of the check-in
   (app/checkin.tsx), the wind-down (app/wind.tsx) and Good night after SOS "Go to bed" (app/night.tsx). With Reduce
   Motion on, the moment is still: the light is out, the moon is up, and nothing moves. */
import { bedPlans, checkinAnswered, checkinSaveText, clockOf, fmtClock, gameCompute, sayGoodnight, windToggle, type CheckinForm } from '@daybook/core';
import { router } from 'expo-router';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Easing, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Defs, Ellipse, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { Appear } from '@/components/appear';
import { FitArt } from '@/components/fit';
import { Dock, SceneFrame } from '@/components/scene';
import { Text } from '@/components/text';
import { Button, Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { NATIVE, useReducedMotion } from '@/lib/motion';
import { close } from '@/lib/nav';
import { useStore } from '@/lib/store';
import { font, MAX_WIDTH, nightInk, useTheme } from '@/lib/theme';

/** what Goodnight did: the phone-away time, the points it earned, and the words after saving the check-in (none when there
    was nothing to save) */
export interface Bed {
  at: string;
  gain: number;
  msg: string;
}

/** Goodnight in one tap: saves the check-in when anything in it is answered, puts the phone away now, and says what it earned */
export function useGoodnight() {
  const { tk, update } = useStore();
  return (form: CheckinForm | null): Bed => {
    const at = clockOf(Date.now());
    let gain = 0;
    let msg = '';
    update((s0) => {
      if (!s0.settings) return s0;
      const b0 = gameCompute(s0.days, s0.settings, s0.reviews, tk).pts;
      const days = sayGoodnight(s0.days, tk, form, at, Date.now(), s0.settings);
      if (form && checkinAnswered(form)) msg = checkinSaveText(days, s0.settings, tk, tk);
      gain = Math.max(0, gameCompute(days, s0.settings, s0.reviews, tk).pts - b0);
      return { ...s0, days };
    });
    buzz('save');
    return { at, gain, msg };
  };
}

/** the big button: full width, at the very bottom, in the moon's color */
export function GoodnightButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Goodnight"
      accessibilityHint="Saves tonight and puts the phone away"
      onPress={onPress}
      style={({ pressed }) => [s.gn, { transform: [{ translateY: pressed ? 3 : 0 }], shadowOpacity: pressed ? 0 : 1 }]}>
      <Icon name="moon" size={24} color={MOON_INK} />
      <Text style={s.gnT}>Goodnight</Text>
    </Pressable>
  );
}

/** a row that opens in place: a title and one line, and what it holds under it once opened */
export function Fold({
  icon,
  title,
  sub,
  open,
  onToggle,
  children,
}: {
  icon: string;
  title: string;
  sub?: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <View style={s.fold}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={title + (sub ? '. ' + sub : '')}
        onPress={() => {
          buzz('tap');
          onToggle();
        }}
        style={({ pressed }) => [s.foldHead, pressed && { opacity: 0.75 }]}>
        <View style={s.foldIc}>
          <Icon name={icon} size={18} color={nightInk.ink} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <T v="label">{title}</T>
          {sub ? (
            <T v="small" tone="muted">
              {sub}
            </T>
          ) : null}
        </View>
        <View style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}>
          <Icon name="down" size={18} color={nightInk.muted} />
        </View>
      </Pressable>
      {open ? (
        <Appear by={6} duration={220} style={s.foldBody}>
          {children}
        </Appear>
      ) : null}
    </View>
  );
}

/** a row like a fold that opens another screen instead (today's check-in, from the wind-down) */
export function NightRow({ icon, title, sub, onPress }: { icon: string; title: string; sub?: string; onPress: () => void }) {
  return (
    <View style={s.fold}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title + (sub ? '. ' + sub : '')}
        onPress={() => {
          buzz('tap');
          onPress();
        }}
        style={({ pressed }) => [s.foldHead, pressed && { opacity: 0.75 }]}>
        <View style={s.foldIc}>
          <Icon name={icon} size={18} color={nightInk.ink} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <T v="label">{title}</T>
          {sub ? (
            <T v="small" tone="muted">
              {sub}
            </T>
          ) : null}
        </View>
        <Icon name="next" size={18} color={nightInk.muted} />
      </Pressable>
    </View>
  );
}

/** the wind-down list as a folded row: how many are done, and the list itself once opened */
export function WindFold({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const { snap, tk, update } = useStore();
  const st = snap.settings;
  if (!st || !st.wind.length) return null;
  const p = snap.days[tk]?.p;
  const n = st.wind.filter((_, i) => !!p && p.w.indexOf(i) >= 0).length;
  return (
    <Fold
      icon="check"
      title="Wind-down list"
      sub={n >= st.wind.length ? 'All ' + n + ' done' : n + ' of ' + st.wind.length + ' done'}
      open={open}
      onToggle={onToggle}>
      {st.wind.map((t, i) => (
        <WindItem
          key={i}
          label={t}
          on={!!p && p.w.indexOf(i) >= 0}
          onPress={() => {
            update((s0) => ({ ...s0, days: windToggle(s0.days, s0.settings!, tk, i) }));
            buzz('tap');
          }}
        />
      ))}
    </Fold>
  );
}

/** the plan for a loud night as a folded row: the picked one first (`plan`, from SOS "Go to bed"), then the others, and SOS */
export function LoudFold({ open, onToggle, plan }: { open: boolean; onToggle: () => void; plan?: string }) {
  const { snap } = useStore();
  const plans = bedPlans(snap.settings);
  return (
    <Fold icon="shield" title="If the thoughts get loud" sub={plan ? plan.split('. ')[0] : 'A plan for tonight, ready'} open={open} onToggle={onToggle}>
      {plan ? <T v="label">{plan}</T> : null}
      {plans
        .filter((p) => !plan || !plan.startsWith(p[1]))
        .map((p) => (
          <View key={p[0]} style={{ gap: 1 }}>
            <T v="label">{p[1]}</T>
            <T v="small" tone="muted">
              {p[2]}
            </T>
          </View>
        ))}
      <Button kind="ghost" icon="life" label="Urge right now? Open SOS" onPress={() => router.push('/sos')} />
    </Fold>
  );
}

/** one thing on the wind-down list, as a big card with a round check */
function WindItem({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  const c = useTheme();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: on }}
      onPress={onPress}
      style={({ pressed }) => [
        s.item,
        { backgroundColor: c.surface, borderColor: on ? c.mint : 'transparent', shadowColor: c.lip, transform: [{ translateY: pressed ? 2 : 0 }] },
      ]}>
      <View style={[s.box, { backgroundColor: on ? c.mint : 'transparent', borderColor: on ? c.mint : c.line }]}>
        {on ? <Icon name="check" size={16} color="#06352A" /> : null}
      </View>
      <Text style={[s.itemT, { color: c.ink }]}>{label}</Text>
    </Pressable>
  );
}

/** after Goodnight: the going-to-bed moment, then the words, the plan for a loud night, and Done */
export function GoingToBed({ bed, plan, extra }: { bed: Bed; plan?: string; extra?: ReactNode }) {
  const [loud, setLoud] = useState(false);
  return (
    <SceneFrame title="Good night" sky="night" onClose={close}>
      {/* the moment and its words fill the open middle; the plan and Done sit low, under the thumb */}
      <View style={s.mid}>
        <FitArt drop={0.45}>
          <BedArt />
        </FitArt>
        <Appear delay={WORDS} duration={600} by={6}>
          <T v="title" style={s.c} accessibilityRole="header">
            Phone down. Good night.
          </T>
        </Appear>
        <Appear delay={WORDS + 250} duration={600} by={6} style={{ alignItems: 'center', gap: 6 }}>
          <T style={s.c}>{bed.at ? `Phone away at ${fmtClock(bed.at)}. ` : ''}That counts. Rest well. Tomorrow is a fresh day.</T>
          {bed.msg ? (
            <T v="small" tone="muted" style={s.c}>
              {bed.msg}
            </T>
          ) : null}
          {bed.gain ? (
            <T v="label" style={[s.c, { color: '#8CF0CE' }]}>
              {'+' + bed.gain + ' points'}
            </T>
          ) : null}
        </Appear>
      </View>
      <Dock>
        <LoudFold open={loud} onToggle={() => setLoud(!loud)} plan={plan} />
        {extra}
        <Button label="Done" onPress={close} />
      </Dock>
    </SceneFrame>
  );
}

/* the going-to-bed moment, on one clock: the light goes out at about 0.8 s, the moon is up by 2.3 s, the stars come in
   after it, and the z's start once the house is dark. The words come in as the moon settles. */
const RUN = 2600;
const WORDS = 1500;
/* drawn on a 320 by 210 board, scaled to the width of the phone */
const W = 320;
const H = 210;
/* the window of the house, where the light goes out */
const WIN = { x: 223, y: 134, w: 12, h: 10 };
/* a few stars, placed by hand so the sky is the same every night: [x, y, size, how long one twinkle takes] */
const STARS: [number, number, number, number][] = [
  [16, 26, 3, 3400],
  [40, 104, 2, 4200],
  [150, 16, 3, 3800],
  [176, 70, 2, 3000],
  [214, 30, 4, 4600],
  [250, 84, 2, 3600],
  [278, 18, 3, 4400],
  [302, 62, 2, 3200],
  [128, 100, 2, 4000],
  [10, 140, 2, 3900],
];

/** the going-to-bed moment: a small house on a hill whose light goes out, the moon rising, stars and slow z's */
export function BedArt() {
  const reduce = useReducedMotion();
  const { width } = useWindowDimensions();
  /* as wide as the page allows (a 16 point gutter each side), never more than a little over its own size */
  const k = Math.max(0.8, Math.min(1.15, (Math.min(width, MAX_WIDTH) - 32) / W));
  const v = useRef(new Animated.Value(reduce ? 1 : 0)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const zz = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduce) {
      v.setValue(1);
      return;
    }
    v.setValue(0);
    const run = Animated.timing(v, { toValue: 1, duration: RUN, easing: Easing.inOut(Easing.cubic), useNativeDriver: NATIVE });
    const breathe = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 3200, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
        Animated.timing(glow, { toValue: 0, duration: 3200, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
      ]),
    );
    const drift = Animated.loop(Animated.timing(zz, { toValue: 1, duration: 4800, easing: Easing.linear, useNativeDriver: NATIVE }));
    run.start();
    breathe.start();
    drift.start();
    return () => {
      run.stop();
      breathe.stop();
      drift.stop();
    };
  }, [reduce, v, glow, zz]);
  const light = v.interpolate({ inputRange: [0, 0.26, 0.4, 1], outputRange: [1, 1, 0.05, 0.05] });
  const moonIn = v.interpolate({ inputRange: [0, 0.3, 0.88, 1], outputRange: [0, 0, 1, 1] });
  return (
    <View style={{ width: W * k, height: H * k }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={[s.art, { left: (W * k - W) / 2, top: (H * k - H) / 2, transform: [{ scale: k }] }]}>
        {STARS.map(([x, y, r, ms], i) => (
          <Star
            key={i}
            x={x}
            y={y}
            r={r}
            ms={ms}
            delay={i * 370}
            still={reduce}
            come={v.interpolate({ inputRange: [0, 0.5 + i * 0.04, 0.62 + i * 0.04, 1], outputRange: [0, 0, 1, 1] })}
          />
        ))}
        {/* the moon comes up from behind the hill, its glow breathing slowly */}
        <Animated.View style={[s.moonAt, { opacity: moonIn, transform: [{ translateY: moonIn.interpolate({ inputRange: [0, 1], outputRange: [56, 0] }) }] }]}>
          <Animated.View
            style={[
              s.halo,
              {
                opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.6] }),
                transform: [{ scale: glow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) }],
              },
            ]}
          />
          <View style={s.moon}>
            <Icon name="moon" size={46} color="#FFE27A" />
          </View>
        </Animated.View>
        {/* two soft hills that fade into the sky at the bottom, with no edge, and the house on the far one */}
        <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id="bedHill" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#2A2272" stopOpacity={1} />
              <Stop offset="1" stopColor="#2A2272" stopOpacity={0} />
            </LinearGradient>
            <LinearGradient id="bedNear" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#1A1450" stopOpacity={1} />
              <Stop offset="1" stopColor="#1A1450" stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Path d="M0 210C50 168 120 148 185 150S290 168 320 210Z" fill="url(#bedHill)" />
          <Ellipse cx={231} cy={158} rx={30} ry={5} fill="#2A2272" />
          {/* the house: a roof, the walls, a door, and the window (lit by the light above it) */}
          <Path d="M207 130L231 109L255 130Z" fill="#433A9E" />
          <Rect x={212} y={128} width={38} height={30} fill="#332B85" />
          <Rect x={WIN.x} y={WIN.y} width={WIN.w} height={WIN.h} rx={2} fill="#1A1550" />
          <Rect x={239} y={143} width={7} height={15} rx={1.5} fill="#1A1550" />
          <Path d="M40 210C100 184 170 176 230 184S300 198 320 210Z" fill="url(#bedNear)" />
        </Svg>
        {/* the light in the window, and its warm glow, going out */}
        <Animated.View style={[s.spill, s.spillWide, { opacity: light }]} />
        <Animated.View style={[s.spill, { opacity: light }]} />
        <Animated.View style={[s.win, { opacity: light }]} />
        <Zs t={zz} come={v.interpolate({ inputRange: [0, 0.45, 0.62, 1], outputRange: [0, 0, 1, 1] })} still={reduce} />
      </View>
    </View>
  );
}

/* three small z's, one after another, drifting up from the roof and fading. With Reduce Motion on they rest in place. */
function Zs({ t, come, still }: { t: Animated.Value; come: Animated.AnimatedInterpolation<number>; still: boolean }) {
  return (
    <Animated.View style={[s.zs, { opacity: come }]}>
      {[0, 1, 2].map((i) => {
        const size = 13 + i * 3;
        if (still)
          return (
            <Text key={i} style={[s.z, { fontSize: size, left: 8 + i * 9, top: 30 - i * 14, opacity: 0.75 - i * 0.15 }]}>
              z
            </Text>
          );
        const p = Animated.modulo(Animated.add(t, i / 3), 1);
        return (
          <Animated.Text
            key={i}
            style={[
              s.z,
              {
                fontSize: size,
                left: i * 5,
                opacity: p.interpolate({ inputRange: [0, 0.15, 0.7, 1], outputRange: [0, 0.85, 0.5, 0] }),
                transform: [
                  { translateY: p.interpolate({ inputRange: [0, 1], outputRange: [36, -8] }) },
                  { translateX: p.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 10, 16] }) },
                ],
              },
            ]}>
            z
          </Animated.Text>
        );
      })}
    </Animated.View>
  );
}

function Star({
  x,
  y,
  r,
  ms,
  delay,
  still,
  come,
}: {
  x: number;
  y: number;
  r: number;
  ms: number;
  delay: number;
  still: boolean;
  come: Animated.AnimatedInterpolation<number>;
}) {
  const v = useRef(new Animated.Value(0.8)).current;
  useEffect(() => {
    if (still) return v.setValue(0.8);
    const a = Animated.loop(
      Animated.sequence([
        Animated.delay(delay % 1600),
        Animated.timing(v, { toValue: 1, duration: ms / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
        Animated.timing(v, { toValue: 0.35, duration: ms / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
      ]),
    );
    a.start();
    return () => a.stop();
  }, [still, v, ms, delay]);
  return <Animated.View style={[s.star, { left: x, top: y, width: r, height: r, borderRadius: r / 2, opacity: Animated.multiply(v, come) }]} />;
}

const MOON_INK = '#1A1250';
const s = StyleSheet.create({
  c: { textAlign: 'center' },
  mid: { flexGrow: 1, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', gap: 14 },
  gn: {
    alignSelf: 'stretch',
    minHeight: 68,
    borderRadius: 24,
    backgroundColor: '#FFE27A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#0B0828',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 0,
    elevation: 3,
  },
  gnT: { fontFamily: font.display, fontSize: 23, color: MOON_INK },
  fold: { alignSelf: 'stretch', borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.10)', overflow: 'hidden' },
  foldHead: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, paddingHorizontal: 14, paddingVertical: 8 },
  foldIc: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.12)' },
  foldBody: { gap: 10, paddingHorizontal: 14, paddingBottom: 14 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 2,
    shadowOpacity: 1,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 3 },
  },
  box: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  itemT: { flex: 1, fontFamily: font.bodySemi, fontSize: 15.5, lineHeight: 20 },
  art: { position: 'absolute', width: W, height: H },
  star: { position: 'absolute', backgroundColor: '#FFF6D8' },
  moonAt: { position: 'absolute', left: 36, top: 14, width: 120, height: 120, alignItems: 'center', justifyContent: 'center' },
  halo: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,226,122,0.16)' },
  moon: { width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.10)' },
  win: { position: 'absolute', left: WIN.x, top: WIN.y, width: WIN.w, height: WIN.h, borderRadius: 2, backgroundColor: '#FFD66B' },
  /* a soft glow without a blur: two faint circles around the window */
  spill: {
    position: 'absolute',
    left: WIN.x + WIN.w / 2 - 15,
    top: WIN.y + WIN.h / 2 - 15,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,214,107,0.13)',
  },
  spillWide: { left: WIN.x + WIN.w / 2 - 26, top: WIN.y + WIN.h / 2 - 26, width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,214,107,0.06)' },
  zs: { position: 'absolute', left: 250, top: 62, width: 60, height: 60 },
  z: { position: 'absolute', left: 0, top: 0, fontFamily: font.display, color: '#CFC8F2' },
});
