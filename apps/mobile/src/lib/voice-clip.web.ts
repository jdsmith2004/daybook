/* A lesson card's recording for Listen (core voice.ts), on the web: the recordings sit beside the app on the same site, under /voice/,
   and their names never change, so the browser keeps them. The request is an ordinary file request named by a hash of the words: no
   install id, no account, nothing about the person (privacy.html says so). The phone version is voice-clip.ts. */
import { voiceUrl, type VoiceTiming } from '@daybook/core';

export interface Clip {
  uri: string;
  timing: VoiceTiming;
}

const WAIT = 6000;

/** the recording of a card, from this site, or null when there is none to be had */
export async function getClip(key: string): Promise<Clip | null> {
  try {
    const ctl = new AbortController();
    const id = setTimeout(() => ctl.abort(), WAIT);
    const res = await fetch(voiceUrl('', key, 'json'), { signal: ctl.signal });
    clearTimeout(id);
    if (!res.ok || !/json/.test(res.headers.get('content-type') || '')) return null;
    const timing = (await res.json()) as VoiceTiming;
    if (timing.key !== key || !Array.isArray(timing.w)) return null;
    return { uri: voiceUrl('', key, 'm4a'), timing };
  } catch {
    return null;
  }
}
