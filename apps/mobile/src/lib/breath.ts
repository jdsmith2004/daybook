/* One breath curve for every breathing shape in the app (the Breathe dots, the timer's beat, the SOS sun, the small sun
   in the tools). Each shape reads it from a clock on every frame, instead of chaining one animation per step, so it never
   jumps when a step starts a moment late and the steps never drift apart.

   The curve is like a ball thrown up: it speeds up gently, keeps an even pace through the middle (never a rush), and
   slows the same way into the turn, so the turn at the top and the bottom is soft and quick, never a dead stop. See
   docs/design-standards.md (Breathing). */
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { useFrameCallback, useSharedValue } from 'react-native-reanimated';

/** the dependency list Reanimated needs for an animated style on the web (on iOS and Android it reads the closure, and
    warns when given one) */
export const webDeps = (...deps: unknown[]) => (Platform.OS === 'web' ? deps : undefined);

/** the steps of a breath: what each one does (in, in1, in2, hold, out) and how many seconds it takes */
export type Steps = [string, number][];

/** how full each kind of step leaves the breath: 1 full, 0 empty (a hold stays where it is) */
const GOAL: Record<string, number> = { in: 1, in1: 0.75, in2: 1, out: 0 };
/** seconds spent speeding up at the start of a step and slowing at its end (at most a little over a third of a short step) */
const RAMP = 1.1;

/** a soft start, an even middle and a soft landing: how far through a step (0 to 1) the shape is at `s` of its time */
export function glide(s: number, dur: number) {
  'worklet';
  const x = Math.min(1, Math.max(0, s));
  const f = Math.min(0.38, RAMP / Math.max(0.01, dur));
  const top = 1 / (1 - f);
  if (x < f) return (top * x * x) / (2 * f);
  if (x > 1 - f) return 1 - (top * (1 - x) * (1 - x)) / (2 * f);
  return top * (f / 2 + x - f);
}

/** where the breath is at `sec` seconds: [how full (0 to 1), which round, 1 while going out (or holding after going out)] */
export function breathAt(steps: Steps, sec: number): [number, number, number] {
  'worklet';
  let total = 0;
  for (let i = 0; i < steps.length; i++) total += steps[i][1];
  const t = Math.max(0, sec);
  const k = Math.floor(t / total);
  let x = t - k * total;
  /* a round starts empty; each step moves on from where the one before left it */
  let at = 0;
  let out = 0;
  for (let i = 0; i < steps.length; i++) {
    const kind = steps[i][0];
    const dur = steps[i][1];
    const goal = kind in GOAL ? GOAL[kind] : at;
    if (x < dur) return [at + (goal - at) * glide(x / dur, dur), k, kind === 'out' ? 1 : kind === 'hold' ? out : 0];
    x -= dur;
    at = goal;
    if (kind !== 'hold') out = kind === 'out' ? 1 : 0;
  }
  return [0, k, 0];
}

/** a clock on the UI thread: seconds since `sec0` seconds before mount, updated every frame while on (it reads the real
    time, so it stays with the seconds the screen shows) */
export function useBreathClock(sec0: number, on = true) {
  const [origin] = useState(() => Date.now() - sec0 * 1000);
  const t = useSharedValue(sec0);
  const cb = useFrameCallback(() => {
    t.value = (Date.now() - origin) / 1000;
  }, on);
  useEffect(() => {
    cb.setActive(on);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on]);
  return t;
}

/** the same clock as a number on the JavaScript side, every frame, for a shape that redraws its outline (a morph) */
export function useBreathSeconds(on = true) {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (!on) return;
    const t0 = Date.now();
    let raf = 0;
    const tick = () => {
      setT((Date.now() - t0) / 1000);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [on]);
  return t;
}
