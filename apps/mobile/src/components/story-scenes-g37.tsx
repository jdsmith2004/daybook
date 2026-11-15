/* Scenes for lesson 37 told as a story (see story-kit.tsx): "Who you are becoming", a word taken apart. "Character" comes from the Greek
   kharaktēr, the engraver's tool and the mark it cuts. The die is cut with many small strokes and then stamps every coin. One slipped
   stroke does not undo the hundred before it. */
import { useEffect, useState, type ComponentType } from 'react';
import { Easing } from 'react-native';
import { Circle, ClipPath, Defs, Ellipse, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';

import { useAppear, useReducedMotion } from '@/lib/motion';
import { font } from '@/lib/theme';

import { Frame, type Ink, Say } from './story-kit';

const L37_GOLD = '#FFD25A';
const L37_GOLD2 = '#E8B730';
const L37_GOLD_RIM = '#B8860B';
const L37_DIE = '#B9BEC8';
const L37_DIE_RIM = '#8A909D';
const L37_DIE_RING = '#A2A8B5';
const L37_CUT = '#555C6B';
const L37_CUT_HI = '#EEF0F5';
const L37_STEEL = '#C9CED8';
const L37_STEEL_DK = '#7B8190';
const L37_IRON = '#6C7280';
const L37_IRON_HI = '#838998';
const L37_WOOD = '#A8703A';
const L37_WOOD_DK = '#7C5028';
const L37_WOOD_HI = '#C99560';
const L37_BRICK = '#C2643C';
const L37_RED = '#C2410C';
const L37_WHITE = '#FFFFFF';

/* a number from 0 to 1 that eases up once, after a short pause; with Reduce Motion on it starts at 1 */
function L37useGrow(delay = 300, dur = 1200) {
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
function L37Cap({ k, s }: { k: Ink; s: string }) {
  return <Say x={150} y={190} s={s} fill={k.ink} />;
}

/* a tiny plain word in a picture */
function L37Word({
  x,
  y,
  s,
  fill,
  anchor = 'middle',
  size = 10,
}: {
  x: number;
  y: number;
  s: string;
  fill: string;
  anchor?: 'start' | 'middle' | 'end';
  size?: number;
}) {
  return (
    <SvgText x={x} y={y} fontSize={size} fontWeight="700" fill={fill} textAnchor={anchor} fontFamily={font.bodyBold}>
      {s}
    </SvgText>
  );
}

/* a little four-point sparkle */
function L37Spark({ x, y, r, fill = L37_WHITE, opacity = 0.9 }: { x: number; y: number; r: number; fill?: string; opacity?: number }) {
  const q = r * 0.22;
  return (
    <Path
      d={`M${x} ${y - r} Q${x + q} ${y - q} ${x + r} ${y} Q${x + q} ${y + q} ${x} ${y + r} Q${x - q} ${y + q} ${x - r} ${y} Q${x - q} ${y - q} ${x} ${y - r} Z`}
      fill={fill}
      opacity={opacity}
    />
  );
}

/* ---------- the face on the die: a portrait in profile, like the head on a coin ---------- */
/* Drawn in a unit space with the middle of the die at 0, 0 and the die's radius as 1, the head facing right. The portrait is one continuous
   engraved outline (the front: crown, forehead, brow, nose, lips, chin, throat, neck; then the back of the head and nape), cut first, with
   short hatch strokes inside it as shading (hair, the back of the head, the neck) cut after. `p` (0 to 1) is how far the whole face is cut:
   the outline takes the first 55 percent and the shading the rest. */
type L37Pt = [number, number];
const L37_FRONT_RAW: L37Pt[] = [
  [0.0, -0.62],
  [0.1, -0.58],
  [0.17, -0.5],
  [0.2, -0.4],
  [0.22, -0.3],
  [0.18, -0.24],
  [0.24, -0.1],
  [0.38, 0.03],
  [0.27, 0.08],
  [0.29, 0.14],
  [0.25, 0.19],
  [0.29, 0.24],
  [0.24, 0.3],
  [0.28, 0.4],
  [0.2, 0.47],
  [0.07, 0.5],
  [0.09, 0.6],
  [0.1, 0.7],
];
const L37_BACK_RAW: L37Pt[] = [
  [0.0, -0.62],
  [-0.24, -0.55],
  [-0.4, -0.38],
  [-0.47, -0.1],
  [-0.45, 0.14],
  [-0.36, 0.34],
  [-0.24, 0.5],
  [-0.24, 0.7],
];
/* a little larger, and moved so the head sits in the middle of the disc */
const l37Fit = (pts: L37Pt[]): L37Pt[] => pts.map(([a, b]) => [a * 1.1 + 0.05, b * 1.1]);
const L37_FRONT = l37Fit(L37_FRONT_RAW);
const L37_BACK = l37Fit(L37_BACK_RAW);
/* a smooth curve through the points (Catmull-Rom), sampled finely */
function l37Smooth(pts: L37Pt[], per = 5): L37Pt[] {
  const out: L37Pt[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let j = 0; j < per; j++) {
      const t = j / per;
      const t2 = t * t;
      const t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}
const L37_FRONT_S = l37Smooth(L37_FRONT);
const L37_BACK_S = l37Smooth(L37_BACK);
/* the whole outline in cutting order: the front first, then the back; `L37_BREAK` is where the back begins */
const L37_LINE: L37Pt[] = [...L37_FRONT_S, ...L37_BACK_S];
const L37_BREAK = L37_FRONT_S.length;
const l37Lerp = (pts: L37Pt[], y: number) => {
  if (y <= pts[0][1]) return pts[0][0];
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i];
    const [bx, by] = pts[i + 1];
    if (y <= by) return ax + ((bx - ax) * (y - ay)) / (by - ay);
  }
  return pts[pts.length - 1][0];
};
const l37Xo = (y: number) => l37Lerp(L37_FRONT, y);
const l37Xb = (y: number) => l37Lerp(L37_BACK, y);
/* the shading and the small details of the face: [x1, y1, x2, y2], sorted from the top down */
const L37_HATCH: Array<[number, number, number, number]> = (() => {
  const all: Array<[number, number, number, number]> = [];
  for (let i = 0; i < 20; i++) {
    const y = -0.52 + i * 0.062;
    const xl = l37Xb(y) + 0.045;
    /* the front of the face stays clear and bright; shading is the hair, the back of the head and the neck */
    const clear = y > -0.38 && y < 0.48;
    const xr = clear ? -0.03 : l37Xo(y) - 0.045;
    let x2 = xr - (i % 2) * 0.06;
    while (x2 - 0.13 > xl) {
      all.push([x2 - 0.13, y + 0.035, x2, y - 0.01]);
      x2 -= 0.17;
    }
  }
  all.push([0.1, -0.17, 0.17, -0.16]);
  return all.sort((a, b) => a[1] + a[3] - (b[1] + b[3]) || a[0] - b[0]);
})();
const L37_H = L37_HATCH.length;
const L37_SPLIT = 0.55;

/* how many outline points and hatch strokes are cut at progress p */
function l37Cut(p: number): [number, number] {
  const q = Math.max(0, Math.min(1, p));
  const m = Math.round(Math.min(1, q / L37_SPLIT) * (L37_LINE.length - 1)) + 1;
  const n = q > L37_SPLIT ? Math.round(((q - L37_SPLIT) / (1 - L37_SPLIT)) * L37_H) : 0;
  return [q <= 0 ? 0 : m, n];
}

/* where the newest stroke ends, in the picture's own units */
function l37Tip(x: number, y: number, r: number, p: number): [number, number] {
  const [m, n] = l37Cut(p);
  if (n > 0) {
    const s = L37_HATCH[n - 1];
    return [x + s[2] * r, y + s[3] * r];
  }
  const pt = L37_LINE[Math.max(1, m) - 1];
  return [x + pt[0] * r, y + pt[1] * r];
}

/* the cut part of the portrait: a darker groove with a thin light edge beside it */
function L37Face({ x, y, r, p, dark, light }: { x: number; y: number; r: number; p: number; dark: string; light: string }) {
  const [m, n] = l37Cut(p);
  let out = '';
  for (let i = 0; i < m; i++) {
    const [a, b] = L37_LINE[i];
    out += `${i === 0 || i === L37_BREAK ? 'M' : 'L'}${(x + a * r).toFixed(1)} ${(y + b * r).toFixed(1)}`;
  }
  let hat = '';
  for (let i = 0; i < n; i++) {
    const [a, b, c, d] = L37_HATCH[i];
    hat += `M${(x + a * r).toFixed(1)} ${(y + b * r).toFixed(1)}L${(x + c * r).toFixed(1)} ${(y + d * r).toFixed(1)}`;
  }
  const lo = Math.max(1, r * 0.04);
  const lh = Math.max(0.6, r * 0.022);
  const off = Math.max(0.5, r * 0.014);
  return (
    <G strokeLinecap="round" strokeLinejoin="round" fill="none">
      <G transform={`translate(${off} ${off})`} opacity={0.85}>
        {out ? <Path d={out} stroke={light} strokeWidth={lo} /> : null}
        {hat ? <Path d={hat} stroke={light} strokeWidth={lh} /> : null}
      </G>
      {out ? <Path d={out} stroke={dark} strokeWidth={lo} /> : null}
      {hat ? <Path d={hat} stroke={dark} strokeWidth={lh} /> : null}
    </G>
  );
}

/* ---------- the die: a round disc of metal with the face cut into it as far as `progress` (0 to 1) ---------- */
function L37Die({ x, y, r, progress }: { x: number; y: number; r: number; progress: number }) {
  const rim = Math.max(1.6, r * 0.07);
  return (
    <G>
      <Circle cx={x} cy={y} r={r} fill={L37_DIE} stroke={L37_DIE_RIM} strokeWidth={rim} />
      <Circle cx={x} cy={y} r={r * 0.87} fill="none" stroke={L37_DIE_RING} strokeWidth={0.8} />
      <Path
        d={`M${x - 0.752 * r} ${y - 0.274 * r} A${0.8 * r} ${0.8 * r} 0 0 1 ${x - 0.274 * r} ${y - 0.752 * r}`}
        stroke={L37_WHITE}
        strokeWidth={Math.max(1.2, rim * 0.5)}
        strokeLinecap="round"
        fill="none"
        opacity={0.55}
      />
      <L37Face x={x} y={y} r={r} p={progress} dark={L37_CUT} light={L37_CUT_HI} />
    </G>
  );
}

/* ---------- the graver: a short wooden handle with a thin steel point ---------- */
/* (x, y) is the point; `rot` is the direction the handle runs away from it, in degrees (0 is to the right); about 63 long at scale 1 */
function L37Tool({ x, y, rot = 0, s = 1 }: { x: number; y: number; rot?: number; s?: number }) {
  return (
    <G transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <Path d="M0 1.7 L9 -1.7 L28 -1.7 L28 1.7 Z" fill={L37_STEEL} stroke={L37_STEEL_DK} strokeWidth={0.6} strokeLinejoin="round" />
      <Path d="M10 -0.6 H27" stroke={L37_WHITE} strokeWidth={0.7} strokeLinecap="round" opacity={0.8} />
      <Rect x={27} y={-3.2} width={4.4} height={6.4} rx={1.2} fill={L37_STEEL_DK} />
      <Path
        d="M31 -2.6 Q44 -6.6 58 -5.6 Q63 -3.5 63 0 Q63 3.5 58 5.6 Q44 6.6 31 2.6 Z"
        fill={L37_WOOD}
        stroke={L37_WOOD_DK}
        strokeWidth={0.8}
        strokeLinejoin="round"
      />
      <Path d="M34 -2.4 Q46 -5.2 58 -4.2" stroke={L37_WOOD_HI} strokeWidth={1.2} strokeLinecap="round" fill="none" />
    </G>
  );
}

/* a gold coin with the same head stamped on it, a small raised silhouette */
function L37Coin({ x, y, r }: { x: number; y: number; r: number }) {
  const u = r * 0.88;
  const pt = (q: L37Pt) => `${(x + q[0] * u).toFixed(1)} ${(y + 0.02 * u + q[1] * u).toFixed(1)}`;
  const sil = `M${L37_FRONT_S.map(pt).join('L')}L${[...L37_BACK_S].reverse().map(pt).join('L')}Z`;
  const edge = `M${L37_FRONT_S.slice(0, 62)
    .map((q): L37Pt => [q[0] - 0.05, q[1] - 0.02])
    .map(pt)
    .join('L')}`;
  return (
    <G>
      <Ellipse cx={x + 1} cy={y + r + 0.5} rx={r * 0.9} ry={1.8} fill="#000000" opacity={0.14} />
      <Circle cx={x} cy={y} r={r} fill={L37_GOLD} stroke={L37_GOLD_RIM} strokeWidth={1.2} />
      <Circle cx={x} cy={y} r={r * 0.8} fill="none" stroke={L37_GOLD2} strokeWidth={0.9} />
      <Path
        d={`M${x - 0.75 * r} ${y - 0.26 * r} A${0.8 * r} ${0.8 * r} 0 0 1 ${x - 0.26 * r} ${y - 0.75 * r}`}
        stroke={L37_WHITE}
        strokeWidth={1.2}
        strokeLinecap="round"
        fill="none"
        opacity={0.6}
      />
      <Path d={sil} fill={L37_GOLD_RIM} stroke={L37_GOLD_RIM} strokeWidth={0.6} strokeLinejoin="round" />
      <Path d={edge} stroke="#FFE9A0" strokeWidth={0.8} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.9} />
    </G>
  );
}

/* a profile figure, standing or walking, drawn in strokes; origin at the ground under the hips, facing right */
function L37Walker({ x, y, s = 1, fill }: { x: number; y: number; s?: number; fill: string }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`} stroke={fill} strokeLinecap="round" strokeLinejoin="round" fill="none">
      <Path d="M0 -30 L-5 -15 L-13 -1" strokeWidth={6.4} />
      <Path d="M0 -30 L9 -15 L15 -1" strokeWidth={6.4} />
      <Path d="M-14 -1 H-7 M15 -1 H22" strokeWidth={4} />
      <Path d="M0 -30 L4 -55" strokeWidth={11} />
      <Path d="M4 -53 L-4 -43 L-11 -36" strokeWidth={4.2} />
      <Path d="M4 -53 L13 -44 L19 -37" strokeWidth={4.2} />
      <Circle cx={6} cy={-67} r={7.6} fill={fill} stroke="none" />
    </G>
  );
}

/* ---------- 1. the engraver ---------- */
function L37Engraver({ k }: { k: Ink }) {
  const dx = 208;
  const dy = 88;
  const dr = 32;
  const prog = 0.1;
  const [tx, ty] = l37Tip(dx, dy, dr, prog);
  const rot = 158;
  const ts = 0.72;
  const hl = 0.52 * 63 * ts;
  const hx = tx + hl * Math.cos((rot * Math.PI) / 180);
  const hy = ty + hl * Math.sin((rot * Math.PI) / 180);
  return (
    <Frame label="An engraver sits at a workbench in profile, bent over, a graver in his hand with its point on a large round metal die clamped to the bench. A small lamp hangs above and lights the die. A tiny label by the tool reads kharaktēr.">
      <Path d="M188 36 L212 36 L246 124 L150 124 Z" fill={L37_GOLD} opacity={0.12} />
      <Line x1={200} y1={0} x2={200} y2={19} stroke={k.muted} strokeWidth={1.4} />
      <Path d="M187 37 Q187 21 200 19 Q213 21 213 37 Z" fill="#4A5060" />
      <Ellipse cx={200} cy={38} rx={7} ry={2.6} fill={L37_GOLD} />
      <Rect x={96} y={124} width={198} height={9} rx={2} fill={L37_WOOD} />
      <Rect x={96} y={124} width={198} height={2.4} rx={1.2} fill={L37_WOOD_HI} opacity={0.7} />
      <Rect x={106} y={133} width={6} height={34} fill={L37_WOOD_DK} />
      <Rect x={278} y={133} width={6} height={34} fill={L37_WOOD_DK} />
      <Line x1={8} y1={168} x2={292} y2={168} stroke={k.line} strokeWidth={2} strokeLinecap="round" />
      <Rect x={186} y={118} width={44} height={8} rx={2} fill={L37_IRON} />
      <L37Die x={dx} y={dy} r={dr} progress={prog} />
      <Rect x={180} y={106} width={9} height={18} rx={2.4} fill={L37_IRON_HI} />
      <Rect x={227} y={106} width={9} height={18} rx={2.4} fill={L37_IRON_HI} />
      <Rect x={42} y={144} width={32} height={5} rx={2} fill={L37_WOOD_DK} />
      <Rect x={47} y={149} width={4} height={19} fill={L37_WOOD_DK} />
      <Rect x={65} y={149} width={4} height={19} fill={L37_WOOD_DK} />
      <G stroke={k.ink} strokeLinecap="round" strokeLinejoin="round" fill="none">
        <Path d="M56 142 L88 142 L90 165" strokeWidth={8.4} />
        <Path d="M90 165 H98" strokeWidth={4.4} />
        <Path d="M56 140 L92 108" strokeWidth={17} />
      </G>
      <Circle cx={101} cy={92} r={10} fill={k.ink} />
      <Path d="M109 88 L116 93.5 L109 96 Z" fill={k.ink} />
      <G stroke={k.ink} strokeLinecap="round" strokeLinejoin="round" fill="none">
        <Path d={`M94 108 L${(94 + hx) / 2 - 2} ${(108 + hy) / 2 + 17} L${hx} ${hy}`} strokeWidth={6} />
      </G>
      <L37Tool x={tx} y={ty} rot={rot} s={ts} />
      <Circle cx={hx} cy={hy} r={3.8} fill={k.ink} />
      <L37Word x={166} y={74} s="kharaktēr" fill={k.muted} anchor="end" size={10} />
      <L37Cap k={k} s="Character: a mark cut in" />
    </Frame>
  );
}

/* ---------- 2. one small stroke at a time ---------- */
function L37Strokes({ k }: { k: Ink }) {
  const p = L37useGrow(450, 3000);
  const prog = 0.06 + 0.34 * p;
  const cx = 150;
  const cy = 92;
  const r = 76;
  const [tx, ty] = l37Tip(cx, cy, r, prog);
  return (
    <Frame label="A close-up of a round metal die. Half of a face in profile is cut into it with many short fine strokes: the brow, the nose and the lips. The rest of the metal is still blank. The point of a graver rests at the edge of the newest stroke.">
      <L37Die x={cx} y={cy} r={r} progress={prog} />
      <L37Tool x={tx} y={ty} rot={-30} s={1.3} />
      <L37Cap k={k} s="One small stroke at a time" />
    </Frame>
  );
}

/* ---------- 3. the same mark on every coin ---------- */
function L37Coins({ k }: { k: Ink }) {
  const coinXs = [168, 195, 222, 249, 276];
  return (
    <Frame label="On the left, the finished round die sits above a small metal press. On the right, a row of five gold coins stands on a wooden step, and every coin is stamped with the same profile face. An arrow runs from the die to the coins.">
      <Rect x={0} y={150} width={300} height={22} fill={k.soft} opacity={0.6} />
      <Line x1={0} y1={150} x2={300} y2={150} stroke={k.line} strokeWidth={2} />
      <Rect x={32} y={134} width={76} height={16} rx={3} fill={L37_IRON} />
      <Rect x={53} y={116} width={34} height={19} fill={L37_IRON_HI} />
      <Rect x={50} y={113} width={40} height={5} rx={2} fill={L37_IRON} />
      <L37Die x={70} y={74} r={40} progress={1} />
      <Rect x={148} y={112} width={146} height={38} rx={2} fill={L37_WOOD} />
      <Rect x={148} y={112} width={146} height={3} fill={L37_WOOD_HI} opacity={0.7} />
      {coinXs.map((cx) => (
        <L37Coin key={cx} x={cx} y={98} r={13} />
      ))}
      <Path d="M116 56 Q172 12 224 68" stroke={k.muted} strokeWidth={2} strokeLinecap="round" strokeDasharray="5 5" fill="none" />
      <Path d="M229 73 L217 71 M229 73 L225 61" stroke={k.muted} strokeWidth={2} strokeLinecap="round" fill="none" />
      <L37Cap k={k} s="The same mark on every coin" />
    </Frame>
  );
}

/* ---------- 4. builders, by building ---------- */
const L37_ROW_LEFT = [138, 138, 168, 198, 228, 258];
const L37_BRICKS = ['#C2643C', '#B85A34', '#CC7048'];
function L37Brick({ x, y, w = 30, h = 14, tone = 0 }: { x: number; y: number; w?: number; h?: number; tone?: number }) {
  return (
    <G>
      <Rect x={x + 0.7} y={y + 0.7} width={w - 1.4} height={h - 1.4} rx={1.6} fill={tone === 0 ? L37_BRICK : L37_BRICKS[tone % 3]} />
      <Rect x={x + 2} y={y + 1.2} width={w - 4} height={2} rx={1} fill={L37_WHITE} opacity={0.18} />
    </G>
  );
}
function L37Builder({ k }: { k: Ink }) {
  const ground = 158;
  const bricks: Array<{ key: string; x: number; y: number; w: number; tone: number }> = [];
  L37_ROW_LEFT.forEach((left, r) => {
    const o = (r % 2) * 15;
    for (let bx = left - o, i = 0; bx < 288; bx += 30, i++) {
      const x1 = Math.max(bx, left);
      const x2 = Math.min(bx + 30, 288);
      if (x2 - x1 > 2) bricks.push({ key: `${r}-${i}`, x: x1, y: ground - (r + 1) * 14, w: x2 - x1, tone: (r * 3 + i) % 3 });
    }
  });
  return (
    <Frame label="A bricklayer in a yellow hard hat stands beside a half-built wall of warm red bricks that steps up to the right, and lays one more brick on its low end. A small stack of bricks waits beside him.">
      <Circle cx={44} cy={38} r={22} fill={L37_GOLD} opacity={0.22} />
      <Circle cx={44} cy={38} r={13} fill={L37_GOLD} />
      <Rect x={0} y={ground} width={300} height={14} fill={k.soft} opacity={0.6} />
      <Line x1={0} y1={ground} x2={300} y2={ground} stroke={k.line} strokeWidth={2} />
      {bricks.map((b) => (
        <L37Brick key={b.key} x={b.x} y={b.y} w={b.w} tone={b.tone} />
      ))}
      <L37Brick x={10} y={ground - 14} tone={1} />
      <L37Brick x={40} y={ground - 14} tone={2} />
      <L37Brick x={25} y={ground - 28} tone={0} />
      <G stroke={k.ink} strokeLinecap="round" strokeLinejoin="round" fill="none">
        <Path d="M108 128 L112 144 L116 156 M108 128 L103 144 L98 156" strokeWidth={7} />
        <Path d="M116 157 H123 M97 157 H104" strokeWidth={4} />
        <Path d="M108 130 L114 102" strokeWidth={13} />
        <Path d="M114 104 L119 115 L135 119" strokeWidth={5.4} />
      </G>
      <Circle cx={118} cy={89} r={9.5} fill={k.ink} />
      <Path d="M127 88 L132.5 91 L127 93.5 Z" fill={k.ink} />
      <Path d="M107.5 86 Q118 70 129 86 Z" fill="#F2B632" />
      <Rect x={105} y={85} width={26} height={3.2} rx={1.6} fill="#D9971B" />
      <G transform="translate(138 112) rotate(-7)">
        <L37Brick x={0} y={0} tone={0} />
      </G>
      <Circle cx={135} cy={119} r={3.8} fill={k.ink} />
      <L37Cap k={k} s="Builders, by building" />
    </Frame>
  );
}

/* ---------- 5. each choice is a stroke ---------- */
function L37Choice({ k }: { k: Ink }) {
  const marks = Array.from({ length: 31 }, (_, i) => 15 + i * 9);
  const picked = [60, 150, 240];
  return (
    <Frame label="A long strip of metal across the top is covered in a row of small cut strokes, like the marks on an engraver's die. Three of the strokes are darker, and a thin line runs down from each to a small everyday thing: a phone set down face-down, a paper plane for a message sent, and a calm wave line for an urge ridden out.">
      <Rect x={8} y={16} width={284} height={42} rx={10} fill={L37_DIE} stroke={L37_DIE_RIM} strokeWidth={2.5} />
      {marks.map((mx) =>
        picked.includes(mx) ? null : (
          <Path key={mx} d={`M${mx - 2.5} ${37 + 8} L${mx + 2.5} ${37 - 8}`} stroke={L37_CUT} strokeWidth={1.3} strokeLinecap="round" opacity={0.65} />
        ),
      )}
      {picked.map((mx) => (
        <G key={mx}>
          <Path d={`M${mx - 3} ${37 + 14} L${mx + 3} ${37 - 14}`} stroke="#2F3542" strokeWidth={2.8} strokeLinecap="round" />
          <Line x1={mx} y1={58} x2={mx} y2={mx === 150 ? 92 : mx === 60 ? 88 : 90} stroke={k.muted} strokeWidth={1.2} />
        </G>
      ))}
      {/* a phone set down face-down: its back, with the camera */}
      <Ellipse cx={62} cy={147} rx={22} ry={3} fill={k.ink} opacity={0.12} />
      <Rect x={45} y={92} width={30} height={54} rx={6} fill="#3A4052" stroke="#232734" strokeWidth={1.2} />
      <Rect x={49} y={96} width={13} height={13} rx={3.4} fill="#2A2F3E" />
      <Circle cx={53.4} cy={100.2} r={2.4} fill="#5B6378" />
      <Circle cx={58} cy={105} r={2.4} fill="#5B6378" />
      <Circle cx={60} cy={126} r={4.2} fill="#4B5266" />
      {/* a paper plane: a message sent */}
      <G transform="translate(150 120) scale(1.5)">
        <Path d="M-30 12 Q-40 20 -52 16" stroke={k.muted} strokeWidth={1.2} strokeLinecap="round" fill="none" opacity={0.7} />
        <Path d="M26 -16 L-26 -4 L2 4 Z" fill="#F4F6FA" stroke={k.line} strokeWidth={0.8} strokeLinejoin="round" />
        <Path d="M26 -16 L2 4 L-6 18 Z" fill="#C9D0DE" stroke={k.line} strokeWidth={0.8} strokeLinejoin="round" />
        <Path d="M26 -16 L2 4" stroke={L37_STEEL_DK} strokeWidth={0.8} />
      </G>
      {/* a calm wave: an urge ridden out */}
      <Line x1={196} y1={126} x2={290} y2={126} stroke={k.line} strokeWidth={1.2} strokeLinecap="round" />
      <Path
        d="M200 126 C214 126 222 96 240 96 C258 96 262 122 270 122 C276 122 280 118 288 120"
        stroke="#4DA3A0"
        strokeWidth={3.2}
        strokeLinecap="round"
        fill="none"
      />
      <L37Word x={62} y={164} s="Phone down" fill={k.muted} />
      <L37Word x={150} y={164} s="Sent" fill={k.muted} />
      <L37Word x={242} y={164} s="Urge ridden out" fill={k.muted} />
      <L37Cap k={k} s="Each choice is a stroke" />
    </Frame>
  );
}

/* ---------- 6. one slip, and the face is still there ---------- */
function L37Slip({ k }: { k: Ink }) {
  const cx = 138;
  const cy = 92;
  const r = 72;
  const px = (u: number) => cx + u * r;
  const py = (v: number) => cy + v * r;
  return (
    <Frame label="A round metal die with a whole face in profile cut into it. One short stroke in red went wrong on the cheek, but the outline all around it is whole and the face stands clear. The graver is already cutting the next stroke in place beside it.">
      <L37Die x={cx} y={cy} r={r} progress={1} />
      <Path d={`M${px(0.02)} ${py(0.0)} L${px(0.15)} ${py(0.1)}`} stroke={L37_RED} strokeWidth={3.2} strokeLinecap="round" />
      <Path d={`M${px(0.0)} ${py(0.27)} L${px(0.12)} ${py(0.21)}`} stroke={L37_CUT} strokeWidth={2.4} strokeLinecap="round" />
      <L37Tool x={px(0.12)} y={py(0.21)} rot={160} s={1.3} />
      <L37Cap k={k} s="One slip, and the face is still there" />
    </Frame>
  );
}

/* ---------- 7. answer to the one you are cutting ---------- */
function L37Names({ k }: { k: Ink }) {
  const p = L37useGrow(350, 1600);
  const gx = 232;
  const gy = 84;
  return (
    <Frame label="A figure walks forward to the right. Behind, on the left, a faded gray speech bubble with a scribbled line in it trails away: the old name. Ahead stands a clear round die with a face nearly finished cut into it, glowing softly.">
      <Defs>
        <ClipPath id="l37-names-glow">
          <Circle cx={gx} cy={gy} r={68} />
        </ClipPath>
      </Defs>
      <Rect x={0} y={150} width={300} height={22} fill={k.soft} opacity={0.6} />
      <Line x1={0} y1={150} x2={300} y2={150} stroke={k.line} strokeWidth={2} />
      <G clipPath="url(#l37-names-glow)">
        <Circle cx={gx} cy={gy} r={50 + 22 * p} fill={L37_GOLD} opacity={0.08 + 0.04 * p} />
        <Circle cx={gx} cy={gy} r={46 + 14 * p} fill={L37_GOLD} opacity={0.1 + 0.05 * p} />
      </G>
      <Path d="M214 150 L220 128 H244 L250 150 Z" fill={L37_IRON} />
      <L37Die x={gx} y={gy} r={46} progress={0.92} />
      <L37Spark x={282} y={42} r={5} fill={L37_GOLD} opacity={0.4 + 0.5 * p} />
      <L37Spark x={186} y={30} r={4} fill={L37_GOLD2} opacity={0.3 + 0.5 * p} />
      <G opacity={0.55}>
        <Path
          d="M26 52 H72 Q86 52 86 66 V78 Q86 92 72 92 H62 L100 108 L52 92 H26 Q12 92 12 78 V66 Q12 52 26 52 Z"
          fill="#9AA0AE"
          fillOpacity={0.3}
          stroke="#9AA0AE"
          strokeWidth={1.4}
          strokeLinejoin="round"
        />
        <Path d="M24 68 q4 -8 8 0 t8 0 t8 0 t8 0 t8 0 t8 0" stroke={k.muted} strokeWidth={2} strokeLinecap="round" fill="none" />
        <Path d="M24 80 q4 -8 8 0 t8 0 t8 0 t8 0" stroke={k.muted} strokeWidth={2} strokeLinecap="round" fill="none" />
      </G>
      <Ellipse cx={128} cy={150} rx={30} ry={4} fill={k.ink} opacity={0.12} />
      <L37Walker x={126} y={150} s={1.5} fill={k.ink} />
      <L37Cap k={k} s="Answer to the one you are cutting" />
    </Frame>
  );
}

export const SCENES_G37: Record<string, ComponentType<{ k: Ink }>> = {
  'l37-engraver': L37Engraver,
  'l37-strokes': L37Strokes,
  'l37-coins': L37Coins,
  'l37-builder': L37Builder,
  'l37-stroke': L37Choice,
  'l37-slip': L37Slip,
  'l37-names': L37Names,
};
