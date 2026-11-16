/* Scenes for lesson g3, "The way out comes early" (see story-kit.tsx and story-scenes-f-l31.tsx for the approach): Joseph in Potiphar's house, the long way
   round the rooms, the coat left in her hand, the road with no forwarding address, Paul's gate beside the pull, the young man at the corner in Proverbs, the
   early doors, and then the children of the waiting studies. Joseph always wears a plain cream tunic under a bright coat of many colors (the coat is left
   behind where the story says so); Potiphar's wife is always fully robed in deep red with a head covering; the young man and the person at the gate are one
   neutral traveler in blue, so the same pictures serve the plain telling. Every figure carries a dark outline so it reads on a dark card and a cream one. */
import { type ComponentType, type ReactNode, useEffect, useState } from 'react';
import { Easing } from 'react-native';
import { Circle, Ellipse, G, Line, Path, Polygon, Rect } from 'react-native-svg';

import { useAppear, useReducedMotion } from '@/lib/motion';

import { BEAR_LINE, Frame, type Ink } from './story-kit';

const SKIN = '#E7B98F';
const HAIR = '#3A2A20';
const TUNIC = '#F3E7C9';
const COAT = ['#E5405A', '#FFD25A', '#2FA39A', '#4A6FD0', '#8E5CC0'];
const ROBE = '#9B1F3F';
const ROBE_D = '#6E1430';
const GOLD = '#FFD25A';
const GOLD_D = '#C98F1A';
const CREAM = '#FFF5E1';
const WOOD = '#B07A45';
const WOOD_D = '#5E3A1A';
const EDGE = '#8A6A3A';
const SAND = '#EBD3A2';
const SAND_D = '#D2A86A';
const WALL = '#EAD0A0';
const STONE = '#F3E3BC';
const TEAL = '#2FA39A';
const BRICK = '#C4452E';
const TRAV = '#4F6FBF';
const PLUM = '#7A4FA0';
const MINT = '#8CC7B5';
const FLOOR_W = '#C98E5A';
const ORANGE = '#E5733A';
const SHIRT = '#2F9AA6';

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

/* vertical stripes of the coat of many colors between two heights, widening downward */
function Stripes({ top, bot, y0, y1 }: { top: number; bot: number; y0: number; y1: number }) {
  const n = COAT.length;
  return (
    <G>
      {COAT.map((c, i) => (
        <Polygon
          key={c}
          points={`${-top + (2 * top * i) / n},${y0} ${-top + (2 * top * (i + 1)) / n},${y0} ${-bot + (2 * bot * (i + 1)) / n},${y1} ${-bot + (2 * bot * i) / n},${y1}`}
          fill={c}
        />
      ))}
    </G>
  );
}

const BODY = 'M-13 0 L-9 -33 Q-9 -42 0 -42 Q9 -42 9 -33 L13 0 Z';

/* Joseph, standing on (x, y): a plain cream tunic, and over it the bright coat of many colors (coat={false} when he has left it behind). Faces right; flip
   turns him. pose: down, run (legs and arms flung) or hold (keys in one hand, a scroll in the other). Children are drawn on him, in his own space. */
function Joseph({
  x,
  y,
  s = 1,
  rot = 0,
  flip = false,
  coat = true,
  pose = 'down',
  children,
}: {
  x: number;
  y: number;
  s?: number;
  rot?: number;
  flip?: boolean;
  coat?: boolean;
  pose?: 'down' | 'run' | 'hold';
  children?: ReactNode;
}) {
  const sw = 1.5 / s;
  return (
    <G transform={`translate(${x} ${y}) rotate(${rot}) scale(${flip ? -s : s} ${s})`}>
      {pose === 'run' ? (
        <G>
          <Tube fill={SKIN} parts={[['M-4 -4 L-17 5', 4.5]]} />
          <Tube fill={SKIN} parts={[['M5 -4 L14 9', 4.5]]} />
        </G>
      ) : null}
      <Path d={BODY} fill={TUNIC} stroke={BEAR_LINE} strokeWidth={sw} strokeLinejoin="round" />
      {coat ? (
        <G>
          <Stripes top={6} bot={9} y0={-40} y1={-33} />
          <Stripes top={9} bot={12.4} y0={-33} y1={-5} />
          <Path d="M-12.5 -5 L12.5 -5" stroke={GOLD} strokeWidth={1.8} strokeLinecap="round" />
          <Path d={BODY} fill="none" stroke={BEAR_LINE} strokeWidth={sw} strokeLinejoin="round" />
        </G>
      ) : (
        <Path d="M-11 -21 L11 -21" stroke={EDGE} strokeWidth={2.4} strokeLinecap="round" opacity={0.6} />
      )}
      {pose === 'run' ? (
        <G>
          <Tube fill={TUNIC} parts={[['M-8 -34 L-20 -28', 5]]} />
          <Hand x={-21} y={-28} />
          <Tube fill={TUNIC} parts={[['M8 -34 L21 -41', 5]]} />
          <Hand x={22} y={-42} />
        </G>
      ) : pose === 'hold' ? (
        <G>
          <Tube fill={TUNIC} parts={[['M-9 -34 L-14 -22', 5]]} />
          <Hand x={-14} y={-21} />
          <Tube fill={TUNIC} parts={[['M9 -34 L17 -27', 5]]} />
          <Hand x={18} y={-26} />
        </G>
      ) : (
        <G>
          <Tube fill={TUNIC} parts={[['M-9 -34 L-12 -17', 5]]} />
          <Tube fill={TUNIC} parts={[['M9 -34 L12 -17', 5]]} />
          <Hand x={-12} y={-15} />
          <Hand x={12} y={-15} />
        </G>
      )}
      {children}
      <Circle cx={0} cy={-49} r={8.5} fill={SKIN} stroke={BEAR_LINE} strokeWidth={sw} />
      <Path d="M-8.6 -50 Q-8.4 -59 0 -59 Q8.6 -58.6 8.6 -50 Q4 -54 0 -53.5 Q-5 -54 -8.6 -50 Z" fill={HAIR} />
      <Circle cx={4} cy={-48} r={1.5} fill={BEAR_LINE} />
    </G>
  );
}

/* Potiphar's wife, standing on (x, y): fully robed in deep red to the ground, long sleeves, and a head covering that falls to her shoulders. Faces right. */
function Wife({ x, y, s = 1, flip = false, pose = 'stand' }: { x: number; y: number; s?: number; flip?: boolean; pose?: 'stand' | 'reach' }) {
  const sw = 1.5 / s;
  return (
    <G transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      <Path d="M-16 0 L-11 -33 Q-11 -42 0 -42 Q11 -42 11 -33 L16 0 Z" fill={ROBE} stroke={BEAR_LINE} strokeWidth={sw} strokeLinejoin="round" />
      <Path d="M-14.4 -4 L14.4 -4" stroke={GOLD} strokeWidth={2} strokeLinecap="round" />
      <Path d="M-11.5 -22 L11.5 -22" stroke={ROBE_D} strokeWidth={3.4} strokeLinecap="round" />
      {pose === 'reach' ? (
        <G>
          <Tube fill={ROBE} parts={[['M8 -34 L28 -38', 5.5]]} />
          <Hand x={30} y={-38.5} r={3.4} />
          <Tube fill={ROBE} parts={[['M-8 -34 L-12 -20', 5.5]]} />
        </G>
      ) : (
        <G>
          <Tube fill={ROBE} parts={[['M-9 -34 L-5 -21', 5.5]]} />
          <Tube fill={ROBE} parts={[['M9 -34 L5 -21', 5.5]]} />
          <Hand x={-3} y={-19} r={3.2} />
          <Hand x={3} y={-19} r={3.2} />
        </G>
      )}
      <Path
        d="M-10 -50 Q-10 -62 0 -62 Q10 -62 10 -50 Q10 -44 12.5 -35 Q0 -30 -12.5 -35 Q-10 -44 -10 -50 Z"
        fill={ROBE_D}
        stroke={BEAR_LINE}
        strokeWidth={sw}
        strokeLinejoin="round"
      />
      <Ellipse cx={3.4} cy={-49} rx={5} ry={6.4} fill={SKIN} stroke={BEAR_LINE} strokeWidth={sw * 0.8} />
      <Circle cx={5.4} cy={-49.5} r={1.3} fill={BEAR_LINE} />
      <Path d="M-9.4 -56 Q0 -63 9.4 -56" stroke={GOLD} strokeWidth={1.8} fill="none" strokeLinecap="round" />
    </G>
  );
}

/* a servant of the house, standing on (x, y), in a plain colored tunic and a linen head cloth; jar carries a water jar on the shoulder */
function Servant({ x, y, s = 1, fill, jar = false, flip = false }: { x: number; y: number; s?: number; fill: string; jar?: boolean; flip?: boolean }) {
  const sw = 1.5 / s;
  return (
    <G transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      <Path d="M-12 0 L-9 -33 Q-9 -41 0 -41 Q9 -41 9 -33 L12 0 Z" fill={fill} stroke={BEAR_LINE} strokeWidth={sw} strokeLinejoin="round" />
      <Path d="M-10.5 -20 L10.5 -20" stroke={BEAR_LINE} strokeWidth={2.2} strokeLinecap="round" opacity={0.5} />
      <Tube fill={fill} parts={[['M-8 -33 L-11 -17', 4.5]]} />
      <Hand x={-11} y={-15} r={3.1} />
      {jar ? (
        <G>
          <Tube fill={fill} parts={[['M8 -33 L14 -42', 4.5]]} />
          <Path d="M7 -62 Q3 -52 6 -44 Q13 -40 20 -44 Q22 -52 18 -62 Z" fill={SAND_D} stroke={BEAR_LINE} strokeWidth={1.3} strokeLinejoin="round" />
          <Rect x={6} y={-65} width={13} height={4} rx={1.5} fill={WOOD} stroke={BEAR_LINE} strokeWidth={1.2} />
          <Path d="M8 -52 L18 -52" stroke={BRICK} strokeWidth={2} strokeLinecap="round" />
        </G>
      ) : (
        <G>
          <Tube fill={fill} parts={[['M8 -33 L11 -17', 4.5]]} />
          <Hand x={11} y={-15} r={3.1} />
        </G>
      )}
      <Circle cx={0} cy={-48} r={8} fill={SKIN} stroke={BEAR_LINE} strokeWidth={sw} />
      <Path d="M-8.4 -49 Q-8.4 -58 0 -58 Q8.4 -58 8.4 -49 Q4 -53 0 -52.6 Q-4 -53 -8.4 -49 Z" fill="#EEE6D2" stroke={BEAR_LINE} strokeWidth={sw * 0.7} />
      <Circle cx={3.6} cy={-47.5} r={1.3} fill={BEAR_LINE} />
    </G>
  );
}

/* the neutral young traveler (the person at the gate, the young man at the corner, the one who takes the early door): a blue tunic, dark hair. Faces right;
   back turns him away from us. */
function Traveler({ x, y, s = 1, rot = 0, flip = false, back = false }: { x: number; y: number; s?: number; rot?: number; flip?: boolean; back?: boolean }) {
  const sw = 1.5 / s;
  return (
    <G transform={`translate(${x} ${y}) rotate(${rot}) scale(${flip ? -s : s} ${s})`}>
      <Path d={BODY} fill={TRAV} stroke={BEAR_LINE} strokeWidth={sw} strokeLinejoin="round" />
      <Path d="M-11 -21 L11 -21" stroke={BEAR_LINE} strokeWidth={2.4} strokeLinecap="round" opacity={0.5} />
      <Tube fill={TRAV} parts={[['M-9 -34 L-12 -17', 5]]} />
      <Tube fill={TRAV} parts={[['M9 -34 L12 -17', 5]]} />
      <Hand x={-12} y={-15} />
      <Hand x={12} y={-15} />
      <Circle cx={0} cy={-49} r={8.5} fill={SKIN} stroke={BEAR_LINE} strokeWidth={sw} />
      {back ? (
        <Path d="M-8.6 -49 Q-8.6 -60 0 -60 Q8.6 -60 8.6 -49 Q8 -42 0 -41.5 Q-8 -42 -8.6 -49 Z" fill={HAIR} />
      ) : (
        <G>
          <Path d="M-8.6 -50 Q-8.4 -59 0 -59 Q8.6 -58.6 8.6 -50 Q4 -54 0 -53.5 Q-5 -54 -8.6 -50 Z" fill={HAIR} />
          <Circle cx={4} cy={-48} r={1.5} fill={BEAR_LINE} />
        </G>
      )}
    </G>
  );
}

/* an Egyptian column standing on (x, y), h tall: a fluted shaft, a flared top and bands of teal and brick */
function Column({ x, y, h, w = 15 }: { x: number; y: number; h: number; w?: number }) {
  return (
    <G stroke={EDGE} strokeWidth={1.3} strokeLinejoin="round">
      <Rect x={x - w / 2} y={y - h} width={w} height={h} fill={STONE} />
      <Path d={`M${x - w / 6} ${y - h} L${x - w / 6} ${y} M${x + w / 6} ${y - h} L${x + w / 6} ${y}`} opacity={0.45} />
      <Rect x={x - w / 2} y={y - h + 6} width={w} height={3.5} fill={TEAL} stroke="none" />
      <Rect x={x - w / 2} y={y - h + 10} width={w} height={2.5} fill={BRICK} stroke="none" />
      <Path d={`M${x - w * 0.8} ${y - h} L${x + w * 0.8} ${y - h} L${x + w * 0.58} ${y - h - 9} L${x - w * 0.58} ${y - h - 9} Z`} fill={STONE} />
      <Rect x={x - w * 0.7} y={y - 4} width={w * 1.4} height={4} rx={1} fill={STONE} />
    </G>
  );
}

/* ---------- 1. Joseph, trusted with everything ---------- */
function HouseScene({ k }: { k: Ink }) {
  void k;
  return (
    <Frame label="Inside Potiphar's grand Egyptian house, with sand-colored columns. Joseph, in a cream tunic and a bright many-colored coat, holds a ring of keys and a scroll while servants go about their work. Potiphar's wife, fully robed in deep red with a head covering, watches from a doorway">
      <Rect x={10} y={10} width={280} height={162} rx={12} fill={WALL} />
      <Path d="M10 128 L290 128 L290 160 Q290 172 278 172 L22 172 Q10 172 10 160 Z" fill={SAND_D} />
      <Rect x={10} y={22} width={280} height={9} fill={TEAL} />
      {Array.from({ length: 14 }, (_, i) => (
        <Polygon key={i} points={`${22 + i * 20},26.5 ${26 + i * 20},23 ${30 + i * 20},26.5 ${26 + i * 20},30`} fill={BRICK} />
      ))}
      <Path d="M10 128 L290 128 M30 140 L270 140 M16 154 L284 154" stroke={EDGE} strokeWidth={1.2} opacity={0.35} />
      <Column x={30} y={128} h={84} />
      <Column x={104} y={128} h={84} />
      <Column x={186} y={128} h={84} />
      {/* the doorway, and her in it */}
      <Rect x={212} y={56} width={56} height={72} fill={STONE} stroke={EDGE} strokeWidth={1.3} />
      <Path d="M218 128 L218 68 Q218 62 224 62 L256 62 Q262 62 262 68 L262 128 Z" fill="#3A2418" />
      <Rect x={208} y={50} width={64} height={8} rx={2} fill={STONE} stroke={EDGE} strokeWidth={1.3} />
      <Wife x={240} y={128} s={0.98} flip />
      <Servant x={62} y={152} s={0.82} fill="#5C7C8A" jar />
      <Servant x={196} y={146} s={0.7} fill="#7A8A4A" flip />
      <Joseph x={140} y={158} s={1.2} pose="hold">
        {/* the ring of keys */}
        <Circle cx={-14} cy={-12} r={4.4} fill="none" stroke={GOLD_D} strokeWidth={2} />
        <Path d="M-17 -8 L-18 0 M-14 -7.6 L-14 2 M-11 -8 L-10 0" stroke={GOLD_D} strokeWidth={2} strokeLinecap="round" />
        {/* the scroll */}
        <G transform="translate(18 -27) rotate(18)">
          <Rect x={-3} y={-10} width={6} height={20} rx={2.5} fill={CREAM} stroke={BEAR_LINE} strokeWidth={1.1} />
          <Rect x={-4} y={-11} width={8} height={3} rx={1.5} fill={WOOD} stroke={BEAR_LINE} strokeWidth={0.9} />
          <Rect x={-4} y={8} width={8} height={3} rx={1.5} fill={WOOD} stroke={BEAR_LINE} strokeWidth={0.9} />
        </G>
      </Joseph>
    </Frame>
  );
}

/* ---------- 2. the long way round ---------- */
/* a doorway in the back wall, its base on y: a dark opening under a stone lintel; lit shows the warm room beyond */
function Doorway({ x, y, w = 36, h = 66, lit = false }: { x: number; y: number; w?: number; h?: number; lit?: boolean }) {
  return (
    <G stroke={EDGE} strokeWidth={1.3} strokeLinejoin="round">
      <Rect x={x - w / 2 - 5} y={y - h - 5} width={w + 10} height={h + 5} fill={STONE} />
      <Rect x={x - w / 2} y={y - h} width={w} height={h} fill={lit ? '#E8B65A' : '#3A2418'} />
      <Rect x={x - w / 2 - 8} y={y - h - 11} width={w + 16} height={7} rx={2} fill={STONE} />
    </G>
  );
}
function Rooms({ k }: { k: Ink }) {
  void k;
  const p = useRun(400, 2200);
  const e = 1 - (1 - p) * (1 - p);
  /* he walks the lit path toward his own doorway on the left, away from hers */
  const jx = 168 - 52 * e;
  const jy = 128 + (jx - 52) * 0.312;
  return (
    <Frame label="A long Egyptian hall with several doorways. Potiphar's wife, fully robed in deep red, stands in a doorway at the far right. Joseph, in his many-colored coat and carrying keys and a scroll, walks a lit path that bends away from her, toward a doorway at the left, keeping a long distance between them">
      <Rect x={10} y={10} width={280} height={162} rx={12} fill={WALL} />
      <Path d="M10 128 L290 128 L290 160 Q290 172 278 172 L22 172 Q10 172 10 160 Z" fill={SAND_D} />
      <Rect x={10} y={22} width={280} height={9} fill={TEAL} />
      {Array.from({ length: 14 }, (_, i) => (
        <Polygon key={i} points={`${22 + i * 20},26.5 ${26 + i * 20},23 ${30 + i * 20},26.5 ${26 + i * 20},30`} fill={BRICK} />
      ))}
      <Path d="M10 128 L290 128 M16 142 L284 142" stroke={EDGE} strokeWidth={1.2} opacity={0.35} />
      <Doorway x={50} y={128} lit />
      <Doorway x={116} y={128} />
      <Doorway x={182} y={128} />
      <Doorway x={256} y={128} w={40} />
      <Column x={84} y={128} h={96} />
      <Column x={149} y={128} h={96} />
      <Column x={219} y={128} h={96} />
      {/* his doorway: a table and a jar in the warm light */}
      <Rect x={38} y={112} width={24} height={5} fill={WOOD} stroke={BEAR_LINE} strokeWidth={1} />
      <Ellipse cx={58} cy={107} rx={4} ry={5} fill={SAND_D} stroke={BEAR_LINE} strokeWidth={1} />
      {/* the short way, which he leaves alone */}
      <Path d="M150 150 L226 134" stroke={BEAR_LINE} strokeWidth={2} strokeDasharray="5 6" strokeLinecap="round" opacity={0.3} />
      {/* the lit path: it bends from the front, away from her door, to his */}
      <Path d="M36 128 L66 128 Q124 138 244 172 L148 172 Q92 150 36 128 Z" fill="#FFF1B8" opacity={0.9} />
      <G fill={GOLD_D} opacity={0.7}>
        <Circle cx={72} cy={134} r={1.8} />
        <Circle cx={110} cy={146} r={1.8} />
        <Circle cx={160} cy={162} r={1.8} />
      </G>
      <Wife x={256} y={128} s={1.05} flip />
      <Joseph x={jx} y={jy + 2} s={1.15} flip pose="hold">
        <Circle cx={-14} cy={-12} r={4.4} fill="none" stroke={GOLD_D} strokeWidth={2} />
        <Path d="M-17 -8 L-18 0 M-14 -7.6 L-14 2 M-11 -8 L-10 0" stroke={GOLD_D} strokeWidth={2} strokeLinecap="round" />
        <G transform="translate(18 -27) rotate(18)">
          <Rect x={-3} y={-10} width={6} height={20} rx={2.5} fill={CREAM} stroke={BEAR_LINE} strokeWidth={1.1} />
          <Rect x={-4} y={-11} width={8} height={3} rx={1.5} fill={WOOD} stroke={BEAR_LINE} strokeWidth={0.9} />
          <Rect x={-4} y={8} width={8} height={3} rx={1.5} fill={WOOD} stroke={BEAR_LINE} strokeWidth={0.9} />
        </G>
      </Joseph>
    </Frame>
  );
}

/* ---------- 3. the coat left in her hand ---------- */
/* a coat held up by the collar, hanging a little crooked: the coat of many colors */
function CoatHang({ x, y, rot = 0 }: { x: number; y: number; rot?: number }) {
  const shape = 'M-4 0 L4 0 L15 6 L15 40 L-15 40 L-15 6 Z';
  return (
    <G transform={`translate(${x} ${y}) rotate(${rot})`}>
      <Path d={shape} fill={COAT[0]} />
      <Stripes top={15} bot={15} y0={6} y1={40} />
      <Path d="M-15 36 L15 36" stroke={GOLD} strokeWidth={2} />
      <Path d={shape} fill="none" stroke={BEAR_LINE} strokeWidth={1.5} strokeLinejoin="round" />
      <Path d="M-4 0 L0 7 L4 0" stroke={BEAR_LINE} strokeWidth={1.2} fill="none" strokeLinejoin="round" />
    </G>
  );
}
function CoatScene({ k }: { k: Ink }) {
  void k;
  const p = useRun(300, 1500);
  const e = 1 - (1 - p) * (1 - p);
  const jx = 176 + 34 * e;
  return (
    <Frame label="Joseph, in his plain cream tunic, runs out through a doorway of the house. Behind him, inside, Potiphar's wife in deep red holds his bright many-colored coat in her raised hand">
      <Rect x={10} y={10} width={280} height={162} rx={12} fill="#F7D9A2" />
      <Circle cx={252} cy={44} r={22} fill={GOLD} opacity={0.35} />
      <Circle cx={252} cy={44} r={13} fill={GOLD} />
      <Path d="M10 148 L290 148 L290 160 Q290 172 278 172 L22 172 Q10 172 10 160 Z" fill={SAND_D} />
      {/* the room inside, seen through the open front */}
      <Path d="M22 10 L126 10 L126 148 L10 148 L10 22 Q10 10 22 10 Z" fill="#4A2F22" />
      <Rect x={10} y={140} width={116} height={8} fill="#6B4730" />
      <Rect x={28} y={36} width={26} height={44} rx={13} fill="#6B4730" />
      <Column x={134} y={148} h={110} w={17} />
      <Rect x={116} y={34} width={36} height={8} rx={2} fill={STONE} stroke={EDGE} strokeWidth={1.3} />
      <Wife x={64} y={146} s={1.2} pose="reach" />
      <CoatHang x={100} y={96} rot={-9} />
      {/* dust behind him */}
      <G fill="#E8D3A8" opacity={0.85 * Math.min(1, p * 3)}>
        <Ellipse cx={jx - 26} cy={144} rx={12} ry={6} />
        <Ellipse cx={jx - 38} cy={141} rx={9} ry={5} />
        <Ellipse cx={jx - 50} cy={145} rx={7} ry={4} />
      </G>
      <Path d={`M${jx - 28} 122 l-14 0 M${jx - 26} 112 l-18 0 M${jx - 28} 102 l-12 0`} stroke={EDGE} strokeWidth={2} strokeLinecap="round" opacity={0.6} />
      <Joseph x={jx} y={150} s={1.25} rot={9} pose="run" coat={false} />
    </Frame>
  );
}

/* ---------- 4. no forwarding address ---------- */
function Address({ k }: { k: Ink }) {
  void k;
  const p = useRun(300, 1700);
  const e = 1 - (1 - p) * (1 - p);
  const jx = 150 + 54 * e;
  return (
    <Frame label="Joseph runs away down a dusty road, past a signpost whose boards are completely blank, with no address on them, and leaves a cloud of dust behind him">
      <Rect x={10} y={10} width={280} height={162} rx={12} fill="#F7D9A2" />
      <Circle cx={236} cy={46} r={26} fill={GOLD} opacity={0.35} />
      <Circle cx={236} cy={46} r={15} fill={GOLD} />
      <Path d="M10 112 Q70 88 130 108 Q200 84 290 106 L290 160 Q290 172 278 172 L22 172 Q10 172 10 160 Z" fill="#DDB07A" />
      <Path d="M10 124 L290 124 L290 160 Q290 172 278 172 L22 172 Q10 172 10 160 Z" fill={SAND_D} />
      <Path d="M10 150 Q120 134 290 142 L290 160 Q290 172 278 172 L22 172 Q10 172 10 160 Z" fill="#EFD7A6" />
      {/* the signpost, and nothing written on it */}
      <Rect x={50} y={64} width={7} height={88} rx={2} fill={WOOD} stroke={BEAR_LINE} strokeWidth={1.4} />
      <Path d="M57 70 L96 70 L108 78 L96 86 L57 86 Z" fill={CREAM} stroke={BEAR_LINE} strokeWidth={1.5} strokeLinejoin="round" />
      <Path
        d="M50 92 L16 92 L8 100 L16 108 L50 108 Z"
        fill={CREAM}
        stroke={BEAR_LINE}
        strokeWidth={1.5}
        strokeLinejoin="round"
        transform="translate(8 0) rotate(-4 30 100)"
      />
      <Ellipse cx={54} cy={153} rx={13} ry={3.4} fill={EDGE} opacity={0.35} />
      {/* the dust */}
      <G fill="#C99D62" opacity={0.7 * Math.min(1, p * 3)}>
        <Ellipse cx={jx - 34} cy={146} rx={16} ry={7} />
        <Ellipse cx={jx - 52} cy={145} rx={13} ry={7} />
        <Ellipse cx={jx - 70} cy={149} rx={10} ry={5.5} />
        <Ellipse cx={jx - 84} cy={144} rx={7} ry={4} />
      </G>
      <Joseph x={jx} y={150} s={1.3} rot={8} pose="run" coat={false} />
    </Frame>
  );
}

/* ---------- 5. the gate, made with the pull ---------- */
function spiral(cx: number, cy: number, r0: number, r1: number, turns: number, flat = 0.9) {
  const n = 70;
  let d = '';
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const a = t * turns * Math.PI * 2;
    const r = r0 + (r1 - r0) * t;
    d += `${i === 0 ? 'M' : 'L'}${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a) * flat).toFixed(1)} `;
  }
  return d;
}
function Gate({ k }: { k: Ink }) {
  void k;
  return (
    <Frame label="A narrow path at dusk. On one side a dark swirl pulls hard at a person standing at the start of the path. Right beside the person, from the very beginning, stands a lit, open gate glowing with warm light">
      <Rect x={10} y={10} width={280} height={162} rx={12} fill="#2F2A5E" />
      <Path d="M10 112 L290 112 L290 160 Q290 172 278 172 L22 172 Q10 172 10 160 Z" fill="#4B4278" />
      <Path d="M92 172 L136 74 L150 74 L206 172 Z" fill="#D9C79A" />
      <Path d="M124 172 L140 100" stroke={EDGE} strokeWidth={1.5} opacity={0.3} strokeLinecap="round" />
      {/* the pull: a dark swirl on the left, with streams reaching for the person */}
      <Circle cx={66} cy={74} r={38} fill="#1A1238" opacity={0.55} />
      <Circle cx={66} cy={74} r={29} fill="#120B2A" />
      <Path d={spiral(66, 74, 2, 27, 2.6)} stroke="#A07AD0" strokeWidth={2.6} fill="none" strokeLinecap="round" />
      <Path d={spiral(66, 74, 6, 31, 2.2)} stroke="#6A4FA0" strokeWidth={1.6} fill="none" strokeLinecap="round" opacity={0.8} />
      <G fill="none" stroke="#A07AD0" strokeWidth={2.2} strokeLinecap="round" strokeDasharray="1 6">
        <Path d="M92 90 Q112 110 132 128" />
        <Path d="M86 100 Q106 126 128 142" />
        <Path d="M96 80 Q124 92 134 116" />
      </G>
      {/* the way out: a lit gate beside the start, with its light falling across the ground */}
      <Path d="M186 150 L246 150 L214 172 L168 172 Z" fill={GOLD} opacity={0.3} />
      <Path d="M168 150 L168 112 Q168 94 190 94 L214 94 Q236 94 236 112 L236 150 Z" fill="#8F7BB8" />
      <G stroke={BEAR_LINE} strokeWidth={1.5} strokeLinejoin="round">
        <Path d="M174 150 L174 112 Q174 100 190 100 L214 100 Q230 100 230 112 L230 150 Z" fill={GOLD} />
        <Path d="M184 150 L184 114 Q184 107 195 107 L209 107 Q220 107 220 114 L220 150 Z" fill="#FFF1B8" stroke="none" />
        <Rect x={164} y={88} width={14} height={64} rx={3} fill="#B9A98A" />
        <Rect x={226} y={88} width={14} height={64} rx={3} fill="#B9A98A" />
        <Path d="M164 88 L178 88 L178 82 L164 82 Z M226 88 L240 88 L240 82 L226 82 Z" fill="#CFC1A4" />
        <Path d="M178 100 L160 108 L160 148 L178 150 Z" fill={WOOD} />
        <Path d="M226 100 L244 108 L244 148 L226 150 Z" fill={WOOD} />
      </G>
      <Traveler x={142} y={154} s={1.05} rot={-5} />
    </Frame>
  );
}

/* ---------- 6. the corner ---------- */
function Corner({ k }: { k: Ink }) {
  void k;
  const lamp = (x: number, y: number, r: number) => (
    <G key={`${x}-${y}`}>
      <Circle cx={x} cy={y} r={r} fill={GOLD} opacity={0.28} />
      <Circle cx={x} cy={y} r={r * 0.5} fill={GOLD} opacity={0.5} />
      <Circle cx={x} cy={y} r={3} fill="#FFF1B8" stroke={BEAR_LINE} strokeWidth={1} />
    </G>
  );
  return (
    <Frame label="A street at dusk seen from a raised window. A young man in blue stands at a fork at the corner. To the left a warm, lamp-lit street turns away. Straight ahead the other way leads to a single house door lit by a soft red lamp. He has not turned yet">
      {/* the dusk sky */}
      <Rect x={14} y={14} width={272} height={152} fill="#3F3A78" />
      <Rect x={14} y={36} width={272} height={16} fill="#6A4C94" />
      <Rect x={14} y={52} width={272} height={14} fill="#B5629A" />
      <Rect x={14} y={66} width={272} height={14} fill="#F2A66A" />
      <Rect x={14} y={80} width={272} height={86} fill="#4A3F7A" />
      {/* houses along the way: warm on the left, dark on the right */}
      <G stroke={BEAR_LINE} strokeWidth={1.2} strokeLinejoin="round">
        <Rect x={14} y={48} width={46} height={42} rx={3} fill="#5A4A88" />
        <Rect x={62} y={58} width={42} height={32} rx={3} fill="#5A4A88" />
        <Rect x={196} y={44} width={90} height={46} rx={3} fill="#2F2A5E" />
        <Rect x={16} y={116} width={70} height={50} rx={3} fill="#5A4A88" />
        <Rect x={214} y={102} width={72} height={64} rx={3} fill="#2F2A5E" />
      </G>
      <G fill={GOLD}>
        <Rect x={24} y={60} width={8} height={10} />
        <Rect x={42} y={60} width={8} height={10} />
        <Rect x={74} y={68} width={8} height={10} />
        <Rect x={26} y={128} width={9} height={12} />
        <Rect x={52} y={128} width={9} height={12} />
      </G>
      {/* the street he came by, then the two ways from the corner */}
      <Path d="M92 166 L208 166 L166 112 L138 112 Z" fill="#B8A8D8" />
      <Path d="M138 112 L162 112 L156 86 L144 86 Z" fill="#8E7FB8" />
      <Path d="M138 128 L138 110 L96 106 L14 100 L14 118 L96 124 Z" fill="#F2C97A" />
      <Path d="M138 118 L96 114 L14 109" stroke="#FFF1B8" strokeWidth={2} fill="none" strokeLinecap="round" opacity={0.7} />
      {lamp(112, 108, 18)}
      {lamp(68, 104, 18)}
      {lamp(28, 100, 16)}
      {/* the one house at the end of the straight way: its door, and a soft red lamp */}
      <Rect x={124} y={50} width={52} height={36} rx={3} fill="#4A4278" stroke={BEAR_LINE} strokeWidth={1.3} />
      <Path d="M122 52 L178 52 L172 44 L128 44 Z" fill="#2F2A5E" stroke={BEAR_LINE} strokeWidth={1.2} strokeLinejoin="round" />
      <Rect x={144} y={64} width={14} height={22} rx={2} fill={ROBE} stroke={BEAR_LINE} strokeWidth={1.2} />
      <Circle cx={168} cy={68} r={13} fill="#FF6A6A" opacity={0.3} />
      <Circle cx={168} cy={68} r={3.4} fill="#FFB0A0" stroke={BEAR_LINE} strokeWidth={1} />
      {/* him, at the corner, not yet turned */}
      <Ellipse cx={151} cy={134} rx={15} ry={4.5} fill={BEAR_LINE} opacity={0.4} />
      <Traveler x={151} y={134} s={0.85} back />
      {/* the father's window, and its sill, around it all */}
      <Path d="M8 8 L292 8 L292 172 L8 172 Z M16 16 L16 160 L284 160 L284 16 Z" fill={WOOD_D} fillRule="evenodd" />
      <Path d="M16 16 L28 16 Q22 52 26 92 Q30 130 16 160 Z" fill="#B8283F" opacity={0.85} />
      <Path d="M2 160 L298 160 L292 178 L8 178 Z" fill={WOOD} stroke={BEAR_LINE} strokeWidth={1.4} strokeLinejoin="round" />
    </Frame>
  );
}

/* ---------- 7. the early door ---------- */
function Door({ x, y, s = 1, mode }: { x: number; y: number; s?: number; mode: 'lit' | 'dim' | 'storm' }) {
  const arch = 'M-13 0 L-13 -28 Q-13 -41 0 -41 Q13 -41 13 -28 L13 0 Z';
  if (mode === 'storm') {
    return (
      <G transform={`translate(${x} ${y}) scale(${s})`} opacity={0.6}>
        <Path d={arch} fill="#1C1536" stroke="#6E639C" strokeWidth={1.6 / s} strokeLinejoin="round" />
      </G>
    );
  }
  const lit = mode === 'lit';
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      {lit ? <Circle cx={0} cy={-20} r={28} fill={GOLD} opacity={0.22} /> : null}
      <Path d={arch} fill={lit ? GOLD : '#C9964A'} stroke={BEAR_LINE} strokeWidth={1.6 / s} strokeLinejoin="round" />
      {lit ? <Path d="M-8 0 L-8 -27 Q-8 -35 0 -35 Q8 -35 8 -27 L8 0 Z" fill="#FFF1B8" /> : null}
      <Path d="M-13 -3 L-22 -7 L-22 -34 Q-22 -38 -13 -35 Z" fill={WOOD} stroke={BEAR_LINE} strokeWidth={1.4 / s} strokeLinejoin="round" />
    </G>
  );
}
function Early({ k }: { k: Ink }) {
  void k;
  return (
    <Frame label="A path climbs from a sunny left side toward a stormy mountain peak. Along it stand doors. The first ones are big, open and lit with warm light, and a person is stepping through the first. The last door, at the stormy peak, is small, dark and almost hidden">
      <Rect x={10} y={10} width={280} height={162} rx={12} fill="#F7D9A2" />
      <Path d="M196 10 L278 10 Q290 10 290 22 L290 160 Q290 172 278 172 L162 172 Q196 90 196 10 Z" fill="#3F3669" />
      <Circle cx={44} cy={40} r={22} fill={GOLD} opacity={0.35} />
      <Circle cx={44} cy={40} r={13} fill={GOLD} />
      {/* the mountain and its storm */}
      <Path d="M150 172 L222 70 L256 30 L290 80 L290 172 Z" fill="#5A4C85" />
      <Path d="M256 30 L238 52 L250 50 L258 60 L266 48 L276 54 Z" fill="#8F86B5" />
      <G fill="#2A2244">
        <Ellipse cx={240} cy={26} rx={36} ry={11} />
        <Ellipse cx={272} cy={34} rx={22} ry={9} />
        <Ellipse cx={218} cy={36} rx={22} ry={8} />
      </G>
      <Path d="M246 36 L238 52 L246 50 L240 66 L254 46 L246 48 L252 36 Z" fill={GOLD} stroke={BEAR_LINE} strokeWidth={1} strokeLinejoin="round" />
      <Path
        d="M214 56 l-5 12 M228 62 l-5 12 M270 54 l-5 12 M280 70 l-5 12 M206 82 l-5 12"
        stroke="#9A8FC8"
        strokeWidth={1.6}
        strokeLinecap="round"
        opacity={0.7}
      />
      {/* the ground and the path */}
      <Path d="M10 164 Q90 150 140 124 Q190 98 230 70 L290 80 L290 160 Q290 172 278 172 L22 172 Q10 172 10 160 Z" fill="#C9A266" opacity={0.7} />
      <Path
        d="M10 168 L50 162 Q82 156 112 142 Q142 128 172 114 Q212 96 250 60"
        stroke={BEAR_LINE}
        strokeWidth={12}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M10 168 L50 162 Q82 156 112 142 Q142 128 172 114 Q212 96 250 60"
        stroke="#EFD7A6"
        strokeWidth={9}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Door x={250} y={60} s={0.5} mode="storm" />
      <Door x={172} y={114} s={0.8} mode="dim" />
      <Door x={112} y={142} s={1} mode="lit" />
      <Door x={50} y={162} s={1.35} mode="lit" />
      <Traveler x={55} y={164} s={0.82} rot={4} />
    </Frame>
  );
}

/* ---------- 8 to 11. the waiting room ---------- */
function Room({ drawings = true }: { drawings?: boolean }) {
  return (
    <G>
      <Rect x={10} y={10} width={280} height={162} rx={12} fill={MINT} />
      <Path d="M10 106 L290 106 L290 160 Q290 172 278 172 L22 172 Q10 172 10 160 Z" fill={FLOOR_W} />
      <Rect x={10} y={102} width={280} height={5} fill="#6FA595" />
      <Path d="M10 122 L290 122 M10 140 L290 140 M10 158 L290 158" stroke="#A97040" strokeWidth={1.2} opacity={0.6} />
      {/* a window, with a curtain */}
      <Rect x={26} y={26} width={52} height={52} rx={3} fill="#BFE6F5" stroke={WOOD_D} strokeWidth={2.5} />
      <Path d="M52 26 L52 78 M26 52 L78 52" stroke={WOOD_D} strokeWidth={2} />
      <Circle cx={64} cy={38} r={6} fill={GOLD} />
      <Path d="M24 24 L40 24 Q34 50 38 80 L24 80 Z" fill={ORANGE} stroke={BEAR_LINE} strokeWidth={1.2} strokeLinejoin="round" />
      {drawings ? (
        <G stroke={BEAR_LINE} strokeWidth={1.2}>
          <Rect x={104} y={30} width={36} height={28} fill={CREAM} />
          <Circle cx={113} cy={39} r={5} fill={GOLD} />
          <Path d="M118 58 L128 44 L138 58 Z" fill="#E5405A" />
          <Rect x={150} y={32} width={30} height={34} fill={CREAM} />
          <Ellipse cx={165} cy={46} rx={9} ry={6} fill="#4A6FD0" />
          <Path d="M156 62 L174 62" stroke="#2FA39A" strokeWidth={3} />
        </G>
      ) : null}
    </G>
  );
}

/* a small wooden table whose top surface is at y, and its legs to the floor */
function Table({ x, y, w, leg = 34 }: { x: number; y: number; w: number; leg?: number }) {
  return (
    <G stroke={BEAR_LINE} strokeWidth={1.4} strokeLinejoin="round">
      <Rect x={x - w / 2 + 6} y={y + 6} width={5} height={leg} fill="#B9803F" />
      <Rect x={x + w / 2 - 11} y={y + 6} width={5} height={leg} fill="#B9803F" />
      <Rect x={x - w / 2} y={y} width={w} height={7} rx={2} fill="#E0AA66" />
    </G>
  );
}
/* a plate with a marshmallow, standing on the tabletop at y */
function Treat({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Ellipse cx={0} cy={-1} rx={12} ry={3.4} fill="#F6F1E6" stroke={BEAR_LINE} strokeWidth={1.3} />
      <Rect x={-5.5} y={-11} width={11} height={9} rx={3.4} fill="#FFFFFF" stroke={BEAR_LINE} strokeWidth={1.3} />
      <Path d="M-3 -8.5 L-3 -5" stroke="#D5D9E8" strokeWidth={1.4} strokeLinecap="round" />
    </G>
  );
}
/* a small bell on the tabletop at y */
function Bell({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Path d="M-7 0 Q-7 -11 0 -11 Q7 -11 7 0 Z" fill={GOLD} stroke={BEAR_LINE} strokeWidth={1.3} strokeLinejoin="round" />
      <Circle cx={0} cy={-13} r={2} fill={GOLD_D} stroke={BEAR_LINE} strokeWidth={1} />
      <Circle cx={0} cy={1.2} r={1.6} fill={GOLD_D} />
    </G>
  );
}
/* a steel cover over a plate */
function Cover({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Ellipse cx={0} cy={-1} rx={14} ry={3.6} fill="#F6F1E6" stroke={BEAR_LINE} strokeWidth={1.3} />
      <Path d="M-14 -1 Q-14 -21 0 -21 Q14 -21 14 -1 Z" fill="#C9D0DC" stroke={BEAR_LINE} strokeWidth={1.4} strokeLinejoin="round" />
      <Circle cx={0} cy={-23} r={2.6} fill="#9AA3B5" stroke={BEAR_LINE} strokeWidth={1.1} />
      <Path d="M-9 -8 Q-8 -16 -2 -17" stroke="#FFFFFF" strokeWidth={2} fill="none" strokeLinecap="round" opacity={0.8} />
    </G>
  );
}

/* a child of the 1960s, sitting behind a table whose top is at y: a bowl haircut and a striped shirt, in a bright orange chair. mood is eager, calm or plain;
   gaze is where the eyes go (dx, dy); lean tips the head toward the table */
function Child({
  x,
  y,
  s = 1,
  mood = 'plain',
  gaze = [0, 1],
  lean = 0,
}: {
  x: number;
  y: number;
  s?: number;
  mood?: 'eager' | 'calm' | 'plain';
  gaze?: [number, number];
  lean?: number;
}) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Rect x={-16} y={-36} width={32} height={36} rx={5} fill={ORANGE} stroke={BEAR_LINE} strokeWidth={1.4} />
      <Path d="M-12 0 L-12 -16 Q-12 -27 0 -27 Q12 -27 12 -16 L12 0 Z" fill={SHIRT} stroke={BEAR_LINE} strokeWidth={1.4} strokeLinejoin="round" />
      <Path d="M-12 -19 L12 -19 M-12 -12 L12 -12 M-12 -5 L12 -5" stroke="#FFFFFF" strokeWidth={2.2} opacity={0.85} />
      <Tube fill={SHIRT} parts={[['M-10 -22 L-15 -3', 5]]} />
      <Tube fill={SHIRT} parts={[['M10 -22 L15 -3', 5]]} />
      <Hand x={-15 + lean * 0.5} y={-2} r={3.4} />
      <Hand x={15 - lean * 0.5} y={-2} r={3.4} />
      <G transform={`translate(0 ${lean})`}>
        <Circle cx={0} cy={-37} r={9.5} fill={SKIN} stroke={BEAR_LINE} strokeWidth={1.4} />
        <Path d="M-10 -38 Q-11 -50 0 -50 Q11 -50 10 -38 Q9 -43 0 -43 Q-9 -43 -10 -38 Z" fill="#5A3A22" stroke={BEAR_LINE} strokeWidth={0.8} />
        <Circle cx={-3.6 + gaze[0]} cy={-36.5 + gaze[1]} r={1.5} fill={BEAR_LINE} />
        <Circle cx={3.6 + gaze[0]} cy={-36.5 + gaze[1]} r={1.5} fill={BEAR_LINE} />
        {mood === 'calm' ? (
          <Path d="M-3.5 -31.5 Q0 -28.5 3.5 -31.5" stroke={BEAR_LINE} strokeWidth={1.3} fill="none" strokeLinecap="round" />
        ) : mood === 'eager' ? (
          <Circle cx={0} cy={-30.6} r={2} fill="#9B3B3B" stroke={BEAR_LINE} strokeWidth={0.9} />
        ) : (
          <Path d="M-2.5 -31 L2.5 -31" stroke={BEAR_LINE} strokeWidth={1.3} strokeLinecap="round" />
        )}
      </G>
    </G>
  );
}

/* the grown-up of the study, in a gray suit, a thin tie and glasses, walking away to the right, with his feet on (x, y) */
function Adult({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  const sw = 1.5 / s;
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Tube
        fill="#454B5E"
        parts={[
          ['M-3 -26 L-10 -2', 6],
          ['M3 -26 L9 -2', 6],
        ]}
      />
      <Ellipse cx={-11} cy={0} rx={5} ry={2.4} fill={BEAR_LINE} />
      <Ellipse cx={11} cy={0} rx={5} ry={2.4} fill={BEAR_LINE} />
      <Path d="M-11 -24 L-9 -58 Q-9 -64 0 -64 Q9 -64 9 -58 L11 -24 Z" fill="#6B7280" stroke={BEAR_LINE} strokeWidth={sw} strokeLinejoin="round" />
      <Path d="M-3 -62 L3 -62 L2 -46 L-2 -46 Z" fill="#F4F1E8" />
      <Path d="M0 -60 L1.8 -44 L0 -41 L-1.8 -44 Z" fill={BRICK} />
      <Tube fill="#6B7280" parts={[['M-9 -58 L-13 -36', 5]]} />
      <Hand x={-13} y={-34} r={3} />
      <Tube fill="#6B7280" parts={[['M9 -58 L16 -42', 5]]} />
      <Hand x={17} y={-40} r={3} />
      <Circle cx={0} cy={-73} r={8.5} fill={SKIN} stroke={BEAR_LINE} strokeWidth={sw} />
      <Path d="M-8.6 -74 Q-8.6 -83 0 -83 Q8.6 -83 8.6 -74 Q4 -78 -1 -78 Q-5 -78 -8.6 -74 Z" fill="#2A2A2E" />
      <Rect x={1.5} y={-75} width={6} height={4.6} rx={1.6} fill="none" stroke={BEAR_LINE} strokeWidth={1.1} />
    </G>
  );
}

function Treat1({ k }: { k: Ink }) {
  void k;
  const p = useRun(500, 1700);
  const ax = 206 + 14 * p;
  return (
    <Frame label="A preschool room of the 1960s. A child sits at a small table with a marshmallow on a plate and a small bell, while a man in a gray suit walks out through the door and leaves the child alone with the treat">
      <Room />
      <Rect x={226} y={44} width={48} height={108} fill="#FFF1B8" stroke={WOOD_D} strokeWidth={3} />
      <Path d="M226 44 L254 52 L254 150 L226 152 Z" fill="#D9A15C" stroke={BEAR_LINE} strokeWidth={1.5} strokeLinejoin="round" />
      <Rect x={246} y={98} width={4} height={8} rx={2} fill={GOLD_D} />
      <Child x={90} y={116} s={1.1} mood="eager" gaze={[0, 1.5]} />
      <Table x={90} y={116} w={108} />
      <Treat x={82} y={116} />
      <Bell x={118} y={116} />
      <Adult x={ax} y={152} s={0.9} />
    </Frame>
  );
}

/* the child turned around in the chair, facing away from the table, with both hands over the eyes */
function Chair({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <G stroke={BEAR_LINE} strokeWidth={1.4} strokeLinejoin="round">
        <Rect x={11} y={-36} width={6} height={40} rx={2} fill={ORANGE} />
        <Rect x={-16} y={0} width={33} height={5} rx={2} fill={ORANGE} />
        <Rect x={-13} y={5} width={4} height={26} fill="#B9803F" />
        <Rect x={12} y={5} width={4} height={26} fill="#B9803F" />
      </G>
      <Tube
        fill="#4B5F8E"
        parts={[
          ['M-4 -2 L-18 -2', 6],
          ['M-18 -2 L-18 17', 5.5],
        ]}
      />
      <Ellipse cx={-21} cy={20} rx={6} ry={2.8} fill={BEAR_LINE} />
      <Path d="M-8 0 L-9 -16 Q-9 -27 1 -27 Q10 -27 10 -16 L10 0 Z" fill={SHIRT} stroke={BEAR_LINE} strokeWidth={1.4} strokeLinejoin="round" />
      <Path d="M-9 -19 L10 -19 M-9 -12 L10 -12 M-9 -5 L10 -5" stroke="#FFFFFF" strokeWidth={2.2} opacity={0.85} />
      <Circle cx={0} cy={-37} r={9.5} fill={SKIN} stroke={BEAR_LINE} strokeWidth={1.4} />
      <Path d="M-9.5 -38 Q-9 -50 1 -50 Q10.5 -49 9.5 -36 Q8 -42 1 -42 Q-6 -42 -9.5 -38 Z" fill="#5A3A22" stroke={BEAR_LINE} strokeWidth={0.8} />
      <Tube fill={SHIRT} parts={[['M-2 -22 L-8 -34', 5]]} />
      <Hand x={-8.5} y={-36.5} r={4} />
      <Hand x={-5} y={-38.5} r={3.6} />
    </G>
  );
}
function Note({ x, y, s = 1, r = 0 }: { x: number; y: number; s?: number; r?: number }) {
  return (
    <G transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
      <Ellipse cx={0} cy={0} rx={4.2} ry={3.1} fill={PLUM} transform="rotate(-20)" />
      <Path d="M3.6 -1 L3.6 -15 Q9 -13 9 -8" stroke={PLUM} strokeWidth={1.8} fill="none" strokeLinecap="round" />
    </G>
  );
}
function ChairScene({ k }: { k: Ink }) {
  void k;
  const p = useRun(300, 900);
  const bob = Math.sin(p * Math.PI * 2) * 2;
  return (
    <Frame label="The same child has turned the chair around, facing away from the treat on the table behind, with both hands over their eyes, singing: music notes float up from the child">
      <Room drawings={false} />
      <Table x={226} y={112} w={100} leg={44} />
      <Treat x={226} y={112} />
      <Bell x={254} y={112} />
      <Chair x={108} y={124} s={1.15} />
      <Note x={150} y={66 + bob} s={1.3} r={8} />
      <Note x={126} y={40 - bob} s={1.5} r={-6} />
      <Note x={172} y={44 + bob} s={1.1} r={10} />
    </Frame>
  );
}

function Bar({ x, y, w, fill }: { x: number; y: number; w: number; fill: number }) {
  return (
    <G>
      <Rect x={x} y={y} width={w} height={9} rx={4.5} fill={BEAR_LINE} opacity={0.3} stroke={BEAR_LINE} strokeWidth={1.2} />
      <Rect x={x} y={y} width={fill} height={9} rx={4.5} fill={GOLD} stroke={BEAR_LINE} strokeWidth={1.3} />
    </G>
  );
}
function CoverScene({ k }: { k: Ink }) {
  void k;
  const p = useRun(500, 1400);
  return (
    <Frame label="Two small tables side by side. On the left a marshmallow sits in view, and the child leans toward it with eyes wide, with a very short bar underneath. On the right the same marshmallow is under a steel cover, and that child sits calm, with a much longer bar underneath">
      <Room drawings={false} />
      <Path d="M150 56 L150 150" stroke={BEAR_LINE} strokeWidth={2} strokeDasharray="2 6" strokeLinecap="round" opacity={0.3} />
      <Child x={78} y={108} s={1.05} mood="eager" gaze={[0, 1.6]} lean={3} />
      <Table x={78} y={108} w={96} leg={30} />
      <Treat x={78} y={108} />
      <Child x={222} y={108} s={1.05} mood="calm" gaze={[0, 0.5]} />
      <Table x={222} y={108} w={96} leg={30} />
      <Cover x={222} y={108} />
      <Bar x={30} y={152} w={96} fill={9.6} />
      <Bar x={174} y={152} w={96} fill={Math.max(9.6, 96 * p)} />
    </Frame>
  );
}

function CloudScene({ k }: { k: Ink }) {
  void k;
  const bubble: [number, number, number][] = [
    [176, 60, 22],
    [202, 46, 26],
    [234, 46, 24],
    [258, 62, 18],
    [226, 76, 22],
    [196, 78, 18],
  ];
  const puff: [number, number, number][] = [
    [200, 62, 11],
    [216, 54, 14],
    [234, 61, 11],
    [218, 68, 10],
  ];
  return (
    <Frame label="A child looks at a marshmallow on a plate, and in a thought cloud above imagines it as a puffy white cloud floating in a blue sky">
      <Room drawings={false} />
      <Child x={72} y={126} s={1.15} mood="calm" gaze={[1.4, 1.4]} />
      <Table x={96} y={126} w={140} leg={20} />
      <Treat x={134} y={126} s={1.1} />
      {/* the thought */}
      <Circle cx={112} cy={84} r={3.4} fill={CREAM} stroke={BEAR_LINE} strokeWidth={1.3} />
      <Circle cx={124} cy={76} r={5} fill={CREAM} stroke={BEAR_LINE} strokeWidth={1.3} />
      <Circle cx={140} cy={70} r={7} fill={CREAM} stroke={BEAR_LINE} strokeWidth={1.3} />
      {bubble.map(([cx, cy, r]) => (
        <Circle key={`o${cx}`} cx={cx} cy={cy} r={r} fill={BEAR_LINE} stroke={BEAR_LINE} strokeWidth={3} />
      ))}
      {bubble.map(([cx, cy, r]) => (
        <Circle key={`f${cx}`} cx={cx} cy={cy} r={r} fill={CREAM} />
      ))}
      <Ellipse cx={217} cy={60} rx={50} ry={28} fill="#8EC9EE" />
      <Circle cx={252} cy={42} r={5} fill={GOLD} />
      {puff.map(([cx, cy, r]) => (
        <Circle key={`po${cx}`} cx={cx} cy={cy} r={r} fill="#9AB0D0" stroke="#9AB0D0" strokeWidth={2.4} />
      ))}
      {puff.map(([cx, cy, r]) => (
        <Circle key={`pf${cx}`} cx={cx} cy={cy} r={r} fill="#FFFFFF" />
      ))}
      <Line x1={196} y1={74} x2={240} y2={74} stroke="#FFFFFF" strokeWidth={4} strokeLinecap="round" />
    </Frame>
  );
}

export const SCENES_I3: Record<string, ComponentType<{ k: Ink }>> = {
  'g3-house': HouseScene,
  'g3-rooms': Rooms,
  'g3-coat': CoatScene,
  'g3-address': Address,
  'g3-gate': Gate,
  'g3-corner': Corner,
  'g3-early': Early,
  'g3-treat': Treat1,
  'g3-chair': ChairScene,
  'g3-cover': CoverScene,
  'g3-cloud': CloudScene,
};
