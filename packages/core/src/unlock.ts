/* Unlocked (the owner, November 9, 2026: "we don't waterboard them with features"). Setup stays short: a part that is not
   needed on the first night opens later, one at a time, as the person uses the app. Each comes as one card on Today, "Unlocked",
   that opens its own page with the flame big, and then lives where it always lives (the journal on Today's pull-down and in
   Change, the safe person in My plan, Reached out in Change, the apps that pull you in under More).

   The parts, and when each is ready:
   - the journal: day UNLOCK_JOURNAL_DAY (3), two lessons done, and no entry written yet;
   - Planning a slip?: the day after the first urge ridden out, from day 3. It was never locked (care never is): its page only
     shows what the button on Today is for, so its small word is "A tool for you", not "Unlocked";
   - the safe person: day 7 (the first week), when none was named (it left the setup the same day);
   - the apps that pull you in: day 7, on an iPhone that has it, none picked yet (Screen Time, pull.ts);
   - Reached out: day 10, when it is not on the day already;
   - the Sunday review: the first one due is its own card (moment.ts), marked "Unlocked" and opening this page first, so it
     is kept here too, to keep the days between.

   The rules, so it never crowds the day:
   - one at a time, in UNLOCK_ORDER when two are ready, and each only once (kept on this device, like the first pattern);
   - UNLOCK_GAP days at least between two, so a new part is never the third thing in a week;
   - low on Today, like the five questions: it waits behind the day's next stop as "After this", and is the card once the
     day's stops are done, so it never pushes the lesson off the flame;
   - never on the day of a slip or the day after, and never in the hours after an SOS (the caller passes `quiet`);
   - a part already in use is never offered.
   Once shown as the card it stays the card for that day until opened, and is gone the next day. Checked by test/unlock.test.ts. */
import { addDays, diffDays, sumDay } from './legacy/core.js';
import { lessonsDone } from './lessons';
import { safeName } from './rekindle';
import type { DayKey, Days, Settings } from './types';

export type UnlockId = 'journal' | 'plan' | 'person' | 'pull' | 'reach' | 'sunday';
export const UNLOCK_ORDER: UnlockId[] = ['journal', 'plan', 'person', 'pull', 'reach', 'sunday'];
/** the day each is ready from (the first day is 1); the Sunday review comes on its own Sunday */
export const UNLOCK_DAY: Record<UnlockId, number> = { journal: 3, plan: 3, person: 7, pull: 7, reach: 10, sunday: 1 };
export const UNLOCK_GAP = 3;

/** what this device remembers: the day each was first the card, and whether its page was opened */
export type UnlockMem = Partial<Record<UnlockId, { d: DayKey; o?: 1 }>>;

/** what only the device knows */
export interface UnlockEnv {
  /** the journal holds an entry already, or it is on the day */
  journalUsed?: boolean;
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

/** the day number of `tk` in the person's own count: the first day is 1 */
const dayN = (st: Settings, tk: DayKey) => diffDays(tk, st.start) + 1;

/** an urge ridden out on a day before today */
function rodeBefore(days: Days, tk: DayKey): boolean {
  return Object.keys(days).some((k) => k < tk && (days[k]?.events || []).some((e) => e.outcome === 'rode'));
}

function ready(id: UnlockId, days: Days, st: Settings, tk: DayKey, env: UnlockEnv): boolean {
  if (dayN(st, tk) < UNLOCK_DAY[id]) return false;
  switch (id) {
    case 'journal':
      return !env.journalUsed && lessonsDone(days).size >= 2;
    case 'plan':
      return rodeBefore(days, tk);
    case 'person':
      return !safeName(st);
    case 'pull':
      return !!env.pull;
    case 'reach':
      return !st.routine?.reach;
    default:
      return false;
  }
}

/** the part that is unlocked now, or null */
export function unlockNow(days: Days, st: Settings, tk: DayKey, mem: UnlockMem, env: UnlockEnv): UnlockId | null {
  if (!st || !st.start || tk < st.start) return null;
  /* today's card stays until its page is opened (still only while it is still for this phone) */
  for (const id of UNLOCK_ORDER) {
    const m = mem[id];
    if (m && m.d === tk && !m.o && ready(id, days, st, tk, env)) return id;
  }
  if (env.quiet) return null;
  if (sumDay(days[tk]).slipped || sumDay(days[addDays(tk, -1)]).slipped) return null;
  const last = UNLOCK_ORDER.map((id) => mem[id]?.d)
    .filter((d): d is DayKey => !!d)
    .sort()
    .pop();
  if (last && diffDays(tk, last) < UNLOCK_GAP) return null;
  return UNLOCK_ORDER.find((id) => !mem[id] && ready(id, days, st, tk, env)) || null;
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
  journal: {
    eb: 'Unlocked',
    h: 'Your journal',
    title: 'Your journal',
    line: 'A page only for you. Nothing in it is ever shared.',
    say: 'Name how the day felt, in one word or a few lines. Naming it takes some of its weight. Pull down on Today any time to write.',
    btn: 'Write the first one',
  },
  plan: {
    eb: 'A tool for you',
    h: 'When you catch yourself planning it',
    title: 'Planning a slip?',
    line: 'You rode an urge out. Here is the tool for the night it starts earlier.',
    say: 'A slip is often planned long before it happens: a late night, a closed door. When you notice that, tap Planning a slip? on Today. We talk it through, and you choose with your eyes open.',
    btn: 'See how it works',
  },
  person: {
    eb: 'Unlocked',
    h: 'Your safe person',
    title: 'Who could be your safe person?',
    line: 'Only you see the name. Daybook never contacts anyone.',
    say: 'A week in, you know this is real. One person you could text on a hard night makes the next one easier.',
    btn: 'Save',
  },
  pull: {
    eb: 'Unlocked',
    h: 'The app that pulls you in',
    title: 'Which app pulls you in?',
    say: 'When it has you too long, I will say so. In your hard hours, I will say it louder.',
    btn: 'Choose the apps',
  },
  reach: {
    eb: 'Unlocked',
    h: 'Reach out to someone',
    title: 'Reach out to someone',
    line: 'A text, a call, or a talk with a person. Any person counts.',
    say: 'This habit grows in secret, and it shrinks when you are known. One real word with someone each day is part of getting free.',
    btn: 'Put it on my day',
  },
  sunday: {
    eb: 'Unlocked',
    h: 'Your first Sunday review',
    title: 'Your first Sunday review',
    line: 'A few minutes, once a week.',
    say: 'Your week, one thing at a time: what helped, what got you, and one small goal for the next. This is where you start to see your pattern.',
    btn: 'Start my review',
  },
};
