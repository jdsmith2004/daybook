/* What Daybook learns (the owner, November 9, 2026): "track as much as we can so we can improve the app", kept anonymous,
   never the journal or notes, never sold, only for making the app better. The counts in pulse.ts stay as they were; this is
   the event stream beside them.

   - Each phone has an install id: 16 random bytes made the first time (the app passes them in; this file is pure). It is
     kept apart from the log: never synced, never in a backup, an export or Obsidian, and never sent with a sync request or a
     push token. Turning it off, or Delete everything, makes a new one.
   - An event is a fixed name (EV_NAMES), the days since install, the local hour of the day (0 to 23, never minutes), and
     props whose keys are fixed (EV_PROPS) and whose values are a whole number in the key's range, yes or no, or a string
     from the key's own list. A string is never free: a custom trigger goes as "other", and anything typed by the person
     never fits any list. So no word the person wrote can leave, by construction.
   - Never sent: the journal, notes, voice notes, the plan's words, Talk it through, reasons, any typed text, names, email,
     the account id, Apple's id, a push token, Apple Health's nights, exact times, location, the device model.
   - Every event and value is on the privacy page (apps/mobile/public/privacy.html). A new one goes on both in the same change.
   - The server checks each batch with eventsClean, the same rules (services/api/src/events.ts), and keeps it for 2 years. */
import { AB_ARMS, AB_TEST_IDS } from './ab';
import { LESSONS, TOOLS, TRIGGERS } from './legacy/core.js';
import { NUDGE_KINDS } from './nudges';
import { OB_PAGES } from './setup';
import { TIP_TIER_IDS } from './supporter';
import type { DayKey } from './types';

/* ---------- the list ---------- */
/** every event, and what it means (for the privacy page and "See exactly what is sent") */
export const EV_NAMES = {
  /* the app */
  open: 'Opened Daybook (cold: started fresh)',
  leave: 'Left Daybook (secs: how long it was open, route: the screen it was left from)',
  screen: 'Opened a screen (route)',
  screen_left: 'Left a screen for another (route, secs: how long it was on)',
  chart_seen: 'A chart was shown (chart, secs: how long, locked)',
  error: 'Something went wrong (err: which part)',
  day: 'Once a day, where things stand (mode, count, no-slip days, urges ridden out and slips in the last 30 days, level, points, badges, flame form, burning low, reminders, account, sync, supporter, Apple Health connected, faith, habit, language, OS version)',
  /* setup */
  setup_page: 'Reached a setup page (page)',
  setup_pick: 'Picked a choice on a setup page (page, ix: which choice)',
  setup_skip: 'Skipped a setup question (page)',
  setup_done: 'Finished setup',
  /* lessons */
  lesson_open: 'Opened a lesson (lesson)',
  lesson_beat: 'Reached a part of a lesson (lesson, beat)',
  lesson_pick: 'Picked an answer in a lesson (lesson, beat, ix)',
  lesson_done: 'Finished a lesson (lesson, secs)',
  lesson_left: 'Left a lesson before the end (lesson, beat)',
  /* SOS and the tools */
  sos_open: 'Opened SOS (from: where)',
  sos_end: 'SOS ended (outcome, secs, str: how strong the urge was)',
  sos_tool: 'In SOS, a tool was tried, and what came after it (tool, outcome: passed, still strong, or slipped)',
  tool_open: 'Opened a tool (tool)',
  tool_done: 'Finished a tool (tool)',
  talk_done: 'Finished Talk it through (secs)',
  /* the log */
  urge: 'Logged an urge (str, trigger, outcome)',
  slip: 'Logged a slip (trigger, hrs: hours since the slip before, in bands; after and nh: a reminder that came in the hour before the slip, its kind and the hour it came)',
  happened: 'Used Already happened',
  planning: 'Used Planning a slip?',
  rekindle: 'Did a Rekindle step (step)',
  comeback: 'Came back from a slip: all three of its flames lit',
  checkin: 'Saved a check-in (mood, sleep, str)',
  recheck: 'Answered the monthly five questions (q1 to q5)',
  free: 'Answered "How much do you see yourself as someone free of this?" (free: 0 to 10; rode30 and slips30: urges ridden out and slips in the last 30 days)',
  sunday: 'Finished the Sunday review',
  wind: 'Said Goodnight in the wind-down',
  /* the flame */
  level_up: 'Reached a new level (lvl)',
  form: 'The flame reached a new form (ix)',
  flame_low: 'The flame started burning lower (low: how low)',
  flame_lit: 'The flame was lit again',
  badge: 'Earned a badge (ix)',
  /* reminders */
  nudge: 'Got a reminder (kind, nh: the hour it came)',
  nudge_tap: 'Opened Daybook from a reminder (kind, nh: the hour it came)',
  nudge_did: 'Did what a reminder was for, that day (kind)',
  /* money and accounts */
  ask: 'Was shown an ask (what)',
  ask_tap: 'Tapped an ask (what)',
  bought: 'Bought a tip or Daybook Pattern (tier)',
  account: 'Made an account (how)',
  sync_on: 'Turned sync on',
  feedback: 'Sent feedback (never the words here)',
  /* word tests (ab.ts) */
  ab: 'Was shown one wording of a line being tested (test, arm)',
} as const;
export type EvName = keyof typeof EV_NAMES;

type Prop = { int: [number, number] } | { bool: true } | { one: () => readonly string[] };
const int = (a: number, b: number): Prop => ({ int: [a, b] });
const bool: Prop = { bool: true };
const one = (f: () => readonly string[]): Prop => ({ one: f });

/** the screens, by route name (never a route's parameters) */
export const EV_ROUTES = [
  'today',
  'learn',
  'pattern',
  'more',
  'sos',
  'lesson',
  'tool',
  'log',
  'checkin',
  'talk',
  'plan',
  'journal',
  'entry',
  'notes',
  'reasons',
  'week',
  'weekly',
  'month',
  'review',
  'recheck',
  'wind',
  'night',
  'morning',
  'back',
  'miles',
  'points',
  'growth',
  'badge',
  'graduated',
  'learned',
  'lessons-week',
  'book',
  'day',
  'mode',
  'settings',
  'account',
  'tip',
  'tipped',
  'counts',
  'feedback',
  'privacy',
  'help',
  'whats-new',
  'setup',
  'pause',
  'trail',
  'unlock',
  'stats',
  'other',
] as const;

/** the charts: Pattern's cards, and the charts on the week, the month, the Sunday review, miles and points */
export const EV_CHARTS = [
  'apart',
  'felt',
  'ride',
  'named',
  'when',
  'what',
  'days',
  'helps',
  'week',
  'month',
  'sunday',
  'miles',
  'points',
  'growth',
  'other',
] as const;

/** every prop key, and the values it may take */
export const EV_PROPS: Record<string, Prop> = {
  cold: bool,
  secs: int(0, 86400),
  route: one(() => EV_ROUTES),
  err: one(() => ['sync', 'net', 'store', 'buy', 'sign_in', 'render', 'notify', 'health', 'other']),
  page: one(() => OB_PAGES.map((p) => p.id)),
  ix: int(0, 200),
  lesson: one(() => (LESSONS as { id: string }[]).map((l) => l.id)),
  beat: int(0, 60),
  from: one(() => ['today', 'door', 'nudge', 'widget', 'other']),
  outcome: one(() => ['rode', 'slipped', 'closed', 'resisted', 'strong', 'other']),
  str: int(0, 10),
  tool: one(() => [...(TOOLS as { id: string }[]).map((t) => t.id), 'other']),
  trigger: one(() => (TRIGGERS as [string, string][]).map((t) => t[0])),
  hrs: one(() => ['h0_24', 'd1_3', 'd4_7', 'd8_30', 'd31', 'first']),
  step: one(() => ['small', 'phone', 'plan', 'learn', 'other']),
  mood: int(0, 10),
  sleep: int(0, 16),
  q1: int(0, 10),
  q2: int(0, 10),
  q3: int(0, 10),
  q4: int(0, 10),
  q5: int(0, 10),
  /* the north star (north.ts): the answer, and the last 30 days as two counts */
  free: int(0, 10),
  rode30: int(0, 1000),
  slips30: int(0, 1000),
  lvl: int(0, 1000),
  kind: one(() => NUDGE_KINDS),
  /* a reminder: the hour it came; on a slip, the kind of reminder that came in the hour before it */
  nh: int(0, 23),
  after: one(() => NUDGE_KINDS),
  /* a word test, and the wording shown (ab.ts) */
  test: one(() => AB_TEST_IDS),
  arm: one(() => AB_ARMS),
  what: one(() => ['tip', 'pattern', 'account', 'rate', 'sos', 'happened', 'planning', 'lesson', 'checkin', 'plan', 'journal', 'rekindle', 'idea', 'other']),
  chart: one(() => EV_CHARTS),
  locked: bool,
  tier: one(() => [...TIP_TIER_IDS, 'pattern_month', 'pattern_life', 'pattern_life_more', 'web', 'other']),
  how: one(() => ['apple', 'email', 'other']),
  /* the day's snapshot */
  mode: one(() => ['strict', 'gentle', 'step']),
  count: int(0, 100000),
  ns28: int(0, 28),
  pts: int(0, 10000000),
  badges: int(0, 1000),
  low: int(0, 5),
  rem: bool,
  acct: bool,
  sync: bool,
  sup: bool,
  health: bool,
  faith: one(() => ['mix', 'first', 'after', 'unset']),
  habit: one(() => ['porn', 'alcohol', 'gambling', 'other', 'unset']),
  lang: one(() => LANGS),
  os: int(0, 100),
};
/** languages by their two letters: a short fixed list, anything else is "other" */
const LANGS = ['en', 'es', 'pt', 'fr', 'de', 'it', 'nl', 'ru', 'uk', 'pl', 'tr', 'ar', 'hi', 'id', 'ja', 'ko', 'zh', 'vi', 'th', 'tl', 'other'] as const;
/** the two letters of a locale, or "other" */
export const evLang = (locale: string | null | undefined): string => {
  const l = String(locale || '')
    .slice(0, 2)
    .toLowerCase();
  return (LANGS as readonly string[]).includes(l) ? l : 'other';
};
/** a big number to two figures (12,345 is 12,000), so a total cannot be matched to one person's records */
export const evRound = (n: number): number => (!Number.isFinite(n) || n < 100 ? Math.round(n) : Number(n.toPrecision(2)));
/** hours since the slip before, as a band (null: there was none) */
export const evHrsBand = (hours: number | null): string =>
  hours == null ? 'first' : hours < 24 ? 'h0_24' : hours < 96 ? 'd1_3' : hours < 192 ? 'd4_7' : hours < 744 ? 'd8_30' : 'd31';

const sets = new Map<string, Set<string>>();
const setOf = (k: string, p: { one: () => readonly string[] }) => {
  let s = sets.get(k);
  if (!s) sets.set(k, (s = new Set(p.one())));
  return s;
};
export type EvProps = Record<string, string | number | boolean>;
/** the props as the list allows them: unknown keys dropped, numbers rounded and held to their range, strings only from their
    list (a string not on it becomes "other" where the list has one, or is dropped) */
export function evProps(x: unknown): EvProps {
  const out: EvProps = {};
  if (!x || typeof x !== 'object') return out;
  for (const [k, v] of Object.entries(x as Record<string, unknown>).slice(0, 40)) {
    const p = EV_PROPS[k];
    if (!p) continue;
    if ('int' in p) {
      if (typeof v !== 'number' || !Number.isFinite(v)) continue;
      out[k] = Math.max(p.int[0], Math.min(p.int[1], Math.round(v)));
    } else if ('bool' in p) {
      if (typeof v === 'boolean') out[k] = v;
    } else if (typeof v === 'string') {
      const s = setOf(k, p);
      if (s.has(v)) out[k] = v;
      else if (s.has('other')) out[k] = 'other';
    }
  }
  return out;
}

/* ---------- on the device ---------- */
/** one event: its place in this phone's stream (so what came next can be read), name, days since install, local hour, props */
export interface Ev {
  k: number;
  n: EvName;
  d: number;
  h: number;
  p?: EvProps;
}
export interface EvState {
  /** the install id, 32 hex characters */
  id: string;
  /** the day it was made */
  first: DayKey;
  /** waiting to go, oldest first */
  q: Ev[];
  /** how many events came before q[0] (sent, or let go when too many waited), so a batch takes off only what it carried */
  at: number;
}
export interface EvBatch {
  i: string;
  p: 'ios' | 'android' | 'web';
  v: string;
  e: Ev[];
}
/** events that wait on the phone at most (a phone offline for weeks keeps the newest) */
export const EV_KEEP = 3000;
/** events in one batch at most */
export const EV_BATCH = 400;
/** the largest batch the server takes, in bytes */
export const EV_BODY = 64_000;

const ID = /^[0-9a-f]{32}$/;
/** a fresh state; hex is 32 random hex characters from the phone */
export const evNew = (today: DayKey, hex: string): EvState => ({ id: ID.test(hex) ? hex : '0'.repeat(32), first: today, q: [], at: 0 });

/** a state read back from the phone, made safe (anything odd becomes a fresh one with the hex given) */
export function evNorm(x: unknown, today: DayKey, hex: string): EvState {
  const s = x as Partial<EvState> | null;
  if (!s || typeof s !== 'object' || typeof s.id !== 'string' || !ID.test(s.id) || typeof s.first !== 'string') return evNew(today, hex);
  const q = Array.isArray(s.q) ? s.q.map(evOne).filter((e): e is Ev => !!e) : [];
  const at = typeof s.at === 'number' && Number.isInteger(s.at) && s.at >= 0 ? s.at : 0;
  return { id: s.id, first: s.first, q: q.slice(-EV_KEEP), at: at + Math.max(0, q.length - EV_KEEP) };
}

function evOne(x: unknown): Ev | null {
  const e = x as Partial<Ev> | null;
  if (!e || typeof e !== 'object' || typeof e.n !== 'string' || !(e.n in EV_NAMES)) return null;
  const k = typeof e.k === 'number' && Number.isInteger(e.k) && e.k >= 0 && e.k < 1e9 ? e.k : null;
  const d = typeof e.d === 'number' && Number.isFinite(e.d) ? Math.max(0, Math.min(100000, Math.round(e.d))) : null;
  const h = typeof e.h === 'number' && Number.isInteger(e.h) && e.h >= 0 && e.h <= 23 ? e.h : null;
  if (k == null || d == null || h == null) return null;
  const p = evProps(e.p);
  return Object.keys(p).length ? { k, n: e.n as EvName, d, h, p } : { k, n: e.n as EvName, d, h };
}

function daysBetween(a: DayKey, b: DayKey): number {
  const t = (k: DayKey) => Date.UTC(+k.slice(0, 4), +k.slice(5, 7) - 1, +k.slice(8, 10));
  return Math.round((t(b) - t(a)) / 86400000);
}

/** add an event. today: the Daybook day; hour: the local hour (0 to 23). A name not on the list is dropped. */
export function evAdd(s: EvState, n: EvName, today: DayKey, hour: number, p?: Record<string, unknown>): EvState {
  const e = evOne({ k: s.at + s.q.length, n, d: Math.max(0, daysBetween(s.first, today)), h: Math.floor(hour), p });
  if (!e) return s;
  const drop = Math.max(0, s.q.length - EV_KEEP + 1);
  return { ...s, q: [...s.q.slice(drop), e], at: s.at + drop };
}

/** what to send now, oldest first, and where it ends in the stream (for evSent); null when nothing waits */
export function evBatch(s: EvState, p: EvBatch['p'], v: string): { b: EvBatch; upTo: number } | null {
  if (!s.q.length) return null;
  const e = s.q.slice(0, EV_BATCH);
  return { b: { i: s.id, p, v: VER.test(v) ? v : '0', e }, upTo: s.at + e.length };
}

/** a batch went: what it carried comes off (anything added while it was on its way stays, even if older ones were let go) */
export function evSent(s: EvState, upTo: number): EvState {
  const n = Math.max(0, Math.min(s.q.length, upTo - s.at));
  return n ? { ...s, q: s.q.slice(n), at: s.at + n } : s;
}

/* ---------- on both ends ---------- */
const VER = /^[0-9A-Za-z.+-]{1,24}$/;
/** a batch as the server takes it: a well-formed id, a platform, at most EV_BATCH events, each on the list with its props
    checked. Null when nothing is left. */
export function eventsClean(x: unknown): EvBatch | null {
  const b = x as Partial<EvBatch> | null;
  if (!b || typeof b !== 'object' || typeof b.i !== 'string' || !ID.test(b.i) || !Array.isArray(b.e)) return null;
  const p = b.p === 'ios' || b.p === 'android' || b.p === 'web' ? b.p : null;
  if (!p) return null;
  const v = typeof b.v === 'string' && VER.test(b.v) ? b.v : '0';
  const e = b.e
    .slice(0, EV_BATCH)
    .map(evOne)
    .filter((x): x is Ev => !!x);
  return e.length ? { i: b.i, p, v, e } : null;
}

/** every value a prop may take, in words, for the privacy page */
export function evPropMeaning(k: string): string {
  const p = EV_PROPS[k];
  if (!p) return '';
  if ('int' in p) return 'a number from ' + p.int[0] + ' to ' + p.int[1];
  if ('bool' in p) return 'yes or no';
  return 'one of: ' + [...p.one()].join(', ');
}
