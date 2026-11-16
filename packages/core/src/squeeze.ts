/* Squeeze, the SOS move (ride.ts id 'move'): four parts of the body, each squeezed hard and held, then let go. The app draws
   it (components/squeeze-field.tsx); the figure, its words and its taps all read this one clock, so they never drift apart.

   Why: short bursts of hard muscle work lower cravings while they last (Ussher and others 2006 and 2009, isometric
   pressing against passive sitting; the review of acute exercise by Haasova and others, 2013). The letting go is the other
   half: tense for a few seconds and release for longer, the rhythm of progressive muscle relaxation (Bernstein and Borkovec),
   so the body notices the difference and the move ends calm, not wound up.

   The rhythm: a breath in to get ready, then for each part a hold of seven seconds (the last three counted out loud, so the end
   is never a surprise) and a release of eight. It goes from small to big and ends on the whole body, the biggest letting go.
   In a seat it is small enough that no one has to notice; on your feet it is bigger (a wall push, a low squat). The choice
   is kept on the phone (sos.ts moveSit) and shared with the Move tool. */

export type SqueezePart = {
  /** what to squeeze, big */
  head: string;
  /** how, small */
  sub: string;
};

/** seconds to get ready before the first squeeze */
export const SQZ_READY = 3;
/** seconds each squeeze is held */
export const SQZ_HOLD = 7;
/** seconds each letting go takes */
export const SQZ_REST = 8;
/** the last letting go is a little longer: the whole body settles */
export const SQZ_LAST_REST = 10;

export const SQZ_SIT: SqueezePart[] = [
  { head: 'Squeeze your fists', sub: 'As hard as you can.' },
  { head: 'Shoulders up to your ears', sub: 'Pull them up tight.' },
  { head: 'Press your feet down', sub: 'Into the floor. Tense your legs.' },
  { head: 'Everything at once', sub: 'Fists, arms, shoulders, legs. All of it.' },
];

export const SQZ_STAND: SqueezePart[] = [
  { head: 'Squeeze your fists', sub: 'Arms straight down. As hard as you can.' },
  { head: 'Push against a wall', sub: 'Hands flat. Push like you could move it.' },
  { head: 'Sink into a squat', sub: 'Halfway down. Hold it there.' },
  { head: 'Everything at once', sub: 'Stand tall and tense all of it.' },
];

export const sqzParts = (sit: boolean) => (sit ? SQZ_SIT : SQZ_STAND);

/** how long the whole move takes, in seconds */
export const SQZ_TOTAL = SQZ_READY + 4 * SQZ_HOLD + 3 * SQZ_REST + SQZ_LAST_REST;

export type SqueezeKind = 'ready' | 'hold' | 'rest' | 'done';
export type SqueezeNow = {
  kind: SqueezeKind;
  /** which part (0 to 3); 4 once done */
  i: number;
  /** seconds into this step */
  s: number;
  /** how long this step is */
  dur: number;
  /** the whole seconds left of a hold (7 to 1), else 0 */
  left: number;
  /** the words under the figure */
  words: string;
  /** seconds since the words last changed (they fade in) */
  ws: number;
};

/** where the move is at `t` seconds */
export function squeezeAt(t: number): SqueezeNow {
  'worklet';
  const x = Math.max(0, t);
  if (x < SQZ_READY) return { kind: 'ready', i: 0, s: x, dur: SQZ_READY, left: 0, words: 'Breathe in', ws: x };
  let at = SQZ_READY;
  for (let i = 0; i < 4; i++) {
    if (x < at + SQZ_HOLD) {
      const s = x - at;
      const left = Math.ceil(SQZ_HOLD - s);
      const w0 = left <= 3 ? SQZ_HOLD - left : s < 1.6 ? 0 : 1.6;
      return { kind: 'hold', i, s, dur: SQZ_HOLD, left, words: left <= 3 ? String(left) : s < 1.6 ? 'Squeeze' : 'Hold it', ws: s - w0 };
    }
    at += SQZ_HOLD;
    const rest = i === 3 ? SQZ_LAST_REST : SQZ_REST;
    if (x < at + rest) {
      const s = x - at;
      return {
        kind: 'rest',
        i,
        s,
        dur: rest,
        left: 0,
        words: s < 3 ? 'Let go' : i === 3 ? 'Feel it drain away' : 'Notice the difference',
        ws: s < 3 ? s : s - 3,
      };
    }
    at += rest;
  }
  return { kind: 'done', i: 4, s: x - at, dur: 0, left: 0, words: 'Feel it drain away', ws: x - at + SQZ_LAST_REST - 3 };
}
