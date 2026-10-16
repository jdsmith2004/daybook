/* Changes to the log, as pure functions. Each follows the legacy store exactly (saveDay, addEvent, patchEvent, removeEvent,
   addOption, saveReview in legacy/index.html): the same clean-up, the same rule that an empty day is removed, and a change
   time that always moves forward, which is what sync uses to decide which change wins. */
import { cleanOptLabel, DIDS, normDay, OPT_KEEP, OPT_MAX, TRIGGERS } from './legacy/core.js';
import { changeSettings, nextU } from './actions';
import type { Day, DayEvent, DayKey, Days, Outcome, Review, Reviews, Settings } from './types';

/** a day after a change, or null when nothing is left in it (the day is then removed, and sync removes it everywhere) */
export function changeDay(prev: Day | undefined | null, key: DayKey, fn: (d: Day) => void, now = Date.now()): Day | null {
  const cur: Day = prev ? (JSON.parse(JSON.stringify(prev)) as Day) : { d: key, events: [], checkin: null, p: null, u: 0 };
  if (!('p' in cur)) (cur as Day).p = null;
  fn(cur);
  const u = nextU(prev, now);
  const out = normDay(cur, key);
  /* a check-in with nothing in it (for example after un-answering the one morning question) is dropped */
  const c = out.checkin;
  if (c && !c.done && c.m == null && c.c == null && c.e == null && c.s == null && c.h == null && !c.so && !c.ro && !c.n) out.checkin = null;
  out.u = u;
  if (!out.events.length && !out.checkin && !out.p) return null;
  return out;
}

/** puts a changed day into the log (or takes it out when it is empty) */
export function withDay(days: Days, key: DayKey, day: Day | null): Days {
  const next = { ...days };
  if (day) next[key] = day;
  else delete next[key];
  return next;
}

let seq = 0;
/** a new entry id, like the legacy newId: the time, and a little randomness */
export function makeId(now = Date.now()): string {
  seq = (seq + 1) % 1296;
  return now.toString(36) + Math.random().toString(36).slice(2, 4) + seq.toString(36).padStart(2, '0');
}

export function addEvent(
  days: Days,
  date: DayKey,
  outcome: Outcome,
  time: string | null,
  extra: Partial<DayEvent> = {},
  now = Date.now(),
): { days: Days; id: string } {
  const id = extra.id || makeId(now);
  const day = changeDay(
    days[date],
    date,
    (d) => {
      d.events.push({ id, time: time || null, outcome, trigger: null, paused: null, did: null, recovered: false, note: '', ...extra });
    },
    now,
  );
  return { days: withDay(days, date, day), id };
}

export function patchEvent(days: Days, date: DayKey, id: string, patch: Partial<DayEvent>, now = Date.now()): Days {
  const day = changeDay(
    days[date],
    date,
    (d) => {
      const e = d.events.find((x) => x.id === id);
      if (e) Object.assign(e, patch);
    },
    now,
  );
  return withDay(days, date, day);
}

export function removeEvent(days: Days, date: DayKey, id: string, now = Date.now()): Days {
  const day = changeDay(days[date], date, (d) => void (d.events = d.events.filter((x) => x.id !== id)), now);
  return withDay(days, date, day);
}

/** moves an entry to another day (when its time is changed past the new-day hour, or its date is changed) */
export function moveEvent(days: Days, from: DayKey, to: DayKey, id: string, patch: Partial<DayEvent> = {}, now = Date.now()): Days {
  const ev = days[from]?.events.find((x) => x.id === id);
  if (!ev) return days;
  if (from === to) return patchEvent(days, from, id, patch, now);
  let next = removeEvent(days, from, id, now);
  const day = changeDay(next[to], to, (d) => void d.events.push({ ...ev, ...patch }), now);
  next = withDay(next, to, day);
  return next;
}

/** an answer of your own for "what set it off" or "what did you do". Gives back its id (the same words reuse an answer, a removed
    one comes back), or null when the list is full. */
export function addOption(
  st: Settings,
  kind: 'trig' | 'did',
  label: string,
  now = Date.now(),
): { st: Settings; id: string | null } {
  label = cleanOptLabel(label);
  if (!label) return { st, id: null };
  const low = label.toLowerCase();
  const base = kind === 'did' ? DIDS : TRIGGERS;
  const b = base.find((x) => x[1].toLowerCase() === low);
  if (b) return { st, id: b[0] };
  const cur = (st.opts && st.opts[kind]) || [];
  const m = cur.find((x) => x.t.toLowerCase() === low);
  if (m && !m.off) return { st, id: m.id };
  if (cur.filter((x) => !x.off).length >= OPT_MAX) return { st, id: null };
  const id = m ? m.id : 'u_' + Math.random().toString(36).slice(2, 8) + now.toString(36).slice(-3);
  const next = changeSettings(
    st,
    (s) => {
      const o = s.opts || (s.opts = { trig: [], did: [] });
      const list = o[kind] || (o[kind] = []);
      const x = list.find((y) => y.id === id);
      if (x) {
        delete x.off;
        return;
      }
      while (list.length >= OPT_KEEP) {
        const i = list.findIndex((y) => y.off);
        if (i < 0) break;
        list.splice(i, 1);
      }
      list.push({ id, t: label });
    },
    now,
  );
  return { st: next, id };
}

/** removes one of your own answers. If an entry used it, it is only hidden, so that entry keeps its words. */
export function removeOption(st: Settings, days: Days, kind: 'trig' | 'did', id: string, now = Date.now()): Settings {
  const used = Object.keys(days).some((k) =>
    (days[k]?.events || []).some((e) => e.trigger === id || (Array.isArray(e.did) && e.did.indexOf(id) >= 0)),
  );
  return changeSettings(
    st,
    (s) => {
      const list = s.opts && s.opts[kind];
      if (!list) return;
      const i = list.findIndex((y) => y.id === id);
      if (i < 0) return;
      if (used) list[i].off = true;
      else list.splice(i, 1);
    },
    now,
  );
}

export function changeReview(reviews: Reviews, k: number, fn: (r: Review) => void, now = Date.now()): Reviews {
  const id = 'w' + k;
  const prev = reviews[id];
  const cur: Review = prev ? JSON.parse(JSON.stringify(prev)) : { k: id, a: { hard: '', helped: '', change: '', proud: '' }, u: 0 };
  fn(cur);
  cur.u = nextU(prev, now);
  return { ...reviews, [id]: cur };
}
