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

/** keep a new recording (from the recorder's cache) as the note, in place of the old one */
export async function keepVoice(tmp: string) {
  const f = file();
  if (f.exists) f.delete();
  await new File(tmp).move(f);
  changed();
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
