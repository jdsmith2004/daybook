/* Nights from Apple Health, kept on this phone only (core health.ts; docs/plan.md, "Your nights from Apple Health").

   They are stored in AsyncStorage under their own keys, not "daybook:", so they are never part of the log: never synced, never
   in the safe copy, never counted and never sent. Nothing from Health is copied into a check-in. "Delete everything" and
   turning Health off in More remove them (forgetHealth).

   Once the person has connected Health (connectHealth, which shows Apple's own sheet), the last NIGHTS_BACK nights are read
   each time the app opens or comes back to the front (HealthKeeper, in the root layout). useNights() gives them to a screen. */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logicalKey, mergeNights, nightsOf, nightsSince, normNights, type Nights } from '@daybook/core';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { askSleep, healthHere, readSleep } from './health-kit';

const ON = 'health.on';
const NIGHTS = 'health.nights';

interface HealthState {
  /** loaded from storage yet */
  ready: boolean;
  /** the person connected Health on this phone */
  on: boolean;
  nights: Nights;
}
let state: HealthState = { ready: false, on: false, nights: {} };
const subs = new Set<(s: HealthState) => void>();
const put = (next: Partial<HealthState>) => {
  state = { ...state, ...next };
  subs.forEach((f) => f(state));
};

const loaded = Promise.all([AsyncStorage.getItem(ON), AsyncStorage.getItem(NIGHTS)])
  .then(([on, raw]) => {
    let nights: Nights = {};
    try {
      nights = normNights(raw ? JSON.parse(raw) : null);
    } catch {
      nights = {};
    }
    put({ ready: true, on: on === '1' && healthHere(), nights });
  })
  .catch(() => put({ ready: true }));

/** whether Apple Health can be offered here (an iPhone) */
export const healthOffered = (): boolean => healthHere();

/** the nights from Health, and whether it is connected */
export function useNights(): HealthState {
  const [s, setS] = useState(state);
  useEffect(() => {
    subs.add(setS);
    setS(state);
    return () => {
      subs.delete(setS);
    };
  }, []);
  return s;
}

let reading: Promise<void> | null = null;
/** reads the last nights from Health and keeps them; does nothing until Health is connected */
export function refreshNights(rollover = 4): Promise<void> {
  if (reading) return reading;
  reading = (async () => {
    await loaded;
    if (!state.on) return;
    const tk = logicalKey(Date.now(), rollover);
    const read = nightsOf(await readSleep(nightsSince(tk)));
    const nights = mergeNights(state.nights, read);
    put({ nights });
    await AsyncStorage.setItem(NIGHTS, JSON.stringify(nights));
  })()
    .catch(() => undefined)
    .finally(() => {
      reading = null;
    });
  return reading;
}

/** shows Apple's sheet, then reads. True once Health is connected (Apple does not say whether sleep was allowed: with a no,
    there are simply no nights). */
export async function connectHealth(rollover = 4): Promise<boolean> {
  if (!healthHere()) return false;
  const shown = await askSleep();
  if (!shown) return false;
  await AsyncStorage.setItem(ON, '1');
  put({ on: true });
  await refreshNights(rollover);
  return true;
}

/** turns Health off on this phone and forgets every night read from it */
export async function forgetHealth(): Promise<void> {
  await AsyncStorage.multiRemove([ON, NIGHTS]).catch(() => undefined);
  put({ on: false, nights: {} });
}

/** reads the nights when the app opens and each time it comes back to the front */
export function HealthKeeper({ rollover }: { rollover: number }) {
  useEffect(() => {
    if (!healthHere()) return;
    refreshNights(rollover);
    const sub = AppState.addEventListener('change', (a) => a === 'active' && refreshNights(rollover));
    return () => sub.remove();
  }, [rollover]);
  return null;
}
