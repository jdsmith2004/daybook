/* Every card Listen can read aloud, for scripts/voice.ts to record (voice.ts has the rest of Listen). It reads the lessons' text,
   so it sits with it (lesson-content.ts), apart from the rules the app loads first. */
import { cardArt, lessonAs, lessonBeats } from './lesson-beats';
import type { Habit } from './habit';
import type { FaithVoice } from './faith';
import { lessonById, type Lesson } from './lessons';
import { STORIES } from './lesson-stories';
import { VOICE_ID, voiceKey, voiceSaid } from './voice';

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
