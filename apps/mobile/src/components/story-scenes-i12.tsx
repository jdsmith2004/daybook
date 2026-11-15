/* Scenes for lesson g12, "Comfort you can give" (see story-kit.tsx and story-scenes-f-l31.tsx for the approach, and story-scenes-i6.tsx for the look of this set): the man
   who lived among the tombs at dusk, the same man healed and sitting at Jesus' feet while the town arrives, the boat and his asking, Jesus sending him home, the
   ten towns he told it in, then the same truth in our own day: a light handed from one person to another, people at the waters of Mormon, two new mothers, a circle
   of chairs, and two hands clasped.
   Jesus always wears a white robe with a red sash. The man from the tombs has the same face, short dark curly hair and short beard in every scene: first thin, in a
   ragged gray-brown robe tied with a rope, and after he is healed a whole warm olive-green robe with a tan sash (short dark curly hair and a short dark beard throughout). Every figure carries a dark outline so it reads on a dark
   card and a cream one. */
import { type ComponentType, type ReactNode, useEffect, useState } from 'react';
import { Easing } from 'react-native';
import { Circle, ClipPath, Defs, Ellipse, G, Line, Path, Rect } from 'react-native-svg';

import { useAppear, useReducedMotion } from '@/lib/motion';

import { BEAR_LINE, Frame, type Ink } from './story-kit';

const SKIN = '#E7B98F';
const HAIR = '#3A2A20';
const GOLD = '#FFD25A';
const GOLD_D = '#C98F1A';
const CREAM = '#FFF5E1';
const WOOD = '#B07A45';
const WOOD_D = '#5E3A1A';
const EDGE = '#8A6A3A';
const SKY = '#F7D9A2';
const SAND = '#EBD3A2';
const SAND_D = '#D2A86A';
const STONE = '#F3E3BC';
const WALL = '#EAD0A0';
const HEART = '#E5405A';
const WHITE = '#F8F4EA';
const RED = '#C23A3A';
const WATER = '#7FB4D0';
const WATER_L = '#B9DDEB';
const FOLK = ['#7A4FA0', '#5C7C8A', '#8A5A2B', '#C27A8A', '#9A4A6A', '#4F6FBF', '#A06A3A', '#6A5A8A'];
const FOLK_HAIR = ['#3A2A20', '#2A1E18', '#6A4A30', '#8A8A8E', '#4A3426'];

/* the man from the tombs: one face, one head of dark hair and a short beard, whatever he wears */
const MAN_HAIR = '#2A1A12';
const RAG = '#8F7F6C';
const RAG_D = '#6A5C4C';
const MAN_ROBE = '#7C8A3E';
const MAN_SASH = '#C9A66B';

/* a value that runs 0 to 1 once and stays at 1 for people who asked for less motion */
function useRun(delay: number, duration: number) {
  const still = useReducedMotion();
  const v = useAppear(delay, duration, Easing.inOut(Easing.cubic));
  const [p, setP] = useState(still ? 1 : 0);
  useEffect(() => {
    const id = v.addListener(({ value }) => setP(value));
    return () => v.removeListener(id);
  }, [v]);
  return still ? 1 : p;
}

/* a smooth line through points, for ridges of hills */
function smooth(pts: [number, number][]): string {
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${c1x} ${c1y} ${c2x} ${c2y} ${p2[0]} ${p2[1]}`;
  }
  return d;
}

/* thick rounded strokes with one outline around the whole shape */
function Tube({ parts, fill }: { parts: [string, number][]; fill: string }) {
  return (
    <G fill="none" strokeLinecap="round" strokeLinejoin="round">
      {parts.map(([d, w], i) => (
        <Path key={`o${i}`} d={d} stroke={BEAR_LINE} strokeWidth={w + 3} />
      ))}
      {parts.map(([d, w], i) => (
        <Path key={`f${i}`} d={d} stroke={fill} strokeWidth={w} />
      ))}
    </G>
  );
}
function Hand({ x, y, r = 3.6 }: { x: number; y: number; r?: number }) {
  return <Circle cx={x} cy={y} r={r} fill={SKIN} stroke={BEAR_LINE} strokeWidth={1.2} />;
}

/* the sky card and the ground, with rounded bottom corners to match */
function Sky({ fill = SKY }: { fill?: string }) {
  return <Rect x={10} y={10} width={280} height={162} rx={12} fill={fill} />;
}
function Floor({ y, fill, x0 = 10, x1 = 290 }: { y: number; fill: string; x0?: number; x1?: number }) {
  return <Path d={`M${x0} ${y} L${x1} ${y} L${x1} 160 Q${x1} 172 ${x1 - 12} 172 L${x0 + 12} 172 Q${x0} 172 ${x0} 160 Z`} fill={fill} />;
}
function Sun({ x = 252, y = 38 }: { x?: number; y?: number }) {
  return (
    <G>
      <Circle cx={x} cy={y} r={20} fill={GOLD} opacity={0.35} />
      <Circle cx={x} cy={y} r={12} fill={GOLD} />
    </G>
  );
}

/* ---------- people ---------- */
const BODY = 'M-13 0 L-9 -33 Q-9 -42 0 -42 Q9 -42 9 -33 L13 0 Z';
const BODY_RAG = 'M-13 0 L-9 -33 Q-9 -42 0 -42 Q9 -42 9 -33 L13 0 L10 -4 L7 -1 L4 -5 L1 -1 L-2 -4 L-5 0 L-8 -4 Z';
const SEAT = 'M-24 0 Q-18 -9 -9 -13 L-8 -37 Q-8 -45 0 -45 Q8 -45 8 -37 L9 -13 Q18 -9 24 0 Z';
const SEAT_RAG =
  'M-24 0 Q-18 -9 -9 -13 L-8 -37 Q-8 -45 0 -45 Q8 -45 8 -37 L9 -13 Q18 -9 24 0 L20 -3 L16 0 L12 -3 L8 0 L4 -3 L0 0 L-4 -3 L-8 0 L-12 -3 L-16 0 L-20 -3 Z';
type Arm = [number, number, number];
const ARMS_DOWN: Arm[] = [
  [-9, -12, -17],
  [9, 12, -17],
];

/* one head, the same for everyone who stands or sits in a robe: centered at (0, -49), facing right */
function Head({
  sw,
  hair,
  beard = false,
  longHair = false,
  curly = false,
  band,
  glance = 0,
}: {
  sw: number;
  hair: string;
  beard?: boolean;
  longHair?: boolean;
  curly?: boolean;
  band?: string;
  glance?: number;
}) {
  return (
    <G>
      <Circle cx={0} cy={-49} r={8.5} fill={SKIN} stroke={BEAR_LINE} strokeWidth={sw} />
      {longHair ? (
        <Path
          d="M-9 -49 Q-9.6 -60 0 -60 Q9.6 -60 9 -49 L9.8 -39 Q6 -42 5 -47 Q0 -52 -5 -47 Q-6 -42 -9.8 -39 Z"
          fill={hair}
          stroke={BEAR_LINE}
          strokeWidth={sw * 0.7}
        />
      ) : (
        <Path d="M-8.6 -50 Q-8.4 -59 0 -59 Q8.6 -58.6 8.6 -50 Q4 -54 0 -53.5 Q-5 -54 -8.6 -50 Z" fill={hair} />
      )}
      {curly ? (
        <G fill={hair} stroke={BEAR_LINE} strokeWidth={sw * 0.5}>
          <Circle cx={-6.6} cy={-54} r={3.4} />
          <Circle cx={-2.6} cy={-57.6} r={3.6} />
          <Circle cx={2.2} cy={-58} r={3.6} />
          <Circle cx={6.4} cy={-55} r={3.4} />
          <Circle cx={-8} cy={-49.5} r={2.6} />
        </G>
      ) : null}
      {band ? <Path d="M-8.3 -53 Q0 -57.5 8.3 -53" stroke={band} strokeWidth={2.6} fill="none" strokeLinecap="round" /> : null}
      {beard ? <Path d="M-6.4 -46 Q0 -36 6.4 -46 Q4.6 -42 0 -40.6 Q-4.6 -42 -6.4 -46 Z" fill={hair} stroke={BEAR_LINE} strokeWidth={sw * 0.6} /> : null}
      <Circle cx={4} cy={-48 + glance} r={1.5} fill={BEAR_LINE} />
    </G>
  );
}

/* a person in a long robe, standing on (x, y), facing right (flip turns them). arms are [shoulder x, hand x, hand y] in the person's own space; tilt turns the
   head (negative looks up); thin narrows the body */
function Robed({
  x,
  y,
  s = 1,
  flip = false,
  rot = 0,
  robe,
  sash,
  hair = HAIR,
  beard = false,
  longHair = false,
  curly = false,
  band,
  arms = ARMS_DOWN,
  tilt = 0,
  glance = 0,
  body = BODY,
  thin = 1,
  children,
}: {
  x: number;
  y: number;
  s?: number;
  flip?: boolean;
  rot?: number;
  robe: string;
  sash?: string;
  hair?: string;
  beard?: boolean;
  longHair?: boolean;
  curly?: boolean;
  band?: string;
  arms?: Arm[];
  tilt?: number;
  glance?: number;
  body?: string;
  thin?: number;
  children?: ReactNode;
}) {
  const sw = 1.5 / s;
  return (
    <G transform={`translate(${x} ${y}) rotate(${rot}) scale(${flip ? -s : s} ${s})`}>
      <G transform={`scale(${thin} 1)`}>
        <Ellipse cx={-5.5} cy={0.5} rx={4.4} ry={2} fill={BEAR_LINE} />
        <Ellipse cx={6} cy={0.5} rx={4.4} ry={2} fill={BEAR_LINE} />
        <Path d={body} fill={robe} stroke={BEAR_LINE} strokeWidth={sw} strokeLinejoin="round" />
        {sash ? (
          <G>
            <Path d="M-10.4 -22 L10.4 -22" stroke={sash} strokeWidth={3.6} />
            <Path d="M4 -22 L6.5 -9" stroke={sash} strokeWidth={3} strokeLinecap="round" />
            <Path d={body} fill="none" stroke={BEAR_LINE} strokeWidth={sw} strokeLinejoin="round" />
          </G>
        ) : null}
      </G>
      {arms.map(([sx, hx, hy], i) => (
        <G key={i}>
          <Tube fill={robe} parts={[[`M${sx} -34 L${hx} ${hy}`, 5]]} />
          <Hand x={hx} y={hy} />
        </G>
      ))}
      {children}
      <G transform={`rotate(${tilt} 0 -42)`}>
        <Head sw={sw} hair={hair} beard={beard} longHair={longHair} curly={curly} band={band} glance={glance} />
      </G>
    </G>
  );
}

/* a person sitting on the ground in a long robe, facing right, hips on (x, y): the same cut as Robed's face and hair */
function Seated({
  x,
  y,
  s = 1,
  flip = false,
  robe,
  sash,
  hair = HAIR,
  beard = false,
  longHair = false,
  curly = false,
  arms = [[8, 14, -12]],
  tilt = 0,
  thin = 1,
  ragged = false,
  children,
}: {
  x: number;
  y: number;
  s?: number;
  flip?: boolean;
  robe: string;
  sash?: string;
  hair?: string;
  beard?: boolean;
  longHair?: boolean;
  curly?: boolean;
  arms?: Arm[];
  tilt?: number;
  thin?: number;
  ragged?: boolean;
  children?: ReactNode;
}) {
  const sw = 1.5 / s;
  const body = ragged ? SEAT_RAG : SEAT;
  return (
    <G transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      <Ellipse cx={0} cy={1.5} rx={24} ry={3.2} fill={BEAR_LINE} opacity={0.35} />
      <G transform={`scale(${thin} 1)`}>
        <Path d={body} fill={robe} stroke={BEAR_LINE} strokeWidth={sw} strokeLinejoin="round" />
        {sash ? (
          <G>
            <Path d="M-9 -22 L9 -22" stroke={sash} strokeWidth={3.2} />
            <Path d={body} fill="none" stroke={BEAR_LINE} strokeWidth={sw} strokeLinejoin="round" />
          </G>
        ) : null}
      </G>
      {arms.map(([sx, hx, hy], i) => (
        <G key={i}>
          <Tube fill={robe} parts={[[`M${sx} -35 L${hx} ${hy}`, 5]]} />
          <Hand x={hx} y={hy} />
        </G>
      ))}
      {children}
      <G transform={`translate(0 -3) rotate(${tilt} 0 -42)`}>
        <Head sw={sw} hair={hair} beard={beard} longHair={longHair} curly={curly} />
      </G>
    </G>
  );
}

function Jesus({
  x,
  y,
  s = 1,
  flip = false,
  tilt = 0,
  rot = 0,
  arms,
}: {
  x: number;
  y: number;
  s?: number;
  flip?: boolean;
  tilt?: number;
  rot?: number;
  arms?: Arm[];
}) {
  return <Robed x={x} y={y} s={s} flip={flip} rot={rot} tilt={tilt} arms={arms} robe={WHITE} sash={RED} hair="#6B4A2E" beard longHair />;
}

/* the man from the tombs: ragged and thin at first (a rope for a belt, a few patches), later a whole olive-green robe */
function Man({
  x,
  y,
  s = 1,
  flip = false,
  rot = 0,
  healed = true,
  arms,
  tilt = 0,
}: {
  x: number;
  y: number;
  s?: number;
  flip?: boolean;
  rot?: number;
  healed?: boolean;
  arms?: Arm[];
  tilt?: number;
}) {
  return (
    <Robed
      x={x}
      y={y}
      s={s}
      flip={flip}
      rot={rot}
      tilt={tilt}
      arms={arms}
      robe={healed ? MAN_ROBE : RAG}
      sash={healed ? MAN_SASH : RAG_D}
      hair={MAN_HAIR}
      beard
      curly
      body={healed ? BODY : BODY_RAG}
      thin={healed ? 1 : 0.86}>
      {healed ? null : (
        <G fill={RAG_D} opacity={0.8}>
          <Rect x={-6} y={-32} width={6} height={5} rx={1} />
          <Rect x={1} y={-14} width={5} height={5} rx={1} />
        </G>
      )}
    </Robed>
  );
}
function SeatedMan({
  x,
  y,
  s = 1,
  flip = false,
  healed = true,
  arms,
  tilt = 0,
}: {
  x: number;
  y: number;
  s?: number;
  flip?: boolean;
  healed?: boolean;
  arms?: Arm[];
  tilt?: number;
}) {
  return (
    <Seated
      x={x}
      y={y}
      s={s}
      flip={flip}
      tilt={tilt}
      arms={arms}
      robe={healed ? MAN_ROBE : RAG}
      sash={healed ? MAN_SASH : RAG_D}
      hair={MAN_HAIR}
      beard
      curly
      thin={healed ? 1 : 0.86}
      ragged={!healed}>
      {healed ? null : (
        <G fill={RAG_D} opacity={0.8}>
          <Rect x={-6} y={-30} width={6} height={5} rx={1} />
          <Rect x={2} y={-8} width={6} height={4} rx={1} />
        </G>
      )}
    </Seated>
  );
}

/* one of the crowd: a plain robe in one of a few colors */
function Folk({ x, y, s = 1, i, flip = false, arms = [] }: { x: number; y: number; s?: number; i: number; flip?: boolean; arms?: Arm[] }) {
  return (
    <Robed
      x={x}
      y={y}
      s={s}
      flip={flip}
      robe={FOLK[i % FOLK.length]}
      hair={FOLK_HAIR[(i * 3) % FOLK_HAIR.length]}
      arms={arms}
      band={i % 3 === 0 ? CREAM : undefined}
    />
  );
}
/* hands up beside the face: surprise, wonder */
const AMAZED: Arm[] = [
  [-9, -17, -48],
  [9, 17, -48],
];
const ONE_UP: Arm[] = [[9, 15, -50]];

/* ---------- places ---------- */
/* a very small town of flat-roofed houses, standing on (x, y) */
function Town({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`} stroke={EDGE} strokeWidth={0.9 / s} strokeLinejoin="round">
      <Rect x={-10} y={-7} width={9} height={7} fill={STONE} />
      <Rect x={-11} y={-9.4} width={11} height={2.6} fill={SAND} />
      <Rect x={1} y={-10} width={8} height={10} fill={WALL} />
      <Rect x={0} y={-12.4} width={10} height={2.6} fill={SAND} />
      <Rect x={3.4} y={-4.6} width={3} height={4.6} fill="#3A2418" stroke="none" />
    </G>
  );
}
/* a bigger flat-roofed house seen from the front, with a lit arched door */
function Hut({ x0, x1, y, top }: { x0: number; x1: number; y: number; top: number }) {
  const mid = (x0 + x1) / 2;
  return (
    <G stroke={EDGE} strokeWidth={1.2} strokeLinejoin="round">
      <Rect x={x0} y={top} width={x1 - x0} height={y - top} fill={WALL} />
      <Rect x={x0 - 3} y={top - 6} width={x1 - x0 + 6} height={7} rx={2} fill={STONE} />
      <Path
        d={`M${mid - 5} ${y} L${mid - 5} ${y - 12} Q${mid - 5} ${y - 19} ${mid} ${y - 19} Q${mid + 5} ${y - 19} ${mid + 5} ${y - 12} L${mid + 5} ${y} Z`}
        fill="#3A2418"
      />
      <Path
        d={`M${mid - 3} ${y} L${mid - 3} ${y - 11} Q${mid - 3} ${y - 15} ${mid} ${y - 15} Q${mid + 3} ${y - 15} ${mid + 3} ${y - 11} L${mid + 3} ${y} Z`}
        fill={GOLD}
        opacity={0.55}
        stroke="none"
      />
    </G>
  );
}

function Link({ x, y, rot = 0, open = false }: { x: number; y: number; rot?: number; open?: boolean }) {
  const d = open ? 'M5 -2.6 A6.2 3.4 0 1 0 6.2 0.4' : 'M-6 0 A6 3.2 0 1 1 6 0 A6 3.2 0 1 1 -6 0';
  return (
    <G transform={`translate(${x} ${y}) rotate(${rot})`} fill="none" strokeLinecap="round">
      <Path d={d} stroke={BEAR_LINE} strokeWidth={4.6} />
      <Path d={d} stroke="#B8BEC8" strokeWidth={2.3} />
    </G>
  );
}

/* ---------- 1. among the tombs, at dusk ---------- */
function Tomb({ x0, x1, top, y }: { x0: number; x1: number; top: number; y: number }) {
  const r = (x1 - x0) / 2;
  const d = `M${x0} ${y} L${x0} ${top + r} Q${x0} ${top} ${x0 + r} ${top} Q${x1} ${top} ${x1} ${top + r} L${x1} ${y} Z`;
  return (
    <G>
      <Path d={d} fill="#1E1628" stroke="#5A4636" strokeWidth={3} strokeLinejoin="round" />
      <Path d={d} fill="none" stroke="#B49A80" strokeWidth={1} opacity={0.6} strokeLinejoin="round" transform="translate(0 -3)" />
    </G>
  );
}
function Tombs({ k }: { k: Ink }) {
  void k;
  const p = useRun(300, 2400);
  const stars: [number, number, number][] = [
    [40, 28, 1.5],
    [92, 22, 1.2],
    [150, 34, 1.4],
    [204, 24, 1.3],
    [236, 52, 1.1],
    [124, 48, 1.1],
  ];
  return (
    <Frame label="A hillside at dusk with dark tomb openings cut into the rock. A lone, thin man in a ragged robe sits outside one of them with his head bowed. Broken chain links lie on the ground beside him, and the lake is far below in the distance">
      <Sky fill="#4A4082" />
      <Rect x={10} y={56} width={280} height={22} fill="#8A5C8E" opacity={0.8} />
      <Rect x={10} y={78} width={280} height={20} fill="#D4807A" opacity={0.9} />
      <Rect x={10} y={98} width={280} height={20} fill="#F0B67A" opacity={0.9} />
      {stars.map(([x, y, r], i) => (
        <Circle key={i} cx={x} cy={y} r={r} fill="#FFF1B8" opacity={0.4 + 0.6 * p} />
      ))}
      <Path d="M262 56 Q246 56 246 40 Q246 24 262 24 Q252 28 252 40 Q252 52 262 56 Z" fill="#FFF1B8" opacity={0.9} />
      {/* the far shore and the lake, small and far below */}
      <Path d="M150 120 Q190 100 230 110 Q262 98 290 106 L290 130 L150 130 Z" fill="#4B4278" />
      <Rect x={170} y={118} width={120} height={32} fill="#7F9CC4" />
      <Rect x={170} y={118} width={120} height={5} fill="#F0B67A" opacity={0.45} />
      <Path d="M206 132 L230 132 M246 140 L274 140 M184 142 L204 142" stroke="#B9C8E6" strokeWidth={1.4} strokeLinecap="round" />
      <G stroke={BEAR_LINE} strokeWidth={0.8} strokeLinejoin="round">
        <Path d="M242 129 L254 129 L251 133 L245 133 Z" fill="#6A4A30" />
        <Path d="M248 128 L248 120 L253 128 Z" fill={CREAM} />
      </G>
      {/* the rock, with the tombs cut into it */}
      <Path d="M10 152 L10 50 Q58 42 108 58 Q158 74 190 108 L200 152 Z" fill="#7C6556" />
      <Path d="M10 50 Q58 42 108 58 Q158 74 190 108 L184 112 Q154 80 108 66 Q58 54 10 62 Z" fill="#9A7F68" />
      <Path
        d="M20 76 Q40 72 56 78 M120 78 Q140 84 158 96 M70 70 Q84 68 96 74"
        stroke="#5A4636"
        strokeWidth={1.4}
        fill="none"
        strokeLinecap="round"
        opacity={0.6}
      />
      <Tomb x0={22} x1={58} top={92} y={152} />
      <Tomb x0={98} x1={142} top={98} y={152} />
      <Tomb x0={160} x1={184} top={118} y={152} />
      {/* the ledge in front */}
      <Path d="M10 172 L10 146 L206 146 Q216 150 226 154 L290 158 L290 160 Q290 172 278 172 L22 172 Q10 172 10 160 Z" fill="#5E4B3E" />
      <Path d="M10 146 L206 146 Q216 150 226 154 L290 158 L290 161 L226 157 Q216 153 206 149 L10 149 Z" fill="#8A6F5A" />
      <Ellipse cx={44} cy={160} rx={5} ry={2.4} fill="#7A6250" />
      <Ellipse cx={206} cy={164} rx={6} ry={2.6} fill="#7A6250" />
      <Ellipse cx={90} cy={166} rx={4} ry={2} fill="#7A6250" />
      {/* the broken chain links on the ground */}
      <Link x={152} y={158} rot={-8} />
      <Link x={160} y={160} rot={14} />
      <Link x={178} y={157} rot={30} open />
      <Link x={192} y={161} rot={-20} />
      <SeatedMan
        x={120}
        y={154}
        s={1.15}
        healed={false}
        tilt={14}
        arms={[
          [-8, -15, -9],
          [8, 17, -11],
        ]}
      />
    </Frame>
  );
}

/* ---------- 2. sitting at His feet, in his right mind ---------- */
function Sitting({ k }: { k: Ink }) {
  void k;
  const run = useRun(300, 1800);
  const arrive = (1 - run) * 14;
  return (
    <Frame label="In daylight on the hillside, the man from the tombs, now in a whole olive-green robe with short dark curly hair, sits calmly on the ground a little way in front of Jesus, who stands behind him in white with a red sash and rests a hand toward him. Townspeople arrive at the right edge, their hands raised in surprise">
      <Sky />
      <Sun x={44} y={36} />
      <Path d="M10 110 Q60 94 112 105 Q170 88 230 103 Q262 98 290 106 L290 140 L10 140 Z" fill="#B3AB78" />
      {/* the rock with a tomb, now far behind */}
      <Path d="M10 140 L10 80 Q40 68 66 86 L82 140 Z" fill="#B59A78" />
      <Path d="M24 140 L24 108 Q24 98 33 98 Q42 98 42 108 L42 140 Z" fill="#3A2A30" />
      <Floor y={128} fill={SAND_D} />
      <Path d="M10 146 Q150 134 290 146 L290 160 Q290 172 278 172 L22 172 Q10 172 10 160 Z" fill="#E4CB98" opacity={0.7} />
      <Ellipse cx={148} cy={120} rx={86} ry={50} fill={GOLD} opacity={0.14} />
      {/* the town, coming */}
      <Folk x={248} y={142 + arrive * 0.3} s={0.72} i={3} flip arms={ONE_UP} />
      <Folk x={270 + arrive} y={140} s={0.7} i={6} flip arms={AMAZED} />
      <Folk x={236 + arrive} y={160} s={0.95} i={1} flip arms={AMAZED} />
      <Folk x={264 + arrive} y={162} s={0.95} i={4} flip arms={ONE_UP} />
      <SeatedMan
        x={116}
        y={162}
        s={1.2}
        tilt={-16}
        arms={[
          [8, 13, -12],
          [-8, -10, -10],
        ]}
      />
      <Jesus
        x={194}
        y={142}
        s={1.15}
        flip
        tilt={6}
        arms={[
          [-9, -12, -17],
          [9, 18, -24],
        ]}
      />
    </Frame>
  );
}

/* ---------- 3. the boat, and his asking ---------- */
function Boat({ k }: { k: Ink }) {
  void k;
  const run = useRun(300, 2000);
  const bob = Math.sin(run * Math.PI * 2) * 1.4;
  return (
    <Frame label="At the lake shore, Jesus in white with a red sash steps into a boat. The man in the olive-green robe stands on the sand with both arms reaching toward Him, asking to come along">
      <Sky />
      <Sun x={44} y={36} />
      <Path d="M10 108 Q60 92 112 103 Q170 86 230 101 Q262 96 290 104 L290 130 L10 130 Z" fill="#B3AB78" />
      <Path d="M10 112 L290 112 L290 160 Q290 172 278 172 L22 172 Q10 172 10 160 Z" fill={WATER} />
      <Path
        d="M150 130 L176 130 M196 166 L230 166 M236 138 L268 138 M120 152 L142 152 M232 122 L254 122"
        stroke={WATER_L}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
      {/* the sand */}
      <Path d="M10 160 Q10 172 22 172 L160 172 Q150 148 114 140 Q66 126 10 130 Z" fill={SAND_D} />
      <Path d="M10 148 Q80 134 130 150 Q150 158 158 172 L22 172 Q10 172 10 160 Z" fill="#E4CB98" opacity={0.7} />
      <G transform={`translate(0 ${bob})`}>
        {/* the mast with its furled cloth */}
        <Rect x={248} y={66} width={4} height={62} fill={WOOD_D} stroke={BEAR_LINE} strokeWidth={1.2} />
        <Path d="M222 74 Q250 68 278 74 L276 80 Q250 74 224 80 Z" fill={CREAM} stroke={BEAR_LINE} strokeWidth={1.2} strokeLinejoin="round" />
        <Jesus
          x={212}
          y={134}
          s={1.15}
          flip
          tilt={-4}
          arms={[
            [-9, -12, -17],
            [9, 17, -32],
          ]}
        />
        <Path d="M166 126 L286 126 Q280 152 252 154 L200 154 Q172 152 166 126 Z" fill={WOOD} stroke={BEAR_LINE} strokeWidth={1.5} strokeLinejoin="round" />
        <Path d="M172 136 Q226 142 282 136" stroke={WOOD_D} strokeWidth={1.4} fill="none" opacity={0.6} />
        <Rect x={164} y={122} width={124} height={6} rx={2.4} fill="#C99058" stroke={BEAR_LINE} strokeWidth={1.2} />
        <Path d="M166 126 Q158 112 166 100 Q172 112 174 124 Z" fill={WOOD} stroke={BEAR_LINE} strokeWidth={1.3} strokeLinejoin="round" />
      </G>
      <Man
        x={118}
        y={158}
        s={1.25}
        rot={7}
        tilt={-10}
        arms={[
          [8, 24, -32],
          [-8, 22, -24],
        ]}
      />
    </Frame>
  );
}

/* ---------- 4. go home ---------- */
function Home({ k }: { k: Ink }) {
  void k;
  const run = useRun(300, 1800);
  const glow = 0.25 + 0.15 * Math.sin(run * Math.PI);
  const way: [number, number][] = [
    [150, 164],
    [176, 146],
    [206, 138],
    [232, 120],
    [246, 100],
  ];
  const ridge: [number, number][] = [
    [10, 106],
    [70, 98],
    [140, 88],
    [200, 92],
    [250, 76],
    [290, 80],
  ];
  const homes: [number, number, number][] = [
    [190, 93, 1.3],
    [220, 88, 1.7],
    [252, 77, 2],
    [273, 80, 1.3],
  ];
  return (
    <Frame label="Jesus in white with a red sash points the way home. The man in the olive-green robe turns to go along a path that climbs toward a town of small houses on the hills ahead, his face lifted, hopeful, in warm morning light">
      <Sky />
      <Circle cx={196} cy={40} r={22} fill={GOLD} opacity={0.35} />
      <Circle cx={196} cy={40} r={13} fill={GOLD} />
      <Circle cx={248} cy={72} r={36} fill={GOLD} opacity={glow * 0.5} />
      <Path d={`${smooth(ridge)} L290 160 Q290 172 278 172 L22 172 Q10 172 10 160 Z`} fill="#A9B574" />
      {homes.map(([x, y, sc], i) => (
        <Town key={i} x={x} y={y} s={sc} />
      ))}
      <Path
        d={`${smooth([
          [120, 150],
          [170, 128],
          [226, 116],
          [290, 112],
        ])} L290 160 Q290 172 278 172 L120 172 Z`}
        fill="#8FA866"
      />
      <Path d="M10 144 Q80 134 150 146 Q170 152 180 172 L22 172 Q10 172 10 160 Z" fill={SAND_D} />
      <Path d="M10 154 Q80 146 160 160 L174 172 L22 172 Q10 172 10 160 Z" fill="#E4CB98" opacity={0.7} />
      <Path d={smooth(way)} stroke="#E4CB98" strokeWidth={7} strokeLinecap="round" fill="none" />
      <Path d={smooth(way)} stroke={SAND} strokeWidth={4.4} strokeLinecap="round" fill="none" />
      <Jesus
        x={64}
        y={160}
        s={1.3}
        tilt={-8}
        arms={[
          [-9, -12, -17],
          [9, 38, -52],
        ]}
      />
      <Man
        x={130}
        y={160}
        s={1.2}
        rot={3}
        tilt={-12}
        arms={[
          [-8, -10, -20],
          [8, 11, -28],
        ]}
      />
    </Frame>
  );
}

/* ---------- 5. ten towns ---------- */
function Towns({ k }: { k: Ink }) {
  void k;
  const run = useRun(300, 2000);
  const back: [number, number][] = [
    [10, 76],
    [40, 66],
    [80, 72],
    [124, 58],
    [170, 68],
    [214, 56],
    [256, 66],
    [290, 74],
  ];
  const near: [number, number][] = [
    [10, 102],
    [44, 96],
    [80, 94],
    [120, 98],
    [190, 96],
    [228, 92],
    [264, 98],
    [290, 100],
  ];
  const backTowns = [1, 2, 3, 4, 5, 6];
  const nearTowns = [2, 3, 4, 5];
  const up = (1 - run) * 6;
  return (
    <Frame label="In a town square, the man in the olive-green robe stands on a low stone step telling his story with open hands, and small crowds on both sides listen amazed. On the hills all around, ten small towns are dotted along the ridges">
      <Sky />
      <Sun x={150} y={30} />
      <Path d={`${smooth(back)} L290 132 L10 132 Z`} fill="#A9B574" />
      {backTowns.map((i) => (
        <Town key={`b${i}`} x={back[i][0]} y={back[i][1] + 4} s={0.9} />
      ))}
      <Path d={`${smooth(near)} L290 140 L10 140 Z`} fill="#8FA866" />
      {nearTowns.map((i) => (
        <Town key={`n${i}`} x={near[i][0]} y={near[i][1] + 5} s={1.2} />
      ))}
      <Floor y={134} fill={SAND_D} />
      <Path d="M10 150 Q150 138 290 150 L290 160 Q290 172 278 172 L22 172 Q10 172 10 160 Z" fill="#E4CB98" opacity={0.7} />
      <Hut x0={14} x1={50} y={140} top={96} />
      <Hut x0={250} x1={286} y={140} top={100} />
      {/* the listeners on either side, hands raised in wonder */}
      <Folk x={62} y={146 - up * 0.4} s={0.76} i={3} arms={ONE_UP} />
      <Folk x={100} y={146} s={0.76} i={6} arms={AMAZED} />
      <Folk x={202} y={146} s={0.76} i={1} flip arms={AMAZED} />
      <Folk x={240} y={147 - up * 0.4} s={0.76} i={4} flip arms={ONE_UP} />
      <Folk x={52} y={162} s={1} i={2} arms={AMAZED} />
      <Folk x={94} y={164} s={1.05} i={5} arms={ONE_UP} />
      <Folk x={250} y={162} s={1} i={7} flip arms={ONE_UP} />
      <Folk x={208} y={164} s={1.05} i={0} flip arms={AMAZED} />
      {/* the man on his step */}
      <Path d="M126 152 L174 152 L170 144 L130 144 Z" fill={STONE} stroke={EDGE} strokeWidth={1.3} strokeLinejoin="round" />
      <Man
        x={150}
        y={146}
        s={1.2}
        arms={[
          [-9, -19, -38],
          [9, 20, -34],
        ]}
        tilt={-6}
      />
    </Frame>
  );
}

/* ---------- 6. a light, passed on ---------- */
function Pass({ k }: { k: Ink }) {
  void k;
  const run = useRun(300, 2200);
  const e = 1 - (1 - run) * (1 - run);
  const stars: [number, number, number][] = [
    [36, 34, 1.6],
    [76, 22, 1.2],
    [124, 38, 1.4],
    [208, 26, 1.6],
    [246, 54, 1.2],
    [264, 28, 1.4],
  ];
  const lx = 138 + 16 * e;
  const ly = 110 + 8 * e - 7 * Math.sin(e * Math.PI);
  const sparks: [number, number, number][] = [
    [146, 98, 1.6],
    [156, 94, 1.2],
    [164, 100, 1.5],
    [152, 124, 1.2],
  ];
  return (
    <Frame label="At night, one person stands and hands a small glowing light to another person who sits slumped on the ground. The light passes between their hands, and a warm glow begins to rise around the one receiving it">
      <Sky fill="#2F2A5E" />
      {stars.map(([x, y, r], i) => (
        <Circle key={i} cx={x} cy={y} r={r} fill="#FFF1B8" />
      ))}
      <Path d="M10 118 Q80 104 160 114 Q230 104 290 112 L290 160 Q290 172 278 172 L22 172 Q10 172 10 160 Z" fill="#4B4278" />
      <Path d="M10 140 Q130 128 290 138 L290 160 Q290 172 278 172 L22 172 Q10 172 10 160 Z" fill="#6A5FA0" />
      <Ellipse cx={156} cy={150} rx={88} ry={14} fill={GOLD} opacity={0.2} />
      <Ellipse cx={156} cy={150} rx={52} ry={9} fill={GOLD} opacity={0.26} />
      <Circle cx={198} cy={124} r={34} fill={GOLD} opacity={0.22 * e} />
      <Seated
        x={196}
        y={160}
        s={1.15}
        flip
        robe="#5C7C8A"
        sash="#3B5662"
        hair="#4A3426"
        tilt={28}
        arms={[
          [8, 22, -32],
          [-8, -13, -14],
        ]}
      />
      <Robed
        x={102}
        y={160}
        s={1.4}
        robe="#8E5CC0"
        sash="#5E3A8A"
        hair="#2E2018"
        tilt={10}
        arms={[
          [9, 25, -38],
          [-9, -12, -18],
        ]}
      />
      {sparks.map(([x, y, r], i) => (
        <Circle key={i} cx={x} cy={y + 4 - 4 * e} r={r} fill="#FFF1B8" opacity={0.9 * e} />
      ))}
      <G transform={`translate(${lx} ${ly})`}>
        <Circle cx={0} cy={0} r={22} fill={GOLD} opacity={0.2} />
        <Circle cx={0} cy={0} r={13} fill={GOLD} opacity={0.34} />
        <Circle cx={0} cy={0} r={6.2} fill="#FFF1B8" stroke={GOLD_D} strokeWidth={1.2} />
      </G>
    </Frame>
  );
}

/* ---------- 7. the waters of Mormon ---------- */
function Tree({ x, y, s = 1, leaf = '#3E7A47' }: { x: number; y: number; s?: number; leaf?: string }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`} stroke={BEAR_LINE} strokeWidth={1.2 / s} strokeLinejoin="round">
      <Rect x={-4} y={-30} width={8} height={30} fill={WOOD_D} />
      <Circle cx={-11} cy={-40} r={14} fill={leaf} />
      <Circle cx={11} cy={-40} r={14} fill={leaf} />
      <Circle cx={0} cy={-52} r={16} fill={leaf} />
      <Circle cx={0} cy={-38} r={14} fill={leaf} stroke="none" />
    </G>
  );
}
function Waters({ k }: { k: Ink }) {
  void k;
  const run = useRun(300, 2200);
  const shimmer = 0.5 + 0.3 * Math.sin(run * Math.PI * 2);
  return (
    <Frame label="A quiet pool of clear water among trees, the waters of Mormon. People stand along its edge, and in front one person is being helped by another, who stands close with an arm around their shoulders">
      <Sky fill="#CFE3C0" />
      <Circle cx={150} cy={60} r={46} fill={GOLD} opacity={0.2} />
      <Tree x={36} y={118} s={1.1} leaf="#3E7A47" />
      <Tree x={92} y={110} s={0.9} leaf="#4E8F55" />
      <Tree x={208} y={110} s={0.9} leaf="#4E8F55" />
      <Tree x={266} y={120} s={1.15} leaf="#2F6A44" />
      <Floor y={124} fill="#5FA564" />
      <Ellipse cx={150} cy={120} rx={104} ry={22} fill="#4E8F55" />
      <Ellipse cx={150} cy={120} rx={98} ry={18} fill={WATER} stroke={BEAR_LINE} strokeWidth={1.2} />
      <Path
        d="M92 116 Q104 112 116 116 M150 124 Q166 119 182 124 M196 114 Q206 111 216 114"
        stroke={WATER_L}
        strokeWidth={1.8}
        fill="none"
        strokeLinecap="round"
        opacity={shimmer + 0.3}
      />
      <Ellipse cx={150} cy={116} rx={34} ry={5} fill={WATER_L} opacity={0.35} />
      <Path d="M10 148 Q150 134 290 148 L290 160 Q290 172 278 172 L22 172 Q10 172 10 160 Z" fill="#4E8F55" />
      {/* those standing at the edge, facing the water */}
      <Folk x={58} y={146} s={0.78} i={1} arms={[[9, 12, -22]]} />
      <Folk x={88} y={142} s={0.7} i={4} arms={[[9, 12, -22]]} />
      <Folk x={222} y={142} s={0.7} i={5} flip arms={[[9, 12, -22]]} />
      <Folk x={250} y={146} s={0.8} i={7} flip arms={[[9, 12, -22]]} />
      {/* one helped by another, an arm around the shoulders */}
      <Robed x={158} y={162} s={1.35} robe="#B5532A" sash="#7A3418" hair="#2E2018" tilt={16} rot={-2} arms={[[-9, -10, -20]]} />
      <Robed
        x={120}
        y={160}
        s={1.35}
        robe="#2FA39A"
        sash="#1B6E67"
        hair="#4A3426"
        band="#1B6E67"
        tilt={-4}
        arms={[
          [9, 28, -38],
          [-9, -12, -18],
        ]}
      />
    </Frame>
  );
}

/* ---------- 8. two women who know ---------- */
/* a woman sitting on a sofa, side on, hip height 32; the same cut as the sitters of g6, with long hair */
function Sitter({
  x,
  y,
  s = 1,
  flip = false,
  top,
  legs,
  hair,
  lean = 0,
  tilt = 0,
  hand = [19, -38],
  children,
}: {
  x: number;
  y: number;
  s?: number;
  flip?: boolean;
  top: string;
  legs: string;
  hair: string;
  lean?: number;
  tilt?: number;
  hand?: [number, number];
  children?: ReactNode;
}) {
  const sw = 1.5 / s;
  return (
    <G transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      <Tube
        fill={legs}
        parts={[
          ['M-2 -32 L17 -32', 8],
          ['M17 -32 L19 -5', 7],
        ]}
      />
      <Ellipse cx={23} cy={-1.4} rx={6.4} ry={2.8} fill={BEAR_LINE} />
      <G transform={`rotate(${lean} 0 -32)`}>
        <Path d="M-10 -30 L-8 -56 Q-8 -64 1 -64 Q10 -64 9 -56 L9 -30 Z" fill={top} stroke={BEAR_LINE} strokeWidth={sw} strokeLinejoin="round" />
        <Tube fill={top} parts={[[`M0 -57 L7 -44 L${hand[0]} ${hand[1]}`, 5]]} />
        <Hand x={hand[0]} y={hand[1]} />
        {children}
        <G transform={`rotate(${tilt} 1 -64)`}>
          <Path d="M-8 -73 Q-9 -84 1 -84 Q11 -84 10 -73 L11 -58 Q5 -62 3 -68 L-1 -68 Q-5 -62 -9 -58 Z" fill={hair} stroke={BEAR_LINE} strokeWidth={sw * 0.7} />
          <Circle cx={1} cy={-73} r={8.5} fill={SKIN} stroke={BEAR_LINE} strokeWidth={sw} />
          <Path d="M-7.6 -74 Q-7.4 -83 1 -83 Q9.6 -82.6 9.6 -74 Q5 -78 1 -77.5 Q-4 -78 -7.6 -74 Z" fill={hair} />
          <Circle cx={5} cy={-72} r={1.5} fill={BEAR_LINE} />
          <Path d="M3.4 -68 Q5.4 -67 7.4 -68.4" stroke={BEAR_LINE} strokeWidth={1} fill="none" strokeLinecap="round" />
        </G>
      </G>
    </G>
  );
}
function Two({ k }: { k: Ink }) {
  void k;
  const run = useRun(300, 1800);
  const glow = 0.18 + 0.1 * Math.sin(run * Math.PI);
  return (
    <Frame label="Two women sit together on a sofa. One holds her newborn baby in her lap, and the other leans in close, listening with kind understanding">
      <Sky fill="#D9B98A" />
      <Rect x={26} y={26} width={48} height={58} rx={3} fill="#BFE6F5" stroke={WOOD_D} strokeWidth={2.5} />
      <Path d="M50 26 L50 84 M26 55 L74 55" stroke={WOOD_D} strokeWidth={2} />
      <Circle cx={62} cy={38} r={5} fill={GOLD} />
      <Floor y={132} fill="#7A4F32" />
      <Rect x={10} y={128} width={280} height={5} fill="#8E5E3C" />
      <Ellipse cx={152} cy={104} rx={88} ry={50} fill={GOLD} opacity={glow} />
      <Ellipse cx={152} cy={162} rx={114} ry={8} fill="#9B3B3B" opacity={0.85} />
      {/* the sofa */}
      <G stroke={BEAR_LINE} strokeWidth={1.4} strokeLinejoin="round">
        <Rect x={90} y={92} width={126} height={40} rx={10} fill="#6B7C5A" />
        <Rect x={84} y={104} width={14} height={40} rx={7} fill="#5A6C4A" />
        <Rect x={208} y={104} width={14} height={40} rx={7} fill="#5A6C4A" />
        <Rect x={90} y={127} width={126} height={16} rx={7} fill="#7F9468" />
        <Rect x={92} y={143} width={5} height={14} fill={WOOD_D} />
        <Rect x={209} y={143} width={5} height={14} fill={WOOD_D} />
      </G>
      <Sitter x={122} y={158} s={1.1} top="#D9822B" legs="#3C5A8A" hair="#4A3426" lean={-2} tilt={14} hand={[14, -36]}>
        {/* the newborn in a blanket, held in her lap */}
        <G transform="rotate(-14 13 -31)">
          <Ellipse cx={13} cy={-31} rx={11} ry={6} fill="#FBE3E6" stroke={BEAR_LINE} strokeWidth={1.2} />
          <Circle cx={22} cy={-33} r={4.6} fill={SKIN} stroke={BEAR_LINE} strokeWidth={1.1} />
          <Path d="M18.6 -35 Q22 -39 25.4 -35" stroke="#6A4A30" strokeWidth={1.4} fill="none" strokeLinecap="round" />
        </G>
      </Sitter>
      <Sitter x={182} y={158} s={1.1} flip top="#7A4FA0" legs="#4A3A66" hair="#8A5A2B" lean={13} tilt={4} hand={[20, -38]} />
      <Heart x={152} y={74} />
    </Frame>
  );
}
function Heart({ x, y }: { x: number; y: number }) {
  return (
    <G transform={`translate(${x} ${y})`}>
      <Circle cx={0} cy={0} r={13} fill={GOLD} opacity={0.22} />
      <Path d="M0 6 C-12 -3 -7 -12 0 -6 C7 -12 12 -3 0 6 Z" fill={HEART} stroke={BEAR_LINE} strokeWidth={1.3} strokeLinejoin="round" />
    </G>
  );
}

/* ---------- 9. a circle of chairs ---------- */
type Pose = 'rest' | 'speak' | 'reach';
/* a person seen from the front, sitting on a chair: seat at (0, 0), feet at 27. reach is where the near hand goes (own space) */
function Seat3({
  x,
  y,
  s = 1,
  shirt,
  pants,
  hair,
  pose = 'rest',
  reach = [-27, -44],
  down = 0,
  long = false,
}: {
  x: number;
  y: number;
  s?: number;
  shirt: string;
  pants: string;
  hair: string;
  pose?: Pose;
  reach?: [number, number];
  down?: number;
  long?: boolean;
}) {
  const sw = 1.5 / s;
  const armL = pose === 'reach' ? `M-10 -36 L${reach[0]} ${reach[1]}` : 'M-10 -36 L-14 -18 L-8 -4';
  const handL = pose === 'reach' ? reach : [-8, -4];
  const armR = pose === 'speak' ? 'M10 -36 L24 -28 L26 -46' : 'M10 -36 L14 -18 L8 -4';
  const handR = pose === 'speak' ? [26, -46] : [8, -4];
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <G stroke={BEAR_LINE} strokeWidth={1.3} strokeLinejoin="round" fill={WOOD}>
        <Rect x={-15} y={-52} width={30} height={46} rx={5} />
        <Rect x={-15} y={-4} width={30} height={5} rx={2} />
        <Rect x={-13} y={1} width={3} height={26} fill={WOOD_D} />
        <Rect x={10} y={1} width={3} height={26} fill={WOOD_D} />
      </G>
      <Tube
        fill={pants}
        parts={[
          ['M-6 -3 L-7 24', 8],
          ['M6 -3 L7 24', 8],
        ]}
      />
      <Ellipse cx={-7} cy={26} rx={6} ry={2.6} fill={BEAR_LINE} />
      <Ellipse cx={7} cy={26} rx={6} ry={2.6} fill={BEAR_LINE} />
      <Path d="M-11 -2 L-9 -34 Q-9 -42 0 -42 Q9 -42 9 -34 L11 -2 Z" fill={shirt} stroke={BEAR_LINE} strokeWidth={sw} strokeLinejoin="round" />
      <Tube fill={shirt} parts={[[armL, 5]]} />
      <Hand x={handL[0]} y={handL[1]} />
      <Tube fill={shirt} parts={[[armR, 5]]} />
      <Hand x={handR[0]} y={handR[1]} />
      <G transform={`translate(0 ${down * 0.3}) rotate(${down} 0 -42)`}>
        {long ? (
          <Path
            d="M-9 -50 Q-9.6 -62 0 -62 Q9.6 -62 9 -50 L10 -38 Q6 -42 5 -48 L-5 -48 Q-6 -42 -10 -38 Z"
            fill={hair}
            stroke={BEAR_LINE}
            strokeWidth={sw * 0.7}
          />
        ) : null}
        <Circle cx={0} cy={-50} r={8.5} fill={SKIN} stroke={BEAR_LINE} strokeWidth={sw} />
        <Path d="M-8.6 -51 Q-8.4 -60 0 -60 Q8.6 -59.6 8.6 -51 Q4 -55 0 -54.5 Q-5 -55 -8.6 -51 Z" fill={hair} />
        <Circle cx={-3} cy={-49.4} r={1.2} fill={BEAR_LINE} />
        <Circle cx={3} cy={-49.4} r={1.2} fill={BEAR_LINE} />
        <Path d="M-2.4 -45 Q0 -43.2 2.4 -45" stroke={BEAR_LINE} strokeWidth={1} fill="none" strokeLinecap="round" />
      </G>
    </G>
  );
}
/* an empty chair seen from behind, at the near side of the circle */
function ChairBack({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`} stroke={BEAR_LINE} strokeWidth={1.4} strokeLinejoin="round">
      <Rect x={-12} y={-6} width={3.4} height={16} fill={WOOD_D} />
      <Rect x={9} y={-6} width={3.4} height={16} fill={WOOD_D} />
      <Rect x={-15} y={-38} width={30} height={34} rx={5} fill={WOOD} />
      <Rect x={-15} y={-8} width={30} height={5} rx={2} fill="#C99058" />
    </G>
  );
}
function Group({ k }: { k: Ink }) {
  void k;
  const run = useRun(300, 1800);
  const talk = 0.35 + 0.3 * Math.sin(run * Math.PI);
  return (
    <Frame label="A meeting room with chairs set in a circle. One person in the middle of the far side speaks with a hand raised, while the others listen. Beside a newcomer with a lowered head, another person rests a hand on their shoulder">
      <Sky fill="#D9B98A" />
      <Rect x={150} y={24} width={46} height={32} rx={2} fill="#F3E3BC" stroke={WOOD_D} strokeWidth={2.4} />
      <Path d="M154 52 L168 36 L178 46 L186 38 L192 52 Z" fill="#6E9A6A" />
      <Rect x={26} y={26} width={48} height={52} rx={3} fill="#BFE6F5" stroke={WOOD_D} strokeWidth={2.5} />
      <Path d="M50 26 L50 78 M26 52 L74 52" stroke={WOOD_D} strokeWidth={2} />
      <Floor y={120} fill="#9B7B55" />
      <Path d="M10 120 L290 120" stroke="#7A5A3A" strokeWidth={2} />
      <Ellipse cx={148} cy={138} rx={106} ry={24} fill="#A9503F" opacity={0.9} />
      <Ellipse cx={148} cy={138} rx={92} ry={19} fill="none" stroke={GOLD} strokeWidth={1.4} opacity={0.6} />
      <Circle cx={148} cy={86} r={44} fill={GOLD} opacity={0.14} />
      <Seat3 x={46} y={128} s={0.95} shirt="#5C7C8A" pants="#3C5A8A" hair="#2E2018" />
      <Seat3 x={90} y={110} s={0.9} shirt="#C27A8A" pants="#4A3A66" hair="#6A4A30" long />
      <Seat3 x={136} y={101} s={0.9} shirt="#D9822B" pants="#3A3F50" hair="#8A8A8E" pose="speak" />
      <Path d="M114 62 Q108 68 114 74 M158 62 Q164 68 158 74" stroke={BEAR_LINE} strokeWidth={1.6} fill="none" strokeLinecap="round" opacity={talk} />
      <Seat3 x={182} y={102} s={0.9} shirt="#7A8A4A" pants="#4A4A5E" hair="#3A2A20" down={14} />
      <Seat3 x={222} y={113} s={0.95} shirt="#7A4FA0" pants="#5C4A3A" hair="#4A3426" long pose="reach" reach={[-28, -45]} />
      <Seat3 x={262} y={132} s={0.95} shirt="#2FA39A" pants="#3A3F50" hair="#2E2018" />
      <ChairBack x={110} y={161} s={0.9} />
      <ChairBack x={196} y={161} s={0.9} />
    </Frame>
  );
}

/* ---------- 10. two hands ---------- */
function Hands({ k }: { k: Ink }) {
  void k;
  const run = useRun(300, 1800);
  const e = 1 - (1 - run) * (1 - run);
  const glow = 0.26 + 0.14 * Math.sin(run * Math.PI);
  const rays: [number, number, number, number][] = [
    [150, 52, 150, 38],
    [112, 70, 102, 60],
    [188, 70, 198, 60],
    [100, 104, 86, 104],
    [200, 104, 214, 104],
    [114, 140, 104, 150],
    [186, 140, 196, 150],
  ];
  return (
    <Frame label="Two hands clasped in the middle of the picture. One reaches down from above, from a rust sleeve, and one reaches up from below, from a teal sleeve, and a warm glow gathers where they hold each other">
      <Sky fill="#3A3566" />
      <Circle cx={150} cy={100} r={64} fill={GOLD} opacity={glow * 0.7} />
      <Circle cx={150} cy={100} r={36} fill={GOLD} opacity={glow} />
      {rays.map(([x1, y1, x2, y2], i) => (
        <Line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#FFF1B8" strokeWidth={2.4} strokeLinecap="round" opacity={0.7 * e} />
      ))}
      <Defs>
        <ClipPath id="i12-hands-clip">
          <Rect x={10} y={10} width={280} height={162} rx={12} />
        </ClipPath>
      </Defs>
      <G clipPath="url(#i12-hands-clip)">
        <G transform="translate(150 100) scale(1.4) translate(-150 -100)">
          {/* the arm from above, and its fingers that curl under */}
          <Tube fill="#B5532A" parts={[['M96 6 L130 66', 28]]} />
          <Tube fill="#7A3418" parts={[['M127 62 L133 72', 30]]} />
          <Tube fill={SKIN} parts={[['M133 70 L142 86', 15]]} />
          <Tube
            fill={SKIN}
            parts={[
              ['M148 104 Q160 112 164 124', 6],
              ['M154 100 Q168 106 174 118', 6],
              ['M158 94 Q172 98 180 108', 6],
            ]}
          />
          <Ellipse cx={150} cy={98} rx={16} ry={13} fill={SKIN} stroke={BEAR_LINE} strokeWidth={1.5} transform="rotate(30 150 98)" />
          {/* the arm from below, with fingers that wrap up over the other hand */}
          <Tube fill="#2FA39A" parts={[['M214 178 L180 120', 28]]} />
          <Tube fill="#1B6E67" parts={[['M182 124 L176 114', 30]]} />
          <Tube fill={SKIN} parts={[['M176 114 L168 102', 15]]} />
          <Ellipse cx={156} cy={104} rx={15} ry={12} fill={SKIN} stroke={BEAR_LINE} strokeWidth={1.5} transform="rotate(30 156 104)" />
          <Tube
            fill={SKIN}
            parts={[
              ['M148 100 Q132 94 130 80', 6],
              ['M146 106 Q130 104 124 92', 6],
              ['M148 112 Q132 114 124 104', 6],
            ]}
          />
          <Tube fill={SKIN} parts={[['M140 86 Q148 90 156 96', 6]]} />
        </G>
      </G>
    </Frame>
  );
}

export const SCENES_I12: Record<string, ComponentType<{ k: Ink }>> = {
  'g12-tombs': Tombs,
  'g12-sitting': Sitting,
  'g12-boat': Boat,
  'g12-home': Home,
  'g12-towns': Towns,
  'g12-pass': Pass,
  'g12-waters': Waters,
  'g12-two': Two,
  'g12-group': Group,
  'g12-hands': Hands,
};
