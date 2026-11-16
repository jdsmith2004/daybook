/* A lesson card's recording for Listen (core voice.ts), on the web: the recordings sit beside the app on the same site, under /voice/,
   and their names never change, so the browser keeps them. The request is an ordinary file request named by a hash of the words: no
   install id, no account, nothing about the person (privacy.html says so). The phone version is voice-clip.ts. */
import { voiceUrl, type VoiceTiming } from '@daybook/core';

export interface Clip {
  uri: string;
  timing: VoiceTiming;
}

const WAIT = 6000;

async function fetchClip(key: string): Promise<Clip | null> {
  const ctl = new AbortController();
  const id = setTimeout(() => ctl.abort(), WAIT);
  try {
    const res = await fetch(voiceUrl('', key, 'json'), { signal: ctl.signal });
    if (!res.ok || !/json/.test(res.headers.get('content-type') || '')) return null;
    const timing = (await res.json()) as VoiceTiming;
    if (timing.key !== key || !Array.isArray(timing.w)) return null;
    return { uri: voiceUrl('', key, 'm4a'), timing };
  } finally {
    clearTimeout(id);
  }
}

const got = new Map<string, Promise<Clip | null>>();

/** the recording of a card, from this site, or null when there is none to be had; a failed answer is asked once more */
export function getClip(key: string): Promise<Clip | null> {
  const was = got.get(key);
  if (was) return was;
  const p = (async () => {
    for (let n = 0; n < 2; n++) {
      try {
        const c = await fetchClip(key);
        if (c) return c;
      } catch {
        /* tried again below */
      }
    }
    return null;
  })().then((c) => {
    /* a card with no recording is asked again next time; one found is kept for the visit */
    if (!c) got.delete(key);
    return c;
  });
  got.set(key, p);
  return p;
}

/** a recording that would not play: asked of the site afresh next time */
export function forgetClip(key: string) {
  got.delete(key);
}
