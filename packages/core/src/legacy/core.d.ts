/* Types for core.js. Only what the new app uses is declared here; add a line when you need another export.
   The shapes follow the legacy functions exactly. The golden tests check the behavior. */
import type { Days, Day, DayEvent, DayKey, Settings, Reviews, CountMode, Checkin, Play } from '../types';
import type { Lesson, Unit } from '../lessons';
import type { Level } from '../levels';

export type DayKindName = 'ok' | 'one' | 'slip' | 'before' | 'ahead' | 'unknown';

/* ---------- dates ---------- */
export function p2(n: number): string;
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
/** days after a slip in which its Rekindle quest can still save the run */
export const RK_DAYS: number;
/** a slip that ends a run this long or longer asks: keep the run going, or start fresh */
export const RUN_ASK: number;
/** slips on days before this keep the rule they were made under: a run of any length could be saved */
export const RUN_ASK_FROM: DayKey;
/** slips from this day on can also save a run by coming back: the sunrise check, and the third flame lighting by itself */
export const RK_BACK_FROM: DayKey;
/** the third comeback flame for the slip on day k, as of today: the next urge ridden out, or a full day with no slip */
export function rkThirdOf(days: Days, k: DayKey, st: Settings | null, today: DayKey): { k: DayKey; rode: boolean } | null;
/** the keep-or-start-fresh answer on a slip day: true keep, false start fresh, null not answered */
export function rkKeepOf(day: Day | undefined | null): boolean | null;
export function dayKind(key: DayKey, day: Day | undefined, st: Settings, today: DayKey, mode?: CountMode, days?: Days): DayKindName;
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
export function runLedger(days: Days, st: Settings, today: DayKey, mode?: CountMode, noSave?: boolean, runs?: Record<DayKey, number>): RunLedger;
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
export function weekGame(days: Days, st: Settings, k: number): { reach: number; lights: number; calm: number; checkin: number; wind: number; tools: number };
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
): { stops: RhythmStop[]; cur: string | null; windMin: number; offMin: number; leftToOff: number; mi: MorningInfo };
export function dailyNote(key: DayKey): string;
export const TRIGGERS: [string, string][];
export const DIDS: [string, string][];
export const OPT_MAX: number;
export const OPT_KEEP: number;
export const OPT_LEN: number;
export function cleanOptLabel(v: unknown): string;
export function optText(kind: 'trig' | 'did', id: string, opts: Settings['opts'] | null | undefined): string;
export function trigText(id: string, opts: Settings['opts'] | null | undefined): string;
export function didText(id: string, opts: Settings['opts'] | null | undefined): string;
export const TRIG_T: Record<string, string>;
export const DID_T: Record<string, string>;
export function didIds(v: unknown): string[];
export function didToggle(cur: unknown, id: string): string[];
export function didAdd(cur: unknown, id: string): string[];
export function trigFits(id: string, time: string | null): boolean;
export function optList(
  kind: 'trig' | 'did',
  opts: Settings['opts'] | null | undefined,
  o: { time?: string | null; sel?: string | string[] | null; all?: boolean; notSure?: boolean },
): { list: [string, string][]; hidden: number };
export const URGE_PLAN: [string, string][];
export const SLIP_STEPS: string[];
export const TOOL_IDS: string[];

/* ---------- the flame ---------- */
export const Em: {
  emblem(level: number, o?: { size?: number; still?: boolean; locked?: boolean }): string;
  stage(level: number): number;
  tier(level: number): number;
};

/* ---------- lessons and setup ---------- */
export const LESSONS: Lesson[];
export const OB_THEN: Record<string, [number, string, string, string[]]>;
export const OB_GOALS: { id: string; t: string; s: string; ic: string; goal: string; d1: number; mode: CountMode }[];
export function normOnb(o: unknown): Settings['onb'];
/** an answer: [id, label, ...]. Some lists add an icon, a number, or words for a sentence. */
export type ObOpt = [string, string, ...(string | number)[]];
export const OB_SECS: [string, string, string, string][];
export const OB_AIM: [string, string, string][];
export const OB_FREQ: [string, string, number, string][];
export const OB_MINS: [string, string, number, string][];
export const OB_YEARS: [string, string, number][];
export const OB_TRIED: [string, string, string][];
export const OB_FAITH: [string, string, string][];
export const OB_BPS: string[];
export const OB_BPS_C: [string, string][];
export const OB_COST: [string, string, string][];
export const OB_WHEN: [string, string, string][];
export const OB_TOP: string[];
export const OB_PEAK: Record<string, number>;
export const OB_SO: string[];
export const OB_GWHY: Record<string, { h: string; p: string; f: string; src: string }>;
export const OB_RS: Record<string, string[]>;
export const OB_RS_BASE: string[];
export const OB_BIBLE_H: number;
export const OB_LANG_H: number;
export const OB_GUESS: number[];
export const OB_SRC: Record<string, [string, string]>;
export const OB_KEYS: string[];
export const REASON_DEFAULT: string[];
export function obLab(list: ObOpt[], v: unknown): string;
export function obCap(s: string): string;
export function obScore(a: Record<string, unknown>): { s: number; n: number };
export interface ObHours { f: [string, string, number, string]; m: [string, string, number, string]; wk: number; yr: number; ten: number; past: number | null }
export function obHours(a: Record<string, unknown>): ObHours | null;
export function obRnd(h: number): number;
export function obHrs(h: number): string;
export function obTop(a: Record<string, unknown>): string;
export function obTool(t: string): Tool;

/* ---------- icons ---------- */
export const ICO: Record<string, string>;

/* ---------- SOS and the tools (picked by name from the legacy app) ---------- */
export interface Tool {
  id: string;
  name: string;
  desc: string;
  ic: string;
  tone: 'sky' | 'mint' | 'accent' | 'sun' | 'violet' | 'coral';
  g: 'calm' | 'ride' | 'scene' | 'connect';
}
export const TOOLS: Tool[];
export const TOOL_GROUPS: [Tool['g'], string][];
export const UR_STR: ['low' | 'mid' | 'high', string][];
export const UR_STR_NAME: Record<string, string>;
export const UR_STR_ADJ: Record<string, string>;
export const UR_DID: Record<string, string>;
export const UR_META: Record<string, { mins: string; does: string }>;
export const UR_FIT: Record<string, Record<string, number>>;
export const UR_STRN: Record<string, Record<string, number>>;
export const UR_PREF: string[];
export const UR_TRIG_PH: Record<string, string>;
export const UR_BED_WITH: string[];
export const UR_DO: Record<'base' | 'night' | 'high' | 'again' | 'sets', string[]>;
export const UR_KNOW: { t: string; l?: string; f?: string[] }[];
export const UR_LPREF: Record<string, string[]>;
export const UR_TR_T: Record<string, string>;
export function urRate(r: { n: number; w: number } | null | undefined): number;
export function urLift(r: { n: number; w: number; l: number } | null | undefined): number;
export function urMinText(m: number): string;
export const PATTERNS: Record<'calm' | 'box' | 'slow' | 'sigh', { name: string; desc: string; ph: [string, number][] }>;
export const PH_TXT: Record<string, string>;
export function breathPhase(pat: string, sec: number): { idx: number; k: string; dur: number; left: number };
export const DONE_MSG: Record<string, string>;
export const PAUSE_MS: number;
export const CU_BODY: [string, string][];
export const CU_FEEL: [string, string][];
export const CU_WHERE: Record<string, string>;
export const CU_CHG: [string, string][];
export const CU_SAY: Record<string, string>;
export const CU_MS: number;
export const CU_D: string;
export const GROUND: [number, string, string][];
export const NEEDS: [string, string, string, [string, string] | null][];
export const MOVES: [string, string, string][];
export const MOVE_MS: number;
export const FWD_A: [string, string][];
export const FWD_B: [string, string][];
export const THOUGHTS: [string, string][];
export function thoughtIn(t: string): string;
export const BED: [string, string, string][];
export const TEXTS: string[];
export const FREE_LINES: [string, string, string, string][];
export function eventsOf(days: Days, fromKey?: DayKey): (DayEvent & { key: DayKey })[];
export const LESSON_IDS: string[];
export const RCATS: { id: 'rel' | 'foc' | 'val' | 'oth'; name: string; ic: string; tone: string; words: RegExp | null }[];
export function reasonGuess(text: string): (typeof RCATS)[number];
export function reasonCat(st: Settings | null, text: string): (typeof RCATS)[number];
export const MENU_DEFAULT: string[];
export function cleanReason(s: unknown): string;
export function sameReason(a: string, b: string): boolean;
export const REASON_MAX: number;
export const REASON_LEN: number;
export const WORDS_MAX: number;
export const WORDS_LEN: number;
export const LNOTE_LEN: number;
export const FAITH_IDS: string[];
export const FAITH_MODES: string[];

/* ---------- the day and the lessons (picked) ---------- */
export const STOP_IC: Record<string, string>;
export const STOP_WHEN: Record<string, string>;
export const HX_NEXT: Record<string, { ic: string; t?: string; s?: string; pts: number }>;
export const CHEERS: string[];
export const WIN_WHY: Record<string, string>;
export const LX_E: Record<string, [string, string]>;
export const LCHECK_N: number;
export const LWRITE_LEN: number;
export const LCHECKS: { t: string; q: string[] }[];
export const LIST_OF: Record<string, [string, number, string]>;
export function slipClean(a: unknown[] | null | undefined): string[];
export const SLIP_MAX: number;
export const SLIP_LEN: number;
export const SAFETY: [string, string][];
export const HELP_STEPS: string[];
export const THERAPIST_CRIT: string[];
/** scripts to copy: [title, text] */
export const SCRIPTS: [string, string][];
export type HelpPage = 'people' | 'therapy' | 'groups' | 'faith' | 'phone' | 'say' | 'plan' | 'playbook';
export const HELP_PAGES: Record<HelpPage, { t: string; s: string; ic: string; tone: string; tile: string }>;
export const HELP_SUBS: Record<'therapy' | 'phone' | 'plan', [string, string][]>;
export const HELP_SRC: [string, string][];
export const LUNITS: Unit[];
export const SRC: Record<string, [string, string, string?, string?]>;
export function topTrigger(evs: DayEvent[], opts: Settings['opts']): { t: string; n: number } | null;
export interface MorningInfo {
  applies: boolean;
  prev: DayKey;
  so: 'Y' | 'N' | null;
  h: number | null;
  done: boolean;
  m: boolean;
  po: string | null;
}
export function morningInfo(days: Days, st: Settings, key: DayKey): MorningInfo;
export const ROUTINE: { k: string; name: string; sub: string; on: boolean }[];
export const ROUTINE_KEYS: string[];
export function normRoutine(r: unknown): Record<string, boolean>;
export function routineOn(st: Settings | null, p: Play | null | undefined, k: string): boolean;
export function fmtLeft(mins: number): string;
export function minToClock(m: number): string;
export const LESSON_WIN_FROM: DayKey;
/* ---------- the journal ---------- */
export interface Metrics {
  days: number;
  checkins: number;
  urges: number;
  rode: number;
  slips: number;
  recovered: number;
  pauses: number;
  pauseRate: number | null;
  cleanDays: number;
  counted: number;
  slipDays: number;
  cur: number;
  longest: number;
  reached: number;
  safety: number;
  help: number;
}
export function computeMetrics(days: Days, st: Settings, today: DayKey): Metrics;
export const STATUS_TXT: Record<string, string>;
export function rangeLabel(lo: DayKey, hi: DayKey): string;
export function pct(v: number | null | undefined): string;
export function one(v: number | null | undefined): string;
export const SERIES: ['m' | 'c' | 'e' | 's', string][];
export const REVIEW_QS: ['hard' | 'helped' | 'change' | 'proud', string][];
export function rangeKeys(range: string, st: Settings, today: DayKey, days: Days): DayKey[];
export function rangeStart(range: string, st: Settings, today: DayKey, days: Days): DayKey;
export function perDayCounts(days: Days, keys: DayKey[]): { key: DayKey; rode: number; slipped: number }[];
export function timesPerDay(days: Days, keys: DayKey[]): { counts: [number, number, number, number]; logged: number };
export function hourBins(evs: DayEvent[], roll: number): { h: number; rode: number; slipped: number }[];
export function bucketOf(t: string): string;
export const BUCKETS: [string, string, string][];
export const BUCKET_T: Record<string, string>;
export function triggerCounts(evs: DayEvent[], opts: Settings['opts']): { k: string; t: string; rode: number; slipped: number }[];
export function patterns(days: Days): { cleanN: number; slipN: number; rows: { label: string; kind: 'avg' | 'pct'; clean: number | null; slip: number | null; gap: number | null }[] };
export function daysCsv(days: Days, st: Settings, today: DayKey): string;
export function eventsCsv(days: Days, st: Settings): string;
export function statusOf(key: DayKey, d: Day | undefined, st: Settings, tk: DayKey, days?: Days): string;
