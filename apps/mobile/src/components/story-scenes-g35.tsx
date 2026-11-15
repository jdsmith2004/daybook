/* Scenes for lesson 35 told as a story (see story-kit.tsx): "Catch the autopilot", the popcorn study of Neal and Wood (2011). */
import { useEffect, useState, type ComponentType } from 'react';
import { Easing } from 'react-native';
import { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';

import { useAppear, useReducedMotion } from '@/lib/motion';

import { BEAR_LINE, Cloud, Frame, type Ink, Person, Say } from './story-kit';

const L35_GOLD = '#FFD25A';
const L35_WHITE = '#FFFFFF';
const L35_RED = '#C2410C';
const L35_SKIN = '#F0C9A6';
const L35_NIGHT = '#17142A';
const L35_SEAT = '#2B2540';
const L35_SEAT_LIGHT = '#3A3358';
const L35_PAPER = '#FBF4E4';
const L35_PAPER_LINE = '#C9BDA0';
const L35_WOOD = '#C9965B';
const L35_GREEN = '#7FBF8E';
const L35_HEADS = ['#C9C4E6', '#F7C6D0', '#BFE3C0'];

/* a number from 0 to 1 that eases up once, after a short pause; with Reduce Motion on it starts at 1 */
function L35useGrow(delay = 300, dur = 1100) {
  const still = useReducedMotion();
  const v = useAppear(delay, dur, Easing.out(Easing.cubic));
  const [p, setP] = useState(still ? 1 : 0);
  useEffect(() => {
    const id = v.addListener(({ value }) => setP(value));
    return () => v.removeListener(id);
  }, [v]);
  return p;
}

/* the line of words under a picture */
function L35Cap({ k, s }: { k: Ink; s: string }) {
  return <Say x={150} y={190} s={s} fill={k.ink} />;
}

/* a striped popcorn bucket standing on (x, y), its popcorn puffy and white-gold, or flat, gray-beige and limp when stale */
function L35Bucket({ x, y, s = 1, stale = false }: { x: number; y: number; s?: number; stale?: boolean }) {
  const n = 7;
  const stripes = Array.from({ length: n }, (_, i) => {
    if (i % 2) return null;
    const t0 = -14 + (28 / n) * i;
    const t1 = -14 + (28 / n) * (i + 1);
    const b0 = -10 + (20 / n) * i;
    const b1 = -10 + (20 / n) * (i + 1);
    return <Path key={i} d={`M${t0} -26 L${t1} -26 L${b1} 0 L${b0} 0 Z`} fill={L35_RED} />;
  });
  const puffs: [number, number, number][] = [
    [-9, -30, 5.5],
    [0, -34, 6.5],
    [9, -30, 5.5],
    [-4, -40, 5],
    [5, -40, 5],
    [-13, -26, 4],
    [13, -26, 4],
  ];
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      {stale ? (
        <G>
          <Path d="M-14 -25 Q-9 -30 -4 -28 Q2 -32 8 -28 Q12 -30 14 -25 Z" fill="#B9AE98" />
          <Ellipse cx={-7} cy={-28} rx={4.5} ry={2.2} fill="#9C917B" />
          <Ellipse cx={4} cy={-29.5} rx={4} ry={2} fill="#CFC4AC" />
          <Ellipse cx={10} cy={-27} rx={3.5} ry={1.8} fill="#9C917B" />
          <Path d="M12 -26 Q18 -26 18 -20" stroke="#B9AE98" strokeWidth={3.4} strokeLinecap="round" fill="none" />
        </G>
      ) : (
        <G>
          {puffs.map(([cx, cy, r], i) => (
            <Circle key={i} cx={cx} cy={cy} r={r} fill="#FFF3CF" stroke="#EBC96B" strokeWidth={1} />
          ))}
          <Circle cx={-1} cy={-33} r={1.6} fill={L35_GOLD} />
          <Circle cx={7} cy={-39} r={1.4} fill={L35_GOLD} />
          <Circle cx={-10} cy={-29} r={1.4} fill={L35_GOLD} />
        </G>
      )}
      <Path d="M-14 -26 L14 -26 L10 0 L-10 0 Z" fill={L35_WHITE} />
      {stripes}
      <Path d="M-14 -26 L14 -26 L10 0 L-10 0 Z" fill="none" stroke="#8A3A12" strokeWidth={0.8} strokeLinejoin="round" />
      <Rect x={-15.5} y={-28} width={31} height={4} rx={2} fill={L35_WHITE} stroke="#D9CFC8" strokeWidth={0.8} />
    </G>
  );
}

/* a person sitting in a cinema seat, in profile and facing right: (x, y) is the hip, s the scale; (lx, ly) in the seat's own units become the picture's */
const L35_PINK = '#F7C6D0';
const L35_PINK_DEEP = '#D98FA0';
function L35At(x: number, y: number, s: number, lx: number, ly: number): [number, number] {
  return [x + lx * s, y + ly * s];
}
function L35Sitter({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Rect x={-22} y={-52} width={10} height={56} rx={5} fill={L35_SEAT_LIGHT} />
      <Rect x={-22} y={0} width={56} height={10} rx={5} fill={L35_SEAT} />
      <Rect x={22} y={-8} width={10} height={28} rx={5} fill={L35_PINK} />
      <Rect x={22} y={14} width={17} height={7} rx={3.5} fill={L35_PINK} />
      <Rect x={-12} y={-12} width={40} height={11} rx={5.5} fill={L35_PINK} />
      <Path d="M-12 -8 L-12 -38 Q-12 -46 -3 -46 Q6 -46 6 -38 L6 -8 Z" fill={L35_PINK} />
      <Circle cx={2} cy={-58} r={11} fill={L35_PINK} />
      <Circle cx={12.5} cy={-56} r={2.6} fill={L35_PINK} />
      <Circle cx={6.5} cy={-60} r={1.7} fill={L35_NIGHT} />
    </G>
  );
}
/* an arrowhead whose tip is at (x, y), pointing along (dx, dy) */
function L35Head({ x, y, dx, dy, fill }: { x: number; y: number; dx: number; dy: number; fill: string }) {
  const a = (Math.atan2(dy, dx) * 180) / Math.PI;
  return (
    <G transform={`translate(${x} ${y}) rotate(${a})`}>
      <Path d="M0 0 L-8 -4.6 L-8 4.6 Z" fill={fill} stroke={fill} strokeWidth={1.4} strokeLinejoin="round" />
    </G>
  );
}
/* the glowing screen of a cinema */
function L35Screen({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  return (
    <G>
      <Rect x={x - 6} y={y - 6} width={w + 12} height={h + 12} rx={8} fill="#C9C4E6" opacity={0.2} />
      <Rect x={x} y={y} width={w} height={h} rx={4} fill="#EDEBFF" />
    </G>
  );
}
function L35Panel() {
  return <Rect x={8} y={8} width={284} height={158} rx={14} fill={L35_NIGHT} />;
}
function L35Hand({ x, y }: { x: number; y: number }) {
  return <Circle cx={x} cy={y} r={5} fill={L35_SKIN} />;
}

/* ---------- 1: free popcorn at the movies ---------- */
function L35Cinema({ k }: { k: Ink }) {
  const front = [70, 150, 230];
  return (
    <Frame label="A dark cinema seen from behind the seats. A big screen glows ahead, and three people sit in the front row, two of them holding buckets of popcorn.">
      <L35Panel />
      <L35Screen x={60} y={18} w={180} h={64} />
      {[48, 112, 188, 252].map((cx) => (
        <Rect key={cx} x={cx - 18} y={104} width={36} height={24} rx={8} fill={L35_SEAT_LIGHT} opacity={0.75} />
      ))}
      {front.map((cx, i) => (
        <G key={cx}>
          <Circle cx={cx} cy={124} r={11} fill={L35_HEADS[i]} />
          <Rect x={cx - 24} y={130} width={48} height={36} rx={10} fill={L35_SEAT} />
        </G>
      ))}
      <Rect x={96} y={128} width={7} height={18} rx={3.5} fill={L35_HEADS[0]} />
      <L35Hand x={104} y={146} />
      <L35Bucket x={116} y={158} s={0.85} />
      <Rect x={256} y={128} width={7} height={18} rx={3.5} fill={L35_HEADS[2]} />
      <L35Hand x={256} y={146} />
      <L35Bucket x={268} y={158} s={0.85} />
      <L35Cap k={k} s="Free popcorn at the movies" />
    </Frame>
  );
}

/* ---------- 2: a week old, and it tasted like it ---------- */
function L35Stale({ k }: { k: Ink }) {
  return (
    <Frame label="A big bucket of stale, flat popcorn with a tag hanging from it that says seven days old, and a small face beside it pulling a sour face.">
      <Ellipse cx={150} cy={153} rx={44} ry={6} fill={k.line} opacity={0.6} />
      <L35Bucket x={150} y={150} s={2.5} stale />
      <Path d="M182 92 Q210 96 218 114" stroke={k.muted} strokeWidth={1.6} fill="none" strokeLinecap="round" />
      <G transform="translate(218 112) rotate(8)">
        <Rect x={-33} y={0} width={66} height={24} rx={5} fill={L35_PAPER} stroke={L35_PAPER_LINE} strokeWidth={1.2} />
        <Circle cx={-26} cy={5} r={1.8} fill={L35_PAPER_LINE} />
        <Say x={4} y={16.5} s="7 days old" fill="#4A3F2A" size={10.5} />
      </G>
      <G transform="translate(58 106)">
        <Circle cx={0} cy={0} r={22} fill={L35_GOLD} stroke={BEAR_LINE} strokeWidth={2} />
        <Path d="M-13 -8 L-5 -3 L-13 2" stroke={BEAR_LINE} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <Path d="M13 -8 L5 -3 L13 2" stroke={BEAR_LINE} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <Path d="M-9 11 Q-5 6 -1 11 Q3 16 9 9" stroke={BEAR_LINE} strokeWidth={2.4} strokeLinecap="round" fill="none" />
        <Path d="M-27 -20 L-33 -26 M0 -28 L0 -35 M27 -20 L33 -26" stroke={k.muted} strokeWidth={2.4} strokeLinecap="round" />
      </G>
      <L35Cap k={k} s="A week old, and it tasted like it" />
    </Frame>
  );
}

/* ---------- 3: taste said no, hands kept going ---------- */
function L35Hands({ k }: { k: Ink }) {
  const p = L35useGrow(350, 1300);
  const X = 95;
  const Y = 128;
  const S = 1.45;
  const [shx, shy] = L35At(X, Y, S, -3, -38);
  const [bx, by] = L35At(X, Y, S, 22, -12);
  const [mx, my] = L35At(X, Y, S, 11, -51);
  const sx = bx;
  const sy = by - 33;
  const hx = sx + (mx + 3 - sx) * p;
  const hy = sy + (my + 2 - sy) * p;
  const cx = 133;
  const cy = 58;
  const r = 15;
  const pt = (deg: number) => `${cx + r * Math.cos((deg * Math.PI) / 180)} ${cy + r * Math.sin((deg * Math.PI) / 180)}`;
  const endA = (200 * Math.PI) / 180;
  return (
    <Frame label="A person sits in a cinema seat in profile, facing the screen, with a bucket of stale popcorn in their lap. A looping arrow goes from the bucket up to the mouth and back again, again and again.">
      <L35Panel />
      <L35Screen x={182} y={20} w={100} h={54} />
      <L35Sitter x={X} y={Y} s={S} />
      <L35Bucket x={bx} y={by} s={1.1} stale />
      <Path d={`M${pt(160)} A${r} ${r} 0 1 0 ${pt(200)}`} stroke={L35_GOLD} strokeWidth={2.8} strokeLinecap="round" fill="none" />
      <L35Head x={cx + r * Math.cos(endA)} y={cy + r * Math.sin(endA)} dx={Math.sin(endA)} dy={-Math.cos(endA)} fill={L35_GOLD} />
      <Line x1={shx} y1={shy} x2={hx} y2={hy} stroke={L35_PINK} strokeWidth={7} strokeLinecap="round" />
      <L35Hand x={hx} y={hy} />
      <L35Cap k={k} s="Taste said no. Hands kept going." />
    </Frame>
  );
}

/* ---------- 4: away from the cinema, they ate less ---------- */
function L35Room({ k }: { k: Ink }) {
  return (
    <Frame label="A plain bright meeting room with a table and a small screen on the wall. A person sits at the table and has pushed a bucket of stale popcorn away from them.">
      <Rect x={8} y={8} width={284} height={158} rx={14} fill={k.soft} opacity={0.5} />
      <Line x1={8} y1={160} x2={292} y2={160} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      <Rect x={190} y={18} width={78} height={42} rx={5} fill={k.bg} stroke={k.line} strokeWidth={3} />
      <Line x1={202} y1={32} x2={250} y2={32} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      <Line x1={202} y1={44} x2={236} y2={44} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      <Rect x={78} y={74} width={7} height={80} rx={3} fill={k.line} />
      <Person x={112} y={152} s={1.3} fill={k.acc} face={k.bg} />
      <Rect x={64} y={112} width={206} height={9} rx={4} fill={L35_WOOD} />
      <Rect x={74} y={121} width={7} height={39} fill={L35_WOOD} />
      <Rect x={253} y={121} width={7} height={39} fill={L35_WOOD} />
      <Line x1={130} y1={114} x2={152} y2={108} stroke={k.acc} strokeWidth={6} strokeLinecap="round" />
      <L35Hand x={154} y={108} />
      <Path d="M166 98 L186 98 M180 92 L187 98 L180 104" stroke={k.muted} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <L35Bucket x={228} y={112} s={1.1} stale />
      <L35Cap k={k} s="Away from the cinema, they ate less" />
    </Frame>
  );
}

/* ---------- 5: the other hand woke them up ---------- */
function L35OtherHand({ k }: { k: Ink }) {
  const p = L35useGrow(450, 900);
  const q = Math.max(0, (p - 0.4) / 0.6);
  const X = 105;
  const Y = 128;
  const S = 1.45;
  const [shx, shy] = L35At(X, Y, S, -3, -38);
  const [bx, by] = L35At(X, Y, S, 10, -12);
  const [kx, ky] = L35At(X, Y, S, 29, -8);
  const hx = bx + 2;
  const hy = by - 33;
  return (
    <Frame label="A person sits in a cinema seat with a bucket of popcorn in their lap and reaches across their body with the other hand, clumsily. A small curved arrow swaps between the usual hand and the other one, and a small gold spark beside the head shows they woke up.">
      <L35Panel />
      <L35Screen x={190} y={18} w={94} h={48} />
      <L35Sitter x={X} y={Y} s={S} />
      <L35Bucket x={bx} y={by} s={1.1} stale />
      <Circle cx={kx} cy={ky - 4} r={5} fill={L35_SKIN} opacity={0.55} />
      <Path
        d={`M${shx} ${shy} L${shx - 5} ${shy + 25} L${hx - 3} ${hy + 14} L${hx} ${hy}`}
        stroke={L35_PINK_DEEP}
        strokeWidth={6}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <L35Hand x={hx} y={hy} />
      <Path d={`M${kx + 3} ${ky - 11} Q${kx + 26} ${ky - 28} ${hx + 14} ${hy - 1}`} stroke="#C9C4E6" strokeWidth={2.6} strokeLinecap="round" fill="none" />
      <L35Head x={kx + 3} y={ky - 11} dx={-1} dy={0.75} fill="#C9C4E6" />
      <L35Head x={hx + 14} y={hy - 1} dx={-1} dy={-0.3} fill="#C9C4E6" />
      <G transform={`translate(84 38) scale(${q})`} opacity={q}>
        <Path d="M0 -13 Q2 -2 13 0 Q2 2 0 13 Q-2 2 -13 0 Q-2 -2 0 -13 Z" fill={L35_GOLD} />
        <Line x1={-16} y1={-10} x2={-21} y2={-15} stroke={L35_GOLD} strokeWidth={2.4} strokeLinecap="round" />
        <Line x1={-18} y1={4} x2={-24} y2={5} stroke={L35_GOLD} strokeWidth={2.4} strokeLinecap="round" />
      </G>
      <L35Cap k={k} s="The other hand woke them up" />
    </Frame>
  );
}

/* ---------- 6: hands here, mind elsewhere ---------- */
function L35Diary({ k }: { k: Ink }) {
  const ticked = [0, 2, 3, 5, 6];
  return (
    <Frame label="An open notebook with a line for every hour and a short tick on many of the lines. Beside it, a person stands with empty hands while a thought cloud above them shows a faraway hill and sun.">
      <Line x1={8} y1={160} x2={292} y2={160} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      <Rect x={20} y={20} width={112} height={134} rx={7} fill={L35_PAPER} />
      <Rect x={20} y={20} width={9} height={134} rx={4} fill={k.acc} />
      {Array.from({ length: 8 }, (_, i) => (
        <G key={i}>
          <Line x1={40} y1={42 + i * 14} x2={104} y2={42 + i * 14} stroke={L35_PAPER_LINE} strokeWidth={2} strokeLinecap="round" />
          {ticked.includes(i) ? (
            <Path d={`M108 ${40 + i * 14} l3 3.5 l7 -8`} stroke={L35_RED} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          ) : null}
        </G>
      ))}
      <Cloud x={178} y={14} w={104} h={50} fill={k.soft} />
      <Circle cx={252} cy={31} r={7} fill={L35_GOLD} />
      <Path d="M190 62 Q214 34 238 62 Z" fill={L35_GREEN} />
      <Path d="M222 62 Q246 42 270 62 Z" fill="#5FA877" />
      <Person x={230} y={160} s={1.15} fill={k.ink} face={k.bg} />
      <L35Cap k={k} s="Hands here, mind elsewhere" />
    </Frame>
  );
}

/* ---------- 7: you notice, and choose again ---------- */
const L35_PY0 = 150;
const L35_PYC = 168;
const L35_PX0 = 12;
const L35_PX1 = 290;
function L35OnPath(t: number) {
  const u = 1 - t;
  return { x: L35_PX0 + t * (L35_PX1 - L35_PX0), y: u * u * L35_PY0 + 2 * u * t * L35_PYC + t * t * L35_PY0 };
}
function L35Wake({ k }: { k: Ink }) {
  const p = L35useGrow(300, 1500);
  const stop = L35OnPath(0.5);
  const here = L35OnPath(0.12 + (0.5 - 0.12) * p);
  const q = Math.max(0, (p - 0.75) / 0.25);
  return (
    <Frame label="A dotted path runs from left to right. A person partway along it has stopped, a small gold spark by their head, and turns toward a side path that branches off upward.">
      <Path
        d={`M${L35_PX0} ${L35_PY0} Q151 ${L35_PYC} ${L35_PX1} ${L35_PY0}`}
        stroke={k.muted}
        strokeWidth={4}
        strokeDasharray="1 9"
        strokeLinecap="round"
        fill="none"
      />
      <Path d={`M${stop.x} ${stop.y} Q${stop.x + 10} 100 262 66`} stroke={k.acc} strokeWidth={4} strokeDasharray="1 9" strokeLinecap="round" fill="none" />
      <Path d="M252 66 Q270 22 292 56 Z" fill={L35_GREEN} />
      <Circle cx={240} cy={34} r={9} fill={L35_GOLD} />
      <Person x={here.x} y={here.y + 2} s={1.1} fill={k.ink} face={k.bg} />
      <G transform={`translate(${stop.x + 22} 62) scale(${q})`} opacity={q}>
        <Path d="M0 -13 Q2 -2 13 0 Q2 2 0 13 Q-2 2 -13 0 Q-2 -2 0 -13 Z" fill={L35_GOLD} />
        <Line x1={16} y1={-10} x2={21} y2={-15} stroke={L35_GOLD} strokeWidth={2.4} strokeLinecap="round" />
        <Line x1={18} y1={4} x2={24} y2={5} stroke={L35_GOLD} strokeWidth={2.4} strokeLinecap="round" />
      </G>
      <L35Cap k={k} s="You notice, and choose again" />
    </Frame>
  );
}

/* ---------- 8: watch for the start ---------- */
function L35Watch({ k }: { k: Ink }) {
  const p = L35useGrow(450, 1200);
  const a = 0.95 * p;
  const c = Math.cos(a);
  const s = Math.sin(a);
  const fx = 206 + 42 * c;
  return (
    <Frame label="A person stands calm and upright with one hand raised in a gentle stop, facing a small door that is just starting to open. A small eye above the person shows they are watching for the start.">
      <Line x1={8} y1={160} x2={292} y2={160} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      <Rect x={198} y={66} width={58} height={94} rx={4} fill={k.line} />
      <Rect x={204} y={72} width={46} height={88} fill={L35_SEAT} />
      <Rect x={206} y={72} width={44} height={88} fill={L35_GOLD} opacity={0.25} />
      <Path d={`M206 72 L${fx} ${72 + 10 * s} L${fx} ${160 - 10 * s} L206 160 Z`} fill="#8A5A2B" />
      <Circle cx={fx - 5} cy={118} r={2.4} fill={L35_GOLD} />
      <Person x={110} y={160} s={1.3} fill={k.acc} face={k.bg} />
      <Line x1={128} y1={124} x2={150} y2={98} stroke={k.acc} strokeWidth={6} strokeLinecap="round" />
      <Rect x={145} y={78} width={13} height={21} rx={6} fill={L35_SKIN} />
      <G transform="translate(110 38) scale(1.3)">
        <Path d="M-15 0 Q0 -13 15 0 Q0 13 -15 0 Z" fill={k.bg} stroke={k.ink} strokeWidth={2} strokeLinejoin="round" />
        <Circle cx={0} cy={0} r={4.6} fill={k.acc} />
        <Circle cx={1.4} cy={-1.4} r={1.4} fill={L35_WHITE} />
      </G>
      <L35Cap k={k} s="Watch for the start" />
    </Frame>
  );
}

export const SCENES_G35: Record<string, ComponentType<{ k: Ink }>> = {
  'l35-cinema': L35Cinema,
  'l35-stale': L35Stale,
  'l35-hands': L35Hands,
  'l35-room': L35Room,
  'l35-other-hand': L35OtherHand,
  'l35-diary': L35Diary,
  'l35-wake': L35Wake,
  'l35-watch': L35Watch,
};
