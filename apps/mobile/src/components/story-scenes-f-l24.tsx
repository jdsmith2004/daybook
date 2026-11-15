/* Scenes for lesson 24, told as a story (see story-kit.tsx and story-scenes-f.tsx): therapy is a partnership, not a courtroom. */
import { useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { Easing } from 'react-native';
import { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';

import { useAppear, useReducedMotion } from '@/lib/motion';

import { BEAR_LINE, Frame, type Ink, Person, Say } from './story-kit';

const BROWN = '#8A5A2B';
const GOLD = '#FFD25A';
const WHITE = '#FFFFFF';
const GREEN = '#3F8F5B';
const WALL = '#FFF1D6';
const FLOOR = '#E3BE8E';
const RUG = '#E7A98F';
const SKIN = '#E8B88A';
const NAVY = '#3E4E6B';
const TEAL = '#5E9C9A';
const TERRA = '#C9694A';
const STEEL = '#8E96AB';

/* the line of words under a picture */
function Cap({ k, s }: { k: Ink; s: string }) {
  return <Say x={150} y={190} s={s} fill={k.ink} />;
}

/* a number from 0 to 1 that eases up once, after a short pause; with Reduce Motion on it starts at 1 */
function useGrow(delay = 300, dur = 1000) {
  const still = useReducedMotion();
  const v = useAppear(delay, dur, Easing.out(Easing.cubic));
  const [p, setP] = useState(still ? 1 : 0);
  useEffect(() => {
    const id = v.addListener(({ value }) => setP(value));
    return () => v.removeListener(id);
  }, [v]);
  return p;
}

/* a rounded wall with a floor and a thin outline, so a pale room still reads on a light page and a dark one */
function Shell({ k, wall = WALL, children }: { k: Ink; wall?: string; children?: ReactNode }) {
  return (
    <G>
      <Rect x={10} y={10} width={280} height={156} rx={14} fill={wall} />
      <Path d="M10 134 H290 V152 Q290 166 276 166 H24 Q10 166 10 152 Z" fill={FLOOR} />
      <Rect x={10} y={130} width={280} height={5} fill="#D2AE7E" />
      <Rect x={10} y={10} width={280} height={156} rx={14} fill="none" stroke={k.line} strokeWidth={2} />
      {children}
    </G>
  );
}

/* the therapy room, one place for several scenes: a warm wall, a window with daylight, a rug and a floor lamp */
function Room({
  k,
  lampX = 262,
  winX = 24,
  rugX = 150,
  rugW = 104,
  children,
}: {
  k: Ink;
  lampX?: number;
  winX?: number;
  rugX?: number;
  rugW?: number;
  children?: ReactNode;
}) {
  return (
    <Shell k={k}>
      <Path d={`M${winX + 8} 135 L${winX + 62} 135 L${winX + 96} 166 L${winX + 26} 166 Z`} fill={GOLD} opacity={0.22} />
      <Ellipse cx={rugX} cy={156} rx={rugW} ry={10} fill={RUG} />
      <Ellipse cx={rugX} cy={156} rx={rugW - 14} ry={6} fill="none" stroke="#D98C6B" strokeWidth={1.5} />
      <Rect x={winX} y={20} width={62} height={44} rx={3} fill="#CFE8F5" stroke="#B98550" strokeWidth={3} />
      <Circle cx={winX + 46} cy={34} r={7} fill={GOLD} />
      <Path d={`M${winX + 6} 54 Q${winX + 18} 44 ${winX + 30} 52 Q${winX + 40} 46 ${winX + 56} 54 L${winX + 56} 60 L${winX + 6} 60 Z`} fill="#9FD0A8" />
      <Line x1={winX + 31} y1={20} x2={winX + 31} y2={64} stroke="#B98550" strokeWidth={2.5} />
      <Line x1={winX} y1={42} x2={winX + 62} y2={42} stroke="#B98550" strokeWidth={2.5} />
      <Rect x={winX - 4} y={63} width={70} height={5} rx={2} fill="#B98550" />
      <Rect x={lampX - 1.5} y={70} width={3} height={86} fill={BROWN} />
      <Ellipse cx={lampX} cy={157} rx={11} ry={3.5} fill={BROWN} />
      <Path
        d={`M${lampX - 15} 70 L${lampX + 15} 70 L${lampX + 9} 46 L${lampX - 9} 46 Z`}
        fill="#FFE08A"
        stroke="#C98F1A"
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
      {children}
    </Shell>
  );
}

/* a small skin-colored hand, fingers up */
function Hand({ x, y, rot = 0, s = 1 }: { x: number; y: number; rot?: number; s?: number }) {
  return (
    <G transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} stroke={BEAR_LINE} strokeWidth={1}>
      {[0, 1, 2, 3].map((i) => (
        <Rect key={i} x={-7 + i * 3.8} y={-13 + (i === 0 || i === 3 ? 2 : 0)} width={3.2} height={i === 0 || i === 3 ? 9 : 11} rx={1.6} fill={SKIN} />
      ))}
      <Rect x={-12} y={-1} width={7.5} height={3.6} rx={1.8} fill={SKIN} transform="rotate(-32 -8 1)" />
      <Rect x={-7} y={-4} width={14} height={14} rx={5} fill={SKIN} />
    </G>
  );
}

/* a person seated in an armchair, side on, facing right (dir 1) or left (dir -1). Origin: the middle of the chair, on the floor. */
function Sit({
  cx,
  floor = 156,
  dir = 1,
  s = 1,
  seat,
  fill,
  face,
  lean = 0,
  pad = false,
  children,
}: {
  cx: number;
  floor?: number;
  dir?: 1 | -1;
  s?: number;
  seat: string;
  fill: string;
  face: string;
  lean?: number;
  pad?: boolean;
  children?: ReactNode;
}) {
  return (
    <G transform={`translate(${cx} ${floor}) scale(${dir * s} ${s})`}>
      <Ellipse cx={2} cy={0} rx={38} ry={4} fill="#000" opacity={0.12} />
      <G stroke={BEAR_LINE} strokeWidth={1.2}>
        <Rect x={-24} y={-16} width={5} height={16} rx={2} fill={BROWN} />
        <Rect x={19} y={-16} width={5} height={16} rx={2} fill={BROWN} />
        <Rect x={-30} y={-76} width={14} height={62} rx={7} fill={seat} />
        <Rect x={-30} y={-32} width={62} height={16} rx={6} fill={seat} />
      </G>
      <G transform={`rotate(${lean} -6 -30)`}>
        <Person x={-6} y={-30} s={1.05} fill={fill} face={face} />
      </G>
      <Rect x={0} y={-41} width={29} height={10} rx={5} fill={fill} />
      <Rect x={21} y={-41} width={9} height={39} rx={4} fill={fill} />
      <Rect x={22} y={-5} width={14} height={5} rx={2.5} fill={BEAR_LINE} />
      <G stroke={BEAR_LINE} strokeWidth={1.2}>
        <Rect x={-16} y={-50} width={40} height={10} rx={5} fill={seat} />
      </G>
      {pad ? (
        <G transform="rotate(-12 17 -46)">
          <Rect x={9} y={-58} width={16} height={20} rx={2} fill={WHITE} stroke={BEAR_LINE} strokeWidth={1} />
          <Line x1={12} y1={-52} x2={22} y2={-52} stroke={BEAR_LINE} strokeWidth={1} opacity={0.5} />
          <Line x1={12} y1={-47} x2={22} y2={-47} stroke={BEAR_LINE} strokeWidth={1} opacity={0.5} />
          <Line x1={12} y1={-42} x2={19} y2={-42} stroke={BEAR_LINE} strokeWidth={1} opacity={0.5} />
        </G>
      ) : null}
      {children}
    </G>
  );
}

/* a small round table with a mug and a little plant */
function SideTable({ cx, floor = 156 }: { cx: number; floor?: number }) {
  const top = floor - 38;
  return (
    <G>
      <Ellipse cx={cx} cy={floor} rx={12} ry={3} fill={BROWN} />
      <Rect x={cx - 2.5} y={top} width={5} height={floor - top} fill={BROWN} />
      <Ellipse cx={cx} cy={top} rx={22} ry={5} fill="#B5824A" stroke={BEAR_LINE} strokeWidth={1.2} />
      <Path
        d={`M${cx - 17} ${top - 2} L${cx - 17} ${top - 12} Q${cx - 17} ${top - 13} ${cx - 16} ${top - 13} L${cx - 8} ${top - 13} L${cx - 7} ${top - 2} Q${cx - 12} ${top + 1} ${cx - 17} ${top - 2} Z`}
        fill={WHITE}
        stroke={BEAR_LINE}
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
      <Path
        d={`M${cx - 7} ${top - 11} Q${cx - 3} ${top - 10} ${cx - 4} ${top - 5} Q${cx - 5} ${top - 4} ${cx - 7.5} ${top - 4}`}
        stroke={BEAR_LINE}
        strokeWidth={1.2}
        fill="none"
      />
      <Path
        d={`M${cx - 14} ${top - 16} Q${cx - 11} ${top - 19} ${cx - 14} ${top - 22} M${cx - 10} ${top - 16} Q${cx - 7} ${top - 19} ${cx - 10} ${top - 22}`}
        stroke="#C9A57A"
        strokeWidth={1.3}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d={`M${cx + 5} ${top - 1} L${cx + 7} ${top - 10} L${cx + 17} ${top - 10} L${cx + 18} ${top - 1} Q${cx + 11} ${top + 2} ${cx + 5} ${top - 1} Z`}
        fill={TERRA}
        stroke={BEAR_LINE}
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
      <Ellipse cx={cx + 8} cy={top - 16} rx={6} ry={2.8} fill={GREEN} transform={`rotate(-40 ${cx + 8} ${top - 16})`} />
      <Ellipse cx={cx + 16} cy={top - 16} rx={6} ry={2.8} fill="#4FA36B" transform={`rotate(40 ${cx + 16} ${top - 16})`} />
      <Ellipse cx={cx + 12} cy={top - 19} rx={2.8} ry={6} fill={GREEN} />
    </G>
  );
}

/* a speech bubble that holds three quiet dots: someone is talking */
function Bubble({ x, y, w, h, fill, tail, dots = true }: { x: number; y: number; w: number; h: number; fill: string; tail: string; dots?: boolean }) {
  return (
    <G stroke={BEAR_LINE} strokeWidth={1.4} strokeLinejoin="round">
      <Path d={tail} fill={fill} />
      <Rect x={x} y={y} width={w} height={h} rx={h / 2.2} fill={fill} />
      {dots ? [-1, 0, 1].map((i) => <Circle key={i} cx={x + w / 2 + i * 9} cy={y + h / 2} r={2} fill={BEAR_LINE} stroke="none" opacity={0.55} />) : null}
    </G>
  );
}

/* ---------- lesson 24 ---------- */
function Judge({ k }: { k: Ink }) {
  const dark = '#232838';
  return (
    <Frame label="A small person on a low stool looks up at a stern figure behind a tall, dark judge's desk, who looks down holding a notepad">
      <Rect x={146} y={10} width={144} height={156} rx={14} fill="#B8BED0" />
      <Rect x={186} y={16} width={58} height={88} rx={12} fill="#59627A" />
      <G transform="translate(215 100) scale(-1.3 1.3)">
        <Person x={0} y={0} fill={dark} />
        <Circle cx={5} cy={-44} r={1.8} fill="#B8BED0" />
        <Path d="M0.5 -50.5 L9.5 -47.5" stroke="#B8BED0" strokeWidth={1.8} strokeLinecap="round" />
      </G>
      <Path d="M197 66 Q187 77 198 88" stroke={dark} strokeWidth={6} strokeLinecap="round" fill="none" />
      <G transform="rotate(-8 192 80)">
        <Rect x={183} y={68} width={20} height={26} rx={2} fill={WHITE} stroke={BEAR_LINE} strokeWidth={1.2} />
        <Line x1={187} y1={75} x2={199} y2={75} stroke={BEAR_LINE} strokeWidth={1.2} opacity={0.5} />
        <Line x1={187} y1={80} x2={199} y2={80} stroke={BEAR_LINE} strokeWidth={1.2} opacity={0.5} />
        <Line x1={187} y1={85} x2={195} y2={85} stroke={BEAR_LINE} strokeWidth={1.2} opacity={0.5} />
      </G>
      <Rect x={150} y={96} width={136} height={10} rx={3} fill="#2F3548" />
      <Rect x={154} y={106} width={128} height={60} fill="#3F465B" />
      <Rect x={162} y={114} width={52} height={44} rx={3} fill="none" stroke="#5C6580" strokeWidth={1.6} />
      <Rect x={222} y={114} width={52} height={44} rx={3} fill="none" stroke="#5C6580" strokeWidth={1.6} />
      <Rect x={244} y={86} width={14} height={9} rx={2} fill={BROWN} />
      <Rect x={256} y={89} width={22} height={3.5} rx={1.7} fill="#B5824A" />
      <Line x1={14} y1={166} x2={146} y2={166} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      <Path d="M48 126 L42 166 M76 126 L84 166 M62 128 L62 166" stroke={BROWN} strokeWidth={4} strokeLinecap="round" />
      <Ellipse cx={62} cy={123} rx={21} ry={5} fill={BROWN} />
      <G transform="translate(60 119) scale(0.9)">
        <Person x={0} y={0} fill={k.acc} />
        <Circle cx={5.5} cy={-51} r={1.8} fill={k.bg} />
      </G>
      <Rect x={60} y={108} width={26} height={9} rx={4.5} fill={k.acc} />
      <Rect x={79} y={113} width={8} height={50} rx={4} fill={k.acc} />
      <Rect x={80} y={160} width={13} height={5} rx={2.5} fill={BEAR_LINE} />
      <Cap k={k} s="What people picture" />
    </Frame>
  );
}

function Stacks({ k }: { k: Ink }) {
  const hues = ['#FFD25A', '#F7C6D0', '#BFE3C0', '#C9C4E6', '#9CC9E8'];
  const stack = (cx: number, n: number, w: number, seed: number) =>
    Array.from({ length: n }, (_, i) => {
      const x = cx - w / 2 + ((i * 7 + seed) % 5) - 2;
      const y = 152 - (i + 1) * 10.5;
      const c = hues[(i + seed) % 5];
      return (
        <G key={i}>
          <Rect x={x} y={y - 3} width={16} height={5} rx={2} fill={c} />
          <Rect x={x} y={y} width={w} height={10} rx={2} fill={c} stroke={BEAR_LINE} strokeWidth={1} />
          <Path d={`M${x + w - 16} ${y + 5} l3.5 3 l7 -7`} stroke={BEAR_LINE} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </G>
      );
    });
  return (
    <Frame label="Several tall stacks of folders and papers in soft colors, of different heights, with a big magnifying glass leaning against the tallest stack">
      <Line x1={14} y1={152} x2={286} y2={152} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      {stack(40, 5, 44, 1)}
      {stack(90, 8, 46, 3)}
      {stack(264, 7, 40, 2)}
      {stack(146, 11, 54, 0)}
      <Line x1={219} y1={115} x2={236} y2={150} stroke="#5A3B1E" strokeWidth={8} strokeLinecap="round" />
      <Line x1={227} y1={131} x2={236} y2={150} stroke={BROWN} strokeWidth={11} strokeLinecap="round" />
      <Circle cx={200} cy={96} r={26} fill="#DFF1FF" opacity={0.6} />
      <Circle cx={200} cy={96} r={26} fill="none" stroke="#5A3B1E" strokeWidth={5} />
      <Path d="M184 83 Q190 73 202 71" stroke={WHITE} strokeWidth={3} strokeLinecap="round" fill="none" />
      <Path d="M189 99 l7 7 l15 -17" stroke={GREEN} strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Cap k={k} s="Decades of studies" />
    </Frame>
  );
}

function TwoChairs({ k }: { k: Ink }) {
  const p = useGrow();
  return (
    <Frame label="Two people sit in two armchairs facing each other at the same height, a small table between them with a mug and a plant, and two speech bubbles overlapping as they talk together">
      <Room k={k}>
        <Sit cx={88} seat={TEAL} fill={k.acc} face={k.bg} />
        <Sit cx={212} dir={-1} seat={TERRA} fill={NAVY} face={WALL} lean={4} pad />
        <SideTable cx={150} />
        <G opacity={p}>
          <Bubble x={112} y={32} w={46} h={28} fill={WHITE} tail="M114 56 L126 56 L99 75 Z" />
          <Bubble x={138} y={46} w={46} h={28} fill="#FFE08A" tail="M172 70 L184 70 L205 77 Z" />
        </G>
      </Room>
      <Cap k={k} s="Two people, one goal" />
    </Frame>
  );
}

function Partners({ k }: { k: Ink }) {
  return (
    <Frame label="Two people stand shoulder to shoulder looking at the same board on an easel, which shows a path leading to a flag, and one of them points at the flag">
      <Line x1={14} y1={166} x2={286} y2={166} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      <Path d="M192 122 L174 166 M256 122 L274 166 M224 122 L224 166" stroke={BROWN} strokeWidth={5} strokeLinecap="round" />
      <Rect x={176} y={118} width={96} height={6} rx={2} fill={BROWN} />
      <Rect x={170} y={38} width={108} height={82} rx={4} fill={WHITE} stroke={BEAR_LINE} strokeWidth={2} />
      <Path
        d="M186 106 Q200 76 216 90 Q232 104 240 74 Q244 62 250 58"
        stroke="#D9602A"
        strokeWidth={4}
        strokeLinecap="round"
        strokeDasharray="1 8"
        fill="none"
      />
      <Circle cx={186} cy={106} r={5} fill="#D9602A" />
      <Line x1={250} y1={58} x2={250} y2={44} stroke={BEAR_LINE} strokeWidth={2.2} strokeLinecap="round" />
      <Path d="M250.5 44 L266 49 L250.5 55 Z" fill="#C2410C" stroke={BEAR_LINE} strokeWidth={1.2} strokeLinejoin="round" />
      <Person x={72} y={166} s={1.4} fill={k.ink} face={k.bg} />
      <Person x={118} y={166} s={1.3} fill={k.acc} face={k.bg} />
      <Path d="M130 127 Q148 124 158 100" stroke={k.acc} strokeWidth={6.5} strokeLinecap="round" fill="none" />
      <Circle cx={159} cy={97} r={4.4} fill={SKIN} stroke={BEAR_LINE} strokeWidth={1} />
      <Cap k={k} s="Not a judge, a partner" />
    </Frame>
  );
}

function SpeakUp({ k }: { k: Ink }) {
  const p = useGrow();
  return (
    <Frame label="A person in an armchair raises a hand mid-sentence, with a speech bubble showing a tilted so-so hand, while the therapist in the other chair leans forward to listen">
      <Room k={k}>
        <Sit cx={104} seat={TEAL} fill={k.acc} face={k.bg}>
          <Path d="M6 -58 Q27 -60 25 -82" stroke={k.acc} strokeWidth={6} strokeLinecap="round" fill="none" />
          <Hand x={25} y={-86} s={0.62} />
        </Sit>
        <Sit cx={206} dir={-1} seat={TERRA} fill={NAVY} face={WALL} lean={14} pad />
        <G opacity={p}>
          <Bubble x={134} y={16} w={64} h={42} fill={WHITE} tail="M142 54 L154 54 L132 66 Z" dots={false} />
          <G transform="translate(166 40)">
            <Hand x={0} y={0} rot={-18} s={1.3} />
            <Path d="M-20 -8 Q-25 -1 -20 6 M20 -8 Q25 -1 20 6" stroke={BEAR_LINE} strokeWidth={1.4} strokeLinecap="round" fill="none" opacity={0.5} />
          </G>
        </G>
      </Room>
      <Cap k={k} s="Say how it feels" />
    </Frame>
  );
}

function Toolkit({ k }: { k: Ink }) {
  return (
    <Frame label="An open wooden toolbox on a table, with a notebook and pencil, an hourglass, a folded map and a wrench sticking out of it">
      <Rect x={20} y={150} width={260} height={9} rx={3} fill={BROWN} />
      <Rect x={32} y={159} width={7} height={12} fill={BROWN} />
      <Rect x={261} y={159} width={7} height={12} fill={BROWN} />
      <Path d="M70 108 L84 96 L216 96 L230 108 Z" fill="#5A3B1E" />
      <G stroke={BEAR_LINE} strokeWidth={1.2} strokeLinejoin="round">
        <Rect x={87} y={52} width={26} height={54} rx={3} fill={k.acc} />
        <Path d="M87 66 H113 M87 92 H113" stroke={GOLD} strokeWidth={3} />
        <Path d="M118 106 L125 60 L131 61 L124 106 Z" fill="#E8A92A" />
        <Path d="M125 60 L131 61 L129.5 50 Z" fill="#F4E6C8" />
        <Path d="M136 53 L160 53 L148 75 Z M148 75 L160 98 L136 98 Z" fill="#EAF6FF" opacity={0.85} />
        <Path d="M145 90 L151 90 L148 80 Z" fill={GOLD} stroke="none" />
        <Path d="M141 98 L155 98 L148 88 Z" fill={GOLD} stroke="none" />
        <Rect x={133} y={48} width={30} height={5} rx={2} fill={BROWN} />
        <Rect x={133} y={98} width={30} height={5} rx={2} fill={BROWN} />
        <Path d="M172 106 L172 66 L182 60 L192 66 L202 60 L202 106 Z" fill="#E3D3A8" />
        <Path d="M182 60 L182 106 M192 66 L192 106" stroke="#B9A476" strokeWidth={1.2} fill="none" />
        <Path d="M177 98 Q182 86 187 90 Q192 94 197 78" stroke="#D9602A" strokeWidth={1.8} strokeDasharray="1 3.5" strokeLinecap="round" fill="none" />
      </G>
      <G transform="translate(214 104) rotate(12)" stroke={BEAR_LINE} strokeWidth={1.2}>
        <Rect x={-3.5} y={-50} width={7} height={50} rx={3} fill={STEEL} />
        <Circle cx={0} cy={-52} r={9} fill={STEEL} />
        <Rect x={-3.5} y={-64} width={7} height={11} fill={k.bg} stroke="none" />
      </G>
      <G stroke={BEAR_LINE} strokeWidth={1.2}>
        <Rect x={70} y={108} width={160} height={42} rx={5} fill="#C08A4F" />
        <Path d="M70 122 H230 M70 136 H230" stroke="#9A6836" strokeWidth={1.4} fill="none" />
        <Rect x={78} y={108} width={8} height={42} fill="#8A5A2B" />
        <Rect x={214} y={108} width={8} height={42} fill="#8A5A2B" />
        <Rect x={140} y={114} width={20} height={12} rx={3} fill={GOLD} />
      </G>
      <Cap k={k} s="Skills to practice" />
    </Frame>
  );
}

function FirstHour({ k }: { k: Ink }) {
  return (
    <Frame label="A calm therapy room with daylight in the window and two people in two armchairs, and on the right a closed door with a small round colored sign on it">
      <Room k={k} lampX={34} winX={56} rugX={140} rugW={96}>
        <Sit cx={96} s={0.9} seat={TEAL} fill={k.acc} face={k.bg} />
        <Sit cx={186} s={0.9} dir={-1} seat={TERRA} fill={NAVY} face={WALL} pad />
        <Rect x={226} y={32} width={56} height={110} rx={3} fill="#7A4B2A" />
        <Rect x={231} y={37} width={46} height={105} fill="#B98550" />
        <Rect x={238} y={46} width={32} height={34} rx={2} fill="none" stroke="#9A6836" strokeWidth={1.8} />
        <Rect x={238} y={92} width={32} height={40} rx={2} fill="none" stroke="#9A6836" strokeWidth={1.8} />
        <Circle cx={254} cy={63} r={8} fill="#E04F4F" stroke={WHITE} strokeWidth={2} />
        <Circle cx={240} cy={104} r={3.2} fill={GOLD} stroke="#C98F1A" strokeWidth={1} />
      </Room>
      <Cap k={k} s="It stays in the room" />
    </Frame>
  );
}

function Doors({ k }: { k: Ink }) {
  const p = useGrow(400, 1400);
  const closed = (x: number) => (
    <G key={x}>
      <Rect x={x - 3} y={31} width={62} height={108} rx={3} fill="#7A4B2A" />
      <Rect x={x} y={34} width={56} height={104} fill="#B98550" />
      <Rect x={x + 8} y={44} width={40} height={36} rx={2} fill="none" stroke="#9A6836" strokeWidth={1.8} />
      <Rect x={x + 8} y={90} width={40} height={40} rx={2} fill="none" stroke="#9A6836" strokeWidth={1.8} />
      <Circle cx={x + 47} cy={88} r={3} fill="#6B4A2A" />
    </G>
  );
  return (
    <Frame label="A hallway with three doors side by side: the two on the left are closed and plain, the right one is open with warm light spilling across the floor, and a person walks toward it">
      <Shell k={k} wall="#F3E3C6">
        <Path d="M202 136 L258 136 L286 166 L178 166 Z" fill={GOLD} opacity={0.3 + 0.2 * p} />
        {closed(42)}
        {closed(122)}
        <Rect x={199} y={31} width={62} height={108} rx={3} fill="#7A4B2A" />
        <Rect x={202} y={34} width={56} height={104} fill="#FFE9A8" />
        <Rect x={210} y={42} width={40} height={88} rx={3} fill="#FFF6D6" opacity={0.7} />
        <Path d="M258 34 L247 41 L247 130 L258 138 Z" fill="#A9743F" stroke="#7A4B2A" strokeWidth={1.2} strokeLinejoin="round" />
        <Ellipse cx={170 - 36 * (1 - p)} cy={163} rx={16} ry={3.5} fill="#000" opacity={0.14} />
        <Person x={170 - 36 * (1 - p)} y={162} s={1.1} fill={k.acc} face={k.bg} />
      </Shell>
      <Cap k={k} s="Try another door" />
    </Frame>
  );
}

export const SCENES_L24: Record<string, ComponentType<{ k: Ink }>> = {
  'l22-judge': Judge,
  'l22-stacks': Stacks,
  'l22-two-chairs': TwoChairs,
  'l22-partners': Partners,
  'l22-speak-up': SpeakUp,
  'l22-toolkit': Toolkit,
  'l22-first-hour': FirstHour,
  'l22-doors': Doors,
};
