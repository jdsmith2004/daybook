/* Scenes for lessons told as a story (see story-kit.tsx and story-scenes-h.tsx): lesson 52 (Monte Carlo, August 1913: the wheel has no
   memory, and a near miss is still a miss) and lesson 53 (a secret sets you apart; a debt is a number with an end; tell one person and
   share the keys). The casino is drawn a little muted, never glamorous, and the way out is drawn warm. Every person is a simple, fully
   clothed figure. */
import { type ComponentType, type ReactNode } from 'react';
import { ClipPath, Circle, Defs, Ellipse, G, Line, Path, Rect } from 'react-native-svg';

import { Frame, type Ink, Person, Say } from './story-kit';

const BROWN = '#8A5A2B';
const DARKWOOD = '#6B4226';
const MIDWOOD = '#9B6A3C';
const WOOD = '#C9965B';
const GOLD = '#FFD25A';
const BRASS = '#C99A3A';
const WHITE = '#FFFFFF';
const GREEN = '#3F8F5B';
const DKGREEN = '#2F7A4B';
const SKIN = '#E8B98F';
const BLUE = '#4F6FA8';
const TEAL = '#3F8F8A';
const BRICK = '#B5533C';
const TERRA = '#C2664B';
const CREAM = '#F6E3C6';
const PAPER = '#FFF6DE';
const BLACK = '#2B2530';
const HAT = '#3A3340';
const COAT = '#4B5A78';
const AMBER = '#E0A33C';
const SLATE = '#5E6E86';
/* the casino, muted */
const FELT = '#3F5B4B';
const FELT_DK = '#33493D';
const CASINO_WALL = '#5A4540';
const WINE_RED = '#A4453D';
const DUSK = '#4F4458';
const DUSK_DK = '#3B3342';
const DIM = '#4A4256';

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

/* a man of 1913 in a bowler hat and a long coat: x and y are his feet, lean tips him toward the right */
function Gent({ x, y, s = 1, lean = 0, coat }: { x: number; y: number; s?: number; lean?: number; coat: string }) {
  return (
    <G transform={`translate(${x} ${y}) rotate(${lean}) scale(${s})`}>
      <Ellipse cx={-5} cy={-1} rx={5.5} ry={2.4} fill={BLACK} />
      <Ellipse cx={6} cy={-1} rx={5.5} ry={2.4} fill={BLACK} />
      <Rect x={-8} y={-12} width={6} height={10} fill={HAT} />
      <Rect x={2} y={-12} width={6} height={10} fill={HAT} />
      <Path d="M-13 -8 L-12 -34 Q-12 -42 0 -42 Q12 -42 12 -34 L13 -8 Z" fill={coat} />
      <Circle cx={0} cy={-51} r={8.5} fill={coat} />
      <Circle cx={4} cy={-50} r={1.5} fill={WHITE} />
      <Path d="M-8 -56 Q-8 -67 0 -67 Q8 -67 8 -56 Z" fill={HAT} />
      <Ellipse cx={0} cy={-56} rx={12} ry={2.6} fill={HAT} />
    </G>
  );
}

/* a woman of 1913 in a long dress and a wide hat: x and y are her feet */
function Lady({ x, y, s = 1, lean = 0, dress, ribbon = '#8B5A6E' }: { x: number; y: number; s?: number; lean?: number; dress: string; ribbon?: string }) {
  return (
    <G transform={`translate(${x} ${y}) rotate(${lean}) scale(${s})`}>
      <Path d="M-7 -34 L-19 -1 Q0 4 19 -1 L7 -34 Z" fill={dress} />
      <Path d="M-8 -32 Q-10 -50 0 -52 Q10 -50 8 -32 Z" fill={dress} />
      <Circle cx={0} cy={-59} r={8} fill={dress} />
      <Circle cx={3.5} cy={-58.5} r={1.5} fill={WHITE} />
      <Path d="M-8 -64 Q-8 -75 0 -75 Q8 -75 8 -64 Z" fill={HAT} />
      <Ellipse cx={0} cy={-64} rx={16} ry={3.6} fill={HAT} />
      <Rect x={-8} y={-67.5} width={16} height={2.8} fill={ribbon} />
      <Path d="M4 -73 Q13 -80 14 -70" fill="none" stroke={ribbon} strokeWidth={1.6} strokeLinecap="round" />
    </G>
  );
}

/* a stack of chips, muted: x and y are the middle of the bottom edge */
function Stack({ x, y, n, fill, edge }: { x: number; y: number; n: number; fill: string; edge: string }) {
  return (
    <G>
      {Array.from({ length: n }, (_, i) => {
        const b = y - i * 3.6;
        return (
          <G key={i}>
            <Rect x={x - 10} y={b - 3.6} width={20} height={3.6} fill={edge} />
            <Ellipse cx={x} cy={b} rx={10} ry={3.6} fill={edge} />
            <Ellipse cx={x} cy={b - 3.6} rx={10} ry={3.6} fill={fill} />
            <Ellipse cx={x} cy={b - 3.6} rx={6.4} ry={2.2} fill="none" stroke={CREAM} strokeWidth={1} strokeDasharray="3 3" opacity={0.7} />
          </G>
        );
      })}
    </G>
  );
}

/* a hand, fingers pointing right at dir 1 and left at dir -1 */
function Hand({ x, y, s = 1, dir = 1, rot = 0 }: { x: number; y: number; s?: number; dir?: 1 | -1; rot?: number }) {
  return (
    <G transform={`translate(${x} ${y}) rotate(${rot}) scale(${dir * s} ${s})`}>
      <Rect x={-8} y={-6} width={15} height={12} rx={5} fill={SKIN} />
      <Rect x={5} y={-6} width={11} height={3.8} rx={1.9} fill={SKIN} />
      <Rect x={5} y={-1.9} width={12} height={3.8} rx={1.9} fill={SKIN} />
      <Rect x={5} y={2.2} width={10} height={3.8} rx={1.9} fill={SKIN} />
      <Ellipse cx={3} cy={-7} rx={6} ry={3} fill={SKIN} transform="rotate(-14 3 -7)" />
    </G>
  );
}

/* a folded paper with a sum on it: x and y are the middle */
function Paper({ x, y, rot = 0, s = 1 }: { x: number; y: number; rot?: number; s?: number }) {
  return (
    <G transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <Rect x={-8} y={-10} width={16} height={20} rx={2} fill={PAPER} stroke={BROWN} strokeWidth={0.9} />
      <Path d="M3 -10 L8 -5 L3 -5 Z" fill={CREAM} stroke={BROWN} strokeWidth={0.7} strokeLinejoin="round" />
      <Say x={-1} y={0} s="$" fill={BLACK} size={9} />
      <Rect x={-5} y={3} width={10} height={1.6} rx={0.8} fill={BLACK} opacity={0.7} />
      <Rect x={-5} y={6.4} width={7} height={1.6} rx={0.8} fill={BLACK} opacity={0.5} />
    </G>
  );
}

/* a pendant lamp with a warm glow */
function Pendant({ x, drop = 26 }: { x: number; drop?: number }) {
  return (
    <G>
      <Path d={`M${x - 14} 150 L${x - 44} ${drop + 12} L${x + 44} ${drop + 12} L${x + 14} 150 Z`} fill={GOLD} opacity={0.12} />
      <Line x1={x} y1={10} x2={x} y2={drop} stroke={DARKWOOD} strokeWidth={2} />
      <Path d={`M${x - 14} ${drop + 12} Q${x - 14} ${drop} ${x} ${drop} Q${x + 14} ${drop} ${x + 14} ${drop + 12} Z`} fill={AMBER} />
      <Circle cx={x} cy={drop + 14} r={5} fill={GOLD} />
    </G>
  );
}

/* a cherry pair, for a slot window */
function Cherry({ x, y }: { x: number; y: number }) {
  return (
    <G>
      <Path d={`M${x - 5} ${y + 4} Q${x - 4} ${y - 6} ${x + 1} ${y - 11}`} fill="none" stroke={DKGREEN} strokeWidth={1.4} strokeLinecap="round" />
      <Path d={`M${x + 5} ${y + 6} Q${x + 4} ${y - 4} ${x + 1} ${y - 11}`} fill="none" stroke={DKGREEN} strokeWidth={1.4} strokeLinecap="round" />
      <Ellipse cx={x + 7} cy={y - 9} rx={5} ry={2.4} fill={GREEN} transform={`rotate(-20 ${x + 7} ${y - 9})`} />
      <Circle cx={x - 5} cy={y + 5} r={5.4} fill={WINE_RED} />
      <Circle cx={x + 5} cy={y + 7} r={5.4} fill={WINE_RED} />
      <Circle cx={x - 6.6} cy={y + 3.4} r={1.3} fill={WHITE} opacity={0.6} />
      <Circle cx={x + 3.4} cy={y + 5.4} r={1.3} fill={WHITE} opacity={0.6} />
    </G>
  );
}

/* ---------- lesson 52: Monte Carlo, August 1913 ---------- */
function Wheel52({ k }: { k: Ink }) {
  const stripes = Array.from({ length: 8 }, (_, i) => i);
  const dots = Array.from({ length: 8 }, (_, i) => i);
  return (
    <Frame label="A casino in 1913: a crowd of people in bowler hats, wide hats and long dresses lean toward a roulette table with a wheel, and beside the wheel a small board shows a long column of black dots">
      <Panel id="h8-wheel" fill={CASINO_WALL}>
        {stripes.map((i) => (
          <Rect key={i} x={10 + i * 36} y={10} width={18} height={152} fill={BLACK} opacity={0.08} />
        ))}
        <Rect x={10} y={126} width={280} height={36} fill={DUSK_DK} />
        <Rect x={10} y={125} width={280} height={3} fill={DARKWOOD} opacity={0.7} />
        <Path d="M96 16 Q150 36 204 16" fill="none" stroke={BRASS} strokeWidth={2} opacity={0.7} />
        {[104, 150, 196].map((cx, i) => (
          <G key={cx}>
            <Line x1={cx} y1={i === 1 ? 29 : 24} x2={cx} y2={i === 1 ? 34 : 29} stroke={BRASS} strokeWidth={1.6} />
            <Circle cx={cx} cy={i === 1 ? 37 : 32} r={3.6} fill={AMBER} opacity={0.75} />
          </G>
        ))}
        <Rect x={238} y={26} width={34} height={86} rx={4} fill={PAPER} stroke={BRASS} strokeWidth={3} />
        {dots.map((i) => (
          <Circle key={i} cx={255} cy={37 + i * 9.6} r={3.6} fill={BLACK} />
        ))}
        <Gent x={170} y={124} s={0.9} lean={6} coat="#5B6A5A" />
        <Gent x={26} y={154} s={1} lean={4} coat="#4B4A5E" />
        <Lady x={50} y={156} s={0.95} lean={5} dress="#7A5A6E" ribbon="#B5836A" />
        <Gent x={76} y={154} s={1.05} lean={6} coat="#6A4B4B" />
        <Lady x={102} y={156} s={1} lean={6} dress={SLATE} ribbon="#8B5A6E" />
        <Gent x={128} y={154} s={0.95} lean={7} coat="#58506A" />
        <Path d="M150 112 L288 112 L296 134 L142 134 Z" fill={FELT} />
        <Rect x={142} y={134} width={148} height={28} fill={DARKWOOD} />
        <Rect x={142} y={133} width={148} height={3} fill={MIDWOOD} />
        <Path d="M158 118 L240 118 M158 118 L152 130 M184 118 L180 130" fill="none" stroke={CREAM} strokeWidth={1} opacity={0.3} />
        <Stack x={158} y={130} n={3} fill={WINE_RED} edge="#7A302B" />
        <Stack x={266} y={128} n={2} fill="#C9B58A" edge="#8F7E58" />
        <Ellipse cx={205} cy={127} rx={37} ry={12} fill={DARKWOOD} />
        <Ellipse cx={205} cy={124} rx={37} ry={12} fill={MIDWOOD} />
        <Ellipse cx={205} cy={124} rx={30} ry={9.6} fill={FELT_DK} />
        <Ellipse cx={205} cy={124} rx={24} ry={8} fill="none" stroke={BLACK} strokeWidth={6} />
        <Ellipse cx={205} cy={124} rx={24} ry={8} fill="none" stroke={WINE_RED} strokeWidth={6} strokeDasharray="4.455 4.455" />
        <Ellipse cx={205} cy={124} rx={16} ry={5.2} fill={MIDWOOD} />
        <Ellipse cx={205} cy={123.4} rx={4.4} ry={1.8} fill={GOLD} />
        <Circle cx={227.2} cy={127} r={2.2} fill={WHITE} />
      </Panel>
      <Cap k={k} s="Black, again and again" />
    </Frame>
  );
}

function Red52({ k }: { k: Ink }) {
  return (
    <Frame label="Close on a roulette table: a pile of chips on the red square, a hand placing one more on top, and beside it the wheel with the ball resting in a black pocket">
      <Panel id="h8-red" fill={FELT}>
        <Rect x={14} y={14} width={160} height={144} rx={8} fill="none" stroke={CREAM} strokeWidth={1.2} opacity={0.3} />
        <Rect x={72} y={74} width={64} height={64} rx={5} fill={WINE_RED} stroke={CREAM} strokeWidth={2.4} transform="rotate(45 104 106)" />
        <Rect x={86} y={88} width={36} height={36} rx={3} fill="none" stroke={CREAM} strokeWidth={1} opacity={0.45} transform="rotate(45 104 106)" />
        <Stack x={86} y={128} n={4} fill="#C9B58A" edge="#8F7E58" />
        <Stack x={122} y={134} n={3} fill={BLUE} edge="#3B5280" />
        <Stack x={104} y={112} n={5} fill="#7A302B" edge="#5C2420" />
        <Stack x={50} y={150} n={2} fill={WINE_RED} edge="#7A302B" />
        <Line x1={46} y1={4} x2={98} y2={50} stroke={COAT} strokeWidth={17} strokeLinecap="round" />
        <Hand x={108} y={58} rot={72} s={0.95} />
        <Ellipse cx={114} cy={77} rx={10} ry={3.6} fill="#8F7E58" />
        <Ellipse cx={114} cy={75} rx={10} ry={3.6} fill="#C9B58A" />
        <Ellipse cx={114} cy={75} rx={6.4} ry={2.2} fill="none" stroke={CREAM} strokeWidth={1} strokeDasharray="3 3" opacity={0.7} />
        <Circle cx={230} cy={100} r={55} fill={DARKWOOD} />
        <Circle cx={230} cy={100} r={47} fill="#3B2A20" />
        <Circle cx={230} cy={100} r={36} fill="none" stroke={BLACK} strokeWidth={14} />
        <Circle cx={230} cy={100} r={36} fill="none" stroke={WINE_RED} strokeWidth={14} strokeDasharray="6.283 6.283" />
        <Circle cx={230} cy={100} r={29} fill={MIDWOOD} />
        <Circle cx={230} cy={100} r={21} fill={BRASS} opacity={0.5} />
        <Line x1={209} y1={100} x2={251} y2={100} stroke={DARKWOOD} strokeWidth={2.4} strokeLinecap="round" />
        <Line x1={230} y1={79} x2={230} y2={121} stroke={DARKWOOD} strokeWidth={2.4} strokeLinecap="round" />
        <Circle cx={230} cy={100} r={5.5} fill={GOLD} />
        <Circle cx={265.4} cy={110.4} r={4.6} fill={BLACK} opacity={0.3} />
        <Circle cx={264.8} cy={109.3} r={3.8} fill={WHITE} />
      </Panel>
      <Cap k={k} s="Surely red was due" />
    </Frame>
  );
}

function NearMiss({ k }: { k: Ink }) {
  return (
    <Frame label="A simple slot machine with three windows showing a cherry, a cherry and a lemon that is just slipping below the line, with a small arc showing it moving, and a hand on the lever">
      <Panel id="h8-near" fill={DUSK}>
        <Rect x={10} y={140} width={280} height={22} fill={DUSK_DK} />
        <Ellipse cx={150} cy={149} rx={64} ry={4.4} fill={BLACK} opacity={0.25} />
        <Rect x={98} y={22} width={104} height={124} rx={10} fill="#8A4F4B" stroke="#C9B58A" strokeWidth={3} />
        <Rect x={108} y={30} width={84} height={16} rx={5} fill={DUSK_DK} />
        {[128, 150, 172].map((cx) => (
          <Circle key={cx} cx={cx} cy={38} r={3} fill={BRASS} />
        ))}
        <Rect x={108} y={52} width={84} height={52} rx={6} fill="#2F2A36" />
        {[112, 138, 164].map((x) => (
          <Rect key={x} x={x} y={56} width={24} height={44} rx={3} fill={CREAM} />
        ))}
        <Cherry x={124} y={78} />
        <Cherry x={150} y={78} />
        <G>
          <Path d="M167 92 L165 90.6 M185 92 L187 90.6" stroke="#C9AC2E" strokeWidth={2.4} strokeLinecap="round" />
          <Ellipse cx={176} cy={92} rx={9.6} ry={6.6} fill="#E3C94A" />
          <Ellipse cx={173} cy={90} rx={3.6} ry={1.8} fill={WHITE} opacity={0.5} />
        </G>
        <Line x1={108} y1={78} x2={192} y2={78} stroke="#B33A3A" strokeWidth={1.6} opacity={0.85} />
        <Path d="M168 62 Q186 66 181 80" fill="none" stroke={DUSK_DK} strokeWidth={1.8} strokeLinecap="round" strokeDasharray="3 3" />
        <Path d="M177.6 77.6 L182.4 79.4 L180.4 83.6 Z" fill={DUSK_DK} />
        {[122, 150, 178].map((cx) => (
          <Circle key={cx} cx={cx} cy={116} r={4.4} fill="#C9B58A" />
        ))}
        <Rect x={114} y={126} width={72} height={12} rx={4} fill={DUSK_DK} />
        <Rect x={202} y={72} width={6} height={22} rx={2} fill={BRASS} />
        <Path d="M206 86 Q220 84 220 62" fill="none" stroke={BRASS} strokeWidth={4} strokeLinecap="round" />
        <Circle cx={220} cy={57} r={7} fill={WINE_RED} />
        <Circle cx={218} cy={55} r={2} fill={WHITE} opacity={0.4} />
        <Line x1={300} y1={92} x2={240} y2={78} stroke={COAT} strokeWidth={15} strokeLinecap="round" />
        <Circle cx={228} cy={75} r={8} fill={SKIN} />
        <Rect x={217} y={69} width={11} height={4} rx={2} fill={SKIN} />
        <Rect x={217} y={74} width={11} height={4} rx={2} fill={SKIN} />
        <Rect x={218} y={79} width={10} height={4} rx={2} fill={SKIN} />
      </Panel>
      <Cap k={k} s="So close, and just as far" />
    </Frame>
  );
}

function WalkAway({ k }: { k: Ink }) {
  return (
    <Frame label="A person walks out through a doorway into warm daylight, sliding a phone into a pocket, while behind them a dim room holds a screen showing playing cards">
      <Panel id="h8-walk" fill="#FBE3AE">
        <Circle cx={248} cy={42} r={30} fill={GOLD} opacity={0.35} />
        <Circle cx={248} cy={42} r={16} fill={GOLD} />
        <Rect x={146} y={124} width={144} height={38} fill="#9CC083" />
        <Ellipse cx={230} cy={128} rx={60} ry={8} fill="#B3D096" />
        <Rect x={268} y={84} width={7} height={46} fill={DARKWOOD} />
        <Circle cx={271} cy={74} r={22} fill={GREEN} />
        <Circle cx={260} cy={84} r={14} fill={DKGREEN} />
        <Path d="M170 150 Q220 138 290 148 L290 162 L170 162 Z" fill="#E8D3A2" />
        <Rect x={10} y={10} width={136} height={152} fill={DIM} />
        <Rect x={10} y={138} width={136} height={24} fill={DUSK_DK} />
        <Path d="M146 136 L70 162 L150 162 Z" fill={GOLD} opacity={0.22} />
        <Rect x={22} y={112} width={100} height={6} rx={2} fill={DARKWOOD} />
        <Rect x={30} y={118} width={6} height={28} fill={DARKWOOD} />
        <Rect x={108} y={118} width={6} height={28} fill={DARKWOOD} />
        <Rect x={36} y={54} width={72} height={50} rx={4} fill="#2B2733" />
        <Rect x={41} y={59} width={62} height={40} rx={2} fill="#3A3550" />
        <G transform="rotate(-9 58 78)">
          <Rect x={50} y={66} width={17} height={24} rx={2.4} fill={PAPER} opacity={0.85} />
          <Path d="M58.5 74 L62 78.5 L58.5 83 L55 78.5 Z" fill={WINE_RED} />
        </G>
        <G transform="rotate(8 82 78)">
          <Rect x={74} y={66} width={17} height={24} rx={2.4} fill={PAPER} opacity={0.85} />
          <Circle cx={82.5} cy={78} r={3.4} fill={BLACK} />
        </G>
        <Rect x={67} y={104} width={10} height={8} fill="#2B2733" />
        <Rect x={146} y={10} width={9} height={152} fill={DARKWOOD} />
        <Rect x={146} y={150} width={36} height={12} fill={MIDWOOD} />
        <Ellipse cx={186} cy={153} rx={22} ry={3} fill={DARKWOOD} opacity={0.2} />
        <G transform="translate(186 152) scale(1.2)">
          <Circle cx={0} cy={-48} r={11} fill={TEAL} />
          <Path d="M-17 0 L-17 -16 Q-17 -33 0 -33 Q17 -33 17 -16 L17 0 Z" fill={TEAL} />
          <Circle cx={4} cy={-47} r={1.8} fill={WHITE} />
          <Path d="M13 -30 Q22 -22 17 -10" fill="none" stroke="#2F7470" strokeWidth={6} strokeLinecap="round" />
          <Rect x={10} y={-12} width={8} height={4} rx={1.2} fill="#2F7470" />
          <G transform="rotate(-18 17 -10)">
            <Rect x={14} y={-21} width={7} height={12} rx={1.6} fill={BLACK} />
            <Rect x={15.2} y={-19.6} width={4.6} height={8} rx={0.8} fill="#6F86A8" />
          </G>
          <Circle cx={17} cy={-9} r={3} fill={SKIN} />
        </G>
      </Panel>
      <Cap k={k} s="Gone, and done chasing" />
    </Frame>
  );
}

/* ---------- lesson 53: a secret sets you apart ---------- */

/* the dinner room both "apart" scenes share: the family at the table, the pane of frosted glass, and a lamp. wallW is how thick the pane is. */
function Dinner({ id, wallW, label, k, cap, children }: { id: string; wallW: number; label: string; k: Ink; cap: string; children: ReactNode }) {
  return (
    <Frame label={label}>
      <Panel id={id} fill="#EBCF9E">
        <Rect x={10} y={136} width={280} height={26} fill="#B98A5A" />
        <Rect x={10} y={135} width={280} height={3} fill={DARKWOOD} opacity={0.5} />
        <Pendant x={100} drop={24} />
        <Rect x={206} y={10} width={84} height={152} fill={BLACK} opacity={0.1} />
        <Person x={54} y={129} s={1} fill={BLUE} face={WHITE} />
        <Person x={98} y={129} s={1} fill="#C9704A" face={WHITE} />
        <Person x={142} y={129} s={0.78} fill={GREEN} face={WHITE} />
        <Rect x={24} y={112} width={160} height={7} rx={2} fill={MIDWOOD} />
        <Rect x={24} y={119} width={160} height={10} fill={DARKWOOD} />
        <Rect x={34} y={129} width={6} height={26} fill={DARKWOOD} />
        <Rect x={168} y={129} width={6} height={26} fill={DARKWOOD} />
        {[54, 98, 142].map((cx) => (
          <G key={cx}>
            <Ellipse cx={cx} cy={111} rx={11} ry={2.6} fill={CREAM} />
            <Ellipse cx={cx} cy={110.6} rx={6.5} ry={1.5} fill={WHITE} opacity={0.7} />
          </G>
        ))}
        <Circle cx={76} cy={106} r={6} fill={AMBER} />
        <Rect x={70} y={108} width={12} height={4} fill={AMBER} />
        {children}
        <Rect x={206 - wallW / 2} y={10} width={wallW} height={152} fill="#DCEBFA" opacity={0.8} />
        <Rect x={206 - wallW / 2 + 5} y={10} width={wallW - 10} height={152} fill={WHITE} opacity={0.18} />
        <Line x1={206 - wallW / 2} y1={10} x2={206 - wallW / 2} y2={162} stroke={WHITE} strokeWidth={2} opacity={0.9} />
        <Line x1={206 + wallW / 2} y1={10} x2={206 + wallW / 2} y2={162} stroke={WHITE} strokeWidth={2} opacity={0.9} />
        <Path
          d={`M${206 - wallW / 2 + 4} 60 L${206 + wallW / 2 - 4} 40 M${206 - wallW / 2 + 4} 100 L${206 + wallW / 2 - 4} 80`}
          stroke={WHITE}
          strokeWidth={1.6}
          strokeLinecap="round"
          opacity={0.7}
        />
      </Panel>
      <Cap k={k} s={cap} />
    </Frame>
  );
}

/* the one who sits apart, from the front, on a chair: x is the middle and y the hips */
function Apart({ x, y, head = 0, children }: { x: number; y: number; head?: number; children?: ReactNode }) {
  return (
    <G transform={`translate(${x} ${y})`}>
      <Rect x={-19} y={-42} width={38} height={46} rx={5} fill={MIDWOOD} />
      <Rect x={-16} y={8} width={5} height={26} fill={DARKWOOD} />
      <Rect x={11} y={8} width={5} height={26} fill={DARKWOOD} />
      <Rect x={-12} y={10} width={10} height={20} rx={4} fill={SLATE} />
      <Rect x={2} y={10} width={10} height={20} rx={4} fill={SLATE} />
      <Ellipse cx={-8} cy={31} rx={7.4} ry={3} fill={SLATE} />
      <Ellipse cx={8} cy={31} rx={7.4} ry={3} fill={SLATE} />
      <Path d="M-15 0 L-15 -16 Q-15 -31 0 -31 Q15 -31 15 -16 L15 0 Z" fill={SLATE} />
      <Rect x={-15} y={-2} width={30} height={11} rx={5} fill={SLATE} />
      <Rect x={-21} y={4} width={42} height={5} rx={2} fill={MIDWOOD} />
      <Circle cx={0 + head} cy={-43 + Math.abs(head) * 0.6} r={10} fill={SLATE} />
      <Circle cx={-3.6 + head} cy={-42 + Math.abs(head) * 0.6} r={1.7} fill={WHITE} />
      {children}
    </G>
  );
}

function ApartScene({ k }: { k: Ink }) {
  return (
    <Dinner
      id="h8-apart"
      wallW={22}
      k={k}
      cap="Set apart"
      label="A family sits close together at a dinner table under a warm lamp, while one person sits a little apart on a chair behind a pane of frosted glass that only they seem to see, a small folded paper with a sum on their lap">
      <Apart x={250} y={124}>
        <Paper x={0} y={0} rot={-8} s={0.85} />
      </Apart>
    </Dinner>
  );
}

function Twice({ k }: { k: Ink }) {
  return (
    <Dinner
      id="h8-twice"
      wallW={30}
      k={k}
      cap="It needs more secrets"
      label="The same dinner room, but the pane of frosted glass now stands taller: the person apart bends over a glowing phone with a betting screen of plain shapes, and a small stack of hidden envelopes is tucked behind their chair">
      <G>
        <G transform="rotate(-6 226 150)">
          <Rect x={215} y={143} width={24} height={14} rx={1.6} fill={CREAM} stroke={BROWN} strokeWidth={0.8} />
          <Path d="M215 143 L227 151 L239 143" fill="none" stroke={BROWN} strokeWidth={0.8} />
        </G>
        <G transform="rotate(5 228 144)">
          <Rect x={216} y={137} width={24} height={14} rx={1.6} fill={PAPER} stroke={BROWN} strokeWidth={0.8} />
          <Path d="M216 137 L228 145 L240 137" fill="none" stroke={BROWN} strokeWidth={0.8} />
        </G>
        <Circle cx={254} cy={108} r={30} fill="#9FC6E8" opacity={0.2} />
        <Apart x={254} y={124} head={-5}>
          <G transform="rotate(-14 -4 -2)">
            <Rect x={-10} y={-12} width={12} height={21} rx={2.2} fill={BLACK} />
            <Rect x={-8.6} y={-10.4} width={9.2} height={17.6} rx={1.2} fill="#4A5A78" />
            <Rect x={-7.4} y={-8.4} width={7} height={2} rx={1} fill="#C9B58A" opacity={0.85} />
            <Rect x={-7.4} y={-4.4} width={4.4} height={2} rx={1} fill="#7FB0A8" opacity={0.85} />
            <Circle cx={-2.4} cy={1.2} r={1.8} fill="#C9B58A" opacity={0.85} />
            <Rect x={-7.4} y={4} width={7} height={2} rx={1} fill="#7FB0A8" opacity={0.85} />
          </G>
        </Apart>
      </G>
    </Dinner>
  );
}

function Ledger({ k }: { k: Ink }) {
  const rows = Array.from({ length: 6 }, (_, i) => i);
  const cells = Array.from({ length: 35 }, (_, i) => i);
  return (
    <Frame label="A calm desk by a sunny window: an open ledger book with a column of sums, a written total with a line under it, a pencil, a little plant, and a wall calendar with the first days ticked off in green">
      <Panel id="h8-ledger" fill="#F1DDB8">
        <Rect x={22} y={18} width={44} height={36} rx={3} fill="#FBE3AE" stroke={DARKWOOD} strokeWidth={3} />
        <Line x1={44} y1={18} x2={44} y2={54} stroke={DARKWOOD} strokeWidth={2} />
        <Line x1={22} y1={36} x2={66} y2={36} stroke={DARKWOOD} strokeWidth={2} />
        <Circle cx={55} cy={27} r={5} fill={GOLD} />
        <Path d="M66 54 L84 100 L36 100 Z" fill={GOLD} opacity={0.12} />
        <Rect x={10} y={116} width={280} height={46} fill={WOOD} />
        <Rect x={10} y={114} width={280} height={4} fill={DARKWOOD} opacity={0.55} />
        <Rect x={28} y={58} width={164} height={64} rx={4} fill="#6B4A3A" />
        <Rect x={34} y={62} width={76} height={54} rx={2} fill={PAPER} />
        <Rect x={110} y={62} width={76} height={54} rx={2} fill="#FBEFD0" />
        <Rect x={108} y={62} width={4} height={54} fill={DARKWOOD} opacity={0.3} />
        {rows.map((i) => (
          <G key={i}>
            <Line x1={39} y1={72 + i * 7.6} x2={105} y2={72 + i * 7.6} stroke={BROWN} strokeWidth={0.7} opacity={0.35} />
            <Path d={`M43 ${70 + i * 7.6} q3 -3 6 0 t6 0 t6 0`} fill="none" stroke="#2A3F6B" strokeWidth={1.1} strokeLinecap="round" />
            <Path d={`M86 ${70 + i * 7.6} q2.5 -3 5 0 t5 0 t5 0`} fill="none" stroke="#2A3F6B" strokeWidth={1.1} strokeLinecap="round" />
          </G>
        ))}
        {[0, 1, 2, 3].map((i) => (
          <Path key={i} d={`M36 ${70 + i * 7.6} l1.8 2 l3.4 -4`} fill="none" stroke={GREEN} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
        ))}
        {[0, 1, 2, 3].map((i) => (
          <G key={i}>
            <Line x1={115} y1={72 + i * 7.6} x2={181} y2={72 + i * 7.6} stroke={BROWN} strokeWidth={0.7} opacity={0.35} />
            <Path d={`M120 ${70 + i * 7.6} q3 -3 6 0 t6 0 t6 0`} fill="none" stroke="#2A3F6B" strokeWidth={1.1} strokeLinecap="round" />
            <Path d={`M158 ${70 + i * 7.6} q2.5 -3 5 0 t5 0 t5 0`} fill="none" stroke="#2A3F6B" strokeWidth={1.1} strokeLinecap="round" />
          </G>
        ))}
        <Line x1={150} y1={95} x2={182} y2={95} stroke="#2A3F6B" strokeWidth={1.4} strokeLinecap="round" />
        <Say x={118} y={110} s="$" fill="#2A3F6B" size={12} anchor="start" />
        <Path d="M130 107 q3 -5 6 0 t6 0 t6 0 t6 0 t6 0" fill="none" stroke="#2A3F6B" strokeWidth={1.9} strokeLinecap="round" />
        <Line x1={116} y1={113} x2={181} y2={113} stroke="#2A3F6B" strokeWidth={1.6} strokeLinecap="round" />
        <Line x1={116} y1={115.6} x2={181} y2={115.6} stroke="#2A3F6B" strokeWidth={1.6} strokeLinecap="round" />
        <G transform="rotate(-7 140 144)">
          <Rect x={92} y={140} width={46} height={6.4} rx={1.2} fill="#E8B93A" />
          <Path d="M92 140 L82 143.2 L92 146.4 Z" fill={SKIN} />
          <Path d="M85 142 L82 143.2 L85 144.4 Z" fill={BLACK} />
          <Rect x={136} y={139.6} width={4} height={7.2} fill={BRASS} />
          <Rect x={140} y={140} width={6} height={6.4} rx={2} fill="#E08A8A" />
        </G>
        <Rect x={208} y={18} width={72} height={76} rx={5} fill={PAPER} stroke={BROWN} strokeWidth={1.4} />
        <Rect x={208} y={18} width={72} height={14} rx={5} fill={BRICK} />
        <Rect x={208} y={26} width={72} height={6} fill={BRICK} />
        <Circle cx={222} cy={18} r={2.6} fill={BLACK} opacity={0.55} />
        <Circle cx={266} cy={18} r={2.6} fill={BLACK} opacity={0.55} />
        {cells.map((i) => {
          const c = i % 7;
          const r = Math.floor(i / 7);
          const cx = 217 + c * 9.4;
          const cy = 42 + r * 10.2;
          if (i < 12) return <Circle key={i} cx={cx} cy={cy} r={3.6} fill={GREEN} />;
          if (i === 12) return <Circle key={i} cx={cx} cy={cy} r={4.2} fill="none" stroke={AMBER} strokeWidth={1.6} />;
          return <Circle key={i} cx={cx} cy={cy} r={1.5} fill={BROWN} opacity={0.3} />;
        })}
        <Path d="M257 118 L259 106 L271 106 L273 118 Z" fill={BRICK} />
        <Rect x={256} y={104} width={18} height={4} rx={1.5} fill="#C9704A" />
        <Path d="M265 104 Q265 92 265 88" fill="none" stroke={DKGREEN} strokeWidth={2} strokeLinecap="round" />
        <Ellipse cx={258} cy={91} rx={7} ry={3.4} fill={GREEN} transform="rotate(-30 258 91)" />
        <Ellipse cx={272} cy={86} rx={7} ry={3.4} fill={GREEN} transform="rotate(28 272 86)" />
      </Panel>
      <Cap k={k} s="A number has an end" />
    </Frame>
  );
}

function Tell({ k }: { k: Ink }) {
  const ARM_A = '#3F5B8A';
  const ARM_B = '#2F7470';
  return (
    <Frame label="Two people sit side by side on a sofa: one holds out a folded paper with a sum on it, and the other reaches to take it with one hand while the other hand rests on their shoulder">
      <Panel id="h8-tell" fill="#EBD2B0">
        <Rect x={10} y={138} width={280} height={24} fill="#B98A5A" />
        <Rect x={10} y={137} width={280} height={3} fill={DARKWOOD} opacity={0.5} />
        <Ellipse cx={150} cy={153} rx={112} ry={9} fill={BRICK} opacity={0.4} />
        <Rect x={36} y={26} width={42} height={32} rx={3} fill="#FBE3AE" stroke={DARKWOOD} strokeWidth={3} />
        <Path d="M38 52 L50 40 L58 48 L66 38 L76 52 Z" fill={GREEN} opacity={0.7} />
        <Circle cx={68} cy={36} r={4} fill={GOLD} />
        <Rect x={258} y={78} width={3} height={60} fill={DARKWOOD} />
        <Path d="M248 78 L252 54 L268 54 L272 78 Z" fill={AMBER} />
        <Circle cx={260} cy={66} r={36} fill={GOLD} opacity={0.12} />
        <Rect x={66} y={74} width={168} height={56} rx={14} fill="#A8553E" />
        <Rect x={52} y={94} width={24} height={48} rx={10} fill="#A8553E" />
        <Rect x={224} y={94} width={24} height={48} rx={10} fill="#A8553E" />
        <G transform="translate(118 124) scale(1.15)">
          <Circle cx={0} cy={-48} r={11} fill={BLUE} />
          <Path d="M-17 0 L-17 -16 Q-17 -33 0 -33 Q17 -33 17 -16 L17 0 Z" fill={BLUE} />
          <Circle cx={4} cy={-47} r={1.8} fill={WHITE} />
        </G>
        <G transform="translate(182 124) scale(1.15)">
          <Circle cx={0} cy={-48} r={11} fill={TEAL} />
          <Path d="M-17 0 L-17 -16 Q-17 -33 0 -33 Q17 -33 17 -16 L17 0 Z" fill={TEAL} />
          <Circle cx={-4} cy={-47} r={1.8} fill={WHITE} />
        </G>
        <Rect x={62} y={118} width={176} height={24} rx={10} fill={TERRA} />
        <Rect x={72} y={140} width={8} height={9} fill={DARKWOOD} />
        <Rect x={220} y={140} width={8} height={9} fill={DARKWOOD} />
        <Path d="M134 96 Q146 98 150 111" fill="none" stroke={ARM_A} strokeWidth={8} strokeLinecap="round" />
        <Paper x={152} y={106} rot={-10} s={1.05} />
        <Circle cx={151} cy={113.5} r={4.4} fill={SKIN} />
        <Path d="M163 98 Q152 80 138 87" fill="none" stroke={ARM_B} strokeWidth={8} strokeLinecap="round" />
        <Circle cx={136.6} cy={86.4} r={4.4} fill={SKIN} />
        <Path d="M201 100 Q198 124 163 119" fill="none" stroke={ARM_B} strokeWidth={7} strokeLinecap="round" />
        <Circle cx={158} cy={118.6} r={4.4} fill={SKIN} />
      </Panel>
      <Cap k={k} s="Said plainly, to someone" />
    </Frame>
  );
}

function Keys({ k }: { k: Ink }) {
  return (
    <Frame label="On a kitchen table a bank card and a small key pass from one hand to another, with a phone beside them showing a plain chat bubble icon for a helpline">
      <Panel id="h8-keys" fill="#EBD2A8">
        <Rect x={28} y={24} width={64} height={54} rx={3} fill="#FBE3AE" stroke={DARKWOOD} strokeWidth={3.4} />
        <Line x1={60} y1={24} x2={60} y2={78} stroke={DARKWOOD} strokeWidth={2.4} />
        <Line x1={28} y1={51} x2={92} y2={51} stroke={DARKWOOD} strokeWidth={2.4} />
        <Circle cx={76} cy={38} r={6} fill={GOLD} />
        <Path d="M92 78 L120 104 L40 104 Z" fill={GOLD} opacity={0.1} />
        <Rect x={206} y={34} width={70} height={4} rx={2} fill={DARKWOOD} />
        <Rect x={214} y={18} width={14} height={16} rx={4} fill={TEAL} />
        <Rect x={236} y={22} width={14} height={12} rx={3} fill={BRICK} />
        <Rect x={10} y={106} width={280} height={9} rx={2} fill={MIDWOOD} />
        <Rect x={10} y={115} width={280} height={47} fill={DARKWOOD} />
        <Rect x={56} y={96} width={14} height={10} rx={2} fill={CREAM} />
        <Path d="M70 98 Q76 98 76 101 Q76 104 70 104" fill="none" stroke={CREAM} strokeWidth={1.6} />
        <Rect x={228} y={58} width={26} height={48} rx={5} fill={BLACK} />
        <Rect x={231} y={62} width={20} height={38} rx={2.4} fill="#EAF3F0" />
        <Rect x={234} y={70} width={14} height={10} rx={3} fill={TEAL} />
        <Path d="M237 80 L237 85 L242 80 Z" fill={TEAL} />
        {[238, 241, 244].map((cx) => (
          <Circle key={cx} cx={cx} cy={75} r={1.1} fill={WHITE} />
        ))}
        <Line x1={-6} y1={100} x2={112} y2={90} stroke={COAT} strokeWidth={19} strokeLinecap="round" />
        <Line x1={310} y1={102} x2={188} y2={96} stroke="#C9704A" strokeWidth={19} strokeLinecap="round" />
        <Hand x={176} y={97} dir={-1} s={1.05} />
        <G transform="rotate(-6 142 88)">
          <Rect x={124} y={77} width={36} height={22} rx={3.4} fill="#5E6E86" />
          <Rect x={124} y={82} width={36} height={5} fill={BLACK} opacity={0.6} />
          <Rect x={128} y={91} width={12} height={3} rx={1.5} fill={CREAM} opacity={0.7} />
          <Rect x={143} y={91} width={6} height={3} rx={1.5} fill={CREAM} opacity={0.5} />
        </G>
        <G transform="rotate(-6 142 70)">
          <Circle cx={132} cy={70} r={5} fill="none" stroke={BRASS} strokeWidth={2.6} />
          <Rect x={136} y={68.8} width={22} height={2.8} rx={1} fill={BRASS} />
          <Rect x={150} y={71} width={2.6} height={5} fill={BRASS} />
          <Rect x={155} y={71} width={2.6} height={4} fill={BRASS} />
        </G>
        <Hand x={124} y={88} s={1.05} />
      </Panel>
      <Cap k={k} s="Share the keys" />
    </Frame>
  );
}

export const SCENES_H8: Record<string, ComponentType<{ k: Ink }>> = {
  'l52-wheel': Wheel52,
  'l52-red': Red52,
  'l52-near-miss': NearMiss,
  'l52-walk-away': WalkAway,
  'l53-apart': ApartScene,
  'l53-twice': Twice,
  'l53-ledger': Ledger,
  'l53-tell': Tell,
  'l53-keys': Keys,
};
