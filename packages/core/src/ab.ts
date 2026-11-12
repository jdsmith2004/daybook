/* Word tests (#24 in docs/plan.md): two wordings of one line, each phone always shown the same one, picked from its anonymous
   install id (core events.ts), never from anything about the person. A phone with no install id (What Daybook learns is off,
   or the build sends nothing) always sees arm a, the wording the app had before, and nothing is said about it.

   The phone says which arm it was shown with the event "ab" (test, arm), once each time the line is shown. The Stats report
   (scripts/stats-events.mjs) reads what came after it, and calls a winner only once each arm rests on AB_MIN people.

   A new test: add it to AB_TESTS with its two wordings, show it through abArm, and send "ab" where it is shown. The test's
   name goes on the privacy page with the event (the list of values is read from here). A finished test is taken off the list
   once its winner is the app's only wording; its old events stay readable. */

/** the arms: a is the wording the app had before, b the one being tried */
export const AB_ARMS = ['a', 'b'] as const;
export type AbArm = (typeof AB_ARMS)[number];

export const AB_TESTS = {
  /* Rekindle's first line, the heading before the hold (docs/plan.md, "Becoming free", step 2): the fire, or the person as
     unchanged by one slip. Judged by whether the person logs again (an urge, a slip or a check-in) within 24 and 72 hours.
     Only for someone who has ridden out an urge before, since b names how many times. */
  rk_first: { since: '2026-11-12', judged: 'logged again within 24 and 72 hours' },
} as const;
export type AbTest = keyof typeof AB_TESTS;
export const AB_TEST_IDS = Object.keys(AB_TESTS) as AbTest[];

/** people each arm needs before the report calls a winner */
export const AB_MIN = 30;

/** FNV-1a, 32 bits: the same arm for the same id and test on every phone and on the server */
function fnv(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

const ID = /^[0-9a-f]{32}$/;
/** the arm this install id is in for a test; null when there is no real id (then the app shows arm a and sends nothing) */
export function abArm(id: string | null | undefined, test: AbTest): AbArm | null {
  if (!id || !ID.test(id) || /^0+$/.test(id)) return null;
  return AB_ARMS[fnv(test + ':' + id) % AB_ARMS.length];
}

/* ---------- the tests' words ---------- */
/** Rekindle's first line before the hold, for a slip that was not stopped partway. rode: urges ridden out before this slip. */
export function rkFirstLine(arm: AbArm | null, rode: number): string {
  if (arm !== 'b' || rode < 1) return 'Your fire did not go out.';
  return rode === 1
    ? 'One slip. You are still someone who has ridden out an urge.'
    : 'One slip. You are still someone who rides out urges: ' + rode + ' times.';
}
/** whether a phone with this many urges ridden out is in the Rekindle test (b names the number, so it needs one) */
export const rkFirstInTest = (rode: number) => rode >= 1;
