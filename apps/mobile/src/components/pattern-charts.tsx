/* Your pattern's graphs (core: pattern.ts). Each answers one question at a glance, in the Journal's two outcome colors
   (teal: rode it out, amber: slipped) and violet for the hard hours:
   - Gaps: a bar for the no-slip days before each slip, the stretch going now as an open bar, and a trend line
   - RideWeeks: each week as one column, the share ridden out in teal
   - Clock: a 24-hour clock, midnight at the top, a wedge for each hour, the hard hours as a violet band
   - WeekRow: the days of the week, Monday first, the hardest one marked
   - DiffDots: slip days against days with no slip, as two dots on one line
   They grow in once, and with Reduce Motion on they are simply there. */
import type { PatDiff, PatGaps, PatHour, PatWeek, PatWhen, RiskWindow } from '@daybook/core';
import { useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';

import { useChartColors } from '@/components/charts';
import { useOnce } from '@/components/talk-art';
import { NATIVE } from '@/lib/motion';
import { font } from '@/lib/theme';

function useWidth(): [number, (e: { nativeEvent: { layout: { width: number } } }) => void] {
  const [w, setW] = useState(0);
  return [w, (e) => setW(Math.round(e.nativeEvent.layout.width))];
}

/** a column that rises from the floor */
function Rise({ h, w, delay, children, style }: { h: number; w: number; delay: number; children: React.ReactNode; style?: object }) {
  const v = useOnce(delay, 650, NATIVE, Easing.out(Easing.cubic));
  return (
    <View style={[{ width: w, height: h, overflow: 'hidden', borderRadius: Math.min(8, w / 2) }, style]}>
      <Animated.View style={{ flex: 1, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [h, 0] }) }] }}>{children}</Animated.View>
    </View>
  );
}

/* ---------- the stretches between slips ---------- */
export function Gaps({ g }: { g: PatGaps }) {
  const k = useChartColors();
  const [w, onLayout] = useWidth();
  const H = 120;
  const vals = g.runs.concat(g.slips ? [g.now] : []);
  const max = Math.max(1, ...vals);
  const n = vals.length;
  const gap = n > 8 ? 6 : 10;
  const bw = w ? Math.min(34, (w - gap * (n - 1)) / Math.max(n, 1)) : 0;
  const total = n * bw + (n - 1) * gap;
  const x0 = (w - total) / 2;
  const X = (i: number) => x0 + i * (bw + gap) + bw / 2;
  const Y = (v: number) => 18 + H - (v / max) * H;
  /* the trend: a straight line fit through the gaps between slips (not the first stretch, not the open one) */
  let trend: [number, number, number, number] | null = null;
  if (g.trend && g.runs.length >= 4) {
    const pts = g.runs.slice(1).map((v, i) => [i + 1, v]);
    const mx = pts.reduce((a, p) => a + p[0], 0) / pts.length;
    const my = pts.reduce((a, p) => a + p[1], 0) / pts.length;
    const b =
      pts.reduce((a, p) => a + (p[0] - mx) * (p[1] - my), 0) /
      Math.max(
        1e-9,
        pts.reduce((a, p) => a + (p[0] - mx) ** 2, 0),
      );
    const at = (i: number) => Math.max(0, my + b * (i - mx));
    const i1 = g.runs.length - 1;
    trend = [X(1), Y(at(1)), X(i1), Y(at(i1))];
  }
  return (
    <View
      onLayout={onLayout}
      style={{ height: H + 44 }}
      accessible
      accessibilityRole="image"
      accessibilityLabel={'No-slip days before each slip, oldest first: ' + g.runs.join(', ') + (g.slips ? '. Now: ' + g.now : '')}>
      {w
        ? vals.map((v, i) => {
            const open = g.slips > 0 && i === n - 1;
            const h = Math.max(5, (v / max) * H);
            return (
              <View key={i} style={[s.abs, { left: X(i) - bw / 2, top: 18 + H - h - 18, width: bw, alignItems: 'center' }]}>
                <Text style={[s.n, { color: open ? k.acc : k.ax }]}>{v}</Text>
                {open ? (
                  <View style={[s.open, { width: bw, height: h, borderColor: k.acc, backgroundColor: k.c.accentSoft }]} />
                ) : (
                  <Rise h={h} w={bw} delay={120 + i * 70}>
                    <View style={{ flex: 1, backgroundColor: k.rode }} />
                  </Rise>
                )}
                {open ? <Text style={[s.now, { color: k.acc }]}>now</Text> : null}
              </View>
            );
          })
        : null}
      {w && trend ? (
        <Svg width={w} height={H + 44} style={StyleSheet.absoluteFill} pointerEvents="none">
          <Line x1={trend[0]} y1={trend[1]} x2={trend[2]} y2={trend[3]} stroke={k.acc} strokeWidth={3} strokeDasharray="6 6" strokeLinecap="round" />
        </Svg>
      ) : null}
    </View>
  );
}

/* ---------- ridden out, week by week ---------- */
export function RideWeeks({ weeks }: { weeks: PatWeek[] }) {
  const k = useChartColors();
  const [w, onLayout] = useWidth();
  const H = 96;
  const n = weeks.length;
  const gap = n > 10 ? 5 : 8;
  const bw = w ? Math.min(30, (w - gap * (n - 1)) / Math.max(n, 1)) : 0;
  return (
    <View onLayout={onLayout} style={{ gap: 6 }}>
      <View style={[s.row, { height: H, gap }]}>
        {w
          ? weeks.map((x, i) => {
              const t = x.rode + x.slipped;
              if (!t) return <View key={i} style={[s.empty, { width: bw, height: 8, borderColor: k.grid }]} />;
              return (
                <Rise key={i} h={H} w={bw} delay={100 + i * 55}>
                  <View style={{ flex: x.slipped, backgroundColor: k.slip }} />
                  <View style={{ flex: x.rode, backgroundColor: k.rode }} />
                </Rise>
              );
            })
          : null}
      </View>
      <View style={s.between}>
        <Text style={[s.ax, { color: k.ax }]}>{n > 1 ? n + ' weeks ago' : ''}</Text>
        <Text style={[s.ax, { color: k.ax }]}>this week</Text>
      </View>
    </View>
  );
}

/* ---------- the 24-hour clock ---------- */
const TAU = Math.PI * 2;
const pol = (cx: number, cy: number, r: number, a: number) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
/** a ring sector between two radii and two angles */
function sector(cx: number, cy: number, r0: number, r1: number, a0: number, a1: number) {
  const [x0, y0] = pol(cx, cy, r1, a0);
  const [x1, y1] = pol(cx, cy, r1, a1);
  const [x2, y2] = pol(cx, cy, r0, a1);
  const [x3, y3] = pol(cx, cy, r0, a0);
  const big = a1 - a0 > Math.PI ? 1 : 0;
  const f = (v: number) => v.toFixed(1);
  return `M${f(x0)} ${f(y0)}A${r1} ${r1} 0 ${big} 1 ${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}A${r0} ${r0} 0 ${big} 0 ${f(x3)} ${f(y3)}Z`;
}
const ang = (h: number) => (h / 24) * TAU - Math.PI / 2;
export function Clock({ hours, hard }: { hours: PatHour[]; hard: PatWhen['hard'] }) {
  const k = useChartColors();
  const [w, onLayout] = useWidth();
  const v = useOnce(100, 900, NATIVE, Easing.out(Easing.cubic));
  const D = Math.min(w, 300);
  const cx = D / 2;
  const cy = D / 2;
  const R = D / 2 - 46;
  const r0 = R * 0.38;
  const max = Math.max(1, ...hours.map((x) => x.rode + x.slipped));
  const top = hours.slice().sort((a, b) => b.rode + b.slipped - (a.rode + a.slipped))[0];
  const band = (win: RiskWindow, color: string, r: number) => <Path d={sector(cx, cy, r, r + 7, ang(win.start), ang(win.start + 2))} fill={color} />;
  const lbl = (h: number, t: string) => {
    const [x, y] = pol(cx, cy, R + 16, ang(h));
    return (
      <SvgText key={h} x={x} y={y + 4} fontSize={11.5} fill={k.ax} textAnchor={h === 6 ? 'start' : h === 18 ? 'end' : 'middle'} fontFamily={font.bodySemi}>
        {t}
      </SvgText>
    );
  };
  return (
    <View onLayout={onLayout} style={{ alignItems: 'center' }}>
      {w ? (
        <Animated.View
          style={{
            opacity: v,
            transform: [
              { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) },
              { rotate: v.interpolate({ inputRange: [0, 1], outputRange: ['-25deg', '0deg'] }) },
            ],
          }}>
          <Svg width={D} height={D}>
            <Circle cx={cx} cy={cy} r={R} stroke={k.grid} strokeWidth={1} fill="none" />
            <Circle cx={cx} cy={cy} r={r0} stroke={k.grid} strokeWidth={1} fill="none" />
            {hard.weekdays ? band(hard.weekdays, k.acc, R + 3) : null}
            {hard.weekends ? band(hard.weekends, k.c.violet, R + 3) : null}
            {hours.map((x) => {
              if (!x.rode) return null;
              const span = R - r0 - 2;
              return <Path key={x.h} d={sector(cx, cy, r0 + 1, r0 + 1 + (x.rode / max) * span, ang(x.h) + 0.02, ang(x.h + 1) - 0.02)} fill={k.rode} />;
            })}
            {hours.map((x) => {
              if (!x.slipped) return null;
              const a0 = ang(x.h) + 0.02;
              const a1 = ang(x.h + 1) - 0.02;
              const span = R - r0 - 2;
              const r1 = r0 + 1 + (x.rode / max) * span;
              return <Path key={'s' + x.h} d={sector(cx, cy, r1, r1 + (x.slipped / max) * span, a0, a1)} fill={k.slip} />;
            })}
            {lbl(0, '12 AM')}
            {lbl(6, '6 AM')}
            {lbl(12, '12 PM')}
            {lbl(18, '6 PM')}
            {top && top.rode + top.slipped ? (
              <>
                <SvgText x={cx} y={cy - 4} fontSize={11} fill={k.ax} textAnchor="middle" fontFamily={font.bodySemi}>
                  MOST AT
                </SvgText>
                <SvgText x={cx} y={cy + 16} fontSize={18} fill={k.c.ink} textAnchor="middle" fontFamily={font.display}>
                  {(top.h % 12 || 12) + (top.h < 12 ? ' AM' : ' PM')}
                </SvgText>
              </>
            ) : null}
          </Svg>
        </Animated.View>
      ) : (
        <View style={{ height: 300 }} />
      )}
    </View>
  );
}

/* ---------- the days of the week ---------- */
export function WeekRow({ week, hard }: { week: PatWhen['week']; hard: number | null }) {
  const k = useChartColors();
  const H = 70;
  const order = [1, 2, 3, 4, 5, 6, 0];
  const max = Math.max(1, ...week.map((x) => x.rode + x.slipped));
  return (
    <View style={[s.row, { gap: 8, justifyContent: 'space-between' }]}>
      {order.map((d, i) => {
        const x = week[d];
        const t = x.rode + x.slipped;
        const h = Math.max(4, (t / max) * H);
        const on = hard === d;
        return (
          <View key={d} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
            <Text style={[s.n, { color: on ? k.c.ink : k.ax }]}>{t}</Text>
            <View style={{ height: H, justifyContent: 'flex-end' }}>
              {t ? (
                <Rise h={h} w={22} delay={100 + i * 60}>
                  <View style={{ flex: x.slipped, backgroundColor: k.slip }} />
                  <View style={{ flex: x.rode, backgroundColor: k.rode }} />
                </Rise>
              ) : (
                <View style={[s.empty, { width: 22, height: 4, borderColor: k.grid }]} />
              )}
            </View>
            <View style={[s.dayPill, on ? { backgroundColor: k.c.accentSoft } : null]}>
              <Text style={[s.day, { color: on ? k.c.accentText : k.ax, fontFamily: on ? font.bodyBold : font.bodySemi }]}>{x.name.slice(0, 3)}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

/* ---------- slip days against days with no slip ---------- */
export function DiffDots({ list }: { list: PatDiff[] }) {
  const k = useChartColors();
  const [w, onLayout] = useWidth();
  return (
    <View onLayout={onLayout} style={{ gap: 16 }}>
      {list.map((d) => {
        const top = d.unit === 'pct' ? 1 : d.unit === 'h' ? Math.max(10, Math.ceil(Math.max(d.clean, d.slip))) : 10;
        const X = (v: number) => 10 + (v / top) * (w - 20);
        const fmt = (v: number) => (d.unit === 'pct' ? Math.round(v * 100) + '%' : String(Math.round(v * 10) / 10) + (d.unit === 'h' ? ' h' : ''));
        const a = X(d.clean);
        const b = X(d.slip);
        return (
          <View key={d.k} style={{ gap: 6 }} accessible accessibilityLabel={d.line}>
            <Text style={[s.dl, { color: k.c.ink }]}>{d.label}</Text>
            <View style={{ height: 34 }}>
              {w ? (
                <Svg width={w} height={34}>
                  <Line x1={10} y1={12} x2={w - 10} y2={12} stroke={k.grid} strokeWidth={2} strokeLinecap="round" />
                  <Line x1={a} y1={12} x2={b} y2={12} stroke={k.ax} strokeWidth={3} strokeLinecap="round" />
                  <Circle cx={a} cy={12} r={8} fill={k.rode} />
                  <Circle cx={b} cy={12} r={8} fill={k.slip} />
                  <SvgText x={a} y={32} fontSize={11.5} fill={k.rode} textAnchor="middle" fontFamily={font.bodyBold}>
                    {fmt(d.clean)}
                  </SvgText>
                  <SvgText x={b} y={32} fontSize={11.5} fill={k.slip} textAnchor="middle" fontFamily={font.bodyBold}>
                    {fmt(d.slip)}
                  </SvgText>
                </Svg>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  abs: { position: 'absolute' },
  row: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center' },
  between: { flexDirection: 'row', justifyContent: 'space-between' },
  n: { fontFamily: font.bodyBold, fontSize: 12.5, fontVariant: ['tabular-nums'], marginBottom: 4 },
  now: { fontFamily: font.bodyBold, fontSize: 11.5, marginTop: 4 },
  open: { borderWidth: 2, borderStyle: 'dashed', borderRadius: 8 },
  empty: { borderTopWidth: 2, borderStyle: 'dotted' },
  ax: { fontFamily: font.body, fontSize: 11.5 },
  day: { fontSize: 12 },
  dayPill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999 },
  dl: { fontFamily: font.bodySemi, fontSize: 14 },
});
