/* When it happened (core: when.ts). A pill shows the day and time an entry is logged for ("Today · 9:47 PM"); a tap opens a
   sheet from the bottom to change it: quick picks (Just now, 1 hour ago, Last night), the days of the last two weeks in a
   strip, and a wheel for the hour, the minute and AM or PM, like a phone's own clock. The moment picked big at the top
   says what will be saved. A time after midnight is kept with the day before, and the sheet says so. */
import { addDays, whenClock, whenDayWord, whenDays, whenFiledUnder, whenFuture, whenLabel, whenQuick, whenSame, type DayKey, type When } from '@daybook/core';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, View, type ScrollViewInstance } from 'react-native';
import { Text } from '@/components/text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Appear } from '@/components/appear';
import { Button, Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
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
      style={({ pressed }) => [
        s.pill,
        { backgroundColor: c.surface, borderColor: c.cardEdge, shadowColor: c.lip, transform: [{ translateY: pressed ? 2 : 0 }] },
      ]}>
      <Icon name="calendar" size={17} color={c.accentText} />
      <Text style={[s.pillT, { color: c.ink }]}>{label}</Text>
      <View style={[s.pillGo, { backgroundColor: c.accentSoft }]}>
        <Icon name="pencil" size={13} color={c.accentText} />
      </View>
    </Pressable>
  );
}

const HOURS = ['12', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'];
const MINS = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
const HALF = ['AM', 'PM'];

/** the sheet: quick picks, the day, and the time. onSave gets the moment, or null for "not sure of the time" (with allowNone). */
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
  const c = useTheme();
  const inset = useSafeAreaInsets();
  const [w, setW] = useState<When>(value);
  /* each time it opens, it starts from the moment shown */
  useEffect(() => {
    if (open) setW(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  const days = whenDays(now, 14);
  if (days.indexOf(value.day) < 0) days.push(value.day);
  const future = whenFuture(w, now);
  const under = whenFiledUnder(w, roll);
  const quick = whenQuick(now, roll);
  const set = (x: When) => setW(x);

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={s.wrap}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(16,10,40,0.42)' }]}
          onPress={onClose}
        />
        <View style={[s.sheet, { backgroundColor: c.surface, paddingBottom: inset.bottom + 16, shadowColor: '#000' }]}>
          <View style={[s.handle, { backgroundColor: c.line }]} />
          <T v="eyebrow" tone="muted" style={s.c} accessibilityRole="header">
            {title}
          </T>
          {/* what will be saved, big */}
          <Appear key={w.day + w.h + w.m} by={4} duration={160}>
            <Text style={[s.big, { color: future ? c.muted : c.ink }]} accessibilityLiveRegion="polite">
              {whenDayWord(w.day, now)}, {whenClock(w)}
            </Text>
          </Appear>
          <Text style={[s.note, { color: future ? c.slipText : c.muted }]}>
            {future
              ? 'That time has not come yet.'
              : under
                ? 'After midnight, so it counts for ' +
                  whenDayWord(under, now)
                    .replace(/^Today$/, 'today')
                    .replace(/^Yesterday$/, 'yesterday') +
                  '.'
                : ' '}
          </Text>

          <View style={s.quick}>
            {quick.map((q) => {
              const on = whenSame(q.w, w);
              return (
                <Pressable
                  key={q.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  onPress={() => {
                    buzz('tap');
                    set(q.w);
                  }}
                  style={[s.q, { backgroundColor: on ? c.accent : c.accentSoft }]}>
                  <Text style={[s.qT, { color: on ? c.accentInk : c.accentText }]}>{q.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <DayStrip days={days} day={w.day} now={now} onPick={(day) => set({ ...w, day })} />

          <View style={s.wheels}>
            <View style={[s.band, { backgroundColor: c.accentSoft }]} pointerEvents="none" />
            <Wheel label="Hour" items={HOURS} index={w.h % 12} onChange={(i) => set({ ...w, h: i + (w.h >= 12 ? 12 : 0) })} width={74} />
            <Text style={[s.colon, { color: c.ink }]}>:</Text>
            <Wheel label="Minute" items={MINS} index={w.m} onChange={(i) => set({ ...w, m: i })} width={74} />
            <Wheel label="AM or PM" items={HALF} index={w.h >= 12 ? 1 : 0} onChange={(i) => set({ ...w, h: (w.h % 12) + (i ? 12 : 0) })} width={74} />
            <LinearGradient colors={[c.surface, c.surface + '00']} style={[s.fade, { top: 0 }]} pointerEvents="none" />
            <LinearGradient colors={[c.surface + '00', c.surface]} style={[s.fade, { bottom: 0 }]} pointerEvents="none" />
          </View>

          <Button
            label={future ? 'Pick an earlier time' : 'Save'}
            disabled={future}
            onPress={() => {
              buzz('save');
              onSave(w);
            }}
          />
          <View style={s.links}>
            {allowNone ? (
              <Pressable accessibilityRole="button" hitSlop={8} onPress={() => onSave(null)}>
                <Text style={[s.link, { color: c.accentText }]}>Not sure of the time</Text>
              </Pressable>
            ) : null}
            <Pressable accessibilityRole="button" hitSlop={8} onPress={onClose}>
              <Text style={[s.link, { color: c.accentText }]}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/** the last two weeks, today first: the day of the week over the date */
function DayStrip({ days, day, now, onPick }: { days: DayKey[]; day: DayKey; now: number; onPick: (d: DayKey) => void }) {
  const c = useTheme();
  const ref = useRef<ScrollViewInstance>(null);
  const today = days[0];
  return (
    <ScrollView
      ref={ref}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={s.days}
      accessibilityRole="radiogroup"
      accessibilityLabel="Day">
      {days.map((k) => {
        const on = k === day;
        const [y, m, d] = k.split('-').map(Number);
        const dt = new Date(y, m - 1, d);
        const top = k === today ? 'Today' : k === addDays(today, -1) ? 'Yest.' : dt.toLocaleDateString('en-US', { weekday: 'short' });
        return (
          <Pressable
            key={k}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            accessibilityLabel={whenDayWord(k, now)}
            onPress={() => {
              buzz('tap');
              onPick(k);
            }}
            style={[s.day, { backgroundColor: on ? c.accent : c.surface2, borderColor: on ? c.accent : c.line }]}>
            <Text style={[s.dayW, { color: on ? c.accentInk : c.muted }]}>{top}</Text>
            <Text style={[s.dayN, { color: on ? c.accentInk : c.ink }]}>{d}</Text>
            <Text style={[s.dayM, { color: on ? c.accentInk : c.muted }]}>{dt.toLocaleDateString('en-US', { month: 'short' })}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const ITEM = 42;
const VIS = 5;
/** one wheel: scroll it, or tap a number. It settles on the nearest one, and the one in the middle band is the answer. */
function Wheel({ label, items, index, onChange, width }: { label: string; items: string[]; index: number; onChange: (i: number) => void; width: number }) {
  const c = useTheme();
  const ref = useRef<ScrollViewInstance>(null);
  const [live, setLive] = useState(index);
  const mine = useRef(index);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const placed = useRef(false);
  const clamp = (i: number) => Math.max(0, Math.min(items.length - 1, i));
  /* a change from outside (a quick pick, another wheel): turn to it */
  useEffect(() => {
    if (index === mine.current) return;
    mine.current = index;
    setLive(index);
    ref.current?.scrollTo({ y: index * ITEM, animated: true });
  }, [index]);
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);
  const settle = (y: number) => {
    const i = clamp(Math.round(y / ITEM));
    if (Math.abs(y - i * ITEM) > 1) ref.current?.scrollTo({ y: i * ITEM, animated: true });
    if (i !== mine.current) {
      mine.current = i;
      onChange(i);
    }
  };
  const to = (i: number) => {
    mine.current = i;
    setLive(i);
    ref.current?.scrollTo({ y: i * ITEM, animated: true });
    onChange(i);
  };
  return (
    <View
      style={{ width, height: ITEM * VIS }}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ text: items[index] }}
      aria-valuetext={items[index]}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => to(clamp(index + (e.nativeEvent.actionName === 'increment' ? 1 : -1)))}>
      <ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM}
        decelerationRate="fast"
        scrollEventThrottle={16}
        nestedScrollEnabled
        contentContainerStyle={{ paddingVertical: ITEM * 2 }}
        onLayout={() => {
          if (placed.current) return;
          placed.current = true;
          setTimeout(() => ref.current?.scrollTo({ y: index * ITEM, animated: false }), 0);
        }}
        onScroll={(e) => {
          const y = e.nativeEvent.contentOffset.y;
          const i = clamp(Math.round(y / ITEM));
          if (i !== live) {
            setLive(i);
            buzz('tick');
          }
          /* on the web there is no end-of-scroll event: it settles once the scrolling stops */
          if (Platform.OS === 'web') {
            if (timer.current) clearTimeout(timer.current);
            timer.current = setTimeout(() => settle(y), 130);
          }
        }}
        onMomentumScrollEnd={(e) => settle(e.nativeEvent.contentOffset.y)}
        onScrollEndDrag={(e) => {
          if (!e.nativeEvent.velocity || Math.abs(e.nativeEvent.velocity.y) < 0.05) settle(e.nativeEvent.contentOffset.y);
        }}>
        {items.map((x, i) => {
          const d = Math.abs(i - live);
          return (
            <Pressable key={x} onPress={() => to(i)} style={s.item} importantForAccessibility="no">
              <Text
                style={{
                  fontFamily: d === 0 ? font.display : font.bodySemi,
                  fontSize: d === 0 ? 26 : d === 1 ? 20 : 17,
                  color: d === 0 ? c.ink : c.muted,
                  opacity: d === 0 ? 1 : d === 1 ? 0.75 : 0.4,
                }}>
                {x}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  c: { textAlign: 'center' },
  pill: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
    paddingLeft: 14,
    paddingRight: 6,
    borderRadius: 999,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  pillT: { fontFamily: font.bodyBold, fontSize: 16 },
  pillGo: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  wrap: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  sheet: {
    width: '100%',
    maxWidth: MAX_WIDTH,
    gap: 12,
    paddingTop: 10,
    paddingHorizontal: 18,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 16,
  },
  handle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, marginBottom: 2 },
  big: { fontFamily: font.display, fontSize: 28, lineHeight: 34, textAlign: 'center' },
  note: { fontFamily: font.bodyMedium, fontSize: 13.5, textAlign: 'center', marginTop: -6, minHeight: 18 },
  quick: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  q: { minHeight: 38, paddingHorizontal: 14, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  qT: { fontFamily: font.bodySemi, fontSize: 14.5 },
  days: { gap: 8, paddingHorizontal: 2, paddingVertical: 2 },
  day: { width: 56, paddingVertical: 8, borderRadius: 16, borderWidth: 1.5, alignItems: 'center', gap: 1 },
  dayW: { fontFamily: font.bodySemi, fontSize: 11.5 },
  dayN: { fontFamily: font.display, fontSize: 20, lineHeight: 24 },
  dayM: { fontFamily: font.body, fontSize: 11 },
  wheels: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4, height: ITEM * VIS, overflow: 'hidden' },
  band: { position: 'absolute', left: 8, right: 8, top: ITEM * 2, height: ITEM, borderRadius: 14 },
  colon: { fontFamily: font.display, fontSize: 24, marginTop: -4 },
  fade: { position: 'absolute', left: 0, right: 0, height: ITEM * 1.6 },
  item: { height: ITEM, alignItems: 'center', justifyContent: 'center' },
  links: { flexDirection: 'row', justifyContent: 'center', gap: 28, minHeight: 32, alignItems: 'center' },
  link: { fontFamily: font.bodySemi, fontSize: 15, textDecorationLine: 'underline' },
});
