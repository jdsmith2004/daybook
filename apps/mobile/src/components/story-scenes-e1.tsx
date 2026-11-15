/* Scenes for lessons told as a story (see story-kit.tsx), part of story-scenes-e.tsx: lesson 12, the workers in the vineyard. */
import { useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { Easing } from 'react-native';
import { Circle, ClipPath, Defs, Ellipse, G, Line, Path, Rect } from 'react-native-svg';

import { useAppear, useReducedMotion } from '@/lib/motion';

import { Cloud, Frame, type Ink, Person, Say } from './story-kit';

const GOLD = '#FFD25A';
const GOLD_EDGE = '#E0A526';
const SUN_LOW = '#FF9A3C';
const LEAF = '#6BAA6B';

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

/* a gold coin, with a soft glow when it should shine */
function Coin({ x, y, r = 6, glow = false }: { x: number; y: number; r?: number; glow?: boolean }) {
  return (
    <G>
      {glow ? <Circle cx={x} cy={y} r={r * 2} fill={GOLD} opacity={0.35} /> : null}
      <Circle cx={x} cy={y} r={r} fill={GOLD} stroke={GOLD_EDGE} strokeWidth={1.4} />
      <Circle cx={x} cy={y} r={r * 0.55} fill="none" stroke={GOLD_EDGE} strokeWidth={1} />
    </G>
  );
}

/* a small four-point glint */
function Glint({ x, y, s }: { x: number; y: number; s: number }) {
  const q = s * 0.25;
  const d = `M${x} ${y - s} L${x + q} ${y - q} L${x + s} ${y} L${x + q} ${y + q} L${x} ${y + s} L${x - q} ${y + q} L${x - s} ${y} L${x - q} ${y - q} Z`;
  return <Path d={d} fill={GOLD} stroke={GOLD_EDGE} strokeWidth={0.8} strokeLinejoin="round" />;
}

/* short rays around a point, between two angles in degrees (0 is right, -90 is up) */
function Rays({
  x,
  y,
  r1,
  r2,
  from,
  to,
  n,
  stroke,
  w = 2.4,
}: {
  x: number;
  y: number;
  r1: number;
  r2: number;
  from: number;
  to: number;
  n: number;
  stroke: string;
  w?: number;
}) {
  return (
    <G>
      {Array.from({ length: n }, (_, i) => {
        const a = ((from + ((to - from) * i) / Math.max(1, n - 1)) * Math.PI) / 180;
        return (
          <Line
            key={i}
            x1={x + r1 * Math.cos(a)}
            y1={y + r1 * Math.sin(a)}
            x2={x + r2 * Math.cos(a)}
            y2={y + r2 * Math.sin(a)}
            stroke={stroke}
            strokeWidth={w}
            strokeLinecap="round"
          />
        );
      })}
    </G>
  );
}

/* a sun with a soft glow and rays; give it a clip (the sky above the hill) and a low sun is cut by the horizon */
function Sun({ x, y, r, fill, glow = GOLD, clip }: { x: number; y: number; r: number; fill: string; glow?: string; clip?: string }) {
  return (
    <G clipPath={clip ? `url(#${clip})` : undefined}>
      <Circle cx={x} cy={y} r={r * 1.9} fill={glow} opacity={0.25} />
      <Circle cx={x} cy={y} r={r * 1.35} fill={glow} opacity={0.3} />
      <Circle cx={x} cy={y} r={r} fill={fill} />
      <Rays x={x} y={y} r1={r * 1.55} r2={r * 2.1} from={-180} to={0} n={7} stroke={fill} w={2.4} />
    </G>
  );
}

/* the sky above a hill's top edge, to cut a low sun by */
function SkyClip({ id, top }: { id: string; top: string }) {
  return (
    <Defs>
      <ClipPath id={id}>
        <Path d={`${top} L300 0 L0 0 Z`} />
      </ClipPath>
    </Defs>
  );
}
/* a gentle hill: its top edge, then a soft curve underneath that stays clear of the caption */
function Hill({ top, bottom = 176, k }: { top: string; bottom?: number; k: Ink }) {
  return <Path d={`${top} L300 ${bottom - 6} Q150 ${bottom + 6} 0 ${bottom - 6} Z`} fill={k.soft} opacity={0.4} />;
}

/* a row of vines: short stems with small green leaves along a gentle curve */
function Vines({ x0, y0, x1, y1, bend = -6, n, r = 2.6, k }: { x0: number; y0: number; x1: number; y1: number; bend?: number; n: number; r?: number; k: Ink }) {
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2 + bend;
  return (
    <G>
      {Array.from({ length: n }, (_, i) => {
        const t = n === 1 ? 0.5 : i / (n - 1);
        const u = 1 - t;
        const px = u * u * x0 + 2 * u * t * cx + t * t * x1;
        const py = u * u * y0 + 2 * u * t * cy + t * t * y1;
        return (
          <G key={i}>
            <Line x1={px} y1={py + 6} x2={px} y2={py} stroke={k.line} strokeWidth={1.4} strokeLinecap="round" />
            <Circle cx={px - 1.5} cy={py - 1} r={r} fill={LEAF} opacity={0.8} />
            <Circle cx={px + 2} cy={py - 3} r={r * 0.8} fill={LEAF} opacity={0.8} />
          </G>
        );
      })}
    </G>
  );
}

/* a person placed by the feet: scaled, optionally turned to face left, optionally leaning; children are drawn in the person's own units */
function Fig({
  x,
  y,
  s = 1,
  fill,
  face,
  flip = false,
  tilt = 0,
  children,
}: {
  x: number;
  y: number;
  s?: number;
  fill: string;
  face?: string;
  flip?: boolean;
  tilt?: number;
  children?: ReactNode;
}) {
  return (
    <G transform={`translate(${x} ${y}) rotate(${tilt}) scale(${flip ? -1 : 1} 1)`}>
      <G transform={`scale(${s})`}>
        <Person x={0} y={0} s={1} fill={fill} face={face} />
        {children}
      </G>
    </G>
  );
}
/* an arm, in a person's own units */
const Arm = ({ x2, y2, fill }: { x2: number; y2: number; fill: string }) => (
  <Line x1={12} y1={-26} x2={x2} y2={y2} stroke={fill} strokeWidth={5} strokeLinecap="round" />
);
/* a person holding one coin out to the side */
function Holder({
  x,
  y,
  s = 1,
  fill,
  face,
  flip = false,
  coin = 5,
  glow = false,
}: {
  x: number;
  y: number;
  s?: number;
  fill: string;
  face?: string;
  flip?: boolean;
  coin?: number;
  glow?: boolean;
}) {
  return (
    <Fig x={x} y={y} s={s} fill={fill} face={face} flip={flip}>
      <Arm x2={21} y2={-36} fill={fill} />
      <Coin x={22} y={-42} r={coin} glow={glow} />
    </Fig>
  );
}

/* ---------- 1: first light, the owner hires ---------- */
const DAWN_TOP = 'M0 122 Q60 108 140 100 Q220 92 300 108';
function DawnHire({ k }: { k: Ink }) {
  return (
    <Frame label="A market square at first light. The vineyard owner holds up one gold coin to three workers; vines on a hill and a low sun behind them.">
      <SkyClip id="e1dawn" top={DAWN_TOP} />
      <Sun x={28} y={116} r={16} fill={SUN_LOW} clip="e1dawn" />
      <Hill top={DAWN_TOP} k={k} />
      <Vines x0={96} y0={112} x1={292} y1={122} n={22} k={k} />
      <Vines x0={96} y0={124} x1={292} y1={134} n={22} k={k} />
      <Vines x0={96} y0={136} x1={292} y1={146} n={22} k={k} />
      <Fig x={62} y={170} s={1.05} fill={k.ink} face={k.bg} />
      <Fig x={102} y={170} s={1.05} fill={k.ink} face={k.bg} />
      <Fig x={142} y={170} s={1.05} fill={k.ink} face={k.bg} />
      <Fig x={224} y={170} s={1.25} fill={k.acc} face={k.bg} flip>
        <Arm x2={22} y2={-40} fill={k.acc} />
        <Coin x={24} y={-47} r={5} />
      </Fig>
      <Glint x={202} y={98} s={5} />
      <Say x={150} y={192} s="One coin for the day" fill={k.ink} />
    </Frame>
  );
}

/* ---------- 2: the sun crosses the sky, the vineyard fills ---------- */
function SunHours({ k }: { k: Ink }) {
  const p = useGrow(350, 1800);
  const cx = 150;
  const hy = 78;
  const at = (th: number) => ({ x: cx + 120 * Math.cos(th), y: hy - 60 * Math.sin(th) });
  const stops = [Math.PI, 0.78 * Math.PI, 0.5 * Math.PI, 0.22 * Math.PI].map(at);
  const now = at(Math.PI * (1 - 0.96 * p));
  const counts = [1, 2, 2, 3, 4, 4];
  const rowY = [100, 120, 140, 160];
  return (
    <Frame label="The sun crosses the sky and sinks low on the right. In the vineyard below, more and more workers fill the rows, and two people still stand alone on bare ground while the owner beckons them.">
      <Hill top="M0 82 Q150 70 300 82" k={k} />
      {rowY.map((y, i) => (
        <Vines key={i} x0={8} y0={y} x1={200} y1={y} bend={-3} n={26} k={k} />
      ))}
      <Ellipse cx={246} cy={156} rx={8} ry={2.2} fill={k.line} opacity={0.5} />
      <Ellipse cx={278} cy={164} rx={6} ry={2} fill={k.line} opacity={0.5} />
      <Path
        d={`M${cx - 120} ${hy} A120 60 0 0 1 ${cx + 120} ${hy}`}
        fill="none"
        stroke={k.line}
        strokeWidth={1.6}
        strokeDasharray="2 5"
        strokeLinecap="round"
      />
      {stops.map((s, i) => (
        <Circle key={i} cx={s.x} cy={s.y} r={3.5} fill={GOLD} opacity={0.6} />
      ))}
      <Circle cx={now.x} cy={now.y} r={22} fill={SUN_LOW} opacity={0.2 * p} />
      <Circle cx={now.x} cy={now.y} r={11} fill={GOLD} />
      <Circle cx={now.x} cy={now.y} r={11} fill={SUN_LOW} opacity={p * p} />
      {counts.map((n, c) => {
        const op = clamp01((p - 0.1 - c * 0.15) * 6);
        return (
          <G key={c} opacity={op}>
            {Array.from({ length: n }, (_, j) => (
              <Fig key={j} x={22 + c * 32} y={rowY[3 - j] + 6} s={0.34} fill={k.ink} face={k.bg} />
            ))}
          </G>
        );
      })}
      <Fig x={214} y={150} s={0.55} fill={k.acc} face={k.bg}>
        <Arm x2={26} y2={-38} fill={k.acc} />
        <Path d="M33 -50 Q40 -46 38 -39" fill="none" stroke={k.acc} strokeWidth={2.4} strokeLinecap="round" />
        <Path d="M38 -56 Q47 -50 44 -41" fill="none" stroke={k.acc} strokeWidth={2.4} strokeLinecap="round" />
      </Fig>
      <Fig x={250} y={150} s={0.5} fill={k.ink} face={k.bg} flip />
      <Fig x={276} y={150} s={0.5} fill={k.ink} face={k.bg} flip />
      <Say x={150} y={192} s="One hour of light left" fill={k.ink} />
    </Frame>
  );
}

/* ---------- 3: evening, the last hired are paid first ---------- */
const EVE_TOP = 'M0 128 Q80 112 170 124 Q240 132 300 120';
function CoinLast({ k }: { k: Ink }) {
  const line = [184, 152, 120, 88, 62];
  return (
    <Frame label="Evening, a low warm sun and vines behind. A steward at a small table hands a full gold coin to the first person in a long line. The two people at the front, hired last, are paid first.">
      <SkyClip id="e1eve" top={EVE_TOP} />
      <Sun x={22} y={126} r={12} fill={SUN_LOW} clip="e1eve" />
      <Hill top={EVE_TOP} k={k} />
      <Vines x0={8} y0={134} x1={296} y1={132} bend={-3} n={44} k={k} />
      <Vines x0={8} y0={146} x1={296} y1={144} bend={-3} n={44} k={k} />
      <Rect x={204} y={142} width={40} height={5} rx={2} fill={k.muted} />
      <Rect x={208} y={147} width={4} height={19} rx={1.5} fill={k.muted} />
      <Rect x={236} y={147} width={4} height={19} rx={1.5} fill={k.muted} />
      {line.map((x, i) => (
        <Fig key={x} x={x} y={166} s={0.88} fill={i < 2 ? k.acc : k.ink} face={k.bg}>
          {i === 0 ? <Arm x2={24} y2={-32} fill={k.acc} /> : null}
        </Fig>
      ))}
      <Fig x={270} y={166} s={1} fill={k.ink} face={k.bg} flip>
        <Arm x2={40} y2={-36} fill={k.ink} />
      </Fig>
      <Rays x={222} y={128} r1={11} r2={16} from={-160} to={-20} n={6} stroke={GOLD_EDGE} w={2} />
      <Coin x={222} y={128} r={7} glow />
      <Say x={150} y={190} s="A full day's coin" fill={k.ink} />
    </Frame>
  );
}

/* ---------- 4: the grumble ---------- */
function Grumble({ k }: { k: Ink }) {
  return (
    <Frame label="Three workers on the left each hold one gold coin and grumble. Two workers on the right hold the very same coin. A dashed line runs from the grumblers to the others' coins.">
      <Line x1={10} y1={152} x2={290} y2={152} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      <Cloud x={34} y={16} w={88} h={34} fill={k.soft} />
      <Path
        d="M46 38 L54 26 L62 44 L70 26 L78 44 L86 26 L94 44 L102 30 L110 38"
        fill="none"
        stroke={k.ink}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Holder x={36} y={150} s={0.95} fill={k.ink} face={k.bg} />
      <Holder x={78} y={150} s={0.95} fill={k.ink} face={k.bg} />
      <Holder x={120} y={150} s={0.95} fill={k.ink} face={k.bg} />
      <Holder x={220} y={150} s={0.95} fill={k.acc} face={k.bg} flip />
      <Holder x={262} y={150} s={0.95} fill={k.acc} face={k.bg} flip />
      <Path d="M128 96 Q160 80 192 103" fill="none" stroke={k.muted} strokeWidth={2} strokeDasharray="4 4" strokeLinecap="round" />
      <Say x={150} y={184} s="The same coin" fill={k.ink} />
    </Frame>
  );
}

/* ---------- 5: one worker walks off ---------- */
const WALK_TOP = 'M0 128 Q70 96 170 118 Q240 132 300 124';
function WalkOff({ k }: { k: Ink }) {
  return (
    <Frame label="One worker walks away to the right with his back turned, a small dark cloud over his head. Behind him a gold coin lies dropped on the ground; the vineyard and a low sun are behind.">
      <SkyClip id="e1walk" top={WALK_TOP} />
      <Sun x={44} y={112} r={16} fill={SUN_LOW} clip="e1walk" />
      <Hill top={WALK_TOP} k={k} />
      <Vines x0={8} y0={132} x1={166} y1={134} n={20} k={k} />
      <Vines x0={8} y0={144} x1={166} y1={146} n={20} k={k} />
      <Ellipse cx={214} cy={169} rx={18} ry={3} fill={k.line} opacity={0.6} />
      <Ellipse cx={136} cy={172} rx={10} ry={2.4} fill={k.line} opacity={0.6} />
      <Coin x={136} y={163} r={8} glow />
      <Line x1={118} y1={150} x2={123} y2={155} stroke={GOLD_EDGE} strokeWidth={2.4} strokeLinecap="round" />
      <Line x1={154} y1={150} x2={149} y2={155} stroke={GOLD_EDGE} strokeWidth={2.4} strokeLinecap="round" />
      <Fig x={214} y={168} s={1.15} fill={k.ink} tilt={6} />
      <Line x1={176} y1={140} x2={188} y2={140} stroke={k.muted} strokeWidth={2} strokeLinecap="round" />
      <Line x1={172} y1={150} x2={184} y2={150} stroke={k.muted} strokeWidth={2} strokeLinecap="round" />
      <G opacity={0.9}>
        <Rect x={193} y={64} width={42} height={12} rx={6} fill={k.muted} />
        <Circle cx={206} cy={62} r={10} fill={k.muted} />
        <Circle cx={221} cy={57} r={12} fill={k.muted} />
      </G>
      <Say x={150} y={192} s="Walked off with nothing" fill={k.ink} />
    </Frame>
  );
}

/* ---------- 6: evening in the field ---------- */
const FIELD_TOP = 'M0 112 Q60 98 140 108 Q220 118 300 106';
function EveningField({ k }: { k: Ink }) {
  const back = [
    { x: 110, fill: k.ink, flip: false },
    { x: 175, fill: k.acc, flip: true },
    { x: 240, fill: k.ink, flip: false },
  ];
  const front = [
    { x: 75, fill: k.ink, flip: true },
    { x: 145, fill: k.ink, flip: false },
    { x: 210, fill: k.acc, flip: true },
  ];
  return (
    <Frame label="The vineyard at evening under a warm low sun. Six workers stand among the vines, each holding a small glowing gold coin.">
      <SkyClip id="e1field" top={FIELD_TOP} />
      <Sun x={44} y={104} r={20} fill={SUN_LOW} clip="e1field" />
      <Hill top={FIELD_TOP} k={k} />
      <Vines x0={4} y0={122} x1={296} y1={118} n={44} k={k} />
      <Vines x0={4} y0={138} x1={296} y1={134} n={44} k={k} />
      <Vines x0={4} y0={154} x1={296} y1={150} n={44} k={k} />
      {back.map((w) => (
        <Holder key={w.x} x={w.x} y={142} s={0.78} fill={w.fill} face={k.bg} flip={w.flip} coin={5.5} glow />
      ))}
      {front.map((w) => (
        <Holder key={w.x} x={w.x} y={168} s={0.95} fill={w.fill} face={k.bg} flip={w.flip} coin={5} glow />
      ))}
      <Say x={150} y={192} s="Still in the field" fill={k.ink} />
    </Frame>
  );
}

/* ---------- 7: the direction over months ---------- */
function Trend({ k }: { k: Ink }) {
  const p = useGrow(300, 1800);
  const dips = [
    { c: 3, w: 1.5, d: 30 },
    { c: 6, w: 1, d: 17 },
    { c: 8.5, w: 0.7, d: 8 },
  ];
  const yAt = (m: number) => {
    let y = 140 - 9.2 * m;
    for (const t of dips) y += t.d * Math.max(0, 1 - Math.abs(m - t.c) / t.w);
    return y;
  };
  const xAt = (m: number) => 28 + 22 * m;
  const pts: string[] = [];
  for (let i = 0; i <= 44; i++) {
    const m = i / 4;
    pts.push(`${xAt(m).toFixed(1)} ${yAt(m).toFixed(1)}`);
  }
  const line = `M${pts.join(' L')}`;
  const pm = 10.2;
  return (
    <Frame label="A line rising over twelve months with three small dips on the way up, each smaller and shorter than the last. A small person walks on the line near the right end.">
      <Defs>
        <ClipPath id="e1trend">
          <Rect x={0} y={0} width={300 * p} height={200} />
        </ClipPath>
      </Defs>
      <Line x1={18} y1={160} x2={282} y2={160} stroke={k.line} strokeWidth={2} strokeLinecap="round" />
      {Array.from({ length: 12 }, (_, i) => (
        <Line key={i} x1={xAt(i)} y1={160} x2={xAt(i)} y2={167} stroke={k.line} strokeWidth={2} strokeLinecap="round" />
      ))}
      <G clipPath="url(#e1trend)">
        <Path d={line} fill="none" stroke={k.acc} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
        {dips.map((t) => (
          <Circle key={t.c} cx={xAt(t.c)} cy={yAt(t.c)} r={2.6} fill={k.muted} />
        ))}
      </G>
      <G opacity={clamp01((p - 0.85) * 7)}>
        <Fig x={xAt(pm)} y={yAt(pm)} s={0.55} fill={k.ink} face={k.bg} />
      </G>
      <Say x={150} y={192} s="The direction over months" fill={k.ink} />
    </Frame>
  );
}

/* ---------- 8: not too late ---------- */
const LAST_TOP = 'M0 112 Q150 104 300 112';
function LastHour({ k }: { k: Ink }) {
  const posts = [114, 130, 146, 226, 242, 258, 274, 290];
  return (
    <Frame label="Dusk, the sun half below the horizon. An empty square on the left; two people step through an open gate into the vineyard while the owner at the gate waves them in.">
      <SkyClip id="e1last" top={LAST_TOP} />
      <Sun x={60} y={110} r={22} fill={SUN_LOW} clip="e1last" />
      <Hill top={LAST_TOP} k={k} />
      <Ellipse cx={30} cy={160} rx={8} ry={2.5} fill={k.line} opacity={0.5} />
      <Ellipse cx={74} cy={168} rx={6} ry={2} fill={k.line} opacity={0.5} />
      <Ellipse cx={108} cy={156} rx={7} ry={2.2} fill={k.line} opacity={0.5} />
      <Vines x0={112} y0={116} x1={296} y1={116} bend={-3} n={26} k={k} />
      <Vines x0={112} y0={124} x1={296} y1={124} bend={-3} n={26} k={k} />
      <Vines x0={112} y0={131} x1={296} y1={131} bend={-3} n={26} k={k} />
      <Line x1={112} y1={144} x2={160} y2={144} stroke={k.muted} strokeWidth={2} />
      <Line x1={112} y1={150} x2={160} y2={150} stroke={k.muted} strokeWidth={2} />
      <Line x1={212} y1={144} x2={296} y2={144} stroke={k.muted} strokeWidth={2} />
      <Line x1={212} y1={150} x2={296} y2={150} stroke={k.muted} strokeWidth={2} />
      {posts.map((x) => (
        <Rect key={x} x={x - 2} y={138} width={4} height={16} rx={1.5} fill={k.muted} />
      ))}
      <Rect x={158} y={134} width={5} height={20} rx={2} fill={k.muted} />
      <Rect x={210} y={134} width={5} height={20} rx={2} fill={k.muted} />
      <Path d="M160 153 L168 156 L168 142 L160 139 Z" fill={k.muted} />
      <Fig x={196} y={150} s={0.85} fill={k.acc} face={k.bg} tilt={5} />
      <Fig x={180} y={162} s={0.95} fill={k.acc} face={k.bg} tilt={5} />
      <Fig x={244} y={152} s={1} fill={k.ink} face={k.bg} flip>
        <Arm x2={24} y2={-46} fill={k.ink} />
        <Path d="M30 -56 Q37 -52 35 -45" fill="none" stroke={k.ink} strokeWidth={2.2} strokeLinecap="round" />
        <Path d="M34 -62 Q43 -56 40 -47" fill="none" stroke={k.ink} strokeWidth={2.2} strokeLinecap="round" />
      </Fig>
      <Say x={150} y={192} s="Not too late" fill={k.ink} />
    </Frame>
  );
}

export const SCENES_E1: Record<string, ComponentType<{ k: Ink }>> = {
  'l12-dawn-hire': DawnHire,
  'l12-sun-hours': SunHours,
  'l12-coin-last': CoinLast,
  'l12-grumble': Grumble,
  'l12-walk-off': WalkOff,
  'l12-evening-field': EveningField,
  'l12-trend': Trend,
  'l12-last-hour': LastHour,
};
