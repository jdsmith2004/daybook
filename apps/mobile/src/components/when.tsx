/* When it happened (core: when.ts). A pill shows the day and time an entry is logged for ("Today · 9:47 PM"); a tap opens a
   sheet from the bottom to change it. The moment picked sits big at the top and is always what Save saves, even while a wheel
   is still turning. Under it: a row of quick picks, the days of the last month in a row, and a wheel each for the hour, the minute
   and AM or PM that roll round like a phone's own clock. Nothing is ever refused: a clock time still to come means the last time
   the clock said it (core whenPast). A time after midnight is kept with the day before, and the sheet says so. */
import {
  whenClock,
  whenCountsFor,
  whenDayWord,
  whenDays,
  whenFuture,
  whenLabel,
  whenOf,
  whenPast,
  whenQuick,
  whenSame,
  type DayKey,
  type When,
} from '@daybook/core';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Modal, Platform, Pressable, ScrollView, StyleSheet, View, type ScrollViewInstance } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Link } from '@/components/choices';
import { SHORT } from '@/components/fit';
import { BIG_MAX, Text } from '@/components/text';
import { Button, Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { NATIVE, SPRING, useReducedMotion } from '@/lib/motion';
import { font, MAX_WIDTH, useTheme } from '@/lib/theme';

/** the day and time an entry is logged for, as a pill; a tap changes it */
export function WhenPill({ w, now, onPress, none }: { w: When; now: number; onPress: () => void; none?: boolean }) {
  const c = useTheme();
  const label = none ? whenDayWord(w.day, now) + ' · No time' : whenLabel(w, now);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={'Logging for ' + label + '. Change the day or time'}
      onPress={() => {
        buzz('tap');
        onPress();
      }}
      style={({ pressed }) => [s.pill, { backgroundColor: c.scBtn, opacity: pressed ? 0.7 : 1 }]}>
      <Icon name="calendar" size={17} color={c.accentText} />
      <Text style={[s.pillT, { color: c.ink }]}>{label}</Text>
    </Pressable>
  );
}

const HOURS = ['12', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'];
const MINS = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
const HALF = ['AM', 'PM'];
/* the wheels roll round by repeating their rows, and go back to the middle copy once they stop. The web scrolls without help from
   the native side, so there they simply end. */
const HOUR_COPIES = NATIVE ? 7 : 1;
const MIN_COPIES = NATIVE ? 3 : 1;

/** the sheet. onSave gets the moment, or null for "not sure of the time" (with allowNone). */
export function WhenSheet({
  open,
  value,
  now,
  roll,
  title = 'When did it happen?',
  allowNone,
  onClose,
  onSave,
}: {
  open: boolean;
  value: When;
  now: number;
  roll: number;
  title?: string;
  allowNone?: boolean;
  onClose: () => void;
  onSave: (w: When | null) => void;
}) {
  const reduce = useReducedMotion();
  const [up, setUp] = useState(open);
  const a = useRef(new Animated.Value(0)).current;
  /* the dim fades while the sheet rises, so the two never slide up as one block; closing plays out before the page goes */
  useEffect(() => {
    if (open) {
      setUp(true);
      Animated.spring(a, { toValue: 1, ...SPRING.default, overshootClamping: true, useNativeDriver: NATIVE }).start();
    } else if (up) {
      Animated.timing(a, { toValue: 0, duration: 200, easing: Easing.in(Easing.quad), useNativeDriver: NATIVE }).start(({ finished }) => {
        if (finished) setUp(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  return (
    <Modal visible={up} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={s.wrap}>
        <Animated.View style={[StyleSheet.absoluteFill, s.dim, { opacity: a }]}>
          <Pressable accessibilityRole="button" accessibilityLabel="Close" style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>
        <Animated.View
          style={[s.rise, reduce ? { opacity: a } : { transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [640, 0] }) }] }]}>
          <WhenBody value={value} now={now} roll={roll} title={title} allowNone={allowNone} onClose={onClose} onSave={onSave} />
        </Animated.View>
      </View>
    </Modal>
  );
}

function WhenBody({
  value,
  now,
  roll,
  title,
  allowNone,
  onClose,
  onSave,
}: {
  value: When;
  now: number;
  roll: number;
  title: string;
  allowNone?: boolean;
  onClose: () => void;
  onSave: (w: When | null) => void;
}) {
  const c = useTheme();
  const inset = useSafeAreaInsets();
  /* the clock is read once, when the sheet opens, so "Just now" does not move away under the finger */
  const [at] = useState(now);
  /* what the wheels say; `shown`, what it means, is what the page says and what Save saves */
  const [w, setW] = useState<When>(() => (whenFuture(value, now) ? whenOf(now) : value));
  const shown = whenPast(w, at, roll);
  /* the whole last month, also before the person started: a slip from before setup is still theirs to log (the owner, November 2, 2026) */
  const days = useMemo(() => {
    const list = whenDays(at);
    if (list.indexOf(value.day) < 0) list.push(value.day);
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const quick = whenQuick(at, roll);
  /* once a wheel stops on a moment that means something else (just ahead of now), it turns to it */
  const settle = () =>
    setW((x) => {
      const p = whenPast(x, at, roll);
      return p.h !== x.h || p.m !== x.m ? p : x;
    });
  const under = whenCountsFor(shown, roll);

  return (
    <View style={[s.sheet, { backgroundColor: c.surface, paddingBottom: inset.bottom + 16 }]}>
      <View style={s.head}>
        <View style={{ flex: 1 }}>
          <T tone="muted" accessibilityRole="header">
            {title}
          </T>
          <Text
            maxFontSizeMultiplier={BIG_MAX}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
            style={[s.big, { color: c.ink }]}
            accessibilityLiveRegion="polite">
            {whenDayWord(shown.day, at)}, {whenClock(shown)}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={onClose}
          style={({ pressed }) => [s.x, { backgroundColor: c.surface2, opacity: pressed ? 0.7 : 1 }]}>
          <Icon name="x" color={c.ink} />
        </Pressable>
      </View>
      {/* the room is kept, so nothing moves when the line comes */}
      <Text style={[s.note, { color: c.muted }]}>{under || ' '}</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.quickRow} contentContainerStyle={s.quick}>
        {quick.map((q) => {
          const on = whenSame(q.w, shown);
          return (
            <Pressable
              key={q.id}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              onPress={() => {
                buzz('tap');
                setW(q.w);
              }}
              style={({ pressed }) => [s.q, { backgroundColor: on ? c.accentSoft : 'transparent', opacity: pressed ? 0.7 : 1 }]}>
              <Text style={[s.qT, { color: c.accentText }]}>{q.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <DayRow
        days={days}
        day={shown.day}
        now={at}
        onPick={(day) =>
          setW((x) => {
            const next = { ...x, day };
            return whenFuture(next, at) ? whenOf(at) : next;
          })
        }
      />

      <View style={s.wheels}>
        <View style={[s.band, { backgroundColor: c.accentSoft }]} pointerEvents="none" />
        <Wheel
          label="Hour"
          items={HOURS}
          copies={HOUR_COPIES}
          index={w.h % 12}
          onChange={(i) => setW((x) => ({ ...x, h: i + (x.h >= 12 ? 12 : 0) }))}
          onSettle={settle}
        />
        <Text style={[s.colon, { color: c.ink }]}>:</Text>
        <Wheel label="Minute" items={MINS} copies={MIN_COPIES} index={w.m} onChange={(i) => setW((x) => ({ ...x, m: i }))} onSettle={settle} />
        <Wheel
          label="AM or PM"
          items={HALF}
          index={w.h >= 12 ? 1 : 0}
          onChange={(i) => setW((x) => ({ ...x, h: (x.h % 12) + (i ? 12 : 0) }))}
          onSettle={settle}
        />
      </View>

      <View style={s.foot}>
        <Button
          label="Save"
          onPress={() => {
            buzz('save');
            onSave(shown);
          }}
        />
        {allowNone ? (
          <View style={{ alignItems: 'center' }}>
            <Link label="Not sure of the time" tone="muted" onPress={() => onSave(null)} />
          </View>
        ) : null}
      </View>
    </View>
  );
}

/** the days, today first, running off the sheet's edge: the day of the week over the date. The month is in the moment above. */
function DayRow({ days, day, now, onPick }: { days: DayKey[]; day: DayKey; now: number; onPick: (d: DayKey) => void }) {
  const c = useTheme();
  const ref = useRef<ScrollViewInstance>(null);
  const spots = useRef(new Map<DayKey, { x: number; w: number }>());
  const room = useRef(0);
  const placed = useRef(false);
  /* the picked day is always in view, also when it is picked from elsewhere, or is far back when the sheet opens */
  const show = (animated: boolean) => {
    const p = spots.current.get(day);
    if (!p || !room.current) return false;
    ref.current?.scrollTo({ x: Math.max(0, p.x + p.w / 2 - room.current / 2), animated });
    return true;
  };
  /* the first time, once both the row and the day are measured, whichever comes last */
  const place = () => {
    if (!placed.current) placed.current = show(false);
  };
  useEffect(() => {
    if (placed.current) show(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day]);
  return (
    <ScrollView
      ref={ref}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={s.dayRow}
      contentContainerStyle={s.days}
      onLayout={(e) => {
        room.current = e.nativeEvent.layout.width;
        place();
      }}
      onContentSizeChange={place}
      accessibilityRole="radiogroup"
      accessibilityLabel="Day">
      {days.map((k, i) => {
        const on = k === day;
        const [y, m, d] = k.split('-').map(Number);
        const word = whenDayWord(k, now);
        return (
          <Pressable
            key={k}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            accessibilityLabel={word}
            onLayout={(e) => {
              spots.current.set(k, { x: e.nativeEvent.layout.x, w: e.nativeEvent.layout.width });
              place();
            }}
            onPress={() => {
              buzz('tap');
              onPick(k);
            }}
            style={({ pressed }) => [s.day, { backgroundColor: on ? c.accent : 'transparent', opacity: pressed ? 0.7 : 1 }]}>
            <Text style={[s.dayW, { color: on ? c.accentInk : c.muted }]}>
              {i < 2 ? word : new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'short' })}
            </Text>
            <Text style={[s.dayN, { color: on ? c.accentInk : c.ink }]}>{d}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const ITEM = SHORT ? 36 : 40;
const VIS = 5;
const mod = (i: number, n: number) => ((i % n) + n) % n;

/** one row: its size and how clear it is follow the scroll itself, so it grows into the band smoothly, on the native side */
function WheelRow({ y, j, text, ink, onPress }: { y: Animated.Value; j: number; text: string; ink: string; onPress: (j: number) => void }) {
  const inputRange = [(j - 2) * ITEM, (j - 1) * ITEM, j * ITEM, (j + 1) * ITEM, (j + 2) * ITEM];
  const opacity = y.interpolate({ inputRange, outputRange: [0.18, 0.5, 1, 0.5, 0.18], extrapolate: 'clamp' });
  const scale = y.interpolate({ inputRange, outputRange: [0.62, 0.74, 1, 0.74, 0.62], extrapolate: 'clamp' });
  return (
    <Pressable onPress={() => onPress(j)} style={s.item} importantForAccessibility="no" accessibilityElementsHidden>
      <Animated.View style={{ opacity, transform: [{ scale }] }}>
        <Text maxFontSizeMultiplier={1.1} style={[s.itemT, { color: ink }]}>
          {text}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

/** one wheel: scroll it, or tap a number. Whichever row is in the band is the answer from the moment it gets there, so a tap on
    Save never loses a wheel still turning. It always comes to rest on a row. */
function Wheel({
  label,
  items,
  index,
  copies = 1,
  onChange,
  onSettle,
}: {
  label: string;
  items: string[];
  index: number;
  copies?: number;
  onChange: (i: number) => void;
  onSettle: () => void;
}) {
  const c = useTheme();
  const n = items.length;
  const total = n * copies;
  const home = n * Math.floor(copies / 2);
  const start = home + index;
  const ref = useRef<ScrollViewInstance>(null);
  const offset = useRef({ x: 0, y: start * ITEM }).current;
  const y = useRef(new Animated.Value(start * ITEM)).current;
  /* the row in the band; the row it is being turned to, when no finger is doing it; a finger on it; what it has said since it last stopped */
  const at = useRef(start);
  const turning = useRef<number | null>(null);
  const held = useRef(false);
  const said = useRef<number[]>([]);
  const lastY = useRef(start * ITEM);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef({ index, onChange, onSettle });
  latest.current = { index, onChange, onSettle };
  const clamp = (i: number) => Math.max(0, Math.min(total - 1, i));

  const turnTo = (t: number) => {
    turning.current = t;
    ref.current?.scrollTo({ y: t * ITEM, animated: true });
    /* its scroll events put this off until it has stopped; with nothing to scroll there are none */
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(rest, 450);
  };
  /* the nearest copy of a row, going round the short way */
  const nearest = (i: number) => {
    const from = turning.current ?? at.current;
    let d = mod(i - from, n);
    if (copies > 1 && d > n / 2) d -= n;
    return clamp(from + d);
  };
  const tell = (i: number) => {
    said.current.push(mod(i, n));
    latest.current.onChange(mod(i, n));
  };
  /* it stops: onto a row, and back to the middle copy, however it stopped (some drags end with no event after them) */
  const rest = () => {
    timer.current = null;
    if (held.current) return;
    const py = lastY.current;
    const i = turning.current ?? clamp(Math.round(py / ITEM));
    if (Math.abs(py - i * ITEM) > 0.5) {
      ref.current?.scrollTo({ y: i * ITEM, animated: true });
      timer.current = setTimeout(rest, 400);
      return;
    }
    turning.current = null;
    at.current = i;
    said.current = [];
    const stay = home + mod(i, n);
    if (copies > 1 && stay !== i) {
      at.current = stay;
      lastY.current = stay * ITEM;
      ref.current?.scrollTo({ y: stay * ITEM, animated: false });
    }
    if (mod(i, n) !== latest.current.index) turnTo(nearest(latest.current.index));
    latest.current.onSettle();
  };
  const restSoon = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(rest, 120);
  };
  const moved = useRef((_: number) => {});
  moved.current = (py: number) => {
    lastY.current = py;
    const i = clamp(Math.round(py / ITEM));
    if (turning.current === null && i !== at.current) {
      at.current = i;
      buzz('tick');
      tell(i);
    }
    if (!held.current) restSoon();
  };
  const onScroll = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { y } } }], {
        useNativeDriver: NATIVE,
        listener: (e: { nativeEvent: { contentOffset: { y: number } } }) => moved.current(e.nativeEvent.contentOffset.y),
      }),
    [y],
  );
  /* a change from outside (a quick pick, a day that moved the time): turn to it. What the wheel said itself is no change. */
  useEffect(() => {
    if (said.current.indexOf(index) >= 0) return;
    if (mod(turning.current ?? at.current, n) === index) return;
    turnTo(nearest(index));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);
  const tap = useRef((_: number) => {});
  tap.current = (j: number) => {
    buzz('tap');
    if (mod(j, n) !== mod(at.current, n)) tell(j);
    turnTo(j);
  };
  const rows = useMemo(
    () => Array.from({ length: total }, (_, j) => <WheelRow key={j} y={y} j={j} text={items[j % n]} ink={c.ink} onPress={(k) => tap.current(k)} />),
    [total, y, items, n, c.ink],
  );
  const stepBy = (d: number) => {
    const j = clamp((turning.current ?? at.current) + d);
    tell(j);
    turnTo(j);
  };
  return (
    <View
      style={s.wheel}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ text: items[index] }}
      aria-valuetext={items[index]}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => stepBy(e.nativeEvent.actionName === 'increment' ? 1 : -1)}>
      <Animated.ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM}
        decelerationRate="fast"
        scrollEventThrottle={16}
        nestedScrollEnabled
        contentOffset={offset}
        contentContainerStyle={{ paddingVertical: ITEM * 2 }}
        onLayout={() => {
          /* the web takes no starting offset */
          if (Platform.OS === 'web') setTimeout(() => ref.current?.scrollTo({ y: at.current * ITEM, animated: false }), 0);
        }}
        onScroll={onScroll}
        onScrollBeginDrag={() => {
          held.current = true;
          turning.current = null;
          if (timer.current) clearTimeout(timer.current);
        }}
        onScrollEndDrag={(e) => {
          held.current = false;
          lastY.current = e.nativeEvent.contentOffset.y;
          restSoon();
        }}>
        {rows}
      </Animated.ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  pill: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 999,
  },
  pillT: { fontFamily: font.bodySemi, fontSize: 15 },
  wrap: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  dim: { backgroundColor: 'rgba(16,10,40,0.42)' },
  rise: { width: '100%', maxWidth: MAX_WIDTH },
  sheet: { paddingTop: 16, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 16 },
  x: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  big: { fontFamily: font.display, fontSize: 28, lineHeight: 34 },
  note: { fontFamily: font.bodyMedium, fontSize: 13, lineHeight: 18, minHeight: 18, paddingHorizontal: 16, marginTop: 2 },
  /* the words of the first pick line up with the moment above them */
  quickRow: { flexGrow: 0, marginTop: 4 },
  quick: { gap: 4, paddingHorizontal: 4 },
  q: { minHeight: 44, paddingHorizontal: 12, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  qT: { fontFamily: font.bodySemi, fontSize: 15 },
  dayRow: { flexGrow: 0, marginTop: 8 },
  days: { gap: 4, paddingHorizontal: 8 },
  day: { minWidth: 52, paddingHorizontal: 8, paddingVertical: 8, borderRadius: 20, alignItems: 'center' },
  dayW: { fontFamily: font.bodySemi, fontSize: 13, lineHeight: 18 },
  dayN: { fontFamily: font.display, fontSize: 20, lineHeight: 24 },
  wheels: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', height: ITEM * VIS, marginTop: 8, marginHorizontal: 16 },
  band: { position: 'absolute', left: 0, right: 0, top: ITEM * 2, height: ITEM, borderRadius: 12 },
  wheel: { width: 76, height: ITEM * VIS },
  colon: { fontFamily: font.display, fontSize: 28, lineHeight: 34, marginTop: -4 },
  item: { height: ITEM, alignItems: 'center', justifyContent: 'center' },
  itemT: { fontFamily: font.display, fontSize: 28, lineHeight: 34 },
  foot: { paddingHorizontal: 16, paddingTop: 12 },
});
