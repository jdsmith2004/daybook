/* Listen's own choices: which voice reads, and how fast (the owner, November 14, 2026: "let them switch in between different voices
   ... speed up and switch voice and then the app remembers it"). They belong to this device, like the theme and the sound guide
   (prefs.ts): kept in AsyncStorage, never synced, never in a backup. Paused, and whether the card has been read to the end, are for now only, and are not kept. */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { VOICES, type VoiceId } from '@daybook/core';
import { useSyncExternalStore } from 'react';

/** the speeds Listen steps through, slowest first */
export const RATES = [0.8, 1, 1.2, 1.4] as const;

export interface ListenPrefs {
  voice: VoiceId;
  rate: number;
  paused: boolean;
  /** the card has been read to the end: Play reads it again */
  done: boolean;
  /** counts each Play again, so the card starts over */
  again: number;
}
const KEY = 'daybook.listen';
let prefs: ListenPrefs = { voice: VOICES[0].id, rate: 1, paused: false, done: false, again: 0 };
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());
const sub = (f: () => void) => (subs.add(f), () => void subs.delete(f));

AsyncStorage.getItem(KEY)
  .then((v) => {
    const o = v ? (JSON.parse(v) as Partial<ListenPrefs>) : null;
    if (!o) return;
    prefs = {
      ...prefs,
      voice: VOICES.some((x) => x.id === o.voice) ? (o.voice as VoiceId) : prefs.voice,
      rate: (RATES as readonly number[]).includes(Number(o.rate)) ? Number(o.rate) : prefs.rate,
    };
    emit();
  })
  .catch(() => undefined);

export const getListen = () => prefs;
export function setListen(p: Partial<ListenPrefs>) {
  prefs = { ...prefs, ...p };
  emit();
  if ('voice' in p || 'rate' in p) AsyncStorage.setItem(KEY, JSON.stringify({ voice: prefs.voice, rate: prefs.rate })).catch(() => undefined);
}
export const useListen = () =>
  useSyncExternalStore(
    sub,
    () => prefs,
    () => prefs,
  );
