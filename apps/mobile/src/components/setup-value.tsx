/* The setup pages that show what Daybook gives, between the questions (the owner, November 14, 2026: setup "needs a couple screens
   just demonstrating the extreme beneifi and need of daybook it is all business (setup) and no pleasure"). Each is a picture first:
   a year of marks at the person's own pace (core obYear), the flame growing stop by stop (obGrow, the page's flame itself changes
   form), and a slip the person taps, which takes nothing away here (SlipDemo). Words come from core setup.ts. */
import { obGrow, obGrowNext, obYearMarks, type SetupAnswers } from '@daybook/core';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, Path, RadialGradient, Stop, Text as SvgText } from 'react-native-svg';

import { Slider } from '@/components/slider';
import { Icon } from '@/components/ui';
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

/** where the person is on the stops: the first week first, and Next (or the slider) moves on, one stop at a time, leaving only from
    the last (core obGrowNext; the owner, November 14 and 15, 2026: "the next button should move to the next dot not the next screen",
    and not to start on tonight). Each time the page comes up it starts from the first stop. */
export function useGrowWalk(n: number, on: boolean) {
  const [at, setAt] = useState(0);
  useEffect(() => {
    if (on) setAt(0);
  }, [on]);
  const last = obGrowNext(at, n) < 0;
  return { at, last, pick: (i: number) => setAt(Math.max(0, Math.min(n - 1, i))), step: () => setAt((x) => Math.max(x, obGrowNext(x, n))) };
}

/** the path to being free, as a picture (the owner, November 15, 2026: "i want more images/convincing to show them the path to
    cleanliness"): two paths from where the person stands. The old one, the habit, starts deep and worn; the new one starts as a faint
    trail toward the light. Stop by stop the new path widens and brightens, and grass grows over the old one, the way a brain's
    unused way fades and a practiced one becomes the easy one. It eases from stop to stop; with Reduce Motion it is set at once. */
const PW = 340;
const PH = 150;
/* a path as a filled shape, wide at the person's feet (the bottom) and narrow at the horizon, along a gentle curve */
function road(x0: number, x1: number, bend: number, w0: number, w1: number) {
  const N = 14;
  const L: string[] = [];
  const R: string[] = [];
  for (let k = 0; k <= N; k++) {
    const u = k / N;
    const y = PH - 4 - u * (PH - 64);
    const x = x0 + (x1 - x0) * u + bend * Math.sin(Math.PI * u);
    const hw = (w0 + (w1 - w0) * u) / 2;
    L.push((k ? 'L' : 'M') + (x - hw).toFixed(1) + ' ' + y.toFixed(1));
    R.unshift('L' + (x + hw).toFixed(1) + ' ' + y.toFixed(1));
  }
  return L.join('') + R.join('') + 'Z';
}
/* where the grass grows over the old path: fixed spots along it (u from feet to horizon, a small offset across) */
const TUFTS: [number, number][] = [
  [0.08, -6],
  [0.16, 8],
  [0.26, -3],
  [0.34, 7],
  [0.44, -8],
  [0.52, 2],
  [0.62, -4],
  [0.7, 5],
  [0.8, -2],
  [0.88, 3],
];
export function GrowPath({ at, n, height = PH }: { at: number; n: number; height?: number }) {
  const c = useTheme();
  const still = useReducedMotion();
  const goal = n > 1 ? at / (n - 1) : 1;
  const v = useRef(new Animated.Value(goal)).current;
  const [t, setT] = useState(goal);
  useEffect(() => {
    const id = v.addListener(({ value }) => setT(value));
    return () => v.removeListener(id);
  }, [v]);
  useEffect(() => {
    if (still) return v.setValue(goal);
    const a = Animated.timing(v, { toValue: goal, duration: 650, easing: Easing.inOut(Easing.cubic), useNativeDriver: false });
    a.start();
    return () => a.stop();
  }, [goal, still, v]);
  /* the old path: from the left of the feet to the left horizon; the new: from the right to the light on the right */
  const oldX = (u: number) => 150 + (78 - 150) * u - 26 * Math.sin(Math.PI * u);
  const oldY = (u: number) => PH - 4 - u * (PH - 64);
  const tufts = Math.round(t * TUFTS.length);
  const label = { fontFamily: font.bodySemi, fontSize: 13 };
  return (
    <View
      style={{ alignSelf: 'stretch', alignItems: 'center' }}
      accessible
      accessibilityLabel={
        'Two paths. The old habit, ' +
        (t > 0.6 ? 'fading under grass' : 'still worn deep') +
        '. The new path toward the light, ' +
        (t > 0.6 ? 'wide and bright' : 'starting to show') +
        '.'
      }>
      <Svg width="100%" height={height} viewBox={`0 0 ${PW} ${PH}`} preserveAspectRatio="xMidYMax meet">
        <Defs>
          <RadialGradient id="gp-light" cx="0.5" cy="0.5" r="0.5">
            <Stop offset="0" stopColor={c.sun} stopOpacity={0.55 + 0.4 * t} />
            <Stop offset="1" stopColor={c.sun} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        {/* the land */}
        <Path d={`M0 ${PH} C4 70 70 36 ${PW / 2} 34 C${PW - 70} 36 ${PW - 4} 70 ${PW} ${PH} Z`} fill="rgba(255,255,255,0.07)" />
        {/* the light the new path walks toward, growing with it */}
        <Ellipse cx={268} cy={58} rx={30 + 26 * t} ry={22 + 18 * t} fill="url(#gp-light)" />
        <Circle cx={268} cy={58} r={6 + 5 * t} fill={c.sun} />
        {/* the old path, worn deep at first, then fading */}
        <Path d={road(150, 78, -26, 74 - 30 * t, 14 - 6 * t)} fill="#FFFFFF" opacity={0.3 - 0.22 * t} />
        {TUFTS.slice(0, tufts).map(([u, dx], k) => {
          const x = oldX(u) + dx;
          const y = oldY(u);
          const sz = 7 - 4 * u;
          return (
            <Path
              key={k}
              d={`M${x - sz} ${y} L${x - sz / 3} ${y - sz * 1.4} M${x} ${y} L${x} ${y - sz * 1.8} M${x + sz} ${y} L${x + sz / 3} ${y - sz * 1.4}`}
              stroke={c.mint}
              strokeWidth={2}
              strokeLinecap="round"
              opacity={0.9}
            />
          );
        })}
        {/* the new path, a faint trail at first, then the wide bright way */}
        <Path d={road(196, 268, 30, 14 + 62 * t, 3 + 9 * t)} fill={c.sun} opacity={0.35 + 0.6 * t} />
        <SvgText x={268} y={30} textAnchor="middle" fill={c.sun} opacity={0.75 + 0.25 * t} {...label}>
          free
        </SvgText>
        <SvgText x={62} y={48} textAnchor="middle" fill="#FFFFFF" opacity={0.75 - 0.35 * t} {...label}>
          the old habit
        </SvgText>
      </Svg>
    </View>
  );
}

/** what part of Daybook does the work at this stop: its icon and a few words, quiet, under the picture */
export function GrowHow({ icon, words }: { icon: string; words: string }) {
  const c = useTheme();
  return (
    <View style={s.how} accessible accessibilityLabel={'How: ' + words}>
      <Icon name={icon} size={18} color={c.sun} />
      <Text style={[s.howT, { color: c.ink }]}>{words}</Text>
    </View>
  );
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
  how: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  howT: { fontFamily: font.bodySemi, fontSize: 15, lineHeight: 20 },
});
