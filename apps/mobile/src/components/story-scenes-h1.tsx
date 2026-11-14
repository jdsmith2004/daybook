/* Scenes for lessons told as a story (see story-kit.tsx and story-scenes-h.tsx): lesson 45 (Odysseus and the Sirens, after Homer, and
   the smokers who guessed their later craving too small) and lesson 49 (the film of smokers, and the cigarette kept close). */
import { type ComponentType } from 'react';
import { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';

import { BEAR_LINE, Cloud, Frame, type Ink, Person, Say } from './story-kit';

const BROWN = '#8A5A2B';
const ROPE = '#B8864A';
const GOLD = '#FFD25A';
const GOLD_DK = '#C98F1A';
const WHITE = '#FFFFFF';
const GREEN = '#3F8F5B';
const SEA = '#2F6DA8';
const SKY = '#CFE6F5';
const HULL = '#2E2230';
const SAIL = '#F3E9D2';
const SKIN = '#F1C9A5';
const BLUE = '#4F5FA3';
const RUST = '#A56A4A';

/* the line of words under a picture */
function Cap({ k, s }: { k: Ink; s: string }) {
  return <Say x={150} y={190} s={s} fill={k.ink} />;
}

/* a music note */
function Note({ x, y, s = 1, fill = GOLD, stroke = GOLD_DK, o = 1 }: { x: number; y: number; s?: number; fill?: string; stroke?: string; o?: number }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
      <Ellipse cx={0} cy={0} rx={3.6} ry={2.7} fill={fill} stroke={stroke} strokeWidth={1} transform="rotate(-20)" />
      <Path d="M3 -1 L3 -12 Q8 -10 7 -5" stroke={stroke} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </G>
  );
}

/* a five-point star */
function Star({ x, y, r, fill = GOLD, stroke = GOLD_DK }: { x: number; y: number; r: number; fill?: string; stroke?: string }) {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 ? r * 0.45 : r;
    return `${(x + rr * Math.cos(a)).toFixed(1)},${(y + rr * Math.sin(a)).toFixed(1)}`;
  }).join(' ');
  return <Path d={`M${pts.replace(/ /g, ' L')} Z`} fill={fill} stroke={stroke} strokeWidth={1.2} strokeLinejoin="round" />;
}

/* small wave curls on the water */
function Curls({ at }: { at: [number, number][] }) {
  return (
    <G>
      {at.map(([x, y]) => (
        <Path key={`${x}-${y}`} d={`M${x} ${y} q4 -5 8 0 t8 0`} stroke={WHITE} strokeWidth={1.8} strokeLinecap="round" fill="none" opacity={0.7} />
      ))}
    </G>
  );
}

/* sky above and sea below, in one rounded panel */
function SeaPanel({ hy = 104, sky = SKY }: { hy?: number; sky?: string }) {
  return (
    <G>
      <Rect x={10} y={10} width={280} height={152} rx={14} fill={sky} />
      <Path d={`M10 ${hy} L290 ${hy} L290 148 Q290 162 276 162 L24 162 Q10 162 10 148 Z`} fill={SEA} />
    </G>
  );
}

/* an ancient Greek ship, bow to the right: a long dark hull, a row of oars and one square sail */
function Ship({ x, y, s = 1, sail = SAIL, stripe = '#B5533C' }: { x: number; y: number; s?: number; sail?: string; stripe?: string }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Rect x={-1.5} y={-46} width={3} height={38} fill={BROWN} />
      <Rect x={-17} y={-44} width={34} height={28} fill={sail} stroke={BEAR_LINE} strokeWidth={1} />
      <Rect x={-17} y={-34} width={34} height={5} fill={stripe} />
      <Line x1={-20} y1={-45} x2={20} y2={-45} stroke={BROWN} strokeWidth={2.6} strokeLinecap="round" />
      <Path d="M50 -10 Q59 -14 56 -25" stroke={HULL} strokeWidth={3.2} strokeLinecap="round" fill="none" />
      <Path d="M-48 -10 Q-55 -12 -54 -20" stroke={HULL} strokeWidth={3.2} strokeLinecap="round" fill="none" />
      <Path d="M-48 -10 L50 -10 Q46 9 26 10 L-26 10 Q-44 9 -48 -10 Z" fill={HULL} />
      <Line x1={-45} y1={-6.5} x2={47} y2={-6.5} stroke={ROPE} strokeWidth={1.4} />
      {[-32, -19, -6, 7, 20, 33].map((ox) => (
        <G key={ox}>
          <Line x1={ox} y1={-1} x2={ox - 9} y2={15} stroke="#C9965B" strokeWidth={1.9} strokeLinecap="round" />
          <Circle cx={ox} cy={-1} r={1.5} fill={ROPE} />
        </G>
      ))}
    </G>
  );
}

/* a Siren seated on a rock: long hair, a soft body */
function Siren({ x, y, s = 1, hair, body }: { x: number; y: number; s?: number; hair: string; body: string }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Path d="M0 -35 Q-12 -35 -12 -20 Q-12 -4 -17 9 Q-6 7 -4 -6 L4 -6 Q6 7 17 9 Q12 -4 12 -20 Q12 -35 0 -35 Z" fill={hair} />
      <Path d="M-8 6 L-8 -10 Q-8 -21 0 -21 Q8 -21 8 -10 L8 6 Q17 6 23 -2 Q21 11 8 11 L-8 11 Z" fill={body} />
      <Circle cx={0} cy={-27} r={6.4} fill={SKIN} />
    </G>
  );
}

/* a small pale bone lying in the grass */
function Bone({ x, y, r = 0 }: { x: number; y: number; r?: number }) {
  return (
    <G transform={`translate(${x} ${y}) rotate(${r})`}>
      <Line x1={-6} y1={0} x2={6} y2={0} stroke="#F2EAD3" strokeWidth={3} strokeLinecap="round" />
      <Circle cx={-7} cy={-1.4} r={2} fill="#F2EAD3" />
      <Circle cx={-7} cy={1.4} r={2} fill="#F2EAD3" />
      <Circle cx={7} cy={-1.4} r={2} fill="#F2EAD3" />
      <Circle cx={7} cy={1.4} r={2} fill="#F2EAD3" />
    </G>
  );
}

/* the Sirens' rocky island with its green meadow and the three Sirens, drawn at a chosen size */
function Isle({ x, y, s = 1, bones = true }: { x: number; y: number; s?: number; bones?: boolean }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Path d="M-70 36 Q-62 0 -20 -6 Q30 -14 62 22 L68 36 Q0 46 -70 36 Z" fill="#8F8A82" />
      <Path d="M-52 18 Q-34 -6 0 -8 Q38 -10 54 16 Q0 28 -52 18 Z" fill="#6BBF6B" />
      {bones ? (
        <G>
          <Bone x={-38} y={22} r={-8} />
          <Bone x={-4} y={24} r={12} />
          <Bone x={38} y={20} r={-14} />
        </G>
      ) : null}
      <Siren x={-26} y={14} hair="#7A4B8F" body="#B79AD6" />
      <Siren x={4} y={10} hair="#2F7A8A" body="#8FD3CF" />
      <Siren x={34} y={14} hair="#A8556B" body="#F2B5C0" />
    </G>
  );
}

/* the deck of the ship, close up: pale sky, planks and a tall mast with a sail above */
function DeckBg({ mastX = 150 }: { mastX?: number }) {
  return (
    <G>
      <Rect x={10} y={10} width={280} height={152} rx={14} fill="#DCEBF5" />
      <Path d={`M${mastX - 44} 20 L${mastX + 44} 20 L${mastX + 44} 62 L${mastX - 44} 62 Z`} fill={SAIL} stroke={BEAR_LINE} strokeWidth={1} opacity={0.9} />
      <Rect x={mastX - 44} y={30} width={88} height={7} fill="#B5533C" opacity={0.9} />
      <Line x1={mastX - 50} y1={19} x2={mastX + 50} y2={19} stroke={BROWN} strokeWidth={3.5} strokeLinecap="round" />
      <Rect x={mastX - 6} y={10} width={12} height={122} rx={3} fill="#7A4B2A" />
      <Path d="M10 128 L290 128 L290 148 Q290 162 276 162 L24 162 Q10 162 10 148 Z" fill="#B98A55" />
      <Line x1={10} y1={139} x2={290} y2={139} stroke="#9A6E3D" strokeWidth={1.4} />
      <Line x1={10} y1={150} x2={290} y2={150} stroke="#9A6E3D" strokeWidth={1.4} />
      <Rect x={mastX - 10} y={124} width={20} height={6} rx={2} fill={BROWN} />
    </G>
  );
}

/* ---------- lesson 45: the Sirens, and a price named for later ---------- */
function SirensIsle({ k }: { k: Ink }) {
  return (
    <Frame label="A small rocky island with a green meadow, three Sirens sitting on it and pale bones in the grass, and far off a Greek ship sailing toward it">
      <SeaPanel hy={104} />
      <Circle cx={44} cy={38} r={12} fill={GOLD} opacity={0.9} />
      <Isle x={218} y={96} s={1.1} />
      <Curls
        at={[
          [26, 124],
          [84, 134],
          [150, 126],
          [196, 144],
          [254, 140],
          [120, 150],
        ]}
      />
      <Ship x={64} y={112} s={0.55} />
      <Cap k={k} s={'The Sirens’ island'} />
    </Frame>
  );
}

function WaxRope({ k }: { k: Ink }) {
  return (
    <Frame label="Odysseus standing against the mast with rope wound around him, two sailors with wax in their ears, and a bowl of wax in the sunlight">
      <DeckBg />
      <Ellipse cx={256} cy={148} rx={30} ry={8} fill={GOLD} opacity={0.35} />
      <Person x={150} y={128} s={1.5} fill={k.acc} face={k.bg} />
      {[92, 102, 112].map((y, i) => (
        <Path key={y} d={`M122 ${y} Q150 ${y + 8} 178 ${y - (i % 2)}`} stroke={ROPE} strokeWidth={4.4} strokeLinecap="round" fill="none" />
      ))}
      <Path d="M170 112 Q176 124 170 132" stroke={ROPE} strokeWidth={3.4} strokeLinecap="round" fill="none" />
      <Person x={78} y={128} s={1.1} fill={BLUE} face={WHITE} />
      <Circle cx={88} cy={75} r={3.4} fill={GOLD} stroke={GOLD_DK} strokeWidth={1} />
      <Person x={222} y={128} s={1.1} fill={RUST} face={WHITE} />
      <Circle cx={212} cy={75} r={3.4} fill={GOLD} stroke={GOLD_DK} strokeWidth={1} />
      <Path d="M243 142 L269 142 Q267 156 256 156 Q245 156 243 142 Z" fill={BROWN} />
      <Ellipse cx={256} cy={142} rx={13} ry={3.4} fill={GOLD} stroke={GOLD_DK} strokeWidth={1} />
      <Cap k={k} s="Wax for the crew. Rope for him." />
    </Frame>
  );
}

function Tighter({ k }: { k: Ink }) {
  return (
    <Frame label="Odysseus leaning hard forward against the mast while two sailors on either side pull the rope ends tighter">
      <DeckBg />
      <G transform="rotate(10 150 128)">
        <Person x={150} y={128} s={1.5} fill={k.acc} face={k.bg} />
        {[92, 102, 112].map((y, i) => (
          <Path key={y} d={`M122 ${y} Q150 ${y + 8} 178 ${y - (i % 2)}`} stroke={ROPE} strokeWidth={4.4} strokeLinecap="round" fill="none" />
        ))}
      </G>
      <Path d="M186 78 L196 72 M188 66 L198 58 M182 88 L194 86" stroke={k.ink} strokeWidth={2} strokeLinecap="round" opacity={0.5} />
      <Path d="M122 102 Q98 104 74 110" stroke={ROPE} strokeWidth={4} strokeLinecap="round" fill="none" />
      <Path d="M178 104 Q204 106 228 110" stroke={ROPE} strokeWidth={4} strokeLinecap="round" fill="none" />
      <G transform="rotate(-10 60 128)">
        <Person x={60} y={128} s={1.1} fill={BLUE} face={WHITE} />
      </G>
      <G transform="rotate(10 240 128)">
        <Person x={240} y={128} s={1.1} fill={RUST} face={WHITE} />
      </G>
      <Circle cx={72} cy={110} r={4} fill={BLUE} stroke={WHITE} strokeWidth={1} />
      <Circle cx={230} cy={110} r={4} fill={RUST} stroke={WHITE} strokeWidth={1} />
      <Path d="M50 98 Q40 110 52 122" stroke={k.ink} strokeWidth={2.2} strokeLinecap="round" fill="none" opacity={0.55} />
      <Path d="M250 98 Q260 110 248 122" stroke={k.ink} strokeWidth={2.2} strokeLinecap="round" fill="none" opacity={0.55} />
      <Cap k={k} s="If I beg, tie me tighter" />
    </Frame>
  );
}

function Song({ k }: { k: Ink }) {
  const heads: [number, string][] = [
    [66, BLUE],
    [82, RUST],
    [138, BLUE],
    [154, RUST],
  ];
  return (
    <Frame label="A ship passing close to the Sirens' island; golden notes stream from the Sirens to the ship, Odysseus leans hard against his ropes toward them, and the rowers sit calm">
      <SeaPanel hy={112} sky="#BFD9EE" />
      <Isle x={240} y={102} s={0.95} bones={false} />
      <Curls
        at={[
          [24, 150],
          [160, 150],
          [196, 138],
          [30, 128],
          [200, 126],
        ]}
      />
      <Ship x={106} y={122} s={1.35} />
      {heads.map(([hx, c]) => (
        <Circle key={hx} cx={hx} cy={102} r={4} fill={c} stroke={HULL} strokeWidth={1} />
      ))}
      <G transform="rotate(12 106 112)">
        <Person x={106} y={112} s={0.62} fill={k.acc} face={k.bg} />
        <Path d="M95 90 Q106 94 117 90 M95 96 Q106 100 117 96" stroke={ROPE} strokeWidth={2.4} strokeLinecap="round" fill="none" />
      </G>
      <Path d="M214 66 Q196 36 176 58 Q158 80 140 52" stroke={GOLD} strokeWidth={2.4} strokeLinecap="round" strokeDasharray="1 5" fill="none" />
      <Note x={206} y={56} s={1.5} />
      <Note x={188} y={46} s={1.3} />
      <Note x={168} y={64} s={1.5} />
      <Note x={150} y={64} s={1.3} />
      <Note x={134} y={44} s={1.5} />
      <Cap k={k} s="It sounded like wisdom" />
    </Frame>
  );
}

function Price({ k }: { k: Ink }) {
  const tag = (x: number, y: number, s: number, label: string, size: number, bg: string) => (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Path d="M-16 0 L-8 -9 L16 -9 L16 9 L-8 9 Z" fill={GOLD} stroke={BEAR_LINE} strokeWidth={1.4} strokeLinejoin="round" />
      <Circle cx={-9} cy={0} r={1.8} fill={bg} />
      <Say x={5} y={size / 3} s={label} fill={BEAR_LINE} size={size} />
    </G>
  );
  const table = (cx: number) => (
    <G>
      <Rect x={cx - 52} y={124} width={104} height={7} rx={3} fill={BROWN} />
      <Rect x={cx - 46} y={131} width={6} height={31} fill={BROWN} />
      <Rect x={cx + 40} y={131} width={6} height={31} fill={BROWN} />
    </G>
  );
  const craving = (x: number, y: number, d: number) => (
    <Path d={`M${x} ${y} q5 -6 10 0 t10 0 t10 0`} stroke="#C2410C" strokeWidth={2.4} strokeLinecap="round" fill="none" opacity={0.9 - d * 0.2} />
  );
  return (
    <Frame label="Two people at a lab table: the calm one names a small price, the one gripping an unlit cigarette and hunched with craving names a very big price">
      <Rect x={10} y={10} width={132} height={152} rx={14} fill="#E3F0E6" />
      <Rect x={158} y={10} width={132} height={152} rx={14} fill="#F7E3D8" />
      {table(76)}
      {table(224)}
      <Person x={76} y={126} s={1.2} fill={BLUE} face={WHITE} />
      {tag(76, 36, 1, '$', 12, '#E3F0E6')}
      <G transform="rotate(16 224 126)">
        <Person x={224} y={126} s={1.2} fill={RUST} face={WHITE} />
      </G>
      <Circle cx={246} cy={112} r={4.4} fill={SKIN} />
      <G transform="rotate(-14 252 111)">
        <Rect x={240} y={109} width={22} height={4} rx={2} fill={WHITE} stroke={BEAR_LINE} strokeWidth={0.9} />
        <Rect x={240} y={109} width={7} height={4} rx={2} fill="#D9A27E" />
      </G>
      {craving(206, 62, 0)}
      {craving(212, 70, 1)}
      {craving(202, 78, 2)}
      {tag(224, 38, 1.35, '$$$', 11, '#F7E3D8')}
      <Cap k={k} s="Name your price for later" />
    </Frame>
  );
}

function Gap({ k }: { k: Ink }) {
  return (
    <Frame label="The same person twice: on the left calm, imagining a tiny gentle wave; on the right later, standing small under a huge curling wave">
      <Rect x={10} y={10} width={132} height={152} rx={14} fill="#E3F0E6" />
      <Rect x={158} y={10} width={132} height={152} rx={14} fill="#DCE8F5" />
      <Path d="M10 140 L142 140 L142 148 Q142 162 128 162 L24 162 Q10 162 10 148 Z" fill="#B9C2CC" />
      <Person x={58} y={140} s={1.25} fill={BLUE} face={WHITE} />
      <Cloud x={72} y={26} w={64} h={36} fill={WHITE} />
      <Path d="M84 46 Q92 38 100 46 T116 46 T128 46" stroke={SEA} strokeWidth={2.6} strokeLinecap="round" fill="none" />
      <Path d="M147 86 L155 86 M152 81 L158 86 L152 91" stroke={k.muted} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d="M158 148 Q158 162 172 162 L276 162 Q290 162 290 148 L290 146 L158 146 Z" fill="#8EC1E8" />
      <Path d="M166 162 L166 96 Q168 34 224 24 Q268 18 284 54 Q288 68 276 70 Q266 70 264 60 Q260 46 238 46 Q208 48 204 92 L204 162 Z" fill={SEA} />
      <Path d="M178 162 L178 104 Q180 56 224 40 Q196 62 194 110 L194 162 Z" fill="#245A8C" />
      {[
        [226, 24],
        [248, 24],
        [268, 32],
        [281, 48],
        [200, 38],
      ].map(([cx, cy]) => (
        <Circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={4.2} fill={WHITE} />
      ))}
      <Person x={246} y={156} s={0.55} fill={BLUE} face={WHITE} />
      <Cap k={k} s="Calm guessed small" />
    </Frame>
  );
}

function NoteRope({ k }: { k: Ink }) {
  return (
    <Frame label="A folded paper note with three lines of handwriting, tied with a rope bow, resting at the foot of a mast with the sea behind">
      <Rect x={10} y={10} width={280} height={152} rx={14} fill="#DCEBF5" />
      <Circle cx={244} cy={38} r={13} fill={GOLD} opacity={0.9} />
      <Path d="M10 84 L290 84 L290 124 L10 124 Z" fill={SEA} />
      <Curls
        at={[
          [30, 96],
          [110, 104],
          [190, 94],
          [244, 108],
          [60, 114],
        ]}
      />
      <Path d="M10 118 L290 118 L290 148 Q290 162 276 162 L24 162 Q10 162 10 148 Z" fill="#B98A55" />
      <Line x1={10} y1={140} x2={290} y2={140} stroke="#9A6E3D" strokeWidth={1.4} />
      <Rect x={62} y={14} width={13} height={110} rx={3} fill="#7A4B2A" />
      <Rect x={56} y={120} width={25} height={7} rx={2} fill={BROWN} />
      <G transform="rotate(-4 154 126)">
        <Rect x={118} y={103} width={76} height={48} rx={3} fill="#FFF6DE" stroke={BEAR_LINE} strokeWidth={1.2} />
        <Line x1={156} y1={103} x2={156} y2={151} stroke="#E4D6AE" strokeWidth={2} />
        {[116, 126, 136].map((y, i) => (
          <G key={y}>
            <Path d={`M126 ${y} q4 -4 8 0 t8 0 t${8 - i * 2} 0`} stroke={BEAR_LINE} strokeWidth={1.6} strokeLinecap="round" fill="none" opacity={0.7} />
            <Path d={`M166 ${y} q4 -4 8 0 t8 0 t${6 + i * 2} 0`} stroke={BEAR_LINE} strokeWidth={1.6} strokeLinecap="round" fill="none" opacity={0.7} />
          </G>
        ))}
        <Rect x={152.5} y={103} width={7} height={48} fill={ROPE} />
        <Path d="M156 103 C142 86 134 100 152 106 M156 103 C170 86 178 100 160 106" stroke={ROPE} strokeWidth={4} strokeLinecap="round" fill="none" />
        <Path d="M156 105 L149 117 M156 105 L164 117" stroke={ROPE} strokeWidth={3} strokeLinecap="round" />
      </G>
      <Cap k={k} s="A rope tied on a calm day" />
    </Frame>
  );
}

function Lyre({ k }: { k: Ink }) {
  return (
    <Frame label="A second ship whose sailor at the front plays a lyre, big bright notes pouring out and pushing back fainter notes drifting from a far island, with a tiny figure splashing in the water">
      <SeaPanel hy={112} sky="#BFD9EE" />
      <Path d="M246 112 Q256 98 270 100 Q284 100 290 112 Z" fill="#8F8A82" />
      <Path d="M254 104 Q262 96 272 98 Q282 98 288 106 Z" fill="#6BBF6B" />
      <Curls
        at={[
          [22, 148],
          [150, 148],
          [200, 136],
          [214, 126],
          [34, 124],
        ]}
      />
      <Ship x={98} y={124} s={1.25} sail="#E3956A" stripe="#2E8B8B" />
      <Person x={150} y={114} s={0.8} fill={k.acc} face={k.bg} />
      <Path d="M160 94 L168 86" stroke={k.acc} strokeWidth={5} strokeLinecap="round" />
      <Path d="M165 70 Q161 86 169 90 Q177 86 173 70" stroke={BROWN} strokeWidth={3} strokeLinecap="round" fill="none" />
      <Line x1={163} y1={72} x2={175} y2={72} stroke={BROWN} strokeWidth={2.6} strokeLinecap="round" />
      {[166, 169, 172].map((lx) => (
        <Line key={lx} x1={lx} y1={73} x2={lx} y2={88} stroke={GOLD} strokeWidth={1.2} />
      ))}
      <Note x={190} y={70} s={1.9} />
      <Note x={204} y={52} s={1.6} />
      <Note x={178} y={46} s={1.4} />
      <Note x={216} y={76} s={1.4} />
      <Note x={262} y={78} s={1} fill={WHITE} stroke="#9FB8D4" o={0.6} />
      <Note x={246} y={62} s={0.9} fill={WHITE} stroke="#9FB8D4" o={0.55} />
      <Note x={256} y={46} s={0.8} fill={WHITE} stroke="#9FB8D4" o={0.5} />
      <Circle cx={28} cy={136} r={4.2} fill={SKIN} stroke={BEAR_LINE} strokeWidth={0.8} />
      <Path d="M24 138 L17 128 M32 138 L39 128" stroke={SKIN} strokeWidth={2.4} strokeLinecap="round" />
      <Path d="M12 146 q4 -5 8 0 M36 146 q4 -5 8 0" stroke={WHITE} strokeWidth={2} strokeLinecap="round" fill="none" />
      <Cap k={k} s="A louder song" />
    </Frame>
  );
}

/* ---------- lesson 49: the film, and the cigarette kept close ---------- */
function Film({ k }: { k: Ink }) {
  return (
    <Frame label="A small room seen from behind a seated person: a big screen shows two figures at a cafe table with thin wisps of smoke, and a stack of gold coins sits on a small desk">
      <Rect x={10} y={10} width={280} height={152} rx={14} fill="#2B2750" />
      <Rect x={62} y={18} width={176} height={80} rx={7} fill="#15122E" />
      <Rect x={68} y={24} width={164} height={68} rx={4} fill="#F3EBD8" />
      <Rect x={68} y={70} width={164} height={22} fill="#E2D3B4" />
      <Ellipse cx={150} cy={72} rx={24} ry={5} fill={BROWN} />
      <Rect x={148} y={72} width={4} height={16} fill={BROWN} />
      <Circle cx={118} cy={44} r={7} fill="#D9602A" />
      <Path d="M106 76 L106 62 Q106 52 118 52 Q130 52 130 62 L130 76 Z" fill="#D9602A" />
      <Circle cx={182} cy={44} r={7} fill="#4F5FA3" />
      <Path d="M170 76 L170 62 Q170 52 182 52 Q194 52 194 62 L194 76 Z" fill="#4F5FA3" />
      <Rect x={140} y={64} width={7} height={6} rx={1.5} fill={WHITE} stroke={BEAR_LINE} strokeWidth={0.8} />
      <Rect x={153} y={64} width={7} height={6} rx={1.5} fill={WHITE} stroke={BEAR_LINE} strokeWidth={0.8} />
      <Path d="M132 58 q-5 -6 0 -12 t0 -10 M198 58 q5 -6 0 -12 t0 -10" stroke="#9AA0AE" strokeWidth={1.6} strokeLinecap="round" fill="none" opacity={0.8} />
      <Path d="M142 62 q-4 -5 0 -9 M156 62 q4 -5 0 -9" stroke="#9AA0AE" strokeWidth={1.4} strokeLinecap="round" fill="none" opacity={0.8} />
      <Rect x={96} y={120} width={64} height={46} rx={14} fill="#4A4380" />
      <Person x={128} y={166} s={1.3} fill="#6B64A8" />
      <Rect x={208} y={128} width={74} height={7} rx={3} fill={BROWN} />
      <Rect x={214} y={135} width={6} height={27} fill={BROWN} />
      <Rect x={270} y={135} width={6} height={27} fill={BROWN} />
      {[0, 1, 2, 3, 4].map((i) => (
        <G key={i}>
          <Ellipse cx={246} cy={124 - i * 4.6} rx={11} ry={3.6} fill={GOLD} stroke={GOLD_DK} strokeWidth={1} />
        </G>
      ))}
      <Cap k={k} s="Watch it, and do not smoke" />
    </Frame>
  );
}

function Distance({ k }: { k: Ink }) {
  const coin = (x: number, y: number) => (
    <G key={`${x}-${y}`}>
      <Circle cx={x} cy={y} r={7} fill={GOLD} stroke={GOLD_DK} strokeWidth={1.4} />
      <Circle cx={x} cy={y} r={3.8} fill="none" stroke={GOLD_DK} strokeWidth={1.1} />
    </G>
  );
  const cig = (len: number) => (
    <G>
      <Rect x={0} y={-2.5} width={len} height={5} rx={2.5} fill={WHITE} stroke={BEAR_LINE} strokeWidth={1} />
      <Rect x={len - 9} y={-2.5} width={9} height={5} rx={2.5} fill="#D9A27E" />
    </G>
  );
  const desk = (x: number) => (
    <G>
      <Rect x={x} y={124} width={124} height={7} rx={3} fill={BROWN} />
      <Rect x={x + 6} y={131} width={6} height={31} fill={BROWN} />
      <Rect x={x + 112} y={131} width={6} height={31} fill={BROWN} />
    </G>
  );
  return (
    <Frame label="Two steps: a seated person with a cigarette lying at the far end of the desk and two gold coins beneath, then the same person holding the cigarette up in a raised hand with four gold coins beneath">
      <Rect x={10} y={10} width={132} height={152} rx={14} fill="#FFF1D6" />
      <Rect x={158} y={10} width={132} height={152} rx={14} fill="#FFF1D6" />
      {desk(14)}
      {desk(162)}
      <Person x={44} y={126} s={1.15} fill={BLUE} face={WHITE} />
      <G transform="translate(104 121)">{cig(30)}</G>
      {coin(66, 148)}
      {coin(84, 148)}
      <Path d="M143 86 L157 86 M151 80 L158 86 L151 92" stroke={k.muted} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Person x={192} y={126} s={1.15} fill={BLUE} face={WHITE} />
      <Path d="M204 100 Q226 104 228 74" stroke={BLUE} strokeWidth={8} strokeLinecap="round" fill="none" />
      <G transform="translate(228 70) rotate(-62)">
        <G transform="translate(-8 0)">{cig(24)}</G>
      </G>
      <Circle cx={228} cy={70} r={5} fill={SKIN} stroke={BEAR_LINE} strokeWidth={0.9} />
      {[196, 212, 228, 244].map((x) => coin(x, 148))}
      <Cap k={k} s="Closer pays more" />
    </Frame>
  );
}

function GaveIn({ k }: { k: Ink }) {
  const table = (cx: number) => (
    <G>
      <Rect x={cx - 52} y={124} width={104} height={7} rx={3} fill={BROWN} />
      <Rect x={cx - 46} y={131} width={6} height={31} fill={BROWN} />
      <Rect x={cx + 40} y={131} width={6} height={31} fill={BROWN} />
    </G>
  );
  return (
    <Frame label="Two seated people: on the left one wearing a gold star badge holds a lit cigarette with a wisp of smoke, on the right one without a badge has left the cigarette unlit on the desk">
      <Rect x={10} y={10} width={132} height={152} rx={14} fill="#E3F0E6" />
      <Rect x={158} y={10} width={132} height={152} rx={14} fill="#F7E3D8" />
      {table(76)}
      {table(224)}
      <Person x={70} y={126} s={1.2} fill={BLUE} face={WHITE} />
      <Star x={70} y={103} r={7} />
      <Circle cx={96} cy={106} r={4.4} fill={SKIN} />
      <G transform="rotate(-70 96 106)">
        <Rect x={96} y={104} width={22} height={4} rx={2} fill={WHITE} stroke={BEAR_LINE} strokeWidth={0.9} />
        <Rect x={110} y={104} width={8} height={4} rx={2} fill="#E8651A" />
      </G>
      <Path d="M99 82 q-5 -6 0 -12 t0 -10 t0 -8" stroke="#9AA0AE" strokeWidth={1.8} strokeLinecap="round" fill="none" opacity={0.85} />
      <Person x={218} y={126} s={1.2} fill={RUST} face={WHITE} />
      <Rect x={236} y={118} width={24} height={4} rx={2} fill={WHITE} stroke={BEAR_LINE} strokeWidth={0.9} />
      <Rect x={236} y={118} width={8} height={4} rx={2} fill="#D9A27E" />
      <Cap k={k} s="Feeling strong, they kept it closer" />
    </Frame>
  );
}

function Test({ k }: { k: Ink }) {
  return (
    <Frame label="A person standing with a phone in one hand, its screen a soft plain glow, and a thought cloud above holding a check mark and a question mark">
      <Rect x={10} y={10} width={280} height={152} rx={14} fill="#EDE6F7" />
      <Path d="M10 142 L290 142 L290 148 Q290 162 276 162 L24 162 Q10 162 10 148 Z" fill="#D9CFEA" />
      <Circle cx={162} cy={102} r={24} fill="#9CC9E8" opacity={0.3} />
      <Person x={124} y={156} s={1.5} fill={k.acc} face={k.bg} />
      <Path d="M142 126 L156 112" stroke={k.acc} strokeWidth={7} strokeLinecap="round" />
      <Rect x={154} y={88} width={15} height={26} rx={3.5} fill="#2A2A3A" />
      <Rect x={156} y={91} width={11} height={20} rx={2} fill="#DDEBFF" />
      <Cloud x={152} y={18} w={118} h={46} fill={WHITE} />
      <Path d="M170 42 l9 9 l15 -17" stroke={GREEN} strokeWidth={4.4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path
        d="M226 38 Q226 29 235 29 Q244 29 244 37 Q244 42 235 46 L235 50"
        stroke="#7A6BA8"
        strokeWidth={4.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Circle cx={235} cy={57} r={2.6} fill="#7A6BA8" />
      <Cap k={k} s="It feels like confidence" />
    </Frame>
  );
}

function Clear({ k }: { k: Ink }) {
  const path = 'M20 100 Q26 152 130 152 Q220 152 288 138';
  return (
    <Frame label="An open landscape under a calm sky: a campfire far off in the upper right, and a person walking upright along a wide, easy curve of a path with footprints that stays far from the fire">
      <Rect x={10} y={10} width={280} height={152} rx={14} fill={SKY} />
      <Circle cx={56} cy={36} r={13} fill={GOLD} />
      <Ellipse cx={130} cy={32} rx={24} ry={7} fill={WHITE} opacity={0.8} />
      <Ellipse cx={146} cy={27} rx={14} ry={6} fill={WHITE} opacity={0.8} />
      <Path d="M10 80 Q70 56 130 74 Q200 52 290 78 L290 90 L10 90 Z" fill="#A9D6B0" />
      <Path d="M10 80 Q150 62 290 80 L290 148 Q290 162 276 162 L24 162 Q10 162 10 148 Z" fill="#7FBF8E" />
      <Path d={path} stroke="#E6CFA0" strokeWidth={14} strokeLinecap="round" fill="none" />
      <Path d={path} stroke={BROWN} strokeWidth={3} strokeLinecap="round" strokeDasharray="0 9" fill="none" />
      <Ellipse cx={250} cy={84} rx={18} ry={4.5} fill="#6A5A48" opacity={0.35} />
      <Line x1={238} y1={83} x2={262} y2={79} stroke={BROWN} strokeWidth={4} strokeLinecap="round" />
      <Line x1={238} y1={79} x2={262} y2={83} stroke="#7A4B2A" strokeWidth={4} strokeLinecap="round" />
      <Path d="M242 80 Q240 66 247 56 Q249 64 254 61 Q253 52 258 46 Q266 58 261 72 Q259 80 251 82 Z" fill="#E8651A" />
      <Path d="M247 79 Q245 70 250 63 Q254 70 255 77 Q252 82 247 79 Z" fill={GOLD} />
      <Person x={140} y={152} s={0.9} fill={k.acc} face={k.bg} />
      <Cap k={k} s="Clear, on purpose" />
    </Frame>
  );
}

export const SCENES_H1: Record<string, ComponentType<{ k: Ink }>> = {
  'l45-sirens-isle': SirensIsle,
  'l45-wax-rope': WaxRope,
  'l45-tighter': Tighter,
  'l45-song': Song,
  'l45-price': Price,
  'l45-gap': Gap,
  'l45-note': NoteRope,
  'l45-lyre': Lyre,
  'l49-film': Film,
  'l49-distance': Distance,
  'l49-gave-in': GaveIn,
  'l49-test': Test,
  'l49-clear': Clear,
};
