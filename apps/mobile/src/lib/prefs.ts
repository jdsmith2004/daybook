/* Choices that belong to this device, not to the log: the theme (auto, light or dark) and the sound guide. Kept in AsyncStorage, like the legacy
   app kept it in the browser (daybook.theme), so it never syncs and never goes into a backup. */
import AsyncStorage from '@react-native-async-storage/async-storage';
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

/* reminders: which of the three daily reminders are on, and their times (kept on the device: each phone decides) */
export interface ReminderPrefs {
  morning: boolean;
  morningAt: string;
  checkin: boolean;
  checkinAt: string;
  /** the wind-down reminder follows the screens-off time: an hour before it */
  wind: boolean;
}
export const REMINDER_DEFAULTS: ReminderPrefs = { morning: false, morningAt: '08:00', checkin: false, checkinAt: '18:00', wind: false };
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
