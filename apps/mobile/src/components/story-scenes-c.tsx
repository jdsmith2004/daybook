/* Scenes for lessons told as a story (see story-kit.tsx): lessons 7 to 10. Secrets are heavy, wanting to be loved, if this then that,
   and one move for the phone. Flat shapes in the lesson's own colors, 300 by 200, one or two short lines of words at most. */
import { useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { Easing } from 'react-native';
import { Circle, G, Line, Path, Rect } from 'react-native-svg';

import { useAppear, useReducedMotion } from '@/lib/motion';

import { BEAR_LINE, Cloud, Frame, type Ink, Person, Say } from './story-kit';

const GOLD = '#FFD25A';
const WHITE = '#FFFFFF';
const clamp = (n: number) => Math.min(1, Math.max(0, n));

/* a number that runs from 0 to 1 once (already 1 with Reduce Motion on) */
function useProgress(delay: number, duration: number, easing = Easing.linear) {
  const still = useReducedMotion();
  const v = useAppear(delay, duration, easing);
  const [p, setP] = useState(still ? 1 : 0);
  useEffect(() => {
    const id = v.addListener(({ value }) => setP(value));
    return () => v.removeListener(id);
  }, [v]);
  return p;
}

/* a person turned to face left, in place */
function FaceLeft({ x, children }: { x: number; children: ReactNode }) {
  return <G transform={`translate(${2 * x} 0) scale(-1 1)`}>{children}</G>;
}

/* a small lock, centered on 0,0 */
function Lock({ x, y, s = 1, fill, plate }: { x: number; y: number; s?: number; fill: string; plate?: string }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Path d="M-3.5 -1 V-4 Q-3.5 -8.5 0 -8.5 Q3.5 -8.5 3.5 -4 V-1" fill="none" stroke={fill} strokeWidth={1.8} strokeLinecap="round" />
      <Rect x={-5.5} y={-1} width={11} height={9} rx={2.2} fill={fill} />
      {plate ? <Circle cx={0} cy={3} r={1.5} fill={plate} /> : null}
    </G>
  );
}

/* ---------- lesson 7: secrets are heavy ---------- */
function SecretBox({ k }: { k: Ink }) {
  return (
    <Frame label="A person holding a small locked box close to their chest">
      <Rect x={66} y={14} width={168} height={152} rx={24} fill={k.soft} opacity={0.5} />
      <Line x1={40} y1={162} x2={260} y2={162} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      <Person x={150} y={162} s={1.5} fill={k.ink} face={k.bg} />
      <Rect x={134} y={122} width={32} height={26} rx={5} fill={k.acc} />
      <Path d="M144 122 V116 Q144 108 150 108 Q156 108 156 116 V122" fill="none" stroke={GOLD} strokeWidth={3} strokeLinecap="round" />
      <Rect x={145} y={130} width={10} height={9} rx={2} fill={GOLD} />
      <Circle cx={150} cy={134} r={1.6} fill={BEAR_LINE} />
      <Line x1={127} y1={121} x2={137} y2={142} stroke={k.ink} strokeWidth={8} strokeLinecap="round" />
      <Line x1={173} y1={121} x2={163} y2={142} stroke={k.ink} strokeWidth={8} strokeLinecap="round" />
      <Say x={150} y={190} s="A secret, kept" fill={k.muted} />
    </Frame>
  );
}

function MindReturns({ k }: { k: Ink }) {
  const p = useProgress(400, 2800);
  const clouds = [
    { x: 40, y: 46 },
    { x: 80, y: 28 },
    { x: 120, y: 50 },
    { x: 160, y: 28 },
    { x: 200, y: 48 },
  ];
  const ask = clamp(p / 0.1);
  return (
    <Frame label="A person walks along a road through a day. Above them a small locked thought comes back again and again. Only once does someone stop to ask.">
      <Rect x={0} y={150} width={300} height={8} fill={k.line} />
      {[20, 80, 140, 200, 260].map((x) => (
        <Line key={x} x1={x} y1={154} x2={x + 22} y2={154} stroke={k.bg} strokeWidth={2} strokeLinecap="round" />
      ))}
      <Person x={84} y={148} s={1} fill={k.ink} face={k.bg} />
      <Line x1={46} y1={126} x2={58} y2={126} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      <Line x1={40} y1={138} x2={54} y2={138} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      <Circle cx={90} cy={82} r={3} fill={k.soft} />
      <Circle cx={94} cy={72} r={4.5} fill={k.soft} />
      {clouds.map((c, i) => {
        const t = clamp((p - 0.12 - i * 0.16) / 0.1);
        const s = 0.4 + 0.6 * t;
        return (
          <G key={i} opacity={t} transform={`translate(${c.x} ${c.y}) scale(${s})`}>
            <Circle cx={-10} cy={3} r={10} fill={k.soft} />
            <Circle cx={9} cy={3} r={11} fill={k.soft} />
            <Circle cx={0} cy={-5} r={11} fill={k.soft} />
            <Rect x={-12} y={-4} width={24} height={14} rx={7} fill={k.soft} />
            <Lock x={0} y={1} fill={k.ink} plate={k.soft} />
          </G>
        );
      })}
      <G opacity={ask} transform={`translate(0 ${(1 - ask) * 6})`}>
        <Rect x={190} y={72} width={94} height={26} rx={13} fill={WHITE} />
        <Path d="M240 96 L244 108 L254 96 Z" fill={WHITE} />
        <Say x={237} y={89} s="Are you okay?" fill={BEAR_LINE} size={12} />
      </G>
      <FaceLeft x={252}>
        <Person x={252} y={148} s={0.8} fill={k.acc} face={k.bg} />
      </FaceLeft>
      <Say x={150} y={184} s="Hidden once. Thought of again and again." fill={k.muted} size={12} />
    </Frame>
  );
}

function HeavyLoad({ k }: { k: Ink }) {
  return (
    <Frame label="One person bent under a big box, carrying it alone">
      <Line x1={40} y1={160} x2={260} y2={160} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      {[
        [182, 100],
        [192, 118],
      ].map(([x, y]) => (
        <Path key={x} d={`M${x} ${y - 7} Q${x + 5} ${y + 1} ${x} ${y + 4} Q${x - 5} ${y + 1} ${x} ${y - 7} Z`} fill={k.muted} opacity={0.6} />
      ))}
      <G transform="translate(140 160) rotate(10)">
        <Line x1={-20} y1={-34} x2={-34} y2={-60} stroke={k.ink} strokeWidth={8} strokeLinecap="round" />
        <Line x1={20} y1={-34} x2={34} y2={-60} stroke={k.ink} strokeWidth={8} strokeLinecap="round" />
        <G transform="scale(1 0.82)">
          <Person x={0} y={0} s={1.3} fill={k.ink} face={k.bg} />
        </G>
        <Rect x={-62} y={-124} width={124} height={66} rx={7} fill={k.acc} />
        <Rect x={-9} y={-124} width={18} height={66} fill={k.bg} opacity={0.3} />
        <Lock x={0} y={-92} s={1.5} fill={GOLD} plate={BEAR_LINE} />
      </G>
      <Say x={150} y={190} s="Carried alone" fill={k.muted} />
    </Frame>
  );
}

function TwoCarry({ k }: { k: Ink }) {
  return (
    <Frame label="Two people carrying the same box together, standing tall">
      <Line x1={30} y1={160} x2={270} y2={160} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      <Person x={92} y={160} s={1.1} fill={k.ink} face={k.bg} />
      <FaceLeft x={208}>
        <Person x={208} y={160} s={1.1} fill={k.ink} face={k.bg} />
      </FaceLeft>
      <Rect x={118} y={116} width={64} height={38} rx={6} fill={k.acc} />
      <Rect x={141} y={116} width={18} height={38} fill={k.bg} opacity={0.3} />
      <Lock x={150} y={132} s={1.2} fill={GOLD} plate={BEAR_LINE} />
      <Line x1={104} y1={126} x2={121} y2={142} stroke={k.ink} strokeWidth={7} strokeLinecap="round" />
      <Line x1={196} y1={126} x2={179} y2={142} stroke={k.ink} strokeWidth={7} strokeLinecap="round" />
      {[
        [132, 100],
        [150, 94],
        [168, 100],
      ].map(([x, y]) => (
        <Line key={x} x1={x} y1={y + 8} x2={x} y2={y} stroke={GOLD} strokeWidth={3} strokeLinecap="round" />
      ))}
      <Say x={150} y={190} s="Lighter with two" fill={k.muted} />
    </Frame>
  );
}

/* ---------- lesson 8: wanting to be loved ---------- */
function Sitter({ x, k, mirror }: { x: number; k: Ink; mirror?: boolean }) {
  const body = (
    <G>
      <Rect x={x - 24} y={98} width={6} height={50} rx={3} fill={k.muted} opacity={0.55} />
      <Rect x={x - 24} y={140} width={48} height={6} rx={3} fill={k.muted} opacity={0.55} />
      <Rect x={x - 21} y={146} width={5} height={18} rx={2} fill={k.muted} opacity={0.55} />
      <Rect x={x + 16} y={146} width={5} height={18} rx={2} fill={k.muted} opacity={0.55} />
      <Person x={x} y={140} s={1.2} fill={k.ink} face={k.bg} />
    </G>
  );
  return mirror ? <FaceLeft x={x}>{body}</FaceLeft> : body;
}
function TwoChairs({ k }: { k: Ink }) {
  return (
    <Frame label="Two strangers sit on chairs facing each other across a small table, with a card and a timer that reads 45 minutes">
      <Line x1={14} y1={164} x2={286} y2={164} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      <Sitter x={52} k={k} />
      <Sitter x={248} k={k} mirror />
      <Rect x={100} y={128} width={5} height={36} rx={2} fill={k.acc} />
      <Rect x={195} y={128} width={5} height={36} rx={2} fill={k.acc} />
      <Rect x={92} y={122} width={116} height={7} rx={3.5} fill={k.acc} />
      <G transform="rotate(-5 113 113)">
        <Rect x={100} y={104} width={26} height={18} rx={3} fill={WHITE} />
        <Line x1={105} y1={110} x2={121} y2={110} stroke="#C9C4E6" strokeWidth={2} strokeLinecap="round" />
        <Line x1={105} y1={116} x2={115} y2={116} stroke="#C9C4E6" strokeWidth={2} strokeLinecap="round" />
      </G>
      <Rect x={164} y={92} width={10} height={5} rx={2} fill={k.ink} />
      <Rect x={128} y={96} width={76} height={26} rx={13} fill={WHITE} />
      <Say x={166} y={113} s="45 minutes" fill={BEAR_LINE} size={12} />
      <Say x={150} y={190} s="Taking turns" fill={k.muted} />
    </Frame>
  );
}

function QuestionCards({ k }: { k: Ink }) {
  return (
    <Frame label="A fan of question cards that go from a light one, A perfect day, to a deeper one, Your most treasured memory">
      <Rect x={128} y={14} width={160} height={88} rx={12} fill={k.ink} />
      <Say x={208} y={42} s="Your most" fill={k.bg} size={15} />
      <Say x={208} y={62} s="treasured memory?" fill={k.bg} size={15} />
      <G transform="rotate(-2 128 96)">
        <Rect x={66} y={66} width={124} height={64} rx={11} fill={k.acc} />
        <Line x1={82} y1={86} x2={150} y2={86} stroke={k.bg} strokeWidth={3} strokeLinecap="round" opacity={0.5} />
        <Line x1={82} y1={98} x2={126} y2={98} stroke={k.bg} strokeWidth={3} strokeLinecap="round" opacity={0.5} />
      </G>
      <G transform="rotate(-4 73 140)">
        <Rect x={14} y={110} width={118} height={58} rx={10} fill={k.soft} />
        <Say x={73} y={144} s="A perfect day?" fill={k.ink} />
      </G>
    </Frame>
  );
}

function SmallTalk({ k }: { k: Ink }) {
  const p = useProgress(300, 1200, Easing.out(Easing.cubic));
  const base = 148;
  const bar = (x: number, h: number, c: string) => <Rect x={x} y={base - h * p} width={64} height={Math.max(0.1, h * p)} rx={9} fill={c} />;
  return (
    <Frame label="Two bars of how close the strangers felt. Small talk made them feel a little close. Taking turns and going deeper made them feel much closer.">
      <Line x1={30} y1={base} x2={270} y2={base} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      {bar(58, 26, k.line)}
      {bar(178, 108, k.acc)}
      <Say x={90} y={167} s="Small talk" fill={k.ink} size={12} />
      <Say x={210} y={167} s="Turns, going deeper" fill={k.acc} size={12} />
      <Say x={150} y={192} s="How close they felt" fill={k.muted} />
    </Frame>
  );
}

function Met({ k }: { k: Ink }) {
  return (
    <Frame label="Two people face each other with a warm gold light between them. One carries a small dark patch from their past, and the light reaches them anyway.">
      <Line x1={30} y1={162} x2={270} y2={162} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      <Person x={76} y={160} s={1.4} fill={k.acc} face={k.bg} />
      <Patch />
      <FaceLeft x={224}>
        <Person x={224} y={160} s={1.4} fill={k.ink} face={k.bg} />
      </FaceLeft>
      <Circle cx={150} cy={128} r={80} fill={GOLD} opacity={0.14} />
      <Circle cx={150} cy={128} r={54} fill={GOLD} opacity={0.2} />
      <Circle cx={150} cy={128} r={30} fill={GOLD} opacity={0.34} />
      {[
        [150, 84, 3],
        [126, 96, 2.2],
        [174, 94, 2.6],
      ].map(([x, y, r]) => (
        <Circle key={x} cx={x} cy={y} r={r} fill={GOLD} />
      ))}
      <Say x={150} y={190} s="Seen, and met" fill={k.muted} />
    </Frame>
  );
}
/* the dark patch on the body of the first person, their past */
function Patch() {
  return <Path d="M76 130 Q90 124 94 138 Q92 152 80 150 Q70 146 76 130 Z" fill={BEAR_LINE} opacity={0.85} />;
}

/* ---------- lesson 9: if this, then that ---------- */
function burst(cx: number, cy: number, n: number) {
  const pts: string[] = [];
  for (let i = 0; i < n * 2; i++) {
    const a = (Math.PI * i) / n;
    const r = i % 2 ? 40 : i % 4 === 0 ? 70 : 58;
    pts.push(`${(cx + Math.cos(a) * r).toFixed(1)} ${(cy + Math.sin(a) * r).toFixed(1)}`);
  }
  return `M${pts.join(' L')} Z`;
}
function Wish({ k }: { k: Ink }) {
  return (
    <Frame label="A small person thinks I will try harder, while a huge loud jagged urge towers over them">
      <Path d={burst(216, 94, 9)} fill={k.acc} />
      <Line x1={140} y1={40} x2={152} y2={50} stroke={k.acc} strokeWidth={4} strokeLinecap="round" />
      <Line x1={134} y1={90} x2={148} y2={90} stroke={k.acc} strokeWidth={4} strokeLinecap="round" />
      <Line x1={140} y1={140} x2={152} y2={132} stroke={k.acc} strokeWidth={4} strokeLinecap="round" />
      <Cloud x={8} y={22} w={128} h={36} fill={k.soft} />
      <Say x={72} y={45} s="I will try harder" fill={k.ink} size={12} />
      <Person x={60} y={164} s={1} fill={k.ink} face={k.bg} />
      <Say x={150} y={192} s="A wish has to win an argument" fill={k.muted} />
    </Frame>
  );
}

function IfThen({ k }: { k: Ink }) {
  return (
    <Frame label="If I feel the pull alone, then I stand up and leave">
      <Say x={24} y={20} s="IF" fill={k.muted} anchor="start" />
      <Rect x={20} y={26} width={260} height={48} rx={14} fill={k.soft} />
      <Say x={150} y={57} s="I feel the pull alone" fill={k.ink} size={17} />
      <Path d="M150 80 L150 104" stroke={k.acc} strokeWidth={4} strokeLinecap="round" />
      <Path d="M141 96 L150 106 L159 96" fill="none" stroke={k.acc} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
      <Say x={24} y={122} s="THEN" fill={k.acc} anchor="start" />
      <Rect x={20} y={128} width={260} height={48} rx={14} fill={k.acc} fillOpacity={0.3} stroke={k.acc} strokeWidth={3} />
      <Say x={150} y={159} s="I stand up and leave" fill={k.ink} size={17} />
    </Frame>
  );
}

function DecideAhead({ k }: { k: Ink }) {
  return (
    <Frame label="On the left, a calm person writes a plan on a note. On the right, the same person simply walks along a marked path and follows it.">
      <Line x1={14} y1={150} x2={124} y2={150} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      <Person x={50} y={150} s={1} fill={k.ink} face={k.bg} />
      <Line x1={62} y1={124} x2={84} y2={128} stroke={k.ink} strokeWidth={7} strokeLinecap="round" />
      <Rect x={80} y={106} width={36} height={28} rx={3} fill={WHITE} />
      <Line x1={86} y1={114} x2={108} y2={114} stroke="#C9C4E6" strokeWidth={2} strokeLinecap="round" />
      <Line x1={86} y1={121} x2={102} y2={121} stroke="#C9C4E6" strokeWidth={2} strokeLinecap="round" />
      <Line x1={100} y1={130} x2={112} y2={116} stroke={k.acc} strokeWidth={4} strokeLinecap="round" />
      <Path d="M98 102 Q162 28 226 86" fill="none" stroke={k.muted} strokeWidth={2.5} strokeDasharray="2 7" strokeLinecap="round" />
      <G transform="translate(226 86) rotate(40)">
        <Path d="M-9 -5 L1 0 L-9 5" fill="none" stroke={k.muted} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      </G>
      <Rect x={132} y={148} width={158} height={8} rx={4} fill={k.line} />
      {[152, 174, 196].map((x) => (
        <Circle key={x} cx={x} cy={152} r={3} fill={k.acc} />
      ))}
      <Line x1={280} y1={118} x2={280} y2={150} stroke={k.ink} strokeWidth={2.5} strokeLinecap="round" />
      <Path d="M280 118 L296 124 L280 131 Z" fill={k.acc} />
      <Person x={236} y={148} s={1} fill={k.ink} face={k.bg} />
      <Line x1={206} y1={124} x2={216} y2={124} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      <Line x1={202} y1={136} x2={214} y2={136} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      <Say x={150} y={186} s="Decided before. Followed now." fill={k.muted} />
    </Frame>
  );
}

function SmallThen({ k }: { k: Ink }) {
  return (
    <Frame label="Three small actions in a row: stand up, leave the room, message someone">
      <Line x1={10} y1={146} x2={290} y2={146} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      {/* stand up */}
      <Rect x={12} y={102} width={5} height={44} rx={2.5} fill={k.muted} opacity={0.55} />
      <Rect x={12} y={126} width={24} height={5} rx={2.5} fill={k.muted} opacity={0.55} />
      <Rect x={14} y={131} width={4} height={15} rx={2} fill={k.muted} opacity={0.55} />
      <Rect x={31} y={131} width={4} height={15} rx={2} fill={k.muted} opacity={0.55} />
      <Person x={52} y={146} s={0.95} fill={k.ink} face={k.bg} />
      <Path d="M84 124 L84 94 M76 102 L84 93 L92 102" fill="none" stroke={k.acc} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
      <Say x={48} y={170} s="Stand up" fill={k.ink} />
      {/* leave the room */}
      <Rect x={120} y={54} width={60} height={92} rx={4} fill={GOLD} opacity={0.4} />
      <Path d="M122 56 L158 64 L158 138 L122 146 Z" fill={k.acc} />
      <Circle cx={152} cy={102} r={3.5} fill={GOLD} />
      <Say x={150} y={170} s="Leave" fill={k.ink} />
      <Say x={150} y={188} s="the room" fill={k.ink} />
      {/* message someone */}
      <Rect x={214} y={84} width={72} height={46} rx={16} fill={k.soft} />
      <Path d="M232 126 L226 142 L248 128 Z" fill={k.soft} />
      {[236, 250, 264].map((x) => (
        <Circle key={x} cx={x} cy={107} r={3.5} fill={k.ink} />
      ))}
      <Say x={250} y={170} s="Message" fill={k.ink} />
      <Say x={250} y={188} s="someone" fill={k.ink} />
    </Frame>
  );
}

/* ---------- lesson 10: one move ---------- */
function MovePhone({ k }: { k: Ink }) {
  const p = useProgress(700, 1500, Easing.inOut(Easing.cubic));
  const P0 = { x: 62, y: 108 };
  const C = { x: 142, y: 14 };
  const P1 = { x: 222, y: 86 };
  const at = (t: number, a: number, c: number, b: number) => (1 - t) * (1 - t) * a + 2 * (1 - t) * t * c + t * t * b;
  const x = at(p, P0.x, C.x, P1.x);
  const y = at(p, P0.y, C.y, P1.y);
  const phone = (cx: number, cy: number, op = 1) => (
    <G opacity={op}>
      <Rect x={cx - 6} y={cy - 10} width={12} height={20} rx={3} fill={k.ink} />
      <Rect x={cx - 4} y={cy - 7} width={8} height={11} rx={1.5} fill={k.bg} opacity={0.35} />
    </G>
  );
  return (
    <Frame label="Two rooms side by side. A phone moves from the couch in the first room to a shelf in the second room.">
      <Rect x={10} y={30} width={130} height={132} rx={14} fill={k.soft} opacity={0.45} stroke={k.line} strokeWidth={3} />
      <Rect x={160} y={30} width={130} height={132} rx={14} fill={k.soft} opacity={0.45} stroke={k.line} strokeWidth={3} />
      <Line x1={14} y1={146} x2={136} y2={146} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      <Line x1={164} y1={146} x2={286} y2={146} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      {/* the couch */}
      <Rect x={24} y={104} width={76} height={26} rx={10} fill={k.acc} />
      <Rect x={22} y={118} width={80} height={26} rx={9} fill={k.acc} />
      <Rect x={28} y={140} width={5} height={6} fill={k.ink} />
      <Rect x={91} y={140} width={5} height={6} fill={k.ink} />
      {/* the shelf */}
      <Rect x={190} y={98} width={64} height={6} rx={3} fill={k.acc} />
      <Rect x={196} y={104} width={5} height={14} rx={2} fill={k.acc} />
      <Rect x={243} y={104} width={5} height={14} rx={2} fill={k.acc} />
      <Rect x={232} y={82} width={8} height={16} rx={2} fill={k.ink} opacity={0.7} />
      <Rect x={241} y={86} width={7} height={12} rx={2} fill={k.muted} opacity={0.7} />
      <Path d="M62 108 Q142 14 222 86" fill="none" stroke={k.muted} strokeWidth={2.5} strokeDasharray="2 7" strokeLinecap="round" />
      <G transform="translate(142 55.5) rotate(-8)">
        <Path d="M-6 -6 L3 0 L-6 6" fill="none" stroke={k.muted} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      </G>
      {phone(P0.x, P0.y, 0.25)}
      {phone(x, y)}
      <Say x={150} y={190} s="Move one thing" fill={k.muted} />
    </Frame>
  );
}

export const SCENES_C: Record<string, ComponentType<{ k: Ink }>> = {
  'secret-box': SecretBox,
  'mind-returns': MindReturns,
  'heavy-load': HeavyLoad,
  'two-carry': TwoCarry,
  'two-chairs': TwoChairs,
  'question-cards': QuestionCards,
  'small-talk': SmallTalk,
  met: Met,
  wish: Wish,
  'if-then': IfThen,
  'decide-ahead': DecideAhead,
  'small-then': SmallThen,
  'move-phone': MovePhone,
};
