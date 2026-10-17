/* Rekindle: what happens after a slip, as data. The legacy app builds these screens from the global Store; here each one is a
   pure function of the log, so the phone, the web and the tests all agree. The words are the legacy app's, checked against it
   by the golden tests (see test/rekindle.test.ts and the fixtures). */
import {
  addDays,
  dayKind,
  fmtClock,
  gameCompute,
  OB_THEN,
  optText,
  rkFullDays,
  rkOf,
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
export const RK_STEPS = ['rk0', 'rk1', 'rk2', 'rk3'] as const;
export const RK_CARDS = [
  {
    h: 'Your brain hit the gas.',
    art: 'rush',
    al: 'A line that shoots up into a sharp spike, then drops right back down',
    p: 'Porn sets off the brain’s reward system fast and hard, especially when it is new. That is why the pull felt so urgent, and why it was over so quickly. A strong habit does not make you a weak person. Habits can be retrained.',
  },
  {
    h: 'The crash is a wave too.',
    art: 'crash',
    al: 'A line that dips low, then climbs back up toward a rising sun',
    p: 'The flat, heavy feeling afterward is very common. It feels like the truth about you. It is not. It is a mood, and it usually eases with sleep and time.',
  },
  {
    h: 'Watch for “I already blew it.”',
    art: 'trap',
    al: 'From one slip, two paths. “I blew it” leads on to more. “Just one slip” leads back on track.',
    p: 'That thought is the real danger. Researchers call it the abstinence violation effect: one slip turns into “might as well keep going.” Now you know its name. One slip is just one slip.',
    fact: 'Being kind to yourself works. In studies, people who met a mistake with kindness tried harder to do better next time, not less.',
    src: 'Breines & Chen, 2012',
  },
] as { h: string; art: 'rush' | 'crash' | 'trap'; al: string; p: string; fact?: string; src?: string }[];
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

/* ---------- the run on the line ---------- */
export function rkOpen(days: Days, st: Settings, tk: DayKey, k: DayKey) {
  const L = runLedger(days, st, tk);
  return { L, op: L.open && L.open.k === k ? L.open : null, saved: L.kind[k] === 'saved' };
}

/* ---------- the embers (the first Rekindle screen) ---------- */
export function rkEmbers(days: Days, st: Settings, reviews: Reviews, tk: DayKey, date: DayKey, lit: boolean, sp: boolean) {
  const g = gameCompute(days, st, reviews, tk);
  const kept = ['Level ' + g.level.n + ' · ' + g.level.name, g.pts + ' points'].concat(g.S.rode ? [plural(g.S.rode as number, 'urge') + ' ridden out'] : []);
  const h = lit ? 'Still burning. Still yours.' : sp ? 'You stopped partway. Your fire is still lit.' : 'Your fire did not go out.';
  const p = lit ? 'A slip can burn it low. It cannot put it out. Nothing was taken away.' : 'It is down to embers. Embers hold the heat.';
  const op = lit ? rkOpen(days, st, tk, date).op : null;
  return {
    level: g.level.n,
    h,
    p,
    kept: lit ? kept : [],
    line: op ? { b: 'Your ' + op.run + '-day run is on the line, not over.', rest: 'Finish the Rekindle quest by tomorrow night and it keeps going.' } : null,
  };
}

/** after a slip that ends a long stretch: words that honor what was built (null for a short one). A long run is a huge win
    next to where the person started, and this slip takes one day off the way to graduation, never the rest. */
export function rkHonor(days: Days, st: Settings, tk: DayKey, date: DayKey): string | null {
  const op = rkOpen(days, st, tk, date).op;
  if (!op || op.run < 7) return null;
  const g = gradInfo(days, st, tk);
  const grad = g.show && !g.at ? ` You are at ${g.count} of ${GRAD_DAYS} toward graduation. A slip takes one day off, never the rest.` : '';
  return `${op.run} days. That is huge, and it still counts.` + grad;
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
    /* a second slip on the day a run is on the line: that run can still be saved, so say so */
    const { op } = rkOpen(days, st, tk, date);
    if (op) return 'Your ' + op.run + '-day run is still on the line. Finish the Rekindle quest by tomorrow night and it keeps going.';
    return dayKind(date, days[date], st, tk) === 'one'
      ? 'With gentle counting, today still counts. Nothing you earned is gone.'
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

/** the missions list (legacy rkMissions). where: in the scene right after the slip, or on Today. left: only what is left. */
export function rkMissions(r: RekindleState, st: Settings, o: { where: 'scene' | 'today'; deep: boolean; left?: boolean; hour: number }): Mission[] {
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
  if (o.left) {
    const out: Mission[] = [];
    if (!r.m1) out.push({ ...m1, sub: 'Water, step outside, or text someone.' });
    if (o.deep && !r.m4 && deep) out.push(deep);
    return out;
  }
  const m2: Mission = {
    key: 'm2',
    done: r.m2,
    icon: r.m2 ? 'check' : 'moon',
    title: 'Phone away tonight',
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
  const m3: Mission = {
    key: 'm3',
    done: r.m3,
    icon: r.m3 ? 'check' : 'sunrise',
    title: 'Sunrise check',
    sub: r.m3 ? 'Done.' : 'Tomorrow morning, about two minutes. It waits for you on Today.',
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
  return {
    r,
    flames: [r.m1, r.m2, r.m3].concat(deep ? [r.m4] : []),
    h: op ? 'Save your ' + op.run + '-day run' : 'Your Rekindle quest',
    p: op
      ? 'Finish all ' + (deep ? 'four' : 'three') + ' missions by tomorrow night and your run keeps going. Each one lights a flame.'
      : 'Three small missions before tomorrow night. Each one lights a flame.',
    askWait: st.cleanMode === 'step',
    missions: rkMissions(r, st, { where: 'scene', deep, hour }),
    prize: op
      ? { b: 'Finish them all: your run is saved', s: 'Plus the Rekindled badge and 20 bonus points.' }
      : { b: 'Light all three: Rekindled', s: 'A new badge and 20 bonus points.' },
    done: rkCloseWord(hour) === 'Close for tonight' ? 'Done for tonight' : 'Done',
  };
}

/* ---------- on Today ---------- */
/** the quest the day of the slip, the sunrise the next day */
export function rkActive(days: Days, st: Settings | null, tk: DayKey): (RekindleState & { phase: 'day' | 'sun' }) | null {
  if (!st) return null;
  const full = rkFullDays(days);
  const yk = addDays(tk, -1);
  const t = full[tk] ? rkOf(days, tk, st) : null;
  if (t) return { phase: 'day', ...t };
  const y = full[yk] ? rkOf(days, yk, st) : null;
  if (y) return { phase: 'sun', ...y };
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
  const base = { flames, why: null, missions: [] as Mission[], care: [] as string[], sunrise: false, quote: null, line: !!op };
  if (r.phase === 'day') {
    return {
      ...base,
      kind: 'day',
      icon: 'flame',
      h: op ? 'Your ' + op.run + '-day run is on the line' : 'Rekindle quest',
      p: lit + ' of ' + flames.length + ' lit · ends tomorrow night',
      why: op
        ? 'Finish ' + (flames.length === 4 ? 'all four' : 'all three') + ' missions and your run keeps going. The slip stays in your log either way.'
        : null,
      missions: rkMissions(r, st, { where: 'today', deep: !!(op && op.deep), hour }),
      care: slipCare(st),
    };
  }
  if (!r.m3) {
    const more = op && op.deep && !r.m4 ? ' and one deeper mission' : '';
    return {
      ...base,
      kind: 'sun',
      line: false,
      icon: 'sunrise',
      h: 'Day 1 of your comeback',
      p: op ? 'Finish your sunrise check' + more + ' to keep your ' + op.run + '-day run going.' : 'Your sunrise check is ready. About two minutes.',
      sunrise: true,
      missions: op && (!r.m1 || (op.deep && !r.m4)) ? rkMissions(r, st, { where: 'today', deep: op.deep, left: true, hour }) : [],
    };
  }
  if (op) {
    return {
      ...base,
      kind: 'almost',
      icon: 'flame',
      h: 'Almost there',
      p: lit + ' of ' + flames.length + ' lit. Finish the rest by tonight to keep your ' + op.run + '-day run going.',
      missions: rkMissions(r, st, { where: 'today', deep: op.deep, left: true, hour }),
    };
  }
  const pl = r.ev.rk && r.ev.rk.pl;
  return {
    ...base,
    kind: 'done',
    line: false,
    icon: r.n === 3 || saved ? 'flame' : 'sunrise',
    h: saved ? 'Run saved' : r.n === 3 ? 'Rekindled' : r.n + ' of 3 lit',
    p: saved
      ? 'Your run is ' + plural(L.cur, 'day') + ' and still going. The gold mark on your calendar shows where you came back.'
      : r.n === 3
        ? 'All three missions done. Your fire is back to full.'
        : 'You came back. That is the real skill.',
    quote: pl ? { when: srWhen(r.ev.trigger, st), then: lowerFirst(pl) } : null,
  };
}

/* ---------- the sunrise check ---------- */
/** the steps: hello, last night's screens (when not answered and the phone was not put away), what came before, the plan */
export function srSteps(days: Days, r: RekindleState): string[] {
  const d = days[r.k];
  const so = d && d.checkin ? d.checkin.so : null;
  return ['hi'].concat(!r.m2 && so == null ? ['so'] : [], ['before', 'plan']);
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
  const sub = saved
    ? 'Your run is ' + plural(L.cur, 'day') + ' and still going.' + (n === 3 ? ' The Rekindled badge is yours too.' : '')
    : op
      ? 'Finish the rest by tonight and your ' + op.run + '-day run keeps going.'
      : run0
        ? 'Phone away was missed that night, so the run starts again. Every flame you lit still counts, and your longest run stays.'
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
