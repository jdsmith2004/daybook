/* Scenes for lessons told as a story (see story-kit.tsx), part of story-scenes-e.tsx: "Fewer fights, not more willpower". */
import { useEffect, useState, type ComponentType } from 'react';
import { Easing } from 'react-native';
import { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';

import { useAppear, useReducedMotion } from '@/lib/motion';

import { Frame, type Ink, Say } from './story-kit';

const GOLD = '#FFD25A';
const RED = '#C2410C';

/* a number from 0 to 1 that eases up once, after a short pause; with Reduce Motion on it starts at 1 */
function useGrow(delay = 300, dur = 1100) {
  const still = useReducedMotion();
  const v = useAppear(delay, dur, Easing.out(Easing.cubic));
  const [p, setP] = useState(still ? 1 : 0);
  useEffect(() => {
    const id = v.addListener(({ value }) => setP(value));
    return () => v.removeListener(id);
  }, [v]);
  return p;
}
const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

/* a small lightning bolt, for a phone that is charging */
function Bolt({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <Path
      d="M3 -7 L-3 1 L0 1 L-2 8 L4 -1 L1 -1 Z"
      transform={`translate(${x} ${y}) scale(${s})`}
      fill={GOLD}
      stroke={GOLD}
      strokeWidth={0.6}
      strokeLinejoin="round"
    />
  );
}

/* ---------- 1: the phone that beeps ---------- */
function Beeper({ k }: { k: Ink }) {
  const rows = [56, 88, 120];
  return (
    <Frame label="A phone with small vibration marks on both sides. Its screen shows three short questions, each with a question mark.">
      <Path d="M103 56 Q97 85 103 114" fill="none" stroke={k.acc} strokeWidth={3} strokeLinecap="round" />
      <Path d="M92 44 Q83 85 92 126" fill="none" stroke={k.acc} strokeWidth={3} strokeLinecap="round" />
      <Path d="M197 56 Q203 85 197 114" fill="none" stroke={k.acc} strokeWidth={3} strokeLinecap="round" />
      <Path d="M208 44 Q217 85 208 126" fill="none" stroke={k.acc} strokeWidth={3} strokeLinecap="round" />
      <Rect x={112} y={12} width={76} height={148} rx={13} fill={k.ink} />
      <Rect x={118} y={28} width={64} height={122} rx={6} fill={k.bg} />
      <Rect x={140} y={18} width={20} height={4} rx={2} fill={k.bg} />
      {rows.map((c) => (
        <G key={c}>
          <Say x={125} y={c + 6} s="?" fill={k.ink} size={18} anchor="start" />
          <Rect x={144} y={c - 7} width={34} height={4} rx={2} fill={k.ink} />
          <Rect x={144} y={c + 1} width={22} height={4} rx={2} fill={k.ink} />
        </G>
      ))}
      <Say x={150} y={188} s="What do you want right now?" fill={k.ink} />
    </Frame>
  );
}

/* ---------- 2: a day of small moments ---------- */
/* dots scattered along a day, the same every time; a few are a clash */
const MOMENTS = (() => {
  let s = 11;
  const next = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  const n = 36;
  return Array.from({ length: n }, (_, i) => ({
    x: 18 + (i * 264) / (n - 1) + (next() - 0.5) * 5,
    y: 40 + next() * 48,
    clash: next() < 0.26,
  }));
})();

function DayMoments({ k }: { k: Ink }) {
  const p = useGrow(300, 1600);
  const n = MOMENTS.length;
  const base = 130;
  return (
    <Frame label="A line across the scene with four tiny places from a day: a bus, a desk with a laptop, a kitchen cup and a couch with a lamp. Above them many small dots mark moments of wanting, and a few have a red ring around them.">
      <Line x1={10} y1={base} x2={290} y2={base} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      {/* a bus */}
      <Rect x={26} y={base - 22} width={38} height={18} rx={4} fill={k.ink} />
      <Rect x={31} y={base - 18} width={7} height={6} rx={1.5} fill={k.bg} />
      <Rect x={42} y={base - 18} width={7} height={6} rx={1.5} fill={k.bg} />
      <Rect x={53} y={base - 18} width={7} height={6} rx={1.5} fill={k.bg} />
      <Circle cx={36} cy={base - 3} r={4} fill={k.muted} stroke={k.bg} strokeWidth={1.4} />
      <Circle cx={54} cy={base - 3} r={4} fill={k.muted} stroke={k.bg} strokeWidth={1.4} />
      {/* a desk with a laptop */}
      <Rect x={98} y={base - 16} width={40} height={3.5} rx={1.5} fill={k.ink} />
      <Rect x={101} y={base - 13} width={3} height={13} rx={1} fill={k.ink} />
      <Rect x={132} y={base - 13} width={3} height={13} rx={1} fill={k.ink} />
      <Rect x={110} y={base - 31} width={16} height={13} rx={2} fill={k.ink} />
      <Rect x={112.5} y={base - 28.5} width={11} height={8} rx={1} fill={k.bg} />
      <Rect x={107} y={base - 19} width={22} height={3} rx={1.5} fill={k.muted} />
      {/* a kitchen counter with a cup */}
      <Rect x={168} y={base - 16} width={46} height={3.5} rx={1.5} fill={k.ink} />
      <Rect x={171} y={base - 13} width={3} height={13} rx={1} fill={k.ink} />
      <Rect x={208} y={base - 13} width={3} height={13} rx={1} fill={k.ink} />
      <Rect x={185} y={base - 29} width={11} height={13} rx={2.5} fill={k.ink} />
      <Path d={`M196 ${base - 26} Q202 ${base - 26} 202 ${base - 22} Q202 ${base - 19} 196 ${base - 19}`} fill="none" stroke={k.ink} strokeWidth={2} />
      <Path d={`M188 ${base - 33} Q186 ${base - 37} 189 ${base - 40}`} fill="none" stroke={k.muted} strokeWidth={1.6} strokeLinecap="round" />
      <Path d={`M193 ${base - 33} Q191 ${base - 37} 194 ${base - 40}`} fill="none" stroke={k.muted} strokeWidth={1.6} strokeLinecap="round" />
      {/* a couch with a lamp */}
      <Rect x={236} y={base - 24} width={36} height={14} rx={5} fill={k.ink} />
      <Rect x={233} y={base - 16} width={42} height={11} rx={4} fill={k.ink} />
      <Rect x={238} y={base - 5} width={3} height={5} rx={1} fill={k.ink} />
      <Rect x={267} y={base - 5} width={3} height={5} rx={1} fill={k.ink} />
      <Line x1={287} y1={base - 1} x2={287} y2={base - 26} stroke={k.muted} strokeWidth={2.4} strokeLinecap="round" />
      <Path d={`M281 ${base - 26} L284 ${base - 38} L290 ${base - 38} L293 ${base - 26} Z`} fill={GOLD} />
      {/* moments of wanting, some in a clash */}
      {MOMENTS.map((m, i) => {
        const op = clamp01((p * 1.25 - i / n) * 5);
        return (
          <G key={i} opacity={op}>
            <Circle cx={m.x} cy={m.y} r={2.8} fill={k.acc} />
            {m.clash ? <Circle cx={m.x} cy={m.y} r={5.8} fill="none" stroke={RED} strokeWidth={1.8} /> : null}
          </G>
        );
      })}
      <Say x={150} y={188} s="Thousands of small moments" fill={k.ink} />
    </Frame>
  );
}

/* ---------- 3: two weeks of moments, side by side ---------- */
const DOTS = 28;
const dotX = (i: number) => 18 + Math.floor(i / 4) * 41 + (i % 4) * 8;
const TOP_CLASH = new Set([0, 1, 3, 4, 6, 7, 8, 10, 12, 13, 15, 16, 18, 20, 21, 23, 24, 26, 27]);
const BOTTOM_CLASH = new Set([9, 21]);

function DotRow({ y, clash, p, k }: { y: number; clash: Set<number>; p: number; k: Ink }) {
  return (
    <G>
      <Line x1={12} y1={y} x2={288} y2={y} stroke={k.line} strokeWidth={1.4} strokeLinecap="round" opacity={0.5} />
      {Array.from({ length: DOTS }, (_, i) => {
        const op = clamp01(p * (DOTS + 5) - i);
        return <Circle key={i} cx={dotX(i)} cy={y} r={3.5 * (0.5 + 0.5 * op)} fill={clash.has(i) ? RED : k.muted} opacity={op} />;
      })}
    </G>
  );
}

function FewerFights({ k }: { k: Ink }) {
  const p1 = useGrow(300, 1500);
  const p2 = useGrow(1100, 1500);
  return (
    <Frame label="Two rows of small dots, each a week of moments. The top row, most people, has many dots in red for clashes. The bottom row, strong self-control, has the same number of dots but only two red; the rest are calm.">
      <Say x={14} y={52} s="Most people" fill={k.ink} anchor="start" />
      <DotRow y={74} clash={TOP_CLASH} p={p1} k={k} />
      <Say x={14} y={126} s="Strong self-control" fill={k.ink} anchor="start" />
      <DotRow y={148} clash={BOTTOM_CLASH} p={p2} k={k} />
    </Frame>
  );
}

/* ---------- 4: the quiet evening ---------- */
function QuietEvening({ k }: { k: Ink }) {
  return (
    <Frame label="A calm living room at night. A person reads in a chair under a warm small lamp. A window shows a few stars. Through the doorway on the side, in another room, a phone lies charging.">
      <Line x1={10} y1={170} x2={290} y2={170} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      {/* the window and its stars */}
      <Rect x={22} y={30} width={58} height={62} rx={3} fill="none" stroke={k.ink} strokeWidth={2.6} />
      <Line x1={51} y1={30} x2={51} y2={92} stroke={k.ink} strokeWidth={2} />
      <Line x1={22} y1={61} x2={80} y2={61} stroke={k.ink} strokeWidth={2} />
      <Circle cx={34} cy={44} r={1.8} fill={GOLD} />
      <Circle cx={66} cy={40} r={1.5} fill={GOLD} />
      <Circle cx={39} cy={76} r={1.5} fill={GOLD} />
      <Circle cx={63} cy={79} r={1.8} fill={GOLD} />
      {/* the lamp's warm glow, behind everything near it */}
      <Circle cx={172} cy={110} r={52} fill={GOLD} opacity={0.08} />
      <Circle cx={172} cy={110} r={30} fill={GOLD} opacity={0.14} />
      {/* the armchair */}
      <Rect x={94} y={96} width={16} height={50} rx={7} fill={k.muted} />
      <Rect x={94} y={132} width={56} height={14} rx={5} fill={k.muted} />
      <Line x1={100} y1={146} x2={100} y2={168} stroke={k.muted} strokeWidth={3} strokeLinecap="round" />
      <Line x1={144} y1={146} x2={144} y2={168} stroke={k.muted} strokeWidth={3} strokeLinecap="round" />
      {/* the reader */}
      <Rect x={110} y={108} width={24} height={30} rx={10} fill={k.ink} />
      <Circle cx={126} cy={95} r={10} fill={k.ink} />
      <Circle cx={130} cy={94} r={1.7} fill={k.bg} />
      <Line x1={124} y1={136} x2={148} y2={136} stroke={k.ink} strokeWidth={9} strokeLinecap="round" />
      <Line x1={148} y1={137} x2={150} y2={166} stroke={k.ink} strokeWidth={9} strokeLinecap="round" />
      <Line x1={124} y1={118} x2={138} y2={118} stroke={k.ink} strokeWidth={5} strokeLinecap="round" />
      <Path d="M138 110 L152 108 L153 122 L139 124 Z" fill={k.acc} />
      <Line x1={145.5} y1={109} x2={146} y2={123} stroke={k.bg} strokeWidth={1.2} />
      {/* the small lamp */}
      <Ellipse cx={172} cy={168} rx={9} ry={2.6} fill={k.muted} />
      <Line x1={172} y1={167} x2={172} y2={108} stroke={k.muted} strokeWidth={3} strokeLinecap="round" />
      <Path d="M162 108 L166 92 L178 92 L182 108 Z" fill={GOLD} />
      {/* the doorway into another room, where a phone charges */}
      <Path d="M214 168 L214 72 Q214 65 221 65 L274 65 Q281 65 281 72 L281 168 Z" fill={k.soft} opacity={0.22} />
      <Path d="M213 170 L213 72 Q213 64 221 64 L274 64 Q282 64 282 72 L282 170" fill="none" stroke={k.line} strokeWidth={3.5} strokeLinecap="round" />
      <Rect x={224} y={140} width={38} height={3.5} rx={1.5} fill={k.ink} />
      <Rect x={228} y={143} width={3} height={27} rx={1} fill={k.ink} />
      <Rect x={255} y={143} width={3} height={27} rx={1} fill={k.ink} />
      <Rect x={233} y={135} width={18} height={5} rx={2} fill={k.ink} />
      <Rect x={235} y={136.5} width={14} height={2} rx={1} fill={k.bg} />
      <Bolt x={242} y={124} s={1.1} />
      <Rect x={268} y={150} width={7} height={10} rx={1.5} fill={k.muted} />
      <Path d="M251 138 Q266 142 270 152" fill="none" stroke={k.muted} strokeWidth={2} strokeLinecap="round" />
      <Say x={150} y={190} s="Nothing happened" fill={k.ink} />
    </Frame>
  );
}

/* ---------- 5: one fight fewer ---------- */
const STEPS = Array.from({ length: 12 }, (_, i) => ({ x: 82 + i * 17, y: i % 2 === 0 ? 166 : 175 }));

function RemoveFight({ k }: { k: Ink }) {
  const p = useGrow(500, 1500);
  return (
    <Frame label="A kitchen counter with a phone lying on it, plugged into a charger by a cable to the wall. A dashed path of footprints leads away from it across the floor and out of the room to the right.">
      {/* the wall socket and the charging cable */}
      <Rect x={28} y={66} width={10} height={14} rx={2} fill={k.muted} />
      <Path d="M33 80 Q33 94 48 93 L70 92" fill="none" stroke={k.muted} strokeWidth={2.2} strokeLinecap="round" />
      {/* the counter */}
      <Rect x={12} y={100} width={134} height={7} rx={3.5} fill={k.line} />
      <Rect x={18} y={107} width={122} height={49} fill="none" stroke={k.line} strokeWidth={2.4} />
      <Line x1={79} y1={107} x2={79} y2={156} stroke={k.line} strokeWidth={2.4} />
      <Line x1={72} y1={122} x2={72} y2={132} stroke={k.line} strokeWidth={2.4} strokeLinecap="round" />
      <Line x1={86} y1={122} x2={86} y2={132} stroke={k.line} strokeWidth={2.4} strokeLinecap="round" />
      {/* the phone, lying and charging */}
      <Rect x={70} y={90} width={38} height={10} rx={3.5} fill={k.ink} />
      <Rect x={73} y={92.5} width={32} height={5} rx={2} fill={k.bg} />
      <Bolt x={89} y={74} s={1.2} />
      {/* the floor, a door on the right, and the way out */}
      <Line x1={10} y1={156} x2={252} y2={156} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      <Path d="M254 156 L254 62 Q254 56 260 56 L286 56 Q292 56 292 62 L292 156 Z" fill={k.soft} opacity={0.22} />
      <Path d="M254 158 L254 62 Q254 56 260 56 L286 56 Q292 56 292 62 L292 158" fill="none" stroke={k.line} strokeWidth={3.5} strokeLinecap="round" />
      <Path d="M70 170 Q170 172 270 170" fill="none" stroke={k.muted} strokeWidth={1.6} strokeDasharray="4 6" strokeLinecap="round" opacity={0.7} />
      {STEPS.map((s, i) => {
        const op = clamp01(p * (STEPS.length + 3) - i);
        return <Ellipse key={i} cx={s.x} cy={s.y} rx={5} ry={2.6} fill={k.acc} opacity={op * (1 - i * 0.03)} />;
      })}
      <Say x={150} y={192} s="One fight fewer" fill={k.ink} />
    </Frame>
  );
}

export const SCENES_E9: Record<string, ComponentType<{ k: Ink }>> = {
  'l12-beeper': Beeper,
  'l12-day-moments': DayMoments,
  'l12-fewer-fights': FewerFights,
  'l12-quiet-evening': QuietEvening,
  'l12-remove-fight': RemoveFight,
};
