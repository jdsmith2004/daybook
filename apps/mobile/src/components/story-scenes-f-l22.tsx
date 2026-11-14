/* Scenes for lesson 22, told as a story (see story-kit.tsx and story-scenes-f.tsx). */
import { useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { Easing } from 'react-native';
import { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';

import { useAppear, useReducedMotion } from '@/lib/motion';

import { BEAR_LINE, Frame, type Ink, Person, Say } from './story-kit';

const BROWN = '#8A5A2B';
const ROPE = '#B8864A';
const GRAY = '#9AA0AE';
const GOLD = '#FFD25A';
const GOLD_EDGE = '#C98F1A';
const WHITE = '#FFFFFF';
const GREEN = '#3F8F5B';
const YELLOW = '#F2C230';
const RED = '#D93A2B';
const WARM_RED = '#C2410C';

/* the line of words under a picture */
function Cap({ k, s }: { k: Ink; s: string }) {
  return <Say x={150} y={190} s={s} fill={k.ink} />;
}

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

/* a beat that counts 0 to n+1 over and over (all n lit at the end); with Reduce Motion on it stays at n */
function usePulse(n: number, ms: number) {
  const still = useReducedMotion();
  const [ph, setPh] = useState(n);
  useEffect(() => {
    if (still) {
      setPh(n);
      return;
    }
    setPh(0);
    const id = setInterval(() => setPh((p) => (p + 1) % (n + 2)), ms);
    return () => clearInterval(id);
  }, [still, n, ms]);
  return ph;
}

/* a heart, about 22 wide */
function Heart({ x, y, s = 1, fill, edge }: { x: number; y: number; s?: number; fill: string; edge?: string }) {
  return (
    <Path
      transform={`translate(${x} ${y}) scale(${s})`}
      d="M0 7 C-12 -1 -9 -11 -4 -11 C-1.5 -11 0 -9 0 -8 C0 -9 1.5 -11 4 -11 C9 -11 12 -1 0 7 Z"
      fill={fill}
      stroke={edge}
      strokeWidth={edge ? 1.4 / s : 0}
      strokeLinejoin="round"
    />
  );
}

/* a cloud made of puffs; the outline is drawn first so only the outside edge shows */
function Puffs({ x, y, s = 1, fill, edge }: { x: number; y: number; s?: number; fill: string; edge: string }) {
  const puffs: [number, number, number][] = [
    [-30, 2, 15],
    [-12, -8, 19],
    [10, -10, 20],
    [30, 0, 15],
  ];
  const body = (stroke?: string) => (
    <G stroke={stroke} strokeWidth={stroke ? 3.2 / s : 0}>
      <Rect x={-40} y={-2} width={80} height={20} rx={10} fill={fill} />
      {puffs.map(([cx, cy, r]) => (
        <Circle key={cx} cx={cx} cy={cy} r={r} fill={fill} />
      ))}
    </G>
  );
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      {body(edge)}
      {body()}
    </G>
  );
}

/* ---------- 1. the gauge ---------- */
/* a point on a dial that sweeps 240 degrees from the lower left, over the top, to the lower right (t is 0 to 1) */
const dialPt = (cx: number, cy: number, r: number, t: number) => {
  const a = ((210 - 240 * t) * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy - r * Math.sin(a)] as const;
};
function Band({ cx, cy, r, t0, t1, fill }: { cx: number; cy: number; r: number; t0: number; t1: number; fill: string }) {
  const [x0, y0] = dialPt(cx, cy, r, t0);
  const [x1, y1] = dialPt(cx, cy, r, t1);
  return <Path d={`M${x0} ${y0} A${r} ${r} 0 ${(t1 - t0) * 240 > 180 ? 1 : 0} 1 ${x1} ${y1}`} stroke={fill} strokeWidth={11} fill="none" />;
}

function Gauge({ k }: { k: Ink }) {
  const p = useGrow(500, 1300);
  const t = 0.1 + 0.88 * p;
  const cx = 196;
  const cy = 84;
  const [nx, ny] = dialPt(cx, cy, 38, t);
  const ticks = [0, 0.2, 0.4, 0.6, 0.8, 1];
  return (
    <Frame label="A person standing beside a big round pressure gauge on a post. The needle is pushed hard into the red end of the dial, and the person looks up at it, small and worried">
      <Line x1={14} y1={168} x2={286} y2={168} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      <Rect x={190} y={138} width={12} height={30} fill={GRAY} stroke={BEAR_LINE} strokeWidth={1.4} />
      <Rect x={174} y={164} width={44} height={6} rx={3} fill={GRAY} stroke={BEAR_LINE} strokeWidth={1.4} />
      <Circle cx={cx} cy={cy} r={58} fill={GRAY} stroke={BEAR_LINE} strokeWidth={1.6} />
      <Circle cx={cx} cy={cy} r={51} fill={WHITE} stroke={BEAR_LINE} strokeWidth={1.2} />
      <Band cx={cx} cy={cy} r={38} t0={0} t1={0.45} fill={GREEN} />
      <Band cx={cx} cy={cy} r={38} t0={0.45} t1={0.72} fill={YELLOW} />
      <Band cx={cx} cy={cy} r={38} t0={0.72} t1={1} fill={RED} />
      {ticks.map((tt) => {
        const [ax, ay] = dialPt(cx, cy, 45, tt);
        const [bx, by] = dialPt(cx, cy, 48, tt);
        return <Line key={tt} x1={ax} y1={ay} x2={bx} y2={by} stroke={BEAR_LINE} strokeWidth={2} strokeLinecap="round" />;
      })}
      <Line x1={cx} y1={cy} x2={nx} y2={ny} stroke={BEAR_LINE} strokeWidth={3.4} strokeLinecap="round" />
      <Circle cx={cx} cy={cy} r={5.5} fill={BEAR_LINE} />
      <Circle cx={cx} cy={cy} r={1.8} fill={GRAY} />
      <G stroke={BEAR_LINE} strokeWidth={1}>
        <Person x={66} y={168} s={1.3} fill={k.ink} face={k.bg} />
      </G>
      <Path transform="translate(46 98)" d="M0 -6 Q5 1 0 5 Q-5 1 0 -6 Z" fill="#7EC8F2" stroke={BEAR_LINE} strokeWidth={1} />
      <Cap k={k} s="How bad is it, really?" />
    </Frame>
  );
}

/* ---------- 2. two people, two clouds ---------- */
function TwoPeople({ k }: { k: Ink }) {
  const track = (x: number, fillW: number) => (
    <G>
      <Rect x={x} y={152} width={120} height={12} rx={6} fill={k.line} opacity={0.55} />
      <Rect x={x} y={152} width={fillW} height={12} rx={6} fill={k.acc} />
    </G>
  );
  return (
    <Frame label="Two people side by side. Above the left one hangs a big, dark storm cloud with rain; above the right one, a small light cloud. Under each is a bar: the left bar is short and the right bar is long, so less use goes with more hurt">
      <Line x1={14} y1={142} x2={286} y2={142} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      <Puffs x={75} y={46} s={1.15} fill="#454A63" edge={GRAY} />
      <Path d="M82 56 L72 72 L79 72 L74 84 L88 66 L80 66 L86 56 Z" fill={GOLD} stroke={GOLD_EDGE} strokeWidth={1} strokeLinejoin="round" />
      {[52, 62, 96, 106].map((x, i) => (
        <Line key={x} x1={x} y1={70 + (i % 2) * 4} x2={x - 3} y2={80 + (i % 2) * 4} stroke="#7EC8F2" strokeWidth={2.2} strokeLinecap="round" />
      ))}
      <Person x={75} y={142} s={0.95} fill={k.ink} face={k.bg} />
      <Puffs x={225} y={58} s={0.5} fill={WHITE} edge={BEAR_LINE} />
      <Person x={225} y={142} s={0.95} fill={k.acc} face={k.bg} />
      {track(15, 30)}
      {track(165, 112)}
      <Cap k={k} s="Less use, more hurt" />
    </Frame>
  );
}

/* ---------- 3. the gap ---------- */
function Gap({ k }: { k: Ink }) {
  return (
    <Frame label="Two cliffs with a gap between them. On the left a person leans back holding a taut rope. The rope reaches across to a post by a small glowing house with a heart-shaped window on the far cliff">
      <Circle cx={254} cy={84} r={40} fill={GOLD} opacity={0.2} />
      <Path d="M0 100 L96 100 Q104 100 106 108 L112 126 L104 146 L110 172 L0 172 Z" fill={BROWN} stroke={BEAR_LINE} strokeWidth={1.2} />
      <Path d="M0 100 L96 100 Q104 100 106 108 L0 110 Z" fill={GREEN} />
      <Path d="M20 130 L44 126 M60 150 L88 146 M16 156 L36 154" stroke="#6B4420" strokeWidth={2.4} strokeLinecap="round" />
      <Path d="M300 100 L206 100 Q198 100 196 108 L190 128 L198 148 L192 172 L300 172 Z" fill={BROWN} stroke={BEAR_LINE} strokeWidth={1.2} />
      <Path d="M300 100 L206 100 Q198 100 196 108 L300 110 Z" fill={GREEN} />
      <Path d="M270 132 L246 128 M240 152 L214 150 M284 158 L262 156" stroke="#6B4420" strokeWidth={2.4} strokeLinecap="round" />
      <Rect x={242} y={52} width={8} height={14} fill="#B5533C" />
      <Rect x={232} y={74} width={44} height={26} fill="#E9C9A0" stroke={BEAR_LINE} strokeWidth={1.2} />
      <Path d="M226 76 L254 50 L282 76 Z" fill="#B5533C" stroke={BEAR_LINE} strokeWidth={1.2} strokeLinejoin="round" />
      <Heart x={246} y={87} s={0.85} fill={GOLD} edge={GOLD_EDGE} />
      <Rect x={262} y={84} width={9} height={16} rx={2} fill="#7A4B2A" />
      <Rect x={208} y={80} width={5} height={20} fill={BROWN} stroke={BEAR_LINE} strokeWidth={1} />
      <Line x1={84} y1={68} x2={211} y2={80} stroke={ROPE} strokeWidth={3.5} strokeLinecap="round" />
      <Circle cx={211} cy={80} r={3.4} fill="none" stroke={ROPE} strokeWidth={2.4} />
      <G transform="translate(58 100) rotate(-12)">
        <Person x={0} y={0} s={1} fill={k.ink} face={k.bg} />
        <Path d="M12 -30 L32 -26" stroke={k.ink} strokeWidth={5} strokeLinecap="round" fill="none" />
        <Circle cx={32} cy={-26} r={3.6} fill={k.ink} />
      </G>
      <Cap k={k} s="What I do, what I hold" />
    </Frame>
  );
}

/* ---------- 4. the doctors' guidebook ---------- */
function Guide({ k }: { k: Ink }) {
  return (
    <Frame label="A thick open book on a desk with a stethoscope draped over the right page. On the left page is a small tangled knot, on the right page a small heart, with the book's gutter clearly between them">
      <Rect x={14} y={148} width={272} height={10} rx={3} fill={BROWN} stroke={BEAR_LINE} strokeWidth={1.2} />
      <Rect x={30} y={158} width={8} height={14} fill={BROWN} />
      <Rect x={262} y={158} width={8} height={14} fill={BROWN} />
      <Rect x={32} y={52} width={236} height={96} rx={6} fill={k.acc} stroke={BEAR_LINE} strokeWidth={1.4} />
      <Path d="M40 134 L147 140 L147 146 L40 140 Z" fill="#F4F0FF" stroke={BEAR_LINE} strokeWidth={1.2} strokeLinejoin="round" />
      <Path d="M153 140 L260 134 L260 140 L153 146 Z" fill="#F4F0FF" stroke={BEAR_LINE} strokeWidth={1.2} strokeLinejoin="round" />
      <Path d="M42 58 L147 64 L147 140 L42 134 Z" fill={WHITE} stroke={BEAR_LINE} strokeWidth={1.4} strokeLinejoin="round" />
      <Path d="M153 64 L258 58 L258 134 L153 140 Z" fill={WHITE} stroke={BEAR_LINE} strokeWidth={1.4} strokeLinejoin="round" />
      <Rect x={147} y={63} width={6} height={79} fill="#D9D5EE" />
      <Path d="M62 120 L128 123 M62 127 L112 129" stroke="#E3DFF2" strokeWidth={2.4} strokeLinecap="round" />
      <Path d="M172 124 L238 121 M186 130 L238 127" stroke="#E3DFF2" strokeWidth={2.4} strokeLinecap="round" />
      <Path
        d="M72 100 C60 78 112 76 100 98 C90 116 62 96 84 88 C106 80 120 112 94 112 C76 114 70 94 98 92"
        stroke={BEAR_LINE}
        strokeWidth={3.2}
        strokeLinecap="round"
        fill="none"
      />
      <Heart x={205} y={96} s={2.5} fill={WARM_RED} />
      <Path d="M170 136 Q196 156 230 132 Q250 118 262 140" stroke="#2B2F3A" strokeWidth={3.6} strokeLinecap="round" fill="none" />
      <Path d="M170 136 L160 124 M170 136 L174 122" stroke="#2B2F3A" strokeWidth={3} strokeLinecap="round" />
      <Circle cx={160} cy={124} r={2.6} fill={GRAY} stroke={BEAR_LINE} strokeWidth={1} />
      <Circle cx={174} cy={122} r={2.6} fill={GRAY} stroke={BEAR_LINE} strokeWidth={1} />
      <Circle cx={264} cy={142} r={7.5} fill={GRAY} stroke={BEAR_LINE} strokeWidth={1.4} />
      <Circle cx={264} cy={142} r={3.4} fill="#6B7080" />
      <Cap k={k} s="A different pain" />
    </Frame>
  );
}

/* ---------- 5. the alarm ---------- */
function Alarm({ k }: { k: Ink }) {
  const ph = usePulse(3, 380);
  const cx = 150;
  const cy = 22;
  const pt = (r: number, deg: number) => `${cx + r * Math.cos((deg * Math.PI) / 180)} ${cy + r * Math.sin((deg * Math.PI) / 180)}`;
  return (
    <Frame label="A kitchen. A smoke alarm on the ceiling has a red light and big sound waves coming out of it, while below on the stove one small pan holds a single slice of toast and one thin wisp of smoke">
      <Line x1={14} y1={12} x2={286} y2={12} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      {[34, 50, 66].map((r, i) => (
        <G key={r} opacity={i < ph ? 1 : 0.22}>
          <Path d={`M${pt(r, 15)} A${r} ${r} 0 0 1 ${pt(r, 65)}`} stroke={RED} strokeWidth={4.5} strokeLinecap="round" fill="none" />
          <Path d={`M${pt(r, 115)} A${r} ${r} 0 0 1 ${pt(r, 165)}`} stroke={RED} strokeWidth={4.5} strokeLinecap="round" fill="none" />
        </G>
      ))}
      <Path d="M126 13 Q126 34 150 34 Q174 34 174 13 Z" fill={WHITE} stroke={BEAR_LINE} strokeWidth={1.6} strokeLinejoin="round" />
      <Circle cx={150} cy={25} r={6.5} fill={RED} opacity={0.3} />
      <Circle cx={150} cy={25} r={3.4} fill={RED} />
      <Rect x={14} y={134} width={66} height={38} rx={3} fill="#C9965B" stroke={BEAR_LINE} strokeWidth={1.2} />
      <Rect x={220} y={134} width={66} height={38} rx={3} fill="#C9965B" stroke={BEAR_LINE} strokeWidth={1.2} />
      <Line x1={47} y1={140} x2={47} y2={172} stroke={BEAR_LINE} strokeWidth={1.2} opacity={0.5} />
      <Line x1={253} y1={140} x2={253} y2={172} stroke={BEAR_LINE} strokeWidth={1.2} opacity={0.5} />
      <Rect x={80} y={136} width={140} height={36} fill="#7A8092" stroke={BEAR_LINE} strokeWidth={1.2} />
      <Rect x={80} y={130} width={140} height={7} rx={2} fill="#4B4F5E" stroke={BEAR_LINE} strokeWidth={1.2} />
      <Rect x={96} y={146} width={108} height={20} rx={3} fill="#4B4F5E" stroke={BEAR_LINE} strokeWidth={1} />
      <Path d="M153 98 Q144 88 153 80 Q162 72 153 64" stroke={GRAY} strokeWidth={2.4} strokeLinecap="round" fill="none" />
      <Rect x={142} y={102} width={22} height={20} rx={6} fill="#E0B070" stroke="#B07A38" strokeWidth={1.4} />
      <Rect x={146} y={106} width={14} height={13} rx={4} fill="#EBC58B" />
      <Path d="M122 114 L178 114 L174 130 L126 130 Z" fill="#3A3F4D" stroke={GRAY} strokeWidth={1.4} strokeLinejoin="round" />
      <Rect x={178} y={118} width={28} height={5} rx={2.5} fill="#3A3F4D" stroke={GRAY} strokeWidth={1.2} />
      <Cap k={k} s="Loud alarm, small pan" />
    </Frame>
  );
}

/* ---------- 6. two questions, two answers ---------- */
function Split({ k }: { k: Ink }) {
  const ROAD = '#D9B27A';
  const sign = (x: number, art: ReactNode, left: boolean) => (
    <G transform={`translate(${x} 146) scale(0.85) translate(${left ? -79.5 : -220.5} -162)`}>
      <Rect x={left ? 76 : 217} y={136} width={7} height={26} fill={BROWN} stroke={BEAR_LINE} strokeWidth={1.2} />
      <Path
        d={left ? 'M62 112 L98 112 L98 140 L62 140 L52 126 Z' : 'M238 112 L202 112 L202 140 L238 140 L248 126 Z'}
        fill="#C9965B"
        stroke={BEAR_LINE}
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
      {art}
    </G>
  );
  return (
    <Frame label="A road seen from where a person stands at the bottom, running up to a fork where it splits in two, each branch heading off to the horizon, left and right, between green grass. Two wooden signposts stand at the fork: the left sign carries a small notebook, the right sign a small heart">
      <Rect x={10} y={10} width={280} height={60} rx={12} fill="#DCE9F8" />
      <Path d="M10 64 Q60 50 110 62 Q150 52 190 62 Q240 50 290 64 L290 70 L10 70 Z" fill="#5FAF78" />
      <Path d="M10 64 L290 64 L290 160 Q290 172 278 172 L22 172 Q10 172 10 160 Z" fill="#7FBF8E" />
      <Path d="M10 64 Q60 50 110 62 Q150 52 190 62 Q240 50 290 64" stroke="#3F8F5B" strokeWidth={2} fill="none" />
      <Path d="M116 172 L184 172 L164 112 L136 112 Z" fill={ROAD} />
      <Path d="M136 114 Q100 98 44 67 L58 66 Q110 84 150 98 L156 112 Z" fill={ROAD} />
      <Path d="M164 114 Q200 98 256 67 L242 66 Q190 84 150 98 L144 112 Z" fill={ROAD} />
      <Path d="M150 168 L150 120" stroke={WHITE} strokeWidth={2} strokeDasharray="2 9" strokeLinecap="round" opacity={0.7} />
      {sign(
        92,
        <G>
          <Rect x={70} y={116} width={20} height={22} rx={2} fill={WHITE} stroke={BEAR_LINE} strokeWidth={1.2} />
          {[122, 128, 134].map((y) => (
            <Circle key={y} cx={70} cy={y} r={1.5} fill={BEAR_LINE} />
          ))}
          <Path d="M76 123 L86 123 M76 129 L86 129 M76 135 L83 135" stroke={BEAR_LINE} strokeWidth={1.4} strokeLinecap="round" />
        </G>,
        true,
      )}
      {sign(208, <Heart x={220} y={127} s={1.35} fill={WARM_RED} />, false)}
      <G stroke={BEAR_LINE} strokeWidth={1}>
        <Person x={150} y={170} s={0.85} fill={k.ink} face={k.bg} />
      </G>
      <Cap k={k} s="Two questions, two answers" />
    </Frame>
  );
}

/* ---------- 7. tools, and an honest talk ---------- */
function TwoHelps({ k }: { k: Ink }) {
  const chair = (backX: number, seatX: number) => (
    <G>
      <Rect x={backX} y={102} width={5} height={60} fill={BROWN} stroke={BEAR_LINE} strokeWidth={1} />
      <Rect x={seatX} y={140} width={42} height={5} rx={2} fill={BROWN} stroke={BEAR_LINE} strokeWidth={1} />
      <Rect x={seatX + 2} y={145} width={4} height={17} fill={BROWN} />
      <Rect x={seatX + 36} y={145} width={4} height={17} fill={BROWN} />
    </G>
  );
  return (
    <Frame label="Two halves. On the left, an open toolbox with a wrench, a pencil and a small notebook sticking out. On the right, two people sit talking in chairs that face each other, with a warm floor lamp glowing behind them">
      <Line x1={14} y1={162} x2={286} y2={162} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      <Line x1={150} y1={20} x2={150} y2={150} stroke={k.line} strokeWidth={2} strokeDasharray="2 8" strokeLinecap="round" />
      <Rect x={74} y={90} width={22} height={34} rx={2} fill={WHITE} stroke={BEAR_LINE} strokeWidth={1.2} />
      {[98, 106, 114].map((y) => (
        <Circle key={y} cx={74} cy={y} r={1.6} fill={BEAR_LINE} />
      ))}
      <Path d="M80 100 L91 100 M80 107 L91 107" stroke={BEAR_LINE} strokeWidth={1.4} strokeLinecap="round" />
      <G transform="rotate(-14 56 122)">
        <Rect x={53} y={80} width={6} height={44} rx={2} fill={GRAY} stroke={BEAR_LINE} strokeWidth={1.2} />
        <Path
          d="M49 80 L49 70 Q49 64 56 64 Q63 64 63 70 L63 80 L59 80 L59 72 L53 72 L53 80 Z"
          fill={GRAY}
          stroke={BEAR_LINE}
          strokeWidth={1.2}
          strokeLinejoin="round"
        />
      </G>
      <G transform="rotate(16 112 122)">
        <Rect x={108} y={78} width={8} height={46} fill={GOLD} stroke={GOLD_EDGE} strokeWidth={1.2} />
        <Path d="M108 78 L112 68 L116 78 Z" fill="#F0D2A8" stroke={BEAR_LINE} strokeWidth={1.2} strokeLinejoin="round" />
        <Rect x={108} y={78} width={8} height={5} fill="#F7A9B8" />
      </G>
      <Rect x={36} y={120} width={96} height={42} rx={5} fill={WARM_RED} stroke={BEAR_LINE} strokeWidth={1.4} />
      <Rect x={36} y={120} width={96} height={9} rx={4} fill="#8F2E08" />
      <Rect x={78} y={132} width={12} height={9} rx={2} fill={GOLD} stroke={GOLD_EDGE} strokeWidth={1} />
      <Circle cx={215} cy={84} r={44} fill={GOLD} opacity={0.2} />
      <Rect x={213.5} y={72} width={3} height={90} fill={GRAY} stroke={BEAR_LINE} strokeWidth={0.8} />
      <Ellipse cx={215} cy={162} rx={11} ry={3} fill={GRAY} stroke={BEAR_LINE} strokeWidth={0.8} />
      <Path d="M203 72 L227 72 L222 52 L208 52 Z" fill={GOLD} stroke={GOLD_EDGE} strokeWidth={1.4} strokeLinejoin="round" />
      {chair(166, 168)}
      {chair(259, 220)}
      <Person x={186} y={140} s={0.8} fill={k.ink} face={k.bg} />
      <Path d="M190 132 L206 132 L206 160" stroke={k.ink} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <G transform="translate(488 0) scale(-1 1)">
        <Person x={244} y={140} s={0.8} fill={k.acc} face={k.bg} />
        <Path d="M248 132 L264 132 L264 160" stroke={k.acc} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </G>
      <Cap k={k} s="Tools, and an honest talk" />
    </Frame>
  );
}

/* ---------- 8. the compass ---------- */
function Compass({ k }: { k: Ink }) {
  const p = useGrow(300, 1700);
  const a = 65 + (1 - p) * 55 * Math.cos(p * 14);
  const cx = 140;
  const cy = 98;
  const marks = [0, 45, 90, 135, 180, 225, 270, 315];
  return (
    <Frame label="A person holds a large compass out in front of them. Its needle points steadily up and to the right toward a small warm house on a far hill with a lit window, and a dotted path leads from the person toward that house">
      <Path d="M190 172 Q214 70 254 64 Q280 62 300 70 L300 172 Z" fill="#7FBF8E" />
      <Path d="M196 158 Q240 128 300 126 L300 172 L190 172 Z" fill={GREEN} opacity={0.55} />
      <Path d="M190 172 Q214 70 254 64 Q280 62 300 70" stroke={GREEN} strokeWidth={3.4} strokeLinecap="round" fill="none" />
      <Circle cx={254} cy={50} r={26} fill={GOLD} opacity={0.2} />
      <Rect x={262} y={36} width={6} height={10} fill="#B5533C" />
      <Rect x={238} y={46} width={32} height={18} fill="#E9C9A0" stroke={BEAR_LINE} strokeWidth={1.1} />
      <Path d="M234 48 L254 32 L274 48 Z" fill="#B5533C" stroke={BEAR_LINE} strokeWidth={1.1} strokeLinejoin="round" />
      <Rect x={245} y={52} width={8} height={8} rx={1} fill={GOLD} stroke={GOLD_EDGE} strokeWidth={1} />
      <Rect x={258} y={54} width={7} height={10} rx={1.5} fill="#7A4B2A" />
      <Path d="M110 170 Q180 166 214 124 Q236 94 250 68" stroke={k.muted} strokeWidth={3.2} strokeDasharray="1 7" strokeLinecap="round" fill="none" />
      <Line x1={14} y1={172} x2={120} y2={172} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      <Person x={74} y={170} s={1.3} fill={k.ink} face={k.bg} />
      <Path d="M92 132 Q112 150 138 146" stroke={k.ink} strokeWidth={7} strokeLinecap="round" fill="none" />
      <Circle cx={140} cy={145} r={5.5} fill={k.ink} />
      <Rect x={134} y={46} width={12} height={9} rx={2} fill="#C98F3A" stroke={BEAR_LINE} strokeWidth={1.2} />
      <Circle cx={cx} cy={cy} r={46} fill="#C98F3A" stroke={BEAR_LINE} strokeWidth={1.6} />
      <Circle cx={cx} cy={cy} r={39} fill={WHITE} stroke={BEAR_LINE} strokeWidth={1.2} />
      {marks.map((d) => {
        const r = (d * Math.PI) / 180;
        const long = d % 90 === 0;
        return (
          <Line
            key={d}
            x1={cx + 36 * Math.sin(r)}
            y1={cy - 36 * Math.cos(r)}
            x2={cx + (long ? 28 : 31) * Math.sin(r)}
            y2={cy - (long ? 28 : 31) * Math.cos(r)}
            stroke={BEAR_LINE}
            strokeWidth={long ? 2.6 : 1.6}
            strokeLinecap="round"
          />
        );
      })}
      <G transform={`translate(${cx} ${cy}) rotate(${a})`}>
        <Path d="M0 -30 L6.5 0 L-6.5 0 Z" fill={RED} stroke={BEAR_LINE} strokeWidth={1} strokeLinejoin="round" />
        <Path d="M0 30 L6.5 0 L-6.5 0 Z" fill="#C9CDE0" stroke={BEAR_LINE} strokeWidth={1} strokeLinejoin="round" />
      </G>
      <Circle cx={cx} cy={cy} r={3.4} fill={BEAR_LINE} />
      <Cap k={k} s="Pointing at what matters" />
    </Frame>
  );
}

export const SCENES_L22: Record<string, ComponentType<{ k: Ink }>> = {
  'l22-gauge': Gauge,
  'l22-two-people': TwoPeople,
  'l22-gap': Gap,
  'l22-guide': Guide,
  'l22-alarm': Alarm,
  'l22-split': Split,
  'l22-two-helps': TwoHelps,
  'l22-compass': Compass,
};
