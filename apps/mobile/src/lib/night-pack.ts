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

/** whether this phone offers the pack: an iPhone on iOS 26 or later with this build */
export const packOffered = !!NightPack?.ok;

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
if (packOffered)
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
