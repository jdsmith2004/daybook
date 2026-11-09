/* The app that pulls you in (Screen Time, iPhone only), the phone side. The rules and words are core pull.ts; Apple's side
   (the Screen Time ask, Apple's app list, the watching and the pause, and the three extensions) is the native module
   `DaybookPull`, which needs Apple's Family Controls entitlement and is built in its own step (docs/plan.md, "Screen Time").

   The module is in every iPhone build, but on only in one made with DAYBOOK_PULL=1 (app.config.js: the entitlement, the App Group and
   the extensions), so it says `on`. Without it, a stand-in lets the screens be seen: in development, or in a build made with
   EXPO_PUBLIC_PULL_PREVIEW=1 (on the web too, only to look at the screens). A store build without it shows nothing of this. The
   choices stay on this phone: never synced, never in a backup, never counted (Apple's license keeps Screen Time data on the device).

   PullKeeper (in the root layout) writes core pullBridge for the extensions each time the app opens or comes back, and whenever the
   log or the choices change; notices access taken back in Settings; and opens the wait screen when a pause's button asked for it. */
import { normPull, pullBridge, type PullBridge, type PullPrefs } from '@daybook/core';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { requireOptionalNativeModule } from 'expo';
import { router } from 'expo-router';
import { AppState, Platform } from 'react-native';
import { useEffect, useSyncExternalStore } from 'react';

import { allowReminders } from '@/lib/reminders';
import { useStore } from '@/lib/store';
import { useAccount } from '@/lib/sync';

export interface PullModule {
  /** Apple's Screen Time ask (Face ID or the passcode); whether it was given */
  authorize(): Promise<boolean>;
  /** false only when access was taken back (Settings, Screen Time); true while Apple's status is still loading */
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
  /** when the hard hours' notes were ignored (core pullDrift), or null */
  ignoredAt(): number | null;
  /** whether a pause's button asked for Daybook just now, taken once */
  takeWant(): boolean;
}
interface PullNative extends PullModule {
  on: boolean;
}

const native = Platform.OS === 'ios' ? requireOptionalNativeModule<PullNative>('DaybookPull') : null;
const real: PullModule | null = native?.on ? native : null;
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
  ignoredAt: () => null,
  takeWant: () => false,
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

/** the ask, then Apple's list: 'on' when apps were picked and it is on, 'denied' when Screen Time said no, 'closed' when the list
    was closed with nothing picked. The notes need the phone's permission for notifications, so it is asked here too, as the
    reminders ask it (the person can still say no: the pause works without notes). */
export async function pullStart(): Promise<'on' | 'denied' | 'closed'> {
  if (!Pull) return 'closed';
  if (!(await Pull.authorize().catch(() => false))) return 'denied';
  const n = await Pull.pick().catch(() => null);
  if (!n) return 'closed';
  setPullPrefs({ on: true, asked: 'picked' });
  if (real) await allowReminders().catch(() => false);
  return 'on';
}
/** what the flame says when Screen Time said no */
export const PULL_DENIED = 'Screen Time said no, so nothing changed. Try again whenever you want, and choose Continue when it asks.';
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

/** when the hard hours' notes were ignored, read fresh (core pullDrift) */
export const pullIgnoredAt = (): number | null => (real ? real.ignoredAt() : null);

/** keeps the extensions' copy of the bridge fresh, and listens for what they leave for the app (see the top of this file) */
export function PullKeeper() {
  const { snap, now } = useStore();
  const prefs = usePullPrefs();
  const account = useAccount();
  const st = snap.settings;
  /* the bridge only changes with the log, the choices and the minute: a write per change, and on each return to the front */
  const minute = Math.floor(now / 60_000);
  useEffect(() => {
    if (!real || !st) return;
    pullWrite(pullBridge(snap.days, st, prefs, Date.now(), account)).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snap.days, st, prefs, account, Math.floor(minute / 15)]);
  useEffect(() => {
    if (!real) return;
    const back = async () => {
      if (real.takeWant()) router.navigate('/pause');
      /* access taken back in Settings: More shows it off, and the schedules and any pause are stopped too. allowed() is false
         only for a plain no, never while Apple's status is still loading after a launch. */
      if (getPullPrefs().on && !(await real.allowed().catch(() => true))) await pullStop().catch(() => undefined);
    };
    back();
    const sub = AppState.addEventListener('change', (a) => a === 'active' && back());
    return () => sub.remove();
  }, []);
  return null;
}
