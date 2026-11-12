/* The ask on Today when notifications are off (docs/plan.md, "Notifications, second pass"): a banner at the very top, like
   Duolingo's, and the one place Daybook nags, by the owner's choice. It is never a modal and never blocks anything (App
   Store 5.1.2: an app may not require notifications). It shows on a phone once setup is done, while notifications are not
   granted, until the person turns them on or chooses "Stop asking on this phone"; the X hides it until tomorrow. Never on
   the day of a slip or the day after (ask only at good moments). Two forms: the phone can still ask, or it has said no and
   only its settings page can turn them on. The memory stays on the phone (daybook.notify), never synced.
   It asks at the moment the value is plain (docs/plan.md, "Becoming free", 3): once the person has ridden one out in the last
   two weeks, it says so and offers the heads-up before the hard hours. Never in the hours after an SOS that did not end in a
   ride (NOTIFY_SOS_HOURS).
   Checked by test/notify.test.ts. */
import { addDays } from './legacy/core.js';
import type { DayKey, Days, Settings } from './types';

/** what the phone says about notifications */
export interface NotifyEnv {
  /** this is a phone app that can notify (false on the web) */
  offered: boolean;
  granted: boolean;
  /** the phone can still show its own prompt (false once it has said no for good) */
  canAskAgain: boolean;
}
/** what this phone remembers about the banner */
export interface NotifyMem {
  /** the day the X was last tapped */
  quiet: DayKey | null;
  /** "Stop asking on this phone" */
  never: boolean;
  /** how many times the X was tapped */
  n: number;
}
export const notifyMemNew = (): NotifyMem => ({ quiet: null, never: false, n: 0 });
/** a stored memory, made safe to read */
export function normNotifyMem(x: unknown): NotifyMem {
  const o = (x && typeof x === 'object' ? x : {}) as Partial<NotifyMem>;
  return {
    quiet: typeof o.quiet === 'string' ? o.quiet : null,
    never: o.never === true,
    n: typeof o.n === 'number' && o.n >= 0 ? Math.floor(o.n) : 0,
  };
}
/** the banner stops after this many X's; Infinity: it comes back every day, as the owner asked (one line to change) */
export const NOTIFY_MAX_X = Infinity;

export type NotifyAsk = { k: 'allow' | 'off'; text: string; yes: string; ride?: true };
/** the hours after an SOS that did not end in riding it out, when nothing asks */
export const NOTIFY_SOS_HOURS = 3;
/** a ride this recent makes the ask about the heads-up */
export const NOTIFY_RIDE_DAYS = 14;
export const NOTIFY_WORDS = {
  allow: 'Turn on reminders. One short note a day, at your time, and never a word about what Daybook is for.',
  allowYes: 'Turn on',
  /** after the person rode one out: the value is plain now */
  ride: 'You rode it out. Want a heads-up before your hard hours? Never a word about what Daybook is for.',
  off: 'Notifications are off for Daybook on this phone.',
  offYes: 'Open settings',
  never: 'Stop asking on this phone',
};

/** whether the banner could show at all on this phone (Settings shows "Stop asking on this phone" while it can) */
export const notifyCanAsk = (env: NotifyEnv, mem: NotifyMem) => env.offered && !env.granted && !mem.never && mem.n < NOTIFY_MAX_X;

/** when an event on log day k at its clock time happened (a time before the rollover is the next morning) */
const eventMs = (k: DayKey, time: string | null | undefined, roll: number) => {
  const t = /^\d\d:\d\d$/.test(time || '') ? time! : '12:00';
  return new Date((+t.slice(0, 2) < roll ? addDays(k, 1) : k) + 'T' + t + ':00').getTime();
};
/** the banner on Today, or nothing. sos: when SOS was last open (core urLastAt), and now, for the hours after it. */
export function notifyAsk(
  env: NotifyEnv,
  mem: NotifyMem,
  days: Days,
  st: Settings | null,
  tk: DayKey,
  sos?: { at: number | null; now: number },
): NotifyAsk | null {
  if (!st || !notifyCanAsk(env, mem)) return null;
  if (mem.quiet === tk) return null;
  if ([tk, addDays(tk, -1)].some((k) => (days[k]?.events || []).some((e) => e.outcome === 'slipped'))) return null;
  const rides: number[] = [];
  for (let i = 0; i < NOTIFY_RIDE_DAYS; i++) {
    const k = addDays(tk, -i);
    for (const e of days[k]?.events || []) if (e.outcome === 'rode') rides.push(eventMs(k, e.time, st.rollover));
  }
  if (sos?.at && sos.now - sos.at < NOTIFY_SOS_HOURS * 3600_000 && !rides.some((t) => t >= sos.at! - 60000)) return null;
  if (!env.canAskAgain) return { k: 'off', text: NOTIFY_WORDS.off, yes: NOTIFY_WORDS.offYes };
  return rides.length
    ? { k: 'allow', text: NOTIFY_WORDS.ride, yes: NOTIFY_WORDS.allowYes, ride: true }
    : { k: 'allow', text: NOTIFY_WORDS.allow, yes: NOTIFY_WORDS.allowYes };
}
/** the X: hidden until tomorrow */
export const notifyQuiet = (mem: NotifyMem, tk: DayKey): NotifyMem => ({ ...mem, quiet: tk, n: mem.n + 1 });
/** "Stop asking on this phone" */
export const notifyNever = (mem: NotifyMem): NotifyMem => ({ ...mem, never: true });
