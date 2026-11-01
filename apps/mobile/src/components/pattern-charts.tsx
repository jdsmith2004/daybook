/* Your pattern's charts (core: pattern.ts, pattern-cards.ts). They are drawn from what the app is made of, not from a chart
   kit, and quiet enough that the one thing a card is about stands out (docs/plan.md has the research behind this):
   - Ahead: no-slip days added up against the period before, a line that can only climb, a slip being a flat step
   - DayShapes: a calendar where each day is the shape and color of its answer on Today, and a day with no answer is a small dot
   - Moments: each hard moment ridden out is a small flame, and a slip is a small ring, never an alarm
   - FeelSky: the field of feelings a person names from, faint, with what they named lit up where it lives on it
   - Hours: the day in a row from 6 AM, so a night is never cut in two, with the hard hours marked behind it
   - Ranks: a thin bar for each thing, with its words on the line above
   - TwoNumbers: two numbers side by side, slip days and days with no slip
   One warm accent, the flame's, carries what was won. Everything else stays in the card's quiet colors, with its words on the
   chart and no legend. Nothing stands in an empty track. They come in once, and with Reduce Motion on they are simply there. */
import { FEEL_QUADS, type DayFeelStep, type DayKey, type PatDiff, type PatFeels, type PatFeltDay, type PatHour, type PatWhen } from '@daybook/core';
import { useState, type ReactNode } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';
import Svg, { Circle, G, Path } from 'react-native-svg';

import { useChartColors, useGrow } from '@/components/charts';
import { Shape, type ShapeKind } from '@/components/shapes';
import { FEEL_COLORS, feelKind } from '@/components/tools/feel';
import { font } from '@/lib/theme';

function useWidth(): [number, (e: { nativeEvent: { layout: { width: number } } }) => void] {
  const [w, setW] = useState(0);
  return [w, (e) => setW(Math.round(e.nativeEvent.layout.width))];
}

/** the colors of the charts: the flame's warm color for what was won, and a quiet one for a slip */
function useInk() {
  const k = useChartColors();
  return {
    ...k,
    win: k.c.scheme === 'dark' ? '#FFB347' : '#E77F12',
    core: k.c.scheme === 'dark' ? '#FFE08A' : '#FFC24D',
    hush: k.c.scheme === 'dark' ? 'rgba(189,181,230,0.5)' : 'rgba(98,90,133,0.42)',
  };
}

/** the room left for a chart in a card, as a size to draw at */
export function Room({ min = 180, children }: { min?: number; children: (w: number, h: number) => ReactNode }) {
  const [z, setZ] = useState({ w: 0, h: 0 });
  return (
    <View
      style={{ flex: 1, minHeight: min }}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setZ({ w: Math.round(width), h: Math.round(height) });
      }}>
      {z.w ? children(z.w, z.h) : null}
    </View>
  );
}

/** a thing that pops in when its card is reached */
function Pop({ delay, style, children }: { delay: number; style?: object; children: ReactNode }) {
  const v = useGrow(delay, 420);
  return (
    <Animated.View style={[style, { opacity: v, transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }] }]}>
      {children}
    </Animated.View>
  );
}

/** a column that rises from the floor */
function Rise({ h, w, delay, children }: { h: number; w: number; delay: number; children: ReactNode }) {
  const v = useGrow(delay);
  return (
    <View style={{ width: w, height: h, overflow: 'hidden', borderTopLeftRadius: 4, borderTopRightRadius: 4 }}>
      <Animated.View style={{ flex: 1, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [h, 0] }) }] }}>{children}</Animated.View>
    </View>
  );
}

/* ---------- how you are doing ---------- */
const LINE_TOP = 8;
const LINE_WORDS = 24;
const LINE_RIGHT = 12;
/** a person's no-slip days added up, over the same count from the period before. Above that line is better than last time */
export function Ahead({
  now,
  then,
  than,
  first,
  w,
  h,
  label,
}: {
  now: number[];
  then: number[] | null;
  than: string;
  first: string;
  w: number;
  h: number;
  label: string;
}) {
  const k = useInk();
  const v = useGrow(80, 1000);
  const n = now.length;
  const top = Math.max(1, n);
  const H = h - LINE_TOP - LINE_WORDS;
  const iw = w - LINE_RIGHT;
  const X = (i: number) => (n > 1 ? (i / (n - 1)) * iw : iw);
  const Y = (c: number) => LINE_TOP + (1 - c / top) * H;
  const path = (l: number[]) => l.map((c, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(c).toFixed(1)).join('');
  const a = now[n - 1] ?? 0;
  const b = then ? then[n - 1] : null;
  return (
    <View style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={label}>
      <View style={[s.abs, { left: 0, right: 0, top: Y(0), height: 1, backgroundColor: k.grid }]} />
      <Animated.View
        style={{
          position: 'absolute',
          width: w,
          height: h,
          overflow: 'hidden',
          transform: [{ translateX: v.interpolate({ inputRange: [0, 1], outputRange: [-w, 0] }) }],
        }}>
        <Animated.View style={{ width: w, height: h, transform: [{ translateX: v.interpolate({ inputRange: [0, 1], outputRange: [w, 0] }) }] }}>
          <Svg width={w} height={h}>
            {then ? <Path d={path(then)} stroke={k.hush} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" /> : null}
            {n > 1 ? <Path d={path(now)} stroke={k.win} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" fill="none" /> : null}
            <Circle cx={X(n - 1)} cy={Y(a)} r={10} fill={k.win} opacity={0.22} />
            <Circle cx={X(n - 1)} cy={Y(a)} r={5} fill={k.win} />
          </Svg>
        </Animated.View>
      </Animated.View>
      {/* the lines run up to the right, so the top left is always open */}
      <View style={[s.abs, { left: 0, top: 2, gap: 2 }]}>
        <View style={s.aheadKey}>
          <View style={[s.aheadSwatch, { backgroundColor: k.win }]} />
          <Text style={[s.dl, { color: k.c.ink }]}>{a} now</Text>
        </View>
        {b != null ? (
          <View style={s.aheadKey}>
            <View style={[s.aheadSwatch, { backgroundColor: k.hush }]} />
            <Text style={[s.dl, { fontFamily: font.body, color: k.ax }]}>
              {b} {than.replace(/^in /, '')}
            </Text>
          </View>
        ) : null}
      </View>
      <View style={[s.between, s.abs, { left: 0, right: 0, top: h - 16 }]}>
        <Text style={[s.ax, { color: k.ax }]}>{first}</Text>
        <Text style={[s.ax, { color: k.ax }]}>Today</Text>
      </View>
    </View>
  );
}

/* ---------- how each day felt ---------- */
const STEP_WORD: Record<DayFeelStep, string> = { 5: 'Great', 4: 'Good', 3: 'Okay', 2: 'Low', 1: 'Rough' };
const WEEK_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const CAL_GAP = 4;
const weekdayOf = (k: DayKey) => {
  const [y, m, d] = k.split('-').map(Number);
  return (new Date(y, m - 1, d).getDay() + 6) % 7;
};
/** one place in the calendar: the shape of its answer, or a small dot for a day with none */
function DayMark({
  m,
  size,
  on,
  look,
  i,
  delay,
}: {
  m: PatFeltDay;
  size: number;
  on: boolean;
  look: (n: DayFeelStep) => { kind: ShapeKind; color: string };
  i: number;
  delay: number;
}) {
  const k = useInk();
  const at = m.n ? look(m.n) : null;
  return (
    <Pop delay={120 + i * delay} style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {at ? (
        <Shape kind={at.kind} size={size - 2} color={at.color} />
      ) : (
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: k.hush, opacity: on ? 1 : 0.6 }} />
      )}
    </Pop>
  );
}
/** the range as a calendar, each day in the shape and color of its answer. A long log is a shape for each week, in reading order */
export function DayShapes({
  marks,
  weeks,
  by,
  tk,
  w,
  h,
  look,
  label,
}: {
  marks: PatFeltDay[];
  weeks: boolean;
  by: number[];
  tk: DayKey;
  w: number;
  h: number;
  look: (n: DayFeelStep) => { kind: ShapeKind; color: string };
  label: string;
}) {
  const k = useInk();
  const KEY = 28;
  const room = h - KEY;
  const line = !weeks && marks.length <= 7;
  /* a week is one row. A month is a calendar, so its head says the days. A long log fills the room in reading order */
  let cols = 7;
  if (weeks) {
    cols = 7;
    while (cols < 16 && Math.ceil(marks.length / cols) * ((w - (cols - 1) * CAL_GAP) / cols + CAL_GAP) > room) cols++;
  }
  const pad = !weeks && !line && marks.length ? weekdayOf(marks[0].k) : 0;
  const rows = Math.ceil((marks.length + pad) / cols);
  const head = !weeks && !line ? 20 : 0;
  const size = Math.floor(Math.min((w - (cols - 1) * CAL_GAP) / cols, 46, line ? 46 : (room - head - (rows - 1) * CAL_GAP) / Math.max(rows, 1)));
  const grid = cols * size + (cols - 1) * CAL_GAP;
  const places: (PatFeltDay | null)[] = [...Array.from({ length: pad }, () => null), ...marks];
  return (
    <View style={{ width: w, height: h, justifyContent: 'space-between' }} accessible accessibilityRole="image" accessibilityLabel={label}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: line ? 'center' : 'flex-end', paddingBottom: 10 }}>
        {head ? (
          <View style={{ flexDirection: 'row', gap: CAL_GAP, height: head, width: grid }}>
            {WEEK_LETTERS.map((l, i) => (
              <Text key={i} style={[s.ax, { width: size, textAlign: 'center', color: k.ax }]}>
                {l}
              </Text>
            ))}
          </View>
        ) : null}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: CAL_GAP, width: grid }}>
          {places.map((m, i) =>
            m ? (
              <View key={m.k} style={{ alignItems: 'center' }}>
                <DayMark m={m} size={size} on={m.k === tk} look={look} i={i} delay={line ? 60 : 16} />
                {line ? <Text style={[s.ax, { marginTop: 6, color: m.k === tk ? k.c.ink : k.ax }]}>{WEEK_LETTERS[weekdayOf(m.k)]}</Text> : null}
              </View>
            ) : (
              <View key={'pad' + i} style={{ width: size, height: size }} />
            ),
          )}
        </View>
      </View>
      <View style={s.key}>
        {([5, 4, 3, 2, 1] as DayFeelStep[]).map((n) =>
          by[n - 1] ? (
            <View key={n} style={s.keyItem}>
              <Shape kind={look(n).kind} size={13} color={look(n).color} />
              <Text style={[s.ax, { color: k.ax }]}>
                {STEP_WORD[n]} {by[n - 1]}
              </Text>
            </View>
          ) : null,
        )}
      </View>
    </View>
  );
}

/* ---------- the moments ridden out ---------- */
/* drawn in 24 by 24, standing from 1.5 to 20.5 */
const FLAME = 'M12 1.5c.9 3.6 6.4 6.7 6.4 12.6a6.4 6.4 0 0 1-12.8 0c0-2.4 1-4 2.4-5.4.3 1.8 1.1 2.7 2.1 3.1C9.7 8.6 10.3 5 12 1.5z';
/** the small bright heart of a flame */
const FLAME_CORE = 'M12 11.4c.5 1.7 3 3 3 5.4a3 3 0 0 1-6 0c0-1.2.5-2 1.2-2.7.2.8.5 1.2 1 1.4-.1-1.4 0-2.8.8-4.1z';
export interface MomentCol {
  label: string;
  rode: number;
  slipped: number;
}
function MomentColumn({
  c,
  per,
  size,
  step,
  cw,
  H,
  i,
  few,
  today,
}: {
  c: MomentCol;
  per: number;
  size: number;
  step: number;
  cw: number;
  H: number;
  i: number;
  few: boolean;
  today: boolean;
}) {
  const k = useInk();
  const flames = Math.round(c.rode / per);
  const rings = Math.round(c.slipped / per);
  const y = (j: number) => H - (j + 1) * step + (step - size) / 2;
  return (
    <View style={{ width: cw, alignItems: 'center' }}>
      <Pop delay={80 + i * 60} style={{ width: cw, height: H }}>
        <Svg width={cw} height={H}>
          {Array.from({ length: flames }, (_, j) => (
            <G key={j} transform={`translate(${cw / 2 - 12 * (size / 19)} ${y(j) - 1.5 * (size / 19)}) scale(${size / 19})`}>
              <Path d={FLAME} fill={k.win} />
              <Path d={FLAME_CORE} fill={k.core} />
            </G>
          ))}
          {Array.from({ length: rings }, (_, j) => (
            <Circle key={'r' + j} cx={cw / 2} cy={y(flames + j) + size / 2} r={size * 0.26} stroke={k.ax} strokeWidth={2} fill="none" />
          ))}
        </Svg>
      </Pop>
      {few ? <Text style={[s.ax, { marginTop: 8, color: today ? k.c.ink : k.ax }]}>{c.label}</Text> : null}
    </View>
  );
}
/** how tall everything Moments adds under its columns stands */
export const MOMENT_FOOT = 26 + 21;
/** each hard moment ridden out as a small flame, standing in a column for its stretch, with a slip as a small ring on top. What is won piles up. */
export function Moments({ cols, H, w, label }: { cols: MomentCol[]; H: number; w: number; label: string }) {
  const k = useInk();
  const n = cols.length;
  const most = Math.max(1, ...cols.map((c) => c.rode + c.slipped));
  const cw = w / Math.max(n, 1);
  const widest = Math.min(cw * 1.3, 34);
  /* the flames grow to fill the room, and past what fits each one stands for more than one moment */
  const fit = Math.max(1, Math.floor(H / 14));
  const per = Math.max(1, Math.ceil(most / fit));
  const rows = Math.ceil(most / per);
  const step = Math.min(widest + 3, H / Math.max(rows, 1));
  const size = Math.min(widest, step - 1);
  const few = n <= 7;
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={label}>
      <View style={{ flexDirection: 'row', height: H + 26 }}>
        {cols.map((c, i) => (
          <MomentColumn key={i} c={c} per={per} size={size} step={step} cw={cw} H={H} i={i} few={few} today={c.label === 'Today'} />
        ))}
      </View>
      <View style={[s.abs, { left: 0, right: 0, top: H, height: 1, backgroundColor: k.grid }]} />
      {few ? null : (
        <View style={[s.between, s.abs, { left: 0, right: 0, top: H + 8 }]}>
          <Text style={[s.ax, { color: k.ax }]}>{cols[0]?.label}</Text>
          <Text style={[s.ax, { color: k.ax }]}>{cols[n - 1]?.label}</Text>
        </View>
      )}
      <View style={[s.key, { marginTop: 4 }]}>
        <View style={s.keyItem}>
          <Svg width={13} height={13} viewBox="0 0 24 24">
            <Path d={FLAME} fill={k.win} />
          </Svg>
          <Text style={[s.ax, { color: k.ax }]}>{per > 1 ? per + ' ridden out' : 'Ridden out'}</Text>
        </View>
        <View style={s.keyItem}>
          <Svg width={13} height={13}>
            <Circle cx={6.5} cy={6.5} r={4} stroke={k.ax} strokeWidth={2} fill="none" />
          </Svg>
          <Text style={[s.ax, { color: k.ax }]}>{per > 1 ? per + ' slips' : 'A slip'}</Text>
        </View>
      </View>
    </View>
  );
}

/* ---------- what was named ---------- */
const FIELD = 12;
const SKY_WORDS = 18;
function Lit({ r, c, size, cell, i }: { r: number; c: number; size: number; cell: number; i: number }) {
  return (
    <Pop delay={200 + i * 90} style={{ position: 'absolute', left: c * cell + cell / 2 - size / 2, top: r * cell + cell / 2 - size / 2 }}>
      <Shape kind={feelKind(r, c)} size={size} color={FEEL_COLORS[r][c]} />
    </Pop>
  );
}
/** the field of feelings, the one a person picks from, faint, with what they named lit up where it lives and its word beside it */
export function FeelSky({ quads, words, w, h, label }: { quads: PatFeels['quads']; words: PatFeels['words']; w: number; h: number; label: string }) {
  const k = useInk();
  const side = Math.min(w, h - SKY_WORDS * 2);
  const cell = side / FIELD;
  const dim = Array.from({ length: FIELD * FIELD }, (_, i) => [Math.floor(i / FIELD), i % FIELD]);
  /* a word named once is small; it grows with each time, up to five */
  const sizeOf = (n: number) => cell * (0.9 + 0.3 * Math.min(n, 5));
  /* each word sits under its shape, or else over it, wherever it does not touch another one; with no room it is left to the numbers under the card */
  const taken = words.map((x) => {
    const z = sizeOf(x.n);
    return { x: x.c * cell + cell / 2 - z / 2, y: x.r * cell + cell / 2 - z / 2, w: z, h: z };
  });
  const hits = (a: { x: number; y: number; w: number; h: number }) =>
    a.x < 0 || a.x + a.w > side || taken.some((b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h);
  const named = words.slice(0, 8).map((x, i) => {
    const z = sizeOf(x.n);
    const lw = x.w.length * 7 + 10;
    const cx = x.c * cell + cell / 2;
    const cy = x.r * cell + cell / 2;
    for (const y of [cy + z / 2 + 1, cy - z / 2 - 16]) {
      const left = Math.max(0, Math.min(side - lw, cx - lw / 2));
      const box = { x: left, y, w: lw, h: 15 };
      if (y >= 0 && y + 15 <= side && !hits(box)) {
        taken.push(box);
        return { w: x.w, left, y, width: lw, i };
      }
    }
    return null;
  });
  const corner = (id: string) => quads.find((x) => x.q === id)?.word;
  return (
    <View style={{ width: w, height: h, alignItems: 'center', justifyContent: 'flex-end' }} accessible accessibilityRole="image" accessibilityLabel={label}>
      <View style={[s.between, { width: side, height: SKY_WORDS }]}>
        <Text style={[s.ax, { color: k.ax }]}>{corner('red')}</Text>
        <Text style={[s.ax, { color: k.ax }]}>{corner('yellow')}</Text>
      </View>
      <View style={{ width: side, height: side }}>
        {dim.map(([r, c]) => (
          <View
            key={r + '-' + c}
            style={[
              s.abs,
              {
                left: c * cell + cell / 2 - 1.5,
                top: r * cell + cell / 2 - 1.5,
                width: 3,
                height: 3,
                borderRadius: 1.5,
                backgroundColor: FEEL_COLORS[r][c],
                opacity: 0.35,
              },
            ]}
          />
        ))}
        {words.map((x, i) => (
          <Lit key={x.w} r={x.r} c={x.c} size={sizeOf(x.n)} cell={cell} i={i} />
        ))}
        {named.map((x) =>
          x ? (
            <Pop key={x.w} delay={260 + x.i * 90} style={{ position: 'absolute', left: x.left, top: x.y, width: x.width }}>
              <Text numberOfLines={1} style={[s.ax, { textAlign: 'center', color: k.c.ink }]}>
                {x.w}
              </Text>
            </Pop>
          ) : null,
        )}
      </View>
      <View style={[s.between, { width: side, height: SKY_WORDS, alignItems: 'flex-end' }]}>
        <Text style={[s.ax, { color: k.ax }]}>{corner('blue')}</Text>
        <Text style={[s.ax, { color: k.ax }]}>{corner('green')}</Text>
      </View>
    </View>
  );
}

/* ---------- the hours of the day ---------- */
/** the row starts here, so a night stays in one piece: most hard hours are at night */
const DAY_FROM = 6;
/** two hours to a column, the size of the hard hours: a single hour says more than a few entries know */
const HOUR_COLS = 12;
/** how tall the words under Hours stand, to take from the room for the columns */
export const HOUR_WORDS = 26;
const ampm = (h: number) => (h % 12 || 12) + (h < 12 ? ' AM' : ' PM');
/** entries through the day, with the hard hours marked behind them */
export function Hours({ hours, hard, H }: { hours: PatHour[]; hard: PatWhen['hard']; H: number }) {
  const k = useInk();
  const [w, onLayout] = useWidth();
  const slotW = w / HOUR_COLS;
  const bw = Math.round(slotW * 0.56);
  const cols = Array.from({ length: HOUR_COLS }, (_, i) => {
    const a = hours[(DAY_FROM + i * 2) % 24];
    const b = hours[(DAY_FROM + i * 2 + 1) % 24];
    return { h: a.h, rode: a.rode + b.rode, slipped: a.slipped + b.slipped };
  });
  /* one entry is not a full column */
  const top = Math.max(4, ...cols.map((x) => x.rode + x.slipped));
  const busiest = cols.slice().sort((a, b) => b.rode + b.slipped - (a.rode + a.slipped))[0];
  const band = (start: number, color: string) => {
    const left = (((start - DAY_FROM + 24) % 24) / 24) * w;
    return (
      <View
        key={color}
        style={[
          s.abs,
          {
            left,
            top: 0,
            width: Math.min(w / 12, w - left),
            height: H,
            backgroundColor: color,
            opacity: 0.18,
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8,
          },
        ]}
      />
    );
  };
  return (
    <View
      onLayout={onLayout}
      style={{ height: H + HOUR_WORDS }}
      accessible
      accessibilityRole="image"
      accessibilityLabel={busiest.rode + busiest.slipped ? 'Entries through the day, most around ' + ampm(busiest.h) : 'Entries through the day'}>
      {w ? (
        <>
          {hard.weekdays ? band(hard.weekdays.start, k.acc) : null}
          {hard.weekends ? band(hard.weekends.start, k.c.violet) : null}
          <View style={[s.abs, { left: 0, right: 0, top: H, height: 1, backgroundColor: k.grid }]} />
          {hard.weekdays || hard.weekends ? (
            <Text style={[s.ax, s.abs, { top: 0, right: w - ((((hard.weekdays || hard.weekends)!.start - DAY_FROM + 24) % 24) / 24) * w + 6, color: k.ax }]}>
              Hard hours
            </Text>
          ) : null}
          {cols.map((x, i) => {
            const t = x.rode + x.slipped;
            if (!t) return null;
            const h = Math.max(6, (t / top) * H);
            return (
              <View key={i} style={[s.abs, { left: i * slotW + (slotW - bw) / 2, top: H - h }]}>
                <Rise h={h} w={bw} delay={60 + i * 45}>
                  <View style={{ flex: 1, gap: 2 }}>
                    {x.slipped ? <View style={{ flex: x.slipped, backgroundColor: k.hush }} /> : null}
                    {x.rode ? <View style={{ flex: x.rode, backgroundColor: k.win }} /> : null}
                  </View>
                </Rise>
              </View>
            );
          })}
          {(
            [
              [6, '6 AM'],
              [12, 'Noon'],
              [18, '6 PM'],
              [0, 'Midnight'],
            ] as [number, string][]
          ).map(([h, l], i) => (
            <Text key={h} style={[s.ax, s.abs, { left: (i * w) / 4, top: H + 8, color: k.ax }]}>
              {l}
            </Text>
          ))}
        </>
      ) : null}
    </View>
  );
}
/** what the two colors of a column are */
export function HoursKey() {
  const k = useInk();
  return (
    <View style={s.key}>
      <View style={s.keyItem}>
        <View style={[s.keyDot, { backgroundColor: k.win }]} />
        <Text style={[s.ax, { color: k.ax }]}>Ridden out</Text>
      </View>
      <View style={s.keyItem}>
        <View style={[s.keyDot, { backgroundColor: k.hush }]} />
        <Text style={[s.ax, { color: k.ax }]}>Slipped</Text>
      </View>
    </View>
  );
}
/** the days of the week, only when one stands out: a short row under the hours */
export function WeekRow({ week, on, H }: { week: { d: number; name: string; rode: number; slipped: number }[]; on?: number; H: number }) {
  const k = useInk();
  const top = Math.max(1, ...week.map((x) => x.rode + x.slipped));
  return (
    <View
      style={{ flexDirection: 'row' }}
      accessible
      accessibilityRole="image"
      accessibilityLabel={'Entries by day of the week. ' + week.map((x) => x.name + ' ' + (x.rode + x.slipped)).join(', ')}>
      {week.map((x, i) => {
        const t = x.rode + x.slipped;
        const h = t ? Math.max(4, (t / top) * H) : 0;
        return (
          <View key={x.d} style={{ flex: 1, alignItems: 'center' }}>
            <View style={{ height: H, justifyContent: 'flex-end' }}>
              {h ? (
                <Rise h={h} w={16} delay={200 + i * 45}>
                  <View style={{ flex: 1, backgroundColor: x.d === on ? k.win : k.hush }} />
                </Rise>
              ) : null}
            </View>
            <Text style={[s.ax, { marginTop: 4, color: x.d === on ? k.c.ink : k.ax }]}>{x.name.slice(0, 1)}</Text>
          </View>
        );
      })}
    </View>
  );
}

/* ---------- things in order ---------- */
export interface Rank {
  label: string;
  /** the words at the end of its line */
  note: string;
  /** the part that was won, and the part that was not */
  win: number;
  hush: number;
}
function RankRow({ r, top, i }: { r: Rank; top: number; i: number }) {
  const k = useInk();
  const v = useGrow(80 + i * 70);
  const t = r.win + r.hush;
  return (
    <View style={{ gap: 6 }} accessible accessibilityLabel={r.label + ': ' + r.note}>
      <View style={s.rankTop}>
        <Text numberOfLines={1} style={[s.dl, { flex: 1, color: k.c.ink }]}>
          {r.label}
        </Text>
        <Text style={[s.ax, { color: k.ax }]}>{r.note}</Text>
      </View>
      <Animated.View
        style={{ flexDirection: 'row', gap: 2, height: 8, width: `${Math.max(3, (t / top) * 100)}%`, transformOrigin: 'left', transform: [{ scaleX: v }] }}>
        {r.win ? <View style={{ flex: r.win, borderRadius: 4, backgroundColor: k.win }} /> : null}
        {r.hush ? <View style={{ flex: r.hush, borderRadius: 4, backgroundColor: k.hush }} /> : null}
      </Animated.View>
    </View>
  );
}
/** a thin bar for each thing, biggest first, with its words on the line above. No track and no key: the words say it */
export function Ranks({ items }: { items: Rank[] }) {
  const top = Math.max(1, ...items.map((x) => x.win + x.hush));
  return (
    <View style={{ gap: 16 }}>
      {items.map((r, i) => (
        <RankRow key={r.label} r={r} top={top} i={i} />
      ))}
    </View>
  );
}

/* ---------- slip days against days with no slip ---------- */
/** each answer as two numbers side by side. A difference this plain needs no drawing */
export function TwoNumbers({ list }: { list: PatDiff[] }) {
  const k = useInk();
  const fmt = (d: PatDiff, v: number) => (d.unit === 'pct' ? Math.round(v * 100) + '%' : String(Math.round(v * 10) / 10) + (d.unit === 'h' ? ' h' : ''));
  return (
    <View style={{ gap: 24 }}>
      {list.map((d) => (
        <View key={d.k} style={{ gap: 8 }} accessible accessibilityLabel={d.line}>
          <Text style={[s.dl, { color: k.c.ink }]}>{d.label}</Text>
          <View style={{ flexDirection: 'row' }}>
            <View style={{ flex: 1 }}>
              <Text style={[s.big, { color: k.win }]}>{fmt(d, d.clean)}</Text>
              <Text style={[s.ax, { color: k.ax }]}>Days with no slip</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.big, { color: k.c.ink }]}>{fmt(d, d.slip)}</Text>
              <Text style={[s.ax, { color: k.ax }]}>Slip days</Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  abs: { position: 'absolute' },
  between: { flexDirection: 'row', justifyContent: 'space-between' },
  key: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 10, rowGap: 4 },
  keyItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  keyDot: { width: 8, height: 8, borderRadius: 4 },
  aheadKey: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  aheadSwatch: { width: 12, height: 3, borderRadius: 2 },
  rankTop: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  big: { fontFamily: font.display, fontSize: 28, lineHeight: 34, fontVariant: ['tabular-nums'] },
  ax: { fontFamily: font.body, fontSize: 12 },
  dl: { fontFamily: font.bodySemi, fontSize: 15 },
});
