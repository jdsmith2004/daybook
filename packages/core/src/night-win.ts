/* The morning after a night SOS that was ridden out. The slip path has its sunrise check; a win at night had nothing, and its
   note for next time was asked at the end of the check-in, at 1:30 AM, while the urge was still fresh and the person should be
   going to sleep. Now the morning stop opens with one line ("Last night you rode one out at 1:30 AM."), and that is where
   "What helped?" and the note for next time are asked, once. The check-in does not ask it at night (winLater). Nothing new is
   stored: the line is read from the entry SOS saved, and the note is the plan's own note (settings.note). */
import { addDays, eventsOf, fmtClock, fmtDate, isTime, routineOn, UR_STR_NAME, urMinText } from './legacy/core.js';
import { urNight, urTool } from './sos';
import { plural } from './view';
import type { DayEvent, DayKey, Days, Settings } from './types';

/** the morning (log day) that looks back on a night entry on day k: the next day, or the same day for an hour after the day
    rolls over and before 5 AM. null when the entry is not at night (urNight: 10 PM to 5 AM). */
export function winMorning(k: DayKey, time: string | null | undefined, roll = 4): DayKey | null {
  if (!isTime(time)) return null;
  const h = +time.slice(0, 2);
  if (!urNight(h)) return null;
  return h < 5 && h >= roll ? k : addDays(k, 1);
}

/** an SOS ridden out at night, on day k: its note for next time waits for the morning stop, which asks what helped. Only when
    that stop will show (the morning is part of the routine, and it is not the very first morning); otherwise the end of the
    check-in asks, as before. */
export function winLater(st: Settings | null, k: DayKey, ev: Pick<Partial<DayEvent>, 'outcome' | 'time' | 'm'> | null): boolean {
  if (!st || !ev || ev.outcome !== 'rode' || typeof ev.m !== 'number') return false;
  const m = winMorning(k, ev.time, st.rollover ?? 4);
  return !!m && addDays(m, -1) >= st.start && routineOn(st, null, 'morning');
}

export interface NightWin {
  /** the log day and id of the last urge ridden out last night */
  k: DayKey;
  evId: string;
  /** how many were ridden out last night */
  n: number;
  /** "Last night · Tuesday" */
  eyebrow: string;
  /** "Last night you rode one out at 1:30 AM." */
  line: string;
  /** "Very strong at the start. It passed in 12 minutes." */
  sub: string;
  /** every urge ridden out so far, big in the middle */
  rode: number;
  /** the tools tried for it, the one that worked first (at most three), to answer "What helped?" */
  helped: { id: string; name: string; ic: string }[];
  /** no note for next time yet: ask for one */
  askNote: boolean;
  /** minutes it took, for the note's words */
  mins: number;
}

/** sorting the entries of one log day in the order they happened: the hours before the day rolls over come last */
const minOf = (t: string | null, roll: number) => {
  if (!isTime(t)) return -1;
  const m = +t.slice(0, 2) * 60 + +t.slice(3, 5);
  return +t.slice(0, 2) < roll ? m + 1440 : m;
};

/** last night's win, for the morning stop on day tk: an SOS ridden out between 10 PM and 5 AM, and no slip in those hours (a slip
    has the sunrise check). null when there is none. */
export function nightWin(days: Days, st: Settings, tk: DayKey): NightWin | null {
  const roll = st.rollover ?? 4;
  const night: (DayEvent & { key: DayKey })[] = [];
  for (const k of [addDays(tk, -1), tk]) for (const e of days[k]?.events || []) if (winMorning(k, e.time, roll) === tk) night.push({ ...e, key: k });
  if (night.some((e) => e.outcome === 'slipped')) return null;
  const won = night
    .filter((e) => e.outcome === 'rode' && typeof e.m === 'number')
    .sort((a, b) => (a.key === b.key ? minOf(a.time, roll) - minOf(b.time, roll) : a.key < b.key ? -1 : 1));
  if (!won.length) return null;
  const e = won[won.length - 1];
  const n = won.length;
  const at = fmtClock(e.time);
  const mins = e.m || 0;
  const strong = e.st && UR_STR_NAME[e.st] ? UR_STR_NAME[e.st] + ' at the start. ' : '';
  /* the tools tried, the one that worked first */
  const tr = Array.isArray(e.tr) ? e.tr : [];
  const ids = tr
    .filter((x) => x[1] === 'p')
    .concat(tr.filter((x) => x[1] !== 'p'))
    .map((x) => x[0])
    .filter((id, i, a) => a.indexOf(id) === i && !!urTool(id));
  return {
    k: e.key,
    evId: e.id,
    n,
    eyebrow: 'Last night · ' + fmtDate(addDays(tk, -1), { weekday: 'long' }),
    line: n === 1 ? 'Last night you rode one out at ' + at + '.' : 'Last night you rode out ' + plural(n, 'urge') + ', the last at ' + at + '.',
    sub: strong + 'It passed in ' + urMinText(mins) + '.',
    rode: eventsOf(days).filter((x) => x.outcome === 'rode').length,
    helped: ids.slice(0, 3).map((id) => {
      const t = urTool(id)!;
      return { id, name: t.name, ic: t.ic };
    }),
    askNote: !String(st.note || '').trim(),
    mins,
  };
}

/* what each tool did, in the person's own voice, for the note */
const HELPED: Record<string, string> = {
  breathe: 'Breathing slowly helped.',
  ground: '5-4-3-2-1 helped.',
  curious: 'Getting curious about it helped.',
  pause: 'The 10-minute pause helped.',
  thought: 'Naming the thought helped.',
  forward: 'Playing it forward helped.',
  move: 'Moving my body helped.',
  bed: 'Going to bed helped.',
  surprise: 'A calm move helped.',
  halt: 'Asking what I need helped.',
  message: 'Reaching a person helped.',
  reasons: 'Remembering my reasons helped.',
};
/** the note's first words, from what helped (or nothing picked): "Breathing slowly helped. It passed in 12 minutes. It will
    pass again." The person can change every word before saving it. */
export function winNote(w: Pick<NightWin, 'mins'>, id: string | null): string {
  const t = id ? urTool(id) : null;
  const first = id && t ? HELPED[id] || t.name + ' helped.' : '';
  return (first ? first + ' ' : '') + 'It passed in ' + urMinText(w.mins) + '. It will pass again.';
}
