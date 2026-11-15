/* Scenes for lesson g8, "Tempted is not fallen" (see story-kit.tsx and story-scenes-f-l31.tsx for the approach): Jesus alone in the dry wilderness, the three pulls
   floating beside Him as bubbles with a soft dark swirl for the tempter (never a face, never frightening), the swirl leaving and two angels of light arriving with
   bread and water, then the same truth in other pictures: a wave that rises and passes a person who stays standing, thieves knocking at a door that stays shut
   while the teapot stays on the shelf, birds flying over a head with a crossed-out nest, and a scale that wrongly weighs a thought as heavy as a deed.
   Jesus always wears a white robe with a red sash (as in lesson g6); the angels a pale gold robe with white wings and a halo; the people of today a plain shirt and
   trousers. Every figure carries a dark outline so it reads on a dark card and a cream one alike. */
import { type ComponentType, type ReactNode, useEffect, useState } from 'react';
import { Easing } from 'react-native';
import { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';

import { useAppear, useReducedMotion } from '@/lib/motion';

import { BEAR_LINE, Frame, type Ink, Say } from './story-kit';

const SKIN = '#E7B98F';
const HAIR = '#3A2A20';
const GOLD = '#FFD25A';
const GOLD_D = '#C98F1A';
const CREAM = '#FFF5E1';
const WOOD = '#B07A45';
const WOOD_D = '#5E3A1A';
const EDGE = '#8A6A3A';
const SAND_D = '#D2A86A';
const WHITE = '#F8F4EA';
const RED = '#C23A3A';
const SWIRL = '#3E3466';
const BREAD = '#D9983A';
const BREAD_D = '#9A6420';
const ROCK = '#A8967C';
const ROCK_D = '#7A6A52';
const SHIRT_ORANGE = '#E0772E';
const SHIRT_GREEN = '#3E8E4F';
const PANTS = '#3C5A8A';

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

/* thick rounded strokes with one outline around the whole shape: every outline first, then every fill, so inner joins stay clear */
function Tube({ parts, fill, line = BEAR_LINE }: { parts: [string, number][]; fill: string; line?: string }) {
  return (
    <G fill="none" strokeLinecap="round" strokeLinejoin="round">
      {parts.map(([d, w], i) => (
        <Path key={`o${i}`} d={d} stroke={line} strokeWidth={w + 3} />
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

/* ---------- people of the story ---------- */
const BODY = 'M-13 0 L-9 -33 Q-9 -42 0 -42 Q9 -42 9 -33 L13 0 Z';
type Arm = [number, number, number];
const ARMS_DOWN: Arm[] = [
  [-9, -12, -17],
  [9, 12, -17],
];

/* the head of a person in a long robe, drawn with its centre at (0, -49); tilt turns it (negative looks up) */
function Head({
  tilt = 0,
  glance = 0,
  sw,
  hair,
  beard = false,
  longHair = false,
  band,
}: {
  tilt?: number;
  glance?: number;
  sw: number;
  hair: string;
  beard?: boolean;
  longHair?: boolean;
  band?: string;
}) {
  return (
    <G transform={`rotate(${tilt} 0 -42)`}>
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
      {band ? <Path d="M-8.3 -53 Q0 -57.5 8.3 -53" stroke={band} strokeWidth={2.6} fill="none" strokeLinecap="round" /> : null}
      {beard ? <Path d="M-6.4 -46 Q0 -36 6.4 -46 Q4.6 -42 0 -40.6 Q-4.6 -42 -6.4 -46 Z" fill={hair} stroke={BEAR_LINE} strokeWidth={sw * 0.6} /> : null}
      <Circle cx={4} cy={-48 + glance} r={1.5} fill={BEAR_LINE} />
    </G>
  );
}

/* a person in a long robe, standing on (x, y), facing right (flip turns them). arms are [shoulder x, hand x, hand y] in the person's own space */
function Robed({
  x,
  y,
  s = 1,
  flip = false,
  robe,
  sash,
  hair = HAIR,
  beard = false,
  longHair = false,
  arms = ARMS_DOWN,
  tilt = 0,
  glance = 0,
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
  arms?: Arm[];
  tilt?: number;
  glance?: number;
  children?: ReactNode;
}) {
  const sw = 1.5 / s;
  return (
    <G transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      <Ellipse cx={-5.5} cy={0.5} rx={4.4} ry={2} fill={BEAR_LINE} />
      <Ellipse cx={6} cy={0.5} rx={4.4} ry={2} fill={BEAR_LINE} />
      <Path d={BODY} fill={robe} stroke={BEAR_LINE} strokeWidth={sw} strokeLinejoin="round" />
      {sash ? (
        <G>
          <Path d="M-10.4 -22 L10.4 -22" stroke={sash} strokeWidth={3.6} />
          <Path d="M4 -22 L6.5 -9" stroke={sash} strokeWidth={3} strokeLinecap="round" />
          <Path d={BODY} fill="none" stroke={BEAR_LINE} strokeWidth={sw} strokeLinejoin="round" />
        </G>
      ) : null}
      {arms.map(([sx, hx, hy], i) => (
        <G key={i}>
          <Tube fill={robe} parts={[[`M${sx} -34 L${hx} ${hy}`, 5]]} />
          <Hand x={hx} y={hy} />
        </G>
      ))}
      {children}
      <Head tilt={tilt} glance={glance} sw={sw} hair={hair} beard={beard} longHair={longHair} />
    </G>
  );
}
function Jesus({ x, y, s = 1, flip = false, tilt = 0, arms }: { x: number; y: number; s?: number; flip?: boolean; tilt?: number; arms?: Arm[] }) {
  return <Robed x={x} y={y} s={s} flip={flip} tilt={tilt} arms={arms} robe={WHITE} sash={RED} hair="#6B4A2E" beard longHair />;
}

/* Jesus sitting on a rock, thin and tired: (x, y) is the seat, He faces right and His head is bowed (tilt) */
function SeatedJesus({ x, y, s = 1, tilt = 0 }: { x: number; y: number; s?: number; tilt?: number }) {
  const sw = 1.5 / s;
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Tube
        fill={WHITE}
        parts={[
          ['M2 -3 L19 -7', 9],
          ['M19 -7 L22 11', 8],
        ]}
      />
      <Ellipse cx={25} cy={13.5} rx={5.6} ry={2.4} fill={BEAR_LINE} />
      <Path d="M-9 0 L-8 -26 Q-8 -34 0 -34 Q8 -34 8 -26 L9 0 Z" fill={WHITE} stroke={BEAR_LINE} strokeWidth={sw} strokeLinejoin="round" />
      <Path d="M-8.4 -14 L8.6 -14" stroke={RED} strokeWidth={3.4} />
      <Path d="M3 -14 L5 -3" stroke={RED} strokeWidth={2.8} strokeLinecap="round" />
      <Path d="M-9 0 L-8 -26 Q-8 -34 0 -34 Q8 -34 8 -26 L9 0 Z" fill="none" stroke={BEAR_LINE} strokeWidth={sw} strokeLinejoin="round" />
      <Tube
        fill={WHITE}
        parts={[
          ['M2 -29 L13 -14', 4.8],
          ['M13 -14 L20 -9', 4.4],
        ]}
      />
      <Hand x={21} y={-8} r={3.3} />
      <G transform="translate(1 8)">
        <Head tilt={tilt} sw={sw} hair="#6B4A2E" beard longHair />
      </G>
    </G>
  );
}

/* a person of today: a plain shirt and trousers, facing right (flip turns them); stride opens the legs for walking; arms are [shoulder x, hand x, hand y] */
function Modern({
  x,
  y,
  s = 1,
  flip = false,
  shirt,
  pants = PANTS,
  hair = HAIR,
  arms = [
    [-5, -9, -30],
    [5, 9, -30],
  ],
  tilt = 0,
  stride = 0,
  smile = false,
}: {
  x: number;
  y: number;
  s?: number;
  flip?: boolean;
  shirt: string;
  pants?: string;
  hair?: string;
  arms?: Arm[];
  tilt?: number;
  stride?: number;
  smile?: boolean;
}) {
  const sw = 1.5 / s;
  return (
    <G transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      <Tube
        fill={pants}
        parts={[
          [`M-4 -26 L${-4 - stride} -4`, 6.4],
          [`M4 -26 L${4 + stride} -4`, 6.4],
        ]}
      />
      <Ellipse cx={-3 - stride} cy={-1} rx={6.4} ry={2.7} fill={BEAR_LINE} />
      <Ellipse cx={5 + stride} cy={-1} rx={6.4} ry={2.7} fill={BEAR_LINE} />
      <Path d="M-12 -24 L-10 -50 Q-10 -57 0 -57 Q10 -57 10 -50 L12 -24 Z" fill={shirt} stroke={BEAR_LINE} strokeWidth={sw} strokeLinejoin="round" />
      {arms.map(([sx, hx, hy], i) => (
        <G key={i}>
          <Tube fill={shirt} parts={[[`M${sx} -52 L${hx} ${hy}`, 5.4]]} />
          <Hand x={hx} y={hy} r={3.4} />
        </G>
      ))}
      <G transform={`rotate(${tilt} 0 -57)`}>
        <Circle cx={0} cy={-65} r={8.5} fill={SKIN} stroke={BEAR_LINE} strokeWidth={sw} />
        <Path d="M-8.6 -66 Q-8.4 -75 0 -75 Q8.6 -74.6 8.6 -66 Q4 -70 0 -69.5 Q-5 -70 -8.6 -66 Z" fill={hair} />
        <Circle cx={4} cy={-64} r={1.5} fill={BEAR_LINE} />
        {smile ? <Path d="M2 -60.4 Q5 -58.4 7.4 -60.6" stroke={BEAR_LINE} strokeWidth={1.1} fill="none" strokeLinecap="round" /> : null}
      </G>
    </G>
  );
}

/* the tempter: only ever a soft dark swirl with wisps, never a face or a body */
function Swirl({ x, y, s = 1, o = 1 }: { x: number; y: number; s?: number; o?: number }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
      <Ellipse cx={2} cy={-2} rx={30} ry={24} fill={SWIRL} opacity={0.2} />
      <Ellipse cx={2} cy={-2} rx={20} ry={16} fill={SWIRL} opacity={0.2} />
      <Path
        d="M0 0 Q9 -4 11 3 Q11 14 -1 15 Q-15 14 -16 0 Q-15 -19 3 -21 Q23 -20 25 -2"
        stroke={SWIRL}
        strokeWidth={5}
        fill="none"
        strokeLinecap="round"
        opacity={0.8}
      />
      <Path d="M25 -2 Q32 4 40 -1 M-16 0 Q-26 4 -34 -2 M3 -21 Q8 -30 17 -30" stroke={SWIRL} strokeWidth={3} fill="none" strokeLinecap="round" opacity={0.5} />
    </G>
  );
}

/* a messenger of light: pale gold robe, white wings, a halo; (x, y) is where the feet would be, floating a little; faces right (flip turns them) */
function Angel({ x, y, s = 1, flip = false, arms, children }: { x: number; y: number; s?: number; flip?: boolean; arms: Arm[]; children?: ReactNode }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      <Circle cx={0} cy={-30} r={42} fill={GOLD} opacity={0.26} />
      <Circle cx={0} cy={-30} r={28} fill={GOLD} opacity={0.26} />
      <Ellipse cx={0} cy={6} rx={14} ry={3} fill={GOLD_D} opacity={0.3} />
      <Path
        d="M-2 -34 Q-22 -68 -40 -54 Q-34 -48 -38 -42 Q-30 -40 -30 -32 Q-18 -32 -2 -22 Z"
        transform="translate(9 -2)"
        fill="#EFE2BC"
        stroke={BEAR_LINE}
        strokeWidth={1.3}
        strokeLinejoin="round"
      />
      <Path
        d="M-2 -34 Q-22 -68 -40 -54 Q-34 -48 -38 -42 Q-30 -40 -30 -32 Q-18 -32 -2 -22 Z"
        fill="#FFFDF5"
        stroke={BEAR_LINE}
        strokeWidth={1.3}
        strokeLinejoin="round"
      />
      <Path d="M-14 -44 Q-26 -50 -33 -48 M-12 -38 Q-22 -40 -29 -38" stroke="#D9CBA0" strokeWidth={1.2} fill="none" strokeLinecap="round" />
      <Robed x={0} y={0} s={1} robe="#FFF1C8" sash={GOLD_D} hair="#D9A441" arms={arms} tilt={-4} />
      <Ellipse cx={0} cy={-64.5} rx={8.4} ry={2.8} fill="none" stroke={BEAR_LINE} strokeWidth={4.6} />
      <Ellipse cx={0} cy={-64.5} rx={8.4} ry={2.8} fill="none" stroke={GOLD} strokeWidth={2.4} />
      {children}
    </G>
  );
}

/* ---------- the wilderness ---------- */
/* dry hills at dusk (or morning when the sky is lighter): far and near ridges, the sun low behind them, sandy ground from y 140 with a few dry sticks */
function Wilderness({ sky = '#F2C084', sunX = 236, sunY = 84 }: { sky?: string; sunX?: number; sunY?: number }) {
  return (
    <G>
      <Rect x={10} y={10} width={280} height={162} rx={12} fill={sky} />
      <Circle cx={sunX} cy={sunY} r={24} fill={GOLD} opacity={0.3} />
      <Circle cx={sunX} cy={sunY} r={13} fill={GOLD} />
      <Path d="M10 112 Q50 84 96 104 Q140 78 190 100 Q240 80 290 106 L290 142 L10 142 Z" fill="#D9A86A" />
      <Path d="M10 130 Q70 106 130 126 Q190 110 290 128 L290 152 L10 152 Z" fill="#C48B52" />
      <Path d="M10 140 L290 140 L290 160 Q290 172 278 172 L22 172 Q10 172 10 160 Z" fill={SAND_D} />
      <Path d="M10 152 Q120 144 290 150 L290 160 Q290 172 278 172 L22 172 Q10 172 10 160 Z" fill="#E4CB98" opacity={0.7} />
      <G stroke="#7A5A34" strokeWidth={1.6} strokeLinecap="round" fill="none">
        <Path d="M32 156 L28 146 M32 156 L33 144 M32 156 L37 147 M30 151 L25 149" />
        <Path d="M262 150 L259 142 M262 150 L264 141 M262 150 L267 143" />
      </G>
      <G fill="#B89A74" stroke={EDGE} strokeWidth={1}>
        <Ellipse cx={206} cy={160} rx={8} ry={3.4} />
        <Ellipse cx={150} cy={166} rx={5} ry={2.2} />
        <Ellipse cx={278} cy={164} rx={6} ry={2.6} />
      </G>
      <Path d="M170 150 L178 154 L186 150 M226 158 L233 162" stroke="#B88A55" strokeWidth={1.2} fill="none" strokeLinecap="round" />
    </G>
  );
}

/* the rock He sits on: its top is at y 127, from x 74 to 112 */
function SeatRock() {
  return (
    <G strokeLinejoin="round">
      <Path d="M62 152 Q60 134 74 128 L108 126 Q116 130 116 152 Z" fill={ROCK} stroke={BEAR_LINE} strokeWidth={1.5} />
      <Path d="M70 140 Q76 134 86 134 M96 138 Q104 138 108 142" stroke={ROCK_D} strokeWidth={1.6} fill="none" strokeLinecap="round" />
    </G>
  );
}

/* ---------- 1. alone in the wilderness ---------- */
function Desert({ k }: { k: Ink }) {
  void k;
  const p = useRun(200, 2400);
  return (
    <Frame label="Jesus sits alone on a rock in dry wilderness hills at sunset, thin and tired, His head bowed and His hands resting on His knee, with nobody near">
      <Wilderness sunY={78 + 8 * p} />
      <SeatRock />
      <SeatedJesus x={96} y={127} s={1.15} tilt={22} />
      <G stroke={BEAR_LINE} strokeWidth={1} fill="none" strokeLinecap="round" opacity={0.35}>
        <Path d="M170 124 Q180 120 190 124 M196 118 Q204 114 212 118" />
      </G>
    </Frame>
  );
}

/* ---------- 2. the three pulls ---------- */
function Bubble({ cx, cy, r, p, children }: { cx: number; cy: number; r: number; p: number; children: ReactNode }) {
  return (
    <G transform={`translate(${cx} ${cy}) scale(${0.6 + 0.4 * p})`} opacity={p}>
      <Circle r={r} fill={CREAM} stroke={BEAR_LINE} strokeWidth={2} />
      {children}
    </G>
  );
}
/* three stones that look like loaves */
function LoafStones() {
  return (
    <G stroke={BEAR_LINE} strokeWidth={1.2} strokeLinejoin="round">
      <Ellipse cx={-8} cy={6} rx={9} ry={6} fill={BREAD} />
      <Ellipse cx={8} cy={4} rx={9} ry={6} fill={BREAD} />
      <Ellipse cx={0} cy={-6} rx={9} ry={6} fill={BREAD} />
      <Path d="M-11 4 L-8 8 M-7 3 L-4 7 M5 2 L8 6 M9 1 L12 5 M-3 -8 L0 -4 M1 -9 L4 -5" stroke={BREAD_D} strokeWidth={1.1} fill="none" strokeLinecap="round" />
    </G>
  );
}
/* the high pinnacle of a temple on a rocky peak */
function Pinnacle() {
  return (
    <G stroke={BEAR_LINE} strokeWidth={1.2} strokeLinejoin="round">
      <Path d="M-18 16 L-8 2 L8 2 L18 16 Z" fill={ROCK} />
      <Rect x={-6} y={-6} width={12} height={8} fill="#E8D5A8" />
      <Path d="M-8 -6 L0 -18 L8 -6 Z" fill={GOLD} />
      <Rect x={-2} y={-3.4} width={4} height={5.4} rx={2} fill={WOOD_D} />
    </G>
  );
}
/* a sweep of kingdoms: green hills, three tiny castles with flags, a crown above */
function Kingdoms() {
  const castle = (x: number, h: number, flag: string, i: number) => (
    <G key={i} stroke={BEAR_LINE} strokeWidth={1}>
      <Rect x={x - 4} y={10 - h} width={8} height={h} fill="#E8D5A8" />
      <Path
        d={`M${x - 4} ${10 - h} L${x - 4} ${7 - h} L${x - 2} ${7 - h} L${x - 2} ${9 - h} L${x} ${9 - h} L${x} ${7 - h} L${x + 2} ${7 - h} L${x + 2} ${9 - h} L${x + 4} ${9 - h} L${x + 4} ${10 - h} Z`}
        fill="#E8D5A8"
      />
      <Path d={`M${x} ${7 - h} L${x} ${1 - h}`} />
      <Path d={`M${x} ${1 - h} L${x + 5} ${3 - h} L${x} ${5 - h} Z`} fill={flag} stroke="none" />
    </G>
  );
  return (
    <G>
      <Path d="M-20 16 Q-14 6 -6 12 Q2 4 10 12 Q16 8 20 14 L20 18 L-20 18 Z" fill="#6FA86A" stroke={BEAR_LINE} strokeWidth={1.2} strokeLinejoin="round" />
      {castle(-11, 11, RED, 0)}
      {castle(0, 17, '#3F63B8', 1)}
      {castle(11, 12, GOLD_D, 2)}
      <Path d="M-6 -13 L-5 -19 L-2 -15 L0 -20 L2 -15 L5 -19 L6 -13 Z" fill={GOLD} stroke={BEAR_LINE} strokeWidth={1} strokeLinejoin="round" />
    </G>
  );
}
function Stones({ k }: { k: Ink }) {
  void k;
  const p1 = useRun(300, 900);
  const p2 = useRun(900, 900);
  const p3 = useRun(1500, 900);
  return (
    <Frame label="Standing in the wilderness, Jesus looks up at three floating bubbles beside a soft dark swirl: stones that look like loaves of bread, the high pinnacle of a temple, and a sweep of kingdoms">
      <Wilderness />
      <Jesus x={58} y={158} s={1.2} tilt={-8} />
      <Swirl x={106} y={62} s={0.8} />
      <G fill={SWIRL} opacity={0.55}>
        <Circle cx={128} cy={72} r={2} />
        <Circle cx={138} cy={82} r={2.8} />
      </G>
      <Bubble cx={162} cy={108} r={22} p={p1}>
        <LoafStones />
      </Bubble>
      <Bubble cx={206} cy={58} r={24} p={p2}>
        <Pinnacle />
      </Bubble>
      <Bubble cx={256} cy={104} r={23} p={p3}>
        <Kingdoms />
      </Bubble>
    </Frame>
  );
}

/* ---------- 3. the swirl leaves, angels come ---------- */
function Loaf() {
  return (
    <G>
      <Ellipse cx={0} cy={2} rx={11} ry={3.2} fill={CREAM} stroke={BEAR_LINE} strokeWidth={1.2} />
      <Ellipse cx={0} cy={-2} rx={8.6} ry={5.2} fill={BREAD} stroke={BEAR_LINE} strokeWidth={1.2} />
      <Path d="M-4 -4 L-2 0 M0 -5 L2 -1 M4 -4 L5 -1" stroke={BREAD_D} strokeWidth={1.1} fill="none" strokeLinecap="round" />
    </G>
  );
}
function Cup() {
  return (
    <G strokeLinejoin="round">
      <Path d="M-7 -12 L-6 2 Q0 5 6 2 L7 -12 Z" fill="#CFE6F2" stroke={BEAR_LINE} strokeWidth={1.2} />
      <Path d="M-6.6 -8 L6.6 -8 L6.1 1.4 Q0 4 -6 1.4 Z" fill="#5AA5CF" />
      <Ellipse cx={0} cy={-12} rx={7} ry={2} fill="#CFE6F2" stroke={BEAR_LINE} strokeWidth={1.1} />
    </G>
  );
}
function Angels({ k }: { k: Ink }) {
  void k;
  const p = useRun(200, 1800);
  return (
    <Frame label="The soft dark swirl drifts away at the left edge of the wilderness while two angels of soft light arrive, one offering bread and the other water to Jesus, who sits on the rock and looks up">
      <Wilderness sky="#F8DDA6" sunX={246} sunY={64} />
      <Swirl x={40 - 14 * p} y={84} s={0.7} o={1 - 0.55 * p} />
      <SeatRock />
      <SeatedJesus x={96} y={127} s={1.15} tilt={-12} />
      <Angel x={176 + 22 * (1 - p)} y={144 - 6 * (1 - p)} s={0.95} flip arms={[[3, 22, -24]]}>
        <G transform="translate(27 -34)">
          <Loaf />
        </G>
      </Angel>
      <Angel x={246 + 26 * (1 - p)} y={130 - 10 * (1 - p)} s={0.85} flip arms={[[3, 22, -26]]}>
        <G transform="translate(27 -34)">
          <Cup />
        </G>
      </Angel>
    </Frame>
  );
}

/* ---------- 4. the wave that passes ---------- */
function Wave({ k }: { k: Ink }) {
  void k;
  const p = useRun(200, 1800);
  const rise = 0.5 + 0.5 * p;
  return (
    <Frame label="A person stands on the shore as a very large wave rises behind them and curls past, and they stay standing, with calm water and sand around their feet">
      <Rect x={10} y={10} width={280} height={162} rx={12} fill="#9ED3E6" />
      <Circle cx={252} cy={40} r={22} fill={GOLD} opacity={0.3} />
      <Circle cx={252} cy={40} r={12} fill={GOLD} />
      <Rect x={10} y={126} width={280} height={30} fill="#4F8FB8" />
      <G transform={`translate(0 150) scale(1 ${rise}) translate(0 -150)`}>
        <Path
          d="M290 128 C240 126 208 118 188 92 C172 68 154 46 122 44 C94 42 78 62 86 80 C90 70 102 66 110 72 C104 84 100 100 88 112 C70 126 38 128 10 128 L10 150 L290 150 Z"
          fill="#3A7FAA"
          stroke={BEAR_LINE}
          strokeWidth={1.8}
          strokeLinejoin="round"
        />
        <Path d="M110 72 C102 66 90 70 86 80 C84 88 88 94 94 96 C104 92 108 82 110 72 Z" fill="#2B628A" />
        <Path
          d="M96 52 C106 42 126 40 140 48 M148 54 C160 58 168 68 176 80 M82 66 Q86 58 94 54"
          stroke="#E8F6FA"
          strokeWidth={3}
          fill="none"
          strokeLinecap="round"
        />
      </G>
      <G stroke="#E8F6FA" strokeWidth={2} strokeLinecap="round" fill="none" opacity={0.8}>
        <Path d="M16 138 L40 138 M24 144 L52 144 M214 138 L240 138 M236 144 L264 144" />
      </G>
      <Path d="M10 150 L290 150 L290 160 Q290 172 278 172 L22 172 Q10 172 10 160 Z" fill="#E7C990" />
      <Path d="M10 152 Q120 148 290 154" stroke="#F4EAD0" strokeWidth={3} fill="none" strokeLinecap="round" />
      <Modern x={64} y={164} s={1.25} shirt={SHIRT_ORANGE} tilt={-6} />
    </Frame>
  );
}

/* ---------- 5. the door that stays shut ---------- */
function Thief({ x, y, s = 1, knock = false }: { x: number; y: number; s?: number; knock?: boolean }) {
  const RIM = '#9C95D8';
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Ellipse cx={0} cy={1} rx={13} ry={3} fill={BEAR_LINE} opacity={0.5} />
      <Tube fill="#2B2552" line={RIM} parts={knock ? [['M6 -34 L20 -48', 5]] : [['M6 -34 L12 -18', 5]]} />
      <Path d="M-12 0 Q-15 -34 0 -38 Q15 -34 12 0 Z" fill="#2B2552" stroke={RIM} strokeWidth={1.3} strokeLinejoin="round" />
      <Path d="M-9 -16 L10 -14 M-10 -24 L11 -22" stroke="#4A4388" strokeWidth={2.4} />
      <Circle cx={0} cy={-46} r={8.5} fill="#3A3466" stroke={RIM} strokeWidth={1.3} />
      <Path d="M-8.6 -48 L8.6 -48 L8.6 -43 L-8.6 -43 Z" fill="#0F0B25" />
      <Circle cx={-3} cy={-45.6} r={1.5} fill={CREAM} />
      <Circle cx={4} cy={-45.6} r={1.5} fill={CREAM} />
      <Path d="M-9 -49 Q-8 -58 0 -58 Q8 -58 9 -49 Z" fill="#171235" stroke={RIM} strokeWidth={1} strokeLinejoin="round" />
      <Path d="M5 -51 L14 -51" stroke={RIM} strokeWidth={1.4} strokeLinecap="round" />
      {knock ? (
        <Circle cx={21} cy={-49} r={3.6} fill="#3A3466" stroke={RIM} strokeWidth={1.2} />
      ) : (
        <Circle cx={12} cy={-17} r={3.4} fill="#3A3466" stroke={RIM} strokeWidth={1.2} />
      )}
    </G>
  );
}
function Teapot({ x, y }: { x: number; y: number }) {
  return (
    <G transform={`translate(${x} ${y})`} stroke={BEAR_LINE} strokeWidth={1.3} strokeLinejoin="round" strokeLinecap="round">
      <Path d="M-10 -6 Q-20 -8 -23 -16 Q-17 -12 -10 -14" fill="#2FA39A" />
      <Path d="M9 -14 Q21 -14 20 -6 Q19 0 9 -2" fill="none" strokeWidth={3.2} />
      <Path d="M9 -14 Q21 -14 20 -6 Q19 0 9 -2" fill="none" stroke="#2FA39A" strokeWidth={1.4} />
      <Ellipse cx={0} cy={-8} rx={12} ry={9} fill="#2FA39A" />
      <Path d="M-8 -16 Q0 -22 8 -16 Z" fill="#1B6E67" />
      <Circle cx={0} cy={-21} r={2.2} fill={GOLD} />
      <Path d="M-8 -9 Q0 -4 8 -9" fill="none" stroke="#CFEDEA" strokeWidth={1.2} />
    </G>
  );
}
function Door({ k }: { k: Ink }) {
  void k;
  const p = useRun(300, 1200);
  const shake = Math.sin(p * Math.PI * 6) * (1 - p) * 1.4;
  return (
    <Frame label="At night two soft, cartoonish shadowy thieves knock at a shut house door, and inside a person stands with arms crossed, not opening it, while a teapot sits unpoured on the shelf beside an empty cup">
      <Rect x={10} y={10} width={280} height={162} rx={12} fill="#4C477F" />
      <Circle cx={46} cy={38} r={12} fill={GOLD} />
      <Circle cx={51} cy={34} r={11} fill="#4C477F" />
      <G fill={CREAM} opacity={0.8}>
        <Circle cx={92} cy={26} r={1.3} />
        <Circle cx={118} cy={40} r={1.1} />
        <Circle cx={72} cy={52} r={1.2} />
        <Circle cx={30} cy={64} r={1} />
      </G>
      <Path d="M10 150 L290 150 L290 160 Q290 172 278 172 L22 172 Q10 172 10 160 Z" fill="#2C2A55" />
      <Rect x={150} y={52} width={132} height={98} fill="#F2D7A0" stroke={EDGE} strokeWidth={1.4} />
      <Rect x={150} y={140} width={132} height={10} fill="#B98A52" stroke={EDGE} strokeWidth={1.2} />
      <Rect x={106} y={40} width={182} height={13} rx={2} fill="#8A5A38" stroke={BEAR_LINE} strokeWidth={1.4} />
      <Rect x={110} y={52} width={40} height={98} fill="#D9B988" stroke={EDGE} strokeWidth={1.4} />
      <Path d="M116 150 L116 94 Q116 80 128 80 Q140 80 140 94 L140 150 Z" fill={WOOD} stroke={BEAR_LINE} strokeWidth={1.6} strokeLinejoin="round" />
      <Path d="M128 80 L128 150 M120 100 L120 150 M136 100 L136 150" stroke={WOOD_D} strokeWidth={1.1} opacity={0.6} />
      <Rect x={115} y={112} width={26} height={7} rx={2} fill="#3A2418" stroke={BEAR_LINE} strokeWidth={1.2} />
      <Circle cx={134} cy={128} r={2.2} fill={GOLD} />
      <G stroke="#FFE9A8" strokeWidth={1.8} strokeLinecap="round" fill="none" opacity={0.85}>
        <Path d={`M${100 + shake} 92 Q${95 + shake} 98 ${100 + shake} 104 M${94 + shake} 88 Q${88 + shake} 98 ${94 + shake} 108`} />
      </G>
      <Circle cx={216} cy={62} r={3.4} fill={GOLD} />
      <Path d="M216 52 L216 59" stroke={EDGE} strokeWidth={1.4} />
      <Circle cx={216} cy={62} r={14} fill={GOLD} opacity={0.2} />
      <Rect x={226} y={102} width={52} height={4} fill={WOOD} stroke={BEAR_LINE} strokeWidth={1.1} />
      <Path d="M232 106 L232 112 M272 106 L272 112" stroke={WOOD_D} strokeWidth={2} strokeLinecap="round" />
      <Teapot x={244} y={102} />
      <G stroke={BEAR_LINE} strokeWidth={1.2} strokeLinejoin="round">
        <Path d="M262 90 L263 99 Q268 101 273 99 L274 90 Z" fill={CREAM} />
        <Ellipse cx={268} cy={90} rx={6} ry={1.8} fill="#EFE2BC" />
      </G>
      <Thief x={44} y={154} s={1.05} />
      <Thief x={88} y={154} s={1.05} knock />
      <Modern
        x={196}
        y={148}
        s={1.2}
        flip
        shirt={SHIRT_GREEN}
        tilt={-3}
        arms={[
          [-5, 4, -38],
          [5, -4, -40],
        ]}
      />
    </Frame>
  );
}

/* ---------- 6. birds over a head, none in the hair ---------- */
function Bird({ x, y, s = 1, fill, wing, up = true }: { x: number; y: number; s?: number; fill: string; wing: string; up?: boolean }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`} stroke={BEAR_LINE} strokeWidth={1.2} strokeLinejoin="round">
      <Path d="M-8 2 L-14 -1 L-13 5 Z" fill={wing} />
      <Ellipse cx={0} cy={0} rx={8} ry={4.6} fill={fill} />
      <Circle cx={7} cy={-2} r={3.4} fill={fill} />
      <Path d="M10 -2.6 L14 -1.4 L10 -0.4 Z" fill={GOLD} />
      <Path d={up ? 'M-3 -1 Q-6 -11 -13 -9 Q-9 -4 -8 1 Z' : 'M-3 1 Q-6 9 -13 8 Q-9 3 -8 -1 Z'} fill={wing} />
      <Circle cx={8} cy={-3} r={0.9} fill={BEAR_LINE} stroke="none" />
    </G>
  );
}
function Birds({ k }: { k: Ink }) {
  void k;
  const p = useRun(200, 2200);
  const fly = (1 - p) * -70;
  return (
    <Frame label="A person walks along a path looking up at birds flying across the sky over their head, and in a thought bubble beside them a tiny nest is crossed out, because the nest is not in their hair">
      <Rect x={10} y={10} width={280} height={162} rx={12} fill="#A9D8EE" />
      <G fill="#F4FAFC" opacity={0.9}>
        <Ellipse cx={70} cy={92} rx={20} ry={6} />
        <Ellipse cx={86} cy={88} rx={12} ry={7} />
        <Ellipse cx={246} cy={126} rx={22} ry={6} />
        <Ellipse cx={262} cy={122} rx={11} ry={6} />
      </G>
      <Path d="M10 136 Q60 116 120 132 Q180 118 290 134 L290 150 L10 150 Z" fill="#79AE7E" />
      <Path d="M10 140 L290 140 L290 160 Q290 172 278 172 L22 172 Q10 172 10 160 Z" fill="#8DBB6A" />
      <Path d="M30 172 Q90 156 150 150 Q220 146 290 150 L290 160 Q290 172 278 172 Z" fill="#E4CB98" />
      <Bird x={62 + fly} y={52} s={1} fill="#5B7FA6" wing="#3E5F86" />
      <Bird x={118 + fly} y={36} s={1.15} fill="#D96F4A" wing="#A8482A" up={false} />
      <Bird x={174 + fly} y={20} s={0.95} fill="#7A4FA0" wing="#58357A" />
      <Bird x={242 + fly} y={30} s={1.05} fill="#F0B43C" wing="#C98F1A" up={false} />
      <Bird x={268 + fly} y={52} s={0.85} fill="#2FA39A" wing="#1B6E67" />
      <Modern
        x={116}
        y={160}
        s={1.25}
        shirt="#D9822B"
        hair="#7A5232"
        tilt={-14}
        stride={6}
        smile
        arms={[
          [-5, -13, -36],
          [5, 14, -34],
        ]}
      />
      <G fill={CREAM} stroke={BEAR_LINE} strokeWidth={1.3}>
        <Circle cx={143} cy={86} r={2.4} />
        <Circle cx={155} cy={82} r={3.6} />
      </G>
      <G transform="translate(200 70)">
        <Circle r={28} fill={CREAM} stroke={BEAR_LINE} strokeWidth={2} />
        <G stroke={BEAR_LINE} strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M-14 3 Q0 22 14 3 Q10 -2 0 -2 Q-10 -2 -14 3 Z" fill="#B88A55" />
          <Path d="M-10 7 Q-4 11 4 9 M-12 3 L-5 8 M12 3 L5 8 M-6 1 L6 9" stroke={WOOD_D} fill="none" strokeWidth={1.1} />
          <Ellipse cx={-4} cy={-2} rx={4} ry={5} fill="#EAF4F8" />
          <Ellipse cx={5} cy={-3} rx={4} ry={5} fill="#EAF4F8" />
        </G>
        <Circle r={22} fill="none" stroke={RED} strokeWidth={3.6} />
        <Line x1={-15.5} y1={-15.5} x2={15.5} y2={15.5} stroke={RED} strokeWidth={3.6} strokeLinecap="round" />
      </G>
    </Frame>
  );
}

/* ---------- 7. a scale that weighs a thought like a deed ---------- */
function CloudThought({ x, y }: { x: number; y: number }) {
  const shapes = (
    <>
      <Circle cx={-14} cy={0} r={9} />
      <Circle cx={-2} cy={-6} r={11} />
      <Circle cx={11} cy={-3} r={10} />
      <Circle cx={21} cy={3} r={7} />
      <Rect x={-23} y={1} width={51} height={9} rx={4.5} />
    </>
  );
  return (
    <G transform={`translate(${x} ${y})`}>
      <G fill={BEAR_LINE} stroke={BEAR_LINE} strokeWidth={3.2}>
        {shapes}
      </G>
      <G fill={CREAM}>{shapes}</G>
      <Path d="M-8 3 Q-3 -1 2 3 Q7 7 12 3" stroke="#B8A98A" strokeWidth={1.4} fill="none" strokeLinecap="round" />
    </G>
  );
}
function DeedHand({ x, y }: { x: number; y: number }) {
  return (
    <G transform={`translate(${x} ${y})`} stroke={BEAR_LINE} strokeWidth={1.3} strokeLinejoin="round" strokeLinecap="round">
      <Ellipse cx={0} cy={-2} rx={9} ry={3} fill={RED} />
      <Rect x={-9} y={-32} width={18} height={9} rx={3} fill={SHIRT_GREEN} />
      <Rect x={-9} y={-25} width={18} height={14} rx={6} fill={SKIN} />
      <Rect x={-2.4} y={-14} width={5.6} height={11} rx={2.8} fill={SKIN} />
      <Path d="M-7 -18 Q-12 -15 -10 -11" fill="none" />
    </G>
  );
}
function Scale({ k }: { k: Ink }) {
  const p = useRun(300, 1600);
  const px = 150;
  const py = 58;
  const th = ((1 - p) * -9 * Math.PI) / 180;
  const L = 82;
  const lx = px - L * Math.cos(th);
  const ly = py - L * Math.sin(th);
  const rx = px + L * Math.cos(th);
  const ry = py + L * Math.sin(th);
  const pan = (ex: number, ey: number) => {
    const t = ey + 46;
    return (
      <G>
        <Path d={`M${ex} ${ey} L${ex - 26} ${t} M${ex} ${ey} L${ex + 26} ${t}`} stroke={BEAR_LINE} strokeWidth={1.4} fill="none" />
        <Path d={`M${ex - 30} ${t} Q${ex} ${t + 20} ${ex + 30} ${t} Z`} fill={GOLD_D} stroke={BEAR_LINE} strokeWidth={1.6} strokeLinejoin="round" />
      </G>
    );
  };
  return (
    <Frame label="A balance scale with a thought cloud on one pan and a hand pressing a button on the other, hanging level as if a thought weighed the same as a deed, with a question mark above and a dotted line showing how it should really tilt">
      <Rect x={10} y={10} width={280} height={162} rx={12} fill="#F0D9A8" />
      <Path d="M10 152 L290 152 L290 160 Q290 172 278 172 L22 172 Q10 172 10 160 Z" fill="#D9BC86" />
      <Path d="M120 152 L128 140 L172 140 L180 152 Z" fill={WOOD} stroke={BEAR_LINE} strokeWidth={1.5} strokeLinejoin="round" />
      <Rect x={145.5} y={58} width={9} height={84} fill={WOOD} stroke={BEAR_LINE} strokeWidth={1.5} />
      <Path d="M70 41 L230 75" stroke={BEAR_LINE} strokeWidth={1.8} strokeDasharray="5 5" opacity={0.45} />
      {pan(lx, ly)}
      {pan(rx, ry)}
      <CloudThought x={lx} y={ly + 36} />
      <DeedHand x={rx} y={ry + 50} />
      <Path d={`M${lx} ${ly} L${rx} ${ry}`} stroke={BEAR_LINE} strokeWidth={8} strokeLinecap="round" />
      <Path d={`M${lx} ${ly} L${rx} ${ry}`} stroke={WOOD} strokeWidth={5} strokeLinecap="round" />
      <Circle cx={px} cy={py} r={6} fill={GOLD} stroke={BEAR_LINE} strokeWidth={1.6} />
      <Circle cx={150} cy={24} r={14} fill={k.ink} />
      <Say x={150} y={30} s="?" fill={k.bg} size={19} />
    </Frame>
  );
}

export const SCENES_I8: Record<string, ComponentType<{ k: Ink }>> = {
  'g8-desert': Desert,
  'g8-stones': Stones,
  'g8-angels': Angels,
  'g8-wave': Wave,
  'g8-door': Door,
  'g8-birds': Birds,
  'g8-scale': Scale,
};
