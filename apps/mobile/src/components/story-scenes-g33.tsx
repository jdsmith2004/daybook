/* Scenes for lesson 33 told as a story (see story-kit.tsx): Wanting is not liking (Kent Berridge's dopamine studies). */
import { useEffect, useState, type ComponentType } from 'react';
import { Easing } from 'react-native';
import { Circle, Ellipse, G, Line, Path, Polygon, Rect } from 'react-native-svg';

import { useAppear, useReducedMotion } from '@/lib/motion';

import { Frame, type Ink, Say } from './story-kit';

const L33_GOLD = '#FFD25A';
const L33_WHITE = '#FFFFFF';
const L33_DARK = '#3A2430';
const L33_FUR = '#B5ABA2';
const L33_PINK = '#E9AFA8';
const L33_NOSE = '#D9707F';
const L33_TONGUE = '#E8707F';
const L33_BLUE = '#6EC1F0';
const L33_SKIN = '#F2C9A0';
const L33_SKIN2 = '#B98660';
const L33_WOOD = '#B8864A';
const L33_DIM = '#8D8896';

/* a number from 0 to 1 that eases up once, after a short pause; with Reduce Motion on it starts at 1 */
function useL33Grow(delay = 300, dur = 1100) {
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
function L33Cap({ k, s }: { k: Ink; s: string }) {
  return <Say x={150} y={190} s={s} fill={k.ink} />;
}

/* a scientist at a bench: a lab coat, glasses, turned to the right (flip turns left); y is the bench top */
function L33Sci({ x, y, k, skin, hair, flip = false }: { x: number; y: number; k: Ink; skin: string; hair: string; flip?: boolean }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${flip ? -1 : 1} 1)`}>
      <Path d="M-32 0 L-30 -28 Q-28 -46 0 -46 Q28 -46 30 -28 L32 0 Z" fill={L33_WHITE} stroke={k.muted} strokeWidth={1.5} />
      <Path d="M-9 -45 L0 -28 L9 -45" fill="none" stroke={k.muted} strokeWidth={1.5} strokeLinejoin="round" />
      <Circle cx={0} cy={-62} r={16} fill={skin} />
      <Path d="M-16.5 -62 A16.5 16.5 0 0 1 16.5 -62 Q8 -70 -2 -68 Q-10 -66 -16.5 -62 Z" fill={hair} />
      <Circle cx={3} cy={-60} r={3.8} fill="none" stroke={L33_DARK} strokeWidth={1.2} />
      <Circle cx={12} cy={-60} r={3.8} fill="none" stroke={L33_DARK} strokeWidth={1.2} />
      <Line x1={6.8} y1={-60} x2={8.2} y2={-60} stroke={L33_DARK} strokeWidth={1.2} />
    </G>
  );
}

/* a rat seen from the side, facing right; (x, y) is the ground under it */
function L33Rat({ x, y, s = 1, still = false }: { x: number; y: number; s?: number; still?: boolean }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Path d="M-19 -7 Q-34 -4 -40 -14" fill="none" stroke={L33_PINK} strokeWidth={2.2} strokeLinecap="round" />
      <Rect x={-12} y={-4} width={5} height={5} rx={2} fill={L33_FUR} />
      <Rect x={6} y={-4} width={5} height={5} rx={2} fill={L33_FUR} />
      <Ellipse cx={0} cy={-11} rx={20} ry={10} fill={L33_FUR} />
      <Ellipse cx={20} cy={-11} rx={10} ry={8.5} fill={L33_FUR} />
      <Path d="M26 -16 L38 -9 L27 -5 Z" fill={L33_FUR} />
      <Circle cx={38} cy={-9} r={1.8} fill={L33_NOSE} />
      <Circle cx={16} cy={-19} r={4.8} fill={L33_PINK} />
      {still ? <Path d="M20 -13 L25 -13" stroke={L33_DARK} strokeWidth={1.4} strokeLinecap="round" /> : <Circle cx={24} cy={-13} r={1.5} fill={L33_DARK} />}
    </G>
  );
}

/* ---------- 1. the lab ---------- */
function L33Lab({ k }: { k: Ink }) {
  return (
    <Frame label="A scientist in a lab coat sits at a bench with a notebook, a small rat in a clear box and a flask tagged Dopamine.">
      <L33Sci x={62} y={140} k={k} skin={L33_SKIN} hair="#5A3E2B" />
      <Rect x={10} y={138} width={280} height={9} rx={3} fill={L33_WOOD} />
      <Rect x={24} y={147} width={8} height={28} rx={2} fill={L33_WOOD} />
      <Rect x={268} y={147} width={8} height={28} rx={2} fill={L33_WOOD} />
      <Rect x={112} y={100} width={76} height={38} rx={5} fill={k.soft} opacity={0.5} />
      <L33Rat x={150} y={136} s={0.85} />
      <Rect x={112} y={100} width={76} height={38} rx={5} fill="none" stroke={k.muted} strokeWidth={2} />
      <Line x1={118} y1={106} x2={118} y2={118} stroke={L33_WHITE} strokeWidth={2} strokeLinecap="round" opacity={0.7} />
      <Path d="M196 138 L203 129 L238 129 L231 138 Z" fill={L33_WHITE} stroke={k.muted} strokeWidth={1.5} strokeLinejoin="round" />
      <Line x1={207} y1={133.5} x2={228} y2={133.5} stroke={k.line} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M256 98 L268 98 L268 112 L284 138 L240 138 L256 112 Z" fill={k.soft} opacity={0.5} />
      <Path d="M248.6 124 L275.4 124 L284 138 L240 138 Z" fill={L33_GOLD} />
      <Path d="M256 98 L268 98 L268 112 L284 138 L240 138 L256 112 Z" fill="none" stroke={k.muted} strokeWidth={2} strokeLinejoin="round" />
      <Rect x={253} y={95} width={18} height={4} rx={2} fill={k.muted} />
      <Line x1={262} y1={87} x2={262} y2={96} stroke={k.muted} strokeWidth={1.5} />
      <Rect x={234} y={72} width={56} height={15} rx={4} fill={L33_WHITE} stroke={k.muted} strokeWidth={1.5} />
      <Say x={262} y={83} s="Dopamine" fill={L33_DARK} size={10} />
      <L33Cap k={k} s="The pleasure chemical?" />
    </Frame>
  );
}

/* ---------- 2. the faces ---------- */
/* a face from the front: a rat or a baby, content at a sweet taste (licking) or gaping at a bitter one */
function L33Face({ x, y, rat, bitter }: { x: number; y: number; rat: boolean; bitter: boolean }) {
  const skin = rat ? L33_FUR : L33_SKIN;
  return (
    <G transform={`translate(${x} ${y})`}>
      {rat ? (
        <G>
          <Circle cx={-17} cy={-18} r={9} fill={L33_FUR} />
          <Circle cx={17} cy={-18} r={9} fill={L33_FUR} />
          <Circle cx={-17} cy={-18} r={5} fill={L33_PINK} />
          <Circle cx={17} cy={-18} r={5} fill={L33_PINK} />
        </G>
      ) : (
        <G>
          <Circle cx={-24} cy={2} r={5} fill={L33_SKIN} />
          <Circle cx={24} cy={2} r={5} fill={L33_SKIN} />
        </G>
      )}
      <Circle cx={0} cy={0} r={24} fill={skin} />
      {rat ? null : <Path d="M-3 -24 Q-8 -33 0 -33 Q6 -32 3 -26" fill="none" stroke="#5A3E2B" strokeWidth={2.4} strokeLinecap="round" />}
      {bitter ? (
        <G stroke={L33_DARK} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" fill="none">
          <Path d="M-13 -8 L-6 -4 L-13 0" />
          <Path d="M13 -8 L6 -4 L13 0" />
        </G>
      ) : (
        <G stroke={L33_DARK} strokeWidth={1.9} strokeLinecap="round" fill="none">
          <Path d="M-12 -3 Q-8.5 -9 -5 -3" />
          <Path d="M5 -3 Q8.5 -9 12 -3" />
        </G>
      )}
      {rat ? <Ellipse cx={0} cy={4} rx={3.2} ry={2.4} fill={L33_NOSE} /> : <Circle cx={0} cy={4} r={1.4} fill={L33_DARK} opacity={0.5} />}
      {bitter ? (
        <G>
          <Ellipse cx={0} cy={14} rx={8} ry={7} fill={L33_DARK} />
          <Ellipse cx={0} cy={18.5} rx={5} ry={3} fill={L33_TONGUE} />
        </G>
      ) : (
        <G>
          <Path d="M-8 11 Q0 17 8 11" fill="none" stroke={L33_DARK} strokeWidth={1.8} strokeLinecap="round" />
          <Ellipse cx={5} cy={17} rx={5} ry={3.4} fill={L33_TONGUE} />
          <Circle cx={5.5} cy={15.2} r={2.1} fill={L33_BLUE} />
        </G>
      )}
    </G>
  );
}
function L33Faces({ k }: { k: Ink }) {
  return (
    <Frame label="Two panels. On the left, a rat and a baby taste something sweet and lick their lips, content. On the right, the same two faces taste something bitter and gape.">
      <Rect x={8} y={10} width={138} height={150} rx={16} fill={k.soft} opacity={0.5} />
      <Rect x={154} y={10} width={138} height={150} rx={16} fill={k.soft} opacity={0.5} />
      <Say x={77} y={34} s="Sweet" fill={k.ink} size={12} />
      <Say x={223} y={34} s="Bitter" fill={k.ink} size={12} />
      <L33Face x={44} y={98} rat bitter={false} />
      <L33Face x={110} y={98} rat={false} bitter={false} />
      <L33Face x={190} y={98} rat bitter />
      <L33Face x={256} y={98} rat={false} bitter />
      <L33Cap k={k} s="The same faces, rat and baby" />
    </Frame>
  );
}

/* a rat's head in profile, facing right, centered on the middle of the head (about 150 wide). mood: plain, or lick (happy, tongue out) */
function L33Head({ k, lick = false }: { k: Ink; lick?: boolean }) {
  return (
    <G>
      <Path d="M-62 5 Q-62 -48 -5 -48 Q38 -48 52 -20 Q72 -8 88 8 Q90 16 80 20 Q60 26 42 34 Q20 52 -15 48 Q-62 44 -62 5 Z" fill={L33_FUR} />
      <Circle cx={-46} cy={-28} r={15} fill={L33_FUR} />
      <Circle cx={-46} cy={-28} r={9} fill={L33_PINK} />
      {lick ? (
        <G stroke={k.muted} strokeWidth={1.4} strokeLinecap="round">
          <Line x1={62} y1={0} x2={90} y2={-20} />
          <Line x1={64} y1={4} x2={100} y2={-12} />
          <Line x1={66} y1={8} x2={104} y2={-3} />
        </G>
      ) : (
        <G stroke={k.muted} strokeWidth={1.4} strokeLinecap="round">
          <Line x1={70} y1={10} x2={104} y2={0} />
          <Line x1={72} y1={15} x2={106} y2={15} />
          <Line x1={70} y1={19} x2={100} y2={30} />
        </G>
      )}
      <Circle cx={86} cy={9} r={5.5} fill={L33_NOSE} />
      {lick ? (
        <Path d="M30 -9 Q36 -17 42 -9" fill="none" stroke={L33_DARK} strokeWidth={2.4} strokeLinecap="round" />
      ) : (
        <G>
          <Circle cx={36} cy={-10} r={4.2} fill={L33_DARK} />
          <Circle cx={37.4} cy={-11.4} r={1.2} fill={L33_WHITE} />
        </G>
      )}
    </G>
  );
}

/* ---------- 3. almost no dopamine left ---------- */
function L33Gone({ k }: { k: Ink }) {
  const p = useL33Grow(500, 1500);
  const cells = [
    [-18, -24],
    [-6, -30],
    [8, -28],
    [18, -20],
    [-24, -14],
    [2, -17],
    [14, -9],
    [-18, -5],
    [-4, -4],
    [8, 0],
  ];
  const keep = [
    [-12, -16],
    [8, -10],
  ];
  return (
    <Frame label="A rat's head from the side, with a cluster of dots inside the brain. Almost all of the dots have gone dim and gray, and only two still glow gold.">
      <G transform="translate(135 100)">
        <L33Head k={k} />
        <Ellipse cx={-2} cy={-18} rx={32} ry={22} fill="#EBDDE8" stroke="#C79BB8" strokeWidth={2} />
        {cells.map(([cx, cy], i) => (
          <G key={i}>
            <Circle cx={cx} cy={cy} r={3.4} fill={L33_DIM} opacity={0.8} />
            <Circle cx={cx} cy={cy} r={8} fill={L33_GOLD} opacity={0.4 * (1 - p)} />
            <Circle cx={cx} cy={cy} r={3.4} fill={L33_GOLD} stroke="#E0A400" strokeWidth={1} opacity={1 - p} />
          </G>
        ))}
        {keep.map(([cx, cy], i) => (
          <G key={i}>
            <Circle cx={cx} cy={cy} r={9} fill={L33_GOLD} opacity={0.45} />
            <Circle cx={cx} cy={cy} r={4} fill={L33_GOLD} stroke="#E0A400" strokeWidth={1} />
          </G>
        ))}
      </G>
      <Say x={133} y={32} s="Dopamine" fill={k.muted} size={11} />
      <Line x1={133} y1={38} x2={133} y2={58} stroke={k.muted} strokeWidth={1.5} strokeLinecap="round" />
      <L33Cap k={k} s="Almost no dopamine left" />
    </Frame>
  );
}

/* ---------- 4. it would not go to the food ---------- */
function L33Bowl({ k }: { k: Ink }) {
  const p = useL33Grow(500, 1300);
  const dy = 120 + 15 * p;
  return (
    <Frame label="A rat lies still at one end of its cage. At the far end a full food bowl and a water bottle sit untouched, while a hand with a dropper comes down from above to feed the rat.">
      <Rect x={8} y={58} width={284} height={92} rx={6} fill={k.soft} opacity={0.4} />
      <Line x1={8} y1={58} x2={8} y2={150} stroke={k.muted} strokeWidth={2.5} strokeLinecap="round" />
      <Line x1={292} y1={58} x2={292} y2={150} stroke={k.muted} strokeWidth={2.5} strokeLinecap="round" />
      <Line x1={6} y1={150} x2={294} y2={150} stroke={k.muted} strokeWidth={3} strokeLinecap="round" />
      <L33Rat x={58} y={150} s={1.5} still />
      <G>
        <Circle cx={236} cy={134} r={5} fill="#D9B26F" />
        <Circle cx={248} cy={133} r={5} fill="#D9B26F" />
        <Circle cx={259} cy={135} r={5} fill="#D9B26F" />
        <Circle cx={242} cy={127} r={5} fill="#D9B26F" />
        <Circle cx={254} cy={127} r={5} fill="#D9B26F" />
        <Path d="M226 136 L270 136 Q268 150 258 150 L238 150 Q228 150 226 136 Z" fill="#C9824A" />
      </G>
      <Rect x={268} y={72} width={18} height={40} rx={7} fill="#BFE3F5" stroke={k.muted} strokeWidth={1.5} />
      <Rect x={268} y={90} width={18} height={22} rx={7} fill={L33_BLUE} opacity={0.6} />
      <Rect x={272} y={110} width={10} height={7} rx={2} fill={k.muted} />
      <Path d="M277 117 L277 128" stroke={k.muted} strokeWidth={2.5} strokeLinecap="round" />
      <Path d="M90 -4 L90 50 L118 50 L118 -4 Z" fill={L33_WHITE} stroke={k.muted} strokeWidth={1.5} />
      <Ellipse cx={104} cy={72} rx={6.5} ry={8.5} fill="#E0707A" />
      <Rect x={101.5} y={78} width={5} height={30} fill="#CFE6F2" stroke={k.muted} strokeWidth={1.2} />
      <Path d="M101.5 108 L106.5 108 L105 116 L103 116 Z" fill="#CFE6F2" stroke={k.muted} strokeWidth={1.2} strokeLinejoin="round" />
      <Rect x={92} y={44} width={24} height={20} rx={9} fill={L33_SKIN} />
      <Path d={`M104 ${dy - 5} Q108.5 ${dy + 1} 104 ${dy + 4} Q99.5 ${dy + 1} 104 ${dy - 5} Z`} fill={L33_BLUE} />
      <L33Cap k={k} s="It would not go to the food" />
    </Frame>
  );
}

/* ---------- 5. it still liked the sugar ---------- */
function L33Lick({ k }: { k: Ink }) {
  const p = useL33Grow(450, 1200);
  return (
    <Frame label="A close-up of the same rat. It sticks out a small pink tongue at the tip of its snout, curled up toward its nose with a drop of sugar on it, and has a happy face, and a warm gold glow shines by its mouth.">
      <G transform="translate(112 94) scale(1.1)">
        <Circle cx={96} cy={18} r={16 + 18 * p} fill={L33_GOLD} opacity={0.22} />
        <Circle cx={96} cy={18} r={9 + 11 * p} fill={L33_GOLD} opacity={0.34} />
        <L33Head k={k} lick />
        <Path d="M50 28 Q64 28 78 19" fill="none" stroke={L33_DARK} strokeWidth={1.8} strokeLinecap="round" />
        <Path d="M76 21 Q96 28 99 12" fill="none" stroke={L33_TONGUE} strokeWidth={7} strokeLinecap="round" />
        <Circle cx={91} cy={20} r={3.8} fill={L33_BLUE} />
        <Circle cx={90} cy={19} r={1.1} fill={L33_WHITE} />
        <G stroke={L33_GOLD} strokeWidth={3.2} strokeLinecap="round" opacity={0.5 + 0.5 * p}>
          <Line x1={112} y1={14} x2={124} y2={12} />
          <Line x1={108} y1={26} x2={120} y2={31} />
          <Line x1={98} y1={36} x2={106} y2={46} />
        </G>
      </G>
      <L33Cap k={k} s="It still liked the sugar" />
    </Frame>
  );
}

/* ---------- 6. test after test, for years ---------- */
function L33Years({ k }: { k: Ink }) {
  const p = useL33Grow(300, 1600);
  const books: [string, number, number][] = [
    ['#E0707A', 40, 0],
    [L33_GOLD, 36, 3],
    [L33_BLUE, 42, -2],
    ['#7BC47F', 34, 2],
    ['#B79CE8', 38, -3],
    ['#F2A65A', 36, 2],
    ['#E0707A', 34, -1],
  ];
  const shown = Math.round(p * books.length);
  const pages: [number, number, number][] = [
    [281, 34, 25],
    [288, 70, -20],
    [273, 100, 40],
    [207, 38, -25],
  ];
  return (
    <Frame label="Two scientists stand on either side of a tall stack of notebooks. On the wall behind them a calendar loses its pages, which fly away.">
      <L33Sci x={48} y={140} k={k} skin={L33_SKIN} hair="#5A3E2B" />
      <L33Sci x={182} y={140} k={k} skin={L33_SKIN2} hair="#BDB7C4" flip />
      <Rect x={10} y={138} width={280} height={9} rx={3} fill={L33_WOOD} />
      <Rect x={24} y={147} width={8} height={28} rx={2} fill={L33_WOOD} />
      <Rect x={268} y={147} width={8} height={28} rx={2} fill={L33_WOOD} />
      {books.slice(0, shown).map(([c, w, dx], i) => (
        <Rect key={i} x={115 - w / 2 + dx} y={138 - 9 * (i + 1)} width={w} height={9} rx={1.5} fill={c} stroke={k.bg} strokeWidth={0.8} />
      ))}
      <Rect x={222} y={28} width={46} height={52} rx={4} fill={L33_WHITE} stroke={k.muted} strokeWidth={1.5} />
      <Path d="M222 32 Q222 28 226 28 L264 28 Q268 28 268 32 L268 40 L222 40 Z" fill="#D9534F" />
      <Line x1={233} y1={24} x2={233} y2={32} stroke={k.muted} strokeWidth={2.5} strokeLinecap="round" />
      <Line x1={257} y1={24} x2={257} y2={32} stroke={k.muted} strokeWidth={2.5} strokeLinecap="round" />
      {[0, 1, 2].map((r) => [0, 1, 2, 3].map((c) => <Rect key={`${r}${c}`} x={228 + c * 10} y={46 + r * 10} width={5} height={5} rx={1} fill={k.line} />))}
      {pages.map(([fx, fy, rot], i) => {
        const x = 244 + (fx - 244) * p;
        const y = 52 + (fy - 52) * p;
        return (
          <G key={i} transform={`translate(${x} ${y}) rotate(${rot * p})`} opacity={Math.min(1, p * 5)}>
            <Rect x={-7} y={-6} width={14} height={12} rx={1.5} fill={L33_WHITE} stroke={k.muted} strokeWidth={1} />
            <Line x1={-4} y1={-2} x2={4} y2={-2} stroke={k.line} strokeWidth={1.2} strokeLinecap="round" />
            <Line x1={-4} y1={2} x2={2} y2={2} stroke={k.line} strokeWidth={1.2} strokeLinecap="round" />
          </G>
        );
      })}
      <L33Cap k={k} s="Test after test, for years" />
    </Frame>
  );
}

/* ---------- 7. more wanting, the same liking ---------- */
/* a mouse from the side, facing right, with a small content face; (x, y) is the ground under it. fast: legs stretched, lifted a little */
function L33Mouse({ x, y, s = 1, fast = false }: { x: number; y: number; s?: number; fast?: boolean }) {
  return (
    <G transform={`translate(${x} ${y - (fast ? 3 : 0)}) scale(${s})`}>
      <Path d="M-14 -8 Q-27 -6 -33 -15" fill="none" stroke={L33_PINK} strokeWidth={1.8} strokeLinecap="round" />
      {fast ? (
        <G stroke={L33_FUR} strokeWidth={3.4} strokeLinecap="round">
          <Line x1={-8} y1={-5} x2={-18} y2={0} />
          <Line x1={8} y1={-5} x2={17} y2={0} />
        </G>
      ) : (
        <G fill={L33_FUR}>
          <Rect x={-8} y={-4} width={4} height={5} rx={2} />
          <Rect x={5} y={-4} width={4} height={5} rx={2} />
        </G>
      )}
      <Ellipse cx={0} cy={-9} rx={14} ry={8} fill={L33_FUR} />
      <Circle cx={15} cy={-11} r={6.5} fill={L33_FUR} />
      <Path d="M19 -15 L28 -10 L20 -6 Z" fill={L33_FUR} />
      <Circle cx={28} cy={-10} r={1.4} fill={L33_NOSE} />
      <Circle cx={12} cy={-18} r={4.6} fill={L33_PINK} />
      <Path d="M14 -13 Q16.5 -16.5 19 -13" fill="none" stroke={L33_DARK} strokeWidth={1.3} strokeLinecap="round" />
      <Path d="M20 -7.5 Q22.5 -5.5 25 -7.5" fill="none" stroke={L33_DARK} strokeWidth={1} strokeLinecap="round" />
    </G>
  );
}
function L33Sparkle({ x, y, r }: { x: number; y: number; r: number }) {
  return (
    <Path
      d={`M${x} ${y - r} Q${x + r * 0.15} ${y - r * 0.15} ${x + r} ${y} Q${x + r * 0.15} ${y + r * 0.15} ${x} ${y + r} Q${x - r * 0.15} ${y + r * 0.15} ${x - r} ${y} Q${x - r * 0.15} ${y - r * 0.15} ${x} ${y - r} Z`}
      fill={L33_GOLD}
    />
  );
}
function L33Mice({ k }: { k: Ink }) {
  const p = useL33Grow(500, 1400);
  const lane = (top: number, final: number, fast: boolean, label: string) => {
    const g = top + 62;
    const mx = 100 + (final - 100) * p;
    return (
      <G>
        <Rect x={8} y={top} width={284} height={76} rx={14} fill={k.soft} opacity={0.5} />
        <Say x={18} y={top + 18} s={label} fill={k.ink} size={12} anchor="start" />
        <Line x1={18} y1={g} x2={282} y2={g} stroke={k.line} strokeWidth={2.5} strokeLinecap="round" />
        <Rect x={262} y={g - 16} width={16} height={16} rx={2} fill={L33_WHITE} stroke={k.muted} strokeWidth={1.4} />
        <Path d={`M262 ${g - 12} L270 ${g - 16} L278 ${g - 12}`} fill="none" stroke={k.muted} strokeWidth={1} />
        <L33Sparkle x={270} y={g - 28} r={5} />
        {fast ? (
          <G stroke={k.muted} strokeWidth={2} strokeLinecap="round" opacity={Math.min(1, p * 3)}>
            <Line x1={mx - 46} y1={g - 30} x2={mx - 68} y2={g - 30} />
            <Line x1={mx - 48} y1={g - 21} x2={mx - 78} y2={g - 21} />
            <Line x1={mx - 46} y1={g - 12} x2={mx - 66} y2={g - 12} />
          </G>
        ) : null}
        <L33Mouse x={mx} y={g} s={1.1} fast={fast} />
      </G>
    );
  };
  return (
    <Frame label="Two lanes, each with a sugar cube at the end. In the top lane an ordinary mouse walks. In the lower lane a mouse with more dopamine runs fast and is nearly at its cube. Both have the same small, content face.">
      {lane(8, 150, false, 'Ordinary')}
      {lane(90, 218, true, 'More dopamine')}
      <L33Cap k={k} s="More wanting, the same liking" />
    </Frame>
  );
}

/* ---------- 8. an ad, not a review ---------- */
function L33Ad({ k }: { k: Ink }) {
  const p = useL33Grow(400, 1200);
  const cx = 80;
  const cy = 65;
  const rays = Array.from({ length: 12 }, (_, i) => (i * Math.PI) / 6);
  const star = Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 === 0 ? 19 : 8;
    return `${cx + r * Math.cos(a)},${cy - 7 + r * Math.sin(a)}`;
  }).join(' ');
  return (
    <Frame label="On the left, a big bright billboard on two posts, glowing with gold rays and a big star, labeled The pull. On the right, a small plain gray card with a flat line on it, labeled Ten minutes after.">
      {rays.map((a, i) => {
        const k1 = 0.8 + 0.2 * p;
        const x1 = cx + 66 * Math.cos(a);
        const y1 = cy + 48 * Math.sin(a);
        const x2 = cx + (66 + 14 * p) * k1 * Math.cos(a);
        const y2 = cy + (48 + 10 * p) * k1 * Math.sin(a);
        return <Line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={L33_GOLD} strokeWidth={4} strokeLinecap="round" />;
      })}
      <Rect x={52} y={96} width={7} height={54} fill={k.muted} />
      <Rect x={101} y={96} width={7} height={54} fill={k.muted} />
      <Line x1={10} y1={150} x2={290} y2={150} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      <Rect x={28} y={34} width={104} height={62} rx={6} fill="#FFB703" stroke="#E07A00" strokeWidth={3} />
      <Polygon points={star} fill={L33_WHITE} stroke="#E07A00" strokeWidth={1.5} strokeLinejoin="round" />
      <Say x={cx} y={90} s="MORE!" fill="#7A3B00" size={11} />
      <Rect x={192} y={100} width={72} height={50} rx={7} fill="#9AA0AE" opacity={0.3} />
      <Rect x={192} y={100} width={72} height={50} rx={7} fill="none" stroke="#9AA0AE" strokeWidth={2} />
      <Line x1={206} y1={125} x2={250} y2={125} stroke="#9AA0AE" strokeWidth={3} strokeLinecap="round" />
      <Say x={80} y={168} s="The pull" fill={k.ink} size={11} />
      <Say x={228} y={168} s="Ten minutes after" fill={k.ink} size={11} />
      <L33Cap k={k} s="An ad, not a review" />
    </Frame>
  );
}

export const SCENES_G33: Record<string, ComponentType<{ k: Ink }>> = {
  'l33-lab': L33Lab,
  'l33-faces': L33Faces,
  'l33-gone': L33Gone,
  'l33-bowl': L33Bowl,
  'l33-lick': L33Lick,
  'l33-years': L33Years,
  'l33-mice': L33Mice,
  'l33-ad': L33Ad,
};
