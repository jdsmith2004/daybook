/* The Journal: every day newest first, grouped by week; my numbers; what the charts show; and the weekly look back.
   Ported from the legacy daysBody, dayRow, numbersBlock, chartsBody and weekBody. Checked by test/journal.test.ts. */
import {
  addDays,
  allKeys,
  busiestWindow,
  computeMetrics,
  dayPoints,
  diffDays,
  eventsOf,
  fmtClock,
  fmtDate,
  fmtStretch,
  fmtStretchShort,
  minKey,
  one,
  pct,
  rangeLabel,
  runLedger,
  sortedEvents,
  STATUS_TXT,
  statusOf,
  stepView,
  sumDay,
  topTrigger,
  urRate,
  weekOf,
  weekStats,
  type RunLedger,
} from './legacy/core.js';
import { urStats } from './sos';
import { phaseLabel } from './view';
import { TOOLS } from './legacy/core.js';
import type { DayKey, Days, Settings } from './types';

/** one day in the list (legacy dayRow) */
export function dayRow(days: Days, st: Settings, key: DayKey, tk: DayKey, L: RunLedger) {
  const d = days[key];
  const s = sumDay(d);
  const rk = L && L.kind[key];
  const status = statusOf(key, d, st, tk);
  const evs = sortedEvents(d, st.rollover);
  const times =
    evs
      .slice(0, 4)
      .map((e) => (e.time ? fmtClock(e.time) : '?'))
      .join(' · ') + (evs.length > 4 ? ` +${evs.length - 4}` : '');
  const c = d && d.checkin && d.checkin.done ? d.checkin : null;
  const pill =
    status === 'slip'
      ? (s.slipped > 1 ? `Slipped ×${s.slipped}` : 'Slipped') + (rk === 'saved' ? ' · run saved' : rk === 'open' ? ' · run can keep going' : '')
      : status === 'clean' && key === tk
        ? 'No slip so far'
        : (STATUS_TXT as Record<string, string>)[status] || '';
  const rate = c
    ? (
        [
          ['Motivation', c.m],
          ['Connection', c.c],
          ['Energy', c.e],
          ['Stress', c.s],
        ] as [string, number | null][]
      )
        .filter((x) => x[1] != null)
        .map((x) => `${x[0]} ${x[1]}`)
        .join(' · ')
    : '';
  const pts = d ? dayPoints(days, key, st).total : 0;
  return {
    key,
    status,
    empty: status === 'clean' && !evs.length && !c,
    weekday: fmtDate(key, { weekday: 'short' }),
    date: fmtDate(key, { month: 'short', day: 'numeric' }),
    phase: phaseLabel(key, st),
    times: evs.length ? times : c ? 'No urges logged' : 'Nothing logged',
    rate,
    pill,
    pts,
  };
}

/** the days, newest first, in weeks: 28 at first, or all of them */
export function daysList(days: Days, st: Settings, tk: DayKey, all: boolean) {
  const ks = allKeys(days);
  let first = st.start;
  if (ks.length && ks[0] < first) first = ks[0];
  first = minKey(first, tk);
  const total = diffDays(tk, first) + 1;
  const limit = all ? total : Math.min(total, 28);
  const L = runLedger(days, st, tk);
  const weeks: { wk: number; title: string; count: string; rows: ReturnType<typeof dayRow>[] }[] = [];
  for (let i = 0; i < limit; i++) {
    const key = addDays(tk, -i);
    const wk = weekOf(key, st);
    if (!weeks.length || weeks[weeks.length - 1].wk !== wk) {
      const w = weekStats(days, st, wk);
      weeks.push({
        wk,
        title: wk < 0 ? 'Before my start date' : 'Week ' + (wk + 1) + ' · ' + rangeLabel(w.lo, w.hi),
        count: `${w.checkins} check-in${w.checkins === 1 ? '' : 's'} · ${w.events} ${w.events === 1 ? 'entry' : 'entries'}`,
        rows: [],
      });
    }
    weeks[weeks.length - 1].rows.push(dayRow(days, st, key, tk, L));
  }
  return { weeks, more: total - limit };
}

/** My numbers (legacy numbersBlock): four tiles, each a label, a big number and a line */
export function myNumbers(days: Days, st: Settings, tk: DayKey, nowMs: number) {
  const m = computeMetrics(days, st, tk) as unknown as Record<string, number | null>;
  const counting = !!st.day1 && tk >= st.day1;
  let dl = 0;
  allKeys(days).forEach((k) => {
    if (k > tk) return;
    const s = sumDay(days[k]);
    if (s.n || s.checked) dl++;
  });
  const n = (k: string) => m[k] as number;
  const streakSub = `${n('cur') > 0 ? 'Current run ' + n('cur') : 'Next run starts tomorrow'} · ${n('cleanDays')} ${st.cleanMode === 'gentle' ? 'good' : 'no-slip'} day${n('cleanDays') === 1 ? '' : 's'} in all`;
  const sv = counting && st.cleanMode === 'step' ? stepView(days, st, nowMs) : null;
  const third = sv
    ? { l: 'Best stretch', b: fmtStretchShort(sv.best), s: 'between slips' + (sv.usual != null ? '. Usual: about ' + fmtStretch(sv.usual) : '') }
    : counting
      ? { l: 'Longest run', b: String(n('longest')), s: streakSub }
      : { l: 'Days logged', b: String(dl), s: `of ${n('days')} day${n('days') === 1 ? '' : 's'} so far` };
  return [
    {
      l: 'Urges ridden out',
      b: String(n('rode')),
      s: n('urges') ? `${n('rode')} of ${n('urges')} urges. Paused 10 min ${pct(m.pauseRate)} of the time.` : 'Shows up after your first check-in',
    },
    { l: 'Check-ins done', b: String(n('checkins')), s: `of ${n('days')} day${n('days') === 1 ? '' : 's'} so far` },
    third,
    {
      l: 'Slips recovered fast',
      b: String(n('recovered')),
      s: n('slips') ? `${n('recovered')} of ${n('slips')} slips: a small step within the hour` : 'No slips logged yet',
    },
  ];
}

/** What I am noticing, under the charts */
export function noticing(days: Days, st: Settings, tk: DayKey, from: DayKey) {
  const m = computeMetrics(days, st, tk);
  const evs = eventsOf(days, from);
  const tt = topTrigger(evs, st.opts);
  const bw = busiestWindow(evs, st.rollover);
  return [
    ['Most common trigger', tt ? tt.t + ' (' + tt.n + ')' : '–'],
    ['Busiest stretch', bw ? bw.label : 'Needs 3 or more entries with a time'],
    [
      'First weekly review',
      m.checkins >= 7 ? 'Ready. Open Weeks in Journal.' : 7 - m.checkins + ' more check-in' + (7 - m.checkins === 1 ? '' : 's') + ' until my first review.',
    ],
  ] as [string, string][];
}

/** SOS: which tools help, most helpful first (legacy urWorksHtml) */
export function urWorks(days: Days, tk: DayKey) {
  const S = urStats(days, tk);
  return TOOLS.filter((t) => S.all[t.id] && S.all[t.id].n)
    .map((t) => ({ t, r: S.all[t.id] }))
    .sort((a, b) => urRate(b.r) - urRate(a.r) || b.r.n - a.r.n)
    .map((x) => ({ id: x.t.id, name: x.t.name, passed: x.r.w, not: x.r.n - x.r.w, n: x.r.n }));
}

/* ---------- the week ---------- */
/** one average tile: the number, and how it moved from last week */
export function avgTile(cur: number | null, prev: number | null | undefined) {
  const d = cur != null && prev != null ? cur - prev : null;
  const t = d == null ? '' : d > 0.05 ? '↑ ' + one(Math.abs(d)) : d < -0.05 ? '↓ ' + one(Math.abs(d)) : '→ same';
  return { v: one(cur), move: t ? t + ' vs last week' : '' };
}
export function weekView(days: Days, st: Settings, tk: DayKey, k: number) {
  const cw = Math.max(0, weekOf(tk, st));
  const wk = Math.min(Math.max(0, k), cw);
  const w = weekStats(days, st, wk);
  const pw = wk > 0 ? weekStats(days, st, wk - 1) : null;
  const keys: DayKey[] = [];
  for (let x = w.lo; x <= w.hi; x = addDays(x, 1)) keys.push(x);
  const tt = topTrigger(w.evs, st.opts);
  const bw = busiestWindow(w.evs, st.rollover);
  return {
    wk,
    cw,
    w,
    range: rangeLabel(w.lo, w.hi) + (wk === cw ? ' · this week' : ''),
    keys,
    avgs: (
      [
        ['Motivation', 'm'],
        ['Connection', 'c'],
        ['Energy', 'e'],
        ['Stress', 's'],
      ] as [string, 'm' | 'c' | 'e' | 's'][]
    ).map(([l, f]) => ({
      l,
      f,
      ...avgTile(w[f], pw && pw[f]),
      vals: keys.map((x) => {
        const c = days[x] && days[x].checkin;
        return c && typeof c[f] === 'number' ? (c[f] as number) : null;
      }),
    })),
    shows: [
      ['Most common trigger', tt ? tt.t + ' (' + tt.n + ')' : '–'],
      ['Busiest stretch', bw ? bw.label : 'Needs 3 or more entries with a time'],
    ] as [string, string][],
  };
}
