/* Types for the generated core.js. Only what the new app uses is declared here; add a line when you need another export.
   The shapes follow the legacy functions exactly. The golden tests check the behavior. */
import type { Days, Day, DayEvent, DayKey, Settings, Reviews, CountMode, Checkin, Play } from '../types';

export type DayKindName = 'ok' | 'one' | 'slip' | 'before' | 'ahead';

/* ---------- dates ---------- */
export function keyOfDate(d: Date): DayKey;
export function addDays(key: DayKey, n: number): DayKey;
export function diffDays(a: DayKey, b: DayKey): number;
export function logicalKey(ms: number, roll: number): DayKey;
export function clockOf(ms: number): string;
export function fmtClock(t: string | null): string;
export function fmtHour(h: number): string;
export function fmtDate(key: DayKey, o?: Intl.DateTimeFormatOptions): string;
export function isKey(k: unknown): k is DayKey;
export function isTime(t: unknown): t is string;
export function maxKey(a: DayKey, b: DayKey): DayKey;
export function minKey(a: DayKey, b: DayKey): DayKey;
export function newId(): string;
export function weekOf(key: DayKey, st: Settings): number;
export function weekRange(k: number, st: Settings): [DayKey, DayKey];

/* ---------- the data model ---------- */
export function defaultSettings(startKey: DayKey): Settings;
export function normSettings(s: unknown): Settings;
export function normEvent(e: unknown): DayEvent;
export function normCheckin(c: unknown): Checkin | null;
export function normP(p: unknown): Play | null;
export function blankP(): Play;
export function normDay(d: unknown, key: DayKey): Day;
export function mergeOpts(a: Settings['opts'], b: Settings['opts']): Settings['opts'];
export function sumDay(day: Day | undefined | null): { n: number; rode: number; slipped: number; checked: boolean };
export function sortedEvents(day: Day | undefined | null, roll: number): DayEvent[];
export function allKeys(days: Days): DayKey[];
export function phaseOf(key: DayKey, st: Settings): { p: 'before' | 'tracking' | 'quitting'; n: number };

/* ---------- counting and run saves ---------- */
export const RUN_DEEP: number;
export function dayKind(key: DayKey, day: Day | undefined, st: Settings, today: DayKey, mode?: CountMode): DayKindName;
export function rkFullDays(days: Days): Record<DayKey, 1>;
export interface RunLedger {
  cur: number;
  longest: number;
  clean: number;
  counted: number;
  saves: number;
  kind: Partial<Record<DayKey, 'saved' | 'open'>>;
  open: { k: DayKey; run: number; deep: boolean } | null;
}
export function runLedger(days: Days, st: Settings, today: DayKey, mode?: CountMode, noSave?: boolean): RunLedger;
export function streaks(days: Days, st: Settings, today: DayKey, mode?: CountMode, noSave?: boolean): RunLedger;
export function roughPatch(days: Days, st: Settings, today: DayKey): boolean;
export function reachedOn(d: Day | undefined): boolean;
export interface WeekStats {
  k: number;
  lo: DayKey;
  hi: DayKey;
  checkins: number;
  events: number;
  rode: number;
  slipped: number;
  slipDays: number;
  m: number | null;
  c: number | null;
  e: number | null;
  s: number | null;
  evs: (DayEvent & { key: DayKey })[];
}
export function weekStats(days: Days, st: Settings, k: number): WeekStats;

/* ---------- step down ---------- */
export const STEP_RUNGS: number[];
export function evMs(key: DayKey, time: string | null, roll: number): number;
export function slipMoments(days: Days, st: Settings, upTo?: number): number[];
export function fmtStretch(h: number): string;
export function fmtStretchShort(h: number): string;
export function slipsInWeek(days: Days, st: Settings, w: number): number;
export interface StepView {
  tk: DayKey;
  curH: number;
  best: number;
  bestPast: number;
  bestSince: number;
  usual: number | null;
  goal: number;
  slips: number;
  cw: number;
  thisW: number;
  lastW: number | null;
  target: number | null;
  wSl: number;
  wWait: number;
  hh: { label: string; state: 'before' | 'during' | 'lost' | 'won'; won: number } | null;
  ready: boolean;
  help: boolean;
}
export function stepView(days: Days, st: Settings, nowMs: number): StepView;
export function busiestWindow(
  evs: DayEvent[],
  roll: number,
): { start: number; end: number; n: number; total: number; label: string } | null;

/* ---------- points, levels, wins, quests, badges ---------- */
export const SETUP_PTS: number;
export const STAGES: { name: string; meaning: string; steps: [string, string, string] }[];
export const LEVELS: [number, string, number, number][];
export interface Level {
  n: number;
  name: string;
  floor: number;
  stage: number;
  tier: number;
  step: string;
  meaning: string;
  next: number | null;
  nextName: string | null;
  evolves: boolean;
  frac: number;
  toNext: number;
}
export function levelOf(pts: number): Level;
export function nextLine(l: Level): string;
export const WINS: { k: WinKey; name: string; tip: string; ic: string }[];
export type WinKey = 'morning' | 'lesson' | 'calm' | 'reach' | 'checkin' | 'wind';
export type Wins = Record<WinKey, boolean> & { na: Record<WinKey, boolean> };
export function winsOf(days: Days, key: DayKey, st: Settings): Wins;
export function winTally(w: Wins): { n: number; t: number };
export interface DayPoints {
  total: number;
  parts: { k: string; label: string; pts: number }[];
}
export function dayPoints(days: Days, key: DayKey, st: Settings): DayPoints;
export interface RekindleState {
  k: DayKey;
  ev: DayEvent;
  m1: boolean;
  m2: boolean;
  m3: boolean;
  m4: boolean;
  n: number;
}
export function rkOf(days: Days, k: DayKey, st: Settings): RekindleState | null;
export interface Quest {
  id: string;
  key: string;
  name: string;
  hint: string;
  goal: number;
  unit: string;
  now: number;
  raw: number;
  done: boolean;
  pts: number;
}
export function questsFor(days: Days, st: Settings, k: number): Quest[];
export interface Badge {
  id: string;
  name: string;
  desc: string;
  icon: string;
  tone: string;
  goal: number;
  now: number;
  done: boolean;
}
export interface GameState {
  pts: number;
  rawPts: number;
  perDay: Record<DayKey, number>;
  level: Level;
  badges: Badge[];
  quests: Quest[];
  wins: Wins;
  tally: { n: number; t: number };
  todayPts: DayPoints;
  S: Record<string, number | boolean>;
  week: number;
}
export function gameCompute(days: Days, st: Settings, reviews: Reviews, today: DayKey): GameState;

/* ---------- the day ---------- */
export interface RhythmStop {
  k: 'morning' | 'lesson' | 'evening' | 'night';
  start: number;
  done: boolean;
  title: string;
  when: string;
  startRel: number;
  started: boolean;
  state: 'done' | 'now' | 'next' | 'due' | 'later';
}
export function rhythm(
  days: Days,
  st: Settings,
  tk: DayKey,
  nowMs: number,
): { stops: RhythmStop[]; cur: string | null; windMin: number; offMin: number; leftToOff: number; mi: unknown };
export function dailyNote(key: DayKey): string;
export const TRIGGERS: [string, string][];
export const DIDS: [string, string][];

/* ---------- the flame ---------- */
export const Em: {
  emblem(level: number, o?: { size?: number; still?: boolean; locked?: boolean }): string;
  stage(level: number): number;
  tier(level: number): number;
};

/* ---------- lessons and setup ---------- */
export const LESSONS: { id: string; u: number; title: string; tag: string; ic: string; mins: number; [k: string]: unknown }[];
export const OB_GOALS: { id: string; t: string; s: string; ic: string; goal: string; d1: number; mode: CountMode }[];
export function normOnb(o: unknown): Settings['onb'];

/* ---------- icons ---------- */
export const ICO: Record<string, string>;
