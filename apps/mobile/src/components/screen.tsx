/* A scrolling screen with the page color, a title, and room for the tab bar. A page opened on top of the tabs (from More, or
   from a lesson) gets a Back button that names the page underneath it. On the web the page eases in. A screen can follow its
   own scrolling (onScroll), float something over its top that stays put while the page scrolls (overlay), keep a small
   button beside its title (action), and open something when it is pulled down past its top (pullDown: Today opens the
   journal; components/pull-door.tsx). */
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useMemo, useRef, useState, type ReactNode, type Ref } from 'react';
import { Animated, Platform, Pressable, ScrollView, StyleSheet, useWindowDimensions, View, type ScrollViewInstance } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Appear } from '@/components/appear';
import { KeyboardRoom, useKeyboardRoom } from '@/components/keyboard';
import { PULL_ARM, PullDoor, rubber } from '@/components/pull-door';
import { Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { SPRING } from '@/lib/motion';
import { useBackLabel, useOverModal } from '@/lib/nav';
import { MAX_WIDTH, useTheme } from '@/lib/theme';

export function Screen({
  eyebrow,
  title,
  sub,
  children,
  scrollRef,
  back,
  onScroll,
  overlay,
  action,
  hidden,
  pullDown,
  top,
  bare,
}: {
  eyebrow?: string;
  title: string;
  /** something under the title, like the phase chip on Today */
  sub?: ReactNode;
  children: ReactNode;
  scrollRef?: Ref<ScrollViewInstance>;
  /** a page on top of the tabs: show Back (or a label for it) */
  back?: boolean | string;
  /** how far the page has scrolled, and how tall the screen is (also once at the start) */
  onScroll?: (y: number, height: number) => void;
  /** something that floats over the top of the page and stays put */
  overlay?: ReactNode;
  /** a small button at the top right, beside the title */
  action?: ReactNode;
  /** keep the page out of sight while it moves into place (Learn scrolls to the next lesson before it shows) */
  hidden?: boolean;
  /** pulled down past its top and let go: open something, which starts this far down the screen (its bottom edge) */
  pullDown?: (px: number) => void;
  /** a picture that fills the top of the page from edge to edge, under the clock, in place of the title (Today's sky) */
  top?: ReactNode;
  /** the picture is still under the clock, so no band of the page color there */
  bare?: boolean;
}) {
  const c = useTheme();
  const safe = useSafeAreaInsets();
  /* on iOS a page opened over a sheet or a full-screen moment is itself a card below the status bar (components/sheet.tsx) */
  const over = useOverModal();
  const card = Platform.OS === 'ios' && over;
  const inset = card ? { ...safe, top: 0 } : safe;
  const label = useBackLabel(typeof back === 'string' ? back : 'Back');
  const y = useRef(0);
  const kb = useKeyboardRoom(scrollRef, card);
  const pull = usePull(pullDown, inset.top, y);
  const Scroll = pull.ios ? Animated.ScrollView : ScrollView;
  const page = (
    <Scroll
      ref={kb.ref}
      style={[{ flex: 1, backgroundColor: c.bg }, pull.on && Platform.OS === 'web' ? ({ overscrollBehaviorY: 'contain' } as object) : null]}
      onLayout={onScroll ? (e) => onScroll(y.current, e.nativeEvent.layout.height) : undefined}
      onScroll={
        pull.ios
          ? pull.onScroll(onScroll)
          : onScroll || pull.on
            ? (e) => {
                y.current = e.nativeEvent.contentOffset.y;
                onScroll?.(y.current, e.nativeEvent.layoutMeasurement.height);
              }
            : undefined
      }
      onScrollBeginDrag={pull.ios ? pull.onBeginDrag : undefined}
      onScrollEndDrag={pull.ios ? pull.onEndDrag : undefined}
      scrollEventThrottle={pull.ios ? 16 : onScroll || pull.on ? 32 : undefined}
      contentInsetAdjustmentBehavior="never"
      automaticallyAdjustKeyboardInsets
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[s.content, { paddingTop: top ? 0 : inset.top + (back ? 8 : 16), paddingBottom: back ? inset.bottom + 32 : 32 }]}>
      {top ? <View style={s.top}>{top}</View> : null}
      <Appear webOnly style={[s.col, top ? { marginTop: 16 } : null, hidden ? { opacity: 0 } : null]}>
        {back ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={label}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
            style={s.back}>
            <Icon name="back" size={22} color={c.accentText} />
            {typeof back === 'string' ? (
              <T v="label" style={{ color: c.accentText }}>
                {label}
              </T>
            ) : null}
          </Pressable>
        ) : null}
        {top ? null : (
          <View style={{ gap: 2, marginBottom: 4 }}>
            <View style={s.head}>
              <View style={{ flex: 1, gap: 2 }}>
                {eyebrow ? (
                  <T v="eyebrow" tone="muted">
                    {eyebrow}
                  </T>
                ) : null}
                <T v="title" accessibilityRole="header">
                  {title}
                </T>
              </View>
              {action}
            </View>
            {sub}
          </View>
        )}
        <KeyboardRoom room={kb.room}>{children}</KeyboardRoom>
      </Appear>
    </Scroll>
  );
  /* the page scrolls under the clock and the battery: a band of the page color keeps them readable */
  const bar =
    inset.top && !bare ? (
      <LinearGradient pointerEvents="none" colors={[c.bg, c.bg, c.bg + '00']} locations={[0, 0.75, 1]} style={[s.bar, { height: inset.top + 12 }]} />
    ) : null;
  return (
    <View onLayout={kb.onLayout} style={{ flex: 1 }} {...pull.touch}>
      {pull.on && !pull.ios ? <Animated.View style={{ flex: 1, transform: [{ translateY: pull.value }] }}>{page}</Animated.View> : page}
      {bar}
      {pull.on ? <PullDoor pull={pull.value} armed={pull.armed} top={inset.top} /> : null}
      {overlay ? (
        <View pointerEvents="box-none" style={[s.over, { top: inset.top + 8 }, hidden ? { opacity: 0 } : null]}>
          <View pointerEvents="box-none" style={s.col}>
            {overlay}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  content: { paddingHorizontal: 16, alignItems: 'center' },
  col: { width: '100%', maxWidth: MAX_WIDTH, gap: 16 },
  top: { alignSelf: 'stretch', marginHorizontal: -16 },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  over: { position: 'absolute', left: 16, right: 16, alignItems: 'center' },
  bar: { position: 'absolute', top: 0, left: 0, right: 0 },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    alignSelf: 'flex-start',
    minHeight: 44,
    minWidth: 44,
    marginLeft: -4,
  },
});

/* a touch's height on the page: React Native gives it on the event, the web on the event's first touch */
type TouchLike = { nativeEvent: { pageY?: number; touches?: ArrayLike<{ pageY: number }> } };
const pageY = (e: TouchLike) => e.nativeEvent.pageY ?? e.nativeEvent.touches?.[0]?.pageY ?? 0;

/* the pull down past the top (components/pull-door.tsx): on iOS it is the page's own bounce, read from the scroll offset on
   the UI thread; elsewhere the touch is followed while the page is at the top, with the same give. It ticks once on the way
   past the line (and softly if it goes back), and letting go past it opens what the screen opens. */
function usePull(open: ((px: number) => void) | undefined, top: number, y: { current: number }) {
  const on = !!open;
  const ios = on && Platform.OS === 'ios';
  const { height: H } = useWindowDimensions();
  const offset = useRef(new Animated.Value(0)).current;
  const touch = useRef(new Animated.Value(0)).current;
  const value = useMemo(
    () =>
      ios
        ? offset.interpolate({ inputRange: [-2000, 0], outputRange: [2000, 0], extrapolate: 'clamp' })
        : touch.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: 'extend' }),
    [ios, offset, touch],
  );
  const [armed, setArmed] = useState(false);
  const armedRef = useRef(false);
  /* only while the thumb is on the page: the page settling back after a let go is not a pull */
  const held = useRef(false);
  const arm = (p: number) => {
    const a = held.current && p >= PULL_ARM;
    if (a === armedRef.current) return;
    armedRef.current = a;
    setArmed(a);
    if (held.current) buzz(a ? 'tick' : 'roll');
  };
  const letGo = (p: number) => {
    const go = armedRef.current;
    held.current = false;
    arm(0);
    if (go && open) open(top + p);
  };
  /* iOS: one handler for the life of the page (a new one each render would be wired to the page again each time) */
  const mineRef = useRef<((y: number, height: number) => void) | undefined>(undefined);
  const armRef = useRef(arm);
  armRef.current = arm;
  const iosScroll = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { y: offset } } }], {
        useNativeDriver: true,
        listener: (e: { nativeEvent: { contentOffset: { y: number }; layoutMeasurement: { height: number } } }) => {
          y.current = e.nativeEvent.contentOffset.y;
          mineRef.current?.(y.current, e.nativeEvent.layoutMeasurement.height);
          armRef.current(-y.current);
        },
      }),
    [offset, y],
  );
  /* Android and the web */
  const t0 = useRef(0);
  const last = useRef(0);
  const touchProps =
    on && !ios
      ? {
          onTouchStart: (e: TouchLike) => {
            t0.current = pageY(e);
            held.current = y.current <= 1;
            last.current = 0;
          },
          onTouchMove: (e: TouchLike) => {
            if (!held.current) return;
            const dy = pageY(e) - t0.current;
            if (dy < -8) held.current = false;
            const p = dy > 0 ? rubber(dy, H) : 0;
            last.current = p;
            touch.setValue(p);
            arm(p);
          },
          onTouchEnd: () => {
            if (!held.current && !last.current) return;
            letGo(last.current);
            last.current = 0;
            Animated.spring(touch, { toValue: 0, ...SPRING.default, useNativeDriver: false }).start();
          },
          onTouchCancel: () => {
            held.current = false;
            arm(0);
            last.current = 0;
            Animated.spring(touch, { toValue: 0, ...SPRING.default, useNativeDriver: false }).start();
          },
        }
      : {};
  return {
    on,
    ios,
    value,
    armed,
    touch: touchProps,
    onScroll: (mine?: (y: number, height: number) => void) => {
      mineRef.current = mine;
      return iosScroll;
    },
    onBeginDrag: () => {
      held.current = true;
    },
    onEndDrag: (e: { nativeEvent: { contentOffset: { y: number } } }) => letGo(Math.max(0, -e.nativeEvent.contentOffset.y)),
  };
}
