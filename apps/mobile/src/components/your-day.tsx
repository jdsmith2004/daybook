/* "Your day" on Today: the home screen's spine, one line down the page from morning to night (core: stopTiles in day.ts). What is
   next is the one big bright card on the line, and its tap starts it; the other stops are slim rows beside the line, so there is
   never a question of what to do. The part of the day already done is the squiggle (docs/design-standards.md: squiggle means
   progress), the rest quiet dashes. Every stop opens its moment with one tap, at any time: the lesson, the check-in (app/checkin.tsx)
   and the wind-down (app/wind.tsx). When a bigger moment has the next step (core pickMoment, moment-card.tsx), its card sits above and
   the stops here are all rows. "Change" turns parts of today on or off, in a sheet. */
import { openTile, ROUTINE, routineChanged, routineDay, routineOn, stopTiles, type Moment, type Snapshot, type StopGo, type StopTile } from '@daybook/core';
import { router, useIsFocused } from 'expo-router';
import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Text } from '@/components/text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OnOff } from '@/components/form';
import { Shape, SQUIGGLE, squigglePath, SVG_HIDE, useClock, type ShapeKind } from '@/components/shapes';
import { Button, Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { useReducedMotion } from '@/lib/motion';
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
  note,
}: {
  snap: Snapshot;
  tk: string;
  now: number;
  hero?: Moment | null;
  foot?: string;
  footOff?: boolean;
  /** a quiet line under the big card, or above the rows when there is no big card */
  note?: React.ReactNode;
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
  const heroShown = !!hero && r.tiles.some((t) => t.k === heroKey && !t.done);
  const big = heroShown ? heroKey : null;
  return (
    <View>
      {heroShown ? null : <View style={s.noteTop}>{note}</View>}
      {n ? (
        <Stops tiles={r.tiles} big={big} hero={hero} note={note} tileOf={(t) => (open && open.k === t.k && !t.done ? open : t)} />
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

/* the stops on their line: the big card for what is next, slim rows for the rest */
function Stops({
  tiles,
  big,
  hero,
  note,
  tileOf = (t) => t,
}: {
  tiles: StopTile[];
  big: string | null;
  hero?: BigCard | null;
  note?: React.ReactNode;
  tileOf?: (t: StopTile) => StopTile;
}) {
  const n = tiles.length;
  /* where each stop's card sits, so its mark sits at the card's middle and the line runs from mark to mark */
  const [rowY, setRowY] = useState<Record<string, number>>({});
  const [cardMid, setCardMid] = useState<Record<string, number>>({});
  return (
    <View>
      <DayLine tiles={tiles} mids={tiles.map((t) => (rowY[t.k] != null && cardMid[t.k] != null ? rowY[t.k] + cardMid[t.k] : null))} curKey={big} />
      {tiles.map((t, i) => {
        const tile = tileOf(t);
        const isBig = big === t.k;
        return (
          <View
            key={t.k}
            onLayout={(e) => put(setRowY, t.k, e.nativeEvent.layout.y)}
            style={[s.stop, !i && { paddingTop: 0 }, i === n - 1 && { paddingBottom: 0 }]}>
            <View onLayout={(e) => put(setCardMid, t.k, e.nativeEvent.layout.y + e.nativeEvent.layout.height / 2)}>
              {isBig ? <Hero m={hero!} t={tile} /> : <Row t={tile} />}
            </View>
            {isBig && note ? <View style={s.note}>{note}</View> : null}
          </View>
        );
      })}
    </View>
  );
}

/** Your day as a picture, for the tour in setup: drawn with the real parts, so it always looks like Today. A picture: nothing in it is a button. */
export function DayPicture({ wind }: { wind: string }) {
  const stop = (k: string, sky: StopTile['sky'], ic: string, title: string, right: string, go: StopGo): StopTile => ({
    k,
    state: 'later' as StopTile['state'],
    done: false,
    cur: k === 'lesson',
    sky,
    ic,
    title,
    line: '',
    right,
    eyebrow: '',
    head: '',
    body: '',
    chips: [],
    btn: '',
    go,
  });
  return (
    <View
      pointerEvents="none"
      accessible
      accessibilityRole="image"
      accessibilityLabel="Your day on Today: a lesson first, then a check-in, then a wind-down, one line down the page.">
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Stops
          tiles={[
            stop('lesson', 'sun', 'book', 'Lesson', '', 'lesson'),
            stop('evening', 'sky', 'pencil', 'Check-in', '1 minute', 'checkin'),
            stop('night', 'night', 'moon', 'Wind-down', wind, 'wind'),
          ]}
          big="lesson"
          hero={{ eb: 'Lesson 1 · 1–5 min', h: 'One short lesson', btn: 'Start', go: 'lesson' }}
        />
      </View>
    </View>
  );
}

/* ---------- the line down the left, with each stop's mark on it ---------- */
const RAIL = 24;
const MARK = 20;
/* the air between a dashed stretch and a mark */
const AIR = 4;
/* the dashes of the part still to come: short and round. The gap is fitted to each stretch, so a whole dash starts and ends it, never a cut one. */
const DASH = { stroke: 4, long: 8, gap: 6 };
function dashed(from: number, to: number) {
  const cap = DASH.stroke / 2;
  const len = to - from - DASH.stroke;
  const n = Math.max(1, Math.round((to - from + DASH.gap) / (DASH.long + DASH.gap)));
  const on = DASH.long - DASH.stroke;
  const off = n > 1 ? (len - n * on) / (n - 1) : len;
  return { d: `M${RAIL / 2} ${from + cap} L${RAIL / 2} ${to - cap}`, dash: `${on} ${off}` };
}
const put = (set: React.Dispatch<React.SetStateAction<Record<string, number>>>, k: string, v: number) => set((o) => (o[k] === v ? o : { ...o, [k]: v }));

/* one drawing for the whole line: each stretch runs from one mark to the next, the squiggle where that stop is done (docs/design-standards.md:
   squiggle means progress), quiet dashes where the day is still to come. The squiggle starts under a done mark, which is solid, and lands
   flat, so it never meets anything mid-wiggle. */
function DayLine({ tiles, mids, curKey }: { tiles: StopTile[]; mids: (number | null)[]; curKey: string | null }) {
  const c = useTheme();
  const focused = useIsFocused();
  const reduce = useReducedMotion();
  const sec = useClock(!reduce && focused && tiles.some((t) => t.done));
  if (mids.some((m) => m == null)) return null;
  const at = mids as number[];
  const x = RAIL / 2;
  const solid = (i: number) => tiles[i].done || tiles[i].cur || tiles[i].k === curKey;
  return (
    <View style={s.rail} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={RAIL} height={at[at.length - 1] + MARK} {...SVG_HIDE}>
        {tiles.slice(0, -1).map((t, i) => {
          const end = at[i + 1] - (solid(i + 1) ? 0 : MARK / 2 + AIR);
          if (t.done) {
            const d = squigglePath(
              [
                [x, at[i]],
                [x, end],
              ],
              0,
              end - at[i],
              SQUIGGLE.amp,
              SQUIGGLE.wavelength,
              sec * SQUIGGLE.speed * Math.PI * 2,
            );
            return <Path key={t.k} d={d} stroke={c.sun2} strokeWidth={SQUIGGLE.stroke} strokeLinecap="round" strokeLinejoin="round" fill="none" />;
          }
          const q = dashed(at[i] + MARK / 2 + AIR, at[i + 1] - MARK / 2 - AIR);
          return <Path key={t.k} d={q.d} stroke={c.line} strokeWidth={DASH.stroke} strokeLinecap="round" strokeDasharray={q.dash} fill="none" />;
        })}
      </Svg>
      {tiles.map((t, i) => (
        <View
          key={t.k}
          style={[
            s.mark,
            { top: at[i] - MARK / 2 },
            t.done ? { backgroundColor: c.mint } : solid(i) ? { backgroundColor: c.sun2 } : { borderWidth: 3, borderColor: c.line },
          ]}>
          {t.done ? <Icon name="check" size={13} color={c.scheme === 'dark' ? '#06352A' : '#FFFFFF'} /> : null}
        </View>
      ))}
    </View>
  );
}

/* ---------- what is next: the one big bright card, the whole card one tap, with its word on a sticker ---------- */
const PILL: Partial<Record<string, string>> = { review: 'Start', week: 'See it', pattern: 'See it', back: 'Fill in' };
type BigCard = Pick<Moment, 'eb' | 'h' | 'btn' | 'go'>;
function Hero({ m, t }: { m: BigCard; t: StopTile }) {
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
  stop: { paddingLeft: RAIL + 8, paddingVertical: 4 },
  note: { marginTop: 8 },
  noteTop: { marginBottom: 8 },
  rail: { position: 'absolute', left: 0, top: 0, width: RAIL },
  mark: { position: 'absolute', left: (RAIL - MARK) / 2, width: MARK, height: MARK, borderRadius: MARK / 2, alignItems: 'center', justifyContent: 'center' },
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
