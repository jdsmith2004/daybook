/* The pictures for Talk it through's research cards (core: talk.ts, TALK_CARDS). Each one shows its idea in motion:
   the chain of small choices, calm-you guessing low, the replay loop getting louder, a permission thought stamped as
   a thought, all-or-nothing against a gentle climb, a balance between two wants, curiosity calming the wave, and
   wanting outgrowing liking. They play once (the loop and the balance keep a slow rhythm), and with Reduce Motion on
   they simply show their last frame. */
import type { TalkArt } from '@daybook/core';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { Icon } from '@/components/ui';
import { NATIVE, useReducedMotion } from '@/lib/motion';
import { font, useTheme } from '@/lib/theme';

export const H = 184;
const AnimatedPath = Animated.createAnimatedComponent(Path);

/** the box every research picture sits in; it measures its width and draws once it knows it */
export function ArtFrame({ children }: { children: (w: number) => React.ReactNode }) {
  const c = useTheme();
  const [w, setW] = useState(0);
  return (
    <View
      style={[s.box, { backgroundColor: c.scheme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.7)', borderColor: c.cardEdge }]}
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      {w ? children(w) : null}
    </View>
  );
}

export function TalkArtView({ k }: { k: TalkArt }) {
  return (
    <ArtFrame>
      {(w) =>
        k === 'chain' ? (
          <Chain w={w} />
        ) : k === 'gap' ? (
          <Gap w={w} />
        ) : k === 'loop' ? (
          <Loop w={w} />
        ) : k === 'permit' ? (
          <Permit />
        ) : k === 'cliff' ? (
          <Cliff w={w} />
        ) : k === 'scale' ? (
          <Scale w={w} />
        ) : k === 'lens' ? (
          <Lens w={w} />
        ) : (
          <Liking w={w} />
        )
      }
    </ArtFrame>
  );
}

/* ---------- motion helpers ---------- */
/** 0 to 1 once, after a delay */
export function useOnce(delay: number, duration: number, native = NATIVE, easing = Easing.out(Easing.cubic)) {
  const reduce = useReducedMotion();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduce) {
      v.setValue(1);
      return;
    }
    const a = Animated.timing(v, { toValue: 1, duration, delay, easing, useNativeDriver: native });
    a.start();
    return () => a.stop();
  }, [reduce, v, delay, duration, native, easing]);
  return v;
}
/** 0 to 1 and back, forever, after a delay (stays at rest with Reduce Motion on) */
export function useSway(duration: number, delay = 0) {
  const reduce = useReducedMotion();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduce) return;
    const a = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
        Animated.timing(v, { toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
      ]),
    );
    const id = setTimeout(() => a.start(), delay);
    return () => {
      clearTimeout(id);
      a.stop();
    };
  }, [reduce, v, duration, delay]);
  return v;
}
export const pop = (v: Animated.Value) => ({
  opacity: v.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 1, 1] }),
  transform: [{ scale: v.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.4, 1.12, 1] }) }],
});

export function Label({
  x,
  y,
  text,
  color,
  bold,
  align = 'center',
  width = 110,
}: {
  x: number;
  y: number;
  text: string;
  color: string;
  bold?: boolean;
  align?: 'center' | 'left' | 'right';
  width?: number;
}) {
  const left = align === 'center' ? x - width / 2 : align === 'right' ? x - width : x;
  return <Text style={[s.label, { left, top: y, width, textAlign: align, color, fontFamily: bold ? font.bodyBold : font.bodySemi }]}>{text}</Text>;
}

/* ---------- a slip starts long before the urge ---------- */
function Chain({ w }: { w: number }) {
  const c = useTheme();
  const n = 5;
  const pad = 34;
  const pts = Array.from({ length: n }, (_, i) => ({ x: pad + (i * (w - pad * 2)) / (n - 1), y: 104 + Math.sin((i / (n - 1)) * Math.PI) * -22 }));
  const show = Array.from({ length: n }, (_, i) => useOnce(150 + i * 230, 420)); // eslint-disable-line react-hooks/rules-of-hooks
  const lines = useOnce(150, 1100);
  const ring = useSway(900, 1500);
  const words = ['a thought', 'a choice', 'a choice', 'alone, phone close', 'the slip'];
  return (
    <>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: lines }]}>
        <Svg width={w} height={H}>
          {pts.slice(1).map((p, i) => (
            <Line key={i} x1={pts[i].x} y1={pts[i].y} x2={p.x} y2={p.y} stroke={c.line} strokeWidth={4} strokeDasharray="2 7" strokeLinecap="round" />
          ))}
        </Svg>
      </Animated.View>
      {pts.map((p, i) => {
        const first = i === 0;
        const last = i === n - 1;
        const r = first ? 17 : 13;
        return (
          <Animated.View key={i} style={[s.abs, { left: p.x - r, top: p.y - r }, pop(show[i])]}>
            {first ? (
              <Animated.View
                style={[
                  s.ringAbs,
                  {
                    width: r * 2,
                    height: r * 2,
                    borderRadius: r,
                    borderColor: c.accent,
                    opacity: ring.interpolate({ inputRange: [0, 1], outputRange: [0.7, 0] }),
                    transform: [{ scale: ring.interpolate({ inputRange: [0, 1], outputRange: [1, 2] }) }],
                  },
                ]}
              />
            ) : null}
            <View
              style={{
                width: r * 2,
                height: r * 2,
                borderRadius: r,
                backgroundColor: first ? c.accent : last ? c.coral : c.surface,
                borderWidth: first || last ? 0 : 3,
                borderColor: c.line,
              }}
            />
          </Animated.View>
        );
      })}
      {pts.map((p, i) => (
        <Label
          key={i}
          x={p.x}
          y={p.y + (i === 0 ? 24 : 20)}
          width={i === 3 ? 84 : 70}
          text={words[i]}
          color={i === 0 ? c.accentText : c.muted}
          bold={i === 0}
        />
      ))}
      <Label x={pts[0].x - 12} y={pts[0].y - 46} align="left" width={150} text="You are here" color={c.accentText} bold />
    </>
  );
}

/* ---------- calm you guesses low ---------- */
function Gap({ w }: { w: number }) {
  const c = useTheme();
  const guess = useOnce(250, 900);
  const later = useOnce(1050, 1100);
  const TH = 88;
  const tube = (x: number, v: Animated.Value, frac: number, color: string, word: string, sub: string) => (
    <>
      <View style={[s.tube, { left: x - 17, top: 14, height: TH, borderColor: c.line, backgroundColor: c.surface }]}>
        <Animated.View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: TH,
            backgroundColor: color,
            transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [TH, TH * (1 - frac)] }) }],
          }}
        />
      </View>
      <View style={[s.bulb, { left: x - 22, top: 14 + TH - 14, backgroundColor: color, borderColor: c.surface }]} />
      <Label x={x} y={TH + 50} text={word} color={c.ink} bold width={140} />
      <Label x={x} y={TH + 67} text={sub} color={c.muted} width={140} />
    </>
  );
  return (
    <>
      {tube(w * 0.3, guess, 0.28, c.mint, 'Your guess now', 'calm, it seems small')}
      {tube(w * 0.7, later, 0.9, c.coral, 'The pull later', 'stronger than guessed')}
    </>
  );
}

/* ---------- going over it turns the volume up ---------- */
function Loop({ w }: { w: number }) {
  const c = useTheme();
  const reduce = useReducedMotion();
  const spin = useRef(new Animated.Value(0)).current;
  const grow = useRef(new Animated.Value(reduce ? 1 : 0)).current;
  useEffect(() => {
    if (reduce) return;
    const lap = 1800;
    const a = Animated.loop(
      Animated.parallel([
        Animated.timing(spin, { toValue: 3, duration: lap * 3, easing: Easing.linear, useNativeDriver: NATIVE }),
        Animated.sequence([
          Animated.timing(grow, { toValue: 1, duration: lap * 3 - 500, easing: Easing.in(Easing.quad), useNativeDriver: NATIVE }),
          Animated.timing(grow, { toValue: 0, duration: 500, useNativeDriver: NATIVE }),
        ]),
      ]),
    );
    a.start();
    return () => a.stop();
  }, [reduce, spin, grow]);
  const cx = w / 2;
  const cy = 88;
  const R = 62;
  return (
    <>
      <Svg width={w} height={H} style={StyleSheet.absoluteFill}>
        <Circle cx={cx} cy={cy} r={R} stroke={c.line} strokeWidth={3} strokeDasharray="3 8" strokeLinecap="round" fill="none" />
      </Svg>
      <Animated.View
        style={[
          s.abs,
          {
            left: cx - 34,
            top: cy - 34,
            width: 68,
            height: 68,
            borderRadius: 34,
            backgroundColor: c.coralSoft,
            alignItems: 'center',
            justifyContent: 'center',
            transform: [{ scale: grow.interpolate({ inputRange: [0, 1], outputRange: [0.75, 1.35] }) }],
          },
        ]}>
        <Icon name="wave" size={26} color={c.coralText} />
      </Animated.View>
      <Animated.View
        style={[
          s.abs,
          {
            left: cx - R - 9,
            top: cy - R - 9,
            width: (R + 9) * 2,
            height: (R + 9) * 2,
            transform: [{ rotate: spin.interpolate({ inputRange: [0, 3], outputRange: ['0deg', '1080deg'] }) }],
          },
        ]}>
        <View style={{ position: 'absolute', left: R, top: 0, width: 18, height: 18, borderRadius: 9, backgroundColor: c.accent }} />
      </Animated.View>
      <Label x={cx} y={2} text="picture it" color={c.muted} />
      <Label x={cx + R + 6} y={cy + 30} align="left" text="the pull" color={c.muted} />
      <Label x={cx - R - 6} y={cy + 30} align="right" text="again" color={c.muted} />
      <Label x={cx} y={H - 26} width={220} text="each lap, a little louder" color={c.coralText} bold />
    </>
  );
}

/* ---------- a permission thought ---------- */
function Permit() {
  const c = useTheme();
  const bubble = useOnce(150, 600, NATIVE, Easing.out(Easing.back(1.6)));
  const stamp = useOnce(1100, 380, NATIVE, Easing.out(Easing.back(2)));
  return (
    <View style={s.center}>
      <Animated.View style={[s.bubble, { backgroundColor: c.surface, shadowColor: c.lip }, pop(bubble)]}>
        <Text style={[s.bubbleT, { color: c.ink }]}>“I earned it.”</Text>
        <View style={[s.tail, { borderTopColor: c.surface }]} />
      </Animated.View>
      <Animated.View
        style={[
          s.stamp,
          {
            borderColor: c.accent,
            opacity: stamp,
            transform: [{ rotate: '-7deg' }, { scale: stamp.interpolate({ inputRange: [0, 1], outputRange: [1.8, 1] }) }],
          },
        ]}>
        <Text style={[s.stampT, { color: c.accentText }]}>A THOUGHT, NOT AN ORDER</Text>
      </Animated.View>
    </View>
  );
}

/* ---------- all or nothing, against a gentle climb ---------- */
function Cliff({ w }: { w: number }) {
  const c = useTheme();
  const L = 900;
  const a = useOnce(200, 1300, false, Easing.inOut(Easing.cubic));
  const b = useOnce(1500, 1700, false, Easing.inOut(Easing.cubic));
  const dot = useOnce(2400, 400);
  const x = (f: number) => 18 + f * (w - 36);
  const base = 128;
  const cliff = `M${x(0)} ${base} L${x(0.48)} 46 L${x(0.5)} ${base} L${x(1)} ${base}`;
  const climb = `M${x(0)} ${base} C ${x(0.2)} 112, ${x(0.34)} 74, ${x(0.48)} 54 C ${x(0.52)} 48, ${x(0.55)} 70, ${x(0.6)} 68 C ${x(0.75)} 62, ${x(0.88)} 30, ${x(1)} 16`;
  const key = (color: string, word: string, faint?: boolean) => (
    <View style={s.keyItem}>
      <View style={[s.keySw, { backgroundColor: color, opacity: faint ? 0.7 : 1 }]} />
      <Text style={[s.keyT, { color: c.ink }]}>{word}</Text>
    </View>
  );
  return (
    <>
      <Svg width={w} height={H} style={StyleSheet.absoluteFill}>
        <Line x1={x(0)} y1={base} x2={x(1)} y2={base} stroke={c.line} strokeWidth={2} />
        <AnimatedPath
          d={cliff}
          stroke={c.muted}
          strokeOpacity={0.7}
          strokeWidth={4}
          strokeLinejoin="round"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${L}`}
          strokeDashoffset={a.interpolate({ inputRange: [0, 1], outputRange: [L, 0] })}
        />
        <AnimatedPath
          d={climb}
          stroke={c.accent}
          strokeWidth={5}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${L}`}
          strokeDashoffset={b.interpolate({ inputRange: [0, 1], outputRange: [L, 0] })}
        />
      </Svg>
      <Animated.View style={[s.abs, { left: x(0.555) - 8, top: 62 - 8, width: 16, height: 16, borderRadius: 8, backgroundColor: c.coral }, pop(dot)]} />
      <Animated.View style={[s.abs, { left: x(0.555) + 10, top: 70 }, { opacity: dot }]}>
        <Text style={[s.keyT, { color: c.coralText, fontFamily: font.bodyBold }]}>a slip</Text>
      </Animated.View>
      <View style={[s.key, { top: base + 14 }]}>
        {key(c.muted, 'All or nothing: back to zero', true)}
        {key(c.accent, 'A gentle climb: it holds')}
      </View>
    </>
  );
}

/* ---------- two wants at once ---------- */
function Scale({ w }: { w: number }) {
  const c = useTheme();
  const v = useSway(2200);
  const cx = w / 2;
  const half = Math.min(118, w * 0.36);
  const tilt = v.interpolate({ inputRange: [0, 1], outputRange: ['-7deg', '7deg'] });
  const drop = half * Math.sin((7 * Math.PI) / 180);
  const pan = (side: -1 | 1, word: string, color: string, ink: string) => (
    <Animated.View
      style={[
        s.abs,
        {
          left: cx + side * half - 56,
          top: 70,
          width: 112,
          alignItems: 'center',
          transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [-side * drop, side * drop] }) }],
        },
      ]}>
      <View style={{ width: 2, height: 22, backgroundColor: c.line }} />
      <View style={[s.pan, { backgroundColor: color }]}>
        <Text style={[s.panT, { color: ink }]}>{word}</Text>
      </View>
    </Animated.View>
  );
  return (
    <>
      <Animated.View
        style={[s.abs, { left: cx - half, top: 66, width: half * 2, height: 6, borderRadius: 3, backgroundColor: c.ink, transform: [{ rotate: tilt }] }]}
      />
      {pan(-1, 'wanting it', c.coralSoft, c.coralText)}
      {pan(1, 'wanting change', c.mintSoft, c.mintText)}
      <Svg width={w} height={H} style={StyleSheet.absoluteFill}>
        <Path d={`M${cx} 70 L${cx - 18} 150 L${cx + 18} 150 Z`} fill={c.line} />
      </Svg>
      <View style={[s.abs, { left: cx - 9, top: 60, width: 18, height: 18, borderRadius: 9, backgroundColor: c.accent }]} />
      <Label x={cx} y={156} width={240} text="both are real, and it moves" color={c.muted} />
    </>
  );
}

/* ---------- curiosity calms the wave ---------- */
function Lens({ w }: { w: number }) {
  const c = useTheme();
  const v = useOnce(300, 2600, NATIVE, Easing.inOut(Easing.cubic));
  const wave = Array.from({ length: 9 }, (_, i) => {
    const x0 = 14 + (i * (w - 28)) / 8;
    const x1 = 14 + ((i + 1) * (w - 28)) / 8;
    return `Q ${(x0 + x1) / 2} ${i % 2 ? 128 : 48}, ${x1} 88`;
  }).join(' ');
  return (
    <>
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ scaleY: v.interpolate({ inputRange: [0, 1], outputRange: [1, 0.3] }) }] }]}>
        <Svg width={w} height={H}>
          <Path d={`M14 88 ${wave}`} stroke={c.coral} strokeOpacity={0.75} strokeWidth={4} strokeLinecap="round" fill="none" />
        </Svg>
      </Animated.View>
      <Animated.View
        style={[
          s.abs,
          {
            left: 0,
            top: 46,
            transform: [{ translateX: v.interpolate({ inputRange: [0, 1], outputRange: [10, w - 96] }) }],
          },
        ]}>
        <View style={[s.lens, { borderColor: c.accent, backgroundColor: c.scheme === 'dark' ? 'rgba(185,166,255,0.18)' : 'rgba(123,92,240,0.12)' }]} />
        <View style={[s.handle, { backgroundColor: c.accent }]} />
      </Animated.View>
      <Label x={w / 2} y={H - 28} width={240} text="noticing it closely, it settles" color={c.accentText} bold />
    </>
  );
}

/* ---------- wanting is not liking ---------- */
function Liking({ w }: { w: number }) {
  const c = useTheme();
  const want = useOnce(250, 1400, NATIVE, Easing.out(Easing.quad));
  const like = useOnce(700, 800);
  const BH = 120;
  const bar = (x: number, v: Animated.Value, frac: number, color: string, word: string) => (
    <>
      <View style={[s.bar, { left: x - 26, top: 20, height: BH, backgroundColor: c.surface2 }]}>
        <Animated.View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: BH,
            borderRadius: 14,
            backgroundColor: color,
            transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [BH, BH * (1 - frac)] }) }],
          }}
        />
      </View>
      <Label x={x} y={20 + BH + 8} text={word} color={c.ink} bold />
    </>
  );
  return (
    <>
      {bar(w * 0.34, want, 0.95, c.coral, 'Wanting')}
      {bar(w * 0.66, like, 0.3, c.sun, 'Liking')}
    </>
  );
}

const s = StyleSheet.create({
  box: { alignSelf: 'stretch', height: H, borderRadius: 24, borderWidth: 2, overflow: 'hidden' },
  abs: { position: 'absolute' },
  ringAbs: { position: 'absolute', left: 0, top: 0, borderWidth: 3 },
  label: { position: 'absolute', fontSize: 12.5, lineHeight: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 22 },
  tube: { position: 'absolute', width: 34, borderRadius: 17, borderWidth: 3, overflow: 'hidden' },
  bulb: { position: 'absolute', width: 44, height: 44, borderRadius: 22, borderWidth: 4 },
  bubble: {
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 22,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  bubbleT: { fontFamily: font.display, fontSize: 26, lineHeight: 32 },
  tail: {
    position: 'absolute',
    bottom: -12,
    left: 34,
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 14,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  stamp: { borderWidth: 3, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  stampT: { fontFamily: font.bodyBold, fontSize: 13.5, letterSpacing: 1.2 },
  pan: { minWidth: 104, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 14, alignItems: 'center' },
  panT: { fontFamily: font.bodyBold, fontSize: 13 },
  lens: { width: 64, height: 64, borderRadius: 32, borderWidth: 5 },
  handle: { position: 'absolute', left: 54, top: 56, width: 30, height: 9, borderRadius: 5, transform: [{ rotate: '45deg' }] },
  bar: { position: 'absolute', width: 52, borderRadius: 14, overflow: 'hidden' },
  key: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    columnGap: 14,
    rowGap: 4,
    paddingHorizontal: 10,
  },
  keyItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  keySw: { width: 14, height: 5, borderRadius: 3 },
  keyT: { fontFamily: font.bodySemi, fontSize: 12.5 },
});
