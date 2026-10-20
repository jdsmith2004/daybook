/* Choices that belong to this device, not to the log: the theme (auto, light or dark) and the sound guide. Kept in AsyncStorage, like the legacy
   app kept it in the browser (daybook.theme), so it never syncs and never goes into a backup. */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NUDGE_DEFAULTS, NUDGE_SUNDAY_AT, normNudgeLog, nudgeLogNew, type NudgeLog, type NudgePrefs } from '@daybook/core';
import { useSyncExternalStore } from 'react';

export type ThemePref = 'auto' | 'light' | 'dark';
const KEY = 'daybook.theme';

let theme: ThemePref = 'auto';
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

AsyncStorage.getItem(KEY)
  .then((v) => {
    if (v === 'light' || v === 'dark') {
      theme = v;
      emit();
    }
  })
  .catch(() => undefined);

export function setThemePref(v: ThemePref) {
  theme = v;
  emit();
  (v === 'auto' ? AsyncStorage.removeItem(KEY) : AsyncStorage.setItem(KEY, v)).catch(() => undefined);
}

const sub = (f: () => void) => {
  subs.add(f);
  return () => void subs.delete(f);
};
export const useThemePref = () =>
  useSyncExternalStore(
    sub,
    () => theme,
    () => theme,
  );

/* the sound guide: off unless turned on (legacy sndOn, kept on the device) */
const SKEY = 'daybook.sound';
let sound = false;
AsyncStorage.getItem(SKEY)
  .then((v) => {
    if (v === '1') {
      sound = true;
      emit();
    }
  })
  .catch(() => undefined);
export const getSoundPref = () => sound;
export function setSoundPref(on: boolean) {
  sound = on;
  emit();
  (on ? AsyncStorage.setItem(SKEY, '1') : AsyncStorage.removeItem(SKEY)).catch(() => undefined);
}
export const useSoundPref = () =>
  useSyncExternalStore(
    sub,
    () => sound,
    () => sound,
  );

/* reminders: which ones are on, and their times (kept on the device: each phone decides; the rules are core nudges.ts) */
export type ReminderPrefs = NudgePrefs;
export const REMINDER_DEFAULTS: ReminderPrefs = NUDGE_DEFAULTS;
/** when the Sunday review reminder comes */
export const REVIEW_AT = NUDGE_SUNDAY_AT;
const RKEY = 'daybook.reminders';
let reminders: ReminderPrefs = REMINDER_DEFAULTS;
AsyncStorage.getItem(RKEY)
  .then((v) => {
    if (!v) return;
    const o = JSON.parse(v);
    reminders = { ...REMINDER_DEFAULTS, ...(o && typeof o === 'object' ? o : {}) };
    emit();
  })
  .catch(() => undefined);
export function setReminderPrefs(p: ReminderPrefs) {
  reminders = p;
  emit();
  AsyncStorage.setItem(RKEY, JSON.stringify(p)).catch(() => undefined);
}
export const useReminderPrefs = () =>
  useSyncExternalStore(
    sub,
    () => reminders,
    () => reminders,
  );

/* what this phone remembers about its notifications: what is scheduled, what was tapped, and which kinds have stepped down
   (core nudges.ts). It stays on this phone: never synced, never in a backup. */
const NKEY = 'daybook.nudges';
let nudges: NudgeLog & { ready: boolean } = { ...nudgeLogNew(), ready: false };
AsyncStorage.getItem(NKEY)
  .then((v) => {
    nudges = { ...normNudgeLog(v ? JSON.parse(v) : null), ready: true };
    emit();
  })
  .catch(() => {
    nudges = { ...nudges, ready: true };
    emit();
  });
export function setNudgeLog(f: (l: NudgeLog) => NudgeLog) {
  const { ready, ...cur } = nudges;
  nudges = { ...f(cur), ready };
  emit();
  const { ready: _r, ...keep } = nudges;
  AsyncStorage.setItem(NKEY, JSON.stringify(keep)).catch(() => undefined);
}
export const useNudgeLog = () =>
  useSyncExternalStore(
    sub,
    () => nudges,
    () => nudges,
  );

/* the lock: Face ID, Touch ID or the phone's passcode when Daybook opens (kept on the device) */
const LKEY = 'daybook.lock';
let lock = false;
let lockLoaded = false;
const lockReady = AsyncStorage.getItem(LKEY)
  .then((v) => {
    lock = v === '1';
  })
  .catch(() => undefined)
  .finally(() => {
    lockLoaded = true;
    emit();
  });
export const whenLockKnown = () => lockReady;
export const getLockPref = () => lock;
export function setLockPref(on: boolean) {
  lock = on;
  emit();
  (on ? AsyncStorage.setItem(LKEY, '1') : AsyncStorage.removeItem(LKEY)).catch(() => undefined);
}
export const useLockPref = () =>
  useSyncExternalStore(
    sub,
    () => (lockLoaded ? lock : null),
    () => (lockLoaded ? lock : null),
  );

/* Breathe from Tools: the last pattern and length, so it starts right away the next time (kept on the device) */
export type BreathePref = { pat: string; mins: number };
const BKEY = 'daybook.breathe';
let breathe: BreathePref = { pat: 'calm', mins: 1 };
AsyncStorage.getItem(BKEY)
  .then((v) => {
    const o = v ? JSON.parse(v) : null;
    if (!o || typeof o.pat !== 'string' || typeof o.mins !== 'number') return;
    breathe = { pat: o.pat, mins: o.mins };
    emit();
  })
  .catch(() => undefined);
export const getBreathePref = () => breathe;
export function setBreathePref(b: BreathePref) {
  breathe = b;
  emit();
  AsyncStorage.setItem(BKEY, JSON.stringify(b)).catch(() => undefined);
}
