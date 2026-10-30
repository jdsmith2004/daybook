/* The moves of the ride (core ride.ts): each one fills the middle of the SOS screen, runs by itself, and says when it is
   done (onDone), so the ride flows on to the next without a button. Every move is short (about half a minute to a
   minute) and has one living thing in the middle to follow.
   - Breathe: the sun, three slow breaths (components/orb BreathSun).
   - Squeeze: four body parts, each squeezed hard for five seconds and let go for four. The shape clenches with you.
   - Fit the shapes: a small block puzzle for the eyes and hands (stack.tsx).
   - 5-4-3-2-1: find things around you, one tap each.
   - Name it: the feeling under the urge, on the feelings field, and what it is asking for (feel-move.tsx).
   - Later: the hour after, both ways, in your own words. Over the two hours, once the log has it, one line on how it
     really felt after the last slips (core slipFeltLine), never in a practice ride or the first 30 seconds of an SOS.
   - Say it fast: the loudest thought, said fast for 20 seconds, then let go.
   - Your words: your note or a reason, read slowly, and your voice note. */
import { FWD_A, FWD_B, FWD_TOMORROW, GROUND, THOUGHTS, urFromYou, type UrMem } from '@daybook/core';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Platform, Pressable, StyleSheet, View } from 'react-native';
import Reanimated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';

import { Appear } from '@/components/appear';
import { Tiles } from '@/components/choices';
import { BreathSun, useSeconds } from '@/components/orb';
import { MorphShape, useClock, WavyLine, WavyRing, type ShapeKind } from '@/components/shapes';
import { Text } from '@/components/text';
import { FastWords, Fork } from '@/components/tools/ride';
import { FeelMove } from './feel-move';
import { StackMove } from './stack';
import { Button, Icon, T } from '@/components/ui';
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
  /** a feeling was named (Name it): the move it points to, and the trigger it stands for */
  onFeel?: (f: { w: string; lead: string | null; trig: string | null }) => void;
  /** open a tool over the ride (Name it, for a feeling whose tool is not a ride move) */
  onTool?: (id: string) => void;
  /** the hour after: how it felt after the last slips, in the person's own record (core slipFeltLine), or null. SOS gives
      it only in a real SOS, from 30 seconds on. */
  felt?: string | null;
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
              {all ? (
                <View>
                  <Icon name="check" size={56} color={c.coralText} />
                </View>
              ) : (
                <Text style={[s.count, { color: hold ? '#FFFFFF' : c.coralText }]}>{hold ? left : ''}</Text>
              )}
            </MorphShape>
          </Reanimated.View>
        </WavyRing>
      </View>
      <Steps n={PARTS.length} i={all ? PARTS.length : i} color={c.coral} track={c.coral + '33'} />
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
              {all ? (
                <View>
                  <Icon name="check" size={72} color="#FFFFFF" />
                </View>
              ) : (
                <Text style={[s.big, { color: '#FFFFFF' }]}>{left}</Text>
              )}
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
export function LaterMove({ onDone, felt: felt0 }: MoveProps) {
  const c = useTheme();
  const { mem, setMem } = useSos();
  /* the person's own record of how it felt after (kept from when the move opened, so the words never jump) */
  const [felt] = useState(() => felt0 || null);
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
          head={first ? 'An hour after giving in, I feel…' : 'An hour after riding it out, I feel…'}
          sub="Tap any that are true. Asked once, kept for next time."
        />
        <View style={[s.mid, s.low]}>
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
      {felt ? (
        <Appear delay={500} style={[s.felt, { backgroundColor: c.slipSoft }]}>
          <T v="small" style={{ color: c.ink, textAlign: 'center' }}>
            {felt}
          </T>
        </Appear>
      ) : null}
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
        <View style={[s.mid, s.low]}>
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
          <T v="eyebrow" tone="sunText">
            {fy?.cap || 'From you'}
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
  stack: StackMove,
  ground: GroundMove,
  feel: FeelMove,
  forward: LaterMove,
  thought: SayMove,
  reasons: WordsMove,
};

/** the short name of a move, as the ride shows it */
export const MOVE_NAME: Record<string, string> = {
  breathe: 'Breathe',
  move: 'Squeeze',
  stack: 'Fit the shapes',
  ground: '5-4-3-2-1',
  feel: 'Name it',
  forward: 'The hour after',
  thought: 'Say it fast',
  reasons: 'Your words',
};

/** the icon for a move */
export const MOVE_ICON: Record<string, string> = {
  breathe: 'wind',
  move: 'bolt',
  stack: 'sparkle',
  ground: 'dots',
  feel: 'heart',
  forward: 'compass',
  thought: 'chat',
  reasons: 'star',
};

export const moveTint = (c: Palette, id: string) =>
  ({ breathe: c.sun, move: c.coral, stack: c.sky, ground: c.mint, feel: c.coral, forward: c.mint, thought: c.violet, reasons: c.sun2 })[id] || c.accent;

const s = StyleSheet.create({
  move: { flexGrow: 1, alignSelf: 'stretch', gap: 12 },
  words: { minHeight: 92, alignItems: 'center', justifyContent: 'center', gap: 4, paddingHorizontal: 8 },
  head: { fontFamily: font.displayBold, fontSize: 28, lineHeight: 36, textAlign: 'center' },
  c: { textAlign: 'center' },
  mid: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  /* choices sit low, where the thumb is */
  low: { justifyContent: 'flex-end' },
  count: { fontFamily: font.displayBold, fontSize: 64, lineHeight: 72, fontVariant: ['tabular-nums'] },
  big: { fontFamily: font.displayBold, fontSize: 84, lineHeight: 92, fontVariant: ['tabular-nums'] },
  steps: { flexDirection: 'row', gap: 6, alignSelf: 'center', width: 160 },
  step: { flex: 1, height: 6, borderRadius: 3 },
  line: { alignItems: 'center' },
  now: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 999 },
  felt: { alignSelf: 'center', maxWidth: 340, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  two: { flexDirection: 'row', gap: 10, alignSelf: 'stretch' },
  hour: { flex: 1, gap: 4, padding: 14, borderRadius: 20, minHeight: 120, borderColor: 'transparent', borderWidth: 3 },
  hourT: { fontFamily: font.display, fontSize: 17, lineHeight: 22 },
  tomorrow: { alignSelf: 'stretch', gap: 2, padding: 16, borderRadius: 20 },
  tmT: { fontFamily: font.display, fontSize: 20, lineHeight: 25 },
  quiet: { alignSelf: 'center', minHeight: 36, justifyContent: 'center' },
  fastT: { fontFamily: font.displayBold, fontSize: 34, lineHeight: 42, textAlign: 'center' },
  note: { alignSelf: 'stretch', gap: 8, padding: 24, borderRadius: 20 },
  noteT: { fontFamily: font.display, fontSize: 28, lineHeight: 34 },
});
