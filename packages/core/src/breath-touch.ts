/* The breath by touch: where the phone taps through each step of a breathing pattern, so a person can follow it with their
   eyes closed. A breath in is a soft rising run of taps that come a little closer and a little firmer as the lungs fill; a
   hold is still; a breath out starts with one firm tap, so the turn is plain, and then the taps fall away, wider apart and
   softer, as the breath empties. Taps are always well apart (never a buzz).

   This follows the research on touch-paced breathing (the Stanford PIV work on a strong, plain breath out; Apple Watch
   Breathe's taps through the breath; see docs/plan.md, "Haptics"). The exact spacing is our own design. */

/** how firm a tap is: 0 soft, 1 light, 2 firm */
export type TapLevel = 0 | 1 | 2;
/** one tap: milliseconds after its step starts, and how firm */
export type BreathTap = [number, TapLevel];

/** how full each kind of step leaves the breath (as in the app's breath curve): 1 full, 0 empty; a hold stays */
const FULL: Record<string, number> = { in: 1, in1: 0.75, in2: 1, out: 0 };
/** taps never come closer than this (closer feels like a buzz) */
export const TAP_GAP_MIN = 250;

const level = (v: number): TapLevel => (v >= 0.8 ? 2 : v >= 0.4 ? 1 : 0);

/** the taps for every step of a pattern (`[kind, seconds]` steps, like PATTERNS[k].ph), one list per step */
export function breathTouch(steps: [string, number][]): BreathTap[][] {
  let at = 0;
  return steps.map(([kind, dur]) => {
    const from = at;
    const to = kind in FULL ? FULL[kind] : at;
    at = to;
    const ms = dur * 1000;
    /* the last tap of a step comes at least a third of a second before the next step's first */
    const span = (f: number) => Math.min(ms * f, ms - 350);
    if (to > from) {
      /* filling: about three taps every two seconds, each gap a little shorter than the one before, ending before the turn */
      const n = Math.max(2, Math.round(dur * 1.5));
      return Array.from({ length: n }, (_, i): BreathTap => {
        const x = i / (n - 1);
        return [Math.round(span(0.83) * (1.2 * x - 0.2 * x * x)), level(from + (to - from) * x)];
      });
    }
    if (to < from) {
      /* emptying: a firm first tap, then fewer taps, each gap longer and each tap softer, fading out before the end */
      const n = Math.max(3, Math.round(dur * 0.85));
      return Array.from({ length: n }, (_, i): BreathTap => {
        const x = i / (n - 1);
        return [Math.round(span(0.9) * (0.6 * x + 0.4 * x * x)), level(from - (from - to) * x)];
      });
    }
    /* a hold: still */
    return [];
  });
}
