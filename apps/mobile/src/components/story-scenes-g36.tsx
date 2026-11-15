/* Scenes for lesson 36 told as a story (see story-kit.tsx): "What the habit does for you", an old tale taken apart. The dragon sleeps on
   gold it cannot use, the gold is in the cave, and the way in can be a few steps. Drawn on its own, with no film in mind. */
import { useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { Easing } from 'react-native';
import { Circle, ClipPath, Defs, Ellipse, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';

import { useAppear, useReducedMotion } from '@/lib/motion';
import { font } from '@/lib/theme';

import { Frame, type Ink, Person, Say } from './story-kit';

const L36_GOLD = '#FFD25A';
const L36_GOLD2 = '#E8B730';
const L36_GOLD_MOUND = '#D4A021';
const L36_GOLD_RIM = '#B8860B';
const L36_WHITE = '#FFFFFF';
const L36_ROCK = '#3B2F45';
const L36_ROCK_HI = '#4F4160';
const L36_CAVE = '#18121F';
const L36_FLOOR = '#261D30';
const L36_BODY = '#7A2E3B';
const L36_BODY_DARK = '#63222F';
const L36_BELLY = '#B2586A';
const L36_WING = '#5A2030';
const L36_WING_RIB = '#9A4455';
const L36_SPIKE = '#E0A25A';
const L36_CREAM = '#F1E3C4';
const L36_EYE_LINE = '#2A0E16';
const L36_LIT = '#F0D9B5';
const L36_BROWN = '#8A5A2B';
const L36_GREEN = '#4E9A5B';
const L36_RED = '#D9472B';

/* a number from 0 to 1 that eases up once, after a short pause; with Reduce Motion on it starts at 1 */
function L36useGrow(delay = 300, dur = 1200) {
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
function L36Cap({ k, s }: { k: Ink; s: string }) {
  return <Say x={150} y={190} s={s} fill={k.ink} />;
}

/* a little four-point sparkle */
function L36Spark({ x, y, r, fill = L36_WHITE, opacity = 0.9 }: { x: number; y: number; r: number; fill?: string; opacity?: number }) {
  const q = r * 0.22;
  return (
    <Path
      d={`M${x} ${y - r} Q${x + q} ${y - q} ${x + r} ${y} Q${x + q} ${y + q} ${x} ${y + r} Q${x - q} ${y + q} ${x - r} ${y} Q${x - q} ${y - q} ${x} ${y - r} Z`}
      fill={fill}
      opacity={opacity}
    />
  );
}

/* ---------- the dragon: one drawing for every scene ---------- */
/* Origin is the bottom of the belly, facing right: a long curled body, a head resting on its front claws, small wings folded, spikes
   along the back and a tail curling round. About 150 wide and 50 tall at scale 1. `tail="none"` leaves the tail out when a scene draws
   its own; `eye` is closed, half or open; `asleep` adds the sleeping z. */
const L36_SPIKE_XS = [-36, -27, -18, -9, 0, 9, 18, 26];
function L36Dragon({
  x,
  y,
  s = 1,
  asleep = true,
  eye = 'closed',
  tail = 'curl',
  zc = '#FFFFFF',
}: {
  x: number;
  y: number;
  s?: number;
  asleep?: boolean;
  eye?: 'closed' | 'half' | 'open';
  tail?: 'curl' | 'none';
  zc?: string;
}) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      {tail === 'curl' ? (
        <G>
          <Path d="M-36 -13 C-58 -15 -72 -3 -64 6" stroke={L36_BODY} strokeWidth={12} strokeLinecap="round" fill="none" />
          <Path d="M-64 6 C-58 14 -44 12 -45 3" stroke={L36_BODY} strokeWidth={7} strokeLinecap="round" fill="none" />
          <Path d="M-45 3 L-40 -3 L-39 5 Z" fill={L36_SPIKE} />
        </G>
      ) : null}
      <Ellipse cx={-6} cy={-20} rx={42} ry={19} fill={L36_BODY} />
      <Ellipse cx={-4} cy={-9} rx={31} ry={7.5} fill={L36_BELLY} />
      {[-20, -8, 4, 16].map((bx) => (
        <Path key={bx} d={`M${bx} -15 Q${bx + 2} -9 ${bx} -2.5`} stroke={L36_BODY} strokeWidth={1} fill="none" opacity={0.55} />
      ))}
      <Ellipse cx={-26} cy={-13} rx={15} ry={11} fill={L36_BODY_DARK} />
      <Ellipse cx={-20} cy={-1.5} rx={9} ry={3} fill={L36_BODY_DARK} />
      {L36_SPIKE_XS.map((sx) => {
        const yt = -20 - 19 * Math.sqrt(1 - Math.pow((sx + 6) / 42, 2));
        return <Path key={sx} d={`M${sx - 3.6} ${yt + 1.5} L${sx + 3.6} ${yt + 1.5} L${sx - 1.6} ${yt - 7.5} Z`} fill={L36_SPIKE} />;
      })}
      <Path
        d="M6 -33 L-10 -56 Q-24 -54 -40 -48 Q-33 -44 -35 -38 Q-28 -38 -29 -32 Q-20 -34 -16 -28 Q-6 -30 6 -33 Z"
        fill={L36_WING}
        stroke={L36_BODY_DARK}
        strokeWidth={1}
        strokeLinejoin="round"
      />
      <Path
        d="M6 -33 L-10 -56 M-10 -56 L-35 -38 M-10 -56 L-29 -32 M-10 -56 L-16 -28"
        stroke={L36_WING_RIB}
        strokeWidth={1.4}
        strokeLinecap="round"
        fill="none"
      />
      <Ellipse cx={62} cy={-3} rx={18} ry={6} fill={L36_BODY_DARK} />
      {[-6, -2.5, 1].map((cy) => (
        <Ellipse key={cy} cx={79.5} cy={cy} rx={1.8} ry={1.2} fill={L36_CREAM} />
      ))}
      <G transform="translate(0 -3)">
        <Path d="M46 -31 Q40 -44 30 -46 Q38 -36 41 -29 Z" fill={L36_CREAM} />
        <Path d="M36 -22 L27 -25 L35 -16 Z" fill={L36_SPIKE} />
        <Path d="M34 -14 Q34 -32 52 -33 Q64 -33 74 -25 L84 -19 Q88 -14 82 -10 L68 -8 Q58 -3 46 -5 Q34 -5 34 -14 Z" fill={L36_BODY} strokeLinejoin="round" />
        <Path d="M50 -5 Q60 -3 68 -8 L82 -10 Q80 -7 72 -6 Q60 -1 50 -5 Z" fill={L36_BELLY} />
        <Path d="M54 -27 Q60 -29 66 -26" stroke={L36_EYE_LINE} strokeWidth={1.5} strokeLinecap="round" fill="none" />
        {eye === 'closed' ? (
          <Path d="M55 -21 Q60 -17 65 -21" stroke={L36_EYE_LINE} strokeWidth={1.9} strokeLinecap="round" fill="none" />
        ) : (
          <G>
            <Ellipse cx={60} cy={-21.5} rx={4.6} ry={3.8} fill={L36_GOLD} />
            <Ellipse cx={60.5} cy={-21.5} rx={1.3} ry={3.2} fill={L36_EYE_LINE} />
            {eye === 'half' ? (
              <G>
                <Path d="M54.6 -21 Q60 -26.4 65.4 -21 L65.4 -27 L54.6 -27 Z" fill={L36_BODY} />
                <Path d="M54.8 -21 Q60 -24.6 65.2 -21" stroke={L36_EYE_LINE} strokeWidth={1.4} fill="none" />
              </G>
            ) : null}
          </G>
        )}
        <Circle cx={80} cy={-16} r={1.3} fill={L36_EYE_LINE} />
        <Path d="M70 -11 Q77 -9 83 -13" stroke={L36_EYE_LINE} strokeWidth={1.1} strokeLinecap="round" fill="none" opacity={0.7} />
      </G>
      {asleep ? (
        <G>
          <SvgText x={90} y={-28} fontSize={9} fontWeight="700" fill={zc} fontFamily={font.bodyBold}>
            z
          </SvgText>
          <SvgText x={97} y={-38} fontSize={12} fontWeight="700" fill={zc} fontFamily={font.bodyBold}>
            z
          </SvgText>
          <SvgText x={105} y={-50} fontSize={15} fontWeight="700" fill={zc} fontFamily={font.bodyBold}>
            Z
          </SvgText>
        </G>
      ) : null}
    </G>
  );
}

/* a tail drawn in pieces that thin toward the tip: each piece is a path and a width */
function L36Tail({ segs, tip }: { segs: Array<[string, number]>; tip?: [number, number, number] }) {
  return (
    <G>
      {segs.map(([d, w], i) => (
        <Path key={i} d={d} stroke={L36_BODY} strokeWidth={w} strokeLinecap="round" fill="none" />
      ))}
      {tip ? <Path d="M-5 0 L0 -6 L5 0 L0 8 Z" fill={L36_SPIKE} transform={`translate(${tip[0]} ${tip[1]}) rotate(${tip[2]})`} /> : null}
    </G>
  );
}

/* ---------- the gold: a heap of coins with a cup and a small crown poking out ---------- */
/* each coin is [x, y, rx, ry, tone]; a thin rx is a coin standing on its edge */
const L36_COINS: Array<[number, number, number, number, number]> = [
  [-51, -3, 6.5, 3.6, 0],
  [-42, -8, 6.5, 3.8, 1],
  [-34, -3, 7, 4, 0],
  [-27, -13, 6.5, 3.8, 1],
  [-20, -5, 7, 4, 0],
  [-14, -20, 3.2, 6.4, 0],
  [-8, -27, 6.5, 3.8, 0],
  [-4, -12, 7, 4, 1],
  [3, -31, 6, 3.6, 1],
  [9, -22, 3.4, 6.6, 0],
  [10, -8, 7, 4, 0],
  [16, -29, 6.5, 3.8, 0],
  [21, -16, 7, 4, 1],
  [27, -24, 6, 3.6, 0],
  [31, -7, 7, 4, 0],
  [35, -14, 3.4, 6.4, 1],
  [44, -5, 6.5, 3.8, 1],
  [51, -2.5, 6.5, 3.6, 0],
  [-26, -2, 6, 3.4, 1],
  [21, -2, 6, 3.4, 1],
  [-8, -2, 7, 4, 0],
];

function L36Cup({ x, y, s = 1, rot = 0 }: { x: number; y: number; s?: number; rot?: number }) {
  return (
    <G transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <Path d="M5.6 -13 C11 -13 11 -6 5 -6" stroke={L36_GOLD_RIM} strokeWidth={1.8} fill="none" />
      <Path d="M-6.5 -15 Q-6.5 -4 0 -3.5 Q6.5 -4 6.5 -15 Z" fill={L36_GOLD} stroke={L36_GOLD_RIM} strokeWidth={0.9} strokeLinejoin="round" />
      <Ellipse cx={0} cy={-15} rx={6.5} ry={1.8} fill={L36_GOLD2} stroke={L36_GOLD_RIM} strokeWidth={0.8} />
      <Rect x={-1.2} y={-4} width={2.4} height={4} fill={L36_GOLD2} />
      <Ellipse cx={0} cy={0} rx={5} ry={1.6} fill={L36_GOLD2} stroke={L36_GOLD_RIM} strokeWidth={0.8} />
      <Path d="M-3.8 -12 Q-3.4 -7 -1.6 -5.6" stroke={L36_WHITE} strokeWidth={1.2} strokeLinecap="round" fill="none" opacity={0.7} />
    </G>
  );
}

function L36Crown({ x, y, s = 1, rot = 0 }: { x: number; y: number; s?: number; rot?: number }) {
  return (
    <G transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <Path d="M-9 0 L-10 -11 L-5 -6 L0 -14 L5 -6 L10 -11 L9 0 Z" fill={L36_GOLD} stroke={L36_GOLD_RIM} strokeWidth={0.9} strokeLinejoin="round" />
      <Rect x={-9} y={-3.4} width={18} height={3.4} fill={L36_GOLD2} stroke={L36_GOLD_RIM} strokeWidth={0.7} />
      <Circle cx={0} cy={-1.7} r={1.2} fill={L36_RED} />
      <Circle cx={-4.5} cy={-1.7} r={0.9} fill="#4DA3E8" />
      <Circle cx={4.5} cy={-1.7} r={0.9} fill="#4DA3E8" />
      {[-10, 0, 10].map((bx, i) => (
        <Circle key={bx} cx={bx} cy={i === 1 ? -15 : -12} r={1.5} fill={L36_GOLD} stroke={L36_GOLD_RIM} strokeWidth={0.6} />
      ))}
    </G>
  );
}

/* origin is the bottom middle of the heap: about 116 wide and 36 tall at scale 1; `glow` (0 to 1) swells a soft gold light behind it */
function L36Gold({ x, y, s = 1, glow = 0, cup = true, crown = true }: { x: number; y: number; s?: number; glow?: number; cup?: boolean; crown?: boolean }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      {glow > 0 ? (
        <G>
          <Circle cx={0} cy={-22} r={34 + 40 * glow} fill={L36_GOLD} opacity={0.1 + 0.06 * glow} />
          <Circle cx={0} cy={-22} r={22 + 26 * glow} fill={L36_GOLD} opacity={0.14 + 0.08 * glow} />
        </G>
      ) : null}
      <Path
        d="M-58 0 C-56 -10 -40 -16 -30 -22 C-20 -30 -10 -36 4 -35 C18 -36 30 -26 40 -18 C52 -12 58 -8 58 0 Z"
        fill={L36_GOLD_MOUND}
        stroke={L36_GOLD_RIM}
        strokeWidth={1}
        strokeLinejoin="round"
      />
      {L36_COINS.map(([cx, cy, rx, ry, tone], i) => (
        <Ellipse key={i} cx={cx} cy={cy} rx={rx} ry={ry} fill={tone ? L36_GOLD2 : L36_GOLD} stroke={L36_GOLD_RIM} strokeWidth={0.9} />
      ))}
      <Circle cx={-2} cy={-19} r={2.4} fill={L36_RED} stroke={L36_GOLD_RIM} strokeWidth={0.6} />
      <Circle cx={37} cy={-8} r={2} fill="#4DA3E8" stroke={L36_GOLD_RIM} strokeWidth={0.6} />
      {cup ? <L36Cup x={-33} y={-14} rot={-8} /> : null}
      {crown ? <L36Crown x={30} y={-19} rot={9} /> : null}
    </G>
  );
}

/* a soft gold light, cut off by a clip so it never spills past the picture's shapes (`clip` is the id of a ClipPath) */
function L36Glow({ cx, cy, r, p, clip }: { cx: number; cy: number; r: number; p: number; clip: string }) {
  return (
    <G clipPath={`url(#${clip})`}>
      <Circle cx={cx} cy={cy} r={r + r * 0.9 * p} fill={L36_GOLD} opacity={0.1 + 0.06 * p} />
      <Circle cx={cx} cy={cy} r={(r + r * 0.9 * p) * 0.62} fill={L36_GOLD} opacity={0.14 + 0.08 * p} />
    </G>
  );
}

/* ---------- the cave seen from inside: a rock arch with a dark room, a floor and teeth of rock hanging down ---------- */
const L36_ARCH_TEETH = [58, 88, 116, 188, 214, 244];
const l36ArchTop = (x: number) => 90 - 66 * Math.sqrt(Math.max(0, 1 - Math.pow((x - 150) / 124, 2)));
function L36Arch({ k, children }: { k: Ink; children?: ReactNode }) {
  return (
    <G>
      <Defs>
        <ClipPath id="l36-arch-clip">
          <Path d="M26 172 V90 A124 66 0 0 1 274 90 V172 Z" />
        </ClipPath>
      </Defs>
      <Path d="M8 176 V84 A142 78 0 0 1 292 84 V176 Z" fill={L36_ROCK} stroke={k.line} strokeWidth={1.5} />
      <Ellipse cx={17} cy={104} rx={3} ry={11} fill={L36_ROCK_HI} />
      <Ellipse cx={18} cy={142} rx={3.2} ry={9} fill={L36_ROCK_HI} />
      <Ellipse cx={283} cy={112} rx={3} ry={10} fill={L36_ROCK_HI} />
      <Ellipse cx={282} cy={150} rx={3.2} ry={8} fill={L36_ROCK_HI} />
      <Ellipse cx={46} cy={34} rx={9} ry={3} fill={L36_ROCK_HI} transform="rotate(-38 46 34)" />
      <Ellipse cx={104} cy={15} rx={10} ry={3} fill={L36_ROCK_HI} transform="rotate(-12 104 15)" />
      <Ellipse cx={206} cy={15} rx={10} ry={3} fill={L36_ROCK_HI} transform="rotate(12 206 15)" />
      <Ellipse cx={254} cy={34} rx={9} ry={3} fill={L36_ROCK_HI} transform="rotate(38 254 34)" />
      <Path d="M26 176 V90 A124 66 0 0 1 274 90 V176 Z" fill={L36_CAVE} />
      {L36_ARCH_TEETH.map((tx, i) => {
        const t = l36ArchTop(tx);
        const h = 12 + (i % 3) * 4;
        return <Path key={tx} d={`M${tx - 6} ${t - 3} L${tx + 6} ${t - 3} L${tx + 0.5} ${t + h} Z`} fill={L36_ROCK} />;
      })}
      <Path d="M26 162 Q150 148 274 162 V176 H26 Z" fill={L36_FLOOR} />
      {children}
    </G>
  );
}

/* ---------- the mountain seen from outside: a dark mountain, a cave mouth and the way round it ---------- */
/* `hw` is half the width of the mouth; what is inside goes in as children */
const L36_MOUNT = 'M12 152 Q58 124 90 72 Q118 32 150 34 Q182 32 210 72 Q242 124 288 152 Z';
const L36_AROUND = 'M4 158 C40 130 62 100 82 60 C100 24 124 14 150 14 C176 14 200 24 218 60 C238 100 260 130 296 158';
function L36Mount({ k, hw = 50, top = 82, children }: { k: Ink; hw?: number; top?: number; children?: ReactNode }) {
  const mouth = `M${150 - hw} 152 V${top + 34} Q${150 - hw} ${top} 150 ${top} Q${150 + hw} ${top} ${150 + hw} ${top + 34} V152 Z`;
  return (
    <G>
      <Rect x={0} y={152} width={300} height={20} fill={k.soft} opacity={0.6} />
      <Path d={L36_MOUNT} fill={L36_ROCK} stroke={k.line} strokeWidth={1.5} strokeLinejoin="round" />
      <Path d="M150 34 Q182 32 210 72 Q242 124 288 152 L236 152 Q214 108 196 76 Z" fill={L36_ROCK_HI} opacity={0.55} />
      <Path d={mouth} fill={L36_CAVE} stroke={k.line} strokeWidth={1.2} />
      <Path d={`M${150 - hw} 152 Q150 144 ${150 + hw} 152 Z`} fill={L36_FLOOR} />
      {children}
    </G>
  );
}

/* ---------- people ---------- */
/* a small figure who is running to the right with a walking stick */
function L36Runner({ x, y, s = 1, fill }: { x: number; y: number; s?: number; fill: string }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Path d="M-1 -14 L-10 -6 L-17 -12" stroke={fill} strokeWidth={4.4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d="M-1 -14 L8 -8 L9 0" stroke={fill} strokeWidth={4.4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d="M-1 -13 L3 -26" stroke={fill} strokeWidth={9} strokeLinecap="round" />
      <Path d="M3 -24 L-5 -20 L-9 -25" stroke={fill} strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d="M3 -24 L11 -19" stroke={fill} strokeWidth={3.6} strokeLinecap="round" fill="none" />
      <Line x1={11} y1={-19} x2={16} y2={1} stroke={L36_BROWN} strokeWidth={2.2} strokeLinecap="round" />
      <Circle cx={5} cy={-35} r={6.6} fill={fill} />
    </G>
  );
}

/* a small lantern with a flame, hanging from its handle at (x, y) */
function L36Lantern({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Path d="M-4 -11 Q0 -19 4 -11" stroke={L36_BROWN} strokeWidth={1.6} fill="none" />
      <Rect x={-5} y={-11} width={10} height={14} rx={2.4} fill="#6B4A2B" />
      <Rect x={-3.4} y={-9} width={6.8} height={10} rx={1.6} fill={L36_GOLD} />
      <Path d="M0 -8 Q3 -4 0 -0.5 Q-3 -4 0 -8 Z" fill={L36_RED} opacity={0.85} />
      <Rect x={-5.6} y={3} width={11.2} height={2.4} rx={1.2} fill="#6B4A2B" />
    </G>
  );
}

/* ---------- 1. the hoard ---------- */
function L36Hoard({ k }: { k: Ink }) {
  const p = L36useGrow(350, 1400);
  return (
    <Frame label="Inside a dark cave, a dragon sleeps curled up on a huge heap of gold coins, with a cup and a small crown at its edge. The dragon cannot use any of it.">
      <L36Arch k={k}>
        <L36Glow cx={146} cy={130} r={46} p={p} clip="l36-arch-clip" />
        <L36Gold x={146} y={172} s={1.7} cup crown />
        <L36Dragon x={142} y={132} s={1.15} asleep zc={L36_CREAM} />
        {[
          [60, 166, 7, 4, 1],
          [78, 170, 7, 4, 0],
          [96, 165, 6.5, 3.8, 1],
          [196, 168, 7, 4, 0],
          [214, 164, 6.5, 3.8, 1],
          [232, 169, 7, 4, 0],
        ].map(([cx, cy, rx, ry, tone], i) => (
          <Ellipse key={i} cx={cx} cy={cy} rx={rx} ry={ry} fill={tone ? L36_GOLD2 : L36_GOLD} stroke={L36_GOLD_RIM} strokeWidth={0.9} />
        ))}
        <L36Spark x={78} y={110} r={5} opacity={0.5 + 0.4 * p} />
        <L36Spark x={228} y={104} r={4} opacity={0.4 + 0.4 * p} />
      </L36Arch>
      <L36Cap k={k} s="Gold that nobody can use" />
    </Frame>
  );
}

/* ---------- 2. the cave is never in the town ---------- */
function L36House({ x, y, w, h, roof, wall }: { x: number; y: number; w: number; h: number; roof: string; wall: string }) {
  return (
    <G>
      <Rect x={x} y={y - h} width={w} height={h} rx={2} fill={wall} />
      <Path d={`M${x - 4} ${y - h + 1} L${x + w / 2} ${y - h - w * 0.5} L${x + w + 4} ${y - h + 1} Z`} fill={roof} strokeLinejoin="round" />
      <Rect x={x + w * 0.4} y={y - h * 0.5} width={w * 0.22} height={h * 0.5} rx={2} fill={L36_BROWN} />
      <Rect x={x + w * 0.12} y={y - h * 0.72} width={w * 0.2} height={w * 0.2} rx={1.5} fill={L36_GOLD} />
    </G>
  );
}
function L36Cave({ k }: { k: Ink }) {
  const p = L36useGrow(400, 1500);
  return (
    <Frame label="A landscape. On the left, a small sunny town of three little houses. On the right, a dark mountain with a cave mouth, and a faint gold glow deep inside the cave.">
      <Circle cx={46} cy={34} r={22} fill={L36_GOLD} opacity={0.22} />
      <Circle cx={46} cy={34} r={13} fill={L36_GOLD} />
      <Rect x={0} y={150} width={300} height={22} fill={k.soft} opacity={0.6} />
      <Line x1={0} y1={150} x2={300} y2={150} stroke={k.line} strokeWidth={2} />
      <L36House x={18} y={150} w={32} h={22} roof={k.acc} wall="#EBCB94" />
      <L36House x={62} y={150} w={28} h={18} roof="#C9553F" wall="#F2DDB0" />
      <L36House x={102} y={150} w={34} h={26} roof={k.acc} wall="#E5C28A" />
      <Path
        d="M144 150 Q190 142 214 76 Q226 36 242 30 Q262 34 276 80 Q288 120 300 150 Z"
        fill={L36_ROCK}
        stroke={k.line}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <Path d="M242 30 Q262 34 276 80 Q288 120 300 150 L268 150 Q262 110 250 76 Z" fill={L36_ROCK_HI} opacity={0.55} />
      <Path d="M210 150 V134 Q210 110 232 110 Q254 110 254 134 V150 Z" fill={L36_CAVE} stroke={k.line} strokeWidth={1.2} />
      <Ellipse cx={232} cy={144} rx={11 + 5 * p} ry={7 + 3 * p} fill={L36_GOLD} opacity={0.18 + 0.12 * p} />
      <Ellipse cx={232} cy={145} rx={6 + 3 * p} ry={4 + 2 * p} fill={L36_GOLD} opacity={0.3 + 0.3 * p} />
      <L36Spark x={232} y={138} r={3 + 2 * p} opacity={0.3 + 0.5 * p} />
      <L36Cap k={k} s="The gold is never in the town" />
    </Frame>
  );
}

/* ---------- 3. out the round door ---------- */
function L36Door({ k }: { k: Ink }) {
  return (
    <Frame label="A cozy round door set in a green hill, standing open, with an armchair and a kettle visible inside. A small figure with a walking stick runs away from it along a path toward far hills.">
      <Defs>
        <ClipPath id="l36-roundroom">
          <Circle cx={92} cy={138} r={29} />
        </ClipPath>
      </Defs>
      <G transform="translate(0 -12)">
        <Circle cx={262} cy={34} r={19} fill={L36_GOLD} opacity={0.22} />
        <Circle cx={262} cy={34} r={11} fill={L36_GOLD} />
        <Ellipse cx={256} cy={154} rx={62} ry={20} fill={L36_GREEN} opacity={0.3} />
        <Ellipse cx={214} cy={158} rx={42} ry={11} fill={L36_GREEN} opacity={0.42} />
        <Path d="M-8 178 A100 108 0 0 1 192 178 Z" fill={L36_GREEN} />
        <Path d="M20 130 Q40 92 80 82 Q56 100 46 136 Z" fill={L36_WHITE} opacity={0.12} />
        <Path d="M92 168 C130 178 160 160 200 166 S262 152 296 148" stroke="#D9BC8B" strokeWidth={8} strokeLinecap="round" fill="none" />
        <Circle cx={92} cy={138} r={34} fill={L36_BROWN} />
        <Circle cx={92} cy={138} r={29} fill="#F6DEA6" />
        <G clipPath="url(#l36-roundroom)">
          <Rect x={60} y={152} width={64} height={20} fill="#D9B97A" />
          <Rect x={72} y={122} width={11} height={30} rx={5} fill="#C2603A" />
          <Rect x={72} y={141} width={28} height={13} rx={5} fill="#D2724A" />
          <Rect x={72} y={134} width={30} height={6} rx={3} fill="#C2603A" />
          <Rect x={74} y={153} width={3} height={5} fill={L36_BROWN} />
          <Rect x={96} y={153} width={3} height={5} fill={L36_BROWN} />
          <Rect x={106} y={146} width={22} height={3} rx={1.5} fill={L36_BROWN} />
          <Rect x={115} y={149} width={3} height={9} fill={L36_BROWN} />
          <Ellipse cx={116} cy={140} rx={7.5} ry={6.5} fill="#8E98AC" />
          <Path d="M122 138 Q130 134 128 130" stroke="#8E98AC" strokeWidth={2.6} strokeLinecap="round" fill="none" />
          <Path d="M109 138 Q104 130 111 130" stroke="#6F788C" strokeWidth={1.8} fill="none" />
          <Ellipse cx={116} cy={133} rx={3.4} ry={1.4} fill="#6F788C" />
          <Path d="M115 127 q-3 -4 0 -7 t0 -7" stroke={L36_WHITE} strokeWidth={1.4} strokeLinecap="round" fill="none" opacity={0.85} />
        </G>
        <Path d="M62 110 L47 101 L47 166 L62 158 Z" fill="#B8864A" stroke={L36_BROWN} strokeWidth={1.2} strokeLinejoin="round" />
        <Circle cx={52} cy={134} r={2.2} fill={L36_GOLD} />
        <Line x1={178} y1={150} x2={192} y2={150} stroke={k.muted} strokeWidth={2} strokeLinecap="round" />
        <Line x1={182} y1={158} x2={194} y2={158} stroke={k.muted} strokeWidth={2} strokeLinecap="round" />
        <L36Runner x={214} y={167} s={1.25} fill={k.ink} />
      </G>
      <L36Cap k={k} s="Out the door anyway" />
    </Frame>
  );
}

/* ---------- 4. down the dark tunnel ---------- */
const L36_TUNNEL = 'M6 30 L282 113 L282 169 L6 86 Z';
const l36Ceil = (x: number) => 30 + 0.3 * (x - 6);
function L36Tunnel({ k }: { k: Ink }) {
  const p = L36useGrow(400, 1500);
  const heat = [232, 250, 266];
  return (
    <Frame label="A long dark tunnel through rock, sloping down from the upper left to the lower right. A small figure with a lantern stands inside it, stopped, and at the far low end is a warm red and gold glow with a few wavy heat lines.">
      <Defs>
        <ClipPath id="l36-tunnel-clip">
          <Path d={L36_TUNNEL} />
        </ClipPath>
        <ClipPath id="l36-tunnel-rock">
          <Rect x={6} y={8} width={288} height={168} rx={16} />
        </ClipPath>
      </Defs>
      <Rect x={6} y={8} width={288} height={168} rx={16} fill={L36_ROCK} stroke={k.line} strokeWidth={1.5} />
      <G clipPath="url(#l36-tunnel-rock)">
        <Path d="M6 14 L294 98" stroke={L36_ROCK_HI} strokeWidth={2} opacity={0.7} fill="none" />
        <Path d="M6 44 L294 128" stroke={L36_ROCK_HI} strokeWidth={1.6} opacity={0.5} fill="none" />
        <Path d="M6 110 L294 194" stroke={L36_ROCK_HI} strokeWidth={2} opacity={0.7} fill="none" />
        <Path d="M6 134 L294 218" stroke={L36_ROCK_HI} strokeWidth={1.6} opacity={0.5} fill="none" />
        <Ellipse cx={60} cy={30} rx={12} ry={4} fill={L36_ROCK_HI} transform="rotate(-8 60 30)" />
        <Ellipse cx={170} cy={36} rx={14} ry={4} fill={L36_ROCK_HI} transform="rotate(14 170 36)" />
        <Ellipse cx={240} cy={70} rx={12} ry={4} fill={L36_ROCK_HI} transform="rotate(14 240 70)" />
        <Ellipse cx={70} cy={146} rx={14} ry={4} fill={L36_ROCK_HI} transform="rotate(14 70 146)" />
        <Ellipse cx={180} cy={168} rx={12} ry={4} fill={L36_ROCK_HI} />
      </G>
      <Path d={L36_TUNNEL} fill={L36_CAVE} />
      <G clipPath="url(#l36-tunnel-clip)">
        {[40, 74, 150, 188].map((tx, i) => {
          const c = l36Ceil(tx) - 1;
          return <Path key={tx} d={`M${tx - 5} ${c} L${tx + 5} ${c + 1.5} L${tx + 0.5} ${c + 10 + (i % 2) * 4} Z`} fill={L36_ROCK} />;
        })}
        <Path d="M6 86 L282 169" stroke={L36_ROCK_HI} strokeWidth={4} opacity={0.8} />
        <Ellipse cx={282} cy={141} rx={46 + 12 * p} ry={40 + 10 * p} fill={L36_RED} opacity={0.2 + 0.08 * p} />
        <Ellipse cx={282} cy={141} rx={30 + 8 * p} ry={26 + 7 * p} fill="#F07A2A" opacity={0.34 + 0.1 * p} />
        <Ellipse cx={282} cy={141} rx={14 + 4 * p} ry={15 + 4 * p} fill={L36_GOLD} opacity={0.85} />
        {heat.map((hx) => {
          const y0 = l36Ceil(hx) + 48;
          return (
            <Path key={hx} d={`M${hx} ${y0} q-4 -5 0 -10 t0 -10 t0 -10`} stroke={L36_GOLD} strokeWidth={1.8} strokeLinecap="round" fill="none" opacity={0.8} />
          );
        })}
        <Circle cx={118} cy={104} r={22 + 6 * p} fill={L36_GOLD} opacity={0.14} />
      </G>
      <Ellipse cx={104} cy={117} rx={15} ry={3} fill="#000000" opacity={0.4} />
      <Path d="M112 90 L123 99" stroke={L36_LIT} strokeWidth={4.6} strokeLinecap="round" />
      <Person x={104} y={116} s={0.9} fill={L36_LIT} face={L36_CAVE} />
      <L36Lantern x={125} y={103} s={0.95} />
      <L36Cap k={k} s="Afraid, and kept walking" />
    </Frame>
  );
}

/* ---------- 5. fear guards the gold ---------- */
const L36_MOUTH = 'M170 152 V112 Q170 78 224 78 Q278 78 278 112 V152 Z';
function L36Guarded({ k }: { k: Ink }) {
  const p = L36useGrow(350, 1500);
  return (
    <Frame label="On the right, a cave mouth with a heap of gold glowing inside it. A dragon lies asleep across the cave mouth, in front of the gold, blocking the way. On the left, a small person stands on the ground at a distance, facing the cave. The dragon is between the person and the gold.">
      <Defs>
        <ClipPath id="l36-mouth-clip">
          <Path d={L36_MOUTH} />
        </ClipPath>
      </Defs>
      <Rect x={0} y={152} width={300} height={20} fill={k.soft} opacity={0.6} />
      <Line x1={0} y1={152} x2={300} y2={152} stroke={k.line} strokeWidth={2} />
      <Path d="M150 152 Q154 80 196 52 Q236 28 274 52 Q298 80 298 152 Z" fill={L36_ROCK} stroke={k.line} strokeWidth={1.5} strokeLinejoin="round" />
      <Path d="M236 32 Q276 40 296 100 L298 152 L282 152 Q284 90 250 56 Z" fill={L36_ROCK_HI} opacity={0.5} />
      <Path d={L36_MOUTH} fill={L36_CAVE} stroke={k.line} strokeWidth={1.2} />
      <L36Glow cx={224} cy={124} r={32} p={p} clip="l36-mouth-clip" />
      <G clipPath="url(#l36-mouth-clip)">
        <L36Gold x={224} y={154} s={0.8} cup crown />
      </G>
      <L36Spark x={188} y={104} r={4} opacity={0.4 + 0.4 * p} />
      <L36Spark x={262} y={100} r={3.4} opacity={0.4 + 0.4 * p} />
      <L36Dragon x={206} y={164} s={0.8} asleep zc={L36_CREAM} />
      <Person x={52} y={164} s={0.8} fill={k.ink} face={k.bg} />
      <L36Cap k={k} s="Fear guards the gold" />
    </Frame>
  );
}

/* ---------- 6. the habit goes around the cave ---------- */
/* a plain word on the rock, no shape behind it */
function L36Word({ x, y, s }: { x: number; y: number; s: string }) {
  return (
    <SvgText x={x} y={y} fontSize={11} fontWeight="700" fill={L36_CREAM} textAnchor="middle" fontFamily={font.bodyBold}>
      {s}
    </SvgText>
  );
}
function L36Around({ k }: { k: Ink }) {
  return (
    <Frame label="A cave mouth in the middle of a dark mountain, with the sleeping dragon just visible inside. A dotted path curves around the outside of the mountain instead of going in, with a person walking on it. Three feelings are written around the cave mouth: Lonely, Bored and Hard day.">
      <L36Mount k={k} hw={50} top={82}>
        <L36Gold x={150} y={152} s={0.66} cup={false} crown={false} />
        <L36Dragon x={138} y={143} s={0.64} asleep zc={L36_CREAM} />
        <Path d={`M100 152 V116 Q100 82 150 82 Q200 82 200 116 V152 Z`} fill={L36_CAVE} opacity={0.42} />
      </L36Mount>
      <Path d={L36_AROUND} stroke={k.muted} strokeWidth={3.2} strokeLinecap="round" strokeDasharray="0.1 7.5" fill="none" />
      <Person x={25} y={142} s={0.52} fill={k.ink} face={k.bg} />
      <L36Word x={68} y={136} s="Lonely" />
      <L36Word x={150} y={66} s="Bored" />
      <L36Word x={234} y={136} s="Hard day" />
      <L36Cap k={k} s="The habit goes around the cave" />
    </Frame>
  );
}

/* ---------- 7. one reason stood apart ---------- */
function L36Reasons({ k }: { k: Ink }) {
  const doors: Array<{ x: number; s: string; hot?: boolean }> = [
    { x: 40, s: 'Pleasure' },
    { x: 107, s: 'Curiosity' },
    { x: 174, s: 'Boredom' },
    { x: 251, s: 'To escape', hot: true },
  ];
  return (
    <Frame label="Four doors in a row, labeled Pleasure, Curiosity, Boredom and To escape. The last door stands out in the accent color, bigger, with a small exit arrow on it.">
      <Line x1={10} y1={142} x2={290} y2={142} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      {doors.map((d) => {
        const w = d.hot ? 52 : 42;
        const h = d.hot ? 84 : 62;
        const left = d.x - w / 2;
        return (
          <G key={d.s}>
            <Path
              d={`M${left} 142 V${142 - h + w / 2} Q${left} ${142 - h} ${d.x} ${142 - h} Q${left + w} ${142 - h} ${left + w} ${142 - h + w / 2} V142 Z`}
              fill={d.hot ? k.acc : k.soft}
              stroke={d.hot ? k.acc : k.line}
              strokeWidth={2}
              strokeLinejoin="round"
            />
            {d.hot ? (
              <G>
                <Path d={`M${d.x - 13} 100 H${d.x + 8}`} stroke={L36_WHITE} strokeWidth={4.5} strokeLinecap="round" />
                <Path
                  d={`M${d.x + 2} 90 L${d.x + 14} 100 L${d.x + 2} 110`}
                  stroke={L36_WHITE}
                  strokeWidth={4.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </G>
            ) : (
              <Circle cx={left + w - 9} cy={142 - h * 0.42} r={2.6} fill={k.muted} />
            )}
            <Say x={d.x} y={160} s={d.s} fill={d.hot ? k.ink : k.muted} size={d.hot ? 12 : 11} />
          </G>
        );
      })}
      <L36Cap k={k} s="One reason stood apart" />
    </Frame>
  );
}

/* ---------- 8. the gold is in there too ---------- */
function L36Obj({ x, y, children }: { x: number; y: number; children: ReactNode }) {
  return <G transform={`translate(${x} ${y})`}>{children}</G>;
}
function L36Chair({ x, y, dir, fill }: { x: number; y: number; dir: 1 | -1; fill: string }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${dir} 1)`}>
      <Rect x={-9} y={-25} width={4.4} height={24} rx={1.8} fill={fill} />
      <Rect x={-9} y={-12.5} width={19} height={4.6} rx={1.8} fill={fill} />
      <Rect x={-8} y={-8} width={2.6} height={8} fill={fill} />
      <Rect x={6} y={-8} width={2.6} height={8} fill={fill} />
    </G>
  );
}
function L36GoldIn({ k }: { k: Ink }) {
  const p = L36useGrow(350, 1400);
  return (
    <Frame label="Inside the cave, the heap of gold, and resting on it four small clear objects: a phone with a heart, which is a call; an open book, which is work; two chairs facing each other, which is a talk; and a crescent moon on a pillow, which is rest. The dragon's tail curls at the edge.">
      <L36Arch k={k}>
        <L36Glow cx={140} cy={126} r={46} p={p} clip="l36-arch-clip" />
        <L36Gold x={140} y={172} s={1.65} cup={false} crown={false} />
        <L36Obj x={66} y={154}>
          <G transform="rotate(-7)">
            <Rect x={-10} y={-35} width={20} height={34} rx={4.5} fill="#EDEFF6" />
            <Rect x={-7.5} y={-32} width={15} height={25} rx={2.5} fill="#2C2548" />
            <Path d="M0 -14 C-7 -19.5 -5.5 -25 -1.6 -24.4 Q0 -24 0 -22.4 Q0 -24 1.6 -24.4 C5.5 -25 7 -19.5 0 -14 Z" fill="#E8556F" />
            <Circle cx={0} cy={-4} r={1.4} fill="#9AA0AE" />
            <Path d="M13 -31 Q17.5 -27 13 -22" stroke={L36_GOLD} strokeWidth={1.6} strokeLinecap="round" fill="none" />
            <Path d="M16 -34 Q23 -27 16 -19" stroke={L36_GOLD} strokeWidth={1.6} strokeLinecap="round" fill="none" opacity={0.7} />
          </G>
        </L36Obj>
        <L36Obj x={108} y={124}>
          <Rect x={-21} y={-5} width={42} height={5} rx={1.6} fill="#3F7FBF" />
          <Path d="M-19 -5 L-19 -21 Q-9.5 -26 0 -20 L0 -5 Z" fill="#F6EEDB" />
          <Path d="M19 -5 L19 -21 Q9.5 -26 0 -20 L0 -5 Z" fill="#EDE2C8" />
          <Path d="M-14 -16 H-5 M-14 -11.5 H-5 M5 -16 H14 M5 -11.5 H14" stroke="#B9A98A" strokeWidth={1.4} strokeLinecap="round" />
          <Line x1={0} y1={-20} x2={0} y2={-5} stroke="#B9A98A" strokeWidth={1.2} />
        </L36Obj>
        <L36Chair x={143} y={118} dir={1} fill="#E8A55A" />
        <L36Chair x={166} y={118} dir={-1} fill="#6FB8A6" />
        <L36Obj x={200} y={140}>
          <Rect x={-18} y={-11} width={36} height={11} rx={5.5} fill="#C9D4F5" />
          <Path d="M-12 -5.5 H12" stroke="#A9B6E0" strokeWidth={1.2} strokeLinecap="round" />
          <Path d="M5 -30 A11 11 0 1 0 5 -10 A8.6 8.6 0 1 1 5 -30 Z" fill="#FFF0A8" />
          <L36Spark x={13} y={-26} r={3.6} fill="#FFF0A8" />
        </L36Obj>
        {[
          [60, 168, 7, 4, 0],
          [80, 171, 7, 4, 1],
          [96, 166, 6.5, 3.8, 0],
          [170, 169, 7, 4, 1],
          [188, 166, 6.5, 3.8, 0],
        ].map(([cx, cy, rx, ry, tone], i) => (
          <Ellipse key={i} cx={cx} cy={cy} rx={rx} ry={ry} fill={tone ? L36_GOLD2 : L36_GOLD} stroke={L36_GOLD_RIM} strokeWidth={0.9} />
        ))}
        <L36Tail
          segs={[
            ['M276 150 C272 174 246 182 238 170', 11],
            ['M238 170 C233 162 240 154 247 158', 6],
          ]}
          tip={[248, 158, 40]}
        />
        <L36Spark x={150} y={92} r={5} opacity={0.5 + 0.4 * p} />
      </L36Arch>
      <L36Cap k={k} s="The gold is in there too" />
    </Frame>
  );
}

/* ---------- 9. the dragon keeps the gold ---------- */
function L36Keeps({ k }: { k: Ink }) {
  return (
    <Frame label="A dotted path goes around the outside of the cave, with a person walking away from it to the right. Inside the cave, the dragon rests on its gold with one eye half open.">
      <L36Mount k={k} hw={58} top={76}>
        <L36Gold x={150} y={152} s={0.8} cup crown />
        <L36Dragon x={142} y={142} s={0.76} asleep={false} eye="half" />
        <L36Spark x={192} y={118} r={3.6} fill={L36_GOLD} opacity={0.8} />
      </L36Mount>
      <Path d={L36_AROUND} stroke={k.muted} strokeWidth={3.2} strokeLinecap="round" strokeDasharray="0.1 7.5" fill="none" />
      <Person x={272} y={141} s={0.52} fill={k.ink} />
      <L36Cap k={k} s="The dragon keeps the gold" />
    </Frame>
  );
}

/* ---------- 10. a few steps in ---------- */
function L36Steps({ k }: { k: Ink }) {
  const p = L36useGrow(350, 1500);
  return (
    <Frame label="A person stands a few steps inside the cave mouth, holding a small lantern in one hand and one gold cup in the other, with warm light around them. Far back in the dark, the dragon sleeps on its heap of gold.">
      <L36Arch k={k}>
        <L36Gold x={204} y={128} s={0.5} cup={false} crown={false} />
        <L36Dragon x={200} y={118} s={0.5} asleep zc={L36_CREAM} />
        <Path d="M26 176 V90 A124 66 0 0 1 274 90 V176 Z" fill={L36_CAVE} opacity={0.3} />
        <L36Glow cx={100} cy={122} r={40} p={p} clip="l36-arch-clip" />
        <Ellipse cx={96} cy={172} rx={30} ry={5} fill="#000000" opacity={0.3} />
        <Path d="M78 134 L62 140" stroke={L36_LIT} strokeWidth={6} strokeLinecap="round" />
        <Path d="M114 134 L128 120" stroke={L36_LIT} strokeWidth={6} strokeLinecap="round" />
        <Person x={96} y={172} s={1.4} fill={L36_LIT} face={L36_CAVE} />
        <L36Cup x={56} y={142} s={1.2} rot={-8} />
        <L36Lantern x={130} y={118} />
        <L36Spark x={150} y={96} r={4} fill={L36_GOLD} opacity={0.4 + 0.4 * p} />
      </L36Arch>
      <L36Cap k={k} s="A few steps in" />
    </Frame>
  );
}

export const SCENES_G36: Record<string, ComponentType<{ k: Ink }>> = {
  'l36-hoard': L36Hoard,
  'l36-cave': L36Cave,
  'l36-door': L36Door,
  'l36-tunnel': L36Tunnel,
  'l36-guarded': L36Guarded,
  'l36-around': L36Around,
  'l36-reasons': L36Reasons,
  'l36-gold': L36GoldIn,
  'l36-keeps': L36Keeps,
  'l36-steps': L36Steps,
};
