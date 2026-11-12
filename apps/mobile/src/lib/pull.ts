/* The app that pulls you in (Screen Time, iPhone only), the phone side. The rules and words are core pull.ts; Apple's side
   (the Screen Time ask, Apple's app list, the watching and the pause, and the three extensions) is the native module
   `DaybookPull`, which needs Apple's Family Controls entitlement and is built in its own step (docs/plan.md, "Screen Time").

   The module is in every iPhone build, but on only in one made with DAYBOOK_PULL=1 (app.config.js: the entitlement, the App Group and
   the extensions), so it says `on`. Without it, a stand-in lets the screens be seen: in development, or in a build made with
   EXPO_PUBLIC_PULL_PREVIEW=1 (on the web too, only to look at the screens). A store build without it shows nothing of this. The
   choices stay on this phone: never synced, never in a backup, never counted (Apple's license keeps Screen Time data on the device).

   PullKeeper (in the root layout) writes core pullBridge for the extensions each time the app opens or comes back, and whenever the
   log or the choices change; notices access taken back in Settings; and opens the wait screen when a pause's button asked for it. */
import {
  normPull,
  pullBridge,
  pullChange,
  pullInNight,
  pullLiftUntil,
  pullLooseAt,
  pullNightStart,
  pullSettle,
  type Days,
  type PullBridge,
  type PullNights,
  type PullPrefs,
  type Settings,
} from '@daybook/core';
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
  /** Apple's app list; how many apps and kinds are picked, or null when it was closed. `laterAt` (core pullLooseAt): a pick that
      leaves an app out keeps it in until then; null when it all works now */
  pick(laterAt: number | null): Promise<number | null>;
  /** how many are picked now */
  picked(): Promise<number>;
  /** ms when a smaller pick starts, or null when none waits */
  pickWaits(): number | null;
  /** hands the extensions what they need (core pullBridge, as JSON) and sets the watching to match */
  write(bridge: string): Promise<void>;
  /** Lift every wait now: nothing held until `until` ms (core pullLiftUntil) */
  lift(until: number): Promise<void>;
  /** after the short wait: the apps open for this many minutes of use, then the wait is back */
  openFor(minutes: number): Promise<void>;
  /** after the long wait: adult sites open for this many minutes, then the filter is back; the night counts as gone through */
  openWeb(minutes: number, count: boolean): Promise<void>;
  /** tonight counts as a night the person went through */
  through(): void;
  /** the nights, on this phone only (core pullNightHeld) */
  nights(): PullNights;
  /** stops everything: no watching, no pause, nothing picked */
  stop(): Promise<void>;
  /** when the night's notes were ignored (core pullDrift), or null */
  ignoredAt(): number | null;
  /** whether a pause's button asked for Daybook just now, taken once */
  takeWant(): boolean;
  /** the times the person put it down (the shield's Close and the wait screen's Put it down), on this phone only */
  downs(): number;
  /** Put it down on the wait screen: one more (at most one in core PULL_COUNT_GAP minutes); the count after it */
  countDown(): number;
}
interface PullNative extends PullModule {
  on: boolean;
}

const native = Platform.OS === 'ios' ? requireOptionalNativeModule<PullNative>('DaybookPull') : null;
const real: PullModule | null = native?.on ? native : null;
const preview = (Platform.OS === 'ios' && __DEV__) || process.env.EXPO_PUBLIC_PULL_PREVIEW === '1';
let fakeCount = 0;
let fakeDowns = 0;
/* the stand-in: says yes to the ask and picks two apps, so the screens can be walked */
const fake: PullModule = {
  authorize: async () => true,
  allowed: async () => true,
  pick: async () => (fakeCount = 2),
  picked: async () => fakeCount,
  pickWaits: () => null,
  write: async () => undefined,
  lift: async () => undefined,
  openFor: async () => undefined,
  openWeb: async () => undefined,
  through: () => undefined,
  nights: () => ({}),
  stop: async () => void (fakeCount = 0),
  ignoredAt: () => null,
  takeWant: () => false,
  downs: () => fakeDowns,
  countDown: () => ++fakeDowns,
};
export const Pull: PullModule | null = real ?? (preview ? fake : null);
/** whether this build offers it at all: an iPhone with the module (or the stand-in) */
export const pullOffered = !!Pull;

/* the choices, kept on this phone */
const KEY = 'daybook.pull';
let prefs: PullPrefs = normPull(null);
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());
/** settles once the saved choices are read (or found missing): nothing is decided from the defaults before then */
/* whether the saved choices were read: a read that failed must never be taken for "off" (PullKeeper would clear the picked apps) */
let readOk = false;
const ready: Promise<void> = AsyncStorage.getItem(KEY)
  .then((v) => {
    readOk = true;
    if (!v) return;
    prefs = normPull(JSON.parse(v));
    emit();
  })
  .catch(() => undefined);
function save(p: PullPrefs) {
  prefs = normPull(p);
  emit();
  AsyncStorage.setItem(KEY, JSON.stringify(prefs)).catch(() => undefined);
}
/** a change as it is, with no waiting: Screen Time on or off, the setup page seen. Choices from More go through pullSet. */
export function setPullPrefs(p: Partial<PullPrefs>) {
  save({ ...prefs, ...p });
}
/** a choice from More (core pullChange): a stricter one works now, a looser one waits for the morning. When it waits, the ms it
    starts, for the flame to say so. */
export function pullSet(p: Partial<PullPrefs>): number | null {
  const r = pullChange(prefs, p, Date.now());
  save(r.prefs);
  return r.held;
}
/** the choices as saved (with any looser ones still waiting in `later`) */
export const getPullPrefs = () => prefs;
/** looser choices whose morning has come are kept as the choices (the extensions apply them on time from the bridge anyway) */
function settle() {
  const p = pullSettle(prefs, Date.now());
  if (p !== prefs) save(p);
}
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
  const n = await Pull.pick(null).catch(() => null);
  if (!n) return 'closed';
  setPullPrefs({ on: true, asked: 'picked' });
  if (real) await allowReminders().catch(() => false);
  return 'on';
}
/** what the flame says when Screen Time said no */
export const PULL_DENIED = 'Screen Time said no, so nothing changed. Try again whenever you want, and choose Continue when it asks.';
/** Change the apps: a pick that leaves an app out, outside the morning, keeps it in until 6 AM. When it waits, the ms it starts. */
export async function pullPick(): Promise<number | null> {
  if (!Pull) return null;
  await Pull.pick(pullLooseAt(Date.now())).catch(() => null);
  return Pull.pickWaits();
}
/** turn it all off: nothing watched, nothing held. In the night, it counts as a night the person went through. Instant, always. */
export async function pullStop(night = false) {
  if (night && prefs.on) Pull?.through();
  setPullPrefs({ on: false });
  await Pull?.stop();
}
/** Lift every wait now (instant, as promised): until tonight starts by day, until 6 AM in the night, when it counts as a night the
    person went through (`counts`: not in the quiet after a slip, when the stake is not said). Its end, as ms. */
export async function pullLiftAll(days: Days, st: Settings, counts: boolean): Promise<number> {
  const now = Date.now();
  const from = pullNightStart(days, st, prefs, now);
  const until = pullLiftUntil(now, from);
  if (counts && pullInNight(now, from)) Pull?.through();
  await Pull?.lift(until);
  return until;
}
/** the nights, on this phone only (core pullNightHeld: 'held' or 'through'), for the effort record */
export const pullNights = (): PullNights => (real ? real.nights() : {});

/* the long wait before adult sites (/pause?w=long): when it started, kept so that leaving and coming back does not start it again.
   On this phone only. */
const LONG_KEY = 'daybook.pull.long';
let longAt = 0;
AsyncStorage.getItem(LONG_KEY)
  .then((v) => {
    if (v && !longAt) longAt = +v || 0;
  })
  .catch(() => undefined);
/** when the long wait started, starting it now if it is not running. One that ran out more than a few minutes ago is gone, so a
    later urge meets the whole wait again, not an Open left over from an earlier one. */
export function pullLongStart(lift: number, now = Date.now()): number {
  if (!longAt || now - longAt > (lift + 5) * 60_000 || longAt > now) {
    longAt = now;
    AsyncStorage.setItem(LONG_KEY, String(now)).catch(() => undefined);
  }
  return longAt;
}
/** the long wait ends: put down, or opened */
export function pullLongEnd() {
  longAt = 0;
  AsyncStorage.removeItem(LONG_KEY).catch(() => undefined);
}
/** what the extensions read, written on every open and every change */
export async function pullWrite(b: PullBridge) {
  if (!Pull || !b.prefs.on) return;
  await Pull.write(JSON.stringify(b));
}

/* the times the person put it down, read fresh each time the app comes back (the shield's Close adds to it while Daybook is shut) */
let downs = 0;
const readDowns = () => {
  const n = Pull?.downs() ?? 0;
  if (n !== downs) {
    downs = n;
    emit();
  }
};
/** Put it down on the wait screen: one more, and the count after it */
export function pullCountDown(): number {
  const n = Pull?.countDown() ?? 0;
  readDowns();
  return n;
}
/** the times the person put it down (core identityLines: "You are someone who puts it down."), 0 without Screen Time */
export const usePullDowns = () =>
  useSyncExternalStore(
    sub,
    () => downs,
    () => downs,
  );

/** when the night's notes were ignored, read fresh (core pullDrift) */
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
    settle();
    pullWrite(pullBridge(snap.days, st, getPullPrefs(), Date.now(), account)).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snap.days, st, prefs, account, Math.floor(minute / 15)]);
  useEffect(() => {
    if (!real) return;
    const back = async () => {
      readDowns();
      settle();
      /* a fresh token each time, so a wait screen still open from before starts its wait again */
      if (real.takeWant()) router.navigate({ pathname: '/pause', params: { t: String(Date.now()) } });
      /* access taken back in Settings: More shows it off, and the schedules and any pause are stopped too. allowed() is false
         only for a plain no, never while Apple's status is still loading after a launch. */
      if (getPullPrefs().on && !(await real.allowed().catch(() => true))) await pullStop().catch(() => undefined);
    };
    /* the first check waits for the saved choices (and a moment for the screens to be ready to open the wait screen). Off with
       anything Apple still holds (a pause or schedules that outlived a reinstall, or a stop that did not finish): all of it is
       cleared, so no pause can be left with no way in Daybook to lift it. */
    let gone = false;
    ready.then(() =>
      setTimeout(() => {
        if (gone) return;
        if (readOk && !getPullPrefs().on) real.stop().catch(() => undefined);
        back();
      }, 600),
    );
    const sub = AppState.addEventListener('change', (a) => a === 'active' && back());
    return () => {
      gone = true;
      sub.remove();
    };
  }, []);
  return null;
}
