/* Scenes for lesson 30, told as a story (see story-kit.tsx and story-scenes-f.tsx): a church leader and the hardest thing he tried, the mind as a
   stage with the curtain always up, a shady thought slipping in from the wings, a hymn learned by heart that fills the stage, the pilot whose
   engines sang it back, and a prayer as a place to stand. */
import { useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { Animated, Easing } from 'react-native';
import { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';

import { useReducedMotion } from '@/lib/motion';

import { BEAR_LINE, Cloud, Frame, type Ink, Person, Say } from './story-kit';

const BROWN = '#8A5A2B';
const WOOD = '#B07A45';
const WOOD_D = '#8A5A2B';
const GOLD = '#FFD25A';
const AMBER = '#FFA94D';
const SAND = '#E8B84A';
const WHITE = '#FFFFFF';
const CREAM = '#FFF5E1';
const CURT = '#B3263A';
const CURT_D = '#7F1829';
const CURT_L = '#D24B5E';
const WALL = '#2E1B3A';
const ORANGE = '#D9602A';
const SKIN = '#E8B48A';
const SUIT = '#6F82B8';
const SHADE = '#4B5068';
const SHADE_LINE = '#9AA0B8';
const RAIN_CLOUD = '#6E7690';
const RAIN = '#9FB4D8';

/* the line of words under a picture */
function Cap({ k, s }: { k: Ink; s: string }) {
  return <Say x={150} y={190} s={s} fill={k.ink} />;
}

/* a slow looping phase from 0 to 1 for things that drift (still, at a fixed phase, when motion is reduced) */
function useLoop(ms: number) {
  const still = useReducedMotion();
  const [p, setP] = useState(0.35);
  useEffect(() => {
    if (still) return;
    const v = new Animated.Value(0);
    const id = v.addListener(({ value }) => setP(value));
    const loop = Animated.loop(Animated.timing(v, { toValue: 1, duration: ms, easing: Easing.linear, useNativeDriver: false }));
    loop.start();
    return () => {
      loop.stop();
      v.removeListener(id);
    };
  }, [still, ms]);
  return p;
}

/* ---------- shared drawings ---------- */

/* the one small theater every stage scene shares (the same as lesson 23): a plum back wall, a wooden floor, a soft spotlight, red curtains at
   the sides and swagged across the top. What stands on the stage goes in as children, so the curtain edge can hide a figure in the wing. */
function Theater({ children }: { children?: ReactNode }) {
  const planks = [1, 2, 3, 4, 5, 6, 7];
  const fold = (
    <G>
      <Path d="M10 10 L66 10 Q58 60 56 100 Q54 140 38 172 L10 172 Z" fill={CURT} />
      <Path d="M26 14 Q22 90 20 172" stroke={CURT_D} strokeWidth={4} fill="none" strokeLinecap="round" opacity={0.7} />
      <Path d="M40 14 Q36 90 31 172" stroke={CURT_L} strokeWidth={3} fill="none" strokeLinecap="round" opacity={0.55} />
      <Path d="M52 14 Q47 90 41 172" stroke={CURT_D} strokeWidth={3} fill="none" strokeLinecap="round" opacity={0.6} />
    </G>
  );
  return (
    <G>
      <Rect x={10} y={10} width={280} height={162} rx={10} fill={WALL} />
      <Path d="M150 10 L84 152 L216 152 Z" fill={GOLD} opacity={0.2} />
      <Path d="M22 126 L278 126 L290 172 L10 172 Z" fill={WOOD} />
      {planks.map((i) => (
        <Line key={i} x1={22 + (i / 8) * 256} y1={126} x2={10 + (i / 8) * 280} y2={172} stroke={WOOD_D} strokeWidth={1.4} opacity={0.55} />
      ))}
      <Line x1={16} y1={148} x2={284} y2={148} stroke={WOOD_D} strokeWidth={1.2} opacity={0.4} />
      <Ellipse cx={150} cy={146} rx={62} ry={12} fill={GOLD} opacity={0.3} />
      {children}
      {fold}
      <G transform="translate(300 0) scale(-1 1)">{fold}</G>
      <Path d="M10 10 L290 10 L290 24 Q262 42 234 24 Q206 42 178 24 Q150 42 122 24 Q94 42 66 24 Q38 42 10 24 Z" fill={CURT} />
      <Path d="M290 24 Q262 42 234 24 Q206 42 178 24 Q150 42 122 24 Q94 42 66 24 Q38 42 10 24" stroke={GOLD} strokeWidth={2} fill="none" />
      {[66, 122, 178, 234].map((x) => (
        <Circle key={x} cx={x} cy={26} r={3} fill={GOLD} />
      ))}
    </G>
  );
}

/* a music note, its head at (x, y), the stem rising: single, or two joined by a beam */
function Note({
  x,
  y,
  s = 1,
  fill = GOLD,
  rot = 0,
  op = 1,
  two,
}: {
  x: number;
  y: number;
  s?: number;
  fill?: string;
  rot?: number;
  op?: number;
  two?: boolean;
}) {
  const line = BEAR_LINE;
  return (
    <G transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} opacity={op}>
      {two ? (
        <G>
          <Rect x={15.2} y={-19} width={2.2} height={19} fill={fill} stroke={line} strokeWidth={0.9} />
          <Ellipse cx={12} cy={0} rx={5.2} ry={3.8} transform="rotate(-22 12 0)" fill={fill} stroke={line} strokeWidth={1.2} />
          <Path d="M3.4 -17 L17.4 -21 L17.4 -15 L3.4 -11 Z" fill={fill} stroke={line} strokeWidth={0.9} strokeLinejoin="round" />
        </G>
      ) : (
        <Path d="M5.6 -17 Q12 -14 10.5 -7 Q9 -11 5.6 -11 Z" fill={fill} stroke={line} strokeWidth={0.9} strokeLinejoin="round" />
      )}
      <Rect x={3.4} y={-17} width={2.2} height={17} fill={fill} stroke={line} strokeWidth={0.9} />
      <Ellipse cx={0} cy={0} rx={5.2} ry={3.8} transform="rotate(-22)" fill={fill} stroke={line} strokeWidth={1.2} />
    </G>
  );
}

/* the shady thought: a hunched, hatted gray figure with pale eyes, feet at (x, y); flip turns it to face left */
function Shade({ x, y, s = 1, lean = 12, op = 1, flip }: { x: number; y: number; s?: number; lean?: number; op?: number; flip?: boolean }) {
  return (
    <G transform={`translate(${x} ${y}) rotate(${lean}) scale(${flip ? -s : s} ${s})`} opacity={op}>
      <G fill={SHADE} stroke={SHADE_LINE} strokeWidth={1.3} strokeLinejoin="round" strokeLinecap="round">
        <Path d="M-15 0 L-16 -20 Q-16 -38 0 -38 Q16 -38 15 -20 L15 0 Z" />
        <Path d="M10 -30 Q22 -26 24 -16" fill="none" strokeWidth={6} stroke={SHADE_LINE} />
        <Path d="M10 -30 Q22 -26 24 -16" fill="none" strokeWidth={3.6} stroke={SHADE} />
        <Circle cx={6} cy={-46} r={10} />
        <Path d="M-2 -52 Q-2 -64 7 -64 Q16 -64 15 -52 Z" />
        <Ellipse cx={6} cy={-52} rx={15} ry={3.2} />
      </G>
      <Circle cx={8} cy={-46} r={1.8} fill="#FFF3B0" />
      <Circle cx={13.5} cy={-46} r={1.8} fill="#FFF3B0" />
    </G>
  );
}

/* a drifting rise: loops note i of n with p, rising from y0 by lift, easing in and out */
const fadeAt = (u: number) => Math.pow(Math.sin(Math.PI * u), 0.7);

/* ---------- the thinker ---------- */
function Thinker({ k }: { k: Ink }) {
  const cx = 195;
  const cy = 50;
  const SUIT_LINE = { stroke: BEAR_LINE, strokeWidth: 1.4, strokeLinejoin: 'round' as const };
  return (
    <Frame label="A man in a suit and tie stands with his hand at his chin, thinking. In a thought cloud beside his head is a tiny theater stage with red curtains open">
      <Line x1={14} y1={160} x2={286} y2={160} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      {/* the thought cloud, outlined so it reads on a pale page, with a tiny stage in it */}
      <Cloud x={98.4} y={10.4} w={193.2} h={79.2} fill={BEAR_LINE} />
      <Cloud x={100} y={12} w={190} h={76} fill={CREAM} />
      <G transform={`translate(${cx} ${cy}) scale(0.34) translate(-150 -91)`}>
        <Theater />
      </G>
      <G transform="translate(62 160) scale(0.85)">
        {/* the arm that hangs */}
        <Path d="M-20 -86 L-23 -54" stroke={BEAR_LINE} strokeWidth={10} strokeLinecap="round" fill="none" />
        <Path d="M-20 -86 L-23 -54" stroke={SUIT} strokeWidth={7.6} strokeLinecap="round" fill="none" />
        <Circle cx={-23} cy={-50} r={4.5} fill={SKIN} stroke={BEAR_LINE} strokeWidth={1.2} />
        {/* legs and shoes */}
        <Rect x={-12} y={-46} width={10} height={44} rx={3} fill="#4C5B8F" {...SUIT_LINE} />
        <Rect x={2} y={-46} width={10} height={44} rx={3} fill="#4C5B8F" {...SUIT_LINE} />
        <Rect x={-15} y={-4} width={15} height={5} rx={2.5} fill={BEAR_LINE} />
        <Rect x={0} y={-4} width={15} height={5} rx={2.5} fill={BEAR_LINE} />
        {/* neck, jacket, shirt, tie */}
        <Rect x={-4} y={-98} width={8} height={9} fill={SKIN} stroke={BEAR_LINE} strokeWidth={1.2} />
        <Path d="M-22 -44 L-22 -80 Q-22 -92 -10 -92 L10 -92 Q22 -92 22 -80 L22 -44 Z" fill={SUIT} {...SUIT_LINE} />
        <Path d="M-6 -92 L0 -72 L6 -92 Z" fill={WHITE} stroke={BEAR_LINE} strokeWidth={1} strokeLinejoin="round" />
        <Path d="M-2.4 -88 L2.4 -88 L3.4 -74 L0 -68 L-3.4 -74 Z" fill={CURT} stroke={BEAR_LINE} strokeWidth={0.9} strokeLinejoin="round" />
        {/* the head, thinking */}
        <Circle cx={0} cy={-107} r={12} fill={SKIN} stroke={BEAR_LINE} strokeWidth={1.4} />
        <Path
          d="M-12.4 -108 Q-13 -122 0 -122 Q13 -122 12.4 -108 Q6 -114 0 -113 Q-6 -114 -12.4 -108 Z"
          fill="#4B2F18"
          stroke={BEAR_LINE}
          strokeWidth={1}
          strokeLinejoin="round"
        />
        <Circle cx={5.5} cy={-106} r={1.5} fill={BEAR_LINE} />
        <Path d="M2.5 -111 L9 -110" stroke={BEAR_LINE} strokeWidth={1.3} strokeLinecap="round" />
        {/* the arm that comes up to the chin */}
        <Path d="M17 -86 L25 -62 L8 -93" stroke={BEAR_LINE} strokeWidth={10.4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <Path d="M17 -86 L25 -62 L8 -93" stroke={SUIT} strokeWidth={7.6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <Circle cx={6.5} cy={-94} r={5} fill={SKIN} stroke={BEAR_LINE} strokeWidth={1.2} />
      </G>
      <Cap k={k} s="The hardest thing to master" />
    </Frame>
  );
}

/* ---------- the stage ---------- */
function ShadyScene({ k }: { k: Ink }) {
  return (
    <Frame label="A small theater with the red curtain open and the stage lit by a spotlight. A gray, hatted, shadowy figure is hunched and creeping out of the left wing onto the middle of the stage">
      <Theater>
        <Ellipse cx={92} cy={151} rx={34} ry={4.5} fill={BEAR_LINE} opacity={0.35} />
        <Shade x={126} y={150} s={1.25} lean={11} />
      </Theater>
      <Cap k={k} s="A shady thought slips in" />
    </Frame>
  );
}

/* ---------- a person, singing it inside ---------- */
function Song({ k }: { k: Ink }) {
  const p = useLoop(5200);
  const n = 5;
  const xs = [96, 190, 132, 168, 114];
  return (
    <Frame label="A person stands calm with their eyes softly closed and a gentle smile, while a few warm golden music notes drift upward from them">
      <Line x1={14} y1={160} x2={286} y2={160} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      <Person x={150} y={160} s={1.45} fill={k.acc} />
      <G transform="translate(150 160) scale(1.45)" fill="none" stroke={BEAR_LINE} strokeWidth={1.4} strokeLinecap="round">
        <Path d="M-6.5 -48 Q-4.5 -45.4 -2.5 -48" />
        <Path d="M3 -48 Q5 -45.4 7 -48" />
        <Path d="M-3 -42.5 Q0.5 -40 4 -42.5" />
      </G>
      {xs.map((bx, i) => {
        const u = (i / n + p) % 1;
        return (
          <Note
            key={i}
            x={bx + 5 * Math.sin(u * 6.283 + i * 1.3)}
            y={74 - u * 54}
            s={1.4 + 0.2 * (i % 2)}
            fill={i % 2 ? AMBER : GOLD}
            rot={8 * Math.sin(u * 6.283 + i)}
            op={fadeAt(u)}
            two={i === 2}
          />
        );
      })}
      <Cap k={k} s="Learn it by heart" />
    </Frame>
  );
}

/* ---------- the pilot ---------- */
function Pilot({ k }: { k: Ink }) {
  const p = useLoop(5600);
  const bob = 1.6 * Math.sin(p * 6.283);
  const cloud = (x: number, y: number, s: number) => (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Rect x={0} y={14} width={96} height={22} rx={11} fill={RAIN_CLOUD} />
      <Circle cx={26} cy={16} r={15} fill={RAIN_CLOUD} />
      <Circle cx={54} cy={11} r={19} fill={RAIN_CLOUD} />
      <Circle cx={77} cy={20} r={12} fill={RAIN_CLOUD} />
    </G>
  );
  const drops = [
    [24, 56],
    [44, 58],
    [66, 60],
    [96, 62],
    [128, 60],
    [160, 62],
    [186, 60],
    [214, 58],
    [244, 60],
    [268, 58],
    [38, 118],
    [236, 124],
    [262, 128],
  ];
  const n = 5;
  return (
    <Frame label="A small propeller plane flies steadily through gray rain clouds, its propeller spinning, and warm golden music notes stream out behind it as if the engine is singing">
      {cloud(6, 6, 1)}
      {cloud(104, 2, 1.1)}
      {cloud(198, 8, 1)}
      {cloud(18, 122, 0.8)}
      {cloud(214, 130, 0.8)}
      <G stroke={RAIN} strokeWidth={1.8} strokeLinecap="round" opacity={0.85}>
        {drops.map(([dx, dy]) => (
          <G key={`${dx}-${dy}`}>
            <Line x1={dx} y1={dy} x2={dx - 4} y2={dy + 12} />
            <Line x1={dx + 10} y1={dy + 22} x2={dx + 6} y2={dy + 33} />
          </G>
        ))}
      </G>
      <G transform={`translate(172 ${100 + bob}) scale(1.45)`}>
        {/* tail fin and tail plane */}
        <Path d="M-50 -5 L-58 -25 L-44 -25 L-31 -10 Z" fill={ORANGE} stroke={BEAR_LINE} strokeWidth={1.3} strokeLinejoin="round" />
        <Ellipse cx={-46} cy={-1} rx={10} ry={2.8} fill={CREAM} stroke={BEAR_LINE} strokeWidth={1.2} />
        {/* the wing, then the body in front of it */}
        <Path d="M-8 3 L14 3 Q22 14 11 18 L-13 18 Z" fill={ORANGE} stroke={BEAR_LINE} strokeWidth={1.3} strokeLinejoin="round" />
        <Path
          d="M-52 -4 L-30 -10 Q-10 -15 18 -14 Q38 -13 44 -2 Q40 9 18 10 Q-10 12 -30 6 Z"
          fill={CREAM}
          stroke={BEAR_LINE}
          strokeWidth={1.4}
          strokeLinejoin="round"
        />
        <Path d="M-27 -6 Q-8 -10 18 -8 Q34 -7 41 -3 Q34 0 18 -1 Q-8 0 -27 3 Z" fill={ORANGE} opacity={0.9} />
        <Path d="M-6 -13 Q0 -23 14 -22 Q21 -18 21 -13 Z" fill="#CDEBFF" stroke={BEAR_LINE} strokeWidth={1.3} strokeLinejoin="round" />
        <Circle cx={10} cy={-17} r={4} fill={SKIN} stroke={BEAR_LINE} strokeWidth={1} />
        {/* landing gear */}
        <Line x1={5} y1={10} x2={3} y2={23} stroke={BEAR_LINE} strokeWidth={2.2} strokeLinecap="round" />
        <Circle cx={3} cy={26} r={4.2} fill={BEAR_LINE} />
        <Circle cx={3} cy={26} r={1.5} fill={RAIN} />
        {/* engine cowl and propeller */}
        <Rect x={41} y={-9} width={8} height={14} rx={3} fill={SAND} stroke={BEAR_LINE} strokeWidth={1.2} />
        <Ellipse cx={51} cy={-2} rx={2.3} ry={18} fill={BEAR_LINE} opacity={0.4} />
        <Circle cx={50} cy={-2} r={2.6} fill={BEAR_LINE} />
      </G>
      {Array.from({ length: n }, (_, i) => {
        const u = (i / n + p) % 1;
        return (
          <Note
            key={i}
            x={84 - u * 74}
            y={102 + 10 * Math.sin(u * 6.283 + i * 1.7) - u * 6}
            s={1.35 + 0.15 * (i % 2)}
            fill={i % 2 ? AMBER : GOLD}
            rot={10 * Math.sin(u * 6.283 + i)}
            op={fadeAt(u)}
            two={i === 2}
          />
        );
      })}
      <Cap k={k} s="The engines sang it back" />
    </Frame>
  );
}

/* ---------- the song fills the stage ---------- */
function SongStage({ k }: { k: Ink }) {
  const p = useLoop(4200);
  const notes: { x: number; y: number; s: number; two?: boolean; fill: string }[] = [
    { x: 108, y: 108, s: 1.9, fill: GOLD },
    { x: 140, y: 96, s: 2.1, two: true, fill: AMBER },
    { x: 196, y: 112, s: 1.9, fill: GOLD },
    { x: 130, y: 136, s: 1.5, fill: GOLD },
    { x: 176, y: 134, s: 1.5, fill: AMBER },
    { x: 100, y: 78, s: 1.4, fill: AMBER },
    { x: 214, y: 82, s: 1.5, fill: GOLD },
  ];
  return (
    <Frame label="The same theater, now with the spotlit stage filled with warm golden music notes, while the gray shadowy figure is leaving through the left wing, half hidden behind the curtain">
      <Theater>
        <Shade x={76} y={150} s={1.25} lean={-12} op={0.9} flip />
        {notes.map((nt, i) => (
          <Note
            key={i}
            x={nt.x}
            y={nt.y + 3.5 * Math.sin((p + i / notes.length) * 6.283)}
            s={nt.s}
            fill={nt.fill}
            rot={7 * Math.sin((p + i / notes.length) * 6.283 + 1)}
            two={nt.two}
          />
        ))}
      </Theater>
      <Cap k={k} s="The song fills the stage" />
    </Frame>
  );
}

/* ---------- a quiet place to stand ---------- */
function Practice({ k }: { k: Ink }) {
  const pane = (x: number, y: number) => <Rect key={`${x}-${y}`} x={x} y={y} width={32} height={32} fill="#CDEBFF" />;
  return (
    <Frame label="A person sits in a chair by a sunny window, head bowed and hands folded in quiet prayer, with a small open book on a side table. Daylight streams across the room">
      <Rect x={10} y={10} width={280} height={162} rx={12} fill="#E9DCC4" />
      <Path d="M10 128 L290 128 L290 160 Q290 172 278 172 L22 172 Q10 172 10 160 Z" fill="#B98F5E" />
      <Line x1={10} y1={128} x2={290} y2={128} stroke="#9B7648" strokeWidth={2} />
      {/* the window and the light it lets in */}
      <Path d="M110 34 L240 128 L180 128 L110 104 Z" fill={GOLD} opacity={0.22} />
      <Rect x={34} y={30} width={76} height={76} rx={3} fill={BROWN} />
      {pane(38, 34)}
      {pane(74, 34)}
      {pane(38, 70)}
      {pane(74, 70)}
      <Circle cx={90} cy={49} r={7} fill={GOLD} />
      <Ellipse cx={54} cy={53} rx={11} ry={4} fill={WHITE} />
      <Rect x={30} y={106} width={84} height={6} rx={2} fill={WOOD_D} />
      {/* the chair */}
      <Rect x={158} y={66} width={8} height={52} rx={3} fill={WOOD} stroke={BEAR_LINE} strokeWidth={1.3} />
      <Rect x={122} y={116} width={5} height={40} fill={WOOD_D} />
      <Rect x={158} y={116} width={6} height={40} fill={WOOD_D} />
      <Rect x={118} y={110} width={50} height={8} rx={3} fill={WOOD} stroke={BEAR_LINE} strokeWidth={1.3} />
      {/* the person, in profile, facing the window */}
      <Rect x={104} y={100} width={11} height={54} rx={5.5} fill={k.acc} stroke={BEAR_LINE} strokeWidth={1.3} />
      <Rect x={94} y={150} width={22} height={7} rx={3.5} fill={BEAR_LINE} />
      <Path d="M138 112 L141 82 Q143 70 153 70 Q163 72 160 86 L158 112 Z" fill={k.acc} stroke={BEAR_LINE} strokeWidth={1.3} strokeLinejoin="round" />
      <Rect x={108} y={98} width={44} height={13} rx={6.5} fill={k.acc} stroke={BEAR_LINE} strokeWidth={1.3} />
      <Circle cx={143} cy={60} r={11} fill={k.acc} stroke={BEAR_LINE} strokeWidth={1.3} />
      <Path d="M137 61 Q139.5 63.4 142 61" stroke={BEAR_LINE} strokeWidth={1.4} strokeLinecap="round" fill="none" />
      <Path d="M153 79 L152 98 L137 92" stroke={BEAR_LINE} strokeWidth={10.4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d="M153 79 L152 98 L137 92" stroke={k.acc} strokeWidth={7.6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Ellipse cx={132} cy={91} rx={7.5} ry={5.2} fill={SKIN} stroke={BEAR_LINE} strokeWidth={1.2} />
      <Path d="M127 89 L135 93 M127 92 L134 95.5" stroke={BEAR_LINE} strokeWidth={1} strokeLinecap="round" />
      {/* the side table and the small open book */}
      <Rect x={204} y={108} width={64} height={6} rx={3} fill={WOOD_D} stroke={BEAR_LINE} strokeWidth={1.2} />
      <Rect x={210} y={114} width={5} height={42} fill={WOOD_D} />
      <Rect x={257} y={114} width={5} height={42} fill={WOOD_D} />
      <Path d="M213 108 L259 108 L261 103 L211 103 Z" fill="#7A4B2A" stroke={BEAR_LINE} strokeWidth={1.2} strokeLinejoin="round" />
      <Path d="M215 104 Q226 98 236 102 L236 91 Q226 87 215 91 Z" fill={CREAM} stroke={BEAR_LINE} strokeWidth={1.2} strokeLinejoin="round" />
      <Path d="M257 104 Q246 98 236 102 L236 91 Q246 87 257 91 Z" fill={CREAM} stroke={BEAR_LINE} strokeWidth={1.2} strokeLinejoin="round" />
      <Path
        d="M220 95 Q226 93.5 231 95 M220 99 Q226 97.5 231 99 M241 95 Q246 93.5 252 95 M241 99 Q246 97.5 252 99"
        stroke="#B9A98A"
        strokeWidth={1.4}
        strokeLinecap="round"
        fill="none"
      />
      <Cap k={k} s="A little more each day" />
    </Frame>
  );
}

/* ---------- three things to choose from ---------- */
function Choose({ k }: { k: Ink }) {
  return (
    <Frame label="A person reaches toward a shelf holding three things to choose from: an open hymn book with music notes on its pages, a small scroll of scripture, and a pair of folded praying hands">
      <Line x1={14} y1={160} x2={286} y2={160} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      {/* the shelf */}
      <Path d="M108 131 L108 148 L124 131 Z M262 131 L262 148 L278 131 Z" fill={WOOD_D} stroke={BEAR_LINE} strokeWidth={1.2} strokeLinejoin="round" />
      <Rect x={90} y={124} width={202} height={8} rx={3} fill={WOOD} stroke={BEAR_LINE} strokeWidth={1.4} />
      {/* the hymn book */}
      <Path d="M95 84 L95 124 Q115 117 134 125 Q153 117 173 124 L173 84 Z" fill="#7A4B2A" stroke={BEAR_LINE} strokeWidth={1.4} strokeLinejoin="round" />
      <Path d="M99 87 Q116 82 134 88 L134 119 Q116 113 99 118 Z" fill={CREAM} stroke={BEAR_LINE} strokeWidth={1.1} strokeLinejoin="round" />
      <Path d="M169 87 Q152 82 134 88 L134 119 Q152 113 169 118 Z" fill={CREAM} stroke={BEAR_LINE} strokeWidth={1.1} strokeLinejoin="round" />
      <Note x={106} y={108} s={0.8} fill={BEAR_LINE} two />
      <Note x={121} y={102} s={0.8} fill={BEAR_LINE} />
      <Note x={141} y={106} s={0.8} fill={BEAR_LINE} />
      <Note x={153} y={100} s={0.8} fill={BEAR_LINE} two />
      {/* the scroll */}
      <Rect x={190} y={92} width={28} height={26} fill="#F3E3BC" stroke={BEAR_LINE} strokeWidth={1.2} />
      <Rect x={185} y={85} width={38} height={9} rx={4.5} fill="#D9A86A" stroke={BEAR_LINE} strokeWidth={1.3} />
      <Rect x={185} y={116} width={38} height={9} rx={4.5} fill="#D9A86A" stroke={BEAR_LINE} strokeWidth={1.3} />
      <Path d="M194 100 L214 100 M194 105 L210 105 M194 110 L213 110" stroke="#B08A5A" strokeWidth={1.8} strokeLinecap="round" />
      {/* the folded hands: two hands pressed together, fingers up, thumbs in front, sleeves below */}
      <Path d="M245 118 L245 97 Q245 86 250 82 Q254 79 256 83 L256 118 Z" fill="#EDBE98" stroke={BEAR_LINE} strokeWidth={1.3} strokeLinejoin="round" />
      <Path d="M267 118 L267 97 Q267 86 262 82 Q258 79 256 83 L256 118 Z" fill="#E0A67C" stroke={BEAR_LINE} strokeWidth={1.3} strokeLinejoin="round" />
      <Path
        d="M249.5 95 L249.5 87 M253 96 L253 85 M260 96 L260 85 M263.5 95 L263.5 87"
        stroke={BEAR_LINE}
        strokeWidth={1.1}
        strokeLinecap="round"
        opacity={0.65}
      />
      <Ellipse cx={253} cy={109} rx={3.4} ry={7} transform="rotate(8 253 109)" fill="#EDBE98" stroke={BEAR_LINE} strokeWidth={1.1} />
      <Ellipse cx={259} cy={109} rx={3.4} ry={7} transform="rotate(-8 259 109)" fill="#E0A67C" stroke={BEAR_LINE} strokeWidth={1.1} />
      <Rect x={242} y={115} width={28} height={10} rx={3} fill={k.acc} stroke={BEAR_LINE} strokeWidth={1.3} />
      {/* the person, reaching */}
      <Person x={46} y={160} s={1.4} fill={k.acc} face={k.bg} />
      <Path d="M62 123 L93 108" stroke={BEAR_LINE} strokeWidth={10.4} strokeLinecap="round" fill="none" />
      <Path d="M62 123 L93 108" stroke={k.acc} strokeWidth={7.6} strokeLinecap="round" fill="none" />
      <Circle cx={95} cy={107} r={4.8} fill={SKIN} stroke={BEAR_LINE} strokeWidth={1.2} />
      <Cap k={k} s="Ready before you need it" />
    </Frame>
  );
}

export const SCENES_L30: Record<string, ComponentType<{ k: Ink }>> = {
  'l22-thinker': Thinker,
  'l22-shady': ShadyScene,
  'l22-song': Song,
  'l22-pilot': Pilot,
  'l22-song-stage': SongStage,
  'l22-practice': Practice,
  'l22-choose': Choose,
};
