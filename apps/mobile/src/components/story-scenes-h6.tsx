/* Scenes for lessons told as a story (see story-kit.tsx and story-scenes-h.tsx): lesson 57 (Bill Wilson in Akron, 1935: one person at the
   other end of the line). Every person is a simple, fully clothed figure, and the 1930s are drawn warm: hats, coats, wood and brass. */
import { type ComponentType, type ReactNode } from 'react';
import { ClipPath, Circle, Defs, Ellipse, G, Line, Path, Rect } from 'react-native-svg';

import { BEAR_LINE, Frame, type Ink, Person, Say } from './story-kit';

const BROWN = '#8A5A2B';
const DARKWOOD = '#6B4226';
const MIDWOOD = '#9B6A3C';
const GOLD = '#FFD25A';
const BRASS = '#C99A3A';
const WHITE = '#FFFFFF';
const GREEN = '#3F8F5B';
const DKGREEN = '#2F7A4B';
const SKIN = '#E8B98F';
const BLUE = '#4F6FA8';
const ORANGE = '#D9602A';
const TEAL = '#3F8F8A';
const BRICK = '#B5533C';
const WOOD = '#C9965B';
const CREAM = '#F6E3C6';
const WALL = '#E6C99A';
const COAT = '#4B5A78';
const COAT_DK = '#3C4863';
const HAT = '#3A3340';
const BLACK = '#2B2530';
const PAPER = '#FFF6DE';
const AMBER = '#E0A33C';

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

/* a man of 1935 in a hat and a long coat, standing: x and y are his feet, dir 1 faces right and -1 faces left */
function Man({ x, y, s = 1, dir = 1, coat = COAT, children }: { x: number; y: number; s?: number; dir?: 1 | -1; coat?: string; children?: ReactNode }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${dir * s} ${s})`}>
      <Ellipse cx={-6} cy={-1} rx={6} ry={2.6} fill={BLACK} />
      <Ellipse cx={7} cy={-1} rx={6} ry={2.6} fill={BLACK} />
      <Path d="M-15 -3 L-13 -32 Q-13 -42 0 -42 Q13 -42 13 -32 L15 -3 Z" fill={coat} />
      <Path d="M-4 -42 L0 -30 L4 -42" fill="none" stroke={CREAM} strokeWidth={1.6} strokeLinejoin="round" opacity={0.7} />
      <Circle cx={0} cy={-51} r={9} fill={coat} />
      <Circle cx={4} cy={-50} r={1.6} fill={WHITE} />
      <Path d="M-8.5 -58 Q-8.5 -70 0 -70 Q8.5 -70 8.5 -58 Z" fill={HAT} />
      <Rect x={-8.5} y={-62} width={17} height={3} fill={BRICK} />
      <Ellipse cx={0} cy={-58} rx={15} ry={3.4} fill={HAT} />
      {children}
    </G>
  );
}

/* a floor of cream and brown tiles, from y to the bottom of the panel */
function Tiles({ y }: { y: number }) {
  const rows = [0, 1];
  const cols = Array.from({ length: 12 }, (_, i) => i);
  return (
    <G>
      <Rect x={10} y={y} width={280} height={162 - y} fill="#EAD9B8" />
      {rows.map((r) =>
        cols.map((c) =>
          (c + r) % 2 === 0 ? (
            <Rect key={`${r}-${c}`} x={10 + c * 28 - (r ? 14 : 0)} y={y + r * 17} width={28} height={17} fill="#B58B5A" opacity={0.55} />
          ) : null,
        ),
      )}
      <Rect x={10} y={y} width={280} height={2.5} fill={DARKWOOD} opacity={0.5} />
    </G>
  );
}

/* a pendant lamp with a warm glow */
function Pendant({ x, drop = 26 }: { x: number; drop?: number }) {
  return (
    <G>
      <Path d={`M${x - 14} 160 L${x - 38} ${drop + 12} L${x + 38} ${drop + 12} L${x + 14} 160 Z`} fill={GOLD} opacity={0.1} />
      <Line x1={x} y1={10} x2={x} y2={drop} stroke={DARKWOOD} strokeWidth={2} />
      <Path d={`M${x - 14} ${drop + 12} Q${x - 14} ${drop} ${x} ${drop} Q${x + 14} ${drop} ${x + 14} ${drop + 12} Z`} fill={AMBER} />
      <Circle cx={x} cy={drop + 14} r={5} fill={GOLD} />
    </G>
  );
}

/* a potted palm */
function Palm({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      {[-58, -30, 0, 30, 58].map((a, i) => (
        <Ellipse key={a} cx={0} cy={-26} rx={5.5} ry={24} fill={i % 2 ? DKGREEN : GREEN} transform={`rotate(${a} 0 0)`} />
      ))}
      <Path d="M-11 -14 L11 -14 L8 0 L-8 0 Z" fill={BRASS} />
      <Rect x={-12} y={-16} width={24} height={4} rx={2} fill="#E3B957" />
    </G>
  );
}

/* a sitter, seen from the side: x and y are the hips, dir 1 faces right and -1 faces left, lean tips the body forward */
function Sitter({
  x,
  y,
  s = 1,
  fill,
  dir = 1,
  lean = 0,
  children,
}: {
  x: number;
  y: number;
  s?: number;
  fill: string;
  dir?: 1 | -1;
  lean?: number;
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
        <Circle cx={6} cy={-44} r={1.7} fill={WHITE} />
        {children}
      </G>
    </G>
  );
}

/* a person sitting, seen from the front: x and y are the hips */
function SitFront({ x, y, s = 1, fill }: { x: number; y: number; s?: number; fill: string }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Rect x={-14} y={-2} width={11} height={26} rx={5} fill={fill} />
      <Rect x={3} y={-2} width={11} height={26} rx={5} fill={fill} />
      <Ellipse cx={-10} cy={27} rx={8} ry={3.4} fill={fill} />
      <Ellipse cx={10} cy={27} rx={8} ry={3.4} fill={fill} />
      <Path d="M-17 2 L-17 -16 Q-17 -33 0 -33 Q17 -33 17 -16 L17 2 Z" fill={fill} />
      <Circle cx={0} cy={-45} r={11} fill={fill} />
      <Circle cx={3} cy={-45} r={1.8} fill={WHITE} />
    </G>
  );
}

/* a wooden chair seen from the front, behind the person on it */
function ChairFront({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`} stroke={DARKWOOD} strokeWidth={1}>
      <Rect x={-20} y={-44} width={4} height={72} rx={2} fill={WOOD} />
      <Rect x={16} y={-44} width={4} height={72} rx={2} fill={WOOD} />
      <Rect x={-20} y={-40} width={40} height={5} rx={2} fill={WOOD} />
      <Rect x={-19} y={-4} width={38} height={6} rx={2} fill={MIDWOOD} />
    </G>
  );
}

/* ---------- lesson 57: Bill Wilson, Akron, 1935 ---------- */
function Lobby({ k }: { k: Ink }) {
  return (
    <Frame label="A warm 1930s hotel lobby with a patterned floor, a potted palm and a reception desk with a small bell, and in the middle a lone man in a hat and a long coat holding a suitcase">
      <Panel id="h6-lobby" fill={WALL}>
        <Rect x={10} y={100} width={280} height={30} fill={MIDWOOD} opacity={0.55} />
        <Rect x={10} y={99} width={280} height={3} fill={DARKWOOD} opacity={0.6} />
        <Tiles y={128} />
        <Pendant x={150} drop={24} />
        <Rect x={212} y={42} width={64} height={42} rx={3} fill={DARKWOOD} />
        {[0, 1, 2].map((r) =>
          [0, 1, 2, 3, 4, 5].map((c) => <Rect key={`${r}-${c}`} x={216 + c * 10} y={46 + r * 12} width={7} height={9} rx={1} fill="#3F2A18" />),
        )}
        <Circle cx={235} cy={63} r={1.6} fill={GOLD} />
        <Circle cx={255} cy={51} r={1.6} fill={GOLD} />
        <Circle cx={225} cy={75} r={1.6} fill={GOLD} />
        <Rect x={196} y={104} width={82} height={46} fill={DARKWOOD} />
        <Rect x={202} y={112} width={32} height={30} rx={2} fill={MIDWOOD} opacity={0.6} />
        <Rect x={240} y={112} width={32} height={30} rx={2} fill={MIDWOOD} opacity={0.6} />
        <Rect x={192} y={98} width={90} height={7} rx={2} fill={MIDWOOD} />
        <Path d="M217 98 Q217 90 223 90 Q229 90 229 98 Z" fill={GOLD} />
        <Circle cx={223} cy={88} r={1.8} fill={BRASS} />
        <Palm x={44} y={150} s={1.25} />
        <Ellipse cx={128} cy={152} rx={30} ry={3.4} fill={DARKWOOD} opacity={0.22} />
        <Man x={128} y={150} s={1.2}>
          <Path d="M12 -36 L17 -18" stroke={COAT_DK} strokeWidth={6} strokeLinecap="round" />
          <Circle cx={17.5} cy={-17} r={3} fill={SKIN} />
          <Rect x={6} y={-14} width={24} height={14} rx={2.5} fill={BROWN} stroke={DARKWOOD} strokeWidth={1.2} />
          <Path d="M13 -14 Q18 -21 23 -14" fill="none" stroke={DARKWOOD} strokeWidth={1.6} />
          <Rect x={16} y={-9} width={4} height={3.4} rx={1} fill={GOLD} />
        </Man>
      </Panel>
      <Cap k={k} s="Akron, 1935" />
    </Frame>
  );
}

function TwoEnds({ k }: { k: Ink }) {
  const bottles = Array.from({ length: 9 }, (_, i) => i);
  const rows = Array.from({ length: 6 }, (_, i) => i);
  const prints = Array.from({ length: 7 }, (_, i) => i);
  return (
    <Frame label="A wide hotel lobby: at the far left end a softly glowing bar with stools and a row of bottles in the distance, at the far right end a wall board listing the town's churches and a telephone, and a man in the middle facing the telephone with faint footprints behind him showing he paced back and forth">
      <Panel id="h6-two" fill={WALL}>
        <Rect x={10} y={100} width={280} height={30} fill={MIDWOOD} opacity={0.55} />
        <Rect x={10} y={99} width={280} height={3} fill={DARKWOOD} opacity={0.6} />
        <Tiles y={128} />
        <Circle cx={46} cy={86} r={56} fill={ORANGE} opacity={0.14} />
        <Circle cx={46} cy={86} r={36} fill={GOLD} opacity={0.22} />
        <Rect x={16} y={72} width={60} height={3} rx={1.5} fill={DARKWOOD} />
        {bottles.map((i) => (
          <Rect key={i} x={19 + i * 6.3} y={62} width={3.2} height={10} rx={1.2} fill={i % 2 ? '#9A5B2E' : AMBER} opacity={0.85} />
        ))}
        <Rect x={12} y={106} width={70} height={8} rx={2} fill={MIDWOOD} />
        <Rect x={14} y={114} width={66} height={26} fill={DARKWOOD} />
        {[28, 48, 68].map((sx) => (
          <G key={sx}>
            <Rect x={sx - 1.2} y={140} width={2.4} height={11} fill={BROWN} />
            <Ellipse cx={sx} cy={140} rx={7} ry={2.6} fill={BRICK} />
            <Ellipse cx={sx} cy={151} rx={5} ry={1.6} fill={BROWN} />
          </G>
        ))}
        <Circle cx={236} cy={66} r={50} fill={GOLD} opacity={0.14} />
        <Rect x={206} y={26} width={60} height={62} rx={3} fill="#2F5D46" stroke={DARKWOOD} strokeWidth={4} />
        <Rect x={218} y={32} width={36} height={4} rx={2} fill={CREAM} opacity={0.95} />
        {rows.map((i) => (
          <G key={i}>
            <Rect x={214} y={43 + i * 7.5} width={16 + (i % 3) * 5} height={3} rx={1.5} fill={CREAM} opacity={0.8} />
            <Rect x={242} y={43 + i * 7.5} width={14} height={3} rx={1.5} fill={CREAM} opacity={0.55} />
          </G>
        ))}
        <Rect x={222} y={98} width={26} height={34} rx={3} fill={DARKWOOD} stroke="#3F2A18" strokeWidth={1.2} />
        <Circle cx={230} cy={102} r={4} fill={BRASS} />
        <Circle cx={241} cy={102} r={4} fill={BRASS} />
        <Rect x={233} y={112} width={3} height={8} fill={BLACK} />
        <Ellipse cx={234.5} cy={121} rx={5} ry={2.2} fill={BLACK} />
        <Rect x={215} y={106} width={5} height={17} rx={2.5} fill={BLACK} />
        <Line x1={220} y1={110} x2={222} y2={110} stroke={BRASS} strokeWidth={1.6} />
        <Circle cx={251} cy={118} r={2.6} fill={BRASS} />
        {prints.map((i) => (
          <G key={i}>
            <Ellipse cx={100 + i * 13.5} cy={154} rx={3.6} ry={1.5} fill={DARKWOOD} opacity={0.24} />
            <Ellipse cx={197 - i * 14} cy={159} rx={3.6} ry={1.5} fill={DARKWOOD} opacity={0.2} />
          </G>
        ))}
        <Ellipse cx={150} cy={152} rx={22} ry={3} fill={DARKWOOD} opacity={0.22} />
        <Man x={150} y={150} s={1.05} />
      </Panel>
      <Cap k={k} s="The bar, or the phone" />
    </Frame>
  );
}

function Phone({ k }: { k: Ink }) {
  const names = [0, 1, 2, 3, 4, 5];
  return (
    <Frame label="A man in a hat holding a 1930s telephone receiver to his ear, and pinned to the wall beside the phone a sheet with a list of names, several crossed out and one circled">
      <Panel id="h6-phone" fill="#E3C9A0">
        <Circle cx={236} cy={80} r={64} fill={GOLD} opacity={0.14} />
        <Rect x={10} y={134} width={280} height={28} fill={DARKWOOD} />
        <Rect x={10} y={134} width={280} height={6} fill={MIDWOOD} />
        <G transform="translate(239 74) rotate(-2)">
          <Rect x={-34} y={-52} width={68} height={104} rx={3} fill={PAPER} stroke={BROWN} strokeWidth={1.4} />
          <Rect x={-14} y={-44} width={28} height={4} rx={2} fill={BEAR_LINE} opacity={0.6} />
          {names.map((i) => (
            <G key={i}>
              <Rect x={-24} y={-30 + i * 14} width={34 + (i % 3) * 6} height={4} rx={2} fill={BEAR_LINE} opacity={0.55} />
              {i < 4 ? <Line x1={-27} y1={-28 + i * 14} x2={22} y2={-28 + i * 14} stroke={BRICK} strokeWidth={2.2} strokeLinecap="round" /> : null}
            </G>
          ))}
          <Ellipse cx={-2} cy={-28 + 4 * 14} rx={32} ry={9} fill="none" stroke={GREEN} strokeWidth={2.6} />
          <Circle cx={0} cy={-52} r={4} fill={BRICK} />
        </G>
        <Path d="M104 104 C128 120 136 116 156 124" fill="none" stroke={BLACK} strokeWidth={2.4} strokeLinecap="round" />
        <Path d="M146 134 L152 118 Q168 112 184 118 L190 134 Z" fill={BLACK} />
        <Circle cx={168} cy={126} r={5.5} fill={BRASS} />
        <Path d="M154 114 Q168 100 182 114" fill="none" stroke={BRASS} strokeWidth={3} strokeLinecap="round" />
        <Man x={74} y={181} s={2.1} />
        <Path d="M98 102 L122 132 L108 90" fill="none" stroke={COAT_DK} strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M100 66 Q110 74 104 100" fill="none" stroke={BLACK} strokeWidth={6.5} strokeLinecap="round" />
        <Circle cx={100} cy={64} r={6.5} fill={BLACK} />
        <Circle cx={104} cy={102} r={6} fill={BLACK} />
        <Circle cx={108} cy={84} r={5.6} fill={SKIN} />
      </Panel>
      <Cap k={k} s="One person said yes" />
    </Frame>
  );
}

function Armchair({ x, y, dir }: { x: number; y: number; dir: 1 | -1 }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${dir} 1)`}>
      <Rect x={-26} y={-58} width={18} height={80} rx={9} fill="#8C3B2A" />
      <Rect x={-26} y={-2} width={64} height={24} rx={9} fill="#A4492F" />
      <Rect x={-4} y={-8} width={40} height={10} rx={5} fill="#C2603F" />
      <Rect x={-24} y={20} width={6} height={10} rx={2} fill={DARKWOOD} />
      <Rect x={30} y={20} width={6} height={10} rx={2} fill={DARKWOOD} />
    </G>
  );
}

function Talk({ k }: { k: Ink }) {
  return (
    <Frame label="A cozy small room: two men in armchairs facing each other, talking, with a lamp, a teapot and cups on a small table between them and a window showing a tree">
      <Panel id="h6-talk" fill="#F4DDB8">
        <Rect x={10} y={146} width={280} height={16} fill={WOOD} />
        <Rect x={10} y={145} width={280} height={3} fill={MIDWOOD} />
        <Ellipse cx={150} cy={154} rx={96} ry={7} fill={BRICK} opacity={0.5} />
        <Rect x={118} y={20} width={64} height={48} rx={3} fill="#BFE0F2" stroke={BROWN} strokeWidth={4} />
        <Rect x={147} y={44} width={6} height={22} fill={BROWN} />
        <Circle cx={150} cy={40} r={14} fill={GREEN} />
        <Circle cx={139} cy={48} r={9} fill={DKGREEN} />
        <Circle cx={162} cy={47} r={9} fill={DKGREEN} />
        <Line x1={150} y1={20} x2={150} y2={68} stroke={BROWN} strokeWidth={2.2} />
        <Rect x={108} y={16} width={12} height={58} rx={5} fill={BRICK} />
        <Rect x={180} y={16} width={12} height={58} rx={5} fill={BRICK} />
        <Circle cx={26} cy={76} r={34} fill={GOLD} opacity={0.18} />
        <Circle cx={26} cy={76} r={20} fill={GOLD} opacity={0.22} />
        <Rect x={24.5} y={78} width={3} height={70} fill={BROWN} />
        <Ellipse cx={26} cy={148} rx={10} ry={3.4} fill={BROWN} />
        <Path d="M12 82 L18 64 L34 64 L40 82 Z" fill={AMBER} />
        <Armchair x={70} y={118} dir={1} />
        <Armchair x={230} y={118} dir={-1} />
        <Sitter x={72} y={118} fill={BLUE} lean={8}>
          <Path d="M4 -28 L34 -34" stroke={BLUE} strokeWidth={6.5} strokeLinecap="round" />
          <Circle cx={37} cy={-35} r={4.2} fill={SKIN} />
          <Path d="M39 -39 L42 -44 M41 -36 L46 -39 M40 -33 L46 -33" stroke={SKIN} strokeWidth={1.8} strokeLinecap="round" />
        </Sitter>
        <Sitter x={228} y={118} fill={TEAL} dir={-1} lean={-4}>
          <Path d="M4 -28 L10 -10 L-6 -6" stroke={TEAL} strokeWidth={6.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <Circle cx={-7} cy={-6} r={3.6} fill={SKIN} />
        </Sitter>
        <Rect x={126} y={112} width={48} height={6} rx={3} fill={BROWN} />
        <Rect x={147} y={118} width={6} height={30} fill={BROWN} />
        <Rect x={136} y={146} width={28} height={3} rx={1.5} fill={DARKWOOD} />
        <Ellipse cx={142} cy={106} rx={8} ry={6.4} fill={WHITE} stroke={BEAR_LINE} strokeWidth={1.2} />
        <Path d="M149 104 L156 100" stroke={BEAR_LINE} strokeWidth={2} strokeLinecap="round" />
        <Path d="M134 103 Q127 103 128 108" fill="none" stroke={BEAR_LINE} strokeWidth={1.4} />
        <Rect x={140} y={98} width={4} height={3} rx={1.5} fill={BEAR_LINE} />
        <Rect x={160} y={106} width={9} height={6} rx={2} fill={WHITE} stroke={BEAR_LINE} strokeWidth={1.2} />
        <Rect x={169} y={107} width={2.5} height={3.4} rx={1.2} fill="none" stroke={BEAR_LINE} strokeWidth={1} />
      </Panel>
      <Cap k={k} s="About six hours" />
    </Frame>
  );
}

function Meeting({ k }: { k: Ink }) {
  return (
    <Frame label="A circle of wooden chairs with several different people sitting in it, one speaking with an open hand, and a coffee urn on a side table">
      <Panel id="h6-meeting" fill={WALL}>
        <Rect x={10} y={112} width={280} height={50} fill={WOOD} />
        <Rect x={10} y={111} width={280} height={3} fill={DARKWOOD} opacity={0.5} />
        <Ellipse cx={150} cy={140} rx={104} ry={20} fill={BRICK} opacity={0.4} />
        <Pendant x={150} drop={22} />
        <Rect x={44} y={30} width={40} height={32} rx={3} fill="#BFE0F2" stroke={BROWN} strokeWidth={3} />
        <Line x1={64} y1={30} x2={64} y2={62} stroke={BROWN} strokeWidth={2} />
        <Rect x={238} y={106} width={44} height={5} rx={2} fill={MIDWOOD} />
        <Rect x={242} y={111} width={4} height={34} fill={BROWN} />
        <Rect x={274} y={111} width={4} height={34} fill={BROWN} />
        <Rect x={252} y={80} width={20} height={26} rx={5} fill="#C5C7D4" stroke={BEAR_LINE} strokeWidth={1.2} />
        <Path d="M252 82 Q262 70 272 82 Z" fill="#9EA1B4" stroke={BEAR_LINE} strokeWidth={1.2} />
        <Circle cx={262} cy={72} r={2} fill={BRASS} />
        <Rect x={248} y={95} width={5} height={3} rx={1} fill={BRASS} />
        <Rect x={240} y={100} width={7} height={6} rx={1.6} fill={WHITE} stroke={BEAR_LINE} strokeWidth={1} />
        <Path d="M259 76 Q257 70 260 66 M265 76 Q263 70 266 66" fill="none" stroke={WHITE} strokeWidth={1.4} strokeLinecap="round" opacity={0.8} />
        <ChairFront x={98} y={112} s={0.9} />
        <ChairFront x={148} y={108} s={0.9} />
        <ChairFront x={198} y={112} s={0.9} />
        <SitFront x={98} y={112} s={0.9} fill={TEAL} />
        <SitFront x={148} y={108} s={0.9} fill={ORANGE} />
        <SitFront x={198} y={112} s={0.9} fill={BLUE} />
        <Path d="M148 85 Q170 82 182 92" fill="none" stroke={ORANGE} strokeWidth={6} strokeLinecap="round" />
        <Circle cx={186} cy={93} r={4.4} fill={SKIN} />
        <Path d="M189 90 L192 85 M190 94 L195 92 M188 97 L192 99" stroke={SKIN} strokeWidth={1.8} strokeLinecap="round" />
        <G transform="translate(36 126)">
          <Rect x={-18} y={-50} width={5} height={52} rx={2.5} fill={WOOD} stroke={DARKWOOD} strokeWidth={1} />
          <Rect x={-16} y={1} width={40} height={5} rx={2} fill={MIDWOOD} stroke={DARKWOOD} strokeWidth={1} />
          <Rect x={-14} y={6} width={3.5} height={24} fill={DARKWOOD} />
          <Rect x={18} y={6} width={3.5} height={24} fill={DARKWOOD} />
        </G>
        <Sitter x={36} y={126} fill={DKGREEN} lean={4}>
          <Path d="M-9 -44 Q2 -58 13 -44 Z" fill={HAT} />
        </Sitter>
        <G transform="translate(230 126) scale(-1 1)">
          <Rect x={-18} y={-50} width={5} height={52} rx={2.5} fill={WOOD} stroke={DARKWOOD} strokeWidth={1} />
          <Rect x={-16} y={1} width={40} height={5} rx={2} fill={MIDWOOD} stroke={DARKWOOD} strokeWidth={1} />
          <Rect x={-14} y={6} width={3.5} height={24} fill={DARKWOOD} />
          <Rect x={18} y={6} width={3.5} height={24} fill={DARKWOOD} />
        </G>
        <Sitter x={230} y={126} fill={BRICK} dir={-1} lean={6} s={0.94}>
          <Path d="M-8 -50 Q2 -62 12 -50 Q8 -48 2 -48 Q-4 -48 -8 -50 Z" fill={HAT} />
        </Sitter>
      </Panel>
      <Cap k={k} s="Each other" />
    </Frame>
  );
}

function Heart({ x, y, s = 1, fill }: { x: number; y: number; s?: number; fill: string }) {
  return <Path transform={`translate(${x} ${y}) scale(${s})`} d="M0 6 C-12 -3 -8 -12 0 -6 C8 -12 12 -3 0 6 Z" fill={fill} />;
}

function Circle57({ k }: { k: Ink }) {
  return (
    <Frame label="A person standing in the middle with a ring of a few people around them, and one of those people, drawn in the accent color, with a small heart above them and a dotted line of care reaching to the person in the middle">
      <Panel id="h6-circle" fill={CREAM}>
        <Ellipse cx={150} cy={138} rx={122} ry={30} fill="#E3C28F" />
        <Ellipse cx={150} cy={138} rx={108} ry={24} fill="none" stroke={WOOD} strokeWidth={1.6} strokeDasharray="3 5" />
        <Circle cx={150} cy={96} r={46} fill={GOLD} opacity={0.2} />
        <Circle cx={150} cy={96} r={28} fill={GOLD} opacity={0.22} />
        <Person x={96} y={116} s={0.62} fill={TEAL} face={WHITE} />
        <Person x={204} y={116} s={0.62} fill={BLUE} face={WHITE} />
        <Person x={150} y={112} s={0.58} fill={DKGREEN} face={WHITE} />
        <Person x={256} y={138} s={0.84} fill={BRICK} face={WHITE} />
        <Person x={44} y={138} s={0.84} fill={k.acc} face={WHITE} />
        <Person x={150} y={142} s={1.1} fill={ORANGE} face={WHITE} />
        <Person x={98} y={158} s={0.78} fill={AMBER} face={WHITE} />
        <Person x={202} y={158} s={0.78} fill="#7A5CA8" face={WHITE} />
        <Heart x={44} y={74} s={1.15} fill={k.acc} />
        <Path d="M56 72 Q100 36 140 72" fill="none" stroke={k.acc} strokeWidth={2.4} strokeLinecap="round" strokeDasharray="1 6" />
      </Panel>
      <Cap k={k} s="One person moves the numbers" />
    </Frame>
  );
}

function Candlestick({ x, y }: { x: number; y: number }) {
  return (
    <G>
      <Circle cx={x} cy={y - 30} r={26} fill={GOLD} opacity={0.18} />
      <Ellipse cx={x} cy={y - 3} rx={11} ry={3.6} fill={BLACK} />
      <Rect x={x - 2} y={y - 46} width={4} height={44} fill={BLACK} />
      <Ellipse cx={x} cy={y - 47} rx={7.5} ry={3.2} fill={BRASS} />
      <Rect x={x - 4} y={y - 52} width={8} height={5} rx={2} fill={BLACK} />
      <Path d={`M${x + 2} ${y - 32} L${x + 11} ${y - 32}`} stroke={BLACK} strokeWidth={2} strokeLinecap="round" />
      <Rect x={x + 9} y={y - 35} width={5} height={16} rx={2.5} fill={BLACK} />
      <Circle cx={x + 11.5} cy={y - 35} r={3.2} fill={BRASS} />
    </G>
  );
}

function Line57({ k }: { k: Ink }) {
  return (
    <Frame label="Two old telephones on little tables, one at each side of the picture, joined by a long curving cord across the middle, with a small person beside each phone">
      <Panel id="h6-line" fill={WALL}>
        <Rect x={10} y={140} width={280} height={22} fill={WOOD} />
        <Rect x={10} y={139} width={280} height={3} fill={MIDWOOD} />
        <Rect x={10} y={100} width={280} height={40} fill={MIDWOOD} opacity={0.3} />
        <Rect x={52} y={122} width={50} height={5} rx={2} fill={DARKWOOD} />
        <Rect x={56} y={127} width={4} height={14} fill={DARKWOOD} />
        <Rect x={94} y={127} width={4} height={14} fill={DARKWOOD} />
        <Rect x={198} y={122} width={50} height={5} rx={2} fill={DARKWOOD} />
        <Rect x={202} y={127} width={4} height={14} fill={DARKWOOD} />
        <Rect x={240} y={127} width={4} height={14} fill={DARKWOOD} />
        <Candlestick x={74} y={122} />
        <G transform="translate(448 0) scale(-1 1)">
          <Candlestick x={224} y={122} />
        </G>
        <Path d="M82 118 C112 172 134 66 150 104 S190 160 218 118" fill="none" stroke={BLACK} strokeWidth={2.6} strokeLinecap="round" />
        <Person x={28} y={140} s={0.85} fill={BLUE} face={WHITE} />
        <G transform="translate(272 0) scale(-1 1)">
          <Person x={0} y={140} s={0.85} fill={TEAL} face={WHITE} />
        </G>
      </Panel>
      <Cap k={k} s="The other end of the line" />
    </Frame>
  );
}

export const SCENES_H6: Record<string, ComponentType<{ k: Ink }>> = {
  'l57-lobby': Lobby,
  'l57-two-ends': TwoEnds,
  'l57-phone': Phone,
  'l57-talk': Talk,
  'l57-meeting': Meeting,
  'l57-circle': Circle57,
  'l57-line': Line57,
};
