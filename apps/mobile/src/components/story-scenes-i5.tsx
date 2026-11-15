/* Scenes for lesson g5, "Asking to be shown" (see story-kit.tsx and story-scenes-f-l31.tsx for the approach): Lot's family led out of the city by two angels, the pillar of
   salt on the road, the three words in Luke, the longing look back, the embers and not the ashes, the shovel set down, the lamp that searches in order to lead, the log
   read as an ask, and then the pilots' side of the lesson: the silent cockpit, the report with its protection, the map of dots that gets a new sign, and the calm plane.
   Lot is always in a brown robe with a gray beard, his wife in plum with a head covering, the two daughters small and in green, and the angels tall in white with a soft
   glow; the burning city is only an orange glow on the horizon. The person in the modern scenes is one neutral traveler in blue. Every figure carries a dark outline so it
   reads on a dark card and a cream one. */
import { type ComponentType, useEffect, useState } from 'react';
import { Easing } from 'react-native';
import { Circle, ClipPath, Defs, Ellipse, G, Path, Polygon, Rect } from 'react-native-svg';

import { useAppear, useReducedMotion } from '@/lib/motion';

import { BEAR_LINE, Frame, type Ink } from './story-kit';

const SKIN = '#E7B98F';
const HAIR = '#3A2A20';
const LOT = '#8A5A2B';
const LOT_D = '#5E3A1A';
const BEARD = '#C9CDD8';
const PLUM = '#7A4FA0';
const PLUM_D = '#4F2D75';
const GREEN = '#2F7A5B';
const GREEN_D = '#1F5A42';
const ANGEL = '#FFFDF4';
const ANGEL_FOLD = '#D9D4C0';
const GLOW = '#FFF3B8';
const GOLD = '#FFD25A';
const GOLD_D = '#C98F1A';
const CREAM = '#FFF5E1';
const WOOD = '#B07A45';
const WOOD_D = '#5E3A1A';
const EDGE = '#8A6A3A';
const SAND = '#EBD3A2';
const SAND_D = '#D2A86A';
const ROAD = '#EFD7A6';
const TRAV = '#4F6FBF';
const ORANGE = '#E5733A';
const FIRE = '#FF9A3C';
const CITY = '#3A2F5E';
const CITY_D = '#2A2148';
const DUSK = '#5B4F8F';
const NIGHT = '#2F2A5E';
const GROUND = '#5E4F82';
const MOUNT = '#7E72AE';
const SALT = '#E6EDF2';
const NAVY = '#2B3A6E';
const SHADOW = '#1B1238';

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

/* thick rounded strokes with one outline around the whole shape */
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
function Hand({ x, y, r = 3.6 }: { x: number; y: number; r?: number }) {
  return <Circle cx={x} cy={y} r={r} fill={SKIN} stroke={BEAR_LINE} strokeWidth={1.2} />;
}

/* the rounded stage every scene stands on: the sky, the ground under it, and a clip so glows stay inside the corners */
const CLIP = 'g5clip';
function Stage({ sky, ground, y }: { sky: string; ground: string; y: number }) {
  return (
    <G>
      <Defs>
        <ClipPath id={CLIP}>
          <Rect x={10} y={10} width={280} height={162} rx={12} />
        </ClipPath>
      </Defs>
      <Rect x={10} y={10} width={280} height={162} rx={12} fill={sky} />
      <Path d={`M10 ${y} L290 ${y} L290 160 Q290 172 278 172 L22 172 Q10 172 10 160 Z`} fill={ground} />
    </G>
  );
}

/* an orange glow on the horizon: soft rings, never flames */
function Glow({ x, y, r, o = 1 }: { x: number; y: number; r: number; o?: number }) {
  return (
    <G clipPath={`url(#${CLIP})`} opacity={o}>
      <Circle cx={x} cy={y} r={r} fill={FIRE} opacity={0.14} />
      <Circle cx={x} cy={y} r={r * 0.74} fill={FIRE} opacity={0.18} />
      <Circle cx={x} cy={y} r={r * 0.48} fill="#FFB86A" opacity={0.28} />
      <Circle cx={x} cy={y} r={r * 0.24} fill="#FFD9A0" opacity={0.4} />
    </G>
  );
}

/* the city, small and dark against its own glow; (x, y) is the left foot of the skyline, about 70 wide */
function Skyline({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  const win = (cx: number, cy: number) => <Rect key={`${cx}-${cy}`} x={cx} y={cy} width={3.2} height={4.4} fill="#FFB05A" stroke="none" />;
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`} stroke={SHADOW} strokeWidth={1.2 / s} strokeLinejoin="round">
      <Rect x={0} y={-30} width={17} height={30} fill={CITY} />
      <Rect x={15} y={-52} width={13} height={52} fill={CITY_D} />
      <Path d="M15 -52 L21.5 -62 L28 -52 Z" fill={CITY_D} />
      <Rect x={26} y={-34} width={22} height={34} fill={CITY} />
      <Path d="M30 -34 Q37 -50 44 -34 Z" fill={CITY_D} />
      <Rect x={46} y={-46} width={13} height={46} fill={CITY_D} />
      <Rect x={57} y={-28} width={15} height={28} fill={CITY} />
      {win(5, -22)}
      {win(19, -40)}
      {win(19, -26)}
      {win(33, -22)}
      {win(50, -34)}
      {win(50, -20)}
      {win(62, -18)}
    </G>
  );
}

/* a mountain, with a pale sunlit side */
function Mountain({ x, y, w, h, fill = MOUNT }: { x: number; y: number; w: number; h: number; fill?: string }) {
  return (
    <G>
      <Path d={`M${x} ${y} L${x + w * 0.45} ${y - h} L${x + w} ${y} Z`} fill={fill} stroke={SHADOW} strokeWidth={1.2} strokeLinejoin="round" />
      <Path
        d={`M${x + w * 0.45} ${y - h} L${x + w * 0.3} ${y - h * 0.55} L${x + w * 0.44} ${y - h * 0.62} L${x + w * 0.52} ${y - h * 0.5} L${x + w * 0.6} ${y - h * 0.66} Z`}
        fill="#C9B8F0"
      />
    </G>
  );
}

/* ---------- the people of Genesis ---------- */
type Kind = 'lot' | 'wife' | 'girl' | 'angel';
const BODY = 'M-13 0 L-9 -33 Q-9 -42 0 -42 Q9 -42 9 -33 L13 0 Z';
const BODY_W = 'M-16 0 L-11 -33 Q-11 -42 0 -42 Q11 -42 11 -33 L16 0 Z';
const BODY_A = 'M-16 0 L-10 -44 Q-10 -55 0 -55 Q10 -55 10 -44 L16 0 Z';
const ROBE: Record<Kind, string> = { lot: LOT, wife: PLUM, girl: GREEN, angel: ANGEL };
const SHOULDER: Record<Kind, number> = { lot: 34, wife: 34, girl: 34, angel: 44 };

/* Lot, his wife, one of the two daughters, or an angel, standing on (x, y), facing right (flip turns them). arms: down, reach (the near arm out in front), or none (the
   scene draws them). */
function Folk({
  x,
  y,
  s = 1,
  kind,
  flip = false,
  arms = 'down',
}: {
  x: number;
  y: number;
  s?: number;
  kind: Kind;
  flip?: boolean;
  arms?: 'down' | 'reach' | 'none';
}) {
  const sw = 1.5 / s;
  const robe = ROBE[kind];
  const sh = -SHOULDER[kind];
  const body = kind === 'angel' ? BODY_A : kind === 'wife' ? BODY_W : BODY;
  const hy = kind === 'angel' ? -63 : -49;
  return (
    <G transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      {kind === 'angel' ? (
        <G>
          <Ellipse cx={0} cy={-36} rx={27} ry={52} fill={GLOW} opacity={0.22} />
          <Ellipse cx={0} cy={-36} rx={20} ry={44} fill={GLOW} opacity={0.26} />
          <Path d="M-6 -48 Q-25 -64 -23 -28 Q-17 -38 -9 -30 Z" fill="#FFFFFF" opacity={0.9} stroke={BEAR_LINE} strokeWidth={sw} strokeLinejoin="round" />
          <Path d="M6 -48 Q25 -64 23 -28 Q17 -38 9 -30 Z" fill="#FFFFFF" opacity={0.9} stroke={BEAR_LINE} strokeWidth={sw} strokeLinejoin="round" />
        </G>
      ) : null}
      <Path d={body} fill={robe} stroke={BEAR_LINE} strokeWidth={sw} strokeLinejoin="round" />
      {kind === 'angel' ? (
        <G>
          <Path d="M-4 -4 L-5 -34 M4 -4 L5 -32" stroke={ANGEL_FOLD} strokeWidth={1.6} strokeLinecap="round" />
          <Path d="M-11 -32 L11 -32" stroke={GOLD_D} strokeWidth={2.6} strokeLinecap="round" />
        </G>
      ) : kind === 'lot' ? (
        <Path d="M-11.5 -20 L11.5 -20" stroke={LOT_D} strokeWidth={3} strokeLinecap="round" />
      ) : kind === 'wife' ? (
        <G>
          <Path d="M-14.4 -4 L14.4 -4" stroke={GOLD} strokeWidth={2} strokeLinecap="round" />
          <Path d="M-11.5 -22 L11.5 -22" stroke={PLUM_D} strokeWidth={3.2} strokeLinecap="round" />
        </G>
      ) : (
        <Path d="M-11 -20 L11 -20" stroke={GREEN_D} strokeWidth={3} strokeLinecap="round" />
      )}
      {arms === 'down' ? (
        <G>
          <Tube fill={robe} parts={[[`M-9 ${sh} L-12 ${sh + 17}`, 5]]} />
          <Tube fill={robe} parts={[[`M9 ${sh} L12 ${sh + 17}`, 5]]} />
          <Hand x={-12} y={sh + 19} />
          <Hand x={12} y={sh + 19} />
        </G>
      ) : arms === 'reach' ? (
        <G>
          <Tube fill={robe} parts={[[`M-9 ${sh} L-12 ${sh + 17}`, 5]]} />
          <Tube fill={robe} parts={[[`M8 ${sh} L28 ${sh - 3}`, 5]]} />
          <Hand x={-12} y={sh + 19} />
          <Hand x={30} y={sh - 3.4} />
        </G>
      ) : null}
      {/* the head */}
      <Circle cx={0} cy={hy} r={8.5} fill={kind === 'angel' ? '#F6D9B8' : SKIN} stroke={BEAR_LINE} strokeWidth={sw} />
      {kind === 'lot' ? (
        <G>
          <Path d="M-8.6 -50 Q-8.4 -59 0 -59 Q8.6 -58.6 8.6 -50 Q4 -54 0 -53.5 Q-5 -54 -8.6 -50 Z" fill={BEARD} stroke={BEAR_LINE} strokeWidth={sw * 0.6} />
          <Path
            d="M-7.6 -48 Q-7.6 -36.5 0 -35.5 Q7.6 -36.5 7.6 -48 Q4 -42.4 0 -42.4 Q-4 -42.4 -7.6 -48 Z"
            fill={BEARD}
            stroke={BEAR_LINE}
            strokeWidth={sw * 0.6}
          />
        </G>
      ) : kind === 'wife' ? (
        <G>
          <Path
            d="M-10 -50 Q-10 -62 0 -62 Q10 -62 10 -50 Q10 -44 12.5 -35 Q0 -30 -12.5 -35 Q-10 -44 -10 -50 Z"
            fill={PLUM_D}
            stroke={BEAR_LINE}
            strokeWidth={sw}
            strokeLinejoin="round"
          />
          <Ellipse cx={3.4} cy={-49} rx={5} ry={6.4} fill={SKIN} stroke={BEAR_LINE} strokeWidth={sw * 0.8} />
          <Path d="M-9.4 -56 Q0 -63 9.4 -56" stroke={GOLD} strokeWidth={1.8} fill="none" strokeLinecap="round" />
        </G>
      ) : kind === 'girl' ? (
        <Path
          d="M-9.6 -49 Q-9.6 -60 0 -60 Q9.6 -60 9.6 -49 Q9.6 -42.5 7.4 -39.5 Q3.4 -46 0 -46.6 Q-3.4 -46 -7.4 -39.5 Q-9.6 -42.5 -9.6 -49 Z"
          fill={GREEN_D}
          stroke={BEAR_LINE}
          strokeWidth={sw * 0.7}
          strokeLinejoin="round"
        />
      ) : (
        <G>
          <Path d="M-8.6 -64 Q-8.4 -73 0 -73 Q8.6 -72.6 8.6 -64 Q4 -68 0 -67.5 Q-5 -68 -8.6 -64 Z" fill="#F3E2A0" stroke={BEAR_LINE} strokeWidth={sw * 0.6} />
          <Ellipse cx={0} cy={-77} rx={8} ry={2.6} fill="none" stroke={GOLD} strokeWidth={1.8} />
        </G>
      )}
      <Circle cx={kind === 'wife' ? 5.4 : 3.8} cy={hy + 0.6} r={1.4} fill={BEAR_LINE} />
    </G>
  );
}

/* the neutral traveler of the modern scenes: a blue robe, dark hair, faces right */
function Man({
  x,
  y,
  s = 1,
  rot = 0,
  flip = false,
  arms = 'down',
}: {
  x: number;
  y: number;
  s?: number;
  rot?: number;
  flip?: boolean;
  arms?: 'down' | 'none';
}) {
  const sw = 1.5 / s;
  return (
    <G transform={`translate(${x} ${y}) rotate(${rot}) scale(${flip ? -s : s} ${s})`}>
      <Path d={BODY} fill={TRAV} stroke={BEAR_LINE} strokeWidth={sw} strokeLinejoin="round" />
      <Path d="M-11 -21 L11 -21" stroke={BEAR_LINE} strokeWidth={2.4} strokeLinecap="round" opacity={0.5} />
      {arms === 'down' ? (
        <G>
          <Tube fill={TRAV} parts={[['M-9 -34 L-12 -17', 5]]} />
          <Tube fill={TRAV} parts={[['M9 -34 L12 -17', 5]]} />
          <Hand x={-12} y={-15} />
          <Hand x={12} y={-15} />
        </G>
      ) : null}
      <Circle cx={0} cy={-49} r={8.5} fill={SKIN} stroke={BEAR_LINE} strokeWidth={sw} />
      <Path d="M-8.6 -50 Q-8.4 -59 0 -59 Q8.6 -58.6 8.6 -50 Q4 -54 0 -53.5 Q-5 -54 -8.6 -50 Z" fill={HAIR} />
      <Circle cx={4} cy={-48} r={1.5} fill={BEAR_LINE} />
    </G>
  );
}

/* ---------- 1. led out by the hand ---------- */
type Fig = { kind: Kind; x: number; s: number };
function Flee() {
  const y = 150;
  const fig: Fig[] = [
    { kind: 'wife', x: 76, s: 0.95 },
    { kind: 'angel', x: 110, s: 1.1 },
    { kind: 'lot', x: 146, s: 1 },
    { kind: 'girl', x: 174, s: 0.68 },
    { kind: 'girl', x: 196, s: 0.62 },
    { kind: 'angel', x: 226, s: 1.1 },
  ];
  /* a clasp of two neighbors: each reaches from the shoulder nearest the other to one shared hand */
  const clasp = (a: Fig, b: Fig, i: number) => {
    const mx = (a.x + b.x) / 2;
    const my = y - 18 * ((a.s + b.s) / 2);
    const [ax, ay] = [a.x + 8 * a.s, y - SHOULDER[a.kind] * a.s];
    const [bx, by] = [b.x - 8 * b.s, y - SHOULDER[b.kind] * b.s];
    return (
      <G key={i}>
        <Tube fill={ROBE[a.kind]} parts={[[`M${ax} ${ay} L${mx} ${my}`, 5 * a.s]]} />
        <Tube fill={ROBE[b.kind]} parts={[[`M${bx} ${by} L${mx} ${my}`, 5 * b.s]]} />
        <Hand x={mx} y={my} r={3.4} />
      </G>
    );
  };
  return (
    <Frame label="At dawn, two tall angels in white lead Lot, with his gray beard and brown robe, his wife in plum, and their two small daughters in green, by the hand out of a city gate, with an orange glow on the horizon behind them and a mountain ahead">
      <Stage sky={DUSK} ground={GROUND} y={146} />
      <Glow x={30} y={118} r={74} />
      <Mountain x={196} y={146} w={104} h={88} />
      <Skyline x={10} y={110} s={1.04} />
      <G stroke={SHADOW} strokeWidth={1.2} strokeLinejoin="round">
        <Rect x={10} y={106} width={52} height={42} fill={CITY} />
        <Path d="M10 106 L10 100 L17 100 L17 106 M25 106 L25 100 L32 100 L32 106 M40 106 L40 100 L47 100 L47 106 M55 106 L55 100 L62 100 L62 106" fill={CITY} />
        <Path d="M26 148 L26 128 Q26 118 36 118 Q46 118 46 128 L46 148 Z" fill="#FFB05A" />
        <Path d="M31 148 L31 130 Q31 124 36 124 Q41 124 41 130 L41 148 Z" fill="#FFE2B0" stroke="none" />
      </G>
      <Path d="M62 150 Q150 140 292 148 L292 156 L62 156 Z" fill={ROAD} opacity={0.55} />
      {[...fig]
        .sort((a, b) => Number(b.kind === 'angel') - Number(a.kind === 'angel'))
        .map((f) => (
          <Folk key={`${f.kind}${f.x}`} x={f.x} y={y} s={f.s} kind={f.kind} arms="none" />
        ))}
      {fig.slice(0, -1).map((f, i) => clasp(f, fig[i + 1], i))}
    </Frame>
  );
}

/* ---------- 2. the pillar of salt ---------- */
function SaltWife({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  const sw = 1.5 / s;
  return (
    <G transform={`translate(${x} ${y}) scale(${-s} ${s})`}>
      <Ellipse cx={0} cy={1} rx={22} ry={4.4} fill={SALT} stroke={BEAR_LINE} strokeWidth={sw} />
      <Path d="M-16 0 L-11 -33 Q-11 -42 0 -42 Q11 -42 11 -33 L16 0 Z" fill={SALT} stroke={BEAR_LINE} strokeWidth={sw} strokeLinejoin="round" />
      <Path d="M8 -34 L21 -40 Q25 -39 23 -35 L9 -26 Z" fill={SALT} stroke={BEAR_LINE} strokeWidth={sw} strokeLinejoin="round" />
      <Path
        d="M-10 -50 Q-10 -62 0 -62 Q10 -62 10 -50 Q10 -44 12.5 -35 Q0 -30 -12.5 -35 Q-10 -44 -10 -50 Z"
        fill={SALT}
        stroke={BEAR_LINE}
        strokeWidth={sw}
        strokeLinejoin="round"
      />
      <Path d="M9.4 -52 Q14.4 -49 10.4 -45.4" fill={SALT} stroke={BEAR_LINE} strokeWidth={sw} strokeLinecap="round" />
      {/* crystal facets: a bright side and a shaded side */}
      <Path d="M-14 -3 L-10 -33 L-4 -41 L-5 -20 Z" fill="#FFFFFF" opacity={0.85} />
      <Path d="M12 -3 L10 -33 L5 -40 L5 -14 Z" fill="#9FB0C6" opacity={0.7} />
      <Path d="M-7 -58 L-3 -61 L-4 -52 Z" fill="#FFFFFF" opacity={0.9} />
      <Path d="M-8 -14 L2 -18 L-2 -8 Z M3 -30 L8 -26 L2 -24 Z" fill="#B9C6D6" opacity={0.7} />
      <Path d="M-14 -40 l2 -4 l2 4 l-2 4 Z M13 -48 l1.6 -3 l1.6 3 l-1.6 3 Z" fill="#FFFFFF" stroke={BEAR_LINE} strokeWidth={0.6} />
    </G>
  );
}
function Salt() {
  const y = 152;
  return (
    <Frame label="On the road away from the city, Lot in his brown robe and his two small daughters in green walk ahead toward the mountain. Behind them stands a pale pillar of salt shaped like his wife, turned back toward the distant, softly glowing city">
      <Stage sky={DUSK} ground={GROUND} y={140} />
      <Glow x={18} y={120} r={70} />
      <Skyline x={12} y={134} s={0.62} />
      <Mountain x={206} y={140} w={92} h={72} />
      <Path d="M10 160 Q80 144 150 150 Q230 156 292 140 L292 158 Q230 170 150 168 Q70 168 10 172 Z" fill={ROAD} opacity={0.5} />
      <SaltWife x={104} y={y} s={1.3} />
      <Folk kind="lot" x={196} y={y - 4} s={0.95} />
      <Folk kind="girl" x={226} y={y - 6} s={0.62} />
      <Folk kind="girl" x={248} y={y - 8} s={0.58} />
    </Frame>
  );
}

/* ---------- 3. three words ---------- */
function Three() {
  const p = useRun(500, 1500);
  const on = (i: number) => Math.max(0, Math.min(1, p * 3.2 - i));
  const glow = 0.18 + 0.1 * Math.sin(p * Math.PI);
  return (
    <Frame label="An open scroll lit by a warm light from above, with three short lines of marks on it, one for each of three words">
      <Stage sky={NIGHT} ground="#3D3470" y={150} />
      <G clipPath={`url(#${CLIP})`}>
        <Polygon points="132,10 168,10 262,160 38,160" fill={GOLD} opacity={glow} />
        <Circle cx={150} cy={96} r={74} fill={GOLD} opacity={0.12} />
      </G>
      {/* the scroll: a page and a roll at each end */}
      <Rect x={72} y={44} width={156} height={104} rx={4} fill={CREAM} stroke={BEAR_LINE} strokeWidth={1.6} />
      <Path d="M72 120 Q150 128 228 120" stroke={SAND_D} strokeWidth={1.6} fill="none" opacity={0.5} />
      <G stroke={BEAR_LINE} strokeWidth={1.6}>
        <Rect x={58} y={36} width={18} height={120} rx={9} fill="#E6CF9E" />
        <Rect x={224} y={36} width={18} height={120} rx={9} fill="#E6CF9E" />
        <Ellipse cx={67} cy={42} rx={5} ry={3.4} fill={SAND_D} />
        <Ellipse cx={233} cy={42} rx={5} ry={3.4} fill={SAND_D} />
      </G>
      <G fill="none" stroke={WOOD_D} strokeWidth={5.5} strokeLinecap="round">
        <Path d="M100 70 L200 70" strokeDasharray="12 7" opacity={on(0)} />
        <Path d="M122 96 L178 96" strokeDasharray="10 7" opacity={on(1)} />
        <Path d="M114 122 L186 122" strokeDasharray="13 7" opacity={on(2)} />
      </G>
    </Frame>
  );
}

/* ---------- 4. the longing look ---------- */
function Longing() {
  const p = useRun(400, 1800);
  const dots = Math.min(1, p * 1.4);
  return (
    <Frame label="Lot's wife in her plum robe stands on the road with her body turned back toward the softly glowing city, one hand reaching back toward it, while the road behind her, running to the mountain, is lit and empty">
      <Stage sky={DUSK} ground={GROUND} y={140} />
      <Glow x={30} y={116} r={92} />
      <Skyline x={14} y={136} s={0.9} />
      <Mountain x={204} y={140} w={96} h={80} />
      {/* the way ahead, lit */}
      <G clipPath={`url(#${CLIP})`}>
        <Circle cx={252} cy={112} r={34} fill={GOLD} opacity={0.18} />
        <Circle cx={252} cy={112} r={18} fill={GOLD} opacity={0.3} />
      </G>
      <Path d="M150 172 L176 152 Q220 128 246 108 L258 112 Q232 140 206 158 L196 172 Z" fill={ROAD} />
      <Path d="M168 160 Q218 130 250 111" stroke={GOLD} strokeWidth={2} strokeDasharray="2 8" strokeLinecap="round" fill="none" />
      {/* the reach back, in dots */}
      <Path d="M98 98 Q70 94 50 104" stroke={FIRE} strokeWidth={3} strokeDasharray="1 7" strokeLinecap="round" fill="none" opacity={dots} />
      <Folk kind="wife" x={140} y={158} s={1.35} flip arms="reach" />
    </Frame>
  );
}

/* ---------- 5. the embers, not the ashes ---------- */
function Embers() {
  const p = useRun(300, 1600);
  const lift = (1 - p) * 10;
  const ex = 176;
  const ey = 84 + lift;
  return (
    <Frame label="A cold fire pit: gray ashes lie in a heap on the left. From the right a hand reaches in and lifts one single glowing ember out, to carry it forward">
      <Stage sky={NIGHT} ground="#4B4278" y={124} />
      {/* the pit */}
      <Ellipse cx={92} cy={144} rx={78} ry={20} fill="#6A6485" stroke={BEAR_LINE} strokeWidth={1.4} />
      <Ellipse cx={92} cy={142} rx={64} ry={14} fill="#2A2542" />
      <G stroke={BEAR_LINE} strokeWidth={1.4} strokeLinejoin="round" fill="#8C86A8">
        <Rect x={22} y={132} width={20} height={11} rx={4} />
        <Rect x={50} y={152} width={22} height={11} rx={4} />
        <Rect x={118} y={153} width={22} height={11} rx={4} />
        <Rect x={146} y={133} width={20} height={11} rx={4} />
      </G>
      {/* the ashes, gray and flat, and a dead black log */}
      <Path
        d="M44 144 Q54 122 76 124 Q92 112 108 126 Q126 126 132 144 Q92 154 44 144 Z"
        fill="#A9A8BC"
        stroke={BEAR_LINE}
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
      <Path d="M58 138 Q74 130 90 134 M86 128 Q102 126 118 136" stroke="#C9C8D8" strokeWidth={2.2} fill="none" strokeLinecap="round" />
      <G stroke={BEAR_LINE} strokeWidth={1.4}>
        <Rect x={62} y={118} width={44} height={8} rx={4} fill="#3A3354" transform="rotate(-10 84 122)" />
      </G>
      <G fill="#C9C8D8" opacity={0.7}>
        <Circle cx={60} cy={104} r={1.6} />
        <Circle cx={94} cy={96} r={1.4} />
        <Circle cx={120} cy={108} r={1.6} />
        <Circle cx={78} cy={84} r={1.2} />
      </G>
      {/* the hand, coming in from the right, and the one ember in it */}
      <G clipPath={`url(#${CLIP})`}>
        <Circle cx={ex} cy={ey} r={30} fill={FIRE} opacity={0.16} />
        <Circle cx={ex} cy={ey} r={20} fill={FIRE} opacity={0.26} />
      </G>
      <Tube fill={TRAV} parts={[[`M298 66 L234 ${80 + lift * 0.4} L${ex + 18} ${ey + 20}`, 11]]} />
      <Circle cx={ex + 12} cy={ey + 17} r={7.4} fill={SKIN} stroke={BEAR_LINE} strokeWidth={1.3} />
      <Path d={`M${ex + 8} ${ey + 12} Q${ex + 2} ${ey + 10} ${ex + 1} ${ey + 6}`} stroke={BEAR_LINE} strokeWidth={5.6} strokeLinecap="round" fill="none" />
      <Path d={`M${ex + 8} ${ey + 12} Q${ex + 2} ${ey + 10} ${ex + 1} ${ey + 6}`} stroke={SKIN} strokeWidth={3} strokeLinecap="round" fill="none" />
      <G transform={`translate(${ex - 2} ${ey - 4}) scale(1.5)`}>
        <Path d="M-8 2 Q0 -12 8 2 Q6 9 0 9 Q-6 9 -8 2 Z" fill="#FF7A2C" stroke={BEAR_LINE} strokeWidth={1} strokeLinejoin="round" />
        <Circle cx={-1} cy={3} r={3.4} fill="#FFE08A" />
      </G>
      <Path d={`M${ex - 16} ${ey - 14} l-4 -4 M${ex - 2} ${ey - 22} l0 -6 M${ex + 12} ${ey - 14} l4 -4`} stroke={GOLD} strokeWidth={2} strokeLinecap="round" />
    </Frame>
  );
}

/* ---------- 6. the shovel set down ---------- */
function Shovel() {
  const p = useRun(300, 1500);
  const walk = 14 * p;
  return (
    <Frame label="On the left, a person digs with a shovel beside a pail and pulls an old box of junk out of the ground. To the right, the same person has set the shovel down upright in the earth and walks away, arms free, lighter">
      <Stage sky="#F7D9A2" ground={SAND_D} y={140} />
      <Circle cx={250} cy={44} r={20} fill={GOLD} opacity={0.35} />
      <Circle cx={250} cy={44} r={12} fill={GOLD} />
      {/* the hole, the box and its old things */}
      <Ellipse cx={128} cy={155} rx={28} ry={7} fill={WOOD_D} />
      <Path d="M172 154 Q182 142 196 152 L196 158 L172 158 Z" fill="#B88A55" stroke={BEAR_LINE} strokeWidth={1.3} strokeLinejoin="round" />
      <G transform="translate(154 153) rotate(-8)">
        <Path d="M-18 -24 Q-22 -38 -10 -38 Q-2 -36 -6 -28 Z" fill="#9AA0B3" stroke={BEAR_LINE} strokeWidth={1.2} strokeLinejoin="round" />
        <Path d="M-12 -34 Q-4 -40 2 -34" stroke={BEAR_LINE} strokeWidth={1.2} fill="none" strokeLinecap="round" />
        <Path d="M10 -24 L22 -36 L26 -30 L16 -24 Z" fill="#7B7F92" stroke={BEAR_LINE} strokeWidth={1.2} strokeLinejoin="round" />
        <Rect x={-2} y={-37} width={10} height={14} rx={2} fill="#B9BDC8" stroke={BEAR_LINE} strokeWidth={1.2} />
        <Rect x={-26} y={-24} width={52} height={26} rx={3} fill={WOOD} stroke={BEAR_LINE} strokeWidth={1.5} />
        <Path d="M-26 -14 L26 -14 M-8 -24 L-8 2 M8 -24 L8 2" stroke={WOOD_D} strokeWidth={1.4} opacity={0.6} />
      </G>
      {/* the digger, the pail and the shovel in the ground */}
      <G stroke={BEAR_LINE} strokeWidth={1.4} strokeLinejoin="round">
        <Path d="M20 152 L24 136 L44 136 L48 152 Z" fill="#9AA0B3" />
        <Path d="M24 136 Q34 122 44 136" fill="none" strokeLinecap="round" />
        <Path d="M22 142 L46 142" stroke="#7B7F92" />
      </G>
      <Man x={70} y={152} s={1.1} rot={12} arms="none" />
      <Tube fill={TRAV} parts={[['M84 120 L98 112', 5]]} />
      <Tube fill={TRAV} parts={[['M82 123 L104 130', 5]]} />
      <Path d="M94 100 L112 152" stroke={BEAR_LINE} strokeWidth={7.4} strokeLinecap="round" />
      <Path d="M94 100 L112 152" stroke={WOOD} strokeWidth={5} strokeLinecap="round" />
      <Path d="M88 98 L100 103" stroke={WOOD_D} strokeWidth={4} strokeLinecap="round" />
      <G transform="translate(113 153) rotate(-19)">
        <Path d="M-7 0 L7 0 L6 12 Q0 17 -6 12 Z" fill="#9AA0B3" stroke={BEAR_LINE} strokeWidth={1.3} strokeLinejoin="round" />
      </G>
      <Hand x={98} y={112} r={3.2} />
      <Hand x={104} y={130} r={3.2} />
      {/* the way on */}
      <Path d="M170 118 Q196 100 222 112" stroke={EDGE} strokeWidth={2} strokeDasharray="2 6" strokeLinecap="round" fill="none" opacity={0.6} />
      <Path d="M214 104 L224 113 L212 118" stroke={EDGE} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.6} />
      <Path d="M205 156 L205 98" stroke={BEAR_LINE} strokeWidth={7.4} strokeLinecap="round" />
      <Path d="M205 150 L205 98" stroke={WOOD} strokeWidth={5} strokeLinecap="round" />
      <Path d="M198 140 L212 140 L210 152 Q205 156 200 152 Z" fill="#9AA0B3" stroke={BEAR_LINE} strokeWidth={1.3} strokeLinejoin="round" />
      <Ellipse cx={205} cy={155} rx={13} ry={3.4} fill="#B88A55" stroke={BEAR_LINE} strokeWidth={1.2} />
      <Path d="M199 96 L211 96" stroke={WOOD_D} strokeWidth={4} strokeLinecap="round" />
      <Man x={236 + walk} y={152} s={1.1} rot={-3} />
      <Path
        d={`M${232 + walk} 82 l-4 -6 M${240 + walk} 78 l0 -7 M${248 + walk} 82 l4 -6`}
        stroke={GOLD_D}
        strokeWidth={2.2}
        strokeLinecap="round"
        opacity={p}
      />
    </Frame>
  );
}

/* ---------- 7. the lamp that searches and leads ---------- */
function Lamp() {
  const p = useRun(300, 1800);
  const reach = 120 + 130 * p;
  const door = (
    <G transform="translate(268 134) scale(1.1)">
      <Circle cx={0} cy={-20} r={26} fill={GOLD} opacity={0.22} />
      <Path d="M-13 0 L-13 -28 Q-13 -41 0 -41 Q13 -41 13 -28 L13 0 Z" fill={GOLD} stroke={BEAR_LINE} strokeWidth={1.4} strokeLinejoin="round" />
      <Path d="M-8 0 L-8 -27 Q-8 -35 0 -35 Q8 -35 8 -27 L8 0 Z" fill="#FFF1B8" />
    </G>
  );
  return (
    <Frame label="A person kneels in a dark room holding up a small oil lamp. Its warm light sweeps gently across the room, showing a chest and a jar, and a lit path leads ahead to a glowing door">
      <Stage sky="#1E1838" ground="#2E2652" y={128} />
      <Path d="M10 128 L290 128" stroke="#4B4278" strokeWidth={1.4} />
      {/* the things in the room, dark until the light reaches them */}
      <G stroke={BEAR_LINE} strokeWidth={1.4} strokeLinejoin="round" fill="#4B4278">
        <Rect x={156} y={106} width={34} height={22} rx={3} />
        <Path d="M156 112 L190 112" />
        <Path d="M120 128 L120 114 Q120 106 128 106 Q136 106 136 114 L136 128 Z" />
        <Rect x={206} y={96} width={14} height={32} rx={2} />
      </G>
      {/* the light: a gentle sweep and a lit path to the door */}
      <G clipPath={`url(#${CLIP})`}>
        <Polygon points={`92,124 ${reach},58 ${reach + 8},150`} fill={GOLD} opacity={0.2} />
        <Polygon points={`92,124 ${reach - 14},84 ${reach - 12},134`} fill={GOLD} opacity={0.16} />
        <Circle cx={92} cy={124} r={34} fill={GOLD} opacity={0.18} />
        <Circle cx={92} cy={124} r={16} fill={GOLD} opacity={0.3} />
      </G>
      <Polygon points="86,170 252,130 282,130 236,170" fill={ROAD} opacity={0.5} />
      <Path d="M120 164 L246 134" stroke={GOLD} strokeWidth={2} strokeDasharray="2 9" strokeLinecap="round" fill="none" opacity={0.8} />
      {door}
      {/* the one kneeling */}
      <G transform="translate(58 158)">
        <Path d="M-22 0 L-18 -14 Q-6 -20 8 -16 L22 0 Z" fill={TRAV} stroke={BEAR_LINE} strokeWidth={1.5} strokeLinejoin="round" />
        <Path d="M-12 -6 L-8 -34 Q-4 -41 4 -40 Q12 -39 12 -30 L12 -8 Z" fill={TRAV} stroke={BEAR_LINE} strokeWidth={1.5} strokeLinejoin="round" />
        <Tube fill={TRAV} parts={[['M6 -32 L24 -30', 5]]} />
        <Hand x={26} y={-30} />
        <Circle cx={6} cy={-48} r={8.5} fill={SKIN} stroke={BEAR_LINE} strokeWidth={1.5} />
        <Path d="M-2.6 -49 Q-2.4 -58 6 -58 Q14.6 -57.6 14.6 -49 Q10 -53 6 -52.5 Q1 -53 -2.6 -49 Z" fill={HAIR} />
        <Circle cx={11} cy={-47} r={1.5} fill={BEAR_LINE} />
        {/* the lamp, in his hand, with its flame */}
        <Path d="M22 -34 Q30 -29 40 -34 L44 -38 L24 -38 Z" fill="#C9964A" stroke={BEAR_LINE} strokeWidth={1.3} strokeLinejoin="round" />
        <Path d="M34 -38 Q30 -46 34 -50 Q39 -45 34 -38 Z" fill="#FFB347" stroke={BEAR_LINE} strokeWidth={1} strokeLinejoin="round" />
        <Circle cx={34} cy={-43} r={1.8} fill="#FFF1B8" />
      </G>
    </Frame>
  );
}

/* ---------- 8. the log, read as an ask ---------- */
function Log() {
  const p = useRun(400, 1200);
  const rows = [38, 60, 82, 104, 126];
  const hot = 2;
  return (
    <Frame label="A phone open to a simple log of days. One day is highlighted, with a small glowing ember beside it, and an arrow leads from the ember to the next step, a stair going up">
      <Stage sky="#F7D9A2" ground={SAND_D} y={150} />
      <Rect x={28} y={14} width={106} height={154} rx={14} fill="#2A2550" stroke={BEAR_LINE} strokeWidth={1.6} />
      <Rect x={34} y={24} width={94} height={136} rx={8} fill={CREAM} />
      <Rect x={68} y={17} width={26} height={4} rx={2} fill="#4B4278" />
      {rows.map((ry, i) => (
        <G key={ry}>
          {i === hot ? <Rect x={38} y={ry - 3} width={86} height={22} rx={6} fill="#FFE08A" stroke={ORANGE} strokeWidth={1.8} /> : null}
          <Circle cx={50} cy={ry + 8} r={4.4} fill={i === hot ? ORANGE : '#C9B58A'} />
          <Rect x={60} y={ry + 4.5} width={i === hot ? 52 : [44, 50, 0, 38, 46][i]} height={7} rx={3.5} fill={i === hot ? WOOD_D : '#D9C9A2'} />
        </G>
      ))}
      {/* the ember beside that day */}
      <G transform={`translate(166 ${93 - 3 * (1 - p)})`}>
        <Circle cx={0} cy={0} r={20} fill={FIRE} opacity={0.18} />
        <Circle cx={0} cy={0} r={12} fill={FIRE} opacity={0.3} />
        <Path d="M-8 2 Q0 -14 8 2 Q6 9 0 9 Q-6 9 -8 2 Z" fill="#FF7A2C" stroke={BEAR_LINE} strokeWidth={1.3} strokeLinejoin="round" />
        <Circle cx={-1} cy={3} r={3.6} fill="#FFE08A" />
      </G>
      <Path d="M126 92 L152 92" stroke={ORANGE} strokeWidth={2} strokeDasharray="2 5" strokeLinecap="round" />
      {/* the arrow, and the next step */}
      <Path d="M186 93 L216 93" stroke={BEAR_LINE} strokeWidth={5} strokeLinecap="round" />
      <Path d="M186 93 L216 93" stroke={WOOD_D} strokeWidth={2.6} strokeLinecap="round" />
      <Path d="M210 85 L220 93 L210 101" stroke={BEAR_LINE} strokeWidth={5.4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d="M210 85 L220 93 L210 101" stroke={WOOD_D} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path
        d="M228 148 L228 132 L246 132 L246 114 L264 114 L264 96 L282 96 L282 148 Z"
        fill="#2FA39A"
        stroke={BEAR_LINE}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <Path d="M228 132 L246 132 M246 114 L264 114 M264 96 L282 96" stroke="#8CE0D6" strokeWidth={2.2} strokeLinecap="round" />
      <Path d="M268 92 L268 74 L282 80 L268 86" fill={GOLD} stroke={BEAR_LINE} strokeWidth={1.3} strokeLinejoin="round" />
    </Frame>
  );
}

/* ---------- the pilots ---------- */
/* an airliner seen from above, nose up, centered on (x, y) */
function PlaneTop({ x, y, s = 1, rot = 0 }: { x: number; y: number; s?: number; rot?: number }) {
  return (
    <G transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} stroke={BEAR_LINE} strokeWidth={1.4 / s} strokeLinejoin="round">
      <Path d="M-30 6 L0 -8 L30 6 L28 12 L0 2 L-28 12 Z" fill="#FFFFFF" />
      <Path d="M-12 24 L0 18 L12 24 L11 28 L0 24 L-11 28 Z" fill="#FFFFFF" />
      <Path d="M-4 -26 Q0 -34 4 -26 L4 26 Q0 30 -4 26 Z" fill="#FFFFFF" />
      <Path d="M-4 -22 L4 -22" stroke="#4A6FD0" strokeWidth={2.4} />
    </G>
  );
}
/* a pilot seen from behind, on (x, y) at the bottom of the picture: a navy jacket with gold bars on the shoulders and a cap. talk: turned to show a worried face */
function PilotBack({ x, y, worried = false }: { x: number; y: number; worried?: boolean }) {
  return (
    <G transform={`translate(${x} ${y})`}>
      <Rect x={-30} y={-96} width={60} height={100} rx={10} fill="#4A5068" stroke={BEAR_LINE} strokeWidth={1.4} />
      <Path d="M-36 0 L-32 -34 Q-30 -46 -14 -50 L14 -50 Q30 -46 32 -34 L36 0 Z" fill={NAVY} stroke={BEAR_LINE} strokeWidth={1.5} strokeLinejoin="round" />
      <Path d="M-8 -50 L0 -40 L8 -50" fill="#F3F5FA" stroke={BEAR_LINE} strokeWidth={1.2} strokeLinejoin="round" />
      <Path d="M-28 -38 L-18 -42 M28 -38 L18 -42" stroke={GOLD} strokeWidth={3.4} strokeLinecap="round" />
      <Circle cx={0} cy={-64} r={14.5} fill={SKIN} stroke={BEAR_LINE} strokeWidth={1.5} />
      {worried ? (
        <G>
          <Path
            d="M-14.4 -64 Q-14.4 -80 0 -80 Q14.4 -80 14.4 -66 Q8 -72 2 -72 Q-6 -72 -14.4 -64 Z"
            fill={NAVY}
            stroke={BEAR_LINE}
            strokeWidth={1.2}
            strokeLinejoin="round"
          />
          <Path d="M-14.4 -66 Q-14.4 -72 -10 -74 L-10 -56 Q-14 -58 -14.4 -66 Z" fill={HAIR} />
          <Circle cx={4} cy={-64} r={1.6} fill={BEAR_LINE} />
          <Circle cx={10} cy={-64} r={1.6} fill={BEAR_LINE} />
          <Path d="M1 -67 L7 -70.4 M13 -67 L9 -70.4" stroke={BEAR_LINE} strokeWidth={1.4} strokeLinecap="round" />
          <Path d="M3 -55 Q7 -57 11 -55" stroke={BEAR_LINE} strokeWidth={1.4} fill="none" strokeLinecap="round" />
          <Path d="M17 -72 Q20 -66 17 -64 Q14 -66 17 -72 Z" fill="#9FD4F0" stroke={BEAR_LINE} strokeWidth={0.9} strokeLinejoin="round" />
        </G>
      ) : (
        <G>
          <Path
            d="M-14.4 -64 Q-15 -80 0 -80 Q15 -80 14.4 -64 Q12 -70 0 -70 Q-12 -70 -14.4 -64 Z"
            fill={NAVY}
            stroke={BEAR_LINE}
            strokeWidth={1.2}
            strokeLinejoin="round"
          />
          <Path
            d="M-14.4 -66 Q-14.4 -50 -8 -49 L8 -49 Q14.4 -50 14.4 -66 Q14.4 -72 0 -72 Q-14.4 -72 -14.4 -66 Z"
            fill={HAIR}
            stroke={BEAR_LINE}
            strokeWidth={1.2}
          />
          <Ellipse cx={-14.4} cy={-62} rx={2.6} ry={3.6} fill={SKIN} stroke={BEAR_LINE} strokeWidth={1} />
          <Ellipse cx={14.4} cy={-62} rx={2.6} ry={3.6} fill={SKIN} stroke={BEAR_LINE} strokeWidth={1} />
        </G>
      )}
    </G>
  );
}
function Cockpit() {
  const p = useRun(500, 1400);
  const ring = 24 + 3 * Math.sin(p * Math.PI * 2);
  return (
    <Frame label="The inside of an airliner cockpit. Through the windshield, another plane passes dangerously close, circled in red. Two pilots sit in front of the controls: the one on the left looks worried and sweats and does not speak, shown by a bubble with only three dots, while the one on the right looks calmly ahead">
      <Stage sky="#8EC9EE" ground="#2F3347" y={118} />
      <Ellipse cx={64} cy={42} rx={26} ry={9} fill="#FFFFFF" opacity={0.8} />
      <Ellipse cx={92} cy={46} rx={18} ry={7} fill="#FFFFFF" opacity={0.8} />
      <Circle cx={214} cy={54} r={ring} fill="#E5405A" opacity={0.14} />
      <Circle cx={214} cy={54} r={ring} fill="none" stroke="#E5405A" strokeWidth={2.4} strokeDasharray="5 4" strokeLinecap="round" />
      <PlaneTop x={214} y={54} s={0.66} rot={-18} />
      {/* the frame of the windshield */}
      <Rect x={10} y={10} width={280} height={18} rx={0} fill="#3A3F55" />
      <Rect x={146} y={26} width={8} height={94} fill="#3A3F55" />
      <Path d="M10 22 L10 118 L28 118 L22 22 Z M290 22 L290 118 L272 118 L278 22 Z" fill="#3A3F55" />
      <Path d="M10 10 L290 10 L290 28 L10 28 Z" fill="none" stroke={BEAR_LINE} strokeWidth={1.2} />
      {/* the panel: a few gauges and a screen */}
      <G stroke={BEAR_LINE} strokeWidth={1.2}>
        <Rect x={118} y={128} width={64} height={22} rx={3} fill="#7FD6E8" />
        <Circle cx={36} cy={138} r={8} fill={CREAM} />
        <Circle cx={60} cy={146} r={6} fill={CREAM} />
        <Circle cx={240} cy={138} r={8} fill={CREAM} />
        <Circle cx={264} cy={146} r={6} fill={CREAM} />
        <Path d="M36 138 L40 133 M240 138 L244 133" strokeWidth={1.6} strokeLinecap="round" />
      </G>
      <G clipPath={`url(#${CLIP})`}>
        <PilotBack x={84} y={176} worried />
        <PilotBack x={216} y={176} />
      </G>
      {/* the silence: a bubble with only dots */}
      <G transform="translate(86 52)">
        <Path
          d="M-22 -14 L22 -14 Q28 -14 28 -8 L28 8 Q28 14 22 14 L6 14 L-2 22 L-4 14 L-22 14 Q-28 14 -28 8 L-28 -8 Q-28 -14 -22 -14 Z"
          fill="#FFFFFF"
          stroke={BEAR_LINE}
          strokeWidth={1.4}
          strokeLinejoin="round"
        />
        <Circle cx={-11} cy={0} r={3} fill={BEAR_LINE} />
        <Circle cx={0} cy={0} r={3} fill={BEAR_LINE} />
        <Circle cx={11} cy={0} r={3} fill={BEAR_LINE} />
      </G>
    </Frame>
  );
}

/* a pilot seen from the side, at a desk, writing: faces right */
function PilotSide({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  const sw = 1.5 / s;
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Path d={BODY} fill={NAVY} stroke={BEAR_LINE} strokeWidth={sw} strokeLinejoin="round" />
      <Path d="M-5 -42 L0 -31 L5 -42" fill="#F3F5FA" stroke={BEAR_LINE} strokeWidth={sw * 0.8} strokeLinejoin="round" />
      <Circle cx={0} cy={-49} r={8.5} fill={SKIN} stroke={BEAR_LINE} strokeWidth={sw} />
      <Path d="M-9 -52 Q-9 -64 0 -64 Q9 -64 9 -52 Z" fill={NAVY} stroke={BEAR_LINE} strokeWidth={sw} strokeLinejoin="round" />
      <Path d="M0 -53 L13 -53" stroke={BEAR_LINE} strokeWidth={2.4} strokeLinecap="round" />
      <Circle cx={0} cy={-58} r={1.8} fill={GOLD} />
      <Circle cx={4} cy={-48} r={1.5} fill={BEAR_LINE} />
    </G>
  );
}
function Report() {
  return (
    <Frame label="A pilot at a desk fills in a simple form, lines and boxes with no words. Beside it lies a blue envelope, and above the envelope floats a shield with a check mark, the promise of protection">
      <Stage sky="#EAD0A0" ground={WOOD} y={118} />
      <Rect x={10} y={22} width={280} height={8} fill="#2FA39A" opacity={0.7} />
      <PilotSide x={80} y={124} s={1.4} />
      <Path d="M10 118 L290 118 L290 160 Q290 172 278 172 L22 172 Q10 172 10 160 Z" fill={WOOD} />
      <Path d="M10 118 L290 118 L290 126 L10 126 Z" fill="#C98E5A" />
      {/* the form: lines, a few boxes, a signature */}
      <Polygon points="104,130 178,130 192,164 92,164" fill={CREAM} stroke={BEAR_LINE} strokeWidth={1.5} strokeLinejoin="round" />
      <G stroke={EDGE} strokeWidth={2} strokeLinecap="round" opacity={0.65}>
        <Path d="M112 138 L170 138 M110 146 L176 146 M108 153 L160 153" />
      </G>
      <G fill="none" stroke={EDGE} strokeWidth={1.2} opacity={0.8}>
        <Rect x={150} y={150} width={7} height={6} />
        <Rect x={162} y={150} width={7} height={6} />
      </G>
      <Path d="M112 159 q6 -6 10 0 t10 0 t10 0" stroke={WOOD_D} strokeWidth={1.4} fill="none" strokeLinecap="round" />
      {/* his arm, down to the pen */}
      <Tube fill={NAVY} parts={[['M93 78 L110 106 L126 136', 6.4]]} />
      <Path d="M127 138 L133 150" stroke={BEAR_LINE} strokeWidth={2.2} strokeLinecap="round" />
      <Hand x={126} y={137} r={3.6} />
      {/* the envelope */}
      <Rect x={206} y={134} width={62} height={34} rx={3} fill="#4F8FE8" stroke={BEAR_LINE} strokeWidth={1.6} />
      <Path d="M206 135 L237 154 L268 135" stroke={BEAR_LINE} strokeWidth={1.6} fill="none" strokeLinejoin="round" />
      <Path d="M206 167 L228 148 M268 167 L246 148" stroke="#BFD7F0" strokeWidth={1.4} strokeLinecap="round" />
      <Circle cx={237} cy={154} r={6} fill="#FFFFFF" stroke={BEAR_LINE} strokeWidth={1.2} />
      {/* the shield */}
      <Circle cx={238} cy={86} r={34} fill={GOLD} opacity={0.22} />
      <G transform="translate(238 88)">
        <Path d="M0 -28 L22 -20 Q22 8 0 28 Q-22 8 -22 -20 Z" fill="#2B5FD9" stroke={BEAR_LINE} strokeWidth={1.8} strokeLinejoin="round" />
        <Path d="M0 -22 L16 -16 Q16 5 0 21 Q-16 5 -16 -16 Z" fill="#4F8FE8" />
        <Path d="M-8 -1 L-2 6 L9 -9" stroke="#FFFFFF" strokeWidth={4.4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </G>
    </Frame>
  );
}

/* ---------- 11. the map of dots ---------- */
function MapScene() {
  const p = useRun(500, 1200);
  const e = 1 - (1 - p) * (1 - p);
  const drop = (1 - e) * -22;
  const dots: [number, number][] = [
    [200, 110],
    [207, 114],
    [213, 108],
    [204, 120],
    [212, 120],
    [198, 126],
    [208, 128],
    [216, 126],
    [202, 134],
    [211, 135],
    [196, 116],
    [218, 116],
    [206, 124],
    [200, 140],
    [214, 142],
  ];
  return (
    <Frame label="A simple airport map seen from above, with a long runway and a taxiway crossing it. Many small orange dots, one for each mistake reported, are clustered at one corner where the taxiway meets the runway, and a new yellow sign is being set down right there">
      <Stage sky="#6FA88A" ground="#6FA88A" y={172} />
      {/* the runway and the way across */}
      <Rect x={22} y={70} width={256} height={26} rx={4} fill="#4A4F5E" stroke={BEAR_LINE} strokeWidth={1.4} />
      <Path d="M32 83 L268 83" stroke="#FFFFFF" strokeWidth={2.4} strokeDasharray="12 8" />
      <Rect x={190} y={96} width={26} height={72} fill="#5A6074" stroke={BEAR_LINE} strokeWidth={1.4} />
      <Rect x={60} y={96} width={20} height={72} fill="#5A6074" stroke={BEAR_LINE} strokeWidth={1.4} />
      <Path d="M203 100 L203 164 M70 100 L70 164" stroke={GOLD} strokeWidth={1.6} strokeDasharray="6 6" opacity={0.8} />
      <Rect x={24} y={142} width={36} height={22} rx={3} fill="#B9C6D6" stroke={BEAR_LINE} strokeWidth={1.3} />
      <Rect x={28} y={146} width={28} height={6} fill="#7FB3D6" />
      {/* the dots: one report each */}
      <Circle cx={207} cy={124} r={32} fill={ORANGE} opacity={0.18} />
      <G fill={ORANGE} stroke={BEAR_LINE} strokeWidth={0.9}>
        {dots.map(([cx, cy]) => (
          <Circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={3.4} />
        ))}
      </G>
      {/* the new sign, setting down beside the corner */}
      <G transform={`translate(250 ${152 + drop})`}>
        <Path d="M0 0 L0 -30" stroke={BEAR_LINE} strokeWidth={5.6} strokeLinecap="round" />
        <Path d="M0 0 L0 -30" stroke="#8A6A3A" strokeWidth={2.8} strokeLinecap="round" />
        <Rect x={-17} y={-52} width={34} height={24} rx={4} fill="#FFD25A" stroke={BEAR_LINE} strokeWidth={1.8} />
        <Path d="M-8 -40 L4 -40 M-1 -46 L7 -40 L-1 -34" stroke={BEAR_LINE} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </G>
      <Path d="M240 150 Q232 144 226 146" stroke={BEAR_LINE} strokeWidth={1.4} strokeDasharray="2 5" strokeLinecap="round" fill="none" opacity={0.5} />
    </Frame>
  );
}

/* ---------- 12. the calm plane ---------- */
function Cloud({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <G fill="#9AB0D0" stroke="#9AB0D0" strokeWidth={2.4}>
        <Circle cx={0} cy={0} r={14} />
        <Circle cx={20} cy={-8} r={18} />
        <Circle cx={44} cy={-2} r={15} />
        <Circle cx={62} cy={4} r={11} />
      </G>
      <G fill="#FFFFFF">
        <Circle cx={0} cy={0} r={14} />
        <Circle cx={20} cy={-8} r={18} />
        <Circle cx={44} cy={-2} r={15} />
        <Circle cx={62} cy={4} r={11} />
        <Rect x={-14} y={0} width={86} height={14} rx={7} />
      </G>
    </G>
  );
}
function PlaneScene() {
  const p = useRun(200, 2200);
  const e = 1 - (1 - p) * (1 - p);
  const dx = -34 * (1 - e);
  return (
    <Frame label="A calm airliner flies steadily through a clear blue sky above a bed of soft white clouds">
      <Stage sky="#8EC9EE" ground="#8EC9EE" y={172} />
      <Circle cx={248} cy={44} r={26} fill={GOLD} opacity={0.3} />
      <Circle cx={248} cy={44} r={15} fill={GOLD} />
      <G clipPath={`url(#${CLIP})`}>
        <Cloud x={34} y={148} s={1.2} />
        <Cloud x={190} y={154} s={1.1} />
      </G>
      <G transform={`translate(${150 + dx} 88)`}>
        <G stroke={BEAR_LINE} strokeWidth={1.6} strokeLinejoin="round">
          <Path d="M-8 4 L26 22 L32 22 L16 2 Z" fill="#DDE6F2" />
          <Path d="M-56 -6 L-70 -34 L-58 -34 L-38 -6 Z" fill="#2F5FD0" />
          <Path d="M-8 -4 L24 -26 L30 -26 L18 -2 Z" fill="#EAF0F8" />
          <Path d="M-70 -2 Q-74 -4 -60 -10 L50 -10 Q66 -8 78 2 Q66 10 50 12 L-56 12 Q-72 10 -70 -2 Z" fill="#FFFFFF" />
          <Ellipse cx={14} cy={20} rx={8} ry={4.6} fill="#C9D3E3" />
        </G>
        <Path d="M-62 7 L66 7" stroke="#2F5FD0" strokeWidth={2.6} strokeLinecap="round" />
        <G fill="#8EC9EE" stroke={BEAR_LINE} strokeWidth={0.8}>
          {[-40, -28, -16, -4, 8, 20, 32].map((wx) => (
            <Circle key={wx} cx={wx} cy={-2} r={2.4} />
          ))}
          <Path d="M56 -5 L66 -5 Q70 -3 72 0 L56 0 Z" />
        </G>
      </G>
    </Frame>
  );
}

export const SCENES_I5: Record<string, ComponentType<{ k: Ink }>> = {
  'g5-flee': Flee,
  'g5-salt': Salt,
  'g5-three': Three,
  'g5-longing': Longing,
  'g5-embers': Embers,
  'g5-shovel': Shovel,
  'g5-lamp': Lamp,
  'g5-log': Log,
  'g5-cockpit': Cockpit,
  'g5-report': Report,
  'g5-map': MapScene,
  'g5-plane': PlaneScene,
};
