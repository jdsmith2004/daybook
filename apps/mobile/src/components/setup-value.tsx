/* The setup pages that show what Daybook gives, between the questions (the owner, November 14, 2026: setup "needs a couple screens
   just demonstrating the extreme beneifi and need of daybook it is all business (setup) and no pleasure"). Each is a picture first:
   a year of marks at the person's own pace (core obYear), the flame growing stop by stop (obGrow, the page's flame itself changes
   form), and a slip taking nothing away here (obWhyLines). Words come from core setup.ts. */
import { obGrow, obWhyLines, obYearMarks, type SetupAnswers } from '@daybook/core';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { SHORT } from '@/components/fit';
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

/** eight weeks with two slips: a streak counter falls to zero at each, the free days on the record here keep climbing */
export function WhyChart() {
  const c = useTheme();
  const [w, setW] = useState(0);
  const { streak, record } = useMemo(obWhyLines, []);
  const h = SHORT ? 140 : 170;
  const max = record[record.length - 1];
  const top = 10;
  const right = 4;
  const pt = (v: number, d: number) => [(d / (record.length - 1)) * (w - right), top + (h - top - 6) * (1 - v / max)] as const;
  const path = (vals: number[]) => vals.map((v, d) => (d ? 'L' : 'M') + pt(v, d).join(' ')).join(' ');
  const slips = streak.map((v, d) => (d > 0 && v === 0 ? d : -1)).filter((d) => d >= 0);
  const end = pt(record[record.length - 1], record.length - 1);
  return (
    <View
      style={{ alignSelf: 'stretch' }}
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
      accessible
      accessibilityLabel="Eight weeks with two slips. A streak counter falls to zero at each slip. Your free days here keep climbing.">
      {w > 0 ? (
        <View>
          <Svg width={w} height={h}>
            <Path d={'M0 ' + (h - 6) + ' L' + (w - right) + ' ' + (h - 6)} stroke={c.line} strokeWidth={2} />
            <Path d={path(streak)} stroke={c.muted} strokeWidth={3} fill="none" strokeLinejoin="round" opacity={0.7} />
            <Path d={path(record)} stroke={c.accent} strokeWidth={5} fill="none" strokeLinejoin="round" strokeLinecap="round" />
            {slips.map((d) => (
              <Circle key={d} cx={pt(0, d)[0]} cy={h - 6} r={6} fill={c.slip} />
            ))}
            <Circle cx={end[0] - 2} cy={end[1]} r={7} fill={c.accent} />
          </Svg>
          {/* the record's label over the empty top left; the streak is named in the key under the chart, where no line runs through it */}
          <Text style={[s.lab, { color: c.accentText, top: 0, left: 0 }]}>Your free days here</Text>
        </View>
      ) : null}
      <View style={s.slipKey}>
        <View style={[s.streakKey, { backgroundColor: c.muted }]} />
        <Text style={[s.month, { color: c.muted }]}>A streak</Text>
        <View style={[s.slipDot, { backgroundColor: c.slip, marginLeft: 12 }]} />
        <Text style={[s.month, { color: c.muted }]}>A slip</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  month: { fontFamily: font.body, fontSize: 13, lineHeight: 18 },
  lab: { position: 'absolute', fontFamily: font.bodySemi, fontSize: 15, lineHeight: 20 },
  slipKey: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  slipDot: { width: 10, height: 10, borderRadius: 5 },
  streakKey: { width: 16, height: 3, borderRadius: 2, opacity: 0.7 },
});
