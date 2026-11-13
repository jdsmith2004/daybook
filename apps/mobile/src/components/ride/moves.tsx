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
   - Your words: your note or a reason, read slowly, and your voice note.
   - If it were a thing: once a ride, "If the urge were an object, what would it be?" One tap (a tight knot, a hot stone),
     then the thing is watched from a step back while it softens and shrinks (core ride.ts RIDE_OBJECT). Next skips it.
   - It is written: for faith people only (core written.ts). Are you facing a temptation, hold to say no, the three pulls
     each answered as Jesus answered them in Matthew 4, then it left; then Matthew 5: it starts in the heart, cast away
     one real thing now, and you are the light, with your own flame. */
import {
  faithVoice,
  futureCap,
  futurePick,
  FWD_A,
  FWD_B,
  FWD_TOMORROW,
  GROUND,
  scrWrittenLabel,
  SCR_WRITTEN,
  THOUGHTS,
  URGE_OBJECTS,
  urFromYou,
  WRITTEN_CAST,
  writtenWords,
  type UrMem,
  type WrittenWords,
} from '@daybook/core';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Linking, Platform, Pressable, StyleSheet, View } from 'react-native';
import Reanimated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';

import { Appear } from '@/components/appear';
import { BigOption, Link, Tiles } from '@/components/choices';
import { BreathSun, useSeconds, useStartWhen } from '@/components/orb';
import { MorphShape, SQUIGGLE, useClock, WavyLine, WavyRing, type ShapeKind } from '@/components/shapes';
import { Text } from '@/components/text';
import { FastWords, Fork } from '@/components/tools/ride';
import { FeelMove } from './feel-move';
import { StackMove } from './stack';
import { BigFlame } from '@/components/big-flame';
import { Button, Icon, T } from '@/components/ui';
import { useFutureNote } from '@/components/future-note';
import { BigPlay } from '@/components/voice-note';
import { track } from '@/lib/events';
import { buzz } from '@/lib/feel';
import { useReducedMotion } from '@/lib/motion';
import { useScripture } from '@/lib/scripture';
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
  const t0 = useStartWhen(on);
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
    if (beat < 0 || !on) return;
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

/* ---------- it is written (Matthew 4:1-11, then Matthew 5; core written.ts) ---------- */
const WR_READ = 12;
const WR_HOLD = 1800;
/** how long each page that runs by itself stays, in seconds: the three pulls, then it left, the heart, and the light */
const WR_SEC: Record<number, number> = { 2: WR_READ, 3: WR_READ, 4: WR_READ, 5: 10, 6: WR_READ, 8: 16 };
/** the pages: 0 the question, 1 the hold, 2 to 4 the three pulls, 5 then it left, 6 the heart, 7 cast it away, 8 the light */
export function WrittenMove({ on, onDone, level }: MoveProps) {
  const c = useTheme();
  const st = useCareSettings();
  const w = writtenWords(faithVoice(st) || 'plain');
  const lib = useScripture();
  const [pg, setPg] = useState(0);
  const [cast, setCast] = useState<string | null>(null);
  const [pulse, setPulse] = useState(0);
  const go = (n: number) => {
    buzz('tap');
    setPg(n);
  };
  const timed = !!WR_SEC[pg];
  const sec = useClock(on && timed);
  const [t0, setT0] = useState(0);
  useEffect(() => setT0(sec), [pg]); // eslint-disable-line react-hooks/exhaustive-deps
  const read = timed ? Math.min(1, (sec - t0) / WR_SEC[pg]) : 0;
  useEffect(() => {
    if (read < 1) return;
    if (pg < 8) setPg(pg + 1);
    else onDone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [read >= 1]);
  const pull = pg >= 2 && pg <= 4 ? w.pulls[pg - 2] : null;
  const page = pg === 5 ? w.end : pg === 6 ? w.heart : pg === 7 ? w.cast : pg === 8 ? w.light : null;
  const head = pg === 0 ? w.ask.head : pg === 1 ? w.stand.head : pull ? pull.pull.replace('\n', ' ') : page ? page.head : '';
  useSay(head, on);
  if (pg === 0)
    return (
      <View style={s.move}>
        <Words head={w.ask.head} sub={w.ask.sub} />
        <View style={s.mid} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <MorphShape kind="cookie12" size={190} color={c.sunSoft}>
            <View>
              <Icon name="shield" size={64} color={c.sun2} />
            </View>
          </MorphShape>
        </View>
        <BigOption tone="sun" icon="shield" title={w.ask.yes} sub={w.ask.yesSub} onPress={() => go(1)} />
      </View>
    );
  if (pg === 1) return <WrittenStand w={w} on={on} onFull={() => setTimeout(() => setPg(2), 2600)} />;
  const card = pull || page!;
  const link = pg === 5 ? w.link : pg === 8 ? w.link5 : null;
  /* with the scripture library on, the chapter opens in Daybook on the verses the page quoted */
  const inLib = lib.on ? (pg === 5 ? SCR_WRITTEN.link : pg === 8 ? SCR_WRITTEN.link5 : null) : null;
  /* Matthew 4 is the first three marks, Matthew 5 the next three */
  const four = pg <= 5;
  return (
    <View style={s.move}>
      <Steps n={3} i={four ? pg - 2 : pg - 6} color={four ? c.sun2 : c.mint} track={(four ? c.sun2 : c.mint) + '33'} />
      <View style={s.words} accessibilityLiveRegion="polite" aria-live="polite">
        <Appear key={pg} by={6} duration={220}>
          {pull ? (
            <Text style={[s.pullT, { color: c.muted }]} accessibilityRole="header" accessibilityLabel={'The pull says: ' + head}>
              {pull.pull}
            </Text>
          ) : (
            <Text style={[s.head, { color: c.ink }]} accessibilityRole="header">
              {page!.head}
            </Text>
          )}
        </Appear>
        <T tone="muted" style={s.c}>
          {pull ? pull.faced : page!.sub}
        </T>
      </View>
      <View style={s.mid}>
        {pg === 8 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Your flame"
            onPress={() => {
              buzz('lit');
              setPulse((x) => x + 1);
            }}>
            <BigFlame level={level || 1} size={170} pulse={pulse} noLand />
          </Pressable>
        ) : null}
        {pg === 7 && cast ? (
          <Appear key="did" by={10} duration={420}>
            <View style={s.castDo}>
              <MorphShape kind="sunny" size={150} color={c.mint}>
                <View>
                  <Icon name="check" size={56} color="#FFFFFF" />
                </View>
              </MorphShape>
              <Text style={[s.standT, { color: c.ink }]}>{(WRITTEN_CAST.find((x) => x[0] === cast) || ['', ''])[1] + '. ' + w.cast.doIt}</Text>
              <T tone="muted" style={s.c}>
                {w.cast.doSub}
              </T>
            </View>
          </Appear>
        ) : (
          <Appear key={'v' + pg} by={10} duration={420}>
            <View style={[s.note, { backgroundColor: four ? c.sunSoft : c.mintSoft }]}>
              <Text style={[s.verseT, { color: c.ink }]}>
                <Text style={{ color: four ? c.sunText : c.mintText }}>{card.lead}</Text> {card.rest}
              </Text>
              {card.ref ? (
                <T v="small" tone={four ? 'sunText' : 'mintText'}>
                  {card.ref}
                </T>
              ) : null}
            </View>
          </Appear>
        )}
      </View>
      {pg === 7 ? (
        cast ? (
          <Button label={w.cast.did} onPress={() => go(8)} />
        ) : (
          <View style={{ gap: 10 }}>
            <T v="label" style={s.c}>
              {w.cast.ask}
            </T>
            <Tiles
              list={WRITTEN_CAST}
              cur={cast}
              onPick={(v) => {
                buzz('save');
                setCast(v);
              }}
            />
          </View>
        )
      ) : link ? (
        <View style={s.quiet}>
          <Link
            label={inLib ? scrWrittenLabel(link.label) : link.label}
            tone="muted"
            onPress={() => (inLib ? router.push({ pathname: '/scripture/read', params: inLib }) : Linking.openURL(link.url).catch(() => undefined))}
          />
        </View>
      ) : pg === 5 || pg === 8 ? null : (
        <View style={[s.line, { gap: 8 }]}>
          <T v="label" style={s.c}>
            {w.pulls[0].ref ? 'Read it out loud, slowly.' : 'Say it out loud, slowly.'}
          </T>
          <WavyLine width={220} p={read} color={four ? c.sun2 : c.mint} track={(four ? c.sun2 : c.mint) + '33'} />
        </View>
      )}
    </View>
  );
}

/** Say no to it: hold the sun down until the ring fills, then the line that stands firm */
function WrittenStand({ w, on, onFull }: { w: WrittenWords; on: boolean; onFull: () => void }) {
  const c = useTheme();
  const [t0, setT0] = useState<number | null>(null);
  const [full, setFull] = useState(false);
  useClock(on && t0 !== null && !full);
  const p = full ? 1 : t0 !== null ? Math.min(1, (Date.now() - t0) / WR_HOLD) : 0;
  const fill = () => {
    if (full) return;
    setFull(true);
    buzz('lit');
    onFull();
  };
  const step = Math.floor(p * 6);
  useEffect(() => {
    if (step > 0 && step < 6 && !full) buzz('tick');
    if (step >= 6) fill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);
  /* a press with no start is a screen reader's click (or a keyboard): it says no at once */
  const pressed = useRef(false);
  return (
    <View style={s.move}>
      <Words head={w.stand.head} sub={full ? undefined : w.stand.sub} />
      <View style={s.mid}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Say no. Press and hold."
          accessibilityState={{ checked: full }}
          onPressIn={() => {
            if (full) return;
            pressed.current = true;
            setT0(Date.now());
            buzz('tap');
          }}
          onPressOut={() => {
            if (!full) setT0(null);
          }}
          onPress={() => {
            if (!pressed.current) fill();
            pressed.current = false;
          }}>
          <WavyRing size={250} p={p} color={c.sun2} track={c.sun2 + '2E'} stroke={6} speed={full ? SQUIGGLE.speed : 0}>
            <MorphShape kind={full ? 'sunny' : 'circle'} size={180} color={c.sun}>
              <Text style={[s.big, { color: c.onSun }]}>No</Text>
            </MorphShape>
          </WavyRing>
        </Pressable>
        {full ? (
          <Appear by={8} duration={500}>
            <Text style={[s.standT, { color: c.ink }]}>{w.stand.line}</Text>
          </Appear>
        ) : null}
      </View>
      {w.stand.verse ? (
        <T v="small" tone="muted" style={s.c}>
          {w.stand.verse + ' ' + w.stand.ref}
        </T>
      ) : null}
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
  pullT: { fontFamily: font.display, fontSize: 22, lineHeight: 28, textAlign: 'center', textDecorationLine: 'line-through' },
  verseT: { fontFamily: font.display, fontSize: 22, lineHeight: 30 },
  castDo: { alignItems: 'center', gap: 10 },
  standT: { fontFamily: font.display, fontSize: 22, lineHeight: 28, textAlign: 'center' },
});
