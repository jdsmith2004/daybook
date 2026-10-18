/* The Today cards as data. The legacy app builds these inside its HTML templates, reading the global Store and the clock.
   Here they are pure: the screen passes in the log, the settings, today's key and the time, and gets back what to show.
   Each one is checked against the legacy app by the golden tests, so the words and numbers match it exactly. */
import {
  addDays,
  DID_T,
  didIds,
  didText,
  fmtClock,
  trigText,
  allKeys,
  dayKind,
  diffDays,
  fmtDate as fmtDateShort,
  fmtStretch,
  fmtStretchShort,
  maxKey,
  phaseOf,
  roughPatch,
  slipMoments,
  stepView,
  streaks,
  sumDay,
  type DayKindName,
  type RunLedger,
  type StepView,
} from './legacy/core.js';
import type { DayEvent, DayKey, Days, Settings } from './types';

export const RUN_GOALS = [3, 7, 14, 30, 60, 90, 180, 365];
export const plural = (n: number, w: string) => n + ' ' + w + (n === 1 ? '' : 's');

export type CellKind = DayKindName | 'saved' | 'open';

export interface CleanView {
  mode: 'strict' | 'gentle';
  tracking: boolean;
  cells: { k: DayKey; kind: CellKind; today: boolean }[];
  good: number;
  span: number;
  cur: number;
  longest: number;
  counted: number;
  first: DayKey;
  /* tracking only */
  phase?: string;
  tday?: number;
  tlen?: number;
  /* counting only */
  saves?: number;
  open?: RunLedger['open'];
  backH?: number | null;
  next?: number | null;
}

/** the Days card: the last 30 days, the run, the comeback hours and the next goal (legacy cleanView) */
export function cleanView(days: Days, st: Settings, tk: DayKey, nowMs: number): CleanView {
  const mode = st.cleanMode === 'gentle' ? 'gentle' : 'strict';
  const v: CleanView = {
    mode,
    tracking: !st.day1 || tk < st.day1,
    cells: [],
    good: 0,
    span: 0,
    cur: 0,
    longest: 0,
    counted: 0,
    first: tk,
  };
  if (v.tracking) {
    const ph = phaseOf(tk, st);
    v.phase = ph.p;
    v.tday = ph.n;
    v.tlen = st.day1 ? diffDays(st.day1, st.start) : 0;
    return v;
  }
  const sk = streaks(days, st, tk, mode, false);
  v.cur = sk.cur;
  v.longest = sk.longest;
  v.counted = sk.counted;
  v.span = Math.min(30, sk.counted);
  v.saves = sk.saves;
  v.open = sk.open;
  /* the first month fills in from Day 1; after that it is always the last 30 days. A saved slip day keeps its own mark. */
  v.first = sk.counted <= 30 ? (st.day1 as DayKey) : addDays(tk, -29);
  for (let i = 0; i < 30; i++) {
    const k = addDays(v.first, i);
    const kind: CellKind = sk.kind[k] || dayKind(k, days[k], st, tk, mode);
    v.cells.push({ k, kind, today: k === tk });
    if (kind === 'ok' || kind === 'one') v.good++;
  }
  /* the comeback: hours since the last slip, while the run is short and the slip was recent */
  const sl = slipMoments(days, st, nowMs);
  const last = sl.length ? sl[sl.length - 1] : null;
  v.backH = last != null && !v.open && v.cur <= 3 ? (nowMs - last) / 36e5 : null;
  if (v.backH != null && v.backH >= 72) v.backH = null;
  v.next = v.longest > v.cur ? (RUN_GOALS.find((n) => n > v.cur) ?? null) : null;
  return v;
}

/** the tracking week's facts: days logged, urges ridden out, slips logged (legacy trackFacts) */
export function trackFacts(days: Days, tk: DayKey) {
  let dl = 0;
  let rode = 0;
  let slips = 0;
  allKeys(days).forEach((k) => {
    if (k > tk) return;
    const s = sumDay(days[k]);
    if (s.n || s.checked) dl++;
    rode += s.rode;
    slips += s.slipped;
  });
  return { dl, rode, slips };
}

/** the chips under the Days card (legacy runChips), as data */
export function runChips(v: CleanView) {
  let main: { kind: 'line' | 'soft' | 'run'; small?: string; text: string; saved?: number };
  if (v.open) main = { kind: 'line', small: 'Can keep going', text: plural(v.open.run, 'day') };
  else if (v.backH != null) main = { kind: 'soft', small: 'Comeback', text: fmtStretch(v.backH) };
  else if (v.cur > 0) main = { kind: 'run', small: 'Current run', text: plural(v.cur, 'day'), saved: v.saves || 0 };
  else main = { kind: 'soft', text: 'Next run starts tomorrow' };
  return {
    main,
    longest: v.longest > 0 ? plural(v.longest, 'day') : null,
    next: v.next && !v.open ? plural(v.next, 'day') : null,
    line: v.open ? 'Your run can keep going after this slip. Finish the Rekindle quest by tomorrow night.' : null,
  };
}

/** the Days card in words (legacy daysCardHtml, the parts that are text) */
export function daysCardText(days: Days, st: Settings, v: CleanView, tk: DayKey) {
  if (v.tracking) {
    const f = trackFacts(days, tk);
    const d1 = st.day1;
    const eyebrow =
      v.phase === 'before'
        ? 'Not started yet'
        : d1
          ? (v.tlen === 7 ? 'Tracking week' : 'Tracking') + ' · day ' + v.tday + ' of ' + v.tlen
          : 'Just tracking · day ' + v.tday;
    return { tracking: true as const, eyebrow, facts: f };
  }
  const gentle = v.mode === 'gentle';
  return {
    tracking: false as const,
    /* in step down, the Days card is the step-down card (see stepCard) */
    step: st.cleanMode === 'step',
    eyebrow: st.cleanMode === 'step' ? 'Step down' : gentle ? 'Good days' : 'No slip logged',
    good: v.good,
    of: v.counted > 30 ? 'of the last 30 days' : 'of ' + plural(v.counted, 'day') + ' so far',
    sub: gentle
      ? 'A day counts with one slip or fewer. Every slip is still logged.'
      : 'A day counts when no slip is logged. A day with nothing logged counts too.',
  };
}

export interface StepCard {
  v: StepView;
  pct: number;
  hero: string;
  heroSub: string;
  goalLine: string;
  week: { big: string; text: string };
  wait: { big: string; text: string };
  best: { big: string; text: string };
  hh: { state: 'before' | 'during' | 'lost' | 'won'; day: boolean; text: string; won: string | null } | null;
  ready: string | null;
  help: boolean;
}

/** whether hard hours like "10 AM to 12 PM" start in the daytime (5 AM to 4 PM), so the words say today, not tonight */
export function isDayHours(label: string): boolean {
  const m = /^(\d{1,2}) (AM|PM)/.exec(label);
  if (!m) return false;
  const h = (+m[1] % 12) + (m[2] === 'PM' ? 12 : 0);
  return h >= 5 && h < 17;
}

/** the step-down card (legacy stepCardHtml), as data */
export function stepCard(days: Days, st: Settings, nowMs: number): StepCard {
  const v = stepView(days, st, nowMs);
  const pct = Math.max(3, Math.min(100, Math.round((v.curH / v.goal) * 100)));
  let goalLine: string;
  if (!v.slips) goalLine = 'No slip logged yet. Next goal: ' + fmtStretch(v.goal) + '.';
  else if (v.bestPast > v.curH)
    goalLine = fmtStretch(v.bestPast - v.curH).replace(/^under an hour$/, 'Under an hour') + ' more to beat your best (' + fmtStretch(v.bestPast) + ').';
  else if (v.bestPast > 0) goalLine = 'New best. Next goal: ' + fmtStretch(v.goal) + '.';
  else goalLine = 'Next goal: ' + fmtStretch(v.goal) + '.';
  const week =
    v.target == null
      ? { big: String(v.thisW), text: (v.thisW === 1 ? 'slip' : 'slips') + ' this week. Next week gets an aim.' }
      : {
          big: String(v.thisW),
          text: (v.thisW === 1 ? 'slip' : 'slips') + ' this week · aim: ' + (v.target ? v.target + ' or fewer' : 'none'),
        };
  const wait = v.wSl ? { big: v.wWait + ' of ' + v.wSl, text: 'waited first this week' } : { big: '0', text: 'slips to wait out this week' };
  const best = {
    big: fmtStretchShort(v.best),
    text: 'your best stretch' + (v.usual != null ? ' · usual about ' + fmtStretch(v.usual) : ''),
  };
  let hh: StepCard['hh'] = null;
  if (v.hh) {
    /* hard hours that start in the daytime (5 AM to 4 PM) are today's, not tonight's */
    const day = isDayHours(v.hh.label);
    const when = day ? 'Today’s' : 'Tonight’s';
    const msg = {
      before: when + ' hard hours: ' + v.hh.label + '. Phone away before then.',
      during: 'You are in your hard hours now (' + v.hh.label + '). Phone away, and SOS is one tap.',
      won: 'You got through your hard hours ' + (day ? 'today' : 'tonight') + ' (' + v.hh.label + ').',
      lost: when + ' hard hours were hard. Tomorrow is another try.',
    }[v.hh.state];
    hh = { state: v.hh.state, day, text: msg, won: v.hh.won ? plural(v.hh.won, day ? 'day' : 'night') + ' won' : null };
  }
  return {
    v,
    pct,
    hero: fmtStretch(v.curH),
    heroSub: v.slips ? 'since your last slip' : 'and counting',
    goalLine,
    week,
    wait,
    best,
    hh,
    ready: v.ready ? (v.bestSince >= 168 ? 'Your stretch passed a week.' : 'You got through a week with one slip or none.') : null,
    help: v.help,
  };
}

/** whether Today offers the step-down plan (legacy stepOfferHtml's test) */
export function stepOffer(days: Days, st: Settings, tk: DayKey): boolean {
  if (!st || st.cleanMode === 'step' || st.cleanNote || !st.day1 || tk < st.day1) return false;
  if (st.stepNo && tk < addDays(st.stepNo, 14)) return false;
  if (st.cleanHold && tk < addDays(st.cleanHold, 14)) return false;
  const from = maxKey(st.start, addDays(tk, -6));
  const n = diffDays(tk, from) + 1;
  if (n < 5) return false;
  let sd = 0;
  for (let k = from; k <= tk; k = addDays(k, 1)) if (sumDay(days[k]).slipped > 0) sd++;
  return sd >= 3;
}

/** whether Daybook should switch to step down by itself now (legacy cleanAutoCheck's test). The caller saves the change. */
export function shouldAutoStep(days: Days, st: Settings, tk: DayKey): boolean {
  if (!st) return false;
  if (st.cleanMode === 'step' || st.cleanAuto === false) return false;
  if (st.cleanHold && tk < addDays(st.cleanHold, 14)) return false;
  return roughPatch(days, st, tk);
}

/** one entry in a list (legacy eventRow): the time, what happened, and the details in a line */
export function eventRow(e: DayEvent, st: Settings | null) {
  const op = st && st.opts;
  const meta: string[] = [];
  const tx = e.trigger ? trigText(e.trigger, op) : '';
  if (tx) meta.push(tx);
  if (e.outcome === 'rode' && e.paused === true) meta.push('paused 10 min');
  /* a full pause is already said as "paused 10 min", so it is not said twice. A pause ended early reads as "paused". */
  if (e.outcome === 'rode')
    didIds(e.did).forEach((x) => {
      if (x === 'pause' && e.paused === true) return;
      const dx = x === 'pause' ? 'paused' : DID_T[x] ? DID_T[x].toLowerCase() : didText(x, op);
      if (dx) meta.push(dx);
    });
  if (e.outcome === 'slipped' && e.recovered) meta.push('small step within the hour');
  return { time: e.time ? fmtClock(e.time) : 'Time ?', what: e.outcome === 'rode' ? 'Rode it out' : 'Slipped', meta: meta.join(' · ') };
}

/** "2 times", and "1 rode it out · 1 slipped" (legacy countText and countDetail) */
export function countText(s: { n: number; rode: number; slipped: number }) {
  return {
    n: !s.n ? 'Nothing yet' : `${s.n} ${s.n === 1 ? 'time' : 'times'}`,
    detail: [s.rode ? `${s.rode} rode it out` : '', s.slipped ? `${s.slipped} slipped` : ''].filter(Boolean).join(' · '),
  };
}

/** where you are, under the date on Today (legacy phaseLabel) */
export function phaseLabel(key: DayKey, st: Settings): string {
  const ph = phaseOf(key, st);
  if (ph.p === 'before') return 'Starts ' + fmtDateShort(st.start);
  if (ph.p === 'quitting') return (st.cleanMode === 'step' ? 'Stepping down' : 'Quitting') + ' · day ' + ph.n;
  const len = st.day1 ? diffDays(st.day1, st.start) : 0;
  return len && ph.n <= len ? (len === 7 ? 'Tracking week' : 'Tracking') + ` · day ${ph.n} of ${len}` : 'Just tracking · day ' + ph.n;
}
