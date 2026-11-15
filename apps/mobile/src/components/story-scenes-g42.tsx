/* Scenes for lesson 42 told as a story (see story-kit.tsx): "Crowd out the picture". A craving grows from a thought into a picture; the
   mind has one small screen for pictures, so a plain block puzzle for the eyes fills it and the picture fades. The craving's picture is
   only ever a vague glowing shape in a thought cloud, never an object of desire, and never fire. */
import { useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { Easing } from 'react-native';
import { Circle, ClipPath, Defs, Ellipse, G, Line, Path, Rect } from 'react-native-svg';

import { useAppear, useReducedMotion } from '@/lib/motion';

import { Frame, type Ink, Person, Say } from './story-kit';

const L42_GLOW = '#D066F0';
const L42_EDGE = '#F6C9FF';
const L42_BOARD = '#262A45';
const L42_GRID = '#3A3F63';
const L42_COLORS = ['#E4572E', '#3FA7D6', '#59C36A', '#F5C542', '#9B6BD6'];
const L42_RED = '#D64545';
const L42_GREEN = '#4E9A5B';
const L42_GRAY = '#9AA0B0';
const L42_SKIN = '#E8B896';
const L42_FACE = '#F5C542';
const L42_FIG = '#3B2F45';
const L42_SHIRT = '#5B8DB8';
const L42_WHITE = '#FFFFFF';
const L42_HEAD = 'M-30 -4 Q-36 -44 -2 -46 Q34 -46 36 -14 L44 2 Q46 6 40 8 L36 8 Q38 20 28 22 L26 34 L-8 34 L-8 22 Q-30 16 -30 -4 Z';

/* a number from 0 to 1 that eases up once, after a short pause; with Reduce Motion on it starts at 1 */
function L42useGrow(delay = 300, dur = 1200) {
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
function L42Cap({ k, s }: { k: Ink; s: string }) {
  return <Say x={150} y={190} s={s} fill={k.ink} />;
}

/* ---------- a thought cloud: a round, bumpy cloud about 96 wide and 68 tall at scale 1, centered on x and y ---------- */
const L42_PUFFS: Array<[number, number, number]> = [
  [-26, 8, 20],
  [-4, -8, 26],
  [22, -4, 23],
  [34, 12, 16],
  [-6, 14, 20],
  [14, 16, 18],
];
function L42Cloud({ cx, cy, s = 1, fill, line }: { cx: number; cy: number; s?: number; fill: string; line: string }) {
  return (
    <G transform={`translate(${cx} ${cy}) scale(${s})`}>
      {L42_PUFFS.map(([x, y, r], i) => (
        <Circle key={i} cx={x} cy={y} r={r} fill={line} stroke={line} strokeWidth={3 / s} />
      ))}
      <Rect x={-30} y={8} width={60} height={24} rx={12} fill={line} stroke={line} strokeWidth={3 / s} />
      {L42_PUFFS.map(([x, y, r], i) => (
        <Circle key={'f' + i} cx={x} cy={y} r={r} fill={fill} />
      ))}
      <Rect x={-30} y={8} width={60} height={24} rx={12} fill={fill} />
    </G>
  );
}

/* a vague glowing shape: a soft rounded blob, about 2r wide. Sharp has a bright edge; soft is stacked, blurry layers. */
const L42_BLOB = 'M0 -1 C0.6 -1 1 -0.5 0.9 0.1 C0.8 0.7 0.3 1 -0.2 0.95 C-0.8 0.9 -1.05 0.3 -0.9 -0.3 C-0.8 -0.8 -0.4 -1 0 -1 Z';
function L42Blob({ cx, cy, r, op = 1, sharp = true }: { cx: number; cy: number; r: number; op?: number; sharp?: boolean }) {
  return (
    <G transform={`translate(${cx} ${cy}) scale(${r})`} opacity={op}>
      <Path d={L42_BLOB} fill={L42_GLOW} opacity={0.18} transform="scale(1.7)" />
      <Path d={L42_BLOB} fill={L42_GLOW} opacity={0.3} transform="scale(1.35)" />
      {sharp ? (
        <G>
          <Path d={L42_BLOB} fill={L42_GLOW} stroke={L42_EDGE} strokeWidth={0.1} strokeLinejoin="round" />
          <Ellipse cx={-0.3} cy={-0.35} rx={0.32} ry={0.2} fill={L42_EDGE} opacity={0.55} transform="rotate(-25 -0.3 -0.35)" />
        </G>
      ) : (
        <G>
          <Path d={L42_BLOB} fill={L42_GLOW} opacity={0.35} transform="scale(1.15)" />
          <Path d={L42_BLOB} fill={L42_GLOW} opacity={0.5} />
        </G>
      )}
    </G>
  );
}

/* three stacked, fading copies of a picture: it reads as blurry */
function L42Blur({ cx, cy, op = 1, children }: { cx: number; cy: number; op?: number; children: ReactNode }) {
  return (
    <G opacity={op}>
      {[
        [1.22, 0.16],
        [1.1, 0.26],
        [1, 0.5],
      ].map(([s, o], i) => (
        <G key={i} opacity={o} transform={`translate(${cx} ${cy}) scale(${s}) translate(${-cx} ${-cy})`}>
          {children}
        </G>
      ))}
    </G>
  );
}

/* ---------- the falling-block puzzle board: origin top left, cols x rows cells of `cell` ---------- */
type L42Cells = Array<[number, number]>;
const L42_T: L42Cells = [
  [0, 0],
  [1, 0],
  [2, 0],
  [1, 1],
];
const L42_L: L42Cells = [
  [0, 0],
  [0, 1],
  [0, 2],
  [1, 2],
];
function L42Block({ x, y, c, color }: { x: number; y: number; c: number; color: string }) {
  return (
    <G>
      <Rect x={x + c * 0.05} y={y + c * 0.05} width={c * 0.9} height={c * 0.9} rx={c * 0.2} fill={color} />
      <Rect x={x + c * 0.16} y={y + c * 0.14} width={c * 0.5} height={c * 0.16} rx={c * 0.08} fill={L42_WHITE} opacity={0.35} />
    </G>
  );
}
/* `stack` rows of settled blocks (with a few gaps) fill the bottom; `row` is where the falling piece's top sits (null: no piece) */
function L42Board({
  id,
  x,
  y,
  cell,
  cols = 6,
  rows = 10,
  stack = 3,
  row = null,
  piece = L42_T,
  pieceCol = 2,
  pieceColor = L42_COLORS[4],
}: {
  id: string;
  x: number;
  y: number;
  cell: number;
  cols?: number;
  rows?: number;
  stack?: number;
  row?: number | null;
  piece?: L42Cells;
  pieceCol?: number;
  pieceColor?: string;
}) {
  const w = cols * cell;
  const h = rows * cell;
  const settled: Array<[number, number, number]> = [];
  for (let r = rows - stack; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if ((c * 3 + r * 5) % 7 === 0 && r < rows - 1) continue;
      settled.push([c, r, (c + r * 2) % 5]);
    }
  }
  return (
    <G>
      <Defs>
        <ClipPath id={id}>
          <Rect x={x} y={y} width={w} height={h} rx={cell * 0.45} />
        </ClipPath>
      </Defs>
      <Rect x={x} y={y} width={w} height={h} rx={cell * 0.45} fill={L42_BOARD} />
      <G clipPath={`url(#${id})`}>
        {Array.from({ length: cols - 1 }, (_, i) => (
          <Line key={'v' + i} x1={x + (i + 1) * cell} y1={y} x2={x + (i + 1) * cell} y2={y + h} stroke={L42_GRID} strokeWidth={0.7} />
        ))}
        {Array.from({ length: rows - 1 }, (_, i) => (
          <Line key={'h' + i} x1={x} y1={y + (i + 1) * cell} x2={x + w} y2={y + (i + 1) * cell} stroke={L42_GRID} strokeWidth={0.7} />
        ))}
        {settled.map(([c, r, ci]) => (
          <L42Block key={c + '-' + r} x={x + c * cell} y={y + r * cell} c={cell} color={L42_COLORS[ci]} />
        ))}
        {row !== null
          ? piece.map(([dc, dr], i) => <L42Block key={'p' + i} x={x + (pieceCol + dc) * cell} y={y + (row + dr) * cell} c={cell} color={pieceColor} />)
          : null}
      </G>
    </G>
  );
}

/* a head in profile, facing right, with its inner screen (36 wide, 40 tall in head units) */
const L42_SX = -22;
const L42_SY = -32;
const L42_SW = 36;
const L42_SH = 40;
function L42Head({ k, x, y, s, children }: { k: Ink; x: number; y: number; s: number; children: ReactNode }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Path d={L42_HEAD} fill={k.soft} stroke={k.line} strokeWidth={1.6} strokeLinejoin="round" />
      <Rect x={L42_SX} y={L42_SY} width={L42_SW} height={L42_SH} rx={5} fill={L42_BOARD} stroke={k.line} strokeWidth={1.2} />
      {children}
    </G>
  );
}

/* ---------- 1. a thought turns into a picture ---------- */
function L42Picture({ k }: { k: Ink }) {
  return (
    <Frame label="A person with three thought clouds in a row above their head. The first cloud, small, holds a tiny faint dot. The second, bigger, holds a small blurry glowing shape. The third, large, holds a big bright sharp glowing shape.">
      <L42Cloud cx={52} cy={62} s={0.55} fill={k.soft} line={k.line} />
      <Circle cx={52} cy={64} r={2.6} fill={L42_GLOW} opacity={0.4} />
      <L42Cloud cx={150} cy={60} s={0.76} fill={k.soft} line={k.line} />
      <L42Blob cx={150} cy={62} r={10} op={0.9} sharp={false} />
      <L42Cloud cx={248} cy={60} s={0.95} fill={k.soft} line={k.line} />
      <L42Blob cx={248} cy={62} r={21} />
      <Path d="M92 56 L98 62 L92 68 M193 56 L199 62 L193 68" stroke={k.muted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Circle cx={146} cy={104} r={2.6} fill={k.soft} stroke={k.line} strokeWidth={1.2} />
      <Circle cx={149} cy={96} r={3.6} fill={k.soft} stroke={k.line} strokeWidth={1.2} />
      <Person x={150} y={170} s={1} fill={k.ink} face={k.bg} />
      <L42Cap k={k} s="A thought turns into a picture" />
    </Frame>
  );
}

/* ---------- 2. one small screen ---------- */
function L42Apple({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <G>
      <Circle cx={cx - r * 0.35} cy={cy + r * 0.1} r={r * 0.78} fill={L42_RED} />
      <Circle cx={cx + r * 0.35} cy={cy + r * 0.1} r={r * 0.78} fill={L42_RED} />
      <Path
        d={`M${cx} ${cy - r * 0.5} Q${cx + r * 0.05} ${cy - r * 1.1} ${cx + r * 0.3} ${cy - r * 1.2}`}
        stroke="#6B4A2A"
        strokeWidth={r * 0.18}
        strokeLinecap="round"
        fill="none"
      />
      <Ellipse cx={cx + r * 0.65} cy={cy - r * 0.95} rx={r * 0.38} ry={r * 0.2} fill={L42_GREEN} transform={`rotate(-20 ${cx + r * 0.65} ${cy - r * 0.95})`} />
    </G>
  );
}
function L42Face({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <G>
      <Circle cx={cx} cy={cy} r={r} fill={L42_FACE} />
      <Circle cx={cx - r * 0.35} cy={cy - r * 0.15} r={r * 0.12} fill={L42_FIG} />
      <Circle cx={cx + r * 0.35} cy={cy - r * 0.15} r={r * 0.12} fill={L42_FIG} />
      <Path
        d={`M${cx - r * 0.4} ${cy + r * 0.25} Q${cx} ${cy + r * 0.65} ${cx + r * 0.4} ${cy + r * 0.25}`}
        stroke={L42_FIG}
        strokeWidth={r * 0.13}
        strokeLinecap="round"
        fill="none"
      />
    </G>
  );
}
function L42Screen({ k }: { k: Ink }) {
  return (
    <Frame label="A head in profile with a small rounded screen inside it. On the screen two blurry pictures overlap, half on top of each other: a red apple and a simple friendly face.">
      <Defs>
        <ClipPath id="l42-scr">
          <Rect x={L42_SX} y={L42_SY} width={L42_SW} height={L42_SH} rx={5} />
        </ClipPath>
      </Defs>
      <L42Head k={k} x={135} y={110} s={1.75}>
        <G clipPath="url(#l42-scr)">
          <L42Blur cx={-11} cy={-14}>
            <L42Apple cx={-11} cy={-14} r={8.5} />
          </L42Blur>
          <L42Blur cx={2} cy={-5}>
            <L42Face cx={2} cy={-5} r={10} />
          </L42Blur>
        </G>
      </L42Head>
      <L42Cap k={k} s="One small screen" />
    </Frame>
  );
}

/* ---------- 3. a job for the eyes ---------- */
function L42Blocks({ k }: { k: Ink }) {
  const p = L42useGrow(450, 1500);
  return (
    <Frame label="A person in profile on the left watches a tall falling-block puzzle board, with colorful square blocks stacked at the bottom and a purple piece dropping gently down.">
      <G transform="translate(82 100) scale(1.4)">
        <Path d={L42_HEAD} fill={k.soft} stroke={k.line} strokeWidth={1.6} strokeLinejoin="round" />
        <Circle cx={26} cy={-17} r={2.2} fill={k.ink} />
      </G>
      <Line x1={136} y1={78} x2={157} y2={78} stroke={k.muted} strokeWidth={2} strokeDasharray="1 5" strokeLinecap="round" />
      <L42Board id="l42-b3" x={164} y={22} cell={14} row={0.4 + 4.4 * p} />
      <L42Cap k={k} s="A job for the eyes" />
    </Frame>
  );
}

/* ---------- 4. seven texts a day, for a week ---------- */
function L42Texts({ k }: { k: Ink }) {
  return (
    <Frame label="A phone showing a simple chat bubble above a small rating slider that runs from low to high. Above the phone a row of seven small dots, one for each message of the day, with three already filled in.">
      {Array.from({ length: 7 }, (_, i) => (
        <Circle key={i} cx={96 + i * 18} cy={24} r={5.5} fill={i < 3 ? k.acc : 'none'} stroke={i < 3 ? k.acc : k.muted} strokeWidth={1.8} />
      ))}
      <Path
        d="M94 96 Q84 108 94 120 M82 88 Q66 108 82 128 M206 96 Q216 108 206 120 M218 88 Q234 108 218 128"
        stroke={k.acc}
        strokeWidth={2.4}
        strokeLinecap="round"
        fill="none"
        opacity={0.7}
      />
      <Rect x={103} y={42} width={94} height={128} rx={16} fill={k.ink} />
      <Rect x={107} y={46} width={86} height={120} rx={13} fill={k.bg} />
      <Rect x={115} y={58} width={62} height={30} rx={11} fill={k.soft} stroke={k.line} strokeWidth={1.4} />
      <Path d="M121 86 L119 96 L131 87 Z" fill={k.soft} stroke={k.line} strokeWidth={1.4} strokeLinejoin="round" />
      <Rect x={122} y={86} width={10} height={3} fill={k.soft} />
      <Line x1={123} y1={68} x2={163} y2={68} stroke={k.muted} strokeWidth={3} strokeLinecap="round" />
      <Line x1={123} y1={77} x2={149} y2={77} stroke={k.muted} strokeWidth={3} strokeLinecap="round" opacity={0.7} />
      <Rect x={118} y={126} width={64} height={6} rx={3} fill={k.line} />
      <Rect x={118} y={126} width={42} height={6} rx={3} fill={k.acc} />
      <Circle cx={160} cy={129} r={9} fill={k.acc} stroke={k.bg} strokeWidth={2.5} />
      <Circle cx={119} cy={146} r={2.4} fill={k.muted} />
      <Circle cx={181} cy={146} r={5} fill={k.muted} />
      <Rect x={136} y={156} width={28} height={3.5} rx={1.75} fill={k.line} />
      <L42Cap k={k} s="Seven times a day, for a week" />
    </Frame>
  );
}

/* ---------- 5. every game, a little lower ---------- */
function L42Drop({ k }: { k: Ink }) {
  const p = L42useGrow(450, 1400);
  const afterH = 100 - 38 * p;
  return (
    <Frame label="Two bars side by side. The taller bar is labeled Before and the shorter bar is labeled After the game. A small down arrow points from the level of the tall bar's top to the top of the shorter one, and a small block puzzle board stands beside the shorter bar.">
      <Line x1={30} y1={150} x2={270} y2={150} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      <Rect x={50} y={50} width={60} height={100} rx={9} fill={k.ink} opacity={0.85} />
      <Rect x={140} y={150 - afterH} width={60} height={afterH} rx={9} fill={k.acc} />
      <Line x1={114} y1={50} x2={206} y2={50} stroke={k.muted} strokeWidth={2} strokeDasharray="3 5" strokeLinecap="round" />
      <G opacity={Math.min(1, p * 1.6)}>
        <Path d="M170 56 V80 M162 73 L170 82 L178 73" stroke={k.ink} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </G>
      <L42Board id="l42-b5" x={218} y={102} cell={8} cols={4} rows={6} stack={2} row={1.2} piece={L42_L} pieceCol={1} pieceColor={L42_COLORS[0]} />
      <Say x={80} y={166} s="Before" fill={k.ink} size={11} />
      <Say x={170} y={166} s="After the game" fill={k.ink} size={11} />
      <L42Cap k={k} s="Every game, a little lower" />
    </Frame>
  );
}

/* ---------- 6. fewer flashbacks ---------- */
function L42Er({ k }: { k: Ink }) {
  const chair = '#8A93A8';
  const chairDk = '#6F7890';
  return (
    <Frame label="A calm hospital waiting area. A person sits on a chair holding a small handheld game that shows colorful blocks. An empty chair, a plant, and a small cross sign on the wall complete the room.">
      <Rect x={14} y={12} width={272} height={150} rx={14} fill={k.soft} />
      <Rect x={14} y={150} width={272} height={12} rx={6} fill={k.line} opacity={0.5} />
      <G>
        <Rect x={230} y={30} width={34} height={34} rx={7} fill={L42_WHITE} stroke={k.line} strokeWidth={1.6} />
        <Path d="M247 37 V57 M237 47 H257" stroke={L42_RED} strokeWidth={7} strokeLinecap="round" />
      </G>
      <G>
        <Rect x={44} y={96} width={5} height={54} rx={2.5} fill={chairDk} />
        <Rect x={85} y={96} width={5} height={54} rx={2.5} fill={chairDk} />
        <Rect x={38} y={102} width={58} height={9} rx={4} fill={chair} />
        <Rect x={34} y={58} width={9} height={52} rx={4.5} fill={chair} />
      </G>
      <G>
        <Rect x={116} y={84} width={9} height={58} rx={4.5} fill={chair} />
        <Rect x={122} y={140} width={4} height={20} rx={2} fill={chairDk} />
        <Rect x={170} y={140} width={4} height={20} rx={2} fill={chairDk} />
        <Rect x={118} y={132} width={62} height={9} rx={4} fill={chair} />
      </G>
      <Rect x={134} y={84} width={8} height={9} fill={L42_SKIN} />
      <Rect x={127} y={88} width={24} height={42} rx={11} fill={L42_SHIRT} />
      <Rect x={132} y={120} width={48} height={14} rx={7} fill={L42_FIG} />
      <Rect x={172} y={126} width={12} height={34} rx={6} fill={L42_FIG} />
      <Ellipse cx={186} cy={160} rx={10} ry={4} fill={k.ink} />
      <Circle cx={140} cy={74} r={12} fill={L42_SKIN} />
      <Circle cx={152} cy={77} r={2.2} fill={L42_SKIN} />
      <Path d="M128 75 Q127 61 141 61 Q152 62 153 70 Q143 66 135 72 Q133 79 128 75 Z" fill={L42_FIG} />
      <Circle cx={147} cy={75} r={1.3} fill={L42_FIG} />
      <Path d="M140 96 Q147 114 160 108" stroke={L42_SHIRT} strokeWidth={8} strokeLinecap="round" fill="none" />
      <G transform="translate(168 102) rotate(-12)">
        <Rect x={-15} y={-9} width={30} height={18} rx={5} fill={L42_FIG} />
        <Rect x={-11} y={-6} width={22} height={12} rx={2.5} fill={L42_BOARD} />
        <L42Block x={-10} y={-5} c={5} color={L42_COLORS[1]} />
        <L42Block x={-5} y={-5} c={5} color={L42_COLORS[1]} />
        <L42Block x={0} y={-5} c={5} color={L42_COLORS[1]} />
        <L42Block x={-5} y={0} c={5} color={L42_COLORS[1]} />
        <L42Block x={5} y={0} c={5} color={L42_COLORS[3]} />
        <L42Block x={-10} y={0} c={5} color={L42_COLORS[2]} />
      </G>
      <Circle cx={158} cy={110} r={3.6} fill={L42_SKIN} />
      <G>
        <Path d="M232 150 L236 128 H258 L262 150 Z" fill="#B0714A" />
        <Path d="M247 128 Q232 112 236 92 Q246 102 247 128 Z" fill={L42_GREEN} />
        <Path d="M247 128 Q262 108 258 88 Q248 100 247 128 Z" fill="#6CB27A" />
        <Path d="M247 128 Q244 104 248 84 Q252 106 247 128 Z" fill={L42_GREEN} />
      </G>
      <L42Cap k={k} s="Fewer flashbacks" />
    </Frame>
  );
}

/* ---------- 7. no room left for the picture ---------- */
function L42Full({ k }: { k: Ink }) {
  const p = L42useGrow(500, 1600);
  return (
    <Frame label="A head in profile whose inner screen is now filled by the block puzzle. Outside the head, to the right, a faint glowing blob that was squeezed out drifts away and fades.">
      <L42Head k={k} x={112} y={110} s={1.75}>
        <L42Board
          id="l42-b7"
          x={L42_SX + 1.2}
          y={L42_SY + 0.4}
          cell={5.6}
          cols={6}
          rows={7}
          stack={4}
          row={0.3 + 1.4 * p}
          piece={L42_T}
          pieceCol={2}
          pieceColor={L42_COLORS[3]}
        />
        <Rect x={L42_SX} y={L42_SY} width={L42_SW} height={L42_SH} rx={5} fill="none" stroke={k.line} strokeWidth={1.2} />
      </L42Head>
      <L42Blob cx={206 + 8 * p} cy={66 - 3 * p} r={10} op={0.42 - 0.12 * p} sharp={false} />
      <L42Blob cx={234 + 10 * p} cy={52 - 4 * p} r={7} op={0.26 - 0.1 * p} sharp={false} />
      <L42Blob cx={258 + 10 * p} cy={42 - 4 * p} r={4.5} op={0.14 - 0.06 * p} sharp={false} />
      <L42Cap k={k} s="No room left for the picture" />
    </Frame>
  );
}

/* ---------- 8. plain things for the eyes ---------- */
function L42Phone({ k, x, id, children }: { k: Ink; x: number; id: string; children: ReactNode }) {
  return (
    <G>
      <Defs>
        <ClipPath id={id}>
          <Rect x={x + 5} y={27} width={82} height={130} rx={11} />
        </ClipPath>
      </Defs>
      <Rect x={x} y={22} width={92} height={140} rx={15} fill={k.ink} />
      <Rect x={x + 5} y={27} width={82} height={130} rx={11} fill={k.bg} />
      <G clipPath={`url(#${id})`}>{children}</G>
    </G>
  );
}
function L42Plain({ k }: { k: Ink }) {
  const col1 = [34, 26, 32, 24];
  const col2 = [22, 38, 26, 30];
  const tiles = (hs: number[], x: number, off: number) => {
    let y = 32;
    return hs.map((h, i) => {
      const ty = y;
      y += h + 3;
      return (
        <G key={x + '-' + i}>
          <Rect x={x} y={ty} width={37} height={h} rx={6} fill={L42_COLORS[(i * 2 + off) % 5]} />
          <Circle cx={x + 10} cy={ty + 9} r={3.5} fill={L42_WHITE} opacity={0.35} />
        </G>
      );
    });
  };
  return (
    <Frame label="Two phones side by side. The left shows a crowded feed of many small colorful tiles and a play icon, with a soft gray x mark. The right shows the plain block puzzle with a small green check mark.">
      <L42Phone k={k} x={38} id="l42-pl">
        {tiles(col1, 46, 0)}
        {tiles(col2, 86, 1)}
        <Circle cx={104.5} cy={76} r={10} fill={L42_WHITE} opacity={0.92} />
        <Path d="M101 70.5 L110 76 L101 81.5 Z" fill={L42_FIG} strokeLinejoin="round" />
      </L42Phone>
      <L42Phone k={k} x={170} id="l42-pr">
        <L42Board id="l42-b8" x={189} y={47} cell={9} row={1.5} stack={3} piece={L42_T} pieceCol={2} pieceColor={L42_COLORS[4]} />
      </L42Phone>
      <Circle cx={132} cy={26} r={11} fill={L42_GRAY} />
      <Path d="M127.5 21.5 L136.5 30.5 M136.5 21.5 L127.5 30.5" stroke={L42_WHITE} strokeWidth={2.6} strokeLinecap="round" />
      <Circle cx={264} cy={26} r={11} fill={L42_GREEN} />
      <Path d="M258.5 26.5 L262.5 30.5 L270 22" stroke={L42_WHITE} strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <L42Cap k={k} s="Plain things for the eyes" />
    </Frame>
  );
}

export const SCENES_G42: Record<string, ComponentType<{ k: Ink }>> = {
  'l42-picture': L42Picture,
  'l42-screen': L42Screen,
  'l42-blocks': L42Blocks,
  'l42-texts': L42Texts,
  'l42-drop': L42Drop,
  'l42-er': L42Er,
  'l42-full': L42Full,
  'l42-plain': L42Plain,
};
