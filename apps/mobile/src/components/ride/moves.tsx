/* The moves of the ride (core ride.ts): each one fills the middle of the SOS screen, runs by itself, and says when it is
   done (onDone), so the ride flows on to the next without a button. Every move is short (about half a minute to a
   minute) and has one living thing in the middle to follow.
   - Breathe: the sun and its dots, three breaths in the pattern the person chose (components/breath-ride).
   - Squeeze: four body parts, each squeezed hard for seven seconds and let go for eight, in a seat or on your feet. A disc
     of dots pulls into a hot knot with you and opens from the middle when you let go (core squeeze.ts).
   - Fit the shapes: a small block puzzle for the eyes and hands (stack.tsx).
   - 5-4-3-2-1: find things around you, one tap each.
   - Name it: the feeling under the urge, on the feelings field, and what it is asking for (feel-move.tsx).
   - Later: the hour after, both ways, in your own words. Over the two hours, once the log has it, one line on how it
     really felt after the last slips (core slipFeltLine), never in a practice ride or the first 30 seconds of an SOS.
   - Say it fast: the loudest thought, said fast for 20 seconds, then let go.
   - Your words: your note or a reason, read slowly, and your voice note.
   - If it were a thing: once a ride, "If the urge were an object, what would it be?" One tap (a tight knot, a hot stone),
     then the thing is watched from a step back while it softens and shrinks (core ride.ts RIDE_OBJECT). Next skips it.
   - It is written: for faith people only (core written.ts), in its own file (written.tsx). */
import { futureCap, futurePick, FWD_A, FWD_B, FWD_TOMORROW, GROUND, THOUGHTS, URGE_OBJECTS, urFromYou, type UrMem } from '@daybook/core';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Platform, Pressable, StyleSheet, View } from 'react-native';
import Reanimated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';

import { Appear } from '@/components/appear';
import { Tiles } from '@/components/choices';
import { BreathRide } from '@/components/breath-ride';
import { useSeconds, useStartWhen } from '@/components/orb';
import { MorphShape, SQUIGGLE, useClock, WavyLine, type ShapeKind } from '@/components/shapes';
import { Text } from '@/components/text';
import { FastWords, Fork } from '@/components/tools/ride';
import { FeelMove } from './feel-move';
import { SelfTalkMove } from './self-talk';
import { SqueezeMove } from './squeeze';
import { StackMove } from './stack';
import { WrittenMove } from './written';
import { Button, Icon, T } from '@/components/ui';
import { useFutureNote } from '@/components/future-note';
import { BigPlay } from '@/components/voice-note';
import { track } from '@/lib/events';
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
  /** the person's level, for the flame (It is written's last page) */
  level?: number;
  /** a preview of the move (app/sos-preview.tsx, or /sos?practice=1&try=) */
  demo?: boolean;
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
  return <BreathRide on={on} onDone={onDone} />;
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
        </View>
      </View>
      <View style={s.line}>
        <WavyLine width={220} p={Math.min(1, sec / READ_SEC)} color={c.sun2} track={c.sun2 + '33'} />
      </View>
    </View>
  );
}

/* ---------- future you (core future.ts): the note from a good day, right after the first breath ---------- */
export function FutureMove({ on, onDone }: MoveProps) {
  const c = useTheme();
  /* one note for this page, picked once, so it holds still while the ride moves (components/future-note.tsx) */
  const { n, uri, cap } = useFutureNote(on);
  const text = n?.k === 'text';
  const sec = useClock(on && text);
  useDoneAfter(text && sec >= READ_SEC, 200, onDone);
  const [ended, setEnded] = useState(false);
  useDoneAfter(ended, 1200, onDone);
  /* a recording whose file is gone: on to the next move rather than an empty page */
  useDoneAfter(on && !!n && !text && !uri, 300, onDone);
  if (!n) return <View style={s.move} />;
  if (text)
    return (
      <View style={s.move}>
        <Words head="Read it slowly" sub="Out loud, if you can." />
        <View style={s.mid}>
          <View style={[s.note, { backgroundColor: c.sunSoft }]}>
            <T v="eyebrow" tone="sunText">
              {cap}
            </T>
            <Text style={[s.noteT, { color: c.ink }]}>{n.t}</Text>
          </View>
        </View>
        <View style={s.line}>
          <WavyLine width={220} p={Math.min(1, sec / READ_SEC)} color={c.sun2} track={c.sun2 + '33'} />
        </View>
      </View>
    );
  return (
    <View style={s.move}>
      <Words head="You left yourself a note" sub={cap + '. Tap to hear it.'} />
      <View style={s.mid}>
        {uri ? (
          <BigPlay uri={uri} label="Hear your note" size={132} onPlay={() => track('future_heard', { note: 'voice' })} onEnd={() => setEnded(true)} />
        ) : null}
      </View>
    </View>
  );
}

/* ---------- if it were a thing (core ride.ts RIDE_OBJECT) ---------- */
/** each thing's shape and color */
const OBJ_LOOK: Record<string, { k: ShapeKind; tone: (c: Palette) => string }> = {
  knot: { k: 'softBoom', tone: (c) => c.coral },
  stone: { k: 'oval', tone: (c) => c.sun2 },
  wave: { k: 'cookie12', tone: (c) => c.sky },
  wire: { k: 'boom', tone: (c) => c.violet },
  weight: { k: 'bun', tone: (c) => c.violet },
  cloud: { k: 'puffy', tone: (c) => c.sky },
};
const OBJ_WATCH = 16;
export function ObjectMove({ on, onDone }: MoveProps) {
  const c = useTheme();
  const reduce = useReducedMotion();
  const [o, setO] = useState<string | null>(null);
  const sec = useClock(on && !!o);
  const p = Math.min(1, sec / OBJ_WATCH);
  useDoneAfter(!!o && sec >= OBJ_WATCH, 1800, onDone);
  const name = o ? (URGE_OBJECTS.find((x) => x[0] === o) || [o, o])[1] : '';
  useSay(o ? name + '. Look at it from a step back.' : '', on);
  if (!o)
    return (
      <View style={s.move}>
        <Words head="If the urge were a thing, what would it be?" sub="Pick the closest. Or swipe on." />
        {/* the thing it might be, shapeless still, in the open middle */}
        <View style={s.mid}>
          <MorphShape kind="softBurst" size={150} color={c.line} />
        </View>
        <View style={s.low}>
          <Tiles
            list={URGE_OBJECTS}
            cur={null}
            onPick={(v) => {
              setO(v);
              buzz('tap');
            }}
          />
        </View>
      </View>
    );
  const look = OBJ_LOOK[o] || OBJ_LOOK.stone;
  const size = reduce ? 170 : Math.round(220 - 90 * p);
  return (
    <View style={s.move}>
      <Words
        head={p < 1 ? name + '. Look at it.' : 'It is out there, not you.'}
        sub={
          p < 1 ? 'Where does it sit in your body? Watch it from a step back. You are the one looking.' : 'You can watch an urge without doing what it says.'
        }
      />
      <View style={s.mid}>
        <MorphShape kind={look.k} to="circle" t={reduce ? 0.5 : p} size={size} color={look.tone(c)} turn={reduce ? 0 : p * 40} />
      </View>
      <View style={s.line}>
        <WavyLine width={220} p={p} color={look.tone(c)} track={look.tone(c) + '33'} />
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
  written: WrittenMove,
  future: FutureMove,
  object: ObjectMove,
  selftalk: SelfTalkMove,
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
  written: 'It is written',
  future: 'Your note',
  object: 'If it were a thing',
  selftalk: 'Self Talk',
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
  written: 'shield',
  future: 'mic',
  object: 'sparkle',
  selftalk: 'chat',
};

export const moveTint = (c: Palette, id: string) =>
  ({
    breathe: c.sun,
    move: c.coral,
    stack: c.sky,
    ground: c.mint,
    feel: c.coral,
    forward: c.mint,
    thought: c.violet,
    reasons: c.sun2,
    written: c.sun2,
    future: c.sun2,
    object: c.coral,
    selftalk: c.sun2,
  })[id] || c.accent;

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
