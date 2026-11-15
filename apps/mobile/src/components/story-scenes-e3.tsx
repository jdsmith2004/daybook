/* Scenes for lessons told as a story (see story-kit.tsx), part of story-scenes-e.tsx: lesson 12, a longer breath out. */
import { useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { Easing } from 'react-native';
import { Circle, G, Line, Path, Rect } from 'react-native-svg';

import { useAppear, useReducedMotion } from '@/lib/motion';

import { BEAR_LINE, Frame, type Ink, Say } from './story-kit';

const RED = '#C2410C';
const GOLD = '#FFD25A';
const WHITE = '#FFFFFF';

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

/* a heartbeat: 0 at rest, rising to 1 and back once a second; with Reduce Motion on it stays at rest */
function usePulse(period = 1000) {
  const still = useReducedMotion();
  const [v, setV] = useState(0);
  useEffect(() => {
    if (still) return;
    const id = setInterval(() => {
      const t = (Date.now() % period) / period;
      setV(t < 0.3 ? Math.sin((t / 0.3) * Math.PI) : 0);
    }, 60);
    return () => clearInterval(id);
  }, [still, period]);
  return v;
}

/* a heart, 24 wide and 20 tall, centered on 0 0 (a little high) */
const HEART = 'M0 7 C-12 -2 -11 -12 -5.5 -12.5 C-2.5 -13 0 -10.5 0 -8 C0 -10.5 2.5 -13 5.5 -12.5 C11 -12 12 -2 0 7 Z';

/* the head in profile, facing right, with a bust under it that runs down to `bottom` (in the head's own units) */
const HEAD = 'M-30 -4 Q-36 -44 -2 -46 Q34 -46 36 -14 L44 2 Q46 6 40 8 L36 8 Q38 20 28 22 L26 34 L-8 34 L-8 22 Q-30 16 -30 -4 Z';
function Profile({ k, x, y, s, bottom, children }: { k: Ink; x: number; y: number; s: number; bottom: number; children?: ReactNode }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Path d={HEAD} fill={k.soft} stroke={k.line} strokeWidth={2} />
      <Path d={`M-60 ${bottom} Q-58 40 -10 30 L30 30 Q72 38 74 ${bottom} Z`} fill={k.soft} />
      <Path d={`M-60 ${bottom} Q-58 40 -10 30`} fill="none" stroke={k.line} strokeWidth={2} strokeLinecap="round" />
      <Path d={`M30 30 Q72 38 74 ${bottom}`} fill="none" stroke={k.line} strokeWidth={2} strokeLinecap="round" />
      {children}
    </G>
  );
}

/* ---------- 1: find your pulse ---------- */
function Pulse({ k }: { k: Ink }) {
  const v = usePulse();
  /* the forearm and hand, drawn twice: first all in the edge color and wider, then all in the fill, so the outline runs around the whole shape */
  const hand = (fill: string, grow: number) => {
    const g = grow;
    const fingers: [number, number][] = [
      [108, 84],
      [121, 92],
      [134, 84],
      [147, 66],
    ];
    return (
      <G>
        <Rect x={-24 - g} y={114 - g} width={184 + 2 * g} height={44 + 2 * g} rx={20 + g} fill={fill} />
        <Rect x={140 - g} y={106 - g} width={64 + 2 * g} height={58 + 2 * g} rx={22 + g} fill={fill} />
        {fingers.map(([fy, len]) => (
          <Rect key={fy} x={190 - g} y={fy - g} width={len + 2 * g} height={12 + 2 * g} rx={6 + g} fill={fill} />
        ))}
        <G transform="translate(160 114) rotate(-35)">
          <Rect x={-g} y={-8 - g} width={48 + 2 * g} height={16 + 2 * g} rx={8 + g} fill={fill} />
        </G>
      </G>
    );
  };
  return (
    <Frame label="A hand and forearm seen from above, palm up, with two fingers of the other hand resting on the inside of the wrist below the thumb. Above it, a small heartbeat line and a pulsing dot.">
      {hand(k.line, 1.5)}
      {hand(k.soft, 0)}
      <Circle cx={123} cy={143} r={3.5 + 8 * v} fill={k.acc} opacity={0.5 * (1 - v)} />
      <Circle cx={123} cy={143} r={3.5} fill={k.acc} />
      {[
        [116, 124, 138, 80],
        [130, 126, 152, 82],
      ].map(([x0, y0, x1, y1]) => (
        <G key={x0}>
          <Line x1={x0} y1={y0} x2={x1} y2={y1} stroke={k.line} strokeWidth={16} strokeLinecap="round" />
          <Line x1={x0} y1={y0} x2={x1} y2={y1} stroke={k.soft} strokeWidth={12.5} strokeLinecap="round" />
        </G>
      ))}
      <Path
        d="M170 62 L194 62 L202 50 L210 72 L220 26 L230 80 L238 62 L280 62"
        fill="none"
        stroke={k.acc}
        strokeWidth={3.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={280} cy={62} r={4 + 8 * v} fill={k.acc} opacity={0.35 * (1 - v)} />
      <Circle cx={280} cy={62} r={4} fill={k.acc} />
      <Say x={150} y={190} s="Find your pulse" fill={k.muted} />
    </Frame>
  );
}

/* ---------- 2: the beats follow the breath ---------- */
function Beats({ k }: { k: Ink }) {
  const p = useGrow(300, 1000);
  const pts = Array.from({ length: 41 }, (_, i) => {
    const u = i / 40;
    return [30 + 240 * u, 88 - 56 * (0.5 - 0.5 * Math.cos(2 * Math.PI * u))] as const;
  });
  const wave = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const close = Array.from({ length: 9 }, (_, i) => 34 + 12 * i);
  const wide = Array.from({ length: 5 }, (_, i) => 158 + 28 * i);
  const bar = (x: number) => <Rect key={x} x={x - 3} y={176 - 34 * p} width={6} height={34 * p} rx={3} fill={k.acc} />;
  return (
    <Frame label="One breath drawn as a wave: it rises for the breath in and falls for the breath out. Below it, heartbeats sit close together while the breath rises and spread apart while it falls.">
      <Path d={`${wave} L270 88 L30 88 Z`} fill={k.soft} />
      <Path d={wave} fill="none" stroke={k.ink} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
      <Line x1={24} y1={88} x2={276} y2={88} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      <Say x={90} y={113} s="in" fill={k.ink} size={15} />
      <Say x={210} y={113} s="out" fill={k.ink} size={15} />
      <Line x1={150} y1={122} x2={150} y2={176} stroke={k.line} strokeWidth={2} strokeDasharray="3 6" strokeLinecap="round" />
      {close.map(bar)}
      {wide.map(bar)}
    </Frame>
  );
}

/* ---------- 3: the vagus nerve ---------- */
function Vagus({ k }: { k: Ink }) {
  const v = usePulse();
  return (
    <Frame label="A head and shoulders in profile. A gold nerve runs from the base of the brain down the neck to the heart, where a small brake pad presses on it. A breath leaves the mouth.">
      <Profile k={k} x={100} y={70} s={1.3} bottom={78}>
        <Circle cx={-2} cy={-14} r={12} fill={GOLD} opacity={0.3} />
        <Circle cx={-2} cy={-14} r={5.5} fill={k.acc} />
        <Path d="M-4 -3 C-4 14 7 24 9 38 L12 49" fill="none" stroke={k.ink} strokeWidth={5} strokeLinecap="round" />
        <Path d="M-4 -3 C-4 14 7 24 9 38 L12 49" fill="none" stroke={GOLD} strokeWidth={3} strokeLinecap="round" />
        <G transform={`translate(13 62) scale(${1 + 0.1 * v})`}>
          <Path d={HEART} fill={k.acc} />
        </G>
        <Rect x={28} y={52} width={9} height={22} rx={4.5} fill={k.ink} />
        <Path d="M54 63 L43 63 M47 58 L42 63 L47 68" fill="none" stroke={k.muted} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
      </Profile>
      <Path d="M153 88 q15 -9 30 0 t30 0 t30 0 t30 0" fill="none" stroke={k.acc} strokeWidth={4} strokeLinecap="round" />
      <Path d="M160 101 q12 -7 24 0 t24 0 t24 0" fill="none" stroke={k.acc} strokeWidth={3} strokeLinecap="round" opacity={0.5} />
      <Say x={150} y={192} s="The vagus nerve" fill={k.muted} />
    </Frame>
  );
}

/* ---------- 4: the breath has a handle ---------- */
function Handle({ k }: { k: Ink }) {
  const p = useGrow(500, 1400);
  const a = ((-8 + 26 * p) * Math.PI) / 180;
  const px = 244;
  const py = 132;
  const hx = px + 92 * Math.sin(a);
  const hy = py - 92 * Math.cos(a);
  const dials: [number, string, number][] = [
    [45, 'Heart', -55],
    [107, 'Gut', -125],
    [169, 'Sweat', -40],
  ];
  return (
    <Frame label="A panel with three dials, heart, gut and sweat, each with a closed padlock on it. Beside it, a free lever labeled breath, with a round handle, eases down.">
      <Rect x={12} y={40} width={190} height={108} rx={16} fill={k.soft} opacity={0.5} stroke={k.line} strokeWidth={2} />
      {dials.map(([cx, s, deg]) => {
        const th = (deg * Math.PI) / 180;
        return (
          <G key={s}>
            <Circle cx={cx} cy={80} r={21} fill={k.bg} stroke={k.line} strokeWidth={2.5} />
            <Line
              x1={cx + 10 * Math.sin(th)}
              y1={80 - 10 * Math.cos(th)}
              x2={cx + 18 * Math.sin(th)}
              y2={80 - 18 * Math.cos(th)}
              stroke={k.muted}
              strokeWidth={3}
              strokeLinecap="round"
            />
            <Path
              d={`M${cx - 4.5} 77 L${cx - 4.5} 72 A4.5 4.5 0 0 1 ${cx + 4.5} 72 L${cx + 4.5} 77`}
              fill="none"
              stroke={k.ink}
              strokeWidth={2.6}
              strokeLinecap="round"
            />
            <Rect x={cx - 8} y={76} width={16} height={13} rx={3} fill={k.ink} />
            <Circle cx={cx} cy={82} r={1.8} fill={k.bg} />
            <Say x={cx} y={126} s={s} fill={k.ink} />
          </G>
        );
      })}
      <Rect x={222} y={128} width={44} height={16} rx={8} fill={k.soft} opacity={0.5} stroke={k.line} strokeWidth={2} />
      <Line x1={px} y1={py} x2={hx} y2={hy} stroke={k.ink} strokeWidth={7} strokeLinecap="round" />
      <Circle cx={px} cy={py} r={6} fill={k.ink} />
      <Circle cx={hx} cy={hy} r={11} fill={k.acc} />
      <Say x={px} y={168} s="Breath" fill={k.acc} />
    </Frame>
  );
}

/* ---------- 5: the long sigh ---------- */
function Sigh({ k }: { k: Ink }) {
  const p = useGrow(400, 1500);
  return (
    <Frame label="A face in profile. Two arrows go in at the nose, a big one and then a small one labeled sip. From the mouth, one long slow wavy line goes out to the right, labeled long out.">
      <Profile k={k} x={88} y={84} s={1.4} bottom={84} />
      <Line x1={234} y1={50} x2={158} y2={75} stroke={k.acc} strokeWidth={7} strokeLinecap="round" />
      <Path d="M170.7 77.6 L156 75.4 L166.6 65.3" fill="none" stroke={k.acc} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
      <Line x1={212} y1={86} x2={160} y2={86} stroke={k.acc} strokeWidth={3.5} strokeLinecap="round" />
      <Path d="M170 80 L159 86 L170 92" fill="none" stroke={k.acc} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
      <Say x={220} y={91} s="sip" fill={k.ink} anchor="start" />
      <Path d="M146 108 q19 -13 38 0 t38 0 t38 0 t34 0" fill="none" stroke={k.acc} strokeWidth={5} strokeLinecap="round" strokeDasharray={`${220 * p} 400`} />
      <Say x={232} y={142} s="long out" fill={k.ink} />
    </Frame>
  );
}

/* ---------- 6: turn the body down ---------- */
function Volume({ k }: { k: Ink }) {
  const p = useGrow(500, 1500);
  const cx = 76;
  const cy = 92;
  const deg = 120 - 220 * p;
  const th = (deg * Math.PI) / 180;
  const ticks = Array.from({ length: 11 }, (_, i) => -135 + 27 * i);
  const jag = [0, -40, 38, -52, 46, -34, 50, -44, 30, -48, 36, -20, 0];
  const jagPath = jag.map((o, i) => `${i ? 'L' : 'M'}${(150 + (i * 140) / 12).toFixed(1)} ${92 + o}`).join(' ');
  return (
    <Frame label="A big volume knob with its pointer turning from high down to low. Beside it, a tall jagged wave fades away while a small calm wave takes its place.">
      {ticks.map((d, i) => {
        const t = (d * Math.PI) / 180;
        const r0 = 46;
        const r1 = 46 + 4 + i * 0.9;
        return (
          <Line
            key={d}
            x1={cx + r0 * Math.sin(t)}
            y1={cy - r0 * Math.cos(t)}
            x2={cx + r1 * Math.sin(t)}
            y2={cy - r1 * Math.cos(t)}
            stroke={d <= deg ? k.acc : k.line}
            strokeWidth={3.5}
            strokeLinecap="round"
          />
        );
      })}
      <Circle cx={cx} cy={cy} r={38} fill={k.soft} stroke={k.line} strokeWidth={3} />
      <Circle cx={cx} cy={cy} r={26} fill={k.bg} stroke={k.line} strokeWidth={2} />
      <Line
        x1={cx + 8 * Math.sin(th)}
        y1={cy - 8 * Math.cos(th)}
        x2={cx + 31 * Math.sin(th)}
        y2={cy - 31 * Math.cos(th)}
        stroke={k.acc}
        strokeWidth={5}
        strokeLinecap="round"
      />
      <Circle cx={cx} cy={cy} r={4.5} fill={k.ink} />
      <Line x1={150} y1={92} x2={290} y2={92} stroke={k.line} strokeWidth={2} strokeDasharray="3 6" strokeLinecap="round" />
      <Path d={jagPath} fill="none" stroke={k.ink} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" opacity={0.55 - 0.32 * p} />
      <Path d="M150 92 q17.5 -22 35 0 t35 0 t35 0 t35 0" fill="none" stroke={k.acc} strokeWidth={5} strokeLinecap="round" opacity={0.4 + 0.6 * p} />
      <Say x={150} y={190} s="Turn the body down" fill={k.muted} />
    </Frame>
  );
}

/* ---------- 7: practice on a calm day ---------- */
function Cone({ x, y }: { x: number; y: number }) {
  return (
    <G transform={`translate(${x} ${y})`}>
      <Rect x={-8} y={-3} width={16} height={4} rx={2} fill={RED} />
      <Path d="M-5.5 -3 L0 -24 L5.5 -3 Z" fill={RED} />
      <Path d="M-3.2 -12 L3.2 -12 L2.2 -17 L-2.2 -17 Z" fill={WHITE} />
    </G>
  );
}
function Practice({ k }: { k: Ink }) {
  const p = useGrow(400, 1400);
  const bays = [34, 66, 98, 130, 162, 194];
  const rays = Array.from({ length: 8 }, (_, i) => (i * Math.PI) / 4);
  return (
    <Frame label="An empty parking lot seen from above, with painted bay lines and three traffic cones. A small car glides to a calm stop, with two short brake lines behind it, under a calm sun.">
      {rays.map((a, i) => (
        <Line
          key={i}
          x1={264 + 15 * Math.cos(a)}
          y1={22 + 15 * Math.sin(a)}
          x2={264 + 19 * Math.cos(a)}
          y2={22 + 19 * Math.sin(a)}
          stroke={GOLD}
          strokeWidth={3}
          strokeLinecap="round"
        />
      ))}
      <Circle cx={264} cy={22} r={11} fill={GOLD} />
      <Rect x={14} y={44} width={272} height={122} rx={12} fill={BEAR_LINE} opacity={0.88} stroke={k.line} strokeWidth={2} />
      {bays.map((x) => (
        <G key={x}>
          <Line x1={x} y1={46} x2={x} y2={86} stroke={WHITE} strokeWidth={3} opacity={0.9} />
          <Line x1={x} y1={152} x2={x} y2={164} stroke={WHITE} strokeWidth={3} opacity={0.9} />
        </G>
      ))}
      <Rect x={206} y={98} width={5} height={52} fill={WHITE} opacity={0.9} />
      <Cone x={246} y={110} />
      <Cone x={246} y={130} />
      <Cone x={246} y={150} />
      <Line x1={98} y1={120} x2={122} y2={120} stroke={WHITE} strokeWidth={3} strokeLinecap="round" opacity={0.85 * p} />
      <Line x1={98} y1={132} x2={122} y2={132} stroke={WHITE} strokeWidth={3} strokeLinecap="round" opacity={0.85 * p} />
      <G transform={`translate(${-36 * (1 - p)} 0)`}>
        <Rect x={140} y={108} width={14} height={6} rx={3} fill={BEAR_LINE} />
        <Rect x={140} y={138} width={14} height={6} rx={3} fill={BEAR_LINE} />
        <Rect x={168} y={108} width={14} height={6} rx={3} fill={BEAR_LINE} />
        <Rect x={168} y={138} width={14} height={6} rx={3} fill={BEAR_LINE} />
        <Rect x={130} y={112} width={64} height={28} rx={11} fill={k.acc} />
        <Rect x={140} y={116} width={7} height={20} rx={2.5} fill={BEAR_LINE} opacity={0.6} />
        <Rect x={167} y={116} width={11} height={20} rx={3} fill={BEAR_LINE} opacity={0.6} />
        <Circle cx={191} cy={118} r={2.5} fill={GOLD} />
        <Circle cx={191} cy={134} r={2.5} fill={GOLD} />
        <Rect x={130} y={117} width={3} height={7} rx={1} fill={RED} />
        <Rect x={130} y={128} width={3} height={7} rx={1} fill={RED} />
      </G>
      <Say x={150} y={190} s="Practice on a calm day" fill={k.muted} />
    </Frame>
  );
}

export const SCENES_E3: Record<string, ComponentType<{ k: Ink }>> = {
  'l12-pulse': Pulse,
  'l12-beats': Beats,
  'l12-vagus': Vagus,
  'l12-handle': Handle,
  'l12-sigh': Sigh,
  'l12-volume': Volume,
  'l12-practice': Practice,
};
