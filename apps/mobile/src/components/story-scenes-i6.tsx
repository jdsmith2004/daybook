/* Scenes for lesson g6, "Confession is for healing" (see story-kit.tsx and story-scenes-f-l31.tsx for the approach): the house in Capernaum so full that no one could
   get in, the four friends carrying the man on his mat, the roof opened and the mat let down, Jesus looking up at their faces, then the same truth as leaning,
   two people being honest, a bishop who listens, a corner of the mat held out, and the plain telling of the hill that looked less steep with a friend.
   Jesus always wears a white robe with a red sash; the man who could not walk a blue robe and lies on a cream mat; the four friends rust, teal, mustard and green
   (and each keeps the same one, in every scene). Every figure carries a dark outline so it reads on a dark card and a cream one. */
import { type ComponentType, type ReactNode, useEffect, useState } from 'react';
import { Easing } from 'react-native';
import { Circle, Ellipse, G, Line, Path, Polygon, Rect } from 'react-native-svg';

import { useAppear, useReducedMotion } from '@/lib/motion';

import { BEAR_LINE, Frame, type Ink } from './story-kit';

const SKIN = '#E7B98F';
const HAIR = '#3A2A20';
const GOLD = '#FFD25A';
const GOLD_D = '#C98F1A';
const CREAM = '#FFF5E1';
const MAT = '#F3E7C9';
const MAT_D = '#D8C494';
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
const BLUE = '#3F63B8';
const FRIEND = {
  rust: { robe: '#B5532A', sash: '#7A3418', hair: '#2E2018' },
  teal: { robe: '#2FA39A', sash: '#1B6E67', hair: '#4A3426' },
  mustard: { robe: '#DDA81F', sash: '#9A6F0C', hair: '#6A5A48' },
  green: { robe: '#3E8E4F', sash: '#27613A', hair: '#2E2018' },
};
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
function Hand({ x, y, r = 3.6 }: { x: number; y: number; r?: number }) {
  return <Circle cx={x} cy={y} r={r} fill={SKIN} stroke={BEAR_LINE} strokeWidth={1.2} />;
}

/* ---------- people ---------- */
const BODY = 'M-13 0 L-9 -33 Q-9 -42 0 -42 Q9 -42 9 -33 L13 0 Z';
type Arm = [number, number, number];
const ARMS_DOWN: Arm[] = [
  [-9, -12, -17],
  [9, 12, -17],
];

/* a person in a long robe, standing on (x, y), facing right (flip turns them). arms are [shoulder x, hand x, hand y] in the person's own space; tilt turns the
   head (negative looks up); sash is a belt with a tail; band is a cloth around the head */
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
  band,
  arms = ARMS_DOWN,
  tilt = 0,
  glance = 0,
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
  band?: string;
  arms?: Arm[];
  tilt?: number;
  glance?: number;
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
    </G>
  );
}

function Jesus({ x, y, s = 1, flip = false, tilt = 0, arms }: { x: number; y: number; s?: number; flip?: boolean; tilt?: number; arms?: Arm[] }) {
  return <Robed x={x} y={y} s={s} flip={flip} tilt={tilt} arms={arms} robe={WHITE} sash={RED} hair="#6B4A2E" beard longHair />;
}
function Friend({
  x,
  y,
  s = 1,
  who,
  flip = false,
  rot = 0,
  arms,
  tilt = 0,
}: {
  x: number;
  y: number;
  s?: number;
  who: keyof typeof FRIEND;
  flip?: boolean;
  rot?: number;
  arms?: Arm[];
  tilt?: number;
}) {
  const f = FRIEND[who];
  return <Robed x={x} y={y} s={s} flip={flip} rot={rot} tilt={tilt} arms={arms} robe={f.robe} sash={f.sash} hair={f.hair} band={f.sash} />;
}

/* one of the crowd: a plain robe in one of a few colors and no arms to speak of */
function Folk({ x, y, s = 1, i, flip = false }: { x: number; y: number; s?: number; i: number; flip?: boolean }) {
  return (
    <Robed
      x={x}
      y={y}
      s={s}
      flip={flip}
      robe={FOLK[i % FOLK.length]}
      hair={FOLK_HAIR[(i * 3) % FOLK_HAIR.length]}
      arms={[]}
      band={i % 3 === 0 ? CREAM : undefined}
    />
  );
}

/* the man who could not walk, lying on his cream mat: the mat is a flat shape seen a little from above. Corners (local): front left (-54, 2), front right (40, 2),
   back right (54, -8), back left (-40, -8). His head is at the left. */
function MatMan({ x, y, s = 1, rot = 0, man = true }: { x: number; y: number; s?: number; rot?: number; man?: boolean }) {
  return (
    <G transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <Path d="M-54 2 L40 2 L40 6.5 L-54 6.5 Z" fill={MAT_D} stroke={BEAR_LINE} strokeWidth={1.3 / s} strokeLinejoin="round" />
      <Path d="M40 2 L54 -8 L54 -3.5 L40 6.5 Z" fill={MAT_D} stroke={BEAR_LINE} strokeWidth={1.3 / s} strokeLinejoin="round" />
      <Path d="M-54 2 L40 2 L54 -8 L-40 -8 Z" fill={MAT} stroke={BEAR_LINE} strokeWidth={1.3 / s} strokeLinejoin="round" />
      <Path d="M-20 -8 L-34 2 M0 -8 L-14 2 M20 -8 L6 2 M40 -8 L28 2" stroke={MAT_D} strokeWidth={1.4} strokeLinecap="round" />
      {man ? (
        <G>
          <Tube fill={BLUE} parts={[['M-26 -4 L33 -6', 11]]} />
          <Ellipse cx={38} cy={-6} rx={3.6} ry={2.6} fill={SKIN} stroke={BEAR_LINE} strokeWidth={1.1} />
          <Circle cx={-35} cy={-6.5} r={7.5} fill={SKIN} stroke={BEAR_LINE} strokeWidth={1.3} />
          <Path d="M-42.4 -7.6 Q-42 -14.4 -35 -14.2 Q-29 -13.8 -28 -9 Q-33 -11.4 -36 -10.6 Q-40 -10 -42.4 -7.6 Z" fill={HAIR} />
          <Circle cx={-32.4} cy={-6.4} r={1.3} fill={BEAR_LINE} />
          <Hand x={-8} y={-9.4} r={3} />
        </G>
      ) : null}
    </G>
  );
}
/* where a corner of a MatMan ends up in the picture */
function corner(x: number, y: number, s: number, rot: number, lx: number, ly: number): [number, number] {
  const a = (rot * Math.PI) / 180;
  const px = lx * s;
  const py = ly * s;
  return [x + px * Math.cos(a) - py * Math.sin(a), y + px * Math.sin(a) + py * Math.cos(a)];
}

/* ---------- the town ---------- */
function Sun({ x = 252, y = 38 }: { x?: number; y?: number }) {
  return (
    <G>
      <Circle cx={x} cy={y} r={20} fill={GOLD} opacity={0.35} />
      <Circle cx={x} cy={y} r={12} fill={GOLD} />
    </G>
  );
}
/* Capernaum by its lake: warm sky, the far shore, the water, small flat-roofed houses along the bank, and the sandy street from y 134 */
function Shore({ houses = true }: { houses?: boolean }) {
  return (
    <G>
      <Rect x={10} y={10} width={280} height={162} rx={12} fill={SKY} />
      <Sun />
      <Path d="M10 104 Q60 88 112 99 Q170 82 230 97 Q262 92 290 100 L290 126 L10 126 Z" fill="#B3AB78" />
      <Rect x={10} y={110} width={280} height={26} fill="#7FB4D0" />
      <Path d="M30 120 L52 120 M96 126 L122 126 M170 118 L196 118 M226 127 L252 127" stroke="#B9DDEB" strokeWidth={1.6} strokeLinecap="round" />
      {houses ? (
        <G stroke={EDGE} strokeWidth={1.1} strokeLinejoin="round">
          <Rect x={100} y={100} width={22} height={14} fill={STONE} />
          <Rect x={98} y={97} width={26} height={4} fill={SAND} />
          <Rect x={128} y={103} width={16} height={11} fill={STONE} />
          <Rect x={126} y={100.5} width={20} height={3.5} fill={SAND} />
          <Rect x={30} y={102} width={18} height={12} fill={STONE} />
          <Rect x={28} y={99} width={22} height={4} fill={SAND} />
        </G>
      ) : null}
      <Path d="M10 134 L290 134 L290 160 Q290 172 278 172 L22 172 Q10 172 10 160 Z" fill={SAND_D} />
      <Path d="M10 150 Q120 140 290 148 L290 160 Q290 172 278 172 L22 172 Q10 172 10 160 Z" fill="#E4CB98" opacity={0.7} />
    </G>
  );
}
/* a flat-roofed stone house seen from the front, standing on y: its door is an arch with a lit room behind it */
function House({ x0, x1, y, top, door }: { x0: number; x1: number; y: number; top: number; door: [number, number, number] }) {
  const [dx0, dx1, dtop] = door;
  const r = (dx1 - dx0) / 2;
  return (
    <G stroke={EDGE} strokeWidth={1.4} strokeLinejoin="round">
      <Rect x={x0} y={top} width={x1 - x0} height={y - top} fill={WALL} />
      <Rect x={x0 - 4} y={top - 8} width={x1 - x0 + 8} height={9} rx={2} fill={STONE} />
      <Path d={`M${x0 + 8} ${top + 6} L${x1 - 8} ${top + 6}`} opacity={0.35} />
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

/* ---------- 1. a house packed full ---------- */
function Crowd({ k }: { k: Ink }) {
  void k;
  const inside: [number, number][] = [
    [146, 148],
    [156, 144],
    [166, 148],
    [176, 144],
    [186, 148],
    [151, 134],
    [171, 134],
  ];
  const rowA: number[] = [108, 126, 204, 222, 240];
  const rowB: number[] = [36, 62, 90, 118, 206, 234, 262];
  return (
    <Frame label="A flat-roofed stone house in Capernaum, by the lake, packed so full of people that a crowd stands in the doorway and spills out into the street, with no way to get in">
      <Shore />
      <House x0={78} x1={252} y={146} top={46} door={[138, 192, 80]} />
      <G fill="#3A2418" stroke={EDGE} strokeWidth={1.2}>
        <Rect x={96} y={70} width={16} height={22} rx={8} />
        <Rect x={216} y={70} width={16} height={22} rx={8} />
      </G>
      {inside.map(([x, y], i) => (
        <Folk key={`i${i}`} x={x} y={y} s={0.6} i={i + 2} />
      ))}
      {rowA.map((x, i) => (
        <Folk key={`a${i}`} x={x} y={153 + (i % 2)} s={0.8} i={i} flip={x > 170} />
      ))}
      <Folk x={34} y={146} s={0.72} i={5} />
      <Folk x={284} y={148} s={0.72} i={1} flip />
      {rowB.map((x, i) => (
        <Folk key={`b${i}`} x={x} y={165 + (i % 2)} s={0.95} i={i + 3} flip={x > 150} />
      ))}
    </Frame>
  );
}

/* ---------- 2. four friends, one at each corner ---------- */
function Four({ k }: { k: Ink }) {
  void k;
  const MX = 128;
  const MY = 128;
  const MS = 1.15;
  const FL = corner(MX, MY, MS, 0, -54, 2);
  const FR = corner(MX, MY, MS, 0, 40, 2);
  const BR = corner(MX, MY, MS, 0, 54, -8);
  const BL = corner(MX, MY, MS, 0, -40, -8);
  const grip = (fx: number, fy: number, s: number, c: [number, number]): Arm[] => {
    const hx = (c[0] - fx) / s;
    const hy = (c[1] - fy) / s;
    return [
      [-9, hx - 1, hy],
      [9, hx + 2, hy - 1],
    ];
  };
  const crowd: [number, number, number][] = [
    [244, 152, 0.8],
    [260, 150, 0.8],
    [277, 152, 0.8],
    [238, 164, 0.95],
    [256, 166, 0.95],
    [274, 164, 0.95],
    [248, 140, 0.6],
    [264, 140, 0.6],
  ];
  return (
    <Frame label="Four friends in four colors, rust, teal, mustard and green, carry a man on a cream mat, one friend at each corner, up the street toward a house. A crowd fills the street and doorway ahead and stops them">
      <Shore />
      <House x0={14} x1={50} y={146} top={100} door={[24, 40, 118]} />
      <House x0={212} x1={286} y={146} top={56} door={[234, 264, 96]} />
      {crowd.map(([x, y, s], i) => (
        <Folk key={i} x={x} y={y} s={s} i={i + 1} flip />
      ))}
      <Friend who="rust" x={84} y={144} s={0.95} arms={grip(84, 144, 0.95, BL)} />
      <Friend who="teal" x={208} y={144} s={0.95} arms={grip(208, 144, 0.95, BR)} />
      <MatMan x={MX} y={MY} s={MS} />
      <Friend who="mustard" x={54} y={162} s={1.15} arms={grip(54, 162, 1.15, FL)} />
      <Friend who="green" x={192} y={162} s={1.15} arms={grip(192, 162, 1.15, FR)} />
    </Frame>
  );
}

/* ---------- 3. the roof opened, the mat let down ---------- */
/* where a point in a person's own space lands in the picture */
function onFigure(x: number, y: number, s: number, rot: number, flip: boolean, lx: number, ly: number): [number, number] {
  const a = (rot * Math.PI) / 180;
  const px = (flip ? -lx : lx) * s;
  const py = ly * s;
  return [x + px * Math.cos(a) - py * Math.sin(a), y + px * Math.sin(a) + py * Math.cos(a)];
}
function Roof({ k }: { k: Ink }) {
  void k;
  const p = useRun(400, 1800);
  const e = 1 - (1 - p) * (1 - p);
  const MX = 150;
  const MS = 0.95;
  const MY = 126 - 20 * (1 - e);
  const rot = -4 * (1 - e);
  const FL = corner(MX, MY, MS, rot, -54, 2);
  const BL = corner(MX, MY, MS, rot, -40, -8);
  const FR = corner(MX, MY, MS, rot, 40, 2);
  const BR = corner(MX, MY, MS, rot, 54, -8);
  const RY = 72;
  const S = 0.9;
  /* each friend leans toward the hole and holds a rope in both hands; the rope runs from those hands to a corner of the mat */
  const hands: [number, number] = [17, -26];
  const team: { who: keyof typeof FRIEND; x: number; flip: boolean; rot: number; to: [number, number] }[] = [
    { who: 'mustard', x: 62, flip: false, rot: 8, to: FL },
    { who: 'rust', x: 86, flip: false, rot: 8, to: BL },
    { who: 'teal', x: 214, flip: true, rot: -8, to: BR },
    { who: 'green', x: 238, flip: true, rot: -8, to: FR },
  ];
  const held = team.map((t) => ({ ...t, from: onFigure(t.x, RY, S, t.rot, t.flip, hands[0], hands[1]) }));
  return (
    <Frame label="A cutaway of the house in Capernaum. Four friends in mustard, rust, teal and green lean over the flat roof around a hole they opened and let the man on his mat down by ropes into the crowded room below, where Jesus stands in white">
      <Rect x={10} y={10} width={280} height={162} rx={12} fill={SKY} />
      <Sun x={44} y={34} />
      {/* the room, seen with its front wall taken away */}
      <Rect x={28} y={82} width={244} height={80} fill="#5A3B2A" />
      <Path d="M28 158 L272 158 L272 166 Q272 172 266 172 L34 172 Q28 172 28 166 Z" fill="#7A5535" />
      <Polygon points="104,82 196,82 240,158 96,158" fill={GOLD} opacity={0.24} />
      <Rect x={44} y={98} width={20} height={34} rx={10} fill="#3A2418" />
      <Rect x={236} y={98} width={20} height={34} rx={10} fill="#3A2418" />
      {/* the people in the room */}
      <Folk x={44} y={160} s={0.78} i={2} />
      <Folk x={66} y={158} s={0.74} i={4} />
      <Folk x={88} y={160} s={0.8} i={6} />
      <Folk x={262} y={160} s={0.78} i={1} flip />
      <Jesus
        x={234}
        y={162}
        s={1.2}
        flip
        tilt={-24}
        arms={[
          [-9, -12, -22],
          [9, 16, -18],
        ]}
      />
      {/* the walls and the roof with its hole */}
      <G stroke={EDGE} strokeWidth={1.4} strokeLinejoin="round">
        <Rect x={20} y={72} width={9} height={94} fill={STONE} />
        <Rect x={271} y={72} width={9} height={94} fill={STONE} />
        <Path d="M20 72 L102 72 L98 76 L103 80 L98 82 L20 82 Z" fill="#C9A266" />
        <Path d="M280 72 L198 72 L202 76 L197 80 L202 82 L280 82 Z" fill="#C9A266" />
        <Rect x={92} y={68} width={9} height={4} fill="#C9A266" />
        <Rect x={200} y={69} width={8} height={3} fill="#C9A266" />
      </G>
      {/* ropes, mat, and the man */}
      {held.map((t) => (
        <Line key={t.who} x1={t.from[0]} y1={t.from[1]} x2={t.to[0]} y2={t.to[1]} stroke="#6B4A22" strokeWidth={1.7} strokeLinecap="round" />
      ))}
      <MatMan x={MX} y={MY} s={MS} rot={rot} />
      {team.map((t) => (
        <Friend
          key={t.who}
          who={t.who}
          x={t.x}
          y={RY}
          s={S}
          rot={t.rot}
          flip={t.flip}
          arms={[
            [-9, hands[0] - 1, hands[1]],
            [9, hands[0] + 2, hands[1] - 1],
          ]}
          tilt={14}
        />
      ))}
    </Frame>
  );
}

/* ---------- 4. their faith ---------- */
function Peer({ x, y, who }: { x: number; y: number; who: keyof typeof FRIEND }) {
  const f = FRIEND[who];
  return (
    <G transform={`translate(${x} ${y}) scale(1.25)`}>
      <Path d="M-13 7 Q-13 2 0 2 Q13 2 13 7 Z" fill={f.robe} stroke={BEAR_LINE} strokeWidth={1.4} strokeLinejoin="round" />
      <Circle cx={0} cy={-8} r={8.4} fill={SKIN} stroke={BEAR_LINE} strokeWidth={1.4} />
      <Path d="M-8.4 -9 Q-8.2 -17.6 0 -17.6 Q8.4 -17.2 8.4 -9 Q4 -13 0 -12.6 Q-5 -13 -8.4 -9 Z" fill={f.hair} />
      <Path d="M-8 -12.6 Q0 -17 8 -12.6" stroke={f.sash} strokeWidth={2.4} fill="none" strokeLinecap="round" />
      <Circle cx={-3} cy={-6.4} r={1.2} fill={BEAR_LINE} />
      <Circle cx={3} cy={-6.4} r={1.2} fill={BEAR_LINE} />
      <Path d="M-2.6 -2.4 Q0 -0.4 2.6 -2.4" stroke={BEAR_LINE} strokeWidth={1.1} fill="none" strokeLinecap="round" />
    </G>
  );
}
function Faith({ k }: { k: Ink }) {
  void k;
  return (
    <Frame label="Inside the crowded house, Jesus in a white robe with a red sash looks up at four faces, rust, mustard, teal and green, peering down through the hole in the roof. Warm light falls through it onto the man lying on his mat below">
      <Rect x={10} y={10} width={280} height={162} rx={12} fill="#7A5136" />
      <Rect x={104} y={10} width={108} height={30} fill="#FFE9A8" />
      <Peer x={124} y={37} who="rust" />
      <Peer x={148} y={35} who="mustard" />
      <Peer x={172} y={36} who="teal" />
      <Peer x={196} y={38} who="green" />
      <Path d="M10 22 Q10 10 22 10 L104 10 L104 40 L10 40 Z" fill="#3F281C" />
      <Path d="M212 10 L278 10 Q290 10 290 22 L290 40 L212 40 Z" fill="#3F281C" />
      <Rect x={98} y={40} width={120} height={7} fill="#2A1810" />
      <Path d="M10 47 L290 47" stroke="#2A1810" strokeWidth={1.5} opacity={0.5} />
      <Path d="M40 10 L40 40 M76 10 L76 40 M238 10 L238 40 M262 10 L262 40" stroke="#2A1810" strokeWidth={4} opacity={0.6} />
      <Path d="M10 152 L290 152 L290 160 Q290 172 278 172 L22 172 Q10 172 10 160 Z" fill="#8A5A3A" />
      <Path d="M10 162 L290 162" stroke="#5E3A1A" strokeWidth={1.2} opacity={0.5} />
      <Polygon points="104,47 212,47 286,154 150,154" fill={GOLD} opacity={0.22} />
      <Polygon points="130,47 190,47 236,154 176,154" fill={GOLD} opacity={0.18} />
      <Folk x={28} y={158} s={0.78} i={2} />
      <Folk x={274} y={158} s={0.78} i={5} flip />
      <Jesus
        x={116}
        y={158}
        s={1.32}
        tilt={-24}
        arms={[
          [-9, -10, -20],
          [9, 19, -25],
        ]}
      />
      <MatMan x={206} y={150} s={1.1} />
    </Frame>
  );
}

/* ---------- 5. leaning on someone ---------- */
function Lean({ k }: { k: Ink }) {
  void k;
  const p = useRun(300, 1600);
  const e = 1 - (1 - p) * (1 - p);
  const dx = 18 * (1 - e);
  const stars: [number, number, number][] = [
    [36, 34, 1.6],
    [70, 22, 1.2],
    [120, 36, 1.4],
    [196, 24, 1.6],
    [240, 52, 1.2],
    [262, 28, 1.4],
  ];
  return (
    <Frame label="Night on a road. One person, tired, leans their head on another's shoulder as they walk, and the stronger one holds up a small glowing lamp that lights both of them">
      <Rect x={10} y={10} width={280} height={162} rx={12} fill="#2F2A5E" />
      {stars.map(([x, y, r], i) => (
        <Circle key={i} cx={x} cy={y} r={r} fill="#FFF1B8" />
      ))}
      <Path d="M262 56 Q246 56 246 40 Q246 24 262 24 Q252 28 252 40 Q252 52 262 56 Z" fill={GOLD} />
      <Path d="M10 118 Q80 104 160 114 Q230 104 290 112 L290 160 Q290 172 278 172 L22 172 Q10 172 10 160 Z" fill="#4B4278" />
      <Path d="M10 140 Q130 128 290 138 L290 160 Q290 172 278 172 L22 172 Q10 172 10 160 Z" fill="#6A5FA0" />
      <Ellipse cx={190} cy={156} rx={84} ry={12} fill={GOLD} opacity={0.22} />
      <Ellipse cx={190} cy={156} rx={50} ry={8} fill={GOLD} opacity={0.28} />
      <Robed x={124 + dx} y={156} s={1.25} rot={16} robe="#5C7C8A" sash="#3B5662" tilt={14} glance={1.6} arms={[[9, 16, -22]]} />
      <Robed
        x={168 + dx}
        y={156}
        s={1.4}
        robe="#8E5CC0"
        sash="#5E3A8A"
        tilt={-6}
        arms={[
          [-9, -20, -30],
          [9, 17, -34],
        ]}>
        <G transform="translate(17 -38)">
          <Circle cx={0} cy={-2} r={26} fill={GOLD} opacity={0.2} />
          <Circle cx={0} cy={-2} r={15} fill={GOLD} opacity={0.32} />
          <Path d="M-6 6 Q-7 0 -3 -1 L6 -1 Q9 0 8 6 Q3 9 -6 6 Z" fill={GOLD_D} stroke={BEAR_LINE} strokeWidth={1.2} strokeLinejoin="round" />
          <Path d="M0 -2 Q-4 -8 0 -14 Q4 -8 0 -2 Z" fill="#FFF1B8" stroke={BEAR_LINE} strokeWidth={0.9} strokeLinejoin="round" />
        </G>
      </Robed>
    </Frame>
  );
}

/* ---------- 6. both ways ---------- */
function Heart({ x, y, s = 1, fill = HEART, rot = 0 }: { x: number; y: number; s?: number; fill?: string; rot?: number }) {
  return (
    <G transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <Circle cx={0} cy={0} r={13} fill={GOLD} opacity={0.22} />
      <Path d="M0 6 C-12 -3 -7 -12 0 -6 C7 -12 12 -3 0 6 Z" fill={fill} stroke={BEAR_LINE} strokeWidth={1.3 / s} strokeLinejoin="round" />
    </G>
  );
}
/* a seated person on (x, y), the floor, facing right: hip at height 32. hand is where the near hand rests, in the person's space */
function Sitter({
  x,
  y,
  s = 1,
  flip = false,
  top,
  legs,
  hair,
  suit = false,
  tie,
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
  suit?: boolean;
  tie?: string;
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
        {suit ? (
          <G>
            <Path d="M-3.4 -63.4 L5.4 -63.4 L1 -50 Z" fill={WHITE} stroke={BEAR_LINE} strokeWidth={0.8} strokeLinejoin="round" />
            <Path d="M1 -62 L3.1 -57 L1.4 -45 L-0.4 -57 Z" fill={tie ?? RED} stroke={BEAR_LINE} strokeWidth={0.7} strokeLinejoin="round" />
            <Path d="M-3.4 -63.4 L1 -50 L-3 -36 M5.4 -63.4 L1 -50" stroke={BEAR_LINE} strokeWidth={1} fill="none" opacity={0.6} />
          </G>
        ) : null}
        <Tube fill={top} parts={[[`M0 -57 L7 -44 L${hand[0]} ${hand[1]}`, 5]]} />
        <Hand x={hand[0]} y={hand[1]} />
        {children}
        <G transform={`rotate(${tilt} 1 -64)`}>
          <Circle cx={1} cy={-73} r={8.5} fill={SKIN} stroke={BEAR_LINE} strokeWidth={sw} />
          <Path d="M-7.6 -74 Q-7.4 -83 1 -83 Q9.6 -82.6 9.6 -74 Q5 -78 1 -77.5 Q-4 -78 -7.6 -74 Z" fill={hair} />
          <Circle cx={5} cy={-72} r={1.5} fill={BEAR_LINE} />
          <Path d="M3.4 -68 Q5.4 -67 7.4 -68.4" stroke={BEAR_LINE} strokeWidth={1} fill="none" strokeLinecap="round" />
        </G>
      </G>
    </G>
  );
}
function Stool({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`} stroke={BEAR_LINE} strokeWidth={1.4} strokeLinejoin="round">
      <Path d="M-17 -28 L17 -28 L13 0 L-13 0 Z" fill={WOOD} />
      <Rect x={-19} y={-31} width={38} height={6} rx={2.4} fill="#C99058" />
    </G>
  );
}
function Two({ k }: { k: Ink }) {
  void k;
  const p = useRun(300, 1800);
  const rise = (1 - p) * 10;
  return (
    <Frame label="Two people sit on low stools facing each other at the end of the day, both speaking honestly, and two small hearts of light rise between them and cross, one going each way">
      <Rect x={10} y={10} width={280} height={162} rx={12} fill={SKY} />
      <Sun x={250} y={40} />
      <Path d="M10 126 L290 126 L290 160 Q290 172 278 172 L22 172 Q10 172 10 160 Z" fill={SAND_D} />
      <Path d="M10 146 Q150 136 290 146 L290 160 Q290 172 278 172 L22 172 Q10 172 10 160 Z" fill="#E4CB98" opacity={0.7} />
      {/* the speaking: soft arcs at each mouth, and the hearts crossing in the middle */}
      <Path d="M-4 0 Q4 -6 -4 -12" transform="translate(116 80)" stroke={BEAR_LINE} strokeWidth={1.6} fill="none" strokeLinecap="round" opacity={0.5} />
      <Path d="M4 0 Q-4 -6 4 -12" transform="translate(184 80)" stroke={BEAR_LINE} strokeWidth={1.6} fill="none" strokeLinecap="round" opacity={0.5} />
      <Path d="M122 80 Q140 70 168 50" stroke={HEART} strokeWidth={2.4} strokeDasharray="1 6" strokeLinecap="round" fill="none" />
      <Path d="M178 80 Q160 70 132 50" stroke={GOLD_D} strokeWidth={2.4} strokeDasharray="1 6" strokeLinecap="round" fill="none" />
      <Heart x={170} y={44 + rise} s={1.15} fill={HEART} rot={8} />
      <Heart x={130} y={44 + rise * 0.8} s={1.15} fill={GOLD} rot={-8} />
      <Stool x={100} y={160} s={1.1} />
      <Stool x={200} y={160} s={1.1} />
      <Sitter x={98} y={160 - 4.2} s={1.1} top="#7A4FA0" legs="#4A3A66" hair={HAIR} lean={3} hand={[20, -36]} />
      <Sitter x={202} y={160 - 4.2} s={1.1} flip top="#D9822B" legs="#6A4A2E" hair="#6A4A30" lean={3} hand={[20, -36]} />
    </Frame>
  );
}

/* ---------- 7. the bishop's office ---------- */
function Chair({ x, y, s = 1, flip = false, fill }: { x: number; y: number; s?: number; flip?: boolean; fill: string }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`} stroke={BEAR_LINE} strokeWidth={1.4} strokeLinejoin="round">
      <Rect x={-22} y={-18} width={4.4} height={18} fill={WOOD_D} />
      <Rect x={14} y={-18} width={4.4} height={18} fill={WOOD_D} />
      <Rect x={-27} y={-72} width={13} height={56} rx={6} fill={fill} />
      <Rect x={-25} y={-30} width={46} height={13} rx={4.6} fill={fill} />
    </G>
  );
}
function Bishop({ k }: { k: Ink }) {
  void k;
  return (
    <Frame label="A simple office. A man in a plain suit and tie sits in an armchair, leaning in to listen, and a younger person sits in a chair beside him, turned to talk. There is no desk between them, only a small table with a lamp">
      <Rect x={10} y={10} width={280} height={162} rx={12} fill="#C9A074" />
      <Path d="M10 132 L290 132 L290 160 Q290 172 278 172 L22 172 Q10 172 10 160 Z" fill="#7A4F32" />
      <Rect x={10} y={128} width={280} height={5} fill="#8E5E3C" />
      <Ellipse cx={150} cy={160} rx={118} ry={9} fill="#9B3B3B" opacity={0.85} />
      {/* the window, a picture and a plant */}
      <Rect x={26} y={26} width={48} height={58} rx={3} fill="#BFE6F5" stroke={WOOD_D} strokeWidth={2.5} />
      <Path d="M50 26 L50 84 M26 55 L74 55" stroke={WOOD_D} strokeWidth={2} />
      <Circle cx={62} cy={38} r={5} fill={GOLD} />
      <Rect x={128} y={26} width={44} height={34} rx={2} fill="#F3E3BC" stroke={WOOD_D} strokeWidth={2.4} />
      <Path d="M132 56 L146 38 L156 50 L164 42 L168 56 Z" fill="#6E9A6A" />
      <Circle cx={160} cy={34} r={3.4} fill={GOLD} />
      <G stroke={BEAR_LINE} strokeWidth={1.3} strokeLinejoin="round">
        <Rect x={248} y={138} width={22} height={22} rx={3} fill="#B9803F" />
        <Path d="M259 138 Q238 124 242 100 Q254 112 259 138 Z" fill="#4E8A5C" />
        <Path d="M259 138 Q280 120 274 94 Q262 110 259 138 Z" fill="#5FA06D" />
        <Path d="M259 138 Q258 112 260 88 Q266 112 259 138 Z" fill="#3F7A50" />
      </G>
      {/* the small table and its lamp, with a warm pool of light */}
      <Circle cx={150} cy={104} r={34} fill={GOLD} opacity={0.2} />
      <Circle cx={150} cy={104} r={20} fill={GOLD} opacity={0.26} />
      <G stroke={BEAR_LINE} strokeWidth={1.4} strokeLinejoin="round">
        <Rect x={134} y={124} width={32} height={6} rx={2} fill="#C99058" />
        <Rect x={138} y={130} width={4} height={30} fill={WOOD_D} />
        <Rect x={158} y={130} width={4} height={30} fill={WOOD_D} />
        <Rect x={148} y={112} width={4} height={12} fill={GOLD_D} />
        <Path d="M140 112 L144 96 L156 96 L160 112 Z" fill="#FFF1B8" />
      </G>
      {/* the two chairs, side by side, turned toward each other */}
      <Chair x={86} y={160} s={1.1} fill="#6B7C5A" />
      <Chair x={214} y={160} s={1.1} flip fill="#6B7C5A" />
      <Sitter x={84} y={160 - 4} s={1.1} top="#D9822B" legs="#3C5A8A" hair={HAIR} tilt={8} lean={2} hand={[17, -30]} />
      <Sitter x={216} y={160 - 4} s={1.1} flip top="#454B5E" legs="#3A3F50" hair="#C9CDD8" suit tie="#8E2F3F" lean={7} hand={[22, -46]} />
    </Frame>
  );
}

/* ---------- 8. a corner of the mat ---------- */
function Corner({ k }: { k: Ink }) {
  void k;
  const p = useRun(300, 1500);
  const glow = 0.25 + 0.2 * Math.sin(p * Math.PI);
  return (
    <Frame label="A man in a blue robe sits on his cream mat and holds one corner of it out toward a friend in teal, who reaches to take it. A small warm glow sits between their hands">
      <Shore />
      {/* the mat, with its right corner lifted */}
      <Path d="M58 168 L136 168 Q158 164 168 136 L158 129 Q150 152 130 152 L70 152 Z" fill={MAT} stroke={BEAR_LINE} strokeWidth={1.4} strokeLinejoin="round" />
      <Path d="M92 152 L84 168 M112 152 L104 168" stroke={MAT_D} strokeWidth={1.4} strokeLinecap="round" />
      {/* the man, sitting, holding the corner out */}
      <G transform="translate(122 162) scale(1.1)">
        <Path
          d="M-24 0 Q-18 -9 -9 -13 L-8 -37 Q-8 -45 0 -45 Q8 -45 8 -37 L9 -13 Q18 -9 24 0 Z"
          fill={BLUE}
          stroke={BEAR_LINE}
          strokeWidth={1.4}
          strokeLinejoin="round"
        />
        <Path d="M-9 -22 L9 -22" stroke="#2A4688" strokeWidth={3} />
        <Tube fill={BLUE} parts={[['M-8 -35 L-13 -16', 5]]} />
        <Hand x={-13} y={-14} />
        <Tube fill={BLUE} parts={[['M8 -35 L36 -29', 5]]} />
        <Hand x={37} y={-29} />
        <Circle cx={0} cy={-52} r={8.5} fill={SKIN} stroke={BEAR_LINE} strokeWidth={1.4} />
        <Path d="M-8.6 -53 Q-8.4 -62 0 -62 Q8.6 -61.6 8.6 -53 Q4 -57 0 -56.5 Q-5 -57 -8.6 -53 Z" fill={HAIR} />
        <Circle cx={4} cy={-51} r={1.5} fill={BEAR_LINE} />
        <Path d="M2.4 -46.6 Q4.6 -45.6 6.6 -47" stroke={BEAR_LINE} strokeWidth={1} fill="none" strokeLinecap="round" />
      </G>
      {/* the glow between the hands, and the friend */}
      <Circle cx={176} cy={126} r={22} fill={GOLD} opacity={glow} />
      <Circle cx={176} cy={126} r={11} fill={GOLD} opacity={glow + 0.2} />
      <Friend
        who="teal"
        x={214}
        y={162}
        s={1.15}
        flip
        arms={[
          [-9, -10, -24],
          [9, 27, -36],
        ]}
      />
    </Frame>
  );
}

/* ---------- 9 to 11. the hill ---------- */
const STEEP = 'M112 150 Q148 146 168 110 Q188 70 214 46 Q232 30 252 30 Q272 30 290 38';
const GENTLE = 'M116 150 Q190 142 240 106 Q264 90 290 86';
function HillBase({ steep, ghost }: { steep: boolean; ghost?: boolean }) {
  return (
    <G>
      <Rect x={10} y={10} width={280} height={162} rx={12} fill="#9CCBE8" />
      <Circle cx={52} cy={42} r={22} fill={GOLD} opacity={0.35} />
      <Circle cx={52} cy={42} r={13} fill={GOLD} />
      {ghost ? (
        <G>
          <Path d={`${STEEP} L290 160 L112 160 Z`} fill="#3E7A47" opacity={0.28} />
          <Path d={STEEP} stroke={BEAR_LINE} strokeWidth={2.2} strokeDasharray="2 6" strokeLinecap="round" fill="none" opacity={0.55} />
        </G>
      ) : null}
      <Path d={`M10 150 L${steep ? STEEP.slice(1) : GENTLE.slice(1)} L290 160 Q290 172 278 172 L22 172 Q10 172 10 160 Z`} fill="#5FA564" />
      <Path d={steep ? STEEP : GENTLE} stroke="#3E7A47" strokeWidth={3} fill="none" strokeLinecap="round" />
      <Path d="M10 156 L110 154 Q140 154 150 164 L290 164 L290 160 Q290 172 278 172 L22 172 Q10 172 10 160 Z" fill="#4E8F55" />
    </G>
  );
}
/* a student, standing on (x, y), facing right: a hooded top, jeans and, when pack is on, a heavy backpack. arm is where the near hand is; tilt looks up */
function Student({
  x,
  y,
  s = 1,
  hood,
  pants = '#3C5A8A',
  hair = HAIR,
  pack = true,
  arm = [8, -37],
  tilt = -16,
  rot = 0,
  flip = false,
}: {
  x: number;
  y: number;
  s?: number;
  hood: string;
  pants?: string;
  hair?: string;
  pack?: boolean;
  arm?: [number, number];
  tilt?: number;
  rot?: number;
  flip?: boolean;
}) {
  const sw = 1.5 / s;
  return (
    <G transform={`translate(${x} ${y}) rotate(${rot}) scale(${flip ? -s : s} ${s})`}>
      {pack ? (
        <G stroke={BEAR_LINE} strokeWidth={1.5} strokeLinejoin="round">
          <Rect x={-31} y={-68} width={24} height={46} rx={8} fill="#355C7D" />
          <Rect x={-29} y={-44} width={18} height={14} rx={5} fill="#4B7BA3" />
          <Path d="M-24 -68 Q-19 -76 -14 -68" fill="none" />
          <Rect x={-27} y={-73} width={14} height={7} rx={2.5} fill={MAT} />
        </G>
      ) : null}
      <Tube
        fill={pants}
        parts={[
          ['M-4 -26 L-5 -4', 6.4],
          ['M4 -26 L5 -4', 6.4],
        ]}
      />
      <Ellipse cx={-3} cy={-1} rx={6.6} ry={2.8} fill={BEAR_LINE} />
      <Ellipse cx={8} cy={-1} rx={6.6} ry={2.8} fill={BEAR_LINE} />
      <Path d="M-12 -24 L-10 -50 Q-10 -57 0 -57 Q10 -57 10 -50 L12 -24 Z" fill={hood} stroke={BEAR_LINE} strokeWidth={sw} strokeLinejoin="round" />
      {pack ? <Path d="M-9 -54 Q-1 -50 -2 -30" stroke="#1F3A55" strokeWidth={2.6} fill="none" strokeLinecap="round" /> : null}
      <Tube fill={hood} parts={[[`M1 -52 L${arm[0]} ${arm[1]}`, 5.4]]} />
      <Hand x={arm[0]} y={arm[1]} />
      <G transform={`rotate(${tilt} 0 -57)`}>
        <Circle cx={0} cy={-65} r={8.5} fill={SKIN} stroke={BEAR_LINE} strokeWidth={sw} />
        <Path d="M-8.6 -66 Q-8.4 -75 0 -75 Q8.6 -74.6 8.6 -66 Q4 -70 0 -69.5 Q-5 -70 -8.6 -66 Z" fill={hair} />
        <Circle cx={4} cy={-64} r={1.5} fill={BEAR_LINE} />
      </G>
    </G>
  );
}
function HillAlone({ k }: { k: Ink }) {
  void k;
  return (
    <Frame label="A student with a heavy backpack stands alone at the bottom of a very steep hill and looks up to the top">
      <HillBase steep />
      <Student x={96} y={152} s={1.15} hood="#D9822B" rot={4} />
    </Frame>
  );
}
function HillFriend({ k }: { k: Ink }) {
  void k;
  return (
    <Frame label="The same student with the heavy backpack, now with a friend standing a few steps away, silent, facing the other way and not touching them, looks up the same hill, which is drawn much less steep. A faint dotted outline behind shows how steep it looked alone">
      <HillBase steep={false} ghost />
      <Student x={64} y={152} s={1.15} hood="#D9822B" rot={4} />
      <Student x={150} y={150} s={1.15} hood="#7A4FA0" pants="#4A4A5E" hair="#6A4A30" pack={false} flip arm={[4, -28]} tilt={0} />
    </Frame>
  );
}
function HillPicture({ k }: { k: Ink }) {
  void k;
  const bubble: [number, number, number][] = [
    [140, 52, 20],
    [162, 36, 22],
    [194, 34, 24],
    [220, 48, 20],
    [206, 68, 20],
    [172, 70, 18],
  ];
  return (
    <Frame label="A student with a heavy backpack stands alone at the foot of a gentle hill. In a thought cloud they picture a friend who supports them, smiling, with a small heart beside the friend">
      <HillBase steep={false} />
      <Student x={80} y={152} s={1.15} hood="#D9822B" rot={4} tilt={-10} />
      <Circle cx={98} cy={62} r={3.2} fill={CREAM} stroke={BEAR_LINE} strokeWidth={1.3} />
      <Circle cx={108} cy={55} r={5} fill={CREAM} stroke={BEAR_LINE} strokeWidth={1.3} />
      {bubble.map(([cx, cy, r]) => (
        <Circle key={`o${cx}`} cx={cx} cy={cy} r={r} fill={BEAR_LINE} stroke={BEAR_LINE} strokeWidth={3} />
      ))}
      {bubble.map(([cx, cy, r]) => (
        <Circle key={`f${cx}`} cx={cx} cy={cy} r={r} fill={CREAM} />
      ))}
      <Ellipse cx={180} cy={52} rx={46} ry={26} fill={CREAM} />
      <G transform="translate(176 62)">
        <Path d="M-17 14 Q-17 -4 0 -4 Q17 -4 17 14 Z" fill="#7A4FA0" stroke={BEAR_LINE} strokeWidth={1.4} strokeLinejoin="round" />
        <Circle cx={0} cy={-14} r={10} fill={SKIN} stroke={BEAR_LINE} strokeWidth={1.4} />
        <Path d="M-10 -15 Q-10 -26 0 -26 Q10 -26 10 -15 Q5 -19 0 -18.4 Q-6 -19 -10 -15 Z" fill="#6A4A30" />
        <Circle cx={-3.6} cy={-13} r={1.3} fill={BEAR_LINE} />
        <Circle cx={3.6} cy={-13} r={1.3} fill={BEAR_LINE} />
        <Path d="M-4 -8.4 Q0 -4.6 4 -8.4" stroke={BEAR_LINE} strokeWidth={1.3} fill="none" strokeLinecap="round" />
      </G>
      <Heart x={210} y={42} s={0.9} />
    </Frame>
  );
}

export const SCENES_I6: Record<string, ComponentType<{ k: Ink }>> = {
  'g6-crowd': Crowd,
  'g6-four': Four,
  'g6-roof': Roof,
  'g6-faith': Faith,
  'g6-lean': Lean,
  'g6-two': Two,
  'g6-bishop': Bishop,
  'g6-corner': Corner,
  'g6-hill': HillAlone,
  'g6-friend': HillFriend,
  'g6-picture': HillPicture,
};
