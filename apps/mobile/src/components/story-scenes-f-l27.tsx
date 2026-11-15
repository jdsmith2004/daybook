/* Scenes for lesson 27, told as a story (see story-kit.tsx and story-scenes-f.tsx): the 2014 trial that followed people for a year after
   treatment, the map that works for six months, and the noticing that is still working when the ground turns out to be new. */
import { useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { Easing } from 'react-native';
import { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';

import { useAppear, useReducedMotion } from '@/lib/motion';

import { BEAR_LINE, Frame, type Ink, Person, Say } from './story-kit';

const BROWN = '#8A5A2B';
const WOOD = '#B07A45';
const GOLD = '#FFD25A';
const WHITE = '#FFFFFF';
const GREEN = '#3F8F5B';
const LEAF = '#6FB07A';
const GRASS = '#78B070';
const GRASS_D = '#5E9C6A';
const PAPER = '#FFF3D6';
const PAPER_D = '#E9D8AE';
const TERRA = '#C9694A';
const NAVY = '#3E4E6B';
const WAVE = '#4F9FD1';
const WAVE_L = '#9ED8FF';
const WAVE_D = '#2B5E8C';
const DIRT = '#C9A878';
const STONE = '#CFC6B8';
const SKY = '#CFE8F5';
const SHADOW = '#2A2438';

/* the line of words under a picture */
function Cap({ k, s }: { k: Ink; s: string }) {
  return <Say x={150} y={190} s={s} fill={k.ink} />;
}

/* a number from 0 to 1 that eases up once, after a short pause; with Reduce Motion on it starts at 1 */
function useGrow(delay = 300, dur = 1000) {
  const still = useReducedMotion();
  const v = useAppear(delay, dur, Easing.out(Easing.cubic));
  const [p, setP] = useState(still ? 1 : 0);
  useEffect(() => {
    const id = v.addListener(({ value }) => setP(value));
    return () => v.removeListener(id);
  }, [v]);
  return p;
}

/* ---------- shared drawings ---------- */

/* a limb: a soft round-ended stroke */
function Arm({ d, c, w = 6 }: { d: string; c: string; w?: number }) {
  return <Path d={d} stroke={c} strokeWidth={w} strokeLinecap="round" fill="none" />;
}

/* a folded paper map, 40 wide, centered on (x, y). Whole: a dotted route that curves around a dark pit to a red cross. Torn: crumpled,
   creased, a piece missing, the route breaking off. */
function MapSheet({ x, y, s = 1, rot = 0, torn }: { x: number; y: number; s?: number; rot?: number; torn?: boolean }) {
  return (
    <G transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      {torn ? (
        <G>
          <Path
            d="M-20 -11 L-13 -15 L-7 -9 L1 -15 L8 -10 L15 -14 L20 -9 L16 -2 L21 5 L13 8 L18 14 L6 10 L-2 15 L-8 9 L-19 14 L-15 3 Z"
            fill={PAPER_D}
            stroke={BEAR_LINE}
            strokeWidth={1.4}
            strokeLinejoin="round"
          />
          <Path d="M-12 -13 L-4 8 M6 -12 L10 11 M-18 2 L17 -3" stroke="#BFA97A" strokeWidth={1.2} strokeLinecap="round" fill="none" />
          <Path d="M-14 9 Q-9 3 -5 5" stroke={NAVY} strokeWidth={1.6} strokeLinecap="round" strokeDasharray="0.1 3.2" fill="none" />
          <Path d="M5 -4 Q9 -8 13 -6" stroke={NAVY} strokeWidth={1.6} strokeLinecap="round" strokeDasharray="0.1 3.2" fill="none" />
          <G transform="translate(27 17) rotate(24)">
            <Path d="M-5 -3 L3 -6 L7 0 L1 5 L-4 3 Z" fill={PAPER_D} stroke={BEAR_LINE} strokeWidth={1.2} strokeLinejoin="round" />
          </G>
        </G>
      ) : (
        <G>
          <Path d="M-20 -12 L-7 -14 L7 -12 L20 -14 L20 12 L7 14 L-7 12 L-20 14 Z" fill={PAPER} stroke={BEAR_LINE} strokeWidth={1.4} strokeLinejoin="round" />
          <Path d="M-7 -14 L-7 12 M7 -12 L7 14" stroke="#D9C9A0" strokeWidth={1.1} fill="none" />
          <Circle cx={1} cy={-2} r={3.8} fill={SHADOW} />
          <Path d="M-16 8 C-8 14 -2 12 4 10 C10 8 13 3 15 -6" stroke={NAVY} strokeWidth={1.8} strokeLinecap="round" strokeDasharray="0.1 3.3" fill="none" />
          <Path d="M12 -11 L18 -5 M18 -11 L12 -5" stroke="#D9473A" strokeWidth={2} strokeLinecap="round" fill="none" />
        </G>
      )}
    </G>
  );
}

/* a wave, unit 100 wide and 100 tall, standing on (bx, by): it rises on one side and its crest curls over toward the other. flip curls it
   to the left. A paler wave stands behind it. */
function Wave({ bx, by, w, h, flip, still }: { bx: number; by: number; w: number; h: number; flip?: boolean; still?: boolean }) {
  const body = 'M0 0 C0 -30 10 -62 40 -80 C58 -91 80 -92 92 -78 C80 -80 68 -72 66 -58 C64 -40 78 -18 100 0 Z';
  return (
    <G transform={`translate(${bx} ${by}) scale(${flip ? -w / 100 : w / 100} ${h / 100})`}>
      <G transform="translate(16 0) scale(0.88 0.84)" opacity={0.9}>
        <Path d={body} fill={WAVE_L} stroke={WAVE_D} strokeWidth={1.8} strokeLinejoin="round" />
      </G>
      <Path d={body} fill={WAVE} stroke={WAVE_D} strokeWidth={1.8} strokeLinejoin="round" />
      <Path d="M13 -8 C13 -34 22 -56 42 -70" stroke={WAVE_L} strokeWidth={3.4} strokeLinecap="round" opacity={0.85} fill="none" />
      {still ? null : (
        <G fill={WHITE}>
          <Circle cx={88} cy={-84} r={3.2} />
          <Circle cx={95} cy={-76} r={2.2} />
          <Circle cx={80} cy={-90} r={2} />
        </G>
      )}
    </G>
  );
}

/* a person holding a map open in front of them; the map faces us */
function Holder({ x, y, s, fill, face, torn }: { x: number; y: number; s: number; fill: string; face: string; torn?: boolean }) {
  return (
    <G>
      <Person x={x} y={y} s={s} fill={fill} face={face} />
      <MapSheet x={x} y={y - 23 * s} s={s * 0.88} torn={torn} />
      <Circle cx={x - 20 * s} cy={y - 17 * s} r={4 * s} fill={fill} />
      <Circle cx={x + 20 * s} cy={y - 17 * s} r={4 * s} fill={fill} />
    </G>
  );
}

/* ---------- back to ordinary life ---------- */
function OutDoor({ k }: { k: Ink }) {
  return (
    <Frame label="A person steps out through the open door of a plain clinic building, with a small sign above the door, into a sunny street with a sidewalk, a curb and a tree. They carry a small bag">
      <Circle cx={262} cy={32} r={12} fill={GOLD} />
      <G stroke={GOLD} strokeWidth={3} strokeLinecap="round">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
          <Line
            key={a}
            x1={262 + 18 * Math.cos((a * Math.PI) / 180)}
            y1={32 + 18 * Math.sin((a * Math.PI) / 180)}
            x2={262 + 24 * Math.cos((a * Math.PI) / 180)}
            y2={32 + 24 * Math.sin((a * Math.PI) / 180)}
          />
        ))}
      </G>

      <Rect x={12} y={46} width={130} height={106} rx={3} fill="#EFD9BE" stroke={BEAR_LINE} strokeWidth={1.6} />
      <Rect x={8} y={38} width={138} height={10} rx={3} fill={TERRA} stroke={BEAR_LINE} strokeWidth={1.4} />
      <Rect x={30} y={80} width={38} height={32} rx={2} fill={SKY} stroke={BROWN} strokeWidth={3} />
      <Line x1={49} y1={80} x2={49} y2={112} stroke={BROWN} strokeWidth={2.5} />
      <Line x1={30} y1={96} x2={68} y2={96} stroke={BROWN} strokeWidth={2.5} />
      <Rect x={84} y={90} width={34} height={62} fill="#3A2A40" />
      <Path d="M118 90 L138 96 L138 150 L118 152 Z" fill={BROWN} stroke={BEAR_LINE} strokeWidth={1.5} strokeLinejoin="round" />
      <Rect x={84} y={90} width={34} height={62} fill="none" stroke={BROWN} strokeWidth={3} />
      <Rect x={82} y={58} width={38} height={22} rx={4} fill={WHITE} stroke={BEAR_LINE} strokeWidth={1.6} />
      <Path d="M101 63 V75 M95 69 H107" stroke={GREEN} strokeWidth={4} strokeLinecap="round" />

      <Rect x={228} y={96} width={12} height={56} fill={BROWN} />
      <Circle cx={234} cy={80} r={25} fill={GREEN} />
      <Circle cx={216} cy={94} r={16} fill={GREEN} />
      <Circle cx={252} cy={94} r={16} fill={GREEN} />
      <Circle cx={230} cy={72} r={10} fill={LEAF} />

      <Rect x={10} y={150} width={280} height={10} rx={2} fill={STONE} />
      <Rect x={10} y={160} width={280} height={5} fill="#9C9486" />
      <Rect x={10} y={165} width={280} height={7} rx={3} fill="#6B6F80" />
      <Path d="M30 169 H52 M96 169 H118 M162 169 H184 M228 169 H250" stroke={WHITE} strokeWidth={2} strokeLinecap="round" opacity={0.8} />

      <Arm d="M156 126 Q150 136 150 144" c={k.acc} w={6} />
      <Person x={172} y={156} s={1.2} fill={k.acc} face={k.bg} />
      <Arm d="M192 126 Q200 134 200 143" c={k.acc} w={6} />
      <Rect x={192} y={143} width={16} height={13} rx={3} fill={TERRA} stroke={BEAR_LINE} strokeWidth={1.3} />
      <Path d="M196 143 Q200 136 204 143" stroke={BROWN} strokeWidth={1.8} strokeLinecap="round" fill="none" />
      <Cap k={k} s="Back to ordinary life" />
    </Frame>
  );
}

/* ---------- three kinds of help ---------- */
function Chair({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Rect x={-6} y={-8} width={2.4} height={8} fill={BROWN} />
      <Rect x={3.6} y={-8} width={2.4} height={8} fill={BROWN} />
      <Rect x={-6.5} y={-21} width={13} height={9} rx={2.5} fill={WOOD} stroke={BEAR_LINE} strokeWidth={1.1} />
      <Rect x={-8} y={-12} width={16} height={5} rx={2} fill={WOOD} stroke={BEAR_LINE} strokeWidth={1.1} />
    </G>
  );
}

function ThreeHelps({ k }: { k: Ink }) {
  const wave = (dy: number, o: number) => (
    <G transform={`translate(0 ${dy})`} opacity={o}>
      <Wave bx={262} by={158} w={32} h={40} still />
    </G>
  );
  return (
    <Frame label="Three people stand side by side on one ground line. The left one stands beside a small ring of chairs, for a support group. The middle one holds an open map. The right one holds the same map and stands calm, with a small wave rising and falling beside them">
      <Line x1={14} y1={158} x2={286} y2={158} stroke={k.line} strokeWidth={3} strokeLinecap="round" />

      <Chair x={26} y={142} s={0.85} />
      <Chair x={50} y={142} s={0.85} />
      <Chair x={12} y={150} s={1.05} />
      <Chair x={64} y={150} s={1.05} />
      <Chair x={24} y={160} s={1.25} />
      <Chair x={52} y={160} s={1.25} />
      <Person x={100} y={158} s={1.4} fill={k.ink} face={k.bg} />

      <Holder x={166} y={158} s={1.4} fill={k.ink} face={k.bg} />

      <Holder x={226} y={158} s={1.4} fill={k.acc} face={k.bg} />
      {wave(14, 0.28)}
      {wave(-10, 0.4)}
      <Wave bx={262} by={158} w={32} h={40} still />
      <Cap k={k} s="Three kinds of help" />
    </Frame>
  );
}

/* ---------- six months: the plan works ---------- */
function MapWorks({ k }: { k: Ink }) {
  return (
    <Frame label="A person walks along a dotted path holding an open map. The path curves neatly around a dark pit in the ground and runs on, clear, to a small flag in the distance">
      <Path d="M10 98 L290 98 L290 158 Q290 172 276 172 L24 172 Q10 172 10 158 Z" fill={GRASS} />
      <Path d="M10 98 L290 98 L290 106 L10 106 Z" fill={GRASS_D} />
      <Rect x={10} y={98} width={280} height={74} rx={14} fill="none" stroke={k.line} strokeWidth={2} />
      <Line x1={264} y1={108} x2={264} y2={72} stroke={BROWN} strokeWidth={3} strokeLinecap="round" />
      <Path d="M265 72 L289 79 L265 88 Z" fill={GOLD} stroke={BEAR_LINE} strokeWidth={1.3} strokeLinejoin="round" />
      <Ellipse cx={184} cy={128} rx={36} ry={12} fill="#6B4423" />
      <Ellipse cx={184} cy={129} rx={29} ry={8.5} fill="#120D1C" />
      <Path
        d="M82 160 C120 172 186 172 220 148 C236 136 250 122 262 110"
        stroke="#FFF5E1"
        strokeWidth={4}
        strokeLinecap="round"
        strokeDasharray="0.1 9"
        fill="none"
      />
      <Arm d="M60 112 Q46 126 44 138" c={k.acc} w={7} />
      <Person x={64} y={156} s={1.4} fill={k.acc} face={k.bg} />
      <MapSheet x={114} y={110} s={1.5} rot={-8} />
      <Arm d="M84 116 Q96 130 106 126" c={k.acc} w={7} />
      <Circle cx={106} cy={126} r={4.6} fill={k.acc} />
      <Cap k={k} s="Six months: the plan works" />
    </Frame>
  );
}

/* ---------- a year on ---------- */
function YearOn({ k }: { k: Ink }) {
  return (
    <Frame label="Two people on uneven ground a year later, with a hill, a puddle and a new building. The left one has stopped, holding a crumpled, torn map and scratching their head, unsure. The right one walks on steadily with no map, arms loose">
      <Path d="M92 152 Q112 94 160 90 Q202 90 228 152 Z" fill="#7FA678" stroke={GRASS_D} strokeWidth={1.4} />
      <Rect x={250} y={84} width={36} height={68} rx={2} fill="#D8C6A8" stroke={BEAR_LINE} strokeWidth={1.5} />
      <Rect x={246} y={78} width={44} height={8} rx={2} fill={GOLD} stroke={BEAR_LINE} strokeWidth={1.3} />
      {[96, 114, 132].map((y) => (
        <G key={y}>
          <Rect x={256} y={y} width={10} height={10} rx={1.5} fill={SKY} stroke={BROWN} strokeWidth={1.5} />
          <Rect x={272} y={y} width={10} height={10} rx={1.5} fill={SKY} stroke={BROWN} strokeWidth={1.5} />
        </G>
      ))}
      <Path d="M10 152 Q48 148 80 152 Q112 156 150 152 Q190 148 226 152 Q262 156 290 152 L290 164 Q290 172 278 172 L22 172 Q10 172 10 164 Z" fill={GRASS_D} />
      <Ellipse cx={148} cy={163} rx={25} ry={5} fill={SKY} stroke={WAVE} strokeWidth={1.4} />
      <Path d="M136 162 Q148 160 158 162" stroke={WHITE} strokeWidth={1.6} strokeLinecap="round" fill="none" />

      <G transform="rotate(-5 56 152)">
        <Arm d="M40 122 Q30 108 45 98" c={k.ink} w={6} />
        <Person x={56} y={152} s={1.15} fill={k.ink} face={k.bg} />
        <MapSheet x={90} y={122} s={1.15} rot={14} torn />
        <Arm d="M73 124 Q80 132 86 128" c={k.ink} w={6} />
        <Circle cx={86} cy={128} r={3.8} fill={k.ink} />
      </G>
      <Path d="M40 68 q8 -14 16 -4 q8 10 -2 14 q-12 4 -8 -8 q6 -10 16 -2" stroke={k.muted} strokeWidth={2.2} strokeLinecap="round" fill="none" />

      <G transform="rotate(4 222 152)">
        <Arm d="M202 122 Q194 134 196 146" c={k.acc} w={6} />
        <Person x={222} y={152} s={1.15} fill={k.acc} face={k.bg} />
        <Arm d="M242 122 Q250 134 248 146" c={k.acc} w={6} />
      </G>
      <Path d="M186 142 H176 M184 150 H170" stroke={k.acc} strokeWidth={2.2} strokeLinecap="round" opacity={0.5} />
      <Cap k={k} s="A year on: noticing holds" />
    </Frame>
  );
}

/* ---------- the moment nobody planned ---------- */
function SideWave({ k }: { k: Ink }) {
  const p = useGrow(300, 1100);
  const px = 122;
  const py = 162;
  return (
    <Frame label="A person stands on a dirt path, planted, a map hanging in one hand, the path and a small flag stretching away behind them. A big wave rises from the side, where the map does not reach, and the person turns calmly to face it">
      <Path d="M10 150 L290 150 L290 166 Q290 170 284 170 L16 170 Q10 170 10 166 Z" fill={DIRT} />
      <Path d="M30 160 H250" stroke="#FFF5E1" strokeWidth={3.4} strokeLinecap="round" strokeDasharray="0.1 8" fill="none" />
      <Line x1={30} y1={150} x2={30} y2={118} stroke={BROWN} strokeWidth={2.6} strokeLinecap="round" />
      <Path d="M31 118 L53 124 L31 131 Z" fill={GOLD} stroke={BEAR_LINE} strokeWidth={1.3} strokeLinejoin="round" />

      <Wave bx={290} by={156} w={112 * (0.7 + 0.3 * p)} h={104 * (0.35 + 0.65 * p)} flip />

      <MapSheet x={px - 46} y={py - 24} s={0.95} rot={-14} />
      <Arm d={`M${px - 19} ${py - 32} Q${px - 28} ${py - 26} ${px - 30} ${py - 20}`} c={k.acc} w={6} />
      <Circle cx={px - 30} cy={py - 20} r={3.8} fill={k.acc} />
      <Ellipse cx={px - 11} cy={py - 1} rx={11} ry={4} fill={k.acc} />
      <Ellipse cx={px + 14} cy={py - 1} rx={11} ry={4} fill={k.acc} />
      <Person x={px} y={py - 2} s={1.2} fill={k.acc} face={k.bg} />
      <Arm d={`M${px + 19} ${py - 34} Q${px + 32} ${py - 32} ${px + 38} ${py - 38}`} c={k.acc} w={6} />
      <Circle cx={px + 39} cy={py - 39} r={4} fill={k.acc} />
      <Cap k={k} s="The moment nobody planned" />
    </Frame>
  );
}

/* ---------- stop, breathe, widen, choose ---------- */
function Breathe({ k }: { k: Ink }) {
  const p = useGrow(200, 1200);
  const x = 150;
  const y = 152;
  const s = 1.3;
  const cx = x;
  const cy = y - 18 * s;
  const a = (r: number, left: boolean, o: number) => {
    const dx = r * Math.cos(0.52);
    const dy = r * Math.sin(0.52);
    return left ? (
      <Path
        key={`l${r}`}
        d={`M${cx - dx} ${cy - dy} A${r} ${r} 0 0 0 ${cx - dx} ${cy + dy}`}
        stroke={k.acc}
        strokeWidth={3}
        strokeLinecap="round"
        opacity={o}
        fill="none"
      />
    ) : (
      <Path
        key={`r${r}`}
        d={`M${cx + dx} ${cy - dy} A${r} ${r} 0 0 1 ${cx + dx} ${cy + dy}`}
        stroke={k.acc}
        strokeWidth={3}
        strokeLinecap="round"
        opacity={o}
        fill="none"
      />
    );
  };
  return (
    <Frame label="A person stands still with their eyes closed, soft breath arcs going out and in from their chest. A wide, faint circle around them takes in the room: a lamp, a window and a chair at its edges">
      <Circle cx={150} cy={94} r={74 * (0.7 + 0.3 * p)} fill={k.acc} opacity={0.12 * p} />
      <Circle cx={150} cy={94} r={74 * (0.7 + 0.3 * p)} fill="none" stroke={k.acc} strokeWidth={2.4} opacity={0.5 * p} />

      <Rect x={196} y={40} width={30} height={34} rx={2} fill={SKY} stroke={BROWN} strokeWidth={3} />
      <Line x1={211} y1={40} x2={211} y2={74} stroke={BROWN} strokeWidth={2.2} />
      <Line x1={196} y1={57} x2={226} y2={57} stroke={BROWN} strokeWidth={2.2} />
      <Rect x={92.5} y={92} width={3} height={58} fill={BROWN} />
      <Rect x={84} y={148} width={20} height={4} rx={2} fill={BROWN} />
      <Path d="M82 92 L108 92 L101 72 L89 72 Z" fill={GOLD} stroke={BROWN} strokeWidth={1.6} strokeLinejoin="round" />
      <Rect x={202} y={134} width={26} height={5} rx={2} fill={WOOD} stroke={BEAR_LINE} strokeWidth={1.1} />
      <Rect x={223} y={108} width={5} height={28} rx={2} fill={WOOD} stroke={BEAR_LINE} strokeWidth={1.1} />
      <Rect x={204} y={139} width={3} height={13} fill={BROWN} />
      <Rect x={223} y={139} width={3} height={13} fill={BROWN} />

      <Line x1={14} y1={152} x2={286} y2={152} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      {a(28, true, 0.3)}
      {a(37, true, 0.55)}
      {a(46, true, 0.85)}
      {a(28, false, 0.85)}
      {a(37, false, 0.55)}
      {a(46, false, 0.3)}
      <Person x={x} y={y} s={s} fill={k.acc} />
      <Path
        d={`M${x + 1.5 * s} ${y - 48 * s} Q${x + 4.5 * s} ${y - 45 * s} ${x + 8 * s} ${y - 48 * s}`}
        stroke={k.bg}
        strokeWidth={1.8}
        strokeLinecap="round"
        fill="none"
      />
      <Cap k={k} s="Stop, breathe, widen, choose" />
    </Frame>
  );
}

/* ---------- a pause, then a choice ---------- */
function Pause({ k }: { k: Ink }) {
  const p = useGrow(300, 1100);
  const px = 138;
  const py = 152;
  const ps = 1.25;
  return (
    <Frame label="In a plain room, an urge shown as a tall wave stands behind a person, and a door stands in front of them. Between the person and the door is a clear open gap on the floor, marked with a pause sign of two vertical bars. The person stands in the gap, choosing">
      <Rect x={10} y={10} width={280} height={156} rx={14} fill="#F2E3C6" />
      <Path d="M10 134 H290 V152 Q290 166 276 166 H24 Q10 166 10 152 Z" fill="#D9B58A" />
      <Rect x={10} y={130} width={280} height={5} fill="#C29C6E" />
      <Rect x={10} y={10} width={280} height={156} rx={14} fill="none" stroke={k.line} strokeWidth={2} />

      <Ellipse cx={194} cy={150} rx={42} ry={8} fill={GOLD} opacity={0.32} />
      <Rect x={228} y={62} width={42} height={74} rx={2} fill={BROWN} />
      <Rect x={232} y={66} width={34} height={70} fill={TERRA} stroke={BEAR_LINE} strokeWidth={1.2} />
      <Rect x={238} y={74} width={22} height={24} rx={2} fill="none" stroke="#A8523A" strokeWidth={1.8} />
      <Rect x={238} y={104} width={22} height={24} rx={2} fill="none" stroke="#A8523A" strokeWidth={1.8} />
      <Circle cx={260} cy={102} r={2.8} fill={GOLD} stroke={BEAR_LINE} strokeWidth={1} />

      <G transform="translate(194 150) scale(1 0.7)">
        <Rect x={-10} y={-13} width={6.5} height={26} rx={2} fill={k.acc} stroke={BEAR_LINE} strokeWidth={1.2} />
        <Rect x={3.5} y={-13} width={6.5} height={26} rx={2} fill={k.acc} stroke={BEAR_LINE} strokeWidth={1.2} />
      </G>

      <Wave bx={14} by={158} w={104 * (0.75 + 0.25 * p)} h={112 * (0.4 + 0.6 * p)} />
      <Arm d={`M${px - 22} ${py - 34} Q${px - 30} ${py - 22} ${px - 26} ${py - 12}`} c={k.acc} w={6} />
      <Person x={px} y={py} s={ps} fill={k.acc} face={k.bg} />
      <Arm d={`M${px + 22} ${py - 34} Q${px + 36} ${py - 36} ${px + 44} ${py - 28}`} c={k.acc} w={6} />
      <Circle cx={px + 45} cy={py - 27} r={4.2} fill={k.acc} />
      <Cap k={k} s="A pause, then a choice" />
    </Frame>
  );
}

export const SCENES_L27: Record<string, ComponentType<{ k: Ink }>> = {
  'l22-out-door': OutDoor,
  'l22-three-helps': ThreeHelps,
  'l22-map': MapWorks,
  'l22-year-on': YearOn,
  'l22-side-wave': SideWave,
  'l22-breathe': Breathe,
  'l22-pause': Pause,
};
