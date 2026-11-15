/* A lesson card's recording for Listen (core voice.ts), on iOS and Android: fetched from the website the first time a card is heard,
   then kept in the phone's cache folder, so a card heard once plays again with no network. The request is an ordinary file request
   named by a hash of the words: no install id, no account, nothing about the person (privacy.html says so). The web version is
   voice-clip.web.ts. */
import { SITE_URL, voiceUrl, type VoiceTiming } from '@daybook/core';
import { Directory, File, Paths } from 'expo-file-system';

export interface Clip {
  uri: string;
  timing: VoiceTiming;
}

const dir = () => new Directory(Paths.cache, 'voice');
/* a download that has not come in this soon is given up, and the phone's own voice reads the card instead */
const WAIT = 6000;

const within = <V>(p: Promise<V>, ms: number) => Promise.race([p, new Promise<never>((_, no) => setTimeout(() => no(new Error('slow')), ms))]);

function kept(key: string): Clip | null {
  try {
    const a = new File(dir(), key + '.m4a');
    const j = new File(dir(), key + '.json');
    if (!a.exists || !j.exists || !a.size) return null;
    const timing = JSON.parse(j.textSync()) as VoiceTiming;
    return timing.key === key ? { uri: a.uri, timing } : null;
  } catch {
    return null;
  }
}

/** the recording of a card, from the cache or the website, or null when there is none to be had */
export async function getClip(key: string): Promise<Clip | null> {
  const have = kept(key);
  if (have) return have;
  try {
    const d = dir();
    if (!d.exists) d.create({ intermediates: true, idempotent: true });
    const res = await within(fetch(voiceUrl(SITE_URL, key, 'json')), WAIT);
    if (!res.ok) return null;
    const timing = (await res.json()) as VoiceTiming;
    if (timing.key !== key || !Array.isArray(timing.w)) return null;
    /* the sound first, under a passing name, so a download cut off halfway is never taken for a whole one */
    const part = new File(d, key + '.part');
    if (part.exists) part.delete();
    await within(File.downloadFileAsync(voiceUrl(SITE_URL, key, 'm4a'), part), WAIT * 2);
    const a = new File(d, key + '.m4a');
    if (a.exists) a.delete();
    part.move(a);
    const j = new File(d, key + '.json');
    if (j.exists) j.delete();
    j.create();
    j.write(JSON.stringify(timing));
    return { uri: a.uri, timing };
  } catch {
    return null;
  }
}
