/* PROTOTYPE (mockups only, not for merge): three looks for "Ready when it comes", each with who I am becoming on top. ?dir=b1|b2|b3 on the web. */
import { riskWindow, type Snapshot } from '@daybook/core';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Shape } from '@/components/shapes';
import { Text } from '@/components/text';
import { weekLine, WeekFlames } from '@/components/today-more';
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

/* 2: tonight's sky. The evening drawn, with the hard hours glowing in it and now marked; the plan under it. */
const FROM = 18;
const SPAN = 8;
function Tonight({ snap, tk, level }: { snap: Snapshot; tk: string; level: number }) {
  const c = useTheme();
  const st = snap.settings!;
  const win = riskWindow(snap.days, st, tk);
  const moves = (st.menu || []).slice(0, 3);
  const d = new Date();
  const nowH = (d.getHours() + d.getMinutes() / 60 - FROM + 24) % 24;
  const at = (h: number) => Math.max(0, Math.min(1, h / SPAN));
  const hardA = win ? at((win.start - FROM + 24) % 24) : 0;
  return (
    <View style={s.more}>
      <View style={s.sky}>
        <LinearGradient colors={['#1A1450', '#3B2A86', '#8A4A92', '#D9787E']} locations={[0, 0.45, 0.8, 1]} style={StyleSheet.absoluteFill} />
        {[
          [0.12, 0.1],
          [0.3, 0.22],
          [0.62, 0.08],
          [0.84, 0.18],
          [0.5, 0.3],
          [0.93, 0.4],
        ].map(([x, y], i) => (
          <View key={i} style={[s.star, { left: `${x * 100}%`, top: `${y * 100}%` }]} />
        ))}
        <View style={{ gap: 6, padding: 20, paddingBottom: 0 }}>
          <Text style={[s.quote, { color: nightInk.ink }]}>{st.becoming}</Text>
          {st.reasons?.[0] ? <Text style={[s.p, { color: nightInk.muted }]}>For {lower(st.reasons[0])}.</Text> : null}
        </View>
        <View style={s.strip}>
          {win ? (
            <View style={[s.glow, { left: `${hardA * 100}%`, width: `${(2 / SPAN) * 100}%` }]}>
              <Text style={[s.glowT, { color: '#FFE3A8' }]}>Hard hours</Text>
            </View>
          ) : null}
          <View style={s.track} />
          <View style={[s.now, { left: `${at(nowH) * 100}%` }]}>
            <View style={s.nowDot} />
          </View>
          <View style={s.ticks}>
            {['6 PM', '8', '10', '12', '2 AM'].map((t) => (
              <Text key={t} style={[s.tick, { color: nightInk.muted }]}>
                {t}
              </Text>
            ))}
          </View>
        </View>
        <Svg width="100%" height={36} viewBox="0 0 400 36" preserveAspectRatio="none" style={{ marginTop: -8 }}>
          <Path d="M0 20 C 90 4, 180 6, 260 16 S 360 30, 400 14 L 400 36 L 0 36 Z" fill="#2E2384" />
        </Svg>
      </View>
      <View style={{ gap: 12 }}>
        <View style={s.headRow}>
          <View style={{ flex: 1 }}>
            <T v="h2">When an urge comes</T>
          </View>
          <Pressable onPress={sos} accessibilityRole="button" accessibilityLabel="Open SOS" style={({ pressed }) => pressed && { opacity: 0.8 }}>
            <RoundSos />
          </Pressable>
        </View>
        <View style={{ gap: 10 }}>
          {moves.map((m) => (
            <View key={m} style={s.moveRow}>
              <Icon name="flame" size={20} color={c.sun} />
              <Text style={[s.moveT, { color: c.ink }]}>{m}</Text>
            </View>
          ))}
        </View>
        <PracticeLink color={c.accentText} />
      </View>
      <Week snap={snap} tk={tk} level={level} />
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
