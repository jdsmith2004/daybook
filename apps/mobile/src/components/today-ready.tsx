/* PROTOTYPE (mockups only, not for merge): three looks for "Ready when it comes", each with who I am becoming on top. ?dir=b1|b2|b3 on the web. */
import { riskWindow, type Snapshot } from '@daybook/core';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { Shape, SQUIGGLE, squigglePath } from '@/components/shapes';
import { Text } from '@/components/text';
import { weekLine, weekOf, WeekFlames } from '@/components/today-more';
import { Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { font, nightInk, useTheme } from '@/lib/theme';

const sos = () => {
  buzz('tap');
  router.push('/sos');
};
const practice = () => {
  buzz('tap');
  router.push({ pathname: '/sos', params: { practice: '1' } });
};
const lower = (t: string) => t.charAt(0).toLowerCase() + t.slice(1);

/** the round SOS, as on the tab bar: the one round red thing, with its lip */
function RoundSos({ size = 66 }: { size?: number }) {
  const c = useTheme();
  return (
    <View style={[s.round, { width: size, height: size, borderRadius: size / 2, backgroundColor: c.sosLow, shadowColor: c.sosDeep }]}>
      <LinearGradient colors={[c.sos, c.sosLow]} style={[StyleSheet.absoluteFill, { borderRadius: size / 2 }]} />
      <Text style={[s.roundT, { color: c.sosInk, fontSize: size / 3 }]}>SOS</Text>
    </View>
  );
}

function Week({ snap, tk, level }: { snap: Snapshot; tk: string; level: number }) {
  const wl = weekLine(snap, tk);
  return (
    <View style={s.sec}>
      <T v="h2">This week</T>
      <WeekFlames snap={snap} tk={tk} level={level} />
      <T tone="muted">
        {wl.clean} days with no slip, and {wl.rode} {wl.rode === 1 ? 'urge' : 'urges'} ridden out.
      </T>
    </View>
  );
}

function SosRow({ sub }: { sub: string }) {
  return (
    <Pressable onPress={sos} accessibilityRole="button" accessibilityLabel="Open SOS" style={({ pressed }) => [s.sosRow, pressed && { opacity: 0.8 }]}>
      <RoundSos />
      <View style={{ flex: 1, gap: 2 }}>
        <T v="label">Open SOS</T>
        <T v="small" tone="muted">
          {sub}
        </T>
      </View>
    </Pressable>
  );
}

function PracticeLink({ color }: { color: string }) {
  return (
    <Pressable onPress={practice} accessibilityRole="button" hitSlop={10} style={({ pressed }) => [{ alignSelf: 'flex-start' }, pressed && { opacity: 0.6 }]}>
      <Text style={[s.link, { color }]}>Calm right now? Practice once</Text>
    </Pressable>
  );
}

/* 1: words first. No card: the sentence, the plan as words, the round SOS. */
function Words({ snap, tk, level }: { snap: Snapshot; tk: string; level: number }) {
  const c = useTheme();
  const st = snap.settings!;
  const win = riskWindow(snap.days, st, tk);
  const [first, ...rest] = (st.menu || []).slice(0, 3);
  return (
    <View style={s.more}>
      <View style={{ gap: 8 }}>
        <Text style={[s.quoteBig, { color: c.ink }]}>{st.becoming}</Text>
        {st.reasons?.[0] ? <T tone="muted">For {lower(st.reasons[0])}.</T> : null}
      </View>
      <View style={{ gap: 12 }}>
        <T v="label" tone="muted">
          When an urge comes
        </T>
        <Text style={[s.quote, { color: c.ink }]}>{first}.</Text>
        {rest.length ? <T tone="muted">Or {rest.map(lower).join(', or ')}.</T> : null}
        <SosRow sub={win ? 'Yours come most often ' + win.label + '.' : 'It starts on the first tap.'} />
        <PracticeLink color={c.accentText} />
      </View>
      <Week snap={snap} tk={tk} level={level} />
    </View>
  );
}

/* 2: tonight's sky. One scene: the sentence in the evening sky, the evening itself as the horizon (6 PM at the left, 2 AM at the
   right) with the hard hours glowing on that stretch of the hill and now on the ridge, and the plan on the ground under it. Then
   the week, as the squiggle (progress), one mark a day, and the line never breaks. */
const FROM = 18;
const SPAN = 8;
const GROUND = '#1C1652';
const SKY_H = 120;
/** the ridge's height at x (0 to 1), in points from the top of the horizon drawing */
const ridge = (x: number) => 104 - 12 * Math.sin(Math.PI * x) - 4 * Math.sin(3 * Math.PI * x + 0.6);
function Horizon({ w, start, nowAt }: { w: number; start: number | null; nowAt: number }) {
  const pts: string[] = [];
  for (let i = 0; i <= 48; i++) pts.push((i ? 'L' : 'M') + ((i / 48) * w).toFixed(1) + ' ' + ridge(i / 48).toFixed(1));
  const ground = pts.join(' ') + ` L ${w} ${SKY_H} L 0 ${SKY_H} Z`;
  const a = start == null ? 0 : ((start - FROM + 24) % 24) / SPAN;
  const b = a + 2 / SPAN;
  const seg: string[] = [];
  for (let i = 0; i <= 12; i++) {
    const x = a + ((b - a) * i) / 12;
    seg.push((i ? 'L' : 'M') + (x * w).toFixed(1) + ' ' + ridge(x).toFixed(1));
  }
  const gx = ((a + b) / 2) * w;
  const now = Math.max(0, Math.min(1, nowAt));
  return (
    <Svg width={w} height={SKY_H}>
      <Defs>
        <RadialGradient id="hglow" cx={gx} cy={ridge((a + b) / 2)} rx={w * 0.26} ry={84} gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#FFC85A" stopOpacity={0.7} />
          <Stop offset="0.55" stopColor="#FFC85A" stopOpacity={0.18} />
          <Stop offset="1" stopColor="#FFC85A" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      {[
        [0.08, 18],
        [0.27, 40],
        [0.55, 12],
        [0.71, 34],
        [0.88, 16],
        [0.95, 46],
      ].map(([x, y], i) => (
        <Circle key={i} cx={x * w} cy={y} r={i % 2 ? 1.2 : 1.6} fill="#FFFFFF" opacity={0.7} />
      ))}
      {start != null ? <Rect x={0} y={0} width={w} height={SKY_H} fill="url(#hglow)" /> : null}
      <Path d={ground} fill={GROUND} />
      {start != null ? <Path d={seg.join(' ')} stroke="#FFC85A" strokeWidth={5} strokeLinecap="round" fill="none" /> : null}
      <Circle cx={now * w} cy={ridge(now)} r={6} fill="#FFFFFF" stroke="#FF8A3D" strokeWidth={3} />
    </Svg>
  );
}

function WeekLine({ snap, tk }: { snap: Snapshot; tk: string }) {
  const c = useTheme();
  const [w, setW] = useState(0);
  const days = weekOf(snap, tk);
  const wl = weekLine(snap, tk);
  const step = w / 7;
  const y = 22;
  const xs = days.map((_, i) => step * i + step / 2);
  const words = ['No days', 'One day', 'Two days', 'Three days', 'Four days', 'Five days', 'Six days', 'Seven days'][wl.clean];
  return (
    <View style={{ gap: 16 }}>
      <View style={{ gap: 4 }}>
        <Text style={[s.weekH, { color: c.ink }]}>{words} with no slip this week.</Text>
        <T tone="muted">{wl.rode ? (wl.rode === 1 ? 'And one urge ridden out.' : 'And ' + wl.rode + ' urges ridden out.') : 'Every one of them counts.'}</T>
      </View>
      <View onLayout={(e) => setW(e.nativeEvent.layout.width)} style={{ height: 64 }}>
        {w ? (
          <Svg width={w} height={44}>
            <Path
              d={squigglePath(
                [
                  [xs[0], y],
                  [xs[6], y],
                ],
                0,
                xs[6] - xs[0],
                SQUIGGLE.amp,
                SQUIGGLE.wavelength,
              )}
              stroke={c.sun2}
              strokeWidth={SQUIGGLE.stroke}
              strokeLinecap="round"
              fill="none"
            />
            {days.map((d, i) =>
              d.st === 'slip' ? (
                <Circle key={d.k} cx={xs[i]} cy={y} r={8} fill={c.bg} stroke={c.slip} strokeWidth={3} />
              ) : d.st === 'clean' ? (
                <Circle key={d.k} cx={xs[i]} cy={y} r={d.today ? 13 : 9} fill={d.today ? c.sun : c.sun2} stroke={c.bg} strokeWidth={3} />
              ) : (
                <Circle key={d.k} cx={xs[i]} cy={y} r={6} fill={c.bg} stroke={c.line} strokeWidth={2} />
              ),
            )}
          </Svg>
        ) : null}
        <View style={s.wdays}>
          {days.map((d) => (
            <Text key={d.k} style={[s.wday, { color: d.today ? c.ink : c.muted }]}>
              {d.today ? 'Today' : d.d}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}

function Tonight({ snap, tk }: { snap: Snapshot; tk: string; level: number }) {
  const st = snap.settings!;
  const win = riskWindow(snap.days, st, tk);
  const moves = (st.menu || []).slice(0, 3);
  const [w, setW] = useState(0);
  const d = new Date();
  const nowAt = ((d.getHours() + d.getMinutes() / 60 - FROM + 24) % 24) / SPAN;
  const a = win ? ((win.start - FROM + 24) % 24) / SPAN : 0;
  const inIt = win && nowAt >= a && nowAt < a + 2 / SPAN;
  return (
    <View style={s.more}>
      <View style={s.scene}>
        <View>
          <LinearGradient colors={['#0E1238', '#1F2160', '#7A3F6E', '#E0785E']} locations={[0, 0.45, 0.8, 1]} style={StyleSheet.absoluteFill} />
          <View style={{ gap: 6, paddingHorizontal: 20, paddingTop: 24 }}>
            <Text style={[s.quote, { color: nightInk.ink }]}>{st.becoming}</Text>
            {st.reasons?.[0] ? <Text style={[s.p, { color: nightInk.muted }]}>For {lower(st.reasons[0])}.</Text> : null}
          </View>
          <View onLayout={(e) => setW(e.nativeEvent.layout.width)} style={{ height: SKY_H, marginTop: 8 }}>
            {w ? <Horizon w={w} start={win ? win.start : null} nowAt={nowAt} /> : null}
          </View>
        </View>
        <View style={{ backgroundColor: GROUND, paddingHorizontal: 20, paddingBottom: 20, marginTop: -1 }}>
          <View style={s.clock}>
            <Text style={[s.tick, { color: nightInk.muted }]}>6 PM</Text>
            <Text style={[s.tick, { color: nightInk.muted }]}>2 AM</Text>
            {win && w ? <Text style={[s.tick, s.hardT, { left: (a + 1 / SPAN) * w - 20 - 80 }]}>{inIt ? 'Hard hours, now' : win.label}</Text> : null}
          </View>
          <View style={s.planHead}>
            <Text style={[s.planH, { color: nightInk.ink }]}>When an urge comes</Text>
            <Pressable onPress={sos} accessibilityRole="button" accessibilityLabel="Open SOS" style={({ pressed }) => pressed && { opacity: 0.8 }}>
              <RoundSos size={58} />
            </Pressable>
          </View>
          {moves.map((m, i) => (
            <Text key={m} style={[s.planMove, { color: nightInk.ink, borderTopColor: 'rgba(255,255,255,0.12)', borderTopWidth: i ? 1 : 0 }]}>
              {m}
            </Text>
          ))}
          <Pressable
            onPress={practice}
            accessibilityRole="button"
            hitSlop={10}
            style={({ pressed }) => [{ alignSelf: 'flex-start', marginTop: 12 }, pressed && { opacity: 0.6 }]}>
            <Text style={[s.link, { color: '#FFD98A' }]}>Calm right now? Practice it once</Text>
          </Pressable>
        </View>
      </View>
      <WeekLine snap={snap} tk={tk} />
    </View>
  );
}

/* 3: the moves as shapes. Each move is a shape you can touch, and any of them starts SOS. */
const iconOf = (m: string) =>
  /walk|run|move|outside/i.test(m)
    ? 'wind'
    : /water|shower|cold|wash/i.test(m)
      ? 'wave'
      : /text|call|friend|talk/i.test(m)
        ? 'chat'
        : /push|squat|exercise|lift/i.test(m)
          ? 'bolt'
          : /breath/i.test(m)
            ? 'leaf'
            : 'sparkle';
function Shapes({ snap, tk, level }: { snap: Snapshot; tk: string; level: number }) {
  const c = useTheme();
  const st = snap.settings!;
  const win = riskWindow(snap.days, st, tk);
  const moves = (st.menu || []).slice(0, 3);
  const look: { kind: 'cookie9' | 'clover4' | 'flower'; soft: string; ink: string; turn: number }[] = [
    { kind: 'cookie9', soft: c.sunSoft, ink: c.sun, turn: 0 },
    { kind: 'clover4', soft: c.mintSoft, ink: c.mint, turn: 0.12 },
    { kind: 'flower', soft: c.skySoft, ink: c.skyText, turn: 0 },
  ];
  return (
    <View style={s.more}>
      <View style={{ gap: 8 }}>
        <Text style={[s.quote, { color: c.ink }]}>{st.becoming}</Text>
        {st.reasons?.[0] ? <T tone="muted">For {lower(st.reasons[0])}.</T> : null}
      </View>
      <View style={{ gap: 16 }}>
        <View style={{ gap: 2 }}>
          <T v="h2">When an urge comes</T>
          {win ? <T tone="muted">Yours come most often {win.label}.</T> : null}
        </View>
        <View style={s.shapes}>
          {moves.map((m, i) => (
            <Pressable key={m} onPress={sos} accessibilityRole="button" style={({ pressed }) => [s.shapeCol, pressed && { opacity: 0.7 }]}>
              <Shape kind={look[i].kind} size={96} color={look[i].soft} turn={look[i].turn}>
                <Icon name={iconOf(m)} size={34} color={look[i].ink} />
              </Shape>
              <Text style={[s.shapeT, { color: c.ink }]} numberOfLines={2}>
                {m}
              </Text>
            </Pressable>
          ))}
        </View>
        <SosRow sub="It starts on the first tap. Nothing to answer." />
        <PracticeLink color={c.accentText} />
      </View>
      <Week snap={snap} tk={tk} level={level} />
    </View>
  );
}

export function ReadyLook({ look, snap, tk, level }: { look: 'b1' | 'b2' | 'b3'; snap: Snapshot; tk: string; level: number }) {
  if (look === 'b1') return <Words snap={snap} tk={tk} level={level} />;
  if (look === 'b2') return <Tonight snap={snap} tk={tk} level={level} />;
  return <Shapes snap={snap} tk={tk} level={level} />;
}

const s = StyleSheet.create({
  scene: { borderRadius: 28, overflow: 'hidden' },
  clock: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2, marginBottom: 20 },
  hardT: { position: 'absolute', width: 160, textAlign: 'center', color: '#FFD98A', top: 0 },
  planHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  planH: { fontFamily: font.display, fontSize: 22, lineHeight: 28 },
  planMove: { fontFamily: font.bodySemi, fontSize: 17, lineHeight: 22, paddingVertical: 12 },
  weekH: { fontFamily: font.display, fontSize: 22, lineHeight: 28 },
  wdays: { flexDirection: 'row', position: 'absolute', left: 0, right: 0, bottom: 0 },
  wday: { flex: 1, textAlign: 'center', fontFamily: font.bodySemi, fontSize: 12, lineHeight: 16 },
  more: { gap: 40, marginTop: 24, paddingBottom: 24 },
  sec: { gap: 12 },
  quoteBig: { fontFamily: font.display, fontSize: 34, lineHeight: 40 },
  quote: { fontFamily: font.display, fontSize: 28, lineHeight: 34 },
  p: { fontFamily: font.body, fontSize: 15, lineHeight: 21 },
  link: { fontFamily: font.bodySemi, fontSize: 15, lineHeight: 21 },
  round: { alignItems: 'center', justifyContent: 'center', shadowOpacity: 1, shadowRadius: 0, shadowOffset: { width: 0, height: 5 }, elevation: 6 },
  roundT: { fontFamily: font.display },
  sosRow: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 4 },
  sky: { borderRadius: 28, overflow: 'hidden', backgroundColor: '#1A1450' },
  star: { position: 'absolute', width: 3, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.7)' },
  strip: { marginTop: 40, marginHorizontal: 20, height: 64, justifyContent: 'center' },
  track: { height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.28)' },
  glow: {
    position: 'absolute',
    top: 0,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,200,90,0.22)',
    alignItems: 'center',
    paddingTop: 2,
  },
  glowT: { fontFamily: font.bodySemi, fontSize: 12, lineHeight: 16 },
  now: { position: 'absolute', top: 26, marginLeft: -7 },
  nowDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#FFFFFF', borderWidth: 3, borderColor: '#FF8A3D' },
  ticks: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', justifyContent: 'space-between' },
  tick: { fontFamily: font.bodySemi, fontSize: 12, lineHeight: 16 },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  moveRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  moveT: { fontFamily: font.bodySemi, fontSize: 17, lineHeight: 22, flex: 1 },
  shapes: { flexDirection: 'row', justifyContent: 'space-between' },
  shapeCol: { width: '31%', alignItems: 'center', gap: 8 },
  shapeT: { fontFamily: font.bodySemi, fontSize: 13, lineHeight: 18, textAlign: 'center' },
});
