/* Talk it through (talk.ts): saving a talk-through in the day's play record, and looking back on it. */
import { blankP, clockOf } from './legacy/core.js';
import { addEvent, changeDay, withDay } from './mutate';
import { normTalk, normTalks, talkById, type Talk, type TalkAfter } from './talk';
import type { DayKey, Days } from './types';

/** save a talk-through on day k (a new one, or a change to one already there). A new one counts as a calm move. */
export function saveTalk(days: Days, k: DayKey, talk: Talk, now = Date.now()): Days {
  const clean = normTalk(talk);
  if (!clean) return days;
  const day = changeDay(
    days[k],
    k,
    (d) => {
      const p = d.p || blankP();
      const list = normTalks(p.tt);
      const i = list.findIndex((x) => x.id === clean.id);
      if (i < 0) {
        list.push(clean);
        p.c = Math.min(50, p.c + 1);
      } else list[i] = clean;
      p.tt = list;
      d.p = p;
    },
    now,
  );
  return withDay(days, k, day);
}

/** the look back. Choosing something else counts as a calm move. Going ahead puts an honest slip in the log on tk (the
    day it is now), unless one is there already from after the talk-through. */
export function lookBack(days: Days, id: string, after: Omit<TalkAfter, 't'>, tk: DayKey, now = Date.now()): Days {
  const x = talkById(days, id);
  if (!x || x.talk.a) return days;
  const talk: Talk = { ...x.talk, a: { ...after, t: now } };
  let out = withDay(
    days,
    x.k,
    changeDay(
      days[x.k],
      x.k,
      (d) => {
        const p = d.p || blankP();
        p.tt = normTalks(p.tt).map((t) => (t.id === id ? talk : t));
        if (!after.went) p.c = Math.min(50, p.c + 1);
        d.p = p;
      },
      now,
    ),
  );
  if (after.went) {
    const since = clockOf(talk.t);
    const logged = [x.k, tk].some((k) => (out[k]?.events || []).some((e) => e.outcome === 'slipped' && (k !== x.k || !e.time || e.time >= since)));
    if (!logged) out = addEvent(out, tk, 'slipped', clockOf(now), { note: 'Talked it through first, and went ahead with eyes open.' }, now).days;
  }
  return out;
}
