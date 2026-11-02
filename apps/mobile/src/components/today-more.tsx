/* PROTOTYPE (mockups only, not for merge): what Today could hold below Your day, three ways. Picked by ?dir=a|b|c on the web. */
import { addDays, eventsOf, fmtDate, hardHeld, riskWindow, statusOf, urEvidence, type Snapshot } from '@daybook/core';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { Text } from '@/components/text';
import { Icon, T } from '@/components/ui';
import { ReadyLook } from '@/components/today-ready';
import { buzz } from '@/lib/feel';
import { font, useTheme } from '@/lib/theme';

export type Dir = 'a' | 'b' | 'c' | 'b1' | 'b2' | 'b3';
export function protoDir(): Dir | null {
  if (typeof window === 'undefined' || !window.location) return null;
  const m = /[?&]dir=(a|b[123]?|c)\b/.exec(window.location.search);
  return m ? (m[1] as Dir) : null;
}

const sos = () => {
  buzz('tap');
  router.push('/sos');
};
const practice = () => {
  buzz('tap');
  router.push({ pathname: '/sos', params: { practice: '1' } });
};

export function weekOf(snap: Snapshot, tk: string) {
  const st = snap.settings!;
  const out: { k: string; d: string; st: string; rode: number; today: boolean }[] = [];
  for (let i = 6; i >= 0; i--) {
    const k = addDays(tk, -i);
    const day = snap.days[k];
    out.push({
      k,
      d: fmtDate(k, { weekday: 'narrow' }),
      st: statusOf(k, day, st, tk, snap.days),
      rode: (day?.events || []).filter((e) => e.outcome === 'rode').length,
      today: i === 0,
    });
  }
  return out;
}

const clock = (t: string) => {
  const h = +t.slice(0, 2);
  return (h % 12 || 12) + ':' + t.slice(3, 5) + (h < 12 ? ' AM' : ' PM');
};

const FIRE =
  'M12 21.5c-3.6 0-6.2-2.5-6.2-6 0-3.1 2-4.9 3.3-6.7.2 1.7 1 2.7 2 3.2-.1-3.4 1.5-6.3 3.7-8.5.2 3.2 1.8 4.9 2.8 6.8.6 1.1.8 2.3.8 3.7 0 4.3-2.7 7.5-6.4 7.5z';
const CORE = 'M12 21.5c-1.5 0-2.6-1.1-2.6-2.6 0-1.7 1.3-2.6 2.6-4.3 1.3 1.7 2.6 2.6 2.6 4.3 0 1.5-1.1 2.6-2.6 2.6z';
/** one small fire: lit for a day with no slip, an ember for the day of a slip */
function Fire({ size, lit }: { size: number; lit: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="2 1 20 22">
      <Defs>
        <LinearGradient id={lit ? 'fl' : 'fe'} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={lit ? '#FF8A3D' : '#B8402F'} />
          <Stop offset="1" stopColor={lit ? '#FF5A36' : '#7A2A22'} />
        </LinearGradient>
      </Defs>
      <Path d={FIRE} fill={`url(#${lit ? 'fl' : 'fe'})`} />
      <Path d={CORE} fill={lit ? '#FFD25A' : '#E07A4A'} />
    </Svg>
  );
}

/* the week as seven flames: lit for a day with no slip, small for the day of a slip (the fire is never out), a spark under each urge ridden out */
export function WeekFlames({ snap, tk, level }: { snap: Snapshot; tk: string; level: number }) {
  const c = useTheme();
  const w = weekOf(snap, tk);
  return (
    <View style={s.week}>
      {w.map((x) => (
        <View key={x.k} style={s.wday}>
          <View style={s.wflame}>
            {x.st === 'slip' ? (
              <Fire size={22} lit={false} />
            ) : x.st === 'clean' ? (
              <Fire size={x.today ? 40 : 34} lit />
            ) : (
              <View style={[s.dot, { borderColor: c.line }]} />
            )}
          </View>
          <View style={s.sparks}>
            {Array.from({ length: Math.min(3, x.rode) }).map((_, i) => (
              <View key={i} style={[s.spark, { backgroundColor: c.mint }]} />
            ))}
          </View>
          <Text style={[s.wd, { color: x.today ? c.ink : c.muted }]}>{x.today ? 'Today' : x.d}</Text>
        </View>
      ))}
    </View>
  );
}

export function weekLine(snap: Snapshot, tk: string) {
  const w = weekOf(snap, tk);
  const clean = w.filter((x) => x.st === 'clean').length;
  const rode = w.reduce((a, x) => a + x.rode, 0);
  return { clean, rode };
}

/* A: who you are becoming, then the week, then the proof */
function Becoming({ snap, tk, level }: { snap: Snapshot; tk: string; level: number }) {
  const c = useTheme();
  const st = snap.settings!;
  const rode = eventsOf(snap.days)
    .filter((e) => e.outcome === 'rode')
    .slice(-3)
    .reverse();
  const n = urEvidence(snap.days).n;
  const wl = weekLine(snap, tk);
  return (
    <View style={s.more}>
      <View style={s.sec}>
        <Text style={[s.quote, { color: c.ink }]}>{st.becoming}</Text>
        {st.reasons?.[0] ? <T tone="muted">For {st.reasons[0].charAt(0).toLowerCase() + st.reasons[0].slice(1)}.</T> : null}
      </View>
      <View style={s.sec}>
        <T v="h2">This week</T>
        <WeekFlames snap={snap} tk={tk} level={level} />
        <T tone="muted">
          {wl.clean} days with no slip, and {wl.rode} {wl.rode === 1 ? 'urge' : 'urges'} ridden out.
        </T>
      </View>
      <View style={s.sec}>
        <View style={s.head}>
          <T v="h2">Urges you rode out</T>
          <Text style={[s.big, { color: c.mintText }]}>{n}</Text>
        </View>
        <View style={[s.rows, { backgroundColor: c.surface }]}>
          {rode.map((e, i) => (
            <View key={e.id} style={[s.row, i < rode.length - 1 && { borderBottomColor: c.line, borderBottomWidth: 1 }]}>
              <Icon name="wave" size={20} color={c.mintText} />
              <View style={{ flex: 1 }}>
                <T v="label">{fmtDate(e.key, { weekday: 'long' }) + (e.time ? ', ' + clock(e.time) : '')}</T>
                {e.did?.[0] ? (
                  <T v="small" tone="muted">
                    {e.did[0]}
                  </T>
                ) : null}
              </View>
            </View>
          ))}
        </View>
        <Pressable onPress={sos} accessibilityRole="button" hitSlop={10} style={({ pressed }) => [s.quiet, pressed && { opacity: 0.6 }]}>
          <T tone="muted">When the next one comes,</T>
          <Text style={[s.go, { color: c.sos }]}>open SOS</Text>
        </Pressable>
      </View>
    </View>
  );
}

/* B: ready for the next urge (your plan for it, in your words), then the week */
function Ready({ snap, tk, level }: { snap: Snapshot; tk: string; level: number }) {
  const c = useTheme();
  const st = snap.settings!;
  const win = riskWindow(snap.days, st, tk);
  const moves = (st.menu || []).slice(0, 3);
  const wl = weekLine(snap, tk);
  const held = hardHeld(snap.days);
  return (
    <View style={s.more}>
      <View style={[s.ready, { backgroundColor: c.surface }]}>
        <Text style={[s.readyH, { color: c.ink }]}>When an urge comes</Text>
        {win ? <T tone="muted">Yours come most often {win.label}. Your plan:</T> : <T tone="muted">Your plan:</T>}
        <View style={{ gap: 8 }}>
          {moves.map((m, i) => (
            <View key={m} style={s.move}>
              <Text style={[s.num, { color: c.sos, borderColor: c.sos }]}>{i + 1}</Text>
              <Text style={[s.moveT, { color: c.ink }]}>{m}</Text>
            </View>
          ))}
        </View>
        <Pressable onPress={sos} accessibilityRole="button" style={({ pressed }) => [s.sosBtn, { backgroundColor: c.sos, opacity: pressed ? 0.85 : 1 }]}>
          <Text style={[s.sosBtnT, { color: c.sosInk }]}>Open SOS</Text>
        </Pressable>
        <Pressable onPress={practice} accessibilityRole="button" hitSlop={10} style={({ pressed }) => [{ alignSelf: 'center' }, pressed && { opacity: 0.6 }]}>
          <Text style={[s.readyLink, { color: c.accentText }]}>Calm right now? Practice once</Text>
        </Pressable>
      </View>
      <View style={s.sec}>
        <T v="h2">This week</T>
        <WeekFlames snap={snap} tk={tk} level={level} />
        <T tone="muted">
          {wl.clean} days with no slip, {wl.rode} {wl.rode === 1 ? 'urge' : 'urges'} ridden out
          {held ? ', and your hard hours held ' + (held === 1 ? 'once' : held + ' times') : ''}.
        </T>
      </View>
    </View>
  );
}

/* C: the flame's week, one picture and one line, with SOS under it */
function FlameWeek({ snap, tk, level }: { snap: Snapshot; tk: string; level: number }) {
  const c = useTheme();
  const wl = weekLine(snap, tk);
  return (
    <View style={s.more}>
      <View style={[s.fw, { backgroundColor: c.surface }]}>
        <WeekFlames snap={snap} tk={tk} level={level} />
        <Text style={[s.fwH, { color: c.ink }]}>
          {wl.clean} days with no slip this week, and {wl.rode} {wl.rode === 1 ? 'urge' : 'urges'} ridden out.
        </Text>
        <T tone="muted">Each one fed your flame. This is who you are now.</T>
      </View>
      <Pressable onPress={sos} accessibilityRole="button" style={({ pressed }) => [s.sosRow, { backgroundColor: c.surface, opacity: pressed ? 0.7 : 1 }]}>
        <View style={[s.sosDot, { backgroundColor: c.sos }]}>
          <Text style={[s.sosDotT, { color: c.sosInk }]}>SOS</Text>
        </View>
        <View style={{ flex: 1 }}>
          <T v="label">Feeling an urge?</T>
          <T v="small" tone="muted">
            It starts on the first tap. Nothing to answer.
          </T>
        </View>
        <Icon name="next" size={16} color={c.muted} />
      </Pressable>
    </View>
  );
}

export function TodayMore({ dir, snap, tk, level }: { dir: Dir; snap: Snapshot; tk: string; level: number }) {
  if (!snap.settings) return null;
  if (dir === 'b1' || dir === 'b2' || dir === 'b3') return <ReadyLook look={dir} snap={snap} tk={tk} level={level} />;
  if (dir === 'a') return <Becoming snap={snap} tk={tk} level={level} />;
  if (dir === 'b') return <Ready snap={snap} tk={tk} level={level} />;
  return <FlameWeek snap={snap} tk={tk} level={level} />;
}

const s = StyleSheet.create({
  more: { gap: 32, marginTop: 24, paddingBottom: 24 },
  sec: { gap: 12 },
  head: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: 4 },
  big: { fontFamily: font.display, fontSize: 28, lineHeight: 34 },
  quote: { fontFamily: font.display, fontSize: 28, lineHeight: 34 },
  week: { flexDirection: 'row', justifyContent: 'space-between' },
  wday: { alignItems: 'center', gap: 4, flex: 1 },
  wflame: { width: 44, height: 44, alignItems: 'center', justifyContent: 'flex-end' },
  dot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, marginBottom: 6 },
  sparks: { flexDirection: 'row', gap: 3, height: 6 },
  spark: { width: 6, height: 6, borderRadius: 3 },
  wd: { fontFamily: font.bodySemi, fontSize: 12, lineHeight: 16 },
  rows: { borderRadius: 20, paddingLeft: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingRight: 16 },
  quiet: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, paddingHorizontal: 4 },
  go: { fontFamily: font.bodySemi, fontSize: 15, lineHeight: 21 },
  ready: { borderRadius: 20, padding: 20, gap: 12 },
  readyH: { fontFamily: font.display, fontSize: 28, lineHeight: 34 },
  readyP: { fontFamily: font.bodyMedium, fontSize: 15, lineHeight: 21 },
  move: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 32 },
  num: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, textAlign: 'center', fontFamily: font.bodyBold, fontSize: 13, lineHeight: 22 },
  moveT: { fontFamily: font.bodySemi, fontSize: 17, lineHeight: 22, flex: 1 },
  sosBtn: { minHeight: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  sosBtnT: { fontFamily: font.bodyBold, fontSize: 17, lineHeight: 22 },
  readyLink: { fontFamily: font.bodySemi, fontSize: 15, lineHeight: 21 },
  fw: { borderRadius: 20, padding: 16, paddingTop: 20, gap: 12 },
  fwH: { fontFamily: font.display, fontSize: 22, lineHeight: 27 },
  sosRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 20, padding: 16 },
  sosDot: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  sosDotT: { fontFamily: font.display, fontSize: 13, lineHeight: 16 },
});
