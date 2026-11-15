/* Scenes for lessons told as a story (see story-kit.tsx and story-scenes-h.tsx): lesson 47 (telling a partner the truth) and lesson 48
   (desire after quitting, and spectatoring). Every person is a simple, fully clothed figure, and every home is drawn warm. */
import { type ComponentType, type ReactNode } from 'react';
import { ClipPath, Circle, Defs, Ellipse, G, Line, Path, Rect } from 'react-native-svg';

import { BEAR_LINE, Frame, type Ink, Person, Say } from './story-kit';

const BROWN = '#8A5A2B';
const ROPE = '#B8864A';
const GOLD = '#FFD25A';
const WHITE = '#FFFFFF';
const GREEN = '#3F8F5B';
const SKIN = '#E8B98F';
const SKIN2 = '#A8714A';
const STONE = '#3B3A45';
const BLUE = '#4F6FA8';
const ORANGE = '#D9602A';
const TEAL = '#3F8F8A';
const BRICK = '#B5533C';
const WOOD = '#C9965B';
const CREAM = '#F6E3C6';

/* the line of words under a picture */
function Cap({ k, s }: { k: Ink; s: string }) {
  return <Say x={150} y={190} s={s} fill={k.ink} />;
}

/* the picture's own rounded panel, so it reads on a light page and a dark one */
function Panel({ id, fill, children }: { id: string; fill: string; children: ReactNode }) {
  return (
    <>
      <Defs>
        <ClipPath id={id}>
          <Rect x={10} y={10} width={280} height={152} rx={14} />
        </ClipPath>
      </Defs>
      <G clipPath={`url(#${id})`}>
        <Rect x={10} y={10} width={280} height={152} fill={fill} />
        {children}
      </G>
    </>
  );
}

/* a person sitting, seen from the side: x and y are the hips, dir 1 faces right and -1 faces left, lean tips the body forward */
function Sitter({
  x,
  y,
  s = 1,
  fill,
  dir = 1,
  lean = 0,
  face = WHITE,
  children,
}: {
  x: number;
  y: number;
  s?: number;
  fill: string;
  dir?: 1 | -1;
  lean?: number;
  face?: string;
  children?: ReactNode;
}) {
  return (
    <G transform={`translate(${x} ${y}) scale(${dir * s} ${s})`}>
      <Rect x={-6} y={-12} width={32} height={13} rx={6} fill={fill} />
      <Rect x={16} y={-6} width={13} height={36} rx={6} fill={fill} />
      <Rect x={16} y={24} width={20} height={7} rx={3.5} fill={fill} />
      <G transform={`rotate(${lean})`}>
        <Path d="M-11 0 L-11 -18 Q-11 -34 2 -34 Q15 -34 15 -18 L15 0 Z" fill={fill} />
        <Circle cx={2} cy={-44} r={10} fill={fill} />
        <Circle cx={6} cy={-44} r={1.7} fill={face} />
        {children}
      </G>
    </G>
  );
}

/* a person sitting, seen from the front: x and y are the hips, the legs hang straight down */
function SitFront({ x, y, s = 1, fill, lean = 0, legs = 26 }: { x: number; y: number; s?: number; fill: string; lean?: number; legs?: number }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Rect x={-14} y={-2} width={11} height={legs} rx={5} fill={fill} />
      <Rect x={3} y={-2} width={11} height={legs} rx={5} fill={fill} />
      <Ellipse cx={-10} cy={legs + 1} rx={8} ry={3.4} fill={fill} />
      <Ellipse cx={10} cy={legs + 1} rx={8} ry={3.4} fill={fill} />
      <G transform={`rotate(${lean})`}>
        <Path d="M-17 2 L-17 -16 Q-17 -33 0 -33 Q17 -33 17 -16 L17 2 Z" fill={fill} />
        <Circle cx={0} cy={-45} r={11} fill={fill} />
        <Circle cx={3} cy={-45} r={1.8} fill={WHITE} />
      </G>
    </G>
  );
}

/* a lamp with its warm glow */
function Lamp({ x, y, h = 70 }: { x: number; y: number; h?: number }) {
  return (
    <G>
      <Circle cx={x} cy={y - h} r={34} fill={GOLD} opacity={0.18} />
      <Circle cx={x} cy={y - h} r={20} fill={GOLD} opacity={0.22} />
      <Rect x={x - 1.5} y={y - h} width={3} height={h} fill={BROWN} />
      <Ellipse cx={x} cy={y} rx={10} ry={3.4} fill={BROWN} />
      <Path d={`M${x - 14} ${y - h + 4} L${x - 8} ${y - h - 14} L${x + 8} ${y - h - 14} L${x + 14} ${y - h + 4} Z`} fill="#E0A33C" />
    </G>
  );
}

function Plant({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Ellipse cx={0} cy={-26} rx={5} ry={13} fill={GREEN} transform="rotate(-25 0 -14)" />
      <Ellipse cx={0} cy={-28} rx={5} ry={14} fill="#2F7A4B" />
      <Ellipse cx={0} cy={-26} rx={5} ry={13} fill={GREEN} transform="rotate(25 0 -14)" />
      <Path d="M-9 -13 L9 -13 L7 0 L-7 0 Z" fill={BRICK} />
    </G>
  );
}

/* ---------- lesson 47: telling a partner the truth ---------- */
function Weight({ k }: { k: Ink }) {
  return (
    <Frame label="A person on the edge of a sofa, bent under a heavy dark stone strapped to their back, while through a doorway their partner reads by a warm lamp, unaware">
      <Panel id="h3-weight" fill={CREAM}>
        <Rect x={10} y={140} width={280} height={22} fill={WOOD} />
        <Rect x={10} y={139} width={280} height={3} fill="#B08A57" />
        <Rect x={44} y={34} width={42} height={30} rx={3} fill="#FFF3DC" stroke={BROWN} strokeWidth={3} />
        <Path d="M48 60 L58 48 L66 56 L74 44 L82 60 Z" fill="#7FBF8E" />
        <Ellipse cx={82} cy={151} rx={66} ry={7} fill={BRICK} opacity={0.75} />
        <Rect x={20} y={74} width={18} height={66} rx={8} fill="#A84E32" />
        <Rect x={20} y={108} width={102} height={32} rx={8} fill="#C2603F" />
        <Rect x={22} y={106} width={98} height={8} rx={4} fill="#D2704E" />
        <Rect x={162} y={34} width={118} height={108} rx={4} fill="#FFEFC9" stroke={BROWN} strokeWidth={5} />
        <Rect x={167} y={132} width={108} height={8} fill="#E3B66F" />
        <Circle cx={258} cy={72} r={34} fill={GOLD} opacity={0.2} />
        <Circle cx={258} cy={72} r={20} fill={GOLD} opacity={0.25} />
        <Rect x={256.5} y={72} width={3} height={60} fill={BROWN} />
        <Ellipse cx={258} cy={132} rx={10} ry={3.4} fill={BROWN} />
        <Path d="M244 76 L250 58 L266 58 L272 76 Z" fill="#E0A33C" />
        <Rect x={228} y={86} width={14} height={54} rx={7} fill="#B8742C" />
        <Rect x={196} y={114} width={46} height={26} rx={8} fill="#E0A33C" />
        <Sitter x={224} y={114} s={0.85} fill={TEAL} dir={-1} lean={8}>
          <Path d="M4 -28 L-18 -18" stroke={TEAL} strokeWidth={6} strokeLinecap="round" />
          <Rect x={-30} y={-30} width={16} height={14} rx={2} fill="#FFF3DC" stroke={BEAR_LINE} strokeWidth={1.2} />
          <Line x1={-22} y1={-30} x2={-22} y2={-16} stroke={BEAR_LINE} strokeWidth={1} />
        </Sitter>
        <Plant x={182} y={140} s={0.8} />
        <Sitter x={102} y={109} fill={BLUE} lean={30}>
          <Path d="M-31 -34 Q-24 -54 -6 -50 Q10 -44 8 -22 Q5 -6 -16 -4 Q-36 -6 -31 -34 Z" fill={STONE} />
          <Path d="M-24 -42 Q-18 -50 -10 -46 Q-16 -40 -24 -42 Z" fill="#5A596E" />
          <Path d="M-6 -46 L11 -16 M-4 -10 L13 -30" stroke={ROPE} strokeWidth={3.6} strokeLinecap="round" />
        </Sitter>
      </Panel>
      <Cap k={k} s="Carrying it alone" />
    </Frame>
  );
}

function Mug({ x, y }: { x: number; y: number }) {
  return (
    <G transform={`translate(${x} ${y})`}>
      <Rect x={-6} y={-11} width={12} height={11} rx={2.5} fill={WHITE} stroke={BEAR_LINE} strokeWidth={1.2} />
      <Path d="M6 -8 Q11 -8 11 -5 Q11 -2 6 -2" stroke={BEAR_LINE} strokeWidth={1.4} fill="none" />
      <Path d="M-2 -15 Q-4 -19 -1 -22 M2 -15 Q0 -19 3 -22" stroke={WHITE} strokeWidth={1.6} strokeLinecap="round" fill="none" opacity={0.9} />
    </G>
  );
}

function Table({ k }: { k: Ink }) {
  return (
    <Frame label="Two people sitting across a small kitchen table with two mugs under a warm hanging lamp, one leaning in with open hands, the other sitting back, still">
      <Panel id="h3-table" fill="#F9E7C8">
        <Rect x={10} y={148} width={280} height={14} fill={WOOD} />
        <Rect x={28} y={30} width={44} height={42} rx={3} fill="#BFE0F2" stroke={BROWN} strokeWidth={4} />
        <Line x1={50} y1={30} x2={50} y2={72} stroke={BROWN} strokeWidth={2.5} />
        <Line x1={28} y1={51} x2={72} y2={51} stroke={BROWN} strokeWidth={2.5} />
        <Rect x={232} y={72} width={44} height={5} rx={2} fill={BROWN} />
        <Plant x={254} y={72} s={0.7} />
        <Path d="M132 52 L168 52 L196 148 L104 148 Z" fill={GOLD} opacity={0.16} />
        <Line x1={150} y1={10} x2={150} y2={32} stroke={BROWN} strokeWidth={2} />
        <Path d="M128 52 Q128 30 150 30 Q172 30 172 52 Z" fill="#E0A33C" />
        <Circle cx={150} cy={54} r={5} fill={GOLD} />
        <Rect x={55} y={80} width={8} height={68} rx={4} fill={BROWN} />
        <Rect x={237} y={80} width={8} height={68} rx={4} fill={BROWN} />
        <Sitter x={80} y={118} fill={ORANGE} lean={14}>
          <Path d="M4 -28 L44 -30" stroke={ORANGE} strokeWidth={6.5} strokeLinecap="round" />
          <Ellipse cx={48} cy={-31} rx={6.5} ry={3.6} fill={SKIN} />
          <Path d="M43 -34 L50 -37" stroke={SKIN} strokeWidth={2.4} strokeLinecap="round" />
        </Sitter>
        <Sitter x={220} y={118} fill={TEAL} dir={-1} lean={-4}>
          <Path d="M4 -28 L10 -10 L-6 -6" stroke={TEAL} strokeWidth={6.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <Circle cx={-7} cy={-6} r={3.6} fill={SKIN} />
        </Sitter>
        <Rect x={106} y={104} width={88} height={7} rx={3} fill={BROWN} />
        <Rect x={146} y={111} width={8} height={37} fill={BROWN} />
        <Rect x={132} y={146} width={36} height={4} rx={2} fill="#7A4B2A" />
        <Mug x={142} y={104} />
        <Mug x={160} y={104} />
      </Panel>
      <Cap k={k} s="It will hurt" />
    </Frame>
  );
}

function Doors({ k }: { k: Ink }) {
  const hue = ['#8A5A2B', '#9C6B3A', '#7A4B2A', '#A87642'];
  return (
    <Frame label="A person standing in a hallway facing a row of four closed doors, a small question mark floating above each one">
      <Panel id="h3-doors" fill={CREAM}>
        <Rect x={10} y={112} width={280} height={50} fill={WOOD} />
        <Rect x={10} y={110} width={280} height={4} fill="#B08A57" />
        <Path d="M118 114 L182 114 L216 160 L84 160 Z" fill={BRICK} opacity={0.9} />
        <Path d="M124 114 L176 114 L204 160 L96 160 Z" fill="none" stroke="#E9C9A0" strokeWidth={1.6} opacity={0.7} />
        {[20, 92, 164, 236].map((x, i) => (
          <G key={x}>
            <Rect x={x - 3} y={37} width={50} height={75} rx={3} fill="#E2CDA6" />
            <Rect x={x} y={40} width={44} height={72} rx={2} fill={hue[i]} />
            <Rect x={x + 7} y={48} width={30} height={24} rx={2} fill="none" stroke="#E9C9A0" strokeWidth={1.4} opacity={0.6} />
            <Rect x={x + 7} y={78} width={30} height={24} rx={2} fill="none" stroke="#E9C9A0" strokeWidth={1.4} opacity={0.6} />
            <Circle cx={x + 36} cy={78} r={2.8} fill={GOLD} />
            <Say x={x + 22} y={i % 2 ? 24 : 28} s="?" fill={BEAR_LINE} size={20} />
          </G>
        ))}
        <Person x={150} y={160} s={1.05} fill={BLUE} face={WHITE} />
      </Panel>
      <Cap k={k} s="What else do I not know?" />
    </Frame>
  );
}

function Wall({ k }: { k: Ink }) {
  return (
    <Frame label="A house drawn in cutaway with two rooms side by side, one person in each, and a tall dark wall splitting the house down the middle">
      <Panel id="h3-wall" fill="#CFE6F2">
        <Rect x={10} y={150} width={280} height={12} fill="#8FC49B" />
        <Rect x={214} y={22} width={14} height={34} fill={BROWN} />
        <Path d="M18 60 L150 12 L282 60 Z" fill={BRICK} />
        <Rect x={28} y={56} width={244} height={96} rx={3} fill="#D9A27E" />
        <Rect x={36} y={64} width={90} height={88} fill="#FBE3B8" />
        <Rect x={174} y={64} width={90} height={88} fill="#F6DCCB" />
        <Rect x={36} y={140} width={90} height={12} fill={WOOD} />
        <Rect x={174} y={140} width={90} height={12} fill={WOOD} />
        <Rect x={44} y={70} width={22} height={24} rx={2} fill="#BFE0F2" stroke={BROWN} strokeWidth={3} />
        <Line x1={55} y1={70} x2={55} y2={94} stroke={BROWN} strokeWidth={2} />
        <Rect x={240} y={76} width={22} height={28} rx={2} fill="#BFE0F2" stroke={BROWN} strokeWidth={3} />
        <Line x1={251} y1={76} x2={251} y2={104} stroke={BROWN} strokeWidth={2} />
        <Ellipse cx={78} cy={150} rx={34} ry={4} fill={BRICK} opacity={0.5} />
        <Ellipse cx={220} cy={150} rx={34} ry={4} fill={ORANGE} opacity={0.35} />
        <Lamp x={110} y={150} h={40} />
        <Plant x={188} y={150} s={0.85} />
        <Path d="M126 152 L126 21 L150 12 L174 21 L174 152 Z" fill={STONE} />
        <Rect x={130} y={26} width={9} height={126} fill="#55546A" />
        <Path
          d="M126 46 L174 46 M126 76 L174 76 M126 106 L174 106 M126 136 L174 136 M146 46 L146 76 M160 76 L160 106 M142 106 L142 136 M158 136 L158 152 M150 20 L150 46"
          stroke="#2A2933"
          strokeWidth={1.6}
        />
        <Person x={76} y={150} s={1.1} fill={BLUE} face={WHITE} />
        <Person x={220} y={150} s={1.1} fill={ORANGE} face={WHITE} />
      </Panel>
      <Cap k={k} s="A wall in the house" />
    </Frame>
  );
}

function Start({ k }: { k: Ink }) {
  return (
    <Frame label="Two people sitting side by side on a front step at dawn, a small gap between them, and a small green sapling growing in a pot at their feet">
      <Panel id="h3-start" fill="#FDE9C4">
        <Rect x={10} y={10} width={280} height={40} fill="#F2C9C2" />
        <Rect x={10} y={50} width={280} height={40} fill="#F9D9B8" />
        <Circle cx={240} cy={110} r={38} fill={GOLD} opacity={0.25} />
        <Circle cx={240} cy={110} r={24} fill={GOLD} />
        <Path d="M170 142 Q215 112 250 118 Q275 122 290 114 L290 142 Z" fill="#8FB78F" />
        <Rect x={10} y={142} width={280} height={20} fill="#9DBF8E" />
        <Rect x={10} y={34} width={190} height={92} fill="#E9C9A0" />
        <Rect x={6} y={26} width={198} height={10} rx={3} fill={BRICK} />
        <Rect x={26} y={62} width={32} height={64} rx={3} fill="#7A4B2A" />
        <Circle cx={51} cy={96} r={2.6} fill={GOLD} />
        <Rect x={114} y={50} width={26} height={30} rx={2} fill="#FFE29A" stroke={BROWN} strokeWidth={3} />
        <Line x1={127} y1={50} x2={127} y2={80} stroke={BROWN} strokeWidth={2} />
        <Rect x={36} y={124} width={158} height={18} fill="#D9A877" />
        <Rect x={36} y={124} width={158} height={5} fill={WOOD} />
        <Path d="M120 130 Q119 116 120 100" stroke={GREEN} strokeWidth={3} strokeLinecap="round" fill="none" />
        <Ellipse cx={111} cy={110} rx={8} ry={4} fill={GREEN} transform="rotate(-30 111 110)" />
        <Ellipse cx={130} cy={104} rx={8} ry={4} fill="#4FA36B" transform="rotate(30 130 104)" />
        <Ellipse cx={120} cy={97} rx={4} ry={6.5} fill="#4FA36B" />
        <Path d="M110 130 L130 130 L127 142 L113 142 Z" fill={BRICK} />
        <SitFront x={84} y={124} s={0.95} fill={BLUE} legs={18} />
        <SitFront x={156} y={124} s={0.95} fill={ORANGE} legs={18} />
      </Panel>
      <Cap k={k} s="A beginning" />
    </Frame>
  );
}

/* ---------- lesson 48: desire after quitting ---------- */
function Coated({ x, y, s = 1, dir = 1, skin }: { x: number; y: number; s?: number; dir?: 1 | -1; skin: string }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${dir * s} ${s})`} stroke={BEAR_LINE} strokeWidth={1.3}>
      <Path d="M-17 0 L-17 -16 Q-17 -33 0 -33 Q17 -33 17 -16 L17 0 Z" fill={WHITE} />
      <Circle cx={0} cy={-48} r={11} fill={skin} />
      <Circle cx={4} cy={-47} r={1.6} fill={BEAR_LINE} stroke="none" />
      <Path d="M-6 -33 L0 -19 L6 -33" fill="none" />
      <Path d="M8 -28 L12 -17" stroke={WHITE} strokeWidth={6} strokeLinecap="round" />
      <Rect x={7} y={-26} width={11} height={15} rx={1.6} fill="#E8DFC8" />
      <Rect x={10} y={-28} width={5} height={3} rx={1} fill="#8E96AB" />
    </G>
  );
}

function Clinic({ k }: { k: Ink }) {
  const rows = Array.from({ length: 10 }, (_, i) => 62 + i * 9);
  return (
    <Frame label="A brick building with a door, two windows and a small blank plaque, two people in white coats holding clipboards at its door, and the pale silver Gateway Arch of St. Louis rising behind">
      <Panel id="h3-clinic" fill="#BFD9EE">
        <Rect x={186} y={96} width={22} height={54} fill="#A9BFD6" />
        <Rect x={212} y={112} width={30} height={38} fill="#A9BFD6" />
        <Rect x={246} y={90} width={26} height={60} fill="#A9BFD6" />
        <Rect x={150} y={106} width={20} height={44} fill="#A9BFD6" />
        <Path d="M188 152 Q235 -66 282 152" stroke="#8FA3BE" strokeWidth={10} fill="none" />
        <Path d="M188 152 Q235 -66 282 152" stroke="#F1F4FA" strokeWidth={5} fill="none" />
        <Rect x={10} y={150} width={280} height={12} fill="#D9CDAF" />
        <Rect x={20} y={52} width={156} height={98} fill={BRICK} />
        {rows.map((y) => (
          <Line key={y} x1={20} y1={y} x2={176} y2={y} stroke="#8F3F2E" strokeWidth={1} opacity={0.55} />
        ))}
        <Rect x={14} y={44} width={168} height={10} rx={2} fill="#8A3F2E" />
        {[32, 138].map((x) => (
          <G key={x}>
            <Rect x={x} y={82} width={28} height={30} rx={2} fill="#9CC9E8" stroke="#E9DCC0" strokeWidth={3} />
            <Line x1={x + 14} y1={82} x2={x + 14} y2={112} stroke="#E9DCC0" strokeWidth={2} />
            <Line x1={x} y1={97} x2={x + 28} y2={97} stroke="#E9DCC0" strokeWidth={2} />
          </G>
        ))}
        <Rect x={82} y={86} width={32} height={64} rx={2} fill="#7A4B2A" />
        <Path d="M82 86 Q98 68 114 86 Z" fill="#9CC9E8" stroke="#E9DCC0" strokeWidth={3} />
        <Rect x={124} y={100} width={12} height={9} rx={1.5} fill="#F5EBD2" stroke="#E9DCC0" strokeWidth={1.2} />
        <Coated x={70} y={150} s={0.88} skin={SKIN} />
        <Coated x={108} y={150} s={0.88} dir={-1} skin={SKIN2} />
      </Panel>
      <Cap k={k} s="St. Louis, the 1960s" />
    </Frame>
  );
}

function Judge({ k }: { k: Ink }) {
  return (
    <Frame label="Two people sitting close together on a sofa, one leaning a head on the other's shoulder, while a pale see-through outline copy of one of them stands off to the side holding up a scorecard with a big question mark">
      <Panel id="h3-judge" fill="#FBEBD0">
        <Rect x={10} y={146} width={280} height={16} fill={WOOD} />
        <Rect x={10} y={145} width={280} height={3} fill="#B08A57" />
        <Lamp x={24} y={146} h={80} />
        <Ellipse cx={116} cy={154} rx={86} ry={5} fill={BRICK} opacity={0.55} />
        <Rect x={38} y={74} width={156} height={56} rx={16} fill="#A84E32" />
        <Rect x={30} y={94} width={22} height={54} rx={10} fill="#B5583A" />
        <Rect x={180} y={94} width={22} height={54} rx={10} fill="#B5583A" />
        <Rect x={46} y={122} width={140} height={24} rx={8} fill="#C2603F" />
        <SitFront x={98} y={124} s={1} fill={ORANGE} legs={24} />
        <SitFront x={136} y={124} s={1} fill={TEAL} lean={-17} legs={24} />
        <G stroke={ORANGE} strokeWidth={1.8} strokeDasharray="4 3" strokeLinecap="round">
          <Path d="M252 114 L250 70" fill="none" />
          <Person x={252} y={150} s={1.1} fill="none" />
        </G>
        <Rect x={226} y={32} width={48} height={38} rx={4} fill={WHITE} stroke={BEAR_LINE} strokeWidth={1.8} />
        <Say x={250} y={62} s="?" fill={BEAR_LINE} size={28} />
      </Panel>
      <Cap k={k} s="Watching from the side" />
    </Frame>
  );
}

function Gauge({ k }: { k: Ink }) {
  const pt = (deg: number, r: number) => {
    const a = (deg * Math.PI) / 180;
    return { x: 192 + r * Math.cos(a), y: 86 + r * Math.sin(a) };
  };
  const ticks = Array.from({ length: 11 }, (_, i) => {
    const deg = 135 + i * 27;
    const a = pt(deg, i % 5 === 0 ? 36 : 42);
    const b = pt(deg, 48);
    return <Line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={BEAR_LINE} strokeWidth={i % 5 === 0 ? 3 : 1.8} strokeLinecap="round" />;
  });
  const tip = pt(160, 40);
  return (
    <Frame label="A big round dial gauge with its needle low, and a person leaning in close to peer at it through a large magnifying glass">
      <Panel id="h3-gauge" fill="#FDF0DC">
        <Rect x={10} y={150} width={280} height={12} fill="#E9C9A0" />
        <Circle cx={192} cy={86} r={58} fill="#8E96AB" />
        <Circle cx={192} cy={86} r={50} fill="#FFF8EA" />
        {ticks}
        <Line x1={192} y1={86} x2={tip.x} y2={tip.y} stroke="#C2410C" strokeWidth={4} strokeLinecap="round" />
        <Circle cx={192} cy={86} r={6} fill={BEAR_LINE} />
        <G transform="rotate(12 84 158)">
          <Person x={84} y={158} s={1.2} fill={BLUE} face={WHITE} />
        </G>
        <Path d="M92 122 L106 132" stroke={BLUE} strokeWidth={7} strokeLinecap="round" />
        <Path d="M123 114 L102 136" stroke={BROWN} strokeWidth={7} strokeLinecap="round" />
        <Circle cx={140} cy={98} r={26} fill={WHITE} opacity={0.35} />
        <Circle cx={140} cy={98} r={26} fill="none" stroke={BEAR_LINE} strokeWidth={5} />
        <Path d="M126 88 Q130 80 138 78" stroke={WHITE} strokeWidth={3} strokeLinecap="round" fill="none" />
      </Panel>
      <Cap k={k} s="The more you check" />
    </Frame>
  );
}

function Hand({ skin, edge, sleeve, cuff }: { skin: string; edge: string; sleeve: string; cuff: string }) {
  return (
    <G>
      <Rect x={-10} y={62} width={68} height={26} rx={8} fill={sleeve} />
      <Rect x={54} y={60} width={8} height={30} rx={3} fill={cuff} />
      <G transform="rotate(6 60 75)">
        <Rect x={62} y={66} width={78} height={18} rx={9} fill={skin} />
        <Path d="M112 72 L136 72 M112 78 L136 78" stroke={edge} strokeWidth={1.4} strokeLinecap="round" />
        <Rect x={72} y={80} width={24} height={8} rx={4} fill={skin} stroke={edge} strokeWidth={1} />
      </G>
    </G>
  );
}

function Hands({ k }: { k: Ink }) {
  return (
    <Frame label="Two hands reaching gently toward each other from either side, almost touching, with a soft warm glow between them, and below them a scorecard lying on the ground with a big cross through it">
      <Panel id="h3-hands" fill="#FDF0DC">
        <Rect x={10} y={126} width={280} height={36} fill="#E9C9A0" />
        <Circle cx={150} cy={80} r={17} fill={GOLD} opacity={0.2} />
        <Circle cx={150} cy={80} r={10} fill={GOLD} opacity={0.55} />
        <Path d="M150 54 L150 62 M136 58 L140 64 M164 58 L160 64" stroke="#E0A33C" strokeWidth={2.6} strokeLinecap="round" />
        <Hand skin={SKIN} edge="#C99772" sleeve={BLUE} cuff="#3E5A8C" />
        <G transform="translate(300 0) scale(-1 1)">
          <Hand skin={SKIN2} edge="#7E4F2D" sleeve={ORANGE} cuff="#B04C1C" />
        </G>
        <Path d="M116 130 L184 130 L198 156 L102 156 Z" fill="#FFFBF0" stroke={BEAR_LINE} strokeWidth={1.6} strokeLinejoin="round" />
        <Path d="M124 138 L176 138 M121 144 L179 144 M118 150 L182 150" stroke="#CFC2A2" strokeWidth={2} strokeLinecap="round" />
        <Path d="M118 130 L198 156 M184 130 L102 156" stroke="#C2410C" strokeWidth={5} strokeLinecap="round" />
      </Panel>
      <Cap k={k} s="Nothing to pass" />
    </Frame>
  );
}

function Quiet({ k }: { k: Ink }) {
  const drop = (x: number, y: number) => (
    <Path key={`${x}${y}`} d={`M${x} ${y - 7} Q${x + 6} ${y + 2} ${x} ${y + 6} Q${x - 6} ${y + 2} ${x} ${y - 7} Z`} fill="#6FA8DC" />
  );
  return (
    <Frame label="A cutaway of soil under a calm sky: a seed resting in the soil with a tiny pale sprout, a few drops of rain falling, and a small curled leaf resting at the surface">
      <Panel id="h3-quiet" fill="#D8E6F4">
        <Ellipse cx={92} cy={34} rx={30} ry={11} fill={WHITE} opacity={0.95} />
        <Ellipse cx={74} cy={38} rx={20} ry={9} fill={WHITE} opacity={0.95} />
        <Ellipse cx={112} cy={39} rx={20} ry={8} fill={WHITE} opacity={0.95} />
        {[drop(76, 58), drop(96, 66), drop(112, 54), drop(88, 76)]}
        <Rect x={10} y={84} width={280} height={78} fill={BROWN} />
        <Path d="M10 118 Q80 108 150 120 Q220 132 290 118 L290 162 L10 162 Z" fill="#7A4B2A" />
        <Rect x={10} y={80} width={280} height={8} fill="#7FBF8E" />
        <Circle cx={50} cy={134} r={4} fill="#B8864A" />
        <Circle cx={236} cy={140} r={5} fill="#B8864A" />
        <Circle cx={196} cy={112} r={3} fill="#B8864A" />
        <Circle cx={100} cy={148} r={3.4} fill="#B8864A" />
        {[
          [136, 100],
          [166, 106],
          [128, 124],
          [172, 126],
        ].map(([x, y]) => (
          <Circle key={`${x}${y}`} cx={x} cy={y} r={2.6} fill="#6FA8DC" opacity={0.6} />
        ))}
        <Ellipse cx={150} cy={118} rx={14} ry={9.5} fill="#D9A86B" stroke="#6B3F1E" strokeWidth={1.8} transform="rotate(-20 150 118)" />
        <Path d="M144 114 Q152 112 156 108" stroke="#E9C28A" strokeWidth={2} strokeLinecap="round" fill="none" />
        <Path d="M152 110 Q154 102 150 96" stroke="#CFE8B8" strokeWidth={3.4} strokeLinecap="round" fill="none" />
        <Ellipse cx={144} cy={96} rx={6} ry={3} fill="#CFE8B8" transform="rotate(-30 144 96)" />
        <Ellipse cx={156} cy={93} rx={6} ry={3} fill="#CFE8B8" transform="rotate(30 156 93)" />
        <Path d="M214 82 Q215 74 220 71" stroke="#6FB07F" strokeWidth={3} strokeLinecap="round" fill="none" />
        <Path
          d="M220 71 Q232 68 231 77 Q229 84 222 80 Q226 78 225 75"
          fill="none"
          stroke="#6FB07F"
          strokeWidth={3.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path d="M213 80 Q204 76 202 82 Q205 86 212 83" fill="#9FD3A8" />
      </Panel>
      <Cap k={k} s="Resting, not broken" />
    </Frame>
  );
}

function Together({ k }: { k: Ink }) {
  return (
    <Frame label="Two people walking side by side on a path through a park, close, one with an arm around the other's shoulders, under a warm sun and beside a tree">
      <Panel id="h3-together" fill="#DDEFF7">
        <Circle cx={58} cy={44} r={30} fill={GOLD} opacity={0.22} />
        <Circle cx={58} cy={44} r={18} fill={GOLD} />
        <Path d="M58 16 L58 22 M30 44 L36 44 M80 44 L86 44 M38 24 L42 28 M78 24 L74 28" stroke="#E0A33C" strokeWidth={2.6} strokeLinecap="round" />
        <Path d="M10 118 Q90 92 160 112 Q230 90 290 108 L290 162 L10 162 Z" fill="#A7D3A0" />
        <Path d="M10 140 Q150 124 290 140 L290 162 L10 162 Z" fill="#7FBF8E" />
        <Path d="M10 148 Q150 134 290 148 L290 162 L10 162 Z" fill="#E9D4A8" />
        <Rect x={242} y={92} width={8} height={56} fill={BROWN} />
        <Circle cx={246} cy={78} r={24} fill="#4FA36B" />
        <Circle cx={230} cy={90} r={16} fill={GREEN} />
        <Circle cx={262} cy={90} r={15} fill="#4FA36B" />
        <Circle cx={40} cy={132} r={2.4} fill="#F7C6D0" />
        <Circle cx={60} cy={138} r={2.4} fill={GOLD} />
        <Circle cx={190} cy={134} r={2.4} fill="#F7C6D0" />
        <Ellipse cx={142} cy={156} rx={44} ry={3.6} fill="#B8A173" opacity={0.5} />
        <Person x={126} y={154} s={1.15} fill={ORANGE} face={WHITE} />
        <Path d="M134 112 L172 114" stroke={ORANGE} strokeWidth={6.5} strokeLinecap="round" />
        <Person x={160} y={154} s={1.15} fill={TEAL} face={WHITE} />
      </Panel>
      <Cap k={k} s="Attention on them" />
    </Frame>
  );
}

export const SCENES_H3: Record<string, ComponentType<{ k: Ink }>> = {
  'l47-weight': Weight,
  'l47-table': Table,
  'l47-doors': Doors,
  'l47-wall': Wall,
  'l47-start': Start,
  'l48-clinic': Clinic,
  'l48-judge': Judge,
  'l48-gauge': Gauge,
  'l48-hands': Hands,
  'l48-quiet': Quiet,
  'l48-together': Together,
};
