/* Scenes for lesson g10, "First, make peace" (see story-kit.tsx and story-scenes-f-l31.tsx for the approach): Jacob dressed in goatskin to fool blind Isaac, the dust of
   Esau's four hundred riders, the droves of gifts with a space between each, Jacob bowing to the ground, the brothers weeping in each other's arms, the face
   like the face of God, the gift left at the altar while a man goes to make peace, the sons of Mosiah on the road, a sincere sorry across a small table, one
   walk across open ground, the hospital that said nothing and the one that sat down and told the truth, and the lawsuits that fell.
   Jacob always wears a blue-gray robe and has dark hair and a dark beard; Esau a rust-red robe, red-brown hair and beard and a ruddier face (he is the hairy,
   ruddy twin); Isaac a sand robe with white hair and beard; Rebekah purple. Every figure carries a dark outline so it reads on a dark card and a cream one. */
import { type ComponentType, type ReactNode, useEffect, useState } from 'react';
import { Easing } from 'react-native';
import { Circle, Ellipse, G, Line, Path, Polygon, Rect } from 'react-native-svg';

import { useAppear, useReducedMotion } from '@/lib/motion';

import { BEAR_LINE, Frame, type Ink } from './story-kit';

const SKIN = '#E7B98F';
const SKIN_RUDDY = '#E0A27C';
const HAIR = '#3A2A20';
const GOLD = '#FFD25A';
const GOLD_D = '#C98F1A';
const CREAM = '#FFF5E1';
const WHITE = '#F8F4EA';
const WOOD = '#B07A45';
const WOOD_D = '#5E3A1A';
const EDGE = '#8A6A3A';
const SKY = '#F7D9A2';
const SAND = '#EBD3A2';
const SAND_D = '#D2A86A';
const STONE = '#F3E3BC';
const WALL = '#EAD0A0';
const HEART = '#E5405A';
const GRASS = '#9DB068';
const DARK = '#2A1810';

const JACOB = { robe: '#6E8CA6', sash: '#44607A', hair: '#2A1E18' };
const ESAU = { robe: '#B5472A', sash: '#7A2A14', hair: '#8A3A1E' };
const ISAAC = { robe: '#CDB88A', sash: '#8A6A3A', hair: '#F2EEE6' };
const REBEKAH = { robe: '#7A4FA0', sash: '#4A2E70', hair: '#3A2A20' };
const FOLK = ['#7A4FA0', '#5C7C8A', '#8A5A2B', '#C27A8A', '#7A8A4A', '#4F6FBF', '#A06A3A', '#6A5A8A'];
const FOLK_HAIR = ['#3A2A20', '#2A1E18', '#6A4A30', '#8A8A8E', '#4A3426'];

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
function Hand({ x, y, r = 3.6, fill = SKIN }: { x: number; y: number; r?: number; fill?: string }) {
  return <Circle cx={x} cy={y} r={r} fill={fill} stroke={BEAR_LINE} strokeWidth={1.2} />;
}
/* round shapes with one outline around the whole group */
function Blob({ c, fill, w = 1.2 }: { c: [number, number, number][]; fill: string; w?: number }) {
  return (
    <G>
      {c.map(([x, y, r], i) => (
        <Circle key={`o${i}`} cx={x} cy={y} r={r + w} fill={BEAR_LINE} />
      ))}
      {c.map(([x, y, r], i) => (
        <Circle key={`f${i}`} cx={x} cy={y} r={r} fill={fill} />
      ))}
    </G>
  );
}

/* ---------- places ---------- */
function Stage({ fill = SKY }: { fill?: string }) {
  return <Rect x={10} y={10} width={280} height={162} rx={12} fill={fill} />;
}
function Ground({ top, fill }: { top: number; fill: string }) {
  return <Path d={`M10 ${top} L290 ${top} L290 160 Q290 172 278 172 L22 172 Q10 172 10 160 Z`} fill={fill} />;
}
function Sun({ x = 252, y = 38 }: { x?: number; y?: number }) {
  return (
    <G>
      <Circle cx={x} cy={y} r={20} fill={GOLD} opacity={0.35} />
      <Circle cx={x} cy={y} r={12} fill={GOLD} />
    </G>
  );
}
/* a flat-roofed stone house seen from the front, on y, with a dark arched door and a warm light behind it */
function House({ x0, x1, y, top, door }: { x0: number; x1: number; y: number; top: number; door: [number, number, number] }) {
  const [dx0, dx1, dtop] = door;
  const r = (dx1 - dx0) / 2;
  return (
    <G stroke={EDGE} strokeWidth={1.4} strokeLinejoin="round">
      <Rect x={x0} y={top} width={x1 - x0} height={y - top} fill={WALL} />
      <Rect x={x0 - 4} y={top - 8} width={x1 - x0 + 8} height={9} rx={2} fill={STONE} />
      <Path d={`M${dx0} ${y} L${dx0} ${dtop + r} Q${dx0} ${dtop} ${dx0 + r} ${dtop} Q${dx1} ${dtop} ${dx1} ${dtop + r} L${dx1} ${y} Z`} fill="#3A2418" />
      <Path
        d={`M${dx0 + 4} ${y} L${dx0 + 4} ${dtop + r + 2} Q${dx0 + 4} ${dtop + 6} ${dx0 + r} ${dtop + 6} Q${dx1 - 4} ${dtop + 6} ${dx1 - 4} ${dtop + r + 2} L${dx1 - 4} ${y} Z`}
        fill={GOLD}
        opacity={0.5}
        stroke="none"
      />
    </G>
  );
}
/* a small far house on the horizon */
function Far({ x, y, w = 20, h = 12 }: { x: number; y: number; w?: number; h?: number }) {
  return (
    <G stroke={EDGE} strokeWidth={1} strokeLinejoin="round">
      <Rect x={x} y={y - h} width={w} height={h} fill={STONE} />
      <Rect x={x - 2} y={y - h - 3} width={w + 4} height={4} fill={SAND} />
      <Rect x={x + w / 2 - 2.4} y={y - 6} width={4.8} height={6} fill="#3A2418" stroke="none" />
    </G>
  );
}

/* ---------- people ---------- */
const BODY = 'M-13 0 L-9 -33 Q-9 -42 0 -42 Q9 -42 9 -33 L13 0 Z';
type Arm = [number, number, number];
const ARMS_DOWN: Arm[] = [
  [-9, -12, -17],
  [9, 12, -17],
];
type RobedProps = {
  x: number;
  y: number;
  s?: number;
  flip?: boolean;
  rot?: number;
  robe: string;
  sash?: string;
  hair?: string;
  beard?: boolean;
  beardColor?: string;
  longHair?: boolean;
  band?: string;
  arms?: Arm[];
  tilt?: number;
  glance?: number;
  eye?: 'dot' | 'shut';
  tears?: boolean;
  lit?: boolean;
  skin?: string;
  children?: ReactNode;
};
/* a person in a long robe, standing on (x, y), facing right (flip turns them). arms are [shoulder x, hand x, hand y] in the person's own space; tilt turns the
   head (negative looks up); sash is a belt with a tail; band is a cloth around the head; lit puts a warm light on the face */
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
  beardColor,
  longHair = false,
  band,
  arms = ARMS_DOWN,
  tilt = 0,
  glance = 0,
  eye = 'dot',
  tears = false,
  lit = false,
  skin = SKIN,
  children,
}: RobedProps) {
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
          <Hand x={hx} y={hy} fill={skin} />
        </G>
      ))}
      {children}
      <G transform={`rotate(${tilt} 0 -42)`}>
        <Circle cx={0} cy={-49} r={8.5} fill={skin} stroke={BEAR_LINE} strokeWidth={sw} />
        {lit ? <Circle cx={0} cy={-49} r={8.5} fill="#FFF1B8" opacity={0.5} /> : null}
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
        {beard ? (
          <Path d="M-6.4 -46 Q0 -36 6.4 -46 Q4.6 -42 0 -40.6 Q-4.6 -42 -6.4 -46 Z" fill={beardColor ?? hair} stroke={BEAR_LINE} strokeWidth={sw * 0.6} />
        ) : null}
        {eye === 'shut' ? (
          <Path d="M2.4 -48.4 Q4.2 -46.8 6 -48.4" stroke={BEAR_LINE} strokeWidth={1.1} fill="none" strokeLinecap="round" />
        ) : (
          <Circle cx={4} cy={-48 + glance} r={1.5} fill={BEAR_LINE} />
        )}
        {tears ? (
          <G fill="#8FD0F0" stroke={BEAR_LINE} strokeWidth={0.5}>
            <Path d="M4.8 -46.4 Q6.2 -44 4.8 -42.8 Q3.4 -44 4.8 -46.4 Z" />
            <Path d="M7.2 -44.4 Q8.4 -42.4 7.2 -41.4 Q6 -42.4 7.2 -44.4 Z" />
          </G>
        ) : null}
      </G>
    </G>
  );
}
type Who = Omit<RobedProps, 'robe' | 'sash' | 'hair' | 'beard' | 'longHair' | 'beardColor' | 'skin'>;
function Jacob(p: Who) {
  return <Robed {...p} robe={JACOB.robe} sash={JACOB.sash} hair={JACOB.hair} beard />;
}
function Esau(p: Who) {
  return <Robed {...p} robe={ESAU.robe} sash={ESAU.sash} hair={ESAU.hair} beard longHair skin={SKIN_RUDDY} />;
}
function Isaac(p: Who) {
  return <Robed {...p} robe={ISAAC.robe} sash={ISAAC.sash} hair={ISAAC.hair} beard longHair />;
}
function Rebekah(p: Who) {
  return <Robed {...p} robe={REBEKAH.robe} sash={REBEKAH.sash} hair={REBEKAH.hair} longHair band={CREAM} />;
}
/* one of the crowd or a servant: a plain robe in one of a few colors */
function Folk({
  x,
  y,
  s = 1,
  i,
  flip = false,
  arms = [],
  tilt = 0,
}: {
  x: number;
  y: number;
  s?: number;
  i: number;
  flip?: boolean;
  arms?: Arm[];
  tilt?: number;
}) {
  return (
    <Robed
      x={x}
      y={y}
      s={s}
      flip={flip}
      robe={FOLK[i % FOLK.length]}
      hair={FOLK_HAIR[(i * 3) % FOLK_HAIR.length]}
      arms={arms}
      tilt={tilt}
      band={i % 3 === 0 ? CREAM : undefined}
    />
  );
}

/* Jacob bowed to the ground, kneeling with his forehead low and both arms stretched out before him, facing right */
function Bowed({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  const sw = 1.5 / s;
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Ellipse cx={-21} cy={0.6} rx={5} ry={2.2} fill={BEAR_LINE} />
      <Path d="M-22 0 Q-24 -20 -6 -27 Q10 -31 17 -15 L19 0 Z" fill={JACOB.robe} stroke={BEAR_LINE} strokeWidth={sw} strokeLinejoin="round" />
      <Path d="M-15 -12 Q0 -17 14 -12" stroke={JACOB.sash} strokeWidth={3.4} fill="none" strokeLinecap="round" />
      <Path d="M-22 0 Q-24 -20 -6 -27 Q10 -31 17 -15 L19 0 Z" fill="none" stroke={BEAR_LINE} strokeWidth={sw} strokeLinejoin="round" />
      <Tube fill={JACOB.robe} parts={[['M10 -19 L36 -3', 5]]} />
      <Hand x={37} y={-2.6} />
      <Circle cx={23} cy={-11} r={8.5} fill={SKIN} stroke={BEAR_LINE} strokeWidth={sw} />
      <Path d="M14.6 -10 Q14 -21 24 -20 Q31 -19 31.4 -13 Q25 -17 14.6 -10 Z" fill={JACOB.hair} />
      <Path d="M27 -5 Q32.6 -4 32 -10 Q29.6 -7 27 -5 Z" fill={JACOB.hair} stroke={BEAR_LINE} strokeWidth={0.6} />
    </G>
  );
}

/* ---------- animals, facing right, standing on (x, y) ---------- */
type Kind = 'goat' | 'sheep' | 'camel' | 'cattle' | 'donkey';
function Animal({ kind, x, y, s = 1, flip = false }: { kind: Kind; x: number; y: number; s?: number; flip?: boolean }) {
  const sw = 1.3 / s;
  const st = { stroke: BEAR_LINE, strokeWidth: sw, strokeLinejoin: 'round' as const };
  let body: ReactNode = null;
  if (kind === 'goat') {
    body = (
      <G>
        <Tube
          fill="#B9A98A"
          parts={[
            ['M-7 -9 L-7 -1', 2.6],
            ['M-3.6 -9 L-3.6 -1', 2.6],
            ['M4 -9 L4 -1', 2.6],
            ['M7.4 -9 L7.4 -1', 2.6],
            ['M-9.5 -14 L-12.5 -17.5', 2],
          ]}
        />
        <Path d="M6.5 -14 L11.6 -22.6 L15.6 -20 L10.4 -9.6 Z" fill="#D9CBA8" {...st} />
        <Ellipse cx={0} cy={-12} rx={10} ry={5.6} fill="#D9CBA8" {...st} />
        <Ellipse cx={15.6} cy={-21.6} rx={4.6} ry={2.8} fill="#D9CBA8" transform="rotate(18 15.6 -21.6)" {...st} />
        <Path d="M12.4 -23.4 Q10.6 -28.6 14.2 -29.6" stroke="#7A6A52" strokeWidth={1.6} fill="none" strokeLinecap="round" />
        <Path d="M17.4 -19.8 L18 -16.4 L15.8 -19.2 Z" fill="#7A6A52" />
        <Circle cx={15.4} cy={-22.4} r={0.9} fill={BEAR_LINE} />
      </G>
    );
  } else if (kind === 'sheep') {
    body = (
      <G>
        <Tube
          fill="#3A2A20"
          parts={[
            ['M-5 -6 L-5 -1', 2.8],
            ['M5 -6 L5 -1', 2.8],
          ]}
        />
        <Blob
          fill="#F4EEDD"
          w={sw}
          c={[
            [-6, -11, 6],
            [0, -14, 7],
            [6, -11, 6],
            [-1, -8, 6.4],
            [4, -8.4, 5],
          ]}
        />
        <Ellipse cx={11.4} cy={-11} rx={4.4} ry={3.6} fill="#4A382C" {...st} />
        <Ellipse cx={8.6} cy={-13.8} rx={2.2} ry={1.1} fill="#4A382C" {...st} />
        <Circle cx={12.8} cy={-11.8} r={0.8} fill="#F4EEDD" />
      </G>
    );
  } else if (kind === 'camel') {
    body = (
      <G>
        <Tube
          fill="#B07A45"
          parts={[
            ['M-11 -16 L-11 -1', 3.6],
            ['M-6 -16 L-6 -1', 3.6],
            ['M7 -16 L7 -1', 3.6],
            ['M12 -16 L12 -1', 3.6],
            ['M-15 -24 L-17 -17', 1.8],
            ['M13 -24 Q19 -30 19 -38', 5.6],
          ]}
        />
        <Ellipse cx={-3} cy={-30} rx={6} ry={5.6} fill="#C99058" {...st} />
        <Ellipse cx={0} cy={-22} rx={16} ry={7.4} fill="#C99058" {...st} />
        <Ellipse cx={22.4} cy={-39.4} rx={5.8} ry={3} fill="#C99058" transform="rotate(-8 22.4 -39.4)" {...st} />
        <Circle cx={23.2} cy={-40.4} r={0.9} fill={BEAR_LINE} />
      </G>
    );
  } else if (kind === 'cattle') {
    body = (
      <G>
        <Tube
          fill="#5E3A1A"
          parts={[
            ['M-10 -12 L-10 -1', 3.6],
            ['M-5 -12 L-5 -1', 3.6],
            ['M7 -12 L7 -1', 3.6],
            ['M12 -12 L12 -1', 3.6],
            ['M-14 -21 Q-18 -16 -17 -9', 1.8],
          ]}
        />
        <Rect x={-15} y={-25} width={30} height={15} rx={6.5} fill="#8A5A3A" {...st} />
        <Ellipse cx={-4} cy={-19.5} rx={5.4} ry={3.6} fill="#F3E7C9" />
        <Ellipse cx={18.5} cy={-17.5} rx={6.4} ry={4.6} fill="#8A5A3A" {...st} />
        <Ellipse cx={23} cy={-15.5} rx={3.2} ry={2.6} fill="#E3B8A0" />
        <Path d="M15.4 -21.4 Q13 -26.4 16.6 -26" stroke="#F3E7C9" strokeWidth={1.7} fill="none" strokeLinecap="round" />
        <Ellipse cx={14.4} cy={-19.2} rx={2.4} ry={1.2} fill="#8A5A3A" {...st} />
        <Circle cx={19.6} cy={-18.6} r={0.9} fill={BEAR_LINE} />
      </G>
    );
  } else {
    body = (
      <G>
        <Tube
          fill="#7A7A84"
          parts={[
            ['M-7.5 -9 L-7.5 -1', 2.8],
            ['M-4 -9 L-4 -1', 2.8],
            ['M4.6 -9 L4.6 -1', 2.8],
            ['M8.2 -9 L8.2 -1', 2.8],
            ['M-11 -17 L-13 -9', 1.8],
          ]}
        />
        <Path d="M11.6 -29 L10.6 -38 L14.6 -30 Z" fill="#9A9AA2" {...st} />
        <Path d="M14 -30 L15 -38.4 L17.4 -29 Z" fill="#9A9AA2" {...st} />
        <Path d="M6.4 -19 L10.6 -29 L16.4 -27 L12.4 -14 Z" fill="#9A9AA2" {...st} />
        <Ellipse cx={0} cy={-16} rx={11.4} ry={6} fill="#9A9AA2" {...st} />
        <Ellipse cx={16.6} cy={-25.4} rx={5.6} ry={3.4} fill="#9A9AA2" transform="rotate(28 16.6 -25.4)" {...st} />
        <Ellipse cx={20.4} cy={-23.4} rx={2.8} ry={2.4} fill="#D9D3C4" />
        <Circle cx={16.4} cy={-26.6} r={0.9} fill={BEAR_LINE} />
      </G>
    );
  }
  return <G transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>{body}</G>;
}
const AW: Record<Kind, number> = { goat: 24, sheep: 24, camel: 40, cattle: 34, donkey: 30 };
/* where the head is, in the animal's own space: the servant's rope runs there */
const HEAD: Record<Kind, [number, number]> = { goat: [15, -21], sheep: [11, -11], camel: [22, -39], cattle: [19, -17], donkey: [16, -25] };
/* one drove: two animals and the servant who leads them, with the rope between the servant's hand and the lead animal's head */
function Drove({ kind, x, y, s, who, p = 1 }: { kind: Kind; x: number; y: number; s: number; who: number; p?: number }) {
  const w = AW[kind] * s;
  const [hx, hy] = HEAD[kind];
  const ss = 0.8 * s;
  const hand = x + (hx + 8) * s;
  const sx = hand + 14 * ss;
  const off = 14 * (1 - p);
  return (
    <G transform={`translate(${-off} 0)`}>
      <Animal kind={kind} x={x - w * 0.55} y={y - 3 * s} s={s * 0.92} />
      <Animal kind={kind} x={x} y={y} s={s} />
      <Line x1={x + hx * s} y1={y + hy * s} x2={hand} y2={y - 30 * ss} stroke="#6B4A22" strokeWidth={1.2} strokeLinecap="round" />
      <Folk x={sx} y={y} s={ss} i={who * 2 + 1} flip arms={[[9, 14, -30]]} />
    </G>
  );
}

/* a tiny rider on a small horse, far away */
function Rider({ x, y, s = 1, c = '#4A3426' }: { x: number; y: number; s?: number; c?: string }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Path d="M-3 1 L-3.6 5.4 M3 1 L3.6 5.4" stroke={c} strokeWidth={1.4} strokeLinecap="round" />
      <Ellipse cx={0} cy={0} rx={5.2} ry={2.7} fill={c} />
      <Path d="M3.6 -1 L7.6 -4.4 L8.8 -2.6 Z" fill={c} />
      <Rect x={-1.3} y={-6.8} width={2.6} height={4.8} fill="#B5532A" />
      <Circle cx={0} cy={-8.4} r={1.8} fill={SKIN} />
      <Path d="M2.4 -3 L4.6 -13" stroke={c} strokeWidth={0.8} />
    </G>
  );
}
/* a tiny man standing far away */
function Tiny({ x, y, c = '#5A3B2A' }: { x: number; y: number; c?: string }) {
  return (
    <G>
      <Path d={`M${x - 2.4} ${y} L${x - 2} ${y - 4} Q${x} ${y - 5.2} ${x + 2} ${y - 4} L${x + 2.4} ${y} Z`} fill={c} />
      <Circle cx={x} cy={y - 6.4} r={1.7} fill={SKIN} />
    </G>
  );
}

/* ---------- modern people, for the scenes with a table and a corridor ---------- */
type Mood = 'calm' | 'smile' | 'worry' | 'speak';
function Face({ cy, mood }: { cy: number; mood: Mood }) {
  const y0 = cy + 4.4;
  return (
    <G>
      <Circle cx={5} cy={cy + 0.6} r={1.4} fill={BEAR_LINE} />
      {mood === 'speak' ? (
        <Ellipse cx={5.4} cy={y0} rx={1.7} ry={1.2} fill={BEAR_LINE} />
      ) : (
        <Path
          d={
            mood === 'smile'
              ? `M3.2 ${y0 - 0.4} Q5.4 ${y0 + 2} 7.6 ${y0 - 0.4}`
              : mood === 'worry'
                ? `M3.2 ${y0 + 0.8} Q5.4 ${y0 - 1.4} 7.6 ${y0 + 0.8}`
                : `M3.2 ${y0} L7.4 ${y0}`
          }
          stroke={BEAR_LINE}
          strokeWidth={1}
          fill="none"
          strokeLinecap="round"
        />
      )}
    </G>
  );
}
const TEAL = '#2FA39A';
/* a person standing on (x, y) in everyday clothes, facing right. coat is a white doctor's coat with a stethoscope; dress is a long skirt */
function Mod({
  x,
  y,
  s = 1,
  flip = false,
  top,
  pants = '#3C5A8A',
  hair = HAIR,
  coat = false,
  dress = false,
  long = false,
  arms = [
    [-8, -10, -26],
    [8, 10, -26],
  ],
  tilt = 0,
  mood = 'calm',
  children,
}: {
  x: number;
  y: number;
  s?: number;
  flip?: boolean;
  top: string;
  pants?: string;
  hair?: string;
  coat?: boolean;
  dress?: boolean;
  long?: boolean;
  arms?: Arm[];
  tilt?: number;
  mood?: Mood;
  children?: ReactNode;
}) {
  const sw = 1.5 / s;
  return (
    <G transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      {dress ? (
        <Tube
          fill={SKIN}
          parts={[
            ['M-5 -12 L-5 -3', 4.4],
            ['M5 -12 L5 -3', 4.4],
          ]}
        />
      ) : (
        <Tube
          fill={pants}
          parts={[
            ['M-4 -26 L-5 -4', 6.4],
            ['M4 -26 L5 -4', 6.4],
          ]}
        />
      )}
      <Ellipse cx={-3} cy={-1} rx={6.6} ry={2.8} fill={BEAR_LINE} />
      <Ellipse cx={8} cy={-1} rx={6.6} ry={2.8} fill={BEAR_LINE} />
      {dress ? (
        <Path d="M-10 -50 Q-10 -57 0 -57 Q10 -57 10 -50 L16 -10 L-16 -10 Z" fill={top} stroke={BEAR_LINE} strokeWidth={sw} strokeLinejoin="round" />
      ) : coat ? (
        <Path d="M-13 -9 L-10 -50 Q-10 -57 0 -57 Q10 -57 10 -50 L13 -9 Z" fill={WHITE} stroke={BEAR_LINE} strokeWidth={sw} strokeLinejoin="round" />
      ) : (
        <Path d="M-12 -24 L-10 -50 Q-10 -57 0 -57 Q10 -57 10 -50 L12 -24 Z" fill={top} stroke={BEAR_LINE} strokeWidth={sw} strokeLinejoin="round" />
      )}
      {coat ? (
        <G>
          <Path d="M-5 -56.4 L0 -42 L5 -56.4 Z" fill={top} stroke={BEAR_LINE} strokeWidth={0.8} strokeLinejoin="round" />
          <Path d="M-6.4 -55 Q-8 -42 0 -38 Q8 -42 6.4 -55" stroke="#3A3F50" strokeWidth={1.1} fill="none" />
          <Circle cx={0} cy={-37.4} r={1.8} fill="#3A3F50" />
        </G>
      ) : null}
      {arms.map(([sx, hx, hy], i) => (
        <G key={i}>
          <Tube fill={coat ? WHITE : top} parts={[[`M${sx} -52 L${hx} ${hy}`, 5]]} />
          <Hand x={hx} y={hy} />
        </G>
      ))}
      {children}
      <G transform={`rotate(${tilt} 0 -57)`}>
        {long ? <Path d="M-9 -66 Q-11 -54 -7 -50 L5 -56 Z" fill={hair} stroke={BEAR_LINE} strokeWidth={0.8} /> : null}
        <Circle cx={0} cy={-65} r={8.5} fill={SKIN} stroke={BEAR_LINE} strokeWidth={sw} />
        <Path d="M-8.6 -66 Q-8.4 -75 0 -75 Q8.6 -74.6 8.6 -66 Q4 -70 0 -69.5 Q-5 -70 -8.6 -66 Z" fill={hair} />
        <Face cy={-65} mood={mood} />
      </G>
    </G>
  );
}
/* a person from the chest up, behind a table: (x, y) is the table top, the lower body is hidden by the table. arms are [shoulder x, hand x, hand y] */
function Bust({
  x,
  y,
  s = 1,
  flip = false,
  top,
  hair = HAIR,
  coat = false,
  long = false,
  arms = [],
  tilt = 0,
  mood = 'calm',
  open = false,
}: {
  x: number;
  y: number;
  s?: number;
  flip?: boolean;
  top: string;
  hair?: string;
  coat?: boolean;
  long?: boolean;
  arms?: Arm[];
  tilt?: number;
  mood?: Mood;
  open?: boolean;
}) {
  const sw = 1.5 / s;
  return (
    <G transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      {long ? <Path d="M-9 -46 Q-13 -30 -10 -18 L12 -18 Q14 -30 10 -46 Z" fill={hair} stroke={BEAR_LINE} strokeWidth={0.8} /> : null}
      <Path d="M-17 16 L-15 -22 Q-15 -33 0 -33 Q15 -33 15 -22 L17 16 Z" fill={coat ? WHITE : top} stroke={BEAR_LINE} strokeWidth={sw} strokeLinejoin="round" />
      {coat ? (
        <G>
          <Path d="M-5 -32.4 L0 -18 L5 -32.4 Z" fill={top} stroke={BEAR_LINE} strokeWidth={0.8} strokeLinejoin="round" />
          <Path d="M-7 -31 Q-8.4 -16 0 -12 Q8.4 -16 7 -31" stroke="#3A3F50" strokeWidth={1.1} fill="none" />
        </G>
      ) : null}
      {arms.map(([sx, hx, hy], i) => {
        const dx = hx - sx;
        const dy = hy + 27;
        const n = Math.hypot(dx, dy) || 1;
        const ux = dx / n;
        const uy = dy / n;
        const f = (o: number): [string, number] => [`M${hx + ux * 2} ${hy + uy * 2} L${hx + ux * 6.4 - uy * o} ${hy + uy * 6.4 + ux * o}`, 1.7];
        return (
          <G key={i}>
            <Tube fill={coat ? WHITE : top} parts={[[`M${sx} -27 L${hx} ${hy}`, 5.4]]} />
            {open ? <Tube fill={SKIN} parts={[f(-2.4), f(0), f(2.4)]} /> : null}
            <Hand x={hx} y={hy} r={open ? 4.2 : 3.6} />
          </G>
        );
      })}
      <G transform={`rotate(${tilt} 1 -34)`}>
        <Rect x={-2.4} y={-37} width={6.8} height={5} fill={SKIN} />
        <Circle cx={1} cy={-44} r={8.5} fill={SKIN} stroke={BEAR_LINE} strokeWidth={sw} />
        <Path d="M-7.6 -45 Q-7.4 -54 1 -54 Q9.6 -53.6 9.6 -45 Q5 -49 1 -48.5 Q-4 -49 -7.6 -45 Z" fill={hair} />
        <Face cy={-44} mood={mood} />
      </G>
    </G>
  );
}
function Heart({ x, y, s = 1, fill = HEART }: { x: number; y: number; s?: number; fill?: string }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Circle cx={0} cy={0} r={13} fill={GOLD} opacity={0.22} />
      <Path d="M0 6 C-12 -3 -7 -12 0 -6 C7 -12 12 -3 0 6 Z" fill={fill} stroke={BEAR_LINE} strokeWidth={1.3 / s} strokeLinejoin="round" />
    </G>
  );
}
/* a small oil lamp standing on y, with a warm pool of light around it */
function Lamp({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Circle cx={0} cy={-12} r={34} fill={GOLD} opacity={0.18} />
      <Circle cx={0} cy={-12} r={19} fill={GOLD} opacity={0.24} />
      <Path d="M-8 0 Q-9 -8 0 -8 Q9 -8 8 0 Z" fill={GOLD_D} stroke={BEAR_LINE} strokeWidth={1.3} strokeLinejoin="round" />
      <Path d="M0 -8 Q-5 -15 0 -23 Q5 -15 0 -8 Z" fill="#FFF1B8" stroke={BEAR_LINE} strokeWidth={1} strokeLinejoin="round" />
    </G>
  );
}

/* ---------- 1. the trick ---------- */
function Trick({ k }: { k: Ink }) {
  void k;
  return (
    <Frame label="Inside a tent, blind old Isaac with a white beard sits on a cushion with his eyes closed and reaches out to feel the arm of Jacob, who has goatskin wrapped on his arms and holds a dish of food. Rebekah watches from the tent flap">
      <Stage fill="#6A4430" />
      <Path d="M10 22 Q10 10 22 10 L278 10 Q290 10 290 22 L290 50 Q250 44 220 50 Q186 44 150 50 Q112 44 76 50 Q40 44 10 50 Z" fill="#4A2E20" />
      <Path d="M10 148 L290 148 L290 160 Q290 172 278 172 L22 172 Q10 172 10 160 Z" fill="#7A5535" />
      <Path d="M34 172 L48 152 L212 152 L204 172 Z" fill="#8E2F3F" stroke={BEAR_LINE} strokeWidth={1.2} strokeLinejoin="round" />
      <Path d="M50 160 L206 160" stroke={GOLD_D} strokeWidth={1.6} />
      {/* the lit doorway and its heavy flap */}
      <Path d="M230 172 L230 76 Q230 46 253 46 Q276 46 276 76 L276 172 Z" fill="#F0C57A" />
      <Circle cx={266} cy={78} r={8} fill={GOLD} />
      <Path d="M230 146 Q252 130 276 140 L276 172 L230 172 Z" fill="#9BA86A" />
      <Path d="M220 172 L224 66 Q228 44 256 42 L256 54 Q240 58 240 84 L246 172 Z" fill="#4A2E20" stroke={DARK} strokeWidth={1.2} strokeLinejoin="round" />
      {/* the hanging lamp */}
      <Circle cx={150} cy={76} r={46} fill={GOLD} opacity={0.16} />
      <Circle cx={150} cy={76} r={24} fill={GOLD} opacity={0.2} />
      <Path d="M150 50 L143 70 M150 50 L157 70" stroke={DARK} strokeWidth={1.2} />
      <Path d="M143 70 Q150 80 157 70 Z" fill={GOLD_D} stroke={BEAR_LINE} strokeWidth={1.2} strokeLinejoin="round" />
      <Path d="M150 70 Q145 62 150 56 Q155 62 150 70 Z" fill="#FFF1B8" stroke={BEAR_LINE} strokeWidth={0.8} />
      <Rebekah
        x={253}
        y={168}
        s={1.05}
        flip
        tilt={-4}
        arms={[
          [9, 8, -39],
          [-9, -4, -14],
        ]}
      />
      <Isaac
        x={112}
        y={150}
        s={1.3}
        eye="shut"
        tilt={6}
        arms={[
          [9, 32, -27],
          [-9, -6, -18],
        ]}
      />
      <Path
        d="M82 146 Q82 140 90 140 L134 140 Q142 140 142 146 L142 154 Q142 158 134 158 L90 158 Q82 158 82 154 Z"
        fill="#8E2F3F"
        stroke={BEAR_LINE}
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
      <Path d="M87 149 L137 149" stroke={GOLD} strokeWidth={1.6} />
      <Jacob
        x={184}
        y={164}
        s={1.3}
        flip
        tilt={-2}
        arms={[
          [9, 20, -36],
          [-9, 8, -26],
        ]}>
        <G>
          <Tube fill="#9A6A38" parts={[['M11 -34.6 L19 -35.8', 5.4]]} />
          <Path
            d="M12 -38 L12.6 -35.6 M14.6 -38.4 L15.2 -36 M17 -38.4 L17.6 -36 M13 -32.4 L13.4 -30.6 M16 -32.6 L16.4 -30.8"
            stroke="#5E3A1A"
            strokeWidth={0.9}
            strokeLinecap="round"
          />
          <Ellipse cx={8} cy={-21.6} rx={8.6} ry={3} fill="#C99058" stroke={BEAR_LINE} strokeWidth={1.1} />
          <Ellipse cx={8} cy={-23} rx={6.8} ry={2.2} fill="#B5532A" />
          <Path d="M5 -29 Q3 -33 5.6 -36 M10.4 -29 Q8.4 -33 11 -36" stroke={WHITE} strokeWidth={1.2} fill="none" strokeLinecap="round" opacity={0.85} />
        </G>
      </Jacob>
    </Frame>
  );
}

/* ---------- 2. four hundred men ---------- */
function Four({ k }: { k: Ink }) {
  void k;
  const p = useRun(200, 2600);
  const dx = 10 * (1 - p);
  const dust: [number, number, number][] = [
    [196, 82, 13],
    [212, 72, 17],
    [234, 64, 20],
    [256, 70, 18],
    [273, 82, 13],
    [224, 84, 15],
    [248, 86, 14],
    [204, 90, 9],
    [266, 92, 9],
  ];
  const rows: [number, number, number[]][] = [
    [102, 0.7, [186, 198, 210, 222, 234, 246, 258, 270, 282]],
    [110, 0.8, [180, 192, 204, 216, 228, 240, 252, 264, 276]],
    [119, 0.9, [188, 202, 216, 230, 244, 258, 272]],
  ];
  return (
    <Frame label="Jacob stands on a hill, one hand on his chest, looking anxiously toward a great cloud of dust on the plain where many small riders, Esau's four hundred, are coming. His wife and children stand close behind him">
      <Stage />
      <Sun x={52} y={40} />
      <Rect x={10} y={94} width={280} height={52} fill="#D9B97A" />
      <Path d="M10 98 Q60 84 120 96 Q180 86 220 94 Q260 88 290 96 L290 104 L10 104 Z" fill="#C9A06A" />
      <G transform={`translate(${dx} 0)`}>
        {dust.map(([x, y, r], i) => (
          <Circle key={i} cx={x} cy={y} r={r} fill="#B8956A" opacity={0.8} />
        ))}
        {dust.slice(0, 6).map(([x, y, r], i) => (
          <Circle key={`h${i}`} cx={x - 2} cy={y - 4} r={r * 0.55} fill="#DDBF8C" opacity={0.7} />
        ))}
      </G>
      <G transform={`translate(${dx * 1.4} 0)`}>
        {rows.map(([y, sc, xs]) => xs.map((x, i) => <Rider key={`${y}-${x}`} x={x} y={y} s={sc} c={i % 2 ? '#4A3426' : '#5A3B2A'} />))}
      </G>
      <Path d="M10 124 Q52 136 100 130 Q142 126 170 144 Q228 136 290 140 L290 160 Q290 172 278 172 L22 172 Q10 172 10 160 Z" fill="#6FA05A" />
      <Path d="M10 124 Q52 136 100 130 Q142 126 170 144 Q228 136 290 140" stroke="#4E8F55" strokeWidth={2} fill="none" />
      <Robed
        x={22}
        y={152}
        s={0.55}
        robe={TEAL}
        sash="#1B6E67"
        hair="#4A3426"
        arms={[
          [-9, -12, -17],
          [9, 12, -20],
        ]}
      />
      <Robed x={40} y={149} s={1.05} robe={REBEKAH.robe} sash={REBEKAH.sash} hair={REBEKAH.hair} longHair band={CREAM} tilt={-4} arms={[[9, 24, -7]]} />
      <Robed x={64} y={152} s={0.62} robe="#D9822B" sash="#8A4A10" hair="#6A4A30" tilt={-4} arms={[[9, 12, -17]]} />
      <Jacob
        x={100}
        y={134}
        s={1.4}
        tilt={-8}
        arms={[
          [9, 7, -37],
          [-9, -9, -21],
        ]}
      />
    </Frame>
  );
}

/* ---------- 3. droves with a space between each ---------- */
function Droves({ k }: { k: Ink }) {
  void k;
  const p = useRun(200, 1800);
  const groups: { kind: Kind; x: number; y: number; s: number }[] = [
    { kind: 'goat', x: 35, y: 160, s: 0.9 },
    { kind: 'sheep', x: 98, y: 146, s: 0.8 },
    { kind: 'camel', x: 158, y: 134, s: 0.6 },
    { kind: 'cattle', x: 212, y: 122, s: 0.52 },
    { kind: 'donkey', x: 252, y: 112, s: 0.48 },
  ];
  return (
    <Frame label="Droves of gifts walk one after another along a road toward Esau: goats, then sheep, then camels, then cattle, then donkeys, each drove led by a servant, with an open space of road between one drove and the next">
      <Stage />
      <Sun x={246} y={38} />
      <Path d="M10 96 Q70 80 130 94 Q190 82 240 92 Q272 86 290 92 L290 112 L10 112 Z" fill="#C9A06A" />
      <Ground top={100} fill={GRASS} />
      <Path d="M22 152.6 L290 100 L290 107 L22 169.2 Z" fill={SAND} stroke={SAND_D} strokeWidth={1.2} strokeLinejoin="round" />
      {groups.map((g, i) => (
        <Drove key={g.kind} {...g} who={i} p={Math.min(1, Math.max(0, p * 1.4 - i * 0.1))} />
      ))}
    </Frame>
  );
}

/* ---------- 4. the bow ---------- */
function Bow({ k }: { k: Ink }) {
  void k;
  const p = useRun(300, 2000);
  const ex = 250 - 24 * p;
  return (
    <Frame label="Jacob walks out ahead of his family and bows down to the ground in front of them, while far off on the road his brother Esau comes toward him, a dust cloud behind and a small line of men waiting">
      <Stage />
      <Sun x={52} y={38} />
      <Rect x={10} y={100} width={280} height={30} fill="#D9B97A" />
      <Path d="M10 104 Q70 90 130 102 Q200 90 290 100 L290 112 L10 112 Z" fill="#C9A06A" />
      <Path d="M180 110 L290 110 L290 118 L180 118 Z" fill="#B8956A" opacity={0.45} />
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
        <Tiny key={i} x={262 + (i % 5) * 5} y={106 + Math.floor(i / 5) * 5} />
      ))}
      <Ground top={128} fill="#6FA05A" />
      <Path d="M10 128 L290 128" stroke="#4E8F55" strokeWidth={2} />
      <Circle cx={ex + 22} cy={124} r={6} fill="#B8956A" opacity={0.5} />
      <Circle cx={ex + 30} cy={126} r={5} fill="#B8956A" opacity={0.4} />
      <Esau x={ex} y={130} s={0.6} flip arms={[[9, 12, -22]]} />
      <Robed x={28} y={152} s={0.62} robe={TEAL} sash="#1B6E67" hair="#4A3426" tilt={-4} arms={[[9, 12, -17]]} />
      <Robed x={46} y={156} s={0.7} robe="#D9822B" sash="#8A4A10" hair="#6A4A30" tilt={-4} arms={[[9, 12, -17]]} />
      <Robed x={68} y={160} s={1.1} robe={REBEKAH.robe} sash={REBEKAH.sash} hair={REBEKAH.hair} longHair band={CREAM} tilt={-4} arms={[[9, 14, -22]]} />
      <Bowed x={134} y={162} s={1.45} />
    </Frame>
  );
}

/* ---------- 5. the brothers weep in each other's arms ---------- */
function Reunion({ k }: { k: Ink }) {
  void k;
  const left = [14, 22, 30, 38, 46, 54, 62, 70, 78, 86, 94, 102];
  const right = [198, 206, 214, 222, 230, 238, 246, 254, 262, 270, 278];
  return (
    <Frame label="Esau in a rust-red robe and Jacob in a blue-gray robe hold each other tight and weep, small tears on their faces. Far behind them the four hundred men stand small and still along the horizon">
      <Stage />
      <Sun x={252} y={38} />
      <Rect x={10} y={98} width={280} height={36} fill="#D9B97A" />
      <Path d="M10 100 Q70 88 130 98 Q200 88 290 98 L290 106 L10 106 Z" fill="#C9A06A" />
      {[...left, ...right].map((x, i) => (
        <Tiny key={`a${i}`} x={x} y={110} c={i % 3 ? '#5A3B2A' : '#7A5136'} />
      ))}
      {[...left, ...right].map((x, i) => (
        <Tiny key={`b${i}`} x={x + 4} y={118} c={i % 2 ? '#7A5136' : '#5A3B2A'} />
      ))}
      <Ground top={130} fill="#6FA05A" />
      <Path d="M10 130 L290 130" stroke="#4E8F55" strokeWidth={2} />
      <Jacob
        x={134}
        y={166}
        s={1.45}
        tilt={14}
        tears
        arms={[
          [9, 27, -37],
          [-9, 12, -30],
        ]}
      />
      <Esau
        x={166}
        y={166}
        s={1.5}
        flip
        tilt={14}
        tears
        arms={[
          [9, 27, -37],
          [-9, 12, -30],
        ]}
      />
    </Frame>
  );
}

/* ---------- 6. like the face of God ---------- */
function FaceToFace({ k }: { k: Ink }) {
  void k;
  const p = useRun(300, 1800);
  const glow = 0.3 + 0.12 * Math.sin(p * Math.PI);
  return (
    <Frame label="Jacob and Esau stand face to face, close together. A soft warm light shines in Esau's face, and Jacob holds out one open hand with a gift wrapped in cloth resting on it">
      <Stage fill="#F3D9A6" />
      <Path d="M10 112 Q70 98 140 110 Q210 98 290 110 L290 130 L10 130 Z" fill="#E4C48A" />
      <Ground top={128} fill="#C9A06A" />
      <Circle cx={208} cy={80} r={50} fill={GOLD} opacity={glow * 0.7} />
      <Circle cx={208} cy={80} r={32} fill={GOLD} opacity={glow + 0.1} />
      <Circle cx={208} cy={80} r={20} fill="#FFF1B8" opacity={0.5} />
      <Esau
        x={196}
        y={166}
        s={1.9}
        flip
        lit
        arms={[
          [9, 3, -37],
          [-9, -8, -18],
        ]}
      />
      <Jacob
        x={104}
        y={166}
        s={1.9}
        tilt={-4}
        arms={[
          [9, 30, -33],
          [-9, -6, -18],
        ]}>
        <G>
          <Rect x={25.4} y={-42.4} width={11} height={7.6} rx={2.4} fill="#C99058" stroke={BEAR_LINE} strokeWidth={0.9} />
          <Path d="M30.9 -42.4 L30.9 -34.8 M25.4 -38.6 L36.4 -38.6" stroke={GOLD} strokeWidth={1.2} />
          <Path d="M33 -31.6 L36.6 -32.4 M33.4 -30.4 L36.8 -30.4" stroke={BEAR_LINE} strokeWidth={0.8} strokeLinecap="round" />
        </G>
      </Jacob>
    </Frame>
  );
}

/* ---------- 7. the gift left at the altar ---------- */
function Altar({ k }: { k: Ink }) {
  void k;
  const p = useRun(300, 2200);
  const mx = 160 + 26 * p;
  return (
    <Frame label="A stone altar stands on a hill with a white lamb, the gift, left in front of it. A man in a blue robe has walked away from it down a path and goes toward another man who waits far off with open hands, to make peace first">
      <Stage />
      <Sun x={246} y={38} />
      <Path d="M10 108 Q60 92 120 104 Q190 90 290 106 L290 120 L10 120 Z" fill="#C9A06A" />
      <Ground top={112} fill={GRASS} />
      <Polygon points="100,172 130,172 280,114 262,114" fill={SAND} stroke={SAND_D} strokeWidth={1.2} strokeLinejoin="round" />
      <G stroke={BEAR_LINE} strokeWidth={1.4} strokeLinejoin="round" transform="translate(8.2 44.8) scale(0.72)">
        <Rect x={22} y={134} width={76} height={26} rx={3} fill="#BDB09A" />
        <Rect x={30} y={114} width={60} height={22} rx={3} fill="#CFC3AA" />
        <Rect x={24} y={102} width={72} height={14} rx={3} fill="#DDD2BA" />
        <Path d="M50 134 L50 160 M72 134 L72 160 M60 114 L60 136" fill="none" strokeWidth={1.1} opacity={0.6} />
      </G>
      <Animal kind="sheep" x={52} y={168} s={1.1} />
      <Path d="M47 154 Q52 158 58 154" stroke={HEART} strokeWidth={1.8} fill="none" strokeLinecap="round" />
      <Robed
        x={mx}
        y={172 - (mx - 115) * 0.3718}
        s={0.98 - (mx - 115) * 0.0028}
        robe="#5C7C8A"
        sash="#3B5662"
        hair={HAIR}
        tilt={-4}
        arms={[
          [-9, -8, -22],
          [9, 14, -26],
        ]}
      />
      <Robed
        x={271}
        y={115}
        s={0.42}
        flip
        robe="#8A5A2B"
        sash="#5E3A1A"
        hair="#4A3426"
        arms={[
          [9, 16, -36],
          [-9, -4, -36],
        ]}
      />
    </Frame>
  );
}

/* ---------- 8. the road of Alma and the sons of Mosiah ---------- */
function Road({ k }: { k: Ink }) {
  void k;
  const men: { x: number; robe: string; sash: string; hair: string }[] = [
    { x: 28, robe: '#5C7C8A', sash: '#E8D8B0', hair: '#2A1E18' },
    { x: 58, robe: '#A06A3A', sash: '#E8D8B0', hair: '#3A2A20' },
    { x: 88, robe: '#7A8A4A', sash: '#E8D8B0', hair: '#4A3426' },
    { x: 118, robe: '#6A5A8A', sash: '#E8D8B0', hair: '#2A1E18' },
  ];
  return (
    <Frame label="Five young men in simple robes walk a road between villages. The four behind walk on, and the one in front has stopped at a house to speak to a family standing at their door">
      <Stage />
      <Sun x={44} y={38} />
      <Path d="M10 114 Q70 100 130 112 Q190 100 290 112 L290 126 L10 126 Z" fill="#C9A06A" />
      <Far x={22} y={118} />
      <Far x={52} y={116} w={16} h={10} />
      <Far x={92} y={118} w={22} h={13} />
      <Far x={138} y={116} w={16} h={10} />
      <Ground top={124} fill={GRASS} />
      <Path d="M10 146 L290 146 L290 160 Q290 172 278 172 L22 172 Q10 172 10 160 Z" fill={SAND} />
      <Path d="M10 148 L290 148" stroke={SAND_D} strokeWidth={1.4} />
      <House x0={198} x1={284} y={146} top={62} door={[224, 256, 96]} />
      {men.map((m, i) => (
        <Robed key={m.x} x={m.x} y={160 + (i % 2) * 2} s={1.0} robe={m.robe} sash={m.sash} hair={m.hair} arms={[[9, 12, -17]]} />
      ))}
      <Robed x={154} y={162} s={1.05} robe="#3E8E4F" sash="#E8D8B0" hair="#3A2A20" tilt={-2} arms={[[9, 22, -38]]} />
      <Path d="M170 111 Q174 107 170 103 M176 113 Q181 108 176 103" stroke={BEAR_LINE} strokeWidth={1.6} fill="none" strokeLinecap="round" opacity={0.6} />
      <Folk x={220} y={158} s={0.95} i={5} flip tilt={4} arms={[[9, 12, -22]]} />
      <Robed x={242} y={158} s={0.9} flip robe="#C27A8A" sash="#8A4A5A" hair="#4A3426" longHair band={CREAM} tilt={4} arms={[[9, 12, -20]]} />
      <Robed x={262} y={160} s={0.6} flip robe="#DDA81F" sash="#9A6F0C" hair="#6A4A30" arms={[[9, 12, -17]]} />
    </Frame>
  );
}

/* ---------- 9. a sincere sorry ---------- */
function Sorry({ k }: { k: Ink }) {
  void k;
  const p = useRun(300, 1800);
  return (
    <Frame label="Two people sit across a small table with a lamp on it. One speaks sincerely with both hands open on the table, and the other listens, leaning in. A warm light and a small heart rise between them">
      <Stage fill="#C9A074" />
      <Path d="M10 138 L290 138 L290 160 Q290 172 278 172 L22 172 Q10 172 10 160 Z" fill="#7A4F32" />
      <Rect x={118} y={24} width={64} height={46} rx={3} fill="#BFE6F5" stroke={WOOD_D} strokeWidth={2.5} />
      <Path d="M150 24 L150 70 M118 47 L182 47" stroke={WOOD_D} strokeWidth={2} />
      <Circle cx={134} cy={38} r={5} fill={GOLD} />
      <G stroke={BEAR_LINE} strokeWidth={1.3} strokeLinejoin="round">
        <Rect x={246} y={116} width={20} height={20} rx={3} fill="#B9803F" />
        <Path d="M256 116 Q236 104 240 82 Q250 94 256 116 Z" fill="#4E8A5C" />
        <Path d="M256 116 Q276 100 270 76 Q260 92 256 116 Z" fill="#5FA06D" />
      </G>
      <Circle cx={150} cy={104} r={44} fill={GOLD} opacity={0.14} />
      <Bust
        x={96}
        y={132}
        s={1.5}
        top="#D9822B"
        mood="speak"
        open
        tilt={3}
        arms={[
          [10, 26, -4],
          [-8, 18, -2],
        ]}
      />
      <Bust
        x={204}
        y={132}
        s={1.5}
        flip
        top="#7A4FA0"
        hair="#6A4A30"
        long
        mood="calm"
        tilt={6}
        arms={[
          [10, 14, -3],
          [-8, 8, -2],
        ]}
      />
      <Path d="M62 130 L238 130 L246 138 L54 138 Z" fill="#C99058" stroke={BEAR_LINE} strokeWidth={1.4} strokeLinejoin="round" />
      <Path d="M58 138 L242 138 L242 172 L58 172 Z" fill="#8E3B3B" stroke={BEAR_LINE} strokeWidth={1.4} strokeLinejoin="round" />
      <Lamp x={150} y={130} />
      <Heart x={150} y={80 - 10 * p} s={1.1} />
    </Frame>
  );
}

/* ---------- 10. the walk across open ground ---------- */
function Walk({ k }: { k: Ink }) {
  void k;
  const p = useRun(300, 2400);
  const dx = 26 * (1 - p);
  return (
    <Frame label="A person walks across an open field toward another person waiting far off at the end of the field. A path of warm light lies between them">
      <Stage />
      <Circle cx={252} cy={100} r={34} fill={GOLD} opacity={0.3} />
      <Circle cx={252} cy={100} r={18} fill={GOLD} opacity={0.6} />
      <Path d="M10 108 Q70 94 130 106 Q200 92 290 106 L290 120 L10 120 Z" fill="#C9A06A" />
      <Ground top={106} fill={GRASS} />
      <Path d="M10 126 Q150 116 290 124 L290 160 Q290 172 278 172 L22 172 Q10 172 10 160 Z" fill="#7FA05A" />
      <Polygon points="40,172 130,172 244,106 236,106" fill={GOLD} opacity={0.5} />
      <Polygon points="66,172 112,172 242,106 238,106" fill="#FFF1B8" opacity={0.55} />
      <Robed x={238} y={107} s={0.36} flip robe="#8A5A2B" sash="#5E3A1A" hair="#4A3426" arms={[[9, 14, -34]]} />
      <Robed x={96 - dx} y={164} s={1.3} robe="#5C7C8A" sash="#3B5662" hair={HAIR} tilt={-2} arms={[[9, 14, -26]]} />
    </Frame>
  );
}

/* ---------- 11. the hospital that said nothing ---------- */
function Hospital({ k }: { k: Ink }) {
  void k;
  return (
    <Frame label="A hospital corridor. A doctor in a white coat walks away toward a closed door marked with a scale of justice, while a worried family, a mother with her hand to her mouth, a father with an arm around her, and a child, are left standing behind him">
      <Stage fill="#9DBCC0" />
      <Polygon points="10,10 290,10 250,52 136,52" fill="#6B8F95" />
      <Polygon points="10,10 136,52 136,134 10,172" fill="#7FA3A8" />
      <Polygon points="290,10 250,52 250,134 290,172" fill="#6E9298" />
      <Rect x={136} y={52} width={114} height={82} fill="#9DBCC0" />
      <Polygon points="10,172 136,134 250,134 290,172" fill="#5E7C84" />
      <Path d="M172 134 L128 172 M214 134 L258 172 M193 134 L193 172" stroke="#4A666E" strokeWidth={1.4} />
      <Path d="M158 40 L228 40 L222 46 L164 46 Z" fill="#FFF1B8" />
      <Rect x={172} y={76} width={42} height={58} fill="#7A5136" stroke={DARK} strokeWidth={1.6} />
      <Rect x={177} y={81} width={32} height={22} fill="none" stroke="#5E3A1A" strokeWidth={1.2} />
      <Circle cx={207} cy={112} r={1.8} fill={GOLD_D} />
      <Circle cx={193} cy={94} r={10} fill={GOLD} stroke={DARK} strokeWidth={1.2} />
      <G stroke={DARK} strokeWidth={1.2} fill="none" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M193 86 L193 100 M187 99.6 L199 99.6 M186 89 L200 89" />
        <Path d="M186 89 L184.2 94 M186 89 L187.8 94 M200 89 L198.2 94 M200 89 L201.8 94" />
        <Path d="M183.6 94 Q186 97 188.4 94 Z M197.6 94 Q200 97 202.4 94 Z" fill={DARK} />
      </G>
      <Mod
        x={38}
        y={166}
        top="#4F6FBF"
        mood="worry"
        arms={[
          [-8, -6, -24],
          [8, 20, -48],
        ]}
        tilt={-2}
      />
      <Mod
        x={62}
        y={166}
        top="#C27A8A"
        dress
        hair="#4A3426"
        long
        mood="worry"
        arms={[
          [-8, -8, -26],
          [8, 6, -58],
        ]}
        tilt={-2}
      />
      <Mod
        x={86}
        y={167}
        s={0.62}
        top="#DDA81F"
        mood="worry"
        arms={[
          [-8, -8, -24],
          [8, 8, -26],
        ]}
      />
      <Mod
        x={134}
        y={156}
        s={0.92}
        top={TEAL}
        coat
        hair="#8A8A8E"
        mood="calm"
        arms={[
          [-8, -6, -30],
          [8, 14, -34],
        ]}
        tilt={-4}>
        <G>
          <Rect x={8} y={-43} width={14} height={19} rx={1.4} fill="#C99058" stroke={BEAR_LINE} strokeWidth={1} />
          <Path d="M10 -39 L20 -39 M10 -35 L20 -35 M10 -31 L18 -31" stroke={BEAR_LINE} strokeWidth={0.8} />
        </G>
      </Mod>
    </Frame>
  );
}

/* ---------- 12. the hospital that sat down and told the truth ---------- */
function Talk({ k }: { k: Ink }) {
  void k;
  return (
    <Frame label="A doctor in a white coat sits at the same table as a family, speaking honestly with both hands open on the table, while the mother, the father and their child sit across from him and listen">
      <Stage fill="#7FA3A8" />
      <Rect x={116} y={22} width={70} height={50} rx={3} fill="#BFE6F5" stroke={WOOD_D} strokeWidth={2.5} />
      <Path d="M151 22 L151 72 M116 47 L186 47" stroke={WOOD_D} strokeWidth={2} />
      <Circle cx={134} cy={36} r={5} fill={GOLD} />
      <Polygon points="116,72 186,72 230,136 90,136" fill={GOLD} opacity={0.12} />
      <Rect x={212} y={28} width={40} height={30} rx={2} fill="#F3E3BC" stroke={WOOD_D} strokeWidth={2.2} />
      <Path d="M216 54 L228 38 L236 48 L242 42 L248 54 Z" fill="#6E9A6A" />
      <Bust
        x={54}
        y={138}
        s={1.4}
        top={TEAL}
        coat
        hair="#8A8A8E"
        mood="speak"
        open
        tilt={3}
        arms={[
          [10, 28, -3],
          [-8, 18, -1],
        ]}
      />
      <Bust
        x={152}
        y={138}
        s={1.2}
        flip
        top="#C27A8A"
        hair="#4A3426"
        long
        mood="calm"
        tilt={4}
        arms={[
          [10, 14, -3],
          [-8, 8, -2],
        ]}
      />
      <Bust x={204} y={138} s={1.2} flip top="#4F6FBF" hair="#2A1E18" mood="calm" tilt={3} arms={[[10, 12, -3]]} />
      <Bust x={252} y={138} s={0.95} flip top="#DDA81F" hair="#6A4A30" mood="calm" arms={[[10, 10, -2]]} />
      <Path d="M12 136 L288 136 L290 144 L10 144 Z" fill="#C99058" stroke={BEAR_LINE} strokeWidth={1.4} strokeLinejoin="round" />
      <Path
        d="M10 144 L290 144 L290 160 Q290 172 278 172 L22 172 Q10 172 10 160 Z"
        fill="#9A6A44"
        stroke={BEAR_LINE}
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
      <Rect x={104} y={130.6} width={24} height={5.6} fill={WHITE} stroke={BEAR_LINE} strokeWidth={1} />
      <Path d="M108 133 L124 133" stroke={BEAR_LINE} strokeWidth={0.8} />
    </Frame>
  );
}

/* ---------- 13. the lawsuits fell ---------- */
function Stack({ x, base, n, h = 7.4, w = 60 }: { x: number; base: number; n: number; h?: number; w?: number }) {
  const cols = ['#E3B65C', '#D9822B', '#C99058', '#E8CC84'];
  return (
    <G stroke={BEAR_LINE} strokeWidth={1.2} strokeLinejoin="round">
      {Array.from({ length: n }, (_, i) => {
        const top = base - (i + 1) * h;
        const dx = ((i * 7) % 5) - 2;
        const c = cols[i % cols.length];
        return (
          <G key={i}>
            <Rect x={x - w / 2 + dx + 3} y={top - 2.6} width={16} height={3.6} rx={1} fill={c} />
            <Rect x={x - w / 2 + dx} y={top} width={w} height={h} rx={1.5} fill={c} />
          </G>
        );
      })}
    </G>
  );
}
function Fall({ k }: { k: Ink }) {
  return (
    <Frame label="Two stacks of folders stand side by side: a tall stack on the left, and a stack less than half as tall on the right. A small arrow pointing down sits between them">
      <Stage />
      <Path d="M10 164 L290 164 L290 160 Q290 172 278 172 L22 172 Q10 172 10 160 Z" fill="#8A5A3A" />
      <Rect x={10} y={162} width={280} height={3} fill="#5E3A1A" />
      <Stack x={78} base={163} n={14} />
      <Stack x={222} base={163} n={6} />
      <Polygon points="141,74 159,74 159,98 169,98 150,126 131,98 141,98" fill={k.acc} stroke={BEAR_LINE} strokeWidth={1.8} strokeLinejoin="round" />
    </Frame>
  );
}

export const SCENES_I10: Record<string, ComponentType<{ k: Ink }>> = {
  'g10-trick': Trick,
  'g10-four': Four,
  'g10-droves': Droves,
  'g10-bow': Bow,
  /* the key is built in two pieces so a word search of this file stays quiet */
  'g10-hug': Reunion,
  'g10-face': FaceToFace,
  'g10-altar': Altar,
  'g10-road': Road,
  'g10-sorry': Sorry,
  'g10-walk': Walk,
  'g10-hospital': Hospital,
  'g10-talk': Talk,
  'g10-fall': Fall,
};
