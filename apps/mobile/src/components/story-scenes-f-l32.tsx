/* Scenes for lesson 32, told as a story (see story-kit.tsx and story-scenes-f.tsx): repenting as a turn, not a stretch of misery. Shuv, to
   turn back on a road and come home; metanoia, a change of mind; the sorrow that turns a person and the sorrow that stays in the hollow; and
   the next small step. Figures carry their own fixed colors and a dark outline where they need one, so they read on a dark card and a cream
   one alike. */
import { useEffect, useState, type ComponentType } from 'react';
import { Easing } from 'react-native';
import { Circle, ClipPath, Defs, Ellipse, G, Line, Path, Rect } from 'react-native-svg';

import { useAppear, useReducedMotion } from '@/lib/motion';

import { BEAR_LINE, Frame, type Ink, Say } from './story-kit';

const BROWN = '#8A5A2B';
const BROWN_D = '#5E3A1A';
const GOLD = '#FFD25A';
const CREAM = '#FFF5E1';
const PAPER = '#FFF3D6';
const PAPER_D = '#E9D8AE';
const TERRA = '#C9694A';
const GREEN = '#3F8F5B';
const LEAF = '#6FB07A';
const GRASS = '#78B070';
const GRASS_L = '#8FC784';
const GRASS_D = '#6FAE6A';
const DIRT = '#D9B77E';
const DIRT_D = '#B58B4C';
const SKY = '#CFE8F5';
const WATER = '#6FB6E4';
const WALL = '#F2E3C6';
const GRAY = '#8E96AB';
const GRAY_L = '#B7BAC6';
const GRAY_D = '#6E7284';

/* the line of words under a picture */
function Cap({ k, s }: { k: Ink; s: string }) {
  return <Say x={150} y={190} s={s} fill={k.ink} />;
}

/* a number from 0 to 1 that eases up once, after a short pause; with Reduce Motion on it starts at 1 */
function useGrow(delay = 400, dur = 1100) {
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

/* a small warm house standing on (x, y), its windows lit. glow adds a soft gold bloom behind it. */
function House({ x, y, s = 1, glow = true }: { x: number; y: number; s?: number; glow?: boolean }) {
  const sw = 1.4 / s;
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      {glow ? <Circle cx={0} cy={-17} r={34} fill={GOLD} opacity={0.24} /> : null}
      <Rect x={9} y={-44} width={6} height={14} fill={BROWN} stroke={BEAR_LINE} strokeWidth={sw} />
      <Rect x={-16} y={-25} width={32} height={25} rx={1.5} fill="#F5DDB8" stroke={BEAR_LINE} strokeWidth={sw} />
      <Path d="M-21 -24 L0 -43 L21 -24 Z" fill={TERRA} stroke={BEAR_LINE} strokeWidth={sw} strokeLinejoin="round" />
      <Rect x={-12.5} y={-19} width={7} height={7} rx={1} fill={GOLD} stroke={BROWN} strokeWidth={1.4} />
      <Rect x={5.5} y={-19} width={7} height={7} rx={1} fill={GOLD} stroke={BROWN} strokeWidth={1.4} />
      <Rect x={-3.5} y={-15} width={7} height={15} rx={1.5} fill={BROWN} stroke={BEAR_LINE} strokeWidth={sw} />
    </G>
  );
}

/* a person standing on (x, y), seen from the side. dir 1 faces right, -1 faces left (a number between turns them); lean tips them about
   their feet; arm reaches one arm out ahead. */
function Me({
  x,
  y,
  s = 1,
  dir = 1,
  fill,
  face,
  arm,
  lean = 0,
}: {
  x: number;
  y: number;
  s?: number;
  dir?: number;
  fill: string;
  face: string;
  arm?: boolean;
  lean?: number;
}) {
  const d = Math.abs(dir) < 0.03 ? 0.03 : dir;
  return (
    <G transform={`translate(${x} ${y}) rotate(${lean}) scale(${d * s} ${s})`}>
      <Ellipse cx={-4} cy={0.5} rx={8} ry={3.2} fill={BEAR_LINE} />
      <Ellipse cx={10} cy={0.5} rx={8} ry={3.2} fill={BEAR_LINE} />
      <Path d="M-17 -2 L-17 -16 Q-17 -33 0 -33 Q17 -33 17 -16 L17 -2 Z" fill={fill} stroke={BEAR_LINE} strokeWidth={1.5 / s} strokeLinejoin="round" />
      <Circle cx={0} cy={-48} r={11} fill={fill} stroke={BEAR_LINE} strokeWidth={1.5 / s} />
      <Circle cx={5} cy={-47} r={1.9} fill={face} />
      {arm ? (
        <G>
          <Arm d="M12 -29 Q24 -31 30 -40" c={fill} w={6} />
          <Circle cx={30} cy={-40.5} r={3.8} fill={fill} />
        </G>
      ) : null}
    </G>
  );
}

/* thick rounded strokes with one outline around the whole shape */
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

/* a footprint: a sole and a toe, pointing along angle a (degrees) */
type Print = [number, number, number];
function Prints({ pts, c, o = 1 }: { pts: Print[]; c: string; o?: number }) {
  return (
    <G fill={c} opacity={o}>
      {pts.map(([x, y, a], i) => (
        <G key={i} transform={`translate(${x} ${y}) rotate(${a})`}>
          <Ellipse cx={0} cy={0} rx={4.2} ry={2.5} />
          <Circle cx={5.6} cy={0} r={1.6} />
        </G>
      ))}
    </G>
  );
}
function lane(x1: number, x2: number, y: number, n: number): Print[] {
  const a = x2 < x1 ? 180 : 0;
  return Array.from({ length: n }, (_, i) => [x1 + ((x2 - x1) * i) / (n - 1), y + (i % 2 ? 2.6 : -2.6), a] as Print);
}
/* the footprints round the end of a U, going from the top lane down round the left to the lower lane */
function turnPts(cx: number, cy: number, r: number, n: number): Print[] {
  return Array.from({ length: n }, (_, i) => {
    const th = ((-90 - (180 * i) / (n - 1)) * Math.PI) / 180;
    return [cx + r * Math.cos(th), cy + r * Math.sin(th), (Math.atan2(-Math.cos(th), Math.sin(th)) * 180) / Math.PI] as Print;
  });
}

/* a tear drop, tip up, centered about (x, y) */
function Tear({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Path
        d="M0 -6 C3 -2 4.5 0 4.5 2.4 A4.5 4.5 0 0 1 -4.5 2.4 C-4.5 0 -3 -2 0 -6 Z"
        fill="#8CC8F0"
        stroke={BEAR_LINE}
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
    </G>
  );
}

/* a round tree on a trunk, standing on (x, y) */
function Tree({ x, y, s = 1, c = GREEN }: { x: number; y: number; s?: number; c?: string }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Rect x={-2} y={-12} width={4} height={12} fill={BROWN} />
      <Circle cx={0} cy={-18} r={9} fill={c} />
      <Circle cx={-3} cy={-21} r={4} fill={LEAF} opacity={0.8} />
    </G>
  );
}

/* ---------- shuv: to turn back ---------- */
function Turn({ k }: { k: Ink }) {
  const p = useGrow(500, 1200);
  return (
    <Frame label="A road seen from above at an angle. Footprints go away to the left, then curve round in a U-turn and come back along the road. The person stands at the end of the returning footprints, turned to face a small warm house at the end of the road">
      <Rect x={10} y={40} width={280} height={132} rx={18} fill={GRASS} stroke={k.line} strokeWidth={2} />
      <Rect x={206} y={98} width={64} height={30} rx={6} fill={DIRT} />
      <Path d="M214 98 L60 98 A14 14 0 0 0 60 126 L214 126" stroke={DIRT} strokeWidth={40} strokeLinejoin="round" fill="none" />
      <Prints pts={[...lane(184, 72, 98, 8), ...turnPts(60, 112, 14, 5).slice(0, 4)]} c={GRAY} o={0.9} />
      <Prints pts={[...turnPts(60, 112, 14, 5).slice(4), ...lane(72, 176, 126, 8)]} c={TERRA} />
      <House x={268} y={124} s={0.95} />
      <Ellipse cx={196} cy={136} rx={18} ry={4} fill={BEAR_LINE} opacity={0.18} />
      <Me x={196} y={134} s={0.95} dir={-1 + 2 * p} fill={k.acc} face={k.bg} />
      <Cap k={k} s="Shuv: to turn back" />
    </Frame>
  );
}

/* ---------- facing home ---------- */
function FacingHome({ k }: { k: Ink }) {
  return (
    <Frame label="A person seen from behind stands on a long road. The road winds ahead, narrowing toward a small warm house in the distance under a gold sky. They are facing it">
      <Defs>
        <ClipPath id="l32-home">
          <Rect x={10} y={10} width={280} height={162} rx={14} />
        </ClipPath>
      </Defs>
      <G clipPath="url(#l32-home)">
        <Rect x={10} y={10} width={280} height={162} fill="#F9E2B4" />
        <Circle cx={150} cy={86} r={34} fill={GOLD} opacity={0.35} />
        <Path d="M10 108 Q50 88 96 104 Q120 92 150 100 Q190 86 230 102 Q262 90 290 104 L290 172 L10 172 Z" fill="#B9D99E" />
        <Path d="M10 118 Q80 104 150 108 Q220 104 290 118 L290 172 L10 172 Z" fill={GRASS_L} />
        <Path d="M88 172 C116 154 140 128 146 108 L154 108 C160 130 192 154 214 172 Z" fill={DIRT} />
        <Path
          d="M96 172 C122 152 142 128 147 110 M204 172 C190 150 164 130 153 110"
          stroke={DIRT_D}
          strokeWidth={1.6}
          strokeLinecap="round"
          opacity={0.6}
          fill="none"
        />
        <Tree x={70} y={152} s={1.3} />
        <Tree x={238} y={150} s={1.2} />
        <Tree x={108} y={118} s={0.6} />
        <Tree x={194} y={118} s={0.6} />
        <House x={150} y={108} s={0.7} />
      </G>
      <Ellipse cx={150} cy={167} rx={17} ry={4} fill={BEAR_LINE} opacity={0.2} />
      <G transform="translate(150 166) scale(0.86) translate(-150 -166)">
        <Arm d="M133 135 Q128 146 130 155" c={BEAR_LINE} w={9} />
        <Arm d="M167 135 Q172 146 170 155" c={BEAR_LINE} w={9} />
        <Arm d="M133 135 Q128 146 130 155" c={k.acc} w={6} />
        <Arm d="M167 135 Q172 146 170 155" c={k.acc} w={6} />
        <Ellipse cx={142} cy={166} rx={7} ry={3.2} fill={BEAR_LINE} />
        <Ellipse cx={158} cy={166} rx={7} ry={3.2} fill={BEAR_LINE} />
        <Path d="M133 164 L133 150 Q133 133 150 133 Q167 133 167 150 L167 164 Z" fill={k.acc} stroke={BEAR_LINE} strokeWidth={1.5} strokeLinejoin="round" />
        <Circle cx={150} cy={118} r={11} fill={k.acc} stroke={BEAR_LINE} strokeWidth={1.5} />
      </G>
      <Cap k={k} s="Facing home" />
    </Frame>
  );
}

/* ---------- a change of mind ---------- */
function NewView({ k }: { k: Ink }) {
  const p = useGrow(500, 1200);
  const px = 112;
  const py = 134;
  return (
    <Frame label="A person stands on a hilltop and has just turned around. Where they now look is a wide, bright valley with a river winding through it and a small town. Behind them, the view they were facing before is flat gray">
      <Defs>
        <ClipPath id="l32-view">
          <Rect x={10} y={10} width={280} height={162} rx={14} />
        </ClipPath>
      </Defs>
      <G clipPath="url(#l32-view)">
        <Rect x={10} y={10} width={280} height={162} fill={SKY} />
        <Circle cx={248} cy={40} r={22} fill={GOLD} opacity={0.3} />
        <Circle cx={248} cy={40} r={12} fill={GOLD} />
        <Path d="M96 110 Q150 84 200 104 Q240 86 290 100 L290 172 L96 172 Z" fill="#B9DDAE" />
        <Path d="M96 122 Q150 112 210 124 Q260 134 290 120 L290 172 L96 172 Z" fill={GRASS_L} />
        <Path
          d="M204 118 C190 128 214 138 186 150 C172 158 168 164 160 172 L198 172 C200 164 206 158 220 150 C242 138 220 128 212 118 Z"
          fill={WATER}
          stroke="#4E95C6"
          strokeWidth={1.2}
          strokeLinejoin="round"
        />
        <Path d="M200 132 C196 138 204 142 192 150" stroke="#BFE4FA" strokeWidth={1.8} strokeLinecap="round" fill="none" />
        <House x={232} y={128} s={0.5} glow={false} />
        <House x={248} y={124} s={0.44} glow={false} />
        <House x={264} y={130} s={0.54} glow={false} />
        <House x={282} y={125} s={0.46} glow={false} />
        <Tree x={238} y={152} s={0.9} />
        <Tree x={266} y={158} s={1.05} />
        <Path d="M10 172 L10 152 Q50 130 100 133 Q146 136 164 152 Q176 162 172 172 Z" fill={GRASS_D} />
        <Path d="M10 24 Q10 10 24 10 L98 10 Q108 50 96 90 Q90 118 98 140 Q104 156 98 172 L24 172 Q10 172 10 158 Z" fill={GRAY_L} />
        <Path d="M10 136 Q40 112 66 126 Q84 112 100 134 L100 172 L10 172 Z" fill="#A2A6B6" />
        <Circle cx={30} cy={42} r={11} fill="#CDD0DA" />
        <Circle cx={46} cy={36} r={15} fill="#CDD0DA" />
        <Circle cx={64} cy={44} r={11} fill="#CDD0DA" />
        <Rect x={28} y={44} width={44} height={8} rx={4} fill="#CDD0DA" />
        <Path d="M38 134 L38 104 M38 118 L26 108 M38 112 L50 100 M38 124 L50 116" stroke={GRAY_D} strokeWidth={3} strokeLinecap="round" fill="none" />
      </G>
      <Ellipse cx={px} cy={py} rx={20} ry={4} fill={BEAR_LINE} opacity={0.18} />
      <Me x={px} y={py} s={0.95} dir={-1 + 2 * p} fill={k.acc} face={k.bg} arm />
      <Cap k={k} s="A change of mind" />
    </Frame>
  );
}

/* ---------- two people, one road ---------- */
function LookBack({ k }: { k: Ink }) {
  return (
    <Frame label="Two people on one road. On the left, a person sits slumped on the road with their head down, turned back toward a big gray cloud behind them. On the right, a person walks forward toward a small warm house; a small soft cloud of sorrow still hangs above them, but they are walking">
      <Path d="M10 124 H290 V158 Q290 172 276 172 H24 Q10 172 10 158 Z" fill={GRASS} />
      <Rect x={10} y={143} width={280} height={17} fill={DIRT} />
      <Path d="M24 151 H52 M124 151 H152 M200 151 H228" stroke={CREAM} strokeWidth={2.4} strokeLinecap="round" opacity={0.8} fill="none" />

      <G fill={GRAY} stroke={BEAR_LINE} strokeWidth={1.4}>
        <Circle cx={30} cy={104} r={13} />
        <Circle cx={50} cy={92} r={19} />
        <Circle cx={74} cy={102} r={14} />
        <Rect x={17} y={102} width={70} height={14} rx={7} stroke="none" />
      </G>
      <G fill={GRAY}>
        <Circle cx={30} cy={104} r={12.2} />
        <Circle cx={50} cy={92} r={18.2} />
        <Circle cx={74} cy={102} r={13.2} />
        <Rect x={18} y={103} width={68} height={12.5} rx={6.2} />
      </G>

      <G transform="translate(96 158) scale(1.1)">
        <Tube
          fill={k.ink}
          parts={[
            ['M12 -5 L-6 -17 L-20 -3', 8],
            ['M14 -6 Q11 -24 0 -30', 17],
            ['M-1 -25 Q-10 -21 -8 -14', 6],
          ]}
        />
        <Circle cx={-14} cy={-26} r={9.5} fill={k.ink} stroke={BEAR_LINE} strokeWidth={1.5} />
        <Path d="M-22 -28 Q-19 -25 -16 -28" stroke={k.bg} strokeWidth={1.6} strokeLinecap="round" fill="none" />
      </G>

      <G fill="#C3C7D8" stroke={BEAR_LINE} strokeWidth={1.2} strokeOpacity={0.55}>
        <Circle cx={182} cy={72} r={8} />
        <Circle cx={194} cy={67} r={11} />
        <Circle cx={207} cy={73} r={8} />
        <Rect x={180} y={72} width={29} height={8} rx={4} stroke="none" />
      </G>
      <Rect x={181} y={73} width={27} height={7} rx={3.5} fill="#C3C7D8" />

      <House x={264} y={144} s={1} />
      <Ellipse cx={192} cy={158} rx={19} ry={4} fill={BEAR_LINE} opacity={0.2} />
      <Me x={192} y={158} s={1.1} fill={k.acc} face={k.bg} lean={6} />
      <Cap k={k} s="Sorrow that turns you" />
    </Frame>
  );
}

/* ---------- two paths from one spot ---------- */
function TwoSorrows({ k }: { k: Ink }) {
  return (
    <Frame label="One path splits into two where a small person stands, a tear beside their face. The left path curls down into a gray hollow with mist over it. The right path climbs a green hill toward a small warm house. The person turns toward the right path">
      <Path d="M10 100 Q60 92 110 104 Q140 112 150 116 L150 172 L24 172 Q10 172 10 158 Z" fill={GRASS} />
      <Path d="M150 114 Q190 102 220 80 Q250 58 290 60 L290 158 Q290 172 276 172 L150 172 Z" fill={GRASS_D} />
      <Ellipse cx={60} cy={150} rx={48} ry={19} fill="#9AA08F" />

      <Path d="M148 138 C116 138 84 126 66 136 C58 141 58 146 60 150" stroke={DIRT_D} strokeWidth={14} strokeLinecap="round" fill="none" />
      <Path d="M152 138 C172 116 200 118 226 96 C240 84 248 76 254 68" stroke={DIRT_D} strokeWidth={14} strokeLinecap="round" fill="none" />
      <Rect x={139} y={134} width={22} height={40} fill={DIRT_D} />
      <Path d="M148 138 C116 138 84 126 66 136 C58 141 58 146 60 150" stroke={DIRT} strokeWidth={11} strokeLinecap="round" fill="none" />
      <Path d="M152 138 C172 116 200 118 226 96 C240 84 248 76 254 68" stroke={DIRT} strokeWidth={11} strokeLinecap="round" fill="none" />
      <Rect x={141} y={136} width={18} height={38} fill={DIRT} />

      <Ellipse cx={58} cy={151} rx={30} ry={11} fill={GRAY_D} />
      <Ellipse cx={58} cy={153} rx={22} ry={7.5} fill="#3F4252" />
      <Ellipse cx={58} cy={134} rx={32} ry={6} fill={GRAY_L} opacity={0.85} />
      <Ellipse cx={46} cy={126} rx={20} ry={4.5} fill={GRAY_L} opacity={0.7} />
      <Ellipse cx={72} cy={120} rx={14} ry={3.6} fill={GRAY_L} opacity={0.55} />

      <House x={258} y={68} s={1} />
      <Ellipse cx={150} cy={139} rx={14} ry={3.4} fill={BEAR_LINE} opacity={0.22} />
      <Me x={150} y={138} s={0.85} fill={k.acc} face={k.bg} arm />
      <Tear x={158} y={106} s={1.1} />
      <Cap k={k} s="Two kinds of sorrow" />
    </Frame>
  );
}

/* ---------- forgiven, and back to work ---------- */
function Student({ k }: { k: Ink }) {
  return (
    <Frame label="A young student at a desk in daylight from a window behind them, working: an open textbook in front of them, a notebook beside it, and a pencil in hand. On the floor beside the desk, a small bin holds a crumpled paper from yesterday">
      <Defs>
        <ClipPath id="l32-desk">
          <Rect x={10} y={10} width={280} height={162} rx={14} />
        </ClipPath>
      </Defs>
      <G clipPath="url(#l32-desk)">
        <Rect x={10} y={10} width={280} height={162} fill={WALL} />
        <Rect x={10} y={146} width={280} height={26} fill="#D9B58A" />
        <Rect x={10} y={142} width={280} height={5} fill="#C29C6E" />
      </G>
      <Rect x={150} y={22} width={104} height={68} rx={2} fill="#BFE3F5" stroke={BROWN} strokeWidth={4} />
      <Line x1={202} y1={22} x2={202} y2={90} stroke={BROWN} strokeWidth={2.6} />
      <Line x1={150} y1={56} x2={254} y2={56} stroke={BROWN} strokeWidth={2.6} />
      <Circle cx={230} cy={40} r={14} fill={GOLD} opacity={0.35} />
      <Circle cx={230} cy={40} r={8} fill={GOLD} />
      <Rect x={160} y={32} width={30} height={7} rx={3.5} fill="#FFFFFF" opacity={0.9} />
      <Rect x={168} y={27} width={18} height={8} rx={4} fill="#FFFFFF" opacity={0.9} />

      <Path d="M182 112 L182 100 Q182 84 200 84 Q218 84 218 100 L218 112 Z" fill={k.acc} />
      <Circle cx={200} cy={72} r={11.5} fill={k.acc} />
      <Path d="M188.5 71 Q189 58 200 58 Q211 58 211.5 71 Q206 65 200 66 Q193 65 188.5 71 Z" fill={BROWN_D} />
      <Path d="M194 75 Q196 77 198 75 M202 75 Q204 77 206 75" stroke={k.bg} strokeWidth={1.5} strokeLinecap="round" fill="none" />
      <Path d="M196.5 79.5 Q200 82 203.5 79.5" stroke={k.bg} strokeWidth={1.5} strokeLinecap="round" fill="none" />

      <Path d="M130 110 L274 110 L288 130 L116 130 Z" fill="#C48D55" stroke={BEAR_LINE} strokeWidth={1.4} strokeLinejoin="round" />
      <Rect x={116} y={130} width={172} height={7} fill="#9C6A3A" stroke={BEAR_LINE} strokeWidth={1.4} />
      <Rect x={122} y={137} width={8} height={23} fill="#9C6A3A" stroke={BEAR_LINE} strokeWidth={1.2} />
      <Rect x={274} y={137} width={8} height={23} fill="#9C6A3A" stroke={BEAR_LINE} strokeWidth={1.2} />

      <Path d="M150 114 L184 112 L184 126 L147 128 Z" fill={PAPER} stroke={BEAR_LINE} strokeWidth={1.2} strokeLinejoin="round" />
      <Path d="M184 112 L218 114 L221 128 L184 126 Z" fill={PAPER} stroke={BEAR_LINE} strokeWidth={1.2} strokeLinejoin="round" />
      <Path
        d="M154 117 L180 116 M153 121 L180 120 M152 125 L180 124 M188 116 L214 118 M188 120 L215 122 M189 124 L216 126"
        stroke="#B9A878"
        strokeWidth={1.2}
        strokeLinecap="round"
        fill="none"
      />
      <Path d="M229 114 L262 113 L264 126 L231 128 Z" fill="#CFE0F2" stroke={BEAR_LINE} strokeWidth={1.2} strokeLinejoin="round" />
      <Path d="M234 118 L259 117 M235 122 L260 121" stroke="#8FA8C8" strokeWidth={1.2} strokeLinecap="round" fill="none" />
      <Path d="M229 114 L231 128" stroke={BEAR_LINE} strokeWidth={2.4} strokeDasharray="1.5 2.5" fill="none" />

      <Arm d="M185 96 Q172 108 178 118" c={k.acc} w={7} />
      <Circle cx={178} cy={118} r={4} fill={k.acc} />
      <Arm d="M215 96 Q232 98 242 116" c={k.acc} w={7} />
      <Path d="M248 106 L240 122" stroke={GOLD} strokeWidth={3.4} strokeLinecap="round" />
      <Path d="M240 122 L238.6 125" stroke={BROWN_D} strokeWidth={2.2} strokeLinecap="round" />
      <Circle cx={243} cy={116} r={4} fill={k.acc} />

      <Path d="M58 128 L96 128 L91 158 L63 158 Z" fill="#7C8AA5" stroke={BEAR_LINE} strokeWidth={1.4} strokeLinejoin="round" />
      <Path d="M70 134 L72 154 M84 134 L82 154" stroke="#5F6C87" strokeWidth={1.4} strokeLinecap="round" />
      <Rect x={55} y={125} width={44} height={5} rx={2} fill="#9AA6BD" stroke={BEAR_LINE} strokeWidth={1.2} />
      <G transform="translate(74 119)">
        <Path d="M-9 -2 L-5 -9 L0 -6 L5 -10 L9 -3 L7 3 L-1 5 L-8 3 Z" fill={PAPER} stroke={BEAR_LINE} strokeWidth={1.3} strokeLinejoin="round" />
        <Path d="M-5 -9 L-1 3 M5 -10 L2 0 M-8 3 L6 -2" stroke={PAPER_D} strokeWidth={1.1} strokeLinecap="round" fill="none" />
      </G>
      <G transform="translate(44 154) rotate(-12)">
        <Path d="M-8 -1 L-4 -7 L2 -5 L8 -7 L9 -1 L5 4 L-4 4 Z" fill={PAPER} stroke={BEAR_LINE} strokeWidth={1.3} strokeLinejoin="round" />
        <Path d="M-4 -7 L0 3 M5 -6 L2 0" stroke={PAPER_D} strokeWidth={1.1} strokeLinecap="round" fill="none" />
      </G>
      <Cap k={k} s="Forgiven, and back to work" />
    </Frame>
  );
}

/* ---------- one next right thing ---------- */
function FirstStep({ k }: { k: Ink }) {
  return (
    <Frame label="A person takes one clear step out of an open doorway, off the doorstep and onto a sunlit path, one foot forward. Beside the path a small green sprout is growing, and the sun shines warmly above">
      <Circle cx={250} cy={46} r={26} fill={GOLD} opacity={0.3} />
      <Circle cx={250} cy={46} r={14} fill={GOLD} />
      <G stroke={GOLD} strokeWidth={3} strokeLinecap="round">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
          <Line
            key={a}
            x1={250 + 20 * Math.cos((a * Math.PI) / 180)}
            y1={46 + 20 * Math.sin((a * Math.PI) / 180)}
            x2={250 + 26 * Math.cos((a * Math.PI) / 180)}
            y2={46 + 26 * Math.sin((a * Math.PI) / 180)}
          />
        ))}
      </G>

      <Path d="M10 148 H290 V160 Q290 172 278 172 H22 Q10 172 10 160 Z" fill={GRASS} />
      <Path d="M96 163 C150 166 210 158 282 162" stroke={DIRT_D} strokeWidth={17} strokeLinecap="round" fill="none" />
      <Path d="M96 163 C150 166 210 158 282 162" stroke={DIRT} strokeWidth={14} strokeLinecap="round" fill="none" />
      <Ellipse cx={190} cy={162} rx={74} ry={5} fill={GOLD} opacity={0.3} />

      <Rect x={10} y={46} width={92} height={102} rx={3} fill="#EFD9BE" stroke={BEAR_LINE} strokeWidth={1.6} />
      <Rect x={6} y={36} width={100} height={12} rx={3} fill={TERRA} stroke={BEAR_LINE} strokeWidth={1.4} />
      <Rect x={46} y={76} width={38} height={72} fill="#FFD98A" stroke={BROWN} strokeWidth={3} />
      <Path d="M46 76 L34 82 L34 146 L46 148 Z" fill={BROWN} stroke={BEAR_LINE} strokeWidth={1.4} strokeLinejoin="round" />
      <Rect x={72} y={148} width={44} height={8} rx={2} fill="#CFC6B8" stroke={BEAR_LINE} strokeWidth={1.4} />

      <G transform="translate(180 153) scale(1.3)">
        <Path d="M0 0 Q0 -9 3 -16" stroke={GREEN} strokeWidth={2.6} strokeLinecap="round" fill="none" />
        <Ellipse cx={-6} cy={-12} rx={7} ry={3.4} fill={LEAF} stroke={GREEN} strokeWidth={1} transform="rotate(-28 -6 -12)" />
        <Ellipse cx={9} cy={-16} rx={7} ry={3.4} fill={GREEN} transform="rotate(24 9 -16)" />
      </G>

      <G transform="translate(102 148)">
        <Tube fill={k.acc} parts={[['M0 -33 L-4 -17 L-9 -3', 9]]} />
        <Tube fill={k.acc} parts={[['M2 -33 L12 -17 L20 4', 9]]} />
        <Ellipse cx={-6} cy={-1} rx={8} ry={3.2} fill={BEAR_LINE} />
        <Ellipse cx={25} cy={6.5} rx={8} ry={3.2} fill={BEAR_LINE} />
        <Tube fill={k.acc} parts={[['M-2 -58 Q-12 -50 -12 -41', 6]]} />
        <Path d="M-10 -32 L-10 -42 Q-10 -62 4 -62 Q18 -62 18 -42 L18 -32 Z" fill={k.acc} stroke={BEAR_LINE} strokeWidth={1.5} strokeLinejoin="round" />
        <Circle cx={7} cy={-72} r={10.5} fill={k.acc} stroke={BEAR_LINE} strokeWidth={1.5} />
        <Circle cx={11.5} cy={-73} r={1.8} fill={k.bg} />
        <Tube fill={k.acc} parts={[['M13 -56 Q24 -50 25 -40', 6]]} />
      </G>
      <Cap k={k} s="One next right thing" />
    </Frame>
  );
}

export const SCENES_L32: Record<string, ComponentType<{ k: Ink }>> = {
  'l22-turn': Turn,
  'l22-facing-home': FacingHome,
  'l22-new-view': NewView,
  'l22-look-back': LookBack,
  'l22-two-sorrows': TwoSorrows,
  'l22-student': Student,
  'l22-first-step': FirstStep,
};
