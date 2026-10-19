/* Ride the wave: Get curious, Name the thought, Play it forward. Ported from the legacy SCENES.curious, thought and forward. */
import { CU_BODY, CU_CHG, CU_D, CU_FEEL, CU_MS, CU_SAY, cuLine, FWD_A, FWD_B, THOUGHTS, thoughtIn } from '@daybook/core';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';
import Svg, { Circle, Path } from 'react-native-svg';

import { AddTile, Field, Link, Tiles } from '@/components/choices';
import { fmtMS, useSeconds } from '@/components/orb';
import { Appear } from '@/components/appear';
import { Button, Card, Chip, Icon, T } from '@/components/ui';
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
      <Wave p={p} color={c.accent} track={c.line} />
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

/* the 90-second wave: it builds, peaks a little before the middle, and falls back; the dot follows it */
function Wave({ p, color, track }: { p: number; color: string; track: string }) {
  /* the wave's points, sampled once, to place the dot without measuring the path */
  const pts = WAVE;
  const i = Math.min(pts.length - 1, Math.floor(p * (pts.length - 1)));
  const [x, y] = pts[i];
  const drawn =
    'M' +
    pts
      .slice(0, i + 1)
      .map((q) => q.join(' '))
      .join(' L');
  return (
    <Svg width="100%" height={120} viewBox="0 0 260 110" accessibilityElementsHidden>
      <Path d={CU_D} stroke={track} strokeWidth={6} fill="none" strokeLinecap="round" />
      {i > 0 ? <Path d={drawn} stroke={color} strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" /> : null}
      <Circle cx={x} cy={y} r={8} fill={color} />
    </Svg>
  );
}
/* CU_D is four cubic curves from (10,96) to (250,96); these are points along it */
const WAVE: [number, number][] = (() => {
  const segs: number[][] = [
    [10, 96, 46, 96, 62, 76, 82, 50],
    [82, 50, 102, 24, 112, 10, 128, 10],
    [128, 10, 144, 10, 158, 38, 178, 64],
    [178, 64, 198, 90, 220, 96, 250, 96],
  ];
  const out: [number, number][] = [];
  segs.forEach(([x0, y0, x1, y1, x2, y2, x3, y3]) => {
    for (let k = 0; k < 30; k++) {
      const t = k / 30;
      const u = 1 - t;
      out.push([
        +(u * u * u * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3).toFixed(1),
        +(u * u * u * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3).toFixed(1),
      ]);
    }
  });
  out.push([250, 96]);
  return out;
})();

/* ---------- name the thought ---------- */
export function Thought({ finish, text, setText }: ToolProps & { text: string | null; setText: (t: string | null) => void }) {
  const c = useTheme();
  const [writing, setWriting] = useState(false);
  const [own, setOwn] = useState('');
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
          <View style={{ width: '100%', gap: 8 }}>
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
          </View>
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
        <Appear by={14} delay={120} style={[s.thought, { backgroundColor: c.violetSoft, shadowColor: c.lip }]}>
          <T v="small" tone="violetText" style={s.c}>
            I notice I am having the thought that
          </T>
          <Text style={[s.thoughtT, { color: c.ink }]}>“{thoughtIn(text)}.”</Text>
        </Appear>
      </Middle>
      <Dock>
        <Button label="Done" onPress={() => finish('thought', { msg: 'A thought is not an order.' })} />
      </Dock>
    </Stage>
  );
}

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
            <T>{wa.length ? wa.join(', ') : 'You did not pick anything.'}</T>
          </Card>
          <Card style={{ flex: 1, backgroundColor: c.mintSoft, borderColor: c.mintSoft }}>
            <T v="small" tone="mintText">
              Riding it out
            </T>
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

/* a small sun that breathes slowly, for the steps that only ask you to notice */
function Breath() {
  const c = useTheme();
  const reduce = useReducedMotion();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduce) return;
    const a = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
        Animated.timing(v, { toValue: 0, duration: 6000, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
      ]),
    );
    a.start();
    return () => a.stop();
  }, [reduce, v]);
  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[s.breath, { backgroundColor: c.sunSoft, transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.15] }) }] }]}>
      <Icon name="sun" size={30} color={c.sunText} />
    </Animated.View>
  );
}

const s = StyleSheet.create({
  c: { textAlign: 'center' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  two: { flexDirection: 'row', gap: 10, alignSelf: 'stretch' },
  thought: {
    alignSelf: 'stretch',
    gap: 10,
    paddingVertical: 28,
    paddingHorizontal: 22,
    borderRadius: 26,
    shadowOpacity: 1,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 4 },
  },
  thoughtT: { fontFamily: font.display, fontSize: 28, lineHeight: 34, textAlign: 'center' },
  breath: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
});
