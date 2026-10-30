/* The picture on a lesson card: an icon in a circle, a chain of steps, a wave, a snowball, your loop, a big number, a shield,
   a check mark, or one of the moving research pictures from Talk it through and Rekindle. Ported from the legacy lxArt and friends, in the lesson's unit color. Each one settles in once when it
   appears: the icons pop in, a chain shows one step at a time, a dot rides the wave up and over, and a big number counts up.
   With Reduce Motion on, they show as they end. */
import { lxLoopNodes, TALK_CARDS, type Art, type RkArt, type Settings, type TalkArt } from '@daybook/core';
import { useEffect, useState, type ReactNode } from 'react';
import { Animated, Easing, View } from 'react-native';
import { Text } from '@/components/text';
import Svg, { Circle, G, Path, Rect, Text as SvgText } from 'react-native-svg';

import { RkArtView } from '@/components/rk-art';
import { TalkArtView } from '@/components/talk-art';
import { Icon } from '@/components/ui';
import { pop, rise, useAppear, useReducedMotion } from '@/lib/motion';
import { font, useTheme, type Tone } from '@/lib/theme';

export function LxIco({ name, t, size = 120 }: { name: string; t: Tone; size?: number }) {
  const v = useAppear(0, 380);
  return (
    <Animated.View
      style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: t.soft, alignItems: 'center', justifyContent: 'center' }, pop(v)]}>
      <Icon name={name || 'sparkle'} size={size * 0.47} color={t.ic} />
    </Animated.View>
  );
}

export function LxShield({ t }: { t: Tone }) {
  const c = useTheme();
  const v = useAppear(0, 420);
  return (
    <Animated.View style={pop(v)}>
      <Svg width={120} height={120} viewBox="0 0 120 120" accessibilityLabel="A shield">
        <Circle cx={60} cy={60} r={56} fill={t.soft} />
        <Path d="M60 26l26 11v20c0 18-11 30-26 37-15-7-26-19-26-37V37z" fill={c.surface} stroke={t.ic} strokeWidth={4} strokeLinejoin="round" />
        <Path d="M48 58l8 8 16-17" fill="none" stroke={t.ic} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
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
  const c = useTheme();
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
                paddingHorizontal: 14,
                borderRadius: 16,
                backgroundColor: hot ? t.ic : t.soft,
              }}>
              {icons && icons[i] ? (
                <View style={{ width: 30, height: 30, borderRadius: 10, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={icons[i]} size={18} color={t.text} />
                </View>
              ) : null}
              <Text style={{ fontFamily: font.display, fontSize: dense ? 16 : 19, color: hot ? t.ink : t.text }}>{n}</Text>
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
        <SvgText x={52} y={146} fontSize={11} fontWeight="700" letterSpacing={1.1} fill={c.muted} textAnchor="middle" fontFamily={font.bodyBold}>
          RISES
        </SvgText>
        <SvgText x={165} y={14} fontSize={11} fontWeight="700" letterSpacing={1.1} fill={c.muted} textAnchor="middle" fontFamily={font.bodyBold}>
          PEAKS
        </SvgText>
        <SvgText x={278} y={146} fontSize={11} fontWeight="700" letterSpacing={1.1} fill={c.muted} textAnchor="middle" fontFamily={font.bodyBold}>
          PASSES
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
      <SvgText x={43} y={16} fontSize={11} fontWeight="700" letterSpacing={1.1} fill={c.muted} textAnchor="middle" fontFamily={font.bodyBold}>
        {o.a || 'ONE SLIP'}
      </SvgText>
      <SvgText x={288} y={103} fontSize={11} fontWeight="700" letterSpacing={1.1} fill={t.ink} textAnchor="middle" fontFamily={font.bodyBold}>
        {o.b || 'GIVING UP'}
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
        <Text style={{ fontFamily: font.body, fontSize: 13, color: c.muted, textAlign: 'center' }}>…and back to the start. {o.c || 'YOUR LOOP'}</Text>
      </View>
    );
  const box = (x: number, y: number, s: string) => (
    <G key={s + x + y}>
      <Rect x={x} y={y} width={112} height={48} rx={16} fill={t.soft} />
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
      <SvgText x={165} y={100} fontSize={11} fontWeight="700" letterSpacing={1.1} fill={c.muted} textAnchor="middle" fontFamily={font.bodyBold}>
        {o.c || 'YOUR LOOP'}
      </SvgText>
    </Svg>
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
function useCount(n: string | number) {
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
  if (k === 'research') {
    const key = (opts as { k: string }).k;
    return TALK_CARDS.some((x) => x.k === key) ? <TalkArtView k={key as TalkArt} /> : <RkArtView k={key as RkArt} />;
  }
  return <LxIco name={(opts as { ic?: string }).ic || ic} t={t} />;
}
