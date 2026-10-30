/* The pictures for Rekindle's "What just happened" cards (core: rekindle-learn.ts, RK_LEARN), and the comebacks chart.
   Each card shows its idea in motion: the rush and how fast it is over, an urge as a wave you can watch, a low that
   ends sooner than it says, a feeling named and settling, guilt against shame, the two paths after one slip, change
   that loops but climbs, and kindness that makes people try harder. They play once (the wave keeps a slow rhythm),
   and with Reduce Motion on they simply show their last frame. */
import type { RkArt } from '@daybook/core';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { Appear } from '@/components/appear';
import { ArtFrame, H, Label, pop, useOnce, useSway } from '@/components/talk-art';
import { Icon } from '@/components/ui';
import { NATIVE, useReducedMotion } from '@/lib/motion';
import { font, useTheme } from '@/lib/theme';

const AnimatedPath = Animated.createAnimatedComponent(Path);

export function RkArtView({ k }: { k: RkArt }) {
  return (
    <ArtFrame>
      {(w) =>
        k === 'rush' ? (
          <Rush w={w} />
        ) : k === 'wave' ? (
          <Wave w={w} />
        ) : k === 'crash' ? (
          <Crash w={w} />
        ) : k === 'name' ? (
          <Name w={w} />
        ) : k === 'shame' ? (
          <Shame />
        ) : k === 'trap' ? (
          <Trap w={w} />
        ) : k === 'cycle' ? (
          <Cycle w={w} />
        ) : (
          <Kind w={w} />
        )
      }
    </ArtFrame>
  );
}

/** a line that draws itself */
function Draw({ d, v, color, width = 5, len = 900, dash }: { d: string; v: Animated.Value; color: string; width?: number; len?: number; dash?: boolean }) {
  return (
    <AnimatedPath
      d={d}
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      strokeDasharray={dash ? undefined : `${len}`}
      strokeDashoffset={dash ? undefined : v.interpolate({ inputRange: [0, 1], outputRange: [len, 0] })}
      opacity={dash ? v : 1}
    />
  );
}

/* ---------- the rush, and how fast it is over ---------- */
function Rush({ w }: { w: number }) {
  const c = useTheme();
  const line = useOnce(200, 1500, false, Easing.inOut(Easing.cubic));
  const peak = useOnce(900, 420);
  const after = useOnce(1500, 500);
  const x = (f: number) => 18 + f * (w - 36);
  const base = 138;
  const d = `M${x(0)} ${base} L${x(0.3)} ${base} C ${x(0.38)} ${base}, ${x(0.4)} 30, ${x(0.46)} 30 S ${x(0.54)} ${base}, ${x(0.62)} ${base} L${x(1)} ${base}`;
  return (
    <>
      <Svg width={w} height={H} style={StyleSheet.absoluteFill}>
        <Line x1={x(0)} y1={base} x2={x(1)} y2={base} stroke={c.line} strokeWidth={2} strokeDasharray="3 7" strokeLinecap="round" />
        <Draw d={d} v={line} color={c.slip} />
      </Svg>
      <Animated.View style={[s.abs, { left: x(0.46) - 8, top: 30 - 8, width: 16, height: 16, borderRadius: 8, backgroundColor: c.slip }, pop(peak)]} />
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: peak }]}>
        <Label x={x(0.46)} y={4} width={120} text="the rush" color={c.ink} bold />
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: after }]}>
        <Label x={x(0.8)} y={base - 26} width={120} text="over fast" color={c.muted} bold />
        <Label x={w / 2} y={H - 26} width={260} text="loud, then gone" color={c.slipText} bold />
      </Animated.View>
    </>
  );
}

/* ---------- an urge is a wave you can watch ---------- */
function Wave({ w }: { w: number }) {
  const c = useTheme();
  const reduce = useReducedMotion();
  const line = useOnce(150, 1200, false, Easing.inOut(Easing.cubic));
  const ride = useRef(new Animated.Value(reduce ? 0.5 : 0)).current;
  useEffect(() => {
    if (reduce) return;
    const a = Animated.loop(
      Animated.sequence([
        Animated.delay(1100),
        Animated.timing(ride, { toValue: 1, duration: 3400, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
        Animated.timing(ride, { toValue: 0, duration: 0, useNativeDriver: NATIVE }),
      ]),
    );
    a.start();
    return () => a.stop();
  }, [reduce, ride]);
  const x0 = 18;
  const x1 = w - 18;
  const base = 132;
  const top = 34;
  /* the wave as a smooth hill: y from the x position */
  const yAt = (f: number) => base - (base - top) * Math.pow(Math.sin(Math.PI * f), 2);
  const N = 24;
  const pts = Array.from({ length: N + 1 }, (_, i) => i / N);
  const d = pts.map((f, i) => (i ? 'L' : 'M') + (x0 + f * (x1 - x0)).toFixed(1) + ' ' + yAt(f).toFixed(1)).join(' ');
  return (
    <>
      <Svg width={w} height={H} style={StyleSheet.absoluteFill}>
        <Line x1={x0} y1={base} x2={x1} y2={base} stroke={c.line} strokeWidth={2} strokeDasharray="3 7" strokeLinecap="round" />
        <Draw d={d} v={line} color={c.sky} width={6} />
      </Svg>
      <Animated.View
        style={[
          s.abs,
          {
            left: -11,
            top: -11,
            width: 22,
            height: 22,
            borderRadius: 11,
            backgroundColor: c.accent,
            borderWidth: 3,
            borderColor: c.surface,
            transform: [
              { translateX: ride.interpolate({ inputRange: pts, outputRange: pts.map((f) => x0 + f * (x1 - x0)) }) },
              { translateY: ride.interpolate({ inputRange: pts, outputRange: pts.map((f) => yAt(f) - 2) }) },
            ],
          },
        ]}
      />
      <Label x={x0 + (x1 - x0) * 0.2} y={base - 22} width={80} text="rises" color={c.muted} />
      <Label x={w / 2} y={6} width={100} text="peaks" color={c.muted} />
      <Label x={x0 + (x1 - x0) * 0.8} y={base - 22} width={80} text="passes" color={c.muted} />
      <Label x={w / 2} y={H - 30} width={260} text="you watch it, you do not obey it" color={c.accentText} bold />
    </>
  );
}

/* ---------- the low ends sooner than it says ---------- */
function Crash({ w }: { w: number }) {
  const c = useTheme();
  const a = useOnce(200, 1100, NATIVE, Easing.out(Easing.cubic));
  const b = useOnce(1200, 700, NATIVE, Easing.out(Easing.cubic));
  const sun = useOnce(1800, 520, NATIVE, Easing.out(Easing.back(1.8)));
  const L = 22;
  const full = w - L * 2;
  const bar = (top: number, frac: number, v: Animated.Value, color: string, word: string) => (
    <>
      <Text style={[s.barWord, { left: L, top, color: c.ink }]}>{word}</Text>
      <View style={[s.track, { left: L, top: top + 24, width: full, backgroundColor: c.surface2 }]}>
        <Animated.View
          style={{
            width: full * frac,
            height: '100%',
            borderRadius: 9,
            backgroundColor: color,
            transform: [{ translateX: v.interpolate({ inputRange: [0, 1], outputRange: [-full * frac, 0] }) }],
          }}
        />
      </View>
    </>
  );
  return (
    <>
      {bar(18, 0.92, a, c.coral, 'How long you expect it to hurt')}
      {bar(84, 0.4, b, c.mint, 'How long it really does')}
      <Animated.View style={[s.abs, { left: L + full * 0.4 + 8, top: 100 }, pop(sun)]}>
        <Icon name="sun" size={30} color={c.sunText} />
      </Animated.View>
      <Label x={w / 2} y={H - 32} width={280} text="the mind recovers faster than it predicts" color={c.mintText} bold />
    </>
  );
}

/* ---------- name it, and it settles ---------- */
function Name({ w }: { w: number }) {
  const c = useTheme();
  const tag = useOnce(700, 520, NATIVE, Easing.out(Easing.back(1.8)));
  const calm = useOnce(1100, 1500, NATIVE, Easing.inOut(Easing.cubic));
  const jag = Array.from({ length: 15 }, (_, i) => {
    const x = 16 + (i * (w - 32)) / 14;
    return (i ? 'L' : 'M') + x.toFixed(1) + ' ' + (i % 2 ? 58 : 126);
  }).join(' ');
  return (
    <>
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ scaleY: calm.interpolate({ inputRange: [0, 1], outputRange: [1, 0.22] }) }] }]}>
        <Svg width={w} height={H}>
          <Path d={jag} stroke={c.coral} strokeOpacity={0.8} strokeWidth={4} strokeLinejoin="round" strokeLinecap="round" fill="none" />
        </Svg>
      </Animated.View>
      <Label x={20} y={8} align="left" width={140} text="the alarm" color={c.coralText} bold />
      <Animated.View style={[s.abs, { left: 0, right: 0, top: 60, alignItems: 'center' }, pop(tag)]}>
        <View style={[s.tag, { backgroundColor: c.surface, shadowColor: c.lip }]}>
          <Icon name="pencil" size={18} color={c.accentText} />
          <Text style={[s.tagT, { color: c.ink }]}>“I feel flat.”</Text>
        </View>
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: calm }]}>
        <Label x={w / 2} y={H - 30} width={260} text="named, it quiets down" color={c.mintText} bold />
      </Animated.View>
    </>
  );
}

/* ---------- guilt against shame ---------- */
function Shame() {
  const c = useTheme();
  const r1 = useOnce(200, 520);
  const a1 = useOnce(650, 500);
  const r2 = useOnce(1150, 520);
  const a2 = useOnce(1600, 500);
  const row = (top: number, said: string, to: string, v: Animated.Value, av: Animated.Value, good: boolean) => {
    const tone = good ? { bg: c.mintSoft, ink: c.mintText, line: c.mint } : { bg: c.coralSoft, ink: c.coralText, line: c.coral };
    return (
      <View style={[s.row, { top }]}>
        <Animated.View style={[s.said, { backgroundColor: c.surface, shadowColor: c.lip }, pop(v)]}>
          <Text style={[s.saidT, { color: c.ink }]}>{said}</Text>
        </Animated.View>
        <Animated.View style={{ opacity: av, transform: [{ translateX: av.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] }) }] }}>
          <Icon name="next" size={22} color={tone.line} />
        </Animated.View>
        <Animated.View style={[s.to, { backgroundColor: tone.bg, opacity: av }]}>
          <Text style={[s.toT, { color: tone.ink }]}>{to}</Text>
        </Animated.View>
      </View>
    );
  };
  return (
    <>
      <Label x={20} y={10} align="left" width={120} text="GUILT" color={c.mintText} bold />
      {row(28, '“I did a bad thing.”', 'make it right', r1, a1, true)}
      <Label x={20} y={98} align="left" width={120} text="SHAME" color={c.coralText} bold />
      {row(116, '“I am bad.”', 'hide', r2, a2, false)}
    </>
  );
}

/* ---------- one slip, two paths ---------- */
function Trap({ w }: { w: number }) {
  const c = useTheme();
  const slip = useOnce(150, 450);
  const bad = useOnce(600, 700);
  const good = useOnce(1300, 1100, false, Easing.inOut(Easing.cubic));
  const end = useOnce(2200, 480, NATIVE, Easing.out(Easing.back(1.8)));
  const sx = 52;
  const ex = w - 52;
  return (
    <>
      <Svg width={w} height={H} style={StyleSheet.absoluteFill}>
        <AnimatedPath
          d={`M${sx + 26} 78 C ${sx + 90} 50, ${ex - 110} 36, ${ex - 26} 40`}
          stroke={c.coral}
          strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray="12 10"
          fill="none"
          opacity={bad}
        />
        <Draw d={`M${sx + 26} 100 C ${sx + 90} 128, ${ex - 110} 140, ${ex - 26} 136`} v={good} color={c.mint} width={6} />
      </Svg>
      <Animated.View style={[s.abs, s.node, { left: sx - 30, top: 59, borderColor: c.ink, backgroundColor: c.surface }, pop(slip)]}>
        <Text style={[s.nodeT, { color: c.ink }]}>One{'\n'}slip</Text>
      </Animated.View>
      <Animated.View style={[s.abs, s.end, { left: ex - 24, top: 16, backgroundColor: c.coralSoft, borderColor: c.coral, opacity: bad }]}>
        <Text style={[s.nodeT, { color: c.coralText }]}>More</Text>
      </Animated.View>
      <Animated.View style={[s.abs, s.end, { left: ex - 24, top: 112, backgroundColor: c.mint, borderColor: c.mint }, pop(end)]}>
        <Icon name="check" size={24} color="#FFFFFF" />
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: bad }]}>
        <Label x={w / 2} y={18} width={180} text="“I already blew it”" color={c.coralText} bold />
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: end }]}>
        <Label x={w / 2} y={150} width={180} text="“just one slip”" color={c.mintText} bold />
      </Animated.View>
    </>
  );
}

/* ---------- change loops, but climbs ---------- */
function Cycle({ w }: { w: number }) {
  const c = useTheme();
  const line = useOnce(200, 2200, false, Easing.inOut(Easing.quad));
  const loops = 3;
  const left = 30;
  const span = w - 96;
  /* a coil that rises: small loops (the slips) on a climb */
  const pt = (t: number) => ({
    x: left + t * span + 22 * Math.sin(2 * Math.PI * loops * t),
    y: 122 - t * 92 + 16 * Math.cos(2 * Math.PI * loops * t) - 16,
  });
  const N = 90;
  const d = Array.from({ length: N + 1 }, (_, i) => {
    const p = pt(i / N);
    return (i ? 'L' : 'M') + p.x.toFixed(1) + ' ' + p.y.toFixed(1);
  }).join(' ');
  const dots = [0.5, 1.5, 2.5].map((k) => pt(k / loops));
  const show = dots.map((_, i) => useOnce(700 + i * 600, 420)); // eslint-disable-line react-hooks/rules-of-hooks
  const flag = useOnce(2300, 520, NATIVE, Easing.out(Easing.back(1.8)));
  const top = pt(1);
  return (
    <>
      <Svg width={w} height={H} style={StyleSheet.absoluteFill}>
        <Draw d={d} v={line} color={c.accent} width={5} len={1400} />
      </Svg>
      {dots.map((p, i) => (
        <Animated.View
          key={i}
          style={[s.abs, { left: p.x - 8, top: p.y - 8, width: 16, height: 16, borderRadius: 8, backgroundColor: c.coral }, pop(show[i])]}
        />
      ))}
      <Animated.View style={[s.abs, { left: top.x + 6, top: top.y - 22 }, pop(flag)]}>
        <View style={[s.flag, { backgroundColor: c.mint }]}>
          <Icon name="star" size={20} color="#FFFFFF" />
        </View>
      </Animated.View>
      <Animated.View style={[s.key, { opacity: flag }]}>
        <View style={s.keyItem}>
          <View style={[s.keyDot, { backgroundColor: c.coral }]} />
          <Text style={[s.keyT, { color: c.ink }]}>a slip</Text>
        </View>
        <View style={s.keyItem}>
          <View style={[s.keyDot, { backgroundColor: c.mint }]} />
          <Text style={[s.keyT, { color: c.ink }]}>change that lasts</Text>
        </View>
      </Animated.View>
    </>
  );
}

/* ---------- kindness makes people try harder ---------- */
function Kind({ w }: { w: number }) {
  const c = useTheme();
  const a = useOnce(250, 800, NATIVE, Easing.out(Easing.cubic));
  const b = useOnce(800, 1000, NATIVE, Easing.out(Easing.cubic));
  const heart = useOnce(1700, 520, NATIVE, Easing.out(Easing.back(2)));
  const beat = useSway(700, 2300);
  const base = 136;
  const col = (x: number, h: number, v: Animated.Value, color: string, word: string) => (
    <>
      <View style={[s.abs, { left: x - 30, top: base - h, width: 60, height: h, borderRadius: 14, overflow: 'hidden' }]}>
        <Animated.View
          style={{
            flex: 1,
            borderRadius: 14,
            backgroundColor: color,
            transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [h, 0] }) }],
          }}
        />
      </View>
      <Label x={x} y={base + 8} width={130} text={word} color={c.ink} bold />
    </>
  );
  const kx = w * 0.66;
  return (
    <>
      <Svg width={w} height={H} style={StyleSheet.absoluteFill}>
        <Line x1={18} y1={base} x2={w - 18} y2={base} stroke={c.line} strokeWidth={2} />
      </Svg>
      {col(w * 0.34, 50, a, c.line, 'hard on yourself')}
      {col(kx, 90, b, c.mint, 'kind to yourself')}
      <Animated.View style={[s.abs, { left: kx - 17, top: base - 90 - 40 }, pop(heart)]}>
        <Animated.View style={{ transform: [{ scale: beat.interpolate({ inputRange: [0, 1], outputRange: [1, 1.14] }) }] }}>
          <Icon name="heart" size={34} color={c.coral} />
        </Animated.View>
      </Animated.View>
      <Label x={w / 2} y={H - 22} width={260} text="how hard people tried next time" color={c.muted} />
    </>
  );
}

const s = StyleSheet.create({
  abs: { position: 'absolute' },
  barWord: { position: 'absolute', fontFamily: font.bodySemi, fontSize: 13 },
  track: { position: 'absolute', height: 18, borderRadius: 9, overflow: 'hidden' },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  tagT: { fontFamily: font.display, fontSize: 22, lineHeight: 28 },
  row: { position: 'absolute', left: 18, right: 18, flexDirection: 'row', alignItems: 'center', gap: 8 },
  said: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  saidT: { fontFamily: font.bodyBold, fontSize: 15 },
  to: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, flexShrink: 1 },
  toT: { fontFamily: font.bodyBold, fontSize: 15 },
  node: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  end: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  nodeT: { fontFamily: font.bodyBold, fontSize: 12, textAlign: 'center', lineHeight: 15 },
  key: { position: 'absolute', left: 0, right: 0, bottom: 12, flexDirection: 'row', justifyContent: 'center', gap: 18 },
  keyItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  keyDot: { width: 12, height: 12, borderRadius: 6 },
  keyT: { fontFamily: font.bodySemi, fontSize: 13 },
  flag: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
