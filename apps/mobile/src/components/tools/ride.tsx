/* Ride the wave: Get curious, Name the thought, Play it forward. Ported from the legacy SCENES.curious, thought and forward. */
import { CU_BODY, CU_CHG, CU_D, CU_FEEL, CU_MS, CU_SAY, cuLine, FWD_A, FWD_B, THOUGHTS, thoughtIn } from '@daybook/core';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { KeepAbove } from '@/components/keyboard';
import { Text } from '@/components/text';
import Svg, { Path } from 'react-native-svg';

import { AddTile, Field, Link, Tiles } from '@/components/choices';
import { fmtMS, useSeconds } from '@/components/orb';
import { Appear } from '@/components/appear';
import { Button, Card, Chip, T } from '@/components/ui';
import { blobPath, MorphShape, Shape, WavyLine } from '@/components/shapes';
import { Dock, Middle, Stage } from '@/components/scene';
import { buzz } from '@/lib/feel';
import { NATIVE, useReducedMotion } from '@/lib/motion';
import { useSos } from '@/lib/sos';
import { font, useTheme } from '@/lib/theme';

import type { ToolProps } from './types';

/* ---------- get curious ---------- */
export function Curious({ finish, step, setStep }: ToolProps & { step: number; setStep: (i: number) => void }) {
  const c = useTheme();
  const [body, setBody] = useState<string | null>(null);
  const [feel, setFeel] = useState<string | null>(null);
  const [chg, setChg] = useState<string | null>(null);
  const [w0, setW0] = useState<number | null>(null);
  useEffect(() => {
    if (step === 4 && w0 == null) setW0(Date.now());
  }, [step, w0]);
  const sec = useSeconds(w0, step === 4);
  const next = (
    <Dock>
      <Button label="Next" onPress={() => setStep(step + 1)} />
    </Dock>
  );
  if (step === 0)
    return (
      <>
        <Middle>
          <Breath />
          <T v="eyebrow" tone="muted">
            Notice it
          </T>
          <T v="title" style={s.c} accessibilityRole="header">
            An urge is here.
          </T>
          <T style={s.c}>That is all you have to see right now. Drop your shoulders and unclench your jaw. Take one slow breath.</T>
        </Middle>
        {next}
      </>
    );
  if (step === 1)
    return (
      <>
        <Middle>
          <Breath />
          <T v="eyebrow" tone="muted">
            Let it be
          </T>
          <T v="title" style={s.c} accessibilityRole="header">
            Let it be here.
          </T>
          <T style={s.c}>You do not have to fight it or obey it. Give it a minute without doing anything about it.</T>
        </Middle>
        {next}
      </>
    );
  if (step === 2)
    return (
      <>
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
              setStep(3);
            }}
          />
        </Dock>
        <Link label="Skip" onPress={() => setStep(3)} />
      </>
    );
  if (step === 3)
    return (
      <>
        <T v="eyebrow" tone="muted">
          Name it
        </T>
        <T v="title" style={s.c} accessibilityRole="header">
          What does it feel like?
        </T>
        <T style={s.c}>One word is enough.</T>
        <Dock>
          <Tiles
            list={CU_FEEL}
            cur={feel}
            onPick={(v) => {
              setFeel(v);
              buzz('tap');
              setStep(4);
            }}
          />
        </Dock>
        <Link label="Skip" onPress={() => setStep(4)} />
      </>
    );
  const p = Math.min(1, (sec * 1000) / CU_MS);
  const line = cuLine(body, feel);
  return (
    <>
      <T v="eyebrow" tone="muted">
        Watch it
      </T>
      <T v="title" style={s.c} accessibilityRole="header">
        Now just watch it.
      </T>
      <Wave p={p} color={c.accent} track={c.muted} />
      <T v="label">{p < 1 ? fmtMS(CU_MS - sec * 1000) : 'Watched'}</T>
      <T style={s.c}>{(line ? line + ' ' : '') + 'Breathe slowly and follow the dot. You are not trying to make the urge go away.'}</T>
      <Dock>
        <T v="label">Right now it is</T>
        <View style={s.row}>
          {CU_CHG.map(([k, label]) => (
            <Chip key={k} label={label} on={chg === k} onPress={() => setChg(chg === k ? null : k)} />
          ))}
        </View>
        {chg ? (
          <T style={s.c} accessibilityLiveRegion="polite">
            {CU_SAY[chg]}
          </T>
        ) : null}
        <Button label="Done" onPress={() => finish('curious', { msg: 'You watched it. That is the skill.' })} />
      </Dock>
    </>
  );
}

/* the 90-second wave: it builds, peaks a little before the middle, and falls back. The whole wave draws itself in as soon
   as the step opens, as a soft track of fine wiggles (like Android's wavy progress), so the shape of an urge is there to
   see at once; then the part already watched fills in color behind the dot, which rides the front with a soft glow. */
function Wave({ p, color, track }: { p: number; color: string; track: string }) {
  const reduce = useReducedMotion();
  const [w, setW] = useState(0);
  const pulse = useRef(new Animated.Value(0)).current;
  const draw = useRef(new Animated.Value(reduce ? 1 : 0)).current;
  const [drawn, setDrawn] = useState(reduce ? 1 : 0);
  useEffect(() => {
    if (reduce) {
      setDrawn(1);
      return;
    }
    const id = draw.addListener(({ value }) => setDrawn(value));
    Animated.timing(draw, { toValue: 1, duration: 1400, delay: 150, easing: Easing.bezier(0.05, 0.7, 0.1, 1), useNativeDriver: false }).start();
    const a = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
        Animated.timing(pulse, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
      ]),
    );
    a.start();
    return () => {
      a.stop();
      draw.removeListener(id);
    };
  }, [reduce, pulse, draw]);
  const k = w / WV_W;
  const h = WV_H * k;
  const last = SQUIG.length - 1;
  const i = Math.min(last, Math.round(p * last));
  const j = Math.round(drawn * last);
  const [x, y] = SQUIG[i];
  const path = (n: number) =>
    n > 0
      ? 'M' +
        SQUIG.slice(0, n + 1)
          .map((q) => q.join(' '))
          .join(' L')
      : '';
  return (
    <View
      style={s.wave}
      onLayout={(e) => setW(Math.min(360, e.nativeEvent.layout.width))}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      {w ? (
        <View style={{ width: w, height: h }}>
          <Svg width={w} height={h} viewBox={`0 0 ${WV_W} ${WV_H}`}>
            {j > 0 ? <Path d={path(j)} stroke={track} strokeOpacity={0.22} strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round" /> : null}
            {i > 0 ? <Path d={path(Math.min(i, j))} stroke={color} strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round" /> : null}
          </Svg>
          <Animated.View
            style={[
              s.glow,
              {
                left: x * k - 22,
                top: y * k - 22,
                backgroundColor: color,
                opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.12, 0.28] }),
                transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.75, 1.1] }) }],
              },
            ]}
          />
          <View style={[s.dot, { left: x * k - 8, top: y * k - 8, backgroundColor: color, borderColor: '#FFFFFF' }]} />
        </View>
      ) : null}
    </View>
  );
}
/* CU_D is four cubic curves from (10,96) to (250,96), drawn in a 260 by 110 box; room is left for the dot's glow */
const WV_W = 260;
const WV_H = 116;
/* points along CU_D, each pushed out along the curve's normal by a small wiggle that fades in and out at the ends, so
   the squiggle starts and lands calmly */
const SQUIG: [number, number][] = (() => {
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
  /* the wiggles follow the length of the curve, not its x, so they stay even on the steep parts */
  let len = 0;
  const at = base.map((q, j) => (len += j ? Math.hypot(q[0] - base[j - 1][0], q[1] - base[j - 1][1]) : 0));
  return base.map(([bx, by], j) => {
    const a = base[Math.max(0, j - 1)];
    const b = base[Math.min(base.length - 1, j + 1)];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const d = Math.hypot(dx, dy) || 1;
    const f = at[j] / len;
    const amp = 2.2 * Math.min(1, f * 10, (1 - f) * 10);
    const o = amp * Math.sin((at[j] / 13) * Math.PI * 2);
    return [+(bx - (dy / d) * o).toFixed(1), +(by + (dx / d) * o).toFixed(1)];
  });
})();

/* ---------- name the thought ---------- */
export function Thought({ finish, text, setText }: ToolProps & { text: string | null; setText: (t: string | null) => void }) {
  const c = useTheme();
  const [writing, setWriting] = useState(false);
  const [own, setOwn] = useState('');
  const reduce = useReducedMotion();
  const [gone, setGone] = useState(false);
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
        <T v="eyebrow" tone="muted">
          Name the thought
        </T>
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
  return (
    <Stage key="card" dir={1}>
      <T v="title" style={s.c} accessibilityRole="header">
        A thought is not an order.
      </T>
      <T style={s.c}>It can be loud and still be wrong. Read the card once more, slowly. You can notice the thought and still choose what you do.</T>
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
            <Button label="Let it go" onPress={letGo} />
            <View style={s.quiet}>
              <Link label="Done" onPress={() => finish('thought', { msg: 'A thought is not an order.' })} />
            </View>
          </>
        )}
      </Dock>
    </Stage>
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
export function Forward({ finish, step, setStep }: ToolProps & { step: number; setStep: (i: number) => void }) {
  const c = useTheme();
  const { mem, setMem } = useSos();
  /* your answers from last time are already picked */
  const [a, setA] = useState<string[]>(() => (mem.fwd?.a || []).slice());
  const [b, setB] = useState<string[]>(() => (mem.fwd?.b || []).slice());
  const toggle = (L: string[], set: (x: string[]) => void, v: string) => {
    set(L.indexOf(v) >= 0 ? L.filter((x) => x !== v) : L.concat(v));
    buzz('tap');
  };
  if (step === 0)
    return (
      <>
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
      </>
    );
  if (step === 1)
    return (
      <>
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
              setMem((m) => ({ ...m, fwd: { a: a.slice(0, 7), b: b.slice(0, 7) } }));
              setStep(2);
            }}
          />
        </Dock>
      </>
    );
  const words = (list: [string, string][], ids: string[]) => list.filter((x) => ids.indexOf(x[0]) >= 0).map((x) => x[1].toLowerCase());
  const wa = words(FWD_A, a);
  const wb = words(FWD_B, b);
  return (
    <>
      <T v="title" style={s.c} accessibilityRole="header">
        Which hour do you want?
      </T>
      <Middle>
        <View style={s.two}>
          <Card style={{ flex: 1, backgroundColor: c.slipSoft, borderColor: c.slipSoft }}>
            <T v="small" tone="slipText">
              Giving in
            </T>
            <WavyLine width={44} p={1} color={c.slip} track={c.slip} stroke={3} wave={11} amp={2.5} />
            <T>{wa.length ? wa.join(', ') : 'You did not pick anything.'}</T>
          </Card>
          <Card style={{ flex: 1, backgroundColor: c.mintSoft, borderColor: c.mintSoft }}>
            <T v="small" tone="mintText">
              Riding it out
            </T>
            <WavyLine width={44} p={1} color={c.mint} track={c.mint} stroke={3} wave={11} amp={2.5} />
            <T>{wb.length ? wb.join(', ') : 'You did not pick anything.'}</T>
          </Card>
        </View>
        <T style={s.c}>The urge only shows you the next few minutes. You get to pick the next hour.</T>
      </Middle>
      <Dock>
        <Button label="Ride it out" onPress={() => finish('forward', { msg: 'You picked the better hour.' })} />
      </Dock>
    </>
  );
}

/* a small sun cookie that breathes slowly (4 s in, 6 s out) and turns a little on each breath, for the steps that only
   ask you to notice */
function Breath() {
  const c = useTheme();
  const reduce = useReducedMotion();
  const v = useRef(new Animated.Value(0)).current;
  /* how far the breath is, to change the shape with it: a soft cookie when empty, a sunny shape when full */
  const [t, setT] = useState(0);
  useEffect(() => {
    if (reduce) return;
    const id = v.addListener(({ value }) => setT(value));
    const a = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
        Animated.timing(v, { toValue: 0, duration: 6000, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      ]),
    );
    a.start();
    return () => {
      a.stop();
      v.removeListener(id);
    };
  }, [reduce, v]);
  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        s.breath,
        {
          transform: [
            { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.86, 1.08] }) },
            { rotate: v.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '30deg'] }) },
          ],
        },
      ]}>
      <MorphShape kind="cookie9" to="sunny" t={t} size={112} color={c.sunSoft}>
        <MorphShape kind="cookie4" to="cookie7" t={t} size={46} color={c.sun} turn={-t * 50} />
      </MorphShape>
    </Animated.View>
  );
}

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
  thoughtT: { fontFamily: font.display, fontSize: 28, lineHeight: 34, textAlign: 'center' },
  breath: { width: 112, height: 112, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  wave: { alignSelf: 'stretch', alignItems: 'center' },
  glow: { position: 'absolute', width: 44, height: 44, borderRadius: 22 },
  dot: { position: 'absolute', width: 16, height: 16, borderRadius: 8, borderWidth: 3 },
});
