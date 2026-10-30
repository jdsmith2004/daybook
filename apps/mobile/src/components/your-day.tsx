/* "Your day" on Today: one line from morning to night (core: stopTiles in day.ts) with a stop for each part, in the color of its
   full-screen moment. The part of the day already done is the squiggle (docs/design-standards.md: squiggle means progress), the
   rest a quiet line, so the day fills as it is lived. A stop says when it opens, or that it is done; the next step's words stay in
   the band on the flame, the one owner of the next step and its button (finding 10 of October 30, 2026). Every stop opens its
   moment with one tap, at any time: the lesson, the check-in (app/checkin.tsx) and the wind-down (app/wind.tsx); the open one
   opens the same thing as that band (core openTile). "Change" turns parts of today on or off, in a sheet. */
import { openTile, ROUTINE, routineChanged, routineDay, routineOn, stopTiles, type Snapshot, type StopGo, type StopTile } from '@daybook/core';
import { router, useIsFocused } from 'expo-router';
import { useState } from 'react';
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

export function YourDay({ snap, tk, now }: { snap: Snapshot; tk: string; now: number }) {
  const c = useTheme();
  const st = snap.settings!;
  const r = stopTiles(snap.days, st, tk, now);
  const account = useAccount();
  /* the stop that is next, as the card at the top opens it (a re-read in place of a lesson that waits behind an account) */
  const open = openTile(snap.days, st, tk, now, !!account);
  const changed = routineChanged(st, snap.days[tk]?.p);
  const [sheet, setSheet] = useState(false);
  const [width, setWidth] = useState(0);
  const n = r.tiles.length;
  /* how far the squiggle has come: to the last stop done in a row from the morning, and on toward the next */
  let run = 0;
  while (run < n && r.tiles[run].done) run++;
  const progress = !run || n < 2 ? 0 : Math.min(1, (run - 0.5) / (n - 1));
  const focused = useIsFocused();
  /* the line runs from the middle of the first stop to the middle of the last */
  const lineW = Math.max(0, width - width / Math.max(1, n));
  return (
    <View style={{ gap: 8, marginTop: 8 }}>
      <View style={s.head}>
        <T v="h2" accessibilityRole="header" style={{ flex: 1 }}>
          Your day
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
      {changed ? (
        <T v="small" tone="muted" style={{ paddingHorizontal: 4 }}>
          {changed + (changed === 1 ? ' part' : ' parts') + ' changed for today.'}
        </T>
      ) : null}
      {n ? (
        <View
          style={[s.path, { backgroundColor: c.surface }]}
          accessibilityRole="summary"
          accessibilityLabel={r.done + ' of ' + n + ' done'}
          onLayout={(e) => setWidth(e.nativeEvent.layout.width - PATH_PAD * 2)}>
          {n > 1 && lineW > 0 ? (
            <View style={[s.line, { left: PATH_PAD + width / n / 2 }]} pointerEvents="none">
              <WavyLine width={lineW} p={progress} color={c.sun2} track={c.line} speed={focused ? undefined : 0} />
            </View>
          ) : null}
          {r.tiles.map((t) => (
            <Stop key={t.k} t={open && open.k === t.k && !t.done ? open : t} />
          ))}
        </View>
      ) : (
        <T tone="muted" style={{ paddingHorizontal: 4 }}>
          Nothing is switched on for today. Tap Change to turn parts of the day back on.
        </T>
      )}
      <RoutineSheet open={sheet} onClose={() => setSheet(false)} snap={snap} tk={tk} />
    </View>
  );
}

/* ---------- a stop on the line: its shape, its name, and when ---------- */
const STOP_SHAPE: Partial<Record<StopTile['sky'], ShapeKind>> = { sky: 'cookie9', violet: 'cookie12', night: 'sunny', sun: 'flower' };
function Stop({ t }: { t: StopTile }) {
  const c = useTheme();
  const L = lookOf(t.sky, c);
  /* done: the color of a win. The one that is open now: its moment's full color. Later: its soft color. */
  const bg = t.done ? c.mint : t.cur ? L.btn : L.soft;
  const ink = t.done ? (c.scheme === 'dark' ? '#06352A' : '#FFFFFF') : t.cur ? L.onBtn : L.ink;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t.title + ': ' + t.line + '. ' + (t.done ? 'Done.' : t.right + '.') + ' Opens it.'}
      onPress={() => openStop(t.go, t.id)}
      style={({ pressed }) => [s.stop, pressed && { opacity: 0.7 }]}>
      <Shape kind={STOP_SHAPE[t.sky] || 'cookie9'} size={STOP} color={bg}>
        <Icon name={t.done ? 'check' : t.ic} size={24} color={ink} />
      </Shape>
      <T v="label" style={s.c} numberOfLines={1}>
        {t.title}
      </T>
      <Text style={[s.when, { color: t.done ? c.mintText : t.state === 'due' ? c.accentText : c.muted }]}>{t.done ? 'Done' : t.right}</Text>
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

/** a stop's shape, and the card's padding beside the stops */
const STOP = 56;
const PATH_PAD = 8;

const s = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 4 },
  change: { minHeight: 44, justifyContent: 'center' },
  changeT: { fontFamily: font.bodySemi, fontSize: 15 },
  path: { flexDirection: 'row', paddingVertical: 16, paddingHorizontal: PATH_PAD, borderRadius: 20 },
  line: { position: 'absolute', top: 16 + STOP / 2 - 6 },
  stop: { flex: 1, alignItems: 'center', gap: 2, minHeight: 44 },
  c: { textAlign: 'center', marginTop: 6 },
  when: { fontFamily: font.body, fontSize: 13, lineHeight: 18, textAlign: 'center' },
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
