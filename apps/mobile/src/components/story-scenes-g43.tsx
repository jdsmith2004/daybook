/* Scenes for lesson 43 told as a story (see story-kit.tsx): "Come back to the room". An urge pulls the mind out of the room into a scene in
   the head; the picture borrows the senses; real work for the eyes and the nose turns it down (jasmine, in the 2012 chocolate study);
   the floor, the air and the lamp are still here. Each thing named takes a little of the screen back, and if the picture returns, come back again. */
import { useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { Easing } from 'react-native';
import { Circle, ClipPath, Defs, Ellipse, G, Path, Rect } from 'react-native-svg';

import { useAppear, useReducedMotion } from '@/lib/motion';

import { Frame, type Ink, Say } from './story-kit';

const L43_GOLD = '#FFD25A';
const L43_WHITE = '#FFFFFF';
const L43_WALL = '#F6E4C4';
const L43_WALL_SHADE = '#EBD3A8';
const L43_FLOOR = '#D3A06C';
const L43_FLOOR_DK = '#B98450';
const L43_BASE = '#A8733F';
const L43_WOOD = '#9A6B3E';
const L43_COUCH = '#4F8A94';
const L43_COUCH_DK = '#3B6C76';
const L43_COUCH_LT = '#6FA5AE';
const L43_CUSH = '#F0B84F';
const L43_RUG = '#C65D4A';
const L43_RUG2 = '#F3D9A4';
const L43_GREEN = '#4E9A5B';
const L43_GREEN2 = '#6DB26A';
const L43_POT = '#B5654A';
const L43_SKY = '#CDEAF7';
const L43_SKY2 = '#E8F6FC';
const L43_FRAME = '#F7F0E2';
const L43_FRAME_LN = '#B99A6B';
const L43_SKIN = '#E8B896';
const L43_SKIN_DK = '#C99878';
const L43_SHIRT = '#3B2F45';
const L43_PANTS = '#5A5F7A';
const L43_HAIR = '#3C2E2A';
const L43_LILAC = '#B99AE8';
const L43_LILAC_LT = '#EBDDFB';
const L43_INK_DK = '#3B2F45';
const L43_LAMP = '#F6D98A';

const l43Clamp = (v: number) => Math.max(0, Math.min(1, v));

/* a number from 0 to 1 that eases up once, after a short pause; with Reduce Motion on it starts at 1 */
function L43useGrow(delay = 300, dur = 1200) {
  const still = useReducedMotion();
  const v = useAppear(delay, dur, Easing.out(Easing.cubic));
  const [p, setP] = useState(still ? 1 : 0);
  useEffect(() => {
    const id = v.addListener(({ value }) => setP(value));
    return () => v.removeListener(id);
  }, [v]);
  return p;
}

/* the line of words under a picture */
function L43Cap({ k, s }: { k: Ink; s: string }) {
  return <Say x={150} y={190} s={s} fill={k.ink} />;
}

/* a spot in the standard room (the room drawn at 6, 6, 288 wide): room coordinates in, scene coordinates out */
const l43P = (lx: number, ly: number): [number, number] => [6 + 1.44 * lx, 6 + 1.44 * ly];

/* ---------- a thought cloud (a unit box 100 wide and 60 tall, stretched to w and h) and the vague glowing blob ---------- */
function L43Cloud({ x, y, w, h, fill = L43_WHITE, opacity = 1 }: { x: number; y: number; w: number; h: number; fill?: string; opacity?: number }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${w / 100} ${h / 60})`} opacity={opacity}>
      <Circle cx={28} cy={38} r={16} fill={fill} />
      <Circle cx={48} cy={26} r={22} fill={fill} />
      <Circle cx={70} cy={30} r={19} fill={fill} />
      <Circle cx={82} cy={42} r={14} fill={fill} />
      <Circle cx={18} cy={44} r={12} fill={fill} />
      <Rect x={18} y={40} width={66} height={16} rx={8} fill={fill} />
    </G>
  );
}
function L43Blob({ cx, cy, r, o = 1 }: { cx: number; cy: number; r: number; o?: number }) {
  return (
    <G opacity={o}>
      <Circle cx={cx} cy={cy} r={r * 1.5} fill={L43_LILAC} opacity={0.16} />
      <Circle cx={cx - 0.25 * r} cy={cy + 0.1 * r} r={r} fill={L43_LILAC} opacity={0.55} />
      <Circle cx={cx + 0.4 * r} cy={cy - 0.15 * r} r={r * 0.8} fill={L43_LILAC} opacity={0.55} />
      <Circle cx={cx} cy={cy} r={r * 0.5} fill={L43_LILAC_LT} opacity={0.8} />
    </G>
  );
}

/* an arrowhead: the tip is at x, y and it points the way of the angle a (degrees, 0 is to the right) */
function L43Head({ x, y, a, s, fill }: { x: number; y: number; a: number; s: number; fill: string }) {
  return (
    <Path
      d={`M0 0 L${-s} ${-s * 0.62} Q${-s * 0.72} 0 ${-s} ${s * 0.62} Z`}
      fill={fill}
      stroke={fill}
      strokeWidth={1.4}
      strokeLinejoin="round"
      transform={`translate(${x} ${y}) rotate(${a})`}
    />
  );
}

/* ---------- the room ---------- */
/* A warm living room: a couch seen from the side (its back on the left), a floor lamp, a window, a plant, a rug and a side table with a mug.
   It is drawn in a space 200 wide and scaled to w (the standard room is x 6, y 6, w 288, h 160). With `dim` the room is faded and gray, and the
   lamp and window give no light. `children` are drawn in scene coordinates, inside the panel. */
function L43Room({ id, x, y, w, h, dim = false, children }: { id: string; x: number; y: number; w: number; h: number; dim?: boolean; children?: ReactNode }) {
  const s = w / 200;
  const ly = h / s;
  return (
    <G>
      <Defs>
        <ClipPath id={`l43-${id}-panel`}>
          <Rect x={x} y={y} width={w} height={h} rx={16} />
        </ClipPath>
        <ClipPath id={`l43-${id}-pane`}>
          <Rect x={118} y={12} width={50} height={40} />
        </ClipPath>
      </Defs>
      <G clipPath={`url(#l43-${id}-panel)`}>
        <G transform={`translate(${x} ${y}) scale(${s})`}>
          <Rect x={0} y={0} width={200} height={76} fill={L43_WALL} />
          <Rect x={0} y={60} width={200} height={16} fill={L43_WALL_SHADE} opacity={0.4} />
          <Rect x={0} y={76} width={200} height={ly - 76} fill={L43_FLOOR} />
          <Path d={`M0 88 H200 M0 100 H200 M60 76 V88 M150 88 V100 M30 100 V${ly} M120 100 V${ly}`} stroke={L43_FLOOR_DK} strokeWidth={0.8} opacity={0.5} />
          <Rect x={0} y={74} width={200} height={4} fill={L43_BASE} />
          {/* a small picture on the wall */}
          <Rect x={60} y={14} width={30} height={22} rx={1.5} fill={L43_FRAME} stroke={L43_FRAME_LN} strokeWidth={1.4} />
          <Rect x={64} y={18} width={22} height={14} fill={L43_SKY} />
          <Path d="M64 32 Q71 22 77 28 Q81 24 86 31 V32 Z" fill={L43_GREEN2} />
          {/* the window */}
          <Rect x={113} y={7} width={60} height={50} rx={2} fill={L43_FRAME} stroke={L43_FRAME_LN} strokeWidth={1.4} />
          <Rect x={118} y={12} width={50} height={40} fill={L43_SKY} />
          <G clipPath={`url(#l43-${id}-pane)`}>
            <Rect x={118} y={12} width={50} height={14} fill={L43_SKY2} opacity={0.7} />
            <Ellipse cx={132} cy={22} rx={10} ry={3.2} fill={L43_WHITE} opacity={0.9} />
            <Ellipse cx={140} cy={19.5} rx={6} ry={3} fill={L43_WHITE} opacity={0.9} />
            <Circle cx={160} cy={20} r={13} fill={L43_WHITE} opacity={0.45} />
            <Path d="M118 52 Q134 40 150 46 Q160 42 168 48 V52 Z" fill={L43_GREEN2} opacity={0.6} />
          </G>
          <Path d="M143 12 V52 M118 32 H168" stroke={L43_FRAME} strokeWidth={2.4} />
          <Rect x={110} y={55} width={66} height={4} rx={1.5} fill={L43_FRAME} stroke={L43_FRAME_LN} strokeWidth={1} />
          {dim ? null : <Path d="M122 76 H166 L180 108 H108 Z" fill={L43_WHITE} opacity={0.16} />}
          {/* the floor lamp */}
          {dim ? null : (
            <G>
              <Circle cx={20} cy={36} r={34} fill={L43_GOLD} opacity={0.2} />
              <Circle cx={20} cy={36} r={20} fill={L43_GOLD} opacity={0.22} />
              <Ellipse cx={26} cy={100} rx={30} ry={6} fill={L43_GOLD} opacity={0.24} />
            </G>
          )}
          <Ellipse cx={20} cy={100} rx={9} ry={2.6} fill="#6B5A3E" />
          <Rect x={19} y={44} width={2} height={56} fill="#6B5A3E" />
          <Path d="M10 24 L30 24 L35 46 L5 46 Z" fill={L43_LAMP} stroke="#D9B45A" strokeWidth={1.2} strokeLinejoin="round" />
          <Path d="M13 27 L11 43" stroke={L43_WHITE} strokeWidth={1.6} strokeLinecap="round" opacity={0.5} />
          {/* the rug */}
          <Ellipse cx={84} cy={100} rx={54} ry={8} fill={L43_RUG} />
          <Ellipse cx={84} cy={100} rx={45} ry={6} fill="none" stroke={L43_RUG2} strokeWidth={1.4} />
          <Path d="M52 100 H116 M60 97 Q84 95 108 97 M60 103 Q84 105 108 103" stroke={L43_RUG2} strokeWidth={0.9} opacity={0.7} />
          {/* the couch, from the side */}
          <Rect x={40} y={44} width={15} height={46} rx={7} fill={L43_COUCH_DK} />
          <Rect x={40} y={68} width={62} height={22} rx={6} fill={L43_COUCH} />
          <Rect x={44} y={68} width={54} height={5} rx={2.5} fill={L43_COUCH_LT} opacity={0.8} />
          <Rect x={95} y={60} width={11} height={30} rx={5.5} fill={L43_COUCH_DK} />
          <Rect x={44} y={88} width={3.4} height={6} fill="#6B4A2E" />
          <Rect x={96} y={88} width={3.4} height={6} fill="#6B4A2E" />
          <Rect x={55} y={52} width={11} height={15} rx={4} fill={L43_CUSH} transform="rotate(-8 60 60)" />
          {/* the side table and the mug */}
          <Rect x={130} y={70} width={30} height={4} rx={2} fill={L43_WOOD} />
          <Rect x={133} y={74} width={3} height={20} fill={L43_WOOD} />
          <Rect x={154} y={74} width={3} height={20} fill={L43_WOOD} />
          <Rect x={141} y={61} width={10} height={10} rx={2} fill="#E86F5B" />
          <Path d="M151 63.5 Q155.6 64 155.4 67 Q155 69 151 69" stroke="#E86F5B" strokeWidth={1.6} fill="none" />
          <Rect x={141} y={61} width={10} height={2.4} rx={1.2} fill={L43_WHITE} opacity={0.4} />
          {/* the plant */}
          <Ellipse cx={180} cy={62} rx={3.8} ry={12} fill={L43_GREEN} />
          <Ellipse cx={173} cy={68} rx={3.4} ry={10} fill={L43_GREEN2} transform="rotate(-38 173 78)" />
          <Ellipse cx={188} cy={68} rx={3.4} ry={10} fill={L43_GREEN2} transform="rotate(38 188 78)" />
          <Ellipse cx={176} cy={58} rx={3.2} ry={9} fill={L43_GREEN2} transform="rotate(-16 176 70)" />
          <Ellipse cx={184} cy={58} rx={3.2} ry={9} fill={L43_GREEN} transform="rotate(16 184 70)" />
          <Path d="M174 80 H192 L189 98 H177 Z" fill={L43_POT} />
          <Rect x={173} y={78} width={20} height={4} rx={1.5} fill="#C97A5E" />
        </G>
        {dim ? <Rect x={x} y={y} width={w} height={h} fill="#8E939C" opacity={0.62} /> : null}
        {children}
      </G>
    </G>
  );
}

/* ---------- people ---------- */
/* a person sitting on the couch, in profile, facing right: x and y are the hip on the seat. `up` turns the head and the eye up. */
function L43Sitter({ x, y, s = 1, up = false }: { x: number; y: number; s?: number; up?: boolean }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Path d="M0 -1 L22 -2 L24 29" stroke={L43_PANTS} strokeWidth={8.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d="M25 30.5 L33 31" stroke={L43_INK_DK} strokeWidth={5} strokeLinecap="round" />
      <Path d="M-1 -2 L-3 -25" stroke={L43_SHIRT} strokeWidth={15} strokeLinecap="round" />
      <Path d="M-3 -25 L0 -30" stroke={L43_SKIN} strokeWidth={5} strokeLinecap="round" />
      <G transform={up ? 'rotate(-14 0 -29)' : undefined}>
        <Circle cx={0} cy={-37} r={8.2} fill={L43_SKIN} />
        <Path d="M7.8 -38 L11 -35.4 L7.9 -34.4 Z" fill={L43_SKIN} stroke={L43_SKIN} strokeWidth={1} strokeLinejoin="round" />
        <Path d="M-8.2 -37 A8.2 8.2 0 0 1 7.6 -40.7 Q3 -41 -1 -38.5 Q-5 -36 -6 -31.5 Q-8 -33 -8.2 -37 Z" fill={L43_HAIR} />
        <Ellipse cx={4.2} cy={-37.6} rx={2.3} ry={1.9} fill={L43_WHITE} />
        <Circle cx={up ? 5.1 : 4.9} cy={up ? -38.6 : -37.6} r={1.15} fill={L43_INK_DK} />
      </G>
      <Path d="M-2 -22 L7 -10 L17 -8" stroke={L43_SHIRT} strokeWidth={5.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Circle cx={18.5} cy={-8} r={3.2} fill={L43_SKIN} />
    </G>
  );
}

/* a person standing barefoot, from the front: x is the middle and y is the floor under the feet */
function L43Stander({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Path d="M-5 -28 V-9 M5 -28 V-9" stroke={L43_PANTS} strokeWidth={9.5} strokeLinecap="butt" fill="none" />
      <Path d="M-5 -10 V-3 M5 -10 V-3" stroke={L43_SKIN} strokeWidth={6} strokeLinecap="round" />
      <Ellipse cx={-6.5} cy={-1.4} rx={6.6} ry={3.1} fill={L43_SKIN} />
      <Ellipse cx={6.5} cy={-1.4} rx={6.6} ry={3.1} fill={L43_SKIN} />
      <Path
        d="M-12 -1.8 q1 -1.6 2.4 -1.2 M-10.6 -0.4 q1 -1.4 2.4 -1 M12 -1.8 q-1 -1.6 -2.4 -1.2 M10.6 -0.4 q-1 -1.4 -2.4 -1"
        stroke={L43_SKIN_DK}
        strokeWidth={0.8}
        strokeLinecap="round"
        fill="none"
      />
      <Path d="M-13 -52 L-16 -28 M13 -52 L16 -28" stroke={L43_SHIRT} strokeWidth={6.4} strokeLinecap="round" />
      <Circle cx={-16.4} cy={-25.5} r={3.2} fill={L43_SKIN} />
      <Circle cx={16.4} cy={-25.5} r={3.2} fill={L43_SKIN} />
      <Path d="M-12 -50 Q-12 -57 -5 -57 H5 Q12 -57 12 -50 V-24 H-12 Z" fill={L43_SHIRT} />
      <Rect x={-3} y={-60} width={6} height={6} fill={L43_SKIN} />
      <Circle cx={0} cy={-66} r={9.4} fill={L43_SKIN} />
      <Path d="M-9.4 -66 A9.4 9.4 0 0 1 9.4 -66 Q4 -70 0 -69 Q-5 -70 -9.4 -66 Z" fill={L43_HAIR} />
      <Circle cx={-3.4} cy={-65.4} r={1} fill={L43_INK_DK} />
      <Circle cx={3.4} cy={-65.4} r={1} fill={L43_INK_DK} />
      <Path d="M-3 -61.4 Q0 -59 3 -61.4" stroke="#8A4B3A" strokeWidth={1.3} strokeLinecap="round" fill="none" />
    </G>
  );
}

/* ---------- 1. five, four, three, two, one ---------- */
const L43_IC = 2.4;
function L43Eye({ c }: { c: string }) {
  return (
    <G>
      <Path d="M-17 0 Q0 -15 17 0 Q0 15 -17 0 Z" stroke={c} strokeWidth={L43_IC} strokeLinejoin="round" fill="none" />
      <Circle cx={0} cy={0} r={6} stroke={c} strokeWidth={L43_IC} fill="none" />
      <Circle cx={0} cy={0} r={2.4} fill={c} />
    </G>
  );
}
/* a hand: every part is drawn twice, first fat in the line color and then in the page color, so only the outline of the whole hand shows */
const L43_HAND: Array<{ x: number; y: number; w: number; h: number; r: number; rot?: string }> = [
  { x: -9.5, y: 2, w: 19, h: 16, r: 6 },
  { x: -9.5, y: -11, w: 4, h: 20, r: 2 },
  { x: -4.5, y: -16, w: 4, h: 25, r: 2 },
  { x: 0.5, y: -15, w: 4, h: 24, r: 2 },
  { x: 5.5, y: -10, w: 4, h: 19, r: 2 },
  { x: -14, y: 2, w: 4.4, h: 14, r: 2.2, rot: 'rotate(-38 -9 14)' },
];
function L43HandIcon({ c, bg }: { c: string; bg: string }) {
  return (
    <G>
      {L43_HAND.map((p, i) => (
        <Rect
          key={`a${i}`}
          x={p.x}
          y={p.y}
          width={p.w}
          height={p.h}
          rx={p.r}
          fill={c}
          stroke={c}
          strokeWidth={L43_IC * 2}
          strokeLinejoin="round"
          transform={p.rot}
        />
      ))}
      {L43_HAND.map((p, i) => (
        <Rect key={`b${i}`} x={p.x} y={p.y} width={p.w} height={p.h} rx={p.r} fill={bg} transform={p.rot} />
      ))}
    </G>
  );
}
function L43Ear({ c }: { c: string }) {
  return (
    <G>
      <Path
        d="M-2 20 Q-9 20 -9 13 Q-9 9 -12 5 Q-16 0 -14 -8 Q-11 -18 0 -18 Q12 -18 12 -7 Q12 0 6 4 Q2 7 2 12 Q2 20 -2 20"
        stroke={c}
        strokeWidth={L43_IC}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Path d="M0 -10 Q6 -10 6 -5 Q6 -1 2 1 Q-1 3 -1 7" stroke={c} strokeWidth={L43_IC} strokeLinecap="round" fill="none" />
      <Path d="M17 -6 Q21 -1 17 4" stroke={c} strokeWidth={L43_IC} strokeLinecap="round" fill="none" />
    </G>
  );
}
function L43Nose({ c }: { c: string }) {
  return (
    <G>
      <Path
        d="M-3 -17 Q-6 0 -11 9 Q-15 15 -9 17 Q-4 18 0 14 Q4 18 9 17 Q15 15 11 9 Q6 0 3 -17"
        stroke={c}
        strokeWidth={L43_IC}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Path d="M-8 12 Q-5.4 9.6 -3.4 12 M8 12 Q5.4 9.6 3.4 12" stroke={c} strokeWidth={L43_IC} strokeLinecap="round" fill="none" />
    </G>
  );
}
function L43Mouth({ c }: { c: string }) {
  return (
    <G>
      <Path d="M-16 0 Q-9 -9 -3 -5 Q0 -3.5 3 -5 Q9 -9 16 0 Q8 11 0 11 Q-8 11 -16 0 Z" stroke={c} strokeWidth={L43_IC} strokeLinejoin="round" fill="none" />
      <Path d="M-16 0 Q0 5 16 0" stroke={c} strokeWidth={L43_IC} strokeLinecap="round" fill="none" />
    </G>
  );
}

function L43Count({ k }: { k: Ink }) {
  const p = L43useGrow(300, 2000);
  const cols = [36, 93, 150, 207, 264];
  const nums = ['5', '4', '3', '2', '1'];
  return (
    <Frame label="The numbers five, four, three, two and one in a row, each with a small line icon under it: an eye, a hand, an ear, a nose and a mouth.">
      {nums.map((n, i) => {
        const a = l43Clamp((p * 6 - i) / 1.2);
        const c = cols[i];
        return (
          <G key={n} opacity={a} transform={`translate(0 ${6 * (1 - a)})`}>
            <Say x={c} y={92} s={n} fill={k.ink} size={84} />
            <G transform={`translate(${c} 138)`}>
              {i === 0 ? <L43Eye c={k.acc} /> : null}
              {i === 1 ? <L43HandIcon c={k.acc} bg={k.bg} /> : null}
              {i === 2 ? <L43Ear c={k.acc} /> : null}
              {i === 3 ? <L43Nose c={k.acc} /> : null}
              {i === 4 ? <L43Mouth c={k.acc} /> : null}
            </G>
          </G>
        );
      })}
      <L43Cap k={k} s="Five, four, three, two, one" />
    </Frame>
  );
}

/* ---------- 2. the body is here, the mind is not ---------- */
function L43Away({ k }: { k: Ink }) {
  return (
    <Frame label="A dim, gray living room. A person sits on the couch with their eyes turned up to a thought cloud high above that holds a soft glowing blob. The body is in the room, but the mind is not.">
      <L43Room id="away" x={6} y={6} w={288} h={160} dim>
        <Circle cx={97} cy={57} r={2.2} fill={L43_WHITE} opacity={0.95} />
        <Circle cx={95} cy={52} r={3.1} fill={L43_WHITE} opacity={0.95} />
        <L43Cloud x={38} y={8} w={140} h={44} />
        <L43Blob cx={108} cy={30} r={11} />
        <L43Sitter x={98} y={104} up />
      </L43Room>
      <Rect x={6} y={6} width={288} height={160} rx={16} fill="none" stroke={k.line} strokeWidth={1.5} />
      <L43Cap k={k} s="The body is here. The mind is not." />
    </Frame>
  );
}

/* ---------- 3. give the senses real work ---------- */
const L43_HEAD = 'M-30 -4 Q-36 -44 -2 -46 Q34 -46 36 -14 L44 2 Q46 6 40 8 L36 8 Q38 20 28 22 L26 34 L-8 34 L-8 22 Q-30 16 -30 -4 Z';
const L43_RAINBOW: Array<[number, string]> = [
  [22, '#E5675B'],
  [18, '#F2B84B'],
  [14, '#5BAE72'],
  [10, '#4DA3E8'],
];
function L43Senses({ k }: { k: Ink }) {
  const p = L43useGrow(500, 1800);
  const r = 11.5 - 6 * p;
  return (
    <Frame label="A head in profile with a thought cloud inside it and a faint blob in the cloud. Two small sense icons beside the head, an eye with a rainbow arc and a nose with curling scent lines, push toward it, and the blob shrinks.">
      <G transform="translate(92 88) scale(1.7)">
        <Path d={L43_HEAD} fill={k.soft} stroke={k.line} strokeWidth={2} strokeLinejoin="round" />
        <Circle cx={25} cy={-14} r={1.8} fill={k.ink} />
        <L43Cloud x={-27} y={-41} w={52} h={32} opacity={0.92} />
        <Circle cx={-3} cy={-24} r={11.5} fill="none" stroke={L43_LILAC} strokeWidth={0.7} strokeDasharray="2 2" opacity={0.7} />
        <L43Blob cx={-3} cy={-24} r={r} o={0.8} />
      </G>
      {L43_RAINBOW.map(([rad, col]) => (
        <Path key={col} d={`M${232 - rad} 62 A${rad} ${rad} 0 0 1 ${232 + rad} 62`} stroke={col} strokeWidth={3.2} fill="none" />
      ))}
      <G transform="translate(232 78) scale(1.15)">
        <L43Eye c={k.ink} />
      </G>
      <G transform="translate(232 136) scale(1.25)">
        <L43Nose c={k.ink} />
      </G>
      <Path
        d="M222 114 q-5 -5 0 -9 t0 -9 M232 114 q-5 -5 0 -9 t0 -9 M242 114 q-5 -5 0 -9 t0 -9"
        stroke={L43_LILAC}
        strokeWidth={2.2}
        strokeLinecap="round"
        fill="none"
      />
      <Path d="M212 78 H196 M201 73 L195 78 L201 83" stroke={k.acc} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d="M212 136 H196 M201 131 L195 136 L201 141" stroke={k.acc} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <L43Cap k={k} s="Give the senses real work" />
    </Frame>
  );
}

/* ---------- 4. jasmine cut the craving most ---------- */
/* a small glass bottle: x is the middle and y the bottom; about 50 wide and 62 tall */
function L43Bottle({ id, x, y, liquid, label }: { id: string; x: number; y: number; liquid: string; label: string }) {
  const body = 'M-25 -6 Q-25 0 -19 0 H19 Q25 0 25 -6 V-30 Q25 -38 14 -40 L7 -42 V-54 H-7 V-42 L-14 -40 Q-25 -38 -25 -30 Z';
  return (
    <G transform={`translate(${x} ${y})`}>
      <Defs>
        <ClipPath id={id}>
          <Path d={body} />
        </ClipPath>
      </Defs>
      <Ellipse cx={0} cy={1} rx={27} ry={3.4} fill="#000000" opacity={0.16} />
      <Path d={body} fill="#EAF6F8" opacity={0.85} />
      <G clipPath={`url(#${id})`}>
        <Rect x={-25} y={-34} width={50} height={36} fill={liquid} opacity={0.85} />
        <Rect x={-25} y={-34} width={50} height={2.4} fill={L43_WHITE} opacity={0.5} />
      </G>
      <Path d={body} fill="none" stroke="#7FA9BB" strokeWidth={1.6} strokeLinejoin="round" />
      <Rect x={-6.5} y={-62} width={13} height={9} rx={2.4} fill="#B88A52" />
      <Rect x={-22} y={-27} width={44} height={17} rx={2.5} fill="#FFFDF4" stroke="#D9CFB8" strokeWidth={1} />
      <Say x={0} y={-15} s={label} fill={L43_INK_DK} size={9.5} />
      <Path d="M-20 -34 Q-22 -18 -19 -6" stroke={L43_WHITE} strokeWidth={2.2} strokeLinecap="round" fill="none" opacity={0.6} />
    </G>
  );
}
function L43Jasmine({ k }: { k: Ink }) {
  const p = L43useGrow(500, 1800);
  return (
    <Frame label="Three small glass bottles stand on a table, labeled Jasmine, Apple and Water. A small white jasmine flower lies beside the jasmine bottle and scent lines curl up from it toward a small chocolate square that is fading away.">
      <Defs>
        <ClipPath id="l43-jas-panel">
          <Rect x={6} y={6} width={288} height={160} rx={16} />
        </ClipPath>
      </Defs>
      <G clipPath="url(#l43-jas-panel)">
        <Rect x={6} y={6} width={288} height={160} fill={L43_WALL} />
        <Rect x={6} y={140} width={288} height={30} fill="#D8A877" />
        <Rect x={6} y={139} width={288} height={3.4} fill="#E8C092" />
        <Rect x={6} y={158} width={288} height={12} fill={L43_FLOOR_DK} />
        <L43Bottle id="l43-jas-b1" x={62} y={150} liquid="#B6D86B" label="Apple" />
        <L43Bottle id="l43-jas-b2" x={150} y={150} liquid="#F4EBC8" label="Jasmine" />
        <L43Bottle id="l43-jas-b3" x={238} y={150} liquid="#BFE3F2" label="Water" />
        <G transform="translate(196 139)">
          <Path d="M-14 7 Q-24 8 -28 4" stroke={L43_GREEN} strokeWidth={2} strokeLinecap="round" fill="none" />
          <Ellipse cx={-21} cy={9.5} rx={5.2} ry={2.4} fill={L43_GREEN2} transform="rotate(-18 -21 9.5)" />
          {[0, 72, 144, 216, 288].map((a) => (
            <Ellipse key={a} cx={0} cy={-6} rx={3.8} ry={5.2} fill={L43_WHITE} stroke="#D9D2C0" strokeWidth={0.8} transform={`rotate(${a})`} />
          ))}
          <Circle cx={0} cy={0} r={2.6} fill="#F2C94C" />
        </G>
        <Path
          d="M140 84 q-6 -5 0 -10 t0 -10 t0 -10 M150 82 q-6 -5 0 -10 t0 -10 t0 -10 M160 84 q-6 -5 0 -10 t0 -10 t0 -10"
          stroke={L43_LILAC}
          strokeWidth={2.4}
          strokeLinecap="round"
          fill="none"
          opacity={0.5 + 0.5 * p}
        />
        <G transform={`translate(150 34) scale(${1 - 0.18 * p})`} opacity={1 - 0.7 * p}>
          <Rect x={-19} y={-19} width={38} height={38} rx={5} fill="#6B3E26" stroke="#4E2A18" strokeWidth={1.4} />
          <Rect x={-16} y={-16} width={14} height={14} rx={2} fill="#7D4B30" />
          <Rect x={2} y={-16} width={14} height={14} rx={2} fill="#7D4B30" />
          <Rect x={-16} y={2} width={14} height={14} rx={2} fill="#7D4B30" />
          <Rect x={2} y={2} width={14} height={14} rx={2} fill="#7D4B30" />
          <Path d="M0 -19 V19 M-19 0 H19" stroke="#4E2A18" strokeWidth={1.6} />
          <Path d="M-14 -13 H-6" stroke={L43_WHITE} strokeWidth={1.4} strokeLinecap="round" opacity={0.35} />
        </G>
      </G>
      <Rect x={6} y={6} width={288} height={160} rx={16} fill="none" stroke={k.line} strokeWidth={1.5} />
      <L43Cap k={k} s="Jasmine cut the craving most" />
    </Frame>
  );
}

/* ---------- 5. the floor is not in your head ---------- */
function L43Floor({ k }: { k: Ink }) {
  const [fx, fy] = [135, 150];
  return (
    <Frame label="The living room in full warm color: the lamp glows, the window is bright, and a person stands barefoot on the rug with their feet in plain view and small soft highlights on the floor beneath them.">
      <L43Room id="floor" x={6} y={6} w={288} h={160}>
        <Ellipse cx={fx} cy={fy + 1} rx={28} ry={5.6} fill={L43_GOLD} opacity={0.3} />
        <Ellipse cx={fx} cy={fy + 1} rx={18} ry={3.4} fill={L43_WHITE} opacity={0.3} />
        <L43Stander x={fx} y={fy} />
        <Path
          d={`M${fx - 30} ${fy + 4} q6 3 12 3 M${fx + 18} ${fy + 7} q6 0 12 -3`}
          stroke={L43_WHITE}
          strokeWidth={1.6}
          strokeLinecap="round"
          fill="none"
          opacity={0.6}
        />
        <Circle cx={fx - 24} cy={fy - 3} r={1.4} fill={L43_WHITE} opacity={0.8} />
        <Circle cx={fx + 27} cy={fy - 1} r={1.2} fill={L43_WHITE} opacity={0.8} />
      </L43Room>
      <Rect x={6} y={6} width={288} height={160} rx={16} fill="none" stroke={k.line} strokeWidth={1.5} />
      <L43Cap k={k} s="The floor is not in your head" />
    </Frame>
  );
}

/* ---------- 6. each thing you name is yours again ---------- */
function L43Mark({ x, y, n, a }: { x: number; y: number; n: string; a: number }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${0.4 + 0.6 * a})`} opacity={a}>
      <Circle cx={0} cy={0} r={8.6} fill={L43_GOLD} stroke="#B8892E" strokeWidth={1.4} />
      <Say x={0} y={4} s={n} fill={L43_INK_DK} size={11.5} />
    </G>
  );
}
function L43Five({ k }: { k: Ink }) {
  const p = L43useGrow(400, 2200);
  const pts = [l43P(20, 36), l43P(143, 32), l43P(184, 64), l43P(62, 100), l43P(146, 65)];
  return (
    <Frame label="The living room in full color with five small numbered markers placed on the lamp, the window, the plant, the rug and a mug on a side table, while a faint thought cloud in the corner shrinks.">
      <L43Room id="five" x={6} y={6} w={288} h={160}>
        <G transform={`translate(46 30) scale(${1 - 0.5 * p})`} opacity={0.75}>
          <L43Cloud x={-34} y={-22} w={68} h={44} fill={L43_WHITE} />
          <L43Blob cx={0} cy={0} r={8} o={0.8} />
        </G>
        {pts.map(([px, py], i) => (
          <L43Mark key={i} x={px} y={py} n={String(i + 1)} a={l43Clamp((p * 6 - i) / 1.4)} />
        ))}
      </L43Room>
      <Rect x={6} y={6} width={288} height={160} rx={16} fill="none" stroke={k.line} strokeWidth={1.5} />
      <L43Cap k={k} s="Each thing you name is yours again" />
    </Frame>
  );
}

/* ---------- 7. come back, and back again ---------- */
function L43Again({ k }: { k: Ink }) {
  const p = L43useGrow(400, 1600);
  const back = '#2F9E74';
  const out = '#8A6FB8';
  return (
    <Frame label="A person sits on the couch in the warm room. A thin arrow goes up out of the room into a small thought cloud, and a bolder arrow comes back down from the cloud into the room to the person.">
      <L43Room id="again" x={6} y={6} w={288} h={160}>
        <L43Cloud x={150} y={10} w={76} h={42} />
        <L43Blob cx={188} cy={32} r={6} o={0.9} />
        <L43Sitter x={98} y={104} />
        <Path d="M100 56 C108 44 126 38 143 38" stroke={out} strokeWidth={2.2} strokeLinecap="round" fill="none" />
        <L43Head x={152} y={38} a={0} s={8} fill={out} />
        <G opacity={0.35 + 0.65 * p}>
          <Path d="M222 40 C258 52 244 92 196 86 C166 82 140 74 128 70" stroke={L43_WHITE} strokeWidth={9} strokeLinecap="round" fill="none" opacity={0.65} />
          <Path d="M222 40 C258 52 244 92 196 86 C166 82 140 74 128 70" stroke={back} strokeWidth={5} strokeLinecap="round" fill="none" />
          <L43Head x={119.5} y={67.1} a={198.4} s={12} fill={back} />
        </G>
      </L43Room>
      <Rect x={6} y={6} width={288} height={160} rx={16} fill="none" stroke={k.line} strokeWidth={1.5} />
      <L43Cap k={k} s="Come back, and back again" />
    </Frame>
  );
}

export const SCENES_G43: Record<string, ComponentType<{ k: Ink }>> = {
  'l43-count': L43Count,
  'l43-away': L43Away,
  'l43-senses': L43Senses,
  'l43-jasmine': L43Jasmine,
  'l43-floor': L43Floor,
  'l43-five': L43Five,
  'l43-again': L43Again,
};
