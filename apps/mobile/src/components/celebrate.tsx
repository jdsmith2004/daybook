/* Celebrations: a new form of the flame, a new badge, and the first level of a day, each as a full-screen earned moment
   (components/earned.tsx, built on Duolingo's beats, the owner, November 13, 2026). A second level on the same day and a full
   ring are one short toast (core celSplit), since levels come every day or two and the hero's bar carries them. They wait their turn:
   they show only on the main tabs, never on top of a page, a sheet or a full-screen moment, so a hard moment is not interrupted. With celebrations off they are said in a
   quiet line instead. Anything that arrives right after a slip comes in quietly: no confetti, no buzz. Ported from the legacy
   celebrate, celNext and confetti.
   One at a time: everything that is waiting when the person comes back to the tabs shows as one moment (the UX audit of
   October 27, 2026: after the first lesson and check-in, four sheets came in a row). The biggest win leads it (a new
   form, a badge, then a level), with the rest landing as rows under it, and one button. A tip ask can ride on it
   (core tipMoment), but never on the day the person came back, nor in the hours after an SOS or a slip
   (lib/quiet-asks.ts). A mistaken log taken back with Undo takes its waiting celebration with it (lib/store.tsx). A level
   reached on the day of a slip waits for the next day (core checkNew), and then says it was earned then. */
import { celSpendsLevel, celSplit, celTitle, type CelItem } from '@daybook/core';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePathname } from 'expo-router';
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, useWindowDimensions, View } from 'react-native';

import { Earned } from '@/components/earned';
import { NATIVE } from '@/lib/motion';
import { useStore } from '@/lib/store';
import { useTheme } from '@/lib/theme';

/* the day a plain level last had its own moment, on this phone: one a day, the rest are a toast (core celSplit) */
const LEVEL_DAY = 'daybook.levelDay';
let levelDay: string | null = null;
AsyncStorage.getItem(LEVEL_DAY)
  .then((v) => {
    if (v) levelDay = v;
  })
  .catch(() => undefined);
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
  const { snap, hooks, tk } = useStore();
  const path = usePathname();
  const [queue, setQueue] = useState<CelItem[]>([]);
  /* the sheet that is open: everything that was waiting, as one */
  const [cur, setCur] = useState<CelItem[] | null>(null);
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
    const { sheet, toast } = celSplit(queue, levelDay !== tk);
    setQueue([]);
    if (toast) sayRef.current(toast);
    if (!sheet.length) return;
    if (celSpendsLevel(sheet)) {
      levelDay = tk;
      AsyncStorage.setItem(LEVEL_DAY, tk).catch(() => undefined);
    }
    sheetAt = Date.now();
    setCur(lead(sheet));
  }, [cur, blocked, queue, tk]);

  useEffect(() => {
    busy = !!cur || celSplit(queue, levelDay !== tk).sheet.length > 0;
    busySubs.forEach((f) => f());
  }, [cur, queue, tk]);

  if (!cur || !st) return null;
  return <Earned key={JSON.stringify(cur).slice(0, 120)} group={cur} more={queue.length > 0} onClose={() => setCur(null)} />;
}

/** the order a moment leads with: a new form, then the badges in the order they came, then a plain level */
const RANK: Record<CelItem['type'], number> = { level: 3.5, perfect: 2, badge: 3, quest: 4, more: 5 };
function lead(items: CelItem[]): CelItem[] {
  return items
    .filter((it) => it.type !== 'quest')
    .map((it, i) => ({ it, i, r: it.type === 'level' && (it.evolve || !it.from) ? 0 : RANK[it.type] }))
    .sort((a, b) => a.r - b.r || a.i - b.i)
    .map((x) => x.it);
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
