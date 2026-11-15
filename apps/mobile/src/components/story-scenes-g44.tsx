/* Scenes for lesson 44 told as a story (see story-kit.tsx): "Play it forward". The tale of lesson 41 goes on: Candlewick, the boy
   who says nothing matters, the night coach, the stable, and the hour after kept in the dark. Drawn after Collodi's book of 1883,
   on its own, with no film in mind. No fire for the urge: Candlewick has a small curl of brown hair, and the lamps are round bulbs. */
import { useEffect, useState, type ComponentType } from 'react';
import { Easing } from 'react-native';
import { Circle, ClipPath, Defs, Ellipse, G, Line, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { useAppear, useReducedMotion } from '@/lib/motion';

import { BEAR_LINE, Frame, type Ink, Person, Say } from './story-kit';

/* the same colors as lesson 41 (story-scenes-d.tsx) */
const L44_BROWN = '#8A5A2B';
const L44_GRAY = '#9AA0AE';
const L44_GOLD = '#FFD25A';
const L44_WHITE = '#FFFFFF';
const L44_GREEN = '#3F8F5B';
const L44_CAP = '#E8A92A';
const L44_DONKEY_DARK = '#7D8396';
const L44_WICK_BODY = '#6F8FC7';
const L44_WICK_ARM = '#5878B0';
const L44_WICK_FACE = '#26304F';
const L44_NIGHT = '#1D1A3B';
const L44_DEEP = '#13102A';
const L44_FAINT = '#3A3570';
const L44_PALE = '#D6D1F0';

/* a number from 0 to 1 that eases up once, after a short pause; with Reduce Motion on it starts at 1 */
function L44useGrow(delay = 300, dur = 1200) {
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
function L44Cap({ k, s }: { k: Ink; s: string }) {
  return <Say x={150} y={190} s={s} fill={k.ink} />;
}

/* Pinocchio as in lesson 41: a boy in the lesson's accent, a gold cap and a short wooden nose. `dir` -1 faces left. */
function L44Pino({ x, y, s = 1, dir = 1, fill, face }: { x: number; y: number; s?: number; dir?: 1 | -1; fill: string; face: string }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s * dir} ${s})`}>
      <Person x={0} y={0} s={1} fill={fill} face={face} />
      <Path d="M10 -47 L18 -45.4 L10 -43.6 Z" fill={L44_BROWN} />
      <Path d="M-12.5 -50 Q-12.5 -64 0 -64 Q12.5 -64 12.5 -50 Z" fill={L44_CAP} />
      <Rect x={3} y={-53} width={15} height={3.6} rx={1.8} fill={L44_CAP} />
    </G>
  );
}

/* Candlewick: the same body style as Pinocchio and the lesson 41 boys (the kit's Person shape), stretched taller and slimmer, in a soft
   muted blue, with relaxed half-closed eyes, an easy smile and a small curl of brown hair (hair, never a flame). He is likeable and lazy.
   pose: pocket (hands in pockets), shrug (elbows out, hands still in pockets) or beckon (one arm waving you on). Origin at the feet, facing right. */
function L44Wick({
  x,
  y,
  s = 1,
  dir = 1,
  pose = 'pocket',
  lean = 0,
}: {
  x: number;
  y: number;
  s?: number;
  dir?: 1 | -1;
  pose?: 'pocket' | 'shrug' | 'beckon';
  lean?: number;
}) {
  const arm = L44_WICK_ARM;
  return (
    <G transform={`translate(${x} ${y}) scale(${s * dir} ${s}) rotate(${lean})`}>
      <Path transform="scale(0.78 1.6)" d="M-17 0 L-17 -16 Q-17 -33 0 -33 Q17 -33 17 -16 L17 0 Z" fill={L44_WICK_BODY} />
      <G stroke={arm} strokeWidth={4.2} strokeLinecap="round" fill="none">
        {pose === 'pocket' ? (
          <G>
            <Path d="M-11 -49 Q-17 -37 -7 -27" />
            <Path d="M11 -49 Q17 -37 7 -27" />
          </G>
        ) : null}
        {pose === 'shrug' ? (
          <G>
            <Path d="M-11 -50 Q-23 -41 -7 -27" />
            <Path d="M11 -50 Q23 -41 7 -27" />
          </G>
        ) : null}
        {pose === 'beckon' ? (
          <G>
            <Path d="M11 -50 Q23 -55 27 -68" />
            <Path d="M-11 -49 Q-17 -37 -7 -27" />
          </G>
        ) : null}
      </G>
      {pose === 'beckon' ? <Circle cx={27.4} cy={-70} r={3.4} fill={L44_WICK_BODY} /> : null}
      <Circle cx={0} cy={-66} r={10.5} fill={L44_WICK_BODY} />
      <Path d="M-10 -67 Q-10 -77 0 -77 Q10 -77 10 -67 Q4 -72 -10 -67 Z" fill={L44_BROWN} />
      <Path d="M-1 -76.4 Q-3 -85 3 -84.6 Q8 -84 5 -79.6" stroke={L44_BROWN} strokeWidth={2.6} strokeLinecap="round" fill="none" />
      <Path d="M2.2 -66.4 Q4.6 -64.4 7 -66.4" stroke={L44_WICK_FACE} strokeWidth={1.5} strokeLinecap="round" fill="none" />
      <Path d="M1.6 -61.4 Q5.4 -58.6 9 -61.8" stroke={L44_WICK_FACE} strokeWidth={1.4} strokeLinecap="round" fill="none" />
    </G>
  );
}

/* a small round-roofed cottage, lit or dark */
function L44House({ x, y, w, h, wall, roof, win }: { x: number; y: number; w: number; h: number; wall: string; roof: string; win: string }) {
  return (
    <G>
      <Rect x={x} y={y - h} width={w} height={h} fill={wall} />
      <Path d={`M${x - w * 0.12} ${y - h + 1} L${x + w / 2} ${y - h - h * 0.62} L${x + w * 1.12} ${y - h + 1} Z`} fill={roof} />
      <Rect x={x + w * 0.3} y={y - h * 0.68} width={w * 0.28} height={h * 0.34} rx={1.2} fill={win} />
    </G>
  );
}

/* ---------- 1. Candlewick: nothing matters ---------- */
function L44WickScene({ k }: { k: Ink }) {
  return (
    <Frame label="Pinocchio and a tall, slim, easygoing boy in blue with a small curl of hair stands beside Pinocchio outside a little schoolhouse, hands in his pockets, giving a lazy shrug">
      <Path d="M-10 166 Q60 140 130 156 Q210 172 310 146 L310 172 L-10 172 Z" fill={k.soft} />
      <Rect x={16} y={122} width={6} height={44} fill={L44_BROWN} />
      <Circle cx={19} cy={108} r={21} fill={L44_GREEN} />
      <Circle cx={30} cy={118} r={13} fill={L44_GREEN} opacity={0.8} />
      <Path d="M168 100 L228 64 L288 100 Z" fill="#B5654A" />
      <Rect x={176} y={98} width={104} height={68} fill={k.soft} stroke={k.line} strokeWidth={1.5} />
      <Rect x={216} y={44} width={24} height={20} rx={3} fill={L44_BROWN} />
      <Path d="M222 64 L222 52 Q228 46 234 52 L234 64 Z" fill={L44_GOLD} />
      <Rect x={216} y={128} width={24} height={38} rx={3} fill={L44_BROWN} />
      <Circle cx={235} cy={148} r={1.6} fill={L44_GOLD} />
      {[188, 250].map((wx) => (
        <G key={wx}>
          <Rect x={wx} y={112} width={20} height={20} rx={3} fill="#FFF1C4" stroke={L44_BROWN} strokeWidth={1.6} />
          <Path d={`M${wx + 10} 112 L${wx + 10} 132 M${wx} 122 L${wx + 20} 122`} stroke={L44_BROWN} strokeWidth={1.4} />
        </G>
      ))}
      <Rect x={210} y={166} width={36} height={5} rx={2} fill={k.line} />
      <Line x1={10} y1={166} x2={290} y2={166} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      <L44Pino x={68} y={166} s={1.15} fill={k.acc} face={k.bg} />
      <L44Wick x={124} y={166} s={1.3} pose="shrug" lean={4} />
      <L44Cap k={k} s="Candlewick: nothing matters" />
    </Frame>
  );
}

/* ---------- 2. the coach at night ---------- */
function L44CoachScene({ k }: { k: Ink }) {
  const stars: [number, number, number][] = [
    [30, 22, 1.4],
    [64, 48, 1.1],
    [102, 20, 1.5],
    [150, 40, 1.1],
    [196, 18, 1.3],
    [226, 52, 1.1],
    [286, 62, 1.2],
  ];
  return (
    <Frame label="On a night road, Pinocchio stops at the roadside and half turns back toward a tiny lit house on a far hill, while Candlewick, the tall slim boy in blue, stands on the step of the waiting coach and waves him on">
      <Defs>
        <ClipPath id="l44cn">
          <Rect x={0} y={0} width={300} height={172} rx={14} />
        </ClipPath>
      </Defs>
      <G clipPath="url(#l44cn)">
        <Rect x={0} y={0} width={300} height={172} fill={L44_NIGHT} />
        {stars.map(([sx, sy, r]) => (
          <Circle key={sx} cx={sx} cy={sy} r={r} fill="#E8E4F5" opacity={0.85} />
        ))}
        <Circle cx={262} cy={32} r={22} fill="#F1E8C8" opacity={0.12} />
        <Circle cx={262} cy={32} r={11} fill="#F1E8C8" />
        <Ellipse cx={36} cy={158} rx={78} ry={46} fill="#2A2650" />
        <Circle cx={37} cy={118} r={16} fill={L44_GOLD} opacity={0.2} />
        <L44House x={28} y={126} w={20} h={13} wall="#3A3566" roof="#4A4580" win={L44_GOLD} />
        <Rect x={0} y={148} width={300} height={24} fill="#34305A" />
        <Path
          d="M10 160 L40 160 M70 160 L100 160 M130 160 L160 160 M190 160 L220 160 M250 160 L280 160"
          stroke="#4A4580"
          strokeWidth={2}
          strokeLinecap="round"
        />
        {/* the coach, as in lesson 41 */}
        <Line x1={212} y1={124} x2={236} y2={124} stroke={L44_BROWN} strokeWidth={3} strokeLinecap="round" />
        <G transform="translate(262 156) scale(0.8)">
          <Ellipse cx={0} cy={-20} rx={18} ry={9} fill={L44_DONKEY_DARK} />
          <Path d="M10 -26 L16 -38 L23 -34 L17 -20 Z" fill={L44_DONKEY_DARK} />
          <Ellipse cx={23} cy={-35} rx={8.5} ry={5} fill={L44_DONKEY_DARK} transform="rotate(20 23 -35)" />
          <Rect x={-12} y={-14} width={4.6} height={14} fill="#5C6176" />
          <Rect x={8} y={-14} width={4.6} height={14} fill="#5C6176" />
        </G>
        <G transform="translate(240 158) scale(0.95)">
          {[-12, -7, 7, 12].map((lx) => (
            <Rect key={lx} x={lx - 2.3} y={-14} width={4.6} height={14} fill={L44_DONKEY_DARK} />
          ))}
          <Ellipse cx={0} cy={-20} rx={18} ry={9} fill={L44_GRAY} />
          <Path d="M10 -26 L16 -38 L23 -34 L17 -20 Z" fill={L44_GRAY} />
          <Ellipse cx={23} cy={-35} rx={8.5} ry={5} fill={L44_GRAY} transform="rotate(20 23 -35)" />
          <Ellipse cx={30} cy={-32} rx={3.6} ry={3.2} fill="#D9D9E3" />
          <Ellipse cx={17} cy={-45} rx={2.6} ry={7} fill={L44_DONKEY_DARK} transform="rotate(-10 17 -45)" />
          <Ellipse cx={22} cy={-45} rx={2.6} ry={7} fill={L44_GRAY} transform="rotate(14 22 -45)" />
          <Circle cx={25} cy={-37} r={1.2} fill={BEAR_LINE} />
        </G>
        <Rect x={138} y={94} width={76} height={46} rx={8} fill={k.acc} />
        <Rect x={134} y={88} width={84} height={8} rx={4} fill={L44_GOLD} />
        <Rect x={148} y={104} width={20} height={18} rx={3} fill={L44_GOLD} opacity={0.85} />
        <Rect x={182} y={104} width={20} height={18} rx={3} fill={L44_GOLD} opacity={0.85} />
        {[158, 198].map((cx) => (
          <G key={cx}>
            <Circle cx={cx} cy={142} r={13} fill="#5A3B1E" />
            <Circle cx={cx} cy={142} r={4} fill={L44_GOLD} />
            <Path d={`M${cx - 11} 142 L${cx + 11} 142 M${cx} 131 L${cx} 153`} stroke={L44_GOLD} strokeWidth={1.5} />
          </G>
        ))}
        <Circle cx={134} cy={110} r={5} fill={L44_GOLD} />
        <Circle cx={134} cy={110} r={14} fill={L44_GOLD} opacity={0.22} />
        <Person x={200} y={90} s={0.5} fill={L44_PALE} face={L44_NIGHT} />
        <Path d="M192 62 L208 62 L206 57 L194 57 Z" fill={L44_BROWN} />
        <Rect x={122} y={140} width={16} height={4} rx={1.5} fill={L44_BROWN} />
        <L44Wick x={126} y={140} s={0.74} dir={-1} pose="beckon" lean={3} />
        <L44Pino x={74} y={162} s={1.2} dir={-1} fill={k.acc} face={k.bg} />
      </G>
      <L44Cap k={k} s="One day of fun, he says" />
    </Frame>
  );
}

/* ---------- 3. the world, shrunk ---------- */
function L44SmallScene({ k }: { k: Ink }) {
  const p = L44useGrow(300, 1400);
  const r = 11 + 4 * p;
  return (
    <Frame label="A big dark frame with one small bright window in the middle showing a bright spot, the next few minutes, while a house, a road and a sunrise around the edges are barely visible in the deep shade">
      <Defs>
        <ClipPath id="l44cs">
          <Rect x={6} y={8} width={288} height={164} rx={16} />
        </ClipPath>
        <ClipPath id="l44cw">
          <Rect x={116} y={50} width={68} height={60} rx={12} />
        </ClipPath>
      </Defs>
      <Rect x={6} y={8} width={288} height={164} rx={16} fill={L44_DEEP} stroke={k.line} strokeWidth={1.5} />
      <G clipPath="url(#l44cs)" stroke={L44_FAINT} strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M24 146 L24 116 L44 98 L64 116 L64 146 Z" />
        <Rect x={38} y={126} width={12} height={20} rx={2} />
        <Path d="M0 164 Q120 132 300 150" />
        <Path d="M0 176 Q130 150 300 164" />
        <Path d="M212 112 L290 112" />
        <Path d="M230 112 A20 20 0 0 1 270 112" />
        <Path d="M250 82 L250 76 M232 88 L228 84 M268 88 L272 84" />
      </G>
      <G clipPath="url(#l44cw)">
        <Rect x={116} y={50} width={68} height={60} fill="#FFF4C8" />
        <Circle cx={150} cy={80} r={r + 12} fill={L44_GOLD} opacity={0.35} />
        <Circle cx={150} cy={80} r={r} fill={L44_GOLD} />
        <Circle cx={147} cy={77} r={3.4} fill={L44_WHITE} opacity={0.8} />
      </G>
      <Rect x={116} y={50} width={68} height={60} rx={12} fill="none" stroke={L44_GOLD} strokeWidth={2.6} />
      <Say x={150} y={128} s="the next few minutes" fill={L44_PALE} size={10} />
      <L44Cap k={k} s="The world, shrunk to a few minutes" />
    </Frame>
  );
}

/* ---------- 4. the stable ---------- */
function L44StableScene({ k }: { k: Ink }) {
  const straw: [number, number, number][] = [
    [18, 158, 22],
    [48, 164, -18],
    [96, 160, 14],
    [150, 166, -20],
    [214, 164, 18],
    [262, 160, -14],
  ];
  return (
    <Frame label="In a quiet stable with straw on the floor, a worn-out gray donkey lies on the straw while Pinocchio, still a wooden puppet, kneels beside him with a hand on his neck, a small window of light above them">
      <Defs>
        <ClipPath id="l44ct">
          <Rect x={4} y={4} width={292} height={168} rx={14} />
        </ClipPath>
      </Defs>
      <G clipPath="url(#l44ct)">
        <Rect x={4} y={4} width={292} height={168} fill={k.soft} />
        {[40, 82, 124, 166, 208, 250].map((px) => (
          <Line key={px} x1={px} y1={4} x2={px} y2={150} stroke={L44_BROWN} strokeWidth={2} opacity={0.2} />
        ))}
        <Rect x={4} y={62} width={292} height={5} fill={L44_BROWN} opacity={0.3} />
        <Path d="M206 40 L292 150 L214 150 Z" fill={L44_GOLD} opacity={0.18} />
        <Rect x={206} y={22} width={52} height={44} rx={5} fill="#FFF1C4" stroke={L44_BROWN} strokeWidth={3} />
        <Path d="M232 22 L232 66 M206 44 L258 44" stroke={L44_BROWN} strokeWidth={2.4} />
        <Path d="M18 56 L18 88 M62 56 L62 88 M16 60 L64 60 M18 76 L62 76" stroke={L44_BROWN} strokeWidth={2.6} opacity={0.55} strokeLinecap="round" />
        <Path d="M0 150 Q80 140 160 148 Q240 156 300 146 L300 172 L0 172 Z" fill="#E3C28F" />
        {straw.map(([sx, sy, a]) => (
          <Path key={sx} d={`M${sx} ${sy} l${a} -${Math.abs(a) * 0.5}`} stroke="#C9965B" strokeWidth={2} strokeLinecap="round" />
        ))}
        {/* the donkey, lying down, head low toward the boy */}
        <Path d="M262 148 Q286 150 284 164" stroke={L44_DONKEY_DARK} strokeWidth={3} strokeLinecap="round" fill="none" />
        <Ellipse cx={226} cy={150} rx={56} ry={21} fill={L44_GRAY} />
        <Path
          d="M190 144 Q206 154 192 164 M214 142 Q230 154 216 164 M240 144 Q254 154 242 163"
          stroke={L44_DONKEY_DARK}
          strokeWidth={1.4}
          fill="none"
          opacity={0.6}
        />
        <Ellipse cx={206} cy={167} rx={19} ry={5} fill={L44_DONKEY_DARK} />
        <Ellipse cx={246} cy={167} rx={17} ry={5} fill={L44_DONKEY_DARK} />
        <Path d="M180 142 Q164 144 154 156" stroke={L44_GRAY} strokeWidth={18} strokeLinecap="round" fill="none" />
        <Ellipse cx={142} cy={160} rx={15} ry={9} fill={L44_GRAY} transform="rotate(-8 142 160)" />
        <Ellipse cx={130} cy={164} rx={7} ry={5} fill="#D9D9E3" />
        <Ellipse cx={154} cy={148} rx={3} ry={8} fill={L44_DONKEY_DARK} transform="rotate(50 154 148)" />
        <Path d="M139 156 Q143 158 147 156" stroke={BEAR_LINE} strokeWidth={1.4} strokeLinecap="round" fill="none" />
        <Path d="M141 148 Q140 141 144 138 Q147 143 146 149 Z" fill={L44_BROWN} />
        {/* Pinocchio, still wood, kneeling with a hand on the donkey's neck */}
        <G transform="rotate(8 82 170)">
          <L44Pino x={82} y={170} s={1.4} fill={k.acc} face={k.bg} />
        </G>
        <Path d="M106 138 Q124 148 156 146" stroke={L44_BROWN} strokeWidth={5} strokeLinecap="round" fill="none" />
        <Circle cx={128} cy={144} r={2.6} fill={L44_GOLD} />
        <Circle cx={158} cy={146} r={4.2} fill={L44_BROWN} />
      </G>
      <L44Cap k={k} s="The friend who said nothing mattered" />
    </Frame>
  );
}

/* ---------- 5. the hour after, kept in the dark ---------- */
function L44DarkScene({ k }: { k: Ink }) {
  const p = L44useGrow(300, 1200);
  return (
    <Frame label="A path running left to right: the first short stretch is bright and lit, the next ten minutes, and the rest of the path, with a small house and a morning sun along it, lies in darkness and is barely seen">
      <Defs>
        <ClipPath id="l44cd">
          <Rect x={6} y={8} width={288} height={164} rx={16} />
        </ClipPath>
        <LinearGradient id="l44gd" gradientUnits="userSpaceOnUse" x1={8} y1={0} x2={292} y2={0}>
          <Stop offset={0} stopColor="#F6E2A0" />
          <Stop offset={0.3} stopColor="#F6E2A0" />
          <Stop offset={0.4} stopColor="#2A2650" />
          <Stop offset={1} stopColor="#2A2650" />
        </LinearGradient>
      </Defs>
      <Rect x={6} y={8} width={288} height={164} rx={16} fill={L44_DEEP} stroke={k.line} strokeWidth={1.5} />
      <G clipPath="url(#l44cd)">
        <Path d="M34 90 L4 142 L104 142 Z" fill={L44_GOLD} opacity={0.12 + 0.1 * p} />
        <Ellipse cx={58} cy={136} rx={62} ry={30} fill={L44_GOLD} opacity={0.12 + 0.1 * p} />
        {/* the far side, barely there: a small house and a morning sun */}
        <L44House x={178} y={122} w={26} h={20} wall="#1B1838" roof={L44_FAINT} win="#5A5380" />
        <Path d="M240 112 A18 18 0 0 1 276 112 Z" fill={L44_GOLD} opacity={0.2} stroke={L44_FAINT} strokeWidth={1.6} />
        <Path d="M258 86 L258 80 M241 92 L237 88 M275 92 L279 88" stroke={L44_FAINT} strokeWidth={1.8} strokeLinecap="round" />
        <Path d="M8 140 Q120 134 200 126 T292 112" stroke="url(#l44gd)" strokeWidth={20} strokeLinecap="round" fill="none" />
        <Line x1={34} y1={138} x2={34} y2={88} stroke="#6A6496" strokeWidth={3} strokeLinecap="round" />
        <Circle cx={34} cy={82} r={22} fill={L44_GOLD} opacity={0.18} />
        <Circle cx={34} cy={82} r={7} fill="#FFF4C8" />
        <Person x={74} y={142} s={0.62} fill={L44_PALE} face={L44_DEEP} />
        <Say x={58} y={162} s="next ten minutes" fill="#F6E2A0" size={10} />
        <Say x={216} y={162} s="the hour after" fill="#6F69A0" size={10} />
      </G>
      <L44Cap k={k} s="The hour after, kept in the dark" />
    </Frame>
  );
}

/* ---------- 6. thinking of later turned it down ---------- */
const L44_HEAD =
  'M-12 60 L-13 38 Q-22 34 -27 30 Q-30 24 -28 21 Q-31 19 -29 17 Q-31 15 -30 11 L-38 6 Q-31 3 -30 -4 Q-30 -12 -26 -18 Q-20 -36 0 -38 Q26 -38 31 -12 Q34 12 20 30 L19 60 Z';

function L44LaterScene({ k }: { k: Ink }) {
  const p = L44useGrow(500, 1500);
  const reward = 0.9 - 0.62 * p;
  return (
    <Frame label="A head in profile faces right and looks at a single small unlit cigarette lying on a little dish a short way in front of the face, with no smoke; inside the head the reward spot has gone dim, and a long arrow rises from the eye over the cigarette toward a calm sunrise over hills">
      <Defs>
        <ClipPath id="l44cl">
          <Rect x={182} y={30} width={112} height={128} rx={16} />
        </ClipPath>
      </Defs>
      <G transform="translate(62 84) scale(-1.2 1.2)">
        <Path d={L44_HEAD} fill={k.soft} stroke={k.line} strokeWidth={2} strokeLinejoin="round" />
        <Circle cx={-22} cy={-7} r={1.9} fill={k.ink} />
        <Path d="M-27 -13 Q-22 -15 -17 -13" stroke={k.muted} strokeWidth={1.4} strokeLinecap="round" fill="none" />
        <Path d="M8 4 Q14 2 14 10 Q14 16 9 16" stroke={k.line} strokeWidth={1.6} strokeLinecap="round" fill="none" />
        <Circle cx={4} cy={-12} r={15} fill={L44_GOLD} opacity={reward * 0.35} />
        <Circle cx={4} cy={-12} r={7.5} fill={L44_GOLD} opacity={reward} />
        <Circle cx={4} cy={-12} r={7.5} fill="none" stroke={k.line} strokeWidth={1.2} />
      </G>
      <Rect x={136} y={112} width={4} height={44} fill={k.line} />
      <Ellipse cx={138} cy={157} rx={13} ry={3} fill={k.line} />
      <Ellipse cx={138} cy={110} rx={17} ry={4.6} fill="#D5DAE8" stroke={k.line} strokeWidth={1} />
      <Rect x={127} y={104} width={24} height={4.6} rx={2.2} fill={L44_WHITE} stroke={k.line} strokeWidth={0.9} />
      <Rect x={140} y={104} width={11} height={4.6} rx={2.2} fill="#D9A25A" />
      <Path d="M94 68 Q132 30 176 76" stroke={k.acc} strokeWidth={4} strokeLinecap="round" fill="none" />
      <Path d="M165.4 73.1 L176 76 L172.5 65.6" stroke={k.acc} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <G clipPath="url(#l44cl)">
        <Rect x={182} y={30} width={112} height={128} fill="#FFE9B8" />
        <Circle cx={238} cy={110} r={44} fill={L44_GOLD} opacity={0.3 * p} />
        <Circle cx={238} cy={112} r={20} fill={L44_GOLD} opacity={0.5 + 0.5 * p} />
        <Path d="M170 128 Q200 98 236 124 Q262 104 300 124 L300 160 L170 160 Z" fill="#7FB78F" />
        <Path d="M170 142 Q210 116 250 140 Q276 128 300 138 L300 160 L170 160 Z" fill={L44_GREEN} />
      </G>
      <Rect x={182} y={30} width={112} height={128} rx={16} fill="none" stroke={k.line} strokeWidth={1.5} />
      <L44Cap k={k} s="Thinking of later turned it down" />
    </Frame>
  );
}

/* ---------- 7. play it forward, both ways ---------- */
function L44BothScene({ k }: { k: Ink }) {
  const p = L44useGrow(400, 1300);
  const trunk = 'M150 164 L150 146 Q150 128 108 122 Q78 116 64 110 M150 146 Q150 128 192 122 Q222 116 236 110';
  return (
    <Frame label="A person stands at a fork in a glowing path looking at both ways, each ending in a soft window: on the left, giving in, a figure seated alone in a dim room, hunched forward with the head bowed; on the right, riding it out, the same figure upright by a bright window in the morning">
      <Defs>
        <ClipPath id="l44cb1">
          <Rect x={8} y={16} width={104} height={94} rx={16} />
        </ClipPath>
        <ClipPath id="l44cb2">
          <Rect x={188} y={16} width={104} height={94} rx={16} />
        </ClipPath>
      </Defs>
      <Path d={trunk} stroke={L44_GOLD} strokeWidth={26} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.16 + 0.12 * p} />
      <Path d={trunk} stroke={k.line} strokeWidth={17} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d={trunk} stroke={k.soft} strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* giving in: a dim room, the figure seated and hunched, head bowed */}
      <G clipPath="url(#l44cb1)">
        <Rect x={8} y={16} width={104} height={94} fill="#2B2747" />
        <Rect x={8} y={96} width={104} height={14} fill="#221E3B" />
        <Rect x={16} y={44} width={20} height={24} rx={3} fill="#1B1833" stroke="#3E3970" strokeWidth={1.4} />
        <Circle cx={96} cy={66} r={13} fill="#8C86B8" opacity={0.14} />
        <Circle cx={96} cy={66} r={3.6} fill="#8C86B8" opacity={0.6} />
        <Rect x={38} y={90} width={34} height={5} rx={2} fill="#3E3970" />
        <Rect x={42} y={95} width={4} height={8} fill="#3E3970" />
        <Rect x={64} y={95} width={4} height={8} fill="#3E3970" />
        <G transform="rotate(30 52 92)">
          <Person x={52} y={92} s={0.85} fill="#8C86B8" face="#2B2747" />
        </G>
      </G>
      <Rect x={8} y={16} width={104} height={94} rx={16} fill="none" stroke={L44_GOLD} strokeWidth={2} opacity={0.55} />
      <Say x={60} y={34} s="Giving in" fill="#BDB6E8" size={11} />
      {/* riding it out: a bright morning window, the same figure upright */}
      <G clipPath="url(#l44cb2)">
        <Rect x={188} y={16} width={104} height={94} fill="#FFF1D2" />
        <Rect x={188} y={96} width={104} height={14} fill="#E9CFA0" />
        <Rect x={202} y={42} width={42} height={38} rx={4} fill="#BFE3FF" stroke={L44_BROWN} strokeWidth={2} />
        <Circle cx={228} cy={56} r={9} fill={L44_GOLD} opacity={0.4 + 0.6 * p} />
        <Path d="M203 79 L203 70 Q214 62 224 70 Q232 64 243 72 L243 79 Z" fill="#7FB78F" />
        <Path d="M223 42 L223 80 M202 61 L244 61" stroke={L44_BROWN} strokeWidth={1.6} />
        <Path d="M202 42 L170 110 L260 110 L244 80 Z" fill={L44_GOLD} opacity={0.14 * p} />
        <Person x={268} y={104} s={0.9} fill="#4A3E7A" face="#FFF1D2" />
      </G>
      <Rect x={188} y={16} width={104} height={94} rx={16} fill="none" stroke={L44_GOLD} strokeWidth={2.6} />
      <Say x={240} y={34} s="Riding it out" fill="#7A5A1E" size={11} />
      <Person x={150} y={168} s={0.9} fill={k.ink} face={k.bg} />
      <L44Cap k={k} s="Play it forward, both ways" />
    </Frame>
  );
}

export const SCENES_G44: Record<string, ComponentType<{ k: Ink }>> = {
  'l44-wick': L44WickScene,
  'l44-coach': L44CoachScene,
  'l44-small': L44SmallScene,
  'l44-stable': L44StableScene,
  'l44-dark': L44DarkScene,
  'l44-later': L44LaterScene,
  'l44-both': L44BothScene,
};
