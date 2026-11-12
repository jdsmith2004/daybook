/* A voice note to myself for hard moments, on iOS and Android: one short recording, kept only on this phone. It is not in
   backups, and sync never sends it. "Delete everything" removes it. The web has no voice note (voice.web.ts). */
import { File, Paths } from 'expo-file-system';
import { useSyncExternalStore } from 'react';

export const voiceOk = true;
/** the longest note, in seconds */
export const VOICE_MAX = 60;

const NAME = 'from-me.m4a';
const file = () => new File(Paths.document, NAME);

/* a new recording gets a new version, so a player made for the old one starts again */
let ver = 0;
const subs = new Set<() => void>();
const changed = () => {
  ver++;
  subs.forEach((f) => f());
};

function current(): string | null {
  try {
    const f = file();
    return f.exists ? f.uri : null;
  } catch {
    return null;
  }
}

/** the note on this phone, if there is one: its address, and a version that changes when it is recorded again */
export function useVoice(): { uri: string | null; v: number } {
  const v = useSyncExternalStore(
    (f) => {
      subs.add(f);
      return () => void subs.delete(f);
    },
    () => ver,
  );
  return { uri: current(), v };
}

/** keep a new recording (from the recorder's cache) as the note, in place of the old one. The new one is moved in beside
    the old one first, so if that fails the old note is still there. */
export async function keepVoice(tmp: string) {
  const f = file();
  const next = new File(Paths.document, 'from-me-new.m4a');
  if (next.exists) next.delete();
  await new File(tmp).move(next);
  if (f.exists) f.delete();
  await next.move(f);
  changed();
}

/* ---------- Future you (core future.ts): one recording per note, named by its id, on this phone only ---------- */
const noteFile = (id: string) => new File(Paths.document, 'future-' + id.replace(/[^a-z0-9-]/g, '') + '.m4a');

/** where a note's recording is, or null when the file is gone */
export function noteUri(id: string): string | null {
  try {
    const f = noteFile(id);
    return f.exists ? f.uri : null;
  } catch {
    return null;
  }
}

/** keep a new recording (from the recorder's cache) as this note's file */
export async function keepNoteFile(tmp: string, id: string) {
  const f = noteFile(id);
  if (f.exists) f.delete();
  await new File(tmp).move(f);
}

export function dropNoteFile(id: string) {
  try {
    const f = noteFile(id);
    if (f.exists) f.delete();
  } catch {
    /* nothing to remove */
  }
}

/** the voice note from before Future you (My plan's one recording) becomes a note: its file moves to the note's name. Its
    time is when it was last written, so it sorts where it belongs. Null when there is none. */
export async function takeOldVoice(id: string): Promise<{ at: number } | null> {
  try {
    const f = file();
    if (!f.exists) return null;
    let at = Date.now();
    try {
      const t = f.info().modificationTime;
      if (typeof t === 'number' && t > 0) at = t;
    } catch {
      /* no time: now will do */
    }
    await f.move(noteFile(id));
    changed();
    return { at };
  } catch {
    return null;
  }
}

export function dropVoice() {
  try {
    const f = file();
    if (f.exists) f.delete();
  } catch {
    /* nothing to remove */
  }
  changed();
}
