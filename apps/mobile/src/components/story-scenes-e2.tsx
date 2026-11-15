/* Scenes for lessons told as a story (see story-kit.tsx), part of story-scenes-e.tsx: lesson 12, "Name the feeling". */
import { useEffect, useState, type ComponentType } from 'react';
import { Easing } from 'react-native';
import { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';

import { useAppear, useReducedMotion } from '@/lib/motion';

import { Frame, type Ink, Person, Say } from './story-kit';

const RED = '#C2410C';
const GOLD = '#FFD25A';

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

const HEAD = 'M-30 -4 Q-36 -44 -2 -46 Q34 -46 36 -14 L44 2 Q46 6 40 8 L36 8 Q38 20 28 22 L26 34 L-8 34 L-8 22 Q-30 16 -30 -4 Z';

/* a simple angry face: round head, brows slanting down toward the nose, a frown */
function AngryFace({ cx, cy, r, k }: { cx: number; cy: number; r: number; k: Ink }) {
  return (
    <G>
      <Circle cx={cx} cy={cy} r={r} fill={k.bg} stroke={k.ink} strokeWidth={2} />
      <Line x1={cx - 0.62 * r} y1={cy - 0.42 * r} x2={cx - 0.14 * r} y2={cy - 0.2 * r} stroke={k.ink} strokeWidth={2.4} strokeLinecap="round" />
      <Line x1={cx + 0.62 * r} y1={cy - 0.42 * r} x2={cx + 0.14 * r} y2={cy - 0.2 * r} stroke={k.ink} strokeWidth={2.4} strokeLinecap="round" />
      <Circle cx={cx - 0.36 * r} cy={cy - 0.02 * r} r={0.09 * r} fill={k.ink} />
      <Circle cx={cx + 0.36 * r} cy={cy - 0.02 * r} r={0.09 * r} fill={k.ink} />
      <Path
        d={`M${cx - 0.38 * r} ${cy + 0.52 * r} Q${cx} ${cy + 0.18 * r} ${cx + 0.38 * r} ${cy + 0.52 * r}`}
        fill="none"
        stroke={k.ink}
        strokeWidth={2.4}
        strokeLinecap="round"
      />
    </G>
  );
}

/* a word button: blank, or filled when it is the one picked */
function WordButton({ x, y, w, h, s, k, picked, bar }: { x: number; y: number; w: number; h: number; s?: string; k: Ink; picked?: boolean; bar?: boolean }) {
  return (
    <G>
      <Rect x={x} y={y} width={w} height={h} rx={h / 2} fill={picked ? k.acc : k.bg} stroke={picked ? k.acc : k.line} strokeWidth={2} />
      {bar ? <Rect x={x + w / 2 - 12} y={y + h / 2 - 2} width={24} height={4} rx={2} fill={k.muted} /> : null}
      {s ? <Say x={x + w / 2} y={y + h / 2 + 4.6} s={s} fill={picked ? k.bg : k.ink} /> : null}
    </G>
  );
}

/* ---------- 1: the scanner ---------- */
function FaceWords({ k }: { k: Ink }) {
  return (
    <Frame label="A brain scanner seen from the side. A person lies on its table with their head inside the big ring. Above, a screen shows an angry face with two blank word buttons under it.">
      <Circle cx={210} cy={122} r={38} fill="none" stroke={k.line} strokeWidth={24} />
      <Circle cx={210} cy={122} r={50} fill="none" stroke={k.muted} strokeWidth={1.5} opacity={0.6} />
      <Circle cx={210} cy={122} r={26} fill="none" stroke={k.muted} strokeWidth={1.5} opacity={0.6} />
      <Rect x={176} y={170} width={68} height={8} rx={4} fill={k.line} />
      <Rect x={20} y={134} width={190} height={7} rx={3.5} fill={k.muted} />
      <Rect x={60} y={141} width={7} height={37} rx={3} fill={k.muted} />
      <Rect x={24} y={121} width={160} height={13} rx={6.5} fill={k.acc} />
      <Circle cx={203} cy={123} r={11} fill={k.acc} />
      <Rect x={20} y={10} width={112} height={90} rx={12} fill={k.soft} stroke={k.ink} strokeWidth={2} />
      <AngryFace cx={76} cy={38} r={17} k={k} />
      <WordButton x={28} y={68} w={46} h={20} k={k} bar />
      <WordButton x={78} y={68} w={46} h={20} k={k} bar />
      <Say x={150} y={196} s="Two words to choose from" fill={k.ink} />
    </Frame>
  );
}

/* ---------- 2: names or feelings ---------- */
function NamesFeelings({ k }: { k: Ink }) {
  return (
    <Frame label="Two screens, each showing the same angry face. Under the left face are two names, Harry and Sally. Under the right face are two feelings, angry and scared, with angry picked.">
      <Rect x={14} y={12} width={130} height={146} rx={14} fill={k.soft} stroke={k.ink} strokeWidth={2} />
      <Rect x={156} y={12} width={130} height={146} rx={14} fill={k.soft} stroke={k.ink} strokeWidth={2} />
      <AngryFace cx={79} cy={56} r={27} k={k} />
      <AngryFace cx={221} cy={56} r={27} k={k} />
      <WordButton x={22} y={110} w={54} h={30} s="Harry" k={k} />
      <WordButton x={82} y={110} w={54} h={30} s="Sally" k={k} />
      <WordButton x={164} y={110} w={54} h={30} s="angry" k={k} picked />
      <WordButton x={224} y={110} w={54} h={30} s="scared" k={k} />
      <Say x={79} y={186} s="Names" fill={k.muted} />
      <Say x={221} y={186} s="Feelings" fill={k.ink} />
    </Frame>
  );
}

/* ---------- 3: the alarm goes quiet ---------- */
function AlarmQuiet({ k }: { k: Ink }) {
  const p = useGrow(500, 1400);
  const rays = Array.from({ length: 8 }, (_, i) => (i * Math.PI) / 4);
  const ray = (len: number, gr: number, fade: number, key: string) =>
    rays.map((a, i) => (
      <Line
        key={`${key}${i}`}
        x1={-2 + (gr + 3) * Math.cos(a)}
        y1={-12 + (gr + 3) * Math.sin(a)}
        x2={-2 + (gr + 3 + len) * Math.cos(a)}
        y2={-12 + (gr + 3 + len) * Math.sin(a)}
        stroke={RED}
        strokeWidth={3}
        strokeLinecap="round"
        opacity={fade}
      />
    ));
  const gr = 5 + 10 * (1 - p);
  return (
    <Frame label="Two heads side by side. After a name, the alarm spot glows large with rays. After a feeling, the alarm spot shrinks small and calm, and a soft gold glow wakes at the front of the head behind the forehead.">
      <G transform="translate(78 92) scale(1.5)">
        <Path d={HEAD} fill={k.soft} stroke={k.line} strokeWidth={2} />
        <Circle cx={-2} cy={-12} r={15} fill={RED} opacity={0.3} />
        <Circle cx={-2} cy={-12} r={9} fill={RED} opacity={0.55} />
        {ray(6, 15, 1, 'l')}
        <Circle cx={-2} cy={-12} r={5} fill={RED} />
      </G>
      <G transform="translate(214 92) scale(1.5)">
        <Path d={HEAD} fill={k.soft} stroke={k.line} strokeWidth={2} />
        <Circle cx={22} cy={-24} r={9} fill={GOLD} opacity={0.45 * p} />
        <Circle cx={22} cy={-24} r={5} fill={GOLD} opacity={0.85 * p} />
        <Circle cx={-2} cy={-12} r={gr} fill={RED} opacity={0.3} />
        <Circle cx={-2} cy={-12} r={gr * 0.6} fill={RED} opacity={0.55} />
        {p < 0.97 ? ray(6 * (1 - p), gr, 1 - p, 'r') : null}
        <Circle cx={-2} cy={-12} r={5 - 1.6 * p} fill={RED} />
      </G>
      <Say x={78} y={176} s="A name" fill={k.ink} />
      <Say x={214} y={176} s="A feeling" fill={k.ink} />
    </Frame>
  );
}

/* ---------- 4: it helped anyway ---------- */
function Surprise({ k }: { k: Ink }) {
  return (
    <Frame label="On the left, a person with a thought cloud holding a big question mark, doubting it will help. An arrow points to the same person on the right, calm and upright, saying one word: scared.">
      <Line x1={10} y1={160} x2={290} y2={160} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      <Cloud2 x={38} y={12} w={74} h={46} fill={k.soft} />
      <Say x={75} y={49} s="?" fill={k.ink} size={32} />
      <Person x={70} y={160} s={1.2} fill={k.muted} face={k.bg} />
      <Line x1={120} y1={118} x2={176} y2={118} stroke={k.muted} strokeWidth={3} strokeLinecap="round" />
      <Path d="M168 108 L182 118 L168 128" fill="none" stroke={k.muted} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      <Rect x={200} y={32} width={64} height={30} rx={15} fill={k.ink} />
      <Path d="M222 60 L238 60 L232 76 Z" fill={k.ink} />
      <Say x={232} y={52} s="scared" fill={k.bg} size={14} />
      <Person x={232} y={160} s={1.2} fill={k.acc} face={k.bg} />
      <Say x={150} y={190} s="It helped anyway" fill={k.ink} />
    </Frame>
  );
}

/* a thought cloud with its two small trailing bubbles at the lower left, kept clear of the person's head */
function Cloud2({ x, y, w, h, fill }: { x: number; y: number; w: number; h: number; fill: string }) {
  return (
    <G>
      <Rect x={x} y={y} width={w} height={h} rx={h / 2} fill={fill} />
      <Circle cx={x + w * 0.26} cy={y + h + 8} r={5} fill={fill} />
      <Circle cx={x + w * 0.22} cy={y + h + 18} r={3} fill={fill} />
    </G>
  );
}

/* ---------- 5: the tarantula in the box ---------- */
function SpiderBox({ k }: { k: Ink }) {
  const legs: [number, number, number, number, number, number][] = [
    [6, -8, 10, -30, 17, -14],
    [8, -5, 22, -26, 28, 6],
    [9, -1, 26, -14, 33, 14],
    [9, 2, 22, -4, 34, 22],
  ];
  const sx = 225;
  const sy = 98;
  const foot = (x: number, y: number, key: number) => (
    <G key={key} opacity={0.5}>
      <Ellipse cx={x} cy={y} rx={5.5} ry={3} fill={k.muted} />
      <Circle cx={x + 8} cy={y - 2.2} r={1.5} fill={k.muted} />
      <Circle cx={x + 9.5} cy={y} r={1.5} fill={k.muted} />
      <Circle cx={x + 8} cy={y + 2.2} r={1.5} fill={k.muted} />
    </G>
  );
  return (
    <Frame label="A person stands a few steps from a table and says, I am scared. Soft footprints on the floor lead toward an open box on the table, where a round tarantula peeks over the rim.">
      <Line x1={10} y1={170} x2={290} y2={170} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      {[0, 1, 2].map((i) => foot(102 + i * 24, i % 2 === 0 ? 184 : 177, i))}
      <Rect x={176} y={124} width={98} height={8} rx={3} fill={k.muted} />
      <Rect x={182} y={132} width={6} height={38} rx={2} fill={k.muted} />
      <Rect x={262} y={132} width={6} height={38} rx={2} fill={k.muted} />
      <Circle cx={sx} cy={sy} r={11} fill={k.ink} />
      <Rect x={205} y={100} width={40} height={24} rx={3} fill={k.soft} stroke={k.line} strokeWidth={2} />
      {[-1, 1].map((s) =>
        legs.map(([x1, y1, cx, cy, x2, y2], i) => (
          <Path
            key={`${s}${i}`}
            d={`M${sx + s * x1} ${sy + y1} Q${sx + s * cx} ${sy + cy} ${sx + s * x2} ${sy + y2}`}
            fill="none"
            stroke={k.ink}
            strokeWidth={2.4}
            strokeLinecap="round"
          />
        )),
      )}
      <Circle cx={sx - 4} cy={sy - 5} r={2.4} fill={k.bg} />
      <Circle cx={sx + 4} cy={sy - 5} r={2.4} fill={k.bg} />
      <Rect x={22} y={46} width={92} height={28} rx={14} fill={k.ink} />
      <Path d="M50 72 L64 72 L60 90 Z" fill={k.ink} />
      <Say x={68} y={65} s="I am scared" fill={k.bg} />
      <Person x={62} y={170} s={1.25} fill={k.ink} face={k.bg} />
    </Frame>
  );
}

/* ---------- 6: the fog called "bad" ---------- */
const FOG: [number, number, number, number][] = [
  [50, 122, 44, 30],
  [100, 92, 56, 36],
  [150, 118, 48, 32],
  [70, 62, 42, 26],
  [136, 60, 46, 28],
  [96, 142, 58, 26],
  [28, 84, 26, 22],
  [182, 90, 26, 22],
];
function Fog({ k }: { k: Ink }) {
  const p = useGrow(300, 1000);
  const halo = 14 + 12 * p;
  return (
    <Frame label="A person stands inside a soft grey fog with the faint word bad floating in it. At the edge of the fog, within arm's reach, a small phone glows.">
      <Line x1={10} y1={170} x2={290} y2={170} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      {FOG.map(([cx, cy, rx, ry], i) => (
        <Ellipse key={`s${i}`} cx={cx} cy={cy} rx={rx} ry={ry} fill={k.soft} opacity={0.6} />
      ))}
      {FOG.map(([cx, cy, rx, ry], i) => (
        <Ellipse key={`m${i}`} cx={cx} cy={cy} rx={rx} ry={ry} fill={k.muted} opacity={0.16} />
      ))}
      <G opacity={0.7}>
        <Say x={100} y={80} s="bad" fill={k.ink} size={34} />
      </G>
      <Person x={100} y={170} s={1.3} fill={k.ink} face={k.bg} />
      <Ellipse cx={100} cy={154} rx={56} ry={22} fill={k.muted} opacity={0.14} />
      <Ellipse cx={72} cy={162} rx={40} ry={16} fill={k.soft} opacity={0.5} />
      <Circle cx={198} cy={134} r={halo} fill={GOLD} opacity={0.22} />
      <Circle cx={198} cy={134} r={halo * 0.65} fill={GOLD} opacity={0.3} />
      <Rect x={184} y={152} width={30} height={6} rx={3} fill={k.line} />
      <Rect x={190} y={158} width={4} height={12} rx={2} fill={k.line} />
      <Rect x={204} y={158} width={4} height={12} rx={2} fill={k.line} />
      <Rect x={187} y={114} width={24} height={38} rx={5} fill={k.ink} />
      <Rect x={190} y={119} width={18} height={28} rx={3} fill={GOLD} />
    </Frame>
  );
}

/* ---------- 7: the name points to a need ---------- */
function Signposts({ k }: { k: Ink }) {
  const p = useGrow(400, 1600);
  const fog = 0.05 + 0.11 * (1 - p);
  const wood = { fill: k.line, stroke: k.muted, strokeWidth: 1.5, strokeLinejoin: 'round' as const };
  return (
    <Frame label="A wooden signpost with three arrow boards: Lonely points left to two people side by side, Worn out points right to a crescent moon, and Stressed points left to a walking path with a tree. The fog behind is thinning.">
      {[
        [110, 80, 48, 30],
        [190, 60, 50, 28],
        [150, 120, 60, 34],
        [100, 140, 46, 26],
        [196, 136, 46, 26],
      ].map(([cx, cy, rx, ry], i) => (
        <Ellipse key={i} cx={cx} cy={cy} rx={rx} ry={ry} fill={k.muted} opacity={fog} />
      ))}
      <Ellipse cx={150} cy={182} rx={26} ry={4} fill={k.line} opacity={0.7} />
      <Rect x={145} y={22} width={10} height={160} rx={4} fill={k.line} stroke={k.muted} strokeWidth={1.5} />
      <Path d="M70 42 L80 30 L148 30 L148 54 L80 54 Z" {...wood} />
      <Say x={113} y={47} s="Lonely" fill={k.ink} />
      <Path d="M152 70 L220 70 L230 82 L220 94 L152 94 Z" {...wood} />
      <Say x={187} y={87} s="Worn out" fill={k.ink} />
      <Path d="M70 122 L80 110 L148 110 L148 134 L80 134 Z" {...wood} />
      <Say x={113} y={127} s="Stressed" fill={k.ink} />
      <Person x={22} y={60} s={0.45} fill={k.acc} />
      <Person x={44} y={60} s={0.45} fill={k.acc} />
      <Circle cx={266} cy={82} r={16} fill={GOLD} />
      <Circle cx={274} cy={77} r={14} fill={k.bg} />
      <Circle cx={252} cy={64} r={1.8} fill={GOLD} />
      <Circle cx={286} cy={98} r={1.8} fill={GOLD} />
      <Circle cx={284} cy={62} r={1.4} fill={GOLD} />
      <Path d="M12 156 Q46 154 30 144 Q16 136 38 136" fill="none" stroke={k.line} strokeWidth={6} strokeLinecap="round" />
      <Rect x={40} y={124} width={5} height={12} rx={2} fill={k.muted} />
      <Circle cx={42} cy={114} r={12} fill={k.acc} />
    </Frame>
  );
}

/* ---------- 8: sharp words, or just "bad" ---------- */
function MoodLog({ k }: { k: Ink }) {
  const words = ['angry', 'ashamed', 'sad', 'nervous'];
  return (
    <Frame label="Two handheld devices side by side. The left screen lists four separate feelings: angry, ashamed, sad and nervous. The right screen shows one big blurry word: bad.">
      <Rect x={30} y={8} width={100} height={158} rx={16} fill={k.ink} />
      <Rect x={36} y={16} width={88} height={142} rx={10} fill={k.bg} />
      {words.map((s, i) => (
        <Say key={s} x={80} y={54 + i * 29} s={s} fill={k.ink} size={16} />
      ))}
      <Rect x={170} y={8} width={100} height={158} rx={16} fill={k.ink} />
      <Rect x={176} y={16} width={88} height={142} rx={10} fill={k.bg} />
      {[
        [-3, 0],
        [3, 0],
        [0, -3],
        [0, 3],
      ].map(([dx, dy], i) => (
        <G key={i} opacity={0.22}>
          <Say x={220 + dx} y={100 + dy} s="bad" fill={k.muted} size={40} />
        </G>
      ))}
      <G opacity={0.4}>
        <Say x={220} y={100} s="bad" fill={k.muted} size={40} />
      </G>
      <Say x={80} y={190} s="Sharp words" fill={k.ink} />
      <Say x={220} y={190} s="Just bad" fill={k.muted} />
    </Frame>
  );
}

export const SCENES_E2: Record<string, ComponentType<{ k: Ink }>> = {
  'l12-face-words': FaceWords,
  'l12-names-feelings': NamesFeelings,
  'l12-alarm-quiet': AlarmQuiet,
  'l12-surprise': Surprise,
  'l12-spider-box': SpiderBox,
  'l12-fog': Fog,
  'l12-signposts': Signposts,
  'l12-mood-log': MoodLog,
};
