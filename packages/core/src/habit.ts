/* What a person is quitting (the owner, November 8, 2026: "build it now, kept simple"). Setup asks it first; Settings can
   change it later. Porn stays the main habit and the default: someone who answered before this question existed, or skipped
   it, is quitting porn. Gambling and another habit get the same care tools, the same counting and the same flame; only the
   words change, and the lessons written for porn leave their path (lessons.ts PORN_ONLY). Lessons for other habits come later.
   Alcohol was added on November 9, 2026 (the owner), with its own words, a doctor line before stopping and its own help.

   Nothing is imported here, so legacy/core.js can read it too. */

export type Habit = 'porn' | 'alcohol' | 'gambling' | 'other';

/** the setup's question: [value, words, icon] */
export const OB_HABIT: [Habit, string, string][] = [
  ['porn', 'Porn', 'flame'],
  ['alcohol', 'Alcohol', 'glass'],
  ['gambling', 'Gambling', 'dice'],
  ['other', 'Another habit', 'leaf'],
];

/** a kept habit answer, when it is one of the four */
export const normHabit = (v: unknown): Habit | null => (OB_HABIT.some((x) => x[0] === v) ? (v as Habit) : null);

type WithOnb = { onb?: { a?: { habit?: unknown } } | null } | null | undefined;
/** the habit this person is quitting: porn unless they chose another */
export const habitOf = (st: WithOnb): Habit => normHabit(st && st.onb && st.onb.a && st.onb.a.habit) || 'porn';
/** the same, read from setup answers while setup is still open */
export const habitIn = (a: { habit?: unknown } | null | undefined): Habit => normHabit(a && a.habit) || 'porn';

/** the habit as a noun inside a sentence: "struggling with porn", "with gambling", "with this habit" */
export const HABIT_NOUN: Record<Habit, string> = { porn: 'porn', alcohol: 'drinking', gambling: 'gambling', other: 'this habit' };
/** the habit as a short name on its own (Settings) */
export const HABIT_NAME: Record<Habit, string> = { porn: 'Porn', alcohol: 'Alcohol', gambling: 'Gambling', other: 'Another habit' };

/** a line written for porn, in this habit's words. Only the fixed phrases below change; any other line is left as it is.
    Order matters: the longer phrase goes first. */
const SWAPS: [string, Record<Exclude<Habit, 'porn'>, string>][] = [
  ['compulsive porn use', { alcohol: 'problem drinking', gambling: 'compulsive gambling', other: 'a compulsive habit' }],
  ['struggling with porn', { alcohol: 'struggling with drinking', gambling: 'struggling with gambling', other: 'struggling with a habit' }],
  ['how often do you watch porn', { alcohol: 'how often do you drink', gambling: 'how often do you gamble', other: 'how often does it happen' }],
  ['Quit porn', { alcohol: 'Quit drinking', gambling: 'Quit gambling', other: 'Quit this habit' }],
  ['on porn', { alcohol: 'on drinking', gambling: 'on gambling', other: 'on this habit' }],
  ['porn', { alcohol: 'drinking', gambling: 'gambling', other: 'this habit' }],
];
export function habitSay(text: string, h: Habit): string {
  if (h === 'porn') return text;
  let out = text;
  SWAPS.forEach(([from, to]) => {
    out = out.split(from).join(to[h]);
  });
  return out;
}

/** the safety net's three device steps (legacy SAFETY 1 to 3), in this habit's words. The places stay the same, so what a
    person ticked keeps its meaning (settings.safety is kept by place). */
export const SAFETY_HABIT: Record<Exclude<Habit, 'porn'>, Record<number, [string, string]>> = {
  alcohol: {
    1: ['No alcohol in the house', 'What is not there cannot be poured at 11 PM.'],
    2: ['My drink picked before I go out', 'Soda, tea or an alcohol-free beer, chosen while my head is clear.'],
    3: ['Delete delivery apps, change the route past the store', 'Less to resist late at night.'],
  },
  gambling: {
    1: ['Gambling block on my phone (BetBlocker is free)', 'Makes a bet take more than two taps. Steps are in Get help.'],
    2: ['Same block on my computer', 'A block on one device just moves the urge.'],
    3: ['Delete betting apps, close my accounts', 'Less to resist late at night.'],
  },
  other: {
    1: ['Make it harder to reach from my phone', 'Every extra step gives the urge time to pass.'],
    2: ['Same on my computer', 'A block on one device just moves the urge.'],
    3: ['Remove the apps, accounts or supplies that make it easy', 'Less to resist late at night.'],
  },
};
/** one safety step's words for this habit */
export const safetyFor = (i: number, base: [string, string], h: Habit): [string, string] => (h === 'porn' ? base : SAFETY_HABIT[h][i] || base);

/** for another habit: stopping alcohol, or a drug used every day, all at once can be dangerous. Said in setup and in Get help. */
export const HABIT_MEDICAL =
  'If it is alcohol, or a drug you use every day, talk to a doctor before you stop. Stopping all at once can be dangerous, and a doctor can make it safe.';

/** for alcohol: stopping heavy drinking all at once can bring dangerous withdrawal, so a doctor comes first */
export const ALCOHOL_MEDICAL =
  'If you drink every day, or a lot at a time, talk to a doctor before you stop. Stopping all at once can bring shakes, seizures or worse, and a doctor can make it safe.';
/** the doctor line before stopping, for the habits that need one */
export const habitMedical = (h: Habit): string | null => (h === 'alcohol' ? ALCOHOL_MEDICAL : h === 'other' ? HABIT_MEDICAL : null);
