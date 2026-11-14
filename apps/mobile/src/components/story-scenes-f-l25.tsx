/* Scenes for lesson 25, told as a story (see story-kit.tsx and story-scenes-f.tsx): the twelve steps as a ladder, and helping near the bottom. */
import { type ComponentType } from 'react';
import { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';

import { BEAR_LINE, Frame, type Ink, Person, Say } from './story-kit';

const BROWN = '#8A5A2B';
const WOOD = '#C9965B';
const ROPE = '#B8864A';
const GRAY = '#9AA0AE';
const GOLD = '#FFD25A';
const GOLD_DEEP = '#C98F1A';
const WHITE = '#FFFFFF';
const GREEN = '#3F8F5B';
const SKIN = '#E8B98A';
const WATER = '#6FA8D8';
const ORANGE = '#D9602A';

/* the line of words under a picture */
function Cap({ k, s }: { k: Ink; s: string }) {
  return <Say x={150} y={190} s={s} fill={k.ink} />;
}

/* half the width of the ladder at a height: it narrows a little toward the top, so it reads as tall */
const railHalf = (y: number, top: number, bottom: number, wTop: number, wBottom: number) => wTop / 2 + ((y - top) / (bottom - top)) * ((wBottom - wTop) / 2);

/* the ladder every ladder scene shares: two wooden rails and rungs at the heights given */
function Ladder({ cx, top, bottom, wTop, wBottom, rungs }: { cx: number; top: number; bottom: number; wTop: number; wBottom: number; rungs: number[] }) {
  const hw = (y: number) => railHalf(y, top, bottom, wTop, wBottom);
  return (
    <G>
      {rungs.map((y) => (
        <Line key={y} x1={cx - hw(y)} y1={y} x2={cx + hw(y)} y2={y} stroke={WOOD} strokeWidth={4} strokeLinecap="round" />
      ))}
      <Line x1={cx - hw(top)} y1={top} x2={cx - hw(bottom)} y2={bottom} stroke={BROWN} strokeWidth={5} strokeLinecap="round" />
      <Line x1={cx + hw(top)} y1={top} x2={cx + hw(bottom)} y2={bottom} stroke={BROWN} strokeWidth={5} strokeLinecap="round" />
    </G>
  );
}
const evenRungs = (n: number, first: number, last: number) => Array.from({ length: n }, (_, i) => first + (i * (last - first)) / (n - 1));

/* an arm: an outlined stroke in the person's color, ending in a small hand */
function Arm({ x1, y1, x2, y2, fill }: { x1: number; y1: number; x2: number; y2: number; fill: string }) {
  return (
    <G>
      <Line x1={x1} y1={y1} x2={x2} y2={y2} stroke={fill} strokeWidth={6} strokeLinecap="round" />
      <Circle cx={x2} cy={y2} r={3.6} fill={SKIN} stroke={BEAR_LINE} strokeWidth={1.2} />
    </G>
  );
}

/* ---------- the ladder ---------- */
function LadderScene({ k }: { k: Ink }) {
  return (
    <Frame label="A tall wooden ladder with twelve rungs rising from the ground toward a warm glow at the top, where a small figure stands in the light; a small person at the foot looks up">
      <Circle cx={150} cy={32} r={27} fill={GOLD} opacity={0.2} />
      <Circle cx={150} cy={32} r={19} fill={GOLD} opacity={0.35} />
      <Circle cx={150} cy={32} r={11} fill={GOLD} opacity={0.75} />
      <Line x1={14} y1={170} x2={286} y2={170} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      <Ladder cx={150} top={40} bottom={170} wTop={40} wBottom={76} rungs={evenRungs(12, 52, 160)} />
      <Person x={150} y={50} s={0.34} fill={BEAR_LINE} />
      <Path d="M154 32 L159 23" stroke={BEAR_LINE} strokeWidth={2.2} strokeLinecap="round" />
      <Person x={84} y={170} s={0.95} fill={k.ink} face={k.bg} />
      <Cap k={k} s="Twelve rungs, one way up" />
    </Frame>
  );
}

/* ---------- honesty, people, action ---------- */
/* the open hand: four fingers and a thumb, as short strokes */
const HAND = [
  [41, -31, 56, -37],
  [41, -31, 58, -32],
  [41, -31, 58, -27],
  [40, -30, 55, -23],
  [32, -33, 38, -41],
];
function Three({ k }: { k: Ink }) {
  return (
    <Frame label="Three small scenes on one ground line: a person holding out an open hand palm up, two people standing close side by side, and footprints walking off to the right">
      <Line x1={14} y1={152} x2={286} y2={152} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      <G transform="translate(30 152) scale(1.1)">
        <Person x={0} y={0} s={1} fill={k.ink} face={k.bg} />
        <Line x1={10} y1={-28} x2={30} y2={-30} stroke={k.ink} strokeWidth={7} strokeLinecap="round" />
        {HAND.map(([x1, y1, x2, y2], i) => (
          <Line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={BEAR_LINE} strokeWidth={5.4} strokeLinecap="round" />
        ))}
        <Ellipse cx={36} cy={-30} rx={9} ry={5} fill={SKIN} stroke={BEAR_LINE} strokeWidth={1.4} />
        {HAND.map(([x1, y1, x2, y2], i) => (
          <Line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={SKIN} strokeWidth={3} strokeLinecap="round" />
        ))}
      </G>
      <G transform="translate(152 152) scale(1.1)">
        <Person x={-19} y={0} s={1} fill={k.ink} face={k.bg} />
        <Person x={19} y={0} s={1} fill={k.acc} />
        <Circle cx={15} cy={-47} r={1.8} fill={k.bg} />
      </G>
      {[0, 1, 2, 3].map((i) =>
        [-1, 1].map((side) => {
          const x = 212 + i * 20 + side * 2.5 + (side > 0 ? 4 : 0);
          const y = 142 - i * 5.7 - side * 5;
          return (
            <Path
              key={`${i}-${side}`}
              transform={`translate(${x} ${y}) rotate(74)`}
              d="M0 -6 C3.6 -6 4 -2 3 1 C2.4 4 2 6 0 6 C-2 6 -2.6 4 -2.4 1 C-3.6 -2 -3.6 -6 0 -6 Z"
              fill={k.ink}
              stroke={BEAR_LINE}
              strokeWidth={1.2}
              strokeLinejoin="round"
            />
          );
        }),
      )}
      <Cap k={k} s="Honesty, people, action" />
    </Frame>
  );
}

/* ---------- the clipboard ---------- */
function Clipboard({ k }: { k: Ink }) {
  const wave = Array.from({ length: 8 }, (_, i) => `q4 ${i % 2 ? 6 : -6} 8 0`).join(' ');
  return (
    <Frame label="A clipboard tilted a little, with one line of scribble and two checkboxes below it, the first ticked, and a pencil lying across the corner">
      <G transform="rotate(-5 150 92)">
        <Rect x={104} y={18} width={92} height={146} rx={8} fill={BROWN} stroke={BEAR_LINE} strokeWidth={1.6} />
        <Rect x={112} y={34} width={76} height={122} rx={3} fill={WHITE} stroke={BEAR_LINE} strokeWidth={1.2} />
        <Rect x={134} y={11} width={32} height={17} rx={4} fill={GRAY} stroke={BEAR_LINE} strokeWidth={1.6} />
        <Circle cx={150} cy={19} r={2.4} fill={BEAR_LINE} />
        <Path d={`M120 56 ${wave}`} stroke={BEAR_LINE} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.75} />
        <Rect x={120} y={86} width={14} height={14} rx={3} fill={WHITE} stroke={BEAR_LINE} strokeWidth={1.8} />
        <Path d="M122.5 93.5 L127 98 L136 85" stroke={k.acc} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <Path d="M142 93 L176 93" stroke={BEAR_LINE} strokeWidth={1.8} strokeLinecap="round" opacity={0.5} />
        <Rect x={120} y={116} width={14} height={14} rx={3} fill={WHITE} stroke={BEAR_LINE} strokeWidth={1.8} />
        <Path d="M142 123 L170 123" stroke={BEAR_LINE} strokeWidth={1.8} strokeLinecap="round" opacity={0.5} />
      </G>
      <G transform="translate(186 146) rotate(-35)">
        <Rect x={-34} y={-4} width={7} height={8} rx={2} fill="#F28B9A" stroke={BEAR_LINE} strokeWidth={1.2} />
        <Rect x={-27} y={-4} width={5} height={8} fill={GRAY} stroke={BEAR_LINE} strokeWidth={1.2} />
        <Rect x={-22} y={-4} width={40} height={8} fill={GOLD} stroke={BEAR_LINE} strokeWidth={1.4} />
        <Path d="M18 -4 L30 0 L18 4 Z" fill="#F3D9B1" stroke={BEAR_LINE} strokeWidth={1.2} strokeLinejoin="round" />
        <Path d="M27.5 -1.2 L30 0 L27.5 1.2 Z" fill={BEAR_LINE} />
      </G>
      <Cap k={k} s="Were you helping anyone?" />
    </Frame>
  );
}

/* ---------- helping near the bottom ---------- */
function EarlyHelp({ k }: { k: Ink }) {
  const rungs = [156, 128, 100, 72, 44];
  const hw = 50;
  return (
    <Frame label="The bottom of a tall straight ladder: one person on the third rung reaches a hand down to another person who is stepping onto the first rung">
      <Line x1={14} y1={170} x2={286} y2={170} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      <Ladder cx={150} top={16} bottom={170} wTop={2 * hw} wBottom={2 * hw} rungs={rungs} />
      <Arm x1={110} y1={76} x2={150 - hw + 2} y2={82} fill={k.ink} />
      <Arm x1={190} y1={132} x2={150 + hw - 2} y2={134} fill={k.acc} />
      <Person x={120} y={98} s={0.85} fill={k.ink} face={k.bg} />
      <Person x={180} y={154} s={0.85} fill={k.acc} />
      <Circle cx={176} cy={113} r={1.6} fill={k.bg} />
      <Arm x1={130} y1={78} x2={149} y2={106} fill={k.ink} />
      <Arm x1={170} y1={134} x2={152} y2={108} fill={k.acc} />
      <Cap k={k} s="Near the bottom, helping" />
    </Frame>
  );
}

/* ---------- the helper gains too ---------- */
function Helper({ k }: { k: Ink }) {
  return (
    <Frame label="Two people facing each other; the one on the left hands a small warm light across, and both are lit by it, the helper just as warmly as the one helped">
      <Circle cx={100} cy={118} r={50} fill={GOLD} opacity={0.42} />
      <Circle cx={200} cy={118} r={50} fill={GOLD} opacity={0.42} />
      <Line x1={14} y1={166} x2={286} y2={166} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      <Person x={100} y={166} s={1.3} fill={k.ink} face={k.bg} />
      <Person x={200} y={166} s={1.3} fill={k.acc} />
      <Circle cx={195} cy={104} r={2.3} fill={k.bg} />
      <Arm x1={112} y1={132} x2={141} y2={122} fill={k.ink} />
      <Arm x1={188} y1={132} x2={159} y2={122} fill={k.acc} />
      <Circle cx={150} cy={120} r={11} fill={GOLD} opacity={0.4} />
      <Circle cx={150} cy={120} r={5.5} fill={GOLD} stroke={GOLD_DEEP} strokeWidth={1.4} />
      <Path d="M150 100 L150 105 M139 104 L142 108 M161 104 L158 108" stroke={GOLD_DEEP} strokeWidth={2.2} strokeLinecap="round" />
      <Cap k={k} s="The helper gains too" />
    </Frame>
  );
}

/* ---------- something to give ---------- */
function Lamp({ k }: { k: Ink }) {
  return (
    <Frame label="One person hands a small lantern to another, and its soft round glow of warm light reaches both of their faces">
      <Path d="M112.05 168 A70 70 0 1 1 213.95 168 Z" fill={GOLD} opacity={0.25} />
      <Line x1={14} y1={166} x2={286} y2={166} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      <Person x={96} y={166} s={1.25} fill={k.ink} face={k.bg} />
      <Person x={218} y={166} s={1.25} fill={k.acc} />
      <Circle cx={218} cy={106} r={13.75} fill={GOLD} opacity={0.3} />
      <Path d="M208.5 96.5 A13.75 13.75 0 0 0 208.5 115.5" stroke={GOLD} strokeWidth={4} strokeLinecap="round" fill="none" />
      <Circle cx={213} cy={106} r={2.2} fill={GOLD} />
      <Arm x1={108} y1={130} x2={150} y2={122} fill={k.ink} />
      <Arm x1={206} y1={132} x2={176} y2={124} fill={k.acc} />
      <Circle cx={163} cy={120} r={26} fill={GOLD} opacity={0.28} />
      <Path d="M157 108 Q163 100 169 108" stroke={BEAR_LINE} strokeWidth={1.8} fill="none" strokeLinecap="round" />
      <Rect x={156} y={108} width={14} height={4} rx={1.5} fill={BROWN} stroke={BEAR_LINE} strokeWidth={1.2} />
      <Rect x={157} y={112} width={12} height={16} rx={2.5} fill={GOLD} stroke={BEAR_LINE} strokeWidth={1.4} />
      <Rect x={156} y={128} width={14} height={4} rx={1.5} fill={BROWN} stroke={BEAR_LINE} strokeWidth={1.2} />
      <Cap k={k} s="Something to give" />
    </Frame>
  );
}

/* ---------- the rope ---------- */
function Rope({ k }: { k: Ink }) {
  return (
    <Frame label="A grassy riverbank sloping down to the water: one person stands a little way up the bank, braced, throwing a rope that arcs down to a second person waist-deep in the water, reaching up for it">
      <Path d="M10 84 Q90 86 130 106 Q160 124 186 146 L186 172 L10 172 Z" fill={BROWN} />
      <Path d="M10 84 Q90 86 130 106 Q160 124 186 146" stroke={GREEN} strokeWidth={7} strokeLinecap="round" fill="none" />
      <Path d="M10 82 Q90 84 130 104" stroke="#4FA36B" strokeWidth={2} strokeLinecap="round" fill="none" />
      <G transform="rotate(-7 70 88)">
        <Person x={70} y={88} s={1} fill={k.ink} face={k.bg} />
      </G>
      <Arm x1={60} y1={63} x2={52} y2={76} fill={k.ink} />
      <Ellipse cx={48} cy={82} rx={7} ry={3} fill="none" stroke={ROPE} strokeWidth={2.4} />
      <Ellipse cx={48} cy={79} rx={7} ry={3} fill="none" stroke={ROPE} strokeWidth={2.4} />
      <Path d="M101 46 Q165 22 226 104" stroke={ROPE} strokeWidth={3.2} strokeLinecap="round" fill="none" />
      <Arm x1={80} y1={62} x2={101} y2={46} fill={k.ink} />
      <Person x={238} y={164} s={1} fill={k.acc} />
      <Circle cx={234} cy={116} r={1.8} fill={k.bg} />
      <Arm x1={246} y1={138} x2={228} y2={106} fill={k.acc} />
      <Rect x={186} y={146} width={104} height={26} fill={WATER} opacity={0.88} />
      <Line x1={186} y1={146} x2={290} y2={146} stroke={WHITE} strokeWidth={2.2} strokeLinecap="round" opacity={0.85} />
      <Path d="M200 156 q6 -4 12 0 M258 160 q6 -4 12 0 M218 166 q6 -4 12 0" stroke={WHITE} strokeWidth={1.8} strokeLinecap="round" fill="none" opacity={0.8} />
      <Cap k={k} s="A little further up the bank" />
    </Frame>
  );
}

/* ---------- the circle ---------- */
function Circle6({ k }: { k: Ink }) {
  /* five chairs in an arc seen at eye level: two far ones, two at the sides, and the empty one at the front, facing us */
  const chairs: { x: number; y: number; s: number; who?: string }[] = [
    { x: 112, y: 84, s: 0.72, who: k.acc },
    { x: 188, y: 84, s: 0.72, who: k.ink },
    { x: 56, y: 118, s: 0.95, who: ORANGE },
    { x: 244, y: 118, s: 0.95, who: k.acc },
    { x: 150, y: 148, s: 1.2 },
  ];
  return (
    <Frame label="Five chairs in an arc, seen from the front at eye level: four have people sitting in them, and one empty chair at the front center faces us with a soft pool of warm light on the floor under it, a place for you">
      <Ellipse cx={150} cy={118} rx={128} ry={50} fill={k.line} opacity={0.22} />
      <Ellipse cx={150} cy={162} rx={46} ry={9} fill={GOLD} opacity={0.3} />
      <Ellipse cx={150} cy={162} rx={28} ry={6} fill={GOLD} opacity={0.45} />
      {chairs.map(({ x, y, s: sc, who }) => (
        <G key={x} transform={`translate(${x} ${y}) scale(${sc})`}>
          <Rect x={-10} y={4} width={3} height={13} fill={BROWN} stroke={BEAR_LINE} strokeWidth={1} />
          <Rect x={7} y={4} width={3} height={13} fill={BROWN} stroke={BEAR_LINE} strokeWidth={1} />
          <Rect x={-11} y={-28} width={22} height={28} rx={3} fill={BROWN} stroke={BEAR_LINE} strokeWidth={1.2} />
          {who ? (
            <G stroke={BEAR_LINE} strokeWidth={1}>
              <Rect x={-7} y={2} width={6} height={15} rx={3} fill={who} />
              <Rect x={1} y={2} width={6} height={15} rx={3} fill={who} />
              <Path d="M-8 2 L-8 -12 Q-8 -20 0 -20 Q8 -20 8 -12 L8 2 Z" fill={who} />
              <Circle cx={0} cy={-29} r={7} fill={who} />
            </G>
          ) : null}
          <Rect x={-13} y={-1} width={26} height={6} rx={2} fill={who ? WOOD : GOLD} stroke={BEAR_LINE} strokeWidth={1.2} />
        </G>
      ))}
      <Cap k={k} s="You can just listen" />
    </Frame>
  );
}

export const SCENES_L25: Record<string, ComponentType<{ k: Ink }>> = {
  'l22-ladder': LadderScene,
  'l22-three': Three,
  'l22-clipboard': Clipboard,
  'l22-early-help': EarlyHelp,
  'l22-helper': Helper,
  'l22-lamp': Lamp,
  'l22-rope': Rope,
  'l22-circle': Circle6,
};
