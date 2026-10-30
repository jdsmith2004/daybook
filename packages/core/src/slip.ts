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
import { addDays, clockOf, eventsOf } from './legacy/core.js';
import { FEEL_TRIG, FEELINGS, feelFam, type FeelFam } from './feelings';
import { RK_FEELS, type RkFeel } from './rekindle-learn';
import { TALK_WHEN, type TalkHeld, type TalkMove, type TalkNeed, type TalkWhen } from './talk';
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

/** the situation just before a slip, as the plan's "when" (talk.ts TALK_WHEN): the slip's trigger when it is one of
    the built-in ones, or the urge itself (Not sure, Other, an answer of the person's own, or none) */
export function slipWhen(trigger: string | null | undefined): TalkWhen {
  return trigger && Object.prototype.hasOwnProperty.call(TALK_WHEN, trigger) ? (trigger as TalkWhen) : 'urge';
}

/** the need each situation is, in talk-through terms (the plan's n, read by the needs pattern) */
export const SLIP_NEED: Record<TalkWhen, TalkNeed> = {
  late: 'rest',
  lonely: 'close',
  bored: 'bored',
  stress: 'relief',
  tired: 'rest',
  scroll: 'bored',
  urge: 'relief',
};

/** the moves that fit each situation, best first: four each */
const WHEN_MOVES: Record<TalkWhen, TalkMove[]> = {
  /* the phone in bed is the situation itself: put it somewhere else */
  late: ['away', 'bed', 'shower', 'breathe'],
  /* people, in the plainest ways to reach them */
  lonely: ['text', 'call', 'people', 'kind'],
  /* something real to do */
  bored: ['fill', 'hands', 'out', 'move'],
  /* turn the alarm down, then get it out of the head */
  stress: ['walk', 'breathe', 'shower', 'write'],
  /* rest */
  tired: ['bed', 'nap', 'away', 'shower'],
  /* the screen is the slope: step off it */
  scroll: ['away', 'out', 'hands', 'move'],
  /* the urge came on its own: distance, and a change of state */
  urge: ['away', 'walk', 'shower', 'text'],
};

/* late at night, the moves that mean going out become ones that work at home at that hour */
const NIGHT_SWAP: Partial<Record<TalkMove, TalkMove>> = { people: 'text', out: 'show', walk: 'shower', fill: 'hands', light: 'kind' };
/** the moves offered for the plan: the situation's four (late at night, the ones that mean going out swap for ones that
    work at home, and early bed takes the last place when it is not there), then the device out of reach when it is not
    there yet. Moves whose plan held before come first, the most held first (talkHeld). The plan page adds the person's
    own words after them. */
export function slipMoves(when: TalkWhen, night: boolean, held: TalkHeld = {}): TalkMove[] {
  let base = WHEN_MOVES[when].slice();
  if (night) {
    base = [...new Set(base.map((m) => NIGHT_SWAP[m] || m))];
    if (base.indexOf('bed') < 0) base = base.slice(0, 3).concat('bed');
  }
  const all = [...new Set(base.concat('away'))];
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

/** the feelings afterwards that say what the habit really left behind */
const HEAVY: RkFeel[] = ['flat', 'shame', 'giveup'];
const HEAVY_SHORT: Partial<Record<RkFeel, string>> = { flat: 'flat', shame: 'ashamed', giveup: 'like giving up' };
/** how it felt after the last slips, for the next urge (SOS, the hour after): "After 3 of your last 4 slips, you felt flat
    or empty." Seeing what it really gave, in the person's own record, lowers its pull (reward re-valuation; Brewer and
    others 2011). Only with at least 2 of the last 5 slips with how it felt recorded (fa), and when most of those were flat,
    ashamed or like giving up; null otherwise. */
export function slipFeltLine(days: Days): string | null {
  const named = slipsBut(days, null)
    .filter((e) => e.fa)
    .slice(-5);
  if (named.length < 2) return null;
  const c: Partial<Record<RkFeel, number>> = {};
  for (const e of named) if (HEAVY.indexOf(e.fa as RkFeel) >= 0) c[e.fa as RkFeel] = (c[e.fa as RkFeel] || 0) + 1;
  const n = HEAVY.reduce((a, f) => a + (c[f] || 0), 0);
  if (n * 2 <= named.length) return null;
  const fs = HEAVY.filter((f) => c[f]).sort((a, b) => c[b]! - c[a]! || HEAVY.indexOf(a) - HEAVY.indexOf(b));
  const words =
    fs.length === 1
      ? NOW_WORDS[fs[0]]
      : fs
          .map((f) => HEAVY_SHORT[f])
          .join(', ')
          .replace(/, ([^,]*)$/, ' or $1');
  const m = named.length;
  return 'After ' + (n === m ? (m === 2 ? 'both' : 'each') : n) + ' of your last ' + m + ' slips, you felt ' + words + '.';
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

/** the trigger a feeling named before an urge or a slip points to, only when it plainly is one: lonely, bored and tired, and
    fear or anger as stress. Shame and a low mood point to no trigger (feeling ashamed is not being stressed), so a slip's
    trigger is never set to something the person did not say. */
const TRIG_FAMS: FeelFam[] = ['lonely', 'bored', 'tired', 'fear', 'anger'];
export function feelTrigOf(fam: FeelFam | null | undefined): string | null {
  return fam && TRIG_FAMS.indexOf(fam) >= 0 ? FEEL_TRIG[fam] : null;
}

/** the slip a look back on an eyes-open go-ahead (Talk it through) points to: the first slip logged from the talk-through's
    moment on, from its day k to tk, as talk-log.ts lookBack finds it (it writes one when none was logged). null when there
    is none. */
export function slipAfterTalk(days: Days, k: DayKey, t: number, tk: DayKey): { k: DayKey; id: string } | null {
  const since = clockOf(t);
  for (let d = k, n = 0; d <= tk && n < 9; d = addDays(d, 1), n++) {
    const e = (days[d]?.events || []).find((x) => x.outcome === 'slipped' && (d !== k || !x.time || x.time >= since));
    if (e) return { k: d, id: e.id };
  }
  return null;
}

/* ---------- the second slip in a week gets the most care ----------
   The reaction to a first lapse did not predict relapse; falling confidence after repeated lapses did (Kirchner, Shiffman
   and Wileyto 2012, about 1,000 real-time lapses). So a slip with another one in the 7 days up to it names that, plainly,
   and the comeback opens a door to a person: the safe person's text, and the lesson on what therapy is like. */
/** the days a slip looks back over, its own day included */
export const SLIP_WEEK = 7;
/** the lesson the plan page offers, by its id (it opens in full from there, with no account asked: lesson page, at=care) */
export const SLIP_THERAPY_LESSON = 'l24';
/** the words ready to send to the safe person: nothing about what it is, and nothing asked but to talk */
export const SLIP_SAFE_TEXT = 'This week has been a hard one, and I could use someone in my corner. Can we talk?';
/** what names it, when this slip is not the only one in its week: the slips counted (this one too) and the line. null for a
    first slip, or for one that is not in the log. */
export function slipRepeat(days: Days, date: DayKey, id: string | null | undefined): { n: number; line: string } | null {
  if (!id || !(days[date]?.events || []).some((e) => e.id === id && e.outcome === 'slipped')) return null;
  const from = addDays(date, 1 - SLIP_WEEK);
  const n = (eventsOf(days) as (DayEvent & { key: DayKey })[]).filter((e) => e.outcome === 'slipped' && e.key >= from && e.key <= date).length;
  if (n < 2) return null;
  return { n, line: (n === 2 ? 'Two in a week' : 'A week like this') + ' is where most people give up. You are still here.' };
}
