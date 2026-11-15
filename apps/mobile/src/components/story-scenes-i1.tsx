/* Scenes for lesson g1, "Where are you?", told as a story (see story-kit.tsx and story-scenes-f-l31.tsx for the model): the garden (Genesis 3), then David,
   the boy in the grove, and the 1986 study of a student writing alone in a room. In the garden Adam always wears the same warm brown leaf garment and Eve the
   same green one (tan coats of skin at the end); God is never drawn as a person, only as warm light and a golden voice. Every figure carries a dark outline so
   it reads on a dark card and on a cream one alike, and every figure is clothed simply. */
import { type ComponentType, type ReactNode, useEffect, useState } from 'react';
import { Easing } from 'react-native';
import { Circle, ClipPath, Defs, Ellipse, G, Path, Rect } from 'react-native-svg';

import { useAppear, useReducedMotion } from '@/lib/motion';

import { BEAR_LINE, Frame, type Ink, Say } from './story-kit';

const SKIN = '#E7B98F';
const SKIN_D = '#B98E6C';
const HAIR = '#4A2E1E';
const EVE_HAIR = '#6B3F22';
const ADAM = '#BE7F2E';
const ADAM_D = '#7E4F1C';
const EVE = '#2E9E5B';
const EVE_D = '#1B6B3D';
const COAT = '#D2A06A';
const COAT_D = '#8F5F2E';
const LEAF = '#5CA64A';
const LEAF_D = '#2F6E2B';
const GOLD = '#FFD25A';
const GOLD_D = '#C98F1A';
const CREAM = '#FFF6D0';
const SKY = '#F2C98A';
const HILL = '#B9CF8A';
const GRASS = '#9CC47A';
const CANOPY = '#4B8B50';
const CANOPY_D = '#2F6244';
const TRUNK = '#7A5232';
const TRUNK_D = '#4B3220';
const PATH = '#EAD3A0';
const FRUIT = '#D9453A';
const WOOD = '#B07A45';
const WOOD_D = '#5E3A1A';
const BLUE = '#2F4A9E';
const BLUE_L = '#6E86DA';
const ROCK = '#3A3347';

/* ---------- small shared drawings ---------- */

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

/* thick rounded strokes with one outline around the whole shape: every outline first, then every fill, so inner joins stay clean */
function Tube({ parts, fill, s = 1 }: { parts: [string, number][]; fill: string; s?: number }) {
  return (
    <G fill="none" strokeLinecap="round" strokeLinejoin="round">
      {parts.map(([d, w], i) => (
        <Path key={`o${i}`} d={d} stroke={BEAR_LINE} strokeWidth={w + 2.8 / s} />
      ))}
      {parts.map(([d, w], i) => (
        <Path key={`f${i}`} d={d} stroke={fill} strokeWidth={w} />
      ))}
    </G>
  );
}
function Hand({ x, y, r = 3.6, s = 1, fill = SKIN }: { x: number; y: number; r?: number; s?: number; fill?: string }) {
  return <Circle cx={x} cy={y} r={r} fill={fill} stroke={BEAR_LINE} strokeWidth={1.3 / s} />;
}

/* the picture's rounded frame, from x0 to x1 (the round sides are the ones at the picture's edge), with a sky, a ground and everything inside clipped to it */
function Stage({
  id,
  sky,
  ground,
  y,
  x0 = 10,
  x1 = 290,
  round = 'both',
  children,
}: {
  id: string;
  sky: string;
  ground?: string;
  y?: number;
  x0?: number;
  x1?: number;
  round?: 'both' | 'l' | 'r';
  children?: ReactNode;
}) {
  const r = 12;
  const l = round !== 'r';
  const rr = round !== 'l';
  const d =
    `M${x0 + (l ? r : 0)} 10 L${x1 - (rr ? r : 0)} 10 ${rr ? `Q${x1} 10 ${x1} 22` : ''} L${x1} ${172 - (rr ? r : 0)} ${rr ? `Q${x1} 172 ${x1 - r} 172` : ''} ` +
    `L${x0 + (l ? r : 0)} 172 ${l ? `Q${x0} 172 ${x0} 160` : ''} L${x0} ${10 + (l ? r : 0)} ${l ? `Q${x0} 10 ${x0 + r} 10` : ''} Z`;
  return (
    <G>
      <Defs>
        <ClipPath id={id}>
          <Path d={d} />
        </ClipPath>
      </Defs>
      <Path d={d} fill={sky} />
      <G clipPath={`url(#${id})`}>
        {ground && y !== undefined ? <Rect x={x0} y={y} width={x1 - x0} height={172 - y} fill={ground} /> : null}
        {children}
      </G>
    </G>
  );
}

/* the garden's sky and far hills */
function GardenBack() {
  return (
    <G>
      <Path d="M10 120 Q70 98 130 112 Q200 92 290 114 L290 134 L10 134 Z" fill={HILL} />
      <Path d="M10 130 Q90 116 160 126 Q230 112 290 128 L290 140 L10 140 Z" fill="#A9C77C" />
    </G>
  );
}

/* a tree trunk with its foot on base */
function Trunk({ x, base, top, w, fill = TRUNK }: { x: number; base: number; top: number; w: number; fill?: string }) {
  return (
    <G>
      <Path
        d={`M${x - w / 2 - 6} ${base} Q${x - w / 2} ${base - 14} ${x - w / 2 + 1} ${top} L${x + w / 2 - 1} ${top} Q${x + w / 2} ${base - 14} ${x + w / 2 + 6} ${base} Z`}
        fill={fill}
        stroke={BEAR_LINE}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <Path
        d={`M${x - w * 0.15} ${base - 6} L${x - w * 0.1} ${top + 10} M${x + w * 0.22} ${base - 10} L${x + w * 0.18} ${top + 30}`}
        stroke={TRUNK_D}
        strokeWidth={1.6}
        strokeLinecap="round"
        opacity={0.6}
      />
    </G>
  );
}

/* a rounded crown of leaves */
const CROWN: [number, number, number][] = [
  [0, 0, 1],
  [-0.85, 0.32, 0.72],
  [0.85, 0.32, 0.72],
  [-0.42, -0.55, 0.62],
  [0.5, -0.5, 0.6],
];
function Canopy({ cx, cy, r, fill = CANOPY, line = true }: { cx: number; cy: number; r: number; fill?: string; line?: boolean }) {
  return (
    <G>
      {line ? CROWN.map(([dx, dy, k], i) => <Circle key={`o${i}`} cx={cx + dx * r} cy={cy + dy * r} r={r * k + 1.4} fill={BEAR_LINE} />) : null}
      {CROWN.map(([dx, dy, k], i) => (
        <Circle key={`f${i}`} cx={cx + dx * r} cy={cy + dy * r} r={r * k} fill={fill} />
      ))}
    </G>
  );
}
function Fruit({ x, y }: { x: number; y: number }) {
  return (
    <G>
      <Circle cx={x} cy={y} r={4.2} fill={FRUIT} stroke={BEAR_LINE} strokeWidth={1} />
      <Path d={`M${x} ${y - 4} L${x + 1.5} ${y - 7}`} stroke={LEAF_D} strokeWidth={1.4} strokeLinecap="round" />
    </G>
  );
}

/* a big fig leaf, three-lobed, its stem at (x, y) */
function Leaf({ x, y, s = 1, rot = 0 }: { x: number; y: number; s?: number; rot?: number }) {
  return (
    <G transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <Path
        d="M0 10 Q-6 8 -12 4 Q-17 0 -14 -4 Q-11 -3 -9 -6 Q-12 -12 -8 -16 Q-4 -14 -3 -12 Q-2 -18 0 -20 Q2 -18 3 -12 Q4 -14 8 -16 Q12 -12 9 -6 Q11 -3 14 -4 Q17 0 12 4 Q6 8 0 10 Z"
        fill={LEAF}
        stroke={BEAR_LINE}
        strokeWidth={1.3 / s}
        strokeLinejoin="round"
      />
      <Path d="M0 9 L0 -14 M0 4 L-9 -3 M0 4 L9 -3" stroke={LEAF_D} strokeWidth={1 / s} strokeLinecap="round" fill="none" />
    </G>
  );
}

/* warm light: a bright core in rings of gold, with short rays. This is how God is shown: never as a person. */
function Glow({ x, y, s = 1, o = 1, tall = true }: { x: number; y: number; s?: number; o?: number; tall?: boolean }) {
  const rays = Array.from({ length: 10 }, (_, i) => {
    const a = (i / 10) * Math.PI * 2;
    const c = Math.cos(a);
    const sn = Math.sin(a);
    return `M${(c * 32).toFixed(1)} ${(sn * 32).toFixed(1)} L${(c * 41).toFixed(1)} ${(sn * 41).toFixed(1)}`;
  }).join(' ');
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
      <Circle r={46} fill={GOLD} opacity={0.14} />
      <Circle r={34} fill={GOLD} opacity={0.2} />
      <Circle r={24} fill={GOLD} opacity={0.32} />
      <Path d={rays} stroke={GOLD_D} strokeWidth={2.4} strokeLinecap="round" opacity={0.7} />
      <Ellipse rx={tall ? 10 : 14} ry={tall ? 24 : 14} fill={CREAM} />
      <Ellipse rx={tall ? 5 : 8} ry={tall ? 15 : 8} fill="#FFFFFF" opacity={0.85} />
    </G>
  );
}

/* ---------- Adam and Eve ---------- */

type Pt = [number, number];

/* a zigzag hem of leaves, from x=w to x=-w, along y=hy */
function leafHem(w: number, hy: number, n = 4) {
  const step = (2 * w) / n;
  let d = '';
  for (let i = 1; i <= n; i++) d += ` L${(w - step * (i - 0.5)).toFixed(1)} ${hy + 5} L${(w - step * i).toFixed(1)} ${hy}`;
  return d;
}

/* Adam (warm brown leaf garment) or Eve (green, long hair), standing on (x, y), facing right unless flip. hands are the two hand points in the figure's own
   space; from 'front' starts both arms at the front shoulder. coat dresses them in the coats of skin: tan, long, with a stitched edge. */
function Gardener({
  x,
  y,
  s = 1,
  who,
  flip = false,
  hands,
  from = 'side',
  bow = 0,
  coat = false,
}: {
  x: number;
  y: number;
  s?: number;
  who: 'adam' | 'eve';
  flip?: boolean;
  hands?: [Pt, Pt];
  from?: 'side' | 'front';
  bow?: number;
  coat?: boolean;
}) {
  const sw = 1.4 / s;
  const adam = who === 'adam';
  const cloth = coat ? COAT : adam ? ADAM : EVE;
  const clothD = coat ? COAT_D : adam ? ADAM_D : EVE_D;
  const hair = adam ? HAIR : EVE_HAIR;
  const [hl, hr] = hands ?? [
    [-13, -14],
    [13, -14],
  ];
  const sl: Pt = from === 'front' ? [6, -34] : [-9, -34];
  const sr: Pt = from === 'front' ? [9, -33] : [9, -34];
  const hem = coat ? -4 : adam ? -11 : -7;
  const hw = adam ? 14 : 15;
  const body = coat ? `M-12 -35 Q0 -40 12 -35 L16 -4 L-16 -4 Z` : `M-12 -35 Q0 -40 12 -35 L${hw} ${hem}${leafHem(hw, hem)} Z`;
  return (
    <G transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      {!adam ? <Path d="M-9.5 -52 Q-15 -38 -12 -26 L12 -26 Q15 -38 9.5 -52 Z" fill={hair} stroke={BEAR_LINE} strokeWidth={sw} strokeLinejoin="round" /> : null}
      <Tube
        fill={SKIN}
        s={s}
        parts={[
          [`M-5 ${hem} L-5 -3`, 5],
          [`M5 ${hem} L5 -3`, 5],
        ]}
      />
      <Ellipse cx={-4} cy={-1} rx={5} ry={2.4} fill={SKIN} stroke={BEAR_LINE} strokeWidth={sw} />
      <Ellipse cx={6} cy={-1} rx={5} ry={2.4} fill={SKIN} stroke={BEAR_LINE} strokeWidth={sw} />
      <Path d={body} fill={cloth} stroke={BEAR_LINE} strokeWidth={sw} strokeLinejoin="round" />
      {coat ? (
        <G>
          <Path d="M-14 -7 L14 -7 M0 -36 L0 -8" stroke={clothD} strokeWidth={1.3} strokeDasharray="3 2.4" strokeLinecap="round" fill="none" />
          <Path d="M-11 -34 Q0 -39 11 -34" stroke={clothD} strokeWidth={1.3} strokeDasharray="3 2.4" strokeLinecap="round" fill="none" />
        </G>
      ) : (
        <Path
          d={`M0 -34 L-8 ${hem - 4} M0 -34 L0 ${hem - 2} M0 -34 L8 ${hem - 4}`}
          stroke={clothD}
          strokeWidth={1.1}
          strokeLinecap="round"
          opacity={0.75}
          fill="none"
        />
      )}
      <Tube
        fill={coat ? COAT : SKIN}
        s={s}
        parts={[
          [`M${sl[0]} ${sl[1]} L${hl[0]} ${hl[1]}`, 5],
          [`M${sr[0]} ${sr[1]} L${hr[0]} ${hr[1]}`, 5],
        ]}
      />
      <Hand x={hl[0]} y={hl[1]} s={s} />
      <Hand x={hr[0]} y={hr[1]} s={s} />
      <G transform={`translate(${bow * 0.6} ${bow})`}>
        <Circle cx={0} cy={-49} r={8.5} fill={SKIN} stroke={BEAR_LINE} strokeWidth={sw} />
        <Path d="M-8.6 -50 Q-8.4 -59 0 -59 Q8.6 -58.6 8.6 -50 Q4 -54 0 -53.5 Q-5 -54 -8.6 -50 Z" fill={hair} />
        <Circle cx={3.8} cy={-48.5} r={1.2} fill={BEAR_LINE} />
      </G>
    </G>
  );
}

/* ---------- 1. fig leaves, sewn ---------- */
function Fig({ k }: { k: Ink }) {
  void k;
  const p = useRun(500, 1500);
  return (
    <Frame label="In a garden, the man and the woman stand facing each other, sewing big fig leaves together between them. A fruit tree stands behind them">
      <Stage id="g1clip" sky={SKY} ground={GRASS} y={128}>
        <GardenBack />
        <Trunk x={150} base={138} top={70} w={16} />
        <Canopy cx={150} cy={52} r={34} />
        <Fruit x={126} y={58} />
        <Fruit x={172} y={50} />
        <Fruit x={150} y={74} />
        <Fruit x={138} y={38} />
        <Fruit x={166} y={68} />
        <Leaf x={56} y={158} s={0.7} rot={-60} />
        <Leaf x={246} y={160} s={0.7} rot={70} />
        <Gardener
          who="adam"
          x={96}
          y={166}
          s={1.45}
          from="front"
          hands={[
            [16, -30],
            [20, -25],
          ]}
        />
        <Gardener
          who="eve"
          x={204}
          y={166}
          s={1.45}
          flip
          from="front"
          hands={[
            [16, -30],
            [20, -25],
          ]}
        />
        <Leaf x={137} y={124} s={1.35} rot={-6} />
        <Leaf x={163} y={124} s={1.35} rot={6} />
        <G fill="none" stroke={GOLD_D} strokeWidth={2} strokeLinecap="round">
          {[0, 1, 2, 3, 4].map((i) => (
            <Path key={i} d={`M147 ${108 + i * 6} L153 ${110 + i * 6}`} opacity={p > i / 5 ? 1 : 0} />
          ))}
          <Path d="M153 134 Q158 142 154 148" opacity={p} />
        </G>
      </Stage>
    </Frame>
  );
}

/* ---------- 2. hiding behind the trees, the light coming along the path ---------- */
function Trees({ k }: { k: Ink }) {
  void k;
  const p = useRun(600, 2200);
  const e = p * p * (3 - 2 * p);
  return (
    <Frame label="Two figures in leaf garments, a man and a woman, hide behind big tree trunks in a garden and peek out. Far along the path at the side, a warm golden light moves toward them">
      <Stage id="g1clip" sky={SKY} ground={GRASS} y={128}>
        <GardenBack />
        <Path d="M260 108 Q262 140 224 172 L292 172 L292 148 Q272 128 274 108 Z" fill={PATH} />
        <Glow x={267 - 12 * e} y={102 + 30 * e} s={0.5 + 0.6 * e} />
        <Gardener who="adam" x={112} y={168} s={1.3} />
        <Trunk x={92} base={172} top={20} w={22} />
        <Gardener who="eve" x={214} y={168} s={1.3} />
        <Trunk x={194} base={172} top={20} w={22} />
        <Canopy cx={90} cy={22} r={44} fill={CANOPY_D} />
        <Canopy cx={196} cy={22} r={44} fill={CANOPY_D} />
        <Canopy cx={150} cy={10} r={36} fill={CANOPY_D} />
        <Canopy cx={254} cy={26} r={32} fill={CANOPY} />
      </Stage>
    </Frame>
  );
}

/* ---------- 3. the call ---------- */
function Call({ k }: { k: Ink }) {
  const p = useRun(500, 1800);
  const wave = (i: number) => Math.max(0, Math.min(1, p * 3.2 - i * 0.8));
  const arc = (r: number) => {
    const c = Math.cos(0.62) * r;
    const sn = Math.sin(0.62) * r;
    return `M${(237 - c).toFixed(1)} ${(114 - sn).toFixed(1)} A${r} ${r} 0 0 0 ${(237 - c).toFixed(1)} ${(114 + sn).toFixed(1)}`;
  };
  return (
    <Frame label="The garden seen wider. A warm light stands on the path at the right and calls toward the trees, in golden arcs that carry the words Where art thou. Two small figures stand half hidden behind trunks">
      <Stage id="g1clip" sky={SKY} ground={GRASS} y={128}>
        <GardenBack />
        {[24, 52, 88, 150, 186, 262].map((x, i) => (
          <G key={x}>
            <Trunk x={x} base={124 + (i % 2) * 4} top={96} w={5} fill="#8C6A47" />
            <Canopy cx={x} cy={92} r={13} fill="#6FA062" line={false} />
          </G>
        ))}
        <Path d="M196 172 Q214 152 226 138 L250 138 Q246 154 266 172 Z" fill={PATH} />
        <G opacity={wave(0)}>
          <Path d={arc(30)} stroke={GOLD} strokeWidth={3.4} strokeLinecap="round" fill="none" />
        </G>
        <G opacity={wave(1) * 0.8}>
          <Path d={arc(56)} stroke={GOLD} strokeWidth={3.4} strokeLinecap="round" fill="none" />
        </G>
        <G opacity={wave(2) * 0.55}>
          <Path d={arc(82)} stroke={GOLD} strokeWidth={3.4} strokeLinecap="round" fill="none" />
        </G>
        <Glow x={237} y={116} s={1.15} />
        <Gardener who="eve" x={72} y={156} s={0.82} />
        <Trunk x={58} base={160} top={56} w={16} />
        <Gardener who="adam" x={132} y={156} s={0.82} />
        <Trunk x={118} base={160} top={56} w={16} />
        <Canopy cx={56} cy={52} r={30} fill={CANOPY_D} />
        <Canopy cx={118} cy={50} r={30} fill={CANOPY_D} />
      </Stage>
      <Say x={150} y={190} s="Where art thou?" fill={k.ink} />
    </Frame>
  );
}

/* ---------- 4. the answer ---------- */
function Answer({ k }: { k: Ink }) {
  void k;
  return (
    <Frame label="Adam steps out from behind a tree into a wash of golden light, head bowed and both hands open. Eve stays close by the trunk, still half hidden">
      <Stage id="g1clip" sky={SKY} ground={GRASS} y={128}>
        <GardenBack />
        <Path d="M262 88 L120 126 L146 172 L290 172 Z" fill={CREAM} opacity={0.3} />
        <Path d="M262 98 L170 128 L186 172 L290 172 Z" fill={GOLD} opacity={0.22} />
        <Glow x={268} y={84} s={1.4} />
        <Gardener who="eve" x={96} y={166} s={1.3} bow={1} />
        <Trunk x={128} base={172} top={20} w={24} />
        <Canopy cx={122} cy={22} r={44} fill={CANOPY_D} />
        <Canopy cx={60} cy={14} r={34} fill={CANOPY_D} />
        <Gardener
          who="adam"
          x={172}
          y={166}
          s={1.45}
          bow={5}
          hands={[
            [-20, -22],
            [20, -22],
          ]}
        />
      </Stage>
    </Frame>
  );
}

/* ---------- 5. the coats ---------- */
function Coats({ k }: { k: Ink }) {
  void k;
  return (
    <Frame label="Adam and Eve stand side by side now wearing simple warm coats of skin, tan with a stitched edge. The fig leaves they dropped lie on the ground, and a soft golden glow rests over them">
      <Stage id="g1clip" sky={SKY} ground={GRASS} y={128}>
        <GardenBack />
        <Circle cx={150} cy={80} r={86} fill={GOLD} opacity={0.14} />
        <Circle cx={150} cy={80} r={62} fill={GOLD} opacity={0.18} />
        <Circle cx={150} cy={78} r={40} fill={CREAM} opacity={0.3} />
        <Trunk x={30} base={150} top={40} w={14} />
        <Canopy cx={32} cy={36} r={30} fill={CANOPY_D} />
        <Trunk x={270} base={150} top={40} w={14} />
        <Canopy cx={268} cy={36} r={30} fill={CANOPY_D} />
        <Leaf x={74} y={158} s={0.8} rot={-70} />
        <Leaf x={150} y={162} s={0.75} rot={80} />
        <Leaf x={228} y={157} s={0.8} rot={55} />
        <Gardener who="adam" x={112} y={164} s={1.5} coat />
        <Gardener who="eve" x={190} y={164} s={1.5} flip coat />
      </Stage>
    </Frame>
  );
}

/* ---------- 6. two halves of one person ---------- */
const SHIRT = '#4C86C8';
const PANTS = '#4A4F63';

/* a person today, standing on (x, y), facing right unless flip; hair 'short' or 'big' (the eighties). arms: down, face (a hand over the eyes), walk. */
function Modern({
  x,
  y,
  s = 1,
  flip = false,
  shirt = SHIRT,
  pants = PANTS,
  skin = SKIN,
  hair = HAIR,
  big = false,
  arms = 'down',
  stride = 0,
  bow = 0,
  smile = false,
  tears = false,
  shoe = '#3B2A22',
}: {
  x: number;
  y: number;
  s?: number;
  flip?: boolean;
  shirt?: string;
  pants?: string;
  skin?: string;
  hair?: string;
  big?: boolean;
  arms?: 'down' | 'face' | 'walk';
  stride?: number;
  bow?: number;
  smile?: boolean;
  tears?: boolean;
  shoe?: string;
}) {
  const sw = 1.4 / s;
  const lf = -5 - stride;
  const rf = 5 + stride;
  return (
    <G transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      <Tube
        fill={pants}
        s={s}
        parts={[
          [`M-5 -26 L${lf} -4`, 8.5],
          [`M5 -26 L${rf} -4`, 8.5],
        ]}
      />
      <Ellipse cx={lf + 2} cy={-1.5} rx={6.4} ry={3.2} fill={shoe} stroke={BEAR_LINE} strokeWidth={sw} />
      <Ellipse cx={rf + 2} cy={-1.5} rx={6.4} ry={3.2} fill={shoe} stroke={BEAR_LINE} strokeWidth={sw} />
      <Rect x={-3.2} y={-58} width={6.4} height={8} fill={skin} stroke={BEAR_LINE} strokeWidth={sw} />
      <Path d="M-12 -49 Q-12 -55 -6 -55 L6 -55 Q12 -55 12 -49 L12 -24 L-12 -24 Z" fill={shirt} stroke={BEAR_LINE} strokeWidth={sw} strokeLinejoin="round" />
      {arms === 'face' ? (
        <G>
          <Tube fill={shirt} s={s} parts={[['M-11 -50 L-14 -32', 6]]} />
          <Hand x={-14} y={-30} r={3.6} s={s} fill={skin} />
        </G>
      ) : arms === 'walk' ? (
        <G>
          <Tube fill={shirt} s={s} parts={[['M-11 -50 L-17 -34', 6]]} />
          <Hand x={-17.5} y={-32} r={3.6} s={s} fill={skin} />
          <Tube fill={shirt} s={s} parts={[['M11 -50 L19 -36', 6]]} />
          <Hand x={19.5} y={-34} r={3.6} s={s} fill={skin} />
        </G>
      ) : (
        <G>
          <Tube fill={shirt} s={s} parts={[['M-11 -50 L-14 -33', 6]]} />
          <Hand x={-14} y={-30} r={3.6} s={s} fill={skin} />
          <Tube fill={shirt} s={s} parts={[['M11 -50 L14 -33', 6]]} />
          <Hand x={14} y={-30} r={3.6} s={s} fill={skin} />
        </G>
      )}
      <G transform={`translate(${bow * 0.6} ${bow})`}>
        <Circle cx={0} cy={-62} r={9} fill={skin} stroke={BEAR_LINE} strokeWidth={sw} />
        {big ? (
          <G>
            <Path
              d="M-11 -62 Q-14 -77 0 -77.5 Q14 -77 11 -62 Q8 -70 0 -69 Q-8 -70 -11 -62 Z"
              fill={hair}
              stroke={BEAR_LINE}
              strokeWidth={sw * 0.7}
              strokeLinejoin="round"
            />
            <Path d="M-10 -63 Q-16 -58 -12 -52 Q-9 -56 -8 -60 Z" fill={hair} />
          </G>
        ) : (
          <Path d="M-9.2 -63 Q-9.5 -73 0 -73 Q9.5 -73 9.2 -63 Q4 -68 -1 -67.5 Q-6 -67 -9.2 -63 Z" fill={hair} />
        )}
        {arms !== 'face' ? <Circle cx={4} cy={-62} r={1.3} fill={BEAR_LINE} /> : null}
        {smile ? <Path d="M1.5 -57 Q5 -54.4 8 -57.4" stroke={BEAR_LINE} strokeWidth={1.2} fill="none" strokeLinecap="round" /> : null}
      </G>
      {arms === 'face' ? (
        <G>
          <Tube fill={shirt} s={s} parts={[[`M11 -50 L18 -42 L${3 + bow * 0.6} ${-59 + bow}`, 6]]} />
          <Hand x={3 + bow * 0.6} y={-60 + bow} r={4.8} s={s} fill={skin} />
        </G>
      ) : null}
      {tears ? (
        <G fill="#7FB6E8" stroke={BEAR_LINE} strokeWidth={0.8}>
          <Path d="M10 -56 Q12.6 -52.6 10 -49.6 Q7.4 -52.6 10 -56 Z" />
          <Path d="M12 -47 Q14 -44.4 12 -42 Q10 -44.4 12 -47 Z" />
        </G>
      ) : null}
    </G>
  );
}

function Whole({ k }: { k: Ink }) {
  const p = useRun(500, 1700);
  const e = 1 - (1 - p) * (1 - p);
  const slide = 12 * (1 - e);
  return (
    <Frame label="Two halves of one person. On the left, the person stands in daylight, seen. On the right, the same person stands in shadow among dark trees, head bowed. A golden seam of stitches and two arrows draw the halves together">
      <Stage id="g1clipL" sky="#F6DFA0" ground={GRASS} y={130} x1={150} round="l">
        <Circle cx={44} cy={44} r={30} fill={GOLD} opacity={0.3} />
        <Circle cx={44} cy={44} r={17} fill="#FFE29A" />
        <Path d="M10 126 Q60 108 110 120 Q130 114 150 122 L150 134 L10 134 Z" fill={HILL} />
      </Stage>
      <Stage id="g1clipR" sky="#3F4B6B" ground="#2D384D" y={130} x0={150} round="r">
        {[176, 262].map((x) => (
          <G key={x}>
            <Trunk x={x} base={150} top={30} w={14} fill="#222C3E" />
            <Canopy cx={x} cy={26} r={30} fill="#1B2536" />
          </G>
        ))}
      </Stage>
      <Modern x={76} y={166} s={1.5} />
      <Modern x={226} y={166} s={1.5} shirt="#27466E" pants="#262A3A" skin={SKIN_D} hair="#2B1E16" bow={5} />
      <G fill="none" stroke={GOLD} strokeWidth={2.4} strokeLinecap="round">
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <Path key={i} d={`M146 ${34 + i * 18} L154 ${40 + i * 18} M154 ${34 + i * 18} L146 ${40 + i * 18}`} opacity={p > i / 7 ? 1 : 0} />
        ))}
      </G>
      <G transform={`translate(${-slide} 0)`}>
        <Path d="M104 100 L128 100 M121 93 L129 100 L121 107" stroke={BEAR_LINE} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <Path d="M104 100 L128 100 M121 93 L129 100 L121 107" stroke={GOLD} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </G>
      <G transform={`translate(${slide} 0)`}>
        <Path d="M196 100 L172 100 M179 93 L171 100 L179 107" stroke={BEAR_LINE} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <Path d="M196 100 L172 100 M179 93 L171 100 L179 107" stroke={GOLD} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </G>
      <Say x={150} y={190} s="integer: whole" fill={k.ink} />
    </Frame>
  );
}

/* ---------- 7. David, the weight put down ---------- */

/* King David on (x, y): blue robe, a crown, a dark beard. bent leans him forward under a weight on his back; the weight is drawn separately */
function David({ x, y, s = 1, bent = 0, hands }: { x: number; y: number; s?: number; bent?: number; hands?: [Pt, Pt] }) {
  const sw = 1.4 / s;
  const [hl, hr] = hands ?? [
    [-12, -26],
    [12, -26],
  ];
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Path d="M-15 0 L-10 -24 L10 -24 L15 0 Z" fill={BLUE} stroke={BEAR_LINE} strokeWidth={sw} strokeLinejoin="round" />
      <Path d="M-14.4 -4 L14.4 -4" stroke={GOLD} strokeWidth={2.4} strokeLinecap="round" />
      <G transform={`rotate(${bent} 0 -23)`}>
        <Path d="M-10 -22 L-9.5 -40 Q0 -46 9.5 -40 L10 -22 Z" fill={BLUE} stroke={BEAR_LINE} strokeWidth={sw} strokeLinejoin="round" />
        <Path d="M-10.4 -26 L10.4 -26" stroke={BLUE_L} strokeWidth={3.4} strokeLinecap="round" />
        <Tube
          fill={BLUE}
          s={s}
          parts={[
            [`M-8 -40 L${hl[0]} ${hl[1]}`, 5],
            [`M8 -40 L${hr[0]} ${hr[1]}`, 5],
          ]}
        />
        <Hand x={hl[0]} y={hl[1]} r={3.4} s={s} />
        <Hand x={hr[0]} y={hr[1]} r={3.4} s={s} />
        <Circle cx={0} cy={-51} r={8.5} fill={SKIN} stroke={BEAR_LINE} strokeWidth={sw} />
        <Path
          d="M-7 -48 Q-7.4 -39 0 -37.6 Q7.4 -39 7 -48 Q3 -44 0 -44 Q-3 -44 -7 -48 Z"
          fill="#5A3A25"
          stroke={BEAR_LINE}
          strokeWidth={sw * 0.7}
          strokeLinejoin="round"
        />
        <Path
          d="M-8.6 -56 L-8.4 -65 L-4.2 -60.6 L0 -67 L4.2 -60.6 L8.4 -65 L8.6 -56 Q0 -59 -8.6 -56 Z"
          fill={GOLD}
          stroke={BEAR_LINE}
          strokeWidth={sw * 0.8}
          strokeLinejoin="round"
        />
        <Circle cx={4} cy={-52} r={1.2} fill={BEAR_LINE} />
        {bent > 0 ? (
          <Path
            d="M-28 -30 Q-30 -46 -16 -50 Q-2 -50 -1 -38 Q-2 -26 -16 -24 Q-27 -24 -28 -30 Z"
            fill={ROCK}
            stroke={BEAR_LINE}
            strokeWidth={sw}
            strokeLinejoin="round"
          />
        ) : null}
        {bent > 0 ? (
          <Path d="M-22 -42 Q-18 -47 -10 -46 M-23 -34 Q-18 -32 -12 -33" stroke="#6A6280" strokeWidth={1.4} strokeLinecap="round" fill="none" />
        ) : null}
      </G>
    </G>
  );
}

const RAIN = Array.from({ length: 16 }, (_, i) => [156 + ((i * 41) % 128), 18 + ((i * 53) % 124)] as const);

function Psalm({ k }: { k: Ink }) {
  void k;
  return (
    <Frame label="On the left, King David in a crown and blue robe is bent over on cracked, dry summer ground under a heavy dark weight on his back and a hot sun. On the right, the same David stands up straight with the weight set down beside him, in rain and a shaft of light">
      <Stage id="g1clipL" sky="#F0B766" ground="#C99A5E" y={118} x1={148} round="l">
        <Circle cx={52} cy={46} r={36} fill="#FFE29A" opacity={0.35} />
        <Circle cx={52} cy={46} r={22} fill="#FFE9A8" />
        <Path d="M10 118 Q50 104 90 116 Q120 110 148 120 L148 126 L10 126 Z" fill="#DDA766" />
        <G stroke="#8A5F33" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" fill="none">
          <Path d="M22 160 L44 148 L62 156 L82 146 L104 154 L128 144 L146 150" />
          <Path d="M44 148 L48 134 M82 146 L90 134 L100 138 M104 154 L108 168 M62 156 L58 168 M128 144 L132 132" />
          <Path d="M18 134 L36 138 L50 132" />
        </G>
        <David
          x={84}
          y={164}
          s={1.5}
          bent={42}
          hands={[
            [-4, -26],
            [6, -24],
          ]}
        />
      </Stage>
      <Stage id="g1clipR" sky="#9FC4DE" ground="#7FA862" y={126} x0={152} round="r">
        <Path d="M196 10 L238 10 L268 172 L176 172 Z" fill="#FFF1B8" opacity={0.4} />
        <Path d="M208 10 L230 10 L252 172 L196 172 Z" fill="#FFF8D8" opacity={0.3} />
        <Path d="M152 126 Q200 112 250 124 Q272 118 290 126 L290 134 L152 134 Z" fill="#8DB67B" />
        <Ellipse cx={262} cy={158} rx={20} ry={5} fill="#7FB0D6" opacity={0.7} />
        <G stroke="#EAF4FB" strokeWidth={1.8} strokeLinecap="round" opacity={0.85}>
          {RAIN.map(([rx, ry], i) => (
            <Path key={i} d={`M${rx} ${ry} L${rx - 4} ${ry + 11}`} />
          ))}
        </G>
        <Path d="M162 172 Q160 150 172 142 Q186 136 194 148 L198 172 Z" fill={ROCK} stroke={BEAR_LINE} strokeWidth={1.4} strokeLinejoin="round" />
        <Path d="M170 150 Q176 146 182 150" stroke="#6A6280" strokeWidth={1.4} strokeLinecap="round" fill="none" />
        <David
          x={228}
          y={164}
          s={1.5}
          hands={[
            [-19, -31],
            [19, -31],
          ]}
        />
      </Stage>
    </Frame>
  );
}

/* ---------- 8. the boy in the grove ---------- */
const LINEN = '#EADFC6';
const BREECHES = '#6B4A2E';

/* a boy of 1820, kneeling on (x, y) and facing right: a linen shirt, brown trousers held by suspenders, bare head, hands together, face lifted */
function Boy({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  const sw = 1.4 / s;
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Tube
        fill={BREECHES}
        s={s}
        parts={[
          ['M-20 -5 L6 -5', 8],
          ['M6 -5 L-2 -26', 9],
        ]}
      />
      <Ellipse cx={-22} cy={-4} rx={5} ry={3} fill="#3B2A22" stroke={BEAR_LINE} strokeWidth={sw} />
      <Tube fill={LINEN} s={s} parts={[['M-2 -27 L1 -45', 16]]} />
      <Path d="M-5 -46 L-5 -28 M5 -46 L5 -27" stroke={WOOD_D} strokeWidth={1.8} strokeLinecap="round" fill="none" />
      <Tube fill={LINEN} s={s} parts={[['M3 -47 Q10 -40 14 -46', 5.5]]} />
      <Hand x={14.5} y={-47} r={3.6} s={s} />
      <Circle cx={3} cy={-57} r={8.2} fill={SKIN} stroke={BEAR_LINE} strokeWidth={sw} />
      <Path d="M-5.4 -58 Q-5.8 -67 3 -66.6 Q11.4 -66 11 -58 Q8 -62 4 -61.6 Q-1 -62 -5.4 -58 Z" fill="#6B4528" />
      <Circle cx={7} cy={-57} r={1.2} fill={BEAR_LINE} />
    </G>
  );
}

function Grove({ k }: { k: Ink }) {
  void k;
  return (
    <Frame label="A fourteen-year-old boy in plain farm clothes of the 1820s kneels in a clearing among tall trees. A dark heaviness presses in from the left, and a shaft of light breaks in from above onto him">
      <Stage id="g1clip" sky="#CFE0A8" ground="#8FB46E" y={122}>
        {[34, 78].map((x) => (
          <G key={x}>
            <Trunk x={x} base={140} top={20} w={16} fill="#4B3A2A" />
            <Canopy cx={x} cy={20} r={34} fill="#254A34" />
          </G>
        ))}
        {[236, 272].map((x) => (
          <G key={x}>
            <Trunk x={x} base={140} top={20} w={16} />
            <Canopy cx={x} cy={20} r={34} fill={CANOPY_D} />
          </G>
        ))}
        <Canopy cx={160} cy={4} r={40} fill="#3E7449" />
        <Ellipse cx={176} cy={164} rx={70} ry={14} fill="#B6D68A" opacity={0.7} />
        <Path d="M164 8 L196 8 L242 172 L118 172 Z" fill="#FFF1B8" opacity={0.38} />
        <Path d="M172 8 L190 8 L218 172 L150 172 Z" fill="#FFF8D8" opacity={0.34} />
        <G transform="translate(232 164)">
          <Ellipse cx={0} cy={-1} rx={13} ry={3.4} fill="#D8B76A" stroke={BEAR_LINE} strokeWidth={1.3} />
          <Path d="M-7 -2 Q-7 -11 0 -11 Q7 -11 7 -2 Z" fill="#E4C57C" stroke={BEAR_LINE} strokeWidth={1.3} strokeLinejoin="round" />
          <Path d="M-7 -4 L7 -4" stroke={WOOD_D} strokeWidth={1.6} />
        </G>
        <Boy x={182} y={164} s={1.6} />
        <G fill="#150F26">
          <Ellipse cx={30} cy={100} rx={80} ry={96} opacity={0.3} />
          <Ellipse cx={34} cy={106} rx={64} ry={82} opacity={0.32} />
          <Ellipse cx={30} cy={112} rx={46} ry={66} opacity={0.38} />
          <Ellipse cx={96} cy={96} rx={36} ry={26} opacity={0.3} />
          <Ellipse cx={104} cy={126} rx={32} ry={22} opacity={0.3} />
          <Ellipse cx={118} cy={104} rx={18} ry={14} opacity={0.3} />
          <Ellipse cx={122} cy={134} rx={16} ry={12} opacity={0.3} />
        </G>
      </Stage>
    </Frame>
  );
}

/* ---------- 9. out of the dark trees, into the clearing ---------- */
function Clearing({ k }: { k: Ink }) {
  void k;
  return (
    <Frame label="A person in plain modern clothes steps out of a dark line of trees on the left into an open, sunlit clearing, walking toward the light">
      <Stage id="g1clip" sky="#FBE3A0" ground="#9BCB75" y={118}>
        <Circle cx={236} cy={44} r={44} fill={GOLD} opacity={0.3} />
        <Circle cx={236} cy={44} r={26} fill="#FFE29A" />
        <Circle cx={236} cy={44} r={14} fill="#FFF8D8" />
        <Path d="M10 118 Q80 104 150 114 Q220 104 290 116 L290 124 L10 124 Z" fill="#B3D58A" />
        <Path d="M10 10 L104 10 Q118 90 98 172 L10 172 Z" fill="#22382F" />
        {[28, 62, 94].map((x, i) => (
          <G key={x}>
            <Trunk x={x} base={160} top={30 + i * 6} w={14} fill="#33493E" />
            <Canopy cx={x} cy={26 + i * 4} r={30} fill={i === 1 ? '#1A2B24' : '#26453A'} />
          </G>
        ))}
        <Ellipse cx={170} cy={166} rx={78} ry={10} fill="#C3E198" opacity={0.7} />
        <Modern x={138} y={166} s={1.55} arms="walk" stride={7} shirt="#3C9C8C" pants="#4A4F63" />
        <Path d="M186 158 L196 156 M214 166 L226 164 M252 160 L262 158" stroke="#6FA054" strokeWidth={2} strokeLinecap="round" />
      </Stage>
    </Frame>
  );
}

/* ---------- 10 to 12. the student, 1986 ---------- */
const SWEATER = '#C4583C';
const JEANS = '#3F5E8F';
const WALL = '#D9C39A';
const FLOOR = '#8F7050';
const PAPER = '#F3E7C9';

/* the small plain room: a wall, a floor, a baseboard, a door at the left, a desk with a lamp at the right and a pad of paper on it */
function Room({ open = false, lit = true }: { open?: boolean; lit?: boolean }) {
  return (
    <G>
      <Rect x={10} y={146} width={280} height={26} fill={FLOOR} />
      <Rect x={10} y={142} width={280} height={5} fill="#7A5C3E" />
      {open ? (
        <G>
          <Rect x={26} y={46} width={48} height={100} fill="#2C2420" stroke={BEAR_LINE} strokeWidth={1.5} />
          <Path d="M30 52 L66 52 L66 142 L30 142 Z" fill="#5A4636" opacity={0.6} />
          <Path d="M26 46 L42 54 L42 142 L26 146 Z" fill="#A9783F" stroke={BEAR_LINE} strokeWidth={1.5} strokeLinejoin="round" />
          <Circle cx={38} cy={100} r={2} fill={GOLD_D} />
        </G>
      ) : (
        <G>
          <Rect x={26} y={46} width={48} height={100} rx={2} fill="#A9783F" stroke={BEAR_LINE} strokeWidth={1.5} />
          <Rect x={33} y={54} width={34} height={36} rx={1.5} fill="none" stroke={WOOD_D} strokeWidth={1.4} />
          <Rect x={33} y={98} width={34} height={38} rx={1.5} fill="none" stroke={WOOD_D} strokeWidth={1.4} />
          <Circle cx={65} cy={96} r={2.6} fill={GOLD} stroke={BEAR_LINE} strokeWidth={1} />
        </G>
      )}
      <Rect x={150} y={98} width={134} height={7} rx={2} fill={WOOD} stroke={BEAR_LINE} strokeWidth={1.5} />
      <Rect x={156} y={105} width={5} height={50} fill={WOOD_D} />
      <Rect x={272} y={105} width={5} height={50} fill={WOOD_D} />
      <Rect x={190} y={105} width={64} height={16} rx={2} fill="#9A6A38" stroke={BEAR_LINE} strokeWidth={1.3} />
      <Rect x={218} y={111} width={8} height={3} rx={1.2} fill={GOLD_D} />
      {lit ? <Path d="M246 72 L260 72 L212 100 L160 100 Z" fill={GOLD} opacity={0.26} /> : null}
      <Path d="M262 98 L262 94 M262 94 L250 70" stroke={BEAR_LINE} strokeWidth={4.4} strokeLinecap="round" fill="none" />
      <Path d="M262 98 L262 94 M262 94 L250 70" stroke="#7C7C86" strokeWidth={2} strokeLinecap="round" fill="none" />
      <Ellipse cx={262} cy={97} rx={9} ry={2.6} fill="#7C7C86" stroke={BEAR_LINE} strokeWidth={1.2} />
      <Path d="M238 74 L258 74 L252 62 L242 62 Z" fill="#3E6B58" stroke={BEAR_LINE} strokeWidth={1.4} strokeLinejoin="round" />
      {lit ? <Ellipse cx={248} cy={75} rx={7} ry={2} fill={CREAM} /> : null}
      <Path d="M168 97 L196 97 L200 91 L172 91 Z" fill={PAPER} stroke={BEAR_LINE} strokeWidth={1.2} strokeLinejoin="round" />
      <Path d="M175 94 L190 94 M178 93 L194 93" stroke="#8A7A5A" strokeWidth={0.9} strokeLinecap="round" />
    </G>
  );
}

/* the student, seated at the desk's end, leaning in and writing */
function Writer({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  const sw = 1.4 / s;
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Rect x={-18} y={-62} width={4} height={34} rx={1.5} fill={WOOD} stroke={BEAR_LINE} strokeWidth={sw} />
      <Rect x={-18} y={-31} width={28} height={4} rx={1.5} fill={WOOD} stroke={BEAR_LINE} strokeWidth={sw} />
      <Rect x={-16} y={-27} width={3} height={27} fill={WOOD_D} />
      <Rect x={6} y={-27} width={3} height={27} fill={WOOD_D} />
      <Tube
        fill={JEANS}
        s={s}
        parts={[
          ['M-6 -36 L20 -36', 10],
          ['M20 -36 L22 -6', 8.5],
        ]}
      />
      <Ellipse cx={26} cy={-2} rx={7} ry={3.2} fill="#EDE6D6" stroke={BEAR_LINE} strokeWidth={sw} />
      <Tube fill={SWEATER} s={s} parts={[['M-6 -38 L9 -62', 16]]} />
      <Path d="M-8 -46 L6 -52 M-5 -40 L9 -46" stroke="#F0D9B0" strokeWidth={2} strokeLinecap="round" opacity={0.9} />
      <Tube fill={SWEATER} s={s} parts={[['M9 -60 L25 -48 L38 -48', 5.5]]} />
      <Hand x={39} y={-48} r={3.4} s={s} />
      <Path d="M39 -48 L43 -52" stroke={BEAR_LINE} strokeWidth={1.4} strokeLinecap="round" />
      <Circle cx={15} cy={-75} r={9.4} fill={SKIN} stroke={BEAR_LINE} strokeWidth={sw} />
      <Path
        d="M5 -76 Q2 -91 16 -91 Q30 -90 25 -76 Q21 -85 15 -84 Q8 -85 5 -76 Z"
        fill="#5A3A22"
        stroke={BEAR_LINE}
        strokeWidth={sw * 0.7}
        strokeLinejoin="round"
      />
      <Path d="M6 -78 Q0 -72 4 -64 Q8 -68 8 -74 Z" fill="#5A3A22" />
      <Circle cx={20} cy={-74} r={1.3} fill={BEAR_LINE} />
    </G>
  );
}

function Desk({ k }: { k: Ink }) {
  void k;
  return (
    <Frame label="A student of the 1980s sits alone at a desk in a small plain room, writing on a pad of paper under a desk lamp. The door behind him is closed">
      <Stage id="g1clip" sky={WALL}>
        <Room />
        <Writer x={124} y={156} s={1.3} />
      </Stage>
    </Frame>
  );
}

function Tears({ k }: { k: Ink }) {
  void k;
  return (
    <Frame label="The same student leaves the room, one hand pressed to his face, upset. The door stands open behind him, and the pad of paper is left on the desk beside the lit lamp">
      <Stage id="g1clip" sky={WALL}>
        <Room open />
        <Rect x={138} y={96} width={4} height={34} rx={1.5} fill={WOOD} stroke={BEAR_LINE} strokeWidth={1.3} />
        <Rect x={138} y={126} width={28} height={4} rx={1.5} fill={WOOD} stroke={BEAR_LINE} strokeWidth={1.3} />
        <Rect x={140} y={130} width={3} height={24} fill={WOOD_D} />
        <Rect x={160} y={130} width={3} height={24} fill={WOOD_D} />
        <Modern x={98} y={162} s={1.45} flip big arms="face" shirt={SWEATER} pants={JEANS} hair="#5A3A22" shoe="#EDE6D6" bow={4} tears />
      </Stage>
    </Frame>
  );
}

/* ---------- 12. fewer visits to the health center ---------- */

/* a health cross, centered on (x, y) */
function Cross({ x, y }: { x: number; y: number }) {
  return (
    <Path
      transform={`translate(${x} ${y})`}
      d="M-2.6 -7.5 L2.6 -7.5 L2.6 -2.6 L7.5 -2.6 L7.5 2.6 L2.6 2.6 L2.6 7.5 L-2.6 7.5 L-2.6 2.6 L-7.5 2.6 L-7.5 -2.6 L-2.6 -2.6 Z"
      fill="#D6334A"
      stroke={BEAR_LINE}
      strokeWidth={1}
      strokeLinejoin="round"
    />
  );
}

/* a calendar of six months, with a cross in each month the student went to the health center */
function Months({ x, crosses }: { x: number; crosses: boolean[] }) {
  return (
    <G>
      <Rect x={x} y={42} width={124} height={66} rx={6} fill="#FFF3D6" stroke={BEAR_LINE} strokeWidth={1.5} />
      <Path
        d={`M${x} 48 Q${x} 42 ${x + 6} 42 L${x + 118} 42 Q${x + 124} 42 ${x + 124} 48 L${x + 124} 52 L${x} 52 Z`}
        fill="#C65B4A"
        stroke={BEAR_LINE}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <Circle cx={x + 30} cy={42} r={2.4} fill="#FFF3D6" stroke={BEAR_LINE} strokeWidth={1} />
      <Circle cx={x + 94} cy={42} r={2.4} fill="#FFF3D6" stroke={BEAR_LINE} strokeWidth={1} />
      {crosses.map((c, i) => {
        const cx = x + 6 + (i % 3) * 38;
        const cy = 56 + Math.floor(i / 3) * 24;
        return (
          <G key={i}>
            <Rect x={cx} y={cy} width={34} height={21} rx={3} fill="#F4DFAE" stroke="#9C7A3A" strokeWidth={1} />
            {c ? <Cross x={cx + 17} y={cy + 10.5} /> : null}
          </G>
        );
      })}
    </G>
  );
}

function Label({ x, s, k }: { x: number; s: string; k: Ink }) {
  return (
    <G>
      <Rect x={x - 48} y={20} width={96} height={16} rx={8} fill={k.ink} />
      <Say x={x} y={32} s={s} fill={k.bg} size={10} />
    </G>
  );
}

function Health({ k }: { k: Ink }) {
  return (
    <Frame label="Two calendars of six months each, marked with a red health-center cross for every month the student went. The left calendar, room and shoes, has five crosses. The right one, the truth, has only two. The student between them smiles slightly">
      <Stage id="g1clip" sky="#F2C98A">
        <Rect x={10} y={146} width={280} height={26} fill="#E0B070" opacity={0.5} />
        <Label x={82} s="room and shoes" k={k} />
        <Label x={218} s="the truth" k={k} />
        <Months x={20} crosses={[true, true, false, true, true, true]} />
        <Months x={156} crosses={[false, true, false, false, true, false]} />
        <Modern x={150} y={170} s={0.84} big smile shirt={SWEATER} pants={JEANS} hair="#5A3A22" shoe="#EDE6D6" />
      </Stage>
    </Frame>
  );
}

export const SCENES_I1: Record<string, ComponentType<{ k: Ink }>> = {
  'g1-fig': Fig,
  'g1-trees': Trees,
  'g1-call': Call,
  'g1-answer': Answer,
  'g1-coats': Coats,
  'g1-whole': Whole,
  'g1-psalm': Psalm,
  'g1-grove': Grove,
  'g1-clearing': Clearing,
  'g1-desk': Desk,
  'g1-tears': Tears,
  'g1-health': Health,
};
