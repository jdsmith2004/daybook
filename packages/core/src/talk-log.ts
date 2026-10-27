/* Talk it through (talk.ts): saving a talk-through in the day's play record, and looking back on it. What Today shows of
   one (talkDueNow), and the plan that waits quietly under SOS until its moment has passed (talkPlanNow). A plan made after
   a slip, for next time, has its moment the next time that hour comes round, so "Did your plan hold?" waits until then. */
import { addDays, blankP, clockOf } from './legacy/core.js';
import { addEvent, changeDay, withDay } from './mutate';
import { riskAt, riskWindow } from './risk';
import { normTalk, normTalks, talkById, talkClock, talkDue, talkPlanLine, talksOf, talkUntilLine, type Talk, type TalkAfter, type TalkHard } from './talk';
import type { DayKey, Days, Settings } from './types';

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

/** the look back. Choosing something else counts as a calm move. Going ahead puts an honest slip in the log, unless
    one is there already from after the talk-through: on tk at the time it is now when the look back is on the same log
    day, and otherwise on the talk-through's own day with no time (it happened then, and when is not known), so a later
    day that had no slip is never marked as one. */
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
        p.tt = normTalks(p.tt).map((t) => (t.id === id ? normTalk(talk) || t : t));
        if (!after.went) p.c = Math.min(50, p.c + 1);
        d.p = p;
      },
      now,
    ),
  );
  if (after.went) {
    const since = clockOf(talk.t);
    const between: DayKey[] = [];
    for (let k = x.k; k <= tk && between.length < 8; k = addDays(k, 1)) between.push(k);
    if (between.indexOf(tk) < 0) between.push(tk);
    const logged = between.some((k) => (out[k]?.events || []).some((e) => e.outcome === 'slipped' && (k !== x.k || !e.time || e.time >= since)));
    const same = tk <= x.k;
    if (!logged)
      out = addEvent(
        out,
        same ? tk : x.k,
        'slipped',
        same ? clockOf(now) : null,
        { note: 'Talked it through first, and went ahead with eyes open.' },
        now,
      ).days;
  }
  return out;
}

/** the hard hours around now (from three days back to tomorrow), as times, for talkDue */
export function talkHardNear(days: Days, st: Settings, tk: DayKey): TalkHard {
  const out: TalkHard = [];
  for (let i = -3; i <= 1; i++) {
    const k = addDays(tk, i);
    const win = riskWindow(days, st, k);
    if (!win) continue;
    const a = riskAt(k, win.start, st.rollover);
    out.push([a, a + 2 * 3600000]);
  }
  return out;
}
const HOUR = 3600000;
const DAY = 24 * HOUR;
/** a plan made after a slip, for next time (Rekindle: "When I feel ... , I will ..."): it has no time of its own, because its
    moment is the next time the slip's hour comes round */
export const talkForNext = (t: Talk): boolean => t.p === 'change' && !!t.fw && t.at == null;
/** when a changed plan's moment is: its time, the next day for a plan made after a slip, or when it was talked through
    ("right now") */
export const talkMomentAt = (t: Talk): number => t.at ?? (talkForNext(t) ? t.t + DAY : t.t);

/** talkDue with the person's hard hours: what Today shows. A plan for next time is asked about only after its moment has
    come round and passed (the morning after the next night, for a slip late at night), never the morning after the slip. */
export function talkDueNow(days: Days, st: Settings | null, tk: DayKey, now: number) {
  /* the hard hours only move a change plan's look back, so they are worked out only when one is waiting */
  const waiting = talksOf(days).some((x) => x.talk.p === 'change' && !x.talk.a && now - x.talk.t < 5 * DAY);
  const hard = st && waiting ? talkHardNear(days, st, tk) : [];
  /* a plan for next time is seen by talkDue with its moment as its time; what Today gets back is the plan as it was saved */
  let moved: Days | null = null;
  for (const { k, talk } of talksOf(days)) {
    if (!talkForNext(talk) || talk.a) continue;
    moved = moved || { ...days };
    const p = moved[k]!.p!;
    moved[k] = { ...moved[k]!, p: { ...p, tt: normTalks(p.tt).map((x) => (x.id === talk.id ? { ...x, at: talkMomentAt(x) } : x)) } };
  }
  const d = talkDue(moved || days, now, hard);
  if (!d || !moved) return d;
  const real = talkById(days, d.talk.id);
  return real ? { ...d, talk: real.talk } : d;
}

/** what waits quietly on Today under SOS: a changed plan until two hours after its moment, or a decide-later until its time.
    head: a few words; line: the plan in the person's own terms. Null when nothing waits. */
export function talkPlanNow(
  days: Days,
  st: Settings | null,
  tk: DayKey,
  now: number,
): { id: string; due: 'plan' | 'waiting'; head: string; line: string } | null {
  const d = talkDueNow(days, st, tk, now);
  if (!d) return null;
  const t = d.talk;
  if (d.due === 'waiting') return { id: t.id, due: 'waiting', head: 'You decide at ' + talkClock(t.at!) + '.', line: talkUntilLine(t) };
  if (d.due !== 'plan' || now >= talkMomentAt(t) + 2 * HOUR) return null;
  return { id: t.id, due: 'plan', head: talkForNext(t) ? 'Your plan for next time' : 'Your plan', line: talkPlanLine(t) };
}
