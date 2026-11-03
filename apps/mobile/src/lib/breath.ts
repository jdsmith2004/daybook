/* One breath curve for every breathing shape in the app (the Breathe dots, the timer's beat, the SOS sun, the small sun
   in the tools). Each shape reads it from a clock on every frame, instead of chaining one animation per step, so it never
   jumps when a step starts a moment late and the steps never drift apart.

   The curve is like a ball thrown up: it speeds up gently, keeps an even pace through the middle (never a rush), and
   slows the same way into the turn, so the turn at the top and the bottom is soft and quick, never a dead stop. See
   docs/design-standards.md (Breathing). */
import { breathTouch } from '@daybook/core';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { useFrameCallback, useSharedValue } from 'react-native-reanimated';

import { breathTap } from '@/lib/feel';

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
    time, so it stays with the seconds the screen shows). The frame callback is made once and registered once for the
    life of the screen; `on` only starts and stops it. (A new callback on every render made Reanimated unregister and
    register it again each time, and turning it off in the same tick as the unmount hit one already gone.) */
export function useBreathClock(sec0: number, on = true) {
  const [origin] = useState(() => Date.now() - sec0 * 1000);
  const t = useSharedValue(sec0);
  const tick = useCallback(() => {
    'worklet';
    t.value = (Date.now() - origin) / 1000;
  }, [origin, t]);
  const cb = useFrameCallback(tick, false);
  useEffect(() => {
    cb.setActive(on);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on]);
  return t;
}

/** the same clock as a number on the JavaScript side, about 30 times a second (like useClock in components/shapes), for a
    shape that redraws its outline (a morph): every redraw is a new path and a layout, so it does not run every frame */
export function useBreathSeconds(on = true) {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (!on) return;
    const t0 = Date.now();
    let raf = 0;
    let last = 0;
    const tick = () => {
      const now = Date.now();
      if (now - last > 32) {
        last = now;
        setT((now - t0) / 1000);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [on]);
  return t;
}

/** the breath by touch (core breath-touch): while on, the phone taps through each breath in and out of `steps`, timed from
    `start` (the same moment the shape's clock starts from), so a person can follow it with their eyes closed. Each round is
    planned just before it starts, from the real time, so the taps never drift from the shape. With `until` (seconds), it
    stops tapping there. */
export function useBreathTouch(steps: Steps, start: number | null, on = true, until?: number) {
  useEffect(() => {
    if (!on || start == null || Platform.OS === 'web') return;
    const plan = breathTouch(steps);
    const taps: [number, 0 | 1 | 2][] = [];
    let at = 0;
    steps.forEach(([, dur], i) => {
      for (const [ms, lv] of plan[i]) taps.push([at + ms, lv]);
      at += dur * 1000;
    });
    const round = at;
    const end = until == null ? Infinity : start + until * 1000;
    const ids: ReturnType<typeof setTimeout>[] = [];
    const queue = (k: number) => {
      const base = start + k * round;
      const now = Date.now();
      for (const [ms, lv] of taps) {
        const due = base + ms;
        /* a tap already a moment late is dropped, not played out of step */
        if (due >= end || due < now - 40) continue;
        ids.push(setTimeout(() => breathTap(lv), Math.max(0, due - now)));
      }
      if (base + round < end) ids.push(setTimeout(() => queue(k + 1), Math.max(0, base + round - now - 400)));
    };
    queue(Math.max(0, Math.floor((Date.now() - start) / round)));
    return () => ids.forEach(clearTimeout);
  }, [steps, start, on, until]);
}
