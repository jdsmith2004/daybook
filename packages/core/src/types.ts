/* The data model. One settings record, one record per day, one per weekly review. Every rule in Daybook is worked out from
   these at the time it is shown (points, levels, badges, runs, saves, step down), so nothing derived is ever stored. */
import type { Talk } from './talk';
import type { SunReview } from './sunday';

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
  /** minutes waited before a slip */
  wt?: 0 | 5 | 10 | 20 | null;
}

export interface Checkin {
  m: number | null; // motivation 0-10
  c: number | null; // connection
  e: number | null; // energy
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
  /** a hard hour held this day (risk.ts): the hour it started */
  hw?: number;
}

export interface Day {
  d: DayKey;
  events: DayEvent[];
  checkin: Checkin | null;
  p: Play | null;
  /** last change, in ms, for sync */
  u: number;
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
  };
  words: string[];
  menu: string[];
  wind: string[];
  celebrate: boolean;
  seen: { badges: string[]; quests: string[]; level: number; full: DayKey | null; lad: number } | null;
  opts: { trig: { id: string; t: string; off?: true }[]; did: { id: string; t: string; off?: true }[] };
  cleanMode: CountMode;
  cleanAuto: boolean;
  cleanNote: { on: DayKey; m: 'step' | 'gentle' } | null;
  cleanHold: DayKey | null;
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
  /** the day the one tip ask on Today was answered (see support.ts). Optional, so older records need no change. */
  tipAsk?: DayKey | null;
  u: number;
}

/** everything the person has, in one piece: what a backup file holds and what sync moves */
export interface Snapshot {
  settings: Settings | null;
  days: Days;
  reviews: Reviews;
}
