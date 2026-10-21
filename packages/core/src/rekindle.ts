/* Rekindle: what happens after a slip, as data. The legacy app builds these screens from the global Store; here each one is a
   pure function of the log, so the phone, the web and the tests all agree. The words are the legacy app's, checked against it
   by the golden tests (see test/rekindle.test.ts and the fixtures). */
import {
  addDays,
  dayKind,
  isKey,
  fmtClock,
  fmtDate,
  gameCompute,
  OB_THEN,
  optText,
  rkFullDays,
  rkKeepOf,
  rkOf,
  RK_DAYS,
  RUN_ASK,
  RUN_ASK_FROM,
  RUN_DEEP,
  runLedger,
  SLIP_STEPS,
  stepView,
  sumDay,
  URGE_PLAN,
  type RekindleState,
} from './legacy/core.js';
import { changeSettings } from './actions';
import { GRAD_DAYS, gradInfo } from './graduate';
import { changeDay, withDay } from './mutate';
import { plural } from './view';
import type { DayEvent, DayKey, Days, Reviews, Settings } from './types';

/* ---------- the words ---------- */
export const RK_WAIT: [0 | 5 | 10 | 20, string][] = [
  [0, 'No'],
  [5, '5+ min'],
  [10, '10+ min'],
  [20, '20+ min'],
];
export const RT_Q: [string, string][] = [
  ['Right before it, I was…', 'Like: in bed, scrolling'],
  ['An hour before, I was…', 'Like: home alone and bored'],
  ['Earlier that day…', 'Like: a stressful call at work'],
];
export const SR_GENERIC = ['Put my phone in another room.', 'Stand up and leave the room for 10 minutes.', 'Text or call one person.'];

/* ---------- small helpers ---------- */
/** the full Rekindle for the first slip in any 7 days (and only for the first slip that day); the short one for any other slip */
export function rkStepFor(days: Days, date: DayKey): 'rk0' | 'rkl' {
  return rkFullDays(days)[date] && sumDay(days[date]).slipped === 1 ? 'rk0' : 'rkl';
}
/** minutes waited before a slip, rounded down to the steps that are asked about */
export const rkWaitOf = (m: number): 0 | 5 | 10 | 20 => (m >= 20 ? 20 : m >= 10 ? 10 : m >= 5 ? 5 : 0);
/** "Close for tonight" in the evening and at night */
export const rkCloseWord = (hour: number) => (hour >= 18 || hour < 5 ? 'Close for tonight' : 'Close for now');
/** the safe person's name, or their first name when it is long */
export function safeName(st: Settings | null): string {
  const n = String((st && st.safePerson) || '').trim();
  return n.length <= 24 ? n : n.split(/\s+/)[0];
}
/** the person's slip plan, without the first starter step (which is what Rekindle itself is) */
export function slipCare(st: Settings | null): string[] {
  const s = st && Array.isArray(st.slipPlan) ? st.slipPlan : SLIP_STEPS;
  return s.length && s[0] === SLIP_STEPS[0] ? s.slice(1) : s.slice();
}
export function rkTellText(st: Settings | null): string {
  const nm = safeName(st);
  return (
    (nm ? 'Hey ' + nm + ', ' : 'Hey, ') +
    'rough night. I slipped. I am not looking for a lecture, I just did not want to keep it to myself. Can you check on me tomorrow?'
  );
}
/** Day 1: a text to the safe person, so the start is not a secret. Someone who does not hide is who the person is
    becoming. Daybook sends nothing: the person's own messages app opens with the words, or they copy them. */
export function startTellText(st: Settings | null): string {
  const nm = safeName(st);
  return (
    (nm ? 'Hey ' + nm + ', ' : 'Hey, ') + 'today I am starting to quit something that has had a hold on me. No need to say much. It helps to know you know.'
  );
}
/** whether Today offers it: Day 1 is today, a safe person is named, and it was not answered before */
export const tellStartDue = (st: Settings, tk: DayKey): boolean => st.day1 === tk && !!safeName(st) && !isKey(st.toldStart);
/** the card answered, either way: it does not come back */
export const tellStartDone = (st: Settings, tk: DayKey, now = Date.now()) => changeSettings(st, (s) => void (s.toldStart = tk), now);

export function lowerFirst(s: string): string {
  s = String(s || '')
    .trim()
    .replace(/[.!]+$/, '');
  return s ? (/^I\b/.test(s) ? s : s.charAt(0).toLowerCase() + s.slice(1)) + '.' : '';
}
/** "you are in bed late at night", or the person's own words for what set it off */
export function srWhen(t: string | null | undefined, st: Settings | null): string {
  const T = t ? (OB_THEN as Record<string, [number, string, string, string[]]>)[t] : undefined;
  if (T) return T[2];
  const lab = t && t !== 'other' ? optText('trig', t, st && st.opts) : '';
  return lab ? '“' + lab + '” shows up' : 'it starts to build';
}
/** "Slipped at 11:40 PM" */
export function entryLabel(ev: Pick<DayEvent, 'outcome' | 'time' | 'sp'>): string {
  const w = ev.sp && ev.outcome === 'slipped' ? 'Stopped partway' : ev.outcome === 'slipped' ? 'Slipped' : 'Rode it out';
  return w + (ev.time ? ' at ' + fmtClock(ev.time) : '');
}

/* ---------- the run that waits for you ---------- */
/** the last day a slip's quest can still save the run, as a weekday: "until Wednesday night" (RK_DAYS after the slip) */
export const rkUntil = (k: DayKey) => fmtDate(addDays(k, RK_DAYS), { weekday: 'long' });
/** "a, b and c" */
const andList = (xs: string[]) => (xs.length < 2 ? xs.join('') : xs.slice(0, -1).join(', ') + ' and ' + xs[xs.length - 1]);
export function rkOpen(days: Days, st: Settings, tk: DayKey, k: DayKey) {
  const L = runLedger(days, st, tk);
  return { L, op: L.open && L.open.k === k ? L.open : null, saved: L.kind[k] === 'saved' };
}

/* ---------- keep the run, or start fresh ---------- */
export interface RkAsk {
  /** the slip day */
  k: DayKey;
  /** the run the slip ended, in days (RUN_ASK or more) */
  run: number;
  /** a run of RUN_DEEP days or more: keeping it takes the deeper mission too */
  deep: boolean;
  /** the slip entry that holds the answer (or will) */
  evId: string;
  /** true keep the run going, false start fresh, null not answered yet */
  keep: boolean | null;
  /** the weekday the save window closes: "until Wednesday night" */
  until: string;
  /** the answer can still be given or changed: inside the window, and the run is not saved yet */
  open: boolean;
  /** the run was saved (it stays saved) */
  saved: boolean;
}
/** whether the slip on day k asks "keep the run going, or start fresh?": the first slip in 7 days, a slip that ends the day's count,
    after a run of RUN_ASK days or more, while counting days (strict or gentle). Asked while the save window is open (RK_DAYS);
    after that it still says what was answered. null when it does not ask. */
export function rkAsk(days: Days, st: Settings | null, tk: DayKey, k: DayKey): RkAsk | null {
  if (!st || !st.day1 || k < st.day1 || k > tk) return null;
  if (st.cleanMode !== 'strict' && st.cleanMode !== 'gentle') return null;
  if (!rkFullDays(days)[k] || dayKind(k, days[k], st, tk, undefined, days) !== 'slip') return null;
  const runs: Record<DayKey, number> = {};
  const L = runLedger(days, st, tk, undefined, false, runs);
  const run = runs[k] || 0;
  const r = rkOf(days, k, st);
  if (run < RUN_ASK || !r) return null;
  const keep = rkKeepOf(days[k]);
  const inWindow = tk <= addDays(k, RK_DAYS);
  if (!inWindow && keep == null) return null;
  const saved = L.kind[k] === 'saved';
  const holder = days[k].events.find((e) => e.outcome === 'slipped' && typeof e.keep === 'boolean');
  return { k, run, deep: run >= RUN_DEEP, evId: (holder || r.ev).id, keep, until: rkUntil(k), open: inWindow && !saved, saved };
}
/** the question Today shows: the latest slip's, while it can still be given or changed (inside the window, the run not saved).
    null when the latest slip in the window does not ask, or a later slip already ended the run. */
export function rkAskNow(days: Days, st: Settings | null, tk: DayKey): RkAsk | null {
  for (let i = 0; i <= RK_DAYS; i++) {
    const k = addDays(tk, -i);
    if (!sumDay(days[k]).slipped) continue;
    const a = rkAsk(days, st, tk, k);
    return a && a.open ? a : null;
  }
  return null;
}
/** the run question, still to answer. Care comes first (the owner, October 21): the slip's Rekindle asks it at its end, after
    the embers, the feeling and the record, and when it is closed before an answer, the sunrise check asks it the next morning.
    No answer is "kept for now": the run waits for the quest exactly as a kept run does (runLedger), so closing loses nothing,
    and nothing extra is stored. null when there is nothing to ask (answered, a short run, the window closed, the run saved). */
export function rkAskOpen(days: Days, st: Settings | null, tk: DayKey, k: DayKey): RkAsk | null {
  const a = rkAsk(days, st, tk, k);
  return a && a.open && a.keep == null ? a : null;
}
/** Today's card while the question waits for the sunrise check: kept for now, and when it is asked, instead of asking at night */
export function rkKeptForNow(a: Pick<RkAsk, 'k' | 'run'>, tk: DayKey): { b: string; rest: string } {
  return {
    b: 'Your ' + a.run + '-day run is kept for now.',
    rest:
      (tk <= a.k ? 'In the morning, your sunrise check asks' : 'Your sunrise check asks') +
      ' whether to keep it going or start fresh. Nothing is lost by waiting.',
  };
}
/** gives or changes the answer on the slip entry evId: keep the run going (true) or start fresh (false). Only while the save
    window is open and the run is not saved yet: a saved run stays saved. Going back to keep reopens the wait. The answer is kept
    on one slip of the day only. null when it cannot change. */
export function rkKeep(days: Days, st: Settings, tk: DayKey, k: DayKey, evId: string, keep: boolean, now = Date.now()): Days | null {
  const a = rkAsk(days, st, tk, k);
  if (!a || !a.open) return null;
  const ev = days[k].events.find((e) => e.id === evId && e.outcome === 'slipped');
  if (!ev) return null;
  if (ev.keep === keep && a.keep === keep) return days;
  const day = changeDay(
    days[k],
    k,
    (d) => {
      for (const e of d.events) {
        if (e.id === evId) e.keep = keep;
        else delete e.keep;
      }
    },
    now,
  );
  return withDay(days, k, day);
}
/** start fresh, in words: what was built stays on record, and the new run counts from the day after the slip */
export function rkFresh(days: Days, st: Settings, tk: DayKey, a: Pick<RkAsk, 'k' | 'run'>): { b: string; rest: string } {
  const L = runLedger(days, st, tk);
  const b = a.run >= L.longest ? 'Your ' + a.run + '-day run stays your longest.' : 'Your ' + a.run + ' days stay on your record.';
  const rest =
    tk <= a.k
      ? 'Your fresh run starts tomorrow. Your points, level and badges all stay.'
      : 'Your fresh run counts from ' +
        fmtDate(addDays(a.k, 1), { weekday: 'long' }) +
        (L.cur > 0 ? ', and it is already ' + plural(L.cur, 'day') : '') +
        '. Your points, level and badges all stay.';
  return { b, rest };
}
/** the two answers to "keep the run going, or start fresh?", in words that say plainly what each one means: a kept run
    goes on with the slip day in it (marked as the day you came back), once the quest is done; a fresh run counts only
    days with no slip. Both keep what was earned. The slip flow and Today's card both use these. */
export function rkChoice(days: Days, st: Settings, tk: DayKey, a: Pick<RkAsk, 'k' | 'run' | 'until'>) {
  /* the longest as of the slip: a run still waiting for the answer goes on counting after it */
  const longest = a.run >= runLedger(days, st, a.k < tk ? a.k : tk).longest;
  return {
    line: 'Both are good answers. The slip stays in your log either way, and your points, level and badges stay yours.',
    keep:
      'Finish the Rekindle quest by ' + a.until + ' night and your run goes on from ' + a.run + '. The slip day stays in it, marked as the day you came back.',
    fresh:
      'A new run ' +
      (tk <= a.k ? 'starts tomorrow' : 'counts from ' + fmtDate(addDays(a.k, 1), { weekday: 'long' })) +
      ' and counts only days with no slip. Your ' +
      plural(a.run, 'day') +
      (longest ? ' stay on record as your longest run.' : ' stay on your record.'),
  };
}
/** the start-fresh answer on day k, when it was given */
const freshOf = (days: Days, st: Settings, tk: DayKey, k: DayKey) => {
  const a = rkAsk(days, st, tk, k);
  return a && a.keep === false ? a : null;
};
/** the run a short slip ended (under RUN_ASK days): it ends at the slip, with nothing to save. 0 when it is not one. */
function shortRun(days: Days, st: Settings, tk: DayKey, k: DayKey): number {
  if (!st.day1 || k < st.day1 || k < RUN_ASK_FROM || (st.cleanMode !== 'strict' && st.cleanMode !== 'gentle')) return 0;
  if (!rkFullDays(days)[k] || dayKind(k, days[k], st, tk, undefined, days) !== 'slip') return 0;
  const runs: Record<DayKey, number> = {};
  runLedger(days, st, tk, undefined, false, runs);
  const run = runs[k] || 0;
  return run < RUN_ASK ? run : 0;
}

/* ---------- the embers (the first Rekindle screen) ---------- */
export function rkEmbers(days: Days, st: Settings, reviews: Reviews, tk: DayKey, date: DayKey, lit: boolean, sp: boolean) {
  const g = gameCompute(days, st, reviews, tk);
  const kept = ['Level ' + g.level.n + ' · ' + g.level.name, g.pts.toLocaleString('en-US') + ' points'].concat(
    g.S.rode ? [plural(g.S.rode as number, 'urge') + ' ridden out'] : [],
  );
  const h = lit ? 'Still burning. Still yours.' : sp ? 'You stopped partway. Your fire is still lit.' : 'Your fire did not go out.';
  const p = lit ? 'A slip can burn it low. It cannot put it out. Nothing was taken away.' : 'It is down to embers. Embers hold the heat.';
  const op = lit ? rkOpen(days, st, tk, date).op : null;
  const fresh = lit && !op ? freshOf(days, st, tk, date) : null;
  const short = lit && !op && !fresh ? shortRun(days, st, tk, date) : 0;
  return {
    level: g.level.n,
    h,
    p,
    kept: lit ? kept : [],
    line: op
      ? { b: 'Your ' + op.run + '-day run waits for you.', rest: 'The Rekindle quest saves it, any time until ' + rkUntil(date) + ' night.' }
      : fresh
        ? rkFresh(days, st, tk, fresh)
        : short
          ? { b: 'Your ' + plural(short, 'day') + (short === 1 ? ' is' : ' are') + ' kept.', rest: 'A new run starts tomorrow.' }
          : null,
  };
}

/** after a slip that ends a long stretch: words that honor what was built (null for a short one). A long run is a huge win
    next to where the person started, and this slip takes one day off the way to graduation, never the rest. */
export function rkHonor(days: Days, st: Settings, tk: DayKey, date: DayKey): string | null {
  const op = rkOpen(days, st, tk, date).op;
  /* a run kept going, or one the person chose to start fresh after: either way, what was built is honored */
  const run = op ? op.run : freshOf(days, st, tk, date)?.run || 0;
  if (run < RUN_ASK) return null;
  const g = gradInfo(days, st, tk);
  const grad = g.show && !g.at ? ` You are at ${g.count} of ${GRAD_DAYS} toward graduation. A slip takes one day off, never the rest.` : '';
  return `${run} days. That is huge, and it still counts.` + grad;
}

/* ---------- the short Rekindle ---------- */
export function rkLightLine(days: Days, st: Settings, date: DayKey, tk: DayKey, nowMs: number): string {
  const counting = !!(st.day1 && date >= st.day1);
  if (counting && st.cleanMode === 'step') {
    const v = stepView(days, st, nowMs);
    return (
      'This week: ' +
      plural(v.thisW, 'slip') +
      (v.target == null || !v.target ? '' : v.thisW <= v.target ? ', still inside your aim of ' + v.target + ' or fewer' : '') +
      '. Every week gets a fresh aim, and nothing you earned is gone.'
    );
  }
  if (counting) {
    /* a second slip on the day a run can still be saved: say so */
    const { op } = rkOpen(days, st, tk, date);
    if (op) return 'Your ' + op.run + '-day run can still be saved. Finish the Rekindle quest by ' + rkUntil(op.k) + ' night.';
    if (dayKind(date, days[date], st, tk, undefined, days) === 'one') return 'With gentle counting, today still counts. Nothing you earned is gone.';
    /* a run that ends here (a second slip within a week cannot be saved): what was built is kept, and said so */
    const before = runLedger(days, st, addDays(date, -1)).cur;
    const kept = (before === 1 ? 'Your 1 day is kept' : 'Your ' + before + ' days are kept') + ', and so are your points, level and badges.';
    /* another slip on the day the person chose to start fresh, or on the day a short run ended: the run ended with the first slip */
    if (before > 0 && freshOf(days, st, tk, date)) return 'You chose to start fresh, so a new run starts tomorrow. ' + kept;
    if (before > 0 && shortRun(days, st, tk, date)) return 'A new run starts tomorrow. ' + kept;
    return before > 0
      ? 'A second slip within a week cannot be saved, so a new run starts tomorrow. ' + kept
      : 'Your next run starts tomorrow. Your points, level and badges all stay.';
  }
  return 'Nothing is being counted yet, so nothing was lost. Your points, level and badges all stay.';
}

/* ---------- the missions ---------- */
export type MissionAction = 'small' | 'phone' | 'trace' | 'tell' | null;
export interface Mission {
  key: 'm1' | 'm2' | 'm3' | 'm4';
  done: boolean;
  icon: string;
  title: string;
  sub: string;
  pts: number | null;
  /** buttons to show while it is not done */
  actions: { act: MissionAction; label: string }[];
}

/** the missions list (legacy rkMissions). where: in the scene right after the slip, or on Today. left: only what is left.
    until: the weekday the quest closes, for the sunrise check's words. */
export function rkMissions(
  r: RekindleState,
  st: Settings,
  o: { where: 'scene' | 'today'; deep: boolean; left?: boolean; hour: number; until?: string },
): Mission[] {
  const off = fmtClock(st.screensOff);
  const eve = o.hour >= 18 || o.hour < (st.rollover || 4);
  const nm = safeName(st);
  const deep: Mission | null = o.deep
    ? {
        key: 'm4',
        done: r.m4,
        icon: r.m4 ? 'check' : 'compass',
        title: 'Go deeper',
        sub: r.m4
          ? r.ev.rk && r.ev.rk.dp === 'tell'
            ? 'Done. You told someone. That takes real courage.'
            : 'Done. You traced it back to where it started.'
          : 'Your run is ' + RUN_DEEP + ' days or more, so one more: trace the slip back, or tell ' + (nm ? nm : 'someone you trust') + '.',
        pts: null,
        actions: r.m4
          ? []
          : [
              { act: 'trace', label: 'Trace it back' },
              { act: 'tell', label: nm ? 'Tell ' + nm : 'Tell someone' },
            ],
      }
    : null;
  const m1: Mission = {
    key: 'm1',
    done: r.m1,
    icon: r.m1 ? 'check' : 'bolt',
    title: 'One small thing',
    sub: r.m1 ? 'Done. That is how the snowball stops.' : 'Water, step outside, or text someone.',
    pts: 10,
    actions: r.m1 ? [] : [{ act: 'small', label: 'I did it' }],
  };
  const m2: Mission = {
    key: 'm2',
    done: r.m2,
    icon: r.m2 ? 'check' : 'moon',
    title: 'Phone away, one night',
    sub: r.m2
      ? 'Done. Sleep is part of the plan.'
      : o.where === 'today'
        ? eve
          ? 'Tap it when you put the phone down.'
          : 'Put it down by ' + off + '. The button shows up here this evening.'
        : 'Put it down by ' + off + ', then tap “Phone away” on Today.',
    pts: 5,
    actions: !r.m2 && o.where === 'today' && eve ? [{ act: 'phone', label: 'Phone away' }] : [],
  };
  /* what is left: the phone can go away any night until the quest closes */
  if (o.left) {
    const out: Mission[] = [];
    if (!r.m1) out.push({ ...m1, sub: 'Water, step outside, or text someone.' });
    if (!r.m2) out.push(m2);
    if (o.deep && !r.m4 && deep) out.push(deep);
    return out;
  }
  const m3: Mission = {
    key: 'm3',
    done: r.m3,
    icon: r.m3 ? 'check' : 'sunrise',
    title: 'Sunrise check',
    sub: r.m3 ? 'Done.' : (o.until ? 'One morning until ' + o.until : 'Tomorrow morning') + ', about two minutes. It waits for you on Today.',
    pts: 15,
    actions: [],
  };
  return [m1, m2, m3].concat(deep ? [deep] : []);
}

/* ---------- the quest, right after the slip ---------- */
export function rkQuest(days: Days, st: Settings, tk: DayKey, date: DayKey, ev: DayEvent | null, hour: number) {
  const r: RekindleState =
    rkOf(days, date, st) || ({ k: date, ev: ev as DayEvent, m1: !!(ev && ev.recovered), m2: false, m3: false, m4: false, n: 0 } as RekindleState);
  const { op } = rkOpen(days, st, tk, date);
  const deep = !!(op && op.deep);
  const u = rkUntil(date);
  return {
    r,
    flames: [r.m1, r.m2, r.m3].concat(deep ? [r.m4] : []),
    h: op ? 'Save your ' + op.run + '-day run' : 'Your Rekindle quest',
    p: op
      ? (deep ? 'Four' : 'Three') + ' steps, any time until ' + u + ' night. Your run waits for you.'
      : 'Three small missions, any time until ' + u + ' night. Each one lights a flame.',
    askWait: st.cleanMode === 'step',
    missions: rkMissions(r, st, { where: 'scene', deep, hour, until: u }),
    prize: op
      ? { b: 'Finish them all: your run is saved', s: 'Plus the Rekindled badge and 20 bonus points.' }
      : { b: 'Light all three: Rekindled', s: 'A new badge and 20 bonus points.' },
    done: rkCloseWord(hour) === 'Close for tonight' ? 'Done for tonight' : 'Done',
  };
}

/* ---------- on Today ---------- */
/** the quest the day of the slip; the sunrise the next day; and after that, while the run still waits to be saved (RK_DAYS) */
export function rkActive(days: Days, st: Settings | null, tk: DayKey): (RekindleState & { phase: 'day' | 'sun' }) | null {
  if (!st) return null;
  const full = rkFullDays(days);
  const t = full[tk] ? rkOf(days, tk, st) : null;
  if (t) return { phase: 'day', ...t };
  for (let i = 1; i <= RK_DAYS; i++) {
    const k = addDays(tk, -i);
    const r = full[k] ? rkOf(days, k, st) : null;
    if (!r) continue;
    if (i === 1 || runLedger(days, st, tk).kind[k] === 'open') return { phase: 'sun', ...r };
    return null;
  }
  return null;
}

export interface RkCard {
  kind: 'day' | 'sun' | 'almost' | 'done';
  line: boolean;
  h: string;
  p: string;
  flames: boolean[];
  why: string | null;
  missions: Mission[];
  care: string[];
  sunrise: boolean;
  quote: { when: string; then: string } | null;
  icon: string;
}

/** the Rekindle card on Today (legacy rkCardHtml), as data */
export function rkCard(days: Days, st: Settings, tk: DayKey, r: RekindleState & { phase: 'day' | 'sun' }, hour: number): RkCard {
  const { L, op, saved } = rkOpen(days, st, tk, r.k);
  const deep = !!(op && op.deep) || (saved && r.m4);
  const flames = [r.m1, r.m2, r.m3].concat(deep ? [r.m4] : []);
  const lit = flames.filter(Boolean).length;
  const u = rkUntil(r.k);
  const base = { flames, why: null, missions: [] as Mission[], care: [] as string[], sunrise: false, quote: null, line: !!op };
  if (r.phase === 'day') {
    const fresh = op ? null : freshOf(days, st, tk, r.k);
    return {
      ...base,
      kind: 'day',
      icon: 'flame',
      h: op ? 'Save your ' + op.run + '-day run' : 'Rekindle quest',
      p: plural(flames.length - lit, 'step') + ' left · until ' + u + ' night',
      why: op ? 'Your run waits for you. The slip stays in your log either way.' : fresh ? 'You chose to start fresh. ' + rkFresh(days, st, tk, fresh).b : null,
      missions: rkMissions(r, st, { where: 'today', deep: !!(op && op.deep), hour, until: u }),
      care: slipCare(st),
    };
  }
  if (!r.m3) {
    return {
      ...base,
      kind: 'sun',
      line: false,
      icon: 'sunrise',
      h: tk === addDays(r.k, 1) ? 'The morning after' : op ? 'Your ' + op.run + '-day run is waiting' : 'Your sunrise check',
      p: op
        ? 'Your ' + op.run + '-day run waits until ' + u + ' night. The sunrise check is the next step.'
        : 'Your sunrise check is ready. About two minutes.',
      sunrise: true,
      missions: op && (!r.m1 || !r.m2 || (op.deep && !r.m4)) ? rkMissions(r, st, { where: 'today', deep: op.deep, left: true, hour, until: u }) : [],
    };
  }
  if (op) {
    return {
      ...base,
      kind: 'almost',
      icon: 'flame',
      h: 'Your ' + op.run + '-day run is waiting',
      p: plural(flames.length - lit, 'step') + ' left · it waits until ' + u + ' night.',
      missions: rkMissions(r, st, { where: 'today', deep: op.deep, left: true, hour, until: u }),
    };
  }
  const pl = r.ev.rk && r.ev.rk.pl;
  /* the sunrise check is done and steps are left: they can still be done until the quest closes, so they stay here with
     their buttons (a score with no way to finish it is worse than no score) */
  const left = !saved && r.n < 3 && tk <= addDays(r.k, RK_DAYS) ? rkMissions(r, st, { where: 'today', deep: false, left: true, hour, until: u }) : [];
  return {
    ...base,
    kind: 'done',
    line: false,
    icon: r.n === 3 || saved ? 'flame' : 'sunrise',
    h: saved ? 'Run saved' : r.n === 3 ? 'Rekindled' : 'You came back',
    p: saved
      ? 'Your run is ' + plural(L.cur, 'day') + ' and still going. The gold mark on your calendar shows where you came back.'
      : r.n === 3
        ? 'All three missions done. Your fire is back to full.'
        : left.length
          ? 'That is the real skill. ' + plural(left.length, 'small step') + ' left, any time until ' + u + ' night.'
          : 'That is the real skill.',
    missions: left,
    quote: pl ? { when: srWhen(r.ev.trigger, st), then: lowerFirst(pl) } : null,
  };
}

/* ---------- when a run ends ---------- */
export interface RkEnded {
  /** the run that ended, in days */
  run: number;
  /** clock: the quest closed with steps left. again: a second slip within a week, which cannot be saved. fresh: the person
      chose to start fresh (said once the answer can no longer change) */
  why: 'clock' | 'again' | 'fresh';
  lit: number;
  of: number;
  longest: number;
  /** the count toward graduation, when it is shown */
  grad: number | null;
  text: string;
}
/** the morning after a run ends: what was built, said once, on that one day (never a silent drop). null on any other day. */
export function rkEnded(days: Days, st: Settings, tk: DayKey): RkEnded | null {
  if (!st.day1 || (st.cleanMode !== 'strict' && st.cleanMode !== 'gentle')) return null;
  const full = rkFullDays(days);
  const L = runLedger(days, st, tk);
  /* a slip logged on its day: the slips counted from a gap away have no quest and no card of their own */
  const slip = (k: DayKey) => k >= st.day1! && sumDay(days[k]).slipped > 0 && dayKind(k, days[k], st, tk, undefined, days) === 'slip';
  for (let i = 1; i <= RK_DAYS + 1; i++) {
    const k = addDays(tk, -i);
    if (!slip(k) || L.kind[k] === 'saved' || L.kind[k] === 'open') continue;
    if (addDays(k, full[k] ? RK_DAYS + 1 : 1) !== tk) continue;
    /* a quest that closed after a later slip had already ended the run: that slip's morning said it */
    if (full[k] && Array.from({ length: RK_DAYS }, (_, j) => addDays(k, j + 1)).some(slip)) continue;
    const run = runLedger(days, st, addDays(k, -1)).cur;
    if (run < 1) return null;
    /* a short run ends at the slip, with no quest to close: the slip's own screens said so */
    if (full[k] && k >= RUN_ASK_FROM && run < RUN_ASK) return null;
    const r = rkOf(days, k, st);
    const fresh = full[k] && rkKeepOf(days[k]) === false;
    const deep = run >= RUN_DEEP && !fresh;
    const lit = r ? [r.m1, r.m2, r.m3, deep && r.m4].filter(Boolean).length : 0;
    const of = deep ? 4 : 3;
    const g = gradInfo(days, st, tk);
    const counts = L.cur > 0 ? ', and it is already ' + L.cur + (L.cur === 1 ? ' day' : ' days') : '';
    if (fresh) {
      const text =
        'You chose to start fresh. Your new run counts from ' + fmtDate(addDays(k, 1), { weekday: 'long' }) + counts + '. What you built stays yours.';
      return { run, why: 'fresh', lit, of, longest: L.longest, grad: g.show && !g.at ? g.count : null, text };
    }
    const text = full[k]
      ? 'The quest closed last night with ' +
        lit +
        ' of ' +
        of +
        ' lit. Your new run counts from ' +
        fmtDate(addDays(k, 1), { weekday: 'long' }) +
        counts +
        '. What you built stays yours.'
      : 'A second slip within a week cannot be saved, so a new run started today. What you built stays yours.';
    return { run, why: full[k] ? 'clock' : 'again', lit, of, longest: L.longest, grad: g.show && !g.at ? g.count : null, text };
  }
  return null;
}

/* ---------- the sunrise check ---------- */
/** the steps: hello, the run question when it is still open and unanswered (given st: rkAskOpen), last night's screens (when
    not answered and the phone was not put away), what came before, the plan. Last night is the night before today (tk), which
    is the slip's night the morning after. */
export function srSteps(days: Days, r: RekindleState, tk: DayKey = addDays(r.k, 1), st?: Settings | null): string[] {
  const d = days[addDays(tk, -1)];
  const so = d && d.checkin ? d.checkin.so : null;
  const run = st && rkAskOpen(days, st, tk, r.k) ? ['run'] : [];
  return ['hi'].concat(run, !r.m2 && so == null ? ['so'] : [], ['before', 'plan']);
}

/** the plans to pick from: the person's own plan for this moment first (from My plan), then a few that fit it */
export function srPlanInfo(ev: DayEvent | null, st: Settings) {
  const t = ev && ev.trigger;
  const T = t ? (OB_THEN as Record<string, [number, string, string, string[]]>)[t] || null : null;
  let mine: string | null = null;
  const opts = T ? T[3].slice() : SR_GENERIC.slice();
  if (T) {
    const r = st.plan[T[0]];
    if (r && r.when === T[1] && r.then && r.then.trim()) mine = r.then.trim();
  }
  if (mine) {
    const j = opts.indexOf(mine);
    if (j >= 0) opts.splice(j, 1);
    opts.unshift(mine);
  }
  return { T, t: t || null, mine, opts };
}

/** finishing the sunrise check: the plan is saved on the slip, and copied into My plan when that moment's slot is free
    (never over words the person typed there). Returns the new log and settings, and whether the plan went into My plan. */
export function srFinish(
  days: Days,
  st: Settings,
  k: DayKey,
  evId: string,
  text: string,
  tk: DayKey,
  now = Date.now(),
): { days: Days; st: Settings; toPlan: boolean } {
  const ev = days[k]?.events.find((x) => x.id === evId) || null;
  if (!ev) return { days, st, toPlan: false };
  const P = srPlanInfo(ev, st);
  let toPlan = false;
  let nst = st;
  if (text && P.T) {
    const T = P.T;
    const r = st.plan[T[0]];
    const cur = r && r.then ? r.then.trim() : '';
    const dflt = URGE_PLAN[T[0]] ? URGE_PLAN[T[0]][1] : '';
    const free = !cur || (r.when === T[1] && (cur === text || cur === dflt || T[3].indexOf(cur) >= 0));
    if (free) {
      if (!(r && r.when === T[1] && cur === text)) nst = changeSettings(st, (s) => void (s.plan[T[0]] = { when: T[1], then: text }), now);
      toPlan = true;
    }
  }
  const day = changeDay(
    days[k],
    k,
    (d) => {
      const e = d.events.find((x) => x.id === evId);
      if (e) e.rk = { ...(e.rk || {}), at: tk, pl: text || '' };
    },
    now,
  );
  return { days: withDay(days, k, day), st: nst, toPlan };
}

/** the end of the sunrise check (legacy srEndHtml), as words */
export function srEnd(days: Days, st: Settings, tk: DayKey, k: DayKey, r: RekindleState, run0: number) {
  const { L, op, saved } = rkOpen(days, st, tk, k);
  const n = r.n;
  const deep = !!(op && op.deep) || (saved && r.m4);
  const h = saved
    ? 'Run saved.'
    : op
      ? 'Almost there.'
      : n === 3
        ? 'Rekindled.'
        : n === 2
          ? 'Two of three lit. That is a real comeback.'
          : 'You came back. That is the skill.';
  /* what is left, and an honest "screens stayed on" thanked: the phone can go away another night */
  const left = [!r.m1 ? 'one small thing' : '', !r.m2 ? 'the phone away one night' : '', deep && !r.m4 ? 'going deeper' : ''].filter(Boolean);
  const honest = !r.m2 && days[addDays(tk, -1)]?.checkin?.so === 'N';
  const sub = saved
    ? 'Your run is ' + plural(L.cur, 'day') + ' and still going.' + (n === 3 ? ' The Rekindled badge is yours too.' : '')
    : op
      ? (honest ? 'Thank you for being honest. ' : '') +
        (left.length ? 'Left to do: ' + andList(left) + ', any time until ' + rkUntil(k) + ' night. ' : '') +
        'Your ' +
        op.run +
        '-day run waits for you.'
      : run0
        ? 'Every flame you lit still counts, and your longest run stays.'
        : n === 3
          ? 'All three missions done. Your fire is back to full, and the Rekindled badge is yours.'
          : 'Every flame you lit counts. Light all three next time for the badge.';
  return { h, sub, flames: [r.m1, r.m2, r.m3].concat(deep ? [r.m4] : []), celebrate: n === 3 || saved, op, saved };
}

/* ---------- going deeper (the fourth mission for a run of 14 days or more) ---------- */
export function rkDeep(days: Days, st: Settings, k: DayKey, kind: 'trace' | 'tell', tr?: string[], now = Date.now()): Days | null {
  const r = rkOf(days, k, st);
  if (!r) return null;
  const day = changeDay(
    days[k],
    k,
    (d) => {
      const e = d.events.find((x) => x.id === r.ev.id);
      if (!e) return;
      const rk = { ...(e.rk || {}), dp: kind };
      if (tr) rk.tr = [0, 1, 2].map((i) => String(tr[i] == null ? '' : tr[i]).slice(0, 200)) as [string, string, string];
      e.rk = rk;
    },
    now,
  );
  return withDay(days, k, day);
}
