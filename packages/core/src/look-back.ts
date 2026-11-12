/* What it gave, and what it cost (Becoming free, step 2, docs/plan.md; the owner, November 11, 2026: "the next morning, in the
   sunrise check, two taps"). Right after a slip, the danger is giving up, not guilt (Shiffman 1996, Kirchner 2012), so Rekindle
   asks nothing deeper than what was going on. The honest look comes the day after, from a little distance ("Looking back at
   last night"), when it can teach: what the slip gave, one tap, and what it cost, one tap. It is about the slip, never the person.

   When: the log day after the slip, at least an hour after it, from 5 AM until 10 PM, never in the hard hours or the
   wind-down (dayFeelQuiet), and not on a day with a slip of its own (that one has its own Rekindle). Not for a slip told the next
   morning ("It happened", the morning set: no time, mn), which gets no ceremony, and not for someone who slips most days (step
   down, or slips on most days of the last week, roughPatch): for them the look comes once a week, in the Sunday review ("The
   morning, not the moment", docs/plan.md, the owner, November 11, 2026). Only the latest slip of
   the day before is asked about, and the app shows the card once (it keeps which slip it showed, on the device). The answers
   live on the slip itself (gv, cs; core.js normEvent), go with the day through sync, earn nothing, and feed the pattern
   (patLookBack) and the Sunday review (storyLookBack). Checked by test/look-back.test.ts. */
import { addDays, evMs, eventsOf, roughPatch, sortedEvents } from './legacy/core.js';
import { dayFeelQuiet } from './day-feel';
import { patchEvent } from './mutate';
import { plural } from './view';
import type { DayEvent, DayKey, Days, Settings } from './types';

export type SlipGave = 'relief' | 'sleep' | 'escape' | 'low' | 'nothing';
export type SlipCost = 'time' | 'sleep' | 'trust' | 'feel';
/** what it gave: the words on the answer, and the same inside a sentence */
export const SLIP_GAVE: [SlipGave, string, string][] = [
  ['relief', 'Relief', 'relief'],
  ['sleep', 'Sleep', 'sleep'],
  ['escape', 'Escape', 'escape'],
  ['low', 'A break from feeling low', 'a break from feeling low'],
  ['nothing', 'Nothing really', 'nothing really'],
];
/** what it cost. "time" is the part of the day it took, named by the slip's hour (lookBackCosts) */
export const SLIP_COST: [SlipCost, string, string][] = [
  ['time', 'The evening', 'the evening'],
  ['sleep', 'Sleep', 'sleep'],
  ['trust', 'Trust', 'trust'],
  ['feel', 'The way I feel now', 'the way you feel now'],
];
export const isSlipGave = (x: unknown): x is SlipGave => SLIP_GAVE.some((g) => g[0] === x);
export const isSlipCost = (x: unknown): x is SlipCost => SLIP_COST.some((g) => g[0] === x);

/** never asked within this many hours of the slip */
export const LOOK_MIN_HOURS = 1;
/** asked from this hour of the clock... */
export const LOOK_FROM_HOUR = 5;
/** ...until this one (10 PM): never at night */
export const LOOK_UNTIL_HOUR = 22;

/** the part of the day a slip at `time` took: a slip late at night or in the evening took the evening */
function partOfDay(time: string | null | undefined, roll: number): 'morning' | 'afternoon' | 'evening' | null {
  if (!time || !/^\d\d:\d\d$/.test(time)) return null;
  const h = +time.slice(0, 2);
  if (h < roll || h >= 17) return 'evening';
  return h < 12 ? 'morning' : 'afternoon';
}
/** "last night" for an evening slip, "yesterday" for one earlier in the day */
export const lookBackWhen = (ev: Pick<DayEvent, 'time'>, roll: number) => (partOfDay(ev.time, roll) === 'evening' ? 'last night' : 'yesterday');
/** the two questions, said from a little distance */
export const lookBackQ = (ev: Pick<DayEvent, 'time'>, roll: number) => {
  const w = lookBackWhen(ev, roll);
  return { gave: 'Looking back at ' + w + ', what did it give you?', cost: 'And what did it cost?' };
};
/** the cost answers for this slip: "The evening", "The morning" or "The afternoon", by its hour */
export function lookBackCosts(ev: Pick<DayEvent, 'time'>, roll: number): [SlipCost, string, string][] {
  const p = partOfDay(ev.time, roll) || 'evening';
  return SLIP_COST.map((c) => (c[0] === 'time' ? ['time', 'The ' + p, 'the ' + p] : c));
}

export interface LookBack {
  /** the slip day */
  k: DayKey;
  ev: DayEvent;
  q: { gave: string; cost: string };
  costs: [SlipCost, string, string][];
}
/** the slip to look back at now, or null. Asked once (the app keeps the slip it showed); see the top of this file for when. */
export function lookBackDue(days: Days, st: Settings | null, tk: DayKey, now: number): LookBack | null {
  if (!st) return null;
  const hour = new Date(now).getHours();
  if (hour < LOOK_FROM_HOUR || hour >= LOOK_UNTIL_HOUR) return null;
  if ((days[tk]?.events || []).some((e) => e.outcome === 'slipped')) return null;
  const k = addDays(tk, -1);
  const slips = sortedEvents(days[k], st.rollover).filter((e) => e.outcome === 'slipped');
  const ev = slips[slips.length - 1];
  if (!ev || ev.gv || ev.cs) return null;
  if (!ev.time || (ev as DayEvent & { mn?: true }).mn) return null;
  if (st.cleanMode === 'step' || roughPatch(days, st, tk)) return null;
  if (now - evMs(k, ev.time, st.rollover) < LOOK_MIN_HOURS * 3600_000) return null;
  if (dayFeelQuiet(days, st, tk, now)) return null;
  return { k, ev, q: lookBackQ(ev, st.rollover), costs: lookBackCosts(ev, st.rollover) };
}

/** the slip with one answer written: what it gave (gv) or what it cost (cs). Any other value leaves the log as it is. */
export function lookBackSet(days: Days, k: DayKey, evId: string, a: { gv: SlipGave } | { cs: SlipCost }, now = Date.now()): Days {
  if ('gv' in a ? !isSlipGave(a.gv) : !isSlipCost(a.cs)) return days;
  if (!(days[k]?.events || []).some((e) => e.id === evId && e.outcome === 'slipped')) return days;
  return patchEvent(days, k, evId, a, now);
}

/** the line once both are answered: what it gave and what it cost, side by side, and why seeing them helps */
export function lookBackSay(gv: SlipGave | null | undefined, cs: SlipCost | null | undefined, ev: Pick<DayEvent, 'time'>, roll: number): string {
  const g = SLIP_GAVE.find((x) => x[0] === gv);
  const c = lookBackCosts(ev, roll).find((x) => x[0] === cs);
  if (!g && !c) return 'Thank you for looking back at it.';
  const gave = !g ? '' : gv === 'nothing' ? 'It gave little' : 'It gave ' + g[2];
  const cost = c ? (gave ? ', and it cost ' : 'It cost ') + c[2] : '';
  return gave + cost + '. Seeing it clearly is how the next one gets easier.';
}

/* ---------- what the answers add up to ---------- */
export interface LookTally {
  /** slips with an answer */
  n: number;
  gave: { id: SlipGave; t: string; n: number }[];
  cost: { id: SlipCost; t: string; n: number }[];
}
/** every answer from `from` (a day) through tk, most first: slips are few, so the pattern reads the whole log */
export function lookBackTally(days: Days, tk: DayKey, from?: DayKey): LookTally {
  const ev = (eventsOf(days, from) as (DayEvent & { key: DayKey })[]).filter((e) => e.key <= tk && e.outcome === 'slipped' && (e.gv || e.cs));
  const count = <I extends string>(list: [I, string, string][], pick: (e: DayEvent) => I | undefined) =>
    list
      .map(([id, , t]) => ({ id, t, n: ev.filter((e) => pick(e) === id).length }))
      .filter((x) => x.n > 0)
      .sort((a, b) => b.n - a.n);
  return { n: ev.length, gave: count(SLIP_GAVE, (e) => e.gv), cost: count(SLIP_COST, (e) => e.cs) };
}
const ofN = (x: { n: number }, of: number) => (of > 1 ? ' (' + x.n + ' of ' + of + ')' : '');
/** the Pattern card: what slips gave and what they cost, once one is answered. null before. */
export function patLookBack(days: Days, tk: DayKey): (LookTally & { head: string; line: string }) | null {
  const t = lookBackTally(days, tk);
  if (!t.n) return null;
  const g = t.gave[0];
  const c = t.cost[0];
  const head = c ? 'It cost ' + (c.id === 'time' ? 'the time it took' : c.t) : g!.id === 'nothing' ? 'It gave little' : 'It gave ' + g!.t;
  const gaveN = t.gave.reduce((a, x) => a + x.n, 0);
  const costN = t.cost.reduce((a, x) => a + x.n, 0);
  const line =
    'Looking back on ' +
    plural(t.n, 'slip') +
    ': ' +
    [
      g ? (g.id === 'nothing' ? 'most gave nothing really' + ofN(g, gaveN) : 'most often it gave ' + g.t + ofN(g, gaveN)) : '',
      c ? 'it cost ' + (c.id === 'time' ? 'the time it took' : c.t) + ofN(c, costN) : '',
    ]
      .filter(Boolean)
      .join(', and ') +
    '.';
  return { ...t, head, line };
}
/** the Sunday review, beside the urges ridden out: what the week's slips gave and cost, from the answers. null without one. */
export function storyLookBack(days: Days, sun: DayKey, tk: DayKey, rode: number): string | null {
  const t = lookBackTally(days, sun < tk ? sun : tk, addDays(sun, -6));
  if (!t.n) return null;
  const g = t.gave[0];
  const c = t.cost[0];
  const one = t.n === 1;
  const parts = [
    g ? (g.id === 'nothing' ? (one ? 'it gave little' : 'they gave little') : (one ? 'it gave ' : 'they gave ') + g.t) : '',
    c ? (g ? 'cost ' : one ? 'it cost ' : 'they cost ') + (c.id === 'time' ? 'the time it took' : c.t) : '',
  ].filter(Boolean);
  const said = 'Looking back, ' + parts.join(' and ') + '.';
  return rode ? said + ' And you rode out ' + plural(rode, 'urge') + '.' : said;
}
