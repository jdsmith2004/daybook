/* The Mithras import on this device (core mithras.ts has the rules; app/import/mithras.tsx is the sheet). It is not a feature Daybook
   shows everyone (the owner, November 13, 2026: "make it more obscure"): no row in setup and no card on Today. It opens up front only
   when Daybook is opened by the link from Mithras (daybook://import/mithras), and otherwise waits as one quiet row in More, Save a copy.

   A link that comes before setup is remembered here (kept on this device, never synced) and offered again as setup ends. What was read
   from Mithras is held in memory only, never saved: if the app closes in between, the person signs in to Mithras once more. */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AppleAuthentication from 'expo-apple-authentication';
import { mithrasClient, type MithrasRows } from '@daybook/core';
import { useSyncExternalStore } from 'react';
import { Platform } from 'react-native';

import { APPLE_SERVICES_ID, MITHRAS_ANON, MITHRAS_URL } from '@/lib/config';

/* a QA build can answer from a made-up Mithras instead (lib/mithras-fake.ts), so a real account is never used to test */
const FAKE = process.env.EXPO_PUBLIC_MITHRAS_FAKE === '1';
export const mithras = FAKE
  ? mithrasClient('https://fake.mithras.test', 'fake', (url, init) =>
      (require('./mithras-fake') as typeof import('./mithras-fake')).fakeMithrasFetch(url, init),
    )
  : mithrasClient(MITHRAS_URL, MITHRAS_ANON);

const KEY = 'daybook.mithras';
let pending = false;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());
AsyncStorage.getItem(KEY)
  .then((v) => {
    if (v === '1' && !pending) {
      pending = true;
      emit();
    }
  })
  .catch(() => undefined);

/** the link from Mithras came, and the import is not done or closed yet */
export function setMithrasPending(on: boolean) {
  if (pending === on) return;
  pending = on;
  emit();
  (on ? AsyncStorage.setItem(KEY, '1') : AsyncStorage.removeItem(KEY)).catch(() => undefined);
}
export const mithrasPending = () => pending;
const sub = (f: () => void) => {
  subs.add(f);
  return () => void subs.delete(f);
};
export const useMithrasPending = () =>
  useSyncExternalStore(
    sub,
    () => pending,
    () => pending,
  );

/* whether the import page is open now: Today opens nothing else over it (Welcome back would cover the moment) */
let open = false;
const openSubs = new Set<() => void>();
export function setMithrasOpen(on: boolean) {
  if (open === on) return;
  open = on;
  openSubs.forEach((f) => f());
}
export const useMithrasOpen = () =>
  useSyncExternalStore(
    (f) => {
      openSubs.add(f);
      return () => void openSubs.delete(f);
    },
    () => open,
    () => open,
  );

/** what was read from Mithras and said yes to before setup, in memory only: setup's first answers come from it, and it lands as setup ends */
export const mithrasHeld: { rows: MithrasRows | null; how: 'apple' | 'email' | null } = { rows: null, how: null };

/** whether a link opened Daybook on this path */
export const isMithrasLink = (url: string | null | undefined) => !!url && /import\/mithras/.test(url);

/** Sign in with Apple for Mithras: Apple's own sheet on iPhone (the same Apple team as Mithras, so the same Apple ID), and Apple's popup on
    the web once the web has a Services ID */
export async function mithrasAppleOffered(): Promise<boolean> {
  if (Platform.OS === 'ios') return AppleAuthentication.isAvailableAsync().catch(() => false);
  return Platform.OS === 'web' && !!APPLE_SERVICES_ID;
}
