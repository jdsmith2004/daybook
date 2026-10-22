/* The one card at the top of Today (core pickMoment, moment.ts): whatever the moment is, it is the only thing asking for a
   tap. The day's open stop, the morning after, the day of a slip and the simple moments are drawn here, in the colors of
   their moment; the comeback shows its three flames; the moments with their own choices (the hard hours, a talk-through,
   a counting note, a word about reminders, Day 1, a run that ended) keep their cards. Under it, one quiet line names the next moment when two overlap. */
import { comebackNow, rkComebackSay, type Moment, type MomentPick, type Snapshot, type StopTile } from '@daybook/core';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { NudgeCard } from '@/components/nudge-card';
import { RiskCard } from '@/components/risk-card';
import { SunArt } from '@/components/sun-art';
import { TalkCard } from '@/components/talk-card';
import { TellStartCard } from '@/components/tell-start';
import { Text } from '@/components/text';
import { CountNotes } from '@/components/today';
import { Lights } from '@/components/rekindle';
import { PauseBanner, RunKeptCard, useLogActions } from '@/components/today-log';
import { Card, Icon, T } from '@/components/ui';
import { lookOf, openStop } from '@/components/your-day';
import { buzz } from '@/lib/feel';
import { font, nightInk, skies, useTheme } from '@/lib/theme';

export function MomentCard({ pick, snap, tk, now }: { pick: MomentPick; snap: Snapshot; tk: string; now: number }) {
  return (
    <View style={{ gap: 8 }}>
      <TheCard m={pick.card} then={pick.then} snap={snap} tk={tk} now={now} />
      {pick.more ? (
        <T v="small" tone="muted" style={s.more}>
          {'And one more: ' + pick.more.one + '. It comes up here next.'}
        </T>
      ) : null}
    </View>
  );
}

function TheCard({ m, then, snap, tk, now }: { m: Moment; then: string; snap: Snapshot; tk: string; now: number }) {
  const { didSmall } = useLogActions();
  switch (m.k) {
    case 'pause':
      return <PauseBanner />;
    case 'hard-now':
    case 'hard-soon':
      return <RiskCard snap={snap} tk={tk} now={now} />;
    case 'talk':
      return <TalkCard snap={snap} now={now} />;
    case 'run-ended':
      return <RunKeptCard snap={snap} tk={tk} />;
    case 'comeback':
      return <Comeback m={m} snap={snap} tk={tk} />;
    case 'tell-start':
      return <TellStartCard snap={snap} tk={tk} />;
    case 'count-note':
    case 'step-offer':
      return <CountNotes snap={snap} tk={tk} />;
    case 'nudge':
      return <NudgeCard snap={snap} tk={tk} />;
    case 'morning-after':
      return <Tile m={m} sky="sun" sunrise then={then} onPress={() => router.push('/sunrise')} />;
    case 'slip-day':
      return <Tile m={m} sky="sun" then={then} onPress={() => didSmall(tk)} />;
    case 'calm': {
      const sky = ({ morning: 'sun', lesson: 'sky', checkin: 'violet', wind: 'night' } as const)[m.go as 'morning'] || 'violet';
      return <Tile m={m} sky={sky} then={then} onPress={() => openStop(m.go as StopTile['go'], m.v)} />;
    }
    case 'sunday':
      return <Tile m={m} sky="sun" then={then} onPress={() => router.push({ pathname: '/review', params: { s: m.v! } })} />;
    case 'first-week':
      return <Tile m={m} sky="sky" then={then} onPress={() => router.push('/week')} />;
    case 'first-pattern':
      return <Tile m={m} sky="violet" then={then} onPress={() => router.navigate({ pathname: '/journal', params: { pane: 'patterns' } })} />;
    case 'away':
      return <Tile m={m} sky="sky" then={then} onPress={() => router.push('/back')} />;
    default:
      return <Done m={m} />;
  }
}

/* a moment in the colors of its sky, with its one button */
function Tile({ m, sky, sunrise, onPress }: { m: Moment; sky: StopTile['sky']; then: string; sunrise?: boolean; onPress: () => void }) {
  return <Band m={m} sky={sunrise ? 'sun' : sky} onPress={onPress} />;
}

/* prototype: the next step as one band under the flame, the whole band is the button */
function Band({ m, sky, onPress }: { m: Moment; sky: StopTile['sky']; onPress: () => void }) {
  const c = useTheme();
  const L = lookOf(sky, c);
  const deep = c.scheme === 'dark' || sky === 'night';
  const [a, b] = skies[c.scheme][sky];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={m.btn + ': ' + m.h}
      onPress={() => {
        buzz('tap');
        onPress();
      }}
      style={({ pressed }) => [
        s.band,
        { shadowColor: 'rgba(20,14,60,0.45)', shadowOffset: { width: 0, height: pressed ? 1 : 5 }, transform: [{ translateY: pressed ? 4 : 0 }] },
      ]}>
      <LinearGradient colors={[a, b]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[StyleSheet.absoluteFill, { borderRadius: 20 }]} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[s.eb, { color: sky === 'night' ? '#FFE27A' : L.ink }]} numberOfLines={1}>
          {m.eb.toUpperCase()}
        </Text>
        <Text style={[s.bandT, { color: deep ? nightInk.ink : c.ink }]} numberOfLines={2}>
          {m.h}
        </Text>
      </View>
      <View style={[s.go, { backgroundColor: L.btn }]}>
        <Text style={[s.goT, { color: L.onBtn }]}>{(m.btn && m.btn.length < 10 ? m.btn : 'Start') + ' ›'}</Text>
      </View>
    </Pressable>
  );
}

export function OldTile({ m, sky, then, sunrise, onPress }: { m: Moment; sky: StopTile['sky']; then: string; sunrise?: boolean; onPress: () => void }) {
  const c = useTheme();
  const L = lookOf(sky, c);
  /* the morning after keeps its light sunrise colors in either theme, so its words do too */
  const lit = !!sunrise;
  const deep = !lit && (c.scheme === 'dark' || sky === 'night');
  const ink = lit ? '#2A2350' : deep ? nightInk.ink : c.ink;
  const soft = lit ? '#625A85' : deep ? '#E6DEFF' : c.muted;
  const eb = lit ? '#9A5B12' : sky === 'night' ? '#FFE27A' : L.ink;
  const [a, b] = lit ? ['#FFD9B4', '#FFF3DE'] : skies[c.scheme][sky];
  const btn = lit ? { bg: c.accent, ink: c.accentInk } : { bg: L.btn, ink: L.onBtn };
  return (
    <View style={[s.tile, { shadowColor: c.lip, borderColor: lit ? '#F6D2A6' : 'transparent' }]} accessibilityRole="summary">
      <LinearGradient colors={[a, b]} start={{ x: 0, y: 0 }} end={{ x: lit ? 0 : 1, y: 1 }} style={StyleSheet.absoluteFill} />
      {lit ? <SunArt height={110} /> : <Deco sky={sky} />}
      <Text style={[s.eb, { color: eb }, !lit && (sky === 'sun' || sky === 'night') && s.ebRoom]}>{m.eb.toUpperCase()}</Text>
      <Text style={[s.head, { color: ink }, !lit && s.headRoom]} accessibilityRole="header">
        {m.h}
      </Text>
      {m.p ? <Text style={[s.body, { color: soft }]}>{m.p}</Text> : null}
      {m.btn ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={m.btn + ': ' + m.h}
          onPress={() => {
            buzz('tap');
            onPress();
          }}
          style={({ pressed }) => [
            s.btn,
            {
              backgroundColor: btn.bg,
              shadowColor: 'rgba(0,0,0,0.28)',
              transform: [{ translateY: pressed ? 3 : 0 }],
              shadowOffset: { width: 0, height: pressed ? 1 : 4 },
            },
          ]}>
          <Text style={[s.btnT, { color: btn.ink }]}>{m.btn}</Text>
        </Pressable>
      ) : null}
      {then ? <Text style={[s.then, { color: soft }]}>{then}</Text> : null}
    </View>
  );
}

/* all three flames lit after a slip: the comeback, noticed, once (core comebackNow). Nothing to do, so no button. */
function Comeback({ m, snap, tk }: { m: Moment; snap: Snapshot; tk: string }) {
  const c = useTheme();
  const cb = comebackNow(snap.days, snap.settings!, tk);
  if (!cb) return null;
  return (
    <Card style={{ backgroundColor: c.sunSoft, borderColor: c.sunSoft }}>
      <Text style={[s.eb, { color: c.sunText }]}>{m.eb.toUpperCase()}</Text>
      <T v="h2" accessibilityRole="header">
        {m.h}
      </T>
      <Lights list={cb.flames} />
      <T tone="muted">{rkComebackSay(cb.n)}</T>
    </Card>
  );
}

/* the day is done (or nothing is planned): no button, just rest */
function Done({ m }: { m: Moment }) {
  const c = useTheme();
  return (
    <Card style={{ backgroundColor: c.mintSoft, borderColor: c.mintSoft }}>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <View style={[s.ic, { backgroundColor: c.surface }]}>
          <Icon name="check" size={24} color={c.mintText} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[s.eb, { color: c.mintText }]}>{m.eb.toUpperCase()}</Text>
          <T v="h2" accessibilityRole="header">
            {m.h}
          </T>
        </View>
      </View>
      <T tone="muted">{m.p}</T>
    </Card>
  );
}

/* a little of each moment's sky in the corner: the sun coming up, a moon and stars, or a soft glow */
function Deco({ sky }: { sky: StopTile['sky'] }) {
  const c = useTheme();
  if (sky === 'sun')
    return (
      <View style={s.deco} pointerEvents="none">
        <View style={[s.glow, { backgroundColor: 'rgba(255,200,50,0.28)' }]} />
        <View style={[s.ball, { backgroundColor: c.sun }]} />
      </View>
    );
  if (sky === 'night')
    return (
      <View style={s.deco} pointerEvents="none">
        {[
          [18, 26, 3],
          [64, 12, 2],
          [40, 58, 2],
          [84, 50, 3],
        ].map(([x, y, r], i) => (
          <View key={i} style={{ position: 'absolute', left: x, top: y, width: r, height: r, borderRadius: r, backgroundColor: '#FFF6D8', opacity: 0.85 }} />
        ))}
        <View style={{ position: 'absolute', right: 22, top: 18 }}>
          <Icon name="moon" size={34} color="#FFE27A" />
        </View>
      </View>
    );
  return (
    <View style={s.deco} pointerEvents="none">
      <View style={[s.glow, { backgroundColor: 'rgba(255,255,255,0.12)' }]} />
    </View>
  );
}

const s = StyleSheet.create({
  tile: {
    borderRadius: 24,
    borderWidth: 2,
    padding: 18,
    gap: 10,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  deco: { position: 'absolute', right: 0, top: 0, width: 130, height: 110 },
  glow: { position: 'absolute', right: -34, top: -38, width: 132, height: 132, borderRadius: 66 },
  ball: { position: 'absolute', right: -6, top: -10, width: 72, height: 72, borderRadius: 36 },
  eb: { fontFamily: font.bodyBold, fontSize: 12.5, letterSpacing: 1.1 },
  /* room for the sun or the moon in the corner */
  ebRoom: { paddingRight: 70 },
  head: { fontFamily: font.display, fontSize: 26, lineHeight: 31 },
  headRoom: { paddingRight: 56 },
  body: { fontFamily: font.bodyMedium, fontSize: 15.5, lineHeight: 21 },
  btn: { minHeight: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginTop: 4, shadowOpacity: 1, shadowRadius: 0, elevation: 2 },
  btnT: { fontFamily: font.bodyBold, fontSize: 17 },
  then: { fontFamily: font.body, fontSize: 14, lineHeight: 19, textAlign: 'center' },
  ic: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  more: { paddingHorizontal: 8 },
  band: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 76, padding: 14, borderRadius: 20, shadowOpacity: 1, shadowRadius: 0, elevation: 2 },
  bandT: { fontFamily: font.display, fontSize: 19, lineHeight: 23 },
  go: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999 },
  goT: { fontFamily: font.bodyBold, fontSize: 15 },
});
