/* Scenes for lesson 28, told as a story (see story-kit.tsx and story-scenes-f.tsx): the small town of Framingham, the web of people the
   study drew, the clusters that quit together, and what it looks like to live inside a circle. */
import { useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { Easing } from 'react-native';
import { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';

import { useAppear, useReducedMotion } from '@/lib/motion';

import { BEAR_LINE, Frame, type Ink, Person, Say } from './story-kit';

const WOOD = '#B07A45';
const WOOD_D = '#8A5A2B';
const GOLD = '#FFD25A';
const SUN = '#E8B84A';
const WHITE = '#FFFFFF';
const GREEN = '#3FA866';
const LEAF = '#4C9A5E';
const LEAF_D = '#3A7F4B';
const SMOKE = '#E2572B';
const PEACH = '#E58A6A';
const TEAL = '#4FA39A';
const PLUM = '#B07CC6';
const SKY = '#6FA3D8';
const BLUSH = '#E58A9A';
const SKIN = '#F0C8A0';
const HEART = '#E0283C';
const GLOW = '#9ED8FF';
const SCREEN = '#CDEBFF';
const DARK = '#2A2F3F';
const GRAY = '#8E96AB';

/* the line of words under a picture */
function Cap({ k, s }: { k: Ink; s: string }) {
  return <Say x={150} y={190} s={s} fill={k.ink} />;
}

/* a person who faces left or right: the kit draws one facing right, so facing left is the same drawing turned around its own middle */
function Face({ x, y, s = 1, fill, face, dir = 1 }: { x: number; y: number; s?: number; fill: string; face?: string; dir?: 1 | -1 }) {
  return (
    <G transform={`translate(${x} 0) scale(${dir} 1) translate(${-x} 0)`}>
      <Person x={x} y={y} s={s} fill={fill} face={face} />
    </G>
  );
}

/* a phone with its screen lit */
function Phone({ x, y, s = 1, rot = 0 }: { x: number; y: number; s?: number; rot?: number }) {
  return (
    <G transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <Circle cx={0} cy={0} r={24} fill={GLOW} opacity={0.22} />
      <Circle cx={0} cy={0} r={16} fill={GLOW} opacity={0.28} />
      <Rect x={-8} y={-14} width={16} height={28} rx={3.5} fill={DARK} stroke={GRAY} strokeWidth={1.2} />
      <Rect x={-6} y={-11.5} width={12} height={23} rx={2} fill={SCREEN} />
      <Rect x={-4} y={-8.5} width={8} height={2.6} rx={1.3} fill="#8FC3E8" />
      <Rect x={-4} y={-3.5} width={8} height={2.6} rx={1.3} fill="#8FC3E8" />
      <Rect x={-4} y={1.5} width={5} height={2.6} rx={1.3} fill="#8FC3E8" />
    </G>
  );
}

/* a small heart centered on (x, y), about 17 wide at s = 1 */
function HeartShape({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Path
        d="M0 6 C-10 -1 -8 -9 -4 -9 C-1.8 -9 0 -7.2 0 -5.6 C0 -7.2 1.8 -9 4 -9 C8 -9 10 -1 0 6 Z"
        fill={HEART}
        stroke="#7A1020"
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
    </G>
  );
}

/* a round tree standing on (x, y) */
function Tree({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Rect x={-3} y={-20} width={6} height={20} fill="#7A4B2A" stroke={BEAR_LINE} strokeWidth={1.2} />
      <Circle cx={0} cy={-30} r={15} fill={LEAF} stroke={BEAR_LINE} strokeWidth={1.3} />
      <Circle cx={-5} cy={-33} r={6} fill={LEAF_D} opacity={0.55} />
      <Circle cx={7} cy={-26} r={4.5} fill={LEAF_D} opacity={0.4} />
    </G>
  );
}

/* a white clapboard house with a pitched roof, its base on y = 134 */
function House({ x, w, top, door }: { x: number; w: number; top: number; door: string }) {
  const rows: number[] = [];
  for (let y = top + 7; y < 132; y += 6) rows.push(y);
  const mid = x + w / 2;
  return (
    <G>
      <Rect x={x + w - 14} y={top - 30} width={7} height={18} fill="#B5583F" stroke={BEAR_LINE} strokeWidth={1.2} />
      <Rect x={x} y={top} width={w} height={134 - top} fill="#FBF8F0" stroke={BEAR_LINE} strokeWidth={1.3} />
      {rows.map((y) => (
        <Line key={y} x1={x + 1} y1={y} x2={x + w - 1} y2={y} stroke="#D5CFBF" strokeWidth={1.1} />
      ))}
      <Path
        d={`M${x - 5} ${top + 1} L${mid} ${top - 26} L${x + w + 5} ${top + 1} Z`}
        fill="#5A6478"
        stroke={BEAR_LINE}
        strokeWidth={1.3}
        strokeLinejoin="round"
      />
      <Rect x={mid - 6} y={112} width={12} height={22} rx={1.5} fill={door} stroke={BEAR_LINE} strokeWidth={1.2} />
      <Rect x={x + 6} y={top + 12} width={11} height={12} rx={1} fill={SCREEN} stroke={BEAR_LINE} strokeWidth={1.1} />
      <Path d={`M${x + 11.5} ${top + 12} v12 M${x + 6} ${top + 18} h11`} stroke={BEAR_LINE} strokeWidth={0.9} />
    </G>
  );
}

/* ---------- the town ---------- */
function Town({ k }: { k: Ink }) {
  const walkers: [number, number, string][] = [
    [106, 0.4, PEACH],
    [128, 0.36, SKY],
    [150, 0.4, PLUM],
    [196, 0.34, TEAL],
  ];
  return (
    <Frame label="A small New England town in daylight: white clapboard houses with pitched roofs, round trees, and a low brick clinic with a small red heart over its door. A few tiny people walk along the road toward it">
      <Rect x={10} y={10} width={280} height={162} rx={12} fill="#CFE6F5" />
      <Circle cx={252} cy={34} r={11} fill={GOLD} />
      <Ellipse cx={70} cy={34} rx={20} ry={6} fill={WHITE} opacity={0.85} />
      <Ellipse cx={86} cy={29} rx={13} ry={6} fill={WHITE} opacity={0.85} />
      <Ellipse cx={158} cy={52} rx={16} ry={5} fill={WHITE} opacity={0.7} />
      <Path d="M10 130 L290 130 L290 160 Q290 172 278 172 L22 172 Q10 172 10 160 Z" fill="#9CC77E" />
      <Rect x={16} y={150} width={268} height={16} rx={4} fill="#D8C9A8" />
      <Line x1={22} y1={158} x2={278} y2={158} stroke="#C4B390" strokeWidth={1.4} strokeDasharray="10 8" />
      <House x={18} w={46} top={100} door="#B3263A" />
      <House x={70} w={50} top={96} door="#3F7FBF" />
      <Tree x={136} y={134} s={0.95} />
      <Tree x={160} y={134} s={0.8} />
      <Rect x={216} y={134} width={26} height={5} rx={1.5} fill="#E9DCC4" stroke={BEAR_LINE} strokeWidth={1.1} />
      <Rect x={180} y={104} width={98} height={30} fill="#B5583F" stroke={BEAR_LINE} strokeWidth={1.3} />
      {[112, 120, 128].map((y) => (
        <Line key={y} x1={181} y1={y} x2={277} y2={y} stroke="#8F4230" strokeWidth={1} opacity={0.55} />
      ))}
      <Rect x={176} y={97} width={106} height={8} rx={1.5} fill="#E9DCC4" stroke={BEAR_LINE} strokeWidth={1.2} />
      <Rect x={219} y={116} width={18} height={18} rx={1.5} fill="#F4E7C8" stroke={BEAR_LINE} strokeWidth={1.2} />
      <Path d="M228 116 V134" stroke={BEAR_LINE} strokeWidth={1} />
      {[190, 254].map((x) => (
        <G key={x}>
          <Rect x={x} y={112} width={16} height={13} rx={1} fill={SCREEN} stroke={BEAR_LINE} strokeWidth={1.1} />
          <Path d={`M${x + 8} 112 v13`} stroke={BEAR_LINE} strokeWidth={0.9} />
        </G>
      ))}
      <HeartShape x={228} y={87} s={1.5} />
      {walkers.map(([x, s, c]) => (
        <Person key={x} x={x} y={165} s={s} fill={c} />
      ))}
      <Cap k={k} s="Framingham, 1948" />
    </Frame>
  );
}

/* ---------- the web ---------- */

type Pt = [number, number];
/* A 0 to 6, D 7 to 13, C 14 to 19 are the three big circles of friends; B 20 to 23 and E 24 to 27 are two small chains out at the
   edges; 28 and 29 stand alone. Scene two shows them all as smokers, scene three turns A, D and C green, one group at a time. */
const NODES: Pt[] = [
  [66, 76],
  [44, 56],
  [70, 44],
  [96, 60],
  [98, 92],
  [72, 108],
  [42, 94],
  [152, 126],
  [128, 112],
  [156, 100],
  [180, 114],
  [182, 142],
  [154, 154],
  [126, 142],
  [238, 84],
  [220, 64],
  [248, 56],
  [266, 80],
  [258, 106],
  [228, 106],
  [116, 26],
  [148, 22],
  [180, 28],
  [204, 36],
  [20, 128],
  [34, 150],
  [60, 160],
  [88, 158],
  [280, 132],
  [226, 156],
];
const ring = (first: number, n: number): [number, number][] => Array.from({ length: n }, (_, i) => [first + i, first + ((i + 1) % n)]);
const spokes = (hub: number, ...to: number[]): [number, number][] => to.map((t) => [hub, t]);
/* friends and family inside a circle */
const INNER: [number, number][] = [...ring(1, 6), ...spokes(0, 1, 3, 5), ...ring(8, 6), ...spokes(7, 8, 10, 12), ...ring(15, 5), ...spokes(14, 15, 17, 19)];
/* the few links between circles and out to the edges */
const OUTER: [number, number][] = [
  [20, 21],
  [21, 22],
  [22, 23],
  [24, 25],
  [25, 26],
  [26, 27],
  [20, 2],
  [23, 15],
  [24, 6],
  [4, 8],
  [10, 19],
  [28, 18],
  [29, 11],
  [29, 19],
];
const GROUPS = [
  { from: 0, to: 6, start: 0.1 },
  { from: 7, to: 13, start: 0.4 },
  { from: 14, to: 19, start: 0.7 },
];
const groupOf = (i: number) => GROUPS.findIndex((g) => i >= g.from && i <= g.to);
const clamp = (v: number) => Math.max(0, Math.min(1, v));

function Web({ k, grown }: { k: Ink; grown: number }) {
  /* how far each group has turned green: 0 to 1 */
  const t = GROUPS.map((g) => clamp((grown - g.start) / 0.25));
  const innerGreen = (e: [number, number]) => {
    const g = groupOf(e[0]);
    return g >= 0 ? t[g] : 0;
  };
  return (
    <G>
      {[...INNER, ...OUTER].map(([a, b], i) => (
        <Line key={i} x1={NODES[a][0]} y1={NODES[a][1]} x2={NODES[b][0]} y2={NODES[b][1]} stroke={k.muted} strokeWidth={1.4} opacity={0.75} />
      ))}
      {INNER.map((e, i) => {
        const o = innerGreen(e);
        return o > 0 ? (
          <Line key={i} x1={NODES[e[0]][0]} y1={NODES[e[0]][1]} x2={NODES[e[1]][0]} y2={NODES[e[1]][1]} stroke={GREEN} strokeWidth={1.8} opacity={o} />
        ) : null;
      })}
      {NODES.map(([x, y], i) => {
        const g = groupOf(i);
        const o = g >= 0 ? t[g] : 0;
        return (
          <G key={i}>
            <Circle cx={x} cy={y} r={5.6} fill={SMOKE} stroke={BEAR_LINE} strokeWidth={1.2} />
            {o > 0 ? <Circle cx={x} cy={y} r={5.6} fill={GREEN} stroke={BEAR_LINE} strokeWidth={1.2} opacity={o} /> : null}
          </G>
        );
      })}
    </G>
  );
}

function WebAll({ k }: { k: Ink }) {
  return (
    <Frame label="A network of about thirty small round dots, each one a person, joined by thin lines for friends and family. All the dots are orange-red, for smokers, and they sit in five loose clusters with a few links running between the clusters">
      <Web k={k} grown={0} />
      <Cap k={k} s="A web of 12,067 people" />
    </Frame>
  );
}

function Clusters({ k }: { k: Ink }) {
  const still = useReducedMotion();
  const v = useAppear(500, 2600, Easing.inOut(Easing.cubic));
  const [p, setP] = useState(still ? 1 : 0);
  useEffect(() => {
    const id = v.addListener(({ value }) => setP(value));
    return () => v.removeListener(id);
  }, [v]);
  return (
    <Frame label="The same network of dots, later. Three whole clusters have turned green together, and the few orange dots left sit out at the edges of the web, each with only one or two links">
      <Web k={k} grown={still ? 1 : p} />
      <Cap k={k} s="They quit in clusters" />
    </Frame>
  );
}

/* ---------- living inside a circle ---------- */
const INK_FACE = BEAR_LINE;

function Inside({ k }: { k: Ink }) {
  return (
    <Frame label="One person stands in the middle, lit warmly, with a loose circle of five other people standing close around them, all turned in toward them and relaxed">
      <Ellipse cx={150} cy={150} rx={118} ry={20} fill={GOLD} opacity={0.14} />
      <Circle cx={150} cy={110} r={66} fill={GOLD} opacity={0.14} />
      <Circle cx={150} cy={112} r={42} fill={GOLD} opacity={0.2} />
      <Face x={150} y={86} s={0.7} fill={TEAL} face={INK_FACE} />
      <Face x={92} y={104} s={0.8} fill={PLUM} face={INK_FACE} />
      <Face x={208} y={104} s={0.8} fill={SKY} face={INK_FACE} dir={-1} />
      <Face x={46} y={150} s={1} fill={PEACH} face={INK_FACE} />
      <Face x={254} y={150} s={1} fill={BLUSH} face={INK_FACE} dir={-1} />
      <Person x={150} y={158} s={1.1} fill={k.acc} face={INK_FACE} />
      <Cap k={k} s="Company you live inside" />
    </Frame>
  );
}

/* ---------- a new circle ---------- */
function NewCircle({ k }: { k: Ink }) {
  return (
    <Frame label="A person steps from a gray, faded group of figures on the left toward a warm, colorful group on the right. One of the warm group turns to welcome them with an arm held out">
      <Line x1={14} y1={162} x2={286} y2={162} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      <Ellipse cx={62} cy={163} rx={56} ry={7} fill={k.muted} opacity={0.2} />
      <Circle cx={230} cy={118} r={64} fill={GOLD} opacity={0.14} />
      <Circle cx={230} cy={122} r={40} fill={GOLD} opacity={0.18} />
      <Ellipse cx={226} cy={163} rx={66} ry={8} fill={GOLD} opacity={0.35} />
      <G opacity={0.7}>
        <Person x={30} y={162} s={1} fill={k.muted} />
        <Person x={58} y={162} s={1.1} fill={k.muted} />
        <Person x={88} y={162} s={0.95} fill={k.muted} />
      </G>
      <Ellipse cx={106} cy={163} rx={4} ry={1.8} fill={k.muted} opacity={0.6} />
      <Ellipse cx={118} cy={163} rx={4} ry={1.8} fill={k.muted} opacity={0.8} />
      <G transform="rotate(7 142 162)">
        <Person x={142} y={162} s={1.1} fill={k.acc} face={INK_FACE} />
      </G>
      <Face x={262} y={162} s={1} fill={TEAL} face={INK_FACE} dir={-1} />
      <Face x={228} y={162} s={1.05} fill={SUN} face={INK_FACE} dir={-1} />
      <Face x={194} y={162} s={1.1} fill={PEACH} face={INK_FACE} dir={-1} />
      <Path d="M184 134 Q172 139 164 127" stroke={PEACH} strokeWidth={6.5} strokeLinecap="round" fill="none" />
      <Circle cx={163} cy={125} r={4.8} fill={SKIN} />
      <Cap k={k} s="A new circle" />
    </Frame>
  );
}

/* ---------- the place kept for you ---------- */
function Seat({ k }: { k: Ink }) {
  const guests: [number, string, 1 | -1][] = [
    [62, PEACH, 1],
    [98, TEAL, 1],
    [134, PLUM, -1],
    [170, SKY, -1],
  ];
  return (
    <Frame label="Four people sit around a table, talking. Beside them one chair is pulled out, empty, turned toward us, with a warm light shining down on it, a place kept for you">
      <Line x1={14} y1={162} x2={286} y2={162} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      <Path d="M234 36 L204 164 L276 164 L246 36 Z" fill={GOLD} opacity={0.2} />
      <Ellipse cx={240} cy={163} rx={40} ry={6} fill={GOLD} opacity={0.4} />
      {guests.map(([x, c, d]) => (
        <Face key={x} x={x} y={118} s={0.95} fill={c} face={INK_FACE} dir={d} />
      ))}
      <Rect x={28} y={112} width={176} height={7} rx={2.5} fill={WOOD} stroke={BEAR_LINE} strokeWidth={1.3} />
      <Rect x={36} y={119} width={160} height={5} fill={WOOD_D} />
      <Rect x={38} y={124} width={6} height={38} fill={WOOD_D} />
      <Rect x={188} y={124} width={6} height={38} fill={WOOD_D} />
      {[62, 98, 134, 170].map((x) => (
        <Ellipse key={x} cx={x + 8} cy={111} rx={8} ry={2.2} fill="#FFF5E1" stroke={BEAR_LINE} strokeWidth={1} />
      ))}
      <Path d="M112 110 Q116 100 124 110 Z" fill="#E9A23B" stroke={BEAR_LINE} strokeWidth={1.1} strokeLinejoin="round" />
      <Line x1={240} y1={8} x2={240} y2={26} stroke={k.muted} strokeWidth={1.6} />
      <Path d="M226 38 Q240 20 254 38 Z" fill={SUN} stroke={BEAR_LINE} strokeWidth={1.3} strokeLinejoin="round" />
      <Circle cx={240} cy={40} r={4} fill={GOLD} />
      <G transform="translate(240 0)">
        <Rect x={-14} y={126} width={4} height={30} fill={WOOD_D} />
        <Rect x={10} y={126} width={4} height={30} fill={WOOD_D} />
        <Rect x={-16} y={94} width={4.5} height={38} rx={2} fill={WOOD} stroke={BEAR_LINE} strokeWidth={1.2} />
        <Rect x={11.5} y={94} width={4.5} height={38} rx={2} fill={WOOD} stroke={BEAR_LINE} strokeWidth={1.2} />
        <Rect x={-16} y={94} width={32} height={8} rx={3} fill={WOOD} stroke={BEAR_LINE} strokeWidth={1.3} />
        <Rect x={-14} y={112} width={28} height={4} rx={1.5} fill={WOOD} stroke={BEAR_LINE} strokeWidth={1.1} />
        <Rect x={-19} y={142} width={5} height={20} fill={WOOD_D} stroke={BEAR_LINE} strokeWidth={1} />
        <Rect x={14} y={142} width={5} height={20} fill={WOOD_D} stroke={BEAR_LINE} strokeWidth={1} />
        <Path d="M-18 131 L18 131 L22 143 L-22 143 Z" fill={GOLD} stroke={BEAR_LINE} strokeWidth={1.4} strokeLinejoin="round" />
      </G>
      <Cap k={k} s="Being there is the change" />
    </Frame>
  );
}

/* ---------- three people, one connection ---------- */
function Links({ k }: { k: Ink }) {
  const trunk: ReactNode = <Rect x={146} y={64} width={8} height={44} fill="#7A4B2A" stroke={BEAR_LINE} strokeWidth={1.2} />;
  return (
    <Frame label="Three people in three different places, each holding a phone: one at a kitchen window, one on a park bench under a tree, one at a desk with a lamp. Soft dotted lines run from the other two phones to the phone of the person in the middle">
      <Line x1={14} y1={162} x2={286} y2={162} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      {/* kitchen window */}
      <Rect x={24} y={34} width={56} height={58} rx={2} fill={SCREEN} stroke={WOOD_D} strokeWidth={3.4} />
      <Path d="M52 34 V92 M24 63 H80" stroke={WOOD_D} strokeWidth={2.4} />
      <Circle cx={66} cy={48} r={5} fill={GOLD} />
      <Path d="M18 30 H34 L30 98 H18 Z" fill={PEACH} />
      <Path d="M86 30 H70 L74 98 H86 Z" fill={PEACH} />
      <Rect x={14} y={130} width={82} height={32} rx={3} fill="#C99A63" stroke={BEAR_LINE} strokeWidth={1.2} />
      <Rect x={12} y={125} width={86} height={6} rx={2} fill={WOOD_D} stroke={BEAR_LINE} strokeWidth={1.1} />
      <Path d="M55 131 V161" stroke={BEAR_LINE} strokeWidth={1} opacity={0.5} />
      <Rect x={82} y={116} width={8} height={9} rx={1.5} fill={WHITE} stroke={BEAR_LINE} strokeWidth={1.1} />
      <Person x={52} y={158} s={1} fill={PEACH} face={INK_FACE} />
      <Path d="M63 133 Q75 130 78 116" stroke={PEACH} strokeWidth={5.5} strokeLinecap="round" fill="none" />
      <Phone x={78} y={108} s={0.6} rot={8} />
      {/* park bench */}
      <Circle cx={150} cy={44} r={26} fill={LEAF} stroke={BEAR_LINE} strokeWidth={1.3} />
      <Circle cx={142} cy={38} r={9} fill={LEAF_D} opacity={0.5} />
      <Circle cx={162} cy={52} r={6} fill={LEAF_D} opacity={0.4} />
      {trunk}
      <Rect x={112} y={108} width={76} height={6} rx={2} fill={WOOD} stroke={BEAR_LINE} strokeWidth={1.2} />
      <Rect x={116} y={112} width={5} height={24} fill={WOOD_D} />
      <Rect x={179} y={112} width={5} height={24} fill={WOOD_D} />
      <Person x={150} y={136} s={1} fill={k.acc} face={INK_FACE} />
      <Rect x={110} y={134} width={80} height={7} rx={2} fill={WOOD} stroke={BEAR_LINE} strokeWidth={1.3} />
      <Rect x={118} y={141} width={5} height={21} fill={WOOD_D} />
      <Rect x={177} y={141} width={5} height={21} fill={WOOD_D} />
      <Rect x={140} y={141} width={7} height={18} rx={3} fill={k.acc} />
      <Rect x={153} y={141} width={7} height={18} rx={3} fill={k.acc} />
      <Phone x={150} y={118} s={0.6} />
      <Circle cx={143} cy={123} r={3.4} fill={SKIN} />
      <Circle cx={157} cy={123} r={3.4} fill={SKIN} />
      {/* desk */}
      <Face x={248} y={124} s={1} fill={TEAL} face={INK_FACE} dir={-1} />
      <Path d="M237 100 Q227 102 223 96" stroke={TEAL} strokeWidth={5.5} strokeLinecap="round" fill="none" />
      <Phone x={220} y={96} s={0.6} rot={-8} />
      <Rect x={208} y={122} width={78} height={6} rx={2} fill={WOOD} stroke={BEAR_LINE} strokeWidth={1.2} />
      <Rect x={213} y={128} width={5} height={34} fill={WOOD_D} />
      <Rect x={276} y={128} width={5} height={34} fill={WOOD_D} />
      <Rect x={228} y={128} width={44} height={14} rx={2} fill="#C99A63" stroke={BEAR_LINE} strokeWidth={1.1} />
      <Path d="M276 122 L270 102 L262 98" stroke={WOOD_D} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d="M254 96 L270 96 L264 104 Z" fill={SUN} stroke={BEAR_LINE} strokeWidth={1.1} strokeLinejoin="round" />
      {/* the connections */}
      <Path d="M90 102 Q112 76 140 106" stroke={k.acc} strokeWidth={3.2} strokeDasharray="1 7" strokeLinecap="round" fill="none" />
      <Path d="M210 92 Q184 74 160 106" stroke={k.acc} strokeWidth={3.2} strokeDasharray="1 7" strokeLinecap="round" fill="none" />
      <Cap k={k} s="One connection at a time" />
    </Frame>
  );
}

export const SCENES_L28: Record<string, ComponentType<{ k: Ink }>> = {
  'l22-town': Town,
  'l22-web': WebAll,
  'l22-clusters': Clusters,
  'l22-inside': Inside,
  'l22-new-circle': NewCircle,
  'l22-seat': Seat,
  'l22-links': Links,
};
