/* Proof where it counts ("Becoming free", step 1, docs/plan.md; the owner chose it on November 11, 2026). Identity follows
   behavior: a person comes to believe they are someone who can by watching themselves do it. So the record of what they have
   done (the counts under "Who you are becoming", miles.ts) is shown at the three moments that decide who they think they are:
   Today's hero, the first breath of an SOS, and the page after an urge ridden out. Every line is a fact from the log, said as
   who the person is, never a score, never a slip count, never a number of days in a run. Every count only goes up. */
import { addDays, eventsOf, gameCompute, runLedger } from './legacy/core.js';
import { rkComebackCount } from './rekindle';
import { hardHeld, riskWindow } from './risk';
import type { DayKey, Days, Reviews, Settings } from './types';

const times = (n: number, one: string, many: string) => n + ' ' + (n === 1 ? one : many);
const num = (v: unknown) => (typeof v === 'number' ? v : 0);
/** the days since 1970 for a log day, so the hero's line turns over once a day */
const dayNo = (k: DayKey) => Math.round(Date.parse(k + 'T12:00:00Z') / 86400e3);

/** every short proof the hero can show today, in a fixed order: each once its count is there. Never the longest run: the number
    on the left of the hero already shows the best (core heroNumber) */
export function heroProofs(days: Days, st: Settings, reviews: Reviews, tk: DayKey): string[] {
  const S = gameCompute(days, st, reviews, tk).S;
  const rode = num(S.rode);
  const lessons = num(S.lessons);
  const checkins = num(S.checkins);
  const comebacks = rkComebackCount(days, st, tk);
  const held = hardHeld(days);
  const free = runLedger(days, st, tk, 'strict', true).clean;
  return [
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
export function heroProof(days: Days, st: Settings, reviews: Reviews, tk: DayKey): string | null {
  const all = heroProofs(days, st, reviews, tk);
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
