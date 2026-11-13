/* The first look at Today: a short tour the flame gives a new person the first time they land on Today after setup (the owner,
   November 13, 2026: "if i just go home it should have a fun like first display on lessons and maybe like a floating explanation
   like a tutorial walkthrough of where lessons are and what the app has you do"). components/tour.tsx draws it.

   It is due once, set by setup's last sheet (Go home, or Keep going into lesson 1), and kept in this device's memory, never synced.
   Once it is finished or skipped it never comes back. The parts of Today it points at register themselves here (useSpot), so the
   spotlight always sits on the real thing. */
import { useCallback, useEffect, useRef } from 'react';
import type { ViewInstance } from 'react-native';

import type { UrMem } from '@daybook/core';

/** what the tour points at */
export type SpotKey = 'sky' | 'log' | 'trail' | 'lesson' | 'sos' | 'learn';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const refs = new Map<SpotKey, ViewInstance>();
const listeners = new Set<() => void>();

/** a part of Today the tour can point at: put the returned ref on its outer View (collapsable={false} on Android) */
export function useSpot(key: SpotKey, on = true) {
  const ref = useRef<ViewInstance>(null);
  useEffect(() => {
    if (!on) return;
    const v = ref.current;
    if (v) refs.set(key, v);
    listeners.forEach((f) => f());
    return () => {
      if (refs.get(key) === v) refs.delete(key);
    };
  }, [key, on]);
  return ref;
}

/** where a registered part is on the screen now, or null when it is not on Today */
export function measureSpot(key: SpotKey): Promise<Rect | null> {
  const v = refs.get(key);
  if (!v) return Promise.resolve(null);
  return new Promise((done) => {
    try {
      v.measureInWindow((x, y, w, h) => done(w > 0 && h > 0 ? { x, y, w, h } : null));
    } catch {
      done(null);
    }
  });
}

/** called when a part registers, so an open tour can measure it */
export function onSpots(f: () => void) {
  listeners.add(f);
  return () => {
    listeners.delete(f);
  };
}

/* ---------- once per device, in the SOS memory (lib/sos.tsx: this device only, never synced) ---------- */

/** the tour is waiting for Today: set by setup's end, as a time */
export const tourDue = (mem: UrMem): boolean => typeof mem.tour === 'number';

/** setup's end: the tour waits for Today (never when it was already given), and Walk it through waits on Today for its unlock */
export const markTourDue = (m: UrMem): UrMem => (m.tour === 'done' ? m : { ...m, tour: Date.now(), walk: m.walk === 'open' ? 'open' : 'locked' });

/* ---------- Walk it through, unlocked after a lesson (the owner, November 13, 2026: "they should unlock walk it through after a
   lesson just on the home page it's like you unlocked walk it through!! have it give a quick overview and then have them try it").
   Only a person who came through the new setup waits for it; everyone else has it as before. Care is never locked: until then
   only its button on Today waits, and Walk it through is always one of SOS's four big choices. ---------- */

/** its button on Today waits for the unlock */
export const walkLocked = (mem: UrMem): boolean => mem.walk === 'locked';

/** unlocked: the button is on Today for good */
export const markWalkOpen = (m: UrMem): UrMem => ({ ...m, walk: 'open' });

/** finished or skipped: never again */
export const markTourDone = (m: UrMem): UrMem => ({ ...m, tour: 'done' });

/** a stable callback from a changing one */
export function useLatest<A extends unknown[]>(f: (...a: A) => void) {
  const r = useRef(f);
  r.current = f;
  return useCallback((...a: A) => r.current(...a), []);
}
