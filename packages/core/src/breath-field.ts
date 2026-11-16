/* The breathing figure's timing (the app draws it: components/breath-field.tsx). A breath starts with a few seconds to
   settle, one small dot in the dark, and then the pattern runs round after round. The figure, its color and its words all
   read this one clock, so they never drift apart.

   The first pattern is the sigh ("cyclic sighing": a full breath in through the nose, a short second one on top, and a
   long slow breath out through the mouth). In a month-long randomized study it lifted mood and slowed breathing more than
   box breathing or mindfulness (Balban and others, 2023, Cell Reports Medicine), and it works within a breath or two. It runs
   slowly, twelve seconds a breath (the owner, November 15, 2026, of nine seconds: "it's too fast"). */

/** what a step does: breathe in, the first and second part of a double breath in, hold, breathe out */
export type FieldKind = 'in' | 'in1' | 'in2' | 'hold' | 'out';
/** a step and how many seconds it takes */
export type FieldStep = [FieldKind, number];
/** the way the air goes in a step, for the small picture under the words */
export type FieldBy = 'nose' | 'mouth' | null;

export type FieldPattern = {
  name: string;
  /** the pattern in a few plain words, for the switch */
  desc: string;
  steps: FieldStep[];
  /** the words for each kind of step this pattern has */
  words: Partial<Record<FieldKind, string>>;
  by: Partial<Record<FieldKind, FieldBy>>;
};

/** seconds to settle before the first breath */
export const FIELD_SETTLE = 5;
export const FIELD_SETTLE_WORDS = 'Get settled';
/** how many breaths a turn in SOS is */
export const FIELD_BREATHS = 3;

/* The patterns, the best first (the owner, November 15, 2026: "the first one should obviously be the best one").
   - sigh: the strongest evidence for calming fast (above).
   - long: a breath out longer than the breath in, the pattern with the most heart-rate evidence, and what SOS did before.
   - box: steady and countable; soldiers and first responders use it.
   - four: 4-7-8, a long hold and a longer breath out; popular at night. */
export const FIELD_PATTERNS = {
  sigh: {
    name: 'The sigh',
    desc: 'In, a little more, and a long breath out',
    steps: [
      ['in1', 3],
      ['in2', 1.5],
      ['out', 7.5],
    ],
    words: { in1: 'Breathe in', in2: 'A little more', out: 'Let it out slowly' },
    by: { in1: 'nose', in2: 'nose', out: 'mouth' },
  },
  long: {
    name: 'Long breath out',
    desc: 'In for 4, out for 6',
    steps: [
      ['in', 4],
      ['out', 6],
    ],
    words: { in: 'Breathe in', out: 'Breathe out slowly' },
    by: { in: 'nose', out: 'mouth' },
  },
  box: {
    name: 'Box',
    desc: 'In 4, hold 4, out 4, hold 4',
    steps: [
      ['in', 4],
      ['hold', 4],
      ['out', 4],
      ['hold', 4],
    ],
    words: { in: 'Breathe in', hold: 'Hold', out: 'Breathe out' },
    by: { in: 'nose', out: 'mouth' },
  },
  four: {
    name: '4-7-8',
    desc: 'In 4, hold 7, out 8',
    steps: [
      ['in', 4],
      ['hold', 7],
      ['out', 8],
    ],
    words: { in: 'Breathe in', hold: 'Hold', out: 'Let it all out' },
    by: { in: 'nose', out: 'mouth' },
  },
} satisfies Record<string, FieldPattern>;

export type FieldId = keyof typeof FIELD_PATTERNS;
/** the order the switch goes through them */
export const FIELD_ORDER: FieldId[] = ['sigh', 'long', 'box', 'four'];
export const FIELD_FIRST: FieldId = 'sigh';
/** a saved choice, made safe: anything unknown is the first pattern */
export const fieldId = (x: unknown): FieldId => (FIELD_ORDER.includes(x as FieldId) ? (x as FieldId) : FIELD_FIRST);
/** the pattern after this one, round and round */
export const fieldNext = (id: FieldId): FieldId => FIELD_ORDER[(FIELD_ORDER.indexOf(id) + 1) % FIELD_ORDER.length];

/** seconds in one round of a pattern */
export const fieldRound = (id: FieldId) => FIELD_PATTERNS[id].steps.reduce((a, s) => a + s[1], 0);

export type FieldNow = {
  /** still settling, before the first breath */
  settle: boolean;
  /** which round (0 first), which step of it, and its kind */
  round: number;
  step: number;
  kind: FieldKind | null;
  /** seconds into this step, and how long it is */
  at: number;
  dur: number;
  words: string;
  by: FieldBy;
  /** whole breaths finished */
  done: number;
};

/** where a breath is, `sec` seconds after it started (the settle comes first, unless `settle` is 0) */
export function fieldAt(id: FieldId, sec: number, settle = FIELD_SETTLE): FieldNow {
  const p: FieldPattern = FIELD_PATTERNS[id];
  const t = Math.max(0, sec);
  if (t < settle) return { settle: true, round: 0, step: 0, kind: null, at: t, dur: settle, words: FIELD_SETTLE_WORDS, by: null, done: 0 };
  const total = fieldRound(id);
  const b = t - settle;
  const round = Math.floor(b / total);
  let x = b - round * total;
  for (let i = 0; i < p.steps.length; i++) {
    const [kind, dur] = p.steps[i];
    if (x < dur) return { settle: false, round, step: i, kind, at: x, dur, words: p.words[kind] || '', by: p.by[kind] ?? null, done: round };
    x -= dur;
  }
  const [kind, dur] = p.steps[0];
  return { settle: false, round: round + 1, step: 0, kind, at: 0, dur, words: p.words[kind] || '', by: p.by[kind] ?? null, done: round + 1 };
}
