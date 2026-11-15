/* Scenes for lesson 39 told as a story (see story-kit.tsx): "A year from now". Under every farm is the old choice of the seed grain:
   eat the sack now, or plant it and eat next winter. The easy thing now or the good thing later; the field is made of handfuls. */
import { useEffect, useState, type ComponentType } from 'react';
import { Easing } from 'react-native';
import { Circle, ClipPath, Defs, Ellipse, G, Line, Path, Rect } from 'react-native-svg';

import { useAppear, useReducedMotion } from '@/lib/motion';

import { Frame, type Ink, Person, Say } from './story-kit';

const L39_GOLD = '#FFD25A';
const L39_GOLD2 = '#E8B730';
const L39_SACK = '#C9A46A';
const L39_SACK_DK = '#9C7A44';
const L39_TIE = '#7A5A2E';
const L39_GRAIN = '#E3B94F';
const L39_GRAIN_RIM = '#B8892E';
const L39_SOIL = '#7B5A3A';
const L39_GREEN = '#4E9A5B';
const L39_SKIN = '#E8B896';
const L39_SKIN_DK = '#C99878';
const L39_FIG = '#3B2F45';
const L39_BROWN = '#8A5A2B';
const L39_WHITE = '#FFFFFF';
const L39_BRASS = '#C79A3B';
const L39_BRASS_DK = '#8E6A1F';
const L39_DRINK = '#7A3B2A';
const L39_DRINK_HI = '#8E4A37';

/* a number from 0 to 1 that eases up once, after a short pause; with Reduce Motion on it starts at 1 */
function L39useGrow(delay = 300, dur = 1200) {
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
function L39Cap({ k, s }: { k: Ink; s: string }) {
  return <Say x={150} y={190} s={s} fill={k.ink} />;
}

const l39Hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
function l39Mix(a: string, b: string, t: number) {
  const A = l39Hex(a);
  const B = l39Hex(b);
  return (
    '#' +
    A.map((v, i) =>
      Math.round(v + (B[i] - v) * t)
        .toString(16)
        .padStart(2, '0'),
    ).join('')
  );
}

/* ---------- the seed sack: origin is the bottom middle, about 40 wide and 48 tall at scale 1 ---------- */
const L39_SPILL: Array<[number, number, number]> = [
  [24, -1.5, 20],
  [29.5, -3, -30],
  [35, -0.8, 10],
  [22, -5.5, -10],
  [31, -6, 40],
];
function L39Sack({ x, y, s = 1, open = false, spill = true }: { x: number; y: number; s?: number; open?: boolean; spill?: boolean }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      {spill
        ? L39_SPILL.map(([gx, gy, r], i) => (
            <Ellipse
              key={i}
              cx={gx}
              cy={gy}
              rx={2.4}
              ry={1.3}
              fill={L39_GRAIN}
              stroke={L39_GRAIN_RIM}
              strokeWidth={0.5}
              transform={`rotate(${r} ${gx} ${gy})`}
            />
          ))
        : null}
      <Path d="M-19 0 Q-24 -18 -15 -34 L15 -34 Q24 -18 19 0 Q0 4 -19 0 Z" fill={L39_SACK} stroke={L39_SACK_DK} strokeWidth={1.2} strokeLinejoin="round" />
      <Path d="M8 -33 Q16 -18 13 -1 Q17 -1.5 19 0 Q24 -18 15 -34 Z" fill={L39_SACK_DK} opacity={0.3} />
      <Path
        d="M-12 -24 Q-8 -22 -4 -24 M-14 -14 Q-9 -12 -4 -14 M-2 -8 Q3 -6 8 -8"
        stroke={L39_SACK_DK}
        strokeWidth={0.9}
        strokeLinecap="round"
        fill="none"
        opacity={0.55}
      />
      <Rect x={1} y={-25} width={10} height={10} fill="#B58F55" stroke={L39_SACK_DK} strokeWidth={0.8} strokeDasharray="2 1.6" />
      {open ? (
        <G>
          <Ellipse cx={0} cy={-34} rx={16} ry={5} fill="#6E5330" />
          <Path d="M-14 -34 Q-9 -43 0 -42 Q9 -43 14 -34 Q0 -29.5 -14 -34 Z" fill={L39_GRAIN} />
          {[
            [-6, -37, 18],
            [2, -39, -24],
            [8, -36, 30],
            [-1, -34.5, 0],
            [-10, -35, -12],
          ].map(([gx, gy, r], i) => (
            <Ellipse key={i} cx={gx} cy={gy} rx={2} ry={1.1} fill="#F1D27A" transform={`rotate(${r} ${gx} ${gy})`} />
          ))}
          <Path d="M-17 -34 Q0 -28 17 -34" stroke={L39_SACK_DK} strokeWidth={2.4} strokeLinecap="round" fill="none" />
        </G>
      ) : (
        <G>
          <Path
            d="M-9 -33 Q-11 -42 -6 -47 L-2 -44 L0 -48 L3 -44 L7 -47 Q11 -42 9 -33 Z"
            fill={L39_SACK}
            stroke={L39_SACK_DK}
            strokeWidth={1}
            strokeLinejoin="round"
          />
          <Rect x={-10} y={-38} width={20} height={4.2} rx={2.1} fill={L39_TIE} />
          <Path d="M6 -36 Q12 -34 11 -29" stroke={L39_TIE} strokeWidth={2.2} strokeLinecap="round" fill="none" />
        </G>
      )}
    </G>
  );
}

/* ---------- a field of wheat in rows ---------- */
/* x and y are the left end and the baseline of the nearest row; w is the width. `ripe` runs from young green (0) to golden (1);
   `gaps` lists the rows (0 is the farthest) left bare; `s` scales the rows. */
function L39Field({
  x,
  y,
  w,
  ripe = 1,
  gaps = [],
  rows = 6,
  s = 1,
  tall = 1,
  gapMul = 1,
}: {
  x: number;
  y: number;
  w: number;
  ripe?: number;
  gaps?: number[];
  rows?: number;
  s?: number;
  tall?: number;
  gapMul?: number;
}) {
  const gap = 6.4 * s * gapMul;
  const space = 5.2 * s;
  const stalk = l39Mix('#4F9B4F', '#D9A93A', ripe);
  const leaf = l39Mix('#6DB25F', '#C99A2E', ripe);
  const ear = l39Mix('#7DBB63', '#F2C94C', ripe);
  const top = y - (rows - 1) * gap;
  return (
    <G>
      <Rect x={x} y={top - 2 * s} width={w} height={(rows - 1) * gap + 6 * s} fill="#8A6A45" opacity={0.5} />
      {Array.from({ length: rows }, (_, r) => {
        const t = rows > 1 ? r / (rows - 1) : 1;
        const by = y - (rows - 1 - r) * gap;
        if (gaps.includes(r)) {
          return (
            <G key={r}>
              <Rect x={x} y={by - gap + 2} width={w} height={gap} fill="#6B4A2E" />
              <Rect x={x} y={by - gap * 0.5 - 1} width={w} height={2} fill="#8A6A45" />
              {Array.from({ length: Math.floor(w / 31) }, (_, j) => (
                <Ellipse key={j} cx={x + 12 + j * 31 + (r % 2) * 9} cy={by - gap * 0.3} rx={3 * s} ry={1.6 * s} fill="#4F3620" />
              ))}
            </G>
          );
        }
        const h = (9 + 6 * t) * s * tall;
        const earLen = (1.2 + 3.6 * ripe) * s;
        let d = '';
        let e = '';
        let l = '';
        for (let i = 0; ; i++) {
          const sx = x + 2.5 * s + (r % 2) * (space / 2) + i * space;
          if (sx > x + w - 2) break;
          const tx = sx + (ripe > 0.5 ? ((i % 3) - 1) * 0.9 * s : 0);
          const ty = by - h;
          d += `M${sx.toFixed(1)} ${by.toFixed(1)} L${tx.toFixed(1)} ${ty.toFixed(1)} `;
          e += `M${tx.toFixed(1)} ${ty.toFixed(1)} L${tx.toFixed(1)} ${(ty - earLen).toFixed(1)} `;
          l += `M${sx.toFixed(1)} ${(by - h * 0.4).toFixed(1)} L${(sx + (i % 2 ? 2.6 : -2.6) * s).toFixed(1)} ${(by - h * 0.72).toFixed(1)} `;
        }
        return (
          <G key={r}>
            <Path d={d} stroke={stalk} strokeWidth={1.2 * s} strokeLinecap="round" fill="none" />
            <Path d={l} stroke={leaf} strokeWidth={1.1 * s} strokeLinecap="round" fill="none" />
            <Path d={e} stroke={ear} strokeWidth={(2.2 + 0.8 * t) * s} strokeLinecap="round" fill="none" />
          </G>
        );
      })}
    </G>
  );
}

/* a person walking to the right, from the side; with `child` a small child rides on the back */
function L39Walker({ x, y, s = 1, fill, child }: { x: number; y: number; s?: number; fill: string; child?: string }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      {child ? (
        <G>
          <Path d="M-11 -31 L-14 -22 M-8 -31 L-8 -21" stroke={child} strokeWidth={3.2} strokeLinecap="round" fill="none" />
          <Ellipse cx={-10} cy={-40} rx={6.5} ry={10} fill={child} />
          <Circle cx={-10} cy={-55} r={5.2} fill={child} />
        </G>
      ) : null}
      <Path d="M0 -27 L-6 -14 L-11 -1" stroke={fill} strokeWidth={5.2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d="M0 -27 L7 -15 L8 -1" stroke={fill} strokeWidth={5.2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d="M0 -26 L1 -43" stroke={fill} strokeWidth={11} strokeLinecap="round" />
      <Circle cx={3} cy={-54} r={6.8} fill={fill} />
      <Path d="M1 -41 L-6 -34 L-10 -30" stroke={fill} strokeWidth={3.8} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d="M1 -41 L8 -34 L12 -31" stroke={fill} strokeWidth={3.8} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {child ? <Path d="M-7 -47 L1 -46" stroke={child} strokeWidth={3} strokeLinecap="round" /> : null}
    </G>
  );
}

/* a four-point sparkle */
function L39Spark({ x, y, r, fill = L39_WHITE, opacity = 0.9 }: { x: number; y: number; r: number; fill?: string; opacity?: number }) {
  const q = r * 0.22;
  return (
    <Path
      d={`M${x} ${y - r} Q${x + q} ${y - q} ${x + r} ${y} Q${x + q} ${y + q} ${x} ${y + r} Q${x - q} ${y + q} ${x - r} ${y} Q${x - q} ${y - q} ${x} ${y - r} Z`}
      fill={fill}
      opacity={opacity}
    />
  );
}

/* ---------- 1. the seed, or supper ---------- */
function L39Seed({ k }: { k: Ink }) {
  const p = L39useGrow(400, 1400);
  return (
    <Frame label="A farmhouse at the edge of a snowy field in late winter, one window lit warm. A burlap sack of seed grain sits on the doorstep, and a small family of three stands near it in the snow.">
      <Defs>
        <ClipPath id="l39-seed-panel">
          <Rect x={6} y={6} width={288} height={166} rx={16} />
        </ClipPath>
        <ClipPath id="l39-seed-wall">
          <Rect x={172} y={90} width={110} height={36} />
        </ClipPath>
      </Defs>
      <G clipPath="url(#l39-seed-panel)">
        <Rect x={6} y={6} width={288} height={166} fill="#D3DEEA" />
        <Circle cx={58} cy={42} r={22} fill="#F6EBCB" opacity={0.35} />
        <Circle cx={58} cy={42} r={12} fill="#F6EBCB" opacity={0.95} />
        <Ellipse cx={120} cy={30} rx={30} ry={7} fill="#EEF3F8" />
        <Ellipse cx={138} cy={25} rx={16} ry={7} fill="#EEF3F8" />
        <Ellipse cx={256} cy={24} rx={26} ry={6} fill="#EEF3F8" />
        <Path d="M6 124 Q50 98 96 114 Q140 94 190 116 Q240 100 294 118 V132 H6 Z" fill="#BFCFE1" />
        <Rect x={6} y={118} width={288} height={60} fill="#F4F7FB" />
        <Path d="M6 118 Q150 126 294 118 V128 Q150 136 6 128 Z" fill="#E3EBF4" />
        <Path
          d="M12 142 Q70 132 130 138 M10 154 Q80 144 140 151 M14 165 Q90 156 170 165"
          stroke="#DCE5F0"
          strokeWidth={2.4}
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d="M30 140 l2 -4 M52 136 l-1 -4 M76 140 l2 -4 M100 137 l-1 -4 M44 152 l2 -4 M68 150 l-1 -4 M92 153 l2 -4 M116 150 l-1 -4"
          stroke="#9A8B7A"
          strokeWidth={1.4}
          strokeLinecap="round"
        />
        <Ellipse cx={44} cy={128} rx={16} ry={3} fill="#E3EBF4" />
        <Path
          d="M44 128 L44 82 M44 104 L30 88 M44 98 L58 82 M44 88 L36 72 M44 84 L53 69 M30 88 L24 84 M58 82 L64 80"
          stroke="#6B5A4E"
          strokeWidth={3}
          strokeLinecap="round"
          fill="none"
        />
        <Path d="M36 72 L33 66 M53 69 L56 63" stroke="#6B5A4E" strokeWidth={1.6} strokeLinecap="round" />
        <Rect x={242} y={54} width={10} height={24} fill="#7C5A50" />
        <Rect x={240} y={51} width={14} height={5} rx={2.5} fill={L39_WHITE} />
        <Path d="M247 47 q-7 -6 0 -12 t0 -12 t0 -10" stroke={L39_WHITE} strokeWidth={3} strokeLinecap="round" fill="none" opacity={0.85} />
        <Path d="M166 91 L227 48 L288 91 Z" fill="#6B4F4A" strokeLinejoin="round" />
        <Path d="M195 70 L227 47 L259 70 Q249 76 240 71 Q229 79 218 71 Q206 77 195 70 Z" fill={L39_WHITE} />
        <Rect x={172} y={90} width={110} height={36} fill="#B96A55" />
        <Rect x={172} y={124} width={110} height={4} fill="#D6E0EC" />
        <G clipPath="url(#l39-seed-wall)">
          <Circle cx={257} cy={107} r={16 + 12 * p} fill={L39_GOLD} opacity={0.22} />
        </G>
        <Rect x={184} y={98} width={18} height={18} rx={2} fill="#5E6E86" stroke="#6B3F2A" strokeWidth={2} />
        <Path d="M193 98 V116 M184 107 H202" stroke="#6B3F2A" strokeWidth={1.4} />
        <Rect x={247} y={98} width={20} height={18} rx={2} fill={L39_GOLD} stroke="#6B3F2A" strokeWidth={2} />
        <Path d="M257 98 V116 M247 107 H267" stroke="#6B3F2A" strokeWidth={1.4} />
        <Rect x={212} y={98} width={20} height={28} rx={2} fill="#7A4B2E" />
        <Circle cx={228} cy={113} r={1.5} fill={L39_GOLD} />
        <Rect x={204} y={125} width={36} height={7} rx={2} fill="#C6CBD3" />
        <Rect x={204} y={124} width={36} height={3} rx={1.5} fill={L39_WHITE} />
        <Ellipse cx={126} cy={167} rx={16} ry={3} fill="#DCE5F0" />
        <Ellipse cx={154} cy={167} rx={15} ry={3} fill="#DCE5F0" />
        <Ellipse cx={184} cy={167} rx={9} ry={2.4} fill="#DCE5F0" />
        <Ellipse cx={218} cy={166} rx={24} ry={3.4} fill="#C9D5E4" />
        <L39Sack x={216} y={165} s={0.62} />
        <Person x={126} y={166} s={0.95} fill={L39_FIG} face="#F4F7FB" />
        <Person x={154} y={166} s={0.86} fill="#5A4A6A" face="#F4F7FB" />
        <Person x={184} y={166} s={0.5} fill="#C9553F" face="#F4F7FB" />
      </G>
      <Rect x={6} y={6} width={288} height={166} rx={16} fill="none" stroke={k.line} strokeWidth={1.5} />
      <L39Cap k={k} s="The seed, or supper" />
    </Frame>
  );
}

/* ---------- 2. the easy thing, or the good thing ---------- */
function L39Pan({ cx, y }: { cx: number; y: number }) {
  return (
    <G>
      <Path d={`M${cx - 28} ${y} L${cx} ${40} L${cx + 28} ${y}`} stroke={L39_CHAIN} strokeWidth={1.4} fill="none" />
      <Path
        d={`M${cx - 32} ${y} H${cx + 32} Q${cx + 30} ${y + 18} ${cx} ${y + 18} Q${cx - 30} ${y + 18} ${cx - 32} ${y} Z`}
        fill={L39_BRASS}
        stroke={L39_BRASS_DK}
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
      <Path
        d={`M${cx - 22} ${y + 5} Q${cx - 14} ${y + 11} ${cx - 6} ${y + 12}`}
        stroke={L39_WHITE}
        strokeWidth={1.4}
        strokeLinecap="round"
        fill="none"
        opacity={0.5}
      />
    </G>
  );
}
const L39_CHAIN = '#9A8460';
function L39Trade({ k }: { k: Ink }) {
  return (
    <Frame label="A brass balance scale, perfectly level. On the left pan sits a bright wrapped sweet labeled Now. On the right pan sits a sack of seed grain with a small sprout beside it, labeled Later. The scale has not tipped either way.">
      <Line x1={20} y1={168} x2={280} y2={168} stroke={k.line} strokeWidth={2} strokeLinecap="round" />
      <Path d="M122 168 L134 154 L166 154 L178 168 Z" fill={L39_BRASS} stroke={L39_BRASS_DK} strokeWidth={1.4} strokeLinejoin="round" />
      <Line x1={150} y1={40} x2={150} y2={156} stroke={L39_BRASS} strokeWidth={6} strokeLinecap="round" />
      <Line x1={66} y1={40} x2={234} y2={40} stroke={L39_BRASS} strokeWidth={5} strokeLinecap="round" />
      <Circle cx={150} cy={40} r={6} fill={L39_BRASS_DK} />
      <Circle cx={150} cy={40} r={2.6} fill={L39_GOLD} />
      <Circle cx={66} cy={40} r={4} fill={L39_BRASS_DK} />
      <Circle cx={234} cy={40} r={4} fill={L39_BRASS_DK} />
      <Path d="M144 26 Q150 14 156 26" stroke={L39_BRASS_DK} strokeWidth={2.4} strokeLinecap="round" fill="none" />
      <L39Pan cx={66} y={104} />
      <L39Pan cx={234} y={104} />
      <G transform="translate(66 102) scale(1.25)">
        <Path d="M-11 -9 L-22 -16 L-22 -2 Z" fill={L39_GOLD} stroke={L39_GOLD2} strokeWidth={0.8} strokeLinejoin="round" />
        <Path d="M11 -9 L22 -16 L22 -2 Z" fill={L39_GOLD} stroke={L39_GOLD2} strokeWidth={0.8} strokeLinejoin="round" />
        <Ellipse cx={0} cy={-9} rx={11.5} ry={8.5} fill="#E8556F" />
        <Path d="M-5 -16.4 Q-8 -9 -5 -1.8 M5 -16.4 Q8 -9 5 -1.8" stroke={L39_WHITE} strokeWidth={2} strokeLinecap="round" fill="none" opacity={0.75} />
        <Ellipse cx={-5} cy={-13} rx={3.4} ry={1.7} fill={L39_WHITE} opacity={0.6} />
      </G>
      <L39Sack x={222} y={102} s={0.8} />
      <Path d="M232 61 Q231 55 234 50" stroke={L39_GREEN} strokeWidth={2} strokeLinecap="round" fill="none" />
      <Path d="M234 51 Q242 47 244 54 Q238 56 234 51 Z" fill="#5FB26A" />
      <Path d="M233 55 Q226 51 224 57 Q229 59 233 55 Z" fill={L39_GREEN} />
      <Say x={66} y={146} s="Now" fill={k.ink} size={14} />
      <Say x={234} y={146} s="Later" fill={k.ink} size={14} />
      <L39Cap k={k} s="The easy thing, or the good thing" />
    </Frame>
  );
}

/* ---------- 3. they rarely line up ---------- */
function L39Paths({ k }: { k: Ink }) {
  return (
    <Frame label="A fork in a path, seen from above and behind a small figure who stands at the bottom. The left branch is short and smooth and ends at a flat gray wall. The right branch climbs steeply up a hill toward a sunlit golden field of wheat.">
      <Defs>
        <ClipPath id="l39-paths-panel">
          <Rect x={6} y={6} width={288} height={166} rx={16} />
        </ClipPath>
      </Defs>
      <G clipPath="url(#l39-paths-panel)">
        <Rect x={6} y={6} width={288} height={166} fill="#A8C58A" />
        <Path d="M6 6 H132 L146 118 L124 172 H6 Z" fill="#6F7C8C" opacity={0.2} />
        <Path d="M160 6 H294 V172 H176 L158 118 Z" fill={L39_GOLD} opacity={0.12} />
        <Circle cx={270} cy={26} r={36} fill={L39_GOLD} opacity={0.26} />
        <Circle cx={270} cy={26} r={20} fill={L39_GOLD} opacity={0.3} />
        <Ellipse cx={236} cy={86} rx={74} ry={52} fill="#92B86C" />
        <Circle cx={270} cy={26} r={8} fill="#FFE48A" />
        <Path d="M150 122 C128 108 102 98 86 86" stroke="#C8B07A" strokeWidth={15} strokeLinecap="round" fill="none" />
        <Path d="M154 122 C172 106 160 92 182 84 S 204 74 212 70" stroke="#C8B07A" strokeWidth={13} strokeLinecap="round" fill="none" />
        <Path d="M122 172 L178 172 L163 118 L137 118 Z" fill="#E6D5AB" stroke="#C8B07A" strokeWidth={1.5} strokeLinejoin="round" />
        <Path d="M146 122 C128 108 102 98 86 86" stroke="#E6D5AB" strokeWidth={12} strokeLinecap="round" fill="none" />
        <Path d="M154 122 C172 106 160 92 182 84 S 204 74 212 70" stroke="#E6D5AB" strokeWidth={10} strokeLinecap="round" fill="none" />
        <Ellipse cx={165} cy={104} rx={3} ry={2} fill="#9AA0A6" />
        <Ellipse cx={192} cy={90} rx={3} ry={2} fill="#9AA0A6" />
        <Ellipse cx={176} cy={74} rx={3.2} ry={2.2} fill="#9AA0A6" />
        <Ellipse cx={206} cy={84} rx={2.6} ry={1.8} fill="#9AA0A6" />
        <L39Field x={202} y={70} w={64} ripe={1} rows={4} s={0.9} />
        <Rect x={36} y={56} width={96} height={26} fill="#959BA6" />
        <Path d="M36 56 L46 48 L142 48 L132 56 Z" fill="#B9BEC6" />
        <Path d="M36 65 H132 M36 74 H132" stroke="#868C97" strokeWidth={1} />
        <Rect x={36} y={80} width={96} height={2} fill="#7C828D" />
        <Rect x={29} y={142} width={4} height={12} fill="#6B4F3A" />
        <Circle cx={31} cy={136} r={14} fill="#5F9A55" />
        <Circle cx={26} cy={141} r={9} fill="#6DAA60" />
        <Rect x={269} y={146} width={4} height={12} fill="#6B4F3A" />
        <Circle cx={271} cy={141} r={12} fill="#5F9A55" />
        <Path
          d="M80 150 l2 -6 M84 152 l1 -5 M104 160 l2 -6 M100 144 l1 -5 M212 150 l2 -6 M232 160 l-1 -5 M246 140 l2 -6"
          stroke="#6F9A5A"
          strokeWidth={1.6}
          strokeLinecap="round"
        />
        <Ellipse cx={150} cy={170} rx={14} ry={2.6} fill="#000000" opacity={0.15} />
        <Person x={150} y={168} s={0.62} fill={L39_FIG} />
      </G>
      <Rect x={6} y={6} width={288} height={166} rx={16} fill="none" stroke={k.line} strokeWidth={1.5} />
      <L39Cap k={k} s="They rarely line up" />
    </Frame>
  );
}

/* ---------- 4. the field is made of handfuls ---------- */
function L39Handful({ k }: { k: Ink }) {
  const p = L39useGrow(500, 1300);
  return (
    <Frame label="A hand lifts one handful of grain out of an open seed sack. Behind it stretches a field of ripe golden wheat in rows, with three bare rows where the seed was taken.">
      <Defs>
        <ClipPath id="l39-hand-panel">
          <Rect x={6} y={6} width={288} height={166} rx={16} />
        </ClipPath>
      </Defs>
      <G clipPath="url(#l39-hand-panel)">
        <Rect x={6} y={6} width={288} height={166} fill="#F8E8C4" />
        <Circle cx={250} cy={30} r={26} fill={L39_GOLD} opacity={0.28} />
        <Circle cx={250} cy={30} r={13} fill={L39_GOLD} />
        <Path d="M6 84 Q70 58 140 76 Q210 56 294 78 V122 H6 Z" fill="#EBD39A" />
        <L39Field x={10} y={114} w={280} ripe={1} gaps={[1, 3, 4]} rows={6} s={1.5} tall={0.6} gapMul={1.4} />
        <Rect x={6} y={114} width={288} height={58} fill={L39_SOIL} />
        <Path
          d="M6 124 Q80 120 150 124 T294 122 M6 142 Q90 137 170 142 T294 140 M6 160 Q100 155 190 160 T294 158"
          stroke="#6A4C30"
          strokeWidth={2.4}
          strokeLinecap="round"
          fill="none"
        />
        <Ellipse cx={100} cy={168} rx={34} ry={4} fill="#000000" opacity={0.2} />
        <L39Sack x={100} y={166} s={1.7} open />
        <G transform={`translate(0 ${8 * (1 - p)})`}>
          <Path d="M306 50 L206 80" stroke="#B94A3A" strokeWidth={26} />
          <Path d="M206 80 L134 98" stroke={L39_SKIN} strokeWidth={13} strokeLinecap="round" />
          <Ellipse cx={124} cy={97} rx={10} ry={8} fill={L39_SKIN} transform="rotate(-14 124 97)" />
          {[
            [116, 90, 20],
            [122, 88, -30],
            [128, 90, 10],
            [112, 93, -10],
            [119, 92, 40],
            [125, 93, -20],
            [116, 96, 0],
          ].map(([gx, gy, r], i) => (
            <Ellipse
              key={i}
              cx={gx}
              cy={gy}
              rx={2.8}
              ry={1.5}
              fill={L39_GRAIN}
              stroke={L39_GRAIN_RIM}
              strokeWidth={0.5}
              transform={`rotate(${r} ${gx} ${gy})`}
            />
          ))}
          <Path
            d="M118 96 Q107 95 105 103 M117 101 Q108 102 108 109 M119 105 Q111 108 112 113 M124 90 Q115 86 110 91"
            stroke={L39_SKIN}
            strokeWidth={5}
            strokeLinecap="round"
            fill="none"
          />
        </G>
      </G>
      <Rect x={6} y={6} width={288} height={166} rx={16} fill="none" stroke={k.line} strokeWidth={1.5} />
      <L39Cap k={k} s="The field is made of handfuls" />
    </Frame>
  );
}

/* ---------- 5. signing up the later self ---------- */
/* a tumbler: x and y are the middle of the base, w the width at the rim, h the height, `fill` how full (0 to 1) */
function L39Tumbler({ id, k, x, y, w, h, fill }: { id: string; k: Ink; x: number; y: number; w: number; h: number; fill: number }) {
  const top = y - h;
  const tw = w / 2;
  const bw = tw * 0.72;
  const body = `M${x - tw} ${top} L${x - bw} ${y - 7} Q${x - bw} ${y} ${x - bw + 7} ${y} L${x + bw - 7} ${y} Q${x + bw} ${y} ${x + bw} ${y - 7} L${x + tw} ${top} Z`;
  const lv = y - h * fill;
  const hw = tw - (tw - bw) * ((lv - top) / h);
  return (
    <G>
      <Defs>
        <ClipPath id={id}>
          <Path d={body} />
        </ClipPath>
      </Defs>
      <Path d={body} fill={k.soft} opacity={0.7} />
      <G clipPath={`url(#${id})`}>
        <Rect x={x - tw} y={lv} width={w} height={y - lv + 2} fill={L39_DRINK} />
        <Path
          d={`M${x - tw * 0.5} ${lv + 12} Q${x - tw * 0.2} ${lv + 8} ${x + tw * 0.1} ${lv + 13}`}
          stroke="#5E2C1F"
          strokeWidth={2.4}
          strokeLinecap="round"
          fill="none"
          opacity={0.55}
        />
        <Path
          d={`M${x + tw * 0.1} ${lv + 22} Q${x + tw * 0.35} ${lv + 18} ${x + tw * 0.55} ${lv + 23}`}
          stroke="#5E2C1F"
          strokeWidth={2.4}
          strokeLinecap="round"
          fill="none"
          opacity={0.45}
        />
        <Ellipse cx={x} cy={lv} rx={hw} ry={Math.max(3, w * 0.05)} fill={L39_DRINK_HI} />
      </G>
      {fill > 0.93 ? <Ellipse cx={x} cy={top - 1} rx={tw - 2} ry={5} fill={L39_DRINK_HI} /> : null}
      <Path d={body} fill="none" stroke={k.muted} strokeWidth={2} strokeLinejoin="round" />
      <Ellipse cx={x} cy={top} rx={tw} ry={Math.max(3.5, w * 0.05)} fill="none" stroke={k.muted} strokeWidth={2} />
      <Path d={`M${x - tw + 6} ${top + 8} L${x - bw + 5} ${y - 14}`} stroke={L39_WHITE} strokeWidth={2.4} strokeLinecap="round" opacity={0.4} />
    </G>
  );
}
function L39Cup({ k }: { k: Ink }) {
  const p = L39useGrow(500, 1400);
  return (
    <Frame label="Two glasses side by side on a table, both holding the same murky red-brown drink. The small glass labeled Today has only a little in it. The big glass labeled Later is filled right to the brim.">
      <Rect x={16} y={148} width={268} height={8} rx={4} fill={k.soft} />
      <Line x1={16} y1={148} x2={284} y2={148} stroke={k.line} strokeWidth={2} strokeLinecap="round" />
      <Ellipse cx={84} cy={150} rx={30} ry={3} fill="#000000" opacity={0.18} />
      <Ellipse cx={208} cy={150} rx={44} ry={3.6} fill="#000000" opacity={0.18} />
      <G>
        <Circle cx={84} cy={56} r={9} fill={L39_GOLD} />
        <Path
          d="M84 38 V42 M84 70 V74 M66 56 H70 M98 56 H102 M71 43 L74 46 M94 66 L97 69 M97 43 L94 46 M74 66 L71 69"
          stroke={L39_GOLD2}
          strokeWidth={2.2}
          strokeLinecap="round"
        />
      </G>
      <L39Tumbler id="l39-cup-a" k={k} x={84} y={148} w={56} h={54} fill={0.3} />
      <L39Tumbler id="l39-cup-b" k={k} x={208} y={148} w={92} h={108} fill={0.52 + 0.46 * p} />
      <Say x={84} y={168} s="Today" fill={k.ink} size={14} />
      <Say x={208} y={168} s="Later" fill={k.ink} size={14} />
      <L39Cap k={k} s="Signing up the later self" />
    </Frame>
  );
}

/* ---------- 6. future you, with a face ---------- */
function L39Face({ k }: { k: Ink }) {
  return (
    <Frame label="A person stands before a tall mirror, seen in profile. In the mirror is the same person, older: gray hair, a few lines on the face and a small kind smile.">
      <Defs>
        <ClipPath id="l39-face-glass">
          <Path d="M150 164 V58 Q150 20 190 20 Q230 20 230 58 V164 Z" />
        </ClipPath>
      </Defs>
      <Line x1={20} y1={168} x2={280} y2={168} stroke={k.line} strokeWidth={2} strokeLinecap="round" />
      <Path d="M142 168 V58 Q142 12 190 12 Q238 12 238 58 V168 Z" fill={L39_BROWN} stroke="#6B4220" strokeWidth={1.5} strokeLinejoin="round" />
      <Path d="M150 164 V58 Q150 20 190 20 Q230 20 230 58 V164 Z" fill="#D9E8F0" />
      <G clipPath="url(#l39-face-glass)">
        <Rect x={150} y={120} width={80} height={46} fill="#C9DDE8" />
        <G transform="translate(0 -12)">
          <Path d="M146 190 L146 142 Q148 120 176 114 L204 114 Q232 120 234 142 L234 190 Z" fill={k.acc} />
          <Rect x={182} y={104} width={16} height={14} fill="#D9A585" />
          <Circle cx={171} cy={88} r={3.6} fill={L39_SKIN_DK} />
          <Circle cx={209} cy={88} r={3.6} fill={L39_SKIN_DK} />
          <Ellipse cx={190} cy={86} rx={19} ry={22} fill={L39_SKIN} />
          <Path
            d="M170 84 Q166 58 190 58 Q214 58 210 84 Q206 72 190 70 Q174 72 170 84 Z"
            fill="#CDD1D8"
            stroke="#A7AEB9"
            strokeWidth={1}
            strokeLinejoin="round"
          />
          <Ellipse cx={171} cy={84} rx={2.6} ry={6.5} fill="#CDD1D8" />
          <Ellipse cx={209} cy={84} rx={2.6} ry={6.5} fill="#CDD1D8" />
          <Path d="M182 75 Q190 73.4 198 75 M184 78 Q190 77 196 78" stroke={L39_SKIN_DK} strokeWidth={1} strokeLinecap="round" fill="none" />
          <Path d="M179 80 Q183 78 187 80 M193 80 Q197 78 201 80" stroke="#9AA0AB" strokeWidth={1.8} strokeLinecap="round" fill="none" />
          <Circle cx={183} cy={86} r={1.9} fill="#2F2A3A" />
          <Circle cx={197} cy={86} r={1.9} fill="#2F2A3A" />
          <Path d="M176 86 L173 84 M176 88.5 L173 90 M204 86 L207 84 M204 88.5 L207 90" stroke={L39_SKIN_DK} strokeWidth={0.9} strokeLinecap="round" />
          <Path d="M190 88 Q187 94 190 96 Q192 96 193 95" stroke={L39_SKIN_DK} strokeWidth={1.4} strokeLinecap="round" fill="none" />
          <Path d="M184 93 Q182 99 185 103 M196 93 Q198 99 195 103" stroke={L39_SKIN_DK} strokeWidth={1} strokeLinecap="round" fill="none" />
          <Path d="M183 101 Q190 107 197 101" stroke="#8A4B3A" strokeWidth={1.8} strokeLinecap="round" fill="none" />
        </G>
        <Path d="M158 150 L196 60" stroke={L39_WHITE} strokeWidth={7} opacity={0.5} />
        <Path d="M172 158 L206 74" stroke={L39_WHITE} strokeWidth={2.6} opacity={0.45} />
      </G>
      <Path d="M66 168 L68 124 Q70 100 92 100 Q114 100 116 124 L118 168 Z" fill={k.acc} />
      <Rect x={86} y={86} width={11} height={16} fill="#D9A585" />
      <Circle cx={92} cy={74} r={14} fill={L39_SKIN} />
      <Path d="M105 72 L110 77 L105 79 Z" fill={L39_SKIN} />
      <Path d="M92 59 Q76 58 78 76 Q80 86 85 89 Q86 78 92 71 Q100 67 106 69 Q104 59 92 59 Z" fill="#3C2E2A" />
      <Circle cx={100} cy={72} r={1.5} fill="#2F2A3A" />
      <Path d="M101 83 Q104 85 107 82.5" stroke="#8A4B3A" strokeWidth={1.4} strokeLinecap="round" fill="none" />
      <Path d="M102 112 L120 138" stroke={k.acc} strokeWidth={9} strokeLinecap="round" />
      <Circle cx={122} cy={141} r={4.6} fill={L39_SKIN} />
      <L39Cap k={k} s="Future you, with a face" />
    </Frame>
  );
}

/* ---------- 7. someone wakes up with today ---------- */
function L39Year({ k }: { k: Ink }) {
  const p = L39useGrow(300, 1600);
  return (
    <Frame label="A small house at dawn with the sun rising behind golden hills. A person steps out of the lit door and walks toward a field of ripe golden wheat.">
      <Defs>
        <ClipPath id="l39-year-panel">
          <Rect x={6} y={6} width={288} height={166} rx={16} />
        </ClipPath>
      </Defs>
      <G clipPath="url(#l39-year-panel)">
        <Rect x={6} y={6} width={288} height={42} fill="#F0B993" />
        <Rect x={6} y={46} width={288} height={36} fill="#F7CFA6" />
        <Rect x={6} y={80} width={288} height={40} fill="#FBE3BC" />
        <Circle cx={216} cy={104 - 26 * p} r={58} fill={L39_GOLD} opacity={0.14} />
        <Circle cx={216} cy={104 - 26 * p} r={36} fill={L39_GOLD} opacity={0.22} />
        <Circle cx={216} cy={104 - 26 * p} r={19} fill={L39_GOLD} />
        <Ellipse cx={70} cy={30} rx={26} ry={6} fill="#FBE9D0" opacity={0.85} />
        <Ellipse cx={92} cy={26} rx={16} ry={6} fill="#FBE9D0" opacity={0.85} />
        <Ellipse cx={252} cy={50} rx={24} ry={5} fill="#FBE9D0" opacity={0.7} />
        <Path d="M146 42 l5 -4 l5 4 M164 50 l4 -3 l4 3" stroke="#7A5A55" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <Path d="M6 100 Q50 84 100 96 Q150 82 200 98 Q250 84 294 96 V124 H6 Z" fill="#E8B48B" />
        <Path d="M6 112 Q70 98 130 108 Q200 96 294 110 V132 H6 Z" fill="#DDA77E" />
        <Rect x={6} y={116} width={288} height={56} fill="#A8B676" />
        <Rect x={6} y={116} width={72} height={56} fill="#B9C27D" />
        <L39Field x={76} y={150} w={218} ripe={0.5 + 0.5 * p} rows={6} s={1.1} />
        <Rect x={6} y={150} width={288} height={22} fill="#A8B676" />
        <Path d="M30 142 Q40 150 76 150" stroke="#E3CC9C" strokeWidth={10} strokeLinecap="round" fill="none" />
        <Rect x={66} y={80} width={9} height={18} fill="#8A5A4A" />
        <Path d="M70 76 q-4 -5 0 -9 t0 -9" stroke={L39_WHITE} strokeWidth={2.4} strokeLinecap="round" fill="none" opacity={0.7} />
        <Rect x={12} y={104} width={52} height={38} fill="#EBD3AE" />
        <Path d="M6 106 L38 78 L70 106 Z" fill="#B9523F" strokeLinejoin="round" />
        <Rect x={31} y={118} width={14} height={24} rx={2} fill="#F7D27A" />
        <Path d="M31 118 L23 121 L23 142 L31 142 Z" fill="#7A4B2E" />
        <Rect x={50} y={114} width={9} height={9} rx={1} fill="#F7D27A" stroke="#7A4B2E" strokeWidth={1.4} />
        <Ellipse cx={38} cy={144} rx={14} ry={2.6} fill="#000000" opacity={0.16} />
        <L39Walker x={39} y={143} s={0.95} fill={L39_FIG} />
      </G>
      <Rect x={6} y={6} width={288} height={166} rx={16} fill="none" stroke={k.line} strokeWidth={1.5} />
      <L39Cap k={k} s="Someone wakes up with today" />
    </Frame>
  );
}

/* ---------- 8. something worth carrying ---------- */
function L39Carry({ k }: { k: Ink }) {
  return (
    <Frame label="A person walks upright and steady up a gentle hill on a winding path, a small child riding on their back. The sun is ahead, and at the top of the hill is a golden field of wheat.">
      <Defs>
        <ClipPath id="l39-carry-panel">
          <Rect x={6} y={6} width={288} height={166} rx={16} />
        </ClipPath>
      </Defs>
      <G clipPath="url(#l39-carry-panel)">
        <Rect x={6} y={6} width={288} height={166} fill="#F9E7C2" />
        <Circle cx={236} cy={38} r={50} fill={L39_GOLD} opacity={0.14} />
        <Circle cx={236} cy={38} r={30} fill={L39_GOLD} opacity={0.22} />
        <Circle cx={236} cy={38} r={15} fill={L39_GOLD} />
        <Ellipse cx={90} cy={34} rx={28} ry={6} fill="#FFF6E0" opacity={0.9} />
        <Ellipse cx={110} cy={29} rx={16} ry={6} fill="#FFF6E0" opacity={0.9} />
        <Path d="M6 122 Q80 88 160 102 Q230 78 294 74 V172 H6 Z" fill="#CFE0A8" />
        <Path d="M6 150 C90 142 170 118 226 98 Q258 86 294 84 V172 H6 Z" fill="#8DB36A" />
        <Path d="M6 160 C90 150 170 124 300 90" stroke="#C9A874" strokeWidth={15} strokeLinecap="round" fill="none" />
        <Path d="M6 160 C90 150 170 124 300 90" stroke="#EBD7A8" strokeWidth={11} strokeLinecap="round" fill="none" />
        <Rect x={35} y={118} width={4} height={14} fill="#6B4F3A" />
        <Circle cx={37} cy={112} r={13} fill="#5F9A55" />
        <Rect x={64} y={112} width={3.4} height={11} fill="#6B4F3A" />
        <Circle cx={65.5} cy={107} r={10} fill="#6DAA60" />
        <L39Field x={232} y={100} w={62} ripe={1} rows={4} s={0.8} />
        <Path
          d="M20 168 l2 -6 M44 160 l1 -5 M150 162 l2 -6 M190 150 l1 -5 M120 164 l-1 -5 M222 134 l2 -5"
          stroke="#6F9A5A"
          strokeWidth={1.6}
          strokeLinecap="round"
        />
        <Circle cx={160} cy={150} r={1.8} fill="#F4F0E0" />
        <Circle cx={74} cy={156} r={1.8} fill="#F4F0E0" />
        <Ellipse cx={101} cy={144} rx={15} ry={2.6} fill="#000000" opacity={0.16} />
        <L39Walker x={101} y={143} s={1.15} fill={L39_FIG} child="#C9553F" />
        <L39Spark x={200} y={74} r={4} fill={L39_GOLD} opacity={0.8} />
      </G>
      <Rect x={6} y={6} width={288} height={166} rx={16} fill="none" stroke={k.line} strokeWidth={1.5} />
      <L39Cap k={k} s="Something worth carrying" />
    </Frame>
  );
}

export const SCENES_G39: Record<string, ComponentType<{ k: Ink }>> = {
  'l39-seed': L39Seed,
  'l39-trade': L39Trade,
  'l39-paths': L39Paths,
  'l39-handful': L39Handful,
  'l39-cup': L39Cup,
  'l39-face': L39Face,
  'l39-year': L39Year,
  'l39-carry': L39Carry,
};
