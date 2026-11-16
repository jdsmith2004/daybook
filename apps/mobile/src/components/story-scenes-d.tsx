/* Scenes for lessons told as a story (see story-kit.tsx): lesson 10 (change the setting), lesson 11 (what to call it) and lesson 41
   (Pleasure Island, after Collodi's book of 1883, drawn on its own, with no film in mind). */
import { useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { Easing } from 'react-native';
import { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';

import { useAppear, useReducedMotion } from '@/lib/motion';

import { BEAR_LINE, Frame, type Ink, Person, Say } from './story-kit';

const BROWN = '#8A5A2B';
const ROPE = '#B8864A';
const GRAY = '#9AA0AE';
const GOLD = '#FFD25A';
const WHITE = '#FFFFFF';
const GREEN = '#3F8F5B';

/* the line of words under a picture */
function Cap({ k, s }: { k: Ink; s: string }) {
  return <Say x={150} y={190} s={s} fill={k.ink} />;
}

/* ---------- lesson 10: change the setting ---------- */
function Palm({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Path d="M0 0 Q5 -16 -2 -34" stroke={BROWN} strokeWidth={4} strokeLinecap="round" fill="none" />
      <Ellipse cx={-14} cy={-33} rx={14} ry={4} fill={GREEN} transform="rotate(25 -14 -33)" />
      <Ellipse cx={10} cy={-33} rx={14} ry={4} fill={GREEN} transform="rotate(-25 10 -33)" />
      <Ellipse cx={-2} cy={-40} rx={4} ry={12} fill="#2F7A4B" />
      <Ellipse cx={-12} cy={-28} rx={11} ry={3.4} fill="#2F7A4B" transform="rotate(60 -12 -28)" />
      <Ellipse cx={8} cy={-28} rx={11} ry={3.4} fill="#2F7A4B" transform="rotate(-60 8 -28)" />
    </G>
  );
}
function FarAway({ k }: { k: Ink }) {
  return (
    <Frame label="A plane flying over a line of tropical trees and green hills, far from home, in 1971">
      <Path d="M10 140 Q50 96 96 136 Q140 84 192 134 Q240 100 290 138 L290 166 L10 166 Z" fill="#7FBF8E" />
      <Path d="M10 152 Q70 124 130 150 Q200 122 290 152 L290 168 L10 168 Z" fill={GREEN} />
      <Path d="M24 74 Q70 92 112 60" stroke={k.muted} strokeWidth={2.5} strokeDasharray="2 7" strokeLinecap="round" fill="none" />
      <G transform="translate(168 54) scale(1.3)">
        <Path d="M-22 -2 L-32 -17 L-21 -17 L-11 -4 Z" fill={k.acc} stroke={BEAR_LINE} strokeWidth={1.4} />
        <Path d="M-6 3 L-20 23 L-8 23 L12 3 Z" fill={k.acc} stroke={BEAR_LINE} strokeWidth={1.4} />
        <Ellipse cx={0} cy={0} rx={28} ry={7.5} fill={WHITE} stroke={BEAR_LINE} strokeWidth={1.6} />
        <Path d="M20 -3 Q26 -3 27 1 L19 1 Z" fill={BEAR_LINE} />
        {[-12, -4, 4, 12].map((x) => (
          <Circle key={x} cx={x} cy={-1} r={1.7} fill={BEAR_LINE} />
        ))}
      </G>
      {[34, 82, 134, 196, 252].map((x, i) => (
        <Palm key={x} x={x} y={150 + (i % 2) * 4} s={1.1 + (i % 3) * 0.08} />
      ))}
      <Cap k={k} s="1971, far from home" />
    </Frame>
  );
}

function Files({ k }: { k: Ink }) {
  const hues = ['#FFD25A', '#F7C6D0', '#BFE3C0', '#C9C4E6'];
  const stack = (cx: number, n: number, w: number) =>
    Array.from({ length: n }, (_, i) => {
      const x = cx - w / 2 + ((i * 7) % 5) - 2;
      const y = 126 - (i + 1) * 11;
      return (
        <G key={i}>
          <Rect x={x} y={y - 3} width={18} height={5} rx={2} fill={hues[i % 4]} />
          <Rect x={x} y={y} width={w} height={11} rx={2} fill={hues[i % 4]} stroke={BEAR_LINE} strokeWidth={1} />
          <Path d={`M${x + w - 18} ${y + 6} l4 3.5 l8 -8`} stroke={BEAR_LINE} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </G>
      );
    });
  return (
    <Frame label="A researcher at a desk beside a tall stack of folders, with a check mark on every one">
      <Person x={66} y={166} s={1.25} fill={k.acc} face={k.bg} />
      <Rect x={20} y={126} width={260} height={9} rx={3} fill={BROWN} />
      <Rect x={30} y={135} width={7} height={35} fill={BROWN} />
      <Rect x={263} y={135} width={7} height={35} fill={BROWN} />
      {stack(214, 8, 66)}
      {stack(138, 3, 54)}
      <Rect x={94} y={116} width={26} height={10} rx={2} fill={WHITE} stroke={BEAR_LINE} strokeWidth={1} />
      <Line x1={99} y1={121} x2={115} y2={121} stroke={BEAR_LINE} strokeWidth={1.6} />
      <Cap k={k} s="She followed every man" />
    </Frame>
  );
}

function SameMan({ k }: { k: Ink }) {
  const man = '#D9602A';
  return (
    <Frame label="The same man twice: on the left in a dark, tangled jungle, on the right in front of a home with a porch and a tree">
      <Rect x={10} y={10} width={132} height={152} rx={14} fill="#1F3D2B" />
      {[26, 46, 66, 86].map((x, i) => (
        <Path
          key={x}
          d={`M${x} 12 Q${x + 18} ${50 + i * 8} ${x - 8} ${90 + i * 6} Q${x + 14} ${120} ${x + 4} 160`}
          stroke={i % 2 ? '#2F6B45' : '#3A7C52'}
          strokeWidth={5}
          fill="none"
          strokeLinecap="round"
        />
      ))}
      <Path d="M20 70 Q70 50 130 92 M16 120 Q70 96 136 130" stroke="#2F6B45" strokeWidth={4} fill="none" strokeLinecap="round" />
      <Ellipse cx={110} cy={40} rx={18} ry={8} fill="#2F6B45" transform="rotate(-25 110 40)" />
      <Ellipse cx={34} cy={34} rx={16} ry={7} fill="#3A7C52" transform="rotate(20 34 34)" />
      <Person x={76} y={160} s={1.2} fill={man} face="#1F3D2B" />
      <Path d="M147 86 L155 86 M152 81 L158 86 L152 91" stroke={k.muted} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Rect x={160} y={10} width={132} height={152} rx={14} fill="#FFF1D6" />
      <Circle cx={270} cy={34} r={11} fill={GOLD} />
      <Path d="M170 84 L196 62 L222 84 Z" fill="#B5533C" />
      <Rect x={174} y={84} width={44} height={50} fill="#E9C9A0" />
      <Rect x={186} y={104} width={14} height={30} rx={2} fill="#7A4B2A" />
      <Rect x={207} y={92} width={9} height={9} fill="#9CC9E8" />
      <Rect x={168} y={134} width={56} height={6} rx={2} fill="#C9965B" />
      <Rect x={171} y={140} width={4} height={22} fill="#C9965B" />
      <Rect x={217} y={140} width={4} height={22} fill="#C9965B" />
      <Rect x={274} y={118} width={6} height={44} fill={BROWN} />
      <Circle cx={277} cy={106} r={18} fill="#4FA36B" />
      <Person x={248} y={160} s={1.2} fill={man} face="#FFF1D6" />
      <Cap k={k} s="Same man. Different setting." />
    </Frame>
  );
}

function Campus({ k }: { k: Ink }) {
  return (
    <Frame label="A person carrying a moving box toward a new building with a flag on top">
      <Line x1={14} y1={166} x2={286} y2={166} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      <Rect x={160} y={64} width={120} height={102} fill="#D9A27E" />
      <Path d="M152 64 L220 28 L288 64 Z" fill="#B5533C" />
      <Circle cx={220} cy={50} r={7} fill="#FFF1D6" />
      <Line x1={220} y1={28} x2={220} y2={8} stroke={BROWN} strokeWidth={2.5} />
      <Path d="M220 9 L242 15 L220 22 Z" fill={k.acc} />
      {[176, 244].map((x) => (
        <G key={x}>
          <Rect x={x} y={80} width={16} height={18} rx={2} fill="#FFF1D6" />
          <Rect x={x} y={114} width={16} height={18} rx={2} fill="#FFF1D6" />
        </G>
      ))}
      <Rect x={207} y={116} width={26} height={50} rx={3} fill="#7A4B2A" />
      <Rect x={150} y={166} width={140} height={6} rx={2} fill="#C9965B" />
      <Person x={84} y={166} s={1.3} fill={k.ink} face={k.bg} />
      <Rect x={76} y={104} width={44} height={32} rx={3} fill="#C9965B" stroke={BEAR_LINE} strokeWidth={1.4} />
      <Line x1={98} y1={104} x2={98} y2={136} stroke={BEAR_LINE} strokeWidth={2} opacity={0.5} />
      <Path d="M70 100 L76 112 M126 100 L120 112" stroke={k.ink} strokeWidth={5} strokeLinecap="round" />
      <Cap k={k} s="A new place, old habits loosen" />
    </Frame>
  );
}

/* ---------- lesson 11: what to call it ---------- */
function Court({ k }: { k: Ink }) {
  return (
    <Frame label="A Roman judge on a raised seat between two columns, and a person tied by a rope to a creditor who holds coins">
      <Rect x={90} y={14} width={120} height={10} rx={3} fill="#D9CDAF" />
      {[98, 186].map((x) => (
        <G key={x}>
          <Rect x={x} y={24} width={16} height={74} fill="#E8DFC8" />
          <Rect x={x + 5} y={26} width={2} height={70} fill="#CFC2A2" />
          <Rect x={x + 10} y={26} width={2} height={70} fill="#CFC2A2" />
          <Rect x={x - 3} y={92} width={22} height={6} rx={2} fill="#D9CDAF" />
        </G>
      ))}
      <Person x={150} y={98} s={1} fill={k.acc} face={k.bg} />
      <Rect x={114} y={98} width={72} height={30} rx={3} fill="#B79A6B" />
      <Rect x={106} y={126} width={88} height={6} rx={2} fill="#A08555" />
      <Person x={46} y={168} s={1.15} fill={k.ink} face={k.bg} />
      <Path d="M24 136 Q46 148 68 136" stroke={ROPE} strokeWidth={4} strokeLinecap="round" fill="none" />
      <Path d="M62 142 Q140 178 214 140" stroke={ROPE} strokeWidth={4} strokeLinecap="round" fill="none" />
      <Person x={252} y={168} s={1.15} fill="#C2410C" face={k.bg} />
      <Path d="M242 138 L218 140" stroke="#C2410C" strokeWidth={5} strokeLinecap="round" />
      {[0, 1, 2].map((i) => (
        <Ellipse key={i} cx={212} cy={141 - i * 5} rx={9} ry={3.4} fill={GOLD} stroke="#C98F1A" strokeWidth={1} />
      ))}
      <Cap k={k} s="Addictus: bound for a debt" />
    </Frame>
  );
}

function DebtPaid({ k }: { k: Ink }) {
  return (
    <Frame label="A person walking out through a stone arch into the light, with the rope dropped on the ground behind">
      <Path d="M126 52 L292 14 L292 168 L126 168 Z" fill={GOLD} opacity={0.22} />
      <Circle cx={256} cy={44} r={16} fill={GOLD} />
      <Path d="M44 170 L44 70 Q44 24 90 24 Q136 24 136 70 L136 170 Z" fill="#BFA77E" />
      <Path d="M58 170 L58 72 Q58 40 90 40 Q122 40 122 72 L122 170 Z" fill="#FFF0B3" />
      <Rect x={82} y={22} width={16} height={12} rx={2} fill="#A08555" />
      <Line x1={20} y1={168} x2={284} y2={168} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      <Path d="M140 164 Q148 152 156 163 Q164 175 172 162 Q178 154 184 164" stroke={ROPE} strokeWidth={4} strokeLinecap="round" fill="none" />
      <Person x={214} y={166} s={1.3} fill={k.ink} face={k.bg} />
      <Cap k={k} s="Paid, and walking free" />
    </Frame>
  );
}

function Scissors({ k }: { k: Ink }) {
  const steel = '#8E96AB';
  return (
    <Frame label="Big scissors cutting a rope in two, the cut ends springing apart">
      <Path d="M14 116 Q60 122 112 106 Q130 100 132 86" stroke={ROPE} strokeWidth={7} strokeLinecap="round" fill="none" />
      <Path d="M168 86 Q170 100 188 106 Q240 122 286 116" stroke={ROPE} strokeWidth={7} strokeLinecap="round" fill="none" />
      <Path d="M132 86 l-5 -6 M132 86 l1 -8 M132 86 l6 -5 M168 86 l5 -6 M168 86 l-1 -8 M168 86 l-6 -5" stroke={ROPE} strokeWidth={2} strokeLinecap="round" />
      <G transform="translate(150 66) rotate(90)">
        <Line x1={-28} y1={16} x2={72} y2={-6} stroke={steel} strokeWidth={7} strokeLinecap="round" />
        <Line x1={-28} y1={-16} x2={72} y2={6} stroke={steel} strokeWidth={7} strokeLinecap="round" />
        <Circle cx={-40} cy={22} r={11} fill="none" stroke={k.acc} strokeWidth={5} />
        <Circle cx={-40} cy={-22} r={11} fill="none" stroke={k.acc} strokeWidth={5} />
        <Circle cx={8} cy={0} r={3.5} fill={k.ink} />
      </G>
      <Cap k={k} s="Decide: to cut off" />
    </Frame>
  );
}

function RopeCuts({ k }: { k: Ink }) {
  const top = (x: number) => 84 + ((x - 20) / 260) * 10;
  const bot = (x: number) => 106 - ((x - 20) / 260) * 8;
  const cuts = [58, 104, 150, 198];
  return (
    <Frame label="A long rope with several cut marks along it, getting thinner and frayed toward the right">
      <Path d="M20 84 L280 94 L280 98 L20 106 Z" fill={ROPE} />
      <Path d="M20 95 L280 96" stroke="#D9B27A" strokeWidth={2} strokeDasharray="3 6" />
      {cuts.map((x) => (
        <G key={x}>
          <Path d={`M${x - 6} ${top(x) - 1} L${x + 6} ${top(x) - 1} L${x} ${(top(x) + bot(x)) / 2 + 1} Z`} fill={k.bg} />
          <Path d={`M${x - 6} ${bot(x) + 1} L${x + 6} ${bot(x) + 1} L${x} ${(top(x) + bot(x)) / 2 - 1} Z`} fill={k.bg} />
          <Line x1={x} y1={58} x2={x} y2={72} stroke={k.acc} strokeWidth={3.5} strokeLinecap="round" />
        </G>
      ))}
      <Path d="M280 94 l10 -6 M280 96 l12 0 M280 97 l10 6" stroke={ROPE} strokeWidth={1.6} strokeLinecap="round" />
      <Cap k={k} s="Every decision is a cut" />
    </Frame>
  );
}

function Robe({ k }: { k: Ink }) {
  return (
    <Frame label="A robe hanging on a hook, and a person standing beside it who has taken it off">
      <Rect x={150} y={14} width={140} height={152} rx={14} fill={k.soft} opacity={0.55} />
      <Line x1={14} y1={166} x2={286} y2={166} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      <Path d="M220 28 L220 40 Q220 46 214 46" stroke={BROWN} strokeWidth={4} strokeLinecap="round" fill="none" />
      <Path d="M194 58 Q220 50 246 58 L254 152 L186 152 Z" fill={k.acc} />
      <Path d="M194 58 L176 118 L190 124 L202 84 Z" fill={k.acc} />
      <Path d="M246 58 L264 118 L250 124 L238 84 Z" fill={k.acc} />
      <Path d="M208 54 L220 86 L232 54" stroke={WHITE} strokeWidth={5} strokeLinejoin="round" fill="none" opacity={0.85} />
      <Rect x={188} y={106} width={64} height={8} fill={GOLD} />
      <Rect x={230} y={114} width={8} height={22} rx={3} fill={GOLD} />
      <Person x={86} y={166} s={1.45} fill={k.ink} face={k.bg} />
      <Cap k={k} s="Habit: something worn" />
    </Frame>
  );
}

function Ledger({ k }: { k: Ink }) {
  const rows = ['Time', 'Sleep', 'Closeness', 'Self respect'];
  const coin = (x: number, y: number, r: number) => (
    <G key={x}>
      <Circle cx={x} cy={y} r={r} fill={GOLD} stroke="#C98F1A" strokeWidth={1.5} />
      <Circle cx={x} cy={y} r={r * 0.55} fill="none" stroke="#C98F1A" strokeWidth={1.2} />
    </G>
  );
  return (
    <Frame label="An open ledger book listing Time, Sleep, Closeness and Self respect, with coins leaving it">
      <Rect x={10} y={22} width={210} height={142} rx={8} fill={k.acc} />
      <Rect x={16} y={28} width={100} height={130} rx={3} fill={WHITE} />
      <Rect x={118} y={28} width={96} height={130} rx={3} fill={WHITE} />
      {rows.map((s, i) => {
        const y = 58 + i * 28;
        return (
          <G key={s}>
            <Say x={24} y={y} s={s} fill={BEAR_LINE} size={12} anchor="start" />
            <Line x1={22} y1={y + 7} x2={108} y2={y + 7} stroke="#E3DFF2" strokeWidth={2} />
            <Circle cx={132} cy={y - 4} r={4} fill={GOLD} />
            <Line x1={142} y1={y - 4} x2={142 + 22 + ((i * 17) % 30)} y2={y - 4} stroke="#C9C4E6" strokeWidth={3} strokeLinecap="round" />
          </G>
        );
      })}
      <Path d="M206 70 Q244 74 270 44" stroke={k.muted} strokeWidth={2} strokeDasharray="2 6" strokeLinecap="round" fill="none" />
      {coin(236, 96, 10)}
      {coin(256, 70, 8.5)}
      {coin(274, 42, 7)}
      <Cap k={k} s="What has it been collecting?" />
    </Frame>
  );
}

/* ---------- lesson 41: Pleasure Island ---------- */
function Donkey({ x, y, s = 1, droop, children }: { x: number; y: number; s?: number; droop?: boolean; children?: ReactNode }) {
  const dark = '#7D8396';
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      {[-12, -7, 7, 12].map((lx) => (
        <G key={lx}>
          <Rect x={lx - 2.3} y={-14} width={4.6} height={14} fill={dark} />
          <Rect x={lx - 2.6} y={-3} width={5.2} height={3} fill="#4B4F5E" />
        </G>
      ))}
      <Path d="M-17 -22 Q-25 -20 -22 -9" stroke={dark} strokeWidth={2.6} strokeLinecap="round" fill="none" />
      <Ellipse cx={0} cy={-20} rx={18} ry={9} fill={GRAY} />
      {droop ? (
        <G>
          <Path d="M10 -25 L19 -12 L26 -16 L18 -29 Z" fill={GRAY} />
          <Ellipse cx={26} cy={-8} rx={5.5} ry={8.5} fill={GRAY} />
          <Ellipse cx={27} cy={-2} rx={4} ry={3} fill="#D9D9E3" />
          <Ellipse cx={20} cy={-15} rx={2.6} ry={6.5} fill={dark} transform="rotate(55 20 -15)" />
          <Circle cx={28} cy={-10} r={1.2} fill={BEAR_LINE} />
        </G>
      ) : (
        <G>
          <Path d="M10 -26 L16 -38 L23 -34 L17 -20 Z" fill={GRAY} />
          <Ellipse cx={23} cy={-35} rx={8.5} ry={5} fill={GRAY} transform="rotate(20 23 -35)" />
          <Ellipse cx={30} cy={-32} rx={3.6} ry={3.2} fill="#D9D9E3" />
          <Ellipse cx={17} cy={-45} rx={2.6} ry={7} fill={dark} transform="rotate(-10 17 -45)" />
          <Ellipse cx={22} cy={-45} rx={2.6} ry={7} fill={GRAY} transform="rotate(14 22 -45)" />
          <Circle cx={25} cy={-37} r={1.2} fill={BEAR_LINE} />
        </G>
      )}
      {children}
    </G>
  );
}

/* a boy for the story of the caps: a cap pulled low or bare, donkey ears growing, an optional pretend smile, and arms pulling the cap down */
function CapBoy({
  x,
  y,
  s = 1,
  dir = 1,
  fill,
  face,
  ear = 14,
  cap = true,
  capFill,
  smile,
  pull,
}: {
  x: number;
  y: number;
  s?: number;
  dir?: 1 | -1;
  fill: string;
  face: string;
  ear?: number;
  cap?: boolean;
  capFill?: string;
  smile?: boolean;
  pull?: boolean;
}) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s * dir} ${s})`}>
      {cap
        ? [-1, 1].map((side) => {
            const cx = side * (15 + ear * 0.35);
            const cy = -52 - ear * 0.15;
            return <Ellipse key={side} cx={cx} cy={cy} rx={ear * 0.55 + 2} ry={3.4} fill={GRAY} transform={`rotate(${-side * 25} ${cx} ${cy})`} />;
          })
        : [-1, 1].map((side) => {
            const cx = side * (6 + ear * 0.2);
            const cy = -58 - ear * 0.4;
            const ry = ear * 0.6 + 3;
            return (
              <G key={side} transform={`rotate(${side * 18} ${cx} ${cy})`}>
                <Ellipse cx={cx} cy={cy} rx={3.6} ry={ry} fill={GRAY} />
                <Ellipse cx={cx} cy={cy + 1} rx={1.6} ry={ry * 0.7} fill="#F7C6D0" />
              </G>
            );
          })}
      <Person x={0} y={0} s={1} fill={fill} face={face} />
      {smile ? <Path d="M-3.5 -43.5 Q1.5 -39.5 6.5 -43.5" stroke={face} strokeWidth={1.4} strokeLinecap="round" fill="none" /> : null}
      {cap ? (
        <G>
          <Path d="M-12.5 -50 Q-12.5 -64 0 -64 Q12.5 -64 12.5 -50 Z" fill={capFill || '#E8A92A'} />
          <Rect x={3} y={-53} width={15} height={3.6} rx={1.8} fill={capFill || '#E8A92A'} />
        </G>
      ) : null}
      {pull ? (
        <G stroke={fill} strokeWidth={5} strokeLinecap="round" fill="none">
          <Path d="M15 -30 Q27 -42 13 -54" />
          <Path d="M-15 -30 Q-27 -42 -13 -54" />
        </G>
      ) : null}
    </G>
  );
}

function Tent({ x, y, w, h, a, b }: { x: number; y: number; w: number; h: number; a: string; b: string }) {
  return (
    <G>
      <Path d={`M${x} ${y} L${x + w / 2} ${y - h} L${x + w} ${y} Z`} fill={a} />
      <Path d={`M${x + w * 0.34} ${y} L${x + w / 2} ${y - h} L${x + w * 0.66} ${y} Z`} fill={b} />
      <Path d={`M${x + w * 0.4} ${y} L${x + w / 2} ${y - h * 0.34} L${x + w * 0.6} ${y} Z`} fill="#3A2A66" />
      <Line x1={x + w / 2} y1={y - h} x2={x + w / 2} y2={y - h - 14} stroke={BROWN} strokeWidth={2} />
      <Path d={`M${x + w / 2} ${y - h - 14} L${x + w / 2 + 12} ${y - h - 10} L${x + w / 2} ${y - h - 5} Z`} fill={b} />
    </G>
  );
}

function CoachRide({ k }: { k: Ink }) {
  return (
    <Frame label="A coach pulled by small donkeys, with a coachman on top and happy boys climbing in, on a road toward bright tents">
      <Tent x={236} y={150} w={44} h={40} a="#E85D5D" b={GOLD} />
      <Tent x={268} y={150} w={30} h={26} a="#4DA3E8" b={WHITE} />
      <Rect x={10} y={150} width={280} height={14} rx={7} fill={k.soft} />
      <Line x1={140} y1={118} x2={188} y2={116} stroke={BROWN} strokeWidth={3} strokeLinecap="round" />
      <Donkey x={196} y={150} s={1} />
      <Donkey x={228} y={152} s={0.9} />
      <Rect x={62} y={78} width={78} height={46} rx={8} fill={k.acc} />
      <Rect x={58} y={72} width={86} height={8} rx={4} fill={GOLD} />
      <Rect x={72} y={88} width={20} height={18} rx={3} fill={WHITE} opacity={0.9} />
      <Rect x={104} y={88} width={20} height={18} rx={3} fill={WHITE} opacity={0.9} />
      <Person x={118} y={74} s={0.6} fill={k.ink} face={k.bg} />
      <Path d="M109 41 L127 41 L124 36 L112 36 Z" fill={BROWN} />
      {[82, 124].map((cx) => (
        <G key={cx}>
          <Circle cx={cx} cy={136} r={14} fill="#5A3B1E" />
          <Circle cx={cx} cy={136} r={4} fill={GOLD} />
          <Path d={`M${cx - 12} ${136} L${cx + 12} ${136} M${cx} ${124} L${cx} ${148}`} stroke={GOLD} strokeWidth={1.6} />
        </G>
      ))}
      <Person x={28} y={150} s={0.6} fill={k.ink} face={k.bg} />
      <Path d="M20 130 L14 112 M36 130 L42 112" stroke={k.ink} strokeWidth={3.6} strokeLinecap="round" />
      <Person x={48} y={152} s={0.6} fill={k.acc} face={k.bg} />
      <Cap k={k} s="A free ride, and nothing asked" />
    </Frame>
  );
}

function ToyLand({ k }: { k: Ink }) {
  const balls: [number, string][] = [
    [108, '#4DA3E8'],
    [194, '#E85D5D'],
    [270, GOLD],
  ];
  return (
    <Frame label="Bright tents, flags and balls, and a little week calendar showing six Thursdays and one Sunday">
      <Line x1={14} y1={106} x2={286} y2={106} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      <Tent x={22} y={106} w={72} h={58} a="#E85D5D" b={GOLD} />
      <Tent x={118} y={106} w={72} h={70} a="#4DA3E8" b={WHITE} />
      <Tent x={214} y={106} w={72} h={52} a="#8B5CCB" b="#F7C6D0" />
      {balls.map(([x, c]) => (
        <G key={x}>
          <Circle cx={x} cy={98} r={8} fill={c} stroke={BEAR_LINE} strokeWidth={1.2} />
          <Path d={`M${x - 8} 98 Q${x} 92 ${x + 8} 98`} stroke={WHITE} strokeWidth={1.6} fill="none" />
        </G>
      ))}
      {Array.from({ length: 7 }, (_, i) => {
        const x = 20 + i * 38;
        const sun = i === 6;
        return (
          <G key={i}>
            <Rect x={x} y={124} width={34} height={40} rx={7} fill={sun ? GOLD : WHITE} stroke={sun ? '#C98F1A' : BEAR_LINE} strokeWidth={sun ? 2 : 1} />
            <Rect x={x} y={124} width={34} height={9} rx={4} fill={sun ? '#E8A92A' : k.acc} />
            <Say x={x + 17} y={154} s={sun ? 'Sun' : 'Thu'} fill={BEAR_LINE} size={11} />
          </G>
        );
      })}
      <Cap k={k} s="Six Thursdays and one Sunday" />
    </Frame>
  );
}

function CapEars({ k }: { k: Ink }) {
  return (
    <Frame label="A boy pulling his cap down hard, with the long tips of donkey ears peeking out from under it">
      <Line x1={20} y1={174} x2={280} y2={174} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      <CapBoy x={150} y={174} s={2.3} fill={k.ink} face={k.bg} ear={16} capFill={k.acc} pull />
      <Path d="M86 74 Q82 84 86 90 Q92 86 90 78 Z" fill="#7FB7F0" />
      <Path d="M212 70 Q208 80 212 86 Q218 82 216 74 Z" fill="#7FB7F0" />
      <Cap k={k} s="He hid it first" />
    </Frame>
  );
}

function TwoCaps({ k }: { k: Ink }) {
  return (
    <Frame label="Two boys facing each other, both with caps pulled low and donkey ear tips peeking out, each pretending nothing is wrong">
      <Line x1={14} y1={170} x2={286} y2={170} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      <CapBoy x={88} y={170} s={1.7} fill={k.ink} face={k.bg} ear={13} capFill={k.acc} smile />
      <CapBoy x={212} y={170} s={1.7} dir={-1} fill={k.acc} face={k.bg} ear={11} capFill="#E8A92A" smile />
      <Path d="M130 100 L170 100" stroke={k.muted} strokeWidth={2.5} strokeDasharray="2 7" strokeLinecap="round" />
      <Cap k={k} s="Each one pretending" />
    </Frame>
  );
}

function FreeDays({ k }: { k: Ink }) {
  return (
    <Frame label="Five small frames in a row, the same boy in each, and his donkey ears a little longer in each one">
      {[0, 1, 2, 3, 4].map((i) => {
        const x = 9 + i * 58;
        return (
          <G key={i}>
            <Rect x={x} y={24} width={50} height={120} rx={9} fill={k.soft} />
            <CapBoy x={x + 25} y={134} s={0.95} fill={k.ink} face={k.bg} cap={false} ear={5 + i * 4.5} />
            <Say x={x + 25} y={162} s={String(i + 1)} fill={k.muted} size={12} />
          </G>
        );
      })}
      <Cap k={k} s="Five months of free days" />
    </Frame>
  );
}

function DonkeyLoad({ k }: { k: Ink }) {
  const sack = (cx: number, cy: number, c: string) => (
    <G key={cx + ',' + cy}>
      <Path
        d={`M${cx - 11} ${cy + 9} Q${cx - 14} ${cy - 2} ${cx - 6} ${cy - 9} L${cx - 4} ${cy - 12} L${cx + 4} ${cy - 12} L${cx + 6} ${cy - 9} Q${cx + 14} ${cy - 2} ${cx + 11} ${cy + 9} Z`}
        fill={c}
        stroke="#7A5530"
        strokeWidth={0.8}
      />
      <Line x1={cx - 5} y1={cy - 8} x2={cx + 5} y2={cy - 8} stroke="#7A5530" strokeWidth={1.6} />
    </G>
  );
  return (
    <Frame label="A tired donkey with its head low, carrying a heavy load of sacks on its back">
      <Line x1={14} y1={170} x2={286} y2={170} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      <Donkey x={126} y={170} s={2.1} droop>
        {sack(-9, -38, '#C9965B')}
        {sack(10, -38, '#B5824A')}
        {sack(0, -56, '#E3C28F')}
        <Path d="M-14 -30 Q0 -26 14 -30" stroke="#5A3B1E" strokeWidth={2} fill="none" />
        <Path d="M33 -22 Q31 -17 33 -14 Q37 -17 35 -21 Z" fill="#7FB7F0" />
        <Path d="M40 -28 Q38 -23 40 -20 Q44 -23 42 -27 Z" fill="#7FB7F0" />
      </Donkey>
      <Cap k={k} s="Sold to carry loads" />
    </Frame>
  );
}

function BigFish({ k }: { k: Ink }) {
  return (
    <Frame label="A giant fish with its mouth open, and inside it a small candle with two tiny figures, an old man and a boy">
      <G transform="translate(18 4) scale(0.9)">
        <Path d="M236 100 L292 62 Q278 100 292 138 Z" fill="#486B93" />
        <Path d="M120 22 Q150 -4 190 40 Z" fill="#486B93" />
        <Path d="M120 178 Q150 200 190 160 Z" fill="#486B93" />
        <Path d="M26 52 Q40 14 110 18 Q200 24 238 90 L238 110 Q200 176 110 182 Q40 186 26 148 Z" fill="#5B7FA8" />
        <Path d="M30 150 Q60 186 120 182 Q200 176 238 110 Q150 138 30 150 Z" fill="#8FB0D0" />
        <Path d="M26 56 L150 100 L26 144 Z" fill="#241A44" />
        <Path d="M26 56 L150 100 L26 144" fill="none" stroke="#3E5C84" strokeWidth={3} strokeLinejoin="round" />
        <Circle cx={62} cy={118} r={26} fill={GOLD} opacity={0.28} />
        <Rect x={58.5} y={118} width={7} height={19} rx={1.5} fill="#F4EFE0" />
        <Path d="M62 108 Q67 114 62 119 Q57 114 62 108 Z" fill={GOLD} />
        <Person x={90} y={128} s={0.42} fill="#E8E4F5" face="#241A44" />
        <Ellipse cx={90} cy={110} rx={4} ry={4.5} fill="#B9B5CF" />
        <Person x={108} y={118} s={0.3} fill={GOLD} face="#241A44" />
        <Circle cx={96} cy={52} r={8} fill={WHITE} />
        <Circle cx={99} cy={53} r={4} fill={BEAR_LINE} />
        <Path d="M170 46 Q184 100 168 150" stroke="#486B93" strokeWidth={4} strokeLinecap="round" fill="none" />
      </G>
      <Circle cx={22} cy={30} r={4} fill="none" stroke={k.muted} strokeWidth={1.6} />
      <Circle cx={36} cy={16} r={2.6} fill="none" stroke={k.muted} strokeWidth={1.6} />
      <Cap k={k} s="His father, inside" />
    </Frame>
  );
}

function Wheel({ k }: { k: Ink }) {
  const spokes = Array.from({ length: 8 }, (_, i) => (i * Math.PI) / 4);
  return (
    <Frame label="A boy leaning his whole weight into a heavy wheel to turn it, with a glass of milk waiting on a stool beside it">
      <Line x1={14} y1={170} x2={286} y2={170} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      <Path d="M190 98 L158 170 M190 98 L222 170" stroke={BROWN} strokeWidth={6} strokeLinecap="round" />
      <Circle cx={190} cy={98} r={50} fill="none" stroke={BROWN} strokeWidth={8} />
      {spokes.map((a) => (
        <Line key={a} x1={190} y1={98} x2={190 + Math.cos(a) * 50} y2={98 + Math.sin(a) * 50} stroke="#B5824A" strokeWidth={4} />
      ))}
      <Circle cx={190} cy={98} r={8} fill={GOLD} stroke="#C98F1A" strokeWidth={2} />
      <Path d="M158 38 Q190 20 224 36" stroke={k.acc} strokeWidth={4} strokeLinecap="round" fill="none" />
      <Path d="M214 26 L225 36 L211 40" stroke={k.acc} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <G transform="rotate(16 90 170)">
        <Person x={90} y={170} s={1.3} fill={k.ink} face={k.bg} />
      </G>
      <Path d="M104 126 L142 112" stroke={k.ink} strokeWidth={6} strokeLinecap="round" />
      <Rect x={250} y={142} width={34} height={6} rx={2} fill={BROWN} />
      <Rect x={254} y={148} width={5} height={22} fill={BROWN} />
      <Rect x={275} y={148} width={5} height={22} fill={BROWN} />
      <Path d="M258 116 L276 116 L274 142 L260 142 Z" fill={WHITE} stroke={BEAR_LINE} strokeWidth={1.6} strokeLinejoin="round" />
      <Path d="M259 124 L275 124 L274 142 L260 142 Z" fill="#F4F0FF" />
      <Path d="M286 112 l0 8 M282 116 l8 0" stroke={GOLD} strokeWidth={2.4} strokeLinecap="round" />
      <Cap k={k} s="Every day, for months" />
    </Frame>
  );
}

function RealBoy({ k }: { k: Ink }) {
  const still = useReducedMotion();
  const v = useAppear(400, 1800, Easing.out(Easing.cubic));
  const [p, setP] = useState(still ? 1 : 0);
  useEffect(() => {
    const id = v.addListener(({ value }) => setP(value));
    return () => v.removeListener(id);
  }, [v]);
  const n = 9;
  const lit = Math.floor(p * n + 0.0001);
  const glow = Math.max(0, Math.min(1, (p - 0.75) / 0.25));
  return (
    <Frame label="A row of small squares for ordinary days filling in one by one, ending at a boy standing tall in golden sunlight">
      <Circle cx={246} cy={125} r={51} fill="none" stroke={GOLD} strokeWidth={3} opacity={glow * 0.6} />
      <Circle cx={246} cy={125} r={46 * (0.6 + 0.4 * glow)} fill={GOLD} opacity={glow} />
      <Line x1={14} y1={172} x2={286} y2={172} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      {Array.from({ length: n }, (_, i) => (
        <Rect key={i} x={10 + i * 20} y={146} width={16} height={16} rx={4} fill={i < lit ? k.acc : k.line} opacity={i < lit ? 1 : 0.45} />
      ))}
      <G opacity={0.35 + 0.65 * glow}>
        <Person x={246} y={160} s={1.2} fill={glow > 0.5 ? BEAR_LINE : k.ink} face={glow > 0.5 ? GOLD : k.bg} />
      </G>
      <Cap k={k} s="A run of ordinary days" />
    </Frame>
  );
}

export const SCENES_D: Record<string, ComponentType<{ k: Ink }>> = {
  'far-away': FarAway,
  files: Files,
  'same-man': SameMan,
  campus: Campus,
  court: Court,
  'debt-paid': DebtPaid,
  scissors: Scissors,
  'rope-cuts': RopeCuts,
  robe: Robe,
  ledger: Ledger,
  'coach-ride': CoachRide,
  'toy-land': ToyLand,
  'cap-ears': CapEars,
  'two-caps': TwoCaps,
  'free-days': FreeDays,
  'donkey-load': DonkeyLoad,
  'big-fish': BigFish,
  wheel: Wheel,
  'real-boy': RealBoy,
};
