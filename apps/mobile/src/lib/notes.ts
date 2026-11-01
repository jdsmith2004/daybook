/* Journal notes, the phone's side (core journal-notes.ts has the rules; modules/note-folder keeps the folder). Off until a
   folder is picked, and on the web, on Android and on an older install there is no module, so nothing here runs or shows
   for anyone else. What was written stays on this device, under the same keys "Delete everything" clears. A note goes out
   a few seconds after a change, when the app opens, and when it goes away. */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jnNotePlan, jnTagsOf, normLedger, runNotePlan, type Journal, type NoteFolderIO, type NoteLedger } from '@daybook/core';
import { useEffect, useRef, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';

import { useStore } from '@/lib/store';

import { NoteFolder } from '../../modules/note-folder';

const KEY = 'daybook:notes';
/** how long after a change the note goes out: long enough that a pause in writing does not send iCloud a file each time */
const QUIET_MS = 4000;

export interface NotesState {
  /** this phone can do it at all */
  can: boolean;
  on: boolean;
  /** the folder's name */
  name: string | null;
  /** the folder cannot be reached right now */
  lost: boolean;
  /** how many notes Daybook has in the folder */
  count: number;
  /** files with someone's own changes, kept beside the notes, in the last round */
  kept: number;
}

let state: NotesState = { can: !!NoteFolder, on: false, name: null, lost: false, count: 0, kept: 0 };
const subs = new Set<() => void>();
const set = (p: Partial<NotesState>) => {
  state = { ...state, ...p };
  subs.forEach((f) => f());
};

type Saved = { name: string; ledger: NoteLedger };
async function readSaved(): Promise<Saved | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const o = raw ? JSON.parse(raw) : null;
    return o && typeof o.name === 'string' ? { name: o.name, ledger: normLedger(o.ledger) } : null;
  } catch {
    return null;
  }
}
const writeSaved = (s: Saved) => AsyncStorage.setItem(KEY, JSON.stringify(s)).catch(() => undefined);

let loaded = false;
async function load() {
  if (loaded || !NoteFolder) return;
  loaded = true;
  const saved = await readSaved();
  if (saved) set({ on: true, name: saved.name, count: Object.keys(saved.ledger).length });
}

export function useNotes(): NotesState {
  useEffect(() => void load(), []);
  return useSyncExternalStore(
    (f) => {
      subs.add(f);
      return () => subs.delete(f);
    },
    () => state,
  );
}

/** shows the folder picker. Picking starts the copy over: every entry goes to the new folder, and notes already in another stay */
export async function pickNoteFolder(): Promise<boolean> {
  if (!NoteFolder) return false;
  const name = await NoteFolder.pick();
  if (!name) return false;
  await writeSaved({ name, ledger: {} });
  loaded = true;
  set({ on: true, name, lost: false, count: 0, kept: 0 });
  return true;
}

/** stops copying. The notes stay where they are */
export async function stopNotes() {
  await NoteFolder?.forget();
  await AsyncStorage.removeItem(KEY).catch(() => undefined);
  set({ on: false, name: null, lost: false, count: 0, kept: 0 });
}

let running = false;
let again: { jn: Journal | undefined; every: string[] } | null = null;

/** one round: what changed goes to the folder. Rounds run one at a time; a change during one waits for the next */
async function copyNotes(jn: Journal | undefined, every: string[]) {
  if (!NoteFolder) return;
  if (running) {
    again = { jn, every };
    return;
  }
  running = true;
  try {
    const saved = await readSaved();
    /* "Delete everything" cleared the key: this phone stops copying, and the notes stay */
    if (!saved) {
      if (state.on) await stopNotes();
      return;
    }
    const folder = NoteFolder;
    const io: NoteFolderIO = {
      read: (f) => folder.read(f),
      write: (f, t) => folder.write(f, t),
      remove: (f) => folder.remove(f),
      move: (a, b) => folder.move(a, b),
    };
    const plan = jnNotePlan(jn, every, saved.ledger);
    const run = await runNotePlan(plan, saved.ledger, io);
    if (run.wrote || run.removed || plan.letGo.length) await writeSaved({ name: saved.name, ledger: run.ledger });
    set({ lost: run.failed, count: Object.keys(run.ledger).length, kept: state.kept + run.kept });
  } catch {
    set({ lost: true });
  } finally {
    running = false;
    const next = again;
    again = null;
    if (next) void copyNotes(next.jn, next.every);
  }
}

/** keeps the folder up to date while the app runs. It draws nothing, and does nothing until a folder is picked */
export function NoteCopy() {
  const { on } = useNotes();
  const { snap } = useStore();
  const every = jnTagsOf(snap.settings);
  const tags = every.join(' ');
  const latest = useRef({ jn: snap.journal, every });
  latest.current = { jn: snap.journal, every };
  useEffect(() => {
    if (!on) return;
    const t = setTimeout(() => void copyNotes(latest.current.jn, latest.current.every), QUIET_MS);
    return () => clearTimeout(t);
  }, [on, snap.journal, tags]);
  useEffect(() => {
    if (!on) return;
    /* right away when the app opens (entries that came by sync, or a change that had no time to go out), and when it goes away */
    void copyNotes(latest.current.jn, latest.current.every);
    const sub = AppState.addEventListener('change', () => void copyNotes(latest.current.jn, latest.current.every));
    return () => sub.remove();
  }, [on]);
  return null;
}
