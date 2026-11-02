/* The picture on a lesson card: an icon on a soft shape, a chain of steps, a wave, a snowball, your loop, a big number, a shield,
   a check mark, or one of the moving research pictures from Talk it through and Rekindle. Ported from the legacy lxArt and friends, in the lesson's unit color. Each one settles in once when it
   appears: the icons pop in, a chain shows one step at a time, a dot rides the wave up and over, and a big number counts up.
   With Reduce Motion on, they show as they end. */
import { lxLoopNodes, TALK_CARDS, type Art, type RkArt, type Settings, type TalkArt } from '@daybook/core';
import { useEffect, useState, type ReactNode } from 'react';
import { Animated, Easing, View } from 'react-native';
import { Text } from '@/components/text';
import Svg, { Circle, G, Path, Rect, Text as SvgText } from 'react-native-svg';

import { RkArtView } from '@/components/rk-art';
import { Shape, type ShapeKind } from '@/components/shapes';
import { TalkArtView } from '@/components/talk-art';
import { Icon } from '@/components/ui';
import { pop, rise, useAppear, useReducedMotion } from '@/lib/motion';
import { font, useTheme, type Tone } from '@/lib/theme';

/* art labels read as plain words, whatever the lesson's data has them in */
const plain = (x: string) => (x === x.toUpperCase() ? x.charAt(0) + x.slice(1).toLowerCase() : x);

/* the soft shapes a lesson's picture wears; each icon always gets the same one, so a lesson keeps its look */
const ICO_SHAPES: ShapeKind[] = ['cookie9', 'sunny', 'clover4', 'cookie12', 'flower', 'softBurst', 'puffy', 'cookie6'];
const shapeOf = (name: string) => ICO_SHAPES[Array.from(name).reduce((a, x) => a + x.charCodeAt(0), 0) % ICO_SHAPES.length];

export function LxIco({ name, t, size = 150 }: { name: string; t: Tone; size?: number }) {
  const v = useAppear(0, 380);
  return (
    <Animated.View style={pop(v)}>
      <Shape kind={shapeOf(name || 'sparkle')} size={size} color={t.ic}>
        {/* on the web the shape's drawing is placed absolutely and would paint over a plain child, so the icon is placed too */}
        <View style={{ position: 'relative' }}>
          <Icon name={name || 'sparkle'} size={Math.round(size * 0.42)} color={t.ink} />
        </View>
      </Shape>
    </Animated.View>
  );
}

export function LxShield({ t }: { t: Tone }) {
  const v = useAppear(0, 420);
  return (
    <Animated.View style={pop(v)}>
      <Svg width={130} height={130} viewBox="24 20 72 80" accessibilityLabel="A shield">
        <Path d="M60 26l26 11v20c0 18-11 30-26 37-15-7-26-19-26-37V37z" fill={t.ic} stroke={t.ic} strokeWidth={4} strokeLinejoin="round" />
        <Path d="M48 58l8 8 16-17" fill="none" stroke={t.ink} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </Animated.View>
  );
}

export function LxCheck() {
  const c = useTheme();
  const v = useAppear(0, 460, Easing.out(Easing.back(1.6)));
  return (
    <Animated.View style={pop(v, 0.7)}>
      <Svg width={120} height={120} viewBox="0 0 120 120" accessibilityLabel="A check mark">
        <Circle cx={60} cy={60} r={56} fill={c.mintSoft} />
        <Circle cx={60} cy={60} r={38} fill={c.mint} />
        <Path d="M44 61l12 12 21-24" fill="none" stroke="#FFFFFF" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </Animated.View>
  );
}

function Chain({ nodes, icons, t }: { nodes: string[]; icons?: string[]; t: Tone }) {
  const dense = nodes.length >= 5;
  return (
    <View style={{ alignSelf: 'stretch', alignItems: 'center' }} accessible accessibilityLabel={nodes.join(', then ')}>
      {nodes.map((n, i) => {
        const hot = i === nodes.length - 1;
        return (
          <Step key={i} i={i}>
            {i ? <View style={{ width: 3, height: dense ? 10 : 16, backgroundColor: t.ic, opacity: 0.5 }} /> : null}
            <View
              style={{
                alignSelf: 'stretch',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingVertical: dense ? 8 : 12,
                paddingHorizontal: 16,
                borderRadius: 12,
                backgroundColor: hot ? t.ic : t.soft,
              }}>
              {icons && icons[i] ? <Icon name={icons[i]} size={18} color={hot ? t.ink : t.text} /> : null}
              <Text style={{ fontFamily: font.display, fontSize: dense ? 15 : 17, color: hot ? t.ink : t.text }}>{n}</Text>
            </View>
          </Step>
        );
      })}
    </View>
  );
}

/* one link of a chain, shown a beat after the one before */
function Step({ i, children }: { i: number; children: ReactNode }) {
  const v = useAppear(120 + i * 260, 380);
  return <Animated.View style={[{ alignSelf: 'stretch', alignItems: 'center' }, rise(v)]}>{children}</Animated.View>;
}

/* points along the wave (the two curves in its path), for the dot that rides it */
const bez = (a: number, b: number, c: number, d: number, k: number) => (1 - k) ** 3 * a + 3 * (1 - k) ** 2 * k * b + 3 * (1 - k) * k * k * c + k ** 3 * d;
const WAVE_PTS = Array.from({ length: 25 }, (_, j) => {
  const u = j / 24;
  const k = u < 0.5 ? u * 2 : (u - 0.5) * 2;
  return u < 0.5 ? [bez(8, 70, 96, 165, k), bez(128, 128, 26, 26, k)] : [bez(165, 234, 262, 322, k), bez(26, 26, 128, 128, k)];
});

function Wave({ t, al }: { t: Tone; al?: string }) {
  const c = useTheme();
  const still = useReducedMotion();
  const [w, setW] = useState(0);
  const go = useAppear(500, 3200, Easing.inOut(Easing.sin));
  /* the art is drawn in a 330 by 150 box and scaled to fit, centered */
  const k = Math.min(1, w / 330);
  const ox = (w - 330 * k) / 2;
  const oy = (150 - 150 * k) / 2;
  const R = 8 * k;
  const along = (i: 0 | 1, o: number) => go.interpolate({ inputRange: WAVE_PTS.map((_, j) => j / 24), outputRange: WAVE_PTS.map((p) => o + p[i] * k - R) });
  return (
    <View style={{ width: '100%', maxWidth: 330, height: 150 }} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      <Svg width="100%" height={150} viewBox="0 0 330 150" accessibilityLabel={al || 'An urge rises, peaks, and falls like a wave'}>
        <Path d="M8 128 C70 128 96 26 165 26 S262 128 322 128" fill="none" stroke={t.ic} strokeWidth={5} strokeLinecap="round" />
        {still || !w ? <Circle cx={165} cy={26} r={8} fill={t.ic} /> : null}
        <SvgText x={52} y={146} fontSize={11} fontWeight="700" fill={c.muted} textAnchor="middle" fontFamily={font.bodyBold}>
          Rises
        </SvgText>
        <SvgText x={165} y={14} fontSize={11} fontWeight="700" fill={c.muted} textAnchor="middle" fontFamily={font.bodyBold}>
          Peaks
        </SvgText>
        <SvgText x={278} y={146} fontSize={11} fontWeight="700" fill={c.muted} textAnchor="middle" fontFamily={font.bodyBold}>
          Passes
        </SvgText>
      </Svg>
      {w && !still ? (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: R * 2,
            height: R * 2,
            borderRadius: R,
            backgroundColor: t.ic,
            transform: [{ translateX: along(0, ox) }, { translateY: along(1, oy) }],
          }}
        />
      ) : null}
    </View>
  );
}

function Snow({ t, o }: { t: Tone; o: { a?: string; b?: string; al?: string } }) {
  const c = useTheme();
  return (
    <Svg
      width="100%"
      height={170}
      viewBox="0 0 330 170"
      style={{ maxWidth: 330 }}
      accessibilityLabel={o.al || 'A snowball rolling down a slope, growing as it goes'}>
      <Path d="M10 30 L320 150" stroke={c.line} strokeWidth={4} strokeLinecap="round" fill="none" />
      <Circle cx={43} cy={34} r={8} fill={t.soft} stroke={t.ic} strokeWidth={2} />
      <Circle cx={110} cy={54} r={14} fill={t.soft} stroke={t.ic} strokeWidth={2} />
      <Circle cx={194} cy={75} r={24} fill={t.soft} stroke={t.ic} strokeWidth={2} />
      <Circle cx={288} cy={99} r={36} fill={t.ic} stroke={t.ic} strokeWidth={2} />
      <SvgText x={43} y={16} fontSize={11} fontWeight="700" fill={c.muted} textAnchor="middle" fontFamily={font.bodyBold}>
        {plain(o.a || 'One slip')}
      </SvgText>
      <SvgText x={288} y={103} fontSize={11} fontWeight="700" fill={t.ink} textAnchor="middle" fontFamily={font.bodyBold}>
        {plain(o.b || 'Giving up')}
      </SvgText>
    </Svg>
  );
}

function Loop({ t, o, st }: { t: Tone; o: { n?: string[]; c?: string }; st: Settings | null }) {
  const c = useTheme();
  const n = o.n && o.n.length === 4 ? o.n : lxLoopNodes(st);
  if (!n) return <Chain nodes={['Fail', 'Shame', 'Hide', 'Give up']} t={t} />;
  if (n.length !== 4)
    return (
      <View style={{ alignSelf: 'stretch', alignItems: 'center', gap: 8 }}>
        <Chain nodes={n} t={t} />
        <Text style={{ fontFamily: font.body, fontSize: 13, color: c.muted, textAlign: 'center' }}>…and back to the start. {plain(o.c || 'Your loop')}</Text>
      </View>
    );
  const box = (x: number, y: number, s: string) => (
    <G key={s + x + y}>
      <Rect x={x} y={y} width={112} height={48} rx={12} fill={c.surface} />
      <SvgText x={x + 56} y={y + 31} fontSize={17} fill={t.text} textAnchor="middle" fontFamily={font.display}>
        {s}
      </SvgText>
    </G>
  );
  /* a line with a drawn head at its end (an SVG marker draws its head off the line on iOS) */
  const arrow = (x1: number, y1: number, x2: number, y2: number) => {
    const a = Math.atan2(y2 - y1, x2 - x1);
    const p = (d: number, s: number) => `${x2 - Math.cos(a) * d - Math.sin(a) * s} ${y2 - Math.sin(a) * d + Math.cos(a) * s}`;
    return (
      <G key={`${x1} ${y1}`}>
        <Path d={`M${x1} ${y1}L${p(6, 0)}`} stroke={t.text} strokeWidth={3} strokeLinecap="round" />
        <Path d={`M${x2} ${y2}L${p(11, 6.5)}L${p(11, -6.5)}Z`} fill={t.text} />
      </G>
    );
  };
  return (
    <Svg
      width="100%"
      height={190}
      viewBox="0 0 330 190"
      style={{ maxWidth: 330 }}
      accessibilityLabel={`Your loop: ${n.join(', then ')}, and back to the start`}>
      {box(14, 16, n[0])}
      {box(204, 16, n[1])}
      {box(204, 126, n[2])}
      {box(14, 126, n[3])}
      {arrow(134, 40, 198, 40)}
      {arrow(260, 72, 260, 120)}
      {arrow(196, 150, 132, 150)}
      {arrow(70, 118, 70, 70)}
      <SvgText x={165} y={100} fontSize={11} fontWeight="700" fill={c.muted} textAnchor="middle" fontFamily={font.bodyBold}>
        {plain(o.c || 'Your loop')}
      </SvgText>
    </Svg>
  );
}

/* ---------- the pictures behind a turn (core lesson-turns.ts) ---------- */

/* three small steps, and the feeling of being ready filling a third with each one: the step comes first */
function Ready({ t }: { t: Tone }) {
  const c = useTheme();
  return (
    <View style={{ width: 300, maxWidth: '100%', gap: 10 }} accessible accessibilityLabel="Each small step fills a little more of the feeling of being ready">
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 8 }}>
        {['One step', 'Another', 'Another'].map((x, i) => (
          <ReadyStep key={i} i={i} label={x} t={t} />
        ))}
      </View>
      <Text style={{ fontFamily: font.bodyBold, fontSize: 13, color: c.muted, marginTop: 4 }}>Feeling ready</Text>
      <View style={{ flexDirection: 'row', height: 18, borderRadius: 9, backgroundColor: t.soft, overflow: 'hidden' }}>
        {[0, 1, 2].map((i) => (
          <ReadyFill key={i} i={i} t={t} />
        ))}
      </View>
    </View>
  );
}
function ReadyStep({ i, label, t }: { i: number; label: string; t: Tone }) {
  const c = useTheme();
  const v = useAppear(200 + i * 650, 380, Easing.out(Easing.back(1.6)));
  return (
    <Animated.View style={[{ alignItems: 'center', gap: 6, width: 84 }, pop(v, 0.6)]}>
      <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: t.ic, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="check" size={24} color={t.ink} />
      </View>
      <Text style={{ fontFamily: font.bodyBold, fontSize: 13, color: c.muted }}>{label}</Text>
    </Animated.View>
  );
}
function ReadyFill({ i, t }: { i: number; t: Tone }) {
  const v = useAppear(420 + i * 650, 420);
  return <Animated.View style={{ flex: 1, backgroundColor: t.ic, opacity: v }} />;
}

/* wanting climbs with each repeat while liking stays flat: two lines, the flat one first */
function Want({ t }: { t: Tone }) {
  const c = useTheme();
  const like = useAppear(150, 420);
  const want = useAppear(750, 700);
  const lbl = (x: number, y: number, s: string, fill: string, anchor: 'start' | 'middle' | 'end' = 'end') => (
    <SvgText x={x} y={y} fontSize={13} fontWeight="700" fill={fill} textAnchor={anchor} fontFamily={font.bodyBold}>
      {s}
    </SvgText>
  );
  const box = { position: 'absolute' as const, left: 0, top: 0, right: 0, bottom: 0 };
  return (
    <View style={{ width: 320, maxWidth: '100%', height: 170 }} accessible accessibilityLabel="With each repeat, wanting climbs while liking stays flat">
      <Svg width="100%" height={170} viewBox="0 0 330 170" style={box}>
        <Path d="M20 146 H310" stroke={c.line} strokeWidth={3} strokeLinecap="round" />
        {lbl(165, 166, 'Each time it is repeated', c.muted, 'middle')}
      </Svg>
      <Animated.View style={[box, rise(like, 6)]}>
        <Svg width="100%" height={170} viewBox="0 0 330 170">
          <Path d="M20 112 C120 112 210 118 300 122" fill="none" stroke={c.muted} strokeWidth={4} strokeLinecap="round" />
          {lbl(300, 140, 'Liking', c.muted)}
        </Svg>
      </Animated.View>
      <Animated.View style={[box, rise(want, 14)]}>
        <Svg width="100%" height={170} viewBox="0 0 330 170">
          <Path d="M20 118 C120 114 210 78 300 26" fill="none" stroke={t.ic} strokeWidth={6} strokeLinecap="round" />
          {lbl(300, 16, 'Wanting', t.ic)}
        </Svg>
      </Animated.View>
    </View>
  );
}

/* twelve days, one with a slip in it: the days after keep coming, and the count reads 11 of 12, not ruined */
const DOTS = 12;
const SLIP_AT = 7;
function Dots({ t }: { t: Tone }) {
  const c = useTheme();
  const end = useAppear(150 + DOTS * 110 + 250, 420);
  return (
    <View
      style={{ width: '100%', maxWidth: 330, gap: 14, alignItems: 'center' }}
      accessible
      accessibilityLabel="Twelve days, one with a slip. Not ruined: 11 of 12">
      <View style={{ flexDirection: 'row', gap: 7 }}>
        {Array.from({ length: DOTS }, (_, i) => (
          <Dot key={i} i={i} t={t} />
        ))}
      </View>
      <Animated.View style={[{ flexDirection: 'row', alignItems: 'baseline', gap: 16 }, rise(end)]}>
        <Text style={{ fontFamily: font.display, fontSize: 20, color: c.muted, textDecorationLine: 'line-through' }}>Ruined</Text>
        <Text style={{ fontFamily: font.displayBold, fontSize: 34, lineHeight: 40, color: t.ic }}>11 of 12</Text>
      </Animated.View>
    </View>
  );
}
function Dot({ i, t }: { i: number; t: Tone }) {
  const c = useTheme();
  const v = useAppear(150 + i * 110, 300, Easing.out(Easing.back(1.8)));
  const slip = i === SLIP_AT;
  return (
    <View style={{ alignItems: 'center', gap: 6, width: 20 }}>
      <Animated.View
        style={[
          { width: 20, height: 20, borderRadius: 10, backgroundColor: slip ? 'transparent' : t.ic, borderWidth: slip ? 3 : 0, borderColor: t.ic },
          pop(v, 0.3),
        ]}
      />
      <Text style={{ fontFamily: font.bodyBold, fontSize: 11, lineHeight: 14, color: c.muted, width: 60, textAlign: 'center', opacity: slip ? 1 : 0 }}>
        One slip
      </Text>
    </View>
  );
}

/* the same small label everywhere in these pictures */
function Lbl({ x, y, s, fill, anchor = 'middle' }: { x: number; y: number; s: string; fill: string; anchor?: 'start' | 'middle' | 'end' }) {
  return (
    <SvgText x={x} y={y} fontSize={13} fontWeight="700" fill={fill} textAnchor={anchor} fontFamily={font.bodyBold}>
      {s}
    </SvgText>
  );
}
const FILL = { position: 'absolute' as const, left: 0, top: 0, right: 0, bottom: 0 };

/* a habit worn in like a path: it climbs, dips once on a missed day, and climbs on past where it was */
function PathDip({ t }: { t: Tone }) {
  const c = useTheme();
  const a = useAppear(150, 700);
  const dip = useAppear(850, 360, Easing.out(Easing.back(1.6)));
  const b = useAppear(1150, 800);
  return (
    <View
      style={{ width: 320, maxWidth: '100%', height: 170 }}
      accessible
      accessibilityLabel="A line climbs, dips on one missed day, and climbs on past where it was">
      <Animated.View style={[FILL, { opacity: a }]}>
        <Svg width="100%" height={170} viewBox="0 0 330 170">
          <Path d="M20 140 C60 132 100 110 138 98 C150 94 156 110 166 112" fill="none" stroke={t.ic} strokeWidth={6} strokeLinecap="round" />
        </Svg>
      </Animated.View>
      <Animated.View style={[FILL, pop(dip, 0.4)]}>
        <Svg width="100%" height={170} viewBox="0 0 330 170">
          <Circle cx={166} cy={112} r={9} fill={c.bg} stroke={t.ic} strokeWidth={3} />
          <Lbl x={166} y={142} s="One missed day" fill={c.muted} />
        </Svg>
      </Animated.View>
      <Animated.View style={[FILL, { opacity: b }]}>
        <Svg width="100%" height={170} viewBox="0 0 330 170">
          <Path d="M166 112 C178 114 184 98 198 90 C240 66 276 52 310 38" fill="none" stroke={t.ic} strokeWidth={6} strokeLinecap="round" />
          <Lbl x={310} y={22} s="Back on the path" fill={t.ic} anchor="end" />
        </Svg>
      </Animated.View>
    </View>
  );
}

/* the same twelve days twice: memory keeps the last, hard night and lets the rest fade; the log keeps every one */
const MEM_DAYS = 12;
function Memory({ t }: { t: Tone }) {
  const c = useTheme();
  const top = useAppear(150, 420);
  const row = (log: boolean) => (
    <View style={{ flexDirection: 'row', gap: 7 }}>
      {Array.from({ length: MEM_DAYS }, (_, i) => (
        <MemDot key={i} i={i} log={log} t={t} />
      ))}
    </View>
  );
  const label = (s: string, hot: boolean) => <Text style={{ fontFamily: font.bodyBold, fontSize: 13, color: hot ? t.ic : c.muted }}>{s}</Text>;
  return (
    <View
      style={{ width: '100%', maxWidth: 330, gap: 8, alignItems: 'center' }}
      accessible
      accessibilityLabel="Memory keeps the last hard night. The log keeps all twelve days">
      <Animated.View style={[{ alignItems: 'center', gap: 8 }, { opacity: top }]}>
        {label('What memory keeps', false)}
        {row(false)}
      </Animated.View>
      <View style={{ height: 14 }} />
      {label('What your log keeps', true)}
      {row(true)}
    </View>
  );
}
function MemDot({ i, log, t }: { i: number; log: boolean; t: Tone }) {
  const v = useAppear(log ? 700 + i * 90 : 150, 300, Easing.out(Easing.back(1.8)));
  const slip = i === MEM_DAYS - 1;
  const faded = !log && !slip;
  return (
    <Animated.View
      style={[
        {
          width: 20,
          height: 20,
          borderRadius: 10,
          backgroundColor: slip ? 'transparent' : t.ic,
          borderWidth: slip ? 3 : 0,
          borderColor: t.ic,
        },
        faded ? { opacity: 0.12 } : pop(v, 0.3),
      ]}
    />
  );
}

/* one small screen for pictures: blocks fall in and fill it, and the picture behind them shrinks and fades */
const CELL = 24;
const COLS = 6;
const ROWS = 3;
function Screen({ t }: { t: Tone }) {
  const c = useTheme();
  const fade = useAppear(400, 1900, Easing.inOut(Easing.cubic));
  const end = useAppear(2300, 420);
  const side = CELL * COLS + 2 * (COLS - 1) + 20;
  return (
    <View
      style={{ alignItems: 'center', gap: 12 }}
      accessible
      accessibilityLabel="Blocks fill the screen, and the picture behind them fades. One screen, one job">
      <View style={{ width: side, height: side, borderRadius: 18, borderWidth: 3, borderColor: c.line, overflow: 'hidden' }}>
        <Animated.View
          style={{
            ...FILL,
            alignItems: 'center',
            paddingTop: 14,
            opacity: fade.interpolate({ inputRange: [0, 1], outputRange: [0.9, 0.12] }),
            transform: [{ scale: fade.interpolate({ inputRange: [0, 1], outputRange: [1, 0.55] }) }],
          }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: t.soft, borderWidth: 3, borderColor: t.ic }} />
        </Animated.View>
        {Array.from({ length: COLS * ROWS }, (_, k) => (
          <Block key={k} k={k} t={t} side={side} />
        ))}
      </View>
      <Animated.View style={rise(end)}>
        <Text style={{ fontFamily: font.bodyBold, fontSize: 15, color: t.ic }}>One screen, one job</Text>
      </Animated.View>
    </View>
  );
}
function Block({ k, t, side }: { k: number; t: Tone; side: number }) {
  const row = Math.floor(k / COLS);
  const col = k % COLS;
  /* bottom row first, each row left to right, a little out of order so it reads as a game */
  const order = row * COLS + ((col * 7) % COLS);
  const v = useAppear(300 + order * 75, 320, Easing.out(Easing.quad));
  const y = side - 10 - (row + 1) * (CELL + 2) + 2;
  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: 10 + col * (CELL + 2),
        top: y,
        width: CELL,
        height: CELL,
        borderRadius: 5,
        backgroundColor: (row + col) % 3 ? t.ic : t.soft,
        opacity: v,
        transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [-y - CELL, 0] }) }],
      }}
    />
  );
}

/* two rooms: you move to the new one, and the habit stays in the room it lived in */
function Rooms({ t }: { t: Tone }) {
  const c = useTheme();
  const move = useAppear(700, 1100, Easing.inOut(Easing.cubic));
  const end = useAppear(1900, 420);
  const room = (s: string, child?: ReactNode) => (
    <View style={{ alignItems: 'center', gap: 6 }}>
      <View style={{ width: 130, height: 96, borderRadius: 16, borderWidth: 3, borderColor: c.line, alignItems: 'center', justifyContent: 'center' }}>
        {child}
      </View>
      <Text style={{ fontFamily: font.bodyBold, fontSize: 13, color: c.muted }}>{s}</Text>
    </View>
  );
  return (
    <View
      style={{ width: 300, maxWidth: '100%', gap: 12, alignItems: 'center' }}
      accessible
      accessibilityLabel="You move to a new room, and the habit stays behind in the old one">
      <View style={{ flexDirection: 'row', gap: 28 }}>
        {room(
          'The old room',
          <View style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10, backgroundColor: t.soft, marginTop: 30 }}>
            <Text style={{ fontFamily: font.bodyBold, fontSize: 13, color: t.text }}>The habit</Text>
          </View>,
        )}
        {room('A new room')}
      </View>
      {/* you: starts in the old room, above the habit, and walks over to the new one */}
      <Animated.View
        style={{
          position: 'absolute',
          top: 18,
          left: '50%',
          marginLeft: -79 - 24,
          width: 48,
          paddingVertical: 4,
          borderRadius: 12,
          alignItems: 'center',
          backgroundColor: t.ic,
          transform: [{ translateX: move.interpolate({ inputRange: [0, 1], outputRange: [0, 158] }) }],
        }}>
        <Text style={{ fontFamily: font.bodyBold, fontSize: 13, color: t.ink }}>You</Text>
      </Animated.View>
      <Animated.View style={rise(end)}>
        <Text style={{ fontFamily: font.bodyBold, fontSize: 15, color: t.ic }}>Much of it stays behind</Text>
      </Animated.View>
    </View>
  );
}

/* "I cannot" is a rule, and the urge argues with it; "I do not" is a fact, and nothing argues */
function Rule({ t }: { t: Tone }) {
  const c = useTheme();
  const a = useAppear(150, 420);
  const argue = useAppear(700, 380, Easing.out(Easing.back(1.6)));
  const b = useAppear(1300, 420);
  const pill = (s: string, hot: boolean) => (
    <View
      style={{
        alignSelf: 'flex-start',
        paddingVertical: 10,
        paddingHorizontal: 18,
        borderRadius: 14,
        backgroundColor: hot ? t.ic : 'transparent',
        borderWidth: 3,
        borderColor: hot ? t.ic : c.line,
      }}>
      <Text style={{ fontFamily: font.display, fontSize: 20, color: hot ? t.ink : c.ink }}>{s}</Text>
    </View>
  );
  const sub = (s: string, hot: boolean) => <Text style={{ fontFamily: font.bodyBold, fontSize: 13, color: hot ? t.ic : c.muted }}>{s}</Text>;
  return (
    <View
      style={{ width: 300, maxWidth: '100%', gap: 22 }}
      accessible
      accessibilityLabel="I cannot is a rule on you, and it gets argued with. I do not is a fact about you">
      <Animated.View style={[{ gap: 6 }, rise(a)]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          {pill('“I cannot”', false)}
          <Animated.View
            style={[{ paddingVertical: 6, paddingHorizontal: 10, borderRadius: 12, borderBottomLeftRadius: 2, backgroundColor: c.line }, pop(argue, 0.5)]}>
            <Text style={{ fontFamily: font.bodyBold, fontSize: 13, color: c.ink }}>But just once?</Text>
          </Animated.View>
        </View>
        {sub('A rule on you', false)}
      </Animated.View>
      <Animated.View style={[{ gap: 6 }, rise(b)]}>
        {pill('“I do not”', true)}
        {sub('A fact about you', true)}
      </Animated.View>
    </View>
  );
}

/* closeness built in turns: you share a little, they share a little, and it fills a third with each turn */
function Turns({ t }: { t: Tone }) {
  const c = useTheme();
  return (
    <View
      style={{ width: 300, maxWidth: '100%', gap: 10 }}
      accessible
      accessibilityLabel="You share a little, they share a little, and closeness fills with each turn">
      {['You share a little', 'They share a little', 'You share a little'].map((s, i) => (
        <TurnSay key={i} i={i} s={s} t={t} />
      ))}
      <Text style={{ fontFamily: font.bodyBold, fontSize: 13, color: c.muted, marginTop: 4 }}>Closeness</Text>
      <View style={{ flexDirection: 'row', height: 18, borderRadius: 9, backgroundColor: t.soft, overflow: 'hidden' }}>
        {[0, 1, 2].map((i) => (
          <ReadyFill key={i} i={i} t={t} />
        ))}
      </View>
    </View>
  );
}
function TurnSay({ i, s, t }: { i: number; s: string; t: Tone }) {
  const v = useAppear(200 + i * 650, 380, Easing.out(Easing.back(1.4)));
  const you = i % 2 === 0;
  return (
    <Animated.View
      style={[
        {
          alignSelf: you ? 'flex-start' : 'flex-end',
          paddingVertical: 8,
          paddingHorizontal: 14,
          borderRadius: 16,
          backgroundColor: you ? t.ic : t.soft,
          ...(you ? { borderBottomLeftRadius: 4 } : { borderBottomRightRadius: 4 }),
        },
        pop(v, 0.6),
      ]}>
      <Text style={{ fontFamily: font.bodyBold, fontSize: 15, color: you ? t.ink : t.text }}>{s}</Text>
    </Animated.View>
  );
}

/* the road home: the son is still far off, and the father runs the rest of the way to meet him */
function Home({ t }: { t: Tone }) {
  const c = useTheme();
  const run = useAppear(600, 1300, Easing.out(Easing.cubic));
  const end = useAppear(1900, 420);
  return (
    <View
      style={{ width: 320, maxWidth: '100%', height: 150 }}
      accessible
      accessibilityLabel="Still far off on the road, and the father runs the rest of the way">
      <Svg width="100%" height={150} viewBox="0 0 330 150" style={FILL}>
        <Path d="M20 96 H310" stroke={c.line} strokeWidth={4} strokeLinecap="round" />
        <Circle cx={46} cy={80} r={10} fill={c.muted} />
        <Lbl x={46} y={124} s="Still far off" fill={c.muted} />
        <Lbl x={300} y={124} s="Home" fill={c.muted} anchor="end" />
      </Svg>
      <Animated.View style={[FILL, { transform: [{ translateX: run.interpolate({ inputRange: [0, 1], outputRange: [0, -218] }) }] }]}>
        <Svg width="100%" height={150} viewBox="0 0 330 150">
          <Circle cx={292} cy={76} r={14} fill={t.ic} />
        </Svg>
      </Animated.View>
      <Animated.View style={[FILL, rise(end)]}>
        <Svg width="100%" height={150} viewBox="0 0 330 150">
          <Lbl x={165} y={40} s="He ran the rest of the way" fill={t.ic} />
        </Svg>
      </Animated.View>
    </View>
  );
}

/* the way on, with a side gate marked "just to test myself": the walker goes by it and stays clear */
function Gate({ t }: { t: Tone }) {
  const c = useTheme();
  const walk = useAppear(500, 1800, Easing.inOut(Easing.cubic));
  const end = useAppear(2200, 420);
  return (
    <View
      style={{ width: 320, maxWidth: '100%', height: 160 }}
      accessible
      accessibilityLabel="The path passes a side gate marked just to test myself, and the walker stays clear of it">
      <Svg width="100%" height={160} viewBox="0 0 330 160" style={FILL}>
        <Path d="M20 120 H310" stroke={c.line} strokeWidth={4} strokeLinecap="round" />
        <Path d="M165 120 V72" stroke={c.line} strokeWidth={4} strokeLinecap="round" strokeDasharray="2 9" />
        <Path d="M141 72 V34 M189 72 V34 M141 44 Q165 30 189 44" fill="none" stroke={c.muted} strokeWidth={4} strokeLinecap="round" />
        <Path d="M153 72 V41 M165 72 V38 M177 72 V41" fill="none" stroke={c.muted} strokeWidth={2.5} strokeLinecap="round" />
        <Circle cx={141} cy={32} r={4} fill={c.muted} />
        <Circle cx={189} cy={32} r={4} fill={c.muted} />
        <Lbl x={165} y={16} s="Just to test myself" fill={c.muted} />
      </Svg>
      <Animated.View style={[FILL, { transform: [{ translateX: walk.interpolate({ inputRange: [0, 1], outputRange: [0, 258] }) }] }]}>
        <Svg width="100%" height={160} viewBox="0 0 330 160">
          <Circle cx={30} cy={106} r={12} fill={t.ic} />
        </Svg>
      </Animated.View>
      <Animated.View style={[FILL, rise(end)]}>
        <Svg width="100%" height={160} viewBox="0 0 330 160">
          <Lbl x={310} y={150} s="Staying clear" fill={t.ic} anchor="end" />
        </Svg>
      </Animated.View>
    </View>
  );
}

export function BigNumber({ n, s }: { n: string | number; s?: string }) {
  const c = useTheme();
  const shown = useCount(n);
  return (
    <View style={{ alignItems: 'center', gap: 2 }} accessible accessibilityLabel={[String(n), s].filter(Boolean).join(' ')}>
      <Text style={{ fontFamily: font.display, fontSize: 96, lineHeight: 100, color: c.accent, fontVariant: ['tabular-nums'] }}>{shown}</Text>
      {s ? <Text style={{ fontFamily: font.bodySemi, fontSize: 17, maxWidth: 260, textAlign: 'center', color: c.ink, lineHeight: 22 }}>{s}</Text> : null}
    </View>
  );
}

/* a whole number counts up from zero; anything else (a word, "1 in 4") shows as it is */
export function useCount(n: string | number) {
  const to = /^\d{1,6}$/.test(String(n)) ? Number(n) : null;
  const still = useReducedMotion();
  const [x, setX] = useState(0);
  useEffect(() => {
    if (to == null || still) return;
    const t0 = Date.now();
    let raf = 0;
    const tick = () => {
      const k = Math.min(1, (Date.now() - t0) / 900);
      setX(Math.round(to * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, still]);
  return to == null || still ? n : x;
}

export function LessonArt({ art, ic, t, st }: { art: Art; ic: string; t: Tone; st: Settings | null }) {
  const [k, o] = art as [string, Record<string, unknown>];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const opts = (o || {}) as any;
  if (k === 'snow') return <Snow t={t} o={opts} />;
  if (k === 'loop') return <Loop t={t} o={opts} st={st} />;
  if (k === 'chain') return <Chain nodes={(opts as { n?: string[] }).n || []} icons={(opts as { i?: string[] }).i} t={t} />;
  if (k === 'wave') return <Wave t={t} al={(opts as { al?: string }).al} />;
  if (k === 'big') return <BigNumber n={(opts as { n: string }).n} s={(opts as { s?: string }).s} />;
  if (k === 'shield') return <LxShield t={t} />;
  if (k === 'ready') return <Ready t={t} />;
  if (k === 'want') return <Want t={t} />;
  if (k === 'dots') return <Dots t={t} />;
  if (k === 'path') return <PathDip t={t} />;
  if (k === 'memory') return <Memory t={t} />;
  if (k === 'screen') return <Screen t={t} />;
  if (k === 'rooms') return <Rooms t={t} />;
  if (k === 'rule') return <Rule t={t} />;
  if (k === 'turns') return <Turns t={t} />;
  if (k === 'home') return <Home t={t} />;
  if (k === 'gate') return <Gate t={t} />;
  if (k === 'research') {
    const key = (opts as { k: string }).k;
    return TALK_CARDS.some((x) => x.k === key) ? <TalkArtView k={key as TalkArt} /> : <RkArtView k={key as RkArt} />;
  }
  return <LxIco name={(opts as { ic?: string }).ic || ic} t={t} />;
}
