/* Scenes for lesson g2, "Weakness is the way in", told as a story (see story-kit.tsx and story-scenes-f-l31.tsx for the model): Brad Wilcox, the student
   and the two dots, the piano lessons, then Gideon's three hundred, Moroni by his lamp, and the cracked pot held out. The teacher always wears the same
   gray sweater and glasses, the student the same teal shirt with an orange backpack and short dark hair (no gender drawn), and every figure carries a
   dark outline so it reads on a dark card and on a cream one alike. */
import { type ComponentType, type ReactNode, useEffect, useState } from 'react';
import { Easing } from 'react-native';
import { Circle, ClipPath, Defs, Ellipse, G, Path, Rect } from 'react-native-svg';

import { useAppear, useReducedMotion } from '@/lib/motion';

import { BEAR_LINE, Frame, type Ink, Say } from './story-kit';

const SKIN = '#E7B98F';
const GOLD = '#FFD25A';
const GOLD_D = '#C98F1A';
const GLOW = '#FFE29A';
const CREAM = '#FFF5E1';
const CLOTH = '#F3E7C9';
const WOOD = '#B07A45';
const WOOD_D = '#5E3A1A';
const EDGE = '#8A6A3A';
const SKY = '#F7D9A2';
const SAND = '#D2A86A';
const SWEATER = '#8A8F9C';
const SWEATER_L = '#B4B8C4';
const TEAL = '#2F8F8A';
const PANTS = '#3E4A66';
const PACK = '#D9822B';
const PACK_D = '#8F4F12';
const KID = '#E9A63A';
const PLUM = '#7A4FA0';
const GREEN = '#2F7A5B';
const SLATE = '#5C6C8F';
const ROSE = '#E5405A';
const CLAY = '#C46F3C';
const ORANGE = '#FF9A2E';

/* the line of words under a picture */
function Cap({ k, s }: { k: Ink; s: string }) {
  return <Say x={150} y={190} s={s} fill={k.ink} />;
}

/* ---------- shared drawings ---------- */

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
function Hand({ x, y, r = 4.5 }: { x: number; y: number; r?: number }) {
  return <Circle cx={x} cy={y} r={r} fill={SKIN} stroke={BEAR_LINE} strokeWidth={1.3} />;
}

/* the sky and the ground under it */
function Stage({ sky, ground, y }: { sky: string; ground: string; y: number }) {
  return (
    <G>
      <Rect x={10} y={10} width={280} height={162} rx={12} fill={sky} />
      <Path d={`M10 ${y} L290 ${y} L290 160 Q290 172 278 172 L22 172 Q10 172 10 160 Z`} fill={ground} />
    </G>
  );
}

/* a value that runs 0 to 1 once and stays at 1 for people who asked for less motion */
function useRun(delay: number, duration: number) {
  const still = useReducedMotion();
  const v = useAppear(delay, duration, Easing.inOut(Easing.cubic));
  const [p, setP] = useState(still ? 1 : 0);
  useEffect(() => {
    const id = v.addListener(({ value }) => setP(value));
    return () => v.removeListener(id);
  }, [v]);
  return still ? 1 : p;
}

/* ---------- the people ---------- */

type Mood = 'calm' | 'smile' | 'worry' | 'sad' | 'wince' | 'joy';
type Hair = 'short' | 'gray' | 'bun' | 'long' | 'kid' | 'beard';
const HAIR_COLOR: Record<Hair, string> = { short: '#3A2A20', gray: '#B8B2A6', bun: '#6B4A33', long: '#6B4A33', kid: '#5A3A24', beard: '#6A5A4A' };

/* a head facing right, centered at (0, -49): hair, an eye, and a mouth for the mood */
function Head({ hair = 'short', mood = 'calm', glasses = false }: { hair?: Hair; mood?: Mood; glasses?: boolean }) {
  const c = HAIR_COLOR[hair];
  return (
    <G>
      {hair === 'long' ? (
        <Path d="M-8.7 -50 Q-11.5 -41 -8 -34 L-4.5 -37 Q-6.5 -43 -6.2 -49 Z" fill={c} stroke={BEAR_LINE} strokeWidth={0.8} strokeLinejoin="round" />
      ) : null}
      <Circle cx={0} cy={-49} r={8.5} fill={SKIN} stroke={BEAR_LINE} strokeWidth={1.4} />
      <Path d="M-8.7 -50 Q-8.5 -59.5 0 -59.5 Q8.7 -59 8.7 -50 Q4 -54 0 -53.5 Q-5 -54 -8.7 -50 Z" fill={c} />
      {hair === 'bun' ? <Circle cx={-6} cy={-58} r={4.3} fill={c} stroke={BEAR_LINE} strokeWidth={0.9} /> : null}
      {hair === 'kid' ? <Path d="M-2 -59 Q0 -64 4 -60 Q1 -59.5 -2 -59 Z" fill={c} /> : null}
      {hair === 'beard' ? (
        <Path
          d="M-6.8 -46 Q-7.5 -36.5 0 -35 Q7.5 -36.5 6.8 -46 Q3 -42.5 0 -42.5 Q-3 -42.5 -6.8 -46 Z"
          fill={c}
          stroke={BEAR_LINE}
          strokeWidth={0.8}
          strokeLinejoin="round"
        />
      ) : null}
      {glasses ? (
        <G fill="none" stroke={BEAR_LINE} strokeWidth={1}>
          <Circle cx={4.4} cy={-49.2} r={3.2} />
          <Path d="M1.2 -49.5 L-8.5 -50.5" strokeLinecap="round" />
        </G>
      ) : null}
      {mood === 'wince' ? (
        <Path d="M2.8 -49.8 L6.2 -48.4" stroke={BEAR_LINE} strokeWidth={1.5} strokeLinecap="round" />
      ) : mood === 'joy' ? (
        <Path d="M2.8 -48.8 Q4.5 -51.2 6.2 -48.8" stroke={BEAR_LINE} strokeWidth={1.4} fill="none" strokeLinecap="round" />
      ) : (
        <Circle cx={4.6} cy={-48.8} r={1.5} fill={BEAR_LINE} />
      )}
      {mood === 'worry' || mood === 'sad' ? <Path d="M1.8 -54.2 L7.4 -52.4" stroke={BEAR_LINE} strokeWidth={1.2} strokeLinecap="round" /> : null}
      {mood === 'wince' ? <Path d="M2 -52.6 L7.4 -53.6" stroke={BEAR_LINE} strokeWidth={1.2} strokeLinecap="round" /> : null}
      {hair === 'beard' ? null : (
        <Path
          d={
            mood === 'smile'
              ? 'M3 -44.5 Q5.5 -41.8 8 -44.5'
              : mood === 'joy'
                ? 'M3 -45 Q5.5 -40.8 8 -45'
                : mood === 'worry' || mood === 'sad'
                  ? 'M3.5 -42.8 Q5.5 -44.8 7.6 -42.8'
                  : mood === 'wince'
                    ? 'M3 -43.5 L4.6 -44.8 L6.2 -43.2 L7.8 -44.6'
                    : 'M3.5 -43.8 L7 -43.8'
          }
          stroke={BEAR_LINE}
          strokeWidth={1.2}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </G>
  );
}

/* the arms an adult can have, as a path from the shoulder and where the hand lands */
type Arms = 'down' | 'give' | 'shoulder' | 'open' | 'desk';
const ARMS: Record<Arms, { d: string; hx: number; hy: number }> = {
  down: { d: 'M9 -34 L12 -15', hx: 12, hy: -13 },
  give: { d: 'M8 -34 Q16 -32 25 -29', hx: 26, hy: -28.5 },
  shoulder: { d: 'M8 -34 Q22 -44 34 -40', hx: 35, hy: -40 },
  open: { d: 'M8 -34 Q18 -40 26 -37', hx: 27, hy: -37.5 },
  desk: { d: 'M8 -34 Q20 -34 25 -24', hx: 25.5, hy: -23.5 },
};
function Arm({ a, fill }: { a: Arms; fill: string }) {
  const r = ARMS[a];
  return (
    <G>
      <Tube fill={fill} parts={[[r.d, 5.5]]} />
      <Hand x={r.hx} y={r.hy} r={3.6} />
    </G>
  );
}

/* the teacher (Brad Wilcox), standing on (x, y) facing right: a gray sweater over a cream collar, gray hair, glasses. flip turns him left. */
function Teacher({ x, y, s = 1, flip = false, mood = 'calm', arms = 'down' }: { x: number; y: number; s?: number; flip?: boolean; mood?: Mood; arms?: Arms }) {
  const sw = 1.5 / s;
  return (
    <G transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      <Path d="M-15 0 L-11 -33 Q-11 -42 0 -42 Q11 -42 11 -33 L15 0 Z" fill={SWEATER} stroke={BEAR_LINE} strokeWidth={sw} strokeLinejoin="round" />
      <Path d="M-14.4 -4 L14.4 -4" stroke={SWEATER_L} strokeWidth={2.4} strokeLinecap="round" />
      <Path d="M-5.6 -41.5 L0 -34 L5.6 -41.5 Z" fill={CLOTH} stroke={BEAR_LINE} strokeWidth={0.8} strokeLinejoin="round" />
      <Path d="M-6.4 -41.4 Q0 -38.6 6.4 -41.4" stroke={SWEATER_L} strokeWidth={2.2} fill="none" strokeLinecap="round" />
      <Arm a={arms} fill={SWEATER} />
      <Head hair="gray" glasses mood={mood} />
    </G>
  );
}

/* the student: young, a teal shirt, short dark hair, an orange backpack; no gender drawn. Standing on (x, y) facing right. */
function Student({
  x,
  y,
  s = 1,
  flip = false,
  mood = 'calm',
  clasp = false,
}: {
  x: number;
  y: number;
  s?: number;
  flip?: boolean;
  mood?: Mood;
  clasp?: boolean;
}) {
  const sw = 1.5 / s;
  return (
    <G transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      <Rect x={-18} y={-41} width={10} height={23} rx={4.5} fill={PACK} stroke={BEAR_LINE} strokeWidth={sw} />
      <Rect x={-16} y={-34} width={6} height={7} rx={2} fill={PACK_D} />
      <Tube
        fill={PANTS}
        parts={[
          ['M-4 -19 L-4 -6', 6],
          ['M5 -19 L5 -6', 6],
        ]}
      />
      <Ellipse cx={-1} cy={-1.5} rx={6.5} ry={2.8} fill={CLOTH} stroke={BEAR_LINE} strokeWidth={1.1} />
      <Ellipse cx={8} cy={-1.5} rx={6.5} ry={2.8} fill={CLOTH} stroke={BEAR_LINE} strokeWidth={1.1} />
      <Path d="M-11 -17 L-10 -34 Q-10 -42 0 -42 Q10 -42 10 -34 L11 -17 Z" fill={TEAL} stroke={BEAR_LINE} strokeWidth={sw} strokeLinejoin="round" />
      <Path d="M-3.5 -41 Q-9 -32 -8.5 -22" stroke={PACK_D} strokeWidth={2.4} fill="none" strokeLinecap="round" />
      {clasp ? (
        <G>
          <Tube fill={TEAL} parts={[['M6 -36 Q14 -30 10 -24', 5]]} />
          <Hand x={9} y={-23} r={3.6} />
          <Hand x={12} y={-25.5} r={3.2} />
        </G>
      ) : (
        <G>
          <Tube fill={TEAL} parts={[['M8 -36 L11 -20', 5]]} />
          <Hand x={11} y={-18} r={3.5} />
        </G>
      )}
      <Head hair="short" mood={mood} />
    </G>
  );
}

/* another grown-up (a mother, the piano teacher, a person in a hoodie), standing on (x, y) facing right. slump leans the whole upper body forward. */
function Adult({
  x,
  y,
  s = 1,
  flip = false,
  body,
  hair = 'bun',
  mood = 'calm',
  arms = 'down',
  glasses = false,
  slump = 0,
}: {
  x: number;
  y: number;
  s?: number;
  flip?: boolean;
  body: string;
  hair?: Hair;
  mood?: Mood;
  arms?: Arms;
  glasses?: boolean;
  slump?: number;
}) {
  const sw = 1.5 / s;
  return (
    <G transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      <G transform={`rotate(${slump} 0 -2)`}>
        <Path d="M-16 0 L-10 -33 Q-10 -42 0 -42 Q10 -42 10 -33 L16 0 Z" fill={body} stroke={BEAR_LINE} strokeWidth={sw} strokeLinejoin="round" />
        <Path d="M-14.6 -3.5 L14.6 -3.5" stroke={CLOTH} strokeWidth={1.8} strokeLinecap="round" opacity={0.6} />
        <Arm a={arms} fill={body} />
        <G transform={`translate(${slump ? 2 : 0} ${slump ? 3 : 0})`}>
          <Head hair={hair} mood={mood} glasses={glasses} />
        </G>
      </G>
    </G>
  );
}

/* a child, sitting on (x, y) facing right, with hands out to the keys */
function Kid({ x, y, s = 1, mood = 'calm', play = true }: { x: number; y: number; s?: number; mood?: Mood; play?: boolean }) {
  const sw = 1.5 / s;
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Tube fill={PANTS} parts={[['M0 -3 L17 -3', 7]]} />
      <Tube fill={PANTS} parts={[['M17 -3 L17 12', 6.5]]} />
      <Ellipse cx={20} cy={15.5} rx={6} ry={2.6} fill={CLOTH} stroke={BEAR_LINE} strokeWidth={1.1} />
      <Path d="M-9 0 L-8 -22 Q-8 -30 0 -30 Q8 -30 8 -22 L9 0 Z" fill={KID} stroke={BEAR_LINE} strokeWidth={sw} strokeLinejoin="round" />
      {play ? (
        <G>
          <Tube fill={KID} parts={[['M2 -26 Q14 -24 22 -10', 5]]} />
          <Hand x={19} y={-10.5} r={3.2} />
          <Hand x={22.5} y={-9.5} r={3.5} />
        </G>
      ) : (
        <G>
          <Tube fill={KID} parts={[['M3 -26 L8 -10', 5]]} />
          <Hand x={8.5} y={-8.5} r={3.4} />
        </G>
      )}
      <G transform="translate(0 10)">
        <Head hair="kid" mood={mood} />
      </G>
    </G>
  );
}

/* a stool for a child at the piano */
function Stool({ x, y }: { x: number; y: number }) {
  return (
    <G stroke={BEAR_LINE} strokeWidth={1.3} strokeLinejoin="round">
      <Rect x={x - 3} y={y + 5} width={3.5} height={13} fill={WOOD_D} />
      <Rect x={x + 7} y={y + 5} width={3.5} height={13} fill={WOOD_D} />
      <Rect x={x - 11} y={y + 1} width={22} height={5} rx={2} fill={WOOD} />
    </G>
  );
}

/* an upright piano with its keys at the left, its base on y. The little sheet on its music desk has four notes; wrong turns one of them rose. */
function Piano({ x, y = 154, wrong = false }: { x: number; y?: number; wrong?: boolean }) {
  const notes: [number, number][] = [
    [x + 18, 3],
    [x + 27, 2],
    [x + 36, 1],
    [x + 44, 2],
  ];
  return (
    <G>
      <Rect x={x + 4} y={y - 8} width={9} height={8} fill={WOOD_D} stroke={BEAR_LINE} strokeWidth={1.2} />
      <Rect x={x + 78} y={y - 8} width={9} height={8} fill={WOOD_D} stroke={BEAR_LINE} strokeWidth={1.2} />
      <Rect x={x} y={y - 92} width={92} height={86} rx={3} fill="#6B4222" stroke={BEAR_LINE} strokeWidth={1.5} />
      <Rect x={x - 3} y={y - 97} width={98} height={7} rx={2} fill="#8A5A30" stroke={BEAR_LINE} strokeWidth={1.3} />
      <Rect x={x + 8} y={y - 22} width={76} height={14} rx={2} fill="#573419" stroke={BEAR_LINE} strokeWidth={1.1} />
      <Rect x={x - 14} y={y - 24} width={46} height={4} rx={1} fill="#8A5A30" stroke={BEAR_LINE} strokeWidth={1} />
      <Rect x={x - 12} y={y - 31} width={42} height={7} rx={1.5} fill="#F6EFE0" stroke={BEAR_LINE} strokeWidth={1.2} />
      {[x - 8, x - 1, x + 9, x + 16].map((bx) => (
        <Rect key={bx} x={bx} y={y - 31} width={3} height={4.5} fill="#2A1E1A" />
      ))}
      <Rect x={x + 12} y={y - 78} width={38} height={32} rx={2} fill={CREAM} stroke={EDGE} strokeWidth={1.2} />
      {[0, 1, 2, 3, 4].map((i) => (
        <Path key={i} d={`M${x + 15} ${y - 70 + i * 3.6} L${x + 47} ${y - 70 + i * 3.6}`} stroke="#8A7A66" strokeWidth={0.8} />
      ))}
      {notes.map(([nx, idx], i) => {
        const ny = y - 70 + idx * 3.6;
        const c = wrong && i === 2 ? ROSE : BEAR_LINE;
        return (
          <G key={nx}>
            <Ellipse cx={nx} cy={ny} rx={2.1} ry={1.6} fill={c} transform={`rotate(-20 ${nx} ${ny})`} />
            <Path d={`M${nx + 1.9} ${ny} L${nx + 1.9} ${ny - 8}`} stroke={c} strokeWidth={0.9} />
          </G>
        );
      })}
    </G>
  );
}

/* a small flame, base on (x, y) */
function Flame({ x, y, s = 1, glow = 11 }: { x: number; y: number; s?: number; glow?: number }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Circle cx={0} cy={-6} r={glow} fill={GOLD} opacity={0.26} />
      <Path d="M0 0 Q-5.5 -5 -2 -13 Q0 -9 2.5 -10 Q6 -5 0 0 Z" fill={ORANGE} stroke={BEAR_LINE} strokeWidth={0.7} strokeLinejoin="round" />
      <Path d="M0 -1 Q-2.5 -4 -0.8 -8 Q1.2 -5 1.8 -4 Q2 -2 0 -1 Z" fill="#FFE9A8" />
    </G>
  );
}

/* a sheet of music rolled up into a note pair, floating: two eighth notes */
function Tune({ x, y, c = GOLD_D, s = 1 }: { x: number; y: number; c?: string; s?: number }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Ellipse cx={0} cy={0} rx={4} ry={3} fill={c} stroke={BEAR_LINE} strokeWidth={0.9} transform="rotate(-20)" />
      <Ellipse cx={11} cy={-2} rx={4} ry={3} fill={c} stroke={BEAR_LINE} strokeWidth={0.9} transform="rotate(-20 11 -2)" />
      <Path d="M3.6 -1 L3.6 -16 L14.6 -18 L14.6 -3" stroke={BEAR_LINE} strokeWidth={1.6} fill="none" strokeLinejoin="round" strokeLinecap="round" />
    </G>
  );
}

/* ---------- 1. a student came to a teacher with a worry ---------- */
function Worry({ k }: { k: Ink }) {
  const p = useRun(300, 800);
  const blob: [number, number, number][] = [
    [52, 40, 13],
    [76, 30, 17],
    [104, 34, 16],
    [126, 44, 12],
    [88, 48, 15],
  ];
  return (
    <Frame label="A teacher in a gray sweater and glasses sits behind a wooden desk and listens kindly. A worried student with a backpack stands across from him, hands clasped, and above the student a thought cloud shows two pieces of ground with a gap between them">
      <Stage sky={SKY} ground={SAND} y={130} />
      <Rect x={236} y={26} width={42} height={44} rx={3} fill="#FFE9B0" stroke={EDGE} strokeWidth={1.5} />
      <Path d="M257 26 L257 70 M236 48 L278 48" stroke={EDGE} strokeWidth={1.5} />
      {/* the desk, and the teacher behind it */}
      <Teacher x={222} y={156} s={1.4} flip mood="smile" arms="desk" />
      <Rect x={162} y={129} width={120} height={34} fill={WOOD_D} stroke={BEAR_LINE} strokeWidth={1.5} />
      <Rect x={206} y={136} width={32} height={15} rx={2} fill="#7A4F2A" stroke={BEAR_LINE} strokeWidth={1.1} />
      <Circle cx={222} cy={143} r={2} fill={GOLD} />
      <Rect x={156} y={120} width={132} height={9} rx={2} fill={WOOD} stroke={BEAR_LINE} strokeWidth={1.5} />
      <Rect x={262} y={113} width={20} height={4} rx={1} fill={CREAM} stroke={BEAR_LINE} strokeWidth={0.9} />
      <Rect x={264} y={109} width={16} height={4} rx={1} fill="#F0B93A" stroke={BEAR_LINE} strokeWidth={0.9} />
      {/* the student, worried */}
      <Student x={86} y={164} s={1.4} mood="worry" clasp />
      {/* the thought: two pieces of ground and a gap */}
      <G opacity={p} transform={`translate(0 ${(1 - p) * 6})`}>
        {blob.map(([cx, cy, r]) => (
          <Circle key={`o${cx}`} cx={cx} cy={cy} r={r + 1.5} fill={BEAR_LINE} />
        ))}
        <Circle cx={92} cy={70} r={5.5} fill={BEAR_LINE} />
        <Circle cx={90} cy={77} r={4} fill={BEAR_LINE} />
        {blob.map(([cx, cy, r]) => (
          <Circle key={`f${cx}`} cx={cx} cy={cy} r={r} fill={CREAM} />
        ))}
        <Circle cx={92} cy={70} r={4.2} fill={CREAM} />
        <Circle cx={90} cy={77} r={2.8} fill={CREAM} />
        <Rect x={46} y={42} width={32} height={13} rx={3} fill="#C4955E" stroke={BEAR_LINE} strokeWidth={1.2} />
        <Rect x={46} y={42} width={32} height={4} rx={2} fill="#7C9460" />
        <Rect x={104} y={35} width={30} height={13} rx={3} fill="#C4955E" stroke={BEAR_LINE} strokeWidth={1.2} />
        <Rect x={104} y={35} width={30} height={4} rx={2} fill="#7C9460" />
        <Path d="M80 42 Q91 52 102 36" stroke={EDGE} strokeWidth={1.6} fill="none" strokeLinecap="round" strokeDasharray="1.5 4.5" />
      </G>
      <Cap k={k} s="Who fills the gap?" />
    </Frame>
  );
}

/* ---------- the paper and its two dots (scenes 2 and 3) ---------- */
function Desk({ children, id }: { children: ReactNode; id: string }) {
  return (
    <G>
      <Defs>
        <ClipPath id={id}>
          <Rect x={10} y={10} width={280} height={162} rx={12} />
        </ClipPath>
      </Defs>
      <Rect x={10} y={10} width={280} height={162} rx={12} fill="#B98A52" />
      <G clipPath={`url(#${id})`}>
        <Path d="M10 50 L290 50 M10 94 L290 94 M10 138 L290 138" stroke="#A67A46" strokeWidth={1.4} opacity={0.7} />
        <Rect x={62} y={19} width={184} height={156} rx={3} fill={BEAR_LINE} opacity={0.22} />
        <G transform="rotate(-1.4 150 94)">
          <Rect x={58} y={14} width={184} height={156} rx={3} fill={CREAM} stroke={EDGE} strokeWidth={1.5} />
          <Dots />
          {children}
        </G>
      </G>
    </G>
  );
}
function Dots() {
  return (
    <G>
      <Circle cx={150} cy={44} r={14} fill={GOLD} opacity={0.35} />
      <Circle cx={150} cy={44} r={7} fill={GOLD} stroke={BEAR_LINE} strokeWidth={1.5} />
      <Circle cx={150} cy={144} r={7} fill={TEAL} stroke={BEAR_LINE} strokeWidth={1.5} />
      <Say x={166} y={49} s="God" fill={BEAR_LINE} anchor="start" />
      <Say x={166} y={149} s="us" fill={BEAR_LINE} anchor="start" />
    </G>
  );
}

/* ---------- 2. two dots, and a pen ready to draw ---------- */
function TwoDots({ k }: { k: Ink }) {
  const p = useRun(200, 900);
  const e = 1 - (1 - p) * (1 - p);
  const off = (1 - e) * 34;
  return (
    <Frame label="A big sheet of paper on a desk with two dots: one near the top labeled God, one near the bottom labeled us. A hand in a gray sleeve holds a pen just above the paper, ready to draw a line between them">
      <Desk id="g2d-clip">
        <G transform={`translate(${off} 0)`}>
          <Ellipse cx={154} cy={120} rx={6} ry={1.8} fill={BEAR_LINE} opacity={0.2} />
          <Tube fill={SWEATER} parts={[['M300 138 Q250 122 218 102', 15]]} />
          <Path d="M206 106 L214 100" stroke={SWEATER_L} strokeWidth={3} strokeLinecap="round" />
          <Path d="M200 98 L156 112" stroke={BEAR_LINE} strokeWidth={5.6} strokeLinecap="round" />
          <Path d="M200 98 L160 110" stroke="#2F4A9E" strokeWidth={3.6} strokeLinecap="round" />
          <Path d="M160 110 L152 113 L157 107 Z" fill={GOLD} stroke={BEAR_LINE} strokeWidth={0.8} strokeLinejoin="round" />
          <Circle cx={208} cy={97} r={8} fill={SKIN} stroke={BEAR_LINE} strokeWidth={1.4} />
          <Circle cx={198} cy={102} r={3.6} fill={SKIN} stroke={BEAR_LINE} strokeWidth={1.2} />
          <Circle cx={196} cy={93} r={3.4} fill={SKIN} stroke={BEAR_LINE} strokeWidth={1.2} />
        </G>
      </Desk>
      <Cap k={k} s="Draw the line" />
    </Frame>
  );
}

/* ---------- 3. no line: light fills the space from the bottom up ---------- */
function NoLine({ k }: { k: Ink }) {
  const p = useRun(300, 1800);
  const e = 1 - (1 - p) * (1 - p);
  const top = 138 - (138 - 50) * e;
  return (
    <Frame label="The same sheet of paper and its two dots, God at the top and us at the bottom. Warm golden light fills all the space between them from bottom to top. There is no line anywhere, only a faint crossed-out pencil mark, and the pen lies to one side">
      <Desk id="g2n-clip">
        {/* the pencil line someone tried, crossed out */}
        <G opacity={0.55}>
          <Path d="M104 96 L196 94" stroke="#8E96AB" strokeWidth={1.6} strokeLinecap="round" />
          <Path d="M130 84 L170 106 M170 84 L130 106" stroke={ROSE} strokeWidth={1.8} strokeLinecap="round" />
        </G>
        {/* light, rising */}
        <Rect x={112} y={top} width={76} height={138 - top} rx={16} fill={GOLD} opacity={0.2} />
        <Rect x={128} y={top} width={44} height={138 - top} rx={12} fill={GOLD} opacity={0.34} />
        <Rect x={140} y={top} width={20} height={138 - top} rx={9} fill="#FFF1B8" opacity={0.7} />
        <Circle cx={150} cy={44} r={14} fill={GOLD} opacity={0.4} />
        <Circle cx={150} cy={44} r={7} fill={GOLD} stroke={BEAR_LINE} strokeWidth={1.5} />
        <Circle cx={150} cy={144} r={7} fill={TEAL} stroke={BEAR_LINE} strokeWidth={1.5} />
        <Circle cx={150} cy={144} r={13} fill={GOLD} opacity={0.3 * e} />
        {p > 0.7 ? (
          <Path
            d="M114 112 l0 7 M110.5 115.5 l7 0 M188 82 l0 7 M184.5 85.5 l7 0 M122 70 l0 5 M119.5 72.5 l5 0 M180 118 l0 5 M177.5 120.5 l5 0"
            stroke={GOLD_D}
            strokeWidth={2}
            strokeLinecap="round"
          />
        ) : null}
        {/* the pen, put down */}
        <Path d="M196 156 L226 138" stroke={BEAR_LINE} strokeWidth={5.6} strokeLinecap="round" />
        <Path d="M196 156 L224 139" stroke="#2F4A9E" strokeWidth={3.6} strokeLinecap="round" />
        <Path d="M196 156 L190 160 L193 153 Z" fill={GOLD} stroke={BEAR_LINE} strokeWidth={0.8} strokeLinejoin="round" />
      </Desk>
      <Cap k={k} s="There is no line" />
    </Frame>
  );
}

/* ---------- 4. the lessons are already paid ---------- */
function Lessons({ k }: { k: Ink }) {
  const p = useRun(500, 1100);
  return (
    <Frame label="A living room with an upright piano. A child sits on a stool practicing. Behind, the mother in a purple dress hands an envelope marked with a check to the piano teacher in a green cardigan, who takes it: the lessons are already paid">
      <Stage sky={SKY} ground="#C99A5B" y={146} />
      <Rect x={112} y={26} width={42} height={46} rx={3} fill="#CFE6F2" stroke={EDGE} strokeWidth={1.5} />
      <Path d="M133 26 L133 72 M112 49 L154 49" stroke={EDGE} strokeWidth={1.5} />
      <Piano x={176} />
      <Stool x={153} y={136} />
      <Kid x={153} y={136} s={0.85} mood="calm" />
      <Adult x={34} y={160} s={1.3} body={PLUM} hair="long" mood="smile" arms="give" />
      <Adult x={104} y={160} s={1.3} flip body={GREEN} hair="bun" glasses mood="smile" arms="give" />
      {/* the envelope, paid */}
      <G transform="translate(69 123) rotate(-8)">
        <Rect x={-10} y={-7} width={20} height={14} rx={1.5} fill={CREAM} stroke={BEAR_LINE} strokeWidth={1.3} />
        <Path d="M-10 -7 L0 0 L10 -7" stroke={BEAR_LINE} strokeWidth={1.1} fill="none" strokeLinejoin="round" />
        <Path d="M-3.5 3.6 L-1 6 L4 1.5" stroke={GREEN} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </G>
      <G opacity={p} transform={`translate(0 ${(1 - p) * 8})`}>
        <Tune x={196} y={44} c={GOLD} />
        <Tune x={238} y={34} c={GOLD} s={0.8} />
      </G>
      <Cap k={k} s="The lessons are already paid" />
    </Frame>
  );
}

/* ---------- 5. a wrong note, and the lessons go on ---------- */
function WrongNote({ k }: { k: Ink }) {
  const p = useRun(300, 700);
  return (
    <Frame label="A child at an upright piano winces at a wrong note. A zoomed-in piece of the sheet music shows one note on the staff in a different color, rose red. Behind the child the piano teacher smiles, nods and holds out an open hand: keep going">
      <Stage sky={SKY} ground="#C99A5B" y={146} />
      <Rect x={96} y={30} width={40} height={44} rx={3} fill="#CFE6F2" stroke={EDGE} strokeWidth={1.5} />
      <Path d="M116 30 L116 74 M96 52 L136 52" stroke={EDGE} strokeWidth={1.5} />
      <Piano x={176} wrong />
      <Stool x={153} y={136} />
      <Kid x={153} y={136} s={0.85} mood="wince" />
      <Path d="M158 84 L162 79 M165 90 L170 87 M148 80 L147 74" stroke={ROSE} strokeWidth={1.8} strokeLinecap="round" opacity={0.9} />
      <Adult x={60} y={160} s={1.3} body={GREEN} hair="bun" glasses mood="smile" arms="open" />
      <Path d="M50 83 Q47 78 51 74 M44 85 Q39 78 44 72" stroke={SWEATER} strokeWidth={1.6} fill="none" strokeLinecap="round" opacity={0.9} />
      {/* the sheet, close up */}
      <G opacity={p} transform={`translate(0 ${(1 - p) * 6})`}>
        <Circle cx={192} cy={64} r={2.6} fill={CREAM} stroke={BEAR_LINE} strokeWidth={1} />
        <Circle cx={198} cy={56} r={4} fill={CREAM} stroke={BEAR_LINE} strokeWidth={1} />
        <Rect x={196} y={12} width={92} height={44} rx={5} fill={CREAM} stroke={BEAR_LINE} strokeWidth={1.6} />
        {[0, 1, 2, 3, 4].map((i) => (
          <Path key={i} d={`M204 ${22 + i * 6} L280 ${22 + i * 6}`} stroke="#8A7A66" strokeWidth={1} />
        ))}
        {(
          [
            [214, 4],
            [234, 3],
            [254, 1],
            [270, 3],
          ] as [number, number][]
        ).map(([nx, idx], i) => {
          const ny = 22 + idx * 3;
          const c = i === 2 ? ROSE : BEAR_LINE;
          return (
            <G key={nx}>
              <Ellipse cx={nx} cy={ny} rx={4.6} ry={3.4} fill={c} transform={`rotate(-20 ${nx} ${ny})`} />
              <Path d={`M${nx + 4} ${ny} L${nx + 4} ${ny - 16}`} stroke={c} strokeWidth={1.6} />
            </G>
          );
        })}
      </G>
    </Frame>
  );
}

/* ---------- 6. the same grace for the child and for you ---------- */
function Mirror({ k }: { k: Ink }) {
  const p = useRun(300, 900);
  return (
    <Frame label="One warm light falls from the top center onto two people. On the left a child at the piano is encouraged by the teacher behind, who rests a hand on the child's shoulder. On the right an adult stands alone in front of a mirror, slumped, looking at their own reflection">
      <Defs>
        <ClipPath id="g2m-glass">
          <Rect x={228} y={40} width={42} height={98} rx={16} />
        </ClipPath>
      </Defs>
      <Stage sky="#EBCB94" ground="#B98A52" y={146} />
      <Path d="M150 14 L10 150 L290 150 Z" fill={GOLD} opacity={0.2 * p} />
      <Path d="M150 14 L72 150 L228 150 Z" fill={GOLD} opacity={0.18 * p} />
      <Circle cx={150} cy={10} r={30} fill={GOLD} opacity={0.4} />
      <Circle cx={150} cy={10} r={18} fill="#FFF1B8" />
      {/* the child at the piano, with the teacher behind */}
      <G transform="translate(132 35) scale(-0.72 0.72)">
        <Piano x={60} />
        <Stool x={37} y={136} />
        <Kid x={37} y={136} s={0.85} mood="smile" />
        <Adult x={0} y={160} s={1.3} body={GREEN} hair="bun" glasses mood="smile" arms="shoulder" />
      </G>
      <Circle cx={112} cy={96} r={22} fill={GOLD} opacity={0.22} />
      {/* the adult, alone at the mirror */}
      <Circle cx={196} cy={90} r={26} fill={GOLD} opacity={0.22} />
      <Rect x={224} y={36} width={50} height={106} rx={18} fill={WOOD_D} stroke={BEAR_LINE} strokeWidth={1.6} />
      <Rect x={228} y={40} width={42} height={98} rx={16} fill="#CFE0EE" stroke={BEAR_LINE} strokeWidth={1.2} />
      <G clipPath="url(#g2m-glass)">
        <Circle cx={249} cy={96} r={26} fill={GOLD} opacity={0.2} />
        <G opacity={0.9}>
          <Adult x={249} y={136} s={0.95} flip body={SLATE} hair="short" mood="sad" slump={9} />
        </G>
        <Path d="M236 50 L262 78 M236 62 L252 80" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" opacity={0.5} />
      </G>
      <Adult x={188} y={150} s={1.3} body={SLATE} hair="short" mood="sad" slump={9} />
      <Cap k={k} s="The same patience for both" />
    </Frame>
  );
}

/* ---------- 7. Gideon and the three hundred ---------- */
function Tent({ x, y, w, lit }: { x: number; y: number; w: number; lit: boolean }) {
  const h = w * 0.8;
  return (
    <G>
      <Path d={`M${x - w / 2} ${y} L${x} ${y - h} L${x + w / 2} ${y} Z`} fill="#CDB07E" stroke={BEAR_LINE} strokeWidth={0.8} strokeLinejoin="round" />
      <Path d={`M${x - w * 0.12} ${y} L${x} ${y - h * 0.55} L${x + w * 0.12} ${y} Z`} fill="#4A3A3A" />
      {lit ? <Circle cx={x + w * 0.62} cy={y - 1} r={Math.max(1.4, w * 0.1)} fill={ORANGE} /> : null}
    </G>
  );
}

/* a man of the band on (x, y), facing right: a plain tunic, a trumpet raised in one hand and a clay pitcher with a hidden flame in the other */
function Man({
  x,
  y,
  s = 1,
  tunic,
  hold = 'both',
  band = false,
}: {
  x: number;
  y: number;
  s?: number;
  tunic: string;
  hold?: 'both' | 'horn' | 'torch';
  band?: boolean;
}) {
  const sw = 1.5 / s;
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Tube
        fill={SKIN}
        parts={[
          ['M-4 -9 L-4 -2', 4.5],
          ['M4 -9 L4 -2', 4.5],
        ]}
      />
      <Path d="M-12 -7 L-8 -32 Q-8 -40 0 -40 Q8 -40 8 -32 L12 -7 Z" fill={tunic} stroke={BEAR_LINE} strokeWidth={sw} strokeLinejoin="round" />
      <Path d="M-9.4 -20 L9.4 -20" stroke={BEAR_LINE} strokeWidth={2} strokeLinecap="round" opacity={0.55} />
      {hold !== 'torch' ? (
        <G>
          <Tube fill={tunic} parts={[['M6 -34 Q14 -42 14 -52', 5]]} />
          <Hand x={14} y={-53} r={3.4} />
          <G transform="translate(14 -54) rotate(24)">
            <Rect x={-1.5} y={-20} width={3} height={20} fill={GOLD} stroke={BEAR_LINE} strokeWidth={0.9} />
            <Path d="M-1.5 -20 L-5.5 -27 L5.5 -27 L1.5 -20 Z" fill={GOLD} stroke={BEAR_LINE} strokeWidth={0.9} strokeLinejoin="round" />
          </G>
        </G>
      ) : null}
      {hold !== 'horn' ? (
        <G>
          <Tube fill={tunic} parts={[[hold === 'torch' ? 'M6 -34 Q15 -38 15 -47' : 'M-6 -34 Q-14 -37 -15 -45', 5]]} />
          <G transform={`translate(${hold === 'torch' ? 15 : -15} -47)`}>
            <Hand x={0} y={0} r={3.4} />
            <Path d="M-5 -2 Q-8 -8 -4.5 -12 L-3 -14 L3 -14 L4.5 -12 Q8 -8 5 -2 Z" fill={CLAY} stroke={BEAR_LINE} strokeWidth={1} strokeLinejoin="round" />
            <Flame x={0} y={-14} s={0.9} glow={12} />
          </G>
        </G>
      ) : null}
      <G transform="translate(0 4)">
        <Head hair="short" />
        {band ? <Path d="M-8.4 -53 Q0 -56.4 8.4 -53" stroke={CLOTH} strokeWidth={2.2} fill="none" strokeLinecap="round" /> : null}
      </G>
    </G>
  );
}

function Gideon({ k }: { k: Ink }) {
  const rows: { y: number; w: number; step: number; x0: number }[] = [
    { y: 129, w: 8, step: 9, x0: 126 },
    { y: 136, w: 10, step: 12, x0: 128 },
    { y: 144, w: 13, step: 15, x0: 132 },
    { y: 153, w: 17, step: 20, x0: 140 },
    { y: 164, w: 22, step: 27, x0: 150 },
  ];
  const stars: [number, number][] = [
    [30, 28],
    [86, 22],
    [140, 34],
    [190, 24],
    [226, 54],
    [118, 60],
    [270, 70],
  ];
  return (
    <Frame label="At night on a hilltop, Gideon, a young man in a simple tunic, stands with a small band of men holding torches hidden in clay pitchers, and trumpets. Far below in the valley spreads a huge camp of tents with hundreds of little campfires, a small three hundred against a great army">
      <Rect x={10} y={10} width={280} height={162} rx={12} fill="#232B5A" />
      <Circle cx={252} cy={38} r={11} fill={CLOTH} />
      <Circle cx={256} cy={35} r={9.5} fill="#232B5A" />
      {stars.map(([sx, sy]) => (
        <Circle key={sx} cx={sx} cy={sy} r={1.3} fill={CLOTH} opacity={0.8} />
      ))}
      <Path d="M120 124 Q170 100 218 114 Q258 100 290 112 L290 130 L120 130 Z" fill="#2F386B" />
      <Path d="M10 126 L290 126 L290 160 Q290 172 278 172 L22 172 Q10 172 10 160 Z" fill="#3A416F" />
      <Ellipse cx={218} cy={146} rx={86} ry={26} fill={ORANGE} opacity={0.14} />
      {rows.map((r, ri) => {
        const tents: number[] = [];
        for (let tx = r.x0; tx + r.w / 2 <= 288; tx += r.step) tents.push(tx);
        return (
          <G key={r.y}>
            {tents.map((tx, i) => (
              <Tent key={tx} x={tx} y={r.y} w={r.w} lit={(i * 7 + ri * 3) % 5 === 0} />
            ))}
          </G>
        );
      })}
      {/* the hill, and the band on top of it */}
      <Path d="M10 172 L10 112 Q34 102 66 102 Q96 102 114 116 Q126 126 134 140 Q140 152 148 172 Z" fill="#1B2145" />
      <Path d="M10 112 Q34 102 66 102 Q96 102 114 116 Q126 126 134 140" stroke="#4A5490" strokeWidth={1.6} fill="none" strokeLinecap="round" />
      <Man x={14} y={116} s={0.8} tunic="#8C6A45" hold="torch" />
      <Man x={30} y={113} s={0.9} tunic="#8A5A2B" hold="horn" />
      <Man x={48} y={110} s={0.95} tunic="#7A5A6A" hold="torch" />
      <Man x={90} y={111} s={0.95} tunic="#5E7A5A" hold="horn" />
      <Man x={108} y={118} s={0.85} tunic="#A06A3A" hold="torch" />
      <Man x={68} y={110} s={1.1} tunic="#C98A4A" hold="both" band />
      <Cap k={k} s="Three hundred" />
    </Frame>
  );
}

/* ---------- 8. Moroni, alone with his plates ---------- */
function Moroni(_: { k: Ink }) {
  const p = useRun(300, 1100);
  return (
    <Frame label="Alone in a dark place, Moroni, a bearded man in a simple robe, sits cross-legged and writes on thin metal plates by the light of a small clay lamp. A soft light falls on him from above">
      <Rect x={10} y={10} width={280} height={162} rx={12} fill="#2A2140" />
      <Path d="M10 148 L290 148 L290 160 Q290 172 278 172 L22 172 Q10 172 10 160 Z" fill="#463A5E" />
      <Path d="M112 10 L188 10 L252 150 L48 150 Z" fill={GOLD} opacity={0.14 * p} />
      <Path d="M130 10 L170 10 L212 150 L88 150 Z" fill="#FFF1B8" opacity={0.16 * p} />
      {[
        [120, 36],
        [164, 52],
        [146, 78],
        [188, 96],
        [108, 108],
      ].map(([sx, sy]) => (
        <Circle key={sx} cx={sx} cy={sy} r={1.6} fill="#FFF1B8" opacity={0.85 * p} />
      ))}
      {/* the stone ledge and the lamp */}
      <Rect x={218} y={134} width={52} height={18} rx={3} fill="#5B5470" stroke={BEAR_LINE} strokeWidth={1.4} />
      <Circle cx={240} cy={118} r={26} fill={GOLD} opacity={0.22} />
      <Path
        d="M228 134 Q226 126 236 126 L248 126 Q252 124 258 122 Q256 128 252 130 Q250 134 244 134 Z"
        fill="#C9A86A"
        stroke={BEAR_LINE}
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
      <Flame x={258} y={122} s={0.9} glow={12} />
      {/* Moroni, seated */}
      <G transform="translate(126 150) scale(1.6)">
        <Path d="M-30 0 Q-28 -10 -10 -12 L18 -12 Q36 -10 32 0 Z" fill="#D8C9A3" stroke={BEAR_LINE} strokeWidth={1} strokeLinejoin="round" />
        <Path d="M-14 -10 L-12 -34 Q-12 -44 0 -44 Q12 -44 12 -34 L16 -10 Z" fill="#D8C9A3" stroke={BEAR_LINE} strokeWidth={1} strokeLinejoin="round" />
        <Path d="M-13 -22 L14 -22" stroke="#8A6A3A" strokeWidth={2.4} strokeLinecap="round" />
        <Tube fill="#D8C9A3" parts={[['M6 -36 Q20 -28 28 -16', 5.5]]} />
        <Hand x={29} y={-15.5} r={3.4} />
        <Path d="M29 -16 L35 -10" stroke={BEAR_LINE} strokeWidth={1.4} strokeLinecap="round" />
        <G transform="translate(0 -1) rotate(14 0 -44)">
          <Head hair="beard" />
        </G>
      </G>
      {/* the plates */}
      <Path d="M158 142 L196 138 L200 146 L162 150 Z" fill="#B88A22" stroke={BEAR_LINE} strokeWidth={1.2} strokeLinejoin="round" />
      <Path d="M158 137 L196 133 L200 141 L162 145 Z" fill="#E0B040" stroke={BEAR_LINE} strokeWidth={1.2} strokeLinejoin="round" />
      <Path d="M168 139 L190 136.6 M170 142 L192 139.6" stroke="#8A6A12" strokeWidth={1} strokeLinecap="round" />
      <Circle cx={160} cy={140} r={2.1} fill="#E8E2D0" stroke={BEAR_LINE} strokeWidth={0.9} />
      <Circle cx={162.4} cy={148} r={2.1} fill="#E8E2D0" stroke={BEAR_LINE} strokeWidth={0.9} />
    </Frame>
  );
}

/* ---------- 9. bring it as it is: a cracked pot, held out ---------- */
function Hands({ k }: { k: Ink }) {
  const p = useRun(400, 1300);
  return (
    <Frame label="A person holds out two open hands, and in them sits a small cracked clay pot, the weak place. Warm light comes down from above into the pot, and the crack glows gold">
      <Defs>
        <ClipPath id="g2h-clip">
          <Rect x={10} y={10} width={280} height={162} rx={12} />
        </ClipPath>
      </Defs>
      <Rect x={10} y={10} width={280} height={162} rx={12} fill="#34284E" />
      <G clipPath="url(#g2h-clip)">
        <Path d="M92 10 L220 10 L184 100 L128 100 Z" fill={GOLD} opacity={0.2 * p} />
        <Path d="M120 10 L192 10 L172 100 L142 100 Z" fill="#FFF1B8" opacity={0.3 * p} />
        {[
          [136, 34],
          [174, 50],
          [158, 70],
          [148, 22],
          [188, 30],
          [126, 60],
        ].map(([sx, sy]) => (
          <Circle key={sx} cx={sx} cy={sy} r={2} fill="#FFF1B8" opacity={0.9 * p} />
        ))}
        {/* the arms come in from below, cropped by the frame */}
        <Tube fill={TEAL} parts={[['M78 188 L122 148', 22]]} />
        <Tube fill={TEAL} parts={[['M234 188 L190 148', 22]]} />
        <Path d="M112 140 L128 154 M198 140 L182 154" stroke={CLOTH} strokeWidth={4} strokeLinecap="round" opacity={0.6} />
        {/* the open palms */}
        <Ellipse cx={138} cy={141} rx={19} ry={8} fill={SKIN} stroke={BEAR_LINE} strokeWidth={1.4} transform="rotate(-10 138 141)" />
        <Ellipse cx={175} cy={141} rx={19} ry={8} fill={SKIN} stroke={BEAR_LINE} strokeWidth={1.4} transform="rotate(10 175 141)" />
        {/* the pot */}
        <G transform="translate(156 100) scale(1.6)">
          <Ellipse cx={0} cy={0} rx={14} ry={4} fill="#8A4A24" stroke={BEAR_LINE} strokeWidth={1} />
          <Path d="M-14 0 Q-18 14 -9 22 L9 22 Q18 14 14 0 Q0 5 -14 0 Z" fill={CLAY} stroke={BEAR_LINE} strokeWidth={1} strokeLinejoin="round" />
          <Path d="M-12 7 Q0 10 12 7" stroke="#8A4A24" strokeWidth={1.2} fill="none" opacity={0.7} />
          <Ellipse cx={0} cy={0} rx={11} ry={2.6} fill={GLOW} opacity={0.9 * p} />
          <Path
            d="M-4 3 L1 8 L-3 13 L2 18 L-1 22"
            stroke="#FFE29A"
            strokeWidth={6}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.4 * p}
          />
          <Path d="M-4 3 L1 8 L-3 13 L2 18 L-1 22" stroke={GOLD} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={p} />
        </G>
        <Circle cx={156} cy={116} r={30} fill={GOLD} opacity={0.18 * p} />
        {/* fingers curled up the sides of the pot */}
        <Ellipse cx={126} cy={130} rx={4} ry={7} fill={SKIN} stroke={BEAR_LINE} strokeWidth={1.2} transform="rotate(18 126 130)" />
        <Ellipse cx={186} cy={130} rx={4} ry={7} fill={SKIN} stroke={BEAR_LINE} strokeWidth={1.2} transform="rotate(-18 186 130)" />
      </G>
      <Cap k={k} s="Bring it as it is" />
    </Frame>
  );
}

export const SCENES_I2: Record<string, ComponentType<{ k: Ink }>> = {
  'g2-student': Worry,
  'g2-dots': TwoDots,
  'g2-noline': NoLine,
  'g2-piano': Lessons,
  'g2-note': WrongNote,
  'g2-mirror': Mirror,
  'g2-gideon': Gideon,
  'g2-moroni': Moroni,
  'g2-hands': Hands,
};
