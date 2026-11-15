/* Scenes for lessons told as a story (see story-kit.tsx), part of story-scenes-e.tsx: lesson 12, thoughts are not orders. Flat shapes in
   the lesson's own colors, 300 by 200, one short line of words at most. */
import { useEffect, useState, type ComponentType } from 'react';
import { Easing } from 'react-native';
import { Circle, G, Line, Path, Rect } from 'react-native-svg';

import { useAppear, useReducedMotion } from '@/lib/motion';

import { Cloud, Frame, type Ink, Person, Say } from './story-kit';

const RED = '#C2410C';
const GOLD = '#FFD25A';
const LEAF = '#6BAA6B';

/* a number from 0 to 1 that eases up once, after a short pause; with Reduce Motion on it starts at 1 */
function useGrow(delay = 300, dur = 1100) {
  const still = useReducedMotion();
  const v = useAppear(delay, dur, Easing.out(Easing.cubic));
  const [p, setP] = useState(still ? 1 : 0);
  useEffect(() => {
    const id = v.addListener(({ value }) => setP(value));
    return () => v.removeListener(id);
  }, [v]);
  return p;
}

/* a limb: a thick round-ended line */
function Limb({ a, b, w = 7, c }: { a: [number, number]; b: [number, number]; w?: number; c: string }) {
  return <Line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={c} strokeWidth={w} strokeLinecap="round" />;
}

/* a paper slip with a few lines of writing, turned a little; the dark edge keeps slips apart where they overlap */
function Slip({ x, y, r, n, k }: { x: number; y: number; r: number; n: number; k: Ink }) {
  return (
    <G transform={`translate(${x} ${y}) rotate(${r})`}>
      <Rect x={-15} y={-10} width={30} height={20} rx={2.5} fill={k.ink} stroke={k.bg} strokeWidth={1.4} />
      <Line x1={-10} y1={-4} x2={10 - (n % 3) * 3} y2={-4} stroke={k.bg} strokeWidth={1.6} strokeLinecap="round" />
      <Line x1={-10} y1={1} x2={4 + (n % 2) * 5} y2={1} stroke={k.bg} strokeWidth={1.6} strokeLinecap="round" />
      {n % 3 !== 0 ? <Line x1={-10} y1={6} x2={-1 + (n % 4) * 3} y2={6} stroke={k.bg} strokeWidth={1.6} strokeLinecap="round" /> : null}
    </G>
  );
}

/* a rounded thought bubble with no tail */
function Bubble({ x, y, w, h, fill }: { x: number; y: number; w: number; h: number; fill: string }) {
  return <Rect x={x} y={y} width={w} height={h} rx={h / 2} fill={fill} />;
}

/* ---------- 1: the two researchers ask ---------- */
function LondonAsk({ k }: { k: Ink }) {
  return (
    <Frame label="An office. Two researchers sit behind a desk, one holding a clipboard. Across from them stands an ordinary person with a small thought cloud above them holding a jagged scribble. A window behind shows rooftops and a tower. The words say: do you have them too?">
      <Line x1={8} y1={160} x2={292} y2={160} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      {/* the window, a frame and a skyline */}
      <Rect x={126} y={16} width={70} height={76} rx={3} fill="none" stroke={k.line} strokeWidth={3} />
      <Path d="M126 92 V74 H142 V60 H156 V78 H168 V66 H196" fill="none" stroke={k.line} strokeWidth={2.5} strokeLinejoin="round" />
      <Path d="M172 92 V46 L177 32 L182 46 V92" fill="none" stroke={k.line} strokeWidth={2.5} strokeLinejoin="round" />
      {/* the two at the desk */}
      <Person x={54} y={116} fill={k.acc} face={k.bg} />
      <Person x={104} y={116} fill={k.ink} face={k.bg} />
      <Limb a={[66, 92]} b={[78, 98]} w={5} c={k.acc} />
      <Rect x={76} y={82} width={17} height={23} rx={2.5} fill={k.ink} stroke={k.bg} strokeWidth={1.4} />
      <Rect x={81} y={79} width={7} height={5} rx={1.5} fill={k.muted} />
      <Line x1={80} y1={92} x2={89} y2={92} stroke={k.bg} strokeWidth={1.6} strokeLinecap="round" />
      <Line x1={80} y1={97} x2={87} y2={97} stroke={k.bg} strokeWidth={1.6} strokeLinecap="round" />
      <Rect x={28} y={114} width={106} height={7} rx={3} fill={k.muted} />
      <Rect x={36} y={121} width={6} height={39} rx={2} fill={k.muted} />
      <Rect x={120} y={121} width={6} height={39} rx={2} fill={k.muted} />
      {/* the ordinary person and the thought */}
      <Person x={240} y={160} fill={k.ink} face={k.bg} />
      <Cloud x={208} y={38} w={64} h={34} fill={k.soft} />
      <Path d="M220 62 l7 -12 l6 13 l7 -15 l6 15 l7 -12 l6 11 l6 -9" fill="none" stroke={RED} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
      <Say x={150} y={188} s="Do you have them too?" fill={k.ink} />
    </Frame>
  );
}

/* ---------- 2: one mixed pile ---------- */
const PILE: [number, number, number][] = [
  [80, 134, -8],
  [108, 136, 6],
  [137, 135, -4],
  [166, 136, 9],
  [195, 134, -10],
  [222, 137, 12],
  [95, 118, 14],
  [124, 119, -12],
  [153, 117, 8],
  [182, 118, -6],
  [210, 121, 15],
  [138, 101, -9],
];

function ThoughtCards({ k }: { k: Ink }) {
  return (
    <Frame label="About twelve small paper slips with writing on them lie heaped in one loose, mixed pile on a table. The words say: one mixed pile.">
      <Line x1={50} y1={148} x2={250} y2={148} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      {PILE.map(([x, y, r], i) => (
        <Slip key={i} x={x} y={y} r={r} n={i} k={k} />
      ))}
      <Say x={150} y={184} s="One mixed pile" fill={k.ink} />
    </Frame>
  );
}

/* ---------- 3: the expert cannot sort ---------- */
function CannotSort({ k }: { k: Ink }) {
  const tray = (x: number) => `M${x} 122 L${x + 8} 152 L${x + 78} 152 L${x + 86} 122`;
  return (
    <Frame label="An expert with small round glasses stands between two empty open trays, one labeled Patients and one labeled Others. They hold one slip of paper up in the air with a big question mark above their head.">
      <Path d={tray(22)} fill="none" stroke={k.line} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      <Path d={tray(192)} fill="none" stroke={k.line} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      <Say x={65} y={176} s="Patients" fill={k.ink} />
      <Say x={235} y={176} s="Others" fill={k.ink} />
      {/* the expert, glasses on */}
      <Limb a={[164, 120]} b={[186, 90]} c={k.ink} />
      <Person x={150} y={152} fill={k.ink} face={k.bg} />
      <G transform="translate(150 152)">
        <Circle cx={-4.5} cy={-48} r={4.2} fill="none" stroke={k.bg} strokeWidth={1.3} />
        <Circle cx={5.5} cy={-48} r={4.2} fill="none" stroke={k.bg} strokeWidth={1.3} />
        <Line x1={-0.3} y1={-48} x2={1.3} y2={-48} stroke={k.bg} strokeWidth={1.3} />
      </G>
      <Slip x={190} y={78} r={12} n={1} k={k} />
      <Say x={150} y={72} s="?" fill={k.acc} size={38} />
    </Frame>
  );
}

/* ---------- 4: let it pass, or fight it ---------- */
function LetPass({ k }: { k: Ink }) {
  const p = useGrow(300, 1400);
  return (
    <Frame label="Two people side by side. On the left, a calm person watches a thought cloud drift up and away, its trail fading. On the right, a person pushes with both arms against a big thought cloud that bounces back even bigger. The words say: let it pass, and fought it.">
      <Line x1={8} y1={152} x2={292} y2={152} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      {/* left: the thought drifts off, its trail thinning */}
      <Person x={84} y={152} fill={k.ink} face={k.bg} />
      <Line x1={79} y1={92} x2={76} y2={89} stroke={k.acc} strokeWidth={3} strokeLinecap="round" opacity={0.3} />
      <Line x1={73} y1={87} x2={69} y2={83} stroke={k.acc} strokeWidth={3} strokeLinecap="round" opacity={0.5} />
      <Line x1={66} y1={80} x2={62} y2={76} stroke={k.acc} strokeWidth={3} strokeLinecap="round" opacity={0.7} />
      <G transform={`translate(${-14 * (1 - p)} ${6 * (1 - p)})`}>
        <G transform="translate(76 0) scale(-1 1)">
          <Cloud x={14} y={34} w={46} h={24} fill={k.soft} />
        </G>
        <Path d="M20 48 l6 -8 l5 9 l6 -9 l5 9 l6 -8" fill="none" stroke={RED} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </G>
      {/* right: pushing back, and it comes back bigger */}
      <Rect x={222} y={72} width={72} height={64} rx={32} fill="none" stroke={k.acc} strokeWidth={2.5} strokeDasharray="5 5" />
      <Bubble x={232} y={84} w={52} h={40} fill={k.soft} />
      <Path d="M242 112 l7 -12 l6 13 l7 -14 l6 13 l7 -10" fill="none" stroke={RED} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
      <G transform="rotate(6 186 152)">
        <Limb a={[196, 116]} b={[232, 106]} w={5} c={k.ink} />
        <Limb a={[196, 126]} b={[232, 120]} w={5} c={k.ink} />
        <Person x={186} y={152} fill={k.ink} face={k.bg} />
      </G>
      <Say x={84} y={184} s="Let it pass" fill={k.ink} />
      <Say x={214} y={184} s="Fought it" fill={k.ink} />
    </Frame>
  );
}

/* ---------- 5: just once, passing through ---------- */
function JustOnce({ k }: { k: Ink }) {
  const p = useGrow(300, 1500);
  return (
    <Frame label="A person stands calmly on the right side of the scene. A thought cloud that says Just once drifts past from left to right along a dashed path, already beyond the person's head. The words say: a thought passing through.">
      <Line x1={8} y1={156} x2={292} y2={156} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      <Path d="M12 100 Q70 44 130 66 T214 58" fill="none" stroke={k.acc} strokeWidth={3} strokeDasharray="6 7" strokeLinecap="round" />
      <Person x={162} y={156} fill={k.acc} face={k.bg} />
      <G transform={`translate(${-34 * (1 - p)} 0)`}>
        <Cloud x={220} y={38} w={72} h={32} fill={k.ink} />
        <Say x={256} y={59} s="Just once" fill={k.bg} size={13} />
      </G>
      <Say x={150} y={186} s="A thought passing through" fill={k.ink} />
    </Frame>
  );
}

/* ---------- 6: I am having the thought that ---------- */
function HavingThought({ k }: { k: Ink }) {
  const p = useGrow(500, 1400);
  return (
    <Frame label="A person stands on the ground holding up a small sign in front of their chest that reads: I am having the thought that. Just above and behind their head, a small thought cloud fades away.">
      <G opacity={0.6 - 0.3 * p}>
        <Cloud x={158} y={40} w={46} h={24} fill={k.soft} />
        <Path d="M166 56 l6 -8 l5 9 l6 -9 l5 9 l6 -8" fill="none" stroke={k.muted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </G>
      <Line x1={56} y1={170} x2={244} y2={170} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      <Person x={150} y={170} s={1.6} fill={k.acc} face={k.bg} />
      {/* arms out to hold the sign by its sides */}
      <Limb a={[126, 124]} b={[76, 132]} w={8} c={k.acc} />
      <Limb a={[76, 132]} b={[88, 150]} w={8} c={k.acc} />
      <Limb a={[174, 124]} b={[224, 132]} w={8} c={k.acc} />
      <Limb a={[224, 132]} b={[212, 150]} w={8} c={k.acc} />
      <Rect x={89} y={120} width={122} height={40} rx={5} fill={k.ink} />
      <Say x={150} y={137} s="I am having" fill={k.bg} size={13} />
      <Say x={150} y={153} s="the thought that…" fill={k.bg} size={13} />
      <Circle cx={90} cy={150} r={6.5} fill={k.acc} />
      <Circle cx={210} cy={150} r={6.5} fill={k.acc} />
    </Frame>
  );
}

/* ---------- 7: name it, then choose ---------- */
function NameChoose({ k }: { k: Ink }) {
  const p = useGrow(400, 1500);
  return (
    <Frame label="A person walks along a path over a gentle hill toward a small tree and a warm sun on the right. A thought cloud floats on the left, left behind. The words say: name it, then choose.">
      <Circle cx={228} cy={50} r={24} fill={GOLD} opacity={0.3} />
      <Circle cx={228} cy={50} r={14} fill={GOLD} />
      <Path d="M0 148 Q80 118 160 134 T300 112 L300 170 Q150 182 0 172 Z" fill={k.soft} opacity={0.4} />
      <Path d="M44 166 Q120 158 175 148 T262 132" fill="none" stroke={k.line} strokeWidth={8} strokeLinecap="round" />
      {/* the tree */}
      <Rect x={271} y={104} width={8} height={24} rx={3} fill={k.muted} />
      <Circle cx={275} cy={92} r={17} fill={LEAF} />
      {/* the thought, behind */}
      <G opacity={0.55 - 0.25 * p}>
        <Cloud x={20} y={78} w={50} h={26} fill={k.soft} />
        <Path d="M29 94 l6 -9 l5 10 l6 -10 l5 10 l6 -9" fill="none" stroke={k.muted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </G>
      {/* the person, walking toward it */}
      <Limb a={[121, 148]} b={[114, 157]} w={5} c={k.acc} />
      <Limb a={[131, 148]} b={[138, 156]} w={5} c={k.acc} />
      <Person x={125} y={150} s={0.85} fill={k.acc} face={k.bg} />
      <Say x={150} y={192} s="Name it. Then choose." fill={k.ink} />
    </Frame>
  );
}

export const SCENES_E5: Record<string, ComponentType<{ k: Ink }>> = {
  'l12-london-ask': LondonAsk,
  'l12-thought-cards': ThoughtCards,
  'l12-cannot-sort': CannotSort,
  'l12-let-pass': LetPass,
  'l12-just-once': JustOnce,
  'l12-having-thought': HavingThought,
  'l12-name-choose': NameChoose,
};
