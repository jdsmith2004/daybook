/* Future you (core future.ts): the notes a person leaves on a good day for the next hard moment. The list lives on this
   device only (AsyncStorage, never synced, never in a backup or an export), and each recording is a file beside the voice
   note's (lib/voice.ts). The web keeps written notes only. "Delete everything" forgets them all. The voice note from before
   (My plan's one recording) becomes the first note, once. */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { futureAsked, futureClean, futureDrop, futureId, futureKeep, futureQ, futureSeen, type FutureMem, type FutureNote } from '@daybook/core';
import { useEffect, useSyncExternalStore } from 'react';

import { dropNoteFile, keepNoteFile, noteUri, takeOldVoice } from '@/lib/voice';

const KEY = 'daybook.future.v1';
let mem: FutureMem = { notes: [] };
let loaded = false;
let loading: Promise<void> | null = null;
const subs = new Set<() => void>();
const tell = () => subs.forEach((f) => f());

const rnd = () => Math.random().toString(36).slice(2, 8);

function save() {
  AsyncStorage.setItem(KEY, JSON.stringify(mem)).catch(() => undefined);
}
function set(m: FutureMem) {
  mem = m;
  save();
  tell();
}

/** read the notes once; the old voice note comes in as a note the first time */
export function loadFuture(): Promise<void> {
  if (loading) return loading;
  loading = (async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      mem = futureClean(raw ? JSON.parse(raw) : null);
    } catch {
      mem = { notes: [] };
    }
    /* a voice note whose file is gone (a phone restored from a backup) is dropped, so SOS never offers a silent page */
    const live = mem.notes.filter((n) => n.k !== 'voice' || !!noteUri(n.id));
    let dirty = live.length !== mem.notes.length;
    if (dirty) mem = { ...mem, notes: live };
    const id = futureId(Date.now(), rnd());
    const old = await takeOldVoice(id);
    if (old) {
      const r = futureKeep(mem, { id, at: old.at, k: 'voice' });
      r.drop.forEach(dropNoteFile);
      mem = r.mem;
      dirty = true;
    }
    if (dirty) save();
    loaded = true;
    tell();
  })();
  return loading;
}

/** the notes on this phone (empty until they are read) */
export function useFuture(): FutureMem {
  useEffect(() => {
    if (!loaded) loadFuture();
  }, []);
  return useSyncExternalStore(
    (f) => {
      subs.add(f);
      return () => void subs.delete(f);
    },
    () => mem,
  );
}

/** whether the notes have been read from the phone yet */
export const futureLoaded = () => loaded;

/** the question for the next note */
export const nextFutureQ = () => futureQ(mem);

/** keep a recording (from the recorder's cache) as a new note */
export async function keepFutureVoice(tmp: string, q: number): Promise<FutureNote> {
  await loadFuture();
  const n: FutureNote = { id: futureId(Date.now(), rnd()), at: Date.now(), k: 'voice', q };
  await keepNoteFile(tmp, n.id);
  const r = futureKeep(mem, n);
  r.drop.forEach(dropNoteFile);
  set(r.mem);
  return n;
}

/** keep written words as a new note */
export async function keepFutureText(t: string, q: number): Promise<FutureNote | null> {
  const words = t.trim();
  if (!words) return null;
  await loadFuture();
  const n: FutureNote = { id: futureId(Date.now(), rnd()), at: Date.now(), k: 'text', t: words, q };
  const r = futureKeep(mem, n);
  r.drop.forEach(dropNoteFile);
  set(r.mem);
  return n;
}

export function dropFuture(id: string) {
  dropNoteFile(id);
  set(futureDrop(mem, id));
}

/** SOS offered this note */
export const seenFuture = (id: string) => set(futureSeen(mem, id, Date.now()));
/** the invitation was shown */
export const askedFuture = () => set(futureAsked(mem, Date.now()));

export const futureUri = (n: FutureNote) => (n.k === 'voice' ? noteUri(n.id) : null);

/** Delete everything: every note and every recording */
export async function forgetFuture() {
  await loadFuture();
  mem.notes.forEach((n) => dropNoteFile(n.id));
  mem = { notes: [] };
  await AsyncStorage.removeItem(KEY).catch(() => undefined);
  tell();
}
