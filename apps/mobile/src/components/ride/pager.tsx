/* The ride as pages you swipe through, like reels (the owner, November 9, 2026, with a picture of Instagram's Reels): one
   move fills the page, up for the next, down for the one before. It is a native paging scroll view, so it moves exactly like
   the phone's own lists (the page under the finger, the next one already there below it, momentum, the soft stop at the
   first page) and a trackpad scroll works too. Only the page in view and the two next to it are drawn; the parent shows its
   neighbors as still covers, so nothing in them runs, buzzes or speaks until it is landed on.

   Until the person has swiped a few times (core UrMem.swiped), the page lifts twice by itself to show the next one below,
   the way short-video apps teach it. */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Platform, StyleSheet, View, type ScrollViewInstance } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import Reanimated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { useReducedMotion } from '@/lib/motion';
import { useTheme } from '@/lib/theme';

const WEB = Platform.OS === 'web';
const AScroll = Reanimated.createAnimatedComponent(ScrollView);
/** the side dots: at most this many, around the page in view */
const DOTS = 7;
const GAP = 12;

export function RidePager({
  count,
  at,
  hint,
  on,
  tint,
  onLand,
  render,
}: {
  /** how many pages there are (the moves shown so far and the one waiting after them) */
  count: number;
  /** the page in view */
  at: number;
  /** lift the page to show how to swipe */
  hint: boolean;
  /** the ride is in front (no sheet over it) */
  on: boolean;
  /** the color of the side dot for the page in view */
  tint: string;
  /** the person swiped to page i */
  onLand: (i: number) => void;
  render: (i: number) => ReactNode;
}) {
  const still = useReducedMotion();
  const ref = useRef<ScrollViewInstance>(null);
  const [h, setH] = useState(0);
  const seen = useRef(at);
  const settle = useRef<ReturnType<typeof setTimeout> | null>(null);
  /* where the scroll is, on the native side, for the page depth and the side dots */
  const y = useSharedValue(0);
  const hv = useSharedValue(1);

  /* a move done, Next, or a tool picked: glide to the page the ride is on now */
  useEffect(() => {
    if (!h) return;
    hv.value = h;
    const moved = seen.current !== at;
    seen.current = at;
    ref.current?.scrollTo({ y: at * h, animated: moved && !still });
    if (!moved) y.value = at * h;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [at, h, still]);

  /* the lesson: two small lifts that show the next page waiting below */
  useEffect(() => {
    if (!hint || !on || !h || still) return;
    const top = at * h;
    const t: ReturnType<typeof setTimeout>[] = [];
    const lift = (ms: number) => {
      t.push(setTimeout(() => ref.current?.scrollTo({ y: top + 72, animated: true }), ms));
      t.push(setTimeout(() => ref.current?.scrollTo({ y: top, animated: true }), ms + 420));
    };
    lift(2200);
    lift(3300);
    return () => t.forEach(clearTimeout);
  }, [hint, on, h, at, still]);

  const land = (v: number) => {
    if (!h) return;
    const i = Math.max(0, Math.min(count - 1, Math.round(v / h)));
    if (i === seen.current) return;
    seen.current = i;
    onLand(i);
  };
  const landRef = useRef(land);
  landRef.current = land;
  /* the web has no end-of-momentum event: it lands once the scroll has been still for a moment */
  const settled = useRef((v: number, now: boolean) => {
    if (settle.current) clearTimeout(settle.current);
    if (now) return landRef.current(v);
    settle.current = setTimeout(() => landRef.current(v), 140);
  }).current;
  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      y.value = e.contentOffset.y;
      if (WEB) runOnJS(settled)(e.contentOffset.y, false);
    },
    onMomentumEnd: (e) => {
      runOnJS(settled)(e.contentOffset.y, true);
    },
  });

  const first = count <= DOTS ? 0 : Math.max(0, Math.min(count - DOTS, at - 3));
  const shown = Math.min(count, DOTS);

  return (
    <View style={StyleSheet.absoluteFill} onLayout={(e) => setH(Math.round(e.nativeEvent.layout.height))}>
      {h ? (
        <AScroll
          ref={ref as never}
          pagingEnabled
          scrollEnabled={on}
          showsVerticalScrollIndicator={false}
          decelerationRate="fast"
          contentOffset={{ x: 0, y: at * h }}
          scrollEventThrottle={16}
          onScroll={onScroll}
          style={s.box}>
          {Array.from({ length: count }, (_, i) => (
            <Page key={i} i={i} h={h} y={y} still={still}>
              {Math.abs(i - at) <= 1 ? render(i) : null}
            </Page>
          ))}
        </AScroll>
      ) : null}
      {h && count > 1 ? <SideDots first={first} shown={shown} y={y} hv={hv} tint={tint} /> : null}
    </View>
  );
}

/** one page: as it scrolls up and away it sinks back a little and dims, so the next one seems to come over it */
function Page({ i, h, y, still, children }: { i: number; h: number; y: SharedValue<number>; still: boolean; children: ReactNode }) {
  const st = useAnimatedStyle(() => {
    if (still) return {};
    const p = interpolate(y.value, [i * h, (i + 1) * h], [0, 1], Extrapolation.CLAMP);
    return { opacity: 1 - 0.55 * p, transform: [{ translateY: p * h * 0.4 }, { scale: 1 - 0.08 * p }] };
  });
  return <Reanimated.View style={[{ height: h, zIndex: i }, st]}>{children}</Reanimated.View>;
}

/** the pages down the right edge, like a story's bars turned on their side: the one in view is a long bright mark that slides
    with the finger */
function SideDots({ first, shown, y, hv, tint }: { first: number; shown: number; y: SharedValue<number>; hv: SharedValue<number>; tint: string }) {
  const c = useTheme();
  const mark = useAnimatedStyle(() => {
    const p = y.value / hv.value - first;
    return { transform: [{ translateY: Math.max(-0.5, Math.min(shown - 0.5, p)) * GAP }] };
  });
  return (
    <View pointerEvents="none" style={[s.dots, { height: shown * GAP + 12 }]} importantForAccessibility="no-hide-descendants">
      {Array.from({ length: shown }, (_, k) => (
        <View key={k} style={[s.dot, { top: k * GAP + 6, backgroundColor: c.ink + '33' }]} />
      ))}
      <Reanimated.View style={[s.mark, { backgroundColor: tint }, mark]} />
    </View>
  );
}

const s = StyleSheet.create({
  box: { flex: 1, alignSelf: 'stretch' },
  dots: { position: 'absolute', right: -6, top: '34%', width: 8 },
  dot: { position: 'absolute', left: 1, width: 6, height: 6, borderRadius: 3 },
  mark: { position: 'absolute', left: 0, top: 0, width: 8, height: 18, borderRadius: 4 },
});
