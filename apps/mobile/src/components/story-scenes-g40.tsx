/* Scenes for lesson 40 told as a story (see story-kit.tsx): "Your log is your evidence". Kahneman's cold-water study, the same pattern
   in patients after a painful exam, a week as memory keeps it against a week as a log keeps it, and the footprints a log leaves. */
import { useEffect, useState, type ComponentType } from 'react';
import { Easing } from 'react-native';
import { Circle, ClipPath, Defs, Ellipse, G, Line, Path, Rect } from 'react-native-svg';

import { useAppear, useReducedMotion } from '@/lib/motion';

import { Frame, type Ink, Person, Say } from './story-kit';

const L40_WATER = '#BFE3F2';
const L40_ICE = '#EAF7FD';
const L40_ICE_EDGE = '#8FC3DA';
const L40_COLD = '#4DA3E8';
const L40_FROST = '#7FB7D1';
const L40_TUB = '#7C93A8';
const L40_TUB_RIM = '#A9BDCE';
const L40_SKIN = '#E9B896';
const L40_ARM = '#E8B98F';
const L40_SKIN_SHADE = '#D79F7C';
const L40_PAIN = '#D9534F';
const L40_GOLD = '#FFD25A';
const L40_WHITE = '#FFFFFF';
const L40_COAT = '#F3F6F9';
const L40_COAT_EDGE = '#AEBBC7';
const L40_CHAIR = '#6FA0B0';
const L40_GREEN = '#4E9A5B';
const L40_AMBER = '#D9923A';
const L40_PAPER = '#FBF6EA';
const L40_PAPER_EDGE = '#C9BFA8';
const L40_PAPER_LINE = '#D9CFB8';
const L40_BROWN = '#8A5A2B';
const L40_DARK = '#3B2F45';

/* a number from 0 to 1 that eases up once, after a short pause; with Reduce Motion on it starts at 1 */
function L40useGrow(delay = 300, dur = 1200) {
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
function L40Cap({ k, s }: { k: Ink; s: string }) {
  return <Say x={150} y={190} s={s} fill={k.ink} />;
}

/* an open hand hanging down from the wrist at the origin: a palm, four fingers a little apart and a thumb */
function L40Hand({ fill, opacity = 1 }: { fill: string; opacity?: number }) {
  return (
    <G opacity={opacity}>
      <Rect x={-8} y={-2} width={16} height={17} rx={6} fill={fill} />
      <Ellipse cx={-9.5} cy={8} rx={3.4} ry={7} fill={fill} transform="rotate(32 -9.5 8)" />
      {[
        [-6.2, 12, 9],
        [-2.1, 14, 3],
        [2.1, 13, -3],
        [6.2, 10, -9],
      ].map(([fx, len, rot], i) => (
        <Rect key={i} x={fx - 1.9} y={11} width={3.8} height={len + 4} rx={1.9} fill={fill} transform={`rotate(${rot} ${fx} 11)`} />
      ))}
    </G>
  );
}

/* ---------- the tub of icy water, seen from the side ---------- */
/* Origin is the middle of the rim: about 124 wide and 62 tall at scale 1. The water shows through the side of the tub. With `hand` on, a
   forearm comes down from above (the sleeve colour is `sleeve`) and the hand hangs in the water, with a few small cold lines round it. */
function L40Tub({ x, y, s = 1, hand = true, sleeve = '#5A6C8F' }: { x: number; y: number; s?: number; hand?: boolean; sleeve?: string }) {
  const body = 'M-62 0 L-54 54 Q-52 62 -43 62 L43 62 Q52 62 54 54 L62 0 Z';
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Path d={body} fill="#EAF4F9" />
      <Path d="M-60.5 10 L-54 54 Q-52 62 -43 62 L43 62 Q52 62 54 54 L60.5 10 Z" fill={L40_WATER} />
      <Path d="M-60 10 Q-40 6 -20 10 T20 10 T60 10" stroke={L40_WHITE} strokeWidth={1.6} strokeLinecap="round" fill="none" opacity={0.85} />
      {[
        [-38, 12, 12],
        [28, 13, -10],
        [46, 10, 18],
        [-26, 42, -8],
        [34, 47, 14],
      ].map(([cx, cy, r], i) => (
        <G key={i} transform={`translate(${cx} ${cy}) rotate(${r})`} opacity={i > 2 ? 0.7 : 1}>
          <Rect x={-5} y={-5} width={10} height={10} rx={2.4} fill={L40_ICE} stroke={L40_ICE_EDGE} strokeWidth={1} />
          <Path d="M-2.6 -2 L1 -2.4" stroke={L40_WHITE} strokeWidth={1.2} strokeLinecap="round" />
        </G>
      ))}
      {hand ? (
        <G>
          <Defs>
            <ClipPath id="l40-under">
              <Rect x={-40} y={10} width={80} height={60} />
            </ClipPath>
          </Defs>
          <Path d="M-38 -70 L2 22" stroke={L40_ARM} strokeWidth={15} strokeLinecap="round" />
          <G transform="translate(2 20) rotate(-23)">
            <L40Hand fill={L40_ARM} />
          </G>
          <Path d="M-27.3 -47 L-45.5 -90" stroke={sleeve} strokeWidth={22} />
          <Path d="M-37.4 -42.7 L-17.2 -51.3" stroke={L40_DARK} strokeWidth={3.4} strokeLinecap="round" opacity={0.3} />
          <G clipPath="url(#l40-under)">
            <Path d="M-38 -70 L2 22" stroke={L40_COLD} strokeWidth={15} strokeLinecap="round" opacity={0.2} />
            <G transform="translate(2 20) rotate(-23)">
              <L40Hand fill={L40_COLD} opacity={0.2} />
            </G>
          </G>
          <Rect x={-40} y={10} width={80} height={60} fill={L40_WATER} opacity={0.34} />
          <Ellipse cx={-3} cy={10} rx={15} ry={3} stroke={L40_WHITE} strokeWidth={1.4} fill="none" opacity={0.9} />
          <Path d="M-40 -14 q-4 -5 0 -10 t0 -10" stroke={L40_COLD} strokeWidth={1.8} strokeLinecap="round" fill="none" />
          <Path d="M17 -18 q4 -5 0 -10 t0 -10" stroke={L40_COLD} strokeWidth={1.8} strokeLinecap="round" fill="none" />
          <Path d="M-31 -2 q-3 -4 0 -8 M31 -4 q3 -4 0 -8" stroke={L40_COLD} strokeWidth={1.5} strokeLinecap="round" fill="none" opacity={0.8} />
        </G>
      ) : null}
      <Path d={body} stroke={L40_TUB} strokeWidth={3} strokeLinejoin="round" fill="none" />
      <Rect x={-68} y={-4} width={136} height={7} rx={3.5} fill={L40_TUB_RIM} stroke={L40_TUB} strokeWidth={1.6} />
      {[-52, -24, 40, 58].map((fx, i) => (
        <G key={fx} transform={`translate(${fx} ${-9 - (i % 2)})`}>
          <Path d="M-3.4 0 H3.4 M-1.7 -3 L1.7 3 M1.7 -3 L-1.7 3" stroke={L40_FROST} strokeWidth={1.3} strokeLinecap="round" />
        </G>
      ))}
      {[-38, 12, 50].map((fx) => (
        <G key={fx}>
          <Ellipse cx={fx} cy={-4} rx={7} ry={2.6} fill={L40_ICE} stroke={L40_ICE_EDGE} strokeWidth={0.9} />
          <Circle cx={fx + 3} cy={-6} r={2.2} fill={L40_ICE} stroke={L40_ICE_EDGE} strokeWidth={0.8} />
        </G>
      ))}
    </G>
  );
}

/* ---------- a pain line: no numbers and no clock, only how much it hurts over time ---------- */
/* `w` is the width of the first part; the top of the box is the worst. With `tail` the line carries on for another half of `w` and eases
   down a little at the end. The end of the line is marked with a dot. */
const L40_FIRST: Array<[number, number]> = [
  [0, 1],
  [0.07, 0.4],
  [0.15, 0.1],
  [0.29, 0.2],
  [0.44, 0.05],
  [0.6, 0.18],
  [0.78, 0.07],
  [1, 0.12],
];
const L40_TAIL: Array<[number, number]> = [
  [1.14, 0.2],
  [1.3, 0.3],
  [1.5, 0.4],
];
/* a smooth curve through points (Catmull-Rom turned into cubic pieces) */
function l40Smooth(pts: Array<[number, number]>) {
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}
function L40Pain({ x, y, w, h, tail = false, k, axis = true }: { x: number; y: number; w: number; h: number; tail?: boolean; k: Ink; axis?: boolean }) {
  const pts = (tail ? [...L40_FIRST, ...L40_TAIL] : L40_FIRST).map(([u, v]): [number, number] => [x + u * w, y + v * h]);
  const last = pts[pts.length - 1];
  const line = l40Smooth(pts);
  return (
    <G>
      {axis ? (
        <Path
          d={`M${x} ${y - 2} V${y + h} H${last[0] + 6}`}
          stroke={k.muted}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity={0.7}
        />
      ) : null}
      <Path d={`${line} L${last[0].toFixed(1)} ${y + h} L${x} ${y + h} Z`} fill={L40_PAIN} opacity={0.14} />
      <Path d={line} stroke={L40_PAIN} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Circle cx={last[0]} cy={last[1]} r={3.6} fill={L40_PAIN} />
    </G>
  );
}

/* ---------- 1. a full minute in cold water ---------- */
function L40Cold({ k }: { k: Ink }) {
  return (
    <Frame label="A clear tub of icy water with ice cubes and frost on its rim. A forearm comes down from above and the hand is held in the cold water, with small cold lines around it. Beside it a thermometer reads low, labeled 14 degrees.">
      <L40Tub x={104} y={98} s={1.15} sleeve={k.acc} />
      <G transform="translate(240 0)">
        <Rect x={-7} y={30} width={14} height={110} rx={7} fill={k.bg} stroke={k.muted} strokeWidth={2} />
        {[46, 62, 78, 94].map((ty) => (
          <Line key={ty} x1={11} y1={ty} x2={17} y2={ty} stroke={k.muted} strokeWidth={1.5} strokeLinecap="round" />
        ))}
        <Circle cx={0} cy={148} r={14} fill={k.muted} />
        <Rect x={-5.5} y={100} width={11} height={36} fill={k.bg} />
        <Circle cx={0} cy={148} r={11.5} fill={L40_COLD} />
        <Rect x={-3} y={116} width={6} height={32} fill={L40_COLD} />
        <Line x1={9} y1={116} x2={20} y2={116} stroke={L40_COLD} strokeWidth={2.2} strokeLinecap="round" />
        <Say x={24} y={120} s="14°" fill={k.ink} size={12} anchor="start" />
        <Path d="M0 12 V24 M-5 15 L5 21 M5 15 L-5 21" stroke={L40_COLD} strokeWidth={1.6} strokeLinecap="round" />
      </G>
      <L40Cap k={k} s="A full minute in cold water" />
    </Frame>
  );
}

/* ---------- 2. the same minute, and then more ---------- */
function L40Longer({ k }: { k: Ink }) {
  const px = 58;
  const pw = 130;
  return (
    <Frame label="Two pain lines, one above the other. The first, labeled First, stays high and then stops. The second, labeled Second, stays just as high for the same length, then carries on for half as long again, easing down slightly at the end.">
      <Rect x={px + pw} y={98} width={pw / 2 + 12} height={62} rx={8} fill={k.acc} opacity={0.14} />
      <Line x1={px + pw} y1={14} x2={px + pw} y2={160} stroke={k.muted} strokeWidth={1.5} strokeDasharray="3 4" strokeLinecap="round" opacity={0.8} />
      <Say x={14} y={60} s="First" fill={k.muted} size={12} anchor="start" />
      <L40Pain x={px} y={26} w={pw} h={52} k={k} />
      <Say x={14} y={134} s="Second" fill={k.muted} size={12} anchor="start" />
      <L40Pain x={px} y={104} w={pw} h={52} tail k={k} />
      <L40Cap k={k} s="The same minute, and then more" />
    </Frame>
  );
}

/* ---------- 3. a gentler end, remembered as easier ---------- */
/* a thought cloud: a ring of circles, outlined once so no seams show inside */
const L40_PUFFS: Array<[number, number, number]> = [
  [52, 38, 15],
  [72, 26, 17],
  [98, 24, 17],
  [122, 34, 15],
  [88, 42, 19],
  [60, 48, 12],
  [112, 50, 11],
];
function L40Thought({ k }: { k: Ink }) {
  return (
    <G>
      {L40_PUFFS.map(([cx, cy, r], i) => (
        <Circle key={i} cx={cx} cy={cy} r={r + 1.6} fill={k.line} />
      ))}
      <Circle cx={80} cy={68} r={5.6} fill={k.line} />
      <Circle cx={74} cy={77} r={3.8} fill={k.line} />
      {L40_PUFFS.map(([cx, cy, r], i) => (
        <Circle key={i} cx={cx} cy={cy} r={r} fill={k.soft} />
      ))}
      <Circle cx={80} cy={68} r={4.2} fill={k.soft} />
      <Circle cx={74} cy={77} r={2.6} fill={k.soft} />
    </G>
  );
}
function L40Doctor({ k }: { k: Ink }) {
  return (
    <Frame label="A calm patient sits in an exam chair with eyes closed. Over the patient's head a small thought cloud holds a short pain line that eases down at the end. A doctor in a white coat stands beside with a clipboard.">
      <Rect x={230} y={18} width={56} height={52} rx={8} fill={k.soft} stroke={k.line} strokeWidth={1.5} />
      <Line x1={258} y1={18} x2={258} y2={70} stroke={k.line} strokeWidth={1.5} />
      <Line x1={230} y1={44} x2={286} y2={44} stroke={k.line} strokeWidth={1.5} />
      <Circle cx={272} cy={31} r={7} fill={L40_GOLD} opacity={0.9} />
      <Rect x={254} y={116} width={36} height={50} rx={4} fill={k.soft} stroke={k.line} strokeWidth={1.5} />
      <Line x1={254} y1={141} x2={290} y2={141} stroke={k.line} strokeWidth={1.5} />
      <Path d="M272 124 V134 M267 129 H277" stroke={k.acc} strokeWidth={2.4} strokeLinecap="round" />
      <Line x1={10} y1={166} x2={290} y2={166} stroke={k.line} strokeWidth={2} strokeLinecap="round" />

      <L40Thought k={k} />
      <L40Pain x={50} y={22} w={44} h={26} tail k={k} axis={false} />
      <Line x1={50} y1={48} x2={122} y2={48} stroke={k.muted} strokeWidth={1.2} strokeLinecap="round" opacity={0.5} />

      <Rect x={86} y={156} width={10} height={8} fill={L40_TUB} />
      <Ellipse cx={91} cy={164} rx={28} ry={3.6} fill={L40_TUB} />
      <Rect x={54} y={138} width={72} height={11} rx={5.5} fill={L40_CHAIR} />
      <Rect x={87} y={148} width={8} height={9} fill={L40_TUB} />
      <Path d="M62 140 L52 98" stroke={L40_CHAIR} strokeWidth={14} strokeLinecap="round" />
      <Path d="M74 136 L114 134 L121 158" stroke={k.ink} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Ellipse cx={124} cy={161} rx={9} ry={3.6} fill={k.ink} />
      <Path d="M70 134 L66 106" stroke={k.ink} strokeWidth={21} strokeLinecap="round" />
      <Path d="M68 108 L92 122" stroke={k.ink} strokeWidth={6} strokeLinecap="round" />
      <Circle cx={69} cy={90} r={11} fill={k.ink} />
      <Path d="M70 89 Q74 92 78 89" stroke={k.bg} strokeWidth={1.6} strokeLinecap="round" fill="none" />

      <Rect x={198} y={158} width={7} height={8} rx={2} fill={L40_DARK} />
      <Rect x={211} y={158} width={7} height={8} rx={2} fill={L40_DARK} />
      <Path d="M193 160 L195 106 Q195 94 208 94 Q221 94 223 106 L225 160 Z" fill={L40_COAT} stroke={L40_COAT_EDGE} strokeWidth={1.5} strokeLinejoin="round" />
      <Path d="M204 96 Q208 106 212 96" stroke={k.acc} strokeWidth={2} fill="none" />
      <Path d="M206 98 V160" stroke={L40_COAT_EDGE} strokeWidth={1} opacity={0.7} />
      <Circle cx={208} cy={80} r={11} fill={k.ink} />
      <Path d="M199 106 L190 120" stroke={L40_COAT_EDGE} strokeWidth={9} strokeLinecap="round" />
      <Path d="M199 106 L190 120" stroke={L40_COAT} strokeWidth={7} strokeLinecap="round" />
      <Rect x={170} y={102} width={22} height={30} rx={3} fill="#B98B55" />
      <Rect x={173} y={106} width={16} height={23} rx={1.5} fill={L40_WHITE} />
      <Rect x={176} y={99} width={10} height={5} rx={2} fill={L40_DARK} />
      <Path d="M175 112 H187 M175 117 H187 M175 122 H183" stroke={L40_PAPER_EDGE} strokeWidth={1.4} strokeLinecap="round" />
      <Circle cx={190} cy={121} r={3.6} fill={L40_SKIN} />
      <L40Cap k={k} s="A gentler end, remembered as easier" />
    </Frame>
  );
}

/* ---------- 4. the quiet days fall away ---------- */
const L40_DAYS = [0, 1, 2, 3, 4, 5, 6];
const l40DayX = (i: number) => 98 + 29 * i;
function L40Week({ k }: { k: Ink }) {
  return (
    <Frame label="Seven day dots in a row at the bottom. Above them, in a row labeled Memory, only two show clearly: one big dark dot for the worst moment and the last dot. The other five are faint and almost gone.">
      <Rect x={8} y={14} width={284} height={86} rx={16} fill={k.soft} opacity={0.75} />
      <Say x={18} y={61} s="Memory" fill={k.muted} size={11} anchor="start" />
      {L40_DAYS.map((i) => {
        const x = l40DayX(i);
        if (i === 2) return <Circle key={i} cx={x} cy={57} r={20} fill={k.ink} />;
        if (i === 6) return <Circle key={i} cx={x} cy={57} r={12} fill={k.acc} />;
        return <Circle key={i} cx={x} cy={57} r={9} fill={k.muted} opacity={0.14} />;
      })}
      {[2, 6].map((i) => (
        <Line
          key={i}
          x1={l40DayX(i)}
          y1={i === 2 ? 80 : 72}
          x2={l40DayX(i)}
          y2={118}
          stroke={k.muted}
          strokeWidth={1.5}
          strokeDasharray="3 4"
          strokeLinecap="round"
          opacity={0.8}
        />
      ))}
      <Line x1={l40DayX(0)} y1={134} x2={l40DayX(6)} y2={134} stroke={k.line} strokeWidth={2.5} strokeLinecap="round" />
      {L40_DAYS.map((i) => (
        <Circle key={i} cx={l40DayX(i)} cy={134} r={10} fill={i === 2 ? k.ink : k.acc} />
      ))}
      <Rect x={22} y={112} width={40} height={44} rx={7} fill={k.bg} stroke={k.line} strokeWidth={1.8} />
      <Path d="M22 126 V119 Q22 112 29 112 H55 Q62 112 62 119 V126 Z" fill={k.acc} />
      {[0, 1, 2].map((c) => [0, 1].map((r) => <Circle key={`${c}${r}`} cx={32 + c * 10} cy={136 + r * 10} r={2.2} fill={k.muted} opacity={0.7} />))}
      <L40Cap k={k} s="The quiet days fall away" />
    </Frame>
  );
}

/* ---------- 5. every day, the same size ---------- */
const L40_ROWS = [46, 63, 80, 97, 114, 131, 148];
function L40Log({ k }: { k: Ink }) {
  return (
    <Frame label="An open journal page with seven lines, every line the same size. Each has a small mark at its left: six calm green check marks and one small amber dot for the hard day, all the same weight.">
      <Rect x={30} y={26} width={228} height={142} rx={10} fill={L40_PAPER_EDGE} opacity={0.5} />
      <Rect x={26} y={22} width={228} height={142} rx={10} fill={L40_PAPER} stroke={L40_PAPER_EDGE} strokeWidth={1.5} />
      <Line x1={66} y1={32} x2={66} y2={154} stroke="#E6B3AE" strokeWidth={1.4} />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <G key={i}>
          <Rect x={40 + i * 24} y={14} width={7} height={16} rx={3.5} fill="#7C8796" />
          <Circle cx={43.5 + i * 24} cy={28} r={2} fill={L40_PAPER_EDGE} />
        </G>
      ))}
      {L40_ROWS.map((cy, i) => (
        <G key={cy}>
          {i === 3 ? (
            <Circle cx={48} cy={cy} r={4.2} fill={L40_AMBER} />
          ) : (
            <Path
              d={`M${43} ${cy} L${47} ${cy + 4} L${54} ${cy - 4}`}
              stroke={L40_GREEN}
              strokeWidth={2.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          )}
          <Rect x={80} y={cy - 2} width={156} height={4} rx={2} fill={L40_PAPER_LINE} />
        </G>
      ))}
      <Rect x={268} y={50} width={12} height={84} fill="#E8B730" />
      <Rect x={268} y={44} width={12} height={7} rx={3} fill="#E58FA0" />
      <Rect x={268} y={50} width={12} height={3} fill={L40_COAT_EDGE} />
      <Path d="M268 134 L280 134 L274 152 Z" fill="#F0D9B5" />
      <Path d="M272 146 L276 146 L274 152 Z" fill={k.ink} />
      <L40Cap k={k} s="Every day, the same size" />
    </Frame>
  );
}

/* ---------- 6. footprints of who you are becoming ---------- */
const L40_TRAIL_N = 18;
const L40_PRINTS = (() => {
  const p0 = [26, 158];
  const p1 = [122, 178];
  const p2 = [104, 100];
  const p3 = [214, 92];
  const out: Array<{ x: number; y: number; a: number; s: number }> = [];
  for (let i = 0; i < L40_TRAIL_N; i++) {
    const t = (i + 0.5) / L40_TRAIL_N;
    const u = 1 - t;
    const x = u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0];
    const y = u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1];
    const dx = 3 * u * u * (p1[0] - p0[0]) + 6 * u * t * (p2[0] - p1[0]) + 3 * t * t * (p3[0] - p2[0]);
    const dy = 3 * u * u * (p1[1] - p0[1]) + 6 * u * t * (p2[1] - p1[1]) + 3 * t * t * (p3[1] - p2[1]);
    const len = Math.hypot(dx, dy);
    const sc = 1.25 - 0.8 * t;
    const side = i % 2 ? 1 : -1;
    out.push({ x: x + (-dy / len) * side * 3.4 * sc, y: y + (dx / len) * side * 3.4 * sc, a: (Math.atan2(dy, dx) * 180) / Math.PI + 90, s: sc });
  }
  return out;
})();
function L40Steps({ k }: { k: Ink }) {
  const p = L40useGrow(300, 1800);
  return (
    <Frame label="A long trail of footprints winds across a warm landscape, from the near left up to a gentle rise in golden light, where a small figure stands looking back at how far they came.">
      <Defs>
        <ClipPath id="l40-steps-panel">
          <Rect x={4} y={4} width={292} height={164} rx={18} />
        </ClipPath>
      </Defs>
      <G clipPath="url(#l40-steps-panel)">
        <Rect x={0} y={0} width={300} height={172} fill="#FDEBC4" />
        <Circle cx={252} cy={40} r={52} fill={L40_GOLD} opacity={0.18} />
        <Circle cx={252} cy={40} r={34} fill={L40_GOLD} opacity={0.28} />
        <Circle cx={252} cy={40} r={17} fill={L40_GOLD} />
        <Ellipse cx={64} cy={36} rx={26} ry={7} fill={L40_PAPER} opacity={0.85} />
        <Ellipse cx={84} cy={30} rx={16} ry={6} fill={L40_PAPER} opacity={0.85} />
        <Ellipse cx={150} cy={58} rx={22} ry={5.5} fill={L40_PAPER} opacity={0.7} />
        <Path d="M0 100 Q60 70 120 92 Q170 72 220 96 Q260 84 300 98 V124 H0 Z" fill="#F0CF93" />
        <Path d="M0 118 Q90 104 170 112 Q250 120 300 104 V172 H0 Z" fill="#D9A862" />
        <Circle cx={226} cy={64} r={40} fill={L40_GOLD} opacity={0.2} />
        <Path d="M110 172 Q130 130 178 100 Q214 80 232 82 Q268 84 300 112 V172 Z" fill="#E8BE78" />
        {L40_PRINTS.map((f, i) => {
          const o = Math.max(0, Math.min(1, p * (L40_TRAIL_N + 3) - i));
          return (
            <G key={i} transform={`translate(${f.x.toFixed(1)} ${f.y.toFixed(1)}) rotate(${f.a.toFixed(1)}) scale(${f.s.toFixed(2)})`} opacity={0.78 * o}>
              <Ellipse cx={0} cy={-2.4} rx={3.4} ry={5.4} fill={L40_BROWN} />
              <Ellipse cx={0} cy={4.6} rx={2.5} ry={2.7} fill={L40_BROWN} />
            </G>
          );
        })}
        <Ellipse cx={206} cy={85} rx={24} ry={3} fill={L40_BROWN} opacity={0.3} />
        <Person x={226} y={84} s={0.9} fill={L40_DARK} />
      </G>
      <Rect x={4} y={4} width={292} height={164} rx={18} stroke={k.line} strokeWidth={1.5} fill="none" />
      <L40Cap k={k} s="Footprints of who you are becoming" />
    </Frame>
  );
}

export const SCENES_G40: Record<string, ComponentType<{ k: Ink }>> = {
  'l40-cold': L40Cold,
  'l40-longer': L40Longer,
  'l40-doctor': L40Doctor,
  'l40-week': L40Week,
  'l40-log': L40Log,
  'l40-steps': L40Steps,
};
