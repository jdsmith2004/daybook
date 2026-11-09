/* The app that pulls you in (Screen Time, iPhone only), the phone side. The rules and words are core pull.ts; Apple's side
   (the Screen Time ask, Apple's app list, the watching and the pause, and the three extensions) is the native module
   `DaybookPull`, which needs Apple's Family Controls entitlement and is built in its own step (docs/plan.md, "Screen Time").

   Until that module is in the build, a stand-in lets the screens be seen: in development, or in a build made with
   EXPO_PUBLIC_PULL_PREVIEW=1 (on the web too, only to look at the screens). A store build without the module shows nothing of this. The choices stay on this phone: never
   synced, never in a backup, never counted (Apple's license keeps Screen Time data on the device). */
import { normPull, type PullBridge, type PullPrefs } from '@daybook/core';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { requireOptionalNativeModule } from 'expo';
import { Platform } from 'react-native';
import { useSyncExternalStore } from 'react';

export interface PullModule {
  /** Apple's Screen Time ask (Face ID or the passcode); whether it was given */
  authorize(): Promise<boolean>;
  /** whether access is still given (it can be taken back in Settings at any time) */
  allowed(): Promise<boolean>;
  /** Apple's app list; how many apps and kinds are picked, or null when it was closed */
  pick(): Promise<number | null>;
  /** how many are picked now */
  picked(): Promise<number>;
  /** hands the extensions what they need (core pullBridge, as JSON) and sets the watching to match */
  write(bridge: string): Promise<void>;
  /** lifts every pause at once */
  lift(): Promise<void>;
  /** lifts the pause for this many minutes of use, then it comes back */
  openFor(minutes: number): Promise<void>;
  /** stops everything: no watching, no pause, nothing picked */
  stop(): Promise<void>;
}

const real = Platform.OS === 'ios' ? requireOptionalNativeModule<PullModule>('DaybookPull') : null;
const preview = (Platform.OS === 'ios' && __DEV__) || process.env.EXPO_PUBLIC_PULL_PREVIEW === '1';
let fakeCount = 0;
/* the stand-in: says yes to the ask and picks two apps, so the screens can be walked */
const fake: PullModule = {
  authorize: async () => true,
  allowed: async () => true,
  pick: async () => (fakeCount = 2),
  picked: async () => fakeCount,
  write: async () => undefined,
  lift: async () => undefined,
  openFor: async () => undefined,
  stop: async () => void (fakeCount = 0),
};
export const Pull: PullModule | null = real ?? (preview ? fake : null);
/** whether this build offers it at all: an iPhone with the module (or the stand-in) */
export const pullOffered = !!Pull;

/* the choices, kept on this phone */
const KEY = 'daybook.pull';
let prefs: PullPrefs = normPull(null);
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());
AsyncStorage.getItem(KEY)
  .then((v) => {
    if (!v) return;
    prefs = normPull(JSON.parse(v));
    emit();
  })
  .catch(() => undefined);
export function setPullPrefs(p: Partial<PullPrefs>) {
  prefs = normPull({ ...prefs, ...p });
  emit();
  AsyncStorage.setItem(KEY, JSON.stringify(prefs)).catch(() => undefined);
}
export const getPullPrefs = () => prefs;
const sub = (f: () => void) => {
  subs.add(f);
  return () => subs.delete(f);
};
export const usePullPrefs = () =>
  useSyncExternalStore(
    sub,
    () => prefs,
    () => prefs,
  );

/** the ask, then Apple's list: true when apps were picked and it is on */
export async function pullStart(): Promise<boolean> {
  if (!Pull) return false;
  if (!(await Pull.authorize())) return false;
  const n = await Pull.pick();
  if (!n) return false;
  setPullPrefs({ on: true, asked: 'picked' });
  return true;
}
/** turn it all off: nothing watched, nothing paused */
export async function pullStop() {
  setPullPrefs({ on: false });
  await Pull?.stop();
}
/** what the extensions read, written on every open and every change */
export async function pullWrite(b: PullBridge) {
  if (!Pull || !b.prefs.on) return;
  await Pull.write(JSON.stringify(b));
}
