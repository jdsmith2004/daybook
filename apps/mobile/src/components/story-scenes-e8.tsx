/* Scenes for lessons told as a story (see story-kit.tsx), part of story-scenes-e.tsx: lesson 12, "Learn from your own log". */
import { useEffect, useState, type ComponentType } from 'react';
import { Easing } from 'react-native';
import { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';

import { useAppear, useReducedMotion } from '@/lib/motion';

import { Frame, type Ink, Person, Say } from './story-kit';

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

const clamp = (n: number) => Math.max(0, Math.min(1, n));

/* a five-point star, centered */
const star = (cx: number, cy: number, r: number) => {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 === 0 ? r : r * 0.45;
    return `${(cx + rr * Math.cos(a)).toFixed(1)} ${(cy + rr * Math.sin(a)).toFixed(1)}`;
  });
  return `M${pts.join(' L')} Z`;
};

/* ---------- 1: always someone higher ---------- */
function LadderOthers({ k }: { k: Ink }) {
  const rungs = [28, 62, 96, 130, 164];
  return (
    <Frame label="A tall ladder that rises off the top of the picture. Several people stand on rungs high above. One person stands on a low rung, looking up at them.">
      <Line x1={10} y1={172} x2={290} y2={172} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      <Line x1={96} y1={172} x2={96} y2={0} stroke={k.line} strokeWidth={5} strokeLinecap="round" />
      <Line x1={204} y1={172} x2={204} y2={0} stroke={k.line} strokeWidth={5} strokeLinecap="round" />
      {rungs.map((y) => (
        <Line key={y} x1={96} y1={y} x2={204} y2={y} stroke={k.line} strokeWidth={4} strokeLinecap="round" />
      ))}
      <Person x={122} y={28} s={0.42} fill={k.muted} face={k.bg} />
      <Person x={176} y={28} s={0.42} fill={k.muted} face={k.bg} />
      <Person x={150} y={62} s={0.46} fill={k.muted} face={k.bg} />
      <Person x={176} y={96} s={0.5} fill={k.muted} face={k.bg} />
      <Person x={124} y={130} s={0.54} fill={k.muted} face={k.bg} />
      <Person x={150} y={164} s={0.7} fill={k.ink} face={k.bg} />
      <Say x={150} y={191} s="Always someone higher" fill={k.ink} />
    </Frame>
  );
}

/* ---------- 2: two selves ---------- */
function TwoSelves({ k }: { k: Ink }) {
  return (
    <Frame label="Two figures facing each other across a small gap. On the left, a smaller, faded figure labeled Yesterday. On the right, the same figure solid and warm, standing on one small step, labeled Today.">
      <Line x1={20} y1={160} x2={280} y2={160} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      <Rect x={164} y={148} width={52} height={12} rx={3} fill={k.soft} opacity={0.6} />
      <G opacity={0.45}>
        <Person x={110} y={160} s={1.1} fill={k.ink} face={k.bg} />
      </G>
      <G transform="translate(380 0) scale(-1 1)">
        <Person x={190} y={148} s={1.2} fill={k.acc} face={k.bg} />
      </G>
      <Say x={110} y={184} s="Yesterday" fill={k.ink} />
      <Say x={190} y={184} s="Today" fill={k.ink} />
    </Frame>
  );
}

/* ---------- 3: nothing to hide behind ---------- */
function MirrorYesterday({ k }: { k: Ink }) {
  return (
    <Frame label="A person stands in front of a tall mirror. The reflection is the same person, slightly faded. No one else is there.">
      <Line x1={20} y1={168} x2={280} y2={168} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      <Line x1={176} y1={156} x2={168} y2={168} stroke={k.line} strokeWidth={4} strokeLinecap="round" />
      <Line x1={214} y1={156} x2={222} y2={168} stroke={k.line} strokeWidth={4} strokeLinecap="round" />
      <Rect x={150} y={10} width={90} height={148} rx={16} fill={k.soft} fillOpacity={0.4} stroke={k.line} strokeWidth={5} />
      <Line x1={166} y1={46} x2={190} y2={22} stroke={k.ink} strokeWidth={3} strokeLinecap="round" opacity={0.3} />
      <Line x1={166} y1={64} x2={206} y2={26} stroke={k.ink} strokeWidth={3} strokeLinecap="round" opacity={0.2} />
      <G transform="translate(390 0) scale(-1 1)" opacity={0.5}>
        <Person x={195} y={154} s={1.5} fill={k.ink} face={k.bg} />
      </G>
      <Person x={96} y={168} s={1.5} fill={k.ink} face={k.bg} />
      <Say x={150} y={190} s="Nothing to hide behind" fill={k.ink} />
    </Frame>
  );
}

/* ---------- 4: the log, on the record ---------- */
function LogPages({ k }: { k: Ink }) {
  const rows = Array.from({ length: 7 }, (_, i) => i);
  const lenL = [58, 40, 52, 34, 56, 44, 50];
  const lenR = [44, 56, 36, 52, 42, 58, 38];
  return (
    <Frame label="An open notebook with one short line of writing for each day. Small marks in the margins show a few days: a warm dot, a red dot and a gold star.">
      <Rect x={32} y={26} width={236} height={142} rx={7} fill={k.line} />
      <Path d="M150 24 Q95 17 40 26 L40 160 Q95 153 150 162 Z" fill={k.ink} />
      <Path d="M150 24 Q205 17 260 26 L260 160 Q205 153 150 162 Z" fill={k.ink} />
      <Line x1={150} y1={24} x2={150} y2={162} stroke={k.line} strokeWidth={3} />
      {rows.map((i) => (
        <G key={i}>
          <Rect x={66} y={42 + i * 17} width={lenL[i]} height={4.5} rx={2.2} fill={k.bg} opacity={0.75} />
          <Rect x={176} y={42 + i * 17} width={lenR[i]} height={4.5} rx={2.2} fill={k.bg} opacity={0.75} />
        </G>
      ))}
      <Circle cx={54} cy={44} r={3.5} fill={k.acc} />
      <Circle cx={54} cy={78} r={3.5} fill={RED} />
      <Path d={star(54, 112, 5.5)} fill={GOLD} stroke={k.bg} strokeWidth={1} strokeLinejoin="round" />
      <Circle cx={164} cy={61} r={3.5} fill={k.acc} />
      <Circle cx={164} cy={95} r={3.5} fill={k.acc} />
      <Path d={star(164, 129, 5.5)} fill={GOLD} stroke={k.bg} strokeWidth={1} strokeLinejoin="round" />
      <Circle cx={164} cy={146} r={3.5} fill={RED} />
      <Say x={150} y={190} s="Last month, on the record" fill={k.ink} />
    </Frame>
  );
}

/* ---------- 5: a map, not a score ---------- */
function LogMap({ k }: { k: Ink }) {
  const hill = (x: number, base: number, w: number, h: number) =>
    `M${x} ${base} Q${x + w * 0.3} ${base - h * 1.15} ${x + w / 2} ${base - h} Q${x + w * 0.75} ${base - h * 1.1} ${x + w} ${base} Z`;
  return (
    <Frame label="A folded paper map with a dotted route across it. A few hills mark hard ground. A red cross sits where the route gets steep, and a gold dot labeled helped sits where something worked.">
      <Path d="M40 24 L113 18 L187 24 L260 18 L260 156 L187 162 L113 156 L40 162 Z" fill={k.ink} strokeLinejoin="round" />
      <Line x1={113} y1={18} x2={113} y2={156} stroke={k.line} strokeWidth={1.5} opacity={0.6} />
      <Line x1={187} y1={24} x2={187} y2={162} stroke={k.line} strokeWidth={1.5} opacity={0.6} />
      <Path d={hill(62, 108, 44, 16)} fill={k.soft} stroke={k.line} strokeWidth={1.2} />
      <Path d={hill(142, 116, 46, 20)} fill={k.soft} stroke={k.line} strokeWidth={1.2} />
      <Path d={hill(214, 102, 40, 22)} fill={k.soft} stroke={k.line} strokeWidth={1.2} />
      <Path
        d="M60 138 L96 128 L130 134 L168 124 L196 104 L212 78 L240 52"
        fill="none"
        stroke={k.acc}
        strokeWidth={3.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="0.5 7"
      />
      <Line x1={198} y1={85} x2={210} y2={97} stroke={RED} strokeWidth={3.4} strokeLinecap="round" />
      <Line x1={210} y1={85} x2={198} y2={97} stroke={RED} strokeWidth={3.4} strokeLinecap="round" />
      <Circle cx={130} cy={134} r={5} fill={GOLD} stroke={k.bg} strokeWidth={1.2} />
      <Say x={130} y={152} s="helped" fill={k.bg} size={12} />
      <Say x={150} y={190} s="A map, not a score" fill={k.ink} />
    </Frame>
  );
}

/* ---------- 6: small steps, kept up ---------- */
function SmallSteps({ k }: { k: Ink }) {
  const p = useGrow(300, 2200);
  const n = 14;
  const pitch = 19.5;
  const steps = Array.from({ length: n }, (_, i) => i);
  const topOf = (i: number) => 160 - i * 7;
  return (
    <Frame label="A long, gentle staircase of many small low steps rising from left to right. Faint footprints mark the earlier steps, and a small person stands near the top right.">
      {steps.map((i) => {
        const local = clamp(p * (n + 3) - i);
        const full = 170 - topOf(i);
        const h = full * local;
        const x = 14 + i * pitch;
        return (
          <G key={i} opacity={local > 0 ? 1 : 0}>
            <Rect x={x} y={170 - h} width={pitch + 0.4} height={h} fill={k.line} />
            <Rect x={x} y={170 - h} width={pitch + 0.4} height={Math.min(3, h)} fill={k.soft} />
          </G>
        );
      })}
      {[1, 3, 5, 7, 9, 11].map((i) => {
        const cx = 14 + i * pitch + pitch / 2;
        return (
          <G key={`f${i}`} opacity={clamp(p * (n + 3) - i - 1) * 0.4}>
            <Ellipse cx={cx - 3.5} cy={topOf(i) - 2} rx={2.6} ry={1.5} fill={k.ink} />
            <Ellipse cx={cx + 3.5} cy={topOf(i) - 2} rx={2.6} ry={1.5} fill={k.ink} />
          </G>
        );
      })}
      <G opacity={clamp((p - 0.7) / 0.3)}>
        <Person x={14 + 12 * pitch + pitch / 2} y={topOf(12)} s={0.55} fill={k.acc} face={k.bg} />
      </G>
      <Say x={150} y={192} s="Kept up, they add up" fill={k.ink} />
    </Frame>
  );
}

/* ---------- 7: once a week, sit down with yourself ---------- */
function WeeklyRead({ k }: { k: Ink }) {
  return (
    <Frame label="A person sits at a small table with an open notebook in front of them and a cup beside it. A small lamp throws a warm glow. The mood is calm and reflective.">
      <Line x1={14} y1={166} x2={286} y2={166} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      <Ellipse cx={232} cy={102} rx={50} ry={40} fill={GOLD} opacity={0.1} />
      <Ellipse cx={232} cy={98} rx={30} ry={26} fill={GOLD} opacity={0.14} />
      {/* the chair */}
      <Line x1={62} y1={104} x2={62} y2={166} stroke={k.line} strokeWidth={5} strokeLinecap="round" />
      <Line x1={62} y1={146} x2={98} y2={146} stroke={k.line} strokeWidth={5} strokeLinecap="round" />
      {/* the person, sitting */}
      <Line x1={90} y1={134} x2={120} y2={134} stroke={k.ink} strokeWidth={10} strokeLinecap="round" />
      <Line x1={120} y1={134} x2={120} y2={162} stroke={k.ink} strokeWidth={9} strokeLinecap="round" />
      <Person x={88} y={140} s={1.1} fill={k.ink} face={k.bg} />
      <Line x1={94} y1={116} x2={138} y2={113} stroke={k.ink} strokeWidth={6} strokeLinecap="round" />
      {/* the table */}
      <Rect x={128} y={118} width={126} height={6} rx={3} fill={k.line} />
      <Line x1={140} y1={124} x2={140} y2={166} stroke={k.line} strokeWidth={5} strokeLinecap="round" />
      <Line x1={244} y1={124} x2={244} y2={166} stroke={k.line} strokeWidth={5} strokeLinecap="round" />
      {/* the open notebook */}
      <Rect x={140} y={104} width={38} height={14} rx={2} fill={k.ink} />
      <Line x1={159} y1={104} x2={159} y2={118} stroke={k.line} strokeWidth={1.5} />
      <Line x1={145} y1={109} x2={155} y2={109} stroke={k.bg} strokeWidth={2} strokeLinecap="round" opacity={0.75} />
      <Line x1={145} y1={113} x2={153} y2={113} stroke={k.bg} strokeWidth={2} strokeLinecap="round" opacity={0.75} />
      <Line x1={163} y1={109} x2={173} y2={109} stroke={k.bg} strokeWidth={2} strokeLinecap="round" opacity={0.75} />
      <Line x1={163} y1={113} x2={171} y2={113} stroke={k.bg} strokeWidth={2} strokeLinecap="round" opacity={0.75} />
      {/* the cup, with steam */}
      <Rect x={190} y={104} width={14} height={14} rx={3} fill={k.soft} />
      <Path d="M204 107 Q211 108 210 112 Q209 116 204 115" fill="none" stroke={k.soft} strokeWidth={2.2} strokeLinecap="round" />
      <Path d="M194 99 Q191 95 194 91 M200 99 Q197 95 200 91" fill="none" stroke={k.muted} strokeWidth={1.8} strokeLinecap="round" opacity={0.7} />
      {/* the lamp */}
      <Rect x={222} y={114} width={20} height={4} rx={2} fill={k.muted} />
      <Line x1={232} y1={114} x2={232} y2={84} stroke={k.muted} strokeWidth={3} strokeLinecap="round" />
      <Path d="M220 88 L244 88 L238 74 L226 74 Z" fill={k.muted} />
      <Circle cx={232} cy={92} r={4.5} fill={GOLD} />
      <Say x={150} y={190} s="Once a week" fill={k.ink} />
    </Frame>
  );
}

export const SCENES_E8: Record<string, ComponentType<{ k: Ink }>> = {
  'l12-ladder-others': LadderOthers,
  'l12-two-selves': TwoSelves,
  'l12-mirror-yesterday': MirrorYesterday,
  'l12-log-pages': LogPages,
  'l12-map': LogMap,
  'l12-small-steps': SmallSteps,
  'l12-weekly-read': WeeklyRead,
};
