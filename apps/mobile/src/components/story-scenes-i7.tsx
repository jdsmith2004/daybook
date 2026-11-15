/* Scenes for lesson g7, "Built for coming back" (see story-kit.tsx, story-scenes-f-l31.tsx and story-scenes-i6.tsx for the approach): Peter at the fire in the
   high priest's courtyard and the look across it, the empty boat, Peter swimming for the shore, the breakfast of fish and bread, the three questions, and then the
   plain telling of a grandfather on a steep ski slope and the grandson who held out a hand, a path of open doors and a figure fallen, kneeling and standing.
   Jesus always wears a white robe with a red sash. Peter is a sturdy man with a short dark beard in a brick red fisher's tunic (a darker, wet one on the shore).
   Every figure carries a dark outline so it reads on a dark card and a cream one. */
import { type ComponentType, type ReactNode, useEffect, useState } from 'react';
import { Easing } from 'react-native';
import { Circle, Ellipse, G, Path, Polygon, Rect } from 'react-native-svg';

import { useAppear, useReducedMotion } from '@/lib/motion';

import { BEAR_LINE, Frame, type Ink } from './story-kit';

const SKIN = '#E7B98F';
const HAIR = '#3A2A20';
const GOLD = '#FFD25A';
const GOLD_D = '#C98F1A';
const CREAM = '#FFF5E1';
const WOOD = '#B07A45';
const WOOD_D = '#5E3A1A';
const SAND = '#E8CF98';
const SAND_D = '#C9A56A';
const WHITE = '#F8F4EA';
const RED = '#C23A3A';
const FIRE_O = '#F2672E';
const FIRE_Y = '#FFB43A';
const NIGHT = '#1B1D3F';
const WALL = '#3B3659';
const WALL_D = '#2A2645';
const GROUND = '#463C5C';
const WATER = '#4F86A8';
const NIGHT_WATER = '#1C3F66';
const PETER = { robe: '#A3452A', sash: '#63291A', hair: '#2A1C14' };
const PETER_WET = { robe: '#7A3220', sash: '#4A2014', hair: '#1E1410' };
const STARS: [number, number, number][] = [
  [34, 30, 1.6],
  [68, 20, 1.2],
  [112, 34, 1.4],
  [150, 18, 1.2],
  [196, 28, 1.6],
  [232, 20, 1.2],
  [262, 40, 1.4],
  [90, 48, 1.1],
  [178, 46, 1.1],
];

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
/* a slow counter for a fire that flickers; it stands still for people who asked for less motion */
function useTick(ms = 230) {
  const still = useReducedMotion();
  const [t, setT] = useState(0);
  useEffect(() => {
    if (still) return undefined;
    const id = setInterval(() => setT((v) => v + 1), ms);
    return () => clearInterval(id);
  }, [still, ms]);
  return t;
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
function Hand({ x, y, r = 3.6, fill = SKIN }: { x: number; y: number; r?: number; fill?: string }) {
  return <Circle cx={x} cy={y} r={r} fill={fill} stroke={BEAR_LINE} strokeWidth={1.2} />;
}

/* ---------- people ---------- */
const BODY = 'M-13 0 L-9 -33 Q-9 -42 0 -42 Q9 -42 9 -33 L13 0 Z';
type Arm = [number, number, number];
const ARMS_DOWN: Arm[] = [
  [-9, -12, -17],
  [9, 12, -17],
];

/* a head in a person's own space, centered about y -49 (dy moves it); tilt turns it (negative looks up); back turns the face the other way */
function Head({
  dy = 0,
  sw,
  hair,
  beard,
  longHair,
  band,
  tilt = 0,
  glance = 0,
  face,
  tear,
  helm,
  back,
}: {
  dy?: number;
  sw: number;
  hair: string;
  beard?: boolean;
  longHair?: boolean;
  band?: string;
  tilt?: number;
  glance?: number;
  face?: 'sad' | 'smile';
  tear?: boolean;
  helm?: boolean;
  back?: boolean;
}) {
  return (
    <G transform={`translate(0 ${dy}) rotate(${tilt} 0 -42) scale(${back ? -1 : 1} 1)`}>
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
      {helm ? (
        <Path
          d="M-9.4 -50 Q-9.8 -62 0 -62 Q9.8 -62 9.4 -50 L7 -52.4 Q0 -55 -7 -52.4 Z"
          fill="#9AA2B0"
          stroke={BEAR_LINE}
          strokeWidth={sw * 0.8}
          strokeLinejoin="round"
        />
      ) : null}
      <Circle cx={4} cy={-48 + glance} r={1.5} fill={BEAR_LINE} />
      {face === 'sad' ? <Path d="M2.4 -43.6 Q4.6 -45.6 6.8 -43.8" stroke="#C98A6A" strokeWidth={1.1} fill="none" strokeLinecap="round" /> : null}
      {face === 'smile' ? <Path d="M2.4 -45 Q4.6 -42.8 6.8 -45" stroke="#C98A6A" strokeWidth={1.1} fill="none" strokeLinecap="round" /> : null}
      {tear ? <Path d="M5.6 -46 Q4.2 -43.6 5.6 -42.6 Q7 -43.6 5.6 -46 Z" fill="#8FD0F2" stroke={BEAR_LINE} strokeWidth={0.5} /> : null}
    </G>
  );
}

/* a person in a long robe, standing on (x, y), facing right (flip turns them). arms are [shoulder x, hand x, hand y] in the person's own space; w makes them
   broader; feet are the two shoe positions; sash is a belt with a tail; band is a cloth around the head */
function Robed({
  x,
  y,
  s = 1,
  w = 1,
  flip = false,
  rot = 0,
  robe,
  sash,
  hair = HAIR,
  beard = false,
  longHair = false,
  band,
  helm = false,
  arms = ARMS_DOWN,
  feet = [-5.5, 6],
  tilt = 0,
  glance = 0,
  face,
  tear = false,
  back = false,
  children,
}: {
  x: number;
  y: number;
  s?: number;
  w?: number;
  flip?: boolean;
  rot?: number;
  robe: string;
  sash?: string;
  hair?: string;
  beard?: boolean;
  longHair?: boolean;
  band?: string;
  helm?: boolean;
  arms?: Arm[];
  feet?: [number, number];
  tilt?: number;
  glance?: number;
  face?: 'sad' | 'smile';
  tear?: boolean;
  back?: boolean;
  children?: ReactNode;
}) {
  const sw = 1.5 / s;
  return (
    <G transform={`translate(${x} ${y}) rotate(${rot}) scale(${(flip ? -s : s) * w} ${s})`}>
      <Ellipse cx={feet[0]} cy={0.5} rx={4.4} ry={2} fill={BEAR_LINE} />
      <Ellipse cx={feet[1]} cy={0.5} rx={4.4} ry={2} fill={BEAR_LINE} />
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
      <Head sw={sw} hair={hair} beard={beard} longHair={longHair} band={band} helm={helm} tilt={tilt} glance={glance} face={face} tear={tear} back={back} />
    </G>
  );
}

function Jesus(props: {
  x: number;
  y: number;
  s?: number;
  flip?: boolean;
  tilt?: number;
  arms?: Arm[];
  back?: boolean;
  face?: 'sad' | 'smile';
  glance?: number;
}) {
  return <Robed {...props} robe={WHITE} sash={RED} hair="#6B4A2E" beard longHair />;
}
function Peter({
  wet = false,
  ...rest
}: {
  x: number;
  y: number;
  s?: number;
  flip?: boolean;
  rot?: number;
  arms?: Arm[];
  feet?: [number, number];
  tilt?: number;
  glance?: number;
  face?: 'sad' | 'smile';
  tear?: boolean;
  wet?: boolean;
}) {
  const c = wet ? PETER_WET : PETER;
  return <Robed {...rest} w={1.12} robe={c.robe} sash={c.sash} hair={c.hair} beard />;
}

/* a person seated on (x, y) facing right with the robe pooled on the ground, or kneeling when kneel is set */
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
  w = 1,
  kneel = false,
  arms,
  tilt = 0,
  face,
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
  w?: number;
  kneel?: boolean;
  arms: [number, number, number, number][];
  tilt?: number;
  face?: 'sad' | 'smile';
}) {
  const sw = 1.5 / s;
  const shape = kneel
    ? 'M-17 0 Q-15 -9 -9 -14 L-8 -38 Q-8 -46 0 -46 Q8 -46 8 -38 L10 -17 Q23 -15 27 -5 L27 0 Z'
    : 'M-24 0 Q-18 -9 -9 -13 L-8 -37 Q-8 -45 0 -45 Q8 -45 8 -37 L9 -13 Q18 -9 24 0 Z';
  const top = kneel ? -46 : -45;
  return (
    <G transform={`translate(${x} ${y}) scale(${(flip ? -s : s) * w} ${s})`}>
      <Path d={shape} fill={robe} stroke={BEAR_LINE} strokeWidth={sw} strokeLinejoin="round" />
      {sash ? <Path d="M-8.6 -22 L8.6 -22" stroke={sash} strokeWidth={3} /> : null}
      {arms.map(([sx, sy, hx, hy], i) => (
        <G key={i}>
          <Tube fill={robe} parts={[[`M${sx} ${sy} L${hx} ${hy}`, 5]]} />
          <Hand x={hx} y={hy} />
        </G>
      ))}
      <Head dy={top + 45 - 3} sw={sw} hair={hair} beard={beard} longHair={longHair} tilt={tilt} face={face} />
    </G>
  );
}

/* a small rooster crowing, standing on (x, y), facing left */
function Rooster({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`} strokeLinejoin="round" strokeLinecap="round">
      <Path d="M-6 -6 L-6 0 M4 -6 L4 0" stroke={GOLD_D} strokeWidth={2} />
      <Path d="M8 -12 Q22 -22 20 -40 Q14 -28 6 -22 Z" fill="#2FA39A" stroke={BEAR_LINE} strokeWidth={1.2} />
      <Path d="M8 -10 Q26 -16 28 -34 Q18 -24 8 -18 Z" fill="#3E8E4F" stroke={BEAR_LINE} strokeWidth={1.2} />
      <Ellipse cx={0} cy={-12} rx={12} ry={8} fill="#B5532A" stroke={BEAR_LINE} strokeWidth={1.3} />
      <Path d="M-2 -14 Q6 -18 10 -10 Q4 -6 -2 -14 Z" fill="#8A3A1C" stroke={BEAR_LINE} strokeWidth={0.9} />
      <Path d="M-9 -16 Q-12 -26 -10 -30" stroke="#B5532A" strokeWidth={5} fill="none" />
      <Circle cx={-10} cy={-30} r={5} fill="#B5532A" stroke={BEAR_LINE} strokeWidth={1.2} />
      <Path d="M-12 -35 Q-10 -40 -7 -36 Q-5 -40 -4 -35 Z" fill={RED} stroke={BEAR_LINE} strokeWidth={0.9} />
      <Path d="M-14.4 -32 L-22 -37 L-14.8 -29.4 Z" fill={GOLD} stroke={BEAR_LINE} strokeWidth={0.9} />
      <Path d="M-13.4 -29 L-20 -27 L-14.6 -27.6 Z" fill={GOLD} stroke={BEAR_LINE} strokeWidth={0.9} />
      <Path d="M-11 -26.6 Q-10 -23 -8.6 -26" stroke={RED} strokeWidth={1.8} fill="none" />
      <Circle cx={-10.4} cy={-31} r={1} fill={BEAR_LINE} />
      <Path d="M-27 -42 Q-31 -37 -27 -32 M-32 -45 Q-38 -37 -32 -29" stroke={CREAM} strokeWidth={1.6} fill="none" opacity={0.75} />
    </G>
  );
}

/* ---------- fire ---------- */
function Fish({ x, y, rot = 0 }: { x: number; y: number; rot?: number }) {
  return (
    <G transform={`translate(${x} ${y}) rotate(${rot})`} stroke={BEAR_LINE} strokeWidth={1} strokeLinejoin="round">
      <Path d="M8 0 L14 -4.4 L14 4.4 Z" fill="#7F93A3" />
      <Ellipse cx={0} cy={0} rx={9} ry={4} fill="#9FB3C2" />
      <Path d="M-6 0 Q0 2.4 6 0" stroke="#6C8294" strokeWidth={0.9} fill="none" />
      <Circle cx={-5.4} cy={-0.8} r={0.9} fill={BEAR_LINE} stroke="none" />
    </G>
  );
}
function Loaf({ x, y }: { x: number; y: number }) {
  return (
    <G stroke={BEAR_LINE} strokeWidth={1} strokeLinejoin="round">
      <Ellipse cx={x} cy={y} rx={6.4} ry={3.8} fill="#D9A55A" />
      <Path d={`M${x - 3} ${y - 2.4} L${x - 1} ${y + 1} M${x + 1} ${y - 2.8} L${x + 3} ${y + 0.6}`} stroke="#9A6A2A" strokeWidth={0.9} fill="none" />
    </G>
  );
}
/* a small fire of coals standing on (x, y): flames that shift a little each tick, a ring of stones, and food on the coals as children */
function Fire({ x, y, s = 1, tick = 0, glow = true, children }: { x: number; y: number; s?: number; tick?: number; glow?: boolean; children?: ReactNode }) {
  const f1 = [1, 1.09, 0.93, 1.05][tick % 4];
  const f2 = [1, 0.92, 1.07, 0.97][tick % 4];
  const lean = [0, 2, -2, 1][tick % 4];
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      {glow ? (
        <G>
          <Ellipse cx={0} cy={-1} rx={54} ry={7} fill={GOLD} opacity={0.17} />
          <Circle cx={0} cy={-16} r={36} fill={FIRE_O} opacity={0.12} />
          <Circle cx={0} cy={-14} r={21} fill={FIRE_Y} opacity={0.18} />
        </G>
      ) : null}
      <Ellipse cx={-16} cy={-1} rx={6.4} ry={3.6} fill="#6B6475" stroke={BEAR_LINE} strokeWidth={1.2} />
      <Ellipse cx={16} cy={-1} rx={6.4} ry={3.6} fill="#6B6475" stroke={BEAR_LINE} strokeWidth={1.2} />
      <Ellipse cx={0} cy={-1.5} rx={15} ry={5} fill="#3A1E16" stroke={BEAR_LINE} strokeWidth={1.2} />
      <Ellipse cx={-8} cy={-2} rx={3.4} ry={1.6} fill={FIRE_O} />
      <Ellipse cx={1} cy={-2.4} rx={3.8} ry={1.7} fill={FIRE_Y} />
      <Ellipse cx={9} cy={-1.6} rx={3} ry={1.5} fill={FIRE_O} />
      <G transform={`translate(${lean * 0.4} -2) scale(1 ${f1})`}>
        <Path
          d="M0 0 Q-13 -4 -10 -17 Q-8 -12 -5 -11 Q-7 -24 0 -30 Q1 -20 6 -16 Q10 -12 9 -7 Q10 -2 0 0 Z"
          fill={FIRE_O}
          stroke={BEAR_LINE}
          strokeWidth={1.2}
          strokeLinejoin="round"
        />
      </G>
      <G transform={`translate(${lean * 0.2} -2) scale(1 ${f2})`}>
        <Path d="M0 -1 Q-7 -4 -5 -12 Q-2 -8 0 -18 Q3 -10 5 -9 Q7 -4 0 -1 Z" fill={FIRE_Y} />
        <Path d="M0 -1 Q-3 -3 -2 -7 Q0 -5 1 -10 Q3 -6 3 -4 Q3 -1 0 -1 Z" fill="#FFE9A8" />
      </G>
      <Circle cx={-6 + lean} cy={-36 - (tick % 3) * 2} r={1.2} fill={GOLD} />
      <Circle cx={7 - lean} cy={-31 - ((tick + 1) % 3) * 2} r={1} fill={FIRE_Y} />
      <Ellipse cx={-8} cy={2.4} rx={5.6} ry={3.2} fill="#6B6475" stroke={BEAR_LINE} strokeWidth={1.2} />
      <Ellipse cx={8} cy={2.4} rx={5.6} ry={3.2} fill="#6B6475" stroke={BEAR_LINE} strokeWidth={1.2} />
      {children}
    </G>
  );
}

/* ---------- places ---------- */
/* the high priest's courtyard at night (or at first light): a stone wall with a dark archway and a warm window, and the courtyard floor from y 126 */
function Court({ dawn = false }: { dawn?: boolean }) {
  return (
    <G>
      <Rect x={10} y={10} width={280} height={162} rx={12} fill={dawn ? '#34305A' : NIGHT} />
      {dawn ? (
        <G>
          <Rect x={10} y={30} width={280} height={24} fill="#6A4A7A" opacity={0.5} />
          <Rect x={10} y={40} width={280} height={14} fill="#C9786A" opacity={0.55} />
        </G>
      ) : (
        STARS.map(([x, y, r], i) => <Circle key={i} cx={x} cy={y} r={r} fill="#FFF1B8" />)
      )}
      <Rect x={10} y={54} width={280} height={72} fill={WALL} />
      <Rect x={10} y={54} width={280} height={6} fill="#4A4470" />
      <Path
        d="M10 78 L290 78 M10 102 L290 102 M44 60 L44 78 M92 60 L92 78 M140 78 L140 102 M188 60 L188 78 M246 78 L246 102 M70 102 L70 126 M170 102 L170 126"
        stroke={WALL_D}
        strokeWidth={1.4}
      />
      <Path d="M34 126 L34 96 Q34 80 52 80 Q70 80 70 96 L70 126 Z" fill="#120F24" stroke={WALL_D} strokeWidth={1.4} />
      <Rect x={214} y={70} width={24} height={26} rx={2} fill={GOLD} opacity={0.5} stroke={WALL_D} strokeWidth={1.4} />
      <Path d="M226 70 L226 96 M214 83 L238 83" stroke={WALL_D} strokeWidth={1.4} />
      <Path d="M10 126 L290 126 L290 160 Q290 172 278 172 L22 172 Q10 172 10 160 Z" fill={GROUND} />
      <Path d="M10 146 Q150 134 290 144 L290 160 Q290 172 278 172 L22 172 Q10 172 10 160 Z" fill="#54487A" opacity={0.8} />
    </G>
  );
}

/* a fishing boat seen from the side with its rim at y 0, bow to the right, and the planks below */
function Hull({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`} strokeLinejoin="round">
      <Path d="M-100 -6 L-82 0 L82 0 L102 -14 Q96 34 64 40 L-66 40 Q-96 34 -100 -6 Z" fill={WOOD} stroke={BEAR_LINE} strokeWidth={1.6 / s} />
      <Path d="M-92 10 Q0 20 94 8 M-86 22 Q0 32 86 20" stroke={WOOD_D} strokeWidth={1.2} fill="none" opacity={0.7} />
      <Path d="M-82 0 L82 0 L82 5 L-82 5 Z" fill="#C99058" stroke={BEAR_LINE} strokeWidth={1.2 / s} />
    </G>
  );
}

/* a fishing net held between two points, sagging, with nothing in it */
function Net({ x0, x1, y0, drop, rows = 5, cols = 6 }: { x0: number; x1: number; y0: number; drop: number; rows?: number; cols?: number }) {
  const at = (r: number, c: number): [number, number] => {
    const t = r / rows;
    const left = x0 + 11 * t;
    const right = x1 - 11 * t;
    return [left + ((right - left) * c) / cols, y0 + drop * t + 3 * Math.sin((c / cols) * Math.PI) * t];
  };
  const lines: string[] = [];
  for (let r = 0; r <= rows; r += 1) {
    const pts: string[] = [];
    for (let c = 0; c <= cols; c += 1) pts.push(at(r, c).join(' '));
    lines.push(`M${pts.join(' L')}`);
  }
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const a = at(r, c);
      const b = at(r + 1, c + 1);
      const d = at(r, c + 1);
      const e = at(r + 1, c);
      lines.push(`M${a.join(' ')} L${b.join(' ')} M${d.join(' ')} L${e.join(' ')}`);
    }
  }
  return (
    <G>
      <Path d={lines.join(' ')} stroke="#2A1E5C" strokeWidth={2.6} fill="none" strokeLinecap="round" opacity={0.5} />
      <Path d={lines.join(' ')} stroke="#D8C99A" strokeWidth={1.1} fill="none" strokeLinecap="round" />
      <Circle cx={x0 + 6} cy={y0 + 1} r={2.4} fill="#E8D8A8" stroke={BEAR_LINE} strokeWidth={0.9} />
      <Circle cx={(x0 + x1) / 2} cy={y0 + 2} r={2.4} fill="#E8D8A8" stroke={BEAR_LINE} strokeWidth={0.9} />
      <Circle cx={x1 - 6} cy={y0 + 1} r={2.4} fill="#E8D8A8" stroke={BEAR_LINE} strokeWidth={0.9} />
    </G>
  );
}

/* ---------- 1. the fire in the courtyard ---------- */
function FireYard({ k }: { k: Ink }) {
  void k;
  const tick = useTick();
  return (
    <Frame label="Night in the high priest's courtyard. Servants warm their hands at a small fire of coals, and a servant girl points at Peter, a sturdy bearded man in a brick red tunic, who turns away from her with his hand raised">
      <Court />
      <Fire x={150} y={160} s={1.3} tick={tick} />
      <Robed
        x={64}
        y={158}
        s={1.05}
        robe="#7A4FA0"
        sash="#4E2F70"
        longHair
        band={CREAM}
        tilt={-6}
        arms={[
          [-9, -10, -18],
          [9, 31, -42],
        ]}
      />
      <Path d="M92 112 L100 110 M94 116 L103 117" stroke={GOLD} strokeWidth={1.8} strokeLinecap="round" opacity={0.8} />
      <Robed x={110} y={158} s={1.02} robe="#5C7C8A" sash="#3B5662" hair="#4A3426" tilt={8} arms={[[9, 21, -25]]} />
      <Robed x={190} y={158} s={1.02} flip robe="#8A5A2B" sash="#5E3A1A" hair="#6A5A48" band={CREAM} tilt={8} arms={[[9, 20, -24]]} />
      <Peter
        x={236}
        y={160}
        s={1.14}
        tilt={10}
        glance={1.2}
        arms={[
          [-9, -10, -17],
          [9, 15, -34],
        ]}
      />
    </Frame>
  );
}

/* ---------- 2. the look ---------- */
function Look({ k }: { k: Ink }) {
  void k;
  const tick = useTick();
  return (
    <Frame label="Dawn in the courtyard. A rooster crows on the wall. Jesus, in a white robe with a red sash and with his hands bound, is led away by a guard, and he turns his head to look back across the courtyard at Peter, who stands with his hand at his face, weeping">
      <Court dawn />
      <Rooster x={248} y={54} s={1.1} />
      <Fire x={166} y={162} s={0.75} tick={tick} />
      {/* the spear and the guard, then the rope to Jesus' bound hands */}
      <Path d="M18 90 L18 162" stroke={WOOD_D} strokeWidth={2.4} strokeLinecap="round" />
      <Polygon points="18,80 14,94 22,94" fill="#B9C0CC" stroke={BEAR_LINE} strokeWidth={1.2} strokeLinejoin="round" />
      <Path d="M58 130 Q70 138 86 133" stroke="#6B4A22" strokeWidth={2} strokeLinecap="round" fill="none" />
      <Robed
        x={38}
        y={160}
        s={1.15}
        flip
        robe="#5A6278"
        sash="#3A4054"
        hair="#2E2018"
        helm
        arms={[
          [-9, -17, -26],
          [9, 18, -26],
        ]}
      />
      <Jesus
        x={106}
        y={160}
        s={1.2}
        flip
        back
        glance={0.4}
        arms={[
          [-9, 14, -19],
          [9, 17, -20],
        ]}
      />
      <Peter
        x={226}
        y={160}
        s={1.14}
        flip
        tilt={14}
        face="sad"
        tear
        arms={[
          [-9, -8, -16],
          [9, 6, -41],
        ]}
      />
    </Frame>
  );
}

/* ---------- 3. the empty net ---------- */
function Boat({ k }: { k: Ink }) {
  void k;
  const sway = useRun(0, 2200);
  const bob = Math.sin(sway * Math.PI * 2) * 1.2;
  return (
    <Frame label="A fishing boat on a dark lake at night. Peter, a bearded man in a brick red tunic, and two others hold up a net between them, and it is empty">
      <Rect x={10} y={10} width={280} height={162} rx={12} fill="#13284A" />
      {STARS.map(([x, y, r], i) => (
        <Circle key={i} cx={x} cy={y} r={r} fill="#FFF1B8" />
      ))}
      <Circle cx={54} cy={40} r={18} fill={CREAM} opacity={0.18} />
      <Circle cx={54} cy={40} r={10} fill={CREAM} />
      <Path d="M10 92 Q40 74 76 86 Q110 70 150 84 Q200 72 240 86 Q268 78 290 88 L290 100 L10 100 Z" fill="#0E1B34" />
      <Path d="M10 96 L290 96 L290 160 Q290 172 278 172 L22 172 Q10 172 10 160 Z" fill={NIGHT_WATER} />
      <Path
        d="M24 108 L52 108 M214 104 L246 104 M30 156 L70 156 M214 158 L258 158 M130 164 L170 164"
        stroke="#2F5C8A"
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Ellipse cx={246} cy={150} rx={30} ry={7} fill={GOLD} opacity={0.2} />
      <G transform={`translate(0 ${bob})`}>
        {/* the lantern on the bow */}
        <Path d="M244 104 L244 78" stroke={WOOD_D} strokeWidth={2.4} strokeLinecap="round" />
        <Circle cx={244} cy={72} r={22} fill={GOLD} opacity={0.18} />
        <Circle cx={244} cy={72} r={12} fill={GOLD} opacity={0.3} />
        <Rect x={239} y={66} width={10} height={12} rx={2} fill="#FFE9A8" stroke={BEAR_LINE} strokeWidth={1.2} />
        <Path d="M241 66 L244 62 L247 66" stroke={BEAR_LINE} strokeWidth={1.2} fill="none" />
        {/* the three men, then the boat in front of their legs */}
        <Robed
          x={84}
          y={126}
          s={0.95}
          robe="#2F7A8A"
          sash="#1B4C58"
          hair="#4A3426"
          band="#1B4C58"
          tilt={12}
          arms={[
            [9, 20, -26],
            [-9, 17, -28],
          ]}
        />
        <Robed x={208} y={126} s={0.9} flip robe="#3E8E4F" sash="#27613A" hair="#6A5A48" tilt={20} arms={[[9, 12, -12]]} />
        <Peter
          x={170}
          y={126}
          s={0.95}
          flip
          tilt={16}
          arms={[
            [9, 20, -26],
            [-9, 17, -28],
          ]}
        />
        <Hull x={150} y={112} />
        <Net x0={103} x1={151} y0={101} drop={50} />
        <Path d="M40 142 Q70 138 90 142 T130 142 T170 142 T210 142 T262 142 L262 160 L40 160 Z" fill={NIGHT_WATER} />
        <Path d="M50 142 Q70 138 90 142 T130 142 T170 142 T210 142 T252 142" stroke="#4A7CB0" strokeWidth={1.6} fill="none" strokeLinecap="round" />
      </G>
    </Frame>
  );
}

/* ---------- 4. swimming for the shore ---------- */
function Swim({ k }: { k: Ink }) {
  void k;
  const tick = useTick(260);
  const p = useRun(200, 2600);
  const dx = -22 * (1 - p);
  const bob = tick % 2 === 0 ? 0 : 1.2;
  return (
    <Frame label="Dawn on the lake. Peter, a bearded man in a brick red tunic, swims hard for the shore with one arm reaching, and the fishing boat is far behind him. On the sand a figure in white stands by a small fire">
      <Rect x={10} y={10} width={280} height={162} rx={12} fill="#E58B88" />
      <Rect x={10} y={42} width={280} height={34} fill="#F5B28A" />
      <Rect x={10} y={76} width={280} height={24} fill="#FAD8A0" />
      <Circle cx={176} cy={100} r={44} fill={GOLD} opacity={0.2} />
      <Circle cx={176} cy={100} r={28} fill={GOLD} opacity={0.4} />
      <Path d="M148 100 A28 28 0 0 1 204 100 Z" fill="#FFE9A8" />
      <Path d="M10 100 L290 100 L290 160 Q290 172 278 172 L22 172 Q10 172 10 160 Z" fill={WATER} />
      <Rect x={10} y={100} width={280} height={11} fill="#7EB0C8" />
      <Path d="M158 106 L196 106 M162 114 L192 114 M166 124 L188 124 M170 134 L184 134" stroke={GOLD} strokeWidth={2.4} strokeLinecap="round" opacity={0.5} />
      <Path d="M24 146 L58 146 M74 160 L112 160 M120 150 L146 150 M150 165 L190 165" stroke="#7EB0C8" strokeWidth={1.8} strokeLinecap="round" />
      {/* the boat, far behind, with the others and a net trailing */}
      <Net x0={38} x1={62} y0={119} drop={16} rows={3} cols={4} />
      <G opacity={0.98}>
        <Robed x={54} y={116} s={0.5} robe="#2F7A8A" hair="#4A3426" arms={[[9, 14, -18]]} />
        <Robed x={78} y={116} s={0.5} robe="#3E8E4F" hair="#6A5A48" arms={[[9, 14, -18]]} />
        <Hull x={66} y={114} s={0.5} />
        <Rect x={26} y={134} width={80} height={10} fill={WATER} opacity={0.85} />
      </G>
      {/* the shore: sand, a small fire and the figure waiting */}
      <Path d="M214 172 Q218 140 240 130 Q262 122 290 122 L290 160 Q290 172 278 172 Z" fill={SAND} stroke="#B9955A" strokeWidth={1.4} strokeLinejoin="round" />
      <Path d="M236 144 Q256 136 290 138" stroke={SAND_D} strokeWidth={1.4} fill="none" opacity={0.7} />
      <Fire x={246} y={134} s={0.6} tick={tick} />
      <Jesus
        x={270}
        y={134}
        s={0.8}
        flip
        arms={[
          [-9, -8, -18],
          [9, 16, -48],
        ]}
      />
      {/* Peter in the water: back and coat, his head and beard, one arm over and one behind, the water over his waist */}
      <G transform={`translate(${dx + 8} ${bob})`}>
        <Ellipse cx={146} cy={123} rx={19} ry={10} fill={PETER.robe} stroke={BEAR_LINE} strokeWidth={1.5} />
        <Path d="M132 122 L160 122" stroke={PETER.sash} strokeWidth={3} />
        <Tube fill={PETER.robe} parts={[['M140 119 Q132 108 124 107', 5.4]]} />
        <Tube fill={SKIN} parts={[['M124 107 Q117 106 113 111', 4.2]]} />
        <Tube fill={PETER.robe} parts={[['M152 118 Q162 104 172 101', 5.4]]} />
        <Tube fill={SKIN} parts={[['M172 101 Q182 99 191 106', 4.2]]} />
        <Circle cx={163} cy={116} r={8.6} fill={SKIN} stroke={BEAR_LINE} strokeWidth={1.5} />
        <Path d="M154.4 114.6 Q154.6 105 163 105 Q171.6 105.4 171.6 114.6 Q167 110.6 163 111 Q158 110.6 154.4 114.6 Z" fill={PETER.hair} />
        <Path d="M157 120 Q163 128 170 120 Q168 124 163 125.6 Q158 124 157 120 Z" fill={PETER.hair} stroke={BEAR_LINE} strokeWidth={0.8} />
        <Circle cx={167} cy={115.6} r={1.5} fill={BEAR_LINE} />
        <Path d="M120 126 Q134 122 146 126 Q158 122 174 126 L174 140 L120 140 Z" fill={WATER} opacity={0.82} />
        <Path d="M118 126 Q134 122 146 126 Q158 122 176 126" stroke="#CFE8F2" strokeWidth={1.6} fill="none" strokeLinecap="round" />
        <Path d="M116 128 Q96 126 80 133 M122 134 Q104 134 90 140" stroke="#CFE8F2" strokeWidth={1.6} fill="none" strokeLinecap="round" opacity={0.8} />
        <Circle cx={196} cy={110} r={2.2} fill="#CFE8F2" />
        <Circle cx={201} cy={105} r={1.6} fill="#CFE8F2" />
        <Circle cx={192} cy={114} r={1.4} fill="#CFE8F2" />
        <Circle cx={110} cy={116} r={1.8} fill="#CFE8F2" />
      </G>
    </Frame>
  );
}

/* ---------- 5. breakfast on the shore ---------- */
function Shore({ k }: { k: Ink }) {
  void k;
  const tick = useTick();
  const d = useTick(300);
  const drip = (n: number) => ((d + n) % 4) * 4;
  return (
    <Frame label="On the shore at dawn, a fire of coals with fish and bread on it. Jesus, in a white robe with a red sash, hands a piece of bread to Peter, a bearded man in a brick red tunic who is soaking wet, water dripping from him">
      <Rect x={10} y={10} width={280} height={162} rx={12} fill="#F6CFA0" />
      <Circle cx={252} cy={52} r={22} fill={GOLD} opacity={0.35} />
      <Circle cx={252} cy={52} r={13} fill={GOLD} />
      <Path d="M10 100 Q60 86 112 96 Q170 82 230 94 Q262 90 290 98 L290 112 L10 112 Z" fill="#B3AB78" />
      <Rect x={10} y={106} width={280} height={24} fill="#7FB4D0" />
      <Path d="M30 116 L52 116 M100 122 L126 122 M200 114 L230 114" stroke="#B9DDEB" strokeWidth={1.6} strokeLinecap="round" />
      <Path d="M10 130 L290 130 L290 160 Q290 172 278 172 L22 172 Q10 172 10 160 Z" fill={SAND} />
      <Path d="M10 148 Q120 138 290 146 L290 160 Q290 172 278 172 L22 172 Q10 172 10 160 Z" fill="#D9BE86" opacity={0.7} />
      <Ellipse cx={186} cy={156} rx={26} ry={5} fill="#7FB4D0" opacity={0.6} />
      <Jesus
        x={118}
        y={154}
        s={1.2}
        face="smile"
        arms={[
          [-9, -12, -18],
          [9, 29, -31],
        ]}
      />
      <Peter
        wet
        x={186}
        y={154}
        s={1.2}
        flip
        tilt={4}
        face="smile"
        arms={[
          [-9, -12, -17],
          [9, 24, -30],
        ]}
      />
      <Ellipse cx={154} cy={118} rx={7} ry={4} fill="#E3B56A" stroke={BEAR_LINE} strokeWidth={1.2} />
      <Path d="M152 117 L154 120 M156 116 L158 119" stroke="#9A6A2A" strokeWidth={0.9} />
      {[
        [170, 160],
        [178, 166],
        [196, 162],
        [200, 168],
      ].map(([x, y], i) => (
        <Path
          key={i}
          d={`M${x} ${y + drip(i) * 0.4} Q${x - 1.8} ${y + 2.6 + drip(i) * 0.4} ${x} ${y + 3.4 + drip(i) * 0.4} Q${x + 1.8} ${y + 2.6 + drip(i) * 0.4} ${x} ${y + drip(i) * 0.4} Z`}
          fill="#8FD0F2"
          opacity={0.9 - (drip(i) / 12) * 0.5}
        />
      ))}
      <Fire x={146} y={164} s={1.1} tick={tick}>
        <Fish x={-6} y={-6} rot={-8} />
        <Fish x={-2} y={-2} rot={6} />
        <Loaf x={12} y={-4} />
        <Loaf x={9} y={0} />
      </Fire>
    </Frame>
  );
}

/* ---------- 6. three questions ---------- */
function Sheep({ x, y, s = 1, flip = false }: { x: number; y: number; s?: number; flip?: boolean }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`} stroke={BEAR_LINE} strokeWidth={1.2} strokeLinejoin="round">
      <Path d="M-5 0 L-5 5 M4 0 L4 5" stroke={BEAR_LINE} strokeWidth={1.6} strokeLinecap="round" />
      <Circle cx={-5} cy={-3} r={5} fill="#F3EBDD" />
      <Circle cx={0} cy={-6} r={5.6} fill="#F3EBDD" />
      <Circle cx={5} cy={-3} r={5} fill="#F3EBDD" />
      <Ellipse cx={-9.4} cy={-5} rx={3.2} ry={3.6} fill="#3A2A20" />
    </G>
  );
}
function Light({ x, y, p }: { x: number; y: number; p: number }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${0.35 + 0.65 * p})`} opacity={p}>
      <Circle cx={0} cy={0} r={15} fill={GOLD} opacity={0.2} />
      <Circle cx={0} cy={0} r={9} fill={GOLD} opacity={0.3} />
      <Path d="M0 6 Q-6 2 -4 -4 Q-2 -2 0 -10 Q2 -3 4 -4 Q6 2 0 6 Z" fill={GOLD} stroke={BEAR_LINE} strokeWidth={1.1} strokeLinejoin="round" />
      <Path d="M0 5 Q-2.4 2.6 -1.6 -1 Q0 0 0.6 -4 Q2 0 1.6 2.4 Q1.4 4.6 0 5 Z" fill={CREAM} />
    </G>
  );
}
function Three({ k }: { k: Ink }) {
  void k;
  const tick = useTick();
  const p1 = useRun(300, 700);
  const p2 = useRun(900, 700);
  const p3 = useRun(1500, 700);
  return (
    <Frame label="Jesus and Peter sit facing each other by the shore fire. Three small lights glow in the air between them, one for each question, and sheep graze on a far hill">
      <Rect x={10} y={10} width={280} height={162} rx={12} fill="#F6D69C" />
      <Circle cx={60} cy={44} r={20} fill={GOLD} opacity={0.35} />
      <Circle cx={60} cy={44} r={12} fill={GOLD} />
      <Path d="M10 118 Q58 94 112 112 Q130 118 150 124 L10 124 Z" fill="#8DBA72" />
      <Path d="M130 124 Q200 84 290 100 L290 124 Z" fill="#7FAF6A" />
      <Path d="M130 124 Q200 84 290 100" stroke="#5E9156" strokeWidth={2} fill="none" />
      <Sheep x={252} y={95} s={0.75} flip />
      <Sheep x={276} y={101} s={0.8} />
      <Sheep x={36} y={114} s={0.7} />
      <Sheep x={60} y={108} s={0.65} flip />
      <Rect x={10} y={122} width={280} height={14} fill="#7FB4D0" />
      <Path d="M24 129 L50 129 M236 128 L268 128" stroke="#B9DDEB" strokeWidth={1.6} strokeLinecap="round" />
      <Path d="M10 136 L290 136 L290 160 Q290 172 278 172 L22 172 Q10 172 10 160 Z" fill={SAND} />
      <Path d="M10 152 Q120 142 290 150 L290 160 Q290 172 278 172 L22 172 Q10 172 10 160 Z" fill="#D9BE86" opacity={0.7} />
      <Fire x={150} y={164} s={0.95} tick={tick} />
      <Light x={120} y={92} p={p1} />
      <Light x={150} y={76} p={p2} />
      <Light x={180} y={92} p={p3} />
      <Seated
        x={88}
        y={164}
        s={1.2}
        robe={WHITE}
        sash={RED}
        hair="#6B4A2E"
        beard
        longHair
        face="smile"
        arms={[
          [-8, -35, -14, -14],
          [8, -35, 27, -22],
        ]}
      />
      <Seated
        x={212}
        y={164}
        s={1.2}
        w={1.12}
        flip
        robe={PETER.robe}
        sash={PETER.sash}
        hair={PETER.hair}
        beard
        tilt={4}
        arms={[
          [-8, -35, -14, -14],
          [8, -35, 21, -15],
        ]}
      />
    </Frame>
  );
}

/* ---------- 7 to 9. the ski slope ---------- */
type Slope = { y0: number; k: number; ang: number; surf: (x: number) => number };
function makeSlope(y0: number): Slope {
  const k = (158 - y0) / 280;
  return { y0, k, ang: (Math.atan(k) * 180) / Math.PI, surf: (x) => y0 + k * (x - 10) };
}
const STEEP = makeSlope(12);
const MILD = makeSlope(38);

function SlopeStage({ sl, children }: { sl: Slope; children?: ReactNode }) {
  const snow = `M10 ${sl.y0} L290 158 L290 160 Q290 172 278 172 L22 172 Q10 172 10 160 Z`;
  const xe = Math.min(290, 10 + (150 - sl.y0) / sl.k);
  const shade = `M10 ${sl.y0 + 22} L${xe} 172 L22 172 Q10 172 10 160 Z`;
  const tree = (x: number) => {
    const y = sl.surf(x) + 5;
    return (
      <G key={x} stroke={BEAR_LINE} strokeWidth={1.2} strokeLinejoin="round">
        <Rect x={x - 2} y={y - 6} width={4} height={8} fill={WOOD_D} />
        <Polygon points={`${x},${y - 44} ${x - 13},${y - 6} ${x + 13},${y - 6}`} fill="#2F6A4A" />
        <Polygon points={`${x},${y - 56} ${x - 9},${y - 30} ${x + 9},${y - 30}`} fill="#3A7C57" />
        <Path d={`M${x - 6} ${y - 40} Q${x} ${y - 36} ${x + 6} ${y - 40}`} stroke="#F4FAFF" strokeWidth={2} fill="none" />
      </G>
    );
  };
  return (
    <G>
      <Rect x={10} y={10} width={280} height={162} rx={12} fill="#8FBFE3" />
      <Circle cx={252} cy={34} r={20} fill={CREAM} opacity={0.35} />
      <Circle cx={252} cy={34} r={11} fill={CREAM} />
      <Path d="M130 120 L186 56 L206 78 L232 46 L290 104 L290 160 L130 160 Z" fill="#6F8FB8" stroke="#5A769C" strokeWidth={1.2} strokeLinejoin="round" />
      <Path d="M186 56 L176 69 L186 66 L194 71 Z M232 46 L220 62 L230 59 L240 64 Z" fill="#E6F0F8" />
      {[226, 252, 276].map(tree)}
      <Path d={snow} fill="#D3E6F4" />
      <Path d={shade} fill="#B9D4EA" opacity={0.7} />
      <Path d={`M10 ${sl.y0} L290 158`} stroke="#F4FAFF" strokeWidth={3} strokeLinecap="round" />
      <Path d={`M10 ${sl.y0 + 6} L290 ${158 + 6}`} stroke="#9FC4E0" strokeWidth={1.4} strokeDasharray="10 14" strokeLinecap="round" opacity={0.7} />
      {children}
    </G>
  );
}

/* a helmeted head in a skier's own space, centered on (0, 0); f is which way the face looks */
function SkiHead({
  x,
  y,
  f = 1,
  helm,
  goggles,
  grey,
  rot = 0,
}: {
  x: number;
  y: number;
  f?: number;
  helm: string;
  goggles: 'on' | 'up';
  grey?: boolean;
  rot?: number;
}) {
  return (
    <G transform={`translate(${x} ${y}) rotate(${rot * f}) scale(${f} 1)`}>
      <Circle cx={0} cy={0} r={8.5} fill={SKIN} stroke={BEAR_LINE} strokeWidth={1.5} />
      <Path
        d={grey ? 'M-8.2 -1 Q-10.4 5 -5.6 8 L-4.6 1 Z' : 'M-8.2 -1 Q-10 5 -5.6 7 L-4.6 1 Z'}
        fill={grey ? '#C9CDD8' : '#6A4A30'}
        stroke={BEAR_LINE}
        strokeWidth={0.8}
      />
      <Path d="M-9.4 0.4 A9.6 9.8 0 0 1 9.4 0.4 L8 1.4 Q0 -3 -8 1.4 Z" fill={helm} stroke={BEAR_LINE} strokeWidth={1.3} strokeLinejoin="round" />
      {goggles === 'on' ? (
        <G>
          <Path d="M-8.6 1.6 L-2 1.6" stroke="#1E2636" strokeWidth={2.2} />
          <Ellipse cx={4.2} cy={1.8} rx={5.8} ry={3.8} fill="#1E2636" stroke={BEAR_LINE} strokeWidth={1} />
          <Ellipse cx={5.4} cy={1.2} rx={2.6} ry={1.4} fill="#7FD0F0" opacity={0.85} />
        </G>
      ) : (
        <G>
          <Path d="M-6 -4.6 Q0 -9 7.4 -4.6" stroke="#1E2636" strokeWidth={4} fill="none" strokeLinecap="round" />
          <Path d="M-1.4 -6.4 Q2 -8 5.4 -6.2" stroke="#7FD0F0" strokeWidth={1.6} fill="none" strokeLinecap="round" opacity={0.85} />
          <Circle cx={4.2} cy={0.6} r={1.4} fill={BEAR_LINE} />
          <Path d="M2.2 4.6 Q4.4 6 6.8 4.2" stroke="#C98A6A" strokeWidth={1.1} fill="none" strokeLinecap="round" />
        </G>
      )}
    </G>
  );
}

type Pt = [number, number];
/* the grandfather on the slope, drawn in the slope's own space (x runs downhill, y 0 is the snow, up is negative). up is how far his body has come up from
   lying (0 flat, about 50 sitting up); reach is a screen point his near hand goes to; bent folds one knee; faceLeft turns his face up the hill */
function Gramps({
  x,
  sl,
  s = 1.15,
  up,
  reach,
  bent = false,
  faceLeft = false,
  goggles = 'on',
  armUp = [-8, -24],
  tilt = 0,
  children,
}: {
  x: number;
  sl: Slope;
  s?: number;
  up: number;
  reach?: Pt;
  bent?: boolean;
  faceLeft?: boolean;
  goggles?: 'on' | 'up';
  armUp?: Pt;
  tilt?: number;
  children?: ReactNode;
}) {
  const oy = sl.surf(x);
  const a = (up * Math.PI) / 180;
  const hip: Pt = [8, -8];
  const sh: Pt = [hip[0] - 24 * Math.cos(a), hip[1] - 24 * Math.sin(a)];
  const hd: Pt = [sh[0] - 11 * Math.cos(a + 0.14), sh[1] - 11 * Math.sin(a + 0.14)];
  const ca = Math.cos((sl.ang * Math.PI) / 180);
  const sa = Math.sin((sl.ang * Math.PI) / 180);
  const hand: Pt = reach
    ? [((reach[0] - x) * ca + (reach[1] - oy) * sa) / s, (-(reach[0] - x) * sa + (reach[1] - oy) * ca) / s]
    : [sh[0] + armUp[0], sh[1] + armUp[1]];
  const plant: Pt = [sh[0] + 9, -1.5];
  const JACKET = '#2F6FB0';
  const PANTS = '#2A2F45';
  const GLOVE = '#2E3340';
  return (
    <G transform={`translate(${x} ${oy}) rotate(${sl.ang}) scale(${s})`}>
      {children}
      {/* skis crossed at his boots */}
      <Tube fill="#E0B020" parts={[['M12.8 1.2 L63.2 -11.2', 4]]} />
      <Tube fill="#D9622B" parts={[['M14.8 -15.2 L65.2 -2.8', 4]]} />
      {/* legs and boots */}
      <Tube fill={PANTS} parts={[['M8 -8 L38 -5', 8]]} />
      {bent ? (
        <Tube
          fill={PANTS}
          parts={[
            ['M8 -9 L22 -23', 8],
            ['M22 -23 L39 -9', 8],
          ]}
        />
      ) : (
        <Tube fill={PANTS} parts={[['M6 -11 L38 -10', 8]]} />
      )}
      <Ellipse cx={39} cy={-5} rx={5.4} ry={3.2} fill="#1D2230" stroke={BEAR_LINE} strokeWidth={1} />
      <Ellipse cx={40} cy={-9.4} rx={5.4} ry={3.2} fill="#1D2230" stroke={BEAR_LINE} strokeWidth={1} />
      {/* the arm planted on the snow, the body, the arm up or reaching, then the head */}
      <Tube fill={JACKET} parts={[[`M${sh[0]} ${sh[1]} L${plant[0]} ${plant[1]}`, 5.4]]} />
      <Hand x={plant[0]} y={plant[1]} r={3.4} fill={GLOVE} />
      <Tube fill={JACKET} parts={[[`M${hip[0]} ${hip[1]} L${sh[0]} ${sh[1]}`, 13]]} />
      <Path
        d={`M${(hip[0] + sh[0]) / 2 - 1} ${(hip[1] + sh[1]) / 2 - 5} L${(hip[0] + sh[0]) / 2 + 1} ${(hip[1] + sh[1]) / 2 + 5}`}
        stroke="#9CC4E8"
        strokeWidth={1.4}
        opacity={0.8}
      />
      <Tube fill={JACKET} parts={[[`M${sh[0]} ${sh[1]} L${hand[0]} ${hand[1]}`, 5.4]]} />
      <Hand x={hand[0]} y={hand[1]} r={3.6} fill={GLOVE} />
      <SkiHead x={hd[0]} y={hd[1]} f={faceLeft ? -1 : 1} helm={RED} goggles={goggles} grey rot={tilt} />
    </G>
  );
}

function Spray({ pts }: { pts: [number, number, number][] }) {
  return (
    <G>
      {pts.map(([x, y, r], i) => (
        <Circle key={i} cx={x} cy={y} r={r} fill="#F6FBFF" stroke="#9FC4E0" strokeWidth={0.8} opacity={0.95} />
      ))}
    </G>
  );
}
function Pole({ x0, y0, x1, y1 }: { x0: number; y0: number; x1: number; y1: number }) {
  return (
    <G strokeLinecap="round">
      <Path d={`M${x0} ${y0} L${x1} ${y1}`} stroke={BEAR_LINE} strokeWidth={3.4} />
      <Path d={`M${x0} ${y0} L${x1} ${y1}`} stroke="#8A90A0" strokeWidth={1.8} />
      <Circle cx={x1} cy={y1} r={2.8} fill="none" stroke={BEAR_LINE} strokeWidth={1.2} />
    </G>
  );
}

function SkiFall({ k }: { k: Ink }) {
  void k;
  const p = useRun(200, 1100);
  const burst = 0.4 + 0.6 * p;
  const x = 138;
  const oy = STEEP.surf(x);
  return (
    <Frame label="A grandfather in ski gear, a red helmet and goggles, lies sprawled on his back on a steep snowy slope after a hard fall, his skis crossed, one arm flung up, snow still flying">
      <SlopeStage sl={STEEP} />
      <Pole x0={92} y0={STEEP.surf(92) - 4} x1={64} y1={STEEP.surf(64) - 34} />
      <Pole x0={188} y0={STEEP.surf(188) + 8} x1={226} y1={STEEP.surf(226) + 20} />
      <Gramps x={x} sl={STEEP} up={0} armUp={[-7, -27]} />
      <G transform={`translate(${x} ${oy}) rotate(${STEEP.ang})`} opacity={p}>
        <Spray
          pts={[
            [-52 * burst, -4, 3.4],
            [-62 * burst, -12, 2.4],
            [-44 * burst, -16, 2],
            [-70 * burst, -2, 1.8],
            [60 * burst, -16, 2.6],
            [70 * burst, -8, 1.8],
          ]}
        />
      </G>
    </Frame>
  );
}
function SkiStuck({ k }: { k: Ink }) {
  void k;
  const t = useTick(280);
  const slide = (t % 3) * 1.4;
  const x = 150;
  const oy = STEEP.surf(x);
  return (
    <Frame label="The same grandfather in a red helmet and goggles, propped on one arm on the steep snowy slope, trying to push himself up, his skis tangled and a groove in the snow where he keeps sliding back, snow spraying">
      <SlopeStage sl={STEEP} />
      <Pole x0={104} y0={STEEP.surf(104) - 2} x1={72} y1={STEEP.surf(72) - 4} />
      <G transform={`translate(${x} ${oy}) rotate(${STEEP.ang})`}>
        <Path d="M-96 2.4 L-30 2.4" stroke="#8FB3D2" strokeWidth={3.4} strokeDasharray="8 7" strokeLinecap="round" />
        <Path
          d="M-84 -6 L-76 2.4 L-84 10.4 M-62 -6 L-54 2.4 L-62 10.4"
          stroke="#6F96BA"
          strokeWidth={1.8}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          transform={`translate(${slide} 0)`}
        />
      </G>
      <Gramps x={x} sl={STEEP} up={46} bent armUp={[-14, -16]} tilt={-12} />
      <G transform={`translate(${x} ${oy}) rotate(${STEEP.ang})`}>
        <Spray
          pts={[
            [-26, 0, 3],
            [-34, -6, 2.2],
            [-18, 3, 2],
            [64, -4, 2.8],
            [72, -12, 2],
            [58, -20, 1.8],
            [-52, -14, 1.8],
          ]}
        />
        <Path
          d="M-30 -52 L-36 -56 M-24 -56 L-26 -62 M-35 -46 L-42 -48"
          stroke={BEAR_LINE}
          strokeWidth={1.6}
          strokeLinecap="round"
          opacity={0.6}
          transform="scale(1.15)"
        />
      </G>
    </Frame>
  );
}

/* the grandson, twelve, standing on the snow with his skis side by side, leaning down to the hand he holds. reach is a screen point */
function Boy({ x, sl, s = 0.85, reach }: { x: number; sl: Slope; s?: number; reach: Pt }) {
  const oy = sl.surf(x);
  const hand: Pt = [(reach[0] - x) / s, (reach[1] - oy) / s];
  const JACKET = '#D9822B';
  const PANTS = '#2A2F45';
  return (
    <G transform={`translate(${x} ${oy}) scale(${s})`}>
      <G transform={`rotate(${sl.ang})`}>
        <Tube fill="#E0B020" parts={[['M-26 -2 L28 -2', 4]]} />
        <Tube fill="#D9622B" parts={[['M-20 -7 L32 -7', 4]]} />
      </G>
      <Tube
        fill={PANTS}
        parts={[
          ['M-1 -27 L-4 -5', 7],
          ['M4 -27 L8 -4', 7],
        ]}
      />
      <Ellipse cx={-4} cy={-3} rx={6} ry={3} fill="#1D2230" stroke={BEAR_LINE} strokeWidth={1} />
      <Ellipse cx={9} cy={-2.4} rx={6} ry={3} fill="#1D2230" stroke={BEAR_LINE} strokeWidth={1} />
      <Tube fill={JACKET} parts={[['M0 -27 L5 -45', 13]]} />
      <Tube fill={JACKET} parts={[[`M5 -46 L${hand[0]} ${hand[1]}`, 5.2]]} />
      <Hand x={hand[0]} y={hand[1]} r={3.4} fill="#2E3340" />
      <SkiHead x={8} y={-57} helm="#2FA39A" goggles="up" rot={12} />
    </G>
  );
}
function SkiHand({ k }: { k: Ink }) {
  void k;
  const p = useRun(300, 1400);
  const sl = MILD;
  const gx = 150;
  const bx = 108;
  const gOy = sl.surf(gx);
  const a = (46 * Math.PI) / 180;
  const sh: Pt = [8 - 24 * Math.cos(a), -8 - 24 * Math.sin(a)];
  const ca = Math.cos((sl.ang * Math.PI) / 180);
  const sa = Math.sin((sl.ang * Math.PI) / 180);
  const gShoulder: Pt = [gx + (sh[0] * ca - sh[1] * sa) * 1.15, gOy + (sh[0] * sa + sh[1] * ca) * 1.15];
  const bShoulder: Pt = [bx + 5 * 0.85, sl.surf(bx) - 46 * 0.85];
  const rise = 1 - p;
  const m: Pt = [(gShoulder[0] + bShoulder[0]) / 2, (gShoulder[1] + bShoulder[1]) / 2 + 2];
  return (
    <Frame label="The grandson, twelve years old, in ski gear, stands on the slope and reaches down to hold his grandfather's hand and pull him up. The grandfather, sitting up, looks up at him, and they look each other in the eye">
      <SlopeStage sl={sl} />
      <Pole x0={188} y0={sl.surf(188) - 2} x1={214} y1={sl.surf(214) - 2} />
      <Gramps x={gx} sl={sl} up={46 + 8 * rise} reach={m} bent={false} faceLeft goggles="up" tilt={6} />
      <Boy x={bx} sl={sl} reach={m} />
      <Circle cx={m[0]} cy={m[1]} r={12} fill={GOLD} opacity={0.3} />
      <Circle cx={m[0]} cy={m[1]} r={6} fill={GOLD} opacity={0.35} />
    </Frame>
  );
}

/* ---------- 10. a path that opens again and again ---------- */
function Archway({ y, s }: { y: number; s: number }) {
  const outer = 'M-42 0 L-42 -68 Q-42 -102 0 -102 Q42 -102 42 -68 L42 0 Z';
  const inner = 'M-32 0 L-32 -66 Q-32 -92 0 -92 Q32 -92 32 -66 L32 0 Z';
  return (
    <G transform={`translate(150 ${y}) scale(${s})`}>
      <Path d="M32 0 L56 -8 L56 -76 L32 -66 Z" fill="#8A5A33" stroke={BEAR_LINE} strokeWidth={1.4 / s} strokeLinejoin="round" />
      <Path d="M40 -10 L40 -66 M48 -12 L48 -72" stroke={WOOD_D} strokeWidth={1 / s} opacity={0.6} />
      <Path d={`${outer} ${inner}`} fill="#E0CC9C" fillRule="evenodd" stroke={BEAR_LINE} strokeWidth={1.5 / s} strokeLinejoin="round" />
      <Path d="M-42 -34 L-32 -34 M-42 -16 L-32 -16 M32 -34 L42 -34 M32 -16 L42 -16" stroke="#A78F5C" strokeWidth={1.2 / s} />
    </G>
  );
}
function Doors({ k }: { k: Ink }) {
  void k;
  const p = useRun(200, 1800);
  const glow = 0.5 + 0.2 * Math.sin(p * Math.PI);
  const arches: [number, number][] = [
    [160, 1],
    [132, 0.6],
    [114, 0.38],
    [104, 0.24],
    [98, 0.15],
  ];
  return (
    <Frame label="A path that leads through a row of arches, every door standing open, one after another, each smaller than the last, toward a warm light on the horizon">
      <Rect x={10} y={10} width={280} height={162} rx={12} fill="#2B2750" />
      <Rect x={10} y={60} width={280} height={44} fill="#6A4A7A" opacity={0.5} />
      <Rect x={10} y={80} width={280} height={24} fill="#C9786A" opacity={0.5} />
      <Polygon points="150,92 10,20 60,10 150,92 240,10 290,24" fill={GOLD} opacity={0.1} />
      <Circle cx={150} cy={92} r={46} fill={GOLD} opacity={glow * 0.3} />
      <Circle cx={150} cy={92} r={24} fill={GOLD} opacity={glow * 0.5} />
      <Circle cx={150} cy={92} r={11} fill="#FFE9A8" />
      <Path d="M10 104 Q50 88 96 100 Q122 94 150 98 Q180 92 210 100 Q250 88 290 104 L290 112 L10 112 Z" fill="#1D1A3C" />
      <Path d="M10 100 L290 100 L290 160 Q290 172 278 172 L22 172 Q10 172 10 160 Z" fill="#3A3366" />
      <Path d="M144 99 L156 99 L196 172 L104 172 Z" fill="#F0D398" stroke="#B9955A" strokeWidth={1.2} strokeLinejoin="round" />
      <Path d="M150 104 L150 112 M150 120 L150 132 M150 142 L150 158" stroke="#C9A56A" strokeWidth={1.8} strokeLinecap="round" />
      {arches
        .slice()
        .reverse()
        .map(([y, s]) => (
          <Archway key={y} y={y} s={s} />
        ))}
    </Frame>
  );
}

/* ---------- 11. fallen, kneeling, standing ---------- */
const WALKER = { robe: '#2FA39A', sash: '#1B6E67', hair: '#2E2018' };
function Rise({ k }: { k: Ink }) {
  void k;
  const p1 = useRun(200, 900);
  const p2 = useRun(900, 900);
  const p3 = useRun(1600, 900);
  return (
    <Frame label="One simple figure shown in three stages from left to right: lying fallen on the ground, then kneeling with one hand on a knee, then standing up and stepping forward, with the light growing at each stage">
      <Rect x={10} y={10} width={280} height={162} rx={12} fill="#26305C" />
      <Circle cx={150} cy={108} r={30} fill={GOLD} opacity={0.07 * p2} />
      <Circle cx={150} cy={108} r={18} fill={GOLD} opacity={0.09 * p2} />
      <Circle cx={240} cy={96} r={40} fill={GOLD} opacity={0.1 * p3} />
      <Circle cx={240} cy={96} r={24} fill={GOLD} opacity={0.14 * p3} />
      <Path d="M10 128 L290 128 L290 160 Q290 172 278 172 L22 172 Q10 172 10 160 Z" fill="#4A4378" />
      <Path d="M10 146 Q150 136 290 144 L290 160 Q290 172 278 172 L22 172 Q10 172 10 160 Z" fill="#6A5FA0" opacity={0.8} />
      <Ellipse cx={240} cy={160} rx={52} ry={7} fill={GOLD} opacity={0.22 * p3} />
      <Ellipse cx={150} cy={160} rx={38} ry={6} fill={GOLD} opacity={0.14 * p2} />
      <Path
        d="M92 126 Q108 106 128 118 M130 118 L124 112 M130 118 L123 123"
        stroke={GOLD}
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="1 5"
        opacity={0.8 * p2}
      />
      <Path
        d="M176 124 Q198 100 218 112 M218 112 L211 106 M218 112 L210 118"
        stroke={GOLD}
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="1 5"
        opacity={0.8 * p3}
      />
      <Robed
        x={20}
        y={146}
        s={1.05}
        rot={90}
        flip
        robe={WALKER.robe}
        sash={WALKER.sash}
        hair={WALKER.hair}
        arms={[
          [-9, -14, -12],
          [9, 14, -24],
        ]}
      />
      <Seated
        x={150}
        y={160}
        s={1.2}
        kneel
        robe={WALKER.robe}
        sash={WALKER.sash}
        hair={WALKER.hair}
        tilt={14}
        arms={[
          [-8, -36, 6, -2],
          [8, -36, 24, -16],
        ]}
      />
      <Robed
        x={238}
        y={160}
        s={1.32}
        rot={3}
        feet={[-9, 12]}
        robe={WALKER.robe}
        sash={WALKER.sash}
        hair={WALKER.hair}
        tilt={-8}
        face="smile"
        arms={[
          [-9, -15, -16],
          [9, 19, -24],
        ]}
      />
    </Frame>
  );
}

export const SCENES_I7: Record<string, ComponentType<{ k: Ink }>> = {
  'g7-fire': FireYard,
  'g7-look': Look,
  'g7-boat': Boat,
  'g7-swim': Swim,
  'g7-shore': Shore,
  'g7-three': Three,
  'g7-ski': SkiFall,
  'g7-stuck': SkiStuck,
  'g7-hand': SkiHand,
  'g7-path': Doors,
  'g7-rise': Rise,
};
