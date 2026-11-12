/* Proof where it counts ("Becoming free", step 1, docs/plan.md; the owner chose it on November 11, 2026). Identity follows
   behavior: a person comes to believe they are someone who can by watching themselves do it. So the record of what they have
   done (the counts under "Who you are becoming", miles.ts) is shown at the three moments that decide who they think they are:
   Today's hero, the first breath of an SOS, and the page after an urge ridden out. Every line is a fact from the log, said as
   who the person is, never a score, never a slip count, never a number of days in a run. Every count only goes up. */
import { addDays, eventsOf, gameCompute, runLedger } from './legacy/core.js';
import { rkComebackCount } from './rekindle';
import { firstMorning, freeNights, morningsSet, nightTold } from './morning-set';
import { hardHeld, riskWindow } from './risk';
import type { DayKey, Days, Reviews, Settings } from './types';

const times = (n: number, one: string, many: string) => n + ' ' + (n === 1 ? one : many);
const num = (v: unknown) => (typeof v === 'number' ? v : 0);
/** the days since 1970 for a log day, so the hero's line turns over once a day */
const dayNo = (k: DayKey) => Math.round(Date.parse(k + 'T12:00:00Z') / 86400e3);

/** The effort record ("The morning, not the moment", step 3, docs/plan.md, approved November 11, 2026). People who slip most
    days rarely open SOS, so urges ridden out stays at 0 and the hero would have nothing to say. These counts come from the morning
    set (built by "Daybook: The morning set", which owns how they are stored; the shape is agreed in the shared notes,
    proof-effort-shape.md). Every one is a count of effort, never of slips. All may be 0. */
export interface EffortCounts {
  /** mornings the person set up the night, ever (only goes up) */
  mornings: number;
  /** of the last 7 mornings, today included, how many were set */
  mornings7: number;
  /** nights the night lock held (the wait was not opened), ever (only goes up) */
  lockHeld: number;
  /** of the last 7 nights, how many the morning tap called free of it */
  free7: number;
}

/** the effort record from the morning set (core morning-set.ts): mornings set ever and in the last 7, and the last 7 nights the
    morning tap called free (night k is told on k + 1, so the last night is tk - 1). Nights the lock held come from the night wait
    (Screen Time), which is not built yet: 0 until it is. Null while there is nothing in it. */
export function effortCounts(days: Days, tk: DayKey): EffortCounts | null {
  const first = firstMorning(days, tk);
  const e: EffortCounts = {
    mornings: first ? morningsSet(days, first, tk) : 0,
    mornings7: morningsSet(days, addDays(tk, -6), tk),
    lockHeld: 0,
    /* on the morning after "It happened", the free nights wait a day: "Free 1 of the last 7" would read as a score of the
       others, and the hours after a slip are for coming back (CLAUDE.md). The mornings set lead instead */
    free7: nightTold(days, addDays(tk, -1)) === 'slip' ? 0 : freeNights(days, addDays(tk, -7), addDays(tk, -1)).free,
  };
  return e.mornings || e.mornings7 || e.free7 ? e : null;
}

/** the effort lines, strongest first. No "in a row": a run that breaks on one skipped morning is the all-or-nothing count
    CLAUDE.md rules out, so the window is the last 7 and the totals only go up */
export function effortProofs(e: EffortCounts | null | undefined): string[] {
  if (!e) return [];
  const n = (v: number) => (Number.isFinite(v) && v > 0 ? Math.floor(v) : 0);
  const m = n(e.mornings);
  const m7 = Math.min(7, n(e.mornings7));
  const held = n(e.lockHeld);
  const free7 = Math.min(7, n(e.free7));
  return [
    free7 ? 'Free ' + free7 + ' of the last 7 nights' : '',
    held ? 'Your lock held ' + times(held, 'night', 'nights') : '',
    m7 >= 3 ? m7 + ' of the last 7 mornings set' : m ? times(m, 'morning', 'mornings') + ' set' : '',
  ].filter(Boolean);
}

/** every short proof the hero can show today, in a fixed order: each once its count is there. Never the longest run: the number
    on the left of the hero already shows the best (core heroNumber). The effort record comes first, when there is one, so the
    line fills for someone who never opens SOS. */
export function heroProofs(days: Days, st: Settings, reviews: Reviews, tk: DayKey, effort?: EffortCounts | null): string[] {
  const S = gameCompute(days, st, reviews, tk).S;
  const rode = num(S.rode);
  const lessons = num(S.lessons);
  const checkins = num(S.checkins);
  const comebacks = rkComebackCount(days, st, tk);
  const held = hardHeld(days);
  const free = runLedger(days, st, tk, 'strict', true).clean;
  return [
    ...effortProofs(effort),
    rode ? times(rode, 'urge', 'urges') + ' ridden out' : '',
    free >= 2 ? free + ' days free of it' : '',
    comebacks ? times(comebacks, 'comeback', 'comebacks') : '',
    held ? 'Hard hours held ' + times(held, 'time', 'times') : '',
    lessons ? times(lessons, 'lesson', 'lessons') + ' learned' : '',
    checkins ? times(checkins, 'honest check-in', 'honest check-ins') : '',
  ].filter(Boolean);
}

/** the one proof line in Today's hero, under the level, in place of the points to the next level: picked fresh each day from
    what the person has done. Null before there is anything to show (the level stands alone). */
export function heroProof(days: Days, st: Settings, reviews: Reviews, tk: DayKey, effort?: EffortCounts | null): string | null {
  const all = heroProofs(days, st, reviews, tk, effort);
  return all.length ? all[dayNo(tk) % all.length] : null;
}

/** the urges ridden out up to log day tk */
const ridden = (days: Days, tk: DayKey) => eventsOf(days).filter((e) => e.outcome === 'rode' && e.key <= tk).length;

/** the small line over the first breath of an SOS: how many times this person has already ridden one out. Null when they
    never have (a first SOS has nothing to prove yet, so it shows nothing). Never a slip and never days. */
export function sosProof(days: Days, tk: DayKey): string | null {
  const n = ridden(days, tk);
  if (!n) return null;
  return n === 1 ? 'You have ridden this out before.' : 'You have ridden this out ' + n + ' times.';
}

/** the counts worth naming on the page after a ride: the fifth, the tenth, and so on */
const MARKS: Record<number, string> = { 5: 'Five', 10: 'Ten', 25: 'Twenty-five', 50: 'Fifty', 100: 'A hundred' };
const AFTER = ['Hours', 'A day', 'Two days', 'Three days'];
/** how many log days a slip can be behind a ride for the ride to be a comeback */
export const PROOF_AFTER_SLIP = 3;

export type RodeKind = 'first' | 'comeback' | 'mark' | 'hard' | 'plain';
/** the headline of the page after an urge ridden out (components/rode-out.tsx): what this one proved, from the record. The ride is
    already in days. In order: the first ever, one in the days after a slip, a round count (the fifth, the tenth...), one inside
    the hours that are usually hardest, or simply "You rode it out." */
export function rodeHeadline(days: Days, st: Settings, key: DayKey, id: string): { kind: RodeKind; h: string } {
  const ev = (days[key]?.events || []).find((e) => e.id === id) || null;
  const n = ridden(days, key);
  if (n <= 1) return { kind: 'first', h: 'You rode it out. Now you know you can.' };
  const hm = (t: unknown) => (typeof t === 'string' && /^\d\d:\d\d$/.test(t) ? t : null);
  const at = hm(ev?.time);
  const slip = eventsOf(days, addDays(key, -PROOF_AFTER_SLIP))
    .filter((e) => e.outcome === 'slipped' && e.key <= key)
    .filter((e) => e.key < key || !at || !hm(e.time) || hm(e.time)! < at)
    .pop();
  if (slip) {
    let d = 0;
    while (d < PROOF_AFTER_SLIP && addDays(slip.key, d) < key) d++;
    return { kind: 'comeback', h: AFTER[d] + ' after a slip, and you rode it out. That is a comeback.' };
  }
  if (MARKS[n]) return { kind: 'mark', h: MARKS[n] + ' ridden out. This is who you are now.' };
  const win = at ? riskWindow(days, st, key) : null;
  if (win && at) {
    const h = +at.slice(0, 2);
    if (h === win.start || h === (win.start + 1) % 24) return { kind: 'hard', h: 'In your hardest hours, you rode it out.' };
  }
  return { kind: 'plain', h: 'You rode it out.' };
}
