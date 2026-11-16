/* Scenes for lessons told as a story (see story-kit.tsx), part of story-scenes-e.tsx: lesson 12, "The first link in the chain". */
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

const clamp = (n: number) => Math.max(0, Math.min(1, n));

type Pt = [number, number];

/* a point on a quadratic curve, and the angle of the curve there in degrees */
function quad(a: Pt, c: Pt, b: Pt, t: number) {
  const u = 1 - t;
  const x = u * u * a[0] + 2 * u * t * c[0] + t * t * b[0];
  const y = u * u * a[1] + 2 * u * t * c[1] + t * t * b[1];
  const dx = 2 * u * (c[0] - a[0]) + 2 * t * (b[0] - c[0]);
  const dy = 2 * u * (c[1] - a[1]) + 2 * t * (b[1] - c[1]);
  return { x, y, deg: (Math.atan2(dy, dx) * 180) / Math.PI };
}

/* a point on a cubic curve, and the angle of the curve there in degrees */
function cubic(p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number) {
  const u = 1 - t;
  const x = u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0];
  const y = u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1];
  const dx = 3 * u * u * (p1[0] - p0[0]) + 6 * u * t * (p2[0] - p1[0]) + 3 * t * t * (p3[0] - p2[0]);
  const dy = 3 * u * u * (p1[1] - p0[1]) + 6 * u * t * (p2[1] - p1[1]) + 3 * t * t * (p3[1] - p2[1]);
  return { x, y, deg: (Math.atan2(dy, dx) * 180) / Math.PI };
}

/* a small plane seen from above, nose to the right */
function Plane({ x, y, deg = 0, s = 1.2, fill }: { x: number; y: number; deg?: number; s?: number; fill: string }) {
  return (
    <G transform={`translate(${x} ${y}) rotate(${deg}) scale(${s})`}>
      <Path d="M2 0 L-3 -8.5 L0 -8.5 L6 0 L0 8.5 L-3 8.5 Z" fill={fill} />
      <Ellipse cx={0} cy={0} rx={8} ry={2.4} fill={fill} />
      <Path d="M-6 0 L-9 -3.6 L-6.5 -3.6 L-3 0 L-6.5 3.6 L-9 3.6 Z" fill={fill} />
    </G>
  );
}

/* a gentle wave stroke for the sea */
function Wave({ x, y, k, w = 14 }: { x: number; y: number; k: Ink; w?: number }) {
  const h = w / 4;
  return <Path d={`M${x} ${y} q${h} ${-h * 0.9} ${h * 2} 0 t${h * 2} 0`} fill="none" stroke={k.line} strokeWidth={1.8} strokeLinecap="round" opacity={0.8} />;
}

const WAVES_A: Pt[] = [
  [66, 142],
  [112, 154],
  [158, 134],
  [198, 152],
  [236, 138],
  [92, 176],
  [172, 176],
  [222, 170],
  [196, 36],
  [232, 50],
  [92, 26],
  [54, 168],
];

const LEFT_COAST = 'M0 56 Q26 62 34 88 Q42 110 30 130 Q20 150 0 158 Z';

/* ---------- 1: the ocean route ---------- */
function OceanRoute({ k }: { k: Ink }) {
  const p = useGrow(400, 1200);
  const a: Pt = [26, 100];
  const c: Pt = [150, 30];
  const b: Pt = [270, 100];
  const mark = quad(a, c, b, 0.33);
  const plane = quad(a, c, b, 0.09 + 0.1 * p);
  return (
    <Frame label="A map seen from above. Home is a dot on the coast at the left, another coast lies at the right, and a dashed flight route arcs across the sea. A small plane flies along the route toward a gold marker about a third of the way across, labeled Safe return.">
      {WAVES_A.map(([x, y], i) => (
        <Wave key={i} x={x} y={y} k={k} />
      ))}
      <Path d={LEFT_COAST} fill={k.soft} opacity={0.5} />
      <Path d="M300 56 Q276 64 268 88 Q262 110 272 130 Q280 150 300 158 Z" fill={k.soft} opacity={0.5} />
      <Circle cx={a[0]} cy={a[1]} r={4.5} fill={k.acc} />
      <Say x={44} y={105} s="Home" fill={k.ink} size={12} anchor="start" />
      <Path d={`M${a[0]} ${a[1]} Q${c[0]} ${c[1]} ${b[0]} ${b[1]}`} fill="none" stroke={k.muted} strokeWidth={2} strokeDasharray="5 5" strokeLinecap="round" />
      <Circle cx={b[0]} cy={b[1]} r={3} fill={k.muted} />
      <Plane x={plane.x} y={plane.y} deg={plane.deg} fill={k.ink} />
      <Line x1={mark.x} y1={mark.y - 8} x2={mark.x} y2={mark.y - 16} stroke={k.ink} strokeWidth={1.6} strokeLinecap="round" />
      <Say x={mark.x} y={mark.y - 22} s="Safe return" fill={k.ink} size={12} />
      <Circle cx={mark.x} cy={mark.y} r={7.5} fill={GOLD} opacity={0.35} />
      <Circle cx={mark.x} cy={mark.y} r={4.6} fill={GOLD} />
    </Frame>
  );
}

/* ---------- 2: turn back ---------- */
function TurnBack({ k }: { k: Ink }) {
  const p = useGrow(500, 1200);
  const a: Pt = [26, 112];
  const c: Pt = [150, 50];
  const b: Pt = [296, 112];
  const mark = quad(a, c, b, 0.33);
  const plane = quad(a, c, b, 0.22);
  /* the U-turn: out past the plane, around, and back toward Home */
  const turn = 'M88 84 C112 66 130 44 110 34 C88 24 62 44 54 76';
  return (
    <Frame label="The same map, simpler. Home is at the left. The plane, just before the gold marker, makes a smooth U-turn back toward Home along a curved arrow. Ahead on the route sits a small storm cloud with a tiny gold lightning zigzag. Turning back costs little.">
      <G transform="translate(0 18)">
        <Path d="M0 60 Q26 66 34 92 Q42 114 30 134 Q20 154 0 162 Z" fill={k.soft} opacity={0.5} />
        <Circle cx={a[0]} cy={a[1]} r={4.5} fill={k.acc} />
        <Say x={44} y={117} s="Home" fill={k.ink} size={12} anchor="start" />
        <Path
          d={`M${a[0]} ${a[1]} Q${c[0]} ${c[1]} ${b[0]} ${b[1]}`}
          fill="none"
          stroke={k.muted}
          strokeWidth={2}
          strokeDasharray="5 5"
          strokeLinecap="round"
        />
        <Circle cx={mark.x} cy={mark.y} r={7.5} fill={GOLD} opacity={0.35} />
        <Circle cx={mark.x} cy={mark.y} r={4.6} fill={GOLD} />
        <G opacity={clamp(p * 2)}>
          <Path d={turn} fill="none" stroke={k.acc} strokeWidth={3.4} strokeLinecap="round" />
          <Path d="M45.5 66 L54 79 L63 67" fill="none" stroke={k.acc} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" />
        </G>
        <Plane x={plane.x + 2} y={plane.y - 2} deg={plane.deg - 4} fill={k.ink} />
        {/* the storm: a small cloud and a zigzag */}
        <G fill={k.muted}>
          <Circle cx={186} cy={50} r={9} />
          <Circle cx={199} cy={46} r={11} />
          <Circle cx={212} cy={51} r={8} />
          <Rect x={180} y={50} width={38} height={9} rx={4.5} />
        </G>
        <Path d="M200 62 L194 72 L201 72 L195 83" fill="none" stroke={GOLD} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
      </G>
      <Say x={150} y={190} s="Turning back costs little" fill={k.ink} />
    </Frame>
  );
}

/* ---------- 3: the chain ---------- */
const LINKS: { cx: number; w: number; h: number; sw: number; c: (k: Ink) => string }[] = [
  { cx: 40, w: 22, h: 11, sw: 2, c: (k) => k.acc },
  { cx: 64, w: 32, h: 16, sw: 3.4, c: (k) => k.acc },
  { cx: 98, w: 44, h: 24, sw: 5.6, c: (k) => k.muted },
  { cx: 148, w: 60, h: 34, sw: 8.4, c: (k) => k.ink },
  { cx: 214, w: 82, h: 48, sw: 12, c: (k) => k.ink },
];
function ChainLinks({ k }: { k: Ink }) {
  const p = useGrow(300, 2400);
  const cy = 112;
  return (
    <Frame label="A chain of five links running left to right. The first link on the left is tiny and thin, labeled first yes. Each link is bigger and heavier than the last, ending in a big heavy link at the right.">
      {LINKS.map((l, i) => {
        const o = clamp(p * 5.2 - i);
        const sc = 0.6 + 0.4 * o;
        return (
          <G key={i} opacity={o} transform={`translate(${l.cx} ${cy}) scale(${sc}) translate(${-l.cx} ${-cy})`}>
            <Rect
              x={l.cx - l.w / 2 + l.sw / 2}
              y={cy - l.h / 2 + l.sw / 2}
              width={l.w - l.sw}
              height={l.h - l.sw}
              rx={(l.h - l.sw) / 2}
              fill="none"
              stroke={l.c(k)}
              strokeWidth={l.sw}
            />
          </G>
        );
      })}
      <G opacity={clamp(p * 5.2)}>
        <Line x1={40} y1={98} x2={40} y2={90} stroke={k.ink} strokeWidth={1.6} strokeLinecap="round" />
        <Say x={40} y={82} s="first yes" fill={k.ink} size={12} />
      </G>
    </Frame>
  );
}

/* ---------- 4: the mood climbs early ---------- */
function MoodClimb({ k }: { k: Ink }) {
  const p = useGrow(400, 1800);
  const seg = (i: number) => clamp(p * 4 - i);
  return (
    <Frame label="A small handheld device at the left. To its right a mood line runs flat, then starts to climb early and keeps climbing, turning from grey to red, up to a small red spark at the far right where the slip happens. A bracket under the early part reads hours before.">
      <Rect x={14} y={92} width={38} height={64} rx={7} fill={k.ink} />
      <Rect x={18.5} y={97} width={29} height={48} rx={3} fill={k.bg} />
      <Rect x={26} y={149} width={14} height={2.6} rx={1.3} fill={k.bg} />
      <Path d="M22 124 L43 124" stroke={k.muted} strokeWidth={2.4} strokeLinecap="round" />
      <Path d="M58 124 L72 124" stroke={k.muted} strokeWidth={2} strokeLinecap="round" strokeDasharray="2 4" />
      <Path d="M74 124 Q90 120 106 124 T132 124" fill="none" stroke={k.muted} strokeWidth={3.4} strokeLinecap="round" opacity={seg(0)} />
      <Path d="M132 124 Q156 124 174 112" fill="none" stroke={RED} strokeWidth={3.4} strokeLinecap="round" opacity={0.45 * seg(1)} />
      <Path d="M174 112 Q198 98 220 78" fill="none" stroke={RED} strokeWidth={3.6} strokeLinecap="round" opacity={0.75 * seg(2)} />
      <Path d="M220 78 Q242 58 262 40" fill="none" stroke={RED} strokeWidth={3.8} strokeLinecap="round" opacity={seg(3)} />
      <G opacity={seg(3)}>
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const a = (i * Math.PI) / 3 + 0.3;
          return (
            <Line
              key={i}
              x1={268 + 7 * Math.cos(a)}
              y1={34 + 7 * Math.sin(a)}
              x2={268 + 13 * Math.cos(a)}
              y2={34 + 13 * Math.sin(a)}
              stroke={RED}
              strokeWidth={2.6}
              strokeLinecap="round"
            />
          );
        })}
        <Circle cx={268} cy={34} r={5.4} fill={RED} />
      </G>
      <Path d="M80 142 L80 148 L196 148 L196 142" fill="none" stroke={k.acc} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
      <Say x={138} y={168} s="hours before" fill={k.ink} size={12} />
    </Frame>
  );
}

/* ---------- 5: the bottle "for guests" ---------- */
function BottleGuests({ k }: { k: Ink }) {
  const p = useGrow(500, 900);
  const jar = (x: number, h: number, key: number) => (
    <G key={key}>
      <Rect x={x} y={112 - h} width={20} height={h} rx={4} fill={k.soft} opacity={0.5} stroke={k.line} strokeWidth={1.8} />
      <Rect x={x + 2} y={112 - h - 4} width={16} height={5} rx={2} fill={k.line} />
    </G>
  );
  return (
    <Frame label="A kitchen shelf holding a few jars and one bottle. A small tag hangs from the bottle's neck reading for guests. A person stands in a doorway at the left, looking at it.">
      <Line x1={8} y1={178} x2={292} y2={178} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      <Path d="M20 178 L20 46 L96 46 L96 178" fill="none" stroke={k.line} strokeWidth={5} strokeLinejoin="round" strokeLinecap="round" />
      <Person x={58} y={178} s={1.3} fill={k.ink} face={k.bg} />
      <Line x1={112} y1={112} x2={294} y2={112} stroke={k.line} strokeWidth={4.5} strokeLinecap="round" />
      <Line x1={126} y1={116} x2={126} y2={130} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      <Line x1={280} y1={116} x2={280} y2={130} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      {jar(124, 24, 0)}
      {jar(150, 32, 1)}
      {jar(176, 20, 2)}
      {/* the bottle */}
      <Rect x={212} y={72} width={9} height={14} rx={2.5} fill={k.acc} />
      <Rect x={211} y={69} width={11} height={4.5} rx={2} fill={k.acc} />
      <Path d="M212 84 Q202 90 202 100 L202 110 Q202 112 204 112 L229 112 Q231 112 231 110 L231 100 Q231 90 221 84 Z" fill={k.acc} />
      <Rect x={208} y={96} width={18} height={10} rx={2} fill={k.bg} opacity={0.35} />
      {/* the tag */}
      <G opacity={clamp(p * 2)}>
        <Path d="M221 78 Q232 76 238 90" fill="none" stroke={k.ink} strokeWidth={1.4} strokeLinecap="round" />
        <G transform="rotate(-4 238 100)">
          <Rect x={232} y={90} width={62} height={20} rx={4} fill={k.ink} />
          <Circle cx={238} cy={100} r={1.8} fill={k.bg} />
          <Say x={268} y={104.5} s="for guests" fill={k.bg} size={12} />
        </G>
      </G>
    </Frame>
  );
}

/* ---------- 6: trace it back ---------- */
function TraceBack({ k }: { k: Ink }) {
  const p = useGrow(400, 1400);
  const A: [Pt, Pt, Pt, Pt] = [
    [262, 164],
    [232, 148],
    [204, 182],
    [174, 154],
  ];
  const B: [Pt, Pt, Pt, Pt] = [
    [174, 154],
    [144, 126],
    [126, 122],
    [126, 92],
  ];
  const C: [Pt, Pt, Pt, Pt] = [
    [126, 92],
    [126, 62],
    [98, 56],
    [66, 54],
  ];
  const fork: Pt = [66, 54];
  const road = `M${A[0]} C${A[1]} ${A[2]} ${A[3]} C${B[1]} ${B[2]} ${B[3]} C${C[1]} ${C[2]} ${C[3]}`;
  /* footprints, from near the slip back toward the fork */
  const marks: { x: number; y: number; deg: number; side: number }[] = [];
  const at = (seg: [Pt, Pt, Pt, Pt], t: number, side: number) => {
    const s = cubic(seg[0], seg[1], seg[2], seg[3], t);
    /* the path is drawn from the slip to the fork, so its direction already points toward the fork */
    const nx = -Math.sin((s.deg * Math.PI) / 180) * 3.6 * side;
    const ny = Math.cos((s.deg * Math.PI) / 180) * 3.6 * side;
    marks.push({ x: s.x + nx, y: s.y + ny, deg: s.deg, side });
  };
  [0.22, 0.4, 0.58, 0.76, 0.94].forEach((t, i) => at(A, t, i % 2 ? 1 : -1));
  [0.2, 0.42, 0.64, 0.86].forEach((t, i) => at(B, t, i % 2 ? 1 : -1));
  [0.22, 0.48, 0.74].forEach((t, i) => at(C, t, i % 2 ? 1 : -1));
  const shown = marks.length * p;
  return (
    <Frame label="A winding road drawn from a small red knot at the bottom right, the slip, back up to a small fork at the top left. Footprints lead along it backward toward the fork, and a magnifying glass sits over the fork. Find the first yes.">
      <Path d={road} fill="none" stroke={k.soft} strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" opacity={0.6} />
      <Path d={`M${fork} L40 32`} fill="none" stroke={k.soft} strokeWidth={10} strokeLinecap="round" opacity={0.6} />
      <Path d={`M${fork} L92 28`} fill="none" stroke={k.soft} strokeWidth={10} strokeLinecap="round" opacity={0.6} />
      {marks.map((m, i) => (
        <G key={i} opacity={clamp(shown - i) * 0.85} transform={`translate(${m.x} ${m.y}) rotate(${m.deg})`}>
          <Ellipse cx={0} cy={0} rx={4.2} ry={2.4} fill={k.ink} />
          <Circle cx={5.6} cy={-1.8} r={1.2} fill={k.ink} />
          <Circle cx={6.4} cy={0} r={1.2} fill={k.ink} />
          <Circle cx={5.6} cy={1.8} r={1.2} fill={k.ink} />
        </G>
      ))}
      {/* the slip: a small dark knot */}
      <G transform="translate(262 164)">
        <Ellipse cx={0} cy={0} rx={9} ry={5.4} fill="none" stroke={RED} strokeWidth={3} transform="rotate(35)" />
        <Ellipse cx={0} cy={0} rx={9} ry={5.4} fill="none" stroke={RED} strokeWidth={3} transform="rotate(-35)" />
        <Circle cx={0} cy={0} r={3.2} fill={RED} />
      </G>
      {/* the magnifying glass over the fork */}
      <Circle cx={fork[0]} cy={fork[1]} r={4.4} fill={k.acc} />
      <Line x1={fork[0] - 9.6} y1={fork[1] + 9.6} x2={fork[0] - 26} y2={fork[1] + 26} stroke={k.acc} strokeWidth={5.4} strokeLinecap="round" />
      <Circle cx={fork[0]} cy={fork[1]} r={13.5} fill="none" stroke={k.ink} strokeWidth={3.2} />
      <Say x={150} y={192} s="Find the first yes" fill={k.ink} />
    </Frame>
  );
}

/* ---------- 7: no point of no return ---------- */
function NoPoint({ k }: { k: Ink }) {
  const p = useGrow(400, 1500);
  const door: Pt = [43, 146];
  const starts: { s: Pt; c: Pt }[] = [
    { s: [118, 34], c: [70, 52] },
    { s: [178, 78], c: [110, 66] },
    { s: [236, 40], c: [150, 30] },
    { s: [226, 132], c: [140, 118] },
    { s: [150, 164], c: [96, 150] },
    { s: [262, 156], c: [180, 176] },
  ];
  return (
    <Frame label="A small house, Home, on the left with warm gold windows, and a person far out on the right. Several dashed paths, starting from different points across the scene, all lead back to the house. There is always a way home.">
      {starts.map(({ s, c }, i) => (
        <G key={i} opacity={clamp(p * 3 - i * 0.4)}>
          <Path d={`M${s} Q${c} ${door}`} fill="none" stroke={k.muted} strokeWidth={2} strokeDasharray="4 5" strokeLinecap="round" />
          {i < 5 ? <Circle cx={s[0]} cy={s[1]} r={3.4} fill={k.line} /> : null}
        </G>
      ))}
      <Line x1={8} y1={148} x2={80} y2={148} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      <Path d="M14 112 L41 88 L68 112 Z" fill={k.acc} />
      <Rect x={20} y={110} width={42} height={38} rx={2} fill={k.acc} />
      <Rect x={25} y={116} width={10} height={10} rx={1.5} fill={GOLD} />
      <Rect x={47} y={116} width={10} height={10} rx={1.5} fill={GOLD} />
      <Rect x={36} y={130} width={11} height={18} rx={2} fill={k.bg} />
      <Circle cx={41} cy={102} r={3.4} fill={GOLD} />
      <Say x={41} y={168} s="Home" fill={k.ink} size={12} />
      <Person x={266} y={170} s={0.8} fill={k.ink} face={k.bg} />
      <Say x={150} y={192} s="There is always a way home" fill={k.ink} />
    </Frame>
  );
}

/* ---------- 8: always able to turn ---------- */
function AlwaysTurn({ k }: { k: Ink }) {
  const p = useGrow(500, 1200);
  /* the road is one curve from the near edge to the house, wide near and narrow far */
  const p0: Pt = [184, 206];
  const p1: Pt = [184, 150];
  const p2: Pt = [48, 152];
  const p3: Pt = [94, 97];
  const left: string[] = [];
  const right: string[] = [];
  const mid: string[] = [];
  for (let i = 0; i <= 28; i++) {
    const t = i / 28;
    const c = cubic(p0, p1, p2, p3, t);
    const w = 2.5 + 34 * Math.pow(1 - t, 1.5);
    const nx = -Math.sin((c.deg * Math.PI) / 180);
    const ny = Math.cos((c.deg * Math.PI) / 180);
    left.push(`${(c.x + nx * w).toFixed(1)} ${(c.y + ny * w).toFixed(1)}`);
    right.push(`${(c.x - nx * w).toFixed(1)} ${(c.y - ny * w).toFixed(1)}`);
    mid.push(`${c.x.toFixed(1)} ${c.y.toFixed(1)}`);
  }
  const road = { edge: `M${left.join(' L')} L${right.reverse().join(' L')} Z`, mid: `M${mid.join(' L')}` };
  return (
    <Frame label="A road at dusk curving away toward a small house with warm lit gold windows. A low sun is half down on the horizon. On the near part of the road a person turns to face back toward the house, with a small curved arrow at their feet.">
      <Line x1={0} y1={95} x2={300} y2={95} stroke={k.line} strokeWidth={2} />
      {/* the low sun, half down */}
      <Path d="M206 95 A26 26 0 0 1 258 95 Z" fill={GOLD} opacity={0.22} />
      <Path d="M216 95 A16 16 0 0 1 248 95 Z" fill={GOLD} />
      <Path d="M240 95 Q262 87 300 95 Z" fill={k.soft} opacity={0.4} />
      {/* the road */}
      <Path d={road.edge} fill={k.soft} opacity={0.5} />
      <Path d={road.mid} fill="none" stroke={k.muted} strokeWidth={1.6} strokeDasharray="5 6" strokeLinecap="round" opacity={0.8} />
      {/* the house, far off */}
      <Circle cx={93} cy={90} r={14} fill={GOLD} opacity={0.2 * p} />
      <Path d="M84 89 L93 81 L102 89 Z" fill={k.acc} />
      <Rect x={86} y={88} width={14} height={9} fill={k.acc} />
      <Rect x={88} y={90} width={4} height={4} fill={GOLD} />
      <Rect x={94} y={90} width={4} height={4} fill={GOLD} />
      {/* the person, mid-turn, facing back toward the house */}
      <G transform="translate(184 175) rotate(-8) scale(1.3)">
        <Circle cx={-1} cy={-48} r={11} fill={k.ink} />
        <Path d="M-17 0 L-17 -16 Q-17 -33 0 -33 Q17 -33 17 -16 L17 0 Z" fill={k.ink} />
        <Circle cx={-6} cy={-47} r={1.8} fill={k.bg} />
      </G>
      <G opacity={clamp(p * 2)}>
        <Path d="M210 180 Q196 190 160 182" fill="none" stroke={k.acc} strokeWidth={3} strokeLinecap="round" />
        <Path d="M169 175 L160 182 L170 187" fill="none" stroke={k.acc} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      </G>
    </Frame>
  );
}

export const SCENES_E6: Record<string, ComponentType<{ k: Ink }>> = {
  'l12-ocean-route': OceanRoute,
  'l12-turn-back': TurnBack,
  'l12-chain-links': ChainLinks,
  'l12-mood-climb': MoodClimb,
  'l12-bottle-guests': BottleGuests,
  'l12-trace-back': TraceBack,
  'l12-no-point': NoPoint,
  'l12-always-turn': AlwaysTurn,
};
