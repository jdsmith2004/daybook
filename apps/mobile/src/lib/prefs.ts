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
