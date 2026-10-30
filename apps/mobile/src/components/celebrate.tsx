/* Celebrations: a new form of the flame, a new badge. A plain level and a full ring are one short toast (core celSplit),
   since levels come every day or two and the hero's bar carries them. They wait their turn:
   they show only on the main tabs, never on top of a page, a sheet or a full-screen moment, so a hard moment is not interrupted. With celebrations off they are said in a
   quiet line instead. Anything that arrives right after a slip comes in quietly: no confetti, no buzz. Ported from the legacy
   celebrate, celNext and confetti.
   One at a time: everything that is waiting when the person comes back to the tabs shows as one sheet (the UX audit of
   October 27, 2026: after the first lesson and check-in, four sheets came in a row). The biggest win leads it (a new
   form, a level, then a badge), with the rest as rows under it, and one button. A tip ask can ride on it
   (core tipMoment), but never on the day the person came back, nor in the hours after an SOS or a slip
   (lib/quiet-asks.ts). A mistaken log taken back with Undo takes its waiting celebration with it (lib/store.tsx). A level
   reached on the day of a slip waits for the next day (core checkNew), and then says it was earned then. */
import { addDays, celSplit, celTitle, gameCompute, nextLine, type CelItem } from '@daybook/core';
import { usePathname } from 'expo-router';
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Text } from '@/components/text';

import { SHORT } from '@/components/fit';
import { Flame } from '@/components/flame';
import { FlameMedallion } from '@/components/flame-medallion';
import { Medal } from '@/components/medal';
import { MomentAsk, useTipMoment } from '@/components/support';
import { Button, Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { useQuietAsks } from '@/lib/quiet-asks';
import { useStore } from '@/lib/store';
import { font, toneOf, useTheme } from '@/lib/theme';

const NATIVE = Platform.OS !== 'web';
/* the flame on a sheet: big, and a little less on a short phone, so the sheet and its button still fit */
const ART = SHORT ? 150 : 190;
const SCENES = /^\/(sos|tool|log|checkin|talk|review|wind|night|lesson|lwrite|setup)(\/|$)/;
/** the main tabs: a celebration shows only there, never over a page the person is busy on */
const TABS = /^\/(pattern|learn|more)?$/;

/** a badge: a round medal in its color, or a dashed lock while it is not earned yet */
/* a stop that is half answered (Last night between its two taps) holds celebrations, so a level-up never covers the next
   question; they show once it is finished */
let holds = 0;
const holdSubs = new Set<() => void>();
const holdSub = (f: () => void) => (holdSubs.add(f), () => void holdSubs.delete(f));
export function useHoldCelebrations(on: boolean) {
  useEffect(() => {
    if (!on) return;
    holds++;
    holdSubs.forEach((f) => f());
    return () => {
      holds--;
      holdSubs.forEach((f) => f());
    };
  }, [on]);
}

/* whether a celebration is open or waiting its turn, so Today can let the flame grow once the person has closed it */
let busy = false;
const busySubs = new Set<() => void>();
const busySub = (f: () => void) => (busySubs.add(f), () => void busySubs.delete(f));
/* when a sheet last opened, so Today's day-feel question never comes on an open that already showed one */
let sheetAt = 0;
export const celebrationSheetAt = () => sheetAt;
export const useCelebrating = () =>
  useSyncExternalStore(
    busySub,
    () => busy,
    () => false,
  );

export function CelebrateHost() {
  const { snap, hooks } = useStore();
  const path = usePathname();
  const [queue, setQueue] = useState<CelItem[]>([]);
  /* the sheet that is open: everything that was waiting, as one */
  const [cur, setCur] = useState<CelItem[] | null>(null);
  const [boom, setBoom] = useState<{ n: number; big: boolean } | null>(null);
  const pathRef = useRef(path);
  pathRef.current = path;
  const st = snap.settings;
  const stRef = useRef(st);
  stRef.current = st;
  const sayRef = useRef<(m: string) => void>(() => undefined);
  sayRef.current = useStore().say;

  useEffect(() => {
    hooks.current = {
      inScene: () => SCENES.test(pathRef.current),
      onCelebrate: (items) => {
        if (stRef.current && stRef.current.celebrate === false) {
          sayRef.current(items.map(celTitle).join(' · '));
          return;
        }
        setQueue((q) => q.concat(items));
      },
      onTakeBack: (badges, level) => {
        const keep = (it: CelItem) => !(it.type === 'badge' && badges.indexOf(it.b.id) >= 0) && !(level && it.type === 'level');
        setQueue((q) => q.filter(keep));
        setCur((g) => {
          if (!g) return g;
          const left = g.filter(keep);
          return left.length ? left : null;
        });
      },
    };
  }, [hooks]);

  const held = useSyncExternalStore(
    holdSub,
    () => holds > 0,
    () => false,
  );
  /* after a hold ends, a short pause so the finished stop folds shut before a celebration comes up */
  const [settling, setSettling] = useState(false);
  const wasHeld = useRef(held);
  useEffect(() => {
    if (wasHeld.current && !held) {
      setSettling(true);
      const t = setTimeout(() => setSettling(false), 550);
      wasHeld.current = held;
      return () => clearTimeout(t);
    }
    wasHeld.current = held;
  }, [held]);
  const blocked = !TABS.test(path) || held || settling;
  /* the next one, when nothing is open */
  useEffect(() => {
    if (cur || blocked || !queue.length) return;
    const { sheet, toast } = celSplit(queue);
    setQueue([]);
    if (toast) sayRef.current(toast);
    if (!sheet.length) return;
    const group = lead(sheet);
    sheetAt = Date.now();
    setCur(group);
    const quiet = group.some((it) => !!it.quiet || (it.type === 'badge' && it.b.id === 'honest'));
    const big = group.some((it) => it.type === 'level');
    if (!quiet) {
      setBoom({ n: Date.now(), big });
      buzz(big ? 'lit' : 'save');
    } else setBoom(null);
  }, [cur, blocked, queue]);

  useEffect(() => {
    busy = !!cur || celSplit(queue).sheet.length > 0;
    busySubs.forEach((f) => f());
  }, [cur, queue]);

  if (!cur || !st) return null;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close"
        style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(20,16,50,0.5)' }]}
        onPress={() => setCur(null)}
      />
      {boom ? <Confetti key={boom.n} big={boom.big} /> : null}
      <View style={s.center} pointerEvents="box-none">
        <Card key={JSON.stringify(cur).slice(0, 120)} group={cur} more={queue.length > 0} onClose={() => setCur(null)} />
      </View>
    </View>
  );
}

/** the order a sheet leads with: a new form, then the badges in the order they came, and a plain level as a row */
const RANK: Record<CelItem['type'], number> = { level: 3.5, perfect: 2, badge: 3, quest: 4, more: 5 };
function lead(items: CelItem[]): CelItem[] {
  return items
    .filter((it) => it.type !== 'quest')
    .map((it, i) => ({ it, i, r: it.type === 'level' && (it.evolve || !it.from) ? 0 : RANK[it.type] }))
    .sort((a, b) => a.r - b.r || a.i - b.i)
    .map((x) => x.it);
}
/** the rows under the lead, at most this many; the rest are counted in one line */
const ROWS = 3;

function Card({ group, more, onClose }: { group: CelItem[]; more: boolean; onClose: () => void }) {
  const c = useTheme();
  const { snap, tk } = useStore();
  const quietAsks = useQuietAsks();
  const it = group[0];
  const rest = group.slice(1).filter((x) => x.type !== 'more');
  const extra = group.slice(1).reduce((n, x) => n + (x.type === 'more' ? Number(/\d+/.exec(x.title || '')?.[0] || 0) : 0), 0) + Math.max(0, rest.length - ROWS);
  let art: React.ReactNode = null;
  let eyebrow = '';
  let title = '';
  let sub = '';
  if (it.type === 'level') {
    const L = it.level;
    art = it.evolve ? <Evolve from={it.from || Math.max(1, L.n - 1)} to={L.n} /> : <FlameMedallion level={L.n} size={ART} />;
    eyebrow = it.evolve ? 'New form' : 'Level up';
    title = 'Level ' + L.n + ': ' + L.name;
    /* a level reached on the day of a slip waits for the next day (core checkNew): it says it was earned then */
    const held =
      !!snap.settings &&
      (snap.days[addDays(tk, -1)]?.events || []).some((e) => e.outcome === 'slipped') &&
      gameCompute(snap.days, snap.settings, snap.reviews, addDays(tk, -1)).level.n >= L.n;
    sub =
      (held ? 'Earned yesterday. Every honest log feeds the flame. ' : '') +
      (it.evolve ? L.meaning : L.step) +
      ' ' +
      (L.next == null ? 'This is as bright as it gets. Keep shining.' : nextLine(L));
  } else if (it.type === 'badge') {
    art = <Medal id={it.b.id} icon={it.b.icon} tone={it.b.tone} size={132} earned />;
    eyebrow = it.b.id === 'honest' ? 'Honesty' : rest.length ? 'New badges' : 'New badge';
    title = it.b.name;
    sub = it.b.desc;
  } else if (it.type === 'perfect') {
    const lvl = snap.settings ? gameCompute(snap.days, snap.settings, snap.reviews, tk).level.n : 1;
    art = <FlameMedallion level={Math.max(1, lvl)} size={ART} />;
    eyebrow = 'Full ring';
    title = 'All ' + it.n + ' wins today';
    sub = 'That is a full day of looking after yourself. Rest well.';
  } else if (it.type === 'more') {
    title = it.title || 'Nice';
    sub = it.sub || '';
  }
  /* a new level or a new badge can carry a short tip ask (core tipMoment); the preview in Settings (from 0) never does,
     nor a sheet after a slip, on the day the person came back, or in the hours after an SOS */
  const quiet = group.some((x) => !!x.quiet);
  const why =
    !more && !quiet && !quietAsks
      ? group.some((x) => x.type === 'level' && x.from > 0)
        ? 'level'
        : group.some((x) => x.type === 'badge' && x.b.id !== 'honest')
          ? 'badge'
          : null
      : null;
  const ask = useTipMoment(why || 'level', !why);
  const scale = useRef(new Animated.Value(0.85)).current;
  useEffect(() => {
    Animated.spring(scale, { toValue: 1, friction: 6, tension: 120, useNativeDriver: NATIVE }).start();
  }, [scale]);
  return (
    <Animated.View accessibilityViewIsModal accessibilityLiveRegion="assertive" style={[s.card, { backgroundColor: c.surface, transform: [{ scale }] }]}>
      {art}
      {eyebrow ? (
        <T v="eyebrow" tone="accentText" style={{ marginTop: 6 }}>
          {eyebrow}
        </T>
      ) : null}
      <Text style={[s.h, { color: c.ink }]} accessibilityRole="header">
        {title}
      </Text>
      {sub ? (
        <T tone="muted" style={{ textAlign: 'center' }}>
          {sub}
        </T>
      ) : null}
      {rest.length ? (
        <View style={[s.rows, { borderColor: c.line }]} accessibilityLabel={'And: ' + rest.map(celTitle).join(', ')}>
          {rest.slice(0, ROWS).map((x, i) => (
            <Row key={i} it={x} />
          ))}
        </View>
      ) : null}
      {extra > 0 ? (
        <T v="small" tone="muted" style={{ textAlign: 'center' }}>
          {'And ' + extra + ' more in Milestones.'}
        </T>
      ) : null}
      {ask && why ? <MomentAsk why={why} onGo={onClose} center /> : null}
      <View style={{ alignSelf: 'stretch', marginTop: 4 }}>
        <Button label={more ? 'Next' : 'Nice'} onPress={onClose} />
      </View>
    </Animated.View>
  );
}

/** one more win in the same sheet: a small picture and its name */
function Row({ it }: { it: CelItem }) {
  const c = useTheme();
  const art =
    it.type === 'badge' ? (
      <Medal id={it.b.id} icon={it.b.icon} tone={it.b.tone} size={44} earned />
    ) : it.type === 'level' ? (
      <Flame level={it.level.n} size={40} />
    ) : (
      <Icon name="star" size={22} color={c.sunText} />
    );
  const name = it.type === 'badge' ? it.b.name : celTitle(it);
  const desc = it.type === 'badge' ? it.b.desc : it.type === 'level' ? it.level.step : '';
  return (
    <View style={s.row}>
      {art}
      <View style={{ flex: 1, gap: 1 }}>
        <Text style={[s.rowT, { color: c.ink }]}>{name}</Text>
        {desc ? (
          <Text style={[s.rowS, { color: c.muted }]} numberOfLines={2}>
            {desc}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

/* a new form: the old one flares up, bursts into light, and gives way to the new one */
function Evolve({ from, to }: { from: number; to: number }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 1100, delay: 250, easing: Easing.inOut(Easing.cubic), useNativeDriver: NATIVE }).start();
  }, [v]);
  return (
    <View style={{ width: ART, height: ART }}>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            opacity: v.interpolate({ inputRange: [0, 0.6, 1], outputRange: [1, 0.4, 0] }),
            transform: [{ scale: v.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.15, 0.8] }) }],
          },
        ]}>
        <FlameMedallion level={from} size={ART} />
      </Animated.View>
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: ART / 2,
            backgroundColor: '#FFF3B0',
            opacity: v.interpolate({ inputRange: [0, 0.45, 0.6, 1], outputRange: [0, 0, 0.85, 0] }),
            transform: [{ scale: v.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.4, 1.1, 1.7] }) }],
          },
        ]}
      />
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: v, transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }] }]}>
        <FlameMedallion level={to} size={ART} />
      </Animated.View>
    </View>
  );
}

/* confetti: a burst from the middle, falling under gravity, or with `rain`, a shower falling from the top across the whole
   width, each piece swaying as it drifts down (the end of the setup). Skipped when the phone asks for less motion. */
export function Confetti({ big, rain }: { big: boolean; rain?: boolean }) {
  const c = useTheme();
  const { width: W, height: H } = useWindowDimensions();
  const t = useRef(new Animated.Value(0)).current;
  const [on, setOn] = useState(true);
  const parts = useMemo(() => {
    const cols = [c.sun, c.sun2, c.accent, c.mint, c.violet, c.coral];
    const n = big ? 90 : 50;
    if (rain)
      return Array.from({ length: n }, (_, i) => {
        /* a start above the top, so the pieces arrive one after another, and a fall a little past the bottom */
        const y0 = -20 - Math.random() * H * 0.9;
        const fall = H + 40 - y0;
        const sway = 10 + Math.random() * 18;
        const ph = Math.random() * Math.PI * 2;
        const pts = [0, 0.25, 0.5, 0.75, 1].map((f) => ({ x: Math.sin(ph + f * Math.PI * 3) * sway, y: f * fall }));
        return {
          x0: Math.random() * W,
          y0,
          s: 6 + Math.random() * 6,
          c: cols[i % cols.length],
          pts,
          r: (Math.random() - 0.5) * 14,
          round: i % 3 === 1,
        };
      });
    return Array.from({ length: n }, (_, i) => {
      const vx = (Math.random() - 0.5) * (big ? 12 : 9);
      const vy = -Math.random() * (big ? 13 : 10) - 4;
      const g = 0.3 + Math.random() * 0.12;
      const frames = 100;
      const pts = [0, 0.25, 0.5, 0.75, 1].map((f) => {
        const k = f * frames;
        return { x: vx * k * 0.96, y: vy * k + 0.5 * g * k * k };
      });
      return {
        x0: W / 2 + (Math.random() - 0.5) * W * 0.45,
        y0: H * 0.36,
        s: 5 + Math.random() * 6,
        c: cols[i % cols.length],
        pts,
        r: (Math.random() - 0.5) * 10,
        round: i % 3 === 1,
      };
    });
  }, [big, rain, W, H, c]);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((r) => {
        if (!alive) return;
        if (r) {
          setOn(false);
          return;
        }
        Animated.timing(t, { toValue: 1, duration: rain ? 4200 : 1800, easing: Easing.linear, useNativeDriver: NATIVE }).start(() => alive && setOn(false));
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [t, rain]);
  if (!on) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {parts.map((p, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            left: p.x0,
            top: p.y0,
            width: p.s,
            height: p.round ? p.s : p.s * 0.6,
            borderRadius: p.round ? p.s / 2 : 1,
            backgroundColor: p.c,
            opacity: t.interpolate({ inputRange: [0, rain ? 0.85 : 0.75, 1], outputRange: [1, 1, 0] }),
            transform: [
              { translateX: t.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: p.pts.map((q) => q.x) }) },
              { translateY: t.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: p.pts.map((q) => q.y) }) },
              { rotate: t.interpolate({ inputRange: [0, 1], outputRange: ['0rad', p.r + 'rad'] }) },
            ],
          }}
        />
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  center: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    gap: 8,
    paddingTop: 26,
    paddingHorizontal: 22,
    paddingBottom: 22,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 25,
    shadowOffset: { width: 0, height: 18 },
    elevation: 12,
  },
  rows: { alignSelf: 'stretch', gap: 10, marginTop: 6, paddingTop: 12, borderTopWidth: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowT: { fontFamily: font.bodySemi, fontSize: 15, lineHeight: 20 },
  rowS: { fontFamily: font.body, fontSize: 13, lineHeight: 18 },
  h: { fontFamily: font.display, fontSize: 28, lineHeight: 34, textAlign: 'center' },
});
