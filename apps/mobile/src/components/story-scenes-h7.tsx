/* Scenes for lessons told as a story (see story-kit.tsx and story-scenes-h.tsx): lesson 50 (the spotlight effect and pluralistic ignorance)
   and lesson 51 (Gottman's small moments). Every person is a simple, fully clothed figure, every room is drawn warm, and the person who
   is quitting holds a soda, never a drink. */
import { type ComponentType, type ReactNode } from 'react';
import { ClipPath, Circle, Defs, Ellipse, G, Line, Path, Rect } from 'react-native-svg';

import { BEAR_LINE, Frame, type Ink, Person, Say } from './story-kit';

const BROWN = '#8A5A2B';
const GOLD = '#FFD25A';
const WHITE = '#FFFFFF';
const GREEN = '#3F8F5B';
const BLUE = '#4F6FA8';
const ORANGE = '#D9602A';
const TEAL = '#3F8F8A';
const BRICK = '#B5533C';
const WOOD = '#C9965B';
const CREAM = '#F6E3C6';
const PAPER = '#FFF6DE';
const AMBER = '#E0A33C';
const PLUM = '#8A5FA8';
const SKY = '#C6E3F0';
const SOFA = '#6F8FBF';
const SOFA_DK = '#5E7FB3';

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

/* a person sitting, seen from the side: x and y are the hips, dir 1 faces right and -1 faces left, lean tips the body forward.
   stage is drawn first and does not lean (a desk, a chair); children lean with the body (an arm, something held) */
function Sitter({
  x,
  y,
  s = 1,
  fill,
  dir = 1,
  lean = 0,
  stage,
  children,
}: {
  x: number;
  y: number;
  s?: number;
  fill: string;
  dir?: 1 | -1;
  lean?: number;
  stage?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <G transform={`translate(${x} ${y}) scale(${dir * s} ${s})`}>
      {stage}
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

/* a person kneeling, seen from the side: x and y are the knee on the floor, dir 1 faces right and -1 faces left */
function Kneeler({
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
      <Rect x={-22} y={-12} width={30} height={10} rx={5} fill={fill} />
      <Rect x={-4} y={-40} width={13} height={38} rx={6} fill={fill} />
      <G transform={`translate(0 -36) rotate(${lean})`}>
        <Path d="M-11 0 L-11 -18 Q-11 -34 2 -34 Q15 -34 15 -18 L15 0 Z" fill={fill} />
        <Circle cx={2} cy={-44} r={10} fill={fill} />
        <Circle cx={6} cy={-44} r={1.7} fill={WHITE} />
        {children}
      </G>
    </G>
  );
}

/* a small plain glass, empty-looking and clear: x and y are the middle of its base */
function Glass({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Path d="M-4.5 -11 L4.5 -11 L3.6 -1 Q3.6 0 2.6 0 L-2.6 0 Q-3.6 0 -3.6 -1 Z" fill="#EAF4F8" stroke={BEAR_LINE} strokeWidth={1} />
    </G>
  );
}

/* the soda of the person who is quitting: a tall glass with a straw and a lemon slice on the rim */
function Soda({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Path d="M-5 -24 L5 -24 L4 -2 Q4 0 2 0 L-2 0 Q-4 0 -4 -2 Z" fill="#EEF8EF" stroke={BEAR_LINE} strokeWidth={1.2} />
      <Path d="M-4.4 -19 L4.4 -19 L3.7 -2 Q3.7 -0.8 2 -0.8 L-2 -0.8 Q-3.7 -0.8 -3.7 -2 Z" fill="#9BDC7A" />
      <Circle cx={-1.5} cy={-8} r={1} fill={WHITE} opacity={0.9} />
      <Circle cx={1.5} cy={-13} r={1.2} fill={WHITE} opacity={0.9} />
      <Circle cx={-0.5} cy={-16} r={0.8} fill={WHITE} opacity={0.9} />
      <Path d="M1 -6 L5 -33" stroke="#E2574C" strokeWidth={2.2} strokeLinecap="round" />
      <G transform="translate(-5 -24)">
        <Circle r={5.6} fill="#F6D84A" stroke={AMBER} strokeWidth={1} />
        <Path d="M-4 0 L4 0 M0 -4 L0 4 M-2.8 -2.8 L2.8 2.8 M2.8 -2.8 L-2.8 2.8" stroke={WHITE} strokeWidth={0.8} opacity={0.85} />
      </G>
    </G>
  );
}

/* a small four-point sparkle */
function Spark({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <Path d="M0 -7 Q1 -1 7 0 Q1 1 0 7 Q-1 1 -7 0 Q-1 -1 0 -7 Z" transform={`translate(${x} ${y}) scale(${s})`} fill={GOLD} stroke={AMBER} strokeWidth={0.6} />
  );
}

/* a child's drawing: a sun, a house and a green hill; with flap the top corner droops */
function Drawing({ x, y, s = 1, rot = 0, flap = false }: { x: number; y: number; s?: number; rot?: number; flap?: boolean }) {
  return (
    <G transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <Path d={flap ? 'M0 0 L19 0 L26 7 L26 24 L0 24 Z' : 'M0 0 L26 0 L26 24 L0 24 Z'} fill={PAPER} stroke={BROWN} strokeWidth={1} strokeLinejoin="round" />
      <Circle cx={7} cy={8} r={3.4} fill={GOLD} />
      <Path d="M1 23 L1 19 Q10 15 18 19 L25 18 L25 23 Z" fill={GREEN} opacity={0.9} />
      <Rect x={11} y={13} width={8} height={6} fill={BRICK} />
      <Path d="M10 13 L15 8.5 L20 13 Z" fill={BROWN} />
      {flap ? <Path d="M19 0 L26 7 L19 7 Z" fill="#D9C79B" stroke={BROWN} strokeWidth={0.8} strokeLinejoin="round" /> : null}
    </G>
  );
}

/* ---------- lesson 50: the spotlight effect ---------- */
function Student({ x, fill, glance }: { x: number; fill: string; glance: boolean }) {
  const lean = glance ? -3 : 18;
  const r = (lean * Math.PI) / 180;
  const sx = 4 * Math.cos(r) + 28 * Math.sin(r);
  const sy = 4 * Math.sin(r) - 28 * Math.cos(r);
  return (
    <Sitter
      x={x}
      y={123}
      s={0.75}
      fill={fill}
      dir={-1}
      lean={lean}
      stage={
        <>
          <Rect x={-12} y={-30} width={3} height={30} rx={1.5} fill={BROWN} />
          <Rect x={-12} y={0} width={34} height={4} rx={2} fill={WOOD} />
          <Rect x={-8} y={4} width={3} height={27} fill={BROWN} />
          <Rect x={16} y={4} width={3} height={27} fill={BROWN} />
          <Rect x={14} y={-26} width={48} height={4} rx={2} fill={BROWN} />
          <Rect x={56} y={-22} width={4} height={53} fill={BROWN} />
          <Rect x={28} y={-29} width={16} height={3} rx={1} fill={WHITE} />
          <Path d={`M${sx} ${sy} L30 -28`} stroke={fill} strokeWidth={6.5} strokeLinecap="round" />
          {glance ? <Path d="M17 -47 L31 -52" stroke={BROWN} strokeWidth={1.4} strokeLinecap="round" strokeDasharray="2 2.4" opacity={0.6} /> : null}
        </>
      }
    />
  );
}

function Shirt({ k }: { k: Ink }) {
  const SHIRT = '#F25C4A';
  const HAIR = '#4A2E1B';
  return (
    <Frame label="A student stands in a doorway in a bright T-shirt printed with a big smiling cartoon face with curly hair, while inside other students sit at desks filling in forms and a few glance up">
      <Panel id="h7-shirt" fill="#F8E8CC">
        <Rect x={10} y={146} width={280} height={16} fill={WOOD} />
        <Rect x={10} y={145} width={280} height={3} fill="#B08A57" />
        <Rect x={214} y={26} width={58} height={38} rx={3} fill={WOOD} stroke={BROWN} strokeWidth={3} />
        <Rect x={221} y={33} width={13} height={11} fill={PAPER} />
        <Rect x={240} y={32} width={13} height={14} fill="#CFE8DD" />
        <Rect x={225} y={48} width={15} height={11} fill="#FBDDB0" />
        <Rect x={248} y={50} width={13} height={9} fill={PAPER} />
        <Rect x={22} y={22} width={64} height={124} fill="#CDE6EF" />
        <Rect x={22} y={138} width={64} height={8} fill={WOOD} />
        <Rect x={22} y={22} width={64} height={124} fill="none" stroke={BROWN} strokeWidth={5} />
        <Rect x={41} y={116} width={10} height={30} rx={5} fill={TEAL} />
        <Rect x={57} y={116} width={10} height={30} rx={5} fill={TEAL} />
        <Rect x={30} y={96} width={7} height={26} rx={3.5} fill={TEAL} />
        <Rect x={71} y={96} width={7} height={26} rx={3.5} fill={TEAL} />
        <Path d="M36 120 L36 94 Q36 84 46 84 L62 84 Q72 84 72 94 L72 120 Z" fill={SHIRT} />
        <Rect x={29} y={86} width={12} height={16} rx={5} fill={SHIRT} />
        <Rect x={67} y={86} width={12} height={16} rx={5} fill={SHIRT} />
        <Circle cx={54} cy={72} r={12} fill={TEAL} />
        <Circle cx={58} cy={71} r={1.8} fill={WHITE} />
        {[-165, -135, -105, -75, -45, -15].map((a) => (
          <Circle key={a} cx={54 + 10.5 * Math.cos((a * Math.PI) / 180)} cy={104 + 10.5 * Math.sin((a * Math.PI) / 180)} r={3.6} fill={HAIR} />
        ))}
        <Circle cx={54} cy={104} r={10.5} fill={GOLD} stroke="#C98A2B" strokeWidth={1} />
        <Circle cx={50.2} cy={102.5} r={1.4} fill={HAIR} />
        <Circle cx={57.8} cy={102.5} r={1.4} fill={HAIR} />
        <Path d="M49 107 Q54 112.5 59 107" stroke={HAIR} strokeWidth={1.5} strokeLinecap="round" fill="none" />
        <Student x={148} fill={BLUE} glance />
        <Student x={208} fill={ORANGE} glance={false} />
        <Student x={268} fill={PLUM} glance />
      </Panel>
      <Cap k={k} s="Who noticed the shirt?" />
    </Frame>
  );
}

/* one friend at the table, seen from the front above the table top: look is which way the eyes face (-1 left, 1 right) */
function Friend({ x, fill, look, soda }: { x: number; fill: string; look: number; soda?: boolean }) {
  return (
    <G transform={`translate(${x} 114) scale(1.1)`}>
      <Path d="M-17 4 L-17 -16 Q-17 -33 0 -33 Q17 -33 17 -16 L17 4 Z" fill={fill} />
      <Circle cx={0} cy={-46} r={11} fill={fill} />
      <Circle cx={look * 4} cy={-46} r={1.8} fill={WHITE} />
      <Path d="M14 -24 Q26 -20 24 -11" stroke={fill} strokeWidth={6.5} strokeLinecap="round" fill="none" />
      {soda ? <Soda x={24} y={-8} s={0.95} /> : <Glass x={24} y={-8} s={0.95} />}
    </G>
  );
}

function Talk({ x, y }: { x: number; y: number }) {
  return (
    <G>
      <Rect x={x - 11} y={y} width={22} height={12} rx={6} fill={WHITE} opacity={0.92} />
      <Circle cx={x - 5} cy={y + 6} r={1.4} fill={BROWN} />
      <Circle cx={x} cy={y + 6} r={1.4} fill={BROWN} />
      <Circle cx={x + 5} cy={y + 6} r={1.4} fill={BROWN} />
    </G>
  );
}

function TableScene({ k }: { k: Ink }) {
  const bulbs = [10, 100, 190].flatMap((a) => [
    { x: a + 22.5, y: 22.3 },
    { x: a + 45, y: 25 },
    { x: a + 67.5, y: 22.3 },
  ]);
  return (
    <Frame label="Five friends sit at a lively table, each holding a small glass and talking to a neighbor; the one in the middle holds a tall soda with a straw and a lemon slice, and nobody is looking at it">
      <Panel id="h7-table" fill="#F9E7C8">
        <Circle cx={150} cy={70} r={92} fill={GOLD} opacity={0.12} />
        <Path d="M10 14 Q55 36 100 14 M100 14 Q145 36 190 14 M190 14 Q235 36 280 14" stroke={BROWN} strokeWidth={1.4} fill="none" />
        {bulbs.map((b) => (
          <Circle key={b.x} cx={b.x} cy={b.y} r={3.2} fill={GOLD} />
        ))}
        <Rect x={10} y={148} width={280} height={14} fill={WOOD} />
        <Talk x={66} y={34} />
        <Talk x={170} y={34} />
        <Talk x={222} y={38} />
        <Friend x={40} fill={ORANGE} look={1} />
        <Friend x={92} fill={TEAL} look={-1} />
        <Friend x={144} fill={BLUE} look={1} soda />
        <Friend x={196} fill={PLUM} look={-1} />
        <Friend x={248} fill={BRICK} look={-1} />
        <Rect x={24} y={119} width={252} height={29} fill="#C2603F" />
        <Rect x={24} y={125} width={252} height={3} fill="#D7805C" opacity={0.7} />
        <Rect x={16} y={112} width={268} height={8} rx={3} fill={BROWN} />
      </Panel>
      <Cap k={k} s="Everyone watches their own glass" />
    </Frame>
  );
}

function Survey({ k }: { k: Ink }) {
  return (
    <Frame label="A student fills in a form at a desk, and beside them the form is shown large with two bars: a short one for me and a long one for everyone else">
      <Panel id="h7-survey" fill="#F8E8CC">
        <Rect x={10} y={146} width={280} height={16} fill={WOOD} />
        <Rect x={10} y={145} width={280} height={3} fill="#B08A57" />
        <Sitter
          x={56}
          y={123}
          s={0.95}
          fill={TEAL}
          lean={16}
          stage={
            <>
              <Rect x={-12} y={-30} width={3} height={30} rx={1.5} fill={BROWN} />
              <Rect x={-12} y={0} width={34} height={4} rx={2} fill={WOOD} />
              <Rect x={-8} y={4} width={3} height={27} fill={BROWN} />
              <Rect x={16} y={4} width={3} height={27} fill={BROWN} />
              <Rect x={14} y={-26} width={48} height={4} rx={2} fill={BROWN} />
              <Rect x={56} y={-22} width={4} height={53} fill={BROWN} />
              <Rect x={26} y={-29} width={20} height={3} rx={1} fill={WHITE} />
              <Path d="M12.5 -25.4 L34 -29" stroke={TEAL} strokeWidth={6.5} strokeLinecap="round" />
              <Path d="M34 -30 L42 -36" stroke={AMBER} strokeWidth={2.2} strokeLinecap="round" />
            </>
          }
        />
        <Rect x={134} y={24} width={146} height={122} rx={8} fill={PAPER} stroke={BROWN} strokeWidth={2} />
        <Rect x={148} y={34} width={52} height={5} rx={2.5} fill="#CDB68A" />
        <Rect x={148} y={46} width={78} height={4} rx={2} fill="#E3D3B0" />
        <Say x={148} y={66} s="Me" fill={BEAR_LINE} size={10} anchor="start" />
        <Rect x={148} y={71} width={118} height={14} rx={7} fill="#EADBC0" />
        <Rect x={148} y={71} width={36} height={14} rx={7} fill={TEAL} />
        <Rect x={148} y={98} width={78} height={4} rx={2} fill="#E3D3B0" />
        <Say x={148} y={118} s="Everyone else" fill={BEAR_LINE} size={10} anchor="start" />
        <Rect x={148} y={123} width={118} height={14} rx={7} fill="#EADBC0" />
        <Rect x={148} y={123} width={104} height={14} rx={7} fill={ORANGE} />
      </Panel>
      <Cap k={k} s="Me, and everyone else" />
    </Frame>
  );
}

function Unease({ x, y }: { x: number; y: number }) {
  return (
    <G transform={`translate(${x} ${y})`}>
      <Circle r={10} fill="#FFE3A3" stroke={BEAR_LINE} strokeWidth={1.2} />
      <Circle cx={-3.5} cy={-1.5} r={1.3} fill={BEAR_LINE} />
      <Circle cx={3.5} cy={-1.5} r={1.3} fill={BEAR_LINE} />
      <Path d="M-5.5 -5 L-2.2 -7 M5.5 -5 L2.2 -7" stroke={BEAR_LINE} strokeWidth={1.2} strokeLinecap="round" />
      <Path d="M-4.5 4.5 Q-2.2 2.5 0 4.5 T4.5 4.5" stroke={BEAR_LINE} strokeWidth={1.2} strokeLinecap="round" fill="none" />
      <Path d="M9.5 -7 Q12.5 -3 9.5 -1.2 Q6.5 -3 9.5 -7 Z" fill="#8FD3F4" />
    </G>
  );
}

function OddOne({ k }: { k: Ink }) {
  const fills = [ORANGE, TEAL, BLUE, PLUM, BRICK];
  const dirs = [1, 1, -1, 1, -1];
  const flags = [GOLD, '#E2574C', TEAL, '#F6A04A', PLUM];
  return (
    <Frame label="Five students stand in a row at a party, each with a thought cloud above showing the same slightly uneasy face, each glancing sideways at the others">
      <Panel id="h7-odd" fill="#F7E1BF">
        <Rect x={10} y={146} width={280} height={16} fill={WOOD} />
        <Rect x={10} y={145} width={280} height={3} fill="#B08A57" />
        <Path d="M10 14 Q150 34 290 14" stroke={BROWN} strokeWidth={1.4} fill="none" />
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
          const t = (i + 0.5) / 9;
          const fx = 10 + 280 * t;
          const fy = 14 + 2 * t * (1 - t) * 20;
          return <Path key={i} d={`M${fx - 6} ${fy} L${fx + 6} ${fy} L${fx} ${fy + 12} Z`} fill={flags[i % flags.length]} />;
        })}
        {fills.map((f, i) => {
          const x = 50 + i * 50;
          return (
            <G key={i}>
              <Rect x={x - 22} y={36} width={44} height={32} rx={16} fill={WHITE} />
              <Circle cx={x} cy={75} r={4.5} fill={WHITE} />
              <Circle cx={x - 3} cy={83} r={2.8} fill={WHITE} />
              <Unease x={x} y={52} />
              <G transform={`translate(${x} 150) scale(${dirs[i]} 1)`}>
                <Person x={0} y={0} fill={f} face={WHITE} />
              </G>
            </G>
          );
        })}
      </Panel>
      <Cap k={k} s="Everyone thought they were the odd one" />
    </Frame>
  );
}

function NoThanks({ k }: { k: Ink }) {
  return (
    <Frame label="At a small table, one person holding a soda gently raises a hand to say no thanks to a friend who offers a glass, while across the table another person smiles with a small relieved sparkle">
      <Panel id="h7-nothanks" fill="#F9E7C8">
        <Circle cx={150} cy={84} r={84} fill={GOLD} opacity={0.12} />
        <Rect x={10} y={148} width={280} height={14} fill={WOOD} />
        <Rect x={30} y={30} width={32} height={26} rx={2} fill="#FFF3DC" stroke={BROWN} strokeWidth={3} />
        <Path d="M33 53 L42 42 L48 48 L54 40 L60 53 Z" fill="#7FBF8E" />
        <Rect x={238} y={30} width={32} height={26} rx={2} fill="#FFF3DC" stroke={BROWN} strokeWidth={3} />
        <Circle cx={254} cy={43} r={6} fill={GOLD} />
        <Sitter x={84} y={124} s={0.9} fill={TEAL} lean={2}>
          <Path d="M4 -28 L19 -38 L22 -52" stroke={TEAL} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <Ellipse cx={22.5} cy={-57} rx={4.2} ry={5.6} fill={TEAL} />
          <Ellipse cx={17.5} cy={-54} rx={1.9} ry={3.2} fill={TEAL} transform="rotate(-30 17.5 -54)" />
          <Path d="M3 -26 L25 -30" stroke={TEAL} strokeWidth={6} strokeLinecap="round" />
        </Sitter>
        <Sitter x={216} y={124} s={0.9} fill={ORANGE} dir={-1} lean={0}>
          <Path d="M4 -28 L26 -26" stroke={ORANGE} strokeWidth={6} strokeLinecap="round" />
          <Glass x={30} y={-22} s={1.15} />
        </Sitter>
        <G transform="translate(150 112) scale(1.05)">
          <Path d="M-14 -24 Q-22 -6 -6 -4" stroke={BLUE} strokeWidth={6} strokeLinecap="round" fill="none" />
          <Path d="M14 -24 Q22 -6 6 -4" stroke={BLUE} strokeWidth={6} strokeLinecap="round" fill="none" />
          <Path d="M-17 4 L-17 -16 Q-17 -33 0 -33 Q17 -33 17 -16 L17 4 Z" fill={BLUE} />
          <Circle cx={0} cy={-46} r={11} fill={BLUE} />
          <Circle cx={3} cy={-48} r={1.8} fill={WHITE} />
          <Path d="M-3.5 -42.5 Q1 -38.5 5.5 -42.5" stroke={WHITE} strokeWidth={1.5} strokeLinecap="round" fill="none" />
        </G>
        <Spark x={138} y={38} s={1} />
        <Spark x={158} y={30} s={0.75} />
        <Spark x={171} y={44} s={0.55} />
        <Rect x={104} y={115} width={92} height={33} fill={BRICK} />
        <Rect x={104} y={121} width={92} height={3} fill="#D7805C" opacity={0.7} />
        <Rect x={98} y={108} width={104} height={8} rx={3} fill={BROWN} />
        <Soda x={111} y={108} />
      </Panel>
      <Cap k={k} s="Someone may be glad you said it" />
    </Frame>
  );
}

/* ---------- lesson 51: small moments ---------- */
function Lab({ k }: { k: Ink }) {
  const books: Array<[number, number, string]> = [
    [122, 14, BRICK],
    [130, 18, TEAL],
    [138, 12, AMBER],
    [145, 17, BLUE],
    [153, 13, PLUM],
    [189, 16, GREEN],
    [197, 12, ORANGE],
  ];
  return (
    <Frame label="A cozy room like a bed and breakfast with a small kitchen counter, a sofa, a window with a view, books and a small camera on a tripod in the corner, where a couple makes lunch at the counter">
      <Panel id="h7-lab" fill={CREAM}>
        <Rect x={10} y={146} width={280} height={16} fill={WOOD} />
        <Rect x={10} y={145} width={280} height={3} fill="#B08A57" />
        <Rect x={26} y={28} width={62} height={52} fill={SKY} />
        <Circle cx={72} cy={44} r={7} fill={GOLD} />
        <Path d="M26 80 L26 68 Q46 56 62 68 Q76 60 88 68 L88 80 Z" fill={GREEN} />
        <Rect x={26} y={28} width={62} height={52} fill="none" stroke={BROWN} strokeWidth={4} />
        <Rect x={20} y={26} width={11} height={58} rx={4} fill={BRICK} opacity={0.9} />
        <Rect x={83} y={26} width={11} height={58} rx={4} fill={BRICK} opacity={0.9} />
        <Ellipse cx={56} cy={152} rx={52} ry={6} fill={BRICK} opacity={0.65} />
        <Rect x={22} y={98} width={74} height={34} rx={12} fill={SOFA} />
        <Rect x={14} y={108} width={16} height={38} rx={8} fill={SOFA} />
        <Rect x={88} y={108} width={16} height={38} rx={8} fill={SOFA} />
        <Rect x={26} y={120} width={66} height={24} rx={8} fill={SOFA_DK} />
        <Rect x={32} y={104} width={20} height={16} rx={6} fill={ORANGE} />
        <Rect x={118} y={46} width={100} height={4} rx={2} fill={BROWN} />
        {books.map(([bx, bh, bc]) => (
          <Rect key={bx} x={bx} y={46 - bh} width={6.5} height={bh} rx={1} fill={bc} />
        ))}
        <Rect x={161} y={36} width={22} height={10} rx={2} fill={WOOD} stroke={BROWN} strokeWidth={1} />
        <Person x={148} y={124} s={1.1} fill={ORANGE} face={WHITE} />
        <Person x={196} y={124} s={1.1} fill={TEAL} face={WHITE} />
        <Rect x={112} y={104} width={122} height={44} fill="#D9A96B" />
        <Rect x={108} y={102} width={130} height={7} rx={3} fill={BROWN} />
        <Line x1={150} y1={112} x2={150} y2={146} stroke={BROWN} strokeWidth={1} opacity={0.5} />
        <Line x1={192} y1={112} x2={192} y2={146} stroke={BROWN} strokeWidth={1} opacity={0.5} />
        <Circle cx={146} cy={122} r={1.8} fill={BROWN} />
        <Circle cx={154} cy={122} r={1.8} fill={BROWN} />
        <Rect x={163} y={99} width={26} height={4} rx={2} fill="#E8C690" />
        <Circle cx={170} cy={95.5} r={4} fill="#D9473A" />
        <Ellipse cx={181} cy={96} rx={7} ry={3.8} fill="#D8A25C" />
        <Path d="M158 96 L166 101" stroke={ORANGE} strokeWidth={5} strokeLinecap="round" />
        <Path d="M184 96 L180 101" stroke={TEAL} strokeWidth={5} strokeLinecap="round" />
        <Ellipse cx={222} cy={100} rx={9} ry={3.4} fill={BRICK} />
        <Circle cx={219} cy={96} r={3.6} fill={ORANGE} />
        <Circle cx={225} cy={96.5} r={3.6} fill={GOLD} />
        <Line x1={262} y1={96} x2={251} y2={146} stroke="#4A4350" strokeWidth={2.6} strokeLinecap="round" />
        <Line x1={262} y1={96} x2={262} y2={147} stroke="#4A4350" strokeWidth={2.6} strokeLinecap="round" />
        <Line x1={262} y1={96} x2={273} y2={146} stroke="#4A4350" strokeWidth={2.6} strokeLinecap="round" />
        <Rect x={250} y={82} width={22} height={14} rx={3} fill="#3B3A45" />
        <Rect x={243} y={86} width={9} height={6} rx={2} fill="#5A596E" />
        <Circle cx={267} cy={86} r={1.8} fill="#E5483A" />
      </Panel>
      <Cap k={k} s="An ordinary day, watched" />
    </Frame>
  );
}

function Bird({ k }: { k: Ink }) {
  return (
    <Frame label="Two people sit on a sofa beside a window: one points out at a small bird on a branch, and the other looks up from a newspaper toward the window">
      <Panel id="h7-bird" fill={CREAM}>
        <Rect x={10} y={146} width={280} height={16} fill={WOOD} />
        <Rect x={10} y={145} width={280} height={3} fill="#B08A57" />
        <Rect x={26} y={24} width={84} height={84} fill={SKY} />
        <Circle cx={94} cy={42} r={8} fill={GOLD} />
        <Path d="M26 108 L26 90 Q48 74 68 90 Q88 78 110 92 L110 108 Z" fill={GREEN} />
        <Path d="M28 66 Q60 62 106 50" stroke={BROWN} strokeWidth={3} strokeLinecap="round" fill="none" />
        <Ellipse cx={42} cy={61} rx={6} ry={3} fill={GREEN} transform="rotate(-30 42 61)" />
        <Ellipse cx={52} cy={58} rx={6} ry={3} fill="#2F7A4B" transform="rotate(25 52 58)" />
        <Ellipse cx={96} cy={52} rx={6} ry={3} fill={GREEN} transform="rotate(-25 96 52)" />
        <Path d="M69 52 L60 56 L69 55.5 Z" fill={BROWN} />
        <Ellipse cx={75} cy={52} rx={7} ry={5.5} fill="#B8742C" />
        <Ellipse cx={77.5} cy={53.5} rx={4} ry={3.4} fill={ORANGE} />
        <Circle cx={81} cy={47} r={4.2} fill="#B8742C" />
        <Path d="M84.8 46.6 L88.6 47.8 L84.8 48.8 Z" fill={GOLD} />
        <Circle cx={82.4} cy={46.2} r={0.9} fill={BEAR_LINE} />
        <Rect x={26} y={24} width={84} height={84} fill="none" stroke={BROWN} strokeWidth={4} />
        <Rect x={20} y={108} width={96} height={6} rx={3} fill={WOOD} />
        <Rect x={18} y={22} width={12} height={86} rx={4} fill={BRICK} opacity={0.9} />
        <Rect x={106} y={22} width={12} height={86} rx={4} fill={BRICK} opacity={0.9} />
        <Rect x={166} y={26} width={54} height={36} rx={3} fill="#FFF3DC" stroke={BROWN} strokeWidth={3} />
        <Path d="M170 58 L182 44 L190 52 L200 40 L216 58 Z" fill="#7FBF8E" />
        <Circle cx={208} cy={36} r={4} fill={GOLD} />
        <Rect x={124} y={86} width={146} height={44} rx={12} fill={SOFA} />
        <Person x={160} y={128} s={1} fill={ORANGE} />
        <Circle cx={156} cy={82} r={1.8} fill={WHITE} />
        <Path d="M146 102 L124 88" stroke={ORANGE} strokeWidth={6.5} strokeLinecap="round" />
        <Circle cx={122} cy={87} r={3.4} fill={ORANGE} />
        <Person x={226} y={128} s={1} fill={PLUM} />
        <Circle cx={222} cy={81} r={1.8} fill={WHITE} />
        <Path d="M213 104 L210 119 M239 104 L242 119" stroke={PLUM} strokeWidth={6} strokeLinecap="round" />
        <G transform="rotate(-5 226 119)">
          <Rect x={208} y={106} width={36} height={26} rx={2} fill="#FBF3E0" stroke={BROWN} strokeWidth={1} />
          <Rect x={212} y={110} width={16} height={4} rx={1} fill="#CDB68A" />
          <Path d="M212 118 L240 118 M212 123 L240 123 M212 128 L232 128" stroke="#D8C9A8" strokeWidth={1.6} strokeLinecap="round" />
        </G>
        <Rect x={122} y={120} width={150} height={26} rx={9} fill={SOFA_DK} />
        <Rect x={114} y={100} width={18} height={46} rx={9} fill={SOFA} />
        <Rect x={262} y={100} width={18} height={46} rx={9} fill={SOFA} />
        <Rect x={186} y={108} width={22} height={18} rx={6} fill={ORANGE} />
      </Panel>
      <Cap k={k} s="Look at that bird" />
    </Frame>
  );
}

/* the room of lesson 51's two last pictures: a doorway, a window, an armchair and a side table */
function Room({ lit, children }: { lit: boolean; children?: ReactNode }) {
  return (
    <>
      <Rect x={10} y={148} width={280} height={14} fill={WOOD} />
      <Rect x={10} y={147} width={280} height={3} fill="#B08A57" />
      <Rect x={24} y={24} width={76} height={124} fill={lit ? '#FBE7A6' : '#E8D8B8'} />
      <Rect x={24} y={24} width={76} height={124} fill="none" stroke={BROWN} strokeWidth={5} />
      <Rect x={134} y={28} width={54} height={50} fill={SKY} />
      <Path d="M134 78 L134 66 Q150 56 164 66 Q176 60 188 66 L188 78 Z" fill={GREEN} />
      <Rect x={134} y={28} width={54} height={50} fill="none" stroke={BROWN} strokeWidth={4} />
      <Rect x={194} y={84} width={14} height={46} rx={7} fill={BRICK} />
      <Rect x={194} y={119} width={58} height={14} rx={6} fill="#C2603F" />
      <Rect x={198} y={131} width={5} height={17} fill={BROWN} />
      <Rect x={244} y={131} width={5} height={17} fill={BROWN} />
      {children}
    </>
  );
}

/* the side table at the right, with its lamp (lit or not) */
function SideTable({ lit, glass }: { lit: boolean; glass: boolean }) {
  return (
    <G>
      {lit ? (
        <>
          <Circle cx={265} cy={84} r={46} fill={GOLD} opacity={0.18} />
          <Circle cx={265} cy={84} r={26} fill={GOLD} opacity={0.24} />
        </>
      ) : null}
      <Rect x={254} y={104} width={36} height={5} rx={2.5} fill={BROWN} />
      <Rect x={268} y={109} width={8} height={39} fill={BROWN} />
      <Rect x={258} y={145} width={28} height={3} rx={1.5} fill={BROWN} />
      <Rect x={263.5} y={82} width={3} height={22} fill={BROWN} />
      <Path d="M255 86 L260 70 L272 70 L277 86 Z" fill={lit ? AMBER : '#B9A58A'} />
      {glass ? <Glass x={282} y={104} s={1.1} /> : null}
    </G>
  );
}

function Missed({ k }: { k: Ink }) {
  return (
    <Frame label="In a doorway a child holds up a drawing with a drooping corner toward a parent who sits slumped in an armchair, looking away, with a small glass on the side table beside them">
      <Panel id="h7-missed" fill="#E6D2B4">
        <Room lit={false} />
        <Person x={62} y={148} s={0.85} fill={ORANGE} face={WHITE} />
        <Path d="M70 124 L82 102" stroke={ORANGE} strokeWidth={5} strokeLinecap="round" />
        <Circle cx={82} cy={101} r={2.8} fill={ORANGE} />
        <Drawing x={80} y={76} rot={-6} flap />
        <Sitter x={216} y={120} s={0.9} fill={BLUE} lean={22}>
          <Path d="M4 -28 L17 -13" stroke={BLUE} strokeWidth={6} strokeLinecap="round" />
        </Sitter>
        <SideTable lit={false} glass />
      </Panel>
      <Cap k={k} s="The small moments go first" />
    </Frame>
  );
}

function Turn({ k }: { k: Ink }) {
  return (
    <Frame label="The same parent now kneels at the child's height, both holding the drawing together, in the warm light of a lamp">
      <Panel id="h7-turn" fill="#F6E3C6">
        <Circle cx={190} cy={90} r={110} fill={GOLD} opacity={0.1} />
        <Room lit />
        <Person x={112} y={148} s={0.85} fill={ORANGE} face={WHITE} />
        <Path d="M121 125 L129 113" stroke={ORANGE} strokeWidth={5} strokeLinecap="round" />
        <Kneeler x={176} y={148} s={0.72} fill={BLUE} dir={-1} lean={12}>
          <Path d="M4 -28 L24 -14" stroke={BLUE} strokeWidth={6.5} strokeLinecap="round" />
        </Kneeler>
        <Drawing x={127} y={93} s={1.15} />
        <Circle cx={129} cy={113} r={2.8} fill={ORANGE} />
        <Spark x={140} y={80} s={0.9} />
        <Spark x={154} y={72} s={0.6} />
        <SideTable lit glass={false} />
      </Panel>
      <Cap k={k} s="Turn toward the small things" />
    </Frame>
  );
}

export const SCENES_H7: Record<string, ComponentType<{ k: Ink }>> = {
  'l50-shirt': Shirt,
  'l50-table': TableScene,
  'l50-survey': Survey,
  'l50-odd-one': OddOne,
  'l50-no-thanks': NoThanks,
  'l51-lab': Lab,
  'l51-bird': Bird,
  'l51-missed': Missed,
  'l51-turn': Turn,
};
