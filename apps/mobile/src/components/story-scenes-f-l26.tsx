/* Scenes for lesson 26, told as a story (see story-kit.tsx and story-scenes-f.tsx): Project MATCH, three very different roads that went
   about as far, the road a person keeps walking, and SMART Recovery as another road with its own tools. */
import { type ComponentType, type ReactNode } from 'react';
import { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';

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
const TEAL = '#5E9C9A';
const ROSE = '#E58FA0';
const WAVE = '#4F9FD1';
const WAVE_L = '#9ED8FF';
const DIRT = '#C9A878';
const DIRT_D = '#A8825A';
const STONE = '#CFC6B8';
const SKY = '#CFE8F5';
const ASPHALT = '#6B6F80';
const STEEL = '#8E96AB';
const FACE = '#FFF3D6';
const SCRIBBLE = '#8A7A66';

/* the line of words under a picture */
function Cap({ k, s }: { k: Ink; s: string }) {
  return <Say x={150} y={190} s={s} fill={k.ink} />;
}

/* a chair from the front, standing on (x, y) */
function Chair({ x, y, s = 1, fill = WOOD }: { x: number; y: number; s?: number; fill?: string }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`} stroke={BEAR_LINE} strokeWidth={1.1}>
      <Rect x={-5} y={-3} width={2.2} height={8} fill={BROWN} />
      <Rect x={2.8} y={-3} width={2.2} height={8} fill={BROWN} />
      <Rect x={-5.5} y={-17} width={11} height={11} rx={2} fill={fill} />
      <Rect x={-7} y={-7} width={14} height={4.5} rx={2} fill={fill} />
    </G>
  );
}
/* a chair from the side, standing on (x, y); dir 1 faces right, -1 faces left */
function ChairSide({ x, y, s = 1, dir, fill = WOOD }: { x: number; y: number; s?: number; dir: 1 | -1; fill?: string }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${dir * -s} ${s})`} stroke={BEAR_LINE} strokeWidth={1.1}>
      <Rect x={-6} y={-3} width={2.4} height={8} fill={BROWN} />
      <Rect x={3.6} y={-3} width={2.4} height={8} fill={BROWN} />
      <Rect x={-7} y={-17} width={3.2} height={15} rx={1.4} fill={fill} />
      <Rect x={-7} y={-7} width={14} height={4} rx={2} fill={fill} />
    </G>
  );
}

/* a point on a cubic curve, and the angle it runs at */
type Pt = [number, number];
function bez(p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number) {
  const u = 1 - t;
  const x = u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0];
  const y = u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1];
  const dx = 3 * u * u * (p1[0] - p0[0]) + 6 * u * t * (p2[0] - p1[0]) + 3 * t * t * (p3[0] - p2[0]);
  const dy = 3 * u * u * (p1[1] - p0[1]) + 6 * u * t * (p2[1] - p1[1]) + 3 * t * t * (p3[1] - p2[1]);
  return { x, y, a: (Math.atan2(dy, dx) * 180) / Math.PI };
}

/* a small flat stepping stone, centered on (x, y) */
function Stone({ x, y, rx, fill = STONE }: { x: number; y: number; rx: number; fill?: string }) {
  const ry = rx * 0.38;
  return (
    <G>
      <Ellipse cx={x} cy={y + ry * 0.5} rx={rx} ry={ry} fill={BEAR_LINE} opacity={0.35} />
      <Ellipse cx={x} cy={y} rx={rx} ry={ry} fill={fill} stroke={BEAR_LINE} strokeWidth={1.1} />
    </G>
  );
}

/* a limb: a soft round-ended stroke */
function Arm({ d, c, w = 6 }: { d: string; c: string; w?: number }) {
  return <Path d={d} stroke={c} strokeWidth={w} strokeLinecap="round" fill="none" />;
}

/* ---------- 1: Project MATCH ---------- */
function Match({ k }: { k: Ink }) {
  const queue: { x: number; s: number; c: string }[] = [
    { x: 24, s: 0.66, c: NAVY },
    { x: 48, s: 0.54, c: TERRA },
    { x: 72, s: 0.7, c: TEAL },
    { x: 96, s: 0.58, c: '#7A5BA8' },
  ];
  const doors: { x: number; c: string }[] = [
    { x: 70, c: TERRA },
    { x: 150, c: TEAL },
    { x: 230, c: '#D9A441' },
  ];
  const sorted: { x: number; y: number; c: string }[] = [
    { x: 78, y: 124, c: NAVY },
    { x: 142, y: 120, c: '#7A5BA8' },
    { x: 226, y: 124, c: TERRA },
  ];
  return (
    <Frame label="A researcher sits behind a long table with a clipboard, sorting a queue of different-looking people toward three doors. Over the first door is a toolbox, over the second two chairs facing each other, over the third a ring of chairs">
      <Rect x={10} y={10} width={280} height={156} rx={14} fill="#F2E3C6" />
      <Path d="M10 106 H290 V152 Q290 166 276 166 H24 Q10 166 10 152 Z" fill="#D9B58A" />
      <Rect x={10} y={102} width={280} height={5} fill="#C29C6E" />
      <Rect x={10} y={10} width={280} height={156} rx={14} fill="none" stroke={k.line} strokeWidth={2} />

      {doors.map((d) => (
        <G key={d.x}>
          <Rect x={d.x - 20} y={58} width={40} height={48} rx={2} fill={BROWN} />
          <Rect x={d.x - 16} y={62} width={32} height={44} fill={d.c} stroke={BEAR_LINE} strokeWidth={1.2} />
          <Rect x={d.x - 11} y={68} width={22} height={14} rx={2} fill="none" stroke={BEAR_LINE} strokeWidth={1.2} opacity={0.35} />
          <Circle cx={d.x + 10} cy={90} r={2.4} fill={GOLD} stroke={BEAR_LINE} strokeWidth={1} />
        </G>
      ))}

      {/* over the first door: a toolbox */}
      <G>
        <Path d="M64 36 V31 Q64 28 67 28 H73 Q76 28 76 31 V36" stroke={BEAR_LINE} strokeWidth={2} fill="none" strokeLinecap="round" />
        <Rect x={56} y={35} width={28} height={17} rx={3} fill="#D9473A" stroke={BEAR_LINE} strokeWidth={1.3} />
        <Rect x={56} y={41} width={28} height={3} fill={BEAR_LINE} opacity={0.35} />
        <Rect x={67} y={39} width={6} height={8} rx={1.5} fill={GOLD} stroke={BEAR_LINE} strokeWidth={1} />
      </G>
      {/* over the second door: two chairs facing each other */}
      <G>
        <ChairSide x={140} y={51} s={1.55} dir={1} />
        <ChairSide x={160} y={51} s={1.55} dir={-1} fill={ROSE} />
      </G>
      {/* over the third door: a ring of chairs */}
      <G>
        {[0, 1, 2, 3, 4, 5]
          .map((i) => {
            const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
            return { x: 230 + 24 * Math.cos(a), y: 42 + 6 * Math.sin(a), i };
          })
          .sort((a, b) => a.y - b.y)
          .map((c) => (
            <Chair key={c.i} x={c.x} y={c.y + 5} s={0.62} fill={c.i % 2 ? WOOD : '#D9A441'} />
          ))}
      </G>

      {sorted.map((p) => (
        <Person key={p.x} x={p.x} y={p.y} s={0.42} fill={p.c} face={FACE} />
      ))}

      {queue.map((p) => (
        <Person key={p.x} x={p.x} y={158} s={p.s} fill={p.c} face={FACE} />
      ))}

      <Rect x={124} y={142} width={112} height={7} rx={2} fill={WOOD} stroke={BEAR_LINE} strokeWidth={1.3} />
      <Rect x={130} y={149} width={5} height={14} fill={BROWN} />
      <Rect x={225} y={149} width={5} height={14} fill={BROWN} />
      <Person x={186} y={147} s={0.78} fill={k.acc} face={k.bg} />
      <Rect x={190} y={131} width={20} height={13} rx={2} fill={PAPER} stroke={BEAR_LINE} strokeWidth={1.2} transform="rotate(-8 200 138)" />
      <Path d="M193 134 H206 M193 138 H203" stroke={SCRIBBLE} strokeWidth={1.2} strokeLinecap="round" transform="rotate(-8 200 138)" />
      <Rect x={140} y={137} width={13} height={5} rx={1} fill={PAPER} stroke={BEAR_LINE} strokeWidth={1} />
      <Cap k={k} s="Match each person to a door" />
    </Frame>
  );
}

/* ---------- 2: three roads ---------- */
/* the three kinds of road, standing on a base at (x, 172) and running up toward y 62 */
function PavedRoad({ x, top = 62 }: { x: number; top?: number }) {
  return (
    <G>
      <Path
        d={`M${x - 22} 172 L${x + 22} 172 L${x + 6} ${top} L${x - 6} ${top} Z`}
        fill={ASPHALT}
        stroke={BEAR_LINE}
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
      <Path d={`M${x} 168 L${x} ${top + 4}`} stroke={WHITE} strokeWidth={2.4} strokeDasharray="9 8" fill="none" />
    </G>
  );
}
const WIND_A: Pt = [150, 172];
const WIND_B: Pt = [126, 152];
const WIND_C: Pt = [174, 132];
const WIND_D: Pt = [150, 112];
function DirtRoad({ k2 = false }: { k2?: boolean }) {
  const d = k2 ? 'M150 172 C124 152 176 132 150 112 C128 96 172 74 150 46' : 'M150 172 C126 152 174 132 150 112 C132 98 166 80 150 62';
  return (
    <G>
      <Path d={d} stroke={DIRT_D} strokeWidth={15} strokeLinecap="round" fill="none" />
      <Path d={d} stroke={DIRT} strokeWidth={11} strokeLinecap="round" fill="none" />
    </G>
  );
}

function ThreeRoads({ k }: { k: Ink }) {
  const stones = [
    { x: 239, y: 164, r: 12 },
    { x: 243, y: 146, r: 10.5 },
    { x: 237, y: 130, r: 9.5 },
    { x: 242, y: 116, r: 8.5 },
    { x: 238, y: 103, r: 7.5 },
    { x: 241, y: 92, r: 6.5 },
    { x: 239, y: 82, r: 5.5 },
    { x: 240, y: 74, r: 4.8 },
  ];
  const mid = bez(WIND_A, WIND_B, WIND_C, WIND_D, 0.5);
  return (
    <Frame label="Three different roads start side by side at the bottom. On the left, a paved straight road; in the middle, a winding dirt path; on the right, a path of stepping stones. Each has one small person walking along it">
      <Path d="M10 66 Q150 52 290 66 L290 158 Q290 172 276 172 L24 172 Q10 172 10 158 Z" fill={GRASS} />
      <Path d="M10 66 Q150 52 290 66 L290 74 Q150 60 10 74 Z" fill={GRASS_D} />
      <PavedRoad x={61} />
      <DirtRoad />
      {stones.map((s, i) => (
        <Stone key={i} x={s.x} y={s.y} rx={s.r} />
      ))}
      <Person x={61} y={132} s={0.46} fill={k.acc} face={k.bg} />
      <Person x={mid.x} y={mid.y + 2} s={0.46} fill={k.acc} face={k.bg} />
      <Person x={238} y={132} s={0.46} fill={k.acc} face={k.bg} />
      <Cap k={k} s="Three very different roads" />
    </Frame>
  );
}

/* ---------- 3: the same hill ---------- */
function SameHill({ k }: { k: Ink }) {
  const sun = [0, 45, 90, 135, 180, 225, 270, 315];
  const stones = [0.05, 0.18, 0.31, 0.44, 0.56, 0.82, 0.91].map((t, i) => ({
    x: 239 - 89 * t,
    y: 172 - 124 * t,
    r: i < 5 ? 12 - i * 1.5 : 4.5,
  }));
  const ty = 84;
  const lx = 61 + (89 * (172 - ty)) / 126;
  const rx = 239 - (89 * (172 - ty)) / 126;
  return (
    <Frame label="The same three roads now all climb a green hill and meet at one sunny hilltop with a small flag. The three small people arrive at about the same height, near the top">
      <Circle cx={236} cy={34} r={12} fill={GOLD} />
      <G stroke={GOLD} strokeWidth={3} strokeLinecap="round">
        {sun.map((a) => (
          <Line
            key={a}
            x1={236 + 17 * Math.cos((a * Math.PI) / 180)}
            y1={34 + 17 * Math.sin((a * Math.PI) / 180)}
            x2={236 + 23 * Math.cos((a * Math.PI) / 180)}
            y2={34 + 23 * Math.sin((a * Math.PI) / 180)}
          />
        ))}
      </G>
      <Path
        d="M10 172 L10 146 Q60 124 100 84 Q128 46 150 44 Q172 46 200 84 Q240 124 290 146 L290 172 Z"
        fill={GRASS}
        stroke={GRASS_D}
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
      <Path d="M46 172 L76 172 L153 48 L147 48 Z" fill={ASPHALT} stroke={BEAR_LINE} strokeWidth={1.2} strokeLinejoin="round" />
      <Path d="M61 168 L150 52" stroke={WHITE} strokeWidth={2} strokeDasharray="8 7" fill="none" />
      <DirtRoad k2 />
      {stones.map((s, i) => (
        <Stone key={i} x={s.x} y={s.y} rx={s.r} />
      ))}
      <Line x1={150} y1={46} x2={150} y2={28} stroke={BROWN} strokeWidth={2.6} strokeLinecap="round" />
      <Path d="M151 28 L169 33 L151 39 Z" fill={TERRA} stroke={BEAR_LINE} strokeWidth={1.3} strokeLinejoin="round" />
      <Person x={lx} y={ty} s={0.36} fill={k.acc} face={k.bg} />
      <Person x={150} y={ty} s={0.36} fill={k.acc} face={k.bg} />
      <Person x={rx} y={ty} s={0.36} fill={k.acc} face={k.bg} />
      <Cap k={k} s="All three, about as far" />
    </Frame>
  );
}

/* ---------- 4: the one you keep walking ---------- */
function RoadsMeet({ k }: { k: Ink }) {
  const J: Pt = [150, 110];
  const P1: Pt = [190, 112];
  const P2: Pt = [230, 100];
  const P3: Pt = [276, 92];
  const prints: ReactNode[] = [];
  for (let i = 0; i < 9; i++) {
    const t = 0.1 + i * 0.1;
    const q = bez(J, P1, P2, P3, t);
    const nx = -Math.sin((q.a * Math.PI) / 180);
    const ny = Math.cos((q.a * Math.PI) / 180);
    prints.push(
      <G key={`o${i}`} transform={`translate(${q.x + nx * -3.6} ${q.y + ny * -3.6}) rotate(${q.a})`}>
        <Ellipse cx={0} cy={0} rx={4.2} ry={2.5} fill="#6B4423" />
        <Ellipse cx={5.4} cy={0} rx={2.3} ry={2.1} fill="#6B4423" />
      </G>,
      <G key={`b${i}`} transform={`translate(${q.x + nx * 3.6 + 2} ${q.y + ny * 3.6}) rotate(${q.a + 180})`}>
        <Ellipse cx={0} cy={0} rx={4.2} ry={2.5} fill="#6B4423" />
        <Ellipse cx={5.4} cy={0} rx={2.3} ry={2.1} fill="#6B4423" />
      </G>,
    );
  }
  const thin = ['M150 110 C130 80 90 70 50 46', 'M150 110 C150 80 156 56 150 24', 'M150 110 C170 84 200 60 236 36', 'M150 110 C110 112 70 118 20 130'];
  return (
    <Frame label="A person stands at a crossroads where several paths lead away across the grass. Most are thin and untouched. One path, to the right, is wide and worn, covered in fresh footprints going out and coming back many times">
      <Rect x={10} y={14} width={280} height={158} rx={14} fill={GRASS} />
      <Rect x={10} y={14} width={280} height={158} rx={14} fill="none" stroke={k.line} strokeWidth={2} />
      {thin.map((d) => (
        <Path key={d} d={d} stroke="#DCC49C" strokeWidth={7} strokeLinecap="round" fill="none" />
      ))}
      <Path d="M150 172 L150 110" stroke={DIRT_D} strokeWidth={20} strokeLinecap="round" fill="none" />
      <Path d="M150 172 L150 110" stroke={DIRT} strokeWidth={16} strokeLinecap="round" fill="none" />
      <Path d="M150 110 C190 112 230 100 276 92" stroke={DIRT_D} strokeWidth={21} strokeLinecap="round" fill="none" />
      <Path d="M150 110 C190 112 230 100 276 92" stroke={DIRT} strokeWidth={17} strokeLinecap="round" fill="none" />
      <Circle cx={150} cy={110} r={10} fill={DIRT} />
      {prints}
      <Rect x={60} y={86} width={7} height={14} fill={BROWN} />
      <Circle cx={63} cy={80} r={13} fill={GREEN} />
      <Circle cx={56} cy={87} r={8} fill={GREEN} />
      <Circle cx={71} cy={87} r={8} fill={GREEN} />
      <Circle cx={60} cy={76} r={5} fill={LEAF} />
      <Ellipse cx={232} cy={144} rx={16} ry={9} fill={GRASS_D} />
      <Ellipse cx={246} cy={146} rx={10} ry={6} fill={GRASS_D} />
      <Ellipse cx={92} cy={150} rx={9} ry={5} fill={STONE} stroke={BEAR_LINE} strokeWidth={1.1} />
      <Person x={150} y={170} s={0.72} fill={k.acc} face={k.bg} />
      <Cap k={k} s="The one you keep walking" />
    </Frame>
  );
}

/* ---------- 5: four points ---------- */
function FourStones({ k }: { k: Ink }) {
  const stones = [
    { x: 70, y: 132, rx: 27, c: '#B5683F' },
    { x: 125, y: 113, rx: 24, c: '#F5C94A' },
    { x: 180, y: 95, rx: 21, c: ROSE },
    { x: 232, y: 80, rx: 18, c: '#F08A3C' },
  ];
  return (
    <Frame label="Four big flat stepping stones, each a different warm color, lead across a stream to a green far bank. A person is stepping onto the second stone">
      <Rect x={10} y={60} width={280} height={86} fill={WAVE} />
      <G stroke={WAVE_L} strokeWidth={2} strokeLinecap="round" fill="none">
        <Path d="M24 80 Q34 76 44 80" />
        <Path d="M236 124 Q248 120 260 124" />
        <Path d="M150 132 Q160 128 170 132" />
        <Path d="M30 108 Q40 104 50 108" />
        <Path d="M252 98 Q262 94 272 98" />
        <Path d="M96 80 Q106 76 116 80" />
      </G>
      <Path d="M10 46 Q10 40 16 40 L284 40 Q290 40 290 46 L290 62 Q250 74 200 66 Q150 58 100 66 Q50 74 10 62 Z" fill={GRASS_D} />
      <Rect x={44} y={36} width={6} height={14} fill={BROWN} />
      <Circle cx={47} cy={30} r={12} fill={GREEN} />
      <Circle cx={40} cy={36} r={7} fill={GREEN} />
      <Circle cx={55} cy={36} r={7} fill={GREEN} />
      <Circle cx={44} cy={26} r={4.5} fill={LEAF} />
      {[
        [100, 50],
        [138, 54],
        [190, 50],
        [262, 52],
      ].map(([x, y]) => (
        <G key={x}>
          <Circle cx={x} cy={y} r={2.6} fill={GOLD} />
          <Circle cx={x + 7} cy={y + 3} r={2.2} fill={ROSE} />
        </G>
      ))}
      <Path d="M10 144 Q60 132 120 140 Q200 148 290 136 L290 166 Q290 172 284 172 L16 172 Q10 172 10 166 Z" fill={GRASS} />
      {stones.map((s) => (
        <G key={s.x}>
          <Ellipse cx={s.x} cy={s.y + 6} rx={s.rx} ry={s.rx * 0.34} fill={BEAR_LINE} opacity={0.4} />
          <Ellipse cx={s.x} cy={s.y + 3} rx={s.rx} ry={s.rx * 0.34} fill={s.c} stroke={BEAR_LINE} strokeWidth={1.2} />
          <Ellipse cx={s.x} cy={s.y} rx={s.rx} ry={s.rx * 0.34} fill={s.c} stroke={BEAR_LINE} strokeWidth={1.2} />
          <Path
            d={`M${s.x - s.rx * 0.5} ${s.y - 1.5} Q${s.x} ${s.y - s.rx * 0.2} ${s.x + s.rx * 0.4} ${s.y - 2}`}
            stroke={WHITE}
            strokeWidth={1.6}
            strokeLinecap="round"
            opacity={0.5}
            fill="none"
          />
        </G>
      ))}
      <Arm d="M105 80 Q95 88 93 96" c={k.acc} w={5} />
      <Person x={125} y={112} s={0.82} fill={k.acc} face={k.bg} />
      <Arm d="M145 80 Q158 78 164 70" c={k.acc} w={5} />
      <Cap k={k} s="Four points to stand on" />
    </Frame>
  );
}

/* ---------- 6: five moves for an urge ---------- */
function Hourglass({ x, y }: { x: number; y: number }) {
  return (
    <G>
      <Path
        d={`M${x - 8} ${y - 13} L${x + 8} ${y - 13} L${x + 1.5} ${y} L${x + 8} ${y + 13} L${x - 8} ${y + 13} L${x - 1.5} ${y} Z`}
        fill={SKY}
        stroke={BEAR_LINE}
        strokeWidth={1.3}
        strokeLinejoin="round"
      />
      <Path d={`M${x - 5.5} ${y - 11} L${x + 5.5} ${y - 11} L${x + 1} ${y - 3} L${x - 1} ${y - 3} Z`} fill={GOLD} />
      <Path d={`M${x} ${y - 1} L${x} ${y + 8}`} stroke={GOLD} strokeWidth={1.6} />
      <Path d={`M${x - 6.5} ${y + 12} Q${x} ${y + 3} ${x + 6.5} ${y + 12} Z`} fill={GOLD} />
      <Rect x={x - 11} y={y - 17} width={22} height={4} rx={1.5} fill={WOOD} stroke={BEAR_LINE} strokeWidth={1.2} />
      <Rect x={x - 11} y={y + 13} width={22} height={4} rx={1.5} fill={WOOD} stroke={BEAR_LINE} strokeWidth={1.2} />
    </G>
  );
}
function OpenDoor({ x, y }: { x: number; y: number }) {
  return (
    <G>
      <Rect x={x - 13} y={y - 17} width={26} height={34} fill="#FFE9A8" stroke={BROWN} strokeWidth={2.5} />
      <Path
        d={`M${x - 13} ${y - 17} L${x - 2} ${y - 12} L${x - 2} ${y + 13} L${x - 13} ${y + 17} Z`}
        fill={TERRA}
        stroke={BEAR_LINE}
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
      <Circle cx={x - 5} cy={y + 1} r={1.6} fill={GOLD} />
      <Path d={`M${x + 2} ${y + 17} L${x + 13} ${y + 17} L${x + 10} ${y + 12} L${x + 2} ${y + 12} Z`} fill={GOLD} opacity={0.7} />
    </G>
  );
}
function AnswerBubble({ x, y }: { x: number; y: number }) {
  return (
    <G>
      <Path d={`M${x - 6} ${y + 8} L${x - 10} ${y + 17} L${x + 3} ${y + 8} Z`} fill={WHITE} stroke={BEAR_LINE} strokeWidth={1.3} strokeLinejoin="round" />
      <Rect x={x - 17} y={y - 13} width={34} height={23} rx={9} fill={WHITE} stroke={BEAR_LINE} strokeWidth={1.3} />
      <Rect x={x - 8} y={y + 6} width={10} height={3} fill={WHITE} />
      <Path
        d={`M${x - 8} ${y - 1} L${x - 2} ${y + 5} L${x + 9} ${y - 8}`}
        stroke={GREEN}
        strokeWidth={3.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </G>
  );
}
function HammerHouse({ x, y }: { x: number; y: number }) {
  return (
    <G>
      <Rect x={x + 5} y={y + 11} width={3} height={7} fill={BROWN} />
      <Rect x={x - 1} y={y - 4} width={17} height={16} fill={ROSE} stroke={BEAR_LINE} strokeWidth={1.2} />
      <Path d={`M${x - 4} ${y - 4} L${x + 7.5} ${y - 15} L${x + 19} ${y - 4} Z`} fill={BROWN} stroke={BEAR_LINE} strokeWidth={1.2} strokeLinejoin="round" />
      <Circle cx={x + 7.5} cy={y + 3} r={3} fill={BEAR_LINE} />
      <G transform={`translate(${x - 12} ${y + 2}) rotate(-35)`}>
        <Rect x={-2} y={-13} width={4} height={26} rx={1.5} fill={WOOD} stroke={BEAR_LINE} strokeWidth={1.1} />
        <Rect x={-8} y={-17} width={16} height={7} rx={1.5} fill={STEEL} stroke={BEAR_LINE} strokeWidth={1.1} />
      </G>
    </G>
  );
}
function SwapArrows({ x, y }: { x: number; y: number }) {
  return (
    <G strokeLinejoin="round" strokeLinecap="round">
      <Path d={`M${x - 15} ${y - 7} H${x + 6}`} stroke={TEAL} strokeWidth={4} fill="none" />
      <Path d={`M${x + 5} ${y - 14} L${x + 16} ${y - 7} L${x + 5} ${y}  Z`} fill={TEAL} stroke={TEAL} strokeWidth={1.5} />
      <Path d={`M${x + 15} ${y + 8} H${x - 6}`} stroke={TERRA} strokeWidth={4} fill="none" />
      <Path d={`M${x - 5} ${y + 1} L${x - 16} ${y + 8} L${x - 5} ${y + 15} Z`} fill={TERRA} stroke={TERRA} strokeWidth={1.5} />
    </G>
  );
}

function Dents({ k }: { k: Ink }) {
  return (
    <Frame label="A person stands in the middle, with five small clear things in an arc around them: an hourglass for waiting, an open door for leaving, a speech bubble with a check mark for answering a thought, a hammer and a small birdhouse for a task, and two arrows swapping places">
      <Line x1={14} y1={164} x2={286} y2={164} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      <Path d="M52 118 Q150 6 248 118" stroke={k.line} strokeWidth={2} strokeDasharray="0.1 7" strokeLinecap="round" fill="none" />
      <Hourglass x={40} y={120} />
      <OpenDoor x={76} y={72} />
      <AnswerBubble x={150} y={48} />
      <HammerHouse x={218} y={72} />
      <SwapArrows x={260} y={120} />
      <Person x={150} y={164} s={1.1} fill={k.acc} face={k.bg} />
      <Cap k={k} s="Five moves for an urge" />
    </Frame>
  );
}

/* ---------- 7: weigh it honestly ---------- */
function Scales({ k }: { k: Ink }) {
  const box = (x: number, y: number, lines: string[]) => (
    <G key={`${x}${y}`}>
      <Rect x={x} y={y} width={36} height={34} fill="none" stroke={BEAR_LINE} strokeWidth={1.2} />
      {lines.map((d, i) => (
        <Path key={i} d={d} stroke={SCRIBBLE} strokeWidth={1.5} strokeLinecap="round" fill="none" transform={`translate(${x} ${y})`} />
      ))}
    </G>
  );
  const wig = ['M5 8 Q9 4 13 8 T21 8 T29 8', 'M5 15 Q9 11 13 15 T20 15', 'M5 22 Q9 18 13 22 T21 22 T27 22'];
  return (
    <Frame label="A balance scale stands level on a table. Beside it, propped up, is a sheet of paper divided into four boxes, each with a few short scribbled lines and no words">
      <Rect x={10} y={146} width={280} height={9} rx={3} fill={WOOD} stroke={BEAR_LINE} strokeWidth={1.3} />
      <Rect x={26} y={155} width={7} height={17} fill={BROWN} />
      <Rect x={267} y={155} width={7} height={17} fill={BROWN} />

      <Path d="M80 146 Q80 136 95 136 Q110 136 110 146 Z" fill={TERRA} stroke={BEAR_LINE} strokeWidth={1.3} strokeLinejoin="round" />
      <Rect x={92} y={66} width={6} height={72} fill={TERRA} stroke={BEAR_LINE} strokeWidth={1.3} />
      <Rect x={48} y={64} width={94} height={5} rx={2.5} fill={GOLD} stroke={BEAR_LINE} strokeWidth={1.3} />
      <Circle cx={95} cy={61} r={5} fill={GOLD} stroke={BEAR_LINE} strokeWidth={1.3} />
      {[54, 136].map((x) => (
        <G key={x}>
          <Path d={`M${x} 68 L${x - 17} 106 M${x} 68 L${x + 17} 106`} stroke={BEAR_LINE} strokeWidth={1.3} fill="none" />
          <Path d={`M${x - 20} 106 Q${x} 124 ${x + 20} 106 Z`} fill={GOLD} stroke={BEAR_LINE} strokeWidth={1.3} strokeLinejoin="round" />
          <Circle cx={x} cy={102} r={6} fill={k.acc} stroke={BEAR_LINE} strokeWidth={1.1} />
        </G>
      ))}

      <G transform="rotate(3 224 98)">
        <Rect x={182} y={50} width={84} height={92} rx={3} fill={PAPER} stroke={BEAR_LINE} strokeWidth={1.4} />
        <Rect x={212} y={44} width={24} height={9} rx={3} fill={STEEL} stroke={BEAR_LINE} strokeWidth={1.2} />
        <Path d="M224 53 V138 M185 96 H263" stroke={PAPER_D} strokeWidth={1.4} fill="none" />
        {box(188, 58, wig)}
        {box(228, 58, wig.slice(0, 2))}
        {box(188, 100, wig.slice(0, 2))}
        {box(228, 100, wig)}
      </G>
      <Rect x={150} y={141} width={26} height={4} rx={2} fill={GOLD} stroke={BEAR_LINE} strokeWidth={1} transform="rotate(-6 163 143)" />
      <Cap k={k} s="Weigh it honestly" />
    </Frame>
  );
}

/* ---------- 8: young, and growing ---------- */
function Sapling({ k }: { k: Ink }) {
  return (
    <Frame label="A young sapling grows in the ground inside a small fence, with a watering can beside it dripping water. A much bigger mature tree stands far behind it on a distant hill">
      <Ellipse cx={248} cy={120} rx={74} ry={22} fill={GRASS_D} opacity={0.55} />
      <Rect x={242} y={80} width={11} height={42} fill={BROWN} />
      <Circle cx={247} cy={60} r={27} fill={GREEN} />
      <Circle cx={226} cy={78} r={17} fill={GREEN} />
      <Circle cx={268} cy={78} r={17} fill={GREEN} />
      <Circle cx={240} cy={50} r={11} fill={LEAF} />
      <Circle cx={262} cy={64} r={7} fill={LEAF} />
      <Path d="M10 140 Q70 118 150 128 Q230 138 290 124 L290 158 Q290 172 276 172 L24 172 Q10 172 10 158 Z" fill={GRASS} />
      <Path d="M10 140 Q70 118 150 128 Q230 138 290 124 L290 130 Q230 144 150 134 Q70 124 10 146 Z" fill={GRASS_D} opacity={0.6} />

      <Path d="M110 156 Q110 138 108 126" stroke={GREEN} strokeWidth={4} strokeLinecap="round" fill="none" />
      <Ellipse cx={99} cy={128} rx={11} ry={5.5} fill={LEAF} transform="rotate(-25 99 128)" />
      <Ellipse cx={120} cy={122} rx={12} ry={6} fill={GREEN} transform="rotate(-20 120 122)" />
      <Ellipse cx={103} cy={112} rx={9} ry={4.8} fill={GREEN} transform="rotate(25 103 112)" />
      <Ellipse cx={114} cy={106} rx={7} ry={4} fill={LEAF} transform="rotate(-30 114 106)" />
      <Path d="M70 158 H150" stroke={BROWN} strokeWidth={5} strokeLinecap="round" opacity={0.35} />

      {[74, 86, 98, 122, 134, 146].map((x) => (
        <Path key={x} d={`M${x - 2.4} 164 V146 L${x} 142 L${x + 2.4} 146 V164 Z`} fill={PAPER} stroke={BEAR_LINE} strokeWidth={1.1} strokeLinejoin="round" />
      ))}
      <Rect x={68} y={148} width={84} height={3} fill={WOOD} stroke={BEAR_LINE} strokeWidth={1} />
      <Rect x={68} y={156} width={84} height={3} fill={WOOD} stroke={BEAR_LINE} strokeWidth={1} />

      <G>
        <Path d="M184 150 L204 146 L202 142 L180 146 Z" fill="#D9473A" stroke={BEAR_LINE} strokeWidth={1.2} strokeLinejoin="round" />
        <Path d="M190 144 Q196 134 202 144" stroke={BEAR_LINE} strokeWidth={2} fill="none" strokeLinecap="round" />
        <Path d="M196 166 L194 148 L214 148 L212 166 Q204 171 196 166 Z" fill="#D9473A" stroke={BEAR_LINE} strokeWidth={1.3} strokeLinejoin="round" />
        <Path d="M196 160 H212" stroke={BEAR_LINE} strokeWidth={1.1} opacity={0.4} />
        <Path d="M194 156 L178 144" stroke={BEAR_LINE} strokeWidth={5} strokeLinecap="round" />
        <Path d="M194 156 L178 144" stroke="#D9473A" strokeWidth={3} strokeLinecap="round" />
        <Rect x={173} y={139} width={9} height={4} rx={1.5} fill="#D9473A" stroke={BEAR_LINE} strokeWidth={1.1} transform="rotate(-35 177 141)" />
        <G fill={WAVE_L} stroke={WAVE} strokeWidth={0.8}>
          <Ellipse cx={168} cy={147} rx={1.6} ry={2.4} />
          <Ellipse cx={163} cy={153} rx={1.6} ry={2.4} />
          <Ellipse cx={158} cy={160} rx={1.6} ry={2.4} />
        </G>
      </G>
      <Cap k={k} s="Young, and growing" />
    </Frame>
  );
}

/* ---------- 9: walking out ---------- */
function WalkOut({ k }: { k: Ink }) {
  const sun = [0, 45, 90, 135, 180, 225, 270, 315];
  return (
    <Frame label="A person walks out of a meeting room through an open door into bright daylight, sunshine on their face. Behind them, through the doorway, a small ring of chairs is visible inside the room">
      <Circle cx={252} cy={36} r={13} fill={GOLD} />
      <G stroke={GOLD} strokeWidth={3} strokeLinecap="round">
        {sun.map((a) => (
          <Line
            key={a}
            x1={252 + 19 * Math.cos((a * Math.PI) / 180)}
            y1={36 + 19 * Math.sin((a * Math.PI) / 180)}
            x2={252 + 26 * Math.cos((a * Math.PI) / 180)}
            y2={36 + 26 * Math.sin((a * Math.PI) / 180)}
          />
        ))}
      </G>
      <Rect x={10} y={22} width={118} height={138} rx={3} fill="#EFD9BE" stroke={BEAR_LINE} strokeWidth={1.6} />
      <Rect x={6} y={14} width={126} height={10} rx={3} fill={TERRA} stroke={BEAR_LINE} strokeWidth={1.4} />
      <Rect x={26} y={52} width={78} height={108} fill="#6A4A5E" />
      <Rect x={26} y={52} width={78} height={14} fill="#563A4C" />
      <Rect x={26} y={146} width={78} height={14} fill="#52394A" />
      <Path d="M104 52 L124 58 L124 156 L104 160 Z" fill={BROWN} stroke={BEAR_LINE} strokeWidth={1.4} strokeLinejoin="round" />
      <Rect x={26} y={52} width={78} height={108} fill="none" stroke={BROWN} strokeWidth={3} />
      {[0, 1, 2, 3, 4, 5]
        .map((i) => {
          const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
          return { x: 62 + 25 * Math.cos(a), y: 130 + 9 * Math.sin(a), i };
        })
        .sort((a, b) => a.y - b.y)
        .map((c) => (
          <Chair key={c.i} x={c.x} y={c.y + 6} s={0.95 + (c.y - 121) / 60} fill={c.i % 2 ? '#E9B777' : '#D9A441'} />
        ))}

      <Rect x={268} y={104} width={10} height={52} fill={BROWN} />
      <Circle cx={273} cy={92} r={21} fill={GREEN} />
      <Circle cx={258} cy={103} r={13} fill={GREEN} />
      <Circle cx={288} cy={103} r={13} fill={GREEN} />
      <Circle cx={268} cy={84} r={8} fill={LEAF} />

      <Rect x={10} y={156} width={280} height={9} rx={2} fill={STONE} />
      <Rect x={10} y={165} width={280} height={7} rx={3} fill={ASPHALT} />

      <Arm d="M156 122 Q150 134 152 144" c={k.acc} w={6} />
      <Person x={172} y={158} s={1.3} fill={k.acc} face={k.bg} />
      <Arm d="M190 124 Q202 130 206 140" c={k.acc} w={6} />
      <Path d="M181.5 82 A16.5 16.5 0 0 1 181.5 109" stroke={GOLD} strokeWidth={3.4} strokeLinecap="round" fill="none" />
      <Path d="M192 80 L199 75 M195 95 L204 95 M192 110 L199 115" stroke={GOLD} strokeWidth={2.6} strokeLinecap="round" />
      <Path d="M171 104 Q176 108 181 103" stroke={k.bg} strokeWidth={1.7} strokeLinecap="round" fill="none" />
      <Cap k={k} s="Notice how you feel walking out" />
    </Frame>
  );
}

export const SCENES_L26: Record<string, ComponentType<{ k: Ink }>> = {
  'l22-match': Match,
  'l22-three-roads': ThreeRoads,
  'l22-same-hill': SameHill,
  'l22-roads-meet': RoadsMeet,
  'l22-four-stones': FourStones,
  'l22-dents': Dents,
  'l22-scales': Scales,
  'l22-sapling': Sapling,
  'l22-walk-out': WalkOut,
};
