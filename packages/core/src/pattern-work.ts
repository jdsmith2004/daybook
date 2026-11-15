/* The cards on Pattern fed by the work a person does every day, not by feelings (the owner, November 15, 2026: "we don't really
   have them log emotions as part of like anything ... focus the graphs more on like the metrics we have. Don't delete any graphs,
   but maybe we add more"). Three of them, each from something the app records with no extra question:
   - nights: each night as the morning after told it (“How was last night?”, morning-set.ts nightTold)
   - learn: the days a lesson was done (p.ls, or one read again, p.lv)
   - held: the hard hours held (p.hw, risk.ts), and the hour each started
   Each says a count that only adds up over the range, against the period before when there is one, and never a share a slip can
   drag down. A card whose whole log has nothing yet says how to fill it (PAT_FILL) instead of drawing an empty chart. */
import { fmtHour } from './legacy/core.js';
import { nightTold } from './morning-set';
import { colLabel, patChunks, type PatPeriod, type PatSay } from './pattern-cards';
import { plural } from './view';
import type { DayKey, Days } from './types';

/** one line for a card with nothing in the whole log yet: what to do so it fills, said plainly (never an empty chart alone) */
export const PAT_FILL: Record<string, string> = {
  apart: 'A week of days in the log, and this shows how you are doing.',
  ride: 'Log an urge you rode out, or a slip, and it lands here.',
  nights: 'Answer “How was last night?” in the morning, and each night lands here.',
  learn: 'Do a lesson on Learn, and each day you learn lands here.',
  held: 'When Daybook warns of a hard hour and you get through it, it lands here.',
  when: 'Log an urge or a slip with its time, and your hard hours show here.',
  what: 'Pick what set it off after you ride out an urge, and it shows here.',
  helps: 'Use a tool in SOS, and what helps you most shows here.',
  days: 'Do the check-in on a few days, and what is different on hard days shows here.',
  felt: 'Answer “How are you feeling today?” on Today, and your days show here.',
  named: 'Name a feeling in SOS or in the journal, and it shows here.',
};

const lessonOn = (days: Days, k: DayKey) => {
  const p = days[k]?.p;
  return !!p && ((p.ls || []).length > 0 || (p.lv || []).length > 0);
};
const heldOn = (days: Days, k: DayKey) => days[k]?.p?.hw != null;
const count = (keys: DayKey[] | null, f: (k: DayKey) => boolean) => (keys ? keys.filter(f).length : 0);
/** the period before, said only when it had some of the same, so a first month is not "up from 0" */
const against = (now: number, then: number | null, than: string): string => {
  if (then == null || then === 0) return '';
  if (now > then) return 'Up from ' + then + ' ' + than + '.';
  if (now === then) return 'The same as ' + than + '.';
  return '';
};
export interface PatWorkCol {
  from: DayKey;
  label: string;
  n: number;
  /** each day of the column, oldest first: whether it had one */
  on: boolean[];
}
const cols = (keys: DayKey[], tk: DayKey, f: (k: DayKey) => boolean): PatWorkCol[] =>
  patChunks(keys).map((c) => ({
    from: c[0],
    label: colLabel(c, tk),
    n: c.filter(f).length,
    on: c.map(f),
  }));

/* ---------- nights ---------- */
export type NightTold = 'free' | 'slip' | null;
export interface PatNights extends PatSay {
  /** each night of the range before tonight, oldest first, as the morning after told it */
  nights: { k: DayKey; n: NightTold }[];
  free: number;
  told: number;
}
/** the nights of the range as the mornings told them: tonight is not over, so it is left out */
export function patNights(days: Days, per: PatPeriod, tk: DayKey): PatNights {
  const nights = per.keys.filter((k) => k < tk).map((k) => ({ k, n: nightTold(days, k) }));
  const free = nights.filter((x) => x.n === 'free').length;
  const told = nights.filter((x) => x.n).length;
  const then = per.then ? per.then.filter((k) => nightTold(days, k) === 'free').length : null;
  if (!told) return { nights, free, told, head: 'No nights told', line: 'Each morning, “How was last night?” puts the night here.' };
  if (!free) return { nights, free, told, head: 'Told honestly', line: 'Every night you tell is part of the picture. Tonight can be the first free one.' };
  const up = against(free, then, per.than);
  const line = up || (free === told ? 'Every night you told was free.' : 'Free ' + free + ' of the ' + plural(told, 'night') + ' you told.');
  return { nights, free, told, head: plural(free, 'night') + ' free', line };
}
/** whether any morning in the whole log told a night */
export const anyNightTold = (days: Days): boolean => Object.keys(days).some((k) => nightTold(days, k) != null);

/* ---------- lessons ---------- */
export interface PatLearn extends PatSay {
  cols: PatWorkCol[];
  n: number;
}
/** the days a lesson was done, as columns of the range */
export function patLearn(days: Days, per: PatPeriod, tk: DayKey): PatLearn {
  const n = count(per.keys, (k) => lessonOn(days, k));
  const c = cols(per.keys, tk, (k) => lessonOn(days, k));
  if (!n) return { cols: c, n, head: 'No lessons ' + per.word, line: 'A lesson a day is the spine of the work. Today is a good day for one.' };
  const then = per.then ? count(per.then, (k) => lessonOn(days, k)) : null;
  const line =
    against(n, then, per.than) || (n === per.keys.length ? 'A lesson every day. That is how a new self is built.' : 'Each one is a day you put in the work.');
  return { cols: c, n, head: 'Lessons on ' + plural(n, 'day'), line };
}
export const anyLesson = (days: Days): boolean => Object.keys(days).some((k) => lessonOn(days, k));

/* ---------- hard hours held ---------- */
export interface PatHeld extends PatSay {
  /** the hour each held hard hour started, oldest first */
  hours: { k: DayKey; h: number }[];
  n: number;
}
/** the hard hours held in the range, and when they were */
export function patHeld(days: Days, per: PatPeriod): PatHeld {
  const hours = per.keys.filter((k) => heldOn(days, k)).map((k) => ({ k, h: days[k]!.p!.hw! }));
  const n = hours.length;
  if (!n) return { hours, n, head: 'None held ' + per.word, line: 'When Daybook warns of a hard hour, getting through it lands here.' };
  const then = per.then ? count(per.then, (k) => heldOn(days, k)) : null;
  /* the hour that came up most, once it is more than one */
  const by = new Map<number, number>();
  for (const x of hours) by.set(x.h, (by.get(x.h) || 0) + 1);
  const top = [...by.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0];
  const most = top && top[1] >= 2 ? 'Most of them started around ' + fmtHour(top[0]) + '.' : '';
  const line = [against(n, then, per.than), most].filter(Boolean).join(' ') || 'An hour that was hard for you, and you got through it.';
  return { hours, n, head: plural(n, 'hard hour') + ' held', line };
}
export const anyHeld = (days: Days): boolean => Object.keys(days).some((k) => heldOn(days, k));
