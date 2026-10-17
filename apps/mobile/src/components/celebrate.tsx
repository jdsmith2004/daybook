/* Celebrations: a new level (or a new form of the flame), a new badge, a quest done, a full ring, a run saved. They wait their turn:
   they show only on the main tabs, never on top of a page, a sheet or a full-screen moment, so a hard moment is not interrupted. With celebrations off they are said in a
   quiet line instead. Anything that arrives right after a slip comes in quietly: no confetti, no buzz. Ported from the legacy
   celebrate, celNext and confetti. */
import { celTitle, gameCompute, nextLine, type CelItem } from '@daybook/core';
import { usePathname } from 'expo-router';
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { Flame } from '@/components/flame';
import { Flames } from '@/components/rekindle';
import { Button, Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { useStore } from '@/lib/store';
import { font, toneOf, useTheme } from '@/lib/theme';

const NATIVE = Platform.OS !== 'web';
const SCENES = /^\/(sos|tool|log|sunrise|checkin|map|deeper|night|lesson|lwrite|setup)(\/|$)/;
/** the main tabs: a celebration shows only there, never over a page the person is busy on */
const TABS = /^\/(journal|learn|more)?$/;

/** a badge: a round medal in its color, or a dashed lock while it is not earned yet */
export function BadgeArt({ icon, tone, size, earned }: { icon: string; tone: string; size: number; earned: boolean }) {
  const c = useTheme();
  const t = toneOf(c, tone || 'accent');
  return (
    <View
      style={[
        { width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' },
        earned
          ? { backgroundColor: t.ic, borderBottomWidth: 5, borderBottomColor: 'rgba(0,0,0,0.14)' }
          : { backgroundColor: c.surface2, borderWidth: 2, borderStyle: 'dashed', borderColor: c.muted },
      ]}>
      <Icon name={earned ? icon : 'lock'} size={size * (earned ? 0.5 : 0.4)} color={earned ? t.ink : c.muted} />
    </View>
  );
}

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

export function CelebrateHost() {
  const { snap, hooks } = useStore();
  const path = usePathname();
  const [queue, setQueue] = useState<CelItem[]>([]);
  const [cur, setCur] = useState<CelItem | null>(null);
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
    const [it, ...rest] = queue;
    setQueue(rest);
    setCur(it);
    const quiet = !!it.quiet || (it.type === 'badge' && it.b.id === 'honest');
    if (!quiet) {
      setBoom({ n: Date.now(), big: it.type === 'level' });
      buzz(it.type === 'level' ? 'lit' : 'save');
    } else setBoom(null);
  }, [cur, blocked, queue]);

  if (!cur || !st) return null;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Pressable accessibilityLabel="Close" style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(20,16,50,0.5)' }]} onPress={() => setCur(null)} />
      {boom ? <Confetti key={boom.n} big={boom.big} /> : null}
      <View style={s.center} pointerEvents="box-none">
        <Card it={cur} more={queue.length > 0} onClose={() => setCur(null)} />
      </View>
    </View>
  );
}

function Card({ it, more, onClose }: { it: CelItem; more: boolean; onClose: () => void }) {
  const c = useTheme();
  const { snap, tk } = useStore();
  let art: React.ReactNode = null;
  let eyebrow = '';
  let title = '';
  let sub = '';
  if (it.type === 'level') {
    const L = it.level;
    art = it.evolve ? <Evolve from={it.from || Math.max(1, L.n - 1)} to={L.n} /> : <Flame level={L.n} size={150} />;
    eyebrow = it.evolve ? 'New form' : 'Level up';
    title = 'Level ' + L.n + ': ' + L.name;
    sub = (it.evolve ? L.meaning : L.step) + ' ' + (L.next == null ? 'This is as bright as it gets. Keep shining.' : nextLine(L));
  } else if (it.type === 'badge') {
    art = <BadgeArt icon={it.b.icon} tone={it.b.tone} size={104} earned />;
    eyebrow = it.b.id === 'honest' ? 'Honesty' : 'New badge';
    title = it.b.name;
    sub = it.b.desc;
  } else if (it.type === 'quest') {
    art = <BadgeArt icon="star" tone="sun" size={104} earned />;
    eyebrow = 'Quest complete';
    title = it.q.name;
    sub = `${it.q.hint} +${it.q.pts} points.`;
  } else if (it.type === 'perfect') {
    const lvl = snap.settings ? gameCompute(snap.days, snap.settings, snap.reviews, tk).level.n : 1;
    art = <Flame level={Math.max(1, lvl)} size={150} />;
    eyebrow = 'Full ring';
    title = 'All ' + it.n + ' wins today';
    sub = 'That is a full day of looking after yourself. Rest well.';
  } else if (it.type === 'saved') {
    art = <Flames on={[true, true, true]} big />;
    eyebrow = 'Run saved';
    title = it.run + ' day' + (it.run === 1 ? '' : 's') + ' and counting';
    sub = 'You did the work after a slip, so your run keeps going. The gold mark on your calendar shows where you came back.';
  } else {
    title = it.title || 'Nice';
    sub = it.sub || '';
  }
  const scale = useRef(new Animated.Value(0.85)).current;
  useEffect(() => {
    Animated.spring(scale, { toValue: 1, friction: 6, tension: 120, useNativeDriver: NATIVE }).start();
  }, [scale]);
  return (
    <Animated.View accessibilityViewIsModal accessibilityLiveRegion="assertive" style={[s.card, { backgroundColor: c.surface, transform: [{ scale }] }]}>
      {art}
      {eyebrow ? <Text style={[s.eye, { color: c.accentText }]}>{eyebrow.toUpperCase()}</Text> : null}
      <Text style={[s.h, { color: c.ink }]} accessibilityRole="header">
        {title}
      </Text>
      {sub ? (
        <T tone="muted" style={{ textAlign: 'center', fontSize: 16, lineHeight: 22 }}>
          {sub}
        </T>
      ) : null}
      <View style={{ alignSelf: 'stretch', marginTop: 4 }}>
        <Button label={more ? 'Next' : 'Nice'} onPress={onClose} />
      </View>
    </Animated.View>
  );
}

/* a new form: the old one flares up, bursts into light, and gives way to the new one */
function Evolve({ from, to }: { from: number; to: number }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 1100, delay: 250, easing: Easing.inOut(Easing.cubic), useNativeDriver: NATIVE }).start();
  }, [v]);
  return (
    <View style={{ width: 150, height: 150 }}>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            opacity: v.interpolate({ inputRange: [0, 0.6, 1], outputRange: [1, 0.4, 0] }),
            transform: [{ scale: v.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.15, 0.8] }) }],
          },
        ]}>
        <Flame level={from} size={150} />
      </Animated.View>
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: 75,
            backgroundColor: '#FFF3B0',
            opacity: v.interpolate({ inputRange: [0, 0.45, 0.6, 1], outputRange: [0, 0, 0.85, 0] }),
            transform: [{ scale: v.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.4, 1.1, 1.7] }) }],
          },
        ]}
      />
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: v, transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }] }]}>
        <Flame level={to} size={150} alive />
      </Animated.View>
    </View>
  );
}

/* confetti: a burst from the middle, falling under gravity. Skipped when the phone asks for less motion. */
export function Confetti({ big }: { big: boolean }) {
  const c = useTheme();
  const { width: W, height: H } = useWindowDimensions();
  const t = useRef(new Animated.Value(0)).current;
  const [on, setOn] = useState(true);
  const parts = useMemo(() => {
    const cols = [c.sun, c.sun2, c.accent, c.mint, c.violet, c.coral];
    const n = big ? 90 : 50;
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
  }, [big, W, H, c]);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((r) => {
        if (!alive) return;
        if (r) {
          setOn(false);
          return;
        }
        Animated.timing(t, { toValue: 1, duration: 1800, easing: Easing.linear, useNativeDriver: NATIVE }).start(() => alive && setOn(false));
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [t]);
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
            opacity: t.interpolate({ inputRange: [0, 0.75, 1], outputRange: [1, 1, 0] }),
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
    borderRadius: 32,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 25,
    shadowOffset: { width: 0, height: 18 },
    elevation: 12,
  },
  eye: { fontFamily: font.bodyBold, fontSize: 12, letterSpacing: 1.2, marginTop: 6 },
  h: { fontFamily: font.display, fontSize: 28, lineHeight: 32, textAlign: 'center' },
});
