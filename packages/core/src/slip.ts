/* After a slip: the comeback (log.tsx, from "I slipped", SOS and the pause). Rebuilt from the ground up on October 25,
   2026, from the research (docs/plan.md, "Logging a slip"). One goal: the person comes back stronger, and less likely to
   slip again. One tap a page, and every page can be closed (each answer is saved as it is given):
   1. Rekindle, the hold: "I already blew it" is answered first, with the person's own record (what is still theirs).
      Feeling like giving up after a first slip was the one reaction that predicted a faster second one (Shiffman and
      others 1996), and lower confidence after a slip predicts the next one (Gwaltney and others 2005).
   2. Before it happened: the four colors, the field of feelings, then the word, with what that feeling was asking for
      and what the habit gave it instead (lesson 8: the habit as an exit from a feeling; Baker and others 2004, Brand and
      others 2019). Precise words protect: people better at telling their feelings apart had lower daily odds of a
      lapse (Anand and others 2017). The person's own pattern is shown back as soon as there is one.
   3. And now: how it feels a few minutes later, answered kindly and truly. Noticing what it really gave lowers its pull
      next time (Brewer and others 2011; Taylor and others 2021); shame predicts relapse, and kindness after a failure
      makes people try harder (Randles and Tracy 2013; Breines and Chen 2012).
   4. Next time: one if-then plan from the feeling ("When I feel lonely late at night, I will text someone."), read back
      once, and asked about the next morning (Gollwitzer and Sheeran 2006, d = 0.65). It is saved as an after-slip
      talk-through (talk.ts, pr 1, with the feeling word as fw), so Today and the look back work as they always have.
   The feeling before (fb) and after (fa) are kept on the slip itself (normEvent), on the device like the rest of the log. */
import { eventsOf } from './legacy/core.js';
import { FEELINGS, feelFam, type FeelFam } from './feelings';
import { RK_FEELS, type RkFeel } from './rekindle-learn';
import type { TalkHeld, TalkMove, TalkNeed } from './talk';
import type { Clock, DayEvent, DayKey, Days } from './types';

/** where a feeling word sits in the field (FEELINGS), or null for a word that is not one */
export function feelPos(w: string | null | undefined): { r: number; c: number } | null {
  if (!w) return null;
  for (let r = 0; r < FEELINGS.length; r++) {
    const c = FEELINGS[r].findIndex((f) => f.w === w);
    if (c >= 0) return { r, c };
  }
  return null;
}

/** the family of a feeling word, or null for a word that is not one */
export function famOfWord(w: string | null | undefined): FeelFam | null {
  const p = feelPos(w);
  return p ? feelFam(p.r, p.c) : null;
}

/** what the feeling before a slip was asking for, and what the habit gave it instead (like every care screen, these
    never name it): a heading and one or two lines. Said after the fact, so it is about the action, never the person. */
export const SLIP_ASKS: Record<FeelFam, { h: string; t: string }> = {
  lonely: {
    h: 'Lonely is asking for people.',
    t: 'The habit gave the look of closeness for a few minutes, and the ache came back. What you were reaching for is real, and a person can answer it.',
  },
  shame: {
    h: 'Shame asks you to hide.',
    t: 'The habit gave a few minutes of not feeling it, and left more of it after. What helps is the opposite of hiding: kindness, and one honest word to someone.',
  },
  anger: {
    h: 'Anger wants a way out.',
    t: 'The habit looked like a release, and the anger was still there after. Your body is a faster way to spend it.',
  },
  fear: {
    h: 'Stress was looking for an off switch.',
    t: 'The habit switched it off for minutes, then the worry came back with one more thing on top. A walk or a long breath out is an off switch that leaves nothing behind.',
  },
  bored: {
    h: 'Boredom is asking for something real.',
    t: 'The habit is the easiest answer to boredom, not one that fixes it. Something to move, make or see does.',
  },
  tired: {
    h: 'Tired is asking for rest.',
    t: 'A tired brain loses fights a rested one wins. That is not weakness: everyone is weaker at this hour. Rest is the plan.',
  },
  low: {
    h: 'A low mood is asking for comfort.',
    t: 'The habit is a short loan: the mood comes back lower. Something small and real lifts it more: a person, a walk, some light.',
  },
  bright: {
    h: 'Good energy wanted somewhere to go.',
    t: 'Even a good mood can tip into an urge. Give the energy a place you will be glad of tomorrow.',
  },
  calm: {
    h: 'It came even on a calm day.',
    t: 'That is worth knowing: it was the habit talking, not a need. A habit fades each time it is not fed.',
  },
};

/** each family by name, for the pattern line ("Stress or worry came before 3 of your last 4 slips.") */
const FAM_NAME: Record<FeelFam, string> = {
  lonely: 'Feeling lonely or hurt',
  shame: 'Shame or guilt',
  anger: 'Anger',
  fear: 'Stress or worry',
  bored: 'Boredom',
  tired: 'Being tired',
  low: 'A low mood',
  bright: 'High energy',
  calm: 'A calm mood',
};

/** the need a family is, in talk-through terms (the plan's n, read by the needs pattern) */
export const SLIP_NEED: Record<FeelFam, TalkNeed> = {
  lonely: 'close',
  shame: 'escape',
  anger: 'relief',
  fear: 'relief',
  bored: 'bored',
  tired: 'rest',
  low: 'escape',
  bright: 'reward',
  calm: 'bored',
};

/** the moves that meet each family's need, best first */
const FAM_MOVES: Record<FeelFam, TalkMove[]> = {
  lonely: ['text', 'call', 'people'],
  shame: ['text', 'write', 'walk'],
  anger: ['walk', 'shower', 'write'],
  fear: ['breathe', 'walk', 'write'],
  bored: ['fill', 'out', 'hands'],
  tired: ['bed', 'nap', 'shower'],
  low: ['people', 'walk', 'shower'],
  bright: ['out', 'hands', 'laugh'],
  calm: ['fill', 'walk', 'out'],
};

/* late at night, the moves that mean going out become ones that work at home at that hour */
const NIGHT_SWAP: Partial<Record<TalkMove, TalkMove>> = { people: 'text', out: 'show', walk: 'shower', fill: 'hands' };
/** the moves offered for the plan: the family's three (late at night, the ones that mean going out swap for ones that
    work at home, and early bed takes the last place when it is not there), then the device out of reach. Moves whose
    plan held before come first, the most held first (talkHeld). */
export function slipMoves(fam: FeelFam, night: boolean, held: TalkHeld = {}): TalkMove[] {
  let base = FAM_MOVES[fam].slice();
  if (night) {
    base = [...new Set(base.map((m) => NIGHT_SWAP[m] || m))];
    if (base.indexOf('bed') < 0) base = base.slice(0, 2).concat('bed');
  }
  const all = base.concat('away');
  const h = (m: TalkMove) => held[m]?.held || 0;
  return all.slice().sort((a, b) => h(b) - h(a) || all.indexOf(a) - all.indexOf(b));
}

/** when a slip was, as the plan's moment: late at night (9 PM to 5 AM) or in the evening (5 PM to 9 PM); other hours,
    and no time, leave the moment out ("When I feel lonely, I will ...") */
export function slipMoment(time: Clock | null | undefined): 'late' | 'evening' | null {
  const h = time ? Number(time.slice(0, 2)) : NaN;
  if (!Number.isFinite(h)) return null;
  if (h >= 21 || h < 5) return 'late';
  return h >= 17 ? 'evening' : null;
}

/** the slips in the log, oldest first, other than this one */
function slipsBut(days: Days, id: string | null): DayEvent[] {
  return (eventsOf(days) as (DayEvent & { key: DayKey })[])
    .filter((e) => e.outcome === 'slipped' && e.id !== id)
    .sort((a, b) => (a.key + (a.time || '')).localeCompare(b.key + (b.time || '')));
}

/** the person's own pattern for the feeling before: "Stress or worry came before 3 of your last 4 slips." Counted over
    the last six slips with a feeling named (this one too), once two or more have one; until then, how naming builds it. */
export function slipBeforeLine(days: Days, id: string | null, fam: FeelFam): string {
  const named = slipsBut(days, id)
    .filter((e) => famOfWord(e.fb))
    .slice(-5);
  if (!named.length) return 'Name it each time, and your log shows which feeling you are getting away from.';
  const m = named.length + 1;
  const n = named.filter((e) => famOfWord(e.fb) === fam).length + 1;
  if (n === 1) return 'This is new: your last ' + (m - 1 === 1 ? 'slip' : m - 1 + ' slips') + ' came after something else.';
  return FAM_NAME[fam] + ' came before ' + (n === m ? (m === 2 ? 'both' : 'each') + ' of your last ' + m + ' slips.' : n + ' of your last ' + m + ' slips.');
}

/** how each feeling afterwards reads in a sentence */
const NOW_WORDS: Record<RkFeel, string> = {
  shame: 'ashamed',
  giveup: 'like giving up',
  angry: 'angry at yourself',
  flat: 'flat or empty',
  pull: 'still pulled toward it',
  okay: 'okay',
};
/** the person's own record of how it felt afterwards: "After 3 of your last 4 slips, you felt flat or empty too." Only
    when it has happened before, and never for "okay". */
export function slipNowLine(days: Days, id: string | null, fa: RkFeel): string | null {
  if (fa === 'okay') return null;
  const named = slipsBut(days, id)
    .filter((e) => e.fa)
    .slice(-5);
  const n = named.filter((e) => e.fa === fa).length;
  if (!n) return null;
  const m = named.length + 1;
  return (
    'After ' +
    (n + 1 === m ? (m === 2 ? 'both' : 'each') + ' of your last ' + m + ' slips' : n + 1 + ' of your last ' + m + ' slips') +
    ', you felt ' +
    NOW_WORDS[fa] +
    '.'
  );
}

/** "And now?": the feelings afterwards (the same words as Rekindle's), each with its answer: a heading and a line. Kind
    and true: about the action, never the person, and with what the habit really left behind. */
export const SLIP_NOW = RK_FEELS;
export const SLIP_NOW_SAYS: Record<RkFeel, { h: string; t: string }> = {
  shame: {
    h: 'You did something. You are not something.',
    t: 'Shame says hide, and hiding is where the habit grows. Keep it about the action: it was one moment, and you are the whole climb.',
  },
  giveup: {
    h: '“I already blew it” is the thought to watch.',
    t: 'That exact thought is what turns one slip into many. One slip does not decide this. What you do in the next hour does.',
  },
  angry: {
    h: 'Be the coach, not the critic.',
    t: 'Being hard on yourself feels like taking it seriously. People who meet a slip with kindness try harder the next time, not less.',
  },
  flat: {
    h: 'This is what it leaves behind.',
    t: 'The relief was short, and this is the rest of it. Remember this feeling the next time the urge promises more. It passes faster than it says.',
  },
  pull: {
    h: 'The urge is not done. It will pass.',
    t: 'An urge is a wave, even now. You do not have to follow this one. SOS can ride it out with you.',
  },
  okay: {
    h: 'Good. Calm is the best time to learn.',
    t: 'You can look at this clearly now. One more tap turns it into a plan for next time.',
  },
};

/** words that ask for more than a plan: the feeling page shows the free line to talk to someone */
export const SLIP_HELP_WORDS = ['Despairing', 'Hopeless', 'Helpless'];
