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
import { addDays, celSplit, celTitle, formWord, gameCompute, nextLine, type CelItem } from '@daybook/core';
import { usePathname } from 'expo-router';
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { Text } from '@/components/text';

import { SHORT } from '@/components/fit';
import { Flame } from '@/components/flame';
import { FlameMedallion } from '@/components/flame-medallion';
import { FutureInvite, useFutureInvite } from '@/components/future-invite';
import { Medal } from '@/components/medal';
import { MomentAsk, useTipMoment } from '@/components/support';
import { Button, Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { NATIVE, useReducedMotion } from '@/lib/motion';
import { useQuietAsks } from '@/lib/quiet-asks';
import { useFuture } from '@/lib/future';
import { useStore } from '@/lib/store';
import { font, toneOf, useTheme } from '@/lib/theme';

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
/** another moment that stands for a sheet on this open (What's new, lib/whats-new.ts) */
export const noteSheet = () => {
  sheetAt = Date.now();
};
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
    /* a new form knocks and lifts its embers itself, at the moment it changes (Evolve), not when the sheet opens */
    const grows = group[0].type === 'level' && group[0].evolve;
    if (grows) setBoom(null);
    else if (!quiet) {
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
  /* a new form: its words come once the flame has changed */
  const grows = it.type === 'level' && it.evolve;
  const still = useReducedMotion();
  const words = useRef(new Animated.Value(grows && !still ? 0 : 1)).current;
  const turn = () => Animated.timing(words, { toValue: 1, duration: 520, delay: 280, easing: Easing.out(Easing.cubic), useNativeDriver: NATIVE }).start();
  if (it.type === 'level') {
    const L = it.level;
    art = it.evolve ? <Evolve from={it.from || Math.max(1, L.n - 1)} to={L.n} quiet={!!it.quiet} onTurn={turn} /> : <FlameMedallion level={L.n} size={ART} />;
    eyebrow = it.evolve ? 'Level ' + L.n : 'Level up';
    title = it.evolve ? 'Your flame grew into ' + formWord(L.name) : 'Level ' + L.n + ': ' + L.name;
    /* a level reached on the day of a slip waits for the next day (core checkNew): it says it was earned then */
    const held =
      !!snap.settings &&
      (snap.days[addDays(tk, -1)]?.events || []).some((e) => e.outcome === 'slipped') &&
      gameCompute(snap.days, snap.settings, snap.reviews, addDays(tk, -1)).level.n >= L.n;
    sub =
      (held ? 'Earned yesterday. Every honest log feeds the flame. ' : '') +
      /* the moment it grows is about what it became, so no count to the next one here */
      (it.evolve
        ? L.meaning + ' You built it, one day at a time.'
        : L.step + ' ' + (L.next == null ? 'This is as bright as it gets. Keep shining.' : nextLine(L)));
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
  /* the one warm tip ask rides only on a new flame form (WP8, the owner's rule: at most one ask, at an earned moment, on a new
     form; core tipMoment); never the preview in Settings (from 0), a sheet after a slip, the day the person came back, or the
     hours after an SOS */
  const quiet = group.some((x) => !!x.quiet);
  const why = !more && !quiet && !quietAsks && group.some((x) => x.type === 'level' && x.from > 0 && x.evolve) ? 'level' : null;
  const ask = useTipMoment(why || 'level', !why);
  /* Future you: a new level or form, with no tip ask riding on it, can invite a note for the next hard moment. Never on a
     sheet after a slip, on the day the person came back, or in the hours after an SOS (the same quiet as the tip) */
  const lifted = !more && !quiet && !quietAsks && group.some((x) => x.type === 'level' && x.from > 0);
  const invite = useFutureInvite(!lifted || !!(ask && why));
  const firstNote = useFuture().notes.length === 0;
  const scale = useRef(new Animated.Value(still ? 1 : 0.85)).current;
  useEffect(() => {
    if (!still) Animated.spring(scale, { toValue: 1, friction: 6, tension: 120, useNativeDriver: NATIVE }).start();
  }, [scale, still]);
  const fade = { opacity: words, transform: [{ translateY: words.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] };
  return (
    <Animated.View accessibilityViewIsModal accessibilityLiveRegion="assertive" style={[s.card, { backgroundColor: c.surface, transform: [{ scale }] }]}>
      {art}
      <Animated.View style={[s.words, fade]}>
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
        {ask && why ? <MomentAsk why={why} onGo={onClose} center /> : invite ? <FutureInvite first={firstNote} onGo={onClose} /> : null}
      </Animated.View>
      <Animated.View style={{ alignSelf: 'stretch', marginTop: 4, opacity: words }}>
        <Button label={more ? 'Next' : grows ? 'Keep going' : 'Nice'} onPress={onClose} />
      </Animated.View>
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

/* a new form. The old flame is seen first, alive, so the person knows what it was; it gathers its light (the fire leaps,
   a soft knock, a lighter one), the light blooms out from its heart past the edge of its sky, and as it clears the new
   form is standing there, with the firm knock of a finished thing. A few embers lift off it. The words wait for it, so
   the change is seen first and read second. Under Reduce Motion the new form is there at once. */
const SEE = 650;
const GATHER = 1000;
const FLASH = 320;
/** the heart of the figure, as a share of the picture from the top: where the light gathers and the embers lift from */
const HEART = 0.56;
const GLOW_WARM =
  '<svg viewBox="0 0 100 100"><defs><radialGradient id="evWarm" cx="50" cy="50" r="50" gradientUnits="userSpaceOnUse">' +
  '<stop offset="0" stop-color="#FFD36B" stop-opacity="1"/><stop offset=".3" stop-color="#FFA24A" stop-opacity=".8"/>' +
  '<stop offset=".65" stop-color="#D2557E" stop-opacity=".3"/><stop offset="1" stop-color="#8A3F9E" stop-opacity="0"/></radialGradient></defs><circle cx="50" cy="50" r="50" fill="url(#evWarm)"/></svg>';
const LIGHT =
  '<svg viewBox="0 0 100 100"><defs><radialGradient id="evLight" cx="50" cy="50" r="50" gradientUnits="userSpaceOnUse">' +
  '<stop offset="0" stop-color="#FFFBEA" stop-opacity="1"/><stop offset=".3" stop-color="#FFF1BF" stop-opacity=".95"/>' +
  '<stop offset=".62" stop-color="#FFDD8A" stop-opacity=".45"/><stop offset="1" stop-color="#FFC861" stop-opacity="0"/>' +
  '</radialGradient></defs><circle cx="50" cy="50" r="50" fill="url(#evLight)"/></svg>';
/* the embers that lift off the new form: [x from the middle, rise, size, delay] as shares of the picture, placed by hand */
const EMBERS: [number, number, number, number][] = [
  [-0.16, 0.78, 0.04, 0],
  [0.12, 0.92, 0.032, 0.05],
  [-0.04, 1.05, 0.046, 0.09],
  [0.21, 0.7, 0.028, 0.15],
  [-0.24, 0.86, 0.026, 0.21],
  [0.05, 0.8, 0.034, 0.28],
  [0.17, 1.0, 0.026, 0.34],
  [-0.11, 0.95, 0.03, 0.42],
];
const EMBER_COL = ['#FFE27A', '#FFB547', '#FFF3B0', '#FF9F43'];

function Evolve({ from, to, quiet, onTurn }: { from: number; to: number; quiet?: boolean; onTurn: () => void }) {
  const still = useReducedMotion();
  const gather = useRef(new Animated.Value(0)).current;
  const light = useRef(new Animated.Value(0)).current;
  const land = useRef(new Animated.Value(still ? 1 : 0)).current;
  const rise = useRef(new Animated.Value(0)).current;
  const [turned, setTurned] = useState(false);
  /* the time starts once the sheet is on screen: its first drawing can take a moment, and the old form must be seen */
  const [shown, setShown] = useState(false);
  const turnRef = useRef(onTurn);
  turnRef.current = onTurn;
  useEffect(() => {
    if (!shown) return;
    if (still) {
      setTurned(true);
      land.setValue(1);
      turnRef.current();
      if (!quiet) buzz('lit');
      return;
    }
    const ts = [
      setTimeout(() => {
        if (!quiet) buzz('roll');
        Animated.timing(gather, { toValue: 1, duration: GATHER, easing: Easing.in(Easing.quad), useNativeDriver: NATIVE }).start();
      }, SEE),
      setTimeout(() => !quiet && buzz('tap'), SEE + GATHER * 0.6),
      setTimeout(
        () => {
          Animated.timing(light, { toValue: 1, duration: FLASH, easing: Easing.in(Easing.quad), useNativeDriver: NATIVE }).start(() => {
            setTurned(true);
            if (!quiet) buzz('lit');
            turnRef.current();
            Animated.parallel([
              Animated.timing(light, { toValue: 0, duration: 850, easing: Easing.out(Easing.quad), useNativeDriver: NATIVE }),
              Animated.timing(gather, { toValue: 0, duration: 600, easing: Easing.out(Easing.quad), useNativeDriver: NATIVE }),
              Animated.timing(land, { toValue: 1, duration: 160, useNativeDriver: NATIVE }),
              Animated.timing(rise, { toValue: 1, duration: 2200, easing: Easing.out(Easing.quad), useNativeDriver: NATIVE }),
            ]).start();
          });
        },
        SEE + GATHER - FLASH / 2,
      ),
    ];
    return () => ts.forEach(clearTimeout);
  }, [shown, still, quiet, gather, light, land, rise]);
  const L = ART * 1.7;
  return (
    <View style={{ width: ART, height: ART }} onLayout={() => requestAnimationFrame(() => setShown(true))}>
      {/* both are drawn from the start, so nothing has to be made at the moment of the change */}
      {still ? null : (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              opacity: land.interpolate({ inputRange: [0, 1], outputRange: [1, 0], extrapolate: 'clamp' }),
              transform: [{ scale: gather.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] }) }],
            },
          ]}>
          <FlameMedallion
            level={from}
            size={ART}
            under={
              /* a warm light gathering behind the fire: on the sky, under the flame, so the night warms around it instead of a veil going over it */
              <Animated.View
                style={[
                  s.light,
                  {
                    left: (ART - L) / 2,
                    top: ART * HEART - L / 2,
                    width: L,
                    height: L,
                    opacity: gather.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 0.85, 1] }),
                    transform: [{ scale: gather.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.95] }) }],
                  },
                ]}>
                <SvgXml xml={GLOW_WARM} width={L} height={L} />
              </Animated.View>
            }
          />
        </Animated.View>
      )}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            opacity: land.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: 'clamp' }),
          },
        ]}>
        <FlameMedallion level={to} size={ART} />
      </Animated.View>
      {still ? null : (
        /* the light stays inside its own sky: spilled onto the card it reads as a smudge */
        <View pointerEvents="none" style={[s.clip, { borderRadius: ART / 2 }]}>
          {/* and the burst: white light from the heart that fills the sky for a moment */}
          <Animated.View
            style={[
              s.light,
              {
                left: (ART - L) / 2,
                top: ART * HEART - L / 2,
                width: L,
                height: L,
                opacity: light.interpolate({ inputRange: [0, 1], outputRange: [0, 0.92] }),
                transform: [{ scale: light.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.85] }) }],
              },
            ]}>
            <SvgXml xml={LIGHT} width={L} height={L} />
          </Animated.View>
        </View>
      )}
      {turned && !still && !quiet
        ? EMBERS.map(([x, up, r, d], i) => {
            const a = Math.min(0.9, d + 0.05);
            return (
              <Animated.View
                key={i}
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  left: ART * (0.5 + x) - (ART * r) / 2,
                  top: ART * HEART,
                  width: ART * r,
                  height: ART * r,
                  borderRadius: ART * r,
                  backgroundColor: EMBER_COL[i % EMBER_COL.length],
                  opacity: rise.interpolate({ inputRange: [0, d, a, 1], outputRange: [0, 0, 1, 0] }),
                  transform: [
                    { translateY: rise.interpolate({ inputRange: [0, d, 1], outputRange: [0, 0, -ART * up] }) },
                    { translateX: rise.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, ART * x * 0.15, ART * x * 0.4] }) },
                  ],
                }}
              />
            );
          })
        : null}
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
  light: { position: 'absolute' },
  /* a hair inside the sky's edge, so the light never rims it */
  clip: { position: 'absolute', left: 1, top: 1, right: 1, bottom: 1, overflow: 'hidden' },
  words: { alignSelf: 'stretch', alignItems: 'center', gap: 8 },
  rows: { alignSelf: 'stretch', gap: 10, marginTop: 6, paddingTop: 12, borderTopWidth: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowT: { fontFamily: font.bodySemi, fontSize: 15, lineHeight: 20 },
  rowS: { fontFamily: font.body, fontSize: 13, lineHeight: 18 },
  h: { fontFamily: font.display, fontSize: 28, lineHeight: 34, textAlign: 'center' },
});
