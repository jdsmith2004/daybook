/* Scenes for lesson g11, "Small and simple" (see story-kit.tsx and story-scenes-i6.tsx for the approach): Naaman the Syrian general with his chariot and the servant
   girl who named the prophet, the plain house where a messenger sends him to the Jordan, his anger, the servants who speak to him gently, the seven dips and the
   healed skin, the brass ball of Lehi's family, Daniel at his open window, then the same truth in a call center: fifteen minutes of writing, a room of trainees, and
   a row of small notebooks with a hand adding the next.
   Naaman always wears a bronze helmet and a purple cloak with a bronze sash, and carries pale patches on his arms until the river (where his helmet waits on the bank).
   Every figure carries a dark outline so it reads on a dark card and a cream one. */
import { type ComponentType, type ReactNode, useEffect, useState } from 'react';
import { Easing } from 'react-native';
import { Circle, Ellipse, G, Line, Path, Polygon, Rect } from 'react-native-svg';

import { useAppear, useReducedMotion } from '@/lib/motion';

import { BEAR_LINE, Frame, Say, type Ink } from './story-kit';

const SKIN = '#E7B98F';
const HAIR = '#3A2A20';
const GOLD = '#FFD25A';
const GOLD_D = '#C98F1A';
const CREAM = '#FFF5E1';
const WOOD = '#B07A45';
const WOOD_D = '#5E3A1A';
const EDGE = '#8A6A3A';
const SKY = '#F7D9A2';
const SAND = '#EBD3A2';
const SAND_D = '#D2A86A';
const STONE = '#F3E3BC';
const WALL = '#EAD0A0';
const CLOAK = '#6E3F96';
const BRONZE = '#C27A2C';
const BRONZE_D = '#7A4A14';
const PATCH = '#F4E6D8';
const PATCH_D = '#C9A58A';
const PLUME = '#B63A3A';

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
/* fingers held up from a hand at (x, y): n of them, fanned a little */
function Fingers({ x, y, n }: { x: number; y: number; n: number }) {
  const angles = n === 5 ? [-38, -19, 0, 19, 38] : [-10, 10];
  const ends = angles.map((a) => {
    const r = (a * Math.PI) / 180;
    return [x + Math.sin(r) * 8, y - 2 - Math.cos(r) * 8] as [number, number];
  });
  return (
    <G strokeLinecap="round">
      {ends.map(([ex, ey], i) => (
        <Line key={`o${i}`} x1={x} y1={y - 2} x2={ex} y2={ey} stroke={BEAR_LINE} strokeWidth={3.6} />
      ))}
      {ends.map(([ex, ey], i) => (
        <Line key={`f${i}`} x1={x} y1={y - 2} x2={ex} y2={ey} stroke={SKIN} strokeWidth={2} />
      ))}
      <Circle cx={x} cy={y} r={3.6} fill={SKIN} stroke={BEAR_LINE} strokeWidth={1.2} />
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
type Mood = 'none' | 'angry' | 'glad' | 'calm';

/* a person in a long robe, standing on (x, y), facing right (flip turns them). arms are [shoulder x, hand x, hand y] in the person's own space; tilt turns
   the head (negative looks up); sash is a belt with a tail; band is a cloth around the head; helmet is a bronze one; patches (0 to 1) are the pale marks on the arms */
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
  helmet = false,
  patches = 0,
  mood = 'none',
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
  helmet?: boolean;
  patches?: number;
  mood?: Mood;
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
          {[0.38, 0.7].map((t, j) => (
            <Ellipse
              key={j}
              cx={sx + (hx - sx) * t}
              cy={-34 + (hy + 34) * t}
              rx={2.3}
              ry={1.8}
              fill={PATCH}
              stroke={PATCH_D}
              strokeWidth={0.6}
              opacity={patches}
            />
          ))}
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
        {helmet ? (
          <G stroke={BEAR_LINE} strokeWidth={sw} strokeLinejoin="round">
            <Path d="M0 -62.4 Q-1.4 -69 4.4 -70 Q3.2 -65 3.4 -62.4 Z" fill={PLUME} />
            <Path d="M-9.6 -51 Q-9.8 -63 0 -63 Q9.8 -63 9.6 -51 Z" fill={BRONZE} />
            <Rect x={-10.4} y={-54.4} width={20.8} height={3.6} rx={1.6} fill={BRONZE_D} />
            <Path d="M5.4 -51 L5.4 -46.6" fill="none" />
          </G>
        ) : null}
        <Circle cx={4} cy={-48 + glance} r={1.5} fill={BEAR_LINE} />
        {mood === 'angry' ? (
          <G stroke={BEAR_LINE} strokeWidth={1.4} strokeLinecap="round" fill="none">
            <Path d="M1 -51.2 L7.6 -49.4" />
            <Path d="M2.6 -43.4 Q5 -46 7.4 -43.6" />
          </G>
        ) : null}
        {mood === 'glad' ? <Path d="M2.4 -45 Q4.8 -42.4 7.4 -45" stroke={BEAR_LINE} strokeWidth={1.3} fill="none" strokeLinecap="round" /> : null}
        {mood === 'calm' ? <Path d="M3 -44 L6.6 -44.2" stroke={BEAR_LINE} strokeWidth={1.2} fill="none" strokeLinecap="round" /> : null}
      </G>
    </G>
  );
}

/* Naaman: a bronze helmet, a purple cloak with a bronze sash, and the pale patches on his arms */
function Naaman({
  x,
  y,
  s = 1,
  flip = false,
  arms,
  tilt = 0,
  mood = 'calm',
  patches = 1,
  helmet = true,
  glance = 0,
}: {
  x: number;
  y: number;
  s?: number;
  flip?: boolean;
  arms?: Arm[];
  tilt?: number;
  mood?: Mood;
  patches?: number;
  helmet?: boolean;
  glance?: number;
}) {
  return (
    <Robed
      x={x}
      y={y}
      s={s}
      flip={flip}
      robe={CLOAK}
      sash={BRONZE}
      hair={HAIR}
      helmet={helmet}
      patches={patches}
      mood={mood}
      arms={arms}
      tilt={tilt}
      glance={glance}
    />
  );
}

function Soldier({ x, y, s = 1, flip = false }: { x: number; y: number; s?: number; flip?: boolean }) {
  return (
    <Robed x={x} y={y} s={s} flip={flip} robe="#8C3B2C" sash="#5A2418" helmet arms={[[9, 13, -28]]}>
      <Path d="M13 -20 L13 -80" stroke={WOOD_D} strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M13 -84 L10.6 -77 L15.4 -77 Z" fill="#C9CDD8" stroke={BEAR_LINE} strokeWidth={0.8} strokeLinejoin="round" />
    </Robed>
  );
}

/* ---------- horses and the chariot ---------- */
function Horse({
  x,
  y,
  s = 1,
  flip = false,
  coat = '#8A5A33',
  mane = '#2A1810',
}: {
  x: number;
  y: number;
  s?: number;
  flip?: boolean;
  coat?: string;
  mane?: string;
}) {
  return (
    <G transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      <Tube fill={mane} parts={[['M-16 -27 Q-27 -23 -25 -8', 3.4]]} />
      <Tube
        fill={coat}
        parts={[
          ['M-10 -20 L-11 -2', 4],
          ['M-5 -18 L-3 -2', 4],
          ['M9 -18 L8 -2', 4],
          ['M14 -20 L17 -4', 4],
        ]}
      />
      <Tube fill={coat} parts={[['M-10 -26 L10 -26', 17]]} />
      <Tube fill={coat} parts={[['M10 -30 L21 -44', 9]]} />
      <Tube fill={coat} parts={[['M21 -44 L30 -39', 7.4]]} />
      <Path d="M18.6 -49 L20 -56 L23.6 -50 Z" fill={coat} stroke={BEAR_LINE} strokeWidth={1.2} strokeLinejoin="round" />
      <Path d="M11 -35 Q13 -46 19 -51" stroke={mane} strokeWidth={3.2} strokeLinecap="round" fill="none" />
      <Circle cx={26} cy={-43} r={1.3} fill={BEAR_LINE} />
      <Ellipse cx={-11} cy={-1} rx={3} ry={1.6} fill={BEAR_LINE} />
      <Ellipse cx={-3} cy={-1} rx={3} ry={1.6} fill={BEAR_LINE} />
      <Ellipse cx={8} cy={-1} rx={3} ry={1.6} fill={BEAR_LINE} />
      <Ellipse cx={17} cy={-3} rx={3} ry={1.6} fill={BEAR_LINE} />
    </G>
  );
}
/* a chariot on y (its wheels' bottom), facing right: children (the rider, feet at y -14) stand inside it, hidden to the waist by its front panel */
function Chariot({ children }: { children?: ReactNode }) {
  return (
    <G>
      {children}
      <Path d="M-23 -37 L6 -37 Q13 -37 13 -29 L13 -13 L-23 -13 Z" fill="#D9A441" stroke={BEAR_LINE} strokeWidth={1.5} strokeLinejoin="round" />
      <Path d="M-23 -33 L12 -33" stroke={BRONZE_D} strokeWidth={2} />
      <Path d="M-23 -17 L13 -17" stroke={BRONZE_D} strokeWidth={1.4} />
      <Circle cx={-4} cy={-10} r={10.5} fill="none" stroke={BEAR_LINE} strokeWidth={5.4} />
      <Circle cx={-4} cy={-10} r={10.5} fill="none" stroke={WOOD} strokeWidth={3} />
      <Path d="M-14 -10 L6 -10 M-4 -20 L-4 0 M-11 -17 L3 -3 M3 -17 L-11 -3" stroke={WOOD_D} strokeWidth={1.2} />
      <Circle cx={-4} cy={-10} r={2.4} fill={GOLD_D} stroke={BEAR_LINE} strokeWidth={1} />
    </G>
  );
}
/* the chariot and its two horses, facing right on y, size s; flip turns them to face left */
function Team({
  x,
  y,
  s = 1,
  flip = false,
  reins = true,
  pair = true,
  children,
}: {
  x: number;
  y: number;
  s?: number;
  flip?: boolean;
  reins?: boolean;
  pair?: boolean;
  children?: ReactNode;
}) {
  return (
    <G transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      {pair ? <Horse x={72} y={-5} s={0.8} coat="#EFE6D2" mane="#8A7A66" /> : null}
      <Horse x={62} y={0} s={0.9} />
      <Path d="M10 -22 L58 -27" stroke={BEAR_LINE} strokeWidth={4.4} strokeLinecap="round" />
      <Path d="M10 -22 L58 -27" stroke={WOOD} strokeWidth={2.4} strokeLinecap="round" />
      <Chariot>{children}</Chariot>
      {reins ? <Path d="M9 -41 Q36 -49 66 -40" stroke={BEAR_LINE} strokeWidth={1.2} fill="none" strokeLinecap="round" /> : null}
    </G>
  );
}

/* ---------- places ---------- */
function Sun({ x = 252, y = 38 }: { x?: number; y?: number }) {
  return (
    <G>
      <Circle cx={x} cy={y} r={20} fill={GOLD} opacity={0.35} />
      <Circle cx={x} cy={y} r={12} fill={GOLD} />
    </G>
  );
}
/* a warm sky, far hills and the sandy road from y 134 */
function Stage({ sky = SKY, hills = true, sunX = 252 }: { sky?: string; hills?: boolean; sunX?: number }) {
  return (
    <G>
      <Rect x={10} y={10} width={280} height={162} rx={12} fill={sky} />
      <Sun x={sunX} />
      {hills ? <Path d="M10 118 Q60 96 118 110 Q180 88 238 106 Q268 98 290 108 L290 140 L10 140 Z" fill="#C9AE78" /> : null}
      <Path d="M10 134 L290 134 L290 160 Q290 172 278 172 L22 172 Q10 172 10 160 Z" fill={SAND_D} />
      <Path d="M10 150 Q120 140 290 148 L290 160 Q290 172 278 172 L22 172 Q10 172 10 160 Z" fill="#E4CB98" opacity={0.7} />
    </G>
  );
}
/* a flat-roofed house seen from the front, standing on y: its door is an arch with a lit room behind it, or a plain closed wooden door */
function House({ x0, x1, y, top, door, shut = false }: { x0: number; x1: number; y: number; top: number; door: [number, number, number]; shut?: boolean }) {
  const [dx0, dx1, dtop] = door;
  const r = (dx1 - dx0) / 2;
  const arch = `M${dx0} ${y} L${dx0} ${dtop + r} Q${dx0} ${dtop} ${dx0 + r} ${dtop} Q${dx1} ${dtop} ${dx1} ${dtop + r} L${dx1} ${y} Z`;
  return (
    <G stroke={EDGE} strokeWidth={1.4} strokeLinejoin="round">
      <Rect x={x0} y={top} width={x1 - x0} height={y - top} fill={WALL} />
      <Rect x={x0 - 4} y={top - 8} width={x1 - x0 + 8} height={9} rx={2} fill={STONE} />
      <Path d={`M${x0 + 8} ${top + 6} L${x1 - 8} ${top + 6}`} opacity={0.35} />
      {shut ? (
        <G>
          <Path d={arch} fill={WOOD} stroke={WOOD_D} strokeWidth={2} />
          <Path d={`M${(dx0 + dx1) / 2} ${dtop} L${(dx0 + dx1) / 2} ${y}`} stroke={WOOD_D} strokeWidth={1.4} />
          <Path d={`M${dx0 + 2} ${dtop + r + 8} L${dx1 - 2} ${dtop + r + 8} M${dx0 + 2} ${y - 12} L${dx1 - 2} ${y - 12}`} stroke={WOOD_D} strokeWidth={1.2} />
          <Circle cx={(dx0 + dx1) / 2 + 4} cy={dtop + r + 16} r={1.4} fill={GOLD_D} stroke="none" />
        </G>
      ) : (
        <G>
          <Path d={arch} fill="#3A2418" />
          <Path
            d={`M${dx0 + 4} ${y} L${dx0 + 4} ${dtop + r + 2} Q${dx0 + 4} ${dtop + 6} ${dx0 + r} ${dtop + 6} Q${dx1 - 4} ${dtop + 6} ${dx1 - 4} ${dtop + r + 2} L${dx1 - 4} ${y} Z`}
            fill={GOLD}
            opacity={0.5}
            stroke="none"
          />
        </G>
      )}
    </G>
  );
}

/* ---------- 1. a general sets out ---------- */
function General({ k }: { k: Ink }) {
  void k;
  const march: [number, number, boolean][] = [
    [104, 131, false],
    [120, 133, false],
    [246, 131, false],
    [264, 133, false],
    [281, 131, false],
  ];
  return (
    <Frame label="Naaman, a Syrian general in a bronze helmet and a purple cloak, rides out in his chariot with two horses and a line of soldiers, while a small servant girl in a doorway beside his wife points the way">
      <Stage />
      {march.map(([x, y, f], i) => (
        <Soldier key={i} x={x} y={y} s={0.6} flip={f} />
      ))}
      <House x0={12} x1={88} y={152} top={72} door={[32, 56, 100]} />
      <Robed
        x={48}
        y={160}
        s={0.98}
        robe="#2F8FA3"
        sash="#1B5E6E"
        hair="#2E2018"
        band={CREAM}
        arms={[
          [-9, -12, -17],
          [9, 15, -22],
        ]}
      />
      <Robed
        x={78}
        y={160}
        s={0.7}
        robe="#E0A93A"
        sash="#9A6F0C"
        hair="#6A4A30"
        longHair
        arms={[
          [-9, -12, -17],
          [9, 32, -44],
        ]}
        tilt={-6}
      />
      <Team x={152} y={162} s={0.82}>
        <Naaman
          x={-6}
          y={-14}
          s={0.9}
          arms={[
            [-9, 10, -30],
            [9, 17, -30],
          ]}
        />
      </Team>
    </Frame>
  );
}

/* ---------- 2. the plain door ---------- */
function Door({ k }: { k: Ink }) {
  void k;
  return (
    <Frame label="Naaman's chariots wait in front of a plain small house with a shut wooden door. A messenger at the door holds up all the fingers of both hands to show seven, and the prophet himself is not there to be seen">
      <Stage />
      <Team x={22} y={124} s={0.48} pair={false} reins={false}>
        <Naaman x={-6} y={-14} s={0.9} arms={[[9, 17, -30]]} />
      </Team>
      <House x0={170} x1={284} y={152} top={84} door={[208, 238, 114]} shut />
      <G fill="#3A2418" stroke={EDGE} strokeWidth={1.2}>
        <Rect x={182} y={100} width={14} height={18} rx={7} />
        <Rect x={258} y={100} width={14} height={18} rx={7} />
      </G>
      <Team x={58} y={160} s={0.84}>
        <Naaman
          x={-6}
          y={-14}
          s={0.9}
          tilt={-6}
          arms={[
            [-9, 10, -30],
            [9, 17, -30],
          ]}
        />
      </Team>
      <Robed
        x={192}
        y={162}
        s={1.2}
        flip
        robe="#8A5A2B"
        sash="#5E3A1A"
        hair="#4A3426"
        band={CREAM}
        arms={[
          [-9, -17, -43],
          [9, 17, -43],
        ]}>
        <Fingers x={-17} y={-45} n={5} />
        <Fingers x={17} y={-45} n={2} />
      </Robed>
    </Frame>
  );
}

/* ---------- 3. turning away in anger ---------- */
function Damascus() {
  const towers: [number, number, number, number][] = [
    [26, 18, 52, 1],
    [56, 22, 74, 1],
    [88, 14, 44, 0],
    [112, 18, 62, 1],
    [140, 14, 38, 0],
  ];
  return (
    <G>
      <Rect x={10} y={102} width={280} height={34} fill="#8DB36E" />
      <Path d="M10 96 L290 96 L290 112 L10 112 Z" fill="#DCC595" stroke={EDGE} strokeWidth={1.2} />
      {towers.map(([tx, w, h, dome], i) => (
        <G key={i} stroke={EDGE} strokeWidth={1.2} strokeLinejoin="round">
          <Rect x={tx - w / 2} y={112 - h} width={w} height={h} fill="#EAD6AE" />
          {dome ? (
            <Path
              d={`M${tx - w / 2 - 1} ${112 - h} Q${tx - w / 2 - 1} ${112 - h - w * 0.9} ${tx} ${112 - h - w * 0.9} Q${tx + w / 2 + 1} ${112 - h - w * 0.9} ${tx + w / 2 + 1} ${112 - h} Z`}
              fill="#D9A441"
            />
          ) : null}
          {dome ? (
            <Path d={`M${tx} ${112 - h - w * 0.9} L${tx} ${112 - h - w * 0.9 - 7}`} />
          ) : (
            <Rect x={tx - w / 2 - 2} y={112 - h - 4} width={w + 4} height={5} fill="#DCC595" />
          )}
          <Rect x={tx - 2.4} y={112 - h + 8} width={4.8} height={9} rx={2.4} fill="#3A2418" stroke="none" />
        </G>
      ))}
      <Path d="M10 126 Q70 112 130 122 Q190 132 290 116" stroke="#4E9CCB" strokeWidth={9} strokeLinecap="round" fill="none" />
      <Path d="M10 126 Q70 112 130 122 Q190 132 290 116" stroke="#8DCBEA" strokeWidth={2} strokeLinecap="round" fill="none" opacity={0.8} />
      <Path d="M30 136 Q100 126 170 134" stroke="#4E9CCB" strokeWidth={6} strokeLinecap="round" fill="none" />
    </G>
  );
}
function Rage({ k }: { k: Ink }) {
  void k;
  return (
    <Frame label="Naaman turns his chariot away from the prophet's house in a rage, arms thrown up, heading back toward the grand rivers and towers of Damascus in the distance, while dust rises behind him">
      <Rect x={10} y={10} width={280} height={162} rx={12} fill="#F3C98B" />
      <Sun x={246} y={36} />
      <Damascus />
      <Path d="M10 140 L290 140 L290 160 Q290 172 278 172 L22 172 Q10 172 10 160 Z" fill={SAND_D} />
      <Path d="M10 154 Q120 146 290 152 L290 160 Q290 172 278 172 L22 172 Q10 172 10 160 Z" fill="#E4CB98" opacity={0.7} />
      <Ellipse cx={270} cy={156} rx={16} ry={7} fill="#F1E1BE" opacity={0.7} />
      <Ellipse cx={282} cy={146} rx={11} ry={6} fill="#F1E1BE" opacity={0.55} />
      <Team x={236} y={164} s={0.84} flip reins={false}>
        <Naaman
          x={-6}
          y={-14}
          s={0.9}
          mood="angry"
          tilt={4}
          arms={[
            [-9, -15, -63],
            [9, 17, -63],
          ]}
        />
        <G stroke={BEAR_LINE} strokeWidth={2} strokeLinecap="round">
          <Line x1={-6} y1={-84} x2={-6} y2={-92} />
          <Line x1={4} y1={-82} x2={10} y2={-88} />
          <Line x1={-16} y1={-82} x2={-22} y2={-88} />
        </G>
      </Team>
    </Frame>
  );
}

/* ---------- 4. the servants speak gently ---------- */
function Servants({ k }: { k: Ink }) {
  void k;
  return (
    <Frame label="At the roadside two servants speak gently to Naaman, one with a kind open hand raised, and Naaman, still in his helmet and purple cloak with the pale patches on his arms, stands and listens, his head a little bowed. His chariot waits behind">
      <Stage />
      <Team x={236} y={128} s={0.5} pair={false} reins={false}>
        <Naaman x={-6} y={-14} s={0.9} arms={[[9, 17, -30]]} />
      </Team>
      <Robed
        x={64}
        y={156}
        s={1.06}
        robe="#5C7C8A"
        sash="#3B5662"
        hair="#4A3426"
        band="#3B5662"
        mood="calm"
        tilt={4}
        arms={[
          [-9, -12, -17],
          [9, 8, -29],
        ]}
      />
      <Robed
        x={106}
        y={162}
        s={1.16}
        robe="#8A5A2B"
        sash="#5E3A1A"
        hair="#4A3426"
        band={CREAM}
        mood="calm"
        arms={[
          [-9, -12, -17],
          [9, 22, -36],
        ]}
      />
      <Path d="M140 82 Q146 76 140 70 M146 84 Q154 76 146 68" stroke={BEAR_LINE} strokeWidth={1.6} fill="none" strokeLinecap="round" opacity={0.45} />
      <Naaman x={176} y={164} s={1.3} flip tilt={12} arms={ARMS_DOWN} />
    </Frame>
  );
}

/* ---------- 5. seven dips ---------- */
function Palm({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Path d="M0 0 Q4 -14 0 -30" stroke="#6B4A22" strokeWidth={3.4} fill="none" strokeLinecap="round" />
      <G stroke="#3E7A47" strokeWidth={3} strokeLinecap="round" fill="none">
        <Path d="M0 -30 Q-12 -34 -18 -24" />
        <Path d="M0 -30 Q-8 -40 -16 -38" />
        <Path d="M0 -30 Q8 -40 17 -37" />
        <Path d="M0 -30 Q12 -34 18 -24" />
        <Path d="M0 -30 Q0 -40 2 -44" />
      </G>
    </G>
  );
}
function River({ k }: { k: Ink }) {
  void k;
  const p = useRun(400, 3200);
  const marks = [0, 1, 2, 3, 4, 5, 6];
  const heal = Math.max(0, 1 - Math.max(0, p - 0.8) * 5);
  return (
    <Frame label="Naaman stands in the muddy Jordan up to his waist with his arms raised, glad, his skin healed and smooth. On the stone bank beside him are seven tally marks, one for each dip, and his bronze helmet rests on the stone">
      <Rect x={10} y={10} width={280} height={162} rx={12} fill={SKY} />
      <Sun x={246} y={36} />
      <Path d="M10 112 Q80 98 150 106 Q230 98 290 106 L290 138 L10 138 Z" fill="#7FA55E" />
      <Palm x={236} y={114} s={1.05} />
      <Palm x={268} y={112} s={0.9} />
      <Rect x={10} y={122} width={280} height={16} fill="#B39A68" />
      <Naaman
        x={196}
        y={166}
        s={1.5}
        helmet={false}
        mood="glad"
        tilt={-10}
        patches={heal}
        arms={[
          [-9, -17, -64],
          [9, 19, -62],
        ]}
      />
      <Path d="M10 138 L290 138 L290 160 Q290 172 278 172 L22 172 Q10 172 10 160 Z" fill="#A88B5C" opacity={0.94} />
      <Path d="M10 138 L290 138" stroke="#D8C08E" strokeWidth={2} />
      <Ellipse cx={196} cy={140} rx={32} ry={5} fill="none" stroke="#D8C08E" strokeWidth={1.5} />
      <Ellipse cx={196} cy={141} rx={48} ry={8} fill="none" stroke="#D8C08E" strokeWidth={1.2} opacity={0.6} />
      <Path d="M130 156 Q150 152 170 156 M214 160 Q236 156 258 160" stroke="#D8C08E" strokeWidth={1.4} strokeLinecap="round" fill="none" opacity={0.6} />
      {/* the bank, and the stone with seven marks on it */}
      <Path d="M10 114 Q42 106 82 110 Q112 114 118 142 L126 172 L22 172 Q10 172 10 160 Z" fill="#8C7B55" />
      <Path d="M10 114 Q42 106 82 110 Q112 114 118 142" stroke="#6A9A52" strokeWidth={4} fill="none" strokeLinecap="round" />
      <Rect x={22} y={92} width={74} height={50} rx={7} fill="#B9AB86" stroke={BEAR_LINE} strokeWidth={1.4} />
      {marks.map((i) => (
        <Line
          key={i}
          x1={34 + i * 8.6}
          y1={106}
          x2={34 + i * 8.6}
          y2={128}
          stroke={BEAR_LINE}
          strokeWidth={3}
          strokeLinecap="round"
          opacity={Math.max(0, Math.min(1, p * 7 - i))}
        />
      ))}
      <G transform="translate(59 92)" stroke={BEAR_LINE} strokeWidth={1.2} strokeLinejoin="round">
        <Path d="M0 -12 Q-1 -17 3 -18 Q2 -14 2.4 -12 Z" fill={PLUME} />
        <Path d="M-9 0 Q-9 -12 0 -12 Q9 -12 9 0 Z" fill={BRONZE} />
        <Rect x={-9.8} y={-3.6} width={19.6} height={3.4} rx={1.4} fill={BRONZE_D} />
      </G>
    </Frame>
  );
}

/* ---------- 6. the brass ball ---------- */
function needle(cx: number, cy: number, deg: number, len: number, w = 3.2): string {
  const a = (deg * Math.PI) / 180;
  const dx = Math.cos(a);
  const dy = Math.sin(a);
  const px = -dy * w;
  const py = dx * w;
  const pts: [number, number][] = [
    [cx - dx * 9, cy - dy * 9],
    [cx + px, cy + py],
    [cx + dx * len, cy + dy * len],
    [cx - px, cy - py],
  ];
  return pts.map(([x, y]) => `${x},${y}`).join(' ');
}
function Compass({ k }: { k: Ink }) {
  void k;
  const p = useRun(300, 2200);
  const e = 1 - (1 - p) * (1 - p);
  const swing = 22 * (1 - e) * Math.cos(p * 9);
  const BX = 100;
  const BY = 128;
  const aim = -8;
  return (
    <Frame label="Inside a tent in a desert camp, a round brass ball with two spindles, the Liahona, rests on a woven cloth. One spindle points out through the tent door toward a path that winds across the sand to a far ridge">
      <Rect x={10} y={10} width={280} height={162} rx={12} fill="#6B4630" />
      <Path d="M10 22 Q10 10 22 10 L150 10 L186 60 L10 70 Z" fill="#5A3B27" />
      <G stroke="#4A2E1E" strokeWidth={2} opacity={0.7}>
        <Path d="M60 10 L50 130 M110 10 L104 120 M10 70 L14 130" />
      </G>
      {/* the opening of the tent and the desert beyond */}
      <Path d="M170 150 L176 70 Q176 30 224 30 Q272 30 276 70 L280 150 Z" fill="#F3C47A" />
      <Circle cx={232} cy={78} r={10} fill={GOLD} opacity={0.9} />
      <Path d="M170 112 Q196 96 224 106 Q252 92 280 104 L280 150 L170 150 Z" fill="#9B7AA8" opacity={0.7} />
      <Path d="M170 128 Q200 112 236 124 Q262 116 280 122 L280 152 L170 152 Z" fill={SAND_D} />
      <Path d="M206 152 Q250 142 222 130 Q198 120 238 112 Q256 108 246 100" stroke="#FFF1B8" strokeWidth={7} strokeLinecap="round" fill="none" />
      <Path d="M170 150 L176 70 Q176 30 224 30 Q272 30 276 70 L280 150" stroke="#3A2418" strokeWidth={5} fill="none" strokeLinejoin="round" />
      {/* the floor and the cloth */}
      <Path d="M10 150 L290 150 L290 160 Q290 172 278 172 L22 172 Q10 172 10 160 Z" fill="#7A5535" />
      <Ellipse cx={BX} cy={152} rx={76} ry={15} fill="#B24A3A" stroke={BEAR_LINE} strokeWidth={1.4} />
      <Ellipse cx={BX} cy={152} rx={64} ry={11} fill="none" stroke="#F3D9A0" strokeWidth={1.6} strokeDasharray="5 4" />
      {/* a faint line of light from the spindle to the path */}
      <Path d="M146 124 L204 124" stroke={GOLD} strokeWidth={2.4} strokeDasharray="1 7" strokeLinecap="round" opacity={0.8} />
      <Ellipse cx={BX} cy={152} rx={22} ry={5} fill={BEAR_LINE} opacity={0.45} />
      <Circle cx={BX} cy={BY} r={44} fill={GOLD} opacity={0.14} />
      <Circle cx={BX} cy={BY} r={24} fill="#D9A441" stroke={BEAR_LINE} strokeWidth={1.6} />
      <Circle cx={BX} cy={BY} r={17} fill="none" stroke="#8A5A12" strokeWidth={1.4} />
      <Path
        d="M-12 -9 Q-6 -15 0 -12 M-14 0 Q-8 -4 -3 0 M4 8 Q10 4 15 9 M5 -12 Q10 -8 14 -11"
        transform={`translate(${BX} ${BY})`}
        stroke="#8A5A12"
        strokeWidth={1.2}
        fill="none"
        strokeLinecap="round"
      />
      <Polygon points={needle(BX, BY, -122, 36)} fill="#F2CF6B" stroke={BEAR_LINE} strokeWidth={1.2} strokeLinejoin="round" />
      <Polygon points={needle(BX, BY, aim + swing, 48)} fill="#F2CF6B" stroke={BEAR_LINE} strokeWidth={1.2} strokeLinejoin="round" />
      <Circle cx={BX} cy={BY} r={4} fill={GOLD_D} stroke={BEAR_LINE} strokeWidth={1.2} />
    </Frame>
  );
}

/* ---------- 7. the open window ---------- */
function Kneeler({ x, y, s = 1, tilt = -12 }: { x: number; y: number; s?: number; tilt?: number }) {
  const sw = 1.5 / s;
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Ellipse cx={-27} cy={0.4} rx={5} ry={2} fill={BEAR_LINE} />
      <Path
        d="M-27 0 L-14 -14 L-9 -38 Q-9 -47 0 -47 Q9 -47 9 -38 L8 -22 Q20 -24 28 -11 L31 0 Z"
        fill="#35609E"
        stroke={BEAR_LINE}
        strokeWidth={sw}
        strokeLinejoin="round"
      />
      <Path d="M-11 -23 L8 -21" stroke="#C98F1A" strokeWidth={3.4} />
      <Path d="M-8 -22 L-6 -9" stroke="#C98F1A" strokeWidth={3} strokeLinecap="round" />
      <Tube fill="#35609E" parts={[['M3 -38 L17 -49', 5]]} />
      <Hand x={18.5} y={-50} />
      <Tube fill="#35609E" parts={[['M1 -36 L14 -42', 5]]} />
      <Hand x={16} y={-43} />
      <G transform={`rotate(${tilt} 0 -47)`}>
        <Circle cx={1} cy={-55} r={8.5} fill={SKIN} stroke={BEAR_LINE} strokeWidth={sw} />
        <Path d="M-7.6 -56 Q-7.4 -65 1 -65 Q9.6 -64.6 9.6 -56 Q5 -60 1 -59.5 Q-4 -60 -7.6 -56 Z" fill="#6A5A48" />
        <Path d="M-7.6 -59.6 Q1 -64.4 9.6 -59.6" stroke={CREAM} strokeWidth={2.4} fill="none" strokeLinecap="round" />
        <Path
          d="M-5.4 -52 Q1 -42 7.4 -52 Q5.6 -47.6 1 -46.2 Q-3.6 -47.6 -5.4 -52 Z"
          fill="#6A5A48"
          stroke={BEAR_LINE}
          strokeWidth={0.8}
          strokeLinejoin="round"
        />
        <Circle cx={5} cy={-55} r={1.4} fill={BEAR_LINE} />
      </G>
    </G>
  );
}
function Window({ k }: { k: Ink }) {
  void k;
  const p = useRun(200, 2400);
  const glow = 0.14 + 0.07 * Math.sin(p * Math.PI);
  const blocks: [number, number, number][] = [
    [186, 12, 18],
    [198, 10, 26],
    [208, 14, 20],
    [236, 12, 24],
    [247, 10, 16],
  ];
  return (
    <Frame label="Daniel kneels at an open window in a quiet room, hands lifted, praying toward a distant city glowing in the evening light. Soft light falls through the window onto the floor around him">
      <Rect x={10} y={10} width={280} height={162} rx={12} fill="#5B3F31" />
      <Path d="M10 146 L290 146 L290 160 Q290 172 278 172 L22 172 Q10 172 10 160 Z" fill="#7A5535" />
      <Path d="M10 150 L290 150" stroke="#5E3A1A" strokeWidth={1.2} opacity={0.5} />
      {/* the window and the city beyond it */}
      <Path d="M178 142 L178 66 Q178 34 220 34 Q262 34 262 66 L262 142 Z" fill="#F7C46E" />
      <Circle cx={244} cy={62} r={9} fill={GOLD} opacity={0.9} />
      <Path d="M178 124 Q206 112 262 122 L262 142 L178 142 Z" fill="#C79A62" />
      <G fill="#8A5E3A">
        {blocks.map(([bx, w, h], i) => (
          <Rect key={i} x={bx} y={134 - h} width={w} height={h + 8} />
        ))}
        <Rect x={218} y={108} width={16} height={34} />
        <Path d="M216 108 Q226 88 236 108 Z" fill={GOLD_D} />
        <Path d="M226 90 L226 84" stroke="#8A5E3A" strokeWidth={2} />
      </G>
      <Path d="M178 142 L178 66 Q178 34 220 34 Q262 34 262 66 L262 142" stroke="#2A1810" strokeWidth={6} fill="none" strokeLinejoin="round" />
      <Rect x={170} y={140} width={100} height={9} rx={2} fill="#C9A266" stroke={EDGE} strokeWidth={1.4} />
      <Polygon points="180,149 262,149 288,172 104,172" fill={GOLD} opacity={glow} />
      <Ellipse cx={110} cy={160} rx={48} ry={7} fill="#9B3B3B" stroke={BEAR_LINE} strokeWidth={1.2} />
      <Kneeler x={108} y={158} s={1.3} />
    </Frame>
  );
}

/* ---------- 8 to 10. fifteen minutes, a room of them, and the days ---------- */
const FOLK_HAIR = ['#3A2A20', '#2A1E18', '#6A4A30', '#8A8A8E', '#4A3426'];
const SHIRTS = ['#2FA39A', '#D9822B', '#7A4FA0', '#5C7C8A', '#C27A8A', '#6E9A6A', '#B5532A'];
/* someone seen from the front at a desk, base on y: headset on, pushed back on the head, or none; stand makes them taller; down looks at the page; the hands rest on the desk */
function Bust({
  x,
  y,
  s = 1,
  shirt,
  hair,
  headset = 'none',
  stand = false,
  down = false,
  hands = [
    [-9, 7],
    [9, 8],
  ],
}: {
  x: number;
  y: number;
  s?: number;
  shirt: string;
  hair: string;
  headset?: 'on' | 'pushed' | 'none';
  stand?: boolean;
  down?: boolean;
  hands?: [number, number][];
}) {
  const lift = stand ? -9 : 0;
  const cy = -38 + lift;
  const sw = 1.4 / s;
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      {hands.map(([hx, hy], i) => (
        <G key={`a${i}`}>
          <Tube fill={shirt} parts={[[`M${i === 0 ? -15 : 15} ${-21 + lift} L${hx} ${hy}`, 6]]} />
        </G>
      ))}
      <Path
        d={`M-17 0 Q-17 ${-22 + lift} -8 ${-27 + lift} L8 ${-27 + lift} Q17 ${-22 + lift} 17 0 Z`}
        fill={shirt}
        stroke={BEAR_LINE}
        strokeWidth={sw}
        strokeLinejoin="round"
      />
      <Rect x={-3.6} y={-31 + lift} width={7.2} height={6} fill={SKIN} />
      <Circle cx={0} cy={cy} r={10.5} fill={SKIN} stroke={BEAR_LINE} strokeWidth={sw} />
      <Path
        d={`M-10.6 ${cy - 1} Q-10.4 ${cy - 12} 0 ${cy - 12} Q10.4 ${cy - 11.6} 10.6 ${cy - 1} Q4 ${cy - 6} 0 ${cy - 5.6} Q-5 ${cy - 6} -10.6 ${cy - 1} Z`}
        fill={hair}
      />
      {down ? (
        <Path
          d={`M-6 ${cy + 1} Q-3.8 ${cy + 3} -1.6 ${cy + 1} M1.6 ${cy + 1} Q3.8 ${cy + 3} 6 ${cy + 1}`}
          stroke={BEAR_LINE}
          strokeWidth={1.2}
          fill="none"
          strokeLinecap="round"
        />
      ) : (
        <G fill={BEAR_LINE}>
          <Circle cx={-3.6} cy={cy} r={1.3} />
          <Circle cx={3.6} cy={cy} r={1.3} />
        </G>
      )}
      <Path d={`M-2.4 ${cy + 6} Q0 ${cy + 8} 2.4 ${cy + 6}`} stroke={BEAR_LINE} strokeWidth={1.1} fill="none" strokeLinecap="round" />
      {headset === 'on' ? (
        <G stroke={BEAR_LINE} strokeWidth={0.9}>
          <Path d={`M-11 ${cy - 2} Q0 ${cy - 17} 11 ${cy - 2}`} fill="none" stroke="#2C3446" strokeWidth={2.6} strokeLinecap="round" />
          <Rect x={-14.4} y={cy - 5} width={5.4} height={10} rx={2.4} fill="#2C3446" />
          <Rect x={9} y={cy - 5} width={5.4} height={10} rx={2.4} fill="#2C3446" />
          <Path d={`M-12 ${cy + 5} Q-12 ${cy + 11} -4.6 ${cy + 10}`} fill="none" stroke="#2C3446" strokeWidth={1.6} strokeLinecap="round" />
          <Circle cx={-4} cy={cy + 10} r={1.8} fill="#2C3446" />
        </G>
      ) : null}
      {headset === 'pushed' ? (
        <G stroke={BEAR_LINE} strokeWidth={0.9}>
          <Path d={`M-10 ${cy - 8} Q0 ${cy - 21} 10 ${cy - 8}`} fill="none" stroke="#2C3446" strokeWidth={2.6} strokeLinecap="round" />
          <Rect x={-13.4} y={cy - 13} width={5.4} height={9} rx={2.4} fill="#2C3446" />
          <Rect x={8} y={cy - 13} width={5.4} height={9} rx={2.4} fill="#2C3446" />
          <Path d={`M-13 ${cy - 11} Q-19 ${cy - 15} -16 ${cy - 21}`} fill="none" stroke="#2C3446" strokeWidth={1.6} strokeLinecap="round" />
          <Circle cx={-16} cy={cy - 22} r={1.8} fill="#2C3446" />
        </G>
      ) : null}
      {hands.map(([hx, hy], i) => (
        <Hand key={`h${i}`} x={hx} y={hy} r={3.2} />
      ))}
    </G>
  );
}
function Hourglass({ x, y, s = 1, top }: { x: number; y: number; s?: number; top: number }) {
  const g = 1 - top;
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Polygon points="-8,-18 8,-18 0,0" fill="#CFE9F5" opacity={0.55} />
      <Polygon points="-8,18 8,18 0,0" fill="#CFE9F5" opacity={0.55} />
      <Polygon points={`0,0 ${-8 * top},${-18 * top} ${8 * top},${-18 * top}`} fill="#F2CF6B" />
      <Polygon points={`-8,18 8,18 ${8 * (1 - g)},${18 - 18 * g} ${-8 * (1 - g)},${18 - 18 * g}`} fill="#F2CF6B" />
      <Line x1={0} y1={0} x2={0} y2={18 - 18 * g} stroke="#F2CF6B" strokeWidth={0.9} />
      <Path d="M-8 -18 L8 -18 L0 0 L8 18 L-8 18 L0 0 Z" fill="none" stroke={BEAR_LINE} strokeWidth={1.4 / s} strokeLinejoin="round" />
      <Rect x={-11} y={-22} width={22} height={4.4} rx={1.4} fill={WOOD} stroke={BEAR_LINE} strokeWidth={1.3 / s} />
      <Rect x={-11} y={17.6} width={22} height={4.4} rx={1.4} fill={WOOD} stroke={BEAR_LINE} strokeWidth={1.3 / s} />
    </G>
  );
}
/* a few handwritten lines on a page, from (x, y) */
function Lines({ x, y, n, w = 22, gap = 5 }: { x: number; y: number; n: number; w?: number; gap?: number }) {
  return (
    <G stroke="#8A7C62" strokeWidth={1.1} strokeLinecap="round" fill="none">
      {Array.from({ length: n }, (_, i) => (
        <Path key={i} d={`M${x} ${y + i * gap} q${w / 6} -1.6 ${w / 3} 0 t${w / 3} 0 t${w / 3 - (i % 2) * 5} 0`} />
      ))}
    </G>
  );
}
function Notes({ k }: { k: Ink }) {
  void k;
  const p = useRun(300, 3000);
  const top = 0.82 - 0.4 * p;
  return (
    <Frame label="A new trainee at a desk, headset pushed back on her head, writes a few honest lines in a notebook. Beside the notebook stands a small sand timer marked 15 for fifteen minutes">
      <Rect x={10} y={10} width={280} height={162} rx={12} fill="#8FA6BF" />
      <Rect x={22} y={50} width={46} height={34} rx={3} fill="#2C3446" stroke={BEAR_LINE} strokeWidth={1.4} />
      <Rect x={26} y={54} width={38} height={26} rx={1.6} fill="#5E8FC9" />
      <Path d="M30 62 L52 62 M30 68 L58 68 M30 74 L46 74" stroke="#CFE0F2" strokeWidth={1.4} strokeLinecap="round" />
      <Rect x={41} y={84} width={8} height={24} fill="#2C3446" />
      <Path d="M10 112 L26 100 L274 100 L290 112 L290 136 L10 136 Z" fill="#C99058" stroke={BEAR_LINE} strokeWidth={1.4} strokeLinejoin="round" />
      <Path d="M10 136 L290 136 L290 160 Q290 172 278 172 L22 172 Q10 172 10 160 Z" fill="#9A6A3E" />
      <Path
        d="M76 112 L120 112 L120 132 L68 132 Z M120 112 L164 112 L172 132 L120 132 Z"
        fill={CREAM}
        stroke={BEAR_LINE}
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
      <Lines x={82} y={118} n={3} w={30} />
      <Lines x={128} y={118} n={2} w={30} />
      <Bust x={120} y={112} s={1.7} shirt="#2FA39A" hair={HAIR} headset="pushed" down />
      <Path d="M130.4 129 L138 123" stroke="#2C3446" strokeWidth={2} strokeLinecap="round" />
      <Hourglass x={232} y={92} s={1.2} top={top} />
      <Rect x={218} y={124} width={30} height={12} rx={2.4} fill={CREAM} stroke={BEAR_LINE} strokeWidth={1.3} />
      <Say x={233} y={133.6} s="15" fill={BEAR_LINE} size={10} />
    </Frame>
  );
}

function Center({ k }: { k: Ink }) {
  void k;
  const back = [44, 108, 172, 236];
  const front = [74, 140, 204, 262];
  return (
    <Frame label="A call-center training room. In the back row trainees sit at their desks with headsets on, and in the front row the trainees have stood up, headsets pushed back, to write in their notebooks">
      <Rect x={10} y={10} width={280} height={162} rx={12} fill="#9DB0C6" />
      <Path d="M10 92 L290 92 L290 160 Q290 172 278 172 L22 172 Q10 172 10 160 Z" fill="#7C8A9B" />
      <Rect x={30} y={22} width={44} height={40} rx={3} fill="#BFD6E6" stroke="#3E4A5E" strokeWidth={2.4} />
      <Path d="M52 22 L52 62 M30 42 L74 42" stroke="#3E4A5E" strokeWidth={1.6} />
      {/* the back row, seated */}
      {back.map((x, i) => (
        <Rect key={`c${i}`} x={x - 16} y={76} width={32} height={28} rx={9} fill="#46536A" stroke={BEAR_LINE} strokeWidth={1.1} />
      ))}
      <Rect x={14} y={101} width={272} height={8} fill="#C99058" stroke={BEAR_LINE} strokeWidth={1} />
      <Rect x={14} y={109} width={272} height={11} fill="#9A6A3E" />
      {back.map((x, i) => (
        <Bust
          key={`b${i}`}
          x={x}
          y={101}
          s={0.62}
          shirt={SHIRTS[i]}
          hair={FOLK_HAIR[i]}
          headset="on"
          hands={[
            [-8, 5],
            [8, 5],
          ]}
        />
      ))}
      {/* the front row, standing and writing */}
      <Ellipse cx={150} cy={122} rx={130} ry={24} fill={GOLD} opacity={0.14} />
      <Rect x={14} y={138} width={272} height={12} fill="#C99058" stroke={BEAR_LINE} strokeWidth={1.2} />
      <Path d="M14 150 L286 150 L286 160 Q286 172 274 172 L26 172 Q14 172 14 160 Z" fill="#9A6A3E" />
      {front.map((x, i) => (
        <G key={`n${i}`}>
          <Path d={`M${x - 14} 140 L${x + 14} 140 L${x + 16} 148 L${x - 16} 148 Z`} fill={CREAM} stroke={BEAR_LINE} strokeWidth={1.1} strokeLinejoin="round" />
          <Path d={`M${x - 9} 143.4 L${x + 3} 143.4 M${x - 9} 146 L${x - 1} 146`} stroke="#8A7C62" strokeWidth={1} strokeLinecap="round" />
        </G>
      ))}
      {front.map((x, i) => (
        <Bust
          key={`f${i}`}
          x={x}
          y={138}
          s={0.95}
          shirt={SHIRTS[(i + 4) % SHIRTS.length]}
          hair={FOLK_HAIR[(i + 2) % FOLK_HAIR.length]}
          headset="pushed"
          stand
          down
          hands={[
            [-6, 8],
            [7, 8],
          ]}
        />
      ))}
    </Frame>
  );
}

function Notebook({ x, y, lines, cover = '#B5532A' }: { x: number; y: number; lines: [number, number]; cover?: string }) {
  return (
    <G transform={`translate(${x} ${y})`}>
      <Path d="M-23 -22 L-23 3 Q-11 0 0 3 Q11 0 23 3 L23 -22 Z" fill={cover} stroke={BEAR_LINE} strokeWidth={1.3} strokeLinejoin="round" />
      <Path d="M-20 -22 Q-10 -26 0 -22 L0 0 Q-10 -3 -20 0 Z" fill={CREAM} stroke={BEAR_LINE} strokeWidth={1.2} strokeLinejoin="round" />
      <Path d="M20 -22 Q10 -26 0 -22 L0 0 Q10 -3 20 0 Z" fill={CREAM} stroke={BEAR_LINE} strokeWidth={1.2} strokeLinejoin="round" />
      <Lines x={-16} y={-16} n={lines[0]} w={13} gap={5} />
      <Lines x={4} y={-16} n={lines[1]} w={13} gap={5} />
    </G>
  );
}
function MiniSun({ x, y, o = 1 }: { x: number; y: number; o?: number }) {
  const rays = [0, 45, 90, 135, 180, 225, 270, 315];
  return (
    <G opacity={o}>
      <Circle cx={x} cy={y} r={13} fill={GOLD} opacity={0.25} />
      {rays.map((a) => {
        const r = (a * Math.PI) / 180;
        return (
          <Line
            key={a}
            x1={x + Math.cos(r) * 8.6}
            y1={y + Math.sin(r) * 8.6}
            x2={x + Math.cos(r) * 12}
            y2={y + Math.sin(r) * 12}
            stroke={GOLD_D}
            strokeWidth={1.8}
            strokeLinecap="round"
          />
        );
      })}
      <Circle cx={x} cy={y} r={6.4} fill={GOLD} stroke={GOLD_D} strokeWidth={1.2} />
    </G>
  );
}
function Days({ k }: { k: Ink }) {
  void k;
  const p = useRun(300, 2000);
  const xs = [36, 84, 132, 180, 228];
  return (
    <Frame label="A row of small open notebooks on a table, left to right, each with a few written lines and a small sun above it for the day it holds, and a person standing at the end of the table writing the next one">
      <Rect x={10} y={10} width={280} height={162} rx={12} fill="#C9A06A" />
      <Path d="M10 150 L290 150 L290 160 Q290 172 278 172 L22 172 Q10 172 10 160 Z" fill="#7A5535" />
      {xs.map((x, i) => (
        <MiniSun key={x} x={x} y={80 - i * 4} o={i < 4 ? 1 : 0.35 + 0.65 * p} />
      ))}
      <Path d="M20 128 L248 128 L248 134 L20 134 Z" fill="#B07A45" stroke={BEAR_LINE} strokeWidth={1.4} strokeLinejoin="round" />
      <Path d="M24 134 L244 134 L244 172 L24 172 Z" fill="#8A5A2B" />
      {xs.map((x, i) => (
        <Notebook key={x} x={x} y={127} lines={i < 4 ? [3, 3] : [3, Math.max(1, Math.round(1 + p * 2))]} cover={i % 2 === 0 ? '#B5532A' : '#2F8F9A'} />
      ))}
      <Robed x={270} y={162} s={1.12} flip robe="#7A4FA0" sash="#4A2F66" hair="#3A2A20" mood="calm" tilt={14} arms={[[9, 28, -42]]} />
      <Path d="M-1 0 L-7 5" transform="translate(240 112)" stroke={BEAR_LINE} strokeWidth={2.2} strokeLinecap="round" />
    </Frame>
  );
}

export const SCENES_I11: Record<string, ComponentType<{ k: Ink }>> = {
  'g11-general': General,
  'g11-door': Door,
  'g11-rage': Rage,
  'g11-servants': Servants,
  'g11-river': River,
  'g11-compass': Compass,
  'g11-window': Window,
  'g11-notes': Notes,
  'g11-center': Center,
  'g11-days': Days,
};
