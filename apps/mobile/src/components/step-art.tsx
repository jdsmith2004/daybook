/* The pictures on the step-down card (Today): the stretch on a ruler, and the plan's week as dots (core: view.ts,
   stepRuler and stepWeek). They say at a glance what the old card said in sentences: how far this stretch has come
   against your usual and your best, and which days this week had slips. Both are colored the way the month on Days is:
   warm light for the stretch and for a day with no slip, a calm violet for a day with slips. */
import { type stepRuler, type stepWeek } from '@daybook/core';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { router } from 'expo-router';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';

import { useOnce } from '@/components/talk-art';
import { Icon } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { font, useTheme } from '@/lib/theme';

const LW = 84;
/* the light of a run and the violet of a slip, as on the month (calendar-card.tsx) */
const RUN: [string, string, string] = ['#E8661C', '#FFB53A', '#FFC94D'];
const ON_RUN = '#4A1E05';
const SLIP = '#4C3C96';
/** the stretch so far, moving along a track, with your usual and your best marked on it */
export function StretchRuler({ r }: { r: ReturnType<typeof stepRuler> }) {
  const c = useTheme();
  const [w, setW] = useState(0);
  const v = useOnce(150, 900, false);
  const x = (h: number) => Math.max(0, Math.min(1, h / r.max)) * w;
  const at = x(r.cur);
  const col = { usual: c.muted, best: c.sunText, next: c.accentText };
  const label = (m: (typeof r.marks)[number]) => {
    const left = Math.max(0, Math.min(w - LW, x(m.h) - LW / 2));
    return (
      <Text
        key={m.k}
        style={[
          s.mLabel,
          {
            left,
            color: col[m.k],
            textAlign: x(m.h) < LW / 2 ? 'left' : x(m.h) > w - LW / 2 ? 'right' : 'center',
            fontFamily: m.k === 'usual' ? font.bodySemi : font.bodyBold,
          },
        ]}
        numberOfLines={1}>
        {m.label}
      </Text>
    );
  };
  const above = r.marks.filter((m) => m.k !== 'best');
  const below = r.marks.filter((m) => m.k === 'best');
  return (
    <View
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
      accessible
      accessibilityLabel={'This stretch, against ' + r.marks.map((m) => m.label).join(' and ')}
      style={{ alignSelf: 'stretch' }}>
      <View style={s.lRow}>{w ? above.map(label) : null}</View>
      <View style={s.trackBox}>
        <View style={[s.track, { backgroundColor: c.surface2 }]}>
          {w ? (
            <Animated.View style={[s.fill, { width: v.interpolate({ inputRange: [0, 1], outputRange: [0, at] }) }]}>
              <LinearGradient colors={RUN} locations={[0, 0.55, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
            </Animated.View>
          ) : null}
        </View>
        {w
          ? r.marks.map((m) => (
              <View key={m.k} style={[s.tick, { left: x(m.h) - 1.5, backgroundColor: m.k === 'usual' ? c.line : col[m.k] }]}>
                {m.k === 'best' ? (
                  <View style={[s.flag, { backgroundColor: c.sun }]}>
                    <Icon name="star" size={10} color={c.onSun} />
                  </View>
                ) : null}
              </View>
            ))
          : null}
        {w ? (
          <Animated.View
            style={[
              s.dot,
              { backgroundColor: RUN[2], borderColor: c.bg },
              { transform: [{ translateX: v.interpolate({ inputRange: [0, 1], outputRange: [-14, at - 14] }) }] },
            ]}>
            <Icon name="flame" size={15} color={ON_RUN} />
          </Animated.View>
        ) : null}
      </View>
      <View style={s.lRow}>{w ? below.map(label) : null}</View>
    </View>
  );
}

/** the plan's week: a dot for each day, a number on the days with slips, the days to come left open */
export function WeekDots({ week }: { week: ReturnType<typeof stepWeek> }) {
  const c = useTheme();
  return (
    <View
      style={s.week}
      accessible
      accessibilityLabel={
        'This week: ' +
        week
          .filter((d) => !d.ahead)
          .map((d) => (d.slips ? d.slips + (d.slips === 1 ? ' slip' : ' slips') : 'no slip'))
          .join(', ')
      }>
      {week.map((d) => {
        /* a day with no slip is lit, a day with slips is violet with its count, today so far is a warm ring, and the days
           to come are left open */
        const warm = !d.ahead && !d.slips && !d.today;
        const look = d.ahead
          ? { bg: 'transparent', bd: c.line, dash: true }
          : d.slips
            ? { bg: SLIP, bd: SLIP, dash: false }
            : d.today
              ? { bg: 'transparent', bd: RUN[1], dash: false }
              : { bg: 'transparent', bd: 'transparent', dash: false };
        return (
          <Pressable
            key={d.k}
            disabled={d.ahead}
            accessibilityRole="button"
            accessibilityLabel={
              d.k + ': ' + (d.ahead ? 'still to come' : d.slips ? d.slips + (d.slips === 1 ? ' slip' : ' slips') : 'no slip') + '. Open the day.'
            }
            onPress={() => {
              buzz('tap');
              router.push({ pathname: '/day/[date]', params: { date: d.k } });
            }}
            style={({ pressed }) => [s.day, pressed && { opacity: 0.7 }]}>
            <Text style={[s.dayL, { color: d.today ? c.accentText : c.muted, fontFamily: d.today ? font.bodyBold : font.bodySemi }]}>{d.l}</Text>
            <View
              style={[
                s.dayDot,
                { backgroundColor: look.bg, borderColor: look.bd, borderStyle: look.dash ? 'dashed' : 'solid' },
                d.today && { borderWidth: 2.5 },
              ]}>
              {warm ? <LinearGradient colors={RUN} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={[StyleSheet.absoluteFill, s.lit]} /> : null}
              {d.slips ? <Text style={[s.dayN, { color: '#E9E3FF' }]}>{d.slips}</Text> : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  lRow: { height: 18, position: 'relative' },
  mLabel: { position: 'absolute', top: 0, width: LW, fontSize: 13 },
  trackBox: { height: 30, justifyContent: 'center' },
  track: { height: 12, borderRadius: 6, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 6, overflow: 'hidden' },
  tick: { position: 'absolute', top: 4, width: 3, height: 22, borderRadius: 2, alignItems: 'center' },
  flag: { position: 'absolute', top: -14, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  dot: {
    position: 'absolute',
    left: 0,
    top: 1,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  week: { flexDirection: 'row', justifyContent: 'space-between', alignSelf: 'stretch' },
  day: { alignItems: 'center', gap: 5, width: 34 },
  dayL: { fontSize: 12 },
  dayDot: { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  lit: { borderRadius: 14 },
  dayN: { fontFamily: font.bodyBold, fontSize: 13 },
});
