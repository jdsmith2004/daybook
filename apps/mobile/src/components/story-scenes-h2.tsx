/* Scenes for lessons told as a story (see story-kit.tsx and story-scenes-h.tsx): lesson 46 (the old story of the walk out of Egypt:
   the fish remembered, the bricks left out, the land in between, the food that came each morning). Drawn plainly, as an old story. */
import { type ComponentType } from 'react';
import { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';

import { Frame, type Ink, Person, Say } from './story-kit';

const SAND = '#E9C98B';
const DUNE = '#D9A85B';
const DEEP = '#C48F45';
const LIGHT = '#F6E2B0';
const PEACH = '#F8D2B0';
const BLUE = '#CFE3F0';
const STONE = '#D8B878';
const STONE_D = '#BE9A57';
const MUD = '#CDA06A';
const BROWN = '#8A5A2B';
const GREEN = '#3F8F5B';
const GREEN_L = '#7FBF8E';
const CREAM = '#FFFBF0';
const GOLD = '#FFD25A';
const DARK = '#2A1E5C';
const WATER = '#8CC4E6';
const SKINS = ['#A8683F', '#8E5A34', '#B87B4B'];
const ROBES = ['#B5533C', '#3F7C8F', '#8A5FA8', '#D49A2B', '#5E8C4A', '#C46A8A'];

/* the line of words under a picture */
function Cap({ k, s }: { k: Ink; s: string }) {
  return <Say x={150} y={190} s={s} fill={k.ink} />;
}

/* the picture's own panel and the ground at its foot, with rounded corners, so it reads on a light page and a dark one */
function Panel({ fill }: { fill: string }) {
  return <Rect x={10} y={10} width={280} height={152} rx={14} fill={fill} />;
}
function Ground({ y, fill }: { y: number; fill: string }) {
  return <Path d={`M10 ${y} L290 ${y} L290 148 Q290 162 276 162 L24 162 Q10 162 10 148 Z`} fill={fill} />;
}

/* a pyramid: the lit side on the left, the shade on the right */
function Pyramid({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  return (
    <G>
      <Path d={`M${x - w / 2} ${y} L${x} ${y - h} L${x} ${y} Z`} fill={STONE} />
      <Path d={`M${x} ${y - h} L${x + w / 2} ${y} L${x} ${y} Z`} fill={STONE_D} />
    </G>
  );
}
/* a flat-roofed house */
function House({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  return (
    <G>
      <Rect x={x} y={y - h} width={w} height={h} fill={MUD} />
      <Rect x={x - 1.5} y={y - h - 3} width={w + 3} height={4} rx={1.5} fill={DEEP} />
      <Rect x={x + w * 0.2} y={y - h * 0.55} width={w * 0.22} height={h * 0.3} fill={BROWN} />
      <Rect x={x + w * 0.62} y={y - h * 0.38} width={w * 0.2} height={h * 0.38} rx={1.5} fill={BROWN} />
    </G>
  );
}

/* a person walking, small, in a robe: a bundle on the shoulder, or a bowl on the head */
function Walker({
  x,
  y,
  s = 1,
  robe,
  skin,
  cloth,
  bundle,
  bowl,
}: {
  x: number;
  y: number;
  s?: number;
  robe: string;
  skin: string;
  cloth?: string;
  bundle?: string;
  bowl?: boolean;
}) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      {bundle ? (
        <G>
          <Line x1={-14} y1={-33} x2={5} y2={-24} stroke={BROWN} strokeWidth={1.8} strokeLinecap="round" />
          <Path d="M-14 -32 Q-20 -24 -15 -20 Q-9 -19 -8 -26 Z" fill={bundle} />
          <Circle cx={-13} cy={-32} r={1.9} fill={BROWN} />
        </G>
      ) : null}
      <Path d="M-7 0 L-5 -20 Q0 -24 5 -20 L8 0 L1.5 0 L0 -6 L-1.5 0 Z" fill={robe} />
      <Circle cx={0} cy={-28} r={5.6} fill={skin} />
      {cloth ? <Path d="M-5.9 -28 A5.9 5.9 0 0 1 5.9 -28 Z" fill={cloth} /> : null}
      {bowl ? (
        <G>
          <Path d="M-9 -35 Q0 -47 9 -35 Z" fill="#FFF8E8" />
          <Ellipse cx={0} cy={-34.5} rx={13} ry={3.4} fill={BROWN} />
          <Line x1={4} y1={-21} x2={9} y2={-33} stroke={robe} strokeWidth={2.4} strokeLinecap="round" />
        </G>
      ) : null}
    </G>
  );
}

/* a person sitting slumped on the sand, head low */
function Slumped({ x, y, s = 1, robe, skin, flip }: { x: number; y: number; s?: number; robe: string; skin: string; flip?: boolean }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      <Path d="M-12 0 Q-13 -17 -2 -21 Q9 -23 12 -11 Q14 -4 14 0 Z" fill={robe} />
      <Circle cx={8} cy={-19} r={5.4} fill={skin} />
      <Ellipse cx={13} cy={-5} rx={6} ry={5} fill={robe} />
      <Ellipse cx={13} cy={-5} rx={6} ry={5} fill={DARK} opacity={0.18} />
    </G>
  );
}

/* a thought cloud made of soft rounds; `rim` lays a slightly larger cloud of that color under it as an outline. The drawn size is about
   0.88 of w across and 0.92 of h down, with the top at cy - 0.5 h. */
function Puff({ cx, cy, w, h, fill, rim }: { cx: number; cy: number; w: number; h: number; fill: string; rim?: string }) {
  const draw = (ww: number, hh: number, c: string) => (
    <G fill={c}>
      <Ellipse cx={cx} cy={cy} rx={ww * 0.44} ry={hh * 0.36} />
      <Circle cx={cx - ww * 0.24} cy={cy - hh * 0.16} r={hh * 0.26} />
      <Circle cx={cx} cy={cy - hh * 0.22} r={hh * 0.28} />
      <Circle cx={cx + ww * 0.24} cy={cy - hh * 0.16} r={hh * 0.26} />
      <Circle cx={cx - ww * 0.28} cy={cy + hh * 0.14} r={hh * 0.22} />
      <Circle cx={cx + ww * 0.28} cy={cy + hh * 0.14} r={hh * 0.22} />
      <Circle cx={cx} cy={cy + hh * 0.18} r={hh * 0.24} />
    </G>
  );
  return (
    <G>
      {rim ? draw(w + 7, h + 7, rim) : null}
      {draw(w, h, fill)}
    </G>
  );
}
/* the two small rounds that tie a thought to the one thinking it */
function Beads({ x, y, dx, dy, fill, rim }: { x: number; y: number; dx: number; dy: number; fill: string; rim?: string }) {
  return (
    <G>
      {rim ? <Circle cx={x} cy={y} r={6.5} fill={rim} /> : null}
      {rim ? <Circle cx={x + dx} cy={y + dy} r={4.5} fill={rim} /> : null}
      <Circle cx={x} cy={y} r={4.6} fill={fill} />
      <Circle cx={x + dx} cy={y + dy} r={2.8} fill={fill} />
    </G>
  );
}

/* ---------- the food, drawn centered on (0, 0) and placed with x, y, s ---------- */
function Fish({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Path d="M-20 0 L-37 -12 Q-32 0 -37 12 Z" fill="#4F7FAA" />
      <Path d="M-4 -12 Q4 -23 13 -10 Z" fill="#4F7FAA" />
      <Path d="M-22 0 Q-6 -15 16 -9 Q27 -5 31 0 Q27 5 16 9 Q-6 15 -22 0 Z" fill="#6E9BC2" />
      <Ellipse cx={5} cy={5} rx={18} ry={3.2} fill="#C8DDEB" />
      <Path d="M14 -7 Q10 0 14 7" stroke="#3E6A92" strokeWidth={1.6} fill="none" strokeLinecap="round" />
      <Circle cx={23} cy={-2} r={2.3} fill={DARK} />
      <Circle cx={23.7} cy={-2.8} r={0.8} fill="#FFFFFF" />
      <Path d="M28 2 Q30 3 31 1" stroke="#3E6A92" strokeWidth={1.2} fill="none" strokeLinecap="round" />
    </G>
  );
}
function Melon({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Ellipse cx={0} cy={0} rx={25} ry={19} fill="#6FB07A" />
      <G stroke="#2F7A4B" strokeWidth={3.2} fill="none" strokeLinecap="round">
        <Path d="M-13 -16 Q-19 0 -13 16" />
        <Path d="M0 -19 Q-5 0 0 19" />
        <Path d="M13 -16 Q19 0 13 16" />
      </G>
      <Ellipse cx={-10} cy={-9} rx={5} ry={2.6} fill="#FFFFFF" opacity={0.35} transform="rotate(-35 -10 -9)" />
      <Path d="M0 -19 Q3 -26 8 -25" stroke={BROWN} strokeWidth={2.4} fill="none" strokeLinecap="round" />
    </G>
  );
}
function Cucumber({ x, y, s = 1, r = 0 }: { x: number; y: number; s?: number; r?: number }) {
  return (
    <G transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
      <Rect x={-24} y={-6.5} width={48} height={13} rx={6.5} fill="#4FA36B" />
      <Rect x={-19} y={-4.5} width={34} height={2.6} rx={1.3} fill="#8BCB9B" />
      <Circle cx={-9} cy={3} r={1} fill="#2F7A4B" />
      <Circle cx={2} cy={3.4} r={1} fill="#2F7A4B" />
      <Circle cx={12} cy={2.6} r={1} fill="#2F7A4B" />
    </G>
  );
}
function Onion({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Path d="M0 -15 Q2 -9 11 -2 Q15 12 0 14 Q-15 12 -11 -2 Q-2 -9 0 -15 Z" fill="#DB93A8" />
      <Path d="M-2 -10 Q-9 0 -4 12 M3 -10 Q9 0 4 12" stroke="#B5617F" strokeWidth={1.3} fill="none" strokeLinecap="round" />
      <Path d="M0 -15 L-1 -20 M0 -15 L2 -19" stroke="#B5A06A" strokeWidth={1.6} strokeLinecap="round" />
      <Path d="M-3 14 L-4 18 M0 14 L0 18 M3 14 L4 18" stroke="#E9DCC0" strokeWidth={1.2} strokeLinecap="round" />
    </G>
  );
}
function Leek({ x, y, s = 1, r = 0 }: { x: number; y: number; s?: number; r?: number }) {
  return (
    <G transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
      <Rect x={-4.5} y={0} width={9} height={22} rx={3} fill="#F1F2D8" />
      <Path d="M-4.5 2 Q-14 -14 -9 -30 Q-5 -18 -1 -4 Z" fill="#5FA85E" />
      <Path d="M4.5 2 Q14 -12 10 -28 Q4 -18 1 -4 Z" fill="#4C9650" />
      <Path d="M-1 -2 Q-2 -20 1 -34 Q4 -20 1 -2 Z" fill="#6DB96B" />
      <Path d="M-3 22 L-4 27 M0 22 L0 27 M3 22 L4 26" stroke="#E9DCC0" strokeWidth={1.2} strokeLinecap="round" />
    </G>
  );
}
function Garlic({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Path d="M0 -14 Q4 -8 10 0 Q13 11 0 12 Q-13 11 -10 0 Q-4 -8 0 -14 Z" fill="#F6EEDB" stroke="#D8C9A8" strokeWidth={1} />
      <Path d="M0 -12 Q-6 0 -2 11 M0 -12 Q6 0 2 11" stroke="#D8C9A8" strokeWidth={1.2} fill="none" strokeLinecap="round" />
      <Path d="M0 -14 L0 -19" stroke="#C9B58A" strokeWidth={2} strokeLinecap="round" />
    </G>
  );
}
function Pot({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <G stroke="#B8B0A0" strokeWidth={2.2} fill="none" strokeLinecap="round">
        <Path d="M-7 -17 Q-11 -23 -7 -29 Q-4 -34 -8 -38" />
        <Path d="M1 -17 Q-3 -23 1 -29 Q4 -34 0 -38" />
        <Path d="M9 -17 Q5 -23 9 -29 Q12 -34 8 -38" />
      </G>
      <Circle cx={-18} cy={-4} r={3.2} fill="none" stroke="#8E3E2C" strokeWidth={2} />
      <Circle cx={18} cy={-4} r={3.2} fill="none" stroke="#8E3E2C" strokeWidth={2} />
      <Path d="M-15 -10 L15 -10 L13 6 Q0 15 -13 6 Z" fill="#B5533C" />
      <Rect x={-17} y={-14} width={34} height={5.5} rx={2.7} fill="#8E3E2C" />
      <Ellipse cx={-6} cy={-2} rx={3} ry={1.6} fill="#FFFFFF" opacity={0.25} />
    </G>
  );
}
function Loaf({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Ellipse cx={0} cy={0} rx={13} ry={9} fill="#D79A4A" />
      <Ellipse cx={-3} cy={-3} rx={8} ry={4} fill="#E6B268" />
      <Path d="M-6 -5 L-3 3 M0 -6 L3 3 M6 -4 L8 2" stroke="#A8672A" strokeWidth={1.7} strokeLinecap="round" />
    </G>
  );
}
function Spark({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return <Path d="M0 -5 L1.5 -1.5 L5 0 L1.5 1.5 L0 5 L-1.5 1.5 L-5 0 L-1.5 -1.5 Z" fill="#FFC83D" transform={`translate(${x} ${y}) scale(${s})`} />;
}

/* ---------- one night out ---------- */
function Leaving({ k }: { k: Ink }) {
  const walkers = [
    { x: 132, y: 150, robe: ROBES[0], skin: SKINS[0], bundle: '#D9B98A' },
    { x: 154, y: 153, robe: ROBES[1], skin: SKINS[1], cloth: '#E9D9B0' },
    { x: 176, y: 150, robe: ROBES[3], skin: SKINS[2], bundle: '#B8864A', cloth: ROBES[0] },
    { x: 198, y: 154, robe: ROBES[4], skin: SKINS[1], bundle: '#D9B98A', cloth: '#E9D9B0' },
    { x: 220, y: 150, robe: ROBES[5], skin: SKINS[2], bundle: '#C9965B' },
    { x: 246, y: 153, robe: ROBES[2], skin: SKINS[0], bowl: true },
  ];
  return (
    <Frame label="At dawn, a line of people carrying bundles and a bowl of flat dough walks away from a city of flat-roofed houses with a pyramid behind it">
      <Panel fill={PEACH} />
      <Rect x={10} y={84} width={280} height={44} fill="#FBE3C8" />
      <Ellipse cx={70} cy={46} rx={30} ry={4.5} fill="#FBE3C8" />
      <Ellipse cx={104} cy={56} rx={20} ry={3.5} fill="#FBE3C8" />
      <Ellipse cx={212} cy={38} rx={28} ry={4.5} fill="#FBE3C8" />
      <Ellipse cx={246} cy={50} rx={18} ry={3.5} fill="#FBE3C8" />
      <Circle cx={262} cy={128} r={30} fill="#FFE9B8" opacity={0.5} />
      <Circle cx={262} cy={128} r={19} fill="#FFE08A" />
      <Pyramid x={88} y={130} w={86} h={72} />
      <House x={16} y={130} w={28} h={30} />
      <House x={46} y={130} w={22} h={20} />
      <House x={70} y={130} w={26} h={34} />
      <House x={98} y={130} w={22} h={22} />
      <Ground y={128} fill={SAND} />
      <Path d="M10 140 Q70 128 130 142 Q200 154 290 134 L290 148 Q290 162 276 162 L24 162 Q10 162 10 148 Z" fill={DUNE} />
      {walkers.map((w, i) => (
        <Walker key={i} x={w.x} y={w.y} s={1.25} robe={w.robe} skin={w.skin} cloth={w.cloth} bundle={w.bundle} bowl={w.bowl} />
      ))}
      <Cap k={k} s="Out in one night" />
    </Frame>
  );
}

/* ---------- they missed Egypt ---------- */
function Missing({ k }: { k: Ink }) {
  return (
    <Frame label="A hot desert under a pale sun: a few people sit slumped on the sand, and above them one big thought of a steaming pot and two round loaves">
      <Panel fill="#F7DFA9" />
      <Circle cx={256} cy={38} r={25} fill="#FFF0C0" opacity={0.6} />
      <Circle cx={256} cy={38} r={15} fill="#FFF6DA" />
      <Path d="M10 112 Q70 84 140 108 Q200 128 290 96 L290 148 L10 148 Z" fill="#E3B96F" />
      <Path d="M10 132 Q80 118 150 134 Q220 148 290 128 L290 148 Q290 162 276 162 L24 162 Q10 162 10 148 Z" fill={SAND} />
      <Path d="M10 150 Q70 142 130 152 Q200 160 290 148 L290 148 Q290 162 276 162 L24 162 Q10 162 10 148 Z" fill={DUNE} />
      <Beads x={128} y={96} dx={-6} dy={11} fill={CREAM} rim="#EBC57C" />
      <Puff cx={150} cy={50} w={160} h={74} fill={CREAM} rim="#EBC57C" />
      <Pot x={122} y={60} s={1.1} />
      <Loaf x={170} y={62} s={1.05} />
      <Loaf x={192} y={52} s={0.95} />
      <Slumped x={52} y={150} s={1.5} robe={ROBES[1]} skin={SKINS[0]} />
      <Slumped x={124} y={154} s={1.4} robe={ROBES[0]} skin={SKINS[1]} flip />
      <Slumped x={188} y={151} s={1.5} robe={ROBES[3]} skin={SKINS[2]} />
      <Slumped x={250} y={154} s={1.35} robe={ROBES[2]} skin={SKINS[0]} flip />
      <Cap k={k} s="They missed Egypt" />
    </Frame>
  );
}

/* ---------- "for free" ---------- */
function FishCloud({ k }: { k: Ink }) {
  return (
    <Frame label="One big bright thought fills the picture: a fish, a striped melon, a cucumber, onions, a leek and garlic, all looking good">
      <Panel fill="#F7DFA9" />
      <Path d="M10 148 Q60 138 110 150 Q190 160 290 144 L290 148 Q290 162 276 162 L24 162 Q10 162 10 148 Z" fill={SAND} />
      <Path d="M10 156 Q80 148 150 158 Q220 164 290 154 L290 148 Q290 162 276 162 L24 162 Q10 162 10 148 Z" fill={DUNE} />
      <Beads x={58} y={158} dx={-8} dy={7} fill={CREAM} rim="#F2C45C" />
      <Puff cx={150} cy={86} w={290} h={150} fill={CREAM} rim="#FFD25A" />
      <Fish x={98} y={80} s={1.3} />
      <Melon x={172} y={66} s={1.05} />
      <Garlic x={224} y={54} s={0.95} />
      <Leek x={238} y={92} s={0.9} r={12} />
      <Cucumber x={192} y={108} s={1} r={-8} />
      <Onion x={110} y={124} s={1} />
      <Onion x={140} y={126} s={0.9} />
      <Spark x={44} y={44} s={1.4} />
      <Spark x={262} y={28} s={1} />
      <Spark x={150} y={26} s={0.8} />
      <Spark x={60} y={110} s={0.8} />
      <Cap k={k} s="“For free”" />
    </Frame>
  );
}

/* ---------- what memory left out ---------- */
const G_PANEL = '#B4AEA2';
const G_GROUND = '#9D978B';
const G_BRICK = '#8B857B';
const G_EDGE = '#6E695F';
const G_FIG = '#5F5B55';
function Brick({ x, y }: { x: number; y: number }) {
  return <Rect x={x} y={y} width={17} height={9} rx={1.5} fill={G_BRICK} stroke={G_EDGE} strokeWidth={0.9} />;
}
function Bricks({ k }: { k: Ink }) {
  return (
    <Frame label="The same bright thought of a fish and a melon, now small in the middle, with the part memory left out dim around it: stacks of mud bricks, a brick mold, a person bent under a load of bricks, and a stern overseer holding a long stick">
      <Panel fill={G_PANEL} />
      <Ground y={150} fill={G_GROUND} />
      {/* the mold and the stack of bricks */}
      <Rect x={20} y={134} width={46} height={16} rx={2} fill="#7E7466" />
      <Rect x={24} y={138} width={17} height={9} fill="#5E574C" />
      <Rect x={45} y={138} width={17} height={9} fill="#5E574C" />
      <Rect x={66} y={140} width={11} height={4} rx={1.5} fill="#7E7466" />
      {[0, 18, 36].map((d) => (
        <Brick key={d} x={80 + d} y={141} />
      ))}
      {[9, 27].map((d) => (
        <Brick key={d} x={80 + d} y={132} />
      ))}
      <Brick x={98} y={123} />
      {/* the person bent under the load */}
      <G transform="translate(206 152)">
        <Path d="M-4 -18 L-8 0 M4 -18 L6 0" stroke={G_FIG} strokeWidth={5} strokeLinecap="round" />
        <Path d="M0 -18 L14 -30" stroke={G_FIG} strokeWidth={11} strokeLinecap="round" />
        <Path d="M12 -27 L19 -12" stroke={G_FIG} strokeWidth={4} strokeLinecap="round" />
        <Circle cx={21} cy={-25} r={5.6} fill="#6E6A63" />
        <Brick x={-16} y={-49} />
        <Brick x={2} y={-49} />
        <Brick x={-11} y={-40} />
        <Brick x={7} y={-40} />
      </G>
      {/* the overseer, standing, with a long stick */}
      <Line x1={282} y1={158} x2={282} y2={90} stroke="#7A6E5C" strokeWidth={3} strokeLinecap="round" />
      <Person x={258} y={158} s={1} fill={G_FIG} face={G_PANEL} />
      <Path d="M262 106 L269 108.5" stroke="#3E3B37" strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M270 130 L281 126" stroke={G_FIG} strokeWidth={4} strokeLinecap="round" />
      {/* the one bright thing: what memory kept */}
      <Beads x={224} y={90} dx={5} dy={9} fill={CREAM} rim="#F2C45C" />
      <Puff cx={158} cy={60} w={150} h={80} fill={CREAM} rim="#FFD25A" />
      <Fish x={132} y={60} s={0.78} />
      <Melon x={184} y={56} s={0.8} />
      <Cap k={k} s="Memory kept the fish" />
    </Frame>
  );
}

/* ---------- the land in between ---------- */
function Between({ k }: { k: Ink }) {
  /* the road, in simple perspective: wide at the bottom, narrowing as it runs back toward the green hills */
  const P = [
    [150, 162],
    [146, 138],
    [238, 142],
    [250, 100],
  ];
  const at = (t: number) => {
    const u = 1 - t;
    const f = (i: number) => u * u * u * P[0][i] + 3 * u * u * t * P[1][i] + 3 * u * t * t * P[2][i] + t * t * t * P[3][i];
    return { x: f(0), y: f(1) };
  };
  const half = (t: number) => 3 + 46 * Math.pow(1 - t, 1.35);
  const ts = Array.from({ length: 25 }, (_, i) => i / 24);
  const left = ts.map((t) => `${(at(t).x - half(t)).toFixed(1)} ${at(t).y.toFixed(1)}`);
  const right = ts.map((t) => `${(at(t).x + half(t)).toFixed(1)} ${at(t).y.toFixed(1)}`).reverse();
  const road = `M${left.join(' L')} L${right.join(' L')} Z`;
  const group = [
    { t: 0.72, s: 0.4, robe: ROBES[4], skin: SKINS[1] },
    { t: 0.66, s: 0.44, robe: ROBES[2], skin: SKINS[0], bundle: '#C9965B' },
    { t: 0.6, s: 0.48, robe: ROBES[3], skin: SKINS[2], cloth: ROBES[0] },
    { t: 0.54, s: 0.52, robe: ROBES[1], skin: SKINS[1] },
    { t: 0.48, s: 0.56, robe: ROBES[0], skin: SKINS[0], bundle: '#D9B98A' },
  ];
  return (
    <Frame label="A wide landscape: a tiny pyramid at the far left, far green hills at the far right, and between them a long sandy road, wide at the bottom and narrowing into the distance, with a small group walking along it">
      <Panel fill={BLUE} />
      <Circle cx={150} cy={36} r={12} fill="#FFE9A8" />
      <Circle cx={150} cy={36} r={20} fill="#FFF3C4" opacity={0.5} />
      <Ground y={100} fill={SAND} />
      <Path d="M10 100 Q50 90 90 100 Q140 108 180 98 Q205 93 240 98 Q265 96 290 100 L290 106 L10 106 Z" fill={DUNE} />
      <Pyramid x={28} y={100} w={28} h={24} />
      <Path d="M196 100 Q230 66 258 88 Q274 72 290 84 L290 100 Z" fill={GREEN_L} />
      <Path d="M222 100 Q256 78 290 96 L290 100 Z" fill={GREEN} />
      <Circle cx={244} cy={88} r={5} fill={GREEN} />
      <Circle cx={270} cy={90} r={4} fill="#2F7A4B" />
      <Path d="M124 160 Q64 156 36 103" stroke={DEEP} strokeWidth={2} strokeDasharray="1 6" strokeLinecap="round" fill="none" opacity={0.8} />
      <Path d={road} fill={LIGHT} stroke={DEEP} strokeWidth={1.4} strokeLinejoin="round" />
      <Path d="M44 150 Q58 144 72 150 M214 156 Q228 150 244 156" stroke={DEEP} strokeWidth={2} fill="none" strokeLinecap="round" />
      {group.map((w, i) => {
        const p = at(w.t);
        return <Walker key={i} x={p.x} y={p.y + 3} s={w.s} robe={w.robe} skin={w.skin} cloth={w.cloth} bundle={w.bundle} />;
      })}
      <Cap k={k} s="The land in between" />
    </Frame>
  );
}

/* ---------- enough for today ---------- */
function Bender({ x, y, s = 1.3, robe, skin }: { x: number; y: number; s?: number; robe: string; skin: string }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Path d="M-2 -16 L-4 0 M4 -16 L6 0" stroke={robe} strokeWidth={7} strokeLinecap="round" />
      <Path d="M0 -17 L14 -25" stroke={robe} strokeWidth={13} strokeLinecap="round" />
      <Circle cx={23} cy={-21} r={5.4} fill={skin} />
      <Path d="M13 -22 L21 -8" stroke={robe} strokeWidth={4} strokeLinecap="round" />
      <Circle cx={22} cy={-6} r={2.2} fill={skin} />
      <Path d="M28 0 L30 -9 L45 -9 L47 0 Z" fill="#B8864A" />
      <Rect x={28} y={-11.5} width={19} height={3.4} rx={1.7} fill={BROWN} />
      <Circle cx={33} cy={-13} r={2.1} fill="#FFFFFF" />
      <Circle cx={38} cy={-14.5} r={2.1} fill="#FFFFFF" />
      <Circle cx={43} cy={-13} r={2.1} fill="#FFFFFF" />
    </G>
  );
}
function Manna({ k }: { k: Ink }) {
  const flakes = Array.from({ length: 70 }, (_, i) => ({
    x: 16 + ((i * 47) % 268),
    y: 118 + ((i * 29) % 42),
    r: 1.3 + (i % 3) * 0.5,
  }));
  return (
    <Frame label="Early morning, a peach sky with the sun just rising: the ground is covered in small white flakes, and three people bend to gather them into baskets">
      <Panel fill={PEACH} />
      <Rect x={10} y={84} width={280} height={44} fill="#FBE3C8" />
      <Circle cx={150} cy={118} r={24} fill="#FFE08A" />
      <G stroke="#FFC95C" strokeWidth={2.6} strokeLinecap="round">
        {[-160, -135, -110, -90, -70, -45, -20].map((a) => {
          const r = (a * Math.PI) / 180;
          return <Line key={a} x1={150 + Math.cos(r) * 31} y1={118 + Math.sin(r) * 31} x2={150 + Math.cos(r) * 40} y2={118 + Math.sin(r) * 40} />;
        })}
      </G>
      <Ground y={118} fill={SAND} />
      {flakes.map((f, i) => (
        <Circle key={i} cx={f.x} cy={f.y} r={f.r} fill="#FFFDF4" />
      ))}
      <Bender x={34} y={150} robe={ROBES[0]} skin={SKINS[0]} />
      <Bender x={116} y={154} robe={ROBES[1]} skin={SKINS[1]} />
      <Bender x={198} y={150} robe={ROBES[2]} skin={SKINS[2]} />
      <Cap k={k} s="Enough for today" />
    </Frame>
  );
}

/* ---------- one night out, then the walk ---------- */
const BEZ = [
  [64, 150],
  [170, 175],
  [80, 60],
  [230, 56],
];
function along(t: number) {
  const u = 1 - t;
  const f = (i: number) => u * u * u * BEZ[0][i] + 3 * u * u * t * BEZ[1][i] + 3 * u * t * t * BEZ[2][i] + t * t * t * BEZ[3][i];
  return { x: f(0), y: f(1) };
}
function Road({ k }: { k: Ink }) {
  const d = `M${BEZ[0][0]} ${BEZ[0][1]} C${BEZ[1][0]} ${BEZ[1][1]} ${BEZ[2][0]} ${BEZ[2][1]} ${BEZ[3][0]} ${BEZ[3][1]}`;
  const here = 0.5;
  const me = along(here);
  return (
    <Frame label="A winding road climbs from a small pyramid at the bottom left to green hills at the top right, with small dots along it like days and one small figure partway">
      <Panel fill="#F0D9A3" />
      <Path d="M146 10 L276 10 Q290 10 290 24 L290 88 Q264 64 238 76 Q212 58 190 66 Q168 42 146 10 Z" fill={GREEN_L} />
      <Path d="M204 10 L276 10 Q290 10 290 24 L290 62 Q262 40 236 54 Q214 36 204 10 Z" fill={GREEN} />
      <Circle cx={262} cy={26} r={8} fill="#2F7A4B" />
      <Circle cx={236} cy={30} r={6} fill="#2F7A4B" />
      <Path d="M14 150 Q60 138 110 152 Q150 162 190 156 Q240 150 290 154 L290 148 Q290 162 276 162 L24 162 Q10 162 10 148 Z" fill={DUNE} />
      <Pyramid x={36} y={158} w={46} h={34} />
      <Path d={d} stroke={DEEP} strokeWidth={17} strokeLinecap="round" fill="none" />
      <Path d={d} stroke={LIGHT} strokeWidth={13} strokeLinecap="round" fill="none" />
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => {
        const t = i / 10;
        if (t === here) return null;
        const p = along(t);
        const done = t < here;
        return <Circle key={i} cx={p.x} cy={p.y} r={3} fill={done ? BROWN : LIGHT} stroke={BROWN} strokeWidth={1.8} />;
      })}
      <Walker x={me.x} y={me.y + 3} s={0.95} robe={ROBES[0]} skin={SKINS[0]} bundle="#D9B98A" />
      <Cap k={k} s="One night out. Then the walk." />
    </Frame>
  );
}

/* ---------- the far side ---------- */
function Home({ k }: { k: Ink }) {
  return (
    <Frame label="The edge where sand meets green grass, with a tree, a small stream and a warm sun: a person stands with one foot on the sand and one stepping onto the grass">
      <Panel fill={BLUE} />
      <Circle cx={62} cy={42} r={26} fill={GOLD} opacity={0.3} />
      <Circle cx={62} cy={42} r={16} fill={GOLD} />
      <Ground y={100} fill={SAND} />
      <Path d="M10 104 Q50 96 100 104 Q130 108 160 102 L160 108 L10 108 Z" fill={DUNE} />
      <Path d="M156 100 L290 100 L290 148 Q290 162 276 162 L150 162 C164 140 142 120 156 100 Z" fill={GREEN_L} />
      <Path d="M170 128 Q190 122 212 130 L290 130 L290 148 Q290 162 276 162 L152 162 C160 150 160 140 170 128 Z" fill={GREEN} opacity={0.55} />
      <Path d="M204 101 Q222 120 204 138 Q188 154 206 162" stroke={WATER} strokeWidth={8} fill="none" strokeLinecap="round" />
      <Path d="M204 101 Q222 120 204 138 Q188 154 206 162" stroke="#C3E3F5" strokeWidth={2} fill="none" strokeLinecap="round" />
      <Rect x={242} y={106} width={8} height={30} rx={2} fill={BROWN} />
      <Circle cx={246} cy={96} r={21} fill={GREEN} />
      <Circle cx={230} cy={106} r={14} fill="#2F7A4B" />
      <Circle cx={262} cy={104} r={14} fill={GREEN} />
      {[
        [178, 150, '#F4B6C2'],
        [262, 146, '#FFE08A'],
        [236, 152, '#F4B6C2'],
        [180, 118, '#FFE08A'],
      ].map(([x, y, c], i) => (
        <Circle key={i} cx={x as number} cy={y as number} r={2.2} fill={c as string} />
      ))}
      {[40, 66, 90, 114].map((x, i) => (
        <Ellipse key={x} cx={x} cy={152 + (i % 2) * 4 - 2} rx={4.5} ry={2} fill={DEEP} />
      ))}
      <Ellipse cx={141} cy={155} rx={7.5} ry={3} fill={BROWN} />
      <Ellipse cx={163} cy={152.5} rx={7.5} ry={3} fill={BROWN} transform="rotate(-12 163 152.5)" />
      <Line x1={176} y1={152} x2={176} y2={106} stroke={BROWN} strokeWidth={2.6} strokeLinecap="round" />
      <Person x={151} y={148} s={1.1} fill={ROBES[0]} face={CREAM} />
      <Path d="M164 124 L175 121" stroke={ROBES[0]} strokeWidth={4.5} strokeLinecap="round" />
      <Cap k={k} s="The far side" />
    </Frame>
  );
}

export const SCENES_H2: Record<string, ComponentType<{ k: Ink }>> = {
  'l46-leaving': Leaving,
  'l46-missing': Missing,
  'l46-fish': FishCloud,
  'l46-bricks': Bricks,
  'l46-between': Between,
  'l46-manna': Manna,
  'l46-road': Road,
  'l46-home': Home,
};
