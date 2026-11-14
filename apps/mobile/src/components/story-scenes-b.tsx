/* Scenes for lessons told as a story (see story-kit.tsx): lessons 4, 5 and 6, and two extra cards for lessons 1 and 3. */
import { useEffect, useState, type ComponentType } from 'react';
import { Easing } from 'react-native';
import { Circle, ClipPath, Defs, Ellipse, G, Line, Path, Rect } from 'react-native-svg';

import { useAppear, useReducedMotion } from '@/lib/motion';

import { BEAR_LINE, Frame, type Ink, Person, Say } from './story-kit';

const RED = '#C2410C';
const GOLD = '#FFD25A';
const WHITE = '#FFFFFF';

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
  needle = 0.78,
  hub = 1,
}: {
  cx: number;
  cy: number;
  r: number;
  w: number;
  level: number;
  fill: string;
  ink: string;
  track: string;
  needle?: number;
  hub?: number;
}) {
  const th = Math.PI * (1 - level);
  const ex = cx + r * Math.cos(th);
  const ey = cy - r * Math.sin(th);
  const nx = cx + r * needle * Math.cos(th);
  const ny = cy - r * needle * Math.sin(th);
  return (
    <G>
      <Path d={`M${cx - r} ${cy} A${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke={track} strokeWidth={w} strokeLinecap="round" />
      <Path d={`M${cx - r} ${cy} A${r} ${r} 0 0 1 ${ex} ${ey}`} fill="none" stroke={fill} strokeWidth={w} strokeLinecap="round" />
      <Line x1={cx} y1={cy} x2={nx} y2={ny} stroke={ink} strokeWidth={w * 0.5} strokeLinecap="round" />
      <Circle cx={cx} cy={cy} r={w * 0.65 * hub} fill={ink} />
    </G>
  );
}

/* a speech bubble with a tail, a pale panel, a chair: small shared pieces */
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

/* ---------- lesson 4: when you are worn down ---------- */
function SleepLab({ k }: { k: Ink }) {
  return (
    <Frame label="Two people in a lab. On the left, one rests in a chair, asleep. On the right, one sits up wide awake under a lamp.">
      <Rect x={8} y={10} width={134} height={150} rx={16} fill={k.soft} opacity={0.5} />
      <Rect x={158} y={10} width={134} height={150} rx={16} fill={k.soft} opacity={0.5} />
      <Line x1={8} y1={160} x2={292} y2={160} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      <Chair cx={75} floor={160} k={k} />
      <G transform="rotate(14 75 136)">
        <Person x={75} y={136} s={1.1} fill={k.acc} />
      </G>
      <Say x={104} y={62} s="Zz" fill={k.acc} size={20} />
      <Say x={124} y={44} s="z" fill={k.acc} size={15} />
      <Chair cx={225} floor={160} k={k} />
      <Line x1={225} y1={10} x2={225} y2={28} stroke={k.ink} strokeWidth={3} />
      <Path d="M205 40 L209 28 L241 28 L245 40 Z" fill={k.ink} />
      <Path d="M207 42 L243 42 L262 132 L188 132 Z" fill={GOLD} opacity={0.3} />
      <Person x={225} y={136} s={1.1} fill={k.ink} face={k.bg} />
      <Say x={75} y={186} s="Slept" fill={k.ink} />
      <Say x={225} y={186} s="Kept awake" fill={k.ink} />
    </Frame>
  );
}

const HEAD = 'M-30 -4 Q-36 -44 -2 -46 Q34 -46 36 -14 L44 2 Q46 6 40 8 L36 8 Q38 20 28 22 L26 34 L-8 34 L-8 22 Q-30 16 -30 -4 Z';
function BrainGlow({ k }: { k: Ink }) {
  const p = useGrow(350, 1200);
  const rays = Array.from({ length: 8 }, (_, i) => (i * Math.PI) / 4);
  const gr = 8 + 17 * p;
  const rl = 3 + 11 * p;
  return (
    <Frame label="Two heads side by side, each with a spot for reward. After a night without sleep, the spot glows much bigger.">
      <G transform="translate(78 86) scale(1.3)">
        <Path d={HEAD} fill={k.soft} stroke={k.line} strokeWidth={2} />
        <Circle cx={-2} cy={-14} r={12} fill={GOLD} opacity={0.3} />
        <Circle cx={-2} cy={-14} r={6} fill={k.acc} />
      </G>
      <G transform="translate(214 86) scale(1.3)">
        <Path d={HEAD} fill={k.soft} stroke={k.line} strokeWidth={2} />
        <Circle cx={-2} cy={-14} r={gr} fill={GOLD} opacity={0.4} />
        <Circle cx={-2} cy={-14} r={gr * 0.62} fill={GOLD} opacity={0.6} />
        {rays.map((a, i) => (
          <Line
            key={i}
            x1={-2 + (gr + 3) * Math.cos(a)}
            y1={-14 + (gr + 3) * Math.sin(a)}
            x2={-2 + (gr + 3 + rl) * Math.cos(a)}
            y2={-14 + (gr + 3 + rl) * Math.sin(a)}
            stroke={GOLD}
            strokeWidth={3}
            strokeLinecap="round"
          />
        ))}
        <Circle cx={-2} cy={-14} r={6} fill={k.acc} />
      </G>
      <Say x={78} y={178} s="Slept" fill={k.ink} />
      <Say x={214} y={178} s="No sleep" fill={k.ink} />
    </Frame>
  );
}

function Tank({ k }: { k: Ink }) {
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  const drain = (x: number, y: number, s: string, x2: number, y2: number, x1: number, y1: number) => (
    <G>
      <Line x1={x1} y1={y1} x2={x2} y2={y2} stroke={k.muted} strokeWidth={2} strokeDasharray="3 5" strokeLinecap="round" />
      <Say x={x} y={y} s={s} fill={k.ink} />
    </G>
  );
  return (
    <Frame label="A big fuel gauge with the needle near empty, and four things draining it: tired, lonely, hungry and stressed.">
      <Dial cx={150} cy={120} r={70} w={12} level={0.07} fill="none" ink={k.ink} track={k.line} needle={0.8} hub={1.3} />
      <Path d="M80 120 A70 70 0 0 1 89.4 85" fill="none" stroke={RED} strokeWidth={12} strokeLinecap="round" />
      {ticks.map((t) => {
        const th = Math.PI * (1 - t);
        return (
          <Line
            key={t}
            x1={150 + 52 * Math.cos(th)}
            y1={120 - 52 * Math.sin(th)}
            x2={150 + 60 * Math.cos(th)}
            y2={120 - 60 * Math.sin(th)}
            stroke={k.muted}
            strokeWidth={2}
            strokeLinecap="round"
          />
        );
      })}
      <Say x={80} y={142} s="E" fill={RED} size={12} />
      <Say x={220} y={142} s="F" fill={k.muted} size={12} />
      {drain(44, 38, 'Tired', 96, 74, 64, 48)}
      {drain(256, 38, 'Lonely', 204, 74, 236, 48)}
      {drain(44, 160, 'Hungry', 90, 122, 62, 152)}
      {drain(256, 160, 'Stressed', 210, 122, 238, 152)}
      <Say x={150} y={192} s="One tank, many drains" fill={k.muted} />
    </Frame>
  );
}

function Speaker({ k }: { k: Ink }) {
  return (
    <Frame label="A person next to a huge loudspeaker, with big sound waves rolling out of it toward them">
      <Line x1={10} y1={166} x2={290} y2={166} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      {[24, 44, 64].map((r, i) => (
        <Path
          key={r}
          d={`M${168 - r * 0.64} ${100 - r * 0.77} A${r} ${r} 0 0 0 ${168 - r * 0.64} ${100 + r * 0.77}`}
          fill="none"
          stroke={k.acc}
          strokeWidth={6}
          strokeLinecap="round"
          opacity={1 - i * 0.25}
        />
      ))}
      <Rect x={170} y={44} width={74} height={122} rx={10} fill={k.ink} />
      <Circle cx={207} cy={112} r={28} fill={k.soft} />
      <Circle cx={207} cy={112} r={15} fill={k.acc} />
      <Circle cx={207} cy={66} r={9} fill={k.soft} />
      <Person x={62} y={166} s={1.4} fill={k.ink} face={k.bg} />
      <Say x={150} y={192} s="The same pull, louder" fill={k.muted} />
    </Frame>
  );
}

function PlanAhead({ k }: { k: Ink }) {
  return (
    <Frame label="A person writes a plan on a note while the fuel gauge is full. A dotted arrow points to a later, dimmer evening with the sun low.">
      <Line x1={10} y1={160} x2={178} y2={160} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      <Person x={40} y={160} s={1.1} fill={k.ink} face={k.bg} />
      <Line x1={52} y1={128} x2={72} y2={126} stroke={k.ink} strokeWidth={7} strokeLinecap="round" />
      <Rect x={70} y={108} width={46} height={40} rx={3} fill={WHITE} transform="rotate(-5 93 128)" />
      {[118, 127, 136].map((y) => (
        <Line key={y} x1={77} y1={y} x2={108} y2={y - 2} stroke={BEAR_LINE} strokeWidth={2} strokeLinecap="round" opacity={0.45} />
      ))}
      <Line x1={106} y1={116} x2={96} y2={134} stroke={GOLD} strokeWidth={4} strokeLinecap="round" />
      <Dial cx={148} cy={152} r={20} w={6} level={0.95} fill={k.acc} ink={k.ink} track={k.line} />
      <Path d="M120 100 Q155 56 190 96" fill="none" stroke={k.muted} strokeWidth={2.5} strokeDasharray="4 6" strokeLinecap="round" />
      <Path d="M182 90 L191 97 L180 101" fill="none" stroke={k.muted} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      <Rect x={198} y={40} width={94} height={120} rx={14} fill={k.soft} opacity={0.6} />
      <Circle cx={245} cy={132} r={15} fill={GOLD} />
      <Path d="M198 138 L292 138 L292 146 Q292 160 278 160 L212 160 Q198 160 198 146 Z" fill={k.ink} opacity={0.35} />
      {[
        [216, 62],
        [262, 56],
        [276, 82],
      ].map(([x, y]) => (
        <Circle key={x} cx={x} cy={y} r={2} fill={k.muted} />
      ))}
      <Say x={150} y={190} s="Plan it while the tank is full" fill={k.muted} />
    </Frame>
  );
}

/* ---------- lesson 5: name the act, not yourself ---------- */
function Bubble({ x, y, w, h, fill, stroke, tail }: { x: number; y: number; w: number; h: number; fill: string; stroke?: string; tail: string }) {
  return (
    <G>
      <Path d={tail} fill={fill} stroke={stroke} strokeWidth={stroke ? 3 : 0} strokeLinejoin="round" />
      <Rect x={x} y={y} width={w} height={h} rx={14} fill={fill} stroke={stroke} strokeWidth={stroke ? 3 : 0} />
      {stroke ? <Path d={tail} fill={fill} stroke="none" /> : null}
    </G>
  );
}
function TwoSentences({ k }: { k: Ink }) {
  return (
    <Frame label="One person with two sentences above them. “I did something wrong” is about an act. “I am something wrong” is a verdict on the self.">
      <Bubble x={12} y={16} w={130} h={56} fill={WHITE} stroke={k.acc} tail="M92 72 L132 72 L146 100 Z" />
      <Say x={77} y={40} s="I did something" fill={BEAR_LINE} />
      <Say x={77} y={59} s="wrong" fill={k.acc} size={17} />
      <Bubble x={158} y={16} w={130} h={56} fill={BEAR_LINE} tail="M168 72 L208 72 L154 100 Z" />
      <Say x={223} y={40} s="I am something" fill={WHITE} />
      <Say x={223} y={59} s="wrong" fill={WHITE} size={17} />
      <Person x={150} y={184} s={1.4} fill={k.ink} face={k.bg} />
    </Frame>
  );
}

function ActEdges({ k }: { k: Ink }) {
  return (
    <Frame label="A clear box with sharp edges, and a person working on it with a hammer. An act has edges.">
      <Line x1={10} y1={170} x2={290} y2={170} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      <Path d="M158 104 L180 84 L260 84 L238 104 Z" fill={k.line} stroke={k.ink} strokeWidth={2.5} strokeLinejoin="miter" />
      <Path d="M238 104 L260 84 L260 150 L238 170 Z" fill={k.line} stroke={k.ink} strokeWidth={2.5} strokeLinejoin="miter" opacity={0.8} />
      <Rect x={158} y={104} width={80} height={66} fill={k.soft} stroke={k.ink} strokeWidth={2.5} strokeLinejoin="miter" />
      <Path d="M158 120 L158 104 L174 104" fill="none" stroke={k.acc} strokeWidth={5} strokeLinejoin="miter" />
      <Path d="M222 104 L238 104 L238 120" fill="none" stroke={k.acc} strokeWidth={5} strokeLinejoin="miter" />
      <Path d="M158 154 L158 170 L174 170" fill="none" stroke={k.acc} strokeWidth={5} strokeLinejoin="miter" />
      <Path d="M222 170 L238 170 L238 154" fill="none" stroke={k.acc} strokeWidth={5} strokeLinejoin="miter" />
      <Person x={70} y={170} s={1.3} fill={k.ink} face={k.bg} />
      <Line x1={84} y1={134} x2={128} y2={106} stroke={k.ink} strokeWidth={6} strokeLinecap="round" />
      <Rect x={122} y={90} width={22} height={13} rx={3} fill={k.acc} transform="rotate(-30 133 96)" />
      <Say x={150} y={194} s="An act has edges" fill={k.muted} />
    </Frame>
  );
}

function ShameFog({ k }: { k: Ink }) {
  return (
    <Frame label="A person half hidden behind a wall, lost in a gray fog with no edges. A verdict has no edges.">
      <Defs>
        <ClipPath id="fogclip">
          <Rect x={0} y={0} width={300} height={176} />
        </ClipPath>
      </Defs>
      <Person x={140} y={170} s={1.4} fill={k.ink} face={k.bg} />
      <Rect x={140} y={96} width={86} height={74} rx={4} fill={k.line} />
      {[114, 132, 150].map((y) => (
        <Line key={y} x1={140} y1={y} x2={226} y2={y} stroke={k.bg} strokeWidth={2} opacity={0.6} />
      ))}
      {[158, 194].map((x) => (
        <Line key={x} x1={x} y1={96} x2={x} y2={114} stroke={k.bg} strokeWidth={2} opacity={0.6} />
      ))}
      <G clipPath="url(#fogclip)">
        {[
          [70, 120, 70, 40, 0.34],
          [210, 80, 80, 36, 0.34],
          [150, 140, 120, 34, 0.38],
          [60, 56, 60, 26, 0.28],
          [250, 140, 60, 30, 0.3],
          [140, 84, 70, 30, 0.34],
        ].map(([cx, cy, rx, ry, o], i) => (
          <G key={i}>
            <Ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={k.muted} opacity={o * 0.5} />
            <Ellipse cx={cx} cy={cy} rx={rx * 0.72} ry={ry * 0.72} fill={k.muted} opacity={o * 0.6} />
            <Ellipse cx={cx} cy={cy} rx={rx * 0.42} ry={ry * 0.42} fill={k.muted} opacity={o * 0.7} />
          </G>
        ))}
      </G>
      <Say x={150} y={194} s="A verdict has no edges" fill={k.muted} />
    </Frame>
  );
}

function Reoffend({ k }: { k: Ink }) {
  const p = useGrow(300, 1200);
  return (
    <Frame label="Two bars. People prone to guilt were arrested again less often than people prone to shame and blame, years later.">
      <Line x1={24} y1={140} x2={276} y2={140} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      <Rect x={60} y={140 - 34 * p} width={60} height={34 * p} rx={8} fill={k.acc} />
      <Rect x={180} y={140 - 96 * p} width={60} height={96 * p} rx={8} fill={k.ink} />
      <Say x={90} y={158} s="Prone to" fill={k.ink} size={12} />
      <Say x={90} y={172} s="guilt" fill={k.ink} size={12} />
      <Say x={210} y={158} s="Prone to shame" fill={k.ink} size={12} />
      <Say x={210} y={172} s="and blame" fill={k.ink} size={12} />
      <Say x={150} y={194} s="Arrested again, years later" fill={k.muted} />
    </Frame>
  );
}

function MeNotMe({ k }: { k: Ink }) {
  return (
    <Frame label="A person standing tall, holding out a small dark stone at arm's length. The stone is the act. It was me, but it is not me.">
      <Line x1={10} y1={178} x2={290} y2={178} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      <Person x={100} y={178} s={1.5} fill={k.ink} face={k.bg} />
      <Line x1={114} y1={142} x2={168} y2={136} stroke={k.ink} strokeWidth={8} strokeLinecap="round" />
      <Ellipse cx={186} cy={128} rx={17} ry={12} fill={BEAR_LINE} stroke={k.line} strokeWidth={2} />
      <Path d="M178 124 Q184 120 190 123" fill="none" stroke={k.muted} strokeWidth={2} strokeLinecap="round" />
      <Say x={186} y={100} s="the act" fill={k.ink} size={13} />
      <Line x1={186} y1={106} x2={186} y2={112} stroke={k.muted} strokeWidth={2} strokeLinecap="round" />
      <Say x={150} y={194} s="It was me, but it is not me" fill={k.muted} />
    </Frame>
  );
}

/* ---------- lesson 6: kindness after a slip ---------- */
function HardTest({ k }: { k: Ink }) {
  return (
    <Frame label="A test paper with a red cross beside every answer, and a pencil. It was made to be hard.">
      <G transform="rotate(-3 150 90)">
        <Rect x={82} y={12} width={136} height={158} rx={6} fill={WHITE} />
        <Rect x={96} y={24} width={50} height={7} rx={3.5} fill={BEAR_LINE} opacity={0.7} />
        {[56, 80, 104, 128, 152].map((y) => (
          <G key={y}>
            <Path d={`M98 ${y - 7} L110 ${y + 5} M110 ${y - 7} L98 ${y + 5}`} stroke={RED} strokeWidth={3.5} strokeLinecap="round" />
            <Line x1={124} y1={y - 1} x2={198} y2={y - 1} stroke={BEAR_LINE} strokeWidth={3} strokeLinecap="round" opacity={0.3} />
          </G>
        ))}
      </G>
      <G transform="translate(246 148) rotate(38)">
        <Rect x={-5} y={-58} width={10} height={6} rx={2} fill="#F7C6D0" />
        <Rect x={-5} y={-52} width={10} height={46} fill={GOLD} />
        <Path d="M-5 -6 L5 -6 L0 8 Z" fill="#E0A55A" />
        <Path d="M-2 2 L2 2 L0 8 Z" fill={BEAR_LINE} />
      </G>
      <Say x={150} y={194} s="Made to be hard" fill={k.muted} />
    </Frame>
  );
}

function ThreeNotes({ k }: { k: Ink }) {
  return (
    <Frame label="Three notes in a row: a kind one that says be kind to yourself, a praise one that says you must be smart, and a blank one.">
      <G transform="rotate(-3 51 96)">
        <Rect x={8} y={60} width={86} height={72} rx={8} fill={WHITE} stroke={k.acc} strokeWidth={4} />
        <Say x={51} y={92} s="Be kind" fill={BEAR_LINE} size={12} />
        <Say x={51} y={110} s="to yourself" fill={BEAR_LINE} size={12} />
      </G>
      <G transform="rotate(2 150 96)">
        <Rect x={107} y={60} width={86} height={72} rx={8} fill={k.ink} />
        <Say x={150} y={92} s="You must" fill={k.bg} size={12} />
        <Say x={150} y={110} s="be smart" fill={k.bg} size={12} />
      </G>
      <G transform="rotate(-2 249 96)">
        <Rect x={206} y={60} width={86} height={72} rx={8} fill={k.soft} stroke={k.line} strokeWidth={2.5} strokeDasharray="6 5" />
      </G>
      <Say x={51} y={160} s="Kind" fill={k.acc} />
      <Say x={150} y={160} s="Praise" fill={k.ink} />
      <Say x={249} y={160} s="Nothing" fill={k.muted} />
    </Frame>
  );
}

function StudyTime({ k }: { k: Ink }) {
  const p = useGrow(300, 1200);
  const bar = (x: number, h: number, c: string, s: string, tc: string) => (
    <G>
      <Rect x={x} y={150 - h * p} width={52} height={h * p} rx={8} fill={c} />
      <Say x={x + 26} y={170} s={s} fill={tc} />
    </G>
  );
  return (
    <Frame label="Three bars of time spent studying. Students who read a kind note studied the longest. Praise and nothing came out lower and about the same.">
      <Line x1={24} y1={150} x2={276} y2={150} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      {bar(44, 112, k.acc, 'Kind', k.acc)}
      {bar(124, 66, k.ink, 'Praise', k.ink)}
      {bar(204, 62, k.line, 'Nothing', k.muted)}
      <Say x={150} y={194} s="Time spent studying" fill={k.muted} />
    </Frame>
  );
}

function TwoVoices({ k }: { k: Ink }) {
  const burst = Array.from({ length: 16 }, (_, i) => {
    const a = (i * Math.PI) / 8;
    const r = i % 2 ? 24 : 36;
    return `${i ? 'L' : 'M'}${(52 + r * Math.cos(a)).toFixed(1)} ${(60 + r * Math.sin(a)).toFixed(1)}`;
  }).join(' ');
  return (
    <Frame label="A person in the middle. On the left, a boss shouts in a jagged bubble. On the right, a coach with a clipboard speaks in a calm round bubble.">
      <Line x1={10} y1={170} x2={290} y2={170} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      <Path d={burst + ' Z'} fill={RED} strokeLinejoin="round" />
      <Say x={52} y={68} s="!!" fill={WHITE} size={22} />
      <Person x={50} y={170} s={1.1} fill={k.muted} face={k.bg} />
      <Line x1={64} y1={138} x2={106} y2={134} stroke={k.muted} strokeWidth={6} strokeLinecap="round" />
      <Ellipse cx={248} cy={60} rx={38} ry={26} fill={k.soft} />
      <Circle cx={244} cy={94} r={4.5} fill={k.soft} />
      <Circle cx={241} cy={104} r={2.8} fill={k.soft} />
      <Path d="M226 62 Q237 52 248 62 T270 62" fill="none" stroke={k.acc} strokeWidth={4} strokeLinecap="round" />
      <Person x={250} y={170} s={1.1} fill={k.acc} face={k.bg} />
      <Line x1={236} y1={138} x2={206} y2={136} stroke={k.acc} strokeWidth={6} strokeLinecap="round" />
      <Rect x={190} y={116} width={24} height={32} rx={3} fill={WHITE} />
      <Rect x={196} y={112} width={12} height={7} rx={2} fill={k.ink} />
      {[128, 135, 142].map((y) => (
        <Line key={y} x1={195} y1={y} x2={209} y2={y} stroke={BEAR_LINE} strokeWidth={2} strokeLinecap="round" opacity={0.5} />
      ))}
      <Person x={150} y={170} s={1.3} fill={k.ink} face={k.bg} />
      <Say x={50} y={192} s="Harsh" fill={k.muted} />
      <Say x={250} y={192} s="Kind" fill={k.acc} />
    </Frame>
  );
}

function Doughnut({ k }: { k: Ink }) {
  const sprinkles: [number, number, number, string][] = [
    [-20, -14, 20, WHITE],
    [-6, -24, -30, GOLD],
    [12, -20, 40, k.acc],
    [22, -4, 80, WHITE],
    [-24, 6, -50, GOLD],
    [-10, 20, 10, k.acc],
    [14, 18, -20, WHITE],
  ];
  return (
    <Frame label="A doughnut on a plate, and a small kind note that says everyone does this sometimes. Then the sweets came out.">
      <Ellipse cx={80} cy={132} rx={56} ry={12} fill={k.soft} />
      <G transform="translate(80 104)">
        <Circle r={38} fill="#D9964F" />
        <Circle r={32} fill="#F7C6D0" />
        <Circle r={11} fill={k.bg} />
        {sprinkles.map(([x, y, a, c], i) => (
          <Rect key={i} x={x - 4} y={y - 1.5} width={8} height={3} rx={1.5} fill={c} transform={`rotate(${a} ${x} ${y})`} />
        ))}
      </G>
      <G transform="rotate(3 190 56)">
        <Rect x={134} y={26} width={140} height={60} rx={6} fill={WHITE} />
        <Say x={204} y={52} s="Everyone does this" fill={BEAR_LINE} size={12} />
        <Say x={204} y={70} s="sometimes" fill={k.acc} size={13} />
      </G>
      {[
        [226, 132, -14, '#F7C6D0'],
        [256, 120, 12, GOLD],
        [270, 148, -8, k.acc],
        [240, 158, 18, WHITE],
      ].map(([x, y, a, c]) => (
        <G key={String(x)} transform={`translate(${x} ${y}) rotate(${a})`}>
          <Path d="M-13 -6 L-22 -10 L-22 10 L-13 6 Z M13 -6 L22 -10 L22 10 L13 6 Z" fill={c} />
          <Rect x={-13} y={-8} width={26} height={16} rx={8} fill={c} />
        </G>
      ))}
      <Say x={150} y={190} s="Then the sweets came out" fill={k.muted} />
    </Frame>
  );
}

function Coach({ k }: { k: Ink }) {
  return (
    <Frame label="A coach with a clipboard beside a player. On the clipboard is a small chart that dips and then climbs.">
      <Line x1={10} y1={170} x2={290} y2={170} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      <Person x={84} y={170} s={1.3} fill={k.acc} face={k.bg} />
      <Line x1={98} y1={136} x2={124} y2={128} stroke={k.acc} strokeWidth={7} strokeLinecap="round" />
      <Rect x={114} y={86} width={66} height={76} rx={6} fill={WHITE} />
      <Rect x={134} y={80} width={26} height={11} rx={3} fill={k.ink} />
      <Path d="M124 148 L124 106 M124 148 L172 148" fill="none" stroke={BEAR_LINE} strokeWidth={2} strokeLinecap="round" opacity={0.4} />
      <Path d="M126 124 L138 134 L148 126 L158 116 L170 106" fill="none" stroke={k.acc} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={170} cy={106} r={4} fill={GOLD} />
      <Person x={224} y={170} s={1.3} fill={k.ink} face={k.bg} />
      <Path d="M190 118 L208 118 M202 111 L209 118 L202 125" fill="none" stroke={k.muted} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      <Say x={150} y={192} s="What happened, what changes, back to it" fill={k.muted} size={12} />
    </Frame>
  );
}

/* ---------- lessons 1 and 3: two extra cards ---------- */
function MixedFeelings({ k }: { k: Ink }) {
  return (
    <Frame label="A person with a thought cloud split into two colors, a small yes on one side and a small no on the other. Unsure, and starting anyway.">
      <Defs>
        <ClipPath id="mixcloud">
          <Rect x={74} y={14} width={216} height={86} rx={43} />
        </ClipPath>
      </Defs>
      <Circle cx={86} cy={112} r={5} fill={k.acc} />
      <Circle cx={78} cy={124} r={3} fill={k.acc} />
      <G clipPath="url(#mixcloud)">
        <Rect x={74} y={14} width={106} height={86} fill={k.acc} />
        <Rect x={180} y={14} width={110} height={86} fill={k.muted} />
      </G>
      <Rect x={104} y={42} width={46} height={30} rx={15} fill={WHITE} />
      <Say x={127} y={63} s="yes" fill={BEAR_LINE} size={15} />
      <Rect x={212} y={42} width={46} height={30} rx={15} fill={WHITE} />
      <Say x={235} y={63} s="no" fill={BEAR_LINE} size={15} />
      <Line x1={10} y1={172} x2={290} y2={172} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      <Person x={56} y={172} s={1.4} fill={k.ink} face={k.bg} />
      <Say x={150} y={194} s="Unsure, and starting anyway" fill={k.muted} />
    </Frame>
  );
}

type Pose = { torso: string; head: [number, number]; legs: string[]; arm: string };
const POSES: Pose[] = [
  { torso: 'M0 -26 L4 -56', head: [6, -70], legs: ['M0 -26 L-16 -6 L-34 -6', 'M0 -26 L20 -30 L20 -2'], arm: 'M4 -52 L18 -34' },
  { torso: 'M0 -38 L6 -68', head: [9, -82], legs: ['M0 -38 L-8 -18 L-20 -3', 'M0 -38 L16 -34 L18 0'], arm: 'M6 -62 L18 -42' },
  { torso: 'M0 -36 L0 -70', head: [0, -86], legs: ['M0 -36 L-6 0', 'M0 -36 L7 0'], arm: 'M0 -66 L-9 -40' },
];
function Riser({ x, y, stage, c, o = 1 }: { x: number; y: number; stage: number; c: string; o?: number }) {
  const p = POSES[stage];
  return (
    <G transform={`translate(${x} ${y})`} opacity={o}>
      {p.legs.map((d) => (
        <Path key={d} d={d} fill="none" stroke={c} strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" />
      ))}
      <Path d={p.arm} fill="none" stroke={c} strokeWidth={8} strokeLinecap="round" />
      <Path d={p.torso} fill="none" stroke={c} strokeWidth={19} strokeLinecap="round" />
      <Circle cx={p.head[0]} cy={p.head[1]} r={10} fill={c} />
    </G>
  );
}
function GetUp({ k }: { k: Ink }) {
  return (
    <Frame label="A person rising in three steps, from one knee, to pushing up, to standing tall. One mistake, one moment.">
      <Circle cx={246} cy={108} r={36} fill={GOLD} opacity={0.35} />
      <Line x1={14} y1={168} x2={286} y2={168} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      <Riser x={54} y={168} stage={0} c={k.ink} o={0.45} />
      <Riser x={150} y={168} stage={1} c={k.ink} o={0.7} />
      <Riser x={246} y={168} stage={2} c={k.acc} />
      <Path d="M96 118 L106 126 L96 134" fill="none" stroke={k.muted} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M192 118 L202 126 L192 134" fill="none" stroke={k.muted} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      <Say x={150} y={192} s="One mistake, one moment" fill={k.muted} />
    </Frame>
  );
}

export const SCENES_B: Record<string, ComponentType<{ k: Ink }>> = {
  'sleep-lab': SleepLab,
  'brain-glow': BrainGlow,
  tank: Tank,
  speaker: Speaker,
  'plan-ahead': PlanAhead,
  'two-sentences': TwoSentences,
  'act-edges': ActEdges,
  'shame-fog': ShameFog,
  reoffend: Reoffend,
  'me-not-me': MeNotMe,
  'hard-test': HardTest,
  'three-notes': ThreeNotes,
  'study-time': StudyTime,
  'two-voices': TwoVoices,
  doughnut: Doughnut,
  coach: Coach,
  'mixed-feelings': MixedFeelings,
  'get-up': GetUp,
};
