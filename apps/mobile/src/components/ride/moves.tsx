/* The moves of the ride (core ride.ts): each one fills the middle of the SOS screen, runs by itself, and says when it is
   done (onDone), so the ride flows on to the next without a button. Every move is short (about half a minute to a
   minute) and has one living thing in the middle to follow.
   - Breathe: the sun, three slow breaths (components/orb BreathSun).
   - Squeeze: four body parts, each squeezed hard for five seconds and let go for four. The shape clenches with you.
   - Catch the shapes: shapes drift down; tap the ones that match, even turned. A game for the eyes.
   - 5-4-3-2-1: find things around you, one tap each.
   - Later: the hour after, both ways, in your own words.
   - Say it fast: the loudest thought, said fast for 20 seconds, then let go.
   - Your words: your note or a reason, read slowly, and your voice note. */
import { FWD_A, FWD_B, FWD_TOMORROW, GROUND, THOUGHTS, urFromYou, type UrMem } from '@daybook/core';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Platform, Pressable, StyleSheet, View } from 'react-native';
import Reanimated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';

import { Appear } from '@/components/appear';
import { Tiles } from '@/components/choices';
import { BreathSun, useSeconds } from '@/components/orb';
import { MorphShape, Shape, useClock, WavyLine, WavyRing, type ShapeKind } from '@/components/shapes';
import { Text } from '@/components/text';
import { FastWords, Fork } from '@/components/tools/ride';
import { Button, T } from '@/components/ui';
import { SosVoice } from '@/components/voice-note';
import { buzz } from '@/lib/feel';
import { useReducedMotion } from '@/lib/motion';
import { useSos } from '@/lib/sos';
import { useCareSettings } from '@/lib/store';
import { font, useTheme, type Palette } from '@/lib/theme';

export interface MoveProps {
  /** the move is in front (not under a tool, not paused) */
  on: boolean;
  /** the move is done: the ride goes on to the next */
  onDone: () => void;
}

/** say a line to a screen reader on iOS (which has no live regions); Android and the web read the live region */
function useSay(text: string, on: boolean) {
  useEffect(() => {
    if (Platform.OS !== 'ios' || !on || !text) return;
    AccessibilityInfo.isScreenReaderEnabled()
      .then((yes) => yes && AccessibilityInfo.announceForAccessibility(text))
      .catch(() => undefined);
  }, [text, on]);
}

/** call onDone once, after `ms`, once `when` is true */
function useDoneAfter(when: boolean, ms: number, onDone: () => void) {
  const done = useRef(onDone);
  done.current = onDone;
  useEffect(() => {
    if (!when) return;
    const t = setTimeout(() => done.current(), ms);
    return () => clearTimeout(t);
  }, [when, ms]);
}

/* ---------- breathe ---------- */
export function BreatheMove({ on, onDone }: MoveProps) {
  const [n, setN] = useState(0);
  useDoneAfter(n >= 3, 1400, onDone);
  return <BreathSun on={on} breaths={3} onBreaths={setN} />;
}

/* ---------- squeeze ---------- */
/** each part: what to squeeze, and how */
const PARTS: [string, string][] = [
  ['Squeeze your fists', 'As hard as you can.'],
  ['Shoulders up to your ears', 'Pull them up tight.'],
  ['Legs and feet', 'Press your feet down. Tense your legs.'],
  ['Everything at once', 'Fists, arms, legs, face. All of it.'],
];
const HOLD = 5;
const REST = 4;
const ROUND = HOLD + REST;

export function SqueezeMove({ on, onDone }: MoveProps) {
  const c = useTheme();
  const reduce = useReducedMotion();
  const [t0] = useState(() => Date.now());
  /* ten ticks a second is plenty for the count; the clench itself runs on the native side */
  const sec = useSeconds(t0, on);
  const i = Math.min(PARTS.length - 1, Math.floor(sec / ROUND));
  const x = sec - i * ROUND;
  const all = sec >= PARTS.length * ROUND;
  const hold = !all && x < HOLD;
  const left = hold ? Math.ceil(HOLD - x) : 0;
  /* the shape clenches small and tight on a squeeze, and springs open on let go */
  const squeeze = useSharedValue(0);
  useEffect(() => {
    squeeze.value = reduce ? (hold ? 1 : 0) : hold ? withTiming(1, { duration: 450 }) : withSpring(0, { damping: 8, stiffness: 120 });
  }, [hold, reduce, squeeze]);
  const clench = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - 0.22 * squeeze.value }, { rotate: squeeze.value * 18 + 'deg' }],
  }));
  /* a firm knock on each second of the squeeze, and a soft one when it is time to let go */
  const beat = all ? -1 : i * 10 + (hold ? left : 0);
  useEffect(() => {
    if (beat < 0) return;
    buzz(hold ? 'tick' : 'land');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beat]);
  useDoneAfter(all, 600, onDone);
  const head = all ? 'Feel it drain away' : hold ? PARTS[i][0] : 'And let go';
  const sub = all ? 'Shake your hands out.' : hold ? PARTS[i][1] : 'Feel the warmth spread.';
  useSay(head, on);
  return (
    <View style={s.move}>
      <Words head={head} sub={sub} />
      <View style={s.mid} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <WavyRing size={250} p={hold ? x / HOLD : all ? 1 : 1 - (x - HOLD) / REST} color={c.coral} track={c.coral + '2E'} stroke={6} speed={0}>
          <Reanimated.View style={clench}>
            <MorphShape kind={hold ? 'cookie4' : 'cookie12'} size={190} color={hold ? c.coral : c.coralSoft}>
              <Text style={[s.count, { color: hold ? '#FFFFFF' : c.coralText }]}>{hold ? left : all ? '✓' : ''}</Text>
            </MorphShape>
          </Reanimated.View>
        </WavyRing>
      </View>
      <Steps n={PARTS.length} i={all ? PARTS.length : i} color={c.coral} track={c.coral + '33'} />
    </View>
  );
}

/* ---------- catch the shapes ---------- */
const CATCH_SEC = 50;
/** a new shape this often, in seconds */
const EVERY = 0.75;
/** the target changes this often, so the eyes keep working */
const SWITCH = 17;
const TARGETS: ShapeKind[] = ['heart', 'clover4', 'triangle'];
const OTHERS: ShapeKind[] = ['cookie6', 'gem', 'pill', 'sunny', 'arch', 'cookie4', 'pentagon'];
const BIT = 64;

/** a steady random number for shape i and a salt */
const rnd = (i: number, k: number) => {
  const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

export function CatchMove({ on, onDone }: MoveProps) {
  const c = useTheme();
  const sec = useClock(on);
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  const [got, setGot] = useState<Record<number, number>>({});
  const [miss, setMiss] = useState<Record<number, number>>({});
  const t = Math.min(CATCH_SEC, sec);
  const over = sec >= CATCH_SEC;
  const targetAt = (s0: number) => TARGETS[Math.floor(s0 / SWITCH) % TARGETS.length];
  const target = targetAt(t);
  const n = Object.keys(got).length;
  useDoneAfter(over, 900, onDone);
  /* the target changes: a buzz and a word, so the eyes notice */
  const ti = Math.floor(t / SWITCH);
  useEffect(() => {
    if (ti > 0 && !over) buzz('land');
  }, [ti, over]);
  /* any color but the mint a caught shape turns */
  const tint = (i: number) => [c.sky, c.violet, c.coral, c.sun2][Math.floor(rnd(i, 3) * 4)];
  /* the shapes on screen now: born every EVERY seconds, falling faster as it goes on */
  const items = useMemo(() => {
    if (!box) return [];
    const out: { i: number; kind: ShapeKind; x: number; y: number; turn: number; born: number }[] = [];
    const first = Math.max(0, Math.floor((t - 6) / EVERY));
    const last = Math.floor(t / EVERY);
    for (let i = first; i <= last; i++) {
      const born = i * EVERY;
      if (born > CATCH_SEC - 2) break;
      const fall = 5.2 - 1.6 * Math.min(1, born / CATCH_SEC);
      const f = (t - born) / fall;
      if (f < 0 || f > 1.05) continue;
      const k = rnd(i, 1) < 0.38 ? targetAt(born) : OTHERS[Math.floor(rnd(i, 2) * OTHERS.length)];
      const x = 6 + rnd(i, 4) * Math.max(0, box.w - BIT - 12);
      out.push({ i, kind: k, x, y: -BIT + f * (box.h + BIT), turn: (rnd(i, 5) - 0.5) * 300 + (t - born) * (rnd(i, 6) - 0.5) * 60, born });
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [box, t]);
  const tap = (it: (typeof items)[number]) => {
    if (got[it.i] != null || over) return;
    if (it.kind === target) {
      setGot((g) => ({ ...g, [it.i]: t }));
      buzz('tap');
    } else {
      setMiss((m) => ({ ...m, [it.i]: t }));
      buzz('tick');
    }
  };
  useSay(over ? n + ' caught' : '', on);
  return (
    <View style={s.move}>
      <View style={s.catchTop} accessible accessibilityLabel={over ? n + ' caught. Nice.' : 'Tap every shape like this one, even when it is turned.'}>
        <Appear key={target} by={0} duration={200}>
          <MorphShape kind={target} size={46} color={c.ink} />
        </Appear>
        <View style={{ flex: 1 }}>
          <Text style={[s.head, s.left, { color: c.ink }]}>{over ? n + ' caught' : 'Catch every one of these'}</Text>
          <T v="small" tone="muted">
            {over ? 'Your eyes were busy. Notice how the urge feels now.' : 'Even when it is turned. ' + n + ' so far.'}
          </T>
        </View>
      </View>
      <View style={s.field} onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
        {items.map((it) => {
          const g = got[it.i];
          const m = miss[it.i];
          const pop = g != null ? Math.min(1, (t - g) / 0.3) : 0;
          if (pop >= 1) return null;
          const wob = m != null && t - m < 0.35 ? Math.sin((t - m) * 60) * 6 : 0;
          return (
            <Pressable
              key={it.i}
              onPressIn={() => tap(it)}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              hitSlop={10}
              style={[
                s.bit,
                {
                  left: it.x + wob,
                  top: it.y,
                  opacity: 1 - pop,
                  transform: [{ rotate: it.turn + 'deg' }, { scale: 1 + 0.5 * pop }],
                },
              ]}>
              <Shape kind={it.kind} size={BIT} color={g != null ? c.mint : tint(it.i)} />
            </Pressable>
          );
        })}
      </View>
      <View style={s.line}>
        <WavyLine width={220} p={t / CATCH_SEC} color={c.sky} track={c.sky + '33'} />
      </View>
    </View>
  );
}

/* ---------- 5-4-3-2-1 ---------- */
export function GroundMove({ on, onDone }: MoveProps) {
  const c = useTheme();
  const [i, setI] = useState(0);
  const [n, setN] = useState(0);
  const g = GROUND[i] as [number, string, string] | undefined;
  const all = !!g && n >= g[0];
  useEffect(() => {
    if (!all) return;
    const t = setTimeout(() => {
      setI((x) => x + 1);
      setN(0);
    }, 700);
    return () => clearTimeout(t);
  }, [all]);
  useDoneAfter(!g, 300, onDone);
  const pop = useSharedValue(1);
  const st = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));
  useSay(g ? g[0] + ' things you can ' + g[1].toLowerCase() : '', on);
  if (!g) return <View style={s.move} />;
  const tone = [c.sun, c.mint, c.sky, c.coral, c.violet][i % 5];
  const left = g[0] - n;
  return (
    <View style={s.move}>
      <Words head={g[1] + ' ' + g[0]} sub={g[2]} />
      <View style={s.mid}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={'Found one. ' + left + ' to go.'}
          onPress={() => {
            if (all) return;
            setN((x) => x + 1);
            buzz(n + 1 >= g[0] ? 'lit' : 'tap');
            pop.value = withSequence(withTiming(0.9, { duration: 70 }), withSpring(1, { damping: 7, stiffness: 240 }));
          }}>
          <Reanimated.View style={st}>
            <MorphShape kind={(['sunny', 'clover4', 'cookie6', 'puffy', 'heart'] as ShapeKind[])[i % 5]} size={210} color={tone}>
              <Text style={[s.big, { color: '#FFFFFF' }]}>{all ? '✓' : left}</Text>
            </MorphShape>
          </Reanimated.View>
        </Pressable>
        <T v="small" tone="muted" style={s.c}>
          Tap the shape each time you find one.
        </T>
      </View>
      <Steps n={GROUND.length} i={i} color={tone} track={c.line} />
    </View>
  );
}

/* ---------- later (play it forward) ---------- */
export function LaterMove({ onDone }: MoveProps) {
  const c = useTheme();
  const { mem, setMem } = useSos();
  const had = !!(mem.fwd?.a?.length || mem.fwd?.b?.length);
  const [step, setStep] = useState<0 | 1 | 2>(had ? 2 : 0);
  const [a, setA] = useState<string[]>(() => (mem.fwd?.a || []).slice());
  const [b, setB] = useState<string[]>(() => (mem.fwd?.b || []).slice());
  const [picked, setPicked] = useState(false);
  useDoneAfter(picked, 1100, onDone);
  const keep = (na: string[], nb: string[]) => setMem((m: UrMem) => ({ ...m, fwd: { a: na.slice(0, 7), b: nb.slice(0, 7), c: m.fwd?.c } }));
  const toggle = (L: string[], set: (x: string[]) => void, v: string) => {
    set(L.indexOf(v) >= 0 ? L.filter((x) => x !== v) : L.concat(v));
    buzz('tap');
  };
  if (step < 2) {
    const first = step === 0;
    return (
      <View style={s.move}>
        <Words
          head={first ? 'An hour after giving in, I feel...' : 'An hour after riding it out, I feel...'}
          sub="Tap any that are true. Asked once, kept for next time."
        />
        <View style={[s.mid, { justifyContent: 'flex-start', paddingTop: 8 }]}>
          <Tiles list={first ? FWD_A : FWD_B} cur={first ? a : b} onPick={(v) => (first ? toggle(a, setA, v) : toggle(b, setB, v))} />
        </View>
        <Button
          label="Next"
          onPress={() => {
            if (!first) keep(a, b);
            setStep(first ? 1 : 2);
            buzz('tap');
          }}
        />
      </View>
    );
  }
  const words = (list: [string, string][], ids: string[]) => list.filter((x) => ids.indexOf(x[0]) >= 0).map((x) => x[1].toLowerCase());
  const wa = words(FWD_A, a);
  const wb = words(FWD_B, b);
  const tm = (FWD_TOMORROW.find((x) => x[0] === mem.fwd?.c) || FWD_TOMORROW[Math.floor(Date.now() / 86400000) % FWD_TOMORROW.length])[1];
  return (
    <View style={s.move}>
      <Words head={picked ? 'Good choice' : 'Which hour do you want?'} sub={picked ? 'Hold on to that picture.' : 'Tap the one you want.'} />
      <View style={s.mid}>
        <View style={{ alignSelf: 'stretch', alignItems: 'center' }}>
          <View style={[s.now, { backgroundColor: c.surface }]}>
            <T v="small" style={{ fontFamily: font.bodyBold }}>
              Now
            </T>
          </View>
          <Fork left={picked ? c.line : c.slip} right={c.mint} />
          <View style={s.two}>
            <View
              style={[s.hour, { backgroundColor: c.slipSoft, opacity: picked ? 0.4 : 1 }]}
              accessible
              accessibilityLabel={'An hour after giving in: ' + (wa.join(', ') || 'not picked')}>
              <T v="small" tone="slipText" style={{ fontFamily: font.bodyBold }}>
                Giving in
              </T>
              <Text style={[s.hourT, { color: c.ink }]}>{wa.length ? wa.join(', ') : 'Not picked'}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={'I want this hour: riding it out. ' + wb.join(', ')}
              onPress={() => {
                if (picked) return;
                setPicked(true);
                buzz('lit');
              }}
              style={({ pressed }) => [
                s.hour,
                {
                  backgroundColor: c.mintSoft,
                  borderColor: c.mint,
                  borderWidth: 3,
                  transform: [{ translateY: pressed ? 3 : 0 }, { scale: picked ? 1.04 : 1 }],
                },
              ]}>
              <T v="small" tone="mintText" style={{ fontFamily: font.bodyBold }}>
                Riding it out
              </T>
              <Text style={[s.hourT, { color: c.ink }]}>{wb.length ? wb.join(', ') : 'Not picked'}</Text>
            </Pressable>
          </View>
        </View>
        <View style={[s.tomorrow, { backgroundColor: c.sunSoft }]}>
          <T v="small" tone="sunText">
            And tomorrow morning
          </T>
          <Text style={[s.tmT, { color: c.ink }]}>{tm}</Text>
        </View>
      </View>
      <Pressable accessibilityRole="button" onPress={() => setStep(0)} hitSlop={10} style={s.quiet}>
        <T v="small" tone="muted" style={{ textDecorationLine: 'underline' }}>
          Change my answers
        </T>
      </Pressable>
    </View>
  );
}

/* ---------- say it fast (name the thought) ---------- */
export function SayMove({ onDone }: MoveProps) {
  const c = useTheme();
  const { mem, setMem } = useSos();
  const last = typeof mem.thought === 'string' ? (mem.thought as string) : null;
  const [th, setTh] = useState<string | null>(null);
  const [start, setStart] = useState<number | null>(null);
  const [gone, setGone] = useState(false);
  useDoneAfter(gone, 2400, onDone);
  const text = th ? (THOUGHTS.find((x) => x[0] === th) || [th, th])[1] : '';
  if (!th)
    return (
      <View style={s.move}>
        <Words head="Which thought is loudest?" sub="Pick the one the urge is saying." />
        <View style={[s.mid, { justifyContent: 'flex-start', paddingTop: 8 }]}>
          <Tiles
            list={THOUGHTS}
            cur={last}
            onPick={(v) => {
              setTh(v);
              setMem((m: UrMem) => ({ ...m, thought: v }));
              buzz('tap');
              setStart(Date.now());
            }}
          />
        </View>
      </View>
    );
  if (gone)
    return (
      <View style={s.move}>
        <Words head="A thought, not an order" sub="It can be loud and still be wrong." />
        <View style={s.mid}>
          <Appear by={-60} duration={1600}>
            <Text style={[s.fastT, { color: c.muted, opacity: 0.35 }]}>{text}</Text>
          </Appear>
        </View>
      </View>
    );
  return (
    <View style={s.move}>
      <Words head="Say it out loud, fast" sub="Again and again, until it is just sounds. In your head works too." />
      <View style={s.mid}>
        <FastWords text={text} start={start || Date.now()} onDone={() => setGone(true)} />
      </View>
    </View>
  );
}

/* ---------- your words ---------- */
const READ_SEC = 14;
export function WordsMove({ on, onDone }: MoveProps) {
  const c = useTheme();
  const st = useCareSettings();
  const [pick] = useState(() => Math.random());
  const fy = st ? urFromYou(st, pick) : null;
  const sec = useClock(on);
  useDoneAfter(sec >= READ_SEC, 200, onDone);
  return (
    <View style={s.move}>
      <Words head="Read it slowly" sub="Out loud, if you can." />
      <View style={s.mid}>
        <View style={[s.note, { backgroundColor: c.sunSoft }]}>
          <T v="small" tone="sunText" style={{ fontFamily: font.bodyBold, letterSpacing: 1 }}>
            {(fy?.cap || 'From you').toUpperCase()}
          </T>
          <Text style={[s.noteT, { color: c.ink }]}>{fy?.t || ''}</Text>
          <SosVoice />
        </View>
      </View>
      <View style={s.line}>
        <WavyLine width={220} p={Math.min(1, sec / READ_SEC)} color={c.sun2} track={c.sun2 + '33'} />
      </View>
    </View>
  );
}

/* ---------- the parts ---------- */
/** the words above a move: what to do, big, and how, small. A live region, so a screen reader hears each change. */
function Words({ head, sub }: { head: string; sub?: string }) {
  const c = useTheme();
  return (
    <View style={s.words} accessibilityLiveRegion="polite" aria-live="polite">
      <Appear key={head} by={6} duration={220}>
        <Text style={[s.head, { color: c.ink }]} accessibilityRole="header">
          {head}
        </Text>
      </Appear>
      {sub ? (
        <T tone="muted" style={s.c}>
          {sub}
        </T>
      ) : null}
    </View>
  );
}

/** small steps under a move: done, now, to come */
function Steps({ n, i, color, track }: { n: number; i: number; color: string; track: string }) {
  return (
    <View style={s.steps} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {Array.from({ length: n }, (_, j) => (
        <View key={j} style={[s.step, { backgroundColor: j <= i ? color : track, flexGrow: j === i ? 2 : 1 }]} />
      ))}
    </View>
  );
}

/** which component each move id uses */
export const MOVES: Record<string, (p: MoveProps) => React.ReactElement> = {
  breathe: BreatheMove,
  move: SqueezeMove,
  catch: CatchMove,
  ground: GroundMove,
  forward: LaterMove,
  thought: SayMove,
  reasons: WordsMove,
};

/** the short name of a move, as the ride shows it */
export const MOVE_NAME: Record<string, string> = {
  breathe: 'Breathe',
  move: 'Squeeze',
  catch: 'Catch the shapes',
  ground: '5-4-3-2-1',
  forward: 'The hour after',
  thought: 'Say it fast',
  reasons: 'Your words',
};

/** the icon for a move */
export const MOVE_ICON: Record<string, string> = {
  breathe: 'wind',
  move: 'bolt',
  catch: 'sparkle',
  ground: 'dots',
  forward: 'compass',
  thought: 'chat',
  reasons: 'star',
};

export const moveTint = (c: Palette, id: string) =>
  ({ breathe: c.sun, move: c.coral, catch: c.sky, ground: c.mint, forward: c.mint, thought: c.violet, reasons: c.sun2 })[id] || c.accent;

const s = StyleSheet.create({
  move: { flexGrow: 1, alignSelf: 'stretch', gap: 12 },
  words: { minHeight: 92, alignItems: 'center', justifyContent: 'center', gap: 4, paddingHorizontal: 8 },
  head: { fontFamily: font.displayBold, fontSize: 30, lineHeight: 36, textAlign: 'center' },
  left: { textAlign: 'left', fontSize: 22, lineHeight: 27 },
  c: { textAlign: 'center' },
  mid: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  count: { fontFamily: font.displayBold, fontSize: 64, lineHeight: 72, fontVariant: ['tabular-nums'] },
  big: { fontFamily: font.displayBold, fontSize: 84, lineHeight: 92, fontVariant: ['tabular-nums'] },
  steps: { flexDirection: 'row', gap: 6, alignSelf: 'center', width: 160 },
  step: { flex: 1, height: 6, borderRadius: 3 },
  catchTop: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 4, minHeight: 64 },
  field: { flexGrow: 1, minHeight: 300, alignSelf: 'stretch', overflow: 'hidden', borderRadius: 28 },
  bit: { position: 'absolute', width: BIT, height: BIT },
  line: { alignItems: 'center' },
  now: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 999 },
  two: { flexDirection: 'row', gap: 10, alignSelf: 'stretch' },
  hour: { flex: 1, gap: 4, padding: 14, borderRadius: 22, minHeight: 120, borderColor: 'transparent', borderWidth: 3 },
  hourT: { fontFamily: font.display, fontSize: 18, lineHeight: 23 },
  tomorrow: { alignSelf: 'stretch', gap: 2, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 18 },
  tmT: { fontFamily: font.display, fontSize: 19, lineHeight: 25 },
  quiet: { alignSelf: 'center', minHeight: 36, justifyContent: 'center' },
  fastT: { fontFamily: font.displayBold, fontSize: 34, lineHeight: 42, textAlign: 'center' },
  note: { alignSelf: 'stretch', gap: 8, padding: 22, borderRadius: 26 },
  noteT: { fontFamily: font.display, fontSize: 26, lineHeight: 33 },
});
