/* Scenes for lessons told as a story (see story-kit.tsx), part of story-scenes-e.tsx: lesson 12, missing a day. Flat shapes in the
   lesson's own colors, 300 by 200, one short line of words at most. */
import { useEffect, useState, type ComponentType } from 'react';
import { Easing } from 'react-native';
import { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';

import { useAppear, useReducedMotion } from '@/lib/motion';

import { Cloud, Frame, type Ink, Person, Say } from './story-kit';

const RED = '#C2410C';
const GOLD = '#FFD25A';
const CHOC = '#7A4A2A';
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

const clamp = (n: number) => Math.max(0, Math.min(1, n));

/* a limb: a thick round-ended line */
function Limb({ a, b, w = 7, c }: { a: [number, number]; b: [number, number]; w?: number; c: string }) {
  return <Line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={c} strokeWidth={w} strokeLinecap="round" />;
}

/* ---------- a path across a field: a curve, footprints along it, tufts of grass ---------- */
type Pt = [number, number];
type Bez = [Pt, Pt, Pt, Pt];

const bezAt = (b: Bez, t: number): Pt => {
  const u = 1 - t;
  return [
    u * u * u * b[0][0] + 3 * u * u * t * b[1][0] + 3 * u * t * t * b[2][0] + t * t * t * b[3][0],
    u * u * u * b[0][1] + 3 * u * u * t * b[1][1] + 3 * u * t * t * b[2][1] + t * t * t * b[3][1],
  ];
};
const bezTan = (b: Bez, t: number): Pt => {
  const u = 1 - t;
  return [
    3 * u * u * (b[1][0] - b[0][0]) + 6 * u * t * (b[2][0] - b[1][0]) + 3 * t * t * (b[3][0] - b[2][0]),
    3 * u * u * (b[1][1] - b[0][1]) + 6 * u * t * (b[2][1] - b[1][1]) + 3 * t * t * (b[3][1] - b[2][1]),
  ];
};
const lerp = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
/* the stretch of the curve from t0 to the end */
const bezRight = (b: Bez, t0: number): Bez => {
  const p01 = lerp(b[0], b[1], t0);
  const p12 = lerp(b[1], b[2], t0);
  const p23 = lerp(b[2], b[3], t0);
  const p123 = lerp(p12, p23, t0);
  const p012 = lerp(p01, p12, t0);
  return [lerp(p012, p123, t0), p123, p23, b[3]];
};
/* the stretch of the curve from the start to t0 */
const bezLeft = (b: Bez, t0: number): Bez => {
  const p01 = lerp(b[0], b[1], t0);
  const p12 = lerp(b[1], b[2], t0);
  const p012 = lerp(p01, p12, t0);
  const p23 = lerp(b[2], b[3], t0);
  const p123 = lerp(p12, p23, t0);
  return [b[0], p01, p012, lerp(p012, p123, t0)];
};
const bezD = (b: Bez) => `M${b[0][0]} ${b[0][1]} C${b[1][0]} ${b[1][1]} ${b[2][0]} ${b[2][1]} ${b[3][0]} ${b[3][1]}`;

/* the path of the big field scenes, and the hill under it */
const PATH: Bez = [
  [14, 158],
  [100, 120],
  [190, 170],
  [288, 128],
];
const HILL = 'M0 140 Q70 96 150 112 Q230 128 300 96 L300 174 L0 174 Z';
const STEPS = Array.from({ length: 16 }, (_, i) => 0.04 + i * 0.06);

/* spots for tufts of grass on the hill; the ones too near the path are left out */
const SPOTS: Pt[] = [
  [24, 134],
  [44, 148],
  [38, 166],
  [70, 150],
  [84, 168],
  [96, 128],
  [118, 162],
  [126, 124],
  [140, 168],
  [160, 128],
  [176, 166],
  [196, 156],
  [206, 130],
  [224, 150],
  [232, 168],
  [250, 124],
  [262, 152],
  [276, 168],
  [286, 148],
  [60, 170],
];
function tuftsAway(b: Bez, spots: Pt[]): Pt[] {
  const samples = Array.from({ length: 48 }, (_, i) => bezAt(b, i / 47));
  return spots.filter(([x, y]) => !samples.some(([sx, sy]) => Math.abs(sx - x) < 10 && sy > y - 15 && sy < y + 8));
}
function Tufts({ at, s = 1, o = 1 }: { at: Pt[]; s?: number; o?: number }) {
  const d = at.map(([x, y]) => `M${x} ${y} l${-3 * s} ${-7 * s} M${x} ${y} l0 ${-9 * s} M${x} ${y} l${3 * s} ${-7 * s}`).join(' ');
  return <Path d={d} fill="none" stroke={LEAF} strokeWidth={1.9} strokeLinecap="round" opacity={o} />;
}

/* one footprint on the path, to the left or right of its middle, pointing along the way */
function Step({ b, t, side, fill, o = 1, s = 1 }: { b: Bez; t: number; side: 1 | -1; fill: string; o?: number; s?: number }) {
  const [x, y] = bezAt(b, t);
  const [tx, ty] = bezTan(b, t);
  const n = Math.hypot(tx, ty) || 1;
  const px = x + (-ty / n) * 3.2 * s * side;
  const py = y + (tx / n) * 3.2 * s * side;
  const deg = (Math.atan2(ty, tx) * 180) / Math.PI + 90;
  return (
    <G transform={`translate(${px} ${py}) rotate(${deg}) scale(${s})`} opacity={o}>
      <Ellipse cx={0} cy={-2.6} rx={2.7} ry={3.6} fill={fill} />
      <Ellipse cx={0} cy={2.9} rx={2.1} ry={1.9} fill={fill} />
    </G>
  );
}

/* ---------- one small thing, every day ---------- */
function PickHabit({ k }: { k: Ink }) {
  const shoe = (x: number) => (
    <G transform={`translate(${x} 150)`}>
      <Path d="M0 0 L0 -15 Q0 -19 5 -19 L13 -19 Q19 -9 30 -9 Q38 -9 38 0 Z" fill={k.ink} />
      <Line x1={1} y1={-4} x2={37} y2={-4} stroke={k.bg} strokeWidth={1.8} strokeLinecap="round" />
      <Line x1={6} y1={-13} x2={11} y2={-10} stroke={k.bg} strokeWidth={1.8} strokeLinecap="round" />
      <Line x1={11} y1={-16} x2={16} y2={-12} stroke={k.bg} strokeWidth={1.8} strokeLinecap="round" />
    </G>
  );
  return (
    <Frame label="Three small habits on a table: an apple, a glass of water and a pair of walking shoes. A tick marks the glass of water as the chosen one. The words say: one small thing, every day.">
      <Line x1={16} y1={150} x2={284} y2={150} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      {/* the apple */}
      <Circle cx={55} cy={135} r={15} fill={RED} />
      <Circle cx={68} cy={135} r={15} fill={RED} />
      <Line x1={62} y1={122} x2={63} y2={113} stroke={CHOC} strokeWidth={2.4} strokeLinecap="round" />
      <Path d="M64 116 Q70 106 80 109 Q76 119 64 116 Z" fill={LEAF} />
      {/* the chosen glass: a soft glow and a tick */}
      <Circle cx={150} cy={126} r={34} fill={GOLD} opacity={0.25} />
      <Path d="M143 82 L148 88 L158 76" fill="none" stroke={k.acc} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M136 108 L164 108 L160 150 L140 150 Z" fill={k.soft} opacity={0.85} stroke={k.line} strokeWidth={2} strokeLinejoin="round" />
      <Path d="M137.7 126 L162.3 126 L160 150 L140 150 Z" fill={k.acc} opacity={0.6} />
      <Line x1={137.7} y1={126} x2={162.3} y2={126} stroke={k.acc} strokeWidth={2.5} strokeLinecap="round" />
      {/* the walking shoes */}
      {shoe(198)}
      {shoe(240)}
      <Say x={150} y={186} s="One small thing, every day" fill={k.ink} />
    </Frame>
  );
}

/* ---------- every day for twelve weeks ---------- */
function DailyLog({ k }: { k: Ink }) {
  const p = useGrow(400, 1500);
  const tick = (cx: number, cy: number, o: number) => (
    <Path
      key={`${cx}-${cy}`}
      d={`M${cx - 4} ${cy} L${cx - 1} ${cy + 3} L${cx + 4} ${cy - 3}`}
      fill="none"
      stroke={k.acc}
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={o}
    />
  );
  const squares: { x: number; y: number; i: number }[] = [];
  for (let r = 0; r < 2; r++) for (let c = 0; c < 7; c++) squares.push({ x: 76 + c * 22, y: 40 + r * 22, i: r * 7 + c });
  const knob = 112 + 58 * p;
  return (
    <Frame label="A laptop showing a simple website: two rows of day squares with a tick in each day done, and a slider under them to say how automatic it felt. The words say: every day for twelve weeks.">
      <Rect x={60} y={20} width={180} height={120} rx={8} fill={k.ink} />
      <Rect x={68} y={28} width={164} height={104} rx={3} fill={k.bg} />
      <Rect x={44} y={140} width={212} height={10} rx={5} fill={k.ink} />
      {squares.map((s) => (
        <G key={s.i}>
          <Rect x={s.x} y={s.y} width={16} height={16} rx={3} fill="none" stroke={k.line} strokeWidth={1.5} />
          {s.i < 12 ? tick(s.x + 8, s.y + 8, clamp(p * 13 - s.i)) : null}
        </G>
      ))}
      <Say x={150} y={96} s="How automatic?" fill={k.ink} size={12} />
      <Line x1={92} y1={113} x2={208} y2={113} stroke={k.line} strokeWidth={4} strokeLinecap="round" />
      <Circle cx={knob} cy={113} r={7} fill={k.acc} />
      <Say x={150} y={186} s="Every day for twelve weeks" fill={k.ink} />
    </Frame>
  );
}

/* ---------- one gap, the same path ---------- */
function WornPath({ k }: { k: Ink }) {
  const p = useGrow(300, 1500);
  const tufts = tuftsAway(PATH, SPOTS);
  return (
    <Frame label="A gentle grassy field with a worn path across it. Footprints run along the path with one pair missing about halfway, and the path itself carries on whole through the gap. The words say: one gap, the same path.">
      <Path d={HILL} fill={k.soft} opacity={0.4} />
      <Tufts at={tufts} />
      <Path d={bezD(PATH)} fill="none" stroke={k.line} strokeWidth={13} strokeLinecap="round" />
      {STEPS.map((t, i) =>
        i === 7 || i === 8 ? (
          <Step key={i} b={PATH} t={t} side={i % 2 ? 1 : -1} fill={k.muted} o={0.3} />
        ) : (
          <Step key={i} b={PATH} t={t} side={i % 2 ? 1 : -1} fill={k.acc} o={clamp(p * 17 - i)} />
        ),
      )}
      <Say x={150} y={190} s="One gap, the same path" fill={k.ink} />
    </Frame>
  );
}

/* ---------- gaps that pile up ---------- */
function TwoMisses({ k }: { k: Ink }) {
  const p = useGrow(400, 1600);
  const from = 0.58;
  const worn = bezLeft(PATH, from);
  const faded = bezRight(PATH, from);
  const tufts = tuftsAway(PATH, SPOTS);
  const over: Pt[] = [];
  for (let t = 0.6; t < 1; t += 0.05) {
    const [x, y] = bezAt(PATH, t);
    over.push([x - 4, y + 4], [x + 4, y + 1]);
  }
  const have = (i: number) => i <= 7 || i === 10 || i === 13;
  return (
    <Frame label="The same field, but now the path has several gaps close together near the right end. Grass grows back over the path there, and it has grown faint. The words say: gaps that pile up.">
      <Path d={HILL} fill={k.soft} opacity={0.4} />
      <Tufts at={tufts} />
      <Path d={bezD(worn)} fill="none" stroke={k.line} strokeWidth={13} strokeLinecap="round" />
      <Path d={bezD(faded)} fill="none" stroke={k.line} strokeWidth={13} strokeLinecap="round" opacity={1 - 0.7 * p} />
      <Tufts at={over} s={1.15} o={p} />
      {STEPS.map((t, i) => (have(i) ? <Step key={i} b={PATH} t={t} side={i % 2 ? 1 : -1} fill={k.acc} o={i > 7 ? 1 - 0.4 * p : 1} /> : null))}
      <Say x={150} y={190} s="Gaps that pile up" fill={k.ink} />
    </Frame>
  );
}

/* ---------- a chain or a path ---------- */
function PathChain({ k }: { k: Ink }) {
  const small: Bez = [
    [166, 134],
    [196, 96],
    [244, 140],
    [286, 108],
  ];
  const links = [0, 1, 3].map((i) => 23 + i * 24);
  const breakX = 23 + 2 * 24;
  const grass = tuftsAway(small, [
    [172, 118],
    [182, 146],
    [212, 112],
    [226, 142],
    [256, 126],
    [270, 140],
  ]);
  return (
    <Frame label="Two pictures side by side. On the left, a chain with one link broken open in the middle: a chain is cut by a single break. On the right, a path across grass with one faint footprint gap but the path whole. The labels say: a chain, a path.">
      <Line x1={150} y1={46} x2={150} y2={150} stroke={k.line} strokeWidth={2} strokeDasharray="4 6" strokeLinecap="round" opacity={0.7} />
      {/* the chain */}
      {links.map((x) => (
        <Rect key={x} x={x} y={91} width={32} height={18} rx={9} fill="none" stroke={k.ink} strokeWidth={4.5} />
      ))}
      <Path
        d={`M${breakX + 21} 91 L${breakX + 23} 91 A9 9 0 0 1 ${breakX + 23} 109 L${breakX + 9} 109 A9 9 0 0 1 ${breakX + 9} 91 L${breakX + 11} 91`}
        fill="none"
        stroke={RED}
        strokeWidth={4.5}
        strokeLinecap="round"
      />
      {/* the path */}
      <Path d="M160 126 Q214 78 292 96 L292 150 Q226 156 160 150 Z" fill={k.soft} opacity={0.4} />
      <Tufts at={grass} s={0.9} />
      <Path d={bezD(small)} fill="none" stroke={k.line} strokeWidth={10} strokeLinecap="round" />
      {[0.1, 0.23, 0.36, 0.49, 0.62, 0.75, 0.88].map((t, i) => (
        <Step key={i} b={small} t={t} side={i % 2 ? 1 : -1} fill={i === 3 ? k.muted : k.acc} o={i === 3 ? 0.3 : 1} s={0.85} />
      ))}
      <Say x={75} y={184} s="A chain" fill={k.ink} />
      <Say x={225} y={184} s="A path" fill={k.ink} />
    </Frame>
  );
}

/* ---------- the awkward return ---------- */
function AwkwardReturn({ k }: { k: Ink }) {
  return (
    <Frame label="A person stands outside a door that is open just a crack, with warm light coming through the gap. They hesitate, and in a thought cloud above them is a calendar page that says Monday.">
      <Line x1={8} y1={156} x2={292} y2={156} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      {/* the door, a little open, with light spilling out */}
      <Path d="M200 157 L224 157 L172 172 L128 172 Z" fill={GOLD} opacity={0.4} />
      <Rect x={200} y={44} width={62} height={112} fill={GOLD} opacity={0.9} />
      <Path d="M224 44 L262 50 L262 150 L224 156 Z" fill={k.line} />
      <Circle cx={230} cy={102} r={2.8} fill={GOLD} />
      <Rect x={196} y={40} width={70} height={116} fill="none" stroke={k.line} strokeWidth={5} strokeLinejoin="round" />
      {/* the thought: next Monday */}
      <Cloud x={69} y={14} w={96} h={50} fill={k.soft} />
      <Rect x={90} y={20} width={54} height={38} rx={4} fill={k.ink} />
      <Rect x={90} y={20} width={54} height={9} rx={4} fill={k.acc} />
      <Line x1={101} y1={17} x2={101} y2={24} stroke={k.ink} strokeWidth={3} strokeLinecap="round" />
      <Line x1={133} y1={17} x2={133} y2={24} stroke={k.ink} strokeWidth={3} strokeLinecap="round" />
      <Say x={117} y={48} s="Monday" fill={k.bg} size={12} />
      {/* the person, hesitating at the door */}
      <Limb a={[88, 120]} b={[106, 116]} w={5.5} c={k.ink} />
      <Person x={88} y={156} s={1.15} fill={k.ink} face={k.bg} />
    </Frame>
  );
}

/* ---------- walk it again ---------- */
function StepBack({ k }: { k: Ink }) {
  const p = useGrow(500, 900);
  const land = bezAt(PATH, 0.62);
  const [lx, ly] = land;
  const tufts = tuftsAway(PATH, SPOTS);
  return (
    <Frame label="The worn path across the field again. A person steps back onto it with one foot, and a small bright footprint glows where the foot lands. The words say: walk it again.">
      <Path d={HILL} fill={k.soft} opacity={0.4} />
      <Tufts at={tufts} />
      <Path d={bezD(PATH)} fill="none" stroke={k.line} strokeWidth={13} strokeLinecap="round" />
      {STEPS.filter((_, i) => i < 6).map((t, i) => (
        <Step key={i} b={PATH} t={t} side={i % 2 ? 1 : -1} fill={k.acc} o={0.8} />
      ))}
      {/* the person, one foot on the grass and one landing on the path */}
      <Limb a={[142, 104]} b={[138, 134]} c={k.acc} />
      <Limb a={[158, 104]} b={[lx - 1, ly - 6]} c={k.acc} />
      <Person x={150} y={108} fill={k.acc} face={k.bg} />
      <Limb a={[133, 88]} b={[122, 100]} w={5} c={k.acc} />
      <Limb a={[167, 88]} b={[180, 96]} w={5} c={k.acc} />
      {/* the footprint where the foot lands */}
      <Circle cx={lx} cy={ly} r={10 + 4 * p} fill={GOLD} opacity={0.3 * p} />
      <Step b={PATH} t={0.62} side={1} fill={GOLD} o={p} s={1.5} />
      <Say x={150} y={190} s="Walk it again" fill={k.ink} />
    </Frame>
  );
}

export const SCENES_E10: Record<string, ComponentType<{ k: Ink }>> = {
  'l12-pick-habit': PickHabit,
  'l12-daily-log': DailyLog,
  'l12-worn-path': WornPath,
  'l12-two-misses': TwoMisses,
  'l12-path-chain': PathChain,
  'l12-awkward-return': AwkwardReturn,
  'l12-step-back': StepBack,
};
