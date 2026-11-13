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
   - only for people who came through the short setup (st.fw). People who finished the long one keep the app as they know it.
   Once shown it stays the card for that day until opened, and is gone the next day: it lives where it always lives. The parts
   used to be the "Unlocked" cards (November 9, 2026); those are retired. Checked by test/unlock.test.ts. */
import { addDays, diffDays, isKey, sumDay } from './legacy/core.js';
import { habitOf } from './habit';
import { safeName } from './rekindle';
import type { DayKey, Days, Settings } from './types';

export type UnlockId = 'bed' | 'person' | 'plan' | 'doors' | 'voice' | 'sunday';
/** the first-week parts, in order; 'sunday' is the first Sunday review's own card (moment.ts), kept here for its words */
export const UNLOCK_ORDER: UnlockId[] = ['bed', 'person', 'plan', 'doors', 'voice', 'sunday'];
/** the first-week parts this file offers, and the day of the first week each is ready from (setup is day 0) */
export const FIRST_WEEK: [UnlockId, number][] = [
  ['bed', 2],
  ['person', 3],
  ['plan', 4],
  ['doors', 5],
  ['voice', 6],
];

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

/** a part already in use: nothing to set up */
function used(id: UnlockId, st: Settings, env: UnlockEnv): boolean {
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
    default:
      return true;
  }
}

/** the first-week part that is today's, or null */
export function unlockNow(days: Days, st: Settings, tk: DayKey, mem: UnlockMem, env: UnlockEnv): UnlockId | null {
  const n = firstWeekDay(st, tk);
  if (n == null || n < 1) return null;
  /* today's card stays until its page is opened */
  for (const [id] of FIRST_WEEK) {
    const m = mem[id];
    if (m && m.d === tk) return m.o ? null : id;
  }
  if (env.quiet) return null;
  if (sumDay(days[tk]).slipped || sumDay(days[addDays(tk, -1)]).slipped) return null;
  for (const [id, day] of FIRST_WEEK) {
    if (mem[id]) continue;
    if (used(id, st, env)) continue;
    return n >= day ? id : null;
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
};
