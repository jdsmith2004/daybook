/* The pictures in a lesson told as a story (core lesson-stories.ts; the owner, November 14, 2026: "all the screens have a ton of
   blank space no visuals ... it's not a very immersive experience"). Three kinds:
   - a scene: one moment of the story, drawn in the lesson's colors (the lawn with the giant sign, the room with the bell);
   - a hundred people: a grid of small figures that light up, for a share ("17 in 100 said yes"), with an earlier share first;
   - something to try: the white bear and the bell, done by the person themself, so the finding is felt, not only read.
   Each scene settles in once when it appears. With Reduce Motion on, it shows as it ends. */
import { useEffect, useRef, useState, type ComponentType, type ReactNode } from 'react';
import { Animated, Easing, Pressable, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';

import { Text } from '@/components/text';
import { buzz } from '@/lib/feel';
import { pop, rise, useAppear, useReducedMotion } from '@/lib/motion';
import { font, useTheme, type Tone } from '@/lib/theme';

type Ink = { ink: string; line: string; muted: string; acc: string; soft: string; bg: string };
const useInk = (t: Tone): Ink => {
  const c = useTheme();
  return { ink: c.ink, line: c.line, muted: c.muted, acc: t.ic, soft: t.soft, bg: c.bg };
};

const W = 300;
const H = 200;
function Frame({ label, children, h = H }: { label: string; children: ReactNode; h?: number }) {
  const v = useAppear(0, 520);
  return (
    <Animated.View style={pop(v, 0.94)} accessible accessibilityLabel={label}>
      <Svg width={W} height={h} viewBox={`0 0 ${W} ${h}`}>
        {children}
      </Svg>
    </Animated.View>
  );
}
function Say({
  x,
  y,
  s,
  fill,
  size = 13,
  anchor = 'middle',
}: {
  x: number;
  y: number;
  s: string;
  fill: string;
  size?: number;
  anchor?: 'start' | 'middle' | 'end';
}) {
  return (
    <SvgText x={x} y={y} fontSize={size} fontWeight="700" fill={fill} textAnchor={anchor} fontFamily={font.bodyBold}>
      {s}
    </SvgText>
  );
}

/* a person, standing: a round head and a soft body */
function Person({ x, y, s = 1, fill, face }: { x: number; y: number; s?: number; fill: string; face?: string }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Circle cx={0} cy={-48} r={11} fill={fill} />
      <Path d="M-17 0 L-17 -16 Q-17 -33 0 -33 Q17 -33 17 -16 L17 0 Z" fill={fill} />
      {face ? <Circle cx={4} cy={-47} r={1.8} fill={face} /> : null}
    </G>
  );
}
/* a white bear, small, as a thought: a dark line keeps it clear on a pale cloud and a dark sky alike */
const BEAR_LINE = '#2A1E5C';
function Bear({ x, y, s = 1, fill }: { x: number; y: number; s?: number; fill: string; eye?: string }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`} stroke={BEAR_LINE} strokeWidth={1.6}>
      <Rect x={-15} y={4} width={7} height={13} rx={3.5} fill={fill} />
      <Rect x={8} y={4} width={7} height={13} rx={3.5} fill={fill} />
      <Ellipse cx={0} cy={0} rx={20} ry={12} fill={fill} />
      <Circle cx={13} cy={-16} r={3.4} fill={fill} />
      <Circle cx={22} cy={-16} r={3.4} fill={fill} />
      <Circle cx={18} cy={-8} r={9} fill={fill} />
      <Circle cx={21} cy={-9} r={1.4} fill={BEAR_LINE} stroke="none" />
      <Circle cx={26} cy={-6} r={1.8} fill={BEAR_LINE} stroke="none" />
    </G>
  );
}
/* a thought cloud */
function Cloud({ x, y, w, h, fill }: { x: number; y: number; w: number; h: number; fill: string }) {
  return (
    <G>
      <Rect x={x} y={y} width={w} height={h} rx={h / 2} fill={fill} />
      <Circle cx={x + w * 0.22} cy={y + h + 9} r={5} fill={fill} />
      <Circle cx={x + w * 0.14} cy={y + h + 19} r={3} fill={fill} />
    </G>
  );
}

/* ---------- lesson 2: the white bear ---------- */
function BearBook({ k }: { k: Ink }) {
  return (
    <Frame label="An old book, and a thought of a white bear above it">
      <Cloud x={92} y={8} w={150} h={74} fill={k.soft} />
      <Bear x={160} y={52} s={1.5} fill="#FFFFFF" eye={k.acc} />
      <Path d="M40 150 Q95 132 150 150 Q205 132 260 150 L260 192 Q205 176 150 192 Q95 176 40 192 Z" fill={k.acc} />
      <Path d="M150 150 L150 192" stroke={k.bg} strokeWidth={3} />
      {[160, 168, 176].map((y) => (
        <G key={y}>
          <Line x1={58} y1={y} x2={136} y2={y - 6} stroke={k.bg} strokeWidth={3} strokeLinecap="round" opacity={0.5} />
          <Line x1={164} y1={y - 6} x2={242} y2={y} stroke={k.bg} strokeWidth={3} strokeLinecap="round" opacity={0.5} />
        </G>
      ))}
      <Say x={150} y={124} s="1863" fill={k.muted} />
    </Frame>
  );
}
function BellRoom({ k }: { k: Ink }) {
  return (
    <Frame label="A person alone in a small room, with a bell on the table">
      <Rect x={30} y={10} width={240} height={176} rx={18} fill={k.soft} opacity={0.5} />
      <Line x1={30} y1={150} x2={270} y2={150} stroke={k.line} strokeWidth={3} />
      <Rect x={186} y={66} width={44} height={56} rx={4} fill="none" stroke={k.line} strokeWidth={3} />
      <Line x1={208} y1={66} x2={208} y2={122} stroke={k.line} strokeWidth={2} />
      <Person x={100} y={150} s={1.25} fill={k.ink} face={k.bg} />
      <Rect x={130} y={112} width={70} height={8} rx={4} fill={k.acc} />
      <Rect x={140} y={120} width={6} height={30} fill={k.acc} />
      <Rect x={184} y={120} width={6} height={30} fill={k.acc} />
      <Path d="M154 112 Q165 88 176 112 Z" fill="#FFD25A" />
      <Circle cx={165} cy={92} r={3} fill="#FFD25A" />
      <Say x={150} y={178} s="Five minutes. One rule." fill={k.muted} />
    </Frame>
  );
}
function Rebound({ k }: { k: Ink }) {
  const bears = (n: number, x0: number) =>
    Array.from({ length: n }, (_, i) => <Bear key={i} x={x0 + (i % 3) * 30} y={40 + Math.floor(i / 3) * 24} s={0.55} fill="#FFFFFF" eye={k.acc} />);
  return (
    <Frame label="Afterward, the person who pushed the bear away thinks of it more than the person who never did">
      <Cloud x={12} y={14} w={128} h={70} fill={k.soft} />
      {bears(5, 38)}
      <Cloud x={160} y={14} w={128} h={70} fill={k.soft} />
      {bears(2, 196)}
      <Person x={70} y={170} s={1.1} fill={k.acc} face={k.bg} />
      <Person x={226} y={170} s={1.1} fill={k.ink} face={k.bg} />
      <Say x={70} y={192} s="Pushed it away" fill={k.ink} />
      <Say x={226} y={192} s="Free to think it" fill={k.muted} />
    </Frame>
  );
}
function Checker({ k }: { k: Ink }) {
  return (
    <Frame label="Part of the mind keeps checking for the thought with a flashlight, and the light lands on it">
      <Path d="M92 104 L250 46 L262 130 Z" fill="#FFD25A" opacity={0.35} />
      <Bear x={226} y={92} s={1.3} fill="#FFFFFF" eye={k.acc} />
      <Person x={70} y={170} s={1.3} fill={k.ink} face={k.bg} />
      <Rect x={82} y={98} width={24} height={11} rx={4} fill={k.acc} transform="rotate(-20 94 104)" />
      <Say x={150} y={192} s="Every check brings it back" fill={k.muted} />
    </Frame>
  );
}
function PushDoor({ k }: { k: Ink }) {
  return (
    <Frame label="A person leaning hard on a door, and the bear right behind it">
      <Rect x={156} y={20} width={14} height={150} rx={4} fill={k.line} />
      <Bear x={222} y={140} s={1.4} fill="#FFFFFF" eye={k.acc} />
      <Person x={104} y={170} s={1.3} fill={k.acc} face={k.bg} />
      <Line x1={118} y1={118} x2={154} y2={110} stroke={k.acc} strokeWidth={9} strokeLinecap="round" />
      <Line x1={118} y1={132} x2={154} y2={128} stroke={k.acc} strokeWidth={9} strokeLinecap="round" />
      <Say x={150} y={192} s="The harder you push, the closer it stays" fill={k.muted} />
    </Frame>
  );
}
function Waves({ k }: { k: Ink }) {
  const tops = [70, 98, 122];
  return (
    <Frame label="Three urges in a row, each one lower than the last">
      <Line x1={20} y1={160} x2={280} y2={160} stroke={k.line} strokeWidth={3} strokeLinecap="round" />
      {tops.map((top, i) => {
        const x = 30 + i * 85;
        return (
          <Path
            key={i}
            d={`M${x} 160 Q${x + 40} ${top - 50} ${x + 80} 160`}
            fill="none"
            stroke={i === 0 ? k.acc : k.ink}
            strokeWidth={5}
            strokeLinecap="round"
            opacity={1 - i * 0.2}
          />
        );
      })}
      <Say x={150} y={190} s="Each one you watch has less to promise" fill={k.muted} />
    </Frame>
  );
}

/* ---------- lesson 1: the signs ---------- */
function House({ x, y, k, window: win }: { x: number; y: number; k: Ink; window?: ReactNode }) {
  return (
    <G transform={`translate(${x} ${y})`}>
      <Path d="M0 50 L60 6 L120 50 Z" fill={k.acc} />
      <Rect x={10} y={48} width={100} height={78} fill={k.ink} opacity={0.9} />
      <Rect x={50} y={88} width={22} height={38} rx={3} fill={k.bg} />
      <Rect x={20} y={64} width={24} height={20} rx={3} fill={k.bg} />
      <Rect x={78} y={64} width={24} height={20} rx={3} fill={k.bg} />
      {win}
    </G>
  );
}
function LawnSign({ k }: { k: Ink }) {
  return (
    <Frame label="A house, almost hidden behind a huge, badly painted sign that says Drive Carefully">
      <House x={90} y={18} k={k} />
      <Rect x={0} y={150} width={300} height={50} rx={10} fill={k.soft} />
      <Rect x={70} y={74} width={160} height={84} rx={6} fill="#FFFFFF" transform="rotate(-4 150 116)" />
      <Say x={150} y={112} s="DRIVE" fill="#C2410C" size={22} />
      <Say x={150} y={138} s="CAREFULLY" fill="#C2410C" size={22} />
      <Rect x={110} y={156} width={8} height={30} fill="#8A5A2B" />
      <Rect x={184} y={156} width={8} height={30} fill="#8A5A2B" />
    </Frame>
  );
}
function WindowSign({ k }: { k: Ink }) {
  return (
    <Frame label="The same house, with a tiny card in one window: Be a safe driver">
      <House x={90} y={18} k={k} window={<Rect x={21} y={68} width={22} height={12} rx={2} fill="#FFFFFF" />} />
      <Rect x={0} y={150} width={300} height={50} rx={10} fill={k.soft} />
      <Path d="M134 92 Q170 70 206 74" fill="none" stroke={k.muted} strokeWidth={2} strokeDasharray="4 5" />
      <Rect x={206} y={60} width={84} height={28} rx={6} fill="#FFFFFF" />
      <Say x={248} y={79} s="Be a safe driver" fill={k.acc} size={11} />
      <Say x={150} y={180} s="Three inches wide" fill={k.ink} />
    </Frame>
  );
}
function Doorway({ k }: { k: Ink }) {
  return (
    <Frame label="A person standing in the doorway, thinking: I am someone who cares about safe roads">
      <Cloud x={120} y={10} w={168} h={58} fill={k.soft} />
      <Say x={204} y={36} s="I am someone who" fill={BEAR_LINE} />
      <Say x={204} y={54} s="cares about safe roads" fill={BEAR_LINE} />
      <Rect x={40} y={60} width={90} height={130} rx={6} fill={k.acc} />
      <Rect x={50} y={70} width={70} height={120} rx={4} fill={k.bg} />
      <Person x={85} y={186} s={1.4} fill={k.ink} face={k.bg} />
    </Frame>
  );
}
function Petition({ k }: { k: Ink }) {
  return (
    <Frame label="A clipboard with a petition to keep California beautiful, with a signature">
      <Rect x={100} y={14} width={100} height={150} rx={10} fill={k.acc} />
      <Rect x={110} y={30} width={80} height={124} rx={4} fill="#FFFFFF" />
      <Rect x={130} y={8} width={40} height={16} rx={5} fill={k.ink} />
      <Say x={150} y={52} s="Keep California" fill="#1A1250" size={11} />
      <Say x={150} y={66} s="beautiful" fill="#1A1250" size={11} />
      {[86, 102, 118].map((y) => (
        <Line key={y} x1={120} y1={y} x2={180} y2={y} stroke="#C9C4E6" strokeWidth={2} />
      ))}
      <Path d="M124 132 q8 -12 14 0 t14 0 t14 -4" fill="none" stroke={k.acc} strokeWidth={2.5} strokeLinecap="round" />
      <Say x={150} y={190} s="A yes about something else" fill={k.muted} />
    </Frame>
  );
}
function Mirror({ k }: { k: Ink }) {
  return (
    <Frame label="A person watching what they do, the way someone else would">
      <Person x={90} y={170} s={1.4} fill={k.ink} face={k.bg} />
      <Rect x={170} y={30} width={96} height={140} rx={48} fill={k.soft} />
      <Person x={218} y={160} s={1.1} fill={k.acc} />
      <Say x={150} y={192} s="You read your own steps" fill={k.muted} />
    </Frame>
  );
}

/* ---------- lesson 3: the milkshake ---------- */
function Tasting({ k }: { k: Ink }) {
  const tub = (x: number, c: string) => (
    <G key={x}>
      <Path d={`M${x} 100 L${x + 56} 100 L${x + 50} 150 L${x + 6} 150 Z`} fill="#FFFFFF" />
      <Ellipse cx={x + 28} cy={98} rx={30} ry={14} fill={c} />
    </G>
  );
  return (
    <Frame label="A table with three tubs of ice cream, and a spoon">
      <Rect x={20} y={150} width={260} height={12} rx={6} fill={k.acc} />
      {tub(40, '#F7C6D0')}
      {tub(122, '#FFE9B8')}
      {tub(204, '#8B5E3C')}
      <Rect x={150} y={40} width={8} height={46} rx={4} fill={k.ink} transform="rotate(30 154 60)" />
      <Ellipse cx={142} cy={38} rx={10} ry={7} fill={k.ink} transform="rotate(30 142 38)" />
      <Say x={150} y={190} s="A taste test, they were told" fill={k.muted} />
    </Frame>
  );
}
function Milkshake({ k }: { k: Ink }) {
  const glass = (x: number, full: boolean) => (
    <G>
      <Path d={`M${x} 60 L${x + 54} 60 L${x + 46} 150 L${x + 8} 150 Z`} fill="none" stroke={k.ink} strokeWidth={3} />
      {full ? <Path d={`M${x + 3} 74 L${x + 51} 74 L${x + 46} 150 L${x + 8} 150 Z`} fill="#F7C6D0" /> : null}
      {full ? <Rect x={x + 30} y={30} width={6} height={50} rx={3} fill={k.acc} transform={`rotate(12 ${x + 33} 55)`} /> : null}
    </G>
  );
  return (
    <Frame label="Some were given a milkshake first, and some were given nothing">
      {glass(60, true)}
      {glass(186, false)}
      <Say x={87} y={178} s="A milkshake first" fill={k.ink} />
      <Say x={213} y={178} s="Nothing first" fill={k.muted} />
    </Frame>
  );
}
function IceResults({ k }: { k: Ink }) {
  const still = useReducedMotion();
  const v = useAppear(250, 1100, Easing.out(Easing.cubic));
  const [p, setP] = useState(still ? 1 : 0);
  useEffect(() => {
    const id = v.addListener(({ value }) => setP(value));
    return () => v.removeListener(id);
  }, [v]);
  const bar = (x: number, hgt: number, c: string, s: string) => (
    <G>
      <Rect x={x} y={150 - hgt * p} width={44} height={hgt * p} rx={8} fill={c} />
      <Say x={x + 22} y={168} s={s} fill={k.muted} size={11} />
    </G>
  );
  return (
    <Frame label="People not on a diet ate less ice cream after a milkshake. People on a diet ate more.">
      <Line x1={20} y1={150} x2={280} y2={150} stroke={k.line} strokeWidth={3} />
      {bar(34, 92, k.line, 'Nothing')}
      {bar(84, 52, k.ink, 'Shake')}
      {bar(170, 56, k.line, 'Nothing')}
      {bar(220, 104, k.acc, 'Shake')}
      <Say x={81} y={192} s="Not on a diet" fill={k.ink} />
      <Say x={217} y={192} s="On a diet" fill={k.acc} />
    </Frame>
  );
}
function RuinedDay({ k }: { k: Ink }) {
  const hours = Array.from({ length: 12 }, (_, i) => i);
  return (
    <Frame label="One slip early in the day, and then the rule that the whole day is ruined crosses out every hour after it">
      {hours.map((i) => {
        const x = 24 + (i % 6) * 44;
        const y = 30 + Math.floor(i / 6) * 60;
        return (
          <G key={i}>
            <Rect x={x} y={y} width={36} height={44} rx={8} fill={i === 1 ? k.acc : k.soft} />
            {i > 1 ? (
              <Path
                d={`M${x + 8} ${y + 10} L${x + 28} ${y + 34} M${x + 28} ${y + 10} L${x + 8} ${y + 34}`}
                stroke={BEAR_LINE}
                opacity={0.55}
                strokeWidth={3}
                strokeLinecap="round"
              />
            ) : null}
          </G>
        );
      })}
      <Say x={150} y={176} s="One slip, then “the day is ruined”" fill={k.ink} />
    </Frame>
  );
}

/* ---------- a hundred people ---------- */
export function People({ n, was, s, t }: { n: number; was?: number; s?: string; t: Tone }) {
  const k = useInk(t);
  const still = useReducedMotion();
  const [lit, setLit] = useState(still ? n : was || 0);
  useEffect(() => {
    if (still) return;
    let i = was || 0;
    const step = () => {
      i += 1;
      setLit(i);
      if (i < n) id = setTimeout(step, Math.max(12, 900 / Math.max(1, n - (was || 0))));
    };
    let id = setTimeout(step, 500);
    return () => clearTimeout(id);
  }, [n, was, still]);
  const size = 26;
  return (
    <View style={{ alignItems: 'center', gap: 8 }} accessible accessibilityLabel={`${n} out of every 100 ${s || ''}`}>
      <Svg width={size * 10} height={size * 10 * 1.1} viewBox={`0 0 ${size * 10} ${size * 11}`}>
        {Array.from({ length: 100 }, (_, i) => {
          const x = (i % 10) * size + size / 2;
          const y = Math.floor(i / 10) * size * 1.1 + size * 0.8;
          const on = i < lit;
          const before = was != null && i < was;
          const fill = on ? (before ? k.ink : k.acc) : k.line;
          return (
            <G key={i} opacity={on ? 1 : 0.45}>
              <Circle cx={x} cy={y - 7} r={4.2} fill={fill} />
              <Path d={`M${x - 6} ${y + 6} Q${x} ${y - 4} ${x + 6} ${y + 6} Z`} fill={fill} />
            </G>
          );
        })}
      </Svg>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
        <Text style={{ fontFamily: font.displayBold, fontSize: 34, color: t.ic }}>{lit}</Text>
        <Text style={{ fontFamily: font.bodyBold, fontSize: 15, color: k.ink }}>in 100 {s || ''}</Text>
      </View>
    </View>
  );
}

/* ---------- something to try: the white bear and the bell ---------- */
const TRY_SECS = 20;
export function TryBell({ t }: { t: Tone }) {
  const k = useInk(t);
  const [state, setState] = useState<'ready' | 'run' | 'done'>('ready');
  const [left, setLeft] = useState(TRY_SECS);
  const [rang, setRang] = useState(0);
  const ring = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (state !== 'run') return;
    const started = Date.now();
    const id = setInterval(() => {
      const l = Math.max(0, TRY_SECS - Math.floor((Date.now() - started) / 1000));
      setLeft(l);
      if (!l) {
        clearInterval(id);
        setState('done');
      }
    }, 250);
    return () => clearInterval(id);
  }, [state]);
  const tap = () => {
    if (state === 'ready') return setState('run');
    if (state !== 'run') return;
    setRang((r) => r + 1);
    buzz('tap');
    ring.setValue(0);
    Animated.timing(ring, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  };
  const sway = ring.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: ['0deg', '-14deg', '12deg', '-6deg', '0deg'] });
  const v = useAppear(0, 420);
  return (
    <Animated.View style={[rise(v), { alignItems: 'center', gap: 12, width: W }]}>
      <Text style={{ fontFamily: font.bodyBold, fontSize: 15, color: k.ink, textAlign: 'center' }}>
        {state === 'ready'
          ? 'For 20 seconds, think of anything except a white bear. Tap the bell each time one shows up.'
          : state === 'run'
            ? left + ' seconds. Tap the bell when the bear shows up.'
            : rang === 0
              ? 'No bell at all. Most people cannot manage that.'
              : 'You rang it ' + rang + (rang === 1 ? ' time' : ' times') + ' in 20 seconds, trying not to.'}
      </Text>
      <View style={{ width: 152, height: 152, alignItems: 'center', justifyContent: 'center' }}>
        {/* the twenty seconds, as a ring that empties around the bell */}
        <Svg width={152} height={152} viewBox="0 0 152 152" style={{ position: 'absolute' }}>
          <Circle cx={76} cy={76} r={72} fill="none" stroke={k.line} strokeWidth={5} opacity={0.4} />
          {state !== 'ready' ? (
            <Circle
              cx={76}
              cy={76}
              r={72}
              fill="none"
              stroke={t.ic}
              strokeWidth={5}
              strokeLinecap="round"
              strokeDasharray={`${(2 * Math.PI * 72 * left) / TRY_SECS} ${2 * Math.PI * 72}`}
              transform="rotate(-90 76 76)"
            />
          ) : null}
        </Svg>
        <Pressable
          onPress={tap}
          disabled={state === 'done'}
          accessibilityRole="button"
          accessibilityLabel={state === 'ready' ? 'Start' : 'Ring the bell'}
          style={({ pressed }) => ({
            width: 132,
            height: 132,
            borderRadius: 66,
            backgroundColor: k.soft,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.8 : 1,
          })}>
          <Animated.View style={{ transform: [{ rotate: sway }] }}>
            <Svg width={84} height={84} viewBox="0 0 84 84">
              <Path d="M14 62 Q14 22 42 18 Q70 22 70 62 Z" fill="#FFD25A" />
              <Rect x={8} y={60} width={68} height={10} rx={5} fill="#E8A92A" />
              <Circle cx={42} cy={14} r={6} fill="#E8A92A" />
              <Circle cx={42} cy={74} r={6} fill="#E8A92A" />
            </Svg>
          </Animated.View>
        </Pressable>
      </View>
      <Text style={{ fontFamily: font.bodyBold, fontSize: 15, color: state === 'ready' ? t.ic : k.muted }}>
        {state === 'ready' ? 'Tap the bell to start' : state === 'run' ? 'Rang ' + rang : 'Now see what the students found'}
      </Text>
    </Animated.View>
  );
}

const SCENES: Record<string, ComponentType<{ k: Ink }>> = {
  'bear-book': BearBook,
  'bell-room': BellRoom,
  rebound: Rebound,
  checker: Checker,
  'push-door': PushDoor,
  waves: Waves,
  'lawn-sign': LawnSign,
  'window-sign': WindowSign,
  doorway: Doorway,
  petition: Petition,
  mirror: Mirror,
  tasting: Tasting,
  milkshake: Milkshake,
  'ice-results': IceResults,
  'ruined-day': RuinedDay,
};
/** the scene names a story may use (core lesson-stories.ts checks its own against this list in a test) */
export const SCENE_KEYS = Object.keys(SCENES);

export function StoryScene({ k: key, t }: { k: string; t: Tone }) {
  const k = useInk(t);
  const S = SCENES[key];
  return S ? <S k={k} /> : null;
}
