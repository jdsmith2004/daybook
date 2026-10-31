/* The pictures in the setup: simple charts and shapes, drawn with the app's own colors. They follow the legacy obPic*
   pictures. */
import { fmtClock, isTime, OB_MINS, OB_WHEN, type SetupAnswers } from '@daybook/core';
import { Image, Platform, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';
import Svg, { Circle, G, Path, Rect, Text as SvgText } from 'react-native-svg';

import { Shape } from '@/components/shapes';
import { SosButton } from '@/components/sos-button';
import { T } from '@/components/ui';
import { DayPicture } from '@/components/your-day';
import { font, useTheme } from '@/lib/theme';

/* how often: a week, one dot per day it happens */
const OB_WK = [
  [0, 0, 0, 0, 0, 1, 0],
  [0, 0, 1, 0, 0, 1, 0],
  [1, 0, 1, 0, 1, 1, 0],
  [1, 1, 1, 1, 1, 1, 1],
  [2, 2, 2, 2, 2, 2, 2],
];
export function PicWeek({ i }: { i: number }) {
  const c = useTheme();
  const row = i >= 0 ? OB_WK[i] : null;
  return (
    <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center' }} accessible={false}>
      {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, j) => {
        const v = row ? row[j] : 0;
        return (
          <View key={j} style={{ alignItems: 'center', gap: 4 }}>
            <View
              style={[
                s.dot,
                {
                  backgroundColor: v ? c.accent : c.surface2,
                  borderColor: row ? c.line : c.muted,
                  borderStyle: row ? 'solid' : 'dashed',
                },
              ]}>
              {v === 2 ? (
                <Text
                  style={{
                    fontFamily: font.bodyBold,
                    color: c.accentInk,
                    fontSize: 12,
                  }}>
                  2×
                </Text>
              ) : null}
            </View>
            <T v="small" tone="muted">
              {d}
            </T>
          </View>
        );
      })}
    </View>
  );
}
/* how long: a clock face that fills, a second ring after an hour, a third after two */
const OB_DIAL: [string, string][] = [
  ['<15', 'minutes'],
  ['15–30', 'minutes'],
  ['30–60', 'minutes'],
  ['1–2', 'hours'],
  ['2+', 'hours'],
];
export function PicDial({ i }: { i: number }) {
  const c = useTheme();
  const m = i >= 0 ? OB_MINS[i][2] : 0;
  const ring = (r: number, f: number, col: string) => {
    const L = 2 * Math.PI * r;
    return (
      <G key={r}>
        <Circle cx={70} cy={70} r={r} stroke={c.surface2} strokeWidth={10} fill="none" />
        {f > 0 ? (
          <Circle
            cx={70}
            cy={70}
            r={r}
            stroke={col}
            strokeWidth={10}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${(L * Math.min(1, f)).toFixed(1)} ${L.toFixed(1)}`}
            transform="rotate(-90 70 70)"
          />
        ) : null}
      </G>
    );
  };
  const lab = i >= 0 ? OB_DIAL[i] : ['?', ''];
  return (
    <Svg width={150} height={150} viewBox="0 0 140 140">
      {ring(60, m / 60, c.accent)}
      {m > 60 ? ring(46, (m - 60) / 60, c.violet) : null}
      {m > 120 ? ring(32, (m - 120) / 60, c.coral) : null}
      <SvgText x={70} y={lab[1] ? 72 : 80} fontSize={lab[1] ? 20 : 34} fontFamily={font.displayBold} fill={c.ink} textAnchor="middle">
        {lab[0]}
      </SvgText>
      {lab[1] ? (
        <SvgText x={70} y={92} fontSize={11} fontFamily={font.bodySemi} fill={c.muted} textAnchor="middle">
          {lab[1]}
        </SvgText>
      ) : null}
    </Svg>
  );
}

/* a plain, big heart: the same kind of soft shape as the other pictures */
export function PicHeart() {
  const c = useTheme();
  return <Shape kind="heart" size={170} color={c.accent} />;
}

export function PicTries({ width = 320 }: { width?: number }) {
  const c = useTheme();
  const cs = {
    fontFamily: font.bodyBold,
    fontSize: 11,
    fill: c.muted,
    textAnchor: 'middle' as const,
  };
  return (
    <Svg
      width={width}
      height={(width * 150) / 320}
      viewBox="0 0 320 150"
      accessibilityLabel="A line that climbs, drops back, and climbs again a few times, until one try sticks">
      <Path d="M12 132H308" stroke={c.line} strokeWidth={2} />
      <Path
        d="M14 124L62 82L76 120L132 66L146 112L214 46L226 66L304 22"
        stroke={c.accent}
        strokeWidth={4}
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {[
        [76, 120],
        [146, 112],
        [226, 66],
      ].map(([x, y]) => (
        <Circle key={x} cx={x} cy={y} r={6} fill={c.slip} />
      ))}
      <Path d="M304 6l4.6 9.4 10.4 1.5-7.5 7.3 1.8 10.3-9.3-4.9-9.3 4.9 1.8-10.3-7.5-7.3 10.4-1.5z" fill={c.sun} />
      <SvgText x={62} y={148} {...cs}>
        Try 1
      </SvgText>
      <SvgText x={132} y={148} {...cs}>
        Try 2
      </SvgText>
      <SvgText x={214} y={148} {...cs}>
        Try 3
      </SvgText>
      <SvgText x={282} y={148} {...cs} fill={c.accentText}>
        It sticks
      </SvgText>
    </Svg>
  );
}

export function PicCurve({ width = 320 }: { width?: number }) {
  const c = useTheme();
  const cs = {
    fontFamily: font.bodyBold,
    fontSize: 11,
    fill: c.muted,
    textAnchor: 'middle' as const,
  };
  return (
    <Svg
      width={width}
      height={(width * 150) / 330}
      viewBox="0 0 330 150"
      accessibilityLabel="A habit curve: it rises over about 66 days, and one bad day is only a small dip">
      <Path d="M10 132H320" stroke={c.line} strokeWidth={2} />
      <Path d="M10 128C56 124 96 104 116 88L126 102L136 84C186 54 250 34 318 30" stroke={c.mint} strokeWidth={4} fill="none" strokeLinecap="round" />
      <Circle cx={252} cy={38} r={8} fill={c.sun} />
      <SvgText x={26} y={146} {...cs}>
        Day 1
      </SvgText>
      <SvgText x={126} y={124} {...cs}>
        One bad day
      </SvgText>
      <SvgText x={252} y={62} {...cs}>
        Day 66
      </SvgText>
    </Svg>
  );
}

export function PicSlip({ width = 300 }: { width?: number }) {
  const c = useTheme();
  return (
    <View
      style={{ alignItems: 'center', gap: 6 }}
      accessible
      accessibilityLabel="Two lines. A streak counter climbs, then drops to zero at a slip. Daybook points keep climbing through the slip.">
      <Svg width={width} height={(width * 150) / 300} viewBox="0 0 300 150">
        <Path d="M10 126H292" stroke={c.line} strokeWidth={2} />
        <Path d="M160 22V126" stroke={c.slip} strokeWidth={2} strokeDasharray="4 4" />
        <Path d="M12 122L60 112L110 100L160 88V124L210 116L260 106L290 100" stroke={c.muted} strokeWidth={3} fill="none" />
        <Path d="M12 116L60 96L110 76L160 56L176 53L210 42L260 26L290 16" stroke={c.mint} strokeWidth={4} fill="none" strokeLinecap="round" />
        <Circle cx={160} cy={124} r={5} fill={c.muted} />
        <Circle cx={160} cy={56} r={5} fill={c.mint} />
        <Rect x={138} y={2} width={44} height={18} rx={9} fill={c.slip} />
        <SvgText x={160} y={15} fontSize={11} fontFamily={font.bodyBold} fill="#fff" textAnchor="middle">
          Slip
        </SvgText>
        <SvgText x={160} y={143} fontSize={11} fontFamily={font.bodyBold} fill={c.muted} textAnchor="middle">
          Back to 0
        </SvgText>
      </Svg>
      <View style={{ flexDirection: 'row', gap: 14 }}>
        <Legend col={c.mint} label="Daybook points" />
        <Legend col={c.muted} label="A streak counter" />
      </View>
    </View>
  );
}
function Legend({ col, label }: { col: string; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 14, height: 4, borderRadius: 2, backgroundColor: col }} />
      <T v="small" tone="muted">
        {label}
      </T>
    </View>
  );
}

/** a day in Daybook: Your day as Today shows it, and SOS where it sits on this phone */
export function PicDay({ a }: { a: SetupAnswers }) {
  const c = useTheme();
  const so = isTime(a.so) ? (a.so as string) : null;
  return (
    <View style={s.day}>
      <DayPicture wind={so ? 'Screens off at ' + fmtClock(so) : 'At night'} />
      <View
        pointerEvents="none"
        accessible
        accessibilityRole="image"
        accessibilityLabel="The SOS button."
        style={Platform.OS === 'ios' ? s.sosIos : s.sosOther}>
        {Platform.OS === 'ios' ? (
          <View style={[s.glass, { backgroundColor: c.surface }]}>
            <Image source={require('../../assets/images/sos-mark.png')} style={s.mark} />
          </View>
        ) : (
          <SosButton />
        )}
      </View>
    </View>
  );
}

/* the icon a hard moment uses (for the plan on the review page) */
export const whenIcon = (t: string) => (OB_WHEN.find((w) => w[0] === t) || [])[2] || 'moon';

const s = StyleSheet.create({
  day: { alignSelf: 'stretch', gap: 16 },
  sosIos: { alignSelf: 'flex-end' },
  sosOther: { alignSelf: 'center' },
  glass: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center' },
  mark: { width: 54, height: 36 },
  dot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
