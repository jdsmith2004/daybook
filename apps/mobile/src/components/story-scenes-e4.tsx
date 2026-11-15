/* Scenes for lessons told as a story (see story-kit.tsx), part of story-scenes-e.tsx: lesson 12, move your body. Flat shapes in the
   lesson's own colors, 300 by 200, one short line of words at most. */
import { useEffect, useState, type ComponentType } from 'react';
import { Easing } from 'react-native';
import { Circle, ClipPath, Defs, Ellipse, G, Line, Path, Rect } from 'react-native-svg';

import { useAppear, useReducedMotion } from '@/lib/motion';

import { Cloud, Frame, type Ink, Person, Say } from './story-kit';

const RED = '#C2410C';
const GOLD = '#FFD25A';
const CHOC = '#7A4A2A';
const FOIL = '#D9DCE0';
const LEAF = '#6BAA6B';
const SKY = '#FFF3D1';

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

/* a slow beat, 1 to 1.18 and back; still at 1 with Reduce Motion on */
function usePulse() {
  const still = useReducedMotion();
  const [big, setBig] = useState(false);
  useEffect(() => {
    if (still) return;
    const id = setInterval(() => setBig((b) => !b), 650);
    return () => clearInterval(id);
  }, [still]);
  return big && !still ? 1.18 : 1;
}

/* a half-round dial: the track, a filled stretch up to the level (0 empty, 1 full) and a needle */
function Dial({
  cx,
  cy,
  r,
  w,
  level,
  fill,
  ink,
  track,
}: {
  cx: number;
  cy: number;
  r: number;
  w: number;
  level: number;
  fill: string;
  ink: string;
  track: string;
}) {
  const th = Math.PI * (1 - level);
  const ex = cx + r * Math.cos(th);
  const ey = cy - r * Math.sin(th);
  const nx = cx + r * 0.78 * Math.cos(th);
  const ny = cy - r * 0.78 * Math.sin(th);
  return (
    <G>
      <Path d={`M${cx - r} ${cy} A${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke={track} strokeWidth={w} strokeLinecap="round" />
      {level > 0.02 ? <Path d={`M${cx - r} ${cy} A${r} ${r} 0 0 1 ${ex} ${ey}`} fill="none" stroke={fill} strokeWidth={w} strokeLinecap="round" /> : null}
      <Line x1={cx} y1={cy} x2={nx} y2={ny} stroke={ink} strokeWidth={w * 0.5} strokeLinecap="round" />
      <Circle cx={cx} cy={cy} r={w * 0.65} fill={ink} />
    </G>
  );
}

/* a chair seen from the side, its back on the left */
function Chair({ cx, floor, k }: { cx: number; floor: number; k: Ink }) {
  return (
    <G>
      <Rect x={cx - 30} y={floor - 66} width={7} height={46} rx={3} fill={k.line} />
      <Rect x={cx - 28} y={floor - 24} width={56} height={8} rx={4} fill={k.line} />
      <Rect x={cx - 22} y={floor - 16} width={5} height={16} rx={2} fill={k.line} />
      <Rect x={cx + 17} y={floor - 16} width={5} height={16} rx={2} fill={k.line} />
    </G>
  );
}

/* a small chocolate bar: a brown slab with a grid of squares */
function Bar({ x, y, w, h, k, cols = 3, rows = 2 }: { x: number; y: number; w: number; h: number; k: Ink; cols?: number; rows?: number }) {
  const vs = Array.from({ length: cols - 1 }, (_, i) => x + (w * (i + 1)) / cols);
  const hs = Array.from({ length: rows - 1 }, (_, i) => y + (h * (i + 1)) / rows);
  return (
    <G>
      <Rect x={x} y={y} width={w} height={h} rx={3} fill={CHOC} />
      {vs.map((vx, i) => (
        <Line key={`v${i}`} x1={vx} y1={y + 1} x2={vx} y2={y + h - 1} stroke={k.line} strokeWidth={1.2} />
      ))}
      {hs.map((hy, i) => (
        <Line key={`h${i}`} x1={x + 1} y1={hy} x2={x + w - 1} y2={hy} stroke={k.line} strokeWidth={1.2} />
      ))}
    </G>
  );
}

/* a limb: a thick round-ended line */
function Limb({ a, b, w = 7, c }: { a: [number, number]; b: [number, number]; w?: number; c: string }) {
  return <Line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={c} strokeWidth={w} strokeLinecap="round" />;
}

/* ---------- the chocolate study ---------- */
function ChocWalk({ k }: { k: Ink }) {
  return (
    <Frame label="Two rooms side by side. On the left, a person sits still in a chair. On the right, a person walks briskly on a treadmill. A chocolate bar floats between them.">
      <Rect x={8} y={30} width={134} height={130} rx={16} fill={k.soft} opacity={0.5} />
      <Rect x={158} y={30} width={134} height={130} rx={16} fill={k.soft} opacity={0.5} />
      <Line x1={8} y1={150} x2={142} y2={150} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      <Line x1={158} y1={150} x2={292} y2={150} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      <Chair cx={75} floor={150} k={k} />
      <Person x={75} y={126} s={1.1} fill={k.acc} />
      {/* the treadmill */}
      <Rect x={180} y={144} width={6} height={6} rx={2} fill={k.line} />
      <Rect x={250} y={144} width={6} height={6} rx={2} fill={k.line} />
      <Rect x={172} y={136} width={92} height={8} rx={4} fill={k.line} />
      <Line x1={270} y1={146} x2={270} y2={92} stroke={k.line} strokeWidth={4} strokeLinecap="round" />
      <Line x1={270} y1={92} x2={246} y2={92} stroke={k.line} strokeWidth={4} strokeLinecap="round" />
      {/* the walker */}
      <Limb a={[216, 104]} b={[207, 135]} c={k.ink} />
      <Limb a={[228, 104]} b={[238, 133]} c={k.ink} />
      <Person x={222} y={106} fill={k.ink} face={k.bg} />
      <Limb a={[232, 82]} b={[246, 92]} w={5} c={k.ink} />
      <Line x1={182} y1={84} x2={198} y2={84} stroke={k.acc} strokeWidth={3} strokeLinecap="round" />
      <Line x1={186} y1={96} x2={198} y2={96} stroke={k.acc} strokeWidth={3} strokeLinecap="round" />
      <Bar x={135} y={5} w={30} h={20} k={k} />
      <Say x={75} y={184} s="Sat still" fill={k.ink} />
      <Say x={225} y={184} s="Walked" fill={k.ink} />
    </Frame>
  );
}

/* ---------- hold it, do not eat it ---------- */
/* a left hand holding the end of the bar: a wrist running off the bottom, a rounded palm, a separate thumb over the front; angled in */
function Hand({ k }: { k: Ink }) {
  const edge = { fill: k.ink, stroke: k.line, strokeWidth: 1.5 };
  return (
    <G transform="rotate(10 88 150)">
      <Rect x={76} y={140} width={24} height={80} rx={10} {...edge} />
      <Rect x={72} y={98} width={32} height={56} rx={14} {...edge} />
      <G transform="rotate(-18 102 104)">
        <Rect x={94} y={88} width={16} height={36} rx={8} {...edge} />
      </G>
    </G>
  );
}

function Unwrap({ k }: { k: Ink }) {
  const smell = (x: number) => `M${x} 74 q-7 -9 0 -18 q7 -9 0 -18`;
  return (
    <Frame label="Two hands hold a chocolate bar with its wrapper peeled back halfway. Soft smell lines rise from it. The words say: hold it, do not eat it.">
      <Say x={150} y={20} s="Hold it. Do not eat it." fill={k.ink} />
      {[160, 176, 192].map((x, i) => (
        <Path key={i} d={smell(x)} fill="none" stroke={k.acc} strokeWidth={2.5} strokeLinecap="round" opacity={0.7 - i * 0.12} />
      ))}
      {/* the bar and its wrapper */}
      <Rect x={90} y={84} width={120} height={52} rx={6} fill={CHOC} />
      <Line x1={170} y1={86} x2={170} y2={134} stroke={k.line} strokeWidth={1.4} />
      <Line x1={190} y1={86} x2={190} y2={134} stroke={k.line} strokeWidth={1.4} />
      <Line x1={150} y1={110} x2={208} y2={110} stroke={k.line} strokeWidth={1.4} />
      <Path d="M90 84 L148 84 Q162 110 148 136 L90 136 Z" fill={k.acc} />
      <Path d="M148 84 Q162 110 148 136" fill="none" stroke={FOIL} strokeWidth={5} strokeLinecap="round" />
      <Path d="M150 84 Q172 88 174 104 Q162 98 150 110 Z" fill={k.acc} opacity={0.85} />
      {/* the hands: a mitten at each end, the thumb curling over the front */}
      <Hand k={k} />
      <G transform="translate(300 0) scale(-1 1)">
        <Hand k={k} />
      </G>
    </Frame>
  );
}

/* ---------- two gauges ---------- */
function TwoGauges({ k }: { k: Ink }) {
  const p = useGrow(350, 1300);
  const open = (x: number) => (
    <G>
      <Bar x={x - 22} y={152} w={44} h={22} k={k} />
      <Path d={`M${x - 22} 152 L${x - 8} 152 Q${x - 2} 163 ${x - 8} 174 L${x - 22} 174 Z`} fill={k.acc} />
      <Path d={`M${x - 8} 152 Q${x - 2} 163 ${x - 8} 174`} fill="none" stroke={FOIL} strokeWidth={2.5} strokeLinecap="round" />
    </G>
  );
  return (
    <Frame label="Two dials. After sitting, the needle points high toward the end. After the walk, the needle sits much lower. An open chocolate bar sits under each dial.">
      <Dial cx={75} cy={106} r={52} w={11} level={0.88 * p} fill={RED} ink={k.ink} track={k.soft} />
      <Dial cx={225} cy={106} r={52} w={11} level={0.3 * p} fill={k.acc} ink={k.ink} track={k.soft} />
      <Say x={75} y={138} s="After sitting" fill={k.ink} />
      <Say x={225} y={138} s="After the walk" fill={k.ink} />
      {open(75)}
      {open(225)}
    </Frame>
  );
}

/* ---------- the smoker's walk ---------- */
function SmokerWalk({ k }: { k: Ink }) {
  const p = useGrow(400, 1600);
  return (
    <Frame label="A park bench with a cigarette pack left on it. A person walks briskly away along a path. Behind them, a small craving cloud fades out.">
      <Rect x={96} y={156} width={200} height={10} rx={5} fill={k.soft} />
      <Line x1={8} y1={156} x2={96} y2={156} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      {/* the bench */}
      <Rect x={14} y={90} width={72} height={7} rx={3} fill={k.muted} />
      <Rect x={14} y={101} width={72} height={7} rx={3} fill={k.muted} />
      <Rect x={20} y={90} width={6} height={30} rx={3} fill={k.muted} />
      <Rect x={74} y={90} width={6} height={30} rx={3} fill={k.muted} />
      <Rect x={12} y={120} width={76} height={8} rx={4} fill={k.muted} />
      <Rect x={22} y={126} width={6} height={30} rx={2} fill={k.muted} />
      <Rect x={72} y={126} width={6} height={30} rx={2} fill={k.muted} />
      {/* the pack */}
      <Rect x={42} y={100} width={16} height={20} rx={2.5} fill={k.acc} />
      <Rect x={42} y={105} width={16} height={3} fill={k.bg} opacity={0.7} />
      {/* the craving cloud, thinning out */}
      <G opacity={0.5 - 0.28 * p}>
        <Cloud x={118} y={48} w={58} h={26} fill={k.muted} />
        <Path d="M128 62 q6 -10 12 0 t12 0 t12 0" fill="none" stroke={k.bg} strokeWidth={2.5} strokeLinecap="round" />
      </G>
      {/* the walker */}
      <Line x1={150} y1={98} x2={164} y2={98} stroke={k.acc} strokeWidth={3} strokeLinecap="round" />
      <Line x1={154} y1={110} x2={166} y2={110} stroke={k.acc} strokeWidth={3} strokeLinecap="round" />
      <G transform="rotate(6 200 124)">
        <Limb a={[192, 122]} b={[178, 154]} c={k.ink} />
        <Limb a={[208, 122]} b={[224, 152]} c={k.ink} />
        <Person x={200} y={124} fill={k.ink} face={k.bg} />
        <Limb a={[192, 98]} b={[182, 112]} w={5} c={k.ink} />
        <Limb a={[208, 98]} b={[220, 110]} w={5} c={k.ink} />
      </G>
    </Frame>
  );
}

/* ---------- the urge lives in the body ---------- */
const HEART = 'M0 8 C-12 -1 -8 -10 0 -4 C8 -10 12 -1 0 8 Z';
function BodySpots({ k }: { k: Ink }) {
  const beat = usePulse();
  const lead = { stroke: k.muted, strokeWidth: 1.5, strokeLinecap: 'round' as const };
  return (
    <Frame label="A person standing, large. Three spots glow on the body: the heart is beating, the chest is tight, and the legs are restless.">
      {/* legs, then the body */}
      <Rect x={130} y={128} width={16} height={58} rx={8} fill={k.ink} />
      <Rect x={154} y={128} width={16} height={58} rx={8} fill={k.ink} />
      <Person x={150} y={130} s={2} fill={k.ink} face={k.bg} />
      {/* the glow */}
      <Circle cx={160} cy={84} r={18} fill={GOLD} opacity={0.4} />
      <Ellipse cx={150} cy={106} rx={30} ry={14} fill={GOLD} opacity={0.25} />
      <Ellipse cx={150} cy={160} rx={24} ry={24} fill={GOLD} opacity={0.25} />
      {/* the heart */}
      <G transform={`translate(160 84) scale(${beat})`}>
        <Path d={HEART} fill={k.acc} />
      </G>
      {/* the chest, squeezed */}
      <Path d="M122 100 Q150 108 178 100" fill="none" stroke={GOLD} strokeWidth={3} strokeLinecap="round" />
      <Path d="M122 112 Q150 104 178 112" fill="none" stroke={GOLD} strokeWidth={3} strokeLinecap="round" />
      {/* the legs, restless */}
      <Line x1={180} y1={146} x2={192} y2={140} stroke={k.acc} strokeWidth={3} strokeLinecap="round" />
      <Line x1={182} y1={160} x2={196} y2={160} stroke={k.acc} strokeWidth={3} strokeLinecap="round" />
      <Line x1={180} y1={174} x2={192} y2={180} stroke={k.acc} strokeWidth={3} strokeLinecap="round" />
      {/* the words */}
      <Line x1={174} y1={84} x2={208} y2={84} {...lead} />
      <Say x={212} y={89} s="Heart" fill={k.ink} anchor="start" />
      <Line x1={120} y1={106} x2={88} y2={106} {...lead} />
      <Say x={84} y={111} s="Chest" fill={k.ink} anchor="end" />
      <Line x1={128} y1={162} x2={88} y2={162} {...lead} />
      <Say x={84} y={167} s="Legs" fill={k.ink} anchor="end" />
    </Frame>
  );
}

/* ---------- stand up ---------- */
function StandUp({ k }: { k: Ink }) {
  return (
    <Frame label="At a desk, an empty chair with a thought cloud full of scribbles above it, the argument left behind. A dashed path leads to a person mid-step, walking toward an open doorway.">
      <Line x1={8} y1={160} x2={292} y2={160} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      {/* the desk and the laptop */}
      <Ellipse cx={51} cy={92} rx={32} ry={16} fill={GOLD} opacity={0.25} />
      <Rect x={38} y={78} width={26} height={26} rx={3} fill={GOLD} />
      <Rect x={32} y={104} width={38} height={4} rx={2} fill={k.ink} />
      <Rect x={12} y={108} width={80} height={7} rx={3} fill={k.muted} />
      <Rect x={18} y={115} width={6} height={45} rx={2} fill={k.muted} />
      <Rect x={80} y={115} width={6} height={45} rx={2} fill={k.muted} />
      {/* the empty chair, its back on the right */}
      <Rect x={136} y={94} width={7} height={46} rx={3} fill={k.line} />
      <Rect x={92} y={136} width={52} height={8} rx={4} fill={k.line} />
      <Rect x={98} y={144} width={5} height={16} rx={2} fill={k.line} />
      <Rect x={134} y={144} width={5} height={16} rx={2} fill={k.line} />
      {/* the argument, left behind */}
      <Cloud x={96} y={12} w={76} h={36} fill={k.soft} />
      <Path d="M106 22 l8 8 l8 -8 l8 8 l8 -8 l8 8 l8 -8 l6 6" fill="none" stroke={k.muted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M108 40 l10 -6 l10 6 l10 -6 l10 6 l10 -6 l8 4" fill="none" stroke={k.muted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {/* the way out */}
      <Path d="M126 172 Q166 188 192 170" fill="none" stroke={k.acc} strokeWidth={3} strokeDasharray="6 7" strokeLinecap="round" />
      <Path d="M246 66 L234 72 L234 156 L246 160 Z" fill={k.line} />
      <Rect x={246} y={66} width={40} height={94} fill={GOLD} opacity={0.55} />
      <Rect x={246} y={66} width={40} height={94} fill="none" stroke={k.ink} strokeWidth={4} />
      {/* the person, mid-step */}
      <G transform="rotate(6 190 128)">
        <Limb a={[184, 126]} b={[174, 158]} c={k.ink} />
        <Limb a={[196, 126]} b={[210, 156]} c={k.ink} />
        <Person x={190} y={128} fill={k.ink} face={k.bg} />
        <Limb a={[198, 102]} b={[214, 110]} w={5} c={k.ink} />
        <Limb a={[182, 102]} b={[172, 114]} w={5} c={k.ink} />
      </G>
    </Frame>
  );
}

/* ---------- the door out ---------- */
function DoorOut({ k }: { k: Ink }) {
  const out = 'door-out-clip';
  return (
    <Frame label="A front door open from inside a dim room. Through it, a bright outside with a path, a tree, a sun and a small person walking. The words say: ten minutes out.">
      <Defs>
        <ClipPath id={out}>
          <Rect x={100} y={30} width={100} height={140} />
        </ClipPath>
      </Defs>
      <Rect x={4} y={4} width={292} height={192} rx={16} fill={k.line} opacity={0.55} />
      <Say x={150} y={21} s="Ten minutes out" fill={k.ink} />
      {/* the room, faint */}
      <Chair cx={52} floor={170} k={k} />
      <Rect x={238} y={112} width={34} height={26} rx={3} fill={k.muted} opacity={0.6} />
      <Rect x={252} y={138} width={6} height={4} fill={k.muted} opacity={0.6} />
      <Rect x={230} y={142} width={54} height={5} rx={2} fill={k.muted} opacity={0.6} />
      <Rect x={236} y={147} width={5} height={23} rx={2} fill={k.muted} opacity={0.6} />
      <Rect x={273} y={147} width={5} height={23} rx={2} fill={k.muted} opacity={0.6} />
      <Rect x={4} y={170} width={292} height={26} fill={k.line} opacity={0.5} />
      {/* outside */}
      <G clipPath={`url(#${out})`}>
        <Rect x={100} y={30} width={100} height={140} fill={SKY} />
        <Circle cx={176} cy={58} r={22} fill={GOLD} opacity={0.35} />
        <Circle cx={176} cy={58} r={12} fill={GOLD} />
        <Rect x={100} y={112} width={100} height={58} fill="#CFE6B8" />
        <Path d="M138 170 L162 170 L156 112 L144 112 Z" fill="#F1E2B5" />
        <Rect x={113} y={92} width={6} height={28} rx={2} fill={CHOC} />
        <Circle cx={116} cy={82} r={19} fill={LEAF} />
        <Limb a={[148, 140]} b={[145, 152]} w={3.5} c={k.ink} />
        <Limb a={[153, 140]} b={[157, 151]} w={3.5} c={k.ink} />
        <Person x={150} y={141} s={0.5} fill={k.ink} face={SKY} />
      </G>
      <Path d="M200 30 L228 40 L228 160 L200 170 Z" fill={k.muted} opacity={0.75} />
      <Rect x={100} y={30} width={100} height={140} fill="none" stroke={k.ink} strokeWidth={5} />
    </Frame>
  );
}

/* ---------- give the restlessness a job ---------- */
function Squats({ k }: { k: Ink }) {
  return (
    <Frame label="Three small moves in a row. A person squats with arms forward. A person climbs steps. A person walks past a tree outside.">
      <Line x1={8} y1={160} x2={292} y2={160} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      {/* a squat */}
      <Limb a={[52, 154]} b={[64, 134]} c={k.ink} />
      <Limb a={[64, 134]} b={[38, 128]} c={k.ink} />
      <Limb a={[38, 128]} b={[46, 102]} w={9} c={k.ink} />
      <Limb a={[46, 104]} b={[72, 106]} w={5} c={k.ink} />
      <Circle cx={50} cy={90} r={10} fill={k.ink} />
      {/* the stairs */}
      {[0, 1, 2, 3].map((i) => (
        <Rect key={i} x={118 + i * 20} y={160 - (i + 1) * 12} width={20} height={(i + 1) * 12} fill={k.line} />
      ))}
      <Limb a={[152, 106]} b={[146, 136]} c={k.ink} />
      <Limb a={[152, 106]} b={[166, 124]} c={k.ink} />
      <Limb a={[152, 106]} b={[158, 80]} w={9} c={k.ink} />
      <Limb a={[158, 84]} b={[170, 96]} w={5} c={k.ink} />
      <Limb a={[158, 84]} b={[148, 96]} w={5} c={k.ink} />
      <Circle cx={162} cy={68} r={10} fill={k.ink} />
      {/* a lap, past a tree */}
      <Rect x={268} y={108} width={8} height={52} rx={3} fill={CHOC} />
      <Circle cx={272} cy={92} r={22} fill={LEAF} />
      <Limb a={[222, 116]} b={[210, 157]} c={k.ink} />
      <Limb a={[222, 116]} b={[236, 156]} c={k.ink} />
      <Limb a={[222, 116]} b={[226, 88]} w={9} c={k.ink} />
      <Limb a={[226, 90]} b={[240, 102]} w={5} c={k.ink} />
      <Limb a={[226, 90]} b={[214, 102]} w={5} c={k.ink} />
      <Circle cx={230} cy={76} r={10} fill={k.ink} />
      <Say x={50} y={184} s="Squats" fill={k.ink} />
      <Say x={150} y={184} s="Stairs" fill={k.ink} />
      <Say x={250} y={184} s="A lap" fill={k.ink} />
    </Frame>
  );
}

export const SCENES_E4: Record<string, ComponentType<{ k: Ink }>> = {
  'l12-choc-walk': ChocWalk,
  'l12-unwrap': Unwrap,
  'l12-two-gauges': TwoGauges,
  'l12-smoker-walk': SmokerWalk,
  'l12-body-spots': BodySpots,
  'l12-stand-up': StandUp,
  'l12-door-out': DoorOut,
  'l12-squats': Squats,
};
