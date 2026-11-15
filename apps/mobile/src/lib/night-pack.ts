/* The night pack, the phone's side (core night-pack.ts has the rules; modules/night-pack and plugins/night-pack the native parts).
   The keeper writes tonight's start for the actions each time the app opens or the morning changes it, and opens the page an
   action left (the wait, Good night, the morning). What the person said is set is kept on this phone. */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { packNightAt, type PackKind, type PackState } from '@daybook/core';
import { router } from 'expo-router';
import { useEffect, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';

import { NightPack } from '../../modules/night-pack';
import { useStore } from './store';

/** whether this phone offers the pack: off for everyone (the owner, November 15, 2026: "this is a lot of work ... if we can give
    them a button where they can press add shortcut ... then we can do it ... Otherwise, we're just not going to do it"). Apple has
    no way for an app to add an automation for the person, so it cannot be one tap. The walk (app/nightpack.tsx), the rules and the
    native actions stay, so it can come back if Apple ever allows it: set this back to `!!NightPack?.ok`. Screen Time (beta) does the
    night wait in one switch, and Settings, Reminders sets the phone alarms. */
export const packOffered = false && !!NightPack?.ok;
/** Settings shows the pack's page only where it is offered */
export const packShown = packOffered;

const KEY = 'daybook.nightPack';
let said: PackState['said'] = {};
let seen: PackState['seen'] = {};
const subs = new Set<() => void>();
let snapshot: PackState = { said, seen };
const emit = () => {
  snapshot = { said, seen };
  subs.forEach((f) => f());
};
const readSeen = () => {
  const s = NightPack?.seen() ?? {};
  if (JSON.stringify(s) !== JSON.stringify(seen)) {
    seen = s;
    emit();
  }
};
if (packShown)
  AsyncStorage.getItem(KEY)
    .then((v) => {
      said = v ? (JSON.parse(v) as PackState['said']) : {};
      seen = NightPack?.seen() ?? {};
      emit();
    })
    .catch(() => undefined);

export function usePack(): PackState {
  return useSyncExternalStore(
    (f) => {
      subs.add(f);
      return () => subs.delete(f);
    },
    () => snapshot,
  );
}

/** the person says an automation is set (or takes it back) */
export function packSay(k: PackKind, on: boolean) {
  said = { ...said, [k]: on };
  emit();
  AsyncStorage.setItem(KEY, JSON.stringify(said)).catch(() => undefined);
}

/** after the wait: the apps open without it for `min` minutes */
export function packOpenFor(min: number) {
  NightPack?.openUntil(Date.now() + min * 60_000);
}

export function NightPackKeeper() {
  const { snap, tk } = useStore();
  const st = snap.settings;
  useEffect(() => {
    if (packOffered && st) NightPack!.setNight(packNightAt(snap.days, st, tk));
  }, [snap.days, st, tk]);
  useEffect(() => {
    if (!packOffered) return;
    const back = () => {
      readSeen();
      const r = NightPack!.take();
      if (r) router.navigate(r as never);
    };
    /* a moment for the screens to be ready, as the Screen Time keeper does */
    const t = setTimeout(back, 600);
    const sub = AppState.addEventListener('change', (a) => a === 'active' && back());
    return () => {
      clearTimeout(t);
      sub.remove();
    };
  }, []);
  return null;
}
