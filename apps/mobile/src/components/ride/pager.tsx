/* The ride as pages you swipe through, like reels (the owner, November 9, 2026, with a picture of Instagram's Reels): one
   move fills the page, up for the next, down for the one before. It is a native paging scroll view, so it moves exactly like
   the phone's own lists (the page under the finger, the next one already there below it, momentum, the soft stop at the
   first page) and a trackpad scroll works too. Only the page in view and the two next to it are drawn; the parent shows its
   neighbors as still covers, so nothing in them runs, buzzes or speaks until it is landed on.

   Until the person has swiped a few times (core UrMem.swiped), the page lifts twice by itself to show the next one below,
   the way short-video apps teach it. */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Platform, StyleSheet, View, type NativeScrollEvent, type NativeSyntheticEvent, type ScrollViewInstance } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useReducedMotion } from '@/lib/motion';

const WEB = Platform.OS === 'web';

export function RidePager({
  count,
  at,
  hint,
  on,
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
  /** the person swiped to page i */
  onLand: (i: number) => void;
  render: (i: number) => ReactNode;
}) {
  const still = useReducedMotion();
  const ref = useRef<ScrollViewInstance>(null);
  const [h, setH] = useState(0);
  const seen = useRef(at);
  const settle = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* a move done, Next, or a tool picked: glide to the page the ride is on now */
  useEffect(() => {
    if (!h) return;
    /* a swipe already glides to its page itself (end below) */
    if (seen.current === at) return;
    seen.current = at;
    ref.current?.scrollTo({ y: at * h, animated: !still });
  }, [at, h, still]);

  /* the lesson: two small lifts that show the next page waiting below */
  useEffect(() => {
    if (!hint || !on || !h || still) return;
    const y = at * h;
    const t: ReturnType<typeof setTimeout>[] = [];
    const lift = (ms: number) => {
      t.push(setTimeout(() => ref.current?.scrollTo({ y: y + 72, animated: true }), ms));
      t.push(setTimeout(() => ref.current?.scrollTo({ y, animated: true }), ms + 420));
    };
    lift(2200);
    lift(3300);
    return () => t.forEach(clearTimeout);
  }, [hint, on, h, at, still]);

  const land = (y: number) => {
    if (!h) return;
    const i = Math.max(0, Math.min(count - 1, Math.round(y / h)));
    if (i === seen.current) return;
    seen.current = i;
    onLand(i);
  };
  /* on the phone the page is chosen here, not by the scroll view's own paging (which needs half a page or a hard flick):
     an eighth of a page, or any flick, is enough, the way short-video apps feel */
  const from = useRef(0);
  const end = (v: number, vy: number) => {
    if (!h) return;
    const d = v - from.current;
    const base = seen.current;
    const to = Math.max(0, Math.min(count - 1, d > h / 8 || vy > 0.35 ? base + 1 : d < -h / 8 || vy < -0.35 ? base - 1 : base));
    ref.current?.scrollTo({ y: to * h, animated: !still });
    if (to !== base) {
      seen.current = to;
      onLand(to);
    }
  };
  /* the web has no end-of-momentum event: it lands once the scroll has been still for a moment */
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!WEB) return;
    const y = e.nativeEvent.contentOffset.y;
    if (settle.current) clearTimeout(settle.current);
    settle.current = setTimeout(() => land(y), 140);
  };

  return (
    <View style={StyleSheet.absoluteFill} onLayout={(e) => setH(Math.round(e.nativeEvent.layout.height))}>
      {h ? (
        <ScrollView
          ref={ref}
          pagingEnabled={WEB}
          scrollEnabled={on}
          showsVerticalScrollIndicator={false}
          decelerationRate="fast"
          contentOffset={{ x: 0, y: at * h }}
          scrollEventThrottle={32}
          onScroll={onScroll}
          onScrollBeginDrag={(e) => (from.current = e.nativeEvent.contentOffset.y)}
          onScrollEndDrag={(e) => (WEB ? undefined : end(e.nativeEvent.contentOffset.y, e.nativeEvent.velocity?.y ?? 0))}
          onMomentumScrollEnd={(e) => (WEB ? land(e.nativeEvent.contentOffset.y) : undefined)}
          style={s.box}>
          {Array.from({ length: count }, (_, i) => (
            <View key={i} style={{ height: h }}>
              {Math.abs(i - at) <= 1 ? render(i) : null}
            </View>
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  box: { flex: 1, alignSelf: 'stretch' },
});
