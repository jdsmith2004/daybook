/* Scenes for lesson 29, told as a story (see story-kit.tsx and story-scenes-f.tsx): a pull that comes back after a prayer, Nehemiah's wall
   with its builders and its watch, a trowel and a sheathed sword, a thorn that stayed and strength that came, bands that snap, and the
   small modern act of standing up and leaving the phone behind. Figures carry their own fixed colors and a dark outline, so they read on
   a dark card and on a cream one alike. */
import { type ComponentType, type ReactNode } from 'react';
import { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';

import { BEAR_LINE, Frame, type Ink, Say } from './story-kit';

const BROWN = '#8A5A2B';
const WOOD = '#B07A45';
const WOOD_D = '#5E3A1A';
const GOLD = '#FFD25A';
const CREAM = '#FFF5E1';
const GRAY = '#8E96AB';
const DARK = '#2A2F3F';
const SKIN = '#E7B98F';
const STONE = '#D9B77E';
const STONE_L = '#EBCF9C';
const EDGE = '#8A6A3A';
const SKY = '#F7D9A2';
const SAND = '#D2A86A';
const ROPE = '#B58B4C';
const BLUE = '#4A5FA8';
const GREEN = '#2F7A5B';
const RED = '#B3263A';
const PLUM = '#7A4FA0';

/* the line of words under a picture */
function Cap({ k, s }: { k: Ink; s: string }) {
  return <Say x={150} y={190} s={s} fill={k.ink} />;
}

/* ---------- shared drawings ---------- */

/* a person standing on (x, y): a robe, a round head, a dark outline. rot leans them about their feet. */
function Folk({ x, y, s = 1, robe, rot = 0 }: { x: number; y: number; s?: number; robe: string; rot?: number }) {
  const sw = 1.5 / s;
  return (
    <G transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <Path d="M-17 0 L-17 -16 Q-17 -33 0 -33 Q17 -33 17 -16 L17 0 Z" fill={robe} stroke={BEAR_LINE} strokeWidth={sw} strokeLinejoin="round" />
      <Circle cx={0} cy={-45} r={11} fill={SKIN} stroke={BEAR_LINE} strokeWidth={sw} />
    </G>
  );
}

/* thick rounded strokes with one outline around the whole shape: every outline first, then every fill, so inner joins stay clean */
function Tube({ parts, fill }: { parts: [string, number][]; fill: string }) {
  return (
    <G fill="none" strokeLinecap="round" strokeLinejoin="round">
      {parts.map(([d, w], i) => (
        <Path key={`o${i}`} d={d} stroke={BEAR_LINE} strokeWidth={w + 3} />
      ))}
      {parts.map(([d, w], i) => (
        <Path key={`f${i}`} d={d} stroke={fill} strokeWidth={w} />
      ))}
    </G>
  );
}

/* a hand: a small skin circle */
function Hand({ x, y, r = 4.5 }: { x: number; y: number; r?: number }) {
  return <Circle cx={x} cy={y} r={r} fill={SKIN} stroke={BEAR_LINE} strokeWidth={1.3} />;
}

/* courses of big stone blocks, running x1 to x2, the lowest course ending at yBottom, alternate courses shifted */
function Courses({ x1, x2, yBottom, h, w, rows }: { x1: number; x2: number; yBottom: number; h: number; w: number; rows: number }) {
  const out: ReactNode[] = [];
  const tones = [STONE, STONE_L, STONE, STONE, STONE_L];
  for (let r = 0; r < rows; r++) {
    const y = yBottom - (r + 1) * h;
    let i = 0;
    for (let xs = x1 - (r % 2 ? w / 2 : 0); xs < x2; xs += w) {
      const a = Math.max(x1, xs);
      const b = Math.min(x2, xs + w);
      i++;
      if (b - a < 3) continue;
      out.push(<Rect key={`${r}-${i}`} x={a} y={y} width={b - a} height={h} rx={1.5} fill={tones[(i + r * 2) % 5]} stroke={EDGE} strokeWidth={1.3} />);
    }
  }
  return <G>{out}</G>;
}

/* a small warm bloom where a cord gives way */
function Burst({ x, y }: { x: number; y: number }) {
  const rays = [0, 45, 90, 135, 180, 225, 270, 315];
  return (
    <G>
      <Circle cx={x} cy={y} r={13} fill={GOLD} opacity={0.4} />
      <Circle cx={x} cy={y} r={6} fill="#FFF6D0" />
      {rays.map((a) => (
        <Line
          key={a}
          x1={x + 8 * Math.cos((a * Math.PI) / 180)}
          y1={y + 8 * Math.sin((a * Math.PI) / 180)}
          x2={x + 14 * Math.cos((a * Math.PI) / 180)}
          y2={y + 14 * Math.sin((a * Math.PI) / 180)}
          stroke={GOLD}
          strokeWidth={2.2}
          strokeLinecap="round"
        />
      ))}
    </G>
  );
}

/* ---------- the pull comes back ---------- */
function PrayWave({ k }: { k: Ink }) {
  return (
    <Frame label="A person kneeling on the ground with head bowed and hands together in prayer, soft light around them. Behind them on the right, a tall wave is rising again">
      <Line x1={14} y1={160} x2={286} y2={160} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      <Path d="M150 160 C152 132 170 108 196 96 C210 90 224 90 232 98 C222 98 214 106 216 120 C218 138 230 152 242 160 Z" fill={k.soft} opacity={0.7} />
      <Path
        d="M180 160 C182 118 204 82 240 66 C258 58 278 68 282 86 C266 78 250 88 250 104 C250 128 264 148 284 160 Z"
        fill={k.acc}
        stroke={BEAR_LINE}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <Path d="M244 68 C256 64 270 70 276 82" stroke={CREAM} strokeWidth={3} strokeLinecap="round" fill="none" />
      <Path d="M200 118 C206 104 216 92 228 84" stroke={CREAM} strokeWidth={2.4} strokeLinecap="round" fill="none" opacity={0.7} />
      <Circle cx={262} cy={56} r={2.6} fill={CREAM} />
      <Circle cx={272} cy={64} r={1.8} fill={CREAM} />
      <Ellipse cx={90} cy={118} rx={44} ry={40} fill={GOLD} opacity={0.17} />
      <Tube
        fill={BLUE}
        parts={[
          ['M64 154 L98 154', 11],
          ['M96 152 L74 130', 16],
          ['M74 132 L90 98', 22],
        ]}
      />
      <Tube fill={BLUE} parts={[['M92 104 Q104 112 110 106', 7]]} />
      <Circle cx={100} cy={86} r={10.5} fill={SKIN} stroke={BEAR_LINE} strokeWidth={1.5} />
      <Hand x={112} y={104} r={4.2} />
      <Cap k={k} s="The pull came back" />
    </Frame>
  );
}

/* ---------- the wall ---------- */
function Wall({ k }: { k: Ink }) {
  return (
    <Frame label="Ancient Jerusalem's wall half rebuilt in big tan stone blocks under a warm sky. A guard stands watch with an upright spear on top of the finished part, and two small builders lift a stone toward a gap in the unfinished part">
      <Rect x={10} y={10} width={280} height={162} rx={12} fill={SKY} />
      <Circle cx={248} cy={42} r={26} fill={GOLD} opacity={0.35} />
      <Circle cx={248} cy={42} r={15} fill={GOLD} />
      <Path d="M10 150 L290 150 L290 160 Q290 172 278 172 L22 172 Q10 172 10 160 Z" fill={SAND} />
      <Courses x1={14} x2={166} yBottom={150} h={13} w={28} rows={5} />
      {[98, 122, 146].map((x) => (
        <Rect key={x} x={x} y={76} width={16} height={9} rx={1.5} fill={STONE_L} stroke={EDGE} strokeWidth={1.3} />
      ))}
      <Courses x1={166} x2={198} yBottom={150} h={13} w={28} rows={2} />
      <Courses x1={198} x2={234} yBottom={150} h={13} w={28} rows={1} />
      <Courses x1={234} x2={286} yBottom={150} h={13} w={28} rows={2} />

      <Line x1={74} y1={88} x2={74} y2={30} stroke={WOOD_D} strokeWidth={3} strokeLinecap="round" />
      <Path d="M74 18 L79 32 L69 32 Z" fill={GRAY} stroke={BEAR_LINE} strokeWidth={1.3} strokeLinejoin="round" />
      <Folk x={56} y={85} s={0.85} robe={RED} />
      <Path d="M46 47 Q46 35 56 35 Q66 35 66 47 Z" fill={GRAY} stroke={BEAR_LINE} strokeWidth={1.3} strokeLinejoin="round" />
      <Tube fill={RED} parts={[['M62 63 L72 66', 5]]} />
      <Hand x={74} y={66} r={3.4} />

      <Rect x={204} y={121} width={22} height={14} rx={2} fill={STONE_L} stroke={EDGE} strokeWidth={1.4} />
      <Tube fill={BLUE} parts={[['M196 149 L205 133', 4.5]]} />
      <Tube fill={GREEN} parts={[['M234 149 L225 133', 4.5]]} />
      <Folk x={189} y={168} s={0.62} robe={BLUE} />
      <Folk x={241} y={168} s={0.62} robe={GREEN} />
      <Cap k={k} s="They prayed, and set a watch" />
    </Frame>
  );
}

/* ---------- one hand on the work ---------- */
function Trowel({ k }: { k: Ink }) {
  return (
    <Frame label="A builder at a wall of big stone blocks. One hand presses a mason's trowel, a flat steel diamond with a short wooden handle, onto a fresh stone set in a line of gray mortar. The other hand grips a long sheathed sword held upright at their side, with a gold crossguard and pommel, its point resting on the ground">
      <Rect x={10} y={10} width={280} height={162} rx={12} fill={SKY} />
      <Circle cx={250} cy={40} r={24} fill={GOLD} opacity={0.35} />
      <Circle cx={250} cy={40} r={14} fill={GOLD} />
      <Courses x1={150} x2={290} yBottom={172} h={19} w={36} rows={4} />
      {/* a fresh stone on a thick bed of gray mortar, squeezed out at the edges */}
      <Path
        d="M164 99 Q162 94 168 93 L232 93 Q238 94 236 99 Q234 101 228 99.5 L222 102 L214 99.5 L172 99.5 L168 102 Z"
        fill="#A5A8AD"
        stroke={BEAR_LINE}
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
      <Rect x={170} y={72} width={58} height={22} rx={2.5} fill={STONE_L} stroke={BEAR_LINE} strokeWidth={1.5} />
      <Path d="M200 79 L214 79 M206 87 L222 87" stroke={CREAM} strokeWidth={2} strokeLinecap="round" opacity={0.8} />

      {/* the sword: upright in its sheath, point on the ground, held at the grip */}
      <Path d="M29 119 L41 119 L40 164 Q40 169 35 169 Q30 169 30 164 Z" fill={WOOD_D} stroke={BEAR_LINE} strokeWidth={1.5} strokeLinejoin="round" />
      <Rect x={28} y={125} width={14} height={5} rx={1.5} fill={GOLD} stroke={BEAR_LINE} strokeWidth={1.1} />
      <Rect x={29} y={147} width={12} height={5} rx={1.5} fill={GOLD} stroke={BEAR_LINE} strokeWidth={1.1} />
      <Rect x={29} y={159} width={12} height={10} rx={4} fill={GOLD} stroke={BEAR_LINE} strokeWidth={1.1} />
      <Rect x={31.5} y={98} width={7} height={21} rx={2.5} fill={BROWN} stroke={BEAR_LINE} strokeWidth={1.4} />
      <Path d="M31.5 103 L38.5 106 M31.5 108 L38.5 111 M31.5 113 L38.5 116" stroke={BEAR_LINE} strokeWidth={1} />
      <Rect x={12} y={113} width={46} height={8} rx={4} fill={GOLD} stroke={BEAR_LINE} strokeWidth={1.5} />
      <Circle cx={35} cy={92} r={7} fill={GOLD} stroke={BEAR_LINE} strokeWidth={1.5} />

      <Folk x={92} y={172} s={1.9} robe={BLUE} />
      <Path d="M71 82 Q71 61 92 61 Q113 61 113 82 Q102 73 92 73 Q82 73 71 82 Z" fill={WOOD_D} stroke={BEAR_LINE} strokeWidth={1.4} strokeLinejoin="round" />
      <Tube fill={BLUE} parts={[['M68 132 Q52 128 40 106', 9]]} />
      <Hand x={36} y={104} r={6.5} />

      {/* the trowel: wooden handle, steel neck, a flat diamond blade pressed onto the stone */}
      <Tube fill={BLUE} parts={[['M118 126 Q136 126 148 108', 9]]} />
      <Path d="M148 106 L162 96" stroke={BEAR_LINE} strokeWidth={10} strokeLinecap="round" />
      <Path d="M148 106 L162 96" stroke={WOOD} strokeWidth={7} strokeLinecap="round" />
      <Path d="M162 96 L172 89" stroke={BEAR_LINE} strokeWidth={4} strokeLinecap="round" />
      <Path d="M162 96 L172 89" stroke={GRAY} strokeWidth={2} strokeLinecap="round" />
      <Path d="M171 89 L194 70 L228 84 L198 99 Z" fill="#D5DCEA" stroke={BEAR_LINE} strokeWidth={1.6} strokeLinejoin="round" />
      <Path d="M175 88 L222 84" stroke={GRAY} strokeWidth={1.5} strokeLinecap="round" />
      <Hand x={148} y={106} r={6.5} />
      <Cap k={k} s="One hand on the work" />
    </Frame>
  );
}

/* ---------- strength, not removal ---------- */
function Thorn({ k }: { k: Ink }) {
  return (
    <Frame label="A robed man sits at a low table writing a letter on a scroll. A small thorny branch lies on the floor beside him, and a soft warm light falls on him from above">
      <Path d="M92 10 L124 10 L182 160 L30 160 Z" fill={GOLD} opacity={0.2} />
      <Ellipse cx={104} cy={150} rx={72} ry={9} fill={GOLD} opacity={0.2} />
      <Line x1={14} y1={160} x2={286} y2={160} stroke={k.line} strokeWidth={3} strokeLinecap="round" />

      <Path d="M18 158 Q34 146 48 153 Q58 158 70 148" stroke={WOOD_D} strokeWidth={4.4} strokeLinecap="round" fill="none" />
      <Path
        d="M27 152 L29 138 L36 148 Z M43 152 L48 138 L53 152 Z M57 156 L66 143 L67 156 Z M36 154 L34 164 L42 156 Z"
        fill={WOOD_D}
        stroke={BEAR_LINE}
        strokeWidth={0.9}
        strokeLinejoin="round"
      />
      <Path d="M20 156 L11 148 M68 149 L77 141" stroke={WOOD_D} strokeWidth={3} strokeLinecap="round" />

      <Rect x={134} y={126} width={104} height={7} rx={2.5} fill={WOOD} stroke={BEAR_LINE} strokeWidth={1.4} />
      <Rect x={144} y={133} width={6} height={27} fill={WOOD} stroke={BEAR_LINE} strokeWidth={1.2} />
      <Rect x={222} y={133} width={6} height={27} fill={WOOD} stroke={BEAR_LINE} strokeWidth={1.2} />

      <Path d="M82 160 Q84 112 108 108 Q132 112 136 160 Z" fill={PLUM} stroke={BEAR_LINE} strokeWidth={1.5} strokeLinejoin="round" />
      <Path d="M96 112 Q110 130 124 114" stroke={GOLD} strokeWidth={3} strokeLinecap="round" fill="none" />
      <Circle cx={109} cy={93} r={11} fill={SKIN} stroke={BEAR_LINE} strokeWidth={1.5} />
      <Path d="M97 91 Q98 80 109 80 Q121 81 121 92 Q118 86 109 86 Q101 86 97 91 Z" fill={CREAM} stroke={BEAR_LINE} strokeWidth={1.3} strokeLinejoin="round" />

      <Path d="M150 126 L208 126 L216 113 L158 113 Z" fill={CREAM} stroke={BEAR_LINE} strokeWidth={1.4} strokeLinejoin="round" />
      <Rect x={146} y={111} width={9} height={17} rx={4.5} fill={CREAM} stroke={BEAR_LINE} strokeWidth={1.4} />
      <Rect x={208} y={110} width={9} height={18} rx={4.5} fill={CREAM} stroke={BEAR_LINE} strokeWidth={1.4} />
      <Path d="M162 119 L202 119 M165 123 L196 123" stroke={EDGE} strokeWidth={1.5} strokeLinecap="round" opacity={0.7} />
      <Tube fill={PLUM} parts={[['M118 118 Q134 124 152 119', 7]]} />
      <Line x1={152} y1={119} x2={164} y2={113} stroke={BEAR_LINE} strokeWidth={1.6} strokeLinecap="round" />
      <Hand x={152} y={119} r={4.2} />
      <Cap k={k} s="Strength, not removal" />
    </Frame>
  );
}

/* ---------- strength to burst the bands ---------- */
function Bands({ k }: { k: Ink }) {
  return (
    <Frame label="A robed person stands with arms pressed outward against cords wrapped around their wrists and body. The cords are snapping apart at two points, with light at each break">
      <Circle cx={150} cy={104} r={58} fill={GOLD} opacity={0.14} />
      <Line x1={14} y1={160} x2={286} y2={160} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      <Path d="M118 160 L126 98 Q150 86 174 98 L182 160 Z" fill={PLUM} stroke={BEAR_LINE} strokeWidth={1.5} strokeLinejoin="round" />
      <Tube fill={PLUM} parts={[['M129 104 Q100 114 102 148', 9]]} />
      <Tube fill={PLUM} parts={[['M171 104 Q200 114 198 148', 9]]} />
      <Circle cx={150} cy={82} r={13} fill={SKIN} stroke={BEAR_LINE} strokeWidth={1.5} />
      <Hand x={102} y={152} r={5} />
      <Hand x={198} y={152} r={5} />

      <G stroke={ROPE} strokeWidth={4} strokeLinecap="round" fill="none">
        <Path d="M122 126 Q140 133 155 126" />
        <Path d="M169 124 Q175 128 178 126" />
        <Path d="M121 146 Q150 154 179 146" />
        <Ellipse cx={102} cy={150} rx={7.5} ry={4} />
        <Ellipse cx={198} cy={150} rx={7.5} ry={4} />
        <Path d="M108 153 L112 155" />
        <Path d="M121 152 L124 148" />
        <Path d="M192 153 Q184 158 178 149" />
      </G>
      <G stroke={ROPE} strokeWidth={2} strokeLinecap="round">
        <Path d="M155 126 l5 -4 M155 126 l5 4 M169 124 l-5 -5 M169 124 l-4 5" />
        <Path d="M112 155 l4 -4 M121 152 l-5 4" />
      </G>
      <Burst x={162} y={125} />
      <Burst x={116} y={154} />
      <Cap k={k} s="Strength to burst the bands" />
    </Frame>
  );
}

/* ---------- today: pray, then post your guard ---------- */
function Guard({ k }: { k: Ink }) {
  return (
    <Frame label="A person has stood up from a chair and is walking toward a doorway with a small warm light in it. Behind them, a phone lies face down on a table">
      <Line x1={14} y1={160} x2={286} y2={160} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      <Path d="M222 160 L264 160 L284 172 L204 172 Z" fill={GOLD} opacity={0.3} />
      <Rect x={214} y={52} width={58} height={108} rx={3} fill={BROWN} stroke={BEAR_LINE} strokeWidth={1.5} />
      <Rect x={222} y={60} width={42} height={100} fill="#EFA24F" />
      <Circle cx={243} cy={96} r={20} fill="#FFD98A" opacity={0.6} />
      <Circle cx={243} cy={96} r={9} fill="#FFF1B8" />
      <Path d="M150 166 L206 166" stroke={k.acc} strokeWidth={3.2} strokeDasharray="1 7" strokeLinecap="round" fill="none" />

      <Path d="M14 128 L88 128 L96 116 L22 116 Z" fill={WOOD} stroke={BEAR_LINE} strokeWidth={1.4} strokeLinejoin="round" />
      <Rect x={14} y={128} width={74} height={6} fill={WOOD_D} stroke={BEAR_LINE} strokeWidth={1.2} />
      <Rect x={20} y={134} width={5} height={26} fill={WOOD_D} />
      <Rect x={77} y={134} width={5} height={26} fill={WOOD_D} />
      <Path d="M40 124 L62 124 L67 118 L45 118 Z" fill={DARK} stroke={GRAY} strokeWidth={1.2} strokeLinejoin="round" />
      <Circle cx={50} cy={120.5} r={1.4} fill={GRAY} />

      <Rect x={106} y={98} width={6} height={38} rx={3} fill={WOOD_D} stroke={BEAR_LINE} strokeWidth={1.2} />
      <Rect x={106} y={130} width={30} height={6} rx={3} fill={WOOD_D} stroke={BEAR_LINE} strokeWidth={1.2} />
      <Rect x={108} y={136} width={5} height={24} fill={WOOD_D} />
      <Rect x={129} y={136} width={5} height={24} fill={WOOD_D} />

      <Ellipse cx={148} cy={159} rx={8} ry={3.2} fill={BEAR_LINE} />
      <Ellipse cx={180} cy={158} rx={8} ry={3.2} fill={BEAR_LINE} />
      <Folk x={162} y={158} s={1.2} robe={BLUE} rot={7} />
      <Cap k={k} s="Pray, then post your guard" />
    </Frame>
  );
}

export const SCENES_L29: Record<string, ComponentType<{ k: Ink }>> = {
  'l22-pray-wave': PrayWave,
  'l22-wall': Wall,
  'l22-trowel': Trowel,
  'l22-thorn': Thorn,
  'l22-bands': Bands,
  'l22-guard': Guard,
};
