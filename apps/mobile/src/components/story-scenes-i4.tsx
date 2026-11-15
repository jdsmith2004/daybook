/* Scenes for lesson g4, "A new heart is given" (see story-kit.tsx and story-scenes-f-l31.tsx for the approach): the ten lepers on the road (always gray-brown
   wraps with bandaged hands, turning bright as they are healed), Jesus in a white robe with a red sash and a simple face, the stone heart that becomes
   a heart of flesh, the days that grow a little brighter, the first step on the road at dawn, and young Benjamin Franklin with his
   little book of spots and the speckled axe. Every figure carries a dark outline so it reads on a dark card and a cream one. */
import { type ComponentType, useEffect, useState } from 'react';
import { Easing } from 'react-native';
import { Circle, ClipPath, Defs, Ellipse, G, Line, Path, Rect } from 'react-native-svg';

import { useAppear, useReducedMotion } from '@/lib/motion';

import { BEAR_LINE, Frame, type Ink } from './story-kit';

const SKIN = '#E7B98F';
const HAIR = '#3A2A20';
const GOLD = '#FFD25A';
const GOLD_D = '#C98F1A';
const CREAM = '#FFF5E1';
const WOOD = '#B07A45';
const WOOD_D = '#5E3A1A';
const EDGE = '#8A6A3A';
const SAND = '#EBD3A2';
const SAND_D = '#D2A86A';
const STONE = '#F3E3BC';
const RED = '#C4302E';
const ROBE_W = '#FBF7EC';
const LEP = '#8C7B6A';
const LEP_D = '#5E5044';
const LEP_SKIN = '#BF9F88';
const BRIGHT = '#FFFBEE';
const TRAV = '#4F6FBF';
const HEART_RED = '#E5405A';

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
/* an angle in degrees that keeps turning, and holds still for people who asked for less motion */
function useTurn(speed: number, still0 = 30) {
  const still = useReducedMotion();
  const [a, setA] = useState(still0);
  useEffect(() => {
    if (still) return undefined;
    const t0 = Date.now();
    const id = setInterval(() => setA(still0 + ((((Date.now() - t0) / 1000) * speed) % 360)), 60);
    return () => clearInterval(id);
  }, [still, speed, still0]);
  return a;
}

const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
function mix(a: string, b: string, t: number) {
  const f = (h: string, i: number) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16);
  const c = clamp(t);
  const m = (i: number) =>
    Math.round(f(a, i) + (f(b, i) - f(a, i)) * c)
      .toString(16)
      .padStart(2, '0');
  return `#${m(0)}${m(1)}${m(2)}`;
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

const BODY = 'M-13 0 L-9 -33 Q-9 -42 0 -42 Q9 -42 9 -33 L13 0 Z';

/* ---------- the people ---------- */

/* Jesus, standing on (x, y): a white robe, a red sash, long brown hair and a short beard, a simple face. Faces right; flip turns him. pose: stand or point */
function Jesus({ x, y, s = 1, flip = false, pose = 'stand' }: { x: number; y: number; s?: number; flip?: boolean; pose?: 'stand' | 'point' }) {
  const sw = 1.5 / s;
  return (
    <G transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      <Path d="M-15 0 L-10 -33 Q-10 -43 0 -43 Q10 -43 10 -33 L15 0 Z" fill={ROBE_W} stroke={BEAR_LINE} strokeWidth={sw} strokeLinejoin="round" />
      <Path d="M-4 -40 L-5 -2" stroke={EDGE} strokeWidth={1} opacity={0.3} />
      <Path d="M-11.5 -22 L11.5 -22" stroke={RED} strokeWidth={4} strokeLinecap="round" />
      <Path d="M5 -21 L9 -6" stroke={RED} strokeWidth={3.2} strokeLinecap="round" />
      <Path d="M-11.5 -22 L11.5 -22" stroke={BEAR_LINE} strokeWidth={0.6} opacity={0.5} />
      {pose === 'point' ? (
        <G>
          <Tube fill={ROBE_W} parts={[['M-9 -34 L-12 -18', 5.5]]} />
          <Hand x={-12} y={-16} r={3.2} />
          <Tube fill={ROBE_W} parts={[['M9 -35 L31 -43', 5.5]]} />
          <Hand x={33} y={-43.5} r={3.2} />
        </G>
      ) : (
        <G>
          <Tube fill={ROBE_W} parts={[['M-9 -34 L-12 -18', 5.5]]} />
          <Tube fill={ROBE_W} parts={[['M9 -34 L13 -19', 5.5]]} />
          <Hand x={-12} y={-16} r={3.2} />
          <Hand x={13} y={-17} r={3.2} />
        </G>
      )}
      <Path d="M-9.4 -49 Q-12 -37 -8 -33 L-3 -38 Z" fill="#6B4528" stroke={BEAR_LINE} strokeWidth={sw * 0.7} strokeLinejoin="round" />
      <Circle cx={0} cy={-50} r={8.6} fill={SKIN} stroke={BEAR_LINE} strokeWidth={sw} />
      <Path d="M-9 -51 Q-9.4 -61 0 -61 Q9.4 -61 9 -51 Q5 -56 0 -55.5 Q-5 -56 -9 -51 Z" fill="#6B4528" />
      <Path d="M-4 -45 Q0 -39 6 -43 Q5 -42 3 -42 Q0 -41 -4 -45 Z" fill="#6B4528" />
      <Circle cx={4} cy={-50} r={1.4} fill={BEAR_LINE} />
    </G>
  );
}

type LepPose = 'stand' | 'raise' | 'walk' | 'wave';
/* one of the ten, standing on (x, y): gray-brown wraps with bands across them and bandaged hands. heal runs 0 (sick) to 1 (bright and glowing).
   Faces right; flip turns him. */
function Leper({
  x,
  y,
  s = 1,
  flip = false,
  rot = 0,
  pose = 'stand',
  heal = 0,
}: {
  x: number;
  y: number;
  s?: number;
  flip?: boolean;
  rot?: number;
  pose?: LepPose;
  heal?: number;
}) {
  const sw = 1.5 / s;
  const wrap = mix(LEP, BRIGHT, heal);
  const band = mix(LEP_D, '#E8C46A', heal);
  const skin = mix(LEP_SKIN, SKIN, heal);
  const arm = (d: string) => <Tube fill={wrap} parts={[[d, 5]]} />;
  const hand = (hx: number, hy: number) => (
    <G>
      <Hand x={hx} y={hy} r={3.9} fill={wrap} />
      <Path d={`M${hx - 3.4} ${hy - 0.6} L${hx + 3.4} ${hy + 1}`} stroke={band} strokeWidth={1.1} strokeLinecap="round" />
    </G>
  );
  return (
    <G transform={`translate(${x} ${y}) rotate(${rot}) scale(${flip ? -s : s} ${s})`}>
      {heal > 0.02 ? (
        <G>
          <Circle cx={0} cy={-28} r={38} fill={GOLD} opacity={heal * 0.16} />
          <Circle cx={0} cy={-28} r={27} fill={GOLD} opacity={heal * 0.22} />
        </G>
      ) : null}
      <Path d={BODY} fill={wrap} stroke={BEAR_LINE} strokeWidth={sw} strokeLinejoin="round" />
      <G stroke={band} strokeWidth={1.4} strokeLinecap="round" opacity={0.85}>
        <Path d="M-11 -9 L11 -14 M-10.5 -17 L10.5 -22 M-10 -25 L10 -30 M-9 -33 L9 -37" />
      </G>
      {pose === 'raise' ? (
        <G>
          {arm('M-8 -34 L-17 -52')}
          {arm('M8 -34 L17 -52')}
          {hand(-18, -54)}
          {hand(18, -54)}
        </G>
      ) : pose === 'walk' ? (
        <G>
          {arm('M-9 -34 L-13 -19')}
          {arm('M9 -34 L16 -25')}
          {hand(-13, -17)}
          {hand(17, -24)}
        </G>
      ) : pose === 'wave' ? (
        <G>
          {arm('M-9 -34 L-12 -18')}
          {arm('M8 -34 L20 -53')}
          {hand(-12, -16)}
          {hand(21, -55)}
        </G>
      ) : (
        <G>
          {arm('M-9 -34 L-12 -18')}
          {arm('M9 -34 L12 -18')}
          {hand(-12, -16)}
          {hand(12, -16)}
        </G>
      )}
      <Circle cx={0} cy={-49} r={8.5} fill={skin} stroke={BEAR_LINE} strokeWidth={sw} />
      <Path
        d="M-8.8 -48 Q-9.2 -60 0 -60 Q9.2 -60 8.8 -48 Q5 -52 0 -51.5 Q-5 -52 -8.8 -48 Z"
        fill={wrap}
        stroke={BEAR_LINE}
        strokeWidth={sw * 0.7}
        strokeLinejoin="round"
      />
      <Path d="M-8.4 -53 L8.4 -55.5" stroke={band} strokeWidth={1.3} strokeLinecap="round" />
      <Path d="M-8.8 -50 Q-13 -46 -10.5 -41 L-6.5 -46 Z" fill={wrap} stroke={BEAR_LINE} strokeWidth={sw * 0.7} strokeLinejoin="round" />
      <Circle cx={4} cy={-48} r={1.4} fill={BEAR_LINE} />
    </G>
  );
}

/* a person of the crowd or the shop, on (x, y): a plain colored tunic and dark hair; faces right, flip turns */
function Folk({
  x,
  y,
  s = 1,
  fill,
  hair = HAIR,
  flip = false,
  rot = 0,
  down = 0,
}: {
  x: number;
  y: number;
  s?: number;
  fill: string;
  hair?: string;
  flip?: boolean;
  rot?: number;
  down?: number;
}) {
  const sw = 1.5 / s;
  return (
    <G transform={`translate(${x} ${y}) rotate(${rot}) scale(${flip ? -s : s} ${s})`}>
      <Path d={BODY} fill={fill} stroke={BEAR_LINE} strokeWidth={sw} strokeLinejoin="round" />
      <Path d="M-10.5 -20 L10.5 -20" stroke={BEAR_LINE} strokeWidth={2.2} strokeLinecap="round" opacity={0.4} />
      <Tube fill={fill} parts={[['M-9 -34 L-12 -17', 5]]} />
      <Tube fill={fill} parts={[['M9 -34 L12 -17', 5]]} />
      <Hand x={-12} y={-15} r={3.2} />
      <Hand x={12} y={-15} r={3.2} />
      <G transform={`rotate(${down} 0 -42)`}>
        <Circle cx={0} cy={-49} r={8.5} fill={SKIN} stroke={BEAR_LINE} strokeWidth={sw} />
        <Path d="M-8.6 -50 Q-8.4 -59 0 -59 Q8.6 -58.6 8.6 -50 Q4 -54 0 -53.5 Q-5 -54 -8.6 -50 Z" fill={hair} />
        <Circle cx={4} cy={-48} r={1.5} fill={BEAR_LINE} />
      </G>
    </G>
  );
}

/* a hill village: flat-roofed houses of baked clay with dark doorways */
function Houses({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  const house = (hx: number, w: number, h: number, key: string) => (
    <G key={key}>
      <Rect x={hx} y={-h} width={w} height={h} fill="#E9D0A0" stroke={EDGE} strokeWidth={1.3} />
      <Rect x={hx - 2} y={-h - 3} width={w + 4} height={4} fill="#D4B27A" stroke={EDGE} strokeWidth={1.1} />
      <Path d={`M${hx + w / 2 - 4} 0 L${hx + w / 2 - 4} -11 Q${hx + w / 2} -15 ${hx + w / 2 + 4} -11 L${hx + w / 2 + 4} 0 Z`} fill="#3A2418" />
    </G>
  );
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      {house(0, 34, 30, 'a')}
      {house(38, 28, 40, 'b')}
      {house(70, 32, 26, 'c')}
    </G>
  );
}

/* the temple on its hill, small and far: steps, columns and a roof */
function Temple({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`} stroke={EDGE} strokeWidth={1.3 / s} strokeLinejoin="round">
      <Circle cx={0} cy={-18} r={30} fill={GOLD} opacity={0.2} stroke="none" />
      <Rect x={-26} y={-4} width={52} height={4} fill={STONE} />
      <Rect x={-22} y={-8} width={44} height={4} fill={STONE} />
      {[-18, -6, 6, 18].map((cx) => (
        <Rect key={cx} x={cx - 2.4} y={-28} width={4.8} height={20} fill={STONE} />
      ))}
      <Path d="M-26 -28 L0 -44 L26 -28 Z" fill={SAND_D} />
      <Rect x={-26} y={-31} width={52} height={4} fill={STONE} />
    </G>
  );
}

/* Jesus' road: a winding strip from the lower left up to the hill */
const ROAD_UP = 'M50 172 Q150 118 232 92 L244 99 Q190 134 126 172 Z';

/* ---------- 1. ten men stood far off ---------- */
function TenScene({ k }: { k: Ink }) {
  void k;
  const p = useRun(500, 1200);
  const back = [122, 142, 162, 182, 202];
  const front = [112, 132, 152, 172, 192];
  const arcs = [
    [226, 104, 8],
    [234, 100, 12],
    [243, 96, 16],
  ] as const;
  return (
    <Frame label="At the edge of a village, ten men in gray-brown wraps with bandaged hands stand far off in two rows, arms raised, calling out. Far to the right, small on the road, Jesus in a white robe with a red sash stands alone">
      <Rect x={10} y={10} width={280} height={162} rx={12} fill="#F2BC8A" />
      <Circle cx={248} cy={42} r={26} fill={GOLD} opacity={0.3} />
      <Circle cx={248} cy={42} r={15} fill={GOLD} />
      <Path d="M10 118 Q80 104 150 114 Q220 104 290 112 L290 160 Q290 172 278 172 L22 172 Q10 172 10 160 Z" fill="#D8AA6C" />
      <Path d="M10 140 L290 128 L290 160 Q290 172 278 172 L22 172 Q10 172 10 160 Z" fill={SAND} />
      <Houses x={20} y={122} s={0.95} />
      {/* the line they may not cross: a row of small stones */}
      <G fill="#B9A27A" stroke={EDGE} strokeWidth={1}>
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <Ellipse key={i} cx={104 + (i % 2) * 2} cy={124 + i * 7} rx={3.2} ry={2.4} />
        ))}
      </G>
      {back.map((bx) => (
        <Leper key={`b${bx}`} x={bx} y={140} s={0.5} pose="raise" />
      ))}
      {front.map((fx) => (
        <Leper key={`f${fx}`} x={fx} y={164} s={0.6} pose="raise" />
      ))}
      {/* their calling, going out toward Him */}
      <G fill="none" stroke={WOOD_D} strokeWidth={1.8} strokeLinecap="round" opacity={0.7 * p}>
        {arcs.map(([ax, ay, r]) => (
          <Path key={ax} d={`M${ax} ${ay - r} Q${ax + r * 0.7} ${ay} ${ax} ${ay + r}`} />
        ))}
      </G>
      <Jesus x={262} y={146} s={0.55} flip />
    </Frame>
  );
}

/* ---------- 2. go, show yourselves to the priests ---------- */
function GoScene({ k }: { k: Ink }) {
  void k;
  const p = useRun(400, 1200);
  const front: [number, boolean][] = [
    [100, true],
    [120, true],
    [140, false],
    [160, false],
    [180, false],
  ];
  const back: [number, boolean][] = [
    [112, true],
    [132, false],
    [152, false],
    [172, false],
    [192, false],
  ];
  return (
    <Frame label="Jesus, in a white robe with a red sash, points down a road toward a temple on a distant hill. Ten men in gray-brown wraps with bandaged hands, still sick, are turning to go that way">
      <Rect x={10} y={10} width={280} height={162} rx={12} fill="#F7E0A8" />
      <Path d="M10 126 Q60 112 110 124 Q150 112 190 126 L190 172 L22 172 Q10 172 10 160 Z" fill="#B9C98B" />
      <Path d="M150 136 Q230 70 290 84 L290 160 Q290 172 278 172 L190 172 Z" fill="#A9B878" />
      <Path d="M10 144 Q100 136 190 150 L190 172 L22 172 Q10 172 10 160 Z" fill="#D8AA6C" />
      <Temple x={250} y={86} s={0.8 + 0.06 * p} />
      <Path d={ROAD_UP} fill="#EFD7A6" stroke={EDGE} strokeWidth={1.2} strokeLinejoin="round" />
      <Path d="M92 166 Q156 128 222 98" stroke={EDGE} strokeWidth={1.6} strokeDasharray="1 7" strokeLinecap="round" fill="none" opacity={0.5} />
      {back.map(([bx, fl]) => (
        <Leper key={`b${bx}`} x={bx + 6} y={146} s={0.5} flip={fl} pose="walk" />
      ))}
      {front.map(([fx, fl]) => (
        <Leper key={`f${fx}`} x={fx + 6} y={166} s={0.6} flip={fl} pose="walk" />
      ))}
      <Jesus x={44} y={166} s={1.15} pose="point" />
    </Frame>
  );
}

/* ---------- 3. as they went, they were healed ---------- */
function RoadScene({ k }: { k: Ink }) {
  void k;
  const p = useRun(300, 2600);
  const reach = 9 - 6 * p;
  const heal = (i: number) => clamp((i - reach) / 2 + 0.3);
  const walkers = Array.from({ length: 9 }, (_, i) => i);
  return (
    <Frame label="Ten men walk along a road toward a temple on a far hill. The ones at the front have healed, bright wraps and glow, the ones in the middle are changing, and the ones at the back are still gray. One of the healed men at the front has turned back to look behind him">
      <Rect x={10} y={10} width={280} height={162} rx={12} fill="#BFDCE6" />
      <Circle cx={60} cy={44} r={22} fill="#FFFFFF" opacity={0.5} />
      <Ellipse cx={110} cy={36} rx={30} ry={8} fill="#FFFFFF" opacity={0.7} />
      <Ellipse cx={210} cy={54} rx={24} ry={7} fill="#FFFFFF" opacity={0.6} />
      <Path d="M10 112 Q80 88 150 104 Q220 82 290 96 L290 150 L10 160 Z" fill="#B9C98B" />
      <Path d="M180 108 Q240 76 290 84 L290 128 L180 128 Z" fill="#A9B878" />
      <Temple x={266} y={92} s={0.62} />
      <Path d="M10 160 L290 120 L290 150 L10 172 Z" fill="#9CB070" />
      <Path d="M10 140 L290 108 L290 136 L10 172 Z" fill="#EFD7A6" stroke={EDGE} strokeWidth={1.2} strokeLinejoin="round" />
      {walkers.map((i) => (
        <Leper key={i} x={34 + i * 24} y={156 - i * 2.6} s={0.8 - i * 0.02} rot={4} pose="walk" heal={heal(i)} />
      ))}
      <Leper x={256} y={132} s={0.6} flip pose="wave" heal={clamp((9 - reach) / 2 + 0.3)} />
    </Frame>
  );
}

/* ---------- 4. a heart of stone, a heart of flesh ---------- */
const HEART = 'M0 30 C-34 8 -38 -14 -26 -26 C-16 -34 -4 -28 0 -18 C4 -28 16 -34 26 -26 C38 -14 34 8 0 30 Z';
function HeartScene({ k }: { k: Ink }) {
  void k;
  const p = useRun(400, 2000);
  const e = 1 - (1 - p) * (1 - p);
  const dots = [0, 1, 2, 3, 4];
  return (
    <Frame label="A heart of gray cracked stone on the left, and on the right a warm red heart of flesh. Between them a gentle golden light and a small trail of sparks changing from gray to red">
      <Rect x={10} y={10} width={280} height={162} rx={12} fill="#3A2A4A" />
      <Circle cx={150} cy={98} r={46} fill={GOLD} opacity={0.12} />
      <Circle cx={150} cy={98} r={30} fill={GOLD} opacity={0.18} />
      <Circle cx={150} cy={98} r={16} fill={GOLD} opacity={0.35} />
      {/* the stone heart */}
      <G transform="translate(76 100) scale(1.3)">
        <Path d={HEART} fill="#8A8D93" stroke={BEAR_LINE} strokeWidth={1.6} strokeLinejoin="round" />
        <Path d="M-26 -26 C-16 -34 -4 -28 0 -18 L-4 -4 L-18 -14 Z" fill="#A5A8AE" />
        <Path d="M4 -4 L14 -16 L28 -8 C34 -2 30 8 20 16 Z" fill="#767980" />
        <Path d="M0 -18 L-3 -6 L4 4 L-2 14 L2 24" stroke={BEAR_LINE} strokeWidth={1.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M-16 6 L-9 2 M12 -10 L20 -14" stroke={BEAR_LINE} strokeWidth={1.3} strokeLinecap="round" />
        <Path d="M-23 -17 Q-19 -26 -12 -26" stroke="#CDD0D6" strokeWidth={2.4} fill="none" strokeLinecap="round" />
      </G>
      {/* the sparks between them, changing as they go */}
      {dots.map((i) => {
        const t = i / 4;
        const dx = 112 + i * 19;
        const dy = 98 - Math.sin(t * Math.PI) * 14;
        return (
          <Circle
            key={i}
            cx={dx}
            cy={dy}
            r={2 + t * 2.2}
            fill={mix('#9A9DA4', HEART_RED, t)}
            stroke={BEAR_LINE}
            strokeWidth={0.8}
            opacity={clamp(p * 5 - i + 0.3)}
          />
        );
      })}
      {/* the heart of flesh */}
      <G transform={`translate(224 100) scale(${1.3 * (0.8 + 0.2 * e)})`}>
        <Circle cx={0} cy={0} r={46} fill={GOLD} opacity={0.14} />
        <Circle cx={0} cy={0} r={36} fill={GOLD} opacity={0.18} />
        <Path d={HEART} fill={HEART_RED} stroke={BEAR_LINE} strokeWidth={1.6} strokeLinejoin="round" />
        <Path d="M-23 -15 Q-21 -24 -13 -25" stroke="#FFB0B8" strokeWidth={3} fill="none" strokeLinecap="round" />
        <Path d="M10 -10 Q16 -12 20 -6" stroke="#FFB0B8" strokeWidth={2} fill="none" strokeLinecap="round" opacity={0.7} />
      </G>
    </Frame>
  );
}

/* ---------- 5. washed hands, and a heart slowly warming ---------- */
function TwoScene({ k }: { k: Ink }) {
  void k;
  const p = useRun(300, 1800);
  const steps = [0, 1, 2, 3, 4];
  return (
    <Frame label="Two panels. On the left, open cupped hands catch pure water falling into them. On the right, a small heart glows a little warmer above five small steps that rise from left to right, one small bar at a time">
      <Rect x={14} y={14} width={132} height={154} rx={10} fill="#4F86A3" />
      <Rect x={154} y={14} width={132} height={154} rx={10} fill="#4A3558" />
      {/* fresh water over open hands */}
      <Path d="M80 26 Q76 56 80 100" stroke={BEAR_LINE} strokeWidth={9} fill="none" strokeLinecap="round" />
      <Path d="M80 26 Q76 56 80 100" stroke="#CFEFFA" strokeWidth={6} fill="none" strokeLinecap="round" />
      <G fill="#CFEFFA" stroke={BEAR_LINE} strokeWidth={1}>
        <Path d="M60 52 Q56 60 60 64 Q64 60 60 52 Z" />
        <Path d="M100 66 Q96 74 100 78 Q104 74 100 66 Z" />
        <Path d="M104 40 Q101 46 104 49 Q107 46 104 40 Z" />
      </G>
      <G transform="translate(80 128)">
        <Ellipse cx={0} cy={-4} rx={20} ry={6} fill="#CFEFFA" stroke={BEAR_LINE} strokeWidth={1.2} />
        <Path
          d="M-32 -2 Q-32 24 0 27 Q32 24 32 -2 Q32 -6 24 -6 Q24 10 0 13 Q-24 10 -24 -6 Q-32 -6 -32 -2 Z"
          fill={SKIN}
          stroke={BEAR_LINE}
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
        <Path d="M-30 -4 Q-28 -12 -24 -10 M30 -4 Q28 -12 24 -10" stroke={BEAR_LINE} strokeWidth={1.2} fill="none" strokeLinecap="round" />
        <G fill={GOLD} opacity={0.9}>
          <Path d="M-38 -18 l2 4 4 2 -4 2 -2 4 -2 -4 -4 -2 4 -2 Z" />
          <Path d="M38 -22 l1.6 3.2 3.2 1.6 -3.2 1.6 -1.6 3.2 -1.6 -3.2 -3.2 -1.6 3.2 -1.6 Z" />
        </G>
      </G>
      {/* a heart slowly warming, line upon line */}
      <Circle cx={220} cy={72} r={34} fill={GOLD} opacity={0.1 + 0.12 * p} />
      <Circle cx={220} cy={72} r={24} fill={GOLD} opacity={0.14 + 0.16 * p} />
      <G transform="translate(220 74) scale(0.56)">
        <Path d={HEART} fill={mix('#B8667A', HEART_RED, p)} stroke={BEAR_LINE} strokeWidth={2.6} strokeLinejoin="round" />
        <Path d="M-23 -15 Q-21 -24 -13 -25" stroke="#FFB0B8" strokeWidth={4} fill="none" strokeLinecap="round" />
      </G>
      {steps.map((i) => (
        <Rect
          key={i}
          x={166 + i * 22}
          y={156 - (i + 1) * 9}
          width={20}
          height={(i + 1) * 9}
          rx={3}
          fill={mix('#7A6890', GOLD, (i + 1) / 5)}
          stroke={BEAR_LINE}
          strokeWidth={1.3}
          opacity={clamp(p * 6 - i + 0.4)}
        />
      ))}
    </Frame>
  );
}

/* ---------- 7. renewed day by day, as a walk ---------- */
const roadY = (x: number) => 148 - (x - 16) * 0.035 + 5 * Math.sin((x - 16) / 38);
function DaysScene({ k }: { k: Ink }) {
  void k;
  const p = useRun(300, 4200);
  const days = [0, 1, 2, 3, 4];
  const px = 34 + 224 * p;
  const py = roadY(px);
  const t = p;
  const road = Array.from({ length: 36 }, (_, i) => `${i === 0 ? 'M' : 'L'}${16 + i * 7.7} ${roadY(16 + i * 7.7).toFixed(1)}`).join(' ');
  return (
    <Frame label="A person walks along a road from left to right under five small suns, one for each day. The sky warms a little with each stretch of road, and by the right end the person walks more upright and brighter">
      <Defs>
        <ClipPath id="g4days">
          <Rect x={10} y={10} width={280} height={162} rx={12} />
        </ClipPath>
      </Defs>
      <G clipPath="url(#g4days)">
        {Array.from({ length: 28 }, (_, i) => (
          <Rect key={`s${i}`} x={10 + i * 10} y={10} width={10.6} height={162} fill={mix('#3E3A78', '#F8B878', i / 27)} />
        ))}
        {Array.from({ length: 28 }, (_, i) => (
          <Rect key={`g${i}`} x={10 + i * 10} y={118} width={10.6} height={60} fill={mix('#2A2650', '#7A5A86', i / 27)} />
        ))}
        <Path d="M10 120 Q80 104 150 116 Q220 100 290 112 L290 126 L10 126 Z" fill="#000000" opacity={0.12} />
      </G>
      <Path d={road} stroke={BEAR_LINE} strokeWidth={13} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Path d={road} stroke="#EFD7A6" strokeWidth={9.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {days.map((i) => {
        const tt = i / 4;
        const cx = 42 + i * 54;
        const cy = 62 - i * 3;
        const r = 6 + i * 1.6;
        const on = clamp(p * 5.5 - i + 0.6);
        return (
          <G key={i} opacity={on}>
            <Circle cx={cx} cy={cy} r={r + 9} fill={GOLD} opacity={0.05 + tt * 0.14} />
            {Array.from({ length: 10 }, (_, n) => {
              const a = (n / 10) * Math.PI * 2;
              return (
                <Line
                  key={n}
                  x1={cx + Math.cos(a) * (r + 3)}
                  y1={cy + Math.sin(a) * (r + 3)}
                  x2={cx + Math.cos(a) * (r + 5 + tt * 4)}
                  y2={cy + Math.sin(a) * (r + 5 + tt * 4)}
                  stroke={mix('#B8B0E0', GOLD, tt)}
                  strokeWidth={1.8}
                  strokeLinecap="round"
                />
              );
            })}
            <Circle cx={cx} cy={cy} r={r} fill={mix('#B8B0E0', GOLD, tt)} stroke={BEAR_LINE} strokeWidth={1.3} />
          </G>
        );
      })}
      <Circle cx={px} cy={py - 28} r={34} fill={GOLD} opacity={t * 0.22} />
      <Ellipse cx={px} cy={py + 1} rx={12} ry={3} fill={BEAR_LINE} opacity={0.3} />
      <Folk x={px} y={py} s={0.95} fill={mix('#3E4A86', '#7FA0F0', t)} rot={12 * (1 - t)} down={20 * (1 - t)} />
    </Frame>
  );
}

/* ---------- 8. decide, and start walking ---------- */
function StartScene({ k }: { k: Ink }) {
  void k;
  const p = useRun(500, 1800);
  const e = 1 - (1 - p) * (1 - p);
  const py = 164 - 14 * e;
  return (
    <Frame label="At dawn, a person seen from behind has just taken the first step onto a long road that runs toward the rising sun. Two footprints are left behind them, and the road glows with light ahead">
      <Rect x={10} y={10} width={280} height={162} rx={12} fill="#F6B77A" />
      <Rect x={10} y={56} width={280} height={36} fill="#F9CD8E" />
      <Rect x={10} y={90} width={280} height={24} fill="#FBE0A8" />
      <Circle cx={150} cy={112} r={52} fill={GOLD} opacity={0.2} />
      <Circle cx={150} cy={112} r={38} fill={GOLD} opacity={0.3} />
      <G stroke={GOLD} strokeWidth={2.4} strokeLinecap="round" opacity={0.7}>
        <Path d="M150 52 L150 40 M110 64 L102 54 M190 64 L198 54 M84 92 L72 86 M216 92 L228 86" />
      </G>
      <Path d="M122 112 A28 28 0 0 1 178 112 Z" fill={GOLD} stroke={BEAR_LINE} strokeWidth={1.5} strokeLinejoin="round" />
      <Path d="M10 112 Q60 94 110 108 L190 108 Q240 92 290 108 L290 120 L10 120 Z" fill="#8E6AA8" />
      <Path d="M10 120 L290 120 L290 160 Q290 172 278 172 L22 172 Q10 172 10 160 Z" fill="#5E477E" />
      <Path d="M118 172 L144 112 L156 112 L182 172 Z" fill="#EFD7A6" stroke={BEAR_LINE} strokeWidth={1.4} strokeLinejoin="round" />
      <Path d="M150 166 L150 158 M150 148 L150 142 M150 134 L150 130 M150 124 L150 121" stroke={EDGE} strokeWidth={2} strokeLinecap="round" opacity={0.5} />
      {/* the footprints left behind */}
      <G fill={EDGE} opacity={0.6}>
        <Ellipse cx={143} cy={168} rx={3.2} ry={4.6} />
        <Ellipse cx={157} cy={165} rx={3.2} ry={4.6} />
      </G>
      <G transform={`translate(150 ${py}) scale(0.95)`}>
        <Ellipse cx={0} cy={1} rx={14} ry={3.4} fill={BEAR_LINE} opacity={0.3} />
        <Path d={BODY} fill={TRAV} stroke={BEAR_LINE} strokeWidth={1.6} strokeLinejoin="round" />
        <Path d="M-11 -21 L11 -21" stroke={BEAR_LINE} strokeWidth={2.4} strokeLinecap="round" opacity={0.5} />
        <Tube fill={TRAV} parts={[['M-9 -34 L-13 -18', 5]]} />
        <Tube fill={TRAV} parts={[['M9 -34 L13 -18', 5]]} />
        <Hand x={-13} y={-16} />
        <Hand x={13} y={-16} />
        <Circle cx={0} cy={-49} r={8.5} fill={SKIN} stroke={BEAR_LINE} strokeWidth={1.6} />
        <Path d="M-8.6 -49 Q-8.6 -60 0 -60 Q8.6 -60 8.6 -49 Q8 -42 0 -41.5 Q-8 -42 -8.6 -49 Z" fill={HAIR} />
      </G>
    </Frame>
  );
}

/* ---------- Franklin and his little book ---------- */
const FCOAT = '#7A4B33';
const FVEST = '#E8DCC0';
const FHAIR = '#8A6038';

/* young Benjamin Franklin, standing on (x, y): a simple brown coat, a light vest and neckcloth, long hair tied back with a ribbon. Faces right; flip turns him.
   part draws only the body (with head) or only the arms, so a desk can stand between them; pose is write (one arm to the book, a quill in the hand) or smile
   (a quill raised). look tips the head forward. */
function Franklin({
  x,
  y,
  s = 1,
  flip = false,
  part = 'all',
  pose = 'smile',
  look = 0,
}: {
  x: number;
  y: number;
  s?: number;
  flip?: boolean;
  part?: 'all' | 'body' | 'arms';
  pose?: 'write' | 'smile';
  look?: number;
}) {
  const sw = 1.5 / s;
  return (
    <G transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      {part !== 'arms' ? (
        <G>
          <Path d={BODY} fill={FCOAT} stroke={BEAR_LINE} strokeWidth={sw} strokeLinejoin="round" />
          <Path d="M-3.4 -40 L3.4 -40 L4.6 -2 L-4.6 -2 Z" fill={FVEST} />
          <Circle cx={0} cy={-26} r={1.1} fill={BEAR_LINE} />
          <Circle cx={0} cy={-17} r={1.1} fill={BEAR_LINE} />
          <Path d="M-5 -41 L5 -41 L0 -32 Z" fill="#F8F2E4" stroke={BEAR_LINE} strokeWidth={sw * 0.7} strokeLinejoin="round" />
          <G transform={`rotate(${look} 0 -42)`}>
            <Path d="M-8 -53 Q-17 -47 -12 -34" stroke={BEAR_LINE} strokeWidth={5.6} fill="none" strokeLinecap="round" />
            <Path d="M-8 -53 Q-17 -47 -12 -34" stroke={FHAIR} strokeWidth={3.4} fill="none" strokeLinecap="round" />
            <Rect x={-12} y={-39} width={5.4} height={2.4} rx={1} fill="#2A1E5C" transform="rotate(20 -9 -38)" />
            <Circle cx={0} cy={-50} r={8.5} fill={SKIN} stroke={BEAR_LINE} strokeWidth={sw} />
            <Path d="M-8.8 -50 Q-9 -61 0 -61 Q9 -60 9 -52 Q4 -57 -1 -56.5 Q-6 -56 -8.8 -50 Z" fill={FHAIR} />
            <Circle cx={4} cy={-49} r={1.4} fill={BEAR_LINE} />
            {pose === 'smile' ? (
              <Path d="M2.4 -45.6 Q6 -42 9 -46" stroke={BEAR_LINE} strokeWidth={1.2} fill="none" strokeLinecap="round" />
            ) : (
              <Path d="M3 -45 L7.4 -45" stroke={BEAR_LINE} strokeWidth={1.1} strokeLinecap="round" />
            )}
          </G>
        </G>
      ) : null}
      {part !== 'body' ? (
        pose === 'write' ? (
          <G>
            <Tube fill={FCOAT} parts={[['M-9 -34 L-12 -19', 5]]} />
            <Hand x={-12} y={-17} />
            <Tube fill={FCOAT} parts={[['M9 -34 L25 -20', 5]]} />
            <Path d="M37 -16 L22 -33" stroke={BEAR_LINE} strokeWidth={4} strokeLinecap="round" />
            <Path d="M37 -16 L22 -33" stroke={CREAM} strokeWidth={2} strokeLinecap="round" />
            <Hand x={26} y={-21} r={3.4} />
          </G>
        ) : (
          <G>
            <Tube fill={FCOAT} parts={[['M-9 -34 L-12 -18', 5]]} />
            <Hand x={-12} y={-16} />
            <Tube fill={FCOAT} parts={[['M9 -34 L19 -27', 5]]} />
            <Path d="M20 -28 L27 -48" stroke={BEAR_LINE} strokeWidth={4} strokeLinecap="round" />
            <Path d="M20 -28 L27 -48" stroke={CREAM} strokeWidth={2} strokeLinecap="round" />
            <Hand x={19} y={-26} r={3.4} />
          </G>
        )
      ) : null}
    </G>
  );
}

/* deterministic scatter, so the same page shows the same spots every time */
const rnd = (i: number, j: number) => {
  const v = Math.sin(i * 12.9898 + j * 78.233) * 43758.5453;
  return v - Math.floor(v);
};

/* a page of Franklin's little book: days across, virtues down, ruled in red ink. dens is the share of squares with a black spot; reveal (0 to 1) draws
   the spots row by row. The thin page is the thick page with most of its spots gone. */
function Page({ x, y, w, h, dens, reveal = 1 }: { x: number; y: number; w: number; h: number; dens: number; reveal?: number }) {
  const cols = 7;
  const rows = 9;
  const lw = w * 0.26;
  const hh = h * 0.1;
  const cw = (w - lw) / cols;
  const ch = (h - hh) / rows;
  const r = Math.min(cw, ch) * 0.3;
  const INK = '#2A1E1C';
  const RULE = '#C4452E';
  return (
    <G>
      <Rect x={x} y={y} width={w} height={h} rx={3} fill="#FFF1D2" stroke={BEAR_LINE} strokeWidth={1.6} />
      <G stroke={RULE} strokeWidth={1.1} opacity={0.75}>
        {Array.from({ length: rows + 1 }, (_, i) => (
          <Line key={`h${i}`} x1={x} y1={y + hh + i * ch} x2={x + w} y2={y + hh + i * ch} />
        ))}
        {Array.from({ length: cols + 1 }, (_, j) => (
          <Line key={`v${j}`} x1={x + lw + j * cw} y1={y} x2={x + lw + j * cw} y2={y + h} />
        ))}
      </G>
      {/* the virtues down the side, and the days along the top, as marks of ink */}
      {Array.from({ length: rows }, (_, i) => (
        <Rect
          key={`l${i}`}
          x={x + 4}
          y={y + hh + i * ch + ch / 2 - 1.2}
          width={lw * (0.4 + 0.45 * rnd(i, 99))}
          height={2.4}
          rx={1.2}
          fill={INK}
          opacity={0.55}
        />
      ))}
      {Array.from({ length: cols }, (_, j) => (
        <Circle key={`d${j}`} cx={x + lw + j * cw + cw / 2} cy={y + hh / 2} r={1.5} fill={INK} opacity={0.5} />
      ))}
      {Array.from({ length: rows }, (_, i) =>
        Array.from({ length: cols }, (_, j) =>
          rnd(i, j) < dens && i / rows < reveal * 1.05 ? (
            <Circle
              key={`s${i}-${j}`}
              cx={x + lw + j * cw + cw / 2 + (rnd(j, i) - 0.5) * 2.4}
              cy={y + hh + i * ch + ch / 2 + (rnd(i + 3, j) - 0.5) * 2}
              r={r * (0.85 + 0.3 * rnd(i, j + 7))}
              fill={INK}
            />
          ) : null,
        ),
      )}
    </G>
  );
}

/* ---------- 9. the little book ---------- */
function BookScene({ k }: { k: Ink }) {
  void k;
  const p = useRun(300, 1400);
  return (
    <Frame label="Young Benjamin Franklin, in a simple brown coat with his long hair tied back, sits at a wooden desk by candlelight and writes with a quill in a small ruled book">
      <Rect x={10} y={10} width={280} height={162} rx={12} fill="#4B3126" />
      <Circle cx={60} cy={110} r={74} fill={GOLD} opacity={0.08} />
      <Circle cx={60} cy={110} r={46} fill={GOLD} opacity={0.12} />
      <Franklin x={208} y={172} s={1.2} flip part="body" pose="write" look={8} />
      {/* the desk */}
      <Path d="M18 146 L282 146 L292 158 L8 158 Z" fill="#C99560" stroke={BEAR_LINE} strokeWidth={1.5} strokeLinejoin="round" />
      <Path d="M8 158 L292 158 L292 160 Q292 172 280 172 L20 172 Q8 172 8 160 Z" fill="#8A5A30" stroke={BEAR_LINE} strokeWidth={1.5} strokeLinejoin="round" />
      <Path d="M20 164 L280 164" stroke={BEAR_LINE} strokeWidth={1} opacity={0.3} />
      {/* the little book, open, ruled, with a few spots */}
      <Path d="M104 154 L110 142 L148 143 L148 155 Z" fill="#FFF1D2" stroke={BEAR_LINE} strokeWidth={1.3} strokeLinejoin="round" />
      <Path d="M148 143 L186 142 L194 154 L148 155 Z" fill="#FFF1D2" stroke={BEAR_LINE} strokeWidth={1.3} strokeLinejoin="round" />
      <G stroke={RED} strokeWidth={0.8} opacity={0.7}>
        <Path d="M108 148 L148 149 M106 151.5 L148 152 M154 148.5 L190 148 M154 152 L192 151.5" />
        <Path d="M120 143 L121 154 M133 143 L134 155 M163 143 L164 155 M176 142.5 L178 154" />
      </G>
      <G fill="#2A1E1C">
        <Circle cx={127} cy={148.6} r={1.5} />
        <Circle cx={140} cy={151.8} r={1.5} />
        <Circle cx={170} cy={148.4} r={1.5} opacity={clamp(p * 3)} />
      </G>
      <Franklin x={208} y={172} s={1.2} flip part="arms" pose="write" />
      {/* the candle, and its flame */}
      <Ellipse cx={56} cy={150} rx={12} ry={3.4} fill={GOLD_D} stroke={BEAR_LINE} strokeWidth={1.3} />
      <Rect x={50} y={120} width={12} height={30} rx={2} fill={CREAM} stroke={BEAR_LINE} strokeWidth={1.4} />
      <Path d="M50 126 Q53 132 55 126" fill="#FFE9B8" />
      <Path d="M56 112 Q50 120 53 124 Q56 126 59 124 Q62 120 56 112 Z" fill={GOLD} stroke={BEAR_LINE} strokeWidth={1.2} strokeLinejoin="round" />
      <Path d="M56 118 Q54 122 56 124 Q58 122 56 118 Z" fill="#FFF6D0" />
    </Frame>
  );
}

/* ---------- 10. the spots ---------- */
function SpotsScene({ k }: { k: Ink }) {
  void k;
  const p = useRun(300, 2200);
  return (
    <Frame label="A close view of a page in Franklin's little book: a grid of days across and virtues down, ruled in red, and many small black spots, one for each slip">
      <Rect x={10} y={10} width={280} height={162} rx={12} fill="#4B3126" />
      <Rect x={16} y={14} width={268} height={154} rx={6} fill="#6B4328" stroke={BEAR_LINE} strokeWidth={1.5} />
      <Page x={26} y={20} w={248} h={142} dens={0.66} reveal={p} />
    </Frame>
  );
}

/* ---------- 11. the spots thin ---------- */
function ThinScene({ k }: { k: Ink }) {
  void k;
  return (
    <Frame label="The same page of the little book on a later day: only a few small black spots are left. Beside it, young Franklin stands small and smiling, a quill raised in his hand">
      <Rect x={10} y={10} width={280} height={162} rx={12} fill="#4B3126" />
      <Rect x={14} y={16} width={200} height={150} rx={6} fill="#6B4328" stroke={BEAR_LINE} strokeWidth={1.5} />
      <Page x={22} y={22} w={184} h={138} dens={0.13} />
      <Circle cx={252} cy={110} r={34} fill={GOLD} opacity={0.14} />
      <Ellipse cx={252} cy={166} rx={20} ry={4} fill={BEAR_LINE} opacity={0.3} />
      <Franklin x={252} y={166} s={1.15} flip pose="smile" />
    </Frame>
  );
}

/* ---------- 12. the speckled axe ---------- */
function AxeScene({ k }: { k: Ink }) {
  void k;
  const a = useTurn(110, 30);
  const rad = (a * Math.PI) / 180;
  const hx = 142 + Math.cos(rad) * 24;
  const hy = 118 + Math.sin(rad) * 24;
  const speckle = [
    [-12, -10],
    [-9, 2],
    [-13, 9],
    [-6, -5],
    [-7, 11],
    [-10, -15],
    [-4, 4],
  ];
  return (
    <Frame label="In a workshop, a smith presses an axe against a big round grindstone while a tired customer turns the crank and sweats. The axe is half bright along its edge and half still speckled">
      <Rect x={10} y={10} width={280} height={162} rx={12} fill="#CFA77A" />
      <Path d="M10 140 L290 140 L290 160 Q290 172 278 172 L22 172 Q10 172 10 160 Z" fill="#8A6A48" />
      <Path d="M10 140 L290 140" stroke={BEAR_LINE} strokeWidth={1.2} opacity={0.4} />
      <Rect x={228} y={34} width={46} height={46} rx={3} fill="#BFE0EC" stroke={WOOD_D} strokeWidth={3} />
      <Path d="M251 34 L251 80 M228 57 L274 57" stroke={WOOD_D} strokeWidth={2.2} />
      {/* the frame of the grindstone */}
      <G stroke={BEAR_LINE} strokeWidth={1.4} strokeLinejoin="round">
        <Path d="M142 118 L118 170 L128 170 L142 134 L156 170 L166 170 Z" fill={WOOD} />
        <Rect x={106} y={166} width={72} height={5} rx={2} fill="#8A5A30" />
      </G>
      {/* the stone */}
      <Circle cx={142} cy={118} r={31} fill="#B8B0A2" stroke={BEAR_LINE} strokeWidth={1.8} />
      <Circle cx={142} cy={118} r={22} fill="none" stroke="#8F887C" strokeWidth={1.6} />
      <G transform={`rotate(${a} 142 118)`} stroke="#8F887C" strokeWidth={1.6} strokeLinecap="round">
        <Path d="M142 90 L142 100 M142 136 L142 146 M114 118 L124 118 M160 118 L170 118" />
        <Path d="M122 98 L128 104 M156 132 L162 138" />
      </G>
      <Circle cx={142} cy={118} r={5.4} fill={WOOD} stroke={BEAR_LINE} strokeWidth={1.4} />
      {/* the crank, and the hand that turns it */}
      <Path d={`M142 118 L${hx} ${hy}`} stroke={BEAR_LINE} strokeWidth={6} strokeLinecap="round" />
      <Path d={`M142 118 L${hx} ${hy}`} stroke={WOOD} strokeWidth={3.4} strokeLinecap="round" />
      <Circle cx={hx} cy={hy} r={3.6} fill={WOOD} stroke={BEAR_LINE} strokeWidth={1.3} />
      {/* the smith: gray-blue shirt, leather apron, a cap, both hands on the axe */}
      <G transform="translate(36 166) rotate(5) scale(1.15)">
        <Path d="M-14 0 L-10 -34 Q-10 -43 0 -43 Q10 -43 10 -34 L14 0 Z" fill="#5B6B82" stroke={BEAR_LINE} strokeWidth={1.3} strokeLinejoin="round" />
        <Path d="M-9 -34 L9 -34 L12 0 L-12 0 Z" fill="#7B4A2A" stroke={BEAR_LINE} strokeWidth={1.2} strokeLinejoin="round" />
        <Tube fill="#5B6B82" parts={[['M7 -34 L27 -24', 6.4]]} />
        <Tube fill="#5B6B82" parts={[['M2 -34 L20 -29', 5.6]]} />
        <Hand x={29} y={-23} r={3.8} />
        <Circle cx={0} cy={-50} r={8.6} fill={SKIN} stroke={BEAR_LINE} strokeWidth={1.3} />
        <Path d="M-8.8 -51 Q-9 -60 0 -60 Q9 -60 8.8 -51 Q4 -54 0 -53.5 Q-5 -54 -8.8 -51 Z" fill="#3A2A20" />
        <Path d="M-4 -44 Q2 -38 8 -44 Q4 -42 0 -42 Z" fill="#3A2A20" />
        <Circle cx={4} cy={-50} r={1.4} fill={BEAR_LINE} />
      </G>
      {/* the axe: a wooden handle, a head half bright at the edge and half speckled */}
      <Path d="M64 142 L100 126" stroke={BEAR_LINE} strokeWidth={6.4} strokeLinecap="round" />
      <Path d="M64 142 L100 126" stroke={WOOD} strokeWidth={3.8} strokeLinecap="round" />
      <G transform="translate(112 118) rotate(-8) scale(1.1)">
        <Path d="M0 -22 Q7 0 0 22 L-14 13 L-14 -13 Z" fill="#8E959F" stroke={BEAR_LINE} strokeWidth={1.5} strokeLinejoin="round" />
        {speckle.map(([sx, sy]) => (
          <Circle key={`${sx}${sy}`} cx={sx} cy={sy} r={1.5} fill="#3A3F48" />
        ))}
        <Path d="M-5 -17 L0 -22 Q7 0 0 22 L-5 17 Q1 0 -5 -17 Z" fill="#F4F8FC" />
        <Path d="M-3 -12 Q0 0 -3 12" stroke="#FFFFFF" strokeWidth={1.6} fill="none" strokeLinecap="round" />
        <Path d="M0 -22 Q7 0 0 22" stroke={BEAR_LINE} strokeWidth={1.5} fill="none" strokeLinecap="round" />
      </G>
      {/* sparks at the edge */}
      <G stroke={GOLD} strokeWidth={1.8} strokeLinecap="round">
        <Path d="M122 112 L129 106 M123 120 L131 120 M122 127 L128 133" />
      </G>
      {/* the customer: tired, head down, sweat flying */}
      <Folk x={196} y={166} s={1} fill="#4F8A5B" hair="#C9C4B8" flip rot={-4} down={-12} />
      <Path d={`M187 132 L${hx + 2} ${hy + 4}`} stroke={BEAR_LINE} strokeWidth={8} strokeLinecap="round" />
      <Path d={`M187 132 L${hx + 2} ${hy + 4}`} stroke="#4F8A5B" strokeWidth={5} strokeLinecap="round" />
      <Hand x={hx + 1} y={hy + 3} r={3.4} />
      <G fill="#CFEFFA" stroke={BEAR_LINE} strokeWidth={0.9}>
        <Path d="M214 100 Q211 106 214 109 Q217 106 214 100 Z" />
        <Path d="M222 110 Q220 115 222 117 Q224 115 222 110 Z" />
        <Path d="M208 94 Q206 99 208 101 Q210 99 208 94 Z" />
      </G>
    </Frame>
  );
}

export const SCENES_I4: Record<string, ComponentType<{ k: Ink }>> = {
  'g4-ten': TenScene,
  'g4-go': GoScene,
  'g4-road': RoadScene,
  'g4-heart': HeartScene,
  'g4-two': TwoScene,
  'g4-days': DaysScene,
  'g4-start': StartScene,
  'g4-book': BookScene,
  'g4-spots': SpotsScene,
  'g4-thin': ThinScene,
  'g4-axe': AxeScene,
};
