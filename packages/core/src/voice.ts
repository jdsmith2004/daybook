/* The Listen voice (the owner, November 14, 2026: "the AI voice is terrible ... Kokoro or something like that?" and "do a chat with
   Kokoro because I think 11 Labs costs money"). A story card is read by a real recording, made ahead of time with Kokoro (Kokoro-82M,
   Apache-2.0) on a computer, never on the phone, and kept on the website under /voice/. The phone's own voice is the fallback, for a
   card with no recording yet or with no network.

   A recording is named by a hash of the voice and the exact words said, so a card whose words change gets a new recording and the
   old one is simply never asked for again. voice-lines.ts lists every card that can be read (each faith's voice and each habit's
   words), and the deploy records the ones that are missing (.github/workflows/deploy.yml, voice). Beside each recording sits its
   timing: where each word starts, so the word being said can be lit. Nothing about the person is in the name or the request. */
import { lfmt } from './lessons';
import type { Settings } from './types';

/** the Kokoro voices a person can choose between: af_heart first, the one Listen starts with, and a calm man's voice (the owner,
    November 14, 2026: "af_heart american woman is good ... the AM_Michael, calm American man was good as well") */
export const VOICES = [
  { id: 'af_heart', name: 'Heart' },
  { id: 'am_michael', name: 'Michael' },
] as const;
export type VoiceId = (typeof VOICES)[number]['id'];
/** the voice Listen starts with */
export const VOICE_ID: VoiceId = VOICES[0].id;
/** how fast the recordings are made (1 is Kokoro's own pace): a little slower, calm. The person's speed is set when it plays. */
export const VOICE_SPEED = 0.95;
/** where the recordings are kept, under the website */
export const VOICE_PATH = '/voice/';

/** what is said for a card: the heading, then the words as they read on the card (bold marks out, the person's own words in) */
export function voiceSaid(h: string, body: string | undefined, st: Settings | null): string {
  return (
    h +
    ' ' +
    (body
      ? lfmt(body, st)
          .map((x) => x.t)
          .join('')
      : '')
  );
}

/* cyrb53: a small, fast 53-bit string hash, the same on the phone and in the script (not for security: a name, nothing more) */
function cyrb53(s: string, seed = 0): number {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < s.length; i++) {
    const ch = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

/** the name of a card's recording: the voice and the exact words said */
export const voiceKey = (said: string, voice: string = VOICE_ID): string => voice + '-' + cyrb53(voice + ' ' + VOICE_SPEED + '\n' + said).toString(36);
/** a recording's address on the website: the sound (.m4a) and its timing (.json) */
export const voiceUrl = (site: string, key: string, ext: 'm4a' | 'json'): string => site + VOICE_PATH + key + '.' + ext;

/** a recording's timing, as kept beside it: how long it is, and where each word starts */
export interface VoiceTiming {
  /** the voice and the words it was made from, checked before it is used */
  key: string;
  /** length, in milliseconds */
  ms: number;
  /** pairs: [the place in what is said (a character index), when that word starts (milliseconds)], in order */
  w: number[];
}

/** where in what is said the voice is at this moment: the place of the last word that has started, or -1 before the first */
export function voiceAt(t: VoiceTiming, ms: number): number {
  let at = -1;
  for (let i = 0; i + 1 < t.w.length; i += 2) {
    if (t.w[i + 1] > ms) break;
    at = t.w[i];
  }
  return at;
}
