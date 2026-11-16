/* Self Talk: the flame helps the person speak to themself by name, the way a good friend would. Three short lines, one from each
   pile: the proof (you have done this before), who they are becoming (free, not an addict), and the next step. Each is said out loud,
   or held and said in the head.

   Why: talking to yourself by your own name, or as "you", puts a little distance between you and the feeling, and people then think
   more clearly and feel less overwhelmed under stress (Kross and others 2014; Dolcos and Albarracín 2014, "you" works too). Its evidence
   is for stress, not craving, so it sits low in the ride's order (ride.ts RIDE_ORDER), and the skip rule moves it later if a person
   passes it over. Words about who you are, said out loud again and again, are the identity the app is for (lesson l38, "I do not").

   The words follow the rules: plain, no contractions, hopeful and firm, never shame, about the next choice and never about who the
   person is. Faith words only with faith on. */
import { habitOf, type Habit } from './habit';
import { godOn } from './lessons';
import type { Rand } from './sos';
import type { Settings } from './types';

/** a line, said to the person: `y` is "you" at the start of the line, so a name can go before it */
type Line = (y: { you: string; n: number }) => string;

/** the proof: you have gotten through this before */
const PROOF: Line[] = [
  ({ you }) => you + ' have gotten through this before. It rises, it peaks, and it passes.',
  ({ you }) => you + ' have ridden out a hard pull before, and you were glad after. You can do it again now.',
  ({ you }) => you + ' feel a loud pull, and a loud pull is not in charge. You are.',
];
/** the proof, with the person's own count, once there are two or more urges ridden out */
const PROOF_N: Line = ({ you, n }) => you + ' have ridden out ' + n + ' urges already. This is one more.';

/** who you are becoming */
const WHO: Line[] = [
  ({ you }) => you + ' are becoming someone who is free. Free people feel urges too, and they let them pass.',
  ({ you }) => you + ' are not your habit. You are the one choosing, right now.',
  ({ you }) => you + ' are becoming free one choice at a time. This is one of them.',
];
/** the habit, by name: what the hour does not need */
const NEED: Record<Habit, string> = { porn: 'porn', alcohol: 'a drink', gambling: 'a bet', other: 'the habit' };
const WHO_HABIT =
  (h: Habit): Line =>
  ({ you }) =>
    you + ' do not need ' + NEED[h] + ' to get through this hour.';

/** the next step, firm */
const NEXT: Line[] = [
  ({ you }) => you + ' do not have to win the whole day. Only this one choice.',
  ({ you }) => you + ' have the next ten minutes. Spend them on something you will be glad of later.',
  ({ you }) =>
    you === 'You'
      ? 'I am proud of you for stopping to do this. Keep going.'
      : you.replace(/, you$/, '') + ', I am proud of you for stopping to do this. Keep going.',
];
/** with faith on, the next step can be this one */
const NEXT_FAITH: Line = ({ you }) => you + ' are not alone in this. God is with you, and He is stronger than this pull.';

/** a first name a person could be spoken to by: one word, letters only (with ' or -), up to 20 letters, else null */
export function talkName(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const w = raw.trim().split(/\s+/)[0] || '';
  if (!/^[\p{L}][\p{L}'’-]{0,19}$/u.test(w)) return null;
  return w.charAt(0).toUpperCase() + w.slice(1);
}

/** the three lines for this Self Talk: the proof, who you are becoming, the next step. `name` is the person's first name when Daybook
    has it (talkName), `n` how many urges they have ridden out. */
export function selfTalk(st: Settings | null, name: string | null, n: number, rand: Rand): string[] {
  const nm = talkName(name);
  const y = { you: nm ? nm + ', you' : 'You', n };
  const pick = <X>(a: X[]) => a[Math.min(a.length - 1, Math.floor(rand() * a.length))];
  const proof = n >= 2 && rand() < 0.5 ? PROOF_N : pick(PROOF);
  const who = rand() < 0.25 ? WHO_HABIT(habitOf(st)) : pick(WHO);
  const next = godOn(st) && rand() < 0.5 ? NEXT_FAITH : pick(NEXT);
  return [proof(y), who(y), next(y)];
}

/** every line Self Talk can say, for this habit and with or without faith (tests, and the samples for the owner) */
export function selfTalkAll(st: Settings | null, name: string | null, n: number): string[] {
  const nm = talkName(name);
  const y = { you: nm ? nm + ', you' : 'You', n };
  const lines: Line[] = [...PROOF, PROOF_N, ...WHO, WHO_HABIT(habitOf(st)), ...NEXT];
  if (godOn(st)) lines.push(NEXT_FAITH);
  return lines.map((f) => f(y));
}
