/* Scenes for lesson 38 told as a story (see story-kit.tsx): "Say “I do not”". Two ways to say no (a rule put on you, or who you are), a snack
   on the way out, ten days of a field study, a rule that gets argued with, the sentence said at the door, and said again after a hard day. */
import { useEffect, useState, type ComponentType } from 'react';
import { Easing } from 'react-native';
import { Circle, ClipPath, Defs, Ellipse, G, Line, Path, Rect } from 'react-native-svg';

import { useAppear, useReducedMotion } from '@/lib/motion';

import { Frame, type Ink, Person, Say } from './story-kit';

const L38_WOOD = '#8A5A2B';
const L38_WOOD_DARK = '#6E4520';
const L38_WOOD_LIGHT = '#9C6A38';
const L38_GOLD = '#FFD25A';
const L38_SKIN = '#E8B98F';
const L38_CHOC = '#6B3E26';
const L38_CHOC_LIGHT = '#8A5638';
const L38_FOIL = '#C9CED6';
const L38_FOIL_DARK = '#9AA0AE';
const L38_OAT = '#D9B26F';
const L38_OAT_DARK = '#B98F4A';
const L38_OAT_LIGHT = '#F1DDA8';
const L38_PAPER = '#F6EEDB';
const L38_PAPER_INK = '#3A2A1E';
const L38_SKY = '#BFE3F5';
const L38_DARK = '#1E1626';
const L38_GLOW = '#7C6CF2';
const L38_SPECK = '#B9B0FF';

/* a number from 0 to 1 that eases up once, after a short pause; with Reduce Motion on it starts at 1 */
function L38useGrow(delay = 300, dur = 1200) {
  const still = useReducedMotion();
  const v = useAppear(delay, dur, Easing.out(Easing.cubic));
  const [p, setP] = useState(still ? 1 : 0);
  useEffect(() => {
    const id = v.addListener(({ value }) => setP(value));
    return () => v.removeListener(id);
  }, [v]);
  return p;
}

/* how far along the i-th of n things is, as p goes from 0 to 1 */
const L38step = (p: number, i: number, n: number) => Math.min(1, Math.max(0, p * (n + 2) - i));

/* the line of words under a picture */
function L38Cap({ k, s }: { k: Ink; s: string }) {
  return <Say x={150} y={190} s={s} fill={k.ink} />;
}

/* a speech bubble with its tail on the bottom edge: the tail starts at `tx` and points to (`px`, `py`) */
function L38Bubble({
  x,
  y,
  w,
  h,
  tx,
  px,
  py,
  fill,
  stroke,
  sw = 2.4,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  tx: number;
  px: number;
  py: number;
  fill: string;
  stroke: string;
  sw?: number;
}) {
  const b = y + h;
  return (
    <G>
      <Rect x={x} y={y} width={w} height={h} rx={Math.min(18, h / 2)} fill={fill} stroke={stroke} strokeWidth={sw} />
      <Path d={`M${tx - 6} ${b} L${px} ${py} L${tx + 7} ${b}`} fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
      <Line x1={tx - 5} y1={b} x2={tx + 6} y2={b} stroke={fill} strokeWidth={sw + 1.2} />
    </G>
  );
}

/* a small padlock, its middle at (x, y) */
function L38Lock({ x, y, fill, ring }: { x: number; y: number; fill: string; ring: string }) {
  return (
    <G transform={`translate(${x} ${y})`}>
      <Path d="M-5 -2 V-7 A5 5 0 0 1 5 -7 V-2" stroke={ring} strokeWidth={5.4} strokeLinecap="round" fill="none" />
      <Rect x={-8} y={-2} width={16} height={12} rx={3} fill={ring} />
      <Path d="M-5 -2 V-7 A5 5 0 0 1 5 -7 V-2" stroke={fill} strokeWidth={2.6} strokeLinecap="round" fill="none" />
      <Rect x={-6.4} y={-0.6} width={12.8} height={9.2} rx={2.2} fill={fill} />
      <Circle cx={0} cy={3.2} r={1.5} fill={ring} />
      <Rect x={-0.7} y={3.5} width={1.4} height={3} rx={0.6} fill={ring} />
    </G>
  );
}

/* a small upright flag on a pole, the foot of the pole at (x, y) */
function L38Flag({ x, y, h = 32, fill, pole }: { x: number; y: number; h?: number; fill: string; pole: string }) {
  return (
    <G>
      <Line x1={x} y1={y} x2={x} y2={y - h} stroke={pole} strokeWidth={2.4} strokeLinecap="round" />
      <Path d={`M${x + 1} ${y - h} L${x + h * 0.78} ${y - h * 0.8} L${x + 1} ${y - h * 0.56} Z`} fill={fill} strokeLinejoin="round" />
    </G>
  );
}

/* ---------- 1. two ways to say no ---------- */
function L38Words({ k }: { k: Ink }) {
  const p = L38useGrow(300, 900);
  return (
    <Frame label="Two speech bubbles side by side. The left one says I cannot, in gray, with a padlock on its corner. The right one says I do not, in color, with a small flag on its corner.">
      <G opacity={0.55 + 0.45 * p}>
        <L38Bubble x={14} y={30} w={124} h={74} tx={72} px={68} py={122} fill={k.bg} stroke={k.muted} />
        <Say x={76} y={75} s="I cannot" fill={k.muted} size={22} />
        <L38Lock x={133} y={30} fill={k.muted} ring={k.bg} />
        <Person x={68} y={170} s={0.72} fill={k.muted} />
      </G>
      <L38Bubble x={162} y={30} w={124} h={74} tx={222} px={226} py={122} fill={k.soft} stroke={k.acc} sw={3} />
      <Say x={222} y={75} s="I do not" fill={k.text ?? k.ink} size={22} />
      <L38Flag x={278} y={46} h={34} fill={k.acc} pole={k.acc} />
      <Person x={226} y={170} s={0.72} fill={k.ink} face={k.bg} />
      <L38Cap k={k} s="Two ways to say no" />
    </Frame>
  );
}

/* ---------- 2. one snack, on the way out ---------- */
function L38Snacks({ k }: { k: Ink }) {
  return (
    <Frame label="A table beside a door with a small Thank you sign. On the table lie a chocolate bar in a brown wrapper and a granola bar in an oat-colored wrapper, and a hand reaches in from the left.">
      <Defs>
        <ClipPath id="l38-snack-clip">
          <Rect x={6} y={6} width={288} height={164} rx={14} />
        </ClipPath>
      </Defs>
      <G clipPath="url(#l38-snack-clip)">
        <Rect x={6} y={6} width={288} height={164} fill={k.soft} />
        <Rect x={6} y={158} width={288} height={12} fill={k.line} opacity={0.5} />
        {/* the window */}
        <Rect x={26} y={30} width={50} height={46} rx={3} fill={L38_SKY} opacity={0.75} />
        <Rect x={26} y={30} width={50} height={46} rx={3} fill="none" stroke={k.line} strokeWidth={3} />
        <Line x1={51} y1={30} x2={51} y2={76} stroke={k.line} strokeWidth={2.4} />
        <Line x1={26} y1={53} x2={76} y2={53} stroke={k.line} strokeWidth={2.4} />
        {/* the door */}
        <Rect x={218} y={24} width={62} height={134} rx={3} fill={L38_WOOD} />
        <Rect x={224} y={76} width={50} height={32} rx={2} fill={L38_WOOD_LIGHT} opacity={0.5} />
        <Rect x={224} y={118} width={50} height={34} rx={2} fill={L38_WOOD_LIGHT} opacity={0.5} />
        <Circle cx={226} cy={112} r={3.4} fill={L38_GOLD} />
        <Path d="M249 42 L231 53 M249 42 L267 53" stroke={L38_PAPER_INK} strokeWidth={1.1} fill="none" />
        <Circle cx={249} cy={42} r={1.8} fill={L38_GOLD} />
        <Rect x={225} y={52} width={48} height={17} rx={3} fill={L38_PAPER} />
        <Say x={249} y={64} s="Thank you" fill={L38_PAPER_INK} size={8.5} />
        {/* the table */}
        <Rect x={112} y={140} width={7} height={28} fill={L38_WOOD_DARK} />
        <Rect x={266} y={140} width={7} height={28} fill={L38_WOOD_DARK} />
        <Rect x={100} y={132} width={184} height={9} rx={3} fill={L38_WOOD} />
        <Rect x={100} y={132} width={184} height={2.6} rx={1.3} fill={L38_WOOD_LIGHT} />
        {/* the chocolate bar */}
        <G>
          <Rect x={116} y={113} width={46} height={19} rx={3} fill={L38_CHOC} />
          <Path d="M127 113 V132 M138 113 V132 M149 113 V132" stroke={L38_CHOC_LIGHT} strokeWidth={1.2} />
          <Rect x={150} y={113} width={12} height={19} rx={2} fill={L38_FOIL} />
          <Path d="M150 113 L153 117 L150 121 L153 125 L150 129 L153 132" stroke={L38_FOIL_DARK} strokeWidth={1.1} fill="none" />
          <Rect x={150} y={113} width={12} height={4} rx={1.6} fill={L38_FOIL_DARK} opacity={0.5} />
        </G>
        {/* the granola bar */}
        <G>
          <Rect x={172} y={116} width={42} height={16} rx={6} fill={L38_OAT} />
          <Path d="M176 120 Q193 117 210 120" stroke={L38_OAT_LIGHT} strokeWidth={1.2} fill="none" opacity={0.8} />
          <Rect x={172} y={116} width={5} height={16} rx={2.5} fill={L38_OAT_DARK} opacity={0.55} />
          <Rect x={209} y={116} width={5} height={16} rx={2.5} fill={L38_OAT_DARK} opacity={0.55} />
          {[
            [182, 123, -20],
            [191, 126, 25],
            [199, 122, -10],
            [205, 127, 30],
            [187, 129, 10],
          ].map(([cx, cy, r], i) => (
            <Ellipse key={i} cx={cx} cy={cy} rx={3.2} ry={1.7} fill={L38_OAT_LIGHT} transform={`rotate(${r} ${cx} ${cy})`} />
          ))}
          {[
            [219, 130, 20],
            [165, 134, -20],
          ].map(([cx, cy, r], i) => (
            <Ellipse key={i} cx={cx} cy={cy - 2} rx={2.8} ry={1.5} fill={L38_OAT_LIGHT} transform={`rotate(${r} ${cx} ${cy - 2})`} />
          ))}
        </G>
        {/* the hand, reaching in from the left */}
        <Path d="M-4 128 L82 116" stroke={L38_SKIN} strokeWidth={13} strokeLinecap="round" />
        <Path d="M-6 129 L22 125" stroke={k.acc} strokeWidth={20} />
        <Ellipse cx={92} cy={115} rx={10} ry={7.5} fill={L38_SKIN} transform="rotate(-8 92 115)" />
        <Path d="M99 111 L108 112 M100 115 L110 116 M99 119 L108 121" stroke={L38_SKIN} strokeWidth={4.4} strokeLinecap="round" />
        <Path d="M88 109 L96 102" stroke={L38_SKIN} strokeWidth={4.6} strokeLinecap="round" />
      </G>
      <L38Cap k={k} s="One snack, on the way out" />
    </Frame>
  );
}

/* ---------- 3. still at it after ten days ---------- */
function L38Figure({ x, y, fill, opacity = 1 }: { x: number; y: number; fill: string; opacity?: number }) {
  return (
    <G transform={`translate(${x} ${y})`} opacity={opacity}>
      <Circle cx={0} cy={-21} r={4.6} fill={fill} />
      <Path d="M-6.4 0 L-6.4 -7 Q-6.4 -15 0 -15 Q6.4 -15 6.4 -7 L6.4 0 Z" fill={fill} />
    </G>
  );
}

function L38TenDays({ k }: { k: Ink }) {
  const p = L38useGrow(350, 1500);
  const rows: Array<{ label: string; n: number; y: number }> = [
    { label: '“I do not”', n: 8, y: 58 },
    { label: 'No', n: 3, y: 108 },
    { label: '“I cannot”', n: 1, y: 158 },
  ];
  return (
    <Frame label="Three rows of ten small people. In the row for I do not, 8 of 10 are filled in color. In the row for a plain no, 3 of 10 are filled. In the row for I cannot, only 1 of 10 is filled.">
      {rows.map((r, ri) => (
        <G key={r.label}>
          <Say x={14} y={r.y - 4} s={r.label} fill={ri === 0 ? k.ink : k.muted} size={12.5} anchor="start" />
          {Array.from({ length: 10 }, (_, i) => {
            const x = 112 + i * 19.5;
            return (
              <G key={i}>
                <L38Figure x={x} y={r.y} fill={k.muted} opacity={0.28} />
                {i < r.n ? <L38Figure x={x} y={r.y} fill={k.acc} opacity={L38step(p, i + ri * 2, 10)} /> : null}
              </G>
            );
          })}
        </G>
      ))}
      <Line x1={14} y1={80} x2={286} y2={80} stroke={k.line} strokeWidth={1.4} opacity={0.6} />
      <Line x1={14} y1={130} x2={286} y2={130} stroke={k.line} strokeWidth={1.4} opacity={0.6} />
      <L38Cap k={k} s="Still at it after ten days" />
    </Frame>
  );
}

/* ---------- 4. a rule gets argued with ---------- */
function L38Rule({ k }: { k: Ink }) {
  const pickets = Array.from({ length: 10 }, (_, j) => 25 + j * 12);
  return (
    <Frame label="Two panels. On the left, a person stands behind a tall picket fence while a stern judge sits on a high bench above and the person wonders, Can I? On the right, the same person stands free and upright with nothing around them, holding a small flag.">
      <Defs>
        <ClipPath id="l38-rule-left">
          <Rect x={8} y={8} width={138} height={142} rx={12} />
        </ClipPath>
        <ClipPath id="l38-rule-right">
          <Rect x={154} y={8} width={138} height={142} rx={12} />
        </ClipPath>
      </Defs>
      {/* left: a rule */}
      <G clipPath="url(#l38-rule-left)">
        <Rect x={8} y={8} width={138} height={142} fill={k.soft} />
        <Rect x={8} y={8} width={138} height={142} fill={k.muted} opacity={0.14} />
        <Rect x={8} y={142} width={138} height={8} fill={k.line} opacity={0.5} />
        {/* the judge, high on the bench */}
        <Rect x={62} y={32} width={32} height={10} rx={5} fill={k.ink} />
        <Circle cx={78} cy={25} r={7.4} fill={L38_SKIN} />
        <Path d="M70.4 21.8 Q78 15 85.6 21.8 Q82 19.4 78 19.8 Q74 19.4 70.4 21.8 Z" fill={k.muted} />
        <Path d="M72.6 23 L76.2 24.4 M83.4 23 L79.8 24.4" stroke={L38_PAPER_INK} strokeWidth={1.3} strokeLinecap="round" />
        <Rect x={34} y={40} width={88} height={14} rx={3} fill={L38_WOOD} />
        <Rect x={34} y={40} width={88} height={3.4} rx={1.7} fill={L38_WOOD_LIGHT} />
        <Rect x={104} y={33} width={11} height={5} rx={1.6} fill={L38_WOOD_DARK} />
        <Line x1={110} y1={38} x2={110} y2={40} stroke={L38_WOOD_DARK} strokeWidth={2} />
        {/* the person, asking */}
        <Person x={66} y={146} s={0.95} fill={k.ink} />
        <L38Bubble x={84} y={60} w={50} h={21} tx={92} px={76} py={90} fill={k.bg} stroke={k.muted} sw={1.8} />
        <Say x={109} y={74.5} s="Can I?" fill={k.ink} size={11} />
        {/* the fence */}
        <Rect x={18} y={104} width={118} height={4} rx={2} fill={k.muted} />
        <Rect x={18} y={130} width={118} height={4} rx={2} fill={k.muted} />
        {pickets.map((x) => (
          <Path key={x} d={`M${x - 3.2} 148 V94 L${x} 87 L${x + 3.2} 94 V148 Z`} fill={k.muted} />
        ))}
      </G>
      {/* right: who you are */}
      <G clipPath="url(#l38-rule-right)">
        <Rect x={154} y={8} width={138} height={142} fill={k.soft} />
        <Circle cx={216} cy={96} r={56} fill={k.acc} opacity={0.16} />
        <Circle cx={216} cy={96} r={34} fill={k.acc} opacity={0.14} />
        <Rect x={154} y={142} width={138} height={8} fill={k.line} opacity={0.5} />
        <Path d="M239 124 L239 78" stroke={k.ink} strokeWidth={2.4} strokeLinecap="round" />
        <Path d="M240 78 L263 85 L240 93 Z" fill={k.acc} strokeLinejoin="round" />
        <Path d="M227 118 L239 114" stroke={k.ink} strokeWidth={6.5} strokeLinecap="round" />
        <Person x={214} y={146} s={1.05} fill={k.ink} />
        <Circle cx={239} cy={113.5} r={3.8} fill={k.ink} />
      </G>
      <Say x={77} y={166} s="A rule" fill={k.muted} size={11} />
      <Say x={223} y={166} s="Who you are" fill={k.ink} size={11} />
      <L38Cap k={k} s="A rule gets argued with" />
    </Frame>
  );
}

/* ---------- 5. said at the first signal ---------- */
/* a small light speck drifting up, like dust in the glow of a screen */
function L38Speck({ x, y, r, p, rise }: { x: number; y: number; r: number; p: number; rise: number }) {
  return <Circle cx={x} cy={y - rise * p} r={r} fill={L38_SPECK} opacity={0.35 + 0.4 * p} />;
}

function L38Door({ k }: { k: Ink }) {
  const p = L38useGrow(350, 1400);
  const arch = 'M150 166 V52 Q150 22 196 22 Q242 22 242 52 V166 Z';
  return (
    <Frame label="A person stands beside a half-open door with one hand raised calmly and says I do not. Behind the door a cool blue-violet glow with a few drifting light specks fills the doorway, like a screen in a dark room.">
      <Defs>
        <ClipPath id="l38-door-clip">
          <Path d={arch} />
        </ClipPath>
      </Defs>
      <Line x1={12} y1={166} x2={288} y2={166} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      {/* the doorway and the glow behind it */}
      <Path d={arch} fill={L38_DARK} />
      <G clipPath="url(#l38-door-clip)">
        <Circle cx={196} cy={110} r={86} fill={L38_GLOW} opacity={0.22 + 0.1 * p} />
        <Circle cx={196} cy={120} r={48} fill={L38_GLOW} opacity={0.2 + 0.08 * p} />
        <L38Speck x={204} y={134} r={2.2} p={p} rise={26} />
        <L38Speck x={222} y={120} r={1.6} p={p} rise={18} />
        <L38Speck x={212} y={96} r={1.4} p={p} rise={14} />
        <L38Speck x={197} y={118} r={1.8} p={p} rise={22} />
        <L38Speck x={229} y={146} r={1.5} p={p} rise={20} />
        <L38Speck x={192} y={76} r={1.2} p={p} rise={10} />
      </G>
      <Path d={arch} fill="none" stroke={k.line} strokeWidth={4} strokeLinejoin="round" />
      {/* the door leaf, swung half open */}
      <Path d="M150 22 L188 34 L188 156 L150 166 Z" fill={L38_WOOD} stroke={L38_WOOD_DARK} strokeWidth={1.5} strokeLinejoin="round" />
      <Path d="M156 40 L183 48 L183 88 L156 92 Z" fill={L38_WOOD_LIGHT} opacity={0.45} />
      <Path d="M156 102 L183 98 L183 144 L156 150 Z" fill={L38_WOOD_LIGHT} opacity={0.45} />
      <Circle cx={182} cy={104} r={2.8} fill={L38_GOLD} />
      {/* the person, hand raised */}
      <Ellipse cx={92} cy={167} rx={26} ry={4} fill={k.ink} opacity={0.14} />
      <Path d="M109 128 L130 114" stroke={k.ink} strokeWidth={7} strokeLinecap="round" />
      <Ellipse cx={133} cy={106} rx={5.6} ry={8} fill={k.ink} transform="rotate(14 133 106)" />
      <Person x={92} y={166} s={1.25} fill={k.ink} face={k.bg} />
      <L38Bubble x={44} y={40} w={84} h={30} tx={86} px={90} py={88} fill={k.soft} stroke={k.acc} sw={2.6} />
      <Say x={86} y={61} s="I do not" fill={k.ink} size={15} />
      <L38Cap k={k} s="Said at the first signal" />
    </Frame>
  );
}

/* ---------- 6. after a hard day, say it again ---------- */
function L38Print({ x, y, fill, opacity = 1 }: { x: number; y: number; fill: string; opacity?: number }) {
  return (
    <G opacity={opacity}>
      <Ellipse cx={x - 4.5} cy={y} rx={3.2} ry={2.6} fill={fill} />
      <Ellipse cx={x + 2.5} cy={y} rx={5} ry={3.4} fill={fill} />
    </G>
  );
}

function L38Again({ k }: { k: Ink }) {
  const p = L38useGrow(300, 1800);
  const xs = Array.from({ length: 11 }, (_, i) => 26 + i * 20);
  return (
    <Frame label="A trail of footprints goes to the right. Midway one print is stretched long with skid lines behind it where the person stumbled, and the footprints carry on after it. Further along the person stands upright and says I do not again.">
      <Defs>
        <ClipPath id="l38-again-clip">
          <Rect x={6} y={6} width={288} height={164} rx={14} />
        </ClipPath>
      </Defs>
      <G clipPath="url(#l38-again-clip)">
        <Rect x={6} y={6} width={288} height={164} fill={k.bg} />
        <Circle cx={52} cy={48} r={17} fill={L38_GOLD} opacity={0.75} />
        <Path d="M6 118 Q70 80 140 108 T294 94 V170 H6 Z" fill={k.soft} />
        <Path d="M6 140 Q90 124 170 136 T294 128 V170 H6 Z" fill={k.line} opacity={0.35} />
        {xs.map((x, i) => {
          const y = i % 2 === 0 ? 148 : 156;
          if (i === 5) return null;
          return <L38Print key={i} x={x} y={y} fill={i < 5 ? k.muted : k.acc} opacity={L38step(p, i, 11) * (i < 5 ? 0.8 : 1)} />;
        })}
        {/* the stumble: one print that skidded, then the trail goes on */}
        <G opacity={L38step(p, 5, 11) * 0.8}>
          <Line x1={102} y1={153} x2={116} y2={153} stroke={k.muted} strokeWidth={2} strokeLinecap="round" />
          <Line x1={104} y1={158} x2={117} y2={158} stroke={k.muted} strokeWidth={2} strokeLinecap="round" />
          <Ellipse cx={121} cy={156} rx={3.6} ry={2.6} fill={k.muted} />
          <Ellipse cx={131} cy={156} rx={8} ry={3.4} fill={k.muted} />
        </G>
        <Ellipse cx={262} cy={156} rx={24} ry={4} fill={k.ink} opacity={0.14} />
        <Person x={262} y={154} s={0.95} fill={k.ink} face={k.bg} />
      </G>
      <L38Bubble x={206} y={46} w={76} h={26} tx={256} px={260} py={90} fill={k.soft} stroke={k.acc} sw={2.4} />
      <Say x={244} y={64} s="I do not" fill={k.ink} size={13.5} />
      <L38Cap k={k} s="After a hard day, say it again" />
    </Frame>
  );
}

export const SCENES_G38: Record<string, ComponentType<{ k: Ink }>> = {
  'l38-words': L38Words,
  'l38-snacks': L38Snacks,
  'l38-ten-days': L38TenDays,
  'l38-rule': L38Rule,
  'l38-door': L38Door,
  'l38-again': L38Again,
};
