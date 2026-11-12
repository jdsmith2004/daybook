/* Future you (core future.ts): the notes a person leaves on a good day for the next hard moment. The list lives on this
   device only (AsyncStorage, never synced, never in a backup or an export), and each recording is a file beside the voice
   note's (lib/voice.ts). The web keeps written notes only. "Delete everything" forgets them all. The voice note from before
   (My plan's one recording) becomes the first note, once. */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { futureAsked, futureClean, futureDrop, futureId, futureKeep, futureQ, futureSeen, type FutureMem, type FutureNote } from '@daybook/core';
import { useEffect, useSyncExternalStore } from 'react';

import { dropNoteFile, keepNoteFile, moveOldVoice, noteUri, oldVoiceAt } from '@/lib/voice';

const KEY = 'daybook.future.v1';
let mem: FutureMem = { notes: [] };
let loaded = false;
/* false when the list could not be read: nothing is written over it then, so one bad read never wipes the notes */
let readOk = false;
let loading: Promise<void> | null = null;
const subs = new Set<() => void>();
const tell = () => subs.forEach((f) => f());

const rnd = () => Math.random().toString(36).slice(2, 8);

function save(): Promise<boolean> {
  if (!readOk) return Promise.resolve(false);
  return AsyncStorage.setItem(KEY, JSON.stringify(mem)).then(
    () => true,
    () => false,
  );
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
      readOk = true;
    } catch {
      mem = { notes: [] };
    }
    /* a voice note whose file is gone (a phone restored from a backup) is dropped, so SOS never offers a silent page */
    const live = mem.notes.filter((n) => n.k !== 'voice' || !!noteUri(n.id));
    let dirty = live.length !== mem.notes.length;
    if (dirty) mem = { ...mem, notes: live };
    /* the voice note from before: its entry is saved first, and only then does the file move, so a stop in between never
       leaves a recording with no entry (an entry with no file is dropped by the check above next time) */
    const at = readOk ? oldVoiceAt() : null;
    if (at != null) {
      const id = futureId(Date.now(), rnd());
      const r = futureKeep(mem, { id, at, k: 'voice' });
      const was = mem;
      mem = r.mem;
      if ((await save()) && (await moveOldVoice(id))) r.drop.forEach(dropNoteFile);
      else mem = was;
      dirty = true;
    }
    if (dirty) save();
    loaded = true;
    /* a new object, so every screen that read the list before it was ready looks again */
    mem = { ...mem };
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

/** save a new note's entry; only once it is saved do the notes it pushed out go. If it does not save, nothing changes and
    the page says so (it throws). */
async function keepEntry(n: FutureNote, undo: () => void) {
  const was = mem;
  const r = futureKeep(mem, n);
  mem = r.mem;
  if (!(await save())) {
    mem = was;
    undo();
    throw new Error('not saved');
  }
  r.drop.forEach(dropNoteFile);
  tell();
}

/** keep a recording (from the recorder's cache) as a new note */
export async function keepFutureVoice(tmp: string, q: number): Promise<FutureNote> {
  await loadFuture();
  const n: FutureNote = { id: futureId(Date.now(), rnd()), at: Date.now(), k: 'voice', q };
  await keepNoteFile(tmp, n.id);
  await keepEntry(n, () => dropNoteFile(n.id));
  return n;
}

/** keep written words as a new note */
export async function keepFutureText(t: string, q: number): Promise<FutureNote | null> {
  const words = t.trim();
  if (!words) return null;
  await loadFuture();
  const n: FutureNote = { id: futureId(Date.now(), rnd()), at: Date.now(), k: 'text', t: words, q };
  await keepEntry(n, () => undefined);
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
