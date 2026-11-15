/* The Listen voice (the owner, November 14, 2026: "the AI voice is terrible ... Kokoro or something like that?" and "do a chat with
   Kokoro because I think 11 Labs costs money"). A story card is read by a real recording, made ahead of time with Kokoro (Kokoro-82M,
   Apache-2.0) on a computer, never on the phone, and kept on the website under /voice/. The phone's own voice is the fallback, for a
   card with no recording yet or with no network.

   A recording is named by a hash of the voice and the exact words said, so a card whose words change gets a new recording and the
   old one is simply never asked for again. scripts/voice.ts lists every card that can be read (each faith's voice and each habit's
   words), and the deploy records the ones that are missing (.github/workflows/deploy.yml, voice). Beside each recording sits its
   timing: where each word starts, so the word being said can be lit. Nothing about the person is in the name or the request. */
import { cardArt, lessonAs, lessonBeats } from './lesson-beats';
import type { Habit } from './habit';
import type { FaithVoice } from './faith';
import { lessonById, lfmt, type Lesson } from './lessons';
import { STORIES } from './lesson-stories';
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

/** whether the lesson screen reads this card aloud: a story card with its own picture (apps/mobile lesson/[id].tsx TextCard) */
const spoken = (L: Lesson, ci: number): boolean => {
  const card = L.cards[ci];
  if (!L.form || card.k !== 'text' || card.e === 'move') return false;
  const art = cardArt(card);
  if (!art || art[0] === 'try') return false;
  return !(card.b || []).some((x) => x[0] === 'mylog' || x[0] === 'plan' || x[0] === 'words' || x[0] === 'mine');
};

/** a card to record: its name, what is said, where its heading ends, and which lesson and card it is */
export interface VoiceLine {
  key: string;
  said: string;
  h: number;
  where: string;
}
/** every card that can be read aloud, in every voice a lesson speaks in and every habit's words, for one Kokoro voice: what
    scripts/voice.ts records */
export function voiceLines(voice: string = VOICE_ID): VoiceLine[] {
  const out = new Map<string, VoiceLine>();
  const faiths: (FaithVoice | null)[] = [null, 'lds', 'christian', 'plain'];
  const habits: Habit[] = ['porn', 'alcohol', 'gambling', 'other'];
  for (const id of Object.keys(STORIES)) {
    const L0 = lessonById(id);
    if (!L0) continue;
    for (const v of faiths)
      for (const hb of habits) {
        const L = lessonAs(L0, v, hb);
        const beats = lessonBeats(L);
        L.cards.forEach((card, ci) => {
          if (!spoken(L, ci)) return;
          const b = beats?.cards[ci] || {};
          const h = b.h || card.h;
          /* Short and Long read the short words, Deep the card told in full */
          for (const body of b.dx ? [b.p, b.dx] : [b.p]) {
            const said = voiceSaid(h, body, null);
            const key = voiceKey(said, voice);
            if (!out.has(key)) out.set(key, { key, said, h: h.length, where: id + ' card ' + (ci + 1) + (v ? ' ' + v : '') + (hb !== 'porn' ? ' ' + hb : '') });
          }
        });
      }
  }
  return [...out.values()];
}
