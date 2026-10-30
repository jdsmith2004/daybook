/* The data model. One settings record, one record per day, one per weekly review. Every rule in Daybook is worked out from
   these at the time it is shown (points, levels, badges, runs, saves, step down), so nothing derived is ever stored. */
import type { Journal } from './journal-entries';
import type { Talk } from './talk';
import type { SunReview } from './sunday';
import type { Supporter } from './supporter';

export type DayKey = string; // 'YYYY-MM-DD', the logical day (it rolls over at settings.rollover o'clock)
export type Clock = string; // 'HH:MM', 24-hour

export type Outcome = 'rode' | 'slipped';

export interface Rekindle {
  /** the day the sunrise check was done, the morning after the slip */
  at?: DayKey;
  /** the if-then plan made at the sunrise check */
  pl?: string;
  /** the deeper mission for a run of 14 days or more: traced it back, or told a person */
  dp?: 'trace' | 'tell';
  /** the trace-back answers: right before, an hour before, earlier that day */
  tr?: [string, string, string];
}

export interface DayEvent {
  id: string;
  time: Clock | null;
  outcome: Outcome;
  trigger: string | null;
  paused: boolean | null;
  did: string[] | null;
  recovered: boolean;
  note: string;
  /** SOS: how strong it was at the start */
  st?: 'low' | 'mid' | 'high';
  /** SOS: minutes from the first tap to the end */
  m?: number;
  /** SOS: each tool tried, with what happened next (p passed, s still strong, x slipped) */
  tr?: [string, 'p' | 's' | 'x'][];
  /** SOS: stopped partway */
  sp?: true;
  rk?: Rekindle;
  /** minutes waited before a slip, as the steps the older rules count (rkWaitOf) */
  wt?: 0 | 5 | 10 | 20 | null;
  /** a slip: the exact minutes waited first, from the slip's "Did you wait first?" slider (0 to 30, where 30 is 30 or more) */
  wm?: number;
  /** an older build's answer on a slip that ended a long run (the old rule in runLedger reads it): true keep the run going, false start fresh */
  keep?: boolean;
  /** a slip: the feeling named for before it, a word from the field of feelings (slip.ts) */
  fb?: string;
  /** a slip: how it felt afterwards (Rekindle's words, RK_FEELS) */
  fa?: 'shame' | 'giveup' | 'angry' | 'flat' | 'pull' | 'okay';
}

export interface Checkin {
  /* the check-in asks three numbers since October 24, 2026: mood (md), urges (u) and stress (s). Motivation, connection and
     energy were asked before; days that hold them keep them and still show them. md and u are kept only when answered. */
  md?: number | null; // mood 0-10: how today felt (10 good)
  u?: number | null; // urges 0-10: how strong (10 strong)
  m: number | null; // motivation 0-10 (asked before October 24, 2026)
  c: number | null; // connection (asked before)
  e: number | null; // energy (asked before)
  s: number | null; // stress
  h: number | null; // hours slept the night before
  so: 'Y' | 'N' | null; // screens off on time that night
  ro: 'Y' | 'N' | null; // reached out
  n: string;
  done: boolean;
  at: number;
}

/** the small "play" record for a day: wind-down ticks, reached out, calm moves, morning check, tools, lessons, phone away, routine overrides */
export interface Play {
  w: number[];
  wd: boolean;
  r: boolean;
  c: number;
  m: boolean;
  tl: string[];
  po: Clock | null;
  ls: string[];
  lv: string[];
  ov: Record<string, boolean>;
  /** Talk it through: the talk-throughs made this day */
  tt?: Talk[];
  /** Name the feeling: each feeling named this day, and when (ms) */
  fe?: [string, number][];
  /** a hard hour held this day (risk.ts): the hour it started */
  hw?: number;
  /** when the day's last lesson was finished or read again (ms): the lesson reminder comes about then, a day later (nudges.ts) */
  lt?: number;
  /** the app was opened this day (away.ts): the person was here. It earns nothing and does not start the log. */
  o?: true;
  /** How are you feeling today? (day-feel.ts): the step from 1 (Rough) to 5 (Great), and when it was answered (ms). It earns nothing and does not start the log. */
  df?: [1 | 2 | 3 | 4 | 5, number];
}

export interface Day {
  d: DayKey;
  events: DayEvent[];
  checkin: Checkin | null;
  p: Play | null;
  /** last change, in ms, for sync */
  u: number;
  /** a mark for each entry deleted from this day (mutate.ts goneMark, a one-way code of its id), so when two devices changed
      the same day, sync joins them entry by entry and a deleted entry is not brought back by the other device's copy
      (sync.ts mergeDay). Absent when nothing was deleted. */
  gone?: string[];
}

export type Days = Record<DayKey, Day>;

export interface Review {
  k: string;
  a: { hard: string; helped: string; change: string; proud: string };
  u: number;
  /** a Sunday review (key "s" and its Sunday): what worked, what to change, and one goal (sunday.ts) */
  sun?: SunReview;
}

export type Reviews = Record<string, Review>;

export type CountMode = 'strict' | 'gentle' | 'step';

export interface Settings {
  v: 1;
  start: DayKey;
  day1: DayKey | null;
  /** a Day 1 the person picked by hand, which the log's start never moves (actions.ts startFromLog) */
  d1Hand?: DayKey | null;
  /** a tracking start picked by hand, which the log's start never moves */
  startHand?: DayKey | null;
  rollover: number;
  screensOff: Clock;
  goal: string;
  why: string;
  loop: string;
  rule: string;
  safePerson: string;
  /** who I am becoming: one sentence in the person's own words, from the end of setup or My plan. Today and SOS show it. */
  becoming: string;
  ask: string;
  safety: boolean[];
  help: boolean[];
  plan: { when: string; then: string }[];
  slipPlan: string[];
  therapist: { names: string[]; checks: boolean[][] };
  reasons: string[];
  rmeta: { t: string; c: string }[];
  learn: {
    notes: Record<string, string>;
    faith: 'mix' | 'first' | 'after';
    faithSet: boolean;
    len: '' | 'q' | 'f';
    prac: Record<string, 1>;
    picks: Record<string, string>;
    wr: Record<string, { a: string[]; u: number }>;
    /** lessons read before the path reached them whose welcome back was passed ("Keep going", lessons.ts lessonReach).
        A marker only: no points. Left out when empty. */
    back?: Record<string, 1>;
  };
  words: string[];
  menu: string[];
  wind: string[];
  celebrate: boolean;
  /** what was already celebrated, and the floors that keep earned things earned. pts: the most points ever shown, kept
      when a change would lower them (miles.ts keepPoints) */
  seen: { badges: string[]; quests: string[]; level: number; full: DayKey | null; lad: number; pts?: number; longest?: number } | null;
  opts: { trig: { id: string; t: string; off?: true }[]; did: { id: string; t: string; off?: true }[] };
  cleanMode: CountMode;
  /** switch for me: Daybook moves between step down and counting days as the log changes (false: leave it) */
  cleanAuto: boolean;
  /** the note Today shows once after counting changed by itself: to step down ('step'), to counting days ('count'), or the
      old gentle switch ('gentle') */
  cleanNote: { on: DayKey; m: 'step' | 'count' | 'gentle' } | null;
  cleanHold: DayKey | null;
  /** the day this person first opened the one-count rule: slips up to it keep the rule they were made under (runLedger, miles.ts keepCounts) */
  countFrom?: DayKey;
  stepAt: DayKey | null;
  stepNo: DayKey | null;
  stepGrad: DayKey | null;
  routine: Record<string, boolean>;
  note: string;
  urPin: string | null;
  /** SOS: the tools not to suggest ("Not for me"), and what was said after using each ("Would you use this again?", -3 to 3).
      Optional, so older records need no change; read them with urOffOf and urLikeOf. */
  urOff?: string[];
  urLike?: Record<string, number>;
  onb: { n: number; at: number; a: Record<string, unknown>; hist: { d: DayKey; s: number }[] } | null;
  /** the day graduation was earned (see graduate.ts). Set once and never cleared. Optional, so older records need no change. */
  gradAt?: DayKey | null;
  /** the last "Not now" on the account card (see accounts.ts) */
  acctNo?: DayKey | null;
  /** the first day the app marked the days it was opened (away.ts); the quiet-day rule counts from here. Set once. */
  awayFrom?: DayKey | null;
  /** the answers about gaps away (away.ts): n, the slips while away. Optional. (The first version kept `a` instead.) */
  away?: { from: DayKey; to: DayKey; n?: number; a?: 'clean' | 'some' | 'skip' }[];
  /** the day the first week's look back was opened (week.ts). Optional. */
  wk1?: DayKey | null;
  /** the day the "tell your safe person you started" card on Day 1 was answered (rekindle.ts). Optional. */
  toldStart?: DayKey | null;
  /** the day the one tip ask on Today was answered (see support.ts). Optional, so older records need no change. */
  tipAsk?: DayKey | null;
  /** the day a moment of earned value last carried a tip ask (see support.ts). Optional. */
  tipMo?: DayKey | null;
  /** the supporter record on this device (supporter.ts). Optional, so older records need no change. */
  sup?: Supporter | null;
  /** the answer to "Do you like Daybook so far?" at the end of setup, and the day (see like.ts). Optional. */
  likeAsk?: { a: 'yes' | 'no'; d: DayKey } | null;
  u: number;
}

/** everything the person has, in one piece: what a backup file holds and what sync moves */
export interface Snapshot {
  settings: Settings | null;
  days: Days;
  reviews: Reviews;
  /** the journal's entries (journal-entries.ts). Optional, so a snapshot from before the journal needs no change. */
  journal?: Journal;
}
