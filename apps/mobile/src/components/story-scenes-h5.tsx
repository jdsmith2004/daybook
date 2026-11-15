/* Scenes for lessons told as a story (see story-kit.tsx and story-scenes-h.tsx): lesson 56 (a filter is like a bank safe, rated in minutes,
   and it only has to hold long enough for help) and lesson 58 (a heavy feeling the habit pretends to help, and a better door). Every person
   is a simple, fully clothed figure. */
import { type ComponentType, type ReactNode } from 'react';
import { ClipPath, Circle, Defs, Ellipse, G, Line, Path, Rect } from 'react-native-svg';

import { BEAR_LINE, Frame, type Ink, Person, Say } from './story-kit';

const BROWN = '#8A5A2B';
const ROPE = '#B8864A';
const GOLD = '#FFD25A';
const GOLD_DK = '#C98F1A';
const WHITE = '#FFFFFF';
const GREEN = '#3F8F5B';
const STONE = '#3B3A45';
const BLUE = '#4F6FA8';
const ORANGE = '#D9602A';
const TEAL = '#3F8F8A';
const BRICK = '#B5533C';
const WOOD = '#C9965B';
const CREAM = '#F6E3C6';
const STEEL = '#8693A3';
const STEEL_DK = '#5C6877';
const STEEL_LT = '#A9B4C2';
const RED = '#D9453A';
const NAVY = '#2F4F8F';

/* the line of words under a picture */
function Cap({ k, s }: { k: Ink; s: string }) {
  return <Say x={150} y={190} s={s} fill={k.ink} />;
}

/* the picture's own rounded panel, so it reads on a light page and a dark one */
function Panel({ id, fill, x = 10, w = 280, children }: { id: string; fill: string; x?: number; w?: number; children: ReactNode }) {
  return (
    <>
      <Defs>
        <ClipPath id={id}>
          <Rect x={x} y={10} width={w} height={152} rx={14} />
        </ClipPath>
      </Defs>
      <G clipPath={`url(#${id})`}>
        <Rect x={x} y={10} width={w} height={152} fill={fill} />
        {children}
      </G>
    </>
  );
}

/* a heavy steel bank safe, centered on x with its feet at y: a round dial, a handle and a small brass plate that reads TL-15 */
function Safe({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Rect x={-34} y={-4} width={10} height={6} rx={2} fill={STEEL_DK} />
      <Rect x={24} y={-4} width={10} height={6} rx={2} fill={STEEL_DK} />
      <Rect x={-38} y={-76} width={76} height={74} rx={7} fill={STEEL} stroke={BEAR_LINE} strokeWidth={1.6} />
      <Rect x={-31} y={-69} width={62} height={60} rx={4} fill={STEEL_LT} stroke={STEEL_DK} strokeWidth={1.4} />
      <Rect x={-42} y={-60} width={6} height={10} rx={2} fill={STEEL_DK} />
      <Rect x={-42} y={-26} width={6} height={10} rx={2} fill={STEEL_DK} />
      <Rect x={-17} y={-66} width={34} height={11} rx={2.5} fill={GOLD} stroke={GOLD_DK} strokeWidth={1} />
      <Say x={0} y={-57.5} s="TL-15" fill="#3A2A10" size={8} />
      <Circle cx={-6} cy={-28} r={16} fill={STEEL_DK} stroke={BEAR_LINE} strokeWidth={1.4} />
      {Array.from({ length: 8 }, (_, i) => {
        const a = (Math.PI / 4) * i;
        return (
          <Line
            key={i}
            x1={-6 + 12.5 * Math.cos(a)}
            y1={-28 + 12.5 * Math.sin(a)}
            x2={-6 + 14.5 * Math.cos(a)}
            y2={-28 + 14.5 * Math.sin(a)}
            stroke={WHITE}
            strokeWidth={1.6}
            strokeLinecap="round"
          />
        );
      })}
      <Circle cx={-6} cy={-28} r={9} fill={STEEL} stroke={BEAR_LINE} strokeWidth={1.2} />
      <Line x1={-6} y1={-28} x2={-6} y2={-35} stroke={WHITE} strokeWidth={2.2} strokeLinecap="round" />
      <Circle cx={-6} cy={-28} r={2.6} fill={GOLD} stroke={GOLD_DK} strokeWidth={0.8} />
      <Rect x={14} y={-40} width={9} height={24} rx={4.5} fill={GOLD} stroke={GOLD_DK} strokeWidth={1.2} />
    </G>
  );
}

/* a stopwatch (a crown and a button on top, no hands, no numbers): a quarter of its dial is filled in. x and y are the center of the dial */
function Stopwatch({ x, y, s = 1, fill = ORANGE }: { x: number; y: number; s?: number; fill?: string }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Rect x={-4} y={-38} width={8} height={10} rx={2} fill={STEEL_DK} />
      <Rect x={-9} y={-42} width={18} height={6} rx={3} fill={STEEL_DK} />
      <G transform="rotate(44)">
        <Rect x={-3.5} y={-37} width={7} height={8} rx={2} fill={STEEL_DK} />
      </G>
      <Circle r={29} fill={STEEL} stroke={BEAR_LINE} strokeWidth={1.6} />
      <Circle r={24} fill={WHITE} />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (Math.PI / 6) * i;
        const big = i % 3 === 0;
        const r1 = big ? 17.5 : 19.5;
        return (
          <Line
            key={i}
            x1={r1 * Math.cos(a)}
            y1={r1 * Math.sin(a)}
            x2={22 * Math.cos(a)}
            y2={22 * Math.sin(a)}
            stroke={STEEL_DK}
            strokeWidth={big ? 2 : 1.2}
            strokeLinecap="round"
          />
        );
      })}
      <Path d="M0 0 L0 -17 A17 17 0 0 1 17 0 Z" fill={fill} />
      <Circle r={2.6} fill={BEAR_LINE} />
    </G>
  );
}

/* a small padlock, hanging, with its top at y */
function Padlock({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Path d="M-4 3 L-4 -2 Q-4 -8 0 -8 Q4 -8 4 -2 L4 3" stroke={STEEL_DK} strokeWidth={2.2} fill="none" strokeLinecap="round" />
      <Rect x={-6.5} y={2} width={13} height={10} rx={2.4} fill={GOLD} stroke={GOLD_DK} strokeWidth={1} />
      <Circle cx={0} cy={6.4} r={1.4} fill={GOLD_DK} />
      <Rect x={-0.7} y={6.4} width={1.4} height={3.2} fill={GOLD_DK} />
    </G>
  );
}

/* the bricks of a wall as faint lines */
function Bricks({ x, y, w, h, c = '#8C3A2A' }: { x: number; y: number; w: number; h: number; c?: string }) {
  let d = '';
  const rows = Math.floor(h / 10);
  for (let r = 0; r <= rows; r++) {
    d += `M${x} ${y + r * 10} L${x + w} ${y + r * 10} `;
    if (r < rows) for (let cx = x + (r % 2 ? 0 : 12); cx < x + w; cx += 24) d += `M${cx} ${y + r * 10} L${cx} ${y + r * 10 + 10} `;
  }
  return <Path d={d} stroke={c} strokeWidth={1.2} opacity={0.55} fill="none" />;
}

/* a bird cage, centered on x: a dome of bars on a base, hung from a ring */
function Cage({ x, y }: { x: number; y: number }) {
  const bars = [-24, -12, 0, 12, 24];
  return (
    <G transform={`translate(${x} ${y})`}>
      <Line x1={0} y1={-34} x2={0} y2={-4} stroke="#A9AEBB" strokeWidth={2} />
      <Circle cx={0} cy={-2} r={4.4} fill="none" stroke="#A9AEBB" strokeWidth={2.2} />
      <Path d="M-34 66 L-34 34 Q-34 2 0 2 Q34 2 34 34 L34 66" fill="#E4E6EC" stroke="#A9AEBB" strokeWidth={2.6} />
      {bars.map((bx) => (
        <Line key={bx} x1={bx} y1={34 - 32 * Math.sqrt(1 - (bx / 34) ** 2)} x2={bx} y2={66} stroke="#A9AEBB" strokeWidth={2} />
      ))}
      <Line x1={-34} y1={46} x2={34} y2={46} stroke="#A9AEBB" strokeWidth={2.2} />
      <Rect x={-39} y={66} width={78} height={9} rx={4.5} fill="#A9AEBB" />
    </G>
  );
}

/* a small hourglass standing on y: sand at the top, a thin fall, sand below */
function Hourglass({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Path d="M-9 -40 L9 -40 L2 -22 L9 -4 L-9 -4 L-2 -22 Z" fill="#EAF4F7" stroke={BEAR_LINE} strokeWidth={1.2} strokeLinejoin="round" />
      <Path d="M-6 -38 L6 -38 L1.2 -26 L-1.2 -26 Z" fill={GOLD} />
      <Line x1={0} y1={-26} x2={0} y2={-12} stroke={GOLD_DK} strokeWidth={1.2} />
      <Path d="M-7 -5 L7 -5 L3.6 -12 L-3.6 -12 Z" fill={GOLD} />
      <Rect x={-12} y={-44} width={24} height={5} rx={2.5} fill={BROWN} />
      <Rect x={-12} y={-4} width={24} height={5} rx={2.5} fill={BROWN} />
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

/* a plain wooden chair under a sitter's hips (x, y), facing the way the sitter does */
function Chair({ x, y, dir = 1 }: { x: number; y: number; dir?: 1 | -1 }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${dir} 1)`}>
      <Rect x={-17} y={6} width={5} height={24} rx={2} fill="#A87B45" />
      <Rect x={30} y={6} width={5} height={24} rx={2} fill="#A87B45" />
      <Rect x={-21} y={-36} width={7} height={66} rx={3.5} fill={WOOD} />
      <Rect x={-19} y={1} width={52} height={6} rx={3} fill={WOOD} />
    </G>
  );
}

/* ---------- lesson 56: a filter is a safe, rated in minutes ---------- */
function SafeRated({ k }: { k: Ink }) {
  return (
    <Frame label="A heavy steel bank safe with a round dial, a handle and a small plate reading TL-15, and beside it a large stopwatch with a quarter of its dial filled in">
      <Panel id="h5-safe" fill="#E4EAF0">
        <Rect x={10} y={142} width={280} height={20} fill="#C4CBD6" />
        <Rect x={10} y={141} width={280} height={3} fill="#B2BAC7" />
        <Ellipse cx={96} cy={146} rx={62} ry={5} fill={STEEL_DK} opacity={0.25} />
        <Ellipse cx={222} cy={146} rx={44} ry={5} fill={STEEL_DK} opacity={0.25} />
        <Safe x={96} y={144} s={1.45} />
        <Stopwatch x={222} y={101} s={1.5} fill={ORANGE} />
      </Panel>
      <Cap k={k} s="Rated in minutes" />
    </Frame>
  );
}

function SafeAlarm({ k }: { k: Ink }) {
  return (
    <Frame label="A steel safe with a ringing alarm bell on the wall above it, and a guard in a cap hurrying in from the right with a flashlight beam">
      <Panel id="h5-alarm" fill="#E8ECF2">
        <Rect x={10} y={142} width={280} height={20} fill="#C4CBD6" />
        <Rect x={10} y={141} width={280} height={3} fill="#B2BAC7" />
        <Ellipse cx={78} cy={146} rx={48} ry={4.5} fill={STEEL_DK} opacity={0.25} />
        <Safe x={78} y={144} s={1} />
        {/* the alarm bell, ringing */}
        <G transform="translate(78 38) scale(1.25)">
          <Rect x={-3} y={-24} width={6} height={10} rx={2} fill={STEEL_DK} />
          <Rect x={-9} y={-16} width={18} height={4} rx={2} fill={STEEL_DK} />
          <Path d="M-14 10 Q-14 -13 0 -13 Q14 -13 14 10 L18 14 L-18 14 Z" fill={GOLD} stroke={GOLD_DK} strokeWidth={1.4} strokeLinejoin="round" />
          <Circle cx={0} cy={17.5} r={3.4} fill={GOLD_DK} />
          <Path d="M-23 -6 Q-29 2 -23 10 M-30 -10 Q-39 2 -30 14" stroke={RED} strokeWidth={2.4} strokeLinecap="round" fill="none" />
          <Path d="M23 -6 Q29 2 23 10 M30 -10 Q39 2 30 14" stroke={RED} strokeWidth={2.4} strokeLinecap="round" fill="none" />
        </G>
        {/* the flashlight beam */}
        <Path d="M172 113 L122 84 L122 140 Z" fill={GOLD} opacity={0.32} />
        {/* the guard, hurrying left */}
        <Path d="M262 98 L278 98 M266 112 L284 112 M262 126 L276 126" stroke={STEEL_DK} strokeWidth={2.4} strokeLinecap="round" opacity={0.45} />
        <G transform="translate(228 146) scale(-1.25 1.25)">
          <G transform="rotate(10)">
            <Person x={0} y={0} fill={NAVY} face={WHITE} />
            <Path d="M-12 -52 Q-12 -67 0 -67 Q12 -67 12 -52 Z" fill="#1F356B" />
            <Rect x={2} y={-55} width={16} height={3.6} rx={1.8} fill="#1F356B" />
            <Circle cx={0} cy={-60} r={2.2} fill={GOLD} />
            <Circle cx={0} cy={-22} r={1.6} fill={GOLD} />
            <Circle cx={0} cy={-14} r={1.6} fill={GOLD} />
            <Path d="M8 -28 L26 -32" stroke={NAVY} strokeWidth={6} strokeLinecap="round" fill="none" />
            <Rect x={24} y={-37} width={13} height={8} rx={2} fill="#444" />
            <Rect x={35} y={-39} width={4} height={12} rx={1.5} fill={GOLD} />
          </G>
        </G>
      </Panel>
      <Cap k={k} s="Hold until help comes" />
    </Frame>
  );
}

function NotCage({ k }: { k: Ink }) {
  return (
    <Frame label="Two panels: on the left a muted birdcage with a soft gray cross over it, on the right a warm, sturdy door with a lock and a small hourglass beside it">
      <Panel id="h5-cage-l" fill="#D6D8DE" x={10} w={136}>
        <Rect x={10} y={146} width={136} height={16} fill="#C3C6CE" />
        <Cage x={78} y={40} />
        <Path d="M46 48 L110 118 M110 48 L46 118" stroke="#8E94A3" strokeWidth={7} strokeLinecap="round" opacity={0.85} />
      </Panel>
      <Panel id="h5-cage-r" fill={CREAM} x={154} w={136}>
        <Rect x={154} y={152} width={136} height={10} fill={WOOD} />
        <Circle cx={198} cy={96} r={56} fill={GOLD} opacity={0.14} />
        <Rect x={168} y={38} width={60} height={114} rx={4} fill="#7A4B2A" />
        <Rect x={173} y={43} width={50} height={109} rx={2} fill="#B8742C" />
        <Rect x={179} y={50} width={38} height={38} rx={2} fill="#A5651F" />
        <Rect x={179} y={96} width={38} height={50} rx={2} fill="#A5651F" />
        <Line x1={198} y1={43} x2={198} y2={152} stroke="#8F5517" strokeWidth={1.2} opacity={0.5} />
        <Circle cx={211} cy={98} r={4} fill={GOLD} stroke={GOLD_DK} strokeWidth={1} />
        <Rect x={186} y={104} width={26} height={5} rx={2} fill={STEEL_DK} />
        <Padlock x={206} y={108} s={1.5} />
        <Ellipse cx={262} cy={152} rx={16} ry={3.4} fill={BROWN} opacity={0.25} />
        <Hourglass x={262} y={150} s={1.15} />
      </Panel>
      <Cap k={k} s="Built to hold long enough" />
    </Frame>
  );
}

function DoorPast({ k }: { k: Ink }) {
  const bulbs = Array.from({ length: 11 }, (_, i) => 57 + i * 13.6);
  return (
    <Frame label="A building front with a row of bright marquee lights above a closed door; a person on the pavement has turned away from the door and walks off along the street, footprints behind them">
      <Panel id="h5-door" fill="#2B2F5C">
        <Rect x={36} y={28} width={170} height={114} rx={3} fill="#6B3E4E" />
        <Rect x={54} y={82} width={32} height={34} rx={2} fill="#3A3F6B" />
        <Rect x={156} y={82} width={32} height={34} rx={2} fill="#3A3F6B" />
        <Path d="M96 142 L152 142 L186 162 L62 162 Z" fill={GOLD} opacity={0.16} />
        <Rect x={10} y={140} width={280} height={22} fill="#4A4A5C" />
        <Rect x={10} y={140} width={280} height={3} fill="#6E6E84" />
        <Rect x={102} y={76} width={48} height={64} rx={3} fill="#4A2F3E" />
        <Rect x={106} y={80} width={40} height={60} rx={2} fill="#2E2230" />
        <Circle cx={139} cy={112} r={2.8} fill={GOLD} />
        <Rect x={46} y={34} width={150} height={28} rx={6} fill="#2A1830" stroke={GOLD_DK} strokeWidth={1.6} />
        {bulbs.map((bx) => (
          <G key={bx}>
            <Circle cx={bx} cy={48} r={7.5} fill={GOLD} opacity={0.25} />
            <Circle cx={bx} cy={48} r={3.8} fill={GOLD} />
          </G>
        ))}
        {[212, 196, 180, 164].map((fx, i) => (
          <G key={fx}>
            <Ellipse cx={fx} cy={i % 2 ? 148 : 155} rx={4.4} ry={2.2} fill="#2D2D3C" opacity={0.3 + (i * 0.7) / 4} />
          </G>
        ))}
        <Path d="M262 112 L278 112 M266 126 L282 126" stroke="#8C8FB5" strokeWidth={2.2} strokeLinecap="round" opacity={0.5} />
        <G transform="rotate(4 240 156)">
          <Person x={240} y={156} s={1.05} fill="#E8873A" face="#2A1E5C" />
        </G>
      </Panel>
      <Cap k={k} s="A door to push past" />
    </Frame>
  );
}

function ManyDoors({ k }: { k: Ink }) {
  const xs = [24, 72, 120, 168];
  return (
    <Frame label="A long brick wall with four doors: two shut with padlocks, one ajar with light spilling out, and one shut; at the side one person hands a key to another person">
      <Panel id="h5-doors" fill="#EFE6D6">
        <Rect x={10} y={28} width={280} height={114} fill={BRICK} />
        <Bricks x={10} y={28} w={280} h={114} />
        <Rect x={10} y={142} width={280} height={20} fill="#C9B98F" />
        <Rect x={10} y={140} width={280} height={3} fill="#A8996F" />
        {/* the ajar door's light on the ground */}
        <Path d="M126 142 L150 142 L172 162 L108 162 Z" fill={GOLD} opacity={0.4} />
        {xs.map((dx, i) => (
          <G key={dx}>
            <Rect x={dx - 3} y={60} width={42} height={82} rx={2} fill="#7A4B2A" />
            {i === 2 ? (
              <G>
                <Rect x={dx} y={64} width={36} height={78} fill="#FFE08A" />
                <Path d={`M${dx} 64 L${dx + 14} 70 L${dx + 14} 138 L${dx} 142 Z`} fill="#8F5517" />
                <Path d={`M${dx + 14} 70 L${dx + 36} 66 L${dx + 36} 142 L${dx + 14} 138 Z`} fill={GOLD} opacity={0.55} />
              </G>
            ) : (
              <G>
                <Rect x={dx} y={64} width={36} height={78} fill="#B8742C" />
                <Rect x={dx + 5} y={69} width={26} height={28} rx={2} fill="#A5651F" />
                <Rect x={dx + 5} y={103} width={26} height={33} rx={2} fill="#A5651F" />
                <Circle cx={dx + 29} cy={101} r={2.6} fill={GOLD} stroke={GOLD_DK} strokeWidth={0.8} />
              </G>
            )}
            {i < 2 ? <Padlock x={dx + 29} y={105} s={1} /> : null}
          </G>
        ))}
        {/* handing over the key */}
        <Person x={238} y={152} s={0.85} fill={BLUE} face={WHITE} />
        <G transform="translate(272 152) scale(-0.85 0.85)">
          <Person x={0} y={0} fill={TEAL} face={WHITE} />
        </G>
        <Path d="M246 124 L251 121" stroke={BLUE} strokeWidth={5} strokeLinecap="round" />
        <Path d="M264 124 L259 121" stroke={TEAL} strokeWidth={5} strokeLinecap="round" />
        <Circle cx={248} cy={116} r={3.4} fill="none" stroke={GOLD} strokeWidth={2.2} />
        <Line x1={251.4} y1={116} x2={264} y2={116} stroke={GOLD} strokeWidth={2.4} strokeLinecap="round" />
        <Path d="M259 116 L259 120 M263 116 L263 119" stroke={GOLD} strokeWidth={2} strokeLinecap="round" />
      </Panel>
      <Cap k={k} s="Close the doors you know" />
    </Frame>
  );
}

/* ---------- lesson 58: a heavy feeling, and a better door ---------- */
function HeavyWeek({ k }: { k: Ink }) {
  const rain: [number, number][] = [
    [30, 24],
    [62, 46],
    [92, 22],
    [124, 52],
    [156, 28],
    [188, 56],
    [220, 24],
    [252, 48],
    [44, 74],
    [108, 80],
    [174, 84],
    [236, 78],
    [76, 100],
    [208, 106],
  ];
  return (
    <Frame label="A person walking along a path under a pale gray sky with light rain, bent at the shoulders, carrying a big dark rounded weight on their back">
      <Panel id="h5-heavy" fill="#C7CEDA">
        <Ellipse cx={264} cy={110} rx={36} ry={10} fill={GOLD} opacity={0.3} />
        <Path d="M10 118 Q80 94 150 114 T290 106 L290 162 L10 162 Z" fill="#A9B8A8" />
        <Path d="M10 132 Q100 122 160 134 T290 128 L290 162 L10 162 Z" fill="#92A596" />
        <Path d="M10 156 Q80 140 150 141 Q220 142 290 126 L290 140 Q220 158 150 157 Q80 156 10 162 Z" fill="#DCD2B8" />
        <Ellipse cx={40} cy={112} rx={22} ry={10} fill="#8FA38F" />
        <Ellipse cx={150} cy={152} rx={30} ry={4.4} fill={STONE} opacity={0.2} />
        <G transform="translate(150 150) rotate(16)">
          <Path d="M-46 -34 Q-42 -66 -14 -64 Q8 -60 6 -30 Q4 -4 -22 -6 Q-50 -8 -46 -34 Z" fill={STONE} />
          <Path d="M-38 -46 Q-32 -56 -22 -52 Q-28 -45 -38 -46 Z" fill="#5A596E" />
          <Person x={0} y={0} fill={ORANGE} face="#2A1E5C" />
          <Path d="M-8 -48 L11 -20 M-6 -12 L13 -30" stroke={ROPE} strokeWidth={3.6} strokeLinecap="round" />
        </G>
        {rain.map(([rx, ry]) => (
          <Line key={`${rx}-${ry}`} x1={rx} y1={ry} x2={rx - 4} y2={ry + 11} stroke="#7F8CA6" strokeWidth={1.6} strokeLinecap="round" opacity={0.55} />
        ))}
      </Panel>
      <Cap k={k} s="Some weeks are heavier" />
    </Frame>
  );
}

/* the old door: worn, cracked, a dim glow, and a loop that goes round and comes back to it */
function OldDoor() {
  return (
    <G>
      <Circle cx={74} cy={104} r={52} fill="#D9CFA8" opacity={0.3} />
      <Rect x={44} y={52} width={60} height={98} rx={3} fill="#5E524D" />
      <Rect x={49} y={57} width={50} height={93} rx={2} fill="#7F716A" />
      <Rect x={54} y={64} width={18} height={30} rx={2} fill="#9C9A8A" />
      <Rect x={76} y={64} width={18} height={30} rx={2} fill="#9C9A8A" />
      <Rect x={54} y={102} width={40} height={42} rx={2} fill="#706259" />
      <Path d="M71 57 L66 76 L74 88 L68 108 L76 124 L72 150" stroke="#2E2630" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Circle cx={92} cy={110} r={3.4} fill="#B7A66C" />
      <Path d="M106 110 C140 100 136 18 74 20 C20 22 26 70 44 92" stroke="#6B6370" strokeWidth={3.2} strokeLinecap="round" fill="none" />
      <Path d="M45 93.5 L35.4 89.7 L43.2 83.3 Z" fill="#6B6370" stroke="#6B6370" strokeWidth={1.6} strokeLinejoin="round" />
    </G>
  );
}

/* the warm door: wood, golden light through its window; open decides whether it stands open with light inside */
function WarmDoor({ x, open = false }: { x: number; open?: boolean }) {
  return (
    <G>
      <Circle cx={x + 30} cy={96} r={62} fill={GOLD} opacity={0.18} />
      <Rect x={x - 4} y={40} width={68} height={112} rx={4} fill="#7A4B2A" />
      {open ? (
        <G>
          <Rect x={x} y={44} width={60} height={108} fill="#FFE08A" />
          <Rect x={x + 8} y={52} width={44} height={96} fill="#FFF1BE" opacity={0.7} />
          <Path d={`M${x} 44 L${x + 18} 54 L${x + 18} 140 L${x} 152 Z`} fill="#8F5517" />
        </G>
      ) : (
        <G>
          <Rect x={x} y={44} width={60} height={108} fill="#B8742C" />
          <Rect x={x + 8} y={52} width={44} height={36} rx={4} fill="#FFE08A" stroke="#7A4B2A" strokeWidth={2} />
          <Line x1={x + 30} y1={52} x2={x + 30} y2={88} stroke="#7A4B2A" strokeWidth={2} />
          <Rect x={x + 8} y={96} width={44} height={48} rx={2} fill="#A5651F" />
          <Circle cx={x + 50} cy={94} r={3.4} fill={GOLD} stroke={GOLD_DK} strokeWidth={1} />
        </G>
      )}
    </G>
  );
}

function TwoDoors({ k }: { k: Ink }) {
  return (
    <Frame label="Two doors side by side: on the left an old cracked door with a dim glow and a curved arrow looping from it back to itself, on the right a warm wooden door with golden light through its window and a short path leading forward">
      <Panel id="h5-two" fill="#EDE6DA">
        <Rect x={10} y={150} width={280} height={12} fill="#CFC6B4" />
        <OldDoor />
        <WarmDoor x={176} />
        <Path d="M186 152 L226 152 L248 162 L164 162 Z" fill="#E7D3A0" />
        <Path d="M196 152 L216 152 L224 162 L188 162 Z" fill={GOLD} opacity={0.5} />
      </Panel>
      <Cap k={k} s="Which help?" />
    </Frame>
  );
}

function AskRoom({ k }: { k: Ink }) {
  return (
    <Frame label="A calm room with two chairs facing each other: a person talking and a counselor listening with a notepad, with a plant and a warm lamp beside them">
      <Panel id="h5-ask" fill={CREAM}>
        <Rect x={10} y={148} width={280} height={14} fill={WOOD} />
        <Rect x={10} y={147} width={280} height={3} fill="#B08A57" />
        <Ellipse cx={150} cy={155} rx={74} ry={5} fill={BRICK} opacity={0.45} />
        <Rect x={152} y={30} width={44} height={36} rx={3} fill="#BFE0F2" stroke={BROWN} strokeWidth={4} />
        <Line x1={174} y1={30} x2={174} y2={66} stroke={BROWN} strokeWidth={2.2} />
        <Plant x={28} y={149} s={0.95} />
        <Lamp x={268} y={149} h={70} />
        <Chair x={88} y={118} dir={1} />
        <Chair x={212} y={118} dir={-1} />
        <Sitter x={88} y={118} fill={ORANGE} lean={8}>
          <Path d="M4 -28 L19 -20" stroke={ORANGE} strokeWidth={6} strokeLinecap="round" />
          <Circle cx={21} cy={-19} r={3.4} fill="#E8B98F" />
        </Sitter>
        <Sitter x={212} y={118} fill={TEAL} dir={-1} lean={-4}>
          <Path d="M4 -26 L16 -15 L21 -15" stroke={TEAL} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <G transform="rotate(-14 22 -26)">
            <Rect x={14} y={-36} width={13} height={18} rx={2} fill={WHITE} stroke={BEAR_LINE} strokeWidth={1.2} />
            <Path d="M17 -31 L24 -31 M17 -27 L24 -27 M17 -23 L22 -23" stroke={BEAR_LINE} strokeWidth={1} strokeLinecap="round" opacity={0.6} />
          </G>
        </Sitter>
        <Rect x={88} y={26} width={50} height={28} rx={14} fill={WHITE} stroke={BEAR_LINE} strokeWidth={1.2} />
        <Path d="M100 54 L96 66 L110 54 Z" fill={WHITE} stroke={BEAR_LINE} strokeWidth={1.2} strokeLinejoin="round" />
        <Rect x={99} y={53} width={12} height={2.6} fill={WHITE} />
        <Circle cx={102} cy={40} r={2.6} fill="#8A8FA0" />
        <Circle cx={113} cy={40} r={2.6} fill="#8A8FA0" />
        <Circle cx={124} cy={40} r={2.6} fill="#8A8FA0" />
      </Panel>
      <Cap k={k} s="A short conversation" />
    </Frame>
  );
}

function BetterDoor({ k }: { k: Ink }) {
  return (
    <Frame label="The warm wooden door standing open with golden light inside, a person stepping through it, upright, and the dark weight left on the ground behind them">
      <Panel id="h5-better" fill="#EAF1F4">
        <Rect x={10} y={150} width={280} height={12} fill="#CFD8DC" />
        <Path d="M170 152 L226 152 L262 162 L128 162 Z" fill={GOLD} opacity={0.4} />
        <WarmDoor x={174} open />
        {/* the weight, left behind on the ground */}
        <Ellipse cx={70} cy={152} rx={30} ry={4} fill={STONE} opacity={0.2} />
        <Path d="M42 148 Q40 118 64 114 Q92 112 98 136 Q102 150 90 150 Z" fill={STONE} />
        <Path d="M50 128 Q54 120 62 122 Q58 128 50 128 Z" fill="#5A596E" />
        <Path d="M56 118 Q36 128 28 144 M92 118 Q108 128 114 146" stroke={ROPE} strokeWidth={3.4} strokeLinecap="round" fill="none" />
        <Path d="M122 152 L138 152 M144 154 L156 154" stroke={BROWN} strokeWidth={2.6} strokeLinecap="round" opacity={0.35} />
        <Person x={196} y={151} s={1.2} fill={BLUE} face={WHITE} />
        <Path d="M232 70 L232 80 M227 75 L237 75 M246 96 L246 102 M243 99 L249 99" stroke={GOLD_DK} strokeWidth={2} strokeLinecap="round" />
      </Panel>
      <Cap k={k} s="A better door" />
    </Frame>
  );
}

export const SCENES_H5: Record<string, ComponentType<{ k: Ink }>> = {
  'l56-safe': SafeRated,
  'l56-alarm': SafeAlarm,
  'l56-not-cage': NotCage,
  'l56-door': DoorPast,
  'l56-doors': ManyDoors,
  'l58-heavy': HeavyWeek,
  'l58-two-doors': TwoDoors,
  'l58-ask': AskRoom,
  'l58-better-door': BetterDoor,
};
