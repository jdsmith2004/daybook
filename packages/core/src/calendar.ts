/* The month calendar in Journal, and the summary of one day. The calendar colors each day by how it went: no slip, a
   slip (one slip in the gentle count, or a slip that kept the run, has its own mark), a day that was only logged, or
   nothing logged. The months go back to where the log starts. A tap on a day opens its summary: how it went, what
   happened (each entry with its time, what set it off and what helped), the check-in at a glance, and the rest of the
   day (tools used, lessons read, a talk-through, phone away, hard hours held). Checked by test/calendar.test.ts. */
import { awayGapAt, awayGaps, awaySlipDay } from './away';
import { addDays, dayPoints, fmtDate, LESSONS, runLedger, sortedEvents, statusOf, sumDay } from './legacy/core.js';
import { logStart } from './log-start';
import { urSosLines, urTool } from './sos';
import { eventRow, plural } from './view';
import type { DayEvent, DayKey, Days, Settings } from './types';

/** ok: no slip. one: one slip, and the gentle count still counts it. saved: a slip the run came through (a save). open: a
    slip the run can still come through. slip, logged, none, before (the log had not started), ahead (still to come). */
export type CalKind = 'ok' | 'one' | 'saved' | 'open' | 'slip' | 'logged' | 'none' | 'before' | 'ahead' | 'away';
export interface CalDay {
  k: DayKey;
  /** the day of the month */
  d: number;
  kind: CalKind;
  today: boolean;
  slips: number;
  rode: number;
}
export interface CalMonth {
  /** "2026-10" */
  ym: string;
  /** "October 2026" */
  title: string;
  /** blank cells before the 1st (0 is Sunday) */
  lead: number;
  days: CalDay[];
  prev: string | null;
  next: string | null;
  sum: { noSlip: number; slips: number; rode: number; logged: number };
  /** the gaps away that touch this month, each as one line: "Oct 6 to 15 · away · 3 slips" */
  gaps: { from: DayKey; to: DayKey; n: number | null; line: string }[];
}

/** "Oct 6 to 15", "Sep 28 to Oct 3", or one day "Oct 6" */
export function awaySpan(from: DayKey, to: DayKey): string {
  const d = (k: DayKey) => fmtDate(k, { month: 'short', day: 'numeric' });
  if (from === to) return d(from);
  return from.slice(0, 7) === to.slice(0, 7) ? d(from) + ' to ' + Number(to.slice(8)) : d(from) + ' to ' + d(to);
}
/** a gap away as one line (away.ts): its days, and the slips the person said they had, or that it is not known yet */
export function awayLine(g: { from: DayKey; to: DayKey; n: number | null }): string {
  return awaySpan(g.from, g.to) + ' · away · ' + (g.n == null ? 'not known yet' : g.n === 0 ? 'no slips' : plural(g.n, 'slip'));
}

const ymOf = (k: DayKey) => k.slice(0, 7);
const shiftYm = (ym: string, n: number) => {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
};
/** where the log starts: the start date, or an earlier day with something logged */
export const calFirst = logStart;

/** one month, day by day. ym defaults to this month; a month outside the log is moved inside it. */
export function calMonth(days: Days, st: Settings, tk: DayKey, ym?: string | null): CalMonth {
  const first = calFirst(days, st);
  const lo = ymOf(first < tk ? first : tk);
  const hi = ymOf(tk);
  const m = ym && /^\d{4}-\d{2}$/.test(ym) ? (ym < lo ? lo : ym > hi ? hi : ym) : hi;
  const [y, mo] = m.split('-').map(Number);
  const n = new Date(y, mo, 0).getDate();
  const L = runLedger(days, st, tk);
  const gentle = st.cleanMode === 'gentle';
  const sum = { noSlip: 0, slips: 0, rode: 0, logged: 0 };
  const out: CalDay[] = [];
  for (let i = 1; i <= n; i++) {
    const k = m + '-' + String(i).padStart(2, '0');
    const d = days[k];
    const s = sumDay(d);
    let kind: CalKind;
    if (k > tk) kind = 'ahead';
    else if (k < first) kind = 'before';
    else {
      const status = statusOf(k, d, st, tk, days);
      kind =
        status === 'slip'
          ? gentle && s.slipped === 1
            ? 'one'
            : L && L.kind[k] === 'saved'
              ? 'saved'
              : L && L.kind[k] === 'open'
                ? 'open'
                : 'slip'
          : status === 'clean'
            ? 'ok'
            : status === 'tracked' || status === 'events'
              ? 'logged'
              : status === 'unknown'
                ? 'away'
                : 'none';
      if (kind === 'ok') sum.noSlip++;
      /* a gap answered: its slips and its no-slip days count with the rest */
      if (kind === 'away' && awaySlipDay(days, st, k, tk)) sum.slips++;
      else if (kind === 'away' && awayGapAt(days, st, k, tk)?.n != null) sum.noSlip++;
      sum.slips += s.slipped;
      sum.rode += s.rode;
      if (s.n || s.checked) sum.logged++;
    }
    out.push({ k, d: i, kind, today: k === tk, slips: s.slipped, rode: s.rode });
  }
  return {
    ym: m,
    title: new Date(y, mo - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    lead: new Date(y, mo - 1, 1).getDay(),
    days: out,
    prev: m > lo ? shiftYm(m, -1) : null,
    next: m < hi ? shiftYm(m, 1) : null,
    sum,
    gaps: awayGaps(days, st, tk)
      .filter((g) => g.to >= m + '-01' && g.from <= m + '-31' && g.to >= (st.day1 || g.to))
      .map((g) => {
        const from = st.day1 && g.from < st.day1 ? st.day1 : g.from;
        return { from, to: g.to, n: g.n, line: awayLine({ from, to: g.to, n: g.n }) };
      }),
  };
}

/* ---------- one day ---------- */
export interface DaySummary {
  kind: CalKind;
  /** "No slip", "1 slip, logged honestly", "No slip so far" */
  head: string;
  rode: number;
  slips: number;
  pts: number;
  events: { id: string; outcome: DayEvent['outcome']; time: string; what: string; meta: string; sos: string[]; note: string }[];
  /** the check-in, when one was saved */
  ci: {
    md: number | null;
    u: number | null;
    m: number | null;
    c: number | null;
    e: number | null;
    s: number | null;
    h: number | null;
    so: 'Y' | 'N' | null;
    ro: 'Y' | 'N' | null;
    n: string;
  } | null;
  /** the rest of the day, in a few words each, with an icon */
  more: { ic: string; t: string }[];
  /** when the phone was put away that night (HH:MM) */
  po: string | null;
}
export function daySummary(days: Days, st: Settings, key: DayKey, tk: DayKey): DaySummary {
  const d = days[key];
  const s = sumDay(d);
  const cal = calMonth(days, st, tk, ymOf(key)).days.find((x) => x.k === key);
  const kind = cal ? cal.kind : 'none';
  const head =
    kind === 'ok'
      ? key === tk
        ? 'No slip so far'
        : 'No slip'
      : kind === 'one' || kind === 'saved' || kind === 'open' || kind === 'slip'
        ? plural(s.slipped, 'slip') + ', logged honestly'
        : kind === 'logged'
          ? 'Logged'
          : kind === 'ahead'
            ? 'Still to come'
            : kind === 'away'
              ? (() => {
                  const g = awayGapAt(days, st, key, tk);
                  return g ? awayLine({ from: st.day1 && g.from < st.day1 ? st.day1 : g.from, to: g.to, n: g.n }) : 'You were away';
                })()
              : 'Nothing logged';
  const events = sortedEvents(d, st.rollover).map((e) => {
    const r = eventRow(e, st);
    return { id: e.id, outcome: e.outcome, time: r.time, what: r.what, meta: r.meta, sos: urSosLines(e), note: (e.note || '').trim() };
  });
  const c = d && d.checkin && d.checkin.done ? d.checkin : null;
  const p = d && d.p;
  const more: { ic: string; t: string }[] = [];
  if (p) {
    const tools = p.tl.map((id) => urTool(id)?.name).filter((x): x is string => !!x);
    if (tools.length) more.push({ ic: 'wind', t: 'Tools: ' + tools.join(', ') });
    const L = LESSONS as unknown as { id: string; title: string }[];
    const read = p.ls.map((id) => L.find((l) => l.id === id)?.title).filter((x): x is string => !!x);
    if (read.length) more.push({ ic: 'book', t: 'Read: ' + read.join(', ') });
    /* a short plan made ahead of the hard hours had no slip in mind: it reads as a plan */
    const talks = (p.tt || []).filter((t) => !t.pr).length;
    const plans = (p.tt || []).length - talks;
    if (talks) more.push({ ic: 'chat', t: talks === 1 ? 'Talked it through first' : 'Talked it through ' + talks + ' times' });
    if (plans) more.push({ ic: 'compass', t: 'Made a plan for the hard hours' });
    if (p.hw != null) more.push({ ic: 'shield', t: 'Held your hard hours' });
    if (p.po) more.push({ ic: 'phone', t: 'Phone away at night' });
    if (p.wd) more.push({ ic: 'moon', t: 'Wound down before bed' });
    if (p.r) more.push({ ic: 'heart', t: 'Reached out to someone' });
  }
  return {
    kind,
    head,
    rode: s.rode,
    slips: s.slipped,
    pts: d ? dayPoints(days, key, st).total : 0,
    events,
    ci: c ? { md: c.md ?? null, u: c.u ?? null, m: c.m, c: c.c, e: c.e, s: c.s, h: c.h, so: c.so, ro: c.ro, n: (c.n || '').trim() } : null,
    more,
    po: (p && p.po) || null,
  };
}

/** "Fri, Oct 16" for a day key (for the calendar's labels) */
export const calLabel = (k: DayKey) => fmtDate(k, { weekday: 'short', month: 'short', day: 'numeric' });
/** the day before and after, inside the log and not past today */
export function calNeighbors(days: Days, st: Settings, key: DayKey, tk: DayKey): { prev: DayKey | null; next: DayKey | null } {
  const first = calFirst(days, st);
  const prev = addDays(key, -1);
  const next = addDays(key, 1);
  return { prev: prev >= first ? prev : null, next: next <= tk ? next : null };
}
