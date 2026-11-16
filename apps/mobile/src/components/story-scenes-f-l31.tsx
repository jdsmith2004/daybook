/* Scenes for lesson 31, told as a story (see story-kit.tsx and story-scenes-f.tsx): the parable of the lost son (Luke 15), from the leaving to the
   road home, the run to meet him, the robe and the ring, and then the same truth in today's terms. The son always wears the same earth-brown robe
   (ragged after he leaves) and the father the same deep blue one with a gray beard; every figure carries a dark outline so it reads on a dark card
   and on a cream one alike. */
import { type ComponentType, useEffect, useState } from 'react';
import { Easing } from 'react-native';
import { Circle, ClipPath, Defs, Ellipse, G, Line, Path, Rect } from 'react-native-svg';

import { useAppear, useReducedMotion } from '@/lib/motion';

import { BEAR_LINE, Frame, type Ink, Say } from './story-kit';

const SON = '#8A5A2B';
const SON_PATCH = '#B88A55';
const FATHER = '#2F4A9E';
const FATHER_SASH = '#6E86DA';
const BEARD = '#C9CDD8';
const CLOTH = '#F3E7C9';
const HAIR = '#3A2A20';
const SKIN = '#E7B98F';
const GOLD = '#FFD25A';
const GOLD_D = '#C98F1A';
const CREAM = '#FFF5E1';
const WOOD = '#B07A45';
const WOOD_D = '#5E3A1A';
const EDGE = '#8A6A3A';
const SKY = '#F7D9A2';
const SAND = '#D2A86A';
const ROAD = '#EFD7A6';
const WALL = '#F1DDB4';
const ROOF = '#C9A266';
const GRAY = '#8E96AB';
const PLUM = '#7A4FA0';
const GREEN = '#2F7A5B';
const FINE = '#E5405A';

/* the line of words under a picture */
function Cap({ k, s }: { k: Ink; s: string }) {
  return <Say x={150} y={190} s={s} fill={k.ink} />;
}

/* ---------- shared drawings ---------- */

/* thick rounded strokes with one outline around the whole shape: every outline first, then every fill, so inner joins stay clean */
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
function Hand({ x, y, r = 4.5 }: { x: number; y: number; r?: number }) {
  return <Circle cx={x} cy={y} r={r} fill={SKIN} stroke={BEAR_LINE} strokeWidth={1.3} />;
}

/* the sky and the ground under it */
function Stage({ sky, ground, y }: { sky: string; ground: string; y: number }) {
  return (
    <G>
      <Rect x={10} y={10} width={280} height={162} rx={12} fill={sky} />
      <Path d={`M10 ${y} L290 ${y} L290 160 Q290 172 278 172 L22 172 Q10 172 10 160 Z`} fill={ground} />
    </G>
  );
}

/* the younger son, standing on (x, y): earth-brown robe, dark hair, a round skin head. Ragged robes have a torn hem and a patch; a bag hangs from the
   shoulder; a cloak is the fine robe laid over his shoulders. bow lowers his head. */
function Son({
  x,
  y,
  s = 1,
  rot = 0,
  ragged = true,
  bow = 0,
  bag = false,
  cloak = false,
}: {
  x: number;
  y: number;
  s?: number;
  rot?: number;
  ragged?: boolean;
  bow?: number;
  bag?: boolean;
  cloak?: boolean;
}) {
  const sw = 1.5 / s;
  return (
    <G transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <Path
        d={
          ragged
            ? `M-13 -3 L-9 -33 Q-9 -42 0 -42 Q9 -42 9 -33 L13 -1 L9 -5 L6 0 L2 -4 L-2 1 L-6 -5 L-10 0 Z`
            : 'M-13 0 L-9 -33 Q-9 -42 0 -42 Q9 -42 9 -33 L13 0 Z'
        }
        fill={SON}
        stroke={BEAR_LINE}
        strokeWidth={sw}
        strokeLinejoin="round"
      />
      <Path d="M-10 -22 L10 -22" stroke={BEAR_LINE} strokeWidth={2.2 / 1} strokeLinecap="round" opacity={0.55} />
      {ragged ? <Path d="M-6 -17 L2 -18 L1 -9 L-7 -10 Z" fill={SON_PATCH} stroke={BEAR_LINE} strokeWidth={0.9} strokeLinejoin="round" /> : null}
      {bag ? (
        <G>
          <Path d="M7 -39 Q-4 -30 -8 -22" stroke={BEAR_LINE} strokeWidth={2} fill="none" strokeLinecap="round" />
          <Path
            d="M-14 -16 Q-22 -26 -12 -34 Q-6 -37 -2 -33 Q4 -24 -4 -15 Q-9 -12 -14 -16 Z"
            fill="#C9A86A"
            stroke={BEAR_LINE}
            strokeWidth={sw}
            strokeLinejoin="round"
          />
          <Path d="M-11 -33 L-5 -32" stroke={BEAR_LINE} strokeWidth={1.6} strokeLinecap="round" />
          <Circle cx={-9} cy={-38} r={4} fill={GOLD} stroke={BEAR_LINE} strokeWidth={1} />
          <Circle cx={-3} cy={-37} r={3} fill={GOLD} stroke={BEAR_LINE} strokeWidth={1} />
          <Circle cx={-9} cy={-24} r={3} fill={GOLD} stroke={GOLD_D} strokeWidth={0.9} />
        </G>
      ) : null}
      {cloak ? (
        <G>
          <Path d="M-13 -39 Q0 -47 13 -39 L21 -9 Q0 -3 -21 -9 Z" fill={FINE} stroke={BEAR_LINE} strokeWidth={sw} strokeLinejoin="round" />
          <Path d="M-12 -38 Q0 -45 12 -38" stroke={GOLD} strokeWidth={2.4} fill="none" strokeLinecap="round" />
          <Path d="M-20 -11 Q0 -5 20 -11" stroke={GOLD} strokeWidth={2.4} fill="none" strokeLinecap="round" />
          <Path d="M-6 -30 L-8 -12 M6 -30 L8 -12" stroke="#B8283F" strokeWidth={1.4} strokeLinecap="round" />
        </G>
      ) : null}
      <G transform={`translate(${bow * 0.6} ${bow})`}>
        <Circle cx={0} cy={-49} r={8.5} fill={SKIN} stroke={BEAR_LINE} strokeWidth={sw} />
        <Path d="M-8.6 -50 Q-8.4 -59 0 -59 Q8.6 -58.6 8.6 -50 Q4 -54 0 -53.5 Q-5 -54 -8.6 -50 Z" fill={HAIR} />
      </G>
    </G>
  );
}

/* the father, standing on (x, y): deep blue robe, a pale head cloth, a gray beard. flip turns him to face the other way; run leans him and flies his robe. */
function Father({
  x,
  y,
  s = 1,
  rot = 0,
  flip = false,
  run = false,
  arms = 'down',
}: {
  x: number;
  y: number;
  s?: number;
  rot?: number;
  flip?: boolean;
  run?: boolean;
  arms?: 'down' | 'open';
}) {
  const sw = 1.5 / s;
  return (
    <G transform={`translate(${x} ${y}) rotate(${rot}) scale(${flip ? -s : s} ${s})`}>
      {run ? (
        <Path
          d="M-8 -34 Q-24 -30 -34 -10 Q-27 -13 -26 -6 Q-19 -11 -15 -3 Q-12 -4 -13 0 Z"
          fill={FATHER}
          stroke={BEAR_LINE}
          strokeWidth={sw}
          strokeLinejoin="round"
        />
      ) : null}
      <Path d="M-14 0 L-9 -33 Q-9 -42 0 -42 Q9 -42 9 -33 L14 0 Z" fill={FATHER} stroke={BEAR_LINE} strokeWidth={sw} strokeLinejoin="round" />
      <Path d="M-11.5 -21 L11.5 -21" stroke={FATHER_SASH} strokeWidth={3.4} strokeLinecap="round" />
      {arms === 'open' ? (
        <G>
          <Tube fill={FATHER} parts={[['M-8 -35 Q-20 -38 -29 -50', 6]]} />
          <Tube fill={FATHER} parts={[['M8 -35 Q20 -38 29 -50', 6]]} />
          <Hand x={-30} y={-51} r={3.8} />
          <Hand x={30} y={-51} r={3.8} />
        </G>
      ) : (
        <G>
          <Tube fill={FATHER} parts={[['M-9 -34 L-12 -16', 5]]} />
          <Tube fill={FATHER} parts={[['M9 -34 L12 -16', 5]]} />
          <Hand x={-12} y={-14} r={3.4} />
          <Hand x={12} y={-14} r={3.4} />
        </G>
      )}
      <Circle cx={0} cy={-49} r={8.5} fill={SKIN} stroke={BEAR_LINE} strokeWidth={sw} />
      <Path
        d="M-6.8 -46 Q-7.5 -37 0 -35.5 Q7.5 -37 6.8 -46 Q3 -42 0 -42 Q-3 -42 -6.8 -46 Z"
        fill={BEARD}
        stroke={BEAR_LINE}
        strokeWidth={sw * 0.7}
        strokeLinejoin="round"
      />
      <Path
        d="M-9.6 -50 Q-9.4 -60 0 -60 Q9.4 -60 9.6 -50 L9.4 -47 Q4 -54 0 -54 Q-4 -54 -9.4 -47 Z"
        fill={CLOTH}
        stroke={BEAR_LINE}
        strokeWidth={sw * 0.8}
        strokeLinejoin="round"
      />
    </G>
  );
}

/* a flat-roofed farmhouse with its base on y */
function House({ x, y, w, h, door, window = true }: { x: number; y: number; w: number; h: number; door?: [number, number]; window?: boolean }) {
  return (
    <G>
      <Rect x={x} y={y - h} width={w} height={h} fill={WALL} stroke={EDGE} strokeWidth={1.5} strokeLinejoin="round" />
      <Rect x={x - 3} y={y - h - 6} width={w + 6} height={7} rx={1.5} fill={ROOF} stroke={EDGE} strokeWidth={1.5} />
      {window ? <Rect x={x + w * 0.66} y={y - h * 0.7} width={w * 0.16} height={h * 0.24} rx={1.5} fill={WOOD_D} /> : null}
      {door ? (
        <Path
          d={`M${door[0]} ${y} L${door[0]} ${y - door[1] + 8} Q${door[0]} ${y - door[1]} ${door[0] + 10} ${y - door[1]} L${door[0] + 14} ${y - door[1]} Q${door[0] + 24} ${y - door[1]} ${door[0] + 24} ${y - door[1] + 8} L${door[0] + 24} ${y} Z`}
          fill={WOOD_D}
        />
      ) : null}
    </G>
  );
}

/* an olive tree with its base on y */
function Olive({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Path
        d="M-3 0 Q-8 -14 -2 -22 Q-9 -30 -12 -38 M-2 -22 Q4 -30 9 -40"
        stroke={BEAR_LINE}
        strokeWidth={9}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Path
        d="M-3 0 Q-8 -14 -2 -22 Q-9 -30 -12 -38 M-2 -22 Q4 -30 9 -40"
        stroke="#8C6A45"
        strokeWidth={6}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Ellipse cx={-14} cy={-46} rx={17} ry={11} fill="#7C9460" stroke={BEAR_LINE} strokeWidth={1.3} />
      <Ellipse cx={12} cy={-48} rx={18} ry={11} fill="#7C9460" stroke={BEAR_LINE} strokeWidth={1.3} />
      <Ellipse cx={-1} cy={-58} rx={19} ry={11} fill="#97AE76" stroke={BEAR_LINE} strokeWidth={1.3} />
    </G>
  );
}

/* a loaf of bread */
function Loaf({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Ellipse cx={0} cy={0} rx={11} ry={6.5} fill="#E0A85C" stroke={BEAR_LINE} strokeWidth={1.3} />
      <Path d="M-5 -3 L-3 2 M0 -4 L2 3 M5 -3 L7 2" stroke={WOOD_D} strokeWidth={1.2} strokeLinecap="round" opacity={0.7} />
    </G>
  );
}

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

/* the road that climbs from the bottom left to the hilltop house (scenes 3 and 4) */
function LongRoad({ k }: { k: Ink }) {
  return (
    <G>
      <Stage sky={SKY} ground={SAND} y={118} />
      <Circle cx={72} cy={46} r={22} fill={GOLD} opacity={0.35} />
      <Circle cx={72} cy={46} r={13} fill={GOLD} />
      <Path d="M130 118 Q176 84 232 62 Q268 58 290 72 L290 118 Z" fill="#E4B982" />
      <Path d="M20 172 C90 160 60 130 150 122 C220 116 190 82 232 66 L240 66 C202 86 230 122 156 130 C102 136 134 162 80 172 Z" fill={ROAD} />
      <House x={222} y={62} w={22} h={13} />
      <Rect x={232} y={52} width={5} height={7} rx={1} fill={GOLD_D} />
      <Rect x={233} y={53} width={3} height={5} fill="#FFF1B8" />
    </G>
  );
}

/* ---------- 1. he took his share and left ---------- */
function Leaving({ k }: { k: Ink }) {
  return (
    <Frame label="A flat-roofed farmhouse with an olive tree beside it. The father stands at the open door in a deep blue robe and gray beard. Down the road, the younger son walks away toward far hills with a full bag of coins over his shoulder">
      <Stage sky={SKY} ground={SAND} y={118} />
      <Circle cx={246} cy={46} r={26} fill={GOLD} opacity={0.35} />
      <Circle cx={246} cy={46} r={15} fill={GOLD} />
      <Path d="M168 118 Q212 80 258 96 Q276 102 290 110 L290 118 Z" fill="#DDB07A" />
      <Path d="M206 118 Q244 94 290 104 L290 118 Z" fill="#E8C28E" />
      <Path d="M52 152 C100 156 150 150 196 134 C222 126 240 122 258 119 L266 120 C248 126 232 132 214 140 C176 158 112 168 70 166 Z" fill={ROAD} />
      <Olive x={128} y={140} />
      <House x={20} y={150} w={88} h={58} door={[46, 36]} />
      <Father x={90} y={158} s={0.95} />
      <Son x={206} y={140} s={0.82} rot={3} bag />
      <Cap k={k} s="He took his share and left" />
    </Frame>
  );
}

/* ---------- 2. no one gave him anything ---------- */
function Pig({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`} stroke={BEAR_LINE} strokeWidth={1.4 / s} strokeLinejoin="round">
      <Rect x={-12} y={-8} width={5.5} height={9} rx={2} fill="#E09390" />
      <Rect x={6} y={-8} width={5.5} height={9} rx={2} fill="#E09390" />
      <Path d="M-17 -17 q-7 -1 -5 -8 q2 -3 4 0" fill="none" />
      <Ellipse cx={0} cy={-14} rx={18} ry={11.5} fill="#EBA6A3" />
      <Path d="M10 -22 L15 -30 L19 -21 Z" fill="#E09390" />
      <Circle cx={18} cy={-10} r={8.5} fill="#EBA6A3" />
      <Ellipse cx={26} cy={-6} rx={4.8} ry={3.8} fill="#E09390" />
      <Circle cx={22} cy={-14} r={1.3} fill={BEAR_LINE} stroke="none" />
    </G>
  );
}

function Pigs({ k }: { k: Ink }) {
  return (
    <Frame label="A dry famine-struck field of cracked brown ground and one bare tree. The ragged son sits by a fence holding an empty bowl while three pigs eat from a trough nearby">
      <Stage sky="#EAD2A6" ground="#BE9462" y={104} />
      <Path d="M10 104 Q70 90 130 100 Q200 90 290 102 L290 104 L10 104 Z" fill="#D6B07A" />
      <G stroke="#8A6236" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.85}>
        <Path d="M28 140 L42 146 L50 160 M42 146 L58 144" />
        <Path d="M120 150 L134 156 L146 150 L156 162 M134 156 L136 168" />
        <Path d="M168 118 L180 124 L176 134 M180 124 L194 122" />
        <Path d="M236 116 L248 122 L262 118 M248 122 L252 132" />
        <Path d="M16 118 L30 122 L36 114" />
        <Path d="M276 140 L284 150" />
      </G>
      <Path
        d="M150 104 C150 92 148 76 152 56 M152 80 L134 62 M152 70 L170 52 M151 92 L168 82 M153 60 L148 44 M135 64 L126 58 M169 54 L178 50"
        stroke={BEAR_LINE}
        strokeWidth={7}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M150 104 C150 92 148 76 152 56 M152 80 L134 62 M152 70 L170 52 M151 92 L168 82 M153 60 L148 44 M135 64 L126 58 M169 54 L178 50"
        stroke={WOOD_D}
        strokeWidth={4}
        strokeLinecap="round"
        fill="none"
      />
      <G>
        {[20, 62, 104, 146, 188, 230, 270].map((x) => (
          <Rect key={x} x={x - 3} y={100} width={6} height={38} rx={2} fill={WOOD} stroke={BEAR_LINE} strokeWidth={1.3} />
        ))}
        <Rect x={14} y={108} width={272} height={5} rx={2} fill={WOOD} stroke={BEAR_LINE} strokeWidth={1.3} />
        <Rect x={14} y={121} width={272} height={5} rx={2} fill={WOOD} stroke={BEAR_LINE} strokeWidth={1.3} />
      </G>
      {/* the son, sitting, head bowed */}
      <Path
        d="M40 156 L46 124 Q50 104 66 102 Q82 102 88 118 L96 140 Q98 150 94 156 L90 153 L86 157 L80 153 L74 158 L68 154 L62 158 L55 154 L48 158 Z"
        fill={SON}
        stroke={BEAR_LINE}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <Path d="M52 138 L62 136 L61 146 L51 148 Z" fill={SON_PATCH} stroke={BEAR_LINE} strokeWidth={0.9} strokeLinejoin="round" />
      <Ellipse cx={100} cy={156} rx={6} ry={2.6} fill={SKIN} stroke={BEAR_LINE} strokeWidth={1.2} />
      <Circle cx={72} cy={92} r={9.5} fill={SKIN} stroke={BEAR_LINE} strokeWidth={1.5} />
      <Path d="M62 90 Q62 80 72 80 Q82 81 82 91 Q78 85 72 85 Q66 85 62 90 Z" fill={HAIR} />
      <Tube fill={SON} parts={[['M74 110 Q94 118 100 136', 8]]} />
      <Path d="M88 136 L112 136 Q110 150 100 150 Q90 150 88 136 Z" fill={WOOD} stroke={BEAR_LINE} strokeWidth={1.5} strokeLinejoin="round" />
      <Ellipse cx={100} cy={136} rx={12} ry={3.4} fill="#3B2412" stroke={BEAR_LINE} strokeWidth={1.3} />
      <Hand x={102} y={150} r={4} />
      {/* the trough and the pigs */}
      <Pig x={192} y={152} s={0.9} />
      <Pig x={226} y={152} s={0.9} />
      <Pig x={260} y={152} s={0.9} />
      <Path d="M180 148 L286 148 L280 164 L186 164 Z" fill={WOOD} stroke={BEAR_LINE} strokeWidth={1.5} strokeLinejoin="round" />
      <Path d="M182 152 L284 152" stroke="#7A5330" strokeWidth={3} strokeLinecap="round" />
      <Rect x={190} y={164} width={6} height={7} fill={WOOD_D} />
      <Rect x={270} y={164} width={6} height={7} fill={WOOD_D} />
      <Cap k={k} s="No one gave him anything" />
    </Frame>
  );
}

/* ---------- 3. a speech, rehearsed on the road ---------- */
function Road({ k }: { k: Ink }) {
  return (
    <Frame label="A long road winding from the bottom left up toward a tiny house on a far hill. The ragged son walks along it, small, head down, with a small speech bubble above his head holding a few short lines">
      <LongRoad k={k} />
      <Son x={96} y={150} s={0.78} bow={3} />
      <Rect x={88} y={64} width={48} height={26} rx={9} fill={CREAM} stroke={BEAR_LINE} strokeWidth={1.5} />
      <Path d="M96 89 L96 100 L108 89 Z" fill={CREAM} stroke={BEAR_LINE} strokeWidth={1.5} strokeLinejoin="round" />
      <Path d="M97 91 L107 90" stroke={CREAM} strokeWidth={3} />
      <Path d="M97 72 L125 72 M97 78 L119 78 M97 84 L112 84" stroke={EDGE} strokeWidth={2.4} strokeLinecap="round" />
      <Cap k={k} s="A speech, rehearsed on the road" />
    </Frame>
  );
}

/* ---------- 4. while he was still far off ---------- */
function Runs({ k }: { k: Ink }) {
  const p = useRun(500, 1700);
  const e = 1 - (1 - p) * (1 - p);
  const fx = 205 + (146 - 205) * e;
  const fy = 99 + (128 - 99) * e + (p > 0 && p < 1 ? -Math.abs(Math.sin(p * 22)) * 1.6 : 0);
  const fs = 0.52 + 0.16 * e;
  return (
    <Frame label="The same long road. The son is still far off and small at the left. The father, from the house on the hill, runs down the road toward him with arms open wide and his robe flying">
      <LongRoad k={k} />
      <Son x={58} y={165} s={0.56} bow={2} />
      <G opacity={0.55 * Math.min(1, p * 4) * (1 - Math.max(0, (p - 0.9) * 10))}>
        <Path
          d={`M${fx + 24 * fs} ${fy - 12 * fs} l12 -2 M${fx + 26 * fs} ${fy - 24 * fs} l16 -2 M${fx + 24 * fs} ${fy - 36 * fs} l12 -2`}
          stroke={EDGE}
          strokeWidth={2}
          strokeLinecap="round"
        />
      </G>
      <Father x={fx} y={fy} s={fs} rot={-9} flip run arms="open" />
      <Cap k={k} s="While he was still far off" />
    </Frame>
  );
}

/* ---------- 5. lost, and found ---------- */
function RobeRing({ k }: { k: Ink }) {
  return (
    <Frame label="Joyful close scene. The father in his deep blue robe wraps a bright fine red robe around the ragged son's shoulders and slips a gold ring onto his hand. A servant behind them holds a pair of sandals, and a table at the back holds loaves of bread">
      <Rect x={10} y={10} width={280} height={162} rx={12} fill={SKY} />
      <Path d="M10 150 L290 150 L290 160 Q290 172 278 172 L22 172 Q10 172 10 160 Z" fill={SAND} />
      <Circle cx={150} cy={96} r={76} fill={GOLD} opacity={0.22} />
      {/* the table and bread at the back */}
      <Rect x={232} y={122} width={52} height={7} rx={2} fill={WOOD} stroke={BEAR_LINE} strokeWidth={1.4} />
      <Rect x={238} y={129} width={5} height={30} fill={WOOD_D} />
      <Rect x={274} y={129} width={5} height={30} fill={WOOD_D} />
      <Loaf x={248} y={116} />
      <Loaf x={270} y={116} />
      <Loaf x={259} y={106} s={0.9} />
      {/* the servant with the sandals */}
      <Path d="M30 170 L35 132 Q36 118 48 118 Q62 118 62 132 L66 170 Z" fill={GREEN} stroke={BEAR_LINE} strokeWidth={1.5} strokeLinejoin="round" />
      <Path d="M36 150 L60 150" stroke="#8FD4B2" strokeWidth={3} strokeLinecap="round" />
      <Circle cx={48} cy={106} r={10} fill={SKIN} stroke={BEAR_LINE} strokeWidth={1.5} />
      <Path d="M38 104 Q38 94 48 94 Q58 94 58 104 Q54 99 48 99 Q42 99 38 104 Z" fill={HAIR} />
      <Tube fill={GREEN} parts={[['M56 128 Q70 136 80 128', 6]]} />
      <G transform="translate(80 124) rotate(-12)">
        <Ellipse cx={-8} cy={0} rx={9} ry={4} fill="#C99A5B" stroke={BEAR_LINE} strokeWidth={1.2} />
        <Ellipse cx={8} cy={-1} rx={9} ry={4} fill="#C99A5B" stroke={BEAR_LINE} strokeWidth={1.2} />
        <Path d="M-12 -2 L-8 -6 L-4 -2 M4 -3 L8 -7 L12 -3" stroke={WOOD_D} strokeWidth={1.6} strokeLinecap="round" fill="none" />
      </G>
      <Hand x={80} y={129} r={3.6} />
      {/* the son in the fine robe, and the father */}
      <Son x={118} y={170} s={1.8} cloak />
      <Father x={206} y={170} s={1.85} rot={-4} />
      <Tube fill={FATHER} parts={[['M188 108 Q168 114 142 113', 9]]} />
      <Hand x={138} y={113} r={5.5} />
      <Tube fill={SON} parts={[['M138 124 Q152 132 164 129', 8]]} />
      <Tube fill={FATHER} parts={[['M192 124 Q184 134 176 134', 9]]} />
      <Hand x={172} y={133} r={5.5} />
      <Hand x={164} y={129} r={5} />
      <Circle cx={166} cy={128} r={15} fill={GOLD} opacity={0.4} />
      <Circle cx={165} cy={127} r={4} fill="none" stroke={GOLD} strokeWidth={2.8} />
      <Path
        d="M92 50 l0 8 M88 54 l8 0 M236 46 l0 8 M232 50 l8 0 M166 28 l0 6 M163 31 l6 0 M170 104 l0 5 M167 106 l6 0 M180 120 l4 -3 M182 134 l5 1"
        stroke={GOLD_D}
        strokeWidth={2.2}
        strokeLinecap="round"
      />
      <Cap k={k} s="Lost, and found" />
    </Frame>
  );
}

/* ---------- 6. there is no roadblock ---------- */
function Car({ x, y, rot = 0, c }: { x: number; y: number; rot?: number; c: string }) {
  return (
    <G transform={`translate(${x} ${y}) rotate(${rot})`}>
      <Rect x={-17} y={-8} width={34} height={16} rx={5} fill={c} stroke={BEAR_LINE} strokeWidth={1.4} />
      <Rect x={-7} y={-6} width={12} height={12} rx={2.5} fill="#DCE6F5" stroke={BEAR_LINE} strokeWidth={1} />
      <Rect x={12} y={-6} width={3} height={4} rx={1} fill={GOLD} />
      <Rect x={12} y={2} width={3} height={4} rx={1} fill={GOLD} />
    </G>
  );
}

function Roadblock({ k }: { k: Ink }) {
  return (
    <Frame label="Seen from a high window, whose dark edge frames the left side: a modern street below with a red-and-white striped barrier across it. A police officer waves a car back, and a short line of cars has already turned around">
      <Rect x={10} y={10} width={280} height={162} rx={12} fill="#C9D6EA" />
      <Rect x={10} y={10} width={280} height={50} rx={12} fill="#9FB2D3" />
      <Rect x={10} y={40} width={280} height={20} fill="#9FB2D3" />
      {[22, 62, 100, 150, 196, 244].map((x, i) => (
        <Rect
          key={x}
          x={x}
          y={i % 2 ? 24 : 18}
          width={i % 2 ? 34 : 30}
          height={i % 2 ? 36 : 42}
          fill={i % 2 ? '#B5C4DE' : '#C0CCE2'}
          stroke="#8294B8"
          strokeWidth={1.2}
        />
      ))}
      <Rect x={10} y={60} width={280} height={8} fill="#D8DEE8" />
      <Rect x={10} y={68} width={280} height={82} fill="#575E73" />
      <Path d="M16 109 L284 109" stroke="#E8DFA8" strokeWidth={2.4} strokeDasharray="12 9" />
      <Path d="M10 150 L290 150 L290 160 Q290 172 278 172 L22 172 Q10 172 10 160 Z" fill="#D8DEE8" />
      <Line x1={10} y1={150} x2={290} y2={150} stroke="#9AA3B8" strokeWidth={2} />
      {/* the cars: two already heading back the way they came, one turning */}
      <Car x={70} y={88} rot={180} c="#D6485B" />
      <Car x={112} y={88} rot={180} c="#3FA6A0" />
      <Car x={176} y={128} rot={-148} c="#F0B93A" />
      <Path d="M206 130 Q226 112 214 94" stroke={CREAM} strokeWidth={2.6} strokeLinecap="round" strokeDasharray="1 6" fill="none" opacity={0.85} />
      {/* the barrier */}
      <Rect x={229} y={74} width={6} height={64} fill="#E8EDF7" stroke={BEAR_LINE} strokeWidth={1.2} />
      <Rect x={226} y={74} width={12} height={4} fill={BEAR_LINE} />
      {[78, 90, 102, 114, 126].map((y, i) => (
        <Path key={y} d={`M229 ${y} L235 ${y + 6} L235 ${y + 12} L229 ${y + 6} Z`} fill={i % 2 ? '#E8EDF7' : '#D8372F'} />
      ))}
      <Path d="M229 138 L235 138 L238 146 L226 146 Z" fill={BEAR_LINE} />
      {/* the officer */}
      <G>
        <Path d="M246 148 L249 120 Q250 112 258 112 Q266 112 267 120 L270 148 Z" fill="#1F2F5C" stroke={BEAR_LINE} strokeWidth={1.4} strokeLinejoin="round" />
        <Path d="M252 122 L264 122" stroke={GOLD} strokeWidth={2} strokeLinecap="round" />
        <Circle cx={258} cy={104} r={7.5} fill={SKIN} stroke={BEAR_LINE} strokeWidth={1.4} />
        <Path d="M249 102 Q250 92 258 92 Q266 92 267 102 Z" fill="#1F2F5C" stroke={BEAR_LINE} strokeWidth={1.2} strokeLinejoin="round" />
        <Rect x={248} y={101} width={20} height={3} rx={1.5} fill={BEAR_LINE} />
        <Tube fill="#1F2F5C" parts={[['M250 118 Q224 118 210 104', 6]]} />
        <Hand x={208} y={102} r={4.2} />
      </G>
      {/* the window's edge, on the left */}
      <Rect x={10} y={10} width={26} height={162} rx={4} fill={WOOD_D} stroke={BEAR_LINE} strokeWidth={1.5} />
      <Rect x={30} y={10} width={6} height={162} fill={WOOD} />
      <Rect x={14} y={78} width={8} height={18} rx={2} fill={GOLD} stroke={BEAR_LINE} strokeWidth={1.2} />
      <Cap k={k} s="There is no roadblock" />
    </Frame>
  );
}

/* ---------- 7. return, and be met ---------- */
function TwoRoads({ k }: { k: Ink }) {
  const p = useRun(400, 1800);
  const lx = 262 - 40 * p;
  return (
    <Frame label="One road with two ends. On the left a person turns to walk toward the light. From the right a soft warm light, with no face, moves down the road to meet them">
      <Stage sky={SKY} ground={SAND} y={112} />
      <Path d="M14 112 Q60 98 108 106 Q150 98 200 110 L290 112 Z" fill="#E4B982" />
      <Path d="M10 146 C70 140 120 126 200 118 L290 114 L290 120 C210 130 130 156 60 172 L22 172 Q10 172 10 160 Z" fill={ROAD} />
      <Ellipse cx={lx - 40} cy={132} rx={64} ry={9} fill={GOLD} opacity={0.3} />
      <Circle cx={lx} cy={112} r={34} fill={GOLD} opacity={0.18} />
      <Circle cx={lx} cy={112} r={23} fill={GOLD} opacity={0.3} />
      <Circle cx={lx} cy={112} r={13} fill="#FFF1B8" />
      <Path d={`M${lx - 22} 122 L${lx - 62} 128`} stroke={GOLD_D} strokeWidth={3.6} strokeLinecap="round" strokeDasharray="1 8" fill="none" />
      <Path d={`M${lx - 24} 114 L${lx - 70} 120`} stroke={GOLD} strokeWidth={3.2} strokeLinecap="round" strokeDasharray="1 8" fill="none" opacity={0.7} />
      {/* the person on the left, leaning toward the light with one hand out */}
      <G transform="translate(70 150) rotate(5) scale(1.1)">
        <Path d="M-13 0 L-9 -33 Q-9 -42 0 -42 Q9 -42 9 -33 L13 0 Z" fill={PLUM} stroke={BEAR_LINE} strokeWidth={1.4} strokeLinejoin="round" />
        <Path d="M-10 -22 L10 -22" stroke={BEAR_LINE} strokeWidth={2.2} strokeLinecap="round" opacity={0.55} />
        <Circle cx={2} cy={-49} r={8.5} fill={SKIN} stroke={BEAR_LINE} strokeWidth={1.4} />
        <Path d="M-6.4 -50 Q-6 -59 2 -59 Q10.5 -58.6 10.5 -50 Q6 -54 2 -53.5 Q-3 -54 -6.4 -50 Z" fill={HAIR} />
        <Tube fill={PLUM} parts={[['M6 -34 Q16 -34 22 -40', 6]]} />
        <Hand x={23} y={-41} r={3.8} />
      </G>
      <Cap k={k} s="Return, and be met" />
    </Frame>
  );
}

/* ---------- 8. turning to God for strength ---------- */
function ReachUp({ k }: { k: Ink }) {
  const cloud = '#8D97B3';
  return (
    <Frame label="A person stands in soft rain with one hand reaching up toward a warm break in the clouds. Golden light falls down from the opening onto them">
      <Defs>
        <ClipPath id="l31-reach-clip">
          <Rect x={10} y={10} width={280} height={162} rx={12} />
        </ClipPath>
      </Defs>
      <Rect x={10} y={10} width={280} height={162} rx={12} fill="#A9B3CC" />
      <G clipPath="url(#l31-reach-clip)">
        <Path d="M10 150 L290 150 L290 160 Q290 172 278 172 L22 172 Q10 172 10 160 Z" fill="#8F9BB6" />
        <Ellipse cx={176} cy={34} rx={46} ry={20} fill="#FFE29A" />
        <Ellipse cx={176} cy={36} rx={28} ry={11} fill="#FFF1B8" />
        <Path d="M150 44 L204 44 L246 172 L100 172 Z" fill="#FFE9A8" opacity={0.4} />
        <G fill={cloud} stroke="#6F7BA0" strokeWidth={1.4}>
          <Circle cx={30} cy={34} r={26} />
          <Circle cx={66} cy={26} r={28} />
          <Circle cx={108} cy={30} r={26} />
          <Circle cx={134} cy={22} r={20} />
          <Circle cx={222} cy={24} r={22} />
          <Circle cx={252} cy={32} r={26} />
          <Circle cx={284} cy={26} r={22} />
          <Circle cx={18} cy={14} r={12} />
        </G>
      </G>
      <G stroke="#6F7BA0" strokeWidth={1.8} strokeLinecap="round" opacity={0.85}>
        {[
          [26, 72],
          [48, 96],
          [70, 70],
          [86, 112],
          [104, 90],
          [24, 128],
          [58, 140],
          [42, 112],
          [214, 78],
          [238, 100],
          [260, 76],
          [276, 114],
          [226, 130],
          [254, 142],
          [200, 106],
        ].map(([x, y]) => (
          <Line key={`${x}-${y}`} x1={x} y1={y} x2={x - 4} y2={y + 12} />
        ))}
      </G>
      <G stroke="#C5B27A" strokeWidth={1.6} strokeLinecap="round" opacity={0.9}>
        {[
          [142, 72],
          [166, 96],
          [186, 70],
          [206, 112],
          [132, 124],
        ].map(([x, y]) => (
          <Line key={`${x}-${y}`} x1={x} y1={y} x2={x - 3} y2={y + 10} />
        ))}
      </G>
      <G transform="translate(164 168) scale(1.7)">
        <Path d="M-13 0 L-9 -33 Q-9 -42 0 -42 Q9 -42 9 -33 L13 0 Z" fill={PLUM} stroke={BEAR_LINE} strokeWidth={0.9} strokeLinejoin="round" />
        <Path d="M-10 -22 L10 -22" stroke={BEAR_LINE} strokeWidth={1.4} strokeLinecap="round" opacity={0.55} />
        <Tube fill={PLUM} parts={[['M-8 -34 L-12 -15', 5]]} />
        <Hand x={-12} y={-13} r={3.4} />
        <Tube fill={PLUM} parts={[['M8 -36 Q16 -48 16 -62', 5]]} />
        <Hand x={16} y={-64} r={3.8} />
        <Circle cx={0} cy={-50} r={8.5} fill={SKIN} stroke={BEAR_LINE} strokeWidth={0.9} />
        <Path d="M-8.6 -51 Q-8.4 -60 0 -60 Q8.6 -59.6 8.6 -51 Q4 -55 0 -54.5 Q-5 -55 -8.6 -51 Z" fill={HAIR} />
      </G>
      <Cap k={k} s="Turning to God for strength" />
    </Frame>
  );
}

/* ---------- 9. come home as you are ---------- */
function HomeFar({ k }: { k: Ink }) {
  return (
    <Frame label="At golden dusk the ragged son walks up the road toward a warm house. Its door stands open with light spilling out, and the father, in his deep blue robe, waits in the doorway">
      <Stage sky="#F2B66B" ground="#D9A862" y={120} />
      <Circle cx={46} cy={92} r={30} fill={GOLD} opacity={0.35} />
      <Circle cx={46} cy={92} r={17} fill="#FFE29A" />
      <Path d="M10 120 Q60 100 110 112 Q140 106 170 118 L170 120 Z" fill="#E0A05C" />
      <Path d="M206 142 L230 142 L266 172 L150 172 Z" fill="#FFE29A" opacity={0.5} />
      <Path d="M20 172 C70 160 120 150 196 140 L230 140 L228 146 C170 156 120 168 84 172 Z" fill={ROAD} />
      <Olive x={262} y={132} s={0.9} />
      <House x={176} y={142} w={80} h={76} window={false} />
      <Path d="M206 142 L206 112 Q206 98 218 98 Q230 98 230 112 L230 142 Z" fill="#FFF1B8" stroke={EDGE} strokeWidth={1.5} />
      <Rect x={242} y={92} width={10} height={14} rx={1.5} fill="#FFE29A" stroke={EDGE} strokeWidth={1.2} />
      <Father x={218} y={142} s={0.95} arms="open" />
      <Son x={104} y={162} s={1.3} rot={3} bow={-1} />
      <Cap k={k} s="Come home as you are" />
    </Frame>
  );
}

export const SCENES_L31: Record<string, ComponentType<{ k: Ink }>> = {
  'l22-leaving': Leaving,
  'l22-pigs': Pigs,
  'l22-road': Road,
  'l22-runs': Runs,
  'l22-robe-ring': RobeRing,
  'l22-roadblock': Roadblock,
  'l22-two-roads': TwoRoads,
  'l22-reach-up': ReachUp,
  'l22-home-far': HomeFar,
};
