/* Opening the app (the owner, November 15, 2026, after filming Daybook and How We Feel: "It shows kind of a bad looking screen, and
   then it flashes white and loads. That's a terrible experience ... I want ours to look like theirs"). The native splash is the flame
   asleep, big in the middle, on the launch color (core LAUNCH_BG; app.json). The app's first frame is that same picture
   (components/launch.tsx), so the hand-off has no seam; then the flame wakes and flies to its home on Today's sky while Today builds in
   under it. This file holds what the scene needs to know: where Today's flame is (the hero reports it), which kind of opening to play,
   and the replay for the web.

   The kinds:
   - morph: the flame wakes and becomes Today's flame. Only when Today is the first screen and nothing covers it.
   - fade: the same first picture, then a plain cross-fade. Under Reduce Motion, with the lock on (Face ID must not wait behind a
     scene), before setup (the welcome page), and on a link straight to another page.
   It plays once for each load of the app: a warm launch (the app still in memory) has no splash and no scene. */
import { useSyncExternalStore } from 'react';
import { Platform } from 'react-native';

export type LaunchKind = 'morph' | 'fade';

/** where the flame on Today is, in window points: its box and the level drawn in it, and how tall the sky over it is */
export interface FlameSpot {
  x: number;
  y: number;
  size: number;
  level: number;
  /** the sky's height from the top of the window: the part of Today that comes in first */
  skyH: number;
}

let spot: FlameSpot | null = null;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());
const sub = (f: () => void) => {
  subs.add(f);
  return () => void subs.delete(f);
};

/** the hero says where its flame is (and again when it moves) */
export function landFlame(s: FlameSpot | null) {
  if (s === spot || (s && spot && s.x === spot.x && s.y === spot.y && s.size === spot.size && s.level === spot.level && s.skyH === spot.skyH)) return;
  spot = s;
  emit();
}
export const useFlameSpot = () =>
  useSyncExternalStore(
    sub,
    () => spot,
    () => spot,
  );

/* ---------- the scene's state, for the parts of Today that take part ---------- */
/** 'wait': the scene covers everything; 'fly': the flame is on its way, so Today's own flame stays hidden; 'done' */
export type LaunchPhase = 'wait' | 'fly' | 'done';
let phase: LaunchPhase = 'done';
export function setLaunchPhase(p: LaunchPhase) {
  if (p === phase) return;
  phase = p;
  emit();
}
export const useLaunchPhase = () =>
  useSyncExternalStore(
    sub,
    () => phase,
    () => phase,
  );

/* ---------- once a load, and the replay on the web ---------- */
const query = Platform.OS === 'web' && typeof window !== 'undefined' && window.location ? new URLSearchParams(window.location.search) : null;
/** ?launch=1 on the web plays the opening again (the celebrations page in the demo build links to it) */
export const LAUNCH_ASKED = query?.get('launch') === '1';
/** ?slow=N with it stretches every beat N times, to look at the opening frame by frame */
export const LAUNCH_SLOW = LAUNCH_ASKED ? Math.max(1, Math.min(10, Number(query?.get('slow')) || 1)) : 1;
let played = false;
/** whether the opening still has to play in this load of the app */
export const launchDue = () => !played;
export const launchPlayed = () => {
  played = true;
};
