/* The setup pages that show what Daybook gives, between the questions (the owner, November 14, 2026: setup "needs a couple screens
   just demonstrating the extreme beneifi and need of daybook it is all business (setup) and no pleasure"). Each is a picture first:
   a year of marks at the person's own pace (core obYear), the flame growing stop by stop (obGrow, the page's flame itself changes
   form), and a slip the person taps, which takes nothing away here (SlipDemo). Words come from core setup.ts. */
import { obGrow, obYearMarks, type SetupAnswers } from '@daybook/core';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Slider } from '@/components/slider';
import { useReducedMotion } from '@/lib/motion';
import { font, useTheme } from '@/lib/theme';

/** a year as 365 small marks, a week to a column: the times it happens now in amber, then (after a beat) each one turning to flame
    gold, left to right, as the ones that can be taken back */
export function YearMarks({ n, onBack }: { n: number; onBack?: () => void }) {
  const c = useTheme();
  const still = useReducedMotion();
  const marks = useMemo(() => obYearMarks(n), [n]);
  const [w, setW] = useState(0);
  /* how far the sweep has come, in days */
  const [at, setAt] = useState(0);
  useEffect(() => {
    if (still) return;
    let t: ReturnType<typeof setInterval> | null = null;
    const start = setTimeout(() => {
      const t0 = Date.now();
      t = setInterval(() => {
        const d = Math.min(365, Math.round(((Date.now() - t0) / 2200) * 365));
        setAt(d);
        if (d >= 365) {
          if (t) clearInterval(t);
          onBack?.();
        }
      }, 33);
    }, 1800);
    return () => {
      clearTimeout(start);
      if (t) clearInterval(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [still]);
  /* 20 across, 19 down: a year (365) big enough to feel, read a row at a time like lines of a page */
  const cols = 20;
  const cell = w / cols;
  const r = cell * 0.34;
  return (
    <View
      style={{ alignSelf: 'stretch' }}
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
      accessible
      accessibilityLabel={'A year, a dot for each day. About ' + n + ' of them marked.'}>
      {w > 0 ? (
        <Svg width={w} height={cell * Math.ceil(365 / cols)}>
          {marks.map((on, d) => {
            const fill = !on ? c.line : d < at ? c.accent : c.slip;
            return <Circle key={d} cx={(d % cols) * cell + cell / 2} cy={Math.floor(d / cols) * cell + cell / 2} r={on ? r : r * 0.6} fill={fill} />;
          })}
        </Svg>
      ) : null}
    </View>
  );
}

/** the stops the flame grows through: a thin line with a dot for each, the one shown filled. The page walks them once on its own;
    a tap goes to one. */
/** the stops, on the app's own slider (components/slider.tsx), as on the other setup questions (the owner, November 14, 2026:
    "the slider should copy from our good sliders already build"). Its readout is the flame's bubble, which names the stop. */
export function GrowStops({ a, at, onAt }: { a: SetupAnswers; at: number; onAt: (i: number) => void }) {
  const stops = obGrow(a);
  return (
    <Slider
      label="How I grow with you"
      value={at}
      min={0}
      max={stops.length - 1}
      show={(v) => stops[v]?.at || ''}
      lo={stops[0].at}
      hi={stops[stops.length - 1].at}
      endsShowValue={false}
      readout={false}
      onChange={onAt}
    />
  );
}

/** where the person is on the stops: tonight first, and Next (or the slider) moves on, one stop at a time (the owner, November 14,
    2026: "the next button should move to the next dot not the next screen"). Each time the page comes up it starts from tonight. */
export function useGrowWalk(n: number, on: boolean) {
  const [at, setAt] = useState(0);
  useEffect(() => {
    if (on) setAt(0);
  }, [on]);
  const last = at >= n - 1;
  return { at, last, pick: (i: number) => setAt(Math.max(0, Math.min(n - 1, i))), step: () => setAt((x) => Math.min(n - 1, x + 1)) };
}

/** "A hard night will not take it from you": the person taps a slip and sees it. A streak counter three weeks in falls to zero;
    the free days kept here do not move, and neither do the longest run, the points or the level. Every number is the sample's, said
    as one, and every rule is the app's own (a slip never takes the free days, the best run, points or level). Replaces the chart
    the owner found "mid" (November 14, 2026). */
export const SLIP_DEMO_DAYS = 21;
export function SlipDemo({ slipped }: { slipped: boolean }) {
  const c = useTheme();
  const still = useReducedMotion();
  const n = useRef(new Animated.Value(SLIP_DEMO_DAYS)).current;
  const [shown, setShown] = useState(SLIP_DEMO_DAYS);
  useEffect(() => {
    const id = n.addListener(({ value }) => setShown(Math.round(value)));
    return () => n.removeListener(id);
  }, [n]);
  useEffect(() => {
    if (!slipped) return n.setValue(SLIP_DEMO_DAYS);
    if (still) return n.setValue(0);
    const t = Animated.timing(n, { toValue: 0, duration: 1100, easing: Easing.in(Easing.cubic), useNativeDriver: false });
    t.start();
    return () => t.stop();
  }, [slipped, still, n]);
  return (
    <View
      style={s.demo}
      accessible
      accessibilityLabel={
        slipped
          ? 'After a slip: a streak counter is back to zero. Here, 21 free days are still kept.'
          : 'Three weeks in: a streak counter shows 21 days in a row. Here, 21 free days.'
      }>
      <View style={[s.side, { backgroundColor: 'rgba(255,255,255,0.07)' }]}>
        <Text style={[s.sideH, { color: c.muted }]}>A streak counter</Text>
        <Text style={[s.big, { color: slipped ? c.slip : c.ink }]}>{shown}</Text>
        <Text style={[s.sideS, { color: c.muted }]}>{slipped ? 'back to zero' : 'days in a row'}</Text>
      </View>
      <View style={[s.side, { backgroundColor: 'rgba(255,255,255,0.16)' }]}>
        <Text style={[s.sideH, { color: c.accentText }]}>Here</Text>
        <Text style={[s.big, { color: c.ink }]}>{SLIP_DEMO_DAYS}</Text>
        <Text style={[s.sideS, { color: c.ink }]}>{slipped ? 'free days, still yours' : 'free days'}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  demo: { flexDirection: 'row', gap: 10, alignSelf: 'stretch' },
  side: { flex: 1, borderRadius: 20, paddingVertical: 14, paddingHorizontal: 14, alignItems: 'center' },
  sideH: { fontFamily: font.bodySemi, fontSize: 15, lineHeight: 20 },
  big: { fontFamily: font.display, fontSize: 48, lineHeight: 56 },
  sideS: { fontFamily: font.body, fontSize: 15, lineHeight: 20, textAlign: 'center' },
  month: { fontFamily: font.body, fontSize: 13, lineHeight: 18 },
});
