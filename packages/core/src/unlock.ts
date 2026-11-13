/* The first week (WP10, the owner's decision D4, November 12, 2026). Setup asks only what tonight needs; the rest of Daybook
   arrives one part a day for the first week, each set up by using it once, the way Duolingo opens a new unit. "We don't
   waterboard them with features" (the owner, November 9, 2026) still holds: never two new things on a day.

   The days (day 0 is the day of setup, fw):
   - day 1: the morning page itself, done for the first time. It comes up on its own (morning-set.ts), so it has no card here.
   - day 2: where the phone sleeps (the wind-down: put the flame to bed, phone on its charger away from the bed);
   - day 3: one person (a first name only, never contacted);
   - day 4: the plan's first line (what to do when the hardest hour comes);
   - day 5: the other doors (Screen Time's short wait, on an iPhone that has it; others skip it);
   - day 6: your own voice (a note to the self who faces the next urge, future.ts);
   - day 7: the first week, looked back on (week.ts, its own card on Today).
   The widget comes on day 14 (flame-widget.ts) and the "how free do you see yourself" question later (north.ts), as before.

   The rules:
   - one a day, in order: a part waits until the day after the last one, so a missed day moves the rest a day, never doubles up;
   - a part is never before its own day;
   - never on the day of a slip or the day after (the morning said "It happened"), and never in the hours after an SOS (the
     caller passes `quiet`): that day's part waits a day;
   - a part already in use is skipped;
   - only for people who came through the short setup (st.fw), for the first week's parts in their days.

   After the first week, the bigger parts each get the same Unlocked moment and a short walk through (the owner, November 13,
   2026: "they should unlock apple health the app lock the night pack etc just after they've used the app or once a day ... it
   should also unlock daily routine edit"), from day 8 (after the first week's look back), by the same rules, in LATER's order:
   editing the daily list, Apple Health, the night pack, the app lock. A part this device cannot have (no Health on the web, no
   night pack before iOS 26) is skipped like one in use. These are offers, never gates: each stays in Settings all along.
   People who came through the old long setup (no st.fw) get them too, one a day from their next visit, the later parts first
   (they are what is new to them), then any first-week part they never set up. A part they already use is never shown.
   Once shown it stays the card for that day until opened, and is gone the next day: it lives where it always lives. The parts
   used to be the "Unlocked" cards (November 9, 2026); those are retired. Checked by test/unlock.test.ts. */
import { addDays, diffDays, isKey, sumDay } from './legacy/core.js';
import { ROUTINE_SHOWN } from './day';
import { habitOf } from './habit';
import { safeName } from './rekindle';
import type { DayKey, Days, Settings } from './types';

export type UnlockId = 'bed' | 'person' | 'plan' | 'doors' | 'voice' | 'sunday' | 'routine' | 'health' | 'night' | 'lock';
/** every part, in order; 'sunday' is the first Sunday review's own card (moment.ts), kept here for its words */
export const UNLOCK_ORDER: UnlockId[] = ['bed', 'person', 'plan', 'doors', 'voice', 'sunday', 'routine', 'health', 'night', 'lock'];
/** the first-week parts this file offers, and the day of the first week each is ready from (setup is day 0) */
export const FIRST_WEEK: [UnlockId, number][] = [
  ['bed', 2],
  ['person', 3],
  ['plan', 4],
  ['doors', 5],
  ['voice', 6],
];
/** the bigger parts after the first week, in order */
export const LATER: UnlockId[] = ['routine', 'health', 'night', 'lock'];
/** the day of the first week the later parts start (the look back is day 7) */
export const LATER_FROM = 8;

/** what this device remembers: the day each was first the card, and whether its page was opened */
export type UnlockMem = Partial<Record<UnlockId, { d: DayKey; o?: 1 }>>;

/** what only the device knows */
export interface UnlockEnv {
  /** the phone has been put to bed once, or the wind-down note is on */
  bedUsed?: boolean;
  /** a note to future you is kept */
  voiceUsed?: boolean;
  /** this iPhone build can watch the apps (Screen Time) and none are picked yet */
  pull?: boolean;
  /** an SOS or a slip in the last hours, or the day the person came back (lib/quiet-asks.ts) */
  quiet?: boolean;
  /** Apple Health can be read here and is not connected */
  health?: boolean;
  /** the night pack is in this build (iOS 26) and none of it is set */
  night?: boolean;
  /** the app lock can be offered here (a phone) and is off */
  lock?: boolean;
  /** what this device keeps is still loading (the lock, Health): nothing is picked until it is known */
  loading?: boolean;
}

export function normUnlockMem(v: unknown): UnlockMem {
  const out: UnlockMem = {};
  if (!v || typeof v !== 'object') return out;
  for (const id of UNLOCK_ORDER) {
    const x = (v as Record<string, unknown>)[id] as { d?: unknown; o?: unknown } | undefined;
    if (x && typeof x.d === 'string') out[id] = x.o ? { d: x.d, o: 1 } : { d: x.d };
  }
  return out;
}

/** the day of the first week `tk` is (setup is 0), or null for someone who did not come through the short setup */
export const firstWeekDay = (st: Settings | null, tk: DayKey): number | null => (st && isKey(st.fw) ? diffDays(tk, st.fw as DayKey) : null);

/** the daily list was changed once: a day changed from Today, or the usual list is neither the old nor the new default (new
    people start with the check-in off, two-moments.ts) */
export function routineEdited(days: Days, st: Settings): boolean {
  if (Object.values(days).some((d) => !!(d && d.p && d.p.ov && Object.keys(d.p.ov).length))) return true;
  const r = st.routine || {};
  const differs = (base: (k: string, on: boolean) => boolean) => ROUTINE_SHOWN.some((x) => !!r[x.k] !== base(x.k, x.on));
  return differs((_, on) => on) && differs((k, on) => (k === 'checkin' ? false : on));
}

/** a part already in use: nothing to set up */
function used(id: UnlockId, days: Days, st: Settings, env: UnlockEnv): boolean {
  switch (id) {
    case 'bed':
      /* the phone's bed is for porn only (the owner, via WP3, November 13, 2026) */
      return !!env.bedUsed || habitOf(st) !== 'porn';
    case 'person':
      return !!safeName(st);
    case 'plan': {
      const a = (st.onb && st.onb.a) || {};
      return typeof a.then === 'string' && !!a.then;
    }
    case 'doors':
      return !env.pull;
    case 'voice':
      return !!env.voiceUsed;
    case 'routine':
      return routineEdited(days, st);
    case 'health':
      return !env.health;
    case 'night':
      return !env.night;
    case 'lock':
      return !env.lock;
    default:
      return true;
  }
}

/** the part that is today's, or null */
export function unlockNow(days: Days, st: Settings, tk: DayKey, mem: UnlockMem, env: UnlockEnv): UnlockId | null {
  const n = firstWeekDay(st, tk);
  if (n != null && n < 1) return null;
  /* today's card stays until its page is opened */
  for (const id of UNLOCK_ORDER) {
    const m = mem[id];
    if (m && m.d === tk) return m.o ? null : id;
  }
  if (env.quiet || env.loading) return null;
  if (sumDay(days[tk]).slipped || sumDay(days[addDays(tk, -1)]).slipped) return null;
  /* the order and the day each is ready from: the first week in its days, then the later parts; for the old setup, the later
     parts first, then what the first week would have brought, all ready now */
  const order: [UnlockId, number][] =
    n == null
      ? [...LATER.map((id): [UnlockId, number] => [id, 0]), ...FIRST_WEEK.map(([id]): [UnlockId, number] => [id, 0])]
      : [...FIRST_WEEK, ...LATER.map((id): [UnlockId, number] => [id, LATER_FROM])];
  for (const [id, day] of order) {
    if (mem[id]) continue;
    if (used(id, days, st, env)) continue;
    return (n == null ? 0 : n) >= day ? id : null;
  }
  return null;
}

export interface UnlockWords {
  /** Today's card: the small words over it, and its title */
  eb: string;
  h: string;
  /** the page: the title, the line under it (none when the flame says enough), what the flame says, and the main button */
  title: string;
  line?: string;
  say: string;
  /** the walk through: how it works and how to set it up, a few short steps */
  how?: string[];
  /** what the flame says instead, to someone who came through the old setup, when the first-week words would not be true */
  sayOld?: string;
  btn: string;
}

export const UNLOCK_WORDS: Record<UnlockId, UnlockWords> = {
  bed: {
    eb: 'Unlocked tonight',
    h: 'Where your phone sleeps',
    title: 'Where does your phone sleep?',
    line: 'Most hard nights start with a phone in bed.',
    say: 'Tonight, put me to bed with it: phone on its charger, away from your bed. One tap, and the night is yours.',
    btn: 'Set it for tonight',
  },
  person: {
    eb: 'Unlocked',
    h: 'One person',
    title: 'Who is one person on your side?',
    line: 'Only you see the name. Daybook never contacts anyone.',
    say: 'Nobody gets free alone. One name you could text on a hard night makes the next one easier.',
    btn: 'Keep their name',
  },
  plan: {
    eb: 'Unlocked',
    h: 'The first line of your plan',
    title: 'When it comes, what will you do?',
    say: 'Decide it now, on a calm day. Then the hard moment only has to remember.',
    btn: 'Make it my plan',
  },
  doors: {
    eb: 'Unlocked',
    h: 'The other doors',
    title: 'Which app pulls you in?',
    say: 'A few seconds before it opens, every time. That moment is where you choose.',
    btn: 'Choose the apps',
  },
  voice: {
    eb: 'Unlocked',
    h: 'A note from you',
    title: 'Leave a note for your next hard night',
    line: 'In your own voice. It stays on this phone.',
    say: 'Six days in, you know something your hardest night forgets. Say it now, and I will play it back when it counts.',
    sayOld: 'You know something your hardest night forgets. Say it now, and I will play it back when it counts.',
    btn: 'Leave a note',
  },
  sunday: {
    eb: 'Your first Sunday',
    h: 'Your first Sunday review',
    title: 'Your first Sunday review',
    line: 'A few minutes, once a week.',
    say: 'Your week, one thing at a time: what helped, what got you, and one small goal for the next. This is where you start to see your pattern.',
    btn: 'Start my review',
  },
  routine: {
    eb: 'Unlocked',
    h: 'Your daily list',
    title: 'Your day is yours to shape',
    line: 'Choose what shows on Today, every day.',
    say: 'Keep what helps you and switch off what does not. A part you switch off still earns its points when you do it.',
    how: ['To change only today, tap Change on Today.'],
    btn: 'Keep my list',
  },
  health: {
    eb: 'Unlocked',
    h: 'Apple Health',
    title: 'Let Daybook read your sleep',
    line: 'Only sleep. It stays on this phone.',
    say: 'Short nights make hard days. With your sleep, the check-in does not have to ask, and your Pattern shows how your nights and your hard days line up.',
    how: [
      'Apple shows its own page next. Turn on Sleep, then tap Allow.',
      'Daybook only reads how long you slept, from your watch or ring. It is never synced, backed up or sent.',
      'You can turn it off any time in Settings.',
    ],
    btn: 'Connect Apple Health',
  },
  night: {
    eb: 'Unlocked',
    h: 'The night pack',
    title: 'Make the whole phone quiet at night',
    line: 'Four small automations, made once in Shortcuts.',
    say: 'At your phone-down time the screen goes grey, the apps that pull you in wait first, the charger opens Good night, and your alarm opens the morning.',
    how: [
      'Apple lets only you make an automation, so the next page walks you through each one in the Shortcuts app.',
      'Each one you set lights a flame. Start with one tonight.',
      'Nothing of it leaves this phone.',
    ],
    btn: 'Set up the night pack',
  },
  lock: {
    eb: 'Unlocked',
    h: 'App lock',
    title: 'Keep Daybook for your eyes only',
    line: 'Face ID, Touch ID or your passcode opens it.',
    say: 'What you write here is yours. With the lock on, someone who picks up your phone cannot open your log.',
    how: [
      'Daybook asks for Face ID or your passcode each time it opens.',
      'A quick trip away, like texting someone, does not lock it. After a minute away, it locks again.',
      'In the app switcher, your log is covered.',
    ],
    btn: 'Turn on the lock',
  },
};
