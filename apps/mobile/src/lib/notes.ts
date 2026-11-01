/* Journal notes, the phone's side (core journal-notes.ts and journal-notes-in.ts have the rules; modules/note-folder keeps the
   folder). Off until a folder is picked, and on the web, on Android and on an older install there is no module, so nothing here
   runs or shows for anyone else. What it knows of the folder stays on this device, under the same keys "Delete everything"
   clears. A note goes out a few seconds after a change, when the app opens, and when it goes away. Notes come in when the app
   opens or comes back, since iOS gives an app no way to hear of them sooner. */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  applyNotePull,
  jnNotePlan,
  jnTagsOf,
  normLedger,
  pullNotes,
  runNotePlan,
  type NoteFile,
  type NoteFolderIO,
  type NoteLedger,
  type NoteSeen,
  type Snapshot,
} from '@daybook/core';
import { useEffect, useSyncExternalStore } from 'react';
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
  /** how many notes are in step with the journal */
  count: number;
  /** files with someone's own changes, kept beside the notes, since the app opened */
  kept: number;
  /** notes that left the folder since the app opened; their entries stay */
  gone: number;
  /** notes too long to come in */
  tooLong: number;
}

let state: NotesState = { can: !!NoteFolder, on: false, name: null, lost: false, count: 0, kept: 0, gone: 0, tooLong: 0 };
const subs = new Set<() => void>();
const set = (p: Partial<NotesState>) => {
  state = { ...state, ...p };
  subs.forEach((f) => f());
};

type Saved = { name: string; ledger: NoteLedger; seen: NoteSeen };
const inStep = (l: NoteLedger) => Object.values(l).filter((m) => !m.g).length;
async function readSaved(): Promise<Saved | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const o = raw ? JSON.parse(raw) : null;
    return o && typeof o.name === 'string' ? { name: o.name, ledger: normLedger(o.ledger), seen: o.seen && typeof o.seen === 'object' ? o.seen : {} } : null;
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
  if (saved) set({ on: true, name: saved.name, count: inStep(saved.ledger) });
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

/** shows the folder picker. Picking starts over: every entry goes to the new folder, and the notes in it with the tag come in.
    Notes in another folder stay */
export async function pickNoteFolder(): Promise<boolean> {
  if (!NoteFolder) return false;
  const name = await NoteFolder.pick();
  if (!name) return false;
  await writeSaved({ name, ledger: {}, seen: {} });
  loaded = true;
  set({ on: true, name, lost: false, count: 0, kept: 0, gone: 0, tooLong: 0 });
  syncNotes(true);
  return true;
}

/** stops syncing. The notes and the entries stay where they are */
export async function stopNotes() {
  await NoteFolder?.forget();
  await AsyncStorage.removeItem(KEY).catch(() => undefined);
  set({ on: false, name: null, lost: false, count: 0, kept: 0, gone: 0, tooLong: 0 });
}

type Store = { current: () => { snap: Snapshot }; update: (fn: (s: Snapshot) => Snapshot, opts?: { noWin?: boolean }) => Snapshot };
let store: Store | null = null;
let running = false;
/** a round asked for during a round; true when it should look in the folder too */
let again: boolean | null = null;

/** one round: what changed in the folder comes in, if `look` says to, then what changed in the journal goes out. Rounds run one
    at a time; one asked for during another waits for it */
export function syncNotes(look: boolean) {
  void round(look);
}
async function round(look: boolean) {
  if (!NoteFolder || !store) return;
  if (running) {
    again = again || look;
    return;
  }
  running = true;
  try {
    const saved = await readSaved();
    /* "Delete everything" cleared the key: this phone stops syncing, and the notes stay */
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
    let { snap } = store.current();
    let { ledger, seen } = saved;
    let files: NoteFile[] = [];
    let failed = false;
    let { gone, tooLong } = state;
    if (look) {
      files = await folder.list();
      const now = Date.now();
      const pull = await pullNotes({ files, jn: snap.journal, every: jnTagsOf(snap.settings), ledger, seen, roll: snap.settings?.rollover ?? 4, now }, io);
      if (pull.edits.length || pull.adds.length) snap = store.update((s0) => ({ ...s0, journal: applyNotePull(s0.journal, pull, now) }), { noWin: true });
      ledger = pull.ledger;
      seen = pull.seen;
      failed = pull.failed;
      gone += pull.gone;
      tooLong = Math.max(tooLong, pull.tooLong);
      /* a note may already carry its new id, so this is kept before anything else can go wrong */
      await writeSaved({ name: saved.name, ledger, seen });
    }
    const plan = jnNotePlan(snap.journal, jnTagsOf(snap.settings), ledger);
    const run = await runNotePlan(plan, ledger, io);
    /* notes let go in numbers stay in the folder, and do not come back in as new entries, until they change */
    if (plan.letGo.length) {
      const list = files.length ? files : await folder.list();
      seen = { ...seen };
      for (const id of plan.letGo) {
        const file = list.find((f) => f.name === ledger[id].f);
        if (file) seen[file.name] = file.mod;
      }
    }
    if (run.wrote || run.removed || plan.letGo.length) await writeSaved({ name: saved.name, ledger: run.ledger, seen });
    set({ lost: failed || run.failed, count: inStep(run.ledger), kept: state.kept + run.kept, gone, tooLong });
  } catch {
    set({ lost: true });
  } finally {
    running = false;
    const next = again;
    again = null;
    if (next != null) void round(next);
  }
}

/** keeps the folder and the journal in step while the app runs. It draws nothing, and does nothing until a folder is picked */
export function NoteCopy() {
  const { on } = useNotes();
  const { snap, ready, current, update } = useStore();
  const tags = jnTagsOf(snap.settings).join(' ');
  store = { current, update };
  useEffect(() => {
    if (!on || !ready) return;
    const t = setTimeout(() => syncNotes(false), QUIET_MS);
    return () => clearTimeout(t);
  }, [on, ready, snap.journal, tags]);
  useEffect(() => {
    if (!on || !ready) return;
    /* right away when the app opens, and each time it comes back or goes away */
    syncNotes(true);
    const sub = AppState.addEventListener('change', (now) => syncNotes(now === 'active'));
    return () => sub.remove();
  }, [on, ready]);
  return null;
}
