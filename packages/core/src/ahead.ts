/* A plan for later: for when the slip is being planned before there is any urge. The time is set, the house will be
   empty, the details are already picked out, and part of you feels owed it, or has decided it will happen anyway (maybe
   "tomorrow, once this run is over"). Nothing is happening yet, so SOS does not fit, and the log has nothing to log.

   What the research says, and how this flow uses it:
   - Relapse often starts with choices that look unrelated, well before the urge (Marlatt's "apparently irrelevant
     decisions"). So the flow names what the plan counts on (being alone, a free hour, a device, something picked out),
     and changes one of those links now.
   - When calm, people underestimate how strong the pull will be later (the cold-to-hot empathy gap; Sayette,
     Loewenstein and others, 2008). So now, while it is quiet, is the easiest time to change the plan, and the app meets
     the person at that hour with their own move.
   - The thoughts that give permission ("I am owed this", "I will slip anyway") are what most directly lead to the act
     (Beck's permissive beliefs), and going over the details again and again feeds the desire (desire thinking; Caselli
     and Spada). So each gets a plain answer.
   - A plan made ahead ("at that hour, I will...") is easier to follow than deciding in the moment (implementation
     intentions; Gollwitzer and Sheeran, 2006).
   Device-only: what is picked here stays on this device, like the rest of SOS memory. */

export type AheadLink = 'alone' | 'free' | 'device' | 'picked' | 'owed' | 'anyway';

/** what the plan counts on: [id, the words, a short line under them] */
export const AHEAD_LINKS: [AheadLink, string, string][] = [
  ['alone', 'Being alone', 'No one home, no one around'],
  ['free', 'A free hour', 'Nothing set for that time'],
  ['device', 'A phone or a laptop', 'In reach, with no filter in the way'],
  ['picked', 'Something already picked out', 'The sites, the names, the scenes'],
  ['owed', 'Feeling I am owed it', 'A hard day, a long run, a reward'],
  ['anyway', 'Thinking I will slip anyway', 'Later, tomorrow, once this run ends'],
];

/** the thought behind a link, and a plain answer to it. Only the links that carry a thought have one. */
export const AHEAD_ANSWERS: Partial<Record<AheadLink, [string, string]>> = {
  owed: ['I am owed this.', 'You are owed rest, and something good. This is not it: it takes more than it gives. Put a real treat in that hour instead.'],
  anyway: [
    'I will slip anyway, so why fight it.',
    'A slip does not erase what you have built here. And a slip planned for later is still a choice later: you can skip it then, too.',
  ],
  picked: [
    'Going over the details again.',
    'Replaying the plan (who, when, how) feeds the pull, and it does not have to be finished. When it starts, name it: “That is the plan again.” Then give your hands or your head something else.',
  ],
};

export type AheadMove = 'people' | 'fill' | 'away' | 'block' | 'treat' | 'text';

/** the changes to make now, while it is quiet: [id, the words, how], and which links each one breaks */
export const AHEAD_MOVES: [AheadMove, string, string, AheadLink[]][] = [
  ['people', 'Be around people then', 'A gym, a café, a friend’s place, or a call on the way home', ['alone']],
  ['fill', 'Fill the hour first', 'Set it now: a walk, a meal to cook, a game, a show', ['free', 'owed']],
  ['away', 'Put the device out of reach', 'Phone stays in the car or the kitchen. The laptop stays at work.', ['device', 'alone']],
  ['block', 'Block it now', 'Add what you have in mind to your filter, while it is quiet', ['picked', 'device']],
  ['treat', 'Plan a real treat', 'Food you love, a long shower, a game. Something good you keep.', ['owed']],
  ['text', 'Text someone for that hour', '“Can I call you around then?” changes the hour', ['alone', 'anyway', 'free']],
];

/** the moves worth offering for the links picked: the ones that break a picked link first, then the rest. With nothing
    picked, all of them in their usual order. */
export function aheadMoves(links: AheadLink[]): typeof AHEAD_MOVES {
  if (!links.length) return AHEAD_MOVES.slice();
  const hits = (m: (typeof AHEAD_MOVES)[number]) => m[3].filter((l) => links.indexOf(l) >= 0).length;
  return AHEAD_MOVES.map((m, i) => ({ m, i, n: hits(m) }))
    .sort((a, b) => b.n - a.n || a.i - b.i)
    .map((x) => x.m);
}

/** the thoughts to answer for the links picked, in the order of AHEAD_LINKS */
export function aheadAnswers(links: AheadLink[]): [string, string][] {
  return AHEAD_LINKS.map((l) => l[0])
    .filter((l) => links.indexOf(l) >= 0 && AHEAD_ANSWERS[l])
    .map((l) => AHEAD_ANSWERS[l]!);
}

/** the plan as this device keeps it: when the hard hour is, and the moves picked */
export interface AheadPlan {
  /** the hard hour, in ms */
  t: number;
  moves: AheadMove[];
}

/** the time of the hard hour: minutes after midnight on the day given (0 today, 1 tomorrow), from now */
export function aheadTime(now: number, day: 0 | 1, mins: number): number {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + day);
  d.setMinutes(mins);
  return d.getTime();
}

/** the earliest time that can be picked today: the next half hour, in minutes after midnight (null when today is over) */
export function aheadFirst(now: number): number | null {
  const d = new Date(now);
  const m = Math.ceil((d.getHours() * 60 + d.getMinutes() + 1) / 30) * 30;
  return m > 23 * 60 + 30 ? null : m;
}

/** how long a plan stays on Today after its hour has come */
export const AHEAD_KEEP = 2 * 3600000;

/** the plan, while it still matters: before its hour and up to two hours after. Null otherwise. */
export function aheadLive(p: unknown, now: number): AheadPlan | null {
  if (!p || typeof p !== 'object') return null;
  const x = p as AheadPlan;
  if (typeof x.t !== 'number' || !Array.isArray(x.moves)) return null;
  return now < x.t + AHEAD_KEEP && x.t - now < 2 * 86400000 ? x : null;
}

/** "Today, 5:30 PM" or "Tomorrow, 5:30 PM" */
export function aheadWhen(t: number, now: number): string {
  const d = new Date(t);
  const a = new Date(now);
  a.setHours(0, 0, 0, 0);
  const days = Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() - a.getTime()) / 86400000);
  const h = d.getHours();
  const clock = (h % 12 || 12) + ':' + String(d.getMinutes()).padStart(2, '0') + ' ' + (h < 12 ? 'AM' : 'PM');
  return (days <= 0 ? 'Today' : days === 1 ? 'Tomorrow' : 'Soon') + ', ' + clock;
}

/** the moves' words, for the card on Today and the reminder */
export const aheadMoveName = (id: string) => AHEAD_MOVES.find((m) => m[0] === id)?.[1] || '';
