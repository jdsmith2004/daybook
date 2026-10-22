/* The pictures in the setup: small copies of the real screens and simple charts, drawn with the app's own colors. They follow
   the legacy obPic* pictures: the Today screen in a phone with notes pointing at it, the numbered steps, the lesson cards
   in a stack, SOS on the tab bar, and the shapes (the curves, the heart, the people) are the legacy SVG paths. */
import { fmtClock, fmtHour, isTime, OB_MINS, OB_PEAK, OB_WHEN, obTop, obTool, type SetupAnswers } from '@daybook/core';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';
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
        <View style={[s.chip, { backgroundColor: c.sunSoft }]}>
          <Text style={[s.chipT, { color: c.sunText }]}>{right}</Text>
        </View>
      ) : null}
    </View>
  );
}

/** the tab bar in small: Today, Journal, SOS, Learn, More. hot: SOS lit up, the way it is when an urge hits. */
function MiniNav({ hot, k = 1 }: { hot?: boolean; k?: number }) {
  const c = useTheme();
  const tab = (icon: string, label: string, on: boolean) => (
    <View key={label} style={{ flex: 1, alignItems: 'center', gap: 1 * k }}>
      <Icon name={icon} size={13 * k} color={on ? c.accentText : c.muted} />
      <Text style={{ fontFamily: font.bodySemi, fontSize: 6.5 * k, color: on ? c.accentText : c.muted }}>{label}</Text>
    </View>
  );
  return (
    <View style={[s.nav, { backgroundColor: c.surface, borderTopColor: c.line, paddingVertical: 4 * k }]}>
      {tab('sun', 'Today', !hot)}
      {tab('calendar', 'Journal', false)}
      <View style={{ flex: 1, alignItems: 'center', gap: 1 * k }}>
        <View
          style={[
            s.navSos,
            {
              width: 24 * k,
              height: 24 * k,
              borderRadius: 12 * k,
              marginTop: -12 * k,
              backgroundColor: c.sos,
              borderColor: hot ? c.coralSoft : c.surface,
              borderWidth: hot ? 4 * k : 2 * k,
            },
          ]}>
          <Icon name="life" size={13 * k} color={c.sosInk} />
        </View>
        <Text style={{ fontFamily: font.bodyBold, fontSize: 6.5 * k, color: hot ? c.sos : c.muted }}>SOS</Text>
      </View>
      {tab('book', 'Learn', false)}
      {tab('more', 'More', false)}
    </View>
  );
}

/** Welcome: the Today screen in a phone, with three notes pointing at what it does */
export function PicToday() {
  const c = useTheme();
  const note = (icon: string, tone: string, label: string) => {
    const t = toneOf(c, tone);
    return (
      <View style={[s.note, { backgroundColor: c.surface, borderColor: c.cardEdge, shadowColor: c.lip }]}>
        <View style={[s.noteIc, { backgroundColor: t.soft }]}>
          <Icon name={icon} size={15} color={t.text} />
        </View>
        <Text style={[s.noteT, { color: c.ink }]}>{label}</Text>
      </View>
    );
  };
  return (
    <View
      style={{ flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'center' }}
      accessible
      accessibilityLabel="The Today screen: your flame and level at the top, the next short lesson, and the SOS button at the bottom">
      <View style={[s.phone, { borderColor: c.scheme === 'dark' ? '#3A3170' : '#2A2350', backgroundColor: c.bg }]}>
        <View style={{ alignItems: 'center', paddingTop: 12, gap: 3 }}>
          <Flame level={8} size={58} />
          <Text style={{ fontFamily: font.display, fontSize: 13, color: c.ink }}>Level 8</Text>
          <View style={[s.miniBar, { backgroundColor: c.surface2 }]}>
            <View style={{ width: '42%', height: '100%', borderRadius: 3, backgroundColor: c.sun }} />
          </View>
        </View>
        <View style={[s.miniNext, { backgroundColor: c.mint }]}>
          <Icon name="book" size={12} color="#fff" />
          <View>
            <Text style={{ fontFamily: font.bodyBold, fontSize: 6.5, letterSpacing: 0.6, color: '#fff', opacity: 0.85 }}>NEXT UP</Text>
            <Text style={{ fontFamily: font.bodyBold, fontSize: 9.5, color: '#fff' }}>Urges are waves</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 4, paddingHorizontal: 8 }}>
          {[
            ['9', 'days logged'],
            ['12', 'urges ridden out'],
          ].map(([n, l]) => (
            <View key={l} style={[s.miniStat, { backgroundColor: c.surface }]}>
              <Text style={{ fontFamily: font.display, fontSize: 12, color: c.ink }}>{n}</Text>
              <Text style={{ fontFamily: font.body, fontSize: 6.5, color: c.muted }}>{l}</Text>
            </View>
          ))}
        </View>
        <View style={{ flex: 1 }} />
        <MiniNav />
      </View>
      <View style={{ gap: 26, flexShrink: 1 }}>
        {note('sun', 'sun', 'A flame that grows')}
        {note('book', 'mint', 'A short lesson a day')}
        {note('life', 'coral', 'SOS for urges')}
      </View>
    </View>
  );
}
/** how this setup works: three numbered steps, joined by a line */
export function PicSteps() {
  const c = useTheme();
  const rows: [string, string, string][] = [
    ['ask', 'Answer some questions', 'About 3 minutes'],
    ['chart', 'See what they show', 'Your time, your triggers'],
    ['shield', 'Get your plan', 'Built from your answers'],
  ];
  return (
    <View style={[s.col, { gap: 14 }]}>
      <View style={[s.rail, { backgroundColor: c.line }]} />
      {rows.map((r, i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={[s.num, { backgroundColor: c.accent, borderColor: c.surface }]}>
            <Text style={{ fontFamily: font.bodyBold, fontSize: 15, color: c.accentInk }}>{i + 1}</Text>
          </View>
          <View style={[s.step, { backgroundColor: c.skySoft }]}>
            <View style={[s.ic, { backgroundColor: c.surface }]}>
              <Icon name={r[0]} size={20} color={c.skyText} />
            </View>
            <View style={{ flex: 1 }}>
              <T v="label">{r[1]}</T>
              <T v="small" tone="muted">
                {r[2]}
              </T>
            </View>
          </View>
        </View>
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
    <Svg width={190} height={165} viewBox="0 0 150 130">
      <Circle cx={75} cy={65} r={60} fill={c.accentSoft} />
      <Path d="M75 102C41 80 30 62 30 48C30 34 40 25 52 25C62 25 70 31 75 40C80 31 88 25 98 25C110 25 120 34 120 48C120 62 109 80 75 102Z" fill={c.accent} />
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

export function PicTries({ width = 320 }: { width?: number }) {
  const c = useTheme();
  const cs = {
    fontSize: 10,
    fontWeight: '700' as const,
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
        TRY 1
      </SvgText>
      <SvgText x={132} y={148} {...cs}>
        TRY 2
      </SvgText>
      <SvgText x={214} y={148} {...cs}>
        TRY 3
      </SvgText>
      <SvgText x={282} y={148} {...cs} fill={c.accentText}>
        IT STICKS
      </SvgText>
    </Svg>
  );
}

export function PicCurve({ width = 320 }: { width?: number }) {
  const c = useTheme();
  const cs = {
    fontSize: 10,
    fontWeight: '700' as const,
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
        DAY 1
      </SvgText>
      <SvgText x={126} y={124} {...cs}>
        ONE BAD DAY
      </SvgText>
      <SvgText x={252} y={62} {...cs}>
        DAY 66
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
        <SvgText x={160} y={15} fontSize={10} fontWeight="700" fill="#fff" textAnchor="middle">
          SLIP
        </SvgText>
        <SvgText x={160} y={143} fontSize={10} fontWeight="700" fill={c.muted} textAnchor="middle">
          BACK TO 0
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

/** SOS: the one thing it would offer for this person's hardest moment */
export function PicSos({ a, when }: { a: SetupAnswers; when: string }) {
  const c = useTheme();
  const has = (a.when || []).length > 0;
  const T0 = obTool(has ? obTop(a) : 'other');
  const t = toneOf(c, T0.tone);
  return (
    <View style={[s.col, { gap: 0 }]} accessible accessibilityLabel={'Tap SOS and Daybook offers one tool to try: ' + T0.name}>
      <View style={[s.card, { backgroundColor: c.surface, borderColor: c.cardEdge, shadowColor: c.lip }, s.lift]}>
        <Text style={[s.eyebrow, { color: c.muted }]}>{when.toUpperCase()}</Text>
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
      <View style={[s.dash, { borderColor: c.sos }]} />
      <View style={[s.navBox, { borderColor: c.cardEdge }]}>
        <MiniNav hot k={1.6} />
      </View>
    </View>
  );
}

export function PicLesson() {
  const c = useTheme();
  const back = (deg: number, dy: number, col: string) => (
    <View style={[s.lesson, { position: 'absolute', top: dy, backgroundColor: col, borderColor: c.cardEdge, transform: [{ rotate: deg + 'deg' }] }]} />
  );
  return (
    <View
      style={{ width: 230, height: 214, alignSelf: 'center', alignItems: 'center' }}
      accessible
      accessibilityLabel="A lesson card called Urges are waves, 3 minutes">
      {back(-7, 14, c.violetSoft)}
      {back(5, 8, c.skySoft)}
      <View style={[s.lesson, { backgroundColor: c.surface, borderColor: c.cardEdge, shadowColor: c.lip }, s.lift]}>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          {[2, 2, 1, 0, 0].map((d, i) => (
            <View
              key={i}
              style={{ height: 6, width: d === 1 ? 22 : 12, borderRadius: 3, backgroundColor: d === 2 ? c.mint : d === 1 ? c.accent : c.surface2 }}
            />
          ))}
        </View>
        <Svg width={170} height={58} viewBox="0 0 170 58">
          <Path d="M6 52C38 52 52 10 85 10S132 52 164 52" stroke={c.mint} strokeWidth={4} fill="none" strokeLinecap="round" />
          <Circle cx={85} cy={10} r={6} fill={c.mintText} />
        </Svg>
        <Text style={{ fontFamily: font.display, fontSize: 18, color: c.ink }}>Urges are waves</Text>
        <T v="small" tone="muted">
          Lesson 2 · 3 min
        </T>
        <View style={[s.go, { backgroundColor: c.accent, alignSelf: 'stretch', alignItems: 'center' }]}>
          <Text style={{ fontFamily: font.bodySemi, fontSize: 13, color: c.accentInk }}>Next</Text>
        </View>
      </View>
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
    <View
      style={[
        s.card,
        {
          backgroundColor: c.surface,
          borderColor: c.cardEdge,
          alignSelf: 'stretch',
        },
      ]}
      accessible
      accessibilityLabel={'A sample chart of when urges happen across the day. The busiest stretch is ' + lab + '.'}>
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
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          height: 90,
          gap: 4,
        }}>
        {bins.map((b, i) => (
          <View key={i} style={{ flex: 1, justifyContent: 'flex-end', height: '100%' }}>
            <View
              style={{
                height: `${((b.v - b.s) / 9) * 100}%`,
                backgroundColor: i === top ? c.mint : c.mintSoft,
                borderTopLeftRadius: 4,
                borderTopRightRadius: 4,
              }}
            />
            <View style={{ height: `${(b.s / 9) * 100}%`, backgroundColor: c.slip }} />
          </View>
        ))}
      </View>
      {/* each label starts under its own bar: four parts of three bars, with the same gaps as the bars */}
      <View style={{ flexDirection: 'row', gap: 4 }}>
        {['12 AM', '6 AM', '12 PM', '6 PM'].map((x) => (
          <T key={x} v="small" tone="muted" style={{ flex: 1 }}>
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
    [13, 'Campfire', 52],
    [28, 'Rising', 64],
    [48, 'Full Sun', 78],
  ];
  return (
    <View
      style={{ gap: 10, alignItems: 'center' }}
      accessible
      accessibilityLabel="The flame grows in stages, from a spark to a campfire, then rising, and a full sun">
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
      <View
        style={{
          flexDirection: 'row',
          gap: 8,
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}>
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
        <View key={r[0]} style={[s.row, { backgroundColor: c.skySoft, borderColor: c.skySoft }]}>
          <View style={[s.ic, { backgroundColor: c.surface }]}>
            <Icon name={r[0]} size={20} color={c.skyText} />
          </View>
          <T v="label" style={{ flex: 1 }}>
            {r[1]}
          </T>
          <View style={[s.tick, { backgroundColor: c.mint }]}>
            <Icon name="check" size={15} color="#fff" />
          </View>
        </View>
      ))}
    </View>
  );
}

/* the icon a hard moment uses (for the plan on the review page) */
export const whenIcon = (t: string) => (OB_WHEN.find((w) => w[0] === t) || [])[2] || 'moon';

const s = StyleSheet.create({
  col: { gap: 8, alignSelf: 'stretch' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  ic: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: { gap: 8, padding: 14, borderRadius: 18, borderWidth: 1.5 },
  go: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  sos: {
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  chip: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999 },
  chipT: { fontFamily: font.bodyBold, fontSize: 12 },
  eyebrow: { fontFamily: font.bodyBold, fontSize: 11, letterSpacing: 1 },
  lift: { shadowOffset: { width: 0, height: 5 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3 },
  phone: { width: 148, height: 268, borderRadius: 26, borderWidth: 5, overflow: 'hidden', gap: 8 },
  miniBar: { width: 84, height: 6, borderRadius: 3, overflow: 'hidden' },
  miniNext: { flexDirection: 'row', alignItems: 'center', gap: 6, marginHorizontal: 8, padding: 7, borderRadius: 10 },
  miniStat: { flex: 1, padding: 5, borderRadius: 8 },
  nav: { flexDirection: 'row', alignItems: 'flex-end', borderTopWidth: 1 },
  navSos: { alignItems: 'center', justifyContent: 'center' },
  navBox: { alignSelf: 'stretch', marginTop: 4, borderRadius: 16, borderWidth: 1.5, overflow: 'visible', paddingTop: 14 },
  dash: { alignSelf: 'center', height: 30, borderLeftWidth: 2, borderStyle: 'dashed' },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  noteIc: { width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  noteT: { flexShrink: 1, fontFamily: font.bodyBold, fontSize: 13, lineHeight: 16 },
  rail: { position: 'absolute', left: 15, top: 24, bottom: 24, width: 2 },
  num: { width: 32, height: 32, borderRadius: 16, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  step: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 16 },
  lesson: { position: 'absolute', top: 0, width: 210, height: 196, alignItems: 'center', gap: 6, padding: 14, borderRadius: 20, borderWidth: 1.5 },
  tick: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
});
