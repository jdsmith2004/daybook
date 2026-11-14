/* The setup ("How Daybook works"): the answers, the pages, the goal it suggests, and the plan it builds. The questions, scores
   and goals are in the legacy core; the parts of the legacy setup that read the global Store or the clock are ported here as pure
   functions that take the settings and today. Checked against the legacy app by test/setup.test.ts. */
import { freshSettings } from './two-moments';
import {
  addDays,
  cleanReason,
  defaultSettings,
  fmtClock,
  fmtDate,
  isTime,
  OB_BIBLE_H,
  OB_COST,
  OB_FAITH,
  OB_GOALS,
  OB_GWHY,
  OB_KEYS,
  OB_RS,
  OB_RS_BASE,
  OB_SRC,
  OB_THEN,
  OB_TRIED,
  OB_YEARS,
  OB_AIM,
  OB_WHEN,
  OB_FREQ,
  OB_MINS,
  obHours,
  obHrs,
  obRnd,
  obScore,
  obTop,
  obTool,
  REASON_MAX,
  reasonGuess,
  sameReason,
  SRC,
  type ObOpt,
} from './legacy/core.js';
import { changeSettings } from './actions';
import { levelOf } from './levels';
import { OB_CREED } from './faith';
import { FREE_WAIT } from './north';
import { habitIn, habitMedical, habitOf, habitSay, normHabit, OB_HABIT, type Habit } from './habit';
import type { CountMode, DayKey, Settings } from './types';

/** the answers so far. Keys are the legacy ones (aim, freq, mins, years, tried, faith, b0..b4, costs, ownCost, when, goal, so,
    then, thenT, thenOwn, rs, own, person), and be (who I am becoming). */
export interface SetupAnswers {
  /** what the person is quitting (habit.ts); none means porn */
  habit?: string;
  aim?: string;
  freq?: string;
  mins?: string;
  years?: string;
  tried?: string;
  faith?: string;
  /** which faith, after a Yes or a Somewhat (faith.ts) */
  creed?: string;
  costs?: string[];
  ownCost?: string;
  when?: string[];
  goal?: string;
  so?: string;
  then?: string | null;
  thenT?: string;
  thenOwn?: string;
  rs?: string[];
  own?: string;
  person?: string;
  /** who I am becoming: a starter sentence or the person's own */
  be?: string;
  /** the north star's first answer, 0 to 10 (north.ts); no longer asked in setup */
  free?: number;
  /** who it is for (OB_FOR ids, up to three): kept as reasons */
  for?: string[];
  /** the first small goal, picked once the flame is lit: 3 or 7 free nights (CLAUDE.md: no big goals before a clean week) */
  first?: number;
  [k: string]: unknown;
}

/** the goal the setup suggests (legacy obSuggest). The tracking week first, for most people (the owner, November 2, 2026): seven
    days of logging with nothing to fail, then Day 1, set knowing the hard hours. Only "Take back my nights" starts with nights.
    "Quit, starting tomorrow" is still offered to everyone, one tap away. How days count is not part of the goal (obMode). */
export function obSuggest(a: SetupAnswers): string {
  return a.aim === 'nights' ? 'nights' : 'week';
}

/** how days count from the start, from how often the person said it happens: about once a day or more starts in step down
    (a clean run is a hard first goal then, and Daybook moves them to counting days once their stretches get long); anything
    less, or no answer, starts gentle, where a slip takes one day off (the owner, October 30, 2026). Strict puts the count to 0
    on a slip, so it is only ever a choice the person makes, in Settings. */
export const obMode = (a: SetupAnswers): CountMode => (obMostDays(a) ? 'step' : 'gentle');
/** the counting the plan gives: a new person gets obMode. A walk-through keeps the counting the person has: after setup, only
    the log (switching, both ways) and the person in Settings move it, so a walk-through never undoes a choice made there. */
export const obPlanMode = (a: SetupAnswers, st: Settings | null): CountMode => (st ? st.cleanMode : obMode(a));

export type Goal = (typeof OB_GOALS)[number];
/** the goals setup offers: every legacy goal but the two that were about counting ("Step down first", "Cut way back first").
    A walk-through by someone who picked one of those keeps the counting it gave them. */
const SETUP_GOALS: Goal[] = OB_GOALS.filter((g) => g.id !== 'step' && g.id !== 'less');
export const obDate = (k: DayKey | null | undefined) => (k ? fmtDate(k, { weekday: 'short', month: 'short', day: 'numeric' }) : 'not set');
export const obCount = (m: CountMode | string) =>
  m === 'gentle'
    ? 'A slip takes one day off, never all of them'
    : m === 'step'
      ? 'Longer stretches between slips, fewer slips each week'
      : 'A day counts when no slip is logged';

/** counting has started: Day 1 is today or earlier */
export const obStarted = (st: Settings | null, tk: DayKey) => !!(st && st.day1 && st.day1 <= tk);
/** the goals on offer. Once counting has started they keep the Day 1 the person has, and the tracking week is behind them. */
export function obGoals(st: Settings | null, tk: DayKey, h: Habit = habitOf(st)): Goal[] {
  const say = (g: Goal): Goal => (h === 'porn' ? g : { ...g, goal: habitSay(g.goal, h) });
  if (!obStarted(st, tk)) return SETUP_GOALS.map(say);
  const d = obDate(st!.day1);
  return SETUP_GOALS.filter((g) => g.id !== 'week').map((g) =>
    say({
      ...g,
      ...(g.id === 'now'
        ? { t: 'Quit, keep counting', s: 'Day 1 stays ' + d + '.', goal: 'Quit porn. Log honestly, slips included.' }
        : { s: 'Screens off first. Day 1 stays ' + d + '.' }),
    }),
  );
}
/** the habit of a setup in progress: the answer given, or the one kept */
export const obHabit = (a: SetupAnswers, st: Settings | null): Habit => normHabit(a.habit) || habitOf(st);
export const obSug = (a: SetupAnswers, st: Settings | null, tk: DayKey) => {
  const g = obSuggest(a);
  return g === 'week' && obStarted(st, tk) ? 'now' : g;
};
export const obGoal = (a: SetupAnswers, st: Settings | null, tk: DayKey): Goal =>
  obGoals(st, tk, obHabit(a, st)).find((g) => g.id === a.goal) || obGoals(st, tk, obHabit(a, st)).find((g) => g.id === obSug(a, st, tk))!;
/** the Day 1 a goal sets. Once counting has started, a walk-through never moves it (undefined). */
export function obDay1(g: Goal, st: Settings | null, tk: DayKey): DayKey | undefined {
  if (st && st.day1 && st.day1 <= tk) return undefined;
  let d = addDays(tk, g.d1);
  if (st && d <= st.start) d = addDays(st.start, 1);
  return d;
}

/** the reasons offered: the ones kept already (on a walk-through), the ones picked, then ideas from what it costs */
export function obReasonOpts(a: SetupAnswers, st: Settings | null, redo: boolean): string[] {
  const out: string[] = [];
  const add = (t: string) => {
    if (t && out.indexOf(t) < 0) out.push(t);
  };
  (st && redo ? st.reasons : []).forEach(add);
  (a.rs || []).forEach(add);
  (a.costs || []).forEach((c) => (OB_RS[c] || []).forEach(add));
  if (a.faith === 'big' || a.faith === 'some') add('Living by my faith');
  OB_RS_BASE.forEach((t) => {
    if (out.length < 6) add(t);
  });
  return out.slice(0, redo ? 10 : 6);
}
/** the reasons picked, with the one written in */
export function obReasonList(a: SetupAnswers): string[] {
  const list = (a.rs || []).slice();
  obForReasons(a).forEach((t) => {
    if (!list.some((x) => sameReason(x, t))) list.push(t);
  });
  const own = cleanReason(a.own || '');
  if (own && !list.some((x) => sameReason(x, own))) list.push(own);
  return list.slice(0, REASON_MAX);
}
export function obThenOpts(a: SetupAnswers, st: Settings | null, redo: boolean, t: string): string[] {
  const T = OB_THEN[t];
  const opts = T[3].slice();
  if (st && redo) {
    const r = st.plan[T[0]];
    if (r && r.when === T[1] && r.then && r.then.trim() && opts.indexOf(r.then) < 0 && r.then !== a.thenOwn) opts.unshift(r.then);
  }
  return opts;
}
export function obThenPick(a: SetupAnswers, st: Settings | null, redo: boolean, t: string): string | null {
  const T = OB_THEN[t];
  if (a.thenT === t && a.then) return a.then;
  if (st && redo) {
    const r = st.plan[T[0]];
    if (r && r.when === T[1] && r.then && r.then.trim()) return r.then;
  }
  return null;
}

/* ---------- the pages ---------- */
/* Setup in two minutes (WP10, the owner's decisions D4 and D14, November 12, 2026). A new person answers four things, feels
   why this time is different, says who it is for, sets tonight, and lights their flame for the first time; then the account
   ask. What used to be taught here (the wave, the loop, a day in Daybook, the plan, the five statements) moves into the first
   week, one part a day, each set up by using it (unlock.ts). Duolingo is the model (the owner, November 12, 2026): the flame
   talks in its bubble and answers each pick, one question a page with big answers low, a bar across the top, the first win
   inside setup, and the flame lit by the person at the end. Every question can be skipped; setup itself cannot. */
export type PageKind = 'hello' | 'how' | 'sos' | 'account' | 'tiles' | 'multi' | 'promise' | 'tonight' | 'light' | 'review' | 'done' | 'need' | 'grow' | 'why';
export interface ObPage {
  id: string;
  k: PageKind;
  key?: string;
  list?: ObOpt[];
  h?: string;
  sub?: string;
  cols?: number;
  /** the most that can be picked on a many-answer page */
  max?: number;
  keep?: 1;
  need?: (a: SetupAnswers, env: ObEnv) => boolean;
}
/** what the device can do: notify (a phone app; a web page cannot remind once it is closed) */
export interface ObEnv {
  notify?: boolean;
  /** true when this build has accounts and the person is not signed in: the account page shows once the flame is lit */
  account?: boolean;
  /** a walk-through ("How Daybook works" in More): the same questions, then the changes to keep */
  redo?: boolean;
}
/** said most days (or more): step-down counting */
export const obMostDays = (a: SetupAnswers): boolean => a.freq === 'f3' || a.freq === 'f4';

/** how often, as four big answers (the mockup's words). Most days is the legacy "about once a day" (step down counts it). */
export const OB_FREQ4: ObOpt[] = [
  ['f3', 'Most days', 'flame'],
  ['f2', 'A few times a week', 'calendar'],
  ['f1', 'About once a week', 'leaf'],
  ['f0', 'Less than that', 'sunrise'],
];
/** who it is for: up to three, each kept as one of the person's reasons (shown in SOS and the morning) */
export const OB_FOR: [string, string, string, string][] = [
  ['love', 'The people I love', 'heart', 'Being fully present with the people I love'],
  ['partner', 'A future marriage', 'sun', 'Being ready for a real, honest relationship'],
  ['faith', 'My faith', 'star', 'Living by my faith'],
  ['focus', 'My time and focus', 'bolt', 'Doing my best work without a fog'],
  ['health', 'My health', 'leaf', 'Clear mornings and steady energy'],
  ['me', 'Who I am becoming', 'sparkle', 'Becoming someone I am proud of'],
];
export const FOR_MAX = 3;
/** how long a lesson runs (Settings learn.len): short plays a lesson's quick cards, long plays every card. A lesson the person starts
    asks it on its first page; one the app opens goes straight in at this (the owner, November 14, 2026). Short until long is picked. */
export const lessonLen = (st: Settings | null | undefined): 'q' | 'f' => (st && st.learn && st.learn.len === 'f' ? 'f' : 'q');
/** a lesson's first page, or Settings: keep the lesson length */
export const setLessonLen = (st: Settings, len: 'q' | 'f', now = Date.now()): Settings =>
  st.learn.len === len ? st : changeSettings(st, (s) => void (s.learn.len = len), now);
/** the reasons the "who for" picks keep */
export const obForReasons = (a: SetupAnswers): string[] =>
  (Array.isArray(a.for) ? (a.for as string[]) : []).map((id) => (OB_FOR.find((x) => x[0] === id) || [])[3]).filter((x): x is string => !!x);

const isRedo = (_a: SetupAnswers, env: ObEnv) => !!env.redo;
const isNew = (_a: SetupAnswers, env: ObEnv) => !env.redo;
export const OB_PAGES: ObPage[] = [
  /* a walk-through opens with a hello; a new person starts on the first question, where the flame says hello (the owner,
     November 13, 2026: the welcome page "feels kind of pointless") */
  { id: 'hello', k: 'hello', need: isRedo },
  /* a new person starts here: the flame says hello and how Daybook helps, one line each for SOS, the lessons and the mornings
     (the owner, November 13, 2026: "onboarding doesn't explain lessons what sos is ... i don't know how the app is going to help me") */
  { id: 'how', k: 'how', need: isNew },
  /* what the person is quitting (habit.ts): first, so every word after it is theirs */
  { id: 'habit', k: 'tiles', key: 'habit', list: OB_HABIT, h: 'What are you quitting?', keep: 1 },
  { id: 'freq', k: 'tiles', key: 'freq', list: OB_FREQ4, h: 'How often does it happen?', keep: 1 },
  { id: 'when', k: 'multi', key: 'when', list: OB_WHEN, h: 'When does it pull hardest?', sub: 'Pick any.', cols: 2, keep: 1 },
  /* what it takes now, as a year of marks from the person's own "how often" (the owner, November 14, 2026: setup "needs a couple
     screens just demonstrating the extreme beneifi and need of daybook it is all business (setup) and no pleasure"). Only with an answer. */
  { id: 'need', k: 'need', need: (a, env) => !env.redo && !!obYear(a) },
  /* the first win, inside setup: the real SOS, a short practice ride with its swipes, then SOS is unlocked (the owner, November 13,
     2026: "the sos preview should literally be sos with the swipe gestures and stuff and when theyre done press next") */
  { id: 'sos', k: 'sos', need: isNew },
  /* the heart of setup (the owner's condition on D4): you are here, this is different, it is going to work */
  { id: 'promise', k: 'promise', need: isNew },
  {
    id: 'for',
    k: 'multi',
    key: 'for',
    list: OB_FOR.map((x) => [x[0], x[1], x[2]] as ObOpt),
    h: 'Who are you doing this for?',
    sub: 'Pick up to three.',
    /* two across, an even grid like "When does it pull hardest?" (the owner, November 14, 2026: "the options should be grouped") */
    cols: 2,
    max: FOR_MAX,
    keep: 1,
  },
  /* what grows: the flame tonight, at a week, a month and day 90, at a steady pace, ending on who they said it is for */
  { id: 'grow', k: 'grow', need: isNew },
  { id: 'faith', k: 'tiles', key: 'faith', list: OB_FAITH, h: 'Does faith play a part in this for you?', keep: 1 },
  /* after a Yes or a Somewhat: which faith the God lessons speak from (faith.ts) */
  { id: 'creed', k: 'tiles', key: 'creed', list: OB_CREED, h: 'Which faith is yours?', keep: 1, need: (a) => a.faith === 'big' || a.faith === 'some' },
  /* tonight, set before it starts: the phone-down time, and (on a phone) the note an hour before it. Only for porn: the
     screens-off time and the phone plans are about the phone in bed, which other habits do not share (the owner, via WP3,
     November 13, 2026) */
  { id: 'tonight', k: 'tonight', need: (a, env) => !env.redo && habitIn(a) === 'porn' },
  /* the person lights their flame: the plan is saved, counting starts tonight (D14), and the first small goal is picked */
  { id: 'light', k: 'light', need: isNew },
  /* why it works, once the flame is lit: a slip takes nothing away here, and keeping track works. It also shows what the account keeps. */
  { id: 'why', k: 'why', need: isNew },
  /* a free account, asked for last (CLAUDE.md): the flame was just lit. Never required: "Keep it on this phone" goes on. */
  { id: 'account', k: 'account', need: (_a, env) => !env.redo && !!env.account },
  /* a walk-through ends on the changes to keep, then a short done */
  { id: 'review', k: 'review', need: isRedo },
  { id: 'done', k: 'done', need: isRedo },
];
export const obPages = (a: SetupAnswers, env: ObEnv = {}) => OB_PAGES.filter((pg) => !pg.need || pg.need(a, env)).map((pg) => obPageIn(pg, habitIn(a)));
/** the questions setup asks */
export const obAskCount = (a: SetupAnswers, env: ObEnv = {}) => obPages(a, env).filter((p) => p.k === 'tiles' || p.k === 'multi').length;
/** a page in the words of the habit chosen: the questions name it, and for another habit the first question carries the
    doctor line (habit.ts habitMedical) */
function obPageIn(pg: ObPage, h: Habit): ObPage {
  if (h === 'porn' || !pg.h) return pg;
  const out = { ...pg, h: habitSay(pg.h, h) };
  return out;
}

const OB_PREFILL = ['habit', 'aim', 'years', 'freq', 'mins', 'faith', 'creed', 'costs', 'when', 'tried'];
/** a walk-through starts from the last answers and the plan as it is now */
export function obPrefill(st: Settings | null): SetupAnswers {
  if (!st) return {};
  const prev = ((st.onb && st.onb.a) || {}) as SetupAnswers;
  const a: SetupAnswers = {};
  /* every answer a walk-through carries over: the ones asked now, and the ones the long setup asked that its record keeps */
  OB_PREFILL.forEach((k) => {
    if (prev[k] != null) a[k] = Array.isArray(prev[k]) ? (prev[k] as string[]).slice() : prev[k];
  });
  if (prev.ownCost) a.ownCost = prev.ownCost;
  if (prev.goal) a.goal = prev.goal;
  if (prev.thenT && prev.then && OB_THEN[prev.thenT]) {
    a.thenT = prev.thenT;
    a.then = prev.then;
    if (OB_THEN[prev.thenT][3].indexOf(prev.then) < 0) a.thenOwn = prev.then;
  }
  /* who it is for: the picks the reasons still hold */
  const fr = OB_FOR.filter((x) => (st.reasons || []).indexOf(x[3]) >= 0).map((x) => x[0]);
  if (fr.length) a.for = fr.slice(0, FOR_MAX);
  a.so = st.screensOff;
  a.person = st.safePerson || '';
  a.be = st.becoming || '';
  a.rs = (st.reasons || []).slice();
  return a;
}

/* ---------- who I am becoming ---------- */
/** the starter sentences on "Who are you becoming?". Each says who the person is, not what they avoid. */
export const OB_BE = [
  'I am becoming someone who is free of this.',
  'I am someone who keeps my word to myself.',
  'I am becoming someone the people I love can count on.',
  'I am someone who faces hard moments instead of hiding from them.',
];
export const BE_LEN = 160;
/** the sentence the answers hold: one line, trimmed, or empty */
export const obBecoming = (a: SetupAnswers) =>
  String(a.be || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, BE_LEN);

/* ---------- the plan: what the answers would change ---------- */
export interface ObChange {
  k: 'goal' | 'rs' | 'so' | 'plan' | 'person' | 'be';
  l: string;
  from: string;
  to: string;
  sub0?: string;
  sub1?: string;
  apply: (s: Settings) => void;
}
export function obChanges(a: SetupAnswers, st: Settings | null, tk: DayKey): ObChange[] {
  const cur = st || defaultSettings(tk);
  const out: ObChange[] = [];
  const g = obGoal(a, st, tk);
  const d1 = obDay1(g, st, tk);
  const mode = obPlanMode(a, st);
  if (!st || g.goal !== cur.goal || (d1 !== undefined && d1 !== cur.day1))
    out.push({
      k: 'goal',
      l: 'Goal',
      from: cur.goal,
      to: g.t,
      sub0: (cur.day1 ? 'Day 1: ' + obDate(cur.day1) + ' · ' : '') + obCount(cur.cleanMode),
      sub1: 'Day 1: ' + obDate(d1 === undefined ? cur.day1 : d1) + ' · ' + obCount(mode),
      apply: (s) => {
        s.goal = g.goal;
        /* only a new person's counting is set here (obPlanMode); step down starts on Day 1 */
        if (s.cleanMode !== mode) {
          if (mode === 'step') s.stepAt = d1 !== undefined ? d1 : tk;
          s.cleanMode = mode;
          s.cleanNote = null;
          s.cleanHold = null;
        }
        if (d1 !== undefined) s.day1 = d1;
      },
    });
  const rs = obReasonList(a);
  if (rs.length && (!st || rs.join('\n') !== cur.reasons.join('\n')))
    out.push({
      k: 'rs',
      l: 'My reasons',
      from: cur.reasons.join(' · ') || 'None yet',
      to: rs.join(' · '),
      apply: (s) => {
        s.reasons = rs.slice();
        if (!st) s.why = rs.join('. ') + '.';
        s.rmeta = (s.rmeta || []).filter((m) => rs.indexOf(m.t) >= 0);
        rs.forEach((t) => {
          if (!s.rmeta.some((m) => m.t === t)) s.rmeta.push({ t, c: reasonGuess(t).id });
        });
      },
    });
  if (isTime(a.so) && (!st || a.so !== cur.screensOff))
    out.push({ k: 'so', l: 'Screens off', from: fmtClock(cur.screensOff), to: fmtClock(a.so!), apply: (s) => void (s.screensOff = a.so!) });
  const t = obTop(a);
  const T = OB_THEN[t];
  const th = a.thenT === t ? a.then : null;
  if (th && (!st || cur.plan[T[0]].when !== T[1] || cur.plan[T[0]].then !== th))
    out.push({
      k: 'plan',
      l: 'If-then plan',
      from: st && cur.plan[T[0]].then ? 'If ' + cur.plan[T[0]].when + ', then ' + cur.plan[T[0]].then : 'Not filled in',
      to: 'If ' + T[1] + ', then ' + th,
      apply: (s) => void (s.plan[T[0]] = { when: T[1], then: th }),
    });
  const pn = String(a.person || '')
    .trim()
    .slice(0, 80);
  if (pn && (!st || pn !== cur.safePerson))
    out.push({ k: 'person', l: 'Safe person', from: cur.safePerson || 'Not set', to: pn, apply: (s) => void (s.safePerson = pn) });
  const be = obBecoming(a);
  if (be && (!st || be !== cur.becoming))
    out.push({ k: 'be', l: 'Who I am becoming', from: cur.becoming || 'Not set', to: be, apply: (s) => void (s.becoming = be) });
  return out;
}

/** what is kept about this walk-through: the answers, how many times, and the self-check score over time (legacy obRecord) */
export function obRecord(a: SetupAnswers, st: Settings | null, tk: DayKey, now = Date.now()): NonNullable<Settings['onb']> {
  const prev = (st && st.onb) || null;
  const r = obScore(a);
  const keep: Record<string, unknown> = {};
  [...OB_KEYS, 'for', 'first'].forEach((k) => {
    const v = a[k];
    if (v != null && v !== '') keep[k] = Array.isArray(v) ? v.slice() : v;
  });
  const hist = ((prev && prev.hist) || []).slice();
  if (r.n === 5) hist.push({ d: tk, s: r.s });
  return { n: ((prev && prev.n) || 0) + 1, at: now, a: keep, hist: hist.slice(-24) };
}

/** save the walk-through (legacy obSave): a new person gets the whole plan; someone walking through again keeps what they ticked.
    Returns the new settings and how many changes went in. */
export function obSave(a: SetupAnswers, st: Settings | null, keep: string[] | null, tk: DayKey, now = Date.now()): { st: Settings; changed: number } {
  const ch = obChanges(a, st, tk);
  const rec = obRecord(a, st, tk, now);
  const use = st ? ch.filter((c) => (keep || []).indexOf(c.k) >= 0) : ch;
  /* a new person starts on the two-moment day (two-moments.ts): no evening check-in, no "How are you feeling today?" */
  const base = st || freshSettings(tk);
  const next = changeSettings(
    base,
    (s) => {
      use.forEach((c) => c.apply(s));
      s.onb = rec;
    },
    now,
  );
  return { st: next, changed: use.length };
}

/* ---------- a new person's start (D14: counting starts tonight; the tracking week is no longer offered) ---------- */
/** the goal a new person's setup sets, in their habit's words */
export const obBeginGoal = (h: Habit) => habitSay('Quit porn. Log honestly, slips included.', h);
/** the day of the first ask of "how free do you see yourself", for someone who came through the short setup */
export const FREE_AT = 30;
/** the small goals offered once the flame is lit, from how often it happens (the owner, November 13, 2026: "for me my first goal
    would be two and 5 would be a stretch maybe this number should be based off of how often they slip"): a close one and a
    stretch. Nothing past a week before a clean week (CLAUDE.md). */
export const OB_FIRST = [3, 7] as const;
export function obFirstGoals(a: SetupAnswers): [number, number] {
  if (obMostDays(a)) return [2, 5];
  if (a.freq === 'f1' || a.freq === 'f0') return [5, 7];
  return [3, 7];
}
/** a first goal a person can hold: two nights up to a week */
export const okFirst = (n: unknown): n is number => typeof n === 'number' && Number.isInteger(n) && n >= 2 && n <= 7;
/** the phone-down time setup starts on: half past ten for someone whose hardest hour is late at night (get there first),
    eleven for everyone else */
export const obTonightAt = (a: SetupAnswers): string =>
  isTime(a.so) ? (a.so as string) : (a.when || []).some((w) => w === 'late' || w === 'tired' || w === 'scroll') ? '22:30' : '23:00';

/** a new person's settings, from what setup asked. Day 1 is today and tonight is the first night counted (D14). How days count
    follows how often (obMode). The reasons are who it is for. The phone-down time is tonight's. The first week starts today
    (fw, unlock.ts), which also marks this person as one who came through the short setup: people who finished the long one
    never see the first-week parts. */
export function obBegin(a: SetupAnswers, tk: DayKey, now = Date.now()): Settings {
  const h = habitIn(a);
  const mode = obMode(a);
  const rs = obReasonList(a);
  const rec = obRecord(a, null, tk, now);
  return changeSettings(
    freshSettings(tk),
    (s) => {
      s.goal = obBeginGoal(h);
      s.day1 = tk;
      s.cleanMode = mode;
      if (mode === 'step') s.stepAt = tk;
      s.cleanNote = null;
      s.cleanHold = null;
      if (rs.length) {
        s.reasons = rs.slice();
        s.why = rs.join('. ') + '.';
        s.rmeta = rs.map((t) => ({ t, c: reasonGuess(t).id }));
      }
      s.screensOff = obTonightAt(a);
      s.onb = rec;
      s.fw = tk;
      /* the "how free do you see yourself" question (north.ts) is no longer asked in setup: it waits until day 30 (C7), so
         it never crowds the first week. freeNo is when a closed ask was let go; it is due FREE_WAIT days after. */
      s.freeNo = addDays(tk, FREE_AT - FREE_WAIT);
      if (okFirst(a.first)) s.fwGoal = a.first;
    },
    now,
  );
}

/** the first small goal, picked once the flame is lit (two nights up to seven), kept with the first week */
export const setFirstGoal = (st: Settings, n: number, now = Date.now()): Settings => (okFirst(n) ? changeSettings(st, (s) => void (s.fwGoal = n), now) : st);

/** the first line of the plan (the first week, day 4): for the hardest moment setup heard, the "then" picked. Kept in the
    plan row and in setup's record, so the first week knows it is done. */
/** the hard moments whose plans are about the phone in bed: offered for porn only (the owner, via WP3, November 13, 2026) */
const PHONE_TOPS = ['late', 'tired', 'scroll'];
export function obPlanLine(st: Settings): { top: string; when: string; ask: string; opts: string[] } {
  const a = ((st.onb && st.onb.a) || {}) as SetupAnswers;
  const porn = habitOf(st) === 'porn';
  const rest = (a.when || []).filter((w) => PHONE_TOPS.indexOf(w) < 0);
  const top = porn ? obTop(a) : rest.length ? obTop({ when: rest }) : 'stress';
  const T = OB_THEN[top];
  return { top, when: T[1], ask: T[2], opts: T[3].slice() };
}
export function setPlanLine(st: Settings, then: string, now = Date.now()): Settings {
  const x = obPlanLine(st);
  const T = OB_THEN[x.top];
  const th = then.trim().slice(0, 140);
  if (!th) return st;
  return changeSettings(
    st,
    (s) => {
      s.plan[T[0]] = { when: T[1], then: th };
      if (s.onb) s.onb.a = { ...s.onb.a, thenT: x.top, then: th };
    },
    now,
  );
}

/** the page that is the heart of setup: what the person said, read back with hope, and the three things that make this time
    different, each tied to what they told it. The flame says the last line. */
export function obPromise(a: SetupAnswers): { h: string; rows: [string, string][]; say: string } {
  const porn = habitIn(a) === 'porn';
  const late = porn && (a.when || []).some((w) => w === 'late' || w === 'tired' || w === 'scroll');
  const most = obMostDays(a);
  return {
    h: 'You are here. This time is different.',
    rows: [
      [
        'moon',
        late
          ? 'Your hardest hour is at night. Tonight, we get there first.'
          : porn
            ? 'Tonight is set before it starts, not fought when it comes.'
            : 'When the hard hour comes, the plan is already there.',
      ],
      ['sunrise', 'Each morning, one honest tap. A slip is something to learn from, never a reset.'],
      ['flame', 'One short lesson a day. Everything you do feeds your fire, and you watch it grow.'],
    ],
    say: most ? 'Most days is where many people start. They get free from right here.' : 'It works because the plan is ready before the hard hour is.',
  };
}

/* ---------- the pages that show what Daybook gives (the owner, November 14, 2026) ---------- */
/** the times a year it happens now, from "how often" (OB_FREQ4), rounded, as the person said it roughly. Null without an answer.
    Most days is about 6 a week, a few times a week about 3, once a week 1; less than that is "fewer than 50", drawn as about 25. */
export function obYear(a: SetupAnswers): { n: number; h: string } | null {
  const per: Record<string, [number, string]> = {
    f3: [300, 'About 300 times a year.'],
    f4: [300, 'About 300 times a year.'],
    f2: [150, 'About 150 times a year.'],
    f1: [50, 'About 50 times a year.'],
    f0: [25, 'Fewer than 50 times a year.'],
  };
  const x = a.freq ? per[a.freq] : null;
  return x ? { n: x[0], h: x[1] } : null;
}
/** the 365 days of a year, true where it happens at n a year: scattered the way real life is (a fixed shuffle, the same each time) */
export function obYearMarks(n: number): boolean[] {
  const mix = (d: number) => {
    let h = Math.imul((d + 1) ^ ((d + 1) >>> 16), 0x45d9f3b);
    h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
    return (h ^ (h >>> 16)) >>> 0;
  };
  const order = Array.from({ length: 365 }, (_, d) => d).sort((x, y) => mix(x) - mix(y));
  const out = new Array<boolean>(365).fill(false);
  for (const d of order.slice(0, Math.max(0, Math.min(365, n)))) out[d] = true;
  return out;
}
/** what Day 90 looks like, said back from "who are you doing this for" (the first pick) */
const OB_FOR_GAIN: Record<string, string> = {
  love: 'Day 90: more present with the people you love.',
  partner: 'Day 90: ready for a real, honest relationship.',
  faith: 'Day 90: living by your faith, day after day.',
  focus: 'Day 90: your time and focus, yours again.',
  health: 'Day 90: clear mornings and steady energy.',
  me: 'Day 90: someone you are proud to be.',
};
/** the flame as it grows at a steady pace (about 45 points a day, levels.ts): tonight, a week, a month, day 90. The level each
    stop shows is the one that pace reaches, so the picture is the ladder itself, not a promise. The early stops say what the
    person will have; the last one says it in their own reason, quietly (no big goals pushed early, CLAUDE.md). */
export function obGrow(a: SetupAnswers): { at: string; level: number; line: string }[] {
  const pick = (Array.isArray(a.for) ? (a.for as string[]) : []).find((id) => OB_FOR_GAIN[id]);
  const lv = (d: number) => levelOf(d * 45).n;
  return [
    { at: 'Tonight', level: 1, line: 'Tonight: your plan is ready before the hard hour.' },
    { at: 'Week 1', level: lv(7), line: 'Week 1: you see your pattern, when it pulls and what gets you through.' },
    { at: 'Month 1', level: lv(30), line: 'Month 1: urges still come, and you know the way through them.' },
    { at: 'Day 90', level: lv(90), line: pick ? OB_FOR_GAIN[pick] : 'Day 90: free of it, and it feels like you.' },
  ];
}
/** the two lines of the "why it works" picture over eight weeks with two slips: a streak that drops to zero at each, and the free
    days on the record here, which only ever go up (strict mode's count does drop, but the record, points and level never do) */
export function obWhyLines(): { streak: number[]; record: number[] } {
  const slip = new Set([17, 44]);
  const streak: number[] = [];
  const record: number[] = [];
  let s = 0;
  let r = 0;
  for (let d = 0; d < 56; d++) {
    if (slip.has(d)) s = 0;
    else {
      s++;
      r++;
    }
    streak.push(s);
    record.push(r);
  }
  return { streak, record };
}

/* ---------- the words on the pages that answer what was said ---------- */
export interface ObShow {
  h: string;
  line: string;
  /** a second line under the first */
  line2?: string;
  /** "Behind this": the detail, and the sources by key */
  more?: { label: string; paras: string[]; keys: string[] };
}
export const obSrc = (k: string): [string, string] | null => (OB_SRC[k] as [string, string]) || (SRC[k] as unknown as [string, string]) || null;

const BPS_MORE = {
  label: 'Behind this',
  paras: [
    'These five statements are the Brief Pornography Screen, a short tested check. Your answers are kept so the next walk-through can show how things moved.',
  ],
  keys: ['bps'],
};
/** "far from the only one", folded into the page after the five statements: its line and its sources */
const COMMON_LINE = 'About **1 in 10 men** say urges like these cause them real distress. Help works.';
const COMMON_MORE = {
  paras: [
    'In a national US survey, about 1 in 10 men reported real distress from sexual urges and behavior they found hard to control. In another national sample, about 11% of men and 3% of women agreed, at least somewhat, that they are addicted to porn.',
    'A 2022 review of treatments found that treatment appeared to improve symptoms, and therapy that builds skills (CBT) had the strongest support.',
  ],
  keys: ['dickenson', 'grubbs19', 'antons'],
};
/** after the five statements: a kind word that fits what was said. The score is never shown. `line2` is the second line,
    "you are far from the only one", and `more` holds the sources of both. */
export function obHeard(a: SetupAnswers): ObShow {
  const r = obScore(a);
  const more = (bps: boolean) => ({
    label: 'Behind this',
    paras: (bps ? BPS_MORE.paras : []).concat(COMMON_MORE.paras),
    keys: (bps ? BPS_MORE.keys : []).concat(COMMON_MORE.keys),
  });
  const line2 = COMMON_LINE;
  if (!r.n) return { h: 'That is okay.', line: 'You can come back to these questions any time.', line2, more: more(false) };
  if (r.s >= 6)
    return {
      h: 'Thank you for being honest.',
      line: 'This has a real hold, and it can change. Daybook will help, and free support from real people is there whenever you want more.',
      line2,
      more: more(true),
    };
  if (r.s >= 4)
    return { h: 'Thank you for being honest.', line: 'It sounds like this has a real hold. That is exactly what Daybook is for.', line2, more: more(true) };
  return { h: 'Thanks. That helps.', line: 'Even a light habit can take more than it gives. Your plan will fit where you are.', line2, more: more(false) };
}

/** the wave page: the person's hardest moment, said in their own pick, when they answered it */
const OB_WAVE_OPEN: Record<string, string> = {
  late: 'Late at night, in bed',
  bored: 'Bored and alone at home',
  stress: 'Stressed and wound up',
  lonely: 'Lonely or low',
  tired: 'Tired at the end of the day',
  scroll: 'Scrolling your phone',
};
export function obWave(a: SetupAnswers) {
  const has = (a.when || []).length > 0;
  const open = has ? OB_WAVE_OPEN[obTop(a)] : '';
  return { h: open ? `${open}, an urge rises, peaks, and passes.` : 'Urges rise, peak, and pass.' };
}

/** the four small things the first day asks, shown under the first step on the last page */
export const OB_TAKES = ['About 5 minutes a day', 'Honest logs, slips included', 'SOS when an urge hits', 'Phone out of the bedroom at night'];

/** your time: the number for a year, the headline, the comparisons, and the detail (legacy obReveal). guess is a number, 'skip', or null. */
export function obReveal(a: SetupAnswers, guess: number | 'skip' | null) {
  const H = obHours(a)!;
  const yr = obRnd(H.yr);
  const ten = H.ten;
  const faith = a.faith === 'big' || a.faith === 'some';
  const guessed = typeof guess === 'number';
  const g = guessed ? (guess as number) : 0;
  const eq: [string, string][] = [];
  if (H.past != null) eq.push(['timer', `So far, about **${obHrs(H.past)}**.`]);
  const wk = ten / 40;
  eq.push([
    'calendar',
    `The next 10 years: about **${wk >= 104 ? (ten / 2080).toFixed(1).replace(/\.0$/, '') + ' years' : Math.max(1, Math.round(wk)) + (Math.round(wk) === 1 ? ' week' : ' weeks')}** of full-time work.`,
  ]);
  if (faith) {
    const n = Math.round(ten / OB_BIBLE_H);
    if (n >= 1) eq.push(['book', `Or reading the whole Bible **${n === 1 ? 'once' : 'about ' + n.toLocaleString('en-US') + ' times'}**.`]);
  }
  const h = !guessed
    ? yr >= 100
      ? 'That is a lot of hours.'
      : 'Small, and it still adds up.'
    : g < yr * 0.8
      ? 'More than you guessed.'
      : g > yr * 1.25
        ? 'Less than you guessed. It still adds up.'
        : 'Close to your guess.';
  const rows = eq.slice(0, guessed ? 1 : 2);
  return {
    yr,
    h,
    guess: guessed ? g : null,
    rows,
    soft: `Every urge you ride out gives back about **${H.m[2]} minutes**.`,
    more: {
      label: 'Behind this',
      paras: [`You said ${H.f[3]}, ${H.m[3]} each time. That is about ${obHrs(H.wk)} a week, and about ${obHrs(ten)} over ten years.`].concat(
        eq.length > rows.length ? eq.slice(rows.length).map((r) => r[1]) : [],
      ),
      keys: faith ? ['bible', 'fsi'] : ['fsi'],
    },
  };
}

export function obTries(a: SetupAnswers): ObShow {
  const t = a.tried;
  const x =
    t === 't2'
      ? ['Many tries is normal.', 'Many people who quit smoking needed 30 or more tries. Each one teaches you something.']
      : t === 't1'
        ? ['Trying again is how it works.', 'Most people need more than one try. This time you have a plan.']
        : t === 't0'
          ? ['A first try, with a plan.', 'Most people need more than one try. If you slip, nothing resets here.']
          : ['Most quits take more than one try.', 'Each one teaches you something. If you slip, nothing resets here.'];
  return {
    h: x[0],
    line: x[1],
    more: {
      label: 'Behind this',
      paras: ['A study followed 1,277 people trying to quit smoking. The researchers estimated that for many, it takes 30 or more tries before one sticks.'],
      keys: ['chaiton'],
    },
  };
}

/** under the goals: the Day 1 it sets, how days count, and why this one. In step down, "Why this one?" also says why step down,
    and that Daybook moves the person to counting days once their stretches get long. "Quit, starting tomorrow" explains a
    clear line, which is about counting days, so in step down its place goes to the step-down why. */
export function obGoalInfo(a: SetupAnswers, st: Settings | null, tk: DayKey) {
  const g = obGoal(a, st, tk);
  const mode = obPlanMode(a, st);
  const W = OB_GWHY[g.id];
  const S = OB_GWHY.step;
  const d1 = obDay1(g, st, tk);
  const d1t = d1 === undefined ? 'Day 1 stays ' + obDate(st && st.day1) + '.' : 'Day 1: ' + obDate(d1) + '.';
  const ws = mode === 'step' ? (g.id === 'now' ? [S] : [W, S]) : [W];
  return {
    soft: '**' + d1t + '** ' + obCount(mode) + '.',
    more: { label: 'Why this one?', paras: ws.flatMap((w) => ['**' + w.h + '** ' + w.p, w.f]), keys: ws.map((w) => w.src) },
  };
}

/** the SOS page: what it would offer first for the hardest moment */
export function obSosLine(a: SetupAnswers) {
  const has = (a.when || []).length > 0;
  const T = obTool(has ? obTop(a) : 'other');
  const w = OB_THEN[obTop(a)];
  return {
    tool: T,
    when: has ? (OB_WHEN.find((x) => x[0] === obTop(a)) || [])[1] || '' : 'Right now',
    line: has
      ? `Slow breathing starts on its own, then one thing to try. When ${w[2]}, that might be **${T.name}**.`
      : 'Slow breathing starts on its own, then one thing to try, picked for that moment.',
  };
}

/** the first thing to do, on the last page for a new person */
export function obFirst(goalId: string, so: string) {
  const s = fmtClock(so);
  return (
    {
      week: 'This week: log every urge, whatever happens. Tap SOS when one starts.',
      now: `Day 1 is tomorrow. Tonight: screens off at ${s}, phone out of the bedroom.`,
      nights: `Tonight: screens off at ${s}, phone charging outside the bedroom.`,
    } as Record<string, string>
  )[goalId];
}

/** "Last time: ..." under a question on a walk-through */
export const obLast = (st: Settings | null, redo: boolean, key: string, list: ObOpt[]): string => {
  const prev = st && st.onb;
  if (!redo || !prev || !prev.a[key]) return '';
  const x = list.find((o) => o[0] === prev.a[key]);
  return x ? 'Last time: ' + x[1] : '';
};

/* ---------- what the flame says ---------- */
/** The flame coaches the person through the setup, as it does in a lesson (the owner, November 2, 2026). It speaks as "I", sparingly,
    in a cream bubble. On most pages it says what the small line under the question used to say, so nothing new is asked of anyone;
    on a one-tap question it answers what was picked. Plain words, no contractions, never shame. */
const OB_SAY: Record<string, string> = {
  hello: 'Hi. I am your flame. Answer a few quick questions, and tonight is set.',
  how: 'Hi. I am your flame. You came here, and that is the hardest step.',
  sos: 'When an urge hits, tap SOS. Try it now, while it is calm. It takes a few seconds.',
  habit: 'Pick the closest one. I can help with each.',
  freq: 'Rough is fine. Only you see this.',
  when: 'Pick any. I will be ready for these.',
  for: 'On a hard night, I will remind you.',
  faith: 'It changes which lessons come up.',
  tonight: 'Set it now, while it is easy.',
  light: 'Swipe up. Light me.',
  account: 'Look at me now. You did that.',
  need: 'That is the pull now. Each one you ride out, you take back.',
  grow: 'Every honest day feeds me. This is what that looks like.',
  why: 'Here a slip is something to learn from. What you earn stays yours.',
  review: 'Tick what to keep. The rest stays as it is.',
};
/** a walk-through: the flame has grown, and says so */
const OB_SAY_REDO: Record<string, string> = {
  hello: 'Look how far I have come with you. Nothing changes until the last page.',
};
/** what the flame says first on a page, or null */
export const obSay = (id: string, redo = false, h: Habit = 'porn'): string | null =>
  (redo && OB_SAY_REDO[id]) || (id === 'freq' ? habitMedical(h) : null) || OB_SAY[id] || null;

/** the flame's answer to a one-tap pick, by the question's key and the answer's id */
export const OB_REPLY: Record<string, Record<string, string>> = {
  habit: {
    porn: 'Many people fight this one. You are in the right place.',
    alcohol: 'Then we work on drinking. Every tool here is ready for it, and safety comes first.',
    gambling: 'Then we work on gambling. Every tool here is ready for it.',
    other: 'Then we work on it together. Every tool here is ready for it.',
  },
  freq: {
    f3: 'Most days. Then we go one night at a time, and every one counts.',
    f2: 'A few times a week. Then there are already free days to build on.',
    f1: 'About once a week. You already have more free days than not.',
    f0: 'Less than that. Then we catch it before it grows.',
  },
  faith: {
    big: 'Then your faith will be part of this. Some lessons are written for it.',
    some: 'I will bring it in now and then.',
    no: 'That is fine. The lessons stay practical.',
  },
  creed: {
    lds: 'Then I will speak of Heavenly Father and the Savior, in the words you know.',
    christian: 'Then I will lean on the Bible and on Jesus Christ, in the words you know.',
    other: 'Then I will speak of God plainly, in words your faith can hold.',
  },
};
/** the flame's answer to a pick, or null */
export const obReply = (key: string, id: string | null | undefined): string | null => (id && OB_REPLY[key]?.[id]) || null;

/* the lists the pages use, re-exported here so the app takes everything about the setup from one place */
export { OB_AIM, OB_COST, OB_FAITH, OB_FREQ, OB_MINS, OB_TRIED, OB_WHEN, OB_YEARS };

/** Settings: change the setup's faith answers (faith.ts). No leaves the God lessons out; Yes or Somewhat brings them in, in
    the words of the faith chosen. Only for someone who has a setup record. */
export function setFaith(st: Settings, faith: 'big' | 'some' | 'no', creed?: string, now = Date.now()): Settings {
  if (!st.onb) return st;
  return changeSettings(
    st,
    (s) => {
      const a = (s.onb!.a || (s.onb!.a = {})) as SetupAnswers;
      a.faith = faith;
      if (creed && OB_CREED.some((x) => x[0] === creed)) a.creed = creed;
    },
    now,
  );
}
/** what the person is quitting, changed in Settings (habit.ts). The lessons written for porn leave or join the path; nothing
    finished, earned or logged changes. */
export function setHabit(st: Settings, habit: Habit, now = Date.now()): Settings {
  if (!st.onb || !normHabit(habit)) return st;
  return changeSettings(
    st,
    (s) => {
      const a = (s.onb!.a || (s.onb!.a = {})) as SetupAnswers;
      a.habit = habit;
    },
    now,
  );
}
