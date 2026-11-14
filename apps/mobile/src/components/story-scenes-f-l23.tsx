/* Scenes for lesson 23, told as a story (see story-kit.tsx and story-scenes-f.tsx): the mind as a small theater with the curtain always up,
   the thoughts waiting in the wings, the fifteen minutes alone with a button, and the hour a person claims first. */
import { useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { Easing } from 'react-native';
import { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';

import { useAppear, useReducedMotion } from '@/lib/motion';

import { BEAR_LINE, Frame, type Ink, Person, Say } from './story-kit';

const BROWN = '#8A5A2B';
const WOOD = '#B07A45';
const WOOD_D = '#8A5A2B';
const GOLD = '#FFD25A';
const SAND = '#E8B84A';
const WHITE = '#FFFFFF';
const GREEN = '#3F8F5B';
const GRAY = '#8E96AB';
const CREAM = '#FFF5E1';
const CURT = '#B3263A';
const CURT_D = '#7F1829';
const CURT_L = '#D24B5E';
const WALL = '#2E1B3A';
const ORANGE = '#D9602A';
const GLOW = '#9ED8FF';
const SCREEN = '#CDEBFF';
const DARK = '#2A2F3F';

/* the line of words under a picture */
function Cap({ k, s }: { k: Ink; s: string }) {
  return <Say x={150} y={190} s={s} fill={k.ink} />;
}

/* ---------- shared drawings ---------- */

/* the one small theater every stage scene shares: a plum back wall, a wooden floor, a soft spotlight, red curtains at the sides and
   swagged across the top. What stands on the stage goes in as children, so the curtain edge can hide a figure in the wing. */
function Theater({ children }: { children?: ReactNode }) {
  const planks = [1, 2, 3, 4, 5, 6, 7];
  const fold = (
    <G>
      <Path d="M10 10 L66 10 Q58 60 56 100 Q54 140 38 172 L10 172 Z" fill={CURT} />
      <Path d="M26 14 Q22 90 20 172" stroke={CURT_D} strokeWidth={4} fill="none" strokeLinecap="round" opacity={0.7} />
      <Path d="M40 14 Q36 90 31 172" stroke={CURT_L} strokeWidth={3} fill="none" strokeLinecap="round" opacity={0.55} />
      <Path d="M52 14 Q47 90 41 172" stroke={CURT_D} strokeWidth={3} fill="none" strokeLinecap="round" opacity={0.6} />
    </G>
  );
  return (
    <G>
      <Rect x={10} y={10} width={280} height={162} rx={10} fill={WALL} />
      <Path d="M150 10 L84 152 L216 152 Z" fill={GOLD} opacity={0.2} />
      <Path d="M22 126 L278 126 L290 172 L10 172 Z" fill={WOOD} />
      {planks.map((i) => (
        <Line key={i} x1={22 + (i / 8) * 256} y1={126} x2={10 + (i / 8) * 280} y2={172} stroke={WOOD_D} strokeWidth={1.4} opacity={0.55} />
      ))}
      <Line x1={16} y1={148} x2={284} y2={148} stroke={WOOD_D} strokeWidth={1.2} opacity={0.4} />
      <Ellipse cx={150} cy={146} rx={62} ry={12} fill={GOLD} opacity={0.3} />
      {children}
      {fold}
      <G transform="translate(300 0) scale(-1 1)">{fold}</G>
      <Path d="M10 10 L290 10 L290 24 Q262 42 234 24 Q206 42 178 24 Q150 42 122 24 Q94 42 66 24 Q38 42 10 24 Z" fill={CURT} />
      <Path d="M290 24 Q262 42 234 24 Q206 42 178 24 Q150 42 122 24 Q94 42 66 24 Q38 42 10 24" stroke={GOLD} strokeWidth={2} fill="none" />
      {[66, 122, 178, 234].map((x) => (
        <Circle key={x} cx={x} cy={26} r={3} fill={GOLD} />
      ))}
    </G>
  );
}

/* a phone with its screen lit: a soft glow, then a dark body and a pale screen */
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

/* an hourglass standing on (x, y), sand falling; 44 tall at s = 1 */
function Hourglass({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Rect x={-11.5} y={-40} width={2.4} height={40} fill={BROWN} />
      <Rect x={9.1} y={-40} width={2.4} height={40} fill={BROWN} />
      <Path d="M-9 -38 L9 -38 Q9 -27 2 -21 L-2 -21 Q-9 -27 -9 -38 Z" fill="#F4F6FF" stroke={BEAR_LINE} strokeWidth={1.2} strokeLinejoin="round" />
      <Path d="M-2 -21 L2 -21 Q9 -15 9 -4 L-9 -4 Q-9 -15 -2 -21 Z" fill="#F4F6FF" stroke={BEAR_LINE} strokeWidth={1.2} strokeLinejoin="round" />
      <Path d="M-5.5 -34 L5.5 -34 Q4 -28 1 -25 L-1 -25 Q-4 -28 -5.5 -34 Z" fill={SAND} />
      <Line x1={0} y1={-23} x2={0} y2={-10} stroke={SAND} strokeWidth={1.3} strokeLinecap="round" />
      <Path d="M-7.5 -4 Q-3 -11 0 -11 Q3 -11 7.5 -4 Z" fill={SAND} />
      <Rect x={-14} y={-42} width={28} height={4.5} rx={2} fill={BROWN} stroke={BEAR_LINE} strokeWidth={1} />
      <Rect x={-14} y={-4.5} width={28} height={4.5} rx={2} fill={BROWN} stroke={BEAR_LINE} strokeWidth={1} />
    </G>
  );
}

/* a running shoe, side on, standing on (x, y), toe to the right */
function Shoe({ x, y, s = 1, fill }: { x: number; y: number; s?: number; fill: string }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Path
        d="M-14 0 L-14 -13 Q-14 -17 -10 -17 L-4 -17 Q-2 -11 5 -9 L11 -7 Q16 -5 16 -1 L16 0 Z"
        fill={fill}
        stroke={BEAR_LINE}
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
      <Rect x={-14.5} y={-3.5} width={31} height={4} rx={2} fill={WHITE} stroke={BEAR_LINE} strokeWidth={1.2} />
      <Path d="M-3 -13 l4 2 M0 -10 l4 2" stroke={WHITE} strokeWidth={1.6} strokeLinecap="round" />
    </G>
  );
}

/* a cooking pot standing on (x, y), with a lid, and steam when it is on */
function Pot({ x, y, s = 1, fill = GRAY, steam }: { x: number; y: number; s?: number; fill?: string; steam?: boolean }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Rect x={-17} y={-12} width={6} height={3} rx={1.5} fill={fill} stroke={BEAR_LINE} strokeWidth={1.1} />
      <Rect x={11} y={-12} width={6} height={3} rx={1.5} fill={fill} stroke={BEAR_LINE} strokeWidth={1.1} />
      <Path d="M-11 -15 L11 -15 L11 -3 Q11 0 8 0 L-8 0 Q-11 0 -11 -3 Z" fill={fill} stroke={BEAR_LINE} strokeWidth={1.4} strokeLinejoin="round" />
      <Path d="M-12 -15 Q0 -25 12 -15 Z" fill={fill} stroke={BEAR_LINE} strokeWidth={1.4} strokeLinejoin="round" />
      <Circle cx={0} cy={-23} r={2.4} fill={BEAR_LINE} />
      <Path d="M-8 -8 L8 -8" stroke={WHITE} strokeWidth={1.6} strokeLinecap="round" opacity={0.45} />
      {steam ? (
        <G stroke={WHITE} strokeWidth={2.4} strokeLinecap="round" fill="none" opacity={0.85}>
          <Path d="M-6 -29 Q-10 -35 -6 -41 Q-2 -47 -6 -53" />
          <Path d="M3 -31 Q-1 -37 3 -43 Q7 -49 3 -55" />
          <Path d="M11 -28 Q8 -33 11 -38" />
        </G>
      ) : null}
    </G>
  );
}

/* ---------- the theater ---------- */
function Stage({ k }: { k: Ink }) {
  const seat = (x: number) => (
    <Path
      key={x}
      d={`M${x - 22} 172 L${x - 22} 160 Q${x - 22} 148 ${x - 10} 148 L${x + 10} 148 Q${x + 22} 148 ${x + 22} 160 L${x + 22} 172 Z`}
      fill="#1B1024"
      stroke="#4A2F52"
      strokeWidth={1.5}
    />
  );
  return (
    <Frame label="A small theater with the red curtain open on an empty stage, lit by a spotlight, with the dark backs of four audience seats along the bottom">
      <Theater />
      {[60, 120, 180, 240].map(seat)}
      <Cap k={k} s="The curtain is always up" />
    </Frame>
  );
}

function Wings({ k }: { k: Ink }) {
  return (
    <Frame label="The same empty, lit stage. Three small gray figures wait in the wings at the left: two stand just behind the curtain edge, and the third has stepped out onto the stage">
      <Theater>
        <G opacity={0.8}>
          <Person x={58} y={148} s={0.85} fill={k.muted} />
        </G>
        <G opacity={0.8}>
          <Person x={92} y={148} s={0.85} fill={k.muted} />
        </G>
        <G opacity={0.8}>
          <Person x={128} y={152} s={0.85} fill={k.muted} />
          <Ellipse cx={146} cy={151} rx={7} ry={3} fill={k.muted} />
        </G>
      </Theater>
      <Cap k={k} s="Whatever is nearest walks on" />
    </Frame>
  );
}

function Filled({ k }: { k: Ink }) {
  return (
    <Frame label="The same stage with a person cooking at a small table in the spotlight, a pot steaming. In the left wing one gray shadowy figure turns away toward the dark">
      <Theater>
        <G opacity={0.3} transform="rotate(-16 64 148)">
          <Person x={64} y={148} s={1.05} fill={k.muted} />
        </G>
        <G opacity={0.6} transform="rotate(-10 80 148)">
          <Person x={80} y={148} s={1.05} fill={k.muted} />
        </G>
        <Rect x={152} y={120} width={62} height={5} rx={2} fill="#5E3A1A" />
        <Rect x={157} y={125} width={5} height={21} fill="#5E3A1A" />
        <Rect x={204} y={125} width={5} height={21} fill="#5E3A1A" />
        <Pot x={184} y={120} s={1.1} steam />
        <Person x={130} y={146} s={1.15} fill={k.acc} face={k.bg} />
        <Path d="M142 114 Q150 118 164 112" stroke={k.acc} strokeWidth={6} strokeLinecap="round" fill="none" />
        <Line x1={164} y1={112} x2={176} y2={98} stroke="#D9A27E" strokeWidth={2.6} strokeLinecap="round" />
      </Theater>
      <Cap k={k} s="The part is already taken" />
    </Frame>
  );
}

/* ---------- fifteen minutes alone ---------- */
function ButtonRoom({ k }: { k: Ink }) {
  return (
    <Frame label="A bare plain room. A person sits on a chair at a small plain table, with a hand resting by an hourglass and a small box with one round red button and a wire running off it">
      <Rect x={10} y={10} width={280} height={162} rx={12} fill="#E4D7C0" />
      <Path d="M10 108 L290 108 L290 148 L10 148 Z" fill="#CDBB9E" />
      <Line x1={10} y1={108} x2={290} y2={108} stroke="#B8A685" strokeWidth={2} />
      <Path d="M10 148 L290 148 L290 160 Q290 172 278 172 L22 172 Q10 172 10 160 Z" fill="#A98963" />
      <Rect x={50} y={84} width={6} height={46} rx={3} fill="#7A4B2A" />
      <Rect x={50} y={126} width={52} height={6} rx={3} fill="#7A4B2A" />
      <Rect x={54} y={132} width={4} height={20} fill="#7A4B2A" />
      <Rect x={94} y={132} width={4} height={20} fill="#7A4B2A" />
      <Person x={80} y={126} s={1.2} fill={k.acc} face={k.bg} />
      <Rect x={86} y={120} width={36} height={9} rx={4.5} fill={k.acc} />
      <Rect x={114} y={127} width={8} height={24} rx={4} fill={k.acc} />
      <Rect x={113} y={148} width={17} height={5} rx={2.5} fill={BEAR_LINE} />
      <Rect x={122} y={112} width={146} height={6} rx={2} fill="#8A5A2B" />
      <Rect x={128} y={118} width={6} height={32} fill="#8A5A2B" />
      <Rect x={256} y={118} width={6} height={32} fill="#8A5A2B" />
      <Path d="M92 100 Q118 112 138 108" stroke={k.acc} strokeWidth={6} strokeLinecap="round" fill="none" />
      <Circle cx={139} cy={108} r={4.5} fill={k.acc} />
      <Hourglass x={162} y={112} s={1.1} />
      <Path
        d="M234 106 Q250 110 258 110 Q268 110 268 122 Q268 146 276 154 Q282 158 292 158"
        stroke={BEAR_LINE}
        strokeWidth={2.2}
        strokeLinecap="round"
        fill="none"
      />
      <Rect x={200} y={96} width={34} height={16} rx={3} fill="#5B6275" stroke={BEAR_LINE} strokeWidth={1.4} />
      <Rect x={207} y={93} width={20} height={3.5} rx={1.7} fill="#3B4152" />
      <Path d="M209 93 Q217 83 225 93 Z" fill="#E0283C" stroke="#7A1020" strokeWidth={1.4} strokeLinejoin="round" />
      <Path d="M212 90 Q214 86 217 85" stroke="#FF8C98" strokeWidth={1.6} strokeLinecap="round" fill="none" />
      <Cap k={k} s="Fifteen minutes, and a button" />
    </Frame>
  );
}

function Cheat({ k }: { k: Ink }) {
  return (
    <Frame label="A person on a sofa at home with an hourglass on a low table, one arm reaching toward a phone with a glowing screen on the side table">
      <Line x1={14} y1={160} x2={286} y2={160} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      <G transform="translate(48 0)">
        <Rect x={12} y={78} width={116} height={48} rx={12} fill="#6C5BA6" stroke={BEAR_LINE} strokeWidth={1.4} />
        <Rect x={6} y={98} width={20} height={48} rx={9} fill="#6C5BA6" stroke={BEAR_LINE} strokeWidth={1.4} />
        <Person x={92} y={124} s={1.15} fill={k.acc} face={k.bg} />
        <Rect x={18} y={144} width={6} height={12} fill={BEAR_LINE} />
        <Rect x={116} y={144} width={6} height={12} fill={BEAR_LINE} />
        <Rect x={12} y={118} width={116} height={26} rx={8} fill="#8E7FC4" stroke={BEAR_LINE} strokeWidth={1.4} />
        <Rect x={88} y={118} width={36} height={9} rx={4.5} fill={k.acc} />
        <Rect x={118} y={122} width={9} height={34} rx={4} fill={k.acc} />
        <Rect x={117} y={153} width={17} height={7} rx={3.5} fill={k.ink} />
        <Rect x={22} y={140} width={60} height={5} rx={2} fill="#7A4B2A" />
        <Rect x={26} y={145} width={4} height={15} fill="#7A4B2A" />
        <Rect x={74} y={145} width={4} height={15} fill="#7A4B2A" />
        <Hourglass x={52} y={140} s={0.7} />
        <Rect x={146} y={118} width={50} height={5} rx={2} fill="#7A4B2A" />
        <Rect x={152} y={123} width={4} height={37} fill="#7A4B2A" />
        <Rect x={186} y={123} width={4} height={37} fill="#7A4B2A" />
        <Phone x={171} y={104} rot={-10} />
        <Path d="M100 96 Q134 94 160 102" stroke={k.acc} strokeWidth={6} strokeLinecap="round" fill="none" />
        <Circle cx={162} cy={102} r={4.5} fill={k.acc} />
      </G>
      <Cap k={k} s="Many reached for a phone" />
    </Frame>
  );
}

/* ---------- where attention lands ---------- */
function Reach({ k }: { k: Ink }) {
  return (
    <Frame label="A person standing, with a dotted line of attention going from their head to a glowing phone on a shelf right beside them. A book, a guitar and running shoes sit further away, unlit">
      <Line x1={14} y1={160} x2={286} y2={160} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      <Rect x={100} y={112} width={190} height={6} rx={2} fill={BROWN} />
      <Path d="M112 118 L112 132 L124 118 Z M270 118 L270 132 L282 118 Z" fill={BROWN} />
      <G opacity={0.6}>
        <Rect x={152} y={86} width={11} height={26} rx={2} fill="#5B6B9A" stroke={BEAR_LINE} strokeWidth={1.2} />
        <Rect x={163} y={90} width={10} height={22} rx={2} fill="#7C8F6A" stroke={BEAR_LINE} strokeWidth={1.2} />
        <Rect x={173} y={84} width={12} height={28} rx={2} fill="#A5705A" stroke={BEAR_LINE} strokeWidth={1.2} />
        <Rect x={231} y={78} width={6} height={44} fill="#6B4423" stroke={BEAR_LINE} strokeWidth={1.2} />
        <Rect x={229} y={70} width={10} height={12} rx={2} fill="#4B2F18" stroke={BEAR_LINE} strokeWidth={1.2} />
        <Ellipse cx={206} cy={142} rx={17} ry={14} fill="#C98A4B" stroke={BEAR_LINE} strokeWidth={1.4} />
        <Ellipse cx={206} cy={122} rx={12} ry={10} fill="#C98A4B" stroke={BEAR_LINE} strokeWidth={1.4} />
        <Rect x={203} y={78} width={6} height={44} fill="#6B4423" stroke={BEAR_LINE} strokeWidth={1.2} />
        <Rect x={201} y={70} width={10} height={12} rx={2} fill="#4B2F18" stroke={BEAR_LINE} strokeWidth={1.2} />
        <Circle cx={206} cy={137} r={4.5} fill={BEAR_LINE} />
        <Shoe x={248} y={112} s={0.75} fill={ORANGE} />
        <Shoe x={270} y={112} s={0.75} fill={ORANGE} />
      </G>
      <Phone x={126} y={98} />
      <Person x={52} y={160} s={1.35} fill={k.ink} face={k.bg} />
      <Path d="M62 84 Q92 60 120 84" stroke={k.acc} strokeWidth={3.2} strokeDasharray="1 7" strokeLinecap="round" fill="none" />
      <Circle cx={121} cy={86} r={3.6} fill={k.acc} />
      <Cap k={k} s="It lands on what is closest" />
    </Frame>
  );
}

/* ---------- the day's hours ---------- */
const BLOCK_Y = 84;
const blockX = (i: number) => 15 + i * 46;
const EMPTY = 4;

/* a strip of six hour blocks, no times: five hold a small drawn thing, and the fifth is the one nobody claimed (claimed 0 to 1 fills it) */
function Hours({ k, claimed }: { k: Ink; claimed: number }) {
  const cy = 112;
  const cx = (i: number) => blockX(i) + 20;
  const c0 = cx(0);
  const c1 = cx(1);
  const c2 = cx(2);
  const c3 = cx(3);
  const c5 = cx(5);
  return (
    <G>
      {[0, 1, 2, 3, 5].map((i) => (
        <Rect key={i} x={blockX(i)} y={BLOCK_Y} width={40} height={56} rx={10} fill={CREAM} stroke={BEAR_LINE} strokeWidth={1.6} />
      ))}
      {claimed < 1 ? (
        <Rect
          x={blockX(EMPTY)}
          y={BLOCK_Y}
          width={40}
          height={56}
          rx={10}
          fill="none"
          stroke={k.muted}
          strokeWidth={2.2}
          strokeDasharray="5 4"
          opacity={1 - claimed}
        />
      ) : null}
      {claimed > 0 ? (
        <Rect x={blockX(EMPTY)} y={BLOCK_Y} width={40} height={56} rx={10} fill={k.acc} stroke={BEAR_LINE} strokeWidth={1.6} opacity={claimed} />
      ) : null}

      <Path
        d={`M${c0 - 5} 106 L${c0 - 5} 102 Q${c0 - 5} 99 ${c0 - 2} 99 L${c0 + 2} 99 Q${c0 + 5} 99 ${c0 + 5} 102 L${c0 + 5} 106`}
        stroke={BEAR_LINE}
        strokeWidth={2.2}
        fill="none"
      />
      <Rect x={c0 - 13} y={106} width={26} height={18} rx={3} fill={BROWN} stroke={BEAR_LINE} strokeWidth={1.2} />
      <Line x1={c0 - 13} y1={113} x2={c0 + 13} y2={113} stroke={BEAR_LINE} strokeWidth={1} opacity={0.5} />
      <Rect x={c0 - 2} y={111} width={4} height={5} rx={1} fill={GOLD} />

      <Circle cx={c1 - 4} cy={cy} r={11} fill={WHITE} stroke={BEAR_LINE} strokeWidth={1.4} />
      <Circle cx={c1 - 4} cy={cy} r={6.5} fill="none" stroke="#D5CDE8" strokeWidth={1.2} />
      <Circle cx={c1 - 4} cy={cy} r={3.2} fill="#E9A23B" />
      <Path
        d={`M${c1 + 10} 102 L${c1 + 10} 109 M${c1 + 13} 102 L${c1 + 13} 109 M${c1 + 16} 102 L${c1 + 16} 109`}
        stroke={BEAR_LINE}
        strokeWidth={1.4}
        strokeLinecap="round"
      />
      <Path d={`M${c1 + 10} 109 Q${c1 + 13} 113 ${c1 + 16} 109`} stroke={BEAR_LINE} strokeWidth={1.4} fill="none" />
      <Line x1={c1 + 13} y1={112} x2={c1 + 13} y2={124} stroke={BEAR_LINE} strokeWidth={1.8} strokeLinecap="round" />

      <Person x={c2 - 9} y={126} s={0.45} fill={BEAR_LINE} />
      <Person x={c2 + 9} y={126} s={0.52} fill={ORANGE} />

      <Rect x={c3 - 10} y={99} width={20} height={26} rx={2} fill="#3F7FBF" stroke={BEAR_LINE} strokeWidth={1.2} />
      <Rect x={c3 + 6} y={101} width={4} height={22} fill={WHITE} />
      <Rect x={c3 - 7} y={106} width={10} height={3} rx={1} fill={GOLD} />
      <Rect x={c3 - 7} y={112} width={7} height={2} rx={1} fill={GOLD} opacity={0.7} />

      <Shoe x={c5} y={124} s={1.1} fill={ORANGE} />
    </G>
  );
}

function Unclaimed({ k }: { k: Ink }) {
  return (
    <Frame label="A strip of six hour blocks. Five hold small drawings: a briefcase, a plate and fork, two people, a book and a shoe. One is empty, with a dashed outline, and a glowing phone hovers half inside it">
      <Hours k={k} claimed={0} />
      <Phone x={blockX(EMPTY) + 20} y={BLOCK_Y} s={1.35} rot={8} />
      <Cap k={k} s="The hour nobody claimed" />
    </Frame>
  );
}

function Flag({ k }: { k: Ink }) {
  const still = useReducedMotion();
  const v = useAppear(300, 900, Easing.out(Easing.cubic));
  const [p, setP] = useState(still ? 1 : 0);
  useEffect(() => {
    const id = v.addListener(({ value }) => setP(value));
    return () => v.removeListener(id);
  }, [v]);
  const cx = blockX(EMPTY) + 20;
  const drop = (1 - p) * -14;
  return (
    <Frame label="The same strip of hour blocks. A person stands on the empty one planting a small flag in it, and that block is now filled with the lesson's color">
      <Hours k={k} claimed={p} />
      <Person x={cx - 8} y={BLOCK_Y} s={0.9} fill={k.ink} face={k.bg} />
      <G transform={`translate(0 ${drop})`} opacity={p}>
        <Path d={`M${cx - 6} 62 Q${cx + 2} 68 ${cx + 10} 70`} stroke={k.ink} strokeWidth={5} strokeLinecap="round" fill="none" />
        <Line x1={cx + 11} y1={90} x2={cx + 11} y2={48} stroke={BROWN} strokeWidth={2.6} strokeLinecap="round" />
        <Path d={`M${cx + 12} 48 L${cx + 34} 55 L${cx + 12} 63 Z`} fill={GOLD} stroke={BEAR_LINE} strokeWidth={1.3} strokeLinejoin="round" />
      </G>
      <Cap k={k} s="An hour you claim is yours" />
    </Frame>
  );
}

/* ---------- the plan on paper ---------- */
function Planner({ k }: { k: Ink }) {
  const row = (y: number, scribble: string, done: boolean, art: ReactNode) => (
    <G>
      {art}
      <Path d={scribble} stroke={BEAR_LINE} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.7} />
      {done ? <Path d={`M252 ${y} l5 5 l10 -11`} stroke={GREEN} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" fill="none" /> : null}
    </G>
  );
  return (
    <Frame label="An open paper planner seen from above with a pencil on it. Three short lines of scribble each have a small drawing beside them: a running shoe, a cooking pot and a phone call. The shoe and the pot are checked off">
      <G transform="rotate(-4 150 90)">
        <Rect x={27} y={27} width={256} height={136} rx={8} fill="#000000" opacity={0.15} />
        <Rect x={22} y={22} width={256} height={136} rx={8} fill={k.acc} stroke={BEAR_LINE} strokeWidth={1.6} />
        <Rect x={30} y={28} width={118} height={124} rx={3} fill="#FFFBF0" stroke={BEAR_LINE} strokeWidth={1.2} />
        <Rect x={152} y={28} width={118} height={124} rx={3} fill="#FFFBF0" stroke={BEAR_LINE} strokeWidth={1.2} />
        {[52, 70, 88, 106, 124, 142].map((y) => (
          <Line key={y} x1={40} y1={y} x2={138} y2={y} stroke="#E3DFF2" strokeWidth={2} />
        ))}
        {row(56, 'M196 58 Q202 52 208 58 Q214 64 220 58 Q226 52 232 58 Q238 62 244 56', true, <Shoe x={174} y={64} s={0.95} fill={ORANGE} />)}
        {row(92, 'M196 94 Q203 88 210 94 Q217 100 224 94 Q230 90 236 93', true, <Pot x={174} y={102} s={1} fill={GRAY} steam />)}
        {row(
          132,
          'M196 132 Q202 126 208 132 Q214 138 220 132 Q226 126 232 131 Q238 135 244 130',
          false,
          <G transform="translate(174 130)">
            <Path d="M-14 -2 Q0 -14 14 -2" stroke={DARK} strokeWidth={5} strokeLinecap="round" fill="none" />
            <Rect x={-17} y={-4} width={8} height={10} rx={3} fill={DARK} />
            <Rect x={9} y={-4} width={8} height={10} rx={3} fill={DARK} />
            <Path d="M20 -12 Q25 -6 20 0 M24 -16 Q31 -6 24 4" stroke={GREEN} strokeWidth={1.8} strokeLinecap="round" fill="none" />
          </G>,
        )}
        <G transform="translate(78 124) rotate(-28)">
          <Rect x={-44} y={-3.5} width={62} height={7} rx={1.5} fill={GOLD} stroke={BEAR_LINE} strokeWidth={1.3} />
          <Path d="M18 -3.5 L32 0 L18 3.5 Z" fill="#F2D5B0" stroke={BEAR_LINE} strokeWidth={1.3} strokeLinejoin="round" />
          <Path d="M28 -1 L32 0 L28 1 Z" fill={BEAR_LINE} />
          <Rect x={-50} y={-3.5} width={7} height={7} rx={2} fill="#E58A9A" stroke={BEAR_LINE} strokeWidth={1.3} />
        </G>
      </G>
      <Cap k={k} s="Small, real things, planned" />
    </Frame>
  );
}

export const SCENES_L23: Record<string, ComponentType<{ k: Ink }>> = {
  'l22-stage': Stage,
  'l22-wings': Wings,
  'l22-button-room': ButtonRoom,
  'l22-cheat': Cheat,
  'l22-reach': Reach,
  'l22-unclaimed': Unclaimed,
  'l22-flag': Flag,
  'l22-planner': Planner,
  'l22-filled': Filled,
};
