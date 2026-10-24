/* The first open of the day, for "How are you feeling today?" (core day-feel.ts, dayOpenNext). The day the app was last
   opened is kept on this device (it is never synced and never goes into a backup). Each open (the launch, and coming
   back to the app from the background) is checked: on the day's first open, `first` holds that day until Today has
   asked, or until the app is put away. Later opens that day are not the first, so a closed question stays closed. */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { dayOpenNext, logicalKey, type DayKey } from '@daybook/core';
import { useEffect, useRef, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';

const KEY = 'daybook.dayOpen';

/** the day this open is the first of, and when the open was (ms), or null */
let first: { k: DayKey; at: number } | null = null;
let last: DayKey | null = null;
let loaded = false;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

const read: Promise<void> = AsyncStorage.getItem(KEY)
  .then((v) => {
    if (v && /^\d{4}-\d{2}-\d{2}$/.test(v)) last = v;
  })
  .catch(() => undefined)
  .finally(() => {
    loaded = true;
  });

function opened(rollover: number, setupDone: boolean) {
  const now = Date.now();
  const n = dayOpenNext(last, logicalKey(now, rollover), setupDone);
  first = n.first ? { k: n.first, at: now } : null;
  if (n.last !== last) {
    last = n.last;
    AsyncStorage.setItem(KEY, n.last).catch(() => undefined);
  }
  emit();
}

/** Today has asked (or the moment passed): this open is no longer one that may ask */
export function spendFirstOpen() {
  if (!first) return;
  first = null;
  emit();
}

const sub = (f: () => void) => {
  subs.add(f);
  return () => void subs.delete(f);
};
/** the day this open is the first of, and when it was opened, or null */
export const useFirstOpen = () =>
  useSyncExternalStore(
    sub,
    () => first,
    () => first,
  );

/** watches the opens: the launch, once the log is loaded, and each return from the background. Used once, in the root layout. */
export function useWatchOpens(ready: boolean, rollover: number, setupDone: boolean) {
  const cur = useRef({ rollover, setupDone });
  cur.current = { rollover, setupDone };
  useEffect(() => {
    if (!ready) return;
    let gone = false;
    read.then(() => !gone && loaded && opened(cur.current.rollover, cur.current.setupDone));
    let away = false;
    const s = AppState.addEventListener('change', (a) => {
      /* only a real return counts: Face ID and the app switcher make the app inactive for a moment, not put away */
      if (a === 'background') {
        away = true;
        spendFirstOpen();
      } else if (a === 'active' && away) {
        away = false;
        opened(cur.current.rollover, cur.current.setupDone);
      }
    });
    return () => {
      gone = true;
      s.remove();
    };
  }, [ready]);
}
