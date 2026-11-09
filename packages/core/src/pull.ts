/* The app that pulls you in (Screen Time, iPhone only; docs/plan.md, "Screen Time"). The person picks the apps that pull them in
   (Apple's own picker: Daybook never learns which), and Daybook watches use of them through Apple's DeviceActivity, which tells it
   only that a threshold was passed, never the numbers:

   - After long use (1, 2 or 3 hours in a day), one note a day: to today's lesson when it is not done, otherwise to put it down.
   - In the hard hours (risk.ts), two notes, at 10 and 20 minutes of use inside the window.
   - Only if the person chose it, the pause: at 30 minutes inside the hard hours the apps rest until the window ends. Past it is a
     wait on Daybook's own screen (10, 30 or 60 seconds), then the apps open for a few minutes (3, 5 or 10 of use), then the pause
     comes back with the wait again (the owner, November 9, 2026).

   The words follow the stakes rule (CLAUDE.md, November 8, 2026): firm and plain, about the next choice and what it costs, never
   about who the person is. In the hours after a slip (until the next morning) there are no stakes: long use goes quiet, the hard
   hours get one note pointing to SOS, and the pause, which is the person's own protection, keeps running in plain words.
   Nothing on a locked screen names the app or the habit.

   Everything here stays on the phone. Apple's license forbids Screen Time data leaving the device, so no anonymous count comes
   from any of it (pulse.ts), and none of it is in synced Settings: the choices are each phone's own. */
import { addDays, eventsOf, isTime, logicalKey } from './legacy/core.js';
import { lessonDue } from './nudges';
import { riskAt, riskStartLabel, riskWindow } from './risk';
import type { DayKey, Days, Settings } from './types';

/** the person's choices, kept on the phone */
export interface PullPrefs {
  /** Screen Time access was given and apps were picked; the rest means nothing until then */
  on: boolean;
  /** hours of use in a day before the long-use note; 0 is off */
  long: 0 | 1 | 2 | 3;
  /** the two notes in the hard hours */
  hard: boolean;
  /** the pause after the notes in the hard hours: only by the person's own choice */
  pause: boolean;
  /** seconds of the wait before the apps open */
  wait: 10 | 30 | 60;
  /** minutes of use before the pause comes back */
  open: 3 | 5 | 10;
  /** the setup page was seen (picked or skipped), so a redo does not ask again unless it was skipped */
  asked?: 'picked' | 'skipped';
}
export const PULL_DEFAULTS: PullPrefs = { on: false, long: 2, hard: true, pause: false, wait: 10, open: 3 };
export const PULL_LONG = [0, 1, 2, 3] as const;
export const PULL_WAIT = [10, 30, 60] as const;
export const PULL_OPEN = [3, 5, 10] as const;
/** minutes of use inside the hard hours for the first note, the second, and the pause (when it is on) */
export const PULL_HARD_AT = [10, 20, 30] as const;
/** the shortest schedule Apple allows, in minutes: the few minutes open are watched inside one this long */
export const PULL_MIN_SCHEDULE = 15;
/** the hour the quiet after a slip ends, the first one at least PULL_QUIET_MIN hours after it */
export const PULL_QUIET_HOUR = 8;
export const PULL_QUIET_MIN = 3;

const pick = <T>(list: readonly T[], x: unknown, d: T): T => (list.includes(x as T) ? (x as T) : d);
/** saved choices, read safely: anything unknown falls back to the default */
export function normPull(x: unknown): PullPrefs {
  const o = (x && typeof x === 'object' ? x : {}) as Partial<PullPrefs>;
  const out: PullPrefs = {
    on: o.on === true,
    long: pick(PULL_LONG, o.long, PULL_DEFAULTS.long),
    hard: o.hard !== false,
    pause: o.pause === true,
    wait: pick(PULL_WAIT, o.wait, PULL_DEFAULTS.wait),
    open: pick(PULL_OPEN, o.open, PULL_DEFAULTS.open),
  };
  if (o.asked === 'picked' || o.asked === 'skipped') out.asked = o.asked;
  return out;
}

/** a hard-hours window as a clock schedule: it starts on calendar weekday `weekday` (1 Sunday to 7 Saturday, as Apple counts)
    at `start`, and lasts two hours (it may cross midnight) */
export interface PullWindow {
  weekday: number;
  start: number;
  /** "11 PM": when the pause ends, for the shield */
  until: string;
}
/** the hard hours for each of the next seven log days, from today, as Apple schedules (one a weekday; none while the log has not
    found them). A window before the rollover hour belongs to the next calendar morning. */
export function pullWindows(days: Days, st: Settings, today: DayKey): PullWindow[] {
  const out: PullWindow[] = [];
  for (let i = 0; i < 7; i++) {
    const k = addDays(today, i);
    const w = riskWindow(days, st, k);
    if (!w) continue;
    const at = new Date(riskAt(k, w.start, st.rollover));
    out.push({ weekday: at.getDay() + 1, start: w.start, until: riskStartLabel((w.start + 2) % 24) });
  }
  return out.sort((a, b) => a.weekday - b.weekday);
}

/** when the quiet after a slip ends (ms), or null when there is none: from a slip on today's or yesterday's log, until the first
    8 AM at least three hours after it. A slip logged with no time counts from the end of its log day. */
export function pullQuietUntil(days: Days, st: Settings, now: number): number | null {
  const today = logicalKey(now, st.rollover);
  let end: number | null = null;
  for (const k of [addDays(today, -1), today]) {
    for (const e of eventsOf(days, k)) {
      if (e.outcome !== 'slipped') continue;
      const at = isTime(e.time) ? riskAt(k, +e.time.slice(0, 2), st.rollover, +e.time.slice(3, 5)) : riskAt(addDays(k, 1), st.rollover, st.rollover) - 1;
      const d = new Date(at + PULL_QUIET_MIN * 3600_000);
      if (d.getHours() >= PULL_QUIET_HOUR) d.setDate(d.getDate() + 1);
      d.setHours(PULL_QUIET_HOUR, 0, 0, 0);
      const t = d.getTime();
      if (t > now && (end == null || t > end)) end = t;
    }
  }
  return end;
}

/** the person's own plan line for this moment, from their urge plan: scrolling first, then late at night */
export function pullPlanLine(st: Settings): string | null {
  const rows = st.plan || [];
  const row = rows.find((r) => /scrolling/i.test(r.when) && r.then.trim()) || rows.find((r) => /late at night/i.test(r.when) && r.then.trim());
  if (!row) return null;
  const t = row.then.trim();
  /* quoted, since the plan is in the person's own voice ("my phone") and the flame is the one saying it */
  return 'Your plan: “' + t + (/[.!?]$/.test(t) ? '' : '.') + '”';
}

/* ---------- the words, in the flame's voice ---------- */

export type PullNoteKind = 'long' | 'longDone' | 'hard1' | 'hard2' | 'hard2Pause' | 'quiet' | 'open';
export interface PullNote {
  t: string;
  b: string;
  url: string;
}
/** every note the extension may post, with where a tap goes; the lesson's link is today's lesson (or Today) */
export function pullNudges(o: { lessonUrl: string; long: number; pauseAt?: number }): Record<PullNoteKind, PullNote> {
  const hrs = o.long === 1 ? 'An hour' : (o.long === 2 ? 'Two' : 'Three') + ' hours';
  const left = (o.pauseAt ?? PULL_HARD_AT[2]) - PULL_HARD_AT[1];
  return {
    long: {
      t: '🔥 ' + hrs + ' in',
      b: hrs + ' there today, and no lesson yet. You are dimming your fire. Three minutes with me puts it back.',
      url: o.lessonUrl,
    },
    longDone: { t: '🔥 ' + hrs + ' in', b: hrs + ' there today. Every minute more is a minute your fire does not get. Put it down.', url: '/' },
    hard1: {
      t: '🔥 Your hard hours',
      b: 'This is when it gets you, and you are on it again. You are dimming your fire. Stand up and walk to another room, now.',
      url: '/pause',
    },
    hard2: { t: '🔥 Still here', b: 'This is the choice that counts tonight. Put the phone in another room. If it pulls, open me.', url: '/pause' },
    hard2Pause: {
      t: '🔥 Still here',
      b: 'This is the choice that counts tonight. Put the phone in another room. In ' + left + ' minutes I rest it, as you asked.',
      url: '/pause',
    },
    quiet: { t: '🔥 Your hard hours', b: 'You do not have to fight it alone tonight. SOS is one tap away.', url: '/sos' },
    /* posted when the shield's button is pressed, since a shield cannot open Daybook itself */
    open: { t: '🔥 Here', b: 'Tap, and I will be right there.', url: '/pause' },
  };
}

/** Apple's shield: a still picture with a title, a line and two buttons (it cannot count down; the wait is Daybook's /pause) */
export interface PullShield {
  title: string;
  sub: string;
  primary: string;
  secondary: string;
}
export function pullShield(o: { until: string; plan: string | null; quiet: boolean }): PullShield {
  const first = o.quiet ? 'You asked me to hold this tonight.' : 'You asked me to hold this in your hard hours.';
  return {
    title: 'Resting until ' + o.until,
    sub: o.plan ? first + ' ' + o.plan : first + ' Your fire is worth more than this.',
    primary: 'Open Daybook',
    secondary: 'Close',
  };
}

/** the words on Daybook's own wait screen: the heading, one plain line under it, and what the flame says in its bubble (the
    person's own plan when there is one) */
export interface PullPauseWords {
  title: string;
  line: string;
  /** the flame's bubble over the ring */
  say: string;
  /** under the ring while it runs */
  hold: string;
  /** the main button: away from the app */
  down: string;
  /** the quiet link once the wait is over */
  open: string;
  /** after "Put it down" */
  thanks: string;
}
export function pullPauseWords(o: { quiet: boolean; open: number; plan: string | null }): PullPauseWords {
  return {
    title: 'This is your hard hours',
    line: o.quiet ? 'Tonight is not a night to be alone with your phone.' : 'Put the phone down. This is the choice that keeps your fire burning.',
    say: o.plan ?? (o.quiet ? 'Put it down, and I will stay right here.' : 'Stand up and walk to another room. I will be right here.'),
    hold: 'Breathe while it runs.',
    down: 'Put it down',
    open: 'Open it for ' + o.open + ' minutes',
    thanks: o.quiet ? 'That was the strong choice. I am proud of you.' : 'That is how your fire grows. Go, and leave the phone here.',
  };
}

/* ---------- what the app shares with the extensions ---------- */

/** what the main app writes to the App Group on every open and change, for the extensions to read; they only read and decide */
export interface PullBridge {
  /** the log day it was written for: the extension treats anything older as "not opened today" */
  day: DayKey;
  lessonDone: boolean;
  quietUntil: number | null;
  prefs: PullPrefs;
  windows: PullWindow[];
  notes: Record<PullNoteKind, PullNote>;
  shield: PullShield;
  /** the shield in the quiet after a slip */
  shieldQuiet: PullShield;
}
export function pullBridge(days: Days, st: Settings, prefs: PullPrefs, now: number, account = true): PullBridge {
  const day = logicalKey(now, st.rollover);
  const lid = lessonDue(days, st, day, account);
  const windows = prefs.hard ? pullWindows(days, st, day) : [];
  const until = windows.find((w) => w.weekday === new Date(now).getDay() + 1)?.until ?? windows[0]?.until ?? 'later';
  const plan = pullPlanLine(st);
  return {
    day,
    lessonDone: !lid,
    quietUntil: pullQuietUntil(days, st, now),
    prefs,
    windows,
    notes: pullNudges({ lessonUrl: lid ? '/lesson/' + lid : '/', long: prefs.long }),
    shield: pullShield({ until, plan, quiet: false }),
    shieldQuiet: pullShield({ until, plan: null, quiet: true }),
  };
}

/** which note the extension posts for a threshold, or null for none. `kind` is the event: 'long', or the hard hours' 1, 2 or 3
    (the third only starts the pause). `opened` is whether Daybook was opened on the bridge's day. */
export function pullNoteFor(b: PullBridge, kind: 'long' | 1 | 2 | 3, now: number, opened: boolean): PullNoteKind | null {
  const quiet = b.quietUntil != null && now < b.quietUntil;
  if (kind === 'long') {
    if (quiet || b.prefs.long === 0) return null;
    return opened && b.lessonDone ? 'longDone' : 'long';
  }
  if (!b.prefs.hard) return null;
  if (quiet) return kind === 1 ? 'quiet' : null;
  if (kind === 1) return 'hard1';
  if (kind === 2) return b.prefs.pause ? 'hard2Pause' : 'hard2';
  return null;
}
