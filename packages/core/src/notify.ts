/* The ask on Today when notifications are off (docs/plan.md, "Notifications, second pass"): a banner at the very top, like
   Duolingo's, and the one place Daybook nags, by the owner's choice. It is never a modal and never blocks anything (App
   Store 5.1.2: an app may not require notifications). It shows on a phone once setup is done, while notifications are not
   granted, until the person turns them on or chooses "Stop asking on this phone"; the X hides it until tomorrow. Never on
   the day of a slip or the day after (ask only at good moments). Two forms: the phone can still ask, or it has said no and
   only its settings page can turn them on. The memory stays on the phone (daybook.notify), never synced.
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

export type NotifyAsk = { k: 'allow' | 'off'; text: string; yes: string };
export const NOTIFY_WORDS = {
  allow: 'Turn on reminders. One short note a day, at your time, and never a word about what Daybook is for.',
  allowYes: 'Turn on',
  off: 'Notifications are off for Daybook on this phone.',
  offYes: 'Open settings',
  never: 'Stop asking on this phone',
};

/** whether the banner could show at all on this phone (Settings shows "Stop asking on this phone" while it can) */
export const notifyCanAsk = (env: NotifyEnv, mem: NotifyMem) => env.offered && !env.granted && !mem.never && mem.n < NOTIFY_MAX_X;

/** the banner on Today, or nothing */
export function notifyAsk(env: NotifyEnv, mem: NotifyMem, days: Days, st: Settings | null, tk: DayKey): NotifyAsk | null {
  if (!st || !notifyCanAsk(env, mem)) return null;
  if (mem.quiet === tk) return null;
  if ([tk, addDays(tk, -1)].some((k) => (days[k]?.events || []).some((e) => e.outcome === 'slipped'))) return null;
  return env.canAskAgain
    ? { k: 'allow', text: NOTIFY_WORDS.allow, yes: NOTIFY_WORDS.allowYes }
    : { k: 'off', text: NOTIFY_WORDS.off, yes: NOTIFY_WORDS.offYes };
}
/** the X: hidden until tomorrow */
export const notifyQuiet = (mem: NotifyMem, tk: DayKey): NotifyMem => ({ ...mem, quiet: tk, n: mem.n + 1 });
/** "Stop asking on this phone" */
export const notifyNever = (mem: NotifyMem): NotifyMem => ({ ...mem, never: true });
