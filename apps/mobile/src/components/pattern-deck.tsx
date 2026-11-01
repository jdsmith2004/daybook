/* The cards on Pattern: one big card at a time, swiped sideways, with the edge of the next one showing and a small ruler under
   them that says where you are. A chart grows when its card first comes in, not while it is out of sight. A card that is locked
   shows the person's own chart faded, with the ask under it (components/support.tsx). */
import { LinearGradient } from 'expo-linear-gradient';
import { useImperativeHandle, useRef, useState, type ReactNode, type Ref } from 'react';
import { Animated, Platform, Pressable, StyleSheet, useWindowDimensions, View, type ScrollViewInstance, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChartOn } from '@/components/charts';
import { LockAsk } from '@/components/support';
import { Text } from '@/components/text';
import { Card, T } from '@/components/ui';
import { NATIVE } from '@/lib/motion';
import { tabRoom } from '@/lib/tab-room';
import { font, useTheme } from '@/lib/theme';

export interface DeckCard {
  id: string;
  title: string;
  /** the answer, in a few big words */
  head?: string;
  /** the rest of it, in a plain line or two under the answer */
  say?: ReactNode;
  /** the chart: it takes the room left in the card */
  chart: ReactNode;
  /** its key or a short note, under it */
  foot?: ReactNode;
  /** the numbers behind it, shown under the cards while this one is showing */
  numbers?: ReactNode;
}
export interface DeckHandle {
  show: (i: number) => void;
}

const GAP = 8;
/* the title, the sections, the ruler and the range, which the card leaves room for */
const ABOVE = 212;
/* the bar the app draws on Android and the web, with the top of its round SOS: on iPhone the bottom safe area already counts the bar */
const BAR = Platform.OS === 'ios' ? 0 : 92;
const TICK_STEP = 26;

export function Deck({
  cards,
  index,
  onIndex,
  locked,
  quiet,
  from,
  deckRef,
}: {
  cards: DeckCard[];
  index: number;
  onIndex: (i: number) => void;
  /** which cards are locked, by id */
  locked: (id: string) => boolean;
  /** no ask just now: the hours after an SOS or a slip */
  quiet: boolean;
  /** changes when the range does, so the charts grow again */
  from: string;
  deckRef?: Ref<DeckHandle>;
}) {
  const c = useTheme();
  const win = useWindowDimensions();
  const inset = useSafeAreaInsets();
  const [W, setW] = useState(0);
  const [seen, setSeen] = useState(0);
  const sv = useRef<ScrollViewInstance>(null);
  const x = useRef(new Animated.Value(0)).current;
  const step = W + GAP;
  const n = cards.length;
  const H = Math.max(420, Math.min(640, win.height - inset.top - tabRoom(inset.bottom) - BAR - ABOVE));
  useImperativeHandle(deckRef, () => ({ show: (i) => sv.current?.scrollTo({ x: i * step, animated: true }) }), [step]);
  const onScroll = Animated.event([{ nativeEvent: { contentOffset: { x } } }], {
    useNativeDriver: NATIVE,
    listener: (e: { nativeEvent: { contentOffset: { x: number } } }) => {
      if (!step) return;
      const ox = e.nativeEvent.contentOffset.x;
      const i = Math.max(0, Math.min(n - 1, Math.round(ox / step)));
      if (i !== index) onIndex(i);
      /* a chart starts to grow as soon as its card starts to come in */
      const far = Math.ceil((ox - 16) / step);
      setSeen((v) => (far > v ? far : v));
    },
  });
  /* the ruler stays out of the way of a long set: its marks sit closer on a narrow phone */
  const tick = n > 1 ? Math.min(TICK_STEP, (W - 32) / n) : TICK_STEP;
  const marker = n > 1 ? x.interpolate({ inputRange: [0, Math.max(1, step * (n - 1))], outputRange: [0, tick * (n - 1)], extrapolate: 'clamp' }) : 0;
  return (
    <View onLayout={(e) => setW(Math.round(e.nativeEvent.layout.width))}>
      {W ? (
        <Animated.ScrollView
          ref={sv as never}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={step}
          snapToAlignment="start"
          decelerationRate="fast"
          disableIntervalMomentum
          scrollEventThrottle={16}
          onScroll={onScroll}
          style={[s.scroll, SNAP_ROW]}
          contentContainerStyle={s.row}>
          {cards.map((d, i) => {
            const shut = locked(d.id);
            return (
              <Card key={d.id} style={[{ width: W, minHeight: H }, SNAP_CARD]}>
                <View style={{ gap: 4 }}>
                  <T v="label" tone="muted" accessibilityRole="header">
                    {d.title}
                  </T>
                  {!shut && d.head ? <Text style={[s.head, { color: c.ink }]}>{d.head}</Text> : null}
                  {shut ? null : d.say}
                </View>
                <ChartOn.Provider value={i <= Math.max(seen, index)}>
                  <View key={from} style={s.chart}>
                    {shut ? (
                      <View style={s.chart} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                        <View style={[s.chart, { opacity: 0.55 }, BLUR]}>{d.chart}</View>
                        <LinearGradient colors={[c.surface + '00', c.surface]} style={s.fade} />
                      </View>
                    ) : (
                      d.chart
                    )}
                  </View>
                </ChartOn.Provider>
                {shut ? quiet ? null : <LockAsk /> : d.foot}
              </Card>
            );
          })}
        </Animated.ScrollView>
      ) : (
        <View style={{ height: H }} />
      )}
      {n > 1 ? (
        <View style={s.ruler} accessibilityRole="tablist" accessibilityLabel="Cards">
          <View style={{ flexDirection: 'row', width: tick * n, height: 44 }}>
            {cards.map((d, i) => (
              <Pressable
                key={d.id}
                accessibilityRole="tab"
                accessibilityLabel={d.title}
                accessibilityState={{ selected: i === index }}
                onPress={() => sv.current?.scrollTo({ x: i * step, animated: true })}
                style={[s.tickHit, { width: tick }]}>
                <View style={[s.tick, { backgroundColor: c.muted, opacity: 0.45 }]} />
              </Pressable>
            ))}
            <Animated.View pointerEvents="none" style={[s.mark, { left: tick / 2 - 2, backgroundColor: c.ink, transform: [{ translateX: marker }] }]} />
          </View>
        </View>
      ) : null}
    </View>
  );
}

/* the web has no snapToInterval, so the browser's own scroll snap does it there, and a soft blur stands in on a locked chart; a phone shows the fade alone */
const WEB = Platform.OS === 'web';
const SNAP_ROW = (WEB ? { scrollSnapType: 'x mandatory', scrollPaddingLeft: 16 } : null) as ViewStyle | null;
const SNAP_CARD = (WEB ? { scrollSnapAlign: 'start' } : null) as ViewStyle | null;
const BLUR = (WEB ? { filter: 'blur(3px)' } : null) as ViewStyle | null;

const s = StyleSheet.create({
  scroll: { marginHorizontal: -16 },
  row: { paddingHorizontal: 16, gap: GAP },
  head: { fontFamily: font.display, fontSize: 28, lineHeight: 34 },
  chart: { flex: 1, justifyContent: 'flex-end', marginTop: 4 },
  fade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 120 },
  ruler: { alignItems: 'center', marginTop: -2, marginBottom: -8 },
  tickHit: { height: 44, alignItems: 'center', justifyContent: 'center' },
  tick: { width: 2, height: 8, borderRadius: 1 },
  mark: { position: 'absolute', top: 12, width: 4, height: 20, borderRadius: 2 },
});

/** the plain line under a card's answer */
export function Say({ children }: { children: ReactNode }) {
  return (
    <T v="label" style={{ fontFamily: font.body }}>
      {children}
    </T>
  );
}
