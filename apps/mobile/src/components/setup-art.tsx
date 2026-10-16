/* The pictures in the setup: small copies of the real screens and simple charts, drawn with the app's own colors. The shapes
   (the curves, the heart, the people) are the legacy SVG paths. Ported from the legacy obPic* functions. */
import { fmtClock, fmtHour, isTime, OB_MINS, OB_PEAK, OB_WHEN, obTop, obTool, type SetupAnswers } from '@daybook/core';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Path, Rect, Text as SvgText } from 'react-native-svg';

import { Flame } from '@/components/flame';
import { Icon, T } from '@/components/ui';
import { font, toneOf, useTheme } from '@/lib/theme';

function Row({ icon, tone, title, sub, right }: { icon: string; tone: string; title: string; sub?: string; right?: string }) {
  const c = useTheme();
  const t = toneOf(c, tone);
  return (
    <View style={[s.row, { backgroundColor: c.surface, borderColor: c.cardEdge }]}>
      <View style={[s.ic, { backgroundColor: t.soft }]}>
        <Icon name={icon} size={20} color={t.text} />
      </View>
      <View style={{ flex: 1 }}>
        <T v="label">{title}</T>
        {sub ? (
          <T v="small" tone="muted">
            {sub}
          </T>
        ) : null}
      </View>
      {right ? (
        <T v="small" tone="muted">
          {right}
        </T>
      ) : null}
    </View>
  );
}

/** Welcome: the flame, and what Daybook does */
export function PicToday() {
  return (
    <View style={s.col} accessible accessibilityLabel="Your flame and level, a short lesson a day, and SOS for urges">
      <View style={{ alignItems: 'center' }}>
        <Flame level={8} size={110} />
      </View>
      <Row icon="sun" tone="sun" title="A flame that grows" />
      <Row icon="book" tone="sky" title="A short lesson a day" />
      <Row icon="life" tone="coral" title="SOS for urges" />
    </View>
  );
}
export function PicSteps() {
  const rows: [string, string, string][] = [
    ['ask', 'Answer some questions', 'About 3 minutes'],
    ['chart', 'See what they show', 'Your time, your triggers'],
    ['shield', 'Get your plan', 'Built from your answers'],
  ];
  return (
    <View style={s.col}>
      {rows.map((r, i) => (
        <Row key={i} icon={r[0]} tone={['sky', 'violet', 'mint'][i]} title={i + 1 + '. ' + r[1]} sub={r[2]} />
      ))}
    </View>
  );
}

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
            <View style={[s.dot, { backgroundColor: v ? c.accent : c.surface2, borderColor: row ? c.line : c.muted, borderStyle: row ? 'solid' : 'dashed' }]}>
              {v === 2 ? <Text style={{ fontFamily: font.bodyBold, color: c.accentInk, fontSize: 12 }}>2×</Text> : null}
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
  ['<15', 'MINUTES'],
  ['15–30', 'MINUTES'],
  ['30–60', 'MINUTES'],
  ['1–2', 'HOURS'],
  ['2+', 'HOURS'],
];
export function PicDial({ i }: { i: number }) {
  const c = useTheme();
  const m = i >= 0 ? OB_MINS[i][2] : 0;
  const ring = (r: number, f: number, col: string) => {
    const L = 2 * Math.PI * r;
    return (
      <G key={r}>
        <Circle cx={70} cy={70} r={r} stroke={c.surface2} strokeWidth={10} fill="none" />
        {f > 0 ? <Circle cx={70} cy={70} r={r} stroke={col} strokeWidth={10} fill="none" strokeLinecap="round" strokeDasharray={`${(L * Math.min(1, f)).toFixed(1)} ${L.toFixed(1)}`} transform="rotate(-90 70 70)" /> : null}
      </G>
    );
  };
  const lab = i >= 0 ? OB_DIAL[i] : ['?', ''];
  return (
    <Svg width={150} height={150} viewBox="0 0 140 140">
      {ring(60, m / 60, c.accent)}
      {m > 60 ? ring(46, (m - 60) / 60, c.violet) : null}
      {m > 120 ? ring(32, (m - 120) / 60, c.coral) : null}
      <SvgText x={70} y={lab[1] ? 72 : 80} fontSize={lab[1] ? 20 : 34} fontWeight="700" fill={c.ink} textAnchor="middle">
        {lab[0]}
      </SvgText>
      {lab[1] ? (
        <SvgText x={70} y={92} fontSize={10} fontWeight="700" fill={c.muted} textAnchor="middle" letterSpacing={1}>
          {lab[1]}
        </SvgText>
      ) : null}
    </Svg>
  );
}

export function PicHeart() {
  const c = useTheme();
  return (
    <Svg width={150} height={130} viewBox="0 0 150 130">
      <Circle cx={75} cy={65} r={60} fill={c.coralSoft} />
      <Path d="M75 102C41 80 30 62 30 48C30 34 40 25 52 25C62 25 70 31 75 40C80 31 88 25 98 25C110 25 120 34 120 48C120 62 109 80 75 102Z" fill={c.coral} />
      <Path d="M126 22l2.6 6.4 6.4 2.6-6.4 2.6-2.6 6.4-2.6-6.4-6.4-2.6 6.4-2.6z" fill={c.sun} />
      <Path d="M22 84l2 4.8 4.8 2-4.8 2-2 4.8-2-4.8-4.8-2 4.8-2z" fill={c.sun} />
    </Svg>
  );
}

export function PicPeople() {
  const c = useTheme();
  return (
    <Svg width={224} height={106} viewBox="0 0 224 106" accessibilityLabel="Ten people, one of them highlighted: about 1 in 10">
      {Array.from({ length: 10 }, (_, i) => (
        <G key={i} transform={`translate(${(i % 5) * 48} ${i < 5 ? 0 : 58})`} fill={i === 2 ? c.accent : c.line}>
          <Circle cx={16} cy={11} r={9} />
          <Path d="M0 46c0-12 7-19 16-19s16 7 16 19z" />
        </G>
      ))}
    </Svg>
  );
}

export function PicTries() {
  const c = useTheme();
  const cs = { fontSize: 10, fontWeight: '700' as const, fill: c.muted, textAnchor: 'middle' as const };
  return (
    <Svg width={320} height={150} viewBox="0 0 320 150" accessibilityLabel="A line that climbs, drops back, and climbs again a few times, until one try sticks">
      <Path d="M12 132H308" stroke={c.line} strokeWidth={2} />
      <Path d="M14 124L62 82L76 120L132 66L146 112L214 46L226 66L304 22" stroke={c.accent} strokeWidth={4} fill="none" strokeLinejoin="round" strokeLinecap="round" />
      {[
        [76, 120],
        [146, 112],
        [226, 66],
      ].map(([x, y]) => (
        <Circle key={x} cx={x} cy={y} r={6} fill={c.slip} />
      ))}
      <Path d="M304 6l4.6 9.4 10.4 1.5-7.5 7.3 1.8 10.3-9.3-4.9-9.3 4.9 1.8-10.3-7.5-7.3 10.4-1.5z" fill={c.sun} />
      <SvgText x={62} y={148} {...cs}>TRY 1</SvgText>
      <SvgText x={132} y={148} {...cs}>TRY 2</SvgText>
      <SvgText x={214} y={148} {...cs}>TRY 3</SvgText>
      <SvgText x={282} y={148} {...cs} fill={c.accentText}>IT STICKS</SvgText>
    </Svg>
  );
}

export function PicCurve() {
  const c = useTheme();
  const cs = { fontSize: 10, fontWeight: '700' as const, fill: c.muted, textAnchor: 'middle' as const };
  return (
    <Svg width={320} height={150} viewBox="0 0 330 150" accessibilityLabel="A habit curve: it rises over about 66 days, and one bad day is only a small dip">
      <Path d="M10 132H320" stroke={c.line} strokeWidth={2} />
      <Path d="M10 128C56 124 96 104 116 88L126 102L136 84C186 54 250 34 318 30" stroke={c.mint} strokeWidth={4} fill="none" strokeLinecap="round" />
      <Circle cx={252} cy={38} r={8} fill={c.sun} />
      <SvgText x={26} y={146} {...cs}>DAY 1</SvgText>
      <SvgText x={126} y={124} {...cs}>ONE BAD DAY</SvgText>
      <SvgText x={252} y={62} {...cs}>DAY 66</SvgText>
    </Svg>
  );
}

export function PicSlip() {
  const c = useTheme();
  return (
    <View style={{ alignItems: 'center', gap: 6 }} accessible accessibilityLabel="Two lines. A streak counter climbs, then drops to zero at a slip. Daybook points keep climbing through the slip.">
      <Svg width={300} height={150} viewBox="0 0 300 150">
        <Path d="M10 126H292" stroke={c.line} strokeWidth={2} />
        <Path d="M160 22V126" stroke={c.line} strokeWidth={2} strokeDasharray="4 4" />
        <Path d="M12 122L60 112L110 100L160 88V124L210 116L260 106L290 100" stroke={c.muted} strokeWidth={3} fill="none" />
        <Path d="M12 116L60 96L110 76L160 56L176 53L210 42L260 26L290 16" stroke={c.accent} strokeWidth={4} fill="none" strokeLinecap="round" />
        <Circle cx={160} cy={124} r={5} fill={c.muted} />
        <Circle cx={160} cy={56} r={5} fill={c.accent} />
        <Rect x={138} y={2} width={44} height={18} rx={9} fill={c.slip} />
        <SvgText x={160} y={15} fontSize={10} fontWeight="700" fill="#fff" textAnchor="middle">
          SLIP
        </SvgText>
        <SvgText x={160} y={143} fontSize={10} fontWeight="700" fill={c.muted} textAnchor="middle">
          BACK TO 0
        </SvgText>
      </Svg>
      <View style={{ flexDirection: 'row', gap: 14 }}>
        <Legend col={c.accent} label="Daybook points" />
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

/** SOS: the one thing it would offer for this person's hardest moment */
export function PicSos({ a, when }: { a: SetupAnswers; when: string }) {
  const c = useTheme();
  const has = (a.when || []).length > 0;
  const T0 = obTool(has ? obTop(a) : 'other');
  const t = toneOf(c, T0.tone);
  return (
    <View style={s.col} accessible accessibilityLabel={'Tap SOS and Daybook offers one tool to try: ' + T0.name}>
      <View style={[s.card, { backgroundColor: c.surface, borderColor: c.cardEdge }]}>
        <T v="small" tone="muted">
          {when}
        </T>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={[s.ic, { backgroundColor: t.soft }]}>
            <Icon name={T0.ic} size={20} color={t.text} />
          </View>
          <View style={{ flex: 1 }}>
            <T v="label">{T0.name}</T>
            <T v="small" tone="muted">
              {T0.desc}
            </T>
          </View>
          <View style={[s.go, { backgroundColor: c.accent }]}>
            <Text style={{ fontFamily: font.bodySemi, color: c.accentInk }}>Start</Text>
          </View>
        </View>
      </View>
      <View style={[s.sos, { backgroundColor: c.sos, shadowColor: c.sosDeep }]}>
        <Icon name="life" size={30} color={c.sosInk} />
      </View>
      <T v="label" tone="sos" style={{ alignSelf: 'center' }}>
        SOS
      </T>
    </View>
  );
}

export function PicLesson() {
  const c = useTheme();
  return (
    <View style={[s.card, { backgroundColor: c.surface, borderColor: c.cardEdge, alignItems: 'center', width: 220, alignSelf: 'center' }]} accessible accessibilityLabel="A lesson card called Urges are waves, 3 minutes">
      <Svg width={170} height={58} viewBox="0 0 170 58">
        <Path d="M6 52C38 52 52 10 85 10S132 52 164 52" stroke={c.sky} strokeWidth={4} fill="none" strokeLinecap="round" />
        <Circle cx={85} cy={10} r={6} fill={c.sun} />
      </Svg>
      <T v="label">Urges are waves</T>
      <T v="small" tone="muted">
        Lesson 2 · 3 min
      </T>
    </View>
  );
}

export function PicDay({ a }: { a: SetupAnswers }) {
  const so = isTime(a.so) ? (a.so as string) : null;
  const rows: [string, string, string, string, string][] = [
    ['sunrise', 'sky', 'Morning', '2 quick questions', '1 min'],
    ['book', 'sun', 'Lesson', 'One short lesson', '1–5 min'],
    ['pencil', 'mint', 'Check-in', 'How today went', '1 min'],
    ['moon', 'violet', 'Wind-down', so ? 'Screens off at ' + fmtClock(so) : 'Screens off, phone away', 'Night'],
  ];
  return (
    <View style={s.col}>
      {rows.map((r) => (
        <Row key={r[2]} icon={r[0]} tone={r[1]} title={r[2]} sub={r[3]} right={r[4]} />
      ))}
    </View>
  );
}

/** when it happens: a sample week, with this person's hard hours marked */
export function PicPattern({ a }: { a: SetupAnswers }) {
  const c = useTheme();
  const has = (a.when || []).length > 0;
  const pk = OB_PEAK[obTop(a)] || 22;
  const bins = Array.from({ length: 12 }, (_, i) => {
    const h = 2 * i + 1;
    let d = Math.abs(h - pk);
    d = Math.min(d, 24 - d);
    const v = Math.max(1, Math.round(9 * Math.exp(-(d * d) / (2 * 2.6 * 2.6))));
    return { v, s: v >= 6 ? 2 : v >= 4 ? 1 : 0 };
  });
  const top = bins.reduce((m, b, i) => (b.v > bins[m].v ? i : m), 0);
  const lab = fmtHour((2 * top) % 24) + ' to ' + fmtHour((2 * top + 2) % 24);
  return (
    <View style={[s.card, { backgroundColor: c.surface, borderColor: c.cardEdge, alignSelf: 'stretch' }]} accessible accessibilityLabel={'A sample chart of when urges happen across the day. The busiest stretch is ' + lab + '.'}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <T v="label">When it happens</T>
        <T v="small" tone="muted">
          Sample week
        </T>
      </View>
      <View style={[s.pill, { backgroundColor: c.violetSoft }]}>
        <Icon name="timer" size={14} color={c.violetText} />
        <T v="small" tone="violetText">
          {(has ? 'Your hard hours' : 'Busiest') + ': ' + lab}
        </T>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 90, gap: 4 }}>
        {bins.map((b, i) => (
          <View key={i} style={{ flex: 1, justifyContent: 'flex-end', height: '100%' }}>
            <View style={{ height: `${((b.v - b.s) / 9) * 100}%`, backgroundColor: i === top ? c.mint : c.mintSoft, borderTopLeftRadius: 4, borderTopRightRadius: 4 }} />
            <View style={{ height: `${(b.s / 9) * 100}%`, backgroundColor: c.slip }} />
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {['12 AM', '6 AM', '12 PM', '6 PM'].map((x) => (
          <T key={x} v="small" tone="muted">
            {x}
          </T>
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: 14 }}>
        <Legend col={c.mint} label="Rode it out" />
        <Legend col={c.slip} label="Slipped" />
      </View>
    </View>
  );
}

export function PicFlame() {
  const c = useTheme();
  const st: [number, string, number][] = [
    [1, 'Spark', 40],
    [8, 'Campfire', 52],
    [17, 'Lighthouse', 64],
    [28, 'Full Sun', 78],
  ];
  return (
    <View style={{ gap: 10, alignItems: 'center' }} accessible accessibilityLabel="The flame grows in stages, from a spark to a campfire, a lighthouse, and a full sun">
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10 }}>
        {st.map((x) => (
          <View key={x[0]} style={{ alignItems: 'center', gap: 2 }}>
            <Flame level={x[0]} size={x[2]} />
            <T v="small" tone="muted">
              {x[1]}
            </T>
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        {[
          ['+5', 'honest log'],
          ['+10', 'urge ridden out'],
          ['+10', 'lesson'],
        ].map((p, i) => (
          <View key={i} style={[s.pill, { backgroundColor: c.sunSoft }]}>
            <Text style={{ fontFamily: font.bodyBold, color: c.sunText }}>{p[0]}</Text>
            <T v="small">{p[1]}</T>
          </View>
        ))}
      </View>
    </View>
  );
}

export function PicTakes() {
  const c = useTheme();
  const rows = [
    ['timer', 'About 5 minutes a day'],
    ['pencil', 'Honest logs, slips included'],
    ['life', 'SOS when an urge hits'],
    ['moon', 'Phone out of the bedroom at night'],
  ];
  return (
    <View style={s.col}>
      {rows.map((r) => (
        <View key={r[0]} style={[s.row, { backgroundColor: c.surface, borderColor: c.cardEdge }]}>
          <View style={[s.ic, { backgroundColor: c.accentSoft }]}>
            <Icon name={r[0]} size={20} color={c.accentText} />
          </View>
          <T style={{ flex: 1 }}>{r[1]}</T>
          <Icon name="check" size={18} color={c.mintText} />
        </View>
      ))}
    </View>
  );
}

/* the icon a hard moment uses (for the plan on the review page) */
export const whenIcon = (t: string) => (OB_WHEN.find((w) => w[0] === t) || [])[2] || 'moon';

const s = StyleSheet.create({
  col: { gap: 8, alignSelf: 'stretch' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 16, borderWidth: 1.5 },
  ic: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 32, height: 32, borderRadius: 16, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  card: { gap: 8, padding: 14, borderRadius: 18, borderWidth: 1.5 },
  go: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  sos: { alignSelf: 'center', width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 0 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
});
