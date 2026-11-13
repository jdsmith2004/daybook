/* The scripture library, the phone's side (core scripture.ts has the rules; modules/scripture-vault reaches the vault). Off until the
   person picks their Obsidian vault in Settings, and on the web, on Android and on an older install there is no module, so nothing
   here runs or shows for anyone else.

   What it knows stays on this device. That the library is on is kept outside the log's keys, so "Use my account's log here" (which
   replaces the log) leaves it on; "Delete everything" turns it off and lets go of the vault (forgetScripture, from store.tsx). A note that could not be written waits in its own key outside the log, so nothing
   that replaces the log takes it, and it is tried again each time the app opens; "Delete everything" clears it with the rest. */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  parseChapter,
  parseScrNotes,
  saveScrNote,
  scrChapterNo,
  scrLabel,
  scrNotesFile,
  scrNumbered,
  scrPath,
  scrSplit,
  scrTracks,
  SCR_NOTES,
  SCR_ROOT,
  SCR_TIMINGS,
  type ScrChapter,
  type ScrNote,
  type ScrNoteSave,
  type ScrSaveResult,
  type ScrTrack,
  type ScrVaultIO,
} from '@daybook/core';
import { useEffect, useSyncExternalStore } from 'react';

import { ScriptureVault } from '../../modules/scripture-vault';

const KEY = 'daybook~scripture';
/** notes waiting to reach the vault; outside the log's keys on purpose (see above) */
export const SCR_OUT_KEY = 'daybook~scripture-out';

export interface ScriptureState {
  /** this phone can do it at all */
  can: boolean;
  on: boolean;
  /** the vault's name */
  name: string | null;
  /** notes waiting to reach the vault */
  waiting: number;
  /** what this phone keeps has been read, so `on` can be trusted */
  ready: boolean;
}
let state: ScriptureState = { can: !!ScriptureVault, on: false, name: null, waiting: 0, ready: !ScriptureVault };
const subs = new Set<() => void>();
const set = (p: Partial<ScriptureState>) => {
  state = { ...state, ...p };
  subs.forEach((f) => f());
};

let loaded = false;
async function load() {
  if (loaded || !ScriptureVault) return;
  loaded = true;
  const [kept, name] = await Promise.all([AsyncStorage.getItem(KEY).catch(() => null), ScriptureVault.folder().catch(() => null)]);
  /* the key is gone (an erase that stopped half way): let go of the vault as well */
  if (!kept) {
    if (name) await ScriptureVault.forget().catch(() => undefined);
    set({ on: false, name: null });
  } else set({ on: true, name: name || keptName(kept) });
  set({ ready: true });
  const out = await readOut();
  set({ waiting: out.length });
  if (kept && out.length) void sendWaiting();
}

function keptName(raw: string): string | null {
  try {
    const o = JSON.parse(raw);
    return o && typeof o.name === 'string' ? o.name : null;
  } catch {
    return null;
  }
}

export function useScripture(): ScriptureState {
  useEffect(() => void load().catch(() => set({ ready: true })), []);
  return useSyncExternalStore(
    (f) => {
      subs.add(f);
      return () => subs.delete(f);
    },
    () => state,
  );
}

/** shows the folder picker. ok: the vault is kept; notVault: the folder has no Scriptures folder in it; closed: nothing picked */
export async function pickVault(): Promise<'ok' | 'notVault' | 'closed'> {
  if (!ScriptureVault) return 'closed';
  const got = await ScriptureVault.pick();
  if (!got) return 'closed';
  if (!got.ok) return 'notVault';
  await AsyncStorage.setItem(KEY, JSON.stringify({ name: got.name })).catch(() => undefined);
  index = null;
  tracks = null;
  set({ on: true, name: got.name });
  return 'ok';
}

/** turns the library off. Every note stays in the vault, and a note still waiting stays on this phone for when it comes back */
export async function stopVault() {
  await ScriptureVault?.forget().catch(() => undefined);
  await AsyncStorage.removeItem(KEY).catch(() => undefined);
  index = null;
  tracks = null;
  set({ on: false, name: null });
}

/* ---------- the library ---------- */

export interface ScrBook {
  name: string;
  dir: string;
}
export interface ScrVolume {
  name: string;
  dir: string;
  books: ScrBook[];
}
let index: Promise<ScrVolume[]> | null = null;

const byNumber = (names: { name: string; dir: boolean }[]) =>
  names
    .filter((x) => x.dir)
    .map((x) => ({ dir: x.name, num: scrNumbered(x.name) }))
    .filter((x): x is { dir: string; num: { n: number; name: string } } => !!x.num)
    .sort((a, b) => a.num.n - b.num.n);

/** the volumes and their books, in the vault's own order. Read once a launch */
export function scrIndex(): Promise<ScrVolume[]> {
  if (!ScriptureVault) return Promise.resolve([]);
  const vault = ScriptureVault;
  if (!index) {
    index = (async () => {
      const vols = byNumber(await vault.list(SCR_ROOT));
      return Promise.all(
        vols.map(async (v) => ({
          name: v.num.name,
          dir: v.dir,
          books: byNumber(await vault.list(`${SCR_ROOT}/${v.dir}`)).map((b) => ({ name: b.num.name, dir: b.dir })),
        })),
      );
    })();
    index.catch(() => (index = null));
  }
  return index;
}

/** where a book is, by its name ("Matthew") */
export async function findBook(name: string): Promise<{ vol: ScrVolume; book: ScrBook } | null> {
  for (const vol of await scrIndex()) {
    const book = vol.books.find((b) => b.name === name);
    if (book) return { vol, book };
  }
  return null;
}

/** a book's chapters, in order */
export async function scrChapters(vol: ScrVolume, book: ScrBook): Promise<number[]> {
  if (!ScriptureVault) return [];
  const files = await ScriptureVault.list(`${SCR_ROOT}/${vol.dir}/${book.dir}`);
  return files
    .filter((f) => !f.dir)
    .map((f) => scrChapterNo(f.name, book.name))
    .filter((n): n is number => n != null)
    .sort((a, b) => a - b);
}

export interface ScrOpen {
  key: string;
  volume: string;
  chapter: ScrChapter;
  notes: ScrNote[];
  /** the chapter before and after, when there is one in the same book */
  prev: string | null;
  next: string | null;
}
/** a chapter with its notes */
export async function openChapter(key: string): Promise<ScrOpen | null> {
  const s = scrSplit(key);
  if (!ScriptureVault || !s) return null;
  const at = await findBook(s.book);
  if (!at) return null;
  const [md, notes, list] = await Promise.all([
    ScriptureVault.read(scrPath(at.vol.dir, at.book.dir, key)),
    readNotes(key),
    scrChapters(at.vol, at.book).catch(() => [] as number[]),
  ]);
  if (md == null) return null;
  const i = list.indexOf(s.n);
  return {
    key,
    volume: at.vol.name,
    chapter: parseChapter(md),
    notes,
    prev: i > 0 ? s.book + ' ' + list[i - 1] : null,
    next: i >= 0 && i + 1 < list.length ? s.book + ' ' + list[i + 1] : null,
  };
}

export async function readNotes(key: string): Promise<ScrNote[]> {
  const text = await ScriptureVault?.read(`${SCR_NOTES}/${scrNotesFile(key)}`);
  return text ? parseScrNotes(text, key) : [];
}

/* ---------- the audio ---------- */

let tracks: Promise<Record<string, ScrTrack>> | null = null;
/** Bradley Ross's chapters, from the audio plugin's timings in the vault. Read once a launch; none when the file is not there */
export function scrTrackOf(key: string): Promise<ScrTrack | null> {
  if (!ScriptureVault) return Promise.resolve(null);
  const vault = ScriptureVault;
  if (!tracks) {
    tracks = vault.read(SCR_TIMINGS).then((t) => (t ? scrTracks(JSON.parse(t)) : {}));
    tracks.catch(() => (tracks = null));
  }
  return tracks.then((all) => all[key] ?? null).catch(() => null);
}

/* ---------- notes ---------- */

export interface ScrWaiting extends ScrNoteSave {
  at: number;
  /** the last try found the note changed in Obsidian: it waits until the person looks */
  changed?: boolean;
}
async function readOut(): Promise<ScrWaiting[]> {
  try {
    const raw = await AsyncStorage.getItem(SCR_OUT_KEY);
    const a = raw ? JSON.parse(raw) : [];
    return Array.isArray(a) ? a.filter((x) => x && typeof x.key === 'string' && Array.isArray(x.verses) && typeof x.body === 'string') : [];
  } catch {
    return [];
  }
}
async function writeOut(out: ScrWaiting[]) {
  await (out.length ? AsyncStorage.setItem(SCR_OUT_KEY, JSON.stringify(out)) : AsyncStorage.removeItem(SCR_OUT_KEY)).catch(() => undefined);
  set({ waiting: out.length });
}
const sameNote = (a: Pick<ScrNoteSave, 'key' | 'verses'>, b: Pick<ScrNoteSave, 'key' | 'verses'>) => scrLabel(a.key, a.verses) === scrLabel(b.key, b.verses);

/** the words waiting for these verses, if any */
export async function waitingFor(key: string, verses: number[]): Promise<ScrWaiting | null> {
  return (await readOut()).find((w) => sameNote(w, { key, verses })) ?? null;
}

function io(): ScrVaultIO | null {
  const v = ScriptureVault;
  return v ? { read: (p) => v.read(p), swap: (p, e, t) => v.swap(p, e, t) } : null;
}

/** saves a note. The words are kept on this phone first, and let go only once the vault has them */
export async function saveNote(save: ScrNoteSave): Promise<ScrSaveResult> {
  const out = (await readOut()).filter((w) => !sameNote(w, save));
  await writeOut([...out, { ...save, at: Date.now() }]);
  const vault = io();
  const r: ScrSaveResult = vault ? await saveScrNote(vault, save, Date.now()) : 'unreachable';
  const now = (await readOut()).filter((w) => !sameNote(w, save));
  await writeOut(r === 'saved' || r === 'same' ? now : [...now, { ...save, at: Date.now(), changed: r === 'changed' }]);
  return r;
}

/** lets go of words waiting for these verses (the person chose the vault's note) */
export async function dropWaiting(key: string, verses: number[]) {
  await writeOut((await readOut()).filter((w) => !sameNote(w, { key, verses })));
}

let sending = false;
/** tries every waiting note again. One the vault has by now, or that lands, is let go; one changed in Obsidian waits */
export async function sendWaiting() {
  const vault = io();
  if (!vault || sending || !state.on) return;
  sending = true;
  try {
    const out = await readOut();
    const keep: ScrWaiting[] = [];
    for (const w of out) {
      const r = await saveScrNote(vault, w, w.at);
      if (r === 'unreachable') {
        keep.push(w);
        keep.push(...out.slice(out.indexOf(w) + 1));
        break;
      }
      if (r === 'changed') keep.push({ ...w, changed: true });
    }
    /* a note saved while this ran is kept too */
    const later = (await readOut()).filter((w) => !out.some((o) => sameNote(o, w) && o.at === w.at));
    await writeOut([...keep.filter((k) => !later.some((l) => sameNote(l, k))), ...later]);
  } finally {
    sending = false;
  }
}

/** "Delete everything": the notes still waiting on this phone go, and the vault is let go. The notes in the vault stay */
export async function forgetScripture() {
  await AsyncStorage.removeItem(SCR_OUT_KEY).catch(() => undefined);
  await stopVault();
  set({ waiting: 0 });
}

/** the chapter the person last opened, kept with the library's key */
export async function lastRead(): Promise<string | null> {
  try {
    const o = JSON.parse((await AsyncStorage.getItem(KEY)) || 'null');
    return o && typeof o.last === 'string' ? o.last : null;
  } catch {
    return null;
  }
}
export async function setLastRead(key: string) {
  try {
    const o = JSON.parse((await AsyncStorage.getItem(KEY)) || 'null');
    if (o) await AsyncStorage.setItem(KEY, JSON.stringify({ ...o, last: key }));
  } catch {
    /* only a nicety */
  }
}
