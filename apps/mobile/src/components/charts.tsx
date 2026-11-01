/* The Journal's charts, one look for every graph (like the legacy "vz" charts): thin bars with a rounded top, a hairline grid,
   the same two outcome colors everywhere (teal: rode it out, amber: slipped), and violet for everything else. Every chart has its
   numbers as a table underneath, for anyone who would rather read them (and for screen readers). Drawn at the width shown. */
import { fmtDate, fmtHour, type DayKey } from '@daybook/core';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';

import { Icon, T } from '@/components/ui';
import { NATIVE, useReducedMotion } from '@/lib/motion';
import { font, useTheme } from '@/lib/theme';

export function useChartColors() {
  const c = useTheme();
  const dark = c.scheme === 'dark';
  return { rode: dark ? '#22A89A' : '#0F8F83', slip: dark ? '#D27903' : c.slip, acc: dark ? '#8A7DFA' : c.accent, grid: c.line, ax: c.muted, c };
}

/** whether a chart has been reached yet: on Pattern's cards a chart waits off to the side and grows when its card comes in */
export const ChartOn = createContext(true);
/** 0 to 1, once, when the chart is reached (at once with Reduce Motion on) */
export function useGrow(delay: number, duration = 650) {
  const on = useContext(ChartOn);
  const reduce = useReducedMotion();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduce) {
      v.setValue(1);
      return;
    }
    if (!on) return;
    const a = Animated.timing(v, { toValue: 1, duration, delay, easing: Easing.out(Easing.cubic), useNativeDriver: NATIVE });
    a.start();
    return () => a.stop();
  }, [on, reduce, v, delay, duration]);
  return v;
}

/** a nice top and step for an axis from 0 */
function scale(max: number, int = true) {
  if (max <= 0) return { top: 1, step: 1, k: 1 };
  let best: { top: number; step: number; k: number; over: number } | null = null;
  const pw = Math.pow(10, Math.floor(Math.log10(max)));
  for (const p of [pw / 10, pw, pw * 10])
    for (const m of [1, 2, 2.5, 5]) {
      const step = m * p;
      if (int && step % 1 !== 0) continue;
      const k = Math.ceil(max / step - 1e-9);
      const top = k * step;
      if (k < 2 || k > 4) continue;
      const over = top - max;
      if (!best || over < best.over - 1e-9 || (Math.abs(over - best.over) < 1e-9 && k < best.k)) best = { step, top, k, over };
    }
  return best || { step: Math.ceil(max), top: Math.ceil(max), k: 1 };
}
/** a bar with a rounded top and a square bottom */
const topPath = (x: number, y: number, w: number, h: number, r: number) => {
  r = Math.max(0, Math.min(r, w / 2, h));
  const f = (v: number) => v.toFixed(1);
  return `M${f(x)} ${f(y + h)}V${f(y + r)}${r ? `A${r} ${r} 0 0 1 ${f(x + r)} ${f(y)}H${f(x + w - r)}A${r} ${r} 0 0 1 ${f(x + w)} ${f(y + r)}` : `H${f(x + w)}`}V${f(y + h)}Z`;
};
const barW = (step: number) => Math.max(2, Math.min(24, Math.round(step * 0.62 * 2) / 2));

function useWidth(): [number, (e: { nativeEvent: { layout: { width: number } } }) => void] {
  const [w, setW] = useState(0);
  return [w, (e) => setW(Math.round(e.nativeEvent.layout.width))];
}

function xLabels(keys: DayKey[], X: (i: number) => number, y: number, iw: number, L: number, tk: DayKey, color: string) {
  const n = keys.length;
  if (n <= 7)
    return keys.map((k, i) => (
      <SvgText key={k} x={X(i)} y={y} fontSize={11} fill={color} textAnchor="middle" fontFamily={font.body}>
        {k === tk ? 'Today' : fmtDate(k, { weekday: 'short' })}
      </SvgText>
    ));
  const cnt = Math.max(2, Math.min(5, Math.floor(iw / 64)));
  const idx: number[] = [];
  for (let j = 0; j < cnt; j++) idx.push(Math.round((j * (n - 1)) / (cnt - 1)));
  return idx
    .filter((v, j, a) => a.indexOf(v) === j)
    .map((i) => {
      const first = i === 0;
      const last = i === n - 1;
      return (
        <SvgText
          key={i}
          x={first ? L : last ? L + iw : X(i)}
          y={y}
          fontSize={11}
          fill={color}
          textAnchor={first ? 'start' : last ? 'end' : 'middle'}
          fontFamily={font.body}>
          {last && keys[i] === tk ? 'Today' : fmtDate(keys[i], { month: 'short', day: 'numeric' })}
        </SvgText>
      );
    });
}
function grid(L: number, x2: number, T0: number, ih: number, sc: { top: number; step: number; k: number }, color: string, ax: string) {
  const out: ReactNode[] = [];
  for (let j = 0; j <= sc.k; j++) {
    const v = j * sc.step;
    const y = T0 + ih - (v / sc.top) * ih;
    out.push(<Line key={'l' + j} x1={L} x2={x2} y1={y} y2={y} stroke={color} strokeWidth={j ? 1 : 1.5} />);
    out.push(
      <SvgText key={'t' + j} x={L - 8} y={y + 3.8} fontSize={11} fill={ax} textAnchor="end" fontFamily={font.body}>
        {String(v)}
      </SvgText>,
    );
  }
  return out;
}

/** columns over days: one color, or rode and slipped stacked */
export function DayColumns({
  keys,
  rows,
  tk,
  label,
  height = 150,
}: {
  keys: DayKey[];
  rows: { a: number; b?: number }[];
  tk: DayKey;
  label: string;
  height?: number;
}) {
  const k = useChartColors();
  const [w, onLayout] = useWidth();
  const L = 30;
  const R = 6;
  const T0 = 8;
  const B = 22;
  const iw = Math.max(10, w - L - R);
  const ih = height - T0 - B;
  const max = Math.max(...rows.map((r) => r.a + (r.b || 0)), 0);
  const sc = scale(max);
  const n = keys.length;
  const step = iw / n;
  const bw = barW(step);
  const X = (i: number) => L + step * (i + 0.5);
  const px = ih / sc.top;
  return (
    <View onLayout={onLayout} accessible accessibilityLabel={label + '. The numbers are in the table below.'}>
      {w ? (
        <Svg width={w} height={height}>
          {grid(L, L + iw, T0, ih, sc, k.grid, k.ax)}
          {rows.map((r, i) => {
            const x = X(i) - bw / 2;
            const base = T0 + ih;
            const out: ReactNode[] = [];
            const segs =
              r.b == null
                ? [[r.a, k.acc]]
                : [
                    [r.a, k.rode],
                    [r.b, k.slip],
                  ];
            let cum = 0;
            const parts = segs.filter((q) => (q[0] as number) > 0);
            parts.forEach((q, j) => {
              const v = q[0] as number;
              const top = base - (cum + v) * px;
              const h = v * px - (j ? 2 : 0);
              cum += v;
              if (h <= 0.5) return;
              out.push(
                j === parts.length - 1 ? (
                  <Path key={j} d={topPath(x, top, bw, h, 4)} fill={q[1] as string} />
                ) : (
                  <Rect key={j} x={x} y={top} width={bw} height={h} fill={q[1] as string} />
                ),
              );
            });
            return <G key={i}>{out}</G>;
          })}
          {xLabels(keys, X, height - 6, iw, L, tk, k.ax)}
        </Svg>
      ) : (
        <View style={{ height }} />
      )}
    </View>
  );
}

/** a small trend line for a stat tile: no axes, the latest day marked */
export function Spark({ vals, label }: { vals: (number | null)[]; label: string }) {
  const k = useChartColors();
  const w = 120;
  const h = 30;
  const n = vals.length;
  const X = (i: number) => (n <= 1 ? w / 2 : 4 + (i / (n - 1)) * (w - 8));
  const Y = (v: number) => 4 + (1 - v / 10) * (h - 8);
  let d = '';
  vals.forEach((v, i) => {
    if (v == null) return;
    d += (d && vals[i - 1] != null ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1);
  });
  const last = vals
    .map((v, i) => [v, i] as [number | null, number])
    .filter((x) => x[0] != null)
    .pop();
  return (
    <Svg width={w} height={h} accessibilityLabel={label}>
      {d ? <Path d={d} stroke={k.acc} strokeWidth={2} fill="none" strokeLinecap="round" /> : null}
      {last ? <Circle cx={X(last[1])} cy={Y(last[0]!)} r={3.5} fill={k.acc} /> : null}
    </Svg>
  );
}

export function Legend({ items }: { items: ['rode' | 'slip' | 'acc' | 'win', string][] }) {
  const k = useChartColors();
  const col = { rode: k.rode, slip: k.slip, acc: k.acc, win: k.acc };
  return (
    <View style={s.legend}>
      {items.map(([kk, l]) => (
        <View key={l} style={s.li}>
          <View style={[s.sw, { backgroundColor: col[kk], opacity: 1 }]} />
          <T v="small" tone="muted">
            {l}
          </T>
        </View>
      ))}
    </View>
  );
}

/** the numbers behind a chart, newest first */
export function NumbersTable({ cap, head, rows }: { cap: string; head: string[]; rows: string[][] }) {
  const c = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <View>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen(!open)} style={s.tv}>
        <Text style={{ fontFamily: font.bodySemi, fontSize: 13, color: c.accentText }}>{open ? 'Hide the numbers' : 'Show the numbers'}</Text>
        <View style={{ transform: [{ rotate: open ? '90deg' : '0deg' }] }}>
          <Icon name="next" size={16} color={c.accentText} />
        </View>
      </Pressable>
      {open ? (
        <View accessibilityLabel={cap} style={[s.table, { borderColor: c.line }]}>
          <View style={[s.tr, { borderBottomColor: c.line }]}>
            {head.map((x, i) => (
              <Text key={i} style={[s.th, { color: c.muted, textAlign: i ? 'right' : 'left' }]}>
                {x}
              </Text>
            ))}
          </View>
          {rows.map((r, j) => (
            <View key={j} style={[s.tr, { borderBottomColor: c.line }]}>
              {r.map((x, i) => (
                <Text key={i} style={[s.td, { color: c.ink, textAlign: i ? 'right' : 'left' }]}>
                  {x}
                </Text>
              ))}
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

/** what a chart says before it has anything to draw: one plain line where the chart will be */
export function EmptyChart({ text }: { text: string }) {
  return <T tone="muted">{text}</T>;
}

const s = StyleSheet.create({
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  li: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sw: { width: 12, height: 12, borderRadius: 3 },
  tv: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44, alignSelf: 'flex-start' },
  table: { borderTopWidth: 1 },
  tr: { flexDirection: 'row', borderBottomWidth: 1, paddingVertical: 6 },
  th: { flex: 1, fontFamily: font.bodySemi, fontSize: 13 },
  td: { flex: 1, fontFamily: font.body, fontSize: 13, fontVariant: ['tabular-nums'] },
});
