/* "Your day" on Today: the day from morning to night (core: stopTiles in day.ts), a plain list with one row per stop, its
   icon in the color of its full-screen moment; a done one gets a check and says what was done. The band on the flame is the one owner of the next step
   and its button (finding 10 of October 30, 2026), so the open stop here is a plain row like the others; it opens the same
   thing as that band (core openTile).
   Every stop opens its moment with one tap, at any time:
   the lesson, the check-in (app/checkin.tsx) and the wind-down (app/wind.tsx). "Change" turns parts of today on or off, in
   a sheet. */
import { openTile, ROUTINE, routineChanged, routineDay, routineOn, stopTiles, type Snapshot, type StopGo, type StopTile } from '@daybook/core';
import { router } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OnOff } from '@/components/form';
import { Rows } from '@/components/link-card';
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
  const n = r.tiles.length;
  return (
    <View style={{ gap: 8, marginTop: 8 }}>
      <View style={s.head}>
        <T v="h2" accessibilityRole="header" style={{ flex: 1 }}>
          Your day
        </T>
        {n ? (
          <T v="small" tone="muted">
            {r.done + ' of ' + n}
          </T>
        ) : null}
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
        <T v="small" tone="muted">
          {changed + (changed === 1 ? ' part' : ' parts') + ' changed for today.'}
        </T>
      ) : null}
      {n ? (
        <Rows>
          {r.tiles.map((t) => (
            <StopRow key={t.k} t={open && open.k === t.k && !t.done ? open : t} />
          ))}
        </Rows>
      ) : (
        <T tone="muted">Nothing is switched on for today. Tap Change to turn parts of the day back on.</T>
      )}
      <RoutineSheet open={sheet} onClose={() => setSheet(false)} snap={snap} tk={tk} />
    </View>
  );
}

/* ---------- a stop that is not open: one line ---------- */
function StopRow({ t }: { t: StopTile }) {
  const c = useTheme();
  const L = lookOf(t.sky, c);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t.title + ': ' + t.line + '. ' + (t.done ? 'Done.' : t.right + '.') + ' Opens it.'}
      onPress={() => openStop(t.go, t.id)}
      style={({ pressed }) => [s.row, pressed && { opacity: 0.7 }]}>
      <Icon name={t.done ? 'check' : t.ic} size={22} color={t.done ? c.mintText : t.sky === 'night' ? c.accentText : L.ink} />
      <View style={[s.rowIn, { borderBottomColor: c.line }]}>
        <View style={{ flex: 1, gap: 1 }}>
          <T v="label">{t.title}</T>
          <T v="small" tone="muted">
            {t.line}
          </T>
        </View>
        {t.right ? <Text style={[s.right, { color: t.state === 'due' ? c.accentText : c.muted }]}>{t.right}</Text> : null}
        <Icon name="next" size={16} color={c.muted} />
      </View>
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
            <Text style={{ fontFamily: font.bodySemi, color: c.accentText, textDecorationLine: 'underline' }}>Change my usual routine in Settings</Text>
          </Pressable>
          <Button label="Done" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 4 },
  change: { minHeight: 44, justifyContent: 'center' },
  changeT: { fontFamily: font.bodySemi, fontSize: 15 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingLeft: 16 },
  rowIn: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 60, paddingVertical: 10, paddingRight: 14, borderBottomWidth: 1 },
  right: { fontFamily: font.bodyMedium, fontSize: 13, textAlign: 'right', maxWidth: 110 },
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
