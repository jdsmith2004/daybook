/* The pictures of the Sunday review (app/review.tsx; core: sunday-story.ts). Each one moves once as it appears, like a
   year-in-review story: the seven days light up one by one, a wave rises and passes, bars grow, rings fill, the goal's
   dots fill in. Under each screen, one line of science with its source and the lesson to read. Reduce Motion shows
   them at rest. */
import { LESSONS, SRC, type StoryDay, type StoryTeach, type StoryWeek } from '@daybook/core';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import { AnimatedText, Text } from '@/components/text';
import Svg, { Circle, Path } from 'react-native-svg';

import { SourceLine } from '@/components/research';
import { pop, useOnce } from '@/components/talk-art';
import { Icon, T } from '@/components/ui';
import { NATIVE, useReducedMotion } from '@/lib/motion';
import { font, toneOf, useTheme } from '@/lib/theme';

const SRCS = SRC as unknown as Record<string, [string, string]>;
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** the story's progress: one bar for each screen, the ones seen lit, the one showing filling in */
export function StoryBars({ n, i }: { n: number; i: number }) {
  const c = useTheme();
  const v = useRef(new Animated.Value(0)).current;
  const reduce = useReducedMotion();
  useEffect(() => {
    v.setValue(reduce ? 1 : 0);
    if (!reduce) Animated.timing(v, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [i, v, reduce]);
  return (
    <View style={s.bars} accessible accessibilityRole="progressbar" accessibilityLabel={'Part ' + (i + 1) + ' of ' + n}>
      {Array.from({ length: n }, (_, j) => (
        <View key={j} style={[s.bar, { backgroundColor: c.ink + '26' }]}>
          {j < i ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: c.ink, borderRadius: 2 }]} />
          ) : j === i ? (
            <Animated.View
              style={{ height: '100%', borderRadius: 2, backgroundColor: c.ink, width: v.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }}
            />
          ) : null}
        </View>
      ))}
    </View>
  );
}

/** one line of science under a screen: the words, the source to tap, and the lesson to read */
export function Teach({ teach }: { teach: StoryTeach }) {
  const c = useTheme();
  const l = (LESSONS as unknown as { id: string; title: string }[]).find((x) => x.id === teach.l);
  return (
    <View style={[s.teach, { backgroundColor: c.surface, borderColor: c.cardEdge }]}>
      <View style={s.teachHead}>
        <Icon name="sparkle" size={15} color={c.violetText} />
        <Text style={[s.eyebrow, { color: c.violetText }]}>WHY IT MATTERS</Text>
      </View>
      <T style={{ fontSize: 15, lineHeight: 22 }}>{teach.t}</T>
      {/* the lesson, and where the science comes from: one small line, a bonus that never pushes the page past the screen */}
      <View style={s.teachFoot}>
        {l ? (
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={'Read the lesson: ' + l.title}
            hitSlop={6}
            onPress={() => router.push({ pathname: '/lesson/[id]', params: { id: l.id } })}
            style={s.lesson}>
            <Icon name="book" size={14} color={c.accentText} />
            <Text style={[s.lessonT, { color: c.accentText }]} numberOfLines={1}>
              {l.title}
            </Text>
          </Pressable>
        ) : null}
        <SourceLine keys={teach.src} map={SRCS} />
      </View>
    </View>
  );
}

/* ---------- the seven days ---------- */
function DayDot({ d, i }: { d: StoryDay; i: number }) {
  const c = useTheme();
  const v = useOnce(250 + i * 140, 420);
  const look =
    d.state === 'clean'
      ? { bg: c.mint, bd: c.mint, ic: 'check', col: '#FFFFFF' }
      : d.state === 'slip'
        ? { bg: c.coralSoft, bd: c.coral, ic: 'leaf', col: c.coralText }
        : { bg: 'transparent', bd: c.line, ic: '', col: c.muted };
  return (
    <View
      style={s.day}
      accessible
      accessibilityLabel={
        d.name + ': ' + (d.state === 'clean' ? 'no slip' : d.state === 'slip' ? 'a slip' : d.state === 'ahead' ? 'still to come' : 'before you started')
      }>
      <Animated.View style={[s.dayDot, { backgroundColor: look.bg, borderColor: look.bd, borderStyle: d.state === 'ahead' ? 'dashed' : 'solid' }, pop(v)]}>
        {look.ic ? <Icon name={look.ic} size={20} color={look.col} /> : null}
      </Animated.View>
      <Text style={[s.dayL, { color: c.muted }]}>{d.l}</Text>
    </View>
  );
}
export function DaysRow({ days }: { days: StoryDay[] }) {
  return (
    <View style={s.days}>
      {days.map((d, i) => (
        <DayDot key={d.k} d={d} i={i} />
      ))}
    </View>
  );
}

/* ---------- an urge: it rises, peaks, and passes ---------- */
export function RideWave({ mins }: { mins: number | null }) {
  const c = useTheme();
  const v = useOnce(200, 1400, false, Easing.inOut(Easing.cubic));
  const W = 300;
  const H = 130;
  return (
    <View style={{ alignItems: 'center', gap: 4 }} accessible accessibilityLabel="An urge as a wave: it rises, peaks, and passes">
      <View style={{ width: W, height: H }}>
        <Animated.View
          style={{ position: 'absolute', left: 0, top: 0, bottom: 0, overflow: 'hidden', width: v.interpolate({ inputRange: [0, 1], outputRange: [0, W] }) }}>
          <Svg width={W} height={H}>
            <Path
              d={`M6 ${H - 12}C70 ${H - 12} 100 18 150 18S230 ${H - 12} ${W - 6} ${H - 12}`}
              stroke={c.mint}
              strokeWidth={6}
              fill="none"
              strokeLinecap="round"
            />
            <Path d={`M6 ${H - 12}C70 ${H - 12} 100 18 150 18S230 ${H - 12} ${W - 6} ${H - 12}L${W - 6} ${H}L6 ${H}Z`} fill={c.mint + '30'} />
            <Circle cx={150} cy={18} r={8} fill={c.sun} />
          </Svg>
        </Animated.View>
      </View>
      <View style={s.waveL}>
        {['RISES', 'PEAKS', 'PASSES'].map((x) => (
          <Text key={x} style={[s.eyebrow, { color: c.muted }]}>
            {x}
          </Text>
        ))}
      </View>
      {mins ? (
        <View style={[s.chip, { backgroundColor: c.surface }]}>
          <Icon name="timer" size={15} color={c.mintText} />
          <T v="small" style={{ fontFamily: font.bodySemi }}>
            Most of yours passed in about {mins} minutes
          </T>
        </View>
      ) : null}
    </View>
  );
}

/* ---------- what set it off ---------- */
function TrigRow({ t, rode, slipped, max, i }: { t: string; rode: number; slipped: number; max: number; i: number }) {
  const c = useTheme();
  const v = useOnce(200 + i * 160, 700, false);
  const w = (n: number) => v.interpolate({ inputRange: [0, 1], outputRange: ['0%', (n / max) * 100 + '%'] });
  const parts = [rode ? plural(rode, 'ridden out', 'ridden out') : '', slipped ? plural(slipped, 'slip', 'slips') : ''].filter(Boolean).join(' · ');
  return (
    <View style={{ gap: 5 }} accessible accessibilityLabel={t + ': ' + parts}>
      <View style={s.between}>
        <T v="label" style={{ flex: 1 }}>
          {t}
        </T>
        <T v="small" tone="muted">
          {parts}
        </T>
      </View>
      <View style={[s.track, { backgroundColor: c.surface2 }]}>
        <Animated.View style={{ width: w(rode), backgroundColor: c.mint }} />
        <Animated.View style={{ width: w(slipped), backgroundColor: c.coral }} />
      </View>
    </View>
  );
}
const plural = (n: number, one: string, many: string) => n + ' ' + (n === 1 ? one : many);
export function TrigBars({ rows }: { rows: { id: string; t: string; rode: number; slipped: number }[] }) {
  const c = useTheme();
  const max = Math.max(1, ...rows.map((r) => r.rode + r.slipped));
  return (
    <View style={[s.card, { backgroundColor: c.surface, borderColor: c.cardEdge }]}>
      {rows.map((r, i) => (
        <TrigRow key={r.id} t={r.t} rode={r.rode} slipped={r.slipped} max={max} i={i} />
      ))}
      <View style={s.legend}>
        <Key col={c.mint} label="Ridden out" />
        <Key col={c.coral} label="Slipped" />
      </View>
    </View>
  );
}
function Key({ col, label }: { col: string; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 12, height: 12, borderRadius: 4, backgroundColor: col }} />
      <T v="small" tone="muted">
        {label}
      </T>
    </View>
  );
}

/* ---------- what helped ---------- */
function HelpRow({ r, i, top }: { r: { t: string; ev: string; ic: string }; i: number; top: boolean }) {
  const c = useTheme();
  const v = useOnce(200 + i * 170, 480);
  const t = toneOf(c, top ? 'sun' : 'mint');
  return (
    <Animated.View style={[s.help, { backgroundColor: c.surface, borderColor: top ? c.sun : c.cardEdge }, pop(v)]}>
      <View style={[s.helpIc, { backgroundColor: t.soft }]}>
        <Icon name={r.ic} size={22} color={t.text} />
      </View>
      <View style={{ flex: 1 }}>
        <T v="label">{r.t}</T>
        <T v="small" tone="muted">
          {r.ev}
        </T>
      </View>
      {top ? <Icon name="star" size={20} color={c.sunText} /> : null}
    </Animated.View>
  );
}
export function HelpList({ rows }: { rows: { id: string; t: string; ev: string; ic: string }[] }) {
  return (
    <View style={{ alignSelf: 'stretch', gap: 10 }}>
      {rows.map((r, i) => (
        <HelpRow key={r.id} r={r} i={i} top={i === 0} />
      ))}
    </View>
  );
}

/* ---------- the foundations: four rings ---------- */
function Ring({ frac, label, value, col, i }: { frac: number; label: string; value: string; col: string; i: number }) {
  const c = useTheme();
  const v = useOnce(200 + i * 160, 900, false);
  const R = 30;
  const L = 2 * Math.PI * R;
  return (
    <View style={s.ring} accessible accessibilityLabel={label + ': ' + value}>
      <View style={{ width: 76, height: 76, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={76} height={76} style={StyleSheet.absoluteFill}>
          <Circle cx={38} cy={38} r={R} stroke={c.surface2} strokeWidth={8} fill="none" />
          <AnimatedCircle
            cx={38}
            cy={38}
            r={R}
            stroke={col}
            strokeWidth={8}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${L} ${L}`}
            strokeDashoffset={v.interpolate({ inputRange: [0, 1], outputRange: [L, L * (1 - Math.max(0.02, Math.min(1, frac)))] })}
            transform="rotate(-90 38 38)"
          />
        </Svg>
        <Text style={[s.ringV, { color: c.ink }]}>{value}</Text>
      </View>
      <T v="small" style={{ fontFamily: font.bodySemi, textAlign: 'center' }}>
        {label}
      </T>
    </View>
  );
}
export function Rings({ base }: { base: { days: number; sleep: number | null; phone: number; checkins: number; lessons: number } }) {
  const c = useTheme();
  const n = Math.max(1, base.days);
  return (
    <View style={[s.card, s.rings, { backgroundColor: c.surface, borderColor: c.cardEdge }]}>
      <Ring i={0} frac={base.sleep != null ? base.sleep / 8 : 0} label="Sleep" value={base.sleep != null ? base.sleep + ' h' : '–'} col={c.violet} />
      <Ring i={1} frac={base.phone / n} label="Phone away" value={base.phone + '/' + n} col={c.sky} />
      <Ring i={2} frac={base.checkins / n} label="Check-ins" value={base.checkins + '/' + n} col={c.mint} />
      <Ring i={3} frac={base.lessons / n} label="Lessons" value={String(base.lessons)} col={c.sun} />
    </View>
  );
}

/* ---------- a goal's nights or days, filling in ---------- */
function GoalDot({ on, i }: { on: boolean; i: number }) {
  const c = useTheme();
  const v = useOnce(300 + i * 160, 420);
  return (
    <View style={[s.goalDot, { borderColor: on ? c.mint : c.line, backgroundColor: c.surface }]}>
      {on ? (
        <Animated.View style={[StyleSheet.absoluteFill, s.goalFill, { backgroundColor: c.mint }, pop(v)]}>
          <Icon name="check" size={18} color="#FFFFFF" />
        </Animated.View>
      ) : null}
    </View>
  );
}
export function GoalDots({ n, done }: { n: number; done: number }) {
  return (
    <View style={s.goalDots} accessible accessibilityLabel={done + ' of ' + n}>
      {Array.from({ length: n }, (_, i) => (
        <GoalDot key={i} on={i < done} i={i} />
      ))}
    </View>
  );
}

/* ---------- the long view: eight weeks of days with no slip ---------- */
function WeekBar({ w, max, cur, i }: { w: StoryWeek; max: number; cur: boolean; i: number }) {
  const c = useTheme();
  const v = useOnce(150 + i * 90, 700, false);
  const H = 120;
  const h = Math.max(4, (w.noSlip / max) * H);
  const [, m, d] = w.sun.split('-').map(Number);
  return (
    <View style={s.wk}>
      {cur ? <Text style={[s.wkN, { color: c.ink }]}>{w.noSlip}</Text> : <View style={{ height: 22 }} />}
      <View style={{ height: H, justifyContent: 'flex-end' }}>
        <Animated.View
          style={{
            width: 22,
            borderRadius: 8,
            backgroundColor: cur ? c.accent : c.accent + '55',
            height: v.interpolate({ inputRange: [0, 1], outputRange: [4, h] }),
          }}
        />
      </View>
      <Text style={[s.wkL, { color: cur ? c.ink : c.muted }]}>{m + '/' + d}</Text>
    </View>
  );
}
export function WeekBars({ weeks }: { weeks: StoryWeek[] }) {
  const c = useTheme();
  const max = 7;
  return (
    <View
      style={[s.card, { backgroundColor: c.surface, borderColor: c.cardEdge }]}
      accessible
      accessibilityLabel={'Days with no slip, week by week: ' + weeks.map((w) => w.noSlip).join(', ')}>
      <View style={s.wks}>
        {weeks.map((w, i) => (
          <WeekBar key={w.sun} w={w} max={max} cur={i === weeks.length - 1} i={i} />
        ))}
      </View>
      <T v="small" tone="muted" style={{ textAlign: 'center' }}>
        Days with no slip, each week
      </T>
    </View>
  );
}

/** a big number that pops in */
export function Big({ children, color, delay = 150 }: { children: React.ReactNode; color?: string; delay?: number }) {
  const c = useTheme();
  const v = useOnce(delay, 520, NATIVE);
  return <AnimatedText style={[s.big, { color: color || c.ink }, pop(v)]}>{children}</AnimatedText>;
}

const s = StyleSheet.create({
  bars: { flexDirection: 'row', gap: 4, alignSelf: 'stretch' },
  bar: { flex: 1, height: 4, borderRadius: 2, overflow: 'hidden' },
  eyebrow: { fontFamily: font.bodyBold, fontSize: 12, letterSpacing: 1 },
  teach: { alignSelf: 'stretch', gap: 8, padding: 14, borderRadius: 18, borderWidth: 1.5 },
  teachHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  lesson: { flexDirection: 'row', alignItems: 'center', gap: 5, minHeight: 28, flexShrink: 1 },
  lessonT: { fontFamily: font.bodySemi, fontSize: 13, textDecorationLine: 'underline', flexShrink: 1 },
  teachFoot: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 12 },
  days: { flexDirection: 'row', justifyContent: 'center', gap: 6, alignSelf: 'stretch' },
  day: { alignItems: 'center', gap: 6, flex: 1, maxWidth: 48 },
  dayDot: { width: 40, height: 40, borderRadius: 20, borderWidth: 2.5, alignItems: 'center', justifyContent: 'center' },
  dayL: { fontFamily: font.bodyBold, fontSize: 13 },
  waveL: { width: 300, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, marginTop: 6 },
  card: { alignSelf: 'stretch', gap: 12, padding: 16, borderRadius: 20, borderWidth: 1.5 },
  between: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  track: { flexDirection: 'row', height: 14, borderRadius: 7, overflow: 'hidden' },
  legend: { flexDirection: 'row', gap: 16, justifyContent: 'center' },
  help: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 18, borderWidth: 1.5 },
  helpIc: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  rings: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', gap: 8 },
  ring: { alignItems: 'center', gap: 6, width: 76 },
  ringV: { fontFamily: font.display, fontSize: 15 },
  goalDots: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 },
  goalDot: { width: 38, height: 38, borderRadius: 19, borderWidth: 2.5, overflow: 'hidden' },
  goalFill: { alignItems: 'center', justifyContent: 'center', borderRadius: 19 },
  wks: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end' },
  wk: { alignItems: 'center', gap: 4 },
  wkN: { fontFamily: font.display, fontSize: 17, lineHeight: 22 },
  wkL: { fontFamily: font.bodySemi, fontSize: 11 },
  big: { fontFamily: font.displayBold, fontSize: 64, lineHeight: 72, textAlign: 'center' },
});
