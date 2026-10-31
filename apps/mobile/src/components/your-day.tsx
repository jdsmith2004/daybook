/* "Your day" on Today: the home screen's spine, one line down the page from morning to night (core: stopTiles in day.ts). What is
   next is the one big bright card on the line, and its tap starts it; the other stops are slim rows beside the line, so there is
   never a question of what to do. The part of the day already done is the squiggle (docs/design-standards.md: squiggle means
   progress), the rest a quiet line. Every stop opens its moment with one tap, at any time: the lesson, the check-in (app/checkin.tsx)
   and the wind-down (app/wind.tsx). When a bigger moment has the next step (core pickMoment, moment-card.tsx), its card sits above and
   the stops here are all rows. "Change" turns parts of today on or off, in a sheet. */
import { openTile, ROUTINE, routineChanged, routineDay, routineOn, stopTiles, type Moment, type Snapshot, type StopGo, type StopTile } from '@daybook/core';
import { router, useIsFocused } from 'expo-router';
import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OnOff } from '@/components/form';
import { Shape, WavyLine, type ShapeKind } from '@/components/shapes';
import { Button, Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { useStore } from '@/lib/store';
import { useAccount } from '@/lib/sync';
import { font, useTheme, type Palette } from '@/lib/theme';

/** open a stop's moment */
export function openStop(go: StopGo, id?: string) {
  buzz('tap');
  if (go === 'lesson') {
    if (id) router.push({ pathname: '/lesson/[id]', params: { id } });
    return;
  }
  router.push(go === 'checkin' ? '/checkin' : '/wind');
}
/** Next up names a stop by its key (evening, night; the lesson opens itself) */
export function openStopKey(k: string) {
  openStop(k === 'evening' ? 'checkin' : 'wind');
}

/** the colors of a stop, from the sky of its moment */
export function lookOf(sky: StopTile['sky'], c: Palette & { scheme: 'light' | 'dark' }) {
  const dark = c.scheme === 'dark';
  switch (sky) {
    case 'sun':
      return { soft: c.sunSoft, ink: c.sunText, btn: c.sun, onBtn: c.onSun };
    case 'sky':
      return { soft: c.skySoft, ink: c.skyText, btn: c.sky, onBtn: dark ? '#0E2350' : '#FFFFFF' };
    case 'violet':
      return { soft: c.violetSoft, ink: c.violetText, btn: c.violet, onBtn: dark ? '#1A1250' : '#FFFFFF' };
    default:
      return { soft: '#2A2275', ink: '#FFE27A', btn: '#FFE27A', onBtn: '#2A2275' };
  }
}

export function YourDay({
  snap,
  tk,
  now,
  hero,
  foot,
  footOff,
}: {
  snap: Snapshot;
  tk: string;
  now: number;
  hero?: Moment | null;
  foot?: string;
  footOff?: boolean;
}) {
  const c = useTheme();
  const st = snap.settings!;
  const r = stopTiles(snap.days, st, tk, now);
  const account = useAccount();
  /* the stop that is next, as the card at the top opens it (a re-read in place of a lesson that waits behind an account) */
  const open = openTile(snap.days, st, tk, now, !!account);
  const changed = routineChanged(st, snap.days[tk]?.p);
  const [sheet, setSheet] = useState(false);
  const n = r.tiles.length;
  /* the big card goes on the stop it starts */
  const heroKey = hero ? (hero.go === 'checkin' ? 'evening' : hero.go === 'wind' ? 'night' : hero.go === 'lesson' ? 'lesson' : null) : null;
  return (
    <View>
      {n ? (
        r.tiles.map((t, i) => {
          const tile = open && open.k === t.k && !t.done ? open : t;
          const big = hero && heroKey === t.k && !t.done;
          return (
            <View key={t.k} style={s.stop}>
              <Rail done={t.done} cur={big ? true : t.cur} first={!i} last={i === n - 1} upDone={i > 0 && r.tiles[i - 1].done} />
              <View style={[s.stopIn, !i && { paddingTop: 0 }, i === n - 1 && { paddingBottom: 0 }]}>
                {big ? <Hero m={hero!} t={tile} /> : <Row t={tile} />}
              </View>
            </View>
          );
        })
      ) : (
        <T tone="muted" style={{ paddingHorizontal: 4 }}>
          Nothing is switched on for today. Tap Change to turn parts of the day back on.
        </T>
      )}
      <View style={[s.foot, footOff && { opacity: 0 }]}>
        <T v="small" tone="muted" style={{ flex: 1 }}>
          {[foot, changed ? changed + (changed === 1 ? ' part' : ' parts') + ' changed for today.' : ''].filter(Boolean).join(' ')}
        </T>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Change today’s routine"
          hitSlop={10}
          onPress={() => {
            buzz('tap');
            setSheet(true);
          }}
          style={({ pressed }) => [s.change, { opacity: pressed ? 0.6 : 1 }]}>
          <Text style={[s.changeT, { color: c.accentText }]}>Change</Text>
        </Pressable>
      </View>
      <RoutineSheet open={sheet} onClose={() => setSheet(false)} snap={snap} tk={tk} />
    </View>
  );
}

/* ---------- the line down the left, with a stop's mark on it ---------- */
const RAIL = 24;
const MARK = 20;
function Rail({ done, cur, first, last, upDone }: { done: boolean; cur: boolean; first: boolean; last: boolean; upDone: boolean }) {
  const c = useTheme();
  return (
    <View style={s.rail} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Line hidden={first} done={upDone} />
      {done ? (
        <View style={[s.mark, { backgroundColor: c.mint }]}>
          <Icon name="check" size={13} color={c.scheme === 'dark' ? '#06352A' : '#FFFFFF'} />
        </View>
      ) : (
        <View style={[s.mark, cur ? { backgroundColor: c.sun2 } : { borderWidth: 3, borderColor: c.line }]} />
      )}
      <Line hidden={last} done={done} />
    </View>
  );
}

/* a piece of the line: the squiggle where the day is done, quiet where it is still to come. A squiggle only ever runs along its
   width, so this one is laid on its side. */
function Line({ hidden, done }: { hidden: boolean; done: boolean }) {
  const c = useTheme();
  const focused = useIsFocused();
  const [h, setH] = useState(0);
  if (hidden) return <View style={{ flex: 1 }} />;
  return (
    <View style={{ flex: 1, minHeight: 6, width: RAIL, alignItems: 'center' }} onLayout={(e) => setH(e.nativeEvent.layout.height)}>
      {done && h > 0 ? (
        <View style={{ position: 'absolute', width: h, height: 12, left: RAIL / 2 - h / 2, top: h / 2 - 6, transform: [{ rotate: '90deg' }] }}>
          <WavyLine width={h} p={1} color={c.sun2} track={c.line} ease={false} speed={focused ? undefined : 0} />
        </View>
      ) : (
        <View style={{ flex: 1, width: 3, backgroundColor: done ? c.sun2 : c.line }} />
      )}
    </View>
  );
}

/* ---------- what is next: the one big bright card, the whole card one tap, with its word on a sticker ---------- */
const PILL: Partial<Record<string, string>> = { review: 'Start', week: 'See it', pattern: 'See it', back: 'Fill in' };
function Hero({ m, t }: { m: Moment; t: StopTile }) {
  const c = useTheme();
  const pill = m.btn && m.btn.length <= 14 ? m.btn : PILL[m.go || ''] || 'Start';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={(m.btn || pill) + ': ' + m.h}
      onPress={() => openStop(t.go, t.id)}
      style={({ pressed }) => [s.hero, { transform: [{ scale: pressed ? 0.985 : 1 }] }]}>
      <LinearGradient colors={[c.sun, c.sun2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[s.heroEb, { color: c.onSun }]} numberOfLines={1}>
          {m.eb}
        </Text>
        <Text style={[s.heroT, { color: c.onSun }]} numberOfLines={3}>
          {m.h}
        </Text>
      </View>
      <Shape kind="cookie12" size={84} color={c.onSun}>
        <Text style={[s.heroGoT, { color: c.sun }]}>{pill}</Text>
      </Shape>
    </Pressable>
  );
}

/* ---------- a stop that is not next: one slim row ---------- */
const STOP_SHAPE: Partial<Record<StopTile['sky'], ShapeKind>> = { sky: 'cookie9', violet: 'cookie12', night: 'sunny', sun: 'flower' };
function Row({ t }: { t: StopTile }) {
  const c = useTheme();
  const L = lookOf(t.sky, c);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t.title + ': ' + t.line + '. ' + (t.done ? 'Done.' : t.right + '.') + ' Opens it.'}
      onPress={() => openStop(t.go, t.id)}
      style={({ pressed }) => [s.row, { backgroundColor: c.surface, opacity: pressed ? 0.7 : 1 }]}>
      <Icon name={t.ic} size={20} color={t.done ? c.muted : t.sky === 'night' ? c.accentText : L.ink} />
      <Text style={[s.rowT, { color: t.done ? c.muted : c.ink }]}>
        {t.title}
        <Text style={[s.rowS, { color: c.muted }]}>{'  ' + (t.done ? t.line : t.right)}</Text>
      </Text>
    </Pressable>
  );
}

/* ---------- today's routine, in a sheet ---------- */
function RoutineSheet({ open, onClose, snap, tk }: { open: boolean; onClose: () => void; snap: Snapshot; tk: string }) {
  const c = useTheme();
  const inset = useSafeAreaInsets();
  const { update } = useStore();
  const st = snap.settings!;
  const p = snap.days[tk]?.p;
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={s.wrap}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(16,10,40,0.42)' }]}
          onPress={onClose}
        />
        <View style={[s.sheet, { backgroundColor: c.surface, paddingBottom: inset.bottom + 16, shadowColor: '#000' }]}>
          <View style={[s.handle, { backgroundColor: c.line }]} />
          <T v="h2" accessibilityRole="header">
            Today’s routine
          </T>
          <T v="small" tone="muted">
            Skip what does not fit today. This is for today only, and anything you already did stays counted.
          </T>
          <View style={{ gap: 2 }}>
            {ROUTINE.map((x) => (
              <OnOff
                key={x.k}
                name={x.name}
                sub={x.sub}
                on={routineOn(st, p, x.k)}
                onPick={(on) => update((s0) => ({ ...s0, days: routineDay(s0.days, s0.settings!, tk, x.k, on) }))}
              />
            ))}
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              onClose();
              router.push({ pathname: '/settings', params: { open: 's-routine' } });
            }}
            style={{ minHeight: 40, justifyContent: 'center', alignSelf: 'center' }}>
            <Text style={{ fontFamily: font.bodySemi, fontSize: 15, color: c.accentText, textDecorationLine: 'underline' }}>
              Change my usual routine in Settings
            </Text>
          </Pressable>
          <Button label="Done" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  stop: { flexDirection: 'row', gap: 8 },
  stopIn: { flex: 1, paddingVertical: 4 },
  rail: { width: RAIL, alignItems: 'center' },
  mark: { width: MARK, height: MARK, borderRadius: MARK / 2, alignItems: 'center', justifyContent: 'center', marginVertical: 2 },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 116,
    paddingVertical: 14,
    paddingLeft: 16,
    paddingRight: 12,
    borderRadius: 20,
    overflow: 'hidden',
  },
  heroEb: { fontFamily: font.bodySemi, fontSize: 13, lineHeight: 18 },
  heroT: { fontFamily: font.display, fontSize: 22, lineHeight: 27 },
  heroGoT: { fontFamily: font.display, fontSize: 17, lineHeight: 22 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 },
  rowT: { flex: 1, fontFamily: font.bodySemi, fontSize: 15, lineHeight: 20 },
  rowS: { fontFamily: font.body, fontSize: 13 },
  foot: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 24, paddingLeft: RAIL + 8, paddingRight: 4 },
  change: { minHeight: 44, justifyContent: 'center' },
  changeT: { fontFamily: font.bodySemi, fontSize: 15 },
  wrap: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  sheet: {
    alignSelf: 'stretch',
    maxWidth: 560,
    width: '100%',
    marginHorizontal: 'auto',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 18,
    paddingTop: 10,
    gap: 12,
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
  handle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, marginBottom: 2 },
});
