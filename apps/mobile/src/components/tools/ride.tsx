/* Ride the wave: Get curious, Name the thought, Play it forward. Ported from the legacy SCENES.curious, thought and forward. */
import { CU_BODY, CU_CHG, CU_D, CU_MS, CU_SAY, cuLine, FWD_A, FWD_B, FWD_TOMORROW, THOUGHTS, thoughtIn } from '@daybook/core';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import { KeepAbove } from '@/components/keyboard';
import { Text } from '@/components/text';
import Svg, { Path } from 'react-native-svg';

import { AddTile, Field, Link, Tiles } from '@/components/choices';
import { fmtMS, useSeconds } from '@/components/orb';
import { Appear } from '@/components/appear';
import { Button, Card, Chip, Icon, T } from '@/components/ui';
import { along, blobPath, envelope, MorphShape, plainPath, Shape, SQUIGGLE, squigglePath, SVG_HIDE, useClock, WavyLine, type Along } from '@/components/shapes';
import { Dock, Middle, Stage } from '@/components/scene';
import { breathAt, useBreathSeconds, type Steps } from '@/lib/breath';
import { buzz } from '@/lib/feel';
import { NATIVE, useReducedMotion } from '@/lib/motion';
import { useSos } from '@/lib/sos';
import { font, useTheme } from '@/lib/theme';

import type { ToolProps } from './types';

/* ---------- get curious ---------- */
/** the steps of a stepped tool (Get curious, Play it forward): the step number and which way it slides live in Tool, and
    what was picked lives here, so the tool stays mounted from step to step and only the Stage slides */
type Stepped = { step: number; setStep: (i: number) => void; dir: -1 | 0 | 1 };

export function Curious({ finish, step, setStep, dir }: ToolProps & Stepped) {
  const c = useTheme();
  const [body, setBody] = useState<string | null>(null);
  const [chg, setChg] = useState<string | null>(null);
  /* each answer to "Right now it is" leaves a mark on the wave where the dot was, so the person sees their own urge's
     shape as they go (urge surfing: rate it as it changes, and watch it rise and fall) */
  const [marks, setMarks] = useState<WaveMark[]>([]);
  const [w0, setW0] = useState<number | null>(null);
  useEffect(() => {
    if (step === 2 && w0 == null) setW0(Date.now());
  }, [step, w0]);
  const sec = useSeconds(w0, step === 2);
  const next = (
    <Dock>
      <Button label="Next" onPress={() => setStep(step + 1)} />
    </Dock>
  );
  if (step === 0)
    return (
      <Stage key={'s' + step} dir={dir}>
        <Middle>
          <Breath />
          <T v="eyebrow" tone="muted">
            Notice it
          </T>
          <T v="title" style={s.c} accessibilityRole="header">
            An urge is here. Let it be.
          </T>
          <T style={s.c}>Drop your shoulders. Breathe with the shape. You do not have to fight it or obey it.</T>
        </Middle>
        <OnByItself after={12} onGo={() => setStep(1)} />
        {next}
      </Stage>
    );
  if (step === 1)
    return (
      <Stage key={'s' + step} dir={dir}>
        <T v="eyebrow" tone="muted">
          Look closer
        </T>
        <T v="title" style={s.c} accessibilityRole="header">
          Where do you feel it?
        </T>
        <T style={s.c}>Look inside, like a curious scientist. There is no wrong answer.</T>
        <Dock>
          <Tiles
            list={CU_BODY}
            cur={body}
            onPick={(v) => {
              setBody(v);
              buzz('tap');
              setStep(2);
            }}
          />
        </Dock>
        <Link label="Skip" onPress={() => setStep(2)} />
      </Stage>
    );
  const p = Math.min(1, (sec * 1000) / CU_MS);
  const line = cuLine(body, null);
  const mark = (k: string) => {
    buzz('tap');
    setChg(k);
    setMarks((m) => m.filter((x) => Math.abs(x.p - p) > 0.04).concat([{ p, k }]));
  };
  return (
    <Stage key={'s' + step} dir={dir}>
      <T v="eyebrow" tone="muted">
        Watch it
      </T>
      <T v="title" style={s.c} accessibilityRole="header">
        Now just watch it.
      </T>
      <Middle>
        <Text style={[s.time, { color: c.ink }]} accessibilityLabel={p < 1 ? fmtMS(CU_MS - sec * 1000) + ' left' : 'Watched'}>
          {p < 1 ? fmtMS(CU_MS - sec * 1000) : '0:00'}
        </Text>
        <Wave start={w0} color={c.accent} track={c.muted} marks={marks} />
        <T v="label" style={[s.c, { color: c.accentText }]} accessibilityLiveRegion="polite">
          {p >= 1 ? peakLine(marks) || wavePhase(p) : wavePhase(p)}
        </T>
      </Middle>
      <Dock>
        <T style={[s.c, s.say]} accessibilityLiveRegion="polite">
          {chg ? CU_SAY[chg] : (line ? line + ' ' : '') + 'Breathe slowly. You are not trying to make it go away.'}
        </T>
        <T v="label" style={s.c}>
          Right now it is
        </T>
        <View style={s.three}>
          {CU_CHG.map(([k, label]) => (
            <ChangeButton key={k} k={k} label={label} on={chg === k} onPress={() => mark(k)} />
          ))}
        </View>
        <Button label="Done" onPress={() => finish('curious', { msg: peakLine(marks) || 'You watched it. That is the skill.' })} />
      </Dock>
    </Stage>
  );
}

/** where the wave is, in a few words: an urge builds, tops out (the peak is about halfway along the line), and falls on
    its own */
function wavePhase(p: number): string {
  if (p >= 1) return 'It came, and it went by.';
  if (p < 0.4) return 'It is building. Let it.';
  if (p < 0.6) return 'This is the top. It goes no higher.';
  return 'It is falling. Let it pass.';
}

/** what the person's own marks showed: when it was at its biggest, and that it came down after (the point of watching:
    it passes without being obeyed) */
function peakLine(marks: WaveMark[]): string {
  const ms = marks.slice().sort((a, b) => a.p - b.p);
  const up = ms.filter((m) => m.k === 'bigger').pop();
  const down = ms.find((m) => m.k === 'smaller' && (!up || m.p > up.p));
  if (up && down) return 'It peaked at ' + fmtMS(up.p * CU_MS) + ', then came down on its own.';
  if (down) return 'It got smaller at ' + fmtMS(down.p * CU_MS) + ', and you only watched.';
  return '';
}

/** goes on to the next step by itself after `after` seconds (a step that only asks you to breathe and notice) */
function OnByItself({ after, onGo }: { after: number; onGo: () => void }) {
  const go = useRef(onGo);
  go.current = onGo;
  useEffect(() => {
    const t = setTimeout(() => go.current(), after * 1000);
    return () => clearTimeout(t);
  }, [after]);
  return null;
}

/** a mark on the wave: how far along it was (0 to 1) and the answer then (bigger, same, smaller) */
type WaveMark = { p: number; k: string };
const MARK_ICON: Record<string, string> = { bigger: 'up', smaller: 'down' };

/** one of the three big answers to "Right now it is" */
function ChangeButton({ k, label, on, onPress }: { k: string; label: string; on: boolean; onPress: () => void }) {
  const c = useTheme();
  const [soft, ink] = k === 'bigger' ? [c.coralSoft, c.coralText] : k === 'smaller' ? [c.mintSoft, c.mintText] : [c.surface2, c.ink];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      onPress={onPress}
      style={({ pressed }) => [
        s.chg,
        { backgroundColor: on ? soft : c.surface, borderColor: on ? ink : 'transparent', transform: [{ translateY: pressed ? 2 : 0 }] },
      ]}>
      {MARK_ICON[k] ? <Icon name={MARK_ICON[k]} size={26} color={ink} /> : <View style={[s.flat, { backgroundColor: ink }]} />}
      <Text style={[s.chgT, { color: on ? ink : c.ink }]} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}

/* the 90-second wave: the shape of an urge, which builds, peaks a little before the middle, and falls back. It is drawn
   zoomed in, wider than the screen, and the view glides along with the dot, so the line is big and always moving. The
   part still to come is a plain, quiet line; the part already watched turns into the squiggle (the same one as the timer
   rings, components/shapes SQUIGGLE), easing in from flat and crawling, behind a dot that glides along the front on a
   smooth clock. The person's own answers ("Right now it is") sit on it as marks where the dot was. */
function Wave({ start, color, track, marks }: { start: number | null; color: string; track: string; marks: WaveMark[] }) {
  const c = useTheme();
  const reduce = useReducedMotion();
  const [w, setW] = useState(0);
  const pulse = useRef(new Animated.Value(0)).current;
  /* a smooth clock for the dot, the crawl and the view (useClock runs about 30 times a second) */
  const sec = useClock(start != null);
  const p = start == null ? 0 : Math.min(1, (Date.now() - start) / CU_MS);
  useEffect(() => {
    if (reduce) return;
    const a = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
        Animated.timing(pulse, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
      ]),
    );
    a.start();
    return () => a.stop();
  }, [reduce, pulse]);
  /* the whole wave is WV_ZOOM screens wide; up and down it fills the height given */
  const full = w * WV_ZOOM;
  const L = useMemo(
    () =>
      along(CU_BASE.map(([x, y]) => [WV_PAD + ((x - 10) / 240) * (full - 2 * WV_PAD), WV_PAD + ((y - 10) / 86) * (WV_TALL - 2 * WV_PAD)] as [number, number])),
    [full],
  );
  const head = p * L.len;
  const phase = reduce ? 0 : sec * SQUIGGLE.speed * Math.PI * 2;
  const done = squigglePath(L, 0, head, SQUIGGLE.amp * 1.4 * envelope(p), SQUIGGLE.wavelength, phase);
  const rest = plainPath(L, p > 0 ? Math.min(L.len, head + SQUIGGLE.stroke + 4) : 0, L.len);
  const [x, y] = L.pts.length ? pointOn(L, head) : [0, 0];
  /* the view keeps the dot a little left of the middle, so more of what is coming shows */
  const view = Math.max(0, Math.min(full - w, x - w * 0.42));
  return (
    <View
      style={[s.wave, { height: WV_TALL }]}
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      {w ? (
        <View style={{ width: full, height: WV_TALL, transform: [{ translateX: -view }] }}>
          <Svg width={full} height={WV_TALL}>
            {rest ? (
              <Path d={rest} stroke={track} strokeOpacity={0.3} strokeWidth={SQUIGGLE.stroke * 1.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            ) : null}
            {done ? <Path d={done} stroke={color} strokeWidth={SQUIGGLE.stroke * 1.6} fill="none" strokeLinecap="round" strokeLinejoin="round" /> : null}
          </Svg>
          {marks.map((m) => {
            const [mx, my] = pointOn(L, m.p * L.len);
            const ink = m.k === 'bigger' ? c.coralText : m.k === 'smaller' ? c.mintText : c.muted;
            return (
              <View key={m.p} style={[s.mark, { left: mx - 15, top: my - 48, backgroundColor: c.surface, borderColor: ink }]}>
                {MARK_ICON[m.k] ? <Icon name={MARK_ICON[m.k]} size={18} color={ink} /> : <View style={[s.flatS, { backgroundColor: ink }]} />}
              </View>
            );
          })}
          <Animated.View
            style={[
              s.glow,
              {
                left: x - 34,
                top: y - 34,
                backgroundColor: color,
                opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.14, 0.3] }),
                transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.75, 1.1] }) }],
              },
            ]}
          />
          <View style={[s.dot, { left: x - 13, top: y - 13, backgroundColor: color, borderColor: '#FFFFFF' }]} />
        </View>
      ) : null}
    </View>
  );
}
/* how much wider than the screen the wave is drawn, how tall, and the room left around it for the dot's glow */
const WV_ZOOM = 2.6;
const WV_TALL = 210;
const WV_PAD = 34;
/* the point at length s along a path */
function pointOn(L: Along, s: number): [number, number] {
  let j = 1;
  while (j < L.pts.length - 1 && L.at[j] < s) j++;
  const a = L.pts[j - 1];
  const b = L.pts[j];
  const f = Math.max(0, Math.min(1, (s - L.at[j - 1]) / (L.at[j] - L.at[j - 1] || 1)));
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
}
/* CU_D is four cubic curves from (10,96) to (250,96), drawn in a 260 by 116 box */
/* points along CU_D, close together, with no wiggle: the squiggle is added as it is drawn */
const CU_BASE: [number, number][] = (() => {
  const segs: number[][] = [
    [10, 96, 46, 96, 62, 76, 82, 50],
    [82, 50, 102, 24, 112, 10, 128, 10],
    [128, 10, 144, 10, 158, 38, 178, 64],
    [178, 64, 198, 90, 220, 96, 250, 96],
  ];
  const base: [number, number][] = [];
  segs.forEach(([x0, y0, x1, y1, x2, y2, x3, y3]) => {
    for (let k = 0; k < 60; k++) {
      const t = k / 60;
      const u = 1 - t;
      base.push([
        u * u * u * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3,
        u * u * u * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3,
      ]);
    }
  });
  base.push([250, 96]);
  return base;
})();

/* ---------- name the thought ---------- */
export function Thought({ finish, text, setText }: ToolProps & { text: string | null; setText: (t: string | null) => void }) {
  const c = useTheme();
  const [writing, setWriting] = useState(false);
  const [own, setOwn] = useState('');
  const reduce = useReducedMotion();
  const [gone, setGone] = useState(false);
  /* saying it fast, over and over, for 20 seconds: when it started (null when not saying it) */
  const [fast, setFast] = useState<number | null>(null);
  const drift = useRef(new Animated.Value(0)).current;
  /* the card floats up and away like a leaf on a stream, swaying a little as it fades; with Reduce Motion it only fades */
  const letGo = () => {
    buzz('tap');
    setGone(true);
    Animated.timing(drift, { toValue: 1, duration: reduce ? 500 : 2600, easing: Easing.inOut(Easing.quad), useNativeDriver: NATIVE }).start();
  };
  if (!text)
    return (
      <Stage key="pick" dir={0}>
        <T v="title" style={s.c} accessibilityRole="header">
          What is the urge telling you?
        </T>
        <T style={s.c}>Pick the closest one, or write your own.</T>
        {writing ? (
          <KeepAbove style={{ width: '100%', gap: 8 }}>
            <Field
              label="The thought, in your words"
              hideLabel
              autoFocus
              maxLength={80}
              value={own}
              onChangeText={setOwn}
              placeholder="Like “I will start again tomorrow”"
              returnKeyType="done"
            />
            <View style={s.row}>
              <Button
                label="Use this"
                onPress={() => {
                  const t = own.replace(/\s+/g, ' ').trim().slice(0, 80);
                  if (t) {
                    setText(t);
                    setWriting(false);
                  }
                }}
              />
              <Link label="Cancel" onPress={() => setWriting(false)} />
            </View>
          </KeepAbove>
        ) : null}
        <Dock>
          <Tiles
            list={THOUGHTS}
            cur={null}
            onPick={(v) => {
              const x = THOUGHTS.find((y) => y[0] === v);
              if (x) {
                setText(x[1]);
                buzz('tap');
              }
            }}
            extra={writing ? null : <AddTile label="Write my own" onPress={() => setWriting(true)} />}
          />
        </Dock>
      </Stage>
    );
  /* say it fast: said over and over, a thought turns into sounds and loses its pull (word repetition, Masuda and others,
     2004). The words beat faster and fade while you say them; after 20 seconds the card floats away. */
  if (fast != null)
    return (
      <Stage key="fast" dir={1}>
        <T v="title" style={s.c} accessibilityRole="header">
          Say it out loud, fast, again and again.
        </T>
        <T style={s.c}>In your head works too. A silly cartoon voice works even better.</T>
        <Middle>
          <FastWords
            text={thoughtIn(text)}
            start={fast}
            onDone={() => {
              setFast(null);
              letGo();
            }}
          />
        </Middle>
        <Dock>
          <Button
            label="Let it go"
            onPress={() => {
              setFast(null);
              letGo();
            }}
          />
        </Dock>
      </Stage>
    );
  return (
    <Stage key="card" dir={fast == null && gone ? 0 : 1}>
      <T v="title" style={s.c} accessibilityRole="header">
        A thought is not an order.
      </T>
      <T style={s.c}>It can be loud and still be wrong.</T>
      <Middle>
        <View style={s.stay}>
          {gone ? (
            <View style={s.calmWrap} pointerEvents="none">
              <Appear by={10} delay={reduce ? 0 : 900} duration={600}>
                <Text style={[s.calm, { color: c.ink }]} accessibilityLiveRegion="polite">
                  {'It was a thought.\nYou are still here.'}
                </Text>
              </Appear>
            </View>
          ) : null}
          <Animated.View
            pointerEvents="none"
            accessibilityElementsHidden={gone}
            importantForAccessibility={gone ? 'no-hide-descendants' : 'auto'}
            style={[
              s.stay,
              gone
                ? {
                    opacity: drift.interpolate({ inputRange: [0, 0.6, 1], outputRange: [1, 0.55, 0] }),
                    transform: reduce
                      ? []
                      : [
                          { translateY: drift.interpolate({ inputRange: [0, 1], outputRange: [0, -300] }) },
                          { translateX: drift.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [0, 16, -10, 14, -4] }) },
                          { rotate: drift.interpolate({ inputRange: [0, 0.3, 0.65, 1], outputRange: ['0deg', '4deg', '-3deg', '5deg'] }) },
                          { scale: drift.interpolate({ inputRange: [0, 1], outputRange: [1, 0.82] }) },
                        ],
                  }
                : null,
            ]}>
            <Appear by={14} delay={120} style={s.stay}>
              <BlobCard color={c.violetSoft} lip={c.lip}>
                <T v="small" tone="violetText" style={s.c}>
                  I notice I am having the thought that
                </T>
                <Text style={[s.thoughtT, { color: c.ink }]}>“{thoughtIn(text)}.”</Text>
              </BlobCard>
            </Appear>
          </Animated.View>
        </View>
      </Middle>
      <Dock>
        {gone ? (
          <Button label="Done" onPress={() => finish('thought', { msg: 'A thought is not an order.' })} />
        ) : (
          <>
            <Button
              label="Say it fast, 20 seconds"
              onPress={() => {
                buzz('tap');
                setFast(Date.now());
              }}
            />
            <View style={s.quiet}>
              <Link label="Just let it go" onPress={letGo} />
            </View>
          </>
        )}
      </Dock>
    </Stage>
  );
}

const FAST_SEC = 20;
/** the thought said over and over: it beats, slowly at first and faster and faster, and fades and spreads apart as it goes,
    with a squiggle under it for the 20 seconds. Calls onDone at the end. */
function FastWords({ text, start, onDone }: { text: string; start: number; onDone: () => void }) {
  const c = useTheme();
  const reduce = useReducedMotion();
  useClock(true);
  const t = Math.min(FAST_SEC, (Date.now() - start) / 1000);
  const f = t / FAST_SEC;
  /* about one beat a second at the start, three a second at the end */
  const beats = 0.9 * t + (1.95 * t * t) / (2 * FAST_SEC);
  const n = Math.floor(beats);
  const pop = reduce ? 0 : Math.max(0, 1 - (beats - n) * 4);
  useEffect(() => {
    if (n > 0) buzz('tap');
  }, [n]);
  const done = useRef(onDone);
  done.current = onDone;
  useEffect(() => {
    if (t >= FAST_SEC) done.current();
  }, [t]);
  return (
    <View style={{ alignItems: 'center', gap: 22, alignSelf: 'stretch' }}>
      <Text
        style={[s.fastT, { color: c.ink, opacity: 1 - 0.6 * f, letterSpacing: 5 * f, transform: [{ scale: 1 + 0.12 * pop }] }]}
        accessibilityLabel={'Say it over and over: ' + text}>
        {text}
      </Text>
      <WavyLine width={220} p={f} color={c.violet} track={c.line} />
      <T v="small" tone="muted">
        {Math.ceil(FAST_SEC - t)} seconds
      </T>
    </View>
  );
}

/* the thought card on a soft, slightly uneven blob instead of a plain rounded box. The blob is drawn in a 100 by 100 box
   and stretched to fit the card, with the same lip under it that the cards have. */
function BlobCard({ color, lip, children }: { color: string; lip: string; children: ReactNode }) {
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  return (
    <View style={s.thought} onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height - 5 })}>
      {box
        ? [lip, color].map((fill, j) => (
            <Svg key={j} width={box.w} height={box.h} viewBox="0 0 100 100" preserveAspectRatio="none" style={[s.blob, { top: j ? 0 : 5 }]}>
              <Path d={THOUGHT_BLOB} fill={fill} />
            </Svg>
          ))
        : null}
      {children}
    </View>
  );
}
/* four soft corners at the diagonals (a rounded square, stretched to a wide card) with a little wobble */
const THOUGHT_BLOB = blobPath(50, 50, 45, 4, 0.06, Math.PI / 4, 0.45, 3, true);

/* ---------- play it forward ---------- */
export function Forward({ finish, step, setStep, dir }: ToolProps & Stepped) {
  const c = useTheme();
  const { mem, setMem } = useSos();
  /* your answers from last time are already picked */
  const [a, setA] = useState<string[]>(() => (mem.fwd?.a || []).slice());
  const [b, setB] = useState<string[]>(() => (mem.fwd?.b || []).slice());
  /* the good moment to picture tomorrow morning, kept with the answers */
  const [tm, setTm] = useState(() => (FWD_TOMORROW.some((x) => x[0] === mem.fwd?.c) ? (mem.fwd?.c as string) : FWD_TOMORROW[0][0]));
  /* asked once: with answers from last time, it opens straight on the two hours */
  useEffect(() => {
    if (step === 0 && (a.length || b.length)) setStep(2);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const toggle = (L: string[], set: (x: string[]) => void, v: string) => {
    set(L.indexOf(v) >= 0 ? L.filter((x) => x !== v) : L.concat(v));
    buzz('tap');
  };
  if (step === 0)
    return (
      <Stage key={'s' + step} dir={dir}>
        <T v="eyebrow" tone="muted">
          If I give in
        </T>
        <T v="title" style={s.c} accessibilityRole="header">
          An hour after giving in, I usually feel…
        </T>
        <T style={s.c}>Tap all that fit. Be honest. Nobody else sees this.</T>
        <Dock>
          <Tiles list={FWD_A} cur={a} onPick={(v) => toggle(a, setA, v)} />
          <Button label="Next" onPress={() => setStep(1)} />
        </Dock>
      </Stage>
    );
  if (step === 1)
    return (
      <Stage key={'s' + step} dir={dir}>
        <T v="eyebrow" tone="muted">
          If I ride it out
        </T>
        <T v="title" style={s.c} accessibilityRole="header">
          An hour after riding it out, I usually feel…
        </T>
        <T style={s.c}>Think of a time you let one pass.</T>
        <Dock>
          <Tiles list={FWD_B} cur={b} onPick={(v) => toggle(b, setB, v)} />
          <Button
            label="Next"
            onPress={() => {
              setMem((m) => ({ ...m, fwd: { a: a.slice(0, 7), b: b.slice(0, 7), c: tm } }));
              setStep(2);
            }}
          />
        </Dock>
      </Stage>
    );
  const words = (list: [string, string][], ids: string[]) => list.filter((x) => ids.indexOf(x[0]) >= 0).map((x) => x[1].toLowerCase());
  const wa = words(FWD_A, a);
  const wb = words(FWD_B, b);
  const tmText = (FWD_TOMORROW.find((x) => x[0] === tm) || FWD_TOMORROW[0])[1];
  const nextTm = () => {
    const i = FWD_TOMORROW.findIndex((x) => x[0] === tm);
    const k = FWD_TOMORROW[(i + 1) % FWD_TOMORROW.length][0];
    setTm(k);
    setMem((m) => ({ ...m, fwd: { a: a.slice(0, 7), b: b.slice(0, 7), c: k } }));
    buzz('tap');
  };
  /* one picture: the road splits at now into the two hours, in your own words, and under them one good moment to picture
     tomorrow morning (core FWD_TOMORROW) */
  return (
    <Stage key={'s' + step} dir={dir}>
      <T v="title" style={s.c} accessibilityRole="header">
        Which hour do you want?
      </T>
      <Middle>
        <View style={{ alignSelf: 'stretch', alignItems: 'center' }}>
          <View style={[s.now, { backgroundColor: c.surface }]}>
            <T v="small" style={{ fontFamily: font.bodyBold }}>
              Now
            </T>
          </View>
          <Fork left={c.slip} right={c.mint} />
          <View style={s.two}>
            <Card style={{ flex: 1, backgroundColor: c.slipSoft, borderColor: c.slipSoft }}>
              <T v="small" tone="slipText">
                An hour after giving in
              </T>
              <T>{wa.length ? wa.join(', ') : 'You did not pick anything.'}</T>
            </Card>
            <Card style={{ flex: 1, backgroundColor: c.mintSoft, borderColor: c.mintSoft }}>
              <T v="small" tone="mintText">
                An hour after riding it out
              </T>
              <T>{wb.length ? wb.join(', ') : 'You did not pick anything.'}</T>
            </Card>
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={'Tomorrow morning: ' + tmText + '. Tap for another one.'}
          onPress={nextTm}
          style={({ pressed }) => [s.tomorrow, { backgroundColor: c.sunSoft, transform: [{ translateY: pressed ? 2 : 0 }] }]}>
          <T v="small" tone="sunText">
            Tomorrow morning, picture it
          </T>
          <Text style={[s.tmT, { color: c.ink }]}>{tmText}</Text>
          <T v="small" tone="muted">
            Where are you? Who is there? Tap for another.
          </T>
        </Pressable>
      </Middle>
      <Dock>
        <Button label="Ride it out" onPress={() => finish('forward', { msg: 'You picked the better hour.' })} />
        <View style={s.quiet}>
          <Link label="Change my answers" onPress={() => setStep(0)} />
        </View>
      </Dock>
    </Stage>
  );
}

/** the road from now splitting in two, toward the two hours: a soft curve down to each card */
function Fork({ left, right }: { left: string; right: string }) {
  const [w, setW] = useState(0);
  return (
    <View style={{ alignSelf: 'stretch', height: 40 }} onLayout={(e) => setW(e.nativeEvent.layout.width)} {...SVG_HIDE}>
      {w ? (
        <Svg width={w} height={40}>
          <Path d={`M${w / 2} 0 C ${w / 2} 22, ${w * 0.25} 16, ${w * 0.25} 40`} stroke={left} strokeWidth={5} strokeLinecap="round" fill="none" />
          <Path d={`M${w / 2} 0 C ${w / 2} 22, ${w * 0.75} 16, ${w * 0.75} 40`} stroke={right} strokeWidth={5} strokeLinecap="round" fill="none" />
        </Svg>
      ) : null}
    </View>
  );
}

/* a small sun cookie that breathes slowly (4 s in, 6 s out) and turns a little on each breath, for the steps that only
   ask you to notice */
function Breath() {
  const c = useTheme();
  const reduce = useReducedMotion();
  /* how far the breath is, on the one breath curve (lib/breath), to change the shape with it: a soft cookie when empty,
     a sunny shape when full */
  const t = breathAt(BREATH, useBreathSeconds(!reduce))[0];
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[s.breath, { transform: [{ scale: 0.86 + 0.22 * t }, { rotate: t * 30 + 'deg' }] }]}>
      <MorphShape kind="cookie9" to="sunny" t={t} size={112} color={c.sunSoft}>
        <MorphShape kind="cookie4" to="cookie7" t={t} size={46} color={c.sun} turn={-t * 50} />
      </MorphShape>
    </View>
  );
}
const BREATH: Steps = [
  ['in', 4],
  ['out', 6],
];

const s = StyleSheet.create({
  c: { textAlign: 'center' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  two: { flexDirection: 'row', gap: 10, alignSelf: 'stretch' },
  thought: { alignSelf: 'stretch', gap: 10, paddingVertical: 46, paddingHorizontal: 34, marginBottom: 5 },
  stay: { alignSelf: 'stretch' },
  blob: { position: 'absolute', left: 0 },
  quiet: { alignItems: 'center' },
  calmWrap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  calm: { fontFamily: font.display, fontSize: 24, lineHeight: 30, textAlign: 'center' },
  now: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 999 },
  tomorrow: { alignSelf: 'stretch', gap: 4, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 18 },
  tmT: { fontFamily: font.display, fontSize: 21, lineHeight: 27 },
  fastT: { fontFamily: font.displayBold, fontSize: 34, lineHeight: 42, textAlign: 'center' },
  thoughtT: { fontFamily: font.display, fontSize: 28, lineHeight: 34, textAlign: 'center' },
  breath: { width: 112, height: 112, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  wave: { alignSelf: 'stretch', overflow: 'hidden', marginHorizontal: -16 },
  glow: { position: 'absolute', width: 68, height: 68, borderRadius: 34 },
  dot: { position: 'absolute', width: 26, height: 26, borderRadius: 13, borderWidth: 4 },
  mark: { position: 'absolute', width: 30, height: 30, borderRadius: 15, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  flatS: { width: 12, height: 3, borderRadius: 2 },
  time: { fontFamily: font.displayBold, fontSize: 64, lineHeight: 70, fontVariant: ['tabular-nums'], textAlign: 'center' },
  /* room for the longest line, so the buttons below never move when it changes */
  say: { minHeight: 63 },
  three: { flexDirection: 'row', gap: 8, alignSelf: 'stretch' },
  chg: { flex: 1, minHeight: 84, borderRadius: 20, borderWidth: 2, alignItems: 'center', justifyContent: 'center', gap: 4, paddingHorizontal: 6 },
  chgT: { fontFamily: font.bodyBold, fontSize: 15, lineHeight: 19, textAlign: 'center' },
  flat: { width: 22, height: 3.5, borderRadius: 2, marginVertical: 11 },
});
