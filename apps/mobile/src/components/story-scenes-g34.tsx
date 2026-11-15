/* Scenes for lesson 34, "The cue comes first", told as a story (see story-kit.tsx): the monkey, the light and the juice, the burst of a
   brain cell moving to the light, and the cell going quiet when the juice does not come. A "spike train" is a row of short ticks for
   a cell firing: sparse on an ordinary moment, packed close in a burst. It is drawn the same way every time (L34Spikes). */
import { useEffect, useState, type ComponentType } from 'react';
import { Easing } from 'react-native';
import { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';

import { useAppear, useReducedMotion } from '@/lib/motion';

import { Frame, type Ink, Person, Say } from './story-kit';

const L34_GOLD = '#FFD25A';
const L34_PALE = '#F0E2B8';
const L34_GRAY = '#B9BDC8';
const L34_CLOUD = '#9AA0AE';
const L34_JUICE = '#F08A24';
const L34_BROWN = '#A0693A';
const L34_BROWN_DK = '#8A5A2B';
const L34_TAN = '#E7C9A0';
const L34_DARK = '#3B2A1A';

/* a number from 0 to 1 that eases up once, after a short pause; with Reduce Motion on it starts at 1 */
function useL34Grow(delay = 700, dur = 1200) {
  const still = useReducedMotion();
  const v = useAppear(delay, dur, Easing.out(Easing.cubic));
  const [p, setP] = useState(still ? 1 : 0);
  useEffect(() => {
    const id = v.addListener(({ value }) => setP(value));
    return () => v.removeListener(id);
  }, [v]);
  return p;
}

/* the line of words under a picture, and a tiny label */
function L34Cap({ k, s }: { k: Ink; s: string }) {
  return <Say x={150} y={190} s={s} fill={k.ink} />;
}
function L34Tag({ k, x, y, s, anchor = 'middle' }: { k: Ink; x: number; y: number; s: string; anchor?: 'start' | 'middle' | 'end' }) {
  return <Say x={x} y={y} s={s} fill={k.muted} size={11} anchor={anchor} />;
}

/* a drop of juice, centered on x and y (about 21 tall at scale 1) */
function L34Drop({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Path d="M0 -10 C3 -5 7 -1 7 3.5 A7 7 0 0 1 -7 3.5 C-7 -1 -3 -5 0 -10 Z" fill={L34_JUICE} />
      <Circle cx={-2.6} cy={3.4} r={1.7} fill="#FFFFFF" opacity={0.75} />
    </G>
  );
}

/* the thin spout that gives the juice: x is its middle, y its top; the tip is 28 lower */
function L34Spout({ x, y, k }: { x: number; y: number; k: Ink }) {
  return (
    <G>
      <Rect x={x - 6} y={y - 3} width={12} height={5} rx={2} fill={k.muted} />
      <Rect x={x - 3} y={y} width={6} height={22} rx={2} fill={k.muted} />
      <Path d={`M${x - 3} ${y + 22} L${x + 3} ${y + 22} L${x + 1.6} ${y + 28} L${x - 1.6} ${y + 28} Z`} fill={k.muted} />
    </G>
  );
}

/* a small lamp: y is the middle of the bulb, the base is 21 lower. fill is the bulb, glow (0 to 1) the halo around it */
function L34Lamp({ x, y, s = 1, fill, glow, rays = false, k }: { x: number; y: number; s?: number; fill: string; glow: number; rays?: boolean; k: Ink }) {
  const spokes = Array.from({ length: 8 }, (_, i) => (i * Math.PI) / 4 + Math.PI / 8);
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      {glow > 0 ? <Circle cx={0} cy={0} r={26} fill={L34_GOLD} opacity={glow * 0.3} /> : null}
      {glow > 0 ? <Circle cx={0} cy={0} r={18} fill={L34_GOLD} opacity={glow * 0.4} /> : null}
      {rays
        ? spokes.map((a, i) => (
            <Line
              key={i}
              x1={19 * Math.cos(a)}
              y1={19 * Math.sin(a)}
              x2={26 * Math.cos(a)}
              y2={26 * Math.sin(a)}
              stroke={L34_GOLD}
              strokeWidth={2.6}
              strokeLinecap="round"
            />
          ))
        : null}
      <Rect x={-6} y={10} width={12} height={7} rx={2} fill={k.muted} />
      <Rect x={-4} y={16} width={8} height={5} rx={2} fill={k.muted} />
      <Circle cx={0} cy={0} r={12} fill={fill} stroke={k.line} strokeWidth={1.5} />
      <Path d="M-7 -3 Q-6 -8 -1 -9" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" fill="none" opacity={0.7} />
    </G>
  );
}

/* the spike train: a baseline with a short tick standing wherever the cell fired. xs are the places of the ticks */
function L34Spikes({ xs, y, x0, x1, h = 24, k }: { xs: number[]; y: number; x0: number; x1: number; h?: number; k: Ink }) {
  return (
    <G>
      <Line x1={x0} y1={y} x2={x1} y2={y} stroke={k.line} strokeWidth={2} strokeLinecap="round" />
      {xs.map((x, i) => (
        <Line
          key={i}
          x1={x}
          y1={y - 2}
          x2={x}
          y2={y - 2 - h * (0.55 + (0.45 * ((i * 5 + 3) % 7)) / 6)}
          stroke={k.acc}
          strokeWidth={2.2}
          strokeLinecap="round"
        />
      ))}
    </G>
  );
}
/* a burst: n ticks packed close together around cx */
function L34Burst(cx: number, n = 11, gap = 3.4) {
  return Array.from({ length: n }, (_, i) => cx + (i - (n - 1) / 2) * gap);
}

/* an arrow pointing right along a timeline */
function L34Arrow({ x0, x1, y, k }: { x0: number; x1: number; y: number; k: Ink }) {
  return (
    <G>
      <Line x1={x0} y1={y} x2={x1 - 3} y2={y} stroke={k.muted} strokeWidth={3} strokeLinecap="round" />
      <Path
        d={`M${x1 - 10} ${y - 7} L${x1} ${y} L${x1 - 10} ${y + 7}`}
        stroke={k.muted}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </G>
  );
}

/* ---------- 1: the monkey and the juice ---------- */
function L34Juice({ k }: { k: Ink }) {
  return (
    <Frame label="A friendly monkey sits under a thin spout while a drop of juice falls toward its mouth. Beside it, a brain cell's row of ticks packs into a dense burst at the moment of the drop.">
      <Line x1={20} y1={156} x2={134} y2={156} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      <Path d="M38 146 Q8 142 12 118 Q14 106 24 110" stroke={L34_BROWN_DK} strokeWidth={6} strokeLinecap="round" fill="none" />
      <Ellipse cx={62} cy={132} rx={26} ry={24} fill={L34_BROWN} />
      <Ellipse cx={72} cy={136} rx={14} ry={16} fill={L34_TAN} />
      <Ellipse cx={78} cy={152} rx={15} ry={6} fill={L34_BROWN_DK} />
      <Path d="M64 118 Q82 120 90 136" stroke={L34_BROWN_DK} strokeWidth={8} strokeLinecap="round" fill="none" />
      <Circle cx={72} cy={92} r={22} fill={L34_BROWN} />
      <Circle cx={57} cy={90} r={7} fill={L34_BROWN} />
      <Circle cx={57} cy={90} r={3.6} fill={L34_TAN} />
      <Ellipse cx={88} cy={98} rx={12} ry={10} fill={L34_TAN} />
      <Circle cx={84} cy={87} r={2.5} fill={L34_DARK} />
      <Circle cx={96} cy={94} r={1.8} fill={L34_DARK} />
      <Path d="M86 103 Q91 106 96 102" stroke={L34_DARK} strokeWidth={1.8} strokeLinecap="round" fill="none" />
      <Line x1={94} y1={0} x2={94} y2={22} stroke={k.muted} strokeWidth={3} />
      <L34Spout x={94} y={22} k={k} />
      <L34Drop x={94} y={68} />
      <L34Tag k={k} x={150} y={62} s="Brain cell" anchor="start" />
      <L34Spikes xs={[...[160, 186, 262, 280], ...L34Burst(222, 9)]} y={96} x0={150} x1={288} k={k} />
      <Line x1={150} y1={132} x2={288} y2={132} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      <L34Drop x={222} y={121} />
      <L34Tag k={k} x={222} y={152} s="Juice" />
      <L34Cap k={k} s="Juice: a burst" />
    </Frame>
  );
}

/* ---------- 2: the light, then the juice, every time ---------- */
function L34Light({ k }: { k: Ink }) {
  const rows = [
    { y: 62, o: 1 },
    { y: 106, o: 0.6 },
    { y: 150, o: 0.35 },
  ];
  return (
    <Frame label="Three rows, each the same: a glowing lamp, then an arrow, then a drop of juice. The light always comes just before the juice.">
      <L34Tag k={k} x={56} y={22} s="Light" />
      <L34Tag k={k} x={244} y={22} s="Juice" />
      {rows.map((r) => (
        <G key={r.y} opacity={r.o}>
          <L34Lamp x={56} y={r.y} s={0.8} fill={L34_GOLD} glow={1} rays k={k} />
          <L34Arrow x0={100} x1={206} y={r.y + 4} k={k} />
          <L34Drop x={244} y={r.y + 4} s={1.3} />
        </G>
      ))}
      <L34Cap k={k} s="Light, then juice, every time" />
    </Frame>
  );
}

/* ---------- 3: the burst moved to the light ---------- */
function L34Moved({ k }: { k: Ink }) {
  const p = useL34Grow();
  const cx = 230 - 160 * p;
  return (
    <Frame label="A timeline with a glowing lamp at the left and a drop of juice at the right. A dense burst of ticks sits above the light, and only a few sparse ticks above the juice.">
      <L34Spikes xs={[32, 112, 150, 212, 236, 258, ...L34Burst(cx)]} y={92} x0={26} x1={274} k={k} />
      <Line x1={26} y1={148} x2={274} y2={148} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      <L34Lamp x={70} y={124} fill={L34_GOLD} glow={1} rays k={k} />
      <L34Arrow x0={108} x1={196} y={128} k={k} />
      <L34Drop x={230} y={134} s={1.5} />
      <L34Tag k={k} x={70} y={166} s="Light" />
      <L34Tag k={k} x={230} y={166} s="Juice" />
      <L34Cap k={k} s="The burst moved to the light" />
    </Frame>
  );
}

/* ---------- 4: the light, and no juice ---------- */
function L34Missing({ k }: { k: Ink }) {
  return (
    <Frame label="A glowing lamp with a burst of ticks above it, then an empty spout with no drop. Above the empty spout the row of ticks has a clear gap with nothing in it.">
      <L34Spikes xs={[32, ...L34Burst(70), 122, 150, 176]} y={92} x0={26} x1={274} k={k} />
      <Rect x={190} y={62} width={84} height={32} rx={9} stroke={k.muted} strokeWidth={1.6} strokeDasharray="4 4" fill="none" />
      <L34Tag k={k} x={232} y={82} s="Quiet" />
      <Line x1={26} y1={148} x2={274} y2={148} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      <L34Lamp x={70} y={124} fill={L34_GOLD} glow={1} rays k={k} />
      <L34Arrow x0={108} x1={196} y={128} k={k} />
      <L34Spout x={232} y={108} k={k} />
      <L34Cap k={k} s="No juice: the cells went quiet" />
    </Frame>
  );
}

/* ---------- 5: your own lights ---------- */
function L34Signals({ k }: { k: Ink }) {
  const xs = [45, 115, 185, 255];
  return (
    <Frame label="Four small lamps in a row, each with a tiny picture beneath it: a couch, a gray cloud for a mood, a phone, and a person alone. One lamp, over the phone, glows gold.">
      {xs.map((x, i) => (
        <G key={x}>
          <L34Lamp x={x} y={58} fill={i === 2 ? L34_GOLD : k.soft} glow={i === 2 ? 1 : 0} rays={i === 2} k={k} />
          <Line x1={x} y1={90} x2={x} y2={104} stroke={k.line} strokeWidth={2} strokeDasharray="2 5" strokeLinecap="round" />
        </G>
      ))}
      <G transform="translate(0 8)">
        <Rect x={28} y={110} width={34} height={16} rx={6} fill={k.muted} />
        <Rect x={22} y={122} width={46} height={14} rx={5} fill={k.muted} />
        <Rect x={17} y={116} width={11} height={22} rx={5} fill={k.muted} />
        <Rect x={62} y={116} width={11} height={22} rx={5} fill={k.muted} />
        <Rect x={26} y={136} width={4} height={5} rx={1} fill={k.muted} />
        <Rect x={60} y={136} width={4} height={5} rx={1} fill={k.muted} />
      </G>
      <G transform="translate(0 10)">
        <Circle cx={115} cy={124} r={12} fill={L34_CLOUD} />
        <Circle cx={101} cy={130} r={9} fill={L34_CLOUD} />
        <Circle cx={129} cy={130} r={9} fill={L34_CLOUD} />
        <Rect x={96} y={128} width={38} height={11} rx={5.5} fill={L34_CLOUD} />
      </G>
      <Rect x={173} y={108} width={24} height={44} rx={6} fill={k.muted} />
      <Rect x={176} y={113} width={18} height={32} rx={3} fill={k.bg} />
      <Rect x={179} y={118} width={12} height={12} rx={3} fill={k.acc} />
      <Rect x={179} y={134} width={12} height={3} rx={1.5} fill={k.line} />
      <Person x={255} y={152} s={0.75} fill={k.muted} />
      <L34Cap k={k} s="Your own lights" />
    </Frame>
  );
}

/* ---------- 6: the sign lit up more than the picture ---------- */
const L34_HEAD = 'M-30 -4 Q-36 -44 -2 -46 Q34 -46 36 -14 L44 2 Q46 6 40 8 L36 8 Q38 20 28 22 L26 34 L-8 34 L-8 22 Q-30 16 -30 -4 Z';
function L34Scan({ k }: { k: Ink }) {
  const p = useL34Grow(600, 1000);
  const gr = 12 + 10 * p;
  return (
    <Frame label="Two heads in profile side by side. On the left, facing an arrow sign, a big gold spot glows in the head. On the right, facing an empty picture frame, only a small dim spot shows.">
      <Rect x={8} y={10} width={138} height={156} rx={16} fill={k.soft} opacity={0.5} />
      <Rect x={154} y={10} width={138} height={156} rx={16} fill={k.soft} opacity={0.5} />
      <Say x={77} y={32} s="The sign" fill={k.ink} size={12} />
      <Say x={223} y={32} s="The picture" fill={k.ink} size={12} />
      <G transform="translate(52 100) scale(1.05)">
        <Path d={L34_HEAD} fill={k.soft} stroke={k.line} strokeWidth={2} />
        <Circle cx={-2} cy={-14} r={gr} fill={L34_GOLD} opacity={0.4} />
        <Circle cx={-2} cy={-14} r={gr * 0.62} fill={L34_GOLD} opacity={0.75} />
        <Circle cx={-2} cy={-14} r={6} fill={k.acc} />
      </G>
      <Rect x={106} y={66} width={30} height={22} rx={4} fill={k.bg} stroke={k.ink} strokeWidth={2} />
      <Path d="M112 77 L129 77 M123 71 L129 77 L123 83" stroke={k.ink} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <G transform="translate(196 100) scale(1.05)">
        <Path d={L34_HEAD} fill={k.soft} stroke={k.line} strokeWidth={2} />
        <Circle cx={-2} cy={-14} r={5} fill={k.muted} opacity={0.6} />
      </G>
      <Rect x={250} y={64} width={34} height={26} rx={6} fill={k.bg} stroke={k.ink} strokeWidth={2.4} />
      <L34Cap k={k} s="The sign lit up more" />
    </Frame>
  );
}

/* ---------- 7: move at the light ---------- */
function L34Early({ k }: { k: Ink }) {
  const p = useL34Grow(600, 1300);
  const s = 0.4 + 0.6 * p;
  return (
    <Frame label="A path runs left to right and rises into a tall wave on the right, the pull growing. At the left, by a small glowing lamp, a person steps off the path onto a side path that leads away.">
      <G transform={`translate(0 142) scale(1 ${s}) translate(0 -142)`}>
        <Path d="M148 142 Q196 140 220 98 Q238 58 262 40 Q278 30 284 44 Q272 54 274 82 Q278 118 292 142 Z" fill={k.acc} opacity={0.4} />
        <Path d="M148 142 Q196 140 220 98 Q238 58 262 40 Q278 30 284 44 Q272 54 274 82" stroke={k.acc} strokeWidth={3} strokeLinecap="round" fill="none" />
      </G>
      <Line x1={12} y1={142} x2={290} y2={142} stroke={k.line} strokeWidth={12} strokeLinecap="round" />
      <Path d="M112 142 Q100 118 82 98 Q70 84 62 66" stroke={k.acc} strokeWidth={10} strokeLinecap="round" fill="none" opacity={0.55} />
      <L34Lamp x={34} y={108} fill={L34_GOLD} glow={1} rays k={k} />
      <Person x={88} y={104} s={0.8} fill={k.ink} face={k.bg} />
      <L34Cap k={k} s="Move at the light" />
    </Frame>
  );
}

/* ---------- 8: a light that stops paying fades ---------- */
function L34Fade({ k }: { k: Ink }) {
  const lamps = [
    { x: 60, fill: L34_GOLD, glow: 1, rays: true },
    { x: 150, fill: L34_PALE, glow: 0.35, rays: false },
    { x: 240, fill: L34_GRAY, glow: 0, rays: false },
  ];
  return (
    <Frame label="Three lamps in a row, each glowing less than the one before: gold, then pale, then gray. Under each lamp is an empty spout with no juice.">
      {lamps.map((l) => (
        <G key={l.x}>
          <L34Lamp x={l.x} y={56} fill={l.fill} glow={l.glow} rays={l.rays} k={k} />
          <L34Spout x={l.x} y={108} k={k} />
        </G>
      ))}
      <L34Cap k={k} s="Each time, it promises less" />
    </Frame>
  );
}

export const SCENES_G34: Record<string, ComponentType<{ k: Ink }>> = {
  'l34-juice': L34Juice,
  'l34-light': L34Light,
  'l34-moved': L34Moved,
  'l34-missing': L34Missing,
  'l34-signals': L34Signals,
  'l34-scan': L34Scan,
  'l34-early': L34Early,
  'l34-fade': L34Fade,
};
