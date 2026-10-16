/* The Journal's charts, one look for every graph (like the legacy "vz" charts): thin bars with a rounded top, a hairline grid,
   the same two outcome colors everywhere (teal: rode it out, amber: slipped), and violet for everything else. Every chart has its
   numbers as a table underneath, for anyone who would rather read them (and for screen readers). Drawn at the width shown. */
import { fmtDate, fmtHour, type DayKey } from '@daybook/core';
import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, G, Line, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';

import { Icon, T } from '@/components/ui';
import { font, useTheme } from '@/lib/theme';

export function useChartColors() {
  const c = useTheme();
  const dark = c.scheme === 'dark';
  return { rode: dark ? '#22A89A' : '#0F8F83', slip: dark ? '#D27903' : c.slip, acc: dark ? '#8A7DFA' : c.accent, grid: c.line, ax: c.muted, c };
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
        <SvgText key={i} x={first ? L : last ? L + iw : X(i)} y={y} fontSize={11} fill={color} textAnchor={first ? 'start' : last ? 'end' : 'middle'} fontFamily={font.body}>
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
export function DayColumns({ keys, rows, tk, label, height = 150 }: { keys: DayKey[]; rows: { a: number; b?: number }[]; tk: DayKey; label: string; height?: number }) {
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
            const segs = r.b == null ? [[r.a, k.acc]] : [[r.a, k.rode], [r.b, k.slip]];
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

/** the four ratings, each in its own small chart, 0 to 10 */
export function FeelTiles({ keys, series }: { keys: DayKey[]; series: { id: string; name: string; vals: (number | null)[] }[] }) {
  const k = useChartColors();
  const [w, onLayout] = useWidth();
  const cols = w >= 460 ? 2 : 1;
  const tw = cols === 2 ? (w - 12) / 2 : w;
  const h = 96;
  const pad = 8;
  const n = keys.length;
  return (
    <View onLayout={onLayout} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }} accessible accessibilityLabel="Daily ratings from 0 to 10. The numbers are in the table below.">
      {w
        ? series.map((sr) => {
            const X = (i: number) => (n <= 1 ? tw / 2 : pad + (i / (n - 1)) * (tw - pad * 2));
            const Y = (v: number) => 10 + (1 - v / 10) * (h - 22);
            const have = sr.vals.map((v, i) => [v, i] as [number | null, number]).filter((x) => x[0] != null);
            let solid = '';
            let pale = '';
            let area = '';
            const runs: number[][] = [];
            have.forEach(([, i]) => {
              const last = runs[runs.length - 1];
              if (last && i - last[last.length - 1] <= 3) last.push(i);
              else runs.push([i]);
            });
            runs.forEach((r) => {
              if (r.length > 1) {
                area += `M${X(r[0]).toFixed(1)} ${h - 12}` + r.map((i) => `L${X(i).toFixed(1)} ${Y(sr.vals[i]!).toFixed(1)}`).join('') + `L${X(r[r.length - 1]).toFixed(1)} ${h - 12}Z`;
                for (let q = 1; q < r.length; q++) {
                  const seg = `M${X(r[q - 1]).toFixed(1)} ${Y(sr.vals[r[q - 1]]!).toFixed(1)}L${X(r[q]).toFixed(1)} ${Y(sr.vals[r[q]]!).toFixed(1)}`;
                  if (r[q] - r[q - 1] === 1) solid += seg;
                  else pale += seg;
                }
              }
            });
            const lastI = have.length ? have[have.length - 1][1] : -1;
            const lastV = lastI >= 0 ? sr.vals[lastI] : null;
            return (
              <View key={sr.id} style={{ width: tw, gap: 2 }}>
                <View style={s.between}>
                  <T v="label">{sr.name}</T>
                  <T v="small" tone="muted">
                    {lastV == null ? '–' : 'Last ' + lastV}
                  </T>
                </View>
                <Svg width={tw} height={h}>
                  <Defs>
                    <LinearGradient id={'g' + sr.id} x1="0" y1="0" x2="0" y2="1">
                      <Stop offset="0" stopColor={k.acc} stopOpacity={0.26} />
                      <Stop offset="1" stopColor={k.acc} stopOpacity={0} />
                    </LinearGradient>
                  </Defs>
                  <Line x1={0} x2={tw} y1={h - 12} y2={h - 12} stroke={k.grid} strokeWidth={1.5} />
                  <Line x1={0} x2={tw} y1={Y(5)} y2={Y(5)} stroke={k.grid} strokeWidth={1} strokeDasharray="3 4" />
                  {area ? <Path d={area} fill={`url(#g${sr.id})`} /> : null}
                  {pale ? <Path d={pale} stroke={k.acc} strokeOpacity={0.4} strokeWidth={2.5} fill="none" strokeLinecap="round" /> : null}
                  {solid ? <Path d={solid} stroke={k.acc} strokeWidth={2.5} fill="none" strokeLinecap="round" /> : null}
                  {sr.vals.map((v, i) => {
                    if (v == null) return null;
                    const lone = (i === 0 || sr.vals[i - 1] == null) && (i === n - 1 || sr.vals[i + 1] == null);
                    const end = i === lastI;
                    return have.length <= 14 || lone || end ? <Circle key={i} cx={X(i)} cy={Y(v)} r={end || have.length <= 14 ? 4 : 3} fill={k.acc} /> : null;
                  })}
                </Svg>
              </View>
            );
          })
        : null}
    </View>
  );
}

/** entries by hour of the day, with the busiest two hours marked */
export function HourChart({ bins, bw, height = 176 }: { bins: { h: number; rode: number; slipped: number }[]; bw: { start: number; end: number } | null; height?: number }) {
  const k = useChartColors();
  const [w, onLayout] = useWidth();
  const L = 26;
  const R = 6;
  const T0 = 10;
  const B = 34;
  const iw = Math.max(10, w - L - R);
  const ih = height - T0 - B;
  const max = Math.max(...bins.map((b) => b.rode + b.slipped), 0);
  const sc = scale(max);
  const step = iw / 24;
  const bwid = barW(step);
  const px = ih / sc.top;
  const base = T0 + ih;
  const win = bw ? bins.findIndex((b) => b.h === bw.start) : -1;
  return (
    <View onLayout={onLayout} accessible accessibilityLabel="Entries by hour of the day, rode it out and slipped. The numbers are in the table below.">
      {w ? (
        <Svg width={w} height={height}>
          {win >= 0 ? <Rect x={L + step * win} y={T0} width={step * 2} height={ih} fill={k.acc} opacity={0.12} rx={6} /> : null}
          {grid(L, L + iw, T0, ih, sc, k.grid, k.ax)}
          {bins.map((b, i) => {
            const x = L + step * (i + 0.5) - bwid / 2;
            const parts = (
              [
                [b.rode, k.rode],
                [b.slipped, k.slip],
              ] as [number, string][]
            ).filter((q) => q[0] > 0);
            let cum = 0;
            return (
              <G key={i}>
                {parts.map((q, j) => {
                  const top = base - (cum + q[0]) * px;
                  const hh = q[0] * px - (j ? 2 : 0);
                  cum += q[0];
                  if (hh <= 0.5) return null;
                  return j === parts.length - 1 ? <Path key={j} d={topPath(x, top, bwid, hh, 3)} fill={q[1]} /> : <Rect key={j} x={x} y={top} width={bwid} height={hh} fill={q[1]} />;
                })}
              </G>
            );
          })}
          {[0, 6, 12, 18].map((i) => (
            <SvgText key={i} x={L + step * i} y={height - 18} fontSize={11} fill={k.ax} textAnchor="start" fontFamily={font.body}>
              {fmtHour(bins[i].h)}
            </SvgText>
          ))}
        </Svg>
      ) : (
        <View style={{ height }} />
      )}
    </View>
  );
}

/** horizontal bars: a label, a stacked bar, and the total */
export function HBars({ items, unit }: { items: { label: string; dim?: boolean; segs: [number, 'rode' | 'slip' | 'acc'][] }[]; unit?: (n: number) => string }) {
  const k = useChartColors();
  const max = Math.max(...items.map((it) => it.segs.reduce((a, q) => a + q[0], 0)), 1);
  return (
    <View style={{ gap: 10 }}>
      {items.map((it, i) => {
        const tot = it.segs.reduce((a, q) => a + q[0], 0);
        return (
          <View key={i} style={{ gap: 4 }} accessible accessibilityLabel={`${it.label}: ${tot}${unit ? ' ' + unit(tot) : ''}`}>
            <View style={s.between}>
              <T v="small" tone={it.dim ? 'muted' : 'ink'} style={{ fontFamily: font.bodySemi, flex: 1 }}>
                {it.label}
              </T>
              <T v="small" tone="muted">
                {tot}
                {unit ? ' ' + unit(tot) : ''}
              </T>
            </View>
            <View style={{ flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden', backgroundColor: k.c.surface2 }}>
              {it.segs.map((q, j) =>
                q[0] > 0 ? <View key={j} style={{ width: `${(q[0] / max) * 100}%`, backgroundColor: q[1] === 'rode' ? k.rode : q[1] === 'slip' ? k.slip : k.acc, marginLeft: j ? 2 : 0 }} /> : null,
              )}
            </View>
          </View>
        );
      })}
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
  const last = vals.map((v, i) => [v, i] as [number | null, number]).filter((x) => x[0] != null).pop();
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
          <View style={[s.sw, { backgroundColor: col[kk], opacity: kk === 'win' ? 0.25 : 1 }]} />
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
        <Text style={{ fontFamily: font.bodySemi, color: c.accentText }}>Show the numbers</Text>
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

export function EmptyChart({ text }: { text: string }) {
  const c = useTheme();
  return (
    <View style={[s.empty, { backgroundColor: c.surface2 }]}>
      <T v="small" tone="muted" style={{ textAlign: 'center' }}>
        {text}
      </T>
    </View>
  );
}

const s = StyleSheet.create({
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  li: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sw: { width: 12, height: 12, borderRadius: 3 },
  tv: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 40 },
  table: { borderTopWidth: 1 },
  tr: { flexDirection: 'row', borderBottomWidth: 1, paddingVertical: 6 },
  th: { flex: 1, fontFamily: font.bodySemi, fontSize: 12.5 },
  td: { flex: 1, fontFamily: font.body, fontSize: 13.5, fontVariant: ['tabular-nums'] },
  empty: { padding: 18, borderRadius: 14 },
});
