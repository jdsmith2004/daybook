/* The one next step on Today (core pickMoment, moment.ts), under the flame in the same card (hero.tsx): whatever the
   moment is, it is the only thing asking for a tap. Most moments are one band in the colors of their moment (the day's
   next stop, the Sunday review, the first week, a first pattern, days away), the whole band one
   button (Your day, below, names the rest of the day). The day of a slip keeps its full card, with its words of care; the
   comeback shows its three flames, one line, and leads on to the next step; the moments with their own choices (a talk-through, a counting note,
   a word about reminders, Day 1) keep their cards. Under it, one quiet line names the next moment when
   two overlap. */
import { comebackNow, type Moment, type MomentPick, type Snapshot, type StopTile } from '@daybook/core';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { NudgeCard } from '@/components/nudge-card';
import { TalkCard } from '@/components/talk-card';
import { TellStartCard } from '@/components/tell-start';
import { Text } from '@/components/text';
import { CountNotes } from '@/components/today';
import { Flames } from '@/components/rekindle';
import { PauseBanner, useLogActions } from '@/components/today-log';
import { Card, Icon, T } from '@/components/ui';
import { lookOf, openStop } from '@/components/your-day';
import { buzz } from '@/lib/feel';
import { useSos } from '@/lib/sos';
import { font, nightInk, skies, useTheme } from '@/lib/theme';

export function MomentCard({ pick, snap, tk, now }: { pick: MomentPick; snap: Snapshot; tk: string; now: number }) {
  return (
    <View style={{ gap: 6 }}>
      <TheCard m={pick.card} snap={snap} tk={tk} now={now} />
      {pick.more ? (
        <T v="small" tone="muted" style={s.more}>
          {'After this: ' + pick.more.one + '.'}
        </T>
      ) : null}
    </View>
  );
}

function TheCard({ m, snap, tk, now }: { m: Moment; snap: Snapshot; tk: string; now: number }) {
  const { didSmall } = useLogActions();
  switch (m.k) {
    case 'pause':
      return <PauseBanner />;
    case 'talk':
      return <TalkCard snap={snap} now={now} />;
    case 'comeback':
      return <Comeback m={m} snap={snap} tk={tk} />;
    case 'tell-start':
      return <TellStartCard snap={snap} tk={tk} />;
    case 'count-note':
    case 'step-offer':
      return <CountNotes snap={snap} tk={tk} />;
    case 'nudge':
      return <NudgeCard snap={snap} tk={tk} />;
    case 'slip-day':
      return <Tile m={m} sky="sun" onPress={() => didSmall(tk)} />;
    case 'calm':
      return <Band m={m} onPress={() => openStop(m.go as StopTile['go'], m.v)} />;
    case 'sunday':
      return <Band m={m} onPress={() => router.push({ pathname: '/review', params: { s: m.v! } })} />;
    case 'first-week':
      return <Band m={m} onPress={() => router.push('/week')} />;
    case 'first-pattern':
      return <Band m={m} onPress={() => router.navigate({ pathname: '/pattern', params: { pane: 'patterns' } })} />;
    case 'away':
      return <Band m={m} onPress={() => router.push('/back')} />;
    case 'recheck':
      return <Band m={m} onPress={() => router.push('/recheck')} />;
    default:
      return null;
  }
}

/* the band's button stays short; the longer action is said in its label for screen readers */
const PILL: Partial<Record<string, string>> = { review: 'Start', week: 'See it', pattern: 'See it', back: 'Fill in' };

/* the one next step: its words and one button, the whole band one tap */
function Band({ m, onPress }: { m: Moment; onPress: () => void }) {
  const c = useTheme();
  const pill = m.btn && m.btn.length <= 14 ? m.btn : PILL[m.go || ''] || 'Start';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={(m.btn || pill) + ': ' + m.h}
      onPress={() => {
        buzz('tap');
        onPress();
      }}
      style={({ pressed }) => [s.band, { backgroundColor: c.surface, opacity: pressed ? 0.8 : 1 }]}>
      <View style={{ flex: 1, gap: 1 }}>
        <Text style={[s.eb, { color: c.muted }]} numberOfLines={1}>
          {m.eb}
        </Text>
        <Text style={[s.bandT, { color: c.ink }]} numberOfLines={3}>
          {m.h}
        </Text>
      </View>
      <View style={[s.go, { backgroundColor: c.accent }]}>
        <Text style={[s.goT, { color: c.accentInk }]}>{pill}</Text>
      </View>
    </Pressable>
  );
}

/* the day of a slip: its full card, with its words of care and its one button */
function Tile({ m, sky, onPress }: { m: Moment; sky: StopTile['sky']; onPress: () => void }) {
  const c = useTheme();
  const L = lookOf(sky, c);
  const deep = c.scheme === 'dark' || sky === 'night';
  const ink = deep ? nightInk.ink : c.ink;
  const soft = deep ? '#E6DEFF' : c.muted;
  const eb = sky === 'night' ? '#FFE27A' : L.ink;
  const [a, b] = skies[c.scheme][sky];
  const btn = { bg: L.btn, ink: L.onBtn };
  return (
    <View style={s.tile} accessibilityRole="summary">
      <LinearGradient colors={[a, b]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <Deco sky={sky} />
      <Text style={[s.eb, { color: eb }, (sky === 'sun' || sky === 'night') && s.ebRoom]}>{m.eb}</Text>
      <Text style={[s.head, { color: ink }, s.headRoom]} accessibilityRole="header">
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
    </View>
  );
}

/* all three flames lit after a slip: the comeback, celebrated once (core comebackNow), and then it leads on. Its button
   is the day's next step ("Next: Wanting is not liking"), or "Nice" when the day is done; either puts it away. */
function Comeback({ m, snap, tk }: { m: Moment; snap: Snapshot; tk: string }) {
  const c = useTheme();
  const sos = useSos();
  const cb = comebackNow(snap.days, snap.settings!, tk);
  if (!cb) return null;
  const go = () => {
    sos.setMem((x) => ({ ...x, cbSeen: cb.k }));
    if (m.go === 'lesson' || m.go === 'checkin' || m.go === 'wind') openStop(m.go, m.v);
    else buzz('tap');
  };
  return (
    <Card tone="note">
      <View style={{ alignItems: 'center', gap: 6 }}>
        <Flames on={cb.flames.map((f) => f.on)} />
        <T v="h2" accessibilityRole="header" style={{ textAlign: 'center' }}>
          {m.h}
        </T>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={m.nx ? m.btn + ': ' + m.nx : m.btn || 'Nice'}
        onPress={go}
        style={({ pressed }) => [
          s.btn,
          {
            backgroundColor: c.sun,
            shadowColor: 'rgba(0,0,0,0.28)',
            transform: [{ translateY: pressed ? 3 : 0 }],
            shadowOffset: { width: 0, height: pressed ? 1 : 4 },
          },
        ]}>
        <Text style={[s.btnT, { color: c.onSun }]} numberOfLines={1}>
          {m.nx ? 'Next: ' + m.nx + ' ›' : m.btn || 'Nice'}
        </Text>
      </Pressable>
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
  tile: { borderRadius: 20, padding: 16, gap: 8, overflow: 'hidden' },
  deco: { position: 'absolute', right: 0, top: 0, width: 130, height: 110 },
  glow: { position: 'absolute', right: -34, top: -38, width: 132, height: 132, borderRadius: 66 },
  ball: { position: 'absolute', right: -6, top: -10, width: 72, height: 72, borderRadius: 36 },
  eb: { fontFamily: font.bodySemi, fontSize: 13, lineHeight: 18 },
  /* room for the sun or the moon in the corner */
  ebRoom: { paddingRight: 70 },
  head: { fontFamily: font.display, fontSize: 28, lineHeight: 31 },
  headRoom: { paddingRight: 56 },
  body: { fontFamily: font.bodyMedium, fontSize: 15, lineHeight: 21 },
  btn: { minHeight: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginTop: 4, shadowOpacity: 1, shadowRadius: 0, elevation: 2 },
  btnT: { fontFamily: font.bodyBold, fontSize: 17 },
  more: { paddingHorizontal: 16 },
  band: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 84, paddingVertical: 12, paddingLeft: 16, paddingRight: 14, borderRadius: 20 },
  bandT: { fontFamily: font.display, fontSize: 20, lineHeight: 25 },
  go: { minHeight: 44, minWidth: 72, paddingHorizontal: 18, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  goT: { fontFamily: font.bodySemi, fontSize: 15 },
});
