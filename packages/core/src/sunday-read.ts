/* The Sunday review fits the week the person had. Every week is read from the log as one kind (a clean week, a quiet one,
   one slip, the first slip after a long stretch, a few, most days, every day), with what sets it apart (a first week,
   better or harder than last week, many urges ridden out). The seven days screen names it in plain numbers ("4 of 5 days
   had a slip"), and the review ends with one step for next week, drawn from the person's own pattern: their hard hours or
   what set the slips off, and the tool that worked.

   Hope first, and honest: a hard week is named, never waved off ("one slip is fine" is only said when there was one), and
   never called a failure or a reset. What was earned stays, and the push is one clear thing to do, not guilt. Checked by
   test/sunday-read.test.ts. */
import { addDays, evMs, slipMoments } from './legacy/core.js';
import { logStart } from './log-start';
import { SLIP_TRIG_WORDS, type PatWhen } from './pattern';
import { urTool } from './sos';
import type { SunWeek } from './sunday';
import { plural } from './view';
import type { DayKey, Days, Settings } from './types';

export type WeekKind = 'quiet' | 'clean' | 'after' | 'one' | 'few' | 'most' | 'all';
export interface WeekStep {
  /** an if-then plan, as the extras keep it: "it gets to 10 PM", "put my phone in another room" */
  w?: string;
  t: string;
  /** the step in one sentence: "When it gets to 10 PM, put your phone in another room." */
  line: string;
  /** what the log saw, in plain numbers, one fact a line */
  why: string[];
  /** what it changes, for the goals that fit (sunGoals) */
  c: string | null;
}
export interface WeekRead {
  kind: WeekKind;
  /** days that count, and the days of them with a slip */
  days: number;
  slipDays: number;
  /** a first week (nothing before it on the chart) */
  first: boolean;
  /** slip days, compared with last week, when there was one */
  vs: 'better' | 'same' | 'worse' | null;
  /** the days since the slip before this week's first (or since the log began), when this week has a slip */
  gap: number | null;
  /** what happened, in plain numbers, and what held */
  says: string;
  held: string;
  /** the last screen: its title, and the one step */
  title: string;
  step: WeekStep;
}

/* the moments a plan can be for, said the way an if-then plan says them */
export const WHEN_TRIG: Record<string, string> = {
  late: 'I am in bed late with my phone',
  lonely: 'I feel lonely or low',
  bored: 'I am bored and on my own',
  stress: 'I feel stressed',
  tired: 'I am tired',
  scroll: 'I catch myself scrolling',
};
/* what to do instead, for each moment */
const THEN_TRIG: Record<string, string> = {
  late: 'put my phone in another room',
  scroll: 'put my phone in another room',
  tired: 'go to bed and leave my phone outside',
  stress: 'go for a short walk',
  bored: 'go for a short walk',
};
const CHANGE_TRIG: Record<string, string> = {
  late: 'trig:late',
  scroll: 'trig:scroll',
  tired: 'trig:tired',
  stress: 'trig:stress',
  bored: 'trig:bored',
  lonely: 'trig:lonely',
};
/* a plan in the person's words ("I am", "my phone"), said to them ("you are", "your phone") */
const you = (t: string) =>
  t
    .replace(/\bI am\b/g, 'you are')
    .replace(/\bI\b/g, 'you')
    .replace(/\bmyself\b/g, 'yourself')
    .replace(/\bmy\b/g, 'your');
const fmtH = (h: number) => (h % 12 || 12) + (h < 12 ? ' AM' : ' PM');
const between = (h: number) => {
  const e = (h + 2) % 24;
  return 'between ' + (h < 12 === e < 12 && e !== 0 ? String(h % 12 || 12) : fmtH(h)) + ' and ' + (e === 0 ? 'midnight' : fmtH(e));
};
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** how many days of the week have anything in the log: an entry, a check-in, or something done (a lesson, the phone away) */
function loggedDays(days: Days, st: Settings, sun: DayKey, tk: DayKey): number {
  const from = logStart(days, st);
  let n = 0;
  for (let k = addDays(sun, -6); k <= sun && k <= tk; k = addDays(k, 1)) {
    if (k < from) continue;
    const d = days[k];
    if (!d) continue;
    const p = d.p;
    if (d.events.length || d.checkin?.done || (p && (p.ls.length || p.lv.length || p.po || p.wd || p.r))) n++;
  }
  return n;
}

/** the step for next week: when (the hard hours, what set the slips off, the weekend), and then (the tool that worked, or
    the move that fits the moment), with what the log saw */
export function weekStep(days: Days, st: Settings, sun: DayKey, tk: DayKey, w: SunWeek, when: PatWhen, quiet: boolean): WeekStep {
  if (quiet)
    return {
      t: 'Check in each night, even on a quiet day',
      line: 'Check in each night, even on a quiet day.',
      why: ['It takes a few seconds, and next Sunday has a truer week to show you.'],
      c: 'checkin',
    };
  const ev = [];
  for (let k = addDays(sun, -6); k <= sun && k <= tk; k = addDays(k, 1)) for (const e of days[k]?.events || []) ev.push({ ...e, key: k });
  const slips = ev.filter((e) => e.outcome === 'slipped');
  const why: string[] = [];
  let wh: string | null = null;
  let then: string | null = null;
  let c: string | null = null;
  let late = false;

  /* when: the hard hours, if this week's slips (or, on a week with none, its urges) fell in them */
  const hard = [when.hard.weekdays, when.hard.weekends].filter((x): x is NonNullable<typeof x> => !!x);
  const inWin = (h: number, s: number) => h === s || h === (s + 1) % 24;
  const base = slips.length ? slips : ev;
  const timed = base.filter((e) => e.time && /^\d\d:\d\d$/.test(e.time));
  const win = hard.map((x) => ({ x, n: timed.filter((e) => inWin(+e.time!.slice(0, 2), x.start)).length })).sort((a, b) => b.n - a.n)[0];
  if (win && win.n && win.n * 2 >= timed.length) {
    wh = 'it gets to ' + fmtH(win.x.start);
    late = win.x.start >= 20 || win.x.start < 4;
    why.push(
      slips.length
        ? (win.n === slips.length
            ? win.n === 1
              ? 'Your slip this week came '
              : 'All ' + win.n + ' slips this week came '
            : win.n + ' of ' + slips.length + ' slips this week came ') +
            between(win.x.start) +
            '.'
        : (win.n === timed.length
            ? win.n === 1
              ? 'Your urge this week came '
              : 'All ' + win.n + ' urges this week came '
            : win.n + ' of ' + timed.length + ' urges this week came ') +
            between(win.x.start) +
            '.',
    );
    c = late ? 'late' : null;
  }
  /* or what set the slips off */
  if (!wh && slips.length) {
    const tr: Record<string, number> = {};
    slips.forEach((e) => e.trigger && WHEN_TRIG[e.trigger] && (tr[e.trigger] = (tr[e.trigger] || 0) + 1));
    const top = Object.keys(tr).sort((a, b) => tr[b] - tr[a])[0];
    if (top && tr[top] * 2 >= slips.length) {
      wh = WHEN_TRIG[top];
      then = THEN_TRIG[top] || null;
      if (top === 'lonely') {
        const nm = String(st.safePerson || '')
          .trim()
          .split(/\s+/)[0];
        then = nm ? 'text ' + nm : 'text someone I trust';
      }
      c = CHANGE_TRIG[top];
      late = top === 'late';
      why.push(
        SLIP_TRIG_WORDS[top] +
          ' came before ' +
          (tr[top] === slips.length ? (slips.length === 1 ? 'your slip' : 'all ' + slips.length + ' slips') : tr[top] + ' of ' + slips.length + ' slips') +
          ' this week.',
      );
    }
  }
  /* or the weekend */
  if (!wh && w.weekendSlips >= 2 && w.weekendSlips * 2 >= w.slipped) {
    wh = 'the weekend comes';
    then = 'plan my day the night before';
    c = 'weekend';
    why.push(w.weekendSlips + ' of ' + w.slipped + ' slips this week came on the weekend.');
  }

  /* then: on late nights with slips and the phone mostly in reach, the phone in another room first (fewer fights to win);
     otherwise the tool that worked, when it worked more than once or every time; then the move that fits the moment */
  const tool = Object.keys(w.tools)
    .filter((id) => w.tools[id].w > 0 && (w.tools[id].w >= 2 || w.tools[id].w === w.tools[id].n))
    .sort((a, b) => w.tools[b].w - w.tools[a].w || w.tools[a].n - w.tools[b].n)[0];
  const lonely = wh === WHEN_TRIG.lonely;
  if (late && slips.length && w.phone < 2) then = 'put my phone in another room';
  else if (tool && !lonely) {
    const { w: won, n } = w.tools[tool];
    const name = urTool(tool)!.name;
    then = 'open SOS and start ' + name;
    why.push(
      name +
        (won === n
          ? n === 1
            ? ' worked the time you used it.'
            : n === 2
              ? ' worked both times you used it.'
              : ' worked all ' + n + ' times you used it.'
          : ' worked ' + won + ' of ' + n + ' times.'),
    );
  }
  if (!then && late) then = 'put my phone in another room';
  if (!then) then = 'open SOS and breathe';
  if (!wh) wh = 'an urge hits';
  if (!why.length) why.push('A slow breath with a long breath out calms the body in a few minutes, and the urge passes with it.');
  return { w: wh, t: then, line: 'When ' + you(wh) + ', ' + you(then) + '.', why: why.slice(0, 2), c };
}

/** the week, read from the log: its kind, what to say about it, and the one step for next week */
export function weekRead(
  days: Days,
  st: Settings,
  sun: DayKey,
  tk: DayKey,
  w: SunWeek,
  weeks: { sun: DayKey; days: number; noSlip: number }[],
  when: PatWhen,
): WeekRead {
  const D = w.days;
  const S = D - w.noSlip;
  const R = w.rode;
  const first = weeks.length < 2;
  const logged = loggedDays(days, st, sun, tk);
  const quiet = !S && !w.slipped && !R && D >= 4 && logged <= 2;

  /* last week, by the share of days with a slip */
  const p = weeks.length >= 2 ? weeks[weeks.length - 2] : null;
  const pS = p && p.sun === addDays(sun, -7) && p.days >= 3 ? p.days - p.noSlip : null;
  const vs: WeekRead['vs'] = pS == null || !D ? null : S * p!.days < pS * D ? 'better' : S * p!.days > pS * D ? 'worse' : 'same';

  /* the run before this week's first slip, in whole days */
  let gap: number | null = null;
  if (S) {
    const at = (k: DayKey) => evMs(k, String(st.rollover).padStart(2, '0') + ':00', st.rollover);
    const a = at(addDays(sun, -6));
    const ms = slipMoments(days, st);
    const firstIn = ms.find((t) => t >= a);
    const before = ms.filter((t) => t < a).pop();
    if (firstIn != null) gap = Math.floor((firstIn - (before ?? at(logStart(days, st)))) / 86400000);
  }

  const kind: WeekKind = quiet
    ? 'quiet'
    : !S
      ? 'clean'
      : S <= 2 && gap != null && gap >= 7 && S * 2 < D
        ? 'after'
        : S === 1
          ? 'one'
          : S === D
            ? 'all'
            : S * 2 >= D
              ? 'most'
              : 'few';

  const rodeLine = R ? 'you rode out ' + plural(R, 'urge') : '';
  let says = '';
  let held = '';
  switch (kind) {
    case 'quiet':
      says = 'No slips logged, and not much else.';
      held = logged ? logged + ' of ' + D + ' days have anything in the log.' : 'Nothing else is in the log this week.';
      break;
    case 'clean':
      says = D === 7 ? 'Not one slip all week.' : 'Not one slip in ' + plural(D, 'day') + '.';
      held = first
        ? 'Your first week, and it is clean.'
        : R >= 3
          ? cap(rodeLine) + ' to get here.'
          : vs === 'better'
            ? 'Last week had ' + plural(pS!, 'day') + ' with a slip.'
            : 'This is what free looks like, one day at a time.';
      break;
    case 'after':
      says = S + ' of ' + D + ' days had a slip, the first in ' + plural(gap!, 'day') + '.';
      held = 'Those ' + gap + ' days happened, and nothing takes them back.';
      break;
    case 'one':
      says = '1 of ' + D + ' days had a slip. The other ' + (D - 1) + ' did not.';
      held = first ? 'Your first week, logged honestly.' : R >= 3 ? cap(rodeLine) + ' too.' : 'One slip is one event, not the week.';
      break;
    case 'few':
      says = S + ' of ' + D + ' days had a slip, and ' + (D - S) + ' did not.';
      held =
        vs === 'better'
          ? 'Down from ' + pS + ' last week. That is the direction.'
          : vs === 'worse'
            ? 'Up from ' + pS + ' last week. Next week gets one clear change.'
            : R
              ? cap(rodeLine) + ' too.'
              : 'The pattern is in your log, and the next pages show it.';
      break;
    case 'most':
      says = S + ' of ' + D + ' days had a slip. A hard week.';
      held =
        vs === 'better'
          ? 'Still fewer than last week’s ' + pS + '. Keep going.'
          : R
            ? cap(rodeLine) + ' and logged every slip honestly. Next week can be different.'
            : 'You logged every slip honestly. Next week can be different.';
      break;
    case 'all':
      says = D === 7 ? 'Every day this week had a slip.' : 'All ' + D + ' days had a slip.';
      held = R
        ? 'And ' + rodeLine + '. That skill is real, and next week can be different.'
        : 'You opened Daybook and told the truth anyway. That is where change starts.';
      break;
  }
  if (first && (kind === 'few' || kind === 'most' || kind === 'all'))
    held = 'Your first week, logged honestly. Now you can see the pattern, and that is where change starts.';

  const title = kind === 'clean' ? 'Keep what worked' : kind === 'most' || kind === 'all' ? 'One thing to change' : 'One thing for next week';
  return { kind, days: D, slipDays: S, first, vs, gap, says, held, title, step: weekStep(days, st, sun, tk, w, when, quiet) };
}
