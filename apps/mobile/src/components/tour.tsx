/* The first look at Today (lib/tour.ts): the flame walks a new person through the page, one real thing at a time, with the rest of
   the screen dimmed and a spotlight cut around the part it is talking about. The flame and its bubble sit low, just over the tab bar,
   with Next under the words, so the whole tour is one thumb. It ends on the lesson card, glowing, so the next step is plain.

   Care is never locked: SOS is tappable on every step (it ends the tour and opens SOS), and on the steps that point at a part,
   tapping the part itself opens it. The X skips the tour for good. With Reduce Motion on, the spotlight moves without gliding and
   nothing pulses; with VoiceOver, each step is read as it comes and every part is a button. */
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  findNodeHandle,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  type ViewInstance,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Flame } from '@/components/flame';
import { Next } from '@/components/lx';
import { Text } from '@/components/text';
import { Icon } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { BUBBLE, PAPER_INK } from '@/lib/lesson-look';
import { NATIVE, useReducedMotion } from '@/lib/motion';
import { measureSpot, type Rect, type SpotKey } from '@/lib/tour';
import { font, useTheme } from '@/lib/theme';

interface Step {
  /** what is lit: the parts, joined in one spotlight */
  at: SpotKey[];
  say: string;
  /** the main button's word (Next when not given) */
  btn?: string;
  /** the main button does this instead of going on (the last step's lesson) */
  go?: () => void;
}

/** what tapping a lit part does: it opens, as it would on Today */
const OPEN: Partial<Record<SpotKey, { label: string; go: () => void }>> = {
  log: { label: 'Already happened. Log what happened.', go: () => router.push('/log') },
  trail: { label: 'Walk it through.', go: () => router.push('/trail') },
  sos: { label: 'SOS. Help with an urge.', go: () => router.push('/sos') },
  learn: { label: 'Learn. Your lessons.', go: () => router.navigate('/learn') },
};

/** the steps, from the top of the page down, then the tab bar, and last the lesson (only while lesson 1 waits on the page) */
export function tourSteps({ lessonDone, lessonId }: { lessonDone: boolean; lessonId: string | null }): Step[] {
  const steps: Step[] = [
    {
      at: ['sky'],
      say: lessonDone
        ? 'Lesson one, done, and your flame felt it. Each morning, tell me how the night went, and I keep growing.'
        : 'This is your flame. Each morning, tell me how the night went. Every honest answer and every lesson makes me grow.',
    },
    {
      at: ['log', 'trail'],
      say: 'Slipped? Tap Already happened and tell it straight, with no shame. Planning one, or the urge keeps coming back? Walk it through.',
    },
    { at: ['sos'], say: 'When an urge hits, tap SOS. I will help you ride it out, day or night.' },
    {
      at: ['learn'],
      say: lessonDone ? 'Your lessons live in Learn. The next one opens tomorrow.' : 'Your lessons live in Learn. A new one opens every day.',
    },
  ];
  if (!lessonDone && lessonId)
    steps.push({
      at: ['lesson'],
      say: 'Start here: your lesson for today. It takes about two minutes.',
      btn: 'Start lesson 1',
      go: () => router.push({ pathname: '/lesson/[id]', params: { id: lessonId } }),
    });
  return steps;
}

/* ---------- where the iPhone's own tab bar draws its parts ---------- */
/* The system draws the bar (app-tabs.ios.tsx), so there is nothing to measure: on iOS 26 it is a glass capsule holding the four tabs
   from the left edge, and SOS in its own glass circle at the right, both resting just over the home indicator. Measured from the
   simulator (November 13, 2026). */
const IOS_BAR = { side: 21, h: 62, gap: 10, lift: 0 };
function iosTab(key: SpotKey, W: number, H: number, bottom: number): Rect | null {
  const y = H - Math.max(bottom, 16) - IOS_BAR.h + IOS_BAR.lift;
  const circle = { x: W - IOS_BAR.side - IOS_BAR.h, y, w: IOS_BAR.h, h: IOS_BAR.h };
  if (key === 'sos') return circle;
  const left = IOS_BAR.side;
  const width = circle.x - IOS_BAR.gap - left;
  /* Learn is the third of the four */
  if (key === 'learn') return { x: left + (width / 4) * 2, y, w: width / 4, h: IOS_BAR.h };
  return null;
}

async function rectOf(key: SpotKey, W: number, H: number, bottom: number): Promise<Rect | null> {
  if (Platform.OS === 'ios' && (key === 'sos' || key === 'learn')) return iosTab(key, W, H, bottom);
  return measureSpot(key);
}

const union = (rs: Rect[]): Rect => {
  const x = Math.min(...rs.map((r) => r.x));
  const y = Math.min(...rs.map((r) => r.y));
  return { x, y, w: Math.max(...rs.map((r) => r.x + r.w)) - x, h: Math.max(...rs.map((r) => r.y + r.h)) - y };
};
const inside = (r: Rect, px: number, py: number) => px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;

/** room around a lit part */
const PAD = 8;

export function FirstTour({
  steps,
  level,
  onEnd,
  scrollBy,
}: {
  steps: Step[];
  level: number;
  /** finished or skipped: it never comes back */
  onEnd: () => void;
  /** moves Today so a part sits above the flame's words; returns whether it moved */
  scrollBy: (dy: number) => boolean;
}) {
  const c = useTheme();
  const { width: W, height: H } = useWindowDimensions();
  const inset = useSafeAreaInsets();
  const still = useReducedMotion();
  const [i, setI] = useState(0);
  /* the parts lit on this step, where they are */
  const [lit, setLit] = useState<{ i: number; parts: { k: SpotKey; r: Rect }[] } | null>(null);
  const [panelH, setPanelH] = useState(260);
  const [sosAt, setSosAt] = useState<Rect | null>(null);
  const ended = useRef(false);
  const step = steps[i];

  /* the spotlight: a frame of dim with a hole, drawn as one view with a border far wider than the screen, so the hole's corners round */
  const hx = useRef(new Animated.Value(W / 2)).current;
  const hy = useRef(new Animated.Value(H / 2)).current;
  const hw = useRef(new Animated.Value(0)).current;
  const hh = useRef(new Animated.Value(0)).current;
  const hr = useRef(new Animated.Value(20)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const ring = useRef(new Animated.Value(0)).current;
  const say = useRef(new Animated.Value(1)).current;
  const B = Math.max(W, H) * 2;

  /* the panel: just over the tab bar */
  const barTop = Platform.OS === 'ios' ? Math.max(inset.bottom, 16) + IOS_BAR.h + 14 : inset.bottom + 74;
  const panelTop = H - barTop - panelH;

  const end = (then?: () => void) => {
    if (ended.current) return;
    ended.current = true;
    onEnd();
    then?.();
  };

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: still ? 0 : 260, useNativeDriver: false }).start();
    rectOf('sos', W, H, inset.bottom).then(setSosAt);
  }, [fade, still, W, H, inset.bottom]);

  /* each step: find its parts, move the page so they sit clear of the words, then light them */
  useEffect(() => {
    if (!step) return;
    let live = true;
    const find = async () => {
      const got = await Promise.all(step.at.map(async (k) => ({ k, r: await rectOf(k, W, H, inset.bottom) })));
      return got.filter((x): x is { k: SpotKey; r: Rect } => !!x.r);
    };
    (async () => {
      let parts = await find();
      if (!live) return;
      if (!parts.length) {
        /* the part is not on Today now (the lesson card at night): the step is passed over */
        if (i < steps.length - 1) setI(i + 1);
        else end();
        return;
      }
      const u = union(parts.map((x) => x.r));
      const onPage = step.at.every((k) => k !== 'sos' && k !== 'learn');
      const room = panelTop - 20;
      let dy = 0;
      if (onPage && u.y + u.h > room) dy = u.y + u.h - room;
      if (onPage && step.at[0] === 'sky' && u.y < 0) dy = u.y;
      if (dy && scrollBy(dy)) {
        await new Promise((r) => setTimeout(r, 380));
        if (!live) return;
        parts = await find();
        if (!live || !parts.length) return;
      }
      setLit({ i, parts });
    })();
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, W, H]);

  /* light the parts: the hole glides to them, and the words come in */
  useEffect(() => {
    if (!lit || lit.i !== i) return;
    const u = union(lit.parts.map((x) => x.r));
    const round = lit.parts.length === 1 && lit.parts[0].k === 'sos';
    const to = { x: u.x - PAD, y: u.y - PAD, w: u.w + PAD * 2, h: u.h + PAD * 2 };
    const r = round ? to.h / 2 : lit.parts[0].k === 'sky' ? 28 : 26;
    const ms = still ? 0 : 420;
    const ease = Easing.out(Easing.cubic);
    Animated.parallel([
      Animated.timing(hx, { toValue: to.x, duration: ms, easing: ease, useNativeDriver: false }),
      Animated.timing(hy, { toValue: to.y, duration: ms, easing: ease, useNativeDriver: false }),
      Animated.timing(hw, { toValue: to.w, duration: ms, easing: ease, useNativeDriver: false }),
      Animated.timing(hh, { toValue: to.h, duration: ms, easing: ease, useNativeDriver: false }),
      Animated.timing(hr, { toValue: r, duration: ms, easing: ease, useNativeDriver: false }),
    ]).start();
    if (!still) {
      say.setValue(0);
      Animated.spring(say, { toValue: 1, friction: 6, tension: 90, useNativeDriver: NATIVE }).start();
    }
    /* VoiceOver reads the new words */
    const h = Platform.OS === 'web' ? null : findNodeHandle(bubble.current);
    if (h) setTimeout(() => AccessibilityInfo.setAccessibilityFocus(h), 120);
    else AccessibilityInfo.announceForAccessibility?.(steps[i].say);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lit, i]);

  /* the lit part breathes a warm ring, so the eye goes to it */
  useEffect(() => {
    if (still) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(ring, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
        Animated.timing(ring, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [still, ring]);

  const bubble = useRef<ViewInstance>(null);
  const last = i >= steps.length - 1;
  const next = () => {
    buzz('tap');
    if (step?.go) return end(step.go);
    if (last) return end();
    setI(i + 1);
  };
  const shown = lit && lit.i === i ? lit.parts : [];
  const dots = useMemo(() => steps.map((_, j) => j), [steps]);
  if (!step) return null;

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={() => end()}>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: fade }]} accessibilityViewIsModal>
        {/* the dim, with its hole; a tap on the dim goes on */}
        <Pressable accessible={false} style={StyleSheet.absoluteFill} onPress={next}>
          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: Animated.subtract(hx, B),
              top: Animated.subtract(hy, B),
              width: Animated.add(hw, B * 2),
              height: Animated.add(hh, B * 2),
              borderWidth: B,
              borderRadius: Animated.add(hr, B),
              borderColor: 'rgba(10,7,30,0.72)',
            }}
          />
          <Animated.View
            pointerEvents="none"
            style={{ position: 'absolute', left: hx, top: hy, width: hw, height: hh, borderRadius: hr, opacity: shown.length ? 1 : 0 }}>
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                {
                  borderRadius: 999,
                  borderWidth: 3,
                  borderColor: c.sun,
                  opacity: ring.interpolate({ inputRange: [0, 1], outputRange: [1, 0.45] }),
                  transform: [{ scale: ring.interpolate({ inputRange: [0, 1], outputRange: [1, 1.03] }) }],
                },
              ]}
            />
          </Animated.View>
        </Pressable>

        {/* the lit parts open, as on Today */}
        {shown.map(({ k, r }) => {
          const o = k === 'lesson' ? { label: step.btn ? step.btn + '.' : 'Start the lesson.', go: step.go! } : k === 'sky' ? null : OPEN[k];
          if (!o) return null;
          return (
            <Pressable
              key={k}
              accessibilityRole="button"
              accessibilityLabel={o.label}
              onPress={() => {
                buzz('tap');
                end(o.go);
              }}
              style={{ position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h, borderRadius: 20 }}
            />
          );
        })}

        {/* SOS is never locked: tappable on every step */}
        {sosAt && !shown.some((x) => x.k === 'sos') ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={OPEN.sos!.label}
            onPress={() => {
              buzz('tap');
              end(OPEN.sos!.go);
            }}
            style={{ position: 'absolute', left: sosAt.x, top: sosAt.y, width: sosAt.w, height: sosAt.h, borderRadius: sosAt.h / 2 }}
          />
        ) : null}

        {/* the X skips the tour, for good */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Skip the tour"
          hitSlop={8}
          onPress={() => {
            buzz('tap');
            end();
          }}
          style={({ pressed }) => [s.x, { top: inset.top + 8, opacity: pressed ? 0.7 : 1 }]}>
          <Icon name="x" color="#FFFFFF" />
        </Pressable>

        {/* the flame and what it says, low, with Next under it */}
        <View style={[s.panel, { bottom: barTop }]} onLayout={(e) => setPanelH(e.nativeEvent.layout.height)} pointerEvents="box-none">
          <Animated.View
            style={[
              s.talk,
              {
                opacity: say,
                transform: [{ translateY: say.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
              },
            ]}>
            <View style={s.flame}>
              <Flame level={level} size={92} alive label="" />
            </View>
            <View ref={bubble} accessible accessibilityLabel={step.say} style={[s.bubble, { backgroundColor: BUBBLE }]}>
              <View style={[s.tail, { backgroundColor: BUBBLE }]} />
              <Text style={s.sayT}>{step.say}</Text>
            </View>
          </Animated.View>
          <View style={s.dots} accessible accessibilityLabel={'Step ' + (i + 1) + ' of ' + steps.length}>
            {dots.map((j) => (
              <View key={j} style={[s.dot, { backgroundColor: j <= i ? c.sun : 'rgba(255,255,255,0.28)', width: j === i ? 22 : 8 }]} />
            ))}
          </View>
          <Next label={step.btn || (last ? 'Got it' : 'Next')} noIcon={!!step.btn || last} onPress={next} />
        </View>
      </Animated.View>
    </Modal>
  );
}

const s = StyleSheet.create({
  x: {
    position: 'absolute',
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  panel: { position: 'absolute', left: 16, right: 16, gap: 12, alignSelf: 'center', maxWidth: 560 },
  talk: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  flame: { width: 92, height: 92, marginBottom: -6 },
  bubble: { flex: 1, borderRadius: 20, paddingVertical: 12, paddingHorizontal: 16 },
  tail: { position: 'absolute', left: -6, bottom: 22, width: 16, height: 16, borderRadius: 3, transform: [{ rotate: '45deg' }] },
  sayT: { fontFamily: font.bodySemi, fontSize: 17, lineHeight: 23, color: PAPER_INK },
  dots: { flexDirection: 'row', gap: 6, alignSelf: 'center' },
  dot: { height: 8, borderRadius: 4 },
});
