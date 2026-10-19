/* "Your day" on Today: the day as a path from morning to night (core: stopTiles in day.ts). Each stop has the color of its
   full-screen moment. The open one is a tile with a few words and its button; the others are one line each, and a done one
   says what was done. Every stop opens its moment with one tap, at any time: Last night (app/morning.tsx), the lesson, the
   check-in (app/checkin.tsx) and the wind-down (app/wind.tsx). "Change" turns parts of today on or off, in a sheet. */
import { pathNote, ROUTINE, routineChanged, routineDay, routineOn, stopTiles, type Snapshot, type StopGo, type StopTile } from '@daybook/core';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Fragment, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OnOff } from '@/components/form';
import { Button, Card, Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { useStore } from '@/lib/store';
import { font, nightInk, skies, useTheme, type Palette } from '@/lib/theme';

/** open a stop's moment */
export function openStop(go: StopGo, id?: string) {
  buzz('tap');
  if (go === 'lesson') {
    if (id) router.push({ pathname: '/lesson/[id]', params: { id } });
    return;
  }
  router.push(go === 'morning' ? '/morning' : go === 'checkin' ? '/checkin' : '/wind');
}
/** Next up names a stop by its key (morning, evening, night; the lesson opens itself) */
export function openStopKey(k: string) {
  openStop(k === 'morning' ? 'morning' : k === 'evening' ? 'checkin' : 'wind');
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
  const note = pathNote(snap.days, st, tk);
  const changed = routineChanged(st, snap.days[tk]?.p);
  const [sheet, setSheet] = useState(false);
  const n = r.tiles.length;
  return (
    <Card>
      <View style={s.head}>
        <T v="h2" accessibilityRole="header" style={{ flex: 1 }}>
          Your day
        </T>
        {n ? (
          <View style={s.pips} accessible accessibilityLabel={r.done + ' of ' + n + ' done'}>
            {r.tiles.map((t) => (
              <View key={t.k} style={[s.pip, { backgroundColor: t.done ? c.mint : t.cur ? c.accent : c.line }]} />
            ))}
          </View>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Change today’s routine"
          hitSlop={8}
          onPress={() => {
            buzz('tap');
            setSheet(true);
          }}
          style={({ pressed }) => [s.change, { backgroundColor: c.surface2, opacity: pressed ? 0.75 : 1 }]}>
          <Icon name="sliders" size={15} color={c.accentText} />
          <Text style={[s.changeT, { color: c.accentText }]}>Change</Text>
        </Pressable>
      </View>
      {changed || note ? (
        <T v="small" tone="muted">
          {changed ? changed + (changed === 1 ? ' part' : ' parts') + ' changed for today.' : note}
        </T>
      ) : null}
      {n ? (
        <View>
          {r.tiles.map((t, i) => (
            <Fragment key={t.k}>
              {i ? <View style={[s.link, { backgroundColor: r.tiles[i - 1].done ? c.mint : c.line }]} /> : null}
              {t.cur ? <OpenTile t={t} /> : <StopRow t={t} />}
            </Fragment>
          ))}
        </View>
      ) : (
        <T tone="muted">Nothing is switched on for today. Tap Change to turn parts of the day back on.</T>
      )}
      <RoutineSheet open={sheet} onClose={() => setSheet(false)} snap={snap} tk={tk} />
    </Card>
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
      <View style={[s.ic, { backgroundColor: L.soft }]}>
        <Icon name={t.ic} size={22} color={L.ink} />
        {t.done ? (
          <View style={[s.badge, { backgroundColor: c.mint, borderColor: c.surface }]}>
            <Icon name="check" size={11} color={c.scheme === 'dark' ? '#06352A' : '#FFFFFF'} />
          </View>
        ) : null}
      </View>
      <View style={{ flex: 1, gap: 1 }}>
        <T v="label">{t.title}</T>
        <T v="small" tone="muted">
          {t.line}
        </T>
      </View>
      {t.right ? <Text style={[s.right, { color: t.state === 'due' ? c.accentText : c.muted }]}>{t.right}</Text> : null}
      <Icon name="next" size={16} color={c.muted} />
    </Pressable>
  );
}

/* ---------- the open stop: a window into its moment, with its button on it ---------- */
function OpenTile({ t }: { t: StopTile }) {
  const c = useTheme();
  const L = lookOf(t.sky, c);
  const deep = c.scheme === 'dark' || t.sky === 'night';
  const ink = deep ? nightInk.ink : c.ink;
  const soft = deep ? '#E6DEFF' : c.muted;
  const eb = t.sky === 'night' ? '#FFE27A' : L.ink;
  const [a, b] = skies[c.scheme][t.sky];
  return (
    <View style={[s.tile, { shadowColor: c.lip }]}>
      <LinearGradient colors={[a, b]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <Deco sky={t.sky} />
      <Text style={[s.eb, { color: eb }, (t.sky === 'sun' || t.sky === 'night') && s.ebRoom]}>{t.eyebrow.toUpperCase()}</Text>
      <Text style={[s.tHead, { color: ink }]} accessibilityRole="header">
        {t.head}
      </Text>
      {t.body ? <Text style={[s.tBody, { color: soft }]}>{t.body}</Text> : null}
      <View style={s.chips}>
        {t.chips.filter(Boolean).map((x) => (
          <View key={x} style={[s.chip, { backgroundColor: deep ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.7)' }]}>
            <Text style={[s.chipT, { color: ink }]}>{x}</Text>
          </View>
        ))}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t.btn + ': ' + t.title}
        onPress={() => openStop(t.go, t.id)}
        style={({ pressed }) => [
          s.btn,
          {
            backgroundColor: L.btn,
            shadowColor: 'rgba(0,0,0,0.28)',
            transform: [{ translateY: pressed ? 3 : 0 }],
            shadowOffset: { width: 0, height: pressed ? 1 : 4 },
          },
        ]}>
        <Text style={[s.btnT, { color: L.onBtn }]}>{t.btn}</Text>
      </Pressable>
    </View>
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
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pips: { flexDirection: 'row', gap: 4 },
  pip: { width: 16, height: 6, borderRadius: 3 },
  change: { flexDirection: 'row', alignItems: 'center', gap: 5, minHeight: 34, paddingHorizontal: 11, borderRadius: 999 },
  changeT: { fontFamily: font.bodySemi, fontSize: 14 },
  link: { width: 3, height: 12, borderRadius: 2, marginLeft: 22.5 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, paddingVertical: 2 },
  ic: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    right: -3,
    bottom: -3,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  right: { fontFamily: font.bodySemi, fontSize: 13.5, textAlign: 'right', maxWidth: 110 },
  tile: {
    borderRadius: 22,
    padding: 16,
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
  tHead: { fontFamily: font.display, fontSize: 25, lineHeight: 30, paddingRight: 56 },
  tBody: { fontFamily: font.bodyMedium, fontSize: 15.5, lineHeight: 21 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingHorizontal: 11, paddingVertical: 5, borderRadius: 999 },
  chipT: { fontFamily: font.bodySemi, fontSize: 13.5 },
  btn: { minHeight: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 2, shadowOpacity: 1, shadowRadius: 0, elevation: 2 },
  btnT: { fontFamily: font.bodyBold, fontSize: 17 },
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
