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
  steps: FieldStep[];
  /** the words for each kind of step this pattern has */
  words: Partial<Record<FieldKind, string>>;
  by: Partial<Record<FieldKind, FieldBy>>;
};

/** seconds to settle before the first breath */
export const FIELD_SETTLE = 5;
export const FIELD_SETTLE_WORDS = 'Get settled';

export const FIELD_PATTERNS = {
  sigh: {
    name: 'Sigh',
    steps: [
      ['in1', 3],
      ['in2', 1.5],
      ['out', 7.5],
    ],
    words: { in1: 'Breathe in', in2: 'A little more', out: 'Let it out slowly' },
    by: { in1: 'nose', in2: 'nose', out: 'mouth' },
  },
} satisfies Record<string, FieldPattern>;

export type FieldId = keyof typeof FIELD_PATTERNS;

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
