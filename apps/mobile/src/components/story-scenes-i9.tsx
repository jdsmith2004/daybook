/* Scenes for lesson g9, "Hungry for more" (see story-kit.tsx and story-scenes-i6.tsx for the approach): Jesus tired at Jacob's well at midday and the woman of Samaria coming
   alone with her clay water pot, the two talking about the water that fills, the woman fully known and still welcomed, the pot left by the well as she runs to the town,
   the hunger that is blessed, then the same truth as a new truck that spins in the snow with an empty bed and grips with a load of firewood, two paths (away from
   something and toward something), and a spring of living water. Jesus always wears a white robe with a red sash; the woman a teal robe and a pale teal head covering and
   carries a clay pot; the man with the truck a rust jacket and a mustard cap. Every figure carries a dark outline so it reads on a dark card and a cream one. */
import { type ComponentType, type ReactNode, useEffect, useState } from 'react';
import { Easing } from 'react-native';
import { Circle, Ellipse, G, Line, Path, Polygon, Rect } from 'react-native-svg';

import { useAppear, useReducedMotion } from '@/lib/motion';

import { BEAR_LINE, Frame, type Ink } from './story-kit';

const SKIN = '#E7B98F';
const HAIR = '#3A2A20';
const GOLD = '#FFD25A';
const CREAM = '#FFF5E1';
const WOOD = '#B07A45';
const WOOD_D = '#5E3A1A';
const EDGE = '#8A6A3A';
const STONE = '#F3E3BC';
const WHITE = '#F8F4EA';
const RED = '#C23A3A';
const TEAL = '#2FA39A';
const TEAL_D = '#1B6E67';
const VEIL = '#BFE3DC';
const CLAY = '#C46A3A';
const CLAY_L = '#E9A56A';
const CLAY_D = '#8F4522';
const WATER = '#4F8FC0';
const LIGHT_W = '#BDEBFF';
const LIGHT_D = '#5BB2DB';
const FOLK = ['#7A4FA0', '#5C7C8A', '#8A5A2B', '#C27A8A', '#7A8A4A', '#4F6FBF', '#A06A3A', '#6A5A8A'];
const FOLK_HAIR = ['#3A2A20', '#2A1E18', '#6A4A30', '#8A8A8E', '#4A3426'];
const JACKET = '#C8572A';
const JEANS = '#3C4F6E';
const CAP = '#E0A82A';
const TRUCK = '#2F6FB5';
const TRUCK_D = '#1F4A80';
const SNOW = '#F4F8FC';
const SNOW_L = '#B5C7DA';
const GREEN = '#4E9A52';
const GREEN_D = '#2F6E3A';

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
function Shadow({ x, y, rx, ry = 3 }: { x: number; y: number; rx: number; ry?: number }) {
  return <Ellipse cx={x} cy={y} rx={rx} ry={ry} fill="#000" opacity={0.14} />;
}
function Spark({ x, y, r, fill = CREAM }: { x: number; y: number; r: number; fill?: string }) {
  const q = r * 0.28;
  return (
    <Path
      d={`M${x} ${y - r} L${x + q} ${y - q} L${x + r} ${y} L${x + q} ${y + q} L${x} ${y + r} L${x - q} ${y + q} L${x - r} ${y} L${x - q} ${y - q} Z`}
      fill={fill}
    />
  );
}

/* ---------- people ---------- */
type Arm = [number, number, number];
const ARMS_DOWN: Arm[] = [
  [-9, -12, -17],
  [9, 12, -17],
];

/* a head at the top of a body whose neck is at y -42, looking right; tilt turns it (negative looks up) */
function Head({
  sw,
  tilt = 0,
  hair = HAIR,
  longHair = false,
  beard = false,
  veil,
  hat,
}: {
  sw: number;
  tilt?: number;
  hair?: string;
  longHair?: boolean;
  beard?: boolean;
  veil?: string;
  hat?: string;
}) {
  return (
    <G transform={`rotate(${tilt} 0 -42)`}>
      {veil ? (
        <Path
          d="M-11 -47 Q-12.5 -63 0 -63 Q12.5 -63 11 -47 L13.5 -33 Q6 -38 0 -37.5 Q-6 -38 -13.5 -33 Z"
          fill={veil}
          stroke={BEAR_LINE}
          strokeWidth={sw * 0.9}
          strokeLinejoin="round"
        />
      ) : null}
      <Circle cx={0} cy={-49} r={8.5} fill={SKIN} stroke={BEAR_LINE} strokeWidth={sw} />
      {veil ? (
        <Path
          d="M-9 -50 Q-9 -61.5 0 -61.5 Q9 -61.5 9 -50 Q4.5 -55 0 -54.5 Q-4.5 -55 -9 -50 Z"
          fill={veil}
          stroke={BEAR_LINE}
          strokeWidth={sw * 0.7}
          strokeLinejoin="round"
        />
      ) : hat ? (
        <G>
          <Path d="M-9 -52 Q-9 -64 0 -64 Q9 -64 9 -52 Z" fill={hat} stroke={BEAR_LINE} strokeWidth={sw * 0.8} strokeLinejoin="round" />
          <Path d="M-9.4 -54.6 L9.4 -54.6 L9.4 -51 L-9.4 -51 Z" fill={hat} stroke={BEAR_LINE} strokeWidth={sw * 0.8} strokeLinejoin="round" />
          <Circle cx={0} cy={-64.5} r={2.4} fill={hat} stroke={BEAR_LINE} strokeWidth={sw * 0.7} />
        </G>
      ) : longHair ? (
        <Path
          d="M-9 -49 Q-9.6 -60 0 -60 Q9.6 -60 9 -49 L9.8 -39 Q6 -42 5 -47 Q0 -52 -5 -47 Q-6 -42 -9.8 -39 Z"
          fill={hair}
          stroke={BEAR_LINE}
          strokeWidth={sw * 0.7}
        />
      ) : (
        <Path d="M-8.6 -50 Q-8.4 -59 0 -59 Q8.6 -58.6 8.6 -50 Q4 -54 0 -53.5 Q-5 -54 -8.6 -50 Z" fill={hair} />
      )}
      {beard ? <Path d="M-6.4 -46 Q0 -36 6.4 -46 Q4.6 -42 0 -40.6 Q-4.6 -42 -6.4 -46 Z" fill={hair} stroke={BEAR_LINE} strokeWidth={sw * 0.6} /> : null}
      <Circle cx={4} cy={-48} r={1.5} fill={BEAR_LINE} />
    </G>
  );
}

const BODY = 'M-13 0 L-9 -33 Q-9 -42 0 -42 Q9 -42 9 -33 L13 0 Z';

/* a person in a long robe, standing on (x, y), facing right (flip turns them). arms are [shoulder x, hand x, hand y] in the person's own space */
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
  veil,
  arms = ARMS_DOWN,
  tilt = 0,
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
  veil?: string;
  arms?: Arm[];
  tilt?: number;
  children?: ReactNode;
}) {
  const sw = 1.5 / s;
  return (
    <G transform={`translate(${x} ${y}) rotate(${rot}) scale(${flip ? -s : s} ${s})`}>
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
      <Head sw={sw} tilt={tilt} hair={hair} longHair={longHair} beard={beard} veil={veil} />
    </G>
  );
}

/* sitting on a seat at (x, y), facing right, knees forward and the lower legs hanging down */
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
  arms = [[9, 18, -10]],
  tilt = 0,
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
}) {
  const sw = 1.5 / s;
  return (
    <G transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      <Ellipse cx={20.5} cy={16.4} rx={5.8} ry={2.5} fill={BEAR_LINE} />
      <Path d="M-10 4 L-9 -33 Q-9 -42 0 -42 Q9 -42 9 -33 L11 4 Z" fill={robe} stroke={BEAR_LINE} strokeWidth={sw} strokeLinejoin="round" />
      {sash ? (
        <G>
          <Path d="M-9.6 -20 L9.6 -20" stroke={sash} strokeWidth={3.4} />
          <Path d="M-10 4 L-9 -33 Q-9 -42 0 -42 Q9 -42 9 -33 L11 4 Z" fill="none" stroke={BEAR_LINE} strokeWidth={sw} strokeLinejoin="round" />
        </G>
      ) : null}
      <Tube
        fill={robe}
        parts={[
          ['M2 -6 L16 -5', 12],
          ['M16 -5 L18 14', 9],
        ]}
      />
      {arms.map(([sx, hx, hy], i) => (
        <G key={i}>
          <Tube fill={robe} parts={[[`M${sx} -34 L${hx} ${hy}`, 5]]} />
          <Hand x={hx} y={hy} />
        </G>
      ))}
      <Head sw={sw} tilt={tilt} hair={hair} longHair={longHair} beard={beard} />
    </G>
  );
}

function Jesus({ x, y, s = 1, flip = false, tilt = 0, arms }: { x: number; y: number; s?: number; flip?: boolean; tilt?: number; arms?: Arm[] }) {
  return <Robed x={x} y={y} s={s} flip={flip} tilt={tilt} arms={arms} robe={WHITE} sash={RED} hair="#6B4A2E" beard longHair />;
}
function JesusSeated({ x, y, s = 1, flip = false, tilt = 0, arms }: { x: number; y: number; s?: number; flip?: boolean; tilt?: number; arms?: Arm[] }) {
  return <Seated x={x} y={y} s={s} flip={flip} tilt={tilt} arms={arms} robe={WHITE} sash={RED} hair="#6B4A2E" beard longHair />;
}

/* the clay water pot, standing on (x, y) */
function Pot({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  const sw = 1.4 / s;
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Path d="M-9 -18 Q-17 -18 -12.5 -9" fill="none" stroke={BEAR_LINE} strokeWidth={3.6} strokeLinecap="round" />
      <Path d="M9 -18 Q17 -18 12.5 -9" fill="none" stroke={BEAR_LINE} strokeWidth={3.6} strokeLinecap="round" />
      <Path d="M-9 -18 Q-17 -18 -12.5 -9" fill="none" stroke={CLAY} strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M9 -18 Q17 -18 12.5 -9" fill="none" stroke={CLAY} strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M-8 0 Q-14.5 -10 -9 -19 L-5 -24 L5 -24 L9 -19 Q14.5 -10 8 0 Z" fill={CLAY} stroke={BEAR_LINE} strokeWidth={sw} strokeLinejoin="round" />
      <Path d="M-12 -10 Q0 -6 12 -10" fill="none" stroke={CLAY_L} strokeWidth={2.4} strokeLinecap="round" />
      <Path d="M-10 -5 Q0 -1.6 10 -5" fill="none" stroke={CLAY_D} strokeWidth={1.2} strokeLinecap="round" />
      <Ellipse cx={0} cy={-24.5} rx={6.6} ry={2.2} fill={CLAY_D} stroke={BEAR_LINE} strokeWidth={sw} />
    </G>
  );
}

/* the woman of Samaria: a teal robe with a darker teal sash and a pale teal head covering. hair stays covered */
function Woman({
  x,
  y,
  s = 1,
  flip = false,
  rot = 0,
  arms,
  tilt = 0,
  children,
}: {
  x: number;
  y: number;
  s?: number;
  flip?: boolean;
  rot?: number;
  arms?: Arm[];
  tilt?: number;
  children?: ReactNode;
}) {
  return (
    <Robed x={x} y={y} s={s} flip={flip} rot={rot} tilt={tilt} arms={arms} robe={TEAL} sash={TEAL_D} veil={VEIL}>
      {children}
    </Robed>
  );
}
/* holding the pot at the hip with both hands (a child of Woman) */
const POT_ARMS: Arm[] = [
  [-9, 5, -20],
  [9, 25, -20],
];
function PotHold() {
  return (
    <G>
      <Pot x={15} y={-8} s={0.9} />
      <Hand x={5} y={-20} />
      <Hand x={25} y={-20} />
    </G>
  );
}

/* one of the crowd: a plain robe in one of a few colors and no arms to speak of */
function Folk({ x, y, s = 1, i, flip = false }: { x: number; y: number; s?: number; i: number; flip?: boolean }) {
  return <Robed x={x} y={y} s={s} flip={flip} robe={FOLK[i % FOLK.length]} hair={FOLK_HAIR[(i * 3) % FOLK_HAIR.length]} arms={[]} />;
}

/* a man in a jacket and jeans and a knitted cap, standing on (x, y) */
function Man({
  x,
  y,
  s = 1,
  flip = false,
  arms = ARMS_DOWN,
  tilt = 0,
  children,
}: {
  x: number;
  y: number;
  s?: number;
  flip?: boolean;
  arms?: Arm[];
  tilt?: number;
  children?: ReactNode;
}) {
  const sw = 1.5 / s;
  return (
    <G transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      <Ellipse cx={-5.6} cy={0.6} rx={5} ry={2.3} fill={BEAR_LINE} />
      <Ellipse cx={6.4} cy={0.6} rx={5} ry={2.3} fill={BEAR_LINE} />
      <Tube
        fill={JEANS}
        parts={[
          ['M-4 -20 L-5 -3', 7],
          ['M4 -20 L5 -3', 7],
        ]}
      />
      <Path d="M-10 -16 L-9 -34 Q-9 -42 0 -42 Q9 -42 9 -34 L10 -16 Z" fill={JACKET} stroke={BEAR_LINE} strokeWidth={sw} strokeLinejoin="round" />
      <Path d="M0 -41 L0 -17" stroke={BEAR_LINE} strokeWidth={1} opacity={0.5} />
      {arms.map(([sx, hx, hy], i) => (
        <G key={i}>
          <Tube fill={JACKET} parts={[[`M${sx} -34 L${hx} ${hy}`, 5]]} />
          <Hand x={hx} y={hy} />
        </G>
      ))}
      {children}
      <Head sw={sw} tilt={tilt} hat={CAP} />
    </G>
  );
}
/* an axe held in a hand at (hx, hy) with the blade up (a child of Man) */
function Axe({ hx, hy }: { hx: number; hy: number }) {
  return (
    <G>
      <Path d={`M${hx - 3} ${hy + 14} L${hx + 6} ${hy - 24}`} stroke={BEAR_LINE} strokeWidth={4.6} strokeLinecap="round" />
      <Path d={`M${hx - 3} ${hy + 14} L${hx + 6} ${hy - 24}`} stroke={WOOD} strokeWidth={2.6} strokeLinecap="round" />
      <Path
        d={`M${hx + 2} ${hy - 26} L${hx + 15} ${hy - 32} L${hx + 14} ${hy - 17} L${hx + 6} ${hy - 20} Z`}
        fill="#9AA5B1"
        stroke={BEAR_LINE}
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
      <Hand x={hx} y={hy} />
    </G>
  );
}

/* ---------- the land of the well ---------- */
/* midday over Samaria: a bright sky, a high sun, pale hills and a sandy ground from y 132 */
function Desert({ sun = true }: { sun?: boolean }) {
  return (
    <G>
      <Rect x={10} y={10} width={280} height={162} rx={12} fill="#FBE6B4" />
      {sun ? (
        <G>
          <Circle cx={150} cy={34} r={32} fill={GOLD} opacity={0.18} />
          <Circle cx={150} cy={34} r={21} fill={GOLD} opacity={0.32} />
          <Circle cx={150} cy={34} r={12.5} fill={GOLD} />
          <G stroke={GOLD} strokeWidth={2.2} strokeLinecap="round" opacity={0.8}>
            <Line x1={150} y1={8} x2={150} y2={13} />
            <Line x1={124} y1={34} x2={129} y2={34} />
            <Line x1={171} y1={34} x2={176} y2={34} />
            <Line x1={131} y1={15} x2={134.5} y2={18.5} />
            <Line x1={169} y1={15} x2={165.5} y2={18.5} />
          </G>
        </G>
      ) : null}
      <Path d="M10 112 Q70 98 130 108 Q200 94 290 108 L290 134 L10 134 Z" fill="#E9CB92" />
      <Path d="M10 132 L290 132 L290 160 Q290 172 278 172 L22 172 Q10 172 10 160 Z" fill="#E2C085" />
      <Path d="M10 152 Q120 144 290 152 L290 160 Q290 172 278 172 L22 172 Q10 172 10 160 Z" fill="#D2A86A" opacity={0.7} />
      <Path
        d="M24 126 Q34 123 44 126 Q54 129 64 126 M196 123 Q206 120 216 123 Q226 126 236 123"
        stroke={CREAM}
        strokeWidth={1.4}
        fill="none"
        strokeLinecap="round"
        opacity={0.55}
      />
    </G>
  );
}

/* a small flat-roofed town on the far rise, from x to the right, standing on y */
function Town({ x, y, s = 1, big = false }: { x: number; y: number; s?: number; big?: boolean }) {
  const houses: [number, number, number][] = big
    ? [
        [0, 30, 28],
        [34, 24, 40],
        [62, 34, 24],
        [100, 26, 34],
      ]
    : [
        [0, 22, 16],
        [25, 16, 22],
        [44, 24, 14],
        [72, 18, 20],
      ];
  return (
    <G stroke={EDGE} strokeWidth={1.1} strokeLinejoin="round">
      {houses.map(([dx, w, h], i) => (
        <G key={i}>
          <Rect x={x + dx * s} y={y - h * s} width={w * s} height={h * s} fill={STONE} />
          <Rect x={x + (dx - 2) * s} y={y - (h + 3) * s} width={(w + 4) * s} height={3.6 * s} fill="#EBD3A2" />
          <Path
            d={`M${x + (dx + w / 2 - 3) * s} ${y} L${x + (dx + w / 2 - 3) * s} ${y - 7 * s} Q${x + (dx + w / 2) * s} ${y - 11 * s} ${x + (dx + w / 2 + 3) * s} ${y - 7 * s} L${x + (dx + w / 2 + 3) * s} ${y} Z`}
            fill="#3A2418"
            stroke="none"
          />
        </G>
      ))}
    </G>
  );
}

/* Jacob's well: a round stone wall of height h on the ground at y, with its dark mouth on top. x is its centre */
function Well({ x, y, w = 70, h = 34 }: { x: number; y: number; w?: number; h?: number }) {
  const ry = w * 0.14;
  const top = y - h;
  return (
    <G stroke={EDGE} strokeWidth={1.3} strokeLinejoin="round">
      <Path d={`M${x - w / 2} ${top} L${x - w / 2} ${y} Q${x} ${y + ry * 0.9} ${x + w / 2} ${y} L${x + w / 2} ${top} Z`} fill="#CDB68B" />
      <Path d={`M${x - w / 2} ${top + h * 0.34} Q${x} ${top + h * 0.34 + ry * 1.1} ${x + w / 2} ${top + h * 0.34}`} fill="none" opacity={0.7} />
      <Path d={`M${x - w / 2} ${top + h * 0.67} Q${x} ${top + h * 0.67 + ry * 1.1} ${x + w / 2} ${top + h * 0.67}`} fill="none" opacity={0.7} />
      <Path
        d={`M${x - w * 0.3} ${top + h * 0.12} L${x - w * 0.3} ${top + h * 0.34} M${x - w * 0.08} ${top + h * 0.38} L${x - w * 0.08} ${top + h * 0.66} M${x + w * 0.2} ${top + h * 0.12} L${x + w * 0.2} ${top + h * 0.34} M${x + w * 0.34} ${top + h * 0.4} L${x + w * 0.34} ${top + h * 0.66}`}
        opacity={0.55}
      />
      <Ellipse cx={x} cy={top} rx={w / 2} ry={ry} fill="#E6D5AB" />
      <Ellipse cx={x} cy={top + 0.5} rx={w / 2 - 6} ry={ry - 3} fill="#3A2A22" stroke="none" />
    </G>
  );
}
/* where the near edge of a well's rim is (y) at a given offset from the centre */
function rimEdge(y: number, w: number, h: number) {
  return y - h + w * 0.14 * 0.82;
}
/* a wooden frame and rope over a well, with a bucket hanging at the end of it */
function Windlass({ x0, x1, top, base, ropeX, bucketY }: { x0: number; x1: number; top: number; base: number; ropeX: number; bucketY: number }) {
  return (
    <G>
      <Path d={`M${x0} ${base} L${x0} ${top}`} stroke={BEAR_LINE} strokeWidth={6.4} strokeLinecap="round" />
      <Path d={`M${x1} ${base} L${x1} ${top}`} stroke={BEAR_LINE} strokeWidth={6.4} strokeLinecap="round" />
      <Path d={`M${x0 - 4} ${top} L${x1 + 4} ${top}`} stroke={BEAR_LINE} strokeWidth={6.4} strokeLinecap="round" />
      <Path d={`M${x0} ${base} L${x0} ${top}`} stroke={WOOD} strokeWidth={3.6} strokeLinecap="round" />
      <Path d={`M${x1} ${base} L${x1} ${top}`} stroke={WOOD} strokeWidth={3.6} strokeLinecap="round" />
      <Path d={`M${x0 - 4} ${top} L${x1 + 4} ${top}`} stroke={WOOD} strokeWidth={3.6} strokeLinecap="round" />
      <Path d={`M${ropeX} ${top} L${ropeX} ${bucketY - 5}`} stroke={WOOD_D} strokeWidth={1.4} />
      <Path
        d={`M${ropeX - 6} ${bucketY} L${ropeX + 6} ${bucketY} L${ropeX + 5} ${bucketY + 9} L${ropeX - 5} ${bucketY + 9} Z`}
        fill={WOOD}
        stroke={BEAR_LINE}
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
    </G>
  );
}

/* ---------- 1. the well at midday ---------- */
function WellScene({ k }: { k: Ink }) {
  void k;
  const WX = 86;
  const WY = 156;
  const WW = 84;
  const WH = 38;
  const edge = rimEdge(WY, WW, WH);
  return (
    <Frame label="Midday in Samaria. Jesus, in a white robe with a red sash, sits tired on the edge of an old stone well. A woman in a teal robe and head covering comes toward it alone with her clay water pot, and a small town lies in the distance">
      <Desert />
      <Town x={178} y={128} s={0.95} />
      <Shadow x={WX + 4} y={WY + 4} rx={50} ry={5} />
      <Well x={WX} y={WY} w={WW} h={WH} />
      <Windlass x0={WX - 34} x1={WX + 36} top={62} base={WY - WH + 6} ropeX={WX - 14} bucketY={WY - WH - 8} />
      <JesusSeated x={WX + 18} y={edge} s={1.05} tilt={10} arms={[[9, 19, -12]]} />
      <Shadow x={232} y={160} rx={16} ry={3} />
      <Woman x={232} y={159} s={1} flip arms={POT_ARMS} tilt={2}>
        <PotHold />
      </Woman>
      <G fill="#B48A4C" opacity={0.7}>
        <Ellipse cx={262} cy={166} rx={3.2} ry={1.3} />
        <Ellipse cx={276} cy={163} rx={3.2} ry={1.3} />
      </G>
    </Frame>
  );
}

/* ---------- 2. the water that is drawn, and the water that springs ---------- */
function BucketOfWater({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Path d="M-9 -22 Q0 -34 9 -22" fill="none" stroke={BEAR_LINE} strokeWidth={3.4} strokeLinecap="round" />
      <Path d="M-9 -22 Q0 -34 9 -22" fill="none" stroke={WOOD_D} strokeWidth={1.4} strokeLinecap="round" />
      <Path d="M-11 -20 L11 -20 L8.5 0 L-8.5 0 Z" fill={WOOD} stroke={BEAR_LINE} strokeWidth={1.4 / s} strokeLinejoin="round" />
      <Path d="M-10.3 -13 L10.3 -13 M-9.5 -6 L9.5 -6" stroke={WOOD_D} strokeWidth={1.4} />
      <Ellipse cx={0} cy={-20} rx={11} ry={3.2} fill="#8B6A3E" stroke={BEAR_LINE} strokeWidth={1.3 / s} />
      <Ellipse cx={0} cy={-19.6} rx={9} ry={2.2} fill={WATER} />
      <Path d="M12 -2 Q20 -1 18 3 Q10 5 6 2" fill="none" stroke={WOOD_D} strokeWidth={1.6} strokeLinecap="round" />
    </G>
  );
}
/* a small spring of light-water: a ring of stones, a glow, a rising fountain and two arcs falling away from it */
function LightSpring({ x, y, p = 1 }: { x: number; y: number; p?: number }) {
  const hgt = 38 * p;
  return (
    <G>
      <Circle cx={x} cy={y - 24} r={34} fill={GOLD} opacity={0.16} />
      <Circle cx={x} cy={y - 24} r={22} fill={GOLD} opacity={0.22} />
      <Ellipse cx={x} cy={y} rx={20} ry={6} fill="#B9A582" stroke={BEAR_LINE} strokeWidth={1.3} />
      <Ellipse cx={x} cy={y - 1} rx={15} ry={4} fill={LIGHT_W} stroke={LIGHT_D} strokeWidth={1.2} />
      <Path
        d={`M${x - 6} ${y - 1} Q${x - 4} ${y - hgt * 0.6} ${x} ${y - hgt} Q${x + 4} ${y - hgt * 0.6} ${x + 6} ${y - 1} Z`}
        fill={LIGHT_W}
        stroke={LIGHT_D}
        strokeWidth={1.3}
        strokeLinejoin="round"
      />
      <Path d={`M${x} ${y - hgt + 2} Q${x + 14} ${y - hgt - 2} ${x + 17} ${y - 2}`} fill="none" stroke={LIGHT_W} strokeWidth={3} strokeLinecap="round" />
      <Path d={`M${x} ${y - hgt + 2} Q${x - 14} ${y - hgt - 2} ${x - 17} ${y - 2}`} fill="none" stroke={LIGHT_W} strokeWidth={3} strokeLinecap="round" />
      <Circle cx={x - 3} cy={y - 14} r={1.6} fill={SNOW} opacity={0.95} />
      <Spark x={x + 15} y={y - 34} r={4.4} fill={CREAM} />
      <Spark x={x - 17} y={y - 28} r={3.2} fill={CREAM} />
      <Spark x={x + 4} y={y - 50} r={3.4} fill={GOLD} />
    </G>
  );
}
function Water({ k }: { k: Ink }) {
  void k;
  const WX = 50;
  const WY = 158;
  const WW = 72;
  const WH = 34;
  const edge = rimEdge(WY, WW, WH);
  const p = useRun(500, 1200);
  return (
    <Frame label="Jesus sits on the edge of the well and talks with the woman, who holds her clay pot. Between them, on one side, is a bucket of drawn water, and on the other a small glowing spring of light-water welling up from the ground">
      <Desert />
      <Shadow x={WX + 4} y={WY + 4} rx={44} ry={5} />
      <Well x={WX} y={WY} w={WW} h={WH} />
      <JesusSeated
        x={WX + 16}
        y={edge}
        s={1.05}
        arms={[
          [9, 25, -34],
          [-9, 6, -10],
        ]}
      />
      <Shadow x={132} y={162} rx={14} ry={3} />
      <BucketOfWater x={132} y={161} s={1.5} />
      <LightSpring x={186} y={161} p={p} />
      <Shadow x={242} y={162} rx={16} ry={3} />
      <Woman x={242} y={161} s={1.05} flip arms={POT_ARMS} tilt={4}>
        <PotHold />
      </Woman>
    </Frame>
  );
}

/* ---------- 3. fully known, and still welcomed ---------- */
function Known({ k }: { k: Ink }) {
  void k;
  const WX = 62;
  const WY = 170;
  const WW = 108;
  const WH = 46;
  const edge = rimEdge(WY, WW, WH);
  return (
    <Frame label="Close up at the well, a warm glow around the two of them. Jesus, seated on the well, speaks kindly with an open hand. The woman in her teal robe stands upright and listens, one hand at her heart, her clay pot set down at her feet. Nothing in the picture is shameful">
      <Desert sun={false} />
      <Circle cx={150} cy={104} r={96} fill={GOLD} opacity={0.12} />
      <Circle cx={150} cy={104} r={70} fill={GOLD} opacity={0.16} />
      <Circle cx={150} cy={104} r={46} fill={GOLD} opacity={0.2} />
      <Well x={WX} y={WY} w={WW} h={WH} />
      <JesusSeated
        x={WX + 36}
        y={edge}
        s={1.4}
        tilt={-8}
        arms={[
          [9, 29, -28],
          [-9, 8, -10],
        ]}
      />
      <Shadow x={206} y={171} rx={24} ry={4} />
      <Woman
        x={206}
        y={170}
        s={1.55}
        flip
        tilt={-4}
        arms={[
          [-9, -8, -15],
          [9, 6, -29],
        ]}
      />
      <Pot x={254} y={168} s={1.3} />
      <Spark x={150} y={58} r={5} fill={CREAM} />
      <Spark x={130} y={74} r={3.2} fill={GOLD} />
      <Spark x={170} y={72} r={3.4} fill={GOLD} />
      <Spark x={252} y={92} r={3.4} fill={CREAM} />
    </Frame>
  );
}

/* ---------- 4. the pot left by the well ---------- */
function PotLeft({ k }: { k: Ink }) {
  void k;
  const p = useRun(300, 1500);
  const WX = 44;
  const WY = 158;
  const WW = 64;
  const WH = 32;
  const edge = rimEdge(WY, WW, WH);
  const rx = 126 + 34 * p;
  const hop = Math.abs(Math.sin(p * 9)) * 2.5;
  const folk: [number, number, number][] = [
    [222, 152, 0],
    [238, 156, 3],
    [254, 152, 5],
  ];
  return (
    <Frame label="The clay water pot sits by the well where the woman left it. She runs toward the town with her arms open wide, calling to the people there, who turn to look. Jesus waits at the well">
      <Desert />
      <Town x={170} y={134} s={0.8} big />
      <Shadow x={WX + 3} y={WY + 4} rx={40} ry={5} />
      <Well x={WX} y={WY} w={WW} h={WH} />
      <JesusSeated x={WX + 13} y={edge} s={0.78} tilt={4} arms={[[9, 18, -12]]} />
      <Shadow x={98} y={163} rx={17} ry={3.4} />
      <Pot x={98} y={162} s={1.7} />
      {folk.map(([x, y, i]) => (
        <Folk key={x} x={x} y={y} s={0.66} i={i + 1} flip />
      ))}
      <G fill="#EBD3A2" stroke="none" opacity={0.85}>
        <Circle cx={rx - 20} cy={163} r={4} />
        <Circle cx={rx - 30} cy={160} r={3} />
        <Circle cx={rx - 40} cy={164} r={2.4} />
      </G>
      <Shadow x={rx} y={165} rx={15} ry={3} />
      <Woman
        x={rx}
        y={164 - hop}
        s={1.15}
        rot={6}
        tilt={-6}
        arms={[
          [-9, -17, -50],
          [9, 21, -47],
        ]}
      />
      <G fill="none" stroke={BEAR_LINE} strokeWidth={1.8} strokeLinecap="round" opacity={p > 0.2 ? 0.8 : 0}>
        <Path d={`M${rx + 30} ${139} Q${rx + 35} ${144} ${rx + 30} ${149}`} />
        <Path d={`M${rx + 36} ${135} Q${rx + 43} ${144} ${rx + 36} ${153}`} />
      </G>
    </Frame>
  );
}

/* ---------- 5. blessed are they who hunger ---------- */
function Basket({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  const sw = 1.4 / s;
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Ellipse cx={0} cy={1} rx={22} ry={4} fill="#000" opacity={0.14} />
      <G stroke={BEAR_LINE} strokeWidth={sw} strokeLinejoin="round">
        <Ellipse cx={-8} cy={-22} rx={9} ry={6.4} fill="#D9A55E" />
        <Ellipse cx={9} cy={-24} rx={9.5} ry={6.6} fill="#E0AE68" />
        <Ellipse cx={1} cy={-28} rx={8} ry={5.6} fill="#D39A52" />
      </G>
      <Path d="M-14 -22 L-8 -26 M3 -24 L9 -28 M-5 -29 L1 -32" stroke="#9A6A36" strokeWidth={1.1} strokeLinecap="round" />
      <Path d="M-22 -19 L22 -19 L18 0 L-18 0 Z" fill="#B98A4A" stroke={BEAR_LINE} strokeWidth={sw} strokeLinejoin="round" />
      <Path d="M-21 -13 L21 -13 M-19.6 -7 L19.6 -7 M-9 -19 L-8 0 M3 -19 L3 0 M13 -19 L12 0" stroke="#8A6330" strokeWidth={1.1} />
      <Path
        d="M-23 -19 Q-14 -16 -6 -19 Q2 -14 10 -19 Q18 -16 23 -19 L21 -22 L-21 -22 Z"
        fill={CREAM}
        stroke={BEAR_LINE}
        strokeWidth={sw}
        strokeLinejoin="round"
      />
    </G>
  );
}
function Jar({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  const sw = 1.4 / s;
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Ellipse cx={0} cy={1} rx={13} ry={3} fill="#000" opacity={0.14} />
      <Path d="M-8 -22 Q-16 -22 -12 -12" fill="none" stroke={BEAR_LINE} strokeWidth={3.6} strokeLinecap="round" />
      <Path d="M8 -22 Q16 -22 12 -12" fill="none" stroke={BEAR_LINE} strokeWidth={3.6} strokeLinecap="round" />
      <Path d="M-8 -22 Q-16 -22 -12 -12" fill="none" stroke={CLAY} strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M8 -22 Q16 -22 12 -12" fill="none" stroke={CLAY} strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M-9 0 Q-15 -10 -9 -21 L-4.6 -28 L4.6 -28 L9 -21 Q15 -10 9 0 Z" fill={CLAY} stroke={BEAR_LINE} strokeWidth={sw} strokeLinejoin="round" />
      <Path d="M-12.4 -13 Q0 -9 12.4 -13" fill="none" stroke={CLAY_L} strokeWidth={2.4} strokeLinecap="round" />
      <Ellipse cx={0} cy={-28.5} rx={6.6} ry={2.2} fill={LIGHT_W} stroke={BEAR_LINE} strokeWidth={sw} />
      <Path d="M-4 -26 Q-2 -22 -3 -19" fill="none" stroke={LIGHT_W} strokeWidth={1.4} strokeLinecap="round" opacity={0.8} />
    </G>
  );
}
function Bread({ k }: { k: Ink }) {
  void k;
  const HILL = 'M10 150 Q70 96 150 88 Q230 80 290 96 L290 172 L10 172 Z';
  const back: [number, number][] = [
    [90, 106],
    [112, 100],
    [134, 96],
    [156, 92],
    [180, 90],
  ];
  const mid: [number, number][] = [
    [46, 136],
    [74, 130],
    [102, 124],
    [130, 118],
    [158, 114],
    [186, 110],
  ];
  return (
    <Frame label="On a green hillside a crowd sits listening to Jesus teach, he in white with a red sash on a rock above them. In the foreground lie a basket of bread and a jar of water, for people who hunger and thirst">
      <Rect x={10} y={10} width={280} height={162} rx={12} fill="#F7DDA6" />
      <Circle cx={248} cy={36} r={20} fill={GOLD} opacity={0.3} />
      <Circle cx={248} cy={36} r={12} fill={GOLD} />
      <Path d="M10 92 L290 92 L290 112 L10 112 Z" fill="#9CC3D8" opacity={0.7} />
      <Path d="M10 104 Q70 82 130 94 Q200 76 290 90 L290 130 L10 130 Z" fill="#C9B77E" />
      <Path d={HILL} fill="#8DB05A" />
      <Path d="M10 150 Q70 96 150 88 Q230 80 290 96" fill="none" stroke="#6E9446" strokeWidth={2} />
      <Path d="M10 146 Q150 130 290 148 L290 160 Q290 172 278 172 L22 172 Q10 172 10 160 Z" fill="#6E9446" />
      <G fill="#B9D77C" opacity={0.7}>
        <Circle cx={36} cy={152} r={1.6} />
        <Circle cx={170} cy={150} r={1.6} />
        <Circle cx={240} cy={152} r={1.6} />
        <Circle cx={206} cy={118} r={1.6} />
        <Circle cx={60} cy={116} r={1.6} />
      </G>
      <Ellipse cx={224} cy={97} rx={18} ry={6} fill="#B9A78A" stroke={BEAR_LINE} strokeWidth={1.2} />
      <JesusSeated
        x={224}
        y={95}
        s={0.8}
        tilt={-4}
        arms={[
          [9, 26, -30],
          [-9, 6, -12],
        ]}
      />
      {back.map(([x, y], i) => (
        <Folk key={`b${i}`} x={x} y={y} s={0.5} i={i + 2} />
      ))}
      {mid.map(([x, y], i) => (
        <Folk key={`m${i}`} x={x} y={y} s={0.64} i={i + 5} />
      ))}
      <Basket x={88} y={168} s={1.5} />
      <Jar x={142} y={168} s={1.5} />
    </Frame>
  );
}

/* ---------- the snowy mountain road ---------- */
function Pine({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`} stroke="#1E3B2D" strokeWidth={1.1 / s} strokeLinejoin="round">
      <Rect x={-2.2} y={-7} width={4.4} height={7} fill="#6B4A2E" />
      <Polygon points="-15,-5 15,-5 0,-27" fill="#2F5D45" />
      <Polygon points="-12,-18 12,-18 0,-39" fill="#2F5D45" />
      <Polygon points="-9,-31 9,-31 0,-52" fill="#2F5D45" />
      <Polygon points="-5.6,-43 5.6,-43 0,-52" fill={SNOW} stroke="none" />
      <Polygon points="-7.4,-30 7.4,-30 4,-35 -4,-35" fill={SNOW} stroke="none" opacity={0.9} />
    </G>
  );
}
/* a snowy mountain road among pines: a grey sky, white peaks, and a road with its ruts from y 142 */
function Snowy() {
  return (
    <G>
      <Rect x={10} y={10} width={280} height={162} rx={12} fill="#BFD5EA" />
      <Circle cx={236} cy={36} r={20} fill="#F6F1DC" opacity={0.35} />
      <Circle cx={236} cy={36} r={11} fill="#F6F1DC" opacity={0.9} />
      <Path d="M10 112 L56 62 L84 90 L118 54 L168 108 L196 80 L240 104 L290 70 L290 130 L10 130 Z" fill="#8EA7C2" />
      <Path d="M56 62 L45 77 L52 73 L57 79 L63 73 L67 77 Z M118 54 L106 72 L113 68 L119 75 L126 68 L131 72 Z M290 70 L279 84 L285 80 L290 84 Z" fill={SNOW} />
      <Pine x={64} y={130} s={0.55} />
      <Pine x={96} y={128} s={0.5} />
      <Pine x={158} y={129} s={0.55} />
      <Pine x={232} y={128} s={0.5} />
      <Path d="M10 124 Q80 116 150 122 Q230 114 290 122 L290 160 Q290 172 278 172 L22 172 Q10 172 10 160 Z" fill="#E8F0F7" />
      <Path d="M10 144 Q100 138 290 140 L290 164 Q150 174 10 170 Z" fill="#CFDBE8" />
      <Path d="M10 150 Q150 146 290 148 M10 160 Q150 160 290 158" stroke="#B3C4D8" strokeWidth={1.6} fill="none" strokeLinecap="round" />
      <Pine x={26} y={140} s={1.3} />
      <Pine x={52} y={136} s={0.95} />
      <Pine x={278} y={138} s={1.2} />
    </G>
  );
}
/* a log seen end on, with its rings */
function LogEnd({ x, y, r = 6.5 }: { x: number; y: number; r?: number }) {
  return (
    <G>
      <Circle cx={x} cy={y} r={r} fill="#D9A566" stroke={BEAR_LINE} strokeWidth={1.2} />
      <Circle cx={x} cy={y} r={r * 0.58} fill="none" stroke="#9A6A36" strokeWidth={1} />
      <Circle cx={x} cy={y} r={r * 0.2} fill="#9A6A36" />
    </G>
  );
}
/* a new pickup truck facing right, standing on its wheels at (0, 0): the bed is at the left. load puts firewood in it, driver shows a man behind the windscreen */
function Truck({ load = false, driver = false }: { load?: boolean; driver?: boolean }) {
  const logs: [number, number][] = [
    [-56, -47],
    [-43, -47],
    [-30, -47],
    [-17, -47],
    [-49.5, -54],
    [-36.5, -54],
    [-23.5, -54],
    [-43, -61],
    [-30, -61],
  ];
  return (
    <G strokeLinejoin="round">
      <Path d="M-64 -42 L-58 -50 L-10 -50 L-6 -42 Z" fill="#2B2F3A" stroke={BEAR_LINE} strokeWidth={1.4} />
      {load ? logs.map(([x, y], i) => <LogEnd key={i} x={x} y={y} />) : null}
      <Rect x={-64} y={-42} width={58} height={26} rx={2} fill={TRUCK} stroke={BEAR_LINE} strokeWidth={1.5} />
      <Rect x={-64} y={-42} width={58} height={4} fill={TRUCK_D} />
      <Rect x={-64} y={-34} width={128} height={18} rx={4} fill={TRUCK} stroke={BEAR_LINE} strokeWidth={1.5} />
      <Path d="M-6 -42 L-6 -58 Q-6 -62 -2 -62 L30 -62 L46 -42 Z" fill={TRUCK} stroke={BEAR_LINE} strokeWidth={1.5} />
      <Path d="M-1 -44 L-1 -58 L28 -58 L40 -44 Z" fill="#BFE0EF" stroke={BEAR_LINE} strokeWidth={1.3} />
      {driver ? (
        <G>
          <Circle cx={20} cy={-51} r={6.2} fill={SKIN} stroke={BEAR_LINE} strokeWidth={1.1} />
          <Path d="M13.6 -53 Q13.6 -62 20 -62 Q26.4 -62 26.4 -53 Z" fill={CAP} stroke={BEAR_LINE} strokeWidth={1} />
          <Circle cx={23} cy={-51} r={1.1} fill={BEAR_LINE} />
        </G>
      ) : null}
      <Rect x={46} y={-40} width={18} height={8} fill={TRUCK} stroke={BEAR_LINE} strokeWidth={1.5} />
      <Path d="M-60 -26 L60 -26" stroke={TRUCK_D} strokeWidth={1.4} opacity={0.6} />
      <Rect x={60} y={-23} width={7} height={5} rx={1.5} fill="#2B2F3A" stroke={BEAR_LINE} strokeWidth={1} />
      <Circle cx={61} cy={-30} r={3.2} fill={GOLD} stroke={BEAR_LINE} strokeWidth={1} />
      <Circle cx={-38} cy={-13} r={15} fill="#1E2230" />
      <Circle cx={38} cy={-13} r={15} fill="#1E2230" />
      <Circle cx={-38} cy={-13} r={12.6} fill="#22252B" stroke={BEAR_LINE} strokeWidth={1.5} />
      <Circle cx={38} cy={-13} r={12.6} fill="#22252B" stroke={BEAR_LINE} strokeWidth={1.5} />
      <Circle cx={-38} cy={-13} r={5.4} fill="#B8BEC6" stroke={BEAR_LINE} strokeWidth={1.1} />
      <Circle cx={38} cy={-13} r={5.4} fill="#B8BEC6" stroke={BEAR_LINE} strokeWidth={1.1} />
    </G>
  );
}
function Stump({ x, y }: { x: number; y: number }) {
  return (
    <G stroke={BEAR_LINE} strokeWidth={1.3} strokeLinejoin="round">
      <Path d={`M${x - 10} ${y} L${x - 9} ${y - 12} L${x + 9} ${y - 12} L${x + 10} ${y} Q${x} ${y + 3} ${x - 10} ${y} Z`} fill="#B58656" />
      <Ellipse cx={x} cy={y - 12} rx={9} ry={3.2} fill="#E3BC82" />
      <Ellipse cx={x} cy={y - 12} rx={4.6} ry={1.6} fill="none" stroke="#9A6A36" strokeWidth={1} />
    </G>
  );
}

/* ---------- 6. the new truck ---------- */
function TruckNew({ k }: { k: Ink }) {
  void k;
  return (
    <Frame label="A brand new blue pickup truck stands on a snowy mountain road among pine trees, and a man in a rust jacket and a mustard cap stands beside it holding an axe, ready to cut firewood">
      <Snowy />
      <Shadow x={92} y={160} rx={72} ry={4} />
      <G transform="translate(90 160) scale(1.12)">
        <Truck />
      </G>
      <Stump x={256} y={160} />
      <Shadow x={202} y={162} rx={14} ry={3} />
      <Man
        x={204}
        y={161}
        s={1.15}
        flip
        tilt={-4}
        arms={[
          [-9, -10, -16],
          [9, 15, -24],
        ]}>
        <Axe hx={15} hy={-24} />
      </Man>
    </Frame>
  );
}

/* ---------- 7. stuck, all four wheels spinning ---------- */
function Puff({ x, y, r }: { x: number; y: number; r: number }) {
  return <Circle cx={x} cy={y} r={r} fill={SNOW} stroke={SNOW_L} strokeWidth={1.2} />;
}
function Stuck({ k }: { k: Ink }) {
  void k;
  const p = useRun(200, 900);
  return (
    <Frame label="The same truck is stuck in the deep snow. All four wheels spin and throw up sprays of snow, and the truck bed is empty. The man stands by it with his hands on his head">
      <Snowy />
      <G transform="translate(112 164) rotate(-4) scale(1.12)">
        <Truck />
        <G fill="none" stroke={SNOW} strokeWidth={2.2} strokeDasharray="5 9" strokeLinecap="round" opacity={0.95}>
          <Circle cx={-38} cy={-13} r={16.6} />
          <Circle cx={38} cy={-13} r={16.6} />
        </G>
      </G>
      <Path d="M24 172 Q36 150 66 152 Q92 150 106 172 Z" fill={SNOW} stroke={SNOW_L} strokeWidth={1.4} />
      <Path d="M112 172 Q122 154 148 154 Q172 152 190 172 Z" fill={SNOW} stroke={SNOW_L} strokeWidth={1.4} />
      <G opacity={Math.min(1, p * 1.6)}>
        <Puff x={30} y={146} r={7} />
        <Puff x={18} y={134} r={5} />
        <Puff x={38} y={130} r={4} />
        <Puff x={22} y={156} r={4.6} />
        <Puff x={50} y={142} r={3.2} />
        <Puff x={196} y={156} r={4.4} />
        <Puff x={204} y={146} r={3.2} />
        <Puff x={190} y={146} r={2.6} />
      </G>
      <Shadow x={238} y={162} rx={14} ry={3} />
      <Man
        x={240}
        y={162}
        s={1.15}
        flip
        tilt={-8}
        arms={[
          [-9, -7, -49],
          [9, 7, -49],
        ]}
      />
    </Frame>
  );
}

/* ---------- 8. the load that gave it grip ---------- */
function Load({ k }: { k: Ink }) {
  void k;
  const p = useRun(300, 1700);
  const e = 1 - (1 - p) * (1 - p);
  const X = 118 + 70 * e;
  const Y = 160;
  return (
    <Frame label="The truck bed is now full of cut firewood, and the truck drives forward along the snowy road with a grip, the man at the wheel, two long tracks of its wheels behind it">
      <Snowy />
      <Path d={`M12 ${Y - 1} Q${X * 0.5} ${Y - 2} ${X - 38} ${Y - 1}`} fill="none" stroke="#8EA4BE" strokeWidth={2.8} strokeLinecap="round" />
      <Path d={`M12 ${Y - 8} Q${X * 0.5} ${Y - 9} ${X - 38} ${Y - 8}`} fill="none" stroke="#9DB3CC" strokeWidth={2} strokeLinecap="round" />
      <Shadow x={X} y={Y + 1} rx={72} ry={4} />
      <G transform={`translate(${X} ${Y}) scale(1.12)`}>
        <Truck load driver />
      </G>
      <G opacity={0.9}>
        <Puff x={X - 82} y={Y - 5} r={3.6} />
        <Puff x={X - 90} y={Y - 12} r={2.6} />
        <Puff x={X - 96} y={Y - 4} r={2} />
      </G>
    </Frame>
  );
}

/* ---------- 9. away from, and toward ---------- */
function Goals({ k }: { k: Ink }) {
  void k;
  const feet = (x0: number, y: number, fill: string) => (
    <G fill={fill}>
      {[0, 1, 2, 3].map((i) => (
        <Ellipse key={i} cx={x0 + i * 14} cy={y + (i % 2) * 3} rx={3} ry={1.3} />
      ))}
    </G>
  );
  return (
    <Frame label="Two paths side by side. On the grey left, a person in a grey robe walks away from a sign with a slash through a circle, head low, with nothing ahead. On the bright right, the same person in a warm robe walks up a path toward a lit gold flag, head up">
      <Rect x={10} y={10} width={136} height={162} rx={12} fill="#B7B3C6" />
      <Path d="M10 126 Q50 118 90 124 Q120 120 146 124 L146 172 L10 172 Z" fill="#A29EB2" />
      <Path d="M10 130 L146 130 L146 160 Q146 172 134 172 L22 172 Q10 172 10 160 Z" fill="#8E8A9C" />
      <Rect x={154} y={10} width={136} height={162} rx={12} fill="#F7D9A2" />
      <Circle cx={262} cy={36} r={18} fill={GOLD} opacity={0.3} />
      <Circle cx={262} cy={36} r={10} fill={GOLD} />
      <Path d="M154 126 Q200 112 246 120 Q272 114 290 120 L290 172 L154 172 Z" fill="#E9CB92" />
      <Path d="M154 130 L290 130 L290 160 Q290 172 278 172 L166 172 Q154 172 154 160 Z" fill="#D9B06A" />
      <Path d="M158 172 L192 172 L250 132 L240 132 Z" fill="#F0D08A" />
      {/* away: a sign with a slash through a circle, left behind */}
      <Ellipse cx={116} cy={141} rx={12} ry={2.6} fill="#000" opacity={0.14} />
      <Path d="M116 140 L116 84" stroke={BEAR_LINE} strokeWidth={6.6} strokeLinecap="round" />
      <Path d="M116 140 L116 84" stroke="#6C6A78" strokeWidth={3.6} strokeLinecap="round" />
      <Circle cx={116} cy={74} r={18} fill="#C7C4D2" stroke={BEAR_LINE} strokeWidth={1.6} />
      <Circle cx={116} cy={74} r={12} fill="none" stroke="#B05A5A" strokeWidth={4.4} />
      <Path d="M107.5 65.5 L124.5 82.5" stroke="#B05A5A" strokeWidth={4.4} strokeLinecap="round" />
      {feet(60, 160, '#7C7888')}
      <Shadow x={46} y={162} rx={15} ry={3} />
      <Robed
        x={46}
        y={161}
        s={1.15}
        flip
        tilt={16}
        robe="#8D8A99"
        sash="#6A6676"
        hair="#5A5560"
        arms={[
          [-9, -11, -14],
          [9, 11, -14],
        ]}
      />
      {/* toward: a lit flag at the end of the path */}
      <Circle cx={252} cy={72} r={40} fill={GOLD} opacity={0.14} />
      <Circle cx={252} cy={72} r={26} fill={GOLD} opacity={0.2} />
      <Ellipse cx={252} cy={133} rx={10} ry={2.4} fill="#000" opacity={0.14} />
      <Path d="M252 132 L252 50" stroke={BEAR_LINE} strokeWidth={5} strokeLinecap="round" />
      <Path d="M252 132 L252 50" stroke={WOOD} strokeWidth={2.6} strokeLinecap="round" />
      <Path d="M254 52 Q266 46 280 52 L280 72 Q266 66 254 72 Z" fill={GOLD} stroke={BEAR_LINE} strokeWidth={1.5} strokeLinejoin="round" />
      <Circle cx={252} cy={49} r={3} fill={GOLD} stroke={BEAR_LINE} strokeWidth={1.2} />
      <Spark x={284} y={44} r={4} fill={CREAM} />
      <Spark x={236} y={56} r={3} fill={CREAM} />
      {feet(170, 164, '#C79A4C')}
      <Shadow x={198} y={160} rx={15} ry={3} />
      <Robed
        x={198}
        y={159}
        s={1.15}
        tilt={-6}
        robe="#E0832A"
        sash="#9A5410"
        hair="#5A5560"
        arms={[
          [-9, -14, -14],
          [9, 15, -22],
        ]}
      />
    </Frame>
  );
}

/* ---------- 10. a spring, and a person drinking ---------- */
function Kneeler({ x, y, s = 1, robe, sash, hair }: { x: number; y: number; s?: number; robe: string; sash: string; hair: string }) {
  const sw = 1.5 / s;
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Ellipse cx={-20} cy={-1.4} rx={4.6} ry={2.2} fill={BEAR_LINE} />
      <Tube
        fill={robe}
        parts={[
          ['M-16 -4 L7 -4', 11],
          ['M7 -4 L1 -21', 13],
          ['M1 -21 L12 -42', 16],
        ]}
      />
      <Path d="M-0.9 -36 L12.9 -28" stroke={sash} strokeWidth={3.2} strokeLinecap="round" />
      <Circle cx={20} cy={-52} r={8} fill={SKIN} stroke={BEAR_LINE} strokeWidth={sw} />
      <Path d="M12.4 -54 Q11.4 -62.4 20 -61 Q26.4 -59.6 27.4 -54.6 Q21 -57.6 18 -57 Q15 -56.6 12.4 -54 Z" fill={hair} />
      <Circle cx={24} cy={-51} r={1.4} fill={BEAR_LINE} />
      <Tube
        fill={robe}
        parts={[
          ['M12 -41 L28 -16', 5],
          ['M10 -38 L32 -18', 5],
        ]}
      />
      <Path d="M24 -15 Q30 -8.6 38 -16" fill="none" stroke={BEAR_LINE} strokeWidth={1.2} strokeLinecap="round" />
      <Hand x={29} y={-15} r={3.6} />
      <Hand x={34} y={-17} r={3.4} />
    </G>
  );
}
function Tuft({ x, y, s = 1, c = GREEN }: { x: number; y: number; s?: number; c?: string }) {
  return (
    <Path
      d={`M${x - 4 * s} ${y} Q${x - 5 * s} ${y - 8 * s} ${x - 7 * s} ${y - 11 * s} Q${x - 2 * s} ${y - 8 * s} ${x} ${y - 3 * s} Q${x} ${y - 11 * s} ${x + 1 * s} ${y - 15 * s} Q${x + 4 * s} ${y - 8 * s} ${x + 3 * s} ${y} Q${x + 6 * s} ${y - 8 * s} ${x + 9 * s} ${y - 10 * s} Q${x + 8 * s} ${y - 4 * s} ${x + 6 * s} ${y} Z`}
      fill={c}
      stroke={GREEN_D}
      strokeWidth={0.9}
      strokeLinejoin="round"
    />
  );
}
function Flower({ x, y, c }: { x: number; y: number; c: string }) {
  return (
    <G>
      <Path d={`M${x} ${y} L${x} ${y - 8}`} stroke={GREEN_D} strokeWidth={1.4} strokeLinecap="round" />
      <Circle cx={x} cy={y - 9} r={3} fill={c} stroke={BEAR_LINE} strokeWidth={0.9} />
      <Circle cx={x} cy={y - 9} r={1} fill={GOLD} />
    </G>
  );
}
function Spring({ k }: { k: Ink }) {
  void k;
  const p = useRun(400, 1400);
  const SX = 180;
  const SY = 152;
  const h = 18 * p;
  return (
    <Frame label="A small spring of water wells up from the dry ground. A person kneels beside it and drinks from cupped hands, and the grass and flowers are growing green all around the water">
      <Rect x={10} y={10} width={280} height={162} rx={12} fill="#FBE6B4" />
      <Circle cx={250} cy={38} r={22} fill={GOLD} opacity={0.3} />
      <Circle cx={250} cy={38} r={12.5} fill={GOLD} />
      <Path d="M10 112 Q70 98 130 108 Q200 94 290 108 L290 134 L10 134 Z" fill="#E9CB92" />
      <Path d="M10 132 L290 132 L290 160 Q290 172 278 172 L22 172 Q10 172 10 160 Z" fill="#E2C085" />
      <Path d="M10 152 Q120 144 290 152 L290 160 Q290 172 278 172 L22 172 Q10 172 10 160 Z" fill="#D2A86A" opacity={0.7} />
      <Ellipse cx={SX + 8} cy={SY + 4} rx={96} ry={22} fill="#8FC66A" opacity={0.85} />
      <Ellipse cx={SX + 8} cy={SY + 3} rx={64} ry={15} fill="#79B35A" />
      <Path
        d={`M${SX + 18} ${SY + 3} Q${SX + 40} ${SY + 8} ${SX + 62} ${SY + 6} Q${SX + 82} ${SY + 8} ${SX + 98} ${SY + 12}`}
        fill="none"
        stroke={LIGHT_W}
        strokeWidth={4}
        strokeLinecap="round"
      />
      <Path
        d={`M${SX + 18} ${SY + 3} Q${SX + 40} ${SY + 8} ${SX + 62} ${SY + 6} Q${SX + 82} ${SY + 8} ${SX + 98} ${SY + 12}`}
        fill="none"
        stroke={LIGHT_D}
        strokeWidth={0.9}
        strokeLinecap="round"
        opacity={0.7}
      />
      {/* a young tree growing where there was none */}
      <Path d="M242 150 L242 112" stroke={BEAR_LINE} strokeWidth={5} strokeLinecap="round" />
      <Path d="M242 150 L242 112" stroke="#8A6A3A" strokeWidth={2.6} strokeLinecap="round" />
      <Ellipse cx={242} cy={104} rx={15} ry={13} fill={GREEN} stroke={GREEN_D} strokeWidth={1.4} />
      <Ellipse cx={233} cy={112} rx={9} ry={7.4} fill="#5FAE5E" stroke={GREEN_D} strokeWidth={1.2} />
      <Ellipse cx={252} cy={111} rx={8} ry={6.6} fill="#5FAE5E" stroke={GREEN_D} strokeWidth={1.2} />
      {/* the spring */}
      <Circle cx={SX} cy={SY - 12} r={30} fill={GOLD} opacity={0.14} />
      <Ellipse cx={SX} cy={SY + 1} rx={24} ry={7} fill="#B9A582" stroke={BEAR_LINE} strokeWidth={1.3} />
      <Ellipse cx={SX} cy={SY} rx={18} ry={4.6} fill={LIGHT_W} stroke={LIGHT_D} strokeWidth={1.2} />
      <Path
        d={`M${SX - 9} ${SY} Q${SX - 7} ${SY - h} ${SX} ${SY - h - 4} Q${SX + 7} ${SY - h} ${SX + 9} ${SY} Z`}
        fill={LIGHT_W}
        stroke={LIGHT_D}
        strokeWidth={1.3}
        strokeLinejoin="round"
      />
      <Circle cx={SX - 2} cy={SY - h * 0.5} r={1.5} fill={SNOW} />
      <Spark x={SX + 16} y={SY - 26} r={4} fill={CREAM} />
      <Spark x={SX - 15} y={SY - 20} r={3} fill={CREAM} />
      <Spark x={SX + 2} y={SY - 38} r={3.4} fill={GOLD} />
      {/* the person drinking */}
      <Shadow x={108} y={153} rx={30} ry={4} />
      <Kneeler x={120} y={151} s={1.5} robe="#4F6FBF" sash="#2F4A8C" hair={HAIR} />
      {/* green growing around the water, thinner and drier as it goes away */}
      <Tuft x={150} y={160} s={1.2} />
      <Tuft x={156} y={168} s={1} c="#5FAE5E" />
      <Tuft x={212} y={158} s={1.3} />
      <Tuft x={222} y={166} s={1} c="#5FAE5E" />
      <Tuft x={196} y={166} s={1.1} />
      <Tuft x={264} y={162} s={1} />
      <Tuft x={134} y={166} s={0.8} c="#7CBF72" />
      <Tuft x={280} y={156} s={0.8} c="#7CBF72" />
      <Flower x={172} y={163} c="#E5708A" />
      <Flower x={206} y={162} c={CREAM} />
      <Flower x={232} y={160} c="#E5708A" />
      <Flower x={186} y={168} c={GOLD} />
      <Flower x={254} y={166} c={CREAM} />
      <Flower x={142} y={162} c={GOLD} />
    </Frame>
  );
}

export const SCENES_I9: Record<string, ComponentType<{ k: Ink }>> = {
  'g9-well': WellScene,
  'g9-water': Water,
  'g9-known': Known,
  'g9-pot': PotLeft,
  'g9-bread': Bread,
  'g9-truck': TruckNew,
  'g9-stuck': Stuck,
  'g9-load': Load,
  'g9-goals': Goals,
  'g9-spring': Spring,
};
