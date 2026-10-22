/* The setup ("How Daybook works"): the answers, the pages, the goal it suggests, and the plan it builds. The questions, scores
   and goals are in the legacy core; the parts of the legacy setup that read the global Store or the clock are ported here as pure
   functions that take the settings and today. Checked against the legacy app by test/setup.test.ts. */
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
import type { CountMode, DayKey, Settings } from './types';

/** the answers so far. Keys are the legacy ones (aim, freq, mins, years, tried, faith, b0..b4, costs, ownCost, when, goal, so,
    then, thenT, thenOwn, rs, own, person), and be (who I am becoming). */
export interface SetupAnswers {
  aim?: string;
  freq?: string;
  mins?: string;
  years?: string;
  tried?: string;
  faith?: string;
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
  [k: string]: unknown;
}

/** the goal the setup suggests (legacy obSuggest). "Quit for good" starts tomorrow, on a first try too: someone ready to quit
    tonight is not told to wait a week (the owner, October 18). The tracking week is for someone who wants to understand the
    pattern first, or did not say. How days count is not a goal any more (obMode): "Step down first" and "Cut way back first"
    are gone, so "Use it a lot less" gets the same start as no answer (the owner, October 21). */
export function obSuggest(a: SetupAnswers): string {
  if (a.aim === 'learn') return 'week';
  if (a.aim === 'nights') return 'nights';
  if (a.aim === 'quit') return 'now';
  return (a.when || []).indexOf('late') >= 0 ? 'nights' : 'week';
}

/** how days count from the start, from how often the person said it happens: about once a day or more starts in step down
    (a clean run is a hard first goal then, and Daybook moves them to counting days once their stretches get long); anything
    less, or no answer, counts days strictly. Setup never sets gentle counting; it stays a quiet choice in Settings. */
export const obMode = (a: SetupAnswers): CountMode => (a.freq === 'f3' || a.freq === 'f4' ? 'step' : 'strict');
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
    ? 'A day counts with one slip or fewer'
    : m === 'step'
      ? 'Longer stretches between slips, fewer slips each week'
      : 'A day counts when no slip is logged';

/** counting has started: Day 1 is today or earlier */
export const obStarted = (st: Settings | null, tk: DayKey) => !!(st && st.day1 && st.day1 <= tk);
/** the goals on offer. Once counting has started they keep the Day 1 the person has, and the tracking week is behind them. */
export function obGoals(st: Settings | null, tk: DayKey): Goal[] {
  if (!obStarted(st, tk)) return SETUP_GOALS;
  const d = obDate(st!.day1);
  return SETUP_GOALS.filter((g) => g.id !== 'week').map((g) => ({
    ...g,
    ...(g.id === 'now'
      ? { t: 'Quit, keep counting', s: 'Day 1 stays ' + d + '.', goal: 'Quit porn. Log honestly, slips included.' }
      : { s: 'Screens off first. Day 1 stays ' + d + '.' }),
  }));
}
export const obSug = (a: SetupAnswers, st: Settings | null, tk: DayKey) => {
  const g = obSuggest(a);
  return g === 'week' && obStarted(st, tk) ? 'now' : g;
};
export const obGoal = (a: SetupAnswers, st: Settings | null, tk: DayKey): Goal =>
  obGoals(st, tk).find((g) => g.id === a.goal) || obGoals(st, tk).find((g) => g.id === obSug(a, st, tk))!;
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
export type PageKind =
  | 'hello'
  | 'account'
  | 'how'
  | 'tiles'
  | 'years'
  | 'slide'
  | 'bps'
  | 'heard'
  | 'multi'
  | 'guess'
  | 'hours'
  | 'loop'
  | 'so'
  | 'waves'
  | 'breathe'
  | 'tour'
  | 'curve'
  | 'tries'
  | 'slip'
  | 'goal'
  | 'reasons'
  | 'then'
  | 'person'
  | 'becoming'
  | 'review'
  | 'remind'
  | 'done';
export interface ObPage {
  id: string;
  s: string;
  k: PageKind;
  key?: string;
  list?: ObOpt[];
  h?: string;
  sub?: string;
  cols?: number;
  auto?: 1;
  keep?: 1;
  /** the small picture over a one-tap question: the flame, or an icon */
  art?: 'flame' | string;
  lo?: string;
  hi?: string;
  own?: string;
  n?: number;
  need?: (a: SetupAnswers, env: ObEnv) => boolean;
}
/** what the device can do: notify (a phone app; a web page cannot remind once it is closed) */
export interface ObEnv {
  notify?: boolean;
  /** true when this build has accounts and the person is not signed in: the account page shows once the plan is built */
  account?: boolean;
}
/** the three acts of the setup: id, name, tone and icon. Every page points at its act with `s`. */
export const OB_SECS: [string, string, string, string][] = [
  ['you', 'You', 'violet', 'compass'],
  ['hour', 'Your hardest hour', 'mint', 'life'],
  ['plan', 'Your plan', 'sun', 'shield'],
];
/* The order is a story in three acts (the owner, October 22, 2026): you, your hardest hour, your plan. */
export const OB_PAGES: ObPage[] = [
  { id: 'hello', s: 'you', k: 'hello' },
  { id: 'how', s: 'you', k: 'how' },
  {
    id: 'aim',
    s: 'you',
    k: 'tiles',
    key: 'aim',
    list: OB_AIM,
    h: 'What do you want most from Daybook?',
    sub: 'Pick the closest one.',
    cols: 2,
    auto: 1,
    keep: 1,
    art: 'flame',
  },
  {
    id: 'years',
    s: 'you',
    k: 'years',
    key: 'years',
    list: OB_YEARS,
    h: 'How long have you been struggling with porn?',
    sub: 'Your best guess is fine.',
    auto: 1,
    keep: 1,
    art: 'calendar',
  },
  {
    id: 'freq',
    s: 'you',
    k: 'slide',
    key: 'freq',
    list: OB_FREQ,
    h: 'In a typical week, how often do you watch porn?',
    sub: 'Rough is fine. Only you see this.',
    lo: 'Rarely',
    hi: 'Several a day',
    keep: 1,
  },
  {
    id: 'mins',
    s: 'you',
    k: 'slide',
    key: 'mins',
    list: OB_MINS,
    h: 'When you do, how long does it usually last?',
    sub: 'Count from when you start until you stop.',
    lo: 'Minutes',
    hi: 'Hours',
    keep: 1,
  },
  {
    id: 'faith',
    s: 'you',
    k: 'tiles',
    key: 'faith',
    list: OB_FAITH,
    h: 'Does faith play a part in this for you?',
    sub: 'It only changes which lessons come up.',
    cols: 1,
    auto: 1,
    keep: 1,
    art: 'star',
  },
  { id: 'b0', s: 'you', k: 'bps', n: 0 },
  { id: 'b1', s: 'you', k: 'bps', n: 1 },
  { id: 'b2', s: 'you', k: 'bps', n: 2 },
  { id: 'b3', s: 'you', k: 'bps', n: 3 },
  { id: 'b4', s: 'you', k: 'bps', n: 4 },
  { id: 'heard', s: 'you', k: 'heard' },
  {
    id: 'costs',
    s: 'you',
    k: 'multi',
    key: 'costs',
    list: OB_COST,
    h: 'What has porn cost you so far?',
    sub: 'Tap all that apply.',
    cols: 2,
    keep: 1,
    own: 'ownCost',
  },
  { id: 'guess', s: 'you', k: 'guess', need: (a) => !!obHours(a) },
  { id: 'hours', s: 'you', k: 'hours', need: (a) => !!obHours(a) },
  {
    id: 'when',
    s: 'hour',
    k: 'multi',
    key: 'when',
    list: OB_WHEN,
    h: 'When does the urge pull hardest?',
    sub: 'Tap all that apply. Daybook gets ready for these.',
    cols: 2,
    keep: 1,
  },
  { id: 'wave', s: 'hour', k: 'waves' },
  /* thirty seconds of slow breathing, the way SOS starts (a placeholder until the real breath is built) */
  { id: 'breathe', s: 'hour', k: 'breathe' },
  { id: 'loop', s: 'hour', k: 'loop' },
  { id: 'person', s: 'hour', k: 'person', key: 'person' },
  /* one page in place of the five tour pages: SOS, lessons, your day, the pattern, the flame */
  { id: 'tour', s: 'hour', k: 'tour' },
  { id: 'curve', s: 'plan', k: 'curve' },
  {
    id: 'tried',
    s: 'plan',
    k: 'tiles',
    key: 'tried',
    list: OB_TRIED,
    h: 'Have you tried to quit before?',
    sub: 'There is no wrong answer here.',
    cols: 1,
    auto: 1,
    keep: 1,
    art: 'flag',
  },
  { id: 'tries', s: 'plan', k: 'tries' },
  { id: 'slip', s: 'plan', k: 'slip' },
  { id: 'goal', s: 'plan', k: 'goal', key: 'goal' },
  { id: 'reasons', s: 'plan', k: 'reasons', key: 'rs' },
  { id: 'ifthen', s: 'plan', k: 'then', key: 'then' },
  { id: 'so', s: 'plan', k: 'so', key: 'so' },
  { id: 'becoming', s: 'plan', k: 'becoming', key: 'be' },
  { id: 'review', s: 'plan', k: 'review' },
  /* when to check in, with the phone's one permission prompt (nudges.ts); only where the device can notify */
  { id: 'remind', s: 'plan', k: 'remind', need: (_a, env) => !!env.notify },
  /* a free account, asked for at the best moment there is: the plan was just built, and nothing has gone wrong yet
     (accounts.ts). It comes last, so it is the one ask left in mind. Never required: "Keep it on this phone" goes on. */
  { id: 'account', s: 'plan', k: 'account', need: (_a, env) => !!env.account },
  { id: 'done', s: 'plan', k: 'done' },
];
export const obPages = (a: SetupAnswers, env: ObEnv = {}) => OB_PAGES.filter((pg) => !pg.need || pg.need(a, env));

/** a walk-through starts from the last answers and the plan as it is now */
export function obPrefill(st: Settings | null): SetupAnswers {
  if (!st) return {};
  const prev = ((st.onb && st.onb.a) || {}) as SetupAnswers;
  const a: SetupAnswers = {};
  OB_PAGES.forEach((pg) => {
    if (pg.keep && pg.key && prev[pg.key] != null) a[pg.key] = Array.isArray(prev[pg.key]) ? (prev[pg.key] as string[]).slice() : prev[pg.key];
  });
  if (prev.ownCost) a.ownCost = prev.ownCost;
  if (prev.goal) a.goal = prev.goal;
  if (prev.thenT && prev.then && OB_THEN[prev.thenT]) {
    a.thenT = prev.thenT;
    a.then = prev.then;
    if (OB_THEN[prev.thenT][3].indexOf(prev.then) < 0) a.thenOwn = prev.then;
  }
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
  OB_KEYS.forEach((k) => {
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
  const base = st || defaultSettings(tk);
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
export function obWave(a: SetupAnswers) {
  const has = (a.when || []).length > 0;
  const label = has ? (OB_WHEN.find((x) => x[0] === obTop(a)) || [])[1] : '';
  return { h: label ? `${label}, an urge rises, peaks, and passes.` : 'Urges rise, peak, and pass.' };
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
    clear line, which is about strict counting, so in step down its place goes to the step-down why. */
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

/* the lists the pages use, re-exported here so the app takes everything about the setup from one place */
export { OB_AIM, OB_COST, OB_FAITH, OB_FREQ, OB_MINS, OB_TRIED, OB_WHEN, OB_YEARS };
