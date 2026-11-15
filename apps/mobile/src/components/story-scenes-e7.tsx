/* Scenes for lessons told as a story (see story-kit.tsx), part of story-scenes-e.tsx: lesson 12, thoughts that give permission. Flat shapes
   in the lesson's own colors, 300 by 200, one short line of words at most. */
import { useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { Easing } from 'react-native';
import { Circle, ClipPath, Defs, Ellipse, G, Line, Path, Rect } from 'react-native-svg';

import { useAppear, useReducedMotion } from '@/lib/motion';

import { BEAR_LINE, Frame, type Ink, Person, Say } from './story-kit';

const RED = '#C2410C';
const GOLD = '#FFD25A';

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

/* a photo card: a light slab with a face on it */
function Card({ x, y, w, h, k, children }: { x: number; y: number; w: number; h: number; k: Ink; children?: ReactNode }) {
  return (
    <G>
      <Rect x={x} y={y} width={w} height={h} rx={8} fill={k.ink} />
      {children}
    </G>
  );
}

/* a simple face, head and shoulders, centered on (cx, cy): short or long hair in a color, a head shape, and gold earrings if asked */
function Face({
  cx,
  cy,
  s = 1,
  long,
  ear,
  hair,
  rx = 18,
  ry = 18,
  k,
}: {
  cx: number;
  cy: number;
  s?: number;
  long?: boolean;
  ear?: boolean;
  hair?: string;
  rx?: number;
  ry?: number;
  k: Ink;
}) {
  const h = hair ?? k.acc;
  return (
    <G transform={`translate(${cx} ${cy}) scale(${s})`}>
      {long ? <Rect x={-23} y={-22} width={46} height={56} rx={21} fill={h} /> : null}
      <Path d="M-30 56 Q-30 20 0 20 Q30 20 30 56 Z" fill={k.bg} />
      <Rect x={-5} y={12} width={10} height={12} fill={k.bg} />
      <Ellipse cx={0} cy={0} rx={rx} ry={ry} fill={k.bg} />
      <Circle cx={-rx - 0.5} cy={3} r={3.2} fill={k.bg} />
      <Circle cx={rx + 0.5} cy={3} r={3.2} fill={k.bg} />
      {ear ? (
        <G>
          <Circle cx={-rx - 0.5} cy={11} r={4.5} fill={GOLD} />
          <Circle cx={rx + 0.5} cy={11} r={4.5} fill={GOLD} />
        </G>
      ) : null}
      <Path d="M-19 -1 Q-21 -26 0 -26 Q21 -26 19 -1 Q6 -15 -19 -1 Z" fill={h} />
      {long ? (
        <G>
          <Rect x={-25} y={-8} width={11} height={60} rx={5.5} fill={h} />
          <Rect x={14} y={-8} width={11} height={60} rx={5.5} fill={h} />
        </G>
      ) : null}
      <Circle cx={-6.5} cy={1} r={1.9} fill={k.ink} />
      <Circle cx={6.5} cy={1} r={1.9} fill={k.ink} />
      <Path d="M-5 9 Q0 13 5 9" fill="none" stroke={k.acc} strokeWidth={1.8} strokeLinecap="round" />
    </G>
  );
}

/* a mitten with a thumb, optionally an index finger, wrist coming in from the left; drawn as an edge pass then a fill pass so no seams show */
function Hand({
  k,
  finger,
  x,
  y,
  w,
  wrist,
}: {
  k: Ink;
  finger?: boolean;
  x: number;
  y: number;
  w: number;
  wrist: { x: number; y: number; w: number; h: number };
}) {
  const parts = (p: object) => (
    <G {...p}>
      <Rect x={wrist.x} y={wrist.y} width={wrist.w} height={wrist.h} rx={wrist.h / 2} />
      <Rect x={x} y={y} width={w} height={34} rx={14} />
      <G transform={`rotate(-14 ${x + w / 2} ${y})`}>
        <Rect x={x + w / 2 - 10} y={y - 9} width={24} height={12} rx={6} />
      </G>
      {finger ? <Rect x={x + w - 8} y={y - 28} width={9} height={34} rx={4.5} /> : null}
    </G>
  );
  return (
    <G>
      {parts({ fill: k.line, stroke: k.line, strokeWidth: 3.5 })}
      {parts({ fill: k.ink })}
    </G>
  );
}

/* ---------- which is more attractive ---------- */
function TwoPhotos({ k }: { k: Ink }) {
  return (
    <Frame label="Two photo cards held up side by side, one of a face with short red hair and one with long gold hair. A hand points up at the one on the left. The words say: which is more attractive?">
      <G transform="rotate(-2 98 68)">
        <Rect x={94} y={112} width={8} height={26} rx={4} fill={k.line} />
        <Card x={58} y={20} w={80} h={96} k={k}>
          <Face cx={98} cy={58} s={1.05} hair={RED} rx={19.5} ry={17} k={k} />
        </Card>
      </G>
      <G transform="rotate(2 202 68)">
        <Rect x={198} y={112} width={8} height={26} rx={4} fill={k.line} />
        <Card x={162} y={20} w={80} h={96} k={k}>
          <Face cx={202} cy={56} s={1.05} long hair={GOLD} rx={16} ry={19} k={k} />
        </Card>
      </G>
      {/* the pointing hand, coming up from below on the left */}
      <G transform="rotate(18 40 170)">
        <Hand k={k} finger x={22} y={136} w={36} wrist={{ x: 29, y: 160, w: 22, h: 34 }} />
      </G>
      <Say x={150} y={190} s="Which is more attractive?" fill={k.ink} />
    </Frame>
  );
}

/* ---------- the swap ---------- */
function Swap({ k }: { k: Ink }) {
  return (
    <Frame label="A hand slides a face-down card across a table to the right, with motion lines behind it. The edge of a second card peeks out from under it, and a small curved arrow shows the two cards swapping.">
      {/* the table */}
      <Rect x={16} y={108} width={268} height={62} rx={10} fill={k.soft} opacity={0.5} />
      <Line x1={16} y1={170} x2={284} y2={170} stroke={k.line} strokeWidth={4} strokeLinecap="round" />
      <Rect x={34} y={172} width={6} height={20} rx={2} fill={k.line} />
      <Rect x={260} y={172} width={6} height={20} rx={2} fill={k.line} />
      {/* the card underneath, peeking out */}
      <G transform="rotate(7 199 146)">
        <Rect x={176} y={116} width={46} height={60} rx={5} fill={k.muted} />
      </G>
      {/* the face-down card */}
      <G transform="rotate(-4 191 138)">
        <Rect x={168} y={108} width={46} height={60} rx={5} fill={k.acc} />
        <Path d="M191 126 L201 138 L191 150 L181 138 Z" fill={k.bg} />
      </G>
      {/* the hand pushing it, and the lines of its motion */}
      <Hand k={k} x={124} y={128} w={50} wrist={{ x: -10, y: 134, w: 144, h: 16 }} />
      <Line x1={96} y1={112} x2={122} y2={112} stroke={k.acc} strokeWidth={3} strokeLinecap="round" />
      <Line x1={80} y1={122} x2={108} y2={122} stroke={k.acc} strokeWidth={3} strokeLinecap="round" />
      <Line x1={96} y1={162} x2={122} y2={162} stroke={k.acc} strokeWidth={3} strokeLinecap="round" />
      {/* the swap */}
      <Path d="M112 86 Q150 46 188 86" fill="none" stroke={k.acc} strokeWidth={3} strokeLinecap="round" />
      <Path d="M178.2 83 L188 86 L185.4 76" fill="none" stroke={k.acc} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M121.8 83 L112 86 L114.6 76" fill="none" stroke={k.acc} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
    </Frame>
  );
}

/* ---------- the earrings ---------- */
function Earrings({ k }: { k: Ink }) {
  return (
    <Frame label="A person holds up a photo of a face with no earrings and says: I like her earrings. Off to the side, faint and dashed, is the other face, the one that wore two gold earrings.">
      <Line x1={8} y1={172} x2={292} y2={172} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      {/* what is said */}
      <Rect x={20} y={28} width={144} height={34} rx={12} fill={k.ink} />
      <Path d="M48 61 L66 61 L58 90 Z" fill={k.ink} />
      <Say x={92} y={50} s="I like her earrings" fill={k.bg} />
      {/* the person and the picked card */}
      <Person x={62} y={172} s={1.2} fill={k.ink} face={k.bg} />
      <Limb a={[78, 148]} b={[108, 140]} w={6} c={k.ink} />
      <Card x={106} y={86} w={56} h={66} k={k}>
        <Face cx={134} cy={112} s={0.7} long k={k} />
      </Card>
      {/* the other face, faint */}
      <G opacity={0.4}>
        <Rect x={207} y={95} width={60} height={66} rx={10} fill="none" stroke={k.ink} strokeWidth={2} strokeDasharray="4 4" />
        <Card x={212} y={100} w={50} h={56} k={k}>
          <Face cx={237} cy={120} s={0.6} ear k={k} />
        </Card>
      </G>
    </Frame>
  );
}

/* ---------- the jam jars ---------- */
function JamJars({ k }: { k: Ink }) {
  const tag = (cx: number, s: string) => (
    <G>
      <Rect x={cx - 30} y={118} width={60} height={18} rx={4} fill={k.ink} />
      <Say x={cx} y={131} s={s} fill={k.bg} size={12} />
    </G>
  );
  const shine = (cx: number) => <Rect x={cx - 26} y={108} width={4} height={26} rx={2} fill="#FFFFFF" opacity={0.25} />;
  const stripes = Array.from({ length: 8 }, (_, i) => i);
  return (
    <Frame label="A small tasting stand with a striped awning. Two open jam jars: a red-orange one tagged apple and a gold one tagged grapefruit. A third jar with a lid holds jam split half and half, the trick jar. A small spoon leans between. The words say: two jams, one trick jar.">
      <Defs>
        <ClipPath id="jam-trick">
          <Rect x={201} y={102} width={66} height={48} rx={9} />
        </ClipPath>
      </Defs>
      {/* the awning, the poles and the table */}
      <Line x1={22} y1={40} x2={22} y2={150} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      <Line x1={278} y1={40} x2={278} y2={150} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      {stripes.map((i) => {
        const x = 14 + i * 34;
        const fill = i % 2 === 0 ? k.acc : k.soft;
        const o = i % 2 === 0 ? 1 : 0.5;
        return (
          <G key={i}>
            <Rect x={x} y={20} width={34} height={20} fill={fill} opacity={o} />
            <Path d={`M${x} 40 L${x + 34} 40 A17 11 0 0 1 ${x} 40 Z`} fill={fill} opacity={o} />
          </G>
        );
      })}
      <Line x1={12} y1={150} x2={288} y2={150} stroke={k.line} strokeWidth={4} strokeLinecap="round" />
      <Rect x={40} y={152} width={6} height={22} rx={2} fill={k.line} />
      <Rect x={254} y={152} width={6} height={22} rx={2} fill={k.line} />
      {/* the apple jar, open */}
      <Rect x={33} y={102} width={66} height={48} rx={9} fill={RED} />
      <Rect x={36} y={97} width={60} height={6} rx={3} fill={k.line} />
      {shine(66)}
      {tag(66, 'apple')}
      {/* the grapefruit jar, open */}
      <Rect x={117} y={102} width={66} height={48} rx={9} fill={GOLD} />
      <Rect x={120} y={97} width={60} height={6} rx={3} fill={k.line} />
      {shine(150)}
      {tag(150, 'grapefruit')}
      {/* the trick jar, with its lid: half and half */}
      <Rect x={201} y={102} width={66} height={48} rx={9} fill={GOLD} />
      <G clipPath="url(#jam-trick)">
        <Rect x={201} y={102} width={33} height={48} fill={RED} />
      </G>
      <Line x1={234} y1={102} x2={234} y2={150} stroke={k.ink} strokeWidth={2} />
      {shine(234)}
      <Rect x={203} y={92} width={62} height={11} rx={4} fill={k.ink} />
      {/* the spoon */}
      <Limb a={[190, 142]} b={[196, 110]} w={3.5} c={k.ink} />
      <Ellipse cx={189} cy={144} rx={5.5} ry={4} fill={k.ink} />
      <Say x={150} y={190} s="Two jams, one trick jar" fill={k.ink} />
    </Frame>
  );
}

/* ---------- the reason comes after ---------- */
function ReasonWriter({ k }: { k: Ink }) {
  const p = useGrow(500, 1500);
  const ribbon = 'M200 119 Q192 122 192 132 Q190 156 160 158 Q120 160 76 156';
  const grown = 130 * p;
  return (
    <Frame label="A signpost already points right: the choice is made. After it, a small figure at a desk writes on a long paper scroll that unrolls across the ground toward the post. The words say: the reason comes after.">
      <Defs>
        <ClipPath id="scroll-grow">
          <Rect x={202 - grown} y={100} width={grown + 4} height={80} />
        </ClipPath>
      </Defs>
      <Line x1={8} y1={166} x2={292} y2={166} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      {/* the signpost, pointing right */}
      <Rect x={52} y={48} width={7} height={118} rx={3} fill={k.line} />
      <Path d="M30 48 L96 48 L110 60 L96 72 L30 72 Z" fill={k.acc} />
      {/* the scroll, unrolling toward the post */}
      <G clipPath="url(#scroll-grow)">
        <Path d={ribbon} fill="none" stroke={k.ink} strokeWidth={14} />
        <Path d={ribbon} fill="none" stroke={k.bg} strokeWidth={1.8} strokeDasharray="10 5 18 6 8 5" transform="translate(0 -3)" />
        <Path d={ribbon} fill="none" stroke={k.bg} strokeWidth={1.8} strokeDasharray="16 6 8 5 14 5" transform="translate(0 3)" />
      </G>
      {/* the writer at the desk */}
      <Person x={242} y={128} s={0.95} fill={k.ink} face={k.bg} />
      <Limb a={[229, 104]} b={[212, 120]} w={5} c={k.ink} />
      <Rect x={196} y={126} width={90} height={7} rx={3} fill={k.line} />
      <Rect x={202} y={133} width={6} height={33} rx={2} fill={k.line} />
      <Rect x={276} y={133} width={6} height={33} rx={2} fill={k.line} />
      <Circle cx={206} cy={118} r={7} fill={k.ink} />
      <Circle cx={206} cy={118} r={3} fill="none" stroke={k.bg} strokeWidth={1.5} />
      <Say x={150} y={190} s="The reason comes after" fill={k.ink} />
    </Frame>
  );
}

/* ---------- the calm voice ---------- */
function CalmVoice({ k }: { k: Ink }) {
  return (
    <Frame label="A person sits on a couch that tilts slightly toward a small glowing phone at the edge. A calm, smiling cloud at their shoulder says: you earned this.">
      <Line x1={8} y1={160} x2={292} y2={160} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      {/* the glowing phone */}
      <Circle cx={259} cy={132} r={36} fill={k.acc} opacity={0.16} />
      <Circle cx={259} cy={132} r={23} fill={k.acc} opacity={0.22} />
      <Rect x={238} y={150} width={46} height={5} rx={2} fill={k.line} />
      <Rect x={258} y={155} width={5} height={5} fill={k.line} />
      <G transform="rotate(-8 259 150)">
        <Rect x={249} y={116} width={20} height={34} rx={4} fill={k.ink} />
        <Rect x={252} y={120} width={14} height={24} rx={2} fill={k.acc} />
      </G>
      {/* the couch and the person, tilting toward the phone */}
      <G transform="rotate(3 100 160)">
        <Rect x={36} y={88} width={124} height={44} rx={12} fill={k.line} />
        <Rect x={30} y={124} width={142} height={28} rx={9} fill={k.line} />
        <Rect x={26} y={104} width={16} height={48} rx={8} fill={k.line} />
        <Rect x={158} y={104} width={16} height={48} rx={8} fill={k.line} />
        <Rect x={40} y={150} width={8} height={10} rx={2} fill={k.line} />
        <Rect x={152} y={150} width={8} height={10} rx={2} fill={k.line} />
        <Limb a={[84, 118]} b={[92, 88]} w={24} c={k.ink} />
        <Circle cx={95} cy={76} r={11} fill={k.ink} />
        <Circle cx={99} cy={75} r={1.8} fill={k.bg} />
        <Limb a={[84, 118]} b={[124, 118]} w={11} c={k.ink} />
        <Limb a={[124, 118]} b={[128, 154]} w={10} c={k.ink} />
        <Limb a={[128, 156]} b={[138, 156]} w={6} c={k.ink} />
        <Limb a={[92, 100]} b={[112, 114]} w={6} c={k.ink} />
      </G>
      {/* the calm cloud at the shoulder */}
      <Circle cx={51} cy={57} r={12} fill={k.soft} />
      <Circle cx={66} cy={54} r={14} fill={k.soft} />
      <Rect x={36} y={58} width={46} height={17} rx={8.5} fill={k.soft} />
      <Path d="M49 65 q3 -3 6 0 M63 65 q3 -3 6 0" fill="none" stroke={BEAR_LINE} strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M52 69 q7 5 14 0" fill="none" stroke={BEAR_LINE} strokeWidth={1.8} strokeLinecap="round" />
      <Rect x={96} y={20} width={128} height={34} rx={12} fill={k.ink} />
      <Path d="M102 53 L116 53 L88 62 Z" fill={k.ink} />
      <Say x={160} y={42} s="You earned this" fill={k.bg} />
    </Frame>
  );
}

/* ---------- a reason, not a decision ---------- */
function NotDecision({ k }: { k: Ink }) {
  const scribble = (y: number, n: number) => `M182 ${y} q6 -8 12 0${' t12 0'.repeat(n - 1)}`;
  return (
    <Frame label="A person holds up one hand, palm out, toward a speech bubble that holds a reason, tagged: a reason. Next to the person is an empty checkbox labeled decision. The words say: a reason, not a decision.">
      <Line x1={8} y1={172} x2={292} y2={172} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      {/* the empty box */}
      <Say x={40} y={134} s="decision" fill={k.ink} />
      <Rect x={26} y={142} width={28} height={28} rx={5} fill="none" stroke={k.line} strokeWidth={3} />
      {/* the person, hand up */}
      <Person x={108} y={172} s={1.2} fill={k.ink} face={k.bg} />
      <Limb a={[122, 142]} b={[138, 128]} w={7} c={k.ink} />
      <Limb a={[138, 128]} b={[144, 112]} w={7} c={k.ink} />
      <Rect x={138} y={86} width={16} height={26} rx={7} fill={k.ink} />
      <Limb a={[139, 104]} b={[132, 96]} w={5} c={k.ink} />
      {/* the reason */}
      <Rect x={168} y={34} width={122} height={62} rx={14} fill={k.ink} />
      <Path d={scribble(66, 7)} fill="none" stroke={k.bg} strokeWidth={2.5} strokeLinecap="round" />
      <Path d={scribble(82, 5)} fill="none" stroke={k.bg} strokeWidth={2.5} strokeLinecap="round" />
      <Rect x={176} y={24} width={62} height={19} rx={9.5} fill={k.acc} />
      <Say x={207} y={37.5} s="a reason" fill={k.bg} size={12} />
      <Say x={150} y={190} s="A reason, not a decision" fill={k.ink} />
    </Frame>
  );
}

/* ---------- shoulds and wants ---------- */
function ShouldsWants({ k }: { k: Ink }) {
  const p = useGrow(500, 1400);
  const th = (16 * p * Math.PI) / 180;
  const L = 96;
  const cx = 150;
  const cy = 54;
  const lx = cx - L * Math.cos(th);
  const ly = cy + L * Math.sin(th);
  const rx = cx + L * Math.cos(th);
  const ry = cy - L * Math.sin(th);
  const drop = 36;
  const strings = (
    <G>
      <Line x1={0} y1={-drop} x2={-24} y2={0} stroke={k.line} strokeWidth={1.5} />
      <Line x1={0} y1={-drop} x2={24} y2={0} stroke={k.line} strokeWidth={1.5} />
      <Path d="M-27 0 L27 0 Q23 15 0 15 Q-23 15 -27 0 Z" fill={k.line} />
    </G>
  );
  return (
    <Frame label="A balance scale tipped heavily to one side. The left pan, labeled shoulds, is piled with a briefcase, a list and an envelope. The right pan, labeled wants, holds only one small cup and a tiny sun.">
      {/* the stand */}
      <Rect x={147} y={50} width={6} height={114} rx={3} fill={k.line} />
      <Rect x={120} y={160} width={60} height={8} rx={4} fill={k.line} />
      {/* the beam */}
      <Line x1={lx} y1={ly} x2={rx} y2={ry} stroke={k.line} strokeWidth={5} strokeLinecap="round" />
      <Circle cx={cx} cy={cy} r={5.5} fill={k.ink} />
      {/* the left pan: shoulds, piled high */}
      <G transform={`translate(${lx} ${ly + drop})`}>
        {strings}
        <Rect x={-22} y={-16} width={26} height={16} rx={3} fill={k.ink} />
        <Path d="M-14 -16 L-14 -20 Q-14 -22 -12 -22 L-4 -22 Q-2 -22 -2 -20 L-2 -16" fill="none" stroke={k.ink} strokeWidth={2} />
        <Line x1={-22} y1={-9} x2={4} y2={-9} stroke={k.bg} strokeWidth={1.5} />
        <Rect x={6} y={-13} width={22} height={13} rx={2} fill={k.ink} />
        <Path d="M6 -13 L17 -6 L28 -13" fill="none" stroke={k.bg} strokeWidth={1.5} strokeLinejoin="round" />
        <G transform="rotate(8 -2 -28)">
          <Rect x={-10} y={-40} width={16} height={22} rx={2} fill={k.ink} />
          <Line x1={-6} y1={-34} x2={2} y2={-34} stroke={k.bg} strokeWidth={1.5} strokeLinecap="round" />
          <Line x1={-6} y1={-29} x2={2} y2={-29} stroke={k.bg} strokeWidth={1.5} strokeLinecap="round" />
          <Line x1={-6} y1={-24} x2={0} y2={-24} stroke={k.bg} strokeWidth={1.5} strokeLinecap="round" />
        </G>
      </G>
      <Say x={lx} y={ly + drop + 34} s="Shoulds" fill={k.ink} />
      {/* the right pan: wants, almost empty */}
      <G transform={`translate(${rx} ${ry + drop})`}>
        {strings}
        <Path d="M-17 -13 L-3 -13 L-5 0 L-15 0 Z" fill={k.ink} />
        <Path d="M-3 -10 q6 0 5 5 q-1 4 -4 3" fill="none" stroke={k.ink} strokeWidth={2} strokeLinecap="round" />
        <Circle cx={13} cy={-7} r={5} fill={GOLD} />
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
          const a = (i * Math.PI) / 4;
          return (
            <Line
              key={i}
              x1={13 + 7 * Math.cos(a)}
              y1={-7 + 7 * Math.sin(a)}
              x2={13 + 9.5 * Math.cos(a)}
              y2={-7 + 9.5 * Math.sin(a)}
              stroke={GOLD}
              strokeWidth={1.5}
              strokeLinecap="round"
            />
          );
        })}
      </G>
      <Say x={rx} y={ry + drop + 34} s="Wants" fill={k.ink} />
    </Frame>
  );
}

export const SCENES_E7: Record<string, ComponentType<{ k: Ink }>> = {
  'l12-two-photos': TwoPhotos,
  'l12-swap': Swap,
  'l12-earrings': Earrings,
  'l12-jam-jars': JamJars,
  'l12-reason-writer': ReasonWriter,
  'l12-calm-voice': CalmVoice,
  'l12-not-decision': NotDecision,
  'l12-shoulds-wants': ShouldsWants,
};
